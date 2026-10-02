/**
 * dialogue_manager.js - Módulo 2: Motor de Diálogos e Interacción UI
 * Controla la carga de diálogos, selección contextual, máquina de escribir (typewriter),
 * avance de líneas, retratos y visualización de la caja de diálogo en Modo Play.
 */
// Los nodos que PIDEN algo al jugador. No se resuelven al llegar a ellos: primero el
// vecino dice sus lineas, y al acabarlas `_goToNextNode` ofrece lo que toque.
//
//   Dialogue Request  66   te pide objetos          `requestedItems`, `accept`/`reject`
//   Convo Ad          13   te paga por un anuncio   `carrotReward`
//   Sell Convo         2   te compra lo que lleves  `valuation`, `accept`/`reject`
//   Parcel Convo       2   le entregas un paquete   `correct`/`wrong`/`dismissed`
//   Text Field         2   le pones un nombre       `playerString`
//
// `Dialogue Gift` (83) y `Deed Convo` (1) SI son inmediatos, y `Egg Convo` (154) no es una
// accion sino una puerta.
const INTERACTIVOS = new Set([
    'Dialogue Request', 'Convo Ad', 'Sell Convo', 'Parcel Convo', 'Text Field',
]);

class DialogueManager {
    constructor() {
        this.dialogues = null;
        this.isLoading = false;
        this.isOpen = false;
        this.currentConvo = null;
        this.currentLineIndex = 0;
        this.currentLang = 'sp'; // 'sp' o 'en'
        this.isTyping = false;
        this.typewriterTimer = null;
        this.fullCurrentText = '';
        this.displayedChars = 0;
        this.pesterCounters = {}; // charId -> count of interactions today

        // DOM Elements
        this.overlay = null;
        this.portraitEl = null;
        this.nameEl = null;
        this.textEl = null;
        this.indicatorEl = null;
        this.optionsEl = null;
        this.closeBtn = null;
        this.langBtn = null;
    }

    init() {
        this._buildUI();
        // Los diálogos (3 MB) NO se cargan al arrancar: startDialogue() los pide la
        // primera vez que hablas con alguien. Bajarlos de entrada retrasaba el inicio
        // sin que la mayoría de las partidas llegue a usarlos.
        this._bindEvents();
    }

    _buildUI() {
        if (document.getElementById('play-dialogue-overlay')) return;

        const overlay = document.createElement('div');
        overlay.id = 'play-dialogue-overlay';
        overlay.style.display = 'none';
        overlay.innerHTML = `
            <div id="play-dialogue-box" class="tsuki-dialogue-box">
                <div class="dialogue-header">
                    <div class="dialogue-name-wrapper">
                        <span id="dialogue-speaker-name">Personaje</span>
                    </div>
                    <div class="dialogue-header-tools">
                        <button type="button" id="dialogue-lang-toggle" title="Cambiar Idioma (ES/EN)">ES</button>
                        <button type="button" id="dialogue-close-btn" title="Cerrar diálogo">✕</button>
                    </div>
                </div>
                <div class="dialogue-body">
                    <div class="dialogue-portrait-container">
                        <img id="dialogue-portrait-img" src="" alt="Retrato">
                    </div>
                    <div class="dialogue-content-container">
                        <div id="dialogue-text-body"></div>
                        <div id="dialogue-options-container" style="display:none;"></div>
                    </div>
                </div>
                <div class="dialogue-footer">
                    <div id="dialogue-advance-indicator" class="pulsing-arrow">▼</div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        this.overlay = overlay;
        this.boxEl = document.getElementById('play-dialogue-box');
        this.portraitEl = document.getElementById('dialogue-portrait-img');
        this.nameEl = document.getElementById('dialogue-speaker-name');
        this.textEl = document.getElementById('dialogue-text-body');
        this.indicatorEl = document.getElementById('dialogue-advance-indicator');
        this.optionsEl = document.getElementById('dialogue-options-container');
        this.closeBtn = document.getElementById('dialogue-close-btn');
        this.langBtn = document.getElementById('dialogue-lang-toggle');

        this._injectStyles();
    }

    _injectStyles() {
        if (document.getElementById('dialogue-system-styles')) return;
        const style = document.createElement('style');
        style.id = 'dialogue-system-styles';
        style.textContent = `
            #play-dialogue-overlay {
                /* El display va aqui y no en linea, para que play_dialogue_ui lo pueda
                   cambiar a flex con su hoja. Cerrar sigue siendo display:none en
                   linea, que gana a las dos. (Sin comillas invertidas: esto esta
                   DENTRO de una plantilla de JS y una sola la parte en dos.) */
                display: block;
                position: fixed;
                bottom: 24px;
                left: 50%;
                transform: translateX(-50%);
                z-index: 99999;
                pointer-events: auto;
                user-select: none;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            }
            .tsuki-dialogue-box {
                width: min(720px, 92vw);
                background: rgba(26, 22, 28, 0.94);
                backdrop-filter: blur(10px);
                -webkit-backdrop-filter: blur(10px);
                border: 2px solid #5b3d68;
                border-radius: 16px;
                box-shadow: 0 12px 35px rgba(0, 0, 0, 0.65), 0 0 15px rgba(168, 85, 247, 0.2);
                color: #f3f4f6;
                padding: 14px 18px 10px 18px;
                box-sizing: border-box;
                display: flex;
                flex-direction: column;
                gap: 8px;
                animation: dialogueSlideUp 0.22s cubic-bezier(0.16, 1, 0.3, 1);
            }
            @keyframes dialogueSlideUp {
                from { opacity: 0; transform: translateY(18px) scale(0.97); }
                to { opacity: 1; transform: translateY(0) scale(1); }
            }
            .dialogue-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 1px solid rgba(168, 85, 247, 0.25);
                padding-bottom: 6px;
            }
            .dialogue-name-wrapper {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            #dialogue-speaker-name {
                font-size: 15px;
                font-weight: 700;
                color: #e9d5ff;
                text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
                letter-spacing: 0.4px;
            }
            .dialogue-header-tools {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            #dialogue-lang-toggle {
                background: #3b204e;
                color: #d8b4fe;
                border: 1px solid #7e22ce;
                border-radius: 6px;
                padding: 2px 8px;
                font-size: 11px;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.15s ease;
            }
            #dialogue-lang-toggle:hover {
                background: #6b21a8;
                color: #fff;
            }
            #dialogue-close-btn {
                background: transparent;
                border: none;
                color: #9ca3af;
                font-size: 15px;
                font-weight: bold;
                cursor: pointer;
                padding: 0 4px;
                line-height: 1;
                transition: color 0.15s ease;
            }
            #dialogue-close-btn:hover {
                color: #f87171;
            }
            .dialogue-body {
                display: flex;
                gap: 16px;
                align-items: flex-start;
                min-height: 72px;
            }
            .dialogue-portrait-container {
                width: 72px;
                height: 72px;
                flex-shrink: 0;
                background: #1e1327;
                border: 2px solid #6b21a8;
                border-radius: 12px;
                overflow: hidden;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: inset 0 0 10px rgba(0,0,0,0.5);
            }
            #dialogue-portrait-img {
                width: 100%;
                height: 100%;
                object-fit: contain;
                image-rendering: pixelated;
            }
            .dialogue-content-container {
                flex: 1;
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            #dialogue-text-body {
                font-size: 14px;
                line-height: 1.5;
                color: #f9fafb;
                min-height: 44px;
                word-wrap: break-word;
            }
            /* Respuestas de Tsuki: los nodos 'response' del grafo del juego */
            #dialogue-options-container {
                display: none;
                flex-direction: column;
                gap: 5px;
                margin-top: 8px;
            }
            .dialogue-option-btn {
                background: rgba(255,255,255,0.07);
                border: 1px solid rgba(255,255,255,0.22);
                border-radius: 6px;
                color: #f9fafb;
                font-family: inherit;
                font-size: 13px;
                line-height: 1.35;
                text-align: left;
                padding: 7px 10px;
                cursor: pointer;
                transition: background .12s, border-color .12s;
            }
            .dialogue-option-btn:hover {
                background: rgba(255,255,255,0.16);
                border-color: #e0b050;
            }
            .dialogue-footer {
                display: flex;
                justify-content: flex-end;
                height: 14px;
            }
            .pulsing-arrow {
                font-size: 11px;
                color: #c084fc;
                animation: arrowBounce 1s infinite alternate ease-in-out;
            }
            @keyframes arrowBounce {
                from { transform: translateY(0); opacity: 0.4; }
                to { transform: translateY(3px); opacity: 1; }
            }
            .dialogue-option-btn {
                background: #2b173d;
                border: 1px solid #7c3aed;
                color: #e9d5ff;
                padding: 6px 12px;
                border-radius: 8px;
                font-size: 12px;
                cursor: pointer;
                text-align: left;
                transition: all 0.15s ease;
            }
            .dialogue-option-btn:hover {
                background: #6d28d9;
                color: #fff;
                transform: translateX(3px);
            }
        `;
        document.head.appendChild(style);
    }

    async _loadDialogues() {
        if (this.dialogues || this.isLoading) return;
        this.isLoading = true;
        try {
            const prefix = (typeof window !== 'undefined' && window.location.pathname.includes('/HERRAMIENTAS/')) ? '../../' : '';
            const res = await fetch(prefix + 'data/dialogues_compact.json');
            if (res.ok) {
                this.dialogues = await res.json();
                console.log('[DialogueManager] Diálogos cargados:', Object.keys(this.dialogues).length, 'NPCs disponibles.');
            }
        } catch(e) {
            console.warn('[DialogueManager] Error cargando dialogues_compact.json:', e);
        } finally {
            this.isLoading = false;
            // Aunque falle, dejar algo: si no, startDialogue() reintentaría sin parar.
            if (!this.dialogues) this.dialogues = {};
        }
    }

    _bindEvents() {
        if (this.closeBtn) {
            this.closeBtn.onclick = (e) => {
                e.stopPropagation();
                this.close();
            };
        }
        if (this.langBtn) {
            this.langBtn.onclick = (e) => {
                e.stopPropagation();
                this.toggleLang();
            };
        }
        if (this.boxEl) {
            this.boxEl.onclick = (e) => {
                // If clicking an option button, let it handle itself
                if (e.target.classList.contains('dialogue-option-btn')) return;
                e.stopPropagation();
                this.advance();
            };
        }
        window.addEventListener('keydown', (e) => {
            if (!this.isOpen) return;
            if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                this.advance();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                this.close();
            }
        });
    }

    toggleLang() {
        this.currentLang = (this.currentLang === 'sp') ? 'en' : 'sp';
        if (this.langBtn) this.langBtn.innerText = this.currentLang.toUpperCase();
        if (this.currentConvo && this.currentConvo.lines) {
            const line = this.currentConvo.lines[this.currentLineIndex];
            if (line) {
                this._renderCurrentLine(true); // render instant
            }
        }
    }

    startDialogue(charId, charName) {
        if (!this.overlay) this.init();
        if (!this.dialogues) {
            this._loadDialogues().then(() => this.startDialogue(charId, charName));
            return;
        }

        const idNum = parseInt(charId);
        const npcData = this.dialogues[idNum] || this.dialogues[String(idNum)];

        // Increment pester count for this NPC
        this.pesterCounters[idNum] = (this.pesterCounters[idNum] || 0) + 1;
        const pesterLevel = this.pesterCounters[idNum];

        let convo = null;
        this.graph = null;
        this.nodeIdx = -1;

        // Formato nuevo (tools/build_dialogues.py): grafos con nodos {k,l,to} y arranques.
        // 'k' distingue lo que dice el NPC ('c') de lo que puede responder Tsuki ('r'),
        // y 'to' es el flujo.
        //
        // El flujo estuvo a medias mucho tiempo: solo 265 de los 717 grafos lo tenian,
        // porque el volcado del que salieron leyo media biblioteca SIN TYPETREE y perdio
        // las conexiones. `tools/cs_dialogue_flow` las saco de donde estan de verdad
        // -`Node.ports` -> `NodePort.connections`- y ahora son 576 de 717, con 7.313
        // aristas en vez de 2.377.
        //
        // De los 140 que siguen sin flujo, 121 NO lo tienen en el propio asset: son
        // grafos de charla suelta, donde el juego elige un nodo de arranque y dice esa
        // linea. Los otros 19 son genericos -«Teresa», «Leon», «Clem»- de los que hay
        // hasta diecisiete con el mismo nombre, y su texto empata entre varios
        // candidatos. Emparejarlos a ojo le pondria a un grafo el flujo de otro, asi que
        // se quedan sin el.
        //
        // Aun asi se siguen prefiriendo los que tienen flujo: una charla con ramas se
        // parece mas a hablar que una lista de frases.
        if (npcData && npcData.graphs && npcData.graphs.length) {
            // `nox` = dontExport: grafos de desarrollo que el juego nunca muestra.
            // Salian igual porque el selector no los miraba.
            const gs = npcData.graphs.filter(g => !g.nox);
            if (gs[0] && gs[0].n) {
                const conFlujo = gs.filter(g => g.n.some(n => n.to && n.to.length));
                const pool = conFlujo.length ? conFlujo : gs;

                // Los nodos traen sus puertas (`cond`, `tm`, `nr`) desde que
                // build_dialogues.py las conserva. `Activities` las juzga: desde que
                // estan los 58 tipos, las 899 puertas de los nodos caen dentro de lo que
                // sabe juzgar. Aun asi, lo que no sepa juzgar NO bloquea: un vecino mudo
                // se nota mas que un dialogo que sale cuando no toca.
                const arranques = g => (g.s && g.s.length ? g.s : [0])
                    .filter(i => g.n[i] && g.n[i].k === 'c' && !g.n[i].nr);
                const validos = g => arranques(g).filter(i => this._nodoPermitido(g.n[i], idNum));

                let elegibles = pool.map(g => ({ g, st: validos(g) })).filter(x => x.st.length);
                // Si las puertas no dejan pasar nada, mejor una conversacion cualquiera
                // que dejar al vecino mudo.
                if (!elegibles.length) {
                    elegibles = pool.map(g => ({ g, st: arranques(g) })).filter(x => x.st.length);
                }
                if (!elegibles.length) elegibles = pool.map(g => ({ g, st: [0] }));

                const sel = elegibles[Math.floor(Math.random() * elegibles.length)];
                const g = sel.g;
                const s0 = sel.st[Math.floor(Math.random() * sel.st.length)];
                this.graph = g;
                this.nodeIdx = s0;
                convo = this._convoFromNode(g.n[s0]);
            } else {
                // Formato antiguo, por si queda un dialogues_compact.json sin regenerar
                const g = gs[Math.floor(Math.random() * gs.length)];
                if (g && g.nodes && g.nodes.length) {
                    convo = g.nodes[Math.floor(Math.random() * g.nodes.length)];
                }
            }
        }

        // Fallback lines if no specific graph found
        if (!convo || !convo.lines || convo.lines.length === 0) {
            const displayName = charName || (npcData ? npcData.name : 'Amigo');
            convo = {
                name: 'Casual',
                lines: [
                    {
                        sp: `¡Hola Tsuki! Es un día hermoso en la aldea.`,
                        en: `Hello Tsuki! It is a lovely day in the village.`
                    }
                ]
            };
        }

        this.currentConvo = convo;
        this.currentLineIndex = 0;
        this.currentChar = { id: idNum, name: charName || (npcData ? npcData.name : 'NPC') };
        // El nodo de arranque no pasa por `_enterNode`, y `currentChar` no existia hasta
        // esta linea, asi que sus condiciones se disparan aqui.
        if (this.graph && this.nodeIdx >= 0) {
            this._dispararCondiciones(this.graph.n[this.nodeIdx]);
        }

        // Set Speaker Name & Portrait
        if (this.nameEl) this.nameEl.innerText = this.currentChar.name;
        this._updatePortrait(this.currentChar.name, this.currentChar.id);

        // `SFXClip.DialoguePoof`: la misma nube al abrir que al cerrar.
        if (!this.isOpen && window.PlaySfx) window.PlaySfx.sonar('dialoguePoof');
        this.isOpen = true;
        this.overlay.style.display = '';

        this._renderCurrentLine();
    }

    /**
     * El retrato del NPC, en el editor.
     *
     * ANTES ESTO SONDEABA. Probaba `portraits/<minusculas>.png`, luego
     * `portraits/<Nombre>.png` y luego `portraits/portrait.png`, cada fallo un 404. Once
     * carpetas de retrato estan VACIAS — Alexander, Breezy, Clementine, Draper, Leon,
     * Olson, Rudolph, Slorchy, Teresa, Theo y Tom —, asi que hablar con cualquiera de
     * ellos eran tres 404 seguidos y ninguno traia retrato.
     *
     * Ahora lo dice `data/sprite_variants.json`. Y EN MODO JUEGO NI SE MIRA: el bocadillo
     * del juego no lleva retrato y `play_dialogue_ui` esconde el elemento, asi que pedir la
     * imagen era gastar una peticion en algo que no se ve.
     */
    _updatePortrait(name, charId) {
        const el = this.portraitEl;
        if (!el) return;
        if (el.style.display === 'none') return;   // modo juego: no hay retrato

        const cleanName = (name || '').trim();
        const V = (typeof window !== 'undefined') ? window.SPRITE_VARIANTS : null;
        const prefix = (typeof window !== 'undefined'
                        && window.location.pathname.includes('/HERRAMIENTAS/')) ? '../../' : '';

        if (V && V.retratos && Object.prototype.hasOwnProperty.call(V.retratos, cleanName)) {
            const f = V.retratos[cleanName];
            if (!f) { el.removeAttribute('src'); el.style.visibility = 'hidden'; return; }
            el.style.visibility = '';
            el.src = prefix + 'images/npcs/' + cleanName + '/portraits/'
                   + encodeURIComponent(f);
            return;
        }

        // Sin manifiesto —o con un nombre que no esta en el—, UNA sonda en vez de tres.
        el.style.visibility = '';
        el.onerror = () => {
            el.onerror = null;
            el.removeAttribute('src');
            el.style.visibility = 'hidden';
        };
        el.src = prefix + 'images/npcs/' + cleanName + '/portraits/'
               + cleanName.toLowerCase() + '.png';
    }

    _renderCurrentLine(skipAnimation = false) {
        if (!this.currentConvo || !this.currentConvo.lines) return;
        const line = this.currentConvo.lines[this.currentLineIndex];
        if (!line) {
            this.close();
            return;
        }

        const text = (this.currentLang === 'sp' ? (line.sp || line.en) : (line.en || line.sp)) || '...';
        this.fullCurrentText = text;

        if (this.typewriterTimer) clearInterval(this.typewriterTimer);

        if (skipAnimation) {
            this.isTyping = false;
            if (this.textEl) this.textEl.innerText = text;
            if (this.indicatorEl) this.indicatorEl.style.visibility = 'visible';
            return;
        }

        this.isTyping = true;
        this.displayedChars = 0;
        if (this.textEl) this.textEl.innerText = '';
        if (this.indicatorEl) this.indicatorEl.style.visibility = 'hidden';

        const speed = 22; // ms per character
        this.typewriterTimer = setInterval(() => {
            this.displayedChars++;
            if (this.displayedChars <= this.fullCurrentText.length) {
                if (this.textEl) this.textEl.innerText = this.fullCurrentText.slice(0, this.displayedChars);
            } else {
                clearInterval(this.typewriterTimer);
                this.typewriterTimer = null;
                this.isTyping = false;
                if (this.indicatorEl) this.indicatorEl.style.visibility = 'visible';
            }
        }, speed);
    }

    // Un nodo del formato nuevo -> el {name, lines} que consume el renderizador
    _convoFromNode(node) {
        if (!node) return null;
        return { name: node.k === 'r' ? 'Tsuki' : 'Conversation', lines: node.l || [], kind: node.k };
    }

    _textOf(line) {
        return (this.currentLang === 'sp' ? (line.sp || line.en) : (line.en || line.sp)) || '...';
    }

    // Si desde el nodo actual se sale hacia respuestas, se las ofrece a Tsuki.
    // Si sale hacia un unico nodo del NPC, se sigue. Si no hay flujo, se recorre el
    // grafo en orden, que es como se comportaba antes.
    _goToNextNode() {
        const g = this.graph;
        if (!g) { this.close(); return; }
        const cur = g.n[this.nodeIdx];

        // Una linea suelta puesta por `_decir` no pertenece al grafo: al acabarla se
        // sigue por donde diga quien la puso, no por el `to` del nodo.
        if (this._trasLinea) {
            const f = this._trasLinea;
            this._trasLinea = null;
            f();
            return;
        }

        // Los nodos que piden algo al jugador se cobran AQUI, cuando el vecino ya ha
        // dicho lo suyo. Si uno se hace cargo, se queda en pantalla y no se avanza.
        if (cur && cur.typ && INTERACTIVOS.has(cur.typ) && !this._yaResuelto) {
            if (this._interaccionEspecial(cur, this.nodeIdx)) { this._yaResuelto = true; return; }
        }
        this._yaResuelto = false;
        const to = (cur && cur.to) ? cur.to.filter(i => g.n[i]) : [];

        const quien = this.currentChar ? this.currentChar.id : null;
        const pasa = i => this._nodoPermitido(g.n[i], quien);

        // Las respuestas tambien tienen puertas; si ninguna pasa, se ofrecen todas
        // antes que dejar la conversacion sin salida.
        const respuestas = to.filter(i => g.n[i].k === 'r');
        if (respuestas.length) {
            const abiertas = respuestas.filter(pasa);
            this._renderChoices(abiertas.length ? abiertas : respuestas);
            return;
        }

        if (to.length) {
            const abiertos = to.filter(pasa);
            this._enterNode(abiertos.length ? abiertos[0] : to[0]);
            return;
        }

        const tieneFlujo = g.n.some(n => n.to && n.to.length);
        if (!tieneFlujo && this.nodeIdx + 1 < g.n.length && g.n[this.nodeIdx + 1].k === 'c') {
            this._enterNode(this.nodeIdx + 1);
            return;
        }
        this.close();
    }

    /**
     * ¿Deja pasar este nodo sus propias puertas?
     *
     * Si el planificador no esta cargado, o no sabe juzgar una condicion, se deja
     * pasar: es preferible enseñar un dialogo de mas que dejar a un vecino mudo por
     * algo que no sabemos evaluar.
     */
    _nodoPermitido(n, charId) {
        // `EggConvo` ES UNA PUERTA, no una charla mas.
        //
        // Son las pistas de la busqueda de huevos: el vecino dice si estas cerca o lejos
        // segun `DistanceCheck`, y `eggTimes` compara cuantos llevas contra `eggValue`.
        // 153 de las 154 no tienen ninguna salida: son una frase suelta. Sin busqueda en
        // marcha no encajan NINGUNA, y hasta ahora se podian sortear en cualquier momento,
        // asi que un vecino podia soltar «¡caliente, caliente!» un martes de octubre.
        if (n && n.typ === 'Egg Convo' && !this._huevoPermitido(n)) return false;

        const A = window.Activities;
        if (!A || typeof A.nodoValido !== 'function') return true;
        const p = window.app && window.app.parser;
        const reloj = (p && typeof p.getClock === 'function') ? p.getClock() : null;
        try { return A.nodoValido(n, reloj, charId); }
        catch (e) { return true; }
    }

    /**
     * Enciende las condiciones que trae el nodo en `ful`.
     *
     * Es la otra mitad del sistema de condiciones: `NPCCondition.Fulfilled()` solo
     * comprueba si ya existe un `conditionSave`, y quien los crea son los nodos de
     * dialogo con `fulfillConditions`. Los indices salen de tools/build_dialogues.py
     * y su significado de data/npc_conditions.json.
     */
    _dispararCondiciones(node) {
        if (!node || !node.ful || !node.ful.length) return;
        const p = window.app && window.app.parser;
        if (!p || typeof p.fulfillNPCCondition !== 'function') return;
        const charId = this.currentChar ? this.currentChar.id : null;
        if (charId == null) return;

        const ahora = (Date.now() / 86400000) + 25569;
        for (const cond of node.ful) {
            let r = null;
            try { r = p.fulfillNPCCondition(charId, cond, ahora); }
            catch (e) { console.warn('[Dialogue] no se pudo encender la condicion', cond, e); }
            if (!r) continue;
            const nombre = (window.NPCSystem && typeof window.NPCSystem.nombreCondicion === 'function')
                ? window.NPCSystem.nombreCondicion(charId, cond) : ('#' + cond);
            if (window.app && window.app.showToast) {
                window.app.showToast('✓ ' + nombre + (r.creada ? '' : ' (x' + r.level + ')'), 'success');
            }
        }
    }

    _enterNode(i) {
        this._trasLinea = null;
        this.graph_prevIdx = this.nodeIdx;
        this.nodeIdx = i;
        const node = this.graph.n[i];
        this._dispararCondiciones(node);

        // Nodos especiales. El `typ` lo trae el compacto; lo que LLEVAN dentro lo trae
        // `data/dialogue_payloads.json` (ver `dialogue_payloads.js`).
        if (node && node.typ) this._nodoEspecial(node, i);

        this.currentConvo = this._convoFromNode(node);
        this.currentLineIndex = 0;
        if (this.optionsEl) { this.optionsEl.style.display = 'none'; this.optionsEl.innerHTML = ''; }
        if (this.nameEl) {
            this.nameEl.innerText = this.currentConvo.kind === 'r'
                ? 'Tsuki' : (this.currentChar ? this.currentChar.name : 'NPC');
        }
        this._renderCurrentLine();
    }

    /**
     * Un nodo especial del diálogo.
     *
     * ANTES ESTO SE INVENTABA. `_handleGiftNode` daba **50 zanahorias fijas** a todo el
     * mundo, porque el compacto guarda el `typ` del nodo pero no lo que lleva dentro. Ya
     * lo lleva: `DialogueGift.giftItem` trae `ID`, `quantity` e `invType`, y son 83
     * regalos de verdad — 46 objetos y 37 muebles —.
     *
     * Lo que sigue sin manejarse se dice en la consola con su nombre, en vez de hacer algo
     * parecido: `EggConvo` (159), `DialogueRequest` (66), `ConvoAd` (13), `ParcelConvo`,
     * `SellConvo` y `TextFieldNode`. Están medidos en LOGICAS_PENDIENTES.md.
     */
    _nodoEspecial(node, i) {
        if (node.typ === 'Dialogue Gift') { this._regalar(i); return; }
        // Las que piden algo al jugador NO se resuelven aqui: el vecino tiene que decir
        // sus lineas primero. Se recogen en `_goToNextNode`, con `_interaccionEspecial`.
        if (INTERACTIVOS.has(node.typ)) return;
        // `Egg Convo` es una PUERTA, no una accion: la juzga `_nodoPermitido`.
        if (node.typ === 'Egg Convo') return;
        // `DeedConvo` es lo UNICO que abre el `DeedPopup` en todo el juego: un solo nodo,
        // en el grafo «Katy (Real Estate)».
        if (node.typ === 'Deed Convo') {
            if (window.PlayPopups && typeof window.PlayPopups.escritura === 'function') {
                window.PlayPopups.escritura({});
            }
            return;
        }
        if (window.console && console.debug) {
            console.debug('[dialogo] nodo «' + node.typ + '» sin manejar todavía');
        }
    }

    /** `DialogueGift`: el objeto que regala el nodo, a la mochila y a la ventana. */
    _regalar(i) {
        const P = window.DialoguePayloads;
        const regalo = (P && this.graph) ? P.regaloDe(this.graph, i) : null;
        if (!regalo) {
            // Un `DialogueGift` sin objeto: hay dos en todo el juego. No se rellena con
            // nada, que es justo lo que hacia el codigo de antes.
            return;
        }
        const p = (window.app && window.app.parser)
            || window.currentSaveParser || window._currentParser;
        let puesto = false;
        try {
            if (p && typeof p.injectInventoryItem === 'function') {
                p.injectInventoryItem(regalo.id, regalo.cantidad, false, regalo.invType);
                puesto = true;
            }
        } catch (e) { console.warn('[dialogo] no se pudo dar el regalo:', e); }

        // `GiftboxPopup`, que es la ventana con la que el juego entrega esto.
        if (window.PlayPopups && typeof window.PlayPopups.regalo === 'function') {
            window.PlayPopups.regalo([regalo.id]);
        }
        if (!puesto && window.app && window.app.showToast) {
            window.app.showToast('No se pudo guardar el regalo en la mochila.', 'error');
        }
    }

    // ── Las cinco que piden algo ────────────────────────────────────────────

    /**
     * Ofrece botones que NO son nodos del grafo.
     *
     * `_renderChoices` sirve para las respuestas de verdad, que son nodos `r`. Estas son
     * acciones —aceptar, rechazar, ver el anuncio—, asi que se dibujan igual pero con su
     * propia funcion. Se reaprovecha `optionsEl` para que herede el arte del bocadillo.
     */
    _ofrecerAcciones(opciones) {
        if (!this.optionsEl) { this.close(); return false; }
        if (this.indicatorEl) this.indicatorEl.style.visibility = 'hidden';
        this.optionsEl.innerHTML = '';
        for (const o of opciones) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'dialogue-option-btn';
            btn.innerText = '▸ ' + o.texto;
            if (o.desactivado) {
                btn.disabled = true;
                btn.style.opacity = '.45';
                btn.style.cursor = 'default';
                if (o.motivo) btn.title = o.motivo;
            }
            btn.onclick = (e) => {
                e.stopPropagation();
                if (o.desactivado) return;
                if (window.PlaySfx) window.PlaySfx.sonar('select');
                this.optionsEl.style.display = 'none';
                this.optionsEl.innerHTML = '';
                o.hacer();
            };
            this.optionsEl.appendChild(btn);
        }
        this.optionsEl.style.display = 'flex';
        return true;
    }

    /** Sigue por donde siga el nodo, o cierra si no sigue. */
    _seguir() {
        this._yaResuelto = true;
        const g = this.graph;
        const cur = g && g.n[this.nodeIdx];
        const to = (cur && cur.to) ? cur.to.filter(i => g.n[i]) : [];
        if (!to.length) { this.close(); return; }
        this._enterNode(to[0]);
    }

    /** Una linea suelta del propio nodo, sin salir de el. Devuelve a `_seguir`. */
    _decir(txt, despues) {
        if (!txt) { (despues || (() => this._seguir()))(); return; }
        this.currentConvo = { name: 'Conversation', lines: [{ sp: txt, en: txt }], kind: 'c' };
        this.currentLineIndex = 0;
        this._trasLinea = despues || (() => this._seguir());
        this._renderCurrentLine();
    }

    /** El despachador de lo que se ofrece al acabar las lineas. */
    _interaccionEspecial(node, i) {
        switch (node.typ) {
            case 'Dialogue Request': return this._pedir(i);
            case 'Convo Ad':         return this._anuncio(i);
            case 'Sell Convo':       return this._vender(i);
            case 'Parcel Convo':     return this._paquete(i);
            case 'Text Field':       return this._escribir(i);
            default:                 return false;
        }
    }

    /** Cuantos de un objeto lleva Tsuki encima. */
    _cuantosLleva(id, invType) {
        const p = (window.app && window.app.parser)
            || window.currentSaveParser || window._currentParser;
        if (!p || !p.inventory) return 0;
        return p.inventory
            .filter(x => Number(x.item_id) === Number(id)
                      && (invType == null || Number(x.invType) === Number(invType)))
            .reduce((a, x) => a + (Number(x.qty) || 0), 0);
    }

    /**
     * `DialogueRequest`: el vecino te pide objetos.
     *
     * Los 66 traen texto de aceptar; solo siete el de rechazar, asi que el resto usa uno
     * generico. Aceptar SOLO se puede con los objetos encima —`Check()` es lo que en el
     * juego decide si el nodo se puede siquiera sortear—, y al aceptar se descuentan.
     */
    _pedir(i) {
        const P = window.DialoguePayloads;
        const d = (P && this.graph) ? P.pedidoDe(this.graph, i) : null;
        if (!d) return false;
        const p = (window.app && window.app.parser)
            || window.currentSaveParser || window._currentParser;

        const falta = d.objetos.filter(o => this._cuantosLleva(o.id, o.invType) < o.cantidad);
        const lista = d.objetos.map(o => this._nombreObjeto(o.id) + (o.cantidad > 1
            ? ' \u00d7' + o.cantidad : '')).join(', ');

        const aceptar = P.texto(d.aceptar, this.currentLang) || 'Aqu\u00ed tienes.';
        const rechazar = P.texto(d.rechazar, this.currentLang) || 'Ahora no.';

        return this._ofrecerAcciones([
            {
                texto: aceptar,
                desactivado: falta.length > 0,
                motivo: falta.length ? ('Te falta: ' + lista) : '',
                hacer: () => {
                    let ok = true;
                    for (const o of d.objetos) {
                        try { ok = p.deductInventoryItem(o.id, o.cantidad) && ok; }
                        catch (e) { ok = false; }
                    }
                    if (window.app && window.app.refreshAll) window.app.refreshAll();
                    this._decir(ok ? ('Le das ' + lista + '.')
                                   : 'No se pudo entregar.', () => this._seguir());
                },
            },
            { texto: rechazar, hacer: () => this.close() },
        ]);
    }

    /**
     * `ConvoAd`: el anuncio que paga.
     *
     * En el juego es un anuncio con recompensa: se ve y se cobra `carrotReward` —800 en
     * nueve de los trece, 1200 en tres y 10 en uno—. El port no tiene ningun proveedor de
     * anuncios, asi que se ofrece la eleccion y se paga, y se DICE que el anuncio no se
     * reproduce en vez de hacer como que se ha visto uno.
     */
    _anuncio(i) {
        const P = window.DialoguePayloads;
        const d = (P && this.graph) ? P.anuncioDe(this.graph, i) : null;
        if (!d || !d.zanahorias) return false;
        const p = (window.app && window.app.parser)
            || window.currentSaveParser || window._currentParser;
        return this._ofrecerAcciones([
            {
                texto: 'Ver el anuncio (+' + d.zanahorias + ' \ud83e\udd55)',
                hacer: () => {
                    try { if (p && p.addCarrots) p.addCarrots(d.zanahorias); } catch (e) {}
                    if (window.app && window.app.refreshAll) window.app.refreshAll();
                    this._decir('+' + d.zanahorias + ' zanahorias. (En el juego esto es un '
                        + 'anuncio con recompensa; el port no lo reproduce.)',
                        () => this._seguir());
                },
            },
            { texto: 'Paso', hacer: () => this.close() },
        ]);
    }

    /**
     * `SellConvo`: el vecino te compra lo que lleves.
     *
     * `valuation` trae el `{0}` del importe. Y el importe es el PRECIO ENTERO: no existe
     * ningun `SellPrice` en el juego, `SellConvo.<Run>d__6::MoveNext` no parte por dos y
     * `CropSlot::get_Value` es `quantity * item.Price` y se acaba (sección J).
     *
     * Solo hay dos nodos de estos —Yori y Elfie— y los dos tienen DOS salidas, asi que
     * aqui si se ramifica: aceptar va por la primera y rechazar por la segunda.
     */
    _vender(i) {
        const P = window.DialoguePayloads;
        const d = (P && this.graph) ? P.ventaDe(this.graph, i) : null;
        if (!d) return false;
        const p = (window.app && window.app.parser)
            || window.currentSaveParser || window._currentParser;
        if (!p || !p.inventory) return false;

        // EL PRECIO ES EL ENTERO, Y AHORA HAY TABLA.
        //
        // `BaseItem.price` sale de `data/item_data.json` (2.314 con precio). No existe
        // ningun `SellPrice` en el juego: `SellConvo.<Run>d__6::MoveNext` no parte por dos
        // y `CropSlot::get_Value` es `quantity * item.Price` y se acaba (seccion J).
        const total0 = window.precioDeItem || null;
        let total = 0, tasados = 0, sinPrecio = 0;
        for (const x of p.inventory) {
            const id = Number(x.item_id), q = Number(x.qty) || 0;
            if (!(id > 0 && q > 0)) continue;
            const precio = total0 ? total0(id) : 0;
            if (precio) { total += precio * q; tasados++; } else { sinPrecio++; }
        }
        if (!tasados && !sinPrecio) return false;

        const g = this.graph;
        const to = (g.n[i].to || []).filter(k => g.n[k]);
        const tasacion = (P.lineaTexto(d.tasacion, this.currentLang)
            || 'Puedo pagarte {0} zanahorias por eso.').replace('{0}', String(total));
        const aceptar = P.texto(d.aceptar, this.currentLang) || '\u00a1Vendido!';
        const rechazar = P.texto(d.rechazar, this.currentLang) || 'Mejor no.';

        // El total es de TODO lo que lleva, no de lo que va a vender: en el juego
        // `GetValue` recibe los huecos YA elegidos, y aqui se elige despues. Se dice, para
        // que la cifra no enganye.
        this._decir(tasacion + ' (es el total de todo lo que llevas; al aceptar eliges qué'
            + ' vender' + (sinPrecio ? ', y ' + sinPrecio + ' objetos no tienen precio '
            + 'extraído' : '') + '.)', () => {
            this._ofrecerAcciones([
                {
                    texto: aceptar,
                    hacer: () => {
                        // El jugador ELIGE: `GetValue` recibe los huecos elegidos, no la
                        // mochila entera. El cajon del port es el que ya hace eso.
                        this._yaResuelto = true;
                        const B = window.BubbleSystem;
                        const c = this.currentChar || {};
                        if (B && typeof B.openSellDrawer === 'function') {
                            this.close();
                            B.openSellDrawer(c.id, c.name);
                            return;
                        }
                        if (to[0] != null) this._enterNode(to[0]); else this.close();
                    },
                },
                {
                    texto: rechazar,
                    hacer: () => {
                        this._yaResuelto = true;
                        if (to[1] != null) this._enterNode(to[1]); else this.close();
                    },
                },
            ]);
        });
        return true;
    }

    /**
     * `ParcelConvo`: entregarle un paquete.
     *
     * Tres lineas: `correct` si el paquete es suyo, `wrong` si no, `dismissed` si lo
     * dejas. Solo hay dos nodos, en Ophelia y Phyllis, y ninguno tiene salida: la charla
     * acaba ahi.
     */
    _paquete(i) {
        const P = window.DialoguePayloads;
        const d = (P && this.graph) ? P.paqueteDe(this.graph, i) : null;
        if (!d) return false;
        const M = window.PlayMail;
        let cartas = [];
        try { cartas = (M && M.cartas) ? (M.cartas() || []) : []; } catch (e) { cartas = []; }
        const sinAbrir = cartas.filter(c => !c.opened);

        const opciones = [];
        if (sinAbrir.length) {
            opciones.push({
                texto: 'Entregarle el paquete',
                hacer: () => this._decir(
                    P.lineaTexto(d.correcto, this.currentLang) || '\u00a1Gracias!',
                    () => this._seguir()),
            });
        } else {
            opciones.push({
                texto: 'No llevas ning\u00fan paquete',
                desactivado: true,
                motivo: 'El buz\u00f3n no tiene nada sin abrir',
                hacer: () => {},
            });
        }
        opciones.push({
            texto: 'Dejarlo',
            hacer: () => this._decir(
                P.lineaTexto(d.dejado, this.currentLang) || '\u00bfNo era para m\u00ed?',
                () => this.close()),
        });
        return this._ofrecerAcciones(opciones);
    }

    /**
     * `TextFieldNode`: ponerle un nombre.
     *
     * `playerString` es la clave dentro de `TsukiSave.PlayerStrings`
     * (`Dictionary<int, string>`). Los dos que hay estan en «Bobo Gecko Intro» y usan la
     * clave 0: es el nombre del geco.
     *
     * OJO: `parser.setPlayerString` es un HUECO —devuelve `false` sin escribir nada—, asi
     * que el nombre se recuerda en la sesion y se dice que no se guarda. Inventar una
     * escritura en el diccionario de Odin sin saber su forma es peor que no guardarlo.
     */
    _escribir(i) {
        const P = window.DialoguePayloads;
        const d = (P && this.graph) ? P.campoTextoDe(this.graph, i) : null;
        if (!d) return false;
        if (!this.optionsEl) return false;
        const p = (window.app && window.app.parser)
            || window.currentSaveParser || window._currentParser;

        let previo = '';
        try {
            const todos = (p && p.getPlayerStrings) ? p.getPlayerStrings() : {};
            previo = todos[String(d.clave)] || todos[d.clave] || '';
        } catch (e) { previo = ''; }

        if (this.indicatorEl) this.indicatorEl.style.visibility = 'hidden';
        this.optionsEl.innerHTML = '';
        const caja = document.createElement('input');
        caja.type = 'text';
        caja.maxLength = 24;
        caja.value = previo;
        caja.placeholder = 'Escribe un nombre';
        caja.className = 'dialogue-option-btn';
        caja.style.cssText = 'text-align:center;font-family:inherit';
        const ok = document.createElement('button');
        ok.type = 'button';
        ok.className = 'dialogue-option-btn';
        ok.innerText = '\u25b8 Listo';
        ok.onclick = (e) => {
            e.stopPropagation();
            const v = String(caja.value || '').trim();
            this.optionsEl.style.display = 'none';
            this.optionsEl.innerHTML = '';
            let guardado = false;
            try { guardado = !!(p && p.setPlayerString && p.setPlayerString(d.clave, v)); }
            catch (err) { guardado = false; }
            this._nombresDeSesion = this._nombresDeSesion || {};
            this._nombresDeSesion[d.clave] = v;
            this._decir(guardado ? ('Le pones ' + v + '.')
                : ('Le pones ' + v + '. (Esta partida no trae la clave ' + d.clave
                   + ' en `PlayerStrings`, así que no queda guardado.)'),
                () => this._seguir());
        };
        this.optionsEl.appendChild(caja);
        this.optionsEl.appendChild(ok);
        this.optionsEl.style.display = 'flex';
        setTimeout(() => { try { caja.focus(); } catch (e) {} }, 60);
        return true;
    }

    /**
     * El estado de la busqueda de huevos, para `EggConvo`.
     *
     * `EggConvo.CheckEgg(distancia, huevos)` pide dos cosas, y el port TIENE las dos:
     * `scene_objects.js` coloca los `SeededEgg` con su `eggId` y `SceneObjects.visible()`
     * decide cuales salen hoy — `Egg.AvailableToday` elige 6 de los 13 tipos —.
     *
     * Lo que NO se reproduce es la distancia de verdad: el juego mide cuanto hay del
     * vecino al huevo, y el port no sabe donde esta dibujado cada vecino en cada cuadro.
     * Asi que se queda en `Close` si hay un huevo visible en esta sala y `Far` si la
     * busqueda esta en marcha pero aqui no hay ninguno. Es mas grueso, y se dice.
     *
     * Devuelve `{distancia, huevo}` o `null` si no hay busqueda.
     */
    _estadoHuevo() {
        const SO = window.SceneObjects;
        if (!SO || !SO.datos || typeof SO.de !== 'function') return null;
        const R = window.RoutineScheduler;
        const sala = (R && R.currentSchedule && R.currentSchedule.mapId != null)
            ? Number(R.currentSchedule.mapId) : null;
        const reloj = (window.GameTime && window.GameTime.now) ? window.GameTime.now() : null;

        let aqui = null, hayAlguno = false;
        for (const loc of (sala != null ? [sala] : [])) {
            const lista = SO.de(loc) || [];
            lista.forEach((o, i) => {
                if (!o || o.clase !== 'SeededEgg') return;
                let ve = true;
                try { ve = SO.visible(o, loc, i, reloj); } catch (e) { ve = false; }
                if (!ve) return;
                hayAlguno = true;
                if (aqui == null) aqui = Number(o.eggId) || 0;
            });
        }
        if (aqui != null) return { distancia: 1, huevo: aqui };      // Close
        if (hayAlguno) return { distancia: 2, huevo: 0 };            // Far
        return null;
    }

    /** ¿Deja pasar este `EggConvo` su propia comprobacion? */
    _huevoPermitido(n) {
        const e = this._estadoHuevo();
        if (!e) return false;                 // sin busqueda, estas 154 lineas no salen
        const P = window.DialoguePayloads;
        if (!P || !this.graph) return false;
        const h = P.huevoDe(this.graph, this.graph.n.indexOf(n));
        if (!h) return false;
        return P.encajaHuevo(h, e.distancia, e.huevo);
    }

    /** El nombre de un objeto, del catalogo. */
    _nombreObjeto(id) {
        const db = window.ITEMS_DB || {};
        const e = db[String(id)];
        return (e && (e.name_es || e.name_en)) || ('objeto ' + id);
    }

    _renderChoices(indices) {
        if (!this.optionsEl) { this.close(); return; }
        if (this.indicatorEl) this.indicatorEl.style.visibility = 'hidden';
        this.optionsEl.innerHTML = '';
        indices.forEach(i => {
            const node = this.graph.n[i];
            const line = (node.l && node.l[0]) || {};
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'dialogue-option-btn';
            btn.innerText = '▸ ' + this._textOf(line);
            btn.onclick = (e) => {
                e.stopPropagation();
                // `SFXClip.Select`: elegir una respuesta. Trae cooldown propio (0,05 s),
                // que es justo lo que evita el doble disparo de un toque nervioso.
                if (window.PlaySfx) window.PlaySfx.sonar('select');
                this._enterNode(i);
            };
            this.optionsEl.appendChild(btn);
        });
        this.optionsEl.style.display = 'flex';
    }

    advance() {
        if (!this.isOpen) return;
        // Con opciones en pantalla hay que elegir: un click suelto no debe avanzar
        if (this.optionsEl && this.optionsEl.style.display !== 'none' && this.optionsEl.children.length) return;

        // If currently typing, complete the line instantly
        if (this.isTyping) {
            if (this.typewriterTimer) clearInterval(this.typewriterTimer);
            this.typewriterTimer = null;
            this.isTyping = false;
            if (this.textEl) this.textEl.innerText = this.fullCurrentText;
            if (this.indicatorEl) this.indicatorEl.style.visibility = 'visible';
            return;
        }

        // Advance to next line
        this.currentLineIndex++;
        if (this.currentConvo && this.currentConvo.lines && this.currentLineIndex < this.currentConvo.lines.length) {
            this._renderCurrentLine();
        } else if (this.graph) {
            this._goToNextNode();
        } else {
            this.close();
        }
    }

    close() {
        // `SFXClip.DialoguePoof`: la nube con la que se va el bocadillo.
        if (this.isOpen && window.PlaySfx) window.PlaySfx.sonar('dialoguePoof');
        if (this.typewriterTimer) clearInterval(this.typewriterTimer);
        this.typewriterTimer = null;
        this.isOpen = false;
        this._trasLinea = null;
        this._yaResuelto = false;
        this.currentConvo = null;
        this.graph = null;
        this.nodeIdx = -1;
        if (this.optionsEl) { this.optionsEl.style.display = 'none'; this.optionsEl.innerHTML = ''; }
        if (this.overlay) this.overlay.style.display = 'none';
    }

    /**
     * Devuelve todos los grafos disponibles para un NPC
     */
    getNpcGraphs(charId) {
        if (!this.dialogues) return [];
        const idNum = parseInt(charId, 10);
        const npcData = this.dialogues[idNum] || this.dialogues[String(idNum)];
        return (npcData && npcData.graphs) ? npcData.graphs : [];
    }

    /**
     * Dispara un grafo de conversación específico por su nombre o índice
     */
    playGraph(charId, graphNameOrIndex) {
        if (!this.overlay) this.init();
        if (!this.dialogues) {
            this._loadDialogues().then(() => this.playGraph(charId, graphNameOrIndex));
            return;
        }

        const idNum = parseInt(charId, 10);
        const npcData = this.dialogues[idNum] || this.dialogues[String(idNum)];
        if (!npcData || !npcData.graphs || !npcData.graphs.length) {
            console.warn(`[DialogueManager] No hay grafos para NPC ${charId}`);
            return;
        }

        let g = null;
        if (typeof graphNameOrIndex === 'number') {
            g = npcData.graphs[graphNameOrIndex] || npcData.graphs[0];
        } else {
            g = npcData.graphs.find(gr => gr.g === graphNameOrIndex) || npcData.graphs[0];
        }

        if (!g || !g.n || !g.n.length) return;

        this.graph = g;
        const s0 = (g.s && g.s.length) ? g.s[0] : 0;
        this.nodeIdx = s0;
        const convo = this._convoFromNode(g.n[s0]);

        this.currentConvo = convo;
        this.currentLineIndex = 0;
        this.currentChar = { id: idNum, name: npcData.name || 'NPC' };
        this._dispararCondiciones(g.n[s0]);

        if (this.nameEl) this.nameEl.innerText = this.currentChar.name;
        this._updatePortrait(this.currentChar.name, this.currentChar.id);

        this.isOpen = true;
        this.overlay.style.display = '';
        this._renderCurrentLine();
    }
}

// Global instance
window.DialogueManager = new DialogueManager();
document.addEventListener('DOMContentLoaded', () => {
    window.DialogueManager.init();
});
