# Selector de visuales y sistema de diálogos

Trabajo del 14-09-2026.

## 1. Visual + ahora ofrece todo el catálogo

Antes el selector listaba solo el `assetsDir` del mapa cargado: **99 de los 1136 sprites de
escenario (9%)**, y no había forma de llegar a items ni NPCs.

Ahora `GET /api/list-visuals` ([server.py](../server.py)) devuelve el catálogo entero
agrupado por carpeta —**17 758 sprites en 165 carpetas, 346 KB**, cacheado en memoria:

| Categoría | Sprites |
|---|---|
| Items | 8909 |
| NPCs | 6820 |
| Mapas (37 niveles) | 1665 |
| Periódicos | 214 |
| Tilesets | 150 |

En el modal hay selector de categoría, de carpeta y buscador. Se pinta **por tandas de 240**
con un botón "cargar más": 17 800 `<img>` de golpe cuelgan el navegador. Al abrirlo se
posiciona por defecto en la carpeta del mapa cargado. Sin servidor (`file://`) sigue cayendo
a los sprites que ya usa el mapa.

## 2. Props animados

**No se puede deducir del juego qué sprites forman una animación.** Se comprobó:

- los `AnimationClip` de los niveles (73) y de los bundles de Addressables (21) **no tienen
  curvas de sprite** (`m_PPtrCurves` vacío);
- ningún MonoBehaviour expone un array de sprites — los typetrees de IL2CPP no resuelven,
  que es lo mismo que deja vacíos `interaction_nodes` y `grid_system`;
- el sufijo `_N` **no es un contador de frames sino el índice del atlas**:
  `Apartment_export_0..46` son 47 piezas distintas de decorado.

Así que el marcado es manual, con ayuda:

1. En el selector se marca **"como animación"** antes de elegir el sprite. Se proponen como
   frames los hermanos de la misma carpeta con el mismo prefijo, ordenados por su número.
2. Se coloca en el canvas y **se anima ahí mismo** (hay un ticker que repinta solo cuando
   cambia de frame el más rápido de la escena).
3. En el panel de propiedades aparece un bloque 🎬 para **recortar el rango** (desde/hasta),
   ajustar **fps** o quitar la animación. Hace falta: la bandera del Ayuntamiento usa 6 de
   los 17 hermanos que se proponen para su prefijo.

Al guardar, esos objetos **no van a `visuals`** —esa capa la hornea `play_scenery.js` una
sola vez y no podría animarse— sino a `logic.interactive_props` con el formato `SimpleAnim`,
que [map.js](../map.js) ya redibuja frame a frame. Al volver a cargar el mapa se devuelven a
la escena como objetos editables. Se añadió un campo `dir` por prop para que los frames
puedan venir de cualquier carpeta del catálogo, no solo del `assetsDir` del mapa.

## 3. Diálogos

### Por qué Benny no hablaba

No era falta de datos: Benny (charId 7) tiene **46 grafos** tanto en `npc_dialogues.json`
como en el compacto. El fallo era que **`_drawMapNpcActivities` nunca registraba sus NPCs en
`_interactiveActors`** — solo lo hacían los actores de mueble y los ambientales—, así que los
NPC fijos del mapa no eran clicables. Corregido.

### Se reconectó con el volcado completo

`tools/build_dialogues.py` regenera `data/dialogues_compact.json` desde
`../npc_dialogues.json`. El compacto anterior aplanaba el grafo y se quedaba solo con el
texto; ahora conserva lo que hace falta para conversar:

| Campo | Qué es |
|---|---|
| `k` | `c` habla el NPC · `r` responde Tsuki |
| `to` | nodos destino (el flujo, traducido de los ports de Unity) |
| `s` | nodos de arranque (los que no reciben entrada) |
| `em`, `pe` | emotion y pester, cuando no son 0 |

Resultado: **69 personajes, 717 grafos, 14 496 nodos (3514 de ellos respuestas), 2377
enlaces de flujo** — y ocupa 3,0 MB frente a los 3,6 MB de antes.

### Sí, las respuestas ya vienen escritas

Era la tercera pregunta y la respuesta es que sí: **3543 nodos `response`** en el volcado,
con texto redactado en EN y SP (el origen trae 14 campos de idioma, pero solo esos dos están
traducidos). Solo Benny tiene **93 puntos de conversación donde Tsuki puede elegir**.
Ejemplo real de *Benny Gachaboy Abuse*:

> **Benny:** …
> ▸ *¿Qué sucede? ¡Benny, algo le pasa al GachaBoy!*
> ▸ *Oh...*

`dialogue_manager.js` ahora recorre el grafo: cuando desde el nodo actual se sale hacia nodos
`r`, los muestra como botones; con un único destino sigue por él; y donde no hay flujo,
recorre en orden como hacía antes.

### Un límite del volcado

**Solo el 37% de los grafos (268 de 730) trae flujo.** 348 están marcados `flowPartial` en el
propio `npc_dialogues.json`: se extrajeron sin typetree y sus nodos vienen sin conexiones. En
esos el diálogo se reproduce en orden y no hay ramas. Por eso el gestor **prefiere los grafos
que sí tienen flujo** al elegir conversación (en Benny, 19 de 46).

## Comandos

```bash
python tools/build_dialogues.py --stats   # informe, no escribe
python tools/build_dialogues.py           # regenera data/dialogues_compact.json
python tools/build_dialogues.py --langs EN,SP,JPN
```

El catálogo de visuales se cachea al primer uso; para refrescarlo tras exportar sprites
nuevos, reinicia `server.py`.
