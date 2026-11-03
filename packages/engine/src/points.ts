import {
  EYES_UP_POINTS_L0,
  EYES_UP_POINTS_L1,
  EYES_UP_POINTS_L2,
  EYES_UP_POINTS_L3,
} from './params.js';
import type { GuideLevel } from './types.js';

const BY_LEVEL: readonly number[] = [
  EYES_UP_POINTS_L0,
  EYES_UP_POINTS_L1,
  EYES_UP_POINTS_L2,
  EYES_UP_POINTS_L3,
];

/**
 * Eyes-up reward points for one keystroke (C10 / FR-19).
 * Peeked strokes always score as L0 so looking never earns the multiplier.
 */
export function eyesUpPoints(level: GuideLevel, peeked: boolean): number {
  if (peeked) {
    return EYES_UP_POINTS_L0;
  }
  return BY_LEVEL[level] ?? EYES_UP_POINTS_L0;
}
