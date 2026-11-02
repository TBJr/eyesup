/** §04 Curriculum — confidence time numerator: T = CONFIDENCE_TIME_NUMERATOR_MS / W. */
export const CONFIDENCE_TIME_NUMERATOR_MS = 12_000;

/** §04 Curriculum — accuracy divisor cap in confidence formula. */
export const CONFIDENCE_ACCURACY_CAP = 0.95;

/** §04 Curriculum — accuracy EWMA half-life in keystrokes. */
export const ACCURACY_EWMA_HALF_LIFE_PRESSES = 40;

/** §04 Curriculum — ignore intervals longer than this for time-to-type (ms). */
export const TIME_TO_TYPE_PAUSE_THRESHOLD_MS = 2_000;

/** §04 Curriculum — unlock when every key reaches this accuracy. */
export const UNLOCK_ACCURACY_THRESHOLD = 0.95;

/** §04 Curriculum — unlock when every key reaches this confidence. */
export const UNLOCK_CONFIDENCE_THRESHOLD = 0.9;

/** §04 Curriculum / C13 — generated line length bounds (characters). */
export const LINE_MIN_CHARS = 40;
export const LINE_MAX_CHARS = 60;

/** §04 Curriculum / C18 — focus key share on word lines (non-space characters). */
export const FOCUS_SHARE_MIN = 0.25;
export const FOCUS_SHARE_MAX = 0.35;

/** C18 — groups before real/pseudo word lines; drills only through group 3. */
export const DRILL_ONLY_MAX_GROUP = 3;

/** §04 Curriculum — first group index (1-based) where pseudo-words are allowed. */
export const PSEUDO_WORDS_MIN_GROUP = 4;

/** §04 Curriculum / C18 — Foundations cap on consecutive same-finger presses. */
export const FOUNDATIONS_MAX_SAME_FINGER_STREAK = 3;

/** §04 Curriculum — planned lines per minute in session scheduler. */
export const SESSION_LINES_PER_MINUTE = 2;

/** §04 Curriculum — warm-up block share of session lines. */
export const BLOCK_WARMUP_SHARE = 0.1;

/** §04 Curriculum — new-key drills block share. */
export const BLOCK_NEW_KEYS_SHARE = 0.3;

/** §04 Curriculum — mixed review block share. */
export const BLOCK_MIXED_REVIEW_SHARE = 0.3;

/** §04 Curriculum — words and text block share. */
export const BLOCK_WORDS_TEXT_SHARE = 0.2;

/** §04 Curriculum — blind check or cool-down block share. */
export const BLOCK_BLIND_OR_COOLDOWN_SHARE = 0.1;

/** §04 Curriculum — blind check on sessions 3, 6, 9, … (C1, C2). */
export const BLIND_CHECK_EVERY_N_SESSIONS = 3;

/** §04 Curriculum — blind check duration (seconds). */
export const BLIND_CHECK_DURATION_SEC = 30;

/** §04 Curriculum — break card after continuous typing (minutes). */
export const BREAK_AFTER_CONTINUOUS_MINUTES = 20;

/** §04 Curriculum — stop introducing new keys after this many minutes per day. */
export const NEW_KEYS_DAILY_CAP_MINUTES = 30;

/** §04 Curriculum — target WPM at Foundations start (C8 default elsewhere). */
export const TARGET_WPM_FOUNDATIONS_START = 15;

/** §04 Curriculum — target WPM rise per group unlock. */
export const TARGET_WPM_INCREMENT_PER_UNLOCK = 2;

/** §04 Curriculum — non-Foundations starting target as fraction of probe WPM. */
export const TARGET_WPM_OTHER_TRACK_PROBE_FRACTION = 0.8;

/** §02 Learning method / C17 — presses window for fade step-back. */
export const FADE_PRESS_WINDOW = 40;

/** §02 Learning method / C17 — accuracy to advance L0 → L1 after first two sessions. */
export const FADE_LEVEL1_ACCURACY = 0.95;

/** §02 Learning method / C17 — sessions a new key stays at L0. */
export const FADE_LEVEL1_MIN_SESSIONS = 2;

/** §02 Learning method / C17 — speed fraction of target for L1 → L2. */
export const FADE_LEVEL2_SPEED_FRACTION = 0.6;

/** §02 Learning method / C17 — consecutive sessions at target speed for L2 → L3. */
export const FADE_LEVEL3_CONSECUTIVE_SESSIONS = 2;

/** §02 Learning method / C17 — accuracy below this steps guide level back one step. */
export const FADE_STEP_BACK_ACCURACY = 0.9;

/** §03 Onboarding — blind accuracy threshold for Adaptive/Fluency branch. */
export const PLACEMENT_BLIND_ACCURACY_THRESHOLD = 0.8;

/** §03 Onboarding — home position score threshold. */
export const PLACEMENT_HOME_SCORE_THRESHOLD = 3;

/** §03 Onboarding — sighted speed threshold for Retrain branch (WPM). */
export const PLACEMENT_SIGHTED_WPM_THRESHOLD = 30;

/** §03 Onboarding — blind speed threshold for Fluency (WPM). */
export const PLACEMENT_BLIND_WPM_THRESHOLD = 35;

/** §03 Onboarding — blind-to-sighted WPM ratio for Fluency. */
export const PLACEMENT_BLIND_TO_SIGHTED_RATIO = 0.8;

/** §03 Onboarding — tie band when scores are within 5%. */
export const PLACEMENT_TIE_BAND = 0.05;

/** §04 Metric definitions — characters per word for WPM. */
export const WPM_CHARS_PER_WORD = 5;

/** §04 Curriculum — slowest letter pairs targeted in Chunk (count). */
export const SLOWEST_PAIR_DRILL_COUNT = 10;

/** §04 Curriculum — spaced review interval doubles up to this many days. */
export const REVIEW_INTERVAL_MAX_DAYS = 30;

/** §04 Curriculum — minimum confidence for expanding review interval. */
export const REVIEW_CONFIDENCE_THRESHOLD = 0.9;

/** C9 — default learner goal WPM. */
export const DEFAULT_GOAL_WPM = 30;
