pub mod commands;
pub mod config;
pub mod generator;
pub mod tray;

use std::{
    process::Child,
    sync::{atomic::AtomicBool, Mutex},
};
use tauri::WindowEvent;
use tauri_plugin_autostart::MacosLauncher;

pub struct AppState {
    pub paused: AtomicBool,
    pub engine_process: Mutex<Option<Child>>,
    pub apply_lock: Mutex<()>,
    pub pause_item: Mutex<Option<tauri::menu::MenuItem<tauri::Wry>>>,
}

pub fn run() {
    tauri::Builder::default()
        .manage(AppState {
            paused: AtomicBool::new(false),
            engine_process: Mutex::new(None),
            apply_lock: Mutex::new(()),
            pause_item: Mutex::new(None),
        })
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            None::<Vec<&str>>,
        ))
        .setup(|app| {
            // A pause flag from a previous session must not start the engine paused.
            commands::write_pause_flag(app.handle(), false).map_err(std::io::Error::other)?;
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
            commands::validate_imported_config,
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
        .expect("error while running Conductor");
}
