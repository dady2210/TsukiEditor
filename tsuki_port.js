class TsukiPort {
    constructor(app) {
        this.app = app;
        this.isHammerMode = false;
        
        // Cache DOM elements
        this.bottomBar = document.getElementById('play-bottom-bar');
        this.hammerUI = document.getElementById('hammer-ui');
        this.hammerInvPanel = document.getElementById('hammer-inv-panel');
        this.bagUI = document.getElementById('bag-ui');
        this.bagPanel = document.getElementById('bag-panel');
        this.btnBagExit = document.getElementById('btn-bag-exit');
        this.btnHammerExit = document.getElementById('btn-hammer-exit');
        
        this.btnBag = document.getElementById('btn-port-bag');
        this.btnHammer = document.getElementById('btn-port-hammer');
        this.btnPhone = document.getElementById('btn-port-phone');
        this.btnSettings = document.getElementById('btn-port-settings');
        
        this.btnHammerGrid = document.getElementById('btn-hammer-grid');
        this.btnHammerFlip = document.getElementById('btn-hammer-flip');
        
        this.currentCategory = 1; // 1 = Furniture (default)
        this.showGrid = true;
        this.autosaveEnabled = true; // Por defecto activado guardando en caché local silenciosa
        this.autosaveTimer = null;
        this.playTime = 0;
        this.lastWrite = Date.now();
        
        this.setupEvents();
    }
    
    setupEvents() {
        if (this.btnBag) {
            this.btnBag.addEventListener('click', () => { if (this.bagUI && this.bagUI.classList.contains('active-ui')) { this.exitBagMode(); } else { this.enterBagMode(); } });
        }
        if (this.btnBagExit) {
            this.btnBagExit.addEventListener('click', () => this.exitBagMode());
        }
        if (this.btnHammer) {
            this.btnHammer.addEventListener('click', () => this.enterHammerMode());
        }
        
        if (this.btnHammerExit) {
            this.btnHammerExit.addEventListener('click', () => this.exitHammerMode());
        }
        
        if (this.btnHammerGrid) {
            this.btnHammerGrid.addEventListener('click', () => {
                this.showGrid = !this.showGrid;
                if (this.app.map) {
                    this.app.map.forceDrawGrid = this.showGrid;
                    this.app.map.draw();
                }
                this.btnHammerGrid.style.opacity = this.showGrid ? '1' : '0.5';
            });
        }
        
        if (this.btnHammerFlip) {
            this.btnHammerFlip.addEventListener('click', () => {
                if (this.hammerUI) {
                    this.hammerUI.classList.toggle('right-side');
                }
            });
        }
        
        if (this.btnSettings) {
            this.btnSettings.style.color = this.autosaveEnabled ? '#4caf50' : '#9e9e9e';
            this.btnSettings.title = this.autosaveEnabled ? 'Autoguardado en caché activo (cada 30s)' : 'Autoguardado desactivado';
            this.btnSettings.addEventListener('click', () => {
                this.autosaveEnabled = !this.autosaveEnabled;
                this.btnSettings.style.color = this.autosaveEnabled ? '#4caf50' : '#9e9e9e';
                this.btnSettings.title = this.autosaveEnabled ? 'Autoguardado en caché activo (cada 30s)' : 'Autoguardado desactivado';
                if (this.autosaveEnabled) {
                    this.app.showToast('💾 Autoguardado en caché activado.');
                    this.triggerAutosave();
                    if (!this.autosaveTimer) {
                        this.autosaveTimer = setInterval(() => this.triggerAutosave(), 30000);
                    }
                } else {
                    if (this.autosaveTimer) {
                        clearInterval(this.autosaveTimer);
                        this.autosaveTimer = null;
                    }
                    this.app.showToast('Autoguardado desactivado.');
                }
            });
        }
    }
    

    enterBagMode() {
        // if (this.bottomBar) this.bottomBar.style.display = 'none';
        if (this.bagUI) this.bagUI.classList.add('active-ui');
        if (this.btnBagExit) this.btnBagExit.style.display = 'none';
        this.renderBagInventory();
    }
    
    exitBagMode() {
        if (this.bagUI) this.bagUI.classList.remove('active-ui');
        if (document.body.classList.contains('play-mode') && !this.isHammerMode) {
            if (this.bottomBar) this.bottomBar.style.display = 'flex';
        }
    }
    
    renderBagInventory() {
        if (!this.bagPanel) return;
        this.bagPanel.innerHTML = '';
        
        if (!this.app.parser) return;
        if (!this.app.parser.inventory || this.app.parser.inventory.length === 0) {
            if (typeof this.app.parser.parseInventory === 'function') {
                this.app.parser.parseInventory();
            }
        }
        
        const items = (this.app.parser.inventory || []).filter(i => i.qty > 0 && i.item_id !== -1);
        
        if (items.length === 0) {
            this.bagPanel.innerHTML = '<div style="width:100%; text-align:center; margin-top:20px; color:rgba(0,0,0,0.5);">La mochila est\xE1 vac\xEDa.</div>';
            return;
        }
        
        items.forEach(item => {
            const div = document.createElement('div');
            div.className = 'bag-inv-slot';
            const typeStr = item.invType === 0 ? 'item' : 'furn';
            div.innerHTML = window.getSafeImageHTML(item.item_id, typeStr, 'style="max-width:70%; max-height:70%;"');
            
            const qty = document.createElement('div');
            qty.className = 'bag-inv-qty';
            qty.textContent = item.qty;
            div.appendChild(qty);
            
            this.bagPanel.appendChild(div);
        });
    }

    enterPlayMode() {
        this.bottomBar.classList.add('active-ui');
        this.exitHammerMode();
        
        // Iniciar timer de autosave si está activo
        if (this.autosaveEnabled && !this.autosaveTimer) {
            this.autosaveTimer = setInterval(() => this.triggerAutosave(), 30000);
        }

        // Set up the carrots display
        const hudCarrots = document.getElementById('port-hud-carrots');
        if (hudCarrots && this.app.parser && this.app.parser.generalVars) {
            hudCarrots.textContent = this.app.parser.generalVars.carrots ? (this.app.parser.generalVars.carrots.value ?? this.app.parser.generalVars.carrots) : 0;
        }
    }
    

    
    
    async triggerAutosave() {
        if (!this.autosaveEnabled || !this.app || !this.app.parser) return;
        
        const now = Date.now();
        this.playTime += Math.floor((now - this.lastWrite) / 1000);
        this.lastWrite = now;
        
        if (this.app.parser.generalVars && typeof this.app.parser.generalVars.playTime === 'undefined') {
            this.app.parser.generalVars.playTime = { type: 'Int32', value: this.playTime, _stub: true };
        }
        
        // Guardar silenciosamente en la caché local persistente (IndexedDB) y/o File System Access API
        if (typeof this.app.saveSession === 'function') {
            await this.app.saveSession({ silent: true });
            const badge = document.getElementById('port-hud-autosave');
            if (badge) {
                badge.style.opacity = '1';
                setTimeout(() => { badge.style.opacity = '0'; }, 1800);
            }
        }
    }

    exitPlayMode() {
        this.triggerAutosave();

        // if (this.bottomBar) this.bottomBar.style.display = 'none';
        this.exitHammerMode();
    }
    
    enterHammerMode() {
        this.isHammerMode = true;
        if (this.bottomBar) this.bottomBar.style.display = 'none';
        this.hammerUI.classList.add('active-ui');
        
        if (this.app.map) {
            this.app.map.isHammerMode = true;
            this.app.map.forceDrawGrid = this.showGrid;
            this.btnHammerGrid.style.opacity = this.showGrid ? '1' : '0.5';
            this.app.map.draw();
        }
        
        this.renderHammerInventory();
    }
    
    exitHammerMode() {
        this.isHammerMode = false;
        if (this.hammerUI) this.hammerUI.classList.remove('active-ui');
        if (document.body.classList.contains('play-mode')) {
            if (this.bottomBar) this.bottomBar.style.display = 'flex';
        }
        
        if (this.app.map) {
            this.app.map.isHammerMode = false;
            this.app.map.forceDrawGrid = false;
            
            // Deselect and close editor without deleting placed item
            this.app.map.selectedPlacement = null;
            if (typeof this.app.closeItemEditor === 'function') {
                this.app.closeItemEditor();
            }
            this.app.map.draw();
        }
        
        if (typeof this.triggerAutosave === 'function') {
            this.triggerAutosave();
        }
    }
    
    renderHammerInventory() {
        if (!this.hammerInvPanel) return;
        this.hammerInvPanel.innerHTML = '';
        
        if (!this.app.parser) return;
        if (!this.app.parser.inventory || this.app.parser.inventory.length === 0) {
            if (typeof this.app.parser.parseInventory === 'function') {
                this.app.parser.parseInventory();
            }
        }
        
        // Filter: invType 1, 2, 3 are all "furniture" categories, plus any floor/wall coverings.
        const items = (this.app.parser.inventory || []).filter(i => {
            if (i.qty <= 0 || i.item_id === -1) return false;
            if ([1, 2, 3].includes(Number(i.invType))) return true;
            if (this.app.map && this.app.map.isCovering(i.item_id)) return true;
            return false;
        });
        
        if (items.length === 0) {
            this.hammerInvPanel.innerHTML = '<div style="color: rgba(255,255,255,0.7); padding: 20px; text-align: center;">Vacio</div>';
            return;
        }
        
        items.forEach(item => {
            const div = document.createElement('div');
            div.className = 'hammer-inv-slot';
            div.draggable = true;
            const isCover = this.app.map ? this.app.map.isCovering(item.item_id) : null;
            const typeStr = (item.invType === 0 && !isCover) ? 'item' : 'furn';
            div.innerHTML = window.getSafeImageHTML(item.item_id, typeStr, 'style="max-width:80%; max-height:80%;"');
            
            // Use transparent dragImage so only custom canvas ghost is shown (avoids double mouse)
            const blankDragImg = new Image();
            blankDragImg.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
            div.addEventListener('dragstart', (e) => {
                const payload = JSON.stringify({
                    item_id: item.item_id,
                    invType: item.invType
                });
                if (this.app.map) this.app.map.draggedInventoryItem = { item_id: item.item_id };
                e.dataTransfer.setData('application/json', payload);
                e.dataTransfer.setData('text/plain', payload);
                try {
                    e.dataTransfer.setDragImage(blankDragImg, 0, 0);
                } catch (err) {}
                div.style.opacity = '0.5';
            });
            
            const qty = document.createElement('div');
            qty.className = 'hammer-inv-qty';
            qty.textContent = item.qty;
            div.appendChild(qty);
            
            div.addEventListener('dragend', () => {
                div.style.opacity = '1';
                if (this.app.map) {
                    this.app.map.draggedInventoryItem = null;
                    this.app.map.isItemDragging = null;
                    this.app.map.draw();
                }
            });
            
            this.hammerInvPanel.appendChild(div);
        });
    }
    
    pickupSelectedPlacement() {
        this.triggerAutosave();

        const map = this.app.map;
        if (!map || !map.selectedPlacement) return;
        const p = map.selectedPlacement;
        if (p.item_id === -1) return;
        
        try {
            let targetInvType = 1;
            if (map.SEED_IDS && map.SEED_IDS.has(p.item_id)) {
                targetInvType = 4;
            }
            this.app.parser.injectInventoryItem(p.item_id, 1, false, targetInvType);
        } catch (e) {
            console.warn("Could not return item to inventory:", e);
        }
        
        const idx = this.app.parser.placements.indexOf(p);
        if (idx !== -1) {
            this.app.parser.placements.splice(idx, 1);
        }
        
        map.selectedPlacement = null;
        map.draw();
        
        if (this.isHammerMode) {
            this.renderHammerInventory();
        }
    }
}

// Make it globally available
window.TsukiPort = TsukiPort;
