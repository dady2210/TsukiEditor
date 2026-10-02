/* shop_viewer.js — la tarjeta que se abre al tocar un objeto a la venta.
 *
 * ────────────────────────────────────────────────────────────────────────────
 *  QUE VENTANA ES
 * ────────────────────────────────────────────────────────────────────────────
 * `ShopDisplay::QuickTap` (0x5936184) acaba en `Viewer::View(this)` (0x5886a14): la ventana
 * NO es un menú de tienda, es el `Viewer`, la misma tarjeta de objeto que sale al mirar
 * cualquier cosa. Lo que cambia es el modo: `Viewer::View(item, cantidad, 2)`, con el 2 de
 * comprar, que enciende el botón de compra y la pestaña del precio.
 *
 * `tools/cs_ui_popup` saca el árbol entero de `level1` a `data/ui_viewer.json` —49 nodos,
 * 34 imágenes, 9 textos— y sus texturas van a `images/ui/viewer/`.
 *
 * ────────────────────────────────────────────────────────────────────────────
 *  POR QUE ESTA VENTANA NO SE PINTA CON `ui_render.js`, Y EL TABLON SI
 * ────────────────────────────────────────────────────────────────────────────
 * El tablón es un tablero fijo: sus piezas están colocadas con `anchoredPosition` y
 * `sizeDelta`, así que reproducir los rectángulos basta. El `Viewer` no:
 *
 *   · su `Popup` está guardado con **`m_LocalScale` a (0, 0)** —la ventana está cerrada en
 *     la escena—, así que sus rectángulos salen a cero;
 *   · y lleva `VerticalLayoutGroup` + `ContentSizeFitter`: el tamaño y la posición de cada
 *     fila los calcula Unity EN EJECUCION, no están guardados.
 *
 * O sea que los rectángulos de la escena no dicen dónde va nada. Lo que sí dicen, y es lo
 * que se usa aquí, son las MEDIDAS de cada pieza (el icono de 192, los botones de 100, el
 * marco de 8), los SPRITES y los COLORES. La ventana se arma con flexbox, que es lo que
 * hace un `VerticalLayoutGroup` con `ContentSizeFitter`: una columna que se ajusta a su
 * contenido.
 *
 * ────────────────────────────────────────────────────────────────────────────
 *  EL `ViewerStyle`, QUE ERA LO QUE FALTABA
 * ────────────────────────────────────────────────────────────────────────────
 * `Viewer.defaultStyle` es un `ViewerStyle` con cuatro colores y tres sprites, y se aplica
 * en `Viewer::ApplyViewerStyle` (0x5886220) sobre los arrays `backing`, `borders`,
 * `innerBackings`, más `innerBorder` y `brand`. Estaba sin extraer porque mi volcado se
 * saltaba los structs anidados; ahora sale:
 *
 *     backingColor  0.9451, 0.92157, 0.83922   →  #F1EBD6
 *     innerColor    0.86792, 0.83747, 0.74101  →  #DDD6BD
 *     borderColor   0.33333, 0.30588, 0.29412  →  #554E4B
 *     textColor     0.47059, 0.45882, 0.41961  →  #78756B
 *     innerBorder   `PrimitiveShapesDashedO_2`, en 9 rebanadas de 32 px
 *
 * y los tres colores se reparten así, que es lo que hace `ApplyViewerStyle`:
 *   · `backing`      → backingColor
 *   · `borders`      → borderColor
 *   · `innerBackings`→ innerColor
 *   · los textos     → textColor
 *
 * Los otros dos sprites del estilo, `brand` y `filterBrand`, vienen a null en el estilo por
 * defecto: la marca que se ve en la ventana es la del propio nodo `Brand/Image`.
 *
 * ────────────────────────────────────────────────────────────────────────────
 *  LOS FORMATOS, QUE SON CONSTANTES DEL `Viewer`
 * ────────────────────────────────────────────────────────────────────────────
 *     PriceDiscountFormat = "{0} <s><alpha=#77>{1}</s>"
 *     DiscountFormat      = "-{0}%"
 *     MarkupFormat        = "+{0}%"
 *     OrdersFormat        = "{0}/{1}"
 *
 * `Viewer::Open` (0x5887a08) suena `AudioData.PlaySFX(0x14)` = `cardOpen` a 0,15; lo
 * dispara `play_shops.tocar`, que es quien abre esto.
 */
(function (global) {
    'use strict';

    const F_DESCUENTO = '-{0}%';
    const F_RECARGO = '+{0}%';
    const ID = 'viewer-tienda';

    let ui = null;
    const RUTA_UI = 'images/ui/viewer/';
    const RUTA_ICONOS = 'images/icons/bubbles/';

    async function cargar() {
        if (ui) return true;
        try {
            const r = await fetch('data/ui_viewer.json');
            if (!r.ok) return false;
            ui = await r.json();
            return true;
        } catch (e) { return false; }
    }

    function usarUI(d) { ui = d; return !!ui; }

    function db(id) {
        const d = global.ITEMS_DB;
        return (d && d[String(Math.abs(Number(id) || 0))]) || null;
    }
    function nombreDe(id) {
        const it = db(id);
        if (!it) return 'Objeto ' + id;
        return it.name_es || it.name_en || it.item_name || it.furn_name || ('Objeto ' + id);
    }
    function descripcionDe(id) {
        const it = db(id);
        return (it && (it.desc_es || it.desc_en)) || '';
    }
    function precioBaseDe(id) {
        const it = db(id);
        if (!it) return 0;
        return Number(it.price != null ? it.price : (it.Price != null ? it.Price : 0)) || 0;
    }

    /** Los colores del `ViewerStyle`, ya en CSS. */
    function estilo() {
        const e = (ui && ui.campos && ui.campos.defaultStyle) || null;
        const c = (k, pordefecto) => {
            const v = e && e[k];
            if (!v) return pordefecto;
            return global.UIRender.css(v);
        };
        return {
            fondo: c('backingColor', '#F1EBD6'),
            interior: c('innerColor', '#DDD6BD'),
            borde: c('borderColor', '#554E4B'),
            texto: c('textColor', '#78756B'),
            marco: (e && e.innerBorder && e.innerBorder.nombre) || null,
        };
    }

    /** A qué grupo del estilo pertenece cada nodo, por su ruta. */
    function grupoDe(ruta) {
        const c = (ui && ui.campos) || {};
        const en = (k) => Array.isArray(c[k]) ? c[k].indexOf(ruta) >= 0 : c[k] === ruta;
        if (en('backing')) return 'fondo';
        if (en('borders')) return 'borde';
        if (en('innerBackings')) return 'interior';
        if (c.innerBorder === ruta) return 'marco';
        return null;
    }

    function urlSprite(nombre) {
        if (!nombre) return null;
        // Los iconos de la interfaz —la zanahoria, los símbolos de mueble— ya estaban en el
        // port; el resto son los del `Viewer`, recién exportados.
        if (/^(carrot|yield|furnitureIcons_|time|water)/.test(nombre)) {
            return RUTA_ICONOS + nombre + '.png';
        }
        return RUTA_UI + nombre + '.png';
    }

    function cerrar() {
        const el = document.getElementById(ID);
        if (el) el.remove();
    }

    /**
     * Abre la tarjeta para un expositor. `e` es lo que devuelve `PlayShops.deMapa`.
     */
    async function abrir(e, mapId) {
        if (typeof document === 'undefined') return null;
        const PS = global.PlayShops;
        if (!PS) return null;
        await cargar();
        cerrar();

        const id = Number(e.itemId);
        const descuento = (function () {
            try { return Number(PS.descuentoDe ? PS.descuentoDe(mapId, e.shopIdx) : 0) || 0; }
            catch (err) { return 0; }
        })();
        const base = precioBaseDe(id);
        const coste = PS.precio(id, descuento);
        const cantidad = e.quantity || 1;
        const est = estilo();
        const zan = (function () {
            const p = global.app && global.app.parser;
            const v = p && p.generalVars && p.generalVars.carrots;
            return Number(v ? v.value : 0) || 0;
        })();

        const panel = document.createElement('div');
        panel.id = ID;
        panel.style.cssText = 'position:fixed;inset:0;z-index:100000;display:flex;'
            + 'align-items:center;justify-content:center;background:rgba(0,0,0,.45)';
        panel.addEventListener('click', (ev) => { if (ev.target === panel) cerrar(); });
        document.body.appendChild(panel);

        // Las medidas salen del volcado; si no está, las de la escena escritas aquí.
        const M = medidas();
        const esc = Math.min(1, (global.innerHeight || 900) / 900);

        const card = document.createElement('div');
        card.style.cssText = [
            'position:relative', 'display:flex', 'flex-direction:column', 'align-items:center',
            'width:' + M.ancho + 'px', 'box-sizing:border-box',
            'transform:scale(' + esc + ')', 'transform-origin:center center',
            'background:' + est.fondo,
            // `Backing` es `roundedRect` en 9 rebanadas; el radio sale de su borde.
            'border-radius:' + M.radio + 'px',
            // `Border` es `roundedRectO_8px`, un contorno de 8 px del color del borde.
            'box-shadow:0 0 0 8px ' + est.borde + ', 0 14px 34px rgba(0,0,0,.4)',
            'padding:' + M.relleno + 'px', 'gap:14px',
        ].join(';');

        // ── la pestaña del precio, arriba a la izquierda ─────────────────────
        const precio = document.createElement('div');
        precio.style.cssText = 'position:absolute;left:-10px;top:-26px;display:flex;'
            + 'align-items:center;gap:8px;background:' + est.borde + ';color:' + est.fondo
            + ';border-radius:999px;padding:6px 18px 6px 10px;font-weight:800;'
            + 'font-size:' + M.tamPrecio + 'px';
        const zanIco = document.createElement('img');
        zanIco.src = urlSprite('carrot');
        zanIco.style.cssText = 'width:' + M.iconoPrecio + 'px;height:' + M.iconoPrecio + 'px';
        zanIco.onerror = () => { zanIco.style.display = 'none'; };
        precio.appendChild(zanIco);
        const precioTxt = document.createElement('span');
        precioTxt.textContent = String(coste);
        precio.appendChild(precioTxt);
        if (descuento > 0 && base !== coste) {
            // `PriceDiscountFormat = "{0} <s><alpha=#77>{1}</s>"`
            const viejo = document.createElement('s');
            viejo.textContent = String(base);
            viejo.style.opacity = '.47';
            precio.appendChild(viejo);
        }
        card.appendChild(precio);

        // ── el icono, en su círculo ─────────────────────────────────────────
        const aro = document.createElement('div');
        aro.style.cssText = 'position:relative;width:' + M.aro + 'px;height:' + M.aro + 'px;'
            + 'border-radius:50%;background:' + est.interior + ';display:flex;'
            + 'align-items:center;justify-content:center';
        const ico = document.createElement('img');
        ico.src = PS.urlDelObjeto(id);
        ico.style.cssText = 'width:' + M.icono + 'px;height:' + M.icono + 'px;'
            + 'object-fit:contain;image-rendering:pixelated';
        ico.onerror = () => { ico.style.visibility = 'hidden'; };
        aro.appendChild(ico);
        if (cantidad > 1) {
            // `QuantityBubble`: círculo oscuro de 42 con el número dentro.
            const b = document.createElement('div');
            b.style.cssText = 'position:absolute;right:2px;bottom:2px;width:' + M.burbuja
                + 'px;height:' + M.burbuja + 'px;border-radius:50%;background:#545454;'
                + 'color:#fff;display:flex;align-items:center;justify-content:center;'
                + 'font-weight:800;font-size:' + Math.round(M.burbuja * 0.55) + 'px';
            b.textContent = String(cantidad);
            aro.appendChild(b);
        }
        if (descuento > 0) {
            const d = document.createElement('div');
            d.style.cssText = 'position:absolute;left:-6px;top:-4px;background:' + est.interior
                + ';color:' + est.borde + ';border-radius:10px;padding:2px 10px;'
                + 'font-weight:800;font-size:' + Math.round(M.tamPrecio * 0.8) + 'px';
            d.textContent = F_DESCUENTO.replace('{0}', String(Math.round(descuento * 100)));
            aro.appendChild(d);
        }
        card.appendChild(aro);

        // ── nombre y descripción ────────────────────────────────────────────
        const titulo = document.createElement('div');
        titulo.textContent = nombreDe(id);
        titulo.style.cssText = 'font-weight:800;text-align:center;color:' + est.borde
            + ';font-size:' + M.tamTitulo + 'px;line-height:1.15';
        card.appendChild(titulo);

        const caja = document.createElement('div');
        caja.style.cssText = 'align-self:stretch;background:' + est.interior
            + ';border-radius:' + Math.round(M.radio * 0.7) + 'px;padding:12px 14px;'
            + 'color:' + est.texto + ';font-size:' + M.tamDesc + 'px;line-height:1.3;'
            + 'text-align:center;min-height:2.6em';
        caja.textContent = descripcionDe(id) || '';
        card.appendChild(caja);

        // ── el botón de comprar: círculo verde de 100 con su aro ────────────
        const fila = document.createElement('div');
        fila.style.cssText = 'display:flex;gap:16px;align-items:center;margin-top:2px';
        const comprar = document.createElement('button');
        comprar.style.cssText = 'width:' + M.boton + 'px;height:' + M.boton + 'px;'
            + 'border-radius:50%;border:none;background:' + M.colorComprar + ';'
            + 'box-shadow:0 0 0 4px ' + est.borde + ';display:flex;align-items:center;'
            + 'justify-content:center;cursor:' + (zan >= coste ? 'pointer' : 'not-allowed')
            + (zan < coste ? ';filter:grayscale(.7)' : '');
        const bico = document.createElement('img');
        bico.src = urlSprite('furnitureIcons_15');
        bico.style.cssText = 'width:' + Math.round(M.boton * 0.62) + 'px;height:'
            + Math.round(M.boton * 0.62) + 'px;object-fit:contain';
        bico.onerror = () => { bico.replaceWith(document.createTextNode('✔')); };
        comprar.appendChild(bico);
        comprar.onclick = (ev) => {
            ev.stopPropagation();
            const res = PS.comprar(mapId, e.objectID);
            if (res.resultado === PS.RESULTADO.COMPRADO) {
                cerrar();
                if (global.showGlobalToast) {
                    global.showGlobalToast('Compraste ' + nombreDe(id) + ' por '
                        + res.coste + ' 🥕', 'success');
                }
                return;
            }
            aviso(panel, res, PS, coste, zan);
        };
        fila.appendChild(comprar);
        card.appendChild(fila);

        panel.appendChild(card);

        const x = document.createElement('button');
        x.textContent = '✕';
        x.style.cssText = 'position:fixed;top:14px;right:16px;z-index:2;width:40px;height:40px;'
            + 'border-radius:50%;border:2px solid ' + est.borde + ';background:' + est.fondo
            + ';color:' + est.borde + ';font-size:1.1rem;cursor:pointer';
        x.onclick = cerrar;
        panel.appendChild(x);
        return panel;
    }

    /**
     * Las medidas de la ventana, sacadas del volcado cuando está.
     *
     * Son las de la escena: el aro del icono 192, el icono 218 dentro, la burbuja de
     * cantidad 42, los botones 100, el ancho 568, el borde de 8. Si no hay volcado se usan
     * esas mismas escritas aquí, que es de donde salieron.
     */
    function medidas() {
        const M = { ancho: 568, aro: 192, icono: 176, burbuja: 42, boton: 100, radio: 28,
                    relleno: 22, tamTitulo: 50, tamDesc: 32, tamPrecio: 36, iconoPrecio: 44,
                    colorComprar: '#A5CA7B' };
        if (!ui || !ui.arbol) return M;
        const porRuta = {};
        (function anda(n) {
            porRuta[n.ruta] = n;
            for (const h of n.hijos || []) anda(h);
        })(ui.arbol);
        const tam = (ruta, eje) => {
            const n = porRuta[ruta];
            return n && n.tam ? n.tam[eje] : null;
        };
        const v = (x, d) => (typeof x === 'number' && x > 0 ? Math.round(x) : d);
        M.ancho = v(tam('Viewer/Popup/Icon & Title', 'x'), M.ancho);
        M.aro = v(tam('Viewer/Popup/Icon & Title/Border', 'x'), M.aro);
        M.burbuja = v(tam('Viewer/Popup/Icon & Title/Border/QuantityBubble', 'x'), M.burbuja);
        M.boton = v(tam('Viewer/Popup/Buttons/Buy', 'x'), M.boton);
        const t = (ruta) => {
            const n = porRuta[ruta];
            if (!n) return null;
            for (const c of n.comp || []) if (c.tipo === 'TextMeshProUGUI') return c.tam;
            return null;
        };
        M.tamTitulo = v(t('Viewer/Popup/Icon & Title/Title'), M.tamTitulo);
        M.tamDesc = v(t('Viewer/Popup/Desc/DescriptionBox/Description'), M.tamDesc);
        M.tamPrecio = v(t('Viewer/Popup/Price/Value'), M.tamPrecio);
        M.iconoPrecio = v(tam('Viewer/Popup/Price/Image', 'x'), M.iconoPrecio);
        // El verde del botón de comprar es el color de su `Image` en la escena.
        const buy = porRuta['Viewer/Popup/Buttons/Buy'];
        if (buy) {
            for (const c of buy.comp || []) {
                if (c.tipo === 'Image' && c.color) {
                    M.colorComprar = global.UIRender ? global.UIRender.css(c.color)
                                                     : M.colorComprar;
                }
            }
        }
        return M;
    }

    function aviso(panel, res, PS, coste, zan) {
        let t = res.razon || 'No se pudo comprar.';
        if (res.resultado === PS.RESULTADO.SIN_ZANAHORIAS) {
            // `CarrotHandler.NotEnoughCarrots()`: el juego sacude el contador y no cobra.
            t = 'No te llegan las zanahorias: cuesta ' + (res.coste != null ? res.coste : coste)
              + ' y tienes ' + zan + '.';
        } else if (res.resultado === PS.RESULTADO.BOLSA_LLENA) {
            t = 'La bolsa está llena.';                 // `InventoryPopup.FullBag()`
        } else if (res.resultado === PS.RESULTADO.SIN_HOMECOMING) {
            // La rama premium de `ShopDisplay::Buy`, que abre la compra de Homecoming.
            t = 'Ese objeto es de Homecoming: el juego abre aquí su compra, que es una '
              + 'compra real y el port no la hace.';
        }
        let d = panel.querySelector('.viewer-aviso');
        if (!d) {
            d = document.createElement('div');
            d.className = 'viewer-aviso';
            d.style.cssText = 'position:fixed;left:0;right:0;bottom:24px;text-align:center;'
                + 'color:#fff;background:rgba(150,50,40,.92);padding:10px 14px;font-size:.9rem';
            panel.appendChild(d);
        }
        d.textContent = t;
    }

    global.ShopViewer = { abrir, cerrar, cargar, usarUI, estilo, grupoDe, urlSprite,
                          medidas,
                          nombreDe, descripcionDe, precioBaseDe, F_DESCUENTO, F_RECARGO };

    global.abrirViewerTienda = function (e, mapId) {
        const m = (mapId != null) ? mapId
            : (global.app && global.app.map ? global.app.map.currentMapId : null);
        return abrir(e, m != null ? m : e.sublocId);
    };
})(typeof window !== 'undefined' ? window : globalThis);
