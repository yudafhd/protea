import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Box3, Quaternion, Vector3 } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { HallPhysics, hallSolids } from '../src/components/grand-hall/physics';
import { loadRigidPhysics, RigidPropsPhysics, MAX_DROPS, MAX_PUDDLES, type RigidSpec } from '../src/components/grand-hall/rigid-physics';

const fixture=(async()=>{
  const bytes=await readFile(new URL('../public/assets/models/grand-hall/grand-hall.glb',import.meta.url));
  const gltf=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
  gltf.scene.updateMatrixWorld(true);
  const specs:RigidSpec[]=[];
  gltf.scene.traverse(o=>{
    if(/^Rigid/.test(o.name)&&!/^Rigid/.test(o.parent?.name??'')) {
      const b=new Box3().setFromObject(o);specs.push({id:o.name,min:{...b.min},max:{...b.max}});
    }
  });
  return specs;
})();
const create=async()=>new RigidPropsPhysics(await loadRigidPhysics(),await fixture,hallSolids());
const advance=(p:RigidPropsPhysics,seconds:number)=>{for(let i=0;i<seconds*120;i++)p.step(1/120,[],{x:0,y:0,z:5});};

test('actual asset has one rack, eighteen independent bottles and one cauldron',async()=>{
  const specs=await fixture;
  for(const [prefix,count] of [['RigidRack_',1],['RigidBottle_',18],['RigidCauldron_',1]] as const)
    assert.equal(specs.filter(s=>s.id.startsWith(prefix)).length,count);
});

test('gravity settles the upright cauldron and bottles without spontaneous spilling',async()=>{
  const p=await create();
  try {
    advance(p,5);
    const pot=[...p.props.values()].find(p=>p.id.startsWith('RigidCauldron'))!;
    assert.equal(pot.volume,1);
    assert.equal(p.drops.length,0);
    const bottles=[...p.props.values()].filter(p=>p.id.startsWith('RigidBottle'));
    for(const b of bottles)assert.ok(b.rigid.translation().y>b.center.y-.12,`${b.id} must stay on its shelf`);
    assert.ok(pot.rigid.translation().y>.9,'pot remains above the hearth');
  } finally {p.dispose();}
});

test('a pushed rack rotates and bottles fall from the compound shelves',async()=>{
  const p=await create();
  try {
    const rack=[...p.props.values()].find(p=>p.id.startsWith('RigidRack'))!;
    // Push the top towards the open entrance, away from the rear wall.
    p.push(rack.id,{x:0,y:0,z:1},65,{x:-4.55,y:4.1,z:-1.2});
    advance(p,4);
    const up=new Vector3(0,1,0).applyQuaternion(new Quaternion().copy(rack.rigid.rotation()));
    assert.ok(up.y<.8,`rack tilt ${up.y}`);
    assert.ok([...p.props.values()].some(b=>b.id.startsWith('RigidBottle')&&b.rigid.translation().y<b.center.y-.4));
  } finally {p.dispose();}
});

test('a fallen cauldron loses finite liquid and leaves bounded persistent puddles',async()=>{
  const p=await create();
  try {
    const pot=[...p.props.values()].find(p=>p.id.startsWith('RigidCauldron'))!;
    pot.rigid.setTranslation({x:-2.8,y:1.2,z:2},true);
    pot.rigid.setRotation(new Quaternion().setFromAxisAngle(new Vector3(1,0,0),Math.PI/2),true);
    advance(p,5);
    assert.ok(pot.volume<.15,`remaining ${pot.volume}`);
    assert.ok(p.puddles.length>0,'liquid hits the floor');
    assert.ok(p.puddles.length<=MAX_PUDDLES&&p.drops.length<=MAX_DROPS);
    advance(p,6);
    assert.equal(pot.volume,0);
    assert.equal(p.drops.length,0);
    assert.ok(p.puddles.every(p=>p.position.y>=.03));
  } finally {p.dispose();}
});

test('player collision follows a relocated cauldron; reduced motion pauses rigid simulation',async()=>{
  const physics=new HallPhysics();physics.ready=true;physics.rigid=await create();
  try {
    const pot=[...physics.rigid.props.values()].find(p=>p.id.startsWith('RigidCauldron'))!;
    pot.rigid.setTranslation({x:0,y:1,z:2},true);
    const end=physics.movePlayer({x:0,y:0,z:5},{x:0,y:0,z:0});
    assert.ok(end.z>2.5,'collision must follow the new pot position');
    const before={...pot.rigid.translation()};physics.step(.05,true);
    assert.deepEqual({...pot.rigid.translation()},before);
    physics.clear();assert.equal(physics.rigid,undefined);
  } finally {physics.clear();}
});
