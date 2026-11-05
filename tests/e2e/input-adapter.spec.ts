import { expect, test } from '@playwright/test';

test('onboarding is keyboard-operable through questions', async ({ page }) => {
  await page.goto('/#/welcome');
  await expect(
    page.getByRole('heading', { level: 1, name: /Type without looking|Tapez sans regarder/i }),
  ).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('orient-screen')).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  // Orient design 06: Space → F J D K S L → Next → E R O
  await page.keyboard.press('Space');
  await page.keyboard.press('Enter');
  await page.keyboard.press('f');
  await page.keyboard.press('j');
  for (const key of ['d', 'k', 's', 'l']) {
    await page.keyboard.press(key);
  }
  await page.keyboard.press('Enter');
  await page.keyboard.press('e');
  await page.keyboard.press('r');
  await page.keyboard.press('o');
  await expect(page.getByTestId('questions-screen')).toBeVisible();
  await page.keyboard.press('1');
  await page.keyboard.press('Enter');
  await page.keyboard.press('2');
  await page.keyboard.press('Enter');
});
