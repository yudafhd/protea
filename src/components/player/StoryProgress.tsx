"use client";
import { useEffect, useRef } from "react";
import { useStoryProgress } from "@/store/story";
export function StoryProgress() {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => { const update = (progress: number) => { if (ref.current) ref.current.style.transform = `scaleX(${progress})`; }; update(useStoryProgress.getState().progress); return useStoryProgress.subscribe((state) => update(state.progress)); }, []);
  return <div className="scene-progress story-progress" aria-hidden="true"><span ref={ref} /></div>;
}
