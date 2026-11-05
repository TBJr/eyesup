import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { keyboardKeyCenters } from './keyboardGeometry';

const here = dirname(fileURLToPath(import.meta.url));
const layout = JSON.parse(
  readFileSync(join(here, '../../layouts/qwerty-us.json'), 'utf8'),
) as { keys: { code: string; row: number; width: number }[] };

describe('keyboardKeyCenters', () => {
  const unit = 54;
  const gap = 6;
  const { centers, width } = keyboardKeyCenters(layout.keys, unit, gap);

  it('centers KeyF and KeyJ on the home row within the stage', () => {
    expect(centers['KeyF']).toBeDefined();
    expect(centers['KeyJ']).toBeDefined();
    expect(centers['KeyF']!.y).toBe(centers['KeyJ']!.y);
    expect(centers['KeyF']!.x).toBeLessThan(centers['KeyJ']!.x);
    expect(centers['KeyF']!.x).toBeGreaterThan(0);
    expect(centers['KeyJ']!.x).toBeLessThan(width);
  });

  it('spaces home-row letter keys one unit apart', () => {
    const home = ['KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyH', 'KeyJ', 'KeyK', 'KeyL'];
    for (let i = 1; i < home.length; i += 1) {
      const prev = centers[home[i - 1]!]!;
      const cur = centers[home[i]!]!;
      expect(cur.x - prev.x).toBeCloseTo(unit, 5);
      expect(cur.y).toBe(prev.y);
    }
  });

  it('places Space near the horizontal centre', () => {
    expect(centers['Space']).toBeDefined();
    expect(Math.abs(centers['Space']!.x - width / 2)).toBeLessThan(2);
  });
});
