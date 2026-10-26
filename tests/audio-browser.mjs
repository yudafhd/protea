import { chromium, webkit } from '@playwright/test';
import assert from 'node:assert/strict';

const base = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';

for (const [name, engine] of [['chromium', chromium], ['webkit', webkit]]) {
  const browser = await engine.launch({ headless: true, ...(name === 'chromium' ? process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : { channel: process.env.PLAYWRIGHT_CHANNEL ?? 'msedge' } : {}) });
  try {
    const probe = await browser.newPage();
    const supportsAudio = await probe.evaluate(() => typeof window.AudioContext === 'function');
    await probe.close();
    if (!supportsAudio) {
      console.log(`SKIP ${name}: this browser build does not provide Web Audio`);
      continue;
    }
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.addInitScript(() => {
      window.audioMusicStarts = 0;
      if (!('audioSession' in navigator)) {
        Object.defineProperty(navigator, 'audioSession', { value: { type: 'auto' } });
      }
      window.audioSessionBefore = navigator.audioSession?.type;
      const createGain = AudioContext.prototype.createGain;
      AudioContext.prototype.createGain = function (...args) {
        window.audioTestContext = this;
        return createGain.apply(this, args);
      };
      const createSource = AudioContext.prototype.createBufferSource;
      AudioContext.prototype.createBufferSource = function (...args) {
        const source = createSource.apply(this, args);
        const start = source.start;
        source.start = function (...parameters) {
          if (source.loop) {
            window.audioMusicStarts++;
            const samples = source.buffer.getChannelData(0);
            let peak = 0;
            for (const sample of samples) peak = Math.max(peak, Math.abs(sample));
            window.audioMusicMetrics = {
              duration: source.buffer.duration, channels: source.buffer.numberOfChannels,
              peak, boundaryDelta: Math.abs(samples[0] - samples[samples.length - 1]),
            };
          }
          return start.apply(this, parameters);
        };
        return source;
      };
    });
    await page.goto(`${base}/catalog`);
    await page.locator('a[href="/templates/wizard"]').first().click();
    await page.locator('.wizard-page[data-assets="ready"]').waitFor();
    assert.equal(await page.evaluate(() => window.audioTestContext), undefined, 'Audio must wait for a user gesture');
    await page.getByRole('button', { name: 'Buka undangan', exact: true }).click();
    await page.locator('.wizard-page[data-sound="playing"]').waitFor();
    assert.equal(await page.evaluate(() => window.audioTestContext.state), 'running');
    const music = await page.evaluate(() => window.audioMusicMetrics);
    assert.ok(Math.abs(music.duration - 90) < .08, `Unexpected music duration: ${music.duration}`);
    assert.equal(music.channels, 2);
    assert.ok(music.peak > .1 && music.peak < .99, 'Compressed music must contain audio without clipping');
    assert.ok(music.boundaryDelta < .08, `Audible discontinuity at loop seam: ${music.boundaryDelta}`);
    if (await page.evaluate(() => Boolean(navigator.audioSession))) {
      assert.equal(await page.evaluate(() => navigator.audioSession.type), 'playback');
    }
    await page.evaluate(() => window.audioTestContext.suspend());
    await page.getByRole('button', { name: 'Coba putar suara', exact: true }).click();
    await page.locator('.wizard-page[data-sound="playing"]').waitFor();
    assert.equal(await page.evaluate(() => window.audioTestContext.state), 'running');
    assert.equal(await page.evaluate(() => window.audioMusicStarts), 1, 'Retry must reuse the music source');
    // WebKit also exposes an interrupted state, for example during a phone call.
    await page.evaluate(() => {
      Object.defineProperty(window.audioTestContext, 'state', { configurable: true, value: 'interrupted' });
      window.audioTestContext.dispatchEvent(new Event('statechange'));
    });
    await page.getByRole('button', { name: 'Coba putar suara', exact: true }).waitFor();
    await page.evaluate(() => { delete window.audioTestContext.state; });
    await page.getByRole('button', { name: 'Coba putar suara', exact: true }).click();
    await page.locator('.wizard-page[data-sound="playing"]').waitFor();
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, value: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await page.waitForFunction(() => window.audioTestContext.state === 'suspended');
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, value: false });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await page.waitForFunction(() => window.audioTestContext.state === 'running');
    await page.locator('.wizard-page[data-sound="playing"]').waitFor();
    await page.getByRole('button', { name: 'Matikan suara', exact: true }).click();
    await page.locator('.wizard-page[data-sound="muted"]').waitFor();
    await page.evaluate(() => window.audioTestContext.suspend());
    await page.getByRole('button', { name: 'Aktifkan suara', exact: true }).click();
    await page.locator('.wizard-page[data-sound="playing"]').waitFor();
    assert.equal(await page.evaluate(() => window.audioMusicStarts), 1);
    await page.goBack();
    await page.locator('.wizard-page').waitFor({ state: 'detached' });
    await page.waitForFunction(() => !navigator.audioSession || navigator.audioSession.type === window.audioSessionBefore);

    // A missing or restricted experimental API must not block ordinary playback.
    for (const mode of ['missing', 'restricted']) {
      const fallback = await browser.newPage({ reducedMotion: 'reduce' });
      fallback.on('pageerror', (error) => errors.push(error.message));
      await fallback.addInitScript((mode) => {
        Object.defineProperty(navigator, 'audioSession', { configurable: true, value: mode === 'missing' ? undefined : {
          get type() { return 'auto'; },
          set type(_value) { throw new Error('Audio Session unavailable'); },
        } });
      }, mode);
      await fallback.goto(`${base}/templates/wizard`);
      await fallback.getByRole('button', { name: 'Buka undangan', exact: true }).click();
      await fallback.locator('.wizard-page[data-sound="playing"]').waitFor();
      await fallback.close();
    }

    assert.deepEqual(errors, []);
    console.log(`PASS ${name}: gesture playback, music session, suspension/interruption retry, visibility and mute recovery, no duplicate music, session cleanup, optional API fallbacks`);
    await page.close();
  } finally {
    await browser.close();
  }
}
