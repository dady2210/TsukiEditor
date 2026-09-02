# Tutorial — Agregar piso o pared a un mapa (SLocation)

Basado en MOD_save (5).csave (ver docs/MAPA_GRUPOS_MOD5.md). No tocar origins medidos casa g0/g1.

## 1. Deducir grid

Cada `groupNum` es una surface independiente. No ampliar `16×16` para meter `g4`.

- Mira `MAPA_GRUPOS_MOD5.md` → detalle por SLocation → rango `x[..] y[..]` por groupNum.
- Ej. Home `g0` rango `0..18` → grid `16×16` (atlas medido), `g4` rango `0..25` → `16×16` deducida, `Moca g3` `0..9` → `10×10`.
- Si nuevo piso vacío, elige tamaño inicial `10×10` o `12×12` y ajusta tras colocar mueble ancla.

## 2. Crear surface en maps_atlas.js

```js
F(mapId, groupNum, rows, cols, origin, {comment:"nuevo piso"})
W(mapId, groupNum, flipped, rows, cols, origin)
```
- `mapId` = SLocation (0 Home, 6 Farm, 2 Chi, 3 Moca…)
- `groupNum` = el que viste en el save o nuevo libre (ej. Home g3 libre, pero Farm g3 ya es cobertizo)
- `rows/cols` = grid deducida (ej. 10, 12, 16)
- `origin` = null (TODO) o medido; primer commit con `null` no rompe play (grilla + placements sin fondo)
- `flipped:true` = pared izquierda, `false` = derecha

Ejemplo nuevo piso exterior Home g3 12×12:
```js
F(0, 3, 12,12, null, {outdoor:true, comment:"nuevo patio g3"})
```

Pared nueva para ese piso:
```js
W(0, 3, true, 12,8, null, {comment:"pared izq g3"})
W(0, 3, false,12,8, null, {comment:"pared der g3"})
```

## 3. Alinear origin_px

1. Carga `.csave` con mueble ancla en ese `groupNum` (ej. `x=8 y=8`).
2. Abre `#/grid-editor` → selector Mapa → elige surface nueva → mueve origen con nudge hasta que ancla quede en centro del diamante.
3. Guarda `maps_atlas.js` y verifica `git diff` no tocó `F(0,0)`/`W(0,0)` floats largos.

## 4. Exportar / probar

- `#/play` → botón Casa/Granja → nuevo piso visible (vacío) + velo interior/exterior según `lighting`.
- Colocar mueble en ese piso → `parser.placements` con `cluster=mapId floor=groupNum` → reabrir csave y debe persistir.
- Checklist: `git diff data/maps_atlas.js` solo tu nueva surface, `git diff data/items_db.js` vacío.

## 5. Pared vs piso

- Piso: `F` con `rows/cols`, sin `flipped`.
- Pared: `W` con `flipped` + `rows` altura, `cols` ancho. `groupNum` de pared debe coincidir con `groupNum` del piso que sostiene (ej. pared g1 sobre piso g1).

No inventar `groupNums` que contradigan el save (casa 0,1,2,4,5; granja 0-5 walls solo g3).
