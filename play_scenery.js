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
 *   assembled_px = (1235 + world_x * ppu, 1257 - world_y * ppu)
 *   canvas: translate(ax,ay) -> rotate(-angle) -> scale(sx,sy) -> translate(ox,oy)
 *           -> drawImage(img, -px*rw, -(1-py)*rh, rw, rh), alpha = color.a
 */
(function () {
    'use strict';
    const cache = {};   // mapId -> {version, ok, failed, layers, tMs, logged}
    const pending = {};

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

    function bakeLayer(items, ppu, maxSide) {
        // items: [{img, v}] sorted paint order. Returns {canvas, bx0, by0} or null.
        const xforms = [];
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        const rad = d => (d || 0) * Math.PI / 180;
        items.forEach(({ img, v }) => {
            // Natural size: use Unity original rect dimensions (v.rw, v.rh) if present, as v.px/v.py are normalized to them.
            // When art is trimmed on export, img.width/img.height < v.rw/v.rh, so top-left anchor offset is:
            // px = v.px * origRw
            // py = img.height - v.py * origRh (since Unity Y is from bottom and Canvas Y is from top)
            const origRw = (v.rw != null && v.rw > 0) ? v.rw : img.width;
            const origRh = (v.rh != null && v.rh > 0) ? v.rh : img.height;
            const rw = img.width, rh = img.height;
            const sx = (v.sx == null ? 1 : v.sx) * (v.flipX ? -1 : 1);
            const sy = (v.sy == null ? 1 : v.sy) * (v.flipY ? -1 : 1);
            const ax = 1235 + (v.x || 0) * ppu, ay = 1257 - (v.y || 0) * ppu;
            // corners of draw rect in pre-transform px (pivot-relative), then scale+rotate+translate
            const px = (v.px == null ? 0.5 : v.px) * origRw;
            const py = rh - (v.py == null ? 0.5 : v.py) * origRh;
            const ox = v.ox || 0, oy = v.oy || 0;
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
            xforms.push({ img, v, sx, sy, rw, rh, px, py, ox, oy, alpha: (v.color && v.color.a != null) ? v.color.a : 1 });
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
            const ax = 1235 + (v.x || 0) * ppu - minX, ay = 1257 - (v.y || 0) * ppu - minY;
            g.save();
            g.globalAlpha = alpha;
            if (v.sp && v.sp.includes('SHADOWS')) {
                g.globalCompositeOperation = 'multiply';
                if (alpha === 1) g.globalAlpha = 0.45;
            }
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

    function prepare(mapId) {
        mapId = String(mapId);
        if (cache[mapId] || pending[mapId] || forceOff()) return;
        pending[mapId] = true;
        const t0 = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
        window.MapDef.load(mapId).then(def => {
            if (!def) { cache[mapId] = { ok: false, failed: true }; delete pending[mapId]; return null; }
            if (window.MapDef.syncAtlas) { try { window.MapDef.syncAtlas(mapId); } catch (e) { console.warn('[scenery] syncAtlas', e); } }
            const visuals = (window.MapDef.visuals(mapId) || []).filter(v => v && v.active !== false && (v.layer || 'mid') !== 'skip' && v.draw_mode !== 2);
            if (!visuals.length) {
                console.warn('[scenery] bake map' + mapId + ' fallback assembled: no bakeable visuals');
                cache[mapId] = { ok: false, failed: true };
                delete pending[mapId];
                return;
            }
            const byLayer = { far: [], mid: [], near: [] };
            const missing = [];
            const jobs = visuals.map(v => window.MapDef.assetUrl(mapId, v.sp));
            return Promise.all(jobs.map(loadImage)).then(imgs => {
                const items = { far: [], mid: [], near: [] };
                let dimMismatch = 0;
                visuals.forEach((v, i) => {
                    const img = imgs[i];
                    if (!img) { missing.push(v.sp); return; }
                    if (img.width !== v.rw || img.height !== v.rh) dimMismatch++;
                    items[layerOf(v)].push({ img, v });
                });
                if (missing.length) {
                    console.warn('[scenery] bake map' + mapId + ' fallback assembled: missing sprites', missing.slice(0, 12).join(', ') + (missing.length > 12 ? '…' : ''));
                    cache[mapId] = { ok: false, failed: true };
                    delete pending[mapId];
                    return;
                }
                const ppu = ((window.MapDef.config(mapId) || {}).ppu) || 150;
                const order = (a, b) => ((a.v.sl || 0) - (b.v.sl || 0)) || ((a.v.o || 0) - (b.v.o || 0));
                const layers = {};
                ['far', 'mid', 'near'].forEach(L => {
                    items[L].sort(order);
                    layers[L] = bakeLayer(items[L], ppu, 4096);
                });
                const t1 = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
                cache[mapId] = { ok: true, failed: false, layers, tMs: Math.round(t1 - t0), version: def.version };
                delete pending[mapId];
                console.info('[scenery] bake map' + mapId + ' ' + cache[mapId].tMs + 'ms' +
                    ' far=' + (layers.far ? layers.far.w + 'x' + layers.far.h : '—') +
                    ' mid=' + (layers.mid ? layers.mid.w + 'x' + layers.mid.h : '—') +
                    ' near=' + (layers.near ? layers.near.w + 'x' + layers.near.h : '—') +
                    ' visuals=' + visuals.length +
                    (dimMismatch ? ' dimmismatch=' + dimMismatch : ''));
            });
        }).catch(e => {
            console.warn('[scenery] bake map' + mapId + ' fallback assembled:', e);
            cache[mapId] = { ok: false, failed: true };
            delete pending[mapId];
        });
    }

    function ready(mapId) {
        const c = cache[String(mapId)];
        return !!(c && c.ok) && !forceOff();
    }

    function drawLayer(ctx, mapId, layer, offsetX, offsetY, s) {
        if (window.PlayScenery.show && window.PlayScenery.show[layer] === false) return false;
        const c = cache[String(mapId)];
        const L = c && c.ok && c.layers[layer];
        if (!L) return false;
        const dx = offsetX - (1235 - L.bx0) * s;
        const dy = offsetY - (1257 - L.by0) * s;
        ctx.drawImage(L.canvas, dx, dy, L.w * s, L.h * s);
        return true;
    }

    window.PlayScenery = {
        prepare, ready,
        show: { far: true, mid: true, near: true },
        debug(mapId) {
            mapId = String(mapId !== undefined ? mapId : 0);
            const c = cache[mapId];
            if (!c) return { ready: false, state: pending[mapId] ? 'pending' : 'idle' };
            const layers = {};
            ['far', 'mid', 'near'].forEach(L => {
                layers[L] = c.layers && c.layers[L] ? (c.layers[L].w + 'x' + c.layers[L].h) : null;
            });
            return { ready: !!c.ok, failed: !!c.failed, version: c.version, tMs: c.tMs, layers, forceOff: forceOff() };
        },
        drawFar: (ctx, mapId, ox, oy, s) => drawLayer(ctx, mapId, 'far', ox, oy, s),
        drawMid: (ctx, mapId, ox, oy, s) => drawLayer(ctx, mapId, 'mid', ox, oy, s),
        drawNear: (ctx, mapId, ox, oy, s) => drawLayer(ctx, mapId, 'near', ox, oy, s),
        settled: mapId => !!(cache[String(mapId)] || pending[String(mapId)] || forceOff())
    };
})();
