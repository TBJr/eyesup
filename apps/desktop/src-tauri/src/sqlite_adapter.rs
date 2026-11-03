//! SQLite StorageAdapter parity for the desktop shell (EU-042).
//! Commands accept/return camelCase JSON matching TypeScript storage records.

use rusqlite::{params, Connection, OptionalExtension};
use serde_json::{json, Value};
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
const SCHEMA_VERSION: i64 = 1;

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

fn lock_conn(
    state: &tauri::State<'_, DbState>,
) -> Result<std::sync::MutexGuard<'_, Connection>, StorageError> {
    state
        .conn
        .lock()
        .map_err(|_| StorageError::Message("db lock poisoned".into()))
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

fn as_bool_i64(v: Option<&Value>) -> i64 {
    if v.and_then(|x| x.as_bool()).unwrap_or(false) {
        1
    } else {
        0
    }
}

fn parse_json_col(s: &str) -> Value {
    serde_json::from_str(s).unwrap_or(Value::Null)
}

fn parse_json_opt(s: Option<String>) -> Value {
    match s {
        None => Value::Null,
        Some(raw) => parse_json_col(&raw),
    }
}

fn profile_row(row: &rusqlite::Row<'_>) -> rusqlite::Result<Value> {
    Ok(json!({
        "schemaVersion": SCHEMA_VERSION,
        "id": 1,
        "layoutId": row.get::<_, String>("layout_id")?,
        "track": row.get::<_, String>("track")?,
        "overlays": parse_json_col(&row.get::<_, String>("overlays")?),
        "accessProfile": parse_json_col(&row.get::<_, String>("access_profile")?),
        "dailyMinutes": row.get::<_, i64>("daily_minutes")?,
        "targetWpm": row.get::<_, f64>("target_wpm")?,
        "goalWpm": row.get::<_, f64>("goal_wpm")?,
        "keyboardShape": row.get::<_, String>("keyboard_shape")?,
        "reminderTime": row.get::<_, Option<String>>("reminder_time")?,
        "streakDays": row.get::<_, i64>("streak_days")?,
        "lastPracticeDate": row.get::<_, Option<String>>("last_practice_date")?,
        "restDaysUsedThisWeek": row.get::<_, i64>("rest_days_used_this_week")?,
        "weekStartIso": row.get::<_, Option<String>>("week_start_iso")?,
        "placedTrack": row.get::<_, Option<String>>("placed_track")?,
        "commitWeekStartedAt": row.get::<_, Option<String>>("commit_week_started_at")?,
        "commitWeekCheckIns": row.get::<_, i64>("commit_week_check_ins")?,
        "eyesUpPoints": row.get::<_, i64>("eyes_up_points")?,
        "createdAt": row.get::<_, String>("created_at")?,
        "updatedAt": row.get::<_, String>("updated_at")?,
    }))
}

fn baseline_row(row: &rusqlite::Row<'_>) -> rusqlite::Result<Value> {
    Ok(json!({
        "schemaVersion": SCHEMA_VERSION,
        "id": 1,
        "answers": parse_json_col(&row.get::<_, String>("answers")?),
        "sightedWpm": row.get::<_, f64>("sighted_wpm")?,
        "sightedAccuracy": row.get::<_, f64>("sighted_accuracy")?,
        "blindWpm": row.get::<_, f64>("blind_wpm")?,
        "blindAccuracy": row.get::<_, f64>("blind_accuracy")?,
        "homeScore": row.get::<_, i64>("home_score")?,
        "intervalCv": row.get::<_, Option<f64>>("interval_cv")?,
        "rolloverShare": row.get::<_, Option<f64>>("rollover_share")?,
        "detectedLayoutId": row.get::<_, String>("detected_layout_id")?,
        "placedTrack": row.get::<_, String>("placed_track")?,
        "takenAt": row.get::<_, String>("taken_at")?,
    }))
}

fn key_stat_row(row: &rusqlite::Row<'_>) -> rusqlite::Result<Value> {
    Ok(json!({
        "schemaVersion": SCHEMA_VERSION,
        "layoutId": row.get::<_, String>("layout_id")?,
        "code": row.get::<_, String>("code")?,
        "unlockedAt": row.get::<_, Option<String>>("unlocked_at")?,
        "guideLevel": row.get::<_, i64>("guide_level")?,
        "accuracy": row.get::<_, f64>("accuracy")?,
        "timeToTypeMs": row.get::<_, Option<f64>>("time_to_type_ms")?,
        "confidence": row.get::<_, f64>("confidence")?,
        "presses": row.get::<_, i64>("presses")?,
        "stableSessions": row.get::<_, i64>("stable_sessions")?,
        "sessionsWithKey": row.get::<_, i64>("sessions_with_key")?,
        "recentIntervalsMs": parse_json_col(&row.get::<_, String>("recent_intervals_ms")?),
        "recentFirstAttempts": parse_json_col(&row.get::<_, String>("recent_first_attempts")?),
        "lastPractised": row.get::<_, Option<String>>("last_practised")?,
    }))
}

fn pair_stat_row(row: &rusqlite::Row<'_>) -> rusqlite::Result<Value> {
    Ok(json!({
        "schemaVersion": SCHEMA_VERSION,
        "layoutId": row.get::<_, String>("layout_id")?,
        "pair": row.get::<_, String>("pair")?,
        "timeMs": row.get::<_, Option<f64>>("time_ms")?,
        "accuracy": row.get::<_, f64>("accuracy")?,
        "count": row.get::<_, i64>("count")?,
    }))
}

fn session_row(row: &rusqlite::Row<'_>) -> rusqlite::Result<Value> {
    Ok(json!({
        "schemaVersion": SCHEMA_VERSION,
        "id": row.get::<_, i64>("id")?,
        "layoutId": row.get::<_, String>("layout_id")?,
        "track": row.get::<_, String>("track")?,
        "startedAt": row.get::<_, String>("started_at")?,
        "endedAt": row.get::<_, Option<String>>("ended_at")?,
        "activeMs": row.get::<_, i64>("active_ms")?,
        "netWpm": row.get::<_, Option<f64>>("net_wpm")?,
        "accuracy": row.get::<_, Option<f64>>("accuracy")?,
        "blindShare": row.get::<_, Option<f64>>("blind_share")?,
        "peeks": row.get::<_, i64>("peeks")?,
        "blindCheck": row.get::<_, i64>("blind_check")? != 0,
    }))
}

fn line_result_row(row: &rusqlite::Row<'_>) -> rusqlite::Result<Value> {
    Ok(json!({
        "schemaVersion": SCHEMA_VERSION,
        "id": row.get::<_, i64>("id")?,
        "sessionId": row.get::<_, i64>("session_id")?,
        "position": row.get::<_, i64>("position")?,
        "lineType": row.get::<_, String>("line_type")?,
        "textHash": row.get::<_, Option<String>>("text_hash")?,
        "netWpm": row.get::<_, f64>("net_wpm")?,
        "accuracy": row.get::<_, f64>("accuracy")?,
        "errorsByKey": parse_json_col(&row.get::<_, String>("errors_by_key")?),
        "guideChanges": parse_json_col(&row.get::<_, String>("guide_changes")?),
        "savedAt": row.get::<_, String>("saved_at")?,
    }))
}

fn milestone_row(row: &rusqlite::Row<'_>) -> rusqlite::Result<Value> {
    Ok(json!({
        "schemaVersion": SCHEMA_VERSION,
        "id": row.get::<_, String>("id")?,
        "reachedAt": row.get::<_, String>("reached_at")?,
        "detail": parse_json_opt(row.get::<_, Option<String>>("detail")?),
    }))
}

fn own_text_row(row: &rusqlite::Row<'_>) -> rusqlite::Result<Value> {
    Ok(json!({
        "schemaVersion": SCHEMA_VERSION,
        "id": row.get::<_, i64>("id")?,
        "title": row.get::<_, String>("title")?,
        "body": row.get::<_, String>("body")?,
        "kind": row.get::<_, String>("kind")?,
        "practised": row.get::<_, i64>("practised")?,
        "bestWpm": row.get::<_, Option<f64>>("best_wpm")?,
        "createdAt": row.get::<_, String>("created_at")?,
    }))
}

fn insert_profile(conn: &Connection, profile: &Value) -> Result<(), StorageError> {
    conn.execute(
        "INSERT INTO profile (
            id, layout_id, track, overlays, access_profile, daily_minutes,
            target_wpm, goal_wpm, keyboard_shape, reminder_time,
            streak_days, last_practice_date, rest_days_used_this_week, week_start_iso,
            placed_track, commit_week_started_at, commit_week_check_ins, eyes_up_points,
            created_at, updated_at
        ) VALUES (1, ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19)
        ON CONFLICT(id) DO UPDATE SET
            layout_id = excluded.layout_id,
            track = excluded.track,
            overlays = excluded.overlays,
            access_profile = excluded.access_profile,
            daily_minutes = excluded.daily_minutes,
            target_wpm = excluded.target_wpm,
            goal_wpm = excluded.goal_wpm,
            keyboard_shape = excluded.keyboard_shape,
            reminder_time = excluded.reminder_time,
            streak_days = excluded.streak_days,
            last_practice_date = excluded.last_practice_date,
            rest_days_used_this_week = excluded.rest_days_used_this_week,
            week_start_iso = excluded.week_start_iso,
            placed_track = excluded.placed_track,
            commit_week_started_at = excluded.commit_week_started_at,
            commit_week_check_ins = excluded.commit_week_check_ins,
            eyes_up_points = excluded.eyes_up_points,
            created_at = excluded.created_at,
            updated_at = excluded.updated_at",
        params![
            as_str(profile.get("layoutId"), "qwerty-us"),
            as_str(profile.get("track"), "foundations"),
            json_str(profile.get("overlays").unwrap_or(&Value::Array(vec![]))),
            json_str(
                profile
                    .get("accessProfile")
                    .unwrap_or(&Value::Object(Default::default()))
            ),
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
    Ok(())
}

fn insert_baseline(conn: &Connection, baseline: &Value) -> Result<(), StorageError> {
    conn.execute(
        "INSERT INTO baseline (
            id, answers, sighted_wpm, sighted_accuracy, blind_wpm, blind_accuracy,
            home_score, interval_cv, rollover_share, detected_layout_id, placed_track, taken_at
        ) VALUES (1, ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)
        ON CONFLICT(id) DO UPDATE SET
            answers = excluded.answers,
            sighted_wpm = excluded.sighted_wpm,
            sighted_accuracy = excluded.sighted_accuracy,
            blind_wpm = excluded.blind_wpm,
            blind_accuracy = excluded.blind_accuracy,
            home_score = excluded.home_score,
            interval_cv = excluded.interval_cv,
            rollover_share = excluded.rollover_share,
            detected_layout_id = excluded.detected_layout_id,
            placed_track = excluded.placed_track,
            taken_at = excluded.taken_at",
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
    Ok(())
}

fn upsert_key_stat(conn: &Connection, k: &Value) -> Result<(), StorageError> {
    conn.execute(
        "INSERT INTO key_stat (
            layout_id, code, unlocked_at, guide_level, accuracy, time_to_type_ms,
            confidence, presses, stable_sessions, sessions_with_key,
            recent_intervals_ms, recent_first_attempts, last_practised
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)
        ON CONFLICT(layout_id, code) DO UPDATE SET
            unlocked_at = excluded.unlocked_at,
            guide_level = excluded.guide_level,
            accuracy = excluded.accuracy,
            time_to_type_ms = excluded.time_to_type_ms,
            confidence = excluded.confidence,
            presses = excluded.presses,
            stable_sessions = excluded.stable_sessions,
            sessions_with_key = excluded.sessions_with_key,
            recent_intervals_ms = excluded.recent_intervals_ms,
            recent_first_attempts = excluded.recent_first_attempts,
            last_practised = excluded.last_practised",
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
    Ok(())
}

fn upsert_pair_stat(conn: &Connection, p: &Value) -> Result<(), StorageError> {
    conn.execute(
        "INSERT INTO pair_stat (layout_id, pair, time_ms, accuracy, count)
         VALUES (?1, ?2, ?3, ?4, ?5)
         ON CONFLICT(layout_id, pair) DO UPDATE SET
            time_ms = excluded.time_ms,
            accuracy = excluded.accuracy,
            count = excluded.count",
        params![
            as_str(p.get("layoutId"), "qwerty-us"),
            as_str(p.get("pair"), ""),
            p.get("timeMs").and_then(|v| v.as_f64()),
            as_f64(p.get("accuracy"), 0.0),
            as_i64(p.get("count"), 0),
        ],
    )?;
    Ok(())
}

#[tauri::command]
pub fn get_profile(state: tauri::State<'_, DbState>) -> Result<Value, StorageError> {
    let conn = lock_conn(&state)?;
    let row = conn
        .query_row("SELECT * FROM profile WHERE id = 1", [], profile_row)
        .optional()?;
    Ok(row.unwrap_or(Value::Null))
}

#[tauri::command]
pub fn put_profile(state: tauri::State<'_, DbState>, profile: Value) -> Result<(), StorageError> {
    let conn = lock_conn(&state)?;
    insert_profile(&conn, &profile)
}

#[tauri::command]
pub fn get_baseline(state: tauri::State<'_, DbState>) -> Result<Value, StorageError> {
    let conn = lock_conn(&state)?;
    let row = conn
        .query_row("SELECT * FROM baseline WHERE id = 1", [], baseline_row)
        .optional()?;
    Ok(row.unwrap_or(Value::Null))
}

#[tauri::command]
pub fn put_baseline(
    state: tauri::State<'_, DbState>,
    baseline: Value,
) -> Result<(), StorageError> {
    let conn = lock_conn(&state)?;
    insert_baseline(&conn, &baseline)
}

#[tauri::command]
pub fn get_key_stats(
    state: tauri::State<'_, DbState>,
    layout_id: String,
) -> Result<Value, StorageError> {
    let conn = lock_conn(&state)?;
    let mut stmt = conn.prepare("SELECT * FROM key_stat WHERE layout_id = ?1")?;
    let rows = stmt
        .query_map(params![layout_id], key_stat_row)?
        .collect::<Result<Vec<_>, _>>()?;
    Ok(Value::Array(rows))
}

#[tauri::command]
pub fn put_key_stat(state: tauri::State<'_, DbState>, stat: Value) -> Result<(), StorageError> {
    let conn = lock_conn(&state)?;
    upsert_key_stat(&conn, &stat)
}

#[tauri::command]
pub fn get_pair_stats(
    state: tauri::State<'_, DbState>,
    layout_id: String,
) -> Result<Value, StorageError> {
    let conn = lock_conn(&state)?;
    let mut stmt = conn.prepare("SELECT * FROM pair_stat WHERE layout_id = ?1")?;
    let rows = stmt
        .query_map(params![layout_id], pair_stat_row)?
        .collect::<Result<Vec<_>, _>>()?;
    Ok(Value::Array(rows))
}

#[tauri::command]
pub fn put_pair_stat(state: tauri::State<'_, DbState>, stat: Value) -> Result<(), StorageError> {
    let conn = lock_conn(&state)?;
    upsert_pair_stat(&conn, &stat)
}

#[tauri::command]
pub fn create_session(
    state: tauri::State<'_, DbState>,
    session: Value,
) -> Result<Value, StorageError> {
    let conn = lock_conn(&state)?;
    conn.execute(
        "INSERT INTO session (
            layout_id, track, started_at, ended_at, active_ms,
            net_wpm, accuracy, blind_share, peeks, blind_check
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
        params![
            as_str(session.get("layoutId"), "qwerty-us"),
            as_str(session.get("track"), "foundations"),
            as_str(session.get("startedAt"), ""),
            opt_str(session.get("endedAt")),
            as_i64(session.get("activeMs"), 0),
            session.get("netWpm").and_then(|v| v.as_f64()),
            session.get("accuracy").and_then(|v| v.as_f64()),
            session.get("blindShare").and_then(|v| v.as_f64()),
            as_i64(session.get("peeks"), 0),
            as_bool_i64(session.get("blindCheck")),
        ],
    )?;
    let id = conn.last_insert_rowid();
    let row = conn.query_row(
        "SELECT * FROM session WHERE id = ?1",
        params![id],
        session_row,
    )?;
    Ok(row)
}

#[tauri::command]
pub fn update_session(
    state: tauri::State<'_, DbState>,
    session: Value,
) -> Result<(), StorageError> {
    let conn = lock_conn(&state)?;
    conn.execute(
        "UPDATE session SET
            layout_id = ?1, track = ?2, started_at = ?3, ended_at = ?4, active_ms = ?5,
            net_wpm = ?6, accuracy = ?7, blind_share = ?8, peeks = ?9, blind_check = ?10
         WHERE id = ?11",
        params![
            as_str(session.get("layoutId"), "qwerty-us"),
            as_str(session.get("track"), "foundations"),
            as_str(session.get("startedAt"), ""),
            opt_str(session.get("endedAt")),
            as_i64(session.get("activeMs"), 0),
            session.get("netWpm").and_then(|v| v.as_f64()),
            session.get("accuracy").and_then(|v| v.as_f64()),
            session.get("blindShare").and_then(|v| v.as_f64()),
            as_i64(session.get("peeks"), 0),
            as_bool_i64(session.get("blindCheck")),
            as_i64(session.get("id"), 0),
        ],
    )?;
    Ok(())
}

#[tauri::command]
pub fn save_line_result(
    state: tauri::State<'_, DbState>,
    result: Value,
) -> Result<Value, StorageError> {
    let conn = lock_conn(&state)?;
    conn.execute(
        "INSERT INTO line_result (
            session_id, position, line_type, text_hash, net_wpm, accuracy,
            errors_by_key, guide_changes, saved_at
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
        params![
            as_i64(result.get("sessionId"), 0),
            as_i64(result.get("position"), 0),
            as_str(result.get("lineType"), "warmup"),
            opt_str(result.get("textHash")),
            as_f64(result.get("netWpm"), 0.0),
            as_f64(result.get("accuracy"), 0.0),
            json_str(
                result
                    .get("errorsByKey")
                    .unwrap_or(&Value::Object(Default::default()))
            ),
            json_str(result.get("guideChanges").unwrap_or(&Value::Array(vec![]))),
            as_str(result.get("savedAt"), ""),
        ],
    )?;
    let id = conn.last_insert_rowid();
    let row = conn.query_row(
        "SELECT * FROM line_result WHERE id = ?1",
        params![id],
        line_result_row,
    )?;
    Ok(row)
}

#[tauri::command]
pub fn list_sessions(state: tauri::State<'_, DbState>) -> Result<Value, StorageError> {
    let conn = lock_conn(&state)?;
    let mut stmt = conn.prepare("SELECT * FROM session ORDER BY id ASC")?;
    let rows = stmt
        .query_map([], session_row)?
        .collect::<Result<Vec<_>, _>>()?;
    Ok(Value::Array(rows))
}

#[tauri::command]
pub fn list_line_results(
    state: tauri::State<'_, DbState>,
    session_id: i64,
) -> Result<Value, StorageError> {
    let conn = lock_conn(&state)?;
    let mut stmt =
        conn.prepare("SELECT * FROM line_result WHERE session_id = ?1 ORDER BY position ASC")?;
    let rows = stmt
        .query_map(params![session_id], line_result_row)?
        .collect::<Result<Vec<_>, _>>()?;
    Ok(Value::Array(rows))
}

#[tauri::command]
pub fn put_milestone(state: tauri::State<'_, DbState>, m: Value) -> Result<(), StorageError> {
    let conn = lock_conn(&state)?;
    conn.execute(
        "INSERT INTO milestone (id, reached_at, detail) VALUES (?1, ?2, ?3)
         ON CONFLICT(id) DO UPDATE SET
            reached_at = excluded.reached_at,
            detail = excluded.detail",
        params![
            as_str(m.get("id"), ""),
            as_str(m.get("reachedAt"), ""),
            m.get("detail").map(json_str),
        ],
    )?;
    Ok(())
}

#[tauri::command]
pub fn list_milestones(state: tauri::State<'_, DbState>) -> Result<Value, StorageError> {
    let conn = lock_conn(&state)?;
    let mut stmt = conn.prepare("SELECT * FROM milestone ORDER BY reached_at ASC")?;
    let rows = stmt
        .query_map([], milestone_row)?
        .collect::<Result<Vec<_>, _>>()?;
    Ok(Value::Array(rows))
}

#[tauri::command]
pub fn list_own_texts(state: tauri::State<'_, DbState>) -> Result<Value, StorageError> {
    let conn = lock_conn(&state)?;
    let mut stmt = conn.prepare("SELECT * FROM own_text ORDER BY id ASC")?;
    let rows = stmt
        .query_map([], own_text_row)?
        .collect::<Result<Vec<_>, _>>()?;
    Ok(Value::Array(rows))
}

#[tauri::command]
pub fn put_own_text(state: tauri::State<'_, DbState>, text: Value) -> Result<Value, StorageError> {
    let conn = lock_conn(&state)?;
    let id = if let Some(existing) = text.get("id").and_then(|v| v.as_i64()) {
        conn.execute(
            "UPDATE own_text SET
                title = ?1, body = ?2, kind = ?3, practised = ?4, best_wpm = ?5, created_at = ?6
             WHERE id = ?7",
            params![
                as_str(text.get("title"), ""),
                as_str(text.get("body"), ""),
                as_str(text.get("kind"), "prose"),
                as_i64(text.get("practised"), 0),
                text.get("bestWpm").and_then(|v| v.as_f64()),
                as_str(text.get("createdAt"), ""),
                existing,
            ],
        )?;
        existing
    } else {
        conn.execute(
            "INSERT INTO own_text (title, body, kind, practised, best_wpm, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![
                as_str(text.get("title"), ""),
                as_str(text.get("body"), ""),
                as_str(text.get("kind"), "prose"),
                as_i64(text.get("practised"), 0),
                text.get("bestWpm").and_then(|v| v.as_f64()),
                as_str(text.get("createdAt"), ""),
            ],
        )?;
        conn.last_insert_rowid()
    };
    let row = conn.query_row(
        "SELECT * FROM own_text WHERE id = ?1",
        params![id],
        own_text_row,
    )?;
    Ok(row)
}

#[tauri::command]
pub fn delete_own_text(state: tauri::State<'_, DbState>, id: i64) -> Result<(), StorageError> {
    let conn = lock_conn(&state)?;
    conn.execute("DELETE FROM own_text WHERE id = ?1", params![id])?;
    Ok(())
}

#[tauri::command]
pub fn export_json(state: tauri::State<'_, DbState>) -> Result<Value, StorageError> {
    let conn = lock_conn(&state)?;

    let profile = conn
        .query_row("SELECT * FROM profile WHERE id = 1", [], profile_row)
        .optional()?
        .unwrap_or(Value::Null);

    let baseline = conn
        .query_row("SELECT * FROM baseline WHERE id = 1", [], baseline_row)
        .optional()?
        .unwrap_or(Value::Null);

    let mut key_stmt = conn.prepare("SELECT * FROM key_stat")?;
    let key_stats = key_stmt
        .query_map([], key_stat_row)?
        .collect::<Result<Vec<_>, _>>()?;

    let mut pair_stmt = conn.prepare("SELECT * FROM pair_stat")?;
    let pair_stats = pair_stmt
        .query_map([], pair_stat_row)?
        .collect::<Result<Vec<_>, _>>()?;

    let mut session_stmt = conn.prepare("SELECT * FROM session ORDER BY id ASC")?;
    let sessions = session_stmt
        .query_map([], session_row)?
        .collect::<Result<Vec<_>, _>>()?;

    let mut line_stmt = conn.prepare("SELECT * FROM line_result ORDER BY id ASC")?;
    let line_results = line_stmt
        .query_map([], line_result_row)?
        .collect::<Result<Vec<_>, _>>()?;

    let mut mile_stmt = conn.prepare("SELECT * FROM milestone ORDER BY reached_at ASC")?;
    let milestones = mile_stmt
        .query_map([], milestone_row)?
        .collect::<Result<Vec<_>, _>>()?;

    let mut own_stmt = conn.prepare("SELECT * FROM own_text ORDER BY id ASC")?;
    let own_texts = own_stmt
        .query_map([], own_text_row)?
        .collect::<Result<Vec<_>, _>>()?;

    let exported_at: String = conn.query_row(
        "SELECT strftime('%Y-%m-%dT%H:%M:%fZ', 'now')",
        [],
        |row| row.get(0),
    )?;

    Ok(json!({
        "schemaVersion": SCHEMA_VERSION,
        "exportedAt": exported_at,
        "profile": profile,
        "baseline": baseline,
        "keyStats": key_stats,
        "pairStats": pair_stats,
        "sessions": sessions,
        "lineResults": line_results,
        "milestones": milestones,
        "ownTexts": own_texts,
    }))
}

/// Import a full EyesUpExport JSON document into the open database.
#[tauri::command]
pub fn import_json(state: tauri::State<'_, DbState>, payload: Value) -> Result<(), StorageError> {
    let mut conn = lock_conn(&state)?;
    let tx = conn.transaction()?;
    clear_learner_data(&tx)?;

    if let Some(profile) = payload.get("profile").filter(|p| !p.is_null()) {
        insert_profile(&tx, profile)?;
    }

    if let Some(baseline) = payload.get("baseline").filter(|b| !b.is_null()) {
        insert_baseline(&tx, baseline)?;
    }

    if let Some(Value::Array(keys)) = payload.get("keyStats") {
        for k in keys {
            upsert_key_stat(&tx, k)?;
        }
    }

    if let Some(Value::Array(pairs)) = payload.get("pairStats") {
        for p in pairs {
            upsert_pair_stat(&tx, p)?;
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
                    as_bool_i64(s.get("blindCheck")),
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
                    json_str(
                        l.get("errorsByKey")
                            .unwrap_or(&Value::Object(Default::default()))
                    ),
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

#[tauri::command]
pub fn delete_everything(state: tauri::State<'_, DbState>) -> Result<(), StorageError> {
    let conn = lock_conn(&state)?;
    clear_learner_data(&conn)
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;
    use std::time::{SystemTime, UNIX_EPOCH};

    fn temp_db_path() -> std::path::PathBuf {
        let nanos = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map(|d| d.as_nanos())
            .unwrap_or(0);
        std::env::temp_dir().join(format!("eyesup-sqlite-test-{nanos}.sqlite3"))
    }

    #[test]
    fn put_get_profile_round_trip() {
        let path = temp_db_path();
        let _ = std::fs::remove_file(&path);
        let conn = open_db(&path).expect("open db");

        let profile = json!({
            "schemaVersion": 1,
            "id": 1,
            "layoutId": "qwerty-us",
            "track": "foundations",
            "overlays": [],
            "accessProfile": { "textSizePx": 18, "theme": "light", "reducedMotion": false, "sound": true },
            "dailyMinutes": 12,
            "targetWpm": 15,
            "goalWpm": 40,
            "keyboardShape": "laptop",
            "reminderTime": null,
            "streakDays": 2,
            "lastPracticeDate": "2026-11-03",
            "restDaysUsedThisWeek": 0,
            "weekStartIso": null,
            "placedTrack": "foundations",
            "commitWeekStartedAt": null,
            "commitWeekCheckIns": 0,
            "eyesUpPoints": 0,
            "createdAt": "2026-11-03T00:00:00.000Z",
            "updatedAt": "2026-11-03T00:00:00.000Z"
        });

        insert_profile(&conn, &profile).expect("put profile");
        let got = conn
            .query_row("SELECT * FROM profile WHERE id = 1", [], profile_row)
            .expect("get profile");

        assert_eq!(got["layoutId"], "qwerty-us");
        assert_eq!(got["track"], "foundations");
        assert_eq!(got["goalWpm"], 40.0);
        assert_eq!(got["streakDays"], 2);
        assert_eq!(got["schemaVersion"], 1);

        let _ = std::fs::remove_file(&path);
    }
}
