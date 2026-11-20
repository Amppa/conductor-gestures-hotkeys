use std::{
    collections::HashSet,
    fs,
    path::PathBuf,
    process::Command,
    sync::atomic::Ordering,
    time::{SystemTime, UNIX_EPOCH},
};
use tauri::{Manager, State};
use tauri_plugin_autostart::ManagerExt;

use crate::config::{default_app_config, AppConfig, ApplyResult, ProcessItem, RuntimeStatus};
use crate::generator::generate_ahk_script;
use crate::AppState;

// -----------------------------------------------------------------------------
// Path Resolution Helpers
// -----------------------------------------------------------------------------
pub fn config_file_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let dir = app.path().app_config_dir().map_err(|e| e.to_string())?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir.join("config.json"))
}

pub fn runtime_dir_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let dir = app.path().app_config_dir().map_err(|e| e.to_string())?.join("runtime");
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

pub fn gesture_engine_template_path() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../engine/GestureEngine.ahk")
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
    serde_json::from_str(&content).map_err(|e| format!("解析設定檔失敗: {e}"))
}

#[tauri::command]
pub fn save_config(app: tauri::AppHandle, config: AppConfig) -> Result<(), String> {
    let path = config_file_path(&app)?;
    let content = serde_json::to_string_pretty(&config).map_err(|e| e.to_string())?;
    fs::write(path, content).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn apply_config(app: tauri::AppHandle, config: AppConfig) -> Result<ApplyResult, String> {
    // 0. Pre-flight check: ensure AutoHotkey executable exists
    let ahk_exe = autohotkey_exe_path(&app)?;
    if !ahk_exe.exists() {
        return Err(format!("找不到 AutoHotkey 執行檔: {}", ahk_exe.display()));
    }

    // 1. Save config to disk
    save_config(app.clone(), config.clone())?;

    // 2. Prepare paths
    let revision = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|e| e.to_string())?
        .as_millis() as u64;

    let runtime_dir = runtime_dir_path(&app)?;
    let script_path = runtime_dir.join("ActiveGestures.ahk");
    let target_engine_path = runtime_dir.join("GestureEngine.ahk");
    let source_engine_path = gesture_engine_template_path();

    // Ensure GestureEngine.ahk is copied right next to ActiveGestures.ahk in runtime dir
    if source_engine_path.exists() {
        fs::copy(&source_engine_path, &target_engine_path).map_err(|e| e.to_string())?;
    } else {
        return Err(format!("找不到核心 engine/GestureEngine.ahk 檔案 (路徑: {})", source_engine_path.display()));
    }

    // 3. Generate script
    let script_content = generate_ahk_script(&config, revision);
    fs::write(&script_path, script_content).map_err(|e| e.to_string())?;

    // 4. Verify syntax with /ErrorStdOut and /validate before applying
    let check_output = Command::new(&ahk_exe)
        .arg("/ErrorStdOut")
        .arg("/validate")
        .arg(&script_path)
        .output()
        .map_err(|e| format!("無法啟動 AutoHotkey 進行語法檢查: {e}"))?;

    let stdout_err = String::from_utf8_lossy(&check_output.stdout);
    let stderr_err = String::from_utf8_lossy(&check_output.stderr);
    let combined_err = format!("{}{}", stdout_err.trim(), stderr_err.trim());

    if !check_output.status.success() || !combined_err.is_empty() {
        return Err(format!("產生的 AHK 腳本語法錯誤:\n{}", combined_err));
    }

    // 5. Run active script in background with runtime dir as current_dir
    Command::new(&ahk_exe)
        .current_dir(&runtime_dir)
        .arg(&script_path)
        .spawn()
        .map_err(|e| format!("啟動手勢引擎失敗: {e}"))?;

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
