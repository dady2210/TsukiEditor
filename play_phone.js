/* play_phone.js — el teléfono: la pantalla, sus seis apps y la lógica de cada una.
 *
 * ────────────────────────────────────────────────────────────────────────────
 *  DONDE ESTABA
 * ────────────────────────────────────────────────────────────────────────────
 * En **`level14`**, la escena del `UIController`. No está en ningún mapa ni en los bundles
 * de addressables, y por eso no aparecía; lo encontró `tools/cs_buscar_clase`. Volcado
 * entero en `data/ui_phone.json` —**563 nodos, 327 imágenes, 72 textos**— con sus 63
 * texturas en `images/ui/phone/`. Los iconos que faltaban (`furnitureIcons_*`) ya estaban
 * en `images/icons/bubbles/`.
 *
 * ────────────────────────────────────────────────────────────────────────────
 *  QUE HAY, PIEZA A PIEZA
 * ────────────────────────────────────────────────────────────────────────────
 *     Phone                          Animator + el script `Phone`
 *       Sparks                       6 SpriteRenderer: los destellos al aparecer
 *       PhoneObj
 *         phone (5)                  MeshFilter + MeshRenderer -> el MODELO 3D
 *         Canvas   667 x 1222        la pantalla
 *           Background               Image lisa, color (0,92453 0,91464 0,78934)
 *             Texture                FixTileRawImage 256x256: el patrón, que se DESPLAZA
 *           StatusBar                `roundedRect` negro al 25 %, tam (−64, 100)
 *             Layout/Signal          `furnitureIcons_55`
 *             Layout/Clock           TMP 42, texto `11:11<sup>AM</sup>`
 *             Layout/Battery         `furnitureIcons_18` + `BatteryFill` 19,87 de ancho
 *           Apps                     GridLayoutGroup 40x40, relleno 32/32/64/64
 *           Circle / carrotOS        el círculo de carga y el texto «carrotOS»
 *           Notification             NotificationOverlay
 *
 * Cada app es un `PhoneApp`: un cuadrado de 188 con `PrimitiveShapes SDF_0` en 9 rebanadas
 * (borde 64, ppu 160), su `circleRim` negro al 12 %, un icono de 160 y un punto de aviso.
 * Y cada una tiene SU COLOR, que sale de la escena:
 *
 *     Map .63,.82,.84   Punchcard .93,.49,.49   Parsnap .48,.44,.54
 *     Gacha .37,.83,.70  Compendium 1,.71,.37   Options .54,.54,.54
 *
 * ────────────────────────────────────────────────────────────────────────────
 *  LA LOGICA, DEL BINARIO
 * ────────────────────────────────────────────────────────────────────────────
 *   `Phone::OpenPhone` (0x57d8fd8) / `ClosePhone` (0x57da3d4) / `RevealApps` (0x57da0d8)
 *   `Phone::QuickOpen(int appNum)`  — el `QuickLaunchButton` de la barra
 *   `Phone::CanClose(out PhoneApp)` (0x57da5c0) — con una app abierta NO se cierra
 *   `Phone::LoadPhoneSave` (0x57d4130), `SetColorway` (0x57d9d08), `SetPattern` (0x57d9e04)
 *   `PhoneApp::Launch` (0x57da2b0) / `OpenApp` / `Close` / `NotAvailable` (0x57dec70)
 *
 * Y lo que guarda la partida —comprobado leyendo el `.csave` del usuario, no del `dump.cs`—:
 *
 *     phoneSave: skinID 171, bgPatternID 1, bgColorID 8, bgScrollX/Y 0,025,
 *                tiltFactor 0, disableSFX true, spoilerTag false, appLayout int[],
 *                backgroundsUnlocked 7, colorsUnlocked 7, newBackgrounds 0, newColors 0
 *
 * `backgroundsUnlocked` y `colorsUnlocked` son **máscaras de bits**: el bit
 * `1 << customizationIndex` de cada `IconManager.PhoneCustomization`.
 *
 * ────────────────────────────────────────────────────────────────────────────
 *  CUANDO SE DESBLOQUEA CADA APP  (`AppPopup.locked`, desensamblado)
 * ────────────────────────────────────────────────────────────────────────────
 *   `MapApp::get_locked`        (0x57ce2b4)  TutorialStep < 6
 *   `ParsnapApp::get_locked`    (0x57d4ef4)  TutorialStep < 6, y además la cámara tiene
 *                                            que estar en la lista de `TsukiSave`
 *   `PunchcardApp::get_locked`  (0x57e3ac4)  con tutorial en marcha, TutorialStep < 7
 *   `CompendiumApp::get_locked` (0x57c2e34)  `Tutorial.TutorialInProgress`, o sea paso < 9
 *   `OptionsApp::get_locked`    (0x57d2dbc)  igual
 *   `GachaApp::get_locked`      (0x57cd2a0)  ningún `GachaSet` desbloqueado
 *
 * ────────────────────────────────────────────────────────────────────────────
 *  LAS SEIS APPS: QUE HACEN DE VERDAD
 * ────────────────────────────────────────────────────────────────────────────
 *   Map         el mapa de la aldea DE VERDAD (`map_0` + `map_1`) con sus doce
 *               `AreaMapButton`, cada uno con su `linkedLocation` de la escena, en sus
 *               coordenadas de la escena. Tocar viaja con `Travel.viajar`, que es lo que
 *               hace `AreaMapButton::Travel`. Lo que sale y lo que no lo decide
 *               `locationsOnPhone` de la partida.
 *   Punchcard   `Progress.punchcard()` y `Progress.reclamarPunchcard()`: las siete
 *               casillas con su tipo y su modificador, y la semanal con su mueble.
 *   Parsnap     tres pestañas, como en la escena: Diarios, Cámara y Encargos. Los
 *               encargos salen de `parsnapSave` y se cobran con `Progress.reclamarParsnap`.
 *   Gacha       las estanterías de `data/gacha.json` con las bolas que ya se tienen,
 *               según la colección de la partida.
 *   Compendium  Objetos / Muebles / Peces con su buscador, contra la colección.
 *   Options     escribe en `phoneSave` de verdad: sonido, inclinación, desplazamiento del
 *               patrón y los selectores de patrón y color.
 *
 * LO QUE NO SE MODELA, Y SE DICE: el `phone (5)` es una malla 3D y aquí es una carcasa en
 * CSS, porque el port no tiene motor 3D; el giroscopio (`PhoneApp::HandleGyro`,
 * `tiltFactor`) no existe en un navegador de escritorio, así que la inclinación se guarda
 * pero no se nota; y la pestaña de Cámara de Parsnap hace una foto del juego en marcha,
 * que un editor de partidas no tiene.
 */
(function (global) {
    'use strict';

    const RUTA = 'images/ui/phone/';
    const RUTA_ICONOS = 'images/icons/bubbles/';
    const ID = 'telefono';

    // Los seis, en el orden de `Phone.apps`. `appLayout` de la partida los reordena.
    const APPS = [
        { clave: 'Map',        icono: 'mapIcon_0',        nombre: 'Mapa',      color: [0.63922, 0.82353, 0.83922] },
        { clave: 'Punchcard',  icono: 'punchcardIcon_0',  nombre: 'Tarjeta',   color: [0.93333, 0.49020, 0.49020] },
        { clave: 'Parsnap',    icono: 'instagramIcon_0',  nombre: 'Parsnap',   color: [0.47843, 0.43529, 0.53725] },
        { clave: 'Gacha',      icono: 'gachaIcon_0',      nombre: 'Gacha',     color: [0.36863, 0.82745, 0.70196] },
        { clave: 'Compendium', icono: 'compendium_0',     nombre: 'Compendio', color: [1, 0.71474, 0.37264] },
        { clave: 'Options',    icono: 'optionsIcon_0',    nombre: 'Ajustes',   color: [0.53774, 0.53774, 0.53774] },
    ];

    // Las medidas de la escena, tal cual.
    const PANTALLA = { ancho: 667, alto: 1222 };
    const APP = { caja: 188, icono: 160, hueco: 40, izq: 32, der: 32, arriba: 64, abajo: 64 };
    const BARRA = { alto: 100, margen: 64, y: 36 };     // StatusBar: tam (−64, 100), pos y 36
    // `Background` sin patrón ni color de la partida.
    const FONDO_ESCENA = [0.92453, 0.91464, 0.78934];

    let ui = null;          // data/ui_phone.json
    let customs = null;     // data/phone_customs.json (colores y patrones), si se extrajo
    // El intervalo que refresca el visor de la camara.
    let latidoVisor = null;
    let abierto = false;
    let appAbierta = null;
    let reloj = null;

    // ── datos ───────────────────────────────────────────────────────────────

    async function cargar() {
        if (ui) return true;
        try {
            const r = await fetch('data/ui_phone.json');
            if (!r.ok) return false;
            ui = await r.json();
        } catch (e) { return false; }
        // El catálogo de colores y patrones es aparte y puede no estar: el teléfono
        // funciona igual, con el color que trae la escena.
        if (!customs) {
            try {
                const r2 = await fetch('data/phone_customs.json');
                customs = r2.ok ? await r2.json() : null;
            } catch (e) { customs = null; }
        }
        return true;
    }

    function usarUI(d, c) { ui = d; if (c) customs = c; return !!ui; }

    let _porRuta = null;
    function nodo(ruta) {
        if (!ui || !ui.arbol) return null;
        if (!_porRuta) {
            _porRuta = {};
            (function anda(n) { _porRuta[n.ruta] = n; for (const h of n.hijos || []) anda(h); })(ui.arbol);
        }
        return _porRuta[ruta] || null;
    }

    function url(n) { return n ? RUTA + n + '.png' : null; }
    function urlIcono(n) { return n ? RUTA_ICONOS + n + '.png' : null; }
    function css(c) {
        if (!c) return 'transparent';
        const v = Array.isArray(c) ? { r: c[0], g: c[1], b: c[2], a: c[3] } : c;
        const q = (x) => Math.max(0, Math.min(255, Math.round((Number(x) || 0) * 255)));
        return 'rgba(' + q(v.r) + ',' + q(v.g) + ',' + q(v.b) + ','
             + (v.a == null ? 1 : Number(v.a)) + ')';
    }

    function parser() { return global.app && global.app.parser; }

    /** Lo que la partida guarda del teléfono, con los nodos para poder escribir. */
    function delSave() {
        const p = parser();
        if (!p) return null;
        let cos = null;
        try { cos = p.getPhoneCosmetics ? p.getPhoneCosmetics() : null; } catch (e) { cos = null; }
        let orden = null;
        try { orden = p.getPhoneAppLayout ? p.getPhoneAppLayout() : null; } catch (e) { orden = null; }
        let extra = null;
        try { extra = p.getPhoneSettings ? p.getPhoneSettings() : null; } catch (e) { extra = null; }
        return { cos, orden, extra };
    }

    /** `Tutorial.TutorialStep`. Sin partida se da por acabado, que es lo útil en un editor. */
    function pasoTutorial() {
        const p = parser();
        if (!p || typeof p.getTutorialStep !== 'function') return 99;
        try { const v = p.getTutorialStep(); return v == null ? 99 : Number(v); } catch (e) { return 99; }
    }

    /**
     * `AppPopup.locked` de cada app, con las reglas del desensamblado.
     * Devuelve el motivo, o null si está abierta.
     */
    function bloqueada(clave) {
        const paso = pasoTutorial();
        switch (clave) {
            case 'Map':
                return paso < 6 ? 'se abre en el paso 6 del tutorial' : null;
            case 'Parsnap':
                return paso < 6 ? 'se abre en el paso 6 del tutorial' : null;
            case 'Punchcard':
                // `TutorialInProgress && TutorialStep < 7`.
                return (paso < 9 && paso < 7) ? 'se abre en el paso 7 del tutorial' : null;
            case 'Compendium':
            case 'Options':
                return paso < 9 ? 'se abre al acabar el tutorial' : null;
            case 'Gacha': {
                // `GachaApp::get_locked`: ningún `GachaSet` desbloqueado.
                const g = global.Gacha;
                const sets = g && g.sets ? g.sets : [];
                return sets.length ? null : 'no hay ninguna colección de gacha disponible';
            }
            default: return null;
        }
    }

    /** El orden de la rejilla: `PhoneSave.appLayout`, y si no, el de la escena. */
    function ordenDeApps() {
        const s = delSave();
        const l = s && s.orden;
        if (!Array.isArray(l) || !l.length) return APPS.slice();
        const fuera = [];
        for (const i of l) {
            const a = APPS[Number(i)];
            if (a && fuera.indexOf(a) < 0) fuera.push(a);
        }
        for (const a of APPS) if (fuera.indexOf(a) < 0) fuera.push(a);
        return fuera;
    }

    /** El color de fondo: `IconManager.Colorway[bgColorID]` si se extrajo el catálogo. */
    function colorway() {
        const s = delSave();
        const id = s && s.cos ? Number(s.cos.bgColorID) : -1;
        if (customs && Array.isArray(customs.colorways)) {
            const c = customs.colorways.find(x => Number(x.id) === id);
            if (c) return c;
        }
        return null;
    }

    function patron() {
        const s = delSave();
        const id = s && s.cos ? Number(s.cos.bgPatternID) : -1;
        if (customs && Array.isArray(customs.patrones)) {
            const t = customs.patrones.find(x => Number(x.id) === id);
            if (t) return t;
        }
        return null;
    }

    /** `Phone::CanClose`: con una app abierta, el teléfono no se cierra. */
    function puedeCerrar() { return !appAbierta; }

    function cerrar(forzar) {
        if (!forzar && !puedeCerrar()) { cerrarApp(); return false; }
        const el = typeof document !== 'undefined' ? document.getElementById(ID) : null;
        if (el) el.remove();
        if (reloj) { clearInterval(reloj); reloj = null; }
        abierto = false;
        appAbierta = null;
        if (global.PlaySfx) global.PlaySfx.sonar('phoneButtonClose');
        return true;
    }

    /**
     * El reloj de la barra. La escena lo trae como `11:11<sup>AM</sup>`, o sea 12 horas
     * con el sufijo en pequeño; se reproduce igual, con la hora del juego.
     */
    function horaTexto() {
        let h = null, m = null;
        try {
            const c = global.GameTime && global.GameTime.now ? global.GameTime.now() : null;
            if (c) { h = Number(c.hour); m = Number(c.minute) || 0; }
        } catch (e) { /* sin reloj de juego */ }
        if (h == null) { const d = new Date(); h = d.getHours(); m = d.getMinutes(); }
        const suf = h < 12 ? 'AM' : 'PM';
        let h12 = h % 12; if (h12 === 0) h12 = 12;
        return { texto: String(h12) + ':' + String(m).padStart(2, '0'), sufijo: suf };
    }

    // ── el teléfono ─────────────────────────────────────────────────────────

    /**
     * `Phone::OpenPhone` + `RevealApps`. Con `{app:'Map'}` hace lo de
     * `Phone::QuickOpen(appNum)`: entra ya con esa app abierta.
     */
    async function abrir(opciones) {
        if (typeof document === 'undefined') return null;
        await cargar();
        cerrar(true);
        abierto = true;

        const cap = document.createElement('div');
        cap.id = ID;
        cap.style.cssText = 'position:fixed;inset:0;z-index:100002;display:flex;'
            + 'align-items:center;justify-content:center;background:rgba(0,0,0,.55)';
        cap.addEventListener('click', (e) => { if (e.target === cap) cerrar(); });

        const esc = Math.min(1, ((global.innerHeight || 900) - 40) / (PANTALLA.alto + 110));

        // La CARCASA. El `phone (5)` de la escena es una malla 3D con `Outline`,
        // `volume_down` y `volume_up`; aquí es una carcasa en CSS con sus dos botones.
        const carcasa = document.createElement('div');
        carcasa.style.cssText = 'position:relative;width:' + (PANTALLA.ancho + 52) + 'px;'
            + 'height:' + (PANTALLA.alto + 92) + 'px;border-radius:62px;'
            + 'background:linear-gradient(160deg,#4b4f57,#2c2f35);'
            + 'box-shadow:0 26px 60px rgba(0,0,0,.55), inset 0 0 0 6px #23262b;'
            + 'padding:46px 26px;box-sizing:border-box;'
            + 'transform:scale(' + esc + ');transform-origin:center center;'
            + 'animation:tel-entra .3s cubic-bezier(.2,1.25,.5,1)';
        for (const y of [300, 430]) {
            const b = document.createElement('div');
            b.style.cssText = 'position:absolute;left:-6px;top:' + y + 'px;width:8px;'
                + 'height:78px;border-radius:4px;background:#23262b';
            carcasa.appendChild(b);
        }

        // La PANTALLA: 667 x 1222 exactos.
        const pant = document.createElement('div');
        pant.id = 'tel-pantalla';
        pant.style.cssText = 'position:relative;width:100%;height:100%;border-radius:38px;'
            + 'overflow:hidden;display:flex;flex-direction:column';
        pintarFondo(pant);

        pant.appendChild(barraEstado());
        pant.appendChild(rejilla());

        carcasa.appendChild(pant);
        cap.appendChild(carcasa);
        inclinar(cap, carcasa, esc);
        destellos(cap);
        estilos();
        document.body.appendChild(cap);
        if (global.PlaySfx) global.PlaySfx.sonar('phoneButtonOpen');

        if (reloj) clearInterval(reloj);
        reloj = setInterval(() => {
            const n = document.getElementById('tel-reloj');
            if (!n) { clearInterval(reloj); reloj = null; return; }
            const t = horaTexto();
            n.innerHTML = t.texto + '<sup style="font-size:58%">' + t.sufijo + '</sup>';
        }, 1000);

        if (opciones && opciones.app) lanzar(opciones.app);
        return cap;
    }

    /**
     * `Background` + `Background/Texture`, o sea lo que hace `Phone::SetColorway`
     * (0x57d9d08) y `Phone::SetPattern` (0x57d9e04).
     *
     * El `Colorway` trae DOS colores: `color` es el fondo liso y `color2` es con el que
     * se pinta el patrón. Y el patrón es una textura de 512 **toda blanca con alfa**, así
     * que no se dibuja: se usa de máscara sobre una capa del segundo color. Pintarla tal
     * cual saldría blanca, que no es lo que hace el juego.
     */
    function pintarFondo(pant) {
        const c = colorway();
        pant.style.background = c && c.color ? css(c.color) : css(FONDO_ESCENA);
        const vieja = pant.querySelector('.tel-patron');
        if (vieja) vieja.remove();

        const t = patron();
        if (!t || !t.textura) return;
        // `FixTileRawImage` repite la textura a su tamaño por el `scale` del patrón.
        const lado = Math.round((Number(t.ancho) || 512) * (Number(t.escala) || 1));
        const capa = document.createElement('div');
        capa.className = 'tel-patron';
        const u = 'url("' + t.textura + '")';
        capa.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:0;'
            + 'background-color:' + css((c && c.color2) || [1, 1, 1, 0.25]) + ';'
            + '-webkit-mask-image:' + u + ';mask-image:' + u + ';'
            + '-webkit-mask-repeat:repeat;mask-repeat:repeat;'
            + '-webkit-mask-size:' + lado + 'px ' + lado + 'px;'
            + 'mask-size:' + lado + 'px ' + lado + 'px;';

        // `PhoneSave.ScrollSpeed`: el patrón se mueve, no está quieto.
        const s = delSave();
        const vx = s && s.extra ? Number(s.extra.bgScrollX) || 0 : 0;
        const vy = s && s.extra ? Number(s.extra.bgScrollY) || 0 : 0;
        if (vx || vy) {
            const seg = Math.max(4, Math.min(240, 8 / Math.max(Math.abs(vx), Math.abs(vy), 0.001)));
            capa.style.animation = 'tel-patron ' + seg.toFixed(1) + 's linear infinite';
            capa.style.setProperty('--px', (vx >= 0 ? 1 : -1) * lado + 'px');
            capa.style.setProperty('--py', (vy >= 0 ? -1 : 1) * lado + 'px');
        }
        pant.insertBefore(capa, pant.firstChild);
    }

    /** `StatusBar`: `roundedRect` negro al 25 %, con señal, reloj y batería. */
    function barraEstado() {
        const barra = document.createElement('div');
        barra.style.cssText = 'position:relative;z-index:1;margin:' + BARRA.y + 'px '
            + (BARRA.margen / 2) + 'px 0;height:' + BARRA.alto + 'px;flex:0 0 auto;'
            + 'border-radius:24px;background:rgba(0,0,0,.251);display:flex;'
            + 'align-items:center;justify-content:space-between;padding:0 16px;'
            + 'color:#fff;box-sizing:border-box';

        const senal = document.createElement('img');
        senal.src = urlIcono('furnitureIcons_55');
        senal.style.cssText = 'width:36px;height:36px;object-fit:contain';
        senal.onerror = () => { senal.style.display = 'none'; };

        const t = horaTexto();
        const rel = document.createElement('div');
        rel.id = 'tel-reloj';
        rel.style.cssText = 'font-size:42px;font-weight:700;line-height:1';
        rel.innerHTML = t.texto + '<sup style="font-size:58%">' + t.sufijo + '</sup>';

        // `Battery` es `furnitureIcons_18` y `BatteryFill` es `furnitureIcons_19`, que va
        // en modo Filled: se recorta por la izquierda según el nivel.
        const pila = document.createElement('div');
        pila.style.cssText = 'position:relative;width:52px;height:36px';
        const cuerpo = document.createElement('img');
        cuerpo.src = urlIcono('furnitureIcons_18');
        cuerpo.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:contain';
        cuerpo.onerror = () => { cuerpo.style.display = 'none'; };
        const carga = document.createElement('img');
        carga.src = urlIcono('furnitureIcons_19');
        carga.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;'
            + 'object-fit:contain;clip-path:inset(0 0 0 0)';
        carga.onerror = () => { carga.style.display = 'none'; };
        if (global.navigator && global.navigator.getBattery) {
            global.navigator.getBattery().then(b => {
                carga.style.clipPath = 'inset(0 ' + Math.round((1 - b.level) * 100) + '% 0 0)';
            }).catch(() => {});
        }
        pila.appendChild(cuerpo); pila.appendChild(carga);

        const der = document.createElement('div');
        der.style.cssText = 'display:flex;align-items:center;gap:10px';
        der.appendChild(pila);
        barra.appendChild(senal); barra.appendChild(rel); barra.appendChild(der);
        return barra;
    }

    /** `Apps`: el `GridLayoutGroup` de 188 con hueco 40 y relleno 32/32/64/64. */
    function rejilla() {
        const rej = document.createElement('div');
        rej.id = 'tel-rejilla';
        rej.style.cssText = 'position:relative;z-index:1;flex:1;display:grid;grid-template-columns:repeat(3,'
            + APP.caja + 'px);gap:' + APP.hueco + 'px;justify-content:center;'
            + 'align-content:start;padding:' + APP.arriba + 'px ' + APP.der + 'px '
            + APP.abajo + 'px ' + APP.izq + 'px;overflow:auto';

        ordenDeApps().forEach((a, i) => {
            const motivo = bloqueada(a.clave);
            const b = document.createElement('button');
            b.className = 'tel-app';
            b.dataset.app = a.clave;
            b.title = motivo ? (a.nombre + ' — ' + motivo) : a.nombre;
            // `PrimitiveShapes SDF_0` en 9 rebanadas con borde 64 y ppu 160: en un cuadro
            // de 188 el radio efectivo es 64 · (188/160) / 2. Un `border-radius` de 44 da
            // la misma esquina sin traer la textura.
            b.style.cssText = 'width:' + APP.caja + 'px;height:' + APP.caja + 'px;'
                + 'border:none;border-radius:44px;background:' + css(a.color) + ';'
                + 'box-shadow:inset 0 0 0 4px rgba(0,0,0,.122);'   // `Rim`: circleRim negro 12 %
                + 'display:flex;align-items:center;justify-content:center;cursor:pointer;'
                + 'padding:0;position:relative;opacity:0;transform:scale(.6);'
                // `Phone::RevealApps`: entran en cascada, con `offset` de 0,04.
                + 'animation:tel-app .26s ' + (0.04 + i * 0.04) + 's forwards '
                + 'cubic-bezier(.2,1.4,.5,1)';
            if (motivo) b.style.filter = 'grayscale(.85) brightness(.85)';

            const im = document.createElement('img');
            im.src = url(a.icono) || urlIcono(a.icono);
            im.style.cssText = 'width:' + APP.icono + 'px;height:' + APP.icono + 'px;'
                + 'object-fit:contain;pointer-events:none';
            im.onerror = () => { im.replaceWith(document.createTextNode(a.nombre)); };
            b.appendChild(im);

            // `Notification`: el punto de aviso, 72 con su `Dot` dentro.
            const n = avisos(a.clave);
            if (n) {
                const p = document.createElement('span');
                p.style.cssText = 'position:absolute;right:-8px;top:-8px;width:56px;'
                    + 'height:56px;border-radius:50%;background:' + css(FONDO_ESCENA) + ';'
                    + 'display:flex;align-items:center;justify-content:center;'
                    + 'font-weight:800;font-size:28px;color:#3b3226';
                p.textContent = n > 99 ? '99+' : String(n);
                b.appendChild(p);
            }

            b.onclick = (ev) => { ev.stopPropagation(); lanzar(a.clave); };
            rej.appendChild(b);
        });
        return rej;
    }

    /** `AppPopup.NotificationActive`: cuántas cosas pendientes tiene cada app. */
    function avisos(clave) {
        const P = global.Progress;
        try {
            if (clave === 'Punchcard' && P) {
                const pc = P.punchcard();
                return pc ? pc.pendientes : 0;
            }
            if (clave === 'Parsnap' && P) {
                const ps = P.parsnap();
                return ps ? ps.pendientes : 0;
            }
            if (clave === 'Map') {
                // `MapApp::get_NotificationActive` mira el correo y la cosecha.
                return P ? P.cartasPendientes() : 0;
            }
        } catch (e) { /* sin partida */ }
        return 0;
    }

    /**
     * La inclinación: `PhoneApp::HandleGyro(Vector3 attitude)` y `Phone.tiltFactor`.
     *
     * En el juego el teléfono se ladea siguiendo el giroscopio del móvil, y cuánto lo
     * hace lo dice `PhoneSave.tiltFactor` (50 por defecto en la escena; 0 en el save de
     * prueba, o sea desactivado).
     *
     * En un navegador hay dos fuentes y se usan las dos: `DeviceOrientationEvent` cuando
     * el aparato lo tiene —un móvil o una tableta—, y si no, **la posición del puntero**
     * sobre el teléfono, que es el equivalente de escritorio y responde igual de bien. Con
     * `tiltFactor` a 0 no se inclina nada, que es lo que manda la partida.
     */
    function inclinar(cap, carcasa, esc) {
        const s = delSave();
        const factor = s && s.extra ? Number(s.extra.tiltFactor) || 0 : 0;
        carcasa.style.transformStyle = 'preserve-3d';
        cap.style.perspective = '1400px';
        const base = 'scale(' + esc + ')';
        if (factor <= 0) return;                 // desactivado en la partida

        // `tiltFactor` 50 es el de la escena; se toma como el grado medio de ladeo.
        const grados = Math.max(0, Math.min(1, factor / 100)) * 18;
        let rx = 0, ry = 0, puesto = false;
        const aplicar = () => {
            puesto = false;
            carcasa.style.transform = base
                + ' rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg)';
        };
        const pedir = () => { if (!puesto) { puesto = true; requestAnimationFrame(aplicar); } };

        const conPuntero = (ev) => {
            const r = carcasa.getBoundingClientRect();
            const nx = (ev.clientX - (r.left + r.width / 2)) / (r.width / 2);
            const ny = (ev.clientY - (r.top + r.height / 2)) / (r.height / 2);
            ry = Math.max(-1, Math.min(1, nx)) * grados;
            rx = -Math.max(-1, Math.min(1, ny)) * grados;
            pedir();
        };
        cap.addEventListener('pointermove', conPuntero);

        // El giroscopio pisa al puntero en cuanto llega un evento suyo.
        const conGiro = (ev) => {
            if (ev.beta == null && ev.gamma == null) return;
            cap.removeEventListener('pointermove', conPuntero);
            // `beta` es el cabeceo y `gamma` el alabeo; se centra en la vertical.
            ry = Math.max(-1, Math.min(1, (Number(ev.gamma) || 0) / 45)) * grados;
            rx = -Math.max(-1, Math.min(1, ((Number(ev.beta) || 0) - 45) / 45)) * grados;
            pedir();
        };
        if (global.DeviceOrientationEvent) {
            global.addEventListener('deviceorientation', conGiro);
            // Al cerrar el teléfono hay que soltarlo: si no, se queda escuchando.
            const obs = new MutationObserver(() => {
                if (!document.getElementById(ID)) {
                    global.removeEventListener('deviceorientation', conGiro);
                    obs.disconnect();
                }
            });
            obs.observe(document.body, { childList: true });
        }
    }

    /** Los seis `Spark` de la escena, que salen disparados al aparecer el teléfono. */
    function destellos(cap) {
        for (let i = 0; i < 6; i++) {
            const sp = document.createElement('div');
            const ang = (i / 6) * Math.PI * 2;
            sp.style.cssText = 'position:absolute;left:50%;top:50%;width:16px;height:16px;'
                + 'margin:-8px 0 0 -8px;border-radius:50%;background:#fff8d0;'
                + 'box-shadow:0 0 14px #ffe98a;pointer-events:none;'
                + 'animation:tel-spark .5s ' + (i * 0.03) + 's forwards ease-out;'
                + '--dx:' + Math.round(Math.cos(ang) * 260) + 'px;'
                + '--dy:' + Math.round(Math.sin(ang) * 380) + 'px';
            cap.appendChild(sp);
        }
    }

    function estilos() {
        if (document.getElementById('tel-estilos')) return;
        const st = document.createElement('style');
        st.id = 'tel-estilos';
        st.textContent = '@keyframes tel-entra{from{transform:scale(.55) translateY(90px);'
            + 'opacity:0}}@keyframes tel-app{to{opacity:1;transform:scale(1)}}'
            + '@keyframes tel-spark{to{transform:translate(var(--dx),var(--dy)) scale(.2);'
            + 'opacity:0}}@keyframes tel-patron{to{-webkit-mask-position:var(--px) var(--py);'
            + 'mask-position:var(--px) var(--py)}}'
            + '@keyframes tel-sube{from{transform:translateY(100%)}}'
            + '@keyframes tel-flash{from{opacity:.95}to{opacity:0}}'
            + '.tel-app:active{transform:scale(.93)!important}'
            + '.tel-app:hover{filter:brightness(1.05)}'
            + '#telefono button{font-family:inherit}'
            + '.tel-fila{display:flex;align-items:center;gap:14px;padding:14px 18px;'
            + 'border-radius:22px;background:rgba(255,255,255,.72);color:#3b3226}'
            + '.tel-pest{flex:1;border:none;background:rgba(0,0,0,.18);color:#fff;'
            + 'padding:14px 0;font-size:30px;cursor:pointer;border-radius:18px}'
            + '.tel-pest.puesta{background:rgba(255,255,255,.85);color:#3b3226;font-weight:700}';
        document.head.appendChild(st);
    }

    // ── las apps ────────────────────────────────────────────────────────────

    /**
     * `PhoneApp::Launch` -> `OpenApp`. La app entra deslizando sobre la pantalla y tapa
     * la rejilla; mientras esté, `Phone::CanClose` dice que no.
     */
    function lanzar(clave) {
        const pant = document.getElementById('tel-pantalla');
        if (!pant) return false;
        const motivo = bloqueada(clave);
        if (motivo) {
            // `PhoneApp::NotAvailable`: la app existe pero no se abre todavía.
            aviso(pant, 'Todavía no: ' + motivo + '.');
            if (global.PlaySfx) global.PlaySfx.sonar('phoneAppTap');
            return false;
        }
        cerrarApp();
        const a = APPS.find(x => x.clave === clave);
        // `SFXClip.ParsnapPopup`: Parsnap tiene su propio sonido al abrirse; las demas
        // apps usan el de siempre.
        if (global.PlaySfx && clave === 'Parsnap') global.PlaySfx.sonar('parsnapPopup');
        const vista = document.createElement('div');
        vista.className = 'app-abierta';
        vista.dataset.app = clave;
        vista.style.cssText = 'position:absolute;inset:0;z-index:2;display:flex;'
            + 'flex-direction:column;'
            + 'background:' + css((colorway() && colorway().color) || FONDO_ESCENA) + ';'
            + 'animation:tel-sube .24s cubic-bezier(.2,.9,.3,1)';

        // La cabecera: el nombre y el botón de volver (`AppPopup::Close`).
        const cab = document.createElement('div');
        cab.style.cssText = 'flex:0 0 auto;display:flex;align-items:center;gap:14px;'
            + 'padding:34px 26px 14px;color:#fff;background:' + css(a.color);
        const atras = document.createElement('button');
        atras.textContent = '‹';
        atras.title = 'Volver';
        atras.style.cssText = 'width:64px;height:64px;border-radius:50%;border:none;'
            + 'background:rgba(255,255,255,.28);color:#fff;font-size:44px;line-height:1;'
            + 'cursor:pointer;padding:0';
        atras.onclick = (ev) => { ev.stopPropagation(); cerrarApp(); };
        const tit = document.createElement('div');
        tit.style.cssText = 'font-size:44px;font-weight:800';
        tit.textContent = a.nombre;
        cab.appendChild(atras); cab.appendChild(tit);
        vista.appendChild(cab);

        const cuerpo = document.createElement('div');
        cuerpo.style.cssText = 'flex:1;overflow:auto;padding:22px 26px 32px;'
            + 'display:flex;flex-direction:column;gap:16px';
        vista.appendChild(cuerpo);

        const pinta = {
            Map: appMapa, Punchcard: appTarjeta, Parsnap: appParsnap,
            Gacha: appGacha, Compendium: appCompendio, Options: appAjustes,
        }[clave];
        try { pinta(cuerpo); } catch (e) {
            cuerpo.appendChild(texto('No se pudo abrir: ' + (e && e.message)));
        }

        pant.appendChild(vista);
        appAbierta = clave;
        if (global.PlaySfx) global.PlaySfx.sonar('phoneAppOpen');
        return true;
    }

    /** `PhoneApp::Close` / `CloseAppSequence`. */
    function cerrarApp() {
        const pant = document.getElementById('tel-pantalla');
        const v = pant ? pant.querySelector('.app-abierta') : null;
        if (v) {
            v.remove();
            if (global.PlaySfx) global.PlaySfx.sonar('phoneAppClose');
        }
        appAbierta = null;
        // Los avisos cambian al cobrar cosas: se repinta la rejilla.
        if (pant) {
            const vieja = document.getElementById('tel-rejilla');
            if (vieja) { const nueva = rejilla(); vieja.replaceWith(nueva); }
        }
        return true;
    }

    /**
     * El color de la tinta sobre el fondo de la partida.
     *
     * El telefono no siempre es crema: el save de prueba lo lleva en «Bubblegum», que es
     * casi negro. Con la tinta fija en marron oscuro, los rotulos sueltos no se leian.
     * Se decide por la luminancia del `Colorway`, con los coeficientes de siempre.
     */
    function tinta() {
        const c = colorway();
        const v = (c && c.color) || FONDO_ESCENA;
        const lum = 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
        return lum < 0.5 ? '#f6f1e4' : '#3b3226';
    }

    function texto(t, tam) {
        const d = document.createElement('div');
        d.style.cssText = 'font-size:' + (tam || 30) + 'px;color:' + tinta()
            + ';line-height:1.35;position:relative;z-index:1';
        d.textContent = t;
        return d;
    }

    function aviso(pant, t) {
        let d = pant.querySelector('.tel-aviso');
        if (!d) {
            d = document.createElement('div');
            d.className = 'tel-aviso';
            d.style.cssText = 'position:absolute;left:24px;right:24px;bottom:34px;'
                + 'text-align:center;color:#fff;font-size:28px;background:rgba(0,0,0,.55);'
                + 'border-radius:20px;padding:16px 18px;z-index:5';
            pant.appendChild(d);
        }
        d.textContent = t;
        clearTimeout(d._t);
        d._t = setTimeout(() => d.remove(), 2600);
    }

    function pestanas(cuerpo, nombres, pintar) {
        const fila = document.createElement('div');
        fila.style.cssText = 'display:flex;gap:10px;flex:0 0 auto';
        const zona = document.createElement('div');
        zona.style.cssText = 'display:flex;flex-direction:column;gap:14px';
        nombres.forEach((n, i) => {
            const b = document.createElement('button');
            b.className = 'tel-pest' + (i === 0 ? ' puesta' : '');
            b.textContent = n;
            b.onclick = (ev) => {
                ev.stopPropagation();
                for (const o of fila.children) o.classList.remove('puesta');
                b.classList.add('puesta');
                zona.innerHTML = '';
                pintar(i, zona);
                if (global.PlaySfx) global.PlaySfx.sonar('phoneAppSwitchTab');
            };
            fila.appendChild(b);
        });
        cuerpo.appendChild(fila);
        cuerpo.appendChild(zona);
        pintar(0, zona);
    }

    // ── 1. Mapa ─────────────────────────────────────────────────────────────

    /**
     * `MapApp` + `AreaMap` + los doce `AreaMapButton`.
     *
     * El mapa de la aldea es `map_0` (1247,57 x 873,81) con `map_1` de faldón, y cada sitio
     * es un hijo con su `anchoredPosition` respecto al centro del mapa y su `mapIcons_N`.
     * El `linkedLocation` de cada uno es su `SLocation`, que es justo el id de sala que usa
     * el port. Aquí no se inventa nada: se leen del volcado.
     *
     * `AreaMapButton.ButtonState` es {Locked 0, Hidden 1, Revealed 2} y lo que decide es
     * `locationsOnPhone` de la partida: `ShowUnlockedLocations` va destapando los vistos.
     * Tocar llama a `AreaMapButton::Travel`, que aquí es `Travel.viajar` — el mismo viaje
     * que ya hacía el port, con su sonido `phoneAppTravel`.
     */
    function appMapa(cuerpo) {
        const raiz = 'Phone/PhoneObj/Canvas/Map/Backing/Scroll View/Viewport/FullMap/MushroomVillage';
        const mv = nodo(raiz);
        const p = parser();
        const vistos = new Set();
        try {
            for (const l of ((p && p.getLocationsOnPhone && p.getLocationsOnPhone()) || [])) {
                if (l && l.seen) vistos.add(Number(l.id));
            }
        } catch (e) { /* save sin teléfono */ }
        const aqui = (global.PlayButtons && global.PlayButtons.sala)
            ? global.PlayButtons.sala()
            : (p && p.currentSLocation != null ? Number(p.currentSLocation) : null);

        if (!mv) {
            cuerpo.appendChild(texto('No está `data/ui_phone.json`, así que no hay mapa que dibujar.'));
            return;
        }

        const W = mv.tam.x, H = mv.tam.y;
        // La pantalla mide 667 y el mapa 1247: se encoge para que quepa entero.
        const esc = (PANTALLA.ancho - 52) / W;
        const lienzo = document.createElement('div');
        lienzo.style.cssText = 'position:relative;width:' + Math.round(W * esc) + 'px;'
            + 'height:' + Math.round(H * esc) + 'px;margin:0 auto;flex:0 0 auto';

        const fondo = document.createElement('img');
        fondo.src = url('map_0');
        fondo.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;'
            + 'object-fit:contain;pointer-events:none';
        lienzo.appendChild(fondo);

        for (const h of mv.hijos || []) {
            const amb = (h.comp || []).find(
                c => c.tipo === 'AreaMapButton' || c.tipo === 'FarmMapButton' || c.tipo === 'MailMapButton');
            const img = (h.comp || []).find(c => c.tipo === 'Image' && c.sprite);
            if (!amb) {
                // `Bottom` es el faldón del mapa (`map_1`), no un botón.
                if (img && img.sprite.nombre === 'map_1') {
                    const f = document.createElement('img');
                    f.src = url('map_1');
                    f.style.cssText = 'position:absolute;left:' + ((W / 2 + h.pos.x) * esc - h.tam.x * esc / 2)
                        + 'px;top:' + ((h.tam ? 0 : 0) + (H - h.pos.y) * esc - h.tam.y * esc) + 'px;'
                        + 'width:' + (h.tam.x * esc) + 'px;pointer-events:none';
                    lienzo.appendChild(f);
                }
                continue;
            }
            const loc = Number(amb.campos && amb.campos.linkedLocation);
            const w = (h.tam ? h.tam.x : 136) * esc;
            const ht = (h.tam ? h.tam.y : 136) * esc;
            // Las anclas de estos hijos son (0,5, 0,5): el origen es el centro del mapa.
            const x = W / 2 * esc + h.pos.x * esc - w / 2;
            const y = H / 2 * esc - h.pos.y * esc - ht / 2;

            const b = document.createElement('button');
            const abierto2 = vistos.has(loc) || loc === 0;   // la casa siempre está
            b.title = (global.Travel ? global.Travel.nombre(loc) : ('Ubicación ' + loc))
                + (abierto2 ? '' : ' — sin descubrir');
            b.style.cssText = 'position:absolute;left:' + x + 'px;top:' + y + 'px;'
                + 'width:' + w + 'px;height:' + ht + 'px;border:none;background:none;'
                + 'padding:0;cursor:pointer;' + (abierto2 ? '' : 'filter:grayscale(1) opacity(.45);');
            if (img) {
                const im = document.createElement('img');
                im.src = url(img.sprite.nombre);
                im.style.cssText = 'width:100%;height:100%;object-fit:contain;pointer-events:none';
                im.onerror = () => { im.style.display = 'none'; };
                b.appendChild(im);
            }
            if (aqui === loc) {
                const aro = document.createElement('span');
                aro.style.cssText = 'position:absolute;inset:-6px;border:5px solid #fff;'
                    + 'border-radius:50%;box-shadow:0 0 12px rgba(0,0,0,.4)';
                b.appendChild(aro);
            }
            b.onclick = (ev) => {
                ev.stopPropagation();
                if (!global.Travel) return;
                const r = global.Travel.viajar(loc);
                if (r.ok && global.PlaySfx) global.PlaySfx.sonar('phoneAppTravel');
                if (global.app && global.app.showToast) {
                    global.app.showToast(r.ok ? ('🧭 ' + (r.nombre || '')) : r.motivo,
                                         r.ok ? 'success' : 'warning');
                }
                if (r.ok) cerrar(true);
            };
            lienzo.appendChild(b);
        }

        // `MapApp.tsuki`: dónde está Tsuki ahora.
        cuerpo.appendChild(lienzo);
        const pie = texto('Tsuki está en ' + (aqui != null && global.Travel
            ? global.Travel.nombre(aqui) : '—') + '. '
            + vistos.size + ' sitios descubiertos en el teléfono.', 26);
        cuerpo.appendChild(pie);
    }

    // ── 2. Tarjeta (Punchcard) ──────────────────────────────────────────────

    /**
     * `PunchcardApp`: la tarjeta de sellos. Siete casillas —seis diarias y la semanal— con
     * su `RewardType` y su `RewardModifier`, que `Progress` ya sabe traducir:
     * `PReward.get_Modifier()` es `mod < 3 ? mod + 1 : 5`, o sea de 200 a 1000 zanahorias.
     */
    function appTarjeta(cuerpo) {
        const P = global.Progress;
        const st = P ? P.punchcard() : null;
        if (!st) { cuerpo.appendChild(texto('Esta partida no trae tarjeta.')); return; }

        const TIPO = ['zanahorias', 'tickets de gacha', 'rerolls', 'fondo de teléfono'];
        const ICONO = { 0: 'furnitureIcons_32', 1: 'furnitureIcons_33', 2: 'furnitureIcons_33', 3: 'furnitureIcons_32' };
        // `Slot N` es un `roundedRect` en gris azulado con el icono BLANCO encima. Puesto
        // sobre blanco, el icono no se veía: es el color de la escena el que lo levanta.
        const SLOT = [0.41176, 0.50196, 0.51765];

        cuerpo.appendChild(texto('Reclamadas ' + st.claimedCount + ' · quedan '
            + st.pendientes + ' de ' + (st.rewards || []).length, 28));

        const rej = document.createElement('div');
        rej.style.cssText = 'display:grid;grid-template-columns:repeat(3,1fr);gap:14px';
        for (const r of (st.rewards || [])) {
            const c = document.createElement('button');
            const mult = P.multiplicadorPunchcard(r.modifier);
            const semanal = !!r.isWeekly;
            c.style.cssText = 'border:none;border-radius:24px;padding:16px 10px;position:relative;'
                + 'background:' + css(SLOT) + ';color:#fff;'
                + (r.claimed ? 'opacity:.55;' : '')
                + 'cursor:' + (r.claimed ? 'default' : 'pointer') + ';'
                + 'display:flex;flex-direction:column;align-items:center;gap:6px;'
                + (semanal ? 'grid-column:span 3;' : '');
            const dia = document.createElement('div');
            dia.style.cssText = 'font-size:26px;opacity:.85';
            dia.textContent = semanal ? 'semanal' : ('día ' + (r.index + 1));
            const ic = document.createElement('img');
            ic.src = urlIcono(ICONO[Number(r.rewardType) | 0] || 'furnitureIcons_32');
            ic.style.cssText = 'width:74px;height:74px;object-fit:contain';
            ic.onerror = () => { ic.style.display = 'none'; };
            const que = document.createElement('div');
            que.style.cssText = 'font-size:26px;font-weight:700;text-align:center';
            que.textContent = semanal
                ? (Number(r.furnID) > 0 ? ('mueble ' + r.furnID) : 'mueble')
                : ((Number(r.rewardType) === 0 ? (mult * 200) + ' ' : mult + '× ')
                   + TIPO[Number(r.rewardType) | 0]);
            c.appendChild(dia); c.appendChild(ic); c.appendChild(que);
            if (r.claimed) {
                // `Claimed` es `UI_SpriteSheet_23`: el sello que tacha la casilla.
                const s = document.createElement('img');
                s.src = url('UI_SpriteSheet_23');
                s.style.cssText = 'position:absolute;inset:8px;width:calc(100% - 16px);'
                    + 'height:calc(100% - 16px);object-fit:contain;pointer-events:none';
                s.onerror = () => { s.style.display = 'none'; };
                c.appendChild(s);
            } else {
                const sello = document.createElement('div');
                sello.style.cssText = 'font-size:24px;color:#fff;opacity:.85';
                sello.textContent = 'toca para reclamar';
                c.appendChild(sello);
            }
            if (!r.claimed) {
                c.onclick = (ev) => {
                    ev.stopPropagation();
                    const res = P.reclamarPunchcard(r.index, semanal);
                    const pant = document.getElementById('tel-pantalla');
                    if (pant) aviso(pant, res.ok ? 'Reclamada.' : res.motivo);
                    if (res.ok && global.PlaySfx) global.PlaySfx.sonar('phoneAppTap');
                    if (res.ok) lanzar('Punchcard');       // repinta con el estado nuevo
                };
            }
            rej.appendChild(c);
        }
        cuerpo.appendChild(rej);
    }

    // ── 3. Parsnap ──────────────────────────────────────────────────────────

    /**
     * `ParsnapApp`: tres pestañas, las mismas de la escena —`DiariesToggle`,
     * `CameraToggle` y `BountyToggle`—.
     *
     *   Diarios   el muro de fotos, con su `AccountName` «tsukilovecarrots» y sus likes.
     *   Cámara    hace una foto DEL JUEGO EN MARCHA con una `RawImage` y un `CameraScroll`;
     *             un editor de partidas no tiene eso, y se dice en vez de fingirlo.
     *   Encargos  `ParsnapBounty[]` de `parsnapSave`: se cobran de verdad.
     */
    function appParsnap(cuerpo) {
        const P = global.Progress;
        pestanas(cuerpo, ['Diarios', 'Cámara', 'Encargos'], (i, zona) => {
            if (i === 0) {
                const d = P ? P.diario() : [];
                const vistas = (d || []).filter(x => x.state === 2);
                zona.appendChild(texto('tsukilovecarrots · ' + vistas.length + ' de '
                    + (d || []).length + ' entradas vistas', 28));
                for (const e of vistas.slice(0, 40)) {
                    // `Diary Entry`: cuenta arriba, foto en medio y pie debajo. Cada
                    // entrada es `{num, state, night, texto, arte}`; `arte` es la ruta del
                    // dibujo, que el port ya tiene exportado en `images/npcs/`.
                    const f = document.createElement('div');
                    f.className = 'tel-fila';
                    f.style.flexDirection = 'column';
                    f.style.alignItems = 'stretch';
                    f.style.gap = '8px';

                    const t = document.createElement('div');
                    t.style.cssText = 'font-size:26px;font-weight:700;opacity:.75';
                    t.textContent = 'tsukilovecarrots · #' + e.num
                        + (e.night ? ' · de noche' : '');
                    f.appendChild(t);

                    if (e.arte) {
                        const im = document.createElement('img');
                        im.loading = 'lazy';
                        im.src = 'images/npcs/' + e.arte + '.png';
                        im.style.cssText = 'width:100%;max-height:320px;object-fit:contain;'
                            + 'border-radius:16px;background:rgba(0,0,0,.06)';
                        // De los 144 dibujos del diario hay **96 exportados**; los otros 48
                        // no están en `images/npcs/` (probado uno a uno, y el sufijo `_0`
                        // no ayuda: no hay ni un caso que sólo exista con él). Cuando
                        // falta, se quita la imagen y queda el texto, que sí está.
                        im.onerror = () => { im.style.display = 'none'; };
                        f.appendChild(im);
                    }
                    if (e.texto) {
                        const p2 = document.createElement('div');
                        p2.style.cssText = 'font-size:26px;opacity:.9';
                        p2.textContent = e.texto;
                        f.appendChild(p2);
                    }
                    zona.appendChild(f);
                }
                if (!vistas.length) zona.appendChild(texto('Todavía no hay ninguna entrada vista.'));
                return;
            }
            if (i === 1) { camara(zona); return; }
            const ps = P ? P.parsnap() : null;
            if (!ps) { zona.appendChild(texto('Esta partida no trae encargos de foto.')); return; }
            zona.appendChild(texto('Día ' + ps.day + ' · ' + ps.pendientes + ' sin cobrar de '
                + ps.bounties.length + ' (caben ' + ps.slots + ')', 28));
            for (const b of ps.bounties) {
                const f = document.createElement('div');
                f.className = 'tel-fila';
                const obj = objetivoDeEncargo(b);
                if (obj.icono) {
                    const im = document.createElement('img');
                    im.src = obj.icono;
                    im.style.cssText = 'width:72px;height:72px;object-fit:contain;'
                        + 'border-radius:12px;background:rgba(255,255,255,.12)';
                    im.onerror = () => { im.style.display = 'none'; };
                    f.appendChild(im);
                }
                const n = document.createElement('div');
                n.style.cssText = 'flex:1;font-size:30px;line-height:1.25';
                n.innerHTML = '';
                const t1 = document.createElement('div');
                t1.textContent = obj.nombre + (b.shiny ? ' ✦' : '');
                const t2 = document.createElement('div');
                t2.style.cssText = 'font-size:22px;opacity:.7';
                t2.textContent = (b.bountyType === 1 ? 'Fotografia este mueble'
                                                     : 'Fotografia a este vecino')
                    + (obj.presente ? ' · esta en la sala' : ' · no esta aqui');
                n.appendChild(t1); n.appendChild(t2);
                const pago = document.createElement('div');
                pago.style.cssText = 'font-size:26px;opacity:.8';
                pago.textContent = b.ticketReward ? 'ticket de gacha' : (b.shiny ? '500 🥕' : '250 🥕');
                f.appendChild(n); f.appendChild(pago);
                if (!b.collected && !obj.presente) {
                    const y = document.createElement('div');
                    y.style.cssText = 'font-size:24px;color:#8a7f6d;max-width:220px;'
                        + 'text-align:right';
                    y.textContent = 'hay que tenerlo delante';
                    f.appendChild(y);
                    zona.appendChild(f);
                    continue;
                }
                if (!b.collected) {
                    const bt = document.createElement('button');
                    bt.textContent = 'Cobrar';
                    bt.style.cssText = 'border:none;border-radius:16px;padding:10px 18px;'
                        + 'background:#c0392b;color:#fff;font-size:26px;cursor:pointer';
                    bt.onclick = (ev) => {
                        ev.stopPropagation();
                        const r = P.reclamarParsnap(b.index);
                        const pant = document.getElementById('tel-pantalla');
                        if (pant) aviso(pant, r.ok ? 'Cobrado.' : r.motivo);
                        if (r.ok) lanzar('Parsnap');
                    };
                    f.appendChild(bt);
                } else {
                    const y = document.createElement('div');
                    y.style.cssText = 'font-size:26px;color:#8a7f6d';
                    y.textContent = 'cobrado';
                    f.appendChild(y);
                }
                zona.appendChild(f);
            }
        });
    }

    /**
     * La pestaña de Cámara de Parsnap.
     *
     * En el juego es una `RawImage` con lo que ve la cámara del mundo (`CameraScroll`),
     * un `Slider` de zoom, un botón redondo de disparo con su `Flash`, y debajo el
     * `ImageOptions` con el interruptor de spoiler y los tres botones **Share / Save /
     * Discard**.
     *
     * El port SI dibuja la escena: el mapa va a un `<canvas>`. Así que la foto es de
     * verdad —se saca de ese lienzo, que es lo que se está viendo— y los tres botones
     * hacen lo suyo: compartir con la API del navegador, guardar el PNG y descartar.
     * Lo único que no se reproduce es el encuadre libre con el `Slider`, porque el
     * encuadre lo manda el visor del mapa, no la app.
     */
    /**
     * QUE pide un encargo de foto.
     *
     * `ParsnapBounty.bountyType` es `Character = 0` o `Furniture = 1`, y `bountyID` es el
     * id del uno o del otro. En el juego, `ParsnapApp.CheckForBounties()` lo da por
     * cumplido cuando ese objetivo cae DENTRO DEL ENCUADRE: hace una consulta de solape
     * con un `ContactFilter2D` sobre los colisionadores de la foto.
     *
     * El port no tiene colisionadores ni encuadre libre, asi que se queda en lo mas cerca
     * que puede: si el vecino esta en la sala (`play_npcs.enSala`) o el mueble esta puesto
     * en el mapa (`parser.placements`). Es menos exigente que el juego — no comprueba que
     * salga en la foto — y por eso la fila lo dice.
     */
    /**
     * La sala que se esta viendo, o null.
     *
     * Es la misma cuenta que hace `routine_scheduler` para saber a quien pintar: el mapa
     * abierto -> su `clusterId` en `MapDef`, y si no lo trae, el numero con el que empieza
     * su id.
     */
    function salaActual() {
        // `map.js` llama a `RoutineScheduler.evaluateSchedule(targetLoc, ...)` en cada
        // repintado del modo juego, asi que `currentSchedule.mapId` ES la sala que se esta
        // viendo. Es el mismo numero que usa `enSala`.
        const R = global.RoutineScheduler;
        const v = R && R.currentSchedule ? R.currentSchedule.mapId : null;
        return (v == null || v === '') ? null : Number(v);
    }

    function objetivoDeEncargo(b) {
        const id = Number(b.bountyID);
        if (Number(b.bountyType) === 1) {
            const db = global.ITEMS_DB || {};
            const it = db[String(id)];
            const p = parser();
            const puesto = !!(p && (p.placements || []).some(x => Number(x.item_id) === id));
            return {
                nombre: (it && (it.name_es || it.name_en)) || ('Mueble ' + id),
                icono: 'images/items/FURN_' + id + '.png',
                presente: puesto,
            };
        }
        // Personaje. El nombre y la sala salen de `Activities`, que es lo que el port ya
        // usa para pintar a los vecinos: `_porNpcID` trae el nombre y `donde(charId)` la
        // sala en la que esta ahora.
        const A = global.Activities;
        let nombre = null;
        try {
            for (const n of Object.values((A && A._porNpcID) || {})) {
                if (Number(n.character) === id) { nombre = n.nombre; break; }
            }
        } catch (e) { nombre = null; }

        let presente = false;
        try {
            const sala = A && typeof A.donde === 'function' ? A.donde(id) : null;
            const aqui = salaActual();
            presente = (sala != null && aqui != null && Number(sala) === Number(aqui));
        } catch (e) { presente = false; }

        // El retrato solo se pide si el manifiesto dice que ese vecino tiene uno: once
        // carpetas de retrato estan vacias y pedirlas era un 404 por encargo.
        const V = global.SPRITE_VARIANTS;
        let icono = null;
        if (nombre && V && V.retratos && V.retratos[nombre]) {
            icono = 'images/npcs/' + nombre + '/portraits/'
                  + encodeURIComponent(V.retratos[nombre]);
        }
        return { nombre: nombre || ('Vecino ' + id), icono, presente };
    }

    function camara(zona) {
        const s = delSave();
        const lienzo = document.getElementById('map-canvas');

        const marco = document.createElement('div');
        marco.style.cssText = 'position:relative;width:100%;aspect-ratio:1;border-radius:22px;'
            + 'overflow:hidden;background:rgba(0,0,0,.25);display:flex;'
            + 'align-items:center;justify-content:center';
        const vista = document.createElement('img');
        vista.style.cssText = 'width:100%;height:100%;object-fit:cover;display:none';

        // EL VISOR, EN VIVO.
        //
        // En el juego es una `RawImage` con lo que ve la camara del mundo: se ve lo que se
        // va a fotografiar ANTES de disparar. Aqui salia un recuadro oscuro con un texto.
        // El port dibuja la escena en `#map-canvas`, asi que el visor lo copia cinco veces
        // por segundo; al disparar se congela, como al pasar al `ImageOptions`.
        const visor = document.createElement('canvas');
        visor.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block';
        const hueco = document.createElement('div');
        hueco.style.cssText = 'color:#fff;font-size:26px;text-align:center;padding:0 24px';
        hueco.textContent = 'No hay ningún mapa abierto que fotografiar.';
        if (lienzo) hueco.style.display = 'none'; else visor.style.display = 'none';
        marco.appendChild(visor); marco.appendChild(vista); marco.appendChild(hueco);
        zona.appendChild(marco);

        if (lienzo) {
            const ctx = visor.getContext('2d');
            const copiar = () => {
                // Si el telefono se cerro o la app cambio, el marco ya no esta en la
                // pagina: se para solo, sin dejar el intervalo corriendo.
                if (!marco.isConnected) { clearInterval(latidoVisor); latidoVisor = null; return; }
                const lado = Math.min(lienzo.width, lienzo.height) || 0;
                if (!lado) return;
                if (visor.width !== lado) { visor.width = lado; visor.height = lado; }
                try {
                    ctx.drawImage(lienzo,
                        (lienzo.width - lado) / 2, (lienzo.height - lado) / 2, lado, lado,
                        0, 0, lado, lado);
                } catch (e) { /* lienzo aun sin dibujar */ }
            };
            if (latidoVisor) clearInterval(latidoVisor);
            copiar();
            latidoVisor = setInterval(copiar, 200);
        }

        // `Spoiler Toggle`: vive en `phoneSave.spoilerTag`, o sea se guarda de verdad.
        if (s && s.extra && s.extra.nodos && s.extra.nodos.spoilerTag) {
            zona.appendChild(conmutador('Marcar como spoiler', !!s.extra.spoilerTag, (v) => {
                s.extra.nodos.spoilerTag.value = !!v;
            }));
        }

        let datos = null;
        const fila = document.createElement('div');
        fila.style.cssText = 'display:flex;gap:10px';
        const boton = (etq, icono, alPulsar) => {
            const b = document.createElement('button');
            b.style.cssText = 'flex:1;border:none;border-radius:20px;padding:14px 0;'
                + 'background:rgba(255,255,255,.85);color:#3b3226;font-size:26px;'
                + 'cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:4px';
            const im = document.createElement('img');
            // `share`, `download` y `delete` NO viajan en level14 —el exportador lo dice:
            // «no estan en level14»—, están con los iconos de burbuja. Se pide ahí
            // directamente para no dejar un 404 por cada uno en cada apertura.
            im.src = urlIcono(icono);
            im.onerror = () => { im.style.display = 'none'; };
            im.style.cssText = 'width:44px;height:44px;object-fit:contain';
            const t = document.createElement('span');
            t.textContent = etq;
            b.appendChild(im); b.appendChild(t);
            b.onclick = (ev) => { ev.stopPropagation(); alPulsar(); };
            return b;
        };

        const disparar = document.createElement('button');
        disparar.textContent = 'Disparar';
        disparar.style.cssText = 'border:none;border-radius:50px;padding:18px 0;'
            + 'background:#fff;color:#3b3226;font-size:30px;font-weight:700;cursor:pointer';
        disparar.disabled = !lienzo;
        if (!lienzo) disparar.style.opacity = '.5';
        disparar.onclick = (ev) => {
            ev.stopPropagation();
            try {
                datos = lienzo.toDataURL('image/png');
            } catch (e) {
                // Un lienzo con imágenes de otro origen sale «tainted» y no se puede leer.
                const pant = document.getElementById('tel-pantalla');
                if (pant) aviso(pant, 'El navegador no deja leer el lienzo: ' + e.message);
                return;
            }
            vista.src = datos;
            vista.style.display = 'block';
            hueco.style.display = 'none';
            // Congelar el visor: el juego pasa al `ImageOptions` con la foto quieta.
            if (latidoVisor) { clearInterval(latidoVisor); latidoVisor = null; }
            visor.style.display = 'none';
            fila.style.display = 'flex';
            // `Flash`: el fogonazo del disparo.
            const fl = document.createElement('div');
            fl.style.cssText = 'position:absolute;inset:0;background:#fff;'
                + 'animation:tel-flash .35s forwards';
            marco.appendChild(fl);
            setTimeout(() => fl.remove(), 400);
            // `SFXClip.CameraShutter`, que es el de disparar y no el de tocar una app.
            if (global.PlaySfx) global.PlaySfx.sonar('cameraShutter');
        };
        zona.appendChild(disparar);

        fila.appendChild(boton('Compartir', 'share', () => {
            if (!datos) return;
            const pant = document.getElementById('tel-pantalla');
            if (global.navigator && global.navigator.share) {
                fetch(datos).then(r => r.blob()).then(bl => {
                    const f = new File([bl], 'parsnap.png', { type: 'image/png' });
                    return global.navigator.share({ files: [f], title: 'Parsnap' });
                }).catch(() => { if (pant) aviso(pant, 'No se pudo compartir.'); });
            } else if (global.navigator && global.navigator.clipboard
                       && global.ClipboardItem) {
                fetch(datos).then(r => r.blob()).then(bl =>
                    global.navigator.clipboard.write([new ClipboardItem({ 'image/png': bl })]))
                    .then(() => { if (pant) aviso(pant, 'Copiada al portapapeles.'); })
                    .catch(() => { if (pant) aviso(pant, 'No se pudo copiar.'); });
            } else if (pant) {
                aviso(pant, 'Este navegador no sabe compartir imágenes.');
            }
        }));
        fila.appendChild(boton('Guardar', 'download', () => {
            if (!datos) return;
            const a = document.createElement('a');
            a.href = datos;
            a.download = 'parsnap-' + Date.now() + '.png';
            a.click();
        }));
        fila.appendChild(boton('Descartar', 'delete', () => {
            datos = null;
            vista.style.display = 'none';
            hueco.style.display = 'block';
            fila.style.display = 'none';
        }));
        fila.style.display = 'none';
        zona.appendChild(fila);
    }

    // ── 4. Gacha ────────────────────────────────────────────────────────────

    /**
     * `GachaApp`: las estanterías. Cada `GachaSet` es un `Set` con tres `Shelf` de cinco
     * huecos, una cuarta de `Epic` (3) y `Legendary` (1). Aquí se listan los cinco sets de
     * `data/gacha.json` con sus bolas, marcando las que ya están en la colección.
     */
    function appGacha(cuerpo) {
        const G = global.Gacha;
        const P = global.Progress;
        const sets = G && G.sets ? G.sets : [];
        if (!sets.length) {
            cuerpo.appendChild(texto('No está cargado `data/gacha.json`.'));
            return;
        }
        for (const s of sets) {
            const caja = document.createElement('div');
            caja.style.cssText = 'border-radius:28px;background:rgba(255,255,255,.8);'
                + 'padding:16px 18px;color:#3b3226';
            const t = document.createElement('div');
            t.style.cssText = 'font-size:34px;font-weight:800;margin-bottom:10px';
            const bolas = s.gachapon || [];
            const tengo = bolas.filter(b => P && P.tiene(b.furnitureID)).length;
            t.textContent = s.name + '  ' + tengo + '/' + bolas.length;
            caja.appendChild(t);
            const rej = document.createElement('div');
            rej.style.cssText = 'display:grid;grid-template-columns:repeat(5,1fr);gap:8px';
            for (const b of bolas) {
                const c = document.createElement('div');
                const mio = !!(P && P.tiene(b.furnitureID));
                c.title = 'mueble ' + b.furnitureID + ' · ' + (b.rarityName || '');
                c.style.cssText = 'aspect-ratio:1;border-radius:18px;display:flex;'
                    + 'align-items:center;justify-content:center;font-size:22px;padding:4px;'
                    + 'background:' + (mio ? 'rgba(0,0,0,.08)' : 'rgba(0,0,0,.22)') + ';'
                    + 'color:' + (mio ? '#3b3226' : 'rgba(59,50,38,.45)');
                if (!mio) {
                    c.textContent = '?';
                } else {
                    // Cada bola ES un mueble: `GachaSet.gachapon[].furnitureID`. Su dibujo
                    // es el del mueble, no un icono aparte —`images/gacha/` sólo trae la
                    // máquina y las cápsulas—.
                    const im = document.createElement('img');
                    im.loading = 'lazy';
                    im.src = 'images/items/FURN_' + b.furnitureID + '.png';
                    im.style.cssText = 'max-width:100%;max-height:100%;object-fit:contain';
                    im.onerror = () => {
                        im.style.display = 'none';
                        c.textContent = String(b.furnitureID);
                    };
                    c.appendChild(im);
                }
                rej.appendChild(c);
            }
            caja.appendChild(rej);
            cuerpo.appendChild(caja);
        }
        cuerpo.appendChild(texto('Las máquinas de gacha son muebles: se tira desde la '
            + 'máquina puesta en una sala, no desde la app. Esto es el catálogo.', 24));
    }

    // ── 5. Compendio ────────────────────────────────────────────────────────

    /**
     * `CompendiumApp`: tres pestañas —Objetos (`furnitureIcons_27`), Muebles (`_28`) y
     * Peces (`_29`)— con su buscador y su rejilla, y un botón de Pedidos con las entregas
     * en camino. Aquí se cruza la colección de la partida con `ITEMS_DB`.
     */
    function appCompendio(cuerpo) {
        const P = global.Progress;
        if (!P) { cuerpo.appendChild(texto('No está cargado `progress_system.js`.')); return; }
        const res = P.resumenColeccion();
        cuerpo.appendChild(texto('Tienes ' + res.tiene + ' de ' + (res.catalogo || '?')
            + ' · ' + res.brillantes + ' brillantes', 28));

        const db = global.ITEMS_DB || {};
        const col = new Set(P.coleccion().map(x => Math.abs(Number(x))));

        const busca = document.createElement('input');
        busca.type = 'search';
        busca.placeholder = 'Buscar…';
        busca.style.cssText = 'border:none;border-radius:32px;padding:14px 22px;'
            + 'font-size:28px;background:rgba(255,255,255,.9);color:#3b3226';

        const rej = document.createElement('div');
        rej.style.cssText = 'display:grid;grid-template-columns:repeat(4,1fr);gap:10px';

        let filtro = 0;   // 0 objetos, 1 muebles, 2 peces
        function pinta() {
            rej.innerHTML = '';
            const q = busca.value.trim().toLowerCase();
            let n = 0;
            for (const id of Object.keys(db)) {
                const it = db[id];
                if (!it) continue;
                const tipo = Number(it.itemType != null ? it.itemType : (it.type || 0));
                // `itemType` es una máscara: los muebles van aparte y los peces llevan su bit.
                const esMueble = !!(it.isFurniture || it.furniture || tipo === 1);
                const esPez = /fish/i.test(String(it.category || it.tipo || '')) || !!it.isFish;
                const ok = filtro === 1 ? esMueble : (filtro === 2 ? esPez : (!esMueble && !esPez));
                if (!ok) continue;
                const nom = String(it.name_es || it.name || it.nombre || id);
                if (q && nom.toLowerCase().indexOf(q) < 0) continue;
                if (++n > 200) break;
                const mio = col.has(Math.abs(Number(id)));
                const c = document.createElement('div');
                c.title = nom + ' (' + id + ')';
                c.style.cssText = 'aspect-ratio:1;border-radius:20px;display:flex;'
                    + 'align-items:center;justify-content:center;font-size:20px;padding:4px;'
                    + 'text-align:center;overflow:hidden;background:'
                    + (mio ? 'rgba(255,255,255,.9)' : 'rgba(0,0,0,.18)') + ';'
                    + 'color:' + (mio ? '#3b3226' : 'rgba(255,255,255,.7)');
                if (!mio) {
                    // Sin tenerlo, el juego enseña la silueta: aquí, la interrogación.
                    c.textContent = '?';
                } else {
                    // `Item/Icon` mide 125 en la escena. El port guarda los iconos como
                    // `FURN_<id>.png` o `ITEM_<id>.png`, y no siempre está el de la
                    // familia que se pide: por eso se prueban los dos y, si no hay
                    // ninguno, se deja el nombre, que es mejor que un hueco.
                    const im = document.createElement('img');
                    im.loading = 'lazy';
                    im.src = 'images/items/' + (esMueble ? 'FURN_' : 'ITEM_') + id + '.png';
                    im.style.cssText = 'max-width:100%;max-height:100%;object-fit:contain';
                    im.onerror = () => {
                        im.onerror = () => { c.textContent = nom; };
                        im.src = 'images/items/' + (esMueble ? 'ITEM_' : 'FURN_') + id + '.png';
                    };
                    c.appendChild(im);
                }
                rej.appendChild(c);
            }
            if (!rej.children.length) rej.appendChild(texto('Nada que enseñar aquí.'));
        }

        pestanas(cuerpo, ['Objetos', 'Muebles', 'Peces'], (i, zona) => {
            filtro = i;
            zona.appendChild(busca);
            zona.appendChild(rej);
            pinta();
        });
        busca.oninput = pinta;

        // `Orders`: los muebles en camino, con su barra de «on the way…».
        const cartas = P.cartas();
        if (cartas && cartas.length) {
            cuerpo.appendChild(texto('Pedidos y correo: ' + P.cartasPendientes()
                + ' sin abrir de ' + cartas.length + '.', 26));
        }
    }

    // ── 6. Ajustes ──────────────────────────────────────────────────────────

    function conmutador(etq, valor, alCambiar) {
        const f = document.createElement('label');
        f.className = 'tel-fila';
        f.style.cursor = 'pointer';
        const t = document.createElement('span');
        t.style.cssText = 'flex:1;font-size:30px';
        t.textContent = etq;
        const c = document.createElement('input');
        c.type = 'checkbox';
        c.checked = !!valor;
        c.style.cssText = 'width:52px;height:52px';
        c.onchange = () => alCambiar(c.checked);
        f.appendChild(t); f.appendChild(c);
        return f;
    }

    function deslizador(etq, valor, min, max, paso, alCambiar) {
        const f = document.createElement('label');
        f.className = 'tel-fila';
        const t = document.createElement('span');
        t.style.cssText = 'flex:0 0 40%;font-size:28px';
        t.textContent = etq;
        const r = document.createElement('input');
        r.type = 'range';
        r.min = min; r.max = max; r.step = paso; r.value = valor;
        r.style.cssText = 'flex:1';
        const v = document.createElement('span');
        v.style.cssText = 'font-size:26px;width:110px;text-align:right;flex:0 0 auto';
        // `bgScrollX` viene como 0,02500000037252903: enseñarlo crudo se sale de la caja.
        const corto = (x) => {
            const n = Number(x);
            return Number.isInteger(n) ? String(n) : n.toFixed(3);
        };
        v.textContent = corto(valor);
        r.oninput = () => { v.textContent = corto(r.value); alCambiar(Number(r.value)); };
        f.appendChild(t); f.appendChild(r); f.appendChild(v);
        return f;
    }

    /**
     * `OptionsApp`: escribe en `phoneSave` de verdad —`disableSFX`, `tiltFactor`,
     * `bgScrollX/Y`, `bgPatternID` y `bgColorID`—, y los dos selectores salen de
     * `IconManager` (`data/phone_customs.json`) filtrados por las máscaras de bits
     * `backgroundsUnlocked` y `colorsUnlocked`.
     */
    function appAjustes(cuerpo) {
        const s = delSave();
        if (!s || !s.cos) {
            cuerpo.appendChild(texto('Esta partida no trae `phoneSave`.'));
            return;
        }
        const p = parser();
        const ex = s.extra || {};
        const nodos = ex.nodos || {};

        if (nodos.disableSFX) {
            cuerpo.appendChild(conmutador('Sonido del teléfono', !ex.disableSFX, (v) => {
                nodos.disableSFX.value = !v;
            }));
        }
        if (nodos.tiltFactor) {
            cuerpo.appendChild(deslizador('Inclinación', Number(ex.tiltFactor) || 0, 0, 100, 1, (v) => {
                nodos.tiltFactor.value = v | 0;
            }));
            cuerpo.appendChild(texto('La inclinación es `PhoneApp::HandleGyro`: el '
                + 'teléfono se ladea con el giroscopio del aparato, y si no lo hay, '
                + 'siguiendo el puntero. A 0 no se mueve.', 22));
        }
        for (const eje of ['X', 'Y']) {
            const k = 'bgScroll' + eje;
            if (!nodos[k]) continue;
            cuerpo.appendChild(deslizador('Desplazamiento ' + eje, Number(ex[k]) || 0,
                -0.2, 0.2, 0.005, (v) => {
                    nodos[k].value = v;
                    const pant = document.getElementById('tel-pantalla');
                    if (pant) pintarFondo(pant);
                }));
        }

        // Los dos selectores. `PhoneCustomization.Bit` es `1 << customizationIndex`.
        const tieneBit = (mascara, id) => {
            try { return (BigInt(mascara || 0) & (1n << BigInt(id))) !== 0n; }
            catch (e) { return false; }
        };
        if (customs && Array.isArray(customs.patrones) && customs.patrones.length) {
            cuerpo.appendChild(texto('Patrón', 30));
            const fila = document.createElement('div');
            fila.style.cssText = 'display:flex;gap:10px;overflow:auto;padding-bottom:6px';
            for (const t of customs.patrones) {
                if (!tieneBit(s.cos.backgroundsUnlocked, Number(t.id))) continue;
                const b = document.createElement('button');
                b.title = t.textura || ('patrón ' + t.id);
                // La textura es blanca con alfa: se usa de mascara sobre el color,
                // igual que en el fondo, para que la muestra se vea como se vera.
                const cw = colorway();
                const u = 'url("' + t.textura + '")';
                b.style.cssText = 'flex:0 0 auto;width:96px;height:96px;border-radius:20px;'
                    + 'border:' + (Number(s.cos.bgPatternID) === Number(t.id)
                                   ? '5px solid #fff' : '2px solid rgba(255,255,255,.4)') + ';'
                    + 'background-color:' + css((cw && cw.color) || FONDO_ESCENA) + ';'
                    + 'position:relative;overflow:hidden;cursor:pointer;padding:0';
                const mm = document.createElement('span');
                mm.style.cssText = 'position:absolute;inset:0;background-color:'
                    + css((cw && cw.color2) || [0, 0, 0, .3]) + ';'
                    + '-webkit-mask-image:' + u + ';mask-image:' + u + ';'
                    + '-webkit-mask-size:96px 96px;mask-size:96px 96px;'
                    + '-webkit-mask-repeat:repeat;mask-repeat:repeat';
                b.appendChild(mm);
                b.onclick = (ev) => {
                    ev.stopPropagation();
                    if (p && p.setPhoneCosmeticField) p.setPhoneCosmeticField('bgPatternID', Number(t.id));
                    const pant = document.getElementById('tel-pantalla');
                    if (pant) pintarFondo(pant);
                    lanzar('Options');
                };
                fila.appendChild(b);
            }
            cuerpo.appendChild(fila);
        }
        if (customs && Array.isArray(customs.colorways) && customs.colorways.length) {
            cuerpo.appendChild(texto('Color', 30));
            const fila = document.createElement('div');
            fila.style.cssText = 'display:flex;gap:10px;overflow:auto;padding-bottom:6px';
            for (const c of customs.colorways) {
                if (!tieneBit(s.cos.colorsUnlocked, Number(c.id))) continue;
                const b = document.createElement('button');
                b.title = c.nombre || ('color ' + c.id);
                b.style.cssText = 'flex:0 0 auto;width:96px;height:96px;border-radius:50%;'
                    + 'border:' + (Number(s.cos.bgColorID) === Number(c.id)
                                   ? '5px solid #fff' : '2px solid rgba(255,255,255,.4)') + ';'
                    + 'background:linear-gradient(135deg,' + css(c.color) + ' 50%,'
                    + css(c.color2 || c.color) + ' 50%);cursor:pointer';
                b.onclick = (ev) => {
                    ev.stopPropagation();
                    if (p && p.setPhoneCosmeticField) p.setPhoneCosmeticField('bgColorID', Number(c.id));
                    const pant = document.getElementById('tel-pantalla');
                    if (pant) pintarFondo(pant);
                    lanzar('Options');
                };
                fila.appendChild(b);
            }
            cuerpo.appendChild(fila);
        }
        if (!customs) {
            cuerpo.appendChild(texto('Falta `data/phone_customs.json`: córrelo con '
                + '`python tools/export_phone_customs.py`. Sin él sólo se puede decir qué '
                + 'números guarda la partida (patrón ' + s.cos.bgPatternID + ', color '
                + s.cos.bgColorID + ').', 24));
        } else {
            const cw = colorway(), pt = patron();
            cuerpo.appendChild(texto('Color ' + s.cos.bgColorID
                + (cw ? ' («' + cw.nombre + '»)' : '') + ' · patrón ' + s.cos.bgPatternID
                + (pt ? ' de ' + customs.patrones.length : ''), 24));
        }

        // `Time`: la escena enseña la hora en los ajustes.
        const t2 = horaTexto();
        cuerpo.appendChild(texto('Hora del juego: ' + t2.texto + ' ' + t2.sufijo, 26));
    }

    global.PlayPhone = {
        APPS, PANTALLA, APP, BARRA, FONDO_ESCENA,
        get abierto() { return abierto; },
        get ui() { return ui; },
        get customs() { return customs; },
        get appAbierta() { return appAbierta; },
        cargar, usarUI, abrir, cerrar, cerrarApp, puedeCerrar, lanzar,
        ordenDeApps, delSave, horaTexto, bloqueada, pasoTutorial, colorway, patron, nodo,
    };
})(typeof window !== 'undefined' ? window : globalThis);
