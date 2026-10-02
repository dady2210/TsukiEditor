/**
 * bubble_system.js - Motor de Burbujas Flotantes de Interacción (SBubbleData)
 * Reproduce fielmente las burbujas interactivas de Tsuki's Odyssey:
 * 💬 TalkBubble (Hablar con el NPC)
 * 💰 SellStuff (Vender artículos a comerciantes por zanahorias)
 * 📜 SeeDeeds (Planos y ampliaciones del hogar con Benny)
 * 🎁 GiveParcel (Entregar cartas o paquetes de entrega)
 */

(function () {
    'use strict';

    class BubbleSystem {
        constructor() {
            this.container = null;
            this.activeBubbles = [];
            this.currentNpc = null;
            this.autoCloseTimer = null;

            // Determinar prefijo según si se carga en la raíz (Play Mode) o en /data/HERRAMIENTAS/ (Map Editor)
            const prefix = (typeof window !== 'undefined' && window.location.pathname.includes('/HERRAMIENTAS/')) ? '../../' : '';

            // Audio effects nativos
            this.soundOpen = new Audio(prefix + 'sounds/effects/dialogueBubbleOpen.wav');
            this.soundPoof = new Audio(prefix + 'sounds/effects/dialoguePoof.wav');
            this.soundSell = new Audio(prefix + 'sounds/effects/sell.wav');
            this.soundOpen.volume = 0.6;
            this.soundPoof.volume = 0.6;
            this.soundSell.volume = 0.7;

            // NPCs especiales
            // QUIEN SACA CADA BURBUJA, SEGUN LOS DATOS Y NO A OJO.
            //
            // `SellConvo` aparece en DOS grafos de todo el juego: Yori y Elfie. El
            // conjunto de antes -{1,4,5,9,16}- metia ademas a Pipi, Rosemary y Paige, que
            // no tienen ninguno, y por eso salia el menu al tocarlas.
            this.SHOPKEEPERS = new Set([1, 5]);               // Yori, Elfie
            this.MAYORS = new Set([7]);                        // Benny, «Benny Tree Expansion»
            // `ParcelConvo`, tambien dos: Ophelia y Phyllis. Antes el paquete se le podia
            // entregar a cualquiera.
            this.PARCEL_NPCS = new Set([27, 29]);              // Ophelia, Phyllis
        }

        init() {
            if (document.getElementById('tsuki-bubble-container')) return;

            const container = document.createElement('div');
            container.id = 'tsuki-bubble-container';
            container.style.position = 'fixed';
            container.style.inset = '0';
            container.style.pointerEvents = 'none';
            container.style.zIndex = '99990';
            document.body.appendChild(container);
            this.container = container;

            this._injectStyles();
            this._bindGlobalEvents();
        }

        _injectStyles() {
            if (document.getElementById('tsuki-bubble-styles')) return;
            const style = document.createElement('style');
            style.id = 'tsuki-bubble-styles';
            style.textContent = `
                .tsuki-bubble-cluster {
                    position: absolute;
                    display: flex;
                    gap: 10px;
                    align-items: center;
                    justify-content: center;
                    transform: translate(-50%, -100%);
                    pointer-events: auto;
                    filter: drop-shadow(0 6px 12px rgba(0,0,0,0.55));
                    animation: bubbleSpawn 0.28s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
                }
                @keyframes bubbleSpawn {
                    0% { transform: translate(-50%, -80%) scale(0.2); opacity: 0; }
                    70% { transform: translate(-50%, -105%) scale(1.12); opacity: 1; }
                    100% { transform: translate(-50%, -100%) scale(1); opacity: 1; }
                }
                .tsuki-bubble-cluster.poofing {
                    animation: bubblePoof 0.18s ease-out forwards;
                }
                @keyframes bubblePoof {
                    0% { transform: translate(-50%, -100%) scale(1); opacity: 1; }
                    50% { transform: translate(-50%, -110%) scale(1.2); opacity: 0.8; }
                    100% { transform: translate(-50%, -120%) scale(0.1); opacity: 0; }
                }
                .tsuki-bubble-btn {
                    width: 48px;
                    height: 48px;
                    border-radius: 50%;
                    background: radial-gradient(circle at 35% 35%, #381b52 0%, #1c0e2a 100%);
                    border: 2.5px solid #a855f7;
                    color: #fff;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 22px;
                    cursor: pointer;
                    user-select: none;
                    box-shadow: 0 4px 10px rgba(0,0,0,0.6), inset 0 0 8px rgba(168,85,247,0.4);
                    transition: transform 0.15s ease, border-color 0.15s ease, background 0.15s ease;
                    position: relative;
                }
                .tsuki-bubble-btn:hover {
                    transform: scale(1.14) translateY(-3px);
                    border-color: #facc15;
                    background: radial-gradient(circle at 35% 35%, #581c87 0%, #2e1065 100%);
                    box-shadow: 0 6px 16px rgba(250,204,21,0.45);
                }
                .tsuki-bubble-btn:active {
                    transform: scale(0.95);
                }
                .tsuki-bubble-tail {
                    position: absolute;
                    bottom: -8px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 0;
                    height: 0;
                    border-left: 7px solid transparent;
                    border-right: 7px solid transparent;
                    border-top: 8px solid #a855f7;
                }
                .tsuki-bubble-badge {
                    position: absolute;
                    top: -4px;
                    right: -4px;
                    background: #e11d48;
                    color: #fff;
                    border-radius: 10px;
                    font-size: 9px;
                    font-weight: bold;
                    padding: 1px 5px;
                    border: 1px solid #fff;
                }
                /* Modal de Venta para Comerciantes (SellStuff) */
                #tsuki-sell-modal {
                    position: fixed;
                    inset: 0;
                    background: rgba(0,0,0,0.78);
                    z-index: 99999;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    backdrop-filter: blur(4px);
                    user-select: none;
                    animation: fadeIn 0.2s ease-out;
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .tsuki-sell-box {
                    background: #1e1e2e;
                    border: 2px solid #581c87;
                    border-radius: 16px;
                    width: min(580px, 94vw);
                    max-height: 84vh;
                    box-shadow: 0 12px 36px rgba(0,0,0,0.85);
                    color: #f3f4f6;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                }
                .tsuki-sell-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 14px 18px;
                    background: #2a1b3d;
                    border-bottom: 1px solid #4c1d95;
                }
                .tsuki-sell-body {
                    padding: 14px;
                    overflow-y: auto;
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(95px, 1fr));
                    gap: 10px;
                    max-height: 52vh;
                }
                .tsuki-sell-item-card {
                    background: #262338;
                    border: 1px solid #474360;
                    border-radius: 10px;
                    padding: 8px 6px;
                    text-align: center;
                    cursor: pointer;
                    position: relative;
                    transition: transform 0.12s, border-color 0.12s, background 0.12s;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: space-between;
                }
                .tsuki-sell-item-card:hover {
                    border-color: #22c55e;
                    transform: translateY(-3px);
                    background: #332d4d;
                    box-shadow: 0 4px 12px rgba(34,197,94,0.25);
                }
                .tsuki-sell-item-icon {
                    width: 44px;
                    height: 44px;
                    object-fit: contain;
                    margin-bottom: 4px;
                }
                .tsuki-sell-item-qty {
                    position: absolute;
                    top: 4px;
                    right: 6px;
                    background: #3b82f6;
                    color: #fff;
                    font-size: 9px;
                    font-weight: bold;
                    padding: 1px 4px;
                    border-radius: 6px;
                }
                .tsuki-sell-item-name {
                    font-size: 10.5px;
                    font-weight: bold;
                    color: #e2e8f0;
                    line-height: 1.2;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                    margin-bottom: 4px;
                }
                .tsuki-sell-item-price {
                    font-size: 11px;
                    font-weight: bold;
                    color: #facc15;
                }
            `;
            document.head.appendChild(style);
        }

        _bindGlobalEvents() {
            // Clic en cualquier parte fuera de las burbujas las cierra limpiamente
            window.addEventListener('pointerdown', (e) => {
                if (!this.currentNpc) return;
                if (e.target.closest('.tsuki-bubble-cluster') || e.target.closest('.tsuki-dialogue-box') || e.target.closest('#tsuki-sell-modal')) {
                    return;
                }
                this.closeBubbles();
            });
        }

        /**
         * Muestra el racimo de burbujas sobre un NPC en pantalla
         * @param {Object} opts { npcId, npcName, screenX, screenY, customActions }
         */
        showBubbles(opts) {
            if (!this.container) this.init();
            this.closeBubbles(false);

            const { npcId, npcName, screenX, screenY, customActions } = opts;
            this.currentNpc = { npcId, npcName, screenX, screenY };

            // Determinar acciones disponibles según el NPC
            const actions = customActions || this.getAvailableActions(npcId);
            if (!actions || actions.length === 0) return;

            // UNA SOLA ACCION SE HACE, NO SE OFRECE.
            //
            // `CastleObject` tiene `CanQuickTap` / `QuickTap`: cuando con algo solo se
            // puede hacer una cosa, tocarlo la hace. El menu radial -`BubbleUI.TrySelect`
            // -> `SelectableBubbles`- es para cuando hay varias. El port abria el menu
            // SIEMPRE, asi que tocar a un vecino sacaba una burbuja de «Hablar» en vez de
            // hablar. Los de tienda, que tienen «Vender» ademas de «Hablar», siguen
            // sacando su abanico.
            if (actions.length === 1) {
                actions[0].onClick(npcId, npcName);
                return;
            }
            // `SFXClip.DialogueBubbleOpen`: el sonido de que se abre el abanico de
            // acciones. Va aqui y no arriba porque sin acciones no se abre nada.
            if (window.PlaySfx) {
                window.PlaySfx.sonar('dialogueBubbleOpen');
                // `SFXClip.BubbleUI`: el abanico al desplegarse.
                window.PlaySfx.sonar('bubbleUI');
            }

            const cluster = document.createElement('div');
            cluster.className = 'tsuki-bubble-cluster';
            cluster.style.left = `${screenX}px`;
            cluster.style.top = `${screenY}px`;

            actions.forEach(act => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'tsuki-bubble-btn';
                btn.title = act.label;
                btn.innerHTML = act.icon;

                if (act.badge) {
                    const b = document.createElement('span');
                    b.className = 'tsuki-bubble-badge';
                    b.innerText = act.badge;
                    btn.appendChild(b);
                }

                btn.onclick = (e) => {
                    e.stopPropagation();
                    this._playPoofSound();
                    cluster.classList.add('poofing');
                    setTimeout(() => {
                        this.closeBubbles(false);
                        act.onClick(npcId, npcName);
                    }, 140);
                };

                cluster.appendChild(btn);
            });

            // Cola señaladora apuntando al personaje
            const tail = document.createElement('div');
            tail.className = 'tsuki-bubble-tail';
            cluster.appendChild(tail);

            this.container.appendChild(cluster);
            this.activeBubbles.push(cluster);

            this._playOpenSound();
        }

        getAvailableActions(npcId) {
            const id = parseInt(npcId, 10);
            const actions = [];

            // 1. Hablar (💬 TalkBubble)
            actions.push({
                type: 'talk',
                icon: '💬',
                label: 'Hablar',
                onClick: (id, name) => {
                    if (window.DialogueManager) {
                        window.DialogueManager.startDialogue(id, name);
                    }
                }
            });

            // 2. Vender (💰 SellStuff) para comerciantes
            if (this.SHOPKEEPERS.has(id)) {
                actions.push({
                    type: 'sell',
                    icon: '💰',
                    label: 'Vender Objetos',
                    onClick: (id, name) => {
                        this.openSellDrawer(id, name);
                    }
                });
            }

            // 3. Planos / Escrituras (📜 SeeDeeds) para Benny
            if (this.MAYORS.has(id)) {
                actions.push({
                    type: 'deeds',
                    icon: '📜',
                    label: 'Ampliaciones del Hogar',
                    onClick: (id, name) => {
                        this.openDeedsModal(id, name);
                    }
                });
            }

            // 4. Entregar Paquete / Carta (🎁 GiveParcel) si hay pedidos pendientes
            const p = (window.app && window.app.parser) || window.currentSaveParser || window._currentParser;
            if (this.PARCEL_NPCS.has(id) && p && typeof p.getLetterOrderMeta === 'function') {
                const meta = p.getLetterOrderMeta();
                if (meta && meta.lastOrders && meta.lastOrders.length > 0) {
                    actions.push({
                        type: 'parcel',
                        icon: '🎁',
                        label: 'Entregar Paquete',
                        badge: '1',
                        onClick: (id, name) => {
                            this.deliverParcel(id, name);
                        }
                    });
                }
            }

            return actions;
        }

        closeBubbles(animate = true) {
            if (!this.activeBubbles.length) return;
            if (animate) this._playPoofSound();

            this.activeBubbles.forEach(c => {
                if (c && c.parentNode) c.parentNode.removeChild(c);
            });
            this.activeBubbles = [];
            this.currentNpc = null;
        }

        _playOpenSound() {
            try {
                this.soundOpen.currentTime = 0;
                this.soundOpen.play().catch(() => {});
            } catch (e) {}
        }

        _playPoofSound() {
            // `SFXClip.Poof` y `Bubblepop`: los del juego, ademas del wav del port.
            if (window.PlaySfx) {
                window.PlaySfx.sonar('poof');
                window.PlaySfx.sonar('bubblepop');
            }
            try {
                this.soundPoof.currentTime = 0;
                this.soundPoof.play().catch(() => {});
            } catch (e) {}
        }

        _playSellSound() {
            try {
                this.soundSell.currentTime = 0;
                this.soundSell.play().catch(() => {});
            } catch (e) {}
        }

        /**
         * Obtiene la lista de ítems vendibles del inventario activo
         */
        getInventoryItemsForSell() {
            const p = (window.app && window.app.parser) || window.currentSaveParser || window._currentParser;
            if (!p || !p.inventory || !Array.isArray(p.inventory)) return [];

            const prefix = (typeof window !== 'undefined' && window.location.pathname.includes('/HERRAMIENTAS/')) ? '../../' : '';
            const typeMap = { 0: "ITEM", 1: "FURN", 2: "CROP", 3: "FISH" };

            const list = [];
            p.inventory.forEach((slot, index) => {
                if (!slot || slot.item_id <= 0 || slot.qty <= 0) return;

                const db = (window.ITEMS_DB && window.ITEMS_DB[String(slot.item_id)]) || {};
                let name = db.name_es || db.item_name || db.furn_name || '';
                if (!name && window.app && typeof window.app.resolveItemName === 'function') {
                    name = window.app.resolveItemName(slot.item_id, slot.invType);
                }
                if (!name) name = `Ítem #${slot.item_id}`;

                let price = 25;
                if (db.behaviour && db.behaviour.price_sell != null && db.behaviour.price_sell > 0) {
                    price = db.behaviour.price_sell;
                } else if (db.behaviour && db.behaviour.price_shop != null && db.behaviour.price_shop > 0) {
                    price = Math.max(5, Math.floor(db.behaviour.price_shop * 0.5));
                } else {
                    price = Math.max(10, Math.floor((slot.item_id % 120) + 15));
                }

                const typeStr = typeMap[slot.invType] || "ITEM";
                const iconUrl = `${prefix}images/items/${typeStr}_${slot.item_id}.png`;

                list.push({
                    index: index,
                    id: slot.item_id,
                    qty: slot.qty,
                    invType: slot.invType,
                    name: name,
                    price: price,
                    iconUrl: iconUrl
                });
            });

            return list;
        }

        /**
         * Interfaz de Venta a Comerciantes (SellStuff)
         */
        openSellDrawer(npcId, npcName) {
            let modal = document.getElementById('tsuki-sell-modal');
            if (modal) modal.remove();

            modal = document.createElement('div');
            modal.id = 'tsuki-sell-modal';

            const p = (window.app && window.app.parser) || window.currentSaveParser || window._currentParser;
            const items = this.getInventoryItemsForSell();

            const currentCarrots = (p && typeof p.getPlayerCarrots === 'function')
                ? p.getPlayerCarrots()
                : (p && p.generalVars && p.generalVars['carrots'] ? Number(p.generalVars['carrots'].value) : 250);

            modal.innerHTML = `
                <div class="tsuki-sell-box">
                    <div class="tsuki-sell-header">
                        <div style="font-weight:bold; font-size:15px; color:#e9d5ff; display:flex; align-items:center; gap:8px;">
                            <span>💰 Vender a ${npcName || 'Comerciante'}</span>
                        </div>
                        <button type="button" id="btn-close-sell-modal" style="background:transparent; border:none; color:#aaa; font-size:18px; cursor:pointer; padding:2px 8px;">✕</button>
                    </div>
                    <div style="padding:10px 16px; background:#181524; font-size:11.5px; color:#9ca3af; border-bottom:1px solid #333;">
                        Toca un artículo de tu inventario para vendérselo a ${npcName || 'este comerciante'} por zanahorias 🥕.
                    </div>
                    <div class="tsuki-sell-body" id="tsuki-sell-grid">
                        ${items.length === 0 ? `
                            <div style="grid-column:1/-1; text-align:center; padding:35px 20px; color:#888; font-size:12px;">
                                🎒 Tu inventario está vacío o no hay artículos vendibles cargados.
                            </div>
                        ` : ''}
                    </div>
                    <div style="padding:12px 18px; background:#181524; display:flex; justify-content:space-between; align-items:center; border-top:1px solid #333;">
                        <span style="font-size:13px; color:#facc15; font-weight:bold;">
                            🥕 Zanahorias: <span id="tsuki-sell-carrots-num">${currentCarrots}</span>
                        </span>
                        <button type="button" id="btn-done-sell-modal" class="btn" style="background:#4c1d95; color:#fff; border-radius:6px; padding:6px 16px; font-size:12px; cursor:pointer; font-weight:bold;">Cerrar</button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            const grid = document.getElementById('tsuki-sell-grid');
            if (grid && items.length > 0) {
                items.forEach(it => {
                    const card = document.createElement('div');
                    card.className = 'tsuki-sell-item-card';
                    card.innerHTML = `
                        <span class="tsuki-sell-item-qty">x${it.qty}</span>
                        <img src="${it.iconUrl}" class="tsuki-sell-item-icon" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'40\\' height=\\'40\\'><rect fill=\\'%23333\\' width=\\'40\\' height=\\'40\\'/><text x=\\'50%\\' y=\\'55%\\' fill=\\'%23aaa\\' font-size=\\'20\\' text-anchor=\\'middle\\' dominant-baseline=\\'middle\\'>📦</text></svg>'" alt="Icono">
                        <div class="tsuki-sell-item-name" title="${it.name}">${it.name}</div>
                        <div class="tsuki-sell-item-price">+${it.price} 🥕</div>
                    `;
                    card.onclick = () => {
                        this.sellItem(it, card);
                    };
                    grid.appendChild(card);
                });
            }

            const closeSell = () => modal.remove();
            document.getElementById('btn-close-sell-modal').onclick = closeSell;
            document.getElementById('btn-done-sell-modal').onclick = closeSell;
        }

        sellItem(item, cardEl) {
            const p = (window.app && window.app.parser) || window.currentSaveParser || window._currentParser;
            if (!confirm(`¿Vender 1x "${item.name}" por ${item.price} 🥕?`)) return;

            // Reproducir sonido de venta
            this._playSellSound();

            // Descontar inventario
            if (p && typeof p.updateInventoryItem === 'function') {
                if (item.qty > 1) {
                    item.qty -= 1;
                    p.updateInventoryItem('inventory', item.index, item.id, item.qty, item.invType);
                    const qtyBadge = cardEl.querySelector('.tsuki-sell-item-qty');
                    if (qtyBadge) qtyBadge.innerText = `x${item.qty}`;
                } else {
                    p.updateInventoryItem('inventory', item.index, -1, 0, item.invType);
                    cardEl.style.transition = 'all 0.22s ease';
                    cardEl.style.transform = 'scale(0.1)';
                    cardEl.style.opacity = '0';
                    setTimeout(() => cardEl.remove(), 220);
                }
            }

            // Acreditar zanahorias
            let currentCarrots = 0;
            if (p && typeof p.addCarrots === 'function') {
                p.addCarrots(item.price);
                currentCarrots = p.getPlayerCarrots ? p.getPlayerCarrots() : (p.generalVars?.carrots?.value || 0);
            } else if (p && typeof p.addPlayerCarrots === 'function') {
                p.addPlayerCarrots(item.price);
                currentCarrots = p.getPlayerCarrots();
            }

            // Actualizar vista de zanahorias
            const carrotsDisplay = document.getElementById('tsuki-sell-carrots-num');
            if (carrotsDisplay) carrotsDisplay.innerText = currentCarrots;

            if (window.app) {
                if (typeof window.app.renderInventory === 'function') window.app.renderInventory();
                if (typeof window.app.renderGeneralVars === 'function') window.app.renderGeneralVars();
            }

            if (window.showEditorNotification) {
                window.showEditorNotification(`💰 ¡Vendido "${item.name}" por +${item.price} 🥕!`, '#16a34a');
            } else if (window.DialogueManager && typeof window.DialogueManager.showGiftNotification === 'function') {
                window.DialogueManager.showGiftNotification(item.name, `+${item.price} 🥕`);
            }
        }

        /**
         * Interfaz de Escrituras y Ampliaciones de Benny (SeeDeeds)
         */
        openDeedsModal(npcId, npcName) {
            if (window.DialogueManager) {
                window.DialogueManager.playGraph(7, 'Benny Tree Expansion');
            }
        }

        /**
         * Entrega de Paquete / Carta (GiveParcel)
         */
        deliverParcel(npcId, npcName) {
            this._playOpenSound();
            const p = (window.app && window.app.parser) || window.currentSaveParser || window._currentParser;
            if (p && typeof p.addCarrots === 'function') {
                p.addCarrots(250);
            }
            if (window.showEditorNotification) {
                window.showEditorNotification(`🎁 ¡Paquete entregado a ${npcName || 'amigo'}! (+250 🥕)`, '#8b5cf6');
            } else if (window.DialogueManager && typeof window.DialogueManager.showGiftNotification === 'function') {
                window.DialogueManager.showGiftNotification('Paquete Entregado', '+250 🥕');
            }
            if (window.DialogueManager) {
                window.DialogueManager.startDialogue(npcId, npcName);
            }
        }
    }

    window.BubbleSystem = new BubbleSystem();
    document.addEventListener('DOMContentLoaded', () => {
        window.BubbleSystem.init();
    });
})();
