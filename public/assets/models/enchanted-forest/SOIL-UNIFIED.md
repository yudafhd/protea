# Unified visible soil color

Latest scene: `enchanted-forest-soil-unified.blend`; runtime geometry: `enchanted-forest-soil-unified.glb`; preview: `preview-soil-unified.png`.

Forest floor and all six mushroom soil bases share `Unified_Brown_Soil`. Mushroom bases are projected onto the floor with 1.5 mm clearance. Their individual vertex tints are removed. A low emissive brown baseline reduces the differing cyan/amber lighting response. This is a stylized color-consistency adjustment, with weaker ground shadows than a fully diffuse soil shader. Trees, mushrooms and atmosphere retain their previous materials and lighting.

Generator: `scripts/unify-soil-appearance.py`. Blender preview checked; Three.js integration remains pending. Geometry/material export includes this shared shading, but fog, lights and bloom still require runtime setup.
