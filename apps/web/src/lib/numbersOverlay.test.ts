import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { createSeededRandom, LINE_MAX_CHARS, LINE_MIN_CHARS, parseLayout } from '@eyesup/engine';
import {
  digitCharsFromLayout,
  generateNumberDrillLine,
  generateNumberDrillLines,
  isNumbersEnabled,
} from './numbersOverlay.js';

const here = dirname(fileURLToPath(import.meta.url));
const layout = parseLayout(
  JSON.parse(
    readFileSync(join(here, '../../../../packages/layouts/qwerty-us.json'), 'utf8'),
  ) as unknown,
);

describe('numbersOverlay', () => {
  it('detects numbers overlay flag', () => {
    expect(isNumbersEnabled(['numbers', 'coder'])).toBe(true);
    expect(isNumbersEnabled(['coder'])).toBe(false);
  });

  it('reads digit bases from qwerty-us in layout order', () => {
    expect(digitCharsFromLayout(layout)).toEqual([
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      '0',
    ]);
  });

  it('generateNumberDrillLine stays in length bounds and uses only layout digits', () => {
    const digits = new Set(digitCharsFromLayout(layout));
    const rng = createSeededRandom(7);
    for (let i = 0; i < 20; i += 1) {
      const line = generateNumberDrillLine(layout, rng);
      expect(line.kind).toBe('key_drill');
      expect(line.text.length).toBeGreaterThanOrEqual(LINE_MIN_CHARS - 2);
      expect(line.text.length).toBeLessThanOrEqual(LINE_MAX_CHARS);
      expect(digits.has(line.focusChar)).toBe(true);
      for (const ch of line.text) {
        if (ch === ' ') continue;
        expect(digits.has(ch)).toBe(true);
      }
    }
  });

  it('generateNumberDrillLines returns the requested count', () => {
    const lines = generateNumberDrillLines(layout, createSeededRandom(3), 5);
    expect(lines).toHaveLength(5);
  });
});
