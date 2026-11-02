import { describe, expect, it } from 'vitest';
import { ENGINE_VERSION, assertEngineReady } from './index.js';

describe('engine scaffold', () => {
  it('exports a version', () => {
    expect(ENGINE_VERSION).toBe(1);
  });

  it('is ready', () => {
    expect(assertEngineReady()).toBe(true);
  });
});
