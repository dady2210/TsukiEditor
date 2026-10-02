/* ui_render.js — dibuja una ventana del juego a partir de su volcado.
 *
 * ────────────────────────────────────────────────────────────────────────────
 *  QUE ES ESTO
 * ────────────────────────────────────────────────────────────────────────────
 * Las ventanas del port estaban hechas a ojo con CSS. Esto las dibuja con las MEDIDAS DE
 * VERDAD: `tools/cs_ui_popup` saca el árbol de `RectTransform` de la escena —anclas,
 * pivote, `anchoredPosition`, `sizeDelta`, escala y ángulo— más cada `Image` con su sprite,
 * su color y su modo, y cada texto con su tamaño, color y alineación. Aquí se convierte ese
 * árbol en `div`s colocados en absoluto.
 *
 * ────────────────────────────────────────────────────────────────────────────
 *  LA CUENTA DE UNITY, QUE ES LA QUE HAY QUE REPRODUCIR
 * ────────────────────────────────────────────────────────────────────────────
 * Un `RectTransform` se coloca respecto a su padre con cuatro cosas: las dos anclas
 * (normalizadas, 0..1), el pivote (normalizado, sobre el propio rectángulo), la
 * `anchoredPosition` y el `sizeDelta`.
 *
 *   ancho  = (anclaMax.x − anclaMin.x) · anchoPadre + sizeDelta.x
 *   refX   = (anclaMin.x + (anclaMax.x − anclaMin.x) · pivote.x) · anchoPadre
 *   izq    = refX + pos.x − pivote.x · ancho
 *
 * y en Y lo mismo, pero Unity mide desde ABAJO y el navegador desde arriba.
 *
 * OJO CON EL PUNTO DE REFERENCIA. `anchoredPosition` es el desplazamiento del PIVOTE desde
 * `Lerp(anclaMin, anclaMax, pivote)`, no desde `anclaMin`. Con las anclas juntas da lo
 * mismo y no se nota; con las anclas SEPARADAS, no. El `FishName` de los carteles del
 * tablón va anclado de (0,1) a (1,1) con pivote 0,5 y `sizeDelta` (−64, 60): con la fórmula
 * mala salía en x −95,5 —fuera del cartel, encima del de al lado— y con la buena en 32,
 * centrado en sus 255 de ancho. Era lo que descuadraba los nombres.
 *
 * ────────────────────────────────────────────────────────────────────────────
 *  LO QUE NO SE REPRODUCE, Y POR QUE
 * ────────────────────────────────────────────────────────────────────────────
 * Los `LayoutGroup` y los `ContentSizeFitter` recolocan a sus hijos EN EJECUCIÓN. Aquí se
 * usan las medidas que la escena tiene guardadas, que son las de la última vez que Unity
 * pasó el layout en el editor: para una ventana que no cambia de contenido es lo mismo, y
 * para una que sí —el periódico del tablón, que crece con el titular— queda el tamaño de
 * diseño. Es una diferencia real y por eso se dice, en vez de fingir un motor de layout.
 *
 * Los sprites en 9 rebanadas (`modo` 1) sí se reproducen, con `border-image` y el `borde`
 * del sprite, que es lo que evita que los marcos se deformen. Los `modo` 2 (Tiled) van con
 * `repeat`.
 */
(function (global) {
    'use strict';

    /** El color de Unity (0..1 por banda) a CSS. */
    function css(c) {
        if (!c) return null;
        const b = v => Math.max(0, Math.min(255, Math.round((v == null ? 1 : v) * 255)));
        return 'rgba(' + b(c.r) + ',' + b(c.g) + ',' + b(c.b) + ',' + (c.a == null ? 1 : c.a) + ')';
    }

    /**
     * Las cuatro esquinas de una caja con su giro y su escala aplicados sobre el pivote.
     * Es lo que hace falta para medir cuánto ocupa de verdad.
     */
    function esquinasGiradas(c) {
        const ang = (c.angulo || 0) * Math.PI / 180;   // el signo ya va en el `rotate` de CSS
        const ca = Math.cos(-ang), sa = Math.sin(-ang);
        const ex = c.escala ? c.escala.x : 1, ey = c.escala ? c.escala.y : 1;
        const px = c.piv.x * c.w, py = (1 - c.piv.y) * c.h;
        const fuera = [];
        for (const [lx, ly] of [[0, 0], [c.w, 0], [0, c.h], [c.w, c.h]]) {
            const ax = (lx - px) * ex, ay = (ly - py) * ey;
            fuera.push([c.x + px + ax * ca - ay * sa, c.y + py + ax * sa + ay * ca]);
        }
        return fuera;
    }

    /** La caja de un nodo dentro de su padre, con la cuenta de Unity. */
    function caja(n, anchoPadre, altoPadre, conGiro) {
        const aMin = n.anclaMin || { x: 0.5, y: 0.5 };
        const aMax = n.anclaMax || aMin;
        const piv = n.pivote || { x: 0.5, y: 0.5 };
        const pos = n.pos || { x: 0, y: 0 };
        const tam = n.tam || { x: 0, y: 0 };
        const w = (aMax.x - aMin.x) * anchoPadre + tam.x;
        const h = (aMax.y - aMin.y) * altoPadre + tam.y;
        const refX = (aMin.x + (aMax.x - aMin.x) * piv.x) * anchoPadre;
        const refY = (aMin.y + (aMax.y - aMin.y) * piv.y) * altoPadre;
        const izq = refX + pos.x - piv.x * w;
        const abajo = refY + pos.y - piv.y * h;
        const c = { x: izq, y: altoPadre - abajo - h, w, h, piv };
        if (conGiro) { c.angulo = conGiro.angulo || 0; c.escala = conGiro.escala || null; }
        return c;
    }

    function comp(n, tipo) {
        for (const c of (n.comp || [])) if (c.tipo === tipo) return c;
        return null;
    }

    /**
     * El fondo de una `Image`, con su modo.
     *   0 Simple  — la imagen entera, estirada al rectángulo
     *   1 Sliced  — 9 rebanadas, con el `borde` del sprite
     *   2 Tiled   — repetida a tamaño nativo
     *   3 Filled  — aquí se trata como Simple
     */
    function fondo(el, img, url) {
        if (!url) return;
        const sp = img.sprite || {};
        const modo = img.modo | 0;
        if (modo === 1 && sp.borde && (sp.borde.x || sp.borde.y || sp.borde.z || sp.borde.w)) {
            // `borde` de Unity es (izquierda, abajo, derecha, arriba); `border-image-slice`
            // va (arriba, derecha, abajo, izquierda).
            const b = sp.borde;
            el.style.borderImageSource = 'url("' + url + '")';
            el.style.borderImageSlice = [b.w, b.z, b.y, b.x].map(v => Math.round(v)).join(' ') + ' fill';
            el.style.borderImageWidth = [b.w, b.z, b.y, b.x].map(v => Math.round(v) + 'px').join(' ');
            el.style.borderStyle = 'solid';
            el.style.borderColor = 'transparent';
            el.style.borderWidth = [b.w, b.z, b.y, b.x].map(v => Math.round(v) + 'px').join(' ');
            return;
        }
        el.style.backgroundImage = 'url("' + url + '")';
        if (modo === 2) {
            el.style.backgroundRepeat = 'repeat';
            el.style.backgroundSize = (sp.rw || 'auto') + 'px ' + (sp.rh || 'auto') + 'px';
        } else {
            el.style.backgroundRepeat = 'no-repeat';
            el.style.backgroundSize = img.conservaProporcion ? 'contain' : '100% 100%';
            el.style.backgroundPosition = 'center';
        }
    }

    /**
     * El texto de TextMeshPro, con sus etiquetas.
     *
     * TMP no usa HTML: usa sus propias etiquetas, y si se sueltan tal cual salen a la vista.
     * En el tablón se veía `<size=120>T</size>HE <size=120>D</size>AILY...` escrito en
     * pantalla, que es la cabecera del periódico en versalitas.
     *
     * Se traducen las que aparecen en esta interfaz:
     *   <size=N> / <size=N%>   tamaño, absoluto o relativo
     *   <b> <i> <s> <u>        negrita, cursiva, tachado, subrayado
     *   <color=#RRGGBB>        color
     *   <alpha=#HH>            opacidad del resto del texto
     *   <nobr>                 sin cortar (en CSS, `white-space: nowrap`)
     *   <align=...>            alineación
     *   <sprite index=N>       un icono del atlas de TMP; se deja al llamante
     *   <sprite=N>             lo mismo, en la forma corta que tambien acepta TMP
     *   <voffset> <cspace> <indent> <line-height> <pos> <space> <mark>  se quitan
     *
     * Devuelve HTML ya escapado. El `<sprite index=N>` se sustituye por lo que devuelva
     * `sprite(n)`, o se quita si no hay nada.
     */
    function tmp(texto, sprite) {
        if (texto == null) return '';
        const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;')
                                    .replace(/>/g, '&gt;');
        let fuera = '';
        let i = 0;
        const pila = [];
        const re = /<([^<>]{1,60})>/g;
        let m;
        while ((m = re.exec(texto)) !== null) {
            fuera += esc(texto.slice(i, m.index));
            i = m.index + m[0].length;
            const eti = m[1].trim();
            const bajo = eti.toLowerCase();

            if (bajo[0] === '/') {
                const cierre = pila.pop();
                if (cierre) fuera += cierre;
                continue;
            }
            let hecho = null;
            let mm;
            if ((mm = /^size=([\d.]+)(%?)$/.exec(bajo))) {
                hecho = mm[2] === '%'
                    ? '<span style="font-size:' + mm[1] + '%">'
                    : '<span style="font-size:' + mm[1] + '%">';
                // TMP toma `<size=120>` como 120 % cuando no lleva unidad dentro de un
                // texto ya dimensionado, que es como se usa en la cabecera del periódico.
            } else if (bajo === 'b') { hecho = '<b>'; }
            else if (bajo === 'i') { hecho = '<i>'; }
            else if (bajo === 's') { hecho = '<s>'; }
            else if (bajo === 'u') { hecho = '<u>'; }
            else if (bajo === 'nobr') { hecho = '<span style="white-space:nowrap">'; }
            else if ((mm = /^color=(#[0-9a-f]{3,8})$/.exec(bajo))) {
                hecho = '<span style="color:' + mm[1] + '">';
            } else if ((mm = /^alpha=#([0-9a-f]{2})$/.exec(bajo))) {
                hecho = '<span style="opacity:' + (parseInt(mm[1], 16) / 255).toFixed(3) + '">';
            } else if ((mm = /^align=([a-z]+)$/.exec(bajo))) {
                hecho = '<span style="display:block;text-align:' + mm[1] + '">';
            } else if ((mm = /^sprite(?:\s+index)?=(\d+)/.exec(bajo))
                       || (mm = /^sprite\s+index=(\d+)/.exec(bajo))) {
                // TMP acepta las DOS formas: `<sprite index=18>` y `<sprite=18>`. La corta
                // es la que usa la firma de Clem en la peticion, y sin esto se perdia.
                fuera += (sprite ? (sprite(Number(mm[1])) || '') : '');
                continue;
            } else {
                // Lo que no se traduce se quita, que es mejor que enseñarlo.
                continue;
            }
            fuera += hecho;
            pila.push(hecho[1] === 's' && hecho[2] === 'p' ? '</span>'
                      : '</' + hecho.slice(1));
        }
        fuera += esc(texto.slice(i));
        while (pila.length) fuera += pila.pop();
        return fuera;
    }

    // La alineación de TMP: los bits de horizontal están en el byte bajo.
    const H = { 1: 'left', 2: 'center', 4: 'right', 8: 'justify' };
    const V = { 256: 'flex-start', 512: 'center', 1024: 'flex-end' };

    /**
     * Construye el árbol.
     *
     * @param n      el nodo del volcado
     * @param padre  el elemento donde colgarlo
     * @param aP,alP el tamaño del padre en unidades de la ventana
     * @param op     { url(nombreSprite) -> ruta, tinte(nodo) -> color, salta(nodo) -> bool,
     *                 alBuscar(nodo, elemento) }
     */
    function nodo(n, padre, aP, alP, op) {
        if (!n || (op.salta && op.salta(n))) return null;
        const c = caja(n, aP, alP);
        const el = document.createElement('div');
        el.className = 'uiw';
        el.dataset.ruta = n.ruta || n.nombre || '';
        el.style.cssText = 'position:absolute;box-sizing:border-box;'
            + 'left:' + c.x + 'px;top:' + c.y + 'px;'
            + 'width:' + c.w + 'px;height:' + c.h + 'px;';
        // EL GIRO Y LA ESCALA VAN JUNTOS Y ALREDEDOR DEL PIVOTE.
        //
        // Sin esto la ventana sale desparramada: en el tablón, `BoardBottom` va a 90 grados
        // y `BoardTop` a 180, y con el giro puesto el corcho ocupa de 0 a 880 y la cabecera
        // de 879 a 1125, o sea que encajan y suman los 1125 de alto. Sin el giro, el corcho
        // salía tumbado y a un lado, y parecía que la extracción estaba mal.
        //
        // El ángulo va NEGADO: el Z positivo de Unity gira en sentido antihorario sobre un
        // eje Y hacia arriba, y el `rotate` de CSS gira en horario sobre uno hacia abajo.
        if (n.escala || n.angulo) {
            const t = [];
            if (n.angulo) t.push('rotate(' + (-n.angulo) + 'deg)');
            if (n.escala) t.push('scale(' + n.escala.x + ',' + n.escala.y + ')');
            el.style.transformOrigin = (c.piv.x * 100) + '% ' + ((1 - c.piv.y) * 100) + '%';
            el.style.transform = t.join(' ');
        }
        if (n.activo === false) el.style.display = 'none';

        const img = comp(n, 'Image') || comp(n, 'InvertedMaskImage');
        if (img) {
            const col = (op.tinte && op.tinte(n, img)) || css(img.color);
            const url = img.sprite && op.url ? op.url(img.sprite.nombre, n) : null;
            if (url) {
                fondo(el, img, url);
                // El color de una `Image` MULTIPLICA al sprite. Con alfa 0 no se ve nada.
                if (col) {
                    const m = /rgba\(([^)]+)\)/.exec(col);
                    const a = m ? Number(m[1].split(',')[3]) : 1;
                    if (a < 0.999) el.style.opacity = String(a);
                }
            } else if (col) {
                // Sin sprite, el color de la `Image` ES el relleno. Se guarda aparte para
                // que quien le ponga luego una imagen -el icono de un pez, la foto de un
                // periódico- pueda quitarlo: el `Icon` del cartel viene con un gris oscuro
                // (0.31) que es su silueta, y dejarlo tapaba el pez.
                el.style.background = col;
                el.dataset.relleno = col;
            }
        }

        const tmpc = comp(n, 'TextMeshProUGUI');
        if (tmpc) {
            el.style.display = 'flex';
            el.style.alignItems = V[tmpc.alineacion & 0xFF00] || 'center';
            el.style.justifyContent = (H[tmpc.alineacion & 0xFF] || 'center')
                .replace('left', 'flex-start').replace('right', 'flex-end');
            el.style.textAlign = H[tmpc.alineacion & 0xFF] || 'center';
            el.style.color = css(tmpc.color) || '#000';
            el.style.fontSize = (tmpc.tam || 24) + 'px';
            el.style.lineHeight = '1.1';
            el.style.whiteSpace = 'pre-wrap';
            if (tmpc.estilo & 1) el.style.fontWeight = '700';
            if (tmpc.estilo & 2) el.style.fontStyle = 'italic';
            // Con las etiquetas traducidas, no sueltas a la vista.
            el.innerHTML = tmp(tmpc.texto || '', op.sprite);
            el.dataset.tmp = '1';
        }

        if (op.alBuscar) op.alBuscar(n, el);
        padre.appendChild(el);
        for (const h of (n.hijos || [])) nodo(h, el, c.w, c.h, op);
        return el;
    }

    /**
     * Dibuja una ventana entera dentro de `destino`, escalada para que quepa.
     * Devuelve { raiz, ancho, alto, escala, porRuta }.
     */
    function ventana(doc, destino, op) {
        op = op || {};
        const raizN = doc.arbol;
        // EL RECTANGULO DE LA RAIZ ES EL QUE MANDA, aunque mida cero.
        //
        // El tablón viene con `tam` (0, 1125) y las anclas juntas en (0.5, 0.5): su
        // rectángulo tiene CERO de ancho y todo cuelga de su eje vertical, con posiciones
        // negativas a un lado y positivas al otro. Coger el mayor de los hijos como ancho
        // del padre —que fue el primer intento— descoloca todo, porque las anclas se
        // multiplican por ese ancho.
        //
        // Así que se construye sobre el rectángulo de verdad y DESPUES se mide el contorno
        // de lo que ha salido, para poder enseñarlo entero.
        const aRaiz = (raizN.tam && raizN.tam.x) || 0;
        const alRaiz = (raizN.tam && raizN.tam.y) || 0;

        const lienzo = document.createElement('div');
        lienzo.style.cssText = 'position:relative;';
        const porRuta = {};
        const opts = Object.assign({}, op, {
            alBuscar(n, el) {
                porRuta[n.ruta] = el;
                if (op.alBuscar) op.alBuscar(n, el);
            },
        });
        const cajas = [];
        for (const h of (raizN.hijos || [])) {
            const el = nodo(h, lienzo, aRaiz, alRaiz, opts);
            if (el) cajas.push(caja(h, aRaiz, alRaiz, h));
        }
        // EL CONTORNO SE MIDE CON EL GIRO PUESTO.
        //
        // La primera versión lo medía con los rectángulos sin girar, y como el corcho del
        // tablón va a 90 grados salía un contorno de 1265x1756 en vez de 877x1125: la
        // ventana quedaba descentrada y con un hueco enorme a un lado. La comprobación en
        // Python sí giraba, y por eso allí se veía bien y en el navegador no.
        let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
        for (const c of cajas) {
            for (const q of esquinasGiradas(c)) {
                x0 = Math.min(x0, q[0]); y0 = Math.min(y0, q[1]);
                x1 = Math.max(x1, q[0]); y1 = Math.max(y1, q[1]);
            }
        }
        if (!isFinite(x0)) { x0 = 0; y0 = 0; x1 = aRaiz || 900; y1 = alRaiz || 900; }
        const ancho = op.ancho || Math.ceil(x1 - x0);
        const alto = op.alto || Math.ceil(y1 - y0);
        lienzo.style.width = ancho + 'px';
        lienzo.style.height = alto + 'px';
        lienzo.style.overflow = 'visible';
        // Se corre todo para que el contorno empiece en (0, 0).
        for (const el of Array.from(lienzo.children)) {
            el.style.left = (parseFloat(el.style.left) - x0) + 'px';
            el.style.top = (parseFloat(el.style.top) - y0) + 'px';
        }

        // CENTRADO. La primera versión escalaba y luego corregía con márgenes, y la
        // ventana acababa descolocada y cortada por arriba. Lo que centra de verdad es
        // anclar el envoltorio al centro del contenedor y componer el desplazamiento con la
        // escala en una sola transformación.
        const envoltura = document.createElement('div');
        envoltura.style.cssText = 'position:absolute;left:50%;top:50%;'
            + 'width:' + ancho + 'px;height:' + alto + 'px;'
            + 'transform-origin:center center;';
        envoltura.appendChild(lienzo);
        if (getComputedStyle(destino).position === 'static') destino.style.position = 'relative';
        destino.appendChild(envoltura);

        function ajustar() {
            const dw = destino.clientWidth || window.innerWidth;
            const dh = destino.clientHeight || window.innerHeight;
            const s = Math.min(dw / ancho, dh / alto, op.escalaMax || 1) * (op.margen || 0.92);
            envoltura.style.transform = 'translate(-50%, -50%) scale(' + s + ')';
            return s;
        }
        if (typeof window !== 'undefined' && window.addEventListener) {
            window.addEventListener('resize', ajustar);
        }
        const escala = ajustar();
        return { raiz: lienzo, envoltura, ancho, alto, escala, porRuta, ajustar };
    }

    global.UIRender = { ventana, nodo, caja, css, comp, tmp };
})(typeof window !== 'undefined' ? window : globalThis);
