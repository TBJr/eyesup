import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { parseLayout } from '@eyesup/engine';
import { layoutWithFingerMap } from './fingerMap.js';

const here = dirname(fileURLToPath(import.meta.url));
const layout = parseLayout(
  JSON.parse(
    readFileSync(join(here, '../../../../packages/layouts/qwerty-us.json'), 'utf8'),
  ) as unknown,
);

describe('layoutWithFingerMap', () => {
  it('leaves default map unchanged', () => {
    const next = layoutWithFingerMap(layout, 'default');
    expect(next).toBe(layout);
  });

  it('maps right-hand keys to left for one-hand-left', () => {
    const next = layoutWithFingerMap(layout, 'one-hand-left');
    const j = next.keys.find((k) => k.code === 'KeyJ');
    expect(j?.finger.startsWith('L')).toBe(true);
  });

  it('reduces little/ring onto middle', () => {
    const next = layoutWithFingerMap(layout, 'reduced');
    const a = next.keys.find((k) => k.code === 'KeyA');
    expect(a?.finger).toBe('L2');
  });
});
