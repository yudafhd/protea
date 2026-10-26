import { chromium, webkit, expect } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';

const base = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';
const output = 'test-results/wizard-image-preview';
await mkdir(output, { recursive: true });

for (const [name, engine] of [['chromium', chromium], ['webkit', webkit]]) {
  const browser = await engine.launch({ headless: true, ...(name === 'chromium' ? { channel: process.env.PLAYWRIGHT_CHANNEL ?? 'msedge' } : {}) });
  try {
    for (const viewport of [{ width: 393, height: 852 }, { width: 1440, height: 900 }]) {
      const page = await browser.newPage({ viewport, reducedMotion: 'no-preference' });
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.goto(base);
      await page.locator('.wizard-page[data-assets="ready"]').waitFor();
      const dialog = page.locator('.wizard-image-preview[open]');
      const close = page.getByRole('button', { name: 'Tutup preview foto' });

      async function open(trigger, keyboard = false) {
        if (keyboard) {
          await trigger.focus();
          await page.keyboard.press('Enter');
        } else {
          await trigger.click();
        }
        await dialog.waitFor();
        await dialog.locator('img').evaluate((image) => image.decode());
        assert.equal(await dialog.evaluate((node) => node.parentElement === document.body), true, 'Preview must be outside the animated invitation container');
        const overlay = await dialog.boundingBox();
        assert.deepEqual(overlay, { x: 0, y: 0, width: viewport.width, height: viewport.height }, 'Overlay must fill the browser viewport');
        assert.equal(await page.evaluate(() => document.body.style.overflow), 'hidden');
        await expect(close).toBeFocused();
        const bounds = await dialog.locator('img').boundingBox();
        assert.ok(bounds.x >= 0 && bounds.y >= 0 && bounds.x + bounds.width <= viewport.width + 1 && bounds.y + bounds.height <= viewport.height + 1, 'Full image must fit inside the viewport');
        await page.keyboard.press('Tab');
        assert.equal(await dialog.evaluate((node) => node.contains(document.activeElement)), true, 'Focus must stay inside the preview');
      }

      const bride = page.locator('.wizard-bride');
      // Click the visible face; the character canvas extends beyond the cover.
      await bride.click({ position: { x: viewport.width < 600 ? 155 : 170, y: 120 } });
      await dialog.waitFor();
      await dialog.locator('img').evaluate((image) => image.decode());
      assert.match(await dialog.locator('img').getAttribute('alt'), /Putri/);
      await close.click();
      await dialog.waitFor({ state: 'hidden' });
      await expect(bride).toBeFocused();
      await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe('');

      await open(page.locator('.wizard-groom'), true);
      await page.keyboard.press('Escape');
      await dialog.waitFor({ state: 'hidden' });

      await page.getByRole('button', { name: 'Lewati sampul' }).focus();
      await page.keyboard.press('Enter');
      await page.locator('.wizard-book[data-phase="inside"]').waitFor();
      const photo = page.locator('.wizard-couple-photo .wizard-image-trigger');
      await open(photo);
      await page.screenshot({ path: `${output}/${name}-${viewport.width}-couple.png` });
      // The top-left corner is outside the figure and close control.
      await dialog.click({ position: { x: 5, y: 5 } });
      await dialog.waitFor({ state: 'hidden' });
      await expect(photo).toBeFocused();

      for (const person of ['groom', 'bride']) {
        const portrait = page.locator(`.wizard-profile-${person} .wizard-image-trigger`);
        await open(portrait, true);
        await dialog.locator('img').click();
        assert.equal(await dialog.count(), 1, 'Clicking the image must keep the preview open');
        await close.click();
        await dialog.waitFor({ state: 'hidden' });
        await expect(portrait).toBeFocused();
      }
      assert.equal(await page.locator('.wizard-interior').evaluate((node) => node.scrollHeight > node.clientHeight), true);
      assert.deepEqual(errors, []);
      await page.close();
      console.log(`PASS ${name} ${viewport.width}: cover, couple and profile previews, close button, Escape, outside click, focus restoration, scroll lock and viewport fit`);
    }
  } finally {
    await browser.close();
  }
}
