import type { HallPoint } from './config';
import type { RigidPropsPhysics } from './rigid-physics';

export type Vec = { x: number; y: number; z: number };
export type Bounds = { min: Vec; max: Vec };
export type Solid = Bounds & { id: string };
export type Body = Solid & {
  offset: Vec; velocity: Vec; mass: number; phase: number; solid: boolean;
};
const axes = ['x', 'y', 'z'] as const;
type Axis = typeof axes[number];
const zero = (): Vec => ({ x: 0, y: 0, z: 0 });
const EPS = .0001;
// Keep impacts far enough from the viewpoint to see tipping and spilled liquid.
export const PLAYER_RADIUS = .8;
export const PLAYER_HEIGHT = 2.01;
export const HALL_LIMITS = { minX: -6.35, maxX: 6.35, minZ: -23.8, maxZ: 5.5 };
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const playerBounds = (p: HallPoint): Bounds => ({
  min: { x: p.x - PLAYER_RADIUS, y: (p.y ?? 0) + .04, z: p.z - PLAYER_RADIUS },
  max: { x: p.x + PLAYER_RADIUS, y: (p.y ?? 0) + PLAYER_HEIGHT, z: p.z + PLAYER_RADIUS },
});
export const bodyBounds = (b: Body): Bounds => ({
  min: { x: b.min.x + b.offset.x, y: b.min.y + b.offset.y, z: b.min.z + b.offset.z },
  max: { x: b.max.x + b.offset.x, y: b.max.y + b.offset.y, z: b.max.z + b.offset.z },
});
export function overlaps(a: Bounds, b: Bounds) {
  return axes.every(k => a.max[k] > b.min[k] + EPS && a.min[k] < b.max[k] - EPS);
}

// Swept AABB: stop at the first surface even for a large requested displacement.
function sweep(a: Bounds, obstacles: Bounds[], axis: Axis, movement: number) {
  if (Math.abs(movement) < 1e-12) return { distance: 0, hit: -1 };
  let distance = movement;
  let hit = -1;
  const cross = axes.filter(k => k !== axis);
  obstacles.forEach((b, i) => {
    if (!cross.every(k => a.max[k] > b.min[k] + EPS && a.min[k] < b.max[k] - EPS)) return;
    if (movement > 0 && a.max[axis] <= b.min[axis] + EPS) {
      const gap = Math.max(0, b.min[axis] - a.max[axis] - EPS);
      if (gap < distance) { distance = gap; hit = i; }
    } else if (movement < 0 && a.min[axis] >= b.max[axis] - EPS) {
      const gap = Math.min(0, b.max[axis] - a.min[axis] + EPS);
      if (gap > distance) { distance = gap; hit = i; }
    }
  });
  return { distance, hit };
}

// Static props are batched by material in the GLB, so their compound bounds are
// taken from the Blender layout (Blender x,y,z -> Three x,z,-y).
export function hallSolids(): Solid[] {
  const solids: Solid[] = [];
  const box = (id: string, x: number, y: number, z: number, w: number, d: number, h: number) => {
    solids.push({ id, min: { x: x-w/2, y: z-h/2, z: -y-d/2 }, max: { x: x+w/2, y: z+h/2, z: -y+d/2 } });
  };
  for (const side of [-1, 1]) {
    for (const y of [-2,4,10,16,22]) box(`bookcase-${side}-${y}`,side*6.65,y,2.7,.9,4.9,5.5);
    for (const y of [-5,1,7,13,19,25]) box(`column-${side}-${y}`,side*6.9,y,7.5,1,1,15);
    for (const y of (side===-1?[8,16]:[0,8,16])) box(`candle-console-${side}-${y}`,side*5.8,y,.95,.8,4,1.9);
    for (const row of [0,10]) {
      for (const [offset,h] of [[-.25,.5],[.03,.8],[.28,.4]]) {
        box(`aisle-candle-${side}-${row}-${offset}`,side*1.82,-4+row*2.1+offset,.04+h/2,.12,.12,h);
      }
    }
  }
  box('potion-shelf',-4.55,1.25,2.25,3.4,1.05,4.5);
  box('hearth',-4.35,-.4,.17,2.4,1.65,.34);
  box('hearth-logs',-4.35,-.4,.48,1.4,1.4,.3);
  box('cauldron-and-fire',-4.35,-.4,1,1.4,1.4,1.35);
  box('writing-desk',4.35,-.1,.58,2.65,1.8,1.16);
  box('stacked-books',5.1,.15,1.4,.65,.74,.6);
  box('sorting-hat',4.95,.1,2.22,1.3,1.2,1.1);
  box('desk-candles',5.45,-.55,1.5,.14,.14,.85);
  box('owl',5.65,.65,2.05,.65,.65,.95);
  box('owl-perch',5.65,.7,.8,.12,.12,1.6);
  box('altar-step',0,26.4,.3,9,4.8,.6);
  return solids;
}

export class HallPhysics {
  readonly statics = hallSolids();
  readonly bodies = new Map<string, Body>();
  rigid?: RigidPropsPhysics;
  ready = false;
  player: HallPoint = { x: 0, y: 0, z: 5 };
  private time = 0;
  private accumulator = 0;
  private reduced = false;

  addBody(id: string, bounds: Bounds) {
    const mass = id.startsWith('FloatTable') ? 80 : id.startsWith('FloatChair') ? 8 : id.startsWith('FloatBook') ? 1.5 : .3;
    const body: Body = { ...bounds, id, mass, phase: this.bodies.size*1.73, offset: zero(), velocity: zero(), solid: !id.startsWith('FloatBubble') };
    this.bodies.set(id, body);
    return body;
  }
  clear() { this.rigid?.dispose(); this.rigid=undefined; this.bodies.clear(); this.ready = false; this.time = 0; this.accumulator = 0; }

  impulse(id: string, direction: Vec, strength = 1.5, point?: Vec) {
    if(this.reduced)return;
    if(this.rigid?.props.has(id)) {
      this.rigid.push(id,direction,id.startsWith('RigidRack')?35:id.startsWith('RigidCauldron')?6:strength,point);
      return;
    }
    const body = this.bodies.get(id);
    if (!body || this.reduced) return;
    const length = Math.hypot(direction.x, direction.y, direction.z) || 1;
    for (const k of axes) body.velocity[k] = clamp(body.velocity[k] + direction[k]/length*strength/body.mass, -2, 2);
  }

  step(dt: number, reduced = false) {
    this.reduced = reduced;
    if (!this.ready) return;
    if (reduced) { for (const b of this.bodies.values()) b.velocity = zero(); return; }
    this.accumulator += clamp(dt, 0, .05);
    const h = 1/120;
    while (this.accumulator >= h) {
      this.accumulator -= h; this.time += h;
      const fixed = this.rigid ? [...this.rigid.fixed,...this.rigid.solids] : this.statics;
      for (const body of this.bodies.values()) {
        const others = Array.from(this.bodies.values()).filter(b => b !== body && b.solid);
        const obstacles: Bounds[] = body.solid ? [...fixed, playerBounds(this.player),
          ...others.map(bodyBounds)] : [];
        for (const axis of axes) {
          const amplitude = body.mass > 10 ? .055 : .10;
          const target = axis === 'y' ? Math.sin(this.time*.65+body.phase)*amplitude : 0;
          // Lift only maintains height. Horizontal drag dissipates momentum
          // without pulling a pushed prop back to its original location.
          const gravity = axis === 'y' ? -9.81 : 0;
          const lift = axis === 'y' ? 9.81 : 0;
          const acceleration = gravity+lift+(axis==='y'?12*(target-body.offset.y)-6*body.velocity.y:-1.4*body.velocity[axis]);
          body.velocity[axis] += acceleration*h;
          const result = sweep(bodyBounds(body),obstacles,axis,body.velocity[axis]*h);
          body.offset[axis] += result.distance;
          if (result.hit >= 0) {
            const other = others[result.hit-fixed.length-1];
            if (other) {
              const relative = body.velocity[axis]-other.velocity[axis];
              const impulse = 1.12*relative/(1/body.mass+1/other.mass);
              body.velocity[axis] -= impulse/body.mass;
              other.velocity[axis] += impulse/other.mass;
            } else body.velocity[axis] *= -.12;
          }
          const bounds = bodyBounds(body);
          const low = axis === 'y' ? .04 : axis === 'x' ? -7 : -29;
          const high = axis === 'y' ? 21 : axis === 'x' ? 7 : 8;
          if (bounds.min[axis] < low) { body.offset[axis] += low-bounds.min[axis]; body.velocity[axis] = Math.abs(body.velocity[axis])*.12; }
          if (bounds.max[axis] > high) { body.offset[axis] -= bounds.max[axis]-high; body.velocity[axis] = -Math.abs(body.velocity[axis])*.12; }
        }
      }
      this.rigid?.step(h,this.bodies.values(),this.player);
    }
  }

  movePlayer(from: HallPoint, requested: HallPoint): HallPoint {
    if (!this.ready) return from;
    const point: Vec = { x: from.x, y: from.y ?? 0, z: from.z };
    const target: Vec = { x: clamp(requested.x,HALL_LIMITS.minX,HALL_LIMITS.maxX),
      y: clamp(requested.y ?? 0,0,20.2), z: clamp(requested.z,HALL_LIMITS.minZ,HALL_LIMITS.maxZ) };
    const bodyList = Array.from(this.bodies.values()).filter(b=>b.solid);
    const fixed=this.rigid ? this.rigid.fixed : this.statics;
    const rigidSolids=this.rigid?.solids??[];
    const obstacles = [...fixed, ...bodyList.map(bodyBounds),...rigidSolids];
    // Short segments prevent diagonal corner-cutting. Axis sweeps allow sliding.
    const steps = Math.max(1,Math.ceil(Math.hypot(target.x-point.x,target.y-point.y,target.z-point.z)/.08));
    const delta = { x:(target.x-point.x)/steps,y:(target.y-point.y)/steps,z:(target.z-point.z)/steps };
    for (let i=0;i<steps;i++) {
      for (const axis of ['y','x','z'] as const) {
        const result = sweep(playerBounds(point),obstacles,axis,delta[axis]);
        point[axis] += result.distance;
        if (result.hit >= fixed.length) {
          const index=result.hit-fixed.length;
          if(index<bodyList.length) this.impulse(bodyList[index].id,{...zero(),[axis]:delta[axis]},.12);
          else if(!this.reduced) {
            const solid=rigidSolids[index-bodyList.length];
            this.rigid?.push(solid.id,{...zero(),[axis]:delta[axis]},solid.id.startsWith('RigidRack')?1.4:.8,
              {x:point.x,y:point.y+1.4,z:point.z});
          }
        }
      }
      const ceiling = 23-8*(Math.abs(point.x)/6.9)**1.5-PLAYER_HEIGHT-.25;
      point.y = Math.min(point.y,ceiling);
    }
    this.player = point;
    return point;
  }
}
