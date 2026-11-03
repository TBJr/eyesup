//! SQLite storage helpers for the desktop shell.
//! Exposes `import_json` so a web EyesUpExport can seed the local DB (EU-042/043).
//! Full StorageAdapter parity (get/put per store) lands with the TS bridge later.

use rusqlite::{params, Connection};
use serde_json::Value;
use std::path::Path;
use std::sync::Mutex;
use thiserror::Error;

pub struct DbState {
    pub conn: Mutex<Connection>,
}

#[derive(Debug, Error)]
pub enum StorageError {
    #[error("sqlite: {0}")]
    Sqlite(#[from] rusqlite::Error),
    #[error("io: {0}")]
    Io(#[from] std::io::Error),
    #[error("json: {0}")]
    Json(#[from] serde_json::Error),
    #[error("{0}")]
    Message(String),
}

impl serde::Serialize for StorageError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}

const MIGRATION: &str = include_str!("../migrations/0001_init.sql");

/// Open (or create) the EyesUp SQLite file and apply schema v1 when empty.
pub fn open_db(path: &Path) -> Result<Connection, StorageError> {
    let conn = Connection::open(path)?;
    conn.execute_batch("PRAGMA foreign_keys = ON;")?;
    let version: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='schema_version'",
            [],
            |row| row.get(0),
        )
        .unwrap_or(0);
    if version == 0 {
        conn.execute_batch(MIGRATION)?;
    }
    Ok(conn)
}

fn clear_learner_data(conn: &Connection) -> Result<(), StorageError> {
    // Order respects foreign keys (line_result / keystroke_log → session).
    for table in [
        "keystroke_log",
        "line_result",
        "session",
        "key_stat",
        "pair_stat",
        "milestone",
        "own_text",
        "baseline",
        "profile",
    ] {
        conn.execute(&format!("DELETE FROM {table}"), [])?;
    }
    Ok(())
}

fn json_str(v: &Value) -> String {
    v.to_string()
}

fn opt_str(v: Option<&Value>) -> Option<String> {
    match v {
        None | Some(Value::Null) => None,
        Some(Value::String(s)) => Some(s.clone()),
        Some(other) => Some(other.to_string()),
    }
}

fn as_f64(v: Option<&Value>, default: f64) -> f64 {
    v.and_then(|x| x.as_f64()).unwrap_or(default)
}

fn as_i64(v: Option<&Value>, default: i64) -> i64 {
    v.and_then(|x| x.as_i64())
        .or_else(|| v.and_then(|x| x.as_f64()).map(|f| f as i64))
        .unwrap_or(default)
}

fn as_str<'a>(v: Option<&'a Value>, default: &'a str) -> &'a str {
    v.and_then(|x| x.as_str()).unwrap_or(default)
}

/// Import a full EyesUpExport JSON document into the open database.
#[tauri::command]
pub fn import_json(state: tauri::State<'_, DbState>, payload: Value) -> Result<(), StorageError> {
    let mut conn = state
        .conn
        .lock()
        .map_err(|_| StorageError::Message("db lock poisoned".into()))?;
    let tx = conn.transaction()?;
    clear_learner_data(&tx)?;

    if let Some(profile) = payload.get("profile").filter(|p| !p.is_null()) {
        tx.execute(
            "INSERT INTO profile (
                id, layout_id, track, overlays, access_profile, daily_minutes,
                target_wpm, goal_wpm, keyboard_shape, reminder_time,
                streak_days, last_practice_date, rest_days_used_this_week, week_start_iso,
                placed_track, commit_week_started_at, commit_week_check_ins, eyes_up_points,
                created_at, updated_at
            ) VALUES (1, ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19)",
            params![
                as_str(profile.get("layoutId"), "qwerty-us"),
                as_str(profile.get("track"), "foundations"),
                json_str(profile.get("overlays").unwrap_or(&Value::Array(vec![]))),
                json_str(profile.get("accessProfile").unwrap_or(&Value::Object(Default::default()))),
                as_i64(profile.get("dailyMinutes"), 12),
                as_f64(profile.get("targetWpm"), 15.0),
                as_f64(profile.get("goalWpm"), 30.0),
                as_str(profile.get("keyboardShape"), "laptop"),
                opt_str(profile.get("reminderTime")),
                as_i64(profile.get("streakDays"), 0),
                opt_str(profile.get("lastPracticeDate")),
                as_i64(profile.get("restDaysUsedThisWeek"), 0),
                opt_str(profile.get("weekStartIso")),
                opt_str(profile.get("placedTrack")),
                opt_str(profile.get("commitWeekStartedAt")),
                as_i64(profile.get("commitWeekCheckIns"), 0),
                as_i64(profile.get("eyesUpPoints"), 0),
                as_str(profile.get("createdAt"), ""),
                as_str(profile.get("updatedAt"), ""),
            ],
        )?;
    }

    if let Some(baseline) = payload.get("baseline").filter(|b| !b.is_null()) {
        tx.execute(
            "INSERT INTO baseline (
                id, answers, sighted_wpm, sighted_accuracy, blind_wpm, blind_accuracy,
                home_score, interval_cv, rollover_share, detected_layout_id, placed_track, taken_at
            ) VALUES (1, ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
            params![
                json_str(baseline.get("answers").unwrap_or(&Value::Array(vec![]))),
                as_f64(baseline.get("sightedWpm"), 0.0),
                as_f64(baseline.get("sightedAccuracy"), 0.0),
                as_f64(baseline.get("blindWpm"), 0.0),
                as_f64(baseline.get("blindAccuracy"), 0.0),
                as_i64(baseline.get("homeScore"), 0),
                baseline.get("intervalCv").and_then(|v| v.as_f64()),
                baseline.get("rolloverShare").and_then(|v| v.as_f64()),
                as_str(baseline.get("detectedLayoutId"), "qwerty-us"),
                as_str(baseline.get("placedTrack"), "foundations"),
                as_str(baseline.get("takenAt"), ""),
            ],
        )?;
    }

    if let Some(Value::Array(keys)) = payload.get("keyStats") {
        for k in keys {
            tx.execute(
                "INSERT INTO key_stat (
                    layout_id, code, unlocked_at, guide_level, accuracy, time_to_type_ms,
                    confidence, presses, stable_sessions, sessions_with_key,
                    recent_intervals_ms, recent_first_attempts, last_practised
                ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)",
                params![
                    as_str(k.get("layoutId"), "qwerty-us"),
                    as_str(k.get("code"), ""),
                    opt_str(k.get("unlockedAt")),
                    as_i64(k.get("guideLevel"), 0),
                    as_f64(k.get("accuracy"), 0.0),
                    k.get("timeToTypeMs").and_then(|v| v.as_f64()),
                    as_f64(k.get("confidence"), 0.0),
                    as_i64(k.get("presses"), 0),
                    as_i64(k.get("stableSessions"), 0),
                    as_i64(k.get("sessionsWithKey"), 0),
                    json_str(k.get("recentIntervalsMs").unwrap_or(&Value::Array(vec![]))),
                    json_str(k.get("recentFirstAttempts").unwrap_or(&Value::Array(vec![]))),
                    opt_str(k.get("lastPractised")),
                ],
            )?;
        }
    }

    if let Some(Value::Array(pairs)) = payload.get("pairStats") {
        for p in pairs {
            tx.execute(
                "INSERT INTO pair_stat (layout_id, pair, time_ms, accuracy, count)
                 VALUES (?1, ?2, ?3, ?4, ?5)",
                params![
                    as_str(p.get("layoutId"), "qwerty-us"),
                    as_str(p.get("pair"), ""),
                    p.get("timeMs").and_then(|v| v.as_f64()),
                    as_f64(p.get("accuracy"), 0.0),
                    as_i64(p.get("count"), 0),
                ],
            )?;
        }
    }

    if let Some(Value::Array(sessions)) = payload.get("sessions") {
        for s in sessions {
            tx.execute(
                "INSERT INTO session (
                    id, layout_id, track, started_at, ended_at, active_ms,
                    net_wpm, accuracy, blind_share, peeks, blind_check
                ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
                params![
                    as_i64(s.get("id"), 0),
                    as_str(s.get("layoutId"), "qwerty-us"),
                    as_str(s.get("track"), "foundations"),
                    as_str(s.get("startedAt"), ""),
                    opt_str(s.get("endedAt")),
                    as_i64(s.get("activeMs"), 0),
                    s.get("netWpm").and_then(|v| v.as_f64()),
                    s.get("accuracy").and_then(|v| v.as_f64()),
                    s.get("blindShare").and_then(|v| v.as_f64()),
                    as_i64(s.get("peeks"), 0),
                    if s.get("blindCheck").and_then(|v| v.as_bool()).unwrap_or(false) {
                        1
                    } else {
                        0
                    },
                ],
            )?;
        }
    }

    if let Some(Value::Array(lines)) = payload.get("lineResults") {
        for l in lines {
            tx.execute(
                "INSERT INTO line_result (
                    id, session_id, position, line_type, text_hash, net_wpm, accuracy,
                    errors_by_key, guide_changes, saved_at
                ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
                params![
                    as_i64(l.get("id"), 0),
                    as_i64(l.get("sessionId"), 0),
                    as_i64(l.get("position"), 0),
                    as_str(l.get("lineType"), "warmup"),
                    opt_str(l.get("textHash")),
                    as_f64(l.get("netWpm"), 0.0),
                    as_f64(l.get("accuracy"), 0.0),
                    json_str(l.get("errorsByKey").unwrap_or(&Value::Object(Default::default()))),
                    json_str(l.get("guideChanges").unwrap_or(&Value::Array(vec![]))),
                    as_str(l.get("savedAt"), ""),
                ],
            )?;
        }
    }

    if let Some(Value::Array(milestones)) = payload.get("milestones") {
        for m in milestones {
            tx.execute(
                "INSERT INTO milestone (id, reached_at, detail) VALUES (?1, ?2, ?3)",
                params![
                    as_str(m.get("id"), ""),
                    as_str(m.get("reachedAt"), ""),
                    m.get("detail").map(json_str),
                ],
            )?;
        }
    }

    if let Some(Value::Array(texts)) = payload.get("ownTexts") {
        for o in texts {
            tx.execute(
                "INSERT INTO own_text (id, title, body, kind, practised, best_wpm, created_at)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
                params![
                    as_i64(o.get("id"), 0),
                    as_str(o.get("title"), ""),
                    as_str(o.get("body"), ""),
                    as_str(o.get("kind"), "prose"),
                    as_i64(o.get("practised"), 0),
                    o.get("bestWpm").and_then(|v| v.as_f64()),
                    as_str(o.get("createdAt"), ""),
                ],
            )?;
        }
    }

    tx.commit()?;
    Ok(())
}
