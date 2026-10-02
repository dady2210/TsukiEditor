// day_cycle.js — el cambio de día: lo que hay que rehacer cuando pasa uno.
//
// EN EL JUEGO NO SE DUERME
// ------------------------
// Tsuki Odyssey va con el reloj de verdad: el día no lo avanza una cama, lo avanza el
// tiempo. El único `Sleep()` del binario es `SleepTutorial.Sleep()`, y solo sirve para el
// tutorial. Por eso el port sincroniza con el dispositivo (`GameTime.syncFromDevice`).
//
// Lo que faltaba no era un botón de dormir, era que al cambiar el día se rehiciera el
// trabajo diario. `GameTime.onDayChanged` solo repintaba y aplicaba la luz.
//
// QUÉ SE REHACE
// -------------
//   · los objetos de escena recogidos vuelven a estar        (`SceneObjects`)
//   · los encargos del día                                   (`BountySystem`)
//   · el periódico del día                                   (`NewspaperSystem`)
//   · el clima                                               (`Weather`)
//   · la semana de la punchcard, si ha cambiado              (`Progress`)
//   · la caché del escenario, por si el mapa cambia de estación o de festival
//
// Casi todo eso ya era determinista a partir del día OA, así que aquí no se inventa nada:
// se vuelve a preguntar.
//
// EL DÍA DEL SAVE ES UN DÍA OA
// ----------------------------
// `clock.day` no es el día del mes: es un día OA (45779 = 2025-05-02), y por eso
// `activity_scheduler` lo convierte con `new Date((day - 25569) * 86400000)`. El
// `parser.advanceHour` que ya había hace `day -= 30; month += 1`, que vale para un día
// del mes y NO para un OA. Aquí se avanza el OA y el mes y la estación se derivan de él.
//
//   DayCycle.avanzar(1)     un día más
//   DayCycle.refrescar()    rehace el trabajo del día sin tocar el reloj

(function (global) {
    'use strict';

    // Día OA 25569 = 1970-01-01. Es la constante que ya usa el resto del port.
    const OA_EPOCH = 25569;

    function aFecha(oa) { return new Date((oa - OA_EPOCH) * 86400000); }

    /** SeasonID del juego: 0 verano, 1 otoño, 2 invierno, 3 primavera. */
    function estacionDeMes(m) {
        if (m >= 6 && m <= 8) return 0;
        if (m >= 9 && m <= 11) return 1;
        if (m === 12 || m <= 2) return 2;
        return 3;
    }

    const API = {
        get parser() { return global.app && global.app.parser; },

        /** El día OA del save, o null. */
        dia() {
            const p = this.parser;
            if (!p || typeof p.getClock !== 'function') return null;
            const d = p.getClock().day | 0;
            return d > 20000 ? d : null;
        },

        /**
         * Adelanta N días. Devuelve el reloj nuevo, o null si el save no lleva día OA.
         *
         * El mes y la estación se derivan de la fecha, no se suman a mano: un mes no
         * tiene 30 días y la estación no cambia cada 12 meses.
         */
        avanzar(dias = 1) {
            const p = this.parser;
            const oa = this.dia();
            if (!p || oa === null) return null;
            const nuevo = oa + (dias | 0);
            const f = aFecha(nuevo);
            const mes = f.getUTCMonth() + 1;
            p.setClock({ day: nuevo, month: mes, season: estacionDeMes(mes) });
            const c = p.getClock();
            this.refrescar(c);
            return c;
        },

        /**
         * Rehace el trabajo del día. Cada sistema se pide por separado y con su propio
         * try: si uno no está cargado, los demás siguen.
         */
        refrescar(clock) {
            const p = this.parser;
            const c = clock || (p && typeof p.getClock === 'function' ? p.getClock() : null);
            const hecho = [];
            const fallos = [];
            const paso = (nombre, fn) => {
                try { if (fn() !== false) hecho.push(nombre); } catch (e) { fallos.push(nombre + ': ' + e.message); }
            };

            // Lo recogido hoy vuelve a estar mañana.
            paso('objetos de escena', () => {
                const SO = global.SceneObjects;
                if (!SO || typeof SO._purgarSiCambioElDia !== 'function') return false;
                SO._purgarSiCambioElDia(c);
            });

            // Encargos del día: se generan a partir del día OA, así que basta releerlos.
            paso('encargos', () => {
                const B = global.BountySystem;
                if (!B || typeof B.loadTodayBounties !== 'function') return false;
                B.loadTodayBounties();
            });

            // El periódico del día.
            paso('periódico', () => {
                const N = global.NewspaperSystem;
                if (!N || typeof N.getCurrentOaDay !== 'function') return false;
                N.getCurrentOaDay(p);
            });

            // El clima se sortea con el día como semilla.
            paso('clima', () => {
                const W = global.Weather;
                if (!W || typeof W.delDia !== 'function') return false;
                W.delDia(c);
                if (typeof W.ahora === 'function') W.ahora(c);
            });

            // La punchcard va por semanas: solo cambia cuando cambia la semana.
            paso('punchcard', () => {
                const P = global.Progress;
                if (!P || typeof P.punchcard !== 'function') return false;
                P.punchcard();
            });

            // El escenario puede cambiar de estación o de festival.
            paso('escenario', () => {
                const S = global.PlayScenery;
                if (!S) return false;
                if (typeof S.invalidar === 'function') S.invalidar();
                const m = global.app && global.app.map;
                if (m && typeof m.draw === 'function') m.draw();
            });

            return { dia: c ? c.day : null, hecho: hecho, fallos: fallos };
        },

        /**
         * Se engancha al cambio de día del reloj. Lo llama `app.js` al arrancar.
         */
        enganchar() {
            if (this._enganchado) return;
            if (!global.GameTime || typeof global.GameTime.onDayChanged !== 'function') return;
            global.GameTime.onDayChanged((c) => {
                const r = this.refrescar(c);
                if (r && r.fallos.length) console.warn('[DayCycle]', r.fallos.join(' | '));
            });
            this._enganchado = true;
        },
    };

    global.DayCycle = API;
})(window);
