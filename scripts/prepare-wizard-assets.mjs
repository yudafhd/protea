import sharp from 'sharp';
import { mkdir, copyFile } from 'node:fs/promises';
import path from 'node:path';

const source = path.resolve('src/templates/wizard');
const destination = path.resolve('public/assets/wizard');
await mkdir(destination, { recursive: true });
const images = {
  parchment: 'wedding_parchment_bg.png',
  moon: 'wedding_moon.png',
  clouds: 'wedding_clouds_back.png',
  landscape: 'wedding_landscape_lake.png',
  castle: 'wedding_castle_layer_01_clean.png',
  'castle-hall': 'wedding_castle_hall.png',
  'castle-gate-left': 'wedding_castle_gate_left.png',
  'castle-gate-right': 'wedding_castle_gate_right.png',
  mist: 'wedding_mist_front.png',
  bride: 'wedding_bride_foreground.png',
  groom: 'wedding_groom_foreground.png',
  'couple-wizard': 'wedding_couple_wizard.png',
  'couple-picnic-hd': 'wedding_couple_picnic_hd.png',
  'yuda-profile': 'wedding_yuda_profile.png',
  'putri-profile': 'wedding_putri_profile.png',
  owl: 'wedding_owl_letter.png',
  'banner-lion': 'wedding_banner_lion_left.png',
  'banner-serpent': 'wedding_banner_serpent_right.png',
  'winged-orb': 'wedding_gold_winged_orb.png',
  preview: 'Gambar ChatGPT 18 Okt 2026, 23.45.41 (1).png',
};
for (const [name, file] of Object.entries(images)) {
  const result = await sharp(path.join(source, file))
    .resize({ width: name === 'preview' ? 600 : name === 'moon' || name.endsWith('-profile') ? 768 : 1200, withoutEnlargement: true })
    .webp({ quality: 88, alphaQuality: 100, effort: 6 })
    .toFile(path.join(destination, `${name}.webp`));
  console.log(`${name}: ${result.width}x${result.height}, ${Math.round(result.size / 1024)} KB`);
}
for (const file of ['gold-star.svg', 'gold-frame.svg', 'gold-date-circle.svg', 'gold-triangle-mark.svg']) {
  await copyFile(path.join(source, file), path.join(destination, file));
}
