import test from 'node:test';
import assert from 'node:assert/strict';
import { advance, nearby, chapters, toWorld, fromWorld, avoidScenery } from '../src/components/magic/world';
test('movement clamps elapsed time and stays inside the playable world', () => {
 assert.deepEqual(advance({x:1110,y:640},{x:100,y:100},1),{x:1110,y:640});
 const moved=advance({x:200,y:400},{x:1000,y:0},20);
 assert.equal(moved.x,208.75);
 assert.deepEqual(advance({x:200,y:400},{x:0,y:0},1),{x:200,y:400});
});
test('diagonal travel has the same speed, and never overshoots a destination',()=>{
 const p={x:200,y:400};
 const moved=advance(p,{x:1000,y:1000},.05);
 assert.ok(Math.abs(Math.hypot(moved.x-p.x,moved.y-p.y)-8.75)<.001);
 assert.deepEqual(advance(p,{x:2,y:1},.05),{x:202,y:401});
});
test('all six beacons are reachable and proximity has a defined boundary',()=>{
 assert.equal(chapters.flatMap(c=>c.points).length,6);
 for(const point of chapters.flatMap(c=>c.points)){
  assert.ok(point.x>=90&&point.x<=1110&&point.y>=330&&point.y<=640);
  assert.ok(nearby(point,{x:point.x+47,y:point.y}));
  assert.ok(!nearby(point,{x:point.x+48,y:point.y}));
 }
});

test('3D world coordinates round trip and raycast targets stay in bounds',()=>{
 const point={x:380,y:490};
 assert.deepEqual(fromWorld(...toWorld(point)),point);
 assert.deepEqual(fromWorld(100,-100),{x:1110,y:330});
});
test('solid props keep the couple outside their footprint without blocking beacons',()=>{
 const blocked=avoidScenery(fromWorld(-13,-1.7),1);
 const [x,z]=toWorld(blocked);
 assert.ok(Math.hypot(x+13,z+1.7)>=1.049);
 chapters.forEach((chapter,scene)=>chapter.points.forEach(point=>{
   const result=avoidScenery(point,scene);
   assert.ok(Math.hypot(result.x-point.x,result.y-point.y)<.001);
 }));
});

import { thirdPersonPose, cameraMovement } from '../src/components/magic/camera';
test('third-person camera stays behind the player at shoulder height in every heading',()=>{
 const point={x:500,y:450};const [x,z]=toWorld(point);
 for(const yaw of [0,Math.PI/2,Math.PI,-Math.PI/2]){
  const pose=thirdPersonPose(point,yaw,.18);
  assert.ok(pose.eye[1]>3&&pose.eye[1]<4);
  assert.ok((pose.eye[0]-x)*Math.sin(yaw)+(pose.eye[2]-z)*Math.cos(yaw)<-8);
  assert.ok((pose.target[0]-x)*Math.sin(yaw)+(pose.target[2]-z)*Math.cos(yaw)>2);
 }
});
test('movement follows camera forward and right after orbiting',()=>{
 const north=cameraMovement(0,-1,Math.PI);
 assert.ok(north.y<0&&Math.abs(north.x)<.001);
 const east=cameraMovement(0,-1,Math.PI/2);
 assert.ok(east.x>0&&Math.abs(east.y)<.001);
 const right=cameraMovement(1,0,Math.PI);
 assert.ok(right.x>0&&Math.abs(right.y)<.001);
});

test('alley walls constrain movement without invisible forest collisions or unreachable quests',()=>{
 for(const x of [-20,-13,0,20]){
  for(const z of [-6,6]) assert.ok(Math.abs(toWorld(avoidScenery(fromWorld(x,z),0))[1])<=2.551);
  const p=fromWorld(x,-1.7);assert.deepEqual(avoidScenery(p,0),p);
 }
 for(const point of chapters[0].points) assert.ok(nearby(avoidScenery(point,0),point));
});
