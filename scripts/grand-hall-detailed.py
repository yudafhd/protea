"""Blender MCP builder: batched stylized cathedral library, metres, Z up."""
import bpy, math, random, os, runpy
from contextlib import contextmanager
from mathutils import Vector
random.seed(42)
out="/Users/yuda/Documents/Projects/protea/public/assets/models/grand-hall"
os.makedirs(out,exist_ok=True)
scene=bpy.data.scenes.new("Grand Hall • The Astral Academy")
bpy.context.window.scene=scene
batches={}
def material(name,color,emission=0):
    m=bpy.data.materials.new("GH_"+name); m.diffuse_color=(*color,1); m.use_nodes=True
    p=next(n for n in m.node_tree.nodes if n.type=="BSDF_PRINCIPLED"); p.inputs["Base Color"].default_value=(*color,1)
    p.inputs["Roughness"].default_value=.88
    if emission:
        p.inputs["Emission Color"].default_value=(*color,1); p.inputs["Emission Strength"].default_value=emission
    batches[name]=[m,[],[]]
    return name
stone=material("blue stone",(.19,.17,.145))
rib=material("weathered arches",(.34,.29,.235))
wood=material("mahogany",(.11,.037,.025))
gold=material("antique brass",(.48,.255,.085))
wax=material("candles",(.85,.57,.20),.16)
flame=material("fire",(1,.38,.045),6)
leaves=[material("leaves"+str(i),c) for i,c in enumerate([(.035,.16,.11),(.09,.27,.16),(.21,.32,.12),(.05,.23,.22)])]
flowers=[material("flowers"+str(i),c) for i,c in enumerate([(.36,.045,.10),(.29,.07,.25),(.54,.19,.10)])]
books=[material("books"+str(i),c) for i,c in enumerate([(.20,.055,.04),(.055,.14,.15),(.27,.17,.06),(.17,.09,.17)])]
tiles=[material("tile"+str(i),c) for i,c in enumerate([(.15,.14,.16),(.11,.16,.18),(.22,.18,.15),(.12,.11,.13)])]
glass=[material("glass"+str(i),c,.7) for i,c in enumerate([(.018,.13,.19),(.035,.21,.22),(.025,.075,.16),(.25,.14,.045)])]
jewels=[material("lantern jewel "+str(i),c,1.6) for i,c in enumerate([(.035,.43,.39),(.85,.32,.045),(.45,.035,.065),(.13,.22,.55)])]
def mesh(mat,verts,faces):
    batch=batches[mat]; n=len(batch[1]); batch[1].extend(verts); batch[2].extend([tuple(n+i for i in f) for f in faces])
@contextmanager
def floating_object(name,position,angle=0):
    offsets={key:(len(value[1]),len(value[2])) for key,value in batches.items()}
    yield
    root=bpy.data.objects.new(name,None); scene.collection.objects.link(root)
    root.location=position; root.rotation_euler.z=angle
    for key,(mat,verts,faces) in batches.items():
        nv,nf=offsets.get(key,(0,0))
        if len(verts)==nv: continue
        data=bpy.data.meshes.new(name+" "+key)
        data.from_pydata(verts[nv:],[],[tuple(i-nv for i in face) for face in faces[nf:]]); data.update()
        obj=bpy.data.objects.new(name+" "+key,data); scene.collection.objects.link(obj)
        obj.parent=root; data.materials.append(mat)
        del verts[nv:]; del faces[nf:]
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
    z=min(z,23-8*(abs(x)/6.9)**1.5-2.7*s)
    rod(gold,(x,y,z+2.35*s),(x,y,23-8*(abs(x)/6.9)**1.5),.014)
    jewel=jewels[int(abs(x*3+y))%len(jewels)]
    profile=[(-.3,.04),(0,.42),(.3,.6),(1.25,.43),(2.1,.13),(2.35,.025)]
    for (h,r),(hh,rr) in zip(profile,profile[1:]):
        rod(jewel,(x,y,z+h*s),(x,y,z+hh*s),r*s,12,rr*s)
        for i in range(8):
            a=i*math.tau/8
            rod(gold,(x+r*s*math.cos(a),y+r*s*math.sin(a),z+h*s),(x+rr*s*math.cos(a),y+rr*s*math.sin(a),z+hh*s),.015*s,6)
    for h,r in [(0,.43),(.3,.61),(1.25,.44)]: ring(x,y,z+h*s,r*s)
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
        vine([(side*6.45+math.sin(z)*.18,y-.35,z) for z in range(5,13)],3)
    # Wooden bookcases with individual coloured spines and brass shelf edges.
    for y in [-2,4,10,16,22]:
        box(wood,(side*6.9,y,2.6),(.6,4.8,5.2))
        for z in [.25,1.1,1.95,2.8,3.65,4.5,5.25]:
            box(gold,(side*6.52,y,z),(.18,4.85,.065))
            for j in range(17):
                box(random.choice(books),(side*6.5,y-2.2+j*.27,z+.33),(.35,random.uniform(.12,.23),random.uniform(.38,.65)))
        for dy in [-2.4,2.4]: box(wood,(side*6.45,y+dy,2.7),(.25,.16,5.5))
        vine([(side*6.15,y+t,5.5-math.sin((t+2)*.8)*.4) for t in [-2,-1,0,1,2]],7)
    for y in ([8,16] if side==-1 else [0,8,16]):
        box(wood,(side*5.8,y,.95),(.8,4,.18))
        for dy in [-1.5,1.5]: box(wood,(side*5.8,y+dy,.45),(.2,.2,.9))
        for i in range(7): candle(side*5.8+random.uniform(-.3,.3),y+random.uniform(-1.8,1.8),1.05,random.uniform(.25,.85))
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
    vine([(6.4*t,y-.32,15+7.5*(1-abs(t)**1.5)) for t in [-1,-.8,-.6,-.4,-.2,0,.2,.4,.6,.8,1]],4)
for x in [-4.5,-2.4,0,2.4,4.5]:
    rod(timber,(x,-8,roof(x)-.05),(x,29,roof(x)-.05),.17 if x else .26)
random.seed(710)
for y in [2,14,26]:
    for x in [-5.8,5.2]:
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
for n in range(3):
    front=24+n*.45
    box(rib,(0,(front+28.8)/2,.1+n*.2),(9-n*.5,28.8-front,.2))
    box(gold,(0,front,.19+n*.2),(9-n*.5,.045,.025))
arch(rib,28.4,2.8,4.8,3.6,.3)
arch(gold,28.1,2.45,4.8,3.2,.08)
for x in [-2.8,2.8]: rod(rib,(x,28.4,.2),(x,28.4,4.8),.3)
box(wood,(0,26,1.6),(4.8,1.2,.25))
for x in [-2,2]: box(gold,(x,26,.9),(.25,.65,1.5))
for i in range(23): candle(random.uniform(-2.2,2.2),random.uniform(25.5,26.5),1.75,random.uniform(.25,1.5))
# Tall pointed window with subdued blue glass and warm tracery.
for iz in range(28):
    z=7.2+iz*.4
    half=2.75 if z<12.6 else 2.75*max(0,(18.4-z)/5.8)**(1/1.5)
    for ix in range(10):
        left=-2.75+ix*.55; right=left+.55
        a=max(left,-half); b=min(right,half)
        if b>a:
            box(glass[(ix+iz//3)%3],((a+b)/2,28.64,z),((b-a)*.97,.04,.385))
for x in [-2.75,-.92,.92,2.75]: rod(gold,(x,28.48,7),(x,28.48,12.6),.045,8)
arch(rib,28.4,2.85,12.6,6,.16)
arch(gold,28.3,2.65,12.6,5.6,.05)
for x in [-1.83,0,1.83]:
    for i in range(24):
        t=-1+i/12; tt=-1+(i+1)/12
        rod(gold,(x+.88*t,28.35,12.5+2.2*(1-abs(t)**1.5)),(x+.88*tt,28.35,12.5+2.2*(1-abs(tt)**1.5)),.035)
for side in [-1,1]:
    for z in range(3):
        for i in range(15):
            c=(side*(3.9+random.uniform(-.8,.8)),24+random.uniform(-.8,.8),z+random.random())
            leaf(random.choice(flowers if random.random()<.22 else leaves),c,random.uniform(.15,.5))
    vine([(side*(2.8-t*.1),27.4,7+math.sin(t)*.5) for t in range(9)],25)
for args in [(-3.1,-1,8.5,1),(2.8,0,10,1.05),(-.7,3,13,1),(3.5,7,14,.65),(-3.4,8,7,.65),(1.2,10,9,.8),(-1.5,12,12,.65),(2.4,15,7,.7),(-2.3,18,8.5,.6),(.4,18,13,.7),(1,22,6,.6),(-3,23,6.2,.65)]:
    lantern(*args)
# Floating banquet leaves a clear central aisle.
random.seed(20260916)
ivory=material("wedding ivory",(.84,.73,.54))
burgundy=material("wedding burgundy",(.25,.018,.042))
rose=material("wedding rose",(.55,.035,.055))
def bouquet(x,y,z,scale=1):
    for i in range(15):
        a=i*2.4; radius=.30*scale*math.sqrt(i/15)
        c=(x+radius*math.cos(a),y+radius*math.sin(a),z+random.uniform(-.12,.18)*scale)
        leaf(random.choice(leaves),c,.27*scale)
    for i in range(9):
        a=i*2.4; radius=.24*scale*math.sqrt(i/9)
        cx=x+radius*math.cos(a); cy=y+radius*math.sin(a); cz=z+.13*scale
        mat=ivory if i%3 else rose
        for j in range(6):
            angle=j*math.tau/6
            rod(mat,(cx,cy,cz),(cx+.095*scale*math.cos(angle),cy+.095*scale*math.sin(angle),cz+.065*scale),.065*scale,5,.04*scale)
for side in [-1,1]:
    with floating_object("FloatTable_"+str(side),(side*3.8,11,.22)):
        box(wood,(0,0,1.1),(1.65,16,.18))
        box(burgundy,(0,0,1.2),(.55,15.8,.018))
        for x in [-.79,.79]: box(gold,(x,0,1.19),(.025,16,.025))
        for y in [-6,6]:
            box(wood,(0,y,.54),(.24,.55,1.08))
            box(wood,(0,y,.08),(1.3,.65,.16))
        for y in [-6,0,6]:
            bouquet(0,y,1.27,.65)
            for x in [-.52,.52]:
                rod(gold,(x,y,1.2),(x,y,1.225),.24,24)
                rod(ivory,(x,y,1.226),(x,y,1.245),.205,24)
                rod(gold,(x,y+.4,1.2),(x,y+.4,1.35),.024)
                rod(gold,(x,y+.4,1.35),(x,y+.4,1.49),.035,12,.09)
                box(gold,(x+.28,y,1.22),(.018,.35,.016))
                box(gold,(x-.28,y,1.22),(.018,.35,.016))
            candle(0,y+.8,1.21,.45)
    for seat in range(6):
        x=side*3.8+(-1.25 if seat<3 else 1.25)
        y=5+(seat%3)*6
        angle=-math.pi/2 if x<side*3.8 else math.pi/2
        with floating_object("FloatChair_"+str(side)+"_"+str(seat),(x,y,.24),angle):
            box(wood,(0,0,.52),(.65,.65,.13))
            box(burgundy,(0,0,.61),(.58,.58,.07))
            for dx in [-.25,.25]:
                for dy in [-.25,.25]:
                    box(wood,(dx,dy,.27),(.065,.065,.54))
                rod(wood,(dx,-.28,.55),(dx,-.28,1.22),.045)
            box(wood,(0,-.28,1.16),(.61,.08,.12))
            for dx in [-.14,0,.14]: box(gold,(dx,-.28,.91),(.025,.035,.4))
    for row in [0,10]:
        y=-4+row*2.1
        for offset,h in [(-.25,.5),(.03,.8),(.28,.4)]:
            candle(side*1.82,y+offset,.04,h)
    # Large forward altar arch frames the existing rear altar and stained glass.
    x=side*3.65
    box(rib,(x,25.25,.82),(.8,.8,.44))
    rod(gold,(x,25.25,1.04),(x,25.25,5.4),.13,12)
    for z in [1.25,5.4]: bouquet(x,25.15,z,.75)
arch(gold,25.25,3.65,5.4,3.4,.14)
arch(gold,25.25,3.35,5.4,3.05,.055)
for i in range(5):
    t=-1+2*i/4
    bouquet(3.65*t,25.2,5.4+3.4*(1-abs(t)**1.5),.65)
for i in range(24):
    with floating_object("FloatCandle_"+str(i),(-1.4+(i%4)*.9,-3+(i//4)*4.3,3.4+(i%3)*.65)):
        candle(0,0,0,.32+(i%4)*.08)
# Large charcoal slate slabs with fine joints and subtle cleft surfaces.
# Shallow mesh relief survives GLB export without overlaid grain artifacts.
slate=[material("charcoal slate "+str(i),c) for i,c in enumerate([
    (.045,.048,.054),(.05,.053,.059),(.055,.057,.062),(.048,.05,.056)])]
grout=material("slate joints",(.022,.024,.027))
for mat in slate:
    shader=next(n for n in batches[mat][0].node_tree.nodes if n.type=="BSDF_PRINCIPLED")
    shader.inputs["Roughness"].default_value=.72
floor_rng=random.Random(714)
box(grout,(0,10.5,.014),(14,37,.003))
for col in range(14):
    x=-7+col
    for row in range(-1,25):
        start=-8+row*1.5+(col%2)*.75
        y0=max(-8,start); y1=min(29,start+1.5)
        if y1<=y0: continue
        verts=[]; faces=[]
        for j in range(7):
            for i in range(7):
                edge=i in [0,6] or j in [0,6]
                z=.019 if edge else .021+floor_rng.uniform(-.001,.001)
                verts.append((x+.004+.992*i/6,y0+.004+(y1-y0-.008)*j/6,z))
        for j in range(6):
            for i in range(6):
                a=j*7+i
                faces.extend([(a,a+1,a+8),(a,a+8,a+7)])
        mesh(floor_rng.choice(slate),verts,faces)
# Magic-school aisle: engraved astronomical seals and invented geometric runes.
sigil=material("aged gold floor inlay",(.50,.30,.10),.12)
seal=material("midnight seal stone",(.025,.035,.055))
shader=next(n for n in batches[sigil][0].node_tree.nodes if n.type=="BSDF_PRINCIPLED")
shader.inputs["Metallic"].default_value=.55
shader.inputs["Roughness"].default_value=.42
def floor_line(a,b,width=.018):
    dx=b[0]-a[0]; dy=b[1]-a[1]; length=math.hypot(dx,dy)
    nx=-dy/length*width/2; ny=dx/length*width/2
    mesh(sigil,[(a[0]-nx,a[1]-ny,.027),(b[0]-nx,b[1]-ny,.027),(b[0]+nx,b[1]+ny,.027),(a[0]+nx,a[1]+ny,.027)],[(0,1,2,3)])
def seal_ring(y,r,width=.018):
    for i in range(96):
        a=i*math.tau/96; b=(i+1)*math.tau/96
        floor_line((r*math.cos(a),y+r*math.sin(a)),(r*math.cos(b),y+r*math.sin(b)),width)
for x in [-1.62,-1.52,1.52,1.62]: floor_line((x,-8),(x,24),.015)
for y in [-3,5,13,21]:
    verts=[(0,y,.024)]+[(1.4*math.cos(i*math.tau/96),y+1.4*math.sin(i*math.tau/96),.024) for i in range(96)]
    mesh(seal,verts,[(0,i+1,(i+1)%96+1) for i in range(96)])
    for radius in [1.38,1.3,1.02,.23]: seal_ring(y,radius)
    for i in range(8):
        a=i*math.tau/8; radius=.94 if i%2==0 else .67
        mesh(sigil,[(0,y,.027),(.18*math.cos(a-.55),y+.18*math.sin(a-.55),.027),(radius*math.cos(a),y+radius*math.sin(a),.027),(.18*math.cos(a+.55),y+.18*math.sin(a+.55),.027)],[(0,1,2,3)])
    for i in range(16):
        a=i*math.tau/16
        def rune_point(u,v): return ((1.15+v)*math.cos(a)-u*math.sin(a),y+(1.15+v)*math.sin(a)+u*math.cos(a))
        for p,q in [((0,-.075),(0,.075)),((-.05,.025),(0,.075)),((0,.075),(.05,.025)),((0,-.025),(.05,-.06))]:
            floor_line(rune_point(*p),rune_point(*q),.014)
    for offset in [-2.5,2.5]:
        cy=y+offset
        for a,b in [((0,cy-.25),(.15,cy)),((.15,cy),(0,cy+.25)),((0,cy+.25),(-.15,cy)),((-.15,cy),(0,cy-.25))]: floor_line(a,b)
runpy.run_path(os.path.join(os.path.dirname(__file__),"grand-hall-academy.py"),init_globals=globals())
# One mesh per material keeps draw calls bounded.
for name,(mat,verts,faces) in batches.items():
    if not verts: continue
    data=bpy.data.meshes.new(name); data.from_pydata(verts,[],faces); data.update()
    obj=bpy.data.objects.new(name,data); scene.collection.objects.link(obj); data.materials.append(mat)
camdata=bpy.data.cameras.new("Portrait"); cam=bpy.data.objects.new("Portrait",camdata); scene.collection.objects.link(cam)
cam.location=(0,-7,2.8); cam.rotation_euler=(Vector((0,13,7.8))-cam.location).to_track_quat('-Z','Y').to_euler()
camdata.lens=24; scene.camera=cam
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=out+"/grand-hall.pending.glb",export_format='GLB',use_selection=True,export_cameras=True)
os.replace(out+"/grand-hall.pending.glb",out+"/grand-hall.glb")
def light(name,loc,color,power,size,target):
    d=bpy.data.lights.new(name,'AREA'); d.energy=power; d.color=color; d.shape='DISK'; d.size=size
    o=bpy.data.objects.new(name,d); scene.collection.objects.link(o); o.location=loc
    o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler()
light("Moon",(0,12,20),(.36,.48,.65),1700,10,(0,12,0))
light("Front",(0,-8,10),(1,.75,.46),1800,9,(0,14,6))
light("Altar",(0,23,7),(1,.63,.28),1300,6,(0,28,9))
light("Apothecary",(-4,-1,4),(.35,1,.7),150,2,(-4,1,1))
for x,y,z in [(-3.2,0,12),(3.1,2,12.6),(-3.4,8,8.5),(2.4,15,8.2),(0,26,3)]:
    light("Candle bounce",(x,y,z),(1,.48,.16),650,3,(x,y+2,0))
scene.world=bpy.data.worlds.new("Midnight"); scene.world.use_nodes=True
background=next(n for n in scene.world.node_tree.nodes if n.type=="BACKGROUND")
background.inputs[0].default_value=(.02,.05,.08,1)
background.inputs[1].default_value=.25
try: scene.render.engine='CYCLES'
except TypeError as error: raise RuntimeError("Cycles renderer unavailable") from error
scene.cycles.samples=24; scene.cycles.use_denoising=True
scene.render.resolution_x=600; scene.render.resolution_y=1066; scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG'; scene.render.filepath=out+"/preview.png"
scene.use_nodes=True; nodes=scene.node_tree.nodes; nodes.clear()
a=nodes.new("CompositorNodeRLayers"); b=nodes.new("CompositorNodeGlare"); b.glare_type='FOG_GLOW'; b.threshold=1.2
c=nodes.new("CompositorNodeComposite"); scene.node_tree.links.new(a.outputs["Image"],b.inputs["Image"]); scene.node_tree.links.new(b.outputs["Image"],c.inputs["Image"])
bpy.context.preferences.filepaths.save_version=0
bpy.data.libraries.write(out+"/grand-hall.blend",{scene},fake_user=True,compress=True)
if not globals().get("SKIP_RENDER",False): bpy.ops.render.render(write_still=True)
print("READY",len(scene.objects),"objects")
