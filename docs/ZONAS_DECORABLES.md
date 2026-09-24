# Zonas decorables: de dónde salen y cómo se llaman

Trabajo del 15-09-2026.

## El csave no sirve para saber cuántas zonas hay

Solo guarda las que el jugador **ya ha decorado**. Una casa recién estrenada aparece
vacía, y eso hacía imposible saber qué zonas existen de verdad.

La lista buena está en las escenas de Unity. Cada zona es un GameObject con uno de estos
dos componentes, y cada uno lleva su identificador:

| Componente | MonoScript | Qué es |
|---|---|---|
| `Floor` | fileID 1, pathID 1537 | una región de suelo |
| `Wallpaper` | fileID 1, pathID 2764 | un lienzo de pared |

Los MonoBehaviour de los niveles **no tienen typetree** (IL2CPP), así que UnityPy no los
lee como los prefabs de los bundles. Pero ocupan siempre 104 bytes y el id vive en el
offset 92, detrás de la cabecera estándar. Eso se validó contra las 6 anclas conocidas de
la Casa del Árbol y las 3 de la Granja: salen idénticas a las del csave.

## Lo que declara el juego

`python tools/extract_surface_anchors.py` → `data/surface_anchors.json`

| Mapa | Pisos | Paredes |
|---|---|---|
| 0 · Casa del Árbol | 2 | 4 |
| 1 · Tienda de Yori | 1 | 4 |
| 2 · Casa de Chi | 2 | 3 |
| 3 · Casa de Moca | 3 | 4 |
| 4 · Muelle de Yori | 0 | 0 |
| 5 · Tienda de Rosemary | 1 | 2 |
| 6 · Granja | 1 | 2 |
| 8 · Ayuntamiento | 1 | 2 |
| 9 · Casa de Té de Momo | 2 | 2 |
| 11 · Taller de Dawn | 1 | 2 |
| 39 · Ático de Ensueño | 1 | 2 |

**Contrastado con el csave**: las 9 entradas que trae `save (41)` (6 de la Casa del Árbol,
3 de la Granja) corresponden una a una con un ancla del catálogo. Ninguna suelta.

## Nombres

Se toman del propio nombre del objeto en el juego:

| En el juego | En el editor |
|---|---|
| `FloorL1` / `FloorL2` / `FloorL3` | Piso 1 / Piso 2 / Piso 3 |
| `WallpaperBL` / `WallpaperBR` | Pared 1 Izquierda / Pared 1 Derecha (B = planta baja) |
| `WallpaperTL` / `WallpaperTR` | Pared 2 Izquierda / Pared 2 Derecha (T = planta alta) |
| `WallpaperL` / `WallpaperR` | Pared 1 Izquierda / Pared 1 Derecha |
| `WoodenWall1`… | el lado se deduce de la forma |

Los que no dicen el lado en el nombre se resuelven por geometría: en la proyección
isométrica una pared izquierda sube hacia la derecha y una derecha baja, así que basta
comparar la altura media de cada mitad del polígono. Calibrado contra las que el juego sí
nombra (BL/BR/TL/TR): acierta en las seis.

Las superficies nuestras que **no** corresponden a ninguna zona del juego se llaman
`Zona N · sin revestimiento` (o `Muro N Izq · sin revestimiento`). Son sitios donde se
puede poner mueble pero cuyo acabado el juego no deja cambiar —el campo de la granja, por
ejemplo—. Antes todas se llamaban «Piso g3» y no había forma de distinguirlas.

## Emparejado con nuestras superficies

`python tools/apply_surface_anchors.py` escribe `anchorID` y `name` en
`data/maps/map_*.json`. Dos criterios distintos, porque uno solo no vale:

- **Pisos, por forma** (área y caja envolvente). Nuestros polígonos de suelo salieron de
  los mismos colliders, así que coinciden casi exactos. Con dos cuidados: se descartan los
  rectángulos de relleno (4 puntos con todo en múltiplos de 0.25), que se parecen a
  cualquier cosa y robaban el emparejamiento; y la asignación es **óptima del conjunto**,
  no voraz, porque quedarse con el mejor par suelto dejaba al siguiente sin pareja.
- **Paredes, por lado y planta.** Aquí la forma no sirve: nuestras paredes son el lienzo
  entero y el collider del juego es más pequeño. Pero izquierda/derecha y el orden de las
  plantas sí se corresponden.

**Validación**: la Casa del Árbol sale 6/6 contra las anclas que `generate_all_maps.py`
tenía apuntadas de antes, obtenidas por otra vía. La Granja y el Ayuntamiento, 3/3.

No se coloca sola ninguna zona que nos falte. El polígono del juego lo tenemos, pero el
**origen no es deducible**: los niveles guardan varias ubicaciones en la misma escena y
nuestros `origin` no están todos en el mismo marco (en el mapa 8 los desfases entre pares
ya emparejados van de 18,6 a 20,0). Colocarlas a ojo sería peor que no colocarlas.

## En el editor

- El desplegable de grupo y el organizador de capas muestran el nombre real. 🎨 marca las
  que el juego deja decorar; ▫ las que no.
- Bajo el selector hay un panel **«Zonas decorables del juego»** que lista *todas* las del
  mapa abierto, con ✔ si tenemos geometría y ✎ *falta dibujarla* si no. Sale de
  `surface_anchors.json`, así que aparecen aunque no estén en tu partida.
- El editor ya no pierde el `anchorID` al cargar ni al guardar (se perdía en las dos
  rutas de cada lado, y un "Guardar (POST)" habría borrado el emparejado).

## Pendiente: 23 zonas por dibujar

| Mapa | Faltan |
|---|---|
| 1 · Tienda de Yori | Piso 2 y las 4 paredes |
| 2 · Casa de Chi | Piso 1 y una pared |
| 3 · Casa de Moca | Piso 2, Piso 3 y una pared |
| 5 · Tienda de Rosemary | las 3 |
| 9 · Casa de Té de Momo | las 4 |
| 11 · Taller de Dawn | las 3 |
| 39 · Ático de Ensueño | las 3 |

El mapa 39 además trae las tres anclas con id `0`: o la escena es una plantilla sin
asignar, o ese nivel guarda el id en otro sitio. Hay que mirarlo aparte.

## Comandos

```bash
python tools/extract_surface_anchors.py            # relee los niveles -> surface_anchors.json
python tools/extract_surface_anchors.py --report   # compara con los mapas, no escribe
python tools/apply_surface_anchors.py --dry-run    # qué casaría y qué falta
python tools/apply_surface_anchors.py              # escribe anchorID y name en los mapas
```
