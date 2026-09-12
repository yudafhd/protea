"""Rebuild the reference-inspired mushroom asset in a separate Blender scene."""
import bpy, math, random, os, json
from mathutils import Vector
random.seed(712)
OUT = '/Users/yuda/Documents/Projects/protea/public/assets/models/magical-mushroom-v2'
os.makedirs(OUT, exist_ok=True)
scene = bpy.data.scenes.new('Mushroom_V2_Studio')
bpy.context.window.scene = scene
root = bpy.data.objects.new('Emberveil_Cluster', None)
scene.collection.objects.link(root)

def material(name, color, rough=.65, emission=0, vertex=False):
    m=bpy.data.materials.new('V2_'+name); m.use_nodes=True
    n=m.node_tree.nodes; links=m.node_tree.links; p=n.get('Principled BSDF')
    p.inputs['Base Color'].default_value=(*color,1)
    p.inputs['Roughness'].default_value=rough
    p.inputs['Emission Color'].default_value=(*color,1)
    p.inputs['Emission Strength'].default_value=emission
    if vertex:
        v=n.new('ShaderNodeVertexColor'); v.layer_name='Color'
        links.new(v.outputs['Color'],p.inputs['Base Color'])
    return m
capmat=material('Mulberry_Cap',(1,1,1),.48,vertex=True)
stemmat=material('Ivory_Fibres',(1,1,1),.78,vertex=True)
gillmat=material('Amber_Gills',(1,.23,.025),.63,1.5)
undermat=material('Warm_Underside',(.30,.06,.012),.8,.3)
soilmat=material('Forest_Floor',(1,1,1),.96,vertex=True)
mossmat=material('Moss',(1,1,1),.94,vertex=True)

def mesh(name,verts,faces,mat,colors=None):
    data=bpy.data.meshes.new(name); data.from_pydata(verts,[],faces); data.update()
    obj=bpy.data.objects.new(name,data); scene.collection.objects.link(obj); obj.parent=root
    data.materials.append(mat)
    for f in data.polygons: f.use_smooth=True
    if colors:
        attr=data.color_attributes.new(name='Color',type='FLOAT_COLOR',domain='POINT')
        for item,col in zip(attr.data,colors): item.color=(*col,1)
    return obj

# Parametric canopy: domed centre, thin drooping and irregular outer lip.
def mushroom(label,x,y,h,R,lean,tilt,phase):
    N=64; rings=12
    def canopy(t,a,under=False):
        wave=(.045*math.sin(5*a+phase)+.025*math.sin(9*a-1.3))*t**3
        rad=R*t*(1+wave)
        z=R*(.37*(1-t*t)**1.1-.075*t**8+wave*.55)
        if under: z-=R*(.025+.055*(1-t))
        local=Vector((rad*math.cos(a),rad*math.sin(a)*.9,z))
        # Tilt toward the camera to expose the glowing radial gills.
        c,s=math.cos(tilt),math.sin(tilt)
        return (x+lean+local.x,y+c*local.y-s*local.z,h+s*local.y+c*local.z)
    verts=[]; colors=[]; faces=[]
    for j in range(rings+1):
        t=max(.002,j/rings)
        for k in range(N):
            a=k*math.tau/N; verts.append(canopy(t,a))
            mott=.5+.5*math.sin(a*13+t*41+math.sin(a*7)*2)*math.sin(t*55-a*3)
            ridge=.5+.5*math.sin(a*43+t*2)
            edge=t**7
            colors.append((.12+.12*mott+.12*edge,.015+.026*mott+.032*edge,.17+.14*mott+.06*ridge))
    for j in range(rings):
        for k in range(N):
            q=j*N+k; nxt=j*N+(k+1)%N
            faces.append((q,nxt,nxt+N,q+N))
    top=mesh('Cap_'+label,verts,faces,capmat,colors)
    sol=top.modifiers.new('Thin_flesh','SOLIDIFY'); sol.thickness=R*.024
    # Underside disk and gills are actual geometry, not glowing dots.
    verts=[]; faces=[]
    for j in range(7):
        for k in range(N): verts.append(canopy(max(.015,j/6),k*math.tau/N,True))
    for j in range(6):
        for k in range(N):
            q=j*N+k; nxt=j*N+(k+1)%N; faces.append((q,q+N,nxt+N,nxt))
    mesh('Underside_'+label,verts,faces,undermat)
    verts=[]; faces=[]
    for k in range(48):
        a=k*math.tau/48
        for j in range(8):
            t=.13+.85*j/7
            p=canopy(t,a+.013*math.sin(t*5+phase),True)
            depth=R*.065*math.sin(math.pi*t)**.6
            verts.extend([p,(p[0],p[1],p[2]-depth)])
            if j:
                i=len(verts)-4; faces.append((i,i+1,i+3,i+2))
    g=mesh('Radial_Gills_'+label,verts,faces,gillmat)
    sol=g.modifiers.new('Gill_thickness','SOLIDIFY'); sol.thickness=.00055
    # Tapered curved stem, with longitudinal surface ridges and color variation.
    verts=[]; faces=[]; colors=[]; sides=16; steps=16
    for j in range(steps+1):
        t=j/steps; cx=x+lean*math.sin(t*math.pi/2); cy=y+.025*math.sin(t*math.pi)-math.sin(tilt)*R*.29*t**4
        rr=R*(.11-.045*math.sin(t*math.pi)+.01*t)
        for k in range(sides):
            a=k*math.tau/sides; r=rr*(1+.08*math.sin(a*7+t*3))
            verts.append((cx+r*math.cos(a),cy+r*math.sin(a),.016+(h+R*.30*math.cos(tilt)-.016)*t))
            f=.7+.3*math.sin(a*7+.4*t)**2
            colors.append((.39*f+.1*t,.22*f+.09*t,.12*f+.06*t))
    for j in range(steps):
        for k in range(sides):
            q=j*sides+k; n=j*sides+(k+1)%sides; faces.append((q,n,n+sides,q+sides))
    faces.extend([tuple(reversed(range(sides))),tuple(steps*sides+k for k in range(sides))])
    mesh('Stem_'+label,verts,faces,stemmat,colors)

mushroom('Hero',.015,.07,.48,.205,.045,-.60,.7)
mushroom('Companion',-.20,-.035,.295,.135,-.025,-.48,2.1)
mushroom('Young',.20,-.065,.205,.09,.023,-.55,4.1)

# Uneven island of earth with a ragged perimeter; no cylindrical plinth.
N=64; verts=[(0,0,.055)]; cols=[(.026,.015,.009)]; faces=[]
for ring in range(1,7):
    t=ring/6
    for k in range(N):
        a=k*math.tau/N; rad=.36*t*(1+.12*math.sin(5*a)+.06*math.sin(11*a))
        z=.045*(1-t*t)+.008*math.sin(a*9+t*32)*(1-t)+.004
        verts.append((rad*math.cos(a),rad*.72*math.sin(a),z))
        f=random.uniform(.65,1.35); cols.append((.04*f,.024*f,.012*f))
for k in range(N): faces.append((0,1+k,1+(k+1)%N))
for ring in range(5):
    for k in range(N):
        q=1+ring*N+k; n=1+ring*N+(k+1)%N; faces.append((q,q+N,n+N,n))
mesh('Uneven_Forest_Earth',verts,faces,soilmat,cols)
# Thousands of tiny leaves distributed in patches, merged into one mesh.
verts=[]; faces=[]; cols=[]
for i in range(1050):
    x=random.uniform(-.34,.34); y=random.uniform(-.24,.24)
    if (x/.34)**2+(y/.24)**2>1 or math.sin(x*35+y*20)<-.45: continue
    z=.045*(1-min(1,(x/.36)**2+(y/.26)**2))+.006
    a=random.random()*math.tau; length=random.uniform(.006,.022); w=length*.24
    start=len(verts); dx=math.cos(a); dy=math.sin(a)
    verts.extend([(x,y,z),(x+dx*length*.5-dy*w,y+dy*length*.5+dx*w,z+length*.45),(x+dx*length,y+dy*length,z+length*.7),(x+dx*length*.5+dy*w,y+dy*length*.5-dx*w,z+length*.45)])
    faces.append(tuple(start+j for j in range(4)))
    f=random.uniform(.5,1.4); cols.extend([(.035*f,.11*f,.025*f)]*4)
mesh('Moss_Leaf_Carpet',verts,faces,mossmat,cols)

# Preview rig is deliberately excluded from the runtime export.
def area(name,pos,power,color,size):
    d=bpy.data.lights.new(name,'AREA'); d.energy=power; d.color=color; d.shape='DISK'; d.size=size
    o=bpy.data.objects.new(name,d); scene.collection.objects.link(o); o.location=pos
    o.rotation_euler=(Vector((0,0,.23))-o.location).to_track_quat('-Z','Y').to_euler()
area('Cool_Key',(.5,-.6,1.25),22,(.45,.63,1),.9)
area('Teal_Rim',(-.6,.6,.8),30,(.08,.65,1),.7)
area('Warm_Fill',(-.4,-.4,.4),3,(1,.28,.075),.6)
for x,y,z,p in [(.06,.06,.435,1.1),(-.225,-.035,.26,.5),(.22,-.065,.18,.25)]:
    d=bpy.data.lights.new('Gill_Bounce','POINT'); d.energy=p; d.color=(1,.23,.025); d.shadow_soft_size=.075
    o=bpy.data.objects.new('Gill_Bounce',d); scene.collection.objects.link(o); o.location=(x,y,z)
world=bpy.data.worlds.new('Midnight'); world.use_nodes=True
world.node_tree.nodes['Background'].inputs[0].default_value=(.008,.02,.045,1)
world.node_tree.nodes['Background'].inputs[1].default_value=.22; scene.world=world
camdata=bpy.data.cameras.new('Portrait'); cam=bpy.data.objects.new('Portrait',camdata); scene.collection.objects.link(cam)
cam.location=(.65,-1.6,.49); cam.rotation_euler=(Vector((0,0,.26))-cam.location).to_track_quat('-Z','Y').to_euler()
camdata.type='ORTHO'; camdata.ortho_scale=.87; scene.camera=cam
scene.render.engine='BLENDER_EEVEE_NEXT'; scene.eevee.taa_render_samples=32
scene.render.resolution_x=800; scene.render.resolution_y=800; scene.render.resolution_percentage=100
scene.view_settings.view_transform='AgX'; scene.view_settings.look='AgX - Medium High Contrast'
scene.render.image_settings.file_format='PNG'; scene.render.filepath=OUT+'/preview.png'
scene.use_nodes=True; nodes=scene.node_tree.nodes; nodes.clear()
rl=nodes.new('CompositorNodeRLayers'); gl=nodes.new('CompositorNodeGlare'); gl.glare_type='FOG_GLOW'; gl.quality='MEDIUM'; gl.threshold=1.3
comp=nodes.new('CompositorNodeComposite'); scene.node_tree.links.new(rl.outputs['Image'],gl.inputs['Image']); scene.node_tree.links.new(gl.outputs['Image'],comp.inputs['Image'])
root['units']='meters'; root['style']='Reference-inspired purple canopy / amber gills'
bpy.ops.object.select_all(action='DESELECT')
root.select_set(True)
for o in root.children_recursive: o.select_set(True)
bpy.context.view_layer.objects.active=root
bpy.ops.export_scene.gltf(filepath=OUT+'/magical-mushroom-v2.glb',export_format='GLB',use_selection=True,use_active_scene=True,export_apply=True,export_yup=True)
bpy.ops.wm.save_as_mainfile(filepath=OUT+'/magical-mushroom-v2.blend')
print('V2_SAVED',OUT)
