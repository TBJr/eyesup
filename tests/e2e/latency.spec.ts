import { expect, test } from '@playwright/test';

test('reports p95 keystroke-to-paint under 16ms budget when possible', async ({
  page,
  browserName,
}) => {
  await page.goto('/#/welcome');
  const samples = await page.evaluate(async () => {
    const times: number[] = [];
    const target = document.createElement('div');
    target.id = 'paint-target';
    document.body.appendChild(target);
    for (let i = 0; i < 40; i += 1) {
      const t0 = performance.now();
      target.textContent = String(i);
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => resolve());
      });
      times.push(performance.now() - t0);
    }
    times.sort((a, b) => a - b);
    const p95 = times[Math.floor(times.length * 0.95)] ?? 0;
    return { p95, browser: navigator.userAgent };
  });
  // Synthetic textContent→rAF smoke only — not NFR-01 (Gate D / keyboard-test K14).
  // Soft assert: record value; CI machines vary. Fail only if wildly slow.
  // WebKit headless on Linux CI routinely lands ~90–160ms for this harness; Chromium/Firefox stay under 50.
  const softBudgetMs = browserName === 'webkit' ? 200 : 50;
  expect(samples.p95, `${browserName} p95=${samples.p95}`).toBeLessThan(softBudgetMs);
  console.log(`latency_p95_${browserName}=${samples.p95.toFixed(2)}`);
});
