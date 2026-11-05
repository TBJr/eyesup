import { expect, test } from '@playwright/test';

test('subpath build mounts the welcome screen (Pages base)', async ({ page }) => {
  const failed: string[] = [];
  page.on('response', (res) => {
    if (res.request().resourceType() === 'script' && res.status() >= 400) {
      failed.push(`${res.status()} ${res.url()}`);
    }
  });

  await page.goto('./#/welcome');
  await expect(page.getByText('EyesUp', { exact: true }).first()).toBeVisible({
    timeout: 15_000,
  });
  await expect(
    page.getByRole('heading', { level: 1, name: /Type without looking/i }),
  ).toBeVisible();
  await expect(page.getByText(/No account\. Your progress stays on this device/i)).toBeVisible();
  await expect(page.getByText('Press Enter to begin')).toBeVisible();
  expect(failed, `script load failures: ${failed.join('; ')}`).toEqual([]);
});
