"use client";

import { Suspense, useEffect, useMemo, useRef, type RefObject } from "react";
import { Canvas, ThreeEvent, useFrame, useThree } from "@react-three/fiber";
import { Sparkles, useGLTF } from "@react-three/drei";
import { Group, Light, MathUtils, Object3D, Vector2, Vector3 } from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { STOPS, type HallPoint } from "./config";

function CandleGlow() {
  const { gl, scene, camera, size } = useThree();
  const composer = useRef<EffectComposer | null>(null);
  useEffect(() => {
    try {
      const effect = new EffectComposer(gl);
      const render = new RenderPass(scene, camera);
      const bloom = new UnrealBloomPass(new Vector2(Math.max(1, size.width), Math.max(1, size.height)), 0.32, 0.45, 1.2);
      const output = new OutputPass();
      effect.addPass(render); effect.addPass(bloom); effect.addPass(output);
      composer.current = effect;
      return () => { composer.current = null; render.dispose(); bloom.dispose(); output.dispose(); effect.dispose(); };
    } catch {
      composer.current = null;
    }
  }, [gl, scene, camera, size]);
  useEffect(() => {
    if (size.width > 0 && size.height > 0) {
      composer.current?.setPixelRatio(Math.min(gl.getPixelRatio(), 1.25));
      composer.current?.setSize(size.width, size.height);
    }
  }, [gl, size]);
  useFrame((state, dt) => {
    if (composer.current) {
      try {
        composer.current.render(dt);
        return;
      } catch {}
    }
    state.gl.render(state.scene, state.camera);
  }, 1);
  return null;
}

function prepare(source: Object3D) {
  const clone = source.clone(true);
  clone.traverse((object) => {
    if (object instanceof Light) {
      object.intensity *= 0.015;
      object.castShadow = false;
    }
  });
  return clone;
}

function Hall() {
  const gltf = useGLTF("/assets/models/grand-hall/grand-hall.glb?v=vault-2");
  const scene = useMemo(() => prepare(gltf.scene), [gltf.scene]);
  return <primitive object={scene} />;
}

function FirstPersonCamera({ position, yaw, pitch, moving, reduced, fov }: {
  position: HallPoint;
  yaw: RefObject<number>;
  pitch: RefObject<number>;
  moving: boolean;
  reduced: boolean;
  fov?: RefObject<number>;
}) {
  const { camera } = useThree();
  const eye = useMemo(() => new Vector3(), []);
  const look = useMemo(() => new Vector3(), []);
  useFrame(({ clock }, dt) => {
    const currentY = 1.62 + (position.y ?? 0);
    const isGrounded = (position.y ?? 0) <= 0.05;
    const bob = moving && isGrounded && !reduced ? Math.sin(clock.elapsedTime * 10) * 0.025 : 0;
    const cameraY = currentY + bob;

    eye.set(position.x, cameraY, position.z);
    camera.position.lerp(eye, reduced ? 1 : 1 - Math.exp(-dt * 18));
    const horizontal = Math.cos(pitch.current) * 10;
    look.set(
      position.x + Math.sin(yaw.current) * horizontal,
      cameraY + Math.sin(pitch.current) * 10,
      position.z + Math.cos(yaw.current) * horizontal
    );
    camera.lookAt(look);

    if (fov && "fov" in camera && typeof (camera as { fov?: number }).fov === "number") {
      const cam = camera as { fov: number; updateProjectionMatrix: () => void };
      const targetFov = fov.current;
      if (Math.abs(cam.fov - targetFov) > 0.02) {
        cam.fov = MathUtils.lerp(cam.fov, targetFov, reduced ? 1 : 1 - Math.exp(-dt * 14));
        cam.updateProjectionMatrix();
      }
    }
  });
  return null;
}

function Beacon({ index, visited, onSelect }: { index: number; visited: boolean; onSelect: () => void }) {
  const root = useRef<Group>(null);
  const point = STOPS[index];
  useFrame(({ clock }) => {
    if (root.current) root.current.position.y = 0.45 + Math.sin(clock.elapsedTime * 2 + index) * 0.08;
  });
  return (
    <group ref={root} position={[point.x, 0.45, point.z]} onClick={(event) => { event.stopPropagation(); onSelect(); }}>
      <mesh castShadow><octahedronGeometry args={[0.22]} /><meshStandardMaterial color={visited ? "#b7c9a8" : "#e9c77b"} emissive="#b88639" emissiveIntensity={0.45} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.39, 0]}><ringGeometry args={[0.34, 0.42, 28]} /><meshBasicMaterial color="#f3d99b" transparent opacity={0.8} /></mesh>
    </group>
  );
}

export default function GrandHallWorld({ position, moving, visited, onWalk, yaw, pitch, reduced, fov }: {
  position: HallPoint;
  moving: boolean;
  visited: number[];
  onWalk: (target: HallPoint) => void;
  yaw: RefObject<number>;
  pitch: RefObject<number>;
  reduced: boolean;
  fov?: RefObject<number>;
}) {
  const walk = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    const point = { x: MathUtils.clamp(event.point.x, -1.3, 1.3), z: MathUtils.clamp(event.point.z, -23, 6) };
    onWalk(point);
  };
  return (
    <Canvas dpr={[1, 1.35]} camera={{ position: [0, 1.62, 5], fov: 67, near: 0.08, far: 90 }} gl={{ antialias: true, powerPreference: "high-performance" }}>
      <color attach="background" args={["#07131e"]} />
      <fog attach="fog" args={["#0b2532", 30, 75]} />
      <hemisphereLight args={["#78b6d1", "#31213d", 1.1]} />
      <directionalLight position={[-3, 18, 5]} intensity={1.8} color="#65bddd" />
      <pointLight position={[0, 18, -5]} color="#6caabd" intensity={90} distance={28} decay={2} />
      {[[-3.2, 12, 0], [3.1, 12.6, -2], [-3.4, 8.5, -8], [2.4, 8.2, -15], [0, 3, -26]].map((p, i) => <pointLight key={i} position={p as [number, number, number]} color="#ff9b3d" intensity={i === 4 ? 30 : 24} distance={10} decay={2} />)}
      <Suspense fallback={null}><Hall /></Suspense>
      {STOPS.map((point, index) => <Beacon key={index} index={index} visited={visited.includes(index)} onSelect={() => onWalk(point)} />)}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, -8.5]} onClick={walk}><planeGeometry args={[2.6, 29]} /><meshBasicMaterial transparent opacity={0} depthWrite={false} /></mesh>
      <Sparkles count={220} scale={[13, 21, 33]} position={[0, 11, -10]} size={2} speed={0.15} color="#e9d9a9" opacity={0.5} />
      <Sparkles count={220} scale={[13, 21, 33]} position={[0, 11, -10]} size={2} speed={0.15} color="#e9d9a9" opacity={0.5} />
      <Sparkles count={220} scale={[13, 21, 33]} position={[0, 11, -10]} size={2} speed={0.15} color="#e9d9a9" opacity={0.5} />
      <Sparkles count={220} scale={[13, 21, 33]} position={[0, 11, -10]} size={2} speed={0.15} color="#e9d9a9" opacity={0.5} />
      <FirstPersonCamera position={position} yaw={yaw} pitch={pitch} moving={moving} reduced={reduced} fov={fov} />
      <CandleGlow />
    </Canvas>
  );
}

useGLTF.preload("/assets/models/grand-hall/grand-hall.glb?v=vault-2");
