import { memo, useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { BufferAttribute, BufferGeometry, CatmullRomCurve3, Color, DoubleSide, Group, Mesh, Shape, ShapeGeometry, SphereGeometry, TubeGeometry, Vector3 } from 'three';
import { PaintedMaterial } from './ArtMaterials';
type V3=[number,number,number];
function garment(profile:[number,number][], pleats=.02, depth=.72, opening=0) {
 const vertices:number[]=[],indices:number[]=[],segments=40;
 profile.forEach(([y,r],row)=>{for(let i=0;i<=segments;i++){const a=opening+i/segments*(Math.PI*2-opening*2);const fold=Math.cos(a*12)*pleats*(1-row/profile.length);vertices.push(Math.sin(a)*(r+fold),y,Math.cos(a)*(r+fold)*depth);if(row<profile.length-1&&i<segments){const n=row*(segments+1)+i;indices.push(n,n+1,n+segments+1,n+1,n+segments+2,n+segments+1);}}});
 const geometry=new BufferGeometry();geometry.setAttribute('position',new BufferAttribute(new Float32Array(vertices),3));geometry.setIndex(indices);geometry.computeVertexNormals();return geometry;
}
function fabric(width:number,length:number,veil=false) {
 const vertices:number[]=[],indices:number[]=[],cols=18,rows=24;
 for(let r=0;r<=rows;r++)for(let c=0;c<=cols;c++){
  const u=c/cols*2-1,v=r/rows;
  vertices.push(u*width*(.65+v*.35),-v*length,Math.cos(u*6)*v*.055-v*v*(veil?.48:.25));
  if(r<rows&&c<cols){const n=r*(cols+1)+c;indices.push(n,n+cols+1,n+1,n+1,n+cols+1,n+cols+2);}
 }
 const geometry=new BufferGeometry();geometry.setAttribute('position',new BufferAttribute(new Float32Array(vertices),3));geometry.setIndex(indices);geometry.computeVertexNormals();return geometry;
}
// Separate quads keep the paired gold stripes crisp across the draped cloth.
function stripedScarf(length:number) {
 const vertices:number[]=[],colors:number[]=[],indices:number[]=[];
 const red=new Color('#791b29'),gold=new Color('#d9a640'),rows=120;
 for(let row=0;row<rows;row++) {
  const band=row%24,color=band===13||band===14||band===18||band===19?gold:red;
  for(const [side,r] of [[-1,row],[1,row],[-1,row+1],[1,row+1]]) {
   const v=r/rows;
   vertices.push(side*.083,-v*length,Math.sin(v*Math.PI)*.055+v*v*.055);
   colors.push(color.r,color.g,color.b);
  }
  const n=row*4;indices.push(n,n+2,n+1,n+1,n+2,n+3);
 }
 const geometry=new BufferGeometry();
 geometry.setAttribute('position',new BufferAttribute(new Float32Array(vertices),3));
 geometry.setAttribute('color',new BufferAttribute(new Float32Array(colors),3));
 geometry.setIndex(indices);geometry.computeVertexNormals();return geometry;
}
function CollarPiece({side}:{side:number}) {
 const geometry=useMemo(()=>{
  const g=new BufferGeometry();
  g.setAttribute('position',new BufferAttribute(new Float32Array([side*.025,2.49,.145,side*.18,2.43,.155,side*.1,2.25,.244]),3));
  g.computeVertexNormals();return g;
 },[side]);
 useEffect(()=>()=>geometry.dispose(),[geometry]);
 return <mesh geometry={geometry} castShadow><PaintedMaterial color="#eee6d5" kind="cloth"/></mesh>;
}
function Ellipsoid({at,size,color,metal=false}:{at:V3;size:V3;color:string;metal?:boolean}) {
 return <mesh position={at} scale={size} castShadow><sphereGeometry args={[1,16,12]}/><meshStandardMaterial color={color} roughness={metal?.35:.8} metalness={metal?.65:0}/></mesh>;
}
function Limb({at,length,radius,color}:{at:V3;length:number;radius:number;color:string}) {
 return <mesh position={at} castShadow><capsuleGeometry args={[radius,length,4,12]}/><PaintedMaterial color={color} kind="cloth"/></mesh>;
}
function Strand({points,radius,color}:{points:V3[];radius:number;color:string}) {
 const geometry=useMemo(()=>new TubeGeometry(new CatmullRomCurve3(points.map(p=>new Vector3(...p))),12,radius,6,false),[points,radius]);
 useEffect(()=>()=>geometry.dispose(),[geometry]);return <mesh geometry={geometry} castShadow><meshStandardMaterial color={color} roughness={.72}/></mesh>;
}
function HairLock({points,radius,color}:{points:V3[];radius:number;color:string}) {
 const geometry=useMemo(()=>{
  const curve=new CatmullRomCurve3(points.map(p=>new Vector3(...p)));
  const g=new TubeGeometry(curve,16,radius,6,false),positions=g.getAttribute('position');
  for(let ring=0;ring<=16;ring++) {
   const center=curve.getPointAt(ring/16),taper=Math.max(.035,Math.pow(1-ring/16,.65));
   for(let edge=0;edge<=6;edge++) {
    const i=ring*7+edge;
    positions.setXYZ(i,center.x+(positions.getX(i)-center.x)*taper,center.y+(positions.getY(i)-center.y)*taper,center.z+(positions.getZ(i)-center.z)*taper);
   }
  }
  g.computeVertexNormals();return g;
 },[points,radius]);
 useEffect(()=>()=>geometry.dispose(),[geometry]);
 return <mesh geometry={geometry} castShadow><meshStandardMaterial color={color} roughness={.94}/></mesh>;
}
const BrideWizard=memo(function BrideWizard({bride=false,moving,reduced}:{bride?:boolean;moving:boolean;reduced:boolean}) {
 const body=useRef<Group>(null),legs=useRef<Group>(null),arms=useRef<Group>(null),cape=useRef<Mesh>(null),scarf=useRef<Group>(null);
 const phase=useRef(0);
 const shapes=useMemo(()=>({
  robe:garment([[bride?.52:.23,.55],[.7,.5],[1,.4],[1.35,.3],[1.6,.28],[1.9,.34],[2.18,.4],[2.38,.33],[2.45,.18]],.035,.72,bride?0:.48),
  shirt:garment([[bride?1.15:1.4,.29],[1.6,.27],[2,.31],[2.3,.28],[2.45,.15]],.01),
  cape:fabric(.52,bride?1.63:2.05),veil:fabric(.45,1.3,true),
  scarfLong:stripedScarf(1.91),scarfShort:stripedScarf(1.68),
  sleeve:garment([[-.43,.205],[-.3,.18],[0,.12]],.012,.85),
 }),[bride]);
 useEffect(()=>()=>Object.values(shapes).forEach(g=>g.dispose()),[shapes]);
 useFrame((_,dt)=>{
  phase.current+=Math.min(dt,.05)*(moving?9:1.6);
  const t=phase.current,w=moving?1:0;
  if(body.current)body.current.position.y=reduced?0:Math.sin(t*2)*.024*w;
  legs.current?.children.forEach((leg,i)=>{leg.rotation.x=Math.sin(t+i*Math.PI)*.43*w;const shin=leg.children[1];if(shin)shin.rotation.x=Math.max(0,-Math.sin(t+i*Math.PI))*.52*w;});
  arms.current?.children.forEach((arm,i)=>{arm.rotation.x=Math.sin(t+i*Math.PI+Math.PI)*.28*w;arm.rotation.z=(i?-.1:.1);});
  if(cape.current){cape.current.rotation.x=reduced?0:(Math.sin(t*.65)*.035-.07)*(.4+w);cape.current.rotation.z=reduced?0:Math.sin(t*.4)*.028;}
  if(scarf.current)scarf.current.rotation.x=reduced?0:.03+Math.sin(t)*.04*w;
 });
 const robe=bride?'#f4ead2':'#17191e',lining=bride?'#e5d9b6':'#741e2a',hair=bride?'#614530':'#281d18';
 return <group ref={body}>
  <group ref={legs}>{[-.17,.17].map(x=><group key={x} position={[x,1.27,0]}>
   <Limb at={[0,-.26,0]} length={.36} radius={.105} color={bride?'#aa9a7d':'#3b4040'}/>
   <group position={[0,-.57,0]}><Limb at={[0,-.2,0]} length={.32} radius={.095} color={bride?"#4b3c30":"#363439"}/><Ellipsoid at={[0,-.53,.075]} size={[.14,.115,.26]} color="#3a2e28"/><mesh position={[0,-.55,.07]}><boxGeometry args={[.24,.07,.43]}/><meshStandardMaterial color="#292721"/></mesh></group>
  </group>)}</group>
  {!bride&&<Ellipsoid at={[0,1.3,0]} size={[.29,.26,.205]} color="#363439"/>}
  <mesh geometry={shapes.robe} castShadow receiveShadow><PaintedMaterial color={robe} kind="cloth"/></mesh>
  <mesh geometry={shapes.shirt} position={[0,0,.03]} castShadow><PaintedMaterial color={bride?'#efe8cf':'#686368'} kind="cloth"/></mesh>
  <mesh ref={cape} geometry={shapes.cape} position={[0,2.34,-.26]} castShadow><PaintedMaterial color={bride?lining:robe} kind="cloth"/></mesh>
  {/* Embroidered robe edges and sculpted collar, visible from both sides. */}
  {[-1,1].map(side=><group key={side}>
   <Strand points={[[side*.17,2.38,.2],[side*.28,2.08,.27],[side*.21,1.72,.24],[side*(bride?.3:.21),1.1,.28],[side*(bride?.45:.255),bride?.56:.24,bride?.32:.35]]} radius={bride?.018:.028} color={bride?"#b59d62":lining}/>
   <mesh position={[side*.22,2.29,.16]} rotation={[0,0,side*.38]} castShadow><capsuleGeometry args={[.06,.33,3,8]}/><PaintedMaterial color={lining} kind="cloth"/></mesh>
  </group>)}
  {!bride&&<>
   {/* The lowered hood makes the burgundy lining visible from the follow camera. */}
   <Ellipsoid at={[0,2.25,-.285]} size={[.3,.25,.12]} color={lining}/>
   <Strand points={[[-.28,2.4,-.1],[-.25,2.24,-.35],[0,2.05,-.38],[.25,2.24,-.35],[.28,2.4,-.1]]} radius={.055} color={lining}/>
   <mesh position={[0,2.36,.19]}><boxGeometry args={[.18,.19,.04]}/><PaintedMaterial color="#eee6d5" kind="cloth"/></mesh>
   {[-1,1].map(side=><CollarPiece key={side} side={side}/>)}
   <Strand points={[[-.17,2.32,.218],[0,2.08,.26],[.17,2.32,.218]]} radius={.017} color="#39363a"/>
   <mesh position={[0,2.31,.248]} rotation={[0,0,Math.PI/4]}><boxGeometry args={[.064,.064,.032]}/><PaintedMaterial color={lining} kind="cloth"/></mesh>
   <mesh position={[0,2.19,.254]}><boxGeometry args={[.067,.2,.026]}/><PaintedMaterial color={lining} kind="cloth"/></mesh>
   {[2.13,2.2,2.27].map(y=><mesh key={y} position={[0,y,.27]} rotation={[0,0,-.45]}><boxGeometry args={[.07,.016,.005]}/><PaintedMaterial color="#c49b4d" kind="cloth"/></mesh>)}
  </>}
  <Limb at={[0,2.5,0]} length={.17} radius={bride?.12:.087} color="#d4ac8e"/>
  {bride?<>
  <Ellipsoid at={[0,2.85,0]} size={[.265,.34,.25]} color="#e0b99a"/>
  {[-.26,.26].map(x=><Ellipsoid key={x} at={[x,2.83,.01]} size={[.047,.085,.05]} color="#d0a383"/>)}
  <Ellipsoid at={[0,2.82,.245]} size={[.035,.068,.053]} color="#d7a98a"/>
  {[-.095,.095].map(x=><group key={x}><Ellipsoid at={[x,2.9,.233]} size={[.055,.036,.013]} color="#ece8d9"/><Ellipsoid at={[x,2.9,.245]} size={[.022,.029,.008]} color="#354b42"/><Strand points={[[x-.04,2.962,.22],[x,2.973,.234],[x+.045,2.96,.224]]} radius={.012} color={hair}/></group>)}
  <Strand points={[[-.054,2.716,.218],[0,2.706,.227],[.055,2.719,.217]]} radius={.009} color="#ae7667"/>
  <Ellipsoid at={[0,3.015,-.055]} size={[.286,.215,.266]} color={hair}/>
  {Array.from({length:9},(_,i)=>{const x=-.24+i*.06;return <Strand key={i} points={[[x,2.88,-.23],[x*.98,3.15,-.16],[x*.8-.04,3.22,.025],[x*.72-.08,3.07,.2]]} radius={.038} color={i%3===0?'#89633d':hair}/>;})}
   <Ellipsoid at={[0,2.82,-.21]} size={[.27,.3,.13]} color={hair}/>
   {Array.from({length:7},(_,i)=><Ellipsoid key={i} at={[Math.sin(i*2.6)*.048,2.68-i*.095,-.285]} size={[.07-i*.004,.072,.055]} color={i%2?'#795337':'#62442e'}/>)}
   <mesh geometry={shapes.veil} position={[0,3.05,-.27]}><meshStandardMaterial color="#f2ead3" transparent opacity={.38} roughness={1} side={2} depthWrite={false}/></mesh>
   <mesh position={[0,3.085,0]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[.26,.017,6,24]}/><meshStandardMaterial color="#d4ac50" metalness={.65} roughness={.3}/></mesh>
   {[-.2,-.1,0,.1,.2].map((x,i)=><group key={x} position={[x,3.09+Math.sin(i)*.018,.19]}><Ellipsoid at={[0,0,0]} size={[.038,.04,.023]} color="#faf0d7"/><Ellipsoid at={[.026,-.018,0]} size={[.04,.021,.014]} color="#84976b"/></group>)}
  </>:null}
  {bride?<>
  <mesh position={[0,2.45,.015]} rotation={[Math.PI/2,0,0]} castShadow><torusGeometry args={[.175,.075,8,24]}/><PaintedMaterial color="#833e35" kind="cloth"/></mesh>
  <group ref={scarf} position={[.1,2.36,.25]}><mesh position={[0,-.33,0]}><boxGeometry args={[.145,.69,.055]}/><PaintedMaterial color="#833e35" kind="cloth"/></mesh>{[.12,.28,.44,.6].map(y=><mesh key={y} position={[0,-y,.032]}><boxGeometry args={[.15,.042,.01]}/><PaintedMaterial color="#c49b4d" kind="cloth"/></mesh>)}</group>
  </>:<>
   <Strand points={[[-.22,2.31,.21],[-.27,2.4,0],[0,2.46,-.19],[.27,2.4,0],[.22,2.31,.21]]} radius={.073} color={lining}/>
   <group ref={scarf} position={[0,2.32,.29]}>{[-1,1].map(side=><group key={side} position={[side*.235,0,0]} rotation={[0,0,side*.025]}>
    <mesh geometry={side<0?shapes.scarfLong:shapes.scarfShort} castShadow><meshStandardMaterial vertexColors roughness={1} side={DoubleSide}/></mesh>
    {Array.from({length:7},(_,i)=><Strand key={i} points={[[i*.023-.069,side<0?-1.91:-1.68,.055],[i*.023-.069,side<0?-1.99:-1.76,.06]]} radius={.006} color="#c49b4d"/>)}
   </group>)}</group>
  </>}
  <group ref={arms}>{[-1,1].map(side=><group key={side} position={[side*.37,2.23,0]}>
   <Limb at={[side*.07,-.25,0]} length={.3} radius={.125} color={robe}/>
   <group position={[side*.1,-.54,0]} rotation={[side===1?(bride?-.25:-1.05):-.08,0,0]}>
    {bride?<Limb at={[0,-.2,0]} length={.26} radius={.105} color={robe}/>:<mesh geometry={shapes.sleeve} castShadow><PaintedMaterial color={robe} kind="cloth"/></mesh>}
    <mesh position={[0,-.37,0]}><cylinderGeometry args={[.11,.11,.045,12]}/><meshStandardMaterial color={bride?"#b59d62":lining} metalness={bride?.3:0}/></mesh>
    <Ellipsoid at={[0,-.49,0]} size={[.09,.13,.075]} color="#d8ad8d"/>
    {side===1&&<group position={[0,-.48,.02]} rotation={[bride?1.22:.62,0,-.12]}><mesh position={[0,.36,0]}><cylinderGeometry args={[.012,.026,.78,8]}/><PaintedMaterial color="#6c4729" kind="bark"/></mesh><mesh position={[0,.77,0]}><sphereGeometry args={[.035,10,8]}/><meshStandardMaterial color="#fff1bb" emissive="#ffe8a2" emissiveIntensity={3}/></mesh></group>}
   </group>
  </group>)}</group>
  {!bride&&<group position={[-.335,2.04,.254]} rotation={[0,-.2,-.1]}>
   <mesh><circleGeometry args={[.093,5]}/><meshStandardMaterial color="#c6a052" roughness={.7}/></mesh>
   <mesh position={[0,0,.003]}><circleGeometry args={[.076,5]}/><PaintedMaterial color={lining} kind="cloth"/></mesh>
   <Strand points={[[-.024,-.037,.009],[.022,-.01,.009],[-.013,.016,.009],[.013,.041,.009]]} radius={.012} color="#dfb956"/>
  </group>}
  {bride&&<mesh position={[-.22,2.08,.267]} rotation={[0,0,-.12]}><circleGeometry args={[.07,5]}/><meshStandardMaterial color="#b79b58" metalness={.3}/></mesh>}
 </group>;
});

function tailoredGarment(profile:[number,number][],pleats=.008,depth=.72,opening=0) {
 const curve=new CatmullRomCurve3(profile.map(([y,r])=>new Vector3(r,y,0)));
 const rings=Array.from({length:65},(_,i)=>{const p=curve.getPoint(i/64);return [p.y,Math.max(0,p.x)] as [number,number];});
 return garment(rings,pleats,depth,opening);
}
function chibiFace() {
 const geometry=new SphereGeometry(1,48,40),positions=geometry.getAttribute('position');
 for(let i=0;i<positions.count;i++) {
  const y=positions.getY(i),jaw=y<0?1+y*.19:1;
  positions.setXYZ(i,positions.getX(i)*.465*jaw,y*.43,positions.getZ(i)*.378);
 }
 geometry.computeVertexNormals();return geometry;
}
// Domed ribbons create overlapping locks with wide roots and fine curved tips.
function HairClump({points,width,color='#25272b'}:{points:V3[];width:number;color?:string}) {
 const geometry=useMemo(()=>{
  const curve=new CatmullRomCurve3(points.map(p=>new Vector3(...p)));
  const positions:number[]=[],indices:number[]=[],rows=28,cols=10;
  for(let r=0;r<=rows;r++) {
   const t=r/rows,center=curve.getPoint(t),tangent=curve.getTangent(t);
   const across=new Vector3(tangent.y,-tangent.x,0).normalize();
   const taper=Math.max(.005,Math.pow(Math.sin(Math.PI*(.12+t*.88)),.7));
   for(let c=0;c<=cols;c++) {
    const u=c/cols*2-1,p=center.clone().addScaledVector(across,u*width*taper);
    p.z+=Math.cos(u*Math.PI/2)*width*.3*taper;
    positions.push(p.x,p.y,p.z);
    if(r<rows&&c<cols){const n=r*(cols+1)+c;indices.push(n,n+cols+1,n+1,n+1,n+cols+1,n+cols+2);}
   }
  }
  const g=new BufferGeometry();g.setAttribute('position',new BufferAttribute(new Float32Array(positions),3));g.setIndex(indices);g.computeVertexNormals();return g;
 },[points,width]);
 useEffect(()=>()=>geometry.dispose(),[geometry]);
 return <mesh geometry={geometry} castShadow><meshStandardMaterial color={color} roughness={.58} side={DoubleSide}/></mesh>;
}
function ChibiHair() {
 return <group>
  <mesh position={[0,2.418,-.035]} scale={[.493,.37,.404]} castShadow><sphereGeometry args={[1,40,32]}/><meshStandardMaterial color="#202227" roughness={.72}/></mesh>
  <mesh position={[0,2.28,-.191]} scale={[.469,.328,.258]} castShadow><sphereGeometry args={[1,40,32]}/><meshStandardMaterial color="#202227" roughness={.72}/></mesh>
  {/* Back and side layers retain the shaggy silhouette from every camera angle. */}
  {[0,1,2,3,4,5,6].map(i=><group key={i} rotation={[0,Math.PI*.43+i*Math.PI*.19,0]}>
   <HairClump points={[[.02,2.733,.02],[.13,2.67,.272],[.195,2.38,.39],[.15,2.06,.3]]} width={.14} color={i%2?'#292b30':'#23252a'}/>
  </group>)}
  <HairClump points={[[.04,2.746,.025],[-.22,2.7,.26],[-.443,2.39,.279],[-.39,2.078,.235]]} width={.117} color="#23252a"/>
  <HairClump points={[[.075,2.75,.043],[-.095,2.672,.335],[-.278,2.411,.392],[-.266,2.05,.3]]} width={.13} color="#292b30"/>
  <HairClump points={[[.09,2.758,.07],[.047,2.603,.398],[-.048,2.35,.419],[-.13,2.076,.377]]} width={.123} color="#23252a"/>
  <HairClump points={[[.105,2.751,.065],[.253,2.602,.342],[.223,2.358,.421],[.009,2.025,.391]]} width={.119} color="#202227"/>
  <HairClump points={[[.105,2.759,.038],[.351,2.652,.243],[.407,2.345,.294],[.29,2.096,.285]]} width={.12} color="#282a2f"/>
  <HairClump points={[[.077,2.757,.061],[.221,2.685,.328],[.142,2.481,.437],[.029,2.367,.427]]} width={.074} color="#35373a"/>
  <HairClump points={[[.08,2.751,.047],[-.077,2.735,.239],[-.204,2.57,.39],[-.173,2.385,.424]]} width={.055} color="#34363a"/>
  <HairClump points={[[-.015,2.74,.003],[-.177,2.797,.025],[-.324,2.736,.044],[-.424,2.672,.017]]} width={.029} color="#36383b"/>
  <HairClump points={[[.044,2.747,-.015],[.154,2.815,.005],[.304,2.784,.004],[.35,2.734,-.003]]} width={.026} color="#292b30"/>
 </group>;
}
function ChibiEye({side}:{side:number}) {
 const geometry=useMemo(()=>{
  const shape=new Shape();shape.moveTo(-.072,.026);shape.quadraticCurveTo(0,.035,.072,.027);shape.quadraticCurveTo(.067,-.065,0,-.065);shape.quadraticCurveTo(-.065,-.065,-.072,.026);
  return new ShapeGeometry(shape,24);
 },[]);
 useEffect(()=>()=>geometry.dispose(),[geometry]);
 return <group position={[side*.157,2.085,.356]}>
  <mesh geometry={geometry}><meshStandardMaterial color="#eee6e0" roughness={.9} side={DoubleSide}/></mesh>
  <Ellipsoid at={[0,-.016,.009]} size={[.042,.046,.01]} color="#665f66"/>
  <Ellipsoid at={[0,-.012,.019]} size={[.022,.031,.004]} color="#302e37"/>
  <Ellipsoid at={[-.012,.005,.024]} size={[.009,.01,.003]} color="#fbf5ee"/>
  <Strand points={[[-.073,.028,.013],[0,.035,.018],[.073,.029,.013]]} radius={.007} color="#493431"/>
 </group>;
}

// Three-head-tall proportions, simple facial features, and rounded limbs.
function ChibiWizard({moving,reduced}:{moving:boolean;reduced:boolean}) {
 const body=useRef<Group>(null),legs=useRef<Group>(null),arms=useRef<Group>(null),scarf=useRef<Group>(null);
 const phase=useRef(0);
 const shapes=useMemo(()=>({
  face:chibiFace(),
  robe:tailoredGarment([[.3,.36],[.45,.365],[.85,.3],[1.15,.285],[1.43,.32],[1.61,.32],[1.73,.15]],.009,.77,.53),
  sweater:tailoredGarment([[.7,.225],[1.05,.24],[1.4,.26],[1.63,.22],[1.74,.1]],.004,.8),
  scarfLong:stripedScarf(1.18),scarfShort:stripedScarf(1.04),
 }),[]);
 useEffect(()=>()=>Object.values(shapes).forEach(g=>g.dispose()),[shapes]);
 useFrame((_,dt)=>{
  phase.current+=Math.min(dt,.05)*(moving?9:1.6);
  const t=phase.current,w=moving&&!reduced?1:0;
  if(body.current){body.current.position.y=Math.sin(t*2)*.025*w;body.current.rotation.z=Math.sin(t)*.022*w;}
  legs.current?.children.forEach((leg,i)=>{leg.rotation.x=Math.sin(t+i*Math.PI)*.42*w;});
  arms.current?.children.forEach((arm,i)=>{arm.rotation.x=Math.sin(t+i*Math.PI+Math.PI)*.22*w;});
  if(scarf.current)scarf.current.rotation.x=Math.sin(t)*.05*w;
 });
 return <group scale={1.1}><group ref={body}>
  <group ref={legs}>{[-1,1].map(side=><group key={side} position={[side*.145,.65,0]}>
   <Limb at={[0,-.22,0]} length={.27} radius={.088} color="#39363c"/>
   <Ellipsoid at={[0,-.54,.065]} size={[.119,.105,.178]} color="#302826"/>
  </group>)}</group>
  <mesh geometry={shapes.sweater} position={[0,0,.025]} castShadow><PaintedMaterial color="#757074" kind="cloth"/></mesh>
  <mesh geometry={shapes.robe} castShadow><PaintedMaterial color="#252631" kind="cloth"/></mesh>
  {[-1,1].map(side=><Strand key={side} points={[[side*.13,1.72,.13],[side*.177,1.5,.208],[side*.154,1.04,.207],[side*.189,.31,.246]]} radius={.018} color="#851f35"/>)}
  <Limb at={[0,1.76,0]} length={.1} radius={.09} color="#ebc1a1"/>
  <mesh geometry={shapes.face} position={[0,2.13,0]} castShadow><meshStandardMaterial color="#efc5ad" roughness={.86}/></mesh>
  {[-1,1].map(side=><group key={side}>
   <Ellipsoid at={[side*.443,2.1,0]} size={[.045,.077,.048]} color="#e6b292"/>
   <ChibiEye side={side}/>
   <mesh position={[side*.16,2.106,.392]}><torusGeometry args={[.111,.009,8,40]}/><meshStandardMaterial color="#44332b" roughness={.5} metalness={.3}/></mesh>
   <Strand points={[[side*.27,2.12,.39],[side*.391,2.147,.22],[side*.439,2.13,.02]]} radius={.008} color="#44332b"/>
   <Strand points={[[side*.105,2.256,.322],[side*.163,2.274,.329],[side*.213,2.255,.305]]} radius={.008} color="#353034"/>
   <mesh position={[side*.269,1.997,.278]} rotation={[0,side*.48,0]} scale={[.06,.029,.008]}><sphereGeometry args={[1,24,16]}/><meshStandardMaterial color="#dfa297" roughness={1}/></mesh>
  </group>)}
  <Strand points={[[-.048,2.12,.398],[0,2.139,.411],[.048,2.12,.398]]} radius={.008} color="#44332b"/>
  <Ellipsoid at={[0,2.018,.371]} size={[.02,.022,.02]} color="#e4ad8d"/>
  <Strand points={[[-.025,1.932,.327],[0,1.935,.336],[.026,1.935,.326]]} radius={.005} color="#a7766a"/>
  <ChibiHair/>
  <mesh position={[0,1.658,.214]} rotation={[0,0,Math.PI/4]}><boxGeometry args={[.075,.075,.03]}/><PaintedMaterial color="#f3e6d0" kind="cloth"/></mesh>
  <mesh position={[0,1.596,.244]} rotation={[0,0,Math.PI/4]}><boxGeometry args={[.047,.047,.025]}/><PaintedMaterial color="#892338" kind="cloth"/></mesh>
  <mesh position={[0,1.506,.244]}><boxGeometry args={[.048,.15,.025]}/><PaintedMaterial color="#892338" kind="cloth"/></mesh>
  {[1.47,1.53].map(y=><mesh key={y} position={[0,y,.26]} rotation={[0,0,-.45]}><boxGeometry args={[.048,.016,.005]}/><PaintedMaterial color="#d2a343" kind="cloth"/></mesh>)}
  <Ellipsoid at={[0,1.54,-.245]} size={[.258,.188,.09]} color="#892338"/>
  <Strand points={[[-.18,1.72,.14],[-.25,1.66,-.07],[0,1.38,-.331],[.25,1.66,-.07],[.18,1.72,.14]]} radius={.046} color="#892338"/>
  <group ref={scarf} position={[0,1.64,.257]}>{[-1,1].map(side=><group key={side} position={[side*.187,0,0]} rotation={[0,0,side*.025]}>
   <mesh geometry={side<0?shapes.scarfLong:shapes.scarfShort} castShadow><meshStandardMaterial vertexColors roughness={1} side={DoubleSide}/></mesh>
   {Array.from({length:5},(_,i)=><Strand key={i} points={[[i*.032-.064,side<0?-1.18:-1.04,.055],[i*.032-.064,side<0?-1.23:-1.09,.06]]} radius={.005} color="#cfa14a"/>)}
  </group>)}</group>
  <group ref={arms}>{[-1,1].map(side=><group key={side} position={[side*.325,1.53,0]} rotation={[0,0,side*.18]}>
   <Limb at={[0,-.16,0]} length={.19} radius={.119} color="#252631"/>
   <group position={[0,-.32,0]} rotation={[side===1?-.72:-.12,0,0]}>
    <Limb at={[0,-.11,0]} length={.16} radius={.108} color="#252631"/>
    <Ellipsoid at={[0,-.292,0]} size={[.083,.098,.076]} color="#efc5a4"/>
    {side===1&&<group position={[0,-.27,.028]} rotation={[.78,0,-.1]}>
     <mesh position={[0,.235,0]} castShadow><cylinderGeometry args={[.011,.02,.57,10]}/><PaintedMaterial color="#66402b" kind="bark"/></mesh>
     <mesh position={[0,.529,0]}><sphereGeometry args={[.033,16,12]}/><meshStandardMaterial color="#fff3cc" emissive="#ffe1a1" emissiveIntensity={2.5}/></mesh>
    </group>}
   </group>
  </group>)}</group>
  <mesh position={[-.27,1.42,.231]} rotation={[0,-.2,0]}><circleGeometry args={[.046,5]}/><meshStandardMaterial color="#d4aa50" roughness={.7}/></mesh>
 </group></group>;
}

export const DetailedWizard=memo(function DetailedWizard({bride=false,moving,reduced}:{bride?:boolean;moving:boolean;reduced:boolean}) {
 return bride?<BrideWizard bride moving={moving} reduced={reduced}/>:<ChibiWizard moving={moving} reduced={reduced}/>;
});
