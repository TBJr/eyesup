-- EyesUp desktop storage, schema version 1 (SQLite 3).
-- Mirrors the data model in the plan's Technical architecture tab. The web app
-- stores the same records in IndexedDB object stores with the same names.
-- Everything here stays on the device. Typed text is never stored except in
-- own_text, which the learner pastes themselves.
-- Never shipped: safe to edit in place until the first desktop release.

PRAGMA foreign_keys = ON;

CREATE TABLE schema_version (
  version     INTEGER NOT NULL PRIMARY KEY,
  applied_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- One learner per device until accounts exist (Phase 4).
CREATE TABLE profile (
  id                       INTEGER NOT NULL PRIMARY KEY CHECK (id = 1),
  layout_id                TEXT    NOT NULL,                      -- e.g. 'qwerty-us'
  track                    TEXT    NOT NULL CHECK (track IN ('foundations', 'retrain', 'adaptive', 'fluency')),
  overlays                 TEXT    NOT NULL DEFAULT '[]',         -- JSON array: 'coder', 'numbers'
  access_profile           TEXT    NOT NULL DEFAULT '{}',         -- JSON: textSize, contrast, reducedMotion, fingerMap, font, sound, theme
  daily_minutes            INTEGER NOT NULL DEFAULT 12 CHECK (daily_minutes IN (5, 12, 20)),
  target_wpm               REAL    NOT NULL,                      -- current unlock target, rises as groups unlock
  goal_wpm                 REAL    NOT NULL DEFAULT 30,
  keyboard_shape           TEXT    NOT NULL DEFAULT 'laptop' CHECK (keyboard_shape IN ('laptop', 'full', 'split')),
  reminder_time            TEXT,                                  -- 'HH:MM' local time, NULL = off
  streak_days              INTEGER NOT NULL DEFAULT 0,
  last_practice_date       TEXT,
  rest_days_used_this_week INTEGER NOT NULL DEFAULT 0,
  week_start_iso           TEXT,
  placed_track             TEXT CHECK (placed_track IS NULL OR placed_track IN ('foundations', 'retrain', 'adaptive', 'fluency')),
  commit_week_started_at   TEXT,
  commit_week_check_ins    INTEGER NOT NULL DEFAULT 0,
  eyes_up_points           INTEGER NOT NULL DEFAULT 0,
  created_at               TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at               TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- Onboarding answers and both probes. Written once; never edited.
CREATE TABLE baseline (
  id                  INTEGER NOT NULL PRIMARY KEY CHECK (id = 1),
  answers             TEXT    NOT NULL,                   -- JSON: the six onboarding answers
  sighted_wpm         REAL    NOT NULL,                   -- probe A, net WPM
  sighted_accuracy    REAL    NOT NULL,
  blind_wpm           REAL    NOT NULL,                   -- probe B3, net WPM
  blind_accuracy      REAL    NOT NULL,                   -- probe B2 + B3
  home_score          INTEGER NOT NULL CHECK (home_score BETWEEN 0 AND 4),
  interval_cv         REAL,                               -- coefficient of variation of inter-key intervals, probe A
  rollover_share      REAL,
  detected_layout_id  TEXT    NOT NULL,
  placed_track        TEXT    NOT NULL,
  taken_at            TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- One row per key per layout. Learning AZERTY never overwrites QWERTY.
CREATE TABLE key_stat (
  layout_id               TEXT    NOT NULL,
  code                    TEXT    NOT NULL,                      -- KeyboardEvent.code, e.g. 'KeyF'
  unlocked_at             TEXT,                                  -- NULL = still locked
  guide_level             INTEGER NOT NULL DEFAULT 0 CHECK (guide_level BETWEEN 0 AND 3),  -- L0..L3
  accuracy                REAL    NOT NULL DEFAULT 0,            -- exponentially weighted, half-life 40 presses
  time_to_type_ms         REAL,                                  -- smoothed median
  confidence              REAL    NOT NULL DEFAULT 0 CHECK (confidence BETWEEN 0 AND 1),
  presses                 INTEGER NOT NULL DEFAULT 0,
  stable_sessions         INTEGER NOT NULL DEFAULT 0,
  sessions_with_key       INTEGER NOT NULL DEFAULT 0,
  recent_intervals_ms     TEXT    NOT NULL DEFAULT '[]',         -- JSON number array
  recent_first_attempts   TEXT    NOT NULL DEFAULT '[]',         -- JSON number array (0/1)
  last_practised          TEXT,
  PRIMARY KEY (layout_id, code)
);

CREATE TABLE pair_stat (
  layout_id    TEXT    NOT NULL,
  pair         TEXT    NOT NULL,                          -- two characters, e.g. 'ei'
  time_ms      REAL,
  accuracy     REAL    NOT NULL DEFAULT 0,
  count        INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (layout_id, pair)
);

CREATE TABLE session (
  id             INTEGER PRIMARY KEY,
  layout_id      TEXT    NOT NULL,
  track          TEXT    NOT NULL,
  started_at     TEXT    NOT NULL,
  ended_at       TEXT,
  active_ms      INTEGER NOT NULL DEFAULT 0,              -- timer only runs while typing
  net_wpm        REAL,
  accuracy       REAL,
  blind_share    REAL,                                    -- keystrokes at guide level L3
  peeks          INTEGER NOT NULL DEFAULT 0,
  blind_check    INTEGER NOT NULL DEFAULT 0 CHECK (blind_check IN (0, 1))
);

CREATE TABLE line_result (
  id             INTEGER PRIMARY KEY,
  session_id     INTEGER NOT NULL REFERENCES session (id) ON DELETE CASCADE,
  position       INTEGER NOT NULL,                        -- 1-based line number in the session
  line_type      TEXT    NOT NULL CHECK (line_type IN (
    'warmup', 'key_drill', 'pair_drill', 'pseudo_words', 'real_words',
    'mixed_review', 'blind_check', 'cool_down', 'metronome', 'rollover_drill',
    'own_text', 'code', 'timed_test'
  )),
  text_hash      TEXT,                                    -- SHA-256 of own text or code; the text itself is not stored here
  net_wpm        REAL    NOT NULL,
  accuracy       REAL    NOT NULL,
  errors_by_key  TEXT    NOT NULL DEFAULT '{}',           -- JSON: { "KeyR": 2 }
  guide_changes  TEXT    NOT NULL DEFAULT '[]',           -- JSON: [{ "code": "KeyK", "from": 1, "to": 2 }]
  saved_at       TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (session_id, position)
);

-- Optional, rolling 14 days, off by default. For debugging and research only.
CREATE TABLE keystroke_log (
  id           INTEGER PRIMARY KEY,
  session_id   INTEGER NOT NULL REFERENCES session (id) ON DELETE CASCADE,
  t_down_ms    REAL    NOT NULL,                          -- event.timeStamp, relative to session start
  t_up_ms      REAL,
  code         TEXT    NOT NULL,
  key          TEXT    NOT NULL,
  expected     TEXT,
  correct      INTEGER NOT NULL CHECK (correct IN (0, 1)),
  guide_level  INTEGER NOT NULL CHECK (guide_level BETWEEN 0 AND 3),
  peeking      INTEGER NOT NULL DEFAULT 0 CHECK (peeking IN (0, 1))
);
CREATE INDEX keystroke_log_session ON keystroke_log (session_id);

CREATE TABLE milestone (
  id          TEXT NOT NULL PRIMARY KEY,                  -- e.g. 'first_blind_line', 'crossover'
  reached_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  detail      TEXT                                        -- JSON, e.g. { "wpm": 47 }
);

-- Text the learner pasted to practise. Never synced, never uploaded.
CREATE TABLE own_text (
  id           INTEGER PRIMARY KEY,
  title        TEXT    NOT NULL,
  body         TEXT    NOT NULL,
  kind         TEXT    NOT NULL DEFAULT 'prose' CHECK (kind IN ('prose', 'code')),
  practised    INTEGER NOT NULL DEFAULT 0,
  best_wpm     REAL,
  created_at   TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

INSERT INTO schema_version (version) VALUES (1);
