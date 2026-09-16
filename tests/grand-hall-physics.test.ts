import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Box3 } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { HallPhysics, bodyBounds, overlaps, PLAYER_RADIUS } from '../src/components/grand-hall/physics';

const ready = () => { const p = new HallPhysics(); p.ready = true; return p; };
const bounds = (x=0) => ({ min:{x:x-.2,y:3,z:-.2},max:{x:x+.2,y:3.4,z:.2} });

test('exploration reaches both sides; large moves cannot tunnel through a table', () => {
  const p=ready();
  // Side exploration remains available, with clearance before the entrance columns.
  for (const side of [-1, 1]) {
    const end = p.movePlayer({x:0,y:0,z:5.5},{x:side*6,y:0,z:5.5});
    assert.ok(Math.abs(end.x)>5);
    assert.ok(Math.abs(end.x)<=6.4-PLAYER_RADIUS);
  }
  p.addBody('FloatTable_test',{min:{x:3,y:.3,z:-19},max:{x:4.6,y:1.5,z:-3}});
  const end=p.movePlayer({x:0,y:0,z:-8},{x:6,y:0,z:-8});
  assert.ok(end.x<=3-PLAYER_RADIUS);
  assert.ok(3-end.x>=.8,'camera stays at least 80 cm away from the impact surface');
  const slide=p.movePlayer(end,{x:6,y:0,z:-9});
  assert.ok(slide.x<=3-PLAYER_RADIUS);
  assert.ok(slide.z<-8.9);
});

test('flying clears furniture and descent stops on its top',()=>{
  const p=ready();
  p.addBody('FloatTable_test',{min:{x:3,y:.3,z:-19},max:{x:4.6,y:1.5,z:-3}});
  const over=p.movePlayer({x:0,y:3,z:-8},{x:3.5,y:3,z:-8});
  assert.ok(Math.abs(over.x-3.5)<1e-8);
  const landed=p.movePlayer(over,{...over,y:0});
  assert.ok(landed.y!>1.45);
});

test('cauldron, potion rack, hat, books, owl and candles have distinct solid volumes',()=>{
  const p=ready();
  for(const id of ['cauldron-and-fire','potion-shelf','sorting-hat','stacked-books','owl','desk-candles']) {
    const b=p.statics.find(b=>b.id===id)!;
    assert.ok(b,id);
    const y=Math.max(0,b.min.y+.01),z=(b.min.z+b.max.z)/2;
    const start={x:b.min.x-1,y,z};
    const end=p.movePlayer(start,{x:b.max.x+1,y,z});
    assert.ok(end.x<=b.min.x-PLAYER_RADIUS+1e-4,`${id}: blocked at ${end.x}`);
  }
});

test('mass affects impulses; drag stops horizontal drift without returning to the anchor',()=>{
  const p=ready();
  const table=p.addBody('FloatTable_test',bounds(-1));
  const letter=p.addBody('FloatLetter_test',bounds(1));
  p.impulse(table.id,{x:1,y:0,z:0});p.impulse(letter.id,{x:1,y:0,z:0});
  assert.ok(letter.velocity.x>table.velocity.x);
  for(let i=0;i<30;i++)p.step(1/60);
  assert.ok(letter.offset.x>.01);
  const displaced=letter.offset.x;
  for(let i=0;i<360;i++)p.step(1/60);
  assert.ok(letter.offset.x>=displaced);
  assert.ok(Math.abs(letter.velocity.x)<.005);
  const before={...letter.offset};p.step(1/60,true);p.impulse(letter.id,{x:1,y:0,z:0});
  p.step(1/60,true);assert.deepEqual(letter.offset,before);
});

test('dynamic props collide with one another and the player',()=>{
  const p=ready();p.statics.length=0;
  const a=p.addBody('FloatLetter_a',bounds(0));
  const b=p.addBody('FloatLetter_b',bounds(.5));
  p.impulse(a.id,{x:1,y:0,z:0});
  for(let i=0;i<60;i++) {p.step(1/120);assert.ok(!overlaps(bodyBounds(a),bodyBounds(b)));}
  assert.ok(b.offset.x>0);
  const playerX=bodyBounds(b).max.x+PLAYER_RADIUS+.05;
  p.player={x:playerX,y:2,z:0};p.impulse(b.id,{x:1,y:0,z:0});
  for(let i=0;i<30;i++)p.step(1/120);
  assert.ok(bodyBounds(b).max.x<=playerX-PLAYER_RADIUS+.001);
});

test('fixed-step motion agrees at 30 and 120 fps and ignores time spikes',()=>{
  const a=ready(),b=ready();a.addBody('FloatBook_a',bounds());b.addBody('FloatBook_a',bounds());
  for(let i=0;i<60;i++)a.step(1/30);
  for(let i=0;i<240;i++)b.step(1/120);
  assert.ok(Math.abs(a.bodies.get('FloatBook_a')!.offset.y-b.bodies.get('FloatBook_a')!.offset.y)<1e-6);
  a.step(60);assert.ok(Math.abs(a.bodies.get('FloatBook_a')!.offset.y)<.2);
});

test('actual GLB supplies individual bounds for furniture, airborne candles, books and letters',async()=>{
  const bytes=await readFile(new URL('../public/assets/models/grand-hall/grand-hall.glb',import.meta.url));
  const gltf=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
  const p=ready();gltf.scene.updateMatrixWorld(true);
  gltf.scene.traverse(o=>{
    if(/^Float/.test(o.name)&&!/^Float/.test(o.parent?.name??'')) {
      const b=new Box3().setFromObject(o);
      p.addBody(o.name,{min:{...b.min},max:{...b.max}});
    }
  });
  for(const [prefix,count] of [['FloatTable_',2],['FloatChair_',12],['FloatCandle_',24],['FloatBook_',1],['FloatLetter_',3]] as const) {
    assert.equal([...p.bodies.keys()].filter(id=>id.startsWith(prefix)).length,count,prefix);
  }
  for(const y of [-5,-10,-15]) {
    for(const side of [-1,1]) {
      const end=p.movePlayer({x:0,y:0,z:y},{x:side*6,y:0,z:y});
      assert.ok(Math.abs(end.x)<3,`table blocks at z=${y}`);
    }
  }
  for(const b of p.bodies.values())assert.ok(Number.isFinite(b.min.x)&&b.max.y>b.min.y);
});
