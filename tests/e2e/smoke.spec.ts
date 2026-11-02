import { expect, test } from '@playwright/test';

test('welcome page loads', async ({ page }) => {
  await page.goto('/#/welcome');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByText(/no account needed/i)).toBeVisible();
});
