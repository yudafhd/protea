"use client";
import { useEffect, type CSSProperties } from "react";
import type { Breakpoint, Layer, WeddingExperience } from "@/schemas/experience";
import { resolveTypography } from "@/typography/TypographyPresets";
import { loadFont } from "@/typography/FontRegistry";
import { resolveBinding } from "@/utils/binding";

export function DomText({ layer, experience, breakpoint }: { layer: Layer; experience: WeddingExperience; breakpoint: Breakpoint }) {
  const style = resolveTypography(layer, experience, breakpoint);
  const font = experience.fonts[style.fontFamily ?? ""];
  useEffect(() => { if (font && style.fontFamily) void loadFont(style.fontFamily, font, style).catch(() => undefined); }, [font, style.fontFamily, style.fontStyle, style.fontWeight]);
  let text = resolveBinding(experience.content, layer.bind, layer.content);
  if (style.textTransform === "uppercase") text = text.toUpperCase();
  if (style.textTransform === "lowercase") text = text.toLowerCase();
  // Bound long text stays a single node; only short headings are split.
  const split = layer.textMotion && text.length <= 100 ? layer.textMotion.split : undefined;
  const units = split === "words" ? text.split(/(\s+)/) : Array.from(text);
  const unit = (value: number) => `calc(var(--world-unit) * ${value})`;
  const css: CSSProperties = {
    fontFamily: `"${style.fontFamily}", ${font?.fallback ?? "serif"}`, fontSize: unit(style.fontSize ?? 0.2), fontWeight: style.fontWeight,
    fontStyle: style.fontStyle, color: style.color, opacity: style.opacity,
    textAlign: style.align, lineHeight: style.lineHeight, letterSpacing: `${style.letterSpacing ?? 0}em`,
    width: unit(style.maxWidth ?? 5), textDecoration: style.decoration,
    WebkitTextStroke: style.strokeWidth ? `${unit(style.strokeWidth)} ${style.stroke}` : undefined,
    textShadow: style.shadow ? `${unit(style.shadow.offsetX)} ${unit(-style.shadow.offsetY)} ${unit(style.shadow.blur)} color-mix(in srgb, ${style.shadow.color} ${style.shadow.opacity * 100}%, transparent)` : undefined,
    transform: `translate(${style.align === "left" ? "0" : style.align === "right" ? "-100%" : "-50%"}, ${style.verticalAlign === "top" ? "0" : style.verticalAlign === "bottom" ? "-100%" : "-50%"})`,
  };
  return <div className="story-text" style={css} aria-label={split ? text : undefined}>{split ? units.map((unit, index) => <span key={index} data-glyph={unit.trim() ? "" : undefined} aria-hidden="true" style={{ display: "inline-block", whiteSpace: "pre" }}>{unit}</span>) : text}</div>;
}
