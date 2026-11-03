//! Desktop update stubs (EU-046).
//!
//! Signed auto-updates need `TAURI_SIGNING_PRIVATE_KEY` and a real minisign
//! pubkey in `tauri.conf.json`. Until those secrets exist, we ship stub
//! commands so the web shell can keep the between-session update UX without
//! pulling in `tauri-plugin-updater` (which cannot verify unsigned artifacts).
//!
//! Enable the real plugin by following `docs/desktop-updater.md`.

use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateCheckResult {
    pub available: bool,
    pub message: String,
}

const UNSIGNED_MSG: &str = "updates require signing secrets";

/// Poll target for the web shell. Always reports no update until signing is wired.
#[tauri::command]
pub fn check_for_update() -> UpdateCheckResult {
    UpdateCheckResult {
        available: false,
        message: UNSIGNED_MSG.to_string(),
    }
}

/// Apply a downloaded update. Refuses until signing secrets exist.
#[tauri::command]
pub fn apply_update() -> Result<(), String> {
    Err(UNSIGNED_MSG.to_string())
}
