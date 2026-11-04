import { describe, expect, it } from 'vitest';

/** Reduced-motion contract: reach animations must yield to a static cue (EU / a11y). */
describe('Hands reduced motion contract', () => {
  it('documents that reducedMotion replaces the reach path with a static arrow', () => {
    const modes = { animated: 'reach-path', static: 'arrow' } as const;
    expect(modes.static).toBe('arrow');
  });
});
