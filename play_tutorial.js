/* play_tutorial.js — el tutorial de verdad: los nueve pasos, del binario.
 *
 * ────────────────────────────────────────────────────────────────────────────
 *  POR QUE HACIA FALTA
 * ────────────────────────────────────────────────────────────────────────────
 * Una partida nueva se quedaba **atascada**. `new_game.js` ponía `tutorialStep = 0` y
 * NADA en todo el port lo subía nunca. Y como `Tutorial::get_TutorialInProgress`
 * (0x5877d10) es `TutorialStep < 9`, con el paso a 0 la barra sólo enseña la mochila
 * —`MenuButton::get_Visible` deja sólo `BagButton` mientras el paso no pasa de 3— y las
 * seis apps del teléfono están bloqueadas para siempre. No había forma de avanzar.
 *
 * ────────────────────────────────────────────────────────────────────────────
 *  LO QUE HACE EL JUEGO, DESENSAMBLADO
 * ────────────────────────────────────────────────────────────────────────────
 * `Tutorial::StartTutorial` (0x5877e80):
 *
 *     MenuLocked = true; CarrotsLocked = true;      // strh #0x101 en static+0x18
 *     SetTutorialStepStatic(1, runActivities: true, saveGame: true);
 *
 * O sea que el tutorial **empieza en el paso 1, no en el 0**.
 *
 * `Tutorial::IncreaseTutorialStep` (0x5875688) es `SetTutorialStepStatic(paso + 1, 1, 1)`.
 *
 * `Tutorial::SetTutorialStepStatic` (0x5877ed8) hace, en este orden:
 *
 *   1. `Tutorial.TutorialStep = paso`   (static+0x14)
 *   2. `TsukiSave.Get.tutorialStep = paso`  (el campo 0x108 del save)
 *   3. `TsukiSave.Save(1)`
 *   4. y según el paso, mueve el reloj, pone actividades y desbloquea:
 *
 *      paso 1   MenuLocked = CarrotsLocked = true, y nada más
 *      paso 2   reloj = GameStart + 3 h                        (y sigue bloqueado)
 *      paso 3   recorre el inventario buscando un objeto        (no toca el reloj)
 *      paso 4   reloj = GameStart + 14 h   ·  Tsuki -> actividad 85   (bloqueado)
 *      paso 5   reloj = GameStart + 15 h   ·  Tsuki -> 88  + ForceRunActivity
 *               `TsukiExtensions.Unlock(...)` dos veces: una ubicación y `YorisShop`
 *      paso 6   reloj = GameStart + 15 h   ·  Tsuki -> 115
 *               NPC 1 -> 12,  NPC 4 -> 14,  NPC 7 -> 12
 *      paso 7   reloj = GameStart + 15 h   ·  Tsuki -> 39
 *               NPC 1 -> 12,  NPC 4 -> 14,  NPC 7 -> 12
 *      paso 8   reloj = GameStart + 20 h   ·  Tsuki -> 96  + ForceRunActivity
 *               reloj = GameStart + 13 h   ·  Tsuki -> 84  + ForceRunActivity
 *                                          ·  Tsuki -> 9   + ForceRunActivity
 *      paso 9   MenuLocked = CarrotsLocked = false
 *               `editButton.locked = false`
 *               `TryAdd(InvType 0, id 3, ×1)`   ->  la **Caña de Pescar**
 *               `GameStart = CastleTime.Now`, `legitDay`, y revisa el inventario
 *
 * `Tutorial::IsOver(save)` (0x5879080): lee `save.tutorialStep`, y **si es 10 o más lo
 * recorta a 9** y lo reescribe; devuelve `paso >= 9`. Por eso 9 es el final y el save no
 * guarda más.
 *
 * ────────────────────────────────────────────────────────────────────────────
 *  LO QUE AQUI NO SE INVENTA
 * ────────────────────────────────────────────────────────────────────────────
 * El juego además enseña el dedo (`TapIndicator`), encadena diálogos y espera a que el
 * jugador toque cada botón; eso lo llevan `Tutorial.ShowCarrots/ShowEditing/ShowHarvest/
 * ShowPlantAll/ShowPhone` y sus `TurnOn…`, que se disparan desde las actividades del
 * tutorial, no desde el cambio de paso. Aquí se reproduce **la máquina de estados**: los
 * nueve pasos con su reloj, sus actividades, sus bloqueos y lo que escriben en la
 * partida. El acompañamiento —quién te señala qué— no está, y se dice.
 */
(function (global) {
    'use strict';

    const PASO_FINAL = 9;                 // `Tutorial::IsOver`: recorta a 9
    const SIN_TUTORIAL = 9;               // `TutorialInProgress` es `paso < 9`

    /**
     * La tabla, tal cual sale de `SetTutorialStepStatic`.
     *
     *   horas       `Tutorial.SetTime(GameStart.AddHours(n))`, o null si no lo toca
     *   tsuki       `ActivityData.SetTsukiActivity(n, force: true)`
     *   npcs        `GetNPC(c).SetActivity(n, force: true)`
     *   correr      `BaseGame.ForceRunActivity(true)` tras poner la actividad
     *   menuBloq    el `strh` sobre `MenuLocked` / `CarrotsLocked`
     */
    // El `strh` sobre `MenuLocked`/`CarrotsLocked` (static+0x18) es `#0x101` -los dos
    // bloqueados- en los pasos 1, 2, 4 y 8, y CERO -los dos sueltos- en el 5, 6, 7 y 9.
    // El 3 no lo toca: se queda como lo dejo el 2.
    const PASOS = {
        1: { horas: null, menuBloq: true,  carrotsBloq: true },
        2: { horas: 3,    menuBloq: true,  carrotsBloq: true },
        3: { horas: null, revisaInventario: true },
        4: { horas: 14,   tsuki: 85,  menuBloq: true,  carrotsBloq: true },
        5: { horas: 15,   tsuki: 88,  correr: true, desbloquea: [1],
             menuBloq: false, carrotsBloq: false },
        6: { horas: 15,   tsuki: 115, npcs: [[1, 12], [4, 14], [7, 12]],
             menuBloq: false, carrotsBloq: false },
        7: { horas: 15,   tsuki: 39,  npcs: [[1, 12], [4, 14], [7, 12]],
             menuBloq: false, carrotsBloq: false },
        8: { horas: 20,   tsuki: 96,  correr: true, menuBloq: true, carrotsBloq: true,
             despues: [{ horas: 13, tsuki: 84, correr: true },
                       { horas: null, tsuki: 9, correr: true }] },
        9: { horas: null, menuBloq: false, carrotsBloq: false,
             desbloqueaBoton: 'Edit', regala: { id: 3, cantidad: 1, invType: 0 },
             reiniciaGameStart: true },
    };

    // Lo que el juego mete en una partida recién creada, de `TsukiSave::InitializeNewSave`
    // (0x585a368). No es una lista a ojo: son las dos únicas cosas que añade.
    //
    //   `ItemInventorySlot(InvType 0, ID 123, ×1)`   -> el **Saco**, que es el `BagUpgrade`
    //   `TryAdd(ItemData.items[342], ×1)`            -> **Semillas de Zanahoria**
    //
    // El índice 342 es el id 342 porque `items_db` va de 0 a 2643 sin huecos, y el 342 es
    // justo «Semillas de Zanahoria» con `behaviour.kind = seed`: encaja con lo que el
    // tutorial te hace plantar.
    const OBJETOS_INICIALES = [
        { id: 123, cantidad: 1, invType: 0, que: 'Saco (BagUpgrade)' },
        { id: 342, cantidad: 1, invType: 1, que: 'Semillas de Zanahoria' },
    ];

    function parser() { return global.app && global.app.parser; }

    const API = {
        get PASOS() { return PASOS; },
        get OBJETOS_INICIALES() { return OBJETOS_INICIALES; },
        get PASO_FINAL() { return PASO_FINAL; },

        /** El paso en el que está la partida. */
        paso() {
            const p = parser();
            if (!p || typeof p.getTutorialStep !== 'function') return null;
            try {
                const v = p.getTutorialStep();
                return v == null ? null : Number(v);
            } catch (e) { return null; }
        },

        /** `Tutorial::get_TutorialInProgress` (0x5877d10): el paso por debajo de 9. */
        enMarcha() {
            const n = this.paso();
            return n != null && n < SIN_TUTORIAL;
        },

        /** `Tutorial::IsOver(save)`: recorta a 9 lo que se pase, y compara. */
        acabado() {
            const p = parser();
            let n = this.paso();
            if (n == null) return true;
            if (n > PASO_FINAL) {
                n = PASO_FINAL;
                if (p && p.setTutorialStep) p.setTutorialStep(n);
            }
            return n >= PASO_FINAL;
        },

        /** `Tutorial.MenuLocked` y `Tutorial.CarrotsLocked`, que no van en la partida. */
        menuBloqueado: false,
        carrotsBloqueado: false,

        /**
         * `Tutorial::StartTutorial` (0x5877e80): bloquea el menú y las zanahorias y
         * se mete en el paso 1.
         */
        empezar() {
            this.menuBloqueado = true;
            this.carrotsBloqueado = true;
            return this.irAlPaso(1);
        },

        /** `Tutorial::IncreaseTutorialStep` (0x5875688). */
        siguiente() {
            const n = this.paso();
            if (n == null) return { ok: false, motivo: 'sin partida cargada' };
            if (n >= PASO_FINAL) return { ok: false, motivo: 'el tutorial ya está acabado' };
            return this.irAlPaso(n + 1);
        },

        /**
         * Saltárselo. El juego tiene `KillTutorial` para abortarlo, pero lo que deja la
         * partida jugable es llegar al paso 9, que es el que desbloquea todo y entrega la
         * caña. Así que saltar = ir al 9, no matar el tutorial a medias.
         */
        saltar() { return this.irAlPaso(PASO_FINAL); },

        /**
         * `Tutorial::SetTutorialStepStatic(paso, runActivities, saveGame)` (0x5877ed8).
         */
        irAlPaso(n, opciones) {
            const o = opciones || {};
            const p = parser();
            if (!p) return { ok: false, motivo: 'sin partida cargada' };
            n = Math.max(1, Math.min(PASO_FINAL, Number(n) | 0));

            // 1 y 2: el paso, en `Tutorial` y en la partida.
            if (typeof p.setTutorialStep === 'function') p.setTutorialStep(n);

            const d = PASOS[n] || {};
            const hechas = [];

            // Los bloqueos.
            if (d.menuBloq !== undefined) this.menuBloqueado = !!d.menuBloq;
            if (d.carrotsBloq !== undefined) this.carrotsBloqueado = !!d.carrotsBloq;

            // El reloj y las actividades, incluidas las encadenadas del paso 8.
            const tramos = [d].concat(d.despues || []);
            for (const t of tramos) {
                if (t.horas != null && o.reloj !== false) {
                    if (this.ponerHora(t.horas)) hechas.push('reloj +' + t.horas + ' h');
                }
                if (t.tsuki != null && o.actividades !== false) {
                    if (this.actividadDeTsuki(t.tsuki)) hechas.push('Tsuki -> ' + t.tsuki);
                }
            }
            for (const [npc, act] of (d.npcs || [])) {
                if (o.actividades === false) break;
                if (this.actividadDeNPC(npc, act)) hechas.push('NPC ' + npc + ' -> ' + act);
            }

            // `TsukiExtensions.Unlock(SLocation)`: el paso 5 abre la tienda de Yori.
            for (const loc of (d.desbloquea || [])) {
                if (p.setLocationUnlocked && p.setLocationUnlocked(Number(loc), true)) {
                    hechas.push('abierta la ubicación ' + loc);
                }
            }

            // El paso 9: la caña, el `GameStart` y el botón de editar.
            if (d.regala) {
                try {
                    p.injectInventoryItem(d.regala.id, d.regala.cantidad, false, d.regala.invType);
                    if (global.Progress && global.Progress.anotar) global.Progress.anotar(d.regala.id);
                    hechas.push('objeto ' + d.regala.id + ' ×' + d.regala.cantidad);
                } catch (e) { hechas.push('no cupo el objeto ' + d.regala.id); }
            }
            if (n >= PASO_FINAL) this.npcForzados = {};   // se acabó el guion
            if (d.reiniciaGameStart) {
                // `TsukiSave.GameStart = CastleTime.Now`: a partir de aquí el reloj corre
                // de verdad, que es lo que hace que el juego empiece.
                if (this.soltarReloj()) hechas.push('el reloj vuelve a correr');
            }
            if (d.desbloqueaBoton && global.PlayButtons) {
                global.PlayButtons.bloqueados[d.desbloqueaBoton] = false;
                hechas.push('botón ' + d.desbloqueaBoton + ' desbloqueado');
            }

            // Que la barra y el teléfono se enteren en el acto.
            if (global.PlayButtons && global.PlayButtons.refrescar) global.PlayButtons.refrescar();
            if (typeof document !== 'undefined') this.panel();
            if (global.app && global.app.map && global.app.map.draw) {
                try { global.app.map.draw(); } catch (e) { /* sin mapa */ }
            }
            return { ok: true, paso: n, hechas, acabado: n >= PASO_FINAL };
        },

        /**
         * `Tutorial::SetTime(GameStart.AddHours(n))`. Mientras el tutorial manda, el
         * reloj NO sigue al dispositivo: lo fija el paso.
         */
        ponerHora(horas) {
            const p = parser();
            if (!p || typeof p.setClock !== 'function') return false;
            const base = this.gameStart();
            if (!base) return false;
            const t = new Date(base.getTime() + Number(horas) * 3600000);
            if (global.GameTime) global.GameTime.syncWithDevice = false;
            p.setClock({
                hour: t.getHours(), minute: t.getMinutes(),
                day: t.getDate(), month: t.getMonth() + 1,
            });
            return true;
        },

        /** Vuelve al reloj del dispositivo, que es lo del paso 9. */
        soltarReloj() {
            const p = parser();
            if (global.GameTime) global.GameTime.syncWithDevice = true;
            if (p && typeof p.soltarReloj === 'function') p.soltarReloj();
            if (global.GameTime && global.GameTime.syncFromDevice) {
                global.GameTime.syncFromDevice(true);
            }
            return true;
        },

        /** `TsukiSave.GameStart`, que es de donde cuentan todas las horas del tutorial. */
        gameStart() {
            const p = parser();
            if (!p) return null;
            const v = p.generalVars && p.generalVars.gameStartOA;
            const oa = v ? Number(v.value) : NaN;
            if (!isFinite(oa) || oa <= 0) return new Date();
            // Fecha OA: días desde 1899-12-30. 25569 es 1970-01-01.
            return new Date((oa - 25569) * 86400000);
        },

        /**
         * `ActivityData::SetTsukiActivity(n, force: true)`.
         *
         * La actividad de Tsuki SI va en la partida: es el `FurnitureBoundActivitySave`
         * con `npc = -1`, que es el único que traen los saves de prueba. Se conserva el
         * mueble y la sala a los que estaba atada y sólo se cambia la actividad, que es
         * lo que hace el juego.
         */
        actividadDeTsuki(n) {
            const p = parser();
            if (!p || typeof p.setFurnitureActivity !== 'function') {
                this.pendientes.push({ quien: 'Tsuki', actividad: Number(n),
                                       motivo: 'el parser no sabe escribir la actividad' });
                return false;
            }
            let actual = null;
            try {
                const todas = (typeof p.getActivitySaves === 'function') ? p.getActivitySaves() : [];
                actual = todas.find(a => Number(a.npc) === -1) || todas[0] || null;
            } catch (e) { actual = null; }
            try {
                p.setFurnitureActivity({
                    placementId: actual ? actual.placementId : 0,
                    sublocId: actual ? actual.subloc : 0,
                    npcId: -1,
                    activityId: Number(n),
                    valid: true,
                });
                return true;
            } catch (e) {
                this.pendientes.push({ quien: 'Tsuki', actividad: Number(n),
                                       motivo: String(e && e.message) });
                return false;
            }
        },

        /**
         * `GetNPC(c).SetActivity(n, force: true)`.
         *
         * La actividad de un vecino **no se guarda**: su `NPCSave` sólo trae `character`,
         * `friendship`, `lastFriendshipDay`, `lastTalkOA` y `pester`. Es estado de
         * ejecución, así que aquí se anota en un mapa que `play_npcs.enSala()` consulta
         * antes de usar el que le tocaría por horario.
         */
        npcForzados: {},

        actividadDeNPC(charId, n) {
            this.npcForzados[String(Number(charId))] = Number(n);
            return true;
        },

        /** Lo que el tutorial pidió y el port no supo escribir. Para no fingir que sí. */
        pendientes: [],

        /**
         * Los dos objetos con los que arranca una partida, de `InitializeNewSave`.
         * Se llama desde `new_game.js`; aquí para tenerlo junto a su fuente.
         */
        objetosDeSalida(p) {
            const par = p || parser();
            if (!par) return { ok: false, motivo: 'sin partida' };
            if (!par.inventory || !par.inventory.length) {
                try { par.parseInventory(); } catch (e) { /* sin inventario */ }
            }
            const puestos = [], yaEstaban = [];
            for (const o of OBJETOS_INICIALES) {
                // IDEMPOTENTE. `data/csave_plantilla.json` ya trae los dos huecos, así
                // que sumar otra vez dejaba «Saco ×2» y «Semillas ×2». Esto asegura que
                // el equipo de salida ESTE, no que se añada dos veces; y sigue sirviendo
                // para una partida que se quedó sin él.
                const hay = (par.inventory || []).find(
                    x => Number(x.item_id) === o.id && Number(x.invType) === o.invType);
                if (hay && Number(hay.qty) >= o.cantidad) { yaEstaban.push(o.id); continue; }
                const falta = o.cantidad - (hay ? Number(hay.qty) : 0);
                try {
                    par.injectInventoryItem(o.id, falta, false, o.invType);
                    puestos.push(o.id);
                } catch (e) { /* inventario lleno o sin molde de hueco */ }
            }
            return { ok: puestos.length + yaEstaban.length === OBJETOS_INICIALES.length,
                     puestos, yaEstaban };
        },

        /**
         * Lo que cada paso pide, en cristiano. Sale de las actividades que pone
         * `SetTutorialStepStatic`, no de una lista escrita a ojo.
         */
        QUE_TOCA: {
            1: 'Chi te cuenta qué ha pasado con la casa.',
            2: 'Pasan tres horas.',
            3: 'Mira en la mochila: llevas semillas de zanahoria.',
            4: 'Planta las semillas en la granja.',
            5: 'Se abre la tienda de Yori.',
            6: 'Los vecinos salen a hacer su vida.',
            7: 'Sigue el día en el pueblo.',
            8: 'La noche, y el día siguiente.',
            9: 'Se acabó: se desbloquea todo y te llevas la caña de pescar.',
        },

        /**
         * El panel del tutorial. El juego no tiene esto: ahí el tutorial avanza cuando
         * tocas lo que el dedo (`TapIndicator`) te señala, y eso lo llevan las
         * actividades, no el cambio de paso. En un editor de partidas no hay a quién
         * señalar, así que se enseña en qué paso va y se deja avanzar o saltar. Es
         * andamio del port y va dicho aquí, no disfrazado de original.
         */
        panel() {
            if (typeof document === 'undefined') return null;
            const viejo = document.getElementById('tutorial-panel');
            if (viejo) viejo.remove();
            if (!this.enMarcha()) return null;

            const n = this.paso();
            const cap = document.createElement('div');
            cap.id = 'tutorial-panel';
            cap.style.cssText = 'position:fixed;left:50%;transform:translateX(-50%);'
                + 'bottom:170px;z-index:9998;background:rgba(32,26,18,.92);color:#f6f1e4;'
                + 'border-radius:18px;padding:12px 18px;font-size:.9rem;max-width:520px;'
                + 'box-shadow:0 8px 24px rgba(0,0,0,.4);display:flex;align-items:center;gap:14px';

            const t = document.createElement('div');
            t.style.cssText = 'flex:1;line-height:1.35';
            t.innerHTML = '<b>Tutorial · paso ' + n + ' de ' + PASO_FINAL + '</b><br>'
                + (this.QUE_TOCA[n] || '');
            cap.appendChild(t);

            const btn = (etq, alPulsar, principal) => {
                const b = document.createElement('button');
                b.textContent = etq;
                b.style.cssText = 'border:none;border-radius:12px;padding:8px 14px;'
                    + 'cursor:pointer;font-size:.85rem;'
                    + (principal ? 'background:#e0a44c;color:#2a2118;font-weight:700'
                                 : 'background:rgba(255,255,255,.18);color:#f6f1e4');
                b.onclick = (ev) => { ev.stopPropagation(); alPulsar(); this.panel(); };
                return b;
            };
            cap.appendChild(btn('Continuar', () => this.siguiente(), true));
            cap.appendChild(btn('Saltar', () => this.saltar()));

            document.body.appendChild(cap);
            return cap;
        },

        /** Un resumen legible, para la interfaz y para las pruebas. */
        estado() {
            const n = this.paso();
            return {
                paso: n,
                enMarcha: this.enMarcha(),
                acabado: this.acabado(),
                menuBloqueado: this.menuBloqueado,
                carrotsBloqueado: this.carrotsBloqueado,
                pendientes: this.pendientes.slice(),
            };
        },
    };

    global.PlayTutorial = API;
})(typeof window !== 'undefined' ? window : globalThis);
