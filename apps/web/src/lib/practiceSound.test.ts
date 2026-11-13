import { describe, expect, it } from 'vitest';
import { playCorrect, playError, playLineComplete, playUnlock } from './practiceSound.js';

describe('practiceSound', () => {
  it('no-ops when sound is disabled', () => {
    expect(() => {
      playCorrect(false);
      playError(false);
      playLineComplete(false);
      playUnlock(false);
    }).not.toThrow();
  });
});
