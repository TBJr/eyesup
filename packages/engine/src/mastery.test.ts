import { describe, expect, it } from 'vitest';
import {
  canUnlockNextGroup,
  confidence,
  createKeyStat,
  createPairStat,
  endSessionFadeUpdate,
  isDueForReview,
  keyConfidence,
  pairConfidence,
  recordKeyInterval,
  recordKeyPress,
  recordPairPress,
  reviewIntervalDays,
  selectFocusKey,
  startingTargetWpm,
  targetMsPerChar,
  targetWpmAfterUnlocks,
  tryUnlockNextGroup,
  updateAccuracyEwma,
  windowAccuracy,
} from './mastery.js';
import type { Learner } from './types.js';
import { FADE_PRESS_WINDOW } from './params.js';

describe('mastery helpers', () => {
  it('rejects non-positive target WPM', () => {
    expect(() => targetMsPerChar(0)).toThrow(RangeError);
  });

  it('creates a fresh key stat', () => {
    const stat = createKeyStat('KeyA');
    expect(stat.code).toBe('KeyA');
    expect(stat.recentIntervalsMs).toEqual([]);
    expect(stat.recentFirstAttempts).toEqual([]);
  });

  it('skips first-key intervals and zero timing', () => {
    const base = createKeyStat('KeyF');
    const first = recordKeyInterval(base, 120, { isFirstKeyOfLine: true });
    expect(first.recentIntervalsMs).toEqual([]);
    const updated = recordKeyInterval(first, 0, { isFirstKeyOfLine: false });
    expect(updated.recentIntervalsMs).toEqual([]);
  });

  it('caps confidence at one when faster than target', () => {
    expect(confidence(0.95, 200, 30)).toBeCloseTo(0.95 / 0.95, 5);
    expect(updateAccuracyEwma(0.5, true)).toBeGreaterThan(0.5);
  });

  it('matches worked example: t=500ms a=0.95 at 30 WPM → c=0.8', () => {
    expect(confidence(0.95, 500, 30)).toBeCloseTo(0.8, 5);
  });

  it('selects the lowest-confidence focus key', () => {
    const weak = createKeyStat('KeyA');
    weak.accuracy = 0.5;
    weak.timeToTypeMs = 800;
    const strong = createKeyStat('KeyS');
    strong.accuracy = 0.99;
    strong.timeToTypeMs = 200;
    expect(selectFocusKey([strong, weak], 30).code).toBe('KeyA');
  });

  it('unlocks only when every key meets accuracy and confidence gates', () => {
    const ready = createKeyStat('KeyA');
    ready.accuracy = 0.95;
    ready.timeToTypeMs = 400;
    expect(canUnlockNextGroup([ready], 30)).toBe(true);
    const notReady = { ...ready, accuracy: 0.9 };
    expect(canUnlockNextGroup([notReady], 30)).toBe(false);
  });

  it('keeps L0 for the first two sessions then can reach L1 (C17)', () => {
    let stat = createKeyStat('KeyF');
    for (let i = 0; i < FADE_PRESS_WINDOW; i += 1) {
      stat = recordKeyPress(stat, {
        correctFirstAttempt: true,
        intervalMs: 300,
        isFirstKeyOfLine: false,
        peeked: false,
        practisedIso: '2026-01-01T00:00:00.000Z',
      });
    }
    expect(stat.level).toBe(0);
    stat = endSessionFadeUpdate(stat, 30, { peekedOnly: false });
    expect(stat.sessionsWithKey).toBe(1);
    expect(stat.level).toBe(0);
    for (let i = 0; i < FADE_PRESS_WINDOW; i += 1) {
      stat = recordKeyPress(stat, {
        correctFirstAttempt: true,
        intervalMs: 300,
        isFirstKeyOfLine: false,
        peeked: false,
        practisedIso: '2026-01-02T00:00:00.000Z',
      });
    }
    stat = endSessionFadeUpdate(stat, 30, { peekedOnly: false });
    expect(stat.sessionsWithKey).toBe(2);
    expect(stat.level).toBe(1);
    expect(windowAccuracy(stat)).toBeGreaterThanOrEqual(0.95);
  });

  it('does not advance fade level on peeked presses', () => {
    let stat = createKeyStat('KeyJ');
    stat = { ...stat, sessionsWithKey: 2, level: 0 };
    for (let i = 0; i < FADE_PRESS_WINDOW; i += 1) {
      stat = recordKeyPress(stat, {
        correctFirstAttempt: true,
        intervalMs: 300,
        isFirstKeyOfLine: false,
        peeked: true,
        practisedIso: '2026-01-01T00:00:00.000Z',
      });
    }
    expect(stat.level).toBe(0);
  });

  it('steps back a level below 90% over the last 40 presses', () => {
    let stat = createKeyStat('KeyK');
    stat = { ...stat, level: 2, sessionsWithKey: 5 };
    for (let i = 0; i < FADE_PRESS_WINDOW; i += 1) {
      stat = recordKeyPress(stat, {
        correctFirstAttempt: i % 5 !== 0,
        intervalMs: 300,
        isFirstKeyOfLine: false,
        peeked: false,
        practisedIso: '2026-01-01T00:00:00.000Z',
      });
    }
    expect(windowAccuracy(stat)).toBeLessThan(0.9);
    expect(stat.level).toBeLessThan(2);
  });

  it('doubles spaced-review interval up to 30 days', () => {
    const stat = createKeyStat('KeyD');
    stat.accuracy = 0.99;
    stat.timeToTypeMs = 200;
    stat.stableSessions = 0;
    expect(reviewIntervalDays(stat, 30)).toBe(1);
    stat.stableSessions = 1;
    expect(keyConfidence(stat, 30)).toBeGreaterThanOrEqual(0.9);
    expect(reviewIntervalDays(stat, 30)).toBe(2);
    stat.stableSessions = 10;
    expect(reviewIntervalDays(stat, 30)).toBe(30);
  });

  it('starts Foundations at 15 WPM and others at 80% of probe B3 (C8)', () => {
    expect(startingTargetWpm('foundations', 40)).toBe(15);
    expect(startingTargetWpm('adaptive', 40)).toBe(32);
    expect(startingTargetWpm('retrain', 10)).toBe(15);
  });

  it('advances L1 to L2 at 95% and 60% of target speed', () => {
    let stat = createKeyStat('KeyL');
    stat = {
      ...stat,
      level: 1,
      sessionsWithKey: 4,
      timeToTypeMs: 500,
      recentFirstAttempts: Array.from({ length: FADE_PRESS_WINDOW }, () => 1),
      accuracy: 0.98,
    };
    // At 30 WPM, T=400; 60% speed ⇒ time ≤ 400/0.6 ≈ 666
    stat = endSessionFadeUpdate(stat, 30, { peekedOnly: false });
    expect(stat.level).toBe(2);
  });

  it('advances L2 to L3 after two sessions at target speed', () => {
    let stat = createKeyStat('KeyO');
    stat = {
      ...stat,
      level: 2,
      sessionsWithKey: 6,
      timeToTypeMs: 350,
      recentFirstAttempts: Array.from({ length: FADE_PRESS_WINDOW }, () => 1),
      accuracy: 0.99,
      stableSessions: 0,
    };
    stat = endSessionFadeUpdate(stat, 30, { peekedOnly: false });
    expect(stat.level).toBe(2);
    expect(stat.stableSessions).toBe(1);
    stat = endSessionFadeUpdate(stat, 30, { peekedOnly: false });
    expect(stat.level).toBe(3);
  });

  it('marks keys due for review after the interval', () => {
    const fresh = createKeyStat('KeyZ');
    expect(isDueForReview(fresh, 30, '2026-01-10T00:00:00.000Z')).toBe(true);
    const practised = {
      ...createKeyStat('KeyZ'),
      accuracy: 0.99,
      timeToTypeMs: 200,
      stableSessions: 3,
      lastPractisedIso: '2026-01-01T00:00:00.000Z',
    };
    expect(isDueForReview(practised, 30, '2026-01-02T00:00:00.000Z')).toBe(false);
    expect(isDueForReview(practised, 30, '2026-02-01T00:00:00.000Z')).toBe(true);
  });

  it('updates pair stats and confidence', () => {
    let pair = createPairStat('th');
    pair = recordPairPress(pair, { correctFirstAttempt: true, intervalMs: 120 });
    expect(pair.count).toBe(1);
    expect(pairConfidence(pair, 30)).toBeGreaterThan(0);
  });

  it('raises target WPM on unlock up to the goal', () => {
    expect(targetWpmAfterUnlocks(15, 3, 30)).toBe(19);
    const learner: Learner = {
      layoutId: 'qwerty-us',
      track: 'foundations',
      targetWpm: 15,
      goalWpm: 30,
      unlockedGroupCount: 1,
      keys: [
        {
          ...createKeyStat('KeyA'),
          accuracy: 0.96,
          timeToTypeMs: 300,
        },
      ],
      pairs: [],
      sessionCount: 1,
      dailyMinutes: 12,
    };
    const next = tryUnlockNextGroup(learner);
    expect(next.unlockedGroupCount).toBe(2);
    expect(next.targetWpm).toBe(17);
  });
});

