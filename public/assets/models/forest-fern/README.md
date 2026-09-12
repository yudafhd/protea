# Forest fern

Seven arching fronds, tapered paired leaflets and vertex-colored green variation. Created in Blender 4.5.13 with `scripts/forest-fern.py`. Each generator run creates a separate scene.

- `forest-fern.glb`: 234,160 bytes; 1 scene, 2 meshes, 6,783 triangles, 2 double-sided PBR materials; no textures or emissive material.
- `forest-fern.blend`: editable source; final scene is `Forest_Fern_Studio`. Earlier asset scenes are retained.
- `preview.png`: one 600 × 600 EEVEE studio preview.
- Units: meters. Ground-level root, roughly 80 cm spread; GLB exports Y-up.
- Leaflets are thin double-sided surfaces with a raised central vein. Lighting and camera are excluded from the GLB.

Verified render and GLB structure. Not integrated into scene two or tested in the browser. For dense scatter, use instancing and consider a lower-detail variant.
