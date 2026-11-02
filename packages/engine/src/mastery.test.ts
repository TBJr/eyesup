import { describe, expect, it } from 'vitest';
import {
  confidence,
  createKeyStat,
  recordKeyInterval,
  targetMsPerChar,
  updateAccuracyEwma,
} from './mastery.js';

describe('mastery helpers', () => {
  it('rejects non-positive target WPM', () => {
    expect(() => targetMsPerChar(0)).toThrow(RangeError);
  });

  it('creates a fresh key stat', () => {
    const stat = createKeyStat('KeyA');
    expect(stat.code).toBe('KeyA');
    expect(stat.recentIntervalsMs).toEqual([]);
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
});
