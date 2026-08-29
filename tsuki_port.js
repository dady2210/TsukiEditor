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
        
        this.setupEvents();
    }
    
    setupEvents() {
        if (this.btnBag) {
            this.btnBag.addEventListener('click', () => this.enterBagMode());
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
    }
    

    enterBagMode() {
        this.bottomBar.classList.remove('active-ui');
        if (this.bagUI) this.bagUI.classList.add('active-ui');
        this.renderBagInventory();
    }
    
    exitBagMode() {
        if (this.bagUI) this.bagUI.classList.remove('active-ui');
        if (document.body.classList.contains('play-mode') && !this.isHammerMode) {
            if (this.bottomBar) this.bottomBar.classList.add('active-ui');
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
        
        // Set up the carrots display
        const hudCarrots = document.getElementById('port-hud-carrots');
        if (hudCarrots && this.app.parser && this.app.parser.generalVars) {
            hudCarrots.textContent = this.app.parser.generalVars.carrots || 0;
        }
    }
    
    exitPlayMode() {
        this.bottomBar.classList.remove('active-ui');
        this.exitHammerMode();
    }
    
    enterHammerMode() {
        this.isHammerMode = true;
        this.bottomBar.classList.remove('active-ui');
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
            if (this.bottomBar) this.bottomBar.classList.add('active-ui');
        }
        
        if (this.app.map) {
            this.app.map.isHammerMode = false;
            this.app.map.forceDrawGrid = false;
            
            // Re-inject picked up item if we are holding something
            if (this.app.map.selectedPlacement) {
                this.pickupSelectedPlacement();
            }
            this.app.map.draw();
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
        
        // Filter: invType 1, 2, 3 are all "furniture" categories roughly.
        const items = (this.app.parser.inventory || []).filter(i => {
            if (i.qty <= 0 || i.item_id === -1) return false;
            return [1, 2, 3].includes(Number(i.invType));
        });
        
        if (items.length === 0) {
            this.hammerInvPanel.innerHTML = '<div style="color: rgba(255,255,255,0.7); padding: 20px; text-align: center;">Vacio</div>';
            return;
        }
        
        items.forEach(item => {
            const div = document.createElement('div');
            div.className = 'hammer-inv-slot';
            div.draggable = true;
            const typeStr = item.invType === 0 ? 'item' : 'furn';
            div.innerHTML = window.getSafeImageHTML(item.item_id, typeStr, 'style="max-width:80%; max-height:80%;"');
            
            // Allow dragging (keep existing imgObj logic for dragImage)
            const imgObj = this.app.map ? this.app.map.getImage(item.item_id, 0) : null;
            if (true) {
                div.addEventListener('dragstart', (e) => {
                    if (this.app.map) this.app.map.draggedInventoryItem = { item_id: item.item_id };
                    e.dataTransfer.setData('application/json', JSON.stringify({
                        item_id: item.item_id,
                        invType: item.invType
                    }));
                    
                    // BIG DRAG IMAGE
                    const dragImg = new Image();
                    dragImg.src = imgObj.src;
                    dragImg.style.position = 'absolute';
                    dragImg.style.top = '-9999px';
                    dragImg.style.opacity = '1';
                    // We need it in the DOM temporarily for setDragImage in some browsers
                    document.body.appendChild(dragImg);
                    
                    // We use native width/height to make it look full size
                    // Since isometric items scale, we might want to scale it by `map.scale` 
                    const s = 0.75 * (this.app.map ? this.app.map.scale : 1);
                    const dw = imgObj.width * s;
                    const dh = imgObj.height * s;
                    
                    dragImg.width = dw;
                    dragImg.height = dh;
                    
                    e.dataTransfer.setDragImage(dragImg, dw / 2, dh);
                    
                    setTimeout(() => dragImg.remove(), 100);
                    div.style.opacity = '0.5';
                });
                
            } else {
                div.textContent = item.item_id;
                div.addEventListener('dragstart', (e) => {
                    if (this.app.map) this.app.map.draggedInventoryItem = { item_id: item.item_id };
                    if (this.app.map) this.app.map.draggedInventoryItem = { item_id: item.item_id };
                    e.dataTransfer.setData('application/json', JSON.stringify({ item_id: item.item_id }));
                });
            }
            
            const qty = document.createElement('div');
            qty.className = 'hammer-inv-qty';
            qty.textContent = item.qty;
            div.appendChild(qty);
            
            div.addEventListener('dragend', () => {
                div.style.opacity = '1';
                if (this.app.map) this.app.map.draggedInventoryItem = null;
            });
            
            this.hammerInvPanel.appendChild(div);
        });
    }
    
    pickupSelectedPlacement() {
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
