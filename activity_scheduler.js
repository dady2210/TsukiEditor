// activity_scheduler.js — que hace cada vecino y donde esta.
//
// De aqui salen las tres puertas que mas usan los dialogos, y que entre las tres son
// el 68% de todas las condiciones:
//
//     Activity         296 veces   que actividad esta haciendo ese NPC
//     CharInLocation   241 veces   donde esta ese NPC
//     IsAtPost          79 veces   si esta en su puesto
//
// La clave es que NO hay que simular nada para responderlas: el save ya lo guarda.
// Cada uno de los 35 vecinos tiene su `activitySave` con
//
//     ActivityID        que esta haciendo
//     NpcID             quien (es charId - 1, porque CharEnum empieza en Tsuki = 0)
//     ActivityStart     cuando empezo, en dias OA
//     Valid             si hay actividad viva; cuando es false, no esta haciendo nada
//     placementPointer.containerID.sublocationID   <- DONDE esta, en SLocation
//
// Comprobado sobre los cuatro saves: 66 de 66 `activitySave` validos apuntan a una
// actividad que existe en el catalogo de ese personaje, y `NpcID == charId - 1` en
// los 66. Los que no cuadraban eran todos `Valid: false`, o sea sin estrenar.
//
// El catalogo (data/activities.json, de tools/extract_activities.py) trae las 1163
// actividades con sus franjas horarias, su puesto y sus condiciones. Sirve para dos
// cosas: traducir un ActivityID a algo con sentido, y saber que actividades PODRIAN
// estar activas a una hora dada.
//
// Lo que NO hace: sortear una actividad nueva cuando avanza el reloj. El juego lo hace
// con `RollNPC`, que no esta portado. Aqui se lee lo que hay guardado; si mueves el
// reloj, los vecinos siguen donde el save dice que estan.

(function () {
    'use strict';

    // SLocation, del dump de IL2CPP.
    const SLOCATION = [
        'Home', 'YorisShop', 'ChisHouse', 'MocasHouse', 'Pier', 'RosemarysShop',
        'Farm', 'OpeningScene', 'TownHall', 'MomosTeaHouse', 'TrainStation',
        'DawnsShop', 'Dojo', 'ScarlettsLounge', 'Travelling', 'SubwayStation',
        'CityHall', 'Exit', 'Skytower', 'CapsuleHotel', 'ApartmentLobby', 'TheHole',
        'Penthouse', 'ShoppingMall', 'MallEntrance', 'RugShop', 'Winery',
        'IceCreamShop', 'JewelryStore', 'PostOffice', 'BubbleTea', 'ShoeStore',
        'PoliceStation', 'CoffeeShop', 'Apartment',
    ];

    // Condition.ConditionType
    const T = {
        Carrots: 0, DayOfWeek: 1, Random: 2, Battery: 3, ItemRequired: 4, Day: 5,
        Time: 6, Friendship: 7, FriendCondition: 8, FriendConditionLevel: 9,
        AdReady: 10, Tutorial: 11, Activity: 12, CharInLocation: 13, EditingRoom: 14,
        DaysPlayed: 15, LocationUnlocked: 16, IsManningShop: 17, CurrentEmotion: 18,
        FurnInLocation: 19, FishCaught: 20, Pester: 21, Complex: 22, Overfished: 23,
        FurnBought: 24, ItemCollected: 25, InventorySlotsEmpty: 26,
        SetFurnitureBought: 27, FurnCollected: 28, Newspaper: 29, FurnInInventory: 30,
        NewspaperOfTheDay: 31, NewspaperEventIntroTriggered: 32, FurnTypeInLocation: 33,
        CurrentBGM: 34, ParsnapAcquired: 35, VillageEvent: 36, VillageEventTask: 37,
        ActivityFlag: 38, Season: 39, IsAtPost: 40, LocationUpgraded: 41, Custom: 42,
        VillageEventTasksComplete: 43, VillageEventTasksIncomplete: 44,
        VillageEventComplete: 45, Homecoming: 46, CustomFurnInLocation: 47,
        RavenChapter: 48, RavenPostChapter: 49, MoonPhase: 50, FurnCountInLocation: 51,
        Platform: 52, Year: 53, MusicMuted: 54, Weather: 55, HeavyWeather: 56,
        CharIsOutdoors: 57,
    };

    /** ConditionCheck: 0 MoreOrEqual, 1 Equal, 2 Less. */
    function comparar(actual, check, esperado) {
        if (check === 1) return actual === esperado;
        if (check === 2) return actual < esperado;
        return actual >= esperado;          // 0, y cualquier cosa rara
    }

    const API = {
        catalogo: null,
        // Cuantas condiciones no hemos sabido juzgar, por tipo. Para que se vea que
        // falta en vez de fingir que se evalua todo.
        desconocidas: {},

        get parser() { return window.app && window.app.parser; },

        async load() {
            if (this.catalogo) return this.catalogo;
            try {
                const r = await fetch('data/activities.json');
                this.catalogo = r.ok ? await r.json() : { npcs: {}, comunes: [] };
            } catch (e) {
                this.catalogo = { npcs: {}, comunes: [] };
            }
            // Indices por npcID y por actividad, que es como se pregunta.
            this._porNpcID = {};
            this._actividades = {};
            this._puestos = {};
            for (const [nombre, v] of Object.entries(this.catalogo.npcs || {})) {
                this._porNpcID[v.npcID] = { nombre, npcID: v.npcID, character: v.character,
                                            activities: v.activities, posts: v.posts || [] };
                for (const a of v.activities) {
                    this._actividades[v.npcID + ':' + a.activityID] = a;
                }
                if (v.posts && v.posts.length) this._puestos[v.npcID] = v.posts;
            }
            for (const a of (this.catalogo.comunes || [])) {
                this._actividades['*:' + a.activityID] = a;
            }
            // Las condiciones compuestas viven en otro asset.
            try {
                const rp = await fetch('data/progression.json');
                this.progresion = rp.ok ? await rp.json() : null;
            } catch (e) {
                this.progresion = null;
            }
            return this.catalogo;
        },

        nombreLugar(id) {
            const n = Number(id);
            return (n >= 0 && n < SLOCATION.length) ? SLOCATION[n] : ('SLocation ' + n);
        },

        // ── lo que dice el save ──────────────────────────────────────────

        /**
         * El `activitySave` de un vecino, ya desmenuzado. `null` si no tiene ficha;
         * `valid: false` si la tiene pero sin actividad viva.
         */
        estado(charId) {
            const p = this.parser;
            if (!p || typeof p.getNPCSave !== 'function') return null;
            const f = p.getNPCSave(charId);
            if (!f || !f.node) return null;
            const a = (f.node.children || []).find(c => c.name === 'activitySave');
            if (!a) return null;
            const g = k => (a.children || []).find(c => c.name === k);
            const num = k => { const n = g(k); return n == null ? null : Number(n.value); };

            // Hay dos formas de activitySave y el `containerID` no esta en el mismo
            // sitio en las dos:
            //
            //   atado a un mueble  placementPointer.containerID + placementID
            //   sobre la rejilla   containerID en la raiz, + groupPosition y Orientation
            //
            // Mirando solo la primera se perdian nueve vecinos: salian con actividad
            // viva pero sin lugar.
            let sub = null, placement = null, rejilla = null, orientacion = null;
            const pp = g('placementPointer');
            const cid = pp ? (pp.children || []).find(c => c.name === 'containerID')
                           : g('containerID');
            let vagon = null;
            if (cid) {
                const s = (cid.children || []).find(c => c.name === 'sublocationID');
                if (s) sub = Number(s.value);
                // En el tren el contenedor es otra cosa: lleva CarriageID y no
                // sublocationID. No esta en ninguna sala del pueblo, asi que el lugar
                // se queda en null y el vagon se expone aparte.
                const v = (cid.children || []).find(c => c.name === 'CarriageID');
                if (v) vagon = Number(v.value);
            }
            if (pp) {
                const pid = (pp.children || []).find(c => c.name === 'placementID');
                if (pid) placement = Number(pid.value);
            }
            const gp = g('groupPosition');
            if (gp) {
                const gr = (gp.children || []).find(c => c.name === 'grid');
                const gn = (gp.children || []).find(c => c.name === 'groupNum');
                if (gr) {
                    const gx = (gr.children || []).find(c => c.name === 'x');
                    const gy = (gr.children || []).find(c => c.name === 'y');
                    rejilla = { x: gx ? Number(gx.value) : 0, y: gy ? Number(gy.value) : 0,
                                grupo: gn ? Number(gn.value) : 0 };
                }
            }
            const or = g('Orientation');
            if (or) orientacion = Number(or.value);
            // Las actividades de vector no guardan contenedor: solo el indice de la
            // posicion dentro de `positions` de su definicion, y alli esta el lugar.
            const pi = g('PositionIndex');
            const indicePos = pi ? Number(pi.value) : null;
            return {
                charId: Number(charId),
                npcID: num('NpcID'),
                activityID: num('ActivityID'),
                inicio: num('ActivityStart'),
                valid: String((g('Valid') || {}).value) === 'true',
                seen: String((g('Seen') || {}).value) === 'true',
                pester: num('Pester') || 0,
                sublocationID: sub,
                placementID: placement,
                rejilla: rejilla,
                orientacion: orientacion,
                vagon: vagon,
                indicePos: indicePos,
                nodo: a,
            };
        },

        /** El ActivityObject del catalogo, o null. */
        definicion(npcID, activityID) {
            if (!this._actividades) return null;
            return this._actividades[npcID + ':' + activityID]
                || this._actividades['*:' + activityID] || null;
        },

        /** Que esta haciendo: el id, o null si no tiene actividad viva. */
        haciendo(charId) {
            const e = this.estado(charId);
            return (e && e.valid) ? e.activityID : null;
        },

        /**
         * Donde esta, como SLocation. null si no se sabe.
         *
         * Con contenedor es directo. Las de vector no lo tienen: hay que mirar
         * `positions[PositionIndex].sublocationID` en la definicion de la actividad,
         * que es lo que se extrae en la cola de VectorActivityObject.
         */
        donde(charId) {
            const e = this.estado(charId);
            if (!e || !e.valid) return null;
            if (e.sublocationID != null) return e.sublocationID;
            if (e.indicePos != null) {
                const d = this.definicion(e.npcID, e.activityID);
                const pos = d && d.positions;
                if (pos && pos.length) {
                    const p = pos[e.indicePos] || pos[0];
                    if (p && p.sublocationID != null) return p.sublocationID;
                }
            }
            return null;
        },

        /** En que puesto esta. Sale de la definicion de su actividad. */
        puesto(charId) {
            const e = this.estado(charId);
            if (!e || !e.valid) return null;
            const d = this.definicion(e.npcID, e.activityID);
            return d ? d.post : null;
        },

        // ── LA AGENDA DE UN VECINO ───────────────────────────────────────
        //
        // Donde puede estar cada uno y a que horas, sacado de sus `ActivityObject`. No
        // es lo mismo que el puesto: el puesto es UN sitio fijo con su horario, y solo
        // lo tienen 23 de los 94 personajes. La agenda vale para todos.
        //
        // De donde sale cada cosa:
        //   timings     del propio `ActivityObject`, en minutos desde medianoche
        //   post        si la actividad usa puesto, hereda SUS horas (salvo que traiga
        //               `dontUsePostTimings`)
        //   lugar       de la cola de la subclase: `rejilla.locationSelection.locations`
        //               o `mueble.locationSelection.locations`, donde cada entrada trae
        //               un `selection` que es el id GLOBAL (sublocacion * 100 + local)
        //
        // Un dia de Rosemary, por ejemplo:
        //   act 1, 22   su puesto: la tienda, de 07:00 a 19:00
        //   act 24      12:00-17:00 en la tienda
        //   act 23      05:00-07:00 y 20:15-23:00 en la tienda o en el muelle
        //   act 20      19:00-24:00 en la casa de te de Momo o en el taller de Dawn
        //   act 2       21:00-02:00 en la tienda o en la granja

        /** Las sublocaciones donde puede ocurrir esa actividad. */
        lugaresDe(def) {
            if (!def) return [];
            const cola = def.rejilla || def.mueble;
            if (!cola || !cola.locationSelection) return [];
            const fuera = [];
            for (const L of (cola.locationSelection.locations || [])) {
                if (!L.selection) continue;
                const sub = Math.floor(L.selection / 100);
                if (!fuera.includes(sub)) fuera.push(sub);
            }
            return fuera;
        },

        /**
         * Que puede hacer ese vecino -por `npcID`-, con sus horas y sus sitios.
         *
         * `soloAhora` deja solo lo que encaja con el reloj que se pase. Sin el, sale
         * todo, que es lo util para revisar a un personaje entero.
         *
         * Es lo que PODRIA hacer, no lo que esta haciendo: para eso esta `haciendo`,
         * que lee del save lo que el juego ya decidio.
         */
        agendaDe(npcID, opciones) {
            const o = opciones || {};
            const n = this._porNpcID && this._porNpcID[Number(npcID)];
            if (!n) return [];
            const puestos = this.puestosDe(npcID);
            const m = o.soloAhora ? this._minutos(o.clock) : null;
            const fuera = [];
            for (const a of (n.activities || [])) {
                // Las horas: las suyas, o las del puesto si lo usa.
                let franjas = a.timings || [];
                let dePuesto = false;
                if ((!franjas.length || !a.dontUsePostTimings) && a.post) {
                    const q = puestos[a.post - 1];
                    if (q && (q.timings || []).length && !a.dontUsePostTimings) {
                        franjas = q.timings;
                        dePuesto = true;
                    }
                }
                if (m != null && franjas.length) {
                    const dentro = franjas.some(([d, h]) => (d <= h) ? (m >= d && m < h)
                                                                    : (m >= d || m < h));
                    if (!dentro) continue;
                }
                fuera.push({
                    activityID: a.activityID,
                    clase: a.clase,
                    franjas: franjas,
                    horasDelPuesto: dePuesto,
                    post: a.post || 0,
                    lugares: this.lugaresDe(a),
                    condiciones: (a.conditions || []).length,
                    sorteo: a.hasSpawnRate ? a.spawnRate : null,
                    nonrollable: !!a.nonrollable,
                });
            }
            return fuera;
        },

        // ── SENTARSE: que mueble vale y en que orientacion ───────────────
        //
        // `FurnitureBoundActivityObject` dice en que muebles puede hacerse una actividad
        // y con que orientaciones del mueble. Son 355 actividades, y sus colas estan
        // extraidas con consumo de bytes exacto.
        //
        //   furnitureType      Chair 265, Misc 43, Bathtub 17, Bed 15, Table 8...
        //   specify            0 All (vale cualquiera del tipo)
        //                      1 Exclude (cualquiera MENOS los de la lista)
        //                      2 Only (solo los de la lista)
        //   furnitureIDs       la lista
        //   validOrientations  mascara de `Orientation`: RIGHT 1, UP 2, LEFT 4, DOWN 8
        //   characterFurniture cuanto cambia el orden de dibujado con cada mueble, o sea
        //                      si el vecino queda delante o detras
        //
        // La mascara mas usada es 3 = RIGHT+UP en 156 actividades: son las dos
        // orientaciones de FRENTE. Cuadra con como decide el port si dibuja la silla de
        // frente o de espaldas (`isBack = ori === 2 || ori === 3`), asi que las dos
        // mitades hablan de lo mismo.

        ORIENTACION: { RIGHT: 0, UP: 1, LEFT: 2, DOWN: 3 },

        /** La cola de mueble de esa actividad, o null si no es de las de mueble. */
        _mueble(npcID, activityID) {
            const d = this.definicion(npcID, activityID);
            return (d && d.mueble) || null;
        },

        /**
         * Puede hacerse esa actividad en un mueble con esa orientacion.
         *
         * Una mascara a 0 significa que a la actividad le da igual la orientacion: son
         * 62 de las 355, casi todas de tumbarse o de usar algo que no tiene frente. Se
         * devuelve true, que es lo que hace el juego al no tener nada que comprobar.
         *
         * Si no hay cola -la actividad no es de mueble, o el vecino no esta en el
         * catalogo- se devuelve true tambien: quien llama no deberia dejar de dibujar a
         * nadie por una falta de datos.
         */
        orientacionValida(npcID, activityID, orientation) {
            const mb = this._mueble(npcID, activityID);
            if (!mb) return true;
            const mask = mb.validOrientations | 0;
            if (!mask) return true;
            const o = Number(orientation) | 0;
            if (o < 0 || o > 3) return true;
            return (mask & (1 << o)) !== 0;
        },

        /** Vale ese mueble concreto para esa actividad (`specify` + `furnitureIDs`). */
        muebleValido(npcID, activityID, itemId) {
            const mb = this._mueble(npcID, activityID);
            if (!mb) return true;
            const id = Math.abs(Number(itemId) | 0);   // los negativos son la variante B
            const lista = (mb.furnitureIDs || []).map(x => Math.abs(x | 0));
            switch (mb.specify | 0) {
                case 2: return lista.includes(id);     // Only
                case 1: return !lista.includes(id);    // Exclude
                default: return true;                  // All
            }
        },

        /**
         * Cuanto se corre el orden de dibujado del vecino con ese mueble. Positivo =
         * delante del mueble. Sale de `CharacterFurnitureDetails`, que lo declara mueble
         * a mueble; si ese mueble no esta en la lista, cero.
         */
        desplazamientoDeOrden(npcID, activityID, itemId) {
            const mb = this._mueble(npcID, activityID);
            if (!mb) return 0;
            const id = Math.abs(Number(itemId) | 0);
            const cf = (mb.characterFurniture || [])
                .find(c => Math.abs(c.furnitureID | 0) === id);
            return cf ? (cf.sortingDifference | 0) : 0;
        },

        /** Las dos comprobaciones juntas, que es como se usa al colocar a alguien. */
        puedeSentarse(npcID, activityID, placement) {
            if (!placement) return false;
            return this.orientacionValida(npcID, activityID, placement.orientation)
                && this.muebleValido(npcID, activityID, placement.item_id);
        },

        // ── los PUESTOS FIJOS ────────────────────────────────────────────
        //
        // Un puesto (`FixedPost` en el binario, `BaseNPC.posts`) es donde un vecino
        // esta FIJO y a que horas. Lo trae `data/activities.json` desde que
        // `tools/extract_activities.py` lo saca: son 24 puestos de 23 personajes.
        //
        //     Rosemary  ShopkeeperPost  07:00-19:00  sublocacion 5
        //     Benny     NPCPost         05:00-20:30  lugar 800  (mapa 8)
        //
        // Una actividad con `post = N` hereda las horas del puesto N, salvo que traiga
        // `dontUsePostTimings`. 119 de las 1163 actividades usan puesto.
        //
        // El lugar sale de `fixedLocation.selection`, que es el id GLOBAL:
        // sublocacion * 100 + local. Comprobado en los 24: el `selection` y el
        // `shopLocation.sublocationID` de los ShopkeeperPost coinciden siempre.

        // DOS NUMERACIONES, Y NO SE PUEDEN ADIVINAR
        //
        // El catalogo se indexa por `npcID`. El resto del port usa `CharEnum`, que es
        // `npcID + 1` (Tsuki es el 0 y los vecinos empiezan en el 1). Y la clave de
        // `NPC_DB`, la de las animaciones, tambien es el CharEnum.
        //
        // Se intento aceptar los dos con una heuristica -"si el id casa con un npcID,
        // usalo; si no, resta uno"- y esta MAL: los npcID van del 0 al 93 sin huecos,
        // asi que cualquier CharEnum casa tambien con el npcID de OTRO. Preguntando por
        // Chi (CharEnum 2) salia la ficha del npcID 2, que es Momo: su puesto, sus
        // horarios y sus sitios.
        //
        // Asi que aqui todo va por `npcID`, y quien tenga un CharEnum lo convierte con
        // `npcIDdeChar`. Una ambigüedad silenciosa entre dos numeraciones contiguas no
        // se arregla adivinando.

        /** De CharEnum a npcID. Tsuki (0) no esta en el catalogo de vecinos. */
        npcIDdeChar(charId) {
            const c = Number(charId) | 0;
            return c > 0 ? c - 1 : -1;
        },

        /** Los puestos de ese vecino por `npcID`, en orden (`post = 1` es el primero). */
        puestosDe(npcID) {
            const n = this._porNpcID && this._porNpcID[Number(npcID)];
            return (n && n.posts) || [];
        },

        /** La sublocacion de un puesto, o null si no la fija (vecinos que deambulan). */
        lugarDePuesto(q) {
            if (!q) return null;
            if (q.clase === 'ShopkeeperPost' && q.shopLocation
                && q.shopLocation.sublocationID != null) return q.shopLocation.sublocationID;
            const sel = q.fixedLocation && q.fixedLocation.selection;
            if (!sel) return null;                       // 0 = sin lugar fijo
            return Math.floor(sel / 100);
        },

        /**
         * La sala donde está el jugador ahora.
         *
         * Lo pide `currLocation`, que en una condición significa «aquí» en vez de una
         * sala fija. Sale del save, que es donde el juego guarda dónde está Tsuki; si no
         * hay save, del selector de sala, que es lo que se mira en el editor.
         */
        salaActual() {
            const p = this.parser;
            if (p && typeof p.getLocation === 'function') {
                const l = p.getLocation();
                if (l != null) return Number(l);
            }
            try {
                const s = document.getElementById('select-location');
                if (s && s.value !== '') return Number(String(s.value).match(/^(\d+)/)[1]);
            } catch (e) { /* sin DOM */ }
            return null;
        },

        /** Minutos desde medianoche del reloj que se le pase, o del reloj del juego. */
        _minutos(clock) {
            const c = clock || (window.GameTime && window.GameTime.now
                ? window.GameTime.now()
                : (this.parser && this.parser.getClock ? this.parser.getClock() : null));
            if (!c) return null;
            return ((c.hour | 0) * 60) + (c.minute | 0);
        },

        /** Esta abierto ese puesto a esa hora. Sin horario, se entiende que siempre. */
        puestoAbierto(q, clock) {
            if (!q) return false;
            const t = q.timings || [];
            if (!t.length) return true;
            const m = this._minutos(clock);
            if (m == null) return true;
            return t.some(([d, h]) => (d <= h) ? (m >= d && m < h) : (m >= d || m < h));
        },

        /**
         * Quien esta de puesto en esa sublocacion a esa hora.
         *
         * Es lo que necesita una escena para saber a que vecino dibujar: al abrir la
         * tienda de Rosemary a las 10:00 sale Rosemary, y a las 20:00 no sale nadie
         * porque su puesto cierra a las 19:00.
         *
         * Devuelve `[{ npcID, character, nombre, post, clase, timings, abierto }]`, con
         * `abierto` a false para los que tienen puesto ahi pero fuera de hora: quien
         * llama decide si los pinta en gris o no los pinta.
         */
        enPuesto(sublocationID, clock) {
            const loc = Number(sublocationID);
            const fuera = [];
            for (const [npcID, posts] of Object.entries(this._puestos || {})) {
                const n = this._porNpcID[npcID];
                posts.forEach((q, i) => {
                    if (this.lugarDePuesto(q) !== loc) return;
                    fuera.push({
                        npcID: Number(npcID),
                        character: n ? n.character : Number(npcID) + 1,
                        nombre: n ? n.nombre : ('npc ' + npcID),
                        post: i + 1,
                        clase: q.clase,
                        timings: q.timings || [],
                        abierto: this.puestoAbierto(q, clock),
                    });
                });
            }
            fuera.sort((a, b) => (b.abierto - a.abierto) || a.nombre.localeCompare(b.nombre));
            return fuera;
        },

        /** Resumen legible, para el panel y para depurar. */
        resumen(charId) {
            const e = this.estado(charId);
            if (!e) return null;
            const d = e.valid ? this.definicion(e.npcID, e.activityID) : null;
            return {
                charId: e.charId,
                activo: e.valid,
                activityID: e.activityID,
                clase: d ? d.clase : null,
                puesto: d ? d.post : null,
                lugar: this.donde(charId),
                lugarNombre: (() => { const l = this.donde(charId);
                    return l != null ? this.nombreLugar(l) : null; })(),
                vagon: e.vagon,
                franjas: d ? d.timings : [],
                inicio: e.inicio,
            };
        },

        // ── lo que dice el catalogo ──────────────────────────────────────

        /**
         * Las actividades de ese vecino cuyas franjas horarias incluyen ese minuto.
         * No es lo que ESTA haciendo (para eso esta `haciendo`), es lo que PODRIA.
         * Una franja sin entradas vale a cualquier hora.
         */
        elegibles(charId, minutos) {
            const e = this.estado(charId);
            const npcID = e ? e.npcID : (Number(charId) - 1);
            const ficha = this._porNpcID && this._porNpcID[npcID];
            if (!ficha) return [];
            const m = Number(minutos);
            return ficha.activities.filter(a => {
                if (a.nonrollable) return false;
                if (!a.timings.length) return true;
                return a.timings.some(([d, h]) => (d <= h) ? (m >= d && m < h)
                                                           : (m >= d || m < h));
            });
        },

        // ── sortear actividad (BaseNPC.Simulate) ─────────────────────────

        /**
         * `ActivityData.ActivityValue`: la prioridad con la que entra cada actividad.
         * Cuanto MENOR, antes se prueba.
         *
         *     if (act.Important) return -1;                 // Important && sus condiciones
         *     if (act.specialActivity == LowPriority) return 9999;
         *     ... dos tiradas de Random.value deciden entre 0 y 1 ...
         *     FurnitureBound -> 0, el resto -> 1
         *
         * Los dos umbrales salen del .so leyendo esas direcciones a mano: Ghidra no
         * las descompila porque son datos, no codigo.
         */
        valorActividad(a) {
            if (!a) return 9999;
            if (a.specialActivity === 3 && this._todas(a.importantConditions)) return -1;
            if (a.specialActivity === 2) return 9999;       // LowPriority
            const r1 = Math.random(), r2 = Math.random();
            const U_A = 0.15, U_B = 0.4;                   // _UNK_012dfad8 y _UNK_012dfd44
            if (r1 <= U_A || !a.timeBasedActivity) {
                if (r2 <= U_B) return 1;
            } else {
                if (a.specialActivity === 0) return 0;
                if (r2 <= U_B) return a.specialActivity !== 0 ? 1 : 0;
            }
            return a.clase === 'FurnitureBoundActivityObject' ? 0 : 1;
        },

        /** ¿Pasan TODAS estas condiciones? Lo dudoso cuenta como que si. */
        _todas(conds, charId) {
            for (const c of (conds || [])) {
                if (this.cumple(c, { charId: charId }) === false) return false;
            }
            return true;
        },

        /** ¿Cae `minutos` dentro de alguna franja? Sin franjas, vale a cualquier hora. */
        _enFranja(timings, minutos) {
            if (!timings || !timings.length) return true;
            return timings.some(([d, h]) => (d <= h) ? (minutos >= d && minutos < h)
                                                     : (minutos >= d || minutos < h));
        },

        /** ¿Cae (dia, mes) dentro de algun rango? Sin rangos, cualquier dia. */
        _enFecha(dates, dia, mes) {
            if (!dates || !dates.length) return true;
            const hoy = mes * 100 + dia;
            return dates.some(([d1, m1, d2, m2]) => {
                const desde = m1 * 100 + d1, hasta = m2 * 100 + d2;
                return desde <= hasta ? (hoy >= desde && hoy <= hasta)
                                      : (hoy >= desde || hoy <= hasta);
            });
        },

        /**
         * `ActivityData.GetActivityOrder`: en que orden se prueban las actividades.
         *
         *     orden = permutacion aleatoria de los indices
         *     se descartan las nonrollable y las que fallan su spawnRate
         *     (el spawnRate solo se aplica si specialActivity es None u Override)
         *     se puntua cada una con ActivityValue y se ordena por esa puntuacion
         */
        orden(lista) {
            const idx = lista.map((_, i) => i);
            for (let i = idx.length - 1; i > 0; i--) {      // permutacion aleatoria
                const j = Math.floor(Math.random() * (i + 1));
                [idx[i], idx[j]] = [idx[j], idx[i]];
            }
            const valor = new Array(lista.length).fill(9999);
            const vivos = [];
            for (const i of idx) {
                const a = lista[i];
                if (!a || a.nonrollable) continue;
                const aplicaTasa = a.hasSpawnRate && (a.specialActivity & ~1) !== 2;
                if (aplicaTasa && Math.random() > a.spawnRate) continue;
                valor[i] = this.valorActividad(a);
                vivos.push(i);
            }
            vivos.sort((x, y) => valor[x] - valor[y]);
            return vivos.map(i => lista[i]);
        },

        /**
         * Que actividad le tocaria a este vecino ahora, copiando `BaseNPC.Simulate`:
         *
         *     ActivePost(out post);
         *     foreach (idx in GetActivityOrder(activities))
         *         if (act.post == post && act.Try(...)) { SetActivity(idx); return; }
         *
         * Lo que NO hace: colocar. `ActivityObject.Try` ademas busca sitio —celda libre
         * de la rejilla, mueble compatible—, y eso depende del estado del mapa. Aqui se
         * elige la actividad y se conserva el contenedor que ya tuviera.
         *
         * Tampoco es reproducible, y no puede serlo: el juego usa `UnityEngine.Random`,
         * que no se siembra desde el save. Cada simulacion sale distinta tambien en el
         * juego.
         */
        sortear(charId, reloj) {
            const e = this.estado(charId);
            const npcID = e ? e.npcID : (Number(charId) - 1);
            const ficha = this._porNpcID && this._porNpcID[npcID];
            if (!ficha) return null;

            // ActivePost: el puesto de la actividad que ya tiene.
            const actual = e && e.valid ? this.definicion(npcID, e.activityID) : null;
            const puesto = actual ? actual.post : 0;

            const m = reloj ? ((reloj.hour | 0) * 60 + (reloj.minute | 0)) : 0;
            let dia = 1, mes = 1;
            if (reloj && reloj.day) {
                if (reloj.day > 20000) {
                    const f = new Date((reloj.day - 25569) * 86400000);
                    dia = f.getUTCDate(); mes = f.getUTCMonth() + 1;
                } else { dia = reloj.day | 0; mes = reloj.month | 0; }
            }

            for (const a of this.orden(ficha.activities)) {
                if (a.post !== puesto) continue;
                if (!this._enFranja(a.timings, m)) continue;
                if (!this._enFecha(a.dates, dia, mes)) continue;
                if (!this._todas(a.conditions, charId)) continue;
                return a;
            }
            return null;
        },

        /**
         * Escribe en el save la actividad sorteada. Solo toca `ActivityID` y
         * `ActivityStart`: el contenedor se deja como estaba, porque recolocar al
         * vecino es otro asunto (ver `sortear`).
         */
        aplicar(charId, actividad, ahoraOA) {
            const e = this.estado(charId);
            if (!e || !e.nodo || !actividad) return false;
            const g = k => (e.nodo.children || []).find(c => c.name === k);
            const poner = (n, v) => {
                if (!n) return;
                n.value = (typeof n.value === 'bigint') ? BigInt(Math.trunc(v)) : v;
            };
            poner(g('ActivityID'), actividad.activityID | 0);
            poner(g('ActivityStart'),
                  ahoraOA != null ? Number(ahoraOA) : (Date.now() / 86400000) + 25569);
            poner(g('Valid'), true);
            poner(g('Seen'), false);
            return true;
        },

        // ── evaluar una condicion de dialogo ─────────────────────────────

        /**
         * Juzga una `Condition`. Devuelve true, false, o **null cuando no sabemos**.
         *
         * El null importa: si tratasemos lo desconocido como falso esconderiamos la
         * mayoria de los dialogos. Quien llama decide, y por defecto deja pasar.
         */
        cumple(c, contexto) {
            const p = this.parser;
            // `friendshipChar` a 0 significa "el personaje de esta conversacion", no
            // Tsuki. Sin esto quedaban 130 condiciones `Activity` sin juzgar.
            const deQuien = (c.fc ? c.fc : ((contexto && contexto.charId) || 0)) | 0;
            const check = c.c | 0;
            const val = c.v | 0;
            const reloj = (p && typeof p.getClock === 'function') ? p.getClock() : null;
            const no = t => { this.desconocidas[t] = (this.desconocidas[t] || 0) + 1; return null; };

            switch (c.t) {
                case T.Activity: {
                    const quien = deQuien;
                    if (!quien) return null;
                    const hace = this.haciendo(quien);
                    if (hace == null) return false;
                    return comparar(hace, check === 0 ? 1 : check, val);
                }
                case T.CharInLocation: {
                    const quien = deQuien;
                    const e = this.estado(quien);
                    // Sin ficha o sin actividad viva NO esta en ningun sitio: false.
                    // Pero si la tiene y no hemos sabido leer el lugar, es null: no lo
                    // sabemos, y no es lo mismo.
                    if (!e) return null;
                    if (!e.valid) return false;
                    const donde = this.donde(quien);
                    if (donde == null) return null;
                    if (c.cl) {
                        // "en la misma sala que el jugador"
                        const yo = (p && typeof p.getLocation === 'function') ? p.getLocation() : null;
                        if (yo == null) return null;
                        return Number(yo) === donde;
                    }
                    return donde === (c.sl | 0);
                }
                case T.IsAtPost: {
                    const quien = deQuien;
                    if (!quien) return null;
                    const post = this.puesto(quien);
                    if (post == null) return false;
                    return comparar(post, check === 0 ? 1 : check, val);
                }
                case T.IsManningShop: {
                    // «Está atendiendo su tienda»: tiene un puesto de tipo
                    // `ShopkeeperPost` y estamos dentro de su horario. `IsAtPost` mira
                    // el puesto de su actividad; esto mira el puesto en sí, que es lo
                    // que distingue a quien despacha de quien anda por allí.
                    const quien = deQuien;
                    if (!quien) return null;
                    const npcID = this.npcIDdeChar(quien);
                    if (npcID == null) return null;
                    const tiendas = this.puestosDe(npcID)
                        .filter(q => q && q.clase === 'ShopkeeperPost');
                    if (!tiendas.length) return !c.boolValue;
                    const atendiendo = tiendas.some(q => this.puestoAbierto(q));
                    // `boolValue` dice si la condición pide que SÍ o que NO.
                    return (c.boolValue === false) ? !atendiendo : atendiendo;
                }
                case T.FurnInLocation:
                case T.CustomFurnInLocation: {
                    // «Hay tal mueble puesto en tal sala». `value` es el objeto y
                    // `sLocation` la sala; con `currLocation` es la sala donde estamos.
                    // Los muebles colocados están en el save, así que esto se contesta
                    // con lo que hay, no con el catálogo.
                    if (!p || !p.placements) return null;
                    const sala = c.currLocation ? this.salaActual() : (c.sl | 0);
                    if (sala == null) return null;
                    const hay = p.placements.some(x =>
                        Number(x.cluster) === Number(sala)
                        && Math.abs(Number(x.item_id)) === Math.abs(val));
                    return (c.boolValue === false) ? !hay : hay;
                }
                case T.Carrots: {
                    if (!p || typeof p.getPlayerCarrots !== 'function') return null;
                    return comparar(Number(p.getPlayerCarrots()) || 0, check, val);
                }
                case T.ItemRequired:
                case T.FurnInInventory: {
                    if (!p) return null;
                    if (!p.inventory || !p.inventory.length) {
                        try { p.parseInventory(); } catch (e) { return null; }
                    }
                    // El inventario guarda {item_id, qty}. Un id negativo es la
                    // variante B del mismo objeto, asi que se compara en valor absoluto.
                    const inv = p.inventory || [];
                    const n = inv.filter(x => Math.abs(Number(x.item_id)) === Math.abs(val))
                                 .reduce((s, x) => s + (Number(x.qty) || 0), 0);
                    // Aqui `value` es el objeto y `secondValue` cuantos hacen falta.
                    return comparar(n, check, Math.max(1, c.v2 | 0));
                }
                case T.Friendship: {
                    const f = p && p.getNPCSave && p.getNPCSave(deQuien);
                    if (!f) return false;
                    return comparar(f.friendship | 0, check, val);
                }
                case T.Pester: {
                    const f = p && p.getNPCSave && p.getNPCSave(deQuien);
                    if (!f) return false;
                    return comparar(f.pester | 0, check, val);
                }
                case T.FriendCondition: {
                    const l = (p && p.getConditionSaves) ? p.getConditionSaves() : [];
                    const hay = l.some(x => x.charId === deQuien && x.conditionID === val);
                    // `npcConditionState` 0 Unfulfilled, 1 Fulfilled. Sin estado, se
                    // entiende que pide que este cumplida.
                    return (c.st === 0) ? !hay : hay;
                }
                case T.FriendConditionLevel: {
                    const l = (p && p.getConditionSaves) ? p.getConditionSaves() : [];
                    const e = l.find(x => x.charId === deQuien && x.conditionID === val);
                    return comparar(e ? (e.level | 0) : 0, check, c.v2 | 0);
                }
                case T.Season: {
                    if (!window.Weather || !reloj) return null;
                    const est = window.Weather.estacionDe(reloj);
                    if (!est) return null;
                    return comparar(est.SeasonID | 0, check === 0 ? 1 : check, val);
                }
                case T.Time: {
                    if (!reloj) return null;
                    return comparar((reloj.hour | 0) * 60 + (reloj.minute | 0), check, val);
                }
                case T.Tutorial: {
                    // `TsukiSave.tutorialStep`. Son 7 condiciones del catalogo, y ademas
                    // es lo que decide si se ven las 13 cajas de la Tienda de Yori
                    // (`TimedObject` con `Tutorial < 9`).
                    const p = window.app && window.app.parser;
                    if (!p || typeof p.getTutorialStep !== 'function') return null;
                    return comparar(p.getTutorialStep(), check, val);
                }
                case T.DayOfWeek: {
                    // `clock.day` del save es un dia OA, igual que en `T.Day`. El dia 0 de
                    // OA es el 30/12/1899, un sabado, asi que `(oa + 5) % 7` da 0=lunes.
                    // El enum `DayOfWeek` de .NET empieza en domingo=0, que es lo que
                    // compara el juego.
                    if (!reloj || !reloj.day) return null;
                    const f = new Date(((reloj.day | 0) - 25569) * 86400000);
                    return comparar(f.getUTCDay(), check, val);
                }
                case T.Day: {
                    // OJO: `clock.day` del save es un dia OA (45779), no el dia del
                    // mes. Hay que convertirlo o la comparacion no significa nada.
                    if (!reloj || !reloj.day) return null;
                    const dm = new Date(((reloj.day | 0) - 25569) * 86400000).getUTCDate();
                    return comparar(dm, check, val);
                }
                case T.MusicMuted:
                    return false;                 // el editor no reproduce musica
                case T.Newspaper: {
                    if (!p || typeof p.isNewspaperRead !== 'function') return null;
                    return !!p.isNewspaperRead(val);
                }
                case T.VillageEvent: {
                    if (!window.VillageEvents) return null;
                    const ev = window.VillageEvents.activo(reloj);
                    return !!ev && Number(ev.eventID) === val;
                }
                case T.LocationUnlocked:
                    return true;                  // en el editor estan todas abiertas
                case T.AdReady:
                    return false;                 // no hay anuncios

                case T.Complex: {
                    // `value` es el indice dentro de ProgressionTool.complexConditions.
                    // Un grupo pasa si pasan TODAS sus condiciones; la compuesta, si
                    // pasa algun grupo (Or) o al menos `value` (AtLeast).
                    // Se anidan —hay Complex dentro de los grupos—, de ahi la
                    // profundidad, que ademas corta ciclos si los hubiera.
                    const pt = this.progresion;
                    if (!pt || !pt.complexConditions) return null;
                    const cc = pt.complexConditions[val];
                    if (!cc) return null;
                    const prof = (contexto && contexto._prof) || 0;
                    if (prof > 4) return null;
                    const sub = Object.assign({}, contexto, { _prof: prof + 1 });

                    let pasan = 0, dudosos = 0;
                    for (const grupo of (cc.groups || [])) {
                        let todo = true, duda = false;
                        for (const g of grupo) {
                            const r = this.cumple(g, sub);
                            if (r === false) { todo = false; break; }
                            if (r === null) duda = true;
                        }
                        if (!todo) continue;
                        if (duda) dudosos++; else pasan++;
                    }
                    const hacenFalta = (cc.checkType === 'AtLeast')
                        ? Math.max(1, cc.value | 0) : 1;
                    if (pasan >= hacenFalta) return true;
                    // Si sumando los dudosos podria llegar, no nos mojamos.
                    return (pasan + dudosos >= hacenFalta) ? null : false;
                }

                case T.ItemCollected:
                case T.FurnCollected: {
                    if (!p || typeof p.getCollection !== 'function') return null;
                    // Un id negativo en la coleccion es la variante B del mismo mueble.
                    const col = p.getCollection() || [];
                    const tiene = col.some(x => Math.abs(Number(x)) === Math.abs(val));
                    return check === 2 ? !tiene : tiene;
                }

                case T.ParsnapAcquired: {
                    // Los posts de Parsnap son entradas del diario: ParsnapMenu es un
                    // menu de DiarySave. "Adquirida" = existe esa entrada.
                    if (!p || typeof p.getDiarySaves !== 'function') return null;
                    const hay = (p.getDiarySaves() || []).some(d => Number(d.num) === val);
                    return check === 2 ? !hay : hay;
                }

                case T.VillageEventTask: {
                    if (!window.VillageEvents) return null;
                    const ev = window.VillageEvents.activo(reloj);
                    if (!ev) return false;            // sin festival no hay tareas
                    if (!p || typeof p.getVillageEventState !== 'function') return null;
                    const st = p.getVillageEventState();
                    if (!st || !st.present) return false;
                    const es = (st.all || []).find(x => Number(x.eventID) === Number(ev.eventID));
                    if (!es) return false;
                    // `tasksCompleted` es la LISTA de tareas hechas, no un contador.
                    const hechas = es.tasksCompleted || [];
                    const tarea = Math.max(val, c.v2 | 0);
                    const hecha = hechas.some(t => Number(t) === tarea);
                    return check === 2 ? !hecha : hecha;
                }

                case T.Custom: {
                    // `CustomCondition.Check()` es codigo, no datos, asi que cada una
                    // hay que portarla a mano. `value` es el indice dentro de
                    // `ProgressionTool.customConditions`, y ese array NO va en el mismo
                    // orden que el registro de SerializeReference (ver el extractor).
                    const lista = (this.progresion && this.progresion.customConditions) || [];
                    const cual = lista[val];
                    if (!cual) return no(c.t);
                    switch (cual.clase) {
                        case 'JunkerBroken': {
                            // JunkerSave.Broken = brokenNodes.Any(x => x)
                            if (!p || typeof p.getJunkerSave !== 'function') return null;
                            const j = p.getJunkerSave();
                            if (!j) return false;
                            return (j.brokenNodes || []).some(Boolean);
                        }
                        default:
                            // SummerTaikoWindow depende de una TimeRange guardada en el
                            // propio objeto; DieOnWrymcraftPedestal y RegularLampOn
                            // recorren los muebles colocados. Ninguna se usa hoy en los
                            // dialogos, asi que no se portan a ciegas.
                            return no(c.t);
                    }
                }
                case T.Battery: {
                    // Nivel de batería del dispositivo (0..100%).
                    // En navegador/escritorio se asume 100% (batería llena).
                    const bat = 100;
                    return comparar(bat, check, val);
                }

                case T.NewspaperOfTheDay: {
                    if (!p) return null;
                    const news = (typeof p.getNewspapers === 'function') ? p.getNewspapers() : [];
                    if (!news || !news.length) return false;
                    let hoy = null;
                    if (reloj && reloj.day) {
                        hoy = news.find(n => n.day === reloj.day);
                    }
                    if (!hoy) {
                        const mostrados = news.filter(n => n.shown);
                        hoy = mostrados.length ? mostrados[mostrados.length - 1] : news[news.length - 1];
                    }
                    const artId = hoy ? (hoy.id | 0) : -1;
                    return comparar(artId, check, val);
                }

                default:
                    return no(c.t);
            }
        },

        /**
         * ¿Puede salir este nodo? Todas sus condiciones tienen que pasar; las que no
         * sabemos juzgar no bloquean. Tambien mira la franja horaria del nodo.
         */
        nodoValido(n, reloj, charId) {
            if (!n) return false;
            if (n.nr) return false;
            for (const c of (n.cond || [])) {
                if (this.cumple(c, { charId: charId }) === false) return false;
            }
            if (n.tm && n.tm.length && reloj) {
                const m = (reloj.hour | 0) * 60 + (reloj.minute | 0);
                const dentro = n.tm.some(([d, h]) => (d <= h) ? (m >= d && m < h)
                                                              : (m >= d || m < h));
                if (!dentro) return false;
            }
            return true;
        },
    };

    window.Activities = API;

    // El catalogo se carga una vez al arrancar. Si falla, `cumple` devuelve null en
    // todo lo que dependa de el y el gestor de dialogos sigue funcionando como antes.
    document.addEventListener('DOMContentLoaded', () => {
        API.load().catch(e => console.warn('[Activities] no se pudo cargar el catalogo:', e));
    });
})();
