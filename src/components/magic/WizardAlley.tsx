import { memo, useEffect, useMemo, useRef } from 'react';
import { BackSide, BoxGeometry, CanvasTexture, Color, ExtrudeGeometry, InstancedMesh, Object3D, Shape, SRGBColorSpace, type MeshStandardMaterial } from 'three';
import { Animal3D } from './Models3D';
import { ALLEY_LIMIT } from './world';
import { pigmentNoise } from './ArtMaterials';

type V3 = [number, number, number];
type Block = { at: V3; size: V3; color: string; yaw?: number; rotation?: V3 };
const iron = '#202b2d';

function Blocks({ items, glow = false }: { items: Block[]; glow?: boolean }) {
 const ref = useRef<InstancedMesh>(null);
 useEffect(() => {
  if (!ref.current) return;
  const object = new Object3D();
  items.forEach((item, i) => {
   object.position.set(...item.at); object.scale.set(...item.size); object.rotation.set(...(item.rotation ?? [0, item.yaw ?? 0, 0])); object.updateMatrix();
   ref.current!.setMatrixAt(i, object.matrix); ref.current!.setColorAt(i, new Color(item.color));
  });
  ref.current.instanceMatrix.needsUpdate = true;
  if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
  ref.current.computeBoundingSphere();
 }, [items]);
 return <instancedMesh ref={ref} args={[undefined, undefined, items.length]} castShadow={!glow} receiveShadow={!glow}>
  <boxGeometry args={[1, 1, 1]}/>
  {glow ? <meshStandardMaterial color="#ffffff" emissive="#e3b16f" emissiveIntensity={.42} roughness={.28} metalness={.15}/> : <meshStandardMaterial color="#ffffff" roughness={.76}/>}
 </instancedMesh>;
}

function BrickMaterial({ color }: { color: string }) {
 const compile = useMemo(() => (shader: Parameters<MeshStandardMaterial['onBeforeCompile']>[0]) => {
  shader.vertexShader = 'varying vec3 vBrick; varying vec3 vBrickNormal;\n' + shader.vertexShader;
  shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvBrick=position;vBrickNormal=normal;');
  shader.fragmentShader = 'varying vec3 vBrick; varying vec3 vBrickNormal;\n' + shader.fragmentShader;
  shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
   vec2 p=vec2(abs(vBrickNormal.z)>.5?vBrick.x:vBrick.z,vBrick.y);
   float row=floor(p.y/.29);vec2 cell=vec2(p.x/.63+mod(row,2.)*.5,p.y/.29);
   vec2 edge=min(fract(cell),1.-fract(cell));
   float mortar=smoothstep(.025,.065,edge.x)*smoothstep(.035,.09,edge.y);
   float brick=fract(sin(dot(floor(cell),vec2(127.1,311.7)))*43758.5453);
   float grain=fract(sin(dot(p,vec2(431.3,673.9)))*12741.53);
   diffuseColor.rgb*=mix(.39,.77+brick*.39,mortar)*(.94+grain*.1);
  `);
 }, []);
 return <meshStandardMaterial color={color} roughness={.88} onBeforeCompile={compile} customProgramCacheKey={() => 'alley-brick-v1'}/>;
}

function Cobblestones() {
 const ref = useRef<InstancedMesh>(null);
 const rows = 180, cols = 22;
 const geometry = useMemo(() => new BoxGeometry(.39, .075, .39, 1, 1, 1), []);
 useEffect(() => {
  const object = new Object3D();
  for (let row = 0; row < rows; row++) for (let col = 0; col < cols; col++) {
   const i = row * cols + col, noise = Math.sin(i * 12.9898) * 43758.5453, n = noise - Math.floor(noise);
   const z = (col - (cols - 1) / 2) * .424;
   object.position.set(-38 + row * .425 + (col % 2) * .21, -.03 + Math.cos(z * .3) * .035 + n * .012, z);
   object.scale.set(.94 + n * .05, 1, .9 + n * .07); object.rotation.set(0, (n - .5) * .045, 0); object.updateMatrix();
   ref.current!.setMatrixAt(i, object.matrix);
   ref.current!.setColorAt(i, new Color(n > .82 ? '#817463' : n > .55 ? '#526166' : '#394a50').multiplyScalar(.78 + n * .35));
  }
  ref.current!.instanceMatrix.needsUpdate = true; ref.current!.instanceColor!.needsUpdate = true; ref.current!.computeBoundingSphere();
 }, []);
 useEffect(() => () => geometry.dispose(), [geometry]);
 return <>
  <mesh position={[0, -.095, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[90, 28]}/><meshStandardMaterial color="#233139" roughness={.72}/></mesh>
  <instancedMesh ref={ref} args={[geometry, undefined, rows * cols]} receiveShadow><meshStandardMaterial color="#ffffff" roughness={.29} metalness={.23}/></instancedMesh>
  <Blocks items={[-1, 1].flatMap(side => Array.from({ length: 126 }, (_, i) => ({ at: [-38 + i * .61, .015, side * 4.54] as V3, size: [.58, .17, .37] as V3, color: '#687070' })))}/>
  {/* Warm broken reflections sit in the joints between the damp paving stones. */}
  {[-25, -12, 1, 14, 27].map((x, i) => <mesh key={x} position={[x, .017, i % 2 ? -3.1 : 3.1]} rotation={[-Math.PI / 2, 0, 0]}>
   <planeGeometry args={[1.6, 2.3]}/><meshBasicMaterial color="#d7a46c" transparent opacity={.075} depthWrite={false}/>
  </mesh>)}
 </>;
}

function ShopSign({ title, at, yaw = Math.PI / 2 }: { title: string; at: V3; yaw?: number }) {
 const texture = useMemo(() => {
  const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#222e2f'; ctx.fillRect(0, 0, 512, 256);
  ctx.strokeStyle = '#a68c60'; ctx.lineWidth = 5; ctx.strokeRect(12, 12, 488, 232); ctx.lineWidth = 1; ctx.strokeRect(23, 23, 466, 210);
  ctx.textAlign = 'center'; ctx.fillStyle = '#bda77d'; ctx.font = '17px Georgia'; ctx.fillText('EST. 1847  ·  MAGIC & WONDERS', 256, 59);
  ctx.font = 'bold 43px Georgia'; ctx.fillStyle = '#e3c695'; ctx.fillText(title, 256, 143, 460);
  ctx.font = '16px Georgia'; ctx.fillStyle = '#bda77d'; ctx.fillText('✦  WIZARDING QUARTER  ✦', 256, 201);
  const t = new CanvasTexture(canvas); t.colorSpace = SRGBColorSpace; return t;
 }, [title]);
 useEffect(() => () => texture.dispose(), [texture]);
 return <group position={at} rotation={[0, yaw, 0]}>
  <mesh castShadow><boxGeometry args={[2.35, 1.1, .14]}/><meshStandardMaterial color="#342e27" roughness={.85}/></mesh>
  {[-1, 1].map(side => <mesh key={side} position={[0, 0, side * .073]} rotation={[0, side === 1 ? 0 : Math.PI, 0]}><planeGeometry args={[2.25, 1.02]}/><meshStandardMaterial map={texture} roughness={.9}/></mesh>)}
  <Blocks items={[-.8, .8].map(x => ({ at: [x, .86, 0], size: [.035, .65, .035], color: iron }))}/>
 </group>;
}

function WallLantern({ at }: { at: V3 }) {
 return <group position={at}>
  <Blocks items={[
   { at: [0, .58, -.3], size: [.065, .07, .8], color: iron },
   { at: [0, .72, .08], size: [.065, .3, .065], color: iron },
   { at: [0, -.43, .08], size: [.44, .09, .44], color: iron },
   ...[-1, 1].flatMap(x => [-1, 1].map(z => ({ at: [x * .17, 0, .08 + z * .17] as V3, size: [.035, .78, .035] as V3, color: iron }))),
  ]}/>
  <mesh position={[0, 0, .08]}><cylinderGeometry args={[.27, .18, .78, 4]}/><meshStandardMaterial color="#ffe7b4" emissive="#ffd095" emissiveIntensity={2.4}/></mesh>
  <mesh position={[0, .52, .08]} castShadow><coneGeometry args={[.37, .34, 4]}/><meshStandardMaterial color={iron} roughness={.5} metalness={.4}/></mesh>
 </group>;
}

function StreetPlaque({ at, title, small = false }: { at: V3; title: string; small?: boolean }) {
 const texture = useMemo(() => {
  const c = document.createElement('canvas'); c.width = 384; c.height = 480;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#1e2929'; ctx.fillRect(0, 0, 384, 480);
  ctx.strokeStyle = '#c3b896'; ctx.lineWidth = 3; ctx.strokeRect(17, 17, 350, 446);
  ctx.fillStyle = '#eee2c2'; ctx.textAlign = 'center'; ctx.font = 'bold 36px Georgia'; ctx.fillText(title, 192, 88, 340);
  ctx.font = 'italic 24px Georgia'; ctx.fillText('Fine curiosities', 192, 136);
  ctx.font = '22px Georgia'; ['TEA & TONICS', 'Old books · New spells', 'Est. 1847', 'OPEN UNTIL MIDNIGHT'].forEach((line, i) => ctx.fillText(line, 192, 220 + i * 48, 330));
  const t = new CanvasTexture(c); t.colorSpace = SRGBColorSpace; return t;
 }, [title]);
 useEffect(() => () => texture.dispose(), [texture]);
 return <group position={at} scale={small ? .64 : 1}>
  <mesh position={[0, .73, 0]} rotation={[-.12, 0, 0]} castShadow><boxGeometry args={[.83, 1.3, .09]}/><meshStandardMaterial map={texture} roughness={1}/></mesh>
  <Blocks items={[-1, 1].flatMap(side => [
   { at: [side * .44, .7, 0] as V3, size: [.08, 1.4, .1] as V3, color: '#74573b' },
   { at: [side * .4, .67, -.42] as V3, size: [.075, 1.45, .08] as V3, color: '#74573b', rotation: [.24, 0, 0] as V3 },
  ])}/>
 </group>;
}

function Barrel({ at, scale = 1 }: { at: V3; scale?: number }) {
 return <group position={at} scale={scale}>
  <mesh position={[0, .46, 0]} castShadow><cylinderGeometry args={[.34, .36, .88, 14, 3]}/><meshStandardMaterial color="#70513a" roughness={.9}/></mesh>
  {[.12, .44, .8].map(y => <mesh key={y} position={[0, y, 0]} castShadow><cylinderGeometry args={[.368, .37, .055, 14]}/><meshStandardMaterial color="#303636" metalness={.6} roughness={.6}/></mesh>)}
  <Blocks items={[-.22, -.11, 0, .11, .22].map(x => ({ at: [x, .911, 0], size: [.012, .008, .48], color: '#382d24' }))}/>
 </group>;
}

function Crate({ at, size = 1 }: { at: V3; size?: number }) {
 const wood: Block[] = [];
 for (const z of [-.32, .32]) for (const y of [.13, .32, .51]) wood.push({ at: [0, y, z], size: [.83, .155, .055], color: '#82613f' });
 for (const x of [-.39, .39]) {
  wood.push({ at: [x, .33, 0], size: [.07, .66, .66], color: '#685038' });
  wood.push({ at: [x, .35, .36], size: [.06, .72, .04], color: '#a08358' });
 }
 wood.push({ at: [0, .63, 0], size: [.8, .05, .63], color: '#8b704c' });
 return <group position={at} scale={size}><Blocks items={wood}/></group>;
}

function Planter({ at, flowers = false }: { at: V3; flowers?: boolean }) {
 return <group position={at}>
  <mesh position={[0, .24, 0]} castShadow><cylinderGeometry args={[.28, .19, .46, 12]}/><meshStandardMaterial color="#85614c" roughness={1}/></mesh>
  <mesh position={[0, .47, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[.265, 16]}/><meshStandardMaterial color="#302c23"/></mesh>
  {Array.from({ length: 7 }, (_, i) => <group key={i} position={[Math.sin(i * 2.4) * .2, .5, Math.cos(i * 2.4) * .2]}>
   <mesh position={[0, .15, 0]} rotation={[.2, i, .35]} scale={[.08, .31, .1]} castShadow><sphereGeometry args={[1, 8, 6]}/><meshStandardMaterial color={i % 2 ? '#536448' : '#364c40'}/></mesh>
   {flowers && <mesh position={[0, .4, 0]}><sphereGeometry args={[.075, 8, 6]}/><meshStandardMaterial color={i % 2 ? '#bba185' : '#8b778a'}/></mesh>}
  </group>)}
 </group>;
}

function Bicycle({ at }: { at: V3 }) {
 const frame: Block[] = [
  { at: [0, .75, 0], size: [.065, 1.15, .055], color: '#68746b', rotation: [0, 0, -.65] },
  { at: [.15, .78, 0], size: [.06, 1.1, .05], color: '#68746b', rotation: [0, 0, .68] },
  { at: [0, .77, 0], size: [.85, .055, .055], color: '#68746b' },
  { at: [.6, .83, 0], size: [.05, .95, .05], color: '#545e58', rotation: [0, 0, -.2] },
  { at: [.55, 1.29, 0], size: [.24, .05, .05], color: '#292d2b' },
  { at: [-.2, 1.13, 0], size: [.29, .08, .13], color: '#302c28' },
 ];
 return <group position={at} rotation={[0, 0, -.09]}>
  {[-.59, .65].map(x => <group key={x} position={[x, .45, 0]}>
   <mesh><torusGeometry args={[.43, .04, 8, 24]}/><meshStandardMaterial color="#202625" roughness={.8}/></mesh>
   <mesh><torusGeometry args={[.39, .012, 6, 24]}/><meshStandardMaterial color="#8d9290" metalness={.6}/></mesh>
   <Blocks items={Array.from({ length: 8 }, (_, i) => ({ at: [0, 0, 0], size: [.012, .8, .01], color: '#808a88', rotation: [0, 0, i * Math.PI / 8] }))}/>
  </group>)}
  <Blocks items={frame}/>
 </group>;
}

function ShopContents({ variant, facade }: { variant: number; facade: number }) {
 const objects = useMemo(() => {
  const objects: Block[] = [];
  const front = variant === 0 || variant === 1 || variant === 4 ? facade + .72 : facade + .3;
  for (const y of [1.45, 2.5, 3.35]) {
   objects.push({ at: [-.85, y, front], size: [2.45, .1, .3], color: '#5d4431' });
   for (let i = 0; i < 11; i++) {
    const h = .3 + (i * 7 % 5) * .065;
    objects.push({ at: [-1.95 + i * .22, y + h / 2 + .06, front], size: [.16, h, .18], color: ['#806947', '#685354', '#355d5c', '#8f754d', '#424552'][(i + variant) % 5], rotation: [0, 0, i % 4 === 0 ? -.13 : 0] });
    objects.push({ at: [-1.95 + i * .22, y + h * .78, front + .1], size: [.13, .017, .005], color: '#c4ac78' });
   }
  }
  return objects;
 }, [variant, facade]);
 return <Blocks items={objects}/>;
}

function FacadeDetails({ variant, height, facade, title }: { variant: number; height: number; facade: number; title: string }) {
 const pipes: Block[] = [
  { at: [3.1, height / 2, facade + .21], size: [.085, height, .09], color: '#263d3e' },
  { at: [0, height - .08, facade + .21], size: [6.6, .15, .15], color: '#303b3c' },
  { at: [3.1, .2, facade + .4], size: [.12, .12, .5], color: '#263d3e' },
 ];
 for (let y = 1; y < height; y += 2) pipes.push({ at: [3.1, y, facade + .22], size: [.17, .075, .15], color: '#78807a' });
 for (const x of [-2.4, -.1]) pipes.push({ at: [x, height + 3.4, -1], size: [.46, 1.2, .5], color: '#836251' });
 return <>
  <Blocks items={pipes}/><ShopContents variant={variant} facade={facade}/>
  <group position={[-2.5, .08, facade + .55]} rotation={[0, -.22, 0]}>
   {variant === 0 ? <><Barrel at={[0, 0, 0]}/><Crate at={[.65, 0, -.2]} size={.7}/><Crate at={[.66, .48, -.2]} size={.62}/></> :
    variant === 1 ? <><StreetPlaque at={[.15, 0, .3]} title="THE LEAKY CUP"/><Planter at={[-.35, 0, -.15]} flowers/></> :
    variant === 2 ? <><Crate at={[0, 0, 0]}/><Crate at={[.12, .65, 0]} size={.7}/><StreetPlaque at={[.83, 0, .14]} title="OLD BOOKS" small/></> :
    variant === 3 ? <Bicycle at={[.35, 0, -.05]}/> : <><Planter at={[0, 0, 0]} flowers/><Barrel at={[.7, 0, -.16]} scale={.68}/></>}
  </group>
  <Planter at={[2.9, .08, facade + .4]} flowers={variant % 2 === 0}/>
  {/* Window boxes, shutters, and pasted notices interrupt the regular brick grid. */}
  {[-1.6, 1.6].map(x => <group key={x} position={[x, 9.2, facade + .3]}>
   <Blocks items={[{ at: [0, 0, 0], size: [1.55, .28, .48], color: '#4d5647' }]}/>
   {[-.5, 0, .5].map(dx => <mesh key={dx} position={[dx, .24, .04]} scale={[.32, .26, .27]} castShadow><sphereGeometry args={[1, 8, 6]}/><meshStandardMaterial color="#394f41"/></mesh>)}
  </group>)}
  {variant % 2 === 0 && <Blocks items={[-2.45, -.8, .8, 2.45].flatMap(x => Array.from({ length: 8 }, (_, i) => ({ at: [x, 9.65 + i * .23, facade + .18] as V3, size: [.48, .16, .09] as V3, color: '#3c4d45', yaw: x < 0 ? -.13 : .13 })))}/>}
  {variant === 4 && <StreetPlaque at={[-2.85, 1.35, facade + .12]} title={title} small/>}
 </>;
}

function StreetClutter() {
 const items = useMemo(() => {
  const items: Block[] = [];
  for (let i = 0; i < 135; i++) {
   const x = -31 + (i * 4.713) % 61, side = i % 2 ? 1 : -1, z = side * (3.12 + (i % 7) * .16);
   items.push({ at: [x, .055, z], size: [.08 + (i % 3) * .04, .018, .11], color: ['#716047', '#4a5140', '#8b7552'][i % 3], yaw: i * 1.73 });
  }
  // Iron drain grilles, gutters, and the occasional paving repair.
  for (const x of [-23, -12, 0, 11, 22]) for (const side of [-1, 1]) {
   items.push({ at: [x, .055, side * 3.95], size: [1.2, .025, .56], color: '#202c2e' });
   for (let i = 0; i < 10; i++) items.push({ at: [x - .5 + i * .11, .073, side * 3.95], size: [.035, .018, .47], color: '#606862' });
  }
  return items;
 }, []);
 return <>
  <Blocks items={items}/>
  {[-19, -3, 17].map((x, i) => <group key={x} position={[x, 0, (i % 2 ? -1 : 1) * 3.99]} rotation={[0, i % 2 ? 0 : Math.PI, 0]}>
   <Blocks items={[
    ...[0, 1, 2, 3].map(i => ({ at: [0, .56, i * .12] as V3, size: [1.5, .07, .105] as V3, color: '#65513c' })),
    ...[0, 1, 2].map(i => ({ at: [0, .89 + i * .16, -.06] as V3, size: [1.5, .12, .075] as V3, color: '#65513c' })),
    ...[-.6, .6].map(x => ({ at: [x, .28, .18] as V3, size: [.07, .56, .43] as V3, color: '#28332f' })),
   ]}/>
  </group>)}
  <group position={[-16.5, 0, -4.22]}><mesh position={[0, .84, 0]} castShadow><cylinderGeometry args={[.29, .34, 1.6, 16]}/><meshStandardMaterial color="#773f37" roughness={.75}/></mesh><mesh position={[0, 1.67, 0]}><sphereGeometry args={[.33, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]}/><meshStandardMaterial color="#773f37"/></mesh><Blocks items={[{ at: [0, 1.24, .28], size: [.31, .07, .045], color: '#242722' }, { at: [0, .82, .31], size: [.23, .3, .018], color: '#cab997' }]}/></group>
  {[-14, 7, 21].map((x, i) => <group key={x} position={[x, 0, i % 2 ? 4.2 : -4.2]}>
   <Barrel at={[0, 0, 0]} scale={.77}/><Crate at={[.72, 0, .05]} size={.85}/><Crate at={[.76, .56, .08]} size={.72}/>
  </group>)}
 </>;
}

function Shop({ at, side, index, title }: { at: V3; side: number; index: number; title: string }) {
 const variant = index % 5;
 const height = [17.2, 10.6, 19.4, 12.5, 14.7][variant], width = 6.7, facade = 2.6;
 const trim = ['#233e3b', '#542f2d', '#273a4d', '#40312d', '#3b4d38'][variant];
 const { timber, glass } = useMemo(() => {
  const timber: Block[] = [], glass: Block[] = [];
  const bar = (at: V3, size: V3, color = trim, yaw = 0) => timber.push({ at, size, color, yaw });
  bar([0, .27, facade], [width + .2, .5, .48], '#596060');
  for (const y of [4.55, 8.65, 12.7, height].filter(y => y <= height)) bar([0, y, facade], [width + .25, .2, .38]);
  for (const x of [-3.23, 3.23]) bar([x, 2.4, facade], [.19, 4.3, .36]);
  const sash = (x: number, y: number, w: number, h: number, warm = false) => {
   glass.push({ at: [x, y, facade + .025], size: [w, h, .07], color: warm ? '#b48b57' : '#30474e' });
   for (const dx of [-w / 2 - .05, 0, w / 2 + .05]) bar([x + dx, y, facade + .12], [.075, h + .25, .15]);
   for (const dy of [-h / 2 - .1, -h / 6, h / 6, h / 2 + .1]) bar([x, y + dy, facade + .13], [w + .3, .075, .18]);
  };
  // Bow windows, flat bookshop panes, and projecting upper oriels alternate along the street.
  const bays = variant === 0 ? [2.4, 6.65] : variant === 1 || variant === 4 ? [2.4] : variant === 3 ? [6.65] : [];
  for (const y of bays) {
   const center: V3 = [-.88, y, facade - .07], radius = variant === 4 ? 1.5 : 1.74;
   const count = variant === 3 ? 5 : 9;
   for (let p = 0; p < count; p++) {
    const a = -.96 + p * 1.92 / (count - 1), x = center[0] + Math.sin(a) * radius, z = center[2] + Math.cos(a) * .93;
    const panel = variant === 3 ? .76 : .43;
    glass.push({ at: [x, y, z], size: [panel, 3.24, .08], color: p % 3 === index % 3 ? '#bd9567' : '#374f52', yaw: a * .65 });
    bar([x, y, z + .05], [.045, 3.48, .075], trim, a * .65);
    for (const dy of [-1.77, -.67, .43, 1.77]) bar([x, y + dy, z + .07], [panel + .07, Math.abs(dy) === 1.77 ? .17 : .045, .16], trim, a * .65);
   }
  }
  if (variant === 2 || variant === 3) sash(-.9, 2.3, 3.15, variant === 2 ? 2.8 : 3.15, true);
  if (variant === 1) { sash(-1.7, 6.6, 1.2, 2.1); sash(.65, 6.6, 1.2, 2.1, true); }
  if (variant === 2 || variant === 4) for (const x of [-2, 0, 2]) sash(x, 6.7, .95, 2.35, x === 0);
  if (variant === 4) {
   for (const x of [-3.25, -1.1, 1.1, 3.25]) bar([x, 9.1, facade + .08], [.17, 8.7, .2], '#322b27');
   for (const x of [-2.15, 2.15]) timber.push({ at: [x, 10.5, facade + .14], size: [.13, 3.9, .17], color: '#322b27', rotation: [0, 0, x > 0 ? -.5 : .5] });
  }
  if (variant === 1 || variant === 3) {
   bar([.5, 8.45, facade + .45], [5.1, .15, 1.25], '#384346');
   bar([.5, 9.45, facade + 1], [5.1, .045, .045], iron);
   for (let i = 0; i < 20; i++) bar([-2 + i * .26, 8.96, facade + 1], [.035, .96, .035], iron);
  }
  // Recessed paneled entrance beside the bowed display window.
  bar([2.05, 2.1, facade], [1.28, 3.9, .16], '#18272b');
  for (const x of [1.34, 2.76]) bar([x, 2.2, facade + .12], [.14, 4.1, .24]);
  glass.push({ at: [2.05, 2.9, facade + .105], size: [1.06, 1.65, .04], color: '#b6996d' });
  bar([2.05, 2.9, facade + .15], [.04, 1.7, .045]); bar([2.05, 2.92, facade + .16], [1.1, .04, .045]);
  for (const y of [.7, 1.48]) bar([2.05, y, facade + .14], [.98, .6, .09]);
  bar([2.48, 1.86, facade + .24], [.055, .14, .065], '#b99b65');
  bar([2.05, .15, facade + .37], [1.66, .22, .83], '#6c706b');
  // Tall sash windows in the upper brickwork.
  for (const y of [10.65, 14.45].filter(y => y < height - 1)) for (const x of [-1.63, 1.63]) {
   glass.push({ at: [x, y, facade + .02], size: [1.22, 2.25, .08], color: (index + x) % 3 > 0 ? '#927856' : '#30474b' });
   for (const dx of [-.66, 0, .66]) bar([x + dx, y, facade + .1], [.07, 2.45, .1]);
   for (const dy of [-1.23, -.4, .4, 1.23]) bar([x, y + dy, facade + .12], [1.42, .07, .16]);
   bar([x, y - 1.3, facade + .2], [1.6, .17, .43], '#68706b');
  }
  // Roof courses, chimney bands, and the iron sign bracket.
  for (let i = 0; i < (variant === 1 ? 5 : 11); i++) bar([0, height + .1 + i * .2, facade - i * .18], [width + .35, .11, .27], i % 2 ? '#364b50' : '#40545a');
  bar([2.2, height + 2.1, -.6], [.76, 4, .84], '#576363');
  for (const y of [height + 1.1, height + 2.3, height + 3.9]) bar([2.2, y, -.6], [.89, .16, .94], '#727874');
  bar([2.25, 7.2, facade + 1.1], [.07, .07, 2.8], iron);
  return { timber, glass };
 }, [height, index, trim, variant]);
 return <group position={at} rotation={[0, side === -1 ? 0 : Math.PI, 0]}>
  <mesh position={[0, height / 2, 0]} castShadow receiveShadow><boxGeometry args={[width, height, 5.2]}/><BrickMaterial color={['#4f6266', '#856650', '#514d57', '#6e5550', '#a09a7e'][variant]}/></mesh>
  <Blocks items={timber}/><Blocks items={glass} glow/>
  <FacadeDetails variant={variant} height={height} facade={facade} title={title}/>
  <ShopRoof height={height} variant={variant}/>
  {variant === 4 && <Blocks items={[-3.16,-1.05,1.05,3.16].map(x=>({at:[x,6.1,facade+.25],size:[.28,3.2,.5],color:'#392f29'}))}/>}
  {variant === 1 && <ShopSign title="THE LEAKY CUP" at={[-.8,4.4,facade+.55]} yaw={0}/>}
  {variant === 0 && <group position={[-2.1,8.7,2.05]}><mesh castShadow><cylinderGeometry args={[1.18,1.35,6.3,16]}/><BrickMaterial color="#576963"/></mesh><mesh position={[0,4.1,0]} castShadow><coneGeometry args={[1.63,2.4,16]}/><meshStandardMaterial color="#293e47"/></mesh></group>}
  <ShopSign title={title} at={[2.25, 6.12 + (variant === 2 ? .65 : 0), facade + 2.05]}/>
  <WallLantern at={[-2.85, 3.6, facade + .72]}/>
  {variant === 2 && <ShopSign title={title} at={[-.9, 4.4, facade + .18]} yaw={0}/>}
  {/* A sloping striped canvas canopy breaks up the upper shop silhouettes. */}
  {(variant === 1 || variant === 4) && <group position={[-.7, 4.96, facade + .7]} rotation={[.28, 0, 0]}>
   <mesh castShadow><boxGeometry args={[3.85, .055, 1.62]}/><meshStandardMaterial color="#69796d" roughness={1}/></mesh>
   <Blocks items={[-1.5, -.5, .5, 1.5].map(x => ({ at: [x, .035, 0], size: [.36, .01, 1.64], color: '#a9ada0' }))}/>
  </group>}
 </group>;
}

function ShopRoof({ height, variant }: { height: number; variant: number }) {
 const gable = useMemo(() => {
  const shape = new Shape(); shape.moveTo(-3.5, 0); shape.lineTo(0, variant === 2 ? 5.5 : 3.9); shape.lineTo(3.5, 0); shape.closePath();
  return new ExtrudeGeometry(shape, { depth: 5.7, bevelEnabled: false });
 }, [variant]);
 useEffect(() => () => gable.dispose(), [gable]);
 return <group position={[0, height, 0]}>
  {variant === 1 ? <>
   <mesh position={[0, .7, 0]} rotation={[0, Math.PI / 4, 0]} castShadow><cylinderGeometry args={[3.8, 4.9, 1.6, 4]}/><meshStandardMaterial color="#35434f" roughness={.8}/></mesh>
   <Blocks items={[-2, 0, 2].map(x => ({ at: [x, 1, 2.1], size: [.8, 1.15, .5], color: '#778080' }))}/>
  </> : variant === 3 ? <>
   <mesh position={[0, 1.4, -.2]} rotation={[0, Math.PI / 4, 0]} castShadow><coneGeometry args={[4.8, 3.1, 4]}/><meshStandardMaterial color="#354d55" roughness={.85}/></mesh>
   <Blocks items={Array.from({ length: 7 }, (_, i) => ({ at: [0, .25 + i * .46, 2.65], size: [6.6 - i * .8, .51, .4], color: '#65706e' }))}/>
  </> : <>
   <mesh geometry={gable} position={[0, 0, -2.85]} castShadow><BrickMaterial color={variant === 4 ? '#73756b' : '#54666b'}/></mesh>
   {[-1, 1].map(side => <mesh key={side} position={[side * 1.75, (variant === 2 ? 5.5 : 3.9) / 2, 0]} rotation={[0, 0, -side * Math.atan((variant === 2 ? 5.5 : 3.9) / 3.5)]} castShadow>
    <boxGeometry args={[variant === 2 ? 6.7 : 5.4, .17, 5.95]}/><meshStandardMaterial color="#293e49" roughness={.82}/>
   </mesh>)}
   <mesh position={[0, 1.5, 2.88]}><circleGeometry args={[.53, 32]}/><meshStandardMaterial color="#bca178" emissive="#c39557" emissiveIntensity={.3}/></mesh>
   <mesh position={[0, 1.5, 2.93]}><torusGeometry args={[.57, .075, 8, 32]}/><meshStandardMaterial color="#354342"/></mesh>
  </>}
  {variant === 0 && <group position={[-1.6, -3.6, 1.5]}>
   <mesh position={[0, 2.35, 0]} castShadow><cylinderGeometry args={[1.25, 1.4, 4.7, 24]}/><BrickMaterial color="#45575d"/></mesh>
   <mesh position={[0, 6.8, 0]} castShadow><coneGeometry args={[1.8, 4.6, 24]}/><meshStandardMaterial color="#273b46" roughness={.72}/></mesh>
   <mesh position={[0, 9.3, 0]}><coneGeometry args={[.08, .8, 8]}/><meshStandardMaterial color="#7b8078" metalness={.7}/></mesh>
   <Blocks items={[-.65, .65].map(x => ({ at: [x, 3, 1.23], size: [.42, 1.42, .09], color: '#b79869' }))} glow/>
  </group>}
 </group>;
}

function AlleyDuskSky() {
 const uniforms = useMemo(() => ({
  zenith: { value: new Color('#25364e') }, horizon: { value: new Color('#a1847c') }, cloudColor: { value: new Color('#405369') },
 }), []);
 return <mesh renderOrder={-100}>
  <sphereGeometry args={[110, 48, 32]}/>
  <shaderMaterial side={BackSide} depthWrite={false} fog={false} uniforms={uniforms}
   vertexShader="varying vec3 skyDirection;void main(){skyDirection=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}" fragmentShader={`
    varying vec3 skyDirection;uniform vec3 zenith;uniform vec3 horizon;uniform vec3 cloudColor;${pigmentNoise}
    void main(){
     vec3 d=normalize(skyDirection);float h=max(d.y,0.);
     vec3 color=mix(horizon,zenith,smoothstep(0.,.68,h));
     vec3 p=vec3(d.x*4.8,d.y*10.,d.z*4.8);
     float clouds=pigmentNoise(p)*.54+pigmentNoise(p*2.15)*.28+pigmentNoise(p*4.6)*.12+pigmentNoise(p*9.2)*.06;
     float bank=smoothstep(.39,.66,clouds)*smoothstep(.015,.2,h);
     color=mix(color,cloudColor,bank*.88);
     float sunset=pow(max(dot(d,normalize(vec3(1.,.08,-.15))),0.),16.);
     color+=vec3(.23,.105,.052)*sunset*exp(-h*5.);
     color+=vec3(.026,.034,.044)*smoothstep(.5,.59,clouds)*(1.-smoothstep(.6,.69,clouds));
     gl_FragColor=vec4(color,1.);
     #include <tonemapping_fragment>
     #include <colorspace_fragment>
    }`}/>
 </mesh>;
}

function AlleyEnd({ x, reverse = false }: { x: number; reverse?: boolean }) {
 const arch = useMemo(() => {
  const shape = new Shape(); shape.moveTo(-1.5, 0); shape.lineTo(1.5, 0); shape.lineTo(1.5, 3.8); shape.quadraticCurveTo(0, 6, -1.5, 3.8); shape.closePath();
  return new ExtrudeGeometry(shape, { depth: .12, bevelEnabled: false });
 }, []);
 useEffect(() => () => arch.dispose(), [arch]);
 const stone: Block[] = [], windows: Block[] = [];
 for (const y of [6.9, 11.5, 16.1]) for (const sx of [-3.8, 0, 3.8]) {
  windows.push({ at: [sx, y, 2.55], size: [1.65, 2.75, .1], color: sx === 0 ? '#b59868' : '#52676a' });
  for (const dx of [-.9, 0, .9]) stone.push({ at: [sx + dx, y, 2.66], size: [.09, 2.98, .15], color: '#2c383c' });
  for (const dy of [-1.48, -.49, .49, 1.48]) stone.push({ at: [sx, y + dy, 2.67], size: [2, .09, .18], color: '#2c383c' });
 }
 for (const y of [.3, 4.8, 9.2, 13.8, 18.4]) stone.push({ at: [0, y, 2.62], size: [12.5, .25, .5], color: '#616b69' });
 for (const sx of [-1.7, 1.7]) stone.push({ at: [sx, 2, 2.8], size: [.3, 4, .45], color: '#70716a' });
 for (let i = 0; i < 13; i++) {
  const a = i / 12 * Math.PI;
  stone.push({ at: [Math.cos(a) * 1.7, 3.85 + Math.sin(a) * 1.7, 2.8], size: [.4, .35, .45], color: '#70716a', rotation: [0, 0, a - Math.PI / 2] });
 }
 return <group position={[x, 0, 0]} rotation={[0, reverse ? Math.PI / 2 : -Math.PI / 2, 0]}>
  <mesh position={[0, 9.25, 0]} castShadow receiveShadow><boxGeometry args={[12, 18.5, 5]}/><BrickMaterial color="#586669"/></mesh>
  <Blocks items={stone}/><Blocks items={windows} glow/>
  <mesh geometry={arch} position={[0, .15, 2.55]}><meshStandardMaterial color="#141c24" roughness={.9}/></mesh>
  <Blocks items={Array.from({ length: 9 }, (_, i) => ({ at: [-1.3 + i * .325, 2.1, 2.74], size: [.045, 3.85, .055], color: '#576160' }))}/>
  <ShopSign title={reverse ? 'THE WEST GATE' : 'THE OLD ARCADE'} at={[0, 5.85, 3]} yaw={0}/>
  <mesh position={[0, 20.1, 0]} rotation={[0, Math.PI / 4, 0]} castShadow><coneGeometry args={[8.4, 4.6, 4]}/><meshStandardMaterial color="#293d4a" roughness={.8}/></mesh>
  {[-1, 1].map(side => <group key={side} position={[side * 5.4, 0, .5]}>
   <mesh position={[0, 10.3, 0]} castShadow><cylinderGeometry args={[1.55, 1.8, 20.6, 20]}/><BrickMaterial color={side === 1 ? '#65716f' : '#4c5e64'}/></mesh>
   <mesh position={[0, 23.2, 0]} castShadow><coneGeometry args={[2, side === 1 ? 6.5 : 5.5, 20]}/><meshStandardMaterial color="#263a49" roughness={.8}/></mesh>
   <Blocks items={[8, 12.5, 17].map(y => ({ at: [0, y, 1.58], size: [.65, 1.7, .1], color: '#bba079' }))} glow/>
  </group>)}
  <WallLantern at={[-2.5, 3.7, 3]}/><WallLantern at={[2.5, 3.7, 3]}/>
  <pointLight position={[0, 4, 4]} color="#ffbf7e" intensity={26} distance={13} decay={2}/>
 </group>;
}

export const WizardAlley = memo(function WizardAlley({ reduced }: { reduced: boolean }) {
 const names = ['OWL POST', 'WANDS & CO.', 'MOON & INK', 'STAR ATLAS', 'ELIXIRS', 'SPELLBOUND', 'THE APOTHECARY', 'NIGHT OWL', 'LUMOS BOOKS', 'COPPER CAULDRON'];
 return <>
  <color attach="background" args={['#293c51']}/><fogExp2 attach="fog" args={['#50616f', .0085]}/>
  <AlleyDuskSky/>
  <hemisphereLight args={['#bdcddd', '#494854', 1.55]}/>
  <directionalLight position={[-4, 24, 6]} color="#bed0df" intensity={1.4} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-42} shadow-camera-right={42} shadow-camera-top={26} shadow-camera-bottom={-26} shadow-camera-far={80} shadow-normalBias={.04}/>
  <directionalLight position={[-26, 8, 0]} color="#e4bea0" intensity={.68}/>
  <Cobblestones/><StreetClutter/>
  {[-1,1].flatMap(side=>{
   const widths=side===-1?[8.2,4.7,5.5,8.1,5.9,4.9,7.5,5.2,8.3,6.3,6.4]:[5.4,7.8,4.5,6.1,8.4,5.2,7.1,4.8,7.7,6.2,7.8];
   let cursor=-38;
   return widths.map((width,i)=>{const x=cursor+width/2;cursor+=width;const index=side===-1?[0,4,1,2,3,1,4,0,3,2,4][i]:[3,1,4,0,2,4,3,1,0,4,2][i];
    return <group key={`${side}-${i}`} position={[x,0,0]} scale={[width/6.7,1,1]}><Shop at={[0,0,side*(7.8+(i%3)*.12)]} side={side} index={index} title={names[(i+(side===1?4:0))%names.length]}/></group>;
   });
  })}
  {[-25, -12, 1, 14, 27].map((x, i) => <pointLight key={x} position={[x, 3.4, i % 2 ? -3.7 : 3.7]} color="#ffca90" intensity={28} distance={11} decay={2}/>)}
  <AlleyEnd x={33}/><AlleyEnd x={-39} reverse/>
  <group position={[-9.9, 2.9, -ALLEY_LIMIT - 1.25]} rotation={[0, .4, 0]}><Animal3D at={[0, 0, 0]} kind="owl" reduced={reduced}/></group>
 </>;
});
