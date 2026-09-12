"""Unify soil color under the forest's mixed blue and amber lighting."""
import bpy
from mathutils import Vector
OUT='/Users/yuda/Documents/Projects/protea/public/assets/models/enchanted-forest'
s=bpy.context.scene
ground=next(o for o in s.objects if o.type=='MESH' and 'Undulating_Forest_Floor' in o.name)
bases=[o for o in s.objects if o.type=='MESH' and 'Uneven_Forest_Earth' in o.name]
soil=[ground]+bases
# A shared exact palette avoids per-asset random brightness jumps.
color=(.0392,.02352,.01181,1)
for obj in soil:
    obj.data=obj.data.copy()
    attr=obj.data.color_attributes.active_color
    for item in attr.data:item.color=color
# Project the separate mushroom soil surfaces onto the existing terrain.
# Tiny clearance prevents coincident faces while removing the raised perimeter.
for obj in bases:
    inv=obj.matrix_world.inverted();ground_inv=ground.matrix_world.inverted()
    for v in obj.data.vertices:
        p=obj.matrix_world@v.co
        hit,q,_,_=ground.ray_cast(ground_inv@Vector((p.x,p.y,4)),Vector((0,0,-1)))
        if hit:
            p.z=(ground.matrix_world@q).z+.0015
            v.co=inv@p
    obj.data.update()
# Color-stabilized stylized soil. A low emissive baseline limits hue shifts
# from the intense cyan/amber lamps; this deliberately softens soil shadows.
m=ground.data.materials[0].copy();m.name='Unified_Brown_Soil'
p=m.node_tree.nodes.get('Principled BSDF')
for link in list(m.node_tree.links):
    if link.to_socket==p.inputs['Base Color']:m.node_tree.links.remove(link)
p.inputs['Base Color'].default_value=(.00784,.004704,.002362,1)
p.inputs['Emission Color'].default_value=color
p.inputs['Emission Strength'].default_value=.8
p.inputs['Specular IOR Level'].default_value=.08
for obj in soil:
    obj.data.materials.clear();obj.data.materials.append(m)
    for a in list(obj.data.color_attributes):obj.data.color_attributes.remove(a)
bpy.context.view_layer.update()
root=ground.parent;bpy.ops.object.select_all(action='DESELECT');root.select_set(True)
for obj in root.children_recursive:
    if obj.name in s.objects:obj.select_set(True)
bpy.context.view_layer.objects.active=root
bpy.ops.export_scene.gltf(filepath=OUT+'/enchanted-forest-soil-unified.glb',export_format='GLB',use_selection=True,use_active_scene=True,export_apply=True)
s.render.filepath=OUT+'/preview-soil-unified.png'
bpy.ops.wm.save_as_mainfile(filepath=OUT+'/enchanted-forest-soil-unified.blend')
bpy.ops.render.render(write_still=True)
print('SOIL_UNIFIED',len(soil))
