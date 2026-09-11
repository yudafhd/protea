import { z } from "zod";

const progress = z.number().min(0).max(1);
export const storyKeyframeSchema = z.object({
  at: progress,
  x: z.number().optional(), y: z.number().optional(), z: z.number().optional(),
  scale: z.number().positive().optional(), rotation: z.number().optional(),
  rotationX: z.number().optional(), rotationY: z.number().optional(),
  opacity: progress.optional(), blur: z.number().min(0).max(20).optional(),
  reveal: progress.optional(), ease: z.string().optional(),
});
export type StoryKeyframe = z.infer<typeof storyKeyframeSchema>;
export const lifecycleSchema = z.object({
  start: progress, enterEnd: progress, exitStart: progress, end: progress, anchor: progress,
}).refine((range) => range.start <= range.enterEnd && range.enterEnd <= range.anchor && range.anchor <= range.exitStart && range.exitStart <= range.end && range.start < range.end, "Scene lifecycle must be ordered: start ≤ enterEnd ≤ anchor ≤ exitStart ≤ end");
export type SceneLifecycle = z.infer<typeof lifecycleSchema>;
export const storySchema = z.object({
  world: z.object({ far: z.number().positive().default(240), focusDistance: z.number().positive().default(14) }).optional(),
  scrollScreens: z.number().min(2).max(40),
  preloadAhead: z.number().min(0).max(0.25).default(0.08),
  virtualCamera: z.array(z.object({ at: progress, x: z.number(), y: z.number(), zoom: z.number().positive(), rotation: z.number(), ease: z.string().optional() })).min(2),
});
