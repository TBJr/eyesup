//! Daily practice reminder stub (EU-047 / FR-34).
//!
//! OS notifications need `tauri-plugin-notification` (or equivalent) enabled with
//! product-owner approval for the new dependency. Until then this command is a
//! no-op that returns Ok(()) so the web shell can `invoke` safely.

/// Show a daily practice reminder. No-op until the notification plugin is enabled.
#[tauri::command]
pub fn show_reminder_notification(title: String, body: String) -> Result<(), String> {
    // Intentionally unused: real OS notify needs tauri-plugin-notification.
    let _ = (title, body);
    Ok(())
}
