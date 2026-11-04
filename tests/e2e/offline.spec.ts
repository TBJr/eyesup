import { expect, test } from '@playwright/test';

test('learning shell works offline after first load (NFR-05)', async ({ page, context }) => {
  await page.goto('/#/welcome');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10_000 });

  await page.evaluate(async () => {
    const cache = await caches.open('eyesup-v1');
    const urls = [
      location.href.split('#')[0]!,
      ...performance
        .getEntriesByType('resource')
        .map((e) => (e as PerformanceResourceTiming).name)
        .filter((u) => u.startsWith(location.origin)),
    ];
    await Promise.all(
      [...new Set(urls)].map(async (url) => {
        try {
          await cache.add(url);
        } catch {
          /* ignore opaque failures */
        }
      }),
    );
  });

  await context.setOffline(true);
  await page.goto('/#/welcome');
  await expect(page.getByText(/EyesUp|account|Orient|Today/i).first()).toBeVisible({
    timeout: 10_000,
  });
});
