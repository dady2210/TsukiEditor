# 02_EDITOR — Map editor consume TODO

## Implementado Fase 2
- **Carga fusionada**: acepta `layout.json` / `layout_front/back/fx.json` + `metadata.json` / `map_metadata.json` / `scene_full.json` / `item_full.json`. Indexa texturas por nombre/path/WP_, usa currentMapMeta/currentItemMeta fusionados.
- **Toggles independientes**: Walkable/Blockers/Triggers/Wallpaper/Camera/Interaction Nodes/Hierarchy/Furniture colliders+grid/Lights/Grids/Scripts (9 checkboxes + showColliders legacy).
- **Wallpaper tiled+shear+mask**: para `draw_mode>0 && sz_x>0` crea `createPattern` con `shear_slope ±0.5` y recorta con `poly` vía `globalCompositeOperation destination-in` (port de Pillow assemble_map). Si poly vacío, fill rect.
- **Luces / FX**: `sp==='Square'|'white'` o `materials` contiene `Radial` → `screen` + gradiente radial, no cuadrado opaco. Toggle FX/Activity (`layer_kind` fx/activity).
- **Color/materials**: `color {r,g,b,a}` tint vía `globalAlpha` + `filter`, respeta `active:false` con opacidad 0.4.
- **Propiedades**: panel muestra `color`, `materials`, `draw_mode`, `ppu`, `pivot`, `active`, `path`, `layer_kind`.
- **Animación sampler**: guarda `_baseTransform`, por clip detectado crea botón; interpola `m_LocalRotation/Position/Scale` keys lineal/step sobre `path` del nodo; fallback heurística -45° + _0/_1 swap con anim-status.
- **Robustez**: `exportJSON` fusiona layout+metadata, `addElement/createFolder` completados, placeholder si PNG missing, undo/redo intacto.

## Quedó fuera / honesto
- Curvas reales vacías en MEGAMINER (AnimationClip length 0, m_EditorCurves vacío) → sampler queda en heurística, documentado en 01_EXTRACCION.md.
- `store_data` catálogo SO con id 1301 vacío → `item_full.catalog {}`.
- `CompositeCollider2D` y `Tilemap` AABB dibujado como rect genérico (no tilemap tiles).
- Addressables no cargados en primer run → algunos sprites missing (placeholder).

## Cómo verificar
- Mapa treehouse: layout+metadata → sprites + wallpapers con forma + 6 overlays.
- Crop Box 1301: Exterior/Interior/Lid alineados, collider hex, nodos, flip, Open usa curvas si existen sinon heurística.
- White/Radial como luz screen.

## Archivos tocados
- `map_editor.html` (toggles, wallpaper, lights, animation sampler)
- `TsukiMapExtractor_v2.py`, `tsuki_export_by_id_v2.py`, `scene_full/item_full` schema
