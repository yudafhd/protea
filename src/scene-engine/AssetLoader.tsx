"use client";
import { useEffect } from "react";
import type { Breakpoint, Layer, Scene, WeddingExperience } from "@/schemas/experience";
import { loadFont } from "@/typography/FontRegistry";
import { resolveTypography } from "@/typography/TypographyPresets";
import { resolveBinding, safeUrl } from "@/utils/binding";
export function AssetLoader({ scene, experience, breakpoint = "mobile" }: { scene?: Scene; experience: WeddingExperience; breakpoint?: Breakpoint }) {
  useEffect(() => {
    if (!scene) return;
    const visit = (layers: Layer[]) => layers.forEach((layer) => {
      if (layer.type === "image" || layer.type === "svg") { const src = safeUrl(resolveBinding(experience.content, layer.bind, layer.src)); if (src) { if (layer.renderer === "dom") { const image = new Image(); image.src = src; } else void import("@react-three/drei").then(({ useTexture }) => useTexture.preload(src)); } }
      if (layer.type === "text" || layer.type === "button") { const style = resolveTypography(layer, experience, breakpoint); const id = style.fontFamily; if (id && experience.fonts[id]) void loadFont(id, experience.fonts[id], style).catch(() => undefined); }
      if (layer.children) visit(layer.children);
    });
    const timer = window.setTimeout(() => visit(scene.layers), 180);
    return () => window.clearTimeout(timer);
  }, [scene, experience, breakpoint]);
  return null;
}
