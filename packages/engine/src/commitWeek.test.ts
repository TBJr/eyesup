import { describe, expect, it } from 'vitest';
import { canStartCommitWeek, commitWeekComplete } from './commitWeek.js';
import { COMMIT_WEEK_BLIND_WPM, COMMIT_WEEK_DAYS } from './params.js';

describe('commit week (EU-032)', () => {
  it('requires all letters unlocked and blind WPM at the threshold', () => {
    expect(
      canStartCommitWeek({ allLettersUnlocked: true, blindWpm: COMMIT_WEEK_BLIND_WPM }),
    ).toBe(true);
    expect(
      canStartCommitWeek({
        allLettersUnlocked: true,
        blindWpm: COMMIT_WEEK_BLIND_WPM - 1,
      }),
    ).toBe(false);
    expect(
      canStartCommitWeek({ allLettersUnlocked: false, blindWpm: 40 }),
    ).toBe(false);
  });

  it('completes after the configured number of check-ins', () => {
    expect(commitWeekComplete(COMMIT_WEEK_DAYS - 1)).toBe(false);
    expect(commitWeekComplete(COMMIT_WEEK_DAYS)).toBe(true);
    expect(commitWeekComplete(COMMIT_WEEK_DAYS + 2)).toBe(true);
  });
});
