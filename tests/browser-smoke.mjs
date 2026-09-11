import { chromium } from '@playwright/test';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
page.on('response', response => { if (response.status() >= 400) console.log('HTTP', response.status(), response.url()); });
try {
  await page.goto('http://localhost:3000/compare/before');
  await page.waitForTimeout(5000);
  await page.screenshot({ path: '/private/tmp/protea-player.png' });
  await page.getByRole('button', { name: 'Open the invitation' }).click();
  await page.waitForTimeout(2200);
  if (await page.locator('.spatial-world').getAttribute('aria-label') !== 'Scene 2: The happy couple') throw new Error('Opening navigation failed');
  await page.setViewportSize({ width: 360, height: 800 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/private/tmp/protea-mobile.png' });
  if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw new Error('Mobile overflow');
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('http://localhost:3000/templates/woodland');
  await page.locator('.story-stage').waitFor();
  await page.waitForTimeout(1800);
  const scroll = async (progress) => {
    await page.evaluate((p) => { const wrapper = document.querySelector('.experience-scroll'); const surface = document.querySelector('.invitation'); window.scrollTo(0, p * (wrapper.offsetHeight - surface.offsetHeight)); }, progress);
    await page.waitForTimeout(700);
  };
  const pose = (id) => page.locator(`[data-layer="${id}"]`).evaluate(node => ({ x: node.dataset.x, y: node.dataset.y, scale: node.dataset.scale, opacity: node.style.opacity, phase: node.dataset.phase }));
  for (const progress of [0, 0.18, 0.3, 0.48, 0.68, 0.74, 0.91]) {
    await scroll(progress);
    await page.screenshot({ path: `/private/tmp/protea-story-${progress}.png` });
    console.log('FRAME', progress, await page.locator('.story-stage').getAttribute('data-progress'), await page.locator('[data-scene]').evaluateAll(nodes => nodes.map(node => node.dataset.scene)));
  }
  await scroll(0.3);
  const overlap = await page.locator('[data-scene]').evaluateAll(nodes => nodes.map(node => node.dataset.scene));
  if (!overlap.includes('opening') || !overlap.includes('couple')) throw new Error('Scene overlap missing');
  await scroll(0.18);
  const forward = await pose('couple-portrait');
  await scroll(0.2);
  const next = await pose('couple-portrait');
  if (forward.x === next.x && forward.y === next.y && forward.scale === next.scale) throw new Error('Motion is quantized by chapter');
  await scroll(0.18);
  const reverse = await pose('couple-portrait');
  if (JSON.stringify(forward) !== JSON.stringify(reverse)) throw new Error(`Reverse seek is not deterministic: ${JSON.stringify({forward, reverse})}`);
  const persistent = page.locator('[data-layer="golden-dust"]');
  await persistent.evaluate(node => { node.dataset.continuity = 'retained'; });
  await scroll(0.9);
  if (await persistent.getAttribute('data-continuity') !== 'retained') throw new Error('Persistent layer was remounted');
  await page.setViewportSize({ width: 360, height: 800 });
  for (const progress of [0, 0.18, 0.36, 0.54, 0.72, 0.94]) {
    await scroll(progress); await page.screenshot({ path: `/private/tmp/protea-story-mobile-${progress}.png` });
    const id = ({ 0: 'opening-names', 0.18: 'couple-names', 0.36: 'date-title', 0.54: 'story-title', 0.72: 'venue-title', 0.94: 'forever-title' })[progress];
    const box = await page.locator(`[data-layer="${id}"] .story-text`).boundingBox();
    if (box && (box.x < -2 || box.x + box.width > 362)) throw new Error(`Mobile title overflows: ${id} ${JSON.stringify(box)}`);
  }
  if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw new Error('Cinematic mobile overflow');
  await scroll(0.36);
  await page.setViewportSize({ width: 844, height: 390 });
  await page.waitForTimeout(900);
  if (Math.abs(Number(await page.locator('.story-stage').getAttribute('data-progress')) - 0.36) > 0.005) throw new Error('Orientation change lost story progress');
  for (const viewport of [{ width: 844, height: 390 }, { width: 768, height: 1024 }, { width: 1440, height: 1000 }]) {
    await page.setViewportSize(viewport);
    for (const progress of [0, 0.18, 0.36, 0.54, 0.72, 0.94]) {
      await scroll(progress);
      const frame = await page.locator('.invitation').boundingBox();
      if (!frame || frame.width > 480 || frame.width >= frame.height || frame.y < -1 || frame.y + frame.height > viewport.height + 1) throw new Error(`Frame is not portrait: ${JSON.stringify({viewport, frame})}`);
      const buttons = await page.locator('.invitation-action button').all();
      for (const button of buttons) { const box = await button.boundingBox(); if (box && (box.x < frame.x - 1 || box.x + box.width > frame.x + frame.width + 1)) throw new Error('Portrait controls overflow'); }
    }
    await page.screenshot({ path: `/private/tmp/protea-portrait-${viewport.width}.png` });
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await scroll(0.48);
  const reduced = await pose('couple-portrait');
  if (await page.locator('[data-layer="couple-portrait"]').evaluate(node => node.style.filter) !== 'none') throw new Error('Reduced motion keeps blur');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  if (errors.length) throw new Error(errors.join('\n'));
  console.log('PASS: legacy player, continuous progress, reversible seek, persistent FX, reduced motion, portrait layout at mobile/tablet/desktop/landscape sizes, preserved orientation progress, no browser errors');
} finally { await browser.close(); }
