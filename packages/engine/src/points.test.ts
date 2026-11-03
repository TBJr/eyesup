import { describe, expect, it } from 'vitest';
import { eyesUpPoints } from './points.js';
import {
  EYES_UP_POINTS_L0,
  EYES_UP_POINTS_L1,
  EYES_UP_POINTS_L2,
  EYES_UP_POINTS_L3,
} from './params.js';

describe('eyesUpPoints (C10 / EU-032)', () => {
  it('scores 1–4 by guide level when not peeked', () => {
    expect(eyesUpPoints(0, false)).toBe(EYES_UP_POINTS_L0);
    expect(eyesUpPoints(1, false)).toBe(EYES_UP_POINTS_L1);
    expect(eyesUpPoints(2, false)).toBe(EYES_UP_POINTS_L2);
    expect(eyesUpPoints(3, false)).toBe(EYES_UP_POINTS_L3);
  });

  it('always scores L0 points when peeked', () => {
    expect(eyesUpPoints(0, true)).toBe(EYES_UP_POINTS_L0);
    expect(eyesUpPoints(1, true)).toBe(EYES_UP_POINTS_L0);
    expect(eyesUpPoints(2, true)).toBe(EYES_UP_POINTS_L0);
    expect(eyesUpPoints(3, true)).toBe(EYES_UP_POINTS_L0);
  });
});
