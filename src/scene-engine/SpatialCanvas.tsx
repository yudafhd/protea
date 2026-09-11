"use client";
import { Component, Suspense, type ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import type { Scene, WeddingExperience } from "@/schemas/experience";
import { CameraController, StoryCameraController } from "./CameraController";
import { SceneRenderer } from "./SceneRenderer";
import { AssetLoader } from "./AssetLoader";
import { StoryLayer3D } from "./story/StoryLayer3D";

class CanvasBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}
export default function SpatialCanvas({ experience, sceneIndex, onInteraction, children, studio = false, storyScenes }: { experience: WeddingExperience; sceneIndex: number; onInteraction?: (id: string) => void; children?: ReactNode; studio?: boolean; storyScenes?: Scene[] }) {
  const scene = experience.scenes[sceneIndex] ?? experience.scenes[0];
  const frame = experience.cameraPath.find((key) => key.scene === scene.id)!;
  const fallback = <div className="canvas-fallback"><span>{scene.name}</span><h1>{experience.content.couple.groom} <i>&</i> {experience.content.couple.bride}</h1><p>{experience.content.couple.greeting}</p><p>{experience.content.wedding.dateLabel}</p><p>{experience.content.venue.name}</p></div>;
  return <CanvasBoundary fallback={fallback}><Canvas frameloop="demand" dpr={[1, 1.5]} gl={{ antialias: true, alpha: true, powerPreference: "low-power" }} camera={{ position: frame.position, fov: frame.fov, near: 0.1, far: experience.story?.world?.far ?? 80 }} fallback={fallback}>
    {storyScenes ? <StoryCameraController experience={experience} /> : <CameraController frame={frame} immediate={studio} />}
    <Suspense fallback={null}>
      {storyScenes ? storyScenes.flatMap((item) => item.layers.filter((layer) => layer.renderer !== "dom").map((layer) => <StoryLayer3D key={`${item.id}/${layer.id}`} layer={layer} origin={item.position} range={item.lifecycle!} experience={experience} />)) : <SceneRenderer key={scene.id} scene={scene} experience={experience} active onInteraction={onInteraction} />}
      {children}
    </Suspense>
    {!storyScenes && <AssetLoader scene={experience.scenes[sceneIndex + 1]} experience={experience} />}
  </Canvas></CanvasBoundary>;
}
