"use client";
import { Suspense } from "react";
import { useTexture } from "@react-three/drei";
import { useThree, type ThreeEvent } from "@react-three/fiber";
import { SRGBColorSpace, DoubleSide } from "three";
import type { Layer, WeddingExperience } from "@/schemas/experience";
import { resolveLayer } from "@/typography/TypographyPresets";
import { resolveBinding, safeUrl } from "@/utils/binding";
import { TextRenderer } from "./TextRenderer";
import { AnimationController } from "./AnimationController";

function ImagePlane({ src, opacity = 1, crop, edgeFade = 0 }: { src: string; opacity?: number; crop?: [number, number, number, number]; edgeFade?: number }) {
  const texture = useTexture(src);
  texture.colorSpace = SRGBColorSpace;
  return <mesh><planeGeometry args={[1, 1]} onUpdate={(geometry) => { if (crop) { const uv = geometry.attributes.uv; const corners = [[0, 1], [1, 1], [0, 0], [1, 0]]; corners.forEach(([x, y], i) => uv.setXY(i, crop[0] + x * crop[2], crop[1] + y * crop[3])); uv.needsUpdate = true; } }} /><meshBasicMaterial map={texture} transparent opacity={opacity} depthWrite={false} side={DoubleSide} toneMapped={false} customProgramCacheKey={() => `edge-${edgeFade}`} onBeforeCompile={(shader) => { if (edgeFade) shader.fragmentShader = shader.fragmentShader.replace("#include <map_fragment>", `#include <map_fragment>\ndiffuseColor.a *= smoothstep(0.0, ${edgeFade.toFixed(3)}, vMapUv.x) * smoothstep(0.0, ${edgeFade.toFixed(3)}, 1.0-vMapUv.x) * smoothstep(0.0, ${edgeFade.toFixed(3)}, vMapUv.y) * smoothstep(0.0, ${edgeFade.toFixed(3)}, 1.0-vMapUv.y);`); }} /></mesh>;
}
function ProgressivePlane({ src, preview, opacity, crop, edgeFade }: { src: string; preview?: string; opacity?: number; crop?: [number, number, number, number]; edgeFade?: number }) {
  return <Suspense fallback={preview ? <ImagePlane src={preview} opacity={opacity} crop={crop} edgeFade={edgeFade} /> : null}><ImagePlane src={src} opacity={opacity} crop={crop} edgeFade={edgeFade} /></Suspense>;
}
export function LayerRenderer({ layer: original, experience, active, onInteraction, onSelect }: { layer: Layer; experience: WeddingExperience; active: boolean; onInteraction?: (id: string) => void; onSelect?: (id: string) => void }) {
  const width = useThree((state) => state.size.width);
  const breakpoint = width < 600 ? "mobile" : width < 1024 ? "tablet" : "desktop";
  const layer = resolveLayer(original, breakpoint);
  const source = safeUrl(resolveBinding(experience.content, layer.bind, layer.src));
  const handleClick = (event: ThreeEvent<MouseEvent>) => { if (onSelect || layer.interaction) event.stopPropagation(); if (onSelect) onSelect(layer.id); else if (active && layer.interaction) onInteraction?.(layer.interaction); };
  return <group position={layer.position} rotation={layer.rotation} scale={layer.scale} renderOrder={experience.story?.world ? 0 : layer.depth ?? 0} onClick={handleClick}>
    <Suspense fallback={null}><AnimationController layer={layer} active={active}>
      {(layer.type === "text" || layer.type === "button") && <TextRenderer layer={original} experience={experience} breakpoint={breakpoint} />}
      {(layer.type === "image" || layer.type === "svg") && source && <ProgressivePlane src={source} preview={layer.previewSrc ? safeUrl(layer.previewSrc) : undefined} opacity={layer.opacity} crop={layer.crop} edgeFade={layer.edgeFade} />}
      {layer.type === "group" && layer.children?.map((child) => <LayerRenderer key={child.id} layer={child} experience={experience} active={active} onInteraction={onInteraction} onSelect={onSelect} />)}
    </AnimationController></Suspense>
  </group>;
}
