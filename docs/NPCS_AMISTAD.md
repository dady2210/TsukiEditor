# Los vecinos: hablar y que sirva de algo

El motor de diálogo y el clic sobre los personajes ya existían. Se tocaba a alguien y
salía su conversación. Lo que no pasaba nada era **después**: ni subía la amistad, ni
se apuntaba la charla, ni se desbloqueaba nada.

## Cómo lo guarda el juego

Hay **dos listas de personajes** en el `.csave`, y no son intercambiables:

| nodo | cuántos | qué lleva |
|---|---|---|
| `npcSaves` | 35 | Los vecinos del pueblo. **Aquí sí hay relación**: `friendship` de 0 a 50, `lastFriendshipDay` y `lastTalkOA`. |
| `liminalSaves` | 64 | Los de la ciudad. Su `friendship` está a **0 en todos**. |
| `conditionSaves` | 26 | `{character, conditionID, dateFulfilled, level}`. Es lo que mueve a los liminales. |

Comprobado sobre `Millionaire .csave`:

- **El tope de amistad es 50**, no 10 000: 18 de los 35 vecinos están ahí, y ninguno
  pasa. `lastFriendshipDay` guarda días OA (45651, 45536…), uno por vecino.
- De los 64 liminales, **14 tienen `lastTalkOA`** (Duncan, Emiko, Emile, Owens, Theo…,
  todos con la misma marca de tiempo) y **ninguno tiene amistad**.
- `conditionSaves` va por niveles muy dispares: los vecinos están en 1-5, pero Draper
  llega a 46, Olson a 32 y el personaje 19 a 84. Son contadores, no corazones.

`ProgressionTool.maxFriendship` existe en los assets pero vale **0**, así que el 50
sale de los datos, no de ahí.

## El fallo que había debajo

`parseNPCSaves()` recorría bytes desde el ancla **`liminalSaves`** y devolvía esos 64,
todos con amistad 0. Pero `setNPCFriendship()` escribía en el árbol de **`npcSaves`**,
buscando por `charId`. O sea: **leía de una lista y escribía en otra**.

Efecto: la pestaña de NPC del editor mostraba 64 personajes todos a cero, y tocar la
amistad de uno no cambiaba nada en el sitio correcto — pero sí metía un `writeInt32` a
pelo dentro del bloque de `liminalSaves`.

Ahora todo va por el AST, que es donde el save guarda de verdad:

```
parseNPCSaves()     llena npcSaves (35) y liminalSaves (64) por separado
getNPCSave(charId)  busca en las dos
getConditionSaves() las 26 condiciones con su nivel
```

Y de paso: `setNPCPester()` buscaba `Pester` al lado de `friendship`, cuando vive
dentro del `activitySave`.

## Lo que hace ahora

Tocar a un vecino abre su diálogo **y**:

- apunta `lastTalkOA` con la fecha exacta;
- sube `Pester` en uno;
- **sube un punto de amistad, una vez al día**, hasta 50;
- avisa con un aviso flotante cuando sube, y dice si ha llegado al tope.

Todo eso es lo que hace `BaseNPCSave.TalkTrigger()` en el binario:

```csharp
LastTalk = CastleTime.Now;                        // siempre
activitySave.Pester += 1;

if (CastleTime.LegitDay <= lastFriendshipDay) {
    if (CastleTime.LegitDay < lastFriendshipDay)  // reloj hacia atrás
        lastFriendshipDay = LegitDay;             // lo corrige en vez de bloquear
    return;
}
if (friendship < GamePreferences.maxFriendship) {
    friendship += 1;
    lastFriendshipDay = CastleTime.LegitDay;      // ← solo si subió
}
```

El enganche es de un solo punto: se envuelve `DialogueManager.startDialogue`, que ya se
llamaba desde `map.js` al tocar a alguien. Ni `map.js` ni el gestor de diálogos se
tocan.

**Botón 🧑‍🤝‍🧑 Vecinos** en el HUD: los 35 del pueblo con sus corazones (0-50 repartido
en cinco) y quién queda por saludar hoy, más los de la ciudad con sus condiciones. El
contador rojo del botón dice cuántos quedan pendientes.

## Ya no queda nada inventado aquí

Este apartado decía que el "1 punto por charla" era una decisión nuestra porque el dump
solo traía la firma de `AddFriendship()`. Descompilando el binario con Ghidra resultó
que **acertaba por casualidad**, y de paso salieron dos cosas que sí estaban mal:

| | de dónde sale ahora |
|---|---|
| `friendship += 1` | `BaseNPC<object>.AddFriendship()` — literalmente `*(int*)(save+0x28) += 1` |
| tope 50 | `GamePreferences.get_maxFriendship()` — `return 0x32`, constante en el código |
| una vez al día | `BaseNPCSave.TalkTrigger()`, contra `LegitDay` |

`0x28` es `friendship` en la disposición de 64 bits: header 0x10 → `character` 0x10 →
`activitySave` 0x18 → `lastTalkOA` 0x20 → **`friendship` 0x28**. Y el tope no salía de
`ProgressionTool.maxFriendship` (que vale 0), sino de `GamePreferences`, que es otra cosa.

### Los dos errores que había

**`lastFriendshipDay` se marcaba de más.** Yo lo escribía también cuando el vecino ya
estaba al máximo, para que no saliera siempre como "pendiente" en el panel. El juego no
hace eso: en un vecino a 50 ese campo se queda congelado para siempre. Era atacar el
síntoma en el sitio equivocado — el campo bueno para "¿he hablado hoy?" es **`lastTalkOA`**,
que sí se reescribe en cada charla. Ahora el panel mira ese.

**`Pester` no subía.** Sube en cada charla, no una vez al día.

### Encender condiciones — HECHO

`DialogueBaseNode.fulfillConditions` ya se extrae, y `parser.fulfillNPCCondition()`
copia `NPCCondition.Fulfill()`:

```csharp
var save = get_Save();
if (save != null) { save.Renew(); return save; }   // Renew: fecha = ahora, level += 1
conditionSaves.Add(new NPCConditionSave(this));    // nueva, level = 1
```

Detalle que cambia cómo se lee el save: **`level` no es un rango, son las veces que se
ha cumplido**. Por eso Draper tiene 46 en `ShownAd` y Camille 84 — han visto el anuncio
esas veces.

Comprobado disparando las 44 condiciones que aparecen en los diálogos: 9 crean entrada
nueva, 35 renuevan, y las 35 resultantes siguen resolviendo a un nombre válido. Sin
cambios el save reensambla byte a byte idéntico; con cambios se relee correcto.

### Las puertas de los diálogos — HECHO en su mayor parte

[activity_scheduler.js](../activity_scheduler.js) evalúa las condiciones y
`dialogue_manager` ya filtra con ellas, en la apertura y en las respuestas.

**Cobertura: 897 de 899 condiciones.** Antes no se evaluaba ninguna.

El hallazgo que lo hizo barato: **no hay que simular nada**. El save ya guarda lo que
hace y dónde está cada vecino, en `activitySave`:

```
ActivityID    qué está haciendo
NpcID         quién (es charId - 1: CharEnum empieza en Tsuki = 0)
Valid         si hay actividad viva
...containerID.sublocationID    DÓNDE está, en SLocation
```

Comprobado sobre los cuatro saves: **66 de 66** `activitySave` válidos apuntan a una
actividad que existe en el catálogo de ese personaje, y `NpcID == charId - 1` en los
66. Los que parecían no cuadrar eran todos `Valid: false`, o sea sin estrenar.

Hay **tres formas** de `activitySave` y el contenedor no está en el mismo sitio:
atado a un mueble va en `placementPointer.containerID`; sobre la rejilla, en
`containerID` de la raíz con `groupPosition` y `Orientation`; y el de vector solo trae
`PositionIndex`, sin lugar. Mirando solo la primera se perdían nueve vecinos.

**Lo que no sabemos juzgar no bloquea.** `cumple()` devuelve `true`, `false` o **`null`**,
y el selector deja pasar el `null`. Si tratásemos lo desconocido como falso
esconderíamos diálogo por cosas que simplemente no hemos portado. Y si las puertas no
dejan pasar ningún grafo, se cae al comportamiento de antes antes que dejar a un
vecino mudo.

Lo que queda sin juzgar son **2 de 899**, las dos fuera de alcance:

| tipo | veces | por qué |
|---|---:|---|
| `Battery` | 1 | la batería del móvil (`< 10 %`). Un editor no tiene |
| `NewspaperOfTheDay` | 1 | necesita la lógica del periódico del día |

`Custom` se cerró portando `JunkerBroken` (`JunkerSave.Broken = brokenNodes.Any(x => x)`),
que es la única que usan los diálogos. Las otras tres subclases existen pero nadie las
cita: `SummerTaikoWindow` depende de una `TimeRange` guardada en el propio objeto, y
`DieOnWrymcraftPedestal` y `RegularLampOn` recorren los muebles colocados.

**Cuidado con el orden de `customConditions`.** El registro de `SerializeReference` va
en orden de bytes (`SummerTaikoWindow` primero) pero el array guarda rids en otro orden
(`JunkerBroken` primero), y el índice del array es lo que citan los diálogos. Leyendo
el orden equivocado, `Custom 0` se interpreta como `SummerTaikoWindow` — y entonces
`DawnWeld` deja de tener sentido, porque lo que pasa es que **Dawn suelda cuando la
Junker está rota**.

## El sorteo de actividad

`BaseNPC.Simulate()` resultó ser corto:

```csharp
ActivePost(out post);
foreach (idx in GetActivityOrder(activities))
    if (act.post == post && act.Try(...)) { SetActivity(idx); return; }
```

Y `GetActivityOrder` es una ordenación **aleatoria por cubos**: permutación al azar, se
descartan las `nonrollable` y las que fallan su `spawnRate` (que solo se aplica si
`specialActivity` es `None` u `Override`), se puntúa con `ActivityValue` y se ordena.
`ActivityValue` da −1 a las `Important`, 9999 a las `LowPriority`, y 0/1 al resto según
dos tiradas contra 0.15 y 0.4.

Esas dos constantes Ghidra no las descompila porque **son datos, no código**. Se leen
del `.so` traduciendo la dirección de Ghidra a offset de fichero con las cabeceras de
programa del ELF; el control es que `_UNK_012dfb44` sale `0.05f`, que ya se conocía.

Dos límites, y son del juego:

- **No es reproducible.** Usa `UnityEngine.Random`, que no se siembra desde el save: el
  juego también saca algo distinto cada vez. Eso lo separa del clima, que sí se clava
  porque usa `System.Random` sembrado con el día OA.
- **No recoloca.** `ActivityObject.Try()` además busca sitio —celda libre, mueble
  compatible—, y eso depende del estado del mapa. `sortear()` elige la actividad y
  conserva el contenedor que ya tuviera.

**Lo que no hace el planificador**: sortear una actividad nueva cuando avanza el reloj.
Eso es `RollNPC`, que no está portado. Se lee lo que hay guardado; si mueves el reloj,
los vecinos siguen donde el save dice.

## Qué significa cada conditionID

`NPCCondition.get_ID()` devuelve **el índice de la condición dentro del array
`conditions` de ese personaje**, buscándola por `conditionName`:

```csharp
for (i = 0; i < npc.conditions.Count; i++)
    if (npc.conditions[i].conditionName == this.conditionName) return i;
return -1;
```

Y `NPCCondition.Fulfilled()` **no evalúa ninguna regla**: solo mira si ya existe un
`conditionSave` con ese personaje y ese ID. O sea que no había lógica que copiar, solo
datos que extraer.

[tools/extract_npc_conditions.py](../tools/extract_npc_conditions.py) los saca de los
ScriptableObjects de cada personaje en `sharedassets1` y escribe
[data/npc_conditions.json](../data/npc_conditions.json): **14 personajes, 84
condiciones**. El panel de vecinos ya las enseña por su nombre.

Ejemplos reales del save gordo:

| personaje | id | nombre | nivel |
|---|---|---|---|
| Benny | 4 | `PunchedGacha` | 5 |
| Dawn | 1 | `Junker` | 13 |
| Chi | 20 | `editUnlocked` | 1 |
| Rosemary | 0 | `BonsaiUnlocked` | 1 |
| Draper | 0 | `ShownAd` | 46 |

### Cómo se comprobó

El array no se puede leer con el typetree generado desde los DummyDll, porque
`BaseNPC` trae dos campos `[SerializeReference]` (`activities` y `posts`) antes de
`conditions` y el generador los deja caer. Se busca por su forma:

```
NPCCondition = character(int) + conditionName(string alineado)
             + expires(bool + relleno) + defaultExpireTime(float) + emotion(int)
```

Y se exige que **todas** las condiciones lleven el `character` del dueño, que es
`npcID + 1` (el `CharEnum` empieza en `Tsuki = 0`). Sin ese filtro colaban falsos
positivos: Bobo salía con una condición de `character 0` cuando el suyo es el 8, y dos
ScriptableObjects que ni son personajes (`Conversation`, `Convo Response`) también.

- **46 de 46** `conditionSaves` de los cuatro saves resuelven a una condición con
  nombre, sin ningún índice fuera de rango.
- **0 discrepancias** entre el `character` leído y el `charId` de `NPC_DB`.
- Los cuatro saves siguen reensamblando **byte a byte idénticos**.
- **Las actividades** (`ActivityData`, 117 KB con 55 referencias). Los NPC se dibujan
  donde dicen `npc_activities` y el planificador, pero no eligen actividad según la
  hora ni se atan a un mueble.
- **`tempValues`** de cada ficha, que el juego usa para estados temporales.

## Comprobado

- `npcSaves` 35 (18 con amistad, máximo 50), `liminalSaves` 64, `conditionSaves` 26.
- Hablar sube 1 la primera vez del día y **0 la segunda**; `lastTalkOA` cambia siempre.
- Al máximo no pasa de 50, y `lastFriendshipDay` **no** se toca.
- Con el reloj adelantado, `lastFriendshipDay` se corrige hacia abajo en vez de dejar al
  vecino bloqueado hasta alcanzar esa fecha.
- Un vecino a 50 con charla de hoy sale como hablado; sin charla, como pendiente.
- Clic sobre Benny en el Ayuntamiento: se abre su diálogo con su texto y queda
  registrada la charla.
- Los dos saves se reensamblan **byte a byte idénticos**.
