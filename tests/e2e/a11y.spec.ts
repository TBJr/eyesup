import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('WCAG smoke (Gate C / NFR-06)', () => {
  test('welcome has no serious axe violations', async ({ page }) => {
    await page.goto('/#/welcome');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10_000 });
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    const serious = results.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical',
    );
    expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
  });

  test('welcome in dark theme has no serious axe violations', async ({ page }) => {
    await page.goto('/#/welcome');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10_000 });
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    const serious = results.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical',
    );
    expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
  });

  test('destination routes without a profile return to welcome', async ({ page }) => {
    await page.goto('/#/settings');
    await expect(
      page.getByRole('heading', { level: 1, name: /Type without looking|Tapez sans regarder/i }),
    ).toBeVisible();
    await expect(page).toHaveURL(/#\/welcome/);
  });
});
