// npc_system.js — hablar con los vecinos, y que sirva de algo.
//
// El motor de diálogo (dialogue_manager.js) y el clic sobre los personajes ya
// existían: se tocaba a alguien y salía su conversación. Lo que no pasaba nada es
// DESPUÉS. Esto cierra el bucle.
//
// Cómo guarda el juego la relación, comprobado sobre `Millionaire .csave`:
//
//   npcSaves       35 entradas, los vecinos del pueblo. Aquí SÍ hay relación:
//                  `friendship` va de 0 a 50 (18 de los 35 están al máximo),
//                  `lastFriendshipDay` es el día OA del último punto ganado y
//                  `lastTalkOA` la fecha exacta de la última charla.
//   liminalSaves   64 entradas, los de la ciudad. Su `friendship` está a 0 en TODOS;
//                  su progreso se lleva aparte, en `conditionSaves`.
//   conditionSaves 26 entradas {character, conditionID, dateFulfilled, level}.
//
// Aqui ya no queda nada inventado. Todo esto sale del binario descompilado:
//
//   BaseNPC<object>.AddFriendship()   ->  save.friendship += 1   (y Subtract, -1)
//   GamePreferences.get_maxFriendship()  ->  return 0x32          (o sea 50)
//   BaseNPCSave.TalkTrigger()         ->  la puerta del "una vez al dia", que va
//                                         contra LegitDay y solo marca el dia cuando
//                                         la amistad sube de verdad.

(function () {
    'use strict';

    // Constante literal en GamePreferences.get_maxFriendship(): return 0x32.
    const MAX_AMISTAD = 50;
    // AddFriendship() hace `friendship += 1` sin mirar nada mas.
    const PUNTOS_POR_CHARLA = 1;

    // 0..50 repartido en cinco corazones
    const CORAZONES = 5;

    const API = {
        get parser() { return window.app && window.app.parser; },

        /** Día OA de hoy, que es en lo que se mide `lastFriendshipDay`. */
        diaDeHoy() {
            const p = this.parser;
            if (p && typeof p.getClock === 'function') {
                // El reloj del pueblo manda sobre la hora del sistema.
                const c = p.getClock();
                if (c && c.day && c.month) {
                    const d = new Date(Date.UTC(new Date().getFullYear(), (c.month | 0) - 1, c.day | 0));
                    return Math.floor(d.getTime() / 86400000) + 25569;
                }
            }
            return Math.floor(Date.now() / 86400000) + 25569;
        },

        ahoraOA() { return (Date.now() / 86400000) + 25569; },

        ficha(charId) {
            const p = this.parser;
            return (p && typeof p.getNPCSave === 'function') ? p.getNPCSave(charId) : null;
        },

        amistad(charId) {
            const f = this.ficha(charId);
            return f ? (f.friendship | 0) : 0;
        },

        /** Corazones llenos de cinco, y si está al máximo. */
        nivel(charId) {
            const n = this.amistad(charId);
            return {
                puntos: n,
                max: MAX_AMISTAD,
                corazones: Math.min(CORAZONES, Math.floor(n / (MAX_AMISTAD / CORAZONES))),
                completo: n >= MAX_AMISTAD,
            };
        },

        /**
         * ¿Se ha hablado hoy con este vecino?
         *
         * Se mira `lastTalkOA`, NO `lastFriendshipDay`. El juego solo toca
         * `lastFriendshipDay` cuando la amistad sube de verdad, asi que en un vecino
         * al maximo se queda congelado para siempre y nunca serviria para esto.
         * `lastTalkOA` en cambio se reescribe en cada charla.
         */
        yaHabladoHoy(charId) {
            const f = this.ficha(charId);
            return !!f && Math.floor(f.lastTalkOA || 0) === this.diaDeHoy();
        },

        /**
         * Registra una charla, copiando lo que hace `BaseNPCSave.TalkTrigger()`:
         *
         *     LastTalk = CastleTime.Now;                        // siempre
         *     activitySave.Pester += 1;
         *     if (LegitDay <= lastFriendshipDay) {
         *         if (LegitDay < lastFriendshipDay)             // reloj hacia atras
         *             lastFriendshipDay = LegitDay;
         *         return;
         *     }
         *     if (friendship < GamePreferences.maxFriendship) {
         *         friendship += 1;
         *         lastFriendshipDay = LegitDay;                 // solo si subio
         *     }
         */
        hablar(charId) {
            const p = this.parser;
            const f = this.ficha(charId);
            if (!p || !f) return { ok: false, motivo: 'ese personaje no está en el save' };

            // 1. La charla queda apuntada pase lo que pase.
            p.setNPCLastTalk(f, this.ahoraOA());

            // 2. Pester sube en cada charla, no una vez al dia.
            if (typeof p.setNPCPester === 'function') {
                p.setNPCPester(f, (f.pester | 0) + 1);
            }

            // 3. El punto de amistad, una vez al dia.
            const hoy = this.diaDeHoy();
            const marcado = f.lastFriendshipDay | 0;
            const antes = f.friendship | 0;
            let subio = 0;
            const primeraDelDia = hoy > marcado;

            if (!primeraDelDia) {
                // Si el dia guardado va por delante de hoy, el juego lo baja en vez de
                // dejar al vecino bloqueado hasta alcanzarlo.
                if (hoy < marcado) p.setNPCLastFriendshipDay(f, hoy);
            } else if (antes < MAX_AMISTAD) {
                subio = Math.min(PUNTOS_POR_CHARLA, MAX_AMISTAD - antes);
                p.setNPCFriendship(f, antes + subio);
                p.setNPCLastFriendshipDay(f, hoy);
            }
            return {
                ok: true, charId: Number(charId), antes, ahora: f.friendship | 0, subio,
                nivel: this.nivel(charId),
                primeraVezHoy: primeraDelDia,
                liminal: f.origen === 'liminalSaves',
            };
        },

        /**
         * Catalogo de condiciones por personaje, sacado de los assets con
         * tools/extract_npc_conditions.py. El indice dentro de `conditions` ES el
         * `conditionID`, que es como lo resuelve `NPCCondition.get_ID()`.
         */
        _catalogo: null,

        async cargarCatalogo() {
            if (this._catalogo) return this._catalogo;
            try {
                const r = await fetch('data/npc_conditions.json');
                const d = r.ok ? await r.json() : null;
                this._catalogo = {};
                for (const [nombre, v] of Object.entries((d && d.npcs) || {})) {
                    this._catalogo[v.character] = { nombre, lista: v.conditions };
                }
            } catch (e) {
                this._catalogo = {};
            }
            return this._catalogo;
        },

        /** El nombre de una condicion, o su numero si no esta en el catalogo. */
        nombreCondicion(charId, conditionID) {
            const e = this._catalogo && this._catalogo[Number(charId)];
            const c = e && e.lista[Number(conditionID)];
            return c ? c.conditionName : ('#' + conditionID);
        },

        /** Condiciones cumplidas de un personaje (lo que mueve a los liminales). */
        condiciones(charId) {
            const p = this.parser;
            if (!p || typeof p.getConditionSaves !== 'function') return [];
            const n = Number(charId);
            return (p.getConditionSaves() || [])
                .filter(c => Number(c.charId) === n)
                .map(c => Object.assign({}, c, {
                    nombre: this.nombreCondicion(n, c.conditionID),
                }));
        },

        nombre(charId) {
            // El catálogo es `window.NPC_DB`, generado por tools/build_npcs.py.
            const db = window.NPC_DB || null;
            const e = db && db[String(charId)];
            return (e && (e.name || e.displayName)) || ('Personaje ' + charId);
        },

        /** Resumen de todos, para el panel. */
        todos() {
            const p = this.parser;
            if (!p) return [];
            if (!p.npcSaves || !p.npcSaves.length) p.parseNPCSaves();
            return (p.getAllNPCSaves() || []).map(f => ({
                charId: f.charId,
                nombre: this.nombre(f.charId),
                amistad: f.friendship | 0,
                nivel: this.nivel(f.charId),
                habladoHoy: Math.floor(f.lastTalkOA || 0) === this.diaDeHoy(),
                ultimaCharla: f.lastTalkOA || 0,
                liminal: f.origen === 'liminalSaves',
                condiciones: this.condiciones(f.charId).length,
            })).sort((a, b) => (b.amistad - a.amistad) || (a.charId - b.charId));
        },

        // ── enganche con el diálogo ──────────────────────────────────────

        /**
         * `DialogueManager.startDialogue` ya se llamaba al tocar a alguien; se envuelve
         * para que además quede constancia. Un solo punto de enganche, sin tocar
         * map.js ni el gestor de diálogos.
         */
        engancharDialogo() {
            const D = window.DialogueManager;
            if (!D || D.__conNpcSystem) return false;
            const original = D.startDialogue.bind(D);
            D.startDialogue = function (charId, nombre, ...resto) {
                let r = null;
                try { r = API.hablar(charId); } catch (e) { console.warn('[NPC]', e); }
                const salida = original(charId, nombre, ...resto);
                if (r && r.ok && r.subio > 0 && window.app && window.app.showToast) {
                    const n = r.nivel;
                    window.app.showToast('💗 ' + (nombre || API.nombre(charId)) + ': '
                        + r.ahora + '/' + n.max + (n.completo ? ' — ¡al máximo!' : ''), 'success');
                }
                API.refrescarHUD();
                return salida;
            };
            D.__conNpcSystem = true;
            return true;
        },

        refrescarHUD() {
            const el = document.getElementById('npc-hud-badge');
            if (!el) return;
            const pend = this.todos().filter(x => !x.habladoHoy && !x.liminal).length;
            el.textContent = pend ? String(pend) : '';
            el.style.display = pend ? 'inline-block' : 'none';
        },

        // ── panel ────────────────────────────────────────────────────────

        /** Los dos catalogos se cargan una vez, antes de pintar. */
        async abrirPanelAsync() {
            await this.cargarCatalogo();
            if (window.Activities && typeof window.Activities.load === 'function') {
                try { await window.Activities.load(); } catch (e) { /* sin actividades */ }
            }
            this.abrirPanel();
        },

        abrirPanel() {
            const lista = this.todos();
            let m = document.getElementById('npc-modal');
            if (m) m.remove();
            m = document.createElement('div');
            m.id = 'npc-modal';
            m.style.cssText = 'position:fixed;inset:0;z-index:9000;display:flex;align-items:center;'
                + 'justify-content:center;background:rgba(0,0,0,.45)';

            const corazones = n => '❤️'.repeat(n.corazones) + '🤍'.repeat(CORAZONES - n.corazones);
            const pueblo = lista.filter(x => !x.liminal);

            // Donde esta cada uno, si el planificador esta cargado.
            const donde = charId => {
                const A = window.Activities;
                if (!A || typeof A.resumen !== 'function') return '';
                let r = null;
                try { r = A.resumen(charId); } catch (e) { return ''; }
                if (!r || !r.activo) return '';
                return r.lugarNombre || (r.vagon != null ? 'en el tren' : '');
            };

            const filaNpc = x => '<div style="display:flex;align-items:center;gap:8px;padding:4px 0;'
                + 'border-bottom:1px solid #eee2c8">'
                + '<span style="flex:1">' + x.nombre
                + (donde(x.charId) ? '<span style="color:#8a7a63;font-size:.78em"> · '
                                     + donde(x.charId) + '</span>' : '')
                + '</span>'
                + '<span style="font-size:.85em">' + corazones(x.nivel) + '</span>'
                + '<b style="width:52px;text-align:right">' + x.amistad + '/' + x.nivel.max + '</b>'
                + '<span style="width:64px;text-align:right;font-size:.78em;color:'
                + (x.habladoHoy ? '#8a7a63' : '#2e7d32') + '">'
                + (x.habladoHoy ? 'hoy ya' : 'pendiente') + '</span></div>';

            m.innerHTML = '<div style="background:#fdf6e3;border:3px solid #8b6b4a;border-radius:14px;'
                + 'padding:20px 24px;max-width:520px;width:92%;max-height:80vh;overflow:auto;'
                + 'box-shadow:0 8px 24px rgba(0,0,0,.35)">'
                + '<h3 style="margin:0 0 4px">🧑‍🤝‍🧑 Vecinos</h3>'
                + '<div style="font-size:.82em;color:#6b5b45;margin-bottom:12px">'
                + 'Hablar con alguien sube un punto al día, hasta ' + MAX_AMISTAD + '.</div>'
                + '<h4 style="margin:8px 0 4px">Del pueblo (' + pueblo.length + ')</h4>'
                + pueblo.map(filaNpc).join('')
                + '<h4 style="margin:14px 0 4px">Condiciones cumplidas</h4>'
                + '<div style="font-size:.8em;color:#8a7a63;margin-bottom:6px">La relación con '
                + 'los de la ciudad no va por amistad sino por esto. El nombre sale de los '
                + 'assets del juego; el número entre paréntesis es el nivel.</div>'
                + lista.filter(x => x.condiciones).map(x =>
                    '<div style="padding:4px 0;border-bottom:1px solid #f0e8d4">'
                    + '<b>' + x.nombre + '</b> '
                    + '<span style="color:#6b5b45;font-size:.85em">'
                    + this.condiciones(x.charId).map(c =>
                        c.nombre + (c.level > 1 ? ' (' + c.level + ')' : '')).join(' · ')
                    + '</span></div>').join('')
                + '<button id="npc-close" class="btn-text" style="width:100%;margin-top:14px">Cerrar</button>'
                + '</div>';
            document.body.appendChild(m);
            m.addEventListener('click', ev => { if (ev.target === m) m.remove(); });
            document.getElementById('npc-close').onclick = () => m.remove();
        },
    };

    window.NPCSystem = API;

    document.addEventListener('DOMContentLoaded', () => {
        if (!API.engancharDialogo()) {
            let intentos = 0;
            const t = setInterval(() => {
                if (API.engancharDialogo() || ++intentos > 20) clearInterval(t);
            }, 250);
        }
    });
})();
