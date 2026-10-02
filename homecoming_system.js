// homecoming_system.js — la ampliacion de la Casa del Arbol, con su obra.
//
// Las piezas ya estaban sueltas y nadie las ataba:
//
//   parser.setHomecoming(bool)      el interruptor de verdad, que es
//                                   `sublocations[0].currSLocData`, NO `homecomingUpdates`
//                                   (eso es cuantas tandas de contenido ha publicado el
//                                   juego: vale 6 en los saves de prueba)
//   parser.getTempTimerStatus(id)   los cronometros de "estara listo en tantas horas"
//   map.js._homecomingActivo()      decide si se dibuja el piso extra
//
// El cronometro es `Home2Construction`, de 1440 minutos (24 h). El piso se levanta al
// ENCARGAR la ampliacion, no al terminarla: durante esas 24 h se ve, tapado, y no se
// puede decorar. De ahi que haya tres estados y no dos —oculto, en obra, terminado—,
// que es lo que mira `map.js._estadoHomecoming()`.
//
// `startTime` es una fecha OLE Automation: dias desde 1899-12-30. Sumarle
// `minutesActive / 1440` da el final.

(function () {
    'use strict';

    const OBRA = 'Home2Construction';
    const MINUTOS_OBRA = 1440;          // 24 h, lo que trae el save

    const API = {
        get parser() { return window.app && window.app.parser; },

        ahoraOA() { return (Date.now() / 86400000) + 25569; },

        /**
         * Como esta la ampliacion ahora mismo.
         *
         *   activo    el piso extra esta puesto
         *   obra      el cronometro, o null si no hay ninguno en el save
         */
        estado() {
            const p = this.parser;
            if (!p) return null;
            const activo = (typeof p.isHomecomingActive === 'function')
                ? !!p.isHomecomingActive() : false;
            let obra = null;
            if (typeof p.getTempTimerStatus === 'function') {
                try { obra = p.getTempTimerStatus(OBRA); } catch (e) { obra = null; }
            }
            const enObra = activo && !!obra && !obra.done;
            return {
                activo,
                obra,
                enObra,
                // decorable solo cuando el piso esta puesto y la obra ha terminado
                decorable: activo && !enObra,
                lista: !!obra && obra.done && !activo,
            };
        },

        /** Todos los cronometros, no solo el de la casa. */
        temporizadores() {
            const p = this.parser;
            if (!p || typeof p.getAllTempTimerStatus !== 'function') return [];
            try { return p.getAllTempTimerStatus() || []; } catch (e) { return []; }
        },

        /**
         * Arranca la obra: el piso YA aparece y el cronometro empieza a correr.
         *
         * El piso se levanta al ENCARGAR la ampliacion, no al terminarla: durante las
         * 24 h se ve, tapado, y no se puede decorar. Por eso esto enciende
         * `currSLocData` ademas de poner el cronometro en marcha.
         *
         * Solo se puede si el save YA trae el nodo del cronometro. Crear uno de cero
         * obligaria a inventarse la forma, y no hace falta: el juego lo escribe en
         * cuanto se encarga la ampliacion.
         */
        empezarObra() {
            const p = this.parser;
            const e = this.estado();
            if (!p || !e) return { ok: false, motivo: 'sin partida cargada' };
            if (!e.obra) return { ok: false, motivo: 'este save no tiene el cronometro ' + OBRA };
            const t = (p.getTempTimers() || []).find(x => x.id === OBRA);
            if (!t) return { ok: false, motivo: 'no encuentro el cronómetro' };
            if (!this._ponerInicio(t, this.ahoraOA())) {
                return { ok: false, motivo: 'no se pudo escribir startTime' };
            }
            p.setTempTimerMinutes(OBRA, MINUTOS_OBRA);
            if (typeof p.setHomecoming === 'function') p.setHomecoming(true);
            this._redibujar();
            return { ok: true, estado: this.estado() };
        },

        /** Adelanta el cronometro para que ya haya terminado. */
        acelerarObra() {
            const p = this.parser;
            const e = this.estado();
            if (!p || !e || !e.obra) return { ok: false, motivo: 'este save no tiene cronómetro de obra' };
            const t = (p.getTempTimers() || []).find(x => x.id === OBRA);
            if (!t) return { ok: false, motivo: 'no encuentro el cronómetro' };
            // Se retrasa el inicio lo que dure la obra, y asi el final cae en el pasado.
            const dura = (Number(t.minutesActive) || MINUTOS_OBRA) / 1440;
            if (!this._ponerInicio(t, this.ahoraOA() - dura - 0.001)) {
                return { ok: false, motivo: 'no se pudo escribir startTime' };
            }
            return { ok: true, estado: this.estado() };
        },

        /**
         * Levanta el piso. Si la obra no habia terminado, se adelanta primero: es lo
         * que hace el juego cuando pagas por acabarla antes.
         */
        completar() {
            const p = this.parser;
            const e = this.estado();
            if (!p || !e) return { ok: false, motivo: 'sin partida cargada' };
            if (e.decorable) return { ok: false, motivo: 'ya estaba terminada' };
            if (typeof p.setHomecoming !== 'function') {
                return { ok: false, motivo: 'el parser no sabe encender el piso' };
            }
            p.setHomecoming(true);
            if (e.obra && !e.obra.done) this.acelerarObra();
            this._redibujar();
            return { ok: true, estado: this.estado() };
        },

        /** Quita el piso extra. Los muebles que hubiera arriba no se tocan. */
        quitar() {
            const p = this.parser;
            if (!p || typeof p.setHomecoming !== 'function') {
                return { ok: false, motivo: 'sin partida cargada' };
            }
            p.setHomecoming(false);
            this._redibujar();
            return { ok: true, estado: this.estado() };
        },

        _ponerInicio(t, oa) {
            const n = t.astNode && (t.astNode.children || [])
                .find(c => c.name === 'startTime' || c.name === 'StartTime');
            if (!n) return false;
            n.value = (typeof n.value === 'bigint') ? BigInt(Math.trunc(oa)) : Number(oa);
            return true;
        },

        _redibujar() {
            const m = window.app && window.app.map;
            if (!m) return;
            m._layoutCache = null;
            m._renderCache = null;
            try { m.draw(); } catch (e) { /* el mapa puede no estar listo */ }
        },

        // ── panel ────────────────────────────────────────────────────────

        abrirPanel() {
            // `SFXClip.HomecomingOpen`.
            if (window.PlaySfx) window.PlaySfx.sonar('homecomingOpen');
            const e = this.estado();
            let m = document.getElementById('hc-modal');
            if (m) m.remove();
            m = document.createElement('div');
            m.id = 'hc-modal';
            m.style.cssText = 'position:fixed;inset:0;z-index:9000;display:flex;align-items:center;'
                + 'justify-content:center;background:rgba(0,0,0,.45)';

            const hhmm = min => {
                const h = Math.floor(min / 60), mm = min % 60;
                return h ? (h + ' h ' + mm + ' min') : (mm + ' min');
            };
            let cuerpo;
            if (!e) {
                cuerpo = '<p>No hay partida cargada.</p>';
            } else if (e.enObra) {
                // Ojo al orden: en obra el piso YA esta puesto, asi que esto tiene que
                // mirarse antes que `activo` o nunca se llegaria aqui.
                cuerpo = '<p>El piso ya está levantado pero <b>sigue en obra</b>: se ve tapado y '
                    + 'no se puede decorar. Faltan <b>' + hhmm(e.obra.minutesLeft) + '</b>.</p>'
                    + '<button id="hc-acelerar" class="btn-text" style="width:100%;margin-bottom:6px">Terminar la obra ya</button>'
                    + '<button id="hc-quitar" class="btn-text" style="width:100%">Cancelar la ampliación</button>';
            } else if (e.activo) {
                cuerpo = '<p>La ampliación <b>está terminada</b>: el piso extra se puede decorar.</p>'
                    + '<button id="hc-quitar" class="btn-text" style="width:100%">Quitar la ampliación</button>';
            } else if (e.lista) {
                cuerpo = '<p>La obra <b>ya terminó</b>, falta levantar el piso.</p>'
                    + '<button id="hc-completar" class="btn-text" style="width:100%">Levantar el piso</button>';
            } else if (e.obra) {
                cuerpo = '<p>Sin ampliación. Al encargarla, el piso aparece enseguida pero tapado '
                    + 'durante 24 h.</p>'
                    + '<button id="hc-empezar" class="btn-text" style="width:100%;margin-bottom:6px">Encargar la ampliación (24 h de obra)</button>'
                    + '<button id="hc-completar" class="btn-text" style="width:100%">Levantarla ya terminada</button>';
            } else {
                cuerpo = '<p>Este save no trae el cronómetro <code>' + OBRA + '</code>, así que no se '
                    + 'puede simular la obra. Se puede levantar el piso igualmente.</p>'
                    + '<button id="hc-completar" class="btn-text" style="width:100%">Levantar el piso</button>';
            }

            const otros = this.temporizadores().filter(t => t.id !== OBRA);
            const listaOtros = otros.length
                ? '<h4 style="margin:14px 0 4px">Otros cronómetros</h4>'
                  + otros.map(t => '<div style="display:flex;justify-content:space-between;padding:3px 0">'
                      + '<span>' + t.id + '</span><span style="color:#6b5b45">'
                      + (t.done ? 'terminado' : hhmm(t.minutesLeft)) + '</span></div>').join('')
                : '';

            m.innerHTML = '<div style="background:#fdf6e3;border:3px solid #8b6b4a;border-radius:14px;'
                + 'padding:20px 24px;max-width:460px;width:92%;box-shadow:0 8px 24px rgba(0,0,0,.35)">'
                + '<h3 style="margin:0 0 10px">🏠 Ampliación de la Casa del Árbol</h3>'
                + cuerpo + listaOtros
                + '<button id="hc-close" class="btn-text" style="width:100%;margin-top:14px">Cerrar</button>'
                + '</div>';
            document.body.appendChild(m);
            m.addEventListener('click', ev => { if (ev.target === m) m.remove(); });

            const rehacer = r => {
                if (!r.ok && window.app && window.app.showToast) window.app.showToast(r.motivo, 'warning');
                m.remove(); this.abrirPanel();
            };
            const liga = (id, fn) => {
                const b = document.getElementById(id);
                if (b) b.onclick = () => rehacer(fn.call(this));
            };
            liga('hc-empezar', this.empezarObra);
            liga('hc-acelerar', this.acelerarObra);
            liga('hc-completar', this.completar);
            liga('hc-quitar', this.quitar);
            const c = document.getElementById('hc-close');
            if (c) c.onclick = () => m.remove();
        },
    };

    window.Homecoming = API;
})();
