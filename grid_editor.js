class GridEditor {
    constructor(app) {
        this.app = app;
        this.surfaceSelect = document.getElementById('grid-surface-select');
        this.cols = document.getElementById('grid-cols');
        this.rows = document.getElementById('grid-rows');
        this.groupNum = document.getElementById('grid-groupnum');
        this.flipped = document.getElementById('grid-flipped');
        
        this.activeSurfaceIndex = -1;
        
        this.bindEvents();
    }
    
    bindEvents() {
        document.getElementById('btn-add-floor').onclick = () => this.addSurface('floor');
        document.getElementById('btn-add-wall').onclick = () => this.addSurface('wall');
        
        this.surfaceSelect.onchange = () => {
            this.activeSurfaceIndex = parseInt(this.surfaceSelect.value);
            this.updateForm();
            this.app.map.draw();
        };
        
        const updateAtlas = () => {
            if (this.activeSurfaceIndex === -1) return;
            const surf = window.mapsAtlas[this.activeSurfaceIndex];
            surf.cols = parseInt(this.cols.value);
            surf.rows = parseInt(this.rows.value);
            surf.groupNum = parseInt(this.groupNum.value);
            surf.flipped = this.flipped.checked;
            this.refreshSelect();
            this.app.map.draw();
        };
        
        this.cols.onchange = updateAtlas;
        this.rows.onchange = updateAtlas;
        this.groupNum.onchange = updateAtlas;
        this.flipped.onchange = updateAtlas;
        
        const nudge = (dx, dy) => {
            if (this.activeSurfaceIndex === -1) return;
            const surf = window.mapsAtlas[this.activeSurfaceIndex];
            surf.origin_px.x += dx;
            surf.origin_px.y += dy;
            this.app.map.draw();
        };
        
        document.getElementById('grid-btn-up').onclick = () => nudge(0, -1);
        document.getElementById('grid-btn-down').onclick = () => nudge(0, 1);
        document.getElementById('grid-btn-left').onclick = () => nudge(-1, 0);
        document.getElementById('grid-btn-right').onclick = () => nudge(1, 0);
        
        document.getElementById('btn-save-atlas').onclick = () => this.saveAtlas();
    }
    
    refreshSelect() {
        this.surfaceSelect.innerHTML = '';
        window.mapsAtlas.forEach((s, i) => {
            const opt = document.createElement('option');
            opt.value = i;
            let name = s.kind === 'floor' ? 'Piso' : (s.flipped ? 'Pared Der' : 'Pared Izq');
            opt.textContent = `[Grp ${s.groupNum}] ${name} (${s.cols}x${s.rows})`;
            this.surfaceSelect.appendChild(opt);
        });
        if (this.activeSurfaceIndex !== -1) {
            this.surfaceSelect.value = this.activeSurfaceIndex;
        } else if (window.mapsAtlas.length > 0) {
            this.surfaceSelect.value = 0;
            this.activeSurfaceIndex = 0;
            this.updateForm();
        }
    }
    
    updateForm() {
        if (this.activeSurfaceIndex === -1) return;
        const surf = window.mapsAtlas[this.activeSurfaceIndex];
        this.cols.value = surf.cols;
        this.rows.value = surf.rows;
        this.groupNum.value = surf.groupNum;
        this.flipped.checked = surf.flipped;
        this.flipped.disabled = surf.kind === 'floor';
    }
    
    addSurface(kind) {
        const newSurf = {
            mapId: 0,
            kind: kind,
            groupNum: window.mapsAtlas.length,
            flipped: false,
            rows: 16,
            cols: 16,
            origin_px: { x: 329, y: 926 },
            cell: { w: 64, h: 32 }
        };
        window.mapsAtlas.push(newSurf);
        this.activeSurfaceIndex = window.mapsAtlas.length - 1;
        this.refreshSelect();
        this.app.map.draw();
    }
    
    saveAtlas() {
        const jsonStr = JSON.stringify(window.mapsAtlas, null, 2);
        const fileContent = "window.mapsAtlas = " + jsonStr + ";\n";
        const blob = new Blob([fileContent], { type: 'application/javascript' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'maps_atlas.js';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}
