import {
  ACCURACY_EWMA_HALF_LIFE_PRESSES,
  CONFIDENCE_ACCURACY_CAP,
  CONFIDENCE_TIME_NUMERATOR_MS,
  FADE_LEVEL1_ACCURACY,
  FADE_LEVEL1_MIN_SESSIONS,
  FADE_LEVEL2_SPEED_FRACTION,
  FADE_LEVEL3_CONSECUTIVE_SESSIONS,
  FADE_PRESS_WINDOW,
  FADE_STEP_BACK_ACCURACY,
  FLUENCY_TARGET_RISE_WPM,
  RETRAIN_FULL_GROUPS_BEFORE_MERGE,
  RETRAIN_GROUP_MERGE_SIZE,
  REVIEW_CONFIDENCE_THRESHOLD,
  REVIEW_INTERVAL_MAX_DAYS,
  SLOWEST_PAIR_DRILL_COUNT,
  TARGET_WPM_FOUNDATIONS_START,
  TARGET_WPM_INCREMENT_PER_UNLOCK,
  TARGET_WPM_OTHER_TRACK_PROBE_FRACTION,
  TIME_TO_TYPE_PAUSE_THRESHOLD_MS,
  UNLOCK_ACCURACY_THRESHOLD,
  UNLOCK_CONFIDENCE_THRESHOLD,
} from './params.js';
import type { GuideLevel, KeyStat, Learner, PairStat, Track } from './types.js';

/** Target milliseconds per character at the learner's goal WPM (§04). */
export function targetMsPerChar(targetWpm: number): number {
  if (targetWpm <= 0) {
    throw new RangeError('targetWpm must be positive');
  }
  return CONFIDENCE_TIME_NUMERATOR_MS / targetWpm;
}

/**
 * Key confidence c = min(1, T/t) × min(1, a/0.95) (§04).
 */
export function confidence(
  accuracyValue: number,
  timeToTypeMs: number,
  targetWpm: number,
): number {
  const tTarget = targetMsPerChar(targetWpm);
  const speedFactor = timeToTypeMs <= 0 ? 1 : Math.min(1, tTarget / timeToTypeMs);
  const accuracyFactor = Math.min(1, accuracyValue / CONFIDENCE_ACCURACY_CAP);
  return speedFactor * accuracyFactor;
}

/** Pair confidence uses the same formula on the pair interval (§04). */
export function pairConfidence(
  pair: PairStat,
  targetWpm: number,
): number {
  return confidence(pair.accuracy, pair.timeToTypeMs, targetWpm);
}

/** Exponentially weighted accuracy after one keystroke (half-life in presses). */
export function updateAccuracyEwma(
  previousAccuracy: number,
  correctFirstAttempt: boolean,
  halfLifePresses: number = ACCURACY_EWMA_HALF_LIFE_PRESSES,
): number {
  const decay = 0.5 ** (1 / halfLifePresses);
  const observation = correctFirstAttempt ? 1 : 0;
  return decay * previousAccuracy + (1 - decay) * observation;
}

function median(values: readonly number[]): number {
  if (values.length === 0) {
    return 0;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) {
    return sorted[mid]!;
  }
  return (sorted[mid - 1]! + sorted[mid]!) / 2;
}

/**
 * Update smoothed median time-to-type; ignores pauses > 2 s and first key of line (§04).
 */
export function recordKeyInterval(
  stat: KeyStat,
  intervalMs: number,
  options: { isFirstKeyOfLine: boolean },
): KeyStat {
  if (options.isFirstKeyOfLine) {
    return stat;
  }
  if (intervalMs > TIME_TO_TYPE_PAUSE_THRESHOLD_MS || intervalMs <= 0) {
    return stat;
  }
  const recent = [...stat.recentIntervalsMs, intervalMs];
  const windowed = recent.slice(-FADE_PRESS_WINDOW);
  return {
    ...stat,
    recentIntervalsMs: windowed,
    timeToTypeMs: median(windowed),
  };
}

/** Window accuracy over the last up to 40 first attempts (C17). */
export function windowAccuracy(stat: KeyStat): number {
  const window = stat.recentFirstAttempts.slice(-FADE_PRESS_WINDOW);
  if (window.length === 0) {
    return 1;
  }
  let sum = 0;
  for (const v of window) {
    sum += v;
  }
  return sum / window.length;
}

export function createKeyStat(code: string, level: GuideLevel = 0): KeyStat {
  return {
    code,
    accuracy: 1,
    timeToTypeMs: targetMsPerChar(TARGET_WPM_FOUNDATIONS_START),
    recentIntervalsMs: [],
    recentFirstAttempts: [],
    sessionsWithKey: 0,
    presses: 0,
    level,
    lastPractisedIso: undefined,
    stableSessions: 0,
  };
}

export function createPairStat(pair: string): PairStat {
  return {
    pair,
    accuracy: 1,
    timeToTypeMs: targetMsPerChar(TARGET_WPM_FOUNDATIONS_START),
    recentIntervalsMs: [],
    count: 0,
  };
}

/**
 * Record one scored keystroke against a key (not peeked for level advances).
 */
export function recordKeyPress(
  stat: KeyStat,
  options: {
    correctFirstAttempt: boolean;
    intervalMs: number;
    isFirstKeyOfLine: boolean;
    peeked: boolean;
    practisedIso: string;
  },
): KeyStat {
  let next = recordKeyInterval(stat, options.intervalMs, {
    isFirstKeyOfLine: options.isFirstKeyOfLine,
  });
  next = {
    ...next,
    accuracy: updateAccuracyEwma(next.accuracy, options.correctFirstAttempt),
    recentFirstAttempts: [
      ...next.recentFirstAttempts,
      options.correctFirstAttempt ? 1 : 0,
    ].slice(-FADE_PRESS_WINDOW),
    presses: next.presses + 1,
    lastPractisedIso: options.practisedIso,
  };
  if (options.peeked) {
    return next;
  }
  return applyFadeRules(next, { peeked: false });
}

export function recordPairPress(
  pair: PairStat,
  options: {
    correctFirstAttempt: boolean;
    intervalMs: number;
  },
): PairStat {
  let intervals = pair.recentIntervalsMs;
  let timeToTypeMs = pair.timeToTypeMs;
  if (
    options.intervalMs > 0 &&
    options.intervalMs <= TIME_TO_TYPE_PAUSE_THRESHOLD_MS
  ) {
    intervals = [...pair.recentIntervalsMs, options.intervalMs].slice(
      -FADE_PRESS_WINDOW,
    );
    timeToTypeMs = median(intervals);
  }
  return {
    ...pair,
    accuracy: updateAccuracyEwma(pair.accuracy, options.correctFirstAttempt),
    recentIntervalsMs: intervals,
    timeToTypeMs,
    count: pair.count + 1,
  };
}

/**
 * After a press: step back if window accuracy falls below 90% (C17).
 * Step-ups run at session end via `endSessionFadeUpdate` (need session counts / target WPM).
 */
export function applyFadeRules(
  stat: KeyStat,
  options: { peeked: boolean } = { peeked: false },
): KeyStat {
  if (options.peeked) {
    return stat;
  }
  const winAcc = windowAccuracy(stat);
  if (
    winAcc < FADE_STEP_BACK_ACCURACY &&
    stat.level > 0 &&
    stat.recentFirstAttempts.length >= FADE_PRESS_WINDOW
  ) {
    return {
      ...stat,
      level: (stat.level - 1) as GuideLevel,
      stableSessions: 0,
    };
  }
  return stat;
}

/**
 * End-of-session fade update with the learner's actual target WPM (L1→L2 / L2→L3).
 */
export function endSessionFadeUpdate(
  stat: KeyStat,
  targetWpm: number,
  options: { peekedOnly: boolean },
): KeyStat {
  if (options.peekedOnly) {
    return { ...stat, sessionsWithKey: stat.sessionsWithKey + 1 };
  }
  const withSession = {
    ...stat,
    sessionsWithKey: stat.sessionsWithKey + 1,
  };
  const winAcc = windowAccuracy(withSession);
  let level = withSession.level;
  let stableSessions = withSession.stableSessions;
  const tTarget = targetMsPerChar(targetWpm);

  if (winAcc < FADE_STEP_BACK_ACCURACY && level > 0) {
    return {
      ...withSession,
      level: (level - 1) as GuideLevel,
      stableSessions: 0,
    };
  }

  if (level === 0) {
    if (
      withSession.sessionsWithKey >= FADE_LEVEL1_MIN_SESSIONS &&
      winAcc >= FADE_LEVEL1_ACCURACY &&
      withSession.recentFirstAttempts.length >= Math.min(10, FADE_PRESS_WINDOW)
    ) {
      // Allow advance after 2 sessions even before a full 40-press window fills
      if (
        withSession.recentFirstAttempts.length >= FADE_PRESS_WINDOW ||
        withSession.sessionsWithKey >= FADE_LEVEL1_MIN_SESSIONS
      ) {
        if (winAcc >= FADE_LEVEL1_ACCURACY) {
          level = 1;
        }
      }
    }
  } else if (level === 1) {
    const maxMsForL2 = tTarget / FADE_LEVEL2_SPEED_FRACTION;
    if (
      winAcc >= FADE_LEVEL1_ACCURACY &&
      withSession.timeToTypeMs > 0 &&
      withSession.timeToTypeMs <= maxMsForL2
    ) {
      level = 2;
      stableSessions = 0;
    }
  } else if (level === 2) {
    const atTarget =
      withSession.timeToTypeMs > 0 && withSession.timeToTypeMs <= tTarget;
    if (atTarget) {
      stableSessions += 1;
      if (stableSessions >= FADE_LEVEL3_CONSECUTIVE_SESSIONS) {
        level = 3;
        stableSessions = 0;
      }
    } else {
      stableSessions = 0;
    }
  }

  return { ...withSession, level, stableSessions };
}

export function keyConfidence(stat: KeyStat, targetWpm: number): number {
  return confidence(stat.accuracy, stat.timeToTypeMs, targetWpm);
}

/** Focus key = unlocked key with lowest confidence (§04). */
export function selectFocusKey(
  keys: readonly KeyStat[],
  targetWpm: number,
): KeyStat {
  if (keys.length === 0) {
    throw new RangeError('no unlocked keys');
  }
  let best = keys[0]!;
  let bestC = keyConfidence(best, targetWpm);
  for (let i = 1; i < keys.length; i += 1) {
    const k = keys[i]!;
    const c = keyConfidence(k, targetWpm);
    if (c < bestC || (c === bestC && k.code < best.code)) {
      best = k;
      bestC = c;
    }
  }
  return best;
}

export function canUnlockNextGroup(
  keys: readonly KeyStat[],
  targetWpm: number,
): boolean {
  if (keys.length === 0) {
    return false;
  }
  return keys.every(
    (k) =>
      k.accuracy >= UNLOCK_ACCURACY_THRESHOLD &&
      keyConfidence(k, targetWpm) >= UNLOCK_CONFIDENCE_THRESHOLD,
  );
}

/** Spaced review interval in days (§04 / EU-016). */
export function reviewIntervalDays(stat: KeyStat, targetWpm: number): number {
  if (keyConfidence(stat, targetWpm) >= REVIEW_CONFIDENCE_THRESHOLD) {
    return Math.min(REVIEW_INTERVAL_MAX_DAYS, 2 ** stat.stableSessions);
  }
  return 1;
}

export function isDueForReview(
  stat: KeyStat,
  targetWpm: number,
  nowIso: string,
): boolean {
  if (!stat.lastPractisedIso) {
    return true;
  }
  const last = Date.parse(stat.lastPractisedIso);
  const now = Date.parse(nowIso);
  if (Number.isNaN(last) || Number.isNaN(now)) {
    return true;
  }
  const days = (now - last) / 86_400_000;
  return days >= reviewIntervalDays(stat, targetWpm);
}

export function startingTargetWpm(
  track: Track,
  probeB3NetWpm: number,
): number {
  if (track === 'foundations') {
    return TARGET_WPM_FOUNDATIONS_START;
  }
  return Math.max(
    TARGET_WPM_FOUNDATIONS_START,
    TARGET_WPM_OTHER_TRACK_PROBE_FRACTION * probeB3NetWpm,
  );
}

export function targetWpmAfterUnlocks(
  startTarget: number,
  unlockedGroupCount: number,
  goalWpm: number,
): number {
  const rises = Math.max(0, unlockedGroupCount - 1);
  return Math.min(
    goalWpm,
    startTarget + rises * TARGET_WPM_INCREMENT_PER_UNLOCK,
  );
}

export function tryUnlockNextGroup(learner: Learner): Learner {
  if (!canUnlockNextGroup(learner.keys, learner.targetWpm)) {
    return learner;
  }
  const nextGroups = learner.unlockedGroupCount + 1;
  return {
    ...learner,
    unlockedGroupCount: nextGroups,
    targetWpm: Math.min(
      learner.goalWpm,
      learner.targetWpm + TARGET_WPM_INCREMENT_PER_UNLOCK,
    ),
  };
}

/**
 * Map Retrain logical unlock count to physical learn-order groups (EU-031 PO default).
 * First RETRAIN_FULL_GROUPS_BEFORE_MERGE unlocks are 1:1; later unlocks advance by
 * RETRAIN_GROUP_MERGE_SIZE physical groups each.
 */
export function retrainPhysicalGroups(
  logicalUnlocked: number,
  totalGroups: number,
): number {
  if (logicalUnlocked <= 0) {
    return 0;
  }
  if (logicalUnlocked <= RETRAIN_FULL_GROUPS_BEFORE_MERGE) {
    return Math.min(logicalUnlocked, totalGroups);
  }
  const mergedSteps = logicalUnlocked - RETRAIN_FULL_GROUPS_BEFORE_MERGE;
  const physical =
    RETRAIN_FULL_GROUPS_BEFORE_MERGE + mergedSteps * RETRAIN_GROUP_MERGE_SIZE;
  return Math.min(physical, totalGroups);
}

/**
 * Unlock count used for generation / layout prefixes.
 * Retrain maps logical unlocks through retrainPhysicalGroups; other tracks pass through.
 */
export function effectiveUnlockGroupCount(
  layoutGroupCount: number,
  unlockedGroupCount: number,
  track: Track,
): number {
  if (track === 'retrain') {
    return retrainPhysicalGroups(unlockedGroupCount, layoutGroupCount);
  }
  return Math.min(Math.max(0, unlockedGroupCount), layoutGroupCount);
}

/**
 * Slowest letter pairs by ascending pair confidence (§04 Chunk / FR-20).
 */
export function slowestPairs(
  pairs: readonly PairStat[],
  targetWpm: number,
  count: number = SLOWEST_PAIR_DRILL_COUNT,
): PairStat[] {
  return [...pairs]
    .sort((a, b) => {
      const ca = pairConfidence(a, targetWpm);
      const cb = pairConfidence(b, targetWpm);
      if (ca !== cb) {
        return ca - cb;
      }
      return a.pair.localeCompare(b.pair);
    })
    .slice(0, Math.max(0, count));
}

/**
 * Fluency target rise after a session where the slowest pairs improved (EU-033 PO default).
 * Caller may pass `pairsImproved` directly when that is easier than recomputing means.
 */
export function fluencyTargetAfterSession(
  currentTargetWpm: number,
  goalWpm: number,
  pairsImproved: boolean,
): number {
  if (!pairsImproved) {
    return currentTargetWpm;
  }
  return Math.min(goalWpm, currentTargetWpm + FLUENCY_TARGET_RISE_WPM);
}
