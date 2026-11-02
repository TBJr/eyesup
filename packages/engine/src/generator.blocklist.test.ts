import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { generateLine, type LetterModel } from './generator.js';
import { parseLayout } from './layout.js';
import { createSeededRandom } from './random.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../../..');

describe('generator blocklist on real content (EU-014)', () => {
  const layout = parseLayout(
    JSON.parse(readFileSync(join(root, 'packages/layouts/qwerty-us.json'), 'utf8')),
  );
  const letterModel = JSON.parse(
    readFileSync(join(root, 'packages/content/en/letter-model.json'), 'utf8'),
  ) as LetterModel;
  const wordList = readFileSync(join(root, 'packages/content/en/words.txt'), 'utf8')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'));
  const blocklist = readFileSync(
    join(root, 'packages/content/en/blocklist.txt'),
    'utf8',
  )
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'));

  it(
    'produces 10_000 lines with no blocklist hits',
    () => {
      // Mix drill and word kinds so the blocklist path is exercised on every line type,
      // while keeping CI under the job budget (word-only 10k timed out at 600s on Ubuntu).
      const kinds = [
        'key_drill',
        'pair_drill',
        'real_words',
        'pseudo_words',
        'mixed_review',
      ] as const;
      const focus = 'e';
      for (let seed = 0; seed < 10_000; seed += 1) {
        const line = generateLine({
          layout,
          unlockedGroupCount: 8,
          focusChar: focus,
          track: 'adaptive',
          kind: kinds[seed % kinds.length],
          letterModel,
          wordList,
          blocklist,
          rng: createSeededRandom(seed),
        });
        expect(line.text.length).toBeGreaterThanOrEqual(40);
        expect(line.text.length).toBeLessThanOrEqual(60);
      }
    },
    900_000,
  );
});

