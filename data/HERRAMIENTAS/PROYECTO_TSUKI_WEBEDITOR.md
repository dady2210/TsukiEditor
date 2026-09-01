# Tsuki Odyssey — WebEditor / Pipeline de extracción

Documento de contexto para un agente. Objetivo del proyecto: **extraer la máxima información posible de assets Unity de Tsuki Odyssey (mapas y muebles) y visualizarla / editarla en un editor web pixel-perfect.**

---

## 1. Qué es este proyecto

Tsuki Odyssey es un juego 2D Unity (versión de player observada: `2022.3.0f1`). El usuario reconstruye niveles y muebles fuera del motor:

1. **Extractores Python + UnityPy** leen `level*`, `sharedassets*`, bundles Addressables y prefabs de furniture.
2. Escriben JSON de layout (sprites con transform mundial) + JSON de metadata (lógica, colliders, nodos, animators).
3. Exportan PNG de cada sprite.
4. Un **editor HTML** (`map_editor.html`) carga una carpeta, pinta el layout en canvas y muestra overlays de colliders/nodos.

No es un engine completo. Es un visor/editor de reconstrucción. La meta es que se vea y se pueda inspeccionar **lo mismo que Unity tenía**: sprites, sorting, wallpapers tiled, luces, walkables, nodos de interacción, jerarquía, colliders, front/back, animaciones.

---

## 2. Rutas locales del usuario

Todo el material de herramientas y dumps vive aquí:

```
C:\Users\Andres\Desktop\Tsuki_Odyssey\Tsuky_WebEditor\data\HERRAMIENTAS
```

El agente **debe listar y leer esa carpeta completa** antes de tocar código. Ahí suelen estar (nombres orientativos; confirmar en disco):

| Qué buscar | Para qué |
|---|---|
| `map_editor.html` | Editor web actual |
| `TsukiMapExtractor.py` | Extractor de mapas / levels |
| `tsuki_export_by_id.py` | Extractor de muebles por ID |
| `DummyDll/` o `Managed/` | Assemblies para que UnityPy resuelva MonoBehaviour |
| JSON de ejemplo: `layout.json`, `layout_front.json`, `layout_back.json`, `metadata.json`, `map_metadata.json` | Contratos reales de salida |
| Carpetas `Exportado_level*`, `Exportado_*`, IDs numéricos de muebles (`1301/`, etc.) | Sprites PNG + JSON ya extraídos |
| Bundles / `levelXX` / `sharedassets*` / `aa/Android` | Fuente Unity cruda si está copiada |
| Notas, scripts viejos, dumps de typetree | Nombres reales de scripts del juego |

Si la estructura difiere, el agente documenta el árbol real y trabaja sobre eso. No asuma rutas que no existan.

---

## 3. Piezas de software

### 3.1 `TsukiMapExtractor.py` — mapas

Entrada: archivo Unity `levelXX` (+ `sharedassets*` del mismo directorio, opcional Addressables).

Salida en `Exportado_<level>/`:

- `layout.json` — array de sprites activos
- `map_metadata.json` — lógica de escena
- `<spriteName>.png` — texturas
- `<level>_Ensamblado.png` — composición offline (Pillow)

Qué extrae hoy:

- `SpriteRenderer` activos en jerarquía
- Transform mundial (posición, ángulo Z, escala; `FlipX/Y` horneado en `sx/sy`)
- Sprite: nombre, pivot (`px/py`), rect (`rw/rh`), offset (`ox/oy`), PPU
- Sorting layer (`sl`) y order (`o`)
- `draw_mode`, `sz_x`, `sz_y` (Sliced/Tiled)
- `PolygonCollider2D` del mismo GO → `poly` en el layout
- Caso especial: GO cuyo nombre contiene `Wallpaper` sin SR → sprite sintético `WoodBark` + poly + size de tiling
- Metadata: colliders → `walkable_bounds` o `camera_confines` (si el nombre tiene Camera/Confine)
- `Grid` nativo → `grid_system`
- `MonoBehaviour` filtrado por **nombre de clase**:
  - interacción: `ActionNode`, `TsukiInteraction`, `ItemSocket`, `SpawnPoint`, `SeatNode`, `FishingNode`
  - luces: substring `Light`, `DayNight`, `Volume`, `Color`
  - grid: substring `Grid`, `Placement`
  - resto sin SR → `special_scripts`

Limitaciones conocidas:

- Buckets de metadata salen vacíos si los scripts del juego **no se llaman así**.
- Sin DummyDll/assemblies, los typetree de MB salen incompletos.
- Todos los colliders no-cámara caen en `walkable_bounds` (incluye wallpapers y props). No hay clasificación walkable vs blocker vs trigger.
- No exporta color RGBA ni materiales en el layout de mapa.
- Salta objetos inactivos (`m_IsActive`).
- No extrae `SortingGroup`, `SpriteMask`, `Tilemap`, `Light2D`, `ParticleSystem`, `AudioSource`, `CompositeCollider2D` de forma específica.
- No guarda jerarquía (path padre/hijo) en el layout.

### 3.2 `tsuki_export_by_id.py` (v20) — muebles

Entrada: ID numérico de furniture (`Crop Box` = `1301`) + carpeta de bundles (`*furniture*.bundle`, `*duplicateassetisolation*`, icons, monoscripts, activities, sharedassets, globalgamemanagers).

Salida en `<out>/<ID>/`:

- `metadata.json`
- `layout_front.json` / `layout_back.json`
- PNG por sprite
- Composición `FURN_<ID>_0.png` y `FURN_<ID>_BACK.png`

Qué extrae hoy:

- Localiza `MonoBehaviour` cuyo typetree tiene `ID == target`
- Recorre jerarquía del prefab (`nodes[]` con path, local/world pos, scale, components)
- `SpriteRenderer`: sprite, color, sorting, materials (en código v20; **los JSON de muestra a veces no los traen**)
- Capas `sprites[]` del scriptable furniture, con `flipLogic` / `spriteFlipLogic` / `normal` vs `flipped`
- Filtra FX por nombre (`white`, `shadow`, `glow`, `conelight*`, `pointlight`, `mask`, `stronglight`) salvo `--include-fx`
- Capas `onlyVisibleWithActivity` salvo `--with-activity`
- `colliders[]` a nivel metadata
- `animators[]`: nombre del controller + lista de clips (**curvas vacías en la práctica**)
- `raw_properties` del componente furniture (`CropBox`, grid de colocación, colliderPoints, animator ptr, cropAnims…)
- `store_data` buscando el mismo ID en otros MB/SO (suele salir `{}`)

Limitaciones conocidas:

- Clips `Idle/Open/Close` con `length: 0` y `curves: []`. No se leen `AnimationClip.m_FloatCurves` / position / rotation / scale.
- No exporta state machine (parámetros, transiciones).
- `Square` (halo de luz) aparece en `nodes` con sprite `None` y no entra al layout.
- Front y back pueden quedar idénticos si no hay sprites flipped.
- `audio` vacío.

### 3.3 `map_editor.html` — visor/editor

SPA local, un solo archivo. Carga una carpeta (`webkitdirectory`):

- Imágenes → `assetBlobs` / `imageCache` indexadas por nombre y por relative path
- `metadata.json` **o** `map_metadata.json` → un único `currentMetadata` (el que encuentre primero)
- Cualquier JSON cuyo nombre contiene `layout` → `sceneData` + carpeta por archivo (`LAYOUT_FRONT` visible, `LAYOUT_BACK` oculta)

Coordenadas:

- Mundo Unity: Y-up, grados, PPU típico **150**
- Canvas: origen al centro, Y invertida (`wy = -y * zoom`)
- `camera = { x, y, zoom }` con zoom default 40

Render:

- Orden: `sl` luego `o`
- Raster cache por hash de sprite/escala/ángulo/draw_mode/poly
- Wallpaper `draw_mode > 0 && sz_x > 0` (la lógica tiled **está omitida / incompleta** en la copia actual)
- Luces: `sp === 'white'` o material que contiene `"Radial"` → gradiente radial + `globalCompositeOperation = 'screen'`
- Tinte RGB si `color` existe y no es blanco
- **Salta** `obj.sp === 'Square'`
- Overlay (checkbox): walkable polygons naranja, interaction nodes cian, nodos mueble magenta, colliders verde

Interacciones “nativas” actuales (heurísticas, no leen clips):

- Flip: intercambia visibilidad de carpetas cuyo nombre tiene `FRONT`/`BACK`
- Animar: si `go` contiene lid/door/tapa → `angle = -45`; si `sp` termina `_0`/`_1` los intercambia; si `go==='square' && sp==='white'` toggle visible

Panel de propiedades solo edita: `go`, `sp`, x/y, sx/sy, angle, sl, o, folder.

Funciones referenciadas en UI que hay que preservar o completar si faltan: `addElement`, `createFolder`, `moveSelectedToFolder`, `exportJSON`, `loadJSON`, `exportPNG`, `saveBrushPrefs`, `handlePatternUpload`, herramientas paint/poly/erase/ruler.

---

## 4. Contratos JSON (campos reales)

### 4.1 Item de `layout.json` / `layout_front.json` / `layout_back.json`

```json
{
  "sp": "cropBox_0",
  "go": "Exterior",
  "x": 0.0, "y": 0.0, "angle": 0.0,
  "sx": 1.0, "sy": 1.0,
  "o": 0, "sl": 0,
  "px": 0.5, "py": 0.5,
  "rw": 201, "rh": 125,
  "ox": 0.0, "oy": 0.0,
  "ppu": 150.0,
  "draw_mode": 0,
  "sz_x": 1.34, "sz_y": 0.83,
  "poly": [],
  "color": { "r": 1, "g": 1, "b": 1, "a": 1 },
  "materials": ["Sprite-Unlit-Default"]
}
```

`color` y `materials` están en el extractor v20 de muebles; el layout de mapa actual **no los escribe**. El editor ya los consume si existen.

`draw_mode`: `0` Simple, `1` Sliced, `2` Tiled. Wallpapers del mapa usan `2` + `poly` + `sz_*`.

### 4.2 `map_metadata.json`

```json
{
  "grid_system": [],
  "interaction_nodes": [],
  "walkable_bounds": [ { "go", "type", "x", "y", "sx", "sy", "angle", "properties": { typetree collider } } ],
  "camera_confines": [],
  "lighting_volumes": [],
  "special_scripts": []
}
```

`properties.m_Points.m_Paths` = polígonos locales (unidades Unity, no píxeles). El editor multiplica por PPU 150 y aplica transform del bound.

### 4.3 `metadata.json` de mueble

```json
{
  "id": 1301,
  "name": "Crop Box",
  "raw_properties": { "ID", "orientation", "gridCollScale", "gridOffset", "animator", "cropAnims", "colliderPoints", "flippedColliderPoints", ... },
  "layer_definitions": [ { "renderer", "onlyVisibleWithActivity", "conditions", "activityFlags" } ],
  "store_data": {},
  "nodes": [ { "path", "name", "local_pos", "world_pos", "scale", "components": [ SpriteRenderer | AnimObject | CropBox | Animator | ... ] } ],
  "colliders": [ { "type", "node", "offset", "paths"|"size" } ],
  "audio": [],
  "animators": [ { "node", "controller", "clips": [ { "clip_name", "fps", "length", "loop", "curves" } ] } ],
  "special_scripts": [ { "node", "script" } ]
}
```

Ejemplo Crop Box: nodos `Crop Box`, `.../GameObject`, `Interior`, `Exterior`, `Lid`, `Square`. Collider hex/polígono en la raíz. Animator `CropBox` con clips Idle/Open/Close vacíos.

---

## 5. Convenciones del juego (importantes para extraer bien)

- PPU standard de sprites de furniture/mapa: **150**. Algunos wallpapers usan 128.
- Eje Y Unity hacia arriba. Ángulo en grados, rotación 2D en Z (`atan2(2*w*z, 1-2*z*z)`).
- Sorting: primero layer (`sl`), después order (`o`). Valores negativos son fondos/sombras; 9+ suele ser canopy / frente.
- Front vs Back de mueble no es un flip de cámara: son capas `normal` / `flipped` + `flipLogic` (0 ambos, 1 solo front, 2 solo back) y a veces `spriteFlipLogic`.
- Wallpapers: textura repetida + shear isométrico aproximado (`shear_slope = -0.5` si el GO contiene `R`, si no `+0.5`) + máscara con el polígono del collider. El extractor Python de mapa ya hace esto al ensamblar PNG; el editor web lo tiene incompleto.
- Luces de mueble: sprite `white` o material Radial, color RGBA, blend screen. A veces un GO `Square` sin sprite útil.
- Actividad: capas con `onlyVisibleWithActivity` y `conditions` (cultivos, estados de mueble).
- Colocación en grid: `gridCollScale`, `gridOffset`, `gridHeightOffset`, `orientation` en raw_properties del furniture.

---

## 6. Estado vs meta

| Área | Extraído | Visible en editor | Meta |
|---|---|---|---|
| Sprites + transform + sorting | Sí | Sí | Mantener pixel-perfect |
| Color / materiales | Solo muebles v20 | Parcial (tinte + screen) | Ambos pipelines + UI |
| Wallpapers tiled + poly mask | Python assemble | Incompleto en HTML | Replicar assemble en canvas |
| Walkable overlays | Colliders crudos | Polígonos naranja | Clasificar walkable/blocker/trigger |
| Interaction nodes | Filtro por nombre | Puntos cian | Dump de todos los MB + iconos por clase |
| Grids / confines / lights de mapa | Buckets vacíos | No | Extraer de verdad + overlay |
| Jerarquía de mueble | `nodes` | Puntos magenta | Árbol + gizmo |
| Colliders mueble | Sí | Box/Poly verde | También flipped + gridColl |
| Front/Back | Dos layouts | Flip de carpetas | OK |
| Animación | Nombres de clip | Heurística -45° | Curvas reales del AnimationClip |
| Activity / FX | Flags en export | No | Toggle en editor |
| Catálogo / store_data | Búsqueda débil | No | Resolver SO de shop |
| Audio | No | No | Listar clips; no hace falta reproducir sí o sí |

---

## 7. Dependencias técnicas

Python:

- `UnityPy` con `FALLBACK_UNITY_VERSION = '2022.3.0f1'`
- `Pillow`
- Ideal: `UnityPy.config.FALLBACK_ASSEMBLY_FOLDER` → DummyDll del juego

Editor:

- HTML + Canvas 2D, sin build step
- Debe seguir abriéndose con doble clic / live server local
- Carga por carpeta (File System Access no obligatorio; `webkitdirectory` ya funciona)

---

## 8. Reglas para el agente

1. Leer **toda** `HERRAMIENTAS` y los JSON reales antes de refactorizar.
2. No romper el contrato de campos que el editor ya usa (`sp, go, x, y, angle, sx, sy, o, sl, px, py, rw, rh, ox, oy, ppu, draw_mode, sz_x, sz_y, poly`). Solo **añadir**.
3. Preferir un schema unificado **además** de los JSON legacy, no sustituirlos a ciegas (el usuario tiene dumps viejos).
4. Extraer de más y filtrar en el editor (toggles), no filtrar en el extractor salvo FX explícitamente pedido.
5. Si un typetree no se resuelve, guardar `className`, `path_id` y el árbol crudo. Nunca tirar el objeto.
6. Documentar cada script MonoBehaviour nuevo que aparezca en un inventario (`SCRIPTS_INVENTARIO.md`).
7. Verificar con al menos un mapa (`layout.json` + `map_metadata.json`) y un mueble (`1301` Crop Box u otro ID presente).
8. Coordinadas: no invertir Y dos veces. El editor ya niega Y al dibujar.
9. No inventar curvas de animación. Si no salen del clip, dejar `curves: []` y decirlo.
10. Trabajar en archivos reales del repo del usuario, no reescribir el editor desde cero salvo que el HTML actual esté irrecuperable.

---

## 9. Archivos relacionados en este paquete de contexto

Si el agente no está en la PC del usuario, estos adjuntos son la referencia canónica del estado actual:

- `map_editor.html`
- `TsukiMapExtractor.py`
- `tsuki_export_by_id.py`
- `layout.json` (mapa treehouse, ~76 sprites)
- `map_metadata.json` (6 walkable_bounds, resto vacío)
- `layout_front.json` / `layout_back.json` + `metadata.json` (Crop Box 1301)
