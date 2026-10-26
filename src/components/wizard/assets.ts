export const WIZARD_AUDIO_TRACKS = {
  music: '/assets/wizard/audio/moonlit-letter.wav',
  open: '/assets/wizard/audio/castle-door-open.wav',
  close: '/assets/wizard/audio/castle-door-close.wav',
} as const;

const audioFiles = new Map<string, Promise<ArrayBuffer>>();

// Share downloads with the opening loader; decoding must use a copy because
// decodeAudioData can detach the buffer, including on Safari.
export function loadWizardAudioFile(url: string): Promise<ArrayBuffer> {
  let pending = audioFiles.get(url);
  if (!pending) {
    pending = fetch(url).then((response) => {
      if (!response.ok) throw new Error('Audio asset could not load.');
      return response.arrayBuffer();
    }).catch((error) => {
      audioFiles.delete(url);
      throw error;
    });
    audioFiles.set(url, pending);
  }
  return pending;
}
