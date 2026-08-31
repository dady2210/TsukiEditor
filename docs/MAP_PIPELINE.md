# MAP_PIPELINE — Autoría de mapas (Fase U)

## 1. Inventario mapId → exportDir → carpetas

| mapId | Nombre | exportDir | carpeta Unity | ensamblado | máscaras |
|---|---|---|---|---|---|
| 0 | Home | 2 | `Exportado_level2/` | `level2_Ensamblado.png` | `mask_floor_0/1`, `mask_wallL_0`, `mask_wallR_0`, `mask_wallL_1`, `mask_wallR_1` |
| 6 | Farm | 4 | `Exportado_level4/` | `level4_Ensamblado.png` | (sin) |
| 2/3/4/8 | Chi/Moca/Pier/TH | null | — | null (humano completa tras ingest) | — |

## 2. grid_editor guarda atlas via F()/W()
`window.mapsAtlas` entry `{mapId,kind,groupNum,flipped,rows,cols,origin_px,cell,lighting,comment,mask,poly,defaultCoverId,exportDir,assembled}`. Nudge/rows/cols/cell/mask. Descargar serializa `window.MAP_META`.

## 3. map.js resuelve mask
`_getMaskImage` usa `surfaceFor(mapId,groupNum,isWall,flipped).mask` si existe sino fallback `mask_wallL/R_N` / `mask_floor_N` vía `MAP_META[loc].exportDir`.

## 4. Contrato superficie
`{mapId,kind,groupNum,flipped,rows,cols,origin_px,cell,exportDir?,assembled?,mask?,poly?,defaultCoverId?,homecoming_only?,outdoor?,lighting?}` + `MAP_META[mapId]={name,exportDir,assembled,lighting}` stubs `null` no pisan level2/4.

## 5. Regla surfaceFor(placement)
`surfaceFor(mapId=p.cluster, groupNum=p.floor, isWall=p.isWall, flipped=p.flipped)` → origin_px/cell de SU surface. Nunca usar g0 para g4. Si miss: debug y skip.

## DoD U1-U5
U0 doc, U1 atlas fallback, U2 panel Superficies, U3/4 ingest wrappers, U5 MAP_META play.
