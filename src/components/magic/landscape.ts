export const trailZ = (x:number) => 1.8-Math.sin((x+14)*.095)*3;
export function terrainHeight(x:number,z:number) {
 // The invitation's walkable meadow stays level; hills rise around its boundary.
 const border=Math.max(0,Math.abs(z-1.5)-12);
 return (Math.sin(x*.085+z*.12)*2.4+Math.sin(x*.18-z*.055)*1.2+3.6)*Math.min(1,border*.085);
}
export function seededRandom(seed:number) {
 let state=seed>>>0;
 return ()=>{state=(Math.imul(1664525,state)+1013904223)>>>0;return state/4294967296;};
}
export function treePlacements(scene:number) {
 const random=seededRandom(412+scene), trees:{x:number;z:number;scale:number;seed:number}[]=[];
 for(let i=0;i<38;i++){
  const x=-40+(i%19)*4.8+(random()-.5)*2;
  const z=i<19?-6-random()*5:8.5+random()*6;
  if(scene!==0&&x>-25&&x<28&&z<0)continue;
  trees.push({x,z,scale:.8+random()*.6,seed:i*93+7});
 }
 return trees;
}
