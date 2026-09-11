"use client";
import type { Scene, WeddingExperience } from "@/schemas/experience";
import { LayerRenderer } from "./LayerRenderer";
export function SceneRenderer({ scene, experience, active, onInteraction, onSelect }: { scene: Scene; experience: WeddingExperience; active: boolean; onInteraction?: (id: string) => void; onSelect?: (id: string) => void }) {
  return <group position={scene.position} rotation={scene.rotation}>{scene.layers.map((layer) => <LayerRenderer key={layer.id} layer={layer} experience={experience} active={active} onInteraction={onInteraction} onSelect={onSelect} />)}</group>;
}
