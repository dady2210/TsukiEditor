// travel_system.js — moverse por el mundo, aldea y ciudad.
//
// El problema no era que faltaran datos, era que no habia forma de LLEGAR. El selector
// de mapas se llenaba con `parser.clusters`, o sea las sublocaciones que tienen muebles
// en el save, y la ciudad entera esta vacia en los cuatro saves de prueba: sus 21 mapas
// existian, con su arte y su ancla, pero no aparecian en ninguna lista.
//
// Piezas del save que usa esto:
//
//   location            la ZONA, no la sala: enum `Location` {MV 0, Train 1, GC 2}.
//                       Vale 0 en los cuatro saves de prueba, incluido el hecho estando
//                       en la ciudad. La sala concreta NO se persiste: al cargar, el
//                       juego te pone en tu casa.
//   locationsOnPhone    los destinos del telefono: {location, seen}. `seen` es lo que
//                       decide si sale en la lista de viaje.
//   trainSave           {carriages[3], trainDay, trainNumber, npcsOnTrain[5]}
//   trip                solo existe si hay o hubo viaje:
//                       {start, end, trainDay, trainNumber, tripStarted, tripEnded}
//
// Viajar mueve la vista y escribe la ZONA. Antes escribia el id de la sala en
// `location`, que es un enum de tres valores: metia ahi numeros de hasta 34.

(function () {
    'use strict';

    // `Location` del juego: la zona gruesa, no la sala.
    const ZONA = { ALDEA: 0, TREN: 1, CIUDAD: 2 };
    const NOMBRE_ZONA = { 0: 'la aldea', 1: 'el tren', 2: 'la Gran Ciudad' };

    // Los que se llegan en tren, no andando. Es lo que separa la aldea de la ciudad.
    const POR_TREN = new Set([14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27,
                              28, 29, 30, 31, 32, 33, 34]);

    const API = {
        get parser() { return window.app && window.app.parser; },

        nombre(id) {
            const n = (typeof window.SUBLOC_NAMES !== 'undefined') ? window.SUBLOC_NAMES[id] : null;
            return n || ('Ubicación ' + id);
        },

        /**
         * En que ZONA esta Tsuki segun el save: aldea, tren o ciudad.
         *
         * OJO: el nodo `location` NO guarda la sala. Es el enum `Location` del juego,
         * de tres valores. La sala en la que estas no se persiste: al cargar, el juego
         * te pone en tu casa. Por eso viajar mueve la vista pero solo escribe la zona.
         */
        zona() {
            const p = this.parser;
            if (!p || typeof p.getLocation !== 'function') return null;
            const v = p.getLocation();
            return v == null ? null : Number(v);
        },

        nombreZona(z) { return NOMBRE_ZONA[z] != null ? NOMBRE_ZONA[z] : ('zona ' + z); },

        /** La sala que se esta viendo, que es cosa del visor y no del save. */
        donde() {
            const sel = document.getElementById('select-location');
            if (!sel || sel.value === '') return null;
            const n = parseInt(sel.value, 10);
            return isNaN(n) ? null : n;
        },

        /**
         * Todos los sitios a los que se puede ir, con su estado.
         *
         *   visitable   hay mapa con arte y ancla, o sea se puede dibujar
         *   desbloqueado  el telefono lo tiene marcado como visto
         *   porTren     hace falta el tren para llegar
         */
        destinos() {
            const p = this.parser;
            const vistos = new Set();
            if (p && typeof p.getLocationsOnPhone === 'function') {
                try {
                    for (const l of (p.getLocationsOnPhone() || [])) {
                        if (l && l.seen) vistos.add(Number(l.id));
                    }
                } catch (e) { /* save sin telefono */ }
            }
            const lista = (typeof window.MAPAS_VISITABLES !== 'undefined')
                ? window.MAPAS_VISITABLES : [];
            const aqui = this.donde();
            return lista.map(id => ({
                id,
                nombre: this.nombre(id),
                desbloqueado: vistos.has(id),
                porTren: POR_TREN.has(id),
                aqui: aqui === id,
            }));
        },

        // ── el grafo de la Gran Ciudad ───────────────────────────────────
        //
        // Los 33 botones de viaje del juego estan TODOS en los niveles de ciudad: cada
        // sala tiene puertas a las contiguas y se va andando. La aldea no tiene ninguno
        // -se abre hablando, con un `CustomEvent.UnlockLocation`-, asi que ahi no hay
        // salidas que listar.
        //
        // Un `TravelAndUnlock` ademas DEJA VISTO el destino en el telefono
        // (`locationsOnPhone.seen`), y dos de ellos abren otra sala de paso: los de
        // `MallEntrance` abren tambien el Centro Comercial.
        //
        // Sale de `data/travel_graph.json` (tools/cs_timed_objects -- viajes).
        grafo: null,

        async cargarGrafo() {
            if (this.grafo) return this.grafo;
            try {
                const r = await fetch('data/travel_graph.json');
                this.grafo = r.ok ? await r.json() : { botones: [] };
            } catch (e) {
                this.grafo = { botones: [] };
            }
            return this.grafo;
        },

        /** Los botones que salen de este mapa. */
        salidas(mapId) {
            const g = this.grafo;
            if (!g) return [];
            const k = String(mapId != null ? mapId : this.donde());
            const vistos = new Set();
            const out = [];
            for (const b of (g.botones || [])) {
                if (String(b.mapa) !== k) continue;
                if (vistos.has(b.destino)) continue;   // hay puertas repetidas
                vistos.add(b.destino);
                out.push({
                    destino: b.destino,
                    nombre: b.destinoNombre || this.nombre(b.destino),
                    dejaVista: !!b.dejaVista,
                    desbloquea: b.desbloquea || [],
                });
            }
            return out;
        },

        /**
         * Lo que se abre en el telefono al llegar a un sitio andando.
         * Devuelve los ids que se han marcado, o [] si no habia nada que marcar.
         */
        aplicarDesbloqueo(desde, hasta) {
            const p = this.parser;
            if (!p || typeof p.setLocationUnlocked !== 'function') return [];
            const puerta = this.salidas(desde).find(s => s.destino === Number(hasta));
            if (!puerta || !puerta.dejaVista) return [];
            const abiertos = [];
            for (const id of [Number(hasta)].concat(puerta.desbloquea)) {
                try { if (p.setLocationUnlocked(id, true)) abiertos.push(id); } catch (e) { /* sin telefono */ }
            }
            return abiertos;
        },

        /**
         * Lleva a Tsuki a otro sitio: lo escribe en el save y mueve la vista.
         *
         * No exige que este desbloqueado —es un editor, no el juego— pero lo avisa.
         */
        viajar(id) {
            const p = this.parser;
            const n = Number(id);
            if (!p) return { ok: false, motivo: 'sin partida cargada' };
            // En `location` va la ZONA, no la sala: escribir ahi un id de sublocacion
            // (hasta 34) metia un valor imposible en un enum de tres.
            if (typeof p.setLocation === 'function') {
                p.setLocation(POR_TREN.has(n) ? ZONA.CIUDAD : ZONA.ALDEA);
            }
            const desde = this.donde();
            p.currentSLocation = n;

            // Llegar andando por una puerta de la ciudad deja el sitio visto en el
            // telefono, que es lo que hace `TravelAndUnlock` en el juego.
            const abiertos = this.aplicarDesbloqueo(desde, n);

            // Mover la vista: el selector es quien manda en el resto de la interfaz,
            // asi que se cambia ahi y se dispara su evento en vez de redibujar a mano.
            const sel = document.getElementById('select-location');
            if (sel) {
                const existe = Array.from(sel.options).some(o => String(o.value) === String(n));
                if (existe) {
                    sel.value = String(n);
                    sel.dispatchEvent(new Event('change'));
                } else {
                    return { ok: true, aviso: 'viajado, pero ese mapa no está en el selector', abiertos };
                }
            }
            return { ok: true, id: n, nombre: this.nombre(n), abiertos };
        },

        /** Marca un destino como conocido en el teléfono. */
        desbloquear(id) {
            const p = this.parser;
            if (!p || typeof p.setLocationUnlocked !== 'function') {
                return { ok: false, motivo: 'sin partida cargada' };
            }
            const r = p.setLocationUnlocked(Number(id), true);
            return r ? { ok: true } : { ok: false, motivo: 'no hay plantilla de ubicación en el save' };
        },

        /** El servicio de tren: dia y numero. */
        tren() {
            const p = this.parser;
            if (!p) return null;
            if (!p.trainSave && typeof p.parseTrainSave === 'function') {
                try { p.parseTrainSave(); } catch (e) { return null; }
            }
            return p.trainSave || null;
        },

        // ── panel ────────────────────────────────────────────────────────

        abrirPanel() {
            const destinos = this.destinos();
            const aqui = this.donde();
            let m = document.getElementById('viaje-modal');
            if (m) m.remove();
            m = document.createElement('div');
            m.id = 'viaje-modal';
            m.style.cssText = 'position:fixed;inset:0;z-index:9000;display:flex;align-items:center;'
                + 'justify-content:center;background:rgba(0,0,0,.45)';

            const fila = d => '<div style="display:flex;align-items:center;gap:8px;padding:4px 0;'
                + 'border-bottom:1px solid #eee2c8">'
                + '<span style="flex:1' + (d.aqui ? ';font-weight:700' : '') + '">'
                + d.nombre + (d.aqui ? ' · aquí' : '') + '</span>'
                + (d.desbloqueado ? '' : '<button data-desbloquear="' + d.id + '" class="btn-text" '
                    + 'style="font-size:.75rem;padding:1px 6px">desbloquear</button>')
                + '<button data-ir="' + d.id + '" class="btn-text" '
                + 'style="font-size:.75rem;padding:1px 8px"' + (d.aqui ? ' disabled' : '') + '>ir</button>'
                + '</div>';

            const aldea = destinos.filter(d => !d.porTren);
            const ciudad = destinos.filter(d => d.porTren);
            const t = this.tren();
            const infoTren = t
                ? '<div style="font-size:.8em;color:#6b5b45;margin:6px 0">Tren: servicio nº '
                  + (t.trainNumber || 0) + ', día ' + (t.trainDay || 0) + '</div>'
                : '';

            m.innerHTML = '<div style="background:#fdf6e3;border:3px solid #8b6b4a;border-radius:14px;'
                + 'padding:20px 24px;max-width:520px;width:92%;max-height:80vh;overflow:auto;'
                + 'box-shadow:0 8px 24px rgba(0,0,0,.35)">'
                + '<h3 style="margin:0 0 4px">🧭 Viajar</h3>'
                + '<div style="font-size:.82em;color:#6b5b45;margin-bottom:10px">'
                + 'Viendo: <b>' + (aqui != null ? this.nombre(aqui) : '?') + '</b>'
                + ' · en la partida: <b>' + this.nombreZona(this.zona()) + '</b>.'
                + '<br>El save guarda la zona (aldea / tren / ciudad), no la sala.</div>'
                + '<h4 style="margin:8px 0 4px">Aldea (' + aldea.length + ')</h4>'
                + aldea.map(fila).join('')
                + '<h4 style="margin:14px 0 4px">Ciudad, en tren (' + ciudad.length + ')</h4>'
                + infoTren
                + ciudad.map(fila).join('')
                + '<button id="viaje-close" class="btn-text" style="width:100%;margin-top:14px">Cerrar</button>'
                + '</div>';
            document.body.appendChild(m);
            if (window.PlaySfx) window.PlaySfx.sonar('phoneAppOpen');
            m.addEventListener('click', ev => { if (ev.target === m) m.remove(); });

            m.querySelectorAll('[data-ir]').forEach(b => {
                b.onclick = () => {
                    const r = this.viajar(b.getAttribute('data-ir'));
                    // `SFXClip.PhoneAppTravel`: el juego viaja desde la app del telefono,
                    // asi que el sonido del viaje es el de esa app, no uno de mapa.
                    if (r.ok && window.PlaySfx) window.PlaySfx.sonar('phoneAppTravel');
                    if (window.app && window.app.showToast) {
                        window.app.showToast(r.ok ? ('🧭 ' + (r.nombre || '') + (r.aviso ? ' — ' + r.aviso : ''))
                                                  : r.motivo, r.ok ? 'success' : 'warning');
                    }
                    m.remove();
                };
            });
            m.querySelectorAll('[data-desbloquear]').forEach(b => {
                b.onclick = () => {
                    const r = this.desbloquear(b.getAttribute('data-desbloquear'));
                    if (!r.ok && window.app && window.app.showToast) window.app.showToast(r.motivo, 'warning');
                    m.remove(); this.abrirPanel();
                };
            });
            const c = document.getElementById('viaje-close');
            if (c) c.onclick = () => m.remove();
        },
    };

    window.Travel = API;
})();
