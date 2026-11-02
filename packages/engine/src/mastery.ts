import {
  ACCURACY_EWMA_HALF_LIFE_PRESSES,
  CONFIDENCE_ACCURACY_CAP,
  CONFIDENCE_TIME_NUMERATOR_MS,
  FADE_PRESS_WINDOW,
  TIME_TO_TYPE_PAUSE_THRESHOLD_MS,
} from './params.js';
import type { KeyStat } from './types.js';

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
  accuracy: number,
  timeToTypeMs: number,
  targetWpm: number,
): number {
  const tTarget = targetMsPerChar(targetWpm);
  const speedFactor = timeToTypeMs <= 0 ? 1 : Math.min(1, tTarget / timeToTypeMs);
  const accuracyFactor = Math.min(1, accuracy / CONFIDENCE_ACCURACY_CAP);
  return speedFactor * accuracyFactor;
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

export function createKeyStat(code: string): KeyStat {
  return {
    code,
    accuracy: 1,
    timeToTypeMs: targetMsPerChar(30),
    recentIntervalsMs: [],
    level: 0,
    lastPractisedIso: undefined,
    stableSessions: 0,
  };
}
