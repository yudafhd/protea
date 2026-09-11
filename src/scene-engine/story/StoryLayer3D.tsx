"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Group, Material, Mesh } from "three";
import { useThree } from "@react-three/fiber";
import type { Layer, Vector3, WeddingExperience } from "@/schemas/experience";
import type { SceneLifecycle } from "@/schemas/story";
import { useStoryProgress } from "@/store/story";
import { LayerRenderer } from "../LayerRenderer";
import { buildLayerTrack, motionDefaults, useStoryTimeline } from "./MasterTimeline";
import { scenePhase } from "./lifecycle";
import { resolveLayer } from "@/typography/TypographyPresets";

export function StoryLayer3D({ layer: original, origin, range, experience }: { layer: Layer; origin: Vector3; range: SceneLifecycle; experience: WeddingExperience }) {
  const ref = useRef<Group>(null);
  const runtime = useStoryTimeline();
  const [detail, setDetail] = useState(false);
  const detailRequested = useRef(false);
  const invalidate = useThree((state) => state.invalidate);
  const width = useThree((state) => state.size.width);
  const breakpoint = width < 600 ? "mobile" : width < 1024 ? "tablet" : "desktop";
  const layer = useMemo(() => resolveLayer(original, breakpoint), [original, breakpoint]);
  useEffect(() => {
    const group = ref.current;
    if (!group) return;
    const state = { ...motionDefaults };
    const materials = new Map<Material, number>();
    const track = buildLayerTrack(state, layer.keyframes ?? [{ at: 0 }, { at: 1 }], range, false);
    return runtime.attach(track, () => {
      const reduced = runtime.reduced;
      const camera = reduced ? { x: 0, y: 0, zoom: 1, rotation: 0 } : runtime.camera;
      const depth = layer.depth ?? 0.5;
      const zoom = 1 + (camera.zoom - 1) * depth;
      const world = Boolean(experience.story?.world);
      const distance = runtime.spatial.z - origin[2] - layer.position[2];
      if (layer.previewSrc && !detailRequested.current && distance < 45) { detailRequested.current = true; setDetail(true); }
      group.visible = (world || scenePhase(range, useStoryProgress.getState().progress) !== "inactive") && state.opacity > 0.001;
      group.position.set((origin[0] + layer.position[0] + (reduced ? 0 : state.x) - camera.x * depth) * zoom, (origin[1] + layer.position[1] + (reduced ? 0 : state.y) - camera.y * depth) * zoom, origin[2] + layer.position[2] + (reduced ? 0 : state.z));
      if (world && layer.space === "screen") group.position.z = runtime.spatial.z - 150;
      group.rotation.set((layer.rotation?.[0] ?? 0) + (reduced ? 0 : state.rotationX), (layer.rotation?.[1] ?? 0) + (reduced ? 0 : state.rotationY), (layer.rotation?.[2] ?? 0) + (reduced ? 0 : state.rotation - camera.rotation * depth));
      group.scale.setScalar(zoom * (reduced ? 1 : state.scale));
      group.traverse((object) => { if (object instanceof Mesh) for (const material of Array.isArray(object.material) ? object.material : [object.material]) { if (!materials.has(material)) materials.set(material, material.opacity); material.opacity = materials.get(material)! * state.opacity; material.transparent = true; } });
      invalidate();
    });
  }, [layer, origin, range, runtime, invalidate, experience.story]);
  return <group ref={ref}><LayerRenderer layer={{ ...layer, responsive: undefined, src: !detail && layer.previewSrc ? layer.previewSrc : layer.src, position: [0, 0, 0], rotation: [0, 0, 0], animation: undefined }} experience={experience} active /></group>;
}
