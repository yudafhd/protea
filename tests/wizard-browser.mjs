import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';

const base = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';
const output = 'test-results/wizard';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL ?? 'msedge', headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (message) => {
  if (message.type() === 'error' && !message.text().includes('503 (Service Unavailable)')) errors.push(message.text());
});
page.on('response', (response) => {
  if (response.status() >= 400 && !response.url().includes('/api/rsvp')) errors.push(`HTTP ${response.status()}: ${response.url()}`);
});
const phase = (value) => page.locator(`.wizard-book[data-phase="${value}"]`).waitFor();
const progress = () => page.locator('.wizard-book').evaluate((node) => Number(node.dataset.cameraProgress));
const stationary = async () => {
  assert.ok(await page.evaluate(() => window.scrollY === 0 && document.documentElement.scrollHeight <= innerHeight + 1), 'Camera travel scrolled the document');
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Horizontal overflow');
  const shorelineGap = await page.evaluate(() => {
    const castle = document.querySelector('.wizard-castle').getBoundingClientRect();
    const lake = document.querySelector('.wizard-lake').getBoundingClientRect();
    // The lake's waterline must meet the castle's rocky foot, inside its soft mist edge.
    return Math.abs(lake.y + lake.height * .68 - (castle.y + castle.height * .953));
  });
  assert.ok(shorelineGap < 3, `Lake separated from castle by ${shorelineGap.toFixed(1)}px`);
};
try {
  await page.goto(`${base}/templates/wizard?to=Keluarga%20Pratama`);
  await page.waitForFunction(() => document.querySelector('.wizard-book')?.style.getPropertyValue('--wizard-x') !== '');
  await page.evaluate(() => document.fonts.ready);
  await page.locator('.wizard-cover img').evaluateAll((images) => Promise.all(images.map((image) => image.decode())));
  assert.equal(await page.locator('.wizard-cover-bottom strong').textContent(), 'Keluarga Pratama');
  await stationary();
  await page.screenshot({ animations: 'disabled', path: `${output}/cover-mobile.png` });
  const initialCastle = await page.locator('.wizard-castle').boundingBox();
  await page.getByRole('button', { name: 'Buka undangan' }).click();
  await phase('entering');
  await page.waitForFunction(() => Number(document.querySelector('.wizard-book').dataset.cameraProgress) > .35);
  const approaching = await page.locator('.wizard-castle').boundingBox();
  assert.ok(approaching.width > initialCastle.width * 1.7, 'Castle does not approach the camera');
  assert.ok(Number(await page.locator('.wizard-bride').evaluate((node) => getComputedStyle(node).opacity)) < .5, 'Foreground does not move out of the way');
  await stationary();
  await page.screenshot({ path: `${output}/camera-approach-mobile.png` });
  const beforeResize = await progress();
  await page.setViewportSize({ width: 768, height: 1024 });
  assert.ok(await progress() >= beforeResize, 'Resize reset the journey');
  await phase('inside');
  assert.equal(await progress(), 1);
  await page.setViewportSize({ width: 390, height: 844 });
  await stationary();
  assert.equal(await page.locator(':focus').getAttribute('id'), 'wizard-couple-title');
  assert.ok(await page.locator('.wizard-chapter-nav').isVisible());
  await page.screenshot({ animations: 'disabled', path: `${output}/castle-arrival-mobile.png` });

  await page.getByRole('button', { name: 'Acara', exact: true }).click();
  assert.ok(await page.locator('#acara').isVisible());
  assert.ok(await page.locator('#pasangan').isHidden());
  assert.equal(await page.locator('.wizard-interior').evaluate((node) => node.scrollTop), 0);
  const calendar = decodeURIComponent((await page.getByRole('link', { name: 'Simpan tanggalnya' }).getAttribute('href')).split(',').slice(1).join(','));
  assert.ok(calendar.includes('DTSTART:20261102T020000Z'));
  assert.ok(calendar.includes('DTSTART:20261102T040000Z'));
  assert.ok((await page.getByRole('link', { name: 'Petunjuk arah' }).getAttribute('href')).includes('Empu%20Sendok'));
  await page.screenshot({ animations: 'disabled', path: `${output}/events-mobile.png` });
  await page.getByRole('button', { name: 'Surat', exact: true }).click();
  assert.ok(await page.locator('#surat').isVisible());
  await page.screenshot({ animations: 'disabled', path: `${output}/letter-mobile.png` });
  await page.getByRole('button', { name: 'RSVP', exact: true }).click();
  assert.equal(await page.locator('#wizard-guest').inputValue(), 'Keluarga Pratama');
  await page.locator('#wizard-guest').fill('   ');
  await page.getByRole('button', { name: 'Kirim konfirmasi' }).click();
  assert.equal(await page.locator('.wizard-form-error').textContent(), 'Silakan isi nama Anda.');
  await page.locator('#wizard-guest').fill('Uji Template Wizard');
  await page.locator('#wizard-attendance').selectOption('no');
  assert.ok(await page.locator('#wizard-guests').isDisabled());
  await page.locator('#wizard-attendance').selectOption('yes');
  await page.locator('#wizard-guests').selectOption('2');
  await page.locator('#wizard-message').fill('Pengujian formulir template wizard.');
  // Exercise the UI without appending responses to the user's demo records.
  await page.route('**/api/rsvp', (route) => route.fulfill({ status: 503, contentType: 'application/json', body: '{"error":"test failure"}' }));
  await page.getByRole('button', { name: 'Kirim konfirmasi' }).click();
  await page.locator('.wizard-form-error[role="alert"]').waitFor();
  assert.ok(await page.getByRole('button', { name: 'Kirim konfirmasi' }).isEnabled());
  await page.unroute('**/api/rsvp');
  await page.route('**/api/rsvp', async (route) => {
    assert.deepEqual(route.request().postDataJSON(), { invitationId: 'demo', name: 'Uji Template Wizard', attendance: 'yes', guests: 2, message: 'Pengujian formulir template wizard.' });
    await route.fulfill({ status: 201, contentType: 'application/json', body: '{"received":true}' });
  });
  await page.getByRole('button', { name: 'Kirim konfirmasi' }).click();
  await page.getByRole('status').filter({ hasText: 'Terima kasih' }).waitFor();
  await stationary();
  await page.screenshot({ animations: 'disabled', path: `${output}/rsvp-mobile.png` });

  await page.getByRole('button', { name: 'Sampul', exact: true }).click();
  await phase('leaving');
  await page.waitForFunction(() => Number(document.querySelector('.wizard-book').dataset.cameraProgress) < .7);
  await stationary();
  await phase('cover');
  assert.equal(await progress(), 0);
  assert.equal(await page.locator(':focus').getAttribute('class'), 'wizard-open');
  const returnedCastle = await page.locator('.wizard-castle').boundingBox();
  assert.ok(Math.abs(returnedCastle.width - initialCastle.width) < 1, 'Return journey did not restore the camera');

  for (const viewport of [{ width: 320, height: 740 }, { width: 360, height: 640 }, { width: 393, height: 678 }, { width: 430, height: 740 }, { width: 390, height: 844 }, { width: 768, height: 1024 }, { width: 1440, height: 900 }, { width: 844, height: 390 }]) {
    await page.setViewportSize(viewport);
    await stationary();
    const cover = await page.locator('.wizard-cover').boundingBox();
    if (viewport.width <= 600 && viewport.height > viewport.width) {
      const book = await page.locator('.wizard-book').boundingBox();
      assert.ok(Math.abs(book.x) < 1 && Math.abs(book.width - viewport.width) < 1, 'Phone invitation leaves side gutters');
      assert.ok(Math.abs(book.height - viewport.height) < 1, 'Phone invitation does not fill the visible height');
      assert.ok(Math.abs(cover.width - viewport.width) < 1, 'Phone cover is narrower than the viewport');
    }
    const open = await page.getByRole('button', { name: 'Buka undangan' }).boundingBox();
    assert.ok(open.y >= cover.y && open.y + open.height <= cover.y + cover.height + 1, 'Opening button escapes cover');
    const address = await page.locator('.wizard-cover-address').boundingBox();
    const motto = await page.locator('.wizard-cover-motto').boundingBox();
    assert.ok(motto.y >= address.y + address.height - 1, `Cover address and motto overlap at ${viewport.width}x${viewport.height}: ${JSON.stringify({address,motto})}`);
    if (viewport.width === 1440) {
      await page.screenshot({ animations: 'disabled', path: `${output}/cover-desktop.png` });
      await page.mouse.move(viewport.width / 2 + cover.width / 4, 350);
      await page.waitForFunction(() => Number(document.querySelector('.wizard-book').style.getPropertyValue('--wizard-x')) > .3);
    }
    if (viewport.width === 393) await page.screenshot({ animations: 'disabled', path: `${output}/cover-phone-browser.png` });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.getByRole('button', { name: 'Buka undangan' }).click();
    await phase('inside');
    assert.equal(await progress(), 1);
    await stationary();
    const panel = await page.locator('.wizard-interior').boundingBox();
    assert.ok(panel.y >= 0 && panel.y + panel.height <= viewport.height, 'Invitation panel escapes the viewport');
    if (viewport.width === 1440) await page.screenshot({ animations: 'disabled', path: `${output}/castle-arrival-desktop.png` });
    await page.getByRole('button', { name: 'Sampul', exact: true }).click();
    await phase('cover');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Buka undangan' }).click();
  await phase('entering');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await phase('inside');
  assert.equal(await progress(), 1, 'Reduced motion did not finish the in-flight journey');
  await page.getByRole('button', { name: 'Sampul', exact: true }).click();
  await phase('cover');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.getByRole('button', { name: 'Lewati sampul' }).focus();
  await page.keyboard.press('Enter');
  await phase('inside');
  await stationary();
  await page.goto(base);
  await page.locator('#open-theme-wizard').waitFor();
  assert.equal(await page.locator('#open-theme-wizard').getAttribute('href'), '/templates/wizard');
  assert.deepEqual(errors, []);
  console.log('PASS: phone fills visible viewport without side gutters, short phone browser sizes, shoreline stays attached during camera travel and resize, no document scroll, reversible journey, eight viewport sizes, chapter panels, calendar, maps, RSVP retry/payload, reduced-motion changes, keyboard skip, catalog, no browser errors.');
} finally {
  await browser.close();
}
