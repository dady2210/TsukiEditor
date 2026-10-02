// progress_system.js — colección, punchcard semanal y cartas.
//
// El parser ya sabía LEER estos tres nodos del .csave desde hace tiempo
// (`getCollection`, `getPunchcardState`, `getLetters`). Lo que faltaba era el bucle:
// que al conseguir algo entre en la colección, y que reclamar una recompensa dé de
// verdad el objeto y mueva los contadores.
//
//   collection   lista plana de ids (2119 en el save gordo). Un id negativo es la
//                variante B / brillante del mismo mueble, así que el catálogo se
//                cuenta por |id|.
//   punchcard    6 recompensas semanales + una de mueble (`furnitureReward`), con
//                `weekStartOA` y la estación. `punchcardsClaimed` lleva el total.
//   letters      41 cartas en el save gordo, cada una con sus `slotsToClaim`,
//                `carrotReward` y su `read`.

(function () {
    'use strict';

    // Todo esto sale de `PunchcardReward.Claim()` en el binario descompilado.
    const CARROTS_POR_PUNCHCARD = 200;   // madd w8, Modifier, #0xc8, zanahorias
    const ITEM_TICKET_GACHA = 1;
    const ITEM_REROLL = 322;             // mov w2, #0x142

    // LA TABLA QUE FALTABA, Y POR QUE NO SE ENCONTRABA.
    //
    // La cantidad de tickets de reroll NO es el multiplicador: es `TABLA[RewardModifier]`
    // con TABLA = [1, 1, 2, 3]. Usando el multiplicador, con el modificador a 0 el port
    // daba CERO tickets donde el juego da uno.
    //
    // Ghidra la situaba en `UNK_012e0890` y ahi hay metadatos (10857, -1, 11810...): la
    // direccion estaba desplazada 0x100000. La buena es 0x11e0890, leida del propio
    // `ldr w3, [x9, x8, lsl #2]` de `Claim`. Lo vuelca
    // `tools/extract_punchcard_code.py`, que comprueba que las cuatro instrucciones
    // siguen donde estaban.
    //
    // Y ojo con los offsets: los de `dump.cs` son de 32 bits. `[x19 + 0x10]` no es
    // `RewardType` (0x10 en el dump) sino `RewardModifier` (0x8 en el dump, +0x8 por la
    // cabecera del objeto). Se confirma con el `strb w9, [x19, #0x14]` de al lado, que
    // es `claimed` (0xC en el dump).
    const REROLLS_RESPALDO = [1, 1, 2, 3];
    let rerollsPorModificador = REROLLS_RESPALDO;

    const API = {
        get parser() { return window.app && window.app.parser; },

        get rerollsPorModificador() { return rerollsPorModificador; },

        /** Mete la tabla leida del binario. La usa `cargarCodigo()` y las pruebas. */
        usarTablaRerolls(t) {
            if (Array.isArray(t) && t.length) rerollsPorModificador = t.map(Number);
            return rerollsPorModificador;
        },

        /** Los valores de `PunchcardReward::Claim`, de `data/punchcard_code.json`. */
        async cargarCodigo() {
            try {
                const r = await fetch('data/punchcard_code.json');
                if (!r.ok) return false;
                const j = await r.json();
                this.usarTablaRerolls(j.rerollsPorModificador);
                return true;
            } catch (e) { return false; }
        },

        // ── Colección ────────────────────────────────────────────────────

        _nodoColeccion() {
            const p = this.parser;
            if (!p || !p.ast) return null;
            const n = (p.ast.children || []).find(c => c.name === 'collection');
            if (!n) return null;
            return (n.children || []).find(c => c.elements) || (n.elements ? n : null);
        },

        coleccion() {
            const p = this.parser;
            return (p && typeof p.getCollection === 'function') ? p.getCollection() : [];
        },

        tiene(id) {
            const n = Math.abs(Number(id) | 0);
            return this.coleccion().some(x => Math.abs(Number(x)) === n);
        },

        /**
         * Mete un objeto en la colección si aún no estaba. Devuelve true solo la
         * primera vez, que es cuando el juego enseña el "¡nuevo!".
         */
        anotar(id) {
            const num = Number(id) | 0;
            if (!num || this.tiene(num)) return false;
            const lista = this._nodoColeccion();
            if (!lista || !Array.isArray(lista.elements)) return false;
            const molde = lista.elements[0];
            if (!molde) return false;
            lista.elements.push({ marker: molde.marker, name: null, value: num });
            return true;
        },

        resumenColeccion() {
            const col = this.coleccion().map(x => Math.abs(Number(x)));
            const unicos = new Set(col);
            const catalogo = window.ITEMS_DB ? Object.keys(window.ITEMS_DB).length : 0;
            return { tiene: unicos.size, entradas: col.length, catalogo,
                     brillantes: this.coleccion().filter(x => Number(x) < 0).length };
        },

        // ── Punchcard ────────────────────────────────────────────────────

        punchcard() {
            const p = this.parser;
            if (!p || typeof p.getPunchcardState !== 'function') return null;
            const st = p.getPunchcardState();
            if (!st) return null;
            st.pendientes = (st.rewards || []).filter(r => !r.claimed).length;
            return st;
        },

        /**
         * `RewardModifier` no es una cantidad, es un ESCALON de multiplicador.
         * `PReward.get_Modifier()` lo traduce asi:
         *
         *     if (RewardModifier < 3) return RewardModifier + 1;   // 0->1, 1->2, 2->3
         *     if (RewardModifier == 3) return 5;
         *
         * Antes esto se entregaba crudo, o sea de 0 a 3 zanahorias en vez de las
         * 200 a 1000 que toca.
         */
        multiplicadorPunchcard(rewardModifier) {
            const m = Number(rewardModifier) | 0;
            if (m < 0) return 1;
            return m < 3 ? m + 1 : 5;
        },

        /**
         * Reclama una casilla del punchcard, copiando `PunchcardReward.Claim()`:
         *
         *     case 0 Zanahorias: AddCarrots(Modifier * 200);
         *     case 1 Tickets:    inventario.TryAdd(objeto 1,   Modifier);
         *     case 2 Rerolls:    inventario.TryAdd(objeto 322, TABLA[RewardModifier]);
         *     case 3 Telefono:   personalizacion, no hay nada que meter en el save.
         *
         * La casilla semanal es aparte: lleva un mueble en `furnID`.
         * No inventa recompensas: si la casilla no dice qué da, no da nada.
         */
        reclamarPunchcard(index, isWeekly) {
            const p = this.parser;
            const st = this.punchcard();
            if (!p || !st) return { ok: false, motivo: 'sin punchcard en el save' };
            const r = (st.rewards || []).find(x => x.index === index && !!x.isWeekly === !!isWeekly);
            if (!r) return { ok: false, motivo: 'esa casilla no existe' };
            if (r.claimed) return { ok: false, motivo: 'ya estaba reclamada' };

            // El save llama `furnID` al mueble de la casilla semanal.
            const furn = Number(r.furnID != null ? r.furnID : (r.furnId != null ? r.furnId : -1));
            const mult = this.multiplicadorPunchcard(r.modifier);
            let dado = null;

            if (furn > 0) {
                try { p.injectInventoryItem(Math.abs(furn), 1, false, 1); } catch (e) { /* inventario lleno */ }
                this.anotar(furn);
                dado = { tipo: 'mueble', id: furn };
            } else {
                switch (Number(r.rewardType) | 0) {
                    case 0: {                                  // zanahorias
                        const n = mult * CARROTS_POR_PUNCHCARD;
                        p.addCarrots(n);
                        dado = { tipo: 'zanahorias', n };
                        break;
                    }
                    case 1:                                    // tickets de gacha
                        try { p.injectInventoryItem(ITEM_TICKET_GACHA, mult, false, 1); } catch (e) {}
                        dado = { tipo: 'tickets', n: mult };
                        break;
                    case 2: {                                  // rerolls
                        // `TryAdd(322, TABLA[RewardModifier])`, no `TryAdd(322, Modifier)`.
                        const i = Math.max(0, Math.min(rerollsPorModificador.length - 1, mult | 0));
                        const n = rerollsPorModificador[i];
                        try { p.injectInventoryItem(ITEM_REROLL, n, false, 1); } catch (e) {}
                        dado = { tipo: 'rerolls', n };
                        break;
                    }
                    case 3:                                    // skin de telefono
                        dado = { tipo: 'telefono' };
                        break;
                }
            }
            p.setPunchcardSlot(index, true, !!isWeekly);
            p.bumpCounter('punchcardsClaimed', 1);
            return { ok: true, dado };
        },

        // ── Cartas ───────────────────────────────────────────────────────

        cartas() {
            const p = this.parser;
            return (p && typeof p.getLetters === 'function') ? p.getLetters() : [];
        },

        cartasPendientes() {
            return this.cartas().filter(c => !c.read).length;
        },

        /**
         * Abre una carta: entrega sus objetos y sus zanahorias, y la marca leída.
         * Los objetos entran también en la colección.
         */
        reclamarCarta(indice) {
            const p = this.parser;
            const cartas = this.cartas();
            const c = cartas[indice];
            if (!p || !c) return { ok: false, motivo: 'esa carta no existe' };
            if (c.read) return { ok: false, motivo: 'ya estaba leída' };

            const dados = [];
            for (const s of (c.slots || [])) {
                const id = Number(s.id ?? s.furnitureId ?? 0);
                if (!id) continue;
                const tipo = Number(s.invType != null ? s.invType : 1);
                try { p.injectInventoryItem(Math.abs(id), 1, false, tipo); } catch (e) { /* lleno */ }
                this.anotar(id);
                dados.push(id);
                p.bumpCounter(tipo === 1 ? 'furnitureBought' : 'itemsBought', 0); // no cuenta como compra
            }
            const zanahorias = Number(c.carrotReward) || 0;
            if (zanahorias) p.addCarrots(zanahorias);
            p.setLetterRead(indice, true);
            if (typeof p.setLetterOpened === 'function') p.setLetterOpened(indice, true);
            return { ok: true, objetos: dados, zanahorias };
        },

        // ── Diario ───────────────────────────────────────────────────────

        _diario: null,

        async cargarDiario() {
            if (this._diario) return this._diario;
            try {
                const r = await fetch('/data/diary.json');
                this._diario = r.ok ? await r.json() : { entries: [] };
            } catch (e) {
                this._diario = { entries: [] };
            }
            return this._diario;
        },

        /**
         * Entradas del diario del jugador, cruzadas con el texto del juego.
         *
         * `diarySaves` guarda {num, diaryAchievedOA, night, state} y `state` es
         * 0 sin ver, 1 mostrada, 2 vista. El texto sale de data/diary.json; el asset
         * extraído llega hasta la entrada 143, así que las de contenido más nuevo
         * salen sin texto en vez de inventarse uno.
         */
        diario() {
            const p = this.parser;
            if (!p || !p.ast) return [];
            const n = (p.ast.children || []).find(c => c.name === 'diarySaves');
            const lista = n && n.children && n.children[0];
            const els = (lista && lista.elements) || [];
            const textos = {};
            for (const e of ((this._diario && this._diario.entries) || [])) textos[e.num] = e;
            const ESTADO = { 0: 'sin ver', 1: 'mostrada', 2: 'vista' };
            return els.map(el => {
                const v = el.value || el;
                const g = nom => (v.children || []).find(c => c.name === nom);
                const num = Number(g('num')?.value ?? -1);
                const t = textos[num];
                return {
                    num,
                    state: Number(g('state')?.value ?? 0),
                    estado: ESTADO[Number(g('state')?.value ?? 0)] || '?',
                    night: !!g('night')?.value,
                    texto: t ? t.text_es : null,
                    arte: t ? t.artName : null,
                };
            }).sort((a, b) => a.num - b.num);
        },

        // ── Parsnap (encargos de foto) ───────────────────────────────────

        parsnap() {
            const p = this.parser;
            if (!p || typeof p.getParsnapBounties !== 'function') return null;
            const st = p.getParsnapBounties();
            if (!st.present) return null;
            st.pendientes = st.bounties.filter(b => !b.collected).length;
            return st;
        },

        /** Cobra un encargo de foto: ticket de gacha o zanahorias. */
        reclamarParsnap(index) {
            const p = this.parser;
            if (!p) return { ok: false, motivo: 'sin partida' };
            const r = p.claimParsnapBounty(index);
            if (!r) return { ok: false, motivo: 'ese encargo no se puede cobrar' };
            // Sin ticket, el juego paga en zanahorias; el importe exacto no está en el
            // save, así que se usa una cifra fija y se deja dicho.
            if (!r.ticket) p.addCarrots(r.shiny ? 500 : 250);
            return { ok: true, ticket: r.ticket, shiny: r.shiny };
        },

        // ── resumen para la UI ───────────────────────────────────────────

        resumen() {
            const p = this.parser;
            if (!p) return null;
            const pc = this.punchcard();
            return {
                coleccion: this.resumenColeccion(),
                punchcard: pc ? { reclamadas: pc.claimedCount, pendientes: pc.pendientes,
                                  casillas: (pc.rewards || []).length } : null,
                cartas: { total: this.cartas().length, sinLeer: this.cartasPendientes() },
                diario: (() => { const d = this.diario();
                    return { total: d.length, vistas: d.filter(x => x.state === 2).length,
                             conTexto: d.filter(x => x.texto).length }; })(),
                parsnap: (() => { const ps = this.parsnap();
                    return ps ? { total: ps.bounties.length, pendientes: ps.pendientes,
                                  huecos: ps.slots } : null; })(),
                contadores: {
                    zanahoriasGanadas: p.getCounter('carrotsEarned'),
                    zanahoriasGastadas: p.getCounter('carrotsSpent'),
                    mueblesComprados: p.getCounter('furnitureBought'),
                    objetosVendidos: p.getCounter('itemsSold'),
                    peces: p.getCounter('fishCaught'),
                    cosechas: p.getCounter('harvestTimes'),
                    tiradasGacha: p.getCounter('gachaRolled'),
                    junker: p.getCounter('junkerUsed'),
                    periodicos: p.getCounter('newspapersRead'),
                    recompensas: p.getCounter('bountiesClaimed'),
                    treboles: p.getCounter('cloversBred'),
                },
            };
        },
    };

    // ── panel ────────────────────────────────────────────────────────────

    API.abrirPanel = function () {
        const r = this.resumen();
        if (!r) return;
        let m = document.getElementById('progress-modal');
        if (m) m.remove();
        m = document.createElement('div');
        m.id = 'progress-modal';
        m.style.cssText = 'position:fixed;inset:0;z-index:9000;display:flex;align-items:center;'
            + 'justify-content:center;background:rgba(0,0,0,.45)';

        const fila = (k, v) => '<div style="display:flex;justify-content:space-between;'
            + 'padding:2px 0"><span style="color:#6b5b45">' + k + '</span><b>' + v + '</b></div>';

        const c = r.coleccion;
        const pc = r.punchcard;
        let html = '<div style="background:#fdf6e3;border:3px solid #8b6b4a;border-radius:14px;'
            + 'padding:20px 24px;max-width:460px;width:90%;max-height:80vh;overflow:auto;'
            + 'box-shadow:0 8px 24px rgba(0,0,0,.35)">'
            + '<h3 style="margin:0 0 12px">📚 Progreso</h3>'
            + '<h4 style="margin:10px 0 4px">Colección</h4>'
            + fila('Objetos distintos', c.tiene)
            + fila('Entradas totales', c.entradas)
            + fila('Variantes brillantes', c.brillantes)
            + (c.catalogo ? fila('Del catálogo', c.tiene + ' de ' + c.catalogo) : '');

        html += '<h4 style="margin:14px 0 4px">Punchcard</h4>';
        html += pc ? (fila('Reclamadas en total', pc.reclamadas)
                    + fila('Casillas esta semana', pc.casillas)
                    + fila('Sin reclamar', pc.pendientes)
                    + (pc.pendientes ? '<button id="pc-claim" class="btn-primary" '
                        + 'style="width:100%;margin-top:6px">Reclamar lo pendiente</button>' : ''))
                   : '<div style="color:#8a7a63">Este save no trae punchcard.</div>';

        html += '<h4 style="margin:14px 0 4px">Cartas</h4>'
             + fila('Recibidas', r.cartas.total)
             + fila('Sin leer', r.cartas.sinLeer)
             + (r.cartas.sinLeer ? '<button id="lt-claim" class="btn-primary" '
                 + 'style="width:100%;margin-top:6px">Abrir todas</button>' : '');

        html += '<h4 style="margin:14px 0 4px">Diario</h4>'
             + fila('Entradas', r.diario.total)
             + fila('Vistas', r.diario.vistas)
             + fila('Con texto extraído', r.diario.conTexto + ' de ' + r.diario.total)
             + (r.diario.total ? '<button id="dy-open" class="btn-primary" '
                 + 'style="width:100%;margin-top:6px">Leer el diario</button>' : '');

        html += '<h4 style="margin:14px 0 4px">Parsnap (fotos)</h4>';
        html += r.parsnap ? (fila('Encargos', r.parsnap.total)
                           + fila('Huecos', r.parsnap.huecos)
                           + fila('Sin cobrar', r.parsnap.pendientes)
                           + (r.parsnap.pendientes ? '<button id="ps-claim" class="btn-primary" '
                               + 'style="width:100%;margin-top:6px">Cobrar los pendientes</button>' : ''))
                          : '<div style="color:#8a7a63">Este save no trae Parsnap.</div>';

        html += '<h4 style="margin:14px 0 4px">Estadísticas</h4>';
        const nombres = {
            zanahoriasGanadas: 'Zanahorias ganadas', zanahoriasGastadas: 'Zanahorias gastadas',
            mueblesComprados: 'Muebles comprados', objetosVendidos: 'Objetos vendidos',
            peces: 'Peces', cosechas: 'Cosechas', tiradasGacha: 'Tiradas de gacha',
            junker: 'Usos de la Junker', periodicos: 'Periódicos leídos',
            recompensas: 'Recompensas', treboles: 'Tréboles criados',
        };
        for (const k of Object.keys(nombres)) html += fila(nombres[k], r.contadores[k]);

        html += '<button id="pr-close" class="btn-text" style="width:100%;margin-top:14px">Cerrar</button></div>';
        m.innerHTML = html;
        document.body.appendChild(m);
        m.addEventListener('click', ev => { if (ev.target === m) m.remove(); });
        document.getElementById('pr-close').onclick = () => m.remove();

        const btnPc = document.getElementById('pc-claim');
        if (btnPc) btnPc.onclick = () => {
            const st = this.punchcard();
            let n = 0;
            const suma = { zanahorias: 0, tickets: 0, rerolls: 0, mueble: 0 };
            for (const x of (st.rewards || [])) {
                if (x.claimed) continue;
                const r = this.reclamarPunchcard(x.index, x.isWeekly);
                if (!r.ok) continue;
                n++;
                if (r.dado && suma[r.dado.tipo] !== undefined) {
                    suma[r.dado.tipo] += (r.dado.n || 1);
                }
            }
            const detalle = [];
            if (suma.zanahorias) detalle.push('🥕 ' + suma.zanahorias);
            if (suma.tickets) detalle.push('🎟️ ' + suma.tickets);
            if (suma.rerolls) detalle.push('🎲 ' + suma.rerolls);
            if (suma.mueble) detalle.push('🪑 ' + suma.mueble);
            window.app?.showToast?.('Reclamadas ' + n + ' casillas'
                + (detalle.length ? ' — ' + detalle.join('  ') : ''), 'success');
            window.app?.refreshCarrotsUI?.();
            m.remove(); this.abrirPanel();
        };
        const btnDy = document.getElementById('dy-open');
        if (btnDy) btnDy.onclick = () => {
            // La ventana de verdad es `DiaryPopup`, de level14: las fotos esparcidas con
            // su sombra y su giro. Si esta montada se abre esa; la lista de abajo se
            // queda de respaldo. Los datos son los mismos, `this.diario()`.
            if (window.PlayPopups && typeof window.PlayPopups.diario === 'function') {
                window.PlayPopups.diario();
                return;
            }
            const d = this.diario().filter(x => x.texto);
            const cuerpo = d.map(x => '<div style="padding:6px 0;border-bottom:1px solid #e8dcc4">'
                + '<b>#' + x.num + '</b> <span style="color:#8a7a63">' + (x.arte || '')
                + ' · ' + x.estado + (x.night ? ' · noche' : '') + '</span><br>'
                + x.texto + '</div>').join('');
            const v = document.createElement('div');
            v.style.cssText = 'position:fixed;inset:0;z-index:9100;display:flex;align-items:center;'
                + 'justify-content:center;background:rgba(0,0,0,.5)';
            v.innerHTML = '<div style="background:#fdf6e3;border:3px solid #8b6b4a;border-radius:14px;'
                + 'padding:20px;max-width:560px;width:92%;max-height:80vh;overflow:auto">'
                + '<h3 style="margin:0 0 10px">📖 Diario (' + d.length + ')</h3>' + cuerpo
                + '<button class="btn-text" style="width:100%;margin-top:12px">Cerrar</button></div>';
            document.body.appendChild(v);
            v.addEventListener('click', ev => {
                if (ev.target === v || ev.target.tagName === 'BUTTON') v.remove();
            });
        };
        const btnPs = document.getElementById('ps-claim');
        if (btnPs) btnPs.onclick = () => {
            const ps = this.parsnap();
            let n = 0;
            for (const b of (ps.bounties || [])) {
                if (!b.collected && this.reclamarParsnap(b.index).ok) n++;
            }
            window.app?.showToast?.('Cobrados ' + n + ' encargos de foto', 'success');
            window.app?.refreshCarrotsUI?.();
            m.remove(); this.abrirPanel();
        };
        const btnLt = document.getElementById('lt-claim');
        if (btnLt) btnLt.onclick = () => {
            const cartas = this.cartas();
            let n = 0, z = 0;
            for (let i = 0; i < cartas.length; i++) {
                if (cartas[i].read) continue;
                const res = this.reclamarCarta(i);
                if (res.ok) { n++; z += res.zanahorias; }
            }
            window.app?.showToast?.('Abiertas ' + n + ' cartas (+' + z + ' 🥕)', 'success');
            window.app?.refreshCarrotsUI?.();
            m.remove(); this.abrirPanel();
        };
    };

    window.Progress = API;
    document.addEventListener('DOMContentLoaded', () => {
        API.cargarDiario();
        // La tabla de rerolls de `PunchcardReward::Claim`. Sin esto se usa el respaldo,
        // que son los mismos valores; pedirla deja corregirlos sin tocar el módulo.
        API.cargarCodigo();
    });
})();
