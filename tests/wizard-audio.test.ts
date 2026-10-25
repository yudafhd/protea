import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('wizard music and door effects are valid, non-clipping stereo WAV files with soft endpoints', async () => {
  for (const [name, duration] of [['moonlit-letter.wav', 40], ['castle-door-open.wav', 2.8], ['castle-door-close.wav', 2]] as const) {
    const file = await readFile(new URL(`../public/assets/wizard/audio/${name}`, import.meta.url));
    assert.equal(file.toString('ascii', 0, 4), 'RIFF');
    assert.equal(file.toString('ascii', 8, 12), 'WAVE');
    assert.equal(file.readUInt16LE(20), 1);
    assert.equal(file.readUInt16LE(22), 2);
    assert.equal(file.readUInt16LE(34), 16);
    assert.equal(file.readUInt32LE(40), file.length - 44);
    assert.ok(Math.abs((file.length - 44) / file.readUInt32LE(28) - duration) < .001);
    let energy = 0;
    let peak = 0;
    for (let offset = 44; offset < file.length; offset += 2) {
      const sample = file.readInt16LE(offset) / 32768;
      energy += sample * sample;
      peak = Math.max(peak, Math.abs(sample));
    }
    assert.ok(peak > .1 && peak < .8, `${name} is silent or clips`);
    assert.ok(Math.sqrt(energy / ((file.length - 44) / 2)) > .02, `${name} is too quiet`);
    assert.equal(file.readInt16LE(44), 0);
    assert.equal(file.readInt16LE(file.length - 2), 0);
  }
});
