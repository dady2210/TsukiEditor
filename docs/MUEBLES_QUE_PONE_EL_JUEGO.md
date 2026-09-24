# Los muebles que el juego pone solo

Pregunta de partida: en el Ayuntamiento se ven bancos, el escritorio de Benny, una
máquina de gacha y cuadros en la pared, pero el editor no los carga. ¿Quién les dice
que salgan ahí?

## Lo primero: no están en el csave

Parseado `save (42).csave` (el de la captura, 17 110 zanahorias) con nuestro propio
`parser.js`:

```
muebles totales: 137
sublocations con muebles: 0(10) 2(35) 3(27) 6(61) train_vagon_3(4)
sublocation 8 → 0 muebles
```

**Cero.** El save no tiene ni un mueble en el Ayuntamiento. Tampoco están en el nivel
de Unity: `level8_Ensamblado.png` es la sala vacía, y los 77 `SpriteRenderer` del
`level8` son flores, rocas, árboles y el edificio.

## Dónde están de verdad

En un ScriptableObject del juego, **`LocationManager`** (`sharedassets1.assets`,
pathID 1784). Su campo `sublocations` es un `Sublocation[]` con las 35 zonas del
juego, y cada una lleva su mobiliario:

```
LocationManager
  Sublocation[] sublocations                   ← 35
    int    sublocationID                       ← el id de mapa
    StringT LocalizedName
    FurniturePlacement[] defaultFurniture      ← A. semilla de partida nueva
    SublocationData[] data
      LayoutData layoutData
        PlacementLayout defaultLayout          ← B. capa fija, en cada carga
          LayoutPlacement[]     furniture       (canOverride: si se puede tocar)
          WallLayoutPlacement[] wallFurniture
        ConditionalLayout[] conditionalLayouts ← C. festivales y eventos
```

### Son dos mecanismos distintos, y esa es la clave

| | `defaultFurniture` | `defaultLayout` |
|---|---|---|
| Cuándo actúa | al empezar partida | en **cada** carga |
| ¿Va al csave? | sí, se copia | **no**, nunca |
| Quién lo usa | Casa, Granja, Casa de Chi, Casa de Moca | Ayuntamiento, tiendas, Casa de Té |
| ¿El jugador lo mueve? | sí, es suyo desde el minuto uno | solo si `canOverride` |

Eso explica exactamente lo que se veía: el Ayuntamiento usa **B**, así que el save
está vacío y aun así la sala sale amueblada. La Granja usa **A**, así que sus 25
parcelas con semillas sí viven en el save (61 muebles en la sublocation 6).

`LayoutData.GetPlacements(savedPlacements)` es quien funde las dos listas al cargar, y
`PlacementLayout.IsBlocked(placement, save)` decide si una pieza del layout se oculta
porque el jugador puso algo encima.

## Cómo se leyó

El campo `sublocations` es `[SerializeReference]`, así que los objetos reales no están
en su sitio: viven en el **ManagedReferencesRegistry** al final del MonoBehaviour, cada
uno con su `rid` y su nombre de clase. Y como el juego es IL2CPP, ese asset **no trae
typetree**, de modo que UnityPy no puede leerlo (`Expected to read 126088 bytes, but
only read 48`).

Se parsea a mano, con los tamaños sacados de `Dump_v39/dump.cs`. Reglas de Unity que
hacían falta:

- `int` / `float` / `enum` → 4 bytes
- `bool` → **1 byte + alineación a 4** (esto es lo que costó ver: cuatro `bool`
  seguidos ocupan 16 bytes, no 4)
- `string` → longitud + bytes + alineación
- `[SerializeReference]` → un `SInt64` con el rid

De ahí salen los tamaños fijos: `FurniturePlacement` 48 bytes, `LayoutPlacement` 52,
`WallPlacement` 52, `WallLayoutPlacement` 56, `GridPointer` 16, `CameraBoundary` 24.

**El parser exige consumir exactamente los bytes de cada entrada.** Las 35 cuadran al
byte, 0 descuadradas — que es la prueba de que el layout es el correcto y no una
coincidencia.

```
python tools/extract_default_layouts.py     → data/default_layouts.json
python tools/render_layout_check.py --only 8
```

## El Ayuntamiento, pieza a pieza

22 en el layout fijo + 4 de pared + 4 condicionales:

| id | mueble | dónde | ¿movible? |
|---|---|---|---|
| 179 ×4 | Silla Plegable | g0 (2,20) (4,20) (0,13) (2,13) | sí |
| 21 ×4 | Banca de Parque | g0 (2,0) (2,6) (6,6) (6,0) | sí |
| 354 | Dispensador de Agua | g0 (0,20) | sí |
| 352 ×2 | Revistero | g0 (6,20) (4,13) | sí |
| 218 | Jardinera Rayada | g0 (12,10) | sí |
| 239 | Helecho Nido de Pájaro | encima de la jardinera | sí |
| 351 | Archivador | g0 (12,20) | **fijo** |
| 355 | Escritorio de Plástico | g0 (8,16) | **fijo** |
| 19 | Silla de Caoba | g0 (10,17) | **fijo** |
| 353 | Mini Mesa | g0 (8,20) | **fijo** |
| 46 | Impresora Oficinil | g0 (10,20) | **fijo** |
| 384 | Portapapeles | encima del escritorio | **fijo** |
| 340 | Búsqueda de Pluma | encima del escritorio, celda (2,0) | **fijo** |
| 406 | Reproductor de Casetes | encima de la mini mesa | **fijo** |
| **344** | **GachaBoy** | g0 (12,12) | **fijo** |
| 334 | Póster de Mascota | pared g0 volteada (9,2) | sí |
| 333 | Póster de la Armonía | pared g0 (14,4) | sí |
| 398 ×2 | Lámpara de pared de madera | pared g0 (13,4) (18,4) | sí |
| 1348 ×3 | Marco de Grulla de Papel | g1, condicional | **fijo** |
| 830 | Silla Festiva | g0 (10,17), condicional | **fijo** |

Las dos últimas filas son `conditionalLayouts`: decoración de festival que sustituye
piezas del layout normal (la Silla Festiva ocupa la misma celda que la Silla de Caoba).

Comprobación visual: `scratch/layout_check/map_8_layout.png` dibuja las 26 piezas sobre
el fondo ensamblado y caen justo donde salen en la captura del móvil — bancos en el
centro, sillas plegables a la izquierda, el escritorio al fondo y la gacha junto a la
planta. **0 fuera del fondo.**

## El resto de mapas

| mapa | semilla | layout | pared | condicional |
|---|---|---|---|---|
| 0 · Casa del Árbol | 7 | — | — | — |
| 1 · Tienda de Yori | — | 7 | — | — |
| 2 · Casa de Chi | 25 | — | — | — |
| 3 · Casa de Moca | 22 | — | — | — |
| 5 · Tienda de Rosemary | — | 3 | 1 | — |
| 6 · Granja | 50 | — | — | — |
| 8 · Ayuntamiento | — | 22 | 4 | 4 |
| 9 · Casa de Té de Momo | — | 20 | — | 15 |
| 11 · Taller de Dawn | — | 5 | 3 | — |

Y fuera del alcance del editor: Estación de Tren (15), The Raven (14), Scarlett's
Lounge (14), Hotel Cápsula (7), Heladería (8), Joyería (6), Oficina de Correos (5),
Bodega (4), Ayuntamiento de Ciudad (3), Centro Comercial (2).

La semilla de la Granja confirma de paso lo que dedujimos en [PARCELAS.md](PARCELAS.md):
25 parcelas (id 306) en celdas impares espaciadas de dos en dos — (7,7), (7,9), (9,7)…
hasta (17,17) — cada una con sus Semillas de Zanahoria (id 342) encima vía
`SubGroupPosition`.

## El tamaño exacto de cada piso

Sí se puede saber, y no era 16×16. Cada piso es un `GridGroup`, y su tamaño está en
`EditableGroup`, dos campos antes de los que ya leíamos:

```
GridGroup : FixedGroup : EditableGroup : BaseGroup
    [Range(1, 60)] public int width;      ← celdas en X
    [Range(1, 60)] public int height;     ← celdas en Y
    public Vector3 offset;                ← origen de la rejilla
```

Ahí mismo viene `blankGrid`: las celdas que son hueco (el escenario de madera del
Ayuntamiento, por ejemplo) y donde no se puede poner nada.

**Qué eje es cuál.** `cols` es `width` y `rows` es `height`, comprobado dos veces:

- contra las 193 colocaciones que hace el propio juego → **192 encajan** con
  `x < width, y < height`, y solo 149 al revés;
- contra los muebles del `.csave` del jugador → **13 grupos de 13**, mientras que al
  revés fallan 5.

La pista que lo desempató fue la casa de la granja (g3, 11×7): su mueble más lejano
está en x=8, que no cabe en una rejilla de 7 de ancho. Ese piso tenía los ejes
cambiados en nuestros datos.

| mapa | pisos, en celdas |
|---|---|
| 0 · Casa del Árbol | g0 16×16, g1 14×14, g2 25×28, g3 31×27, g4 1×1 |
| 1 · Tienda de Yori | g0 15×20, g1 11×11, g2 6×15, g3 14×7, g4 4×3, g5 4×8 |
| 2 · Casa de Chi | g0 14×28, g1 8×12, g2 22×14 |
| 3 · Casa de Moca | g0 12×25, g1 10×10, g2 12×8, g3 10×21, g4 15×7 |
| 4 · Muelle | g0 7×16, g1 37×12, g2 15×2 |
| 5 · Tienda de Rosemary | g0 10×8, g1 2×2, g2 8×2, g3 1×1, g4 4×10, g5 16×3 |
| 6 · Granja | g0 26×26, g1 8×13, g2 10×10, g3 11×7, g4 11×14 |
| **8 · Ayuntamiento** | **g0 14×22, g1 17×23** |
| 9 · Casa de Té de Momo | g0 8×12, g1 17×12, g2 1×6, g3 12×16, g4 6×6 |
| 11 · Taller de Dawn | g0 10×10, g1 1×2, g2 10×35 |

De los 103 grupos del juego, **102 tienen todas sus celdas huecas dentro de su propio
tamaño** — la comprobación que confirma que el parseo es correcto. El que falla es un
grupo de la Bodega, fuera del alcance del editor.

`tools/apply_grid_sizes.py` mete esto en los `map_*.json`: corrigió 23 pisos.

### Las paredes también

`EditableGroup.width/height` es el piso. Las paredes salen de ahí, más los dos enteros
`[HideInInspector]` de `FixedGroup` que respaldan la propiedad `WallSizes`:

```
public int wallGroup;    ← altura de la pared derecha  (0 = no existe)
public int wallGroupF;   ← altura de la pared izquierda
```

Las dos paredes **nacen en la misma esquina**, la de atrás del piso —la celda
`(width, height)`— y bajan cada una por un lado. Se deduce de `getWallIsoCoords()`:
la derecha avanza `(+0.25, −0.125)` por celda, que es recorrer el eje Y del piso; la
izquierda `(−0.25, −0.125)`, el eje X. De ahí:

| | largo | alto | origen |
|---|---|---|---|
| Pared derecha (`flipped: false`) | `height` del piso | `wallGroup` | esquina `(width, height)` |
| Pared izquierda (`flipped: true`) | `width` del piso | `wallGroupF` | la misma |

**Comprobado contra los 17 grupos que tienen muebles de pared reales** (del csave del
jugador y del layout del juego): los 17 caben. Los casos que lo demuestran:

- Casa de Chi g0, pared derecha: hay un mueble en x=24. El piso es 14×28, así que esa
  pared solo puede medir 28, no 14.
- Ayuntamiento g0, pared derecha: mueble en x=18, con piso 14×22 → mide 22.
- Casa de Chi g1 y Casa de Moca g2 tienen `wallGroupF = 0`, y en efecto **no hay ni un
  mueble en su pared izquierda**. Lo mismo al revés en Scarlett's Lounge g1, con
  `wallGroup = 0` y ningún mueble en la derecha.

El Ayuntamiento tenía `wall_0_R` declarada como **1×1**; ahora es 22×8 y la izquierda
14×7. Por eso los pósters salían desfasados. **15 paredes corregidas** y 10 orígenes.

Cuando el juego dice que una pared no existe (altura 0) **no se toca su tamaño**: puede
haber un revestimiento pintado ahí y encogerlo sería peor. Solo se marca
`wallExists: false`.

### Y de paso, el origen

El `offset` del `GridGroup` también es el origen bueno de la rejilla. Comparado con el
nuestro: los pisos de la Casa del Árbol y de la Granja estaban ajustados a mano y
caían dentro de un cuarto de celda, pero el resto iba desviado — algunos con el
placeholder `(2.5, 1.5)`. El Ayuntamiento estaba a 1.75 unidades, y con el offset del
juego la rejilla encaja con el contorno de la sala al píxel.

La herramienta solo lo toca cuando la desviación pasa de media celda, y **desplaza el
contorno en sentido contrario** para que la geometría dibujada no se mueva. Se
corrigieron 21 orígenes; los de la Casa del Árbol y la Granja se quedaron como estaban.

## En el editor

Ya se ven, tanto en modo play como en los dos editores.

- `default_layouts.js` convierte el layout en placements normales y el motor los
  dibuja sin enterarse de que no vienen del save.
- No se añade `seedFurniture`: eso ya está en el save y duplicaría, por ejemplo, las
  25 parcelas de la granja.
- Una pieza del layout desaparece si el jugador tiene algo con ese mismo
  `placementID` o en esa misma celda, igual que hace `PlacementLayout.IsBlocked`.
- Los festivales (`conditionalLayouts`) están apagados; se encienden con
  `DefaultLayouts.showConditional = true`.

**`canOverride` se edita** desde el panel del mueble, en los dos editores. También se
puede ocultar una pieza. Todo eso va a `data/layout_overrides.json`, aparte del JSON
generado, para que volver a extraer no lo borre; y **nunca toca el `.csave`**:
`applyMapChange` desvía las piezas de layout antes de tocar el árbol Odin.

## Lo que queda cojo

- En la Casa de Té de Momo y el Taller de Dawn solo se dibujan las piezas cuyos pisos
  existen ya como superficie (7 de 20 y 6 de 8). Faltan polígonos por trazar, que es
  lo que ya sabíamos de [ZONAS_DECORABLES.md](ZONAS_DECORABLES.md).
## Los cinco muebles sueltos del Ayuntamiento (resueltos)

En `map_8.json` había cinco entradas de `visuals` que se dibujaban fuera de la sala:
Escritorio del Alcalde (1934), Silla Alta de Oficina (1933), Computadora (1870),
Pluma de Benny (341) e Impresora (46).

**No vienen del juego.** Tres comprobaciones:

1. **No están en `level8`.** Volqué sus 147 GameObjects con sus posiciones de mundo:
   ninguno se llama así. Los cinco nombres existen, pero como **prefabs de mueble** en
   `furniture_assets_all_*.bundle`, que es de dónde salen los muebles normales.
2. **Solo el mapa 8 los tiene.** Ningún otro `map_*.json` trae visuales `FURN_`/`ITEM_`.
3. **Ningún script del repo los genera.** Los únicos sitios que mencionan el 1934 son
   bases de datos de objetos.

Así que se metieron a mano en una sesión anterior, probablemente para dibujar el
escritorio de Benny antes de saber que el juego lo coloca solo. Y es un duplicado: el
layout de la sublocation 8 ya pone Escritorio de Plástico (355), Silla de Caoba (19),
Portapapeles (384), Búsqueda de Pluma (340), Mini Mesa (353), Reproductor de Casetes
(406), Archivador (351) e Impresora (46), todos en su celda.

Quitados. Queda constancia en `notes.removedManualFurniture` dentro del propio
`map_8.json`, por si hiciera falta recuperarlos.

**El escenario con el micrófono sí es del nivel** y se queda: es
`SceneData/Pedestal/DreamHouse_Environment_TownHall_Final_16`, un SpriteRenderer de
`level8` en (−16.22, 14.09). La diferencia es esa: los sprites `DreamHouse_*` son
geometría de la escena; los `FURN_*` son muebles y no tienen por qué estar ahí.

### Y de paso apareció otro, este sí de verdad

Al comparar objeto por objeto salió que `HomeUpgrade`
(`DreamHouse_Environment_TownHall_Final_19`) estaba en **(1.18, −2.55)** cuando el
nivel lo pone en **(1.18, +2.55)**: la y invertida. Por eso se veía tumbado fuera de
la sala. Corregido.

De ahí salió `tools/check_visual_positions.py`, que contrasta **todos** los `visuals`
de cada mapa con la posición real de su GameObject en el nivel de Unity. Empareja por
nombre y detecta signo invertido, descuadre y visuales cuyo objeto ni siquiera existe
en el nivel. Tras la corrección:

```
mapa 0  (level2)  cuadran=75    mapa 5  (level11) cuadran=81
mapa 1  (level3)  cuadran=103   mapa 6  (level4)  cuadran=101
mapa 2  (level6)  cuadran=68    mapa 8  (level8)  cuadran=74
mapa 3  (level7)  cuadran=61    mapa 9  (level10) cuadran=96
mapa 4  (level5)  cuadran=71    mapa 11 (level12) cuadran=124

total: 854 cuadran, 0 invertidos, 0 descuadrados, 0 ajenos
```

Los niveles 2, 6, 7 y 11 no traen un `SceneData` del que sacar el origen; ahí se
deduce del desfase que más se repite, y con eso encajan igual.

Queda una cosa menor sin tocar: `logic.interactive_props.benny_pen` de `map_8.json`
tiene la misma coordenada mala, (1.45, −2.55). **No se dibuja** (no tiene `sprite` ni
`anim`, así que `_drawMapInteractiveProps` lo descarta) y duplica la Búsqueda de Pluma
(340) que el layout ya pone en su celda, así que se ha dejado como está.

## Lo que queda cojo

## Ficheros

- `tools/extract_default_layouts.py` — lee el LocationManager y escribe el JSON
- `tools/apply_grid_sizes.py` — mete tamaños y orígenes reales (pisos y paredes)
- `tools/render_layout_check.py` — comprobación visual sobre el fondo ensamblado
- `tools/check_visual_positions.py` — contrasta los `visuals` con el nivel de Unity
- `data/default_layouts.json` — las 35 sublocations, su mobiliario y sus rejillas
- `data/layout_overrides.json` — los retoques hechos desde el editor
- `default_layouts.js` — el puente con el motor
