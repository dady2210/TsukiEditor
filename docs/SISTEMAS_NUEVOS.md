# Los sistemas nuevos

Implementación del backlog de [LOGICA_PENDIENTE.md](LOGICA_PENDIENTE.md), en el orden
que se propuso allí. Probado con `save (42).csave` y con `Millionaire .csave`
(20 148 562 zanahorias, 586 muebles, 2119 entradas de colección).

## Antes que nada: una trampa con los assets

Los datos de diseño están en `sharedassets1.assets`, partido en 92 trozos de 1 MB.
**Hay que abrir el `.split0`, no el fichero ya unido.** UnityPy reconoce el sufijo y
rearma los 92 (2014 objetos); abriendo el unido solo ve **255** y la mitad de los
assets "no existen", aunque los bytes sean exactamente los mismos. Costó un rato
entenderlo, así que todas las herramientas apuntan ya al `.split0`.

Lo comprobado: volver a extraer clima, estaciones y festivales por la ruta buena da
**exactamente el mismo resultado** que antes, así que lo ya hecho estaba bien.

---

## 1. Clima

`WeatherData` (704 bytes) y `SeasonData` (3072, **0 bytes sin consumir**):

| estación | tiempo | probabilidad |
|---|---|---|
| Primavera | Lluvia | 50 % |
| Verano | Lluvia | 25 % |
| Otoño | Lluvia | 25 % |
| Invierno | Nieve | 50 % |

`heavyWeatherFrequency = 0.10`: uno de cada diez días de mal tiempo es fuerte.

Los cuatro `Gradient` **no son el color de la lluvia**: son un tinte sobre la escena
indexado por el progreso del temporal (0 = empieza, 1 = termina). La nieve no tinta
—sus dos claves son blancas—; la lluvia sí, hacia un azul grisáceo.

**Lo que es nuestro:** el sorteo por día. `WeatherData.GetWeather(DateTime, out
progress, out heavy)` decide el tiempo a partir de la fecha, pero el dump de IL2CPP
solo trae la firma, no el cuerpo. Así que se usa un hash estable de (mes, día) contra
la probabilidad real de la estación: misma fecha, mismo tiempo, siempre.

Un año de prueba (336 días): 216 despejados, 83 de lluvia, 37 de nieve — que es lo que
sale de esas probabilidades.

Dibuja en su propio lienzo, fuera de la copia de paneo y del horneado del fondo. Bajo
techo no caen partículas, solo se nota el tinte. Con "reducir movimiento" no se apaga
—te quedarías sin saber que llueve— sino que caen un tercio.

`weather_system.js` · `tools/extract_weather_seasons.py` · `data/weather.json`

## 2. Los contadores

El save tiene **101 nodos raíz**, y 45 no se leían. En vez de listarlos a mano
—frágil, y `findPattern` recorre el búfer entero por cada uno— se hace un **barrido
genérico del AST**: toda primitiva de la raíz entra en `generalVars` con su tipo, según
su marcador de Odin (`0x17` int32, `0x1b`/`0x1d` int64, `0x1f` float, `0x21` double,
`0x2b` bool). Pasan de 20 a **69**.

Los int64 viajan como `BigInt`; convertirlos a `Number` rompería el reempaquetado, así
que `writeGeneralVar` los devuelve a `BigInt`.

Y ahora se **mantienen** al jugar:

| acción | contador |
|---|---|
| ganar / gastar zanahorias | `carrotsEarned` / `carrotsSpent` |
| comprar | `furnitureBought` o `itemsBought` |
| cosechar | `harvestTimes` |
| usar la Junker | `junkerUsed` |
| cobrar un pez | `bountiesClaimed` y `fishCaught` |
| leer el periódico | `newspapersRead` (solo la primera vez) |
| tirar de la gacha | `gachaRolled` |
| punchcard / Parsnap | `punchcardsClaimed` / `camBountiesClaimed` |

**Comprobación de que no se rompe nada:** cargar y reensamblar los dos saves da un
fichero **byte a byte idéntico** al original.

## 3. Festivales

12 eventos con sus fechas reales, sacados de `VillageEventData` anclando en las
cadenas `EVENT_*` (su `VillageEventDetail[]` no está en el dump, así que no se puede
leer de corrido).

```
 0 Halloween          16/10-01/11     6 Importancia Marina   05/06-20/06
 1 Navidad            13/12-29/12     7 Salvaje Oeste        12/09-30/09
 2 Año Nuevo Lunar    11/01-25/01     8 La Gran Recolección  15/11-30/11
 3 Mes del Huevo      01/05-21/05     9 Valentine's          07/02-21/02
 4 Festival de Verano 10/08-28/08    10 Fate's Folly         05/03-19/03
 5 Festival Bufonesco 01/04-16/04    11 Jungle Jamboree      05/07-25/07
```

Los 11 `eventID` que el `.csave` tiene guardados existen todos aquí, y **ningún día
del año cae en dos festivales a la vez**.

Un festival enciende dos cosas que ya estaban extraídas y no usaba nadie:

- **`logic.subscenes`** de los mapas: la calabaza y los fantasmas de Halloween, la
  nieve de Navidad, el Año Nuevo Lunar y el Festival de Verano.
- **Los `conditionalLayouts`** del mobiliario. Su condición resultó ser
  `conditionType 36` = **`VillageEvent`**, y su `value` es el `eventID`. Encaja
  perfecto: los tres Marcos de Grulla del Ayuntamiento y las 15 piezas de la Casa de Té
  son del **Festival de Verano** (grullas de papel = Tanabata), y la Silla Festiva es
  de **Navidad**.

Una pieza de festival sustituye a la de diario que ocupe su celda, aunque
`disablePlacements` venga vacío: la Silla Festiva y la Silla de Caoba están las dos en
la (10,17).

`events_system.js` · `tools/extract_events.py` · `data/events.json`

## 4. La gacha, jugable

`GachaData` parseado entero (**0 bytes sin consumir**): 5 colecciones de 19 premios,
siempre 10 Common / 5 Rare / 3 Epic / 1 Legendary.

```
Super Bug Fighters · Feesh · Cosmic Beasts · Lazy Daisy · Pocket Lands
```

"Pocket Lands" trae `forcedDraw`: su primer tiro está trucado.

La máquina (mueble 344) la coloca el juego en la celda (12,12) del Ayuntamiento. Al
tocarla salen las dos opciones del juego: **gastar un ticket** o **darle un golpe**.
Golpearla lleva cuenta y al tercero Benny se queja, como su `bennyReaction`.

Las **10 bolas** ruedan con física dentro de la urna, en su propio lienzo. El fotograma
de cada bola es su rotación, igual que `GachaBallObject.UpdateSprite`. Una es dorada.
Si mueves la cámara o haces zoom, las bolas van con la máquina.

**Lo que es nuestro:** las probabilidades por rareza (60/27/11/2 %). `GetRarity()` está
en el binario pero no en el dump. En 400 tiradas salió 236/108/48/8, que es la tabla.

`gacha_system.js` · `tools/extract_gacha.py` · `data/gacha.json`

## 5. Temporizadores y Homecoming

`getTempTimerStatus()` dice cuánto le falta a cada cronómetro y si ya terminó
(`startTime` es una fecha OLE Automation; `minutesActive`, lo que dura). En el save
gordo hay uno: `Home2Construction`, de 1440 minutos, **ya listo**.

**Y aquí había un fallo.** El piso extra de la Casa del Árbol se enseñaba si
`homecomingUpdates === 1`, y eso está mal: no es una bandera de la partida sino el
número de tandas de contenido publicadas — vale **6 en los dos saves**, así que la
comprobación daba siempre falso y el piso **no salía nunca**, ni en una partida que lo
tiene construido.

El interruptor real es `sublocations[0].currSLocData`: 1 = casa ampliada. Estaba en
tercer lugar, detrás de dos comprobaciones que nunca le dejaban llegar. Se ha unificado
en `_homecomingActivo()` (había tres copias del mismo bloque).

Ahora: `save (42)` → no (currSLocData 0); `Millionaire` → **sí** (currSLocData 1), y su
mapa 0 dibuja los 135 muebles incluido el piso de arriba.

## 6. NPCs

**Las ramas del planificador ya estaban bien.** El informe antiguo decía que 9 de 10
tenían el mapId equivocado; al comprobarlo, las 10 corresponden: mapa 0 Casa del Árbol,
1 Yori, 2 Chi, 3 Moca, 4 Muelle, 5 Rosemary, 6 Granja, 8 Ayuntamiento (Benny), 9 Bobo y
Momo, 11 Dawn. Ya no aparece Rosemary en el Ayuntamiento.

Lo que sí estaba mal eran las **posiciones de `npc_activities` del mapa 8**: 3 de las 4
caían fuera del piso, y no era un simple cambio de signo. Se han derivado del propio
juego:

| actividad | de dónde sale | mundo |
|---|---|---|
| Benny con el papeleo / durmiendo | la Silla de Caoba (mueble 19) del layout, celda (10,17) | (0.53, 0.715) |
| Benny en el podio | el GameObject `Pedestal` de `level8` | (3.78, −0.91) |
| León camuflado | rejilla de la pared derecha, celda (8,3) | (2.28, 1.59) |

Benny cae ahora exactamente en la celda de su silla.

## 7. Colección, diario, punchcard, cartas y Parsnap

El parser ya sabía **leer** estos nodos. Faltaba el bucle.

- **Colección** — 2119 entradas en el save gordo, **1820 objetos distintos de 2644**
  del catálogo, con 302 variantes brillantes (un id negativo es la variante B del mismo
  mueble, así que se cuenta por `|id|`). Lo que consigues entra solo: premios de gacha,
  compras y objetos de las cartas.
- **Punchcard** — 6 casillas más la de mueble. Reclamarlas da el objeto y sube
  `punchcardsClaimed` (47 → 53 en la prueba). El mueble semanal del save gordo es el
  **802**, y ahora se entrega: el parser buscaba `furnId` y el save lo llama `furnID`,
  y el modificador estaba como `RewardModifier`, no `modifier`; por eso no daba nada.
- **Cartas** — 41 en el save gordo. Abrirlas entrega sus objetos y sus zanahorias.
- **Diario** — 146 entradas en el save, 145 vistas. El texto sale de `DiaryData`
  (185 KB), anclando en `DIARY_<n>_DESC` igual que con los festivales, porque
  `SpriteAssetReference` y `Condition[]` no tienen tamaño fijo en el dump. Salen **144
  entradas con su texto en español**, y cruzan con el save por `num`: 102 de las 146
  del jugador tienen texto. Las otras 44 (num 145..242) son de contenido más nuevo que
  este AssetPack, y se muestran sin texto en vez de inventarlo.
- **Parsnap** — los encargos de foto: 3 huecos, con `ticketReward` y `shiny`. Cobrarlos
  sube `camBountiesClaimed` (67 → 69 en la prueba). El importe en zanahorias no está en
  el save, así que esa cifra es nuestra.

Todo se ve en el botón **📚 Progreso** del HUD, junto con las estadísticas. Y **🌦️ Hoy**
dice qué tiempo hace y qué festival hay.

`progress_system.js` · `tools/extract_diary.py` · `data/diary.json`

---

## Lo que queda fuera

- **44 entradas de diario** (num 145..242) que el save tiene y este AssetPack no: son
  de una versión posterior del juego. Se listan con su estado, sin texto.
- **Las recompensas diarias del punchcard**: en el save todas tienen
  `RewardType 0` y `RewardModifier 0`, o sea que el save no dice qué dan. Se marcan
  como reclamadas pero no entregan nada, porque no hay de dónde sacarlo.
- Compras integradas, nube, notificaciones, tutoriales y anti-trampas: infraestructura
  de móvil, no juego.

## Comprobado

- Los dos saves cargan, se reensamblan **byte a byte idénticos** y no dan un solo error
  de consola.
- Casa del Árbol, Granja y Ayuntamiento dibujan lo que deben en ambos; la cosecha, las
  rejillas y el mobiliario del juego siguen igual.
- `tools/check_visual_positions.py`: 854 de 854 visuales cuadran con el nivel de Unity.


## Festivales: estaban apagados y no se sabía

`VillageEvents.activo()` comparaba `mes*100 + dia` esperando un día del mes, pero el
save guarda `day` como **día OA** (45779 = 2025-05-02). El resultado era 46179 contra
rangos como 1031, así que **no coincidía nunca**: `activo()` devolvía `null` siempre.

Eso dejaba muertas tres cosas sin que se notara, porque fallaban en silencio:

- los `conditionalLayouts` del `LocationManager` ([default_layouts.js:125](../default_layouts.js#L125))
  — los marcos de grulla y la silla festiva del Ayuntamiento, los 15 de la casa de té;
- las subescenas de festival de los mapas ([map.js:4438](../map.js#L4438));
- las condiciones `VillageEvent` de los diálogos.

Arreglado convirtiendo el día OA a (día, mes). Comprobado: 12 festivales, 207 de 365
días caen en alguno, y las subescenas se encienden —Halloween 17 días, invierno 17,
año nuevo lunar 15, mes del huevo 21, festival de verano 19—. Con `Millionaire .csave`
(2 de mayo) ahora sale "Mes del Huevo"; con `save_en_city` (13 de agosto), "Festival de
Verano".

**El mismo fallo estaba en el clima** y se corrigió a la vez: sembraba
`Date.UTC(año, mes, 45779)`, una fecha a 125 años vista. Ahora usa el día OA directo,
que es justo lo que siembra el juego.
