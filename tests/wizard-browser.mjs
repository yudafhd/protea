import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';

const base = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';
const output = 'test-results/wizard';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL ?? 'msedge', headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
await page.addInitScript(() => {
  window.wizardAudioStarts = [];
  const create = AudioContext.prototype.createBufferSource;
  AudioContext.prototype.createBufferSource = function (...args) {
    const source = create.apply(this, args);
    const start = source.start;
    source.start = function (...parameters) {
      window.wizardAudioStarts.push({ duration: source.buffer?.duration, loop: source.loop, progress: Number(document.querySelector('.wizard-book')?.dataset.cameraProgress) });
      return start.apply(this, parameters);
    };
    return source;
  };
});
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (message) => {
  if (message.type() === 'error' && !message.text().includes('503 (Service Unavailable)')) errors.push(message.text());
});
page.on('response', (response) => {
  if (response.status() >= 400 && !['/api/rsvp', '/api/wizard/wishes'].some((path) => response.url().includes(path))) errors.push(`HTTP ${response.status()}: ${response.url()}`);
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
  const touchPage = await browser.newPage({ viewport: { width: 393, height: 678 }, isMobile: true, hasTouch: true });
  touchPage.on('pageerror', (error) => errors.push(error.message));
  await touchPage.goto(`${base}/templates/wizard`);
  await touchPage.locator('.wizard-page[data-assets="ready"]').waitFor();
  await touchPage.waitForFunction(() => document.querySelector('.wizard-book')?.style.getPropertyValue('--wizard-x') !== '');
  assert.ok(await touchPage.evaluate(() => matchMedia('(pointer: coarse)').matches), 'Touch device was not emulated');
  const idlePose = await touchPage.locator('.wizard-owl').evaluate((node) => getComputedStyle(node).translate);
  await touchPage.waitForFunction((initial) => getComputedStyle(document.querySelector('.wizard-owl')).translate !== initial, idlePose);
  assert.equal(await touchPage.locator('.wizard-book').getAttribute('data-phase'), 'cover');
  assert.equal(await touchPage.locator('.wizard-book').evaluate((node) => node.style.getPropertyValue('--wizard-x')), '0');
  assert.equal(await touchPage.locator('.wizard-ambient-toggle').count(), 0, 'Ambient toggle should be removed');
  const ambientStates = () => touchPage.evaluate(() => [...document.querySelectorAll('.wizard-clouds,.wizard-mist,.wizard-owl,.wizard-banner,.wizard-spark')].flatMap((node) => node.getAnimations().map((animation) => animation.playState)));
  const running = await ambientStates();
  assert.ok(running.length >= 5 && running.every((state) => state === 'running'), 'Ambient motion did not start automatically');
  const hoverDistance = await touchPage.locator('.wizard-owl').evaluate((node) => {
    const animation = node.getAnimations()[0];
    const position = () => getComputedStyle(node).translate.split(' ').map(Number.parseFloat);
    animation.currentTime = 2000;
    const start = position();
    animation.currentTime = 5500;
    const end = position();
    return Math.hypot(end[0] - start[0], end[1] - start[1]);
  });
  assert.ok(hoverDistance > 6 && hoverDistance < 15, 'Owl hover is too faint or too large');
  await touchPage.emulateMedia({ reducedMotion: 'reduce' });
  assert.equal((await ambientStates()).length, 0, 'Reduced motion leaves ambient animations running');
  await touchPage.emulateMedia({ reducedMotion: 'no-preference' });
  await touchPage.getByRole('button', { name: 'Buka undangan' }).click();
  await touchPage.locator('.wizard-book[data-phase="entering"]').waitFor();
  assert.ok((await ambientStates()).every((state) => state === 'paused'), 'Ambient motion was not held during camera travel');
  await touchPage.close();

  await page.goto(`${base}/templates/wizard?to=Keluarga%20Pratama`);
  await page.locator('.wizard-page[data-assets="ready"]').waitFor();
  await page.waitForFunction(() => document.querySelector('.wizard-book')?.style.getPropertyValue('--wizard-x') !== '');
  await page.evaluate(() => document.fonts.ready);
  await page.locator('.wizard-cover img').evaluateAll((images) => Promise.all(images.map((image) => image.decode())));
  await page.locator('.wizard-castle-entry img').evaluateAll((images) => Promise.all(images.map((image) => image.decode())));
  assert.equal(await page.locator('.wizard-cover-bottom strong').textContent(), 'Keluarga Pratama');
  await stationary();
  await page.screenshot({ animations: 'disabled', path: `${output}/cover-mobile.png` });
  const initialCastle = await page.locator('.wizard-castle').boundingBox();
  const initialOwl = await page.locator('.wizard-owl').boundingBox();
  const initialMoon = await page.locator('.wizard-moon').boundingBox();
  assert.equal(await page.evaluate(() => window.wizardAudioStarts.length), 0, 'Audio played before a user gesture');
  await page.getByRole('button', { name: 'Buka undangan' }).click();
  await phase('entering');
  await page.waitForFunction(() => [...document.querySelectorAll('.wizard-cover > :not(.wizard-cover-art)')].every((node) => {
    const style = getComputedStyle(node);
    return style.visibility === 'hidden' && Number(style.opacity) === 0;
  }), null, { timeout: 1500 });
  await page.waitForFunction(() => Number(document.querySelector('.wizard-book').dataset.cameraProgress) > .16);
  const departing = await page.evaluate(() => {
    const book = document.querySelector('.wizard-book').getBoundingClientRect();
    const bride = document.querySelector('.wizard-bride').getBoundingClientRect();
    const groom = document.querySelector('.wizard-groom').getBoundingClientRect();
    return { brideOutside: bride.right < book.left, groomOutside: groom.left > book.right };
  });
  assert.ok(departing.brideOutside && departing.groomOutside, 'Characters did not leave through opposite sides');
  const approachingOwl = await page.locator('.wizard-owl').boundingBox();
  assert.ok(approachingOwl.width > initialOwl.width * 3, 'Owl did not approach the camera');
  assert.equal(await page.locator('.wizard-castle-entry').evaluate((node) => Number(getComputedStyle(node).opacity)), 0, 'Gate appeared before the exterior journey finished');
  await page.screenshot({ path: `${output}/owl-flyby-mobile.png` });
  await page.waitForFunction(() => Number(document.querySelector('.wizard-book').dataset.cameraProgress) > .35);
  const approaching = await page.locator('.wizard-castle').boundingBox();
  assert.ok(approaching.width > initialCastle.width * 1.15, 'Castle does not approach the camera');
  assert.ok(approaching.width <= initialCastle.width * 1.26, 'Castle zoom is too close');
  const approachingMoon = await page.locator('.wizard-moon').boundingBox();
  const moonViewport = await page.locator('.wizard-book').boundingBox();
  assert.ok(approachingMoon.width > initialMoon.width * 2.5, 'Moon did not grow towards the camera');
  assert.ok(Math.abs(approachingMoon.x + approachingMoon.width / 2 - (moonViewport.x + moonViewport.width / 2)) < moonViewport.width * .04, 'Moon did not move to the horizontal centre');
  assert.ok(Math.abs(approachingMoon.y + approachingMoon.height / 2 - (moonViewport.y + moonViewport.height / 2)) < moonViewport.height * .01, 'Moon did not move to the vertical centre');
  assert.ok(Number(await page.locator('.wizard-bride').evaluate((node) => getComputedStyle(node).opacity)) < .5, 'Foreground does not move out of the way');
  await stationary();
  await page.screenshot({ path: `${output}/camera-approach-mobile.png` });
  await page.waitForFunction(() => Number(document.querySelector('.wizard-book').dataset.cameraProgress) >= .58);
  assert.equal(await page.evaluate(() => window.wizardAudioStarts.filter((entry) => !entry.loop).length), 0, 'Door audio played before the gate moved');
  assert.ok(await page.locator('.wizard-landscape-world').evaluate((node) => Number(getComputedStyle(node).opacity) < .001), 'Castle remains visible in the gate scene');
  const passedOwl = await page.locator('.wizard-owl').boundingBox();
  const invitationBounds = await page.locator('.wizard-book').boundingBox();
  assert.ok(passedOwl.x > invitationBounds.x + invitationBounds.width || passedOwl.y + passedOwl.height < invitationBounds.y, 'Owl did not pass beyond the viewport');
  await page.screenshot({ path: `${output}/gate-fullscreen-mobile.png` });
  await page.waitForFunction(() => Number(document.querySelector('.wizard-book').dataset.cameraProgress) > .6);
  assert.equal(await page.locator('.wizard-castle-entry').evaluate((node) => Number(getComputedStyle(node).opacity)), 1, 'Hall did not appear behind the gate');
  const gatePose = await page.locator('.wizard-door-left').evaluate((node) => getComputedStyle(node).transform);
  await page.waitForFunction((initial) => getComputedStyle(document.querySelector('.wizard-door-left')).transform !== initial, gatePose);
  await page.screenshot({ path: `${output}/gate-opening-mobile.png` });
  const beforeResize = await progress();
  await page.setViewportSize({ width: 768, height: 1024 });
  assert.ok(await progress() >= beforeResize, 'Resize reset the journey');
  await phase('inside');
  assert.equal(await progress(), 1);
  await page.locator('.wizard-page[data-sound="playing"]').waitFor();
  const openingAudio = await page.evaluate(() => window.wizardAudioStarts);
  assert.equal(openingAudio.filter((entry) => entry.loop && Math.abs(entry.duration - 90) < .08).length, 1, 'Music did not start exactly once');
  const openingEffect = openingAudio.filter((entry) => !entry.loop);
  assert.equal(openingEffect.length, 1, 'Opening effect must play once');
  assert.ok(Math.abs(openingEffect[0].duration - 2.8) < .01 && openingEffect[0].progress >= .62 && openingEffect[0].progress <= .95, `Opening audio is not aligned with the moving doors: ${JSON.stringify(openingEffect)}`);
  await page.setViewportSize({ width: 390, height: 844 });
  await stationary();
  assert.equal(await page.locator(':focus').getAttribute('id'), 'wizard-couple-title');
  await page.getByRole('button', { name: 'Matikan suara', exact: true }).click();
  await page.locator('.wizard-page[data-sound="muted"]').waitFor();
  await page.getByRole('button', { name: 'Aktifkan suara', exact: true }).click();
  await page.locator('.wizard-page[data-sound="playing"]').waitFor();
  assert.equal(await page.evaluate(() => window.wizardAudioStarts.filter((entry) => entry.loop).length), 1, 'Unmuting duplicated the music');
  assert.ok(await page.locator('.wizard-chapter-nav').isVisible());
  const couplePhoto = page.getByRole('img', { name: 'Potret piknik bersama Yuda dan Putri' });
  await couplePhoto.evaluate((image) => image.decode());
  assert.equal(await couplePhoto.evaluate((image) => image.naturalWidth > 0), true, 'Edited couple photograph failed to load');
  assert.ok((await page.locator('#pasangan .wizard-body-copy').textContent()).startsWith('Atas Rahmat Tuhan Yang Maha Esa'));
  assert.equal(await page.locator('#pasangan blockquote').textContent(), '“Dan di antara tanda-tanda kebesaran-Nya, Dia menciptakan pasangan untukmu agar kamu merasa tenteram.”');
  await page.screenshot({ animations: 'disabled', path: `${output}/castle-arrival-mobile.png` });
  await couplePhoto.scrollIntoViewIfNeeded();
  await page.screenshot({ animations: 'disabled', path: `${output}/couple-photo-mobile.png` });
  assert.equal(await page.locator('.wizard-profile').count(), 2);
  assert.deepEqual(await page.locator('.wizard-profile-name').allTextContents(), ['Ahmad Yuda Fahrudin', 'Rischyanti Putri Octavia']);
  assert.deepEqual(await page.locator('.wizard-profile-parent').allTextContents(), ['Bpk Yusuf Wibisono', 'Ibu Siti Romadoni', 'Alm. Bpk Sugeng Utomo', 'Ibu Sulastri']);
  await page.locator('.wizard-profile-groom').scrollIntoViewIfNeeded();
  await page.locator('.wizard-profile-groom img').evaluate((image) => image.decode());
  await page.screenshot({ animations: 'disabled', path: `${output}/profile-yuda-mobile.png` });
  await page.locator('.wizard-profile-bride').scrollIntoViewIfNeeded();
  await page.locator('.wizard-profile-bride img').evaluate((image) => image.decode());
  await page.screenshot({ animations: 'disabled', path: `${output}/profile-putri-mobile.png` });
  assert.equal(await page.locator('.wizard-gate').evaluate((node) => getComputedStyle(node).visibility), 'hidden', 'Opened gate still covers the invitation');
  assert.equal(await page.locator('.wizard-hall').evaluate((node) => node.complete && node.naturalWidth > 0), true, 'Hall background failed to load');

  await page.getByRole('button', { name: 'Acara', exact: true }).click();
  await page.locator('#acara').waitFor({ state: 'visible' });
  assert.ok(await page.locator('#pasangan').isHidden());
  assert.equal(await page.locator('.wizard-interior').evaluate((node) => node.scrollTop), 0);
  const calendar = decodeURIComponent((await page.getByRole('link', { name: 'Simpan tanggalnya' }).getAttribute('href')).split(',').slice(1).join(','));
  assert.ok(calendar.includes('DTSTART:20261102T020000Z'));
  assert.ok(calendar.includes('DTSTART:20261102T040000Z'));
  assert.equal(await page.getByRole('link', { name: 'Google Map' }).getAttribute('href'), 'https://maps.app.goo.gl/JRXDjYGB8LeEy6cB8');
  await page.screenshot({ animations: 'disabled', path: `${output}/events-mobile.png` });
  const locationQr = page.getByRole('img', { name: 'QR lokasi pernikahan Yuda dan Putri di Google Maps' });
  await locationQr.scrollIntoViewIfNeeded();
  await locationQr.evaluate((image) => image.decode());
  assert.equal(await locationQr.evaluate((image) => image.naturalWidth), 1024);
  const [qrDownload] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('link', { name: 'Unduh QR lokasi' }).click(),
  ]);
  assert.equal(qrDownload.suggestedFilename(), 'qr-lokasi-pernikahan-yuda-putri.png');
  await qrDownload.saveAs(`${output}/location-qr-download.png`);
  await page.screenshot({ animations: 'disabled', path: `${output}/location-qr-mobile.png` });
  await page.getByRole('button', { name: 'Gift', exact: true }).click();
  await page.locator('#gift').waitFor({ state: 'visible' });
  assert.equal(await page.getByRole('button', { name: 'Surat', exact: true }).count(), 0);
  assert.equal(await page.locator('.wizard-gift-number').textContent(), '1070071661');
  assert.equal(await page.locator('.wizard-gift-bank h3').textContent(), 'BCA');
  assert.equal(await page.locator('.wizard-gift-holder strong').textContent(), 'AHMAD YUDA FAHRUDIN');
  assert.equal(await page.locator('.wizard-gift-bank>span').count(), 0);
  // Keep test copies inside this page rather than changing the user's clipboard.
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
    writeText: async () => { throw new Error('Clipboard unavailable in test'); },
  } }));
  await page.getByRole('button', { name: 'Salin nomor rekening' }).click();
  await page.getByRole('status').filter({ hasText: 'Nomor belum tersalin' }).waitFor();
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
    writeText: async (number) => { window.wizardTestCopiedNumber = number; },
  } }));
  await page.getByRole('button', { name: 'Salin nomor rekening' }).click();
  await page.getByRole('button', { name: 'Nomor tersalin' }).waitFor();
  assert.equal(await page.evaluate(() => window.wizardTestCopiedNumber), '1070071661');
  await page.screenshot({ animations: 'disabled', path: `${output}/gift-mobile.png` });
  let wishesMode = 'ready';
  const wishFixtures = [
    { name: 'Keluarga Contoh', message: 'Selamat menempuh hidup baru. Semoga selalu bahagia.' },
    { name: 'Tamu Contoh', message: '<img src=x onerror=alert(1)>\nDoa dan harapan baik.' },
    ...Array.from({ length: 5 }, (_, index) => ({ name: `Sahabat ${index + 1}`, message: 'Semoga penuh kasih dan kebahagiaan.' })),
  ];
  await page.route('**/api/wizard/wishes', (route) => route.fulfill({
    status: wishesMode === 'error' ? 503 : 200, contentType: 'application/json',
    body: JSON.stringify({ status: wishesMode === 'unconfigured' ? 'unconfigured' : 'ready', wishes: wishesMode === 'ready' ? wishFixtures : [] }),
  }));
  await page.getByRole('button', { name: 'RSVP', exact: true }).click();
  await page.locator('#rsvp').waitFor({ state: 'visible' });
  assert.equal(await page.locator('#wizard-guest').inputValue(), 'Keluarga Pratama');
  assert.deepEqual(await page.locator('.wizard-chapter-nav button').allTextContents(), ['Sampul', 'Pasangan', 'Acara', 'RSVP', 'Gift']);
  const attendanceBounds = await page.locator('#wizard-attendance').boundingBox();
  const guestBounds = await page.locator('#wizard-guests').boundingBox();
  assert.ok(guestBounds.y > attendanceBounds.y + attendanceBounds.height, 'RSVP selects must occupy separate rows');
  await page.locator('#wizard-guest').fill('   ');
  await page.getByRole('button', { name: /^(Lanjut|Kirim) ke Google Form$/ }).click();
  assert.equal(await page.locator('.wizard-form-error').textContent(), 'Silakan isi nama Anda.');
  await page.locator('#wizard-guest').fill('Uji Template Wizard');
  await page.locator('#wizard-attendance').selectOption('no');
  assert.ok(await page.locator('#wizard-guests').isDisabled());
  await page.locator('#wizard-message').fill('Doa & harapan: bahagia selalu!');
  let localRsvpRequests = 0;
  await page.route('**/api/rsvp', (route) => {
    localRsvpRequests++;
    return route.fulfill({ status: 503 });
  });
  // Intercept Google's tab so tests never submit a response or send guest data externally.
  await page.context().route('https://docs.google.com/forms/**', (route) => route.fulfill({
    status: 200, contentType: 'text/html', body: '<h1>Google Form test preview</h1>',
  }));
  for (const attendance of ['no', 'yes']) {
    await page.locator('#wizard-attendance').selectOption(attendance);
    if (attendance === 'yes') await page.locator('#wizard-guests').selectOption('2');
    const [formTab] = await Promise.all([
      page.context().waitForEvent('page'),
      page.getByRole('button', { name: /^(Lanjut|Kirim) ke Google Form$/ }).click(),
    ]);
    await formTab.waitForLoadState('domcontentloaded');
    const destination = new URL(formTab.url());
    assert.equal(destination.origin + destination.pathname, 'https://docs.google.com/forms/d/e/1FAIpQLScdN9JIZicJ7lEwJkB0CC-NGS3hFvW2Y1xIaKFOKJdklwaPBQ/viewform');
    assert.equal(destination.searchParams.get('usp'), 'pp_url');
    assert.equal(destination.searchParams.get('entry.986528962'), 'Uji Template Wizard');
    assert.equal(destination.searchParams.get('entry.877086558'), attendance === 'yes' ? 'Ya, saya akan hadir' : 'Maaf, saya tidak bisa hadir');
    assert.equal(destination.searchParams.get('entry.1498135098'), attendance === 'yes' ? '2' : null);
    assert.equal(destination.searchParams.get('entry.2606285'), 'Doa & harapan: bahagia selalu!');
    await formTab.close();
    assert.equal(await page.locator('.wizard-rsvp-success').count(), 0, 'Opening Google Form must not claim a saved RSVP');
    assert.ok(await page.locator('.wizard-form').isVisible());
  }
  assert.equal(localRsvpRequests, 0, 'Google Form handoff should not save a duplicate local RSVP');
  await page.unroute('**/api/rsvp');
  await stationary();
  await page.locator('#wizard-guest').scrollIntoViewIfNeeded();
  await page.screenshot({ animations: 'disabled', path: `${output}/rsvp-mobile.png` });
  await page.locator('.wizard-wishes').scrollIntoViewIfNeeded();
  await page.waitForFunction(() => document.querySelectorAll('.wizard-wish').length === 7);
  await page.waitForFunction(() => document.querySelector('.wizard-wishes-list').style.getPropertyValue('--wizard-wishes-height') !== '');
  assert.equal(await page.locator('.wizard-wish h3').first().textContent(), 'Keluarga Contoh');
  assert.equal(await page.locator('.wizard-wish img').count(), 0, 'Wish HTML must be displayed as text');
  assert.equal(await page.locator('.wizard-wish p').nth(1).textContent(), wishFixtures[1].message);
  const wishList = page.locator('.wizard-wishes-list');
  await wishList.scrollIntoViewIfNeeded();
  await page.waitForFunction(() => [...document.querySelectorAll('.wizard-wish')].slice(0, 3).every((node) => node.dataset.chapterReveal === 'shown'));
  const listBounds = await wishList.boundingBox();
  const thirdWish = await page.locator('.wizard-wish').nth(2).boundingBox();
  const fourthWish = await page.locator('.wizard-wish').nth(3).boundingBox();
  assert.ok(Math.abs(thirdWish.y + thirdWish.height - (listBounds.y + listBounds.height)) < 2, 'Wish list should fit exactly three initial cards');
  assert.ok(fourthWish.y >= listBounds.y + listBounds.height, 'Fourth wish should require scrolling');
  await wishList.evaluate((node) => { node.scrollTop = node.scrollHeight; });
  await page.waitForFunction(() => document.querySelector('.wizard-wish:last-child').dataset.chapterReveal === 'shown');
  assert.ok(await wishList.evaluate((node) => node.scrollTop > 0), 'Remaining wishes cannot be scrolled');
  const lastWish = await page.locator('.wizard-wish').last().boundingBox();
  assert.ok(lastWish.y >= listBounds.y && lastWish.y + lastWish.height <= listBounds.y + listBounds.height + 2, 'Last wish cannot be reached');
  await wishList.evaluate((node) => { node.scrollTop = 0; });
  await page.screenshot({ animations: 'disabled', path: `${output}/wishes-mobile.png` });
  assert.equal(await page.getByRole('button', { name: 'Tampilkan lagi', exact: true }).count(), 0);
  assert.equal(await page.locator('.wizard-wish').count(), 7);
  wishesMode = 'error';
  await page.getByRole('button', { name: 'Perbarui ucapan', exact: true }).click();
  await page.getByRole('status').filter({ hasText: 'Ucapan belum dapat dimuat' }).waitFor();
  assert.equal(await page.locator('.wizard-wish').count(), 7, 'Failed refresh should retain existing wishes');
  for (const mode of ['empty', 'unconfigured']) {
    wishesMode = mode;
    await page.getByRole('button', { name: 'Perbarui ucapan', exact: true }).click();
    await page.getByText('Ucapan dan doa akan hadir di sini.', { exact: true }).waitFor();
    assert.equal(await page.locator('.wizard-wish').count(), 0);
  }
  wishesMode = 'ready';
  await page.getByRole('button', { name: 'Perbarui ucapan', exact: true }).click();
  await page.waitForFunction(() => document.querySelectorAll('.wizard-wish').length === 7);

  await page.getByRole('button', { name: 'Sampul', exact: true }).click();
  await phase('leaving');
  await page.waitForFunction(() => Number(document.querySelector('.wizard-book').dataset.cameraProgress) < .7);
  const closingEffect = await page.evaluate(() => window.wizardAudioStarts.filter((entry) => !entry.loop).at(-1));
  assert.ok(Math.abs(closingEffect.duration - 2) < .01 && closingEffect.progress >= .62 && closingEffect.progress <= .95, `Closing audio is not aligned with the moving doors: ${JSON.stringify(closingEffect)}`);
  await stationary();
  await phase('cover');
  assert.equal(await progress(), 0);
  assert.equal(await page.locator(':focus').getAttribute('class'), 'wizard-open');
  assert.equal(await page.locator('.wizard-castle-entry').evaluate((node) => Number(getComputedStyle(node).opacity)), 0, 'Hall covers the restored exterior');
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
  assert.equal(await page.getByRole('button', { name: 'Lewati pembukaan' }).count(), 0, 'Removed skip button is still rendered');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await phase('inside');
  assert.equal(await progress(), 1, 'Reduced motion did not finish the in-flight journey');
  await page.getByRole('button', { name: 'Sampul', exact: true }).click();
  await phase('cover');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.getByRole('button', { name: 'Lewati sampul' }).focus();
  await page.keyboard.press('Enter');
  await phase('inside');
  assert.equal(await page.evaluate(() => window.wizardAudioStarts.filter((entry) => !entry.loop).length), 2, 'Instant/reduced motion navigation should not play door effects');
  await stationary();
  await page.goto(`${base}/catalog`);
  await page.locator('#open-theme-wizard').waitFor();
  assert.equal(await page.locator('#open-theme-wizard').getAttribute('href'), '/templates/wizard');
  const retryPage = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  retryPage.on('pageerror', (error) => errors.push(error.message));
  await retryPage.route('**/assets/wizard/audio/**', (route) => route.fulfill({ status: 503, body: 'Temporary test failure' }));
  await retryPage.goto(`${base}/templates/wizard`);
  await retryPage.locator('.wizard-page[data-assets="error"]').waitFor();
  assert.ok(await retryPage.locator('.wizard-open').isDisabled(), 'Incomplete assets should keep the loader visible');
  await retryPage.unroute('**/assets/wizard/audio/**');
  await retryPage.getByRole('button', { name: 'Coba lagi', exact: true }).click();
  await retryPage.getByRole('button', { name: 'Buka undangan', exact: true }).click();
  await retryPage.locator('.wizard-page[data-sound="playing"]').waitFor();
  await retryPage.close();
  assert.deepEqual(errors, []);
  console.log('PASS: automatic motion without a cursor on touch devices, gentle owl hover, no ambient toggle, reduced motion, ambient pose held during camera travel, full phone viewport, connected shoreline, opening gate and hall arrival, no skip button during travel, reversible journey, eight viewport sizes, chapter panels, calendar, maps, stacked RSVP fields, Gift last, Google Form prefill for both attendance options without premature success or duplicate local records, keyboard skip, catalog, no browser errors.');
} finally {
  await browser.close();
}
