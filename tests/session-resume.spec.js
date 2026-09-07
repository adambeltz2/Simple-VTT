import { test, expect } from '@playwright/test';

test.describe('footer', () => {
  test('has GitHub and Buy Me a Coffee links plus a version number', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('footer a:has-text("GitHub")')).toHaveAttribute(
      'href',
      'https://github.com/adambeltz2/Simple-VTT'
    );
    await expect(page.locator('footer a:has-text("Buy me a coffee")')).toHaveAttribute(
      'href',
      'https://www.buymeacoffee.com/adambeltz'
    );
    await expect(page.locator('footer .version')).toHaveText(/^v\d+\.\d+\.\d+$/);
  });
});

test.describe('session resume', () => {
  test('persists GM session and offers it back after a reload', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));

    await page.goto('/');
    await page.click('button:has-text("Host a Game")');
    await page.waitForSelector('.toolbar .code strong');
    const code = (await page.textContent('.toolbar .code strong')).trim();

    await page.waitForTimeout(600); // let the debounced persistence write land

    const stored = await page.evaluate(() => localStorage.getItem('vtt:last-session'));
    const parsed = stored ? JSON.parse(stored) : null;
    expect(parsed?.role).toBe('gm');
    expect(parsed?.sessionId).toBe(code);

    await page.reload();
    await page.waitForSelector('.resume-panel', { timeout: 10000 });
    const resumeText = await page.textContent('.resume-panel .resume-text');
    expect(resumeText).toContain(code);
    expect(resumeText).toContain('GM');

    await page.click('.resume-panel button.primary');
    await page.waitForSelector('.toolbar .code strong', { timeout: 15000 });
    const resumedCode = (await page.textContent('.toolbar .code strong')).trim();
    expect(resumedCode).toBe(code);

    expect(errors).toEqual([]);
  });

  test('"Start Fresh" clears the persisted session', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() =>
      localStorage.setItem('vtt:last-session', JSON.stringify({ role: 'player', sessionId: 'ZZZZZ', savedAt: Date.now() }))
    );
    await page.reload();
    await page.waitForSelector('.resume-panel', { timeout: 10000 });
    await page.click('.resume-panel button:has-text("Start Fresh")');
    await page.waitForSelector('button:has-text("Host a Game")', { timeout: 5000 });
    const after = await page.evaluate(() => localStorage.getItem('vtt:last-session'));
    expect(after).toBeNull();
  });
});
