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
    let autostart_item = MenuItem::with_id(app, "toggle-autostart", "開機自動啟動", true, None::<&str>)?;
    let separator = PredefinedMenuItem::separator(app)?;
    let quit_item = MenuItem::with_id(app, "quit", "結束程式", true, None::<&str>)?;

    let menu = Menu::with_items(
        app,
        &[&open_item, &pause_item, &autostart_item, &separator, &quit_item],
    )?;

    let pause_item_ref = pause_item.clone();
    TrayIconBuilder::new()
        .icon(app.default_window_icon().expect("application icon").clone())
        .tooltip("MouseGesture 5Btn：執行中")
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(move |app, event| match event.id.as_ref() {
            "open" => show_main_window(app),
            "toggle-pause" => {
                let state = app.state::<AppState>();
                let was_paused = state.paused.fetch_xor(true, Ordering::SeqCst);
                let is_now_paused = !was_paused;
                let _ = pause_item_ref.set_text(if is_now_paused {
                    "繼續手勢"
                } else {
                    "暫停手勢"
                });
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
