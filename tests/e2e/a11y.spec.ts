import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

async function expectNoSeriousAxe(page: import('@playwright/test').Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  const serious = results.violations.filter(
    (v) => v.impact === 'serious' || v.impact === 'critical',
  );
  expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
}

test.describe('WCAG smoke (Gate C / NFR-06)', () => {
  test('welcome has no serious axe violations', async ({ page }) => {
    await page.goto('/#/welcome');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10_000 });
    await expectNoSeriousAxe(page);
  });

  test('welcome in dark theme has no serious axe violations', async ({ page }) => {
    await page.goto('/#/welcome');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10_000 });
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expectNoSeriousAxe(page);
  });

  test('orient has no serious axe violations', async ({ page }) => {
    await page.goto('/#/orient');
    await expect(page.getByTestId('orient-screen')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expectNoSeriousAxe(page);
  });

  test('questions has no serious axe violations', async ({ page }) => {
    await page.goto('/#/questions');
    await expect(page.getByTestId('questions-screen')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expectNoSeriousAxe(page);
  });

  test('probe-a has no serious axe violations', async ({ page }) => {
    await page.goto('/#/probe-a');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10_000 });
    await expectNoSeriousAxe(page);
  });

  test('result has no serious axe violations', async ({ page }) => {
    await page.goto('/#/result');
    await expect(page.getByTestId('result-screen')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expectNoSeriousAxe(page);
  });

  test('destination routes without a profile return to welcome', async ({ page }) => {
    await page.goto('/#/settings');
    await expect(
      page.getByRole('heading', { level: 1, name: /Type without looking|Tapez sans regarder/i }),
    ).toBeVisible();
    await expect(page).toHaveURL(/#\/welcome/);
  });
});
