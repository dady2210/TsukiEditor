# Tutorial — Mapa nuevo (level → /play)

## Flujo humano
1. **Extraer Unity**  
   `python data/HERRAMIENTAS/ingest_map.py --level <path_level> --map-id N [--export-dir D] --out images/maps`  
   Genera `Exportado_levelD/` con `*Ensamblado.png`, `layout.json`, sprites.

2. **Authoring**  
   Abrir `data/HERRAMIENTAS/map_editor.html` (standalone) → Cargar carpeta → capas/polígonos (draw_mode 2) → panel **Superficies de juego**: Importar `maps_atlas.js`, elegir kind/group/rows/cols/defaultCoverId, **Vincular poly**, **Generar máscara PNG** (`mask_...png`).

3. **Merge atlas**  
   En map_editor → **Merge atlas → descargar** `maps_atlas.js` nuevo (merge por key `mapId|kind|groupNum|flipped`; no pisa `origin_px` casa g0/g1 salvo check “permitir mover origen”). Reemplazar `data/maps_atlas.js` en repo.

4. **Tilesets** (si nuevo covering)  
   `python data/HERRAMIENTAS/ingest_item.py <ID>` o copiar `images/tilesets/{wallpapers|floors}/{id}.png`.

5. **Probar /play**  
   Recargar `#/play` con csave que tenga `sublocations[N].furniture` → `Lighting.apply(GameTime.now(), N)` + grilla atlas. Si no hay ensamblado, solo grilla + placements.

## Notas
- `parser.js` / `csave_io` no cambian. IDs cover salen del csave.
- `homecoming_only` / `outdoor` / `lighting` opcionales.
