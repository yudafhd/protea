# Mossy fallen log

Blender 4.5.13 fantasy forest asset. Approximately 1.2 m long, with a gently curved trunk, deep bark furrows, irregular end grain, broken wood fibres, a snapped branch and moss patches. Style is sculpted/stylized rather than photorealistic.

## Files

- `mossy-fallen-log.glb`: standalone wood and moss; 574,520 bytes, 6 meshes, 16,738 triangles.
- `log-with-mushrooms.glb`: wood with three reused Emberveil mushrooms; 980,772 bytes, 18 meshes, 39,286 triangles.
- `mossy-fallen-log.blend`: editable source with final `Fallen_Log_Studio` scene and retained previous scenes.
- `preview.png`: 1000 × 750 EEVEE composition render.
- Generator: `scripts/fallen-log.py` in the project root. Run inside Blender with a mushroom-v2 scene active to include mushrooms; otherwise it builds the standalone log.

The root is at ground origin; glTF exports use meters and Y-up. Vertex colors carry the surface colors, with no external textures. Preview lamps and compositor glow are not included in GLB. The mushroom export uses KHR_materials_emissive_strength.

These are close-view assets. Dense repetition needs lower LODs or optimized instancing. Export structure and preview were checked; application integration and browser visual verification are pending.
