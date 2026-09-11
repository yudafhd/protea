"use client";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { Breakpoint, WeddingExperience } from "@/schemas/experience";
import { useStoryProgress } from "@/store/story";
import { MasterTimeline } from "./MasterTimeline";
import { residentScenes, persistentRange } from "./lifecycle";
import { DomLayer } from "./DomLayer";
import { AssetLoader } from "../AssetLoader";
const SpatialCanvas = dynamic(() => import("../SpatialCanvas"), { ssr: false });
const origin: [number, number, number] = [0, 0, 0];

export default function StoryStage({ experience, onInteraction }: { experience: WeddingExperience; onInteraction?: (id: string) => void }) {
  const root = useRef<HTMLDivElement>(null);
  const [breakpoint, setBreakpoint] = useState<Breakpoint>("mobile");
  const [resident, setResident] = useState(() => experience.story?.world ? experience.scenes : residentScenes(experience.scenes, 0, experience.story!.preloadAhead));
  useEffect(() => {
    let signature = "";
    const update = (progress: number) => {
      const scenes = experience.story?.world ? experience.scenes : residentScenes(experience.scenes, progress, experience.story!.preloadAhead);
      const next = scenes.map((scene) => scene.id).join("/");
      if (signature !== next) { signature = next; setResident(scenes); }
      if (root.current) root.current.dataset.progress = progress.toFixed(5);
    };
    update(useStoryProgress.getState().progress);
    return useStoryProgress.subscribe((state) => update(state.progress));
  }, [experience]);
  useEffect(() => {
    const node = root.current;
    if (!node) return;
    const resize = () => { const { width, height } = node.getBoundingClientRect(); const world = experience.story?.world; const unit = world ? height / (2 * Math.tan(experience.cameraPath[0].fov * Math.PI / 360) * world.focusDistance) : Math.min(width / (width < 600 ? 6.6 : 10), height / 7.2); node.style.setProperty("--world-unit", `${unit}px`); setBreakpoint(width < 600 ? "mobile" : width < 1024 ? "tablet" : "desktop"); };
    const observer = new ResizeObserver(resize); observer.observe(node); resize(); return () => observer.disconnect();
  }, [experience]);
  return <MasterTimeline experience={experience}><div ref={root} className={`story-stage${experience.story?.world ? " depth-world" : ""}`} aria-label="Continuous illustrated wedding story">
    {resident.map((scene) => <div className="story-scene" key={scene.id} data-scene={scene.id}>{scene.layers.filter((layer) => layer.renderer === "dom").map((layer) => <DomLayer key={layer.id} layer={layer} origin={scene.position} range={scene.lifecycle!} experience={experience} breakpoint={breakpoint} onInteraction={onInteraction} />)}</div>)}
    {experience.persistentLayers?.filter((layer) => layer.renderer === "dom").map((layer) => <DomLayer key={layer.id} layer={layer} origin={origin} range={persistentRange} experience={experience} breakpoint={breakpoint} onInteraction={onInteraction} />)}
    <div className="story-webgl"><SpatialCanvas experience={experience} sceneIndex={0} storyScenes={resident} /></div>
    <AssetLoader scene={experience.scenes[experience.scenes.indexOf(resident[resident.length - 1]) + 1]} experience={experience} breakpoint={breakpoint} />
  </div></MasterTimeline>;
}
