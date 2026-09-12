"""Blender generator: three reusable mossy rocks, no external textures."""
import bpy, math, random, os
from mathutils import Vector, noise
random.seed(432)
OUT='/Users/yuda/Documents/Projects/protea/public/assets/models/forest-rocks'
os.makedirs(OUT,exist_ok=True)
scene=bpy.data.scenes.new('Forest_Rocks_Studio'); bpy.context.window.scene=scene
def material(name,rough):
    m=bpy.data.materials.new(name);m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Roughness'].default_value=rough
    c=m.node_tree.nodes.new('ShaderNodeVertexColor');c.layer_name='Color'
    m.node_tree.links.new(c.outputs['Color'],p.inputs['Base Color']);return m
stone=material('Weathered_Slate',.89);moss=material('Rock_Moss',.98)
def colorize(obj,colors,mat):
    obj.data.materials.append(mat)
    a=obj.data.color_attributes.new(name='Color',type='FLOAT_COLOR',domain='POINT')
    for d,c in zip(a.data,colors):d.color=(*c,1)
    for p in obj.data.polygons:p.use_smooth=True
roots=[]
for i,(name,scale,pos) in enumerate([
    ('Boulder',(.34,.26,.24),(-.32,.12,0)),
    ('Flat_Stone',(.26,.19,.10),(.28,.12,0)),
    ('Small_Rock',(.15,.12,.13),(.03,-.29,0))]):
    root=bpy.data.objects.new(name,None);scene.collection.objects.link(root);roots.append(root)
    root.location=pos;root['units']='meters';root['origin']='ground center'
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=4,radius=1)
    obj=bpy.context.object;obj.name=name+'_Stone';obj.parent=root
    colors=[];offset=Vector((i*4.17,1.21,3.4))
    for v in obj.data.vertices:
        p=v.co.copy();n=noise.noise_vector(p*2+offset)
        p+=n*.16
        # Eroded planes, asymmetry and slightly recessed narrow fissures.
        p.x=min(p.x,.79+.10*p.z);p.y=max(p.y,-.80+.12*p.x)
        fiss=abs(math.sin(p.x*3.7+p.z*2.4+noise.noise(p*3+offset)*.35+i))
        if fiss<.055:p*=1-(.055-fiss)*.55
        v.co=(p.x*scale[0],p.y*scale[1],max(-.56,p.z)*scale[2])
        f=.72+.35*noise.noise(p*5+offset)+.10*noise.noise(p*21+offset)
        if fiss<.07:f*=.58+.42*fiss/.07
        cover=max(0,min(1,(noise.noise(Vector((p.x*scale[0],p.y*scale[1],p.z*scale[2]))*15+offset)-.01)*6))*max(0,min(1,(p.z-.05)*4))
        base=(.085*f,.105*f,.13*f); green=(.033*f,.076*f,.012*f)
        colors.append(tuple(base[k]*(1-cover)+green[k]*cover for k in range(3)))
    bottom=min(v.co.z for v in obj.data.vertices)
    for v in obj.data.vertices:v.co.z-=bottom
    colorize(obj,colors,stone);obj.data.update()
    # Individual tiny cushions on upward-facing faces, clustered rather than uniform.
    verts=[];faces=[];cols=[]
    for poly in obj.data.polygons:
        if poly.normal.z<.45:continue
        p=poly.center;patch=noise.noise(p*15+offset)
        if patch<.04 or random.random()<.30:continue
        n=poly.normal;u=n.cross(Vector((0,1,0))).normalized();w=n.cross(u)
        r=random.uniform(.006,.014)*(1 if i<2 else .7)
        start=len(verts);p=p+n*.001
        verts.extend([p-u*r,p+w*r*.7,p+n*r*.65,p-w*r*.7,p+u*r])
        faces.extend([(start,start+1,start+2),(start,start+2,start+3),(start+4,start+2,start+1),(start+4,start+3,start+2)])
        f=random.uniform(.7,1.3);cols.extend([(.037*f,.093*f,.013*f)]*5)
    d=bpy.data.meshes.new(name+'_Moss');d.from_pydata(verts,[],faces);d.update()
    mo=bpy.data.objects.new(name+'_Moss',d);scene.collection.objects.link(mo);mo.parent=root
    colorize(mo,cols,moss)
def export(filename,items):
    bpy.ops.object.select_all(action='DESELECT')
    for root in items:
        root.select_set(True)
        for o in root.children_recursive:o.select_set(True)
    bpy.context.view_layer.objects.active=items[0]
    bpy.ops.export_scene.gltf(filepath=OUT+'/'+filename+'.glb',export_format='GLB',use_selection=True,use_active_scene=True,export_apply=True)
for root in roots:
    pos=root.location.copy();root.location=(0,0,0)
    export(root.name.split('.')[0].lower(),[root]);root.location=pos
export('forest-rocks-pack',roots)
world=bpy.data.worlds.new('Rock_Studio');world.use_nodes=True;scene.world=world
world.node_tree.nodes['Background'].inputs[0].default_value=(.018,.027,.03,1)
world.node_tree.nodes['Background'].inputs[1].default_value=.4
for name,pos,power,col in [('Key',(-.7,-1,1.5),60,(1,.9,.76)),('Rim',(.4,.7,1),45,(.4,.74,.85)),('Fill',(1,-.5,.6),15,(.7,.8,1))]:
    d=bpy.data.lights.new(name,'AREA');d.energy=power;d.color=col;d.size=1.2
    o=bpy.data.objects.new(name,d);scene.collection.objects.link(o);o.location=pos
    o.rotation_euler=(Vector((0,0,.1))-o.location).to_track_quat('-Z','Y').to_euler()
d=bpy.data.cameras.new('Rocks_Camera');o=bpy.data.objects.new('Rocks_Camera',d);scene.collection.objects.link(o)
o.location=(.7,-1.3,1);o.rotation_euler=(Vector((0,0,.1))-o.location).to_track_quat('-Z','Y').to_euler();d.type='ORTHO';d.ortho_scale=1.3;scene.camera=o
scene.render.engine='BLENDER_EEVEE_NEXT';scene.eevee.taa_render_samples=32
scene.render.resolution_x=600;scene.render.resolution_y=600;scene.render.resolution_percentage=100
scene.view_settings.view_transform='AgX';scene.view_settings.look='AgX - Medium High Contrast'
scene.render.image_settings.file_format='PNG';scene.render.filepath=OUT+'/preview.png'
bpy.ops.wm.save_as_mainfile(filepath=OUT+'/forest-rocks.blend')
bpy.ops.render.render(write_still=True)
print('ROCKS_DONE')
