# Rendimiento: zoom, dibujado y arranque

Trabajo del 15-09-2026. Objetivo: que funcione en ordenador de gama media-baja y móvil
de gama media.

## 1. Tope de alejamiento en todos los mapas

`_clampCamera()` empezaba con `if (targetLoc !== 0) return;`, así que **solo la Casa del
Árbol tenía límite**. En el resto se podía alejar sin fin (`scale` hasta 0.1), y cada
repintado cubría muchísima más superficie.

Además buscaba el fondo recorriendo la caché a por la primera entrada cuyo nombre
contuviera `level`, que podía ser la de otro mapa. Ahora hay un `backgroundPathFor(loc)`
que resuelve la ruta del mapa actual, y lo usan tanto el límite como el dibujado —
importa que sea **la misma cadena**, porque `getBackgroundImage()` cachea por ruta y dos
formas de nombrar el mismo PNG lo descargarían dos veces.

| | mínimo antes | mínimo ahora | máximo |
|---|---|---|---|
| 0 · Casa del Árbol | 0.55 | 0.55 | 0.71 |
| 6 · Granja | 0.10 | **0.51** | 1.54 |
| 8 · Ayuntamiento | 0.10 | **0.53** | 1.58 |
| 2 · Casa de Chi | 0.10 | **0.52** | 1.57 |

El mínimo es «que el mapa entero quepa, con un 15 % de margen». La Casa del Árbol conserva
su rango estrecho de siempre; los demás mapas son mayores y sí dejan acercarse (hasta 3× el
mínimo) para poder trabajar en ellos.

## 2. El fondo se rehorneaba entero en cada fotograma

Esto era, de largo, lo más caro. El fondo de cada mapa se «hornea» una vez en un lienzo
aparte (unos 2500×2500 px) y luego solo se vuelca. El horneado se da por bueno guardando su
clave… **pero solo si `allLoaded` sigue siendo cierto**:

```js
this._bakedBgCanvas = tempBaked;
if (allLoaded) this._bakedBgKey = bakeKey;
```

Y `_getMaskByName()` tenía esto:

```js
img.onerror = () => { this._imgCache[cacheKey] = false; };   // false = "aún cargando"
```

Cuando la máscara **no existe** —y la mayoría de los mapas no tienen máscaras— quedaba
marcada como «cargando» para siempre. `allLoaded` no volvía a ser cierto, la clave nunca se
guardaba y **se rehorneaba el lienzo de 2500×2500 en cada repintado, indefinidamente**.

Arreglado: `null` significa «no existe» y `false` «aún cargando». Lo mismo para los
revestimientos que devuelven `{error:true}`.

Medido con un dibujado aislado entre `rAF` (mediana de 40):

| Mapa | antes | ahora |
|---|---|---|
| 6 · Granja | 136.5 ms | **44–47 ms** |
| 8 · Ayuntamiento | 127.6 ms | **34–35 ms** |
| 0 · Casa del Árbol | 34.2 ms | 34 ms (ya estaba bien) |

Y ahora el horneado **se fija**: 0 relienzos en 8 fotogramas, en los cinco mapas probados.

También se volca solo el trozo del fondo que entra en pantalla (`_blitBaked`), en vez de
escalar el lienzo entero.

## 3. Mover la cámara

Un dibujado suelto no cuenta toda la verdad: al panear se repinta la escena entera en cada
fotograma. Medido con el navegador real (AMD Radeon R7, gama modesta), moviendo la cámara:

| Mapa | antes | ahora |
|---|---|---|
| 0 · Casa del Árbol | 6.0 fps | **8.7 fps** |
| 6 · Granja | 9.4 fps | **13.7 fps** |
| 8 · Ayuntamiento | 16.6 fps | **23.9 fps** |

Dos cosas más, aparte del rehorneado:

- **`querySelector` una vez por objeto y fotograma.** `_drawPlacement()` empezaba con
  `document.querySelector('input[name="map-layer"]:checked')`. Con los ~6700 nodos de la
  página eso cuesta 0,34 ms **cada llamada**: con 30 muebles, 10 ms de fotograma tirados en
  buscar un radio que no cambia mientras se dibuja. Ahora se resuelve una vez por
  repintado (`_layerRadio()`).
- **Las capas de escenario se volcaban enteras.** `PlayScenery.drawLayer()` escalaba el
  lienzo horneado completo de cada capa (far/mid/near). Ahora recorta al área visible,
  igual que el fondo. En la Casa del Árbol el escenario era *todo* el coste: sin él pasaba
  de 8,7 a 24,6 fps.

### Y el cambio de fondo: no reconstruir la escena al panear

Aun así quedaba el techo de verdad: se repintaba **toda la escena** en cada fotograma del
arrastre, cuando lo único que cambia es desde dónde se mira.

Ahora, **mientras se arrastra la cámara**, la escena se dibuja una vez en un lienzo con
margen alrededor y los fotogramas siguientes son un solo `drawImage` desplazado. Cuando el
arrastre se sale del margen se vuelve a capturar; al soltar, la copia se tira y se dibuja
normal.

`_drawImmediate()` pasó a ser un despachador de tres líneas y el cuerpo de siempre es ahora
`_drawScene()`, así que nada del dibujado cambió: solo **cuándo** se llama.

| Mapa | antes | ahora | JS por fotograma |
|---|---|---|---|
| 0 · Casa del Árbol | 8.7 fps | **60 fps** (tope de pantalla) | 63 ms → **0.3 ms** |
| 6 · Granja | 13.7 fps | **35 fps** | 42 ms → **0.5 ms** |
| 8 · Ayuntamiento | 23.9 fps | **38 fps** | 36 ms → **0.4 ms** |

En 136 fotogramas de arrastre solo hubo **2 capturas**.

Detalles que hubo que cuidar para no romper nada:

- **Se ve idéntico.** Comparado píxel a píxel contra un dibujado real tras desplazar 150 px:
  la diferencia media es menor de 1/255 y lo único que cambia son los avisos HTML que
  aparecen entre capturas. El lienzo es el mismo.
- **Las luces y la UI flotante no van en la copia.** Los halos se pintan en su propio lienzo
  y el panel del editor es DOM: los dos se refrescan en el volcado, con la cámara de verdad,
  no en la pasada a la copia (que trabaja con el desplazamiento corrido por el margen).
- **La copia no se usa arrastrando un mueble ni la rejilla**, solo moviendo la cámara.
- **Al soltar se fuerza un repintado** (ratón, salir del lienzo y dedo), o se quedaría la
  copia en pantalla con los personajes congelados.

Efecto secundario aceptado: los personajes y las animaciones se quedan quietos mientras
arrastras. Vuelven al soltar.

## 4. Arranque: 19.9 MB → 6.6 MB

| Qué | Antes | Ahora |
|---|---|---|
| **Diálogos** (`dialogues_compact.json`) | 3.1 MB al arrancar | 0 — se piden al hablar con alguien |
| `items_db.json` | 1619 KB | **261 KB** (gzip) |
| `npcs.js` | 536 KB | **62 KB** |
| `map.js` | 263 KB | **58 KB** |
| `index.html` | 151 KB | **28 KB** |
| `map_6.json` | descargado **dos veces** | una |

- **Diálogos en carga perezosa.** `startDialogue()` ya sabía cargarlos si faltaban, solo
  sobraba la llamada anticipada en `init()`. Se añadió una salvaguarda: si la descarga
  falla, se deja `{}` para que no reintente en bucle.
- **El servidor comprime.** `server.py` sirve `.json/.js/.html/.css/.svg/.txt` con gzip
  cuando el navegador lo acepta, con caché en memoria por fecha de modificación. Los PNG no
  se tocan: ya vienen comprimidos.
- **Un solo cargador para el JSON del mapa.** map.js tenía su propio `fetch` con
  `?v=Date.now()` además del de `MapDef`; como el parámetro cambiaba, el navegador no podía
  reaprovechar nada y bajaba el fichero dos veces. Ahora pasa por `MapDef`, que ya cachea.

Lo que **no** se tocó, y por qué:

- Los PNG de la Casa del Árbol se descargan al arrancar porque el save dice que el jugador
  está allí (`currentSLocation = 0`). No es desperdicio: es el mapa que se está viendo. Al
  ir a otro mapa se cargan los suyos y no antes.
- Las fuentes de Google (1.2 MB), el MP3 de catbox y las texturas de
  `transparenttextures.com` son externas y quedan fuera de este repaso.

## Comprobado

- Cosecha y resplandor al apuntar: 22 de 22 puntos opacos del cultivo aciertan; 16 650 →
  16 900 al pinchar.
- Editor de mapas: carga el mapa, lista zonas y nombres, sin errores de consola.
- Estaciones, parcelas y auto-tiling: sin cambios.
