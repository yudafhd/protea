# Grand Hall — blockout

Created with Blender MCP. Select the `Grand Hall Blockout` scene in the Blender project.

- `grand-hall-blockout.blend`: editable architecture, eight lanterns, altar, window, camera and lighting. Existing garden scene preserved.
- `grand-hall-blockout.glb`: hall geometry, emissive materials, portrait camera and four point lights.
- `preview.png`: 432 × 768 Blender render.

Blender coordinates: floor X ±5.5, Y −10 to 20, Z up. Camera (0, −12, 3.4), looking toward (0, 9, 5.7), lens 23 mm.
After glTF conversion: camera (0, 3.4, 12), target (0, 5.7, −9), Y up. Use the exported camera and update its aspect for the viewport.

Blender area lights, world lighting and compositor glow are not included in GLB. Recreate cool fill lighting and bloom in R3F. This is a composition blockout, not a finished template: no character, gameplay, textures or foliage yet. Geometry is not yet batched for mobile.
