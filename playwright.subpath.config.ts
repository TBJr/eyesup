import { defineConfig, devices } from '@playwright/test';

/** Preview the production build with GitHub Pages base path (/eyesup/app/). */
export default defineConfig({
  testDir: 'tests/e2e',
  testMatch: 'subpath.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://127.0.0.1:4174/eyesup/app/',
    trace: 'on-first-retry',
  },
  webServer: {
    // Dedicated port so a default-base preview on 4173 is never reused by mistake.
    command:
      'EYESUP_BASE_PATH=/eyesup/app/ pnpm --filter @eyesup/web preview --host 127.0.0.1 --port 4174',
    url: 'http://127.0.0.1:4174/eyesup/app/',
    reuseExistingServer: false,
    timeout: 120_000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
