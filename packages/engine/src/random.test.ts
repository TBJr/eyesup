import { describe, expect, it } from 'vitest';
import { createSeededRandom } from './random.js';

describe('seeded random edge cases', () => {
  it('throws on invalid ranges and empty pick', () => {
    const rng = createSeededRandom(1);
    expect(() => rng.nextInt(5, 2)).toThrow(RangeError);
    expect(() => rng.pick([])).toThrow(RangeError);
  });
});
