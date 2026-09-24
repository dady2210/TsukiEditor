# Cultivos de la granja (mapa 6)

Trabajo del 14-09-2026.

## Los sprites sí estaban en el juego

Los prefabs de semilla del bundle de muebles llevan un MonoBehaviour cuyo **typetree sí
resuelve** —al contrario que los de `interaction_nodes` o `grid_system`—, y declara
exactamente lo que hacía falta:

| Campo | Qué es |
|---|---|
| `ID` | el id del item (342 zanahoria, 1230 calabaza…) |
| `stages[]` | sprites de crecimiento |
| `harvestAnimation` | `{frames[], fps, loopMode, stopOnLastFrame}` |
| `strangeHarvestAnimation` | la variante "rara" (5% al cosechar) |
| `rottenHarvestAnimation` | solo la calabaza |
| `harvestFail` / `strangeHarvestFail` | solo el gloamroot |

O sea que aquí **no hay que adivinar qué frames forman animación**, al revés que con los
props del escenario: el propio juego lo dice, con su fps y todo.

## Lo extraído

`python tools/extract_crops.py` saca **199 PNG, los 9 cultivos**:

| ID | Cultivo | Etapas | Cosecha | Extra |
|---|---|---|---|---|
| 342 | Zanahoria | 3 | 8 + 8 raras | |
| 345 | Sandía | 3 | 8 + 8 | |
| 1208 | Cebolla | 3 | 7 + 8 | |
| 1230 | Calabaza | 3 | 8 + 8 | 8 de podrida |
| 1231 | Raíz oscura | 3 | 9 + 9 | 8 + 8 de fallo |
| 1232 | Papa | 3 | 8 + 8 | |
| 1233 | Rábano | 3 | 8 + 8 | |
| 1237 | Fresa | 3 | 8 + 8 | |
| 1238 | Uvas | **8** | 7 + 7 | |

Todas las animaciones van a **12 fps**, que es lo que traen los prefabs.

### Cómo se guardan

Un directorio por cultivo, **con el id por delante**, y el id también en cada archivo:

```
images/crops/342_CarrotSeeds/CROP_342_stage_0.png    etapas de crecimiento
                             CROP_342_harvest_0.png  animación de cosecha
                             CROP_342_strange_0.png  cosecha rara
data/crops_db.json                                   el índice
```

Los frames de un cultivo vienen recortados a distinto tamaño en el bundle, así que el
extractor los **alinea por su pivot en un lienzo común**: todos los de un cultivo salen del
mismo tamaño y con el pivot en el mismo punto. Quien los dibuje solo tiene que pintarlos en
el mismo rectángulo y no saltan. `crops_db.json` guarda ese `frameW`/`frameH`, el `pivot`
normalizado (Y desde abajo, como en Unity) y el `ppu` (150, el mismo que usa el mapa).

## En modo play

[map.js](../map.js) dibuja el cultivo con el sprite que le toca por su avance:
`cropStageIndex()` reparte el progreso entre las etapas que tenga cada uno (3 casi siempre,
8 las uvas) y al estar maduro usa la última. Antes se estiraba un único icono al 45 %, 65 %
y 85 % para fingir el crecimiento.

Al cosechar, `farmingSystem.harvestPlot()` lanza `map.playCropHarvestFx()`, que reproduce la
animación real —normal, rara o podrida según el estado— a sus 12 fps. Va en una **capa
aparte por encima de todo**, porque cuando le toca dibujarse la parcela ya está vacía (o
resembrada, en el caso de la zanahoria, que es infinita). Vale igual al tocar la parcela que
al usar la hoz, porque el disparo está dentro de `harvestPlot`.

Si un cultivo no estuviera en `crops_db.json`, se sigue cayendo al icono `FURN_<id>` de
antes.

## En el editor de mapas

Los 199 sprites salen en **Visual +** bajo la categoría "Cultivos", una carpeta por cultivo.
Y como aquí sí se sabe qué es animación:

- elegir un frame de **cosecha** monta la animación entera con su fps real, **sin marcar
  nada**;
- elegir una **etapa de crecimiento** lo coloca estático, que es lo correcto: son estados de
  horas, no una animación;
- si aun así se quiere ver crecer, la casilla "como animación" encadena las etapas.

Al guardar van a `logic.interactive_props` con su `dir`, como el resto de props animados.

## Un arreglo que salió por el camino: el servidor iba a 2 s por petición

Al probarlo, los sprites no llegaban a cargar. La causa no era el código nuevo:
**`server.py` escuchaba solo en IPv4** y en Windows `localhost` resuelve primero a `::1`, así
que cada petición se comía unos 2 segundos esperando a que fallara el intento IPv6. Con la
granja abierta el navegador se quedaba con 49 imágenes colgadas y no pintaba nada.

Ahora abre un socket IPv6 con `IPV6_V6ONLY` apagado, que atiende las dos pilas por el mismo
puerto, y usa `ThreadingTCPServer` en vez del de un solo hilo. Medido sobre el mismo PNG:

| | antes | ahora |
|---|---|---|
| `localhost` | 2,01 s | 0,004 s |
| `127.0.0.1` | 0,004 s | 0,004 s |

Esto acelera **todo** el editor y la app, no solo los cultivos.

## Comprobado

- 199 PNG, ninguno vacío, un solo tamaño de lienzo por cultivo, pivot abajo-centro.
- En modo play con `save (37).csave`: 25 parcelas en la granja, los sprites de etapa cargan
  (`98x264` la zanahoria) y la cosecha reproduce sus 8 frames a 12 fps y se limpia al acabar.
- En el editor: 9 carpetas en el selector, `CROP_342_harvest_0` → 8 frames a 12 fps,
  `CROP_342_stage_1` → estático, y con la casilla marcada → 3 frames a 8 fps. Colocado en el
  mapa 6 se dibuja y va cambiando de frame.

## Segunda pasada (15-09-2026)

### El cultivo ya no flota

Se pintaba con un `Math.sin(Date.now())` que lo hacía subir y bajar mientras estaba
maduro. Ahora va clavado en la tierra; lo único que se mueve es la animación de cosecha.
Comprobado: 25 cultivos en pantalla y el desplazamiento vertical es 0 en todos.

### La zanahoria es moneda, no va a la caja

Iba a `carrots` del CropBox. Ahora se suma directa al contador del jugador con
`addCarrots()`, que además escribe la variable en el buffer del csave.

**Y salía un fallo de fondo detrás**: el autoguardado llamaba a `applyGeneralVars()`, que
vuelca los campos de la pestaña de variables sobre la partida. Esos campos son un espejo
de cuando se cargó el save, así que **deshacían todo lo que cambiara el juego**: las +250
zanahorias volvían a 16650 un segundo después. No era solo la granja —la hora, los peces
pescados y el resto de variables tenían el mismo problema—. Ahora el formulario solo manda
cuando el guardado lo pide el usuario desde el editor, y tras cosechar se refrescan el HUD
y el campo. Medido: 16650 → 16900 y **sobrevive al autoguardado**.

### La caja muestra el nombre del fruto

Salía "Cultivo #230" porque la caja guarda el id del **fruto** (230 uvas, 223 calabaza) y
se buscaba en el catálogo por el id de la **semilla** (1238, 1230), donde no casaba nada.
Ahora hay un índice inverso y el nombre sale de `items_db`, que ya distingue "Calabaza",
"Calabaza Extraña" y "Calabaza Podrida". Ahora se lee `🍇 Uvas x18`.

### Por qué la CropBox no se queda donde la pongas

**Corregido el 15-09.** La primera conclusión fue equivocada: se leyó `-1,-1` en los cuatro
csave y se dio por hecho que el juego no guardaba la posición. No es así — el nodo del
mueble trae `groupPosition.grid = {x:0, y:0}`, que es justo el 0,0 que se había puesto en
el móvil.

El `-1,-1` lo ponía **nuestro parser**: el id 1301 estaba metido en `SEED_IDS` junto a las
semillas de verdad. Con eso, `parseMap()` la tomaba por semilla, no le encontraba parcela
enlazada y le forzaba `x=-1, y=-1` para que map.js la filtrase. Y de paso `cleanBuggySeeds()`
la habría **borrado del mapa** por el mismo motivo.

Ahora 1301 va por su cuenta (`CROP_BOX_ID`), con su tamaño real de 3×3, fuera de la capa
de muebles normales porque ya la dibuja `_drawCropBoxFixture`. La caja aparece donde la
partida dice: abajo, entre los postes de la valla, como en el juego.

El `logic.cropbox` de [map_6.json](../data/maps/map_6.json) se queda como red de seguridad
para un save que de verdad no traiga posición.

### "Sin textura" ahora se puede forzar

Al poner g0 "sin textura" en el editor seguía saliendo con suelo en modo play. No era un
fallo: `getSurfaceCoveringId()` mira **primero el csave** y solo cae a `defaultCoverId` si
la partida no trae nada para ese grupo. El propio editor lo avisaba con "Usando csave". El
desplegable vacío solo ponía un valor de reserva, y no había forma de decir "esta
superficie va pelada".

Ahora el desplegable tiene dos estados distintos:

| Opción | `defaultCoverId` | Efecto |
|---|---|---|
| (Sin asignar — manda el csave) | ausente | como antes: gana la partida |
| ⛔ Forzar sin textura | `0` | pelada, ignora el csave |
| un id del catálogo | ese id | se usa si el csave no trae nada |

El `0` es seguro como centinela: ninguna de las 69 superficies lo usaba y los ids válidos
son siempre `> 0`. Hubo que cambiar cuatro `|| null` por `?? null` al serializar, porque
si no el `0` se perdía al guardar.

**De dónde salía el azul de la granja:** el csave *sí* trae suelo para la ubicación 6
—`{key: 1421158723, id: 69}`—, no venía transparente. `getSurfaceCoveringId()` no encuentra
ese `key` entre los grupos, así que cae al emparejado por posición (`fList[groupNum]`) y le
endosa el 69 a `floor_0`. Ya está puesto `defaultCoverId: 0` en `floor_0` de
[map_6.json](../data/maps/map_6.json), y el campo grande queda pelado.

Dos cosas que conviene saber al tocar esto:

- **La capa que se hornea lee `window.mapsAtlas`, no `MapDef`.** Son objetos distintos
  aunque el contenido salga del mismo `map_<id>.json` (se cargan con un `fetch` al primer
  bake). Cambiar solo uno de los dos en la consola no se ve en pantalla.
### El g3 de la granja no está mal: es el único real

Se preguntó por qué la granja tiene un piso g3 con el id 69. La partida lo confirma:

| Ubicación | Pisos en el csave | Paredes en el csave |
|---|---|---|
| 0 · Casa del Árbol | 2 → `750, 750` | 4 → `762, 418, 2127, 2127` |
| 6 · Granja | **1 → `69`** | **2 → `752, 418`** |

La granja tiene **un solo grupo decorable**, el cobertizo, y es justo g3: su suelo es el 69
y sus dos paredes el 418 y el 752. Los valores de `map_6.json` coinciden uno a uno con el
csave. g0 (el campo), g2 y g4 son superficies que modelamos nosotros y que el juego no
respalda con ningún revestimiento.

**Lo que sí estaba mal era el emparejado.** `getSurfaceCoveringId()` buscaba la entrada del
csave por `anchorID`, pero **ninguna superficie tenía `anchorID`**, así que caía a
emparejar por índice: `fList[groupNum]`. Para g0 eso es `fList[0]`, o sea la única entrada
que hay… la del cobertizo. De ahí que el campo entero saliera con el suelo del cobertizo.

Y había un segundo efecto: como el `defaultCoverId` de g3 era un número fijo copiado de una
partida concreta, el cobertizo se quedaba en el 69 aunque el jugador cambiara el suelo.

Arreglado en tres sitios:

1. `map_6.json` lleva ya los `anchorID` reales del csave (`1421158723` el suelo,
   `-1979330218` y `773467785` las paredes).
2. `map.js` empareja por ancla y **deja de adivinar por índice en los mapas que declaran
   anclas**. El respaldo `69 / 750` de los suelos queda acotado a la Casa del Árbol, como
   ya lo estaba el de las paredes.
3. El editor **perdía el `anchorID`** al cargar y al guardar, así que un "Guardar (POST)"
   habría borrado el arreglo. Ahora lo conserva en las dos rutas de cada lado.

Comprobado: la granja da `g3 → 69`, `g0/g2/g4 → sin textura`, paredes `418/752`; y si se
cambia el suelo en la partida, g3 lo sigue (`69 → 762`) mientras g0 se queda pelado. La
Casa del Árbol no se mueve: `750, 762, 2127, 750, 418, 2127`.

Queda pendiente lo mismo para la Casa del Árbol: `scripts/generate_all_maps.py` tiene sus
seis `anchorID` reales, pero `map_0.json` los perdió. Hoy funciona porque la rama de
paredes de ese mapa tiene el orden de Unity escrito a mano y sus dos suelos son el mismo
id.

### Tocar un nodo ya no tira la rejilla

Al soltar el ratón sobre un vértice —**aunque no lo movieras**— se recalculaban `rows` y
`cols`. Y el cálculo mezclaba unidades: dividía el ancho del polígono (unidades de mundo)
entre el tamaño de celda (píxeles), así que el suelo de la granja (bbox 13×6,5 con celda
56) daba `ceil(13/56)` = **1 columna** en vez de 26.

Dos arreglos: solo recalcula si el vértice llegó a moverse, y la conversión pasa por el
PPU usando la celda de rejilla del juego (75×37,5, el mismo criterio que el exportador) en
vez de la celda del tileset. Con la fórmula nueva el suelo de la granja da 26×26 exacto,
que es justo lo que tenía guardado. Comprobado: un clic simple lo deja en 26×26 y
arrastrar un poco el nodo lo lleva a 25×26, no a 1×1.

## Comandos

```bash
python tools/extract_crops.py             # exporta e indexa
python tools/extract_crops.py --dry-run   # solo informe
python tools/extract_crops.py --force     # reescribe los PNG existentes
```

Tras exportar sprites nuevos hay que reiniciar `server.py`: el catálogo de visuales se
cachea en memoria al primer uso.
