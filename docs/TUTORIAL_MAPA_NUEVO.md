# Tutorial — Mapa nuevo (operativo)

0. **Relevá el csave**: anotar slocation/mapId, groupNums, rangos x,y, si hay walls. Un groupNum = una surface. No agrandar piso 0 para meter g4. exportDir único (casa 2, granja 4). Ver `C:\TsukiSaves\MOD_save (5).csave` para g4/g5 exterior.

1. **Ingest mapa**: `python data/HERRAMIENTAS/ingest_map.py --level <path_level> --map-id N --export-dir D --out images/maps` → `images/maps/Exportado_levelD/` con `*Ensamblado.png` + `layout.json`.

2. **Completar MAP_META[N]**: editar `data/maps_atlas.js` → `window.MAP_META[N] = {exportDir:D, assembled:"levelD_Ensamblado.png", lighting:"interior"|"exterior"}`.

3. **map_editor.html**: abrir standalone → Cargar carpeta Exportado_levelD → Dibujar polígono (draw_mode 2, shear) → panel Superficies: kind/group/rows/cols/defaultCoverId/lighting/homecoming_only, **Vincular poly**, **Generar máscara PNG** → guardar en `Exportado_levelD/` → **Merge atlas** (merge por key mapId|kind|groupNum|flipped; casa g0/g1 origin no se pisa salvo check permitir).

4. **#/grid-editor**: alinear `origin_px` con mueble ancla (cluster=N, floor=g, x,y conocidos). Fórmula piso: `isoX=(x-y)*(cellW/2)+origin.x*bgScale`, `isoY=-(x+y)*(cellH/2)+origin.y*bgScale`. (0,0)=frente diamante abajo.

5. **/play**: filtra `cluster===targetLoc` y `floor===groupNum`, cada group con su `origin_px`/`cell` vía `surfaceFor(mapId,groupNum,isWall,flipped)`. Visible floors = surfaces floor del atlas para ese mapId menos `homecoming_only` si `Flags.get('homecomingUpdates')!==1`.

6. **Ítems**: `python data/HERRAMIENTAS/ingest_item.py <ID> [--with-activity] [--mark-lamp]` → `FURN_{id}.png/_0/_BACK` + `_ON` si glow, parchea `data/item_behaviors.js` sin tocar `items_db.js`.

7. **Checklist**: casa intacta; item (8,8) g0 centro diamante; g4 patio; paredes en cara; `git diff data/maps_atlas.js` sin tocar floats casa g0/g1; `git diff data/items_db.js` vacío; `localStorage.tsukiDebugGrid='1'` log placements.

# MAP_PIPELINE
Ver `docs/MAP_PIPELINE.md` sección MAP_META stubs `assembled:null exportDir:null` y regla `surfaceFor(placement)`.
