class GameUI {
    constructor(app) {
        this.app = app;
        this.actionMenu = null;
        this.infoModal = null;
        this.longPressTimer = null;
        this.isLongPress = false;
        this.startX = 0;
        this.startY = 0;
    }

    init() {
        this.createActionMenu();
        this.createInfoModal();
        this.hookEvents();
    }
    
    hookEvents() {
        if (!this.app || !this.app.map) return;
        const canvas = this.app.map.canvas;
        
        canvas.addEventListener('pointerdown', (e) => {
            if (!document.body.classList.contains('play-mode')) return;
            if (e.button !== 0) return;
            
            this.hideActionMenu();
            this.startX = e.clientX;
            this.startY = e.clientY;
            this.isLongPress = false;
            
            this.longPressTimer = setTimeout(() => {
                this.isLongPress = true;
                if (this.app.map.hoveredPlacement) {
                    this.app.map.selectedPlacement = this.app.map.hoveredPlacement;
                    this.showActionMenu(e.clientX, e.clientY);
                }
            }, 500);
        });
        
        canvas.addEventListener('pointermove', (e) => {
            const dx = Math.abs(e.clientX - this.startX);
            const dy = Math.abs(e.clientY - this.startY);
            if (dx > 10 || dy > 10) {
                if (this.longPressTimer) clearTimeout(this.longPressTimer);
            }
        });
        
        canvas.addEventListener('pointerup', (e) => {
            if (this.longPressTimer) clearTimeout(this.longPressTimer);
            if (this.isLongPress) {
                // To properly ignore the map.js drag processing, we can just clear hoveredPlacement temporarily or stop propagation.
                e.stopPropagation();
                // We'll let map.js isItemDragging = false take care of itself
            }
        });
    }

    createActionMenu() {
        this.actionMenu = document.createElement('div');
        this.actionMenu.style.position = 'absolute';
        this.actionMenu.style.display = 'none';
        this.actionMenu.style.gap = '10px';
        this.actionMenu.style.zIndex = '1000';
        this.actionMenu.style.transform = 'translate(-50%, -100%)';
        this.actionMenu.style.marginTop = '-20px';
        
        const btnDelete = this.createCircleBtn('delete', '#f44336');
        const btnRotate = this.createCircleBtn('rotate_right', '#9c27b0');
        const btnInspect = this.createCircleBtn('visibility', '#4caf50');
        
        btnDelete.onclick = (e) => {
            e.stopPropagation();
            if (this.app.map.selectedPlacement) {
                if (this.app.parser) {
                    this.app.parser.removePlacement(this.app.map.selectedPlacement);
                }
                this.app.map.selectedPlacement = null;
                this.app.map.hoveredPlacement = null;
                this.app.map.draw();
                this.hideActionMenu();
            }
        };
        
        btnRotate.onclick = (e) => {
            e.stopPropagation();
            if (this.app.map.selectedPlacement) {
                this.app.map.rotateSelected(1);
            }
        };
        
        btnInspect.onclick = (e) => {
            e.stopPropagation();
            if (this.app.map.selectedPlacement) {
                this.showItemInfo(this.app.map.selectedPlacement.item_id);
                this.hideActionMenu();
            }
        };
        
        this.actionMenu.appendChild(btnDelete);
        this.actionMenu.appendChild(btnRotate);
        this.actionMenu.appendChild(btnInspect);
        
        document.body.appendChild(this.actionMenu);
    }
    
    createCircleBtn(iconName, bgColor) {
        const btn = document.createElement('div');
        btn.style.width = '40px';
        btn.style.height = '40px';
        btn.style.borderRadius = '50%';
        btn.style.backgroundColor = bgColor;
        btn.style.display = 'flex';
        btn.style.alignItems = 'center';
        btn.style.justifyContent = 'center';
        btn.style.cursor = 'pointer';
        btn.style.boxShadow = '0 2px 5px rgba(0,0,0,0.3)';
        btn.style.border = '2px solid white';
        
        const icon = document.createElement('span');
        icon.className = 'material-symbols-outlined';
        icon.innerText = iconName;
        icon.style.color = 'white';
        icon.style.fontSize = '20px';
        
        btn.appendChild(icon);
        return btn;
    }

    showActionMenu(x, y) {
        this.actionMenu.style.left = x + 'px';
        this.actionMenu.style.top = y + 'px';
        this.actionMenu.style.display = 'flex';
    }

    hideActionMenu() {
        if (this.actionMenu) this.actionMenu.style.display = 'none';
    }

    createInfoModal() {
        this.infoModal = document.createElement('div');
        this.infoModal.style.position = 'fixed';
        this.infoModal.style.top = '0';
        this.infoModal.style.left = '0';
        this.infoModal.style.width = '100%';
        this.infoModal.style.height = '100%';
        this.infoModal.style.backgroundColor = 'rgba(0,0,0,0.5)';
        this.infoModal.style.zIndex = '10000';
        this.infoModal.style.display = 'none';
        this.infoModal.style.alignItems = 'center';
        this.infoModal.style.justifyContent = 'center';
        
        const content = document.createElement('div');
        content.style.backgroundColor = '#ffcc80'; // Default frame color
        content.style.borderRadius = '15px';
        content.style.padding = '20px';
        content.style.width = '90%';
        content.style.maxWidth = '350px';
        content.style.border = '5px solid #ffb74d';
        content.style.boxShadow = '0 10px 20px rgba(0,0,0,0.3)';
        content.style.textAlign = 'center';
        content.style.position = 'relative';
        
        const closeBtn = document.createElement('span');
        closeBtn.className = 'material-symbols-outlined';
        closeBtn.innerText = 'close';
        closeBtn.style.position = 'absolute';
        closeBtn.style.bottom = '-60px';
        closeBtn.style.left = '50%';
        closeBtn.style.transform = 'translateX(-50%)';
        closeBtn.style.backgroundColor = '#e57373';
        closeBtn.style.color = 'white';
        closeBtn.style.borderRadius = '50%';
        closeBtn.style.padding = '10px';
        closeBtn.style.fontSize = '30px';
        closeBtn.style.cursor = 'pointer';
        closeBtn.style.border = '3px solid white';
        closeBtn.onclick = () => this.hideInfoModal();
        
        const imgWrap = document.createElement('div');
        imgWrap.style.backgroundColor = '#f4a460';
        imgWrap.style.borderRadius = '50%';
        imgWrap.style.width = '100px';
        imgWrap.style.height = '100px';
        imgWrap.style.margin = '0 auto 15px auto';
        imgWrap.style.display = 'flex';
        imgWrap.style.alignItems = 'center';
        imgWrap.style.justifyContent = 'center';
        imgWrap.style.overflow = 'hidden';
        
        this.modalImg = document.createElement('img');
        this.modalImg.style.maxWidth = '80%';
        this.modalImg.style.maxHeight = '80%';
        imgWrap.appendChild(this.modalImg);
        
        this.modalTitle = document.createElement('h2');
        this.modalTitle.style.margin = '0 0 15px 0';
        this.modalTitle.style.color = '#5d4037';
        this.modalTitle.style.fontFamily = 'Quicksand, sans-serif';
        this.modalTitle.style.fontSize = '24px';
        
        this.modalDesc = document.createElement('p');
        this.modalDesc.style.margin = '0';
        this.modalDesc.style.color = '#4e342e';
        this.modalDesc.style.fontFamily = 'Quicksand, sans-serif';
        this.modalDesc.style.lineHeight = '1.4';
        
        content.appendChild(imgWrap);
        content.appendChild(this.modalTitle);
        content.appendChild(this.modalDesc);
        content.appendChild(closeBtn);
        
        this.infoModal.appendChild(content);
        document.body.appendChild(this.infoModal);
    }
    
    showItemInfo(item_id) {
        let name = "Objeto desconocido";
        let desc = "Sin descripción";
        
        if (window.ITEMS_DB && window.ITEMS_DB[item_id]) {
            const data = window.ITEMS_DB[item_id];
            // Since we merged ITEMS_DB, we can prioritize furn_name_es
            name = data.furn_name_es || data.furn_name || data.name_es || data.item_name || name;
            
            // Remove bilingual slash if present
            const slash = name.indexOf('/');
            if (slash !== -1) name = name.substring(0, slash).trim();
            
            // For description, we unfortunately only have the generic desc_es, which might be the item's
            desc = data.desc_es || desc;
        }
        
        this.modalTitle.innerText = name;
        this.modalDesc.innerText = desc;
        
        if (this.app && this.app.map) {
            const img = this.app.map.getImage(item_id, 0);
            if (img && img.src) {
                this.modalImg.src = img.src;
            }
        }
        
        this.infoModal.style.display = 'flex';
    }
    
    hideInfoModal() {
        this.infoModal.style.display = 'none';
    }
}

window.GameUI = GameUI;
