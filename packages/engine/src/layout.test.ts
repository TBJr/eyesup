import { describe, expect, it } from 'vitest';
import { accuracy, grossWpm, netWpm } from './metrics.js';
import { charForCode, fingerForChar, parseLayout, unlockedCodes } from './layout.js';
import type { Layout } from './types.js';

const miniLayout: Layout = {
  id: 'mini',
  name: 'Mini',
  language: 'en',
  standard: 'ANSI',
  fingerprint: { KeyF: 'f' },
  keys: [
    { code: 'KeyF', row: 2, width: 1, finger: 'L1', base: 'f', home: true },
    { code: 'KeyJ', row: 2, width: 1, finger: 'R1', base: 'j', home: true },
    { code: 'Space', row: 4, width: 6, finger: 'T', base: ' ' },
  ],
  learnOrder: [['KeyF', 'KeyJ', 'Space'], ['KeyD']],
};

describe('layout helpers', () => {
  it('maps codes to fingers and unlock prefixes', () => {
    expect(charForCode(miniLayout, 'KeyF')).toBe('f');
    expect(unlockedCodes(miniLayout, 1)).toEqual(['KeyF', 'KeyJ', 'Space']);
    expect(unlockedCodes(miniLayout, 2)).toContain('KeyD');
  });

  it('accuracy handles zero keystrokes', () => {
    expect(accuracy(0, 0)).toBe(1);
  });

  it('metrics return zero for zero duration', () => {
    expect(grossWpm(10, 0)).toBe(0);
    expect(netWpm(10, 1, 0)).toBe(0);
  });

  it('parseLayout rejects non-objects', () => {
    expect(() => parseLayout(null)).toThrow(TypeError);
  });

  it('returns undefined for unknown chars', () => {
    expect(fingerForChar(miniLayout, 'z', 1)).toBeUndefined();
    expect(charForCode(miniLayout, 'Missing')).toBeUndefined();
  });
});
