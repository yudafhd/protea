# Emberveil mushroom cluster — v2

Reference-inspired fantasy asset made in Blender 4.5.13. Purple waved caps, amber radial gills, tapered curved stems and a leaf-covered earth patch. The active scene in the blend file is the final studio; earlier scenes are retained for comparison.

- Runtime: magical-mushroom-v2.glb (510,760 bytes, 1 scene, 14 meshes, 24,334 triangles, 6 materials).
- Editable source: magical-mushroom-v2.blend.
- Preview: preview.png, 800 × 800, rendered in EEVEE.
- Generator: scripts/mushroom-v2.py at the repository root; run inside Blender. Each run creates a new scene.
- Units: meters; root at ground origin. Vertex colors provide surface variation without external textures.
- GLB uses KHR_materials_emissive_strength. Preview lights and compositor bloom are not exported; matching the preview in Three.js requires scene lighting and bloom configuration.
- This detailed version is intended for close views. It exceeds the original 3–5k triangle scatter budget; a lower-detail variant is needed before dense forest placement.
- Not yet integrated or visually tested in the application runtime.
