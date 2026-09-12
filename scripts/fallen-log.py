"""Build a reusable mossy fallen log and a mushroom composition in Blender."""
import bpy, math, random, os
from mathutils import Vector
random.seed(931)
OUT='/Users/yuda/Documents/Projects/protea/public/assets/models/mossy-fallen-log'
os.makedirs(OUT,exist_ok=True)
source=next((o for o in bpy.context.scene.objects if o.name.startswith('Emberveil_Cluster') and o.type=='EMPTY'),None)
scene=bpy.data.scenes.new('Fallen_Log_Studio'); bpy.context.window.scene=scene
root=bpy.data.objects.new('Mossy_Fallen_Log',None); scene.collection.objects.link(root)
def mat(name):
    m=bpy.data.materials.new(name); m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF'); p.inputs['Roughness'].default_value=.88
    c=m.node_tree.nodes.new('ShaderNodeVertexColor'); c.layer_name='Color'
    m.node_tree.links.new(c.outputs['Color'],p.inputs['Base Color'])
    return m
bark=mat('Log_Bark'); wood=mat('Broken_Heartwood'); moss=mat('Living_Moss')
def mesh(name,v,f,m,c):
    d=bpy.data.meshes.new(name); d.from_pydata(v,[],f); d.update()
    o=bpy.data.objects.new(name,d); scene.collection.objects.link(o); o.parent=root; d.materials.append(m)
    a=d.color_attributes.new(name='Color',type='FLOAT_COLOR',domain='POINT')
    for x,col in zip(a.data,c): x.color=(*col,1)
    for p in d.polygons: p.use_smooth=True
    return o
def center(t): return Vector(((t-.5)*1.13,.027*math.sin(t*5),.132+.019*math.sin(t*math.pi)))
def radius(t,a):
    ridges=.009*math.sin(a*17+t*8)+.006*math.sin(a*31-t*6)+.004*math.sin(a*9+t*21)
    return .117*(1-.17*t)+ridges
def surf(t,a): return center(t)+Vector((0,math.cos(a)*radius(t,a),math.sin(a)*radius(t,a)))
N=96; L=24; verts=[]; cols=[]; faces=[]
for j in range(L+1):
    t=j/L
    for k in range(N):
        a=k*math.tau/N; p=surf(t,a)
        edge=(1-t)**18+t**18
        p.x+=edge*(.015*math.sin(a*13)+.01*math.sin(a*27))
        verts.append(p)
        f=.55+.4*(.5+.5*math.sin(a*17+t*8))+.15*random.random()
        cols.append((.084*f,.037*f,.017*f))
for j in range(L):
    for k in range(N):
        q=j*N+k; n=j*N+(k+1)%N; faces.append((q,n,n+N,q+N))
mesh('Deep_Furrowed_Bark',verts,faces,bark,cols)
# End-grain rings on irregular broken cross-sections.
for end in [0,1]:
    v=[]; f=[]; c=[]; layers=16
    for j in range(layers+1):
        rr=max(.001,j/layers)
        for k in range(N):
            a=k*math.tau/N; p=center(end)+Vector((0,math.cos(a)*radius(end,a)*rr,math.sin(a)*radius(end,a)*rr))
            p.x+=(1 if end else -1)*(.008+.01*math.sin(a*13)*rr+.007*math.sin(rr*19+a*3))
            v.append(p)
            rings=.72+.20*math.sin(rr*64+math.sin(a*3)*.8)
            c.append((.28*rings,.13*rings,.042*rings))
    for j in range(layers):
        for k in range(N):
            q=j*N+k; n=j*N+(k+1)%N; f.append((q,n,n+N,q+N))
    mesh('Splintered_End_'+str(end),v,f,wood,c)
# Sharp broken wood fibres, concentrated at the rim.
v=[]; f=[]; c=[]
for end in [0,1]:
    for i in range(24):
        a=random.random()*math.tau; rr=random.uniform(.65,.99); p=center(end)+Vector((0,math.cos(a)*radius(end,a)*rr,math.sin(a)*radius(end,a)*rr))
        w=random.uniform(.002,.007); length=random.uniform(.018,.065); sign=1 if end else -1
        start=len(v); v.extend([p+Vector((0,-w,-w)),p+Vector((0,w,-w)),p+Vector((0,0,w)),p+Vector((length*sign,w*.5,0))])
        f.extend([(start,start+1,start+3),(start+1,start+2,start+3),(start+2,start,start+3)])
        c.extend([(.25,.105,.032),(.32,.16,.055),(.22,.09,.025),(.38,.20,.08)])
mesh('Torn_Wood_Fibres',v,f,wood,c)
# A short snapped branch, angled upward from the back.
v=[]; f=[]; c=[]; base=Vector((.12,.065,.20)); direction=Vector((.07,.10,.15))
axis=direction.normalized(); u=axis.cross(Vector((1,0,0))).normalized(); w=axis.cross(u)
for j in range(7):
    t=j/6
    for k in range(16):
        a=k*math.tau/16; r=.035*(1-.5*t)*(1+.12*math.sin(k*3+t))
        p=base+direction*t+(u*math.cos(a)+w*math.sin(a))*r
        if j==6: p+=axis*random.uniform(-.009,.012)
        v.append(p); c.append((.07,.03,.012) if j<6 else (.27,.12,.038))
for j in range(6):
    for k in range(16):
        q=j*16+k; n=j*16+(k+1)%16; f.append((q,n,n+16,q+16))
f.append(tuple(96+k for k in range(16)))
mesh('Snapped_Branch',v,f,bark,c)
# Raised moss cushions following the upper bark, with tiny leaf blades.
v=[]; f=[]; c=[]
for i in range(2300):
    t=random.uniform(.03,.96); a=random.uniform(.22,2.8)
    if math.sin(t*28+math.sin(a*4))+math.cos(a*7+t*10)<-.2: continue
    p=surf(t,a); normal=Vector((0,math.cos(a),math.sin(a)))
    p+=normal*.003
    size=random.uniform(.003,.010); along=Vector((1,0,0)); across=normal.cross(along)
    start=len(v); v.extend([p-along*size,p+across*size*.6,p+normal*size*1.4,p-across*size*.6,p+along*size])
    f.extend([(start,start+1,start+2),(start,start+2,start+3),(start+4,start+2,start+1),(start+4,start+3,start+2)])
    green=random.uniform(.6,1.5); c.extend([(.032*green,.09*green,.009*green)]*5)
mesh('Moss_Cushions',v,f,moss,c)
root['units']='meters'; root['length_m']=1.2
# Reuse only individual mushroom parts, excluding their old soil bases.
mushroot=bpy.data.objects.new('Emberveil_On_Log',None); scene.collection.objects.link(mushroot)
if source:
    for child in source.children:
        if child.name.startswith(('Cap_','Stem_','Radial_Gills_','Underside_')):
            o=child.copy(); o.data=child.data.copy(); scene.collection.objects.link(o); o.parent=mushroot
    mushroot.scale=(.63,.63,.63); mushroot.location=(-.12,-.045,.19)
def area(name,loc,power,color,size):
    d=bpy.data.lights.new(name,'AREA'); d.energy=power; d.color=color; d.shape='DISK'; d.size=size
    o=bpy.data.objects.new(name,d); scene.collection.objects.link(o); o.location=loc
    o.rotation_euler=(Vector((0,0,.19))-o.location).to_track_quat('-Z','Y').to_euler()
area('Soft_Moon',(0,-.7,1.4),48,(.50,.70,1),1.6)
area('Forest_Rim',(.2,.8,.9),55,(.13,.75,.7),1.2)
area('Warm_Fill',(-1,-.6,.6),20,(1,.55,.29),.9)
world=bpy.data.worlds.new('Forest_Dark'); world.use_nodes=True
world.node_tree.nodes['Background'].inputs[0].default_value=(.008,.015,.025,1)
world.node_tree.nodes['Background'].inputs[1].default_value=.25; scene.world=world
camd=bpy.data.cameras.new('Log_Portrait'); cam=bpy.data.objects.new('Log_Portrait',camd); scene.collection.objects.link(cam)
cam.location=(-1.35,-1.8,1.02); cam.rotation_euler=(Vector((0,0,.22))-cam.location).to_track_quat('-Z','Y').to_euler(); camd.type='ORTHO'; camd.ortho_scale=1.48; scene.camera=cam
scene.render.engine='BLENDER_EEVEE_NEXT'; scene.eevee.taa_render_samples=48
scene.render.resolution_x=1000; scene.render.resolution_y=750; scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG'; scene.render.filepath=OUT+'/preview.png'
scene.view_settings.view_transform='AgX'; scene.view_settings.look='AgX - Medium High Contrast'
scene.use_nodes=True; nodes=scene.node_tree.nodes; nodes.clear()
rl=nodes.new('CompositorNodeRLayers'); gl=nodes.new('CompositorNodeGlare'); gl.glare_type='FOG_GLOW'; gl.threshold=1.5
comp=nodes.new('CompositorNodeComposite'); scene.node_tree.links.new(rl.outputs['Image'],gl.inputs['Image']); scene.node_tree.links.new(gl.outputs['Image'],comp.inputs['Image'])
def export(path,roots):
    bpy.ops.object.select_all(action='DESELECT')
    for r in roots:
        r.select_set(True)
        for o in r.children_recursive: o.select_set(True)
    bpy.context.view_layer.objects.active=roots[0]
    bpy.ops.export_scene.gltf(filepath=OUT+'/'+path,export_format='GLB',use_selection=True,use_active_scene=True,export_apply=True)
export('mossy-fallen-log.glb',[root])
export('log-with-mushrooms.glb',[root,mushroot])
bpy.ops.wm.save_as_mainfile(filepath=OUT+'/mossy-fallen-log.blend')
print('LOG_SAVED',OUT)
