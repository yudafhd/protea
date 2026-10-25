import QRCode from 'qrcode';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { WIZARD_CONTENT } from '../src/templates/wizard/content.ts';

const directory = new URL('../public/assets/wizard/', import.meta.url);
const output = new URL('location-qr.png', directory);
await mkdir(directory, { recursive: true });
await QRCode.toFile(fileURLToPath(output), WIZARD_CONTENT.mapsUrl, {
  type: 'png',
  width: 1024,
  margin: 4,
  errorCorrectionLevel: 'H',
  color: { dark: '#000000ff', light: '#ffffffff' },
});
console.log(`QR lokasi: ${fileURLToPath(output)}`);
