import { COMMIT_WEEK_BLIND_WPM, COMMIT_WEEK_DAYS } from './params.js';

export interface CanStartCommitWeekArgs {
  readonly allLettersUnlocked: boolean;
  readonly blindWpm: number;
}

/**
 * Commit Week unlock (FR-19 / EU-032): all letters unlocked and blind ≥ 25 WPM.
 */
export function canStartCommitWeek(args: CanStartCommitWeekArgs): boolean {
  return args.allLettersUnlocked && args.blindWpm >= COMMIT_WEEK_BLIND_WPM;
}

/** Commit Week is complete after COMMIT_WEEK_DAYS daily check-ins. */
export function commitWeekComplete(checkIns: number): boolean {
  return checkIns >= COMMIT_WEEK_DAYS;
}
