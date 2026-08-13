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
    0:"New Year", 1:"Valentine's Day", 2:"Spring Festival", 3:"Easter",
    4:"Summer Festival", 5:"Halloween", 6:"Autumn Harvest", 7:"Winter Solstice",
    8:"Christmas", 9:"New Year's Eve"
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
        // Data is injected via <script> tags (extracted_items_v3.js / sizes.js)
        // so no fetch() needed - works with file:// protocol without a server.
        if (typeof ITEM_NAMES !== 'undefined') window.KNOWN_ITEMS = ITEM_NAMES;
        if (typeof window.furnitureSizes !== 'undefined') window.ITEM_SIZES = window.furnitureSizes;
        if (!window.KNOWN_ITEMS) window.KNOWN_ITEMS = {};
        if (!window.ITEM_SIZES)  window.ITEM_SIZES  = {};
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

        // Tabs
        this.navItems.forEach(btn => btn.addEventListener('click', () => {
            this.navItems.forEach(b => b.classList.remove('active'));
            this.tabContents.forEach(c => { c.classList.add('hidden'); c.classList.remove('active'); });
            btn.classList.add('active');
            const tab = document.getElementById(btn.dataset.target);
            tab.classList.remove('hidden');
            tab.classList.add('active');
            if (btn.dataset.target === 'tab-map') this.map.resize();
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
        this.selectLocation.addEventListener('change', () => { this.map.selectedPlacement = null; this.closeItemEditor(); this.map.draw(); });
        this.selectFloor.addEventListener('change', () => { this.map.selectedPlacement = null; this.closeItemEditor(); this.map.draw(); });

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

        // General Vars
        document.getElementById('btn-apply-vars').addEventListener('click', () => this.applyGeneralVars());

        // NPCs
        document.getElementById('btn-max-friendship').addEventListener('click', () => this.maxAllFriendship());
        document.getElementById('btn-reset-pester').addEventListener('click', () => this.resetAllPester());
        document.getElementById('btn-apply-npc').addEventListener('click', () => this.applyNPCChanges());

        // Train
        document.getElementById('btn-apply-train').addEventListener('click', () => this.applyTrainChanges());

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
                : `Ubicación ${c}`;
            opt.textContent = friendlyName;
            this.selectLocation.appendChild(opt);
        });
        if (prevLoc && Array.from(this.parser.clusters).includes(parseInt(prevLoc))) {
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
        this.renderPhoneTab();

        // Train
        this.parser.parseTrainSave();
        this.renderTrainTab();
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
        setVal('input-unluckiness', 'unluckiness');
        setVal('input-bedtime-start', 'startBedtime');
        setVal('input-bedtime-end', 'endBedtime');

        // Season selector
        const seasonEl = document.getElementById('select-season');
        if (seasonEl && vars['season'] !== undefined) seasonEl.value = vars['season'].value;

        // Homecoming booleans
        const hcIOS = document.getElementById('chk-homecoming-ios');
        const hcAnd = document.getElementById('chk-homecoming-android');
        if (hcIOS && vars['homecomingiOS'] !== undefined) hcIOS.checked = vars['homecomingiOS'].value;
        if (hcAnd && vars['homecomingAndroid'] !== undefined) hcAnd.checked = vars['homecomingAndroid'].value;
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
                const existing = this.parser.inventory.find(it => it.item_id === 1 && it.invType === 0);
                if (existing) {
                    this.parser.updateInventoryItem(this.parser.inventory.indexOf(existing), 1, qty, 0);
                    this.renderInventory();
                } else if (qty > 0) {
                    this.parser.injectInventoryItem(1, qty, 0);
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
        applyField('input-unluckiness', 'unluckiness');
        applyField('input-bedtime-start', 'startBedtime');
        applyField('input-bedtime-end', 'endBedtime');

        const seasonEl = document.getElementById('select-season');
        if (seasonEl) this.parser.writeGeneralVar('season', parseInt(seasonEl.value));

        const hcIOS = document.getElementById('chk-homecoming-ios');
        const hcAnd = document.getElementById('chk-homecoming-android');
        if (hcIOS) this.parser.writeGeneralVar('homecomingiOS', hcIOS.checked);
        if (hcAnd) this.parser.writeGeneralVar('homecomingAndroid', hcAnd.checked);

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

    applyNPCChanges() {
        this.parser.npcSaves.forEach((_, idx) => this.applyNPCSingle(idx));
        this.showToast("✅ Todos los NPCs actualizados");
    }

    maxAllFriendship() {
        this.parser.npcSaves.forEach((_, idx) => this.parser.setNPCFriendship(idx, 99999));
        this.showToast("💛 Amistad máxima para TODOS los personajes");
        this.renderNPCTab();
    }

    resetAllPester() {
        this.parser.npcSaves.forEach((_, idx) => this.parser.setNPCPester(idx, 0));
        this.showToast("😊 Pester reseteado para todos los personajes");
        this.renderNPCTab();
    }

    // ─── Events Tab ───────────────────────────────────────────────────

    renderEventsTab() {
        const tbody = document.getElementById('events-table-body');
        if (!tbody) return;
        tbody.innerHTML = '';

        if (!this.parser.eventSaves.length) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:2rem;color:var(--text-muted);">No se encontraron eventos activos en este save.<br><small>Los eventos solo aparecen una vez activados en el juego.</small></td></tr>';
            return;
        }

        this.parser.eventSaves.forEach((ev, idx) => {
            const name = EVENT_NAMES[ev.eventId] || `Evento ${ev.eventId}`;
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${ev.eventId}</td>
                <td>${name}</td>
                <td><input type="number" class="inv-input" id="ev-year-${idx}" value="${ev.year}" style="width:80px;"></td>
                <td>
                    <div class="row-actions">
                        <button class="btn-primary btn-small" onclick="window.app.applyEventSingle(${idx})">✔ Aplicar</button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    applyEventSingle(idx) {
        const yEl = document.getElementById(`ev-year-${idx}`);
        const ev = this.parser.eventSaves[idx];
        if (!ev) return;
        if (yEl && ev.yearOff !== -1) {
            const year = parseInt(yEl.value);
            if (!isNaN(year)) { this.parser.writeInt32(ev.yearOff, year); ev.year = year; }
        }
        this.showToast(`✅ Evento ${EVENT_NAMES[ev.eventId] || ev.eventId} actualizado`);
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
        const moveBtn = document.getElementById('btn-inv-move-excess');
        
        if (capText) {
            capText.textContent = `${capInfo.used} / ${capInfo.capacity}`;
            if (capInfo.used > capInfo.capacity) {
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
            const name = this.resolveItemName(item.item_id, item.invType);
            if (filter && !`${item.item_id} ${name}`.toLowerCase().includes(filter)) return;

            const typeMap = {0:"ITEM",1:"FURN",2:"CROP",3:"FISH"};
            const prefix = typeMap[item.invType] || "ITEM";

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <img src="images/items/${prefix}_${item.item_id}.png" class="item-icon"
                         onerror="this.style.display='none'" alt="Icon">
                </td>
                <td>
                    <div class="inv-item-col">
                        <select class="inv-input type-input" id="inv-type-${index}" style="width:80px;margin-bottom:4px;">
                            <option value="0" ${item.invType===0?'selected':''}>Objeto</option>
                            <option value="1" ${item.invType===1?'selected':''}>Mueble</option>
                            <option value="2" ${item.invType===2?'selected':''}>Cultivo</option>
                            <option value="3" ${item.invType===3?'selected':''}>Pez</option>
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
                if (imgTag) { imgTag.src = `images/items/${p}_${id}.png`; imgTag.style.display = 'block'; }
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
            this.parser.updateInventoryItem(index, newId, newQty, newType);
            this.showToast("✅ Item actualizado");
        }
    }

    addInventoryItem() {
        if (!this.parser) return;
        const newId  = parseInt(this.addInvId.value);
        const newQty = parseInt(this.addInvQty.value);
        const newType= parseInt(this.addInvType.value);
        if (isNaN(newId) || isNaN(newQty) || isNaN(newType)) { this.showToast("Completa ID, cantidad y tipo."); return; }
        try {
            const result = this.parser.injectInventoryItem(newId, newQty, newType);
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
        this.parser.clearInventoryItem(index);
        this.renderInventory();
        this.showToast("🗑️ Item eliminado");
    }

    saveAllInvItems() {
        if (!this.parser) return;
        this.invTableBody.querySelectorAll('tr').forEach(tr => {
            const idInput   = tr.querySelector('.id-input');
            const qtyInput  = tr.querySelector('.qty-input');
            const typeInput = tr.querySelector('.type-input');
            if (idInput && qtyInput && typeInput) {
                const index = parseInt(idInput.id.split('-').pop());
                const newId  = parseInt(idInput.value);
                const newQty = parseInt(qtyInput.value);
                const newType= parseInt(typeInput.value);
                if (!isNaN(newId) && !isNaN(newQty) && !isNaN(newType))
                    this.parser.updateInventoryItem(index, newId, newQty, newType);
            }
        });
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

        const locId = parseInt(this.selectLocation.value);
        if (isNaN(locId)) {
            this.showToast('Selecciona una ubicación en el mapa', 'error');
            return;
        }

        try {
            const root = this.parser.ast;
            const sublocations = root.children.find(c => c.name === 'sublocations');
            
            if (!sublocations) throw new Error('No se encontró sublocations en el AST');
            const sublocationsList = sublocations.children.find(c => c.constructor.name === 'OdinList');
            const locEntry = sublocationsList.elements.find(e => e.key.value === locId);
            if (!locEntry) throw new Error('Ubicación no encontrada en el AST');
            
            const locData = locEntry.value;
            const furnitureListWrapper = locData.children.find(c => c.name === 'furniture');
            if (!furnitureListWrapper) throw new Error('No se encontró lista de furniture');
            const listNode = furnitureListWrapper.children.find(c => c.constructor.name === 'OdinList');
            
            // Find a clone template from ANY sublocation
            let template = null;
            for (const sub of sublocationsList.elements) {
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

    openItemEditor(placement) {
        this.editItemId.value  = placement.item_id;
        this.editItemX.value   = placement.x;
        this.editItemY.value   = placement.y;
        if (placement.orientation !== undefined && this.editItemOri) this.editItemOri.value = placement.orientation;
        const icon = document.getElementById('edit-item-icon');
        if (icon) { icon.src = `images/items/FURN_${placement.item_id}.png`; icon.style.display = 'block'; }
        this.editItemId.oninput = e => { if (icon) icon.src = `images/items/FURN_${e.target.value}.png`; };
        
        if (this.seedPlantingUI) {
            // Also show crop controls for direct seeds on map
            const isSeed = (typeof SEED_IDS !== 'undefined' && SEED_IDS.has(placement.item_id));
            if (placement.item_id === 306 || placement.item_id === 411 || isSeed) {
                this.seedPlantingUI.classList.remove('hidden');
                const cropInfo = document.getElementById('current-crop-info');
                const matureBtn = document.getElementById('btn-mature-crop');
                const ripeLabel = document.getElementById('label-crop-ripe');
                const ripeCb = document.getElementById('edit-crop-ripe');
                
                const targetPlacement = isSeed ? placement : placement.linkedSeed;

                if (targetPlacement) {
                    const name = window.KNOWN_ITEMS['FURN_' + targetPlacement.item_id] || 'Semilla ' + targetPlacement.item_id;
                    if (cropInfo) cropInfo.innerHTML = `<img src=\"images/items/FURN_${targetPlacement.item_id}.png\" style=\"width:24px; vertical-align:middle; margin-right:5px;\" onerror=\"this.style.display='none'\"> <strong>${name}</strong>`;
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
                        };
                    } else if (ripeLabel) {
                        ripeLabel.style.display = 'none';
                    }
                } else {
                    if (cropInfo) cropInfo.textContent = 'Ningún cultivo plantado.';
                    if (matureBtn) matureBtn.style.display = 'none';
                    if (ripeLabel) ripeLabel.style.display = 'none';
                }
            } else {
                this.seedPlantingUI.classList.add('hidden');
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
        const p = this.map.selectedPlacement;
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
        const p = this.map.selectedPlacement;
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

            // B5: Insertar en furniture de la sublocalización correcta
            const sublocsWrapper = this.parser.ast.children.find(c => c.name === 'sublocations');
            if (!sublocsWrapper) { alert('Error: no se encontró "sublocations" en el AST.'); return; }
            const sublocsList = sublocsWrapper.children
                ? sublocsWrapper.children.find(c => c.constructor.name === 'OdinList')
                : null;
            if (!sublocsList) { alert('Error: no se encontró la lista de sublocaciones.'); return; }

            // Coerción numérica por si hay mismatch number/bigint
            const farmEntry = sublocsList.elements.find(e => {
                if (e instanceof OdinDictionaryEntry) return Number(e.key.value) === Number(p.cluster);
                if (e.key) return Number(e.key.value) === Number(p.cluster);
                return false;
            });

            if (!farmEntry) {
                alert('Error: no se encontró la sublocalización ' + p.cluster + ' en el AST.');
                return;
            }

            const sublocNode = (farmEntry instanceof OdinDictionaryEntry) ? farmEntry.value : farmEntry.value;
            const furnWrap = sublocNode.children.find(c => c.name === 'furniture');
            if (!furnWrap) { alert('Error: no se encontró "furniture" en la sublocalización.'); return; }
            const furnList = furnWrap.children
                ? furnWrap.children.find(c => c.constructor.name === 'OdinList')
                : null;
            if (!furnList) { alert('Error: no se encontró la lista de furniture.'); return; }

            // Insertar como OdinDictionaryEntry con el formato real del save ($k/$v)
            const dictKey = new OdinPrimitive(0x17, '$k', newPlacementId);
            furnList.elements.push(new OdinDictionaryEntry(dictKey, newSeedNode));

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

    // ─── Save & Download ───────────────────────────────────────────────────

    saveAndDownload() {
        if (!this.parser) return;
        
        // Validation pre-download
        const validation = this.parser.validateSaveForDownload();
        
        // Show validation info/fixes
        if (validation.fixes > 0) {
            this.showToast(`[INFO] Se corrigieron ${validation.fixes} coordenadas de cultivos (grid a 0,0).`);
        }
        
        if (validation.hasWarnings) {
            const warningMsg = "Hay advertencias en el archivo:\n- " + validation.errors.filter(e => e.includes('WARNING')).join("\n- ") + "\n\n¿Descargar de todos modos?";
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
            const result = this.parser.injectInventoryItem(itemId, qty, 1);
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

        try { this.parser.injectInventoryItem(900, 1, 1); this.renderInventory(); } catch (_) {}
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
                this.parser.injectInventoryItem(0, amount, 0);
                this.renderInventory();
                this.showToast(`🥕 Campo no hallado — se agregó ${amount}x Lord of Carrots al inventario.`);
            } catch (e) { this.showToast('❌ ' + e.message); }
        }
    }

    // ─── Toasts ───────────────────────────────────────────────────────

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
