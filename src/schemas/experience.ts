import { z } from "zod";
import { lifecycleSchema, storyKeyframeSchema, storySchema } from "./story";

export const vectorSchema = z.tuple([z.number(), z.number(), z.number()]);
export type Vector3 = z.infer<typeof vectorSchema>;
export const textStyleSchema = z.object({
  fontFamily: z.string().optional(), fontSize: z.number().positive().optional(),
  fontWeight: z.number().min(100).max(900).optional(), fontStyle: z.enum(["normal", "italic"]).optional(),
  color: z.string().optional(), opacity: z.number().min(0).max(1).optional(),
  align: z.enum(["left", "center", "right"]).optional(),
  verticalAlign: z.enum(["top", "middle", "bottom"]).optional(),
  lineHeight: z.number().positive().optional(), letterSpacing: z.number().optional(),
  maxWidth: z.number().positive().optional(), textTransform: z.enum(["none", "uppercase", "lowercase"]).optional(),
  decoration: z.enum(["none", "underline", "line-through"]).optional(),
  stroke: z.string().optional(), strokeWidth: z.number().min(0).optional(),
  shadow: z.object({ color: z.string(), opacity: z.number().min(0).max(1), blur: z.number(), offsetX: z.number(), offsetY: z.number() }).optional(),
});
export type TextStyle = z.infer<typeof textStyleSchema>;
export const animationSchema = z.object({
  type: z.enum(["fade", "reveal", "slide", "scale", "opacity-reveal"]),
  duration: z.number().min(0).max(10).optional(), delay: z.number().min(0).max(10).optional(),
  ease: z.string().optional(), from: z.object({ opacity: z.number().optional(), y: z.number().optional(), scale: z.number().optional() }).optional(),
});
const overrideSchema = z.object({ position: vectorSchema.optional(), rotation: vectorSchema.optional(), scale: vectorSchema.optional(), opacity: z.number().min(0).max(1).optional(), textStyle: textStyleSchema.optional() });
const layerBaseSchema = z.object({
  id: z.string().min(1), type: z.enum(["image", "text", "svg", "group", "particle", "model", "button"]),
  name: z.string().optional(), content: z.string().optional(), bind: z.string().optional(), src: z.string().optional(),
  previewSrc: z.string().optional(), space: z.enum(["world", "screen"]).optional(),
  crop: z.tuple([z.number(), z.number(), z.number(), z.number()]).optional(),
  edgeFade: z.number().min(0).max(0.2).optional(),
  position: vectorSchema, rotation: vectorSchema.optional(), scale: vectorSchema.optional(),
  opacity: z.number().min(0).max(1).optional(), depth: z.number().optional(),
  renderer: z.enum(["dom", "webgl"]).optional(),
  depthRole: z.enum(["background", "midground", "subject", "foreground", "fx", "text"]).optional(),
  keyframes: z.array(storyKeyframeSchema).min(2).optional(),
  textMotion: z.object({ split: z.enum(["words", "characters"]), start: z.number().min(0).max(1), end: z.number().min(0).max(1) }).optional(),
  stylePreset: z.string().optional(), textStyle: textStyleSchema.optional(), animation: animationSchema.optional(),
  responsive: z.object({ mobile: overrideSchema.optional(), tablet: overrideSchema.optional(), desktop: overrideSchema.optional() }).optional(),
  customizable: z.object({ content: z.boolean().optional(), fontFamily: z.boolean().optional(), fontSize: z.boolean().optional(), color: z.boolean().optional(), alignment: z.boolean().optional() }).optional(),
  interaction: z.string().optional(), count: z.number().int().min(1).max(100).optional(),
});
export type Layer = z.infer<typeof layerBaseSchema> & { children?: Layer[] };
export const layerSchema: z.ZodType<Layer> = layerBaseSchema.extend({ children: z.lazy(() => z.array(layerSchema)).optional() });
export const sceneSchema = z.object({ id: z.string(), name: z.string(), position: vectorSchema, rotation: vectorSchema.optional(), lifecycle: lifecycleSchema.optional(), layers: z.array(layerSchema) });
export type Scene = z.infer<typeof sceneSchema>;
export const cameraKeySchema = z.object({
  scene: z.string(), at: z.number().min(0).max(1).optional(), position: vectorSchema, target: vectorSchema, rotation: vectorSchema.optional(),
  fov: z.number().min(15).max(100).default(42), duration: z.number().min(0).max(10).default(1.8), ease: z.string().default("power2.inOut"),
  responsive: z.object({ mobile: z.object({ position: vectorSchema.optional(), target: vectorSchema.optional(), fov: z.number().optional() }).optional(), tablet: z.object({ position: vectorSchema.optional(), target: vectorSchema.optional(), fov: z.number().optional() }).optional() }).optional(),
});
export type CameraKey = z.infer<typeof cameraKeySchema>;
export const fontSchema = z.object({
  name: z.string(), src: z.string(), spatialSrc: z.string(), fallback: z.string(),
  category: z.enum(["Serif", "Sans Serif", "Script", "Display", "Handwritten"]),
  variants: z.record(z.string(), z.object({ src: z.string(), spatialSrc: z.string() })).optional(),
});
export type FontDefinition = z.infer<typeof fontSchema>;
export const contentSchema = z.object({
  couple: z.object({ groom: z.string(), bride: z.string(), photo: z.string(), greeting: z.string(), story: z.string() }),
  wedding: z.object({ date: z.string(), dateLabel: z.string(), akad: z.string(), reception: z.string() }),
  venue: z.object({ name: z.string(), address: z.string(), mapLink: z.string() }),
  gallery: z.array(z.object({ src: z.string(), caption: z.string() })),
  guest: z.object({ name: z.string() }),
});
export type InvitationContent = z.infer<typeof contentSchema>;
export const experienceSchema = z.object({
  version: z.literal(1), id: z.string(), name: z.string(), description: z.string(),
  scenes: z.array(sceneSchema).min(1).max(30), cameraPath: z.array(cameraKeySchema),
  story: storySchema.optional(), persistentLayers: z.array(layerSchema).optional(),
  theme: z.object({ background: z.string(), foreground: z.string(), accent: z.string(), muted: z.string(), typography: z.record(z.string(), textStyleSchema) }),
  fonts: z.record(z.string(), fontSchema), content: contentSchema,
  audio: z.object({ src: z.string(), title: z.string(), volume: z.number().min(0).max(1) }).optional(),
  interactions: z.array(z.object({ id: z.string(), trigger: z.enum(["tap", "click", "scroll", "drag"]), action: z.enum(["next", "previous", "scene", "url", "rsvp"]), scene: z.string().optional(), bind: z.string().optional() })),
});
export type WeddingExperience = z.infer<typeof experienceSchema>;
export type Breakpoint = "mobile" | "tablet" | "desktop";

export function parseExperience(value: unknown): WeddingExperience {
  const data = experienceSchema.parse(value);
  const ids = new Set<string>();
  const ordered = (keys: { at: number }[]) => keys.every((key, index) => index === 0 || key.at > keys[index - 1].at);
  if (data.story && !ordered(data.story.virtualCamera)) throw new Error("Virtual camera keyframes must be strictly ordered");
  for (const scene of data.scenes) {
    if (ids.has(scene.id)) throw new Error(`Duplicate scene: ${scene.id}`);
    ids.add(scene.id);
    if (data.story && !scene.lifecycle) throw new Error(`Missing lifecycle for ${scene.id}`);
    if (!data.cameraPath.some((key) => key.scene === scene.id)) throw new Error(`Missing camera for ${scene.id}`);
    const layers = new Set<string>();
    const visit = (list: Layer[]) => list.forEach((layer) => {
      if (layers.has(layer.id)) throw new Error(`Duplicate layer: ${layer.id}`);
      layers.add(layer.id);
      if (layer.keyframes && !ordered(layer.keyframes)) throw new Error(`Unordered keyframes: ${layer.id}`);
      if (layer.textMotion && layer.textMotion.start >= layer.textMotion.end) throw new Error(`Invalid text motion: ${layer.id}`);
      if (layer.stylePreset && !data.theme.typography[layer.stylePreset]) throw new Error(`Unknown preset: ${layer.stylePreset}`);
      const font = layer.textStyle?.fontFamily;
      if (font && !data.fonts[font]) throw new Error(`Unknown font: ${font}`);
      if (layer.children) visit(layer.children);
    });
    visit(scene.layers);
  }
  return data;
}
