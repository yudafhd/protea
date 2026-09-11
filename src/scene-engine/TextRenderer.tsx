"use client";
import { Text } from "@react-three/drei";
import type { Breakpoint, Layer, WeddingExperience } from "@/schemas/experience";
import { resolveTypography } from "@/typography/TypographyPresets";
import { fontSource } from "@/typography/FontRegistry";
import { resolveBinding } from "@/utils/binding";

export function TextRenderer({ layer, experience, breakpoint }: { layer: Layer; experience: WeddingExperience; breakpoint: Breakpoint }) {
  const style = resolveTypography(layer, experience, breakpoint);
  let text = resolveBinding(experience.content, layer.bind, layer.content);
  if (style.textTransform === "uppercase") text = text.toUpperCase();
  if (style.textTransform === "lowercase") text = text.toLowerCase();
  const font = experience.fonts[style.fontFamily ?? ""];
  const shared = { font: font ? fontSource(font, style, true) : undefined, fontSize: style.fontSize, maxWidth: style.maxWidth, textAlign: style.align, anchorX: style.align ?? "center" as const, anchorY: style.verticalAlign ?? "middle" as const, lineHeight: style.lineHeight, letterSpacing: style.letterSpacing, fontWeight: style.fontWeight, fontStyle: style.fontStyle, characters: text };
  const width = Math.min(style.maxWidth ?? 5, text.length * (style.fontSize ?? 0.2) * 0.43);
  return <>
    {style.shadow && <Text {...shared} position={[style.shadow.offsetX, style.shadow.offsetY, -0.015]} color={style.shadow.color} fillOpacity={style.shadow.opacity} outlineWidth={style.shadow.blur} outlineBlur={style.shadow.blur} outlineColor={style.shadow.color} outlineOpacity={style.shadow.opacity}>{text}</Text>}
    <Text {...shared} color={style.color} fillOpacity={(style.opacity ?? 1) * (layer.opacity ?? 1)} outlineColor={style.stroke} outlineWidth={style.strokeWidth ?? 0}>{text}</Text>
    {style.decoration && style.decoration !== "none" && <mesh position={[style.align === "left" ? width / 2 : style.align === "right" ? -width / 2 : 0, style.decoration === "underline" ? -(style.fontSize ?? 0.2) * 0.55 : 0, 0.01]}><planeGeometry args={[width, (style.fontSize ?? 0.2) * 0.035]} /><meshBasicMaterial color={style.color} transparent opacity={style.opacity ?? 1} /></mesh>}
  </>;
}
