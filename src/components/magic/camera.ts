import type { Point } from './world';
import { toWorld } from './world';

// Yaw is the direction the camera looks along the ground, measured from +Z.
export const INITIAL_YAW = 1.74;
export const INITIAL_PITCH = .18;
export function thirdPersonPose(point: Point, yaw: number, pitch: number) {
  const [x, z] = toWorld(point);
  const distance = 8.2;
  const forward = { x: Math.sin(yaw), z: Math.cos(yaw) };
  return {
    eye: [x - forward.x * distance, 2.1 + Math.sin(pitch) * distance, z - forward.z * distance] as [number, number, number],
    target: [x + forward.x * 2.2, 2.15, z + forward.z * 2.2] as [number, number, number],
  };
}
export function cameraMovement(horizontal: number, vertical: number, yaw: number): Point {
  // Up walks into the screen; right follows the camera's horizontal axis.
  return {
    x: (-Math.cos(yaw) * horizontal - Math.sin(yaw) * vertical) / .045,
    y: (Math.sin(yaw) * horizontal - Math.cos(yaw) * vertical) / .055,
  };
}
