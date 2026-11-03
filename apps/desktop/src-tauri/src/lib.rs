mod sqlite_adapter;

use sqlite_adapter::{import_json, open_db, DbState};
use std::sync::Mutex;
use tauri::Manager;

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
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![import_json])
        .run(tauri::generate_context!())
        .expect("error while running EyesUp");
}
