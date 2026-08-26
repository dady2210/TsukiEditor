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
// Grilla de piso del juego: 16×16 celdas (casa de Tsuki). (0,0) es el frente;
// x=16 / y=16 son los bordes de ATRÁS, donde se levantan las paredes.
const FLOOR_GRID_N  = 16;

// Redondeo "half away from zero" simétrico. Math.round nativo redondea los
// .5 siempre hacia +Infinity (round(0.5)=1 pero round(-0.5)=0), lo que hace
// que un mueble con diferencia impar entre ancho y largo (3x2, 2x3, etc.)
// "derive" un tile por cada vuelta completa al rotar. Con este redondeo
// simétrico, los desplazamientos de +0.5/-0.5 de cada paso de 90° se
// cancelan entre sí y una rotación de 360° vuelve exactamente al x/y original.
function roundAwayFromZero(n) {
    return Math.sign(n) * Math.round(Math.abs(n));
}

// Imán leve: se queda en la celda actual hasta que el puntero se acerca
// de verdad al centro de la vecina (evita el temblor entre dos tiles).
function snapAxis(raw, last, stick = 0.22) {
    const n = Math.round(raw);
    if (last == null || Number.isNaN(Number(last))) return n;
    const prev = Number(last);
    if (n === prev) return prev;
    if (Math.abs(raw - n) + stick < Math.abs(raw - prev)) return n;
    return prev;
}

function furnitureStackRole(label) {
    const s = String(label || '').toLowerCase();
    const surface = /planter|maceta|jardinera|\btable\b|\bmesa\b|desk|escritorio|pedestal|counter|shelf|estante|\bcama\b|\bbed\b|sof[aá]|couch|nightstand|mesita|cabinet|armario/.test(s);
    const topper = !surface && /tulip|cactus|aloe|bonsai|flower|\bflor\b|\btree\b|árbol|carrot|zanahoria|lámpara|\blamp\b|jarrón|\bvase\b|bromelia|spider plant|snake plant|\bplanta\b|(?:^|[^a-z])plant(?:s|a)?(?:[^a-z]|$)/i.test(s);
    return { surface, topper };
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
        this._floorGridN     = 0;
        this._wallGridCache  = null;
        this._wallRoomBBox   = null;
        this._stackInfo      = new Map();
        this._dragSnap       = null;
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

    _buildFloorGridCache(n) {
        n = Math.max(FLOOR_GRID_N, n | 0);
        if (this._floorGridCache && this._floorGridN === n) return;
        this._floorGridN = n;

        const pad   = 4;
        const halfW = n * (this.CELL_W / 2);
        const fullH = n * this.CELL_H; // diamante completo: frente (0,0) → atrás (n,n)
        const originX = -halfW - pad;
        const originY = -fullH - pad;

        const cache = document.createElement('canvas');
        cache.width  = Math.ceil(halfW * 2 + pad * 2);
        cache.height = Math.ceil(fullH + pad * 2);
        const cctx = cache.getContext('2d');
        cctx.translate(-originX, -originY);

        const strokeCell = (x, y, style, width) => {
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
            cctx.strokeStyle = style;
            cctx.lineWidth = width;
            cctx.stroke();
        };

        if (n > FLOOR_GRID_N) {
            for (let x = 0; x < n; x++) {
                for (let y = 0; y < n; y++) {
                    if (x < FLOOR_GRID_N && y < FLOOR_GRID_N) continue;
                    strokeCell(x, y, 'rgba(100, 255, 100, 0.28)', 1);
                }
            }
        }
        const room = Math.min(n, FLOOR_GRID_N);
        for (let x = 0; x < room; x++) {
            for (let y = 0; y < room; y++) {
                strokeCell(x, y, 'rgba(100, 255, 100, 0.85)', 1.5);
            }
        }

        // Contorno 16×16: las paredes se levantan en el borde de atrás (arriba)
        const a = this._isoWorld(0, 0);
        const b = this._isoWorld(FLOOR_GRID_N, 0);
        const cpt = this._isoWorld(FLOOR_GRID_N, FLOOR_GRID_N);
        const d = this._isoWorld(0, FLOOR_GRID_N);
        cctx.beginPath();
        cctx.moveTo(a.x, a.y);
        cctx.lineTo(b.x, b.y);
        cctx.lineTo(cpt.x, cpt.y);
        cctx.lineTo(d.x, d.y);
        cctx.closePath();
        cctx.strokeStyle = 'rgba(200, 255, 200, 0.95)';
        cctx.lineWidth = 2.5;
        cctx.stroke();

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

    // Casa isométrica (como la de Tsuki): el piso es el diamante, las dos
    // paredes VISIBLES se levantan en los bordes de ATRÁS.
    //
    // iso: (0,0) es el frente (abajo); x+y alto es el fondo (arriba).
    // WallGroupPosition.flipped del .csave elige la cara:
    //   flipped=true  → pared IZQUIERDA, a lo largo de X, anclada en y = ymax
    //   flipped=false → pared DERECHA,  a lo largo de Y, anclada en x = xmax
    // wx del save es coordenada de piso en ese eje; wy es altura sobre el piso.
    getWallIsoCoords(wx, wy, flipped, bbox) {
        const box = bbox || this._wallRoomBBox || { xmin: 0, ymin: 0, xmax: 0, ymax: 0 };
        const base = flipped
            ? this.getIsoCoords(wx, box.ymax)
            : this.getIsoCoords(box.xmax, wx);
        return { x: base.x, y: base.y - wy * this.CELL_H * this.scale };
    }

    _sameFloor(p, targetFloor) {
        return String(p.floor) === String(targetFloor);
    }

    _pointInPoly(px, py, pts) {
        let inside = false;
        for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
            const xi = pts[i].x, yi = pts[i].y;
            const xj = pts[j].x, yj = pts[j].y;
            const denom = (yj - yi) || 1e-12;
            if (((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / denom + xi)) inside = !inside;
        }
        return inside;
    }

    // Inversa de getWallIsoCoords. flipped elige la cara (izq/der).
    screenToWallGrid(screenX, screenY, flipped, bbox) {
        const box = bbox || this._wallRoomBBox || { xmin: 0, ymin: 0, xmax: FLOOR_GRID_N, ymax: FLOOR_GRID_N };
        const isoX = (screenX - this.offsetX) / this.scale;
        const isoY = (screenY - this.offsetY) / this.scale;
        const hw = this.CELL_W / 2;
        const hh = this.CELL_H / 2;
        if (flipped) {
            const wx = isoX / hw + box.ymax;
            const wy = (-isoY - (wx + box.ymax) * hh) / this.CELL_H;
            return { x: wx, y: wy };
        }
        const wx = box.xmax - isoX / hw;
        const wy = (-isoY - (box.xmax + wx) * hh) / this.CELL_H;
        return { x: wx, y: wy };
    }

    _pointerToGrid(mouseX, mouseY, placement) {
        const raw = this._pointerToRawGrid(mouseX, mouseY, placement);
        return { x: Math.round(raw.x), y: Math.round(raw.y) };
    }

    _pointerToRawGrid(mouseX, mouseY, placement) {
        const layerRadio = document.querySelector('input[name="map-layer"]:checked');
        const isWallLayer = layerRadio && layerRadio.value === 'wall';
        if (placement && placement.isWall) {
            if (!isWallLayer) return this.screenToWallGrid(mouseX, mouseY, !!placement.flipped);
            return {
                x: (mouseX - 100) / this.gridSize,
                y: (mouseY - 100) / this.gridSize
            };
        }
        const cart = this.getCartesianCoords(mouseX, mouseY);
        return { x: cart.x, y: cart.y };
    }

    _itemLabel(item_id) {
        const db = (typeof window !== 'undefined' && window.ITEMS_DB) ? window.ITEMS_DB[String(item_id)] : null;
        const furn = (db && (db.furn_name || db.item_name)) || '';
        const resolved = (this.app && typeof this.app.resolveItemName === 'function')
            ? this.app.resolveItemName(item_id, 1) : '';
        return `${resolved} ${furn}`;
    }

    _stackRole(p) {
        return furnitureStackRole(this._itemLabel(p.item_id));
    }

    _computeStackInfo(items) {
        const info = new Map();
        if (!items || !items.length) return info;
        const meta = items.map(p => {
            const sz = this.getRotatedSize(p.item_id, p.orientation);
            return { p, w: sz.w || 1, l: sz.l || 1, area: (sz.w || 1) * (sz.l || 1), role: this._stackRole(p) };
        });
        for (const a of meta) {
            let base = null;
            let best = -1;
            for (const b of meta) {
                if (a.p === b.p) continue;
                const overlap = a.p.x < b.p.x + b.w && a.p.x + a.w > b.p.x
                    && a.p.y < b.p.y + b.l && a.p.y + a.l > b.p.y;
                if (!overlap) continue;
                const aOnB = (b.role.surface && !a.role.surface)
                    || (a.role.topper && !b.role.topper)
                    || (!a.role.surface && !a.role.topper && b.area > a.area);
                if (!aOnB) continue;
                const score = (b.role.surface ? 10 : 0) + b.area;
                if (score > best) { best = score; base = b; }
            }
            if (base) {
                const baseLabel = this._itemLabel(base.p.item_id).toLowerCase();
                const lift = /\btable\b|\bmesa\b|desk|cama|\bbed\b/.test(baseLabel) ? 0.95 : 0.62;
                info.set(a.p, { lift, base: base.p });
            }
        }
        return info;
    }

    _clampFloorGrid(p, x, y) {
        const locVal = document.getElementById('select-location')?.value;
        const loc = locVal !== '' && locVal != null ? parseInt(locVal, 10) : 0;
        const n = this._floorExtentForLoc(loc) || FLOOR_GRID_N;
        const sz = this.getRotatedSize(p.item_id, p.orientation);
        const w = sz.w || 1, l = sz.l || 1;
        return {
            x: Math.max(0, Math.min(n - w, x)),
            y: Math.max(0, Math.min(n - l, y))
        };
    }

    _clampWallGrid(p, x, y) {
        const sz = this.getWallSize(p.item_id);
        const w = sz.w || 1, h = sz.h || 1;
        const layerRadio = document.querySelector('input[name="map-layer"]:checked');
        const isWallLayer = layerRadio && layerRadio.value === 'wall';
        if (isWallLayer) {
            return {
                x: Math.max(0, Math.min(25 - w, x)),
                y: Math.max(0, Math.min(15 - h, y))
            };
        }
        const box = this._wallRoomBBox || { xmin: 0, ymin: 0, xmax: FLOOR_GRID_N, ymax: FLOOR_GRID_N };
        const along0 = p.flipped ? box.xmin : box.ymin;
        const along1 = p.flipped ? box.xmax : box.ymax;
        const maxAlong = Math.max(along0, along1 - w);
        return {
            x: Math.max(along0, Math.min(maxAlong, x)),
            y: Math.max(0, Math.min(12 - h, y))
        };
    }

    _snapMove(p, rawX, rawY) {
        const last = this._dragSnap || { x: p.x, y: p.y };
        let x = snapAxis(rawX, last.x);
        let y = snapAxis(rawY, last.y);
        const clamped = p.isWall ? this._clampWallGrid(p, x, y) : this._clampFloorGrid(p, x, y);
        this._dragSnap = { x: clamped.x, y: clamped.y };
        return clamped;
    }

    _drawSnapGhost(p) {
        if (!p) return;
        const x = (this._dragSnap && this._dragSnap.x != null) ? this._dragSnap.x : p.x;
        const y = (this._dragSnap && this._dragSnap.y != null) ? this._dragSnap.y : p.y;
        this.ctx.save();
        this.ctx.globalAlpha = 0.85;
        this.ctx.strokeStyle = '#f5c542';
        this.ctx.fillStyle = 'rgba(245, 197, 66, 0.18)';
        this.ctx.lineWidth = 2.5;
        const layerRadio = document.querySelector('input[name="map-layer"]:checked');
        const isWallLayer = layerRadio && layerRadio.value === 'wall';
        if (p.isWall && isWallLayer) {
            const sz = this.getWallSize(p.item_id);
            const gx = 100 + x * this.gridSize;
            const gy = 100 + y * this.gridSize;
            this.ctx.fillRect(gx, gy, this.gridSize * sz.w, this.gridSize * sz.h);
            this.ctx.strokeRect(gx, gy, this.gridSize * sz.w, this.gridSize * sz.h);
        } else if (p.isWall) {
            const sz = this.getWallSize(p.item_id);
            this._pathWallCell(x, y, sz.w, sz.h, !!p.flipped, this._wallRoomBBox);
            this.ctx.fill();
            this.ctx.stroke();
        } else {
            const { w, l } = this.getRotatedSize(p.item_id, p.orientation);
            this._drawDiamondPath(x, y, w, l, 0);
            this.ctx.fill();
            this.ctx.stroke();
        }
        this.ctx.restore();
    }

    _hitTestIsoWalls(screenX, screenY, targetFloor, targetLoc) {
        const found = [];
        if (screenX == null || screenY == null || !this.app || !this.app.parser) return found;
        const bbox = this._wallRoomBBox || { xmin: 0, ymin: 0, xmax: FLOOR_GRID_N, ymax: FLOOR_GRID_N };
        const walls = this.app.parser.placements.filter(
            p => p.isWall && Number(p.cluster) === Number(targetLoc)
                && this._sameFloor(p, targetFloor) && Number(p.item_id) > 0
        );
        for (let i = walls.length - 1; i >= 0; i--) {
            const p = walls[i];
            const sz = this.getWallSize(p.item_id);
            const f = !!p.flipped;
            const pts = [
                this.getWallIsoCoords(p.x, p.y, f, bbox),
                this.getWallIsoCoords(p.x + sz.w, p.y, f, bbox),
                this.getWallIsoCoords(p.x + sz.w, p.y + sz.h, f, bbox),
                this.getWallIsoCoords(p.x, p.y + sz.h, f, bbox)
            ];
            if (this._pointInPoly(screenX, screenY, pts)) found.push(p);
        }
        return found;
    }

    _pathWallCell(wx, wy, ww, wh, flipped, bbox) {
        const box = bbox || this._wallRoomBBox;
        const bl = this.getWallIsoCoords(wx, wy, flipped, box);
        const br = this.getWallIsoCoords(wx + ww, wy, flipped, box);
        const tr = this.getWallIsoCoords(wx + ww, wy + wh, flipped, box);
        const tl = this.getWallIsoCoords(wx, wy + wh, flipped, box);
        this.ctx.beginPath();
        this.ctx.moveTo(bl.x, bl.y);
        this.ctx.lineTo(br.x, br.y);
        this.ctx.lineTo(tr.x, tr.y);
        this.ctx.lineTo(tl.x, tl.y);
        this.ctx.closePath();
    }

    _groupFloorBBox(items) {
        let xmin = Infinity, ymin = Infinity, xmax = -Infinity, ymax = -Infinity;
        for (const p of items) {
            if (p.x < 0 || p.y < 0 || Number(p.item_id) <= 0) continue;
            const sz = this.getSize(p.item_id);
            xmin = Math.min(xmin, p.x);
            ymin = Math.min(ymin, p.y);
            xmax = Math.max(xmax, p.x + (sz.w || 1));
            ymax = Math.max(ymax, p.y + (sz.l || 1));
        }
        if (!isFinite(xmin)) return null;
        return { xmin, ymin, xmax, ymax };
    }

    // Habitación isométrica: piso 16×16 anclado en (0,0). Las paredes se
    // levantan en x=16 (derecha) e y=16 (izquierda), detrás de la maceta y
    // el resto del mobiliario. Si un mapa (granja, Chi) se sale, se expande.
    _locationRoomBBox(floorItems, wallItems) {
        let xmax = FLOOR_GRID_N;
        let ymax = FLOOR_GRID_N;
        for (const p of floorItems) {
            if (p.x < 0 || p.y < 0 || Number(p.item_id) <= 0) continue;
            const sz = this.getSize(p.item_id);
            xmax = Math.max(xmax, p.x + (sz.w || 1));
            ymax = Math.max(ymax, p.y + (sz.l || 1));
        }
        for (const p of wallItems) {
            const sz = this.getWallSize(p.item_id);
            if (p.flipped) xmax = Math.max(xmax, p.x + sz.w);
            else ymax = Math.max(ymax, p.x + sz.w);
        }
        return { xmin: 0, ymin: 0, xmax, ymax };
    }

    _floorExtentForLoc(loc) {
        let n = FLOOR_GRID_N;
        const placements = (this.app.parser && this.app.parser.placements) || [];
        for (const p of placements) {
            if (Number(p.cluster) !== Number(loc) || Number(p.item_id) <= 0) continue;
            if (p.x < 0 || p.y < 0) continue;
            if (p.isWall) {
                n = Math.max(n, (p.x || 0) + 1);
            } else {
                const sz = this.getSize(p.item_id);
                n = Math.max(n, p.x + (sz.w || 1), p.y + (sz.l || 1));
            }
        }
        return n;
    }

    _drawMapHud(targetLoc, isWallLayer, targetWallGroup, targetFloor) {
        const ctx = this.ctx;
        const wps = this._wallpaperEntries(targetLoc);
        const fls = this._floorCoveringEntries(targetLoc);
        const wallsAll = (this.app.parser.placements || []).filter(
            p => p.isWall && Number(p.cluster) === Number(targetLoc) && Number(p.item_id) > 0
        );
        const walls = isWallLayer
            ? wallsAll.filter(p => String(p.floor) === String(targetWallGroup))
            : wallsAll.filter(p => this._sameFloor(p, targetFloor));

        const wpTxt = wps.length
            ? wps.map(w => `key ${w.key} → ID ${w.id}`).join('   ·   ')
            : 'sin wallpaper en el save';
        const flTxt = fls.length
            ? fls.map(f => `key ${f.key} → ID ${f.id}`).join('   ·   ')
            : 'sin floor covering';
        const nIzq = walls.filter(p => p.flipped).length;
        const nDer = walls.filter(p => !p.flipped).length;
        const wallTxt = isWallLayer
            ? `Pared group ${targetWallGroup}: ${walls.length} muebles`
            : `Piso ${targetFloor}: ${walls.length} muebles de pared (izq ${nIzq} · der ${nDer})`;

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

    _drawIsoWallGrids(targetLoc, targetFloor) {
        const placements = this.app.parser.placements || [];
        const floorKey = String(targetFloor);
        const walls = placements.filter(
            p => p.isWall && Number(p.cluster) === Number(targetLoc) && Number(p.item_id) > 0
                && String(p.floor) === floorKey
        );
        const floors = placements.filter(
            p => !p.isWall && Number(p.cluster) === Number(targetLoc) && Number(p.item_id) > 0
                && p.x >= 0 && p.y >= 0 && String(p.floor) === floorKey
        );
        const wps = this._wallpaperEntries(targetLoc);
        if (!walls.length && !wps.length && !floors.length) {
            this._wallRoomBBox = null;
            return;
        }
        const bbox = this._locationRoomBBox(floors, walls);
        this._wallRoomBBox = bbox;
        this._drawIsoWallRoom(targetLoc, bbox, walls, wps);
    }

    _drawIsoWallRoom(targetLoc, bbox, walls, wps) {
        const maxHFromItems = walls.reduce((m, p) => {
            const sz = this.getWallSize(p.item_id);
            return Math.max(m, (p.y || 0) + sz.h);
        }, 0);
        const wallH = Math.min(Math.max(maxHFromItems, 6), 16);

        for (const flipped of [true, false]) {
            const subset = walls.filter(p => !!p.flipped === flipped);
            const along0 = flipped ? bbox.xmin : bbox.ymin;
            let along1 = flipped ? bbox.xmax : bbox.ymax;
            if (along1 - along0 < 4) along1 = along0 + 4;
            const alongLen = along1 - along0;

            this.ctx.save();
            this.ctx.globalAlpha = 0.18;
            this.ctx.fillStyle = flipped ? 'rgba(255, 160, 80, 1)' : 'rgba(110, 190, 255, 1)';
            this._pathWallCell(along0, 0, alongLen, wallH, flipped, bbox);
            this.ctx.fill();
            this.ctx.restore();

            this.ctx.save();
            this.ctx.strokeStyle = flipped ? 'rgba(255, 160, 80, 0.85)' : 'rgba(110, 190, 255, 0.85)';
            this.ctx.lineWidth = 1;
            this.ctx.globalAlpha = 0.5;
            for (let x = along0; x < along1; x++) {
                for (let y = 0; y < wallH; y++) {
                    this._pathWallCell(x, y, 1, 1, flipped, bbox);
                    this.ctx.stroke();
                }
            }
            this.ctx.restore();

            const top = this.getWallIsoCoords((along0 + along1) / 2, wallH + 0.4, flipped, bbox);
            const side = flipped ? 'izq' : 'der';
            const label = wps.length
                ? `Pared ${side} · WP ${wps.map(w => w.id).join(', ')}`
                : `Pared ${side}`;
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

            subset.sort((a, b) => (b.x - a.x) || (a.y - b.y));
            for (const p of subset) this._drawIsoWallItem(p, bbox);
        }
    }

    _drawIsoWallItem(p, bbox) {
        const sz = this.getWallSize(p.item_id);
        const flipped = !!p.flipped;
        const isSel = this.selectedPlacement === p;
        const isHov = this.hoveredPlacement === p;
        const box = bbox || this._wallRoomBBox;

        this.ctx.save();
        this._pathWallCell(p.x, p.y, sz.w, sz.h, flipped, box);
        this.ctx.fillStyle = isSel ? 'rgba(255,255,255,0.35)' : isHov ? 'rgba(255,200,120,0.28)' : 'rgba(255,140,70,0.22)';
        this.ctx.fill();
        this.ctx.strokeStyle = isSel ? '#fff' : 'rgba(255,220,180,0.85)';
        this.ctx.lineWidth = isSel ? 2 : 1;
        this.ctx.stroke();

        const mid = this.getWallIsoCoords(p.x + sz.w / 2, p.y + sz.h / 2, flipped, box);
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
        this.ctx.fillText(`ID ${p.item_id}${flipped ? ' izq' : ' der'}`, mid.x, mid.y + 6 * this.scale);
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
            if (this.isItemDragging && this.selectedPlacement) this._drawSnapGhost(this.selectedPlacement);
            this._drawMapHud(targetLoc, true, targetWallGroup, targetFloor);

        } else {
            // FLOOR LAYER (Isometric)
            this._buildFloorGridCache(this._floorExtentForLoc(targetLoc));
            ctx.save();
            ctx.globalAlpha = 0.25;
            ctx.translate(this.offsetX, this.offsetY);
            ctx.scale(this.scale, this.scale);
            ctx.drawImage(this._floorGridCache, this._floorGridOriginX, this._floorGridOriginY);
            ctx.restore();

            // Grilla de paredes del PISO seleccionado (groupNum === select-floor)
            this._drawIsoWallGrids(targetLoc, targetFloor);

            const all = this.app.parser.placements.filter(
                p => p.floor === targetFloor && p.cluster === targetLoc && !p.isWall && p.item_id !== -1
            );

            const ground  = all.filter(p => GROUND_IDS.has(p.item_id));
            const seeds   = all.filter(p => SEED_IDS.has(p.item_id) && p.x !== -1 && p.y !== -1 && !p.linkedPlot);
            const regular = all.filter(p => !GROUND_IDS.has(p.item_id) && !SEED_IDS.has(p.item_id));

            this._stackInfo = this._computeStackInfo(regular);

            const sortByZ = (a, b) => {
                const z = (b.x + b.y) - (a.x + a.y);
                if (z) return z;
                const la = (this._stackInfo.get(a) || {}).lift || 0;
                const lb = (this._stackInfo.get(b) || {}).lift || 0;
                return la - lb;
            };
            ground.sort(sortByZ);
            seeds.sort(sortByZ);
            regular.sort(sortByZ);

            for (const p of ground)  this._drawPlacement(p, 'ground');
            for (const p of seeds)   this._drawPlacement(p, 'seed');
            for (const p of regular) this._drawPlacement(p, 'regular');
            if (this.isItemDragging && this.selectedPlacement) this._drawSnapGhost(this.selectedPlacement);
            this._drawMapHud(targetLoc, false, targetWallGroup, targetFloor);
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
        const stack = (this._stackInfo && this._stackInfo.get(p)) || null;
        const lift = stack ? stack.lift : 0;

        const isHovered  = p === this.hoveredPlacement;
        const isSelected = p === this.selectedPlacement;

        ctx.save();
        if (lift) ctx.translate(0, -lift * this.CELL_H * this.scale);

        // ── Tile fill color ──
        let fillColor;
        if (layer === 'ground') {
            fillColor = isSelected ? '#e07b3f' : isHovered ? '#c47a30' : '#8B6914';
        } else if (layer === 'seed') {
            fillColor = isSelected ? '#66bb6a' : isHovered ? '#81c784' : '#4caf50';
        } else if (lift) {
            fillColor = isSelected ? '#f0c14a' : isHovered ? '#e8b86d' : 'rgba(255, 214, 120, 0.55)';
        } else {
            fillColor = isSelected ? '#ef4444' : isHovered ? '#f97316' : '#4A90D9';
        }

        if (!lift) {
            ctx.save();
            ctx.globalAlpha = 0.25;
            this._drawDiamondPath(p.x + 0.1, p.y + 0.1, w, l, 1.5);
            ctx.fillStyle = '#000';
            ctx.fill();
            ctx.restore();
        }

        this._drawDiamondPath(p.x, p.y, w, l, layer === 'ground' ? 0 : (lift ? 3 : 2));
        ctx.fillStyle   = fillColor;
        ctx.strokeStyle = isSelected ? '#ff2222' : isHovered ? '#ffaa00' : (lift ? 'rgba(180,120,40,0.5)' : 'rgba(0,0,0,0.4)');
        ctx.lineWidth   = isSelected ? 2.5 : 1.5;
        ctx.fill();
        ctx.stroke();

        if (layer === 'ground') {
            this._drawDirtTexture(p.x, p.y, w, l);
        }

        const img = this.getImage(p.item_id, p.orientation);
        if (img) {
            this._drawSpriteOnTile(img, p.x, p.y, w, l, p.orientation, p.item_id);
        } else {
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

        if (p.planted_id !== undefined && p.planted_id > 0 && p.planted_id !== 4294967295) {
            let plantedImg = this.getCropImage(p.planted_id);
            if (plantedImg) {
                this._drawSpriteOnTile(plantedImg, p.x, p.y - 0.5, w, l, 0, p.planted_id);
            }
        }

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
        ctx.restore();
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
            center = this.getWallIsoCoords(p.x + sz.w / 2, p.y + sz.h / 2, !!p.flipped, this._wallRoomBBox);
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
    _hitTest(gridX, gridY, targetFloor, targetLoc, screenX, screenY) {
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
        if (!isWallLayer) {
            const wallHits = this._hitTestIsoWalls(screenX, screenY, targetFloor, targetLoc);
            found = wallHits.concat(found);
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
                      const g = this._pointerToRawGrid(mouseX, mouseY, this.selectedPlacement);
                      this.dragItemOffsetX = g.x - this.selectedPlacement.x;
                      this.dragItemOffsetY = g.y - this.selectedPlacement.y;
                      this._dragSnap = { x: this.selectedPlacement.x, y: this.selectedPlacement.y };

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
                const raw = this._pointerToRawGrid(mouseX, mouseY, this.selectedPlacement);
                const floatedX = raw.x - (this.dragItemOffsetX || 0);
                const floatedY = raw.y - (this.dragItemOffsetY || 0);
                const snapped = this._snapMove(this.selectedPlacement, floatedX, floatedY);

                if (this.selectedPlacement.x !== snapped.x || this.selectedPlacement.y !== snapped.y) {
                    try {
                        this.app.parser.applyMapChange(
                            this.selectedPlacement,
                            this.selectedPlacement.item_id, snapped.x, snapped.y,
                            this.selectedPlacement.orientation
                        );
                        this.app.editItemX.value = snapped.x;
                        this.app.editItemY.value = snapped.y;
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
                const hits        = this._hitTest(gridX, gridY, targetFloor, targetLoc, mouseX, mouseY);

                // Prefer wall items, then non-ground furniture
                hits.sort((a, b) => {
                    const score = (p) => {
                        if (p.isWall) return 3;
                        const lift = (this._stackInfo && this._stackInfo.get(p) || {}).lift || 0;
                        if (lift) return 2;
                        return GROUND_IDS.has(p.item_id) ? 0 : 1;
                    };
                    return score(b) - score(a);
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
            this._dragSnap = null;
        });

        this.canvas.addEventListener('mouseleave', () => {
            this.isPanDragging  = false;
            this.isItemDragging = false;
            this._dragSnap = null;
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
                const hits        = this.app.parser ? this._hitTest(gridX, gridY, targetFloor, targetLoc, mouseX, mouseY) : [];

                hits.sort((a, b) => {
                    const score = (p) => {
                        if (p.isWall) return 3;
                        const lift = (this._stackInfo && this._stackInfo.get(p) || {}).lift || 0;
                        if (lift) return 2;
                        return GROUND_IDS.has(p.item_id) ? 0 : 1;
                    };
                    return score(a) - score(b);
                });
                const top = hits[hits.length - 1] || null;

                  if (top) {
                      this.selectedPlacement = top;
                      this.app.openItemEditor(this.selectedPlacement);
                      this.isItemDragging = true;

                      const g = this._pointerToRawGrid(mouseX, mouseY, this.selectedPlacement);
                      this.dragItemOffsetX = g.x - this.selectedPlacement.x;
                      this.dragItemOffsetY = g.y - this.selectedPlacement.y;
                      this._dragSnap = { x: this.selectedPlacement.x, y: this.selectedPlacement.y };

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
                    const raw = this._pointerToRawGrid(mouseX, mouseY, this.selectedPlacement);
                    const floatedX = raw.x - (this.dragItemOffsetX || 0);
                    const floatedY = raw.y - (this.dragItemOffsetY || 0);
                    const snapped = this._snapMove(this.selectedPlacement, floatedX, floatedY);

                    if (this.selectedPlacement.x !== snapped.x || this.selectedPlacement.y !== snapped.y) {
                        try {
                            this.app.parser.applyMapChange(
                                this.selectedPlacement,
                                this.selectedPlacement.item_id, snapped.x, snapped.y,
                                this.selectedPlacement.orientation
                            );
                            this.app.editItemX.value = snapped.x;
                            this.app.editItemY.value = snapped.y;
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
                this._dragSnap = null;
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
