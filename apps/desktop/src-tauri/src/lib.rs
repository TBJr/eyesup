mod reminders;
mod sqlite_adapter;
mod updater;
mod window_state;

use sqlite_adapter::{
    create_session, delete_everything, delete_own_text, export_json, get_baseline, get_key_stats,
    get_pair_stats, get_profile, import_json, list_line_results, list_milestones, list_own_texts,
    list_sessions, open_db, put_baseline, put_key_stat, put_milestone, put_own_text, put_pair_stat,
    put_profile, save_line_result, update_session, DbState,
};
use std::sync::Mutex;
use tauri::{Manager, WindowEvent};
use reminders::show_reminder_notification;
use updater::{apply_update, check_for_update};
use window_state::{get_window_state, set_fullscreen, set_window_state};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let path = app
                .path()
                .app_data_dir()
                .expect("app data dir")
                .join("eyesup.sqlite3");
            if let Some(parent) = path.parent() {
                std::fs::create_dir_all(parent)?;
            }
            let conn = open_db(&path)?;
            app.manage(DbState {
                conn: Mutex::new(conn),
            });

            // Restore size/position after the window exists (EU-048).
            if let Err(err) = window_state::restore_on_startup(app.handle()) {
                eprintln!("eyesup: window restore skipped: {err}");
            }
            Ok(())
        })
        .on_window_event(|window, event| {
            match event {
                WindowEvent::Moved(_) | WindowEvent::Resized(_) => {
                    let app = window.app_handle();
                    if let Some(wv) = app.get_webview_window(window.label()) {
                        window_state::debounce_save(&app, &wv);
                    }
                }
                WindowEvent::CloseRequested { .. } => {
                    let app = window.app_handle();
                    if let Some(wv) = app.get_webview_window(window.label()) {
                        let _ = window_state::save_from_window(&app, &wv);
                    }
                }
                _ => {}
            }
        })
        .invoke_handler(tauri::generate_handler![
            get_profile,
            put_profile,
            get_baseline,
            put_baseline,
            get_key_stats,
            put_key_stat,
            get_pair_stats,
            put_pair_stat,
            create_session,
            update_session,
            save_line_result,
            list_sessions,
            list_line_results,
            put_milestone,
            list_milestones,
            list_own_texts,
            put_own_text,
            delete_own_text,
            export_json,
            import_json,
            delete_everything,
            check_for_update,
            apply_update,
            get_window_state,
            set_window_state,
            set_fullscreen,
            show_reminder_notification
        ])
        .run(tauri::generate_context!())
        .expect("error while running EyesUp");
}
