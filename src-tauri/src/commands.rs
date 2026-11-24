use std::{
    collections::HashSet,
    env,
    fs,
    path::{Path, PathBuf},
    process::Command,
    sync::atomic::Ordering,
    time::{SystemTime, UNIX_EPOCH},
};
use tauri::{Manager, State};
use tauri_plugin_autostart::ManagerExt;

use crate::config::{
    default_app_config, normalize_config_triggers, normalize_trigger, AppConfig, ApplyResult,
    ProcessItem, RuntimeStatus,
};
use crate::generator::generate_ahk_script;
use crate::AppState;

// -----------------------------------------------------------------------------
// Path Resolution Helpers
// -----------------------------------------------------------------------------
fn portable_data_dir_for_executable(executable: &Path) -> Option<PathBuf> {
    let root = executable.parent()?;
    root.join("portable.flag").is_file().then(|| root.join("data"))
}

fn app_data_dir(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    if let Ok(executable) = env::current_exe() {
        if let Some(portable_dir) = portable_data_dir_for_executable(&executable) {
            fs::create_dir_all(&portable_dir).map_err(|e| e.to_string())?;
            return Ok(portable_dir);
        }
    }
    app.path().app_config_dir().map_err(|e| e.to_string())
}

pub fn config_file_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let dir = app_data_dir(app)?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir.join("config.json"))
}

pub fn runtime_dir_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let dir = app_data_dir(app)?.join("runtime");
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir)
}

pub fn autohotkey_exe_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let dev_path = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../vendor/autohotkey/AutoHotkey64.exe");
    if dev_path.exists() {
        return Ok(dev_path);
    }
    let release_path = app
        .path()
        .resource_dir()
        .map_err(|e| e.to_string())?
        .join("vendor/autohotkey/AutoHotkey64.exe");
    if release_path.exists() {
        return Ok(release_path);
    }
    Err("隨附的 AutoHotkey64.exe 不存在".into())
}

pub fn gesture_engine_template_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let dev_path = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../engine/GestureEngine.ahk");
    if dev_path.exists() {
        return Ok(dev_path);
    }
    let release_path = app
        .path()
        .resource_dir()
        .map_err(|e| e.to_string())?
        .join("engine/GestureEngine.ahk");
    if release_path.exists() {
        return Ok(release_path);
    }
    Err("隨附的 GestureEngine.ahk 不存在".into())
}

fn validate_enabled_binding_duplicates(config: &AppConfig) -> Result<(), String> {
    for target in &config.targets {
        let mut seen = HashSet::new();
        for binding in target.bindings.iter().filter(|binding| binding.enabled) {
            let trigger = normalize_trigger(binding.gesture.trigger.trim()).to_ascii_lowercase();
            let steps = binding
                .gesture
                .steps
                .iter()
                .map(|step| step.trim().to_ascii_uppercase())
                .collect::<Vec<_>>()
                .join(",");
            let signature = format!("{trigger}:{steps}");
            if !seen.insert(signature.clone()) {
                return Err(format!(
                    "無法套用設定：Scope「{}」含有重複啟用的 Trigger「{}」。請先停用或修改其中一筆規則。",
                    target.name, signature
                ));
            }
        }
    }
    Ok(())
}

fn stop_active_engine(state: &AppState) -> Result<(), String> {
    let mut active_engine = state
        .engine_process
        .lock()
        .map_err(|_| "無法取得手勢引擎行程控制權".to_string())?;
    let Some(mut process) = active_engine.take() else {
        return Ok(());
    };

    if process.try_wait().map_err(|error| error.to_string())?.is_none() {
        process
            .kill()
            .map_err(|error| format!("無法停止舊的手勢引擎: {error}"))?;
        process.wait().map_err(|error| error.to_string())?;
    }
    Ok(())
}

// -----------------------------------------------------------------------------
// IPC Commands
// -----------------------------------------------------------------------------
#[tauri::command]
pub fn load_config(app: tauri::AppHandle) -> Result<AppConfig, String> {
    let path = config_file_path(&app)?;
    if !path.exists() {
        return Ok(default_app_config());
    }
    let content = fs::read_to_string(path).map_err(|e| e.to_string())?;
    let mut config: AppConfig =
        serde_json::from_str(&content).map_err(|e| format!("解析設定檔失敗: {e}"))?;
    normalize_config_triggers(&mut config);

    Ok(config)
}

#[tauri::command]
pub fn save_config(app: tauri::AppHandle, config: AppConfig) -> Result<(), String> {
    let path = config_file_path(&app)?;
    let content = serde_json::to_string_pretty(&config).map_err(|e| e.to_string())?;
    fs::write(path, content).map_err(|e| e.to_string())
}

/// Runs AutoHotkey in validation mode and reports any syntax diagnostics.
fn validate_script(ahk_exe: &Path, script_path: &Path) -> Result<(), String> {
    let output = Command::new(ahk_exe)
        .arg("/ErrorStdOut")
        .arg("/validate")
        .arg(script_path)
        .output()
        .map_err(|e| format!("無法啟動 AutoHotkey 進行語法檢查: {e}"))?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    let stderr = String::from_utf8_lossy(&output.stderr);
    let diagnostics = format!("{}{}", stdout.trim(), stderr.trim());

    if output.status.success() && diagnostics.is_empty() {
        return Ok(());
    }
    Err(format!("產生的 AHK 腳本語法錯誤:\n{}", diagnostics))
}

#[tauri::command]
pub fn apply_config(
    app: tauri::AppHandle,
    state: State<'_, AppState>,
    config: AppConfig,
) -> Result<ApplyResult, String> {
    // 0. Validate enabled rules before writing any runtime or configuration files.
    validate_enabled_binding_duplicates(&config)?;

    // 1. Pre-flight check: ensure AutoHotkey executable exists
    let ahk_exe = autohotkey_exe_path(&app)?;
    if !ahk_exe.exists() {
        return Err(format!("找不到 AutoHotkey 執行檔: {}", ahk_exe.display()));
    }

    // 2. Save config to disk
    save_config(app.clone(), config.clone())?;

    // 3. Prepare paths
    let revision = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|e| e.to_string())?
        .as_millis() as u64;

    let runtime_dir = runtime_dir_path(&app)?;
    let script_path = runtime_dir.join("ActiveGestures.ahk");
    let target_engine_path = runtime_dir.join("GestureEngine.ahk");
    let source_engine_path = gesture_engine_template_path(&app)?;

    // Ensure GestureEngine.ahk is copied right next to ActiveGestures.ahk in runtime dir
    fs::copy(&source_engine_path, &target_engine_path).map_err(|e| e.to_string())?;

    // 4. Generate script
    let script_content = generate_ahk_script(&config, revision);
    fs::write(&script_path, script_content).map_err(|e| e.to_string())?;

    // 5. Verify syntax before applying
    validate_script(&ahk_exe, &script_path)?;

    // 6. Replace the previous engine only after the new script validates successfully.
    stop_active_engine(&state)?;
    let engine_process = Command::new(&ahk_exe)
        .current_dir(&runtime_dir)
        .arg(&script_path)
        .spawn()
        .map_err(|e| format!("啟動手勢引擎失敗: {e}"))?;
    *state
        .engine_process
        .lock()
        .map_err(|_| "無法記錄新的手勢引擎行程".to_string())? = Some(engine_process);

    Ok(ApplyResult {
        success: true,
        revision,
        msg: "手勢引擎已成功校驗並套用！".into(),
    })
}

#[tauri::command]
pub fn get_running_processes() -> Vec<ProcessItem> {
    let mut items = Vec::new();
    let mut seen = HashSet::new();

    let output = Command::new("tasklist")
        .args(["/fo", "csv", "/nh"])
        .output();

    if let Ok(out) = output {
        let text = String::from_utf8_lossy(&out.stdout);
        for line in text.lines() {
            let parts: Vec<&str> = line.split(',').collect();
            if let Some(first) = parts.first() {
                let exe = first.trim_matches('"').trim().to_string();
                let lower = exe.to_ascii_lowercase();
                if lower.ends_with(".exe") && !seen.contains(&lower) {
                    seen.insert(lower);
                    items.push(ProcessItem {
                        name: exe.clone(),
                        exe,
                    });
                }
            }
        }
    }
    items.sort_by(|a, b| a.exe.to_ascii_lowercase().cmp(&b.exe.to_ascii_lowercase()));
    items
}

#[tauri::command]
pub fn get_runtime_status(app: tauri::AppHandle) -> RuntimeStatus {
    match autohotkey_exe_path(&app) {
        Ok(_) => RuntimeStatus {
            state: "running".into(),
            applied_revision: None,
            msg: "AutoHotkey v2 隨附引擎就緒".into(),
        },
        Err(e) => RuntimeStatus {
            state: "error".into(),
            applied_revision: None,
            msg: e,
        },
    }
}

#[tauri::command]
pub fn autostart_enabled(app: tauri::AppHandle) -> Result<bool, String> {
    app.autolaunch().is_enabled().map_err(|error| error.to_string())
}

#[tauri::command]
pub fn set_autostart(app: tauri::AppHandle, enabled: bool) -> Result<(), String> {
    let manager = app.autolaunch();
    if enabled {
        manager.enable()
    } else {
        manager.disable()
    }
    .map_err(|error| error.to_string())
}

#[tauri::command]
pub fn is_engine_paused(state: State<'_, AppState>) -> bool {
    state.paused.load(Ordering::SeqCst)
}

#[tauri::command]
pub fn set_engine_paused(state: State<'_, AppState>, paused: bool) {
    state.paused.store(paused, Ordering::SeqCst);
}

#[cfg(test)]
mod tests {
    use super::{portable_data_dir_for_executable, validate_enabled_binding_duplicates};
    use crate::config::default_app_config;
    use std::{env, fs, time::{SystemTime, UNIX_EPOCH}};

    #[test]
    fn portable_marker_places_data_next_to_the_executable() {
        let timestamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("system clock should be after Unix epoch")
            .as_nanos();
        let root = env::temp_dir().join(format!("conductor-portable-test-{timestamp}"));
        fs::create_dir_all(&root).expect("test directory should be created");
        let executable = root.join("Conductor.exe");

        assert_eq!(portable_data_dir_for_executable(&executable), None);
        fs::write(root.join("portable.flag"), "").expect("portable marker should be created");
        assert_eq!(
            portable_data_dir_for_executable(&executable),
            Some(root.join("data"))
        );

        fs::remove_dir_all(root).expect("test directory should be removed");
    }

    #[test]
    fn allows_a_duplicate_gesture_when_one_binding_is_disabled() {
        let mut config = default_app_config();
        let target = config
            .targets
            .iter_mut()
            .find(|target| target.kind == "global")
            .unwrap();
        let mut duplicate = target.bindings[0].clone();
        duplicate.enabled = false;
        target.bindings.push(duplicate);

        assert!(validate_enabled_binding_duplicates(&config).is_ok());
    }

    #[test]
    fn rejects_two_enabled_duplicate_gestures_in_one_scope() {
        let mut config = default_app_config();
        let target = config
            .targets
            .iter_mut()
            .find(|target| target.kind == "global")
            .unwrap();
        target.bindings.push(target.bindings[0].clone());
        let target_name = target.name.clone();

        let error = validate_enabled_binding_duplicates(&config).unwrap_err();

        assert!(error.contains("重複啟用"));
        assert!(error.contains(&target_name));
    }

    #[test]
    fn normalizes_legacy_trigger_aliases_when_validating_duplicates() {
        let mut config = default_app_config();
        let target = config
            .targets
            .iter_mut()
            .find(|target| target.kind == "global")
            .unwrap();
        let mut duplicate = target.bindings[0].clone();
        duplicate.gesture.trigger = "RB".into();
        target.bindings.push(duplicate);

        assert!(validate_enabled_binding_duplicates(&config).is_err());
    }
}

#[tauri::command]
pub async fn export_config_dialog(content: String, default_file_name: String) -> Result<Option<String>, String> {
    let file = rfd::AsyncFileDialog::new()
        .set_file_name(&default_file_name)
        .add_filter("JSON 設定檔 (*.json)", &["json"])
        .save_file()
        .await;

    if let Some(handle) = file {
        let path = handle.path().to_path_buf();
        fs::write(&path, content).map_err(|e| e.to_string())?;
        Ok(Some(path.to_string_lossy().to_string()))
    } else {
        Ok(None)
    }
}
