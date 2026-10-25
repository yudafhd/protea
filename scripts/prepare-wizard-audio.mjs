import { mkdir, writeFile } from 'node:fs/promises';

// Original composition and procedural effects; no soundtrack samples are used.
const rate = 22050;
const directory = new URL('../public/assets/wizard/audio/', import.meta.url);
await mkdir(directory, { recursive: true });
const tau = Math.PI * 2;
const frequency = (midi) => 440 * 2 ** ((midi - 69) / 12);
const stereo = (seconds) => [new Float32Array(Math.round(seconds * rate)), new Float32Array(Math.round(seconds * rate))];

function note(channels, start, seconds, midi, volume, pan, voice = 'bell') {
  const f = frequency(midi);
  const length = Math.round(seconds * rate);
  for (let i = 0; i < length; i++) {
    const t = i / rate;
    let sample;
    if (voice === 'strings') {
      const phase = tau * f * t + .08 * Math.sin(tau * 4.7 * t);
      const envelope = Math.min(1, t / .7, (seconds - t) / .8);
      sample = envelope * (.75 * Math.sin(phase) + .13 * Math.sin(phase * 2) + .06 * Math.sin(phase * 3));
    } else {
      const decay = voice === 'harp' ? .38 : .9;
      const phase = tau * f * t;
      sample = Math.min(1, t / .006) * (Math.sin(phase) * Math.exp(-t / decay)
        + .32 * Math.sin(phase * 2.01) * Math.exp(-t / (decay * .55))
        + .12 * Math.sin(phase * 2.76) * Math.exp(-t / (decay * .3)));
    }
    const index = (Math.round(start * rate) + i) % channels[0].length;
    channels[0][index] += sample * volume * Math.sqrt((1 - pan) / 2);
    channels[1][index] += sample * volume * Math.sqrt((1 + pan) / 2);
  }
}

function reverb(channels, circular = false) {
  const dry = channels.map((channel) => channel.slice());
  for (const [delay, gain] of [[.11, .19], [.23, .14], [.41, .11], [.69, .08], [1.04, .05], [1.53, .03]]) {
    const offset = Math.round(delay * rate);
    for (let channel = 0; channel < 2; channel++) {
      for (let i = 0; i < dry[channel].length; i++) {
        const target = i + offset;
        if (target < channels[channel].length || circular) channels[channel][target % channels[channel].length] += dry[1 - channel][i] * gain;
      }
    }
  }
}

async function save(name, channels) {
  let peak = 0;
  for (const channel of channels) for (const sample of channel) peak = Math.max(peak, Math.abs(sample));
  const length = channels[0].length;
  const wav = Buffer.alloc(44 + length * 4);
  wav.write('RIFF', 0); wav.writeUInt32LE(wav.length - 8, 4); wav.write('WAVEfmt ', 8);
  wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(2, 22);
  wav.writeUInt32LE(rate, 24); wav.writeUInt32LE(rate * 4, 28); wav.writeUInt16LE(4, 32); wav.writeUInt16LE(16, 34);
  wav.write('data', 36); wav.writeUInt32LE(length * 4, 40);
  let energy = 0;
  for (let i = 0; i < length; i++) {
    const fade = Math.min(1, i / (rate * .025), (length - 1 - i) / (rate * .045));
    for (let channel = 0; channel < 2; channel++) {
      const sample = channels[channel][i] / Math.max(peak, .001) * .78 * fade;
      energy += sample * sample;
      wav.writeInt16LE(Math.round(sample * 32767), 44 + i * 4 + channel * 2);
    }
  }
  await writeFile(new URL(name, directory), wav);
  console.log(`${name}: ${(length / rate).toFixed(1)}s, ${(wav.length / 1024).toFixed(0)} KB, RMS ${Math.sqrt(energy / (length * 2)).toFixed(3)}`);
}

// A Letter Beneath the Moon: 16 bars, 3/4, 72 BPM, celesta/harp/string voicings.
const beat = 60 / 72;
const music = stereo(16 * 3 * beat);
const chords = [[50, 57, 60, 64], [46, 53, 57, 62], [48, 55, 60, 64], [43, 55, 59, 62],
  [43, 50, 57, 58], [50, 57, 60, 65], [46, 53, 57, 60], [45, 52, 55, 61]];
const melody = [[81, 76, 79, 84], [82, 77, 81, 74], [79, 84, 88, 83], [86, 79, 83, 81],
  [82, 81, 77, 74], [81, 77, 84, 88], [89, 84, 82, 81], [85, 83, 79, 76],
  [88, 84, 81, 79], [86, 81, 77, 82], [84, 79, 88, 86], [83, 79, 74, 81],
  [86, 82, 81, 77], [84, 81, 77, 76], [82, 77, 81, 74], [79, 76, 73, 81]];
for (let bar = 0; bar < 16; bar++) {
  const start = bar * 3 * beat;
  const chord = chords[bar % chords.length];
  chord.forEach((pitch, index) => note(music, start, 3 * beat + .8, pitch, .12, (index - 1.5) * .22, 'strings'));
  for (let step = 0; step < 6; step++) note(music, start + step * .5 * beat, 1.8, chord[step % chord.length] + 12, .13, -.35 + step * .12, 'harp');
  melody[bar].forEach((pitch, index) => note(music, start + [0, 1, 1.5, 2.5][index] * beat, 3, pitch, .29, .18 * Math.sin(bar + index)));
}
reverb(music, true);
await save('moonlit-letter.wav', music);

let seed = 20261102;
function noise() { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 2147483648 - 1; }
function door(seconds, closing) {
  const channels = stereo(seconds);
  let low = 0;
  let phase = 0;
  for (let i = 0; i < channels[0].length; i++) {
    const t = i / rate;
    const position = t / seconds;
    low = .975 * low + .025 * noise();
    phase += tau * (99 + 24 * Math.sin(t * 3.6) + 11 * Math.sin(t * 17)) / rate;
    const envelope = Math.sin(Math.PI * position) ** .65;
    const friction = (.72 + .28 * Math.sin(t * 31)) * (.55 * Math.sin(phase) + .17 * Math.sin(phase * 2.03));
    let sample = envelope * (low * 2.4 + friction * .2 + .045 * Math.sin(tau * 47 * t));
    const latchTime = closing ? seconds - .24 : .06;
    const impact = t - latchTime;
    if (impact >= 0) sample += Math.exp(-impact * (closing ? 18 : 36)) * (Math.sin(tau * 61 * impact) * (closing ? .6 : .15) + noise() * .16);
    channels[0][i] = sample * (1 - .08 * Math.sin(t * 2));
    channels[1][i] = sample * (1 + .08 * Math.sin(t * 2));
  }
  reverb(channels);
  return channels;
}
await save('castle-door-open.wav', door(2.8, false));
await save('castle-door-close.wav', door(2, true));
