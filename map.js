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
    _getMaskByName(maskFilename, loc) {
        if (!maskFilename) return null;
        if (!maskFilename.endsWith('.png')) maskFilename += '.png';
        const META = (window.MAP_META && window.MAP_META[loc]) || {};
        let exportDir = META.exportDir != null ? META.exportDir : (loc === 0 ? 2 : loc);
        const cacheKey = 'mask_' + exportDir + '_' + maskFilename;
        if (this._imgCache[cacheKey] !== undefined) {
            return this._imgCache[cacheKey];
        }
        this._imgCache[cacheKey] = false;
        const img = new Image();
        img.onload = () => {
            this._imgCache[cacheKey] = img;
            this._bakedBgKey = null;
            this.draw();
        };
        img.onerror = () => {
            this._imgCache[cacheKey] = false;
        };
        img.src = 'images/maps/Exportado_level' + exportDir + '/' + maskFilename;
        return false;
    }

    _getMaskImage(type, floorKey, loc) {
        // U1: resolver exportDir/assembled/mask via MAP_META y surface.mask si existe, fallback viejo
        const META = (window.MAP_META && window.MAP_META[loc]) || {};
        let exportDir = META.exportDir != null ? META.exportDir : (loc === 0 ? 2 : loc);
        // buscar surface para este loc/type/floorKey
        let surface = null;
        if (window.mapsAtlas) {
            // heuristic: floorKey mapea a groupNum para floor; para wall usa fNum
            surface = window.mapsAtlas.find(s => {
                if (String(s.mapId) !== String(loc)) return false;
                if (type === 'floor' && s.kind === 'floor' && s.groupNum === floorKey) return true;
                if (type === 'wall') {
                    const fNum = Math.floor(floorKey / 2);
                    const expectFlipped = (floorKey % 2) === 0; // wallL is flipped true, wallR false; floorKey even->L, odd->R
                    // Para loc 0 usamos lógica wallL/R, para farm group 3 ambos walls
                    if (s.kind === 'wall' && s.groupNum === fNum && s.flipped === expectFlipped) return true;
                    // fallback group 3 farm exact
                    if (String(loc) === '6' && s.kind === 'wall' && s.groupNum === 3) return true;
                }
                return false;
            }) || null;
            if (surface && surface.mask) {
                return this._getMaskByName(surface.mask, loc);
            }
        }
        let maskName = 'mask_' + type + '_' + floorKey;
        if (type === 'wall' && String(loc) === '0') {
            const isRight = (floorKey % 2) !== 0;
            const fNum = Math.floor(floorKey / 2);
            maskName = 'mask_wall' + (isRight ? 'R' : 'L') + '_' + fNum;
        }
        return this._getMaskByName(maskName, loc);
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
        img.src = `images/tilesets/${type === 'wall' ? 'wallpapers' : type + 's'}/${id}.png`;
        img.onload = () => {
            this._patternCache[cacheKey] = { img: img, pattern: null };
            this._bakedBgKey = null;
            this.draw(); // Redraw map once the tileset loads
        };
        img.onerror = () => {
            this._patternCache[cacheKey] = { error: true };
        }
        return null;
    }

    getSurfaceCoveringId(surf, targetLoc) {
        if (!surf) return null;
        const isFloor = surf.kind === 'floor';
        if (isFloor) {
            const floorDict = this.app && this.app.parser && this.app.parser.floors;
            if (floorDict && floorDict[targetLoc] && floorDict[targetLoc].length) {
                const fList = floorDict[targetLoc];
                const match = fList.find(f => (surf.anchorID != null && Number(f.key) === Number(surf.anchorID)) || Number(f.key) === Number(surf.groupNum));
                if (match && match.id > 0) return match.id;
                if (fList[surf.groupNum] && fList[surf.groupNum].id > 0) return fList[surf.groupNum].id;
            }
            if (surf.defaultCoverId !== undefined) return surf.defaultCoverId;
            return (surf.groupNum < 2) ? (surf.groupNum === 0 ? 69 : 750) : null;
        } else {
            const wpDict = this.app && this.app.parser && this.app.parser.wallpapers;
            if (wpDict && wpDict[targetLoc] && wpDict[targetLoc].length) {
                const wList = wpDict[targetLoc];
                if (surf.anchorID != null) {
                    const match = wList.find(w => Number(w.key) === Number(surf.anchorID));
                    if (match && match.id > 0) return match.id;
                }
                // Unity Treehouse ordering:
                // 0: Floor 0 Left (flipped=true)
                // 1: Floor 1 Left (flipped=true)
                // 2: Floor 1 Right (flipped=false)
                // 3: Floor 0 Right (flipped=false)
                if (Number(targetLoc) === 0 && wList.length >= 4) {
                    const idx = surf.flipped ? (surf.groupNum === 0 ? 0 : 1) : (surf.groupNum === 0 ? 3 : 2);
                    if (wList[idx] && wList[idx].id > 0) return wList[idx].id;
                } else {
                    const idx = (surf.groupNum * 2) + (surf.flipped ? 0 : 1);
                    if (wList[idx] && wList[idx].id > 0) return wList[idx].id;
                }
            }
            if (surf.defaultCoverId !== undefined) return surf.defaultCoverId;
            if (Number(targetLoc) === 0) {
                if (surf.groupNum === 0) return surf.flipped ? 755 : 2127;
                if (surf.groupNum === 1) return surf.flipped ? 752 : 418;
            }
            return null;
        }
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
        const size = this.getSize(item_id);
        // orientation 1 (SW) and 3 (NE) align the object along the opposite axis, 
        // so we must swap width and length.
        if (orientation === 1 || orientation === 3) {
            return { w: size.l, l: size.w };
        }
        return size;
    }

    getImage(item_id, orientation, placement) {
        // Light profile from prefab metadata (LIGHT_PROFILES)
        const profile = window.LIGHT_PROFILES && window.LIGHT_PROFILES[String(item_id)];
        let targetSprite = null;
        if (profile) {
            const mode = placement ? (placement._lightMode || 'auto') : 'auto';
            const minutes = (window.GameTime && typeof window.GameTime.now === 'function')
                ? (window.GameTime.now().hour * 60 + (window.GameTime.now().minute || 0))
                : (this.app && this.app.parser && typeof this.app.parser.getClock === 'function' ? (this.app.parser.getClock().hour * 60 + (this.app.parser.getClock().minute || 0)) : 0);
            const on = window.Lighting && typeof window.Lighting.lampOn === 'function' ? window.Lighting.lampOn(mode, minutes) : (mode === 'on');
            if (on && profile.on_sprite) {
                targetSprite = profile.on_sprite;
            } else if (!on && profile.off_sprite) {
                targetSprite = profile.off_sprite;
            } else if (profile.body_sprite) {
                targetSprite = profile.body_sprite;
            }
        }

        if (targetSprite) {
            const ori = Number(orientation);
            const isBack = ori === 2 || ori === 3;
            const cacheKey = 'PROF_' + targetSprite + (isBack ? '_BACK' : '');
            if (this._imgCache[cacheKey] !== undefined) {
                return this._imgCache[cacheKey];
            }
            this._imgCache[cacheKey] = false;

            const candidates = [
                `images/items/${targetSprite}.png?v=5`,
                `data/prefab_exports/${item_id}/${targetSprite}.png?v=5`,
                isBack ? `images/items/FURN_${item_id}_BACK.png?v=5` : `images/items/FURN_${item_id}_0.png?v=5`,
                isBack ? `images/items/FURN_${item_id}_0.png?v=5` : `images/items/FURN_${item_id}.png?v=5`,
                `images/items/FURN_${item_id}.png?v=5`
            ];

            const tryLoadIndex = (idx) => {
                if (idx >= candidates.length) {
                    this._imgCache[cacheKey] = null;
                    this.draw();
                    return;
                }
                const img = new Image();
                img.onload = () => {
                    this._imgCache[cacheKey] = img;
                    this.draw();
                };
                img.onerror = () => {
                    tryLoadIndex(idx + 1);
                };
                img.src = candidates[idx];
            };
            tryLoadIndex(0);
            return this._imgCache[cacheKey];
        }

        // U4: si BEHAVIORS render.on y placement _lightMode on/auto-on, intentar ON
        let tryOn = false;
        if (placement && window.BEHAVIORS && window.BEHAVIORS[String(item_id)] && window.BEHAVIORS[String(item_id)].render && window.BEHAVIORS[String(item_id)].render.on) {
            const beh = window.BEHAVIORS[String(item_id)];
            if (beh.interact === 'light_toggle') {
                const mode = placement._lightMode || 'auto';
                const minutes = (window.GameTime ? window.GameTime.now().minutes : (this.app && this.app.parser ? this.app.parser.getClock().hour * 60 : 0));
                const on = window.Lighting ? window.Lighting.lampOn(mode, minutes) : (mode === 'on');
                if (on) tryOn = true;
            }
        }
        // 0: SE (Front Right) 1: SW 2: NW 3: NE
        const ori = Number(orientation);
        const isBack = ori === 2 || ori === 3;
        const frontKey = tryOn ? `${item_id}_ON` : `${item_id}`;
        const backKey = tryOn ? `${item_id}_ON_BACK` : `${item_id}_BACK`;
        
        const cacheKey = (tryOn ? 'ON_' : '') + (isBack ? backKey : frontKey);
        
        if (this._imgCache[cacheKey] !== undefined) {
            return this._imgCache[cacheKey];
        }

        // Si es una imagen trasera y ya tenemos la frontal en caché, usarla temporalmente
        // de fallback para que el mueble NUNCA desaparezca mientras carga el sprite trasero.
        const cachedFront = this._imgCache[frontKey];
        if (isBack && cachedFront && cachedFront !== false) {
            this._imgCache[cacheKey] = cachedFront;
        } else {
            this._imgCache[cacheKey] = false;
        }
        
        const loadImg = (keyToLoad, fallbackCb) => {
            const isBackImage = String(keyToLoad).includes('_BACK');
            // La gran mayoría de imágenes _BACK (2515 de ellas) se llaman FURN_xxx_BACK.png (sin _0).
            // Para las frontales, se llaman FURN_xxx_0.png.
            const firstSrc = isBackImage ? `images/items/FURN_${keyToLoad}.png?v=5` : `images/items/FURN_${keyToLoad}_0.png?v=5`;
            const secondSrc = isBackImage ? `images/items/FURN_${keyToLoad}_0.png?v=5` : `images/items/FURN_${keyToLoad}.png?v=5`;

            const img = new Image();
            img.onload = () => { this._imgCache[cacheKey] = img; this.draw(); };
            img.onerror = () => {
                const img2 = new Image();
                img2.onload = () => { this._imgCache[cacheKey] = img2; this.draw(); };
                img2.onerror = fallbackCb;
                img2.src = secondSrc;
            };
            img.src = firstSrc;
        };

        if (tryOn) {
            // U4: ON first, fallback a normal
            loadImg(frontKey, () => {
                const normalKey = isBack ? `${item_id}_BACK` : `${item_id}`;
                const normalCache = normalKey;
                if (this._imgCache[normalCache] && this._imgCache[normalCache] !== false) {
                    this._imgCache[cacheKey] = this._imgCache[normalCache];
                    this.draw();
                } else {
                    loadImg(normalKey.replace('_BACK','_BACK').replace('_ON',''), () => {
                        const img2 = new Image();
                        img2.onload = () => { this._imgCache[cacheKey] = img2; this.draw(); };
                        img2.onerror = () => { this._imgCache[cacheKey] = null; this.draw(); };
                        img2.src = `images/items/FURN_${normalKey}.png?v=5`;
                    });
                }
            });
            if (isBack) { /* already handled via frontKey ON_BACK */ }
        } else if (isBack) {
            // Intentar cargar la imagen trasera; si no existe, usar la frontal con oscurecido
            loadImg(backKey, () => {
                if (this._imgCache[frontKey] && this._imgCache[frontKey] !== false) {
                    this._imgCache[cacheKey] = this._imgCache[frontKey];
                    this.draw();
                } else {
                    loadImg(frontKey, () => {
                        this._imgCache[cacheKey] = null;
                        this.draw();
                    });
                }
            });
        } else {
            // Normal front load
            loadImg(frontKey, () => {
                this._imgCache[cacheKey] = null;
                this.draw();
            });
        }
        
        return this._imgCache[cacheKey];
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
        const ori = Number(orientation);
        const isBack = ori === 2 || ori === 3;
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
    surfaceFor(mapId, groupNum, isWall, flipped) {
        if (!window.mapsAtlas) return null;
        return window.mapsAtlas.find(s => String(s.mapId) === String(mapId) && Number(s.groupNum) === Number(groupNum) && s.kind === (isWall ? 'wall' : 'floor') && (isWall ? !!s.flipped === !!flipped : true)) || null;
    }
    getAtlasSurface(kind, groupNum, mapId, flipped) {
        if (mapId == null) {
            const sel = document.getElementById('select-location');
            mapId = sel ? sel.value : 0;
        }
        if (kind === 'wall') return this.surfaceFor(mapId, groupNum, true, flipped);
        return this.surfaceFor(mapId, groupNum, false, false);
    }
    
    getFloorOffset(floorNum, mapId) {
        let isPlay = document.body.classList.contains('play-mode');
        let isGrid = document.body.classList.contains('grid-mode');
        if (!isPlay && !isGrid) return { x: 0, y: 0 };
        if (mapId == null) {
            const sel = document.getElementById('select-location');
            mapId = sel ? parseInt(sel.value, 10) : 0;
        }
        const surf = this.surfaceFor(mapId, floorNum, false, false);
        if (surf && surf.origin_px) {
            return { x: surf.origin_px.x * (window.atlasConfig && window.atlasConfig.bgScale ? window.atlasConfig.bgScale : 0.75), y: surf.origin_px.y * (window.atlasConfig && window.atlasConfig.bgScale ? window.atlasConfig.bgScale : 0.75) };
        }
        if (window.tsukiDebugGrid === '1' || localStorage.tsukiDebugGrid === '1') console.debug('[surfaceFor miss floor]', { mapId, floorNum });
        return { x: 0, y: 0 };
    }

    getIsoCoords(x, y, floorNum = 0, mapId) {
        if (mapId == null) {
            const sel = document.getElementById('select-location');
            mapId = sel ? parseInt(sel.value, 10) : 0;
        }
        const _bgo = (window.atlasConfig && window.atlasConfig.bgScale ? window.atlasConfig.bgScale : 0.75);
        const u = _bgo * this.scale;
        const surf = this.surfaceFor(mapId, floorNum, false, false);
        if (surf) {
            let ox = 0, oy = 0;
            if (surf.origin) {
                ox = surf.origin.x;
                oy = surf.origin.y;
            } else if (surf.origin_px) {
                ox = (surf.origin_px.x - 1235) / 150;
                oy = (1257 - surf.origin_px.y) / 150;
            }
            const cw_u = ((surf.cell && surf.cell.w) || 58) / 150;
            const ch_u = ((surf.cell && surf.cell.h) || 28) / 150;
            
            const worldX = ox + (x - y) * (cw_u / 2);
            const worldY = oy - (x + y) * (ch_u / 2);
            
            return {
                x: this.offsetX + worldX * 150 * u,
                y: this.offsetY - worldY * 150 * u
            };
        }
        
        const cellW = this.CELL_W;
        const cellH = this.CELL_H;
        const isoX = (x - y) * (cellW / 2);
        const isoY = (x + y) * (cellH / 2);
        return {
            x: isoX * this.scale + this.offsetX,
            y: isoY * this.scale + this.offsetY
        };
    }

    getCartesianCoords(screenX, screenY, floorNum = 0, mapId) {
        if (mapId == null) {
            const sel = document.getElementById('select-location');
            mapId = sel ? parseInt(sel.value, 10) : 0;
        }
        const layerRadio = document.querySelector('input[name="map-layer"]:checked');
        if (layerRadio && layerRadio.value === 'wall') {
            return {
                x: Math.floor((screenX - 100) / this.gridSize),
                y: Math.floor((screenY - 100) / this.gridSize)
            };
        }
        const surf = this.surfaceFor(mapId, floorNum, false, false);
        if (surf) {
            const _bgo = (window.atlasConfig && window.atlasConfig.bgScale ? window.atlasConfig.bgScale : 0.75);
            const u = _bgo * this.scale;
            let ox = 0, oy = 0;
            if (surf.origin) {
                ox = surf.origin.x;
                oy = surf.origin.y;
            } else if (surf.origin_px) {
                ox = (surf.origin_px.x - 1235) / 150;
                oy = (1257 - surf.origin_px.y) / 150;
            }
            const cw_u = ((surf.cell && surf.cell.w) || 58) / 150;
            const ch_u = ((surf.cell && surf.cell.h) || 28) / 150;

            const worldX = (screenX - this.offsetX) / (150 * u);
            const worldY = (this.offsetY - screenY) / (150 * u);
            const wx = worldX - ox;
            const wy = worldY - oy;
            const U = wx / (cw_u / 2);
            const V = -wy / (ch_u / 2);
            return { x: (U + V) / 2, y: (V - U) / 2 };
        }
        const off = this.getFloorOffset(floorNum);
        const isoX = (screenX - this.offsetX) / this.scale - (off ? off.x : 0);
        const isoY = (screenY - this.offsetY) / this.scale - (off ? off.y : 0);
        const u = isoX / (this.CELL_W / 2);
        const v = -isoY / (this.CELL_H / 2);
        return { x: (u + v) / 2, y: (v - u) / 2 };
    }

    // ── Resize ────────────────────────────────────────────────────────────
    resize() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width  = rect.width;
        this.canvas.height = rect.height;
        // Center camera on level origin (0, 0)
        this.offsetX = this.canvas.width  / 2;
        this.offsetY = this.canvas.height / 2;
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
        if (imgName.startsWith('images/') || imgName.startsWith('data/')) {
            img.src = imgName;
        } else if (imgName.startsWith('../maps/')) {
            img.src = imgName.replace('../maps/', 'images/maps/');
        } else {
            img.src = `images/all_sprites/${imgName}`;
        }
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
            if (s) {
                const w = s.width !== undefined ? s.width : (s.w !== undefined ? s.w : 1);
                const h = s.height !== undefined ? s.height : (s.length !== undefined ? s.length : (s.l !== undefined ? s.l : 1));
                return {
                    w: Math.max(1, Number(w) || 1),
                    h: Math.max(1, Number(h) || 1)
                };
            }
        }
        return { w: 1, h: 1 };
    }

    _getPlacementRenderOffset(p) {
        if (!p || p.isWall || !this.app || !this.app.parser || !this.app.parser.placements) return { x: 0, y: 0 };
        if (!this._cellColocationGroups) {
            this._cellColocationGroups = new Map();
            for (const item of this.app.parser.placements) {
                if (!item.isWall && item.item_id > 0 && item.x >= 0 && item.y >= 0) {
                    const key = `${item.cluster != null ? item.cluster : 0}_${item.floor != null ? item.floor : 0}_${item.x}_${item.y}`;
                    if (!this._cellColocationGroups.has(key)) this._cellColocationGroups.set(key, []);
                    this._cellColocationGroups.get(key).push(item);
                }
            }
        }
        const key = `${p.cluster != null ? p.cluster : 0}_${p.floor != null ? p.floor : 0}_${p.x}_${p.y}`;
        const group = this._cellColocationGroups.get(key);
        if (!group || group.length <= 1) return { x: 0, y: 0 };
        const idx = group.indexOf(p);
        if (idx === -1) return { x: 0, y: 0 };
        const surf = this.surfaceFor(p.cluster != null ? p.cluster : 0, p.floor != null ? p.floor : 0, false, false);
        const _bgo = (window.atlasConfig && window.atlasConfig.bgScale ? window.atlasConfig.bgScale : 0.75);
        const u = _bgo * this.scale;
        const cellW = (((surf && surf.cell && surf.cell.w) || 58)) * u;
        const cellH = (((surf && surf.cell && surf.cell.h) || 28)) * u;
        const count = group.length;
        const angle = (idx * 2 * Math.PI) / count + (count % 2 === 0 ? Math.PI / 4 : 0);
        return { x: Math.cos(angle) * 0.25 * cellW, y: Math.sin(angle) * 0.25 * cellH };
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
    getWallOffset(floorNum, flipped, mapId) {
        let isPlay = document.body.classList.contains('play-mode');
        let isGrid = document.body.classList.contains('grid-mode');
        if (!isPlay && !isGrid) return null;
        if (mapId == null) { const sel=document.getElementById('select-location'); mapId = sel ? parseInt(sel.value,10):0; }
        const surf = this.surfaceFor(mapId, floorNum, true, flipped);
        if (surf && surf.origin_px) {
            return { x: surf.origin_px.x * (window.atlasConfig && window.atlasConfig.bgScale ? window.atlasConfig.bgScale : 0.75), y: surf.origin_px.y * (window.atlasConfig && window.atlasConfig.bgScale ? window.atlasConfig.bgScale : 0.75) };
        }
        return null;
    }

    getWallIsoCoords(wx, wy, flipped, bbox, floorNum = 0, mapId) {
        if (mapId == null) { const sel=document.getElementById('select-location'); mapId = sel ? parseInt(sel.value,10):0; }
        const _bgo = (window.atlasConfig && window.atlasConfig.bgScale ? window.atlasConfig.bgScale : 0.75);
        const u = _bgo * this.scale;
        const surf = this.surfaceFor(mapId, floorNum, true, flipped);
        if (surf) {
            let ox = 0, oy = 0;
            if (surf.origin) {
                ox = surf.origin.x;
                oy = surf.origin.y;
            } else if (surf.origin_px) {
                ox = (surf.origin_px.x - 1235) / 150;
                oy = (1257 - surf.origin_px.y) / 150;
            }
            const cw_u = ((surf.cell && surf.cell.w) || 58) / 150;
            const ch_u = ((surf.cell && surf.cell.h) || 28) / 150;
            
            let worldX, worldY;
            if (!flipped) {
                worldX = ox + wx * (cw_u / 2);
                worldY = oy - wx * (ch_u / 2) - wy * ch_u;
            } else {
                worldX = ox + wx * (cw_u / 2);
                worldY = oy - wx * (ch_u / 2) - wy * ch_u;
            }
            
            return {
                x: this.offsetX + worldX * 150 * u,
                y: this.offsetY - worldY * 150 * u
            };
        }
        
        // Fallback al motor original
        const box = bbox || this._wallRoomBBox || { xmin: 0, ymin: 0, xmax: 16, ymax: 16 };
        const base = flipped
            ? this.getIsoCoords(wx, box.ymax, floorNum)
            : this.getIsoCoords(box.xmax, wx, floorNum);
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
    screenToWallGrid(screenX, screenY, flipped, bbox, floorNum = 0, mapId) {
        let isPlay = document.body.classList.contains('play-mode');
        let isGrid = document.body.classList.contains('grid-mode');
        if (mapId == null) { const sel = document.getElementById('select-location'); mapId = sel ? parseInt(sel.value, 10) : 0; }
        
        if (window.mapsAtlas && (isPlay || isGrid)) {
            const surf = this.surfaceFor(mapId, floorNum, true, flipped);
            if (surf) {
                let ox = 0, oy = 0;
                if (surf.origin) {
                    ox = surf.origin.x;
                    oy = surf.origin.y;
                } else if (surf.origin_px) {
                    ox = (surf.origin_px.x - 1235) / 150;
                    oy = (1257 - surf.origin_px.y) / 150;
                }
                const cw_u = ((surf.cell && surf.cell.w) || 58) / 150;
                const ch_u = ((surf.cell && surf.cell.h) || 28) / 150;
                const _bgo = (window.atlasConfig && window.atlasConfig.bgScale ? window.atlasConfig.bgScale : 0.75);
                const u = _bgo * this.scale;
                const factor = 150 * u;

                const worldX = (screenX - this.offsetX) / factor;
                const worldY = (this.offsetY - screenY) / factor;

                const wx = (worldX - ox) / (cw_u / 2);
                const wy = (oy - worldY - wx * (ch_u / 2)) / ch_u;
                return { x: wx, y: wy };
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
        const cart = this.getCartesianCoords(mouseX, mouseY, placement ? placement.floor : 0);
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
                const overlap = a.p.floor === b.p.floor && a.p.x < b.p.x + b.w && a.p.x + a.w > b.p.x
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

    _isCellInSurfacePoly(surf, gx, gy, w = 1, l = 1) {
        if (!surf || !surf.poly || surf.poly.length < 3) return true;
        const cw_u = ((surf.cell && surf.cell.w) || 58) / 150;
        const ch_u = ((surf.cell && surf.cell.h) || 28) / 150;
        
        // Check center of the item
        const cx = gx + w / 2;
        const cy = gy + l / 2;
        const cwx = (cx - cy) * (cw_u / 2);
        const cwy = -(cx + cy) * (ch_u / 2);
        if (this._pointInPoly(cwx, cwy, surf.poly)) return true;

        // Check origin of the tile
        const owx = (gx - gy) * (cw_u / 2);
        const owy = -(gx + gy) * (ch_u / 2);
        if (this._pointInPoly(owx, owy, surf.poly)) return true;

        // Check the remaining corners
        const corners = [
            [gx + w, gy],
            [gx, gy + l],
            [gx + w, gy + l]
        ];
        for (const [px, py] of corners) {
            const wx = (px - py) * (cw_u / 2);
            const wy = -(px + py) * (ch_u / 2);
            if (this._pointInPoly(wx, wy, surf.poly)) return true;
        }

        return false;
    }

    _clampFloorGrid(p, x, y) {
        const isPlay = document.body.classList.contains('play-mode');
        const isGrid = document.body.classList.contains('grid-mode');
        const locVal = document.getElementById('select-location')?.value;
        const targetLoc = p.cluster != null ? p.cluster : (locVal !== '' && locVal != null ? parseInt(locVal, 10) : 0);
        const sz = this.getRotatedSize(p.item_id, p.orientation);
        const w = sz.w || 1, l = sz.l || 1;
        
        if (window.mapsAtlas && (isPlay || isGrid)) {
            const surf = this.surfaceFor(targetLoc, p.floor, false, false);
            if (surf && surf.poly && surf.poly.length > 2) {
                // Free movement inside the surface polygon limits
                if (this._isCellInSurfacePoly(surf, x, y, w, l)) {
                    return { x, y };
                }
                const last = this._dragSnap || { x: p.x, y: p.y };
                if (this._isCellInSurfacePoly(surf, x, last.y, w, l)) {
                    return { x, y: last.y };
                }
                if (this._isCellInSurfacePoly(surf, last.x, y, w, l)) {
                    return { x: last.x, y };
                }
                if (this._isCellInSurfacePoly(surf, last.x, last.y, w, l)) {
                    return { x: last.x, y: last.y };
                }
                return { x, y };
            }
            const maxCols = (surf && surf.cols) || 16;
            const maxRows = (surf && surf.rows) || 16;
            return {
                x: Math.max(0, Math.min(maxCols - w, x)),
                y: Math.max(0, Math.min(maxRows - l, y))
            };
        }
        const n = this._floorExtentForLoc(targetLoc) || FLOOR_GRID_N;
        return {
            x: Math.max(0, Math.min(n - w, x)),
            y: Math.max(0, Math.min(n - l, y))
        };
    }

    _isWallCellInSurfacePoly(surf, wx, wy, w = 1, h = 1) {
        if (!surf || !surf.poly || surf.poly.length < 3) return true;
        const cw_u = ((surf.cell && surf.cell.w) || 58) / 150;
        const ch_u = ((surf.cell && surf.cell.h) || 28) / 150;
        const corners = [
            [wx, wy],
            [wx + w, wy],
            [wx, wy + h],
            [wx + w, wy + h],
            [wx + w / 2, wy + h / 2]
        ];
        const centerRelX = (wx + w / 2) * (cw_u / 2);
        const centerRelY = - (wx + w / 2) * (ch_u / 2) - (wy + h / 2) * ch_u;
        if (!this._pointInPoly(centerRelX, centerRelY, surf.poly)) return false;

        let insideCount = 0;
        for (const [x, y] of corners) {
            const relX = x * (cw_u / 2);
            const relY = - x * (ch_u / 2) - y * ch_u;
            if (this._pointInPoly(relX, relY, surf.poly)) insideCount++;
        }
        return insideCount >= 3;
    }

    _clampWallGrid(p, x, y) {
        const sz = this.getWallSize(p.item_id);
        const w = sz.w || 1, h = sz.h || 1;
        const isPlay = document.body.classList.contains('play-mode');
        const isGrid = document.body.classList.contains('grid-mode');
        
        if (window.mapsAtlas && (isPlay || isGrid)) {
            const locVal = document.getElementById('select-location')?.value;
            const targetLoc = p.cluster != null ? p.cluster : (locVal !== '' && locVal != null ? parseInt(locVal, 10) : 0);
            const surf = this.surfaceFor(targetLoc, p.floor, true, p.flipped);
            if (surf) {
                const maxCols = surf.cols || 16;
                const maxRows = surf.rows || 16;
                const cx = Math.max(0, Math.min(maxCols - w, x));
                const cy = Math.max(0, Math.min(maxRows - h, y));
                if (surf.poly && surf.poly.length > 2) {
                    if (this._isWallCellInSurfacePoly(surf, cx, cy, w, h)) {
                        return { x: cx, y: cy };
                    }
                    const last = this._dragSnap || { x: p.x, y: p.y };
                    if (this._isWallCellInSurfacePoly(surf, cx, last.y, w, h)) {
                        return { x: cx, y: last.y };
                    }
                    if (this._isWallCellInSurfacePoly(surf, last.x, cy, w, h)) {
                        return { x: last.x, y: cy };
                    }
                    if (this._isWallCellInSurfacePoly(surf, last.x, last.y, w, h)) {
                        return { x: last.x, y: last.y };
                    }
                }
                return { x: cx, y: cy };
            }
        }

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
            this._drawDiamondPath(x, y, w, l, 0, p.floor);
            this.ctx.fill();
            this.ctx.stroke();
        }
        this.ctx.restore();
    }


    _hitTestPlaySurface(screenX, screenY, preferredKind = null) {
        if (!window.mapsAtlas) return null;
        if (!document.body.classList.contains('play-mode')) return null;
        const sel = document.getElementById('select-location');
        const targetLoc = sel && sel.value !== "" ? parseInt(sel.value, 10) : 0;

        const showHC = (() => {
            try { if (window.Flags) return window.Flags.get('homecomingUpdates') === 1; } catch(e) {}
            if (this.app && this.app.parser && this.app.parser.generalVars && this.app.parser.generalVars.homecomingUpdates) return this.app.parser.generalVars.homecomingUpdates.value === 1;
            if (this.app && this.app.parser && typeof this.app.parser.getHomeCurrSLocData === 'function') return this.app.parser.getHomeCurrSLocData() === 1;
            return false;
        })();

        // Infer preferredKind if not explicitly given
        if (!preferredKind) {
            if (this.draggedInventoryItem && this.draggedInventoryItem.item_id) {
                const isW = this.isWallFurniture(this.draggedInventoryItem.item_id);
                const isC = this.isCovering(this.draggedInventoryItem.item_id);
                preferredKind = (isW || isC === 'wallpaper') ? 'wall' : 'floor';
            } else if (this.selectedPlacement) {
                preferredKind = this.selectedPlacement.isWall ? 'wall' : 'floor';
            }
        }

        const floorOrder = [4, 1, 0, 2, 3];

        const testFloor = (g) => {
            const surf = this.surfaceFor(targetLoc, g, false, false);
            if (!surf) return null;
            const _bgo = (window.atlasConfig && window.atlasConfig.bgScale ? window.atlasConfig.bgScale : 0.75);
            const u = _bgo * this.scale;
            let ox = 0, oy = 0;
            if (surf.origin) {
                ox = surf.origin.x;
                oy = surf.origin.y;
            } else if (surf.origin_px) {
                ox = (surf.origin_px.x - 1235) / 150;
                oy = (1257 - surf.origin_px.y) / 150;
            }
            const cw_u = ((surf.cell && surf.cell.w) || 58) / 150;
            const ch_u = ((surf.cell && surf.cell.h) || 28) / 150;

            const worldX = (screenX - this.offsetX) / (150 * u);
            const worldY = (this.offsetY - screenY) / (150 * u);
            const wx = worldX - ox;
            const wy = worldY - oy;
            const U = wx / (cw_u / 2);
            const V = -wy / (ch_u / 2);
            const cx = (U + V) / 2;
            const cy = (V - U) / 2;
            const gridX = Math.round(cx);
            const gridY = Math.round(cy);

            let isInside = false;
            if (surf.poly && surf.poly.length > 2) {
                isInside = this._pointInPoly(wx, wy, surf.poly);
            } else {
                const cols = surf.cols || 16;
                const rows = surf.rows || 16;
                isInside = (gridX >= 0 && gridX < cols && gridY >= 0 && gridY < rows);
            }

            if (isInside) {
                return {
                    kind: 'floor',
                    floorNum: g,
                    x: gridX,
                    y: gridY,
                    rawX: cx,
                    rawY: cy,
                    surf: surf
                };
            }
            return null;
        };

        const testWall = (g) => {
            const walls = window.mapsAtlas.filter(s => s.kind === 'wall' && Number(s.groupNum) === g && String(s.mapId) === String(targetLoc));
            for (let wSurf of walls) {
                const isFlipped = !!wSurf.flipped;
                const dummyBbox = this._wallRoomBBox || { xmin: 0, ymin: 0, xmax: 16, ymax: 16 };
                const wCoords = this.screenToWallGrid(screenX, screenY, isFlipped, dummyBbox, g, targetLoc);
                const wx = wCoords.x;
                const wy = wCoords.y;
                const cols = wSurf.cols || 16;
                const rows = wSurf.rows || 16;
                if (wx >= -0.25 && wx <= cols + 0.25 && wy >= -0.25 && wy <= rows + 0.25) {
                    const cw_u = ((wSurf.cell && wSurf.cell.w) || 58) / 150;
                    const ch_u = ((wSurf.cell && wSurf.cell.h) || 28) / 150;
                    const relX = wx * (cw_u / 2);
                    const relY = - wx * (ch_u / 2) - wy * ch_u;
                    if (wSurf.poly && wSurf.poly.length > 2) {
                        if (!this._pointInPoly(relX, relY, wSurf.poly)) continue;
                    }
                    return {
                        kind: 'wall',
                        floorNum: g,
                        x: Math.max(0, Math.min(cols, Math.round(wx))),
                        y: Math.max(0, Math.min(rows, Math.round(wy))),
                        rawX: wx,
                        rawY: wy,
                        flipped: isFlipped,
                        surf: wSurf
                    };
                }
            }
            return null;
        };

        if (preferredKind === 'floor') {
            for (const g of floorOrder) {
                if (g === 4 && !showHC) continue;
                const hit = testFloor(g);
                if (hit) return hit;
            }
            return null;
        }

        if (preferredKind === 'wall') {
            for (const g of floorOrder) {
                if (g === 4 && !showHC) continue;
                const hit = testWall(g);
                if (hit) return hit;
            }
            return null;
        }

        // Neutral: prioritize floors, then walls
        for (const g of floorOrder) {
            if (g === 4 && !showHC) continue;
            const fHit = testFloor(g);
            if (fHit) return fHit;
            const wHit = testWall(g);
            if (wHit) return wHit;
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
        const targetLoc = targetLocStr !== undefined && targetLocStr !== "" ? parseInt(targetLocStr, 10) : 0;
        
        for (const p of this.app.parser.placements) {
            if (p.cluster !== targetLoc || p.isWall || p.item_id === -1) continue;
            if (Number(p.floor) !== Number(floor)) continue;
            if (p === this.isItemDragging || (this.isItemDragging && p === this.selectedPlacement)) continue; // Si estamos arrastrando uno existente
            
            const sz = this.getRotatedSize(p.item_id, p.orientation);
            // Footprint de p: p.x hasta p.x + sz.w, p.y hasta p.y + sz.l
            // Footprint de arrastre: x hasta x + w, y hasta y + l
            if (x < p.x + sz.w && x + w > p.x && y < p.y + sz.l && y + l > p.y) {
                return true;
            }
        }
        return false;
    }

    // P4 / CastleGrid integration: find the nearest free placement footprint using spiral search
    findNearestFreeSpot(floor, startX, startY, w, l, maxRings = 15) {
        if (!this._isAreaOccupied(floor, startX, startY, w, l)) {
            return { x: startX, y: startY };
        }
        if (!window.Castle || !window.Castle.Grid) return null;
        const total = (2 * maxRings + 1) * (2 * maxRings + 1);
        for (let i = 1; i < total; i++) {
            const offset = window.Castle.Grid.spiral(i);
            const candX = startX + offset.x;
            const candY = startY + offset.y;
            if (!this._isAreaOccupied(floor, candX, candY, w, l)) {
                return { x: candX, y: candY };
            }
        }
        return null;
    }

    // P4 / CastleGrid integration: get exterior perimeter grids around placed furniture
    getFurniturePerimeter(placement) {
        if (!placement) return [];
        const sz = this.getRotatedSize(placement.item_id, placement.orientation || 0);
        if (window.Castle && window.Castle.Grid) {
            return window.Castle.Grid.getGridsAround({ x: placement.x, y: placement.y }, sz.w, sz.l);
        }
        return [];
    }

    // P4 / CastleGrid integration: Bresenham line between two grid cells
    getGridLine(startX, startY, endX, endY) {
        if (window.Castle && window.Castle.Grid) {
            const diff = window.Castle.Grid.subtract({ x: endX, y: endY }, { x: startX, y: startY });
            const relLine = window.Castle.Grid.line(diff);
            return relLine.map(pt => ({ x: startX + pt.x, y: startY + pt.y }));
        }
        return [{ x: startX, y: startY }, { x: endX, y: endY }];
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
            let hit = this._pointInPoly(screenX, screenY, pts);
            if (!hit) {
                const img = this.getImage(p.item_id, 0);
                if (img && img.complete && img.naturalWidth > 0) {
                    const pt = this.getWallIsoCoords(p.x, p.y, f, bbox, p.floor);
                    const _bgo = (window.atlasConfig && window.atlasConfig.bgScale ? window.atlasConfig.bgScale : 0.75);
                    const u = _bgo * this.scale;
                    const dw = img.width * u;
                    const dh = img.height * u;
                    const pivot = this._resolveSpritePivot(p.item_id, img, p.orientation || 0) || { x: 0.5, y: 0.5 };
                    const left = pt.x - dw * pivot.x;
                    const top = pt.y - dh * (1 - pivot.y);
                    if (screenX >= left && screenX <= left + dw && screenY >= top && screenY <= top + dh) {
                        hit = true;
                    }
                }
            }
            if (hit) found.push(p);
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
        this._clampCamera();
        if (this._rafId !== undefined) return;
        this._rafId = requestAnimationFrame(() => {
            this._rafId = undefined;
            this._drawImmediate();
        });
    }

    _clampCamera() {
        if (!document.body.classList.contains('play-mode')) return;

        if (!this._bgCache) return;
        let bgImg = null;
        for (let k in this._bgCache) {
            if (k.includes('level') && this._bgCache[k] && this._bgCache[k].width > 0) {
                bgImg = this._bgCache[k];
                break;
            }
        }
        if (!bgImg) return;
        
        const bgScale = (window.atlasConfig && window.atlasConfig.bgScale) || 0.75;
        const cw = this.canvas.width;
        const ch = this.canvas.height;
        
        const bgW = bgImg.width * bgScale;
        const bgH = bgImg.height * bgScale;
        
        // Tsuki Odyssey: Permitimos ver la casa entera sin cortes.
        // targetScale usa Math.min para asegurar que SIEMPRE quepa en pantalla,
        // logrando exactamente lo que se ve en la captura del usuario (casa completa).
        let targetScale = Math.min(cw / bgW, ch / bgH);
        
        // Añadimos un poco más de zoom base (1.15x del mínimo) como pidió el usuario
        targetScale = targetScale * 1.15;
        
        // Restringimos el zoom severamente: no zoom out, solo un poco de zoom in (hasta 1.3x).
        this.scale = Math.max(targetScale, Math.min(this.scale, targetScale * 1.3));
        
        const drawnW = bgW * this.scale;
        const drawnH = bgH * this.scale;
        
        // Clampeamos el paneo al 10% (0.1) como pidió el usuario.
        // Usamos min/max dinámicos para centrar si la imagen es pequeña,
        // pero manteniendo el margen de 10% de tope.
        // Mantener el centro (0, 0) del nivel dentro de la vista con margen cómodo
        const maxPanX = drawnW * 0.35;
        const maxPanY = drawnH * 0.35;
        const defaultCenterX = cw / 2;
        const defaultCenterY = ch / 2;
        this.offsetX = Math.max(defaultCenterX - maxPanX, Math.min(this.offsetX, defaultCenterX + maxPanX));
        this.offsetY = Math.max(defaultCenterY - maxPanY, Math.min(this.offsetY, defaultCenterY + maxPanY));
    }

    _drawImmediate() {
        if (!this.app || !this.app.parser || !this.app.parser.placements) return;
        this._cellColocationGroups = null;

        const ctx = this.ctx;
        const targetLocStr = document.getElementById('select-location')?.value;
        const targetLoc = targetLocStr !== undefined && targetLocStr !== "" ? parseInt(targetLocStr, 10) : 0;
        
        let visibleFloors = [document.getElementById('select-floor')?.value || '0'];
        let isPlay = document.body.classList.contains('play-mode');
        let isGrid = document.body.classList.contains('grid-mode');
        let bgActive = (isPlay || isGrid) && targetLoc === 0;

        if (bgActive) {
            ctx.fillStyle = '#c1cba6';
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        } else {
            ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
        
        if (isPlay) {
            // B: visible = floors del atlas para ese mapId, respetar homecoming_only
            const allFloors = (window.mapsAtlas || []).filter(s => String(s.mapId) === String(targetLoc) && s.kind === 'floor');
            const showHC = (() => {
                try { if (window.Flags) return window.Flags.get('homecomingUpdates') === 1; } catch(e) {}
                if (this.app && this.app.parser && this.app.parser.generalVars && this.app.parser.generalVars.homecomingUpdates) return this.app.parser.generalVars.homecomingUpdates.value === 1;
                if (this.app && this.app.parser && typeof this.app.parser.getHomeCurrSLocData === 'function') return this.app.parser.getHomeCurrSLocData() === 1;
                return false;
            })();
            visibleFloors = allFloors.filter(s => {
                if ((s.homecoming_only || s.groupNum === 4) && !showHC) return false;
                return true;
            }).map(s => String(s.groupNum));
            if (visibleFloors.length === 0) visibleFloors = ['0', '1', '2', '3'];
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

            if ((isPlay || isGrid) && window.mapsAtlas) {
            // 1, 2, 3: BAKED BACKGROUND (House level2 / Farm level4)
            const targetLoc = document.getElementById('select-location') ? parseInt(document.getElementById('select-location').value) : 0;
            const META2 = (window.MAP_META && window.MAP_META[targetLoc]) || {};
            const bgExportDir2 = META2.exportDir != null ? META2.exportDir : (targetLoc === 0 ? 2 : targetLoc);
            const bgAssembled2 = META2.assembled || ('level' + bgExportDir2 + '_Ensamblado.png');
            const bgPath = '../maps/Exportado_level' + bgExportDir2 + '/' + bgAssembled2;
            const bgImg = this.getBackgroundImage(bgPath);
            
            const grassPath = '../maps/Exportado_level2/SpringGrass.png';
            const grassImg = (targetLoc === 0) ? this.getBackgroundImage(grassPath) : null;
            const grassLoaded = (!grassImg || (grassImg.complete && grassImg.width > 0)) ? '1' : '0';
            
            // Only bake if bgImg is loaded and we haven't baked this combination yet
            const wpDict = this.app.parser && this.app.parser.wallpapers;
            const floorDict = this.app.parser && this.app.parser.floors;
            const wpStr = wpDict && wpDict[targetLoc] ? wpDict[targetLoc].map(x => x.id).join(',') : '';
            const flStr = floorDict && floorDict[targetLoc] ? floorDict[targetLoc].map(x => x.id).join(',') : '';
            const atlasCount = (window.mapsAtlas || []).filter(s => String(s.mapId) === String(targetLoc)).length;
            const bakeKey = targetLoc + '_' + wpStr + '_' + flStr + '_' + atlasCount + '_g' + grassLoaded;
            
            if (bgImg && bgImg.complete && bgImg.width > 0) {
                // En level2 (árbol), el centro (0, 0) de Unity está en el píxel (1235, 1257) de la imagen ensamblada
                const originPxX = (targetLoc === 0 ? 1235 : bgImg.width / 2);
                const originPxY = (targetLoc === 0 ? 1257 : bgImg.height / 2);

                if (!this._bakedBgCanvas || this._bakedBgKey !== bakeKey) {
                    // Bake the background to a temporary offscreen canvas
                    const tempBaked = document.createElement('canvas');
                    tempBaked.width = bgImg.width;
                    tempBaked.height = bgImg.height;
                    const bCtx = tempBaked.getContext('2d');
                    
                    let allLoaded = true;

                    // Fill background with spring grass pattern for Treehouse (level2)
                    if (targetLoc === 0) {
                        if (grassImg && grassImg.complete && grassImg.width > 0) {
                            const grassPattern = bCtx.createPattern(grassImg, 'repeat');
                            if (grassPattern) {
                                bCtx.fillStyle = grassPattern;
                                bCtx.fillRect(0, 0, tempBaked.width, tempBaked.height);
                            }
                        } else {
                            allLoaded = false;
                        }
                    }
                    if (!this._sceneFullCache) this._sceneFullCache = {};
                    if (this._sceneFullCache[targetLoc] === undefined) {
                        if (location.protocol === 'file:') { this._sceneFullCache[targetLoc]=null; }
                        else {
                            const META = (window.MAP_META && window.MAP_META[targetLoc]) || {};
                            let exportDir = META.exportDir != null ? META.exportDir : (targetLoc === 0 ? 2 : targetLoc);
                            fetch(`data/maps/map_${targetLoc}.json`).then(r=>r.ok?r.json():null).then(unifiedMap=>{
                                if(unifiedMap){
                                    this._sceneFullCache[targetLoc]=unifiedMap;
                                    if(unifiedMap.surfaces && unifiedMap.surfaces.length){
                                        if(!window.mapsAtlas) window.mapsAtlas=[];
                                        unifiedMap.surfaces.forEach(s=>{
                                            const isFloor = s.kind==='floor';
                                            const existing = window.mapsAtlas.find(a=>String(a.mapId)===String(targetLoc) && String(a.groupNum)===String(s.groupNum) && a.kind===s.kind && (isFloor || !!a.flipped===!!s.flipped));
                                            let originPx = s.origin_px;
                                            if (!originPx || (Math.abs(originPx.x) < 500 && Math.abs(originPx.y) < 500)) {
                                                if (existing && existing.origin_px && Math.abs(existing.origin_px.x) > 500) {
                                                    originPx = { ...existing.origin_px };
                                                } else if (s.origin) {
                                                    originPx = {
                                                        x: 1235 + s.origin.x * 150,
                                                        y: 1257 - s.origin.y * 150
                                                    };
                                                }
                                            }
                                            const originUnity = s.origin || (originPx ? { x: (originPx.x - 1235) / 150, y: (1257 - originPx.y) / 150 } : { x: 0, y: 0 });
                                            const atlasEntry = {
                                                mapId: targetLoc,
                                                id: s.id,
                                                name: s.name,
                                                kind: s.kind,
                                                groupNum: s.groupNum,
                                                flipped: !!s.flipped,
                                                rows: s.rows || 16,
                                                cols: s.cols || 16,
                                                cell: s.cell || { w: 58, h: 28 },
                                                origin: originUnity,
                                                origin_px: originPx,
                                                defaultCoverId: s.defaultCoverId !== undefined ? s.defaultCoverId : (existing ? existing.defaultCoverId : null),
                                                poly: s.poly || [],
                                                mask: s.mask || (existing ? existing.mask : null),
                                                anchorID: s.anchorID != null ? s.anchorID : (existing ? existing.anchorID : null)
                                            };
                                            if(existing) Object.assign(existing, atlasEntry);
                                            else window.mapsAtlas.push(atlasEntry);
                                        });
                                    }
                                    this._bakedBgKey = null;
                                    this.draw();
                                } else {
                                    fetch(`images/maps/Exportado_level${exportDir}/scene_full.json`).then(r=>r.ok?r.json():null).then(j=>{ this._sceneFullCache[targetLoc]=j; this._bakedBgKey = null; if(j) this.draw(); }).catch(()=>{ this._sceneFullCache[targetLoc]=null; });
                                }
                            }).catch(()=>{
                                fetch(`images/maps/Exportado_level${exportDir}/scene_full.json`).then(r=>r.ok?r.json():null).then(j=>{ this._sceneFullCache[targetLoc]=j; this._bakedBgKey = null; if(j) this.draw(); }).catch(()=>{ this._sceneFullCache[targetLoc]=null; });
                            });
                            this._sceneFullCache[targetLoc]=null;
                        }
                    }

                    // Draw floors and wallpapers behind the treehouse structure
                    const drawSurfaceCovering = (surf) => {
                        if (!surf) return;
                        const isFloor = surf.kind === 'floor';
                        const coverId = this.getSurfaceCoveringId(surf, targetLoc);
                        if (!coverId || coverId <= 0) return;

                        const tex = this._getTilesetTexture(isFloor ? 'floor' : 'wall', coverId);
                        if (!tex || !tex.img || !tex.img.complete || tex.img.width === 0) {
                            allLoaded = false;
                            return;
                        }

                        // Determine mask image cleanly
                        let maskImg = null;
                        if (surf.mask) {
                            maskImg = this._getMaskByName(surf.mask, targetLoc);
                        } else if (isFloor) {
                            maskImg = this._getMaskByName(`mask_floor_${surf.groupNum}.png`, targetLoc);
                        } else {
                            maskImg = this._getMaskByName(`mask_wall${surf.flipped ? 'L' : 'R'}_${surf.groupNum}.png`, targetLoc);
                        }

                        const hasMask = (maskImg && maskImg.complete && maskImg.width > 0);
                        if (!hasMask && maskImg === false) {
                            allLoaded = false;
                        }

                        // Scratch canvas for pattern masking
                        if (!this._maskScratchCanvas) {
                            this._maskScratchCanvas = document.createElement('canvas');
                        }
                        if (this._maskScratchCanvas.width !== bgImg.width || this._maskScratchCanvas.height !== bgImg.height) {
                            this._maskScratchCanvas.width = bgImg.width;
                            this._maskScratchCanvas.height = bgImg.height;
                        }
                        const mCtx = this._maskScratchCanvas.getContext('2d');
                        mCtx.globalCompositeOperation = 'source-over';
                        mCtx.clearRect(0, 0, bgImg.width, bgImg.height);

                        // Fill with pattern directly (image already has perspective)
                        const pat = mCtx.createPattern(tex.img, 'repeat');
                        mCtx.fillStyle = pat;
                        mCtx.fillRect(0, 0, bgImg.width, bgImg.height);

                        if (hasMask) {
                            mCtx.globalCompositeOperation = 'destination-in';
                            mCtx.drawImage(maskImg, 0, 0, bgImg.width, bgImg.height);
                            bCtx.globalCompositeOperation = 'source-over';
                            bCtx.drawImage(this._maskScratchCanvas, 0, 0);
                            mCtx.globalCompositeOperation = 'source-over';
                        } else if (surf.poly && surf.poly.length > 0) {
                            bCtx.save();
                            bCtx.beginPath();
                            const wOx = surf.origin ? surf.origin.x : (surf.origin_px ? (surf.origin_px.x - 1235) / 150 : 0);
                            const wOy = surf.origin ? surf.origin.y : (surf.origin_px ? (1257 - surf.origin_px.y) / 150 : 0);
                            surf.poly.forEach((pt, i) => {
                                const px = (pt.x !== undefined ? pt.x : pt[0]);
                                const py = (pt.y !== undefined ? pt.y : pt[1]);
                                const bx = originPxX + (wOx + px) * 150;
                                const by = originPxY - (wOy + py) * 150;
                                if (i === 0) bCtx.moveTo(bx, by);
                                else bCtx.lineTo(bx, by);
                            });
                            bCtx.closePath();
                            bCtx.clip();
                            bCtx.drawImage(this._maskScratchCanvas, 0, 0);
                            bCtx.restore();
                        }
                    };

                    const currentSurfaces = (window.mapsAtlas || []).filter(s => String(s.mapId) === String(targetLoc));
                    // Draw floors first, then walls
                    currentSurfaces.filter(s => s.kind === 'floor').forEach(s => drawSurfaceCovering(s));
                    currentSurfaces.filter(s => s.kind === 'wall').forEach(s => drawSurfaceCovering(s));
                    
                    // Draw base treehouse OVER the floors and walls!
                    bCtx.globalCompositeOperation = 'source-over';
                    bCtx.drawImage(bgImg, 0, 0);

                    this._bakedBgCanvas = tempBaked;
                    if (allLoaded) {
                        this._bakedBgKey = bakeKey;
                    }
                }
                
                // Draw the baked background directly to screen centered on (0, 0)
                const bgScale = _bgo;
                const s = bgScale * this.scale;
                const drawW = this._bakedBgCanvas.width * s;
                const drawH = this._bakedBgCanvas.height * s;
                const dx = this.offsetX - originPxX * s;
                const dy = this.offsetY - originPxY * s;
                
                ctx.drawImage(this._bakedBgCanvas, dx, dy, drawW, drawH);
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
                    ? window.mapsAtlas.filter(s => visibleFloors.includes(String(s.groupNum)) && String(s.mapId) === String(targetLoc))
                    : [window.mapsAtlas[this.app.gridEditor.activeSurfaceIndex]];

                for (const surf of surfaces) {
                    if (!surf) continue;
                    const u = _bgo * this.scale;
                    let worldOx = 0, worldOy = 0;
                    if (surf.origin) {
                        worldOx = surf.origin.x;
                        worldOy = surf.origin.y;
                    } else if (surf.origin_px) {
                        worldOx = (surf.origin_px.x - 1235) / 150;
                        worldOy = (1257 - surf.origin_px.y) / 150;
                    }
                    const sScreenX = this.offsetX + worldOx * 150 * u;
                    const sScreenY = this.offsetY - worldOy * 150 * u;
                    const isFloor = surf.kind === 'floor';
                    const poly = surf.poly || [];

                    ctx.save();
                    ctx.translate(sScreenX, sScreenY);

                    // 1. Polígono de la superficie con fondo traslúcido y contorno
                    if (poly && poly.length > 0) {
                        ctx.beginPath();
                        poly.forEach((pt, i) => {
                            const px = (pt.x !== undefined ? pt.x : pt[0]) * 150 * u;
                            const py = -(pt.y !== undefined ? pt.y : pt[1]) * 150 * u;
                            if (i === 0) ctx.moveTo(px, py);
                            else ctx.lineTo(px, py);
                        });
                        ctx.closePath();

                        ctx.fillStyle = isFloor ? 'rgba(0, 255, 120, 0.20)' : (surf.flipped ? 'rgba(255, 100, 100, 0.15)' : 'rgba(100, 180, 255, 0.15)');
                        ctx.strokeStyle = isFloor ? 'rgba(0, 255, 120, 0.75)' : (surf.flipped ? 'rgba(255, 100, 100, 0.75)' : 'rgba(100, 180, 255, 0.75)');
                        ctx.lineWidth = 1.5;
                        ctx.fill();
                        ctx.stroke();

                        // 2. RECORTAR dentro de la superficie (idéntico a map_editor_2.html)
                        ctx.clip();
                    }

                    // 3. Grilla isométrica calibrada y optimizada (renderizado por lotes)
                    const cols = Math.max(16, surf.cols || 16);
                    const rows = Math.max(16, surf.rows || 16);
                    const cw_u = ((surf.cell && surf.cell.w) || 58) / 150;
                    const ch_u = ((surf.cell && surf.cell.h) || 28) / 150;
                    const halfW = (cw_u / 2) * 150 * u;
                    const halfH = (ch_u / 2) * 150 * u;

                    const minGx = -cols;
                    const maxGx = cols * 2;
                    const minGy = -rows;
                    const maxGy = rows * 2;

                    ctx.lineWidth = 1;
                    if (isFloor) {
                        ctx.strokeStyle = 'rgba(0, 255, 120, 0.45)';
                        ctx.beginPath();
                        for (let gx = minGx; gx <= maxGx; gx++) {
                            ctx.moveTo((gx - minGy) * halfW, (gx + minGy) * halfH);
                            ctx.lineTo((gx - maxGy) * halfW, (gx + maxGy) * halfH);
                        }
                        for (let gy = minGy; gy <= maxGy; gy++) {
                            ctx.moveTo((minGx - gy) * halfW, (minGx + gy) * halfH);
                            ctx.lineTo((maxGx - gy) * halfW, (maxGx + gy) * halfH);
                        }
                        ctx.stroke();
                    } else {
                        ctx.strokeStyle = surf.flipped ? 'rgba(255, 100, 100, 0.45)' : 'rgba(100, 180, 255, 0.45)';
                        const fullH = ch_u * 2 * 150 * u;
                        ctx.beginPath();
                        for (let gx = minGx; gx <= maxGx; gx++) {
                            const ix = (surf.flipped ? -gx : gx) * halfW;
                            const iy = gx * halfH;
                            ctx.moveTo(ix, iy + minGy * fullH);
                            ctx.lineTo(ix, iy + maxGy * fullH);
                        }
                        for (let gy = minGy; gy <= maxGy; gy++) {
                            const iy = gy * fullH;
                            ctx.moveTo((surf.flipped ? -minGx : minGx) * halfW, minGx * halfH + iy);
                            ctx.lineTo((surf.flipped ? -maxGx : maxGx) * halfW, maxGx * halfH + iy);
                        }
                        ctx.stroke();
                    }

                    ctx.restore();
                }
            }

            // ?? 5. WALL ITEMS + FLOOR FURNITURE ??????????????????????????????????????
            if (!isGrid && !isPlay) this._drawIsoWallGrids(targetLoc, targetFloor);

            let itemHash = 0;
            if (this.app.parser.placements) {
                for (const p of this.app.parser.placements) {
                    if (p.cluster === targetLoc) itemHash += (p.x || 0) + (p.y || 0) + (p.item_id || 0) + (p.floor || 0) + (p.flipped ? 1 : 0) + (p.orientation || 0);
                }
            }
            const cacheKey = this.app.parser.placements.length + '_' + targetLoc + '_' + targetFloor + '_' + visibleFloors.join(',') + '_' + isPlay + '_' + isGrid + '_' + itemHash;
            if (!this._renderCache || this._renderCache.key !== cacheKey || this.isItemDragging) {
                // D: paredes usan surface wall del mismo groupNum, no filtrar por visibleFloors de piso
                const allWalls = this.app.parser.placements.filter(
                    p => p.cluster === targetLoc && p.isWall && p.item_id !== -1 && !this.isCovering(p.item_id)
                );
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
                    const z = (a.x + a.y) - (b.x + b.y);
                    if (z) return z;
                    const la = (this._stackInfo.get(a) || {}).lift || 0;
                    const lb = (this._stackInfo.get(b) || {}).lift || 0;
                    return la - lb;
                };
                ground.sort(sortByZ);
                seeds.sort(sortByZ);
                regular.sort(sortByZ);
                this._renderCache = { key: cacheKey, allWalls, ground, seeds, regular, stackInfo: this._stackInfo };
            }
            const { allWalls, ground, seeds, regular, stackInfo } = this._renderCache;
            this._stackInfo = stackInfo;

            for (const p of ground)  this._drawPlacement(p, 'ground');
            for (const p of seeds)   this._drawPlacement(p, 'seed');
            for (const p of regular) this._drawPlacement(p, 'regular');
            for (const p of allWalls) this._drawWallPlacementIso(p);
            const dragGhost = (this.isItemDragging && this.selectedPlacement) ? this.selectedPlacement : (typeof this.isItemDragging === 'object' ? this.isItemDragging : null);
            if (dragGhost) {
                this._drawSnapGhost(dragGhost);
                if (typeof this.isItemDragging === 'object' && this.isItemDragging && this.isItemDragging.item_id) {
                    this.ctx.save();
                    this.ctx.globalAlpha = 0.75;
                    if (this.isItemDragging.isWall) {
                        this._drawWallPlacementIso(this.isItemDragging);
                    } else if (!this.isCovering(this.isItemDragging.item_id)) {
                        this._drawPlacement(this.isItemDragging, 'regular');
                    }
                    this.ctx.restore();
                }
            }
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

        if (document.body.classList.contains('play-mode') && window.Lighting && typeof window.Lighting.renderHalos === 'function') {
            window.Lighting.renderHalos(null, targetLoc);
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


    _drawWallPlacementIso(p) {
        const img = this.getImage(p.item_id, 0, p);
        if (!img || !img.complete || img.naturalWidth <= 0) return;
        
        const bbox = this._wallRoomBBox || { xmin: 0, ymin: 0, xmax: 16, ymax: 16 };
        // getWallIsoCoords returns screen coords including scale/offset
        const pt = this.getWallIsoCoords(p.x, p.y, p.flipped, bbox, p.floor);
        
        // Frustum Culling
        const pad = Math.max(500, 300 * this.scale);
        if (pt.x < -pad || pt.x > this.canvas.width + pad || pt.y < -pad || pt.y > this.canvas.height + pad) {
            return;
        }
        
        // sz in grid units
        const sz = this.getWallSize(p.item_id);
        const cellW = this.CELL_W;
        const cellH = this.CELL_H;
        
        const isSel = (this.selectedPlacement === p);
        const isHov = (this.hoveredPlacement === p);
        
        this.ctx.save();
        
        const _bgo = (window.atlasConfig && window.atlasConfig.bgScale ? window.atlasConfig.bgScale : 0.75);
        const u = _bgo * this.scale;
        const dw = img.width * u;
        const dh = img.height * u;
        const pivot = this._resolveSpritePivot(p.item_id, img, p.orientation || 0) || { x: 0.5, y: 0.5 };
        
        if (isSel) {
            this.ctx.shadowColor = 'white';
            this.ctx.shadowBlur = 10;
        } else if (isHov) {
            this.ctx.shadowColor = 'orange';
            this.ctx.shadowBlur = 8;
        }

        if (p.flipped) {
            this.ctx.translate(pt.x, 0);
            this.ctx.scale(-1, 1);
            this.ctx.translate(-pt.x, 0);
        }
        
        this.ctx.drawImage(img, pt.x - dw * pivot.x, pt.y - dh * (1 - pivot.y), dw, dh);
        this.ctx.restore();
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
        
        // Frustum Culling (Camera Viewport)
        const center = this._tileCenter(p.x, p.y, w, l, p.floor);
        const pad = Math.max(500, 300 * this.scale);
        if (center.x < -pad || center.x > this.canvas.width + pad || center.y < -pad || center.y > this.canvas.height + pad) {
            return;
        }

        const stack = (this._stackInfo && this._stackInfo.get(p)) || null;
        const lift = stack ? stack.lift : 0;

        const isHovered  = p === this.hoveredPlacement;
        const isSelected = p === this.selectedPlacement;

        ctx.save();
        if (lift) ctx.translate(0, -lift * this.CELL_H * this.scale);
        const off = this._getPlacementRenderOffset(p);
        if (off.x || off.y) ctx.translate(off.x, off.y);
        
        // Draw grid footprint if in play mode and hammer mode
        if (document.body.classList.contains('play-mode') && this.app.tsukiPort && this.app.tsukiPort.isHammerMode && !p.isWall && (this.app.tsukiPort.showGrid || isSelected)) {
            const pt1 = this.getIsoCoords(p.x, p.y, p.floor);
            const pt2 = this.getIsoCoords(p.x + w, p.y, p.floor);
            const pt3 = this.getIsoCoords(p.x + w, p.y + l, p.floor);
            const pt4 = this.getIsoCoords(p.x, p.y + l, p.floor);
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(pt1.x, pt1.y);
            ctx.lineTo(pt2.x, pt2.y);
            ctx.lineTo(pt3.x, pt3.y);
            ctx.lineTo(pt4.x, pt4.y);
            ctx.closePath();
            if (isSelected) {
                // Highlighted selection: gentle cyan/blue footprint, not alarming red
                ctx.fillStyle = 'rgba(66, 165, 245, 0.45)';
                ctx.fill();
                ctx.strokeStyle = '#2196f3';
                ctx.lineWidth = 2.5 * this.scale;
                ctx.stroke();
            } else {
                ctx.fillStyle = 'rgba(120, 200, 255, 0.2)';
                ctx.fill();
                ctx.strokeStyle = 'rgba(120, 200, 255, 0.8)';
                ctx.lineWidth = 1.5 * this.scale;
                ctx.stroke();
            }
            ctx.restore();
        }

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
        if (document.body.classList.contains('play-mode') && layer !== 'ground') {
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
        const center = this._tileCenter(gx, gy, w, l, floorNum);
        
        const _bgo = (window.atlasConfig && window.atlasConfig.bgScale ? window.atlasConfig.bgScale : 0.75);
        const u = _bgo * this.scale;
        const drawW = img.width * u;
        const drawH = img.height * u;

        ctx.save();
        
        // ── Rotation transformations ──
        // 0: SE (Front Right, eje w,l)
        // 1: SW (Front Left, Reflejado horizontalmente, eje l,w)
        // 2: NW (Back Left, Sprite Back o frontal oscurecido, eje w,l)
        // 3: NE (Back Right, Reflejado horizontalmente, eje l,w)
        
        const oriNum = Number(orientation);
        const flipH = (oriNum === 1 || oriNum === 3);
        const darken = (oriNum === 2 || oriNum === 3);
        
        const anchorX = center.x;
        const anchorY = center.y;
        const pivot = this._resolveSpritePivot(item_id, img, orientation);
        const pivotX = pivot.x;
        const pivotY = pivot.y;

        if (flipH) {
            ctx.translate(anchorX, 0);
            ctx.scale(-1, 1);
            ctx.translate(-anchorX, 0);
        }

        if (darken) {
            ctx.filter = "brightness(0.75)";
        }

        ctx.drawImage(img,
            anchorX - (drawW * pivotX),
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
            center = this._tileCenter(p.x, p.y, w, l, p.floor);
            const off = this._getPlacementRenderOffset(p);
            center.x += off.x;
            center.y += off.y;
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
    _findPlacementAtScreen(screenX, screenY, allowPlayWithoutHammer = false) {
        if (!this.app || !this.app.parser || !this.app.parser.placements) return null;

        const isPlay = document.body.classList.contains('play-mode');
        const isHammer = this.app.tsukiPort && this.app.tsukiPort.isHammerMode;
        if (isPlay && !isHammer && !allowPlayWithoutHammer) return null;

        const locVal = document.getElementById('select-location')?.value;
        const targetLoc = locVal !== "" && locVal != null ? parseInt(locVal, 10) : 0;

        const layerRadio = document.querySelector('input[name="map-layer"]:checked');
        const isWallLayer = !isPlay && layerRadio && layerRadio.value === 'wall';

        let visibleFloors = ['0', '1', '2', '3'];
        if (isPlay) {
            if (window.mapsAtlas) {
                const allFloors = window.mapsAtlas.filter(s => s.kind === 'floor' && String(s.mapId) === String(targetLoc));
                const showHC = (() => {
                    try { if (window.Flags) return window.Flags.get('homecomingUpdates') === 1; } catch(e) {}
                    if (this.app && this.app.parser && this.app.parser.generalVars && this.app.parser.generalVars.homecomingUpdates) return this.app.parser.generalVars.homecomingUpdates.value === 1;
                    if (this.app && this.app.parser && typeof this.app.parser.getHomeCurrSLocData === 'function') return this.app.parser.getHomeCurrSLocData() === 1;
                    return false;
                })();
                const vf = allFloors.filter(s => !((s.homecoming_only || s.groupNum === 4) && !showHC)).map(s => String(s.groupNum));
                if (vf.length > 0) visibleFloors = vf;
            }
        } else {
            visibleFloors = [document.getElementById('select-floor')?.value || '0'];
        }

        const _bgo = (window.atlasConfig && window.atlasConfig.bgScale ? window.atlasConfig.bgScale : 0.75);
        const u = _bgo * this.scale;
        const bbox = this._wallRoomBBox || { xmin: 0, ymin: 0, xmax: 16, ymax: 16 };

        const candidates = [];

        for (let i = 0; i < this.app.parser.placements.length; i++) {
            const p = this.app.parser.placements[i];
            if (p.cluster !== targetLoc || p.item_id === -1 || this.isCovering(p.item_id)) continue;

            if (p.isWall) {
                if (isWallLayer) {
                    let targetWallGroup = document.getElementById('select-wall-group')?.value || '0';
                    if (String(p.floor) !== String(targetWallGroup)) continue;
                    const sz = this.getWallSize(p.item_id);
                    const gx = 100 + p.x * this.gridSize;
                    const gy = 100 + p.y * this.gridSize;
                    const gw = sz.w * this.gridSize;
                    const gh = sz.h * this.gridSize;
                    if (screenX >= gx && screenX <= gx + gw && screenY >= gy && screenY <= gy + gh) {
                        candidates.push({ placement: p, score: 1000 + i });
                    }
                    continue;
                }

                // Isometric wall item
                if (visibleFloors && !visibleFloors.includes(String(p.floor))) continue;

                const f = !!p.flipped;
                const pt = this.getWallIsoCoords(p.x, p.y, f, bbox, p.floor);
                let hit = false;

                const img = this.getImage(p.item_id, 0);
                if (img && img.complete && img.naturalWidth > 0) {
                    const dw = img.width * u;
                    const dh = img.height * u;
                    const pivot = this._resolveSpritePivot(p.item_id, img, 0) || { x: 0.5, y: 0.5 };
                    const pivotX = f ? (1 - pivot.x) : pivot.x;
                    const pivotY = pivot.y;

                    const left = pt.x - dw * pivotX;
                    const top = pt.y - dh * (1 - pivotY);
                    if (screenX >= left && screenX <= left + dw && screenY >= top && screenY <= top + dh) {
                        hit = true;
                    }
                }

                if (!hit) {
                    const sz = this.getWallSize(p.item_id);
                    const pts = [
                        this.getWallIsoCoords(p.x, p.y, f, bbox, p.floor),
                        this.getWallIsoCoords(p.x + sz.w, p.y, f, bbox, p.floor),
                        this.getWallIsoCoords(p.x + sz.w, p.y + sz.h, f, bbox, p.floor),
                        this.getWallIsoCoords(p.x, p.y + sz.h, f, bbox, p.floor)
                    ];
                    if (this._pointInPoly(screenX, screenY, pts)) {
                        hit = true;
                    }
                }

                if (hit) {
                    const floorNum = Number(p.floor || 0);
                    const score = floorNum * 10000 + 1500 + (p.y || 0) * 10 + (p.x || 0);
                    candidates.push({ placement: p, score });
                }
            } else {
                if (isWallLayer) continue;
                if (visibleFloors && !visibleFloors.includes(String(p.floor))) continue;

                const { w, l } = this.getRotatedSize(p.item_id, p.orientation);
                const stack = (this._stackInfo && this._stackInfo.get(p)) || null;
                const lift = stack ? stack.lift : 0;
                const liftShift = lift * this.CELL_H * this.scale;
                const center = this._tileCenter(p.x, p.y, w, l, p.floor);
                const off = this._getPlacementRenderOffset(p);
                center.x += off.x;
                center.y += off.y;

                let hit = false;
                const img = this.getImage(p.item_id, p.orientation);
                if (img && img.complete && img.naturalWidth > 0) {
                    const drawW = img.width * u;
                    const drawH = img.height * u;
                    const pivot = this._resolveSpritePivot(p.item_id, img, p.orientation || 0) || { x: 0.5, y: 0.5 };
                    const oriNum = Number(p.orientation || 0);
                    const flipH = (oriNum === 1 || oriNum === 3);
                    const pivotX = flipH ? (1 - pivot.x) : pivot.x;
                    const pivotY = pivot.y;

                    const left = center.x - drawW * pivotX;
                    const boxTop = center.y - liftShift - drawH * (1 - pivotY);
                    if (screenX >= left && screenX <= left + drawW && screenY >= boxTop && screenY <= boxTop + drawH) {
                        hit = true;
                    }
                }

                if (!hit) {
                    const pt1 = this.getIsoCoords(p.x, p.y, p.floor);
                    const pt2 = this.getIsoCoords(p.x + w, p.y, p.floor);
                    const pt3 = this.getIsoCoords(p.x + w, p.y + l, p.floor);
                    const pt4 = this.getIsoCoords(p.x, p.y + l, p.floor);
                    if (off.x || off.y) {
                        pt1.x += off.x; pt1.y += off.y;
                        pt2.x += off.x; pt2.y += off.y;
                        pt3.x += off.x; pt3.y += off.y;
                        pt4.x += off.x; pt4.y += off.y;
                    }
                    if (liftShift) {
                        pt1.y -= liftShift; pt2.y -= liftShift; pt3.y -= liftShift; pt4.y -= liftShift;
                    }
                    if (this._pointInPoly(screenX, screenY, [pt1, pt2, pt3, pt4])) {
                        hit = true;
                    }
                }

                if (hit) {
                    const floorNum = Number(p.floor || 0);
                    let baseScore = 2000;
                    if (GROUND_IDS.has(p.item_id)) baseScore = 100;
                    else if (SEED_IDS.has(p.item_id)) baseScore = 200;

                    const score = floorNum * 10000 + baseScore + (p.x + p.y) * 10 + (lift || 0) * 5;
                    candidates.push({ placement: p, score });
                }
            }
        }

        if (candidates.length === 0) return null;
        candidates.sort((a, b) => b.score - a.score);
        return candidates[0].placement;
    }

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
        const isHammerMode = this.app.tsukiPort && this.app.tsukiPort.isHammerMode;
        if (!isWallLayer && (!document.body.classList.contains('play-mode') || isHammerMode)) {
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
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            
            if (e.key === 'Delete' || e.key === 'Del') {
                const btn = document.getElementById('btn-delete-item');
                if (btn) {
                    btn.click();
                    e.preventDefault();
                }
                return;
            }

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
            
            const item_id = this.draggedInventoryItem ? this.draggedInventoryItem.item_id : null;
            const coveringType = item_id ? this.isCovering(item_id) : null;
            const isWallItem = item_id ? this.isWallFurniture(item_id) : false;
            const prefKind = (isWallItem || coveringType === 'wallpaper') ? 'wall' : 'floor';

            const hit = this._hitTestPlaySurface(mouseX, mouseY, prefKind);
            if (hit) {
                if (this.draggedInventoryItem) {
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
            
            try {
                let data = null;
                try {
                    const raw = e.dataTransfer.getData('application/json') || e.dataTransfer.getData('text/plain');
                    if (raw) data = JSON.parse(raw);
                } catch (err) {}
                if (!data && this.draggedInventoryItem) {
                    data = { ...this.draggedInventoryItem };
                }
                this.draggedInventoryItem = null;
                if (!data || !data.item_id) {
                    this.draw();
                    return;
                }
                
                const rect = this.canvas.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;
                
                const isWallItem = this.isWallFurniture(data.item_id);
                const coveringType = this.isCovering(data.item_id);
                const prefKind = (isWallItem || coveringType === 'wallpaper') ? 'wall' : 'floor';

                const hit = this._hitTestPlaySurface(mouseX, mouseY, prefKind);
                if (hit) {
                    const targetLocStr = document.getElementById('select-location')?.value;
                    const targetLoc = targetLocStr !== undefined && targetLocStr !== "" ? parseInt(targetLocStr, 10) : 0;
                    if ((window.tsukiDebugGrid === '1' || localStorage.tsukiDebugGrid === '1') && !this._debugLoggedLoc) {
                        const plist = (this.app.parser.placements || []).filter(p => p.cluster === targetLoc).slice(0, 20);
                        console.debug('[play placements]', targetLoc, plist.map(p => ({ id:p.item_id, floor:p.floor, x:p.x, y:p.y, isWall:!!p.isWall, parent:p.parentPlacementID })));
                        this._debugLoggedLoc = targetLoc;
                    }
                    if (localStorage.tsukiDebugGrid !== '1' && window.tsukiDebugGrid !== '1') this._debugLoggedLoc = null;
                    
                    const coveringType = this.isCovering(data.item_id);
                    if (coveringType) {
                        let applied = false;
                        const oldCoverId = this.getSurfaceCoveringId(hit.surf, targetLoc);
                        if (coveringType === 'floor' && hit.kind === 'floor') {
                            if (this.app.parser.setFloor(targetLoc, hit.floorNum, data.item_id) !== false) applied = true;
                        } else if (coveringType === 'wallpaper' && hit.kind === 'wall') {
                            if (this.app.parser.setWallpaper(targetLoc, hit.floorNum, hit.flipped, data.item_id) !== false) applied = true;
                        } else {
                            if (coveringType === 'wallpaper' && hit.kind !== 'wall') {
                                if (this.app && typeof this.app.showToast === 'function') this.app.showToast("Papel tapiz: colócalo en una pared", "warning");
                            } else if (coveringType === 'floor' && hit.kind !== 'floor') {
                                if (this.app && typeof this.app.showToast === 'function') this.app.showToast("Suelo: colócalo en el piso", "warning");
                            }
                            this.draw();
                            return;
                        }
                        
                        if (applied) {
                            if (oldCoverId && oldCoverId > 0 && oldCoverId !== data.item_id) {
                                try {
                                    this.app.parser.injectInventoryItem(oldCoverId, 1, false, 1);
                                } catch (e) {
                                    console.warn('[drop covering] Could not return old cover to inventory:', e);
                                }
                            }
                            const invArray = this.app.parser.inventory;
                            const slotIdx = invArray.findIndex(i => i.item_id === data.item_id && (data.invType === undefined || i.invType == data.invType) && i.qty > 0);
                            if (slotIdx !== -1) {
                                this.app.parser.updateInventoryItem('inventory', slotIdx, data.item_id, invArray[slotIdx].qty - 1, invArray[slotIdx].invType);
                            }
                            // Force refresh tileset texture cache & re-bake background immediately
                            const typeName = coveringType === 'wallpaper' ? 'wallpaper' : 'floor';
                            const cacheKey = `${typeName}_${data.item_id}`;
                            if (!this._patternCache[cacheKey]) this._getTilesetTexture(typeName, data.item_id);
                            
                            this._bakedBgKey = null;
                            this.draw();
                            setTimeout(() => {
                                if (this.app.tsukiPort && typeof this.app.tsukiPort.renderBagInventory === 'function') this.app.tsukiPort.renderBagInventory();
                                if (this.app.tsukiPort && typeof this.app.tsukiPort.renderHammerInventory === 'function') this.app.tsukiPort.renderHammerInventory();
                                if (this.app.tsukiPort && typeof this.app.tsukiPort.triggerAutosave === 'function') this.app.tsukiPort.triggerAutosave();
                            }, 50);
                        }
                        return;
                    }
                    
                    const isWallItem = this.isWallFurniture(data.item_id);
                    if (isWallItem && hit.kind !== 'wall') {
                        if (this.app && typeof this.app.showToast === 'function') this.app.showToast("Mueble de pared: colócalo en una pared", "warning");
                        this.draw();
                        return;
                    }
                    if (!isWallItem && hit.kind === 'wall') {
                        if (this.app && typeof this.app.showToast === 'function') this.app.showToast("Mueble de piso: colócalo en el suelo", "warning");
                        this.draw();
                        return;
                    }
                    
                    if (!isWallItem) {
                        const { w, l } = this.getRotatedSize(data.item_id, 0);
                        if (this._isAreaOccupied(hit.floorNum, hit.x, hit.y, w, l)) {
                            const free = this.findNearestFreeSpot(hit.floorNum, hit.x, hit.y, w, l);
                            if (free) {
                                hit.x = free.x;
                                hit.y = free.y;
                            } else {
                                if (this.app && typeof this.app.showToast === 'function') this.app.showToast("Posición ocupada por otro mueble", "warning");
                                this.draw();
                                return;
                            }
                        }
                    }
                    
                    // Colocar con integración AST completa
                    let newPlacement = null;
                    if (this.app && typeof this.app.createFurniturePlacement === 'function') {
                        newPlacement = this.app.createFurniturePlacement({
                            itemId: data.item_id,
                            x: hit.x,
                            y: hit.y,
                            floor: hit.floorNum,
                            cluster: targetLoc,
                            isWall: hit.kind === 'wall',
                            flipped: hit.kind === 'wall' ? hit.flipped : false,
                            orientation: 0
                        });
                    }
                    if (!newPlacement) {
                        newPlacement = {
                            item_id: data.item_id,
                            x: hit.x,
                            y: hit.y,
                            floor: hit.floorNum.toString(),
                            orientation: 0,
                            cluster: targetLoc,
                            isWall: hit.kind === 'wall',
                            flipped: hit.kind === 'wall' ? hit.flipped : false
                        };
                        this.app.parser.placements.push(newPlacement);
                    }
                    
                    // Descontar del inventario
                    const invArray = this.app.parser.inventory;
                    const slotIdx = invArray.findIndex(i => i.item_id === data.item_id && (data.invType === undefined || i.invType == data.invType) && i.qty > 0);
                    if (slotIdx !== -1) {
                        this.app.parser.updateInventoryItem('inventory', slotIdx, data.item_id, invArray[slotIdx].qty - 1, invArray[slotIdx].invType);
                    }
                    
                    this.selectedPlacement = newPlacement;
                    this.draw();
                    
                    // Defer re-rendering so the native drag session concludes cleanly in browser
                    setTimeout(() => {
                        if (this.app.tsukiPort) {
                            if (this.isHammerMode && typeof this.app.tsukiPort.renderHammerInventory === 'function') this.app.tsukiPort.renderHammerInventory();
                            if (!this.isHammerMode && typeof this.app.tsukiPort.renderBagInventory === 'function') this.app.tsukiPort.renderBagInventory();
                            if (typeof this.app.tsukiPort.triggerAutosave === 'function') this.app.tsukiPort.triggerAutosave();
                        }
                    }, 50);
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
            let newScale = this.scale * factor;
            newScale = Math.max(0.1, Math.min(newScale, 4.0));
            const actualFactor = newScale / this.scale;
            this.offsetX = mx - (mx - this.offsetX) * actualFactor;
            this.offsetY = my - (my - this.offsetY) * actualFactor;
            this.scale = newScale;
            this.draw();
        }, { passive: false });

        this.canvas.addEventListener('mousedown', e => {
            this.pointerDownTime = performance.now();
            this.pointerDownPos = { x: e.clientX, y: e.clientY };
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

                const rect   = this.canvas.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;
                const clickedPlacement = this._findPlacementAtScreen(mouseX, mouseY) || this.hoveredPlacement;

                if (clickedPlacement) {
                    this.selectedPlacement = clickedPlacement;
                    this.hoveredPlacement = clickedPlacement;
                    this.app.openItemEditor(this.selectedPlacement);
                    this.isItemDragging = true;
                    
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
                const isPlayHammer = document.body.classList.contains('play-mode') && this.app.tsukiPort && this.app.tsukiPort.isHammerMode;
                const isWallItem = !!this.selectedPlacement.isWall;

                if (isPlayHammer) {
                    const surfaceHit = this._hitTestPlaySurface(mouseX, mouseY, isWallItem ? 'wall' : 'floor');
                    if (isWallItem) {
                        if (surfaceHit && surfaceHit.kind === 'wall') {
                            const oldFlipped = !!this.selectedPlacement.flipped;
                            this.selectedPlacement.floor = surfaceHit.floorNum.toString();
                            this.selectedPlacement.flipped = surfaceHit.flipped;
                            if (oldFlipped !== !!surfaceHit.flipped) {
                                this.dragItemOffsetX = 0;
                                this.dragItemOffsetY = 0;
                            }
                        }
                    } else {
                        if (surfaceHit && surfaceHit.kind === 'floor') {
                            const oldFloor = this.selectedPlacement.floor;
                            this.selectedPlacement.floor = surfaceHit.floorNum.toString();
                            if (oldFloor !== this.selectedPlacement.floor) {
                                this.dragItemOffsetX = 0;
                                this.dragItemOffsetY = 0;
                            }
                        }
                    }
                }

                const raw = this._pointerToRawGrid(mouseX, mouseY, this.selectedPlacement);
                const floatedX = raw.x - (this.dragItemOffsetX || 0);
                const floatedY = raw.y - (this.dragItemOffsetY || 0);

                let snapped;
                if (isWallItem) {
                    const roundX = Math.round(floatedX);
                    const roundY = Math.round(floatedY);
                    const distX = floatedX - roundX;
                    const distY = floatedY - roundY;
                    const snapThreshold = 0.35;
                    const snapX = Math.abs(distX) < snapThreshold ? roundX : Math.round(floatedX);
                    const snapY = Math.abs(distY) < snapThreshold ? roundY : Math.round(floatedY);
                    snapped = this._clampWallGrid(this.selectedPlacement, snapX, snapY);
                } else {
                    snapped = this._snapMove(this.selectedPlacement, floatedX, floatedY);
                }

                if (this.selectedPlacement.x !== snapped.x || this.selectedPlacement.y !== snapped.y) {
                    try {
                        this.app.parser.applyMapChange(
                            this.selectedPlacement,
                            this.selectedPlacement.item_id, snapped.x, snapped.y,
                            this.selectedPlacement.orientation
                        );
                        if (this.app.editItemX) this.app.editItemX.value = snapped.x;
                        if (this.app.editItemY) this.app.editItemY.value = snapped.y;
                    } catch (err) {
                        console.error('Error applying map change:', err);
                    }
                    this.draw();
                }
                return;
            }

            if (this.app.parser) {
                const top = this._findPlacementAtScreen(mouseX, mouseY);
                if (this.hoveredPlacement !== top) {
                    this.hoveredPlacement = top;
                    this.draw();
                }
            }
        });

        this.canvas.addEventListener('mouseup', () => {
            const wasItemDragging = this.isItemDragging;
            this.isPanDragging  = false;
            this.isItemDragging = false;
            this.isGridDragging = false;
            this._dragSnap = null;
            if (wasItemDragging && document.body.classList.contains('play-mode') && this.app.tsukiPort && typeof this.app.tsukiPort.triggerAutosave === 'function') {
                this.app.tsukiPort.triggerAutosave();
            }
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
                this.pointerDownTime = performance.now();
                this.pointerDownPos = { x: touch.clientX, y: touch.clientY };
                const rect = this.canvas.getBoundingClientRect();
                const mouseX = touch.clientX - rect.left;
                const mouseY = touch.clientY - rect.top;

                const top = this._findPlacementAtScreen(mouseX, mouseY) || this.hoveredPlacement;

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
                    const isPlayHammer = document.body.classList.contains('play-mode') && this.app.tsukiPort && this.app.tsukiPort.isHammerMode;
                    const isWallItem = !!this.selectedPlacement.isWall;

                    if (isPlayHammer) {
                        const surfaceHit = this._hitTestPlaySurface(mouseX, mouseY, isWallItem ? 'wall' : 'floor');
                        if (isWallItem) {
                            if (surfaceHit && surfaceHit.kind === 'wall') {
                                const oldFlipped = !!this.selectedPlacement.flipped;
                                this.selectedPlacement.floor = surfaceHit.floorNum.toString();
                                this.selectedPlacement.flipped = surfaceHit.flipped;
                                if (oldFlipped !== !!surfaceHit.flipped) {
                                    this.dragItemOffsetX = 0;
                                    this.dragItemOffsetY = 0;
                                }
                            }
                        } else {
                            if (surfaceHit && surfaceHit.kind === 'floor') {
                                const oldFloor = this.selectedPlacement.floor;
                                this.selectedPlacement.floor = surfaceHit.floorNum.toString();
                                if (oldFloor !== this.selectedPlacement.floor) {
                                    this.dragItemOffsetX = 0;
                                    this.dragItemOffsetY = 0;
                                }
                            }
                        }
                    }

                    const raw = this._pointerToRawGrid(mouseX, mouseY, this.selectedPlacement);
                    const floatedX = raw.x - (this.dragItemOffsetX || 0);
                    const floatedY = raw.y - (this.dragItemOffsetY || 0);

                    let snapped;
                    if (isWallItem) {
                        const roundX = Math.round(floatedX);
                        const roundY = Math.round(floatedY);
                        const distX = floatedX - roundX;
                        const distY = floatedY - roundY;
                        const snapThreshold = 0.35;
                        const snapX = Math.abs(distX) < snapThreshold ? roundX : Math.round(floatedX);
                        const snapY = Math.abs(distY) < snapThreshold ? roundY : Math.round(floatedY);
                        snapped = this._clampWallGrid(this.selectedPlacement, snapX, snapY);
                    } else {
                        snapped = this._snapMove(this.selectedPlacement, floatedX, floatedY);
                    }

                    if (this.selectedPlacement.x !== snapped.x || this.selectedPlacement.y !== snapped.y) {
                        try {
                            this.app.parser.applyMapChange(
                                this.selectedPlacement,
                                this.selectedPlacement.item_id, snapped.x, snapped.y,
                                this.selectedPlacement.orientation
                            );
                            if (this.app.editItemX) this.app.editItemX.value = snapped.x;
                            if (this.app.editItemY) this.app.editItemY.value = snapped.y;
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
                const wasItemDragging = this.isItemDragging;
                this.isPanDragging  = false;
                this.isItemDragging = false;
                this._dragSnap = null;
                if (wasItemDragging && document.body.classList.contains('play-mode') && this.app.tsukiPort && typeof this.app.tsukiPort.triggerAutosave === 'function') {
                    this.app.tsukiPort.triggerAutosave();
                }
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
        let newX = p.x + roundAwayFromZero((oldSize.w - newSize.w) / 2);
        let newY = p.y + roundAwayFromZero((oldSize.l - newSize.l) / 2);

        // Clampear para que no se salga de los límites del piso/polígono
        const clamped = this._clampFloorGrid({ ...p, orientation: newOri }, newX, newY);
        newX = clamped.x;
        newY = clamped.y;

        // Persistir en el AST
        this.app.parser.applyMapChange(p, p.item_id, newX, newY, newOri);

        this.app.openItemEditor(p);
        
        // Asegurar que la imagen para la nueva orientación esté cargada
        this.getImage(p.item_id, newOri);
        
        this.draw();
    }

    // P5 / CastleManager integration: discriminate between quick tap and drag gesture
    isQuickTap(clientX, clientY) {
        if (!this.pointerDownTime || !this.pointerDownPos) return true;
        const elapsed = (performance.now() - this.pointerDownTime) / 1000;
        const dx = (clientX !== undefined ? clientX : this.pointerDownPos.x) - this.pointerDownPos.x;
        const dy = (clientY !== undefined ? clientY : this.pointerDownPos.y) - this.pointerDownPos.y;
        if (window.Castle && window.Castle.Manager) {
            return window.Castle.Manager.isQuickTap(elapsed, dx, dy);
        }
        return elapsed < 0.20 && (dx * dx + dy * dy) < 3.5;
    }
}