/* play_scenery.js — layered bake of map visuals for #/play.
 *
 * Map 0 (Casa) is assembled at runtime from data/maps/map_0.json visuals
 * instead of the static level2_Ensamblado.png:
 *   bake: far/mid/near offscreen canvases (assembled space, PPU px/unit)
 *   frame: drawFar -> coverings (existing) -> drawMid -> furniture ->
 *          actor (if any) -> drawNear -> veil (existing)
 * Any missing sprite or bake error -> bake fails -> map.js falls back to
 * the assembled PNG (Play never goes black). Debug: ?scenery=off forces fallback.
 *
 * Placement convention (same as tools/TsukiMapExtractor_v2.py + origin_px):
 *   assembled_px = (origin_px.x + world_x * ppu, origin_px.y - world_y * ppu)
 *   (origin_px sale de data/maps/map_N.json; en la Casa del Arbol es 1235,1257)
 *   canvas: translate(ax,ay) -> rotate(-angle) -> scale(sx,sy) -> translate(ox,oy)
 *           -> drawImage(img, -px*rw, -(1-py)*rh, rw, rh), alpha = color.a
 */
(function () {
    'use strict';
    const cache = {};   // mapId -> {version, ok, failed, layers, tMs, logged}
    const pending = {};
    // Los fotogramas de las visuales animadas van en su propia cache: `prepare` solo
    // carga las imagenes que hornea, y de una animacion de 14 fotogramas el horneado
    // no tiene ninguno —las animadas quedan fuera a proposito—.
    const imgAnim = {};

    function forceOff() {
        try { return /[?&]scenery=off\b/.test(location.search + ' ' + location.hash); } catch (e) { return false; }
    }

    function loadImage(url) {
        return new Promise(resolve => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => resolve(null);
            img.src = url;
        });
    }

    function layerOf(v) {
        const l = v.layer || 'mid';
        return (l === 'far' || l === 'mid' || l === 'near' || l === 'skip') ? l : 'mid';
    }

    // El COLOR del SpriteRenderer no es solo alfa: 75 sprites traen ademas un tinte RGB
    // -la luz malva del Centro Comercial, el ambar del Taller de Dawn- que el extractor si
    // aplica al hornear el `_Ensamblado.png`. Sin esto, play y el ensamblado no pueden
    // verse iguales. El alfa va aparte, en `globalAlpha`, porque asi se compone igual que
    // en el horneado; aqui solo se multiplican las tres bandas de color.
    const tintes = {};
    function tintar(img, c) {
        if (!c) return img;
        const r = c.r == null ? 1 : c.r, g = c.g == null ? 1 : c.g, b = c.b == null ? 1 : c.b;
        if (r > 0.999 && g > 0.999 && b > 0.999) return img;
        const clave = (img.src || '') + '|' + r + ',' + g + ',' + b;
        if (tintes[clave]) return tintes[clave];
        const cv = document.createElement('canvas');
        cv.width = img.width; cv.height = img.height;
        const q = cv.getContext('2d');
        q.drawImage(img, 0, 0);
        q.globalCompositeOperation = 'multiply';
        q.fillStyle = 'rgb(' + Math.round(r * 255) + ',' + Math.round(g * 255) + ',' + Math.round(b * 255) + ')';
        q.fillRect(0, 0, cv.width, cv.height);
        // `multiply` pinta el rectangulo entero; esto devuelve el recorte del sprite.
        q.globalCompositeOperation = 'destination-in';
        q.drawImage(img, 0, 0);
        tintes[clave] = cv;
        return cv;
    }

    // TESELADO (`m_DrawMode = Tiled`, draw_mode 2). La textura se repite a tamanio NATIVO
    // dentro de un rectangulo de `sz_x` x `sz_y` unidades, anclada abajo, y recortada al
    // `poly` si lo trae. Es la misma cuenta del extractor y la del editor.
    //
    // `bakeLayer` descartaba estas piezas, y con ellas el agua del Muelle de Yori, el
    // cielo nocturno y los arbustos de la Apertura del Tren, y las vias, la grava y los
    // bordillos del Metro: 19 piezas solo en `level52`.
    const teselados = {};
    function teselar(img, v, ppuMapa) {
        const zx = v.sz_x || 0, zy = v.sz_y || 0;
        if (!((v.draw_mode || 0) > 0 && zx > 0 && zy > 0)) return null;
        const p = v.ppu || ppuMapa;
        const w = Math.max(1, Math.round(zx * p)), h = Math.max(1, Math.round(zy * p));
        const anillos = v.poly || [];
        const clave = (img.src || '') + '|' + w + 'x' + h + '|' + (anillos.length ? JSON.stringify(anillos) : '');
        if (teselados[clave]) return teselados[clave];
        const cv = document.createElement('canvas');
        cv.width = w; cv.height = h;
        const q = cv.getContext('2d');
        for (let ty = 0; ty < h; ty += img.height) {
            for (let tx = 0; tx < w; tx += img.width) {
                q.drawImage(img, tx, h - ty - img.height);
            }
        }
        if (anillos.length) {
            const pxn = (v.px == null ? 0.5 : v.px), pyn = (v.py == null ? 0.5 : v.py);
            q.globalCompositeOperation = 'destination-in';
            q.beginPath();
            anillos.forEach(anillo => {
                (anillo || []).forEach((pt, i) => {
                    const X = (pt.x + pxn * zx) * p, Y = h - (pt.y + pyn * zy) * p;
                    if (i === 0) q.moveTo(X, Y); else q.lineTo(X, Y);
                });
                q.closePath();
            });
            q.fillStyle = '#fff';
            q.fill();
            q.globalCompositeOperation = 'source-over';
        }
        const r = { canvas: cv, w: w, h: h };
        teselados[clave] = r;
        return r;
    }

    // EL UMBRAL DE LA ESPUMA (`Shader Graphs/Foam`).
    //
    // Las manchas de espuma del muelle son el sprite `circleBlur`, un círculo blanco
    // difuminado. Dibujado tal cual sale una mancha blanda, que es justo lo que no
    // parece espuma. El shader termina con:
    //
    //     alfa = round(clamp(color.a * 2, 0, 1));
    //     if (alfa == 0) discard;
    //
    // o sea que BINARIZA el alfa: todo lo que pase de 0,25 sale opaco y el resto
    // desaparece. Eso es lo que le da el borde duro. Aquí se aplica al hornear porque no
    // depende del tiempo; lo que sí depende —la deformación por el flowmap— se queda
    // fuera, y está dicho en la cabecera de `play_materials.js`.
    const espumas = {};
    function umbralAlfa(img, umbral) {
        const clave = (img.src || '') + '|' + umbral;
        if (espumas[clave]) return espumas[clave];
        const cv = document.createElement('canvas');
        cv.width = img.width; cv.height = img.height;
        const q = cv.getContext('2d', { willReadFrequently: true });
        q.drawImage(img, 0, 0);
        try {
            const d = q.getImageData(0, 0, cv.width, cv.height);
            const p = d.data;
            const corte = Math.round(umbral * 255);
            for (let i = 3; i < p.length; i += 4) p[i] = p[i] >= corte ? 255 : 0;
            q.putImageData(d, 0, 0);
        } catch (e) {
            // Lienzo contaminado (sprite de otro origen): mejor el sprite sin tocar que
            // no pintar nada.
            return img;
        }
        espumas[clave] = cv;
        return cv;
    }

    function bakeLayer(items, ppu, maxSide, origen) {
        // items: [{img, v}] sorted paint order. Returns {canvas, bx0, by0} or null.
        // `origen` es el ancla mundo->pixel del mapa (config.origin_px).
        const ORG = origen || { x: 1235, y: 1257 };
        const xforms = [];
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        const rad = d => (d || 0) * Math.PI / 180;
        items.forEach(({ img, v }) => {
            // Natural size: use Unity original rect dimensions (v.rw, v.rh) if present, as v.px/v.py are normalized to them.
            // When art is trimmed on export, img.width/img.height < v.rw/v.rh, so top-left anchor offset is:
            // px = v.px * origRw
            // py = img.height - v.py * origRh (since Unity Y is from bottom and Canvas Y is from top)
            // Un teselado sustituye la imagen por el rectangulo ya repetido: su tamanio
            // pasa a ser el del rectangulo, el pivote se mide sobre el, y el recorte de
            // textura (`ox`/`oy`) ya no aplica porque el lienzo nuevo no esta recortado.
            const tel = teselar(img, v, ppu);
            const base = tel ? tel.canvas : img;
            const origRw = tel ? tel.w : ((v.rw != null && v.rw > 0) ? v.rw : img.width);
            const origRh = tel ? tel.h : ((v.rh != null && v.rh > 0) ? v.rh : img.height);
            const rw = tel ? tel.w : img.width, rh = tel ? tel.h : img.height;
            // `sx`/`sy` YA llevan el volteo dentro: el extractor hace
            // `if m_FlipX: wsx *= -1` (TsukiMapExtractor_v2.py) y guarda `flipX` aparte,
            // solo a titulo informativo. Multiplicar otra vez por `flipX` lo anulaba
            // (-1 * -1 = +1), asi que los sprites espejados se dibujaban SIN espejar,
            // encima de sus gemelos en vez de al otro lado.
            //
            // En la Casa del Arbol ampliada eran tres —`UPGRADE_1`, `UPGRADE_3` y
            // `UPGRADE_20`—, o sea TODO el costado derecho del arbol: el tronco y su
            // parte de la copa desaparecian. La casa sin ampliar no tiene ninguno, por eso
            // solo se veia con Homecoming.
            const sx = (v.sx == null ? 1 : v.sx);
            const sy = (v.sy == null ? 1 : v.sy);
            const ax = ORG.x + (v.x || 0) * ppu, ay = ORG.y - (v.y || 0) * ppu;
            // corners of draw rect in pre-transform px (pivot-relative), then scale+rotate+translate
            const px = (v.px == null ? 0.5 : v.px) * origRw;
            const py = rh - (v.py == null ? 0.5 : v.py) * origRh;
            // `oy` va NEGADO. `ox`/`oy` son el `textureRectOffset` del sprite -lo que se
            // recorto de la textura al empaquetarla- y Unity lo da en su eje Y hacia
            // ARRIBA, mientras que aqui se aplica en el del lienzo, hacia abajo. Sumarlo
            // tal cual desplazaba cada pieza recortada el DOBLE de su recorte: el fondo
            // del muelle de `level5` caia 117 px de mas. Son 333 sprites de 3202, en
            // todos los niveles. El extractor lo hace bien (`oy + img_h - py*rh`, en Y
            // hacia arriba), y por eso play y el `_Ensamblado.png` no cuadraban.
            const ox = tel ? 0 : (v.ox || 0), oy = tel ? 0 : -(v.oy || 0);
            const ca = Math.cos(-rad(v.angle || 0)), sa = Math.sin(-rad(v.angle || 0));
            const corners = [[-px, -py], [rw - px, -py], [rw - px, rh - py], [-px, rh - py]].map(([lx, ly]) => {
                let X = (lx + ox) * sx, Y = (ly + oy) * sy;
                const rx = X * ca - Y * sa, ry = X * sa + Y * ca;
                return [ax + rx, ay + ry];
            });
            corners.forEach(([X, Y]) => {
                if (X < minX) minX = X; if (X > maxX) maxX = X;
                if (Y < minY) minY = Y; if (Y > maxY) maxY = Y;
            });
            xforms.push({ img: tintar(base, v.color), v, sx, sy, rw, rh, px, py, ox, oy, alpha: (v.color && v.color.a != null) ? v.color.a : 1 });
        });
        if (!xforms.length) return null;
        const w = Math.ceil(maxX - minX), h = Math.ceil(maxY - minY);
        if (w > maxSide || h > maxSide) {
            console.warn('[scenery] layer exceeds max side', w + 'x' + h);
            return null;
        }
        const cv = document.createElement('canvas');
        cv.width = Math.max(1, w); cv.height = Math.max(1, h);
        const g = cv.getContext('2d');
        xforms.forEach(({ img, v, sx, sy, rw, rh, px, py, ox, oy, alpha }) => {
            const ax = ORG.x + (v.x || 0) * ppu - minX, ay = ORG.y - (v.y || 0) * ppu - minY;
            g.save();
            g.globalAlpha = alpha;
            // Antes, a los sprites con "SHADOWS" en el nombre se les metia `multiply` y
            // un 0,45. No es lo que hace el juego: esas sombras llevan el material de
            // sprite de siempre -lo comparten con otras 40 piezas de la escena- y su
            // color trae el alfa (0,251), que ya esta en `alpha`. Con el multiplicar
            // puesto, play y el `_Ensamblado.png` no podian verse iguales.
            g.translate(ax, ay);
            g.rotate(-(v.angle || 0) * Math.PI / 180);
            g.scale(sx, sy);
            g.translate(ox, oy);
            // px/py are already pixel offsets into an rw×rh frame (see corner math above)
            g.drawImage(img, 0, 0, img.width, img.height, -px, -py, rw, rh);
            g.restore();
        });
        return { canvas: cv, bx0: minX, by0: minY, w: cv.width, h: cv.height };
    }

    // Identidad real del mapa en la cache: incluye la VARIANTE, porque la Casa del Arbol
    // sirve dos escenas distintas (level2 / level28) bajo el mismo mapId 0 y cada una
    // tiene su propio ancla. Ver el comentario de cabecera de `usarVariante` en map_def.js.
    function idEfectivo(mapId) {
        try {
            if (window.MapDef && typeof window.MapDef.efectivo === 'function') {
                return String(window.MapDef.efectivo(mapId));
            }
        } catch (e) { /* MapDef aun sin cargar */ }
        return String(mapId);
    }

    /**
     * El festival de hoy, o -1. Entra en la clave del horneado porque cambia el arte.
     */
    function eventoActivo() {
        try {
            const VE = window.VillageEvents;
            if (VE && typeof VE.idActivo === 'function') return VE.idActivo() | 0;
        } catch (e) { /* aun sin cargar los eventos */ }
        return -1;
    }

    /**
     * ¿Se cumple la condición de una visual de VARIANTE de escena?
     *
     * Mismo criterio que `SceneObjects.condicionSeCumple`: `estacion` contra el `season`
     * del reloj (0 verano, 1 otoño, 2 invierno, 3 primavera) y `evento` contra el
     * festival de hoy. Sin reloj no se cumple nada: es mejor no enseñar la nieve que
     * enseñarla en agosto.
     */
    function condCumple(c) {
        if (!c) return true;
        const reloj = window.GameTime ? window.GameTime.now() : null;
        if (!reloj) return false;
        if (c.tipo === 'estacion') return (reloj.season | 0) === (c.valor | 0);
        if (c.tipo === 'evento') return eventoActivo() === (c.valor | 0);
        return true;
    }

    /**
     * ¿Está encendido ahora un objeto de los que el juego apaga solo?
     *
     * Es `TimedObject`: una ventana horaria (`franjas`, en minutos desde medianoche) y/o
     * unas condiciones del juego. En todo el juego hay diez —las cajas de la Tienda de
     * Yori mientras dura el tutorial, la batería del Taller de Dawn, y los carteles de
     * CERRADO y las cortinas de la Casa de Té y de Rosemary—, y los marca
     * `tools/sync_timed_objects.py`.
     *
     * Lo que no se sabe juzgar NO oculta: `Activities.cumple` devuelve null cuando le
     * falta el dato, y entonces la pieza se queda como está en la escena, que es lo que
     * lleva el `_Ensamblado.png`. Es mejor enseñar un cartel de más que vaciar el mapa.
     */
    function condTCumple(ct) {
        if (!ct) return true;
        const reloj = window.GameTime ? window.GameTime.now() : null;
        const franjas = ct.franjas || [];
        if (franjas.length) {
            if (!reloj) return true;
            const m = (reloj.hour | 0) * 60 + (reloj.minute | 0);
            const dentro = franjas.some(f => (f[0] <= f[1]) ? (m >= f[0] && m < f[1])
                                                            : (m >= f[0] || m < f[1]));
            if (!dentro) return false;
        }
        const cs = ct.conds || [];
        const A = window.Activities;
        if (cs.length && A && typeof A.cumple === 'function') {
            const res = cs.map(c => { try { return A.cumple(c, {}); } catch (e) { return null; } });
            // `conditionOp`: 0 And, 1 Or.
            if ((ct.op | 0) === 1) { if (res.every(r => r === false)) return false; }
            else if (res.some(r => r === false)) return false;
        }
        return true;
    }

    // Qué mapas tienen piezas que cambian por hora, y en qué tramos. Se calcula una vez
    // por mapa: son los bordes de las franjas de sus `condT`, así que la clave del
    // horneado solo cambia cuando de verdad cambia algo, no cada media hora.
    const horarios = {};
    function tramosDe(mapId) {
        const k = idEfectivo(mapId);
        if (horarios[k] !== undefined) return horarios[k];
        let bordes = null;
        try {
            const vs = (window.MapDef && window.MapDef.visuals) ? window.MapDef.visuals(mapId) : null;
            if (vs) {
                const set = new Set();
                for (const v of vs) {
                    for (const f of ((v.condT && v.condT.franjas) || [])) { set.add(f[0]); set.add(f[1]); }
                }
                if (set.size) { bordes = [...set].sort((a, b) => a - b); }
            }
        } catch (e) { /* aún sin def */ }
        horarios[k] = bordes;
        return bordes;
    }
    function mapaPorHoras(mapId) { return !!tramosDe(mapId); }
    function franjaDe(mapId, minutos) {
        const b = tramosDe(mapId) || [];
        let i = 0;
        while (i < b.length && minutos >= b[i]) i++;
        return i;
    }

    function claveDe(mapId) {
        const curSeason = (window.GameTime ? window.GameTime.now().season : 0);
        let clave = idEfectivo(mapId) + '_s' + curSeason + '_e' + eventoActivo();
        // La hora entra en la clave SOLO en los mapas que tienen piezas por franja
        // horaria —los carteles de CERRADO y las cortinas de la Casa de Té y de
        // Rosemary—, que son dos. Meterla en todos haría rehornear los 37 cada media
        // hora y llenaría la caché de lienzos que nadie mira.
        if (mapaPorHoras(mapId)) {
            const reloj = window.GameTime ? window.GameTime.now() : null;
            const m = reloj ? ((reloj.hour | 0) * 60 + (reloj.minute | 0)) : 0;
            clave += '_h' + franjaDe(mapId, m);
        }
        return clave;
    }

    function getCache(mapId) {
        return cache[claveDe(mapId)] || cache[idEfectivo(mapId)];
    }

    function prepare(mapId) {
        mapId = String(mapId);
        const curSeason = (window.GameTime ? window.GameTime.now().season : 0);
        const cacheKey = claveDe(mapId);
        if (cache[cacheKey] || pending[cacheKey] || forceOff()) return;
        // Estaciones de tren (10, 14, 15): usan el sistema de capas de tren (SinTren, Tren, Encima)
        // y su lienzo excede 4096 px. No usan PlayScenery.
        if (['10', '14', '15'].includes(mapId)) {
            cache[cacheKey] = { ok: false, failed: false, skipped: true };
            return;
        }
        pending[cacheKey] = true;
        const t0 = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
        window.MapDef.load(mapId).then(def => {
            if (!def) { cache[cacheKey] = { ok: false, failed: true }; delete pending[cacheKey]; return null; }
            if (window.MapDef.syncAtlas) { try { window.MapDef.syncAtlas(mapId); } catch (e) { console.warn('[scenery] syncAtlas', e); } }
            const visuals = (window.MapDef.visuals(mapId) || []).filter(v => {
                // `light`: los nueve niveles de `light_layers.json` tienen las luces SACADAS del
                // `_Ensamblado.png` y horneadas aparte en `levelN_Luces.png`, que `play_lighting`
                // pinta en aditivo sobre el velo de noche. Dibujarlas tambien aqui, planas y con
                // mezcla normal, lavaba el mapa entero de dia (el Centro Comercial iba bajo un
                // cuadro blanco de 5120x2560). Las marca `tools/sync_light_visuals.py`.
                if (!v || v.active === false || v.sp === 'Square') return false;
                const cl = v.layer || 'mid';
                if (cl === 'skip' || cl === 'light') return false;
                // Variantes de escena: `cond` es cuándo SE VE esta pieza (la nieve de
                // invierno, los farolillos del festival) y `condNo` cuándo NO se ve una
                // pieza de la base a la que una variante sustituye —la copa del árbol de
                // invierno reemplaza a la normal, y sin esto se verían las dos—.
                // Las escribe `tools/merge_scene_variants.py`.
                if (v.cond && !condCumple(v.cond)) return false;
                if (v.condNo && v.condNo.some(condCumple)) return false;
                if (v.condT && !condTCumple(v.condT)) return false;
                // Las ANIMADAS no se hornean: cambian de sprite con el tiempo, y una
                // capa horneada es una imagen fija. Se pintan en vivo con `drawAnimadas`.
                //
                // Esto sustituye al caso escrito a mano que sacaba del horneado la
                // bandera del Ayuntamiento. Son once en total, atadas a su visual por
                // `tools/sync_scene_anims.py` desde los `SimpleAnim` de la escena: el
                // alfarero de la Casa del Árbol, la bandera, el banner de Momo, las
                // cuatro ruedas del tren, las dos capas de la fuente del Centro
                // Comercial y la cinta transportadora.
                if (v.anim && v.anim.frames && v.anim.frames.length) return false;
                // Y tampoco las que lleven un material que se mueve solo: el agua del
                // muelle, que corre, y la copa de los árboles, que se mece. No cambian de
                // sprite —el sprite es uno y está quieto—, se mueve el MATERIAL, así que
                // el extractor de animaciones nunca las vio. Las marca
                // `tools/sync_scene_materials.py` y las pinta `drawMateriales`.
                if (window.PlayMaterials && window.PlayMaterials.enVivo(mapId, v)) return false;
                // Y las piezas de la puerta corredera, que se desplazan enteras al
                // abrirse. Tampoco cambian de sprite: lo que se mueve es su Transform.
                if (window.PlayDoors && window.PlayDoors.esPieza(mapId, v)) return false;
                // Y el tren de la Estacion, que entra deslizandose al empezar la partida.
                if (window.PlayTrain && window.PlayTrain.esPieza(mapId, v)) return false;
                return true;
            });
            if (!visuals.length) {
                console.warn('[scenery] bake map' + mapId + ' fallback assembled: no bakeable visuals');
                cache[cacheKey] = { ok: false, failed: true };
                delete pending[cacheKey];
                return;
            }
            // Las animadas, aparte: no van a ninguna capa horneada.
            const animadas = (window.MapDef.visuals(mapId) || []).filter(v => {
                if (!v || v.active === false || !v.anim || !(v.anim.frames || []).length) return false;
                const cl = v.layer || 'mid';
                if (cl === 'skip' || cl === 'light') return false;
                if (v.cond && !condCumple(v.cond)) return false;
                if (v.condNo && v.condNo.some(condCumple)) return false;
                if (v.condT && !condTCumple(v.condT)) return false;
                return true;
            });

            // Las de material que se mueve solo y las de la puerta, aparte también.
            // Mismo filtro de condiciones: una pieza que no toca ver no se pinta aunque
            // se mueva.
            const conMaterial = (window.MapDef.visuals(mapId) || []).filter(v => {
                if (!v || v.active === false) return false;
                const porMaterial = window.PlayMaterials && window.PlayMaterials.enVivo(mapId, v);
                const porPuerta = window.PlayDoors && window.PlayDoors.esPieza(mapId, v);
                const porTren = window.PlayTrain && window.PlayTrain.esPieza(mapId, v);
                if (!porMaterial && !porPuerta && !porTren) return false;
                const cl = v.layer || 'mid';
                if (cl === 'skip' || cl === 'light') return false;
                if (v.cond && !condCumple(v.cond)) return false;
                if (v.condNo && v.condNo.some(condCumple)) return false;
                if (v.condT && !condTCumple(v.condT)) return false;
                return true;
            });

            const byLayer = { far: [], mid: [], near: [] };
            const missing = [];
            const getSpName = sp => {
                if (String(mapId) === '0') {
                    // SeasonID: 1=Otonio 2=Invierno 3=Primavera (antes se usaba
                    // 2=otonio 3=invierno 0=primavera, y el arte salia desplazado).
                    if (curSeason === 1) {
                        if (sp === 'T2 TREEHOUSE SLICED_0') return 'TreehouseFall_Autumn';
                        if (sp === 'T2 TREEHOUSE SLICED_1') return 'TreehouseFall_Autumn_BranchR';
                        if (sp === 'T2 TREEHOUSE SLICED_2') return 'TreehouseFall_Autumn_BranchL';
                        if (sp === 'Leaves1' || sp === 'Leaves2' || sp === 'Leaves4') return sp + '_Autumn';
                    } else if (curSeason === 2) {
                        if (sp === 'T2 TREEHOUSE SLICED_0') return 'TreehouseSnow_Winter';
                        if (sp === 'T2 TREEHOUSE SLICED_1') return 'TreehouseSnow_Winter_BranchR';
                        if (sp === 'T2 TREEHOUSE SLICED_2') return 'TreehouseSnow_Winter_BranchL';
                    } else if (curSeason === 3) {
                        if (sp === 'T2 TREEHOUSE SLICED_0') return 'TreehouseSpring_Sakura';
                        if (sp === 'T2 TREEHOUSE SLICED_1') return 'TreehouseSpring_Sakura_BranchR';
                        if (sp === 'T2 TREEHOUSE SLICED_2') return 'TreehouseSpring_Sakura_BranchL';
                    }
                } else if (String(mapId) === '8') {
                    if (curSeason === 1 && (sp === 'Leaves1' || sp === 'Leaves2' || sp === 'Leaves4')) {
                        return sp + '_Autumn';
                    }
                }
                return sp;
            };
            const jobs = visuals.map(v => window.MapDef.assetUrl(mapId, getSpName(v.sp), v.dir));
            return Promise.all(jobs.map(loadImage)).then(imgs => {
                const items = { far: [], mid: [], near: [] };
                let dimMismatch = 0;
                visuals.forEach((v, i) => {
                    let img = imgs[i];
                    if (!img) { missing.push(v.sp); return; }
                    if (img.width !== v.rw || img.height !== v.rh) dimMismatch++;
                    // La espuma va con el alfa binarizado, que es lo que le da el borde
                    // duro. Ver `umbralAlfa`.
                    if (window.PlayMaterials && window.PlayMaterials.esEspuma(mapId, v)) {
                        img = umbralAlfa(img, window.PlayMaterials.FOAM_UMBRAL);
                    }
                    items[layerOf(v)].push({ img, v });
                });
                if (missing.length) {
                    console.warn('[scenery] bake map' + mapId + ' fallback assembled: missing sprites', missing.slice(0, 12).join(', ') + (missing.length > 12 ? '…' : ''));
                    cache[cacheKey] = { ok: false, failed: true };
                    delete pending[cacheKey];
                    return;
                }
                const cfgMapa = window.MapDef.config(mapId) || {};
                const ppu = cfgMapa.ppu || 150;
                // El ancla mundo->pixel del mapa. Estaba clavada a (1235,1257), que es la
                // de la Casa del Arbol: en cualquier otro mapa la escenografia se habria
                // horneado descolocada.
                const origen = cfgMapa.origin_px
                    || { x: (String(mapId) === '0' ? 1235 : 0), y: (String(mapId) === '0' ? 1257 : 0) };
                const order = (a, b) => ((a.v.sl || 0) - (b.v.sl || 0)) || ((a.v.o || 0) - (b.v.o || 0));
                // La CLAVE de pintado de Unity: primero la capa de orden, luego el orden
                // dentro de ella. Es la que usa `order` y la que hace falta para saber
                // dónde va una pieza viva respecto a las horneadas.
                const clave = v => [(v.sl || 0), (v.o || 0)];
                const antes = (a, b) => (a[0] - b[0]) || (a[1] - b[1]);

                // Dónde CORTA cada capa: la clave de la primera pieza viva que hay en
                // ella. Lo que va antes se hornea aparte y se pinta debajo; lo que va
                // después, encima. Sin esto el agua del muelle —que es lo más al fondo
                // de su capa, `sl` −8— se pintaría al final y taparía el muelle entero.
                const corte = {};
                conMaterial.forEach(v => {
                    const L = layerOf(v);
                    const k = clave(v);
                    if (!corte[L] || antes(k, corte[L]) < 0) corte[L] = k;
                });

                const layers = {};
                const layersPost = {};
                let noCupo = null;
                ['far', 'mid', 'near'].forEach(L => {
                    items[L].sort(order);
                    let debajo = items[L], encima = [];
                    if (corte[L]) {
                        debajo = items[L].filter(it => antes(clave(it.v), corte[L]) < 0);
                        encima = items[L].filter(it => antes(clave(it.v), corte[L]) >= 0);
                    }
                    layersPost[L] = encima.length
                        ? bakeLayer(encima, ppu, 4096, origen) : null;
                    const capa = bakeLayer(debajo, ppu, 4096, origen);
                    // Una capa con piezas que no sale es un horneado ROTO, no una capa
                    // vacia. Antes se guardaba `ok: true` igualmente: `ready()` decia que
                    // si, `map.js` dejaba de dibujar el PNG ensamblado —solo lo pinta
                    // cuando la escenografia esta apagada— y no ponia nada en su lugar.
                    // El mapa aparecia un segundo y se quedaba en blanco. Pasaba en la
                    // Estacion de Tren, cuyo lienzo es de 6066x4593 y no cabe en 4096.
                    // Se mira `debajo`, no `items[L]`: si TODAS las piezas de la capa
                    // caen por encima del corte, `debajo` está vacío y que no salga
                    // lienzo es lo normal, no un horneado roto.
                    if (!capa && debajo.length) noCupo = noCupo || L;
                    if (!layersPost[L] && encima.length) noCupo = noCupo || L;
                    layers[L] = capa;
                });
                if (noCupo) {
                    console.warn('[scenery] bake map' + mapId + ' fallback assembled: la capa '
                        + noCupo + ' no cabe en 4096 px');
                    cache[cacheKey] = { ok: false, failed: true };
                    delete pending[cacheKey];
                    return;
                }
                const t1 = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
                cache[cacheKey] = { ok: true, failed: false, layers, layersPost, origen, ppu,
                                    animadas, conMaterial,
                                    tMs: Math.round(t1 - t0), version: def.version };
                delete pending[cacheKey];
                console.info('[scenery] bake map' + mapId + ' ' + cache[cacheKey].tMs + 'ms' +
                    ' far=' + (layers.far ? layers.far.w + 'x' + layers.far.h : '—') +
                    ' mid=' + (layers.mid ? layers.mid.w + 'x' + layers.mid.h : '—') +
                    ' near=' + (layers.near ? layers.near.w + 'x' + layers.near.h : '—') +
                    ' visuals=' + visuals.length +
                    (dimMismatch ? ' dimmismatch=' + dimMismatch : ''));
            });
        }).catch(e => {
            console.warn('[scenery] bake map' + mapId + ' fallback assembled:', e);
            cache[cacheKey] = { ok: false, failed: true };
            delete pending[cacheKey];
        });
    }

    function ready(mapId) {
        const c = getCache(mapId);
        return !!(c && c.ok) && !forceOff();
    }

    /** Vuelca un lienzo horneado, recortado a lo que entra en pantalla. */
    function volcar(ctx, L, origen, offsetX, offsetY, s) {
        if (!L) return;
        // El mismo ancla con el que se horneo. Estaba clavado a la Casa del Arbol.
        const org = origen || { x: 1235, y: 1257 };
        const dx = offsetX - (org.x - L.bx0) * s;
        const dy = offsetY - (org.y - L.by0) * s;
        // Solo el trozo que entra en pantalla. Estas capas horneadas son enormes y
        // volcarlas enteras escaladas en cada repintado era el grueso del coste de
        // mover la cámara en la Casa del Árbol.
        const cw = ctx.canvas.width, ch = ctx.canvas.height;
        const sx = Math.floor(Math.max(0, (0 - dx) / s));
        const sy = Math.floor(Math.max(0, (0 - dy) / s));
        const sw = Math.ceil(Math.min(L.canvas.width, (cw - dx) / s)) - sx;
        const sh = Math.ceil(Math.min(L.canvas.height, (ch - dy) / s)) - sy;
        if (sw <= 0 || sh <= 0) return;           // fuera de pantalla
        ctx.drawImage(L.canvas, sx, sy, sw, sh, dx + sx * s, dy + sy * s, sw * s, sh * s);
    }

    /**
     * Pinta una capa: el trozo horneado de debajo, lo que se mueve por material, y el
     * trozo horneado de encima.
     *
     * La capa va en DOS lienzos porque las piezas que se mueven están en medio de ella,
     * no al final. El agua del muelle es lo más al fondo de su capa (`sl` −8): pintarla
     * después del lienzo entero taparía el muelle. El corte se calcula al hornear, con
     * la misma clave `(sl, o)` con la que Unity ordena.
     */
    function drawLayer(ctx, mapId, layer, offsetX, offsetY, s) {
        if (window.PlayScenery.show && window.PlayScenery.show[layer] === false) return false;
        const c = getCache(mapId);
        if (!c || !c.ok) return false;
        const base = c.layers[layer];
        const post = c.layersPost && c.layersPost[layer];
        if (!base && !post) return false;
        volcar(ctx, base, c.origen, offsetX, offsetY, s);
        drawMateriales(ctx, mapId, offsetX, offsetY, s, layer);
        volcar(ctx, post, c.origen, offsetX, offsetY, s);
        return true;
    }

    /**
     * Qué fotograma toca ahora, según el modo de bucle del `SimpleAnimation`.
     *
     *   0 Loop        da la vuelta sin parar
     *   1 Transition  los primeros `transitionStart` fotogramas son la entrada y luego
     *                 se repite el resto
     *   2 None        se queda en el último
     *   3 LoopStart   repite el principio
     *
     * El alfarero de la Casa del Árbol es `Transition` con 14 fotogramas; las ruedas del
     * tren y la bandera son `Loop`.
     */
    function fotogramaDe(anim, ms) {
        const n = anim.frames.length;
        if (n <= 1 || anim.stopped) return 0;
        const fps = anim.fps > 0 ? anim.fps : 8;
        const i = Math.floor(ms / (1000 / fps));
        const modo = anim.loopMode | 0;
        if (modo === 2) return Math.min(i, n - 1);            // None: para en el último
        if (modo === 1 || modo === 3) {
            const ini = Math.max(0, Math.min(n - 1, anim.transitionStart | 0));
            if (i < ini) return i;
            const resto = n - ini;
            return resto > 0 ? ini + ((i - ini) % resto) : ini;
        }
        return i % n;                                          // Loop
    }

    /**
     * Pinta las visuales animadas del mapa, encima de las capas horneadas.
     *
     * Reproduce la MISMA transformación que `bakeLayer`, solo que en pantalla: el mundo
     * va a píxel con `x * ppu`, y de ahí a pantalla con `offsetX + ... * s`. El pivote,
     * el recorte de textura (`ox`/`oy`, con la `y` negada), la escala —que ya lleva el
     * volteo dentro— y el ángulo se aplican igual. Si divergieran, una pieza animada
     * saltaría de sitio al empezar a moverse.
     */
    function drawAnimadas(ctx, mapId, offsetX, offsetY, s) {
        const c = getCache(mapId);
        if (!c || !c.ok || !c.animadas || !c.animadas.length) return false;
        const ppu = c.ppu || 150;
        const ms = (typeof performance !== 'undefined' && performance.now)
            ? performance.now() : Date.now();
        const rad = d => (d || 0) * Math.PI / 180;
        for (const v of c.animadas) {
            const idx = fotogramaDe(v.anim, ms);
            const f = v.anim.frames[idx];
            const nombre = (typeof f === 'string') ? f : (f && f.sprite);
            if (!nombre) continue;
            const url = window.MapDef.assetUrl(mapId, nombre, v.dir);
            const img = imgAnim[url];
            if (img === undefined) { imgAnim[url] = null; loadImage(url).then(im => { imgAnim[url] = im; }); continue; }
            if (!img) continue;

            // Las medidas son LAS DEL FOTOGRAMA, no las de la visual. Unity recorta cada
            // sprite por separado al empaquetar el atlas, asi que el pivote y el recorte
            // cambian de uno a otro: 18 de las 19 animaciones tienen fotogramas de
            // tamanos distintos. Con las de la visual para todos, la pieza tiembla.
            // Se cae a las de la visual si el fotograma no las trae, que es el formato
            // viejo -una lista de nombres- y sigue valiendo.
            const m = (f && typeof f === 'object' && f.rw != null) ? f : v;
            const tel = teselar(img, v, ppu);
            const base = tel ? tel.canvas : img;
            const origRw = tel ? tel.w : ((m.rw != null && m.rw > 0) ? m.rw : img.width);
            const origRh = tel ? tel.h : ((m.rh != null && m.rh > 0) ? m.rh : img.height);
            const rw = tel ? tel.w : img.width, rh = tel ? tel.h : img.height;
            const sx = (v.sx == null ? 1 : v.sx), sy = (v.sy == null ? 1 : v.sy);
            const px = (m.px == null ? 0.5 : m.px) * origRw;
            const py = rh - (m.py == null ? 0.5 : m.py) * origRh;
            const ox = tel ? 0 : (m.ox || 0), oy = tel ? 0 : -(m.oy || 0);
            const ax = offsetX + (v.x || 0) * ppu * s;
            const ay = offsetY - (v.y || 0) * ppu * s;

            ctx.save();
            ctx.globalAlpha = (v.color && v.color.a != null) ? v.color.a : 1;
            ctx.translate(ax, ay);
            ctx.scale(s, s);
            ctx.rotate(-rad(v.angle));
            ctx.scale(sx, sy);
            ctx.translate(ox, oy);
            ctx.drawImage(tintar(base, v.color), 0, 0, base.width, base.height, -px, -py, rw, rh);
            ctx.restore();
        }
        return true;
    }

    /**
     * Pinta lo que se mueve por MATERIAL, no por fotogramas: el agua del muelle y la
     * copa de los árboles.
     *
     * Va con la misma transformación que `drawAnimadas` —mundo a píxel con `x * ppu`, y
     * de ahí a pantalla con `offsetX + ... * s`— para que una pieza no salte de sitio al
     * empezar a moverse. Lo único propio es cómo se dibuja el sprite una vez colocado:
     *
     *   agua  la textura teselada, empezando la rejilla un poco corrida. Así la costura
     *         cae siempre dentro y lo que se ve es un desplazamiento continuo.
     *   copa  el sprite cortado en tiras horizontales, cada una desplazada un poco más
     *         que la de abajo. Es la aproximación en 2D de lo que hace `DistortVertex`,
     *         que mueve vértices: el pie clavado —ahí es donde `TreeProp.Trunk.leavesPivot`
     *         ata las hojas al tronco— y la punta suelta.
     *
     * Las cuentas y de dónde sale cada número están en `play_materials.js`.
     */
    function drawMateriales(ctx, mapId, offsetX, offsetY, s, capa) {
        const c = getCache(mapId);
        const PM = window.PlayMaterials;
        if (!c || !c.ok || !PM || !c.conMaterial || !c.conMaterial.length) return false;
        const ppu = c.ppu || 150;
        // `capa` viene de `drawLayer`: cada pieza se pinta con la suya, entre los dos
        // trozos horneados, para que conserve su sitio en el orden de pintado.
        const soloCapa = capa || null;
        const ms = (typeof performance !== 'undefined' && performance.now)
            ? performance.now() : Date.now();
        const rad = d => (d || 0) * Math.PI / 180;

        const PD = window.PlayDoors;
        const PT = window.PlayTrain;
        let cajaPuerta = null;
        for (const v of c.conMaterial) {
            if (soloCapa && layerOf(v) !== soloCapa) continue;
            const esPuerta = !!(PD && PD.esPieza(mapId, v));
            const esTren = !esPuerta && !!(PT && PT.esPieza(mapId, v));
            // El tren se pinta igual que la puerta: desplazamiento entero del grupo.
            const efecto = (esPuerta || esTren) ? 'puerta' : PM.efectoDe(mapId, v);
            if (!efecto) continue;
            const url = window.MapDef.assetUrl(mapId, v.sp, v.dir);
            const img = imgAnim[url];
            if (img === undefined) {
                imgAnim[url] = null;
                loadImage(url).then(im => { imgAnim[url] = im; });
                continue;
            }
            if (!img) continue;

            const sx = (v.sx == null ? 1 : v.sx), sy = (v.sy == null ? 1 : v.sy);
            // La puerta corredera se desplaza ENTERA: su Animator mueve el Transform, no
            // el sprite. Así que el desplazamiento entra en el ancla, antes de nada, y se
            // lleva por igual sus dos piezas.
            const corre = esPuerta ? PD.desplazamiento(mapId, ms)
                        : esTren ? PT.desplazamiento(mapId, ms)
                        : { dx: 0, dy: 0 };
            const ax = offsetX + ((v.x || 0) + corre.dx) * ppu * s;
            const ay = offsetY - ((v.y || 0) + corre.dy) * ppu * s;

            ctx.save();
            ctx.globalAlpha = (v.color && v.color.a != null) ? v.color.a : 1;
            ctx.translate(ax, ay);
            ctx.scale(s, s);
            ctx.rotate(-rad(v.angle));
            ctx.scale(sx, sy);

            const seg = ms / 1000;
            if (efecto === 'agua') {
                // El rectángulo del agua, en píxeles, igual que en `teselar`.
                const p = v.ppu || ppu;
                const w = Math.max(1, Math.round((v.sz_x || 0) * p));
                const h = Math.max(1, Math.round((v.sz_y || 0) * p));
                const px = (v.px == null ? 0.5 : v.px) * w;
                const py = h - (v.py == null ? 0.5 : v.py) * h;
                ctx.beginPath();
                ctx.rect(-px, -py, w, h);
                ctx.clip();
                // POR BANDAS: el corrimiento del shader depende de la posición de mundo,
                // así que una sola llamada movería el agua en bloque en vez de
                // ondularla. Cada banda es una franja de mundo y lleva su propio
                // corrimiento, que es la versión en 2D de lo que hace el fragmento.
                const BANDA = 24;                       // píxeles de alto por banda
                const nb = Math.max(1, Math.ceil(h / BANDA));
                for (let b = 0; b < nb; b++) {
                    const y0 = b * BANDA;
                    const alto = Math.min(BANDA, h - y0);
                    // Centro de la banda en coordenadas de mundo.
                    const my = (v.y || 0) + ((v.py == null ? 0.5 : v.py) * h - y0 - alto / 2) / p;
                    const off = PM.onduladoAgua(v.x || 0, my, seg);
                    const dx = off * img.width, dy = off * img.height;
                    ctx.save();
                    ctx.beginPath();
                    ctx.rect(-px, -py + y0, w, alto);
                    ctx.clip();
                    // Una tesela de margen a cada lado para que el corrimiento no deje
                    // hueco en los bordes de la banda.
                    for (let ty = -img.height; ty < h + img.height; ty += img.height) {
                        for (let tx = -img.width; tx < w + img.width; tx += img.width) {
                            ctx.drawImage(img, -px + tx + dx, -py + ty + dy);
                        }
                    }
                    ctx.restore();
                }
            } else if (efecto === 'copa') {
                // `DistortVertex` desplaza el sprite por ruido evaluado en su posición de
                // mundo. Son menos de dos píxeles: un temblor de hojas. Antes esto
                // cortaba el sprite en diez tiras con una amplitud treinta veces mayor,
                // que no es lo que hace el shader.
                const rw = (v.rw != null && v.rw > 0) ? v.rw : img.width;
                const rh = (v.rh != null && v.rh > 0) ? v.rh : img.height;
                const px = (v.px == null ? 0.5 : v.px) * rw;
                const py = rh - (v.py == null ? 0.5 : v.py) * rh;
                const d = PM.desplazamientoCopa(v.x || 0, v.y || 0, seg);
                ctx.translate(v.ox || 0, -(v.oy || 0));
                ctx.drawImage(img, 0, 0, img.width, img.height,
                    -px + d.dx * ppu, -py - d.dy * ppu, rw, rh);
            } else if (efecto === 'puerta') {
                const rw = (v.rw != null && v.rw > 0) ? v.rw : img.width;
                const rh = (v.rh != null && v.rh > 0) ? v.rh : img.height;
                const px = (v.px == null ? 0.5 : v.px) * rw;
                const py = rh - (v.py == null ? 0.5 : v.py) * rh;
                ctx.translate(v.ox || 0, -(v.oy || 0));
                ctx.drawImage(img, 0, 0, img.width, img.height, -px, -py, rw, rh);
                // La caja en pantalla, para poder tocarla. Sólo la puerta se toca; el
                // tren no. Se queda con la unión de sus piezas.
                const x0 = ax + (-px + (v.ox || 0)) * s * sx;
                const y0 = ay + (-py - (v.oy || 0)) * s * sy;
                const x1 = x0 + rw * s * sx, y1 = y0 + rh * s * sy;
                const c0 = { minX: Math.min(x0, x1), maxX: Math.max(x0, x1),
                             minY: Math.min(y0, y1), maxY: Math.max(y0, y1) };
                if (esTren) { ctx.restore(); continue; }
                cajaPuerta = cajaPuerta ? {
                    minX: Math.min(cajaPuerta.minX, c0.minX),
                    maxX: Math.max(cajaPuerta.maxX, c0.maxX),
                    minY: Math.min(cajaPuerta.minY, c0.minY),
                    maxY: Math.max(cajaPuerta.maxY, c0.maxY),
                } : c0;
            }
            ctx.restore();
        }
        // Dónde ha quedado la puerta en pantalla, para que se pueda tocar.
        if (cajaPuerta && PD && PD.apuntarBBox) PD.apuntarBBox(mapId, cajaPuerta);
        return true;
    }

    /**
     * Tira el horneado de un mapa, o de todos. Hace falta al cambiar el día: la escena
     * puede pasar a otra estación o a otro festival, y los `TimedObject` cambian de
     * franja. La clave ya lleva estación, festival y franja, así que lo normal es que el
     * horneado nuevo se construya solo; esto es para forzarlo y para no dejar en memoria
     * los lienzos de días pasados.
     */
    function invalidar(mapId) {
        if (mapId === undefined) {
            for (const k of Object.keys(cache)) delete cache[k];
            for (const k of Object.keys(horarios)) delete horarios[k];
            return;
        }
        const pre = idEfectivo(mapId) + '_';
        for (const k of Object.keys(cache)) {
            if (k === idEfectivo(mapId) || k.indexOf(pre) === 0) delete cache[k];
        }
        delete horarios[idEfectivo(mapId)];
    }

    window.PlayScenery = {
        prepare, ready, invalidar,
        show: { far: true, mid: true, near: true },
        debug(mapId) {
            mapId = String(mapId !== undefined ? mapId : 0);
            const cacheKey = claveDe(mapId);
            const c = getCache(mapId);
            if (!c) return { ready: false, state: (pending[cacheKey] || pending[mapId]) ? 'pending' : 'idle' };
            const layers = {};
            ['far', 'mid', 'near'].forEach(L => {
                const a = c.layers && c.layers[L];
                const b = c.layersPost && c.layersPost[L];
                layers[L] = a ? (a.w + 'x' + a.h) : null;
                // El trozo de encima sólo existe si esa capa lleva algo que se mueve.
                if (b) layers[L] = (layers[L] || '—') + ' + ' + b.w + 'x' + b.h;
            });
            return { ready: !!c.ok, failed: !!c.failed, version: c.version, tMs: c.tMs,
                     layers, animadas: (c.animadas || []).length,
                     material: (c.conMaterial || []).length,
                     origen: c.origen, clave: cacheKey, forceOff: forceOff() };
        },

        /**
         * La capa horneada, para poder mirarla por fuera. Devuelve el lienzo, su esquina
         * (bx0, by0) en pixeles del ensamblado y el ancla con la que se horneo. Sirve para
         * comparar lo que dibuja el paisaje por capas con el `_Ensamblado.png`, que es lo
         * que se ve con `?scenery=off`.
         *
         * Para verla, `PlayScenery.ver()`. Ojo: `open(canvas.toDataURL())` NO vale, Chrome
         * bloquea navegar a un data: desde `window.open` y abre una pestania en blanco.
         */
        capa(mapId, L) {
            const c = getCache(mapId);
            const capa = c && c.ok && c.layers && c.layers[L || 'mid'];
            if (!capa) return null;
            // OJO: una capa con piezas que se mueven va en DOS lienzos, y este es el de
            // DEBAJO. El de encima está en `post`. Mirando sólo este parece que a la
            // capa le faltan piezas, y no le faltan: están al otro lado de lo que se
            // mueve. En el Muelle de Yori el de debajo está vacío del todo, porque el
            // agua es lo primero que se pinta.
            const post = c.layersPost && c.layersPost[L || 'mid'];
            return { canvas: capa.canvas, bx0: capa.bx0, by0: capa.by0,
                     w: capa.w, h: capa.h, origen: c.origen,
                     post: post ? { canvas: post.canvas, bx0: post.bx0, by0: post.by0,
                                    w: post.w, h: post.h } : null };
        },
        drawAnimadas: (ctx, mapId, ox, oy, s) => drawAnimadas(ctx, mapId, ox, oy, s),
        // Lo llama `drawLayer` con su capa; queda expuesto para poder mirarlo suelto.
        drawMateriales: (ctx, mapId, ox, oy, s, capa) => drawMateriales(ctx, mapId, ox, oy, s, capa),

        /**
         * ¿Este mapa tiene algo que se mueva SOLO, sin cambiar de sprite?
         *
         * Lo usa `map.js` para saber si tiene que seguir repintando. El agua y la copa
         * se mueven de forma continua, así que mientras se vean hace falta un cuadro
         * tras otro; sin esto se quedaban quietas, porque el port sólo repinta cuando
         * algo se lo pide.
         */
        tieneMaterialVivo(mapId) {
            const c = getCache(mapId);
            if (!c || !c.ok || !c.conMaterial || !c.conMaterial.length) return false;
            // La puerta NO cuenta: sólo se mueve mientras se abre, y de eso ya avisa
            // `PlayDoors.animando`. Si contara, el mapa 3 repintaría sin parar.
            const PD = window.PlayDoors;
            const PT = window.PlayTrain;
            return c.conMaterial.some(v => !(PD && PD.esPieza(mapId, v))
                                        && !(PT && PT.esPieza(mapId, v)));
        },
        drawFar: (ctx, mapId, ox, oy, s) => drawLayer(ctx, mapId, 'far', ox, oy, s),
        drawMid: (ctx, mapId, ox, oy, s) => drawLayer(ctx, mapId, 'mid', ox, oy, s),
        drawNear: (ctx, mapId, ox, oy, s) => drawLayer(ctx, mapId, 'near', ox, oy, s),
        /**
         * Enseña la capa horneada encima de la pagina, a pantalla completa. Se quita
         * haciendo clic. Va por blob: un data: URL lo bloquea el navegador.
         */
        ver(mapId, L) {
            const c = window.PlayScenery.capa(mapId === undefined ? 0 : mapId, L || 'mid');
            if (!c) { console.warn('[scenery] no hay capa horneada para ese mapa'); return null; }
            const img = new Image();
            img.title = 'capa ' + (L || 'mid') + '  ' + c.w + 'x' + c.h
                + '  bx0=' + Math.round(c.bx0) + ' by0=' + Math.round(c.by0)
                + '  (clic para cerrar)';
            img.style.cssText = 'position:fixed;left:0;top:0;width:100vw;height:auto;'
                + 'z-index:99999;background:#202020;cursor:zoom-out';
            img.onclick = () => { URL.revokeObjectURL(img.src); img.remove(); };
            c.canvas.toBlob(b => { img.src = URL.createObjectURL(b); });
            document.body.appendChild(img);
            return { w: c.w, h: c.h, bx0: c.bx0, by0: c.by0, origen: c.origen };
        },
        settled: mapId => {
            const cacheKey = claveDe(mapId);
            const ef = idEfectivo(mapId);
            return !!(cache[cacheKey] || pending[cacheKey] || cache[ef] || pending[ef] || forceOff());
        }
    };
})();
