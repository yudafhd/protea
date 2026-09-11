"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import gsap from "gsap";
import type { WeddingExperience } from "@/schemas/experience";
import type { SceneLifecycle, StoryKeyframe } from "@/schemas/story";
import { useStoryProgress } from "@/store/story";

export const motionDefaults = { x: 0, y: 0, z: 0, scale: 1, rotation: 0, rotationX: 0, rotationY: 0, opacity: 1, blur: 0, reveal: 1 };
export type MotionState = typeof motionDefaults;
export type VirtualCamera = { x: number; y: number; zoom: number; rotation: number };
export function buildLayerTrack(state: MotionState, keys: StoryKeyframe[], range: SceneLifecycle, reduced: boolean) {
  const timeline = gsap.timeline();
  const time = (at: number) => range.start + at * (range.end - range.start);
  let previous = { ...motionDefaults };
  keys.forEach(({ at, ease, ...values }, index) => {
    const next = { ...previous, ...values };
    if (reduced) { next.x = 0; next.y = 0; next.z = 0; next.scale = 1; next.rotation = 0; next.rotationX = 0; next.rotationY = 0; next.blur = 0; }
    if (index === 0) { Object.assign(state, next); timeline.set(state, next, 0); }
    else timeline.fromTo(state, previous, { ...next, duration: time(at) - time(keys[index - 1].at), ease: ease ?? "none", immediateRender: false }, time(keys[index - 1].at));
    previous = next;
  });
  timeline.to({}, { duration: 1 }, 0);
  return timeline;
}

export class StoryTimeline {
  readonly camera: VirtualCamera = { x: 0, y: 0, zoom: 1, rotation: 0 };
  spatial = { x: 0, y: 0, z: 14, fov: 48 };
  readonly master = gsap.timeline({ paused: true });
  readonly updates = new Set<() => void>();
  reduced = false;
  constructor() { this.master.to({}, { duration: 1 }, 0); }
  attach(track: gsap.core.Timeline, update: () => void) {
    this.master.add(track, 0); this.updates.add(update);
    track.totalTime(useStoryProgress.getState().progress, true); update();
    return () => { this.master.remove(track); track.kill(); this.updates.delete(update); };
  }
  seek(progress: number) { this.master.totalTime(progress, true); this.updates.forEach((update) => update()); }
}
const Context = createContext<StoryTimeline | null>(null);
export function useStoryTimeline() { const value = useContext(Context); if (!value) throw new Error("Story layers require MasterTimeline"); return value; }
export function MasterTimeline({ experience, children }: { experience: WeddingExperience; children: ReactNode }) {
  const [runtime] = useState(() => new StoryTimeline());
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const track = gsap.timeline();
    experience.story!.virtualCamera.forEach(({ at, ease, ...camera }, index, keys) => {
      if (index === 0) { Object.assign(runtime.camera, camera); track.set(runtime.camera, camera, 0); }
      else track.to(runtime.camera, { ...camera, duration: at - keys[index - 1].at, ease: ease ?? "none" }, keys[index - 1].at);
    });
    const detach = runtime.attach(track, () => undefined);
    const update = (progress: number) => { runtime.reduced = query.matches; runtime.seek(progress); };
    const unsubscribe = useStoryProgress.subscribe((state) => update(state.progress));
    const change = () => update(useStoryProgress.getState().progress);
    query.addEventListener("change", change); change();
    return () => { unsubscribe(); detach(); query.removeEventListener("change", change); };
  }, [experience, runtime]);
  return <Context.Provider value={runtime}>{children}</Context.Provider>;
}
