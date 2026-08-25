// ────────────────────────────────────────────────────────────────
// map.js — Isometric 3D Map renderer for Tsuki's Odyssey Save Editor
// ────────────────────────────────────────────────────────────────

// Known sublocation cluster → friendly name
// Cluster IDs come from the order the parser discovers groups of placements.
// The real sublocationSave keys are Int32s; until we fully walk that dict,
// we map location IDs to standard generic names since they can vary.
const SUBLOC_NAMES = {
    0:  "🏡 Tsuki's Treehouse",
    1:  "🚂 Train Station",
    2:  "🦒 Chi's House",
    3:  "🐢 Moca's House",
    4:  "🏪 Yori's General Store",
    5:  "🧜‍♀️ Mermaid Coast",
    6:  "🥕 Tsuki's Farm",
    7:  "🏛️ Town Hall",
    8:  "🍜 Bobo's Ramen Restaurant",
    9:  "🍵 Momo's Tea House",
    10: "🌻 Rosemary's Plant Shop",
    11: "🧰 Dawn's Workshop",
    12: "🎷 Scarlett's Lounge"
};

// Furniture IDs considered "ground" / floor layer (rendered below everything)
const GROUND_IDS   = new Set([306, 411]);     // Plot, Soil Hydrator
// Seed / Crop IDs that sit ON TOP of a Plot (FURN_306)
const SEED_IDS     = new Set([342, 345, 1208, 1230, 1231, 1232, 1233, 1237, 1238, 1301]);
// Harvest action ID
const HARVEST_ID   = 900;

// Default sizes for IDs where sizes.json has w:0 (unknown)
const DEFAULT_SIZES = { w: 2, l: 2 }; // Fallback
const PLOT_SIZE     = { w: 2, l: 2 };   // FURN_306 Plot tile

// Redondeo "half away from zero" simétrico. Math.round nativo redondea los
// .5 siempre hacia +Infinity (round(0.5)=1 pero round(-0.5)=0), lo que hace
// que un mueble con diferencia impar entre ancho y largo (3x2, 2x3, etc.)
// "derive" un tile por cada vuelta completa al rotar. Con este redondeo
// simétrico, los desplazamientos de +0.5/-0.5 de cada paso de 90° se
// cancelan entre sí y una rotación de 360° vuelve exactamente al x/y original.
function roundAwayFromZero(n) {
    return Math.sign(n) * Math.round(Math.abs(n));
}

class IsometricMap {
    constructor(canvas, app) {
        this.canvas = canvas;
        this.ctx    = canvas.getContext('2d');
        this.app    = app;

        this.CELL_W = 64;
        this.CELL_H = 32;
        this.gridSize = 50;

        this.offsetX = 0;
        this.offsetY = 0;
        this.scale   = window.innerWidth <= 900 ? 0.6 : 1.0;

        this.isDragging    = false;
        this.isPanDragging = false;
        this.isItemDragging= false;
        this.dragStartX    = 0;
        this.dragStartY    = 0;

        this.selectedPlacement = null;
        this.hoveredPlacement  = null;

        // Image cache: item_id → HTMLImageElement
        this._imgCache = {};

        // Background grid caches (ver _buildFloorGridCache/_buildWallGridCache)
        this._floorGridCache = null;
        this._wallGridCache  = null;
        this._rafId = undefined;

        this.bindEvents();
    }

    // ── Size helpers ──────────────────────────────────────────────────────
    getSize(item_id) {
        if (GROUND_IDS.has(item_id) || SEED_IDS.has(item_id)) return { ...PLOT_SIZE };
        
        // Use the exact sizes extracted from Unity
        if (typeof window.getFurnitureSize === 'function') {
            const s = window.getFurnitureSize(String(item_id));
            if (s && s.width > 0 && s.length > 0) return { w: s.width, l: s.length };
        }
        
        return { ...DEFAULT_SIZES };
    }

    getRotatedSize(item_id, orientation) {
        // La orientación en este juego es frente/atrás + espejado horizontal
        // (ver _drawSpriteOnTile: solo flipH + darken, nunca gira el sprite
        // 90°; y los labels de la UI son "Frente Der/Izq" / "Atrás Izq/Der",
        // no ángulos). El footprint en grilla es una propiedad física del
        // objeto y no cambia según hacia dónde mire, así que siempre debe
        // ser el tamaño base de sizes.js, sin intercambiar w/l.
        return this.getSize(item_id);
    }

    getImage(item_id, orientation) {
        // 0: SE (Front Right)
        // 1: SW (Front Left)
        // 2: NW (Back Left)
        // 3: NE (Back Right)
        const isBack = orientation === 2 || orientation === 3;
        const frontKey = `${item_id}`;
        const backKey = `${item_id}_BACK`;
        
        const cacheKey = isBack ? backKey : frontKey;
        
        if (this._imgCache[cacheKey] !== undefined) {
            return this._imgCache[cacheKey];
        }

        this._imgCache[cacheKey] = false;
        
        const loadImg = (keyToLoad, fallbackCb) => {
            const img = new Image();
            img.onload = () => { this._imgCache[cacheKey] = img; this.draw(); };
            img.onerror = () => {
                const img2 = new Image();
                img2.onload = () => { this._imgCache[cacheKey] = img2; this.draw(); };
                img2.onerror = fallbackCb;
                img2.src = `images/items/FURN_${keyToLoad}.png?v=5`;
            };
            img.src = `images/items/FURN_${keyToLoad}_0.png?v=5`;
        };

        if (isBack) {
            // Try loading back image, if it fails, load front image instead
            loadImg(backKey, () => {
                // Back image failed completely, fallback to front image
                // The draw logic will apply the darken filter for orientation 2/3
                loadImg(frontKey, () => {
                    this._imgCache[cacheKey] = null;
                    this.draw();
                });
            });
        } else {
            // Normal front load
            loadImg(frontKey, () => {
                this._imgCache[cacheKey] = null;
                this.draw();
            });
        }
        
        return false;
    }

    getCropImage(item_id) {
        if (item_id === undefined || item_id === -1) return null;
        const cacheKey = `CROP_ICON_${item_id}`;
        
        if (this._imgCache[cacheKey] !== undefined) {
            return this._imgCache[cacheKey];
        }

        this._imgCache[cacheKey] = false;
        
        const img = new Image();
        img.onload = () => { this._imgCache[cacheKey] = img; this.draw(); };
        img.onerror = () => {
            const img2 = new Image();
            img2.onload = () => { this._imgCache[cacheKey] = img2; this.draw(); };
            img2.onerror = () => {
                const img3 = new Image();
                img3.onload = () => { this._imgCache[cacheKey] = img3; this.draw(); };
                img3.onerror = () => { this._imgCache[cacheKey] = null; };
                img3.src = `images/items/CROP_${item_id}.png?v=5`;
            };
            img2.src = `images/items/ITEM_${item_id}.png?v=5`;
        };
        img.src = `images/items/FURN_${item_id}.png?v=5`;
        
        return false;
    }

    // ─── Coordinate transforms ───────────────────────────────────────────────
    getIsoCoords(x, y) {
        const isoX = (x - y) * (this.CELL_W / 2);
        const isoY = -(x + y) * (this.CELL_H / 2); // Negative so it goes UP the screen
        return {
            x: isoX * this.scale + this.offsetX,
            y: isoY * this.scale + this.offsetY,
        };
    }

    getCartesianCoords(screenX, screenY) {
        const layerRadio = document.querySelector('input[name="map-layer"]:checked');
        if (layerRadio && layerRadio.value === 'wall') {
            return {
                x: Math.floor((screenX - 100) / this.gridSize),
                y: Math.floor((screenY - 100) / this.gridSize)
            };
        }
        const isoX = (screenX - this.offsetX) / this.scale;
        const isoY = (screenY - this.offsetY) / this.scale;
        const u = isoX / (this.CELL_W / 2);
        const v = -isoY / (this.CELL_H / 2);
        return { x: (u + v) / 2, y: (v - u) / 2 };
    }

    // ── Resize ────────────────────────────────────────────────────────────
    resize() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width  = rect.width;
        this.canvas.height = rect.height;
        // Center camera
        this.offsetX = this.canvas.width  / 2;
        this.offsetY = this.canvas.height * 0.65;
        this.draw();
    }

    // ── Draw ──────────────────────────────────────────────────────────────
    getBackgroundImage(imgName) {
        if (!this._bgCache) this._bgCache = {};
        if (this._bgCache[imgName] !== undefined) return this._bgCache[imgName];
        
        const img = new Image();
        this._bgCache[imgName] = false;
        img.onload = () => { this._bgCache[imgName] = img; this.draw(); };
        img.onerror = () => { this._bgCache[imgName] = null; };
        img.src = `images/all_sprites/${imgName}`;
        return false;
    }


    // ── Grid cache (fondo estático) ──────────────────────────────────────
    // La grilla de referencia (verde en piso, naranja en pared) no cambia
    // nunca entre frames -- solo depende de la cámara (pan/zoom), que ya se
    // aplica como transform al pegar el bitmap. Se dibuja una sola vez a un
    // canvas en memoria en vez de repetir cientos de stroke() por frame.
    _isoWorld(x, y) {
        return {
            x: (x - y) * (this.CELL_W / 2),
            y: -(x + y) * (this.CELL_H / 2),
        };
    }

    _buildFloorGridCache() {
        const pad   = 4;
        const halfW = 32 * (this.CELL_W / 2); // 1024
        const halfH = 32 * (this.CELL_H / 2); // 1024
        const originX = -halfW - pad;
        const originY = -halfH - pad;

        const cache = document.createElement('canvas');
        cache.width  = halfW * 2 + pad * 2;
        cache.height = halfH + pad * 2;
        const cctx = cache.getContext('2d');
        cctx.translate(-originX, -originY);
        cctx.strokeStyle = 'rgba(100, 255, 100, 0.8)';
        cctx.lineWidth = 1.5;
        for (let x = 0; x < 32; x++) {
            for (let y = 0; y < 32; y++) {
                const top   = this._isoWorld(x,   y);
                const right = this._isoWorld(x+1, y);
                const bot   = this._isoWorld(x+1, y+1);
                const left  = this._isoWorld(x,   y+1);
                cctx.beginPath();
                cctx.moveTo(top.x, top.y);
                cctx.lineTo(right.x, right.y);
                cctx.lineTo(bot.x, bot.y);
                cctx.lineTo(left.x, left.y);
                cctx.closePath();
                cctx.stroke();
            }
        }

        this._floorGridCache   = cache;
        this._floorGridOriginX = originX;
        this._floorGridOriginY = originY;
    }

    _buildWallGridCache() {
        const cellSize = this.gridSize;
        const cache = document.createElement('canvas');
        cache.width  = 25 * cellSize;
        cache.height = 15 * cellSize;
        const cctx = cache.getContext('2d');
        cctx.strokeStyle = 'rgba(255, 150, 100, 0.8)';
        cctx.lineWidth = 1.5;
        for (let x = 0; x < 25; x++) {
            for (let y = 0; y < 15; y++) {
                cctx.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize);
            }
        }
        this._wallGridCache = cache;
    }

    getWallSize(item_id) {
        if (typeof window.getFurnitureSize === 'function') {
            const s = window.getFurnitureSize(String(item_id));
            if (s && s.width > 0) return { w: s.width, h: (s.height || s.length || 1) };
        }
        return { w: 1, h: 1 };
    }

    _wallpaperEntries(loc) {
        const dict = this.app.parser && this.app.parser.wallpapers;
        return (dict && dict[loc]) ? dict[loc] : [];
    }

    _floorCoveringEntries(loc) {
        const dict = this.app.parser && this.app.parser.floors;
        return (dict && dict[loc]) ? dict[loc] : [];
    }

    // Pared isométrica: cara no-flipped corre sobre el eje Y del piso (x=0);
    // cara flipped corre sobre el eje X (y=0). wy es altura sobre la pared.
    getWallIsoCoords(wx, wy, flipped) {
        const base = flipped ? this.getIsoCoords(wx, 0) : this.getIsoCoords(0, wx);
        return { x: base.x, y: base.y - wy * this.CELL_H * this.scale };
    }

    _pathWallCell(wx, wy, ww, wh, flipped) {
        const bl = this.getWallIsoCoords(wx, wy, flipped);
        const br = this.getWallIsoCoords(wx + ww, wy, flipped);
        const tr = this.getWallIsoCoords(wx + ww, wy + wh, flipped);
        const tl = this.getWallIsoCoords(wx, wy + wh, flipped);
        this.ctx.beginPath();
        this.ctx.moveTo(bl.x, bl.y);
        this.ctx.lineTo(br.x, br.y);
        this.ctx.lineTo(tr.x, tr.y);
        this.ctx.lineTo(tl.x, tl.y);
        this.ctx.closePath();
    }

    _drawMapHud(targetLoc, isWallLayer, targetWallGroup) {
        const ctx = this.ctx;
        const wps = this._wallpaperEntries(targetLoc);
        const fls = this._floorCoveringEntries(targetLoc);
        const walls = (this.app.parser.placements || []).filter(
            p => p.isWall && Number(p.cluster) === Number(targetLoc) && Number(p.item_id) > 0
        );
        const groupWalls = isWallLayer
            ? walls.filter(p => String(p.floor) === String(targetWallGroup))
            : walls;

        const wpTxt = wps.length
            ? wps.map(w => `key ${w.key} → ID ${w.id}`).join('   ·   ')
            : 'sin wallpaper en el save';
        const flTxt = fls.length
            ? fls.map(f => `key ${f.key} → ID ${f.id}`).join('   ·   ')
            : 'sin floor covering';
        const wallTxt = isWallLayer
            ? `Pared group ${targetWallGroup}: ${groupWalls.length} muebles`
            : `Muebles de pared: ${walls.length} (capa Pared para editar)`;

        const lines = [
            `🎨 Wallpaper: ${wpTxt}`,
            `🪵 Piso cubierto: ${flTxt}`,
            `🖼️ ${wallTxt}`
        ];

        ctx.save();
        ctx.font = `600 ${Math.max(11, Math.round(12 * Math.min(1.2, this.scale)))}px 'Quicksand', sans-serif`;
        let maxW = 0;
        for (const ln of lines) maxW = Math.max(maxW, ctx.measureText(ln).width);
        const pad = 10;
        const lineH = 18;
        const boxW = Math.min(this.canvas.width - 24, maxW + pad * 2);
        const boxH = lines.length * lineH + pad * 2;
        ctx.fillStyle = 'rgba(30, 18, 10, 0.78)';
        ctx.beginPath();
        ctx.roundRect(12, 12, boxW, boxH, 10);
        ctx.fill();
        ctx.fillStyle = '#f5e6c8';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        lines.forEach((ln, i) => ctx.fillText(ln, 12 + pad, 12 + pad + i * lineH, boxW - pad * 2));
        ctx.restore();
    }

    _drawIsoWallGrids(targetLoc) {
        const walls = (this.app.parser.placements || []).filter(
            p => p.isWall && Number(p.cluster) === Number(targetLoc) && Number(p.item_id) > 0
        );
        for (const flipped of [false, true]) {
            const subset = walls.filter(p => !!p.flipped === flipped);
            let maxX = 10;
            let maxY = 6;
            for (const p of subset) {
                const sz = this.getWallSize(p.item_id);
                maxX = Math.max(maxX, (p.x || 0) + sz.w);
                maxY = Math.max(maxY, (p.y || 0) + sz.h);
            }
            maxX = Math.min(Math.max(maxX, 8), 28);
            maxY = Math.min(Math.max(maxY, 5), 14);

            this.ctx.save();
            this.ctx.strokeStyle = flipped ? 'rgba(255, 160, 80, 0.85)' : 'rgba(110, 190, 255, 0.85)';
            this.ctx.lineWidth = 1;
            this.ctx.globalAlpha = 0.45;
            for (let x = 0; x < maxX; x++) {
                for (let y = 0; y < maxY; y++) {
                    this._pathWallCell(x, y, 1, 1, flipped);
                    this.ctx.stroke();
                }
            }
            this.ctx.restore();

            // Etiqueta de wallpaper sobre el tope de cada cara
            const wps = this._wallpaperEntries(targetLoc);
            const top = this.getWallIsoCoords(maxX / 2, maxY + 0.4, flipped);
            const label = wps.length
                ? `WP ${wps.map(w => w.id).join(', ')}  (${flipped ? 'flipped' : 'normal'})`
                : `(${flipped ? 'flipped' : 'normal'})`;
            this.ctx.save();
            this.ctx.font = `bold ${Math.max(10, Math.round(11 * this.scale))}px 'Quicksand', sans-serif`;
            this.ctx.fillStyle = 'rgba(20,12,8,0.75)';
            const tw = this.ctx.measureText(label).width;
            this.ctx.beginPath();
            this.ctx.roundRect(top.x - tw / 2 - 6, top.y - 14, tw + 12, 18, 6);
            this.ctx.fill();
            this.ctx.fillStyle = '#ffe7c2';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(label, top.x, top.y - 5);
            this.ctx.restore();

            subset.sort((a, b) => a.y - b.y);
            for (const p of subset) this._drawIsoWallItem(p);
        }
    }

    _drawIsoWallItem(p) {
        const sz = this.getWallSize(p.item_id);
        const flipped = !!p.flipped;
        const isSel = this.selectedPlacement === p;
        const isHov = this.hoveredPlacement === p;

        this.ctx.save();
        this._pathWallCell(p.x, p.y, sz.w, sz.h, flipped);
        this.ctx.fillStyle = isSel ? 'rgba(255,255,255,0.35)' : isHov ? 'rgba(255,200,120,0.28)' : 'rgba(255,140,70,0.22)';
        this.ctx.fill();
        this.ctx.strokeStyle = isSel ? '#fff' : 'rgba(255,220,180,0.85)';
        this.ctx.lineWidth = isSel ? 2 : 1;
        this.ctx.stroke();

        const mid = this.getWallIsoCoords(p.x + sz.w / 2, p.y + sz.h / 2, flipped);
        const img = this.getImage(p.item_id, 0);
        if (img && img.complete && img.naturalWidth > 0) {
            const maxW = Math.max(18, sz.w * this.CELL_W * 0.35 * this.scale);
            const maxH = Math.max(18, sz.h * this.CELL_H * 1.2 * this.scale);
            const s = Math.min(maxW / img.width, maxH / img.height);
            const dw = img.width * s;
            const dh = img.height * s;
            this.ctx.drawImage(img, mid.x - dw / 2, mid.y - dh / 2, dw, dh);
        }
        this.ctx.fillStyle = '#fff';
        this.ctx.font = `bold ${Math.max(9, Math.round(10 * this.scale))}px 'Quicksand', sans-serif`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'top';
        this.ctx.shadowColor = 'rgba(0,0,0,0.8)';
        this.ctx.shadowBlur = 3;
        this.ctx.fillText(`ID ${p.item_id}`, mid.x, mid.y + 6 * this.scale);
        this.ctx.restore();
    }

    // ── Draw (agendado) ──────────────────────────────────────────────────
    // draw() ya no dibuja directo: agenda un único _drawImmediate() por
    // frame vía requestAnimationFrame. Antes, cada mousemove de un pan o
    // arrastre llamaba a draw() de forma síncrona (60-120+ veces/seg), muy
    // por encima de lo que la pantalla puede pintar; ahora varias llamadas
    // a draw() dentro del mismo frame colapsan en un solo redraw real.
    draw() {
        if (this._rafId !== undefined) return;
        this._rafId = requestAnimationFrame(() => {
            this._rafId = undefined;
            this._drawImmediate();
        });
    }

    _drawImmediate() {
        if (!this.app || !this.app.parser || !this.app.parser.placements) return;

        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const targetFloor = document.getElementById('select-floor')?.value || '0';
        const targetLocStr = document.getElementById('select-location')?.value;
        const targetLoc = targetLocStr !== undefined && targetLocStr !== "" ? parseInt(targetLocStr, 10) : 1;
        
        const layerRadio = document.querySelector('input[name="map-layer"]:checked');
        const isWallLayer = layerRadio && layerRadio.value === 'wall';
        let targetWallGroup = document.getElementById('select-wall-group')?.value;
        if (!targetWallGroup && this.app && this.app.parser) {
            const walls = this.app.parser.placements.filter(p => p.cluster === targetLoc && p.isWall);
            if (walls.length > 0) targetWallGroup = String(walls[0].floor);
        }
        targetWallGroup = targetWallGroup || '0';


        let drawOffsetX = this.offsetX;
        let drawOffsetY = this.offsetY;
        if (isWallLayer) {
            drawOffsetX = 100;
            drawOffsetY = 100;
        }

        this._updateLocationLabel(targetLoc);

        if (isWallLayer) {
            // WALL LAYER (2D Orthographic)
            if (!this._wallGridCache) this._buildWallGridCache();
            ctx.save();
            ctx.globalAlpha = 0.25;
            ctx.drawImage(this._wallGridCache, drawOffsetX, drawOffsetY);
            ctx.restore();

            // Ejes de la grilla de pared (x a lo largo, y altura)
            ctx.save();
            ctx.font = '10px Quicksand, sans-serif';
            ctx.fillStyle = 'rgba(255,220,180,0.8)';
            ctx.textAlign = 'center';
            for (let x = 0; x < 25; x += 2) {
                ctx.fillText(String(x), drawOffsetX + x * this.gridSize + this.gridSize / 2, drawOffsetY - 6);
            }
            ctx.textAlign = 'right';
            for (let y = 0; y < 15; y += 2) {
                ctx.fillText(String(y), drawOffsetX - 6, drawOffsetY + y * this.gridSize + this.gridSize / 2);
            }
            ctx.restore();

            const walls = this.app.parser.placements.filter(
                p => p.isWall && Number(p.cluster) === Number(targetLoc) && String(p.floor) === String(targetWallGroup) && Number(p.item_id) > 0
            );

            // Z-sort by Y
            walls.sort((a, b) => a.y - b.y);

            for (const p of walls) this._drawPlacement(p, 'regular');
            this._drawMapHud(targetLoc, true, targetWallGroup);

        } else {
            // FLOOR LAYER (Isometric)
            if (!this._floorGridCache) this._buildFloorGridCache();
            ctx.save();
            ctx.globalAlpha = 0.25;
            ctx.translate(this.offsetX, this.offsetY);
            ctx.scale(this.scale, this.scale);
            ctx.drawImage(this._floorGridCache, this._floorGridOriginX, this._floorGridOriginY);
            ctx.restore();

            // Grilla de paredes (isométrica, dos caras) + muebles de pared + IDs
            this._drawIsoWallGrids(targetLoc);

            const all = this.app.parser.placements.filter(
                p => p.floor === targetFloor && p.cluster === targetLoc && !p.isWall && p.item_id !== -1
            );

            const ground  = all.filter(p => GROUND_IDS.has(p.item_id));
            const seeds   = all.filter(p => SEED_IDS.has(p.item_id) && p.x !== -1 && p.y !== -1 && !p.linkedPlot);
            const regular = all.filter(p => !GROUND_IDS.has(p.item_id) && !SEED_IDS.has(p.item_id));

            const sortByZ = (a, b) => (b.x + b.y) - (a.x + a.y); 
            ground.sort(sortByZ);
            seeds.sort(sortByZ);
            regular.sort(sortByZ);

            for (const p of ground)  this._drawPlacement(p, 'ground');
            for (const p of seeds)   this._drawPlacement(p, 'seed');
            for (const p of regular) this._drawPlacement(p, 'regular');
            this._drawMapHud(targetLoc, false, targetWallGroup);
        }

        if (this.hoveredPlacement) this._drawTooltip(this.hoveredPlacement);

        const floatUI = document.getElementById('floating-ui');
        if (floatUI) {
            if (this.selectedPlacement) {
                floatUI.style.display = 'block';
                const layerRadio = document.querySelector('input[name="map-layer"]:checked');
                const isWallLayer = layerRadio && layerRadio.value === 'wall';
                
                let screenPos = { x: 0, y: 0 };
                if (isWallLayer) {
                    screenPos.x = 100 + this.selectedPlacement.x * this.gridSize;
                    screenPos.y = 100 + this.selectedPlacement.y * this.gridSize;
                } else {
                    const iso = this.getIsoCoords(this.selectedPlacement.x, this.selectedPlacement.y);
                    screenPos.x = this.offsetX + iso.x;
                    screenPos.y = this.offsetY + iso.y;
                }
                
                floatUI.style.left = screenPos.x + 'px';
                floatUI.style.top = screenPos.y + 'px';
            } else {
                floatUI.style.display = 'none';
            }
        }
    }
    _updateLocationLabel(locId) {
        const sel = document.getElementById('select-location');
        if (!sel) return;
        const friendlyName = SUBLOC_NAMES[locId] || `Ubicación ${locId}`;
        // Update the label next to the dropdown
        const label = document.getElementById('location-label');
        if (label) label.textContent = friendlyName;
    }

    _drawPlacement(p, layer) {
        const layerRadio = document.querySelector('input[name="map-layer"]:checked');
        if (layerRadio && layerRadio.value === 'wall' && p.isWall) {
            const drawOffsetX = 100;
            const drawOffsetY = 100;
            const sz = this.getWallSize(p.item_id);
            const gx = drawOffsetX + p.x * this.gridSize;
            const gy = drawOffsetY + p.y * this.gridSize;
            const gw = this.gridSize * sz.w;
            const gh = this.gridSize * sz.h;
            
            this.ctx.save();
            const isSel = (this.selectedPlacement === p);
            const isHov = (this.hoveredPlacement === p);

            if (isSel) {
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
                this.ctx.fillRect(gx, gy, gw, gh);
                this.ctx.strokeStyle = 'white';
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(gx, gy, gw, gh);
            } else if (isHov) {
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                this.ctx.fillRect(gx, gy, gw, gh);
                this.ctx.strokeStyle = 'rgba(255,255,255,0.5)';
                this.ctx.lineWidth = 1;
                this.ctx.strokeRect(gx, gy, gw, gh);
            }

            const img = this.getImage(p.item_id, 0); // Wall items are generally front-facing
            // Always draw cell background
            this.ctx.fillStyle = p.flipped ? 'rgba(80, 160, 255, 0.35)' : 'rgba(255, 150, 100, 0.4)';
            this.ctx.fillRect(gx, gy, gw, gh);
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(gx, gy, gw, gh);

            if (img && img.complete && img.naturalWidth > 0) {
                const s = Math.min(gw / img.width, gh / img.height) * 0.9;
                const dw = img.width * s;
                const dh = img.height * s;
                const dx = gx + (gw - dw) / 2;
                const dy = gy + (gh - dh) / 2;
                this.ctx.save();
                this.ctx.translate(gx + gw/2, gy + gh/2);
                if (p.flipped) this.ctx.scale(-1, 1);
                this.ctx.translate(-(gx + gw/2), -(gy + gh/2));
                this.ctx.drawImage(img, dx, dy, dw, dh);
                this.ctx.restore();
            }
            this.ctx.fillStyle = 'white';
            this.ctx.font = 'bold 11px Quicksand, Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'bottom';
            this.ctx.shadowColor = 'rgba(0,0,0,0.85)';
            this.ctx.shadowBlur = 3;
            this.ctx.fillText(`ID ${p.item_id}${p.flipped ? ' F' : ''}`, gx + gw / 2, gy + gh - 3);
            this.ctx.restore();
            return;
        }

        const ctx = this.ctx;
        const { w, l } = this.getRotatedSize(p.item_id, p.orientation);

        const isHovered  = p === this.hoveredPlacement;
        const isSelected = p === this.selectedPlacement;

        // ── Tile fill color ──
        let fillColor;
        if (layer === 'ground') {
            // Dirt/Plot tile — earthy brown with green tint
            fillColor = isSelected ? '#e07b3f' : isHovered ? '#c47a30' : '#8B6914';
        } else if (layer === 'seed') {
            // Seed/Crop on top — green
            fillColor = isSelected ? '#66bb6a' : isHovered ? '#81c784' : '#4caf50';
        } else {
            // Regular furniture
            fillColor = isSelected ? '#ef4444' : isHovered ? '#f97316' : '#4A90D9';
        }

        // Draw tile shadow first
        ctx.save();
        ctx.globalAlpha = 0.25;
        this._drawDiamondPath(p.x + 0.1, p.y + 0.1, w, l, 1.5);
        ctx.fillStyle = '#000';
        ctx.fill();
        ctx.restore();

        // Draw tile base
        this._drawDiamondPath(p.x, p.y, w, l, layer === 'ground' ? 0 : 2);
        ctx.fillStyle   = fillColor;
        ctx.strokeStyle = isSelected ? '#ff2222' : isHovered ? '#ffaa00' : 'rgba(0,0,0,0.4)';
        ctx.lineWidth   = isSelected ? 2.5 : 1.5;
        ctx.fill();
        ctx.stroke();

        // ── Dirt texture pattern for ground tiles ──
        if (layer === 'ground') {
            this._drawDirtTexture(p.x, p.y, w, l);
        }

        // ── Try to draw item image ──
        // Force loading of base image or back variant based on orientation. We'll handle mirroring via Canvas.
        const img = this.getImage(p.item_id, p.orientation);
        if (img) {
            this._drawSpriteOnTile(img, p.x, p.y, w, l, p.orientation, p.item_id);
        } else {
            // Fallback: draw item ID text or name
            const center = this._tileCenter(p.x, p.y, w, l);
            const name   = this._shortName(p.item_id);
            ctx.save();
            ctx.font      = `bold ${Math.max(7, Math.round(10 * this.scale))}px 'Quicksand', sans-serif`;
            ctx.fillStyle = layer === 'ground' ? '#ffe0b2' : layer === 'seed' ? '#e8f5e9' : '#fff';
            ctx.textAlign    = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowColor = 'rgba(0,0,0,0.7)';
            ctx.shadowBlur  = 3;
            ctx.fillText(name, center.x, center.y);
            ctx.restore();
        }

        // ── Draw planted item if present ──
        if (p.planted_id !== undefined && p.planted_id > 0 && p.planted_id !== 4294967295) {
            let plantedImg = this.getCropImage(p.planted_id);
            if (plantedImg) {
                // Draw slightly higher
                this._drawSpriteOnTile(plantedImg, p.x, p.y - 0.5, w, l, 0, p.planted_id);
            }
        }

        // ── Seed label overlay on plot ──
        if (layer === 'seed') {
            const center = this._tileCenter(p.x, p.y, w, l);
            ctx.save();
            ctx.font      = `${Math.max(6, Math.round(8 * this.scale))}px 'Nunito Sans', sans-serif`;
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.shadowColor = 'rgba(0,0,0,0.8)';
            ctx.shadowBlur  = 2;
            ctx.fillText('🌱', center.x, center.y - 8 * this.scale);
            ctx.restore();
        }
    }

    _drawDirtTexture(gx, gy, w, l) {
        // Draw a subtle criss-cross dirt pattern inside the tile
        const ctx = this.ctx;
        const top   = this.getIsoCoords(gx,   gy);
        const right = this.getIsoCoords(gx+w, gy);
        const bot   = this.getIsoCoords(gx+w, gy+l);
        const left  = this.getIsoCoords(gx,   gy+l);

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(top.x, top.y);
        ctx.lineTo(right.x, right.y);
        ctx.lineTo(bot.x, bot.y);
        ctx.lineTo(left.x, left.y);
        ctx.closePath();
        ctx.clip();

        // Diagonal lines
        ctx.strokeStyle = 'rgba(0,0,0,0.15)';
        ctx.lineWidth   = 1;
        const step = 10 * this.scale;
        const cx = (top.x + bot.x) / 2;
        const cy = (top.y + bot.y) / 2;
        const r  = Math.hypot(right.x - left.x, right.y - left.y) * 0.8;
        for (let i = -r; i < r; i += step) {
            ctx.beginPath();
            ctx.moveTo(cx + i - r, cy - r);
            ctx.lineTo(cx + i + r, cy + r);
            ctx.stroke();
        }
        ctx.restore();
    }

    _drawSpriteOnTile(img, gx, gy, w, l, orientation = 0, item_id = null) {
        const ctx = this.ctx;
        const top   = this.getIsoCoords(gx,   gy);
        const right = this.getIsoCoords(gx+w, gy);
        const bot   = this.getIsoCoords(gx+w, gy+l);
        const left  = this.getIsoCoords(gx,   gy+l);

        const cx = (top.x + bot.x) / 2;
        const cy = (top.y + bot.y) / 2;
        
        // Fixed scale factor to map Unity sprite pixels to Canvas pixels.
        // Mathematically 0.8533, but reducing to 0.75 so items fit better visually within the grid bounds.
        const sizeFactor = 0.75 * this.scale;
        const drawW = img.width * sizeFactor;
        const drawH = img.height * sizeFactor;

        ctx.save();
        
        // ── Rotation transformations ──
        // 0: SE (Front Right)
        // 1: SW (Front Left, Mirrored horizontally)
        // 2: NW (Back Left, Mirrored horizontally, darker)
        // 3: NE (Back Right, darker)
        
        const flipH = (orientation === 1 || orientation === 2);
        const darken = (orientation === 2 || orientation === 3);
        
        if (flipH) {
            ctx.translate(cx, 0);
            ctx.scale(-1, 1);
            ctx.translate(-cx, 0);
        }
        
        if (darken) {
            ctx.filter = "brightness(0.75)";
        }


        // Anchor at bot.y (the lowest vertex of the diamond) because in Isometric 2D,
        // the sprite's pivot is usually its lowest physical point touching the floor.
        // Anchor at bot.y (the front-most vertex of the diamond)
        const anchorY = cy;
        
        let pivotX = 0.5;
        let pivotY = 0.15; // default fallback
        
        if (window.spritePivots && window.spritePivots[item_id]) {
            pivotX = window.spritePivots[item_id].x;
            pivotY = window.spritePivots[item_id].y;
        }

        // Unity's pivot Y is from the BOTTOM. Canvas Y is from the TOP.
        // So the distance from the top of the image to the pivot is (1 - pivotY) * drawH
        ctx.drawImage(img,
            cx - (drawW * pivotX),
            anchorY - (drawH * (1 - pivotY)),
            drawW,
            drawH
        );
        
        ctx.restore();
    }

    _drawTooltip(p) {
        const ctx  = this.ctx;
        const layerRadio = document.querySelector('input[name="map-layer"]:checked');
        const isWallLayer = layerRadio && layerRadio.value === 'wall' && p.isWall;

        let center;
        if (isWallLayer) {
            const sz = this.getWallSize(p.item_id);
            center = {
                x: 100 + (p.x + sz.w / 2) * this.gridSize,
                y: 100 + (p.y + sz.h / 2) * this.gridSize
            };
        } else if (p.isWall) {
            const sz = this.getWallSize(p.item_id);
            center = this.getWallIsoCoords(p.x + sz.w / 2, p.y + sz.h / 2, !!p.flipped);
        } else {
            const { w, l } = this.getRotatedSize(p.item_id, p.orientation);
            center = this._tileCenter(p.x, p.y, w, l);
        }

        const name  = this.app.resolveItemName(p.item_id, 1);
        const extra = p.isWall ? ` pared g${p.floor}${p.flipped ? ' F' : ''}` : '';
        const label = `${name} (ID:${p.item_id}) [${p.x},${p.y}]${extra}`;

        ctx.save();
        ctx.font = `bold ${Math.max(11, Math.round(13 * this.scale))}px 'Quicksand', sans-serif`;
        const tw = ctx.measureText(label).width;
        const pad = 8;
        const bx = center.x - tw / 2 - pad;
        const by = center.y - 36 * this.scale;
        const bw = tw + pad * 2;
        const bh = 24;

        // Bubble
        ctx.fillStyle   = 'rgba(30,20,10,0.85)';
        ctx.beginPath();
        ctx.roundRect(bx, by, bw, bh, 6);
        ctx.fill();

        ctx.fillStyle    = '#fff';
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, center.x, by + bh / 2);
        ctx.restore();
    }

    _drawDiamondPath(gx, gy, w, l, shrinkPx = 0) {
        const ctx = this.ctx;
        const top   = this.getIsoCoords(gx,   gy);
        const right = this.getIsoCoords(gx+w, gy);
        const bot   = this.getIsoCoords(gx+w, gy+l);
        const left  = this.getIsoCoords(gx,   gy+l);
        const cx    = (top.x + bot.x) / 2;
        const cy    = (top.y + bot.y) / 2;

        const shrink = shrinkPx * this.scale;
        const lerp = (a, b, t) => a + (b - a) * t;
        const s = shrink === 0 ? 1.0 : 1.0 - shrink / Math.max(1, Math.hypot(top.x - cx, top.y - cy));

        ctx.beginPath();
        ctx.moveTo(lerp(cx, top.x,   s), lerp(cy, top.y,   s));
        ctx.lineTo(lerp(cx, right.x, s), lerp(cy, right.y, s));
        ctx.lineTo(lerp(cx, bot.x,   s), lerp(cy, bot.y,   s));
        ctx.lineTo(lerp(cx, left.x,  s), lerp(cy, left.y,  s));
        ctx.closePath();
    }

    _tileCenter(gx, gy, w, l) {
        const top = this.getIsoCoords(gx,   gy);
        const bot = this.getIsoCoords(gx+w, gy+l);
        return { x: (top.x + bot.x) / 2, y: (top.y + bot.y) / 2 };
    }

    _shortName(item_id) {
        const full = this.app.resolveItemName(item_id, 1);
        if (full.startsWith('#')) return `#${item_id}`;
        // If bilingual (has /), take first part
        const slash = full.indexOf('/');
        const name  = slash !== -1 ? full.substring(0, slash).trim() : full;
        return name.length > 18 ? name.substring(0, 16) + '…' : name;
    }

    // ── Hit detection ─────────────────────────────────────────────────────
    _hitTest(gridX, gridY, targetFloor, targetLoc) {
        const layerRadio = document.querySelector('input[name="map-layer"]:checked');
        const isWallLayer = layerRadio && layerRadio.value === 'wall';
        let targetWallGroup = document.getElementById('select-wall-group')?.value;
        if (!targetWallGroup && this.app && this.app.parser) {
            const walls = this.app.parser.placements.filter(p => p.cluster === targetLoc && p.isWall);
            if (walls.length > 0) targetWallGroup = String(walls[0].floor);
        }
        targetWallGroup = targetWallGroup || '0';
        
        let found = [];
        for (let i = this.app.parser.placements.length - 1; i >= 0; i--) {
            const p = this.app.parser.placements[i];
            if (p.cluster !== targetLoc || p.item_id === -1) continue;
            
            if (isWallLayer) {
                if (!p.isWall || String(p.floor) !== String(targetWallGroup)) continue;
                const sz = this.getWallSize(p.item_id);
                if (gridX >= p.x && gridX < p.x + sz.w && gridY >= p.y && gridY < p.y + sz.h) { found.push(p); }
            } else {
                if (p.isWall || p.floor !== targetFloor) continue;
                
                const { w, l } = this.getRotatedSize(p.item_id, p.orientation);
                if (gridX >= p.x && gridX < p.x + w && gridY >= p.y && gridY < p.y + l) {
                    found.push(p);
                }
            }
        }
        return found;
    }
    _hitTestOld(gridX, gridY, targetFloor, targetLoc) {
        return this.app.parser.placements.filter(p => {
            if (p.floor !== targetFloor || p.cluster !== targetLoc || p.item_id === -1) return false;
            const { w, l } = this.getRotatedSize(p.item_id, p.orientation);
            return gridX >= p.x && gridX < p.x + w && gridY >= p.y && gridY < p.y + l;
        });
    }

    // ── Event Binding ─────────────────────────────────────────────────────
    bindEvents() {
        window.addEventListener('keydown', e => {
            if (!this.selectedPlacement) return;
            // Ignore if typing in an input
            if (e.target.tagName === 'INPUT') return;
            
            if (e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'r') {
                this.rotateSelected(1);
                e.preventDefault();
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
                this.rotateSelected(-1);
                e.preventDefault();
            }
        });

        this.canvas.addEventListener('wheel', e => {
            e.preventDefault();
            // If hovering an item and holding shift, rotate it instead of zoom
            if (e.shiftKey && this.hoveredPlacement) {
                this.selectedPlacement = this.hoveredPlacement;
                this.rotateSelected(e.deltaY > 0 ? -1 : 1);
                return;
            }
            
            const factor = e.deltaY > 0 ? 0.9 : 1.1;
            const rect   = this.canvas.getBoundingClientRect();
            const mx = e.clientX - rect.left;
            const my = e.clientY - rect.top;
            this.offsetX = mx - (mx - this.offsetX) * factor;
            this.offsetY = my - (my - this.offsetY) * factor;
            this.scale  *= factor;
            this.draw();
        }, { passive: false });

        this.canvas.addEventListener('mousedown', e => {
            if (e.button === 1 || e.shiftKey || e.button === 2) {
                this.isPanDragging = true;
                this.dragStartX    = e.clientX - this.offsetX;
                this.dragStartY    = e.clientY - this.offsetY;
            } else if (e.button === 0) {
                  if (this.hoveredPlacement) {
                      this.selectedPlacement = this.hoveredPlacement;
                      this.app.openItemEditor(this.selectedPlacement);
                      this.isItemDragging = true;
                      
                      const rect   = this.canvas.getBoundingClientRect();
                      const mouseX = e.clientX - rect.left;
                      const mouseY = e.clientY - rect.top;
                      const cart  = this.getCartesianCoords(mouseX, mouseY);
                      this.dragItemOffsetX = Math.floor(cart.x + 0.5) - this.selectedPlacement.x;
                      this.dragItemOffsetY = Math.floor(cart.y + 0.5) - this.selectedPlacement.y;

                      this.draw();
                } else {
                    this.isPanDragging  = true;
                    this.dragStartX     = e.clientX - this.offsetX;
                    this.dragStartY     = e.clientY - this.offsetY;
                    this.selectedPlacement = null;
                    this.app.closeItemEditor();
                    this.draw();
                }
            }
        });

        this.canvas.addEventListener('mousemove', e => {
            const rect   = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            if (this.isPanDragging) {
                this.offsetX = e.clientX - this.dragStartX;
                this.offsetY = e.clientY - this.dragStartY;
                this.draw();
                return;
            }

            const cart  = this.getCartesianCoords(mouseX, mouseY);
            const gridX = Math.floor(cart.x + 0.5);
            const gridY = Math.floor(cart.y + 0.5);

            if (this.isItemDragging && this.selectedPlacement) {
                const gridX = Math.floor(cart.x + 0.5) - (this.dragItemOffsetX || 0);
                const gridY = Math.floor(cart.y + 0.5) - (this.dragItemOffsetY || 0);

                if (this.selectedPlacement.x !== gridX || this.selectedPlacement.y !== gridY) {
                    try {
                        this.app.parser.applyMapChange(
                            this.selectedPlacement,
                            this.selectedPlacement.item_id, gridX, gridY,
                            this.selectedPlacement.orientation
                        );
                        this.app.editItemX.value = gridX;
                        this.app.editItemY.value = gridY;
                    } catch (err) {
                        console.error('Error applying map change:', err);
                    }
                    this.draw();
                }
                return;
            }

            if (this.app.parser) {
                const targetFloor = document.getElementById('select-floor').value;
                const locVal = document.getElementById('select-location').value;
                const targetLoc = locVal !== "" ? parseInt(locVal, 10) : 1;
                const hits        = this._hitTest(gridX, gridY, targetFloor, targetLoc);

                // Prefer non-ground items for hover
                hits.sort((a, b) => {
                    const az = GROUND_IDS.has(a.item_id) ? 0 : 1;
                    const bz = GROUND_IDS.has(b.item_id) ? 0 : 1;
                    return bz - az;
                });

                const top = hits[0] || null;
                if (this.hoveredPlacement !== top) {
                    this.hoveredPlacement = top;
                    this.draw();
                }
            }
        });

        this.canvas.addEventListener('mouseup', () => {
            this.isPanDragging  = false;
            this.isItemDragging = false;
        });

        this.canvas.addEventListener('mouseleave', () => {
            this.isPanDragging  = false;
            this.isItemDragging = false;
            if (this.hoveredPlacement) { this.hoveredPlacement = null; this.draw(); }
        });

        // Touch support for mobile panning and dragging
        this.canvas.addEventListener('touchstart', e => {
            if (e.touches.length === 1) {
                const touch = e.touches[0];
                const rect = this.canvas.getBoundingClientRect();
                const mouseX = touch.clientX - rect.left;
                const mouseY = touch.clientY - rect.top;

                const cart = this.getCartesianCoords(mouseX, mouseY);
                const gridX = Math.floor(cart.x + 0.5);
                const gridY = Math.floor(cart.y + 0.5);

                const targetFloor = document.getElementById('select-floor').value;
                const locVal = document.getElementById('select-location').value;
                const targetLoc = locVal !== "" ? parseInt(locVal, 10) : 0;
                const hits        = this.app.parser ? this._hitTest(gridX, gridY, targetFloor, targetLoc) : [];

                hits.sort((a, b) => (GROUND_IDS.has(a.item_id) ? 0 : 1) - (GROUND_IDS.has(b.item_id) ? 0 : 1));
                const top = hits[hits.length - 1] || null;

                  if (top) {
                      this.selectedPlacement = top;
                      this.app.openItemEditor(this.selectedPlacement);
                      this.isItemDragging = true;

                      const cart = this.getCartesianCoords(mouseX, mouseY);
                      this.dragItemOffsetX = Math.floor(cart.x + 0.5) - this.selectedPlacement.x;
                      this.dragItemOffsetY = Math.floor(cart.y + 0.5) - this.selectedPlacement.y;

                      this.draw();
                } else {
                    this.isPanDragging  = true;
                    this.dragStartX     = touch.clientX - this.offsetX;
                    this.dragStartY     = touch.clientY - this.offsetY;
                    this.selectedPlacement = null;
                    this.app.closeItemEditor();
                    this.draw();
                }
            } else if (e.touches.length === 2) {
                const t1 = e.touches[0];
                const t2 = e.touches[1];
                this.initialPinchDistance = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
                this.initialPinchScale = this.scale;
                e.preventDefault();
            }
        }, { passive: false });

        this.canvas.addEventListener('touchmove', e => {
            if (e.touches.length === 1) {
                const touch = e.touches[0];
                const rect = this.canvas.getBoundingClientRect();
                const mouseX = touch.clientX - rect.left;
                const mouseY = touch.clientY - rect.top;

                if (this.isPanDragging) {
                    this.offsetX = touch.clientX - this.dragStartX;
                    this.offsetY = touch.clientY - this.dragStartY;
                    this.draw();
                    e.preventDefault();
                    return;
                }

                if (this.isItemDragging && this.selectedPlacement) {
                    const cart = this.getCartesianCoords(mouseX, mouseY);
                    const gridX = Math.floor(cart.x + 0.5) - (this.dragItemOffsetX || 0);
                    const gridY = Math.floor(cart.y + 0.5) - (this.dragItemOffsetY || 0);

                    if (this.selectedPlacement.x !== gridX || this.selectedPlacement.y !== gridY) {
                        try {
                            this.app.parser.applyMapChange(
                                this.selectedPlacement,
                                this.selectedPlacement.item_id, gridX, gridY,
                                this.selectedPlacement.orientation
                            );
                            this.app.editItemX.value = gridX;
                            this.app.editItemY.value = gridY;
                        } catch (err) {
                            console.error('Error applying map change:', err);
                        }
                        this.draw();
                    }
                    e.preventDefault();
                }
            } else if (e.touches.length === 2) {
                const t1 = e.touches[0];
                const t2 = e.touches[1];
                const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
                
                if (this.initialPinchDistance) {
                    const factor = dist / this.initialPinchDistance;
                    let newScale = this.initialPinchScale * factor;
                    newScale = Math.max(0.1, Math.min(newScale, 4.0));
                    
                    if (this.scale !== newScale) {
                        const centerX = (t1.clientX + t2.clientX) / 2;
                        const centerY = (t1.clientY + t2.clientY) / 2;
                        const rect = this.canvas.getBoundingClientRect();
                        const mouseX = centerX - rect.left;
                        const mouseY = centerY - rect.top;

                        const worldX = (mouseX - this.offsetX) / this.scale;
                        const worldY = (mouseY - this.offsetY) / this.scale;

                        this.scale = newScale;

                        this.offsetX = mouseX - (worldX * this.scale);
                        this.offsetY = mouseY - (worldY * this.scale);

                        this.draw();
                    }
                }
                e.preventDefault();
            }
        }, { passive: false });

        this.canvas.addEventListener('touchend', e => {
            if (e.touches.length < 2) {
                this.initialPinchDistance = null;
            }
            if (e.touches.length === 0) {
                this.isPanDragging  = false;
                this.isItemDragging = false;
            }
        });

        // Right-click context menu disabled
        this.canvas.addEventListener('contextmenu', e => e.preventDefault());
    }

    rotateSelected(direction) {
        if (!this.selectedPlacement) return;
        const p = this.selectedPlacement;
        if (p.isWall) return; // Los muebles de pared no tienen orientation en este formato

        let newOri = (Number(p.orientation) + direction) % 4;
        if (newOri < 0) newOri += 4;

        // Pivotear desde el centro: getRotatedSize() intercambia w/l en 90°/270°,
        // así que compensamos x/y con la mitad de la diferencia (redondeado para
        // no salirnos de la grilla entera) en vez de dejar fijo el ancla (esquina
        // superior-izquierda), que era lo que hacía "saltar" a los muebles no
        // cuadrados al rotarlos.
        const oldSize = this.getRotatedSize(p.item_id, p.orientation);
        const newSize = this.getRotatedSize(p.item_id, newOri);
        const newX = p.x + roundAwayFromZero((oldSize.w - newSize.w) / 2);
        const newY = p.y + roundAwayFromZero((oldSize.l - newSize.l) / 2);

        // Persistir en el AST. El writeInt32(p.o_off, ...) anterior era código
        // muerto (p.o_off nunca se asigna en ningún placement, y getBuffer()
        // serializa desde el AST vía OdinWriter, no desde el buffer crudo), por
        // lo que la rotación nunca llegaba a guardarse en el .csave exportado.
        this.app.parser.applyMapChange(p, p.item_id, newX, newY, newOri);

        this.app.openItemEditor(p);
        
        // Force reload from cache if needed
        const key = newOri > 0 ? `${p.item_id}_${newOri}` : String(p.item_id);
        if (this._imgCache[key] === undefined) {
            this.getImage(p.item_id, newOri);
        }
        
        this.draw();
    }
}
