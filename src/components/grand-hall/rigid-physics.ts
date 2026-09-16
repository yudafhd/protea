import { Box3, Quaternion, Vector3 } from 'three';
import { bodyBounds, PLAYER_HEIGHT, PLAYER_RADIUS, type Body, type Bounds, type Solid, type Vec } from './physics';
import type { HallPoint } from './config';
import type { RigidBody, World } from '@dimforge/rapier3d-compat';

type API = typeof import('@dimforge/rapier3d-compat').default;
let initialization: Promise<API> | undefined;
export async function loadRigidPhysics() {
  initialization ??= import('@dimforge/rapier3d-compat').then(async ({ default: api }) => { await api.init(); return api; });
  return initialization;
}
export type RigidSpec = Bounds & { id: string };
export type RigidProp = RigidSpec & { rigid: RigidBody; center: Vector3; half: Vector3; volume: number; emission: number; previousFall: number };
export type Drop = { position: Vector3; velocity: Vector3; life: number };
export type Puddle = { position: Vector3; amount: number };
export const MAX_DROPS = 96;
export const MAX_PUDDLES = 24;

/** Rotating gravity-driven props. The existing hover props stay in their
 * lightweight solver and enter this world as kinematic collision proxies. */
export class RigidPropsPhysics {
  readonly world: World;
  readonly props = new Map<string, RigidProp>();
  readonly drops: Drop[] = [];
  readonly puddles: Puddle[] = [];
  readonly fixed: Solid[];
  private player: RigidBody;
  private proxies = new Map<string, RigidBody>();
  private disposed = false;

  constructor(private api: API, specs: RigidSpec[], statics: Solid[]) {
    this.world = new api.World({ x: 0, y: -9.81, z: 0 });
    this.world.timestep = 1/120;
    this.fixed = statics.filter(s=>s.id!=='potion-shelf' && s.id!=='cauldron-and-fire');
    const fixedBox = (center: Vec, half: Vec) => this.world.createCollider(api.ColliderDesc.cuboid(half.x,half.y,half.z).setTranslation(center.x,center.y,center.z).setFriction(.65));
    fixedBox({x:0,y:-.02,z:-10},{x:7.4,y:.05,z:19});
    for (const side of [-1,1]) fixedBox({x:side*7.25,y:10,z:-10},{x:.15,y:10,z:19});
    for (const z of [-29,8]) fixedBox({x:0,y:10,z},{x:7.4,y:10,z:.15});
    for (const s of this.fixed) fixedBox({x:(s.min.x+s.max.x)/2,y:(s.min.y+s.max.y)/2,z:(s.min.z+s.max.z)/2},
      {x:(s.max.x-s.min.x)/2,y:(s.max.y-s.min.y)/2,z:(s.max.z-s.min.z)/2});
    this.player=this.world.createRigidBody(api.RigidBodyDesc.kinematicPositionBased().setTranslation(0,(PLAYER_HEIGHT+.04)/2,5));
    this.world.createCollider(api.ColliderDesc.cuboid(PLAYER_RADIUS,(PLAYER_HEIGHT-.04)/2,PLAYER_RADIUS).setFriction(.1),this.player);
    for (const spec of specs) {
      const center=new Vector3().addVectors(spec.min,spec.max).multiplyScalar(.5);
      const half=new Vector3().subVectors(spec.max,spec.min).multiplyScalar(.5);
      const rigid=this.world.createRigidBody(api.RigidBodyDesc.dynamic().setTranslation(center.x,center.y,center.z)
        .setLinearDamping(.3).setAngularDamping(.5).setCcdEnabled(true));
      const prop={...spec,rigid,center,half,volume:spec.id.startsWith('RigidCauldron')?1:0,emission:0,previousFall:0};
      this.props.set(spec.id,prop);
      if(spec.id.startsWith('RigidRack')) {
        // Compound frame: shelf openings stay empty so bottles can fall out.
        const box=(x:number,by:number,bz:number,w:number,d:number,h:number,mass:number)=>{
          this.world.createCollider(api.ColliderDesc.cuboid(w/2,h/2,d/2)
            .setTranslation(x-center.x,bz+.13-center.y,-by-center.z).setMass(mass).setFriction(.7),rigid);
        };
        box(-4.55,1.7,2.15,3.15,.36,4.3,12);
        for(const x of [-6.15,-2.95])box(x,1.33,2.2,.17,.8,4.6,3);
        for(const z of [.45,1.65,2.85,4.2])box(-4.55,1.25,z,3.3,1,.14,2);
      } else {
        this.world.createCollider(api.ColliderDesc.cylinder(half.y,Math.min(half.x,half.z))
          .setMass(spec.id.startsWith('RigidCauldron')?7:.35).setFriction(.65).setRestitution(.12),rigid);
      }
    }
  }

  get solids(): Solid[] {
    return [...this.props.values()].map(prop=>{
      const q=new Quaternion().copy(prop.rigid.rotation());
      const pos=prop.rigid.translation();
      const box=new Box3();
      for(const x of [-1,1])for(const y of [-1,1])for(const z of [-1,1]) {
        box.expandByPoint(new Vector3(x*prop.half.x,y*prop.half.y,z*prop.half.z).applyQuaternion(q).add(pos));
      }
      return {id:prop.id,min:{...box.min},max:{...box.max}};
    });
  }

  push(id:string,direction:Vec,strength:number,point?:Vec) {
    const prop=this.props.get(id);if(!prop)return;
    const impulse=new Vector3(direction.x,direction.y,direction.z).normalize().multiplyScalar(strength);
    const at=point??new Vector3().copy(prop.rigid.translation()).add(new Vector3(0,prop.half.y*.75,0));
    prop.rigid.applyImpulseAtPoint(impulse,at,true);
  }

  step(h:number,bodies:Iterable<Body>,player:HallPoint) {
    if(this.disposed)return;
    this.world.timestep=h;
    this.player.setNextKinematicTranslation({x:player.x,y:(player.y??0)+(PLAYER_HEIGHT+.04)/2,z:player.z});
    for(const b of bodies) {
      if(!b.solid)continue;
      const bounds=bodyBounds(b);
      const center={x:(bounds.min.x+bounds.max.x)/2,y:(bounds.min.y+bounds.max.y)/2,z:(bounds.min.z+bounds.max.z)/2};
      let proxy=this.proxies.get(b.id);
      if(!proxy) {
        proxy=this.world.createRigidBody(this.api.RigidBodyDesc.kinematicPositionBased().setTranslation(center.x,center.y,center.z));
        this.world.createCollider(this.api.ColliderDesc.cuboid((b.max.x-b.min.x)/2,(b.max.y-b.min.y)/2,(b.max.z-b.min.z)/2).setFriction(.5),proxy);
        this.proxies.set(b.id,proxy);
      }
      proxy.setNextKinematicTranslation(center);
    }
    this.world.step();
    for(const prop of this.props.values())if(prop.id.startsWith('RigidCauldron'))this.spill(prop,h);
    for(let i=this.drops.length-1;i>=0;i--) {
      const drop=this.drops[i],previous=drop.position.clone();
      drop.velocity.y-=9.81*h;drop.position.addScaledVector(drop.velocity,h);drop.life-=h;
      let surface=.032;
      for(const s of this.fixed) {
        if(drop.position.x>=s.min.x&&drop.position.x<=s.max.x&&drop.position.z>=s.min.z&&drop.position.z<=s.max.z&&previous.y>=s.max.y-.02)surface=Math.max(surface,s.max.y+.006);
      }
      if(drop.position.y<=surface) {
        const position=new Vector3(drop.position.x,surface+.004,drop.position.z);
        let puddle=this.puddles.find(p=>Math.abs(p.position.y-position.y)<.05&&p.position.distanceTo(position)<.5);
        if(!puddle&&this.puddles.length<MAX_PUDDLES){puddle={position,amount:0};this.puddles.push(puddle);}
        if(puddle)puddle.amount=Math.min(1,puddle.amount+.025);
        this.drops.splice(i,1);
      } else if(drop.life<=0)this.drops.splice(i,1);
    }
  }

  private spill(prop:RigidProp,h:number) {
    const rotation=new Quaternion().copy(prop.rigid.rotation());
    const up=new Vector3(0,1,0).applyQuaternion(rotation);
    const tilt=Math.acos(Math.max(-1,Math.min(1,up.y)));
    const impact=prop.previousFall < -1.8 && prop.rigid.linvel().y > -.3;
    prop.previousFall=prop.rigid.linvel().y;
    if(prop.volume<=0|| (tilt<.45&&!impact))return;
    const amount=Math.min(prop.volume,h*Math.max(.05,(tilt-.35)*.45)+(impact?.06:0));
    prop.volume-=amount;prop.emission+=amount*90;
    const down=new Vector3(0,-1,0).applyQuaternion(rotation.clone().invert());
    const radial=new Vector3(down.x,0,down.z);
    if(radial.lengthSq()<.001)radial.set(0,0,1);
    radial.normalize();
    const rim=radial.clone().multiplyScalar(.52).add(new Vector3(0,prop.half.y-.04,0)).applyQuaternion(rotation).add(prop.rigid.translation());
    const exit=radial.applyQuaternion(rotation).multiplyScalar(.6).add(prop.rigid.linvel());
    while(prop.emission>=1) {
      prop.emission-=1;
      if(this.drops.length>=MAX_DROPS)continue;
      this.drops.push({position:rim.clone(),velocity:exit.clone().add(new Vector3(Math.sin(prop.volume*123)*.13,.06,Math.cos(prop.volume*99)*.13)),life:4});
    }
  }

  dispose(){if(!this.disposed){this.world.free();this.disposed=true;}}
}
