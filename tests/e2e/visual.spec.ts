import { expect, test } from '@playwright/test';

test.describe('design shell screenshots', () => {
  test('welcome matches composition baseline', async ({ page }) => {
    await page.goto('/#/welcome');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByText(/Start the 3-minute check|Demarrer le test/i)).toBeVisible();
    await expect(page.locator('.keyboard, [role="img"]').first()).toBeVisible();
    await expect(page).toHaveScreenshot('01-welcome.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.08,
    });
  });
});
