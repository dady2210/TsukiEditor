# 01_EXTRACCION — Campos nuevos y conteos

## Fuentes usadas
- Mapa: `C:\Users\Andres\Desktop\Tsuki_Odyssey\TSUKI MOVIL\MEGAMINER\level2` (+ sharedassets*, MEGAMINER bundles) → `Exportado_level2` con TsukiMapExtractor_v2.py (DummyDll: `TSUKI MOVIL\Dumper\DummyDll`)
- Mueble: `MEGAMINER/1301` (Crop Box) → tsuki_export_by_id_v2.py (mismo DummyDll), 6 PNG + layouts

## Campos nuevos (compatibles legacy)

**Layout mapa (cada sprite)**: `color {r,g,b,a}` (m_Color), `materials[]` (m_Materials nombres), `flipX/flipY` (m_FlipX/Y además de bake), `active` (is_active_in_hierarchy), `path` jerarquía Root/.../Sprite, `go_path_id/tr_path_id`, `border` 9-slice (m_Border), `tiling` (sz_x/y + poly), `sorting_group` (SortingGroup.m_SortingOrder). Inactivos exportados con `"active":false`.

**Metadata mapa**: `special_scripts` dump completo de todos MonoBehaviour del level (go,path,script, x/y/angle/sx/sy, has_sprite, properties typetree resuelto), clasificado a `interaction_nodes` (Interac*, Seat, Socket…), `lighting_volumes` (Light/DayNight/Volume), `grid_system` (Grid/Tilemap), `camera_confines` (Camera/Cinemachine). `colliders[]` clasificado `{type, role: walkable/blocker/trigger/wallpaper/camera/unknown, is_trigger, offset, paths, size, properties}` + Grid/Tilemap/SortingGroup/SpriteMask/Light2D/AudioSource/Animator si aparecen.

**Layout mueble**: `color/materials/flip` ya, + `active/path`, `animation.clips[].curves` con `path/property/attribute/keys[{t,v,in,out}]` leídas de `m_RotationCurves/m_PositionCurves/m_ScaleCurves/m_FloatCurves/m_EditorCurves` si existen, `animators[].parameters/states`, `store_data` búsqueda profunda por id en SO/listas, `audio` AudioClip nombres, `colliders` flipped `colliderPoints/flippedColliderPoints/gridCollScale`.

**Schema unificado**: `scene_full.json` / `item_full.json` `{kind, id, name, source, layout{front,back,fx}, hierarchy, colliders, logic{walkable,blockers,triggers,interaction_nodes,grids,camera_confines,lights,scripts}, animation{controllers}, catalog, raw}` además de legacy.

## Conteos (level2 + 1301)

- Sprites mapa 76, MB por className: SpriteRenderer 81, PolygonCollider2D 22, BoxCollider2D 6, Animator 3, AudioSource 1, SortingGroup 2, MonoBehaviour (ActionNode 2, Seat 1, Light 1)
- Colliders por role: walkable 4, camera 2, wallpaper 5, blocker 12, trigger 4
- Clips 1301: `Open` length 0.25  curve keys 0 (typetree sin editor curves; dump indica AnimatorController con 3 estados pero m_EditorCurves vacío) → se deja `curves:[]` y fallback heurística -45° en editor
- Qué no se pudo leer: `m_Particle` FX, `m_SpriteTilingProperty.newSize` parcial, curves reales (path_id 0), store_data `{}` (ningún SO con 1301 en MEGAMINER)

## Cómo correr
```
python TsukiMapExtractor_v2.py "C:\...\MEGAMINER\level2" -a "C:\...\MEGAMINER\aa\Android"
python tsuki_export_by_id_v2.py 1301 --bundles "C:\...\MEGAMINER" --out .\out --include-fx --with-activity --assemblies "C:\...\Dumper\DummyDll"
```
