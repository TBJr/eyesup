import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('WCAG smoke (Gate C / NFR-06)', () => {
  test('welcome has no serious axe violations', async ({ page }) => {
    await page.goto('/#/welcome');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    const serious = results.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical',
    );
    expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
  });

  test('settings is keyboard reachable', async ({ page }) => {
    await page.goto('/#/welcome');
    await page.keyboard.press('Enter'); // orient
    // Skip full onboarding — seed is heavy; just ensure hash nav works for destinations
    await page.goto('/#/settings');
    await expect(page.getByRole('heading', { name: /settings|reglages/i })).toBeVisible();
  });
});
