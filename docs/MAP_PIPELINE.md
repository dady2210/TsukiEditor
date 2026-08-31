# MAP_PIPELINE — Autoría de mapas (Fase U)

## 1. Inventario mapId → exportDir → carpetas

| mapId | Nombre | exportDir | carpeta Unity | ensamblado | máscaras existentes |
|---|---|---|---|---|---|
| 0 | Home | 2 | `Exportado_level2/` y `images/maps/Exportado_level2/` | `level2_Ensamblado.png` | `mask_floor_0/1`, `mask_wallL_0`, `mask_wallR_0`, `mask_wallL_1`, `mask_wallR_1` (casa) |
| 6 | Farm | 4 | `Exportado_level4/` y `images/maps/Exportado_level4/` | `level4_Ensamblado.png` | (sin masks aún) |
| 2 | ChisHouse | ? | — | null | — |
| 3 | MocasHouse | ? | — | null | — |
| 4 | Pier | ? | — | null | — |
| 8 | TownHall | ? | — | null | — |

> `images/maps/Exportado_level*` es copia de `Exportado_level*` tras extracto Unity. `TsukiMapExtractor.py` genera `layout.json + sprites + Ensamblado`.

## 2. Cómo grid_editor guarda atlas

`grid_editor.js` edita `window.mapsAtlas[]` (ver `data/maps_atlas.js`):
- `F(mapId,groupNum,rows,cols,origin,extra)` / `W(mapId,groupNum,flipped,rows,cols,origin,extra)` → entry `{mapId,kind,groupNum,flipped,rows,cols,origin_px,cell,lighting,comment,...}`
- Nudge / rows/cols / groupNum / flipped / cell w/h / bgScale → muta entry.
- Botón "Descargar maps_atlas.js" serializa `window.atlasConfig` + `window.mapsAtlas` con `window.atlasConfig = {...}; window.mapsAtlas = [...]`.

En `#/grid-editor` el nuevo selector `#grid-map-select` filtra surfaces por `mapId`.

## 3. Cómo map.js resuelve mask hoy

`_getMaskImage(type, floorKey, loc)` y `getBackgroundImage`:
- `exportDir = loc===0 ? 2 : loc` (fallback viejo)
- `maskName = mask_<type>_<floorKey>` ; para walls casa (`loc===0`) → `mask_wallL/R_<floorNum>`
- `img.src = images/maps/Exportado_level<exportDir>/<maskName>.png`
- Tileset: `images/tilesets/{wallpapers|floors}/{id}.png` → `createPattern` + `destination-in` mask.
- Bake key = `targetLoc + '_' + wallpapersIds + '_' + floorsIds` → `_bakedBgCanvas` + `drawImage(levelN_Ensamblado.png)`

Si 404 → cache false, no throw.

## 4. Contrato de superficie (post-U)

Cada entry de `mapsAtlas` mantiene fields actuales y añade opcionales:

```js
{
  mapId, kind:'floor'|'wall', groupNum, flipped, rows, cols, origin_px:{x,y}, cell:{w,h},
  homecoming_only?, outdoor?, lighting?, comment?,
  exportDir?: number,          // 0→2, 6→4; si falta, fallback viejo
  assembled?: string,          // default `level<exportDir>_Ensamblado.png`
  mask?: string,               // filename relativo a Exportado_level{exportDir}/
  poly?: number[][]|null,      // puntos px del ensamblado (autoría, para generar mask)
  defaultCoverId?: number|null // new_game / preview; play usa csave
}
window.MAP_META[mapId] = { name, exportDir, assembled, lighting, export? }
```

Helpers `F()`/`W()` aceptan `extra.mask/poly/defaultCoverId` sin romper llamada actual. Origins medidos casa g0/g1 (los floats largos) NO se pisan.

## 5. DoD fases U1–U5

- **U0**: este doc existe. No código runtime.
- **U1**: `#/play` casa/granja idéntico; `#/grid-editor` +Piso/+Pared/nudge/descargar OK; `grep _getMaskImage` usa `surface.mask` si existe sino path viejo.
- **U2**: `map_editor.html` standalone: capas/polígonos/exports viejos intactos + panel "Superficies" (import atlas, kind/group/rows/cols/defaultCoverId, vincular poly, generar mask PNG, merge atlas, preview covering).
- **U3**: `ingest_map.py --level --map-id N` envuelve `TsukiMapExtractor.py`, copia a `images/maps/`, escribe `project.json` + `suggested_surfaces.json` sin pisar `maps_atlas.js`.
- **U4**: `ingest_item.py <ID>` reusa `tsuki_export_by_id.py`, genera `FURN_{id}_ON.png` si hay glow/pointlight, parchea `item_behaviors.js` aditivo; `map.js getImage` prefiere `render.on` si `_lightMode` on y existe; `items_db.js` diff vacío.
- **U5**: `map.js` usa `MAP_META[loc].assembled/exportDir` con fallback; map sin ensamblado dibuja grilla+placements; `docs/TUTORIAL_MAPA_NUEVO.md` + link `Map editor` en nav.

## Referencias
- `data/maps_atlas.js`, `grid_editor.js`, `map.js:_getMaskImage`, `play_lighting.js`, `data/item_behaviors.js`
