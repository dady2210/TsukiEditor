// events_system.js — los festivales del pueblo.
//
// Los 12 eventos salen de `VillageEventData` del juego (tools/extract_events.py ->
// data/events.json), cada uno con su `eventID`, su nombre y su rango de fechas real:
//
//     0 Halloween          16/10 - 01/11      6 Importancia Marina   05/06 - 20/06
//     1 Navidad            13/12 - 29/12      7 Salvaje Oeste        12/09 - 30/09
//     2 Año Nuevo Lunar    11/01 - 25/01      8 La Gran Recolección  15/11 - 30/11
//     3 Mes del Huevo      01/05 - 21/05      9 Valentine's          07/02 - 21/02
//     4 Festival de Verano 10/08 - 28/08     10 Fate's Folly         05/03 - 19/03
//     5 Festival Bufonesco 01/04 - 16/04     11 Jungle Jamboree      05/07 - 25/07
//
// Comprobado contra el .csave: los 11 eventID que el juego tiene guardados existen
// todos aquí.
//
// Un festival enciende dos cosas que ya estaban extraídas y sin usar:
//   · `logic.subscenes` de los map_*.json (decoración del mapa)
//   · los `conditionalLayouts` de data/default_layouts.json, cuya condición es
//     `conditionType 36` = VillageEvent y cuyo `value` es justo el eventID.

(function () {
    'use strict';

    // Las claves que usan los map_*.json en `logic.subscenes`, y a qué evento van.
    const SUBESCENA_A_EVENTO = {
        halloween: 0,
        winter: 1,            // el invierno del ayuntamiento es la decoración de Navidad
        christmas: 1,
        lunar_new_year: 2,
        lny: 2,
        egg_month: 3,
        summerfest: 4,
        summer_festival: 4,
    };

    const API = {
        data: null,

        async load() {
            if (this.data) return this.data;
            try {
                const r = await fetch('/data/events.json');
                this.data = r.ok ? await r.json() : { events: [] };
            } catch (e) {
                this.data = { events: [] };
            }
            return this.data;
        },

        get eventos() { return (this.data && this.data.events) || []; },

        /** ¿Cae (día, mes) dentro del rango? Contempla los que cruzan el fin de año. */
        /**
         * El reloj del save guarda `day` COMO DIA OA (45779 = 2025-05-02), no como dia
         * del mes, y `month` en base 0. Comparando el OA contra un `mes*100+dia` no
         * coincidia NUNCA, asi que ningun festival se activaba.
         */
        _fecha(clock) {
            if (!clock) return null;
            const d = clock.day | 0;
            if (d > 20000) {
                const f = new Date((d - 25569) * 86400000);
                return { dia: f.getUTCDate(), mes: f.getUTCMonth() + 1 };
            }
            return { dia: d, mes: clock.month | 0 };
        },

        _dentro(ev, dia, mes) {
            const hoy = mes * 100 + dia;
            const desde = ev.from.month * 100 + ev.from.day;
            const hasta = ev.to.month * 100 + ev.to.day;
            return desde <= hasta ? (hoy >= desde && hoy <= hasta)
                                  : (hoy >= desde || hoy <= hasta);
        },

        /** El festival activo en esa fecha, o null. */
        activo(clock) {
            if (!clock) {
                clock = (window.GameTime && typeof window.GameTime.now === 'function')
                    ? window.GameTime.now()
                    : (window.app?.parser?.getClock ? window.app.parser.getClock() : null);
            }
            const f = this._fecha(clock);
            if (!f || !f.dia || !f.mes) return null;
            return this.eventos.find(e => this._dentro(e, f.dia, f.mes)) || null;
        },

        /** eventID activo, o -1. Es lo que consultan los layouts condicionales. */
        idActivo(clock) {
            const e = this.activo(clock);
            return e ? e.eventID : -1;
        },

        /**
         * ¿Está encendida esta subescena? Se traduce su clave a eventID y se compara
         * con el festival de hoy.
         */
        subescenaActiva(clave, clock) {
            const id = SUBESCENA_A_EVENTO[String(clave).toLowerCase()];
            if (id === undefined) return false;
            return this.idActivo(clock) === id;
        },

        /**
         * ¿Se cumple una condición de las que traen los layouts condicionales?
         * Solo se sabe evaluar `conditionType 36` (VillageEvent), que es la única que
         * usan los mapas del alcance. Cualquier otra se da por NO cumplida: es mejor
         * no enseñar una decoración que enseñarla cuando no toca.
         */
        cumple(cond, clock) {
            if (!cond) return false;
            if (cond.conditionType === 36) return this.idActivo(clock) === (cond.value | 0);
            return false;
        },

        nombre(clock) {
            const e = this.activo(clock);
            return e ? e.name_es : null;
        },

        // ── Y AHORA TAMBIÉN SE PUEDE HACER ALGO ──────────────────────────────
        //
        // Hasta aquí esto sólo miraba: decía qué festival está activo y decoraba el mapa,
        // pero no había forma de avanzar en él. El save sí lo guarda:
        //
        //     public class VillageEvent.VillageEventSave {
        //         public int eventID; public int year;
        //         public bool shownFlyer; public bool shownCalendar;
        //         public List<int> tasksCompleted;
        //         public EventCalendarDisplay.CalendarItem[] calendar;
        //         public bool[] rewardsClaimed;
        //     }
        //
        // y el parser ya sabía escribirlo (`setVillageEventTasksCompleted`,
        // `setVillageEventRewardsClaimed`). Lo que faltaba era usarlo.
        //
        // OJO CON EL AÑO: hay una entrada por evento Y AÑO, así que el mismo Halloween
        // tiene una fila por cada año jugado. Se trabaja sobre la del año en curso; si no
        // existe, no se inventa una — crearla es cosa del juego al empezar el festival.

        get parser() {
            return (window.app && window.app.parser) || window.currentSaveParser || null;
        },

        /** El año del juego, que es el del reloj. */
        anioDe(clock) {
            const c = clock || (window.GameTime && window.GameTime.now && window.GameTime.now());
            if (c && c.day) {
                // `clock.day` es un día OA: 25569 = 1970-01-01.
                return new Date((c.day - 25569) * 86400000).getUTCFullYear();
            }
            return new Date().getFullYear();
        },

        /** La fila del save de este evento en este año, o null. */
        guardado(eventID, clock) {
            const p = this.parser;
            if (!p || typeof p.getVillageEventState !== 'function') return null;
            const st = p.getVillageEventState();
            if (!st.present) return null;
            const anio = this.anioDe(clock);
            return st.all.find(e => e.eventID === (eventID | 0) && e.year === anio)
                || st.all.find(e => e.eventID === (eventID | 0))
                || null;
        },

        /** Qué tareas lleva hechas, y qué premios ha cobrado. */
        progreso(eventID, clock) {
            const g = this.guardado(eventID, clock);
            if (!g) return null;
            return {
                indice: g.index, eventID: g.eventID, anio: g.year,
                tareas: g.tasksCompleted.slice(),
                premios: g.rewardsClaimed.slice(),
                vistoFolleto: g.shownFlyer,
                vistoCalendario: g.shownCalendar,
            };
        },

        /**
         * Dar una tarea por hecha.
         *
         * `tasksCompleted` es una `List<int>` de ids de tarea. No se repite: el juego la
         * usa como conjunto, y meter dos veces la misma haría que un premio que cuenta
         * tareas contase de más.
         */
        completarTarea(eventID, taskID, clock) {
            const p = this.parser;
            const g = this.guardado(eventID, clock);
            if (!p || !g) return { ok: false, motivo: 'ese festival no está en la partida' };
            const t = g.tasksCompleted.slice();
            if (t.indexOf(taskID | 0) >= 0) {
                return { ok: false, motivo: 'esa tarea ya estaba hecha', tareas: t };
            }
            t.push(taskID | 0);
            const ok = p.setVillageEventTasksCompleted(g.index, t);
            return ok ? { ok: true, tareas: t } : { ok: false, motivo: 'no se pudo escribir' };
        },

        /** Deshacer una tarea. Hace falta para poder corregirse. */
        descompletarTarea(eventID, taskID, clock) {
            const p = this.parser;
            const g = this.guardado(eventID, clock);
            if (!p || !g) return { ok: false, motivo: 'ese festival no está en la partida' };
            const t = g.tasksCompleted.filter(x => x !== (taskID | 0));
            if (t.length === g.tasksCompleted.length) {
                return { ok: false, motivo: 'esa tarea no estaba hecha' };
            }
            const ok = p.setVillageEventTasksCompleted(g.index, t);
            return ok ? { ok: true, tareas: t } : { ok: false, motivo: 'no se pudo escribir' };
        },

        /**
         * Cobrar un premio. `rewardsClaimed` son cuatro booleanos, uno por tramo.
         */
        reclamarPremio(eventID, indice, clock) {
            const p = this.parser;
            const g = this.guardado(eventID, clock);
            if (!p || !g) return { ok: false, motivo: 'ese festival no está en la partida' };
            const i = indice | 0;
            if (i < 0 || i >= g.rewardsClaimed.length) {
                return { ok: false, motivo: 'ese premio no existe' };
            }
            if (g.rewardsClaimed[i]) return { ok: false, motivo: 'ese premio ya estaba cobrado' };
            const r = g.rewardsClaimed.slice();
            r[i] = true;
            const ok = p.setVillageEventRewardsClaimed(g.index, r);
            return ok ? { ok: true, premios: r } : { ok: false, motivo: 'no se pudo escribir' };
        },

        /** El folleto y el calendario: se marcan vistos y dejan de salir. */
        marcarVisto(eventID, cual, clock) {
            const p = this.parser;
            const g = this.guardado(eventID, clock);
            if (!p || !g || typeof p.setVillageEventField !== 'function') {
                return { ok: false, motivo: 'ese festival no está en la partida' };
            }
            const campo = (cual === 'calendario') ? 'shownCalendar' : 'shownFlyer';
            const ok = p.setVillageEventField(g.index, campo, true);
            return ok ? { ok: true, campo } : { ok: false, motivo: 'no se pudo escribir' };
        },
    };

    window.VillageEvents = API;

    document.addEventListener('DOMContentLoaded', () => {
        API.load().then(() => {
            // Los layouts condicionales se resolvieron con VillageEvents aún vacío;
            // al llegar los datos hay que rehacerlos o la decoración no aparecería
            // hasta el siguiente cambio de mapa.
            if (window.app && window.app.map) {
                window.app.map._layoutCache = null;
                window.app.map._renderCache = null;
                window.app.map.draw();
            }
        });
    });
})();
