import {
  DEFAULT_GOAL_WPM,
  PLACEMENT_BLIND_ACCURACY_THRESHOLD,
  PLACEMENT_BLIND_TO_SIGHTED_RATIO,
  PLACEMENT_BLIND_WPM_THRESHOLD,
  PLACEMENT_HOME_SCORE_THRESHOLD,
  PLACEMENT_SIGHTED_WPM_THRESHOLD,
  PLACEMENT_TIE_BAND,
} from './params.js';
import { startingTargetWpm } from './mastery.js';
import type { Track } from './types.js';

export type Q2Choice = 1 | 2 | 3 | 4;

export interface PlacementInput {
  readonly blindAccuracy: number;
  readonly homeScore: number;
  readonly sightedWpm: number;
  readonly blindWpm: number;
  /** Question 2 option 1–4 (C6). */
  readonly q2: Q2Choice;
}

export interface PlacementResult {
  readonly placedTrack: Track;
  /** Phase 1 active track (C7): Retrain→Foundations, Fluency→Adaptive. */
  readonly activeTrack: Track;
  readonly reason: string;
  readonly targetWpm: number;
  readonly goalWpm: number;
  readonly tied: boolean;
}

function q2ToTrack(q2: Q2Choice): Track {
  switch (q2) {
    case 1:
      return 'foundations';
    case 2:
      return 'retrain';
    case 3:
      return 'adaptive';
    case 4:
      return 'fluency';
  }
}

function withinTie(value: number, threshold: number): boolean {
  if (threshold === 0) {
    return Math.abs(value - threshold) <= PLACEMENT_TIE_BAND;
  }
  return Math.abs(value - threshold) / threshold <= PLACEMENT_TIE_BAND;
}

function activeForPhase1(placed: Track): Track {
  if (placed === 'retrain') return 'foundations';
  if (placed === 'fluency') return 'adaptive';
  return placed;
}

/**
 * Placement rules from §03 with C6 tie band and C7/C8 Phase 1 mapping.
 */
export function placeLearner(input: PlacementInput): PlacementResult {
  const { blindAccuracy, homeScore, sightedWpm, blindWpm, q2 } = input;
  let placed: Track;
  let tied = false;
  let reason: string;

  const blindAccTie = withinTie(blindAccuracy, PLACEMENT_BLIND_ACCURACY_THRESHOLD);
  const homeTie = withinTie(homeScore, PLACEMENT_HOME_SCORE_THRESHOLD);
  const sightedTie = withinTie(sightedWpm, PLACEMENT_SIGHTED_WPM_THRESHOLD);
  const blindWpmTie = withinTie(blindWpm, PLACEMENT_BLIND_WPM_THRESHOLD);
  const ratio = sightedWpm > 0 ? blindWpm / sightedWpm : 0;
  const ratioTie = withinTie(ratio, PLACEMENT_BLIND_TO_SIGHTED_RATIO);

  const highBranch =
    blindAccuracy >= PLACEMENT_BLIND_ACCURACY_THRESHOLD &&
    homeScore >= PLACEMENT_HOME_SCORE_THRESHOLD;
  const highBranchTie = blindAccTie || homeTie;

  if (highBranch || highBranchTie) {
    if (highBranchTie && !highBranch) {
      tied = true;
      placed = q2ToTrack(q2);
      reason = 'Near the home-row threshold; your typing style chose the track.';
    } else {
      const fluency =
        blindWpm >= PLACEMENT_BLIND_WPM_THRESHOLD &&
        blindWpm >= PLACEMENT_BLIND_TO_SIGHTED_RATIO * sightedWpm;
      const fluencyTie = blindWpmTie || ratioTie;
      if (fluencyTie && !fluency) {
        tied = true;
        placed = q2ToTrack(q2);
        reason = 'Near the fluency speed threshold; your typing style chose the track.';
      } else if (fluency) {
        placed = 'fluency';
        reason = 'Strong blind accuracy and speed on the home row.';
      } else {
        placed = 'adaptive';
        reason = 'Good home-row feel; we will fill the gaps.';
      }
    }
  } else {
    if (sightedTie) {
      tied = true;
      placed = q2ToTrack(q2);
      reason = 'Near the sighted-speed threshold; your typing style chose the track.';
    } else if (sightedWpm >= PLACEMENT_SIGHTED_WPM_THRESHOLD) {
      placed = 'retrain';
      reason = 'Fast when looking; we will retrain for eyes-up typing.';
    } else {
      placed = 'foundations';
      reason = 'We will build posture, home row and finger zones from the start.';
    }
  }

  const activeTrack = activeForPhase1(placed);
  const targetWpm = startingTargetWpm(activeTrack, blindWpm);

  return {
    placedTrack: placed,
    activeTrack,
    reason,
    targetWpm,
    goalWpm: DEFAULT_GOAL_WPM,
    tied,
  };
}
