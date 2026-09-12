"""Run inside Blender: seeded fern, two meshes, vertex colors, no textures."""
import bpy, math, random, os, json
from mathutils import Vector
random.seed(81)
out='/Users/yuda/Documents/Projects/protea/public/assets/models/forest-fern'
os.makedirs(out,exist_ok=True)
scene=bpy.data.scenes.new('Forest_Fern_Studio'); bpy.context.window.scene=scene
root=bpy.data.objects.new('Forest_Fern',None); scene.collection.objects.link(root)
def material(name):
    m=bpy.data.materials.new(name); m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF'); p.inputs['Roughness'].default_value=.76
    c=m.node_tree.nodes.new('ShaderNodeVertexColor'); c.layer_name='Color'
    m.node_tree.links.new(c.outputs['Color'],p.inputs['Base Color']); return m
def mesh(name,v,f,c):
    d=bpy.data.meshes.new(name); d.from_pydata(v,[],f); d.update()
    o=bpy.data.objects.new(name,d); scene.collection.objects.link(o); o.parent=root
    d.materials.append(material(name+'_PBR'))
    attr=d.color_attributes.new(name='Color',type='FLOAT_COLOR',domain='POINT')
    for a,color in zip(attr.data,c): a.color=(*color,1)
    for p in d.polygons:p.use_smooth=True
    return o
lv=[]; lf=[]; lc=[]; sv=[]; sf=[]; sc=[]
for frond in range(7):
    angle=frond*math.tau/7+random.uniform(-.15,.15)
    u=Vector((math.cos(angle),math.sin(angle),0)); side=Vector((-u.y,u.x,0))
    length=random.uniform(.34,.49); spread=random.uniform(.68,.90)
    def path(t):return u*(length*spread*t**1.4)+Vector((0,0,length*(1.55*t-.94*t*t)))
    # Tapered stem follows the same arch as the leaf pairs.
    start=len(sv)
    for j in range(21):
        t=j/20; p=path(t); radius=.0035*(1-.83*t)
        tangent=(path(min(1,t+.002))-path(max(0,t-.002))).normalized(); n=tangent.cross(side).normalized()
        for k in range(6):
            a=k*math.tau/6; sv.append(p+radius*(side*math.cos(a)+n*math.sin(a))); sc.append((.045+.035*t,.09+.08*t,.015))
    for j in range(20):
        for k in range(6):
            a=start+j*6+k;b=start+j*6+(k+1)%6;sf.append((a,b,b+6,a+6))
    sf.extend([tuple(start+k for k in reversed(range(6))),tuple(start+120+k for k in range(6))])
    for pair in range(15):
        t=.16+pair*.053; size=length*.235*(math.sin(math.pi*(t-.07))**.55)*(1-t)**.48
        for sign in [-1,1]:
            p=path(t+sign*.007); direction=(side*sign*.87+u*.43).normalized()
            across=Vector((-direction.y,direction.x,0)); start=len(lv)
            for j in range(7):
                s=j/6; width=size*.19*math.sin(math.pi*s)**.75
                width*=1+.15*math.sin(j*2.6+pair)
                mid=p+direction*(size*s)+Vector((0,0,size*(.20*math.sin(math.pi*s)-.10*s)))
                for k in [-1,0,1]:
                    lv.append(mid+across*(width*k)+Vector((0,0,-abs(k)*width*.20)))
                    brightness=random.uniform(.91,1.09); vein=1.18 if k==0 else 1
                    lc.append(((.022+.052*t)*brightness*vein,(.075+.14*t)*brightness*vein,(.012+.023*t)*brightness))
            for j in range(6):
                for k in range(2):
                    a=start+j*3+k; lf.append((a,a+1,a+4,a+3))
            # Closed pointed tip silhouette with negligible width at both ends.
    # Narrow terminal leaflet continuing each frond.
    a=len(lv); p=path(.94); tip=path(1.06)
    lv.extend([p-side*.004,p+side*.004,tip]);lf.append((a,a+1,a+2));lc.extend([(.075,.20,.03)]*3)
leaves=mesh('Fern_Leaflets',lv,lf,lc); stems=mesh('Fern_Rachises',sv,sf,sc)
# Leaf planes render on both sides in Blender and exported glTF.
leaves.data.materials[0].use_backface_culling=False
root['units']='meters'; root['fronds']=7; root['seed']=81
world=bpy.data.worlds.new('Fern_Studio_World'); world.use_nodes=True
world.node_tree.nodes['Background'].inputs[0].default_value=(.015,.025,.022,1)
world.node_tree.nodes['Background'].inputs[1].default_value=.35; scene.world=world
for name,pos,power,color in [('Key',(.4,-.6,1),45,(1,.91,.74)),('Rim',(-.5,.4,.8),50,(.40,.77,.72)),('Fill',(.4,.6,.3),15,(.65,.8,1))]:
    d=bpy.data.lights.new(name,'AREA');d.energy=power;d.color=color;d.size=.8
    o=bpy.data.objects.new(name,d);scene.collection.objects.link(o);o.location=pos
    o.rotation_euler=(Vector((0,0,.15))-o.location).to_track_quat('-Z','Y').to_euler()
d=bpy.data.cameras.new('Fern_Camera');o=bpy.data.objects.new('Fern_Camera',d);scene.collection.objects.link(o)
o.location=(.8,-1,.85);o.rotation_euler=(Vector((0,0,.14))-o.location).to_track_quat('-Z','Y').to_euler();d.type='ORTHO';d.ortho_scale=.95;scene.camera=o
scene.render.engine='BLENDER_EEVEE_NEXT';scene.eevee.taa_render_samples=32
scene.render.resolution_x=600;scene.render.resolution_y=600;scene.render.resolution_percentage=100
scene.view_settings.view_transform='AgX';scene.view_settings.look='AgX - Medium High Contrast'
scene.render.image_settings.file_format='PNG';scene.render.filepath=out+'/preview.png'
bpy.ops.object.select_all(action='DESELECT')
for o in [root,leaves,stems]:o.select_set(True)
bpy.context.view_layer.objects.active=root
bpy.ops.export_scene.gltf(filepath=out+'/forest-fern.glb',export_format='GLB',use_selection=True,use_active_scene=True,export_apply=True)
bpy.ops.wm.save_as_mainfile(filepath=out+'/forest-fern.blend')
bpy.ops.render.render(write_still=True)
print('FERN_DONE')
