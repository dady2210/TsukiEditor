/* play_buttons.js — la barra de abajo: los siete botones del juego, con sus reglas.
 *
 * ────────────────────────────────────────────────────────────────────────────
 *  DE DONDE SALE
 * ────────────────────────────────────────────────────────────────────────────
 * De **`level14`**, la escena del `UIController`, volcada con
 * `tools/cs_ui_popup -- level14 MenuBar` a `data/ui_menubar.json` (54 nodos, 35 imágenes)
 * y con sus 21 texturas en `images/ui/menubar/`.
 *
 *     UIBar                tam (−16, 140), anclada abajo a lo ancho, pivote (0,5, 0)
 *       Menu               HorizontalLayoutGroup   <- la fila de verdad
 *       Buttons
 *         Items            110    `backpackSprites_3`     BagButton
 *         Edit             128    `editHome_0`            EditButton
 *         HarvestAll       109,2  `UI_SpriteSheet_13`     HarvestAllButton
 *         Hoe              128    `hoebutton`             HoeButton
 *         PlantCarrots     110    `UI_SpriteSheet_14`     PlantAllButton
 *         Phone            110    `Icon_Phone`            PhoneButton  (+ QuickMenu)
 *         Options          110    `Icon_Gear`             OptionsButton
 *
 * `MenuBar` es un `AdditivePopup` con `slideTransition = 3` y `transitionDistance = 140`:
 * la barra ENTRA DESLIZANDO desde abajo justo su propio alto, que es lo que se reproduce
 * aquí con una transición de `transform`.
 *
 * ────────────────────────────────────────────────────────────────────────────
 *  LO QUE DECIDE SI UN BOTON SALE
 * ────────────────────────────────────────────────────────────────────────────
 * La propiedad virtual `Visible`. La base, `MenuButton::get_Visible` (0x57b2ae0),
 * desensamblada, es:
 *
 *     if (this.locked) return false;                      // ldrb w8,[x19,#0x20]
 *     if (!Tutorial.TutorialInProgress) return true;
 *     if (Tutorial.TutorialStep > 3) return true;
 *     return this is BagButton;                           // comprobación de tipo
 *
 * y `Tutorial::get_TutorialInProgress` (0x5877d10) es **`TutorialStep < 9`**: lee el
 * `static_fields` de `Tutorial` en 0x14, que en arm64 es `TutorialStep` (en `dump.cs` pone
 * 0xC porque ahí los punteros ocupan 4). O sea: **mientras el tutorial no pasa del paso 3
 * sólo se ve la mochila**, y a partir del 9 no hay tutorial.
 *
 * Cada botón añade lo suyo:
 *
 *   `BagButton::get_Visible`     (0x58182b0)  `!locked && !uiOculta`  — se salta el
 *                                             tutorial: la mochila está desde el principio.
 *   `OptionsButton::get_Visible` (0x57bbe94)  `!uiOculta && base`
 *   `PhoneButton::get_Visible`   (0x57ed974)  `!uiOculta && base`
 *   `HarvestAllButton`           (0x5777cf0)  `base && !Farm.EditingPlots` y además
 *                                             comprueba que la escena de ahora sea la
 *                                             granja, con `Object.op_Equality` y una
 *                                             comprobación de tipo.
 *   `HoeButton` / `PlantAllButton` / `EditButton`  miran también la sala.
 *
 * `uiOculta` es un bool estático de una clase de interfaz —la que esconde la barra en
 * diálogos y escenas—: aquí es `PlayButtons.ocultarUI`, que el port pone a true cuando hay
 * una ventana modal delante. No se le pone el nombre de la clase porque no se llegó a
 * resolver cuál es, y poner uno inventado sería peor.
 *
 * ────────────────────────────────────────────────────────────────────────────
 *  COMO SE ENGANCHA, SIN TIRAR NADA
 * ────────────────────────────────────────────────────────────────────────────
 * El port ya tenía una barra con cinco botones de iconos de Material y sus manejadores
 * repartidos por `tsuki_port.js`, `app.js` y `farming_system.js`. Aquí **no se borra
 * ninguno**: se reaprovechan los mismos elementos y los mismos `id`, sólo se les cambia el
 * dibujo por su sprite de verdad, se añaden los dos que faltaban y se les aplica la regla
 * `Visible`. Así el contador de la hoz (`#sickle-badge`), el modo martillo y los ajustes
 * siguen funcionando igual.
 *
 *   Items  -> #btn-port-bag       Edit -> #btn-port-hammer   HarvestAll -> #btn-hud-sickle
 *   Hoe    -> #btn-port-hoe (nuevo)   PlantCarrots -> #btn-port-plant (nuevo)
 *   Phone  -> #btn-port-phone     Options -> #btn-port-settings
 *
 * El botón del teléfono pasa a abrir **el teléfono** (`PlayPhone.abrir`), que es lo que
 * hace en el juego; el viaje sigue estando, pero donde toca: en la app del Mapa.
 */
(function (global) {
    'use strict';

    const RUTA = 'images/ui/menubar/';
    const RUTA_ICONOS = 'images/icons/bubbles/';

    /**
     * Los siete, en el orden de `MenuBar.buttons`. `clave` es el nombre del nodo en la
     * escena; `id` es el elemento que ya tenía el port, o el que se crea si faltaba.
     */
    const BOTONES = [
        { clave: 'Items',        clase: 'BagButton',         id: 'btn-port-bag',      titulo: 'Mochila' },
        { clave: 'Edit',         clase: 'EditButton',        id: 'btn-port-hammer',   titulo: 'Editar' },
        { clave: 'HarvestAll',   clase: 'HarvestAllButton',  id: 'btn-hud-sickle',    titulo: 'Cosechar todo' },
        { clave: 'Hoe',          clase: 'HoeButton',         id: 'btn-port-hoe',      titulo: 'Azada' },
        { clave: 'PlantCarrots', clase: 'PlantAllButton',    id: 'btn-port-plant',    titulo: 'Plantar todo' },
        { clave: 'Phone',        clase: 'PhoneButton',       id: 'btn-port-phone',    titulo: 'Teléfono' },
        { clave: 'Options',      clase: 'OptionsButton',     id: 'btn-port-settings', titulo: 'Ajustes' },
    ];

    // `UIBar`: 140 de alto, y es lo que se desliza (`transitionDistance = 140`).
    const ALTO_BARRA = 140;
    // La granja, la sala donde salen la hoz, la azada y el plantar. `SLocation.Farm = 6`.
    const GRANJA = 6;

    let menubar = null;         // data/ui_menubar.json
    let montado = false;
    let latido = null;

    // ── la partida ──────────────────────────────────────────────────────────

    function parser() { return global.app && global.app.parser; }

    /** `Tutorial.TutorialStep`, que el parser ya lee de `TsukiSave.tutorialStep`. */
    function pasoTutorial() {
        const p = parser();
        if (!p || typeof p.getTutorialStep !== 'function') return 99;
        try {
            const v = p.getTutorialStep();
            return v == null ? 99 : Number(v);
        } catch (e) { return 99; }
    }

    /** `Tutorial::get_TutorialInProgress` (0x5877d10): el paso por debajo de 9. */
    function tutorialEnMarcha() { return pasoTutorial() < 9; }

    /** La sala que se está viendo. El selector es quien manda en el resto del port. */
    function sala() {
        const sel = typeof document !== 'undefined'
            ? document.getElementById('select-location') : null;
        if (sel && sel.value !== '') {
            const n = parseInt(sel.value, 10);
            if (!isNaN(n)) return n;
        }
        const p = parser();
        return p && p.currentSLocation != null ? Number(p.currentSLocation) : null;
    }

    function enLaGranja() { return sala() === GRANJA; }

    // ── las reglas ──────────────────────────────────────────────────────────

    const API = {
        /** El bool de interfaz que esconde la barra entera (diálogos, escenas, modales). */
        ocultarUI: false,
        /** `MenuButton.locked` de cada uno, por clave. */
        bloqueados: {},
        /** `Farm.EditingPlots`: mientras se editan parcelas, la hoz no sale. */
        editandoParcelas: false,

        get BOTONES() { return BOTONES; },
        get ALTO_BARRA() { return ALTO_BARRA; },
        get menubar() { return menubar; },

        pasoTutorial, tutorialEnMarcha, sala, enLaGranja,

        /**
         * `MenuButton::get_Visible` (0x57b2ae0), tal cual sale del desensamblado.
         */
        visibleBase(clave) {
            if (this.bloqueados[clave]) return false;
            if (!tutorialEnMarcha()) return true;
            if (pasoTutorial() > 3) return true;
            return clave === 'Items';        // `this is BagButton`
        },

        /** Lo que cada botón añade a la regla base. */
        visible(clave) {
            switch (clave) {
                // `BagButton::get_Visible` (0x58182b0): NO llama a la base. La mochila
                // está desde el primer paso del tutorial.
                case 'Items':
                    return !this.bloqueados.Items && !this.ocultarUI;

                // `OptionsButton` (0x57bbe94) y `PhoneButton` (0x57ed974): el bool de
                // interfaz primero, y si no, la regla base.
                case 'Options':
                case 'Phone':
                    return !this.ocultarUI && this.visibleBase(clave);

                // `HarvestAllButton` (0x5777cf0): base, que no se estén editando
                // parcelas, y que la escena de ahora sea la granja.
                case 'HarvestAll':
                    return this.visibleBase(clave) && !this.editandoParcelas && enLaGranja();

                // `HoeButton` y `PlantAllButton` miran la sala igual.
                case 'Hoe':
                case 'PlantCarrots':
                    return this.visibleBase(clave) && enLaGranja();

                // `EditButton`: la sala tiene que poder editarse, que en el port es tener
                // un mapa cargado con sus muebles.
                case 'Edit':
                    return this.visibleBase(clave) && sala() != null;

                default:
                    return this.visibleBase(clave);
            }
        },

        // ── el dibujo ───────────────────────────────────────────────────────

        async cargar() {
            if (menubar) return true;
            try {
                const r = await fetch('data/ui_menubar.json');
                if (!r.ok) return false;
                menubar = await r.json();
                return true;
            } catch (e) { return false; }
        },

        /** Para las pruebas, que no tienen red. */
        usarDatos(d) { menubar = d; return !!menubar; },

        /** El nodo de la escena de un botón, con su sprite y su tamaño. */
        nodo(clave) {
            if (!menubar || !menubar.arbol) return null;
            let hit = null;
            (function anda(n) {
                if (hit) return;
                if (n.ruta === 'UIBar/Buttons/' + clave) { hit = n; return; }
                for (const h of n.hijos || []) anda(h);
            })(menubar.arbol);
            return hit;
        },

        /** El sprite y el lado de un botón, de la escena. Con respaldo si no hay volcado. */
        pinta(clave) {
            const RESPALDO = {
                Items: ['backpackSprites_3', 110], Edit: ['editHome_0', 128],
                HarvestAll: ['UI_SpriteSheet_13', 109.2267], Hoe: ['hoebutton', 128],
                PlantCarrots: ['UI_SpriteSheet_14', 110], Phone: ['Icon_Phone', 110],
                Options: ['Icon_Gear', 110],
            };
            const n = this.nodo(clave);
            if (!n) {
                const r = RESPALDO[clave] || [null, 110];
                return { sprite: r[0], lado: r[1] };
            }
            let sprite = null;
            for (const c of n.comp || []) {
                if (c.tipo === 'Image' && c.sprite && c.sprite.nombre) { sprite = c.sprite.nombre; break; }
            }
            const lado = (n.tam && n.tam.x) ? n.tam.x : 110;
            return { sprite, lado };
        },

        url(n) { return n ? RUTA + n + '.png' : null; },

        /**
         * Monta la barra encima de la que ya había: reaprovecha los elementos con sus
         * manejadores y sólo les cambia el dibujo, añade los dos que faltaban y los pone
         * en el orden del juego.
         */
        montar() {
            if (typeof document === 'undefined') return false;
            const barra = document.getElementById('play-bottom-bar');
            if (!barra) return false;

            estilos();
            barra.classList.add('barra-real');
            // La escala: la barra del juego mide 140 de alto en un lienzo de 1222, así que
            // en pantalla se baja a algo manejable sin cambiar las proporciones.
            const esc = 0.42;

            for (const b of BOTONES) {
                let el = document.getElementById(b.id);
                if (!el) {
                    el = document.createElement('div');
                    el.id = b.id;
                    el.className = 'port-btn';
                    barra.appendChild(el);
                }
                el.classList.add('port-btn', 'boton-real');
                el.title = b.titulo;
                el.dataset.boton = b.clave;

                // El contador de la hoz es del port y sigue estando: se saca, se limpia el
                // resto y se vuelve a meter. Tirarlo rompería `updateSickleButtonBadge`.
                const insignia = el.querySelector('#sickle-badge');
                el.innerHTML = '';
                const p = this.pinta(b.clave);
                const im = document.createElement('img');
                im.src = this.url(p.sprite) || '';
                im.alt = b.titulo;
                im.style.cssText = 'width:' + Math.round(p.lado * esc) + 'px;height:auto;'
                    + 'display:block;pointer-events:none;image-rendering:auto';
                im.onerror = () => { im.style.display = 'none'; };
                el.appendChild(im);
                if (insignia) el.appendChild(insignia);

                barra.appendChild(el);      // reordena al orden del juego
            }

            engancharNuevos();
            engancharTelefono();
            montado = true;
            this.refrescar();
            if (!latido) latido = setInterval(() => API.refrescar(), 500);
            return true;
        },

        /** Aplica `Visible` a los siete. Es lo que hace `MenuBar::UIUpdate` cada cuadro. */
        refrescar() {
            if (typeof document === 'undefined') return;
            const barra = document.getElementById('play-bottom-bar');
            if (!barra) return;
            // La barra entera se desliza sus 140 (`transitionDistance`).
            barra.classList.toggle('barra-fuera', !!this.ocultarUI);
            for (const b of BOTONES) {
                const el = document.getElementById(b.id);
                if (!el) continue;
                el.style.display = this.visible(b.clave) ? 'flex' : 'none';
                // `Tutorial.MenuLocked`, que es lo que mira `Tutorial::SetAllInteractable`:
                // durante el tutorial los botones SE VEN pero no responden, salvo el que
                // toque en ese paso. Ocultarlos seria otra cosa.
                const T = global.PlayTutorial;
                const trabado = !!(T && T.menuBloqueado && T.enMarcha && T.enMarcha());
                el.style.pointerEvents = trabado ? 'none' : '';
                el.style.filter = trabado ? 'grayscale(.7) opacity(.6)' : '';
                // `TsukiPort` se construye al entrar en modo play, o sea DESPUES de que
                // esto monte la barra, y le vuelve a poner su propio `title` al botón del
                // teléfono («Mapa de Viaje»). Se corrige en cada pasada.
                if (el.title !== b.titulo) el.title = b.titulo;
            }
        },

        get montado() { return montado; },
    };

    /** Los dos que el port no tenía: la azada y el plantar. */
    function engancharNuevos() {
        const hoe = document.getElementById('btn-port-hoe');
        if (hoe && !hoe._enganchado) {
            hoe._enganchado = true;
            hoe.addEventListener('click', (ev) => {
                ev.stopPropagation();
                // `HoeButton` alterna el modo de labrar parcelas. El port lo lleva en
                // `FarmingSystem`; si no está, se dice en vez de hacer como que sí.
                const f = global.app && global.app.farmingSystem;
                if (f && typeof f.toggleHoe === 'function') { f.toggleHoe(); return; }
                if (global.app && global.app.showToast) {
                    global.app.showToast('La azada todavía no está enganchada.', 'warning');
                }
            });
        }
        const plant = document.getElementById('btn-port-plant');
        if (plant && !plant._enganchado) {
            plant._enganchado = true;
            plant.addEventListener('click', (ev) => {
                ev.stopPropagation();
                const f = global.app && global.app.farmingSystem;
                if (f && typeof f.plantAll === 'function') { f.plantAll(GRANJA); return; }
                if (global.app && global.app.showToast) {
                    global.app.showToast('Plantar todo todavía no está enganchado.', 'warning');
                }
            });
        }
    }

    /**
     * El botón del teléfono. En el juego abre EL TELEFONO; el port lo tenía abriendo
     * directamente el panel de viaje, que es lo que hace la app del Mapa una vez dentro.
     *
     * Y mantenerlo pulsado saca el `QuickMenu`: un `RadialLayoutGroup` con tres
     * `QuickLaunchButton` —Parsnap, Punchcard y Mapa— a 128 cada uno.
     */
    function engancharTelefono() {
        const barra = document.getElementById('play-bottom-bar');
        const el = document.getElementById('btn-port-phone');
        if (!barra || !el) return;
        el.title = 'Teléfono';
        if (barra._telefonoReal) return;
        barra._telefonoReal = true;

        // OJO CON EL ORDEN DE LOS MANEJADORES. `tsuki_port.js` ya le puso al botón un
        // `click` que abre el panel de viaje, y además `TsukiPort` puede construirse
        // DESPUES de esto y volver a ponerlo. Poner otro en el propio botón, aunque sea
        // con `capture`, no vale: cuando el evento va dirigido al elemento, los de captura
        // y los de burbuja se disparan EN ORDEN DE REGISTRO, así que se abrirían las dos
        // cosas. En un ANTEPASADO sí: la fase de captura del padre va siempre por delante
        // de cualquier manejador del hijo, y `stopPropagation` corta ahí.
        barra.addEventListener('click', (ev) => {
            const b = ev.target && ev.target.closest
                ? ev.target.closest('#btn-port-phone') : null;
            if (!b) return;
            ev.stopPropagation();
            if (global.PlayPhone) global.PlayPhone.abrir();
            else if (global.app && global.app.port) global.app.port.toggleMapModal();
        }, true);

        // EL ENGRANAJE, IGUAL.
        //
        // `tsuki_port` lo engancha a `#play-settings-modal`, una ventana del port que
        // ademas **no se pinta**: se le quita la clase `hidden`, queda con su tamanyo y su
        // sitio, `elementsFromPoint` la da por encima del lienzo del mapa... y no se ve.
        // Lo que abre en el juego es `OptionsPopup`, que esta volcada y montada en
        // `play_popups.ajustes()`.
        barra.addEventListener('click', (ev) => {
            const g = ev.target && ev.target.closest
                ? ev.target.closest('#btn-port-settings') : null;
            if (!g) return;
            if (!global.PlayPopups || typeof global.PlayPopups.ajustes !== 'function') return;
            ev.stopPropagation();
            const viejo = document.getElementById('play-settings-modal');
            if (viejo) viejo.classList.add('hidden');
            // `SFXClip.SettingsButtonOpen`.
            if (global.PlaySfx) global.PlaySfx.sonar('settingsButtonOpen');
            global.PlayPopups.ajustes();
        }, true);

        let temporizador = null;
        const abrirRadial = () => { temporizador = null; menuRapido(el); };
        el.addEventListener('pointerdown', () => {
            clearTimeout(temporizador);
            // `ButtonX.longPressTimeMultiplier = 5` sobre el toque normal: medio segundo.
            temporizador = setTimeout(abrirRadial, 500);
        });
        for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) {
            el.addEventListener(ev, () => { clearTimeout(temporizador); temporizador = null; });
        }
    }

    /** El `QuickMenu` del botón del teléfono: tres accesos en corro. */
    function menuRapido(ancla) {
        const viejo = document.getElementById('menu-rapido');
        if (viejo) { viejo.remove(); return; }
        // Las tres posiciones son las del `RadialLayoutGroup` de la escena, normalizadas.
        const APPS = [
            { clave: 'Parsnap', icono: 'instagramIcon_0', x: 121.4757, y: 70.178 },
            { clave: 'Punchcard', icono: 'punchcardIcon_0', x: 0.7988, y: 140.2877 },
            { clave: 'Map', icono: 'mapIcon_0', x: -120.6686, y: 71.5568 },
        ];
        const r = ancla.getBoundingClientRect();
        const cap = document.createElement('div');
        cap.id = 'menu-rapido';
        cap.style.cssText = 'position:fixed;inset:0;z-index:10000';
        cap.addEventListener('click', () => cap.remove());
        const esc = 0.42;
        for (const a of APPS) {
            const b = document.createElement('button');
            b.title = a.clave;
            b.style.cssText = 'position:fixed;width:' + Math.round(128 * esc) + 'px;'
                + 'height:' + Math.round(128 * esc) + 'px;border-radius:50%;border:none;'
                + 'background:#f5f2eb;box-shadow:0 4px 10px rgba(0,0,0,.35);cursor:pointer;'
                + 'display:flex;align-items:center;justify-content:center;padding:0;'
                + 'left:' + (r.left + r.width / 2 + a.x * esc - 128 * esc / 2) + 'px;'
                + 'top:' + (r.top + r.height / 2 - a.y * esc - 128 * esc / 2) + 'px';
            const im = document.createElement('img');
            im.src = RUTA + a.icono + '.png';
            im.style.cssText = 'width:76%;height:76%;object-fit:contain;pointer-events:none';
            im.onerror = () => { im.src = RUTA_ICONOS + a.icono + '.png'; };
            b.appendChild(im);
            b.onclick = (ev) => {
                ev.stopPropagation();
                cap.remove();
                // `QuickLaunchButton` llama a `Phone.QuickOpen(appNum)`: abre el teléfono
                // YA con esa app puesta, sin pasar por la rejilla.
                if (global.PlayPhone) global.PlayPhone.abrir({ app: a.clave });
            };
            cap.appendChild(b);
        }
        document.body.appendChild(cap);
        if (global.PlaySfx) global.PlaySfx.sonar('phoneAppTap');
    }

    function estilos() {
        if (document.getElementById('barra-real-estilos')) return;
        const st = document.createElement('style');
        st.id = 'barra-real-estilos';
        st.textContent =
            // `UIBar`: 140 de alto y `slideTransition = 3` con `transitionDistance = 140`.
            '.port-bottom-bar.barra-real{gap:14px;align-items:flex-end;'
            + 'transition:transform .3s cubic-bezier(.2,.9,.3,1)}'
            + '.port-bottom-bar.barra-fuera{transform:translateX(-50%) translateY(' + ALTO_BARRA + 'px)}'
            // Los sprites YA traen el botón dibujado: nada de círculo encima.
            + '.port-btn.boton-real{width:auto;height:auto;border-radius:0;background:none;'
            + 'border:none;box-shadow:none;position:relative}'
            + '.port-btn.boton-real:hover{transform:scale(1.06)}'
            + '.port-btn.boton-real:active{transform:scale(.94)}';
        document.head.appendChild(st);
    }

    global.PlayButtons = API;

    // Se monta cuando hay barra. El port la crea con el modo play.
    if (typeof document !== 'undefined') {
        const intenta = () => { API.cargar().then(() => API.montar()); };
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', intenta);
        } else { intenta(); }
    }
})(typeof window !== 'undefined' ? window : globalThis);
