"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { useThree } from "@react-three/fiber";
import { Group, Material, Mesh } from "three";
import gsap from "gsap";
import type { Layer } from "@/schemas/experience";

export function AnimationController({ layer, active, children }: { layer: Layer; active: boolean; children: ReactNode }) {
  const ref = useRef<Group>(null);
  const invalidate = useThree((state) => state.invalidate);
  useEffect(() => {
    const group = ref.current;
    if (!group || !active || !layer.animation || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const animation = layer.animation;
    const timeline = gsap.timeline({ defaults: { duration: animation.duration ?? 0.8, delay: animation.delay ?? 0, ease: animation.ease ?? "power2.out" }, onUpdate: invalidate });
    if (animation.type === "slide" || animation.type === "reveal") timeline.fromTo(group.position, { y: animation.from?.y ?? -0.25 }, { y: 0 }, 0);
    if (animation.type === "scale") timeline.fromTo(group.scale, { x: animation.from?.scale ?? 0.85, y: animation.from?.scale ?? 0.85 }, { x: 1, y: 1 }, 0);
    const materials = new Map<Material, number>();
    group.traverse((object) => { if (object instanceof Mesh) for (const material of Array.isArray(object.material) ? object.material : [object.material]) { materials.set(material, material.opacity); material.transparent = true; timeline.fromTo(material, { opacity: animation.from?.opacity ?? 0 }, { opacity: material.opacity }, 0); } });
    return () => { timeline.kill(); group.position.y = 0; group.scale.set(1, 1, 1); materials.forEach((opacity, material) => { material.opacity = opacity; }); invalidate(); };
  }, [active, layer.animation, invalidate]);
  return <group ref={ref}>{children}</group>;
}
