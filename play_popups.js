/* play_popups.js — las ocho ventanas que el port no tenía.
 *
 * ────────────────────────────────────────────────────────────────────────────
 *  QUE SON
 * ────────────────────────────────────────────────────────────────────────────
 * Las ocho que quedaban de `level14`. Ninguna tenía superficie en modo play, así que no
 * son un re-vestido: se CONSTRUYEN, con el patrón que dejó el correo — la forma y los
 * colores de `data/ui_paleta.json`, y la lógica que el port ya tiene, sin tocarla.
 *
 *   `BlurbPopup`        la franja de aviso de arriba
 *   `DiaryPopup`        las fotos del diario, esparcidas
 *   `CropBoxUI`         la caja de cosecha, con su total y su botón de vender
 *   `ExternalInventory` el inventario de un mueble que guarda cosas
 *   `GachaPopup`        la bola de gacha al abrirse
 *   `GiftboxPopup`      la caja de regalo, con hasta tres premios
 *   `DeedPopup`         la escritura del apartamento, con su hipoteca
 *   `Petition`          la petición que se firma
 *
 * ────────────────────────────────────────────────────────────────────────────
 *  LO QUE CADA UNA SACA DE LA PARTIDA
 * ────────────────────────────────────────────────────────────────────────────
 *   DiaryPopup   `Progress.diario()`: número, estado, texto y el dibujo, que ya está
 *                exportado en `images/npcs/`. Los 144 dibujos están.
 *   CropBoxUI    `parser.getCropBoxSave()`: los `slots` con su `cropID` y su `quantity`,
 *                más las zanahorias de la caja. `CropBoxUI.CropMenu.CropOption` tiene
 *                `name`, `quantity` y `value`, que es lo que se enseña por fila.
 *   ExternalInventory  `parser.getPotGuyStorage()`, que es el caso que el save guarda.
 *   GachaPopup   `Gacha.tirar(setID)`, que ya existe con los cortes de rareza del binario.
 *   GiftboxPopup `GiftboxPopup.furnRewards` es un `int[]`: hasta TRES muebles, y la
 *                escena tiene sus tres huecos `Reward`, `Reward2` y `Reward3`.
 *   Petition     los nombres ya firmados están EN LA ESCENA —Teresa W., Clem, ADRIAN,
 *                Tomas Myshkin, Barclay— y el hueco de TSUKI es un `Button`.
 *   DeedPopup    `nameText`, `details`, `price`, `signatureText`, `mortgageText`, el
 *                `slider` de la hipoteca y los botones `signature` y `payMortgage`.
 *
 * ────────────────────────────────────────────────────────────────────────────
 *  LO QUE NO SE REPRODUCE, Y SE DICE
 * ────────────────────────────────────────────────────────────────────────────
 * `GachaPopup` y `GiftboxPopup` son, en el juego, **objetos 3D**: la bola y la caja son
 * `MeshFilter` + `MeshRenderer` con un `Animator`, doce `gachaLine` de rayos y un
 * `ParticleSystem` de chispas. El port no tiene motor 3D, así que aquí son el velo, el
 * destello y el premio — que es lo que el jugador se lleva—, y la bola no se abre.
 *
 * Y del `DeedPopup`, el texto de la escena es de relleno («Apartment 5B», «Lorem ipsum»):
 * el contenido de verdad lo pone el juego al abrirla. Se enseña lo que la partida sabe y
 * se dice de dónde sale cada hueco, en vez de inventar un contrato.
 */
(function (global) {
    'use strict';

    const ID = 'popup-real';
    const ESC = 0.55;

    function P() { return global.PlayUIWindows; }
    function px(v) { return Math.round(v * ESC) + 'px'; }
    function col(v, n, r) { return P() ? P().color(v, n, r) : (r || 'transparent'); }
    function reb(v, n) { return P() ? P().rebanadas(v, n, ESC) : ''; }
    function url(n) { return P() ? P().url(n) : ('images/ui/ventanas/' + n + '.png'); }
    function parser() { return global.app && global.app.parser; }

    // Los precios de cosecha. OJO: `window.CROPS_DB` NO son precios, son los SPRITES de
    // cada cultivo; el precio esta en `data/crops.json`, en `cosechas[]`, que es de donde
    // lo saca `farming_system`.
    let precios = null;

    async function cargar() {
        if (!precios) {
            try {
                const r = await fetch('data/crops.json');
                const j = r.ok ? await r.json() : null;
                precios = {};
                for (const c of ((j && j.cosechas) || [])) {
                    if (c && c.id != null) precios[String(c.id)] = Number(c.precio) || 0;
                }
            } catch (e) { precios = {}; }
        }
        if (P() && P().paleta) return true;
        return P() ? P().cargar() : false;
    }

    /** El precio de un cultivo, o 0 si no esta en el catalogo. */
    function precioDe(id) { return (precios && precios[String(id)]) || 0; }

    function cerrar() {
        const e = typeof document !== 'undefined' ? document.getElementById(ID) : null;
        if (!e) return true;
        // `SFXClip.CropBoxClose`: solo si lo que se cierra es la caja, no cualquier
        // ventana. `sonar` devuelve false si el nombre no esta, asi que no pasa nada.
        if (e.dataset && e.dataset.ventana === 'cropbox' && global.PlaySfx) {
            global.PlaySfx.sonar('cropBoxClose');
        }
        e.remove();
        return true;
    }

    /** El velo y el marco comunes. `velo` es el color del `blocker` de cada ventana. */
    function capa(velo) {
        cerrar();
        const c = document.createElement('div');
        c.id = ID;
        c.style.cssText = 'position:fixed;inset:0;z-index:100005;display:flex;'
            + 'align-items:center;justify-content:center;background:' + (velo || 'rgba(0,0,0,.33)');
        c.addEventListener('click', (e) => { if (e.target === c) cerrar(); });
        estilos();
        return c;
    }

    function texto(t, tam, color, extra) {
        const d = document.createElement('div');
        d.style.cssText = 'font-size:' + px(tam || 32) + ';line-height:1.3;color:'
            + (color || '#3b3226') + ';' + (extra || '');
        if (/<[a-z]/i.test(String(t)) && global.UIRender) {
            d.innerHTML = global.UIRender.tmp(t, spriteTMP);
        }
        else d.textContent = t;
        return d;
    }

    function boton(etq, fondo, alPulsar) {
        const b = document.createElement('button');
        b.style.cssText = fondo + 'border:none;cursor:pointer;font-family:inherit;'
            + 'padding:' + px(18) + ' ' + px(34) + ';font-size:' + px(34) + ';color:#3b3226;'
            + 'font-weight:700;';
        b.textContent = etq;
        b.onclick = (ev) => { ev.stopPropagation(); alPulsar(b); };
        return b;
    }

    function icono(id, invType, lado) {
        const im = document.createElement('img');
        im.loading = 'lazy';
        const a = Number(invType) === 0 ? 'ITEM_' : 'FURN_';
        const b = Number(invType) === 0 ? 'FURN_' : 'ITEM_';
        im.src = 'images/items/' + a + id + '.png';
        im.style.cssText = 'width:' + px(lado || 100) + ';height:' + px(lado || 100)
            + ';object-fit:contain';
        im.onerror = () => {
            im.onerror = () => { im.replaceWith(document.createTextNode('#' + id)); };
            im.src = 'images/items/' + b + id + '.png';
        };
        return im;
    }

    /**
     * El valor en zanahorias. El juego lo escribe con `ValueFormat = "{0}‽"`: el `‽` es un
     * `<sprite>` de TMP, o sea el icono de la zanahoria, que el port ya tiene.
     */
    function zanahorias(n, tam, color) {
        const d = document.createElement('div');
        d.style.cssText = 'display:inline-flex;align-items:center;gap:' + px(6) + ';'
            + 'font-size:' + px(tam || 26) + ';color:' + (color || '#3b3226') + ';';
        const t = document.createElement('span');
        t.textContent = String(n);
        d.appendChild(t);
        const im = document.createElement('img');
        im.src = 'images/icons/bubbles/carrot.png';
        im.style.cssText = 'width:' + px((tam || 26) * 1.1) + ';height:' + px((tam || 26) * 1.1);
        im.onerror = () => { im.replaceWith(document.createTextNode('‽')); };
        d.appendChild(im);
        return d;
    }

    /**
     * El `<sprite index=N>` de TMP. El 43 es la zanahoria y es el UNICO indice que el port
     * tiene identificado (`Bounty.ValueText`). El 18 -la firma de Clem- no lo esta: el
     * atlas de TMP no esta extraido, asi que se deja vacio en vez de poner otra cosa.
     */
    function spriteTMP(n) {
        if (n === 43) {
            return '<img src="images/icons/bubbles/carrot.png" '
                 + 'style="height:1em;vertical-align:-.12em;margin-right:.14em">';
        }
        return '';
    }

    function nombreDe(id) {
        const db = global.ITEMS_DB || {};
        const it = db[String(id)];
        return (it && (it.name_es || it.name_en)) || ('objeto ' + id);
    }

    /**
     * Los textos que estan EN LA ESCENA, copiados de los volcados. No son adorno: son lo
     * que el juego ensena si nadie los cambia, y tenerlos aqui evita que el respaldo diga
     * algo parecido pero distinto.
     */
    const TEXTOS = {
        peticionTitulo: 'Petition to Make "The Raven" A Historical Site',
        peticionDetalle: 'The Raven has stood out as a rich cultural spot amidst the '
            + 'incresingly bleak and boring landscape that is Uptown.  It is a place with '
            + 'heritage and historical significance that goes back decades. We, the People, '
            + 'cannot stay silent while this city dies and therefore petition to keep '
            + '"The Raven" alive under the Preservation of Monuments and Sites Act.',
        peticionFirmas: ['Teresa W.', '   Clem<sprite=18>', 'ADRIAN', '  Tomas Myshkin',
                         ' Barclay'],
        escrituraNombre: 'Apartment 5B',
        escrituraFirma: '<i>Sign Here</i>',
        escrituraAgencia: 'ANCHOR REALTY',
        escrituraPagar: 'Pay {0}',
    };

    // ── 1. BlurbPopup ───────────────────────────────────────────────────────

    /**
     * `BlurbUI`: una franja negra al 20 % con un TMP de 48, anclada arriba (y = 290).
     * Es lo que el juego usa para avisar de algo sin cortar el juego.
     */
    function blurb(mensaje, segundos) {
        if (typeof document === 'undefined') return null;
        estilos();
        const viejo = document.getElementById('blurb-real');
        if (viejo) viejo.remove();
        const f = document.createElement('div');
        f.id = 'blurb-real';
        f.style.cssText = 'position:fixed;left:0;right:0;top:' + px(290) + ';z-index:100006;'
            + 'background:' + col('blurbpopup', 'franja', 'rgba(0,0,0,.2)') + ';'
            + 'padding:' + px(16) + ' 0;text-align:center;color:#fff;'
            + 'font-size:' + px(48) + ';pointer-events:none;'
            + 'animation:pop-entra .22s ease-out';
        f.textContent = mensaje;
        document.body.appendChild(f);
        setTimeout(() => f.remove(), Math.max(800, (segundos || 3) * 1000));
        return f;
    }

    // ── 2. DiaryPopup ───────────────────────────────────────────────────────

    /**
     * `DiaryPicMenu`: una foto por `DiarySave`, cada una con su `restingAngle`, o sea
     * esparcidas como polaroids. La tarjeta es de 400×432 con sombra, marco gris 25 % y
     * la hoja blanca dentro.
     */
    function diario() {
        if (typeof document === 'undefined') return null;
        const Pr = global.Progress;
        const cap = capa('rgba(0,0,0,.45)');
        const caja = document.createElement('div');
        caja.style.cssText = 'display:flex;flex-wrap:wrap;gap:' + px(30) + ';'
            + 'max-width:92vw;max-height:88vh;overflow:auto;padding:' + px(20) + ';'
            + 'justify-content:center';

        const todas = Pr ? Pr.diario() : [];
        const vistas = todas.filter(e => e.state === 2);
        if (!vistas.length) {
            caja.appendChild(texto('Todavía no hay ninguna entrada vista.', 32, '#f6f1e4'));
        }
        vistas.slice(0, 60).forEach((e, i) => {
            const t = document.createElement('div');
            // `restingAngle`: en la escena cada foto reposa con su propio giro.
            const ang = ((i * 37) % 13) - 6;
            t.style.cssText = 'position:relative;width:' + px(400) + ';'
                + 'transform:rotate(' + ang + 'deg);'
                + reb('diarypopup', 'marco')
                + 'padding:' + px(14) + ';box-sizing:border-box;'
                + 'box-shadow:0 ' + px(14) + ' ' + px(24) + ' rgba(63,63,63,.45)';
            const hoja = document.createElement('div');
            hoja.style.cssText = reb('diarypopup', 'hoja')
                + 'padding:' + px(14) + ';display:flex;flex-direction:column;gap:' + px(10) + ';';
            if (e.arte) {
                const im = document.createElement('img');
                im.loading = 'lazy';
                im.src = 'images/npcs/' + e.arte + '.png';
                im.style.cssText = 'width:100%;aspect-ratio:1;object-fit:contain;'
                    + 'background:rgba(0,0,0,.04)';
                im.onerror = () => { im.style.display = 'none'; };
                hoja.appendChild(im);
            }
            if (e.texto) hoja.appendChild(texto(e.texto, 24, '#3b3226'));
            hoja.appendChild(texto('#' + e.num + (e.night ? ' · de noche' : ''), 22,
                                   'rgba(59,50,38,.6)'));
            t.appendChild(hoja);
            caja.appendChild(t);
        });
        cap.appendChild(caja);
        document.body.appendChild(cap);
        return cap;
    }

    // ── 3. CropBoxUI ────────────────────────────────────────────────────────

    /**
     * `CropBox`: un desplegable con su pico, en crema (0,86 0,78 0,63) sobre gris.
     * Cada fila es un `CropOption` con `name`, `quantity` y `value`; abajo, el `total` y
     * el botón de vender.
     *
     * El precio de un cultivo NO se inventa: sale de `data/crops.json`, que es lo que ya
     * usa `farming_system`. Si un cultivo no está ahí, se enseña sin precio.
     */
    /**
     * `CropBoxUI.Sell()` -> `CropBox.SellAll()`: los cultivos de la caja se convierten en
     * zanahorias y los huecos quedan a cero.
     *
     * De dónde sale cada parte: el botón y el total son literales del binario
     * (`CropBoxUI.TotalValueFormat`), y que la moneda sea la zanahoria lo dice
     * `CropBox.AddCarrots(int)`. Lo que NO se pudo desensamblar es si `SellAll` deja las
     * zanahorias EN la caja o se las da al jugador: aquí se le dan al jugador, que es el
     * resultado que ve —y de paso se vacía lo que la caja ya tuviera guardado, que es lo
     * que hace `transferCropBoxCarrotsToPlayer`—.
     */
    function venderTodo(p, info, total) {
        if (!p || !info || !info.present) return 0;
        let ganado = 0;
        try { ganado += Number(p.transferCropBoxCarrotsToPlayer()) || 0; } catch (e) {}
        for (let i = 0; i < (info.slots || []).length; i++) {
            const s = info.slots[i];
            const q = Number(s.quantity) || 0;
            const id = Number(s.cropID) || 0;
            if (!(id > 0 && q > 0)) continue;
            const v = precioDe(id) * q;
            if (v > 0 && p.addPlayerCarrots) { p.addPlayerCarrots(v); ganado += v; }
            if (p.setCropBoxSlot) p.setCropBoxSlot(i, 0, 0);
        }
        return ganado;
    }

    function cropBox() {
        if (typeof document === 'undefined') return null;
        if (!precios) { cargar().then(() => cropBox()); return null; }
        const p = parser();
        const info = p && p.getCropBoxSave ? p.getCropBoxSave() : { present: false };
        const cap = capa('rgba(0,0,0,.4)');
        cap.dataset.ventana = 'cropbox';

        const panel = document.createElement('div');
        panel.style.cssText = 'display:flex;flex-direction:column;align-items:center';
        const menu = document.createElement('div');
        menu.style.cssText = reb('cropboxui', 'borde')
            + 'width:' + px(471) + ';max-height:80vh;overflow:auto;box-sizing:border-box;'
            + 'padding:' + px(8) + ';';
        const dentro = document.createElement('div');
        dentro.style.cssText = reb('cropboxui', 'fondo')
            + 'padding:' + px(20) + ';display:flex;flex-direction:column;gap:' + px(10) + ';';

        if (!info.present) {
            dentro.appendChild(texto('Esta partida no tiene caja de cosecha.', 26));
        } else {
            let total = 0;
            const llenos = (info.slots || []).filter(s => Number(s.quantity) > 0);
            if (!llenos.length) {
                const v = document.createElement('img');
                v.src = url('furnitureIcons_69');
                v.style.cssText = 'width:' + px(100) + ';opacity:.13;margin:0 auto';
                v.onerror = () => { v.style.display = 'none'; };
                dentro.appendChild(v);
                dentro.appendChild(texto('La caja está vacía.', 26, 'rgba(59,50,38,.6)'));
            }
            for (const s of llenos) {
                const fila = document.createElement('div');
                fila.style.cssText = 'display:flex;align-items:center;gap:' + px(12) + ';';
                fila.appendChild(icono(s.cropID, 0, 64));
                const n = texto(nombreDe(s.cropID), 26);
                n.style.flex = '1';
                fila.appendChild(n);
                fila.appendChild(texto('×' + s.quantity, 26));
                const precio = precioDe(s.cropID);
                if (precio) {
                    total += precio * Number(s.quantity);
                    fila.appendChild(zanahorias(precio * Number(s.quantity), 26,
                                                'rgba(59,50,38,.7)'));
                }
                dentro.appendChild(fila);
            }
            // LAS ZANAHORIAS QUE LA CAJA YA TENIA.
            //
            // `CropBoxSave.carrots` es aparte de los huecos: son las que metio
            // `CropBox.AddCarrots` al recoger zanahorias, que no son un objeto sino la
            // moneda. Van en su fila para que las filas sumen lo que dice el boton; sin
            // ella el total salia 104.925 con las filas sumando 4.600.
            if ((Number(info.carrots) || 0) > 0) {
                const fc = document.createElement('div');
                fc.style.cssText = 'display:flex;align-items:center;gap:' + px(12) + ';';
                const ic = document.createElement('img');
                ic.src = 'images/icons/bubbles/carrot.png';
                ic.style.cssText = 'width:' + px(64) + ';height:' + px(64)
                    + ';object-fit:contain';
                ic.onerror = () => { ic.style.display = 'none'; };
                fc.appendChild(ic);
                const nc = texto('Zanahorias de la caja', 26);
                nc.style.flex = '1';
                fc.appendChild(nc);
                fc.appendChild(zanahorias(Number(info.carrots), 26, 'rgba(59,50,38,.7)'));
                dentro.appendChild(fc);
            }

            // `Total Divider`: una línea a cada lado de la palabra «total».
            const div = document.createElement('div');
            div.style.cssText = 'display:flex;align-items:center;gap:' + px(10) + ';'
                + 'margin-top:' + px(8) + ';';
            const linea = () => {
                const l = document.createElement('div');
                l.style.cssText = 'flex:1;height:' + px(8) + ';border-radius:' + px(4) + ';'
                    + 'background:' + col('cropboxui', 'linea', '#555');
                return l;
            };
            div.appendChild(linea());
            div.appendChild(texto('total', 24, 'rgba(59,50,38,.8)'));
            div.appendChild(linea());
            dentro.appendChild(div);

            // El botón es literalmente el `TotalValueFormat` del binario:
            //   «<line-height=0%>Sell All↵<margin-right=0.2em><align=right><b>{0}‽»   (el ↵ es un salto de línea)
            // o sea «Sell All» y, debajo y a la derecha, el total en negrita.
            const caja = Number(info.carrots) || 0;
            const b = boton('', reb('cropboxui', 'boton'), () => {
                const ganado = venderTodo(p, info, total);
                cerrar();
                blurb(ganado > 0 ? ('Vendido: +' + ganado + ' zanahorias.')
                                 : 'La caja está vacía.');
                if (global.app && global.app.refreshAll) global.app.refreshAll();
            });
            b.textContent = '';
            b.style.cssText += 'align-self:stretch;display:flex;flex-direction:column;'
                + 'align-items:stretch;gap:0;line-height:1;';
            b.appendChild(texto('Sell All', 34, '#3b3226', 'font-weight:700'));
            const tot = zanahorias(total + caja, 34, '#3b3226');
            tot.style.cssText += 'align-self:flex-end;font-weight:800;margin-right:'
                + px(10) + ';';
            b.appendChild(tot);
            if (!llenos.length && !caja) b.disabled = true;
            if (b.disabled) b.style.opacity = '.45';
            dentro.appendChild(b);
        }
        menu.appendChild(dentro);
        panel.appendChild(menu);
        panel.appendChild(pico('cropboxui'));
        cap.appendChild(panel);
        document.body.appendChild(cap);
        // `SFXClip.CropBoxOpen`: el desplegable de la caja al abrirse.
        if (global.PlaySfx) global.PlaySfx.sonar('cropBoxOpen');
        return cap;
    }

    /** El `Pointer` / `PointerO` que cuelga de los desplegables. */
    function pico(ventana) {
        const p = document.createElement('div');
        const u = url('PrimitiveRoundDiamonds_4');
        p.style.cssText = 'width:' + px(72) + ';height:' + px(32) + ';margin-top:' + px(-4) + ';'
            + 'background-color:' + col(ventana, 'pico', '#dcc6a0') + ';'
            + '-webkit-mask-image:url("' + u + '");mask-image:url("' + u + '");'
            + '-webkit-mask-size:100% 100%;mask-size:100% 100%;'
            + 'transform:rotate(180deg)';
        return p;
    }

    // ── 4. ExternalInventory ────────────────────────────────────────────────

    /**
     * `MiniInventory`: lo que guarda un mueble. El caso que la partida guarda es el del
     * tipo de la maceta (`potGuyStorage`), así que es el que se enseña.
     */
    function almacen(lista) {
        if (typeof document === 'undefined') return null;
        const p = parser();
        let cosas = lista;
        if (!cosas) {
            try { cosas = p && p.getPotGuyStorage ? p.getPotGuyStorage() : []; }
            catch (e) { cosas = []; }
        }
        const cap = capa('rgba(0,0,0,.4)');
        const panel = document.createElement('div');
        panel.style.cssText = 'display:flex;flex-direction:column;align-items:center';
        const caja = document.createElement('div');
        caja.style.cssText = reb('externalinventory', 'panel')
            + 'width:' + px(560) + ';max-height:70vh;overflow:auto;box-sizing:border-box;'
            + 'padding:' + px(16) + ';';
        const dentro = document.createElement('div');
        dentro.style.cssText = reb('externalinventory', 'interior')
            + 'padding:' + px(16) + ';display:flex;flex-wrap:wrap;gap:' + px(12) + ';'
            + 'justify-content:center;min-height:' + px(120) + ';';

        const leeID = (o) => {
            if (o == null) return null;
            if (typeof o === 'number') return o;
            const n = (o.children || []).find(c => /^(ID|id)$/.test(c.name || ''));
            return n ? Number(n.value) : null;
        };
        let n = 0;
        for (const o of (cosas || [])) {
            const id = leeID(o);
            if (!(id > 0)) continue;
            n++;
            const h = document.createElement('div');
            h.style.cssText = 'width:' + px(100) + ';height:' + px(100) + ';border-radius:50%;'
                + 'display:flex;align-items:center;justify-content:center;'
                + 'background:' + col('externalinventory', 'hueco', '#f8dbbc') + ';';
            h.title = nombreDe(id);
            h.appendChild(icono(id, 1, 78));
            dentro.appendChild(h);
        }
        if (!n) dentro.appendChild(texto('No guarda nada.', 26, 'rgba(74,64,56,.75)'));
        caja.appendChild(dentro);
        panel.appendChild(caja);
        panel.appendChild(pico('externalinventory'));
        cap.appendChild(panel);
        document.body.appendChild(cap);
        return cap;
    }

    // ── 5 y 6. GachaPopup y GiftboxPopup ────────────────────────────────────

    /**
     * El premio, que es lo que las dos tienen en común.
     *
     * En el juego la bola y la caja son OBJETOS 3D con su `Animator`, doce `gachaLine` de
     * rayos y un `ParticleSystem`. Aquí no hay motor 3D: se hace el velo, el destello y
     * el premio, y se dice que la bola no se abre.
     */
    /** Los `gachaLine` que tiene cada una, contados en su volcado de level14. */
    const RAYOS = { gachapopup: 12, giftboxpopup: 3 };

    function premio(cual, ids, titulo) {
        if (typeof document === 'undefined') return null;
        const cap = capa(col(cual, 'velo', 'rgba(0,0,0,.33)'));
        const centro = document.createElement('div');
        centro.style.cssText = 'position:relative;z-index:2;display:flex;'
            + 'flex-direction:column;align-items:center;'
            + 'gap:' + px(24) + ';animation:pop-premio .4s cubic-bezier(.2,1.4,.5,1)';

        if (cual === 'giftboxpopup') {
            // `Backing` + `Pattern`: el fondo rojo de la caja de regalo.
            cap.style.background = col('giftboxpopup', 'fondo', 'rgb(207,101,101)');
            const velo = document.createElement('div');
            velo.style.cssText = 'position:absolute;inset:0;background:'
                + col('giftboxpopup', 'velo', 'rgba(0,0,0,.33)');
            cap.insertBefore(velo, cap.firstChild);
        }

        // El destello. Los `gachaLine` NO son los mismos en las dos: en `GachaPopup` hay
        // DOCE, colgando de `Gacha/LightEffect`, y en `GiftboxPopup` hay TRES, sueltos
        // bajo `GachaBall`. Contados en los volcados, no a ojo.
        const cuantos = RAYOS[cual] || 12;
        const rayos = document.createElement('div');
        rayos.style.cssText = 'position:absolute;width:' + px(700) + ';height:' + px(700) + ';'
            + 'pointer-events:none;animation:pop-gira 18s linear infinite';
        for (let i = 0; i < cuantos; i++) {
            const r = document.createElement('div');
            r.style.cssText = 'position:absolute;left:50%;top:50%;width:' + px(14) + ';'
                + 'height:' + px(360) + ';margin-left:' + px(-7) + ';'
                // Transparente en el centro y encendido hacia fuera: asi el rayo
                // sale de detras del premio en vez de taparlo.
                + 'background:linear-gradient(to top,rgba(255,255,255,0) 34%,'
                + 'rgba(255,255,255,.62) 78%,rgba(255,255,255,0));'
                + 'transform-origin:50% 0;transform:rotate('
                + ((i * 360) / cuantos).toFixed(2) + 'deg)';
            rayos.appendChild(r);
        }
        cap.appendChild(rayos);

        if (titulo) centro.appendChild(texto(titulo, 44, '#fff8ef'));
        const fila = document.createElement('div');
        fila.style.cssText = 'display:flex;gap:' + px(24) + ';';
        // `GiftboxPopup.furnRewards` es un `int[]` y la escena tiene TRES huecos.
        for (const id of (ids || []).slice(0, 3)) {
            const h = document.createElement('div');
            h.style.cssText = 'display:flex;flex-direction:column;align-items:center;'
                + 'gap:' + px(8) + ';';
            const im = icono(id, 1, 200);
            im.style.cssText += ';filter:drop-shadow(0 ' + px(6) + ' ' + px(10)
                + ' rgba(0,0,0,.45))';
            h.appendChild(im);
            h.appendChild(texto(nombreDe(id), 26, '#fff8ef'));
            fila.appendChild(h);
        }
        if (!(ids || []).length) centro.appendChild(texto('Sin premio.', 30, '#fff8ef'));
        centro.appendChild(fila);
        centro.appendChild(texto('La bola y la caja son un objeto 3D con su animación; '
            + 'el port no la puede abrir.', 22, 'rgba(255,248,239,.65)'));
        // `GiftBox/Pattern` es un `FixTileRawImage`: una TEXTURA en mosaico, no un sprite,
        // asi que no sale en el volcado y no se puede pedir por nombre. Queda el
        // `Backing` rojo con su `Blackout`, que es el 90 % de lo que se ve.

        cap.appendChild(centro);
        document.body.appendChild(cap);
        // `SFXClip`: la bola del gacha y la caja de regalo tienen los suyos.
        //   gacha   -> `gachaRoll` y luego `gachaReveal`
        //   regalo  -> `giftboxDrop` y luego `giftboxOpen`
        if (global.PlaySfx) {
            const esGacha = cual === 'gachapopup';
            global.PlaySfx.sonar(esGacha ? 'gachaRoll' : 'giftboxDrop');
            setTimeout(() => global.PlaySfx.sonar(esGacha ? 'gachaReveal' : 'giftboxOpen'), 360);
        }
        return cap;
    }

    function gacha(ids) { return premio('gachapopup', ids, 'Gacha'); }
    function regalo(ids) { return premio('giftboxpopup', ids, 'Regalo'); }

    // ── 7 y 8. DeedPopup y Petition: los dos papeles ────────────────────────

    /** El papel común: `roundedRect` crema con su contorno al 18 %. */
    function papel(ventana, ancho, alto) {
        const d = document.createElement('div');
        d.style.cssText = reb(ventana, 'papel')
            + 'position:relative;width:' + px(ancho) + ';max-height:88vh;overflow:auto;'
            + 'box-sizing:border-box;padding:' + px(46) + ';color:#3b3226;'
            + 'display:flex;flex-direction:column;gap:' + px(18) + ';'
            + 'animation:pop-entra .26s cubic-bezier(.2,1.25,.5,1)';
        return d;
    }

    /** Un renglón de firma: `PrimitiveShapesDashedO_4` repetido, en gris 0,77. */
    function renglon(ventana, nombre, alFirmar) {
        const f = document.createElement(alFirmar ? 'button' : 'div');
        f.style.cssText = 'position:relative;width:100%;text-align:left;border:none;'
            + 'background:none;font-family:inherit;padding:' + px(8) + ' 0 ' + px(18) + ';'
            + 'font-size:' + px(36) + ';color:#3b3226;'
            + (alFirmar ? 'cursor:pointer;' : '');
        const t = document.createElement('span');
        // Un `<button>` centra su contenido; con el `<span>` en bloque manda el
        // `text-align:left` del renglon y TSUKI queda alineado como las otras firmas.
        t.style.display = 'block';
        if (/<[a-z]/i.test(String(nombre)) && global.UIRender) {
            t.innerHTML = global.UIRender.tmp(nombre, spriteTMP);
        } else { t.textContent = nombre; }
        f.appendChild(t);
        const linea = document.createElement('span');
        const u = url('PrimitiveShapesDashedO_4');
        linea.style.cssText = 'position:absolute;left:0;right:0;bottom:0;height:' + px(8) + ';'
            + 'background-color:' + col(ventana, ventana === 'petition' ? 'renglon' : 'firma',
                                        'rgb(197,195,185)') + ';'
            + '-webkit-mask-image:url("' + u + '");mask-image:url("' + u + '");'
            + '-webkit-mask-repeat:repeat-x;mask-repeat:repeat-x;'
            + '-webkit-mask-size:auto 100%;mask-size:auto 100%';
        f.appendChild(linea);
        if (alFirmar) f.onclick = (ev) => { ev.stopPropagation(); alFirmar(t); };
        return f;
    }

    /**
     * `Petition`: 704,3 × 1255,1 de papel. Los nombres ya firmados están EN LA ESCENA, no
     * en la partida, así que se leen del volcado; el hueco de TSUKI es un `Button` y su
     * `Sign()` es lo que lo rellena.
     */
    function peticion() {
        if (typeof document === 'undefined') return null;
        const cap = capa('rgba(0,0,0,.45)');
        const d = papel('petition', 704, 1255);
        const ui = global.PlayPopups && global.PlayPopups._ui;

        // Los textos salen del volcado si esta cargado. Los de respaldo son los MISMOS,
        // copiados de `data/ui_petition.json`, para que sin red diga lo que dice la escena
        // y no algo parecido.
        const t = (ui && ui.petition) ? textosDe(ui.petition) : null;
        d.appendChild(texto((t && t.titulo) || TEXTOS.peticionTitulo, 40, '#3b3226',
                            'font-weight:700'));
        d.appendChild(texto((t && t.detalle) || TEXTOS.peticionDetalle, 24,
                            'rgba(59,50,38,.8)'));

        const firmas = (t && t.firmas && t.firmas.length) ? t.firmas
                                                             : TEXTOS.peticionFirmas;
        for (const f of firmas) d.appendChild(renglon('petition', f, null));

        let firmado = false;
        d.appendChild(renglon('petition', 'TSUKI', (span) => {
            if (firmado) return;
            firmado = true;
            span.style.fontStyle = 'italic';
            blurb('Firmada.');
        }));
        for (let i = 0; i < 5; i++) d.appendChild(renglon('petition', '', null));

        cap.appendChild(d);
        document.body.appendChild(cap);
        return cap;
    }

    /**
     * `DeedPopup`: 704,3 × 1051. Tiene `nameText`, `details`, `price`, `signatureText`,
     * `mortgageText`, un `slider` de hipoteca y los botones `signature` y `payMortgage`.
     *
     * El texto de la escena es de relleno —«Apartment 5B», «Lorem ipsum»—: el de verdad lo
     * pone el juego al abrirla, y no está en la partida. Se enseña la forma con sus huecos
     * dichos, no un contrato inventado.
     */
    function escritura(datos) {
        if (typeof document === 'undefined') return null;
        const o = datos || {};
        const cap = capa('rgba(0,0,0,.45)');
        const d = papel('deedpopup', 704, 1051);

        const cab = document.createElement('div');
        cab.style.cssText = 'display:flex;align-items:center;gap:' + px(20) + ';';
        const nom = texto(o.nombre || 'Apartment 5B', 48, '#3b3226', 'flex:1;font-weight:700');
        cab.appendChild(nom);
        // `floorplan`: el plano, un hueco de 250 al 9 % de negro.
        const plano = document.createElement('div');
        plano.style.cssText = reb('deedpopup', 'hueco')
            + 'width:' + px(250) + ';height:' + px(250) + ';display:flex;'
            + 'align-items:center;justify-content:center;font-size:' + px(22) + ';'
            + 'color:rgba(59,50,38,.5);text-align:center';
        plano.textContent = 'plano';
        cab.appendChild(plano);
        d.appendChild(cab);

        d.appendChild(texto(o.detalles
            || 'El texto de la escritura lo pone el juego al abrirla: no está en la '
             + 'partida, así que aquí sólo está la forma.', 36,
            o.detalles ? '#3b3226' : 'rgba(59,50,38,.7)'));

        // `price` y el `slider` de la hipoteca. En la escena ponen 500.000 y
        // «1000 / 500000»: es el ejemplo con el que se monto la ventana, no un dato de la
        // partida -el save no guarda ninguna escritura-, asi que se ensenan como ejemplo y
        // se dice.
        const precio = o.precio != null ? Number(o.precio) : 500000;
        const pagado = o.pagado != null ? Number(o.pagado) : 1000;
        const fila = document.createElement('div');
        fila.style.cssText = 'display:flex;align-items:center;gap:' + px(16) + ';';
        fila.appendChild(texto(precio.toLocaleString('en-US'), 44, '#3b3226',
                               'font-weight:800'));
        const barra = document.createElement('div');
        barra.style.cssText = 'flex:1;height:' + px(34) + ';border-radius:' + px(17) + ';'
            + 'overflow:hidden;position:relative;background:' + col('deedpopup', 'hueco',
                                                                   'rgba(0,0,0,.09)');
        const relleno = document.createElement('div');
        const parte = precio > 0 ? Math.max(0, Math.min(1, pagado / precio)) : 0;
        relleno.style.cssText = 'position:absolute;inset:0;width:'
            + (parte * 100).toFixed(2) + '%;background:rgba(122,160,110,.75)';
        barra.appendChild(relleno);
        const cuanto = texto(pagado + ' / ' + precio, 22, '#3b3226',
            'position:absolute;inset:0;display:flex;align-items:center;'
            + 'justify-content:center');
        barra.appendChild(cuanto);
        fila.appendChild(barra);
        d.appendChild(fila);

        d.appendChild(renglon('deedpopup', TEXTOS.escrituraFirma, (span) => {
            span.innerHTML = '<i>Tsuki</i>';
            blurb('Firmada.');
        }));
        d.appendChild(texto(TEXTOS.escrituraAgencia, 16, 'rgba(59,50,38,.6)',
                            'letter-spacing:.2em;text-align:right'));

        // `Pay {0}`: el `{0}` es el pago de cada plazo -en la escena, «+500»-.
        const plazo = o.plazo != null ? Number(o.plazo) : 500;
        const pagar = boton(TEXTOS.escrituraPagar.replace('{0}', String(plazo)),
                            reb('deedpopup', 'pagar'), () => {
            blurb('La escritura no esta en la partida: no hay hipoteca que pagar.');
        });
        pagar.style.alignSelf = 'stretch';
        d.appendChild(pagar);

        cap.appendChild(d);
        document.body.appendChild(cap);
        return cap;
    }

    /** Los textos de un volcado, por si está cargado; si no, los de respaldo. */
    function textosDe(doc) {
        if (!doc || !doc.arbol) return null;
        const t = [];
        (function anda(n) {
            for (const c of (n.comp || [])) {
                if (c.tipo === 'TextMeshProUGUI' && c.texto) t.push(c.texto);
            }
            for (const h of n.hijos || []) anda(h);
        })(doc.arbol);
        if (!t.length) return null;
        return { titulo: t[0], detalle: t[1], firmas: t.slice(2, 7) };
    }

    // ── 9. OptionsPopup ────────────────────────────────────

    /**
     * Las filas de `OptionsPopup`, con su rotulo tal cual esta en la escena.
     *
     * `save` dice el campo de `TsukiSave` que la guarda; sin `save`, es del aparato y no
     * esta en la partida — y eso se dice en pantalla, no se finge —.
     */
    const AJUSTES = [
        { et: 'language',         val: 'English',  tipo: 'texto' },
        { et: 'music',            tipo: 'nivel' },
        { et: 'force music',      tipo: 'si/no',   save: 'forceMusic' },
        { et: 'sfx',              tipo: 'nivel' },
        { et: 'minimal sfx',      tipo: 'si/no' },
        { et: 'haptics',          tipo: 'si/no',   save: 'hapticsEnabled' },
        { et: 'notifications',    tipo: 'si/no' },
        { et: 'conserve battery', tipo: 'si/no',   save: 'conserveBattery' },
        { et: 'reduce motion',    tipo: 'si/no',   save: 'reduceMotion' },
        { et: 'finger offset',    tipo: 'nivel',   save: 'fingerOffset' },
        { et: 'pester system',    tipo: 'si/no',   save: 'pesterMode' },
    ];

    /** Un interruptor, con el aspecto del `AnimatedToggle` de la escena. */
    function interruptor(encendido, alCambiar) {
        const b = document.createElement('button');
        const pinta = () => {
            b.style.cssText = 'width:' + px(96) + ';height:' + px(52) + ';border:none;'
                + 'border-radius:' + px(26) + ';cursor:pointer;position:relative;'
                + 'background:' + (encendido ? 'rgb(122,160,110)' : 'rgba(0,0,0,.18)') + ';'
                + 'transition:background .15s';
            b.innerHTML = '';
            const bola = document.createElement('span');
            bola.style.cssText = 'position:absolute;top:' + px(6) + ';left:'
                + px(encendido ? 50 : 6) + ';width:' + px(40) + ';height:' + px(40) + ';'
                + 'border-radius:50%;background:#fff;transition:left .15s';
            b.appendChild(bola);
        };
        pinta();
        b.onclick = (ev) => {
            ev.stopPropagation();
            encendido = !encendido;
            pinta();
            alCambiar(encendido);
        };
        return b;
    }

    /**
     * `OptionsPopup`: lo que abre el engranaje de la barra.
     *
     * NO es la app Ajustes del telefono —esa es `OptionsApp` y personaliza el telefono—.
     * Esta es la de siempre: idioma, volumenes, hapticos, bateria, movimiento, el desfase
     * del dedo y el sistema de insistencia.
     */
    function ajustes() {
        if (typeof document === 'undefined') return null;
        const p = parser();
        const guard = (p && p.getSettings) ? p.getSettings() : {};
        const cap = capa('rgba(0,0,0,.45)');

        const d = document.createElement('div');
        d.style.cssText = 'background:#fdfbf7;border:' + px(6) + ' solid rgb(74,68,59);'
            + 'border-radius:' + px(44) + ';padding:' + px(34) + ' ' + px(38) + ';'
            + 'width:' + px(760) + ';max-width:92vw;max-height:86vh;overflow:auto;'
            + 'box-sizing:border-box;color:rgb(74,68,59);'
            + 'display:flex;flex-direction:column;gap:' + px(14) + ';'
            + 'animation:pop-entra .22s cubic-bezier(.2,1.25,.5,1)';

        for (const a of AJUSTES) {
            const fila = document.createElement('div');
            fila.style.cssText = 'display:flex;align-items:center;gap:' + px(16) + ';'
                + 'min-height:' + px(56) + ';';
            const et = texto(a.et, 30);
            et.style.flex = '1';
            fila.appendChild(et);

            const guardado = a.save ? guard[a.save] : undefined;
            if (a.tipo === 'si/no') {
                fila.appendChild(interruptor(!!guardado, (v) => {
                    if (!a.save || !p || !p.writeGeneralVar) return;
                    try { p.writeGeneralVar(a.save, v); } catch (e) {}
                }));
            } else if (a.tipo === 'nivel') {
                const r = document.createElement('input');
                r.type = 'range'; r.min = '0'; r.max = '100';
                r.value = String(a.save && guardado != null
                    ? Math.round(Number(guardado) * 100) : 80);
                r.style.width = px(280);
                r.oninput = () => {
                    if (!a.save || !p || !p.writeGeneralVar) return;
                    try { p.writeGeneralVar(a.save, Number(r.value) / 100); } catch (e) {}
                };
                fila.appendChild(r);
            } else {
                fila.appendChild(texto(a.val || '', 30, 'rgba(74,68,59,.7)'));
            }
            if (!a.save) {
                const n = texto('del aparato', 20, 'rgba(74,68,59,.45)');
                n.style.width = px(150);
                n.style.textAlign = 'right';
                fila.appendChild(n);
            }
            d.appendChild(fila);
        }

        // La parte de cuenta y compras: existe en la ventana y NO esta en la partida.
        const linea = document.createElement('div');
        linea.style.cssText = 'height:' + px(4) + ';background:rgba(74,68,59,.15);'
            + 'margin:' + px(8) + ' 0;';
        d.appendChild(linea);
        d.appendChild(texto('Sign In · Achievements · Export · Import · '
            + 'Restore Purchases · Logout · Privacy Options', 22,
            'rgba(74,68,59,.55)'));
        d.appendChild(texto('Esa mitad de la ventana es cuenta, nube y compras: no esta en '
            + 'el `.csave`, asi que el port no la puede reproducir.', 20,
            'rgba(74,68,59,.45)'));
        d.appendChild(texto('0.1.45 (145)', 20, 'rgba(74,68,59,.45)',
                            'text-align:right'));

        cap.appendChild(d);
        document.body.appendChild(cap);
        if (global.PlaySfx) global.PlaySfx.sonar('phoneAppTap');
        return cap;
    }

    function estilos() {
        if (document.getElementById('popup-estilos')) return;
        const st = document.createElement('style');
        st.id = 'popup-estilos';
        st.textContent = '@keyframes pop-entra{from{opacity:0;transform:translateY(20px)}}'
            + '@keyframes pop-premio{from{opacity:0;transform:scale(.6)}}'
            + '@keyframes pop-gira{to{transform:rotate(360deg)}}'
            + '#' + ID + ' button:active{transform:scale(.98)}';
        document.head.appendChild(st);
    }

    global.PlayPopups = {
        ID, ESC,
        _ui: {},
        cargar, cerrar,
        blurb, diario, cropBox, almacen, gacha, regalo, peticion, escritura, ajustes,
        premio, textosDe, precioDe,
    };

    // El volcado de la petición trae sus firmas; se carga si se puede.
    if (typeof fetch === 'function') {
        fetch('data/ui_petition.json').then(r => (r.ok ? r.json() : null))
            .then(j => { if (j) global.PlayPopups._ui.petition = j; })
            .catch(() => {});
    }
})(typeof window !== 'undefined' ? window : globalThis);
