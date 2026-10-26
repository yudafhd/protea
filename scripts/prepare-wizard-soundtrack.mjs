import { spawnSync } from 'node:child_process';
import { mkdir, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const source = fileURLToPath(new URL('../The_Ironbound_Storybook.mp3', import.meta.url));
const output = fileURLToPath(new URL('../public/assets/wizard/audio/ironbound-storybook.mp3', import.meta.url));
await mkdir(new URL('../public/assets/wizard/audio/', import.meta.url), { recursive: true });

// 88 seconds of music plus a two-second tail/head crossfade. The final sample
// leads into the first sample when Web Audio loops the decoded 90-second track.
const filter = [
  '[0:a]atrim=start=0:end=92,asetpts=PTS-STARTPTS,loudnorm=I=-18:TP=-2:LRA=9,aresample=32000,asplit=3[body][tail][head]',
  '[body]atrim=start=2:end=90,asetpts=PTS-STARTPTS[middle]',
  '[tail]atrim=start=90:end=92,asetpts=PTS-STARTPTS,afade=t=out:st=0:d=2[end]',
  '[head]atrim=start=0:end=2,asetpts=PTS-STARTPTS,afade=t=in:st=0:d=2[start]',
  '[end][start]amix=inputs=2:duration=shortest:normalize=0[seam]',
  '[middle][seam]concat=n=2:v=0:a=1[music]',
].join(';');

const result = spawnSync(process.env.FFMPEG_PATH || 'ffmpeg', [
  '-hide_banner', '-loglevel', 'error', '-y', '-i', source,
  '-filter_complex', filter, '-map', '[music]', '-map_metadata', '-1',
  '-c:a', 'libmp3lame', '-b:a', '96k', '-ar', '32000', '-ac', '2',
  '-id3v2_version', '3', '-metadata', 'title=The Ironbound Storybook', output,
], { stdio: 'inherit' });

if (result.error) throw new Error('FFmpeg is required. Install it or set FFMPEG_PATH to the executable.', { cause: result.error });
if (result.status !== 0) process.exit(result.status ?? 1);
console.log(`The Ironbound Storybook: 90s loop, stereo 32 kHz / 96 kbps, ${Math.round((await stat(output)).size / 1024)} KB`);
