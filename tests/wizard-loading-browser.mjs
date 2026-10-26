import { chromium, webkit } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';

const base = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';
const output = 'test-results/wizard-loading';
await mkdir(output, { recursive: true });
const deferred = () => {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
};

for (const [name, engine] of [['chromium', chromium], ['webkit', webkit]]) {
  const browser = await engine.launch({ headless: true, ...(name === 'chromium' ? { channel: process.env.PLAYWRIGHT_CHANNEL ?? 'chrome' } : {}) });
  try {
    const page = await browser.newPage({ viewport: { width: 393, height: 678 }, hasTouch: true, reducedMotion: 'reduce' });
    const errors = [];
    const audioRequests = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('request', (request) => { if (request.url().includes('/assets/wizard/audio/')) audioRequests.push(request.url()); });
    const held = ['couple-picnic-hd', 'ironbound-storybook.mp3', 'cormorant-latin-400-italic.woff2'].map((file) => ({ file, seen: deferred(), release: deferred() }));
    await page.route('**/*', async (route) => {
      const blocked = held.find(({ file }) => decodeURIComponent(route.request().url()).includes(file));
      if (blocked) { blocked.seen.resolve(); await blocked.release.promise; }
      await route.continue();
    });
    await page.goto(`${base}/templates/wizard`, { waitUntil: 'domcontentloaded' });
    await Promise.all(held.map(({ seen }) => seen.promise));
    const loader = page.getByRole('region', { name: 'Pemuatan undangan' });
    assert.ok(await loader.isVisible());
    assert.ok(await page.locator('.wizard-open').isDisabled());
    await page.keyboard.press('Tab');
    assert.equal(await page.locator('.wizard-book :focus, .wizard-chapter-nav :focus').count(), 0);
    await page.locator('.wizard-open').evaluate((button) => button.click());
    assert.equal(await page.locator('.wizard-book').getAttribute('data-phase'), 'cover');
    held[0].release.resolve();
    held[2].release.resolve();
    await page.locator('.wizard-couple-photo img').evaluate((image) => image.decode());
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `${output}/loader-${name}.png` });
    assert.ok(await loader.isVisible(), 'The loader must still wait for audio');
    held[1].release.resolve();
    await page.locator('.wizard-page[data-assets="ready"]').waitFor();
    assert.equal(await loader.count(), 0);
    assert.equal(await page.locator('.wizard-page').getAttribute('data-sound'), 'idle', 'Preloading must not play audio');
    assert.ok(await page.locator('.wizard-book img').evaluateAll((images) => images.every((image) => image.complete && image.naturalWidth > 0)), 'Hidden chapter images must also finish loading');
    assert.equal(audioRequests.length, 3);

    for (const viewport of [{ width: 320, height: 568 }, { width: 360, height: 640 }, { width: 393, height: 678 }, { width: 430, height: 932 }]) {
      await page.setViewportSize(viewport);
      const text = await page.locator('.wizard-cover-bottom').evaluate((node) => {
        const label = node.querySelector('span');
        const guest = node.querySelector('strong');
        return { labelSize: parseFloat(getComputedStyle(label).fontSize), guestSize: parseFloat(getComputedStyle(guest).fontSize), label: label.getBoundingClientRect().toJSON(), guest: guest.getBoundingClientRect().toJSON() };
      });
      assert.ok(text.labelSize >= 14 && text.guestSize >= 22, `Recipient text is too small: ${JSON.stringify({ viewport, text })}`);
      for (const box of [text.label, text.guest]) assert.ok(box.x >= 0 && box.right <= viewport.width && box.y >= 0 && box.bottom <= viewport.height, 'Recipient text escapes the phone viewport');
    }
    await page.setViewportSize({ width: 393, height: 678 });
    await page.screenshot({ path: `${output}/cover-${name}.png` });
    await page.getByRole('button', { name: 'Buka undangan', exact: true }).click();
    const supportsAudio = await page.evaluate(() => typeof window.AudioContext === 'function' || typeof window.webkitAudioContext === 'function');
    await page.locator(`.wizard-page[data-sound="${supportsAudio ? 'playing' : 'error'}"]`).waitFor();
    if (!supportsAudio) assert.ok(await page.getByRole('button', { name: 'Coba putar suara', exact: true }).isVisible(), 'A browser without Web Audio must expose the retry state');
    assert.equal(audioRequests.length, 3, 'Opening must reuse the downloaded audio');
    const greeting = page.locator('#pasangan .wizard-greeting');
    assert.ok(await greeting.isVisible());
    assert.equal(await greeting.getAttribute('lang'), 'ar');
    assert.equal(await greeting.getAttribute('dir'), 'rtl');
    const intro = await page.locator('#pasangan .wizard-body-copy').boundingBox();
    const greetingBox = await greeting.boundingBox();
    assert.ok(greetingBox.y + greetingBox.height < intro.y, 'The Arabic greeting should appear before the introduction');
    await page.screenshot({ path: `${output}/couple-${name}.png` });

    const retry = await browser.newPage({ viewport: { width: 320, height: 568 }, reducedMotion: 'reduce' });
    retry.on('pageerror', (error) => errors.push(error.message));
    let failImage = true;
    await retry.route('**/_next/image?**', (route) => decodeURIComponent(route.request().url()).includes('couple-picnic-hd') && failImage
      ? route.fulfill({ status: 503, body: 'Temporary test failure' }) : route.continue());
    await retry.goto(`${base}/templates/wizard?to=${encodeURIComponent('Bapak Ahmad dan Ibu Siti beserta Keluarga Besar yang Berbahagia')}`);
    await retry.locator('.wizard-page[data-assets="error"]').waitFor();
    assert.ok(await retry.locator('.wizard-open').isDisabled());
    failImage = false;
    await retry.getByRole('button', { name: 'Coba lagi', exact: true }).click();
    await retry.locator('.wizard-page[data-assets="ready"]').waitFor();
    const longName = await retry.locator('.wizard-cover-bottom>strong').boundingBox();
    assert.ok(longName.x >= 0 && longName.x + longName.width <= 320 && longName.y > 0, 'Long recipient names must wrap inside the cover');
    assert.deepEqual(errors, []);
    await retry.close();
    console.log(`PASS ${name}: waits for hidden images/fonts/audio, no premature opening or autoplay, readable recipient at four phone sizes, Arabic greeting, audio download reuse, failed image retry, long recipient name`);
  } finally {
    await browser.close();
  }
}
