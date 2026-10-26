import { chromium, webkit } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';

const base = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';
const output = 'test-results/wizard-chapters';
await mkdir(output, { recursive: true });

for (const [name, engine] of [['chromium', chromium], ['webkit', webkit]]) {
  const browser = await engine.launch({ headless: true, ...(name === 'chromium' ? { channel: process.env.PLAYWRIGHT_CHANNEL ?? 'chrome' } : {}) });
  try {
    const page = await browser.newPage({ viewport: { width: 393, height: 678 } });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.route('**/api/wizard/wishes', (route) => route.fulfill({
      contentType: 'application/json', body: JSON.stringify({ status: 'ready', wishes: [
        { name: 'Sahabat', message: 'Semoga bahagia selalu.' },
        { name: 'Keluarga', message: 'Doa terbaik untuk kalian.' },
      ] }),
    }));
    await page.goto(`${base}/guest/Tamu%20Animasi`);
    await page.locator('.wizard-page[data-assets="ready"]').waitFor();
    // Skip only the camera journey; chapter animations still run normally.
    await page.getByRole('button', { name: 'Lewati sampul' }).focus();
    await page.keyboard.press('Enter');
    await page.locator('.wizard-book[data-phase="inside"]').waitFor();
    const interior = page.locator('.wizard-interior');
    const nav = page.locator('.wizard-chapter-nav');
    const navBox = await nav.boundingBox();
    const settled = async (selector) => {
      await page.waitForFunction((selector) => document.querySelector(selector)?.dataset.chapterReveal === 'shown', selector);
      assert.equal(await page.locator(selector).first().evaluate((node) => getComputedStyle(node).opacity), '1');
    };
    const visibleSettled = () => page.waitForFunction(() => {
      const root = document.querySelector('.wizard-interior');
      const bounds = root.getBoundingClientRect();
      return [...root.querySelectorAll('[data-chapter-reveal]')].every((element) => {
        const rect = element.getBoundingClientRect();
        return rect.bottom <= bounds.top || rect.top >= bounds.bottom - 12 || element.dataset.chapterReveal === 'shown';
      });
    });
    await settled('.wizard-greeting');
    assert.equal(await page.locator('.wizard-profile-bride .wizard-profile-name').getAttribute('data-chapter-reveal'), 'pending', 'Below-fold content should wait for scroll');
    await page.locator('.wizard-profile-bride .wizard-profile-name').scrollIntoViewIfNeeded();
    await settled('.wizard-profile-bride .wizard-profile-name');
    assert.ok(await interior.evaluate((node) => node.scrollTop > 0));

    for (const [id, label, first] of [
      ['acara', 'Acara', '.wizard-full-date'],
      ['rsvp', 'RSVP', '.wizard-form label'],
      ['gift', 'Gift', '#gift h2'],
      ['pasangan', 'Pasangan', '.wizard-greeting'],
    ]) {
      // Sample painted frames as well as the per-element entry keyframes.
      await page.evaluate(() => {
        window.chapterAnimations = [];
        window.chapterFrames = [];
        const interior = document.querySelector('.wizard-interior');
        const sample = () => {
          window.chapterFrames.push({ chapter: interior.dataset.chapter, opacity: Number(getComputedStyle(interior).opacity) });
          window.chapterFrame = requestAnimationFrame(sample);
        };
        sample();
        const original = Element.prototype.animate;
        window.restoreChapterAnimate?.();
        Element.prototype.animate = function (frames, options) {
          if (this.closest('.wizard-interior')) window.chapterAnimations.push({
            className: this.className, frames, options,
          });
          return original.call(this, frames, options);
        };
        window.restoreChapterAnimate = () => { Element.prototype.animate = original; };
      });
      await page.getByRole('button', { name: label, exact: true }).click();
      await page.locator(`.wizard-interior[data-chapter="${id}"][data-transition="idle"]`).waitFor();
      assert.equal(await interior.evaluate((node) => node.scrollTop), 0);
      await settled(first);
      const frames = await page.evaluate(() => {
        cancelAnimationFrame(window.chapterFrame);
        return window.chapterFrames;
      });
      const outgoing = frames.filter((frame) => frame.chapter === frames[0].chapter);
      assert.ok(outgoing.some((frame) => frame.opacity < .5), 'Outgoing chapter should fade before switching');
      for (let index = 1; index < outgoing.length; index++) {
        assert.ok(outgoing[index].opacity <= outgoing[index - 1].opacity + .02, 'Outgoing chapter must not flash back after fading');
      }
      const animations = await page.evaluate(() => window.chapterAnimations);
      assert.ok(animations.some(({ className, options }) => className === 'wizard-interior' && options.duration === 150), 'Outgoing composition should fade');
      const entries = animations.filter(({ options }) => options.duration === 560);
      assert.ok(entries.length >= 2, `${id} needs independent element reveals`);
      assert.ok(entries.some(({ options }) => options.delay > 0), `${id} needs staggered timing`);
      assert.ok(entries.every(({ frames }) => frames[0].opacity === 0 && frames[1].opacity === 1));
      assert.deepEqual(await nav.boundingBox(), navBox, 'Navigation should stay stationary');
      assert.equal(await page.locator('.wizard-section:not([hidden])').count(), 1);
      await page.evaluate(() => window.restoreChapterAnimate());
      await visibleSettled();
      await page.screenshot({ path: `${output}/${id}-${name}.png` });
    }

    await page.getByRole('button', { name: 'RSVP', exact: true }).click();
    await page.locator('#wizard-guest').fill('Nama tetap tersimpan');
    await page.locator('#wizard-message').fill('Ucapan tetap tersimpan');
    assert.equal(await page.locator('#wizard-guest').inputValue(), 'Nama tetap tersimpan');
    await page.locator('.wizard-wishes').scrollIntoViewIfNeeded();
    await page.locator('.wizard-wish').first().waitFor();
    await settled('.wizard-wish');
    await page.getByRole('button', { name: 'Gift', exact: true }).click();
    await page.locator('#gift').waitFor({ state: 'visible' });
    await page.getByRole('button', { name: 'RSVP', exact: true }).click();
    await page.locator('#rsvp').waitFor({ state: 'visible' });
    assert.equal(await page.locator('#wizard-guest').inputValue(), 'Nama tetap tersimpan');
    assert.equal(await page.locator('#wizard-message').inputValue(), 'Ucapan tetap tersimpan');

    // A burst must resolve to the final intent, without several queued transitions.
    await page.evaluate(() => {
      for (const label of ['Acara', 'Pasangan', 'Gift']) {
        [...document.querySelectorAll('.wizard-chapter-nav button')].find((node) => node.textContent === label).click();
      }
    });
    await page.locator('.wizard-interior[data-chapter="gift"][data-transition="idle"]').waitFor();
    await settled('#gift h2');
    assert.equal(await page.locator('.wizard-chapter-nav button[aria-current]').textContent(), 'Gift');

    // Returning to the outgoing chapter must also release its finished fade.
    await page.evaluate(() => {
      for (const label of ['Acara', 'Gift']) {
        [...document.querySelectorAll('.wizard-chapter-nav button')].find((node) => node.textContent === label).click();
      }
    });
    await page.locator('.wizard-interior[data-chapter="gift"][data-transition="idle"]').waitFor();
    assert.equal(await interior.evaluate((node) => getComputedStyle(node).opacity), '1');
    assert.equal(await interior.evaluate((node) => node.getAnimations().length), 0);

    // Changing motion preference during an exit must immediately complete the switch.
    await page.getByRole('button', { name: 'Acara', exact: true }).click();
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.locator('.wizard-interior[data-chapter="acara"][data-transition="idle"]').waitFor();
    assert.equal(await interior.evaluate((node) => node.getAnimations({ subtree: true }).length), 0);
    assert.equal(await interior.locator('[data-chapter-reveal]').count(), 0);
    await page.getByRole('button', { name: 'RSVP', exact: true }).click();
    await page.locator('#rsvp').waitFor({ state: 'visible' });
    assert.equal(await interior.evaluate((node) => node.getAnimations({ subtree: true }).length), 0);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await settled('.wizard-form label');

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.getByRole('button', { name: 'Gift', exact: true }).click();
    await settled('#gift h2');
    await visibleSettled();
    await page.screenshot({ path: `${output}/gift-desktop-${name}.png` });
    await page.getByRole('button', { name: 'Sampul', exact: true }).click();
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.locator('.wizard-book[data-phase="cover"]').waitFor();
    assert.equal(await interior.locator('[data-chapter-reveal]').count(), 0);
    assert.equal(await interior.evaluate((node) => node.getAnimations({ subtree: true }).length), 0);
    assert.deepEqual(errors, []);
    console.log(`PASS ${name}: per-element stagger, scroll reveals, all chapters, dynamic wishes, form persistence, rapid navigation, stationary menu, reduced motion during transitions, cleanup`);
  } finally {
    await browser.close();
  }
}
