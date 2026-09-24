# Parcelas de la granja: auto-tiling, sombra y burbujas

Trabajo del 15-09-2026.

## Cómo consigue el juego que no se vean las juntas

No es un truco de dibujo ni un asset especial: **es auto-tiling, y la tabla viene en el
propio prefab**. El `Plot` (ID 306) del bundle de muebles lleva una lista `states` con
**47 entradas**, cada una con una condición sobre los 8 vecinos y el sprite que le toca:

```json
{"check": {"TL":1,"T":1,"TR":1,"L":1,"R":1,"BL":1,"B":1,"BR":1}, "sprite": "FarmPlots_46"}
```

Los valores del `check` son:

| | |
|---|---|
| `0` | ahí **no** puede haber parcela |
| `1` | ahí **tiene** que haber parcela |
| `2` | da igual |

Se recorren en orden y gana la primera que encaje. `FarmPlots_46` (todo a 1) es la pieza
interior, sin bordes; `FarmPlots_0` (todo a 0) es la parcela suelta con el borde completo.
Los 45 restantes son cada combinación intermedia. Por eso dos parcelas contiguas se ven
como un solo bancal: la pieza que se dibuja ya viene sin el borde de ese lado.

Los sprites salen con `python tools/extract_plots.py` → `images/plots/FarmPlots_0..46.png`
y `data/plots_autotile.json` con la tabla, el pivot y el tamaño de cada uno.

### T/R/B/L son las aristas, TL/TR/BR/BL los vértices

Aquí estuvo el error que costó dos intentos. `T`, `R`, `B` y `L` son las cuatro **aristas**
del rombo —las que comparten lado con otra parcela y a las que hay que quitarles el
borde—; `TL`, `TR`, `BR` y `BL` son los cuatro **vértices**, que solo se tocan en una
esquina. Tomando los vértices por aristas, las parcelas del interior recibían el sprite de
parcela suelta: el campo salía cortado y con aspecto de parcelas duplicadas una sobre otra.

Además las direcciones van en **pantalla**, no en la rejilla, y en esta proyección `+x` va
arriba-derecha y `+y` arriba-izquierda. Con una parcela ocupando 2×2 celdas:

| | arista | | vértice |
|---|---|---|---|
| `T` arriba-izq | `(0, +2)` | `TL` izquierda | `(−2, +2)` |
| `R` arriba-der | `(+2, 0)` | `TR` arriba | `(+2, +2)` |
| `B` abajo-der | `(0, −2)` | `BR` derecha | `(+2, −2)` |
| `L` abajo-izq | `(−2, 0)` | `BL` abajo | `(−2, −2)` |

Se resolvió probando las **ocho orientaciones posibles** (cuatro giros × espejo) sobre el
campo de la partida: con las aristas bien puestas ninguna parcela queda suelta (antes 7 de
25 recibían `FarmPlots_0`), y solo una de las ocho hace que el borde siga el contorno.

### Y el abanico de objetos co-locados las separaba de su propio cultivo

Con lo anterior arreglado el bancal **seguía viéndose doble**. La causa era otra y estaba
lejos: `_getPlacementRenderOffset()` separa en abanico los muebles que comparten casilla,
para que en el editor se vean los dos. Cada parcela tiene su semilla en la misma casilla,
así que el abanico desplazaba un cuarto de casilla **la parcela hacia un lado y su cultivo
hacia el otro** — justo el aspecto de dos capas superpuestas.

La semilla enlazada ni siquiera se dibuja por su cuenta (la pinta `_drawCropOnPlot` encima
de la parcela), así que ahora no cuenta como «otro objeto en la celda». Comprobado
superponiendo la rejilla real: los 25 desplazamientos son 0 y cada rombo encaja con su
ficha, con el brote en el centro.

### Y encima seguía dibujándose el sprite suelto

Lo que de verdad se veía duplicado: `_drawPlacement()` pinta, para **todo** mueble, su
sprite de item con `getImage(item_id)`. Para la parcela eso es `FURN_306.png`, la parcela
suelta con su borde completo. Así que se dibujaban las dos cosas, una encima de otra: el
bancal unido del auto-tiling y, encima, la retícula de parcelas separadas de siempre.

Ahora, cuando hay pieza de auto-tiling no se pinta el sprite del item (ni la etiqueta de
respaldo con el nombre): son la misma parcela.

### El pivot no está en el centro del rombo

Está 29 px por debajo (medido sobre `FarmPlots_46`, la pieza limpia: su fila más ancha —el
eje del rombo— cae en y=39 y el pivot en y=68). Como los 47 comparten anclaje, basta con
una corrección constante: encajan entre sí solos y eso únicamente centra el conjunto en su
casilla. Es la constante `PLOT_PIVOT_DY` de [map.js](../map.js).

El sprite se elige por fotograma, así que al poner o quitar una parcela las de alrededor
cambian de pieza y el borde las sigue.

## La sombra debajo de las parcelas

Era el *footprint* del editor colándose en el modo juego: el rombo de color más una elipse
negra al 25 % que `_drawPlacement` pinta bajo cada mueble. La regla que lo ocultaba en modo
juego (`hideBox`) excluía expresamente la capa `ground`, así que las parcelas lo llevaban
siempre.

Ahora, en cuanto hay sprite de parcela no se pinta ni el rombo ni la sombra. En el editor
se conserva el contorno cuando la parcela está seleccionada o señalada, que si no no se
sabe cuál es.

## La burbuja flotante

Cada parcela madura llevaba encima una burbuja blanca con el icono del cultivo, subiendo y
bajando con un `Math.sin(Date.now())`. Era invención nuestra —el juego no la tiene— y con
la granja llena la pantalla se llenaba de globos. Fuera.

En su lugar, al apuntar una parcela con el ratón sale una línea de texto con su estado:
el porcentaje y los minutos que faltan, `listo`, o `podrido`.

## Cosechar pinchando el cultivo

El acierto del ratón se hacía contra el rombo de la parcela, pero el cultivo se dibuja
**encima** y sobresale mucho por arriba (su lienzo mide 98×264). Al pinchar la zanahoria el
clic caía fuera y no pasaba nada.

Añadir la caja del cultivo como zona sensible no bastó, por dos motivos:

- Ese lienzo es **casi todo transparente**, así que una caja entera robaba clics de medio
  campo. Ahora se mira la **opacidad del píxel** del sprite: solo cuenta si hay dibujo.
- Con la misma prioridad que la tierra, el desempate `(x+y)` se lo llevaba **la parcela de
  detrás**, que en esta proyección queda más arriba justo donde asoma la zanahoria. Acertar
  el dibujo de un cultivo ahora puntúa por encima de cualquier tierra, y entre dos cultivos
  gana el de delante.

Comprobado recorriendo el sprite: de 22 puntos opacos probados, los 22 aciertan su parcela.

## El resplandor, solo al apuntar

Los cultivos maduros llevaban un halo naranja **encendido siempre**, en toda la granja a la
vez. Ahora sale únicamente al pasar el ratón por encima, que es cuando sirve de algo:
indica que ese se puede cosechar.

Para eso hubo que activar el hover en modo juego, donde estaba desactivado (es una cosa del
editor). Se admite **solo para parcelas plantadas**, así que nada más cambia, y el rótulo
de editor con el id y las coordenadas se oculta en juego.

## Comandos

```bash
python tools/extract_plots.py           # 47 PNG + data/plots_autotile.json
python tools/extract_plots.py --force   # reescribe los PNG
```
