// bounty_system.js - el tablon DE ANTES. Lo ha sustituido `bounty_board.js`.
//
// LOS DATOS DE ESTE FICHERO ESTAN INVENTADOS. La lista `BOUNTY_FISH_POOL` de abajo
// -68 peces con recompensas de 120 a 1000 repartidas en tres niveles- y el LCG por dia
// OA de `generateDailyBounties` no salen de ningun sitio del juego:
//
//   * `BountyBoardSave::RollBounties` (0x58e62d4) sortea con `Random.Range(0, n)` sobre
//     `ValidBountyFish` y SIN REPETICION, no por niveles ni por semilla del dia.
//   * `ValidBountyFish` (0x58e5b0c) son los peces NO legendarios cuyo `waterType` cruza
//     con las aguas desbloqueadas: 104 de los 119, no 68 escritos a mano.
//   * Y el premio es `Fish::get_Price * 5`, con `get_Price = [20,50,120,300][rareza]`
//     (0x5915a48, tabla en 0x11dfe10): o sea 100, 250 o 600. Nunca 1000 ni 145.
//
// Esta todo en `bounty_board.js`, que ademas pinta la ventana de verdad con las texturas
// de `level8`. `scene_objects.js` abre esa y solo cae aqui si no carga. Esto se queda
// como respaldo y para no romper lo que ya lo llamaba.
//
(function() {
    // Pool oficial de peces para el tablón de Benny (excluyendo basura 278..280 y mochilas 123..126)
    const BOUNTY_FISH_POOL = [
        // Comunes / de río / costa básica (120 - 200 zanahorias)
        { id: 63, name_es: "Cangrejo Azul", name_en: "Bluecrab", reward: 150, tier: "common" },
        { id: 70, name_es: "Carpa", name_en: "Carp", reward: 160, tier: "common" },
        { id: 72, name_es: "Cangrejo de Río", name_en: "Crayfish", reward: 140, tier: "common" },
        { id: 81, name_es: "Pez Dorado Común", name_en: "Common Goldfish", reward: 150, tier: "common" },
        { id: 84, name_es: "Guppy", name_en: "Guppy", reward: 125, tier: "common" },
        { id: 86, name_es: "Cangrejo Ermitaño", name_en: "Hermitcrab", reward: 130, tier: "common" },
        { id: 87, name_es: "Arenque", name_en: "Herring", reward: 140, tier: "common" },
        { id: 93, name_es: "Locha", name_en: "Loach", reward: 145, tier: "common" },
        { id: 94, name_es: "Caballa", name_en: "Mackerel", reward: 150, tier: "common" },
        { id: 100, name_es: "Tetra Neón", name_en: "Neon Tetra", reward: 135, tier: "common" },
        { id: 102, name_es: "Perca", name_en: "Perch", reward: 155, tier: "common" },
        { id: 104, name_es: "Caracol de Estanque", name_en: "Pondsnail", reward: 120, tier: "common" },
        { id: 130, name_es: "Piscardo", name_en: "Minnow", reward: 125, tier: "common" },
        { id: 131, name_es: "Tilapia", name_en: "Tilapia", reward: 160, tier: "common" },
        { id: 134, name_es: "Barbo", name_en: "Barb", reward: 145, tier: "common" },

        // Poco comunes / medianos (250 - 450 zanahorias)
        { id: 60, name_es: "Barracuda", name_en: "Barracuda", reward: 300, tier: "uncommon" },
        { id: 61, name_es: "Betta", name_en: "Betta", reward: 280, tier: "uncommon" },
        { id: 62, name_es: "Lubina Negra", name_en: "Black Seabass", reward: 320, tier: "uncommon" },
        { id: 64, name_es: "Cirujano Azul", name_en: "Bluetang", reward: 290, tier: "uncommon" },
        { id: 65, name_es: "Pez Sol", name_en: "Bluegill", reward: 260, tier: "uncommon" },
        { id: 67, name_es: "Bagre de Canal", name_en: "Channel Catfish", reward: 350, tier: "uncommon" },
        { id: 68, name_es: "Pez Payaso", name_en: "Percula Clownfish", reward: 310, tier: "uncommon" },
        { id: 69, name_es: "Bacalao", name_en: "Cod", reward: 280, tier: "uncommon" },
        { id: 75, name_es: "Lenguado", name_en: "Flounder", reward: 340, tier: "uncommon" },
        { id: 77, name_es: "Pez Volador Azul", name_en: "Blue Flying Fish", reward: 380, tier: "uncommon" },
        { id: 90, name_es: "Perca Americana", name_en: "Largemouth Bass", reward: 320, tier: "uncommon" },
        { id: 97, name_es: "Medusa Luna", name_en: "Moon Jellyfish", reward: 350, tier: "uncommon" },
        { id: 106, name_es: "Pargo Rojo", name_en: "Red Snapper", reward: 390, tier: "uncommon" },
        { id: 107, name_es: "Anguila de Río", name_en: "River Eel", reward: 360, tier: "uncommon" },
        { id: 110, name_es: "Salmón", name_en: "Salmon", reward: 400, tier: "uncommon" },
        { id: 129, name_es: "Trucha", name_en: "Trout", reward: 350, tier: "uncommon" },
        { id: 133, name_es: "Pez Lagarto", name_en: "Gar", reward: 380, tier: "uncommon" },

        // Raros / Gigantes (600 - 1000 zanahorias)
        { id: 59, name_es: "Arowana", name_en: "Arrowana", reward: 750, tier: "rare" },
        { id: 78, name_es: "Bagre Gigante", name_en: "Giant Catfish", reward: 800, tier: "rare" },
        { id: 82, name_es: "Mero Goliat", name_en: "Goliath Grouper", reward: 950, tier: "rare" },
        { id: 85, name_es: "Tiburón Martillo", name_en: "Hammerhead Shark", reward: 1000, tier: "rare" },
        { id: 89, name_es: "Koi Kohaku", name_en: "Kohaku Koi", reward: 650, tier: "rare" },
        { id: 96, name_es: "Marlín", name_en: "Marlin", reward: 900, tier: "rare" },
        { id: 98, name_es: "Morena", name_en: "Moray Eel", reward: 700, tier: "rare" },
        { id: 113, name_es: "Koi Shiro-Utsuri", name_en: "Shiro-Utsuri Koi", reward: 680, tier: "rare" },
        { id: 114, name_es: "Koi Showa", name_en: "Showa Koi", reward: 720, tier: "rare" },
        { id: 118, name_es: "Raya Moteada", name_en: "Spotted Ray", reward: 850, tier: "rare" },
        { id: 122, name_es: "Atún", name_en: "Tuna", reward: 800, tier: "rare" },
        { id: 132, name_es: "Anguila Eléctrica", name_en: "Electric Eel", reward: 750, tier: "rare" },
        { id: 135, name_es: "Arapaima", name_en: "Arapaima", reward: 950, tier: "rare" },
        { id: 274, name_es: "Raya Gigante con Púa", name_en: "Giant Stingray", reward: 1000, tier: "rare" },
        { id: 275, name_es: "Pez Luna", name_en: "Mola Sunfish", reward: 900, tier: "rare" },
        { id: 276, name_es: "Pez Pelícano", name_en: "Pelican Eel", reward: 850, tier: "rare" }
    ];

    class BountySystem {
        constructor() {
            this.currentLanguage = 'ES';
            this.currentBounties = [];
            this.currentOaDay = null;
            this.enabled = true;
        }

        init() {
            this._injectModalHTML();
            this._setupEventListeners();
        }

        // Obtiene la información del pez por su ID
        getFishInfo(fishId) {
            const found = BOUNTY_FISH_POOL.find(f => f.id === Number(fishId));
            if (found) return found;

            // Si está en items_db.json
            if (typeof window !== 'undefined' && window.ITEMS_DB && window.ITEMS_DB[String(fishId)]) {
                const item = window.ITEMS_DB[String(fishId)];
                return {
                    id: Number(fishId),
                    name_es: item.name_es || item.item_name || ('Pez #' + fishId),
                    name_en: item.name_en || ('Fish #' + fishId),
                    reward: 200,
                    tier: 'common'
                };
            }

            return {
                id: Number(fishId),
                name_es: 'Pez #' + fishId,
                name_en: 'Fish #' + fishId,
                reward: 200,
                tier: 'common'
            };
        }

        // Genera 3 peces diarios basados en la semilla del día OA
        generateDailyBounties(oaDay) {
            // LCG determinista por día OA
            let seed = ((Number(oaDay) ^ 0x5F158) * 1103515245 + 12345) & 0x7fffffff;
            const nextRand = () => {
                seed = (seed * 1103515245 + 12345) & 0x7fffffff;
                return seed;
            };

            const commons = BOUNTY_FISH_POOL.filter(f => f.tier === 'common');
            const uncommons = BOUNTY_FISH_POOL.filter(f => f.tier === 'uncommon');
            const rares = BOUNTY_FISH_POOL.filter(f => f.tier === 'rare');

            const selected = [];

            // 1er pez: siempre común
            const cFish = commons[nextRand() % commons.length];
            selected.push({ fishID: cFish.id, claimed: false });

            // 2do pez: poco común o común distinto
            const uFish = uncommons[nextRand() % uncommons.length];
            selected.push({ fishID: uFish.id, claimed: false });

            // 3er pez: raro (o gigante)
            const rFish = rares[nextRand() % rares.length];
            selected.push({ fishID: rFish.id, claimed: false });

            return selected;
        }

        // Carga o genera las recompensas para el día actual
        loadTodayBounties() {
            const p = window.app && window.app.parser;
            if (!p) return [];

            const oaDay = window.NewspaperSystem ? window.NewspaperSystem.getCurrentOaDay(p) : Math.floor(Date.now() / 86400000 + 25569);
            this.currentOaDay = oaDay;

            const existingSave = p.getBountyBoardSave ? p.getBountyBoardSave() : null;

            if (existingSave && existingSave.bounties && existingSave.bounties.length === 3) {
                // Si el rollDate coincide o si ya tenemos las del save
                this.currentBounties = existingSave.bounties.map(b => {
                    const info = this.getFishInfo(b.fishID);
                    return {
                        fishID: b.fishID,
                        claimed: Boolean(b.claimed),
                        ...info
                    };
                });
                return this.currentBounties;
            }

            // Si no existe o es un día nuevo, generamos los 3 peces
            const rolled = this.generateDailyBounties(oaDay);
            if (p.saveBountyBoardState) {
                p.saveBountyBoardState(oaDay, rolled);
            }

            this.currentBounties = rolled.map(b => {
                const info = this.getFishInfo(b.fishID);
                return {
                    fishID: b.fishID,
                    claimed: Boolean(b.claimed),
                    ...info
                };
            });

            return this.currentBounties;
        }

        // Obtiene la cantidad de un pez en el inventario del jugador
        getPlayerFishCount(fishId) {
            const p = window.app && window.app.parser;
            if (!p || !p.inventory) return 0;
            let total = 0;
            p.inventory.forEach(item => {
                if (item.item_id === Number(fishId) && item.qty > 0) {
                    total += Number(item.qty);
                }
            });
            return total;
        }

        // Abre el modal del tablón de pesca
        open() {
            if (window.PlaySfx) window.PlaySfx.sonar('bountyBoardOpen');
            this.loadTodayBounties();
            this._renderBountyBoard();

            const modal = document.getElementById('modal-bounty-board');
            if (modal) {
                modal.classList.remove('hidden');
                modal.style.display = 'flex';
            }
        }

        close() {
            if (window.PlaySfx) window.PlaySfx.sonar('bountyBoardClose');
            const modal = document.getElementById('modal-bounty-board');
            if (modal) {
                modal.classList.add('hidden');
                modal.style.display = 'none';
            }
        }

        toggleLanguage() {
            this.currentLanguage = this.currentLanguage === 'ES' ? 'EN' : 'ES';
            this._renderBountyBoard();
        }

        // Canjea un pez del tablón
        claimBounty(fishId, cardElement) {
            const p = window.app && window.app.parser;
            if (!p) return;

            const fish = this.currentBounties.find(b => b.fishID === Number(fishId));
            if (!fish || fish.claimed) return;

            const count = this.getPlayerFishCount(fishId);
            if (count < 1) {
                if (window.app.showToast) {
                    window.app.showToast(this.currentLanguage === 'ES' ? '❌ No tienes este pez en tu mochila' : '❌ You don\'t have this fish in your bag');
                }
                return;
            }

            // 1. Descontar 1 pez de la mochila
            const deducted = p.deductInventoryItem(fishId, 1);
            if (!deducted) {
                console.warn('[BountySystem] No se pudo descontar el pez del inventario');
                return;
            }

            // 2. Acreditar zanahorias
            const newCarrots = p.addCarrots(fish.reward);

            // 3. Marcar como reclamado en el save AST
            p.setBountyClaimed(fishId);
            // El juego cuenta las recompensas reclamadas y los peces entregados.
            if (typeof p.bumpCounter === 'function') {
                p.bumpCounter('bountiesClaimed', 1);
                p.bumpCounter('fishCaught', 1);
            }
            fish.claimed = true;

            // 4. Actualizar contadores en la interfaz (HUD y editor)
            const hudCarrots = document.getElementById('port-hud-carrots');
            if (hudCarrots) hudCarrots.textContent = newCarrots;
            const inputCarrots = document.getElementById('input-carrots');
            if (inputCarrots) inputCarrots.value = newCarrots;
            const shopCarrots = document.getElementById('shop-modal-carrots');
            if (shopCarrots) shopCarrots.textContent = newCarrots;

            // Refrescar inventario si está visible
            if (window.app.renderInventory) {
                window.app.renderInventory();
            }

            // Guardar automáticamente
            if (window.app.tsukiPort && typeof window.app.tsukiPort.triggerAutosave === 'function') {
                window.app.tsukiPort.triggerAutosave();
            }

            // 5. Aplicar animación de sello sobre la tarjeta
            if (cardElement) {
                const stampEl = cardElement.querySelector('.bounty-stamp');
                if (stampEl) {
                    stampEl.classList.remove('hidden');
                    stampEl.classList.add('slam');
                }
                const btn = cardElement.querySelector('.btn-bounty-claim');
                if (btn) {
                    btn.disabled = true;
                    btn.className = 'btn-bounty-claimed';
                    btn.textContent = this.currentLanguage === 'ES' ? '✓ Canjeado' : '✓ Claimed';
                }
                const countEl = cardElement.querySelector('.bounty-count-tag');
                if (countEl) {
                    countEl.textContent = (this.currentLanguage === 'ES' ? 'En mochila: ' : 'In bag: ') + (count - 1);
                }
            }

            // 6. Mensaje toast festivo
            const fishName = this.currentLanguage === 'ES' ? fish.name_es : fish.name_en;
            if (window.app.showToast) {
                window.app.showToast('🎉 ¡Canjeado! ' + fishName + ' +' + fish.reward + ' 🥕');
            }
        }

        _renderBountyBoard() {
            const isEs = this.currentLanguage === 'ES';
            const cardsContainer = document.getElementById('bounty-cards-container');
            const titleEl = document.getElementById('bounty-board-title');
            const subtitleEl = document.getElementById('bounty-board-subtitle');
            const dateEl = document.getElementById('bounty-board-date');

            if (titleEl) {
                titleEl.textContent = isEs ? 'Tablón de Pesca Municipal' : 'Municipal Fishing Bounty Board';
            }
            if (subtitleEl) {
                subtitleEl.textContent = isEs ? 'Entrega los 3 peces del día solicitados por Benny para ganar zanahorias.' : 'Deliver Benny\'s 3 daily requested fish to earn carrots.';
            }
            if (dateEl) {
                dateEl.textContent = isEs ? ('Fecha OA: ' + (this.currentOaDay || 'Hoy')) : ('OA Date: ' + (this.currentOaDay || 'Today'));
            }

            if (!cardsContainer) return;
            cardsContainer.innerHTML = '';

            this.currentBounties.forEach(bounty => {
                const count = this.getPlayerFishCount(bounty.fishID);
                const hasFish = count > 0;
                const fishName = isEs ? bounty.name_es : bounty.name_en;

                const card = document.createElement('div');
                card.className = 'bounty-card' + (bounty.claimed ? ' claimed' : '');
                card.dataset.fishId = bounty.fishID;

                card.innerHTML = `
                    <!-- Chincheta decorativa superior -->
                    <div class="bounty-pin"></div>

                    <!-- Sello de completado -->
                    <div class="bounty-stamp ${bounty.claimed ? '' : 'hidden'}">
                        ${isEs ? 'COMPLETADO' : 'COMPLETED'}
                    </div>

                    <!-- Contenido del cartel de recompensa -->
                    <div class="bounty-card-inner">
                        <div class="bounty-fish-frame">
                            <img src="images/items/ITEM_${bounty.fishID}.png" class="bounty-fish-img"
                                 onerror="this.src='images/items/FURN_100.png'" alt="${fishName}">
                        </div>

                        <div class="bounty-fish-title">${fishName}</div>

                        <div class="bounty-reward-badge">
                            <span class="bounty-carrot-icon">🥕</span>
                            <span class="bounty-reward-val">${bounty.reward}</span>
                            <span class="bounty-carrot-label">${isEs ? 'zanahorias' : 'carrots'}</span>
                        </div>

                        <div class="bounty-count-tag ${hasFish ? 'has-item' : 'empty'}">
                            ${isEs ? 'En mochila: ' : 'In bag: '}${count}
                        </div>

                        <div class="bounty-actions">
                            ${bounty.claimed ? `
                                <button class="btn-bounty-claimed" disabled>
                                    ${isEs ? '✓ Canjeado' : '✓ Claimed'}
                                </button>
                            ` : `
                                <button class="btn-bounty-claim ${hasFish ? 'active' : 'disabled'}"
                                        data-fish-id="${bounty.fishID}"
                                        ${hasFish ? '' : 'disabled'}>
                                    ${hasFish ? (isEs ? '¡Canjear Pez!' : 'Claim Bounty!') : (isEs ? 'Pez no disponible' : 'Not available')}
                                </button>
                            `}
                        </div>
                    </div>
                `;

                cardsContainer.appendChild(card);
            });
        }

        _injectModalHTML() {
            if (document.getElementById('modal-bounty-board')) return;

            const modalDiv = document.createElement('div');
            modalDiv.id = 'modal-bounty-board';
            modalDiv.className = 'bounty-modal-overlay hidden';
            modalDiv.style.display = 'none';

            modalDiv.innerHTML = `
                <div class="bounty-board-container">
                    <!-- Marco de madera superior del tablón -->
                    <div class="bounty-board-header">
                        <div class="bounty-header-left">
                            <span class="bounty-seal-badge">BENNY</span>
                            <div>
                                <h2 id="bounty-board-title" class="bounty-board-title">Tablón de Pesca Municipal</h2>
                                <p id="bounty-board-subtitle" class="bounty-board-subtitle">Peces del día solicitados por la alcaldía.</p>
                            </div>
                        </div>
                        <div class="bounty-header-right">
                            <span id="bounty-board-date" class="bounty-date-tag">Fecha OA: --</span>
                            <button id="btn-bounty-lang" class="bounty-lang-btn">ES / EN</button>
                            <button id="btn-bounty-close" class="bounty-close-btn" title="Cerrar">✕</button>
                        </div>
                    </div>

                    <!-- Superficie de corcho con las 3 tarjetas wanted -->
                    <div class="bounty-cork-surface">
                        <div id="bounty-cards-container" class="bounty-cards-grid">
                            <!-- Las 3 tarjetas se inyectan dinámicamente -->
                        </div>
                    </div>

                    <!-- Pie del tablón con aviso de renovación a las 08:00 AM -->
                    <div class="bounty-board-footer">
                        <span>⏰ Nuevos peces asignados cada mañana a las 08:00 AM</span>
                    </div>
                </div>
            `;

            document.body.appendChild(modalDiv);
        }

        _setupEventListeners() {
            document.addEventListener('click', (e) => {
                const claimBtn = e.target.closest('.btn-bounty-claim');
                if (claimBtn && !claimBtn.disabled) {
                    const fishId = claimBtn.dataset.fishId;
                    const card = claimBtn.closest('.bounty-card');
                    this.claimBounty(fishId, card);
                    return;
                }

                if (e.target && e.target.id === 'btn-bounty-close') {
                    this.close();
                } else if (e.target && e.target.id === 'btn-bounty-lang') {
                    this.toggleLanguage();
                } else if (e.target && e.target.id === 'modal-bounty-board') {
                    this.close();
                }
            });
        }
    }

    window.BountySystem = new BountySystem();
    if (typeof document !== 'undefined') {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => window.BountySystem.init());
        } else {
            window.BountySystem.init();
        }
    }
})();
