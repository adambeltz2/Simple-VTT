import { test, expect } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEST_MAP = path.join(__dirname, 'fixtures', 'test-map.png');

test('GM hosts, player joins, and scene/token/initiative sync end-to-end over real WebRTC', async ({ browser }) => {
  const gmContext = await browser.newContext();
  const playerContext = await browser.newContext();
  const gm = await gmContext.newPage();
  const player = await playerContext.newPage();

  const gmErrors = [];
  const playerErrors = [];
  gm.on('pageerror', (e) => gmErrors.push(String(e)));
  player.on('pageerror', (e) => playerErrors.push(String(e)));

  await gm.goto('/');
  await gm.click('button:has-text("Host a Game")');
  await gm.waitForSelector('.toolbar .code strong');
  const code = (await gm.textContent('.toolbar .code strong')).trim();
  expect(code).toMatch(/^[A-Z0-9]{5}$/);

  await player.goto('/');
  await player.fill('input[placeholder="ENTER CODE"]', code);
  await player.click('button:has-text("Join a Game")');
  await player.waitForFunction(
    () => document.querySelector('.status-bar')?.textContent.includes('connected'),
    null,
    { timeout: 15000 }
  );

  await gm.waitForFunction(
    () => document.querySelector('.toolbar .peers')?.textContent.includes('1'),
    null,
    { timeout: 10000 }
  );

  // Scene upload: client-side WEBP compression + chunked P2P transfer to the player.
  await gm.fill('.scene-manager input[placeholder="Scene name"]', 'Test Map');
  await gm.setInputFiles('.scene-manager input[type="file"]', TEST_MAP);
  await gm.waitForSelector('.scene-manager li.active', { timeout: 15000 });
  await gm.waitForFunction(() => {
    const c = document.querySelector('canvas');
    return c && c.width === 400 && c.height === 300;
  });
  await player.waitForFunction(
    () => {
      const c = document.querySelector('canvas');
      return c && c.width === 400 && c.height === 300;
    },
    null,
    { timeout: 20000 }
  );

  // Token add (click canvas -> modal) + drag, throttled sync to the player.
  await gm.click('button:has-text("+ Add Token")');
  const box = await gm.locator('canvas').boundingBox();
  await gm.mouse.click(box.x + box.width * 0.3, box.y + box.height * 0.3);
  await gm.waitForSelector('.modal', { timeout: 5000 });
  await gm.fill('.modal input:not([type="color"])', 'Goblin 1');
  await gm.click('.modal button.primary');
  await gm.waitForFunction(() => !document.querySelector('.modal'), null, { timeout: 5000 });

  await gm.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.3);
  await gm.mouse.down();
  await gm.mouse.move(box.x + box.width * 0.7, box.y + box.height * 0.6, { steps: 5 });
  await gm.mouse.up();
  await gm.waitForTimeout(300);

  // Initiative tracker: GM edits, player gets a read-only synced view.
  await gm.fill('.tracker .add-form input:not([type="number"])', 'Rogue');
  await gm.fill('.tracker .add-form input[type="number"]', '18');
  await gm.click('.tracker .add-form button[type="submit"]');
  await gm.waitForSelector('.tracker li:has-text("Rogue")', { timeout: 5000 });

  await player.waitForSelector('.tracker li:has-text("Rogue")', { timeout: 10000 });
  expect(await player.locator('.tracker .controls').count()).toBe(0);

  await gm.click('.tracker button.advance');
  await player.waitForFunction(
    () => document.querySelector('.tracker li.active')?.textContent.includes('Rogue'),
    null,
    { timeout: 10000 }
  );

  expect(gmErrors).toEqual([]);
  expect(playerErrors).toEqual([]);

  await gmContext.close();
  await playerContext.close();
});
