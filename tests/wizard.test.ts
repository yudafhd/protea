import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import jsQR from 'jsqr';
import { createWizardCalendar, WIZARD_CONTENT } from '../src/templates/wizard/content';

test('downloadable location QR decodes to the configured Maps URL', async () => {
  const { data, info } = await sharp(fileURLToPath(new URL('../public/assets/wizard/location-qr.png', import.meta.url)))
    .ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  assert.equal(info.width, 1024);
  assert.equal(info.height, 1024);
  const result = jsQR(new Uint8ClampedArray(data), info.width, info.height);
  assert.ok(result, 'Location QR cannot be decoded');
  assert.equal(result.data, WIZARD_CONTENT.mapsUrl);
});

test('calendar exports both events at the supplied WIB times', () => {
  const calendar = createWizardCalendar();
  assert.equal((calendar.match(/BEGIN:VEVENT/g) ?? []).length, 2);
  assert.ok(calendar.includes('DTSTART:20261102T020000Z\r\nDTEND:20261102T030000Z'));
  assert.ok(calendar.includes('DTSTART:20261102T040000Z\r\nDTEND:20261102T070000Z'));
  assert.ok(calendar.endsWith('END:VCALENDAR\r\n'));
});

test('calendar escapes supplied text and folds UTF-8 without breaking characters', () => {
  const content = { ...WIZARD_CONTENT, address: 'Alamat, aula; ruang\\utama\nPintu masuk', bride: '✨'.repeat(40) };
  const calendar = createWizardCalendar(content);
  assert.ok(calendar.includes('LOCATION:Alamat\\, aula\\; ruang\\\\utama\\nPintu masuk'));
  for (const line of calendar.split('\r\n')) assert.ok(Buffer.byteLength(line) <= 75, line);
  const unfolded = calendar.replace(/\r\n /g, '');
  assert.ok(unfolded.includes('✨'.repeat(40)));
  assert.ok(!unfolded.includes('\ufffd'));
});
