import { expect, test } from '@playwright/test';

test('onboarding is keyboard-operable through questions', async ({ page }) => {
  await page.goto('/#/welcome');
  await expect(page.getByRole('heading', { name: 'EyesUp' })).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Orient' })).toBeVisible();
  for (let i = 0; i < 6; i += 1) {
    await page.keyboard.press('Enter');
  }
  await expect(page.locator('ol')).toBeVisible();
  await page.keyboard.press('1');
  await page.keyboard.press('Enter');
  await page.keyboard.press('2');
  await page.keyboard.press('Enter');
});
