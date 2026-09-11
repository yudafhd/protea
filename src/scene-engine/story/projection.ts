import type { Vector3 } from "@/schemas/experience";
export function projectWorld(position: Vector3, camera: { x: number; y: number; z: number }, focusDistance: number) {
  const distance = camera.z - position[2];
  const scale = focusDistance / Math.max(0.1, distance);
  return { x: (position[0] - camera.x) * scale, y: (position[1] - camera.y) * scale, scale, distance, visible: distance > 0.4 };
}
export function smoothRange(min: number, max: number, value: number) { const t = Math.min(1, Math.max(0, (value - min) / (max - min))); return t * t * (3 - 2 * t); }
