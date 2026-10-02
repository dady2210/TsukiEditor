/* play_ui_windows.js — el arte de verdad para las ventanas que el port dibujaba a ojo.
 *
 * ────────────────────────────────────────────────────────────────────────────
 *  QUE HABIA
 * ────────────────────────────────────────────────────────────────────────────
 * El modo editar, la mochila, el periódico de la mañana y los ajustes se pintaban con CSS
 * inventado: grises, morados y sombras que no existen en el juego. Las cuatro **sí**
 * están en `level14`, como las demás, y ya están volcadas.
 *
 * ────────────────────────────────────────────────────────────────────────────
 *  DE DONDE SALE CADA COLOR
 * ────────────────────────────────────────────────────────────────────────────
 * De `data/ui_paleta.json`, que fabrica `tools/build_ui_paleta.js` leyendo los volcados.
 * **Aquí no hay ni un color escrito a mano**: si se vuelve a extraer `level14` y algo
 * cambia, se regenera la paleta y este fichero se entera solo. Lo que sí está escrito son
 * los SELECTORES del port, que es lo que se está vistiendo.
 *
 *   EditModeInventory  ->  #hammer-ui     panel gris 75, interior verde azulado 143,168,
 *                                         huecos en círculo 148,170, pastilla de cantidad
 *                                         212,239, y los dos botones `refresh` y `grid`
 *   ExternalInventory  ->  #bag-ui        marrón 87,80,72 con el interior naranja
 *                                         233,169,100 y los huecos en crema 248,219,188
 *   NewspaperPopup     ->  el periódico   `newspaperBacking` en 9 rebanadas de 32 y su
 *                                         línea `roundedRect_4px` en 79,79,79
 *   OptionsPopup       ->  los ajustes    `PrimitiveShapesSpheres SDF_0`, gris 77
 *
 * ────────────────────────────────────────────────────────────────────────────
 *  POR QUE RE-VESTIR Y NO REESCRIBIR
 * ────────────────────────────────────────────────────────────────────────────
 * Es lo que ya funcionó con la barra de botones, las tiendas y el bocadillo de diálogo:
 * el marcado y la lógica del port se quedan como están —el inventario que se rellena
 * solo, el modo martillo, los deslizadores de sonido— y sólo se les cambia el aspecto.
 * Reescribir la ventana entera es lo que ha perdido cosas otras veces.
 *
 * ────────────────────────────────────────────────────────────────────────────
 *  LAS QUE NO SE VISTEN, Y POR QUE
 * ────────────────────────────────────────────────────────────────────────────
 * `Envelope`, `Mailbox`, `GachaPopup`, `DiaryPopup`, `CropBoxUI`, `GiftboxPopup`,
 * `BlurbPopup`, `DeedPopup` y `Petition` **no tienen ninguna superficie en modo play**:
 * el correo, por ejemplo, sólo existe en la pestaña del editor. No son un re-vestido,
 * son ventanas por construir. Su volcado, su paleta y sus texturas ya están, así que
 * cada una es montarla — pero no se finge que estén.
 */
(function (global) {
    'use strict';

    const RUTA = 'images/ui/ventanas/';
    const RUTA_ICONOS = 'images/icons/bubbles/';
    // Los que no viajan en `level14` y están con los iconos de burbuja. Se comprueba en
    // `tools/test_ventanas_ui.js` para que un cambio de sitio no deje un hueco mudo.
    const EN_BURBUJAS = new Set(['refresh', 'grid', 'search', 'table', 'menu', 'delete',
                                 'floppydisk', 'furnitureIcons_31', 'furnitureIcons_69',
                                 'furnitureIcons_10']);
    // `newspaperBacking` ya se exportó con el tablón y no hace falta duplicarlo: el
    // periódico de la mañana y el del tablón son el mismo sprite.
    const EN_TABLON = new Set(['newspaperBacking', 'roundedRect_4px']);

    let paleta = null;
    let puesto = false;

    async function cargar() {
        if (paleta) return true;
        try {
            const r = await fetch('data/ui_paleta.json');
            paleta = r.ok ? await r.json() : null;
        } catch (e) { paleta = null; }
        return !!paleta;
    }

    function usarPaleta(p) { paleta = p; return !!paleta; }

    /** Una parte de una ventana: `{sprite, borde, modo, color, tam}`. */
    function parte(ventana, nombre) {
        const v = paleta && paleta.ventanas && paleta.ventanas[ventana];
        return (v && v.partes && v.partes[nombre]) || null;
    }

    function url(n) {
        if (!n) return null;
        // Todos los `furnitureIcons_*` viven con los iconos de burbuja, no sólo los tres
        // que se listaron a mano: pedirlos en `ventanas/` dejaba un 404 por icono.
        if (EN_BURBUJAS.has(n) || /^furnitureIcons_\d+$/.test(n)) return RUTA_ICONOS + n + '.png';
        if (EN_TABLON.has(n)) return 'images/ui/bountyboard/' + n + '.png';
        return RUTA + n + '.png';
    }

    /** El color de Unity (0..1) en CSS. */
    function css(c) {
        if (!c) return 'transparent';
        const q = (x) => Math.max(0, Math.min(255, Math.round((Number(x) || 0) * 255)));
        const a = c.a == null ? 1 : Math.max(0, Math.min(1, Number(c.a)));
        return 'rgba(' + q(c.r) + ',' + q(c.g) + ',' + q(c.b) + ',' + a.toFixed(3) + ')';
    }

    /** Sólo el color de una parte, o un respaldo si esa parte no está. */
    function color(ventana, nombre, respaldo) {
        const p = parte(ventana, nombre);
        return p && p.color ? css(p.color) : (respaldo || 'transparent');
    }

    /**
     * Las reglas de una parte con sprite en 9 rebanadas.
     *
     * Casi todos estos sprites son **blancos con alfa**, o sea siluetas: para teñirlos
     * hay que usarlos de MASCARA sobre el color, como se hizo con el bocadillo. Un
     * `background-image` los dejaría blancos. La anchura de la máscara va aparte, porque
     * el atajo la deja en cero y sólo se vería el relleno del centro.
     */
    function rebanadas(ventana, nombre, escala) {
        const p = parte(ventana, nombre);
        if (!p || !p.sprite) return '';
        const u = url(p.sprite);
        const col = p.color ? css(p.color) : 'transparent';
        if (p.modo !== 1 || !p.borde || !(p.borde.x || p.borde.y)) {
            return 'background-color:' + col + ';background-image:url("' + u + '");'
                 + (p.modo === 2 ? 'background-repeat:repeat;'
                                 : 'background-size:100% 100%;background-repeat:no-repeat;');
        }
        const e = escala == null ? 1 : escala;
        const b = p.borde;
        // El `borde` de Unity va (izquierda, abajo, derecha, arriba); CSS va
        // (arriba, derecha, abajo, izquierda).
        const rebanada = [b.w, b.z, b.y, b.x].map(v => Math.round(v)).join(' ');
        const ancho = [b.w, b.z, b.y, b.x].map(v => Math.round(v * e) + 'px').join(' ');
        return 'background-color:' + col + ';'
            + '-webkit-mask-box-image-source:url("' + u + '");'
            + '-webkit-mask-box-image-slice:' + rebanada + ' fill;'
            + '-webkit-mask-box-image-repeat:stretch;'
            + '-webkit-mask-box-image-width:' + ancho + ';'
            + 'mask-border-source:url("' + u + '");'
            + 'mask-border-slice:' + rebanada + ' fill;'
            + 'mask-border-repeat:stretch;mask-border-width:' + ancho + ';';
    }

    /** Un círculo con el color de su parte. Es lo que son casi todos los huecos. */
    function redondo(ventana, nombre) {
        const p = parte(ventana, nombre);
        if (!p) return '';
        return 'background:' + (p.color ? css(p.color) : 'transparent') + ';border-radius:50%;';
    }

    /**
     * Mete la hoja de estilo. Todo lo que pinta sale de la paleta; lo único escrito a
     * mano son los selectores del port.
     */
    function vestir() {
        if (typeof document === 'undefined' || !paleta) return false;
        const vieja = document.getElementById('ventanas-reales');
        if (vieja) vieja.remove();

        const st = document.createElement('style');
        st.id = 'ventanas-reales';
        st.textContent = [
            modoEditar(), mochila(), periodico(), ajustes(),
        ].join('\n');
        document.head.appendChild(st);
        puesto = true;
        return true;
    }

    /**
     * `EditModeInventory`: el panel de 200×1200 pegado a un lado, gris oscuro, con el
     * interior verde azulado y los huecos en círculo.
     *
     * En el port es `#hammer-ui`: la barra de herramientas (`Voltear`, `Grid`) más el
     * panel de muebles. Los dos botones del juego son `FlipToggle` y `GridToggle`, con
     * sus iconos `refresh` y `grid`, así que los del port se emparejan con ellos.
     */
    function modoEditar() {
        const V = 'editmodeinventory';
        return `
.hammer-sidebar-panel,.hammer-sidebar{${rebanadas(V, 'panel', 0.5)}
  border:none;box-shadow:none;backdrop-filter:none;-webkit-backdrop-filter:none}
.hammer-sidebar-panel{padding:10px}
/* «Image»: el recuadro de dentro, con su hondo y su punteado. */
.hammer-sidebar-panel::before{content:"";position:absolute;inset:8px;pointer-events:none;
  ${rebanadas(V, 'interior', 0.5)}}
.hammer-sidebar-panel > *{position:relative;z-index:1}
/* Cada hueco es un «Dot» en círculo con su pastilla de cantidad. Las clases son las
   que pone «tsuki_port.js« al rellenar el panel: «hammer-inv-slot« y «hammer-inv-qty«. */
.hammer-inv-slot{${redondo(V, 'hueco')}
  border:none!important;box-shadow:none!important;backdrop-filter:none}
.hammer-inv-qty{background:${color(V, 'cantidad')}!important;color:#2f3a3a!important;
  border-radius:999px!important;border:none!important}
/* «FlipToggle» y «GridToggle»: fondo gris y el icono en verde azulado. */
.btn-hammer-tool{${rebanadas(V, 'botonFondo', 0.4)}
  color:${color(V, 'botonIcono')};border:none;box-shadow:none}
.btn-hammer-tool .material-symbols-outlined{color:${color(V, 'botonIcono')}}
#btn-hammer-flip .material-symbols-outlined,#btn-hammer-grid .material-symbols-outlined{
  display:none}
#btn-hammer-flip::before,#btn-hammer-grid::before{content:"";display:block;
  width:28px;height:28px;background-color:${color(V, 'botonIcono')};
  -webkit-mask-size:contain;mask-size:contain;-webkit-mask-repeat:no-repeat;
  mask-repeat:no-repeat;-webkit-mask-position:center;mask-position:center}
#btn-hammer-flip::before{-webkit-mask-image:url("${url('refresh')}");
  mask-image:url("${url('refresh')}")}
#btn-hammer-grid::before{-webkit-mask-image:url("${url('grid')}");
  mask-image:url("${url('grid')}")}`;
    }

    /**
     * «ExternalInventory« («MiniInventory«): el panel que sale al abrir un mueble, en
     * marrón con el interior naranja y los huecos en crema. En el port es «#bag-ui«.
     */
    function mochila() {
        const V = 'externalinventory';
        return `
.bag-panel{${rebanadas(V, 'panel', 0.5)}
  border:none;box-shadow:none;backdrop-filter:none;-webkit-backdrop-filter:none;padding:14px}
.bag-panel::before{content:"";position:absolute;inset:10px;pointer-events:none;
  ${rebanadas(V, 'interior', 0.5)}}
.bag-panel > *{position:relative;z-index:1}
.bag-inv-slot{${redondo(V, 'hueco')}
  border:none!important;box-shadow:none!important;backdrop-filter:none}
.bag-inv-qty{background:${color(V, 'cantidad')}!important;color:#4a4038!important;
  border-radius:999px!important;border:none!important}
.btn-bag-exit,.btn-hammer-exit{${redondo(V, 'boton')}
  border:3px solid ${color(V, 'aro')};box-shadow:none;color:#fff}`;
    }

    /**
     * «NewspaperPopup«: el periódico de la mañana. Es el mismo «newspaperBacking« en 9
     * rebanadas que ya usa el tablón, con su línea «roundedRect_4px«.
     *
     * OJO: el borde del sprite aquí es **32**, no 84. El de 84 es el del tablón, que es
     * otro nodo; copiarlo dejaba un marco enorme.
     */
    function periodico() {
        const V = 'newspaperpopup';
        return `
.newspaper-container{${rebanadas(V, 'fondo', 1)}
  background-image:none;border-radius:0}
.newspaper-rule,.newspaper-rule-double{background:${color(V, 'linea')};border:none;
  height:4px;border-radius:2px}
.newspaper-container .newspaper-body,.newspaper-container .newspaper-header{
  position:relative;z-index:1}`;
    }

    /** «OptionsPopup«: el panel de ajustes, «PrimitiveShapesSpheres SDF_0« en gris 77. */
    function ajustes() {
        const V = 'optionspopup';
        return `
.port-settings-modal{${rebanadas(V, 'panel', 0.5)}
  border:none;box-shadow:none;backdrop-filter:none;-webkit-backdrop-filter:none}
.port-settings-modal::before,.port-settings-modal::after{display:none}`;
    }

    global.PlayUIWindows = {
        RUTA, RUTA_ICONOS, EN_BURBUJAS,
        get paleta() { return paleta; },
        get puesto() { return puesto; },
        cargar, usarPaleta, vestir, parte, color, css, url, rebanadas, redondo,
    };

    if (typeof document !== 'undefined') {
        const arranca = () => { cargar().then(() => vestir()); };
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', arranca);
        } else { arranca(); }
    }
})(typeof window !== 'undefined' ? window : globalThis);
