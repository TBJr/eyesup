import { describe, expect, it } from 'vitest';
import { isDestination, parseHash } from './router.js';

describe('parseHash', () => {
  it('defaults empty hash to welcome', () => {
    expect(parseHash('')).toBe('welcome');
    expect(parseHash('#')).toBe('welcome');
    expect(parseHash('#/')).toBe('welcome');
  });

  it('parses known routes', () => {
    expect(parseHash('#/practice')).toBe('practice');
    expect(parseHash('#/desktop-import')).toBe('desktop-import');
  });

  it('falls back to welcome for unknown paths', () => {
    expect(parseHash('#/nope')).toBe('welcome');
  });
});

describe('isDestination', () => {
  it('recognises main destinations', () => {
    expect(isDestination('today')).toBe(true);
    expect(isDestination('welcome')).toBe(false);
  });
});
