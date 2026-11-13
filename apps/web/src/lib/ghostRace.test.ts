import { describe, expect, it, beforeEach } from 'vitest';
import {
  buildGhostFromLinePlay,
  clearBestGhostStore,
  getBestGhost,
  ghostCaretAt,
  hashPracticeText,
  maybeSaveBestGhost,
  recordGhostSample,
} from './ghostRace.js';

describe('ghostRace', () => {
  beforeEach(() => {
    clearBestGhostStore();
  });

  it('hashPracticeText is stable', () => {
    expect(hashPracticeText('abc')).toBe(hashPracticeText('abc'));
    expect(hashPracticeText('abc')).not.toBe(hashPracticeText('abd'));
  });

  it('recordGhostSample appends in order and skips regressions', () => {
    const samples = recordGhostSample([], 0, 0);
    recordGhostSample(samples, 100, 1);
    recordGhostSample(samples, 50, 2);
    recordGhostSample(samples, 100, 1);
    expect(samples).toEqual([
      { ms: 0, caret: 0 },
      { ms: 100, caret: 1 },
    ]);
  });

  it('buildGhostFromLinePlay prepends origin and sets duration', () => {
    const ghost = buildGhostFromLinePlay({
      textHash: 't1',
      samples: [
        { ms: 80, caret: 2 },
        { ms: 200, caret: 5 },
      ],
      durationMs: 250,
    });
    expect(ghost.samples[0]).toEqual({ ms: 0, caret: 0 });
    expect(ghost.durationMs).toBe(250);
  });

  it('ghostCaretAt steps through samples', () => {
    const ghost = buildGhostFromLinePlay({
      textHash: 't2',
      samples: [
        { ms: 0, caret: 0 },
        { ms: 100, caret: 3 },
        { ms: 200, caret: 7 },
      ],
    });
    expect(ghostCaretAt(ghost, 0)).toBe(0);
    expect(ghostCaretAt(ghost, 99)).toBe(0);
    expect(ghostCaretAt(ghost, 100)).toBe(3);
    expect(ghostCaretAt(ghost, 150)).toBe(3);
    expect(ghostCaretAt(ghost, 500)).toBe(7);
  });

  it('maybeSaveBestGhost keeps the faster run', () => {
    const hash = hashPracticeText('same text');
    const slow = buildGhostFromLinePlay({
      textHash: hash,
      samples: [
        { ms: 0, caret: 0 },
        { ms: 400, caret: 10 },
      ],
    });
    const fast = buildGhostFromLinePlay({
      textHash: hash,
      samples: [
        { ms: 0, caret: 0 },
        { ms: 200, caret: 10 },
      ],
    });
    expect(maybeSaveBestGhost(slow)).toBe(true);
    expect(maybeSaveBestGhost(fast)).toBe(true);
    expect(getBestGhost(hash)?.durationMs).toBe(200);
    expect(maybeSaveBestGhost(slow)).toBe(false);
  });
});
