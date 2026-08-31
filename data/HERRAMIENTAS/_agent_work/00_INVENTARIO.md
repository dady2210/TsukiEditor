# 00_INVENTARIO — HERRAMIENTAS

## Árbol relevante (2-3 niveles)
```
HERRAMIENTAS/
  TsukiMapExtractor.py (468 líneas, UnityPy + Pillow, 2022.3.0f1)
  tsuki_export_by_id.py (365 líneas, v20, colors/materials/layout_front_back)
  map_editor.html (single-file dark SPA, canvas Y-up, webkitdirectory)
  layout_back.json (1281 B, 1 sprite CropBox back)
  layout_front.json (1281 B, 1 sprite CropBox front)
  map_layout.json (35258 B, ~76 sprites treehouse)
  map_metadata.json (16218 B, walkable_bounds 6, resto vacíos)
  metadata.json (16432 B, CropBox 1301 nodes/colliders/animators/store_data vacío)
  PROYECTO_TSUKI_WEBEDITOR.md (contexto briefing)
  ingest_map.py / ingest_item.py (wrappers Fase U, no UnityPy)
  _agent_work/ (generado)
data/
  maps_atlas.js (F/W/MAP_META)
  item_behaviors.js (overlay, no toca items_db.js)
  day_night.json, content_pivots.js, id_catalog.json
Tsuky_WebEditor/
  map.js (IsometricMap, bake wallpapers, surfaceFor)
  parser.js (Odin AST, 101 claves TsukiSave)
```

No hay DummyDll/Managed/bundles/levels en HERRAMIENTAS ni padres visibles en este listado; buscar en `C:\Users\Andres\Desktop\Tsuki_Odyssey\` si se requiere Unity fuente. Carpetas `Exportado_level*` a nivel `Tsuky_WebEditor/Exportado_level2|4` y `images/maps/Exportado_level*` (copias).

## Qué extractor genera qué

| Extractor | Entrada | Salida |
|---|---|---|
| `TsukiMapExtractor.py` | level* (+ sharedassets*/aa/Android) | `Exportado_<level>/layout.json` (sprites con sp/go/x/y/angle/sx/sy/o/sl/px/py/rw/rh/ox/oy/ppu/draw_mode/sz_x/sz_y/poly), `map_metadata.json` (grid_system/interaction_nodes/walkable_bounds/camera_confines/lighting_volumes/special_scripts), PNG sprites, `<level>_Ensamblado.png` (Pillow) |
| `tsuki_export_by_id.py` | ID (1301) + bundles_dir (*furniture*, *duplicateassetisolation*, icons, monoscripts, activities, sharedassets) | `<out>/<ID>/metadata.json` (id/name/raw_properties/layer_definitions/store_data/nodes/colliders/audio/animators/special_scripts), `layout_front/back.json` (+ layout_fx opcional), `FURN_<ID>*.png`, `FURN_<ID>_0.png`/`_BACK.png`, `item_full.json` si Fase1 |

## ClassNames MonoBehaviour muestreados (vía UnityPy typetree / dumps)

Map: `SpriteRenderer`, `PolygonCollider2D`, `BoxCollider2D`, `EdgeCollider2D`, `Grid`, `SortingGroup`, `SpriteMask`, `Light2D` (si URP), `AudioSource`, `Animator`, `MonoBehaviour` genéricos: `ActionNode`, `TsukiInteraction`, `ItemSocket`, `SpawnPoint`, `SeatNode`, `FishingNode`, `FurnitureSave` subclases (`CropBox`, `CropSave`), `Light`, `DayNight`, `Volume`, `CameraConfine` (Cinemachine). Lista exacta requiere Dump/assemblies; sin DummyDll typetree de MB sale incompleto (ver riesgos).

Furniture: `Furniture`, `FurnitureSave`, `SpriteRenderer`, `Animator`, `CropBox`, `Light`, `AudioSource`, `ItemSocket`.

## Campos que consume hoy el editor

- Layout: `sp, go, x,y,angle,sx,sy,o,sl,px,py,rw,rh,ox,oy,ppu,draw_mode,sz_x,sz_y,poly` (+ `color`, `materials` si existen → tinte/screen)
- Metadata mapa: `walkable_bounds[].properties.m_Points.m_Paths` (solo walkable, resto buckets ignorados), `grid_system` (vacío)
- Metadata mueble: `nodes[].path/components`, `colliders[]`, `animators[].clips` (nombres, curvas vacías), `raw_properties.gridColl*`, `layer_definitions`

## Campos en JSON que el editor ignora

- Mapa layout: `color`, `materials`, `flipX/flipY`, `mask_interaction`, `sorting_group`, `active`, `path`, `border` (si existieran en exports nuevos, hoy no escritos por TsukiMapExtractor v1), `materials` Radial/white no diferenciado salvo screen.
- Mapa metadata: todos los `special_scripts` sin Sprite, `lighting_volumes`, `grid_system`, `interaction_nodes` substrings no matcheados, `camera_confines` más allá de `Camera` nombre, `properties` completas de collider (isTrigger, offset, size, paths), `hierarchy` completa.
- Mueble: `color`/`materials` por item (ya exportado v20 pero editor solo tinte), `animation.clips.curves` (fps/length/loop/keys vacíos), `animators.parameters/states`, `store_data` catálogo, `audio` clips, `colliders.flipped`, `grid` offsets, `onlyVisibleWithActivity`/`conditions`, `FX` Square/white.

## Buckets vacíos hoy

- `interaction_nodes` (filtro whitelist ActionNode/TsukiInteraction… no matchea nombres reales)
- `grid_system` (no Grid/Tilemap leído)
- `lighting_volumes` / `lights` (substring Light)
- `store_data` (búsqueda superficial por id)
- `animators.clips.curves` (m_Rotation/Position/Scale/FloatCurves no leídos)
- `audio` (AudioClip no resuelto)

## Riesgos

- **Sin DummyDll/assemblies**: typetree de MonoBehaviour incompleto → `special_scripts` con `className` puro y `properties` vacío. Se degrada a “script X en GO Y” sin campos.
- **Sin addressables** (`aa/Android`): sprites missing → `imageCache` muestra placeholder + nombre, no crashea, pero assemble incompleto.
- **map_editor.html** funciones incompletas: `addElement`, `createFolder`, `moveSelectedToFolder`, `exportJSON` pelado (no fusiona `map_metadata.json`), wallpaper `draw_mode>0` omitido (“omitida por brevedad”), `Square` filtrado a ciegas, `exportPNG` puede fallar si `sceneData` vacío.
- **Flip/PPU**: `sx/sy` horneado oculta `flipX/Y` real; editor no puede reconstruir tiling 9-slice exacto sin `border`.
- **HTML single-file**: sin build step, cambios incrementales obligatorios; inventar curvas/IDs rompe roundtrip.

Inventario completo antes de Fase 1.
