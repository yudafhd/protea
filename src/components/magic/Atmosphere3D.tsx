import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { BackSide, Color, Vector2 } from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { pigmentNoise } from './ArtMaterials';
export function PaintedSky({scene}:{scene:number}) {
 const uniforms=useMemo(()=>({zenith:{value:new Color(scene===2?'#6d9faa':'#73a7ab')},horizon:{value:new Color('#d4dec1')}}),[scene]);
 return <mesh><sphereGeometry args={[130,32,20]}/><shaderMaterial side={BackSide} depthWrite={false} uniforms={uniforms} vertexShader={`varying vec3 skyDirection;void main(){skyDirection=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`} fragmentShader={`
  varying vec3 skyDirection;uniform vec3 zenith;uniform vec3 horizon;${pigmentNoise}
  void main(){vec3 d=normalize(skyDirection);float h=max(0.,d.y);
   vec3 color=mix(horizon,zenith,smoothstep(0.,.72,h));
   float clouds=pigmentNoise(vec3(d.xz*7.,d.y*15.))*.6+pigmentNoise(vec3(d.xz*16.,d.y*22.))*.4;
   color=mix(color,vec3(.93,.92,.79),smoothstep(.57,.78,clouds)*smoothstep(.05,.24,h)*.7);
   float sun=dot(d,normalize(vec3(.7,.52,-.35)));
   color+=vec3(1.,.74,.34)*pow(max(0.,sun),70.)*.32;
   color=mix(color,vec3(1.,.96,.73),smoothstep(.9993,.9998,sun));
   gl_FragColor=vec4(color,1.);
   #include <tonemapping_fragment>
   #include <colorspace_fragment>
  }`}/></mesh>;
}
const grade={
 uniforms:{tDiffuse:{value:null}},
 vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
 fragmentShader:`uniform sampler2D tDiffuse;varying vec2 vUv;
  void main(){vec3 color=texture2D(tDiffuse,vUv).rgb;
   float light=dot(color,vec3(.2126,.7152,.0722));
   color=mix(vec3(light),color,1.08);
   vec2 uv=vUv-.5;float vignette=1.-dot(uv*vec2(.8,1.),uv*vec2(.8,1.))*.28;
   color*=vignette;gl_FragColor=vec4(max(color,vec3(0.)),1.);
  }`,
};
export function ArtFinish({scene: sceneIndex = 0}:{scene?:number}) {
 const {gl,scene,camera,size}=useThree();
 const composerRef=useRef<EffectComposer|null>(null);
 useEffect(()=>{
  const composer=new EffectComposer(gl);
  const forest=sceneIndex===1;
  const render=new RenderPass(scene,camera),bloom=new UnrealBloomPass(new Vector2(256,512),forest?.4:.2,.65,forest?.78:1.05),color=new ShaderPass(grade),output=new OutputPass();
  composer.addPass(render);composer.addPass(bloom);composer.addPass(color);composer.addPass(output);
  composer.setPixelRatio(Math.min(gl.getPixelRatio(),1.5));
  const viewport=gl.getSize(new Vector2());composer.setSize(viewport.x,viewport.y);
  composerRef.current=composer;
  return ()=>{composerRef.current=null;bloom.dispose();color.dispose();output.dispose();composer.dispose();};
 },[gl,scene,camera,sceneIndex]);
 useEffect(()=>{composerRef.current?.setPixelRatio(Math.min(gl.getPixelRatio(),1.5));composerRef.current?.setSize(size.width,size.height);},[size,gl]);
 useFrame((_,dt)=>{if(composerRef.current)composerRef.current.render(dt);else gl.render(scene,camera);},1);
 return null;
}
