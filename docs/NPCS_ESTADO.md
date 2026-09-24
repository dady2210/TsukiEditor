# NPCs en los mapas: de dónde salen y cómo se colocan

Investigación y primera pasada del 14-09-2026. Alcance: los 10 mapas de la aldea
(0, 1, 2, 3, 4, 5, 6, 8, 9, 11).

## La pregunta: ¿hay NPCs fijos en los mapas?

**No. Hay que colocarlos a mano.** Se comprobaron las tres fuentes posibles:

1. **Los niveles de Unity no contienen personajes.** En las jerarquías extraídas
   (138–230 GameObjects por nivel), los únicos nombres que coinciden con NPCs son
   *edificios* (`Chi House`, `Dawn Shop`, `Momo Tea House`). Los personajes los instancia
   el juego en runtime: en el código decompilado está `LiminalNPC__Populate()`, que
   referencia `SLocation` pero no lee posiciones de la escena.
2. **El `.csave` tampoco.** Se parsearon 7 saves con
   [`getActivitySaves()`](../parser.js#L3259): todos tienen **exactamente 1 actividad y
   siempre con `npc=-1`** (Tsuki). El `FurnitureBoundActivitySave` guarda la actividad
   actual de Tsuki, no NPCs.
3. **Los diálogos no traen ubicación** — `dialogues_compact.json` solo tiene `id`, `name`,
   `graphs`, `nodes`.

## Los dos sistemas

**A. `logic.npc_activities` en cada `map_*.json`** — posición en coordenadas de mundo,
dibujado por [`_drawMapNpcActivities()`](../map.js#L3701). **No depende de las superficies**,
así que funciona aunque el piso del mapa siga siendo un placeholder. Es el mecanismo
principal.

**B. `routine_scheduler.js`** — actores ambientales con posición de grilla, dibujados por
[`_drawAmbientActors()`](../map.js#L3619) vía `getIsoCoords`, o sea **sí depende del piso**.

### Lo que estaba roto

- **9 de las 10 ramas del scheduler apuntaban al mapId equivocado.** Al abrir el
  Ayuntamiento salía Rosemary, y Benny se dibujaba en la escena del tren. Corregido:
  1→6, 2→4, 3→11, 4→2, 5→9, 6→3, 7→8, 8→5, 9→1 (el 0 ya estaba bien).
- **El deduplicador comparaba `npcKey` contra `charId`** ([map.js:3574](../map.js#L3574)).
  Funcionaba de casualidad porque hoy coinciden; al poblar más mapas habría dibujado un
  NPC fijo y su gemelo ambiental encima. Ahora compara `npcKey` con `npcKey`.
- **Las posiciones de grilla solo son válidas donde el piso es real.** Se comprobó actor
  por actor: **el mapa 0 es el único donde caen dentro del piso** (3/3). En el resto el
  piso es placeholder o vacío y el actor acababa flotando fuera del edificio. Se añadió
  `_hasRealFloor()`, que suprime al actor ambiental en ese caso; ahí los NPCs los aporta
  `logic.npc_activities`.
- **`_drawMapNpcActivities` dibujaba todas las actividades de un mapa a la vez.** Las de un
  mismo NPC son *alternativas*, no simultáneas: el mapa 8 declara `benny_paperwork`,
  `benny_nap` y `benny_podium`, así que salían tres Bennys, dos de ellos superpuestos
  porque papeleo y siesta comparten `position`. Ahora `_selectNpcActivities()` elige una
  por `npcKey`: si es de noche (22:00–06:59, el mismo corte que
  `RoutineScheduler.getPeriod()`) prefiere la de `isBed: true`, y si no alterna entre las
  despiertas según la hora — estable dentro de la hora, así que no parpadea.

## Estado actual

| mapId | Mapa | NPCs fijos | Anim |
|---|---|---|---|
| 0 | Casa del Árbol | — (lo cubre el scheduler, su piso sí es real) | |
| 1 | Tienda de Yori | Yori, Elfie, Pipi | Yori-Sweep, Elfie-Checklist, Pipi-Draw |
| 2 | Casa de Chi | Chi | Chi-Clean |
| 3 | Casa de Moca | Moca | Moca-Read |
| 4 | Muelle de Yori | Tsuki | Tsuki-Fishing |
| 5 | Tienda de Rosemary | Rosemary | Rosemary-Plant |
| 6 | Granja de Tsuki | Tsuki | Tsuki-WateringCan |
| 8 | Ayuntamiento | Benny ×3, Leon | BennyPaperwork, Benny-Nap, Chameleon_TownHall |
| 9 | Casa de Té de Momo | Momo, Bobo | Momo-ServeTea, Bobo-Frying |
| 11 | Taller de Dawn | Dawn | Dawn-Hammer |

**15 actividades, 0 errores de animación**, sin solapes fijo/ambiental sin resolver.

Las posiciones son una primera pasada colocada sobre el fondo ensamblado y revisada a ojo.
Quedan afinables: Rosemary se solapa un poco con un cartel y Pipi queda algo alta.

## Cómo ajustar o añadir

**Con la herramienta** (rápido, sin navegador):

```bash
python tools/render_npc_check.py --list        # inventario
python tools/render_npc_check.py --only 5      # dibuja los NPCs sobre el ensamblado
python tools/render_npc_check.py --only 5 --grid   # + rejilla de coordenadas de mundo
```
Salida en `scratch/npc_check/`. La cruz magenta marca el punto de anclaje, que es lo que
mueve `position`. La rejilla etiquetada permite leer la coordenada a ojo y escribirla
directo en el JSON.

**Con el editor** (arrastrando):

1. `python server.py` → http://localhost:8888
2. Abrir http://localhost:8888/data/HERRAMIENTAS/map_editor_2.html y cargar el mapa.
3. Panel de actividades NPC: elegir personaje y animación, añadir, arrastrar a su sitio.
4. Guardar — va por `POST /api/save/map/:id` y escribe `logic.npc_activities`.

Formato de referencia: el mapa 8. `mode: "fixed_spot"`, `position` en coordenadas de mundo,
`fps` bajo (1–6) para animaciones de reposo.

## Pendiente

Los mapas de ciudad (12, 13, 25–33) no se tocaron. Y a medida que se completen los pisos
reales (ver [SURFACES_ESTADO.md](SURFACES_ESTADO.md)), el scheduler volverá a aportar
variación por hora del día en esos mapas: `_hasRealFloor()` los deja pasar solo.
