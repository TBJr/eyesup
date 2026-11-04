import { expect, test } from '@playwright/test';

test('welcome page loads', async ({ page }) => {
  await page.goto('/#/welcome');
  await expect(
    page.getByRole('heading', { level: 1, name: /Type without looking|Tapez sans regarder/i }),
  ).toBeVisible();
  await expect(page.getByText(/No account|Aucun compte/i).first()).toBeVisible();
});

test('empty hash shows welcome without a blank main', async ({ page }) => {
  await page.goto('/#/');
  await expect(
    page.getByRole('heading', { level: 1, name: /Type without looking|Tapez sans regarder/i }),
  ).toBeVisible();
  await expect(page.getByText(/Start the 3-minute check|Demarrer le test/i)).toBeVisible();
  await expect(page.locator('main.page')).not.toBeEmpty();
});

test('practice without a profile redirects to welcome', async ({ page }) => {
  await page.goto('/#/practice');
  await expect(
    page.getByRole('heading', { level: 1, name: /Type without looking|Tapez sans regarder/i }),
  ).toBeVisible();
  await expect(page).toHaveURL(/#\/welcome/);
});
