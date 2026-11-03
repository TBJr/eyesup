import { describe, expect, it } from 'vitest';
import { projectCrossoverSession } from './crossover.js';

describe('projectCrossoverSession (EU-031)', () => {
  it('returns crossed with zero projection when blind already meets day-1 sighted', () => {
    const result = projectCrossoverSession(40, [30, 35, 42]);
    expect(result.crossed).toBe(true);
    expect(result.projectedSessionsFromNow).toBe(0);
    expect(result.gap).toBe(2);
  });

  it('returns null when slope is non-positive and not crossed', () => {
    const flat = projectCrossoverSession(40, [20, 20, 20]);
    expect(flat.crossed).toBe(false);
    expect(flat.projectedSessionsFromNow).toBe(null);
    expect(flat.gap).toBe(-20);

    const falling = projectCrossoverSession(40, [30, 25, 20]);
    expect(falling.projectedSessionsFromNow).toBe(null);
  });

  it('projects sessions from a rising blind series', () => {
    // Blind: 20, 25, 30 at indices 0,1,2 → slope 5, intercept 20.
    // Reach 40 at x = 4; from last (2) → 2 sessions.
    const result = projectCrossoverSession(40, [20, 25, 30]);
    expect(result.crossed).toBe(false);
    expect(result.gap).toBe(-10);
    expect(result.projectedSessionsFromNow).toBe(2);
  });

  it('needs at least two points to fit a line', () => {
    expect(projectCrossoverSession(40, []).projectedSessionsFromNow).toBe(null);
    expect(projectCrossoverSession(40, [20]).projectedSessionsFromNow).toBe(null);
  });
});
