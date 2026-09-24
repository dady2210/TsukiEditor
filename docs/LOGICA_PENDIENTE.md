# Qué lógica del juego falta, y cuál conviene

Análisis, no implementación. Hecho contra `Millionaire .csave` (20 148 562 zanahorias,
586 muebles, 2119 entradas de colección) y el dump de IL2CPP.

## Cómo está medido

El `.csave` tiene **101 nodos raíz**: es el inventario de todo lo que el juego persiste.
Cruzados con el código de la app (`parser.js`, `app.js`, `map.js` y los diez sistemas):

```
101 nodos raíz | 56 se usan en algún sitio | 45 no se tocan
```

Y los datos de diseño viven todos en `sharedassets1.assets`, **pegados al
`LocationManager` que ya está descifrado** (pathID 1784). Eso importa mucho para la
viabilidad: la técnica ya está resuelta y probada.

| asset | pathID | bytes | refs SerializeReference |
|---|---|---|---|
| WeatherData | 1899 | 704 | 0 |
| SeasonData | 1888 | 3 072 | 0 |
| ProgressionTool | 1886 | 3 828 | 4 |
| GachaData | 1778 | 4 436 | 2 |
| NotificationData | 1885 | 7 916 | 0 |
| VillageEventData | 1898 | 16 904 | 0 |
| ActivityData | 1770 | 117 480 | 55 |
| LocationManager | 1784 | 126 088 | 552 ✅ ya hecho |
| GlobalInfo | 1781 | 133 596 | 0 |
| NewspaperData | 1884 | 296 944 | 0 |
| ItemData | 1783 | 594 048 | 235 |
| GameData | 1779 | 4 654 628 | 2 304 |

**Sin registro de `SerializeReference` = mucho más fácil**: se lee de corrido, sin el
parseo a mano que costó el `LocationManager`.

## Lo que ya funciona

Reloj de pueblo, luz por hora, granja completa (parcelas, cultivos, CropBox, cosecha),
tiendas con stock y compra, Junker con fusión, recompensas de peces, periódico,
diálogos, rutinas de NPC (parcial), revestimientos, inventario, guardado sin corromper,
y el mobiliario que coloca el juego.

---

## Grupo 1 — barato, visible, y los datos ya están resueltos

### 1. Clima

`WeatherData` son **704 bytes sin registro**: cuatro gradientes (`rainColor`,
`heavyRainColor`, `snowColor`, `heavySnowColor`) y un `heavyWeatherFrequency`.

No hay nodo de clima en el save, así que **se deriva del día** — no hay que escribir
nada, solo decidirlo igual que el juego. Encaja donde ya está `play_lighting.js`, que
ya modula la escena por hora.

Lo más rentable de la lista: asset trivial, cero riesgo sobre la partida, y cambia por
completo cómo se ve el pueblo.

### 2. Festivales y eventos de pueblo

`VillageEventData` son 16,9 KB sin registro, y `eventSaves` ya se parsea (11 eventos en
tu save, con `eventID`, `year`, `tasksCompleted`, `rewardsClaimed`).

**Esto enciende cosas que ya están extraídas y hoy no se usan:**

- Los `conditionalLayouts` que saqué del `LocationManager` — los tres Marcos de Grulla
  y la Silla Festiva del Ayuntamiento, los 15 de la Casa de Té. Hoy están apagados
  detrás de `DefaultLayouts.showConditional` porque no sé evaluar sus condiciones.
- Los `logic.subscenes` de los `map_*.json`: Halloween, invierno, año nuevo, festival de
  verano. Ya tienen sus sprites y posiciones, nadie los enciende.

Alta relación resultado/esfuerzo, precisamente porque media implementación ya está
hecha sin saberlo.

### 3. Temporizadores de construcción

Tu save tiene `tempTimers` con `{ID: "Home2Construction", startTime, minutesActive: 1440}`.
Es el mecanismo de "esto estará listo en 24 h", y es **la puerta de Homecoming**, que
está aplazado a propósito. `ProgressionTool` (3,8 KB) trae las condiciones compuestas.

Pequeño y bien acotado, pero conviene hacerlo antes que Homecoming, no después.

### 4. Los 45 contadores sin leer

`carrotsSpent`, `carrotsEarned`, `carrotsBought`, `carrotsGiven`, `furnitureBought/Sold`,
`itemsBought/Sold`, `fishCaught`, `harvestTimes`, `gachaRolled`, `junkerUsed`,
`newspapersRead`, `bountiesClaimed`, `cloversBred`, `nodesBroken`, `ordersMade`,
`punchcardsClaimed`…

Son `NamedInt` sueltos: leerlos y mantenerlos es casi gratis. Hacen falta para que las
tiendas, el Junker y los logros cuadren, y dan de paso una pantalla de estadísticas.

---

## Grupo 2 — bucles de juego completos, esfuerzo medio

### 5. Gacha jugable

**Ya está casi todo hecho** y documentado en [GACHA.md](GACHA.md): los 23 fotogramas
extraídos, el reparto del atlas, `GachaData`, y la lógica (`Pull`, `GetRarity`,
`GachaWithRarity`, los premios forzados del primer tiro, `hits` y la reacción de Benny).

Lo único que falta es la física: 10 bolas con colisión circular dentro del polígono,
`force = 10`. Y `GachaponSave` guarda la posición de cada bola, así que persiste.

### 6. Diario y logros

`DiaryData` + `diarySaves` (146 entradas: `num`, `diaryAchievedOA`, `night`, `state`).
Estructura simple y ya parseada. Es contenido, no mecánica compleja.

### 7. Colección

`collection`, **2119 entradas** en tu save. El libro de colección del juego. Ojo: no he
comprobado la forma interna de cada entrada, así que esto hay que sondearlo antes de
estimarlo en serio.

### 8. Punchcard semanal

5 nodos: `rewards[6]` con `RewardType`/`RewardModifier`/`claimed`, más
`furnitureReward` (en tu save, el mueble 802 sin reclamar), `weekStartOA` y `season`.
Bucle chico y cerrado.

### 9. Cartas, pedidos y penpal

`letters` (41 cartas con `read`, `carrotReward`, `orderID`, `deliveryVariant`),
`orders` (3), `deliverySave`, `penpalName`. Es el bucle de correo: pedir, esperar,
recibir. Encaja con el buzón del Ayuntamiento, que ya se dibuja.

### 10. Parsnap — recompensas por foto

`parsnapSave`: `bounties[3]` con `bountyType`, `bountyID`, `ticketReward`, `collected`,
`shiny`, y `bountySlots`. **Es el mismo patrón que el bounty de peces que ya
funciona** (`bounty_system.js`), así que se reaprovecha casi entero.

---

## Grupo 3 — sistemas grandes

### 11. NPCs de verdad — HECHO en parte, ver [NPCS_AMISTAD.md](NPCS_AMISTAD.md)

**Corrección sobre lo que decía este apartado:** la amistad NO está en `liminalSaves`
sino en **`npcSaves`** (35 vecinos, 0..50). Los 64 liminales tienen `friendship` a 0 y
su progreso va por `conditionSaves`. Y de los "dos fallos localizados" que se
anunciaban aquí, el de los mapId del `routine_scheduler` **ya estaba arreglado** —las
10 ramas corresponden—; el que sí era real es que `parseNPCSaves()` leía de
`liminalSaves` y escribía en `npcSaves`.

Hecho: hablar sube amistad una vez al día, se apunta `lastTalkOA`, y hay panel de
vecinos. `ActivityData` (117 KB, 55 referencias) y el significado de cada
`conditionID` siguen sin tocarse.

### 12. Tren y viajes

`trainSave` (3 vagones con su propio mobiliario), `locationsOnPhone` (10 destinos),
`trip`. El vagón es una sublocation decorable más.

### 13. Teléfono

`phoneSave`: `skinID` (171 en tu save), `bgPatternID`, `bgColorID`, scroll, `appLayout`,
fondos y colores desbloqueados. Es personalización de la UI, no mecánica.

### 14. La ciudad

`CityQuestData` (392 bytes) y los niveles 14+. `camBountiesClaimed` sugiere que ya
llevas 67 recompensas allí. Es contenido nuevo entero, no una pieza suelta.

### 15. Homecoming

Aplazado a propósito por [AGENTE_CONTEXTO_PORT.md](../AGENTE_CONTEXTO_PORT.md).
`homecomingUpdates` vale 6 en tu save. Depende del punto 3.

---

## Lo que no merece la pena

Compras integradas (`IAPManager`), sincronización en la nube (`cloudSaveID`,
`lastCloudSavedProgress`), notificaciones push (`notifFlags`, `NotificationData`),
tutoriales (`tutorials`, `tutorialStep`), y el anti-trampas (`legitTimeBinary`, `tHash`,
`lastLegitTimeOA`, `unluckiness`). Son infraestructura de móvil, no juego.

---

## Orden que propongo

1. **Clima** — el mejor resultado por esfuerzo, y cero riesgo.
2. **Contadores** — casi gratis, y otros sistemas los necesitan.
3. **Festivales** — aprovecha los `conditionalLayouts` y las `subscenes` ya extraídos.
4. **Gacha** — está al 80 %; cerrarlo es satisfactorio y acotado.
5. **Temporizadores**, y con ellos Homecoming si lo quieres.
6. **NPCs**, que es el salto grande. Empezando por arreglar los dos fallos ya
   localizados, que son baratos y se notan enseguida.

El resto (diario, colección, punchcard, cartas, Parsnap) son bucles independientes: se
pueden meter en cualquier orden, sin bloquearse entre sí.
