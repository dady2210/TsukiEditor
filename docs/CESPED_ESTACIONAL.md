# Césped del suelo por estación

Trabajo del 15-09-2026.

## Qué pasaba

El suelo se pintaba con un **color plano** por estación, de una tabla escrita en
[map.js](../map.js):

```js
const seasonalGroundColors = { 0:'#9EBE72', 1:'#98B870', 2:'#E2B36B', 3:'#E0E9F0' };
```

Y en el horneado de la Casa del Árbol era peor todavía: solo primavera y verano usaban
textura (y siempre la misma, `SpringGrass.png`); otoño e invierno se rellenaban con
`#E2B36B` y `#E0E9F0` a secas.

El juego no lo hace así: tiene una textura de césped por estación en `images/tilesets`.

| Estación | Textura |
|---|---|
| 0 · Primavera | `DreamHouse_Environment_Reusables_SpringGrass_167.png` |
| 1 · Verano | `DreamHouse_Environment_Grass_Summer_27.png` |
| 2 · Otoño | `DreamHouse_Environment_Reusables_AutumnGrass_165.png` |
| 3 · Invierno | `DreamHouse_Environment_Grass_Winter_182.png` |

Las cuatro son de 512×512: una base de color con matas y motas repartidas. Sutil, pero es
lo que le quita el aspecto de fondo liso.

## Qué se hizo

`SEASON_GRASS` en map.js asocia cada estación con su textura, y dos métodos nuevos la
sirven:

- `seasonGrassImage(estación)` — la carga por el caché de fondos de siempre.
- `seasonGrassPattern(ctx, estación)` — devuelve el patrón `repeat` **anclado al mundo**:
  se le aplica la traslación de la cámara y la escala del zoom, así que el césped se mueve
  con el mapa en vez de quedarse pegado a la pantalla. Devuelve `null` mientras la imagen
  carga, y entonces se usa el color plano de antes como respaldo.

Se cambiaron los dos sitios que rellenaban de color:

1. El fondo del lienzo en modo juego, que afecta a **todos** los mapas.
2. El horneado de la Casa del Árbol, que ahora usa la textura de la estación en las cuatro
   (antes, primavera fija en dos de ellas y color plano en las otras dos).

La clave de horneado ya incluía la estación, así que al cambiar de estación se rehornea
solo.

## Comprobado

- Las cuatro estaciones cargan su textura y construyen el patrón, en la granja y en la
  Casa del Árbol.
- A/B en la granja sobre el mismo recorte de fondo: con patrón, 2105 colores distintos y
  las matas repartidas; anulándolo, 1595 y tan liso.
- Otoño e invierno en la Casa del Árbol, que eran los dos rellenos planos, ahora salen
  texturados.
