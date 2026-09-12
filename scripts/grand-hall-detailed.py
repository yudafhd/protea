"""Blender MCP builder: batched stylized cathedral library, metres, Z up."""
import bpy, math, random, os
from mathutils import Vector
random.seed(42)
out="/Users/yuda/Documents/Projects/protea/public/assets/models/grand-hall"
os.makedirs(out,exist_ok=True)
scene=bpy.data.scenes.new("Grand Hall • Lantern Library")
bpy.context.window.scene=scene
batches={}
def material(name,color,emission=0):
    m=bpy.data.materials.new("GH_"+name); m.diffuse_color=(*color,1); m.use_nodes=True
    p=m.node_tree.nodes.get("Principled BSDF"); p.inputs["Base Color"].default_value=(*color,1)
    p.inputs["Roughness"].default_value=.88
    if emission:
        p.inputs["Emission Color"].default_value=(*color,1); p.inputs["Emission Strength"].default_value=emission
    batches[name]=[m,[],[]]
    return name
stone=material("blue stone",(.045,.085,.10))
rib=material("weathered arches",(.12,.15,.16))
wood=material("mahogany",(.11,.037,.025))
gold=material("antique brass",(.28,.12,.035))
wax=material("candles",(.85,.57,.20),.16)
flame=material("fire",(1,.38,.045),6)
leaves=[material("leaves"+str(i),c) for i,c in enumerate([(.035,.16,.11),(.09,.27,.16),(.21,.32,.12),(.05,.23,.22)])]
flowers=[material("flowers"+str(i),c) for i,c in enumerate([(.36,.045,.10),(.29,.07,.25),(.54,.19,.10)])]
books=[material("books"+str(i),c) for i,c in enumerate([(.20,.055,.04),(.055,.14,.15),(.27,.17,.06),(.17,.09,.17)])]
tiles=[material("tile"+str(i),c) for i,c in enumerate([(.15,.14,.16),(.11,.16,.18),(.22,.18,.15),(.12,.11,.13)])]
glass=[material("glass"+str(i),c,1.2) for i,c in enumerate([(.035,.32,.35),(.11,.50,.39),(.16,.26,.48),(.43,.12,.20)])]
def mesh(mat,verts,faces):
    batch=batches[mat]; n=len(batch[1]); batch[1].extend(verts); batch[2].extend([tuple(n+i for i in f) for f in faces])
def box(mat,c,s):
    x,y,z=c; a,b,d=[v/2 for v in s]
    mesh(mat,[(x+i*a,y+j*b,z+k*d) for i,j,k in [(-1,-1,-1),(1,-1,-1),(1,1,-1),(-1,1,-1),(-1,-1,1),(1,-1,1),(1,1,1),(-1,1,1)]],[(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)])
def rod(mat,a,b,r,n=8,r2=None):
    a,b=Vector(a),Vector(b); d=(b-a).normalized()
    u=d.cross(Vector((0,0,1)) if abs(d.z)<.9 else Vector((0,1,0))).normalized(); v=d.cross(u)
    verts=[]
    for c,rad in [(a,r),(b,r if r2 is None else r2)]:
        verts += [tuple(c+rad*(u*math.cos(i*math.tau/n)+v*math.sin(i*math.tau/n))) for i in range(n)]
    mesh(mat,verts,[tuple(range(n-1,-1,-1)),tuple(range(n,n*2))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)])
def arch(mat,y,w,z,h,r):
    points=[(w*t,y,z+h*(1-abs(t)**1.5)) for t in [-1+i/16 for i in range(33)]]
    for a,b in zip(points,points[1:]): rod(mat,a,b,r)
def leaf(mat,c,s):
    x,y,z=c; a=random.random()*math.tau
    dx,dy=math.cos(a)*s,math.sin(a)*s
    mesh(mat,[(x-dx,y-dy,z-s*.3),(x-dy*.4,y+dx*.4,z),(x+dx,y+dy,z+s*.3),(x+dy*.4,y-dx*.4,z),(x,y-.08,z+s*.25)],[(0,1,4),(1,2,4),(2,3,4),(3,0,4),(3,2,1,0)])
def vine(points,density=9):
    for a,b in zip(points,points[1:]):
        rod(leaves[0],a,b,.035,5)
        for _ in range(density):
            t=random.random(); c=[a[i]*(1-t)+b[i]*t+random.uniform(-.35,.35) for i in range(3)]
            leaf(random.choice(flowers if random.random()<.16 else leaves),c,random.uniform(.16,.4))
def candle(x,y,z,h=.6):
    rod(wax,(x,y,z),(x,y,z+h),.055,7)
    rod(flame,(x,y,z+h),(x,y,z+h+.20),.06,6,0)
def ring(x,y,z,r):
    for i in range(16):
        a=i*math.tau/16; b=(i+1)*math.tau/16
        rod(gold,(x+r*math.cos(a),y+r*math.sin(a),z),(x+r*math.cos(b),y+r*math.sin(b),z),.028)
def lantern(x,y,z,s):
    z=min(z,23-8*(abs(x)/6.9)**1.5-2.6*s-.2)
    rod(gold,(x,y,z+2.6*s),(x,y,23-8*(abs(x)/6.9)**1.5),.024)
    rod(gold,(x,y,z-.35*s),(x,y,z),.25*s,12,.82*s)
    rod(gold,(x,y,z),(x,y,z+.16*s),.85*s,16)
    for zz in [.16,1.5]: ring(x,y,z+zz*s,.75*s)
    for i in range(10):
        a=i*math.tau/10; dx=.75*s*math.cos(a); dy=.75*s*math.sin(a)
        rod(gold,(x+dx,y+dy,z+.1*s),(x+dx,y+dy,z+1.6*s),.025*s)
        rod(gold,(x+dx,y+dy,z+1.6*s),(x+dx*.6,y+dy*.6,z+2.25*s),.026*s)
        rod(gold,(x+dx*.6,y+dy*.6,z+2.25*s),(x,y,z+2.6*s),.026*s)
    rod(gold,(x,y,z-.75*s),(x,y,z-.35*s),.025,8,.2*s)
    for i in range(7):
        a=i*2.4; r=.44*s*math.sqrt(i/7)
        candle(x+r*math.cos(a),y+r*math.sin(a),z+.17*s,random.uniform(.35,1)*s)
# Monumental hall: 14 m wide, 36 m long, 23 m high.
box(stone,(0,10,-.18),(15,38,.35))
for x in range(-7,7):
    for y in range(-8,29):
        box(random.choice(tiles),(x+.5+(y%2)*.15,y+.5,0),( .97,.97,.025))
for side in [-1,1]:
    box(stone,(side*7.3,10,10),(.5,38,20))
    for y in [-5,1,7,13,19,25]:
        for offset in [-.25,0,.25]:
            rod(rib,(side*(6.9+offset),y,0),(side*(6.9+offset),y,15),.17 if offset else .25)
        box(gold,(side*6.9,y,.4),(.9,1,.8))
        vine([(side*6.45+math.sin(z)*.3,y-.35,z) for z in range(1,19)],6)
    # Wooden bookcases with individual coloured spines and brass shelf edges.
    for y in [-2,4,10,16,22]:
        box(wood,(side*6.9,y,2.6),(.6,4.8,5.2))
        for z in [.25,1.1,1.95,2.8,3.65,4.5,5.25]:
            box(gold,(side*6.52,y,z),(.18,4.85,.065))
            for j in range(17):
                box(random.choice(books),(side*6.5,y-2.2+j*.27,z+.33),(.35,random.uniform(.12,.23),random.uniform(.38,.65)))
        for dy in [-2.4,2.4]: box(wood,(side*6.45,y+dy,2.7),(.25,.16,5.5))
        vine([(side*6.15,y+t,5.5-math.sin((t+2)*.8)*.65) for t in [-2,-1,0,1,2]],20)
    for y in [0,8,16]:
        box(wood,(side*4.6,y,.95),(1.3,4,.18))
        for dy in [-1.5,1.5]: box(wood,(side*4.6,y+dy,.45),(.2,.2,.9))
        for i in range(7): candle(side*4.6+random.uniform(-.4,.4),y+random.uniform(-1.8,1.8),1.05,random.uniform(.25,.85))
# Closed vaulted canopy with layered timber ribs and hanging botanical clusters.
# Preserve the random stream so the rest of the existing hall stays identical.
ceiling_random = random.getstate()
canopy=[material("vault panel"+str(i),c,.12) for i,c in enumerate([
    (.019,.047,.065),(.025,.065,.082),(.032,.073,.085),(.019,.039,.057)])]
timber=material("vault warm timber",(.17,.115,.10))
edge=material("vault edge",(.24,.21,.15))
petal=material("hanging mauve",(.33,.095,.29),.08)
pollen=material("ceiling motes",(.36,.62,.66),1.5)
def roof(x): return 23-8*(abs(x)/6.9)**1.5
for y in range(-8,29,2):
    for i in range(32):
        x=-7.1+i*14.2/32; xx=x+14.2/32
        mesh(canopy[(i+y//2)%4],[(x,y,roof(x)+.25),(xx,y,roof(xx)+.25),(xx,y+2,roof(xx)+.25),(x,y+2,roof(x)+.25)],[(3,2,1,0)])
for y in [-5,1,7,13,19,25]:
    points=[(6.9*t,y,15+8*(1-abs(t)**1.5)) for t in [-1+i/24 for i in range(49)]]
    for i,(a,b) in enumerate(zip(points,points[1:])):
        radius=.32+.055*math.sin(i*.45)
        rod(timber,a,b,radius,8,radius*.97)
        rod(edge,(a[0],a[1]-.26,a[2]-.1),(b[0],b[1]-.26,b[2]-.1),.055,6)
    for side in [-1,1]:
        # Curved secondary branches merge into the apex and create nested arches.
        branch=[(side*(6.75*(1-t)),y+1.4*math.sin(t*math.pi),13+9.75*t**.63) for t in [i/24 for i in range(25)]]
        for i,(a,b) in enumerate(zip(branch,branch[1:])): rod(rib,a,b,.24-i*.005,8)
    vine([(6.4*t,y-.32,15+7.5*(1-abs(t)**1.5)) for t in [-1,-.8,-.6,-.4,-.2,0,.2,.4,.6,.8,1]],18)
for x in [-4.5,-2.4,0,2.4,4.5]:
    rod(timber,(x,-8,roof(x)-.05),(x,29,roof(x)-.05),.17 if x else .26)
random.seed(710)
for y in [-4,2,8,14,20,26]:
    for x in [-5.8,-3.8,-1.3,2.3,5.2]:
        yy=y+random.uniform(-.8,.8); top=roof(x)-.35
        length=random.uniform(1.0,2.7)
        vine([(x+.16*math.sin(t*4),yy,top-t*length) for t in [i/8 for i in range(9)]],9)
        # Wisteria-like tapered pendants: broad overlapping petals, not thin twigs.
        for j in range(10):
            z=top-.5-j*.16; width=.43*(1-j/12)
            for k in range(5):
                angle=k*math.tau/5+j*.8
                cx=x+width*math.cos(angle); cy=yy+width*math.sin(angle)
                mesh(petal,[(cx,cy,z+.17),(cx-.15,cy-.04,z),(cx,cy-.09,z-.23),(cx+.15,cy-.04,z)],[(0,1,2,3)])
for i in range(700):
    x=random.uniform(-6.7,6.7); y=random.uniform(-8,29); z=roof(x)-random.uniform(.5,4)
    r=random.uniform(.012,.037)
    mesh(pollen,[(x-r,y,z),(x+r,y,z),(x,y,z+r*2)],[(0,1,2)])
random.setstate(ceiling_random)
box(stone,(0,29,11.5),(15,.5,23))
for n in range(3): box(rib,(0,25+n*.5,n*.17),(6-n*.5,4-n*.5,.25))
arch(rib,28.4,2.8,4.8,3.6,.3)
arch(gold,28.1,2.45,4.8,3.2,.08)
for x in [-2.8,2.8]: rod(rib,(x,28.4,.2),(x,28.4,4.8),.3)
box(wood,(0,26,1.6),(4.8,1.2,.25))
for x in [-2,2]: box(gold,(x,26,.9),(.25,.65,1.5))
for i in range(23): candle(random.uniform(-2.2,2.2),random.uniform(25.5,26.5),1.75,random.uniform(.25,1.5))
# Stained-glass lancets and glowing lattice behind the altar.
for x in [-1.6,0,1.6]:
    for iz in range(10):
        z=10+iz*.8
        box(random.choice(glass),(x,28.68,z),(1.35,.06,.73))
        rod(gold,(x-.65,28.58,z-.35),(x+.65,28.58,z+.35),.045)
    arch(rib,28.4,.72,17.7,1.5,.09) if x==0 else None
    for dx in [-.75,.75]: rod(rib,(x+dx,28.4,9.5),(x+dx,28.4,18),.08)
for x in [-2,-1,0,1,2]:
    rod(flame,(x,28.2,.4),(x,28.2,4.6),.025)
    for z in [1,2,3,4]:
        rod(gold,(x-.4,28.05,z),(x+.4,28.05,z+1),.04)
        rod(gold,(x+.4,28.05,z),(x-.4,28.05,z+1),.04)
for side in [-1,1]:
    for z in range(9):
        for i in range(45):
            c=(side*(3.9+random.uniform(-.8,.8)),24+random.uniform(-.8,.8),z+random.random())
            leaf(random.choice(flowers if random.random()<.22 else leaves),c,random.uniform(.15,.5))
    vine([(side*(2.8-t*.1),27.4,7+math.sin(t)*.5) for t in range(9)],25)
for args in [(-3.2,0,12,1.65),(3.1,2,12.6,1.6),(-.8,4,17,1.1),(3.5,7,18,1),(-3.4,8,8.5,1.1),(1.2,10,11,1),(-1.5,12,14.3,.9),(2.4,15,8.2,1.05),(-2.3,18,10.4,1),(.4,18,16,.85),(1,22,7,.8),(-3,23,6.2,.9)]:
    lantern(*args)
# One mesh per material keeps draw calls bounded.
for name,(mat,verts,faces) in batches.items():
    if not verts: continue
    data=bpy.data.meshes.new(name); data.from_pydata(verts,[],faces); data.update()
    obj=bpy.data.objects.new(name,data); scene.collection.objects.link(obj); data.materials.append(mat)
camdata=bpy.data.cameras.new("Portrait"); cam=bpy.data.objects.new("Portrait",camdata); scene.collection.objects.link(cam)
cam.location=(0,-12,3.2); cam.rotation_euler=(Vector((0,14,10.5))-cam.location).to_track_quat('-Z','Y').to_euler()
camdata.lens=24; scene.camera=cam
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=out+"/grand-hall.glb",export_format='GLB',use_selection=True,export_cameras=True)
def light(name,loc,color,power,size,target):
    d=bpy.data.lights.new(name,'AREA'); d.energy=power; d.color=color; d.shape='DISK'; d.size=size
    o=bpy.data.objects.new(name,d); scene.collection.objects.link(o); o.location=loc
    o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler()
light("Moon",(0,12,20),(.16,.48,.65),2300,10,(0,12,0))
light("Front",(0,-8,12),(.21,.38,.5),1300,9,(0,14,9))
for x,y,z in [(-3.2,0,12),(3.1,2,12.6),(-3.4,8,8.5),(2.4,15,8.2),(0,26,3)]:
    light("Candle bounce",(x,y,z),(1,.28,.045),450,3,(x,y+2,0))
scene.world=bpy.data.worlds.new("Midnight"); scene.world.use_nodes=True
scene.world.node_tree.nodes["Background"].inputs[0].default_value=(.02,.05,.08,1)
scene.world.node_tree.nodes["Background"].inputs[1].default_value=.25
scene.render.engine='CYCLES'; scene.cycles.samples=24; scene.cycles.use_denoising=True
scene.render.resolution_x=480; scene.render.resolution_y=854; scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG'; scene.render.filepath=out+"/preview.png"
scene.use_nodes=True; nodes=scene.node_tree.nodes; nodes.clear()
a=nodes.new("CompositorNodeRLayers"); b=nodes.new("CompositorNodeGlare"); b.glare_type='FOG_GLOW'; b.threshold=1.2
c=nodes.new("CompositorNodeComposite"); scene.node_tree.links.new(a.outputs["Image"],b.inputs["Image"]); scene.node_tree.links.new(b.outputs["Image"],c.inputs["Image"])
bpy.ops.wm.save_as_mainfile(filepath=out+"/grand-hall.blend",copy=True)
print("READY",len(scene.objects),"objects")
