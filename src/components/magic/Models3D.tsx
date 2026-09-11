import { memo, useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, SphereGeometry } from 'three';
import { PaintedMaterial } from './ArtMaterials';
type V3 = [number, number, number];
export function Box({ at, size, color, rotation = [0,0,0] }: {at: V3; size: V3; color: string; rotation?: V3}) {
  return <mesh position={at} rotation={rotation} castShadow receiveShadow><boxGeometry args={size}/><PaintedMaterial color={color}/></mesh>;
}
export function Gem({ at, size = [1,1,1], color }: {at: V3; size?: V3; color: string}) {
  const geometry=useMemo(()=>{const g=new SphereGeometry(1,16,12),p=g.getAttribute('position');for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);const n=1+Math.sin(x*5+z*3)*Math.sin(y*4+z*5)*.09;p.setXYZ(i,x*n,y*n,z*n);}g.computeVertexNormals();return g;},[]);
  useEffect(()=>()=>geometry.dispose(),[geometry]);
  return <mesh position={at} scale={size} geometry={geometry} castShadow receiveShadow><PaintedMaterial color={color}/></mesh>;
}
export function Cone({ at, radius, height, color, sides = 16 }: {at:V3; radius:number; height:number; color:string; sides?:number}) {
  return <mesh position={at} castShadow receiveShadow><coneGeometry args={[radius,height,sides]}/><PaintedMaterial color={color}/></mesh>;
}
export function Pole({ at, radius = .12, height, color }: {at:V3; radius?:number; height:number; color:string}) {
  return <mesh position={at} castShadow receiveShadow><cylinderGeometry args={[radius*.8,radius,height,12]}/><PaintedMaterial color={color}/></mesh>;
}
function Tower({ at, height = 10 }: {at:V3;height?:number}) {
 return <group position={at}><Pole at={[0,height/2,0]} radius={1.4} height={height} color="#c4c5ad"/><Pole at={[0,height-.2,0]} radius={1.65} height={.5} color="#d7d4b5"/><Cone at={[0,height+2,0]} radius={1.9} height={4} color="#54738a"/><Pole at={[0,height+4.7,0]} height={1.5} radius={.06} color="#d3b674"/><Box at={[.5,height+4.9,0]} size={[1,.6,.06]} color="#ad6574"/>{[3,6,9].filter(y=>y<height).map(y=><mesh key={y} position={[0,y,1.32]}><boxGeometry args={[.45,1,.15]}/><meshStandardMaterial color="#ffe6a5" emissive="#f5b852" emissiveIntensity={.7}/></mesh>)}</group>;
}
export const Castle3D = memo(function Castle3D() {
 return <group position={[10,0,-21]}><Box at={[0,0,0]} size={[22,1,13]} color="#869995"/><Box at={[0,4.6,0]} size={[15,9,7]} color="#b5bba6"/><Box at={[0,10,-2]} size={[6,12,5]} color="#d0cdb0"/><Cone at={[0,17.5,-2]} radius={5} height={5} color="#526e85" sides={4}/>{[-8,8].map(x=><Tower key={x} at={[x,0,3]} height={11}/>)}{[-5,5].map(x=><Tower key={x} at={[x,0,-3]} height={14}/>)}<Box at={[0,2.2,3.56]} size={[3.5,4.4,.3]} color="#334b58"/><mesh position={[0,4.4,3.75]}><torusGeometry args={[1.75,.28,6,16,Math.PI]}/><meshToonMaterial color="#e7d9af"/></mesh>{[-5,-3,3,5].map(x=><Box key={x} at={[x,6.5,3.6]} size={[.65,1.9,.2]} color="#ffe1a0"/>)}{Array.from({length:13},(_,i)=><Box key={i} at={[-7.2+i*1.2,9.5,3.25]} size={[.65,1.2,.7]} color="#d2d1b5"/>)}<Box at={[0,.12,10]} size={[4.3,.3,12]} color="#c5bc99"/>{[-2.25,2.25].map(x=><group key={x}><Box at={[x,.9,10]} size={[.24,.3,12]} color="#d4cbab"/>{[5,8,11,14].map(z=><Pole key={z} at={[x,.6,z]} height={1.3} radius={.2} color="#b7b59e"/>)}</group>)}</group>;
});
export function Animal3D({at,kind='rabbit',phase=0,reduced=false}:{at:V3;kind?:'rabbit'|'deer'|'owl';phase?:number;reduced?:boolean}) {
 const ref=useRef<Group>(null);
 useFrame(({clock})=>{if(ref.current&&!reduced){ref.current.position.y=at[1]+(kind==='owl'?Math.sin(clock.elapsedTime*2+phase)*.08:Math.max(0,Math.sin(clock.elapsedTime*1.3+phase))*.12);ref.current.rotation.y=Math.sin(clock.elapsedTime*.4+phase)*.2;}});
 return <group ref={ref} position={at}>{kind==='deer'?<><Gem at={[0,1.25,0]} size={[.55,.65,1]} color="#addfd1"/><Gem at={[0,2,-.6]} size={[.3,.8,.35]} color="#bae6d9"/><Gem at={[0,2.7,-.9]} size={[.3,.35,.5]} color="#c4ead9"/>{[-.35,.35].flatMap(x=>[-.55,.55].map(z=><Pole key={`${x}${z}`} at={[x,.5,z]} radius={.07} height={1.2} color="#a2cfc4"/>))}{[-.25,.25].map(x=><group key={x} position={[x,3,-.9]} rotation={[0,0,-x]}><Pole at={[0,.4,0]} radius={.045} height={.9} color="#e5f6d8"/><Box at={[x,.5,0]} size={[.5,.07,.07]} color="#e5f6d8"/></group>)}</>:kind==='owl'?<><Gem at={[0,0,0]} size={[.45,.65,.4]} color="#cabd97"/><Gem at={[0,.4,.08]} size={[.46,.4,.35]} color="#eee3bf"/>{[-.18,.18].map(x=><group key={x}><Gem at={[x,.43,.37]} size={[.17,.18,.06]} color="#fff4cf"/><Gem at={[x,.43,.43]} size={[.07,.09,.025]} color="#38483e"/></group>)}<Cone at={[0,.21,.43]} radius={.08} height={.2} color="#d3a954"/></>:<><Gem at={[0,.3,0]} size={[.32,.3,.48]} color="#e7debf"/><Gem at={[0,.6,-.3]} size={[.24,.26,.25]} color="#f5eacb"/>{[-.13,.13].map(x=><Gem key={x} at={[x,.95,-.3]} size={[.08,.35,.1]} color="#d6bcb0"/>)}<Gem at={[0,.4,.45]} size={[.15,.15,.15]} color="#fff4d8"/><Gem at={[.17,.63,-.46]} size={[.035,.035,.035]} color="#37483d"/></>}</group>;
}
export function Lantern3D({ at }: {at:V3}) {
 return <group position={at}><Pole at={[0,1.6,0]} height={3.2} radius={.07} color="#5b6151"/><Box at={[.25,3.1,0]} size={[.6,.08,.08]} color="#5b6151"/><Box at={[.5,2.65,0]} size={[.5,.08,.5]} color="#756647"/><mesh position={[.5,2.9,0]}><boxGeometry args={[.35,.5,.35]}/><meshStandardMaterial color="#ffe4a0" emissive="#ffd07a" emissiveIntensity={1.3}/></mesh><Cone at={[.5,3.25,0]} radius={.4} height={.3} color="#6f7053" sides={4}/></group>;
}
