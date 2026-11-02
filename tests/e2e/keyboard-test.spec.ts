import { expect, test } from '@playwright/test';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const pageUrl = pathToFileURL(resolve('tools/keyboard-test/index.html')).href;

test('keyboard test page logs keydown and keyup with code and key', async ({ page }) => {
  await page.goto(pageUrl);
  const capture = page.locator('#capture');
  await capture.click();
  await page.keyboard.press('KeyA');

  await expect.poll(async () => {
    return page.evaluate(() => {
      const api = (window as unknown as {
        __eyesupKeyboardTest?: { getEvents: () => Array<{ type: string; code: string; key: string }> };
      }).__eyesupKeyboardTest;
      return api?.getEvents() ?? [];
    });
  }).toMatchObject(
    expect.arrayContaining([
      expect.objectContaining({ type: 'keydown', code: 'KeyA' }),
      expect.objectContaining({ type: 'keyup', code: 'KeyA' }),
    ]),
  );

  const events = await page.evaluate(() => {
    return (window as unknown as {
      __eyesupKeyboardTest: { getEvents: () => Array<{ type: string; code: string; key: string }> };
    }).__eyesupKeyboardTest.getEvents();
  });
  const down = events.find((e) => e.type === 'keydown');
  const up = events.find((e) => e.type === 'keyup');
  expect(down?.key?.toLowerCase()).toBe('a');
  expect(up?.key?.toLowerCase()).toBe('a');
});
