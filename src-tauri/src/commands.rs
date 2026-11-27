#[cfg(windows)]
use std::os::windows::process::CommandExt;
use std::{
    collections::HashSet,
    env, fs,
    path::{Path, PathBuf},
    process::{Child, Command},
    sync::atomic::Ordering,
    time::{Duration, SystemTime, UNIX_EPOCH},
};

#[cfg(windows)]
const CREATE_NO_WINDOW: u32 = 0x08000000;

fn hide_console_window(cmd: &mut Command) {
    #[cfg(windows)]
    cmd.creation_flags(CREATE_NO_WINDOW);
}
use tauri::{Manager, State};
use tauri_plugin_autostart::ManagerExt;

use crate::config::{
    default_app_config, normalize_config_triggers, normalize_trigger, AppConfig, ApplyResult,
    ProcessItem, RuntimeStatus, CURRENT_CONFIG_VERSION,
};
use crate::generator::generate_ahk_script;
use crate::AppState;

// -----------------------------------------------------------------------------
// Path Resolution Helpers
// -----------------------------------------------------------------------------
fn portable_data_dir_for_executable(executable: &Path) -> Option<PathBuf> {
    let root = executable.parent()?;
    root.join("portable.flag")
        .is_file()
        .then(|| root.join("data"))
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

pub fn write_pause_flag(app: &tauri::AppHandle, paused: bool) -> Result<(), String> {
    let flag = runtime_dir_path(app)?.join("paused.flag");
    if paused {
        fs::write(&flag, b"1").map_err(|e| e.to_string())
    } else if flag.exists() {
        fs::remove_file(&flag).map_err(|e| e.to_string())
    } else {
        Ok(())
    }
}

pub fn autohotkey_exe_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let dev_path =
        PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../vendor/autohotkey/AutoHotkey64.exe");
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

fn screen_edge_slots(trigger: &str) -> u8 {
    match trigger {
        "EdgeTop" => 3,
        "EdgeTopLeftHalf" => 1,
        "EdgeTopRightHalf" => 2,
        "EdgeBottom" => 12,
        "EdgeBottomLeftHalf" => 4,
        "EdgeBottomRightHalf" => 8,
        "EdgeLeft" => 48,
        "EdgeLeftTopHalf" => 16,
        "EdgeLeftBottomHalf" => 32,
        "EdgeRight" => 192,
        "EdgeRightTopHalf" => 64,
        "EdgeRightBottomHalf" => 128,
        _ => 0,
    }
}

fn validate_enabled_binding_duplicates(config: &AppConfig) -> Result<(), String> {
    for target in config
        .targets
        .iter()
        .filter(|target| target.enabled && target.kind != "disabled")
    {
        let mut seen = HashSet::new();
        let mut occupied = 0u8;
        let mut half_occupied = 0u8;
        for binding in target.bindings.iter().filter(|binding| binding.enabled) {
            let mouse_trigger = normalize_trigger(binding.gesture.trigger.trim());
            let slots = screen_edge_slots(&mouse_trigger);
            if (if mouse_trigger.ends_with("Half") {
                occupied
            } else {
                half_occupied
            }) & slots
                != 0
            {
                return Err(format!("無法套用設定：Scope「{}」的螢幕邊緣「{}」已被其他啟用規則佔用。請先停用或修改衝突規則。", target.name, mouse_trigger));
            }
            occupied |= slots;
            if mouse_trigger.ends_with("Half") {
                half_occupied |= slots;
            }
            let normalized_steps = binding
                .gesture
                .steps
                .iter()
                .map(|step| step.trim().to_ascii_uppercase())
                .collect::<Vec<_>>();
            if !crate::config::supported_mouse_trigger(&mouse_trigger, &normalized_steps) {
                return Err(format!("Scope「{}」規則「{}」的滑鼠觸發不完整：左鍵或中鍵不能單獨使用，單獨右鍵需加入移動或滾輪操作。", target.name, binding.id));
            }
            let trigger = mouse_trigger.to_ascii_lowercase();
            let steps = normalized_steps.join(",");
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

pub(crate) fn stop_active_engine(state: &AppState) -> Result<(), String> {
    let mut active_engine = state
        .engine_process
        .lock()
        .map_err(|_| "無法取得手勢引擎行程控制權".to_string())?;
    let Some(process) = active_engine.as_mut() else {
        return Ok(());
    };

    if process
        .try_wait()
        .map_err(|error| error.to_string())?
        .is_none()
    {
        process
            .kill()
            .map_err(|error| format!("無法停止舊的手勢引擎: {error}"))?;
        process.wait().map_err(|error| error.to_string())?;
    }
    *active_engine = None;
    Ok(())
}

// -----------------------------------------------------------------------------
// Runtime File Swap Helpers
// -----------------------------------------------------------------------------
const RUNTIME_ENGINE_NAME: &str = "GestureEngine.ahk";
const RUNTIME_SCRIPT_NAME: &str = "ActiveGestures.ahk";

fn replace_file(prepared: &Path, target: &Path) -> Result<(), String> {
    fs::rename(prepared, target).map_err(|e| format!("無法替換 {}: {e}", target.display()))
}

fn deploy_runtime_pair(
    runtime_dir: &Path,
    source_engine: &Path,
    script_content: &str,
) -> Result<(), String> {
    let manifest = runtime_dir.join("rollback.json");
    if manifest.exists() {
        fs::remove_file(&manifest).map_err(|e| e.to_string())?;
    }
    let engine = runtime_dir.join(RUNTIME_ENGINE_NAME);
    let script = runtime_dir.join(RUNTIME_SCRIPT_NAME);
    let prepared_engine = runtime_dir.join("GestureEngine.ahk.new");
    let prepared_script = runtime_dir.join("ActiveGestures.ahk.new");

    for stale in [&prepared_engine, &prepared_script] {
        if stale.exists() {
            fs::remove_file(stale).map_err(|e| e.to_string())?;
        }
    }

    fs::copy(source_engine, &prepared_engine).map_err(|e| e.to_string())?;
    fs::write(&prepared_script, script_content).map_err(|e| e.to_string())?;

    let previous = [engine.exists(), script.exists()];
    for (current, backup) in [
        (&engine, runtime_dir.join("GestureEngine.ahk.bak")),
        (&script, runtime_dir.join("ActiveGestures.ahk.bak")),
    ] {
        if current.exists() {
            fs::copy(current, &backup).map_err(|e| e.to_string())?;
        }
    }
    fs::write(
        &manifest,
        serde_json::to_vec(&previous).map_err(|e| e.to_string())?,
    )
    .map_err(|e| e.to_string())?;

    replace_file(&prepared_engine, &engine)?;
    replace_file(&prepared_script, &script)
}

fn restore_runtime_pair(runtime_dir: &Path) -> Result<bool, String> {
    let manifest = runtime_dir.join("rollback.json");
    if !manifest.exists() {
        return Ok(false);
    }
    let previous: [bool; 2] =
        serde_json::from_slice(&fs::read(&manifest).map_err(|e| e.to_string())?)
            .map_err(|e| e.to_string())?;
    let files = [
        (RUNTIME_ENGINE_NAME, "GestureEngine.ahk.bak"),
        (RUNTIME_SCRIPT_NAME, "ActiveGestures.ahk.bak"),
    ];
    for (index, (_, backup)) in files.iter().enumerate() {
        if previous[index] && !runtime_dir.join(backup).is_file() {
            return Err(format!("回滾備份不完整：{backup}"));
        }
    }
    for (index, (name, backup_name)) in files.iter().enumerate() {
        let backup = runtime_dir.join(backup_name);
        if previous[index] {
            fs::copy(&backup, runtime_dir.join(name)).map_err(|e| e.to_string())?;
        } else if runtime_dir.join(name).exists() {
            fs::remove_file(runtime_dir.join(name)).map_err(|e| e.to_string())?;
        }
    }
    Ok(previous.iter().all(|exists| *exists))
}

fn start_engine(ahk_exe: &Path, runtime_dir: &Path, script_path: &Path) -> Result<Child, String> {
    let mut cmd = Command::new(ahk_exe);
    hide_console_window(&mut cmd);
    let mut process = cmd
        .current_dir(runtime_dir)
        .arg(script_path)
        .spawn()
        .map_err(|e| format!("啟動手勢引擎失敗: {e}"))?;

    // A successful spawn is not proof the script kept running; the engine can
    // exit immediately on a runtime error, so confirm it survives startup.
    std::thread::sleep(Duration::from_millis(400));
    match process.try_wait() {
        Ok(None) => Ok(process),
        Ok(Some(status)) => Err(format!("手勢引擎啟動後立即結束（{status}）")),
        Err(error) => {
            let _ = process.kill();
            let _ = process.wait();
            Err(format!("無法確認手勢引擎狀態: {error}"))
        }
    }
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

/// Parses and validates an imported backup without touching the persisted config.
#[tauri::command]
pub fn validate_imported_config(content: String) -> Result<AppConfig, String> {
    let value: serde_json::Value =
        serde_json::from_str(&content).map_err(|e| format!("檔案不是有效的 JSON：{e}"))?;

    // Backups wrap the config in an export envelope; bare configs are also accepted.
    let config_value = match value {
        serde_json::Value::Object(mut object) if object.contains_key("config") => object
            .remove("config")
            .expect("checked above that the config key exists"),
        other => other,
    };

    let mut config: AppConfig =
        serde_json::from_value(config_value).map_err(|e| format!("設定檔結構不符：{e}"))?;

    if config.version > CURRENT_CONFIG_VERSION {
        return Err(format!(
            "設定檔版本 {} 高於目前支援的版本 {}，請先更新 Conductor。",
            config.version, CURRENT_CONFIG_VERSION
        ));
    }

    normalize_config_triggers(&mut config);
    Ok(config)
}

#[tauri::command]
pub fn save_config(app: tauri::AppHandle, config: AppConfig) -> Result<(), String> {
    let path = config_file_path(&app)?;
    let content = serde_json::to_string_pretty(&config).map_err(|e| e.to_string())?;
    let prepared = path.with_extension("json.new");
    fs::write(&prepared, content).map_err(|e| e.to_string())?;
    if path.exists() {
        fs::copy(&path, path.with_extension("json.bak")).map_err(|e| e.to_string())?;
    }
    replace_file(&prepared, &path)
}

fn restore_config_file(app: &tauri::AppHandle, had_prev_config: bool) -> Result<(), String> {
    let path = config_file_path(app)?;
    let backup = path.with_extension("json.bak");
    if had_prev_config && backup.exists() {
        fs::copy(&backup, &path).map_err(|e| format!("無法還原 config.json: {e}"))?;
    } else if !had_prev_config && path.exists() {
        fs::remove_file(&path).map_err(|e| format!("無法清除新建立的 config.json: {e}"))?;
    }
    Ok(())
}

/// Runs AutoHotkey in validation mode and reports any syntax diagnostics.
fn validate_script(ahk_exe: &Path, script_path: &Path) -> Result<(), String> {
    let mut cmd = Command::new(ahk_exe);
    hide_console_window(&mut cmd);
    let output = cmd
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

/// Validates a paired engine and generated script in a temporary directory so a
/// failed validation never reaches the live config or runtime files.
fn stage_and_validate_script(
    ahk_exe: &Path,
    source_engine: &Path,
    script_content: &str,
    revision: u64,
) -> Result<(), String> {
    let staging_dir =
        env::temp_dir().join(format!("conductor-apply-{}-{revision}", std::process::id()));
    if staging_dir.exists() {
        fs::remove_dir_all(&staging_dir).map_err(|e| e.to_string())?;
    }
    fs::create_dir_all(&staging_dir).map_err(|e| e.to_string())?;

    let staged_engine = staging_dir.join("GestureEngine.ahk");
    let staged_script = staging_dir.join("ActiveGestures.ahk");

    let result = fs::copy(source_engine, &staged_engine)
        .map_err(|e| e.to_string())
        .and_then(|_| fs::write(&staged_script, script_content).map_err(|e| e.to_string()))
        .and_then(|_| validate_script(ahk_exe, &staged_script));

    let _ = fs::remove_dir_all(&staging_dir);
    result
}

#[tauri::command]
pub fn apply_config(
    app: tauri::AppHandle,
    state: State<'_, AppState>,
    config: AppConfig,
) -> Result<ApplyResult, String> {
    // Serialize applies so two requests never swap runtime files concurrently.
    let _apply_guard = state
        .apply_lock
        .lock()
        .map_err(|_| "無法取得套用鎖定".to_string())?;

    // 0. Validate enabled rules before writing any runtime or configuration files.
    validate_enabled_binding_duplicates(&config)?;

    // 1. Pre-flight check: ensure AutoHotkey executable exists
    let ahk_exe = autohotkey_exe_path(&app)?;

    // 2. Generate the script once and validate a staged engine + script pair.
    let revision = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|e| e.to_string())?
        .as_millis() as u64;

    let source_engine_path = gesture_engine_template_path(&app)?;
    let script_content = generate_ahk_script(&config, revision);

    stage_and_validate_script(&ahk_exe, &source_engine_path, &script_content, revision)?;

    // 3. Persist the configuration only after the staged pair validates.
    let had_prev_config = config_file_path(&app)?.exists();
    save_config(app.clone(), config.clone())?;

    // 4. Stop the active engine before swapping runtime files to avoid Windows file locks.
    let runtime_dir = runtime_dir_path(&app)?;
    let script_path = runtime_dir.join(RUNTIME_SCRIPT_NAME);
    if let Err(stop_error) = stop_active_engine(&state) {
        let _ = restore_config_file(&app, had_prev_config);
        return Err(stop_error);
    }

    // 5. Deploy the validated pair, keeping the previous files as backups.
    if let Err(deploy_error) =
        deploy_runtime_pair(&runtime_dir, &source_engine_path, &script_content)
    {
        let _ = restore_config_file(&app, had_prev_config);
        let rollback = restore_runtime_pair(&runtime_dir).and_then(|restored| {
            if !restored {
                return Ok(false);
            }
            let process = start_engine(&ahk_exe, &runtime_dir, &script_path)?;
            *state
                .engine_process
                .lock()
                .map_err(|_| "無法記錄手勢引擎行程".to_string())? = Some(process);
            Ok(true)
        });
        let outcome = match rollback {
            Ok(true) => "已還原上一版設定與引擎並重新啟動。".to_string(),
            Ok(false) => "沒有可還原的上一版檔案。".to_string(),
            Err(error) => format!("回滾失敗：{error}"),
        };
        return Err(format!("{deploy_error} {outcome}"));
    }

    let engine_process = match start_engine(&ahk_exe, &runtime_dir, &script_path) {
        Ok(process) => process,
        Err(start_error) => {
            let _ = restore_config_file(&app, had_prev_config);
            let rollback = restore_runtime_pair(&runtime_dir).and_then(|restored| {
                if !restored {
                    return Err("沒有完整的上一版引擎可重新啟動".into());
                }
                start_engine(&ahk_exe, &runtime_dir, &script_path)
            });
            let outcome = match rollback {
                Ok(process) => {
                    *state
                        .engine_process
                        .lock()
                        .map_err(|_| "無法記錄手勢引擎行程".to_string())? = Some(process);
                    "已還原上一版設定與引擎並重新啟動。".to_string()
                }
                Err(rollback_error) => format!("無法還原並重新啟動：{rollback_error}"),
            };
            return Err(format!("{start_error} {outcome}"));
        }
    };

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

    let mut cmd = Command::new("tasklist");
    hide_console_window(&mut cmd);
    let output = cmd.args(["/fo", "csv", "/nh"]).output();

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
pub fn get_runtime_status(app: tauri::AppHandle, state: State<'_, AppState>) -> RuntimeStatus {
    if let Err(e) = autohotkey_exe_path(&app) {
        return RuntimeStatus {
            state: "error".into(),
            applied_revision: None,
            msg: e,
        };
    }

    let is_running = state
        .engine_process
        .lock()
        .ok()
        .and_then(|mut guard| {
            guard
                .as_mut()
                .map(|child| child.try_wait().ok().flatten().is_none())
        })
        .unwrap_or(false);

    if is_running {
        RuntimeStatus {
            state: "running".into(),
            applied_revision: None,
            msg: "AutoHotkey v2 手勢引擎運作中".into(),
        }
    } else {
        RuntimeStatus {
            state: "stopped".into(),
            applied_revision: None,
            msg: "AutoHotkey v2 手勢引擎尚未啟動".into(),
        }
    }
}

#[tauri::command]
pub fn autostart_enabled(app: tauri::AppHandle) -> Result<bool, String> {
    app.autolaunch()
        .is_enabled()
        .map_err(|error| error.to_string())
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
pub fn set_engine_paused(
    app: tauri::AppHandle,
    state: State<'_, AppState>,
    paused: bool,
) -> Result<(), String> {
    write_pause_flag(&app, paused)?;
    state.paused.store(paused, Ordering::SeqCst);
    if let Some(item) = state.pause_item.lock().map_err(|e| e.to_string())?.as_ref() {
        item.set_text(if paused {
            "繼續手勢"
        } else {
            "暫停手勢"
        })
        .map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub async fn export_config_dialog(
    content: String,
    default_file_name: String,
) -> Result<Option<String>, String> {
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

#[cfg(test)]
mod tests {
    #[test]
    fn mouse_validation_rejects_left_only_and_detects_reordered_chord_duplicates() {
        let mut config = crate::config::default_app_config();
        let target = config
            .targets
            .iter_mut()
            .find(|target| target.kind == "global")
            .unwrap();
        target.bindings.retain(|binding| binding.enabled);
        target.bindings[0].gesture.trigger = "L".into();
        assert!(super::validate_enabled_binding_duplicates(&config).is_err());
        let target = config
            .targets
            .iter_mut()
            .find(|target| target.kind == "global")
            .unwrap();
        target.bindings[0].gesture.trigger = "R+X1".into();
        target.bindings[0].gesture.steps.clear();
        assert!(super::validate_enabled_binding_duplicates(&config).is_ok());
        let target = config
            .targets
            .iter_mut()
            .find(|target| target.kind == "global")
            .unwrap();
        let mut duplicate = target.bindings[0].clone();
        duplicate.id = "chord-copy".into();
        duplicate.gesture.trigger = "X1+R".into();
        target.bindings.push(duplicate);
        assert!(super::validate_enabled_binding_duplicates(&config).is_err());
    }
    use super::{
        deploy_runtime_pair, portable_data_dir_for_executable, replace_file, restore_runtime_pair,
        stage_and_validate_script, validate_enabled_binding_duplicates, validate_imported_config,
    };
    use crate::config::{default_app_config, CURRENT_CONFIG_VERSION};
    use std::{
        env, fs,
        time::{SystemTime, UNIX_EPOCH},
    };

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
    fn staging_directory_is_removed_when_validation_cannot_start() {
        let revision = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("system clock should be after Unix epoch")
            .as_nanos() as u64;
        let engine_path = env::temp_dir().join(format!("conductor-staging-engine-{revision}.ahk"));
        fs::write(&engine_path, "; engine stub").expect("engine stub should be written");
        let missing_exe = env::temp_dir().join(format!("conductor-missing-ahk-{revision}.exe"));

        let result =
            stage_and_validate_script(&missing_exe, &engine_path, "; script stub", revision);

        assert!(result.is_err());
        assert!(!env::temp_dir()
            .join(format!("conductor-apply-{}-{revision}", std::process::id()))
            .exists());
        fs::remove_file(engine_path).expect("engine stub should be removed");
    }

    #[test]
    fn replace_file_overwrites_an_existing_target() {
        let revision = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("system clock should be after Unix epoch")
            .as_nanos();
        let dir = env::temp_dir().join(format!("conductor-replace-test-{revision}"));
        fs::create_dir_all(&dir).expect("test directory should be created");
        let prepared = dir.join("prepared.txt");
        let target = dir.join("target.txt");
        fs::write(&prepared, "new").expect("prepared file should be written");
        fs::write(&target, "old").expect("target file should be written");

        replace_file(&prepared, &target).expect("replace should succeed");

        assert_eq!(fs::read_to_string(&target).unwrap(), "new");
        assert!(!prepared.exists());
        fs::remove_dir_all(dir).expect("test directory should be removed");
    }

    #[test]
    fn deploy_keeps_backups_and_restore_brings_the_previous_pair_back() {
        let revision = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("system clock should be after Unix epoch")
            .as_nanos();
        let dir = env::temp_dir().join(format!("conductor-deploy-test-{revision}"));
        let runtime = dir.join("runtime");
        fs::create_dir_all(&runtime).expect("runtime directory should be created");
        let source_engine = dir.join("source-engine.ahk");
        fs::write(&source_engine, "new-engine").expect("source engine should be written");
        fs::write(runtime.join("GestureEngine.ahk"), "old-engine")
            .expect("old engine should be written");
        fs::write(runtime.join("ActiveGestures.ahk"), "old-script")
            .expect("old script should be written");

        deploy_runtime_pair(&runtime, &source_engine, "new-script").expect("deploy should succeed");

        assert_eq!(
            fs::read_to_string(runtime.join("GestureEngine.ahk")).unwrap(),
            "new-engine"
        );
        assert_eq!(
            fs::read_to_string(runtime.join("ActiveGestures.ahk")).unwrap(),
            "new-script"
        );
        assert!(runtime.join("GestureEngine.ahk.bak").exists());
        assert!(runtime.join("ActiveGestures.ahk.bak").exists());

        assert!(restore_runtime_pair(&runtime).expect("restore should succeed"));

        assert_eq!(
            fs::read_to_string(runtime.join("GestureEngine.ahk")).unwrap(),
            "old-engine"
        );
        assert_eq!(
            fs::read_to_string(runtime.join("ActiveGestures.ahk")).unwrap(),
            "old-script"
        );
        fs::remove_dir_all(dir).expect("test directory should be removed");
    }

    #[test]
    fn restore_reports_when_no_previous_pair_exists() {
        let revision = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("system clock should be after Unix epoch")
            .as_nanos();
        let dir = env::temp_dir().join(format!("conductor-restore-test-{revision}"));
        fs::create_dir_all(&dir).expect("test directory should be created");

        assert!(!restore_runtime_pair(&dir).expect("restore should succeed"));

        fs::remove_dir_all(dir).expect("test directory should be removed");
    }

    #[test]
    fn restore_rejects_incomplete_backup_before_changing_live_files() {
        let dir = env::temp_dir().join(format!(
            "conductor-incomplete-{}",
            SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        fs::create_dir_all(&dir).unwrap();
        fs::write(dir.join("rollback.json"), "[true,true]").unwrap();
        fs::write(dir.join("GestureEngine.ahk.bak"), "old-engine").unwrap();
        fs::write(dir.join("GestureEngine.ahk"), "live-engine").unwrap();
        assert!(restore_runtime_pair(&dir).is_err());
        assert_eq!(
            fs::read_to_string(dir.join("GestureEngine.ahk")).unwrap(),
            "live-engine"
        );
        fs::remove_dir_all(dir).unwrap();
    }

    #[test]
    fn failed_backup_does_not_deploy_or_restore_stale_files() {
        let dir = env::temp_dir().join(format!(
            "conductor-backup-fail-{}",
            SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        fs::create_dir_all(&dir).unwrap();
        fs::write(dir.join("GestureEngine.ahk"), "live-engine").unwrap();
        fs::write(dir.join("ActiveGestures.ahk"), "live-script").unwrap();
        fs::write(dir.join("rollback.json"), "[true,true]").unwrap();
        fs::create_dir(dir.join("ActiveGestures.ahk.bak")).unwrap();
        let source = dir.join("source.ahk");
        fs::write(&source, "new-engine").unwrap();
        assert!(deploy_runtime_pair(&dir, &source, "new-script").is_err());
        assert!(!restore_runtime_pair(&dir).unwrap());
        assert_eq!(
            fs::read_to_string(dir.join("GestureEngine.ahk")).unwrap(),
            "live-engine"
        );
        assert_eq!(
            fs::read_to_string(dir.join("ActiveGestures.ahk")).unwrap(),
            "live-script"
        );
        fs::remove_dir_all(dir).unwrap();
    }

    #[test]
    fn first_deployment_rollback_removes_new_files_without_claiming_previous_engine() {
        let dir = env::temp_dir().join(format!(
            "conductor-first-{}",
            SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        fs::create_dir_all(&dir).unwrap();
        let source = dir.join("source.ahk");
        fs::write(&source, "new-engine").unwrap();
        deploy_runtime_pair(&dir, &source, "new-script").unwrap();
        assert!(!restore_runtime_pair(&dir).unwrap());
        assert!(!dir.join("GestureEngine.ahk").exists());
        assert!(!dir.join("ActiveGestures.ahk").exists());
        fs::remove_dir_all(dir).unwrap();
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
    fn screen_edge_occupancy_ignores_wheel_direction_and_disabled_rules() {
        for (whole, first, second) in [
            ("EdgeTop", "EdgeTopLeftHalf", "EdgeTopRightHalf"),
            ("EdgeBottom", "EdgeBottomLeftHalf", "EdgeBottomRightHalf"),
            ("EdgeLeft", "EdgeLeftTopHalf", "EdgeLeftBottomHalf"),
            ("EdgeRight", "EdgeRightTopHalf", "EdgeRightBottomHalf"),
        ] {
            for (a, b, conflict) in [
                (first, first, true),
                (first, second, false),
                (whole, first, true),
                (first, whole, true),
                (whole, whole, false),
            ] {
                let mut config = default_app_config();
                for target in &mut config.targets {
                    target.bindings.clear();
                }
                let target = config
                    .targets
                    .iter_mut()
                    .find(|target| target.kind == "global")
                    .expect("global target should exist");
                let mut binding = default_app_config()
                    .targets
                    .iter()
                    .flat_map(|target| &target.bindings)
                    .next()
                    .unwrap()
                    .clone();
                binding.enabled = true;
                binding.gesture.trigger = a.into();
                binding.gesture.steps = vec!["WU".into()];
                let mut other = binding.clone();
                other.id = "other".into();
                other.gesture.trigger = b.into();
                other.gesture.steps = vec!["WD".into()];
                target.bindings = vec![binding, other];
                assert_eq!(
                    validate_enabled_binding_duplicates(&config).is_err(),
                    conflict,
                    "{a}, {b}"
                );
                config
                    .targets
                    .iter_mut()
                    .find(|target| target.kind == "global")
                    .expect("global target should exist")
                    .bindings[1]
                    .enabled = false;
                assert!(validate_enabled_binding_duplicates(&config).is_ok());
            }
        }
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

    #[test]
    fn imported_backup_envelope_is_unwrapped_and_normalized() {
        let mut config = default_app_config();
        let legacy_trigger = config
            .targets
            .iter_mut()
            .flat_map(|target| target.bindings.iter_mut())
            .find(|binding| binding.gesture.trigger.eq_ignore_ascii_case("R"))
            .expect("default config should contain a right-button binding");
        legacy_trigger.gesture.trigger = "RB".into();

        let envelope = serde_json::json!({
            "header": { "app": "Conductor", "schemaVersion": 1 },
            "config": config,
        });
        let imported = validate_imported_config(envelope.to_string())
            .expect("a valid envelope should be accepted");

        assert_eq!(imported.version, CURRENT_CONFIG_VERSION);
        assert_eq!(imported.targets.len(), config.targets.len());
        assert!(imported
            .targets
            .iter()
            .flat_map(|target| &target.bindings)
            .all(|binding| !binding.gesture.trigger.eq_ignore_ascii_case("RB")));
    }

    #[test]
    fn imported_bare_config_is_accepted() {
        let content =
            serde_json::to_string(&default_app_config()).expect("config should serialize");

        assert!(validate_imported_config(content).is_ok());
    }

    #[test]
    fn imported_config_rejects_malformed_or_incomplete_content() {
        assert!(validate_imported_config("not json".into()).is_err());
        assert!(validate_imported_config(r#"{"version": 1}"#.into()).is_err());
    }

    #[test]
    fn imported_config_rejects_a_newer_format_version() {
        let mut value =
            serde_json::to_value(default_app_config()).expect("config should serialize");
        value["version"] = serde_json::json!(CURRENT_CONFIG_VERSION + 1);

        let error = validate_imported_config(value.to_string()).unwrap_err();

        assert!(error.contains("版本"));
    }

    #[test]
    fn disabled_scope_does_not_block_duplicate_validation() {
        let mut config = default_app_config();
        let group = config
            .targets
            .iter_mut()
            .find(|target| target.kind == "group")
            .expect("group target should exist");
        group.enabled = false;
        let duplicate = group.bindings[0].clone();
        group.bindings.push(duplicate);

        assert!(validate_enabled_binding_duplicates(&config).is_ok());
    }

    #[test]
    fn mouse_validation_normalizes_lowercase_steps() {
        let mut config = default_app_config();
        let global = config
            .targets
            .iter_mut()
            .find(|target| target.kind == "global")
            .expect("global target should exist");
        global.bindings.retain(|binding| binding.enabled);
        global.bindings[0].gesture.trigger = "R".into();
        global.bindings[0].gesture.steps = vec![" l ".into()];

        assert!(validate_enabled_binding_duplicates(&config).is_ok());
    }
}
