import { memo, useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { BufferAttribute, BufferGeometry, CatmullRomCurve3, Color, DoubleSide, InstancedMesh, Matrix4, MeshStandardMaterial, Object3D, PlaneGeometry, TubeGeometry, Vector3 } from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { PaintedMaterial, pigmentNoise } from './ArtMaterials';
import { seededRandom, terrainHeight, trailZ, treePlacements } from './landscape';

function leafGeometry() {
 const g=new BufferGeometry();
 g.setAttribute('position',new BufferAttribute(new Float32Array([0,0,0,-.14,.13,.03,-.2,.3,.06,-.13,.48,.025,0,.67,0,.13,.48,.025,.2,.3,.06,.14,.13,.03,0,.31,.1]),3));
 g.setIndex([0,1,8,1,2,8,2,3,8,3,4,8,4,5,8,5,6,8,6,7,8,7,0,8]);g.computeVertexNormals();return g;
}
export const ForestCanopy=memo(function ForestCanopy({scene,reduced}:{scene:number;reduced:boolean}) {
 const leaves=useRef<InstancedMesh>(null), time=useMemo(()=>({value:0}),[]);
 const data=useMemo(()=>{
  const branches:BufferGeometry[]=[],matrices:Matrix4[]=[],colors:Color[]=[];
  const object=new Object3D();
  for(const tree of treePlacements(scene)){
   const random=seededRandom(tree.seed), y=terrainHeight(tree.x,tree.z), height=7.5*tree.scale;
   const trunk=new CatmullRomCurve3([new Vector3(tree.x,y,tree.z),new Vector3(tree.x-.25,y+height*.3,tree.z+.3),new Vector3(tree.x+.3,y+height*.65,tree.z),new Vector3(tree.x+.1,y+height,tree.z-.3)]);
   // Taper each tube, retaining curved trunks and exposed roots.
   const stem=new TubeGeometry(trunk,10,.37*tree.scale,7,false);
   const pos=stem.getAttribute('position');
   for(let i=0;i<pos.count;i++){const t=Math.floor(i/8)/10,center=trunk.getPointAt(t);const taper=1-t*.86;pos.setXYZ(i,center.x+(pos.getX(i)-center.x)*taper,center.y+(pos.getY(i)-center.y)*taper,center.z+(pos.getZ(i)-center.z)*taper);}
   stem.computeVertexNormals();branches.push(stem);
   for(let b=0;b<7;b++){
    const angle=b*2.399+random(), spread=(1.7+random())*tree.scale;
    const end=new Vector3(tree.x+Math.cos(angle)*spread,y+height*(.7+random()*.35),tree.z+Math.sin(angle)*spread);
    const begin=new Vector3(tree.x,y+height*(.45+b*.025),tree.z);
    const middle=begin.clone().lerp(end,.55);middle.y-=.3;
    branches.push(new TubeGeometry(new CatmullRomCurve3([begin,middle,end]),5,.08*tree.scale,5,false));
    for(let l=0;l<105;l++){
     const theta=random()*Math.PI*2, vertical=random()*2-1, radius=Math.sqrt(1-vertical*vertical)*(1+random()*.3);
     object.position.set(end.x+Math.cos(theta)*radius*1.6*tree.scale,end.y+vertical*1.1*tree.scale,end.z+Math.sin(theta)*radius*1.5*tree.scale);
     object.rotation.set((random()-.5)*2.2,random()*Math.PI*2,(random()-.5)*Math.PI);
     const size=(.75+random()*.9)*tree.scale;object.scale.set(size,size,size);object.updateMatrix();matrices.push(object.matrix.clone());
     colors.push(new Color().setHSL(.22+random()*.08,.3+random()*.25,.22+random()*.18));
    }
   }
   for(let r=0;r<4;r++){
    const a=r*1.57+random();branches.push(new TubeGeometry(new CatmullRomCurve3([new Vector3(tree.x,y+.55,tree.z),new Vector3(tree.x+Math.cos(a)*.5,y+.1,tree.z+Math.sin(a)*.5),new Vector3(tree.x+Math.cos(a)*1.5,y,tree.z+Math.sin(a)*1.5)]),4,.14,5,false));
   }
  }
  const bark=mergeGeometries(branches);branches.forEach(g=>g.dispose());return {bark,matrices,colors,leaf:leafGeometry()};
 },[scene]);
 useEffect(()=>{
  if(!leaves.current)return;
  data.matrices.forEach((matrix,i)=>{leaves.current!.setMatrixAt(i,matrix);leaves.current!.setColorAt(i,data.colors[i]);});
  leaves.current.instanceMatrix.needsUpdate=true;if(leaves.current.instanceColor)leaves.current.instanceColor.needsUpdate=true;leaves.current.computeBoundingSphere();
 },[data]);
 useEffect(()=>()=>{data.bark?.dispose();data.leaf.dispose();},[data]);
 useFrame(({clock})=>{time.value=reduced?0:clock.elapsedTime;});
 const compile=useMemo(()=>((shader:Parameters<MeshStandardMaterial['onBeforeCompile']>[0])=>{
  shader.uniforms.windTime=time;shader.vertexShader='uniform float windTime;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
   vec3 center=instanceMatrix[3].xyz;
   transformed.x+=sin(windTime*1.1+center.x*.35+center.z*.23)*position.y*.18;
   transformed.z+=cos(windTime*.8+center.z*.5)*position.y*.12;`);
 }),[time]);
 return <>{data.bark&&<mesh geometry={data.bark} castShadow receiveShadow><PaintedMaterial color="#605443" kind="bark"/></mesh>}<instancedMesh ref={leaves} args={[data.leaf,undefined,data.matrices.length]} castShadow receiveShadow><meshStandardMaterial color="#ffffff" roughness={.85} side={DoubleSide} onBeforeCompile={compile} customProgramCacheKey={()=>'canopy-wind'} /></instancedMesh></>;
});
export const Meadow=memo(function Meadow({scene,reduced}:{scene:number;reduced:boolean}) {
 const ref=useRef<InstancedMesh>(null),time=useMemo(()=>({value:0}),[]);
 const data=useMemo(()=>{
  const random=seededRandom(827), matrices:Matrix4[]=[],colors:Color[]=[],object=new Object3D();
  for(let i=0;i<17000;i++){
   const x=-36+random()*80,z=-24+random()*48;
   if(Math.abs(z-trailZ(x))<1.65+random()*.4 || (scene===2&&z<-5&&x>-15&&x<35))continue;
   object.position.set(x,terrainHeight(x,z),z);object.rotation.set(0,random()*6.28,0);
   const h=.18+random()*.36;object.scale.set(.5+random()*.75,h*1.5,.5+random()*.5);object.updateMatrix();matrices.push(object.matrix.clone());
   colors.push(new Color().setHSL(.22+random()*.065,.4+random()*.22,.28+random()*.13));
  }
  const g=new BufferGeometry();g.setAttribute('position',new BufferAttribute(new Float32Array([-.045,0,0,.045,0,0,-.04,.3,.035,.04,.3,.035,-.015,.62,.1,.015,.62,.1,0,.85,.22]),3));g.setIndex([0,1,2,1,3,2,2,3,4,3,5,4,4,5,6]);g.computeVertexNormals();
  return {matrices,colors,geometry:g};
 },[scene]);
 useEffect(()=>{if(!ref.current)return;data.matrices.forEach((m,i)=>{ref.current!.setMatrixAt(i,m);ref.current!.setColorAt(i,data.colors[i]);});ref.current.instanceMatrix.needsUpdate=true;if(ref.current.instanceColor)ref.current.instanceColor.needsUpdate=true;ref.current.computeBoundingSphere();},[data]);
 useEffect(()=>()=>data.geometry.dispose(),[data]);
 useFrame(({clock})=>{time.value=reduced?0:clock.elapsedTime;});
 const compile=useMemo(()=>((shader:Parameters<MeshStandardMaterial['onBeforeCompile']>[0])=>{
  shader.uniforms.windTime=time;shader.vertexShader='uniform float windTime;\nvarying float grassHeight;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
   vec3 center=instanceMatrix[3].xyz;grassHeight=position.y;
   transformed.x+=sin(windTime*1.4+center.x*.7+center.z*.3)*position.y*position.y*.25;`);
  shader.fragmentShader='varying float grassHeight;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.rgb*=mix(.59,1.18,grassHeight);');
 }),[time]);
 return <instancedMesh ref={ref} args={[data.geometry,undefined,data.matrices.length]} receiveShadow><meshStandardMaterial roughness={1} side={DoubleSide} onBeforeCompile={compile} customProgramCacheKey={()=>'meadow-wind'}/></instancedMesh>;
});
export const Terrain=memo(function Terrain({scene}:{scene:number}) {
 const geometry=useMemo(()=>{const g=new PlaneGeometry(200,160,150,120);g.rotateX(-Math.PI/2);const p=g.getAttribute('position');for(let i=0;i<p.count;i++)p.setY(i,terrainHeight(p.getX(i),p.getZ(i))-.025);g.computeVertexNormals();return g;},[]);
 useEffect(()=>()=>geometry.dispose(),[geometry]);
 const compile=useMemo(()=>((shader:Parameters<MeshStandardMaterial['onBeforeCompile']>[0])=>{
  shader.vertexShader='varying vec3 terrainPosition;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nterrainPosition=position;');
  shader.fragmentShader='varying vec3 terrainPosition;\n'+pigmentNoise+'\n'+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
   vec3 p=terrainPosition;
   float grain=pigmentNoise(p*vec3(5.,1.,5.));float brush=pigmentNoise(p*.43);
   float pathZ=1.8-sin((p.x+14.)*.095)*3.;
   float edge=abs(p.z-pathZ)+pigmentNoise(p*2.)*.3;
   float path=1.-smoothstep(1.42,1.95,edge);
   vec3 grass=mix(vec3(.12,.20,.075),vec3(.29,.36,.13),brush);
   vec3 dirt=mix(vec3(.36,.29,.16),vec3(.57,.47,.29),brush);
   diffuseColor.rgb=mix(grass,dirt,path)*(.88+grain*.22);
  `);
 }),[]);
 return <mesh geometry={geometry} receiveShadow><meshStandardMaterial color="#ffffff" roughness={1} onBeforeCompile={compile} customProgramCacheKey={()=>`terrain-${scene}`}/></mesh>;
});

export const Understory=memo(function Understory() {
 const ferns=useRef<InstancedMesh>(null),flowers=useRef<InstancedMesh>(null);
 const data=useMemo(()=>{
  const random=seededRandom(712),object=new Object3D(),matrices:Matrix4[]=[],blooms:Matrix4[]=[],colors:Color[]=[];
  const vertices:number[]=[],indices:number[]=[];
  // A fern is authored as eight curved fronds, each with paired pointed leaflets.
  for(let f=0;f<8;f++){
   const angle=f*Math.PI/4;
   for(let l=0;l<6;l++)for(const side of [-1,1]){
    const t=(l+1)/7,r=t*.75,y=Math.sin(t*Math.PI)*.28+.04,w=(1-t)*.19;
    const cx=Math.sin(angle)*r,cz=Math.cos(angle)*r,offset=vertices.length/3;
    vertices.push(cx,y,cz,cx+Math.cos(angle)*side*w-Math.sin(angle)*.1,y+.025,cz-Math.sin(angle)*side*w-Math.cos(angle)*.1,cx+Math.sin(angle)*.11,y+.045,cz+Math.cos(angle)*.11);
    indices.push(offset,offset+1,offset+2);
   }
  }
  const fern=new BufferGeometry();fern.setAttribute('position',new BufferAttribute(new Float32Array(vertices),3));fern.setIndex(indices);fern.computeVertexNormals();
  for(let i=0;i<100;i++){
   const x=-29+random()*67,z=trailZ(x)+(i%2?1:-1)*(2.2+random()*2.5);
   object.position.set(x,0,z);object.rotation.set(0,random()*6.28,0);object.scale.setScalar(.6+random()*.8);object.updateMatrix();matrices.push(object.matrix.clone());
   for(let n=0;n<3;n++){
    object.position.set(x+(random()-.5)*1.2,.25+random()*.2,z+(random()-.5)*.8);object.scale.setScalar(.055+random()*.05);object.updateMatrix();blooms.push(object.matrix.clone());
    colors.push(new Color(['#d9cda2','#a999bb','#d3c8df','#f0d8ab'][i%4]));
   }
  }
  return {fern,matrices,blooms,colors};
 },[]);
 useEffect(()=>{
  data.matrices.forEach((m,i)=>ferns.current?.setMatrixAt(i,m));data.blooms.forEach((m,i)=>{flowers.current?.setMatrixAt(i,m);flowers.current?.setColorAt(i,data.colors[i]);});
  if(ferns.current){ferns.current.instanceMatrix.needsUpdate=true;ferns.current.computeBoundingSphere();}
  if(flowers.current){flowers.current.instanceMatrix.needsUpdate=true;if(flowers.current.instanceColor)flowers.current.instanceColor.needsUpdate=true;flowers.current.computeBoundingSphere();}
 },[data]);
 useEffect(()=>()=>data.fern.dispose(),[data]);
 return <><instancedMesh ref={ferns} args={[data.fern,undefined,data.matrices.length]} receiveShadow><meshStandardMaterial color="#548649" roughness={1} side={DoubleSide}/></instancedMesh><instancedMesh ref={flowers} args={[undefined,undefined,data.blooms.length]}><sphereGeometry args={[1,6,4]}/><meshStandardMaterial roughness={.9}/></instancedMesh></>;
});
