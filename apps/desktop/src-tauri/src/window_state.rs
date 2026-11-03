//! Remembered window geometry and full-screen practice (EU-048).

use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::Mutex;
use std::time::{Duration, Instant};
use tauri::{AppHandle, Manager, PhysicalPosition, PhysicalSize, WebviewWindow};

const DEBOUNCE: Duration = Duration::from_millis(400);
const WINDOW_LABEL: &str = "main";

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WindowStateJson {
    pub x: i32,
    pub y: i32,
    pub width: u32,
    pub height: u32,
    pub fullscreen: bool,
}

struct Debounce {
    last: Option<Instant>,
}

impl Debounce {
    const fn new() -> Self {
        Self { last: None }
    }
}

static SAVE_DEBOUNCE: Mutex<Debounce> = Mutex::new(Debounce::new());

fn state_path(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("app data dir: {e}"))?;
    Ok(dir.join("window.json"))
}

fn main_window(app: &AppHandle) -> Result<WebviewWindow, String> {
    app.get_webview_window(WINDOW_LABEL)
        .ok_or_else(|| "main window missing".to_string())
}

fn capture(window: &WebviewWindow) -> Result<WindowStateJson, String> {
    let pos = window
        .outer_position()
        .map_err(|e| format!("position: {e}"))?;
    let size = window.outer_size().map_err(|e| format!("size: {e}"))?;
    let fullscreen = window.is_fullscreen().unwrap_or(false);
    Ok(WindowStateJson {
        x: pos.x,
        y: pos.y,
        width: size.width,
        height: size.height,
        fullscreen,
    })
}

pub fn save_state(app: &AppHandle, state: &WindowStateJson) -> Result<(), String> {
    let path = state_path(app)?;
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| format!("mkdir: {e}"))?;
    }
    let body = serde_json::to_string_pretty(state).map_err(|e| format!("serialize: {e}"))?;
    std::fs::write(&path, body).map_err(|e| format!("write window.json: {e}"))
}

pub fn save_from_window(app: &AppHandle, window: &WebviewWindow) -> Result<(), String> {
    let state = capture(window)?;
    save_state(app, &state)
}

/// Debounced persist used from move/resize handlers.
pub fn debounce_save(app: &AppHandle, window: &WebviewWindow) {
    let Ok(mut guard) = SAVE_DEBOUNCE.lock() else {
        return;
    };
    let now = Instant::now();
    if let Some(prev) = guard.last {
        if now.duration_since(prev) < DEBOUNCE {
            return;
        }
    }
    guard.last = Some(now);
    drop(guard);
    let _ = save_from_window(app, window);
}

fn apply_state(window: &WebviewWindow, state: &WindowStateJson) -> Result<(), String> {
    if state.fullscreen {
        window
            .set_fullscreen(true)
            .map_err(|e| format!("fullscreen: {e}"))?;
        return Ok(());
    }
    window
        .set_fullscreen(false)
        .map_err(|e| format!("fullscreen: {e}"))?;
    if state.width > 0 && state.height > 0 {
        window
            .set_size(PhysicalSize::new(state.width, state.height))
            .map_err(|e| format!("set_size: {e}"))?;
    }
    window
        .set_position(PhysicalPosition::new(state.x, state.y))
        .map_err(|e| format!("set_position: {e}"))?;
    Ok(())
}

/// Restore from `window.json` next to the SQLite file when present.
pub fn restore_on_startup(app: &AppHandle) -> Result<(), String> {
    let path = state_path(app)?;
    if !path.exists() {
        return Ok(());
    }
    let raw = std::fs::read_to_string(&path).map_err(|e| format!("read window.json: {e}"))?;
    let state: WindowStateJson =
        serde_json::from_str(&raw).map_err(|e| format!("parse window.json: {e}"))?;
    let window = main_window(app)?;
    apply_state(&window, &state)
}

#[tauri::command]
pub fn get_window_state(app: AppHandle) -> Result<Option<WindowStateJson>, String> {
    let path = state_path(&app)?;
    if !path.exists() {
        return Ok(None);
    }
    let raw = std::fs::read_to_string(&path).map_err(|e| format!("read: {e}"))?;
    let state = serde_json::from_str(&raw).map_err(|e| format!("parse: {e}"))?;
    Ok(Some(state))
}

#[tauri::command]
pub fn set_window_state(app: AppHandle, state: WindowStateJson) -> Result<(), String> {
    let window = main_window(&app)?;
    apply_state(&window, &state)?;
    save_state(&app, &state)
}

#[tauri::command]
pub fn set_fullscreen(app: AppHandle, fullscreen: bool) -> Result<(), String> {
    let window = main_window(&app)?;
    window
        .set_fullscreen(fullscreen)
        .map_err(|e| format!("fullscreen: {e}"))?;
    let mut state = capture(&window)?;
    state.fullscreen = fullscreen;
    save_state(&app, &state)
}
