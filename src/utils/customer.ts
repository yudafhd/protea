import type { Layer, TextStyle, WeddingExperience } from "@/schemas/experience";
export function updateCustomerLayer(experience: WeddingExperience, sceneId: string, layerId: string, patch: { content?: string; textStyle?: TextStyle }): WeddingExperience {
  const update = (layer: Layer): Layer => {
    if (layer.id !== layerId) return layer.children ? { ...layer, children: layer.children.map(update) } : layer;
    const allowed = layer.customizable ?? {};
    const style: TextStyle = {};
    if (allowed.fontFamily && patch.textStyle?.fontFamily && experience.fonts[patch.textStyle.fontFamily]) style.fontFamily = patch.textStyle.fontFamily;
    if (allowed.color && patch.textStyle?.color) style.color = patch.textStyle.color;
    if (allowed.fontSize && patch.textStyle?.fontSize) style.fontSize = patch.textStyle.fontSize;
    if (allowed.alignment && patch.textStyle?.align) style.align = patch.textStyle.align;
    return { ...layer, ...(allowed.content && patch.content !== undefined ? { content: patch.content } : {}), textStyle: { ...layer.textStyle, ...style } };
  };
  return { ...experience, scenes: experience.scenes.map((scene) => scene.id === sceneId ? { ...scene, layers: scene.layers.map(update) } : scene) };
}
export async function optimizePhoto(file: File): Promise<string> {
  if (!["image/jpeg", "image/png", "image/webp", "image/avif"].includes(file.type)) throw new Error("Choose a JPG, PNG, WebP, or AVIF image.");
  if (file.size > 15 * 1024 * 1024) throw new Error("Choose an image smaller than 15 MB.");
  const bitmap = await createImageBitmap(file);
  try { const ratio = Math.min(1, 1200 / Math.max(bitmap.width, bitmap.height)); const canvas = document.createElement("canvas"); canvas.width = Math.round(bitmap.width * ratio); canvas.height = Math.round(bitmap.height * ratio); const context = canvas.getContext("2d"); if (!context) throw new Error("Image processing is unavailable."); context.drawImage(bitmap, 0, 0, canvas.width, canvas.height); return canvas.toDataURL("image/webp", 0.82); } finally { bitmap.close(); }
}
