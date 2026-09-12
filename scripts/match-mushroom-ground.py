"""Match the forest floor to the existing mushroom soil material and palette."""
import bpy, random
from mathutils import Vector
from mathutils.noise import noise
OUT='/Users/yuda/Documents/Projects/protea/public/assets/models/enchanted-forest'
scene=bpy.context.scene
ground=next(o for o in scene.objects if o.type=='MESH' and 'Undulating_Forest_Floor' in o.name)
source=next(o for o in scene.objects if o.type=='MESH' and 'Uneven_Forest_Earth' in o.name)
soil=source.data.materials[0]
palette=[tuple(c.color[:3]) for c in source.data.color_attributes.active_color.data]
mean=tuple(sum(c[k] for c in palette)/len(palette) for k in range(3))
ground.data=ground.data.copy()
ground.data.materials.clear();ground.data.materials.append(soil)
for a in list(ground.data.color_attributes):ground.data.color_attributes.remove(a)
attr_name=next(n.layer_name for n in soil.node_tree.nodes if n.type=='VERTEX_COLOR')
attr=ground.data.color_attributes.new(name=attr_name,type='FLOAT_COLOR',domain='POINT')
rng=random.Random(202)
for vertex,item in zip(ground.data.vertices,attr.data):
    x,y,z=vertex.co
    # The same sampled palette as the mushroom base, with restrained variation.
    sample=rng.choice(palette)
    mix=.30+.20*noise(Vector((x*1.8,y*1.8,4)))
    color=tuple(mean[k]*(1-mix)+sample[k]*mix for k in range(3))
    item.color=(*color,1)
ground.data.color_attributes.active_color=attr
root=ground.parent;bpy.context.view_layer.update()
bpy.ops.object.select_all(action='DESELECT');root.select_set(True)
for o in root.children_recursive:
    if o.name in scene.objects:o.select_set(True)
bpy.context.view_layer.objects.active=root
bpy.ops.export_scene.gltf(filepath=OUT+'/enchanted-forest-ground-matched.glb',export_format='GLB',use_selection=True,use_active_scene=True,export_apply=True)
scene.render.filepath=OUT+'/preview-ground-matched.png'
bpy.ops.wm.save_as_mainfile(filepath=OUT+'/enchanted-forest-ground-matched.blend')
bpy.ops.render.render(write_still=True)
print('MATCHED',soil.name,'palette mean',mean)
