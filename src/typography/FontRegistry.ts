import type { FontDefinition, TextStyle } from "@/schemas/experience";
export function fontSource(font: FontDefinition, style: TextStyle, spatial = false): string {
  const variant = font.variants?.[`${style.fontWeight ?? 400}-${style.fontStyle ?? "normal"}`];
  return spatial ? variant?.spatialSrc ?? font.spatialSrc : variant?.src ?? font.src;
}
const loaded = new Map<string, Promise<FontFace>>();
export function loadFont(id: string, font: FontDefinition, style: TextStyle = {}): Promise<FontFace> {
  const src = fontSource(font, style);
  const key = `${id}:${src}`;
  if (!loaded.has(key)) {
    const face = new FontFace(id, `url("${src.replace(/["\\]/g, "")}")`, { weight: String(style.fontWeight ?? 400), style: style.fontStyle ?? "normal" });
    loaded.set(key, face.load().then((ready) => { document.fonts.add(ready); return ready; }).catch((error: unknown) => { loaded.delete(key); throw error; }));
  }
  return loaded.get(key)!;
}
