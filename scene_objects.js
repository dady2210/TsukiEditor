// scene_objects.js — los objetos interactivos que el juego coloca en las escenas.
//
// Son 198 repartidos por 17 mapas: árboles que se sacuden, faroles y campanillas que se
// balancean, montículos y huevos que se recogen, y un puñado que abre una pantalla.
// No están en el `.csave`: viven en las escenas de Unity.
//
// DE DÓNDE SALEN LOS DATOS
// ------------------------
// `data/scene_objects.json`, generado con `tools/cs_scene_objects` (lee MonoBehaviour de
// escenas IL2CPP) y colocado en coordenadas del port restando el `origin_offset` de cada
// nivel. Incluye las escenas superpuestas: las de invierno (`*Winter`/`*Snow`) y las de
// festival (`level40..47`, `level71`), asignadas a su mapa por la posición de su raíz
// `SceneData`.
//
// LAS CUATRO FAMILIAS, SACADAS DEL BINARIO
// -----------------------------------------
// Cada clase del juego implementa `QuickTap`; mirando qué llama salen cuatro grupos:
//
//   · `collect` — `Snowmound`, `SeededEgg`, `SceneItemPickup`, `GachaponEgg`.
//     Todas acaban en `BaseInventory.TryAdd(item, 1, ...)` y luego se desactivan
//     (`Behaviour.set_enabled(false)`). Un solo mecanismo para las cuatro.
//     Comprobado en `Snowmound.Collect` (RVA 0x5833AC0) y
//     `SceneItemPickup.Collect` (0x580CA40).
//
//   · `shake` — `TreeProp.QuickTap` (0x5854584) llama a `Shake()` (0x58545B0).
//     Es puramente visual: el árbol se balancea.
//
//   · `swing` — `Lantern.QuickTap` (0x57AA2B4) llama a `RopeObject.AddForce`, y
//     `Windchime` tiene `ObjectUpdate` + `SanitizeAngle` + `DistanceBetweenAngles`.
//     OJO: `Lantern` **no** enciende ni apaga nada; cuelga de una cuerda y se columpia.
//
//   · `ui` — abren una pantalla que ya existe en el port (tablón, Junker, buzón,
//     gachapón, diálogo…) o que todavía no.
//
// Se puede releer con:  python tools/desens.py TreeProp
//                       python tools/dis_addr.py 0x57AA2B4 44

(function (global) {
    'use strict';

    const PPU = 150;

    /** Radio de acierto en unidades de mundo. Los objetos no traen su tamaño. */
    const RADIO = {
        TreeProp: 1.1, Lantern: 0.45, Windchime: 0.45,
        Snowmound: 0.55, SeededEgg: 0.4, SceneItemPickup: 0.4, GachaponEgg: 0.5,
        _por_defecto: 0.6,
    };

    /** Sprite con el que se dibuja cada familia que el escenario no trae ya pintada. */
    const DIBUJA = { Snowmound: true, SeededEgg: true, SceneItemPickup: true };

    const API = {
        datos: null,
        /**
         * Objetos ya recogidos hoy: clave `mapa|indice`.
         *
         * Es una caché, no el sitio donde vive el dato. Lo de verdad va al SAVE, en
         * `sublocations[<sala>].sceneObjectSaves`:
         *
         *     public class SeededSceneObject.SeededObjectSave : SceneObjectSave {
         *         public int objectID; public bool inactive; public int inactiveSeed;
         *     }
         *
         * Antes esto era sólo el `Set`, y al recargar la partida los huevos y los
         * montones de nieve volvían a estar aunque los hubieras cogido.
         */
        recogidos: new Set(),
        _diaRecogidos: null,
        /** Animaciones en curso: clave -> {t0, tipo}. */
        _animando: new Map(),

        async cargar() {
            if (this.datos) return true;
            try {
                const r = await fetch('data/scene_objects.json?v=' + Date.now());
                this.datos = r.ok ? await r.json() : null;
            } catch (e) {
                this.datos = null;
            }
            return !!this.datos;
        },

        /** Los objetos de un mapa, o lista vacía. */
        /**
         * La clave con la que este mapa guarda sus objetos.
         *
         * Un mapa puede tener VARIANTES: la Casa del Arbol es `0` sin ampliar y `0_hc`
         * con Homecoming, y son escenas distintas —level2 y level28— con otros arboles y
         * otras coordenadas. Preguntando solo por `0` se dibujaban los de la casa pequenia
         * en el mundo de la grande, o sea a decenas de metros de donde tocaba, y los 9
         * arboles del fondo de la ampliada no salian nunca: estan marcados `skip` en los
         * visuals justo porque los dibuja este modulo.
         */
        claveMapa(mapId) {
            const MD = global.MapDef;
            return String((MD && MD.efectivo) ? MD.efectivo(mapId) : mapId);
        },

        de(mapId) {
            const d = this.datos;
            if (!d) return [];
            return d[this.claveMapa(mapId)] || [];
        },

        /**
         * Que campana toca cada carillon: su puesto entre los carillones del mapa.
         *
         * Son siete en todo el juego y las campanas son siete, asi que cada uno tiene la
         * suya. El orden es el de `data/scene_objects.json`, que no cambia.
         */
        _campanaDe(o, mapId) {
            const lista = this.de(mapId) || [];
            let n = 0;
            for (const x of lista) {
                if (x === o) return n;
                if (x.clase === 'Windchime') n++;
            }
            return 0;
        },

        clave(mapId, i) { return this.claveMapa(mapId) + '|' + i; },

        /**
         * ¿Se ve hoy este objeto?
         *
         * Los `Snowmound` y los `SeededEgg` pasan por el sorteo diario
         * (`seeded_scene_objects.js`); el resto está siempre. Y lo recogido desaparece
         * hasta el día siguiente, como en el juego.
         */
        visible(o, mapId, i, clock) {
            this._purgarSiCambioElDia(clock);
            if (this.recogidos.has(this.clave(mapId, i))) return false;
            if (!this.condicionSeCumple(o, clock)) return false;

            const SSO = global.SeededSceneObjects;
            if (o.clase === 'Snowmound') {
                return !!(SSO && o.objectId != null
                    && SSO.snowmoundSaleHoy('Snowmound', o.objectId, clock));
            }
            if (o.clase === 'SeededEgg') {
                // OJO: `eggID` NO es un id de items_db, es el TIPO de huevo. Los 13 de la
                // coleccion `EGG` son los 13 tipos (Tsuki, Cosmic, Chicky, Fiery...), y
                // `Egg.AvailableToday` decide cuales 6 estan hoy.
                if (!SSO || o.eggId == null) return true;
                const ticks = (global.app && global.app.parser
                    && global.app.parser.generalVars
                    && global.app.parser.generalVars['GameStart'])
                    ? global.app.parser.generalVars['GameStart'].value : 0;
                return SSO.huevoDisponibleHoy('EGG', o.eggId, clock, ticks);
            }
            return true;
        },

        /**
         * La escena superpuesta a la que pertenece el objeto, ¿está cargada ahora?
         *
         * Es `ConditionalSubscene` del juego: cada mapa declara qué escena extra carga y
         * bajo qué condición (`SeasonalSubscene` con su `season`, `EventSubscene` con su
         * `eventNum`). La tabla completa está en `data/subscenes.json`.
         *
         * Los 42 faroles y campanillas son del Festival de Verano (evento 4) y los 14 de
         * invierno de las escenas `*Winter`/`*Snow` (SeasonID 2). El resto está siempre.
         */
        condicionSeCumple(o, clock) {
            const c = o.condicion;
            if (!c) return true;
            if (!clock) return false;
            if (c.tipo === 'estacion') return (clock.season | 0) === c.valor;
            if (c.tipo === 'evento') {
                const VE = global.VillageEvents;
                if (!VE || typeof VE.activo !== 'function') return false;
                const ev = VE.activo(clock);
                const id = ev && (ev.eventID != null ? ev.eventID : ev.id);
                return id === c.valor;
            }
            return true;
        },

        _purgarSiCambioElDia(clock) {
            const d = clock ? (clock.day | 0) : 0;
            if (this._diaRecogidos !== d) {
                this._diaRecogidos = d;
                this.recogidos.clear();
            }
        },

        /**
         * Qué objeto hay en esta coordenada de mundo, o null.
         * Se recorre al revés para que gane el que se dibuja encima.
         */
        enPunto(mapId, wx, wy, clock) {
            const lista = this.de(mapId);
            for (let i = lista.length - 1; i >= 0; i--) {
                const o = lista[i];
                if (!this.visible(o, mapId, i, clock)) continue;
                const r = RADIO[o.clase] || RADIO._por_defecto;
                // Caja, no círculo: los árboles son altos y se tocan por el tronco.
                const dx = Math.abs(wx - o.x);
                const dy = wy - o.y;
                if (dx <= r && dy >= -0.3 && dy <= r * 2.2) return { obj: o, indice: i };
            }
            return null;
        },

        /**
         * `QuickTap`. Devuelve un texto para el aviso, o null si no pasó nada.
         * `app` es la aplicación, para el inventario y las pantallas.
         */
        tocar(mapId, indice, clock, app, pantalla) {
            // Se guarda para las pantallas que abren una burbuja donde se tocó.
            this._ultimoToque = pantalla || null;
            const lista = this.de(mapId);
            const o = lista[indice];
            if (!o) return null;
            const k = this.clave(mapId, indice);

            if (o.familia === 'shake' || o.familia === 'swing') {
                this._animando.set(k, { t0: performance.now(), tipo: o.familia });
                // EL CARILLON SUENA. `SFXClip` trae `Bell1`..`Bell7`, que no son del
                // tambor: son de `Windchime`, y en el binario las campanas son
                // `Windchime.BellColors[]`. `data/scene_objects.json` trae SIETE
                // carillones, uno por campana, asi que cada uno toca la suya — por su
                // orden dentro del mapa, que es estable —.
                //
                // Los arboles y los faroles se columpian sin sonar: `Lantern.QuickTap`
                // solo llama a `RopeObject.AddForce`.
                if (o.clase === 'Windchime' && global.PlaySfx) {
                    const n = (this._campanaDe(o, mapId) % 7) + 1;
                    global.PlaySfx.sonar('Bell' + n);
                }
                this._latir();
                return null;                                  // solo visual, sin aviso
            }
            if (o.familia === 'collect') {
                this.recogidos.add(k);
                this._guardarRecogido(o, mapId, clock);
                const item = o.item;
                let nombre = o.nombre || 'algo';
                if (item != null) {
                    const db = global.ITEMS_DB && global.ITEMS_DB[String(item)];
                    nombre = (db && (db.furn_name || db.item_name || db.name_es)) || ('ítem ' + item);
                    if (app && typeof app.agregarItemAlInventario === 'function') {
                        try { app.agregarItemAlInventario(item, 1); } catch (e) { /* sin partida */ }
                    }
                }
                return 'Recogido: ' + nombre;
            }
            if (o.familia === 'ui') return this._abrirPantalla(o, k, app);
            return null;
        },

        /**
         * Lo que abre cada objeto de la familia `ui`.
         *
         * Siete se enganchan a sistemas que ya existen en el port. Los otros cinco no son
         * pantallas nuevas, según el binario:
         *   · `SceneDoor.ToggleDoor()` y `Elevator.OpenDoors/CloseDoors` son
         *     CONMUTADORES con estado (la puerta guarda su `DoorSave`), no menús.
         *   · `PotGuyObject.OpenExternalInventory()` enseña `potGuyStorage`, que el
         *     parser ya lee.
         *   · `MailboxObject` enseña las cartas, que también están en el save.
         *   · `PaigeSummerNote` enseña una nota.
         */
        _abrirPantalla(o, k, app) {
            const puentes = {
                // `PlayBountyBoard` va PRIMERO: es la ventana de verdad, sacada de
                // `level8` con sus texturas. `BountySystem` es el tablón dibujado a
                // mano de antes, que se queda de respaldo por si no cargan los datos.
                BountyBoardObject: ['PlayBountyBoard', 'Bounty', 'BountySystem'],
                Junker: ['Junker'],
                GachaponEgg: ['Gacha', 'GachaSystem'],
                HomeUpgradeBlueprint: ['Homecoming', 'HomecomingSystem'],
                Dialogue: ['DialogueManager', 'Dialogos'],
            };
            for (const n of (puentes[o.clase] || [])) {
                const m = global[n];
                if (m && typeof m.abrir === 'function') { m.abrir(); return null; }
                if (m && typeof m.open === 'function') { m.open(); return null; }
            }

            if (o.clase === 'SceneDoor' || o.clase === 'Elevator') {
                const abierto = !this.abiertos.has(k);
                if (abierto) this.abiertos.add(k); else this.abiertos.delete(k);
                // `SFXClip.ElevatorButton` y las puertas. El ascensor del juego tiene
                // ademas `ElevatorAlarm` / `ElevatorAlarmEnd`, que son del estado de
                // alarma: el port no lo modela y no se inventan.
                if (global.PlaySfx && o.clase === 'Elevator') {
                    global.PlaySfx.sonar('elevatorButton');
                    global.PlaySfx.sonar(abierto ? 'elevatorDoorsOpen' : 'elevatorDoorsClose');
                }
                return (o.clase === 'Elevator' ? 'Ascensor' : 'Puerta') + ': '
                    + (abierto ? 'abierta' : 'cerrada');
            }
            if (o.clase === 'PotGuyObject') {
                const inv = this._delSave(app, 'getPotGuyStorage');
                // `PotGuyObject.OpenExternalInventory()` abre el `MiniInventory`, que es
                // la ventana `ExternalInventory` de level14. Desde que esta montada se
                // abre esa en vez de devolver un recuento.
                if (global.PlayPopups && typeof global.PlayPopups.almacen === 'function') {
                    global.PlayPopups.almacen(inv || []);
                    return null;
                }
                return 'Pot Guy: ' + (inv && inv.length ? inv.length + ' objetos guardados'
                                                        : 'no guarda nada');
            }
            if (o.clase === 'MailboxObject') {
                // El buzón de la escena hace lo mismo que el mueble: `MailboxObject` y
                // `MailboxFurniture` abren los dos el sobre. Desde que existe
                // `play_mail.js` esto ya no es sólo un recuento.
                if (global.PlayMail && global.BubbleSystem) {
                    const t = this._ultimoToque || { x: 0, y: 0 };
                    global.PlayMail.intentarToque(
                        { item_id: global.PlayMail.MUEBLE_BUZON }, t.x, t.y);
                    return null;
                }
                const cartas = this._delSave(app, 'getLetters');
                return 'Buzón: ' + (cartas && cartas.length ? cartas.length + ' cartas'
                                                            : 'vacío');
            }
            if (o.clase === 'PaigeSummerNote') return 'Nota de Paige';
            return o.clase + ': sin pantalla todavía';
        },

        /**
         * Apunta en el save que este objeto está recogido.
         *
         * La semilla es la del día, que es lo que hace que vuelva a estar mañana sin que
         * nadie borre nada: el juego compara `inactiveSeed` con la semilla de hoy y, si no
         * coincide, la marca ya no vale.
         *
         * Sólo se guardan los que tienen `objectId`: es la clave con la que el juego los
         * identifica dentro de la sala, y sin ella la entrada no le serviría de nada.
         */
        _guardarRecogido(o, mapId, clock) {
            const p = global.app && global.app.parser;
            if (!p || typeof p.setSeededObjectRecogido !== 'function') return false;
            if (o.objectId == null) return false;
            const sala = this._salaDe(mapId);
            if (sala == null) return false;
            const semilla = clock ? (clock.day | 0) : 0;
            try {
                return p.setSeededObjectRecogido(sala, o.objectId, true, semilla);
            } catch (e) { return false; }
        },

        /** La sublocación de un mapa: el número con el que empieza su id. */
        _salaDe(mapId) {
            const m = String(this.claveMapa(mapId)).match(/^(\d+)/);
            return m ? Number(m[1]) : null;
        },

        /**
         * Lo que el save ya da por recogido HOY, al cargar la partida.
         *
         * Se llama al abrir un mapa. Sin esto, el `Set` empieza vacío y lo que cogiste
         * antes de guardar volvería a aparecer.
         */
        cargarRecogidosDelSave(mapId, clock) {
            const p = global.app && global.app.parser;
            if (!p || typeof p.getSeededObjectRecogido !== 'function') return 0;
            const sala = this._salaDe(mapId);
            if (sala == null) return 0;
            const hoy = clock ? (clock.day | 0) : 0;
            let n = 0;
            const lista = this.de(mapId);
            for (let i = 0; i < lista.length; i++) {
                const o = lista[i];
                if (o.familia !== 'collect' || o.objectId == null) continue;
                let e = null;
                try { e = p.getSeededObjectRecogido(sala, o.objectId); } catch (err) { e = null; }
                // La marca sólo vale para SU día: con otra semilla, el objeto vuelve.
                if (e && e.recogido && Number(e.semilla) === hoy) {
                    this.recogidos.add(this.clave(mapId, i));
                    n++;
                }
            }
            if (n) this._diaRecogidos = hoy;
            return n;
        },

        /** Puertas y ascensores abiertos, por clave. */
        abiertos: new Set(),

        _delSave(app, metodo) {
            const p = app && app.parser;
            if (!p || typeof p[metodo] !== 'function') return null;
            try { return p[metodo](); } catch (e) { return null; }
        },

        /** Desplazamiento de la animación de sacudida/balanceo, en radianes. */
        anguloDe(mapId, indice) {
            const a = this._animando.get(this.clave(mapId, indice));
            if (!a) return 0;
            const t = (performance.now() - a.t0) / 1000;
            const dur = a.tipo === 'shake' ? 0.6 : 1.4;
            if (t > dur) { this._animando.delete(this.clave(mapId, indice)); return 0; }
            const amp = a.tipo === 'shake' ? 0.07 : 0.16;
            const frec = a.tipo === 'shake' ? 18 : 7;
            return Math.sin(t * frec) * amp * (1 - t / dur);      // oscilación que decae
        },

        /** Repinta mientras dure alguna sacudida o balanceo. */
        _latir() {
            if (this._raf !== undefined) return;
            const paso = () => {
                this._raf = undefined;
                const m = global.app && global.app.map;
                if (m) { try { m.draw(); } catch (e) { } }
                if (this._animando.size > 0 && typeof requestAnimationFrame === 'function') {
                    this._raf = requestAnimationFrame(paso);
                }
            };
            if (typeof requestAnimationFrame === 'function') this._raf = requestAnimationFrame(paso);
        },

        hayAnimacion() { return this._animando.size > 0; },
        DIBUJA,
    };

    global.SceneObjects = API;
    if (typeof module !== 'undefined' && module.exports) module.exports = API;

    if (typeof fetch === 'function') {
        const arrancar = () => API.cargar().then(() => {
            if (global.app && global.app.map) { try { global.app.map.draw(); } catch (e) { } }
        }).catch(() => { });
        if (typeof document !== 'undefined' && document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', arrancar, { once: true });
        } else {
            arrancar();
        }
    }
})(typeof window !== 'undefined' ? window : globalThis);
