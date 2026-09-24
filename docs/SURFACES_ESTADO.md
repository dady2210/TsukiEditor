# Estado de las surfaces (pisos y paredes) de los mapas decorables

Auditoría y reparación del 14-09-2026. Alcance: los 7 mapas decorables
(0, 2, 3, 4, 6, 8, 39). Los otros 29 no aceptan colocación de muebles y quedaron fuera.

## Qué estaba mal

1. **Sin geometría.** De 36 `data/maps/map_*.json`, solo los mapas 0, 6 y 8 tenían
   polígonos, y en parte eran rombos generados por defecto. Los otros 33 traían
   `"poly": []`.
2. **Sin ancla.** Ningún mapa declaraba `config.origin_px`, el punto de la imagen
   `*_Ensamblado.png` que corresponde al (0,0) de Unity. `map.js` caía al ancla de level2
   (1235, 1257) en el código de colocación y al centro de la imagen en el horneado del
   fondo. En level8 el ancla real es (1261, 1228) y el centro es (1340, 1228): **79 px de
   desvío**.

Sin `poly`, [map.js:1251](../map.js#L1251) devuelve `true` siempre (no valida límites: los
muebles se colocan fuera del piso) y [map.js:2359](../map.js#L2359) no pinta el
revestimiento.

## Qué se hizo

- **Ancla por mapa.** `tools/derive_surfaces.py` la recalcula repitiendo el ensamblado de
  `tools/extract_all_maps.py` sobre `layout.json` + los PNGs del nivel. Los 7 lienzos
  calculados coinciden **exactamente** con el tamaño del `*_Ensamblado.png`, y level2
  reproduce su ancla medida a mano (1235, 1257). Ya está en `config.origin_px`.
- **Geometría desde Unity.** `tools/TsukiMapExtractor_v2.py --no-assemble` regenera
  `scene_full.json` con los `PolygonCollider2D` del nivel sin tocar los PNG ya medidos.
  De ahí salen las paredes.
- **`map.js` y `map_editor_2.html`** ya resuelven el ancla por mapa (`_getSurfaceOrigin` /
  `mapAnchorPx`) en vez de tener 1235/1257 fijo. El editor era el que reintroducía anclas
  malas al guardar.
- **`generate_all_maps.py`** ya no degrada: conserva los `poly` reales que encuentre en
  disco y no pierde surfaces que solo existan en el JSON.

## Dos límites que conviene saber

**Los colliders `walkable` de Unity no son el plano de colocación.** Varios son cajas
verticales de límites: se detectan porque un piso isométrico tiene relación ancho/alto ≈2:1
(celda 75×37.5) y estos dan ≈1:1. `derive_surfaces.py` los descarta
(`FLOOR_ASPECT_MIN/MAX`) en vez de pintar el piso de canto. Por eso casi todos los pisos
siguen pendientes: hay que dibujarlos a mano.

**Los colliders `wallpaper` sí sirven.** Coinciden con las paredes ajustadas a mano del
mapa 0, así que las paredes derivadas son fiables.

## Estado actual

| mapId | Mapa | Nivel | real | placeholder | vacío | Pendiente |
|---|---|---|---|---|---|---|
| 0 | Casa del Árbol | level2 | 7 | 3 | 0 | floor_2, floor_3, floor_5 (exterior/jardín) |
| 2 | Casa de Chi | level6 | 4 | 0 | 3 | floor_1, floor_2, wall_0_L |
| 3 | Casa de Moca | level7 | 1 | 0 | 8 | floor_0, floor_2, floor_3, floor_4 y las 4 paredes |
| 4 | Muelle de Yori | level5 | 0 | 0 | 2 | floor_1, floor_2 — level5 no tiene ningún collider |
| 6 | Granja | level4 | 5 | 3 | 0 | floor_0, floor_1, floor_5 |
| 8 | Ayuntamiento | level8 | 2 | 2 | 0 | floor_0, floor_1 |
| 39 | Ático de Ensueño | level39 | 0 | 0 | 1 | floor_dreamhouse |

*real* = geometría de Unity o ajustada a mano · *placeholder* = rombo inventado
(coordenadas en múltiplos exactos de 0.25) · *vacío* = sin `poly`.

19 surfaces reales de 41. **22 siguen pendientes de dibujarse a mano.**

## Cómo seguir

1. `python server.py` → http://localhost:8888 (solo stdlib, no hace falta npm).
2. Abrir http://localhost:8888/data/HERRAMIENTAS/map_editor_2.html, cargar el mapa y
   dibujar los polígonos que faltan sobre el fondo ensamblado. Guardar va por
   `POST /api/save/map/:id` y escribe directo en `data/maps/map_<id>.json`.
3. Comprobar con `python tools/render_surface_check.py --only <id>`, que pinta las surfaces
   sobre el `*_Ensamblado.png` en `scratch/surface_check/`. Verde = piso, azul = pared
   derecha, rojo = pared izquierda, contorno punteado = placeholder.
4. En la app: cambiar revestimiento de piso y pared, y arrastrar un mueble fuera del piso
   (debe rechazarse).

## Comandos

```bash
# regenerar colliders de un nivel sin tocar los PNG ensamblados
python tools/TsukiMapExtractor_v2.py ../AssetPack/assets/bin/Data/level8 \
       --no-assemble -o scratch/surf_extract/Exportado_level8

python tools/derive_surfaces.py            # informe, no escribe
python tools/derive_surfaces.py --apply    # escribe data/maps/map_*.json
python tools/render_surface_check.py       # imágenes de verificación
```

Respaldo del estado previo: `scratch/backup_surfaces_20260914/`.
