import { test, expect } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEST_MAP = path.join(__dirname, 'fixtures', 'test-map.png');

async function centerPixel(page) {
  return page.evaluate(() => {
    const c = document.querySelector('canvas');
    const ctx = c.getContext('2d');
    const data = ctx.getImageData(Math.floor(c.width / 2), Math.floor(c.height / 2), 1, 1).data;
    return [data[0], data[1], data[2]];
  });
}

async function cornerPixel(page) {
  return page.evaluate(() => {
    const c = document.querySelector('canvas');
    const ctx = c.getContext('2d');
    const data = ctx.getImageData(5, 5, 1, 1).data;
    return [data[0], data[1], data[2]];
  });
}

const isBlack = ([r, g, b]) => r === 0 && g === 0 && b === 0;

test('GM controls fog of war; players see a masked view that syncs live', async ({ browser }) => {
  const gmContext = await browser.newContext();
  const playerContext = await browser.newContext();
  const gm = await gmContext.newPage();
  const player = await playerContext.newPage();

  const errors = [];
  [gm, player].forEach((p) => p.on('pageerror', (e) => errors.push(String(e))));

  await gm.goto('/');
  await gm.click('button:has-text("Host a Game")');
  await gm.waitForSelector('.toolbar .code strong');
  const code = (await gm.textContent('.toolbar .code strong')).trim();

  await player.goto('/');
  await player.fill('input[placeholder="ENTER CODE"]', code);
  await player.click('button:has-text("Join a Game")');
  await player.waitForFunction(
    () => document.querySelector('.status-bar')?.textContent.includes('connected'),
    null,
    { timeout: 15000 }
  );

  // Fog controls are disabled with no active scene yet.
  await expect(gm.locator('.fog-controls input[type="checkbox"]')).toBeDisabled();

  await gm.fill('.scene-manager input[placeholder="Scene name"]', 'Fog Test');
  await gm.setInputFiles('.scene-manager input[type="file"]', TEST_MAP);
  await gm.waitForSelector('.scene-manager li.active', { timeout: 15000 });
  await gm.waitForFunction(() => document.querySelector('canvas')?.width === 400);

  await gm.click('.fog-controls input[type="checkbox"]');
  await gm.waitForSelector('.fog-controls button:has-text("Reveal Brush")', { timeout: 5000 });

  // Default is fully hidden: player's canvas should be solid black at center.
  await player.waitForFunction(
    async () => {
      const c = document.querySelector('canvas');
      if (!c) return false;
      const ctx = c.getContext('2d');
      const d = ctx.getImageData(Math.floor(c.width / 2), Math.floor(c.height / 2), 1, 1).data;
      return d[0] === 0 && d[1] === 0 && d[2] === 0;
    },
    null,
    { timeout: 10000 }
  );

  // GM sees a translucent tint, not solid black, over the same hidden cell.
  const gmCenter = await centerPixel(gm);
  expect(isBlack(gmCenter)).toBe(false);

  // Reveal All -> player's center cell is no longer black.
  await gm.click('.fog-controls button:has-text("Reveal All")');
  await expect
    .poll(async () => isBlack(await centerPixel(player)), { timeout: 10000 })
    .toBe(false);

  // Hide All, then paint-reveal just the center cell with the brush.
  await gm.click('.fog-controls button:has-text("Hide All")');
  await gm.waitForTimeout(300);
  await gm.click('.fog-controls button:has-text("Reveal Brush")');
  const box = await gm.locator('canvas').boundingBox();
  await gm.mouse.click(box.x + box.width * 0.5, box.y + box.height * 0.5);

  await expect
    .poll(async () => isBlack(await centerPixel(player)), { timeout: 10000 })
    .toBe(false);

  // An untouched cell (corner) should still be hidden on the player's side.
  expect(isBlack(await cornerPixel(player))).toBe(true);

  // Disabling fog reveals the whole map again.
  await gm.click('.fog-controls input[type="checkbox"]');
  await expect
    .poll(async () => isBlack(await cornerPixel(player)), { timeout: 10000 })
    .toBe(false);

  expect(errors).toEqual([]);

  await gmContext.close();
  await playerContext.close();
});
