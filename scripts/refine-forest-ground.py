"""Refine only the active forest floor. Texture maps also survive glTF export."""
import bpy, math, random, os, numpy as np
from mathutils import Vector
from mathutils.noise import noise
OUT='/Users/yuda/Documents/Projects/protea/public/assets/models/enchanted-forest'
scene=bpy.context.scene
ground=next(o for o in scene.objects if o.type=='MESH' and 'Undulating_Forest_Floor' in o.name)
root=ground.parent
# Copy mesh so older scenes keep their original ground.
ground.data=ground.data.copy()
for v in ground.data.vertices:
    x,y,z=v.co
    # Small depressions and irregularities, deliberately below existing props.
    v.co.z += .016*noise(Vector((x*2.6,y*2.6,3)))-.008
ground.data.update()
uv=ground.data.uv_layers.new(name='GroundUV')
for face in ground.data.polygons:
    for idx in face.loop_indices:
        p=ground.data.vertices[ground.data.loops[idx].vertex_index].co
        uv.data[idx].uv=((p.x+11)/22,(p.y+5)/30)
# Atlas maps in terrain space: mottled damp soil in the worn path, moss at edges.
N=1024;rng=np.random.default_rng(95)
y,x=np.mgrid[0:N,0:N].astype(np.float32)
x=x/(N-1)*22-11;y=y/(N-1)*30-5
def field(scale,seed):
    r=np.random.default_rng(seed);a=np.zeros_like(x)
    for k in range(8):
        angle=r.uniform(0,math.tau);freq=scale*r.uniform(.65,1.5)
        a+=np.sin((x*np.cos(angle)+y*np.sin(angle))*freq+r.uniform(0,math.tau))
    return a/8
coarse=field(2.8,2);fine=field(70,4);grit=rng.random((N,N),dtype=np.float32)
distance=np.abs(x-.8*np.sin(y*.26))
worn=np.exp(-(distance/(1.12+.14*coarse))**4)
wet=np.clip(.32+coarse*1.8+field(7,8)*.4,0,1)*worn
mud=np.array([.135,.089,.048],np.float32)
moss=np.array([.047,.073,.025],np.float32)
rgb=(moss[None,None,:]*(1-worn[:,:,None])+mud[None,None,:]*worn[:,:,None])
rgb*=np.clip(.9+coarse[:,:,None]*.8+fine[:,:,None]*.5+(grit[:,:,None]-.5)*.40,.35,1.5)
rgb*=1-wet[:,:,None]*.38
flecks=(grit>.987)*(worn>.25)
rgb+=flecks[:,:,None]*np.array([.05,.045,.032])
rough=np.clip(.93-wet*.25+fine*.06,.68,.98)
h=coarse*.022+fine*.006+(grit-.5)*.002
dy,dx=np.gradient(h,30/N,22/N)
normal=np.stack((-dx,-dy,np.ones_like(dx)),axis=-1)
normal/=np.linalg.norm(normal,axis=-1,keepdims=True);normal=normal*.5+.5
def image(name,values,data=False):
    im=bpy.data.images.new(name,width=N,height=N,alpha=True)
    if data:im.colorspace_settings.name='Non-Color'
    rgba=np.ones((N,N,4),np.float32)
    rgba[:,:,:3]=values if values.ndim==3 else values[:,:,None]
    im.pixels.foreach_set(rgba.ravel());im.filepath_raw=OUT+'/'+name+'.png';im.file_format='PNG';im.save();im.pack();return im
albedo=image('ground-albedo',rgb);roughness=image('ground-roughness',rough,True);normalmap=image('ground-normal',normal,True)
m=bpy.data.materials.new('Damp_Soil_PBR');m.use_nodes=True;n=m.node_tree.nodes;l=m.node_tree.links;p=n.get('Principled BSDF')
for im,socket in [(albedo,'Base Color'),(roughness,'Roughness')]:
    t=n.new('ShaderNodeTexImage');t.image=im;l.new(t.outputs['Color'],p.inputs[socket])
t=n.new('ShaderNodeTexImage');t.image=normalmap;nm=n.new('ShaderNodeNormalMap');nm.inputs['Strength'].default_value=.22;l.new(t.outputs['Color'],nm.inputs['Color']);l.new(nm.outputs['Normal'],p.inputs['Normal'])
ground.data.materials.clear();ground.data.materials.append(m)
# Remove obsolete ground vertex tint: atlas includes its path/moss distribution.
for a in list(ground.data.color_attributes):ground.data.color_attributes.remove(a)
def colored_mesh(name,verts,faces,colors):
    d=bpy.data.meshes.new(name);d.from_pydata(verts,[],faces);d.update()
    o=bpy.data.objects.new(name,d);scene.collection.objects.link(o);o.parent=root
    m=bpy.data.materials.new(name+'_Material');m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Roughness'].default_value=.94
    col=m.node_tree.nodes.new('ShaderNodeVertexColor');col.layer_name='Color';m.node_tree.links.new(col.outputs['Color'],p.inputs['Base Color']);d.materials.append(m)
    a=d.color_attributes.new(name='Color',type='FLOAT_COLOR',domain='POINT')
    for item,c in zip(a.data,colors):item.color=(*c,1)
    return o
random.seed(553);verts=[];faces=[];colors=[]
def z_at(x,y):
    # Raycast the changed floor rather than guessing its height.
    hit,p,_,_=ground.ray_cast(Vector((x,y,3)),Vector((0,0,-1)))
    return p.z+.005 if hit else 0
for i in range(1100):
    y=random.uniform(-4,23);x=.8*math.sin(y*.26)+random.choice([-1,1])*random.uniform(.7,4.5)
    z=z_at(x,y);a=random.random()*math.tau;L=random.uniform(.065,.15);W=L*random.uniform(.25,.48)
    u=Vector((math.cos(a),math.sin(a),0));v=Vector((-u.y,u.x,0));p=Vector((x,y,z));j=len(verts)
    verts.extend([p-u*L*.5,p-v*W*.5+Vector((0,0,.008)),p+Vector((0,0,.012)),p+v*W*.5+Vector((0,0,.006)),p+u*L*.5+Vector((0,0,.018))])
    faces.extend([(j,j+1,j+2),(j,j+2,j+3),(j+4,j+2,j+1),(j+4,j+3,j+2)])
    f=random.uniform(.55,1.3);c=random.choice([(.12,.062,.021),(.075,.044,.023),(.13,.10,.045)])
    colors.extend([tuple(k*f for k in c)]*5)
colored_mesh('Fallen_Leaf_Litter',verts,faces,colors)
verts=[];faces=[];colors=[]
for i in range(440):
    y=random.uniform(-4,23);x=.8*math.sin(y*.26)+random.uniform(-2.5,2.5);p=Vector((x,y,z_at(x,y)));r=random.uniform(.013,.043);j=len(verts)
    verts.extend([p+Vector((-r,-r*.6,0)),p+Vector((r,-r*.6,0)),p+Vector((r*.7,r*.6,0)),p+Vector((-r*.7,r*.6,0)),p+Vector((0,0,r*.65))])
    faces.extend([(j,j+1,j+4),(j+1,j+2,j+4),(j+2,j+3,j+4),(j+3,j,j+4)])
    f=random.uniform(.5,1.4);colors.extend([(.09*f,.092*f,.085*f)]*5)
colored_mesh('Path_Pebbles',verts,faces,colors)
bpy.context.view_layer.update();bpy.ops.object.select_all(action='DESELECT');root.select_set(True)
for o in root.children_recursive:
    if o.name in scene.objects:o.select_set(True)
bpy.context.view_layer.objects.active=root
bpy.ops.export_scene.gltf(filepath=OUT+'/enchanted-forest-ground-v2.glb',export_format='GLB',use_selection=True,use_active_scene=True,export_apply=True)
scene.render.filepath=OUT+'/preview-ground-v2.png'
bpy.ops.wm.save_as_mainfile(filepath=OUT+'/enchanted-forest-ground-v2.blend')
bpy.ops.render.render(write_still=True)
print('GROUND_V2_DONE')
