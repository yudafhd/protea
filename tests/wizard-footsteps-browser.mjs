import { chromium, webkit } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';

const base = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';
const output = 'test-results/wizard-footsteps';
await mkdir(output, { recursive: true });

for (const [name, engine] of [['chromium', chromium], ['webkit', webkit]]) {
  const browser = await engine.launch({ headless: true, ...(name === 'chromium' ? { channel: process.env.PLAYWRIGHT_CHANNEL ?? 'chrome' } : {}) });
  try {
    const page = await browser.newPage({ viewport: { width: 393, height: 678 }, hasTouch: true });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(`${base}/templates/wizard`);
    await page.locator('.wizard-page[data-assets="ready"]').waitFor();
    const layer = page.locator('.wizard-footsteps');
    assert.equal(await layer.isVisible(), false, 'Footsteps must not appear on the cover');
    await page.getByRole('button', { name: 'Buka undangan', exact: true }).click();
    await page.locator('.wizard-book[data-phase="entering"]').waitFor();
    assert.equal(await layer.isVisible(), false, 'Footsteps must wait until the opening finishes');
    await page.locator('.wizard-book[data-phase="inside"]').waitFor();
    await page.locator('.wizard-footsteps[data-running="true"]').waitFor();
    assert.deepEqual(await page.locator('.wizard-walker-name').allTextContents(), ['Putri', 'Yuda']);
    const nameStyles = await page.locator('.wizard-walker-name').evaluateAll((nodes) => nodes.map((node) => {
      const style = getComputedStyle(node);
      return { background: style.backgroundColor, border: style.borderTopWidth, padding: style.padding, shadow: style.boxShadow };
    }));
    for (const style of nameStyles) {
      assert.deepEqual(style, { background: 'rgba(0, 0, 0, 0)', border: '0px', padding: '0px', shadow: 'none' }, 'Walking names must remain plain text');
    }
    assert.equal(await page.locator('.wizard-walker').count(), 2);
    assert.equal(await layer.getAttribute('aria-hidden'), 'true');
    await page.waitForFunction(() => [...document.querySelectorAll('.wizard-walker')].every((walker) =>
      walker.querySelector('[data-foot="left"]') && walker.querySelector('[data-foot="right"]')));

    // Deposited prints stay in place while new steps advance.
    const first = page.locator('.wizard-walker-bride .wizard-footprint').first();
    const stamp = await first.evaluate((node) => node.style.transform);
    const namePosition = await page.locator('.wizard-walker-bride .wizard-walker-name').evaluate((node) => node.style.transform);
    await page.waitForFunction(() => document.querySelectorAll('.wizard-walker-bride .wizard-footprint[data-foot]').length >= 3);
    assert.equal(await first.evaluate((node) => node.style.transform), stamp, 'Old footprints must not slide with the walker');
    assert.notEqual(await page.locator('.wizard-walker-bride .wizard-walker-name').evaluate((node) => node.style.transform), namePosition, 'The name must follow the walking position');
    assert.ok(await first.evaluate((node) => node.getAnimations().length > 0), 'Footprints must fade after each step');
    const behindPhoto = await page.locator('.wizard-couple-photo img').evaluate((image) => {
      const layer = document.querySelector('.wizard-footsteps');
      // Temporarily enable hit testing so pointer-events cannot hide an incorrect stacking order.
      layer.style.pointerEvents = 'auto';
      const box = image.getBoundingClientRect();
      const front = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
      layer.style.removeProperty('pointer-events');
      return front === image;
    });
    assert.ok(behindPhoto, 'Footsteps must be painted beneath invitation content');
    await page.screenshot({ path: `${output}/walking-${name}.png` });

    const checkBounds = async () => {
      const bounds = await layer.boundingBox();
      const nav = await page.locator('.wizard-chapter-nav').boundingBox();
      assert.ok(bounds.y + bounds.height <= nav.y + 1, 'The animation must stay above navigation');
      const prints = await page.locator('.wizard-footprint').evaluateAll((nodes) => nodes
        .filter((node) => Number(getComputedStyle(node).opacity) > 0)
        .map((node) => node.getBoundingClientRect().toJSON()));
      for (const box of prints) {
        assert.ok(box.x >= bounds.x && box.right <= bounds.x + bounds.width, 'A footprint escaped horizontally');
        assert.ok(box.y >= bounds.y && box.bottom <= bounds.y + bounds.height, 'A footprint escaped vertically');
      }
      assert.equal(await page.locator('.wizard-footprint').count(), 20, 'The trail pool must stay bounded');
    };
    await checkBounds();
    for (const viewport of [{ width: 320, height: 568 }, { width: 844, height: 390 }, { width: 1440, height: 900 }]) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(600);
      await checkBounds();
    }
    await page.setViewportSize({ width: 393, height: 678 });
    await page.getByRole('button', { name: 'RSVP', exact: true }).click();
    await page.locator('#wizard-guest').fill('Tamu Animasi');
    assert.equal(await page.locator('#wizard-guest').inputValue(), 'Tamu Animasi');
    const hit = await page.locator('#wizard-guest').evaluate((input) => {
      const box = input.getBoundingClientRect();
      return document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2) === input;
    });
    assert.ok(hit, 'The overlay must allow clicks through to the form');

    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, value: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    assert.equal(await layer.getAttribute('data-running'), 'false');
    assert.equal(await page.locator('.wizard-footprint').evaluateAll((nodes) => nodes.flatMap((node) => node.getAnimations()).length), 0);
    await page.evaluate(() => {
      delete document.hidden;
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await page.locator('.wizard-footsteps[data-running="true"]').waitFor();
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForFunction(() => document.querySelector('.wizard-footsteps').dataset.running === 'false');
    assert.equal(await layer.isVisible(), false, 'Reduced motion must disable decorative footsteps');
    await page.getByRole('button', { name: 'Sampul', exact: true }).click();
    await page.locator('.wizard-book[data-phase="cover"]').waitFor();
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    assert.equal(await layer.isVisible(), false, 'Returning to the cover must stop the walkers');
    assert.equal(await page.locator('.wizard-footprint').evaluateAll((nodes) => nodes.flatMap((node) => node.getAnimations()).length), 0);
    assert.deepEqual(errors, []);
    console.log(`${name}: alternating trails with plain walking names, background stacking, resizing, form interaction, visibility and lifecycle passed`);
  } finally {
    await browser.close();
  }
}
