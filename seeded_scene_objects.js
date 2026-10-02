// seeded_scene_objects.js — qué objetos sueltos aparecen hoy en cada mapa.
//
// El juego no guarda en el save qué montículos de nieve o qué huevos hay hoy: los
// RECALCULA cada día a partir de una semilla. Dos objetos distintos con el mismo sistema:
//
//   · `SeededSceneObject` → solo lo hereda `Snowmound` (los montículos de nieve).
//   · `Egg.AvailableToday` → los huevos, por otra vía pero con el mismo barajado.
//
// Los dos se apoyan en `CastleExtensions.ShuffleArray`, que vive en `seeded_random.js`.
//
// COMPROBADO CONTRA EL BINARIO (libil2cpp.so de 121.768.224 bytes)
// ----------------------------------------------------------------
// `SeededSceneObject.RollObject()` — RVA 0x5812E44:
//
//     dia = CastleTime.get_LegitDay()                                   // 0x30ECA30
//     si (!HasCollection(out col)) devolver false
//     arr = CastleExtensions.ShuffleArray(col.ids, seeded: true, dia)   // 0x3485030
//     n   = this.NumToRoll                                             // virtual, ranura 0x34
//     si (n < 1) devolver false
//     devolver arr[0 .. n-1] contiene this.ObjectID
//
//   · `SeededSceneObject.NumToRoll` base = 1          (0x5812C4C: `mov w0,#1; ret`)
//   · `Snowmound.NumToRoll`            = 3            (0x5833A0C: `mov w0,#3; ret`)
//   · `ObjectID` es el campo +0x60 del objeto de escena.
//   · `HasCollection` es `GameData.Instance.collections.TryGetValue(CollectionID, out col)`,
//     y `GameData.collections` es un `CastleDictionary<string, SeededCollection>` (+0x58).
//     `SeededCollection` solo tiene `public int[] ids` (+0x10).
//
// `Egg.AvailableToday(int _ID)` — RVA 0x595ACA8:
//
//     si (!SeededCollection.TryGet(<id de coleccion>, out col)) devolver TRUE
//     semilla = TsukiSave.Get.UniqueDailySeed                          // 0x58592D0
//     arr = CastleExtensions.ShuffleArray(col.ids, seeded: true, semilla)
//     devolver arr[0 .. 5] contiene _ID                                // tope de 6
//
//   Ojo a dos detalles que no se adivinan:
//     · Si la colección NO existe devuelve **true** (todo disponible), no false.
//     · La semilla NO es el día: `UniqueDailySeed = CastleTime.LegitDay + (int)GameStart.Ticks`
//       (0x58592D0), así que es única por partida. Dos jugadores el mismo día ven huevos
//       distintos.
//
// Se puede releer con:
//     python tools/desens.py SeededSceneObject::RollObject
//     python tools/desens.py Egg::AvailableToday
//     python tools/dis_addr.py 0x58592D0 40

(function (global) {
    'use strict';

    const SR = global.SeededRandom;

    /** Cuántos montículos de nieve salen al día. `Snowmound.get_NumToRoll` = 3. */
    const SNOWMOUND_NUM_TO_ROLL = 3;
    /** Cuántos huevos mira `Egg.AvailableToday`: el bucle corta en el índice 5. */
    const EGG_TOPE = 6;

    /** `CastleTime.LegitDay`: el día OA, que es lo que el save guarda en `clock.day`. */
    function legitDay(clock) {
        const d = clock && clock.day ? clock.day | 0 : 0;
        if (d > 20000) return d;                 // ya es un día OA
        const anio = (clock && clock.year) ? (clock.year | 0) : new Date().getFullYear();
        const mes = (clock && clock.month ? clock.month | 0 : 1) - 1;
        return Math.floor(Date.UTC(anio, mes, d || 1) / 86400000) + 25569;
    }

    /**
     * `TsukiSave.UniqueDailySeed` = `LegitDay + (int)GameStart.Ticks`.
     *
     * `Ticks` son 100 ns desde el año 1 y no cabe en 32 bits, pero el juego lo SUMA en
     * 32 bits (`add w0, w20, w0`), así que hay que truncar igual o la semilla no coincide.
     */
    function uniqueDailySeed(clock, gameStartTicks) {
        const bajos = Number(BigInt.asIntN(32, BigInt(gameStartTicks || 0)));
        return (legitDay(clock) + bajos) | 0;
    }

    /**
     * El núcleo: ¿está `objectID` entre los `numToRoll` primeros de `ids` barajado con
     * `semilla`? Es lo que hacen tanto `RollObject` como `AvailableToday`.
     */
    function saleHoy(ids, objectID, numToRoll, semilla) {
        if (!SR) throw new Error('falta seeded_random.js');
        if (!ids || !ids.length || numToRoll < 1) return false;
        const arr = SR.barajarConSemilla(ids, semilla);
        const tope = Math.min(numToRoll, arr.length);
        for (let i = 0; i < tope; i++) {
            if (arr[i] === objectID) return true;
        }
        return false;
    }

    const API = {
        SNOWMOUND_NUM_TO_ROLL,
        EGG_TOPE,
        legitDay,
        uniqueDailySeed,
        saleHoy,

        /** Las colecciones de `GameData.collections`: { "<id>": [int, ...] }. */
        colecciones: null,

        /** Carga `data/seeded_collections.json` si existe. Devuelve si había datos. */
        async cargar() {
            if (this.colecciones) return true;
            try {
                const r = await fetch('data/seeded_collections.json?v=' + Date.now());
                this.colecciones = r.ok ? await r.json() : null;
            } catch (e) {
                this.colecciones = null;
            }
            return !!this.colecciones;
        },

        /** Los montones de nieve por mapa: data/snow_mounds.json. */
        montones: null,

        async cargarMontones() {
            if (this.montones) return true;
            try {
                const r = await fetch('data/snow_mounds.json?v=' + Date.now());
                this.montones = r.ok ? await r.json() : null;
            } catch (e) {
                this.montones = null;
            }
            return !!this.montones;
        },

        /**
         * El monton de nieve que toca dibujar hoy en este mapa, o null.
         *
         * Solo en invierno (estacion 3) y solo si su `objectID` sale en el sorteo del dia:
         * de los 7 montones del juego salen 3 cada dia, asi que cuatro mapas de los siete
         * se quedan sin el.
         */
        montonDe(mapId, clock) {
            if (!this.montones || !this.colecciones) return null;
            if (!clock || (clock.season | 0) !== 2) return null;   // 2 = Invierno
            // Igual que en scene_objects.js: la clave puede ser la de una VARIANTE
            // del mapa (`0_hc` es la Casa del Arbol ampliada, otra escena distinta).
            const MD = global.MapDef;
            const clave = String((MD && MD.efectivo) ? MD.efectivo(mapId) : mapId);
            const m = this.montones[clave];
            if (!m) return null;
            return this.snowmoundSaleHoy('Snowmound', m.objectId, clock) ? m : null;
        },

        ids(collectionID) {
            const c = this.colecciones;
            return (c && Array.isArray(c[collectionID])) ? c[collectionID] : null;
        },

        /** `SeededSceneObject.RollObject` para un objeto cualquiera. */
        rollObject(collectionID, objectID, clock, numToRoll) {
            const ids = this.ids(collectionID);
            if (!ids) return false;                       // HasCollection falso -> false
            return saleHoy(ids, objectID, numToRoll == null ? 1 : numToRoll, legitDay(clock));
        },

        /** `Snowmound`: tres al día, sembrados con el día. */
        snowmoundSaleHoy(collectionID, objectID, clock) {
            return this.rollObject(collectionID, objectID, clock, SNOWMOUND_NUM_TO_ROLL);
        },

        /**
         * `Egg.AvailableToday`. Sin colección devuelve **true**, como el original.
         * `gameStartTicks` sale del save (`GameStart`).
         */
        huevoDisponibleHoy(collectionID, eggID, clock, gameStartTicks) {
            const ids = this.ids(collectionID);
            if (!ids) return true;                        // el original devuelve true aqui
            return saleHoy(ids, eggID, EGG_TOPE, uniqueDailySeed(clock, gameStartTicks));
        },
    };

    global.SeededSceneObjects = API;

    // Cargar los datos en cuanto se pueda: `map.js` los consulta en cada repintado y si no
    // estan simplemente no dibuja nada, asi que no hay prisa ni orden que respetar.
    if (typeof fetch === 'function') {
        const arrancar = () => Promise.all([API.cargar(), API.cargarMontones()])
            .then(() => {
                // Repintar: si los datos llegan despues del primer dibujado, el monton
                // no saldria hasta el siguiente.
                if (global.app && global.app.map) { try { global.app.map.draw(); } catch (e) { } }
            })
            .catch(() => { /* sin datos: el modulo se queda inerte */ });
        if (typeof document !== 'undefined' && document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', arrancar);
        } else {
            arrancar();
        }
    }
    if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : globalThis);
