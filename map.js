// ────────────────────────────────────────────────────────────────
// map.js — Isometric 3D Map renderer for Tsuki's Odyssey Save Editor
// ────────────────────────────────────────────────────────────────

// Known sublocation cluster → friendly name
// Cluster IDs come from the order the parser discovers groups of placements.
// The real sublocationSave keys are Int32s; until we fully walk that dict,
// we map location IDs to standard generic names since they can vary.
const SUBLOC_NAMES = {
    0:      "🏡 Casa del Árbol de Tsuki (level2)",
    "0_hc": "🏡 Casa del Árbol Homecoming 3 Pisos (level28)",
    1:      "🦊 Tienda de Yori (level3)",
    2:      "🦒 Casa de Chi (level6)",
    3:      "🐢 Casa de Moca (level7)",
    4:      "🎣 Muelle de Yori / Costa (level5)",
    5:      "🌱 Tienda de Rosemary (level11)",
    6:      "🥕 Granja de Tsuki (level4)",
    7:      "🚂 Escena de Apertura / Tren (level15)",
    8:      "🏛️ Ayuntamiento de Aldea Hongo (level8)",
    9:      "🍵 Casa de Té de Momo (level10)",
    10:     "🚉 Estación de Tren (level9)",
    11:     "🧰 Taller de Dawn (level12)",
    12:     "🥊 Dojo de Ken (level55)",
    13:     "🎷 Salón de Scarlett (level13)",
    14:     "🚆 En Tránsito / Viaje en Tren (level48)",
    15:     "🚇 Estación de Subterráneo (level52)",
    16:     "🏙️ Gran Ciudad: Ayuntamiento (level49)",
    17:     "🚏 Gran Ciudad: Salida de la Ciudad (level50)",
    18:     "🕳️ Gran Ciudad: El Agujero (level51)",
    19:     "🛏️ Gran Ciudad: Hotel Cápsula (level53)",
    20:     "🛗 Gran Ciudad: Lobby de Apartamentos (level54)",
    21:     "🍸 Gran Ciudad: Bar La Cuerva (level55)",
    22:     "🏙️ Gran Ciudad: Penthouse de la Ciudad (level58)",
    23:     "🛍️ Gran Ciudad: Centro Comercial (level59)",
    24:     "🚪 Gran Ciudad: Entrada al Centro Comercial (level60)",
    25:     "🧶 Gran Ciudad: Tienda de Alfombras (level61)",
    26:     "🍷 Gran Ciudad: Vinatería (level62)",
    27:     "🍦 Gran Ciudad: Heladería (level63)",
    28:     "💍 Gran Ciudad: Joyería (level64)",
    29:     "📮 Gran Ciudad: Oficina de Correos (level69)",
    30:     "🧋 Gran Ciudad: Tienda de Bubble Tea (level65)",
    31:     "👟 Gran Ciudad: Zapatería (level66)",
    32:     "🚓 Gran Ciudad: Estación de Policía (level67)",
    33:     "☕ Gran Ciudad: Cafetería (level68)",
    34:     "🏢 Gran Ciudad: Apartamento de la Ciudad (level70)",
    39:     "✨ Ático de Ensueño / Homecoming (level39)"
};

// Los mapas que existen como data/maps/map_*.json. No todos son decorables —de hecho
// solo seis guardan muebles en los saves de prueba—, pero todos se pueden VISITAR, que
// es lo que hace falta para recorrer la ciudad.
const MAPAS_VISITABLES = [0, "0_hc", 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
                          21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 39];

// Un `const` de nivel superior NO queda colgado de `window`, asi que otros ficheros
// no lo verian. Se exponen a mano porque travel_system.js los necesita.
try { window.SUBLOC_NAMES = SUBLOC_NAMES; window.MAPAS_VISITABLES = MAPAS_VISITABLES; }
catch (e) { /* fuera del navegador */ }

// Furniture IDs considered "ground" / floor layer (rendered below everything)
const GROUND_IDS   = new Set([306, 411]);     // Plot, Soil Hydrator
// Seed / Crop IDs that sit ON TOP of a Plot (FURN_306)
const SEED_IDS     = new Set([342, 345, 1208, 1230, 1231, 1232, 1233, 1237, 1238]);
// La caja de cultivo NO es una semilla. Estaba metida en SEED_IDS y eso hacía que el
// parser la tratase como tal: al no encontrarle parcela le forzaba x=-1,y=-1 y se perdía
// la posición que sí trae el csave (groupPosition.grid). Se dibuja aparte, en
// _drawCropBoxFixture, así que tampoco entra en la capa de muebles normales.
const CROP_BOX_ID  = 1301;
const CROP_BOX_SIZE = { w: 3, l: 3 };
// Césped del suelo, una textura por estación. Son las del juego (images/tilesets);
// antes el fondo se pintaba con un color plano y en otoño e invierno ni siquiera se
// intentaba la textura.
// SeasonID tal y como lo numera el juego, no como apetece: lo dice el `SeasonData`
// extraído (`data/weather.json`: 0 Summer, 1 Autumn, 2 Winter, 3 Spring) y lo confirman
// los saves (mes 8 -> season 0). Aquí estaba corrido una posición —0 primavera, 1 verano,
// 2 otoño, 3 invierno—, así que el césped, el color del suelo y la copa del árbol salían
// SIEMPRE una estación por detrás: hierba de otoño en invierno, de invierno en primavera.
// `play_scenery.js` ya se corrigió en su día; `map.js` se quedó con lo viejo, y es el que
// pinta el editor y el play con `?scenery=off`.
const SEASON_GRASS = {
    0: 'images/tilesets/DreamHouse_Environment_Grass_Summer_27.png',            // verano
    1: 'images/tilesets/DreamHouse_Environment_Reusables_AutumnGrass_165.png',  // otoño
    2: 'images/tilesets/DreamHouse_Environment_Grass_Winter_182.png',           // invierno
    3: 'images/tilesets/DreamHouse_Environment_Reusables_SpringGrass_167.png',  // primavera
};

// Desplazamiento del pivot de los sprites de parcela respecto al centro de su rombo,
// en píxeles de sprite (ppu 150). Ver _drawPlotTile.
const PLOT_PIVOT_DY = 29;
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
    const bboxMid = (minx + maxx) / 2 / w;
    const footMid = footN ? footX / footN / w : bboxMid;
    // D: pies primero — el punto de contacto con el suelo (esquina sur del
    // primer tile) manda sobre el centro del alpha. bboxMid solo si no hay
    // píxeles de pie detectados.
    const finalX = footN ? footMid : bboxMid;
    return {
        x: finalX,
        y: Math.max(0.004, 1 - (maxy + 0.5) / h)
    };
}

// Huellas por item/orientación verificadas en juego (formato: itemId -> {ori: [w, l]}).
// Aplica a ghost + snap + occupancy + tooltip (todo pasa por getRotatedSize).
const FOOTPRINT_OVERRIDES = {};

// Tamaños base reales verificados en juego (ori 0), por id. Tienen prioridad
// sobre getFurnitureSize/items_db. Nunca 1×1 por default para estos ids.
const REAL_SIZES = {};

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

        if (!window.BED_PROFILES) {
            fetch('data/bed_profiles.json')
                .then(r => r.json())
                .then(data => {
                    window.BED_PROFILES = data;
                    if (this.draw) this.draw();
                })
                .catch(e => console.warn('Could not load bed_profiles.json:', e));
        }

        if (!window.ACTIVITIES_DB) {
            fetch('data/activities_db.json?v=' + Date.now())
                .then(r => r.json())
                .then(data => {
                    window.ACTIVITIES_DB = data;
                    if (this.draw) this.draw();
                })
                .catch(e => console.warn('Could not load activities_db.json:', e));
        }

        // Heartbeat for living animated characters (breathing, blinking, frame cycling at ~2.6 FPS)
        this._animTimer = setInterval(() => {
            if (this._hasActiveAnimatedEntities && this._hasActiveAnimatedEntities()) {
                this.draw();
            }
        }, 380);

        if (typeof window !== 'undefined') {
            window.getAnimationFrame = this.getAnimationFrame.bind(this);
            window.resolveNpcAnimFrames = this.resolveNpcAnimFrames.bind(this);
        }

        this.bindEvents();
    }

    _hasActiveAnimatedEntities() {
        if (!this.app) return false;
        if (this.placements) {
            for (let i = 0; i < this.placements.length; i++) {
                const p = this.placements[i];
                if (p._simSitting || p._simActivity || (p.activityData && p.activityData.valid)) return true;
            }
        }
        if (this.app.parser && typeof this.app.parser.getActivitySaves === 'function') {
            const acts = this.app.parser.getActivitySaves();
            if (acts && acts.some(a => a.valid)) return true;
        }
        return false;
    }

    getAnimationFrame(frames, fps = 2.5, mode = 'pingpong', timeMs = Date.now()) {
        if (!frames || !frames.length) return null;
        if (frames.length === 1) return frames[0];
        const frameDuration = 1000 / (fps || 2.5);
        const totalFrames = frames.length;
        
        if (mode === 'pingpong' && totalFrames > 2) {
            const period = 2 * (totalFrames - 1);
            const k = Math.floor(timeMs / frameDuration) % period;
            const idx = k < totalFrames ? k : period - k;
            return frames[idx];
        } else {
            const idx = Math.floor(timeMs / frameDuration) % totalFrames;
            return frames[idx];
        }
    }

    resolveNpcAnimFrames(npcKey, animName) {
        const db = (typeof window !== 'undefined' && window.NPC_DB) ? window.NPC_DB : null;
        if (!db) return null;
        const npc = db[String(npcKey)] || db['0'];
        if (!npc || !npc.animations) return null;
        const frames = npc.animations[animName];
        if (frames && frames.length) {
            const folder = npc.name || 'Tsuki';
            return frames.map(f => folder + '/' + f);
        }
        return null;
    }

    getBedCustomImage(filename) {
        if (!filename) return null;
        const cacheKey = 'BED_CUSTOM_' + filename;
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
            this._imgCache[cacheKey] = null;
        };
        img.src = 'images/items/bed_custom/' + filename;
        return this._imgCache[cacheKey];
    }

    getItemCustomImage(filename) {
        if (!filename) return null;
        const cacheKey = 'ITEM_CUSTOM_' + filename;
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
            this._imgCache[cacheKey] = null;
        };
        img.src = 'images/items/' + filename;
        return this._imgCache[cacheKey];
    }

    getNpcSprite(path) {
        if (!path) return null;
        const cacheKey = 'NPC_' + path;
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
            this._imgCache[cacheKey] = null;
        };
        // Los fotogramas de las ACTIVIDADES vienen con la ruta entera desde la raíz
        // (`images/npcs/...` o `images/activities/...`), porque salen de dos sitios:
        // unos estaban ya en el port y otros hubo que sacarlos de los bundles. Los de
        // siempre siguen llegando como `Personaje/fotograma`, relativos a images/npcs.
        img.src = (path.indexOf('images/') === 0) ? path : ('images/npcs/' + path);
        return this._imgCache[cacheKey];
    }

    // Tileset Image Loader (for Wallpapers/Floors)
    /**
     * Numero de `Exportado_levelN` del que salen las mascaras de este mapa.
     *
     * No vale `loc === 0 ? 2 : loc`: la Casa del Arbol sirve dos escenas bajo el mismo
     * mapId 0 (level2 con dos pisos, level28 con tres), y `MapDef` es quien sabe cual
     * esta activa. Sin esto, la casa ampliada se recortaba con las mascaras de la normal.
     */
    _exportDirDe(loc) {
        const META = (window.MAP_META && window.MAP_META[loc]) || {};
        if (META.exportDir != null) return META.exportDir;
        try {
            const cfg = window.MapDef && window.MapDef.config ? window.MapDef.config(loc) : null;
            const m = cfg && cfg.assetsDir ? String(cfg.assetsDir).match(/level(\d+)/) : null;
            if (m) return Number(m[1]);
        } catch (e) { /* MapDef aun sin cargar */ }
        return (loc === 0 ? 2 : loc);
    }

    _getTilesetTexture(type, id) {
        if (id == null || id === '' || Number(id) < 0) return null;
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

    /**
     * ¿Este mapa dice, para este tipo de superficie, a qué grupo pertenece cada
     * entrada del csave? Si alguna superficie trae `anchorID`, la correspondencia
     * es conocida y no hay que adivinar por índice para las demás.
     */
    _mapDeclaresAnchors(surf, kind) {
        const mapId = surf && surf.mapId;
        if (mapId == null) return false;
        const key = kind + ':' + mapId;
        if (!this._anchorDeclCache) this._anchorDeclCache = {};
        if (this._anchorDeclCache[key] === undefined) {
            this._anchorDeclCache[key] = (window.mapsAtlas || []).some(
                s => String(s.mapId) === String(mapId) && s.kind === kind && s.anchorID != null);
        }
        return this._anchorDeclCache[key];
    }

    getSurfaceCoveringId(surf, targetLoc) {
        if (!surf) return null;
        const isFloor = surf.kind === 'floor';
        if (isFloor) {
            const floorDict = this.app && this.app.parser && this.app.parser.floors;
            const fList = (floorDict && floorDict[targetLoc]) || null;
            if (fList && fList.length) {
                if (surf.anchorID != null) {
                    const m = fList.find(f => Number(f.key) === Number(surf.anchorID));
                    if (m && m.id != null && m.id !== '' && Number(m.id) >= 0) return m.id;
                } else if (!this._mapDeclaresAnchors(surf, 'floor')) {
                    // Sin anclas no queda más que emparejar por posición. Con ellas NO:
                    // el csave solo guarda los grupos decorados, así que a un grupo sin
                    // entrada propia se le colaba el revestimiento de otro.
                    const match = fList.find(f => Number(f.key) === Number(surf.groupNum));
                    if (match && match.id != null && match.id !== '' && Number(match.id) >= 0) return match.id;
                    if (fList[surf.groupNum] && fList[surf.groupNum].id != null && fList[surf.groupNum].id !== '' && Number(fList[surf.groupNum].id) >= 0) return fList[surf.groupNum].id;
                }
            }
            if (surf.defaultCoverId !== undefined && surf.defaultCoverId !== null) {
                if (surf.defaultCoverId === -1) return null;
                return surf.defaultCoverId;
            }
            // Fallback para Casa del Árbol (targetLoc 0)
            if (Number(targetLoc) === 0) return 0;
            return null;
        } else {
            const wpDict = this.app && this.app.parser && this.app.parser.wallpapers;
            if (wpDict && wpDict[targetLoc] && wpDict[targetLoc].length) {
                const wList = wpDict[targetLoc];
                if (surf.anchorID != null) {
                    const match = wList.find(w => Number(w.key) === Number(surf.anchorID));
                    if (match && match.id != null && match.id !== '' && Number(match.id) >= 0) return match.id;
                } else if (!this._mapDeclaresAnchors(surf, 'wall')) {
                    // Unity Treehouse ordering:
                    // 0: Floor 0 Left (flipped=true)
                    // 1: Floor 1 Left (flipped=true)
                    // 2: Floor 1 Right (flipped=false)
                    // 3: Floor 0 Right (flipped=false)
                    if (Number(targetLoc) === 0 && wList.length >= 4) {
                        const idx = surf.flipped ? (surf.groupNum === 0 ? 0 : 1) : (surf.groupNum === 0 ? 3 : 2);
                        if (wList[idx] && wList[idx].id != null && wList[idx].id !== '' && Number(wList[idx].id) >= 0) return wList[idx].id;
                    } else {
                        const idx = (surf.groupNum * 2) + (surf.flipped ? 0 : 1);
                        if (wList[idx] && wList[idx].id != null && wList[idx].id !== '' && Number(wList[idx].id) >= 0) return wList[idx].id;
                    }
                }
            }
            if (surf.defaultCoverId !== undefined && surf.defaultCoverId !== null) {
                if (surf.defaultCoverId === -1) return null;
                return surf.defaultCoverId;
            }
            if (Number(targetLoc) === 0) {
                return 1; // Bark
            }
            return null;
        }
    }

    // ── Size helpers ──────────────────────────────────────────────────────
    getSize(item_id) {
        if (item_id === CROP_BOX_ID) return { ...CROP_BOX_SIZE };
        if (GROUND_IDS.has(item_id) || SEED_IDS.has(item_id)) return { ...PLOT_SIZE };

        // Tamaño real verificado en juego: gana sobre items_db
        const real = REAL_SIZES[String(item_id)];
        if (real) return { ...real };
        
        // Use the exact sizes extracted from Unity
        if (typeof window.getFurnitureSize === 'function') {
            const s = window.getFurnitureSize(String(item_id));
            if (s && s.width > 0 && s.length > 0) return { w: s.width, l: s.length };
        }
        
        return { ...DEFAULT_SIZES };
    }

    getRotatedSize(item_id, orientation) {
        const size = this.getSize(item_id);
        // Per-item footprint overrides (verificado en juego): la vista trasera
        // de estos muebles corre sobre el otro eje (ej. banca 115 en ori 2
        // mide 4x2 horizontal como el mueble, no 2x4).
        // NO tocar orientation 1/3 aquí: los valores del save son strings y
        // el === de abajo nunca matchea strings (comportamiento actual).
        const ov = FOOTPRINT_OVERRIDES[String(item_id)];
        const oriNum = Number(orientation);
        if (ov && ov[oriNum]) {
            const [w, l] = ov[oriNum];
            return { w, l };
        }
        // orientation 1 (SW) and 3 (NE) align the object along the opposite axis,
        // so we must swap width and length.
      if (Number(orientation) === 1 || Number(orientation) === 3) {
          return { w: size.l, l: size.w };
      }
        return size;
    }

    getImage(item_id, orientation, placement) {
        // EL REPRODUCTOR DE CASETES (mueble 406) tiene DOS estados, no uno.
        //
        // `MusicPlayer` declara `Sprite open` y `Sprite close`, y el prefab los trae:
        // `Cassette Player_0` es la tapa CERRADA -se ve el casete por la ventanilla- y
        // `Cassette Player_1` la tapa ABIERTA y vacía. En el port son `FURN_406.png` y
        // `FURN_406_0.png`.
        //
        // El cargador de abajo prueba SIEMPRE `_0` primero, así que salía siempre
        // abierto. Cuál toca depende de si hay casete puesto (`MusicPlayerSave.musicID`).
        //
        // No hay animación de fotogramas entre los dos: el prefab lleva tres componentes
        // —Transform, el MonoBehaviour y un PolygonCollider2D— y ningún `Animator` ni
        // `SimpleAnim`. El cambio de estado ES el cambio de sprite.
        if (Number(item_id) === 406 && window.MixtapePlayer) {
            const puesto = window.MixtapePlayer.caseteDe(placement);
            const ori406 = Number(orientation);
            const atras = ori406 === 2 || ori406 === 3;
            const archivo = puesto ? `FURN_406${atras ? '_BACK' : ''}` : 'FURN_406_0';
            const clave = 'CASETE_' + archivo;
            if (this._imgCache[clave] !== undefined) return this._imgCache[clave];
            this._imgCache[clave] = false;
            const img = new Image();
            img.onload = () => { this._imgCache[clave] = img; this.draw(); };
            img.onerror = () => { this._imgCache[clave] = null; };
            img.src = `images/items/${archivo}.png?v=5`;
            return this._imgCache[clave];
        }

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
                isBack ? `images/items/FURN_${item_id}_BACK.png?v=5` : `images/items/FURN_${item_id}_0.png?v=5`,
                isBack ? `images/items/FURN_${item_id}_0.png?v=5` : `images/items/FURN_${item_id}.png?v=5`,
                `images/items/FURN_${item_id}.png?v=5`,
                `images/items/${targetSprite}.png?v=5`,
                `data/prefab_exports/${item_id}/${targetSprite}.png?v=5`
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
        // Pivots verificados en juego por id (formato C): el rehorneado pies-primero
        // clava la sombra tenue bajo la base en estos sprites (115: base filas
        // 139-149, sombra 150-158; BACK: base 130-134, sombra 135-143). Se
        // restauran los valores horneados previos que clavan la base.
        const PIVOT_OVERRIDES = {};
        const ori = Number(orientation);
        const isBack = ori === 2 || ori === 3;
        const key = String(item_id);
        if (isBack && PIVOT_OVERRIDES[key + '_BACK']) return PIVOT_OVERRIDES[key + '_BACK'];
        if (PIVOT_OVERRIDES[key]) return PIVOT_OVERRIDES[key];

        const baked = (typeof window !== 'undefined' && window.contentPivots) || {};
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
                img3.onerror = () => {
                    const img4 = new Image();
                    img4.onload = () => { this._imgCache[cacheKey] = img4; this.draw(); };
                    img4.onerror = () => { this._imgCache[cacheKey] = null; };
                    img4.src = `images/items/CROP_${item_id}.png?v=5`;
                };
                img3.src = `images/items/ITEM_${item_id}.png?v=5`;
            };
            img2.src = `images/items/FURN_${item_id}.png?v=5`;
        };
        img.src = `images/items/FURN_${item_id}_0.png?v=5`;
        
        return false;
    }

    // ─── Coordinate transforms ───────────────────────────────────────────────
    surfaceFor(mapId, groupNum, isWall, flipped) {
        if (!window.mapsAtlas) return null;
        let effMapId = mapId;
        let effGroup = groupNum;
        if (typeof mapId === 'string' && mapId.startsWith('train_vagon_')) {
            effMapId = 14;
            const vi = parseInt(mapId.split('_')[2], 10) - 1;
            if (effGroup == null || effGroup === 0) effGroup = vi;
        }
        return window.mapsAtlas.find(s => 
            (s.mapId == null || String(s.mapId) === String(effMapId)) && 
            Number(s.groupNum) === Number(effGroup) && 
            s.kind === (isWall ? 'wall' : 'floor') && 
            (!isWall || !!s.flipped === !!flipped)
        ) || null;
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

    _getSurfaceCellUnits(surf) {
        // La cuenta vive en `castle_core.js` para que el editor use LA MISMA. Estuvo
        // solo aquí, y el editor leía el `cell` crudo: en las 62 paredes que guardan
        // `37.5 x 37.5` eso es la MITAD del paso horizontal, así que los muebles de
        // pared caían en otra columna que en play.
        return window.Castle.Iso.cellUnits(surf);
    }

    /**
     * Mobiliario que el juego coloca solo en este mapa (ver default_layouts.js).
     * Se memoriza por mapa y por estado del save: recalcularlo en cada repintado
     * costaría, y solo cambia cuando el jugador mueve o borra algo.
     */
    _layoutPlacements(mapId) {
        if (!window.DefaultLayouts || !window.DefaultLayouts.byMap) return [];
        const saved = (this.app && this.app.parser && this.app.parser.placements) || [];
        const key = mapId + '|' + saved.length + '|' + (window.DefaultLayouts.showConditional ? 1 : 0)
                  + '|' + (this._layoutOverrideTick || 0);
        if (this._layoutCache && this._layoutCache.key === key) return this._layoutCache.list;
        const list = window.DefaultLayouts.placementsFor(mapId, saved);
        this._layoutCache = { key, list };
        return list;
    }

    /**
     * ¿Está desplegado el Homecoming (el piso extra de la Casa del Árbol)?
     *
     * Lo manda `sublocations[0].currSLocData`: 1 = casa ampliada. Antes se miraba
     * `homecomingUpdates`, y eso estaba mal: no es una bandera de la partida sino el
     * número de tandas de contenido publicadas — vale 6 en los dos saves de prueba,
     * así que `=== 1` daba siempre falso y el piso no salía nunca, ni en una partida
     * que sí lo tiene construido.
     */
    _homecomingActivo() {
        return this._estadoHomecoming() !== 'oculto';
    }

    /**
     * En que punto esta la ampliacion. Tres estados, no dos:
     *
     *   'oculto'  no hay ampliacion: el piso 4 no existe
     *   'obra'    el piso ya se ve, pero esta EN OBRA: no se puede decorar
     *   'listo'   terminado y decorable
     *
     * El interruptor del piso es `sublocations[0].currSLocData`. Lo que separa 'obra'
     * de 'listo' es el cronometro `Home2Construction`, de 1440 minutos: mientras
     * corre, el juego tapa el piso y no deja poner nada.
     *
     * Si el save no trae el cronometro se entiende 'listo', que es como estaba antes:
     * mejor dejar decorar que bloquear un piso por un dato que no existe.
     */
    _estadoHomecoming() {
        const p = this.app && this.app.parser;
        let puesto = false;
        if (p && typeof p.getHomeCurrSLocData === 'function') {
            const v = p.getHomeCurrSLocData();
            if (v != null) puesto = Number(v) === 1;
        } else {
            try { if (window.Flags) puesto = window.Flags.get('homecomingUpdates') >= 1; }
            catch (e) { /* sin Flags */ }
        }
        if (!puesto) return 'oculto';
        if (p && typeof p.getTempTimerStatus === 'function') {
            let t = null;
            try { t = p.getTempTimerStatus('Home2Construction'); } catch (e) { t = null; }
            if (t && !t.done) return 'obra';
        }
        return 'listo';
    }

    /** ¿Se puede decorar el piso extra ahora mismo? */
    _homecomingDecorable() {
        return this._estadoHomecoming() === 'listo';
    }

    /**
     * Pone la Casa del Arbol en su escena correcta.
     *
     * La ampliacion NO es una capa sobre la casa normal: son dos escenas distintas de
     * Unity, level2 con dos pisos y level28 con tres. Se comprobo que no hay una
     * traslacion unica entre ellas —los sprites comunes se desplazan entre -17.8 y
     * -23.9 en X—, porque al meter un piso la casa se reestructura y cada planta queda
     * a otra altura.
     *
     * Por eso `map_0_hc.json` re-ancla CADA grupo a su piso del arte nuevo
     * (0 -> Floor_L1, 1 -> Floor_L2, 4 -> Floor_L3) conservando `rows`, `cols` y
     * `cell`. Como en el save un mueble guarda su CELDA dentro del grupo y no una
     * coordenada del mundo, al cambiar de escena cada mueble sigue en la misma celda
     * de la misma habitacion: no se mueve respecto a la sala.
     *
     * Se llama al dibujar, que es barato: solo hace algo cuando el estado cambia.
     */
    _sincronizarEscenaCasa() {
        if (!window.MapDef || typeof window.MapDef.usarVariante !== 'function') return;
        const quiere = (this._estadoHomecoming() !== 'oculto') ? '0_hc' : null;
        if (this._varianteCasa === quiere) return;
        this._varianteCasa = quiere;

        const aplicar = () => {
            window.MapDef.usarVariante(0, quiere);
            try { window.MapDef.syncAtlas(0); } catch (e) { /* atlas aun sin cargar */ }
            if (this._sceneFullCache) delete this._sceneFullCache[0];
            this._bakedBgCanvas = null;
            this._bakedBgKey = null;
            this._layoutCache = null;
            this._renderCache = null;
            try { this.draw(); } catch (e) { /* aun sin lienzo */ }
        };
        if (quiere && typeof window.MapDef.load === 'function' && !window.MapDef.get(quiere)) {
            window.MapDef.load(quiere).then(aplicar).catch(() => { this._varianteCasa = undefined; });
        } else {
            aplicar();
        }
    }

    _getMapAnchorPx(mapId) {
        // Ancla mundo->pixel del *_Ensamblado.png del mapa. Cada nivel tiene la suya
        // (se deriva con tools/derive_surfaces.py); (1235,1257) es la de level2 y solo
        // vale como ultimo recurso para mapas cuyo JSON aun no la declara.
        const cfg = (window.MapDef && mapId != null) ? window.MapDef.config(mapId) : null;
        return (cfg && cfg.origin_px) ? cfg.origin_px : { x: 1235, y: 1257 };
    }

    _hasRealFloor(mapId, groupNum) {
        // Un poly de <=4 puntos con todas las coordenadas en multiplos exactos de 0.25 es
        // un placeholder generado (rombo de rows/cols redondos), no geometria del juego;
        // la real viene de colliders de Unity o de vertices movidos a mano, con 4 decimales.
        // Mismo criterio que tools/derive_surfaces.py::is_synthetic.
        const list = (window.mapsAtlas || []).filter(s =>
            String(s.mapId) === String(mapId) && s.kind === 'floor' &&
            Number(s.groupNum) === Number(groupNum));
        return list.some(s => {
            const poly = s.poly || [];
            if (poly.length < 3) return false;
            if (poly.length > 4) return true;
            return !poly.every(p => Math.abs(p.x * 4 - Math.round(p.x * 4)) < 1e-9 &&
                                    Math.abs(p.y * 4 - Math.round(p.y * 4)) < 1e-9);
        });
    }

    _getSurfaceOrigin(surf, mapId) {
        // origin (mundo) manda; origin_px es el respaldo y necesita el ancla del mapa.
        if (!surf) return { ox: 0, oy: 0 };
        if (surf.origin) return { ox: surf.origin.x, oy: surf.origin.y };
        if (surf.origin_px) {
            const a = this._getMapAnchorPx(mapId);
            return { ox: (surf.origin_px.x - a.x) / 150, oy: (a.y - surf.origin_px.y) / 150 };
        }
        return { ox: 0, oy: 0 };
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
            const { ox, oy } = this._getSurfaceOrigin(surf, mapId);
            // Origen + celda + formula, de una vez y en castle_core, para que el
            // editor use exactamente lo mismo. Ver `puntoEnSuperficie`.
            const _w = window.Castle.Iso.puntoEnSuperficie(surf, x, y, { x: ox, y: oy });
            const worldX = _w.x;
            const worldY = _w.y;
            
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
        const layerRadio = this._layerRadio();
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
            const { ox, oy } = this._getSurfaceOrigin(surf, mapId);
            const { cw_u, ch_u } = this._getSurfaceCellUnits(surf);

            const worldX = (screenX - this.offsetX) / (150 * u);
            const worldY = (this.offsetY - screenY) / (150 * u);
            const wx = worldX - ox;
            const wy = worldY - oy;
            const U = wx / (cw_u / 2);
            const V = wy / (ch_u / 2);
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
    /** Textura de césped de la estación indicada (0 primavera … 3 invierno). */
    seasonGrassImage(season) {
        return this.getBackgroundImage(SEASON_GRASS[season] || SEASON_GRASS[1]);
    }

    /**
     * Patrón de césped anclado al mundo: se desplaza y escala con la cámara, así que
     * no "nada" bajo el mapa al mover o hacer zoom. Devuelve null mientras carga, para
     * que quien lo pida caiga al color plano de siempre.
     */
    seasonGrassPattern(ctx, season) {
        const img = this.seasonGrassImage(season);
        if (!img || !img.complete || img.naturalWidth <= 0) return null;
        const pat = ctx.createPattern(img, 'repeat');
        if (!pat) return null;
        const _bgo = (window.atlasConfig && window.atlasConfig.bgScale ? window.atlasConfig.bgScale : 0.75);
        const k = _bgo * this.scale;
        try {
            pat.setTransform(new DOMMatrix().translateSelf(this.offsetX, this.offsetY).scaleSelf(k));
        } catch (e) {
            // Sin setTransform el césped no acompaña a la cámara, pero se ve.
        }
        return pat;
    }

    /**
     * Ruta canonica de una imagen de fondo.
     *
     * `backgroundPathFor()` devuelve dos formas distintas para el MISMO fichero segun
     * si el JSON del mapa ya esta cargado: "images/maps/..." si lo esta y
     * "../maps/..." si todavia no. Cacheando por la cadena cruda salian dos entradas
     * para la misma imagen, y `_clampCamera` —que busca por `backgroundPathFor()`— no
     * encontraba la que habia horneado el dibujado y se salia sin ajustar la camara.
     *
     * El efecto era que al cambiar de mapa se quedaba el encuadre del anterior. En
     * mapas parecidos no se notaba, pero al ir de Aldea Hongo (2674x2455) a la
     * Estacion de Tren (6064x4586) te quedabas mirando un hueco vacio: parecia que el
     * mapa no cargaba.
     */
    _rutaFondoCanonica(imgName) {
        const n = String(imgName || '');
        if (n.startsWith('images/') || n.startsWith('data/')) return n;
        if (n.startsWith('../maps/')) return n.replace('../maps/', 'images/maps/');
        return 'images/all_sprites/' + n;
    }

    getBackgroundImage(imgName) {
        if (!this._bgCache) this._bgCache = {};
        // Se cachea por la ruta ya resuelta, no por la que llega.
        const clave = this._rutaFondoCanonica(imgName);
        if (this._bgCache[clave] !== undefined) return this._bgCache[clave];

        const img = new Image();
        this._bgCache[clave] = false;
        img.onload = () => { this._bgCache[clave] = img; this.draw(); };
        img.onerror = () => { this._bgCache[clave] = null; };
        img.src = clave;
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
                // La semilla enlazada a una parcela comparte casilla con ella, pero no se
                // dibuja por su cuenta (la pinta _drawCropOnPlot encima de la parcela).
                // Si cuenta como "otro objeto en la celda", el abanico de abajo separa la
                // parcela de su propio cultivo un cuarto de casilla y el bancal se ve
                // duplicado, como dos capas superpuestas.
                if (item.linkedPlot && SEED_IDS.has(item.item_id)) continue;
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
        const { cw_u, ch_u } = this._getSurfaceCellUnits(surf);
        const cellW = (cw_u / 2) * 150 * u;
        const cellH = (ch_u / 2) * 150 * u;
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
            const { ox, oy } = this._getSurfaceOrigin(surf, mapId);
            const { cw_u, ch_u } = this._getSurfaceCellUnits(surf);

            // `CastleTools.WallIsoPoint` (RVA 0x3116180), tal cual:
            //
            //     x = 0.25 * u
            //     y = 0.25 * v + (volteada ? +0.125 : -0.125) * u
            //
            // con `u` a lo largo de la pared y `v` hacia arriba. A PPU 150 eso es
            // cw_u/2 = 0.25 y ch_u = 0.25, que es lo que devuelve _getSurfaceCellUnits.
            //
            // La rama volteada estaba mal en DOS sitios: restaba en la x —o sea que la
            // pared izquierda crecia hacia el lado contrario— y usaba el mismo signo
            // negativo en la y. Las dos caras van en +x; lo que cambia es el signo del
            // termino que las inclina.
            // El volteo lo pone la PARED, no el mueble: `puntoEnSuperficie` lo saca de
            // `surf.flipped`. El editor lo elegia con una cadena `||` que con `false`
            // sigue buscando y podia acabar usando el del mueble.
            const _w2 = window.Castle.Iso.puntoEnSuperficie(surf, wx, wy, { x: ox, y: oy });
            const worldX = _w2.x;
            const worldY = _w2.y;
            
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
                const { ox, oy } = this._getSurfaceOrigin(surf, mapId);
                const { cw_u, ch_u } = this._getSurfaceCellUnits(surf);
                const _bgo = (window.atlasConfig && window.atlasConfig.bgScale ? window.atlasConfig.bgScale : 0.75);
                const u = _bgo * this.scale;
                const factor = 150 * u;

                const worldX = (screenX - this.offsetX) / factor;
                const worldY = (this.offsetY - screenY) / factor;

                // Inversa exacta de getWallIsoCoords.
                // La inversa exacta de `Castle.Iso.wallPoint`, en el mismo sitio.
                const celda = window.Castle.Iso.wallCell(worldX - ox, worldY - oy, flipped, cw_u, ch_u);
                const wx = celda.u;
                const wy = celda.v;
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
        const layerRadio = this._layerRadio();
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

    /**
     * Pasa un offset de sub-rejilla (unidades de mundo) a las unidades de `lift`, que es
     * lo que usa el resto del dibujado: los sitios que lo consumen hacen
     * `lift * this.CELL_H * this.scale` para sacar píxeles, y un metro de mundo son
     * `150 * bgScale` píxeles sin escalar.
     */
    _liftDeMundo(v) {
        const bgo = (window.atlasConfig && window.atlasConfig.bgScale) ? window.atlasConfig.bgScale : 0.75;
        return v * 150 * bgo / this.CELL_H;
    }

    /**
     * El mueble sobre el que se apoya cada pieza, y a qué altura.
     *
     * Antes esto se adivinaba dos veces: qué se apoyaba sobre qué, por solape de cajas y
     * unas reglas de «rol»; y cuánto subía, con un 0,95 si el nombre del mueble contenía
     * «table/mesa/desk/cama/bed» y un 0,62 en cualquier otro caso.
     *
     * Ahora los dos datos salen del juego (`data/furniture_subgroups.json`, ver
     * `furniture_subgroups.js`):
     *
     *   · qué muebles sostienen a otros → `hasSubGroup`, exacto, son 365 de 2644;
     *   · cuánto suben → `SubGroupData.Offset(orientación del mueble base)`, que además
     *     lleva componente horizontal, que antes se ignoraba.
     *
     * Y cuando la pieza dice de quién se apoya —las del layout traen `parentItemId`, y
     * las del save `parentPlacementID` vía `GridPointer.PointerType.Placement`— no se
     * adivina nada: se usa ese padre y ya está.
     *
     * La heurística vieja se queda de reserva para cuando los datos aún no han cargado.
     */
    _computeStackInfo(items) {
        const info = new Map();
        if (!items || !items.length) return info;
        const SG = window.FurnitureSubgroups;
        const hayDatos = !!(SG && SG.datos);

        const meta = items.map(p => {
            const sz = this.getRotatedSize(p.item_id, p.orientation);
            return { p, w: sz.w || 1, l: sz.l || 1, area: (sz.w || 1) * (sz.l || 1), role: this._stackRole(p) };
        });
        const porID = new Map();
        for (const m of meta) {
            if (m.p.placementID != null) porID.set(String(m.p.placementID), m);
        }

        const anotar = (a, base) => {
            if (!base) return;
            let lift, liftX = 0;
            const off = hayDatos ? SG.offsetDe(base.p.item_id, base.p.orientation) : null;
            if (off) {
                lift = this._liftDeMundo(off.y);
                liftX = this._liftDeMundo(off.x);
            } else {
                // Sin dato del juego: la aproximación de siempre.
                const etiqueta = this._itemLabel(base.p.item_id).toLowerCase();
                lift = /\btable\b|\bmesa\b|desk|cama|\bbed\b/.test(etiqueta) ? 0.95 : 0.62;
            }
            info.set(a.p, { lift, liftX, base: base.p, exacto: !!off });
        };

        for (const a of meta) {
            // 1) La pieza dice de quién se apoya. No hay nada que adivinar.
            if (a.p.parentPlacementID != null) {
                const padre = porID.get(String(a.p.parentPlacementID));
                if (padre) { anotar(a, padre); continue; }
            }
            if (a.p.parentItemId != null && hayDatos && SG.sostiene(a.p.parentItemId)) {
                anotar(a, { p: { item_id: a.p.parentItemId, orientation: a.p.parentOrientation } });
                continue;
            }

            // 2) Si no, se busca debajo por solape, pero exigiendo que el candidato
            //    SOSTENGA de verdad (hasSubGroup) en vez de deducirlo del nombre.
            let base = null, best = -1;
            for (const b of meta) {
                if (a.p === b.p) continue;
                const overlap = a.p.floor === b.p.floor && a.p.x < b.p.x + b.w && a.p.x + a.w > b.p.x
                    && a.p.y < b.p.y + b.l && a.p.y + a.l > b.p.y;
                if (!overlap) continue;
                const sostiene = hayDatos ? SG.sostiene(b.p.item_id) : b.role.surface;
                if (hayDatos) {
                    // Con datos: solo cuenta lo que el juego marca como superficie, y la
                    // pieza de encima no puede ser a su vez la base de esta.
                    if (!sostiene) continue;
                    if (SG.sostiene(a.p.item_id) && b.area <= a.area) continue;
                } else {
                    const aOnB = (b.role.surface && !a.role.surface)
                        || (a.role.topper && !b.role.topper)
                        || (!a.role.surface && !a.role.topper && b.area > a.area);
                    if (!aOnB) continue;
                }
                const score = (sostiene ? 10 : 0) + b.area;
                if (score > best) { best = score; base = b; }
            }
            anotar(a, base);
        }
        return info;
    }

    _isCellInSurfacePoly(surf, gx, gy, w = 1, l = 1) {
        if (!surf || !surf.poly || surf.poly.length < 3) return true;
        const { cw_u, ch_u } = this._getSurfaceCellUnits(surf);
        
        // Check center of the item
        const cx = gx + w / 2;
        const cy = gy + l / 2;
        const cwx = (cx - cy) * (cw_u / 2);
        const cwy = (cx + cy) * (ch_u / 2);
        if (this._pointInPoly(cwx, cwy, surf.poly)) return true;

        // Check origin of the tile
        const owx = (gx - gy) * (cw_u / 2);
        const owy = (gx + gy) * (ch_u / 2);
        if (this._pointInPoly(owx, owy, surf.poly)) return true;

        // Check the remaining corners
        const corners = [
            [gx + w, gy],
            [gx, gy + l],
            [gx + w, gy + l]
        ];
        for (const [px, py] of corners) {
            const wx = (px - py) * (cw_u / 2);
            const wy = (px + py) * (ch_u / 2);
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
                // All snap candidates are outside the polygon — block at original placement position
                return { x: p.x, y: p.y };
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
        const { cw_u, ch_u } = this._getSurfaceCellUnits(surf);
        const corners = [
            [wx, wy],
            [wx + w, wy],
            [wx, wy + h],
            [wx + w, wy + h],
            [wx + w / 2, wy + h / 2]
        ];
        // El `poly` de una pared va en coordenadas de MUNDO relativas a su origen
        // (`tools/sync_surface_anchors.py`: `p.x - origen.x`), que es justo lo que
        // devuelve `Castle.Iso.wallPoint`. Aquí la cuenta estaba escrita a mano, con el
        // signo del término vertical cambiado y fijando la cara no volteada, y por eso
        // NUNCA daba dentro: de los 36 muebles de pared de los saves de prueba, cero
        // caían en su polígono. Con la fórmula buena caen los 36, en ambas caras.
        //
        // No se notaba porque el que llama cae al recorte rectangular cuando esto falla:
        // el arrastre dejaba poner muebles fuera de la forma real de la pared.
        const flipped = !!surf.flipped;
        const c = window.Castle.Iso.wallPoint(wx + w / 2, wy + h / 2, flipped, cw_u, ch_u);
        if (!this._pointInPoly(c.x, c.y, surf.poly)) return false;

        let insideCount = 0;
        for (const [x, y] of corners) {
            const q = window.Castle.Iso.wallPoint(x, y, flipped, cw_u, ch_u);
            if (this._pointInPoly(q.x, q.y, surf.poly)) insideCount++;
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

        const layerRadio = this._layerRadio();
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
        const layerRadio = this._layerRadio();
        const isWallLayer = layerRadio && layerRadio.value === 'wall';
        if (p.isWall && isWallLayer) {
            const sz = this.getWallSize(p.item_id);
            const gx = 100 + x * this.gridSize;
            const gy = 100 + y * this.gridSize;
            this.ctx.strokeStyle = '#f5c542';
            this.ctx.fillStyle = 'rgba(245, 197, 66, 0.18)';
            this.ctx.lineWidth = 2.5;
            this.ctx.fillRect(gx, gy, this.gridSize * sz.w, this.gridSize * sz.h);
            this.ctx.strokeRect(gx, gy, this.gridSize * sz.w, this.gridSize * sz.h);
        } else if (p.isWall) {
            const sz = this.getWallSize(p.item_id);
            this.ctx.strokeStyle = '#f5c542';
            this.ctx.fillStyle = 'rgba(245, 197, 66, 0.18)';
            this.ctx.lineWidth = 2.5;
            this._pathWallCell(x, y, sz.w, sz.h, !!p.flipped, this._wallRoomBBox, p.floor);
            this.ctx.fill();
            this.ctx.stroke();
        } else {
            const { w, l } = this.getRotatedSize(p.item_id, p.orientation);
            // Check if current snap position is inside the surface polygon
            const locVal = document.getElementById('select-location')?.value;
            const targetLoc = p.cluster != null ? p.cluster : (locVal !== '' && locVal != null ? parseInt(locVal, 10) : 0);
            const surf = this.surfaceFor(targetLoc, p.floor, false, false);
            const isOutOfBounds = surf && surf.poly && surf.poly.length > 2
                && !this._isCellInSurfacePoly(surf, x, y, w, l);

            if (isOutOfBounds) {
                // Red ghost = placement blocked by boundary
                this.ctx.strokeStyle = '#f44336';
                this.ctx.fillStyle = 'rgba(244, 67, 54, 0.25)';
            } else {
                this.ctx.strokeStyle = '#f5c542';
                this.ctx.fillStyle = 'rgba(245, 197, 66, 0.18)';
            }
            this.ctx.lineWidth = 2.5;

            // Draw isometric diamond footprint using getIsoCoords
            const pt1 = this.getIsoCoords(x,     y,     p.floor, targetLoc);
            const pt2 = this.getIsoCoords(x + w, y,     p.floor, targetLoc);
            const pt3 = this.getIsoCoords(x + w, y + l, p.floor, targetLoc);
            const pt4 = this.getIsoCoords(x,     y + l, p.floor, targetLoc);
            this.ctx.beginPath();
            this.ctx.moveTo(pt1.x, pt1.y);
            this.ctx.lineTo(pt2.x, pt2.y);
            this.ctx.lineTo(pt3.x, pt3.y);
            this.ctx.lineTo(pt4.x, pt4.y);
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.stroke();

            if (isOutOfBounds) {
                // Show "⛔" warning label at ghost center
                const cx = (pt1.x + pt3.x) / 2;
                const cy = (pt1.y + pt3.y) / 2;
                this.ctx.font = `bold ${Math.max(14, Math.round(16 * this.scale))}px sans-serif`;
                this.ctx.fillStyle = '#f44336';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.shadowColor = 'rgba(0,0,0,0.7)';
                this.ctx.shadowBlur = 4;
                this.ctx.fillText('⛔', cx, cy);
            }
        }
        this.ctx.restore();
    }


    _hitTestPlaySurface(screenX, screenY, preferredKind = null) {
        if (!window.mapsAtlas) return null;
        if (!document.body.classList.contains('play-mode')) return null;
        const sel = document.getElementById('select-location');
        const targetLoc = sel && sel.value !== "" ? parseInt(sel.value, 10) : 0;

        // Para COLOCAR cosas no basta con que el piso se vea: durante la obra el
        // grupo 4 esta a la vista pero tapado, y el juego no deja poner nada ahi.
        const showHC = this._homecomingDecorable();

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
            const { ox, oy } = this._getSurfaceOrigin(surf, surf.mapId != null ? surf.mapId : targetLoc);
            const { cw_u, ch_u } = this._getSurfaceCellUnits(surf);

            const worldX = (screenX - this.offsetX) / (150 * u);
            const worldY = (this.offsetY - screenY) / (150 * u);
            const wx = worldX - ox;
            const wy = worldY - oy;
            const U = wx / (cw_u / 2);
            const V = wy / (ch_u / 2);
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
                    const { cw_u, ch_u } = this._getSurfaceCellUnits(wSurf);
                    // Misma corrección: se calculaba `isFlipped` justo arriba y luego la
                    // cuenta lo ignoraba, con el signo vertical cambiado además. El test
                    // fallaba siempre, así que ninguna pared llegaba a seleccionarse.
                    const rel = window.Castle.Iso.wallPoint(wx, wy, isFlipped, cw_u, ch_u);
                    if (wSurf.poly && wSurf.poly.length > 2) {
                        if (!this._pointInPoly(rel.x, rel.y, wSurf.poly)) continue;
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
        if (item_id == null || item_id === -1) return false;
        const idNum = Number(item_id);
        const WALL_IDS = new Set([98, 2140, 2146]);
        if (WALL_IDS.has(idNum)) return true;
        
        const db = (typeof window !== 'undefined' && window.ITEMS_DB) ? window.ITEMS_DB[String(idNum)] : null;
        if (db) {
            const beh = db.behaviour || {};
            if (beh.kind === 'wallpaper' || beh.place === 'cover_wall' || beh.kind === 'floor' || beh.place === 'cover_floor') {
                return false;
            }
            const cat = (db.category || '').toUpperCase();
            if (cat.includes('WALLPAPER') || cat.includes('FLOOR')) return false;
            if (cat.includes('WALLDECO') || cat.includes('LAMP') || cat.includes('POSTER')) return true;
            
            const name = (db.furn_name || db.item_name || '').toUpperCase();
            if (name.includes('WALLPAPER') || name.includes('TAPIZ') || name.includes('SUELO') || name.includes('AZULEJO')) return false;
            if (name.includes('WALL LAMP') || name.includes('WALLDECO') || name.includes('POSTER') || name.includes('LÁMPARA DE PARED') || name.includes('CUADRO') || name.includes('WALL')) return true;
        }
        return false;
    }
    
    isCovering(item_id) {
        if (item_id == null || item_id === -1) return null;
        const idNum = Number(item_id);
        
        // Exceptional cases: if it is explicitly wall furniture (e.g. 98, lamps), don't return it as a covering
        if (this.isWallFurniture(item_id)) return null;

        const db = (typeof window !== 'undefined' && window.ITEMS_DB) ? window.ITEMS_DB[String(idNum)] : null;
        if (db) {
            const beh = db.behaviour || {};
            if (beh.kind === 'wallpaper' || beh.place === 'cover_wall') return 'wallpaper';
            if (beh.kind === 'floor' || beh.place === 'cover_floor') return 'floor';
            const cat = (db.category || '').toUpperCase();
            if (cat.includes('WALLPAPER')) return 'wallpaper';
            if (cat.includes('FLOOR')) return 'floor';
            const name = (db.furn_name || db.item_name || '').toUpperCase();
            if (name.includes('WALLPAPER') || name.includes('TAPIZ')) return 'wallpaper';
            if (name.includes('FLOORING') || name.includes('AZULEJO') || name.includes('SUELO')) return 'floor';
        }

        const COVERING_FLOORS = new Set([100, 1166, 1167, 1168, 1169, 128, 130, 1602, 1603, 1604, 1605, 1606, 1607, 1608, 1609, 1610, 1611, 1612, 1613, 1614, 1615, 1861, 1862, 1863, 1864, 1866, 1867, 2181, 240, 242, 244, 245, 246, 250, 347, 67, 69, 749, 750, 755, 796, 797, 798, 95, 98, 99]);
        const COVERING_WALLPAPERS = new Set([1118, 1316, 1585, 1588, 1589, 1590, 1591, 1592, 1594, 1595, 1596, 1599, 1617, 2009, 2084, 2127, 2128, 2129, 2195, 2308, 2424, 2484, 2486, 396, 410, 417, 418, 419, 420, 421, 752, 753, 754, 755, 756, 757, 760, 761, 762, 763, 764, 765, 787, 794, 795, 804, 882, 883, 884, 914]);

        if (COVERING_FLOORS.has(idNum)) return 'floor';
        if (COVERING_WALLPAPERS.has(idNum)) return 'wallpaper';
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
                    const pivot = this._resolveSpritePivot(p.item_id, img, p.orientation || 0) || { x: 0.5, y: (p.isWall ? 0.5 : 0.25) };
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
        if (document.body.classList.contains('play-mode')) {
            this.startPlayAnimationLoop();
        }
        if (this._rafId !== undefined) return;
        this._rafId = requestAnimationFrame(() => {
            this._rafId = undefined;
            this._drawImmediate();
        });
    }

    startPlayAnimationLoop() {
        if (this._playAnimTimer) return;
        this._playAnimTimer = setInterval(() => {
            if (!document.body.classList.contains('play-mode')) {
                clearInterval(this._playAnimTimer);
                this._playAnimTimer = null;
                return;
            }
            const targetLocStr = document.getElementById('select-location')?.value;
            const targetLoc = (this.locationId != null) ? this.locationId : (targetLocStr !== undefined && targetLocStr !== "" ? parseInt(targetLocStr, 10) : 0);
            const def = window.MapDef && window.MapDef.get(targetLoc);
            const hasInteractiveProps = def && def.logic && def.logic.interactive_props && def.logic.interactive_props.some(p => p.anim);
            const hasNpcActs = def && def.logic && def.logic.npc_activities && def.logic.npc_activities.length > 0;
            const isTrainActive = (targetLoc === 10 || targetLoc === 15) && window.Train && typeof window.Train.posicion === 'function' &&
                ['entrando', 'saliendo', 'de largo'].includes(window.Train.posicion()?.tramo);
            if (this._activeFurnitureActors > 0 || hasInteractiveProps || hasNpcActs || isTrainActive || (window.RoutineScheduler && window.RoutineScheduler.currentSchedule && window.RoutineScheduler.currentSchedule.ambientActors && window.RoutineScheduler.currentSchedule.ambientActors.length > 0)) {
                this.draw();
            }
        }, 125);
    }

    /**
     * El radio de capa (piso/pared) del editor, memorizado.
     *
     * `querySelector('input[name=...]:checked')` cuesta unos 0,34 ms con los ~6700 nodos
     * que tiene la página, y se llamaba UNA VEZ POR OBJETO en cada repintado: con 30
     * muebles eran 10 ms de fotograma tirados solo en buscar un radio que no cambia
     * mientras se dibuja. Se resuelve una vez por dibujado.
     */
    _layerRadio() {
        if (this._lrTick !== this._drawTick) {
            this._lrTick = this._drawTick;
            this._lrValue = document.querySelector('input[name="map-layer"]:checked');
        }
        return this._lrValue;
    }

    /**
     * Ruta del fondo ensamblado de un mapa. La usan el dibujado y el límite de cámara,
     * y **tiene que ser la misma cadena** en los dos: getBackgroundImage() cachea por
     * ruta, así que dos formas distintas de nombrar el mismo PNG lo descargarían dos veces.
     */
    backgroundPathFor(loc) {
        // En las estaciones el fondo es la capa SIN el tren: el `_Ensamblado.png`
        // original lo lleva horneado dentro y entonces no se puede mover. El tren se
        // pinta aparte en `_dibujarCapaTren()`. Si el indice no esta cargado, se sigue
        // usando el ensamblado de siempre.
        const capas = (window.Train && typeof window.Train.capas === 'function')
            ? window.Train.capas(loc) : null;
        if (capas) {
            if (Number(loc) === 14 && capas.vagon) return capas.vagon;
            if (capas.fondo) return capas.fondo;
        }

        const cfg = (window.MapDef && window.MapDef.config(loc)) || null;
        if (cfg && cfg.assembled && cfg.assetsDir) {
            return cfg.assetsDir.replace(/^(?:\.\.\/)+/, '') + '/' + cfg.assembled;
        }
        const meta = (window.MAP_META && window.MAP_META[loc]) || {};
        // Si la entrada trae `assetsDir` (viene del JSON del mapa), esa manda: es la
        // unica que sabe que el mapa 10 se dibuja con el arte de level9.
        if (meta.assetsDir && meta.assembled) {
            return meta.assetsDir.replace(/^(?:\.\.\/)+/, '') + '/' + meta.assembled;
        }
        const dir = meta.exportDir != null ? meta.exportDir : (loc === 0 ? 2 : loc);
        // Misma forma que la rama del JSON, para que la clave de cache coincida.
        return 'images/maps/Exportado_level' + dir + '/' + (meta.assembled || ('level' + dir + '_Ensamblado.png'));
    }

    _clampCamera() {
        if (!document.body.classList.contains('play-mode')) return;
        const targetLocStr = document.getElementById('select-location')?.value;
        const targetLoc = targetLocStr !== undefined && targetLocStr !== "" ? parseInt(targetLocStr, 10) : 0;

        // El fondo del mapa que toca. Antes se rebuscaba en la caché la primera entrada
        // que contuviera 'level', que podía ser la de otro mapa, y el límite solo se
        // aplicaba a la Casa del Árbol: en el resto se podía alejar sin fin y el
        // repintado se volvía lentísimo en equipos modestos.
        const bgImg = this._bgCache
            && this._bgCache[this._rutaFondoCanonica(this.backgroundPathFor(targetLoc))];
        if (!bgImg || !bgImg.width) return;

        const bgScale = (window.atlasConfig && window.atlasConfig.bgScale) || 0.75;
        const cw = this.canvas.width;
        const ch = this.canvas.height;

        // El ancla mundo->pixel del mapa, la misma que usa el dibujado.
        const cfgCam = (window.MapDef && window.MapDef.config(targetLoc)) || null;
        const originPx = {
            x: (cfgCam && cfgCam.origin_px ? cfgCam.origin_px.x : (targetLoc === 0 ? 1235 : bgImg.width / 2)),
            y: (cfgCam && cfgCam.origin_px ? cfgCam.origin_px.y : (targetLoc === 0 ? 1257 : bgImg.height / 2)),
        };

        const bgW = bgImg.width * bgScale;
        const bgH = bgImg.height * bgScale;

        // Que se encuadra: el arte entero, o solo el trozo que interesa.
        //
        // En la Estación de Tren el lienzo abarca TODO el recorrido del tren, así que
        // encuadrarlo completo dejaba la estación diminuta y se perdía el efecto de
        // llegada: se veía el sprite del tren cruzando de lejos. El horneado deja en
        // `train_layers.json` el recuadro de la estación y se usa ése, que además fija
        // el tope de alejamiento.
        const capasEnc = (window.Train && typeof window.Train.capas === 'function')
            ? window.Train.capas(targetLoc) : null;
        const enc = capasEnc && capasEnc.encuadre;
        const encW = enc ? (enc.x1 - enc.x0) : bgImg.width;
        const encH = enc ? (enc.y1 - enc.y0) : bgImg.height;
        let encCx = enc ? (enc.x0 + enc.x1) / 2 : bgImg.width / 2;
        let encCy = enc ? (enc.y0 + enc.y1) / 2 : bgImg.height / 2;

        const vagonActual = (window.Train && typeof window.Train.vagonActual === 'function')
            ? window.Train.vagonActual() : 1;
        const enEstacion = (targetLoc === 10 || targetLoc === 15);
        const trenParado = window.Train && typeof window.Train.estado === 'function' && window.Train.estado() && window.Train.estado().status === 2;
        const verTecho = window.Train && typeof window.Train.techoAbierto === 'function' && window.Train.techoAbierto();

        if (targetLoc === 14) {
            encCx = originPx.x + (vagonActual - 1) * 1200.0;
            encCy = originPx.y - (vagonActual - 1) * 600.0;
        } else if (enEstacion && trenParado && verTecho && capasEnc && capasEnc.centros) {
            const wc = capasEnc.centros[vagonActual] || capasEnc.centros[1];
            if (wc) {
                encCx = originPx.x + wc.x * 150.0;
                encCy = originPx.y - wc.y * 150.0;
            }
        }

        // Mínimo: que quepa lo encuadrado, con margen configurable o 15 % por defecto.
        let zoomMinFactor = (capasEnc && typeof capasEnc.zoom_min === 'number') ? capasEnc.zoom_min : 1.15;
        if (enEstacion && trenParado && verTecho) {
            zoomMinFactor = 1.45;
        }
        const targetScale = Math.min(cw / (encW * bgScale), ch / (encH * bgScale)) * zoomMinFactor;
        // La Casa del Árbol se queda como estaba (apenas deja acercarse); los demás mapas
        // son mucho mayores y sí necesitan acercarse para trabajar en ellos.
        const maxZoom = (targetLoc === 0) ? 1.3 : 3.0;
        this.scale = Math.max(targetScale, Math.min(this.scale, targetScale * maxZoom));
        
        const drawnW = encW * bgScale * this.scale;
        const drawnH = encH * bgScale * this.scale;
        
        // Clampeamos el paneo al 10% (0.1) como pidió el usuario.
        // Usamos min/max dinámicos para centrar si la imagen es pequeña,
        // pero manteniendo el margen de 10% de tope.
        // Mantener el centro (0, 0) del nivel dentro de la vista con margen cómodo
        const maxPanX = drawnW * 0.35;
        const maxPanY = drawnH * 0.35;
        const defaultCenterX = cw / 2;
        const defaultCenterY = ch / 2;

        // Encuadre inicial de cada mapa o al cambiar de vagón.
        const encKey = targetLoc === 14
            ? (targetLoc + '_' + vagonActual)
            : (enEstacion && trenParado && verTecho
                ? (targetLoc + '_' + vagonActual + '_open')
                : targetLoc);
        if (this._mapaEncuadrado !== encKey) {
            this._mapaEncuadrado = encKey;
            this.scale = targetScale;
            const sNuevo = bgScale * this.scale;
            this.offsetX = defaultCenterX - (encCx - originPx.x) * sNuevo;
            this.offsetY = defaultCenterY - (encCy - originPx.y) * sNuevo;
            return;
        }

        const sActual = bgScale * this.scale;
        const baseCenterX = defaultCenterX - (encCx - originPx.x) * sActual;
        const baseCenterY = defaultCenterY - (encCy - originPx.y) * sActual;
        this.offsetX = Math.max(baseCenterX - maxPanX, Math.min(this.offsetX, baseCenterX + maxPanX));
        this.offsetY = Math.max(baseCenterY - maxPanY, Math.min(this.offsetY, baseCenterY + maxPanY));
    }

    /**
     * Pinta el tren de una estacion, corrido por la via.
     *
     * La capa `_Tren.png` tiene el mismo tamano y el mismo origen que el fondo, asi que
     * con desplazamiento cero cae exactamente donde estaba en el `_Ensamblado.png`.
     * Lo que la mueve es `Train.desplazamiento()`, en unidades de mundo sobre la
     * diagonal isometrica, que se pasan a pixeles igual que todo lo demas:
     *
     *     px = origen.x + x * 150      py = origen.y - y * 150
     *
     * Cuando el tren esta parado (`Waiting`) el desplazamiento es 0 y la estacion se ve
     * igual que siempre.
     */
    _dibujarCapaTren(ctx, targetLoc, dx, dy, s) {
        if (!window.Train || typeof window.Train.capas !== 'function') return;
        const capas = window.Train.capas(targetLoc);
        if (!capas || !capas.tren) return;

        const studioActive = window.TrainStudio && typeof window.TrainStudio.isActive === 'function' && window.TrainStudio.isActive(targetLoc);
        const hideTren = studioActive && window.TrainStudio.isLayerHidden && window.TrainStudio.isLayerHidden('tren');
        const hideEncima = studioActive && window.TrainStudio.isLayerHidden && window.TrainStudio.isLayerHidden('encima');

        const img = this.getBackgroundImage(capas.tren);
        const off = studioActive
            ? window.TrainStudio.getDesplazamiento(targetLoc)
            : window.Train.desplazamiento(targetLoc);

        if (!hideTren && img && img.complete && img.width) {
            if (off && off.tramo === 'fuera') {
                // Fuera de escena: no se dibuja el tren (para no romper la magia del trayecto)
            } else {
                const mx = off ? off.x * 150 * s : 0;
                const my = off ? off.y * 150 * s : 0;
                ctx.drawImage(img, dx + mx, dy - my, img.width * s, img.height * s);

                // Efecto de apertura de techo circular (Iris reveal) cuando el tren está detenido
                const reveal = (window.Train && typeof window.Train.revealProgress === 'function')
                    ? window.Train.revealProgress() : 0;
                const vagonActual = (window.Train && typeof window.Train.vagonActual === 'function')
                    ? window.Train.vagonActual() : 1;
                const centros = capas.centros;
                const wc = centros ? (centros[vagonActual] || centros[1]) : null;

                if (reveal > 0.001 && wc && capas.tren_sin_techo) {
                    const imgSinTecho = this.getBackgroundImage(capas.tren_sin_techo);
                    if (imgSinTecho && imgSinTecho.complete && imgSinTecho.width) {
                        const cfgCam = (window.MapDef && window.MapDef.config(targetLoc)) || null;
                        const originPxX = cfgCam && cfgCam.origin_px ? cfgCam.origin_px.x : (targetLoc === 10 ? 1207 : (img.width / 2));
                        const originPxY = cfgCam && cfgCam.origin_px ? cfgCam.origin_px.y : (targetLoc === 10 ? 3300 : (img.height / 2));
                        const circleCx = (dx + mx) + (originPxX + wc.x * 150.0) * s;
                        const circleCy = (dy - my) + (originPxY - wc.y * 150.0) * s;
                        const maxRadius = 380 * s;
                        const curRadius = maxRadius * reveal;

                        ctx.save();
                        ctx.beginPath();
                        ctx.arc(circleCx, circleCy, curRadius, 0, Math.PI * 2);
                        ctx.clip();

                        // 1. Dibujar el interior del vagón (tren sin techo)
                        ctx.drawImage(imgSinTecho, dx + mx, dy - my, imgSinTecho.width * s, imgSinTecho.height * s);

                        // 2. Grilla isométrica decorable
                        this._drawWagonGrid(ctx, targetLoc, vagonActual, circleCx, circleCy, s);

                        // 3. Muebles y props del vagón
                        this._drawWagonPlacements(ctx, targetLoc, vagonActual, circleCx, circleCy, s);

                        // 4. NPCs en el tren
                        this._drawWagonNpcs(ctx, targetLoc, vagonActual, circleCx, circleCy, s);

                        ctx.restore();

                        // 5. Borde / halo luminoso del círculo de apertura
                        if (curRadius > 4) {
                            ctx.save();
                            ctx.beginPath();
                            ctx.arc(circleCx, circleCy, curRadius, 0, Math.PI * 2);
                            ctx.lineWidth = Math.max(2, 3.5 * s);
                            ctx.strokeStyle = 'rgba(255, 235, 170, 0.9)';
                            ctx.shadowColor = 'rgba(255, 200, 80, 0.7)';
                            ctx.shadowBlur = 10 * s;
                            ctx.stroke();
                            ctx.restore();
                        }
                    }
                }
            }
        }

        // Y encima, lo que el juego pinta DESPUES del tren: el edificio de la estacion,
        // los pilares y los arboles. Sin esto el tren les pasa por delante y sus luces
        // —que deberian quedar medio tapadas— se ven como manchas blancas sueltas.
        if (!hideEncima && capas.encima) {
            const arriba = this.getBackgroundImage(capas.encima);
            if (arriba && arriba.complete && arriba.width) {
                ctx.drawImage(arriba, dx, dy, arriba.width * s, arriba.height * s);
            }
        }

        const isAnimating = (studioActive && off && off.animando) ||
            (document.body.classList.contains('play-mode') && off && (off.tramo === 'entrando' || off.tramo === 'saliendo' || off.tramo === 'de largo'));

        if (isAnimating) {
            if (!this._trenRafId) {
                this._trenRafId = requestAnimationFrame(() => {
                    this._trenRafId = null;
                    this.draw();
                });
            }
        }
    }

    /** Dibuja la grilla de colocación isométrica para el vagón revelado */
    _drawWagonGrid(ctx, targetLoc, vagonActual, circleCx, circleCy, s) {
        const cw_u = 0.5, ch_u = 0.25;
        const halfW = (cw_u / 2) * 150 * s;
        const halfH = (ch_u / 2) * 150 * s;
        
        ctx.save();
        ctx.translate(circleCx, circleCy);
        
        const pt = (gx, gy) => ({
            x: (gx - gy) * halfW,
            y: -(gx + gy) * halfH
        });
        const minGx = -6, maxGx = 6;
        const minGy = -6, maxGy = 6;
        
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(0, 255, 120, 0.40)';
        ctx.beginPath();
        for (let gx = minGx; gx <= maxGx; gx++) {
            const p1 = pt(gx, minGy);
            const p2 = pt(gx, maxGy);
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
        }
        for (let gy = minGy; gy <= maxGy; gy++) {
            const p1 = pt(minGx, gy);
            const p2 = pt(maxGx, gy);
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
        }
        ctx.stroke();
        ctx.restore();
    }

    /** Dibuja el mobiliario / placements colocados en el vagón revelado */
    _drawWagonPlacements(ctx, targetLoc, vagonActual, circleCx, circleCy, s) {
        if (!this.app || !this.app.parser || !this.app.parser.placements) return;
        const targetCluster = 'train_vagon_' + (vagonActual + 1);
        const wagonPlacements = this.app.parser.placements.filter(
            p => String(p.cluster) === String(targetCluster) && Number(p.item_id) > 0 && !p.isWall
        );
        if (wagonPlacements.length === 0) return;

        const cw_u = 0.5, ch_u = 0.25;
        const halfW = (cw_u / 2) * 150 * s;
        const halfH = (ch_u / 2) * 150 * s;

        const sorted = [...wagonPlacements].sort((a, b) => {
            return ((b.x || 0) + (b.y || 0)) - ((a.x || 0) + (a.y || 0));
        });

        for (const p of sorted) {
            const img = (typeof this.getItemCustomImage === 'function')
                ? this.getItemCustomImage(p.item_id)
                : ((typeof this.getItemImage === 'function') ? this.getItemImage(p.item_id) : null);
            if (!img || !img.complete || !img.naturalWidth) continue;

            const isoX = circleCx + ((p.x || 0) - 6 - ((p.y || 0) - 6)) * halfW;
            const isoY = circleCy - ((p.x || 0) - 6 + ((p.y || 0) - 6)) * halfH;

            const itemScale = (window.atlasConfig && window.atlasConfig.bgScale ? window.atlasConfig.bgScale : 0.75) * this.scale;
            const iw = img.naturalWidth * itemScale;
            const ih = img.naturalHeight * itemScale;

            ctx.save();
            ctx.translate(isoX, isoY);
            if (p.flipped) ctx.scale(-1, 1);
            ctx.drawImage(img, -iw * 0.5, -ih, iw, ih);
            ctx.restore();
        }
    }

    /** Dibuja los NPCs activos en el tren sobre sus asientos en el vagón revelado */
    _drawWagonNpcs(ctx, targetLoc, vagonActual, circleCx, circleCy, s) {
        if (!this.app || !this.app.parser || typeof this.app.parser.getNpcsOnTrain !== 'function') return;
        const trainNpcData = this.app.parser.getNpcsOnTrain();
        const npcs = (trainNpcData && trainNpcData.npcs) || [];
        if (!npcs || npcs.length === 0) return;

        const slots = [
            { x: -55 * s, y: -15 * s, flip: false, defaultAnim: 'Sit' },
            { x: 55 * s,  y: 10 * s,  flip: true,  defaultAnim: 'Sit' },
            { x: -20 * s, y: -35 * s, flip: false, defaultAnim: 'Idle' },
            { x: 25 * s,  y: -20 * s, flip: true,  defaultAnim: 'Sit' },
        ];

        const npcsForWagon = [];
        npcs.forEach((npcId, idx) => {
            if ((idx % 3) === vagonActual) {
                npcsForWagon.push(String(npcId));
            }
        });

        const u = (window.atlasConfig && window.atlasConfig.bgScale ? window.atlasConfig.bgScale : 0.75) * this.scale;
        npcsForWagon.forEach((npcId, slotIdx) => {
            const slot = slots[slotIdx % slots.length];
            const npcDef = (window.NPC_DB && window.NPC_DB[npcId]) || (window.NPC_DB && window.NPC_DB['0']);
            if (!npcDef) return;

            let frames = null;
            if (window.resolveNpcAnimFrames) {
                frames = window.resolveNpcAnimFrames(npcId, slot.defaultAnim)
                      || window.resolveNpcAnimFrames(npcId, 'Idle')
                      || window.resolveNpcAnimFrames(npcId, 'Walk');
            }
            const spritePath = (frames && frames[0]) || (npcDef.name ? (npcDef.name + '/Idle_0') : 'Tsuki/Idle_0');
            const npcImg = this.getNpcSprite(spritePath);
            if (!npcImg || !npcImg.complete || !npcImg.naturalWidth) return;

            const nw = npcImg.naturalWidth * u;
            const nh = npcImg.naturalHeight * u;
            const posX = circleCx + slot.x;
            const posY = circleCy + slot.y;

            ctx.save();
            ctx.translate(posX, posY);
            if (slot.flip) ctx.scale(-1, 1);
            ctx.drawImage(npcImg, -nw * 0.5, -nh, nw, nh);
            ctx.restore();
        });
    }

    /**
     * Dibuja el paisaje exterior con parallax detrás de las ventanas del vagón (mapa 14).
     * El scroll sigue la diagonal isométrica (1, 0.5) normalizada (DirMag = 1.118034).
     * Rota cíclicamente entre las 4 fases (Country, Bridge, Tunnel, City) cada 10 s.
     */
    _dibujarFondoViaje(ctx, targetLoc, dx, dy, s) {
        if (targetLoc !== 14) return;
        const capas = (window.Train && typeof window.Train.capas === 'function')
            ? window.Train.capas(targetLoc) : null;
        const fondoPath = (capas && capas.fondo) || 'images/maps/Exportado_level48/level48_Fondo.png';
        const img = this.getBackgroundImage(fondoPath);
        if (!img || !img.complete || !img.width) return;

        const cw = this.canvas.width, ch = this.canvas.height;
        const now = (typeof performance !== 'undefined' && performance.now)
            ? performance.now() / 1000 : Date.now() / 1000;
        const fase = (window.Train && typeof window.Train.faseViaje === 'function')
            ? window.Train.faseViaje(now) : { clave: 'Country' };

        const ux = 0.894427, uy = 0.447214;
        const vel = 260 * s;
        const anchoScroll = img.width * s;
        const altoScroll = img.height * s;
        const mod = (now * vel) % (anchoScroll > 0 ? anchoScroll : 1000);

        const offX = mod * ux;
        const offY = mod * uy;

        ctx.save();
        for (let i = -1; i <= 2; i++) {
            const px = dx - offX + i * anchoScroll * ux;
            const py = dy + offY - i * altoScroll * uy;
            ctx.drawImage(img, px, py, anchoScroll, altoScroll);
        }

        if (fase.clave === 'Tunnel') {
            ctx.fillStyle = 'rgba(12, 10, 20, 0.88)';
            ctx.fillRect(0, 0, cw, ch);
            const lamp = (now * 1.8) % 1.0;
            if (lamp < 0.12) {
                ctx.fillStyle = 'rgba(255, 200, 110, 0.18)';
                ctx.fillRect(0, 0, cw, ch);
            }
        } else if (fase.clave === 'Bridge') {
            ctx.fillStyle = 'rgba(60, 120, 170, 0.15)';
            ctx.fillRect(0, 0, cw, ch);
        } else if (fase.clave === 'City') {
            ctx.fillStyle = 'rgba(170, 110, 70, 0.12)';
            ctx.fillRect(0, 0, cw, ch);
        }
        ctx.restore();

        if (document.body.classList.contains('play-mode') && !this._viajeRafId) {
            this._viajeRafId = requestAnimationFrame(() => {
                this._viajeRafId = null;
                this.draw();
            });
        }
    }

    /**
     * Vuelca un lienzo horneado en pantalla recortando al área visible.
     * (dx,dy) es dónde caería su esquina superior izquierda y `s` la escala.
     */
    _blitBaked(ctx, src, dx, dy, s) {
        const cw = this.canvas.width, ch = this.canvas.height;
        let sx = Math.floor(Math.max(0, (0 - dx) / s));
        let sy = Math.floor(Math.max(0, (0 - dy) / s));
        const sx2 = Math.ceil(Math.min(src.width, (cw - dx) / s));
        const sy2 = Math.ceil(Math.min(src.height, (ch - dy) / s));
        const sw = sx2 - sx, sh = sy2 - sy;
        if (sw <= 0 || sh <= 0) return;          // fuera de pantalla: nada que pintar
        ctx.drawImage(src, sx, sy, sw, sh, dx + sx * s, dy + sy * s, sw * s, sh * s);
    }

    /**
     * Copia de la escena para mover la cámara sin reconstruirla.
     *
     * Mientras se arrastra, lo único que cambia es DÓNDE se mira: el contenido es el
     * mismo. Se dibuja una vez en un lienzo con margen alrededor y los fotogramas
     * siguientes son un solo `drawImage` desplazado. Cuando el arrastre se sale del
     * margen, se vuelve a capturar. Al soltar, la copia se tira y se dibuja normal.
     *
     * Efecto secundario aceptado: los personajes y las animaciones quedan congelados
     * mientras arrastras. Vuelven en cuanto sueltas.
     */
    _panMargin() {
        const m = Math.round(Math.min(this.canvas.width, this.canvas.height) * 0.4);
        return Math.max(120, Math.min(360, m));
    }

    /** Vuelca la copia desplazada. false si no sirve (zoom distinto o fuera de margen). */
    _panBlit(force) {
        const pc = this._panCache;
        if (!pc || !this._panCanvas) return false;
        if (pc.scale !== this.scale) return false;
        const dx = this.offsetX - pc.ox;
        const dy = this.offsetY - pc.oy;
        if (!force && (Math.abs(dx) > pc.m || Math.abs(dy) > pc.m)) return false;
        const ctx = this.ctx;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.drawImage(this._panCanvas, -pc.m + dx, -pc.m + dy);
        this._panOverlays();
        return true;
    }

    /** Recoloca el panel flotante del objeto seleccionado (editor). */
    _updateFloatUI() {
        const floatUI = document.getElementById('floating-ui');
        if (!floatUI) return;
        if (!this.selectedPlacement) { floatUI.style.display = 'none'; return; }
        floatUI.style.display = 'block';
        const layerRadio = this._layerRadio();
        let x, y;
        if (layerRadio && layerRadio.value === 'wall') {
            x = 100 + this.selectedPlacement.x * this.gridSize;
            y = 100 + this.selectedPlacement.y * this.gridSize;
        } else {
            const iso = this.getIsoCoords(this.selectedPlacement.x, this.selectedPlacement.y, this.selectedPlacement.floor);
            x = iso.x; y = iso.y;
        }
        floatUI.style.left = x + 'px';
        floatUI.style.top = y + 'px';
    }

    /** Lo que NO va en la copia porque vive fuera del lienzo o se mueve solo. */
    _panOverlays() {
        this._updateFloatUI();
        const targetLoc = this._lastTargetLoc || 0;
        const studioLights = window.TrainStudio && typeof window.TrainStudio.showLights === 'function' && window.TrainStudio.showLights(targetLoc);
        if ((document.body.classList.contains('play-mode') || studioLights)
            && window.Lighting && typeof window.Lighting.renderHalos === 'function') {
            window.Lighting.renderHalos(null, targetLoc);
        }
        this._drawCropHarvestFx();
        if (this.app?.farmingSystem?.renderFloatingRewards) {
            this.app.farmingSystem.renderFloatingRewards(this.ctx);
        }
    }

    /** Redibuja la escena en el lienzo de copia y la vuelca. */
    _panCapture() {
        const cw = this.canvas.width, ch = this.canvas.height;
        const m = this._panMargin();
        let c = this._panCanvas;
        if (!c) c = this._panCanvas = document.createElement('canvas');
        if (c.width !== cw + 2 * m || c.height !== ch + 2 * m) {
            c.width = cw + 2 * m;
            c.height = ch + 2 * m;
            this._panCtx = c.getContext('2d');
        }
        if (!this._panCtx) this._panCtx = c.getContext('2d');

        const realCanvas = this.canvas, realCtx = this.ctx;
        const ox = this.offsetX, oy = this.offsetY;
        this._offscreenPass = true;
        try {
            this.canvas = c;
            this.ctx = this._panCtx;
            this.ctx.setTransform(1, 0, 0, 1, 0, 0);
            this.ctx.clearRect(0, 0, c.width, c.height);
            this.offsetX = ox + m;
            this.offsetY = oy + m;
            this._drawScene();
        } finally {
            this._offscreenPass = false;
            this.canvas = realCanvas;
            this.ctx = realCtx;
            this.offsetX = ox;
            this.offsetY = oy;
        }
        this._panCache = { ox, oy, scale: this.scale, m };
        this._panBlit(true);
    }

    _drawImmediate() {
        if (!this.app || !this.app.parser || !this.app.parser.placements) return;
        const targetLocStr = document.getElementById('select-location')?.value;
        const targetLoc = (this.locationId != null) ? this.locationId : (targetLocStr !== undefined && targetLocStr !== "" ? parseInt(targetLocStr, 10) : 0);
        let isTrainMoving = false;
        if ((targetLoc === 10 || targetLoc === 15) && window.Train && typeof window.Train.posicion === 'function') {
            const p = window.Train.posicion();
            if (p && (p.tramo === 'entrando' || p.tramo === 'saliendo' || p.tramo === 'de largo')) {
                isTrainMoving = true;
            }
        }
        if (this.isPanDragging && !this.isItemDragging && !this.isGridDragging && !isTrainMoving) {
            if (this._panBlit()) return;
            this._panCapture();
            return;
        }
        this._panCache = null;
        this._drawScene();
    }

    _drawScene() {
        if (!this.app || !this.app.parser || !this.app.parser.placements) return;
        this._drawTick = (this._drawTick | 0) + 1;   // invalida los memos por fotograma
        this._cellColocationGroups = null;
        // Los vecinos de cada parcela se recalculan por fotograma: al poner o quitar
        // una, las de alrededor cambian de sprite y el borde tiene que seguirlas.
        this._plotCellCache = null;

        const ctx = this.ctx;
        const targetLocStr = document.getElementById('select-location')?.value;
        const targetLoc = targetLocStr !== undefined && targetLocStr !== "" ? parseInt(targetLocStr, 10) : 0;
        
        if (this._lastTargetLoc !== targetLoc) {
            this._lastTargetLoc = targetLoc;
            this._bakedBgCanvas = null;
            this._bakedBgKey = null;
            this._renderCache = null;
        }

        let visibleFloors = [document.getElementById('select-floor')?.value || '0'];
        let isPlay = document.body.classList.contains('play-mode');
        let isGrid = document.body.classList.contains('grid-mode');
        let bgActive = (isPlay || isGrid) && targetLoc === 0;

        const curSeason = (window.GameTime ? window.GameTime.now().season : (this.app && this.app.parser ? this.app.parser.getClock().season : 0));
        // Numeración del juego: 0 verano, 1 otoño, 2 invierno, 3 primavera. Ver SEASON_GRASS.
        const seasonalGroundColors = {
            0: '#98B870', // verano
            1: '#E2B36B', // otoño
            2: '#E0E9F0', // invierno
            3: '#9EBE72'  // primavera
        };
        const activeGroundColor = seasonalGroundColors[curSeason] || '#98B870';

        if (isPlay && window.PlayScenery && !window.PlayScenery.settled(targetLoc)) window.PlayScenery.prepare(targetLoc);
        const sceneryOn = !!(isPlay && window.PlayScenery && window.PlayScenery.ready(targetLoc));

        if (bgActive || isPlay) {
            // El suelo va con la textura de la estación; el color plano queda solo
            // como respaldo mientras la imagen carga.
            ctx.fillStyle = this.seasonGrassPattern(ctx, curSeason) || activeGroundColor;
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        } else {
            ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
        
        if (String(targetLoc) === '0') this._sincronizarEscenaCasa();

        if (isPlay) {
            // B: visible = floors del atlas para ese mapId, respetar homecoming_only
            const allFloors = (window.mapsAtlas || []).filter(s => String(s.mapId) === String(targetLoc) && s.kind === 'floor');
            const showHC = this._homecomingActivo();
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
        
        const layerRadio = this._layerRadio();
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

            // El fondo horneado —cesped, suelos y papel pintado, recortados por el
            // poligono de cada ancla— se usa tambien en el EDITOR, no solo en play. Antes
            // el editor caia a la rama de abajo, que pinta un rombo generico por piso con
            // el suelo del save y NINGUNA pared, asi que las dos vistas no se parecian.
            // Con los datos del atlas delante no hay motivo para dibujar distinto.
            const hayAtlas = !!(window.mapsAtlas
                && window.mapsAtlas.some(x => String(x.mapId) === String(targetLoc)));
            if ((isPlay || isGrid || hayAtlas) && window.mapsAtlas) {
            // 1, 2, 3: BAKED BACKGROUND (House level2 / Farm level4 / Other Maps)
            const mapDefCfg = (window.MapDef && window.MapDef.config(targetLoc)) || null;
            // Misma ruta que usa _clampCamera: getBackgroundImage() cachea por cadena,
            // y dos formas distintas de nombrar el mismo PNG lo bajarían dos veces.
            const bgPath = this.backgroundPathFor(targetLoc);
            const bgImg = this.getBackgroundImage(bgPath);
            
            // El césped de la Casa del Árbol sale de la textura de la estación, no de
            // una primavera fija: antes otoño e invierno se horneaban de color plano.
            const grassImg = (targetLoc === 0) ? this.seasonGrassImage(curSeason) : null;
            const grassLoaded = (!grassImg || (grassImg.complete && grassImg.width > 0)) ? '1' : '0';
            
            // Only bake if bgImg is loaded and we haven't baked this combination yet
            const wpDict = this.app.parser && this.app.parser.wallpapers;
            const floorDict = this.app.parser && this.app.parser.floors;
            const wpStr = wpDict && wpDict[targetLoc] ? wpDict[targetLoc].map(x => x.id).join(',') : '';
            const flStr = floorDict && floorDict[targetLoc] ? floorDict[targetLoc].map(x => x.id).join(',') : '';
            const atlasCount = (window.mapsAtlas || []).filter(s => String(s.mapId) === String(targetLoc)).length;
            const bakeKey = targetLoc + '_' + wpStr + '_' + flStr + '_' + atlasCount + '_g' + grassLoaded + '_sc' + (sceneryOn ? '1' : '0') + '_s' + curSeason;
            
            if (bgImg && bgImg.complete && bgImg.width > 0) {
                // Ancla mundo->pixel del ensamblado: cada mapa la declara en su JSON
                // (config.origin_px, derivada por tools/derive_surfaces.py). En level2 vale
                // (1235,1257). El centro de la imagen es solo un respaldo para mapas sin JSON,
                // y casi siempre esta desplazado respecto al origen real de Unity.
                const originPxX = (mapDefCfg && mapDefCfg.origin_px ? mapDefCfg.origin_px.x
                    : (targetLoc === 0 ? 1235 : bgImg.width / 2));
                const originPxY = (mapDefCfg && mapDefCfg.origin_px ? mapDefCfg.origin_px.y
                    : (targetLoc === 0 ? 1257 : bgImg.height / 2));

                if (!this._bakedBgCanvas || this._bakedBgKey !== bakeKey) {
                    // Bake the background to a temporary offscreen canvas
                    const tempBaked = document.createElement('canvas');
                    tempBaked.width = bgImg.width;
                    tempBaked.height = bgImg.height;
                    const bCtx = tempBaked.getContext('2d');
                    
                    let allLoaded = true;

                    // Suelo de la Casa del Árbol: la textura de césped que toque a la
                    // estación, y el color plano solo si aún no ha cargado.
                    if (targetLoc === 0) {
                        const grassPattern = (grassImg && grassImg.complete && grassImg.width > 0)
                            ? bCtx.createPattern(grassImg, 'repeat') : null;
                        if (grassPattern) {
                            bCtx.fillStyle = grassPattern;
                        } else {
                            bCtx.fillStyle = activeGroundColor;
                            allLoaded = false;
                        }
                        bCtx.fillRect(0, 0, tempBaked.width, tempBaked.height);
                    }
                    if (!this._sceneFullCache) this._sceneFullCache = {};
                    const effTargetLoc = (window.MapDef && window.MapDef.efectivo) ? window.MapDef.efectivo(targetLoc) : targetLoc;
                    if (this._sceneFullCache[effTargetLoc]) {
                        if (window.MapDef && typeof window.MapDef.syncAtlas === 'function') {
                            window.MapDef.syncAtlas(targetLoc);
                        }
                    } else if (this._sceneFullCache[effTargetLoc] === undefined) {
                        this._sceneFullCache[effTargetLoc] = null; // Prevent multiple fetches
                        if (location.protocol !== 'file:') {
                            ((window.MapDef && window.MapDef.load)
                                ? window.MapDef.load(effTargetLoc)
                                : fetch(`data/maps/map_${effTargetLoc}.json`).then(r=>r.ok?r.json():null)
                            ).then(unifiedMap=>{
                                if(unifiedMap){
                                    this._sceneFullCache[effTargetLoc] = unifiedMap;
                                    
                                    if (window.MapDef && typeof window.MapDef.syncAtlas === 'function') {
                                        window.MapDef.syncAtlas(targetLoc);
                                    } else if (unifiedMap.surfaces) {
                                        if (!window.mapsAtlas) window.mapsAtlas = [];
                                        const mapIdNum = parseInt(targetLoc, 10);
                                        unifiedMap.surfaces.forEach(s => {
                                            s.mapId = mapIdNum;
                                        });
                                        window.mapsAtlas = window.mapsAtlas.filter(s => String(s.mapId) !== String(targetLoc));
                                        window.mapsAtlas.push(...unifiedMap.surfaces);
                                    }
                                    
                                    if(unifiedMap.meta || unifiedMap.config) {
                                        if(!window.MAP_META) window.MAP_META = {};
                                        // MEZCLAR, no reemplazar. Sustituir la entrada por
                                        // `config` borraba `exportDir`, `export` y `name`, que
                                        // es lo unico que tiene `maps_atlas.js` y de lo que
                                        // depende el respaldo de `backgroundPathFor`.
                                        //
                                        // El caso feo era la Estacion de Tren: su mapa es el 10
                                        // pero su arte es level9, asi que al perder
                                        // `exportDir: 9` la ruta pasaba a ser
                                        // "Exportado_level10/level9_Ensamblado.png", que no
                                        // existe. La imagen se cacheaba como nula y el mapa
                                        // salia vacio.
                                        window.MAP_META[targetLoc] = Object.assign(
                                            {}, window.MAP_META[targetLoc] || {},
                                            unifiedMap.meta || unifiedMap.config || {});
                                    }
                                    
                                    this._renderCache = null;
                                    this._bakedBgCanvas = null;
                                    this._bakedBgKey = null;
                                    this._anchorDeclCache = null;   // el atlas acaba de cambiar
                                    this.draw();
                                }
                            }).catch(console.error);
                        }
                    }

                    // Draw floors and wallpapers behind the treehouse structure
                    const drawSurfaceCovering = (surf) => {
                        if (!surf) return;
                        const isFloor = surf.kind === 'floor';
                        const coverId = this.getSurfaceCoveringId(surf, targetLoc);
                        if (coverId == null || coverId === '' || Number(coverId) < 0) return;

                        const tex = this._getTilesetTexture(isFloor ? 'floor' : 'wall', coverId);
                        if (!tex || !tex.img || !tex.img.complete || tex.img.width === 0) {
                            // Solo se espera si de verdad está cargando. Si el PNG no
                            // existe, esperarlo dejaría el fondo rehorneándose sin fin.
                            if (!(tex && tex.error)) allLoaded = false;
                            return;
                        }

                        // El revestimiento se recorta con el POLIGONO del ancla, que es
                        // el contorno exacto que trae el spline de su SpriteShapeController.
                        // Ya no hay mascaras PNG: solo existian para seis superficies de la
                        // Casa del Arbol, habia que mantenerlas a mano y ocultaban el error
                        // cuando el poligono estaba mal.
                        //
                        // Un suelo puede venir partido en varios trozos (`polys`), y
                        // entonces se pinta sobre la union de todos.
                        const anillos = (surf.polys && surf.polys.length)
                            ? surf.polys
                            : ((surf.poly && surf.poly.length) ? [surf.poly] : []);
                        if (!anillos.length) return;

                        if (!this._patronScratch) {
                            this._patronScratch = document.createElement('canvas');
                        }
                        const scratch = this._patronScratch;
                        if (scratch.width !== bgImg.width || scratch.height !== bgImg.height) {
                            scratch.width = bgImg.width;
                            scratch.height = bgImg.height;
                        }
                        const mCtx = scratch.getContext('2d');
                        mCtx.globalCompositeOperation = 'source-over';
                        mCtx.clearRect(0, 0, bgImg.width, bgImg.height);
                        mCtx.fillStyle = mCtx.createPattern(tex.img, 'repeat');
                        mCtx.fillRect(0, 0, bgImg.width, bgImg.height);

                        const { ox: wOx, oy: wOy } =
                            this._getSurfaceOrigin(surf, surf.mapId != null ? surf.mapId : targetLoc);
                        bCtx.save();
                        bCtx.beginPath();
                        anillos.forEach(anillo => {
                            anillo.forEach((pt, i) => {
                                const px = (pt.x !== undefined ? pt.x : pt[0]);
                                const py = (pt.y !== undefined ? pt.y : pt[1]);
                                const bx = originPxX + (wOx + px) * 150;
                                const by = originPxY - (wOy + py) * 150;
                                if (i === 0) bCtx.moveTo(bx, by);
                                else bCtx.lineTo(bx, by);
                            });
                            bCtx.closePath();
                        });
                        bCtx.clip();
                        bCtx.drawImage(scratch, 0, 0);
                        bCtx.restore();
                    };

                    const currentSurfaces = (window.mapsAtlas || []).filter(s => String(s.mapId) === String(targetLoc));
                    // Draw floors first, then walls
                    currentSurfaces.filter(s => s.kind === 'floor').forEach(s => drawSurfaceCovering(s));
                    currentSurfaces.filter(s => s.kind === 'wall').forEach(s => drawSurfaceCovering(s));
                    
                    // Draw base treehouse OVER the floors and walls!
                    // (skipped when layered scenery owns the tree: bake = grass + coverings only)
                    bCtx.globalCompositeOperation = 'source-over';
                    if (!sceneryOn) bCtx.drawImage(bgImg, 0, 0);

                    if (targetLoc === 0 && currentSurfaces.length === 0) {
                        allLoaded = false;
                    }

                    this._bakedBgCanvas = tempBaked;
                    if (allLoaded) {
                        this._bakedBgKey = bakeKey;
                    }
                }
                
                // Draw the baked background directly to screen centered on (0, 0)
                const bgScale = _bgo;
                const s = bgScale * this.scale;
                const dx = this.offsetX - originPxX * s;
                const dy = this.offsetY - originPxY * s;
                // Ground layer: grass + coverings.
                // Se vuelca SOLO el trozo que entra en pantalla. El fondo horneado mide
                // unos 2500x2500 px y volcarlo entero escalado en cada repintado era, de
                // En el viaje (mapa 14), el paisaje con scroll parallax se dibuja detrás del vagón
                this._dibujarFondoViaje(ctx, targetLoc, dx, dy, s);
                this._blitBaked(ctx, this._bakedBgCanvas, dx, dy, s);
                // El tren, encima del fondo y corrido por la via segun el reloj.
                this._dibujarCapaTren(ctx, targetLoc, dx, dy, s);
                // Layered scenery: far layer on top of grass (trees, rocks, flowers, vegetation)
                if (sceneryOn) window.PlayScenery.drawFar(ctx, targetLoc, this.offsetX, this.offsetY, s);
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
                    ? window.mapsAtlas.filter(s => s.kind === 'floor' && visibleFloors.includes(String(s.groupNum)) && String(s.mapId) === String(targetLoc))
                    : [window.mapsAtlas[this.app.gridEditor.activeSurfaceIndex]];

                for (const surf of surfaces) {
                    if (!surf) continue;
                    const u = _bgo * this.scale;
                    const { ox: worldOx, oy: worldOy } =
                        this._getSurfaceOrigin(surf, surf.mapId != null ? surf.mapId : targetLoc);
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
                    // La grilla cubre EXACTAMENTE las celdas de la superficie: líneas en
                    // los bordes 0..cols / 0..rows. Sin overscan: las superficies sin
                    // poly (patios) no deben inundar el mapa, y Math.max(16,…) deformaba
                    // superficies pequeñas (g4 es 1x1).
                    const cols = surf.cols || 16;
                    const rows = surf.rows || 16;
                    const { cw_u, ch_u } = this._getSurfaceCellUnits(surf);
                    const halfW = (cw_u / 2) * 150 * u;
                    const halfH = (ch_u / 2) * 150 * u;

                    const minGx = 0;
                    const maxGx = cols;
                    const minGy = 0;
                    const maxGy = rows;

                    ctx.lineWidth = 1;
                    if (isFloor) {
                        ctx.strokeStyle = 'rgba(0, 255, 120, 0.45)';
                        ctx.beginPath();
                        for (let gx = minGx; gx <= maxGx; gx++) {
                            ctx.moveTo((gx - minGy) * halfW, -(gx + minGy) * halfH);
                            ctx.lineTo((gx - maxGy) * halfW, -(gx + maxGy) * halfH);
                        }
                        for (let gy = minGy; gy <= maxGy; gy++) {
                            ctx.moveTo((minGx - gy) * halfW, -(minGx + gy) * halfH);
                            ctx.lineTo((maxGx - gy) * halfW, -(maxGx + gy) * halfH);
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

            // 5. WALL ITEMS + FLOOR FURNITURE ──────────────────────────────────────
            if (!isGrid && !isPlay) this._drawIsoWallGrids(targetLoc, targetFloor);

            this._activeFurnitureActors = 0;
            this._tsukiOnFurniture = false;
            this._interactiveActors = [];
            if (window.RoutineScheduler && (isPlay || isGrid)) {
                window.RoutineScheduler.evaluateSchedule(targetLoc, (this.app.parser && this.app.parser.placements) || []);
            }
            const matchCluster = (c) => (c === targetLoc || String(c) === String(targetLoc) || (Number(targetLoc) === 14 && typeof c === 'string' && c.startsWith('train_vagon_')));
            let itemHash = 0;
            if (this.app.parser.placements) {
                for (const p of this.app.parser.placements) {
                    if (matchCluster(p.cluster)) itemHash += (p.x || 0) + (p.y || 0) + (p.item_id || 0) + (p.floor || 0) + (p.flipped ? 1 : 0) + (p.orientation || 0);
                }
            }
            const atlasHash = (window.mapsAtlas || []).map(s => String(s.origin?.x || s.origin_px?.x || 0) + ',' + String(s.origin?.y || s.origin_px?.y || 0)).join(';');
            // El mobiliario que pone el juego (bancos y gacha del ayuntamiento, etc.)
            // no está en el .csave; se añade aquí como placements normales.
            const layoutPlacements = this._layoutPlacements(targetLoc);
            for (const p of layoutPlacements) itemHash += (p.x || 0) + (p.y || 0) + (p.item_id || 0);
            const cacheKey = this.app.parser.placements.length + '_' + layoutPlacements.length + '_' + targetLoc + '_' + targetFloor + '_' + visibleFloors.join(',') + '_' + isPlay + '_' + isGrid + '_' + itemHash + '_' + atlasHash;
            if (!this._renderCache || this._renderCache.key !== cacheKey || this.isItemDragging) {
                const fuente = this.app.parser.placements.concat(layoutPlacements);
                // D: paredes usan surface wall del mismo groupNum, no filtrar por visibleFloors de piso
                const allWalls = fuente.filter(
                    p => matchCluster(p.cluster) && p.isWall && p.item_id !== -1 && !this.isCovering(p.item_id)
                );
                const all = fuente.filter(
                    p => (isPlay || isGrid ? (Number(targetLoc) === 14 || visibleFloors.includes(String(p.floor))) : String(p.floor) === String(targetFloor)) && matchCluster(p.cluster) && !p.isWall && p.item_id !== -1 && !this.isCovering(p.item_id)
                );
                const ground  = all.filter(p => GROUND_IDS.has(p.item_id));
                const seeds   = all.filter(p => SEED_IDS.has(p.item_id) && p.x !== -1 && p.y !== -1 && !p.linkedPlot);
                const regular = all.filter(p => !GROUND_IDS.has(p.item_id) && !SEED_IDS.has(p.item_id)
                                                && p.item_id !== CROP_BOX_ID);
                this._stackInfo = this._computeStackInfo(regular);
                const sortByZ = (a, b) => {
                    const fb = Number(b.floor||0), fa = Number(a.floor||0);
                    if (fa !== fb) return fa - fb;
                    // Painter's algorithm: background (larger x+y) drawn first, foreground last
                    const z = (b.x + b.y) - (a.x + a.y);
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

            // Layered scenery: mid layer behind furniture (actor slot: between mid and near, future).
            if (window.PlayScenery && window.PlayScenery.ready(targetLoc)) {
                const _ms = (window.atlasConfig && window.atlasConfig.bgScale ? window.atlasConfig.bgScale : 0.75) * this.scale;
                window.PlayScenery.drawMid(ctx, targetLoc, this.offsetX, this.offsetY, _ms);
            }
            // Las PAREDES van DETRAS del mobiliario de su mismo piso, no delante de
            // todo. Un poster esta colgado en el plano de la pared, que es lo mas al
            // fondo de la habitacion: cualquier cosa que este en el suelo -un mueble, un
            // NPC sentado en el sofa- esta por delante.
            //
            // Antes se pintaban las paredes AL FINAL, despues de todo el mobiliario, y
            // por eso los posters tapaban a Moca sentada: al vecino sentado lo dibuja su
            // propio mueble, en la pasada `regular`, o sea antes que las paredes. Los NPC
            // sueltos no se veian afectados porque van despues de esta pasada entera.
            //
            // Se hace PISO A PISO: las paredes del piso de arriba no deben quedar detras
            // del mobiliario del de abajo. Dentro de cada piso se conserva el orden de
            // siempre (suelo, semillas, resto).
            const pisoDe = (p) => Number(p.floor || 0);
            const pisos = [...new Set([...allWalls, ...ground, ...seeds, ...regular].map(pisoDe))]
                .sort((a, b) => a - b);
            for (const f of pisos) {
                for (const p of allWalls) if (pisoDe(p) === f) this._drawWallPlacementIso(p);
                for (const p of ground)   if (pisoDe(p) === f) this._drawPlacement(p, 'ground');
                for (const p of seeds)    if (pisoDe(p) === f) this._drawPlacement(p, 'seed');
                for (const p of regular)  if (pisoDe(p) === f) this._drawPlacement(p, 'regular');
            }

            // ── Draw CropBox 1301 on Granja if present ──
            if (targetLoc === 6) {
                this._drawCropBoxFixture();
            }

            // ── ACTOR SLOT: Ambient / Free-Roaming Character (Tsuki) ──
            if (isPlay || isGrid) {
                this._drawAmbientActors(targetLoc, targetFloor);
                this._drawMapNpcActivities(targetLoc);
                this._dibujarObjetosDeEscena(targetLoc);
                if (Number(targetLoc) === 14) {
                    const u = (window.atlasConfig && window.atlasConfig.bgScale ? window.atlasConfig.bgScale : 0.75) * this.scale;
                    const centros14 = [
                        { vagon: 0, x: 0, y: 1 },
                        { vagon: 1, x: 8, y: 5 },
                        { vagon: 2, x: 16, y: 9 }
                    ];
                    centros14.forEach(c => {
                        const cx = this.offsetX + c.x * 150 * u;
                        const cy = this.offsetY - c.y * 150 * u;
                        this._drawWagonNpcs(ctx, targetLoc, c.vagon, cx, cy, u);
                    });
                }
                // Las visuales ANIMADAS de la escena (`SimpleAnim`): el alfarero de la
                // Casa del Arbol, la bandera del Ayuntamiento, las cuatro ruedas del
                // tren, las dos capas de la fuente del Centro Comercial, la cinta
                // transportadora. No pueden ir en el horneado por capas -cambian de
                // sprite cada pocos cuadros- asi que las pinta `play_scenery` en vivo,
                // con la misma transformacion con la que las habria horneado.
                if (sceneryOn && window.PlayScenery && window.PlayScenery.drawAnimadas) {
                    const _as = (window.atlasConfig && window.atlasConfig.bgScale ? window.atlasConfig.bgScale : 0.75) * this.scale;
                    window.PlayScenery.drawAnimadas(ctx, targetLoc, this.offsetX, this.offsetY, _as);
                }
                // Lo que se mueve por MATERIAL en vez de por fotogramas -el agua del
                // muelle, que corre, y la copa de los arboles, que se mece- NO se pinta
                // aqui: lo pinta `drawLayer` dentro de su propia capa, entre los dos
                // trozos horneados. El agua es lo mas al fondo de la suya, asi que
                // pintarla al final taparia el muelle entero.
                this._drawMapInteractiveProps(targetLoc);
                this._drawMapSubscenes(targetLoc);
                this._dibujarObraHomecoming(targetLoc);
                this._situarGacha(targetLoc);
            }

            // El cartel del tren se refresca SIEMPRE, tambien fuera del modo play:
            // es quien se encarga de borrarse al salir de la estacion o del modo.
            if (window.Train && typeof window.Train.actualizarHUD === 'function') {
                try { window.Train.actualizarHUD(targetLoc); } catch (e) { /* sin partida */ }
            }

            // 6. FOREGROUND: layered scenery replaces the static
            // foreground overlay when the bake is ready (same canopy art, no double-draw).
            if ((isPlay || isGrid) && targetLoc === 0) {
                const _bgo = (window.atlasConfig && window.atlasConfig.bgScale ? window.atlasConfig.bgScale : 0.75);
                const s = _bgo * this.scale;

                // Fallback static foreground canopy (only when layered scenery is not active)
                if (!sceneryOn) {
                    let fgPath = '../maps/Exportado_level2/level2_Foreground.png';
                    let isSeasonal = false;
                    // 1 otoño, 2 invierno, 3 primavera. En verano (0) va la copa normal.
                    if (curSeason === 1) {
                        fgPath = '../maps/Exportado_level2/TreehouseFall_Autumn.png';
                        isSeasonal = true;
                    } else if (curSeason === 2) {
                        fgPath = '../maps/Exportado_level2/TreehouseSnow_Winter.png';
                        isSeasonal = true;
                    } else if (curSeason === 3) {
                        fgPath = '../maps/Exportado_level2/TreehouseSpring_Sakura.png';
                        isSeasonal = true;
                    }
                    const fgImg = this.getBackgroundImage(fgPath);
                    if (fgImg && fgImg.complete && fgImg.width > 0) {
                        const drawW = fgImg.width * s;
                        const drawH = fgImg.height * s;
                        if (isSeasonal) {
                            // Exact alignment with Unity T2 TREEHOUSE SLICED_0 in assembled space: (380.25, 245.55)
                            const originPxX = 1235;
                            const originPxY = 1257;
                            const dx = this.offsetX - (originPxX - 380.25) * s;
                            const dy = this.offsetY - (originPxY - 245.55) * s;
                            ctx.drawImage(fgImg, dx, dy, drawW, drawH);
                        } else {
                            const originPxX = 1235;
                            const originPxY = 1257;
                            const dx = this.offsetX - originPxX * s;
                            const dy = this.offsetY - originPxY * s;
                            ctx.drawImage(fgImg, dx, dy, drawW, drawH);
                        }
                    }
                }

                // Draw seasonal branch decorations (Autumn, Winter, Spring Sakura)
                let branchLPath = null;
                let branchRPath = null;
                if (curSeason === 1) {
                    branchLPath = '../maps/Exportado_level2/TreehouseFall_Autumn_BranchL.png';
                    branchRPath = '../maps/Exportado_level2/TreehouseFall_Autumn_BranchR.png';
                } else if (curSeason === 2) {
                    branchLPath = '../maps/Exportado_level2/TreehouseSnow_Winter_BranchL.png';
                    branchRPath = '../maps/Exportado_level2/TreehouseSnow_Winter_BranchR.png';
                } else if (curSeason === 3) {
                    branchLPath = '../maps/Exportado_level2/TreehouseSpring_Sakura_BranchL.png';
                    branchRPath = '../maps/Exportado_level2/TreehouseSpring_Sakura_BranchR.png';
                }
                if (branchLPath) {
                    const bL = this.getBackgroundImage(branchLPath);
                    if (bL && bL.complete && bL.width > 0) {
                        const bx = this.offsetX + (-4.26 * 150 * s);
                        const by = this.offsetY - (-2.598 * 150 * s);
                        ctx.drawImage(bL, bx - (bL.width * s / 2), by - (bL.height * s / 2), bL.width * s, bL.height * s);
                    }
                }
                if (branchRPath) {
                    const bR = this.getBackgroundImage(branchRPath);
                    if (bR && bR.complete && bR.width > 0) {
                        const bx = this.offsetX + (4.395 * 150 * s);
                        const by = this.offsetY - (-2.338 * 150 * s);
                        ctx.drawImage(bR, bx - (bR.width * s / 2), by - (bR.height * s / 2), bR.width * s, bR.height * s);
                    }
                }
                if (window.PlayScenery && window.PlayScenery.ready(targetLoc)) {
                    window.PlayScenery.drawNear(ctx, targetLoc, this.offsetX, this.offsetY, s);
                }
            } else if (window.PlayScenery && window.PlayScenery.ready(targetLoc)) {
                const _bgo = (window.atlasConfig && window.atlasConfig.bgScale ? window.atlasConfig.bgScale : 0.75);
                window.PlayScenery.drawNear(ctx, targetLoc, this.offsetX, this.offsetY, _bgo * this.scale);
            }
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

        // El rótulo con el id y las coordenadas es del editor. En modo juego el hover
        // solo existe para encender el cultivo, así que ahí no se muestra.
        if (this.hoveredPlacement && !document.body.classList.contains('play-mode')) {
            this._drawTooltip(this.hoveredPlacement);
        }

        // En la pasada a la copia de paneo el lienzo es otro y el desplazamiento está
        // corrido por el margen, así que la UI flotante se coloca en el volcado, con la
        // cámara de verdad. Igual que las luces, que viven en su propio lienzo.
        if (!this._offscreenPass) this._updateFloatUI();

        if (!this._offscreenPass) this._panOverlays();
        if (!this._offscreenPass && window.TrainStudio && typeof window.TrainStudio.renderGizmo === 'function') {
            window.TrainStudio.renderGizmo(this.ctx, targetLoc);
        }
    }
    _updateLocationLabel(locId) {
        const sel = document.getElementById('select-location');
        if (!sel) return;
        const friendlyName = SUBLOC_NAMES[locId] || `Ubicación ${locId}`;
        // Update the label next to the dropdown
        const label = document.getElementById('location-label');
        if (label) label.textContent = friendlyName;
        if (window.TrainStudio) {
            window.TrainStudio.ensureUI();
            window.TrainStudio.syncVisibility();
        }
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
        const pivot = this._resolveSpritePivot(p.item_id, img, p.orientation || 0) || { x: 0.5, y: (p.isWall ? 0.5 : 0.25) };
        
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
        const layerRadio = this._layerRadio();
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
        const center = this._tileCenter(p.x, p.y, w, l, p.floor, p.cluster);
        const pad = Math.max(500, 300 * this.scale);
        if (center.x < -pad || center.x > this.canvas.width + pad || center.y < -pad || center.y > this.canvas.height + pad) {
            return;
        }

        const stack = (this._stackInfo && this._stackInfo.get(p)) || null;
        const lift = stack ? stack.lift : 0;
        const liftX = stack ? (stack.liftX || 0) : 0;

        const isHovered  = p === this.hoveredPlacement;
        const isSelected = p === this.selectedPlacement;

        // Los muebles que pone el juego se marcan en el editor (en modo play no, ahí
        // deben verse como uno más). Cian = movible, naranja = fijo (canOverride:false).
        if (p.isLayout && !document.body.classList.contains('play-mode')
            && (isHovered || isSelected || this._showLayoutMarks)) {
            const c = this._tileCenter(p.x, p.y, w, l, p.floor, p.cluster);
            ctx.save();
            ctx.fillStyle = p.canOverride ? 'rgba(0, 200, 255, 0.85)' : 'rgba(255, 140, 0, 0.9)';
            ctx.beginPath();
            ctx.arc(c.x, c.y, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // ── Draw grid footprint BEFORE sprite transforms (getIsoCoords returns absolute screen coords) ──
        if (document.body.classList.contains('play-mode') && this.app.tsukiPort && this.app.tsukiPort.isHammerMode && !p.isWall && (this.app.tsukiPort.showGrid || isSelected)) {
            const pt1 = this.getIsoCoords(p.x,     p.y,     p.floor, p.cluster);
            const pt2 = this.getIsoCoords(p.x + w, p.y,     p.floor, p.cluster);
            const pt3 = this.getIsoCoords(p.x + w, p.y + l, p.floor, p.cluster);
            const pt4 = this.getIsoCoords(p.x,     p.y + l, p.floor, p.cluster);
            // B: mismo lift que el blit (el sprite se pinta bajo translate -lift*CELL_H*scale)
            if (lift || liftX) {
                const liftShift = lift * this.CELL_H * this.scale;
                const liftShiftX = liftX * this.CELL_H * this.scale;
                pt1.y -= liftShift; pt2.y -= liftShift; pt3.y -= liftShift; pt4.y -= liftShift;
                pt1.x += liftShiftX; pt2.x += liftShiftX; pt3.x += liftShiftX; pt4.x += liftShiftX;
            }
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(pt1.x, pt1.y);
            ctx.lineTo(pt2.x, pt2.y);
            ctx.lineTo(pt3.x, pt3.y);
            ctx.lineTo(pt4.x, pt4.y);
            ctx.closePath();
            if (isSelected) {
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

            // DEBUG: show placement info for selected item
            if (isSelected) {
                const cx = (pt1.x + pt3.x) / 2;
                const cy = (pt1.y + pt3.y) / 2;
                ctx.save();
                ctx.font = `bold ${Math.max(10, Math.round(11 * this.scale))}px monospace`;
                ctx.fillStyle = '#ffffff';
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 3;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                const dbg = `[${p.x},${p.y}] w${w}×l${l} ori${p.orientation} cl${p.cluster} f${p.floor} c${Math.round(cx)},${Math.round(cy)}`;
                ctx.strokeText(dbg, cx, cy);
                ctx.fillText(dbg, cx, cy);
                ctx.restore();
            }
        }


        ctx.save();
        // El offset de sub-rejilla tiene componente horizontal ademas de altura
        // (`SubGroupData.Offset`, RVA 0x5919244). Antes solo se subia.
        if (lift || liftX) ctx.translate(liftX * this.CELL_H * this.scale,
                                         -lift * this.CELL_H * this.scale);
        const off = this._getPlacementRenderOffset(p);
        if (off.x || off.y) ctx.translate(off.x, off.y);
        


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
        // Con el sprite de parcela puesto no pintamos ni el rombo de color ni su
        // sombra: eso era el "footprint" del editor colándose en el modo juego.
        const plotSprite = (layer === 'ground') && this.plotAutotileState(p)
            && !!this._drawPlotTileReady(p);
        if (plotSprite) {
            // En juego, el sprite manda y no se pinta nada más. En el editor se deja el
            // contorno cuando la parcela está señalada, que si no no se sabe cuál es.
            hideBox = document.body.classList.contains('play-mode') || !(isSelected || isHovered);
        } else if (document.body.classList.contains('play-mode') && layer !== 'ground') {
            const _imgCheck = this.getImage(p.item_id, p.orientation);
            if (_imgCheck) hideBox = true;
        }

        if (!lift && !hideBox) {
            ctx.save();
            ctx.globalAlpha = 0.25;
            this._drawDiamondPath(p.x + 0.1, p.y + 0.1, w, l, 1.5, p.floor, p.cluster);
            ctx.fillStyle = '#000';
            ctx.fill();
            ctx.restore();
        }

        if (!hideBox) {
            this._drawDiamondPath(p.x, p.y, w, l, layer === 'ground' ? 0 : (lift ? 3 : 2), p.floor, p.cluster);
            ctx.fillStyle   = fillColor;
            ctx.strokeStyle = isSelected ? '#ff2222' : isHovered ? '#ffaa00' : (lift ? 'rgba(180,120,40,0.5)' : 'rgba(0,0,0,0.4)');
            ctx.lineWidth   = isSelected ? 2.5 : 1.5;
            ctx.fill();
            ctx.stroke();
        }

        if (layer === 'ground') {
            // El sprite del juego ya trae su tierra; la textura sintética solo se usa
            // como respaldo cuando no hay tabla de auto-tiling.
            if (!this._drawPlotTile(p, w, l)) {
                this._drawDirtTexture(p.x, p.y, w, l, p.floor, p.cluster);
            }
        }

        // Con la pieza de auto-tiling puesta NO se dibuja además el sprite suelto del
        // mueble (FURN_306.png): son la misma parcela, y pintar los dos era lo que hacía
        // que se vieran dos bancales superpuestos, el unido y el de parcelas sueltas.
        const img = plotSprite ? null : this.getImage(p.item_id, p.orientation);
        if (img) {
            this._drawSpriteOnTile(img, p.x, p.y, w, l, p.orientation, p.item_id, p.floor, p.cluster, p);
        } else if (!plotSprite) {
            const anchor = this.getIsoCoords(p.x, p.y, p.floor, p.cluster);
            const name   = this._shortName(p.item_id);
            ctx.save();
            ctx.font      = `bold ${Math.max(7, Math.round(10 * this.scale))}px 'Quicksand', sans-serif`;
            ctx.fillStyle = layer === 'ground' ? '#ffe0b2' : layer === 'seed' ? '#e8f5e9' : '#fff';
            ctx.textAlign    = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowColor = 'rgba(0,0,0,0.7)';
            ctx.shadowBlur  = 3;
            ctx.fillText(name, anchor.x, anchor.y);
            ctx.restore();
        }

        if (p.planted_id !== undefined && p.planted_id > 0 && p.planted_id !== 4294967295) {
            this._drawCropOnPlot(p, w, l);
        }

        if (layer === 'seed') {
            const anchor = this.getIsoCoords(p.x, p.y, p.floor, p.cluster);
            ctx.save();
            ctx.font      = `${Math.max(6, Math.round(8 * this.scale))}px 'Nunito Sans', sans-serif`;
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.shadowColor = 'rgba(0,0,0,0.8)';
            ctx.shadowBlur  = 2;
            ctx.fillText('🌱', anchor.x, anchor.y - 8 * this.scale);
            ctx.restore();
        }
        ctx.restore();
    }

    _drawDirtTexture(gx, gy, w, l, floorNum = 0, mapId) {
        // Draw a subtle criss-cross dirt pattern inside the tile
        const ctx = this.ctx;
        const top   = this.getIsoCoords(gx,   gy, floorNum, mapId);
        const right = this.getIsoCoords(gx+w, gy, floorNum, mapId);
        const bot   = this.getIsoCoords(gx+w, gy+l, floorNum, mapId);
        const left  = this.getIsoCoords(gx,   gy+l, floorNum, mapId);

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

    // ── Auto-tiling de las parcelas ─────────────────────────────────────────
    // El juego no dibuja cada parcela suelta: el prefab `Plot` lleva 47 estados, cada
    // uno con una condición sobre los 8 vecinos y el sprite que le corresponde. Por eso
    // dos parcelas contiguas se ven como un único bancal, sin junta. La tabla la extrae
    // tools/extract_plots.py a data/plots_autotile.json.
    //
    /**
     * Qué parcela vecina mira cada dirección del `check`.
     *
     * T/R/B/L son las cuatro **aristas** del rombo (las que comparten lado y a las que
     * hay que quitarles el borde); TL/TR/BR/BL los cuatro **vértices**, que solo se
     * tocan en una esquina. Confundir unas con otras es lo que hacía que las parcelas
     * del interior recibieran el sprite de parcela suelta y el bancal saliera cortado
     * y como duplicado.
     *
     * En esta proyección +x va arriba-derecha y +y arriba-izquierda, y los sprites
     * están dibujados con T en la arista de arriba-izquierda, girando en el sentido
     * del reloj. Comprobado contra las piezas que el juego nombra (FarmPlots_20..23,
     * las de un solo vecino): es la única de las ocho orientaciones posibles en la que
     * el borde sigue el contorno del campo.
     */
    _plotNeighbourOffsets() {
        const d = PLOT_SIZE.w, e = PLOT_SIZE.l;
        return {
            T:  [0, e],   R:  [d, 0],   B:  [0, -e],  L:  [-d, 0],   // aristas
            TL: [-d, e],  TR: [d, e],   BR: [d, -e],  BL: [-d, -e],  // vértices
        };
    }

    /** Conjunto "x,y" de las parcelas del mismo mapa y piso, para mirar vecinos. */
    _plotCells(p) {
        const key = `${p.cluster}|${p.floor}`;
        if (!this._plotCellCache) this._plotCellCache = {};
        if (!this._plotCellCache[key]) {
            const set = new Set();
            for (const q of (this.app?.parser?.placements || [])) {
                if (!GROUND_IDS.has(q.item_id)) continue;
                if (String(q.cluster) !== String(p.cluster)) continue;
                if (String(q.floor) !== String(p.floor)) continue;
                set.add(`${q.x},${q.y}`);
            }
            this._plotCellCache[key] = set;
        }
        return this._plotCellCache[key];
    }

    /** Estado de auto-tiling que le toca a esta parcela, o null si no hay tabla. */
    plotAutotileState(p) {
        const db = window.PLOTS_AUTOTILE;
        if (!db || !db.states || !GROUND_IDS.has(p.item_id)) return null;
        const cells = this._plotCells(p);
        const off = this._plotNeighbourOffsets();
        const vec = {};
        for (const d in off) vec[d] = cells.has(`${p.x + off[d][0]},${p.y + off[d][1]}`) ? 1 : 0;
        for (const st of db.states) {
            let ok = true;
            for (const d in vec) {
                const c = st.check[d];
                if (c !== 2 && c !== vec[d]) { ok = false; break; }
            }
            if (ok) return st;
        }
        return null;
    }

    getPlotImage(name) {
        const db = window.PLOTS_AUTOTILE;
        if (!db) return null;
        const key = `PLOT_${name}`;
        if (this._imgCache[key] !== undefined) return this._imgCache[key];
        this._imgCache[key] = false;
        const img = new Image();
        img.onload = () => { this._imgCache[key] = img; this.draw(); };
        img.onerror = () => { this._imgCache[key] = null; };
        img.src = `${db.dir}/${name}.png`;
        return false;
    }

    /**
     * Opacidad del pixel (px,py) de una imagen, en píxeles de la propia imagen.
     * Se usa para acertar el ratón sobre el dibujo del cultivo y no sobre su caja:
     * el lienzo del cultivo mide 98x264 y casi todo es transparente.
     */
    imageAlphaAt(img, px, py) {
        if (!img || !img.complete || !img.naturalWidth) return 0;
        px |= 0; py |= 0;
        if (px < 0 || py < 0 || px >= img.naturalWidth || py >= img.naturalHeight) return 0;
        if (!this._alphaCtx) {
            const c = document.createElement('canvas');
            c.width = 1; c.height = 1;
            this._alphaCtx = c.getContext('2d', { willReadFrequently: true });
        }
        const g = this._alphaCtx;
        try {
            g.clearRect(0, 0, 1, 1);
            g.drawImage(img, px, py, 1, 1, 0, 0, 1, 1);
            return g.getImageData(0, 0, 1, 1).data[3];
        } catch (e) {
            return 255;   // imagen de otro origen: se da por opaca
        }
    }

    /** ¿Está ya cargado el sprite que le toca a esta parcela? */
    _drawPlotTileReady(p) {
        const st = this.plotAutotileState(p);
        if (!st) return false;
        const img = this.getPlotImage(st.sprite);
        return !!(img && img.complete && img.naturalWidth > 0);
    }

    /** Dibuja la parcela con su sprite. Devuelve true si lo consiguió. */
    _drawPlotTile(p, w, l) {
        const st = this.plotAutotileState(p);
        if (!st) return false;
        const img = this.getPlotImage(st.sprite);
        if (!img || !img.complete || img.naturalWidth <= 0) return false;
        const anchor = this._tileCenter(p.x, p.y, w, l, p.floor, p.cluster);
        const _bgo = (window.atlasConfig && window.atlasConfig.bgScale ? window.atlasConfig.bgScale : 0.75);
        const u = _bgo * this.scale;
        const dw = st.w * u, dh = st.h * u;
        // El pivot de estos sprites no cae en el centro del rombo sino 29 px por debajo
        // (medido sobre FarmPlots_46, la pieza interior limpia: su fila más ancha —el eje
        // del rombo— está en y=39 y el pivot en y=68). Como todos comparten anclaje, con
        // una única corrección encajan entre sí; esto solo centra el conjunto en su casilla.
        this.ctx.drawImage(img,
            anchor.x - st.pivot.x * dw,
            anchor.y - (1 - st.pivot.y) * dh + PLOT_PIVOT_DY * u,
            dw, dh);
        return true;
    }

    // ── Sprites reales de los cultivos ──────────────────────────────────────
    // data/crops_db.json lo genera tools/extract_crops.py desde el bundle de
    // muebles: etapas de crecimiento y animación de cosecha de cada semilla.
    // Los frames de un cultivo comparten lienzo y pivot (el extractor los alinea
    // al exportarlos), así que todos se pintan en el mismo rectángulo.
    cropDef(cropId) {
        const db = window.CROPS_DB;
        return (db && db[String(cropId)]) || null;
    }

    /** Frame `idx` del rol pedido ('stage' | 'harvest' | 'strange' | 'rotten' | …). */
    getCropFrame(cropId, role, idx) {
        const def = this.cropDef(cropId);
        const anim = def && def.anims && def.anims[role];
        if (!anim || !anim.frames.length) return null;
        const name = anim.frames[Math.max(0, Math.min(anim.frames.length - 1, idx | 0))];
        const key = `CROPFRAME_${name}`;
        if (this._imgCache[key] !== undefined) return this._imgCache[key];
        this._imgCache[key] = false;
        const img = new Image();
        img.onload = () => { this._imgCache[key] = img; this.draw(); };
        img.onerror = () => { this._imgCache[key] = null; };
        img.src = `${def.dir}/${name}.png`;
        return false;
    }

    /** Reparte el avance del cultivo entre las etapas que tenga (3, u 8 las uvas). */
    cropStageIndex(def, status) {
        const n = (def.anims.stage && def.anims.stage.frames.length) || 1;
        if (!status || status.isReady) return n - 1;
        return Math.max(0, Math.min(n - 1, Math.floor((status.progress || 0) * n)));
    }

    /** Pinta un frame con su pivot sobre el centro de la parcela. */
    _blitCropFrame(img, def, anchor, u, yOffset = 0) {
        const dw = def.frameW * u;
        const dh = def.frameH * u;
        // pivot.y viene de Unity (0 = abajo); en pantalla se mide desde arriba
        this.ctx.drawImage(img,
            anchor.x - def.pivot.x * dw,
            anchor.y - (1 - def.pivot.y) * dh + yOffset,
            dw, dh);
    }

    /**
     * Lanza la animación de cosecha sobre la parcela. Va en una capa aparte
     * porque `harvestPlot()` ya ha borrado el cultivo cuando esto se dibuja.
     */
    playCropHarvestFx(p, cropId, role = 'harvest') {
        const def = this.cropDef(cropId);
        if (!def) return false;
        const anim = def.anims && (def.anims[role] || def.anims.harvest);
        if (!anim || !anim.frames.length) return false;
        const actual = def.anims[role] ? role : 'harvest';
        const { w, l } = this.getRotatedSize(p.item_id, p.orientation);
        for (let i = 0; i < anim.frames.length; i++) this.getCropFrame(cropId, actual, i);
        (this._cropFx || (this._cropFx = [])).push({
            x: p.x, y: p.y, w, l, floor: p.floor, cluster: p.cluster,
            cropId, role: actual, fps: anim.fps || 12, n: anim.frames.length,
            start: performance.now()
        });
        this._tickCropFx();
        return true;
    }

    _tickCropFx() {
        if (this._cropFxRaf) return;
        const step = () => {
            this._cropFxRaf = null;
            if (!this._cropFx || !this._cropFx.length) return;
            this.draw();
            if (this._cropFx && this._cropFx.length) this._cropFxRaf = requestAnimationFrame(step);
        };
        this._cropFxRaf = requestAnimationFrame(step);
    }

    _drawCropHarvestFx() {
        if (!this._cropFx || !this._cropFx.length) return;
        const now = performance.now();
        const _bgo = (window.atlasConfig && window.atlasConfig.bgScale ? window.atlasConfig.bgScale : 0.75);
        const u = _bgo * this.scale;
        for (let i = this._cropFx.length - 1; i >= 0; i--) {
            const fx = this._cropFx[i];
            const idx = Math.floor((now - fx.start) / 1000 * fx.fps);
            if (idx >= fx.n) { this._cropFx.splice(i, 1); continue; }
            const def = this.cropDef(fx.cropId);
            const img = this.getCropFrame(fx.cropId, fx.role, idx);
            if (!def || !img || !img.complete) continue;
            this._blitCropFrame(img, def, this._tileCenter(fx.x, fx.y, fx.w, fx.l, fx.floor, fx.cluster), u);
        }
    }

    _drawCropOnPlot(p, w, l) {
        if (!p || p.planted_id == null || p.planted_id <= 0 || p.planted_id === 4294967295) return;

        const farming = this.app?.farmingSystem;
        const status = farming ? farming.getCropStatus(p) : null;
        const ctx = this.ctx;

        const anchor = this._tileCenter(p.x, p.y, w, l, p.floor, p.cluster);
        const _bgo = (window.atlasConfig && window.atlasConfig.bgScale ? window.atlasConfig.bgScale : 0.75);
        const u = _bgo * this.scale;

        const stage = status ? status.stage : 3;
        const isReady = status ? status.isReady : false;
        const isRotten = status ? status.isRotten : false;
        const def = status ? status.def : (farming ? farming.getCropDefinition(p.planted_id) : { icon: '🥕' });

        ctx.save();

        // Sprite del juego, si el cultivo está en crops_db.json
        const cdef = this.cropDef(p.planted_id);
        if (cdef) {
            const frame = this.getCropFrame(p.planted_id, 'stage', this.cropStageIndex(cdef, status));
            if (frame && frame.complete && frame.naturalWidth > 0) {
                // El cultivo va clavado en la tierra: no flota ni rebota. Lo único que
                // se mueve es su animación de cosecha, y esa la pinta _drawCropHarvestFx.
                // El resplandor solo al apuntar el cultivo con el ratón: así indica que
                // se puede cosechar, en vez de estar encendido en toda la granja a la vez.
                const senalado = (this.hoveredPlacement === p) && isReady && !isRotten;
                // Ojo con ctx.filter: en cuanto se toca, Chrome mete el contexto en una
                // ruta lenta y cada save()/restore() posterior cuesta muchísimo más. Con
                // 25 parcelas poniendo filter='none' por fotograma, save() se comía un
                // tercio del tiempo de dibujado. Solo se toca si de verdad hay filtro.
                if (isRotten) ctx.filter = 'grayscale(60%) sepia(80%) hue-rotate(320deg) brightness(80%)';
                else if (senalado) { ctx.shadowColor = '#f1c40f'; ctx.shadowBlur = 10 * this.scale; }
                p._cropFrame = frame;   // lo usa el acierto del ratón para mirar su alfa
                this._blitCropFrame(frame, cdef, anchor, u, 0);
                if (isRotten) ctx.filter = 'none';
                if (senalado) ctx.shadowBlur = 0;
                this._drawCropBubble(ctx, anchor, def, status, isReady, isRotten, p);
                ctx.restore();
                return;
            }
        }

        const plantedImg = this.getCropImage(p.planted_id);
        if (plantedImg && plantedImg.complete && plantedImg.naturalWidth > 0) {
            let stageScale = 1.0;
            let yOffset = 0;
            if (stage === 0) {
                stageScale = 0.45;
                yOffset = 3 * this.scale;
            } else if (stage === 1) {
                stageScale = 0.65;
                yOffset = 2 * this.scale;
            } else if (stage === 2) {
                stageScale = 0.85;
                yOffset = 1 * this.scale;
            } else if (stage === 3) {
                stageScale = 1.0;
            } else if (stage === 4) {
                stageScale = 0.9;
                ctx.filter = 'grayscale(60%) sepia(80%) hue-rotate(320deg) brightness(80%)';
            }

            const dw = plantedImg.width * u * stageScale;
            const dh = plantedImg.height * u * stageScale;
            const dx = anchor.x - dw / 2;
            const dy = anchor.y - dh * 0.85 + yOffset;

            // Sombra del cultivo en la parcela
            ctx.save();
            ctx.beginPath();
            ctx.ellipse(anchor.x, anchor.y - 2 * this.scale, Math.max(4, dw * 0.35), Math.max(2, dh * 0.15), 0, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
            ctx.fill();
            ctx.restore();

            if (isReady && !isRotten && this.hoveredPlacement === p) {
                ctx.shadowColor = '#f1c40f';
                ctx.shadowBlur = 10 * this.scale;
            }

            ctx.drawImage(plantedImg, dx, dy, dw, dh);
        } else {
            ctx.font = `${Math.max(12, Math.round(18 * this.scale))}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(stage === 0 ? '🌱' : (def.icon || '🥕'), anchor.x, anchor.y - 10 * this.scale);
        }

        this._drawCropBubble(ctx, anchor, def, status, isReady, isRotten, p);

        ctx.restore();
    }

    /**
     * Aviso de estado del cultivo. Solo al apuntarlo con el ratón.
     *
     * Antes cada parcela llevaba encima una burbuja con el icono del cultivo subiendo
     * y bajando. Era invención nuestra —el juego no la tiene— y con la granja llena
     * llenaba la pantalla de globos flotando, así que se quitó.
     */
    _drawCropBubble(ctx, anchor, def, status, isReady, isRotten, p) {
        if (!status) return;
        if (this.hoveredPlacement !== p && this.selectedPlacement !== p) return;
        const infoY = anchor.y - 32 * this.scale;
        ctx.font = `bold ${Math.max(8, Math.round(10 * this.scale))}px "Quicksand", sans-serif`;
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = 'rgba(0,0,0,0.8)';
        ctx.lineWidth = 3;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        const texto = isRotten ? 'podrido'
            : (isReady ? `${def.name || 'listo'} · listo`
                       : `${Math.round(status.progress * 100)}% (${status.minutesLeft}m)`);
        ctx.strokeText(texto, anchor.x, infoY);
        ctx.fillText(texto, anchor.x, infoY);
    }

    _drawCropBoxFixture() {
        if (!this.app?.parser?.placements) return;
        const p = this.app.parser.placements.find(x => x.item_id === 1301 && Number(x.subloc_id ?? x.cluster) === 6);
        if (!p) return;

        // El csave SÍ guarda su posición, en groupPosition.grid como cualquier mueble.
        // Lo que pasaba es que 1301 estaba metido en SEED_IDS: el parser la tomaba por
        // semilla, no le encontraba parcela y le forzaba -1,-1 (ver la nota de SEED_IDS).
        // Esta rama queda solo como red de seguridad para saves que de verdad no la
        // traigan; la posición de reserva sale de logic.cropbox del mapa.
        if (p.x === -1 || p.y === -1) {
            const def = (window.MapDef && window.MapDef.get && window.MapDef.get(6))
                     || (this.app && this.app.mapDefs && this.app.mapDefs[6]) || null;
            const spot = (def && def.logic && def.logic.cropbox) || { x: 21, y: 15, floor: '0' };
            p.x = spot.x;
            p.y = spot.y;
            p.floor = String(spot.floor != null ? spot.floor : '0');
            p.cluster = 6;
        }

        const w = 3, l = 3;
        const img = this.getCropImage(1301) || this.getImage(1301, 0);
        if (!img || !img.complete || img.naturalWidth <= 0) return;

        const anchor = this._tileCenter(p.x, p.y, w, l, p.floor, p.cluster);
        const _bgo = (window.atlasConfig && window.atlasConfig.bgScale ? window.atlasConfig.bgScale : 0.75);
        const u = _bgo * this.scale;
        const dw = img.width * u;
        const dh = img.height * u;
        const pivot = this._resolveSpritePivot(1301, img, 0) || { x: 0.5, y: 0.25 };

        const ctx = this.ctx;
        ctx.save();

        const isHovered = (this.hoveredPlacement === p);
        if (isHovered) {
            ctx.shadowColor = '#f39c12';
            ctx.shadowBlur = 10 * this.scale;
        }

        ctx.drawImage(img, anchor.x - dw * pivot.x, anchor.y - dh * (1 - pivot.y), dw, dh);

        // Badge con zanahorias / cultivos almacenados
        const boxInfo = this.app.parser.getCropBoxSave();
        const carrots = boxInfo?.carrots || 0;
        const slotsCount = (boxInfo?.slots || []).filter(s => s.quantity > 0).length;

        if (carrots > 0 || slotsCount > 0) {
            const badgeY = anchor.y - dh * (1 - pivot.y) - 14 * this.scale + Math.sin(Date.now() / 300) * 2 * this.scale;
            ctx.font = `bold ${Math.max(10, Math.round(12 * this.scale))}px "Quicksand", sans-serif`;
            const badgeText = `📦 ${carrots}🥕${slotsCount > 0 ? ` +${slotsCount}🌾` : ''}`;
            const metrics = ctx.measureText(badgeText);
            const bw = metrics.width + 16 * this.scale;
            const bh = 22 * this.scale;
            const bx = anchor.x - bw / 2;
            const by = badgeY - bh / 2;

            ctx.beginPath();
            ctx.roundRect ? ctx.roundRect(bx, by, bw, bh, 8 * this.scale) : ctx.rect(bx, by, bw, bh);
            ctx.fillStyle = '#2c251e';
            ctx.fill();
            ctx.strokeStyle = '#f1c40f';
            ctx.lineWidth = 2 * this.scale;
            ctx.stroke();

            ctx.fillStyle = '#f1c40f';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(badgeText, anchor.x, badgeY);
        }

        ctx.restore();
    }

    _drawSpriteOnTile(img, gx, gy, w, l, orientation = 0, item_id = null, floorNum = 0, mapId, placement = null) {
        const ctx = this.ctx;
        // Misma caja que el rombo: ancla en el CENTRO del footprint w×l para que
        // sprite y huella pivoten juntos. El pivot del PNG solo corre el blit
        // dentro del rombo (pies sobre su piso). No rotar el PNG con ctx.rotate:
        // rotar = sprite frente/back + flip + este w,l.
        const anchor = this._tileCenter(gx, gy, w, l, floorNum, mapId);
        
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
        
        const oriNum = parseInt(orientation, 10) || 0;
        const flipH = (oriNum === 1 || oriNum === 3);
        const darken = (oriNum === 2 || oriNum === 3);
        const isBack = darken;
        
        const anchorX = anchor.x;
        const anchorY = anchor.y;
        const pivot = this._resolveSpritePivot(item_id, img, orientation);
        const pivotX = pivot.x;
        const pivotY = pivot.y;

        if (flipH) {
            ctx.translate(anchorX, 0);
            ctx.scale(-1, 1);
            ctx.translate(-anchorX, 0);
        }

        // Seating profile & general activity check
        const itemIdStr = String(item_id || placement?.item_id || '');
        const itemObj = (this.items && this.items[itemIdStr]) || (window.ITEMS_DB && window.ITEMS_DB[itemIdStr]);
        const seatingProfiles = (window.ACTIVITIES_DB && window.ACTIVITIES_DB.seating_profiles) || {};
        const seatProfile = itemObj?.seating_profile || seatingProfiles[itemIdStr];


        let activeAct = null;
        let actActor = null;
        const pId = placement?.placementID || placement?.placementId;
        const bedData = window.BED_PROFILES && window.BED_PROFILES.beds && window.BED_PROFILES.beds[String(item_id)];

        if (!bedData) {
            if (placement && placement._simActivity) {
                activeAct = placement._simActivity;
            } else if (placement && placement._simSitting) {
                activeAct = 101;
            } else if (window.RoutineScheduler && (document.body.classList.contains('play-mode') || this.isHammerMode)) {
                actActor = window.RoutineScheduler.getPlacementActor(placement);
                if (actActor && !actActor.isSleeping) {
                    activeAct = actActor.activityId;
                }
            } else if (pId != null && pId !== 0 && this.app && this.app.parser && typeof this.app.parser.getActivitySaves === 'function') {
                const acts = this.app.parser.getActivitySaves();
                const matched = acts.find(a => a.valid && a.placementId != null && String(a.placementId) === String(pId));
                if (matched && matched.id !== 348 && String(matched.id) !== '348') {
                    activeAct = matched.id;
                }
            }
        }

        // Layer 1 Base Sprite:
        // Multilayer Seating Logic (Front & Back Views):
        // In back view: back_base_sprite is drawn behind the character, and backrest_sprite is drawn on top.
        // In front view: front_base_sprite is drawn behind the character, and foreground_sprite is drawn on top.
        const useBackLayers = Boolean(isBack && activeAct && seatProfile && (seatProfile.has_backrest || seatProfile.backrest_sprite));
        const useFrontLayers = Boolean(!isBack && activeAct && seatProfile && (seatProfile.has_foreground || seatProfile.foreground_sprite || seatProfile.front_base_sprite));
        const useSeatingLayers = useBackLayers || useFrontLayers;

        let baseSpriteImg = img;
        if (useBackLayers && seatProfile.back_base_sprite) {
            const customBase = this.getItemCustomImage(seatProfile.back_base_sprite);
            if (customBase && customBase.complete && customBase.naturalWidth > 0) {
                baseSpriteImg = customBase;
            }
        } else if (useFrontLayers && seatProfile.front_base_sprite) {
            const customBase = this.getItemCustomImage(seatProfile.front_base_sprite);
            if (customBase && customBase.complete && customBase.naturalWidth > 0) {
                baseSpriteImg = customBase;
            }
        }

        if (darken) {
            // Only apply synthetic darkening when no dedicated _BACK.png sprite exists.
            // If FURN_xxx_BACK.png was loaded, the sprite already depicts the back view
            // and does not need to be artificially dimmed.
            const backCacheKey = `${item_id}_BACK`;
            const hasDedicatedBack = this._imgCache[backCacheKey] && this._imgCache[backCacheKey] !== false;
            if (!hasDedicatedBack) {
                ctx.filter = "brightness(0.75)";
            }
        }

        // Layer 1: Base Bed Frame / Furniture Sprite / Seat Base
        ctx.drawImage(baseSpriteImg,
            anchorX - (drawW * pivotX),
            anchorY - (drawH * (1 - pivotY)),
            drawW,
            drawH
        );

        if (darken) {
            ctx.filter = "none";
        }

        // Layer 2: Multilayer Bed & Character Logic
        if (bedData) {
            const skins = (window.BED_PROFILES && window.BED_PROFILES.skins) || {};
            const dSkin = bedData.defaultSkin || 50;
            const pillowSkinId = (placement && placement.bedSave && placement.bedSave.pillowID) ? placement.bedSave.pillowID : (placement && placement._simPillowID ? placement._simPillowID : dSkin);
            const sheetsSkinId = (placement && placement.bedSave && placement.bedSave.sheetsID) ? placement.bedSave.sheetsID : (placement && placement._simSheetsID ? placement._simSheetsID : dSkin);

            const pillowSkin = skins[pillowSkinId] || skins[dSkin] || skins[50];
            const sheetsSkin = skins[sheetsSkinId] || skins[dSkin] || skins[50];

            // Check if Tsuki is sleeping here
            let isSleeping = false;
            if (placement && placement._simSleeping) {
                isSleeping = true;
            } else if (window.RoutineScheduler && (document.body.classList.contains('play-mode') || this.isHammerMode)) {
                const schedActor = window.RoutineScheduler.getPlacementActor(placement);
                if (schedActor && schedActor.isSleeping) isSleeping = true;
            } else if (pId != null && pId !== 0 && this.app && this.app.parser && typeof this.app.parser.getActivitySaves === 'function') {
                const acts = this.app.parser.getActivitySaves();
                const activeOnBed = acts.find(a => a.valid && a.placementId != null && String(a.placementId) === String(pId));
                if (activeOnBed && (activeOnBed.id === 348 || activeOnBed.id === '348' || activeOnBed.id == null)) isSleeping = true;
            }
            if (isSleeping) {
                this._activeFurnitureActors = (this._activeFurnitureActors || 0) + 1;
                this._tsukiOnFurniture = true;
            }

            // Layer 2A: Pillow
            let pillowFile = pillowSkin?.pillow || bedData.parts?.pillow?.sprite || 'Pillow.png';
            if (isBack && pillowSkin && pillowSkin.pillow_B) pillowFile = pillowSkin.pillow_B;
            const pillowImg = this.getBedCustomImage(pillowFile);
            if (pillowImg && pillowImg.complete && pillowImg.naturalWidth > 0) {
                const pPos = bedData.parts?.pillow?.pos || { x: -0.345, y: 0.979 };
                const cx = anchorX + (pPos.x * 150 * u);
                const cy = anchorY - (pPos.y * 150 * u);
                const pw = pillowImg.width * u;
                const ph = pillowImg.height * u;
                ctx.drawImage(pillowImg, cx - pw * 0.5, cy - ph * 0.5, pw, ph);
            }

            // Sheets Sleep transform & Tsuki offset
            const sSleepPos = bedData.parts?.sheetsSleep?.pos || { x: 0.114, y: 0.600 };
            const sSleepBPos = bedData.parts?.sheetsSleepF?.pos || sSleepPos;
            const activeSleepPos = isBack ? sSleepBPos : sSleepPos;

            if (!isSleeping) {
                // Layer 2B: Empty Day Sheets
                const sheetsFile = isBack 
                    ? (sheetsSkin?.sheetsF || bedData.parts?.sheetsF?.sprite || 'BedsheetF.png')
                    : (sheetsSkin?.sheets || bedData.parts?.sheets?.sprite || 'Bedsheet.png');
                const sheetsImg = this.getBedCustomImage(sheetsFile);
                if (sheetsImg && sheetsImg.complete && sheetsImg.naturalWidth > 0) {
                    const sPos = isBack 
                        ? (bedData.parts?.sheetsF?.pos || { x: -0.064, y: 0.682 })
                        : (bedData.parts?.sheets?.pos || { x: 0.114, y: 0.600 });
                    const cx = anchorX + (sPos.x * 150 * u);
                    const cy = anchorY - (sPos.y * 150 * u);
                    const sw = sheetsImg.width * u;
                    const sh = sheetsImg.height * u;
                    ctx.drawImage(sheetsImg, cx - sw * 0.5, cy - sh * 0.5, sw, sh);
                }
            } else {
                // Layer 2C: Character Sleeping Sprite (under the duvet)
                let sleepSprite = isBack ? 'Tsuki/Tsuki-Sleep-Back.png' : 'Tsuki/Tsuki-Sleep-Front.png';
                if (String(item_id) === '820') {
                    sleepSprite = isBack ? 'Tsuki/Tsuki_ShipWreckBedBack_0.png' : 'Tsuki/Tsuki_ShipWreckBedFront_0.png';
                }
                const sleepImg = this.getNpcSprite(sleepSprite);
                if (sleepImg && sleepImg.complete && sleepImg.naturalWidth > 0) {
                    const tsukiLocalX = activeSleepPos.x - 0.351;
                    const tsukiLocalY = activeSleepPos.y + 0.355;
                    const cx = anchorX + (tsukiLocalX * 150 * u);
                    const cy = anchorY - (tsukiLocalY * 150 * u);
                    const tw = sleepImg.width * u;
                    const th = sleepImg.height * u;
                    ctx.drawImage(sleepImg, cx - tw * 0.5, cy - th * 0.5, tw, th);

                    if (this._interactiveActors) {
                        this._interactiveActors.push({
                            charId: 0,
                            name: 'Tsuki',
                            bounds: { minX: cx - tw * 0.5, maxX: cx + tw * 0.5, minY: cy - th * 0.5, maxY: cy + th * 0.5 }
                        });
                    }
                }

                // Layer 2D: Sleeping Duvet / Blanket (drawn ON TOP of Tsuki)
                const coverFile = isBack
                    ? (sheetsSkin?.sheetsSleepF || bedData.parts?.sheetsSleepF?.sprite || 'BedCoverF.png')
                    : (sheetsSkin?.sheetsSleep || bedData.parts?.sheetsSleep?.sprite || 'BedCover.png');
                const coverImg = this.getBedCustomImage(coverFile);
                if (coverImg && coverImg.complete && coverImg.naturalWidth > 0) {
                    const cx = anchorX + (activeSleepPos.x * 150 * u);
                    const cy = anchorY - (activeSleepPos.y * 150 * u);
                    const cw = coverImg.width * u;
                    const ch = coverImg.height * u;
                    ctx.drawImage(coverImg, cx - cw * 0.5, cy - ch * 0.5, cw, ch);
                }
            }
        } else {
            // General character furniture interaction (sitting, reading, drinking tea, bath, etc.)
            if (activeAct && window.ACTIVITIES_DB) {
                const actsDict = window.ACTIVITIES_DB.activities || {};
                const actDef = (actActor && actActor.actDef) || actsDict[String(activeAct)] || (window.ACTIVITIES_DB.free_activities && window.ACTIVITIES_DB.free_activities.find(f => String(f.id) === String(activeAct))) || actsDict['101'];
                if (actDef && actDef.anim && actDef.category !== 'bed') {
                    let animFront = '';
                    let animBack = '';
                    let animFps = 2.5;
                    let animMode = 'pingpong';
                    let isStatic = false;

                    if (typeof actDef.anim === 'string') {
                        animFront = actDef.anim;
                        animBack = actDef.anim;
                        animFps = actDef.fps || 2.5;
                        animMode = actDef.mode || 'loop';
                        isStatic = (actDef.mode === 'static');
                    } else if (typeof actDef.anim === 'object') {
                        animFront = actDef.anim.front || '';
                        animBack = actDef.anim.back || animFront;
                        animFps = actDef.anim.fps || 2.5;
                        animMode = actDef.anim.mode || 'pingpong';
                        isStatic = (actDef.anim.isStatic || actDef.anim.mode === 'static');
                    }

                    // Igual que con los sueltos: las actividades que salen del SAVE traen
                    // los fotogramas con su ruta ya resuelta, del prefab de la actividad.
                    let framesDirectos = null;
                    if (actDef.anim && Array.isArray(actDef.anim.frames) && actDef.anim.frames.length) {
                        const atras = isBack && Array.isArray(actDef.anim.framesBack)
                                      && actDef.anim.framesBack.length;
                        framesDirectos = atras ? actDef.anim.framesBack : actDef.anim.frames;
                        animFps = actDef.anim.fps || animFps;
                        animMode = actDef.anim.mode || animMode;
                    }

                    const animName = isBack ? (animBack || animFront) : (animFront || animBack);
                    if (animName || framesDirectos) {
                        const charKey = (actActor && actActor.npcKey) || actDef.npcKey || '0';
                        let frames = framesDirectos;
                        if (!frames && window.resolveNpcAnimFrames) {
                            frames = window.resolveNpcAnimFrames(charKey, animName);
                        }
                        if ((!frames || !frames.length) && animName) {
                            const ext = animName.endsWith('.png') ? '' : (isStatic ? '.png' : '_0.png');
                            frames = [animName.includes('/') ? animName : (((actActor && actActor.actorName) || actDef.npcName || 'Tsuki') + '/' + animName + ext)];
                        }

                        // Sin fotogramas no hay vecino que pintar, pero el MUEBLE sí:
                        // salir de la función aquí lo dejaría sin dibujar.
                        const currentFrame = (frames && frames.length)
                            ? (window.getAnimationFrame ? window.getAnimationFrame(frames, animFps, animMode) : frames[0])
                            : null;
                        const charImg = currentFrame ? this.getNpcSprite(currentFrame) : null;
                        if (charImg && charImg.complete && charImg.naturalWidth > 0) {
                            this._activeFurnitureActors = (this._activeFurnitureActors || 0) + 1;
                            const isTsuki = (actActor && (actActor.charId === 0 || actActor.npcKey === '0')) || (!actActor && (actDef.npcKey === '0' || actDef.npcName === 'Tsuki'));
                            if (isTsuki) {
                                this._tsukiOnFurniture = true;
                            }
                            const itemId = String(placement?.item_id || placement?.itemId || '');
                            const actKey = String(activeAct);
                            const dbOffsets = (window.ACTIVITIES_DB && window.ACTIVITIES_DB.furniture_offsets) || {};
                            const userOffset = (isBack && dbOffsets[itemId + ':' + actKey + ':back'])
                                || (isBack && dbOffsets[itemId + ':back'])
                                || (!isBack && dbOffsets[itemId + ':front'])
                                || dbOffsets[itemId + ':' + actKey]
                                || dbOffsets[itemId];
                            
                            const defaultOffX = (userOffset?.x != null)
                                ? userOffset.x
                                : ((isBack && seatProfile?.offsets?.back?.x != null)
                                    ? seatProfile.offsets.back.x
                                    : (seatProfile?.offsets?.front?.x != null
                                        ? seatProfile.offsets.front.x
                                        : (actDef.offset?.x || 0)));

                            const defaultOffY = (userOffset?.y != null)
                                ? userOffset.y
                                : ((isBack && seatProfile?.offsets?.back?.y != null)
                                    ? seatProfile.offsets.back.y
                                    : (seatProfile?.offsets?.front?.y != null
                                        ? seatProfile.offsets.front.y
                                        : (actDef.offset?.y !== undefined ? actDef.offset.y : 0.2)));

                            const effOffsetX = (placement?.charOffsetX != null) ? placement.charOffsetX : defaultOffX;
                            const effOffsetY = (placement?.charOffsetY != null) ? placement.charOffsetY : defaultOffY;

                            const offX = effOffsetX * 150 * u;
                            const offY = effOffsetY * drawH;
                            const cx = anchorX + offX;
                            const cy = anchorY - offY;
                            const sw = charImg.width * u;
                            const sh = charImg.height * u;

                            // Layer 2: Draw Character on seat, con su atrezo
                            if (window.PlayNpcs && window.PlayNpcs.pintarExtras) {
                                window.PlayNpcs.pintarExtras(ctx, actDef, cx, cy, u, true);
                            }
                            ctx.drawImage(charImg, cx - sw * 0.5, cy - sh * 0.5, sw, sh);
                            if (window.PlayNpcs && window.PlayNpcs.pintarExtras) {
                                window.PlayNpcs.pintarExtras(ctx, actDef, cx, cy, u, false);
                            }

                            // Layer 3: Draw Furniture Foreground / Backrest (ON TOP of Character)
                            if (useBackLayers && seatProfile.backrest_sprite) {
                                const backrestImg = this.getItemCustomImage(seatProfile.backrest_sprite);
                                if (backrestImg && backrestImg.complete && backrestImg.naturalWidth > 0) {
                                    ctx.drawImage(backrestImg,
                                        anchorX - (drawW * pivotX),
                                        anchorY - (drawH * (1 - pivotY)),
                                        drawW,
                                        drawH
                                    );
                                }
                            } else if (useFrontLayers && (seatProfile.foreground_sprite || seatProfile.backrest_sprite)) {
                                const fgSprite = seatProfile.foreground_sprite || seatProfile.backrest_sprite;
                                const fgImg = this.getItemCustomImage(fgSprite);
                                if (fgImg && fgImg.complete && fgImg.naturalWidth > 0) {
                                    ctx.drawImage(fgImg,
                                        anchorX - (drawW * pivotX),
                                        anchorY - (drawH * (1 - pivotY)),
                                        drawW,
                                        drawH
                                    );
                                }
                            }

                            if (this._interactiveActors) {
                                const actorCharId = (actActor && actActor.charId !== undefined) ? actActor.charId : (isTsuki ? 0 : (actDef.npcID || 0));
                                const actorName = (actActor && actActor.actorName) || actDef.npcName || (isTsuki ? 'Tsuki' : 'NPC');
                                this._interactiveActors.push({
                                    charId: actorCharId,
                                    name: actorName,
                                    bounds: { minX: cx - sw * 0.5, maxX: cx + sw * 0.5, minY: cy - sh * 0.5, maxY: cy + sh * 0.5 }
                                });
                            }
                        }
                    }
                }
            }
        }
        
        ctx.restore();
    }

    _drawAmbientActors(targetLoc, targetFloor) {
        const ctx = this.ctx;
        const _bgo = (window.atlasConfig && window.atlasConfig.bgScale ? window.atlasConfig.bgScale : 0.75);
        const u = _bgo * this.scale;

        let actorsToDraw = [];
        const def = window.MapDef && window.MapDef.get(targetLoc);
        const mapNpcActs = (def && def.logic && def.logic.npc_activities) || [];
        const activeNpcKeys = new Set(mapNpcActs.map(a => String(a.npcKey || '0')));

        if (window.RoutineScheduler) {
            const schedActors = window.RoutineScheduler.getAmbientActors(targetLoc, targetFloor);
            for (const sa of schedActors) {
                // If this is Tsuki and Tsuki is already on furniture, skip Tsuki
                if (sa.charId === 0 && this._tsukiOnFurniture) continue;
                // If NPC is already pinned by map's fixed npc_activities (e.g. Benny at desk), don't duplicate.
                // Compare npcKey against npcKey: activeNpcKeys is built from npc_activities[].npcKey,
                // and charId only coincides with it for the actors defined so far.
                if (activeNpcKeys.has(String(sa.npcKey != null ? sa.npcKey : sa.charId))) continue;
                actorsToDraw.push(sa);
            }
        } else {
            // Fallback if RoutineScheduler is not loaded
            if (this._tsukiOnFurniture) return;
            let actDef = null;
            let gx = 8, gy = 8, floorNum = 0, orientation = 0;
            if (this.app && this.app.parser && typeof this.app.parser.getActivitySaves === 'function') {
                const acts = this.app.parser.getActivitySaves();
                const gridAct = acts.find(a => a.valid && (a.npc === -1 || a.npc === 0 || a.npc == null) && (a.subloc === targetLoc || a.subloc == null) && a.gridX != null);
                if (gridAct) {
                    gx = gridAct.gridX;
                    gy = gridAct.gridY;
                    floorNum = (gridAct.floor != null) ? gridAct.floor : 0;
                    orientation = gridAct.orientation || 0;
                    if (window.ACTIVITIES_DB && window.ACTIVITIES_DB.activities) {
                        actDef = window.ACTIVITIES_DB.activities[String(gridAct.id)];
                    }
                }
            }
            if (!actDef && window.ACTIVITIES_DB && window.ACTIVITIES_DB.activities) {
                actDef = window.ACTIVITIES_DB.activities['101'] || window.ACTIVITIES_DB.activities['502'];
                gx = 8; gy = 8; floorNum = 0; orientation = 0;
            }
            if (actDef && actDef.anim && actDef.category !== 'bed') {
                actorsToDraw.push({
                    actorName: 'Tsuki',
                    charId: 0,
                    npcKey: '0',
                    actDef: actDef,
                    gridPos: { gx, gy, floor: floorNum, orientation }
                });
            }
        }

        for (const actor of actorsToDraw) {
            const gx = actor.gridPos ? actor.gridPos.gx : 8;
            const gy = actor.gridPos ? actor.gridPos.gy : 8;
            const floorNum = actor.gridPos ? actor.gridPos.floor : 0;
            const orientation = actor.gridPos ? actor.gridPos.orientation : 0;
            const isBack = (orientation === 2 || orientation === 3);
            const actDef = actor.actDef || (window.ACTIVITIES_DB && (window.ACTIVITIES_DB.activities?.[String(actor.activityId)] || (window.ACTIVITIES_DB.free_activities && window.ACTIVITIES_DB.free_activities.find(f => String(f.id) === String(actor.activityId))))) || (window.ACTIVITIES_DB && window.ACTIVITIES_DB.activities && window.ACTIVITIES_DB.activities['101']);
            if (!actDef || !actDef.anim || actDef.category === 'bed') continue;

            // LOS QUE PASEAN NO VAN EN LA REJILLA. Un `WalkingActivityBehaviour` no se
            // sienta en una casilla: anda por la acera, en coordenadas de mundo. Por eso
            // se resuelve ANTES del piso, que para ellos no significa nada.
            let paseo = null;
            if (window.PlayWalkers && window.PlayWalkers.esPaseo(actDef)) {
                const mapaDef = window.MapDef && window.MapDef.get(targetLoc);
                paseo = window.PlayWalkers.posicion(
                    String(actor.charId) + ':' + String(actor.activityId),
                    actDef, mapaDef, this._ahoraMs());
                if (!paseo) continue;          // este mapa no tiene acera
            }

            // Un gridPos solo significa algo si el piso de ese groupNum tiene geometria real:
            // getIsoCoords lo ancla en surf.origin, y en los mapas cuyo piso sigue siendo un
            // placeholder el actor acabaria flotando fuera del edificio. Ahi los NPCs los
            // aporta logic.npc_activities, que va en coordenadas de mundo.
            if (!paseo && !this._hasRealFloor(targetLoc, floorNum)) continue;

            const tileCoords = paseo
                ? { x: this.offsetX + paseo.x * 150 * u, y: this.offsetY - paseo.y * 150 * u }
                : this.getIsoCoords(gx, gy, floorNum, targetLoc);
            if (!tileCoords) continue;

            ctx.save();
            const flipH = (orientation === 1 || orientation === 3);
            if (flipH) {
                ctx.translate(tileCoords.x, 0);
                ctx.scale(-1, 1);
                ctx.translate(-tileCoords.x, 0);
            }

            let animFront = '';
            let animBack = '';
            let animFps = 2.5;
            let animMode = 'pingpong';
            let isStatic = false;

            if (typeof actDef.anim === 'string') {
                animFront = actDef.anim;
                animBack = actDef.anim;
                animFps = actDef.fps || 2.5;
                animMode = actDef.mode || 'loop';
                isStatic = (actDef.mode === 'static');
            } else if (typeof actDef.anim === 'object') {
                animFront = actDef.anim.front || '';
                animBack = actDef.anim.back || animFront;
                animFps = actDef.anim.fps || 2.5;
                animMode = actDef.anim.mode || 'pingpong';
                isStatic = (actDef.anim.isStatic || actDef.anim.mode === 'static');
            }

            // Las actividades que salen del SAVE traen los fotogramas ya resueltos, con
            // su ruta: vienen del prefab de la actividad, y 1958 de los 6788 no están en
            // `NPC_DB` porque hubo que sacarlos de los bundles. `anim.frames` gana sobre
            // el nombre de animación de siempre.
            let frames = null;
            if (paseo) {
                // Andar o estar quieto, y hacia que lado: lo decide el paseo, no la
                // orientacion guardada, porque el que anda cambia de cara al dar la vuelta.
                const f = window.PlayWalkers.fotogramas(actDef, paseo, this._ahoraMs());
                frames = f.frames; animFps = f.fps; animMode = f.mode;
            } else if (actDef.anim && Array.isArray(actDef.anim.frames) && actDef.anim.frames.length) {
                const atras = isBack && Array.isArray(actDef.anim.framesBack)
                              && actDef.anim.framesBack.length;
                frames = atras ? actDef.anim.framesBack : actDef.anim.frames;
                animFps = actDef.anim.fps || animFps;
                animMode = actDef.anim.mode || animMode;
            }

            const animName = isBack ? (animBack || animFront) : (animFront || animBack);
            if (!frames && !animName) {
                ctx.restore();
                continue;
            }

            const charKey = actor.npcKey || actDef.npcKey || '0';
            if (!frames && window.resolveNpcAnimFrames) {
                frames = window.resolveNpcAnimFrames(charKey, animName);
            }
            if ((!frames || !frames.length) && animName) {
                const ext = animName.endsWith('.png') ? '' : (isStatic ? '.png' : '_0.png');
                frames = [animName.includes('/') ? animName : ((actor.actorName || actDef.npcName || 'Tsuki') + '/' + animName + ext)];
            }
            if (!frames || !frames.length) { ctx.restore(); continue; }

            const currentFrame = window.getAnimationFrame ? window.getAnimationFrame(frames, animFps, animMode) : frames[0];
            const charImg = this.getNpcSprite(currentFrame);
            if (charImg && charImg.complete && charImg.naturalWidth > 0) {
                const sw = charImg.width * u;
                const sh = charImg.height * u;

                // Ambient shadow under character
                ctx.save();
                ctx.beginPath();
                ctx.ellipse(tileCoords.x, tileCoords.y + 2 * u, sw * 0.28, sh * 0.08, 0, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
                ctx.fill();
                ctx.restore();

                // Draw character grounded on tileCoords
                const cx = tileCoords.x;
                const cy = tileCoords.y - sh * 0.45;
                if (window.PlayNpcs && window.PlayNpcs.pintarExtras) {
                    window.PlayNpcs.pintarExtras(ctx, actDef, cx, cy, u, true);
                }
                ctx.drawImage(charImg, cx - sw * 0.5, cy - sh * 0.5, sw, sh);
                if (window.PlayNpcs && window.PlayNpcs.pintarExtras) {
                    window.PlayNpcs.pintarExtras(ctx, actDef, cx, cy, u, false);
                }

                if (this._interactiveActors) {
                    const actorCharId = (actor.charId !== undefined) ? actor.charId : (actDef.npcID || 0);
                    const actorName = actor.actorName || actDef.npcName || 'Tsuki';
                    this._interactiveActors.push({
                        charId: actorCharId,
                        name: actorName,
                        bounds: { minX: cx - sw * 0.5, maxX: cx + sw * 0.5, minY: cy - sh * 0.5, maxY: cy + sh * 0.5 }
                    });
                }
            }

            ctx.restore();
        }
    }

    /** El instante para todo lo que se mueve en este cuadro. */
    _ahoraMs() {
        return (typeof performance !== 'undefined' && performance.now)
            ? performance.now() : Date.now();
    }

    _getGameHour() {
        if (window.GameTime && typeof window.GameTime.now === 'function') {
            const t = window.GameTime.now();
            if (t && t.hour != null) return t.hour;
        }
        if (this.app && this.app.parser && typeof this.app.parser.getClock === 'function') {
            const t = this.app.parser.getClock();
            if (t && t.hour != null) return t.hour;
        }
        return new Date().getHours();
    }

    _selectNpcActivities(activities) {
        // Las npc_activities de un mapa son ALTERNATIVAS de un mismo personaje, no cosas
        // simultaneas: Benny hace papeleo, duerme y da discursos, pero solo una a la vez.
        // Sin esta seleccion se dibujaban los tres Bennys a la vez, dos de ellos encima
        // del otro porque papeleo y siesta comparten position.
        const hour = this._getGameHour();
        // Mismo corte de noche que RoutineScheduler.getPeriod()
        const isNight = hour >= 22 || hour < 7;

        const byNpc = new Map();
        for (const act of activities) {
            const key = String(act.npcKey || '0');
            if (!byNpc.has(key)) byNpc.set(key, []);
            byNpc.get(key).push(act);
        }

        const out = [];
        byNpc.forEach(list => {
            if (list.length === 1) { out.push(list[0]); return; }
            const bed = list.filter(a => a.isBed);
            const awake = list.filter(a => !a.isBed);
            const pool = (isNight && bed.length) ? bed : (awake.length ? awake : list);
            // Indexar por hora da variedad a lo largo del dia y es estable dentro de la
            // hora, asi que no parpadea entre frames.
            out.push(pool[Math.abs(hour) % pool.length]);
        });
        return out;
    }

    /**
     * Los objetos interactivos que el juego coloca en las escenas.
     *
     * Solo se dibujan los que el escenario NO trae ya pintados: montones de nieve, huevos
     * y objetos sueltos. Los arboles, faroles y campanillas ya estan en el
     * `_Ensamblado.png`, asi que aqui solo se les atiende el toque.
     *
     * Los montones y los huevos ademas pasan por el sorteo del dia
     * (`seeded_scene_objects.js`). Ver LOGICAS_PENDIENTES.md 2 y 2bis.
     */
    _dibujarObjetosDeEscena(targetLoc) {
        const SO = window.SceneObjects;
        if (!SO || !SO.datos) return;
        const lista = SO.de(targetLoc);
        if (!lista.length) return;
        const reloj = (window.GameTime && window.GameTime.now) ? window.GameTime.now() : null;

        // Lo que el SAVE ya da por recogido hoy. Una vez por mapa y por día: si no, lo
        // que cogiste antes de guardar volvería a aparecer al recargar la partida.
        const claveSave = SO.claveMapa(targetLoc) + '|' + (reloj ? (reloj.day | 0) : 0);
        if (SO._saveLeido !== claveSave && typeof SO.cargarRecogidosDelSave === 'function') {
            SO._saveLeido = claveSave;
            SO.cargarRecogidosDelSave(targetLoc, reloj);
        }

        const _bgo = (window.atlasConfig && window.atlasConfig.bgScale ? window.atlasConfig.bgScale : 0.75);
        const s = _bgo * this.scale;
        const ctx = this.ctx;
        const now = performance.now();
        let conBucle = 0;

        lista.forEach((o, i) => {
            if (!SO.visible(o, targetLoc, i, reloj)) return;

            // Los que se sacuden o se columpian se dibujan con sus propios sprites, que
            // se sacaron del `_Ensamblado.png` (marcados `layer: 'skip'` en los visuals)
            // justo para poder rotarlos. Los de escenas superpuestas nunca estuvieron en
            // el fondo: estos son su primer dibujado.
            if (o.familia === 'shake' || o.familia === 'swing') {
                const ang = SO.anguloDe(targetLoc, i);
                (o.sprites || []).forEach(sp => {
                    if (!sp.dir) return;
                    const img = this.getBackgroundImage('images/maps/' + sp.dir + '/' + sp.sp + '.png');
                    if (!img || !img.complete || img.naturalWidth === 0) return;
                    const rw = sp.rw || img.naturalWidth, rh = sp.rh || img.naturalHeight;
                    const ppu = sp.ppu || 150;
                    const w = (img.naturalWidth / ppu) * 150 * s;
                    const h = (img.naturalHeight / ppu) * 150 * s;
                    // el pivote del sprite es el punto por el que cuelga: eje de giro
                    const pvx = (sp.px == null ? 0.5 : sp.px) * w;
                    const pvy = (1 - (sp.py == null ? 0.5 : sp.py)) * h;
                    const x = this.offsetX + (sp.x * 150 * s);
                    const y = this.offsetY - (sp.y * 150 * s);
                    ctx.save();
                    ctx.translate(x, y);
                    if (ang) ctx.rotate(ang);
                    ctx.drawImage(img, -pvx, -pvy, w, h);
                    ctx.restore();
                });
                return;
            }

            // Los que tienen animacion propia se dibujan con su fotograma de ahora.
            // OJO: el sprite del monticulo es `Snow_Mound_*`, NO `FURN_886`. 886 es el
            // ITEM que suelta al recogerlo, que es otra cosa.
            const a = o.anim;
            if (a && a.frames && a.frames.length) {
                conBucle++;
                const i2 = Math.floor((now / 1000) * (a.fps || 4)) % a.frames.length;
                const dir = a.dirs && a.dirs[i2];
                if (!dir) return;
                const img = this.getBackgroundImage('images/maps/' + dir + '/' + a.frames[i2] + '.png');
                if (!img || !img.complete || img.naturalWidth === 0) return;
                const ppu = a.ppu || 150;
                const w = (img.naturalWidth / ppu) * 150 * s;
                const h = (img.naturalHeight / ppu) * 150 * s;
                const pvx = (a.px == null ? 0.5 : a.px) * w;
                const pvy = (1 - (a.py == null ? 0.5 : a.py)) * h;
                ctx.drawImage(img, this.offsetX + (o.x * 150 * s) - pvx,
                                   this.offsetY - (o.y * 150 * s) - pvy, w, h);
                return;
            }

            // Los recogibles tambien se sacaron del fondo (`layer: 'skip'`), para que
            // puedan desaparecer al recogerlos o cuando el sorteo del dia no los saca.
            if (o.sprites && o.sprites.length) {
                o.sprites.forEach(sp => {
                    if (!sp.dir) return;
                    const img = this.getBackgroundImage('images/maps/' + sp.dir + '/' + sp.sp + '.png');
                    if (!img || !img.complete || img.naturalWidth === 0) return;
                    const ppu = sp.ppu || 150;
                    const w = (img.naturalWidth / ppu) * 150 * s;
                    const h = (img.naturalHeight / ppu) * 150 * s;
                    const pvx = (sp.px == null ? 0.5 : sp.px) * w;
                    const pvy = (1 - (sp.py == null ? 0.5 : sp.py)) * h;
                    ctx.drawImage(img, this.offsetX + (sp.x * 150 * s) - pvx,
                                       this.offsetY - (sp.y * 150 * s) - pvy, w, h);
                });
                return;
            }

            if (!SO.DIBUJA[o.clase]) return;
            const idImg = o.item != null ? o.item : null;
            if (idImg == null) return;
            const img = this.getBackgroundImage('images/items/FURN_' + idImg + '.png');
            if (!img || !img.complete || img.naturalWidth === 0) return;
            const x = this.offsetX + (o.x * 150 * s);
            const y = this.offsetY - (o.y * 150 * s);
            const w = img.naturalWidth * s;
            const h = img.naturalHeight * s;
            ctx.drawImage(img, x - w / 2, y - h * 0.92, w, h);
        });

        // Las animaciones ambientales (bandera, ruedas, fuente, cinta) van en bucle: hay
        // que seguir repintando mientras se vean. `playOnTap` es false en las 19, o sea
        // que no son del toque sino continuas.
        //
        // Y con ellas todo lo demás que se mueve solo, que no son fotogramas y por eso
        // no entraba en esta cuenta:
        //   * el agua del muelle y la copa de los árboles, que van por MATERIAL y se
        //     mueven de forma continua mientras se vean;
        //   * la puerta corredera, sólo mientras está abriéndose o cerrándose.
        // Sin esto se quedaban quietas: el port sólo repinta cuando algo se lo pide.
        let sigueVivo = conBucle > 0;
        if (!sigueVivo && window.PlayScenery && window.PlayScenery.tieneMaterialVivo) {
            sigueVivo = window.PlayScenery.tieneMaterialVivo(targetLoc);
        }
        if (!sigueVivo && window.PlayDoors && window.PlayDoors.animando) {
            sigueVivo = window.PlayDoors.animando(targetLoc);
        }
        if (!sigueVivo && window.PlayTrain && window.PlayTrain.animando) {
            sigueVivo = window.PlayTrain.animando();
        }
        // Los que pasean no paran nunca: mientras el mapa tenga acera, hay que repintar.
        // Sin esto el vecino se quedaria congelado a mitad de la acera, que es el mismo
        // fallo que tuvieron el agua y la copa del arbol.
        if (!sigueVivo && window.PlayWalkers && window.PlayWalkers.animando) {
            sigueVivo = window.PlayWalkers.animando(window.MapDef && window.MapDef.get(targetLoc));
        }
        if (sigueVivo && this._bucleAmbienteRaf === undefined
            && typeof requestAnimationFrame === 'function') {
            this._bucleAmbienteRaf = requestAnimationFrame(() => {
                this._bucleAmbienteRaf = undefined;
                try { this.draw(); } catch (e) { /* aun sin lienzo */ }
            });
        }
    }

    _drawMapNpcActivities(targetLoc) {
        const def = window.MapDef && window.MapDef.get(targetLoc);
        const all = def && def.logic && def.logic.npc_activities;
        if (!all || !all.length) return;
        const activities = this._selectNpcActivities(all);

        const ctx = this.ctx;
        const _bgo = (window.atlasConfig && window.atlasConfig.bgScale ? window.atlasConfig.bgScale : 0.75);
        const s = _bgo * this.scale;
        const now = performance.now();

        activities.forEach(act => {
            const npcKey = String(act.npcKey || '0');
            const npc = (window.NPC_DB && window.NPC_DB[npcKey]) || (window.NPC_DB && window.NPC_DB['0']);
            if (!npc) return;

            const animName = act.anim;
            const frames = npc.animations && npc.animations[animName];
            if (!frames || !frames.length) return;

            const fps = act.fps || 4.0;
            const frameDur = fps > 0 ? (1000 / fps) : 9999999;
            const frameIdx = fps > 0 ? (Math.floor(now / frameDur) % frames.length) : 0;
            const frameFile = frames[frameIdx];

            const npcFolder = npc.name || 'Tsuki';
            const imgPath = 'images/npcs/' + npcFolder + '/' + frameFile;
            const img = this.getBackgroundImage(imgPath);
            if (!img || !img.complete || img.naturalWidth === 0) return;

            const posX = act.position && act.position.x != null ? act.position.x : (act.x || 0);
            const posY = act.position && act.position.y != null ? act.position.y : (act.y || 0);
            const screenX = this.offsetX + (posX * 150 * s);
            const screenY = this.offsetY - (posY * 150 * s);
            const w = img.naturalWidth * s;
            const h = img.naturalHeight * s;

            ctx.save();
            ctx.translate(screenX, screenY);
            if (act.flipX) ctx.scale(-1, 1);
            if (act.rotation) ctx.rotate(-(act.rotation * Math.PI / 180));
            ctx.drawImage(img, -w / 2, -h * 0.92, w, h);
            ctx.restore();

            // Registrarlos como clicables: sin esto los NPC fijos del mapa no abrian
            // dialogo (solo lo hacian los de mueble y los ambientales), que es por lo
            // que tocar a Benny en el Ayuntamiento no hacia nada.
            if (this._interactiveActors) {
                this._interactiveActors.push({
                    charId: parseInt(npcKey, 10),
                    name: act.npcName || npc.name,
                    bounds: {
                        minX: screenX - w / 2, maxX: screenX + w / 2,
                        minY: screenY - h * 0.92, maxY: screenY + h * 0.08
                    }
                });
            }
        });
    }

    _drawMapInteractiveProps(targetLoc) {
        const def = window.MapDef && window.MapDef.get(targetLoc);
        const props = def && def.logic && def.logic.interactive_props;
        if (!props || !props.length) return;

        const ctx = this.ctx;
        const _bgo = (window.atlasConfig && window.atlasConfig.bgScale ? window.atlasConfig.bgScale : 0.75);
        const s = _bgo * this.scale;
        const now = performance.now();
        const baseDir = (def.config && def.config.assetsDir ? def.config.assetsDir : 'images/maps/Exportado_level8').replace(/^\.\.\//, '').replace(/^\.\.\//, '');

        props.forEach(p => {
            let frameFile = null;
            if (p.anim && p.anim.type === 'SimpleAnim' && p.anim.frames && p.anim.frames.length) {
                const fps = p.anim.fps || 8.0;
                const frameDur = fps > 0 ? (1000 / fps) : 9999999;
                const idx = fps > 0 ? (Math.floor(now / frameDur) % p.anim.frames.length) : 0;
                frameFile = p.anim.frames[idx];
            } else if (p.sprite) {
                frameFile = p.sprite;
            }
            if (!frameFile) return;

            const cleanFile = frameFile.endsWith('.png') ? frameFile : (frameFile + '.png');
            // p.dir permite frames de otra carpeta (items, otro nivel...), que es lo que
            // hace falta desde que el selector de visuales ofrece el catalogo entero.
            const dir = (p.dir || baseDir).replace(/^(\.\.\/)+/, '');
            const imgPath = dir + '/' + cleanFile;
            const img = this.getBackgroundImage(imgPath);
            if (!img || !img.complete || img.naturalWidth === 0) return;

            const posX = p.position && p.position.x != null ? p.position.x : (p.x || 0);
            const posY = p.position && p.position.y != null ? p.position.y : (p.y || 0);

            const ppu = def.config?.ppu || 150;
            const screenX = this.offsetX + (posX * ppu * s);
            const screenY = this.offsetY - (posY * ppu * s);
            const w = img.naturalWidth * s;
            const h = img.naturalHeight * s;

            // Flag pole pivot: flagpole base is at x: ~0.038, y: ~0.303
            const px = (p.id === 'flag') ? 0.03759 : 0.5;
            const py = (p.id === 'flag') ? 0.30282 : 0.5;

            ctx.save();
            ctx.drawImage(img, screenX - w * px, screenY - h * (1 - py), w, h);
            ctx.restore();
        });
    }

    /**
     * Le dice al sistema de gacha dónde ha quedado la máquina en pantalla, para que
     * pueda pintar las bolas encima en su propio lienzo. Si en este mapa no hay
     * ninguna, la oculta.
     */
    _situarGacha(targetLoc) {
        if (!window.Gacha) return;
        const todos = this._layoutPlacements(targetLoc)
            .concat((this.app?.parser?.placements) || []);
        const g = todos.find(p => p.cluster === targetLoc && !p.isWall
                                  && window.Gacha.esGacha(p.item_id));
        if (!g) { window.Gacha.ocultar(); return; }
        const { w, l } = this.getRotatedSize(g.item_id, g.orientation);
        const c = this._tileCenter(g.x, g.y, w, l, g.floor, g.cluster);
        const _bgo = (window.atlasConfig && window.atlasConfig.bgScale ? window.atlasConfig.bgScale : 0.75);
        window.Gacha.situar(g, c.x, c.y, _bgo * this.scale);
    }

    /**
     * Decoración de festival del mapa (`logic.subscenes`).
     *
     * Estaba extraída desde hace tiempo y no la pintaba nadie: los banderines de
     * Halloween, la nieve de Navidad, el Año Nuevo Lunar y el Festival de Verano del
     * ayuntamiento. Cada clave se traduce a un eventID y solo se dibuja si ese
     * festival cae hoy (ver events_system.js).
     */
    /**
     * Tapa el segundo piso mientras dura la obra.
     *
     * El juego, mientras corre `Home2Construction` (1440 min), muestra el piso ya
     * levantado pero cubierto, y no deja poner nada encima. El bloqueo de colocacion
     * va en `_hitTestPlaySurface`; esto es la parte visible.
     *
     * LOS SPRITES SON LOS DEL JUEGO. Estan en level32, que no es un mapa sino una
     * SUBESCENA llamada `SubsceneData/Construction Boundary`: dos lonas verdes
     * (`construction_0` y `construction_1`) con un cartelito. Se copiaron a
     * images/homecoming/.
     *
     * Lo que NO es exacto es la POSICION. En el juego esa subescena vive en el marco
     * de coordenadas de level32/level28 —sus piezas estan en (-20,-30)— mientras que
     * map_0 usa level2, centrado en el origen. Colocarlas donde el juego las pone
     * exige cambiar el mapa entero a level28, que es lo que hace el juego al ampliar
     * la casa. Mientras tanto se encajan sobre el poligono del piso 4, que comunica
     * el estado aunque el encuadre no sea el del juego.
     */
    _dibujarObraHomecoming(targetLoc) {
        if (String(targetLoc) !== '0') return;                 // solo la Casa del Arbol
        if (this._estadoHomecoming() !== 'obra') return;

        const surfaces = (window.mapsAtlas || []).filter(s =>
            String(s.mapId) === String(targetLoc) && s.kind === 'floor'
            && (s.homecoming_only || s.groupNum === 4));
        if (!surfaces.length) return;

        const ctx = this.ctx;
        const _bgo = (window.atlasConfig && window.atlasConfig.bgScale) || 0.75;
        const u = _bgo * this.scale;

        for (const surf of surfaces) {
            const poly = surf.poly || [];
            if (poly.length < 3) continue;
            const { ox, oy } = this._getSurfaceOrigin(surf, surf.mapId != null ? surf.mapId : targetLoc);
            const sx = this.offsetX + ox * 150 * u;
            const sy = this.offsetY - oy * 150 * u;

            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            for (const pt of poly) {
                const px = (pt.x !== undefined ? pt.x : pt[0]) * 150 * u;
                const py = -(pt.y !== undefined ? pt.y : pt[1]) * 150 * u;
                if (px < minX) minX = px; if (px > maxX) maxX = px;
                if (py < minY) minY = py; if (py > maxY) maxY = py;
            }
            const w = maxX - minX, h = maxY - minY;
            if (!(w > 0 && h > 0)) continue;

            const lona = this._spriteObra('construction_0');
            const cartel = this._spriteObra('construction_1');
            ctx.save();
            ctx.translate(sx, sy);
            if (lona && lona.complete && lona.naturalWidth) {
                // La lona cubre el ancho del piso, conservando su proporcion, y se
                // apoya en el borde inferior del poligono.
                const escala = w / lona.naturalWidth;
                const lh = lona.naturalHeight * escala;
                ctx.drawImage(lona, minX, maxY - lh, w, lh);
                if (cartel && cartel.complete && cartel.naturalWidth) {
                    const ch = cartel.naturalHeight * escala * 0.8;
                    const cw = cartel.naturalWidth * escala * 0.8;
                    ctx.drawImage(cartel, minX - cw * 0.15, maxY - lh - ch * 0.15, cw, ch);
                }
            } else {
                // Respaldo mientras cargan las imagenes.
                ctx.fillStyle = 'rgba(122, 156, 106, 0.92)';
                ctx.fillRect(minX, minY, w, h);
            }
            ctx.restore();

            // Cuanto falta, para que se entienda que es temporal.
            const p = this.app && this.app.parser;
            let falta = '';
            if (p && typeof p.getTempTimerStatus === 'function') {
                const t = p.getTempTimerStatus('Home2Construction');
                if (t && !t.done) {
                    const hh = Math.floor(t.minutesLeft / 60), mm = t.minutesLeft % 60;
                    falta = hh ? (hh + ' h ' + mm + ' min') : (mm + ' min');
                }
            }
            if (!falta) continue;
            const cx = sx + (minX + maxX) / 2, cy = sy + maxY - h * 0.25;
            const texto = 'En obra · faltan ' + falta;
            ctx.save();
            ctx.font = 'bold ' + Math.max(11, Math.round(14 * u)) + 'px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const ancho = ctx.measureText(texto).width + 16 * u;
            const alto = Math.max(19, 24 * u);
            ctx.fillStyle = 'rgba(48, 60, 40, 0.82)';
            ctx.fillRect(cx - ancho / 2, cy - alto / 2, ancho, alto);
            ctx.fillStyle = '#f2ead2';
            ctx.fillText(texto, cx, cy);
            ctx.restore();
        }
    }

    _cacheObra = {};
    _spriteObra(nombre) {
        if (this._cacheObra[nombre] !== undefined) return this._cacheObra[nombre];
        const img = new Image();
        img.onerror = () => { this._cacheObra[nombre] = null; };
        img.onload = () => { try { this.draw(); } catch (e) { /* aun sin mapa */ } };
        img.src = 'images/homecoming/' + nombre + '.png';
        this._cacheObra[nombre] = img;
        return img;
    }

    _drawMapSubscenes(targetLoc) {
        const def = window.MapDef && window.MapDef.get(targetLoc);
        const subs = def && def.logic && def.logic.subscenes;
        if (!subs || !window.VillageEvents) return;

        const ctx = this.ctx;
        const _bgo = (window.atlasConfig && window.atlasConfig.bgScale ? window.atlasConfig.bgScale : 0.75);
        const s = _bgo * this.scale;
        const ppu = def.config?.ppu || 150;
        const baseDir = (def.config?.assetsDir || 'images/maps/Exportado_level8')
            .replace(/^(\.\.\/)+/, '');

        for (const clave of Object.keys(subs)) {
            if (!window.VillageEvents.subescenaActiva(clave)) continue;
            for (const p of (subs[clave] || [])) {
                if (!p || !p.sprite) continue;
                const archivo = p.sprite.endsWith('.png') ? p.sprite : (p.sprite + '.png');
                const img = this.getBackgroundImage((p.dir || baseDir).replace(/^(\.\.\/)+/, '') + '/' + archivo);
                if (!img || !img.complete || img.naturalWidth === 0) continue;
                const sx = this.offsetX + ((p.x || 0) * ppu * s);
                const sy = this.offsetY - ((p.y || 0) * ppu * s);
                const escX = (p.scale && p.scale.x != null ? p.scale.x : 1) * (p.flipX ? -1 : 1);
                const escY = (p.scale && p.scale.y != null ? p.scale.y : 1);
                const w = img.naturalWidth * s * Math.abs(escX);
                const h = img.naturalHeight * s * escY;
                ctx.save();
                if (escX < 0) { ctx.translate(sx, 0); ctx.scale(-1, 1); ctx.translate(-sx, 0); }
                ctx.drawImage(img, sx - w / 2, sy - h / 2, w, h);
                ctx.restore();
            }
        }
    }

    _drawTooltip(p) {
        const ctx  = this.ctx;
        const layerRadio = this._layerRadio();
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
            center = this.getIsoCoords(p.x, p.y, p.floor, p.cluster);
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

    _drawDiamondPath(gx, gy, w, l, shrinkPx = 0, floorNum = 0, mapId) {
        const ctx = this.ctx;
        const top   = this.getIsoCoords(gx,   gy, floorNum, mapId);
        const right = this.getIsoCoords(gx+w, gy, floorNum, mapId);
        const bot   = this.getIsoCoords(gx+w, gy+l, floorNum, mapId);
        const left  = this.getIsoCoords(gx,   gy+l, floorNum, mapId);
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

    _tileCenter(gx, gy, w, l, floorNum = 0, mapId) {
        const top = this.getIsoCoords(gx,   gy, floorNum, mapId);
        const bot = this.getIsoCoords(gx+w, gy+l, floorNum, mapId);
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

        const layerRadio = this._layerRadio();
        const isWallLayer = !isPlay && layerRadio && layerRadio.value === 'wall';

        let visibleFloors = ['0', '1', '2', '3'];
        if (isPlay) {
            if (window.mapsAtlas) {
                const allFloors = window.mapsAtlas.filter(s => s.kind === 'floor' && String(s.mapId) === String(targetLoc));
                const showHC = this._homecomingActivo();
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

        // Los del save y, detrás, los que pone el juego: así al solaparse gana el del save.
        const buscables = this._layoutPlacements(targetLoc).concat(this.app.parser.placements);
        for (let i = 0; i < buscables.length; i++) {
            const p = buscables[i];
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
                const liftX = stack ? (stack.liftX || 0) : 0;
                const liftShift = lift * this.CELL_H * this.scale;
                // Componente horizontal del offset de sub-rejilla (`SubGroupData.Offset`).
                const liftShiftX = liftX * this.CELL_H * this.scale;
                // Hit test anchor matches sprite draw anchor: footprint center
                const center = this._tileCenter(p.x, p.y, w, l, p.floor, p.cluster);
                const off = this._getPlacementRenderOffset(p);
                center.x += off.x;
                center.y += off.y;

                let hit = false;
                const img = this.getImage(p.item_id, p.orientation);
                if (img && img.complete && img.naturalWidth > 0) {
                    const drawW = img.width * u;
                    const drawH = img.height * u;
                    const pivot = this._resolveSpritePivot(p.item_id, img, p.orientation || 0) || { x: 0.5, y: (p.isWall ? 0.5 : 0.25) };
                    const oriNum = Number(p.orientation || 0);
                    const flipH = (oriNum === 1 || oriNum === 3);
                    const pivotX = flipH ? (1 - pivot.x) : pivot.x;
                    const pivotY = pivot.y;

                    const left = center.x + liftShiftX - drawW * pivotX;
                    const boxTop = center.y - liftShift - drawH * (1 - pivotY);
                    if (screenX >= left && screenX <= left + drawW && screenY >= boxTop && screenY <= boxTop + drawH) {
                        hit = true;
                    }
                }

                if (!hit) {
                    const pt1 = this.getIsoCoords(p.x, p.y, p.floor, p.cluster);
                    const pt2 = this.getIsoCoords(p.x + w, p.y, p.floor, p.cluster);
                    const pt3 = this.getIsoCoords(p.x + w, p.y + l, p.floor, p.cluster);
                    const pt4 = this.getIsoCoords(p.x, p.y + l, p.floor, p.cluster);
                    if (off.x || off.y) {
                        pt1.x += off.x; pt1.y += off.y;
                        pt2.x += off.x; pt2.y += off.y;
                        pt3.x += off.x; pt3.y += off.y;
                        pt4.x += off.x; pt4.y += off.y;
                    }
                    if (liftShift || liftShiftX) {
                        pt1.y -= liftShift; pt2.y -= liftShift; pt3.y -= liftShift; pt4.y -= liftShift;
                        pt1.x += liftShiftX; pt2.x += liftShiftX; pt3.x += liftShiftX; pt4.x += liftShiftX;
                    }
                    if (this._pointInPoly(screenX, screenY, [pt1, pt2, pt3, pt4])) {
                        hit = true;
                    }
                }

                // El cultivo se dibuja ENCIMA de la parcela y sobresale bastante por
                // arriba, así que pinchar la zanahoria caía fuera del rombo. Su dibujo
                // cuenta también como zona sensible, pero mirando la OPACIDAD del pixel:
                // su lienzo es 98x264 y casi todo transparente, y con la caja entera se
                // robaban clics de medio campo.
                let cropHit = false;
                if (GROUND_IDS.has(p.item_id)
                    && p.planted_id > 0 && p.planted_id !== 4294967295) {
                    const cdef = this.cropDef(p.planted_id);
                    const frame = p._cropFrame;
                    if (cdef && frame && frame.complete && frame.naturalWidth > 0) {
                        const dw = cdef.frameW * u, dh = cdef.frameH * u;
                        const left = center.x - cdef.pivot.x * dw;
                        const top = center.y - liftShift - (1 - cdef.pivot.y) * dh;
                        if (screenX >= left && screenX <= left + dw
                            && screenY >= top && screenY <= top + dh) {
                            const ix = (screenX - left) / dw * frame.naturalWidth;
                            const iy = (screenY - top) / dh * frame.naturalHeight;
                            if (this.imageAlphaAt(frame, ix, iy) > 24) {
                                hit = true;
                                cropHit = true;
                            }
                        }
                    }
                }

                if (hit) {
                    const floorNum = Number(p.floor || 0);
                    let score;
                    if (cropHit) {
                        // Acertar el dibujo del cultivo manda sobre la tierra de las
                        // parcelas de detrás, que si no se quedaban el clic; y entre dos
                        // cultivos gana el de delante (menor x+y).
                        score = floorNum * 10000 + 1000 - (p.x + p.y) + (lift || 0) * 5;
                    } else {
                        let baseScore = 2000;
                        if (GROUND_IDS.has(p.item_id)) baseScore = 100;
                        else if (SEED_IDS.has(p.item_id)) baseScore = 200;
                        score = floorNum * 10000 + baseScore + (p.x + p.y) * 10 + (lift || 0) * 5;
                    }
                    candidates.push({ placement: p, score });
                }
            }
        }

        if (candidates.length === 0) return null;
        candidates.sort((a, b) => b.score - a.score);
        return candidates[0].placement;
    }

    _hitTest(gridX, gridY, targetFloor, targetLoc, screenX, screenY) {
        const layerRadio = this._layerRadio();
        const isWallLayer = layerRadio && layerRadio.value === 'wall';
        let targetWallGroup = document.getElementById('select-wall-group')?.value;
        if (!targetWallGroup && this.app && this.app.parser) {
            const walls = this.app.parser.placements.filter(p => p.cluster === targetLoc && p.isWall);
            if (walls.length > 0) targetWallGroup = String(walls[0].floor);
        }
        targetWallGroup = targetWallGroup || '0';
        
        let found = [];
        const _todos = this._layoutPlacements(targetLoc).concat(this.app.parser.placements);
        for (let i = _todos.length - 1; i >= 0; i--) {
            const p = _todos[i];
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
            
            if (window.BubbleSystem) {
                window.BubbleSystem.closeBubbles();
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

                if (window.TrainStudio && window.TrainStudio.onMouseDown && window.TrainStudio.onMouseDown(e, mouseX, mouseY)) {
                    return;
                }

                // Módulo 2: Interacción con Personajes en Modo Play (Burbujas Flotantes & Diálogos)
                const isPlay = document.body.classList.contains('play-mode');
                if (isPlay && this._interactiveActors && this._interactiveActors.length > 0) {
                    // Check top-most actor first (reverse order)
                    for (let i = this._interactiveActors.length - 1; i >= 0; i--) {
                        const actor = this._interactiveActors[i];
                        const b = actor.bounds;
                        if (mouseX >= b.minX && mouseX <= b.maxX && mouseY >= b.minY && mouseY <= b.maxY) {
                            if (window.BubbleSystem) {
                                const screenX = rect.left + (b.minX + b.maxX) / 2;
                                const screenY = rect.top + b.minY - 14;
                                window.BubbleSystem.showBubbles({
                                    npcId: actor.charId,
                                    npcName: actor.name,
                                    screenX: screenX,
                                    screenY: screenY
                                });
                            } else if (window.DialogueManager) {
                                window.DialogueManager.startDialogue(actor.charId, actor.name);
                            }
                            this.selectedPlacement = null;
                            if (this.app) this.app.closeItemEditor();
                            return;
                        }
                    }
                }

                if (window.BubbleSystem) {
                    window.BubbleSystem.closeBubbles();
                }

                // Módulo 5: Interacción con el Tablón de Pesca en el Ayuntamiento (Mapa 8)
                const targetLoc = document.getElementById('select-location') ? parseInt(document.getElementById('select-location').value) : 0;
                if (isPlay && targetLoc === 8) {
                    const atlasX = (mouseX - this.offsetX) / this.scale;
                    const atlasY = (mouseY - this.offsetY) / this.scale;
                    if (atlasX >= 370 && atlasX <= 660 && atlasY >= 1140 && atlasY <= 1530) {
                        if (window.BountySystem) {
                            window.BountySystem.open();
                            this.selectedPlacement = null;
                            if (this.app) this.app.closeItemEditor();
                            return;
                        }
                    }
                }

                // Módulo 6: el reproductor de casetes (mueble 406). En el juego es un
                // mueble que se TOCA, no parte de la interfaz: saca sus burbujas
                // `PlayMusic` / `EjectMusic`.
                //
                // Hace falta buscarlo APARTE, con `allowPlayWithoutHammer`, porque en
                // modo play `_findPlacementAtScreen` devuelve null a secas si no estás
                // en modo martillo —para que no se puedan arrastrar los muebles jugando—
                // y así el toque no llegaba nunca. Esto no reabre el arrastre: sólo mira
                // si lo que hay debajo del dedo es un reproductor, y si no lo es sigue
                // por donde iba.
                // Y el BUZÓN (mueble 1622), que en el juego es otro mueble que se toca:
                // `MailboxFurniture.QuickTap()` abre el sobre. Va por el mismo camino y
                // con la misma búsqueda, así que se resuelven juntos: una sola pasada de
                // `_findPlacementAtScreen`, que es la parte cara.
                if (isPlay && (window.MixtapePlayer || window.PlayMail)) {
                    const mueble = this._findPlacementAtScreen(mouseX, mouseY, true);
                    const atendido = mueble && (
                        (window.MixtapePlayer && window.MixtapePlayer.intentarToque(
                            mueble, e.clientX, e.clientY - 18))
                        || (window.PlayMail && window.PlayMail.intentarToque(
                            mueble, e.clientX, e.clientY - 18)));
                    if (atendido) {
                        this.selectedPlacement = null;
                        if (this.app) this.app.closeItemEditor();
                        return;
                    }
                }

                // Módulo 7: la puerta corredera de la Casa de Moca (`SceneDoor`). No es
                // un mueble del save, es parte de la escena, así que no la encuentra
                // `_findPlacementAtScreen`: su caja la apunta `play_scenery` al pintarla,
                // igual que hacen los NPC con `_interactiveActors`.
                if (isPlay && window.PlayDoors && window.PlayDoors.intentarToque(
                        targetLoc, mouseX, mouseY, e.clientX, e.clientY - 18)) {
                    this.selectedPlacement = null;
                    if (this.app) this.app.closeItemEditor();
                    return;
                }

                const clickedPlacement = this._findPlacementAtScreen(mouseX, mouseY) || this.hoveredPlacement;

                if (clickedPlacement) {
                    this.selectedPlacement = clickedPlacement;
                    // TEMP-DoD: log de tamaño al seleccionar (sacar después)
                    if (String(clickedPlacement.item_id) === "115") {
                        const _sz = this.getRotatedSize(115, clickedPlacement.orientation);
                        console.log(`[DoD] 115 ori=${Number(clickedPlacement.orientation)} size=${_sz.w}x${_sz.l}`);
                    }
                    this.hoveredPlacement = clickedPlacement;
                    this.app.openItemEditor(this.selectedPlacement);
                    this.isItemDragging = true;
                    
                    const g = this._pointerToRawGrid(mouseX, mouseY, this.selectedPlacement);
                    this.dragItemOffsetX = g.x - this.selectedPlacement.x;
                    this.dragItemOffsetY = g.y - this.selectedPlacement.y;
                    this._dragSnap = { x: this.selectedPlacement.x, y: this.selectedPlacement.y };

                    this.draw();
                } else {
                    if (window.BubbleSystem) {
                        window.BubbleSystem.closeBubbles();
                    }
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

            if (window.TrainStudio && window.TrainStudio.onMouseMove && window.TrainStudio.onMouseMove(e, mouseX, mouseY)) {
                return;
            }

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

                let floorChanged = false;
                if (isPlayHammer) {
                    const surfaceHit = this._hitTestPlaySurface(mouseX, mouseY, isWallItem ? 'wall' : 'floor');
                    if (isWallItem) {
                        if (surfaceHit && surfaceHit.kind === 'wall') {
                            const oldFlipped = !!this.selectedPlacement.flipped;
                            const oldFloor = this.selectedPlacement.floor;
                            this.selectedPlacement.floor = surfaceHit.floorNum.toString();
                            this.selectedPlacement.flipped = surfaceHit.flipped;
                            if (oldFlipped !== !!surfaceHit.flipped || oldFloor !== this.selectedPlacement.floor) {
                                this.dragItemOffsetX = 0;
                                this.dragItemOffsetY = 0;
                                floorChanged = true;
                            }
                        }
                    } else {
                        if (surfaceHit && surfaceHit.kind === 'floor') {
                            const oldFloor = this.selectedPlacement.floor;
                            this.selectedPlacement.floor = surfaceHit.floorNum.toString();
                            if (oldFloor !== this.selectedPlacement.floor) {
                                this.dragItemOffsetX = 0;
                                this.dragItemOffsetY = 0;
                                floorChanged = true;
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

                if (this.selectedPlacement.x !== snapped.x || this.selectedPlacement.y !== snapped.y || floorChanged) {
                    try {
                        this.app.parser.applyMapChange(
                            this.selectedPlacement,
                            this.selectedPlacement.item_id, snapped.x, snapped.y,
                            this.selectedPlacement.orientation,
                            this.selectedPlacement.floor
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
                const isPlay = document.body.classList.contains('play-mode');
                let hoveredActor = null;
                if (isPlay && this._interactiveActors && this._interactiveActors.length > 0) {
                    for (let i = this._interactiveActors.length - 1; i >= 0; i--) {
                        const actor = this._interactiveActors[i];
                        const b = actor.bounds;
                        if (mouseX >= b.minX && mouseX <= b.maxX && mouseY >= b.minY && mouseY <= b.maxY) {
                            hoveredActor = actor;
                            break;
                        }
                    }
                }

                const targetLoc = document.getElementById('select-location') ? parseInt(document.getElementById('select-location').value) : 0;
                let hoveredBoard = false;
                if (isPlay && targetLoc === 8) {
                    const atlasX = (mouseX - this.offsetX) / this.scale;
                    const atlasY = (mouseY - this.offsetY) / this.scale;
                    if (atlasX >= 370 && atlasX <= 660 && atlasY >= 1140 && atlasY <= 1530) {
                        hoveredBoard = true;
                    }
                }

                if (hoveredActor || hoveredBoard) {
                    this.canvas.style.cursor = 'pointer';
                } else if (!this.isPanDragging && !this.isItemDragging) {
                    this.canvas.style.cursor = '';
                }

                let top = this._findPlacementAtScreen(mouseX, mouseY);
                if (!top && isPlay) {
                    // En modo juego el acierto normal está desactivado (es para el editor),
                    // pero el cultivo necesita saber si lo están apuntando para encender su
                    // resplandor de "listo para cosechar". Solo se admite para parcelas
                    // plantadas, así que nada más cambia de comportamiento.
                    const cand = this._findPlacementAtScreen(mouseX, mouseY, true);
                    if (cand && GROUND_IDS.has(cand.item_id)
                        && cand.planted_id > 0 && cand.planted_id !== 4294967295) {
                        top = cand;
                        this.canvas.style.cursor = 'pointer';
                    }
                }
                if (this.hoveredPlacement !== top) {
                    this.hoveredPlacement = top;
                    this.draw();
                }
            }
        });

        this.canvas.addEventListener('mouseup', (e) => {
            if (window.TrainStudio && window.TrainStudio.onMouseUp) {
                window.TrainStudio.onMouseUp();
            }
            // Los objetos de escena van primero: si se toco uno, no cuenta como paneo.
            if (!this.isItemDragging && !this.isGridDragging && e
                && this._tocarObjetoDeEscena(e.clientX, e.clientY)) {
                this.isPanDragging = false;
                return;
            }
            const wasItemDragging = this.isItemDragging;
            const wasPanning = this.isPanDragging;
            this.isPanDragging  = false;
            this.isItemDragging = false;
            this.isGridDragging = false;
            this._dragSnap = null;
            if (wasItemDragging && document.body.classList.contains('play-mode') && this.app.tsukiPort && typeof this.app.tsukiPort.triggerAutosave === 'function') {
                this.app.tsukiPort.triggerAutosave();
            }
            // Al soltar hay que repintar de verdad: si no, se queda en pantalla la copia
            // del paneo y con ella los personajes congelados.
            if (wasPanning) this.draw();
        });

        this.canvas.addEventListener('mouseleave', () => {
            if (window.TrainStudio && window.TrainStudio.onMouseUp) {
                window.TrainStudio.onMouseUp();
            }
            const wasPanning = this.isPanDragging;
            this.isPanDragging  = false;
            this.isItemDragging = false;
            this.isGridDragging = false;
            this._dragSnap = null;
            if (this.hoveredPlacement) { this.hoveredPlacement = null; this.draw(); }
            else if (wasPanning) this.draw();
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

                    let floorChanged = false;
                    if (isPlayHammer) {
                        const surfaceHit = this._hitTestPlaySurface(mouseX, mouseY, isWallItem ? 'wall' : 'floor');
                        if (isWallItem) {
                            if (surfaceHit && surfaceHit.kind === 'wall') {
                                const oldFlipped = !!this.selectedPlacement.flipped;
                                const oldFloor = this.selectedPlacement.floor;
                                this.selectedPlacement.floor = surfaceHit.floorNum.toString();
                                this.selectedPlacement.flipped = surfaceHit.flipped;
                                if (oldFlipped !== !!surfaceHit.flipped || oldFloor !== this.selectedPlacement.floor) {
                                    this.dragItemOffsetX = 0;
                                    this.dragItemOffsetY = 0;
                                    floorChanged = true;
                                }
                            }
                        } else {
                            if (surfaceHit && surfaceHit.kind === 'floor') {
                                const oldFloor = this.selectedPlacement.floor;
                                this.selectedPlacement.floor = surfaceHit.floorNum.toString();
                                if (oldFloor !== this.selectedPlacement.floor) {
                                    this.dragItemOffsetX = 0;
                                    this.dragItemOffsetY = 0;
                                    floorChanged = true;
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

                    if (this.selectedPlacement.x !== snapped.x || this.selectedPlacement.y !== snapped.y || floorChanged) {
                        try {
                            this.app.parser.applyMapChange(
                                this.selectedPlacement,
                                this.selectedPlacement.item_id, snapped.x, snapped.y,
                                this.selectedPlacement.orientation,
                                this.selectedPlacement.floor
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
                // Igual que con el raton: el toque sobre un objeto de escena manda.
                const t = (e.changedTouches && e.changedTouches[0]) || null;
                if (t && !this.isItemDragging && !this.isGridDragging
                    && this._tocarObjetoDeEscena(t.clientX, t.clientY)) {
                    this.isPanDragging = false;
                    this.isItemDragging = false;
                    return;
                }
                const wasItemDragging = this.isItemDragging;
                const wasPanning = this.isPanDragging;
                this.isPanDragging  = false;
                this.isItemDragging = false;
                this._dragSnap = null;
                if (wasItemDragging && document.body.classList.contains('play-mode') && this.app.tsukiPort && typeof this.app.tsukiPort.triggerAutosave === 'function') {
                    this.app.tsukiPort.triggerAutosave();
                }
                if (wasPanning) this.draw();   // soltar el dedo: volver al dibujado real
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
        this.app.parser.applyMapChange(p, p.item_id, newX, newY, newOri, p.floor);

        this.app.openItemEditor(p);
        
        // Asegurar que la imagen para la nueva orientación esté cargada
        this.getImage(p.item_id, newOri);
        
        this.draw();
    }

    /**
     * `QuickTap` sobre el mundo: traduce el clic a coordenada de mundo y busca que objeto
     * de escena hay debajo. Es la puerta de entrada de los 198 objetos interactivos.
     *
     * La discriminacion toque/arrastre la hace `isQuickTap`, que es la del propio juego.
     */
    _tocarObjetoDeEscena(clientX, clientY) {
        const SO = window.SceneObjects;
        if (!SO || !SO.datos) return false;
        if (!document.body.classList.contains('play-mode')) return false;
        if (!this.isQuickTap(clientX, clientY)) return false;

        const loc = (this.app && this.app.parser && this.app.parser.currentSLocation != null)
            ? this.app.parser.currentSLocation : 0;
        const rect = this.canvas.getBoundingClientRect();
        const px = clientX - rect.left, py = clientY - rect.top;
        const _bgo = (window.atlasConfig && window.atlasConfig.bgScale ? window.atlasConfig.bgScale : 0.75);
        const s = _bgo * this.scale;
        // inversa de  px = offsetX + wx*150*s   /   py = offsetY - wy*150*s
        const wx = (px - this.offsetX) / (150 * s);
        const wy = (this.offsetY - py) / (150 * s);

        const reloj = (window.GameTime && window.GameTime.now) ? window.GameTime.now() : null;
        const hit = SO.enPunto(loc, wx, wy, reloj);
        if (!hit) return false;

        // Dónde ha tocado el dedo, en coordenadas de pantalla: el buzón abre una
        // burbuja y tiene que salir donde se ha tocado, no en la esquina.
        const aviso = SO.tocar(loc, hit.indice, reloj, this.app,
                               { x: clientX, y: clientY - 18 });
        if (aviso && this.app && typeof this.app.showToast === 'function') {
            this.app.showToast(aviso, 'info');
        }
        this.draw();
        return true;
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