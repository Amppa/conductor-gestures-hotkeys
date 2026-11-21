pub mod commands;
pub mod config;
pub mod generator;
pub mod tray;

use std::sync::atomic::AtomicBool;
use tauri::WindowEvent;
use tauri_plugin_autostart::MacosLauncher;

pub struct AppState {
    pub paused: AtomicBool,
}

pub fn run() {
    tauri::Builder::default()
        .manage(AppState {
            paused: AtomicBool::new(false),
        })
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            None::<Vec<&str>>,
        ))
        .setup(|app| {
            tray::setup_tray(app.handle())?;
            Ok(())
        })
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                // Minimize to tray instead of exiting
                api.prevent_close();
                let _ = window.hide();
            }
        })
        .invoke_handler(tauri::generate_handler![
            commands::load_config,
            commands::save_config,
            commands::apply_config,
            commands::get_runtime_status,
            commands::get_running_processes,
            commands::autostart_enabled,
            commands::set_autostart,
            commands::is_engine_paused,
            commands::set_engine_paused,
            commands::export_config_dialog,
        ])
        .run(tauri::generate_context!())
        .expect("error while running MouseGesture 5Btn");
}
