import { describe, expect, it } from 'vitest';
import { applyPracticeDay } from './streak.js';

describe('applyPracticeDay', () => {
  it('starts a streak on first practice', () => {
    const next = applyPracticeDay(
      { streakDays: 0, lastPracticeDate: null, restDaysUsedThisWeek: 0, weekStartIso: null },
      '2026-11-10',
    );
    expect(next.streakDays).toBe(1);
    expect(next.lastPracticeDate).toBe('2026-11-10');
  });

  it('increments on consecutive days', () => {
    const next = applyPracticeDay(
      {
        streakDays: 3,
        lastPracticeDate: '2026-11-10',
        restDaysUsedThisWeek: 0,
        weekStartIso: '2026-11-09',
      },
      '2026-11-11',
    );
    expect(next.streakDays).toBe(4);
  });

  it('allows one rest day without breaking streak', () => {
    const next = applyPracticeDay(
      {
        streakDays: 5,
        lastPracticeDate: '2026-11-10',
        restDaysUsedThisWeek: 0,
        weekStartIso: '2026-11-09',
      },
      '2026-11-12',
    );
    expect(next.streakDays).toBe(6);
    expect(next.restDaysUsedThisWeek).toBe(1);
  });

  it('resets after a second gap in the same week', () => {
    const next = applyPracticeDay(
      {
        streakDays: 6,
        lastPracticeDate: '2026-11-10',
        restDaysUsedThisWeek: 1,
        weekStartIso: '2026-11-09',
      },
      '2026-11-12',
    );
    expect(next.streakDays).toBe(1);
  });
});
