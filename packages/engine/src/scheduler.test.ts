import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { createSeededRandom } from './random.js';
import { createKeyStat } from './mastery.js';
import { planSession, sessionGetsBlindCheck } from './scheduler.js';
import { parseLayout } from './layout.js';
import type { LetterModel } from './generator.js';
import type { Learner } from './types.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../../..');

function loadJson<T>(rel: string): T {
  return JSON.parse(readFileSync(join(root, rel), 'utf8')) as T;
}

function loadLines(rel: string): string[] {
  return readFileSync(join(root, rel), 'utf8')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'));
}

describe('scheduler (EU-015, EU-016, C1, C2)', () => {
  const layout = parseLayout(
    loadJson('packages/layouts/qwerty-us.json'),
  );
  const letterModel = loadJson<LetterModel>(
    'packages/content/en/letter-model.json',
  );
  const wordList = loadLines('packages/content/en/words.txt').slice(0, 2000);
  const blocklist = loadLines('packages/content/en/blocklist.txt');

  it('places blind check on sessions 3, 6, 9 (1-based, C2)', () => {
    expect(sessionGetsBlindCheck(0)).toBe(false);
    expect(sessionGetsBlindCheck(1)).toBe(false);
    expect(sessionGetsBlindCheck(2)).toBe(true);
    expect(sessionGetsBlindCheck(5)).toBe(true);
    expect(sessionGetsBlindCheck(3)).toBe(false);
  });

  it('plans block shares for a 12-minute session', () => {
    const keys = layout.learnOrder[0]!.map((code) => createKeyStat(code));
    const learner: Learner = {
      layoutId: layout.id,
      track: 'foundations',
      targetWpm: 15,
      goalWpm: 30,
      unlockedGroupCount: 1,
      keys,
      pairs: [],
      sessionCount: 0,
      dailyMinutes: 12,
    };
    const plan = planSession({
      learner,
      layout,
      letterModel,
      wordList,
      blocklist,
      rng: createSeededRandom(42),
      nowIso: '2026-01-01T12:00:00.000Z',
    });
    expect(plan.lines.length).toBe(24);
    expect(plan.includesBlindCheck).toBe(false);
    expect(plan.lines.some((l) => l.kind === 'key_drill')).toBe(true);
    expect(plan.lines.every((l) => l.text.length >= 40)).toBe(true);
  });

  it('ends session 3 with a blind_check block', () => {
    const keys = layout.learnOrder[0]!.map((code) => createKeyStat(code));
    const learner: Learner = {
      layoutId: layout.id,
      track: 'foundations',
      targetWpm: 15,
      goalWpm: 30,
      unlockedGroupCount: 1,
      keys,
      pairs: [],
      sessionCount: 2,
      dailyMinutes: 5,
    };
    const plan = planSession({
      learner,
      layout,
      letterModel,
      wordList,
      blocklist,
      rng: createSeededRandom(7),
      nowIso: '2026-01-01T12:00:00.000Z',
    });
    expect(plan.includesBlindCheck).toBe(true);
    expect(plan.lines.some((l) => l.kind === 'blind_check')).toBe(true);
  });

  it('uses due keys for warm-up focus when reviews are due', () => {
    const keys = layout.learnOrder[0]!.map((code) => {
      const k = createKeyStat(code);
      return {
        ...k,
        accuracy: 0.99,
        timeToTypeMs: 200,
        stableSessions: 2,
        lastPractisedIso: '2025-01-01T00:00:00.000Z',
      };
    });
    const learner: Learner = {
      layoutId: layout.id,
      track: 'adaptive',
      targetWpm: 20,
      goalWpm: 30,
      unlockedGroupCount: 4,
      keys,
      pairs: [],
      sessionCount: 0,
      dailyMinutes: 5,
    };
    const plan = planSession({
      learner,
      layout,
      letterModel,
      wordList,
      blocklist,
      rng: createSeededRandom(3),
      nowIso: '2026-06-01T00:00:00.000Z',
    });
    expect(plan.lines.some((l) => l.kind === 'warmup')).toBe(true);
  });
});
