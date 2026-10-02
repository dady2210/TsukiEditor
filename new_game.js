// new_game.js — empezar una partida de cero.
//
// CÓMO SE HACE
// ------------
// El serializador ya existía y está probado en cada exportación: `parser.getBuffer()`
// vuelca el árbol entero con `OdinWriter`, y su rama de array escribe
// `node.elements.length`, no el largo que venía en el fichero. O sea que **los cambios
// estructurales ya se serializan solos**: basta dejar el árbol como se quiere.
//
// Por eso una partida nueva no se fabrica byte a byte —eso pediría conocer el marcador y
// el tipo de los 80 campos de `TsukiSave`, y uno mal deja el save ilegible— sino que se
// parte de uno cargado y se le quita todo: las listas se vacían, los contadores se ponen
// a cero y los ajustes del jugador se respetan.
//
// LA TABLA SALE DE `TsukiSave`
// ----------------------------
// Los 80 campos del binario, clasificados. No es una lista a ojo: cada nombre está en la
// declaración de la clase (`dump.cs`, TypeDefIndex 5241), y los que este save no tenga se
// saltan sin fallar.
//
//   NewGame.previsualizar()   qué cambiaría y qué se vaciaría, sin escribir
//   NewGame.empezar()         lo aplica
//   NewGame.empezar({ zanahorias: 500 })

(function (global) {
    'use strict';

    const OA_EPOCH = 25569;              // día OA de 1970-01-01
    const SLOCATION_CASA = 0;            // SLocation.Home

    // ── Contadores de partida: todos a cero ──────────────────────────────
    const A_CERO = [
        'carrots', 'punchcardsClaimed', 'carrotsSpent', 'carrotsEarned', 'carrotsGiven',
        'carrotsBought', 'furnitureBought', 'furnitureSold', 'itemsBought', 'itemsSold',
        'fishCaught', 'gachaRolled', 'newspapersRead', 'harvestTimes', 'bountiesClaimed',
        'camBountiesClaimed', 'bagTransmog', 'hoeTransmog', 'cloversBred', 'junkerUsed',
        'nodesBroken', 'ordersMade', 'homecomingUpdates', 'ravenChapter',
        'lastChapterComplete', 'lastSprayDesign', 'rerollDay', 'unluckiness',
        'peakEfficiency',
    ];

    // ── Listas que en una partida nueva están vacías ─────────────────────
    const A_VACIAR = [
        'diarySaves',             // el diario
        'keyItemsBought',         // objetos clave comprados
        'uniqueFurnitureBought',  // muebles únicos
        'lostItems',              // objetos perdidos
        'newspapers',             // periódicos leídos
        'eventSaves',             // festivales del pueblo
        'spEventSaves',           // eventos especiales
        'tempTimers',             // temporizadores
        'potGuyStorage',          // lo que guarda el tipo de la maceta
        'dailyItemTracker',       // objetos del día
        'orders',                 // encargos de muebles
        'liminalSaves',           // NPC liminales
        'conditionSaves',         // condiciones de NPC
        'collection',             // la colección
        'lostItems',
    ];

    // ── Lo que NO se toca, y por qué ─────────────────────────────────────
    // Ajustes del jugador (`conserveBattery`, `reduceMotion`, `hapticsEnabled`,
    // `forceMusic`, `notifFlags`, `farmNotifSettings`, `penpalName`, `fingerOffset`,
    // `startBedtime`, `endBedtime`, `lastDeviceUsed`) — son preferencias, no progreso.
    //
    // Y la estructura pesada (`sublocations`, `items`, `npcSaves`, `punchcard`,
    // `phoneSave`, `trainSave`, `trip`, `activity`, `parsnapSave`, `apartmentSaves`,
    // `letters`, `deliverySave`) se deja como está: son diccionarios y objetos anidados
    // cuyo vaciado no es quitar elementos de una lista, y el juego los espera presentes.
    // `empezar()` lo dice en `sinTocar` en vez de fingir que están limpios.
    const SIN_TOCAR = [
        'muebles colocados (sublocations)', 'inventario (items)', 'amistad con los NPC',
        'punchcard', 'cartas', 'tren y viaje en curso', 'apartamentos',
    ];

    function hoyOA() {
        const d = new Date();
        return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000) + OA_EPOCH;
    }

    /** SeasonID del juego: 0 verano, 1 otoño, 2 invierno, 3 primavera. */
    function estacionDeMes(m) {
        if (m >= 6 && m <= 8) return 0;
        if (m >= 9 && m <= 11) return 1;
        if (m === 12 || m <= 2) return 2;
        return 3;
    }

    const API = {
        get parser() { return global.app && global.app.parser; },

        A_CERO, A_VACIAR, SIN_TOCAR,

        /** Qué pasaría, sin tocar nada. */
        previsualizar() {
            const p = this.parser;
            if (!p) return { ok: false, motivo: 'sin partida cargada' };
            const oa = hoyOA();
            const mes = new Date((oa - OA_EPOCH) * 86400000).getUTCMonth() + 1;
            const c = (typeof p.getClock === 'function') ? p.getClock() : {};
            const listas = {};
            for (const n of A_VACIAR) {
                const t = (typeof p.tamanoLista === 'function') ? p.tamanoLista(n) : null;
                if (t) listas[n] = t;
            }
            const contadores = {};
            for (const n of A_CERO) {
                const v = (typeof p.getCounter === 'function') ? p.getCounter(n) : 0;
                if (v) contadores[n] = v;
            }
            return {
                ok: true,
                de: {
                    dia: c.day, mes: c.month, estacion: c.season,
                    tutorialStep: (typeof p.getTutorialStep === 'function') ? p.getTutorialStep() : null,
                    contadoresConValor: contadores,
                    listasConContenido: listas,
                },
                a: { dia: oa, mes: mes, estacion: estacionDeMes(mes), tutorialStep: 0 },
                sinTocar: SIN_TOCAR,
            };
        },

        /**
         * Devuelve la partida al día uno.
         * `opciones.zanahorias` fija el saldo inicial (por defecto 0).
         */
        empezar(opciones) {
            const o = opciones || {};
            const p = this.parser;
            if (!p) return { ok: false, motivo: 'sin partida cargada' };

            const hecho = [];
            const fallos = [];
            const vaciadas = {};
            const paso = (nombre, fn) => {
                try { if (fn() !== false) hecho.push(nombre); else fallos.push(nombre + ': no está en este save'); }
                catch (e) { fallos.push(nombre + ': ' + e.message); }
            };

            const oa = hoyOA();
            const mes = new Date((oa - OA_EPOCH) * 86400000).getUTCMonth() + 1;
            const ahora = new Date();

            paso('reloj', () => {
                if (typeof p.setClock !== 'function') return false;
                p.setClock({ day: oa, month: mes, season: estacionDeMes(mes),
                             hour: ahora.getHours(), minute: ahora.getMinutes() });
            });

            paso('día de inicio', () => {
                if (typeof p.writeGeneralVar !== 'function') return false;
                return p.writeGeneralVar('gameStartOA', oa);
            });

            paso('tutorial a cero', () => {
                if (typeof p.setTutorialStep !== 'function') return false;
                return p.setTutorialStep(0);
            });

            paso('contadores', () => {
                if (typeof p.writeGeneralVar !== 'function') return false;
                let alguno = false;
                for (const n of A_CERO) {
                    if (p.generalVars && p.generalVars[n]) { p.writeGeneralVar(n, 0); alguno = true; }
                }
                if (o.zanahorias) p.writeGeneralVar('carrots', o.zanahorias | 0);
                return alguno;
            });

            paso('listas', () => {
                if (typeof p.vaciarLista !== 'function') return false;
                let alguna = false;
                for (const n of A_VACIAR) {
                    const q = p.vaciarLista(n);
                    if (q !== null) { alguna = true; if (q) vaciadas[n] = q; }
                }
                return alguna;
            });

            // El teléfono: solo la Casa. No se vacía la lista —el juego espera sus
            // entradas— sino que se apaga el `seen` de todo lo demás, que es lo que
            // decide si un sitio sale en la lista de viaje.
            // El teléfono: solo la Casa. Se apaga el `seen` de cada entrada DIRECTAMENTE,
            // no con `setLocationUnlocked`: ése busca la primera entrada con ese id y el
            // save trae ids repetidos, así que solo habría apagado una de cada.
            paso('teléfono', () => {
                if (typeof p.getLocationsOnPhone !== 'function') return false;
                const locs = p.getLocationsOnPhone() || [];
                if (!locs.length) return false;
                let tocadas = 0;
                for (const l of locs) {
                    if (!l.seenNode) continue;
                    l.seenNode.value = (Number(l.id) === SLOCATION_CASA);
                    tocadas++;
                }
                return tocadas > 0;
            });

            // El trabajo del día solo se pide si el módulo está cargado: en una prueba de
            // Node no lo está, y eso no es un fallo de la partida nueva.
            const omitido = [];
            if (global.DayCycle && typeof global.DayCycle.refrescar === 'function') {
                paso('trabajo del día', () => { global.DayCycle.refrescar(); });
            } else {
                omitido.push('trabajo del día (DayCycle no cargado)');
            }

            return {
                ok: fallos.length === 0,
                dia: oa,
                hecho: hecho,
                vaciadas: vaciadas,
                omitido: omitido,
                fallos: fallos,
                sinTocar: SIN_TOCAR,
            };
        },
    };

    // ══ FABRICAR UNA PARTIDA DE CERO ════════════════════════════════
    //
    // `empezar()` necesita una partida cargada. Esto no: construye el `.csave` entero,
    // desde el primer byte, sin ningún fichero de partida.
    //
    // LO QUE HACÍA FALTA
    // -----------------
    // Un `.csave` es un volcado de Odin, y cada nodo lleva su marcador, su id de tipo y
    // el NOMBRE COMPLETO del tipo -`System.Collections.Generic.Dictionary`2[[System.Int32,
    // mscorlib],[SublocationSave, Odyssey]], mscorlib`-. Eso no sale de `dump.cs`: `dump.cs`
    // da los campos de `TsukiSave` y sus tipos de C#, no cómo los nombra Odin al escribir.
    //
    // Por eso la FORMA viene en `data/csave_plantilla.json`, que la saca
    // `tools/build_csave_plantilla.js` de un save cualquiera separando dos cosas: la forma
    // -los 101 campos con su marcador y su tipo, que es el formato y no cambia- y el avance
    // -los valores, que en el día uno están a cero-. La herramienta se niega a escribir si
    // queda un solo campo sin clasificar.
    //
    // El port lleva la plantilla dentro. No hace falta traer un save de ningún sitio.

    const OA_MS = 86400000;

    /** El instante de ahora en fecha OLE, que es como guarda el juego las fechas. */
    function ahoraOA() {
        return (Date.now() / OA_MS) + OA_EPOCH;
    }

    /**
     * JSON -> nodos de Odin.
     *
     * Las clases (`OdinNode`, `OdinList`…) las define `odin_browser.js`. No se importan:
     * son declaraciones de clase en el ámbito global, igual que las usa el resto del port.
     */
    function nodoDe(j) {
        if (!j) return null;
        switch (j.k) {
            case 'nodo': {
                const n = new OdinNode(j.m, j.n, j.t, j.tn, j.id);
                n.children = (j.c || []).map(nodoDe);
                return n;
            }
            case 'lista': {
                const l = new OdinList(j.m, j.n, j.len);
                l.elements = (j.e || []).map(nodoDe);
                // El escritor usa `elements.length`, no `length`, así que una lista que se
                // vacíe aquí se serializa vacía sola. Se dejan cuadrados igualmente.
                l.length = l.elements.length;
                return l;
            }
            case 'ent': return new OdinDictionaryEntry(nodoDe(j.key), nodoDe(j.val));
            case 'prim': return new OdinPrimitive(j.m, j.n, valorDe(j.v));
            case 'str': return new OdinString(j.m, j.n, j.v);
            case 'nulo': return new OdinNull(j.m, j.n);
            case 'ref': return new OdinInternalReference(j.m, j.n, j.id);
            case 'arr': {
                const bin = atob(j.d);
                const u8 = new Uint8Array(bin.length);
                for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
                return new OdinPrimitiveArray(j.m, j.n, j.ne, j.bpe, u8);
            }
            default: throw new Error('nodo desconocido en la plantilla: ' + j.k);
        }
    }

    /** Los enteros grandes vienen como `{ $big: "123" }`: el lector los da en BigInt. */
    function valorDe(v) {
        if (v && typeof v === 'object' && v.$big !== undefined) return BigInt(v.$big);
        return v;
    }

    let plantilla = null;
    let cargandoPlantilla = null;

    function cargarPlantilla() {
        if (plantilla) return Promise.resolve(plantilla);
        if (cargandoPlantilla) return cargandoPlantilla;
        const pre = (global.location && global.location.pathname.indexOf('/HERRAMIENTAS/') >= 0)
            ? '../../' : '';
        cargandoPlantilla = fetch(pre + 'data/csave_plantilla.json')
            .then(r => (r.ok ? r.json() : null))
            .then(j => { plantilla = j; return plantilla; })
            .catch(() => null);
        return cargandoPlantilla;
    }

    /** Para pruebas y para quien ya la tenga cargada. */
    function usarPlantilla(p) { plantilla = p; return plantilla; }

    /**
     * El árbol de una partida nueva, listo para serializar.
     *
     * `opciones.zanahorias` fija el saldo inicial (0 por defecto) y `opciones.idioma` el
     * idioma. Lo demás sale de la plantilla.
     */
    function construirArbol(opciones) {
        const o = opciones || {};
        if (!plantilla || !plantilla.raiz) throw new Error('falta data/csave_plantilla.json');
        const raiz = nodoDe(plantilla.raiz);
        const oa = ahoraOA();
        const pon = (nombre, v) => {
            const c = raiz.children.find(x => x.name === nombre);
            if (c) { c.value = v; return true; }
            return false;
        };
        // Las fechas de una partida recién creada: todas ahora.
        pon('gameStartOA', oa);
        pon('firstSaved', oa);
        pon('lastSaved', oa);
        pon('lastCloudSaveOA', oa);
        pon('lastLegitTimeOA', oa);
        // `CastleTools::GetScrambledDeviceID` es el identificador del móvil que la creó.
        // Aquí no hay móvil, así que va vacío en vez de copiar el de otro.
        pon('lastDeviceUsed', '');
        if (o.idioma !== undefined) pon('language', BigInt(o.idioma));
        if (o.zanahorias) pon('carrots', o.zanahorias | 0);
        return raiz;
    }

    /** Los bytes del `.csave`. */
    function bytesDe(arbol) {
        const w = new OdinWriter();
        const out = w.write([arbol]);
        return out instanceof Uint8Array ? out : new Uint8Array(out);
    }

    /**
     * Fabrica la partida y la deja cargada, como si se hubiera abierto un fichero.
     *
     * Pasa por el mismo camino que un save de verdad -se serializa y se vuelve a leer con
     * `CsaveIO.loadCsave`-, que es la única forma de saber que lo fabricado es legible:
     * si el árbol estuviera mal, la relectura fallaría aquí y no en el móvil.
     */
    function fabricar(opciones) {
        return cargarPlantilla().then(() => {
            const arbol = construirArbol(opciones);
            const bytes = bytesDe(arbol);
            let parser = null;
            if (global.CsaveIO && typeof global.CsaveIO.loadCsave === 'function') {
                // `SaveParser` monta un `DataView` sobre lo que se le pase, asi que
                // necesita el ArrayBuffer, no la vista. Con la vista revienta con un
                // «First argument to DataView constructor must be an ArrayBuffer», que
                // no dice donde esta el problema.
                parser = global.CsaveIO.loadCsave(bytes.buffer);
            }
            if (!parser) return { ok: false, bytes: bytes, parser: null };

            // ── Lo que el juego mete en una partida recien creada ────────────
            //
            // `TsukiSave::InitializeNewSave` (0x585a368) no deja el inventario vacio:
            //
            //     new ItemInventorySlot(InvType 0, ID 123, x1)   -> el **Saco**, que es
            //                                                       el `BagUpgrade`
            //     TryAdd(ItemData.items[342], x1)                -> **Semillas de
            //                                                       Zanahoria**
            //
            // Sin el saco la capacidad de la mochila arranca mal desde el primer
            // segundo, y sin las semillas el tutorial no tiene que plantar.
            const objetos = (global.PlayTutorial && global.PlayTutorial.objetosDeSalida)
                ? global.PlayTutorial.objetosDeSalida(parser)
                : { ok: false, motivo: 'falta play_tutorial.js' };

            // Y arranca el tutorial: `Tutorial::StartTutorial` bloquea el menu y las
            // zanahorias y se mete en el **paso 1**, no en el 0. Con el paso a 0 la barra
            // sólo enseña la mochila y las seis apps del telefono quedan bloqueadas.
            let tutorial = null;
            if (global.PlayTutorial) {
                const antes = global.app && global.app.parser;
                if (global.app) global.app.parser = parser;   // `empezar()` lee de ahi
                try { tutorial = global.PlayTutorial.empezar(); }
                finally { if (global.app && antes !== undefined) global.app.parser = antes; }
            }

            // Los bytes vuelven a salir del arbol YA con los objetos y el paso puestos:
            // si no, lo que se exportara no seria lo que se esta jugando.
            let salida = bytes;
            try {
                if (typeof parser.getBuffer === 'function') {
                    const b2 = parser.getBuffer();
                    if (b2 && b2.length) salida = (b2 instanceof Uint8Array) ? b2 : new Uint8Array(b2);
                }
            } catch (e) { /* si no se puede reserializar, valen los de antes */ }

            return { ok: true, bytes: salida, parser: parser,
                     objetos: objetos, tutorial: tutorial };
        });
    }

    API.fabricar = fabricar;
    API.construirArbol = construirArbol;
    API.bytesDe = bytesDe;
    API.cargarPlantilla = cargarPlantilla;
    API.usarPlantilla = usarPlantilla;
    Object.defineProperty(API, 'plantilla', { get: () => plantilla });

    global.NewGame = API;
})(typeof window !== 'undefined' ? window : globalThis);
