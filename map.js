// ────────────────────────────────────────────────────────────────
// map.js — Isometric 3D Map renderer for Tsuki's Odyssey Save Editor
// ────────────────────────────────────────────────────────────────

// Known sublocation cluster → friendly name
// Cluster IDs come from the order the parser discovers groups of placements.
// The real sublocationSave keys are Int32s; until we fully walk that dict,
// we map location IDs to standard generic names since they can vary.
const SUBLOC_NAMES = {
    0:  "�?� Tsuki's Treehouse",
    1:  "🚂 Train Station",
    2:  "🦒 Chi's House",
    3:  "�?� Moca's House",
    4:  "�?� Yori's General Store",
    5:  "🧜�?♀�? Mermaid Coast",
    6:  "🥕 Tsuki's Farm",
    7:  "�?��? Town Hall",
    8:  "�?� Bobo's Ramen Restaurant",
    9:  "�?� Momo's Tea House",
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
const DEFAULT_SIZES = { w: 1, l: 1 }; // Fallback: la grilla del juego es de celdas 1×1
const PLOT_SIZE     = { w: 2, l: 2 };   // FURN_306 Plot tile
// Grilla de piso del juego: 16×16 celdas (casa de Tsuki). (0,0) es el frente;
// x=16 / y=16 son los bordes de ATR�?S, donde se levantan las paredes.
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

// Pivote Unity (x desde la izquierda, y desde ABAJO) a partir del alpha.
// Los PNG 128×128 del atlas dejan padding a la derecha y abajo: si se usa
// (0.5, 0.15) la maceta queda flotando y corrida del centro de la celda.
function opaquePivotFromRgba(data, w, h, th = 12) {
    let minx = w, maxx = -1, miny = h, maxy = -1;
    for (let y = 0; y < h; y++) {
        const row = y * w;
        for (let x = 0; x < w; x++) {
            if (data[(row + x) * 4 + 3] > th) {
                if (x < minx) minx = x;
                if (x > maxx) maxx = x;
                if (y < miny) miny = y;
                if (y > maxy) maxy = y;
            }
        }
    }
    if (maxx < 0) return { x: 0.5, y: 0.08 };
    let footX = 0, footN = 0;
    const y0 = Math.max(0, maxy - 3);
    for (let y = y0; y <= maxy; y++) {
        const row = y * w;
        for (let x = 0; x < w; x++) {
            if (data[(row + x) * 4 + 3] > th) { footX += x; footN++; }
        }
    }
    return {
        x: footN ? footX / footN / w : (minx + maxx) / 2 / w,
        y: Math.max(0.004, 1 - (maxy + 0.5) / h)
    };
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
        this._imgCache       = {}; // For placing items (furniture icons)
        this._patternCache   = {}; // For Isometric Tileset Patterns (wallpapers/floors)

        this.isDragging    = false;
        this.isPanDragging = false;
        this.isItemDragging= false;
        this.dragStartX    = 0;
        this.dragStartY    = 0;

        this.selectedPlacement = null;
        this.hoveredPlacement  = null;

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

    // Tileset Image Loader (for Wallpapers/Floors)
        _getMaskImage(type, floorKey, loc) {
        const cacheKey = `mask_${loc}_${type}_${floorKey}`;
        if (this._imgCache[cacheKey] !== undefined) {
            return this._imgCache[cacheKey];
        }
        this._imgCache[cacheKey] = false;
        const img = new Image();
        img.onload = () => {
            this._imgCache[cacheKey] = img;
            this.draw();
        };
        img.onerror = () => {
            this._imgCache[cacheKey] = false;
        };
        img.src = `images/maps/Exportado_level${loc}/mask_${type}_${floorKey}.png`;
        return false;
    }

    _getTilesetTexture(type, id) {
        if (!id || id <= 0) return null;
        const cacheKey = `${type}_${id}`;
        
        if (this._patternCache[cacheKey]) {
            if (this._patternCache[cacheKey].loading) return null;
            return this._patternCache[cacheKey];
        }

        this._patternCache[cacheKey] = { loading: true };
        const img = new Image();
        img.src = `images/tilesets/${type}s/${id}.png`;
        img.onload = () => {
            this._patternCache[cacheKey] = { img: img, pattern: null };
            this.draw(); // Redraw map once the tileset loads
        };
        img.onerror = () => {
            this._patternCache[cacheKey] = { error: true };
        }
        return null;
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

    _contentPivot(img) {
        if (!img || !img.complete || !img.naturalWidth) return { x: 0.5, y: 0.08 };
        if (img._contentPivot) return img._contentPivot;
        try {
            const w = img.naturalWidth, h = img.naturalHeight;
            const c = document.createElement('canvas');
            c.width = w; c.height = h;
            const g = c.getContext('2d', { willReadFrequently: true });
            g.drawImage(img, 0, 0);
            img._contentPivot = opaquePivotFromRgba(g.getImageData(0, 0, w, h).data, w, h);
        } catch (err) {
            img._contentPivot = { x: 0.5, y: 0.08 };
        }
        return img._contentPivot;
    }

    // file:// bloquea getImageData: primero data/content_pivots.js (píxeles reales
    // del PNG), luego pivote Unity, y solo al final se intenta leer el canvas.
    _resolveSpritePivot(item_id, img, orientation) {
        const baked = (typeof window !== 'undefined' && window.contentPivots) || {};
        const isBack = orientation === 2 || orientation === 3;
        const key = String(item_id);
        if (isBack && baked[key + '_BACK']) return baked[key + '_BACK'];
        if (baked[key]) return baked[key];
        if (window.spritePivots && window.spritePivots[item_id]) {
            return window.spritePivots[item_id];
        }
        if (window.spritePivots && window.spritePivots[key]) {
            return window.spritePivots[key];
        }
        return this._contentPivot(img);
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
    getAtlasSurface(kind, groupNum) {
        if (!window.mapsAtlas) return null;
        return window.mapsAtlas.find(s => s.kind === kind && Number(s.groupNum) === Number(groupNum));
    }
    
    getFloorOffset(floorNum) {
        let isPlay = document.body.classList.contains('play-mode');
        let isGrid = document.body.classList.contains('grid-mode');
        if (!isPlay && !isGrid) return { x: 0, y: 0 };
        const surf = this.getAtlasSurface('floor', floorNum);
        if (surf) {
            // Convert PNG pixel coordinate to unscaled isometric coordinate
            return { x: surf.origin_px.x * (window.atlasConfig && window.atlasConfig.bgScale ? window.atlasConfig.bgScale : 0.75), y: surf.origin_px.y * (window.atlasConfig && window.atlasConfig.bgScale ? window.atlasConfig.bgScale : 0.75) };
        }
        return { x: 0, y: 0 };
    }

    getIsoCoords(x, y, floorNum = 0) {
        const off = this.getFloorOffset(floorNum);
        let cellW = this.CELL_W;
        let cellH = this.CELL_H;
        if (window.mapsAtlas) {
            const surf = window.mapsAtlas.find(s => s.kind === 'floor' && String(s.groupNum) === String(floorNum));
            if (surf && surf.cell) {
                cellW = surf.cell.w || this.CELL_W;
                cellH = surf.cell.h || this.CELL_H;
            }
        }
        
        const isoX = (x - y) * (cellW / 2) + off.x;
        const isoY = -(x + y) * (cellH / 2) + off.y; // Negative so it goes UP the screen
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
    _isoWorld(x, y, floorNum = 0) {
        const off = this.getFloorOffset(floorNum);
        return {
            x: (x - y) * (this.CELL_W / 2) + off.x,
            y: -(x + y) * (this.CELL_H / 2) + off.y,
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
    // paredes VISIBLES se levantan en los bordes de ATR�?S.
    //
    // iso: (0,0) es el frente (abajo); x+y alto es el fondo (arriba).
    // WallGroupPosition.flipped del .csave elige la cara:
    //   flipped=true  → pared IZQUIERDA, a lo largo de X, anclada en y = ymax
    //   flipped=false → pared DERECHA,  a lo largo de Y, anclada en x = xmax
    // wx del save es coordenada de piso en ese eje; wy es altura sobre el piso.
    getWallOffset(floorNum, flipped) {
        let isPlay = document.body.classList.contains('play-mode');
        let isGrid = document.body.classList.contains('grid-mode');
        if (!isPlay && !isGrid) return null;
        
        if (window.mapsAtlas) {
            const surf = window.mapsAtlas.find(s => s.kind === 'wall' && Number(s.groupNum) === Number(floorNum) && !!s.flipped === !!flipped);
            if (surf) {
                return { x: surf.origin_px.x * (window.atlasConfig && window.atlasConfig.bgScale ? window.atlasConfig.bgScale : 0.75), y: surf.origin_px.y * (window.atlasConfig && window.atlasConfig.bgScale ? window.atlasConfig.bgScale : 0.75) };
            }
        }
        return null;
    }

    getWallIsoCoords(wx, wy, flipped, bbox, floorNum = 0) {
        let isPlay = document.body.classList.contains('play-mode');
        let isGrid = document.body.classList.contains('grid-mode');
        
        // Si tenemos config en atlas, usamos ESA l�gica directamente para que los muebles
        // sigan 100% a la grilla roja del editor de atlas.
        if (window.mapsAtlas && (isPlay || isGrid)) {
            const surf = window.mapsAtlas.find(s => s.kind === 'wall' && String(s.groupNum) === String(floorNum) && !!s.flipped === !!flipped);
            if (surf) {
                const _bgo = (window.atlasConfig && window.atlasConfig.bgScale ? window.atlasConfig.bgScale : 0.75);
                const oX = surf.origin_px.x * _bgo;
                const oY = surf.origin_px.y * _bgo;
                const cellW = surf.cell && surf.cell.w ? surf.cell.w : this.CELL_W;
                const cellH = surf.cell && surf.cell.h ? surf.cell.h : this.CELL_H;
                
                let ix, iy;
                if (!flipped) {
                    ix = oX - wx * (cellW / 2);
                    iy = oY - wx * (cellH / 2) - wy * cellH;
                } else {
                    ix = oX + wx * (cellW / 2);
                    iy = oY - wx * (cellH / 2) - wy * cellH;
                }
                
                return {
                    x: ix * this.scale + this.offsetX,
                    y: iy * this.scale + this.offsetY
                };
            }
        }
        
        // Fallback al motor original 3D de _drawIsoWallRoom
        const box = bbox || this._wallRoomBBox || { xmin: 0, ymin: 0, xmax: 16, ymax: 16 };
        const dummyFloorOffset = this.getFloorOffset(floorNum);
        const base = flipped
            ? this.getIsoCoords(wx, box.ymax, floorNum)
            : this.getIsoCoords(box.xmax, wx, floorNum);
            
        const customWallOffset = this.getWallOffset(floorNum, flipped);
        if (customWallOffset) {
            base.x = base.x - (dummyFloorOffset.x * this.scale) + (customWallOffset.x * this.scale);
            base.y = base.y - (dummyFloorOffset.y * this.scale) + (customWallOffset.y * this.scale);
        }
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
    screenToWallGrid(screenX, screenY, flipped, bbox, floorNum = 0) {
        let isPlay = document.body.classList.contains('play-mode');
        let isGrid = document.body.classList.contains('grid-mode');
        
        if (window.mapsAtlas && (isPlay || isGrid)) {
            const surf = window.mapsAtlas.find(s => s.kind === 'wall' && String(s.groupNum) === String(floorNum) && !!s.flipped === !!flipped);
            if (surf) {
                const _bgo = (window.atlasConfig && window.atlasConfig.bgScale ? window.atlasConfig.bgScale : 0.75);
                const oX = surf.origin_px.x * _bgo;
                const oY = surf.origin_px.y * _bgo;
                const cellW = surf.cell && surf.cell.w ? surf.cell.w : this.CELL_W;
                const cellH = surf.cell && surf.cell.h ? surf.cell.h : this.CELL_H;
                
                const ix = (screenX - this.offsetX) / this.scale;
                const iy = (screenY - this.offsetY) / this.scale;
                
                // if !flipped:
                // ix = oX - wx * cellW/2 => wx = (oX - ix) / (cellW/2)
                // iy = oY - wx * cellH/2 - wy * cellH => wy = (oY - iy - wx * cellH/2) / cellH
                
                // if flipped:
                // ix = oX + wx * cellW/2 => wx = (ix - oX) / (cellW/2)
                
                if (!flipped) {
                    const wx = (oX - ix) / (cellW / 2);
                    const wy = (oY - iy - wx * (cellH / 2)) / cellH;
                    return { x: wx, y: wy };
                } else {
                    const wx = (ix - oX) / (cellW / 2);
                    const wy = (oY - iy - wx * (cellH / 2)) / cellH;
                    return { x: wx, y: wy };
                }
            }
        }
        
        // Fallback al motor original 3D de _drawIsoWallRoom
        const box = bbox || this._wallRoomBBox || { xmin: 0, ymin: 0, xmax: 16, ymax: 16 };
        
        let cellW = this.CELL_W;
        let cellH = this.CELL_H;
        const off = this.getFloorOffset(floorNum);
        
        const isoX = (screenX - this.offsetX) / this.scale - off.x;
        let isoY = (screenY - this.offsetY) / this.scale - off.y;
        
        const hw = cellW / 2;
        const hh = cellH / 2;
        
        if (flipped) {
            const wx = isoX / hw + box.ymax;
            const baseY = -(wx + box.ymax) * hh;
            const wy = (baseY - isoY) / this.CELL_H;
            return { x: wx, y: wy };
        } else {
            const wx = box.xmax - isoX / hw;
            const baseY = -(box.xmax + wx) * hh;
            const wy = (baseY - isoY) / this.CELL_H;
            return { x: wx, y: wy };
        }
    }

    _pointerToGrid(mouseX, mouseY, placement) {
        const raw = this._pointerToRawGrid(mouseX, mouseY, placement);
        return { x: Math.round(raw.x), y: Math.round(raw.y) };
    }

    _pointerToRawGrid(mouseX, mouseY, placement) {
        const layerRadio = document.querySelector('input[name="map-layer"]:checked');
        const isWallLayer = layerRadio && layerRadio.value === 'wall';
        if (placement && placement.isWall) {
            if (!isWallLayer) return this.screenToWallGrid(mouseX, mouseY, !!placement.flipped, null, placement.floor);
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
            this._pathWallCell(x, y, sz.w, sz.h, !!p.flipped, this._wallRoomBBox, p.floor);
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


    _hitTestPlaySurface(screenX, screenY) {
        if (!window.mapsAtlas) return null;
        if (!document.body.classList.contains('play-mode')) return null;
        
        for (let g = 2; g >= 0; g--) {
            // Check walls first (they occlude floors)
            const walls = window.mapsAtlas.filter(s => s.kind === 'wall' && String(s.groupNum) === String(g));
            // We check both left (flipped=false) and right (flipped=true) walls
            for (let wSurf of walls) {
                const isRightWall = !!wSurf.flipped;
                const dummyBbox = this._wallRoomBBox || { xmin: 0, ymin: 0, xmax: 16, ymax: 16 };
                const wCoords = this.screenToWallGrid(screenX, screenY, isRightWall, dummyBbox, g);
                const wx = Math.floor(wCoords.x);
                const wy = Math.floor(wCoords.y);
                if (wx >= 0 && wx < wSurf.cols && wy >= 0 && wy < wSurf.rows) {
                    return { kind: 'wall', floorNum: g, x: wx, y: wy, flipped: isRightWall };
                }
            }
            
            // Check floors
            const surf = window.mapsAtlas.find(s => s.kind === 'floor' && String(s.groupNum) === String(g));
            if (surf) {
                const off = this.getFloorOffset(g);
                const dx = (screenX - this.offsetX) / this.scale - off.x;
                const dy = (screenY - this.offsetY) / this.scale - off.y;
                const cellW = surf.cell && surf.cell.w ? surf.cell.w : this.CELL_W;
                const cellH = surf.cell && surf.cell.h ? surf.cell.h : this.CELL_H;
                const cx = (dx / (cellW / 2) - dy / (cellH / 2)) / 2;
                const cy = -(dy / (cellH / 2) + dx / (cellW / 2)) / 2;
                const gridX = Math.floor(cx);
                const gridY = Math.floor(cy);
                if (gridX >= 0 && gridX < surf.cols && gridY >= 0 && gridY < surf.rows) {
                    return { kind: 'floor', floorNum: g, x: gridX, y: gridY };
                }
            }
        }
        return null;
    }

    isWallFurniture(item_id) {
        const WALL_IDS = new Set([98, 2140, 2146]);
        if (WALL_IDS.has(Number(item_id))) return true;
        
        const db = (typeof window !== 'undefined' && window.ITEMS_DB) ? window.ITEMS_DB[String(item_id)] : null;
        if (db) {
            const cat = (db.category || '').toUpperCase();
            if (cat.includes('WALLDECO') || cat.includes('LAMP') || cat.includes('POSTER')) return true;
            
            const name = (db.furn_name || db.item_name || '').toUpperCase();
            if (name.includes('WALLPAPER') || name.includes('TAPIZ')) return false;
            if (name.includes('WALL LAMP') || name.includes('WALLDECO') || name.includes('POSTER') || name.includes('L�MPARA DE PARED') || name.includes('CUADRO') || name.includes('WALL')) return true;
        }
        return false;
    }
    
    isCovering(item_id) {
        const COVERING_FLOORS = new Set([100, 1166, 1167, 1168, 1169, 128, 130, 1602, 1603, 1604, 1605, 1606, 1607, 1608, 1609, 1610, 1611, 1612, 1613, 1614, 1615, 1861, 1862, 1863, 1864, 1866, 1867, 2181, 240, 242, 244, 245, 246, 250, 347, 67, 69, 749, 750, 755, 796, 797, 798, 95, 98, 99]);
        const COVERING_WALLPAPERS = new Set([1118, 1316, 1585, 1588, 1589, 1590, 1591, 1592, 1594, 1595, 1596, 1599, 1617, 2009, 2084, 2127, 2128, 2129, 2195, 2308, 2424, 2484, 2486, 396, 410, 417, 418, 419, 420, 421, 752, 753, 754, 755, 756, 757, 761, 763, 764, 765, 787, 794, 795, 804, 882, 883, 884, 914]);
        
        // Exceptional cases: if 98 is indeed wall furniture, don't return it as a floor covering
        if (this.isWallFurniture(item_id)) return null;

        if (COVERING_FLOORS.has(Number(item_id))) return 'floor';
        if (COVERING_WALLPAPERS.has(Number(item_id))) return 'wallpaper';
        return null;
    }

    _isAreaOccupied(floor, x, y, w, l) {
        if (!this.app || !this.app.parser) return false;
        const targetLocStr = document.getElementById('select-location')?.value;
        const targetLoc = targetLocStr !== undefined && targetLocStr !== "" ? parseInt(targetLocStr, 10) : 1;
        
        for (const p of this.app.parser.placements) {
            if (p.cluster !== targetLoc || p.isWall || p.item_id === -1) continue;
            if (Number(p.floor) !== Number(floor)) continue;
            if (p === this.isItemDragging) continue; // Si estamos arrastrando uno existente
            
            const sz = this.getRotatedSize(p.item_id, p.orientation);
            // Footprint de p: p.x hasta p.x + sz.w, p.y hasta p.y + sz.l
            // Footprint de arrastre: x hasta x + w, y hasta y + l
            if (x < p.x + sz.w && x + w > p.x && y < p.y + sz.l && y + l > p.y) {
                return true;
            }
        }
        return false;
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
                this.getWallIsoCoords(p.x, p.y, f, bbox, p.floor),
                this.getWallIsoCoords(p.x + sz.w, p.y, f, bbox, p.floor),
                this.getWallIsoCoords(p.x + sz.w, p.y + sz.h, f, bbox, p.floor),
                this.getWallIsoCoords(p.x, p.y + sz.h, f, bbox, p.floor)
            ];
            if (this._pointInPoly(screenX, screenY, pts)) found.push(p);
        }
        return found;
    }

    _pathWallCell(wx, wy, ww, wh, flipped, bbox, floorNum = 0) {
        const box = bbox || this._wallRoomBBox;
        const bl = this.getWallIsoCoords(wx, wy, flipped, box, floorNum);
        const br = this.getWallIsoCoords(wx + ww, wy, flipped, box, floorNum);
        const tr = this.getWallIsoCoords(wx + ww, wy + wh, flipped, box, floorNum);
        const tl = this.getWallIsoCoords(wx, wy + wh, flipped, box, floorNum);
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
        if (document.body.classList.contains('play-mode')) return;
        const ctx = this.ctx;
        const wps = this._wallpaperEntries(targetLoc);
        const fls = this._floorCoveringEntries(targetLoc);
        const wallsAll = (this.app.parser.placements || []).filter(
            p => p.isWall && Number(p.cluster) === Number(targetLoc) && Number(p.item_id) > 0 && !this.isCovering(p.item_id)
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
            `🖼�? ${wallTxt}`
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
            p => p.isWall && Number(p.cluster) === Number(targetLoc) && Number(p.item_id) > 0 && !this.isCovering(p.item_id)
                && String(p.floor) === floorKey
        );
        const floors = placements.filter(
            p => !p.isWall && Number(p.cluster) === Number(targetLoc) && Number(p.item_id) > 0
                && p.x >= 0 && p.y >= 0 && String(p.floor) === floorKey
        );
        const wps = this._wallpaperEntries(targetLoc).filter(w => String(w.key) === floorKey);
        if (!walls.length && !wps.length && !floors.length) {
            this._wallRoomBBox = null;
            return;
        }
        const bbox = this._locationRoomBBox(floors, walls);
        this._wallRoomBBox = bbox;
        this._drawIsoWallRoom(targetLoc, bbox, walls, wps, targetFloor);
    }

    _drawIsoWallRoom(targetLoc, bbox, walls, wps, targetFloor = 0) {
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
            this.ctx.globalAlpha = 1.0;
            
            let filledWithTex = false;
            if (!filledWithTex && !document.body.classList.contains('play-mode')) {
                this.ctx.globalAlpha = 0.18;
                this.ctx.fillStyle = flipped ? 'rgba(255, 160, 80, 1)' : 'rgba(110, 190, 255, 1)';
                this._pathWallCell(along0, 0, alongLen, wallH, flipped, bbox);
                this.ctx.fill();
            }
            
            this.ctx.restore();

            this.ctx.save();
            this.ctx.strokeStyle = flipped ? 'rgba(255, 160, 80, 0.85)' : 'rgba(110, 190, 255, 0.85)';
            this.ctx.lineWidth = 1;
            this.ctx.globalAlpha = 0.5;
            const isPlay = document.body.classList.contains('play-mode');
            const showWallGrids = !isPlay || (this.isHammerMode && this.forceDrawGrid);
            if (showWallGrids) {
                if (isPlay && window.mapsAtlas) {
                    const surf = window.mapsAtlas.find(s => s.kind === 'wall' && String(s.groupNum) === String(targetFloor) && !!s.flipped === flipped);
                    if (surf) {
                        const w = surf.cell.w || 64;
                        const h = surf.cell.h || 32;
                        const _bgo = (window.atlasConfig && window.atlasConfig.bgScale ? window.atlasConfig.bgScale : 0.75); 
                        const oX = surf.origin_px.x * _bgo;
                        const oY = surf.origin_px.y * _bgo;
                        
                        this.ctx.save();
                        this.ctx.globalAlpha = 0.5;
                        this.ctx.strokeStyle = flipped ? 'rgba(255, 100, 100, 0.9)' : 'rgba(100, 100, 255, 0.9)';
                        this.ctx.lineWidth = 1;
                        for (let x = 0; x < surf.cols; x++) {
                            for (let y = 0; y < surf.rows; y++) {
                                let ix, iy;
                                if (!surf.flipped) {
                                    ix = oX - x * (w / 2);
                                    iy = oY - x * (h / 2) - y * h;
                                } else {
                                    ix = oX + x * (w / 2);
                                    iy = oY - x * (h / 2) - y * h;
                                }
                                this.ctx.beginPath();
                                this.ctx.moveTo(ix, iy);
                                this.ctx.lineTo(ix, iy - h);
                                if (!surf.flipped) {
                                    this.ctx.lineTo(ix - w/2, iy - h - h/2);
                                    this.ctx.lineTo(ix - w/2, iy - h/2);
                                } else {
                                    this.ctx.lineTo(ix + w/2, iy - h - h/2);
                                    this.ctx.lineTo(ix + w/2, iy - h/2);
                                }
                                this.ctx.closePath();
                                this.ctx.stroke();
                            }
                        }
                        this.ctx.restore();
                    }
                } else {
                    for (let x = along0; x < along1; x++) {
                        for (let y = 0; y < wallH; y++) {
                            this._pathWallCell(x, y, 1, 1, flipped, bbox, targetFloor);
                            this.ctx.stroke();
                        }
                    }
                }
            }
            this.ctx.restore();

            if (!document.body.classList.contains('play-mode') || this.isHammerMode) {
                const top = this.getWallIsoCoords((along0 + along1) / 2, wallH + 0.4, flipped, bbox, targetFloor);
                            const side = flipped ? 'der' : 'izq';
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
            }

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

        const mid = this.getWallIsoCoords(p.x + sz.w / 2, p.y + sz.h / 2, flipped, box, p.floor);
        const img = this.getImage(p.item_id, 0);
        if (img && img.complete && img.naturalWidth > 0) {
            const s = 0.75 * this.scale;
            const dw = img.width * s;
            const dh = img.height * s;
            this.ctx.drawImage(img, mid.x - dw / 2, mid.y - dh / 2, dw, dh);
        }
        this.ctx.fillStyle = '#fff';
        this.ctx.font = `bold ${Math.max(9, Math.round(10 * this.scale))}px 'Quicksand', sans-serif`;
        this.ctx.textAlign = 'center';
        if (!document.body.classList.contains('play-mode')) {
            this.ctx.textBaseline = 'top';
        this.ctx.shadowColor = 'rgba(0,0,0,0.8)';
        this.ctx.shadowBlur = 3;
        this.ctx.fillText(`ID ${p.item_id}${flipped ? ' der' : ' izq'}`, mid.x, mid.y + 6 * this.scale);
        this.ctx.restore();
        }
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

        const targetLocStr = document.getElementById('select-location')?.value;
        const targetLoc = targetLocStr !== undefined && targetLocStr !== "" ? parseInt(targetLocStr, 10) : 1;
        
        let visibleFloors = [document.getElementById('select-floor')?.value || '0'];
        let isPlay = document.body.classList.contains('play-mode');
        let isGrid = document.body.classList.contains('grid-mode');
        let bgActive = (isPlay || isGrid) && targetLoc === 0;
        
        if (isPlay) {
            visibleFloors = ['0', '1', '2'];
        } else if (isGrid) {
            if (this.app.gridEditor && this.app.gridEditor.activeSurfaceIndex !== -1) {
                const surf = window.mapsAtlas[this.app.gridEditor.activeSurfaceIndex];
                visibleFloors = [String(surf.groupNum)];
            } else {
                visibleFloors = ['0'];
            }
        }
        
        // bgImage is now drawn inside the floor layer (after tilesets)
        const targetFloor = visibleFloors[0];
        
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
            // ??????????????????????????????????????????????????????????????????????????
            // FLOOR LAYER (Isometric)
            //
            // Draw order in Play/Grid mode:
            //   1. Floor tilesets       ? drawn BEFORE bgImage (go under the tree)
            //   2. Wall tilesets        ? drawn BEFORE bgImage
            //   3. bgImage (tree/room)  ? has alpha on floor/wall areas, covers tilesets correctly
            //   4. Grid overlay         ? ON TOP of bg (only when Hammer mode + grid toggle)
            //   5. Furniture / wall items
            // ??????????????????????????????????????????????????????????????????????????
            
            this._buildFloorGridCache(this._floorExtentForLoc(targetLoc));
            
            // Helper: convert atlas world coord to screen pixel
            const _bgo = (window.atlasConfig && window.atlasConfig.bgScale ? window.atlasConfig.bgScale : 0.75);
            const atlasToScreen = (ax, ay) => ({
                x: ax * this.scale + this.offsetX,
                y: ay * this.scale + this.offsetY
            });

            // ?? 1. FLOOR TILESETS (screen space, responds to zoom/pan) ???????????????
            if ((isPlay || isGrid) && window.mapsAtlas) {
                  // MASK SYSTEM
                  if (!this.maskCanvas) {
                      this.maskCanvas = document.createElement('canvas');
                      this.maskCtx = this.maskCanvas.getContext('2d');
                  }
                  this.maskCanvas.width = this.canvas.width;
                  this.maskCanvas.height = this.canvas.height;
                  
                  const s = this.scale;
                  const bgScale = _bgo;
                  
                  for (const vf of visibleFloors) {
                      let floorId = null;
                      if (this.app.parser.floors && this.app.parser.floors[targetLoc]) {
                          const entry = this.app.parser.floors[targetLoc].find(f => String(f.key) === String(vf));
                          if (entry) floorId = entry.id;
                      }
                      const floorTex = this._getTilesetTexture('floor', floorId);
                      const floorMask = this._getMaskImage('floor', vf, targetLoc);
                      
                      if (floorTex && floorTex.img && floorTex.img.complete && floorTex.img.width > 0 && floorMask && floorMask.complete && floorMask.width > 0) {
                          if (!floorTex.pattern) floorTex.pattern = this.ctx.createPattern(floorTex.img, 'repeat');
                          
                          this.maskCtx.clearRect(0, 0, this.maskCanvas.width, this.maskCanvas.height);
                          this.maskCtx.globalCompositeOperation = 'source-over';
                          this.maskCtx.drawImage(floorMask, this.offsetX, this.offsetY, floorMask.width * bgScale * s, floorMask.height * bgScale * s);
                          
                          this.maskCtx.globalCompositeOperation = 'source-in';
                          const floorMatrix = new DOMMatrix()
                              .translate(this.offsetX, this.offsetY)
                              .scale(s, s)
                              .scale(1, 0.5)
                              .rotate(-45)
                              .scale(0.35, 0.35);
                          floorTex.pattern.setTransform(floorMatrix);
                          this.maskCtx.fillStyle = floorTex.pattern;
                          this.maskCtx.fillRect(0, 0, this.maskCanvas.width, this.maskCanvas.height);
                          
                          this.ctx.drawImage(this.maskCanvas, 0, 0);
                      }
                  }

                  const wpDict = this.app.parser && this.app.parser.wallpapers;
                  if (wpDict && wpDict[targetLoc]) {
                      for (const wpEntry of wpDict[targetLoc]) {
                          if (!wpEntry.id || wpEntry.id <= 0) continue;
                          const floorNum = wpEntry.key;
                          const wpTex = this._getTilesetTexture('wallpaper', wpEntry.id);
                          const wallMask = this._getMaskImage('wall', floorNum, targetLoc);
                          
                          if (wpTex && wpTex.img && wpTex.img.complete && wpTex.img.width > 0 && wallMask && wallMask.complete && wallMask.width > 0) {
                              if (!wpTex.pattern) wpTex.pattern = this.ctx.createPattern(wpTex.img, 'repeat');
                              
                              this.maskCtx.clearRect(0, 0, this.maskCanvas.width, this.maskCanvas.height);
                              this.maskCtx.globalCompositeOperation = 'source-over';
                              this.maskCtx.drawImage(wallMask, this.offsetX, this.offsetY, wallMask.width * bgScale * s, wallMask.height * bgScale * s);
                              
                              this.maskCtx.globalCompositeOperation = 'source-in';
                              wpTex.pattern.setTransform(new DOMMatrix([
                                  s * 0.35, 0.5 * s * 0.35, 
                                  0, s * 0.35, 
                                  this.offsetX, this.offsetY
                              ]));
                              this.maskCtx.fillStyle = wpTex.pattern;
                              this.maskCtx.fillRect(0, 0, this.maskCanvas.width, this.maskCanvas.height);
                              
                              this.ctx.drawImage(this.maskCanvas, 0, 0);
                          }
                      }
                  }
              // ?? 3. BACKGROUND IMAGE (alpha on floor/wall ? tilesets show through) ?
                const bgImg = this.getBackgroundImage('../maps/Exportado_level2/level2_Ensamblado.png');
                if (bgImg && bgImg.complete && bgImg.width > 0) {
                    const bgScale = _bgo;
                    const s = bgScale * this.scale;
                    ctx.drawImage(bgImg, this.offsetX, this.offsetY, bgImg.width * s, bgImg.height * s);
                }

            } else {
                // ?? Editor mode: draw floor tilesets inside scaled ctx ????????????????
                ctx.save();
                ctx.translate(this.offsetX, this.offsetY);
                ctx.scale(this.scale, this.scale);
                for (const vf of visibleFloors) {
                    let floorId = null;
                    if (this.app.parser.floors && this.app.parser.floors[targetLoc]) {
                        const entry = this.app.parser.floors[targetLoc].find(f => String(f.key) === String(vf));
                        if (entry) floorId = entry.id;
                    }
                    const floorTex = this._getTilesetTexture('floor', floorId);
                    if (floorTex && floorTex.img && floorTex.img.complete && floorTex.img.width > 0) {
                        if (!floorTex.pattern) floorTex.pattern = ctx.createPattern(floorTex.img, 'repeat');
                        floorTex.pattern.setTransform(new DOMMatrix().scale(1, 0.5).rotate(-45).scale(0.35, 0.35));
                        ctx.fillStyle = floorTex.pattern;
                        const n = Math.min(this._floorGridN, FLOOR_GRID_N);
                        // Diamond polygon in screen coords
                        const pt = (gx, gy) => atlasToScreen(
                            oX + (gx - gy) * (cw / 2),
                            oY - (gx + gy) * (ch / 2)
                        );
                        
                        ctx.beginPath();
                        ctx.moveTo(pt(0, 0).x, pt(0, 0).y);
                        ctx.lineTo(pt(cols, 0).x, pt(cols, 0).y);
                        ctx.lineTo(pt(cols, rows).x, pt(cols, rows).y);
                        ctx.lineTo(pt(0, rows).x, pt(0, rows).y);
                        ctx.closePath();
                        ctx.fill();
                    }
                }
                ctx.restore();
            }

            // ?? 4. GRID OVERLAY ???????????????????????????????????????????????????????
            // Editor: cached grid (inside scaled ctx)
            if (!isPlay && !isGrid) {
                ctx.save();
                ctx.translate(this.offsetX, this.offsetY);
                ctx.scale(this.scale, this.scale);
                ctx.globalAlpha = 0.25;
                const off0 = this.getFloorOffset(0);
                for (const vf of visibleFloors) {
                    const off = this.getFloorOffset(vf);
                    const dx = off.x - off0.x;
                    const dy = off.y - off0.y;
                    ctx.drawImage(this._floorGridCache, this._floorGridOriginX + dx, this._floorGridOriginY + dy);
                }
                ctx.restore();
            }

            // Play/Grid: Atlas grid in SCREEN SPACE (coords = atlas_world * scale + offset)
            const shouldDrawAtlasGridPlay = (isPlay && this.isHammerMode && this.forceDrawGrid);
            const shouldDrawAtlasGridEdit = (isGrid && this.app.gridEditor && this.app.gridEditor.activeSurfaceIndex !== -1);

            if (shouldDrawAtlasGridPlay || shouldDrawAtlasGridEdit) {
                const surfaces = shouldDrawAtlasGridPlay
                    ? window.mapsAtlas.filter(s => visibleFloors.includes(String(s.groupNum)))
                    : [window.mapsAtlas[this.app.gridEditor.activeSurfaceIndex]];

                for (const surf of surfaces) {
                    const oX = surf.origin_px.x * _bgo;
                    const oY = surf.origin_px.y * _bgo;
                    const cw = surf.cell.w || 64;
                    const ch = surf.cell.h || 32;

                    ctx.save();
                    ctx.globalAlpha = 0.5;
                    ctx.lineWidth = 1;

                    if (surf.kind === 'floor') {
                        ctx.strokeStyle = 'rgba(100, 255, 100, 0.9)';
                        for (let x = 0; x < surf.cols; x++) {
                            for (let y = 0; y < surf.rows; y++) {
                                // Atlas world ? screen
                                const ix = oX + (x - y) * (cw / 2);
                                const iy = oY - (x + y) * (ch / 2);
                                const sx = ix * this.scale + this.offsetX;
                                const sy = iy * this.scale + this.offsetY;
                                const scw = (cw / 2) * this.scale;
                                const sch = (ch / 2) * this.scale;
                                ctx.beginPath();
                                ctx.moveTo(sx, sy);
                                ctx.lineTo(sx + scw, sy - sch);
                                ctx.lineTo(sx, sy - 2 * sch);
                                ctx.lineTo(sx - scw, sy - sch);
                                ctx.closePath();
                                ctx.stroke();
                            }
                        }
                    } else if (surf.kind === 'wall') {
                        ctx.strokeStyle = surf.flipped ? 'rgba(255, 100, 100, 0.9)' : 'rgba(100, 100, 255, 0.9)';
                        for (let x = 0; x < surf.cols; x++) {
                            for (let y = 0; y < surf.rows; y++) {
                                let ix, iy;
                                if (!surf.flipped) {
                                    ix = oX - x * (cw / 2);
                                    iy = oY - x * (ch / 2) - y * ch;
                                } else {
                                    ix = oX + x * (cw / 2);
                                    iy = oY - x * (ch / 2) - y * ch;
                                }
                                const sx = ix * this.scale + this.offsetX;
                                const sy = iy * this.scale + this.offsetY;
                                const scw2 = (cw / 2) * this.scale;
                                const sch2 = ch * this.scale;
                                ctx.beginPath();
                                ctx.moveTo(sx, sy);
                                ctx.lineTo(sx, sy - sch2);
                                if (!surf.flipped) {
                                    ctx.lineTo(sx - scw2, sy - sch2 - sch2 / 2);
                                    ctx.lineTo(sx - scw2, sy - sch2 / 2);
                                } else {
                                    ctx.lineTo(sx + scw2, sy - sch2 - sch2 / 2);
                                    ctx.lineTo(sx + scw2, sy - sch2 / 2);
                                }
                                ctx.closePath();
                                ctx.stroke();
                            }
                        }
                    }
                    ctx.restore();
                }
            }

            // ?? 5. WALL ITEMS + FLOOR FURNITURE ??????????????????????????????????????
            if (!isGrid && !isPlay) this._drawIsoWallGrids(targetLoc, targetFloor);

            const all = this.app.parser.placements.filter(
                p => (isPlay || isGrid ? visibleFloors.includes(String(p.floor)) : String(p.floor) === String(targetFloor)) && p.cluster === targetLoc && !p.isWall && p.item_id !== -1 && !this.isCovering(p.item_id)
            );

            const ground  = all.filter(p => GROUND_IDS.has(p.item_id));
            const seeds   = all.filter(p => SEED_IDS.has(p.item_id) && p.x !== -1 && p.y !== -1 && !p.linkedPlot);
            const regular = all.filter(p => !GROUND_IDS.has(p.item_id) && !SEED_IDS.has(p.item_id));

            this._stackInfo = this._computeStackInfo(regular);

            const sortByZ = (a, b) => {
                const fb = Number(b.floor||0), fa = Number(a.floor||0);
                if (fa !== fb) return fa - fb;
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
                    const iso = this.getIsoCoords(this.selectedPlacement.x, this.selectedPlacement.y, this.selectedPlacement.floor);
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
            if (!document.body.classList.contains('play-mode')) {
            this.ctx.textBaseline = 'bottom';
            this.ctx.shadowColor = 'rgba(0,0,0,0.85)';
            this.ctx.shadowBlur = 3;
            this.ctx.fillText(`ID ${p.item_id}${p.flipped ? ' F' : ''}`, gx + gw / 2, gy + gh - 3);
            this.ctx.restore();
        }
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

        let hideBox = false;
        if (document.body.classList.contains('play-mode') && !isSelected && !isHovered && layer !== 'ground') {
            const _imgCheck = this.getImage(p.item_id, p.orientation);
            if (_imgCheck) hideBox = true;
        }

        if (!lift && !hideBox) {
            ctx.save();
            ctx.globalAlpha = 0.25;
            this._drawDiamondPath(p.x + 0.1, p.y + 0.1, w, l, 1.5, p.floor);
            ctx.fillStyle = '#000';
            ctx.fill();
            ctx.restore();
        }

        if (!hideBox) {
            this._drawDiamondPath(p.x, p.y, w, l, layer === 'ground' ? 0 : (lift ? 3 : 2), p.floor);
            ctx.fillStyle   = fillColor;
            ctx.strokeStyle = isSelected ? '#ff2222' : isHovered ? '#ffaa00' : (lift ? 'rgba(180,120,40,0.5)' : 'rgba(0,0,0,0.4)');
            ctx.lineWidth   = isSelected ? 2.5 : 1.5;
            ctx.fill();
            ctx.stroke();
        }

        if (layer === 'ground') {
            this._drawDirtTexture(p.x, p.y, w, l, p.floor);
        }

        const img = this.getImage(p.item_id, p.orientation);
        if (img) {
            this._drawSpriteOnTile(img, p.x, p.y, w, l, p.orientation, p.item_id, p.floor);
        } else {
            const center = this._tileCenter(p.x, p.y, w, l, p.floor);
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
                this._drawSpriteOnTile(plantedImg, p.x, p.y - 0.5, w, l, 0, p.planted_id, p.floor);
            }
        }

        if (layer === 'seed') {
            const center = this._tileCenter(p.x, p.y, w, l, p.floor);
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

    _drawDirtTexture(gx, gy, w, l, floorNum = 0) {
        // Draw a subtle criss-cross dirt pattern inside the tile
        const ctx = this.ctx;
        const top   = this.getIsoCoords(gx,   gy, floorNum);
        const right = this.getIsoCoords(gx+w, gy, floorNum);
        const bot   = this.getIsoCoords(gx+w, gy+l, floorNum);
        const left  = this.getIsoCoords(gx,   gy+l, floorNum);

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

    _drawSpriteOnTile(img, gx, gy, w, l, orientation = 0, item_id = null, floorNum = 0) {
        const ctx = this.ctx;
        const top   = this.getIsoCoords(gx,   gy, floorNum);
        const right = this.getIsoCoords(gx+w, gy, floorNum);
        const bot   = this.getIsoCoords(gx+w, gy+l, floorNum);
        const left  = this.getIsoCoords(gx,   gy+l, floorNum);

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


        // Punto de contacto = centro del diamante (el piso de la celda).
        const anchorY = cy;
        const pivot = this._resolveSpritePivot(item_id, img, orientation);
        const pivotX = pivot.x;
        const pivotY = pivot.y;

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
            center = this.getWallIsoCoords(p.x + sz.w / 2, p.y + sz.h / 2, !!p.flipped, this._wallRoomBBox, p.floor);
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

    _drawDiamondPath(gx, gy, w, l, shrinkPx = 0, floorNum = 0) {
        const ctx = this.ctx;
        const top   = this.getIsoCoords(gx,   gy, floorNum);
        const right = this.getIsoCoords(gx+w, gy, floorNum);
        const bot   = this.getIsoCoords(gx+w, gy+l, floorNum);
        const left  = this.getIsoCoords(gx,   gy+l, floorNum);
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

    _tileCenter(gx, gy, w, l, floorNum = 0) {
        const top = this.getIsoCoords(gx,   gy, floorNum);
        const bot = this.getIsoCoords(gx+w, gy+l, floorNum);
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
        if (!isWallLayer && !document.body.classList.contains('play-mode')) {
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

        
        this.canvas.addEventListener('dragover', e => {
            if (!document.body.classList.contains('play-mode')) return;
            e.preventDefault(); // Permitir drop
            
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            
            const hit = this._hitTestPlaySurface(mouseX, mouseY);
            if (hit) {
                // Leer datos arrastrados, pero dataTransfer no est� disponible en dragover para leer el JSON completo en Chrome a veces.
                // Usaremos un hack local si es necesario, pero por ahora solo mostraremos un snap gen�rico o no mostraremos fantasma si no sabemos el tama�o.
                // Como workaround, guardaremos el item arrastrado en la instancia si viene de la mochila.
                if (this.draggedInventoryItem) {
                    const item_id = this.draggedInventoryItem.item_id;
                    const coveringType = this.isCovering(item_id);
                    const isWallItem = this.isWallFurniture(item_id);

                    if (coveringType) {
                        const valid = (coveringType === 'floor' && hit.kind === 'floor') || (coveringType === 'wallpaper' && hit.kind === 'wall');
                        this.isItemDragging = valid ? {
                            item_id: item_id, x: hit.x, y: hit.y, floor: hit.floorNum, orientation: 0, occupied: false, isWall: hit.kind === 'wall', flipped: hit.flipped
                        } : null;
                    } else if (isWallItem && hit.kind !== 'wall') {
                        this.isItemDragging = null;
                    } else if (!isWallItem && hit.kind === 'wall') {
                        this.isItemDragging = null;
                    } else {
                        const { w, l } = this.getRotatedSize(item_id, 0);
                        this.isItemDragging = {
                            item_id: item_id,
                            x: hit.x,
                            y: hit.y,
                            floor: hit.floorNum,
                            orientation: 0,
                            isWall: hit.kind === 'wall',
                            flipped: hit.flipped,
                            occupied: this._isAreaOccupied(hit.floorNum, hit.x, hit.y, w, l)
                        };
                    }
                    this.draw();
                }
            } else {
                this.isItemDragging = null;
                this.draw();
            }
        });

        this.canvas.addEventListener('dragleave', e => {
            this.isItemDragging = null;
            this.draw();
        });

        this.canvas.addEventListener('drop', e => {
            if (!document.body.classList.contains('play-mode')) return;
            e.preventDefault();
            this.isItemDragging = null;
            this.draw();
            
            try {
                const data = JSON.parse(e.dataTransfer.getData('application/json'));
                if (!data || !data.item_id) return;
                
                const rect = this.canvas.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;
                
                const hit = this._hitTestPlaySurface(mouseX, mouseY);
                if (hit) {
                    const targetLocStr = document.getElementById('select-location')?.value;
                    const targetLoc = targetLocStr !== undefined && targetLocStr !== "" ? parseInt(targetLocStr, 10) : 1;
                    
                    const coveringType = this.isCovering(data.item_id);
                    if (coveringType) {
                        let applied = false;
                        if (coveringType === 'floor' && hit.kind === 'floor') {
                            if (this.app.parser.setFloor(targetLoc, hit.floorNum, data.item_id) !== false) applied = true;
                        } else if (coveringType === 'wallpaper' && hit.kind === 'wall') {
                            if (this.app.parser.setWallpaper(targetLoc, hit.floorNum, data.item_id) !== false) applied = true;
                        }
                        
                        if (applied) {
                            const invArray = this.app.parser.inventory;
                            const slotIdx = invArray.findIndex(i => i.item_id === data.item_id && i.invType == data.invType && i.qty > 0);
                            if (slotIdx !== -1) {
                                this.app.parser.updateInventoryItem('inventory', slotIdx, data.item_id, invArray[slotIdx].qty - 1, data.invType);
                            }
                            // Important: force refresh tileset texture cache
                            const typeName = coveringType === 'wallpaper' ? 'wallpaper' : 'floor';
                            const cacheKey = `${typeName}_${data.item_id}`;
                            if (!this._patternCache[cacheKey]) this._getTilesetTexture(typeName, data.item_id);
                            
                            this.draw();
                            if (this.app.tsukiPort && typeof this.app.tsukiPort.renderBagInventory === 'function') this.app.tsukiPort.renderBagInventory();
                            if (this.app.tsukiPort && typeof this.app.tsukiPort.renderHammerInventory === 'function') this.app.tsukiPort.renderHammerInventory();
                        }
                        return;
                    }
                    
                    const isWallItem = this.isWallFurniture(data.item_id);
                    if (isWallItem && hit.kind !== 'wall') {
                        console.warn("Item de pared no puede ir en piso");
                        return;
                    }
                    if (!isWallItem && hit.kind === 'wall') {
                        console.warn("Item de piso no puede ir en pared");
                        return;
                    }
                    
                    const { w, l } = this.getRotatedSize(data.item_id, 0);
                    // For walls, maybe w,l don't apply the same way, but let's keep _isAreaOccupied checking simple for now.
                    if (this._isAreaOccupied(hit.floorNum, hit.x, hit.y, w, l)) {
                        console.warn("Posici�n ocupada.");
                        return; // Ocupado
                    }
                    
                    // Colocar!
                    const newPlacement = {
                        item_id: data.item_id,
                        x: hit.x,
                        y: hit.y,
                        floor: hit.floorNum,
                        orientation: 0,
                        cluster: targetLoc,
                        isWall: hit.kind === 'wall',
                        flipped: hit.kind === 'wall' ? hit.flipped : false
                    };
                    
                    // Descontar del inventario
                    const invArray = this.app.parser.inventory;
                    const slotIdx = invArray.findIndex(i => i.item_id === data.item_id && i.invType == data.invType && i.qty > 0);
                    if (slotIdx !== -1) {
                        this.app.parser.updateInventoryItem('inventory', slotIdx, data.item_id, invArray[slotIdx].qty - 1, data.invType);
                        this.app.parser.placements.push(newPlacement);
                        this.selectedPlacement = newPlacement;
                        this.draw();
                        if (this.app.tsukiPort) {
                            if (this.isHammerMode && typeof this.app.tsukiPort.renderHammerInventory === 'function') this.app.tsukiPort.renderHammerInventory();
                            if (!this.isHammerMode && typeof this.app.tsukiPort.renderBagInventory === 'function') this.app.tsukiPort.renderBagInventory();
                        }
                    }
                }
            } catch (err) {
                console.error("Error on drop", err);
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
            let isGrid = document.body.classList.contains('grid-mode');
            
            if (e.button === 1 || e.shiftKey || e.button === 2) {
                this.isPanDragging = true;
                this.dragStartX    = e.clientX - this.offsetX;
                this.dragStartY    = e.clientY - this.offsetY;
            } else if (e.button === 0) {
                if (isGrid && this.app.gridEditor && this.app.gridEditor.activeSurfaceIndex !== -1) {
                    this.isGridDragging = true;
                    this.dragStartX = e.clientX;
                    this.dragStartY = e.clientY;
                    const surf = window.mapsAtlas[this.app.gridEditor.activeSurfaceIndex];
                    this.gridStartOriginX = surf.origin_px.x;
                    this.gridStartOriginY = surf.origin_px.y;
                    return;
                }

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
            if (this.isGridDragging && this.app.gridEditor) {
                const surf = window.mapsAtlas[this.app.gridEditor.activeSurfaceIndex];
                if (surf) {
                    // Mover la grilla en píxeles. Puesto que la cámara puede estar escalada,
                    // el desplazamiento del mouse (dx, dy) en pantalla corresponde a (dx/scale, dy/scale)
                    // en el espacio no escalado. Y porque 'origin_px' asume un espacio escalado por 0.75,
                    // la escala total es 0.75 * this.scale
                    const dx = e.clientX - this.dragStartX;
                    const dy = e.clientY - this.dragStartY;
                    surf.origin_px.x = this.gridStartOriginX + dx / (0.75 * this.scale);
                    surf.origin_px.y = this.gridStartOriginY + dy / (0.75 * this.scale);
                    this.draw();
                }
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
            this.isGridDragging = false;
            this._dragSnap = null;
        });

        this.canvas.addEventListener('mouseleave', () => {
            this.isPanDragging  = false;
            this.isItemDragging = false;
            this.isGridDragging = false;
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

