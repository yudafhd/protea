# Enchanted forest

Procedural fantasy forest assembled in Blender 4.5.13 for Protea's second scene.

## Contents

- Ancient trees with exposed roots, branching crowns and dense leaf clusters.
- A winding dirt path across an undulating mossy floor.
- Reused Emberveil mushrooms, forest ferns, mossy rocks and the fallen log.
- Cool drifting spores and pale blue emissive mushroom materials.
- Blender preview atmosphere: blue world, height-dependent volumetric mist, moon shafts and blue depth lighting.

## Files

- `enchanted-forest-blue-mist.blend`: current editable source with unified blue lighting and fog; use this for further editing.
- `enchanted-forest-blue-mist.glb`: current runtime geometry and materials, approximately 3.9 MiB.
- `preview-blue-mist.png`: current 960 × 640 EEVEE preview.
- `blue-mist-atmosphere.json`: companion lighting, fog and exposure settings for application integration; these are not applied automatically by loading the GLB.
- `enchanted-forest-soil-unified.blend`, `enchanted-forest-soil-unified.glb`, `preview-soil-unified.png`: retained previous soil-matching version.
- `SOIL-UNIFIED.md`: details of the shared soil material, flattened mushroom bases and softened lighting response.
- `ancient-tree.glb`: reusable tree asset, approximately 375 KiB.
- `enchanted-forest.blend`, `enchanted-forest.glb`, `preview.png`: retained original forest baseline, before soil refinements.
- Generators retained in `scripts/`: `enchanted-forest.py`, `refine-forest-ground.py`, `match-mushroom-ground.py`, `unify-soil-appearance.py`, `forest-blue-mist.py`. The blue-mist script operates on the refined forest scene. Intermediate outputs are generated as needed and are not required to open the current asset.

Discarded soil experiments, their PNG maps, old previews and Blender automatic backups were removed from this project directory. The final soil uses no external texture maps.

The blue-mist version removes the previous brown soil emission so soil responds to the shared lighting again. Mushroom glow and fill lights use cool colors, while denser low mist blends the ground and distant silhouettes. Geometry remains unchanged.

The GLB contains geometry, vertex colors and emissive materials. Blender lights, world, volumetric fog and compositor glow are presentation settings and are not part of the GLB export; reproduce them in Three.js with environment lighting, fog, spot/area lights and bloom. Geometry uses meters and glTF Y-up.

This is a visual master scene. For mobile runtime, keep the shared meshes instanced, reduce the number of tree nodes outside the camera path, and add distance LODs before production use. Blender render and GLB structure were verified; application integration is pending.
