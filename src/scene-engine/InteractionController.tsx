"use client";
import { useEffect, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { usePlayer } from "@/store/player";
import { useStoryProgress } from "@/store/story";
import type { WeddingExperience } from "@/schemas/experience";
import { chapterAt } from "./story/lifecycle";
gsap.registerPlugin(ScrollTrigger);
export function InteractionController({ surface, count, onNavigate, experience }: { surface: RefObject<HTMLDivElement | null>; count: number; onNavigate: (index: number) => void; experience?: WeddingExperience }) {
  useEffect(() => {
    const element = surface.current;
    if (!element) return;
    const change = (direction: number) => { const state = usePlayer.getState(); if (!state.rsvpOpen) onNavigate(Math.max(0, Math.min(count - 1, state.sceneIndex + direction))); };
    const story = experience?.story;
    const playhead = { progress: 0 };
    const update = () => {
      if (usePlayer.getState().rsvpOpen) return;
      useStoryProgress.getState().setProgress(playhead.progress);
      const index = story ? chapterAt(experience.scenes, playhead.progress) : Math.round(playhead.progress * (count - 1));
      if (index !== usePlayer.getState().sceneIndex) usePlayer.getState().goTo(index, count);
    };
    const motion = gsap.to(playhead, { progress: 1, duration: 1, ease: "none", paused: true, onUpdate: update });
    const trigger = ScrollTrigger.create({ trigger: element.parentElement, start: "top top", end: () => `+=${Math.max(1, (element.parentElement?.offsetHeight ?? window.innerHeight * count) - element.offsetHeight)}`, animation: motion, scrub: story && !window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0.3 : true, invalidateOnRefresh: true });
    const key = (event: KeyboardEvent) => { if ((event.target as HTMLElement).closest("button,a,input,select,textarea,[role=dialog]")) return; if (["ArrowDown", "ArrowRight", "PageDown", " "].includes(event.key)) { event.preventDefault(); change(1); } if (["ArrowUp", "ArrowLeft", "PageUp"].includes(event.key)) { event.preventDefault(); change(-1); } };
    let startY = 0;
    let dragging = false, scrollStart = 0;
    const down = (event: PointerEvent) => { if (event.pointerType !== "mouse" || (event.target as HTMLElement).closest("button,a,input,select,textarea,[role=dialog]")) return; startY = event.clientY; scrollStart = window.scrollY; dragging = true; };
    const move = (event: PointerEvent) => { if (dragging) window.scrollTo(0, scrollStart + (startY - event.clientY) * 3); };
    const up = () => { dragging = false; };
    const resize = () => {
      const progress = useStoryProgress.getState().progress;
      trigger.refresh();
      window.scrollTo({ top: progress * Math.max(1, (element.parentElement?.offsetHeight ?? 0) - element.offsetHeight), behavior: "instant" });
      trigger.update();
      const scrub = trigger.getTween();
      if (scrub) scrub.progress(1);
    };
    element.addEventListener("pointerdown", down); window.addEventListener("pointermove", move); window.addEventListener("pointerup", up); window.addEventListener("pointercancel", up); window.addEventListener("keydown", key);
    window.addEventListener("resize", resize);
    return () => { trigger.kill(); motion.kill(); element.removeEventListener("pointerdown", down); window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); window.removeEventListener("pointercancel", up); window.removeEventListener("keydown", key); window.removeEventListener("resize", resize); };
  }, [count, surface, onNavigate, experience]);
  return null;
}
