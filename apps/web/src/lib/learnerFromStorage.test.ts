import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { parseLayout, type Layout } from '@eyesup/engine';
import {
  applyEndSessionFade,
  applyKeystrokeScores,
  createMasteryApplyState,
  seedUnlockedGroupKeys,
  unlockTargetCode,
} from './learnerFromStorage.js';
import type { KeystrokeScoreEvent } from './sessionPlayer.js';

const here = dirname(fileURLToPath(import.meta.url));
const layout: Layout = parseLayout(
  JSON.parse(
    readFileSync(join(here, '../../../../packages/layouts/qwerty-us.json'), 'utf8'),
  ) as unknown,
);

function score(partial: Partial<KeystrokeScoreEvent> & Pick<KeystrokeScoreEvent, 'expectedChar' | 'got'>): KeystrokeScoreEvent {
  return {
    correctFirstAttempt: partial.got === partial.expectedChar,
    intervalMs: 120,
    isFirstKeyOfLine: false,
    peeked: false,
    timeStamp: 1,
    ...partial,
  };
}

describe('applyKeystrokeScores', () => {
  it('updates accuracy presses and confidence fields', () => {
    const state = createMasteryApplyState([], [], {});
    let next = state;
    for (let i = 0; i < 5; i += 1) {
      next = applyKeystrokeScores(next, {
        layout,
        layoutId: 'qwerty-us',
        targetWpm: 15,
        nowIso: '2026-11-13T12:00:00.000Z',
        scores: [
          score({
            expectedChar: 'f',
            got: 'f',
            isFirstKeyOfLine: i === 0,
            intervalMs: i === 0 ? 0 : 120,
          }),
        ],
      });
    }
    const rec = next.keys.get('KeyF');
    expect(rec).toBeDefined();
    expect(rec!.presses).toBe(5);
    expect(rec!.unlockedAt).toBe('2026-11-13T12:00:00.000Z');
    expect(rec!.accuracy).toBeGreaterThan(0.9);
    expect(rec!.recentFirstAttempts.length).toBe(5);
    expect(next.levels.KeyF).toBe(rec!.guideLevel);
  });

  it('does not advance level on peeked presses alone', () => {
    const state = createMasteryApplyState([], [], { KeyF: 0 });
    let next = state;
    for (let i = 0; i < 12; i += 1) {
      next = applyKeystrokeScores(next, {
        layout,
        layoutId: 'qwerty-us',
        targetWpm: 15,
        nowIso: '2026-11-13T12:00:00.000Z',
        scores: [
          score({
            expectedChar: 'f',
            got: 'f',
            peeked: true,
            isFirstKeyOfLine: i === 0,
            intervalMs: i === 0 ? 0 : 100,
          }),
        ],
      });
    }
    expect(next.keys.get('KeyF')!.guideLevel).toBe(0);
    expect(next.peekedOnlyCodes.has('KeyF')).toBe(true);
  });

  it('records digraph pairs from consecutive expected chars', () => {
    let next = createMasteryApplyState([], [], {});
    next = applyKeystrokeScores(next, {
      layout,
      layoutId: 'qwerty-us',
      targetWpm: 15,
      nowIso: '2026-11-13T12:00:00.000Z',
      scores: [
        score({ expectedChar: 't', got: 't', isFirstKeyOfLine: true, intervalMs: 0 }),
        score({ expectedChar: 'h', got: 'h', intervalMs: 110 }),
      ],
    });
    expect(next.pairs.get('th')?.count).toBe(1);
  });
});

describe('applyEndSessionFade and unlock seeding', () => {
  it('increments sessionsWithKey on fade', () => {
    let next = createMasteryApplyState([], [], {});
    next = applyKeystrokeScores(next, {
      layout,
      layoutId: 'qwerty-us',
      targetWpm: 15,
      nowIso: '2026-11-13T12:00:00.000Z',
      scores: [score({ expectedChar: 'f', got: 'f', isFirstKeyOfLine: true, intervalMs: 0 })],
    });
    next = applyEndSessionFade(next, { layoutId: 'qwerty-us', targetWpm: 15 });
    expect(next.keys.get('KeyF')!.sessionsWithKey).toBe(1);
  });

  it('seeds unlockedAt for new learn-order group codes', () => {
    const seeded = seedUnlockedGroupKeys(
      layout,
      'qwerty-us',
      [],
      2,
      '2026-11-13T12:00:00.000Z',
      15,
    );
    const group2 = layout.learnOrder[1]!;
    for (const code of group2) {
      const rec = seeded.find((k) => k.code === code);
      expect(rec?.unlockedAt).toBe('2026-11-13T12:00:00.000Z');
    }
    expect(unlockTargetCode(layout, 2)).toBe(group2[0]);
  });
});
