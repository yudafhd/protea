"use client";
import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { PerspectiveCamera, Vector3 } from "three";
import gsap from "gsap";
import type { CameraKey } from "@/schemas/experience";
import { usePlayer } from "@/store/player";
import type { WeddingExperience } from "@/schemas/experience";
import { useStoryTimeline } from "./story/MasterTimeline";

export function CameraController({ frame, immediate = false }: { frame: CameraKey; immediate?: boolean }) {
  const { camera, size, invalidate } = useThree();
  const target = useRef(new Vector3(...frame.target));
  const first = useRef(true);
  useEffect(() => {
    if (!(camera instanceof PerspectiveCamera)) return;
    const device = size.width < 600 ? "mobile" : size.width < 1024 ? "tablet" : undefined;
    const key = { ...frame, ...(device ? frame.responsive?.[device] : {}) };
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const duration = immediate || first.current || reduced ? 0 : key.duration;
    first.current = false;
    usePlayer.getState().setTransitioning(true);
    const refresh = () => { camera.lookAt(target.current); if (key.rotation) camera.rotation.set(...key.rotation); camera.updateProjectionMatrix(); invalidate(); };
    const timeline = gsap.timeline({ defaults: { duration, ease: key.ease }, onUpdate: refresh, onComplete: () => usePlayer.getState().setTransitioning(false) });
    timeline.to(camera.position, { x: key.position[0], y: key.position[1], z: key.position[2] }, 0);
    timeline.to(target.current, { x: key.target[0], y: key.target[1], z: key.target[2] }, 0);
    // Portrait framing preserves the full composition at 360px.
    timeline.to(camera, { fov: key.fov }, 0);
    return () => { timeline.kill(); usePlayer.getState().setTransitioning(false); };
  }, [camera, frame, immediate, invalidate, size.width, size.height]);
  return null;
}

// The legacy camera remains available for existing templates. Story cameras seek
// the shared timeline, so reversing scroll reverses their exact pose as well.
export function StoryCameraController({ experience }: { experience: WeddingExperience }) {
  const { camera, size, invalidate } = useThree();
  const runtime = useStoryTimeline();
  useEffect(() => {
    if (!(camera instanceof PerspectiveCamera)) return;
    const keys = experience.cameraPath.filter((key) => key.at !== undefined);
    const pose = { x: 0, y: 0, z: 10, tx: 0, ty: 0, tz: 0, fov: 42, rx: 0, ry: 0, rz: 0 };
    runtime.spatial = pose;
    const track = gsap.timeline();
    keys.forEach((key, index) => {
      const values = { x: key.position[0], y: key.position[1], z: key.position[2], tx: key.target[0], ty: key.target[1], tz: key.target[2], fov: key.fov, rx: key.rotation?.[0] ?? 0, ry: key.rotation?.[1] ?? 0, rz: key.rotation?.[2] ?? 0 };
      if (!index) { Object.assign(pose, values); track.set(pose, values, 0); }
      else track.to(pose, { ...values, duration: key.at! - keys[index - 1].at!, ease: key.ease }, keys[index - 1].at);
    });
    track.to({}, { duration: 1 }, 0);
    return runtime.attach(track, () => {
      if (experience.story?.world) {
        camera.position.set(pose.x, pose.y, pose.z);
        camera.fov = pose.fov;
        camera.far = experience.story.world.far;
        camera.lookAt(pose.tx, pose.ty, pose.tz);
        camera.updateProjectionMatrix(); invalidate(); return;
      }
      const unit = Math.min(size.width / (size.width < 600 ? 6.6 : 10), size.height / 7.2);
      camera.fov = runtime.reduced ? 42 : pose.fov;
      const distance = size.height / (2 * unit * Math.tan(camera.fov * Math.PI / 360));
      camera.position.set(runtime.reduced ? 0 : pose.x, runtime.reduced ? 0 : pose.y, distance * (runtime.reduced ? 1 : pose.z / 10));
      camera.lookAt(pose.tx, pose.ty, pose.tz);
      if (!runtime.reduced) { camera.rotation.x += pose.rx; camera.rotation.y += pose.ry; camera.rotation.z += pose.rz; }
      camera.updateProjectionMatrix(); invalidate();
    });
  }, [camera, experience, runtime, size.width, size.height, invalidate]);
  return null;
}
