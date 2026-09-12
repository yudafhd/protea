"""Unify the active forest into a blue-mist palette; preserve asset geometry."""
import bpy, json
OUT='/Users/yuda/Documents/Projects/protea/public/assets/models/enchanted-forest'
s=bpy.context.scene
ground=next(o for o in s.objects if o.type=='MESH' and 'Undulating_Forest_Floor' in o.name)
root=ground.parent
mats={m for o in s.objects if o.type=='MESH' for m in o.data.materials if m}
for m in mats:
    if not m.use_nodes:continue
    p=next((n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED'),None)
    if not p:continue
    if 'Unified_Brown_Soil' in m.name:
        # Restore light-responsive soil instead of the previous brown emission.
        p.inputs['Base Color'].default_value=(.043,.054,.063,1)
        p.inputs['Emission Strength'].default_value=0
        p.inputs['Roughness'].default_value=.93
        p.inputs['Specular IOR Level'].default_value=.16
    elif 'Amber_Gills' in m.name:
        p.inputs['Base Color'].default_value=(.13,.34,.47,1)
        p.inputs['Emission Color'].default_value=(.16,.45,.72,1)
        p.inputs['Emission Strength'].default_value=.85
    elif 'Warm_Underside' in m.name:
        p.inputs['Base Color'].default_value=(.045,.09,.13,1)
        p.inputs['Emission Color'].default_value=(.025,.07,.12,1)
        p.inputs['Emission Strength'].default_value=.3
    elif 'Firefly_Amber' in m.name:
        p.inputs['Base Color'].default_value=(.24,.47,.65,1)
        p.inputs['Emission Color'].default_value=(.24,.47,.65,1)
        p.inputs['Emission Strength'].default_value=2.5
    p.inputs['Roughness'].default_value=max(.70,p.inputs['Roughness'].default_value)
# Muted blue light reaches the entire composition rather than isolated props.
for o in s.objects:
    if o.type!='LIGHT':continue
    d=o.data
    if o.name.startswith('Moon_Canopy'):d.color=(.32,.50,1);d.energy=1450
    elif o.name.startswith('Camera_Fill'):d.color=(.34,.52,.85);d.energy=340
    elif o.name.startswith('Distant_Teal'):d.color=(.25,.48,1);d.energy=2100
    elif o.name.startswith('Moon_Shaft'):d.color=(.38,.60,1);d.energy=1100;d.spot_blend=.7
    elif o.name.startswith('Mushroom_Glow'):d.color=(.18,.52,1);d.energy=16;d.shadow_soft_size=.75
    elif o.name.startswith('Soil_Color_Fill'):d.energy=0
world=s.world;bg=world.node_tree.nodes.get('Background')
bg.inputs['Color'].default_value=(.035,.065,.14,1);bg.inputs['Strength'].default_value=.38
# Continuous height-dependent mist: denser near the ground, thinner at canopy.
fog=next(o for o in s.objects if o.type=='MESH' and o.name.startswith('Atmosphere_Mist'))
m=fog.data.materials[0];n=m.node_tree.nodes;l=m.node_tree.links
vol=next(node for node in n if node.type=='PRINCIPLED_VOLUME')
vol.inputs['Color'].default_value=(.57,.70,.86,1);vol.inputs['Anisotropy'].default_value=.25
tex=n.new('ShaderNodeTexCoord');sep=n.new('ShaderNodeSeparateXYZ');ramp=n.new('ShaderNodeValToRGB')
ramp.color_ramp.elements[0].position=.10;ramp.color_ramp.elements[0].color=(.075,.075,.075,1)
ramp.color_ramp.elements[1].position=.65;ramp.color_ramp.elements[1].color=(.018,.018,.018,1)
l.new(tex.outputs['Generated'],sep.inputs[0]);l.new(sep.outputs['Z'],ramp.inputs[0]);l.new(ramp.outputs['Color'],vol.inputs['Density'])
s.view_settings.view_transform='AgX';s.view_settings.look='AgX - Medium High Contrast';s.view_settings.exposure=.15
for n in s.node_tree.nodes:
    if n.type=='GLARE':n.threshold=1.4
s.render.filepath=OUT+'/preview-blue-mist.png'
# Record the presentation parameters because fog/world/light rig aren't in GLB.
settings={'units':'meters','blenderToGltf':'(x,y,z) -> (x,z,-y)',
 'world':{'colorLinear':[.035,.065,.14],'strength':.38},
 'mist':{'colorLinear':[.57,.70,.86],'lowDensity':.075,'upperDensity':.018,'anisotropy':.25},
 'bloomThreshold':1.4,'exposureStops':.15,'lights':[]}
for o in s.objects:
    if o.type=='LIGHT' and o.data.energy>0:
        d=o.data;settings['lights'].append({'name':o.name,'type':d.type,'positionBlender':list(o.location),'rotationEulerBlender':list(o.rotation_euler),'energyBlender':d.energy,'colorLinear':list(d.color)})
with open(OUT+'/blue-mist-atmosphere.json','w') as f:json.dump(settings,f,indent=2)
bpy.context.view_layer.update();bpy.ops.object.select_all(action='DESELECT');root.select_set(True)
for o in root.children_recursive:
    if o.name in s.objects:o.select_set(True)
bpy.context.view_layer.objects.active=root
bpy.ops.export_scene.gltf(filepath=OUT+'/enchanted-forest-blue-mist.glb',export_format='GLB',use_selection=True,use_active_scene=True,export_apply=True)
bpy.ops.wm.save_as_mainfile(filepath=OUT+'/enchanted-forest-blue-mist.blend')
bpy.ops.render.render(write_still=True)
print('BLUE_MIST_DONE')
