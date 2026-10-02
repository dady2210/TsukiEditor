/* play_mail_ui.js — el buzón y el sobre, las dos ventanas del correo.
 *
 * ────────────────────────────────────────────────────────────────────────────
 *  QUE HABIA
 * ────────────────────────────────────────────────────────────────────────────
 * `play_mail.js` tiene toda la lógica —leer, cobrar, contar lo que falta— pero **ninguna
 * ventana**: al tocar el buzón salía un menú de burbujas con una acción por carta. En el
 * juego son dos ventanas de verdad, `Mailbox` y `Envelope`, las dos en `level14`.
 *
 * Esta es la PRIMERA que se construye en vez de re-vestir, porque el port no tenía nada
 * que vestir. El patrón que deja para las otras ocho: montar la ventana con la paleta de
 * `data/ui_paleta.json` y engancharla al módulo de lógica que ya existe, sin tocar ese
 * módulo.
 *
 * ────────────────────────────────────────────────────────────────────────────
 *  `Mailbox`, de `data/ui_mailbox.json` (110 nodos)
 * ────────────────────────────────────────────────────────────────────────────
 *     Mailbox            600 de ancho, `roundedRect` marrón (0,47 0,32 0,29)
 *       Tab              `PrimitiveRoundDiamonds_4`: el pico de abajo
 *       Image            `roundedRect` salmón (0,78 0,52 0,42)  <- «mailbox»
 *         Text (TMP)     «mailbox», 36
 *         Scroll View    la lista de cartas, con `furnitureIcons_69` si está vacía
 *       Deliveries       «Parcel Deliveries»   `DeliveryMinigame`
 *       CodeBox          «Express Delivery»    `CodeBoxTab`
 *       LostAndFound     «Lost and Found»
 *
 * ────────────────────────────────────────────────────────────────────────────
 *  `Envelope`, de `data/ui_envelope.json` (34 nodos)
 * ────────────────────────────────────────────────────────────────────────────
 *     Envelope       820×450   `envelope_0` en 9 rebanadas de 46
 *       Rear                   `roundedRect` (0,77 0,75 0,70)
 *       LetterDisplay  800×400 `roundedRect` crema (0,99 0,98 0,91)
 *         Author               «From: RapBot», 24
 *         Text                 el cuerpo de la carta, 32
 *         Inventory            rejilla de `Slot`, círculos crema
 *         Button               «Claim All»
 *       EnvelopeFront          `envelope_5..8`: el frente y su filo
 *       Flap                   `envelope_2..4`: la solapa, que se abre
 *
 * ────────────────────────────────────────────────────────────────────────────
 *  LO QUE NO SE PUEDE ENSEÑAR, Y SE DICE
 * ────────────────────────────────────────────────────────────────────────────
 * **El texto de la carta no está extraído.** El save guarda `type`, `read`, `opened`,
 * `carrotReward`, `orderID`, `deliveryVariant` y los huecos, pero las palabras viven en un
 * `LetterData` que nadie ha sacado todavía. Así que el sobre enseña de quién es por su
 * tipo, lo que trae y lo que paga —que es lo que decide qué hacer con ella— y dice que el
 * texto falta, en vez de inventarse una carta.
 *
 * El minijuego de reparto (`DeliveryMinigame`) y el `CodeBox` de códigos promocionales
 * tampoco: el primero es un minijuego entero y el segundo pide un servidor. Salen con su
 * rótulo de verdad y dicen lo que son.
 */
(function (global) {
    'use strict';

    const ID_BUZON = 'buzon-real';
    const ID_SOBRE = 'sobre-real';
    const ESC = 0.62;          // el juego dibuja en un lienzo mayor que el hueco del port

    function P() { return global.PlayUIWindows; }
    function px(v) { return Math.round(v * ESC) + 'px'; }

    /** El color de una parte de la paleta, o el respaldo si aún no cargó. */
    function col(ventana, nombre, respaldo) {
        const p = P();
        return p ? p.color(ventana, nombre, respaldo) : (respaldo || 'transparent');
    }
    function rebanadas(ventana, nombre) {
        const p = P();
        return p ? p.rebanadas(ventana, nombre, ESC) : '';
    }
    function url(n) {
        const p = P();
        return p ? p.url(n) : ('images/ui/ventanas/' + n + '.png');
    }

    async function cargar() {
        // Las cartas con guion se piden a la vez que la paleta: sin ellas el sobre no
        // sabe lo que dice la carta.
        cargarCartas();
        if (P() && P().paleta) return true;
        if (P()) return P().cargar();
        return false;
    }

    function cerrar() {
        for (const id of [ID_SOBRE, ID_BUZON]) {
            const e = typeof document !== 'undefined' ? document.getElementById(id) : null;
            if (e) e.remove();
        }
        return true;
    }

    function cerrarSobre() {
        const e = document.getElementById(ID_SOBRE);
        if (e) e.remove();
        // `SFXClip.MailboxClose`, que es el del buzon y no el de una app del telefono.
        if (global.PlaySfx) global.PlaySfx.sonar('mailboxClose');
        return true;
    }

    function capa(id) {
        const c = document.createElement('div');
        c.id = id;
        c.style.cssText = 'position:fixed;inset:0;z-index:100003;display:flex;'
            + 'align-items:center;justify-content:center;background:rgba(0,0,0,.5)';
        return c;
    }

    /**
     * El `type` que trae el save es el nombre de tipo de Odin entero
     * -«OrderLetter, Odyssey»-: en pantalla sobra el ensamblado.
     */
    // Las cartas con guion, de `data/letters.json`. Se piden una vez.
    let cartasGuion = null;

    function cargarCartas() {
        if (cartasGuion || typeof fetch !== 'function') return Promise.resolve(cartasGuion);
        return fetch('data/letters.json')
            .then(r => (r.ok ? r.json() : null))
            .then(j => { cartasGuion = (j && j.cartas) || {}; return cartasGuion; })
            .catch(() => { cartasGuion = {}; return cartasGuion; });
    }

    /**
     * El texto de una carta, o null si no es de las que lo tienen.
     *
     * `Letter.scriptedNum` es el numero de la carta con guion, y `Letter.IsScripted(int)`
     * compara contra el. Las cinco estan en `data/letters.json`; una de ellas viene vacia
     * en el propio juego.
     */
    function textoDeCarta(c) {
        if (!c || !cartasGuion) return null;
        const n = c.scriptedNum;
        if (n == null || Number(n) < 0) return null;
        const e = cartasGuion[String(n)];
        const t = e && e.texto;
        if (!t) return null;
        const idioma = (global.DialogueManager && global.DialogueManager.currentLang) || 'sp';
        return (idioma === 'sp' ? (t.sp || t.en) : (t.en || t.sp)) || null;
    }

    function claseDeCarta(c) {
        const t = c && c.type;
        if (!t) return null;
        return String(t).split(',')[0].trim();
    }

    function texto(t, tam, color) {
        const d = document.createElement('div');
        d.style.cssText = 'font-size:' + px(tam || 32) + ';line-height:1.3;'
            + 'color:' + (color || '#3b3226');
        d.textContent = t;
        return d;
    }

    /** Un rótulo de sección del buzón, con el color salmón de la escena. */
    function seccion(titulo, dentro) {
        const s = document.createElement('div');
        s.style.cssText = rebanadas('mailbox', 'interior')
            + 'padding:' + px(20) + ';display:flex;flex-direction:column;gap:' + px(10) + ';';
        const t = document.createElement('div');
        t.style.cssText = 'font-size:' + px(36) + ';font-weight:700;color:#fff8ef';
        t.textContent = titulo;
        s.appendChild(t);
        if (dentro) s.appendChild(dentro);
        return s;
    }

    // ── El buzón ────────────────────────────────────────────────────────────

    /**
     * `Mailbox`: la lista de cartas y las tres secciones de abajo.
     */
    async function abrirBuzon() {
        if (typeof document === 'undefined') return null;
        await cargar();
        cerrar();

        const cap = capa(ID_BUZON);
        cap.addEventListener('click', (e) => { if (e.target === cap) cerrar(); });

        const panel = document.createElement('div');
        panel.style.cssText = rebanadas('mailbox', 'panel')
            + 'width:' + px(600) + ';max-height:88vh;overflow:auto;box-sizing:border-box;'
            + 'padding:' + px(20) + ';display:flex;flex-direction:column;gap:' + px(14) + ';';

        // `Image`: la sección «mailbox» con la lista.
        const lista = document.createElement('div');
        lista.style.cssText = 'display:flex;flex-direction:column;gap:' + px(10) + ';';
        const cartas = (global.PlayMail && global.PlayMail.cartas) ? global.PlayMail.cartas() : [];
        if (!cartas.length) {
            const vacio = document.createElement('div');
            vacio.style.cssText = 'display:flex;flex-direction:column;align-items:center;'
                + 'gap:' + px(10) + ';padding:' + px(24) + ' 0;opacity:.6';
            const im = document.createElement('img');
            im.src = url('furnitureIcons_69');
            im.style.cssText = 'width:' + px(72) + ';height:' + px(72) + ';opacity:.5';
            im.onerror = () => { im.style.display = 'none'; };
            vacio.appendChild(im);
            vacio.appendChild(texto('No hay cartas.', 28, '#fff8ef'));
            lista.appendChild(vacio);
        }
        cartas.forEach((c, i) => lista.appendChild(filaDeCarta(c, i)));
        panel.appendChild(seccion('mailbox', lista));

        // `Deliveries`, `CodeBox` y `LostAndFound`, con sus rótulos de verdad.
        panel.appendChild(seccion('Parcel Deliveries',
            texto('Es un minijuego de reparto (`DeliveryMinigame`). No está portado.',
                  24, 'rgba(255,248,239,.8)')));
        panel.appendChild(seccion('Express Delivery',
            texto('Canjear un código pide el servidor del juego.',
                  24, 'rgba(255,248,239,.8)')));
        panel.appendChild(seccion('Lost and Found', perdidos()));

        cap.appendChild(panel);
        document.body.appendChild(cap);
        if (global.PlaySfx) global.PlaySfx.sonar('mailboxOpen');
        return cap;
    }

    /** Una carta en la lista: su estado y lo que trae. */
    function filaDeCarta(c, i) {
        const f = document.createElement('button');
        f.style.cssText = 'display:flex;align-items:center;gap:' + px(14) + ';'
            + 'border:none;cursor:pointer;text-align:left;width:100%;'
            + 'padding:' + px(14) + ' ' + px(18) + ';border-radius:' + px(28) + ';'
            + 'background:' + col('envelope', 'carta', '#fdfae8') + ';color:#3b3226;'
            + 'font-family:inherit;';
        const ic = document.createElement('img');
        ic.src = url('furnitureIcons_60');
        ic.style.cssText = 'width:' + px(56) + ';height:' + px(56) + ';object-fit:contain';
        ic.onerror = () => { ic.style.display = 'none'; };
        const t = document.createElement('div');
        t.style.cssText = 'flex:1';
        const n = document.createElement('div');
        n.style.cssText = 'font-size:' + px(30) + ';font-weight:' + (c.pendiente ? '700' : '400');
        n.textContent = 'Carta ' + (i + 1) + (claseDeCarta(c) ? ' · ' + claseDeCarta(c) : '');
        const s = document.createElement('div');
        s.style.cssText = 'font-size:' + px(24) + ';opacity:.75';
        const trae = [];
        if ((c.objetos || c.slots || []).length) trae.push((c.objetos || c.slots).length + ' objetos');
        if (Number(c.zanahorias || c.carrotReward)) trae.push((c.zanahorias || c.carrotReward) + ' zanahorias');
        s.textContent = (c.pendiente ? 'sin leer' : 'leída')
            + (trae.length ? ' · trae ' + trae.join(' y ') : '');
        t.appendChild(n); t.appendChild(s);
        f.appendChild(ic); f.appendChild(t);
        if (c.pendiente) {
            const punto = document.createElement('span');
            punto.style.cssText = 'width:' + px(20) + ';height:' + px(20) + ';border-radius:50%;'
                + 'background:' + col('mailbox', 'panel', '#78514a');
            f.appendChild(punto);
        }
        f.onclick = (ev) => { ev.stopPropagation(); abrirSobre(i); };
        return f;
    }

    /** `LostAndFound`: lo que el save guarda en `lostItems`. */
    function perdidos() {
        const d = document.createElement('div');
        const p = global.app && global.app.parser;
        let n = 0;
        try {
            const nodo = p && p._findNodesInAST ? p._findNodesInAST('lostItems')[0] : null;
            const lista = nodo && nodo.children
                ? nodo.children.find(c => c.constructor.name === 'OdinList') : null;
            n = (lista && lista.elements) ? lista.elements.length : 0;
        } catch (e) { n = 0; }
        d.appendChild(texto(n ? (n + ' objetos guardados.') : 'No hay nada perdido.',
                            24, 'rgba(255,248,239,.85)'));
        return d;
    }

    // ── El sobre ────────────────────────────────────────────────────────────

    /**
     * `Envelope`: el sobre con su solapa, la carta dentro y «Claim All».
     *
     * Abrirlo marca la carta leída (`MailboxFurniture.QuickTap`), que es lo que quita el
     * aviso del buzón; cobrarla entrega los objetos y las zanahorias.
     */
    function abrirSobre(indice) {
        if (typeof document === 'undefined') return null;
        const M = global.PlayMail;
        const c = M && M.cartas ? M.cartas()[indice] : null;
        if (!c) return null;

        const viejo = document.getElementById(ID_SOBRE);
        if (viejo) viejo.remove();
        const cap = capa(ID_SOBRE);
        cap.style.zIndex = '100004';
        cap.addEventListener('click', (e) => { if (e.target === cap) cerrarSobre(); });

        // `Envelope` 820×450: el sobre.
        const sobre = document.createElement('div');
        sobre.style.cssText = rebanadas('envelope', 'sobre')
            + 'position:relative;width:' + px(820) + ';box-sizing:border-box;'
            + 'padding:' + px(26) + ';animation:sobre-entra .26s cubic-bezier(.2,1.3,.5,1)';

        // `LetterDisplay`: la hoja de dentro.
        const hoja = document.createElement('div');
        hoja.style.cssText = rebanadas('envelope', 'carta')
            + 'position:relative;box-sizing:border-box;padding:' + px(28) + ';'
            + 'display:flex;flex-direction:column;gap:' + px(14) + ';color:#3b3226;';

        const autor = document.createElement('div');
        autor.style.cssText = 'font-size:' + px(24) + ';opacity:.7';
        autor.textContent = 'Carta de tipo ' + (claseDeCarta(c) || '?')
            + (c.orderID != null ? ' · pedido ' + c.orderID : '');
        hoja.appendChild(autor);

        // EL TEXTO, CUANDO LO HAY.
        //
        // Las cartas con guion (`ScriptedLetter`) sí lo tienen, y sale de
        // `data/letters.json`: son CINCO en todo el juego y `Letter.scriptedNum` dice
        // cuál. Los pedidos y los paquetes NO llevan texto escrito —el juego los
        // compone—, así que para esos se sigue diciendo que no hay en vez de inventarlo.
        const cuerpo = document.createElement('div');
        cuerpo.style.cssText = 'font-size:' + px(30) + ';line-height:1.35;';
        const txt = textoDeCarta(c);
        if (txt) {
            cuerpo.innerHTML = global.UIRender ? global.UIRender.tmp(txt) : txt;
        } else {
            cuerpo.style.cssText += 'opacity:.7;font-style:italic';
            cuerpo.textContent = 'Un pedido no lleva texto escrito: el juego lo compone '
                + 'con lo que trae. Lo que trae está debajo.';
        }
        hoja.appendChild(cuerpo);

        // `Inventory`: los huecos, en círculo.
        const huecos = c.objetos || c.slots || [];
        if (huecos.length) {
            const rej = document.createElement('div');
            rej.style.cssText = rebanadas('envelope', 'ranuras')
                + 'display:flex;flex-wrap:wrap;gap:' + px(12) + ';padding:' + px(14) + ';';
            for (const s of huecos) {
                const id = Number(s.id);
                const h = document.createElement('div');
                h.title = 'objeto ' + id + ' ×' + (s.qty || 1);
                h.style.cssText = 'position:relative;width:' + px(80) + ';height:' + px(80) + ';'
                    + 'border-radius:50%;display:flex;align-items:center;justify-content:center;'
                    + 'background:' + col('envelope', 'ranura', '#fdfae8') + ';';
                const im = document.createElement('img');
                im.src = 'images/items/' + (Number(s.invType) === 0 ? 'ITEM_' : 'FURN_') + id + '.png';
                im.style.cssText = 'max-width:78%;max-height:78%;object-fit:contain';
                im.onerror = () => {
                    im.onerror = () => { im.replaceWith(document.createTextNode(String(id))); };
                    im.src = 'images/items/' + (Number(s.invType) === 0 ? 'FURN_' : 'ITEM_') + id + '.png';
                };
                h.appendChild(im);
                if (Number(s.qty) > 1) {
                    const q = document.createElement('span');
                    q.style.cssText = 'position:absolute;right:' + px(-4) + ';bottom:0;'
                        + 'background:' + col('envelope', 'carta', '#fdfae8') + ';'
                        + 'border-radius:999px;padding:0 ' + px(8) + ';font-size:' + px(22) + ';';
                    q.textContent = String(s.qty);
                    h.appendChild(q);
                }
                rej.appendChild(h);
            }
            hoja.appendChild(rej);
        }
        const premio = Number(c.zanahorias || c.carrotReward) || 0;
        if (premio) hoja.appendChild(texto(premio + ' zanahorias', 28));

        // `Button`: «Claim All».
        if (huecos.length || premio) {
            const b = document.createElement('button');
            b.style.cssText = rebanadas('envelope', 'boton')
                + 'border:none;cursor:pointer;padding:' + px(16) + ' 0;'
                + 'font-size:' + px(32) + ';color:#3b3226;font-family:inherit;font-weight:700;';
            b.textContent = 'Claim All';
            b.onclick = (ev) => {
                ev.stopPropagation();
                const r = M.recoger(indice);
                if (global.app && global.app.showToast) {
                    global.app.showToast(r.ok ? 'Recogido.' : (r.motivo || 'no se pudo'),
                                         r.ok ? 'success' : 'warning');
                }
                if (r.ok) { cerrarSobre(); abrirBuzon(); }
            };
            hoja.appendChild(b);
        } else {
            hoja.appendChild(texto('Esta carta no trae nada.', 26, 'rgba(59,50,38,.6)'));
        }

        sobre.appendChild(hoja);
        cap.appendChild(sobre);
        estilos();
        document.body.appendChild(cap);

        // `MailboxFurniture.QuickTap()`: abrirla la marca leída.
        if (c.pendiente && M.abrir) M.abrir(indice);
        if (global.PlaySfx) global.PlaySfx.sonar('mailboxOpen');
        return cap;
    }

    function estilos() {
        if (document.getElementById('correo-estilos')) return;
        const st = document.createElement('style');
        st.id = 'correo-estilos';
        st.textContent = '@keyframes sobre-entra{from{transform:scale(.8) translateY(30px);'
            + 'opacity:0}}#' + ID_BUZON + ' button:active,#' + ID_SOBRE
            + ' button:active{transform:scale(.98)}';
        document.head.appendChild(st);
    }

    global.PlayMailUI = {
        ID_BUZON, ID_SOBRE, ESC,
        cargar, abrirBuzon, abrirSobre, cerrar, cerrarSobre, claseDeCarta,
        cargarCartas, textoDeCarta,
    };
})(typeof window !== 'undefined' ? window : globalThis);
