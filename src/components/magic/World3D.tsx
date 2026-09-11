"use client";
import { Component, memo, useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import { Group, MathUtils, Mesh, Vector3 } from 'three';
import { Animal3D, Box, Castle3D, Cone, Gem, Lantern3D, Pole } from './Models3D';
import { DetailedWizard } from './Characters3D';
import { Cottage } from './Architecture3D';
import { WizardAlley } from './WizardAlley';
import { ForestCanopy, Meadow, Terrain, Understory } from './Nature3D';
import { PaintedSky, ArtFinish } from './Atmosphere3D';
import { INITIAL_YAW, thirdPersonPose } from './camera';
import { chapters, toWorld, fromWorld, lanternPositions, type Point } from './world';
type Props = { scene:number; position:Point; moving:boolean; visited:number[]; onWalk:(p:Point)=>void; paused:boolean; compact:boolean; reduced:boolean; overview:boolean; cameraYaw:RefObject<number>; cameraPitch:RefObject<number> };
const Scenery = memo(function Scenery({scene,reduced}:{scene:number;reduced:boolean}) {
 if(scene===0)return <WizardAlley reduced={reduced}/>;

 return <>
  <color attach="background" args={['#b8cbb8']}/><fogExp2 attach="fog" args={['#9fbdad',.0075]}/>
  <hemisphereLight args={['#e5f1dc','#3b5748',1.4]}/>
  <directionalLight position={[22,35,-12]} intensity={2.55} color="#ffe1a3" castShadow shadow-mapSize={[2048,2048]} shadow-camera-left={-38} shadow-camera-right={38} shadow-camera-top={32} shadow-camera-bottom={-32} shadow-camera-far={100} shadow-bias={-.00008} shadow-normalBias={.025}/>
  <directionalLight position={[-20,12,15]} intensity={.35} color="#9ec8dd"/>
  <PaintedSky scene={scene}/><Terrain scene={scene}/><ForestCanopy scene={scene} reduced={reduced}/><Meadow scene={scene} reduced={reduced}/><Understory/>
  <Gem at={[68,3,-14]} size={[22,13,28]} color="#729689"/><Gem at={[75,8,22]} size={[25,16,25]} color="#94afa0"/>
  {/* Low grass, pebbles, flowers and mushrooms are modeled geometry. */}
  {Array.from({length:48},(_,i)=>{const x=-31+(i*13.71)%64,z=i%2?-7-(i%4)*.43:7+(i%3)*1.5;return <group key={i} position={[x,0,z]}><Cone at={[0,.22,0]} radius={.16} height={.5} color={i%2?'#6a924f':'#bac17a'} sides={3}/><Cone at={[.24,.15,.1]} radius={.1} height={.35} color="#789d58" sides={3}/>{i%3===0?<><Pole at={[.6,.2,0]} radius={.06} height={.4} color="#e0d3a4"/><Cone at={[.6,.47,0]} radius={.3} height={.28} color="#c98969"/></>:<Gem at={[.55,.1,.1]} size={[.3,.15,.22]} color="#aab093"/>}</group>;})}
  {lanternPositions.map(({x,z})=><Lantern3D key={x} at={[x,0,z]}/>)}
  <Animal3D at={[-13,2.6,-1.7]} kind="owl" reduced={reduced}/><Pole at={[-13,1.1,-1.7]} height={2.2} radius={.13} color="#796d4d"/><Box at={[-13,2.3,-1.7]} size={[1,.12,.3]} color="#796d4d"/>
  <Animal3D at={[10,0,1.5]} kind="deer" reduced={reduced}/>{[-21,-3,20].map((x,i)=><Animal3D key={x} at={[x,0,6-i]} phase={i*2} reduced={reduced}/>)}
  {scene===1&&<><Cottage at={[-19,0,-12]}/><Cottage at={[-7,0,-13]} purple/><Cottage at={[8,0,-12]}/><Cottage at={[22,0,-12]} purple/><group position={[0,0,-7]}><Pole at={[0,.4,0]} radius={1.4} height={.8} color="#9ca793"/><Pole at={[0,1.1,0]} radius={.3} height={1.6} color="#a8b097"/><Gem at={[0,2.1,0]} size={[.65,.65,.65]} color="#a9d6c3"/></group>{[-10,15].map(x=><group key={x} position={[x,0,-6]}><Box at={[0,.8,0]} size={[2,.2,1]} color="#88704b"/>{[-.8,.8].map(a=><Pole key={a} at={[a,.4,0]} height={.8} radius={.08} color="#756043"/>)}{[-.6,0,.6].map((a,i)=><group key={a}><Gem at={[a,1.2,0]} size={[.2,.3,.2]} color={i%2?'#be95b5':'#79bbaa'}/><Pole at={[a,1.48,0]} height={.2} radius={.06} color="#bca46f"/></group>)}</group>)}{Array.from({length:9},(_,i)=><group key={i} position={[-23+i*5.5,5+Math.sin(i)*.4,-7]}><Cone at={[0,0,0]} radius={.2} height={.5} color={i%2?'#c59b76':'#839cb0'} sides={4}/></group>)}</>}
  {scene===2&&<><mesh position={[10,-.02,-12]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[50,14]}/><meshStandardMaterial color="#70b7b9" roughness={.23} metalness={.3}/></mesh><Castle3D/>{[-18,-10,26].map(x=><Gem key={x} at={[x,.1,-13]} size={[3.5,1.6,3]} color="#8caaa1"/>)}</>}
  {!reduced&&<Sparkles count={45} scale={[56,6,20]} position={[0,2,0]} size={3} speed={.3} color="#fff2b8"/>}
 </>;
});
function Beacon({point,found,onWalk,reduced}:{point:Point;found:boolean;onWalk:(p:Point)=>void;reduced:boolean}) {
 const gem=useRef<Mesh>(null); const [x,z]=toWorld(point);
 useFrame(({clock})=>{if(gem.current&&!reduced){gem.current.rotation.y=clock.elapsedTime;gem.current.position.y=2.3+Math.sin(clock.elapsedTime*2)*.22;}});
 return <group position={[x,0,z]} onPointerUp={e=>{e.stopPropagation();onWalk(point);}}><mesh rotation={[-Math.PI/2,0,0]} position={[0,.06,0]}><ringGeometry args={[.9,1.02,40]}/><meshBasicMaterial color={found?'#e4f2b5':'#fff0ac'} transparent opacity={.9}/></mesh><mesh rotation={[-Math.PI/2,0,0]} position={[0,.04,0]}><circleGeometry args={[1.35,32]}/><meshBasicMaterial color="#ffeeb0" transparent opacity={.14} depthWrite={false}/></mesh><mesh ref={gem} position={[0,2.3,0]}><octahedronGeometry args={[.37]}/><meshStandardMaterial color={found?'#bde4ba':'#ffe498'} emissive={found?'#9cca9d':'#ffd26d'} emissiveIntensity={.9} roughness={.2}/></mesh><mesh position={[0,1.1,0]}><cylinderGeometry args={[.08,.4,2.2,12,1,true]}/><meshBasicMaterial color="#ffe49b" transparent opacity={.13} depthWrite={false}/></mesh></group>;
}
function Player({position,moving,reduced,cameraYaw}:{position:Point;moving:boolean;reduced:boolean;cameraYaw:RefObject<number>}) {
 const root=useRef<Group>(null),facing=useRef(INITIAL_YAW),previous=useRef(position);
 useFrame((_,dt)=>{if(!root.current)return;const [x,z]=toWorld(position),[px,pz]=toWorld(previous.current);if(Math.hypot(x-px,z-pz)>.001)facing.current=Math.atan2(x-px,z-pz);root.current.position.set(x,0,z);root.current.children.slice(0,2).forEach((character,i)=>{const offset=i===0?-.7:.7; character.position.x=MathUtils.damp(character.position.x,Math.cos(facing.current)*offset,8,dt);character.position.z=MathUtils.damp(character.position.z,-Math.sin(facing.current)*offset,8,dt);const difference=Math.atan2(Math.sin(facing.current-character.rotation.y),Math.cos(facing.current-character.rotation.y));character.rotation.y+=difference*(reduced?1:1-Math.exp(-dt*12));});previous.current=position;});
 return <group ref={root} position={[toWorld(position)[0],0,toWorld(position)[1]]}><group position={[-.68,0,.1]}><DetailedWizard moving={moving} reduced={reduced}/></group><group position={[.68,0,-.2]}><DetailedWizard bride moving={moving} reduced={reduced}/></group><mesh rotation={[-Math.PI/2,0,0]} position={[0,.045,0]}><ringGeometry args={[1.1,1.14,40]}/><meshBasicMaterial color="#fff0b5" transparent opacity={.6}/></mesh></group>;
}
function FollowCamera({position,reduced,overview,scene,cameraYaw,cameraPitch}:{position:Point;reduced:boolean;overview:boolean;scene:number;cameraYaw:RefObject<number>;cameraPitch:RefObject<number>}) {
 const {camera,gl}=useThree();
 const goal=useMemo(()=>new Vector3(),[]), look=useMemo(()=>new Vector3(),[]), target=useMemo(()=>new Vector3(),[]);
 const initialized=useRef(false);
 useEffect(()=>{initialized.current=false;},[scene]);
 useFrame((_,dt)=>{
  const pose=thirdPersonPose(position,cameraYaw.current,cameraPitch.current);
  if(overview){goal.set(4,34,scene===0?6:30);target.set(0,0,scene===0?0:-4);}
  else{goal.fromArray(pose.eye);target.fromArray(pose.target);if(scene===0)goal.z=MathUtils.clamp(goal.z,-3.45,3.45);}
  const alpha=reduced||!initialized.current?1:MathUtils.damp(0,1,9,dt);
  camera.position.lerp(goal,alpha);look.lerp(target,alpha);camera.lookAt(look);initialized.current=true;
  gl.domElement.dataset.cameraMode=overview?'overview':'third-person';
  gl.domElement.dataset.cameraHeight=camera.position.y.toFixed(2);
  gl.domElement.dataset.cameraYaw=cameraYaw.current.toFixed(3);
 });return null;
}
function Ready({onReady}:{onReady:()=>void}) { useEffect(onReady,[onReady]);return null; }
class WorldBoundary extends Component<{children:ReactNode},{failed:boolean}>{state={failed:false};static getDerivedStateFromError(){return {failed:true};}render(){return this.state.failed?<div className="magic-3d-fallback">Dunia 3D belum bisa dibuka. Aktifkan WebGL atau coba browser lain. Isi undangan tetap bisa dijelajahi lewat tombol misi.</div>:this.props.children;}}
export default function World3D(props:Props) {
 const gesture=useRef({x:0,y:0,lastX:0,lastY:0,dragged:false,active:false,id:-1});
 const [ready,setReady]=useState(false);const markReady=useMemo(()=>()=>setReady(true),[]);
 return <div className="magic-world magic-world-3d" data-renderer="threejs" data-ready={ready} data-testid="couple" data-x={props.position.x.toFixed(1)} data-y={props.position.y.toFixed(1)} aria-label={`Dunia 3D: ${chapters[props.scene].name}`}
  onPointerDownCapture={event=>{if(props.paused)return;gesture.current={x:event.clientX,y:event.clientY,lastX:event.clientX,lastY:event.clientY,dragged:false,active:true,id:event.pointerId};}}
  onPointerMoveCapture={event=>{const g=gesture.current;if(!g.active||g.id!==event.pointerId||props.paused)return;
   if(Math.hypot(event.clientX-g.x,event.clientY-g.y)>7)g.dragged=true;
   if(g.dragged&&!props.overview){props.cameraYaw.current-=(event.clientX-g.lastX)*.006;props.cameraPitch.current=MathUtils.clamp(props.cameraPitch.current+(event.clientY-g.lastY)*.004,-.04,.48);}
   g.lastX=event.clientX;g.lastY=event.clientY;
  }}
  onPointerUp={event=>{if(event.pointerId===gesture.current.id)gesture.current.active=false;}}
  onPointerCancel={()=>{gesture.current.active=false;gesture.current.dragged=true;}}
  onPointerLeave={()=>{gesture.current.active=false;}}
 >
  <WorldBoundary><Canvas shadows="percentage" dpr={[1,props.compact?1.25:1.5]} camera={{position:[-26,3.6,5],fov:60,near:.1,far:160}} gl={{antialias:true,powerPreference:'high-performance'}} fallback={<div className="magic-3d-fallback">Browser ini belum mendukung WebGL. Gunakan tombol misi untuk membaca undangan.</div>}>
   <Scenery scene={props.scene} reduced={props.reduced}/>
   <mesh rotation={[-Math.PI/2,0,0]} position={[0,.015,0]} visible onPointerUp={e=>{if(!props.paused&&!gesture.current.dragged){e.stopPropagation();props.onWalk(fromWorld(e.point.x,e.point.z));}}}><planeGeometry args={[52,25]}/><meshBasicMaterial transparent opacity={0} depthWrite={false}/></mesh>
   {chapters[props.scene].points.map((point,i)=><Beacon key={`${props.scene}-${i}`} point={point} found={props.visited.includes(props.scene*2+i)} onWalk={point=>{if(!gesture.current.dragged&&!props.paused)props.onWalk(point);}} reduced={props.reduced}/>)}
   <Player key={props.scene} position={props.position} moving={props.moving} reduced={props.reduced} cameraYaw={props.cameraYaw}/><FollowCamera position={props.position} reduced={props.reduced} overview={props.overview} scene={props.scene} cameraYaw={props.cameraYaw} cameraPitch={props.cameraPitch}/><Ready onReady={markReady}/><ArtFinish/>
  </Canvas></WorldBoundary>
 </div>;
}
