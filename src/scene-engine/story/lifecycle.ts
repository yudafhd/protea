import type { Scene } from "@/schemas/experience";
import type { SceneLifecycle } from "@/schemas/story";

export const persistentRange: SceneLifecycle = { start: 0, enterEnd: 0, anchor: 0.5, exitStart: 1, end: 1 };
export function scenePhase(range: SceneLifecycle, progress: number): "enter" | "hold" | "exit" | "inactive" {
  if (progress < range.start || progress > range.end) return "inactive";
  if (progress < range.enterEnd) return "enter";
  if (progress > range.exitStart) return "exit";
  return "hold";
}
export function localProgress(range: SceneLifecycle, progress: number): number { return Math.max(0, Math.min(1, (progress - range.start) / (range.end - range.start))); }
export function residentScenes(scenes: Scene[], progress: number, ahead: number): Scene[] { return scenes.filter((scene) => scene.lifecycle && progress >= scene.lifecycle.start - ahead && progress <= scene.lifecycle.end + ahead / 2); }
export function chapterAt(scenes: Scene[], progress: number): number {
  let index = 0;
  for (let i = 1; i < scenes.length; i++) if (progress >= ((scenes[i - 1].lifecycle?.anchor ?? 0) + (scenes[i].lifecycle?.anchor ?? 1)) / 2) index = i;
  return index;
}
