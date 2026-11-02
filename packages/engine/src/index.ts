export const ENGINE_VERSION = 1;

export type {
  Finger,
  KeyStat,
  Layout,
  LayoutKey,
  Learner,
  Line,
  LineKind,
  PairStat,
  RawKeyEvent,
  Track,
} from './types.js';

export {
  baseChar,
  charForCode,
  codeForChar,
  fingerByCode,
  fingerForChar,
  isTypingCharacter,
  keyByCode,
  parseLayout,
  unlockedCodes,
  unlockedTypingChars,
} from './layout.js';

export {
  ACCURACY_EWMA_HALF_LIFE_PRESSES,
  BLIND_CHECK_DURATION_SEC,
  BLIND_CHECK_EVERY_N_SESSIONS,
  BLOCK_BLIND_OR_COOLDOWN_SHARE,
  BLOCK_MIXED_REVIEW_SHARE,
  BLOCK_NEW_KEYS_SHARE,
  BLOCK_WARMUP_SHARE,
  BLOCK_WORDS_TEXT_SHARE,
  BREAK_AFTER_CONTINUOUS_MINUTES,
  CONFIDENCE_ACCURACY_CAP,
  CONFIDENCE_TIME_NUMERATOR_MS,
  DRILL_ONLY_MAX_GROUP,
  FADE_LEVEL1_ACCURACY,
  FADE_LEVEL1_MIN_SESSIONS,
  FADE_LEVEL2_SPEED_FRACTION,
  FADE_LEVEL3_CONSECUTIVE_SESSIONS,
  FADE_PRESS_WINDOW,
  FADE_STEP_BACK_ACCURACY,
  FOCUS_SHARE_MAX,
  FOCUS_SHARE_MIN,
  FOUNDATIONS_MAX_SAME_FINGER_STREAK,
  LINE_MAX_CHARS,
  LINE_MIN_CHARS,
  NEW_KEYS_DAILY_CAP_MINUTES,
  PLACEMENT_BLIND_ACCURACY_THRESHOLD,
  PLACEMENT_BLIND_TO_SIGHTED_RATIO,
  PLACEMENT_BLIND_WPM_THRESHOLD,
  PLACEMENT_HOME_SCORE_THRESHOLD,
  PLACEMENT_SIGHTED_WPM_THRESHOLD,
  PLACEMENT_TIE_BAND,
  PSEUDO_WORDS_MIN_GROUP,
  SESSION_LINES_PER_MINUTE,
  SLOWEST_PAIR_DRILL_COUNT,
  TARGET_WPM_FOUNDATIONS_START,
  TARGET_WPM_INCREMENT_PER_UNLOCK,
  TARGET_WPM_OTHER_TRACK_PROBE_FRACTION,
  TIME_TO_TYPE_PAUSE_THRESHOLD_MS,
  UNLOCK_ACCURACY_THRESHOLD,
  UNLOCK_CONFIDENCE_THRESHOLD,
  WPM_CHARS_PER_WORD,
} from './params.js';

export {
  confidence,
  createKeyStat,
  recordKeyInterval,
  targetMsPerChar,
  updateAccuracyEwma,
} from './mastery.js';

export { accuracy, grossWpm, netWpm } from './metrics.js';

export { createSeededRandom, type SeededRandom } from './random.js';

export {
  editDistanceAtMostOne,
  generateLine,
  isWordLineKind,
  lineHasBlocklistedWord,
  type GenerateLineInput,
  type LetterModel,
} from './generator.js';
