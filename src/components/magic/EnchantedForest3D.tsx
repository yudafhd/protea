import { useEffect, useMemo } from 'react';
import { Sparkles, useGLTF } from '@react-three/drei';
import { BackSide, Color, Mesh, type Object3D } from 'three';

const FOREST_MODEL = '/assets/models/enchanted-forest/enchanted-forest-blue-mist.glb';

function BlueMistSky() {
  const uniforms = useMemo(() => ({
    zenith: { value: new Color('#071126') },
    horizon: { value: new Color('#668db8') },
  }), []);

  return <mesh>
    <sphereGeometry args={[150, 32, 20]}/>
    <shaderMaterial
      side={BackSide}
      depthWrite={false}
      uniforms={uniforms}
      vertexShader="varying vec3 skyDirection; void main(){ skyDirection=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }"
      fragmentShader={`
        varying vec3 skyDirection;
        uniform vec3 zenith;
        uniform vec3 horizon;
        void main() {
          float h=clamp(normalize(skyDirection).y*.5+.5,0.,1.);
          vec3 color=mix(horizon,zenith,smoothstep(.16,.9,h));
          gl_FragColor=vec4(color,1.);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `}
    />
  </mesh>;
}

function prepareForest(root: Object3D) {
  root.traverse(object => {
    if (!(object instanceof Mesh)) return;
    object.receiveShadow = true;
    object.castShadow = /Tree_Wood|Bark|Log|Rock|Cap_/i.test(object.name);
  });
}

export function EnchantedForest3D({ reduced }: { reduced: boolean }) {
  const { scene } = useGLTF(FOREST_MODEL);
  useEffect(() => prepareForest(scene), [scene]);

  return <>
    <color attach="background" args={['#071426']}/>
    <fogExp2 attach="fog" args={['#547aa5', .025]}/>
    <BlueMistSky/>

    <hemisphereLight args={['#799dcc', '#07101d', .72]}/>
    <ambientLight color="#18345d" intensity={.34}/>
    <directionalLight
      position={[-16, 22, 7]}
      color="#7aa8ff"
      intensity={2.1}
      castShadow
      shadow-mapSize={[1024, 1024]}
      shadow-camera-left={-24}
      shadow-camera-right={24}
      shadow-camera-top={20}
      shadow-camera-bottom={-20}
      shadow-camera-far={70}
      shadow-bias={-.00008}
      shadow-normalBias={.04}
    />
    <directionalLight position={[26, 9, -8]} color="#477bce" intensity={1.35}/>
    <spotLight position={[4, 20, 0]} target-position={[9, 0, 0]} color="#86b4ff" intensity={95} distance={50} angle={.32} penumbra={.78}/>

    <primitive
      object={scene}
      position={[-16, -.32, 0]}
      rotation={[0, -Math.PI / 2, 0]}
      scale={2}
      dispose={null}
    />

    {[
      [-18, .9, -3.8], [-13.4, .85, 3.6], [-8, .8, 4.4],
      [-4, .9, -4], [4, .8, -2.6], [12, .75, 3.4],
    ].map((position, index) => <pointLight key={index} position={position as [number, number, number]} color="#4aa4ff" intensity={7} distance={7.5} decay={2}/>) }

    <Sparkles count={reduced ? 24 : 82} scale={[58, 6, 22]} position={[2, 2.2, 0]} size={2.4} speed={reduced ? 0 : .18} opacity={.62} color="#a9d7ff"/>
  </>;
}

useGLTF.preload(FOREST_MODEL);
