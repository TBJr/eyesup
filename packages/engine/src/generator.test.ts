import { describe, expect, it } from 'vitest';
import {
  editDistanceAtMostOne,
  generateLine,
  isWordLineKind,
  type LetterModel,
} from './generator.js';
import { createSeededRandom } from './random.js';
import type { Layout } from './types.js';

const layout: Layout = {
  id: 'gen',
  name: 'Gen',
  language: 'en',
  standard: 'ANSI',
  fingerprint: { KeyF: 'f' },
  keys: [
    { code: 'KeyA', row: 2, width: 1, finger: 'L4', base: 'a' },
    { code: 'KeyS', row: 2, width: 1, finger: 'L3', base: 's' },
    { code: 'KeyD', row: 2, width: 1, finger: 'L2', base: 'd' },
    { code: 'KeyF', row: 2, width: 1, finger: 'L1', base: 'f' },
    { code: 'KeyJ', row: 2, width: 1, finger: 'R1', base: 'j' },
    { code: 'KeyK', row: 2, width: 1, finger: 'R2', base: 'k' },
    { code: 'KeyL', row: 2, width: 1, finger: 'R3', base: 'l' },
    { code: 'Semicolon', row: 2, width: 1, finger: 'R4', base: ';' },
    { code: 'Space', row: 4, width: 6, finger: 'T', base: ' ' },
  ],
  learnOrder: [
    ['KeyF', 'KeyJ', 'Space'],
    ['KeyD', 'KeyK'],
    ['KeyS', 'KeyL'],
    ['KeyA', 'Semicolon'],
  ],
};

const model: LetterModel = {
  order: 2,
  counts: {
    '^': { a: 1, d: 1, f: 1, s: 1, $: 1 },
    a: { d: 1, f: 1, $: 1 },
    f: { a: 1, d: 1, $: 1 },
  },
};

describe('generator kinds', () => {
  it('treats identical strings as edit distance one', () => {
    expect(editDistanceAtMostOne('word', 'word')).toBe(true);
    expect(editDistanceAtMostOne('ab', 'abc')).toBe(true);
  });

  it('builds pseudo and mixed word lines', () => {
    const rng = createSeededRandom(99);
    const pseudo = generateLine({
      layout,
      unlockedGroupCount: 4,
      focusChar: 'a',
      track: 'retrain',
      kind: 'pseudo_words',
      letterModel: model,
      wordList: ['fad', 'dad', 'add'],
      blocklist: ['bad'],
      rng,
    });
    expect(isWordLineKind(pseudo.kind)).toBe(true);

    const mixed = generateLine({
      layout,
      unlockedGroupCount: 4,
      focusChar: 'f',
      track: 'retrain',
      kind: 'mixed_review',
      letterModel: model,
      wordList: ['fad', 'fall', 'dad'],
      blocklist: ['bad'],
      rng: createSeededRandom(100),
    });
    expect(mixed.text.length).toBeGreaterThan(0);
  });

  it('auto-picks drill kinds before group four', () => {
    const line = generateLine({
      layout,
      unlockedGroupCount: 2,
      focusChar: 'd',
      track: 'foundations',
      letterModel: model,
      wordList: ['dd'],
      blocklist: [],
      rng: createSeededRandom(7),
    });
    expect(line.kind === 'key_drill' || line.kind === 'pair_drill').toBe(true);
  });
});
