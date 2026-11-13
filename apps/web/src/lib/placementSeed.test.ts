import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { parseLayout } from '@eyesup/engine';
import { seedKeysForPlacement, startingUnlockGroups } from './placementSeed.js';

const here = dirname(fileURLToPath(import.meta.url));
const layout = parseLayout(
  JSON.parse(
    readFileSync(join(here, '../../../../packages/layouts/qwerty-us.json'), 'utf8'),
  ) as unknown,
);

describe('placementSeed', () => {
  it('seeds four groups for adaptive and all for fluency', () => {
    expect(startingUnlockGroups('adaptive', layout)).toBe(4);
    expect(startingUnlockGroups('fluency', layout)).toBe(layout.learnOrder.length);
    expect(startingUnlockGroups('foundations', layout)).toBe(1);
  });

  it('writes unlockedAt and fluency L3', () => {
    const seeded = seedKeysForPlacement(layout, 'qwerty-us', 'fluency', 40, '2026-11-13T00:00:00.000Z');
    expect(seeded.length).toBe(layout.learnOrder.flat().length);
    expect(seeded.every((k) => k.guideLevel === 3 && k.unlockedAt)).toBe(true);
  });
});
