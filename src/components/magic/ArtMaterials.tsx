import { useMemo } from 'react';
import { DoubleSide, type MeshStandardMaterial } from 'three';

// World-space pigment variation: no external texture downloads or repeating UV seams.
export const pigmentNoise = `
float pigmentHash(vec3 p) { p=fract(p*.3183099+vec3(.1,.3,.7)); p*=17.; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
float pigmentNoise(vec3 p) {
 vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
 return mix(mix(mix(pigmentHash(i),pigmentHash(i+vec3(1,0,0)),f.x),mix(pigmentHash(i+vec3(0,1,0)),pigmentHash(i+vec3(1,1,0)),f.x),f.y),mix(mix(pigmentHash(i+vec3(0,0,1)),pigmentHash(i+vec3(1,0,1)),f.x),mix(pigmentHash(i+vec3(0,1,1)),pigmentHash(i+vec3(1,1,1)),f.x),f.y),f.z);
}`;
export function PaintedMaterial({color,kind='stone',metalness=0}:{color:string;kind?:'stone'|'bark'|'cloth'|'plaster';metalness?:number}) {
 const compile=useMemo(()=>((shader:Parameters<MeshStandardMaterial['onBeforeCompile']>[0])=>{
  shader.vertexShader='varying vec3 vPigment;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvPigment=position;');
  shader.fragmentShader='varying vec3 vPigment;\n'+pigmentNoise+'\n'+shader.fragmentShader;
  const scale=kind==='cloth'?'vec3(32.,12.,32.)':kind==='bark'?'vec3(12.,.7,12.)':'vec3(2.4)';
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
   float brush=pigmentNoise(vPigment*${scale});
   float grain=pigmentNoise(vPigment*vec3(53.,11.,47.));
   diffuseColor.rgb*=.79+brush*.31+grain*.08;
  `);
 }),[kind]);
 return <meshStandardMaterial color={color} roughness={metalness?.45:.91} metalness={metalness} onBeforeCompile={compile} customProgramCacheKey={()=>`paint-${kind}`} side={DoubleSide}/>;
}
