import { memo, useEffect, useMemo, useRef } from 'react';
import { BoxGeometry, Color, ExtrudeGeometry, InstancedMesh, Object3D, Shape } from 'three';
import { Box, Gem, Pole } from './Models3D';
import { PaintedMaterial } from './ArtMaterials';
type V3=[number,number,number];
function ArchedWindow({at}:{at:V3}) {
 const geometry=useMemo(()=>{const shape=new Shape();shape.moveTo(-.35,0);shape.lineTo(.35,0);shape.lineTo(.35,.85);shape.quadraticCurveTo(0,1.3,-.35,.85);shape.closePath();return new ExtrudeGeometry(shape,{depth:.08,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:.025,bevelThickness:.025});},[]);
 useEffect(()=>()=>geometry.dispose(),[geometry]);
 return <group position={at}><mesh geometry={geometry}><meshStandardMaterial color="#ffdca0" emissive="#f9b64f" emissiveIntensity={.65} roughness={.3}/></mesh><Box at={[0,.53,.1]} size={[.055,1.12,.06]} color="#5e5143"/><Box at={[0,.46,.1]} size={[.73,.045,.06]} color="#5e5143"/></group>;
}
function SlateRoof({purple}:{purple:boolean}) {
 const ref=useRef<InstancedMesh>(null);
 const geometry=useMemo(()=>new BoxGeometry(.62,.085,.76),[]);
 useEffect(()=>{
  if(!ref.current)return;
  const object=new Object3D();let i=0;
  for(const side of [-1,1])for(let row=0;row<6;row++)for(let col=0;col<8;col++){
   const x=side*(.24+row*.51);object.position.set(x,6.12-Math.abs(x)*.78,-2.4+col*.65);object.rotation.z=-side*Math.atan(.78);object.updateMatrix();ref.current.setMatrixAt(i,object.matrix);
   ref.current.setColorAt(i,new Color(purple?'#655d78':'#3a626b').multiplyScalar(.85+((row*7+col*3)%11)*.035));i++;
  }
  ref.current.instanceMatrix.needsUpdate=true;if(ref.current.instanceColor)ref.current.instanceColor.needsUpdate=true;ref.current.computeBoundingSphere();
 },[purple]);
 useEffect(()=>()=>geometry.dispose(),[geometry]);
 return <instancedMesh ref={ref} args={[geometry,undefined,96]} castShadow receiveShadow><meshStandardMaterial color="#fff" roughness={.88}/></instancedMesh>;
}
export const Cottage=memo(function Cottage({at,purple=false}:{at:V3;purple?:boolean}) {
 const roof=useMemo(()=>{const shape=new Shape();shape.moveTo(-2.6,3.8);shape.lineTo(0,5.95);shape.lineTo(2.6,3.8);shape.closePath();return new ExtrudeGeometry(shape,{depth:4.6,bevelEnabled:false});},[]);
 useEffect(()=>()=>roof.dispose(),[roof]);
 return <group position={at}>
  <Box at={[0,.2,0]} size={[5.7,.4,5]} color="#979b87"/><Box at={[0,2,0]} size={[5,3.7,4.4]} color="#c5b693"/>
  <mesh geometry={roof} position={[0,0,-2.3]} castShadow receiveShadow><PaintedMaterial color="#b7ad92" kind="plaster"/></mesh><SlateRoof purple={purple}/>
  {[-2.45,0,2.45].map(x=><Box key={x} at={[x,2,2.24]} size={[.13,3.6,.13]} color="#65513b"/>)}
  <Box at={[0,3.65,2.27]} size={[5,.14,.16]} color="#65513b"/><Box at={[0,1.2,2.27]} size={[5,.13,.16]} color="#65513b"/>
  {[-1.55,1.55].map(x=><ArchedWindow key={x} at={[x,1.6,2.27]}/>)}
  <Box at={[0,1.04,2.27]} size={[.94,2.06,.16]} color="#47574b"/>{[-.32,-.1,.1,.32].map(x=><Box key={x} at={[x,1.04,2.37]} size={[.012,1.93,.02]} color="#71816c"/>)}<Gem at={[.3,1.1,2.4]} size={[.045,.045,.04]} color="#d1b268"/>
  <ArchedWindow at={[-.0,4.05,2.34]}/>
  {[-1,1].map(side=><Box key={side} at={[side*1.17,4.88,2.4]} size={[3.2,.15,.16]} color="#64553e" rotation={[0,0,-side*.68]}/>)}
  <Box at={[1.5,5.7,-.9]} size={[.65,2,.72]} color="#8d8a78"/>{[0,1,2,3].map(i=><Box key={i} at={[1.5,5+i*.4,-.9]} size={[.72,.08,.79]} color="#a9a58e"/>)}
  {[-1.7,1.7].map(x=><group key={x} position={[x,0,2.85]}><Box at={[0,.65,0]} size={[1.15,.38,.7]} color="#756446"/>{[-.4,0,.4].map((a,i)=><group key={a}><Gem at={[a,.93,0]} size={[.3,.35,.3]} color="#5f8052"/><Gem at={[a,1.2,.07]} size={[.1,.12,.1]} color={i%2?'#d4bd80':'#b390b6'}/></group>)}</group>)}
  <Pole at={[-3,1.8,2.5]} height={3.6} radius={.08} color="#6d5d43"/><Box at={[-2.7,3.5,2.5]} size={[.7,.09,.1]} color="#6d5d43"/>
  <mesh position={[-2.5,3,2.5]} rotation={[0,0,.1]}><circleGeometry args={[.37,24]}/><PaintedMaterial color="#5b735b"/></mesh><Gem at={[-2.5,3,2.55]} size={[.1,.2,.06]} color="#d6bc7b"/>
 </group>;
});
