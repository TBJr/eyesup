/** Deterministic PRNG state (mulberry32). No Math.random. */

export interface SeededRandom {
  /** Uniform float in [0, 1). */
  next(): number;
  /** Uniform integer in [min, max] inclusive. */
  nextInt(min: number, max: number): number;
  /** Pick one element uniformly. */
  pick<T>(items: readonly T[]): T;
  /** In-place Fisher–Yates shuffle; returns the same array. */
  shuffle<T>(items: T[]): T[];
}

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createSeededRandom(seed: number): SeededRandom {
  const nextFloat = mulberry32(seed);

  const nextInt = (min: number, max: number): number => {
    if (max < min) {
      throw new RangeError('max must be >= min');
    }
    const span = max - min + 1;
    return min + Math.floor(nextFloat() * span);
  };

  return {
    next(): number {
      return nextFloat();
    },

    nextInt,

    pick<T>(items: readonly T[]): T {
      if (items.length === 0) {
        throw new RangeError('pick from empty array');
      }
      return items[nextInt(0, items.length - 1)]!;
    },

    shuffle<T>(items: T[]): T[] {
      for (let i = items.length - 1; i > 0; i -= 1) {
        const j = nextInt(0, i);
        const tmp = items[i]!;
        items[i] = items[j]!;
        items[j] = tmp;
      }
      return items;
    },
  };
}
