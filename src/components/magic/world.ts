import { treePlacements } from './landscape';
export type Point = { x: number; y: number };
export const chapters = [
  { name: "The Spellbound Alley", subtitle: "Di antara cahaya toko sihir, kisah kita dimulai.", short: "Gang Sihir", color: "#263d46", points: [{ x: 380, y: 475, title: "Sepucuk undangan", label: "Surat dari burung hantu" }, { x: 770, y: 425, title: "Dua jiwa, satu mantra", label: "Etalase mantra cinta" }] },
  { name: "The Wizarding Village", subtitle: "Setiap jalan kecil membawa kita lebih dekat.", short: "Pedesaan", color: "#354340", points: [{ x: 390, y: 480, title: "Hari yang dinantikan", label: "Jam desa ajaib" }, { x: 790, y: 420, title: "Tempat kita bertemu", label: "Toko ramuan cinta" }] },
  { name: "The Castle of Forever", subtitle: "Petualangan selamanya dimulai di sini.", short: "Kastil", color: "#303d50", points: [{ x: 420, y: 490, title: "Sebuah janji selamanya", label: "Jembatan harapan" }, { x: 810, y: 390, title: "Jadilah bagian kisah kami", label: "Gerbang perayaan" }] },
];
export function advance(position: Point, direction: Point, seconds: number): Point {
  const length = Math.hypot(direction.x, direction.y);
  if (!length) return position;
  const distance = Math.min(length, 175 * Math.min(seconds, 0.05));
  return { x: Math.max(90, Math.min(1110, position.x + direction.x / length * distance)), y: Math.max(330, Math.min(640, position.y + direction.y / length * distance)) };
}
export const nearby = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y) < 48;

// Keep invitation coordinates independent of the rendering engine.
export const toWorld = (point: Point): [number, number] => [(point.x - 600) * .045, (point.y - 450) * .055];
export const fromWorld = (x: number, z: number): Point => ({ x: Math.max(90, Math.min(1110, x / .045 + 600)), y: Math.max(330, Math.min(640, z / .055 + 450)) });
export const lanternPositions = [-25, -12, 1, 15, 27].map((x, i) => ({ x, z: i % 2 ? -5 : 6, radius: .25 }));
const treeSolids = [0,1,2].map(scene=>treePlacements(scene).map(tree=>({x:tree.x,z:tree.z,radius:tree.scale*.38})));
export const ALLEY_LIMIT = 2.55;
export function avoidScenery(point: Point, scene: number): Point {
  let [x, z] = toWorld(point);
  // Keep both characters clear of the projecting shopfronts; no forest obstacles in the alley.
  if (scene === 0) return fromWorld(x, Math.max(-ALLEY_LIMIT, Math.min(ALLEY_LIMIT, z)));
  const solids = [...treeSolids[scene], ...lanternPositions, { x: -13, z: -1.7, radius: .35 }, ...(scene === 1 ? [{ x: 0, z: -7, radius: 1.4 }] : [])];
  for (const solid of solids) {
    const dx=x-solid.x, dz=z-solid.z, distance=Math.hypot(dx,dz), clearance=solid.radius+.7;
    if (distance < clearance) { x=solid.x+(distance ? dx/distance : 1)*clearance; z=solid.z+(distance ? dz/distance : 0)*clearance; }
  }
  return fromWorld(x,z);
}
