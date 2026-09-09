# MAP_JSON — un solo archivo por mapa (`data/maps/map_{id}.json`)

Fuente de verdad por mapa: grillas (`surfaces`), escenografía (`visuals`),
`config`, `colliders` y `logic`. Versión actual del formato: **3**.

## Esquema (map_0, Casa del Árbol)

```json
{
  "mapId": 0,
  "name": "Casa del Árbol de Tsuki",
  "version": 3,
  "config": {
    "ppu": 150, "bgScale": 0.75,
    "assetsDir": "../../images/maps/Exportado_level2",
    "assembled": "level2_Ensamblado.png",
    "lighting": "interior",
    "camera": { "zoom": 40, "minZoom": 15, "maxZoom": 80 }
  },
  "surfaces": [ /* grillas: NO TOCAR origins salvo re-medición */ ],
  "visuals": [ /* props de escena, cada uno con "layer" */ ],
  "colliders": [],
  "logic": {}
}
```

### Campo `layer` (solo visuals)
`far` | `mid` | `near` | `skip`. Reglas casa: Canopy→near,
`o>=900`→mid, `T2 TREEHOUSE SHADOWS_*`→mid, `TreeHouse/Stairs/Platform`→mid,
`Flowers*/Rocks*/TreeProp`→far, resto→mid, `draw_mode===2`→skip (lo pintan
los coverings del save). `skip` y `active:false` no se bakean; el editor
los lista como "managed by coverings".

### Convención de coordenadas (NO duplicar a mano)
- Espacio ensamblado: mundo `(0,0)` == píxel `(1235, 1257)`, `ppu` px/unidad.
- `origin_px = (1235 + origin.x*ppu, 1257 - origin.y*ppu)` — `MapDef`
  y `map.js` usan la misma fórmula; `maps_atlas.js` en runtime toma
  la geometría del mapa 0 desde `MapDef.surfaces()` (fallback al atlas
  viejo si no hay JSON).
- Bake de un visual (`play_scenery.js`, igual que el ensamblador):
  `translate(ax,ay) → rotate(-angle) → scale(sx,sy) → translate(ox,oy) →
  drawImage(img, -px, -py, w, h)` a tamaño natural del PNG (sin estirar:
  si el PNG difiere ±px del rect Unity, se evita distorsión; las
  fracciones de pivot aplican sobre el PNG), alfa `color.a`,
  orden `(sl, o)`. AABB por capa, máximo 4096px.

## Frame en #/play (mapa 0, bake OK)
`drawFar → coverings (existente) → drawMid → muebles → actor →
drawNear → velo`. Sin bake: fallback 1:1 al PNG `config.assembled`
+ overlay foreground (el juego nunca queda negro).
Debug: `?scenery=off` fuerza el fallback. Log único:
`[scenery] bake map0 Nms far=WxH mid=WxH near=WxH visuals=K`.

## Agregar map_6 (granja, cuando toque)
1. Generar `data/maps/map_6.json` con este esquema (surfaces+visuals+config).
2. Nada más: `MapDef.load(6)` + bake funcionan solos; `syncAtlas`
   solo actúa si hay JSON.
3. Probar `?scenery=off` vs bake para comparar.

## Diferencias conocidas vs `level2_Ensamblado.png`
- Los interiores grises del PNG son un retoque manual: están 100%
  bajo las máscaras de coverings, invisibles en runtime con tapices.
- PNGs re-exportados difieren ±px de los rect Unity (arte a la deriva);
  el bake usa PNG actual + pivot del layout.

## Debug
- `?scenery=off` fuerza el fallback (sirve con hash-routing `#/play?...`).
- Consola: `PlayScenery.debug()` (ready, tamaños por capa, versión).
- Toggles en vivo: `PlayScenery.show = {far:false, mid:true, near:true}`
  para aislar qué capa duplica algo.
- Tras editar `map_def.js`/`play_scenery.js`, subir su `?v=` en
  `index.html` y hacer recarga dura (si no, el navegador mezcla
  versiones y el árbol puede verse duplicado o ausente).
