"use client";
import { useEffect, useRef, type CSSProperties } from "react";
import type { Breakpoint, Layer, Vector3, WeddingExperience } from "@/schemas/experience";
import type { SceneLifecycle } from "@/schemas/story";
import { resolveLayer } from "@/typography/TypographyPresets";
import { resolveBinding, safeUrl } from "@/utils/binding";
import { useStoryProgress } from "@/store/story";
import { buildLayerTrack, motionDefaults, useStoryTimeline } from "./MasterTimeline";
import { scenePhase } from "./lifecycle";
import { DomText } from "./DomText";
import { projectWorld, smoothRange } from "./projection";

const depthOrder = { background: 0, midground: 10, subject: 25, text: 40, foreground: 60, fx: 70 };
export function DomLayer({ layer: original, origin, range, experience, breakpoint, onInteraction }: { layer: Layer; origin: Vector3; range: SceneLifecycle; experience: WeddingExperience; breakpoint: Breakpoint; onInteraction?: (id: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const runtime = useStoryTimeline();
  const layer = resolveLayer(original, breakpoint);
  const source = safeUrl(resolveBinding(experience.content, layer.bind, layer.src));
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const layer = resolveLayer(original, breakpoint);
    const state = { ...motionDefaults };
    const track = buildLayerTrack(state, layer.keyframes ?? [{ at: 0 }, { at: 1 }], range, false);
    const glyphs = node.querySelectorAll<HTMLElement>("[data-glyph]");
    if (layer.textMotion && glyphs.length) {
      const { start, end } = layer.textMotion;
      const duration = (end - start) * (range.end - range.start);
      track.fromTo(glyphs, { opacity: 0, yPercent: 65 }, { opacity: 1, yPercent: 0, duration: duration * 0.55, stagger: glyphs.length > 1 ? duration * 0.45 / (glyphs.length - 1) : 0, ease: "power2.out", immediateRender: false }, range.start + start * (range.end - range.start));
    }
    const render = () => {
      const progress = useStoryProgress.getState().progress;
      const phase = scenePhase(range, progress);
      const reduced = runtime.reduced;
      const camera = reduced ? { x: 0, y: 0, zoom: 1, rotation: 0 } : runtime.camera;
      const depth = layer.depth ?? 0.5;
      const zoom = 1 + (camera.zoom - 1) * depth;
      let x = (origin[0] + layer.position[0] + (reduced ? 0 : state.x) - camera.x * depth) * zoom;
      let y = (origin[1] + layer.position[1] + (reduced ? 0 : state.y) - camera.y * depth) * zoom;
      const rotation = (layer.rotation?.[2] ?? 0) + (reduced ? 0 : state.rotation - camera.rotation * depth);
      let scale = (reduced ? 1 : state.scale) * zoom;
      let visibility = phase !== "inactive", focusOpacity = 1;
      if (experience.story?.world && layer.space !== "screen") {
        const projection = projectWorld([origin[0] + layer.position[0] + (reduced ? 0 : state.x), origin[1] + layer.position[1] + (reduced ? 0 : state.y), origin[2] + layer.position[2] + state.z], runtime.spatial, experience.story.world.focusDistance);
        x = projection.x; y = projection.y; scale = projection.scale * (reduced ? 1 : state.scale); visibility = projection.visible;
        focusOpacity = smoothRange(3, 7, projection.distance) * (1 - smoothRange(20, 26, projection.distance));
        node.dataset.distance = projection.distance.toFixed(4);
      }
      const text = layer.type === "text" || layer.type === "button";
      const sx = text ? layer.scale?.[0] ?? 1 : Math.sign(layer.scale?.[0] ?? 1);
      const sy = text ? layer.scale?.[1] ?? 1 : Math.sign(layer.scale?.[1] ?? 1);
      node.style.transform = `translate3d(calc(var(--world-unit) * ${x}),calc(var(--world-unit) * ${-y}),0) rotate(${rotation}rad) scale(${scale * sx},${scale * sy})`;
      node.style.opacity = String(state.opacity * (layer.opacity ?? 1) * focusOpacity);
      node.style.visibility = visibility ? "visible" : "hidden";
      node.inert = !visibility || state.opacity * focusOpacity < 0.1;
      node.dataset.phase = phase;
      node.dataset.x = x.toFixed(4); node.dataset.y = y.toFixed(4); node.dataset.scale = scale.toFixed(4);
      node.style.filter = !reduced && state.blur > 0.05 ? `blur(${state.blur}px)` : "none";
      const content = node.firstElementChild as HTMLElement | null;
      if (content) content.style.clipPath = state.reveal < 0.999 ? `inset(${(1 - state.reveal) * 100}% 0 0 0)` : "none";
      if (reduced) glyphs.forEach((glyph) => { glyph.style.opacity = "1"; glyph.style.transform = "none"; });
    };
    return runtime.attach(track, render);
  }, [original, breakpoint, origin, range, runtime, experience.content]);
  const size: CSSProperties = { width: `calc(var(--world-unit) * ${Math.abs(layer.scale?.[0] ?? 1)})`, height: `calc(var(--world-unit) * ${Math.abs(layer.scale?.[1] ?? 1)})` };
  const content = layer.type === "text" || layer.type === "button" ? <DomText layer={original} experience={experience} breakpoint={breakpoint} /> : layer.type === "particle" ? <div className="story-dust" style={size}>{Array.from({ length: layer.count ?? 12 }, (_, index) => <i key={index} style={{ left: `${(index * 37 + 11) % 100}%`, top: `${(index * 61 + 7) % 100}%`, "--drift-delay": `${-index * 1.7}s`, "--drift-duration": `${8 + index % 5}s` } as CSSProperties} />)}</div> : source ? <img className="story-art" src={source} alt="" decoding="async" draggable={false} style={size} /> : null;
  return <div ref={ref} className="story-layer" data-layer={layer.id} data-depth={layer.depth} style={{ zIndex: depthOrder[layer.depthRole ?? "subject"] }}>
    {layer.interaction ? <button className="story-object-button" aria-label={layer.name ?? layer.content ?? "Explore"} onClick={() => onInteraction?.(layer.interaction!)}>{content}</button> : content}
  </div>;
}
