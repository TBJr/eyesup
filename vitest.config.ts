import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: [
      'packages/*/src/**/*.test.ts',
      'packages/*/tests/**/*.test.ts',
    ],

    testTimeout: 600_000,
    hookTimeout: 180_000,
    fileParallelism: false,
    // threads avoids intermittent hangs with forks + long property suites on some hosts
    pool: 'threads',
    coverage: {
      provider: 'v8',
      include: ['packages/engine/src/**/*.ts'],
      exclude: [
        'packages/engine/src/**/*.test.ts',
        'packages/engine/src/**/types.ts',
        'packages/engine/src/index.ts',
        'packages/engine/src/input/index.ts',
      ],

      thresholds: {
        lines: 90,
      },
      reporter: ['text', 'json-summary'],
    },

  },
});
