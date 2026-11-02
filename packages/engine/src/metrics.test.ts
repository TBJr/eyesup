import { describe, expect, it } from 'vitest';
import {
  accuracy,
  blindShare,
  consistency,
  crossoverGap,
  grossWpm,
  netWpm,
  peekRate,
  rolloverShare,
} from './metrics.js';

describe('metrics', () => {
  it('computes gross and net WPM', () => {
    expect(grossWpm(300, 60_000)).toBeCloseTo(60, 5);
    expect(netWpm(300, 5, 60_000)).toBeCloseTo(55, 5);
    expect(grossWpm(10, 0)).toBe(0);
  });

  it('computes accuracy, blind share, peek rate and rollover', () => {
    expect(accuracy(95, 100)).toBeCloseTo(0.95, 5);
    expect(accuracy(0, 0)).toBe(1);
    expect(blindShare(25, 100)).toBeCloseTo(0.25, 5);
    expect(blindShare(1, 0)).toBe(0);
    expect(peekRate(2, 100)).toBeCloseTo(2, 5);
    expect(peekRate(1, 0)).toBe(0);
    expect(rolloverShare(10, 50)).toBeCloseTo(0.2, 5);
    expect(rolloverShare(1, 0)).toBe(0);
  });

  it('computes consistency and crossover gap', () => {
    expect(consistency([100, 100, 100])).toBeCloseTo(1, 5);
    expect(consistency([100])).toBe(1);
    expect(consistency([0, 0])).toBe(0);
    expect(consistency([100, 200, 100])).toBeLessThan(1);
    expect(crossoverGap(40, 50)).toBe(-10);
    expect(netWpm(10, 0, 0)).toBe(0);
  });
});
