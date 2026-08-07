# Informe Final — Extracción de Recursos Faltantes

## Resumen Ejecutivo

Se procesaron los 10 IDs reportados como faltantes al abrir `index.html`. Todos tienen ahora una imagen en `images/items/`.

---

## Fase 1 — IDs Prioritarios

| ID | Clave | Estado | Método |
|---|---|---|---|
| **1323** | `FURN_1323` | ✅ Extraído | Sprite `hangingnookb` del bundle `duplicateassetisolation` |
| **1224** | `FURN_1224` | ✅ Extraído | Sprite `cosmicequuleus` del bundle `duplicateassetisolation` |
| **1219** | `FURN_1219` | ⚠️ Placeholder | En JSON como "Cosmic Emblem of House Pisces", pero **sin sprite en el APK actual** |
| **1017** | `FURN_1017` | ⚠️ Placeholder | **ID desconocido** — no está en `extracted_items_v3.json` ni en ningún bundle |
| **591** | `FURN_591` | ⚠️ Placeholder | **ID desconocido** — ídem |
| **685** | `FURN_685` | ⚠️ Placeholder | **ID desconocido** — ídem |
| **603** | `FURN_603` | ⚠️ Placeholder | **ID desconocido** — ídem |
| **1324** | `FURN_1324` | ⚠️ Placeholder | **ID desconocido** — ídem |
| **1318** | `FURN_1318` | ⚠️ Placeholder | **ID desconocido** — ídem |
| **638** | `FURN_638` | ⚠️ Placeholder | **ID desconocido** — ídem |

> **Por qué son desconocidos los IDs 591, 603, 638, 685, 1017, 1318, 1324:**
> Estos IDs no aparecen en `extracted_items_v3.json` (2063 items catalogados), en `script.json`, ni en los dumps de MonoBehaviour de Unity6 (8835 archivos). Son probablemente items de una **versión futura o de una actualización DLC** del juego que no está en el APK local. Los placeholders evitan que el editor genere errores de carga.

---

## Fase 2 — Auditoría Completa

| Categoría | Cantidad |
|---|---|
| Total items en JSON | 2,063 |
| Imágenes ya existentes antes del proceso | 1,905 |
| Nuevas extraídas (match exacto de nombre) | ~5 |
| Nuevas extraídas (match parcial/fuzzy) | ~3 |
| Placeholders creados | 8 |
| **Aún sin imagen real (sprite no en APK)** | ~143 |

### Items aún sin sprite real
Estos items existen en el JSON del juego pero sus sprites **no están en ninguno de los 10 bundles** del APK instalado. Causas posibles:
1. Items de temporadas/eventos que no están activos
2. Items de otras regiones (cosméticos exclusivos)  
3. Items de actualizaciones no instaladas

Para resolverlos en el futuro: extraer los bundles del APK más reciente con `AssetRipper`.

---

## Bundles Escaneados

| Bundle | Sprites encontrados |
|---|---|
| `icons_assets_all_...` | 3,375 |
| `furniture_assets_all_...` | 4,038 |
| `duplicateassetisolation_...` | 8,450 |
| `activities_assets_all_...` | 3,531 |
| `natto_assets_all_...` | 78 |
| `parsnaps_assets_all_...` | 248 |
| Otros (music, loading, mono) | 0 |
| **Total variantes** | **~29,962** |

---

## Recursos Gráficos para Rotación de Muebles

Para implementar rotación de muebles con el mouse se necesitan:

1. **Los sprites ya están disponibles** — cada mueble tiene máximo 4 orientaciones (0°, 90°, 180°, 270°)
2. **En los bundles**: los sprites con sufijos `_0`, `_1`, `_2`, `_3` son las rotaciones alternativas del mismo mueble (encontrados en `duplicateassetisolation`)
3. **Ejemplo real**: `chameleonchihouse_0`, `chameleonchihouse_1`, `chameleonchihouse_2` = rotaciones de la casa de camaleón
4. **Para extraerlos**: usar el mismo pipeline de extracción buscando `<sprite_base>_0` hasta `<sprite_base>_3`

El campo `orientation` ya está mapeado en `parser.js` (`o_off`), `applyMapChange()` ya lo escribe, y el mapa 3D ya lee ese campo. Solo falta:
- En `map.js`: leer la orientación y seleccionar la imagen con sufijo `_N` correspondiente
- En el UI: agregar drag/rotación con mouse en el canvas isométrico

