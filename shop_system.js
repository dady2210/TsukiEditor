/**
 * ============================================================
 * Tsuki's Odyssey — Módulo 3: Economía, Tiendas & Dawn's Junker
 * ============================================================
 * Implementación basada en el código decompilado de:
 * - Shop, Shop.ShopData, ShopCatalogue, ShopDisplay (dump.cs)
 * - Junker, Junker.Recipe, JunkerNode (dump.cs, Furniture_Completo.c)
 * - Estructuras de guardado Odin (SublocationSave 1, 5, 11)
 */

// ─── Algoritmo de Verificación Réplica Exacta de Unity ────────
function calcVerificationId(itemId) {
    const raw = itemId | 0;
    const id = raw < 0 ? (Math.abs(raw) - 1) : raw;
    const MBIG = 2147483647;
    const MSEED = 161803398;
    const seedArray = new Array(56).fill(0);
    let mj = MSEED - id;
    seedArray[55] = mj;
    let mk = 1;
    for (let i = 1; i < 55; i++) {
        const ii = (21 * i) % 55;
        seedArray[ii] = mk;
        mk = mj - mk;
        if (mk < 0) mk += MBIG;
        mj = seedArray[ii];
    }
    for (let k = 1; k < 5; k++) {
        for (let i = 1; i < 56; i++) {
            seedArray[i] -= seedArray[1 + (i + 30) % 55];
            if (seedArray[i] < 0) seedArray[i] += MBIG;
        }
    }
    let retVal = seedArray[1] - seedArray[22];
    if (retVal === MBIG) retVal -= 1;
    if (retVal < 0) retVal += MBIG;
    return retVal >>> 0;
}

// ─── Configuración de Tiendas del Juego ────────────────────────
const SHOPS_CONFIG = {
    'yori_1': {
        key: 'yori_1',
        sublocId: 1,
        shopIdx: 0,
        name: "Yori — Planta Baja",
        nameEn: "Yori's General Store (Floor 1)",
        subtitle: "Herramientas, consumibles, papeles de pared y duela",
        shopkeeper: "Yori / Pipi",
        charEnum: 5,
        displayCount: 3,
        avatar: "images/npcs/Yori/ChameleonYoriShop_0.png",
        dialogues: [
            "¡Hola Tsuki! Llegaron cosas nuevas en la entrega matutina.",
            "Tómate tu tiempo mirando los estantes.",
            "Si necesitas herramientas o tapices para tu casa del árbol, este es el lugar."
        ],
        filter: (id, item) => {
            if (!item) return false;
            const kind = item.behaviour?.kind;
            const place = item.behaviour?.place;
            if (kind === 'wallpaper' || kind === 'floor' || place === 'cover_wall' || place === 'cover_floor') return true;
            if (['misc', 'poster'].includes(kind)) return true;
            if (kind === 'seed') return false;
            const name = (item.name_en || item.item_name || '').toLowerCase();
            if (name.includes('ticket') || name.includes('book') || name.includes('noodle') || name.includes('tea') || name.includes('rod') || name.includes('shears')) return true;
            return false;
        }
    },
    'yori_2': {
        key: 'yori_2',
        sublocId: 1,
        shopIdx: 1,
        name: "Yori — Muebles (Planta Alta)",
        nameEn: "Yori's Furniture (Floor 2)",
        subtitle: "Muebles de sala, camas, lámparas, mesas y adornos",
        shopkeeper: "Pipi / Elfie",
        charEnum: 16,
        displayCount: 4,
        avatar: "images/npcs/Pipi/Pipi-SleepDown-StandShop-Tired_0.png",
        dialogues: [
            "¡Bienvenido arriba! Pipi tiene los muebles más cómodos hoy.",
            "¿Buscando una cama o una mesa para tu casa? Mira estas bellezas.",
            "¡Zzz... ah, hola Tsuki! ¿Te gusta algún mueble?"
        ],
        filter: (id, item) => {
            if (!item) return false;
            const kind = item.behaviour?.kind;
            if (['chair', 'table', 'bed', 'lamp', 'wall_lamp', 'fridge', 'fountain'].includes(kind)) return true;
            if (item.width && item.length && kind !== 'wallpaper' && kind !== 'floor' && kind !== 'seed') return true;
            return false;
        }
    },
    'rosemary': {
        key: 'rosemary',
        sublocId: 5,
        shopIdx: 0,
        name: "Jardín de Rosemary",
        nameEn: "Rosemary's Plant Shop",
        subtitle: "Semillas, plantas en maceta, abono y flores",
        shopkeeper: "Rosemary",
        charEnum: 9,
        displayCount: 7,
        avatar: "images/npcs/Leon/Chameleon_RoseShop_0.png",
        dialogues: [
            "Hola, pequeño... las flores están felices de verte hoy.",
            "Tengo semillas frescas para tu granja y macetas decorativas.",
            "Recuerda regar las plantas y cuidarlas con cariño."
        ],
        filter: (id, item) => {
            if (!item) return false;
            const kind = item.behaviour?.kind;
            const name = (item.name_en || item.name_es || item.item_name || '').toLowerCase();
            if (kind === 'seed' || kind === 'plant') return true;
            if (name.includes('seed') || name.includes('semilla') || name.includes('flower') || name.includes('flor') || name.includes('plant') || name.includes('pot') || name.includes('jardinera')) return true;
            return false;
        }
    },
    'dawn': {
        key: 'dawn',
        sublocId: 11,
        shopIdx: 0,
        name: "Taller de Dawn",
        nameEn: "Dawn's Workshop",
        subtitle: "Revestimientos rústicos, maquinaria y herramientas",
        shopkeeper: "Dawn",
        charEnum: 14,
        displayCount: 2,
        avatar: "images/npcs/Dawn/ChameleonWinterDawnShop_0.png",
        dialogues: [
            "¡Ey Tsuki! Cuidado con los engranajes, estoy calibrando el taller.",
            "Si quieres cambiar las paredes o el suelo, tengo baldosas resistentes.",
            "¡No toques la Junker a menos que sepas lo que haces!"
        ],
        filter: (id, item) => {
            if (!item) return false;
            const kind = item.behaviour?.kind;
            const name = (item.name_en || item.name_es || '').toLowerCase();
            if (kind === 'wallpaper' || kind === 'floor') return true;
            if (name.includes('gear') || name.includes('wrench') || name.includes('tile') || name.includes('wall') || name.includes('brick')) return true;
            return false;
        }
    }
};

// ─── Recetas Conocidas de la Máquina Junker ───────────────────
const JUNKER_RECIPES = [
    {
        name: "Piano Cubierto de Maleza (Overgrown Piano)",
        items: [144, 461, 712],
        combinationFurn: 1845,
        desc: "Un majestuoso piano cubierto de enredaderas y musgo."
    },
    {
        name: "Ídolo Sagrado del Dios de la Sabiduría",
        items: [35, 1211, 2283],
        combinationFurn: 2284,
        desc: "Una reliquia ancestral que emite una tenue energía dorada."
    }
];

function getGlobalItemsDB() {
    if (typeof window !== 'undefined' && window.ITEMS_DB) return window.ITEMS_DB;
    if (typeof global !== 'undefined' && global.ITEMS_DB) return global.ITEMS_DB;
    return null;
}

function getGlobalIdCatalog() {
    if (typeof window !== 'undefined' && window.ID_CATALOG) return window.ID_CATALOG;
    if (typeof global !== 'undefined' && global.ID_CATALOG) return global.ID_CATALOG;
    return null;
}

function showGlobalToast(msg, type = 'info') {
    if (typeof window !== 'undefined' && window.app && typeof window.app.showToast === 'function') {
        window.app.showToast(msg, type);
    }
}

class ShopManager {
    constructor(app) {
        this.app = app;
        this.shops = SHOPS_CONFIG;
        this.currentShopKey = 'yori_1';
        this.cachedItemPools = {};
        this.initItemPools();
    }

    get parser() {
        return this.app?.parser;
    }

    initItemPools() {
        const itemsDb = getGlobalItemsDB();
        if (!itemsDb) return;
        const allIds = Object.keys(itemsDb).map(Number);
        
        for (const [key, config] of Object.entries(this.shops)) {
            const pool = [];
            for (const id of allIds) {
                const item = itemsDb[id];
                if (config.filter(id, item)) {
                    pool.push(id);
                }
            }
            if (pool.length < 10) {
                allIds.slice(0, 50).forEach(id => {
                    if (!pool.includes(id)) pool.push(id);
                });
            }
            this.cachedItemPools[key] = pool;
        }
    }

    getItemMeta(id) {
        const itemsDb = getGlobalItemsDB();
        const idCatalog = getGlobalIdCatalog();
        const dbItem = itemsDb ? itemsDb[id] : null;
        let name = "Ítem #" + id;
        let price = 300;
        let isShiny = false;

        if (dbItem) {
            name = dbItem.name_es || dbItem.furn_name || dbItem.item_name || dbItem.name_en || name;
            if (dbItem.behaviour && dbItem.behaviour.price_shop) {
                price = Number(dbItem.behaviour.price_shop);
            } else {
                const kind = dbItem.behaviour?.kind;
                if (kind === 'seed') price = 40;
                else if (kind === 'wallpaper' || kind === 'floor') price = 400;
                else if (kind === 'bed') price = 1200;
                else if (kind === 'chair') price = 500;
                else if (kind === 'table') price = 750;
                else if (kind === 'lamp' || kind === 'wall_lamp') price = 600;
                else price = 450;
            }
        }

        if (idCatalog && idCatalog.entries) {
            const entry = idCatalog.entries.find(e => e.id === id || e.id === Math.abs(id));
            if (entry) {
                if (entry.furn && entry.furn.name) name = entry.furn.name;
                else if (entry.item && entry.item.name) name = entry.item.name;
            }
        }

        // SE VENDE AL PRECIO ENTERO. Antes aqui habia
        // `Math.max(10, Math.floor(price * 0.5))`, que no sale de ningun sitio del juego:
        //
        //   * En el modelo de clases NO EXISTE ningun `SellPrice`. Solo `Price`, con sus
        //     overrides (`Fish::get_Price`, `FurnitureItem::get_Price`...).
        //   * En `SellConvo.<Run>d__6::MoveNext` —los 5.984 bytes enteros— no hay ni un
        //     `fmul`, ni un `fdiv`, ni un `lsr`, ni un `asr`. Nada que parta por dos.
        //   * Y el vendedor simple lo dice del todo. `CropBox.CropBoxSave::get_TotalValue`
        //     suma `CropSlot::get_Value` de cada hueco, y ese es:
        //
        //         if (Item.Get(this.itemID, out item)) p = item.Price; else p = 1;
        //         return this.quantity * p;
        //
        //     `mul w0, w8, w0` y se acaba. Sin mitad y sin suelo de 10.
        const sellPrice = price;
        const spriteUrl = `images/items/FURN_${id}.png`;

        return {
            id,
            name,
            price,
            sellPrice,          // el mismo `Price`: ver arriba
            spriteUrl,
            isShiny
        };
    }

    rollShop(shopKey, currentHour, currentDate, force = false) {
        const config = this.shops[shopKey];
        if (!config || !this.parser) return null;

        const shopSaves = this.parser.getShopSaves();
        const currentSave = shopSaves.find(s => s.sublocId === config.sublocId && s.shopIdx === config.shopIdx);

        if (!force && currentSave && currentSave.hour === currentHour && currentSave.date === currentDate) {
            return currentSave;
        }

        const pool = this.cachedItemPools[shopKey] || Object.keys(window.ITEMS_DB || {}).map(Number).slice(0, 30);
        const lastRolled = currentSave ? (currentSave.lastRolledItems || []) : [];
        
        let available = pool.filter(id => !lastRolled.slice(0, config.displayCount * 2).includes(id));
        if (available.length < config.displayCount) available = pool.slice();

        const shuffled = available.slice().sort(() => Math.random() - 0.5);
        const chosenIds = shuffled.slice(0, config.displayCount);

        const newDisplays = chosenIds.map((id, slotIndex) => {
            return {
                index: slotIndex,
                itemId: id,
                verification: calcVerificationId(id),
                quantity: 1,
                bought: false,
                empty: false,
                rerolled: false
            };
        });

        const updatedLastRolled = [...chosenIds, ...lastRolled].slice(0, 18);

        const updateData = {
            hour: currentHour,
            date: currentDate,
            shopkeeper: config.charEnum,
            lastRolledItems: updatedLastRolled,
            displays: newDisplays
        };

        this.parser.setShopSave(config.sublocId, config.shopIdx, updateData);
        return { ...updateData, config };
    }

    checkAndRollAllShops(currentHour, currentDate) {
        if (!this.parser) return;
        const results = {};
        for (const key of Object.keys(this.shops)) {
            results[key] = this.rollShop(key, currentHour, currentDate, false);
        }
        return results;
    }

    loadShopsFromSave() {
        if (!this.parser) return;
        const shopSaves = this.parser.getShopSaves();
        for (const key of Object.keys(this.shops)) {
            const config = this.shops[key];
            const found = shopSaves.find(s => s.sublocId === config.sublocId && s.shopIdx === config.shopIdx);
            if (found) {
                this.shops[key].save = found;
            }
        }
    }

    getShopState(shopKey) {
        const config = this.shops[shopKey];
        if (!config || !this.parser) return null;

        const shopSaves = this.parser.getShopSaves();
        let current = shopSaves.find(s => s.sublocId === config.sublocId && s.shopIdx === config.shopIdx);

        if (!current || !current.displays || current.displays.length === 0) {
            const h = new Date().getHours();
            const d = 46250;
            current = this.rollShop(shopKey, h, d, true);
        }
        return {
            config,
            save: current
        };
    }

    buyItem(shopKey, slotIndex) {
        if (!this.parser) return { success: false, reason: "No hay archivo guardado cargado" };

        const state = this.getShopState(shopKey);
        if (!state || !state.save || !state.save.displays[slotIndex]) {
            return { success: false, reason: "Escaparate no encontrado" };
        }

        const slot = state.save.displays[slotIndex];
        if (slot.bought) {
            return { success: false, reason: "Este artículo ya fue vendido" };
        }

        const meta = this.getItemMeta(slot.itemId);
        const playerCarrots = this.getPlayerCarrots();

        if (playerCarrots < meta.price) {
            return { 
                success: false, 
                reason: `No tienes suficientes zanahorias (Costo: ${meta.price} 🥕, Tienes: ${playerCarrots} 🥕)` 
            };
        }

        this.setPlayerCarrots(playerCarrots - meta.price);

        const invType = (slot.itemId < 0 || meta.id < 0) ? 0 : 1;
        // El juego cuenta muebles y objetos por separado, según invType.
        if (typeof this.parser.bumpCounter === 'function') {
            this.parser.bumpCounter(invType === 1 ? 'furnitureBought' : 'itemsBought',
                                    slot.quantity || 1);
        }
        // Y lo comprado entra en la colección.
        if (window.Progress) window.Progress.anotar(meta.id);
        this.parser.injectInventoryItem(Math.abs(meta.id), slot.quantity || 1, false, invType);

        const updatedDisplays = state.save.displays.map((d, idx) => {
            if (idx === slotIndex) {
                return { ...d, bought: true };
            }
            return d;
        });

        this.parser.setShopSave(state.config.sublocId, state.config.shopIdx, {
            displays: updatedDisplays
        });

        this.updateHUDCarrots();

        return {
            success: true,
            item: meta,
            remainingCarrots: this.getPlayerCarrots()
        };
    }

    sellItem(inventoryIndex, qty = 1) {
        if (!this.parser) return { success: false, reason: "No hay archivo guardado cargado" };

        const inv = this.parser.inventory;
        if (!inv || !inv[inventoryIndex]) {
            return { success: false, reason: "Ranura de inventario no encontrada" };
        }

        const slot = inv[inventoryIndex];
        if (!slot || slot.qty <= 0 || slot.item_id <= 0) {
            return { success: false, reason: "Ranura vacía" };
        }

        const meta = this.getItemMeta(slot.item_id);
        const sellQty = Math.min(qty, slot.qty);
        const totalGain = meta.sellPrice * sellQty;

        const newQty = slot.qty - sellQty;
        if (newQty <= 0) {
            this.parser.clearInventoryItem('inventory', inventoryIndex);
        } else {
            this.parser.updateInventoryItem('inventory', inventoryIndex, slot.item_id, newQty, slot.invType);
        }

        const currentCarrots = this.getPlayerCarrots();
        this.setPlayerCarrots(currentCarrots + totalGain);

        this.updateHUDCarrots();

        return {
            success: true,
            item: meta,
            soldQty: sellQty,
            gain: totalGain,
            remainingCarrots: this.getPlayerCarrots()
        };
    }

    getPlayerCarrots() {
        if (this.parser && this.parser.generalVars && this.parser.generalVars.carrots) {
            return Number(this.parser.generalVars.carrots.value) || 0;
        }
        return 0;
    }

    setPlayerCarrots(val) {
        const carrots = Math.max(0, val | 0);
        if (this.parser && this.parser.generalVars && this.parser.generalVars.carrots) {
            // El juego lleva ganado y gastado aparte del saldo; si no se actualizan
            // aquí, las estadísticas se van desviando compra a compra.
            const antes = Number(this.parser.generalVars.carrots.value) || 0;
            if (typeof this.parser.bumpCounter === 'function' && carrots !== antes) {
                this.parser.bumpCounter(carrots > antes ? 'carrotsEarned' : 'carrotsSpent',
                                        Math.abs(carrots - antes));
            }
            this.parser.generalVars.carrots.value = carrots;
            if (typeof this.parser.writeGeneralVar === 'function') {
                try {
                    this.parser.writeGeneralVar('carrots', carrots);
                } catch(e) {
                    console.warn('[ShopManager] writeGeneralVar carrots:', e);
                }
            }
            return true;
        }
        return false;
    }

    updateHUDCarrots() {
        if (typeof document === 'undefined') return;
        const carrots = this.getPlayerCarrots();
        const elHud = document.getElementById('port-hud-carrots');
        if (elHud) elHud.textContent = carrots;
        const elInput = document.getElementById('input-carrots');
        if (elInput) elInput.value = carrots;
        const elGeneral = document.getElementById('var-carrots');
        if (elGeneral) elGeneral.value = carrots;
        const elModalCarrots = document.getElementById('shop-modal-carrots');
        if (elModalCarrots) elModalCarrots.textContent = carrots;
    }
}

class JunkerManager {
    constructor(app, shopManager) {
        this.app = app;
        this.shopManager = shopManager;
        this.slots = [null, null, null];
        this.recipes = JUNKER_RECIPES;
    }

    get parser() {
        return this.app?.parser;
    }

    getState() {
        if (!this.parser) return null;
        return this.parser.getJunkerSave() || {
            objectID: 1364397954,
            day: 46250,
            brokenNodes: [false, false, false],
            craftedItem: -1,
            quantity: 1,
            verification: 0,
            busted: false
        };
    }

    setSlot(slotIndex, inventoryIndex) {
        if (slotIndex < 0 || slotIndex > 2) return false;
        if (!this.parser) return false;

        const invItem = this.parser.inventory[inventoryIndex];
        if (!invItem || invItem.qty <= 0) return false;

        const countUsed = this.slots.filter(s => s && s.invIndex === inventoryIndex).length;
        if (countUsed >= invItem.qty) return false;

        const meta = this.shopManager.getItemMeta(invItem.item_id);
        this.slots[slotIndex] = {
            invIndex: inventoryIndex,
            itemId: invItem.item_id,
            invType: invItem.invType,
            meta
        };
        return true;
    }

    clearSlot(slotIndex) {
        if (slotIndex < 0 || slotIndex > 2) return false;
        this.slots[slotIndex] = null;
        return true;
    }

    clearAllSlots() {
        this.slots = [null, null, null];
    }

    canProcess() {
        const state = this.getState();
        if (state && state.busted) return false;
        return this.slots.every(s => s !== null);
    }

    processJunker() {
        if (!this.canProcess()) {
            return { success: false, reason: "Faltan muebles en los pedestales o la máquina está descompuesta." };
        }

        const items = this.slots.map(s => s.itemId);
        const itemNames = this.slots.map(s => (s.meta.name || '').toLowerCase());

        // La Junker lleva su propio contador de usos en el save.
        if (this.parser && typeof this.parser.bumpCounter === 'function') {
            this.parser.bumpCounter('junkerUsed', 1);
        }

        const isCloverOverload = items.every(id => [1122, 1123, 1124].includes(id)) ||
                                 itemNames.every(n => n.includes('clover') || n.includes('trébol') || n.includes('trebol'));
        if (isCloverOverload) {
            this.consumeSlotItems();
            this.clearAllSlots();

            this.parser.setJunkerSave({
                brokenNodes: [true, true, true],
                busted: true,
                craftedItem: -1
            });

            return {
                success: true,
                type: 'busted',
                broken: true,
                title: "⚡ ¡SOBRECARGA ELÉCTRICA!",
                message: "¡BZZZT! ¡La Junker chisporroteó violentamente y soltó una nube de humo! Los tréboles fundieron los condensadores eléctricos. Dawn te mira furiosa.",
                dawnQuote: "¡¿Qué demonios hiciste, Tsuki?! ¡La máquina no aguanta la resonancia de tres tréboles! ¡Ahora tendré que reparar las bobinas!"
            };
        }

        let recipeResult = null;
        for (const recipe of this.recipes) {
            const hasAll = recipe.items.every(reqId => items.includes(reqId));
            if (hasAll) {
                recipeResult = recipe;
                break;
            }
        }

        let outputItemId = null;
        let isShinyUpgrade = false;

        if (recipeResult) {
            outputItemId = recipeResult.combinationFurn;
        } else {
            const selectedSource = this.slots[Math.floor(Math.random() * this.slots.length)];
            outputItemId = selectedSource.itemId;
            isShinyUpgrade = true;
        }

        this.consumeSlotItems();
        this.clearAllSlots();

        const verId = calcVerificationId(outputItemId);
        this.parser.setJunkerSave({
            craftedItem: outputItemId,
            quantity: 1,
            verification: verId,
            brokenNodes: [false, false, false]
        });

        this.parser.injectInventoryItem(outputItemId, 1, false, 1);

        const outMeta = this.shopManager.getItemMeta(outputItemId);

        return {
            success: true,
            type: isShinyUpgrade ? 'shiny' : 'recipe',
            title: isShinyUpgrade ? "⭐ ¡Mueble Estrella (Shiny) Forjado!" : "✨ ¡Mueble Combinado Creado!",
            item: outMeta,
            isShiny: isShinyUpgrade,
            verification: verId,
            message: isShinyUpgrade 
                ? `¡La Junker fusionó los materiales y produjo una versión Shiny (⭐) de ${outMeta.name}! Su valor y elegancia son incomparables.`
                : `¡Combinación exitosa! Obtuviste: ${outMeta.name}.`
        };
    }

    fuse() {
        // `SFXClip.JunkerWireChaser`: la chispa mientras funde.
        if (window.PlaySfx) window.PlaySfx.sonar('junkerWireChaser');
        return this.processJunker();
    }

    consumeSlotItems() {
        for (const slot of this.slots) {
            if (!slot) continue;
            const currentSlot = this.parser.inventory[slot.invIndex];
            if (currentSlot && currentSlot.qty > 0) {
                const newQty = currentSlot.qty - 1;
                currentSlot.qty = newQty;
                if (newQty > 0) {
                    this.parser.updateInventoryItem('inventory', slot.invIndex, currentSlot.item_id, newQty, currentSlot.invType);
                } else {
                    this.parser.clearInventoryItem('inventory', slot.invIndex);
                }
            }
        }
    }

    repairJunker() {
        if (!this.parser) return false;
        this.parser.setJunkerSave({
            brokenNodes: [false, false, false],
            busted: false,
            craftedItem: -1
        });
        return true;
    }
}

// ─── Controladores de Interfaz Gráfica (UI) ──────────────────
class ShopUI {
    constructor(shopManager) {
        this.shopManager = shopManager;
        this.modal = null;
        this.activeTab = 'buy'; // 'buy' or 'sell'
        this.init();
    }

    init() {
        if (typeof document === 'undefined') return;
        this.modal = document.getElementById('modal-shops');
        this.setupEvents();
    }

    setupEvents() {
        const btnClose = document.getElementById('btn-close-shop-modal');
        if (btnClose) btnClose.addEventListener('click', () => this.close());

        const btnReroll = document.getElementById('btn-shop-reroll-hour');
        if (btnReroll) btnReroll.addEventListener('click', () => this.simulateReroll());

        const tabs = document.querySelectorAll('.shop-nav-btn');
        tabs.forEach(btn => {
            btn.addEventListener('click', () => {
                const shopKey = btn.getAttribute('data-shop');
                if (shopKey) {
                    this.switchShop(shopKey);
                }
            });
        });

        const tabBuy = document.getElementById('tab-shop-buy');
        const tabSell = document.getElementById('tab-shop-sell');
        if (tabBuy) tabBuy.addEventListener('click', () => this.switchMode('buy'));
        if (tabSell) tabSell.addEventListener('click', () => this.switchMode('sell'));
    }

    open(shopKey = 'yori_1') {
        if (!this.modal) this.init();
        if (!this.modal) return;
        this.shopManager.currentShopKey = shopKey;
        this.activeTab = 'buy';
        this.modal.classList.remove('hidden');
        this.render();
    }

    close() {
        // `SFXClip.JunkerUnselect`.
        if (window.PlaySfx) window.PlaySfx.sonar('junkerUnselect');
        if (this.modal) this.modal.classList.add('hidden');
    }

    switchShop(shopKey) {
        this.shopManager.currentShopKey = shopKey;
        this.render();
    }

    switchMode(mode) {
        this.activeTab = mode;
        const tabBuy = document.getElementById('tab-shop-buy');
        const tabSell = document.getElementById('tab-shop-sell');
        if (tabBuy) tabBuy.classList.toggle('active', mode === 'buy');
        if (tabSell) tabSell.classList.toggle('active', mode === 'sell');
        this.renderContent();
    }

    simulateReroll() {
        const key = this.shopManager.currentShopKey;
        const d = 46250;
        const h = (new Date().getHours() + Math.floor(Math.random() * 24)) % 24;
        this.shopManager.rollShop(key, h, d, true);
        showGlobalToast(`¡Escaparate de ${this.shopManager.shops[key].name} renovado para las ${h}:00!`, 'info');
        this.render();
    }

    render() {
        if (!this.modal) return;
        const shopKey = this.shopManager.currentShopKey;
        const state = this.shopManager.getShopState(shopKey);
        if (!state) return;

        // Actualizar navegación activa
        document.querySelectorAll('.shop-nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-shop') === shopKey);
        });

        // Actualizar datos del encargado
        const avatarEl = document.getElementById('shop-keeper-avatar');
        if (avatarEl) avatarEl.src = state.config.avatar;

        const nameEl = document.getElementById('shop-keeper-name');
        if (nameEl) nameEl.textContent = state.config.name;

        const subEl = document.getElementById('shop-keeper-sub');
        if (subEl) subEl.textContent = state.config.subtitle;

        const quoteEl = document.getElementById('shop-keeper-quote');
        if (quoteEl) {
            const quotes = state.config.dialogues || ["¡Hola Tsuki!"];
            quoteEl.textContent = quotes[Math.floor(Math.random() * quotes.length)];
        }

        // Carrots
        this.shopManager.updateHUDCarrots();

        this.renderContent();
    }

    renderContent() {
        const contentBuy = document.getElementById('shop-content-buy');
        const contentSell = document.getElementById('shop-content-sell');
        if (contentBuy) contentBuy.classList.toggle('hidden', this.activeTab !== 'buy');
        if (contentSell) contentSell.classList.toggle('hidden', this.activeTab !== 'sell');

        if (this.activeTab === 'buy') {
            this.renderDisplays();
        } else {
            this.renderSellList();
        }
    }

    renderDisplays() {
        const container = document.getElementById('shop-displays-grid');
        if (!container) return;
        container.innerHTML = '';

        const shopKey = this.shopManager.currentShopKey;
        const state = this.shopManager.getShopState(shopKey);
        if (!state || !state.save || !state.save.displays) return;

        state.save.displays.forEach((slot, index) => {
            const meta = this.shopManager.getItemMeta(slot.itemId);
            const card = document.createElement('div');
            card.className = 'shop-display-card' + (slot.bought ? ' is-sold' : '');

            card.innerHTML = `
                <div class="shop-card-badge">${slot.bought ? 'AGOTADO' : meta.price + ' 🥕'}</div>
                <div class="shop-card-img-wrap">
                    <img src="${meta.spriteUrl}" alt="${meta.name}" onerror="this.src='favicon.png'">
                </div>
                <div class="shop-card-title" title="${meta.name}">${meta.name}</div>
                <div class="shop-card-action">
                    ${slot.bought 
                        ? `<button class="btn-secondary" disabled style="width:100%; opacity:0.6;">Vendido</button>` 
                        : `<button class="btn-primary btn-buy-slot" data-slot="${index}" style="width:100%; padding:0.4rem 0.6rem; font-size:0.85rem;">Comprar</button>`
                    }
                </div>
            `;

            const btnBuy = card.querySelector('.btn-buy-slot');
            if (btnBuy) {
                btnBuy.addEventListener('click', () => {
                    const res = this.shopManager.buyItem(shopKey, index);
                    if (res.success) {
                        showGlobalToast(`¡Compraste ${res.item.name} por ${res.item.price} 🥕!`, 'success');
                        this.render();
                    } else {
                        showGlobalToast(res.reason, 'error');
                    }
                });
            }

            container.appendChild(card);
        });
    }

    renderSellList() {
        const container = document.getElementById('shop-sell-grid');
        if (!container) return;
        container.innerHTML = '';

        const inv = this.shopManager.parser?.inventory || [];
        const validItems = inv.map((slot, idx) => ({ ...slot, invIndex: idx }))
                              .filter(slot => slot.item_id > 0 && slot.qty > 0);

        if (validItems.length === 0) {
            container.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:2rem; color:var(--text-muted);">No tienes objetos en la mochila para vender.</div>`;
            return;
        }

        validItems.forEach(slot => {
            const meta = this.shopManager.getItemMeta(slot.item_id);
            const row = document.createElement('div');
            row.className = 'shop-sell-card';

            row.innerHTML = `
                <div class="shop-card-img-wrap" style="width:48px;height:48px;">
                    <img src="${meta.spriteUrl}" alt="${meta.name}" onerror="this.src='favicon.png'">
                </div>
                <div style="flex:1; min-width:0;">
                    <div style="font-weight:600; font-size:0.9rem; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">${meta.name}</div>
                    <div style="font-size:0.8rem; color:var(--text-muted);">Tienes: ${slot.qty} | Valor: <span style="color:#e67e22; font-weight:700;">+${meta.sellPrice} 🥕 c/u</span></div>
                </div>
                <div style="display:flex; gap:6px;">
                    <button class="btn-secondary btn-sell-one" style="padding:4px 8px; font-size:0.8rem;">Vender 1</button>
                    ${slot.qty > 1 ? `<button class="btn-secondary btn-sell-all" style="padding:4px 8px; font-size:0.8rem;">Todo (${slot.qty})</button>` : ''}
                </div>
            `;

            const btnOne = row.querySelector('.btn-sell-one');
            if (btnOne) {
                btnOne.addEventListener('click', () => {
                    const res = this.shopManager.sellItem(slot.invIndex, 1);
                    if (res.success) {
                        showGlobalToast(`¡Vendiste 1 ${res.item.name} por +${res.gain} 🥕!`, 'success');
                        this.renderSellList();
                    }
                });
            }

            const btnAll = row.querySelector('.btn-sell-all');
            if (btnAll) {
                btnAll.addEventListener('click', () => {
                    const res = this.shopManager.sellItem(slot.invIndex, slot.qty);
                    if (res.success) {
                        showGlobalToast(`¡Vendiste ${res.soldQty} ${res.item.name} por +${res.gain} 🥕!`, 'success');
                        this.renderSellList();
                    }
                });
            }

            container.appendChild(row);
        });
    }
}

class JunkerUI {
    constructor(junkerManager) {
        this.junkerManager = junkerManager;
        this.modal = null;
        this.init();
    }

    init() {
        if (typeof document === 'undefined') return;
        this.modal = document.getElementById('modal-junker');
        this.setupEvents();
    }

    setupEvents() {
        const btnClose = document.getElementById('btn-close-junker-modal');
        if (btnClose) btnClose.addEventListener('click', () => this.close());

        const btnFuse = document.getElementById('btn-junker-fuse');
        if (btnFuse) btnFuse.addEventListener('click', () => this.fuse());

        const btnRepair = document.getElementById('btn-junker-repair');
        if (btnRepair) btnRepair.addEventListener('click', () => this.repair());

        const btnClear = document.getElementById('btn-junker-clear');
        if (btnClear) btnClear.addEventListener('click', () => {
            this.junkerManager.clearAllSlots();
            this.render();
        });
    }

    open() {
        // `SFXClip.JunkerSelect`: el Junker al abrirse.
        if (window.PlaySfx) window.PlaySfx.sonar('junkerSelect');
        if (!this.modal) this.init();
        if (!this.modal) return;
        this.modal.classList.remove('hidden');
        this.render();
    }

    close() {
        if (this.modal) this.modal.classList.add('hidden');
    }

    fuse() {
        if (!this.junkerManager.canProcess()) {
            if (window.app && window.app.showToast) {
                window.app.showToast("Coloca 3 muebles en los pedestales antes de accionar la palanca.", "warning");
            }
            return;
        }

        const btn = document.getElementById('btn-junker-fuse');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = `<span class="material-symbols-outlined spin-icon">sync</span> FUSIONANDO ENGRANAJES...`;
        }

        setTimeout(() => {
            const res = this.junkerManager.processJunker();
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = `<span class="material-symbols-outlined">bolt</span> ¡FUSIONAR MUEBLES!`;
            }

            if (res.success) {
                if (res.type === 'busted') {
                    this.showOverloadResult(res);
                } else {
                    this.showSuccessResult(res);
                }
            } else {
                if (window.app && window.app.showToast) {
                    window.app.showToast(res.reason, "error");
                }
            }
            this.render();
        }, 1100);
    }

    repair() {
        // `SFXClip.JunkerReset`.
        if (window.PlaySfx) window.PlaySfx.sonar('junkerReset');
        this.junkerManager.repairJunker();
        if (window.app && window.app.showToast) {
            window.app.showToast("🔧 ¡Dawn reparó las bobinas y engrasó los engranajes! Junker operativa.", "success");
        }
        this.render();
    }

    showSuccessResult(res) {
        // `SFXClip.JunkerEatRecipe`: salio la receta.
        if (window.PlaySfx) window.PlaySfx.sonar('junkerEatRecipe');
        const resultModal = document.getElementById('junker-result-banner');
        if (!resultModal) {
            if (window.app && window.app.showToast) {
                window.app.showToast(`${res.title}: ${res.message}`, "success");
            }
            return;
        }
        resultModal.classList.remove('hidden');
        resultModal.innerHTML = `
            <div style="text-align:center; padding:1.2rem; background:rgba(255,215,0,0.15); border:2px solid #f1c40f; border-radius:12px; margin-bottom:1rem;">
                <div style="font-size:2rem; margin-bottom:4px;">${res.isShiny ? '⭐✨' : '✨'}</div>
                <h3 style="margin:0 0 6px; color:#d35400;">${res.title}</h3>
                <img src="${res.item.spriteUrl}" alt="${res.item.name}" style="max-height:80px; margin:8px auto; display:block;" onerror="this.src='favicon.png'">
                <div style="font-weight:700; font-size:1.1rem; color:var(--text-main);">${res.item.name}</div>
                <p style="margin:8px 0 12px; font-size:0.88rem; color:var(--text-muted);">${res.message}</p>
                <button class="btn-primary" onclick="document.getElementById('junker-result-banner').classList.add('hidden')">¡Excelente!</button>
            </div>
        `;
    }

    showOverloadResult(res) {
        // `SFXClip.JunkerEatFail`: se paso de carga.
        if (window.PlaySfx) window.PlaySfx.sonar('junkerEatFail');
        const resultModal = document.getElementById('junker-result-banner');
        if (!resultModal) {
            if (window.app && window.app.showToast) {
                window.app.showToast(res.title, "error");
            }
            return;
        }
        resultModal.classList.remove('hidden');
        resultModal.innerHTML = `
            <div style="text-align:center; padding:1.2rem; background:rgba(231,76,60,0.15); border:2px solid #e74c3c; border-radius:12px; margin-bottom:1rem;">
                <div style="font-size:2.5rem; margin-bottom:4px;">⚡💥💨</div>
                <h3 style="margin:0 0 6px; color:#c0392b;">${res.title}</h3>
                <p style="margin:8px 0; font-size:0.9rem; color:var(--text-main);">${res.message}</p>
                <div style="font-style:italic; background:rgba(0,0,0,0.06); padding:8px 12px; border-radius:8px; margin:8px 0; font-size:0.85rem; color:#a93226;">
                    <strong>Dawn:</strong> "${res.dawnQuote}"
                </div>
                <button class="btn-secondary" onclick="document.getElementById('junker-result-banner').classList.add('hidden')">Entendido</button>
            </div>
        `;
    }

    render() {
        if (!this.modal) return;
        const state = this.junkerManager.getState();
        const isBusted = state && state.busted;

        // Estado general
        const statusBadge = document.getElementById('junker-status-badge');
        if (statusBadge) {
            if (isBusted) {
                statusBadge.textContent = "⚡ SOBRECARGADA / EN REPARACIÓN";
                statusBadge.style.background = "#e74c3c";
                statusBadge.style.color = "#fff";
            } else {
                statusBadge.textContent = "⚙️ LISTA PARA FUSIONAR";
                statusBadge.style.background = "#2ecc71";
                statusBadge.style.color = "#fff";
            }
        }

        const btnFuse = document.getElementById('btn-junker-fuse');
        const btnRepair = document.getElementById('btn-junker-repair');
        if (btnFuse) btnFuse.style.display = isBusted ? 'none' : 'inline-flex';
        if (btnRepair) btnRepair.style.display = isBusted ? 'inline-flex' : 'none';

        // Renderizar los 3 pedestales
        for (let i = 0; i < 3; i++) {
            const podEl = document.getElementById(`junker-pod-${i}`);
            if (!podEl) continue;
            const slot = this.junkerManager.slots[i];
            const isBroken = state && state.brokenNodes && state.brokenNodes[i];

            if (isBroken) {
                podEl.className = 'junker-pod broken';
                podEl.innerHTML = `
                    <div style="font-size:1.8rem; color:#e74c3c;">⚡</div>
                    <div style="font-size:0.75rem; color:#c0392b; font-weight:700;">NODO QUEMADO</div>
                `;
            } else if (slot) {
                podEl.className = 'junker-pod filled';
                podEl.innerHTML = `
                    <button class="pod-remove-btn" title="Quitar">&times;</button>
                    <img src="${slot.meta.spriteUrl}" alt="${slot.meta.name}" onerror="this.src='favicon.png'">
                    <div class="pod-title">${slot.meta.name}</div>
                `;
                const btnRemove = podEl.querySelector('.pod-remove-btn');
                if (btnRemove) {
                    btnRemove.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.junkerManager.clearSlot(i);
                        this.render();
                    });
                }
            } else {
                podEl.className = 'junker-pod empty';
                podEl.innerHTML = `
                    <div style="font-size:1.8rem; opacity:0.4;">➕</div>
                    <div style="font-size:0.78rem; opacity:0.6;">Pedestal #${i+1}</div>
                `;
            }
        }

        this.renderInventoryPicker();
    }

    renderInventoryPicker() {
        const picker = document.getElementById('junker-inv-picker');
        if (!picker) return;
        picker.innerHTML = '';

        const inv = this.junkerManager.parser?.inventory || [];
        const usableItems = inv.map((slot, idx) => ({ ...slot, invIndex: idx }))
                               .filter(slot => slot.item_id > 0 && slot.qty > 0);

        usableItems.forEach(slot => {
            const isAlreadyInPod = this.junkerManager.slots.some(s => s && s.invIndex === slot.invIndex);
            const meta = this.junkerManager.shopManager.getItemMeta(slot.item_id);

            const card = document.createElement('div');
            card.className = 'junker-inv-card' + (isAlreadyInPod ? ' selected' : '');
            card.title = meta.name;

            card.innerHTML = `
                <img src="${meta.spriteUrl}" alt="${meta.name}" onerror="this.src='favicon.png'">
                <div style="font-size:0.72rem; text-overflow:ellipsis; overflow:hidden; white-space:nowrap; width:100%; text-align:center;">${meta.name}</div>
                <div style="font-size:0.68rem; color:var(--text-muted);">x${slot.qty}</div>
            `;

            if (!isAlreadyInPod) {
                card.addEventListener('click', () => {
                    // Colocar en el primer pedestal disponible
                    const emptyIdx = this.junkerManager.slots.findIndex(s => s === null);
                    if (emptyIdx !== -1) {
                        this.junkerManager.setSlot(emptyIdx, slot.invIndex);
                        this.render();
                    } else {
                        showGlobalToast("Los 3 pedestales están llenos. Quita uno primero para cambiarlo.", "info");
                    }
                });
            }

            picker.appendChild(card);
        });
    }
}

// ─── Exportación Global ───────────────────────────────────────
if (typeof window !== 'undefined') {
    window.calcVerificationId = calcVerificationId;
    window.SHOPS_CONFIG = SHOPS_CONFIG;
    window.JUNKER_RECIPES = JUNKER_RECIPES;
    window.ShopManager = ShopManager;
    window.JunkerManager = JunkerManager;
    window.ShopUI = ShopUI;
    window.JunkerUI = JunkerUI;
}
if (typeof module !== 'undefined') {
    module.exports = {
        calcVerificationId,
        SHOPS_CONFIG,
        JUNKER_RECIPES,
        ShopManager,
        JunkerManager,
        ShopUI,
        JunkerUI
    };
}
