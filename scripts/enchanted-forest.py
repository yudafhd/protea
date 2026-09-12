"""Seeded Blender forest composition. Run build, then render separately."""
import bpy, math, random, os, json
from mathutils import Vector, noise
random.seed(209)
BASE='/Users/yuda/Documents/Projects/protea/public/assets/models'
OUT=BASE+'/enchanted-forest';os.makedirs(OUT,exist_ok=True)
scene=bpy.data.scenes.new('Enchanted_Forest_Final');bpy.context.window.scene=scene
worldroot=bpy.data.objects.new('Forest_Environment',None);scene.collection.objects.link(worldroot)
def mat(name,color,rough=.9,vertex=False,emission=0):
    m=bpy.data.materials.new(name);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value=(*color,1);p.inputs['Roughness'].default_value=rough
    p.inputs['Emission Color'].default_value=(*color,1);p.inputs['Emission Strength'].default_value=emission
    if vertex:
        c=m.node_tree.nodes.new('ShaderNodeVertexColor');c.layer_name='Color';m.node_tree.links.new(c.outputs['Color'],p.inputs['Base Color'])
    return m
bark=mat('Ancient_Bark',(.09,.07,.045),vertex=True)
foliage=mat('Forest_Canopy',(.035,.11,.055),vertex=True)
earth=mat('Moss_And_Path',(.03,.04,.02),vertex=True)
glow=mat('Firefly_Amber',(1,.34,.045),.5,emission=5)
def mesh(name,v,f,m,c=None,parent=worldroot):
    d=bpy.data.meshes.new(name);d.from_pydata(v,[],f);d.update();o=bpy.data.objects.new(name,d);scene.collection.objects.link(o);o.parent=parent;d.materials.append(m)
    for p in d.polygons:p.use_smooth=True
    if c:
        a=d.color_attributes.new(name='Color',type='FLOAT_COLOR',domain='POINT')
        for x,col in zip(a.data,c):x.color=(*col,1)
    return o
def pathx(y):return .8*math.sin(y*.26)
def height(x,y):
    edge=1-math.exp(-((x-pathx(y))/2)**2)
    return .04*math.sin(y*1.3)+edge*(.22+.3*noise.noise(Vector((x*.35,y*.3,1))))
v=[];f=[];c=[];NX=72;NY=100
for j in range(NY+1):
    y=-5+30*j/NY
    for i in range(NX+1):
        x=-11+22*i/NX;z=height(x,y);v.append((x,y,z))
        path=math.exp(-((x-pathx(y))/1.15)**4);n=.8+.3*noise.noise(Vector((x*3,y*3,2)))
        moss=(.027,.055,.019);mud=(.10,.072,.039)
        c.append(tuple((moss[k]*(1-path)+mud[k]*path)*n for k in range(3)))
for j in range(NY):
    for i in range(NX):
        q=j*(NX+1)+i;f.append((q,q+1,q+NX+2,q+NX+1))
mesh('Undulating_Forest_Floor',v,f,earth,c)

# Mesh tubes share a stable frame and vary radius to produce bark ridges.
def tree(seed):
    rng=random.Random(seed);v=[];f=[];c=[];leaves=[];lf=[];lc=[]
    def tube(points,radii,sides=10):
        start=len(v)
        for j,p in enumerate(points):
            p=Vector(p);t=(Vector(points[min(j+1,len(points)-1)])-Vector(points[max(0,j-1)])).normalized()
            axis=Vector((0,1,0)) if abs(t.y)<.95 else Vector((1,0,0));u=t.cross(axis).normalized();w=t.cross(u)
            for k in range(sides):
                a=k*math.tau/sides;ridge=1+.13*math.sin(k*2.7+j*.35)
                v.append(p+radii[j]*ridge*(u*math.cos(a)+w*math.sin(a)))
                tint=rng.uniform(.7,1.15);c.append((.09*tint,.067*tint,.043*tint))
        for j in range(len(points)-1):
            for k in range(sides):
                a=start+j*sides+k;b=start+j*sides+(k+1)%sides;f.append((a,b,b+sides,a+sides))
        f.append(tuple(start+(len(points)-1)*sides+k for k in range(sides)))
    H=rng.uniform(7,9);lean=rng.uniform(-.65,.65)
    trunk=[(lean*(j/14)**1.4,.13*math.sin(j*.4),H*j/14) for j in range(15)]
    tube(trunk,[.49*(1-j/17)**1.25+.035 for j in range(15)],18)
    for i in range(7):
        a=i*math.tau/7+rng.uniform(-.2,.2);L=rng.uniform(1,1.7)
        tube([(0,0,.65),(.3*math.cos(a),.3*math.sin(a),.22),(L*.7*math.cos(a),L*.7*math.sin(a),.08),(L*math.cos(a),L*math.sin(a),.015)],[.22,.18,.09,.009],9)
    for i in range(12):
        a=i*2.4+rng.uniform(-.2,.2);z=H*(.45+i*.038);length=rng.uniform(1.7,2.7)*(1-i*.022)
        origin=Vector((lean*(z/H)**1.4,0,z));direction=Vector((math.cos(a),math.sin(a),.40))
        end=origin+direction*length
        tube([origin,origin+direction*length*.35+Vector((0,0,-.16)),origin+direction*length*.72,end],[.16,.11,.055,.012],9)
        for branch in [-1,1]:
            split=origin+direction*length*.6;tip=end+Vector((math.cos(a+branch*.7)*.9,math.sin(a+branch*.7)*.9,.65))
            tube([split,(split+tip)*.5,tip],[.055,.03,.003],6)
            for j in range(65):
                p=tip+Vector((rng.uniform(-1,1),rng.uniform(-.8,.8),rng.uniform(-.35,.45)))
                ang=rng.random()*math.tau;L=rng.uniform(.13,.28);u=Vector((math.cos(ang),math.sin(ang),rng.uniform(-.2,.2)));w=Vector((-u.y,u.x,0))*L*.38
                n=len(leaves);leaves.extend([p-u*L,p+w,p+Vector((0,0,.035)),p-w,p+u*L]);lf.extend([(n,n+1,n+2),(n,n+2,n+3),(n+4,n+2,n+1),(n+4,n+3,n+2)])
                tint=rng.uniform(.65,1.4);lc.extend([(.024*tint,.072*tint,.034*tint)]*5)
    return mesh('Ancient_Tree_Wood',v,f,bark,c),mesh('Ancient_Tree_Leaves',leaves,lf,foliage,lc)
prototypes=[tree(i+44) for i in range(3)]
bpy.context.view_layer.update()
for pair in prototypes:
    for o in pair:
        o.select_set(False);o.parent=None;scene.collection.objects.unlink(o)
bpy.context.view_layer.objects.active=None
positions=[(-3,-1,1.2),(3.8,1,.95),(-4.2,5,1),(3.2,7,1.12),(-3,10,.9),(4,13,1),(-4,17,1)]
for y in range(2,26,4):
    for x in [-8,-5.8,6.4,9]:positions.append((x+random.uniform(-.5,.5),y+random.uniform(-1,1),random.uniform(.8,1.2)))
for x in [-3,-1,1,3]:positions.append((x,24+random.random(),.95))
trees=[]
for i,(x,y,s) in enumerate(positions):
    r=bpy.data.objects.new('Tree_%02d'%i,None);scene.collection.objects.link(r);r.parent=worldroot;r.location=(x,y,height(x,y));r.scale=(s,s,s);r.rotation_euler.z=random.random()*math.tau;trees.append(r)
    for p in prototypes[i%3]:
        o=p.copy();scene.collection.objects.link(o);o.parent=r

# Reuse GLB geometry and materials across all placed instances.
cache={}
def instance(rel,name,loc,scale=1,yaw=0):
    if rel not in cache:
        bpy.context.view_layer.update()
        before=set(scene.objects);bpy.ops.import_scene.gltf(filepath=BASE+'/'+rel)
        objs=list(set(scene.objects)-before);cache[rel]=objs
        for o in objs:
            o.select_set(False)
            for col in list(o.users_collection):col.objects.unlink(o)
        bpy.context.view_layer.objects.active=None
    originals=cache[rel];r=bpy.data.objects.new(name,None);scene.collection.objects.link(r);r.parent=worldroot;r.location=loc;r.scale=(scale,)*3;r.rotation_euler.z=yaw
    copies={}
    for old in originals:
        o=old.copy();scene.collection.objects.link(o);copies[old]=o
    for old,o in copies.items():o.parent=copies.get(old.parent,r)
    return r
for i in range(32):
    y=random.uniform(-2.5,20);x=pathx(y)+random.choice([-1,1])*random.uniform(1.5,3.5)
    instance('forest-fern/forest-fern.glb','Fern_%02d'%i,(x,y,height(x,y)),random.uniform(1.1,2.2),random.random()*math.tau)
for i in range(20):
    y=random.uniform(-2,21);x=pathx(y)+random.choice([-1,1])*random.uniform(1.3,4)
    instance('forest-rocks/'+random.choice(['boulder','flat_stone','small_rock'])+'.glb','Rock_%02d'%i,(x,y,height(x,y)-.025),random.uniform(1.4,2.7),random.random()*6)
for i,(x,y,s) in enumerate([(-1.9,-1,2.7),(1.8,1.3,3),(2.2,4,2.1),(-2,6,2),(-1.3,10,1.7),(1.7,14,1.5)]):
    instance('magical-mushroom-v2/magical-mushroom-v2.glb','Glowing_Cluster_%02d'%i,(x,y,height(x,y)),s,random.uniform(-.35,.35))
    d=bpy.data.lights.new('Amber_Mushroom_Bounce','POINT');d.energy=18*s;d.color=(1,.22,.035);d.shadow_soft_size=.5
    o=bpy.data.objects.new('Amber_Mushroom_Bounce',d);scene.collection.objects.link(o);o.location=(x,y,height(x,y)+s*.28)
instance('mossy-fallen-log/log-with-mushrooms.glb','Fallen_Log',(-2.8,2,height(-2.8,2)),2.1,.7)
# Small glowing spores combined into one mesh.
v=[];f=[]
for i in range(65):
    p=Vector((random.uniform(-4,4),random.uniform(-2,17),random.uniform(.3,2.5)));r=random.uniform(.009,.021);j=len(v)
    v.extend([p+Vector((r,0,0)),p+Vector((-r,0,0)),p+Vector((0,r,0)),p+Vector((0,-r,0)),p+Vector((0,0,r)),p+Vector((0,0,-r))])
    f.extend([(j+a,j+b,j+c) for a,b,c in [(0,2,4),(2,1,4),(1,3,4),(3,0,4),(2,0,5),(1,2,5),(3,1,5),(0,3,5)]])
mesh('Warm_Drifting_Spores',v,f,glow)

world=bpy.data.worlds.new('Blue_Hour');world.use_nodes=True;scene.world=world
world.node_tree.nodes['Background'].inputs[0].default_value=(.055,.14,.20,1)
world.node_tree.nodes['Background'].inputs[1].default_value=.35
def light(name,kind,pos,power,color,size,target):
    d=bpy.data.lights.new(name,kind);d.energy=power;d.color=color
    if kind=='AREA':d.shape='DISK';d.size=size
    if kind=='SPOT':d.spot_size=size;d.spot_blend=.35;d.shadow_soft_size=.2
    o=bpy.data.objects.new(name,d);scene.collection.objects.link(o);o.location=pos;o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler()
light('Moon_Canopy','AREA',(1,7,11),1800,(.24,.64,1),8,(0,4,0))
light('Foreground_Fill','AREA',(-1,-5,5),450,(.24,.53,.68),7,(0,4,1))
light('Distant_Cyan','AREA',(0,20,6),2200,(.1,.7,.85),6,(0,6,2))
for i in range(3):light('Moon_Shaft_%d'%i,'SPOT',(4+i,8+i*3,11),2000,(.45,.8,1),.34,(-2+i,3+i*2,0))
# Blender-only participating fog, excluded from GLB.
bpy.ops.mesh.primitive_cube_add(size=1,location=(0,9,6));fog=bpy.context.object;fog.name='Atmosphere_Volume';fog.scale=(25,38,16)
m=bpy.data.materials.new('Forest_Mist');m.use_nodes=True;n=m.node_tree.nodes;n.clear()
output=n.new('ShaderNodeOutputMaterial');vol=n.new('ShaderNodeVolumePrincipled');vol.inputs['Density'].default_value=.022;vol.inputs['Color'].default_value=(.32,.57,.66,1);vol.inputs['Anisotropy'].default_value=.3;m.node_tree.links.new(vol.outputs['Volume'],output.inputs['Volume']);fog.data.materials.append(m)
d=bpy.data.cameras.new('Forest_Path_Camera');o=bpy.data.objects.new('Forest_Path_Camera',d);scene.collection.objects.link(o);o.location=(.2,-6,2.4);o.rotation_euler=(Vector((.1,9,2.5))-o.location).to_track_quat('-Z','Y').to_euler();d.lens=24;scene.camera=o
scene.render.engine='BLENDER_EEVEE_NEXT';scene.eevee.taa_render_samples=32
scene.render.resolution_x=960;scene.render.resolution_y=640;scene.render.resolution_percentage=100
scene.view_settings.view_transform='AgX';scene.view_settings.look='AgX - Medium High Contrast'
scene.render.image_settings.file_format='PNG';scene.render.filepath=OUT+'/preview.png'
scene.use_nodes=True;nodes=scene.node_tree.nodes;nodes.clear();rl=nodes.new('CompositorNodeRLayers');g=nodes.new('CompositorNodeGlare');g.glare_type='FOG_GLOW';g.threshold=1.2
comp=nodes.new('CompositorNodeComposite');scene.node_tree.links.new(rl.outputs['Image'],g.inputs['Image']);scene.node_tree.links.new(g.outputs['Image'],comp.inputs['Image'])
def export(path,root):
    bpy.ops.object.select_all(action='DESELECT');root.select_set(True)
    for o in root.children_recursive:o.select_set(True)
    bpy.context.view_layer.objects.active=root
    bpy.ops.export_scene.gltf(filepath=OUT+'/'+path,export_format='GLB',use_selection=True,use_active_scene=True,export_apply=True)
# A single reusable tree at a neutral transform.
r=trees[0];oldloc=r.location.copy();olds=r.scale.copy();oldrot=r.rotation_euler.copy();r.location=(0,0,0);r.scale=(1,1,1);r.rotation_euler=(0,0,0)
export('ancient-tree.glb',r);r.location=oldloc;r.scale=olds;r.rotation_euler=oldrot
export('enchanted-forest.glb',worldroot)
bpy.ops.wm.save_as_mainfile(filepath=OUT+'/enchanted-forest.blend')
print('FOREST_READY',len(trees),'trees',len(scene.objects),'objects')
