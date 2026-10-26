import { chromium, webkit } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';

const base = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';
const output = 'test-results/wizard-routes';
await mkdir(output, { recursive: true });

for (const [name, engine] of [['chromium', chromium], ['webkit', webkit]]) {
  const browser = await engine.launch({ headless: true, ...(name === 'chromium' ? { channel: process.env.PLAYWRIGHT_CHANNEL ?? 'chrome' } : {}) });
  try {
    const page = await browser.newPage({ viewport: { width: 320, height: 568 }, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));

    for (const [path, guest] of [
      ['/', 'Tamu Istimewa'],
      ['/guest/ahmad%20yuda%20fahrudin', 'Ahmad Yuda Fahrudin'],
      ['/guest/%20%20AHMAD%20%20yuda%20FAHRUDIN%20', 'Ahmad Yuda Fahrudin'],
      ['/guest/%20', 'Tamu Istimewa'],
      ['/guest/%C3%A9va%20o%27connor', "Éva O'Connor"],
      ['/templates/wizard?to=Keluarga%20Pratama', 'Keluarga Pratama'],
      ['/?to=Keluarga%20Pratama', 'Keluarga Pratama'],
    ]) {
      const response = await page.goto(`${base}${path}`);
      assert.equal(response.status(), 200, `Route failed: ${path}`);
      await page.locator('.wizard-page[data-assets="ready"]').waitFor();
      assert.equal(await page.locator('.wizard-cover-bottom strong').textContent(), guest);
    }

    await page.goto(`${base}/guest/ahmad%20yuda%20fahrudin`);
    await page.locator('.wizard-page[data-assets="ready"]').waitFor();
    for (const viewport of [{ width: 320, height: 568 }, { width: 360, height: 640 }, { width: 393, height: 678 }]) {
      await page.setViewportSize(viewport);
      await page.evaluate(() => document.fonts.ready);
      const greeting = page.locator('.wizard-cover-bottom>span');
      const recipient = page.locator('.wizard-cover-bottom>strong');
      assert.ok(await greeting.evaluate((node) => parseFloat(getComputedStyle(node).fontSize) >= 18));
      assert.ok(await recipient.evaluate((node) => parseFloat(getComputedStyle(node).fontSize) >= 28));
      for (const locator of [greeting, recipient, page.locator('.wizard-open')]) {
        const box = await locator.boundingBox();
        assert.ok(box.x >= 0 && box.y >= 0 && box.x + box.width <= viewport.width + 1 && box.y + box.height <= viewport.height + 1, 'Recipient or opening button escaped the viewport');
      }
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await page.screenshot({ path: `${output}/guest-${name}-${viewport.width}.png` });
    }

    await page.getByRole('button', { name: 'Buka undangan', exact: true }).click();
    await page.locator('.wizard-book[data-phase="inside"]').waitFor();
    assert.equal(await page.locator('.wizard-chapter-nav').evaluate((node) => getComputedStyle(node).backgroundColor), 'rgb(65, 13, 18)');
    await page.screenshot({ path: `${output}/menu-${name}.png` });
    await page.getByRole('button', { name: 'RSVP', exact: true }).click();
    assert.equal(await page.locator('#wizard-guest').inputValue(), 'Ahmad Yuda Fahrudin');

    assert.equal(await page.getByRole('link', { name: 'Koleksi undangan' }).count(), 0);
    const catalogResponse = await page.goto(`${base}/catalog`);
    assert.equal(catalogResponse.status(), 200);
    await page.getByRole('link', { name: 'Protēa Home', exact: true }).waitFor();
    assert.deepEqual(errors, []);
    console.log(`${name}: default Wizard, decoded guest names, RSVP prefill, mobile recipient sizing, themed navigation and catalog passed`);
  } finally {
    await browser.close();
  }
}
