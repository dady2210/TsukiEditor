/* play_dialogue_ui.js — el bocadillo de diálogo de verdad, de `level14`.
 *
 * ────────────────────────────────────────────────────────────────────────────
 *  QUE HABIA
 * ────────────────────────────────────────────────────────────────────────────
 * `dialogue_manager.js` dibujaba un panel morado oscuro con `backdrop-filter`, retrato a
 * la izquierda, cabecera con el nombre y dos botones, y una flecha abajo. Nada de eso
 * existe en el juego: **la ventana de diálogo estaba inventada**, y es la que más se ve.
 *
 * La lógica, en cambio, está bien: la máquina de escribir, el avance de líneas, las
 * respuestas, el idioma y el `pester`. Así que aquí **no se reescribe nada de eso**: se
 * mueven los mismos elementos, con sus mismos `id`, dentro de la estructura de verdad y
 * se les pone el arte de la escena. `dialogue_manager` sigue guardando sus referencias
 * (`this.textEl`, `this.nameEl`…) y no se entera.
 *
 * ────────────────────────────────────────────────────────────────────────────
 *  LO QUE ES, DE `data/ui_speechbubble.json` (level14, 13 nodos)
 * ────────────────────────────────────────────────────────────────────────────
 *     DialogueBubble              `SpeechBubble`, anclado abajo al centro
 *       PointerO       50×50      `PrimitiveRoundDiamonds_3` en marrón oscuro
 *       BubbleBacking  160×128    en (−80, 130), pivote (0, 1)
 *         WhiteBacking            `speechBubble` en 9 rebanadas, BLANCO
 *         Image        −16        `speechBubble` en 9 rebanadas, CREMA
 *         Outline                 `speechBubbleOutline` en 9 rebanadas
 *         NameBubble              `roundedRect` marrón oscuro, en (56, −12)
 *           Name       TMP 36     el nombre
 *       PointerMask    32×16      un `Mask` con `Pointer` dentro: el pico
 *       Text           700×0,1    TMP 32, en (−15, 83)
 *
 * Y las constantes del propio `SpeechBubble` cuadran con el volcado, que es la
 * comprobación de que se leyó bien:
 *
 *     TextXMargin  = −15    ->  Text.pos.x
 *     TextYMargin  =  83    ->  Text.pos.y
 *     BubbleXMargin = −80   ->  BubbleBacking.pos.x
 *     BubbleYMargin = 130   ->  BubbleBacking.pos.y
 *     LineHeight   =  40
 *     bubbleMinSize = (160, 128)  ->  BubbleBacking.tam
 *
 * Los tres colores salen de la escena, no de un cuentagotas:
 *     crema del bocadillo  (0,9434  0,93003 0,85885)
 *     marrón del nombre    (0,33333 0,31373 0,28627)
 *     crema de la respuesta(0,94118 0,92941 0,85882)
 *
 * ────────────────────────────────────────────────────────────────────────────
 *  LAS RESPUESTAS, DE `data/ui_choicepopup.json`
 * ────────────────────────────────────────────────────────────────────────────
 *     Dialogue Replies            VerticalLayoutGroup abajo, `maxWidth` 1000
 *       Response       77 de alto `roundedRect` crema, `ButtonPro`
 *         Dashed Line             `PrimitiveShapesDashedO_2` en negro al 11 %, TILED
 *         Response Text  TMP 36
 *         ItemIcon       100×100   a la derecha
 *
 * ────────────────────────────────────────────────────────────────────────────
 *  LO QUE NO SE REPRODUCE, Y SE DICE
 * ────────────────────────────────────────────────────────────────────────────
 * El bocadillo del juego **persigue al personaje**: `SetBubblePosition`, `UpdateBubble` y
 * `FlipBubble` lo mueven y voltean el nombre según dónde caiga en pantalla, y `Disc` son
 * dos mallas de `Shapes`. Aquí se deja en el sitio que trae la escena
 * (`cachedPosition` −555,7 / 163, o sea abajo a la izquierda del centro), porque seguir a
 * un personaje pide saber dónde está dibujado en cada cuadro. El **retrato** del port no
 * existe en el juego: se conserva el elemento —`dialogue_manager` le escribe el `src`—
 * pero no se enseña.
 */
(function (global) {
    'use strict';

    // Los tres colores de la escena.
    const CREMA = 'rgb(241,237,219)';        // 0,9434 0,93003 0,85885
    const MARRON = 'rgb(85,80,73)';          // 0,33333 0,31373 0,28627
    const CREMA_RESPUESTA = 'rgb(240,237,219)';

    // Las constantes de `SpeechBubble`, que cuadran con el volcado.
    const M = {
        textoX: -15, textoY: 83, bocadilloX: -80, bocadilloY: 130,
        altoLinea: 40, minAncho: 160, minAlto: 128, anchoTexto: 700,
        // LOS MARGENES SALEN DE RESTAR, NO DE COPIAR.
        //
        // `BubbleBacking` tiene pivote (0,1) y esta en (-80, 130) con 160x128; `Text`
        // tiene pivote (0,0) y esta en (-15, 83). Los dos cuelgan del mismo punto, asi
        // que el borde de arriba del bocadillo esta en 130 y el texto empieza en 83:
        //
        //     arriba    130 - 83 = 47
        //     izquierda -15 - (-80) = 65
        //     abajo     lo que sobra en el bocadillo MINIMO despues del margen de
        //               arriba y una linea: 128 - 47 - 40 = 41
        //
        // Y por eso el minimo es 128: es exactamente lo que ocupa UNA linea con sus dos
        // margenes. Con dos, el bocadillo crece a 168.
        //
        // Poniendo el 83 como relleno de arriba la caja salia de 153 en vez de 128 y el
        // texto caia pegado al filo de abajo.
        margenArriba: 47, margenIzq: 65, margenAbajo: 41,
        tamTexto: 32, tamNombre: 36, tamRespuesta: 36,
        // `speechBubble` y `speechBubbleOutline` van en 9 rebanadas con borde 76/64.
        borde: { x: 76, y: 64, z: 76, w: 64 },
        bordePildora: 16,
        altoRespuesta: 77, anchoRespuesta: 1000,
    };

    // El juego dibuja en un lienzo mucho más grande que el hueco del port; se encoge todo
    // por igual para no deformar nada.
    const ESC = 0.5;
    const RUTA = 'images/ui/dialogo/';

    let ui = null, uiOpc = null, puesto = false;

    async function cargar() {
        if (ui && uiOpc) return true;
        try {
            const [a, b] = await Promise.all([
                fetch('data/ui_speechbubble.json').then(r => (r.ok ? r.json() : null)),
                fetch('data/ui_choicepopup.json').then(r => (r.ok ? r.json() : null)),
            ]);
            ui = a; uiOpc = b;
        } catch (e) { /* se pinta con las constantes, que son las mismas */ }
        return true;
    }

    function usarDatos(a, b) { ui = a; uiOpc = b; return true; }

    /** El nodo del volcado, para cotejar medidas sin repetirlas a mano. */
    function nodo(doc, ruta) {
        if (!doc || !doc.arbol) return null;
        let hit = null;
        (function anda(n) {
            if (hit) return;
            if (n.ruta === ruta) { hit = n; return; }
            for (const h of n.hijos || []) anda(h);
        })(doc.arbol);
        return hit;
    }

    function px(v) { return Math.round(v * ESC) + 'px'; }

    /**
     * Re-viste la ventana que ya montó `dialogue_manager`: **mueve** sus elementos, no
     * los crea de nuevo, para que sus referencias sigan valiendo.
     */
    function vestir() {
        if (typeof document === 'undefined') return false;
        const capa = document.getElementById('play-dialogue-overlay');
        if (!capa) return false;
        if (capa.dataset.vestido === '1') return true;

        const nombre = document.getElementById('dialogue-speaker-name');
        const texto = document.getElementById('dialogue-text-body');
        const opciones = document.getElementById('dialogue-options-container');
        const flecha = document.getElementById('dialogue-advance-indicator');
        const retrato = document.getElementById('dialogue-portrait-img');
        const btnIdioma = document.getElementById('dialogue-lang-toggle');
        const btnCerrar = document.getElementById('dialogue-close-btn');
        if (!nombre || !texto || !opciones) return false;

        estilos();

        // `DialogueBubble`
        const burbuja = document.createElement('div');
        burbuja.className = 'boc-burbuja';

        // `BubbleBacking`: tres capas, blanco, crema y contorno.
        const caja = document.createElement('div');
        caja.className = 'boc-caja';
        const blanco = document.createElement('div');
        blanco.className = 'boc-blanco';
        const crema = document.createElement('div');
        crema.className = 'boc-crema';
        const contorno = document.createElement('div');
        contorno.className = 'boc-contorno';
        caja.appendChild(blanco); caja.appendChild(crema); caja.appendChild(contorno);

        // `NameBubble` + `Name`: la píldora marrón sobre el borde de arriba.
        const pildora = document.createElement('div');
        pildora.className = 'boc-pildora';
        pildora.appendChild(nombre);
        caja.appendChild(pildora);

        // `Text`
        const cuerpo = document.createElement('div');
        cuerpo.className = 'boc-cuerpo';
        cuerpo.appendChild(texto);
        cuerpo.appendChild(flecha || document.createElement('span'));
        caja.appendChild(cuerpo);

        // Los dos botones del port —idioma y cerrar— no existen en el juego, pero hacen
        // falta en un editor. Van fuera del bocadillo, pequeños, para no ensuciarlo.
        const util = document.createElement('div');
        util.className = 'boc-util';
        if (btnIdioma) util.appendChild(btnIdioma);
        if (btnCerrar) util.appendChild(btnCerrar);
        caja.appendChild(util);

        // `PointerO` + `PointerMask/Pointer`: el pico, abajo a la izquierda.
        const pico = document.createElement('div');
        pico.className = 'boc-pico';
        const picoO = document.createElement('div');
        picoO.className = 'boc-picoO';
        pico.appendChild(picoO);

        burbuja.appendChild(caja);
        burbuja.appendChild(pico);

        // `Dialogue Replies` va debajo del bocadillo, no dentro.
        opciones.classList.add('boc-respuestas');

        capa.innerHTML = '';
        capa.appendChild(burbuja);
        capa.appendChild(opciones);
        if (retrato) {
            // El juego no tiene retrato; el elemento se queda porque `dialogue_manager`
            // le escribe el `src`, pero no se enseña.
            retrato.style.display = 'none';
            capa.appendChild(retrato);
        }
        capa.dataset.vestido = '1';
        puesto = true;
        return true;
    }

    function estilos() {
        if (document.getElementById('boc-estilos')) return;
        const st = document.createElement('style');
        st.id = 'boc-estilos';
        const b = M.borde;
        // EL RECORTE VA EN PIXELES DEL PNG, Y EL DEL VOLCADO NO CABE.
        //
        // `Sprite.border` dice 76/64/76/64, pero `speechBubble.png` mide 196x100: 64 arriba
        // y 64 abajo son 128, mas que los 100 que tiene. CSS entonces reduce las dos
        // rebanadas a la vez para que quepan y **el centro se queda en cero**, o sea que el
        // bocadillo no se estira: se escala. Por eso al crecer con dos lineas salia
        // deformado y el texto se comia el filo de abajo.
        //
        // El borde esta en pixeles del ARTE ORIGINAL, que se exporto a la mitad: 76/2 = 38
        // y 64/2 = 32. Medido en el propio PNG, la curva de la esquina acaba sobre y = 20,
        // asi que 32 la cubre entera y deja 36 de centro para estirar. El ANCHO en pantalla
        // se queda como estaba (el valor del volcado por la escala), que es 1:1 con el
        // recorte.
        const rec = { x: b.x / 2, y: b.y / 2, z: b.z / 2, w: b.w / 2 };
        const rebanada = [rec.w, rec.z, rec.y, rec.x].map(Math.round).join(' ');
        const anchoBorde = [b.w, b.z, b.y, b.x].map(v => px(v)).join(' ');
        st.textContent = `
#play-dialogue-overlay{position:fixed;left:50%;bottom:${px(120)};
  background:none;border:none;box-shadow:none;padding:0;
  transform:translateX(-50%);z-index:99999;pointer-events:auto;user-select:none;
  display:flex;flex-direction:column;align-items:center;gap:${px(24)}}
.boc-burbuja{position:relative;display:inline-block}
/* «BubbleBacking»: 160×128 de mínimo, y crece con el texto. */
.boc-caja{position:relative;min-width:${px(M.minAncho)};min-height:${px(M.minAlto)};
  max-width:${px(M.anchoTexto + M.margenIzq * 2)};box-sizing:border-box;
  padding:${px(M.margenArriba)} ${px(M.margenIzq)} ${px(M.margenAbajo)} ${px(M.margenIzq)}}
.boc-blanco,.boc-crema,.boc-contorno{position:absolute;pointer-events:none}
/* «speechBubble» es BLANCO PURO con alfa, o sea una silueta: para teñirlo del crema de
   la escena se usa de MASCARA en 9 rebanadas -«mask-border»- sobre el color, que es lo
   que hace Unity al pintarlo con el tinte del «Image». Un «filter» no vale: de blanco no
   se saca un tono. «speechBubbleOutline», en cambio, YA viene en su marrón y su tinte es
   blanco, o sea sin teñir, así que ese va de «border-image» tal cual. */
.boc-blanco,.boc-crema{
  -webkit-mask-box-image-source:url("${RUTA}speechBubble.png");
  -webkit-mask-box-image-slice:${rebanada} fill;
  -webkit-mask-box-image-repeat:stretch;
  /* OJO: el atajo deja la ANCHURA en cero y entonces sólo se ve el relleno del centro,
     o sea un rectángulo liso sin las esquinas del bocadillo. Hay que ponerla aparte. */
  -webkit-mask-box-image-width:${anchoBorde};
  mask-border-source:url("${RUTA}speechBubble.png");
  mask-border-slice:${rebanada} fill;mask-border-repeat:stretch;
  mask-border-width:${anchoBorde}}
/* «WhiteBacking» va al ras y «Image» metida 16, que es lo que deja el filo blanco. */
.boc-blanco{inset:0;background:#fff}
.boc-crema{inset:${px(16)};background:${CREMA}}
.boc-contorno{inset:${px(-3)};border-style:solid;border-color:transparent;
  border-image-repeat:stretch;border-width:${anchoBorde};border-image-width:${anchoBorde};
  border-image-slice:${rebanada} fill;
  border-image-source:url("${RUTA}speechBubbleOutline.png")}
/* «NameBubble»: píldora marrón sobre el borde de arriba, en (56, −12). */
.boc-pildora{position:absolute;left:${px(56)};top:${px(-12)};
  transform:translateY(-50%);background:${MARRON};color:#fff;
  border-radius:${px(M.bordePildora * 2)};padding:${px(6)} ${px(22)};
  font-size:${px(M.tamNombre)};font-weight:700;line-height:1.2;white-space:nowrap;z-index:3}
.boc-pildora #dialogue-speaker-name{color:#fff}
/* «Text»: 700 de ancho, TMP 32. */
/* El color lo pone la hoja vieja de «dialogue_manager» POR ID, así que heredar no basta:
   hay que ganarle con el mismo id. El texto del juego es marrón sobre crema. */
.boc-cuerpo{position:relative;z-index:2;width:${px(M.anchoTexto)};max-width:100%;
  font-size:${px(M.tamTexto)};line-height:${px(M.altoLinea)}}
#play-dialogue-overlay .boc-cuerpo #dialogue-text-body{min-height:${px(M.altoLinea)};
  color:#3b3226;font-size:${px(M.tamTexto)};line-height:${px(M.altoLinea)};
  background:none;padding:0;margin:0}
#play-dialogue-overlay .boc-pildora #dialogue-speaker-name{color:#fff;
  font-size:${px(M.tamNombre)};font-weight:700}
.boc-cuerpo #dialogue-advance-indicator{position:absolute;right:${px(-20)};
  bottom:${px(-18)};font-size:${px(26)};color:${MARRON};animation:boc-flecha 1s infinite}
@keyframes boc-flecha{0%,100%{transform:translateY(0)}50%{transform:translateY(${px(8)})}}
/* Los dos botones del port, que en el juego no están. */
.boc-util{position:absolute;right:${px(14)};top:${px(-14)};display:flex;gap:4px;z-index:4}
.boc-util button{border:none;background:${MARRON};color:#fff;border-radius:50%;
  width:${px(44)};height:${px(44)};font-size:${px(20)};cursor:pointer;line-height:1;padding:0}
/* «PointerO» y «Pointer»: el pico, CLAVADO donde lo pone la escena.
   El filo de abajo del bocadillo esta en y = 2 (130 - 128). El «PointerO» baja hasta -3,
   o sea 5 por debajo; el «PointerMask» esta en 9, 7 por encima. Y los dos estan en x = 0,
   que son 80 a la derecha del filo izquierdo (-80). Nada de margenes a ojo. */
.boc-pico{position:absolute;left:${px(M.bocadilloX * -1 - 16)};bottom:${px(7)};
  width:${px(32)};height:${px(16)};background:#fff;z-index:1;
  -webkit-mask-image:url("${RUTA}PrimitiveRoundDiamonds_4.png");
  mask-image:url("${RUTA}PrimitiveRoundDiamonds_4.png");
  -webkit-mask-size:100% 100%;mask-size:100% 100%}
.boc-picoO{position:absolute;left:${px(-9)};bottom:${px(-12)};
  width:${px(50)};height:${px(50)};
  background:${MARRON};z-index:-1;
  -webkit-mask-image:url("${RUTA}PrimitiveRoundDiamonds_3.png");
  mask-image:url("${RUTA}PrimitiveRoundDiamonds_3.png");
  -webkit-mask-size:100% 100%;mask-size:100% 100%}
/* «Dialogue Replies»: la lista de respuestas. */
.boc-respuestas{display:flex;flex-direction:column;gap:${px(10)};
  width:${px(M.anchoRespuesta)};max-width:92vw}
.boc-respuestas button,.boc-respuestas .boc-respuesta{
  position:relative;display:flex;align-items:center;gap:${px(16)};
  min-height:${px(M.altoRespuesta)};box-sizing:border-box;
  padding:${px(14)} ${px(28)};border:none;cursor:pointer;width:100%;text-align:left;
  background:${CREMA_RESPUESTA};color:#3b3226;font-size:${px(M.tamRespuesta)};
  border-radius:${px(M.bordePildora * 2)};font-family:inherit}
/* «Dashed Line»: el contorno de puntos, en negro al 11 % y REPETIDO. */
.boc-respuestas button::after,.boc-respuestas .boc-respuesta::after{
  content:"";position:absolute;inset:${px(4)};pointer-events:none;
  border-radius:${px(M.bordePildora * 2)};opacity:.11;
  border:${px(10)} solid transparent;
  border-image-source:url("${RUTA}PrimitiveShapesDashedO_2.png");
  border-image-slice:32 fill;border-image-width:${px(10)};border-image-repeat:repeat}
.boc-respuestas button:hover{filter:brightness(1.04)}
.boc-respuestas button:active{transform:scale(.99)}
`;
        document.head.appendChild(st);
    }

    global.PlayDialogueUI = {
        M, CREMA, MARRON, ESC,
        get puesto() { return puesto; },
        get ui() { return ui; },
        get uiOpc() { return uiOpc; },
        cargar, usarDatos, vestir, nodo,
    };

    // Se viste en cuanto `dialogue_manager` haya montado su ventana. Como la monta en su
    // `init()», se intenta al cargar y se reintenta un par de veces por si va después.
    if (typeof document !== 'undefined') {
        const intenta = (quedan) => {
            cargar().then(() => {
                if (vestir() || quedan <= 0) return;
                setTimeout(() => intenta(quedan - 1), 400);
            });
        };
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => intenta(12));
        } else { intenta(12); }
    }
})(typeof window !== 'undefined' ? window : globalThis);
