'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type SoundState = 'idle' | 'loading' | 'playing' | 'muted' | 'error';
type Track = 'music' | 'open' | 'close';
const tracks: Record<Track, string> = {
  music: '/assets/wizard/audio/moonlit-letter.wav',
  open: '/assets/wizard/audio/castle-door-open.wav',
  close: '/assets/wizard/audio/castle-door-close.wav',
};

class WizardAudio {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private buffers: Partial<Record<Track, AudioBuffer>> = {};
  private loading: Promise<void> | null = null;
  private music: { source: AudioBufferSourceNode; gain: GainNode } | null = null;
  private door: AudioBufferSourceNode | null = null;
  private muted = false;
  private disposed = false;
  private musicWanted = false;
  private direction: 'open' | 'close' = 'open';
  private doorEnabled = false;
  private doorPlayed = false;
  private generation = 0;
  private failed = false;
  private abort = new AbortController();

  constructor(private report: (state: SoundState) => void) {}

  private async prepare() {
    if (!this.context) {
      const Constructor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Constructor) throw new Error('Web Audio is unavailable.');
      this.context = new Constructor();
      this.master = this.context.createGain();
      this.master.gain.value = this.muted ? 0 : 1;
      this.master.connect(this.context.destination);
    }
    const context = this.context;
    // Resume synchronously from the opening/toggle click before any network await.
    const resumed = context.resume();
    if (!this.loading) {
      this.loading = Promise.all((Object.entries(tracks) as [Track, string][]).map(async ([key, url]) => {
        if (this.buffers[key]) return;
        const response = await fetch(url, { signal: this.abort.signal });
        if (!response.ok) throw new Error('Audio asset could not load.');
        this.buffers[key] = await context.decodeAudioData(await response.arrayBuffer());
      })).then(() => undefined).catch((error) => { this.loading = null; throw error; });
    }
    await Promise.all([resumed, this.loading]);
  }

  private notify() {
    if (!this.disposed) this.report(this.failed ? 'error' : this.muted ? 'muted' : 'playing');
  }

  private fail() {
    this.failed = true;
    this.notify();
  }

  private startMusic() {
    if (this.disposed || !this.musicWanted || !this.context || !this.master || !this.buffers.music) return;
    this.failed = false;
    this.master.gain.setTargetAtTime(this.muted ? 0 : 1, this.context.currentTime, .04);
    if (!this.music) {
      const source = this.context.createBufferSource();
      const gain = this.context.createGain();
      source.buffer = this.buffers.music;
      source.loop = true;
      gain.gain.setValueAtTime(0, this.context.currentTime);
      gain.gain.linearRampToValueAtTime(.22, this.context.currentTime + 1.2);
      source.connect(gain).connect(this.master);
      source.onended = () => { source.disconnect(); gain.disconnect(); };
      source.start();
      this.music = { source, gain };
    }
    this.notify();
  }

  private stopDoor() {
    this.door?.stop();
    this.door = null;
  }

  begin(inside: boolean, animated: boolean) {
    this.direction = inside ? 'open' : 'close';
    this.doorEnabled = animated;
    this.doorPlayed = false;
    this.stopDoor();
    const generation = ++this.generation;
    if (!inside) return;
    this.musicWanted = true;
    if (!this.muted) this.report('loading');
    void this.prepare().then(() => {
      if (this.generation === generation) this.startMusic();
    }).catch(() => this.fail());
  }

  sync(progress: number) {
    if (!this.doorEnabled || this.doorPlayed) return;
    const moving = progress > .62 && progress < .95;
    if (!moving) return;
    this.doorPlayed = true;
    if (this.muted || document.hidden || this.context?.state !== 'running' || !this.master) return;
    const buffer = this.buffers[this.direction];
    if (!buffer) return; // Do not play an out-of-sync effect if loading finishes late.
    const source = this.context.createBufferSource();
    const gain = this.context.createGain();
    source.buffer = buffer;
    gain.gain.value = .32;
    source.connect(gain).connect(this.master);
    source.onended = () => { source.disconnect(); gain.disconnect(); if (this.door === source) this.door = null; };
    source.start();
    this.door = source;
  }

  finish(inside: boolean) {
    this.doorEnabled = false;
    this.stopDoor();
    if (inside) return;
    this.musicWanted = false;
    ++this.generation;
    if (this.music && this.context) {
      this.music.gain.gain.cancelScheduledValues(this.context.currentTime);
      this.music.gain.gain.setTargetAtTime(0, this.context.currentTime, .16);
      this.music.source.stop(this.context.currentTime + .8);
      this.music = null;
    }
  }

  toggle() {
    if (this.failed || this.muted) {
      this.muted = false;
      this.report('loading');
      void this.prepare().then(() => this.startMusic()).catch(() => this.fail());
    } else {
      this.muted = true;
      this.master?.gain.setTargetAtTime(0, this.context?.currentTime ?? 0, .04);
      this.stopDoor();
      this.notify();
    }
  }

  visibility(visible: boolean) {
    if (!visible) {
      this.stopDoor();
      void this.context?.suspend().catch(() => undefined);
    } else if (this.musicWanted && !this.muted) {
      void this.context?.resume().catch(() => this.fail());
    }
  }

  dispose() {
    this.disposed = true;
    ++this.generation;
    this.abort.abort();
    this.stopDoor();
    void this.context?.close().catch(() => undefined);
  }
}

export default function useWizardAudio() {
  const [state, setState] = useState<SoundState>('idle');
  const controller = useRef<WizardAudio | null>(null);
  const begin = useCallback((inside: boolean, animated: boolean) => {
    controller.current ??= new WizardAudio(setState);
    controller.current.begin(inside, animated);
  }, []);
  const sync = useCallback((progress: number) => controller.current?.sync(progress), []);
  const finish = useCallback((inside: boolean) => controller.current?.finish(inside), []);
  const toggle = useCallback(() => controller.current?.toggle(), []);

  useEffect(() => {
    const visibility = () => controller.current?.visibility(!document.hidden);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      document.removeEventListener('visibilitychange', visibility);
      controller.current?.dispose();
      controller.current = null;
    };
  }, []);
  return useMemo(() => ({ state, begin, sync, finish, toggle }), [state, begin, sync, finish, toggle]);
}
