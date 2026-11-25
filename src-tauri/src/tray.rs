use std::sync::atomic::Ordering;
use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager,
};
use tauri_plugin_autostart::ManagerExt;

use crate::AppState;

pub fn show_main_window(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.unminimize();
        let _ = window.show();
        let _ = window.set_focus();
    }
}

pub fn setup_tray(app: &tauri::AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let open_item = MenuItem::with_id(app, "open", "開啟設定", true, None::<&str>)?;
    let pause_item = MenuItem::with_id(app, "toggle-pause", "暫停手勢", true, None::<&str>)?;
    let autostart_item =
        MenuItem::with_id(app, "toggle-autostart", "開機自動啟動", true, None::<&str>)?;
    let separator = PredefinedMenuItem::separator(app)?;
    let quit_item = MenuItem::with_id(app, "quit", "結束程式", true, None::<&str>)?;

    let menu = Menu::with_items(
        app,
        &[
            &open_item,
            &pause_item,
            &autostart_item,
            &separator,
            &quit_item,
        ],
    )?;

    *app.state::<AppState>()
        .pause_item
        .lock()
        .map_err(|e| std::io::Error::other(e.to_string()))? = Some(pause_item.clone());
    TrayIconBuilder::new()
        .icon(app.default_window_icon().expect("application icon").clone())
        .tooltip("Conductor：執行中")
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(move |app, event| match event.id.as_ref() {
            "open" => show_main_window(app),
            "toggle-pause" => {
                let state = app.state::<AppState>();
                let paused = !state.paused.load(Ordering::SeqCst);
                if let Err(error) = crate::commands::set_engine_paused(app.clone(), state, paused) {
                    eprintln!("Failed to change pause state: {error}");
                }
            }
            "toggle-autostart" => {
                let manager = app.autolaunch();
                if manager.is_enabled().unwrap_or(false) {
                    let _ = manager.disable();
                } else {
                    let _ = manager.enable();
                }
            }
            "quit" => app.exit(0),
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                show_main_window(tray.app_handle());
            }
        })
        .build(app)?;

    Ok(())
}
