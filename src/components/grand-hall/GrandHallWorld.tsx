"use client";

import { Suspense, useEffect, useMemo, useRef, type RefObject } from "react";
import { Canvas, ThreeEvent, useFrame, useThree } from "@react-three/fiber";
import { Html, Sparkles, useGLTF, useTexture } from "@react-three/drei";
import { ACESFilmicToneMapping, Box3, Group, InstancedMesh, Light, MathUtils, Mesh, Object3D, Quaternion, SRGBColorSpace, Vector2, Vector3 } from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { STOPS, type HallPoint } from "./config";
import { HALL_LIMITS, HallPhysics, type Body } from "./physics";
import { loadRigidPhysics, MAX_DROPS, MAX_PUDDLES, RigidPropsPhysics } from "./rigid-physics";

function CandleGlow() {
  const { gl, scene, camera, size } = useThree();
  const composer = useRef<EffectComposer | null>(null);
  useEffect(() => {
    try {
      const effect = new EffectComposer(gl);
      const render = new RenderPass(scene, camera);
      const bloom = new UnrealBloomPass(new Vector2(Math.max(1, size.width), Math.max(1, size.height)), 0.24, 0.5, 1.35);
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
    if (object instanceof Mesh) {
      object.receiveShadow = true;
      object.castShadow = /^(Float(Table|Chair)_|Rigid)/.test(object.name);
    }
  });
  return clone;
}

function Hall({ physics, paused }: { physics: HallPhysics; paused: boolean }) {
  const gltf = useGLTF("/assets/models/grand-hall/grand-hall.glb?v=rigid-potions-10");
  const scene = useMemo(() => prepare(gltf.scene), [gltf.scene]);
  const floating = useMemo(() => {
    const items: { object: Object3D; origin: Vector3; rotation: Quaternion; center: Vector3; bounds: Box3; body?: Body; liquid?: Object3D; liquidY: number }[] = [];
    scene.updateMatrixWorld(true);
    scene.traverse((object) => {
      // Only animate the exported parent, so tableware travels with its table.
      if (/^(Float(Table|Chair|Candle|Book|Letter|Bubble|Orb|Votive)_|Rigid(Rack|Bottle|Cauldron)_)/.test(object.name) && !/^(Float|Rigid)/.test(object.parent?.name ?? "")) {
        const bounds = new Box3().setFromObject(object);
        const liquid = object.name.startsWith('RigidCauldron') ? object.children.find(child=>child.name.includes('elixir_1')||child.name.includes('elixir 1')) : undefined;
        items.push({ object, origin: object.position.clone(), rotation: object.quaternion.clone(), center: bounds.getCenter(new Vector3()), bounds, liquid, liquidY: liquid?.position.y??0 });
      }
    });
    return items;
  }, [scene]);
  useEffect(() => {
    let cancelled = false;
    for (const item of floating.filter(item=>item.object.name.startsWith('Float'))) item.body = physics.addBody(item.object.name, {
      min: { ...item.bounds.min }, max: { ...item.bounds.max },
    });
    physics.ready = true;
    const specs=floating.filter(item=>item.object.name.startsWith('Rigid')).map(item=>({id:item.object.name,min:{...item.bounds.min},max:{...item.bounds.max}}));
    loadRigidPhysics().then(api=>{
      if(!cancelled)physics.rigid=new RigidPropsPhysics(api,specs,physics.statics);
    }).catch(error=>console.error('Unable to initialize potion physics',error));
    return () => { cancelled=true; physics.clear(); };
  }, [physics, floating]);
  const rotation=useMemo(()=>new Quaternion(),[]);
  const displacement=useMemo(()=>new Vector3(),[]);
  useFrame(() => {
    for (const item of floating) {
      const rigid=physics.rigid?.props.get(item.object.name);
      if(rigid) {
        rotation.copy(rigid.rigid.rotation());
        displacement.copy(item.origin).sub(item.center).applyQuaternion(rotation);
        item.object.position.copy(rigid.rigid.translation()).add(displacement);
        item.object.quaternion.copy(rotation).multiply(item.rotation);
        if(item.liquid) {
          item.liquid.visible=rigid.volume>.01;
          item.liquid.position.y=item.liquidY-(1-rigid.volume)*.52;
        }
        continue;
      }
      const offset = item.body?.offset;
      if (offset) item.object.position.set(item.origin.x + offset.x, item.origin.y + offset.y, item.origin.z + offset.z);
    }
  });
  const touch = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    if (paused || event.delta > 6) return;
    let object: Object3D | null = event.object;
    while (object && !physics.bodies.has(object.name) && !physics.rigid?.props.has(object.name)) object = object.parent;
    if (object) physics.impulse(object.name, event.ray.direction,1.5,event.point);
  };
  return <><primitive object={scene} onClick={touch} /><PotionSpills physics={physics} /></>;
}

function PotionSpills({physics}:{physics:HallPhysics}) {
  const drops=useRef<InstancedMesh>(null),puddles=useRef<InstancedMesh>(null);
  const transform=useMemo(()=>new Object3D(),[]);
  useFrame(()=>{
    const fluid=physics.rigid;
    if(drops.current){
      drops.current.count=fluid?.drops.length??0;
      fluid?.drops.forEach((drop,i)=>{
        transform.position.copy(drop.position);transform.scale.set(.035,.055,.035);transform.updateMatrix();
        drops.current!.setMatrixAt(i,transform.matrix);
      });
      drops.current.instanceMatrix.needsUpdate=true;
    }
    if(puddles.current){
      puddles.current.count=fluid?.puddles.length??0;
      fluid?.puddles.forEach((puddle,i)=>{
        const radius=.1+Math.sqrt(puddle.amount)*.48;
        transform.position.copy(puddle.position);transform.scale.set(radius,.006,radius*.8);transform.updateMatrix();
        puddles.current!.setMatrixAt(i,transform.matrix);
      });
      puddles.current.instanceMatrix.needsUpdate=true;
    }
  });
  return <>
    <instancedMesh ref={drops} args={[undefined,undefined,MAX_DROPS]} frustumCulled={false} raycast={()=>{}}>
      <sphereGeometry args={[1,8,6]} /><meshStandardMaterial color="#bc71ef" emissive="#7928b5" emissiveIntensity={.65} roughness={.25} />
    </instancedMesh>
    <instancedMesh ref={puddles} args={[undefined,undefined,MAX_PUDDLES]} frustumCulled={false} raycast={()=>{}}>
      <cylinderGeometry args={[1,1,1,24]} /><meshStandardMaterial color="#8f3ac4" emissive="#642196" emissiveIntensity={.45} roughness={.18} transparent opacity={.85} depthWrite={false} />
    </instancedMesh>
  </>;
}

function CouplePortrait({ reduced, paused, onOpen }: { reduced: boolean; paused: boolean; onOpen: () => void }) {
  const texture = useTexture('/assets/models/grand-hall/couple-portrait.png');
  const root = useRef<Group>(null);
  useEffect(() => { texture.colorSpace = SRGBColorSpace; texture.needsUpdate = true; }, [texture]);
  useFrame(({ clock }) => {
    if (root.current && !paused) root.current.position.y = 4.65 + (reduced ? 0 : Math.sin(clock.elapsedTime * .65) * .055);
  });
  return <group ref={root} position={[0, 4.65, -27]}>
    <mesh name="CouplePortrait" onClick={event => { event.stopPropagation(); if (!paused && event.delta < 6) onOpen(); }}>
      <planeGeometry args={[2.5, 2.5]} />
      <meshBasicMaterial map={texture} transparent alphaTest={.05} toneMapped={false} />
    </mesh>
    <Html transform center position={[0, -1.55, .02]} style={{ pointerEvents: 'none', color: '#f3d99b', textAlign: 'center', width: 240, fontFamily: 'Georgia, serif' }}>
      <div style={{ fontSize: 25 }}>Yuda &amp; Putri</div><div style={{ fontSize: 11, letterSpacing: 3, marginTop: 6 }}>12 · 12 · 2026</div>
    </Html>
    <Sparkles count={18} scale={[2.9, 2.9, .15]} size={1.5} speed={reduced || paused ? 0 : .1} color="#f3d99b" opacity={.35} />
  </group>;
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
    const currentY = 1.85 + (position.y ?? 0);
    const isGrounded = (position.y ?? 0) <= 0.05;
    const bob = moving && isGrounded && !reduced ? Math.sin(clock.elapsedTime * 10) * 0.025 : 0;
    const cameraY = currentY + bob;

    eye.set(position.x, cameraY, position.z);
    // The resolved player position is already continuous; interpolation across
    // an obstacle corner could put the camera back inside solid geometry.
    camera.position.copy(eye);
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

export default function GrandHallWorld({ position, moving, visited, onWalk, onPortrait, yaw, pitch, reduced, fov, physics, paused }: {
  position: HallPoint;
  moving: boolean;
  visited: number[];
  onWalk: (target: HallPoint) => void;
  onPortrait: () => void;
  yaw: RefObject<number>;
  pitch: RefObject<number>;
  reduced: boolean;
  fov?: RefObject<number>;
  physics: HallPhysics;
  paused: boolean;
}) {
  const walk = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    const point = { x: MathUtils.clamp(event.point.x, HALL_LIMITS.minX, HALL_LIMITS.maxX), z: MathUtils.clamp(event.point.z, HALL_LIMITS.minZ, HALL_LIMITS.maxZ) };
    onWalk(point);
  };
  return (
    <Canvas shadows dpr={[1, 1.35]} camera={{ position: [0, 1.85, 5], fov: 76, near: 0.08, far: 90 }} gl={{ antialias: true, powerPreference: "high-performance", toneMapping: ACESFilmicToneMapping, toneMappingExposure: 1.1 }}>
      <color attach="background" args={["#101824"]} />
      <fog attach="fog" args={["#18202a", 35, 80]} />
      <hemisphereLight args={["#e8d7bc", "#353443", 1.25]} />
      <directionalLight position={[-4, 12, 5]} intensity={1.5} color="#ffe0ac" castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-10} shadow-camera-right={10} shadow-camera-top={18} shadow-camera-bottom={-18} shadow-camera-far={55} shadow-normalBias={0.04} />
      <pointLight position={[0, 14, -16]} color="#88c4df" intensity={55} distance={24} decay={2} />
      <pointLight position={[-4.35, 2.8, 0.4]} color="#c4a0ff" intensity={9} distance={6} decay={2} />
      {[[0, 6, 0], [0, 7, -10], [0, 5, -25]].map((p, i) => <pointLight key={i} position={p as [number, number, number]} color="#ffbf71" intensity={i === 2 ? 100 : 70} distance={15} decay={2} />)}
      <Suspense fallback={null}><Hall physics={physics} paused={paused} /></Suspense>
      <Suspense fallback={null}><CouplePortrait reduced={reduced} paused={paused} onOpen={onPortrait} /></Suspense>
      {STOPS.map((point, index) => <Beacon key={index} index={index} visited={visited.includes(index)} onSelect={() => onWalk(point)} />)}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, -9.15]} onClick={walk}><planeGeometry args={[13.3, 29.3]} /><meshBasicMaterial transparent opacity={0} depthWrite={false} /></mesh>
      <Sparkles count={180} scale={[12, 15, 32]} position={[0, 9, -10]} size={2} speed={reduced ? 0 : 0.12} color="#ffdda1" opacity={0.55} />
      <FirstPersonCamera position={position} yaw={yaw} pitch={pitch} moving={moving} reduced={reduced} fov={fov} />
      <CandleGlow />
    </Canvas>
  );
}

useGLTF.preload("/assets/models/grand-hall/grand-hall.glb?v=rigid-potions-10");
