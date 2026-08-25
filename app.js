// ============================================================
// CharEnum map (0–99)
// ============================================================
const CHAR_NAMES = {
    0:"Tsuki",1:"Yori",2:"Chi",3:"Momo",4:"Pipi",5:"Elfie",6:"Tofu",7:"Benny",8:"Bobo",
    9:"Rosemary",10:"Moca",11:"BlockedNumber",12:"Draper",13:"Olson",14:"Dawn",15:"Ken",
    16:"Paige",17:"Ratthew",18:"Scarlett",19:"Camille",20:"Rudolph",21:"Floyd",22:"Slorchy",
    23:"Flynn",24:"Priscilla",25:"Kaira",26:"Otto",27:"Ophelia",28:"Oli",29:"Phyllis",
    30:"Jared",31:"Marcus",32:"Lucas",33:"Romeo",34:"Apple",35:"Chad",36:"Gary",37:"Toby",
    38:"Pat",39:"Afina",40:"Pawru",41:"Amos",42:"Brentley",43:"Wilson",44:"George",45:"Jacob",
    46:"Cyrus",47:"Imogen",48:"Boris",49:"Martin",50:"Kiyo",51:"Clyde",52:"Miki",53:"Juliet",
    54:"Stella",55:"Jace",56:"Carlson",57:"Cameron",58:"Rylene",59:"Katy",60:"Luna",
    61:"Elijah",62:"Charlie",63:"Ivy",64:"Millie",65:"Tucker",66:"Jude",67:"Remi",68:"Rian",
    69:"Kaden",70:"Barclay",71:"Basil",72:"Cinder",73:"TheConductor",74:"Duncan",75:"Emiko",
    76:"Emile",77:"Owens",78:"Theo",79:"Vision",80:"Antwaun",81:"Corey",82:"Ray",83:"Cassius",
    84:"Ezra",85:"Jones",86:"August",87:"Elliot",88:"Teresa",89:"Alexander",90:"Clementine",
    91:"Adrian",92:"Leon",93:"Tom",94:"Caleb",95:"Rhoden",96:"Devin",97:"Austin",98:"Hudson",99:"Breezy"
};

const EVENT_NAMES = {
    // NOTA: Estos IDs deben validarse contra el enum VillageEvent del código del juego (dump.cs).
    // Solo listamos los confirmados en archivos de guardado o con evidencia.
    0: "Año Nuevo / Primavera (Spring)",
    1: "San Valentín (Valentine's)",
    2: "Pascua (Easter)",
    3: "Jumper",
    4: "Festival de Verano (Summer)",
    5: "Halloween",
    6: "Cosecha de Otoño (Autumn Harvest)",
    7: "Solsticio de Invierno (Winter)",
    8: "Navidad (Christmas)",
    9: "Fin de Año (New Year's Eve)"
};

const SEASON_NAMES = { 0:"Primavera", 1:"Verano", 2:"Otoño", 3:"Invierno" };

const SLOCATION_NAMES = {
    0:"Home", 1:"YorisShop", 2:"ChisHouse", 3:"MocasHouse", 4:"Pier",
    5:"RosemarysShop", 6:"Farm", 7:"OpeningScene", 8:"TownHall",
    9:"MomosTeaHouse", 10:"TrainStation", 11:"DawnsShop", 12:"Dojo",
    13:"ScarlettsLounge", 14:"Travelling", 15:"SubwayStation", 16:"CityHall",
    17:"Exit", 18:"Skytower", 19:"CapsuleHotel", 20:"ApartmentLobby",
    21:"TheHole", 22:"Penthouse", 23:"ShoppingMall", 24:"MallEntrance",
    25:"RugShop", 26:"Winery", 27:"IceCreamShop", 28:"JewelryStore",
    29:"PostOffice", 30:"BubbleTea", 31:"ShoeStore", 32:"PoliceStation",
    33:"CoffeeShop", 34:"Apartment"
};

const REWARD_TYPES = {
    0: "🥕 Zanahorias",
    1: "🎟️ Tickets Gacha",
    2: "🎲 Re-roll",
    3: "📱 Skin Teléfono"
};

class App {
    constructor() {
        this.parser = null;
        this.map = null;
        this.fileName = "save.csave";
        // KNOWN_ITEMS and ITEM_SIZES are already set by the <script> tags
        // (extracted_items_v3.js / sizes.js) — do NOT reset them here.
        window.UNKNOWN_ITEMS = new Set();

// --- Nombres e Iconos ---
window.resolveItemName = function(id, invTypeHint) {
    if (!window.KNOWN_ITEMS) return `#${id} (Sin nombre)`;
    const furn = window.KNOWN_ITEMS[`FURN_${id}`];
    const item = window.KNOWN_ITEMS[`ITEM_${id}`];
    
    if (invTypeHint === 'furn' || invTypeHint === 'placement') {
        if (furn) return furn;
        if (item) return item;
    } else {
        if (item) return item;
        if (furn) return furn;
    }
    return `#${id} (Sin nombre)`;
};

window.imageErrorFallback = function(img, id, originalPrefix) {
    if (!img.dataset.triedFallback) {
        img.dataset.triedFallback = "true";
        const altPrefix = originalPrefix === 'FURN' ? 'ITEM' : 'FURN';
        img.src = `images/items/${altPrefix}_${id}.png`;
    } else {
        img.style.display = 'none'; // Ambos fallaron, ocultar o usar placeholder 1x1
    }
};

window.getSafeImageHTML = function(id, hint, extraAttrs = '') {
    const prefix = hint === 'furn' || hint === 'placement' ? 'FURN' : 'ITEM';
    return `<img src="images/items/${prefix}_${id}.png" onerror="window.imageErrorFallback(this, ${id}, '${prefix}')" ${extraAttrs}>`;
};


        this.initDOM();
        this.loadDictionaries();
    }

    reportUnknownItems() {
        const btn = document.getElementById('btn-save-items');
        if (!btn) return;
        
        if (!window.UNKNOWN_ITEMS || window.UNKNOWN_ITEMS.size === 0) {
            btn.classList.add('hidden');
            return;
        }
        
        btn.classList.remove('hidden');
        btn.onclick = () => {
            // Update known items dictionary
            let current = window.KNOWN_ITEMS || {};
            window.UNKNOWN_ITEMS.forEach(id => {
                const key = `FURN_${id}`;
                if (!current[key]) {
                    current[key] = `Desconocido #${id}`;
                }
            });
            
            // Format as extracted_items_v3.js
            const jsonStr = JSON.stringify(current, null, 2);
            const fileContent = `const ITEM_NAMES = ${jsonStr};\n`;
            
            // Trigger download
            const blob = new Blob([fileContent], { type: 'application/javascript' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'extracted_items_v3.js';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.showToast(`Descargado extracted_items_v3.js con ${window.UNKNOWN_ITEMS.size} nuevos items!`, 'success');
            
            // Hide button after download
            window.UNKNOWN_ITEMS.clear();
            btn.classList.add('hidden');
        };
    }

    // ─── Init ──────────────────────────────────────────────────────────

    resolveItemName(id, invType = null) {
        if (!window.KNOWN_ITEMS) return "Desconocido";
        const typeMap = { 0:"ITEM", 1:"FURN", 2:"CROP", 3:"FISH" };
        if (invType !== null && typeMap[invType]) {
            const exact = window.KNOWN_ITEMS[`${typeMap[invType]}_${id}`];
            if (exact) return exact;
        }
        for (const cat of ["FURN","ITEM","CROP","FISH"]) {
            const n = window.KNOWN_ITEMS[`${cat}_${id}`];
            if (n) return n;
        }
        
        // If we reach here, the item is unknown
        if (id > 0 && id !== 4294967295) {
            window.UNKNOWN_ITEMS.add(id);
        }
        
        return `#${id}`;
    }

    initDOM() {
        this.dropZone    = document.getElementById('drop-zone');
        this.fileInput   = document.getElementById('file-input');
        this.appContainer= document.getElementById('app-container');
        this.fileNameDisplay = document.getElementById('file-name-display');

        const canvas = document.getElementById('map-canvas');
        this.map = new IsometricMap(canvas, this);
        window.addEventListener('resize', () => this.map.resize());

        this.navItems   = document.querySelectorAll('.nav-item');
        this.tabContents= document.querySelectorAll('.tab-content');
        this.selectLocation = document.getElementById('select-location');
        this.selectFloor    = document.getElementById('select-floor');
        this.itemEditor = document.getElementById('item-editor');
        this.editItemId = document.getElementById('edit-item-id');
        this.editItemX  = document.getElementById('edit-item-x');
        this.editItemY  = document.getElementById('edit-item-y');
        this.editItemOri= document.getElementById('edit-item-ori');
        this.invTableBody = document.getElementById('inv-table-body');
        this.invSearch  = document.getElementById('inv-search');
        this.addInvType = document.getElementById('add-inv-type');
        this.addInvId   = document.getElementById('add-inv-id');
        this.addInvQty  = document.getElementById('add-inv-qty');

        // New Elements for Add Furniture
        this.btnAddFurniture = document.getElementById('btn-open-add-furniture');
        this.addItemEditor = document.getElementById('add-item-editor');
        this.addItemSelect = document.getElementById('add-item-select');
        this.addItemPreview = document.getElementById('add-item-preview');
        this.addItemX = document.getElementById('add-item-x');
        this.addItemY = document.getElementById('add-item-y');
        this.btnConfirmAddItem = document.getElementById('btn-confirm-add-item');
        this.btnCloseAddEditor = document.getElementById('btn-close-add-editor');

        // New Elements for Seed Planting
        this.seedPlantingUI = document.getElementById('seed-planting-ui');
        this.btnPlantSeed = document.getElementById('btn-plant-seed');
        this.editSeedSelect = document.getElementById('edit-seed-select');

        this.bindEvents();
    }

    updateInvDatalist() {
        const datalist = document.getElementById('add-inv-datalist');
        if (!datalist || !this.addInvType) return;
        
        datalist.innerHTML = '';
        if (!window.KNOWN_ITEMS) return;
        
        const typeMap = { 0:"ITEM", 1:"FURN", 2:"CROP", 3:"FISH" };
        const typ = parseInt(this.addInvType.value);
        const prefix = typeMap[typ] || "ITEM";
        
        for (const key in window.KNOWN_ITEMS) {
            if (key.startsWith(prefix + '_')) {
                const id = key.split('_')[1];
                const opt = document.createElement('option');
                opt.value = id;
                opt.textContent = `[${id}] ${window.KNOWN_ITEMS[key]}`;
                datalist.appendChild(opt);
            }
        }
    }

    loadDictionaries() {
        // Data is injected via <script> tags (extracted_items_v3.js / sizes.js / data/items_db.js)
        
        if (!window.KNOWN_ITEMS) window.KNOWN_ITEMS = {};
        if (!window.furnitureSizes) window.furnitureSizes = {};
        
        if (typeof ITEM_NAMES !== 'undefined') window.KNOWN_ITEMS = ITEM_NAMES;
        
        if (window.ITEMS_DB) {
            for (const id in window.ITEMS_DB) {
                const entry = window.ITEMS_DB[id];
                if (entry.item_name) window.KNOWN_ITEMS[`ITEM_${id}`] = entry.item_name;
                if (entry.furn_name) window.KNOWN_ITEMS[`FURN_${id}`] = entry.furn_name;
                
                // Populate furnitureSizes from ITEMS_DB for SizeEditor
                if (entry.width > 0 && entry.length > 0 && !window.furnitureSizes[id]) {
                    window.furnitureSizes[id] = { width: entry.width, length: entry.length };
                }
            }
        }

        window.ITEM_SIZES = window.furnitureSizes;
        
        window.getFurnitureSize = function(id) {
            const e = window.ITEMS_DB && window.ITEMS_DB[String(id)];
            if (e && e.width > 0 && e.length > 0) return { width: e.width, length: e.length };
            if (window.furnitureSizes && window.furnitureSizes[String(id)])
                return window.furnitureSizes[String(id)];
            return null;
        };

        console.log(`[App] Items loaded: ${Object.keys(window.KNOWN_ITEMS).length}`);

        if (this.addItemSelect) {
            this.addItemSelect.innerHTML = '';
            for (const key in window.KNOWN_ITEMS) {
                if (key.startsWith('FURN_')) {
                    const id = key.split('_')[1];
                    const opt = document.createElement('option');
                    opt.value = id;
                    opt.textContent = `[${id}] ${window.KNOWN_ITEMS[key]}`;
                    this.addItemSelect.appendChild(opt);
                }
            }
        }
        
        if (this.editSeedSelect && typeof SEED_IDS !== 'undefined') {
            this.editSeedSelect.innerHTML = '';
            for (const id of SEED_IDS) {
                const opt = document.createElement('option');
                opt.value = id;
                const name = window.KNOWN_ITEMS['FURN_' + id] || 'Semilla ' + id;
                opt.textContent = `[${id}] ${name}`;
                this.editSeedSelect.appendChild(opt);
            }
        }

        this.updateInvDatalist();
    }

    // ─── Events ────────────────────────────────────────────────────────

    bindEvents() {
        // Drag & Drop
        window.addEventListener('dragover', e => e.preventDefault());
        window.addEventListener('drop', e => e.preventDefault());
        this.dropZone.addEventListener('dragenter', e => { e.preventDefault(); this.dropZone.classList.add('dragover'); });
        this.dropZone.addEventListener('dragover',  e => { e.preventDefault(); this.dropZone.classList.add('dragover'); });
        this.dropZone.addEventListener('dragleave', e => { if (!this.dropZone.contains(e.relatedTarget)) this.dropZone.classList.remove('dragover'); });
        this.dropZone.addEventListener('drop', e => {
            e.preventDefault(); this.dropZone.classList.remove('dragover');
            if (e.dataTransfer.files.length) this.loadFile(e.dataTransfer.files[0]);
        });
        this.dropZone.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', e => { if (e.target.files.length) this.loadFile(e.target.files[0]); });

        // Export/Import Parcial (modal) — los botones existían en el HTML y la
        // lógica ya estaba escrita, pero no había ningún listener conectándolos.
        document.getElementById('close-export-modal')?.addEventListener('click', () => this.closeExportModal());
        document.getElementById('btn-cancel-export')?.addEventListener('click', () => this.closeExportModal());
        document.getElementById('btn-confirm-export')?.addEventListener('click', () => this.executeExportJSON());
        document.getElementById('close-import-modal')?.addEventListener('click', () => this.closeImportModal());
        document.getElementById('btn-cancel-import')?.addEventListener('click', () => this.closeImportModal());
        document.getElementById('btn-confirm-import')?.addEventListener('click', () => this.executeImportJSON());
        document.getElementById('import-file-input')?.addEventListener('change', e => this.handleImportFileSelect(e));

        // Drop global de JSON de nombres (fuera del drop-zone de .csave) — muestra
        // #drop-overlay mientras se arrastra un archivo y solo actúa si es .json.
        const dropOverlay = document.getElementById('drop-overlay');
        let dragDepth = 0;
        window.addEventListener('dragenter', e => {
            if (!this.parser) return; // Solo tiene sentido con un save ya cargado
            if (![...(e.dataTransfer?.items || [])].some(it => it.kind === 'file')) return;
            dragDepth++;
            if (dropOverlay) dropOverlay.style.display = 'flex';
        });
        window.addEventListener('dragleave', () => {
            dragDepth = Math.max(0, dragDepth - 1);
            if (dragDepth === 0 && dropOverlay) dropOverlay.style.display = 'none';
        });
        window.addEventListener('drop', e => {
            dragDepth = 0;
            if (dropOverlay) dropOverlay.style.display = 'none';
            const file = e.dataTransfer?.files?.[0];
            if (this.parser && file && file.name.endsWith('.json')) this.handleJSONDrop(e);
        });

        // Tabs
        this.navItems.forEach(btn => btn.addEventListener('click', () => {
            this.navItems.forEach(b => b.classList.remove('active'));
            this.tabContents.forEach(c => { c.classList.add('hidden'); c.classList.remove('active'); });
            btn.classList.add('active');
            const tab = document.getElementById(btn.dataset.target);
            tab.classList.remove('hidden');
            tab.classList.add('active');
            if (btn.dataset.target === 'tab-map') {
                this.map.resize();
                if (this.renderWallpapersTab) this.renderWallpapersTab();
            }
        }));

        // Farm mature all crops
        document.getElementById('btn-mature-all-crops')?.addEventListener('click', () => {
            if (!this.parser) return;
            const count = this.parser.matureAllCrops();
            this.showToast(count > 0 ? `☀️ ${count} cultivos madurados.` : 'ℹ️ No hay cultivos plantados o ya están maduros.');
            if (count > 0) {
                // update current editor if open
                if (!this.itemEditor.classList.contains('hidden') && this.map.selectedPlacement) {
                    this.openItemEditor(this.map.selectedPlacement);
                }
                this.map.draw();
            }
        });

        // Phone Tab Buttons
        document.getElementById('btn-punchcard-claim')?.addEventListener('click', () => {
            if (!this.parser) return;
            const state = this.parser.getPunchcardState();
            let count = 0;
            state.rewards.forEach(r => {
                if (!r.claimed) {
                    if (this.parser.setPunchcardSlot(r.index, true, r.isWeekly)) count++;
                }
            });
            if (count > 0) {
                this.showToast(`✅ ${count} recompensas reclamadas.`);
                this.renderPhoneTab();
            } else {
                this.showToast('ℹ️ Todas las recompensas ya estaban reclamadas.');
            }
        });

        document.getElementById('btn-punchcard-reset')?.addEventListener('click', () => {
            if (!this.parser) return;
            const state = this.parser.getPunchcardState();
            let count = 0;
            state.rewards.forEach(r => {
                if (r.claimed) {
                    if (this.parser.setPunchcardSlot(r.index, false, r.isWeekly)) count++;
                }
            });
            if (count > 0) {
                this.showToast(`🔄 Semana reseteada (${count} recompensas desmarcadas).`);
                this.renderPhoneTab();
            }
        });

        document.getElementById('btn-maps-unlock-all')?.addEventListener('click', () => {
            if (!this.parser) return;
            let count = 0;
            let failedToClone = false;
            Object.keys(SLOCATION_NAMES).forEach(locIdStr => {
                const locId = parseInt(locIdStr);
                const locs = this.parser.getLocationsOnPhone();
                const existing = locs.find(l => l.id === locId);
                if (!existing || !existing.seen) {
                    if (this.parser.setLocationUnlocked(locId, true)) {
                        count++;
                    } else if (!existing) {
                        failedToClone = true;
                    }
                }
            });
            if (count > 0) {
                this.showToast(`🗺️ ${count} ubicaciones desbloqueadas.`);
                this.renderPhoneTab();
            } else if (failedToClone) {
                this.showToast('❌ No hay plantilla LocationLock, visita un mapa en el juego primero.');
            } else {
                this.showToast('ℹ️ Todas las ubicaciones ya estaban desbloqueadas.');
            }
        });


        document.getElementById('btn-news-all-shown')?.addEventListener('click', () => {
            if (!this.parser) return;
            const news = this.parser.getNewspapers();
            let count = 0;
            news.forEach(n => {
                if (!n.shown) {
                    this.parser.setNewspaperStatus(n.id, true, n.done);
                    count++;
                }
            });
            this.showToast(`📰 ${count} periódicos marcados como vistos.`);
            if (this.renderNewsTab) this.renderNewsTab();
        });

        document.getElementById('btn-news-all-done')?.addEventListener('click', () => {
            if (!this.parser) return;
            const news = this.parser.getNewspapers();
            let count = 0;
            news.forEach(n => {
                if (!n.done) {
                    this.parser.setNewspaperStatus(n.id, n.shown, true);
                    count++;
                }
            });
            this.showToast(`✅ ${count} recompensas de periódicos completadas.`);
            if (this.renderNewsTab) this.renderNewsTab();
        });

        document.getElementById('btn-maps-unlock-main')?.addEventListener('click', () => {
            if (!this.parser) return;
            // Main locations: 0 to 13 (except 7 OpeningScene)
            const mainLocs = [0,1,2,3,4,5,6,8,9,10,11,12,13];
            let count = 0;
            let failedToClone = false;
            mainLocs.forEach(locId => {
                const locs = this.parser.getLocationsOnPhone();
                const existing = locs.find(l => l.id === locId);
                if (!existing || !existing.seen) {
                    if (this.parser.setLocationUnlocked(locId, true)) {
                        count++;
                    } else if (!existing) {
                        failedToClone = true;
                    }
                }
            });
            if (count > 0) {
                this.showToast(`🗺️ ${count} ubicaciones principales desbloqueadas.`);
                this.renderPhoneTab();
            } else if (failedToClone) {
                this.showToast('❌ No hay plantilla LocationLock, visita un mapa en el juego primero.');
            } else {
                this.showToast('ℹ️ Ubicaciones principales ya estaban desbloqueadas.');
            }
        });

        document.getElementById('btn-force-city-spawn')?.addEventListener('click', () => {
            if (!this.parser) return;
            const success = this.parser.applyCitySpawnTemplate();
            if (success) {
                this.showToast('✅ Plantilla inyectada: location fijado a 2, trip removido y activity clonada (Ciudad 19). Guarda el archivo.', 'success');
            } else {
                this.showToast('❌ Error: No se pudo inyectar la plantilla de ciudad.');
            }
        });

        // Phone Cosmetics
        document.getElementById('btn-phone-apply-ids')?.addEventListener('click', () => {
            if (!this.parser) return;
            const skinId = parseInt(document.getElementById('phone-skin-id').value);
            const patternId = parseInt(document.getElementById('phone-bg-pattern').value);
            const colorId = parseInt(document.getElementById('phone-bg-color').value);
            
            let changed = false;
            if (!isNaN(skinId)) changed |= this.parser.setPhoneCosmeticField('skinID', skinId);
            if (!isNaN(patternId)) changed |= this.parser.setPhoneCosmeticField('bgPatternID', patternId);
            if (!isNaN(colorId)) changed |= this.parser.setPhoneCosmeticField('bgColorID', colorId);
            
            if (changed) {
                this.showToast('📱 IDs de cosméticos guardados correctamente.');
                this.renderPhoneTab();
            } else {
                this.showToast('No se encontraron los campos en el save.', 'error');
            }
        });

        document.getElementById('btn-phone-unlock-bg')?.addEventListener('click', () => {
            if (!this.parser) return;
            if (this.parser.unlockAllPhoneBackgrounds()) {
                this.showToast('🖼️ Todos los fondos desbloqueados.');
                this.renderPhoneTab();
            } else {
                this.showToast('Error al desbloquear fondos.', 'error');
            }
        });

        document.getElementById('btn-phone-unlock-color')?.addEventListener('click', () => {
            if (!this.parser) return;
            if (this.parser.unlockAllPhoneColors()) {
                this.showToast('🎨 Todos los colores desbloqueados.');
                this.renderPhoneTab();
            } else {
                this.showToast('Error al desbloquear colores.', 'error');
            }
        });


        // Map
        this.selectLocation.addEventListener('change', () => { this.map.selectedPlacement = null; this.closeItemEditor(); this.map.draw(); if (this.renderWallpapersTab) this.renderWallpapersTab(); });
        this.selectFloor.addEventListener('change', () => { this.map.selectedPlacement = null; this.closeItemEditor(); this.map.draw(); });

        document.querySelectorAll('input[name="map-layer"]').forEach(radio => {
            radio.addEventListener('change', e => {
                const isWall = e.target.value === 'wall';
                const wallSelector = document.querySelector('.wall-group-selector');
                if (wallSelector) wallSelector.style.display = isWall ? 'block' : 'none';
                if (this.selectFloor && this.selectFloor.parentElement && this.selectFloor.parentElement.parentElement) {
                    this.selectFloor.parentElement.parentElement.style.display = isWall ? 'none' : 'block';
                }
                if (this.refreshWallGroupSelect) this.refreshWallGroupSelect();
                if (this.map) {
                    this.map.selectedPlacement = null;
                    this.map.hoveredPlacement = null;
                    this.map.draw();
                }
            });
        });

        document.getElementById('select-wall-group')?.addEventListener('change', () => {
            if (this.map) {
                this.map.selectedPlacement = null;
                this.map.hoveredPlacement = null;
                this.map.draw();
            }
        });

        document.getElementById('edit-item-flipped')?.addEventListener('change', e => {
            if (!this.map || !this.map.selectedPlacement) return;
            const p = this.map.selectedPlacement;
            p.flipped = e.target.checked;
            this.parser.setWallPlacementCell(p.placementID, { flipped: p.flipped });
            this.map.draw();
        });

        document.getElementById('btn-refresh-wallpapers')?.addEventListener('click', () => {
            if (this.renderWallpapersTab) this.renderWallpapersTab();
        });


        // Add Furniture Modal
        if (this.btnAddFurniture) {
            this.btnAddFurniture.addEventListener('click', () => {
                this.closeItemEditor();
                this.addItemEditor.classList.remove('hidden');
                if (this.addItemSelect.value) {
                    this.addItemPreview.src = `images/items/FURN_${this.addItemSelect.value}.png`;
                    this.addItemPreview.style.display = 'block';
                }
            });
        }
        if (this.btnCloseAddEditor) {
            this.btnCloseAddEditor.addEventListener('click', () => this.addItemEditor.classList.add('hidden'));
        }
        if (this.addItemSelect) {
            this.addItemSelect.addEventListener('change', e => {
                this.addItemPreview.src = `images/items/FURN_${e.target.value}.png`;
                this.addItemPreview.style.display = 'block';
            });
        }
        if (this.btnConfirmAddItem) {
            this.btnConfirmAddItem.addEventListener('click', () => this.executeAddFurniture());
        }

        // Save & Load buttons
        document.getElementById('btn-load-another').addEventListener('click', () => this.fileInput.click());
        document.getElementById('btn-save').addEventListener('click', () => this.saveAndDownload());

        // Item editor
        document.getElementById('btn-apply-item').addEventListener('click', () => {
            if (this.map.selectedPlacement) {
                const newId  = parseInt(this.editItemId.value);
                const newX   = parseInt(this.editItemX.value);
                const newY   = parseInt(this.editItemY.value);
                const newOri = parseInt(this.editItemOri.value);
                if (!isNaN(newId) && !isNaN(newX) && !isNaN(newY) && !isNaN(newOri)) {
                    this.parser.applyMapChange(this.map.selectedPlacement, newId, newX, newY, newOri);
                    this.showToast("✅ Mueble actualizado");
                    this.map.draw();
                }
            }
        });
        document.getElementById('btn-close-editor').addEventListener('click', () => {
            this.map.selectedPlacement = null; this.closeItemEditor(); this.map.draw();
        });
        
        if (this.btnPlantSeed) {
            this.btnPlantSeed.addEventListener('click', () => this.executePlantSeed());
        }
        
        const btnMature = document.getElementById('btn-mature-crop');
        if (btnMature) {
            btnMature.addEventListener('click', () => this.executeMatureCrop());
        }

        document.getElementById('btn-float-rot-left').addEventListener('click', () => {
            if (this.map && this.map.selectedPlacement) {
                this.map.rotateSelected(-1);
            }
        });
        document.getElementById('btn-float-rot-right').addEventListener('click', () => {
            if (this.map && this.map.selectedPlacement) {
                this.map.rotateSelected(1);
            }
        });

        // Inventory
        this.invSearch.addEventListener('input', () => this.renderInventory());
        if (this.addInvType) this.addInvType.addEventListener('change', () => this.updateInvDatalist());
        
        document.getElementById('btn-clear-inv')?.addEventListener('click', () => {
            if (!this.parser || !this.parser.inventory) return;
            if (!confirm('¿Estás seguro de que quieres limpiar TODO el inventario? Se conservará 1 ítem por defecto para evitar errores. Esta acción no se puede deshacer.')) return;
            
            let keptOne = false;
            let count = 0;
            for (let i = 0; i < this.parser.inventory.length; i++) {
                if (this.parser.inventory[i].item_id !== -1) {
                    if (!keptOne) {
                        keptOne = true;
                        continue;
                    }
                    this.parser.clearInventoryItem('inventory', i);
                    count++;
                }
            }
            if (!keptOne) {
                this.parser.injectInventoryItem(201, 1, false, 0); // Inject 1 Gacha Ticket if it was totally empty
            }
            
            this.renderInventory();
            this.showToast(`🗑️ Inventario limpiado (${count} items eliminados).`);
        });

        document.getElementById('btn-apply-all').addEventListener('click', () => this.saveAllInvItems());
        const addBtn = document.getElementById('btn-add-inv-item');
        if (addBtn) addBtn.addEventListener('click', () => this.addInventoryItem());
        
        const capOverride = document.getElementById('inv-capacity-override');
        if (capOverride) capOverride.addEventListener('input', () => this.renderInventory());
        
        const moveExcessBtn = document.getElementById('btn-inv-move-excess');
        if (moveExcessBtn) moveExcessBtn.addEventListener('click', () => {
            if (!this.parser) return;
            const override = capOverride ? capOverride.value : null;
            const info = this.parser.getInventoryCapacityInfo(override);
            const moved = this.parser.moveExcessToHidden(info.capacity);
            this.showToast(`🎒 Se movieron ${moved} items al inventario oculto.`);
            this.renderInventory();
        });
        
        const btnAddBag = document.getElementById('btn-add-bag');
        const selectAddBag = document.getElementById('select-add-bag');
        if (btnAddBag && selectAddBag) {
            btnAddBag.addEventListener('click', () => {
                const bagId = parseInt(selectAddBag.value);
                if (isNaN(bagId)) {
                    this.showToast("⚠️ Selecciona una bolsa primero.");
                    return;
                }
                if (!this.parser) return;
                try {
                    this.parser.injectInventoryItem(bagId, 1, false, 0); // Bags are items (invType=0)
                    this.showToast(`🎒 Bolsa (ID ${bagId}) añadida al inventario.`);
                    this.renderInventory();
                } catch (e) {
                    this.showToast(`❌ ${e.message}`);
                }
            });
        }

        // General Vars
        document.getElementById('btn-apply-vars').addEventListener('click', () => this.applyGeneralVars());

        // NPCs
        document.getElementById('btn-max-friendship').addEventListener('click', () => this.maxAllFriendship());
        document.getElementById('btn-reset-pester').addEventListener('click', () => this.resetAllPester());
        document.getElementById('btn-apply-npc').addEventListener('click', () => this.applyNPCChanges());

        // Train
        document.getElementById('btn-apply-train').addEventListener('click', () => this.applyTrainChanges());

        const btnForceTrip = document.getElementById('btn-force-trip');
        if (btnForceTrip) {
            btnForceTrip.addEventListener('click', () => {
                if (!this.parser || !this.parser.ast) {
                    this.showToast('Carga un save primero.', 'error');
                    return;
                }
                const success = this.parser.applyCitySpawnTemplate();
                
                if (success) {
                    this.showToast('✅ Viaje/Spawn en Ciudad inyectado exitosamente (Estrategia estable).', 'success');
                    if (typeof this.renderTrainTab === 'function') this.renderTrainTab();
                } else {
                    this.showToast('❌ Error desconocido al forzar el viaje.', 'error');
                }
            });
        }


        // Farm actions (Map tab)
        const _bindFarm = (id, fn) => { const el = document.getElementById(id); if (el) el.addEventListener('click', fn); };
        _bindFarm('btn-add-plot',        () => this.farmAddItem(306, 1,  'Parcela de tierra (FURN_306)'));
        _bindFarm('btn-add-seeds',       () => this.farmAddItem(342, 10, 'Semillas de Zanahoria (FURN_342)'));
        _bindFarm('btn-auto-harvest',    () => this.farmAutoHarvest());
        _bindFarm('btn-collect-carrots', () => this.farmCollectCarrots(9999));
        
        const btnClean = document.getElementById('btn-clean-seeds');
        if (btnClean) {
            btnClean.addEventListener('click', () => {
                if (!this.parser) return;
                const count = this.parser.cleanBuggySeeds();
                this.showToast(`🧹 Se han limpiado ${count} semillas bugeadas del mapa!`);
                if (count > 0) this.drawMap();
            });
        }

        // Audio
        document.addEventListener("DOMContentLoaded", () => {
            const bgMusic = new Audio("https://files.catbox.moe/gkji45.mp3");
            bgMusic.volume = 0.25; bgMusic.loop = true;
            const startAudio = () => bgMusic.play().then(() => {
                document.removeEventListener("click", startAudio);
                document.removeEventListener("keydown", startAudio);
            }).catch(() => {});
            startAudio();
            document.addEventListener("click", startAudio);
            document.addEventListener("keydown", startAudio);
        });
    }

    // ─── File Load ────────────────────────────────────────────────────

    loadFile(file) {
        this.fileName = file.name;
        this.fileNameDisplay.textContent = this.fileName;
        const reader = new FileReader();
        reader.onload = e => {
            try {
                this.parser = new SaveParser(e.target.result);
                
                // Parse AST for structure-aware mapping
                try {
                    const reader = new OdinReader(this.parser.buffer.buffer);
                    let ast = reader.parse();
                    if (Array.isArray(ast)) ast = ast[0];
                    this.parser.ast = ast;
                } catch (err) {
                    console.error('Error parsing AST:', err);
                }
                
                this.parseData();
                this.dropZone.classList.add('hidden');
                this.appContainer.classList.remove('hidden');
                
                setTimeout(() => {
                    this.map.resize();
                    this.reportUnknownItems();
                }, 100);

            } catch (err) {
                console.error(err);
                this.showToast('Error procesando el archivo: ' + err.message, 'error');
            }
        };
        reader.readAsArrayBuffer(file);
    }

    parseData() {
        // General vars
        this.parser.parseGeneralVars();
        this.populateVarsTab();

        // Map
        const prevLoc = this.selectLocation.value;
        this.parser.parseMap();
        this.selectLocation.innerHTML = '';
        // Friendly location names from SUBLOC_NAMES defined in map.js
        Array.from(this.parser.clusters).sort((a,b) => a-b).forEach(c => {
            const opt = document.createElement('option');
            opt.value = c;
            const friendlyName = (typeof SUBLOC_NAMES !== 'undefined' && SUBLOC_NAMES[c])
                ? SUBLOC_NAMES[c]
                : (typeof c === 'string' && c.startsWith('train_vagon_')) 
                    ? `Tren - Vagón ${c.split('_')[2]}` 
                    : `Ubicación ${c}`;
            opt.textContent = friendlyName;
            this.selectLocation.appendChild(opt);
        });
        if (prevLoc && Array.from(this.parser.clusters).some(c => c.toString() === prevLoc)) {
            this.selectLocation.value = prevLoc;
        }
        // Trigger initial label update
        const locLabel = document.getElementById('location-label');
        if (locLabel && this.parser.clusters.size > 0) {
            const firstCluster = Array.from(this.parser.clusters).sort((a,b) => a-b)[0];
            locLabel.textContent = (typeof SUBLOC_NAMES !== 'undefined' && SUBLOC_NAMES[firstCluster])
                ? SUBLOC_NAMES[firstCluster] : '';
        }

        // Inventory
        this.parser.parseInventory();
        this.renderInventory();

        // NPCs
        this.parser.parseNPCSaves();
        this.renderNPCTab();

        // Events
        this.parser.parseEventSaves();
        this.renderEventsTab();

        // Phone (Punchcard & Locations)
        this.renderTimersAndEvents();

        this.renderPhoneTab();
        this.renderMailTab();

                // Train
        this.parser.parseTrainSave();
        this.renderTrainTab();

        if (this.renderNewsTab) this.renderNewsTab();
        if (this.renderMailUniqueOrders) this.renderMailUniqueOrders();
        if (this.renderTrainExtra) this.renderTrainExtra();
        if (this.renderExperimentalStructures) this.renderExperimentalStructures();
        if (this.renderExtraVars) this.renderExtraVars();
    }

    // ─── General Variables Tab ────────────────────────────────────────

    populateVarsTab() {
        const vars = this.parser.generalVars;
        const setVal = (id, key) => {
            const el = document.getElementById(id);
            if (el && vars[key] !== undefined) el.value = vars[key].value;
        };
        setVal('input-carrots', 'carrots');
        
        // Custom logic to read Gacha Tickets from inventory (ITEM_1, invType 0)
        const gachaInput = document.getElementById('input-gacha-tickets');
        if (gachaInput && this.parser.inventory) {
            const gachaTicket = this.parser.inventory.find(it => it.item_id === 1 && it.invType === 0);
            gachaInput.value = gachaTicket ? gachaTicket.qty : 0;
        }

        setVal('input-day', 'day');
        setVal('input-month', 'month');
        setVal('input-hour', 'hour');
        setVal('input-raven', 'ravenChapter');
        setVal('input-gacha', 'gachaRolled');
        setVal('input-unluckiness', 'unluckiness');
        setVal('input-fish-caught', 'fishCaught');
        setVal('input-orders', 'ordersMade');
        setVal('input-clover', 'cloversBred');
        setVal('input-nodes', 'nodesBroken');
        setVal('input-bedtime-start', 'startBedtime');
        setVal('input-bedtime-end', 'endBedtime');

        // Season selector
        const seasonEl = document.getElementById('select-season');
        if (seasonEl && vars['season'] !== undefined) seasonEl.value = vars['season'].value;

        // Homecoming booleans
        const hcIOS = document.getElementById('chk-homecoming-ios');
        const hcAnd = document.getElementById('chk-homecoming-android');
        if (hcIOS && vars['homecomingIOS'] !== undefined) hcIOS.checked = vars['homecomingIOS'].value;
        if (hcAnd && vars['homecomingAndroid'] !== undefined) hcAnd.checked = vars['homecomingAndroid'].value;

        // Expanded house (currSLocData)
        const hcTierSelect = document.getElementById('select-homecoming-tier');
        if (hcTierSelect) {
            const homeTier = this.parser.getHomeCurrSLocData();
            if (homeTier === null) {
                hcTierSelect.disabled = true;
                hcTierSelect.title = "No se encontró sublocación Home en el guardado";
            } else {
                hcTierSelect.disabled = false;
                hcTierSelect.value = homeTier.toString();
            }
        }
    }

    applyGeneralVars() {
        const applyField = (inputId, varKey) => {
            const el = document.getElementById(inputId);
            if (!el) return;
            const v = parseFloat(el.value);
            if (!isNaN(v)) this.parser.writeGeneralVar(varKey, v);
        };
        applyField('input-carrots', 'carrots');

        const gachaInput = document.getElementById('input-gacha-tickets');
        if (gachaInput && this.parser.inventory) {
            const qty = parseInt(gachaInput.value);
            if (!isNaN(qty) && qty >= 0) {
                const existing = this.parser.inventory.find(it => it.item_id === 1);
                if (existing) {
                    this.parser.updateInventoryItem('inventory', this.parser.inventory.indexOf(existing), 1, qty, 0);
                    this.renderInventory();
                } else if (qty > 0) {
                    this.parser.injectInventoryItem(1, qty, false, 0);
                    this.renderInventory();
                }
            }
        }

        applyField('input-day', 'day');
        applyField('input-month', 'month');
        applyField('input-hour', 'hour');
        applyField('input-raven', 'ravenChapter');
        applyField('input-gacha', 'gachaRolled');
        applyField('input-unluckiness', 'unluckiness');
        applyField('input-fish-caught', 'fishCaught');
        applyField('input-orders', 'ordersMade');
        applyField('input-clover', 'cloversBred');
        applyField('input-nodes', 'nodesBroken');
        applyField('input-bedtime-start', 'startBedtime');
        applyField('input-bedtime-end', 'endBedtime');

        const seasonEl = document.getElementById('select-season');
        if (seasonEl) this.parser.writeGeneralVar('season', parseInt(seasonEl.value));

        const hcIOS = document.getElementById('chk-homecoming-ios');
        const hcAnd = document.getElementById('chk-homecoming-android');
        if (hcIOS) this.parser.writeGeneralVar('homecomingIOS', hcIOS.checked);
        if (hcAnd) this.parser.writeGeneralVar('homecomingAndroid', hcAnd.checked);

        // Apply Expanded House
        const tierEl = document.getElementById('select-homecoming-tier');
        if (tierEl && !tierEl.disabled) {
            const tier = parseInt(tierEl.value, 10);
            const ok = this.parser.setHomeCurrSLocData(tier);
            if (!ok) {
                this.showToast('No se pudo escribir currSLocData de Home (subloc no encontrada o sin campo)', 'error');
            } else if (tier === 1 && !(hcAnd?.checked || hcIOS?.checked)) {
                this.showToast('Casa ampliada aplicada, pero Homecoming está off: el juego puede no mostrar el 2º piso', 'warning');
            }
        }

        this.showToast("✅ Variables generales aplicadas");
    }

    // ─── NPC Tab ──────────────────────────────────────────────────────

    renderNPCTab() {
        const tbody = document.getElementById('npc-table-body');
        if (!tbody) return;
        tbody.innerHTML = '';

        const filter = (document.getElementById('npc-search') || {}).value?.toLowerCase() || '';

        this.parser.npcSaves.forEach((npc, idx) => {
            const name = CHAR_NAMES[npc.charId] || `NPC ${npc.charId}`;
            if (filter && !name.toLowerCase().includes(filter) && !String(npc.charId).includes(filter)) return;

            const tr = document.createElement('tr');
            const friendPct = Math.min(100, Math.round(npc.friendship / 100));
            const barColor = npc.friendship >= 5000 ? '#496800' : npc.friendship >= 2000 ? '#FF8C00' : '#6f4627';
            tr.innerHTML = `
                <td style="font-weight:700;">${npc.charId}</td>
                <td>${name}</td>
                <td>
                    <div class="npc-friend-bar">
                        <div class="npc-friend-fill" style="width:${Math.min(100, npc.friendship/100)}%; background:${barColor};"></div>
                    </div>
                    <input type="number" class="inv-input" id="npc-friendship-${idx}" value="${npc.friendship}" min="0" max="99999" style="width:90px;margin-top:4px;">
                </td>
                <td>
                    <input type="number" class="inv-input" id="npc-pester-${idx}" value="${npc.pester}" min="0" max="999" style="width:70px;">
                </td>
                <td>
                    <div class="row-actions">
                        <button class="btn-primary btn-small" onclick="window.app.applyNPCSingle(${idx})">✔</button>
                        <button class="btn-secondary btn-small" onclick="window.app.maxNPCSingle(${idx})">Max</button>
                        <button class="btn-danger btn-small" onclick="window.app.resetNPCPesterSingle(${idx})">No Pester</button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    applyNPCSingle(idx) {
        const fEl = document.getElementById(`npc-friendship-${idx}`);
        const pEl = document.getElementById(`npc-pester-${idx}`);
        if (fEl) this.parser.setNPCFriendship(idx, parseInt(fEl.value) || 0);
        if (pEl) this.parser.setNPCPester(idx, parseInt(pEl.value) || 0);
        this.showToast(`✅ NPC ${CHAR_NAMES[this.parser.npcSaves[idx]?.charId] || idx} actualizado`);
        this.renderNPCTab();
    }

    maxNPCSingle(idx) {
        this.parser.setNPCFriendship(idx, 99999);
        this.showToast(`💛 Amistad máxima: ${CHAR_NAMES[this.parser.npcSaves[idx]?.charId] || idx}`);
        this.renderNPCTab();
    }

    resetNPCPesterSingle(idx) {
        this.parser.setNPCPester(idx, 0);
        this.showToast(`😊 Pester reseteado: ${CHAR_NAMES[this.parser.npcSaves[idx]?.charId] || idx}`);
        this.renderNPCTab();
    }

    
    unlockAllCollection() {
        if (!this.parser || !window.KNOWN_ITEMS) return;
        const ids = Object.keys(window.KNOWN_ITEMS).map(k => {
            const parts = k.split('_');
            return Number(parts[1]);
        }).filter(n => !isNaN(n));
        
        const added = this.parser.maxAllCollection(ids);
        if (added !== false) {
            this.showToast('✅ Se añadieron ' + added + ' objetos a la Colección.');
        } else {
            this.showToast('❌ Error: Nodo collection no encontrado.', 'error');
        }
    }

    unlockAllParsnaps() {
        if (!this.parser) return;
        const added = this.parser.unlockAllParsnaps(250);
        if (added !== false) {
            this.showToast('📸 Se desbloquearon ' + added + ' nuevos Parsnaps en el Diario.');
        } else {
            this.showToast('❌ Error: Nodo diarySaves vacío o no encontrado.', 'error');
        }
    }

    renderTimersAndEvents() {
        if (!this.parser) return;

        const timersContainer = document.getElementById('timers-container');
        if (timersContainer) {
            timersContainer.innerHTML = '';
            const timers = this.parser.getTempTimers();
            if (timers.length === 0) {
                timersContainer.innerHTML = '<p class="subtitle">No hay temporizadores activos.</p>';
            } else {
                timers.forEach(t => {
                    const grp = document.createElement('div');
                    grp.className = 'input-group';
                    const lbl = document.createElement('label');
                    lbl.textContent = t.id || 'Unknown Timer';
                    const inp = document.createElement('input');
                    inp.type = 'number';
                    inp.value = t.minutesActive;
                    inp.onchange = (e) => {
                        if (this.parser.setTempTimerMinutes(t.id, e.target.value)) {}
                    };
                    const btn = document.createElement('button');
                    btn.className = 'btn-secondary btn-sm';
                    btn.textContent = 'Forzar Fin (0)';
                    btn.style.marginTop = '4px';
                    btn.onclick = () => {
                        inp.value = 0;
                        if (this.parser.setTempTimerMinutes(t.id, 0)) {}
                    };
                    grp.appendChild(lbl);
                    grp.appendChild(inp);
                    grp.appendChild(btn);
                    timersContainer.appendChild(grp);
                });
            }
        }

        const spEventsContainer = document.getElementById('sp-events-container');
        if (spEventsContainer) {
            spEventsContainer.innerHTML = '';
            const sps = this.parser.getSpEventSaves();
            if (sps.length === 0) {
                spEventsContainer.innerHTML = '<p class="subtitle">No hay eventos especiales activos.</p>';
            } else {
                sps.forEach((sp, i) => {
                    const card = document.createElement('div');
                    card.className = 'input-group';
                    card.style.border = '1px solid #ddd';
                    card.style.padding = '8px';
                    card.style.borderRadius = '4px';
                    
                    const title = document.createElement('label');
                    title.textContent = `Evento ${sp.eventID} (${sp.year})`;
                    card.appendChild(title);
                    
                    const createCheck = (labelTxt, field) => {
                        const lbl = document.createElement('label');
                        lbl.style.display = 'flex';
                        lbl.style.alignItems = 'center';
                        lbl.style.gap = '5px';
                        lbl.style.fontWeight = 'normal';
                        lbl.style.marginTop = '4px';
                        const chk = document.createElement('input');
                        chk.type = 'checkbox';
                        chk.checked = !!sp[field];
                        chk.onchange = (e) => {
                            if (this.parser.setSpEventField(i, field, e.target.checked)) {}
                        };
                        lbl.appendChild(chk);
                        lbl.appendChild(document.createTextNode(labelTxt));
                        return lbl;
                    };
                    
                    card.appendChild(createCheck('Cutscene Vista', 'ranCutscene'));
                    card.appendChild(createCheck('Carta Triggered', 'letterTriggered'));
                    
                    spEventsContainer.appendChild(card);
                });
            }
        }
    }

    applyNPCChanges() {
        this.parser.npcSaves.forEach((_, idx) => this.applyNPCSingle(idx));
        this.showToast("✅ Todos los NPCs actualizados");
    }

    maxAllFriendship() {
        this.parser.npcSaves.forEach((_, idx) => this.parser.setNPCFriendship(idx, 99999));
        
        let conditionUpdates = 0;
        if (typeof this.parser.unlockAllNPCConditions === 'function') {
            conditionUpdates = this.parser.unlockAllNPCConditions(3);
        }

        if (conditionUpdates > 0) {
            this.showToast('✅ Amistad máxima y ' + conditionUpdates + ' hitos de historia (Nivel 3) inyectados.');
        } else {
            this.showToast("✅ Amistad máxima para TODOS los personajes");
        }
        
        this.renderNPCTab();
    }

    resetAllPester() {
        this.parser.npcSaves.forEach((_, idx) => this.parser.setNPCPester(idx, 0));
        this.showToast("😊 Pester reseteado para todos los personajes");
        this.renderNPCTab();
    }

    // ─── Events Tab ───────────────────────────────────────────────────

    renderEventsTab() {
        if (!this.parser) return;
        
        const state = this.parser.getVillageEventState();
        const evSelect = document.getElementById('select-event-index');
        const evContainer = document.getElementById('event-edit-container');
        
        if (!state.present || state.all.length === 0) {
            if(evSelect) {
                evSelect.innerHTML = '<option value="">No hay eventos en el save</option>';
                evSelect.disabled = true;
            }
            if(evContainer) evContainer.style.display = 'none';
            const ndMsg = document.getElementById('events-no-data-msg');
            if(ndMsg) ndMsg.style.display = 'block';
            return;
        }
        
        if(document.getElementById('events-no-data-msg')) document.getElementById('events-no-data-msg').style.display = 'none';
        if(evSelect) evSelect.disabled = false;
        if(evContainer) evContainer.style.display = 'block';
        
        let selectedIndex = parseInt(evSelect.value);
        if (isNaN(selectedIndex) || !state.all.find(e => e.index === selectedIndex)) {
            // "Activo" = el de mayor year o mayor index
            const activeEvent = state.all.reduce((prev, curr) => (curr.year >= prev.year ? curr : prev), state.all[0]);
            selectedIndex = activeEvent.index;
        }
        
        if(evSelect) {
            evSelect.innerHTML = '';
            state.all.forEach(ev => {
                const name = EVENT_NAMES[ev.eventID] || `Event #${ev.eventID}`;
                const opt = document.createElement('option');
                opt.value = ev.index;
                opt.textContent = `[${ev.index}] ${name} - Año ${ev.year}`;
                if (ev.index === selectedIndex) opt.selected = true;
                evSelect.appendChild(opt);
            });
        }
        
        const currentEvent = state.all.find(e => e.index === selectedIndex);
        if (!currentEvent) return;
        
        if(document.getElementById('event-id-input')) document.getElementById('event-id-input').value = currentEvent.eventID;
        if(document.getElementById('event-year-input')) document.getElementById('event-year-input').value = currentEvent.year;
        if(document.getElementById('event-flyer-cb')) document.getElementById('event-flyer-cb').checked = currentEvent.shownFlyer;
        if(document.getElementById('event-calendar-cb')) document.getElementById('event-calendar-cb').checked = currentEvent.shownCalendar;
        if(document.getElementById('event-tasks-input')) document.getElementById('event-tasks-input').value = currentEvent.tasksCompleted.join(', ');
        
        // Rewards HC
        for (let i = 0; i < 4; i++) {
            const cb = document.getElementById(`event-reward-${i}`);
            if (cb) cb.checked = currentEvent.rewardsClaimed[i] || false;
        }
    }

    applyEventChanges() {
        if (!this.parser) return;
        const evSelect = document.getElementById('select-event-index');
        if(!evSelect) return;
        const index = parseInt(evSelect.value);
        if (isNaN(index)) return;
        
        const eventID = parseInt(document.getElementById('event-id-input').value);
        const year = parseInt(document.getElementById('event-year-input').value);
        const shownFlyer = document.getElementById('event-flyer-cb').checked;
        const shownCalendar = document.getElementById('event-calendar-cb').checked;
        const tasksStr = document.getElementById('event-tasks-input').value;
        const tasksCompleted = tasksStr.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
        
        const rewardsClaimed = [];
        for (let i = 0; i < 4; i++) {
            rewardsClaimed.push(document.getElementById(`event-reward-${i}`).checked);
        }
        
        if (year < 2020 || year > 2035) {
            this.showToast('⚠️ Año inusual detectado.', 'warning');
        }

        let updated = false;
        if (this.parser.setVillageEventField(index, 'eventID', eventID)) updated = true;
        if (this.parser.setVillageEventField(index, 'year', year)) updated = true;
        if (this.parser.setVillageEventField(index, 'shownFlyer', shownFlyer)) updated = true;
        if (this.parser.setVillageEventField(index, 'shownCalendar', shownCalendar)) updated = true;
        if (this.parser.setVillageEventTasksCompleted(index, tasksCompleted)) updated = true;
        if (this.parser.setVillageEventRewardsClaimed(index, rewardsClaimed)) updated = true;
        
        if (updated) {
            this.showToast('✅ Evento actualizado.');
            this.renderEventsTab();
        } else {
            this.showToast('❌ Error al actualizar el evento.', 'error');
        }
    }

    // ─── Train Tab ────────────────────────────────────────────────────

    renderTrainTab() {
        if (!this.parser.trainSave) return;
        const t = this.parser.trainSave;
        const dayEl = document.getElementById('input-train-day');
        const numEl = document.getElementById('input-train-number');
        if (dayEl) dayEl.value = t.trainDay;
        if (numEl) numEl.value = t.trainNumber;

        const statusEl = document.getElementById('train-status');
        if (statusEl) {
            if (t.trainDay > 0 && t.trainNumber > 0) {
                statusEl.textContent = `🚂 Tren activo — Día ${t.trainDay}, Número ${t.trainNumber}`;
                statusEl.className = 'train-status-badge active';
            } else {
                statusEl.textContent = `🏘️ Sin viaje activo`;
                statusEl.className = 'train-status-badge';
            }
        }
    }

    applyTrainChanges() {
        const dayEl = document.getElementById('input-train-day');
        const numEl = document.getElementById('input-train-number');
        if (dayEl) this.parser.setTrainDay(parseInt(dayEl.value) || 0);
        if (numEl) this.parser.setTrainNumber(parseInt(numEl.value) || 0);
        this.renderTrainTab();
        this.showToast("✅ Train Save actualizado");
    }

    // ─── Inventory ────────────────────────────────────────────────────

    renderInventory() {
        if (!this.parser) return;
        this.invTableBody.innerHTML = '';
        
        // --- Update Capacity UI ---
        const overrideInput = document.getElementById('inv-capacity-override');
        const capInfo = this.parser.getInventoryCapacityInfo(overrideInput ? overrideInput.value : null);
        const capText = document.getElementById('inv-capacity-text');
        const capSubtext = document.getElementById('inv-capacity-subtext');
        const moveBtn = document.getElementById('btn-inv-move-excess');
        
        if (capText) {
            if (capInfo.source === 'bag_unknown') {
                capText.textContent = `${capInfo.used} / ?`;
            } else {
                capText.textContent = `${capInfo.used} / ${capInfo.infinite ? '∞' : capInfo.capacity}`;
            }
            
            if (capSubtext) {
                if (capInfo.infinite) {
                    capSubtext.textContent = '(bolsa infinita)';
                } else if (capInfo.source === 'manual') {
                    capSubtext.textContent = '(manual)';
                } else if (capInfo.source === 'bag') {
                    const bagNames = capInfo.bags.map(b => b.name).join(', ');
                    capSubtext.textContent = `(${bagNames})`;
                } else if (capInfo.source === 'bag_unknown') {
                    const bagNames = capInfo.bags.map(b => b.name).join(', ');
                    capSubtext.textContent = `(${bagNames} detectadas, capacidad desconocida)`;
                } else {
                    capSubtext.textContent = '(default 50)';
                }
            }

            if (!capInfo.infinite && capInfo.used > capInfo.capacity) {
                capText.style.color = '#e74c3c'; // Red warning
                if (moveBtn) moveBtn.classList.remove('hidden');
            } else {
                capText.style.color = '#27ae60'; // Green ok
                if (moveBtn) moveBtn.classList.add('hidden');
            }
        }
        
        const filter = this.invSearch.value.toLowerCase();

        this.parser.inventory.forEach((item, index) => {
            if (item.item_id === -1) return;
            const invT = Number(item.invType);
            const name = this.resolveItemName(item.item_id, invT);
            if (filter && !`${item.item_id} ${name}`.toLowerCase().includes(filter)) return;

            const typeMap = {0:"ITEM",1:"FURN",2:"CROP",3:"FISH"};
            const prefix = typeMap[invT] || "ITEM";

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <img src="images/items/${prefix}_${item.item_id}.png" class="item-icon"
                         onerror="this.style.display='none'" alt="Icon">
                </td>
                <td>
                    <div class="inv-item-col">
                        <select class="inv-input type-input" id="inv-type-${index}" style="width:80px;margin-bottom:4px;">
                            <option value="0" ${invT===0?'selected':''}>Objeto</option>
                            <option value="1" ${invT===1?'selected':''}>Mueble</option>
                            <option value="2" ${invT===2?'selected':''}>Cultivo</option>
                            <option value="3" ${invT===3?'selected':''}>Pez</option>
                        </select>
                        <input type="number" class="inv-input id-input" value="${item.item_id}" id="inv-id-${index}">
                        <input type="text" class="inv-input name-input" value="${name}" id="inv-name-${index}" placeholder="Nombre">
                    </div>
                </td>
                <td style="text-align:center;">
                    <input type="number" class="inv-input qty-input" value="${item.qty}" min="1" id="inv-qty-${index}">
                </td>
                <td style="text-align:right;">
                    <div class="row-actions">
                        <button class="btn-primary btn-small" onclick="window.app.saveInvItem(${index})">✔</button>
                        <button class="btn-danger btn-small" onclick="window.app.deleteInvItem(${index})">✕</button>
                    </div>
                </td>
            `;
            this.invTableBody.appendChild(tr);

            const idInput   = tr.querySelector(`#inv-id-${index}`);
            const typeInput = tr.querySelector(`#inv-type-${index}`);
            const nameInput = tr.querySelector(`#inv-name-${index}`);
            const imgTag    = tr.querySelector('.item-icon');

            const updateUI = () => {
                const id  = idInput.value;
                const typ = parseInt(typeInput.value);
                nameInput.value = this.resolveItemName(id, typ);
                const p = typeMap[typ] || "ITEM";
                const currentImgTag = tr.querySelector('.item-icon');
                if (currentImgTag) {
                    const newImg = document.createElement('div');
                    const hint = typ === 1 ? 'furn' : 'item';
                    newImg.innerHTML = window.getSafeImageHTML(id, hint, 'class="item-icon" style="max-width:200px;max-height:200px;"');
                    if (newImg.firstChild) {
                        currentImgTag.parentNode.replaceChild(newImg.firstChild, currentImgTag);
                    }
                }
            };
            idInput.addEventListener('input', updateUI);
            typeInput.addEventListener('change', updateUI);
        });
    }

    saveInvItem(index) {
        const newId  = parseInt((document.getElementById(`inv-id-${index}`) || {}).value);
        const newQty = parseInt((document.getElementById(`inv-qty-${index}`) || {}).value);
        const newType= parseInt((document.getElementById(`inv-type-${index}`) || {}).value);
        if (!isNaN(newId) && !isNaN(newQty) && !isNaN(newType)) {
            this.parser.updateInventoryItem('inventory', index, newId, newQty, newType);
            this.renderInventory();
            this.showToast("✅ Item actualizado");
        }
    }

    addInventoryItem() {
        if (!this.parser) return;
        const newId  = parseInt(this.addInvId.value);
        const newQty = parseInt(this.addInvQty.value);
        const newType= parseInt(this.addInvType.value);
        if (isNaN(newId) || isNaN(newQty) || isNaN(newType)) { this.showToast("Completa ID, cantidad y tipo."); return; }
        
        // --- Capacity Check ---
        if (newType === 1) { // Only check for main inventory
            const overrideInput = document.getElementById('inv-capacity-override');
            const capInfo = this.parser.getInventoryCapacityInfo(overrideInput ? overrideInput.value : null);
            const isStacking = this.parser.inventory.some(i => i.item_id === newId && i.qty > 0);
            
            if (!isStacking && capInfo.used >= capInfo.capacity) {
                if (!confirm(`⚠️ Supera la capacidad de la mochila (${capInfo.used + 1}/${capInfo.capacity}). ¿Continuar de todos modos?`)) {
                    return;
                }
            }
        }
        
        try {
            const isHidden = document.getElementById('add-inv-hidden')?.checked || false;
            const result = this.parser.injectInventoryItem(newId, newQty, isHidden, newType);
            this.renderInventory();
            this.showToast(result.mode === "stacked" ? "📦 Cantidad sumada al item existente" : "✅ Item agregado en slot vacío");
        } catch (error) { this.showToast("❌ " + error.message); }
    }

    deleteInvItem(index) {
        if (!this.parser) return;
        const item = this.parser.inventory[index];
        if (!item || item.item_id === -1) return;
        const name = this.resolveItemName(item.item_id, item.invType);
        if (!confirm(`Eliminar ${name} (ID ${item.item_id})?`)) return;
        this.parser.clearInventoryItem('inventory', index);
        this.renderInventory();
        this.showToast("🗑️ Item eliminado");
    }

    saveAllInvItems() {
        if (!this.parser) return;
        
        let newUsedSlots = 0;
        const updates = [];
        
        this.invTableBody.querySelectorAll('tr').forEach(tr => {
            const idInput   = tr.querySelector('.id-input');
            const qtyInput  = tr.querySelector('.qty-input');
            const typeInput = tr.querySelector('.type-input');
            if (idInput && qtyInput && typeInput) {
                const index = parseInt(idInput.id.split('-').pop());
                const newId  = parseInt(idInput.value);
                const newQty = parseInt(qtyInput.value);
                const newType= parseInt(typeInput.value);
                if (!isNaN(newId) && !isNaN(newQty) && !isNaN(newType)) {
                    if (newId > 0 && newQty > 0) newUsedSlots++;
                    updates.push({index, newId, newQty, newType});
                }
            }
        });
        
        // --- Capacity Check ---
        const overrideInput = document.getElementById('inv-capacity-override');
        const capInfo = this.parser.getInventoryCapacityInfo(overrideInput ? overrideInput.value : null);
        
        if (newUsedSlots > capInfo.capacity) {
            if (!confirm(`⚠️ Guardar estos cambios superará la capacidad de la mochila (${newUsedSlots}/${capInfo.capacity}). ¿Continuar de todos modos?`)) {
                return;
            }
        }
        
        updates.forEach(u => this.parser.updateInventoryItem('inventory', u.index, u.newId, u.newQty, u.newType));
        this.renderInventory();
        this.showToast("✅ Todos los items aplicados");
    }

    // ─── Add Furniture (OdinSerializer) ──────────────────────────────
    
    deepCloneNode(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj.constructor.name === 'OdinNode') {
            const n = new OdinNode(obj.marker, obj.name, obj.typeId, obj.typeName, obj.nodeId);
            n.children = obj.children.map(c => this.deepCloneNode(c));
            return n;
        }
        if (obj.constructor.name === 'OdinList') {
            const n = new OdinList(obj.marker, obj.name, obj.length);
            n.elements = obj.elements.map(c => this.deepCloneNode(c));
            n.hasExtraEndOfNode = obj.hasExtraEndOfNode;
            return n;
        }
        if (obj.constructor.name === 'OdinPrimitiveArray') {
            const raw = new Uint8Array(obj.rawData.length);
            raw.set(obj.rawData);
            return new OdinPrimitiveArray(obj.marker, obj.name, obj.numElements, obj.bytesPerElement, raw);
        }
        if (obj.constructor.name === 'OdinPrimitive') return new OdinPrimitive(obj.marker, obj.name, obj.value);
        if (obj.constructor.name === 'OdinString') return new OdinString(obj.marker, obj.name, obj.value);
        if (obj.constructor.name === 'OdinNull') return new OdinNull(obj.marker, obj.name);
        if (obj.constructor.name === 'OdinInternalReference') return new OdinInternalReference(obj.marker, obj.name, obj.targetNodeId);
        if (obj.constructor.name === 'OdinDictionaryEntry') return new OdinDictionaryEntry(this.deepCloneNode(obj.key), this.deepCloneNode(obj.value));
        if (Array.isArray(obj)) return obj.map(c => this.deepCloneNode(c));
        
        // Handle plain objects (like { value: OdinNode } in OdinList elements)
        if (obj.constructor.name === 'Object') {
            const clone = {};
            for (const k in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, k)) {
                    clone[k] = this.deepCloneNode(obj[k]);
                }
            }
            return clone;
        }

        return obj; // Fallback for primitive values
    }

    getMaxNodeId(ast) {
        let max = -1;
        const walk = (node) => {
            if (!node) return;
            if (node.constructor.name === 'OdinNode' && node.nodeId !== null && node.nodeId > max) max = node.nodeId;
            if (node.children) node.children.forEach(walk);
            if (node.elements) node.elements.forEach(walk);
            if (node.constructor.name === 'OdinDictionaryEntry') { walk(node.key); walk(node.value); }
        };
        ast.forEach(walk);
        return max;
    }

    assignNewNodeIds(node, maxIdObj) {
        if (!node) return;
        if (node.constructor.name === 'OdinNode' && node.nodeId !== null) {
            maxIdObj.max++;
            node.nodeId = maxIdObj.max;
        }
        if (node.children) node.children.forEach(c => this.assignNewNodeIds(c, maxIdObj));
        if (node.elements) node.elements.forEach(c => this.assignNewNodeIds(c, maxIdObj));
        if (node.constructor.name === 'OdinDictionaryEntry') {
            this.assignNewNodeIds(node.key, maxIdObj);
            this.assignNewNodeIds(node.value, maxIdObj);
        }
    }

    executeAddFurniture() {
        const furnId = parseInt(this.addItemSelect.value);
        const x = parseInt(this.addItemX.value) || 0;
        const y = parseInt(this.addItemY.value) || 0;
        
        if (isNaN(furnId)) {
            this.showToast('Selecciona un mueble válido', 'error');
            return;
        }
        if (!this.parser || !this.parser.ast) {
            this.showToast('Carga un archivo save primero', 'error');
            return;
        }


        const locIdRaw = this.selectLocation.value;
        const locId = parseInt(locIdRaw);
        
        try {
            const root = this.parser.ast;
            let locData = null;
            
            if (typeof locIdRaw === 'string' && locIdRaw.startsWith('train_vagon_')) {
                const vagonIdx = parseInt(locIdRaw.split('_')[2]) - 1;
                const trainSave = root.children.find(c => c.name === 'trainSave');
                if (!trainSave) throw new Error('No se encontró trainSave');
                const carriages = trainSave.children.find(c => c.name === 'carriages');
                const carrList = carriages.children.find(c => c.constructor.name === 'OdinList');
                locData = carrList.elements[vagonIdx];
            } else {
                if (isNaN(locId)) {
                    this.showToast('Selecciona una ubicación válida', 'error');
                    return;
                }
                const sublocations = root.children.find(c => c.name === 'sublocations');
                if (!sublocations) throw new Error('No se encontró sublocations en el AST');
                const sublocationsList = sublocations.children.find(c => c.constructor.name === 'OdinList');
                const locEntry = sublocationsList.elements.find(e => e.key.value === locId);
                if (!locEntry) throw new Error('Ubicación no encontrada en el AST');
                locData = locEntry.value;
            }

            const furnitureListWrapper = locData.children.find(c => c.name === 'furniture');
            if (!furnitureListWrapper) throw new Error('No se encontró lista de furniture');
            const listNode = furnitureListWrapper.children.find(c => c.constructor.name === 'OdinList');
            
            // Find a clone template from ANY sublocation
            let template = null;
            const globalSublocationsList = root.children.find(c => c.name === 'sublocations')?.children.find(c => c.constructor.name === 'OdinList');
            if (globalSublocationsList && globalSublocationsList.elements) {
                for (const sub of globalSublocationsList.elements) {
                    const subLocData = sub.value;
                const furnListWrap = subLocData.children.find(c => c.name === 'furniture');
                if (furnListWrap) {
                    const lNode = furnListWrap.children.find(c => c.constructor.name === 'OdinList');
                    if (lNode && lNode.elements.length > 0) {
                        template = lNode.elements[0];
                        break;
                                        }
                }
            }
            }
            if (!template) throw new Error('No se encontró ningún mueble en todo el mapa para usar como molde.');

            // Clone and Modify
            const clone = this.deepCloneNode(template);
            
            const maxIdObj = { max: this.getMaxNodeId([root]) };
            this.assignNewNodeIds(clone, maxIdObj);
            
            const furnNode = clone.value;
            
            // Generate unique placementID
            let maxPlacementID = 0;
            this.parser.placements.forEach(p => {
                if (p.placementID > maxPlacementID) maxPlacementID = p.placementID;
            });
            const newPlacementID = maxPlacementID + 1;
            const pIdNode = furnNode.children.find(c => c.name === 'placementID');
            if (pIdNode) pIdNode.value = newPlacementID;
            
            // Apply map change logic directly to node
            const dummyPlacement = { furnNode: furnNode, isWall: false };
            this.parser.applyMapChange(dummyPlacement, furnId, x, y, 0);
            
            const gNumNode = furnNode.children.find(c => c.name === 'groupPosition')?.children.find(c => c.name === 'groupNum');
            if (gNumNode) gNumNode.value = parseInt(this.selectFloor.value) || 0;
            
            listNode.elements.push(clone);
            this.parser.parseMap();
            this.map.selectedPlacement = null;
            this.map.draw();
            this.addItemEditor.classList.add('hidden');
            
            this.showToast('✅ Mueble inyectado con éxito!');
            
        } catch (err) {
            console.error(err);
            this.showToast('Error al inyectar mueble: ' + err.message, 'error');
        }
    }

    // ─── Map Editor ───────────────────────────────────────────────────────────


    refreshWallGroupSelect() {
        const loc = Number(document.getElementById('select-location')?.value || 1);
        const sel = document.getElementById('select-wall-group');
        const box = document.querySelector('.wall-group-selector');
        if (!sel || !this.parser) return;

        const groups = [...new Set(
            this.parser.placements
                .filter(p => p.isWall && Number(p.cluster) === loc)
                .map(p => String(p.floor))
        )].sort();

        sel.innerHTML = groups.length
            ? groups.map(g => `<option value="${g}">Group ${g}</option>`).join('')
            : `<option value="" disabled selected>(sin paredes)</option>`;
        
        const layerRadio = document.querySelector('input[name="map-layer"]:checked');
        box.style.display = (layerRadio && layerRadio.value === 'wall') ? 'block' : 'none';
        
        if (groups.length > 0 && layerRadio && layerRadio.value === 'wall') {
            this.showToast(`Paredes en subloc: ${groups.length} groups`, 'info');
        }
    }

    renderWallpapersTab() {
        const targetLocStr = document.getElementById('select-wallpaper-location')?.value || document.getElementById('select-location')?.value;
        const targetLoc = targetLocStr !== undefined && targetLocStr !== "" ? parseInt(targetLocStr, 10) : 1;
        
        const wtable = document.querySelector('#wallpapers-table tbody');
        const ftable = document.querySelector('#floors-table tbody');
        if (!wtable || !ftable) return;
        wtable.innerHTML = '';
        ftable.innerHTML = '';

        if (this.parser && this.parser.wallpapers && this.parser.wallpapers[targetLoc] && this.parser.wallpapers[targetLoc].length) {
            this.parser.wallpapers[targetLoc].forEach(w => {
                const tr = document.createElement('tr');
                const name = this.resolveItemName ? this.resolveItemName(w.id, 'furn') : '—';
                const nameStr = name && name !== '???' ? name : '—';
                tr.innerHTML = `<td style="padding:0.5rem;">${w.key}</td>
                                <td><input type="number" value="${w.id}" data-key="${w.key}" class="edit-wp" style="width:80px;"></td>
                                <td style="font-size: 0.8rem;">${nameStr}</td>
                                <td style="text-align:center;"><button class="btn-primary wp-save">Guardar</button></td>`;
                wtable.appendChild(tr);
            });
        } else {
            wtable.innerHTML = '<tr><td colspan="4" style="text-align:center;">Esta sublocación no tiene wallpapers en el save</td></tr>';
        }
        
        if (this.parser && this.parser.floors && this.parser.floors[targetLoc] && this.parser.floors[targetLoc].length) {
            this.parser.floors[targetLoc].forEach(f => {
                const tr = document.createElement('tr');
                const name = this.resolveItemName ? this.resolveItemName(f.id, 'furn') : '—';
                const nameStr = name && name !== '???' ? name : '—';
                tr.innerHTML = `<td style="padding:0.5rem;">${f.key}</td>
                                <td><input type="number" value="${f.id}" data-key="${f.key}" class="edit-floor" style="width:80px;"></td>
                                <td style="font-size: 0.8rem;">${nameStr}</td>
                                <td style="text-align:center;"><button class="btn-primary floor-save">Guardar</button></td>`;
                ftable.appendChild(tr);
            });
        } else {
            ftable.innerHTML = '<tr><td colspan="4" style="text-align:center;">Esta sublocación no tiene floors en el save</td></tr>';
        }

        wtable.querySelectorAll('.wp-save').forEach(btn => {
            btn.addEventListener('click', e => {
                const tr = e.target.closest('tr');
                const input = tr.querySelector('.edit-wp');
                this.parser.setWallpaper(targetLoc, input.dataset.key, input.value);
                this.showToast('Papel tapiz actualizado', 'success');
                this.renderWallpapersTab(); // Re-render to update name
            });
        });

        ftable.querySelectorAll('.floor-save').forEach(btn => {
            btn.addEventListener('click', e => {
                const tr = e.target.closest('tr');
                const input = tr.querySelector('.edit-floor');
                this.parser.setFloor(targetLoc, input.dataset.key, input.value);
                this.showToast('Suelo actualizado', 'success');
                this.renderWallpapersTab(); // Re-render to update name
            });
        });
    }

    openItemEditor(placement) {
        this.editItemId.value  = placement.item_id;
        this.editItemX.value   = placement.x;
        this.editItemY.value   = placement.y;
        if (placement.orientation !== undefined && this.editItemOri) this.editItemOri.value = placement.orientation;
        const icon = document.getElementById('edit-item-icon');
        if (icon) {
            const newIcon = document.createElement('div');
            newIcon.innerHTML = window.getSafeImageHTML(placement.item_id, 'furn', 'id="edit-item-icon" style="max-width:64px;max-height:64px;display:block;margin:0 auto;"');
            icon.parentNode.replaceChild(newIcon.firstChild, icon);
        }
        this.editItemId.oninput = e => {
            const currentIcon = document.getElementById('edit-item-icon');
            if (currentIcon) {
                const newIcon = document.createElement('div');
                newIcon.innerHTML = window.getSafeImageHTML(e.target.value, 'furn', 'id="edit-item-icon" style="max-width:64px;max-height:64px;display:block;margin:0 auto;"');
                currentIcon.parentNode.replaceChild(newIcon.firstChild, currentIcon);
            }
        };

        const shinyBtn = document.getElementById('btn-make-shiny');
        if (shinyBtn) {
            const rotMap = window.ROTATION_MAP && window.ROTATION_MAP[placement.item_id];
            if (rotMap && rotMap.B) {
                shinyBtn.style.display = 'flex';
                shinyBtn.onclick = () => {
                    this.editItemId.value = rotMap.B;
                    this.editItemId.dispatchEvent(new Event('input'));
                    document.getElementById('btn-apply-item')?.click();
                    this.showToast(`Convertido a variante B (ID: ${rotMap.B})`, 'success');
                };
            } else {
                shinyBtn.style.display = 'none';
            }
        }
        
        if (this.seedPlantingUI) {
            // Also show crop controls for direct seeds on map
            const isSeed = (typeof SEED_IDS !== 'undefined' && SEED_IDS.has(placement.item_id));
            const tn = placement.furnNode ? (placement.furnNode.typeName || placement.furnNode.className) : null;
            const isCrop = isSeed || (tn && /CropSave/i.test(tn));
            const cropGrowthUI = document.getElementById('crop-growth-ui');

            if (placement.item_id === 306 || placement.item_id === 411 || isCrop) {
                this.seedPlantingUI.classList.remove('hidden');
                const cropInfo = document.getElementById('current-crop-info');
                const matureBtn = document.getElementById('btn-mature-crop');
                const ripeLabel = document.getElementById('label-crop-ripe');
                const ripeCb = document.getElementById('edit-crop-ripe');
                
                const targetPlacement = isSeed ? placement : placement.linkedSeed;

                if (targetPlacement) {
                    const name = window.KNOWN_ITEMS['FURN_' + targetPlacement.item_id] || 'Semilla ' + targetPlacement.item_id;
                    if (cropInfo) cropInfo.innerHTML = window.getSafeImageHTML(targetPlacement.item_id, 'furn', 'style="width:24px; vertical-align:middle; margin-right:5px;"') + ` <strong>${name}</strong>`;
                    if (matureBtn) matureBtn.style.display = 'block';
                    
                    const fields = this.parser.getCropSaveFields(targetPlacement);
                    if (fields && ripeLabel && ripeCb) {
                        ripeLabel.style.display = 'flex';
                        ripeCb.checked = fields.ripeNode ? fields.ripeNode.value : false;
                        
                        // Handle changing ripe manually without hitting mature all
                        ripeCb.onchange = (e) => {
                            this.parser.setCropRipe(targetPlacement, e.target.checked);
                            this.map.draw();
                        };
                        
                        matureBtn.onclick = () => {
                            this.parser.setCropRipe(targetPlacement, true);
                            ripeCb.checked = true;
                            this.showToast('🌱 Planta madurada.');
                            this.map.draw();
                            this.openItemEditor(placement); // reload to update UI
                        };
                    } else if (ripeLabel) {
                        ripeLabel.style.display = 'none';
                    }
                    
                    // --- Crop Growth UI Logic ---
                    if (cropGrowthUI) {
                        const timing = this.parser.getCropTiming(targetPlacement);
                        if (timing && timing.harvestTimeOA !== null) {
                            cropGrowthUI.classList.remove('hidden');
                            const statusEl = document.getElementById('crop-growth-status');
                            const daysInput = document.getElementById('edit-crop-days');
                            const btnApply = document.getElementById('btn-apply-crop-time');
                            const btnMatureS = document.getElementById('btn-mature-crop-single');
                            const btnAddHour = document.getElementById('btn-add-crop-hour');
                            const btnAddDay = document.getElementById('btn-add-crop-day');
                            
                            if (timing.isReady) {
                                statusEl.textContent = "Listo para cosechar";
                                statusEl.style.color = "#27ae60";
                                daysInput.value = 0;
                            } else {
                                statusEl.textContent = `Quedan ~${timing.daysLeft.toFixed(1)} días`;
                                statusEl.style.color = "#e67e22";
                                daysInput.value = parseFloat(timing.daysLeft.toFixed(2));
                            }
                            
                            const applyDays = (days) => {
                                try {
                                    this.parser.setCropDaysLeft(targetPlacement, days);
                                    this.showToast(`⏱️ Tiempo aplicado (${days.toFixed(2)} días).`);
                                    this.map.draw();
                                    this.openItemEditor(placement); // reload ui
                                } catch (e) {
                                    this.showToast("❌ " + e.message);
                                }
                            };
                            
                            btnApply.onclick = () => applyDays(parseFloat(daysInput.value) || 0);
                            btnMatureS.onclick = () => applyDays(0);
                            btnAddHour.onclick = () => { 
                                daysInput.value = parseFloat((parseFloat(daysInput.value) || 0) + (1/24)).toFixed(2); 
                            };
                            btnAddDay.onclick = () => { 
                                daysInput.value = parseFloat((parseFloat(daysInput.value) || 0) + 1).toFixed(2); 
                            };
                        } else {
                            cropGrowthUI.classList.add('hidden');
                        }
                    }
                } else {
                    if (cropInfo) cropInfo.textContent = 'Ningún cultivo plantado.';
                    if (matureBtn) matureBtn.style.display = 'none';
                    if (ripeLabel) ripeLabel.style.display = 'none';
                    if (cropGrowthUI) cropGrowthUI.classList.add('hidden');
                }
            } else {
                this.seedPlantingUI.classList.add('hidden');
                if (cropGrowthUI) cropGrowthUI.classList.add('hidden');
            }
        }
        
        this.itemEditor.classList.remove('hidden');
    }

    closeItemEditor() { this.itemEditor.classList.add('hidden'); }

    _findNodeByName(node, names) {
        if (!node) return null;
        if (node.name && names.includes(node.name)) return node;
        if (node.children) {
            for (const c of node.children) {
                const r = this._findNodeByName(c, names);
                if (r) return r;
            }
        }
        if (node.elements) {
            for (const el of node.elements) {
                const r = this._findNodeByName(el.value, names);
                if (r) return r;
            }
        }
        if (node.value && typeof node.value === 'object') {
            return this._findNodeByName(node.value, names);
        }
        return null;
    }

    _resetCropTime(seedObj) {
        const nowOADate = (Date.now() / 86400000) + 25569;
        const durationDays = (2 / 24); // 2 hours default
        
        let hNode = seedObj.harvestTimeNode || this._findNodeByName(seedObj.furnNode, ['harvestTimeOA', 'harvestTime', 'HarvestTime']);
        if (hNode) hNode.value = nowOADate + durationDays;

        let pNode = seedObj.placedNode || this._findNodeByName(seedObj.furnNode, ['placedOA', 'Placed', 'placed']);
        if (pNode) pNode.value = nowOADate;
    }

    executeMatureCrop() {
        if (!this.map.selectedPlacement) return;
        let p = this.map.selectedPlacement;
        if (p.linkedPlot) p = p.linkedPlot;
        if (!p.linkedSeed) return;

        try {
            const seed = p.linkedSeed;
            if (seed.harvestTimeNode) {
                const nowOADate = (Date.now() / 86400000) + 25569;
                seed.harvestTimeNode.value = nowOADate;
                
                this.parser.parseMap();
                this.showToast('☀️ ¡Cultivo madurado con éxito!');
            } else {
                console.warn('No se encontró el nodo harvestTime en la semilla.');
                alert('No se pudo encontrar el tiempo de cosecha en el AST.');
            }
        } catch (e) {
            console.error(e);
        }
    }

    executePlantSeed() {
        if (!this.map.selectedPlacement) return;
        let p = this.map.selectedPlacement;
        if (p.linkedPlot) p = p.linkedPlot;
        if (p.item_id !== 306 && p.item_id !== 411) return;

        const seedId = parseInt(this.editSeedSelect.value);
        if (isNaN(seedId)) return;

        try {
            // ─── Rama 1: cambiar semilla en parcela ya plantada ───
            if (p.planted_id && p.linkedSeed) {
                const seedNode = p.linkedSeed.furnNode;
                const idNode = this._findNodeByName(seedNode, ['itemID', 'item_id', 'itemId']);
                if (idNode) idNode.value = seedId;
                
                const refNode = this._findNodeByName(seedNode, ['reference']);
                if (refNode) {
                    const rIdNode = this._findNodeByName(refNode, ['id']);
                    if (rIdNode) rIdNode.value = seedId;
                }
                
                if (typeof calcVerificationId !== 'undefined') {
                    const vNode = this._findNodeByName(seedNode, ['verificationID', 'verify']);
                    if (vNode) vNode.value = calcVerificationId(seedId);
                }
                
                // Force 0,0 so it anchors correctly to the plot in-game
                const gpNode = this._findNodeByName(seedNode, ['groupPosition']);
                const pNode = this._findNodeByName(seedNode, ['position']);
                if (typeof writeGroupXY !== 'undefined') {
                    writeGroupXY(gpNode, 0, 0, pNode);
                }
                
                this._resetCropTime(p.linkedSeed);
                
                // B6: Verificar post-change
                const savedPlotId = p.placementID;
                this.parser.parseMap();
                this.map.selectedPlacement = this.parser.placements.find(np => np.placementID === savedPlotId);
                this.map.draw();
                if (this.map.selectedPlacement) {
                    this.openItemEditor(this.map.selectedPlacement);
                    if (this.map.selectedPlacement.linkedSeed && Number(this.map.selectedPlacement.planted_id) === Number(seedId)) {
                        this.showToast('🌱 ¡Semilla cambiada con éxito!');
                    } else {
                        alert('⚠️ La semilla se cambió pero el link no se verificó correctamente.');
                    }
                }
                return;
            }

            // ─── Rama 2: plantar en parcela vacía ───
            let newSeedNode;

            // Buscar template existente en el save
            const templateSeed = this.parser.placements.find(pl => {
                const tn = pl.furnNode && (pl.furnNode.typeName || pl.furnNode.className);
                return (typeof SEED_IDS !== 'undefined' && SEED_IDS.has(pl.item_id)) || (tn && /CropSave/i.test(tn));
            });

            if (templateSeed && templateSeed.furnNode) {
                // Clonar template existente (deep clone preservando prototipos Odin)
                const cloneNode = (node) => {
                    if (!node) return null;
                    if (node instanceof OdinDictionaryEntry) {
                        return new OdinDictionaryEntry(cloneNode(node.key), cloneNode(node.value));
                    }
                    const clone = Object.assign(Object.create(Object.getPrototypeOf(node)), node);
                    if (node.children) clone.children = node.children.map(cloneNode);
                    if (node.elements) clone.elements = node.elements.map(cloneNode);
                    if (clone.value && typeof clone.value === 'object' && clone.value.constructor &&
                        !(clone.value instanceof Uint8Array)) {
                        clone.value = cloneNode(clone.value);
                    }
                    return clone;
                };
                newSeedNode = cloneNode(templateSeed.furnNode);
                
                // Force 0,0 on the cloned node in case the template was buggy
                const gpNode = this._findNodeByName(newSeedNode, ['groupPosition']);
                const pNode = this._findNodeByName(newSeedNode, ['position']);
                if (typeof writeGroupXY !== 'undefined') {
                    writeGroupXY(gpNode, 0, 0, pNode);
                }
            } else {
                // B3: Plantilla mínima embebida — marcadores reales del save:
                //   FurniturePlacement (0x01, typeId=28, "FurniturePlacement, Odyssey")
                //   ├── placementID (0x17)
                //   ├── verificationID (0x17)
                //   ├── reference (0x03, typeId=29, "FurnitureRef, Odyssey")
                //   │   ├── id (0x17), orientation (0x1d BigInt)
                //   ├── groupPosition (0x01, typeId=33, "SubGroupPosition, Odyssey")
                //   │   ├── grid (0x03, typeId=8, "SimpleGrid, Odyssey") {x, y}
                //   │   └── parentPlacementID (0x17)
                //   ├── position (0x03, typeId=30, "GridPointer, Odyssey")
                //   │   ├── pointerType (0x1d), grid{x,y}, groupPointer (0x17)
                //   └── furnSave (0x01, typeId=56, "CropSave, Odyssey")
                //       ├── placedOA (0x21), harvestTimeOA (0x21)
                //       ├── blessings (null), ripe, strange, consumed
                const baseNodeId = Date.now() & 0x7FFFFFFF; // nodeId único
                const nowOA = (Date.now() / 86400000) + 25569;

                newSeedNode = new OdinNode(0x01, '$v', 28, 'FurniturePlacement, Odyssey', baseNodeId);
                newSeedNode.children = [
                    new OdinPrimitive(0x17, 'placementID', 0), // se asigna abajo
                    new OdinPrimitive(0x17, 'verificationID', 0), // se asigna abajo
                    (() => {
                        const ref = new OdinNode(0x03, 'reference', 29, 'FurnitureRef, Odyssey', null);
                        ref.children = [
                            new OdinPrimitive(0x17, 'id', seedId),
                            new OdinPrimitive(0x1d, 'orientation', 0n)
                        ];
                        return ref;
                    })(),
                    (() => {
                        const gp = new OdinNode(0x01, 'groupPosition', 33, 'SubGroupPosition, Odyssey', baseNodeId + 1);
                        const grid = new OdinNode(0x03, 'grid', 8, 'SimpleGrid, Odyssey', null);
                        grid.children = [
                            new OdinPrimitive(0x17, 'x', 0),
                            new OdinPrimitive(0x17, 'y', 0)
                        ];
                        gp.children = [grid, new OdinPrimitive(0x17, 'parentPlacementID', 0)]; // se asigna abajo
                        return gp;
                    })(),
                    (() => {
                        const pos = new OdinNode(0x03, 'position', 30, 'GridPointer, Odyssey', null);
                        const grid = new OdinNode(0x03, 'grid', 8, 'SimpleGrid, Odyssey', null);
                        grid.children = [
                            new OdinPrimitive(0x17, 'x', 0),
                            new OdinPrimitive(0x17, 'y', 0)
                        ];
                        pos.children = [
                            new OdinPrimitive(0x1d, 'pointerType', 0n),
                            grid,
                            new OdinPrimitive(0x17, 'groupPointer', 0)
                        ];
                        return pos;
                    })(),
                    (() => {
                        const fs = new OdinNode(0x01, 'furnSave', 56, 'CropSave, Odyssey', baseNodeId + 2);
                        fs.children = [
                            new OdinPrimitive(0x21, 'placedOA', nowOA),
                            new OdinPrimitive(0x21, 'harvestTimeOA', nowOA + (2/24)),
                            new OdinNull(0x2d, 'blessings'),
                            new OdinPrimitive(0x2b, 'ripe', false),
                            new OdinPrimitive(0x2b, 'strange', false),
                            new OdinPrimitive(0x2b, 'consumed', false)
                        ];
                        return fs;
                    })()
                ];
            }

            // Generar nuevo placementID único
            const maxPlacementId = Math.max(...this.parser.placements.map(pl => pl.placementID || 0));
            const newPlacementId = maxPlacementId + 1;

            // Asignar IDs en el nodo
            const idNode = this._findNodeByName(newSeedNode, ['itemID', 'item_id', 'itemId']);
            if (idNode) idNode.value = seedId;
            
            const refNode = this._findNodeByName(newSeedNode, ['reference']);
            if (refNode) {
                const rIdNode = this._findNodeByName(refNode, ['id']);
                if (rIdNode) rIdNode.value = seedId;
            }

            const pIdNode = this._findNodeByName(newSeedNode, ['placementID']);
            if (pIdNode) pIdNode.value = newPlacementId;
            
            // B2: parentPlacementID = placementID de la parcela (está dentro de groupPosition)
            const parentIdNode = this._findNodeByName(newSeedNode, ['parentPlacementID', 'ParentPlacementID']);
            if (parentIdNode) parentIdNode.value = Number(p.placementID);
            
            if (typeof calcVerificationId !== 'undefined') {
                const vNode = this._findNodeByName(newSeedNode, ['verificationID', 'verify']);
                if (vNode) vNode.value = calcVerificationId(seedId);
            }

            this._resetCropTime({ furnNode: newSeedNode });

            
            // B5: Insertar en furniture de la sublocalización correcta o tren
            let targetFurnList = null;
            
            if (typeof p.cluster === 'string' && p.cluster.startsWith('train_vagon_')) {
                const vagonIdx = parseInt(p.cluster.split('_')[2]) - 1;
                const trainSave = this.parser.ast.children.find(c => c.name === 'trainSave');
                if (trainSave) {
                    const carriages = trainSave.children.find(c => c.name === 'carriages');
                    const carrList = carriages.children.find(c => c.constructor.name === 'OdinList');
                    const locData = carrList.elements[vagonIdx];
                    if (locData && locData.children) {
                        const furnWrapper = locData.children.find(c => c.name === (p.isWall ? 'wallFurniture' : 'furniture'));
                        targetFurnList = furnWrapper ? furnWrapper.children.find(c => c.constructor.name === 'OdinList') : null;
                    }
                }
            } else {
                const sublocsWrapper = this.parser.ast.children.find(c => c.name === 'sublocations');
                if (!sublocsWrapper) { alert('Error: no se encontró "sublocations" en el AST.'); return; }
                const sublocsList = sublocsWrapper.children.find(c => c.constructor.name === 'OdinList');
                const farmEntry = sublocsList.elements.find(e => e.key.value === parseInt(p.cluster));
                if (!farmEntry) {
                    alert('Error: no se encontró la sublocalización ' + p.cluster + ' en el AST.');
                    return;
                }
                const sublocData = farmEntry.value;
                const furnWrapper = sublocData.children.find(c => c.name === (p.isWall ? 'wallFurniture' : 'furniture'));
                targetFurnList = furnWrapper ? furnWrapper.children.find(c => c.constructor.name === 'OdinList') : null;
            }
            
            if (!targetFurnList) { alert('Error: no se encontró la lista de furniture.'); return; }


            // Insertar como OdinDictionaryEntry con el formato real del save ($k/$v)
            const dictKey = new OdinPrimitive(0x17, '$k', newPlacementId);
            targetFurnList.elements.push(new OdinDictionaryEntry(dictKey, newSeedNode));

            // B6: Verificar que el link quedó bien
            const savedPlotId = p.placementID;
            this.parser.parseMap();
            this.map.selectedPlacement = this.parser.placements.find(np => np.placementID === savedPlotId);
            this.map.draw();

            if (this.map.selectedPlacement) {
                this.openItemEditor(this.map.selectedPlacement);
                if (this.map.selectedPlacement.linkedSeed && Number(this.map.selectedPlacement.planted_id) === Number(seedId)) {
                    this.showToast('🌱 ¡Semilla plantada con éxito!');
                } else {
                    alert('⚠️ El nodo se insertó pero el link parcela↔semilla no se verificó. ' +
                          'Posible causa: parentPlacementID no coincide con la parcela.');
                }
            } else {
                alert('⚠️ No se encontró la parcela tras re-parsear.');
            }

        } catch (e) {
            console.error(e);
            alert('Error al plantar la semilla: ' + e.message);
        }
    }

    // ─── Phone (Punchcard & Locations) ──────────────────────────────────

    // 📰 Newspapers
    renderNewsTab() {
        if (!this.parser) return;
        const news = this.parser.getNewspapers();
        const container = document.getElementById('news-checklist');
        const emptyState = document.getElementById('news-empty-state');
        
        if (!news || news.length === 0) {
            if (container) container.innerHTML = '';
            if (emptyState) emptyState.classList.remove('hidden');
            return;
        }
        
        if (emptyState) emptyState.classList.add('hidden');
        if (container) {
            container.innerHTML = '';
            
            // Sort by ID to keep it tidy
            news.sort((a, b) => a.id - b.id);
            
            news.forEach(n => {
                const el = document.createElement('div');
                el.className = 'list-item';
                el.style.display = 'flex';
                el.style.flexDirection = 'column';
                el.style.gap = '0.5rem';
                el.style.padding = '10px';
                el.style.border = '1px solid #444';
                el.style.borderRadius = '5px';
                
                // Try to get title from DB if available, else fallback to ID
                const title = window.NEWSPAPER_DB && window.NEWSPAPER_DB[n.id] ? window.NEWSPAPER_DB[n.id] : 'Periódico #' + n.id;
                
                el.innerHTML = `
                    <div style="font-weight: bold; margin-bottom: 0.2rem; display: flex; justify-content: space-between;">
                        <span>${title}</span>
                        <span style="font-size: 0.8em; color: #888;">ID: ${n.id}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                            <input type="checkbox" class="news-shown-cb" data-id="${n.id}" ${n.shown ? 'checked' : ''}>
                            <span>Visto (Shown)</span>
                        </label>
                        <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                            <input type="checkbox" class="news-done-cb" data-id="${n.id}" ${n.done ? 'checked' : ''}>
                            <span>Recompensa (Done)</span>
                        </label>
                    </div>
                `;
                container.appendChild(el);
            });
            
            // Event Listeners for checkboxes
            container.querySelectorAll('.news-shown-cb').forEach(cb => {
                cb.addEventListener('change', (e) => {
                    const id = parseInt(e.target.getAttribute('data-id'));
                    const doneCb = container.querySelector('.news-done-cb[data-id="' + id + '"]');
                    this.parser.setNewspaperStatus(id, e.target.checked, doneCb.checked);
                });
            });
            
            container.querySelectorAll('.news-done-cb').forEach(cb => {
                cb.addEventListener('change', (e) => {
                    const id = parseInt(e.target.getAttribute('data-id'));
                    const shownCb = container.querySelector('.news-shown-cb[data-id="' + id + '"]');
                    this.parser.setNewspaperStatus(id, shownCb.checked, e.target.checked);
                });
            });
        }
    }


    renderPhoneTab() {
        if (!this.parser) return;

        // 1. Punchcard
        const pcState = this.parser.getPunchcardState();
        const pcTbody = document.querySelector('#punchcard-table tbody');
        const pcEmpty = document.getElementById('punchcard-empty-state');
        const pcTable = document.getElementById('punchcard-table');

        if (!pcState.pcNode) {
            pcEmpty.classList.remove('hidden');
            pcTable.classList.add('hidden');
        } else {
            pcEmpty.classList.add('hidden');
            pcTable.classList.remove('hidden');
            pcTbody.innerHTML = '';

            pcState.rewards.forEach(r => {
                const tr = document.createElement('tr');
                
                const tdDay = document.createElement('td');
                tdDay.textContent = r.isWeekly ? 'Semana (Regalo)' : `Día ${r.index + 1}`;
                if (r.isWeekly) tdDay.style.fontWeight = 'bold';

                const tdPrize = document.createElement('td');
                if (r.isWeekly) {
                    tdPrize.innerHTML = `<div style="display:flex; align-items:center; gap:5px;">
                        <span>Mueble ID:</span>
                        <input type="number" class="weekly-furn-input" value="${r.furnID}" style="width: 80px; padding: 2px;">
                        <button class="btn btn-sm btn-outline btn-apply-weekly-furn" style="padding: 2px 5px; font-size: 12px;">💾</button>
                    </div>`;
                    
                    if (typeof KNOWN_ITEMS !== 'undefined' && KNOWN_ITEMS[r.furnID]) {
                        const nameSpan = document.createElement('div');
                        nameSpan.style.fontSize = '12px';
                        nameSpan.style.color = '#666';
                        nameSpan.textContent = KNOWN_ITEMS[r.furnID].name || `FURN_${r.furnID}`;
                        tdPrize.appendChild(nameSpan);
                    }

                    setTimeout(() => {
                        const btn = tdPrize.querySelector('.btn-apply-weekly-furn');
                        const input = tdPrize.querySelector('.weekly-furn-input');
                        if (btn && input) {
                            btn.addEventListener('click', () => {
                                if (this.parser.setWeeklyRewardFurnId(input.value)) {
                                    this.showToast(`✅ ID Semanal actualizado a ${input.value}`);
                                    this.renderPhoneTab(); // Re-render to update names if needed
                                } else {
                                    this.showToast(`❌ Error al actualizar ID Semanal`);
                                }
                            });
                        }
                    }, 0);
                } else {
                    tdPrize.textContent = REWARD_TYPES[r.rewardType] || `Desconocido (${r.rewardType})`;
                    if (r.modifier > 0) tdPrize.textContent += ` (Mod: ${r.modifier})`;
                }

                const tdClaimed = document.createElement('td');
                const cb = document.createElement('input');
                cb.type = 'checkbox';
                cb.checked = r.claimed;
                cb.onchange = (e) => {
                    this.parser.setPunchcardSlot(r.index, e.target.checked, r.isWeekly);
                    this.showToast(`Día ${r.isWeekly ? 'Semanal' : r.index + 1} actualizado.`);
                };
                tdClaimed.appendChild(cb);

                tr.appendChild(tdDay);
                tr.appendChild(tdPrize);
                tr.appendChild(tdClaimed);
                pcTbody.appendChild(tr);
            });
        }

        // 2. Locations on Phone
        const locs = this.parser.getLocationsOnPhone();
        const locContainer = document.getElementById('locations-checklist');
        const locEmpty = document.getElementById('locations-empty-state');

        if (locs.length === 0) {
            locEmpty.classList.remove('hidden');
            locContainer.style.display = 'none';
        } else {
            locEmpty.classList.add('hidden');
            locContainer.style.display = 'grid';
            locContainer.innerHTML = '';

            // Render all possible locations from SLOCATION_NAMES
            Object.keys(SLOCATION_NAMES).forEach(locIdStr => {
                const locId = parseInt(locIdStr);
                const locName = SLOCATION_NAMES[locId];
                const existing = locs.find(l => l.id === locId);
                const isUnlocked = existing && existing.seen;

                const wrapper = document.createElement('label');
                wrapper.style.display = 'flex';
                wrapper.style.alignItems = 'center';
                wrapper.style.gap = '8px';
                wrapper.style.cursor = 'pointer';

                const cb = document.createElement('input');
                cb.type = 'checkbox';
                cb.checked = isUnlocked;
                cb.onchange = (e) => {
                    const success = this.parser.setLocationUnlocked(locId, e.target.checked);
                    if (success) {
                        this.showToast(`${locName} ${e.target.checked ? 'desbloqueado' : 'bloqueado'}.`);
                    } else {
                        this.showToast(`No se pudo actualizar ${locName}.`, 'error');
                        e.target.checked = !e.target.checked; // Revert
                    }
                };

                const span = document.createElement('span');
                span.textContent = locName;

                wrapper.appendChild(cb);
                wrapper.appendChild(span);
                locContainer.appendChild(wrapper);
            });
        }

        // 3. Phone Cosmetics
        const cosmetics = this.parser.getPhoneCosmetics();
        const cosContainer = document.getElementById('phone-cosmetics-card');
        const cosEmpty = document.getElementById('phone-cosmetics-empty');

        if (!cosmetics) {
            cosEmpty.classList.remove('hidden');
            // Ocultar inputs si no hay cosméticos
            cosContainer.querySelector('.grid-2col').style.display = 'none';
            cosContainer.querySelectorAll('hr, h4, p, .grid-2col:nth-of-type(2)').forEach(el => el && (el.style.display = 'none'));
        } else {
            cosEmpty.classList.add('hidden');
            cosContainer.querySelector('.grid-2col').style.display = 'grid';
            cosContainer.querySelectorAll('hr, h4, p, .grid-2col:nth-of-type(2)').forEach(el => el && (el.style.display = ''));
            
            document.getElementById('phone-skin-id').value = cosmetics.skinID;
            document.getElementById('phone-bg-pattern').value = cosmetics.bgPatternID;
            document.getElementById('phone-bg-color').value = cosmetics.bgColorID;
            
            document.getElementById('phone-bg-mask').value = cosmetics.backgroundsUnlocked.toString();
            document.getElementById('phone-color-mask').value = cosmetics.colorsUnlocked.toString();
        }
    }

    // 💌 Mail & Orders 💌
    cloneOrderLetter() {
        if (!this.parser) {
            this.showToast('Carga un save primero.');
            return;
        }
        
        const input = document.getElementById('input-clone-letter-furn-id');
        const furnId = input ? parseInt(input.value) : 0;
        if (isNaN(furnId) || furnId <= 0) {
            this.showToast('Ingresa un Furniture ID válido.');
            return;
        }

        const invTypeEl = document.getElementById('input-clone-letter-inv-type');
        const invType = invTypeEl ? parseInt(invTypeEl.value) : 1;
        const result = this.parser.cloneOrderLetter({ furnitureID: furnId, invType });
        if (result.error === 'no_template') {
            this.showToast('No hay carta plantilla en este save. Abre el buzón / recibe un pedido en el juego, guarda y vuelve a cargar.');
        } else if (result.success) {
            if (this.parser.clearUniqueOrderBit) this.parser.clearUniqueOrderBit(furnId);
            this.showToast('📦 Carta de pedido clonada correctamente (ID ' + furnId + ').', 'success');
            this.renderMailTab();
        } else {
            this.showToast('Error desconocido al clonar la carta.', 'error');
        }
    }

    cloneFurnitureOrder() {
        if (!this.parser) {
            this.showToast('Carga un save primero.');
            return;
        }
        
        const input = document.getElementById('input-clone-letter-furn-id');
        const furnId = input ? parseInt(input.value) : 0;
        if (isNaN(furnId) || furnId <= 0) {
            this.showToast('Ingresa un Furniture ID válido.');
            return;
        }

        const invTypeEl = document.getElementById('input-clone-letter-inv-type');
        const invType = invTypeEl ? parseInt(invTypeEl.value) : 1;
        const result = this.parser.cloneFurnitureOrder({ furnitureID: furnId, invType });
        if (result.error === 'no_template') {
            this.showToast('No hay un pedido activo (FurnitureOrder) en este save para usar de plantilla.', 'error');
        } else if (result.success) {
            if (this.parser.clearUniqueOrderBit) this.parser.clearUniqueOrderBit(furnId);
            this.showToast('📦 Pedido clonado correctamente (ID ' + furnId + ').', 'success');
            this.renderMailTab();
        } else {
            this.showToast('Error desconocido al clonar el pedido.', 'error');
        }
    }

    unclaimLetterSingle(idx) {
        if (!this.parser) return;
        const ok = this.parser.markLetterUnclaimed(idx);
        if (ok) {
            this.showToast('✅ Carta marcada como NO COBRADA.', 'success');
            this.renderMailTab();
        } else {
            this.showToast('No se pudo modificar la carta.', 'error');
        }
    }

    updateMailVisuals(el, type) {
        const container = el.closest('div');
        const idInput = container.querySelector(`.${type}-furn-input`);
        const typeSelect = container.querySelector(`.${type}-invtype-select`);
        const nameSpan = container.querySelector('span');
        const imgWrapper = container.querySelector('.img-wrapper');
        
        if (idInput && typeSelect && nameSpan && imgWrapper) {
            const id = parseInt(idInput.value) || 0;
            const invType = parseInt(typeSelect.value);
            const typeStr = invType === 0 ? 'item' : 'furn';
            nameSpan.textContent = window.resolveItemName(id, typeStr);
            imgWrapper.innerHTML = window.getSafeImageHTML(id, typeStr, 'style="width:24px; height:24px;"');
        }
    }

    // ─── Mail & Orders ───
    renderMailTab() {
        if (!this.parser) return;
        
        const orders = this.parser.getFurnitureOrders();
        const letters = this.parser.getLetters();
        
        const emptyState = document.getElementById('mail-empty-state');
        const contentState = document.getElementById('mail-content');
        
        if (orders.length === 0 && letters.length === 0) {
            if (emptyState) emptyState.style.display = 'flex';
            if (contentState) contentState.style.display = 'none';
            return;
        }
        
        if (emptyState) emptyState.style.display = 'none';
        if (contentState) contentState.style.display = 'block';
        
        // Orders Table
        const ordersTbody = document.querySelector('#orders-table tbody');
        if (ordersTbody) {
            ordersTbody.innerHTML = '';
            orders.forEach((o, index) => {
                const tr = document.createElement('tr');
                
                const initialInvType = o.nodes.invTypeNode ? o.nodes.invTypeNode.value : 1;
                const typeStr = initialInvType === 0 ? 'item' : 'furn';
                const idName = window.resolveItemName(o.furnitureID, typeStr);
                
                tr.innerHTML = `
                    <td>${o.orderID}</td>
                    <td>
                        <div style="display:flex; align-items:center; gap:5px;" class="order-item-container">
                            <div class="img-wrapper">${window.getSafeImageHTML(o.furnitureID, typeStr, 'style="width:24px; height:24px;"')}</div>
                            <input type="number" class="order-furn-input" data-index="${index}" value="${o.furnitureID}" style="width:70px;" oninput="window.app.updateMailVisuals(this, 'order')">
                            <select class="order-invtype-select" data-index="${index}" style="padding:2px;" onchange="window.app.updateMailVisuals(this, 'order')">
                                <option value="1" ${o.nodes.invTypeNode && o.nodes.invTypeNode.value === 1 ? 'selected' : (!o.nodes.invTypeNode ? 'selected' : '')}>Mueble</option>
                                <option value="0" ${o.nodes.invTypeNode && o.nodes.invTypeNode.value === 0 ? 'selected' : ''}>Objeto</option>
                            </select>
                            <span style="font-size:0.85em; color:#666;">${idName}</span>
                        </div>
                    </td>
                    <td>${o.letterCreated ? 'Sí' : 'No'}</td>
                    <td>
                        <button class="btn-secondary btn-apply-order" data-index="${index}" style="padding:4px 8px; font-size:0.8rem;">Aplicar</button>
                    </td>
                `;
                ordersTbody.appendChild(tr);
            });
            
            ordersTbody.querySelectorAll('.btn-apply-order').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const idx = e.target.getAttribute('data-index');
                    const input = ordersTbody.querySelector(`.order-furn-input[data-index="${idx}"]`);
                    if (input) {
                        const newId = parseInt(input.value);
                        if (!isNaN(newId)) {
                            const typeInput = ordersTbody.querySelector(`.order-invtype-select[data-index="${idx}"]`);
                            const newInvType = typeInput ? parseInt(typeInput.value) : 1;
                            this.parser.setOrderFurnitureId(idx, newId, newInvType);
                            this.showToast('📦 Premio de pedido actualizado.');
                            this.renderMailTab(); // Refresh
                        }
                    }
                });
            });
        }
        
        // Letters Table
        const lettersTbody = document.querySelector('#letters-table tbody');
        if (lettersTbody) {
            lettersTbody.innerHTML = '';
            letters.forEach((l, index) => {
                const tr = document.createElement('tr');
                
                const slot0 = l.slots[0];
                const furnId = slot0 ? slot0.id : 0;
                const initialInvType = (slot0 && slot0.invType !== undefined) ? slot0.invType : 1;
                const typeStr = initialInvType === 0 ? 'item' : 'furn';
                const idName = window.resolveItemName(furnId, typeStr);
                
                tr.innerHTML = `
                    <td>${index}</td>
                    <td>${l.type}</td>
                    <td>${l.orderID !== undefined ? l.orderID : '-'}</td>
                    <td>
                        ${slot0 ? `
                        <div style="display:flex; align-items:center; gap:5px;" class="letter-item-container">
                            <div class="img-wrapper">${window.getSafeImageHTML(furnId, typeStr, 'style="width:24px; height:24px;"')}</div>
                            <input type="number" class="letter-furn-input" data-index="${index}" value="${furnId}" style="width:70px;" oninput="window.app.updateMailVisuals(this, 'letter')">
                            <select class="letter-invtype-select" data-index="${index}" style="padding:2px;" onchange="window.app.updateMailVisuals(this, 'letter')">
                                <option value="1" ${slot0 && slot0.invType === 1 ? 'selected' : (!slot0 || slot0.invType === undefined ? 'selected' : '')}>Mueble</option>
                                <option value="0" ${slot0 && slot0.invType === 0 ? 'selected' : ''}>Objeto</option>
                            </select>
                            <span style="font-size:0.85em; color:#666;">${idName}</span>
                        </div>
                        ` : '-'}
                    </td>
                    <td>
                        <label class="check-container" style="margin:0; justify-content:center;">
                            <input type="checkbox" class="letter-read-cb" data-index="${index}" ${l.read ? 'checked' : ''}>
                            <span></span>
                        </label>
                    </td>
                    <td>${l.claimedRewards && l.claimedRewards.length > 0 ? (l.claimedRewards.every(Boolean) ? '<span style="color:red; font-weight:bold;">Sí</span>' : (l.claimedRewards.some(Boolean) ? '<span style="color:orange;">Parcial</span>' : '<span style="color:green; font-weight:bold;">No</span>')) : '<span style="color:green; font-weight:bold;">No</span>'}</td>
                    <td>
                        <div style="display:flex; gap:4px; align-items:center;">
                            ${slot0 ? `<button class="btn-secondary btn-apply-letter" data-index="${index}" style="padding:4px 8px; font-size:0.8rem;">Aplicar ID</button>` : ''}
                            <button class="btn-danger btn-small" onclick="window.app.unclaimLetterSingle(${index})" style="padding:4px 8px; font-size:0.8rem;">No Cobrada</button>
                        </div>
                    </td>
                `;
                lettersTbody.appendChild(tr);
            });
            
            lettersTbody.querySelectorAll('.btn-apply-letter').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const idx = e.target.getAttribute('data-index');
                    const input = lettersTbody.querySelector(`.letter-furn-input[data-index="${idx}"]`);
                    if (input) {
                        const newId = parseInt(input.value);
                        if (!isNaN(newId)) {
                            const typeInput = lettersTbody.querySelector(`.letter-invtype-select[data-index="${idx}"]`);
                            const newInvType = typeInput ? parseInt(typeInput.value) : 1;
                            this.parser.setLetterSlotItemId(idx, 0, newId, newInvType); // Always slot 0 for our usecase
                            this.showToast('📬 Premio de carta actualizado.');
                            this.renderMailTab(); // Refresh
                        }
                    }
                });
            });
            
                            lettersTbody.querySelectorAll('.letter-opened-cb').forEach(cb => {
                    cb.addEventListener('change', e => {
                        const idx = e.target.getAttribute('data-index');
                        this.parser.setLetterOpened(idx, e.target.checked);
                    });
                });
                lettersTbody.querySelectorAll('.letter-read-cb').forEach(cb => {
                cb.addEventListener('change', (e) => {
                    const idx = e.target.getAttribute('data-index');
                    this.parser.setLetterRead(idx, e.target.checked);
                });
            });
        }
    }

    // ─── Save & Download ───────────────────────────────────────────────────

    saveAndDownload() {
        if (!this.parser) return;
        
        // Read checkbox for verificationID recalculation
        const chkFixVerify = document.getElementById('chk-fix-verify');
        const fixVerify = chkFixVerify ? chkFixVerify.checked : false;
        
        // Validation pre-download
        const stateValidation = this.parser.validateSaveState();
        if (!stateValidation.valid) {
            this.showToast(`🚫 Descarga bloqueada: ${stateValidation.reason}`, 'error');
            return;
        }
        if (stateValidation.warning) {
            this.showToast(`⚠️ ${stateValidation.warning}`, 'warning');
        }

        const validation = this.parser.validateSaveForDownload({ fixCropGrid: true, fixVerify: fixVerify });
        
        // Console log for debug
        if (validation.issues && validation.issues.length > 0) {
            console.log("Validation Issues:");
            console.table(validation.issues);
        }
        
        // Show validation info/fixes
        if (validation.fixes > 0) {
            this.showToast(`✅ Se aplicaron ${validation.fixes} auto-correcciones al save.`);
        }
        
        if (validation.hasWarnings) {
            // Filter only FIX and WARNING severities for the alert
            const warnings = validation.errors.filter(e => e.includes('[WARNING]') || e.includes('[FIX]'));
            
            // Limit to ~15 lines to avoid huge alert boxes
            const maxLines = 15;
            let displayWarnings = warnings.slice(0, maxLines);
            if (warnings.length > maxLines) {
                displayWarnings.push(`...y ${warnings.length - maxLines} problemas más.`);
            }
            
            const warningMsg = "⚠️ Se detectaron problemas en el archivo:\n\n" + 
                                displayWarnings.join("\n") + 
                                "\n\n¿Descargar de todos modos (podría haber errores al cargar en el juego)?";
            
            if (!confirm(warningMsg)) {
                return;
            }
        }

        // Flush vars tab on save
        this.applyGeneralVars();
        this.downloadFile();
    }

    downloadFile() {
        if (!this.parser) return;
        const blob = new Blob([this.parser.getBuffer()], { type: "application/octet-stream" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = "MOD_" + this.fileName;
        document.body.appendChild(a); a.click();
        document.body.removeChild(a); URL.revokeObjectURL(url);
    }

    // ─── Farm Actions ─────────────────────────────────────────────────

    farmAddItem(itemId, qty, label) {
        if (!this.parser) { this.showToast('Carga un save primero.'); return; }
        if (!this.parser.inventory.length) this.parser.parseInventory();
        try {
            const result = this.parser.injectInventoryItem(itemId, qty, false, 1);
            const msg = result.mode === 'stacked'
                ? `📦 ${label} — cantidad sumada (+${qty})`
                : `✅ ${label} agregado (slot ${result.slot})`;
            this.showToast(msg);
            this.renderInventory();
        } catch (e) { this.showToast('❌ ' + e.message); }
    }

    farmAutoHarvest() {
        if (!this.parser) { this.showToast('Carga un save primero.'); return; }
        let patchedCount = 0;
        
        // AST approach
        if (this.parser.ast) {
            const carrotNodes = this.parser._findNodesInAST('carrots');
            for (const node of carrotNodes) {
                // EXCLUDE the global carrots node (which is a direct child of the root AST)
                if (this.parser.ast.children && this.parser.ast.children.includes(node)) continue;
                if (typeof node.value === 'number' && node.value >= 0 && node.value < 1_000_000) {
                    node.value = 999999;
                    patchedCount++;
                }
            }
        }
        
        // Buffer fallback (for sync)
        const carrotsTag = [0x17,0x01,0x07,0x00,0x00,0x00, 99,0,97,0,114,0,114,0,111,0,116,0,115,0];
        let idx = 0;
        while (true) {
            idx = this.parser.findPattern(carrotsTag, idx);
            if (idx === -1) break;
            const valOff = idx + carrotsTag.length;
            const current = this.parser.view.getInt32(valOff, true);
            if (current >= 0 && current < 1_000_000) {
                this.parser.view.setInt32(valOff, 999999, true);
                if (!this.parser.ast) patchedCount++; // only count buffer if no ast
            }
            idx += carrotsTag.length;
        }

        try { this.parser.injectInventoryItem(900, 1, false, 1); this.renderInventory(); } catch (_) {}
        this.showToast(patchedCount > 0 
            ? `dYO_ Auto-Cosecha: ${patchedCount} CropBox(s) → 999,999 zanahorias`
            : 'dYO_ No se hallaron parcelas para cosechar.');
    }

    farmCollectCarrots(amount) {
        if (!this.parser) { this.showToast('Carga un save primero.'); return; }
        const entry = this.parser.generalVars['carrots'];
        if (entry) {
            const newVal = Math.min(entry.value + amount, 2147483647);
            this.parser.writeGeneralVar('carrots', newVal);
            entry.value = newVal;
            const el = document.getElementById('input-carrots');
            if (el) el.value = newVal;
            this.showToast(`🥕 +${amount.toLocaleString()} zanahorias → ${newVal.toLocaleString()} total`);
        } else {
            try {
                this.parser.injectInventoryItem(0, amount, true, 0);
                this.renderInventory();
                this.showToast(`🥕 Campo no hallado — se agregó ${amount}x Lord of Carrots al inventario.`);
            } catch (e) { this.showToast('❌ ' + e.message); }
        }
    }

    scanUnknownIds() {
        if (!this.parser || (!this.parser.inventory && !this.parser.placements)) {
            alert('Carga un save primero para escanear IDs.');
            return;
        }
        
        const missing = new Set();
        
        if (this.parser.inventory) {
            this.parser.inventory.forEach(i => {
                if (!window.KNOWN_ITEMS[`FURN_${i.id}`] && !window.KNOWN_ITEMS[`ITEM_${i.id}`]) {
                    missing.add(i.id);
                }
            });
        }
        
        if (this.parser.placements) {
            this.parser.placements.forEach(p => {
                if (p.item_id !== undefined && !window.KNOWN_ITEMS[`FURN_${p.item_id}`] && !window.KNOWN_ITEMS[`ITEM_${p.item_id}`]) {
                    missing.add(p.item_id);
                }
                if (p.linkedSeed && p.linkedSeed.item_id) {
                    if (!window.KNOWN_ITEMS[`FURN_${p.linkedSeed.item_id}`] && !window.KNOWN_ITEMS[`ITEM_${p.linkedSeed.item_id}`]) {
                        missing.add(p.linkedSeed.item_id);
                    }
                }
            });
        }
        
        if (missing.size === 0) {
            this.showToast('✅ Todos los IDs encontrados tienen nombre.', 'success');
            return;
        }
        
        const missingArray = Array.from(missing).sort((a,b) => a-b);
        const blob = new Blob([JSON.stringify(missingArray, null, 2)], { type: "application/json" });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'missing_ids.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        this.showToast(`📥 missing_ids.json descargado con ${missing.size} IDs faltantes.`);
    }
    
    handleJSONDrop(e) {
        e.preventDefault();
        const overlay = document.getElementById('drop-overlay');
        if (overlay) overlay.style.display = 'none';
        
        const file = e.dataTransfer?.files[0];
        if (!file || !file.name.endsWith('.json')) return;
        
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const data = JSON.parse(evt.target.result);
                let added = 0;
                if (!window.KNOWN_ITEMS) window.KNOWN_ITEMS = {};
                
                Object.keys(data).forEach(id => {
                    const entry = data[id];
                    if (entry.FURN) {
                        window.KNOWN_ITEMS[`FURN_${id}`] = entry.FURN;
                        added++;
                    }
                    if (entry.ITEM) {
                        window.KNOWN_ITEMS[`ITEM_${id}`] = entry.ITEM;
                        added++;
                    }
                });
                
                if (added > 0) {
                    this.showToast(`✅ ${added} nombres inyectados al catálogo. Refrescando interfaz...`);
                    if (this.parser && this.parser.ast) {
                        this.renderInventory();
                        this.renderMailTab();
                        const tabMap = document.getElementById('tab-map');
                        if (tabMap && tabMap.classList.contains('active') && this.map) {
                            this.map.draw();
                        }
                    }
                } else {
                    alert('El JSON no tenía el formato de nombres esperado.');
                }
            } catch (err) {
                console.error(err);
                alert('Error al leer el JSON de nombres.');
            }
        };
        reader.readAsText(file);
    }


    // --- Partial JSON Export/Import UI ---
    openExportModal() {
        const modal = document.getElementById('export-modal');
        if (modal) modal.classList.remove('hidden');
    }
    
    closeExportModal() {
        const modal = document.getElementById('export-modal');
        if (modal) modal.classList.add('hidden');
    }
    
    executeExportJSON() {
        if (!this.parser || !this.parser.ast) {
            alert("No hay save cargado");
            return;
        }
        
        const inv = document.getElementById('export-cb-inv').checked;
        const farm = document.getElementById('export-cb-farm').checked;
        const phone = document.getElementById('export-cb-phone').checked;
        const coveringsNode = document.getElementById('export-cb-coverings');
        const coverings = coveringsNode ? coveringsNode.checked : false;
        
        if (!inv && !farm && !phone && !coverings) {
            alert('Selecciona al menos una sección para exportar.');
            return;
        }
        
        const data = this.parser.exportPartialJSON({ inventory: inv, farm: farm, phone: phone, coverings: coverings });
        
        const blob = new Blob([JSON.stringify(data, (key, value) => typeof value === 'bigint' ? value.toString() : value, 2)], { type: 'application/json' });
        const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
        const filename = `partial_${dateStr}.json`;
        
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        this.closeExportModal();
        this.showToast('✅ JSON exportado correctamente.');
    }
    
    openImportModal() {
        const modal = document.getElementById('import-modal');
        if (modal) {
            modal.classList.remove('hidden');
            document.getElementById('import-file-input').value = '';
            document.getElementById('import-preview-box').classList.add('hidden');
            document.getElementById('btn-confirm-import').disabled = true;
            this.pendingImportData = null;
            
            document.getElementById('import-cb-inv').disabled = true;
            document.getElementById('import-cb-inv').checked = false;
            document.getElementById('import-cb-farm').disabled = true;
            document.getElementById('import-cb-farm').checked = false;
            document.getElementById('import-cb-phone').disabled = true;
            document.getElementById('import-cb-phone').checked = false;
            const cbCoverings = document.getElementById('import-cb-coverings');
            if (cbCoverings) {
                cbCoverings.disabled = true;
                cbCoverings.checked = false;
            }
        }
    }
    
    closeImportModal() {
        const modal = document.getElementById('import-modal');
        if (modal) modal.classList.add('hidden');
        this.pendingImportData = null;
    }
    
    handleImportFileSelect(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const data = JSON.parse(evt.target.result);
                
                // 1. ACEPTAR EL NUEVO FORMATO (y el viejo por compatibilidad)
                if (data.format !== 'TsukiPortDefinitivo' && data.format !== 'TsukiEditorPartial') {
                    alert('El archivo no tiene el formato correcto. Se requiere TsukiPortDefinitivo.');
                    return;
                }
                
                this.pendingImportData = data;
                
                // 2. CONSTRUIR VISTA PREVIA
                let previewHtml = '<strong>Resumen del archivo:</strong><br>';
                
                const cbInv = document.getElementById('import-cb-inv');
                const cbFarm = document.getElementById('import-cb-farm');
                const cbPhone = document.getElementById('import-cb-phone');
                const cbCoverings = document.getElementById('import-cb-coverings');
                
                if (data.inventory) {
                    previewHtml += `- Inventario: ${data.inventory.length} ítems<br>`;
                    cbInv.disabled = false;
                    cbInv.checked = true;
                }
                
                // Leer el nuevo formato de mapas
                if (data.mapas) {
                    let totalMuebles = 0;
                    let totalParedes = 0;
                    let totalWp = 0;
                    for (const mId in data.mapas) {
                        const mapa = data.mapas[mId];
                        if (mapa.pisos) {
                            for (const pId in mapa.pisos) {
                                totalMuebles += mapa.pisos[pId].length;
                            }
                        }
                        if (mapa.paredes) totalParedes += mapa.paredes.length;
                        if (mapa.revestimientos && mapa.revestimientos.wallpapers) {
                            totalWp += mapa.revestimientos.wallpapers.length;
                        }
                    }
                    previewHtml += `- Muebles/Cultivos: ${totalMuebles} ítems en total<br>`;
                    if (totalParedes) previewHtml += `- Muebles de pared: ${totalParedes}<br>`;
                    if (totalWp) previewHtml += `- Wallpapers: ${totalWp} anclas<br>`;
                    cbFarm.disabled = false;
                    cbFarm.checked = true;
                    if (cbCoverings && (totalWp || totalParedes)) {
                        cbCoverings.disabled = false;
                        cbCoverings.checked = true;
                    }
                } 
                // Fallback por si cargás un archivo viejo
                else if (data.farm && data.farm.crops) {
                    previewHtml += `- Cultivos/Parcelas: ${data.farm.crops.length}<br>`;
                    cbFarm.disabled = false;
                    cbFarm.checked = true;
                }
                
                if (data.phone) {
                    previewHtml += `- Teléfono: Incluido<br>`;
                    cbPhone.disabled = false;
                    cbPhone.checked = true;
                }
                if (data.mapCoverings && cbCoverings) {
                    const locCount = Object.keys(data.mapCoverings).length;
                    previewHtml += `- Revestimientos: ${locCount} sublocación(es)<br>`;
                    cbCoverings.disabled = false;
                    cbCoverings.checked = true;
                }
                
                const box = document.getElementById('import-preview-box');
                box.innerHTML = previewHtml;
                box.classList.remove('hidden');
                
                document.getElementById('btn-confirm-import').disabled = false;
                
            } catch (err) {
                alert('Error al leer el JSON: ' + err.message);
                console.error(err);
            }
        };
        reader.readAsText(file);
    }
    
    executeImportJSON() {
        if (!this.parser || !this.parser.ast || !this.pendingImportData) {
            alert("No hay save cargado");
            return;
        }
        
        const inv = document.getElementById('import-cb-inv').checked;
        const farm = document.getElementById('import-cb-farm').checked;
        const phone = document.getElementById('import-cb-phone').checked;
        const coveringsNode = document.getElementById('import-cb-coverings');
        const coverings = coveringsNode ? coveringsNode.checked : false;
        
        if (!inv && !farm && !phone && !coverings) {
            alert('Selecciona al menos una sección para importar.');
            return;
        }
        
        try {
            const report = this.parser.applyPartialJSON(this.pendingImportData, { inventory: inv, farm: farm, phone: phone, coverings: coverings });
            
            this.closeImportModal();
            
            // Refresh UI
            if (inv) this.parser.parseInventory();
            if (farm) this.parser.parseMap();
            
            this.renderInventory();
            if (this.renderEventsTab) this.renderEventsTab();
            if (this.renderNewsTab) this.renderNewsTab();
            if (this.renderPhoneTab) this.renderPhoneTab();
            if (this.renderMailTab) this.renderMailTab();
            if (this.renderMailUniqueOrders) this.renderMailUniqueOrders();
            if (this.renderTrainExtra) this.renderTrainExtra();
            if (this.renderExperimentalStructures) this.renderExperimentalStructures();
            if (this.renderExtraVars) this.renderExtraVars();
            if (coverings && this.renderWallpapersTab) this.renderWallpapersTab();
        
            if (this.map) this.map.draw();
            
            let msg = `✅ Importación parcial exitosa.\nAplicados: ${report.applied}`;
            if (report.skipped.length > 0) {
                msg += `\nOmitidos: ${report.skipped.length}`;
                console.log("Elementos omitidos:", report.skipped);
            }
            this.showToast(msg);
            
        } catch (err) {
            alert('Error al aplicar el JSON: ' + err.message);
            console.error(err);
        }
    }
    
    // ─── Toasts ───────────────────────────────────────────────────────

    
    // --- Feature Integrations ---
    renderMailUniqueOrders() {
        if (!this.parser) return;
        const meta = this.parser.getLetterOrderMeta();
        const container = document.getElementById('mail-unique-orders-container');
        if (!container) return;
        
        if (!meta || meta.uniqueOrders === null) {
            container.style.display = 'none';
            return;
        }
        
        container.style.display = 'block';
        const lastOrders = document.getElementById('mail-last-orders-val');
        if (lastOrders) lastOrders.textContent = JSON.stringify(meta.lastOrders);
    }

    clearUniqueOrderBit() {
        if (!this.parser) return;
        const idInput = document.getElementById('input-mail-order-id');
        if (!idInput || idInput.value === '') return;
        const id = parseInt(idInput.value);
        if (isNaN(id)) return;
        
        if (this.parser.clearUniqueOrderBit(id)) {
            this.showToast('✅ Bit limpiado en uniqueOrders');
            this.renderMailUniqueOrders();
        } else {
            this.showToast('❌ Error al limpiar bit', 'error');
        }
    }

    renderTrainExtra() {
        if (!this.parser) return;
        const acts = this.parser.getActivitySaves();
        const tStat = document.getElementById('train-trip-status');
        const aStat = document.getElementById('train-activity-status');
        
        const trip = this.parser.getTripSave();
        if (tStat) {
            if (!trip.present) {
                tStat.textContent = '❌ Trip: no presente';
            } else if (trip.isNull) {
                tStat.textContent = '⚪ Trip: null (sin viaje activo)';
            } else {
                tStat.textContent = `✅ Trip activo (keys: ${trip.keys.join(', ')})`;
            }
        }
        
        if (aStat) {
            if (acts.length > 0) {
                aStat.innerHTML = acts.map(a => `Act ${a.id} (NPC ${a.npc}): ${a.valid ? 'Válido' : 'No Válido'}${a.subloc !== null ? ' - SubLoc: ' + a.subloc : ''}`).join('<br>');
            } else {
                aStat.innerHTML = 'No hay Activities.';
            }
        }
        
        const npcsInput = document.getElementById('input-train-npcs');
        if (npcsInput) {
            const data = this.parser.getNpcsOnTrain();
            npcsInput.value = data.npcs.join(', ');
        }
    }
    
    applyTrainNpcs() {
        if (!this.parser) return;
        const val = document.getElementById('input-train-npcs').value;
        const ids = val.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
        if (this.parser.setNpcsOnTrain(ids)) {
            this.showToast('✅ NPCs en tren actualizados');
        } else {
            this.showToast('❌ Error al actualizar NPCs (Lista no encontrada)', 'error');
        }
    }

    renderExperimentalStructures() {
        if (!this.parser) return;
        
        const formatNode = (nodeObj, liId, name) => {
            const el = document.getElementById(liId);
            if (!el) return;
            
            if (!nodeObj.present) {
                el.innerHTML = `❌ ${name}: No presente en este save`;
                return;
            }
            
            let html = `✅ ${name}: Presente`;
            const n = nodeObj.node;
            if (n && n.children && n.children.length > 0) {
                const fields = [];
                let count = 0;
                for (const c of n.children) {
                    if (count >= 10) break; // MAX_FIELDS
                    if (c.value !== undefined && c.value !== null && typeof c.value !== 'object') {
                        fields.push(`<b>${c.name}</b>: ${c.value}`);
                        count++;
                    }
                }
                if (fields.length > 0) {
                    html += `<div style="font-size:0.85rem; margin-top:0.25rem; padding:0.5rem; background:#f4f4f4; border-radius:4px;">${fields.join('<br>')}</div>`;
                } else {
                    html += ` <i>(sin campos parseables)</i>`;
                }
            } else {
                html += ` <i>(sin campos parseables)</i>`;
            }
            el.innerHTML = html;
        };

        formatNode(this.parser.getBountySave(), 'ro-bounty', 'BountySave / BountyBoard');
        formatNode(this.parser.getParsnapSave(), 'ro-parsnap', 'ParsnapSave');
        formatNode(this.parser.getCropBoxSave(), 'ro-cropbox', 'CropBox');
        
        const del = this.parser.getDeliverySave();
        const delEl = document.getElementById('ro-delivery');
        if (delEl) {
            delEl.innerHTML = del.present ? `✅ deliverySave: Presente` : `❌ deliverySave: No presente`;
        }
        
        // Conditions Table
        const cBody = document.getElementById('exp-conditions-body');
        if (cBody) {
            cBody.innerHTML = '';
            const conds = this.parser.getConditionSaves();
            if (conds && conds.length > 0) {
                conds.forEach((c, idx) => {
                    cBody.innerHTML += `<tr>
                        <td>${c.character}</td>
                        <td><input type="number" id="cond-id-${idx}" value="${c.conditionID}" style="width:60px;"></td>
                        <td><input type="number" id="cond-lvl-${idx}" value="${c.level}" style="width:60px;"></td>
                        <td><input type="number" id="cond-date-${idx}" value="${c.dateFulfilled}" style="width:120px;"></td>
                        <td><button onclick="window.app.applyCondition(${idx})">Guardar</button></td>
                    </tr>`;
                });
            } else {
                cBody.innerHTML = '<tr><td colspan="5">No hay conditionSaves.</td></tr>';
            }
        }
        
        // Diary Table
        const dBody = document.getElementById('exp-diary-body');
        if (dBody) {
            dBody.innerHTML = '';
            const diaries = this.parser.getDiarySaves();
            if (diaries && diaries.length > 0) {
                diaries.forEach((d, idx) => {
                    dBody.innerHTML += `<tr>
                        <td>${d.num}</td>
                        <td><input type="number" id="diary-oa-${idx}" value="${d.diaryAchievedOA}" style="width:80px;"></td>
                        <td><input type="checkbox" id="diary-night-${idx}" ${d.night ? 'checked' : ''}></td>
                        <td><input type="number" id="diary-state-${idx}" value="${d.state}" style="width:60px;"></td>
                        <td><button onclick="window.app.applyDiary(${idx})">Guardar</button></td>
                    </tr>`;
                });
            } else {
                dBody.innerHTML = '<tr><td colspan="5">No hay diarySaves.</td></tr>';
            }
        }
    }
    
    applyCondition(idx) {
        if (!this.parser) return;
        const id = document.getElementById(`cond-id-${idx}`).value;
        const lvl = document.getElementById(`cond-lvl-${idx}`).value;
        const date = document.getElementById(`cond-date-${idx}`).value;
        
        let up = false;
        if (this.parser.setConditionField(idx, 'conditionID', id)) up = true;
        if (this.parser.setConditionField(idx, 'level', lvl)) up = true;
        if (this.parser.setConditionField(idx, 'dateFulfilled', date)) up = true;
        
        if (up) this.showToast('✅ Condición guardada');
        else this.showToast('❌ Error al guardar', 'error');
    }
    
    applyDiary(idx) {
        if (!this.parser) return;
        const oa = document.getElementById(`diary-oa-${idx}`).value;
        const night = document.getElementById(`diary-night-${idx}`).checked;
        const state = document.getElementById(`diary-state-${idx}`).value;
        
        let up = false;
        if (this.parser.setDiarySaveField(idx, 'diaryAchievedOA', oa)) up = true;
        if (this.parser.setDiarySaveField(idx, 'night', night)) up = true;
        if (this.parser.setDiarySaveField(idx, 'state', state)) up = true;
        
        if (up) this.showToast('✅ Diary guardado');
        else this.showToast('❌ Error al guardar', 'error');
    }

    renderExtraVars() {
        if (!this.parser) return;
        const vars = this.parser.getExtraVars();
        const gs = document.getElementById('var-game-start');
        const sr = document.getElementById('var-sickle-refresh');
        const us = document.getElementById('var-unique-seed');
        
        if (gs) gs.value = vars.GameStart !== null ? vars.GameStart : '';
        if (sr) sr.value = vars.SickleRefresh !== null ? vars.SickleRefresh : '';
        if (us) us.value = vars.UniqueDailySeed !== null ? vars.UniqueDailySeed : '';
    }
    
    applyExtraVars() {
        if (!this.parser) return;
        const gs = document.getElementById('var-game-start').value;
        const sr = document.getElementById('var-sickle-refresh').value;
        const us = document.getElementById('var-unique-seed').value;
        
        let up = false;
        if (gs !== '' && this.parser.setExtraVar('GameStart', gs)) up = true;
        if (sr !== '' && this.parser.setExtraVar('SickleRefresh', sr)) up = true;
        if (us !== '' && this.parser.setExtraVar('UniqueDailySeed', us)) up = true;
        
        if (up) this.showToast('✅ Vars guardadas');
    }

    async compareSaves() {
        if (!this.parser) return;
        const fileInput = document.getElementById('diff-file-input');
        const out = document.getElementById('diff-output');
        if (!fileInput || !out) return;
        
        if (fileInput.files.length === 0) {
            alert("Por favor selecciona un save para comparar.");
            return;
        }
        
        const file = fileInput.files[0];
        const arrayBuffer = await file.arrayBuffer();
        let otherParser;
        try {
            otherParser = new SaveParser(arrayBuffer);
            const reader = new OdinReader(otherParser.buffer.buffer);
            let ast = reader.parse();
            if (Array.isArray(ast)) ast = ast[0];
            otherParser.ast = ast;
            
            otherParser.parseGeneralVars();
            otherParser.parseMap();
            otherParser.parseInventory();
            otherParser.parseNPCSaves();
            otherParser.parseEventSaves();
            otherParser.parseTrainSave();
        } catch (e) {
            alert("Error al parsear el archivo B: " + e.message);
            return;
        }
        
        out.style.display = 'block';
        out.textContent = "Calculando diferencias...\n";
        
        const getStats = (p) => {
            const ev = p.getVillageEventState ? p.getVillageEventState() : {all:[]};
            let actEv = ev.all.find(e => e.eventID > 0);
            
            let carrots = 0;
            if (p.generalVars && p.generalVars['carrots'] !== undefined) {
                carrots = p.generalVars['carrots'];
            } else if (p.generalVars && p.generalVars['Carrots'] !== undefined) {
                carrots = p.generalVars['Carrots'];
            } else if (p.inventory) {
                const cItem = p.inventory.find(i => (typeof i.id === 'string' && i.id.toLowerCase() === 'carrots') || i.id === 'carrots' || i.name === 'carrots');
                if (cItem) carrots = cItem.quantity;
            }
            
            const news = p.getNewspapers ? p.getNewspapers() : [];
            const doneNews = news.filter(n => n.done).length;
            const meta = p.getLetterOrderMeta ? p.getLetterOrderMeta() : {};
            const uOrd = meta.uniqueOrders;
            
            let hs = null;
            if (p.getHomeCurrSLocData) {
                const hsRaw = p.getHomeCurrSLocData();
                hs = (hsRaw !== null && typeof hsRaw === 'object' && 'value' in hsRaw) ? hsRaw.value : hsRaw;
            }
            
            return {
                letters: p.getLetters ? p.getLetters().length : 0,
                eventsTotal: ev.all.length,
                activeEvent: actEv ? `ID:${actEv.eventID} Y:${actEv.year}` : 'None',
                activities: p.getActivitySaves ? p.getActivitySaves().length : 0,
                trip: (p.getTripSave && p.getTripSave().present) ? 'Yes' : 'No',
                carrots: carrots,
                newsDone: doneNews,
                uniqueOrders: uOrd !== undefined && uOrd !== null ? uOrd.toString() : 'None',
                homeTier: hs !== null ? hs : 'N/A'
            };
        };
        
        const aData = getStats(this.parser);
        const bData = getStats(otherParser);
        
        let diffText = "";
        for (const key in aData) {
            if (aData[key] !== bData[key]) {
                diffText += `[${key}] A: ${aData[key]} | B: ${bData[key]}\n`;
            }
        }
        
        if (!diffText) diffText = "No hay diferencias en los campos rastreados.";
        out.textContent = diffText;
    }



    showToast(message) {
        const container = document.getElementById('toast-container');
        if (!container) return;
        const toast = document.createElement('div');
        toast.className = 'toast'; toast.textContent = message;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 3200);
    }
}

window.onload = () => { window.app = new App(); };

// ============================================================
// SizeEditor — Editor de Tamaños de Grilla (Experimental Tab)
// ============================================================
class SizeEditor {
    constructor() {
        // Track changes made in this session: { id -> { width, length } }
        this._sessionChanges = {};
        this._currentId = null;
        this._originalSize = null;

        this._els = {
            icon:         document.getElementById('size-editor-icon'),
            name:         document.getElementById('size-editor-name'),
            idLabel:      document.getElementById('size-editor-id'),
            inputW:       document.getElementById('size-editor-width'),
            inputL:       document.getElementById('size-editor-length'),
            btnApply:     document.getElementById('btn-size-apply'),
            btnReset:     document.getElementById('btn-size-reset'),
            output:       document.getElementById('size-editor-output'),
            btnCopy:      document.getElementById('btn-size-copy'),
            btnExport:    document.getElementById('btn-size-export'),
            changesCount: document.getElementById('size-editor-changes-count'),
            manualId:     document.getElementById('size-editor-manual-id'),
            btnManual:    document.getElementById('btn-size-manual-load'),
        };

        this._bindEvents();

        // Poll selectedPlacement whenever user switches to experimental tab
        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.addEventListener('click', () => {
                if (btn.dataset.target === 'tab-experimental') {
                    this._syncFromMap();
                }
            });
        });
    }

    // ── Sync with map's selected placement ────────────────────────────────
    _syncFromMap() {
        const sel = window.app && window.app.map && window.app.map.selectedPlacement;
        if (sel && sel.item_id != null && sel.item_id !== -1) {
            this._loadItem(sel.item_id);
        }
        // If nothing is selected, just leave the current state
    }

    _loadItem(id) {
        this._currentId = id;
        const name = window.app ? window.app.resolveItemName(id, 1) : `#${id}`;
        
        // Icon
        const icon = this._els.icon;
        icon.src = `images/items/FURN_${id}.png`;
        icon.style.display = 'block';
        icon.onerror = () => {
            icon.src = `images/items/ITEM_${id}.png`;
            icon.onerror = () => { icon.style.display = 'none'; };
        };

        // Labels
        this._els.name.textContent = name.startsWith('#') ? `Mueble #${id}` : name;
        this._els.idLabel.textContent = `ID: ${id}`;

        // Current size (session override → sizes.js → fallback 2×2)
        let w = 2, l = 2;
        if (this._sessionChanges[id]) {
            w = this._sessionChanges[id].width;
            l = this._sessionChanges[id].length;
        } else if (window.furnitureSizes && window.furnitureSizes[String(id)]) {
            w = window.furnitureSizes[String(id)].width;
            l = window.furnitureSizes[String(id)].length;
        }
        this._originalSize = { width: w, length: l };

        this._els.inputW.value = w;
        this._els.inputL.value = l;
        this._els.btnApply.disabled = false;
        this._els.btnReset.disabled = false;

        this._updateOutput(id, w, l);
    }

    // ── Events ────────────────────────────────────────────────────────────
    _bindEvents() {
        // Live update output as user types
        ['input', 'change'].forEach(evt => {
            this._els.inputW.addEventListener(evt, () => this._onInputChange());
            this._els.inputL.addEventListener(evt, () => this._onInputChange());
        });

        // Apply button → write to furnitureSizes and invalidate map image cache
        this._els.btnApply.addEventListener('click', () => this._applySize());

        // Reset button → restore original size
        this._els.btnReset.addEventListener('click', () => {
            if (this._currentId == null || !this._originalSize) return;
            this._els.inputW.value = this._originalSize.width;
            this._els.inputL.value = this._originalSize.length;
            this._onInputChange();
        });

        // Manual ID load
        this._els.btnManual.addEventListener('click', () => {
            const id = parseInt(this._els.manualId.value);
            if (isNaN(id) || id < 0) {
                window.app && window.app.showToast('⚠️ Ingresá un ID válido (número entero ≥ 0).');
                return;
            }
            this._loadItem(id);
        });
        this._els.manualId.addEventListener('keydown', e => {
            if (e.key === 'Enter') this._els.btnManual.click();
        });

        // Copy output to clipboard
        this._els.btnCopy.addEventListener('click', () => {
            const text = this._els.output.textContent;
            navigator.clipboard.writeText(text).then(() => {
                window.app && window.app.showToast('📋 Copiado al portapapeles.');
            }).catch(() => {
                // Fallback for file:// protocol
                const ta = document.createElement('textarea');
                ta.value = text;
                document.body.appendChild(ta);
                ta.select();
                document.execCommand('copy');
                document.body.removeChild(ta);
                window.app && window.app.showToast('📋 Copiado al portapapeles.');
            });
        });

        // Export full sizes.js
        this._els.btnExport.addEventListener('click', () => this._exportSizesJs());
    }

    _onInputChange() {
        if (this._currentId == null) return;
        const w = parseInt(this._els.inputW.value) || 1;
        const l = parseInt(this._els.inputL.value) || 1;
        this._updateOutput(this._currentId, w, l);
    }

    _updateOutput(id, w, l) {
        this._els.output.textContent = `"${id}": { width: ${w}, length: ${l} },`;
    }

    _applySize() {
        if (this._currentId == null) return;
        const w = Math.max(1, parseInt(this._els.inputW.value) || 1);
        const l = Math.max(1, parseInt(this._els.inputL.value) || 1);

        // Ensure inputs show clamped values
        this._els.inputW.value = w;
        this._els.inputL.value = l;

        // Write to the live furnitureSizes dictionary (used by map.js)
        if (!window.furnitureSizes) window.furnitureSizes = {};
        window.furnitureSizes[String(this._currentId)] = { width: w, length: l };

        // Track session change
        this._sessionChanges[this._currentId] = { width: w, length: l };
        this._updateChangesCount();
        this._updateOutput(this._currentId, w, l);

        // Redraw map so the footprint updates immediately
        if (window.app && window.app.map) {
            window.app.map._imgCache = {}; // clear image cache so sizes take effect
            window.app.map.draw();
        }

        window.app && window.app.showToast(`✅ Tamaño de ID ${this._currentId} actualizado a ${w}×${l}.`);
    }

    _updateChangesCount() {
        const n = Object.keys(this._sessionChanges).length;
        this._els.changesCount.textContent = `${n} cambio${n !== 1 ? 's' : ''} en esta sesión`;
    }

    // ── Export full sizes.js ───────────────────────────────────────────────
    _exportSizesJs() {
        // Merge session changes into the full furnitureSizes
        const merged = Object.assign({}, window.furnitureSizes || {});
        for (const [id, size] of Object.entries(this._sessionChanges)) {
            merged[id] = size;
        }

        // Sort keys numerically for readability
        const sorted = Object.keys(merged)
            .sort((a, b) => Number(a) - Number(b))
            .reduce((acc, k) => { acc[k] = merged[k]; return acc; }, {});

        const lines = Object.entries(sorted)
            .map(([id, s]) => `    "${id}": { width: ${s.width}, length: ${s.length} },`)
            .join('\n');

        const content = `// sizes.js — Furniture grid sizes\n// Auto-generated by Tsuky Web Editor Size Editor\nwindow.furnitureSizes = {\n${lines}\n};\n`;

        const blob = new Blob([content], { type: 'application/javascript' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = 'sizes.js';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        window.app && window.app.showToast(
            `💾 sizes.js descargado con ${Object.keys(sorted).length} entradas (${Object.keys(this._sessionChanges).length} nuevas/editadas).`
        );
    }
}

// Initialize SizeEditor after DOM is ready (app.js loads after DOM anyway)
document.addEventListener('DOMContentLoaded', () => {
    // Wait a tick to ensure App constructor has run
    setTimeout(() => { window.sizeEditor = new SizeEditor(); }, 50);
});
