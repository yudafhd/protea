'use client';

import { useEffect, useState, type RefObject } from 'react';
import { loadWizardAudioFile, WIZARD_AUDIO_TRACKS } from './assets';

type AssetState = { status: 'loading' | 'ready' | 'error'; progress: number };

export default function useWizardAssets(root: RefObject<HTMLElement | null>) {
  const [state, setState] = useState<AssetState>({ status: 'loading', progress: 0 });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const node = root.current;
    if (!node) return;
    let cancelled = false;
    let completed = 0;
    setState({ status: 'loading', progress: 0 });

    const images = Array.from(node.querySelectorAll('img'));
    const tasks: (() => Promise<unknown>)[] = images.map((image) => async () => {
      // Hidden chapter images would otherwise wait until the invitation opens.
      image.loading = 'eager';
      if (attempt > 0 && image.complete && !image.naturalWidth) image.src = image.src;
      await image.decode();
    });
    const background = new window.Image();
    background.src = '/assets/wizard/parchment.webp';
    tasks.push(() => background.decode());
    tasks.push(...['StudioSans', 'StudioSerif', 'WizardItalic'].map((font) => () => document.fonts.load(`400 16px ${font}`)));
    tasks.push(...Object.values(WIZARD_AUDIO_TRACKS).map((url) => () => loadWizardAudioFile(url)));

    // allSettled keeps the loader in place until every outstanding task finishes.
    void Promise.allSettled(tasks.map(async (load) => {
      await load();
      completed++;
      if (!cancelled) setState({ status: 'loading', progress: Math.round(completed / tasks.length * 100) });
    })).then((results) => {
      if (cancelled) return;
      const failed = results.some((result) => result.status === 'rejected');
      setState({ status: failed ? 'error' : 'ready', progress: Math.round(completed / tasks.length * 100) });
    });

    return () => { cancelled = true; };
  }, [root, attempt]);

  return { ...state, retry: () => setAttempt((value) => value + 1) };
}
