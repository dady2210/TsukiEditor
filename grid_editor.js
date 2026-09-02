class GridEditor {
    constructor(app) {
        this.app = app;
        this.surfaceSelect = document.getElementById('grid-surface-select');
        this.mapSelect = document.getElementById('grid-map-select');
        this.cols     = document.getElementById('grid-cols');
        this.rows     = document.getElementById('grid-rows');
        this.groupNum = document.getElementById('grid-groupnum');
        this.flipped  = document.getElementById('grid-flipped');
        this.cellWInput = document.getElementById('grid-cell-w');
        this.cellHInput = document.getElementById('grid-cell-h');
        this.cellWRange = document.getElementById('grid-cell-w-range');
        this.cellHRange = document.getElementById('grid-cell-h-range');
        this.maskInput = document.getElementById('grid-mask');
        this.defaultCoverInput = document.getElementById('grid-default-cover');
        this.commentInput = document.getElementById('grid-comment');

        // Ensure atlasConfig exists
        if (!window.atlasConfig) window.atlasConfig = { bgScale: 0.75 };

        this.activeSurfaceIndex = -1;
        this.currentMapId = this.mapSelect ? parseInt(this.mapSelect.value, 10) : 0;
        this.bindEvents();
    }

    _filteredIndices() {
        return window.mapsAtlas.map((s, i) => ({ s, i })).filter(x => String(x.s.mapId) === String(this.currentMapId)).map(x => x.i);
    }

    bindEvents() {
        document.getElementById('btn-add-floor').onclick = () => this.addSurface('floor');
        document.getElementById('btn-add-wall').onclick  = () => this.addSurface('wall');

        if (this.mapSelect) {
            this.mapSelect.onchange = () => {
                this.currentMapId = parseInt(this.mapSelect.value, 10);
                // sincronizar select-location para que map.js dibuje el fondo correcto
                const sel = document.getElementById('select-location');
                if (sel) {
                    if (!Array.from(sel.options).some(o => o.value === String(this.currentMapId))) {
                        const opt = document.createElement('option');
                        opt.value = String(this.currentMapId);
                        opt.textContent = this.mapSelect.options[this.mapSelect.selectedIndex].textContent;
                        sel.appendChild(opt);
                    }
                    sel.value = String(this.currentMapId);
                }
                this.activeSurfaceIndex = -1;
                this.refreshSelect();
                this.app.map.draw();
            };
        }

        this.surfaceSelect.onchange = () => {
            this.activeSurfaceIndex = parseInt(this.surfaceSelect.value);
            this.updateForm();
            this.app.map.draw();
        };

        const updateAtlas = () => {
            if (this.activeSurfaceIndex === -1) return;
            const surf = window.mapsAtlas[this.activeSurfaceIndex];
            surf.cols     = parseInt(this.cols.value);
            surf.rows     = parseInt(this.rows.value);
            surf.groupNum = parseInt(this.groupNum.value);
            surf.flipped  = this.flipped.checked;
            if (this.maskInput) {
                const m = this.maskInput.value.trim();
                if (m) surf.mask = m; else delete surf.mask;
            }
            if (this.defaultCoverInput) {
                const v = this.defaultCoverInput.value.trim();
                if (v !== '') surf.defaultCoverId = parseInt(v, 10); else delete surf.defaultCoverId;
            }
            if (this.commentInput) {
                const c = this.commentInput.value.trim();
                if (c) surf.comment = c; else delete surf.comment;
            }
            this.refreshSelect();
            this.app.map.draw();
        };

        this.cols.onchange     = updateAtlas;
        this.rows.onchange     = updateAtlas;
        this.groupNum.onchange = updateAtlas;
        this.flipped.onchange  = updateAtlas;
        if (this.maskInput) this.maskInput.onchange = updateAtlas;
        if (this.defaultCoverInput) this.defaultCoverInput.onchange = updateAtlas;
        if (this.commentInput) this.commentInput.onchange = updateAtlas;

        // ── Cell size (w/h) ────────────────────────────────────────────────
        const updateCellSize = () => {
            if (this.activeSurfaceIndex === -1) return;
            const surf = window.mapsAtlas[this.activeSurfaceIndex];
            const w = Math.max(8, parseInt(this.cellWInput.value) || 64);
            const h = Math.max(4, parseInt(this.cellHInput.value) || 32);
            surf.cell = { w, h };
            this.cellWRange.value = w;
            this.cellHRange.value = h;
            this.app.map.draw();
        };
        this.cellWRange.oninput  = () => { this.cellWInput.value = this.cellWRange.value; updateCellSize(); };
        this.cellHRange.oninput  = () => { this.cellHInput.value = this.cellHRange.value; updateCellSize(); };
        this.cellWInput.onchange = () => { this.cellWRange.value = this.cellWInput.value; updateCellSize(); };
        this.cellHInput.onchange = () => { this.cellHRange.value = this.cellHInput.value; updateCellSize(); };

        // ── Background scale ───────────────────────────────────────────────
        const bgScaleRange = document.getElementById('grid-bg-scale-range');
        const bgScaleNum   = document.getElementById('grid-bg-scale-num');
        if (bgScaleRange && bgScaleNum) {
            const updateBgScale = () => {
                const v = parseFloat(bgScaleNum.value) || 0.75;
                window.atlasConfig.bgScale = Math.round(v * 1000) / 1000;
                bgScaleRange.value = v;
                this.app.map.draw();
            };
            bgScaleRange.oninput  = () => { bgScaleNum.value = bgScaleRange.value; updateBgScale(); };
            bgScaleNum.onchange   = () => { bgScaleRange.value = bgScaleNum.value; updateBgScale(); };
            bgScaleRange.value = window.atlasConfig.bgScale || 0.75;
            bgScaleNum.value   = window.atlasConfig.bgScale || 0.75;
        }

        // ── Nudge ──────────────────────────────────────────────────────────
        const nudge = (dx, dy) => {
            if (this.activeSurfaceIndex === -1) return;
            const surf = window.mapsAtlas[this.activeSurfaceIndex];
            surf.origin_px.x += dx;
            surf.origin_px.y += dy;
            this.app.map.draw();
        };
        document.getElementById('grid-btn-up').onclick    = () => nudge(0, -1);
        document.getElementById('grid-btn-down').onclick  = () => nudge(0,  1);
        document.getElementById('grid-btn-left').onclick  = () => nudge(-1, 0);
        document.getElementById('grid-btn-right').onclick = () => nudge( 1, 0);

        document.getElementById('btn-save-atlas').onclick = () => this.saveAtlas();
    }

    refreshSelect() {
        this.surfaceSelect.innerHTML = '';
        const indices = this._filteredIndices();
        indices.forEach(i => {
            const s = window.mapsAtlas[i];
            const opt = document.createElement('option');
            opt.value = i;
            let name = s.kind === 'floor' ? 'Piso' : (s.flipped ? 'Pared Izq' : 'Pared Der');
            opt.textContent = `[Grp ${s.groupNum}] ${name} (${s.cols}x${s.rows})`;
            this.surfaceSelect.appendChild(opt);
        });
        if (this.activeSurfaceIndex !== -1 && indices.includes(this.activeSurfaceIndex)) {
            this.surfaceSelect.value = this.activeSurfaceIndex;
        } else if (indices.length > 0) {
            this.surfaceSelect.value = indices[0];
            this.activeSurfaceIndex  = indices[0];
            this.updateForm();
        } else {
            this.activeSurfaceIndex = -1;
        }
    }

    updateForm() {
        if (this.activeSurfaceIndex === -1) return;
        const surf = window.mapsAtlas[this.activeSurfaceIndex];
        this.cols.value     = surf.cols;
        this.rows.value     = surf.rows;
        this.groupNum.value = surf.groupNum;
        this.flipped.checked  = surf.flipped;
        this.flipped.disabled = surf.kind === 'floor';
        const cw = (surf.cell && surf.cell.w) || 64;
        const ch = (surf.cell && surf.cell.h) || 32;
        this.cellWInput.value = cw; this.cellWRange.value = cw;
        this.cellHInput.value = ch; this.cellHRange.value = ch;
        if (this.maskInput) this.maskInput.value = surf.mask || '';
        if (this.defaultCoverInput) this.defaultCoverInput.value = surf.defaultCoverId != null ? surf.defaultCoverId : '';
        if (this.commentInput) this.commentInput.value = surf.comment || '';
    }

    addSurface(kind) {
        const curMap = this.currentMapId != null ? this.currentMapId : 0;
        const newSurf = {
            mapId: curMap, kind, groupNum: window.mapsAtlas.filter(s => String(s.mapId) === String(curMap)).length,
            flipped: false, rows: curMap === 6 ? 26 : 16, cols: curMap === 6 ? 26 : 16,
            origin_px: { x: curMap === 6 ? 500 : 329, y: curMap === 6 ? 300 : 926 }, cell: { w: 64, h: 32 }
        };
        window.mapsAtlas.push(newSurf);
        this.activeSurfaceIndex = window.mapsAtlas.length - 1;
        this.refreshSelect();
        this.updateForm();
        this.app.map.draw();
    }

    _autoSave(){
        if(location.protocol==='file:') return;
        const payload={ atlas: window.mapsAtlas, meta: window.MAP_META, atlasConfig: window.atlasConfig };
        fetch('/api/save/maps', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)}).catch(()=>{});
    }
    saveAtlas() {
        this._autoSave();
        // Preserve F()/W() format compatible con <script src> legacy — emit JSON but keep MAP_META header
        const cfg   = JSON.stringify(window.atlasConfig || { bgScale: 0.75 }, null, 2);
        const atlas = JSON.stringify(window.mapsAtlas, null, 2);
        const meta = window.MAP_META ? `\nwindow.MAP_META = ${JSON.stringify(window.MAP_META, null, 2)};\n` : '';
        const header = `/* maps_atlas.js origin_px medidos casa 0 g0/g1 KEEP */\n`;
        const content = header + `window.atlasConfig = ${cfg};\nwindow.mapsAtlas = ${atlas};\n` + meta;
        const blob = new Blob([content], { type: 'application/javascript' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href = url; a.download = 'maps_atlas.js';
        document.body.appendChild(a); a.click();
        document.body.removeChild(a); URL.revokeObjectURL(url);
    }
}
