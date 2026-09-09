/* map_def.js — single-file map definitions: data/maps/map_{id}.json
 *
 * MapDef.load(mapId)  -> Promise<def> (cached; null if missing)
 * MapDef.get(mapId)   -> cached def or null (sync)
 * MapDef.surfaces(mapId) -> atlas-shaped surface list (kind/mapId/groupNum/flipped/rows/cols/origin/origin_px/cell/poly/name/...)
 * MapDef.visuals(mapId)  -> visuals array (as stored)
 * MapDef.config(mapId)   -> config object
 * MapDef.assetUrl(mapId, sp) -> playable URL for a visual sprite (sp + ".png" under config.assetsDir)
 * MapDef.syncAtlas(mapId)    -> replace window.mapsAtlas entries of mapId with MapDef geometry,
 *                               preserving runtime extras (mask/exportDir/assembled/...). No-op without JSON.
 *
 * Origin convention (same as map.js origin_px generation):
 *   origin_px.x = 1235 + origin.x * ppu ; origin_px.y = 1257 - origin.y * ppu
 * Assembled-space convention: world (0,0) == pixel (1235,1257), PPU px per world unit.
 */
(function () {
    'use strict';
    const cache = {};
    const inflight = {};
    const ORIGIN_PX = { x: 1235, y: 1257 };

    function normAssetsDir(dir) {
        // "../../images/maps/Exportado_level2" (relative to data/maps/) -> "images/maps/Exportado_level2"
        return String(dir || '').replace(/^(?:\.\.\/)+/, '');
    }

    function load(mapId) {
        mapId = String(mapId);
        if (cache[mapId] !== undefined) return Promise.resolve(cache[mapId]);
        if (inflight[mapId]) return inflight[mapId];
        inflight[mapId] = fetch('data/maps/map_' + mapId + '.json')
            .then(r => (r.ok ? r.json() : null))
            .then(def => { cache[mapId] = def || null; delete inflight[mapId]; return cache[mapId]; })
            .catch(() => { cache[mapId] = null; delete inflight[mapId]; return null; });
        return inflight[mapId];
    }

    function get(mapId) {
        const v = cache[String(mapId)];
        return v === undefined ? null : v;
    }

    function config(mapId) {
        const def = get(mapId);
        return (def && def.config) || null;
    }

    function surfaces(mapId) {
        const def = get(mapId);
        if (!def || !Array.isArray(def.surfaces)) return null;
        const ppu = (def.config && def.config.ppu) || 150;
        return def.surfaces.map(s => {
            const origin = s.origin || null;
            const origin_px = s.origin_px || (origin
                ? { x: ORIGIN_PX.x + origin.x * ppu, y: ORIGIN_PX.y - origin.y * ppu }
                : null);
            return {
                mapId: def.mapId !== undefined ? def.mapId : parseInt(mapId, 10),
                id: s.id, name: s.name, kind: s.kind,
                groupNum: s.groupNum, flipped: !!s.flipped,
                rows: s.rows || 16, cols: s.cols || 16,
                origin, origin_px,
                cell: s.cell || { w: 75, h: 37.5 },
                poly: s.poly || [],
                mask: s.mask || null,
                exportDir: s.exportDir, assembled: s.assembled,
                defaultCoverId: s.defaultCoverId,
                anchorID: s.anchorID,
                layerHint: s.layerHint || null
            };
        });
    }

    function visuals(mapId) {
        const def = get(mapId);
        return (def && Array.isArray(def.visuals)) ? def.visuals : null;
    }

    function assetUrl(mapId, sp) {
        const cfg = config(mapId) || {};
        const base = normAssetsDir(cfg.assetsDir || 'images/maps');
        return base + '/' + sp + '.png';
    }

    function syncAtlas(mapId) {
        // Runtime atlas (window.mapsAtlas, same F()/W() shape map.js consumes):
        // map-0 geometry comes from MapDef; extras (mask/exportDir/assembled/...)
        // are preserved from existing entries. Maps without JSON keep legacy atlas.
        const list = surfaces(mapId);
        if (!list || !window.mapsAtlas) return 0;
        let replaced = 0;
        const matchKey = s => s.kind + '|' + s.groupNum + '|' + (!!s.flipped);
        const byKey = {};
        window.mapsAtlas.forEach((e, i) => {
            if (String(e.mapId) === String(mapId)) byKey[matchKey(e)] = i;
        });
        list.forEach(s => {
            const k = matchKey(s);
            if (k in byKey) {
                const prev = window.mapsAtlas[byKey[k]];
                const merged = Object.assign({}, prev);
                ['id', 'name', 'kind', 'groupNum', 'flipped', 'rows', 'cols',
                 'origin', 'origin_px', 'cell', 'poly', 'layerHint'].forEach(f => {
                    if (s[f] !== undefined) merged[f] = s[f];
                });
                window.mapsAtlas[byKey[k]] = merged;
                replaced++;
            } else {
                window.mapsAtlas.push(Object.assign({ mapId: parseInt(mapId, 10) }, s));
                replaced++;
            }
        });
        return replaced;
    }

    window.MapDef = { load, get, config, surfaces, visuals, assetUrl, syncAtlas, ORIGIN_PX };
})();
