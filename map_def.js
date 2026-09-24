/* map_def.js — single-file map definitions: data/maps/map_{id}.json
 *
 * MapDef.load(mapId)  -> Promise<def> (cached; null if missing)
 * MapDef.get(mapId)   -> cached def or null (sync)
 * MapDef.surfaces(mapId) -> atlas-shaped surface list (kind/mapId/groupNum/flipped/rows/cols/origin/origin_px/cell/poly/name/...)
 * MapDef.visuals(mapId)  -> visuals array (as stored)
 * MapDef.config(mapId)   -> config object
 * MapDef.assetUrl(mapId, sp) -> playable URL for a visual sprite (sp + ".png" under config.assetsDir)
 * MapDef.syncAtlas(mapId)    -> replace window.mapsAtlas entries of mapId with MapDef geometry,
 *                               preserving runtime extras (exportDir/assembled/...). No-op without JSON.
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

    // Variantes de un mismo mapa. La Casa del Arbol tiene dos escenas distintas:
    // level2 sin ampliar y level28 ampliada, con tres pisos. Cuando se encarga la
    // ampliacion el juego cambia de escena, no anade una capa.
    //
    // `usarVariante(0, '0_hc')` hace que todo lo que pregunte por el mapa 0 —fondo,
    // ancla, superficies— reciba en su lugar lo de map_0_hc.json. Es reversible:
    // `usarVariante(0, null)` vuelve al original.
    const variantes = {};

    function efectivo(mapId) {
        const k = String(mapId);
        return variantes[k] || k;
    }

    function usarVariante(mapId, variante) {
        const k = String(mapId);
        if (variante == null) delete variantes[k];
        else variantes[k] = String(variante);
        return efectivo(k);
    }

    function normAssetsDir(dir) {
        // "../../images/maps/Exportado_level2" (relative to data/maps/) -> "images/maps/Exportado_level2"
        return String(dir || '').replace(/^(?:\.\.\/)+/, '');
    }

    function load(mapId, forceReload) {
        const effId = String(efectivo(mapId));
        if (!forceReload && cache[effId] !== undefined) return Promise.resolve(cache[effId]);
        if (!forceReload && inflight[effId]) return inflight[effId];
        inflight[effId] = fetch('data/maps/map_' + effId + '.json?v=' + Date.now())
            .then(r => (r.ok ? r.json() : null))
            .then(def => { cache[effId] = def || null; delete inflight[effId]; return cache[effId]; })
            .catch(() => { cache[effId] = null; delete inflight[effId]; return null; });
        return inflight[effId];
    }

    function reload(mapId) {
        delete cache[String(efectivo(mapId))];
        return load(mapId, true);
    }

    function get(mapId) {
        const v = cache[efectivo(mapId)];
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
        const targetMapIdNum = parseInt(mapId, 10);
        return def.surfaces.map(s => {
            const origin = s.origin || null;
            const defOriginPx = (def.config && def.config.origin_px) || (String(mapId) === '0' ? ORIGIN_PX : null);
            const origin_px = s.origin_px ? s.origin_px : (origin && defOriginPx
                ? { x: defOriginPx.x + origin.x * ppu, y: defOriginPx.y - origin.y * ppu }
                : (s.origin_px || null));
            return {
                mapId: !isNaN(targetMapIdNum) ? targetMapIdNum : (def.mapId !== undefined ? def.mapId : parseInt(mapId, 10)),
                id: s.id, name: s.name, kind: s.kind,
                groupNum: s.groupNum, flipped: !!s.flipped,
                rows: s.rows || 16, cols: s.cols || 16,
                origin, origin_px,
                cell: s.cell || { w: 75, h: 37.5 },
                poly: s.poly || [],
                // un suelo partido en trozos trae varios anillos
                polys: s.polys || null,
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

    /**
     * `dir` manda sobre `config.assetsDir`.
     *
     * Las piezas de una VARIANTE de escena —la nieve de invierno, los farolillos de un
     * festival— viven en la carpeta de SU nivel (`Exportado_level19` para HomeWinter), no
     * en la de la escena base, y varias comparten nombre de sprite entre variantes
     * (`TreehouseSnow_3` está tanto en Home2Autumn como en Home2Spring, con arte
     * distinto). Sin respetar el `dir` de cada visual se cargaría el PNG equivocado.
     */
    function assetUrl(mapId, sp, dir) {
        if (/^(?:FURN_|ITEM_)/i.test(sp)) {
            return 'images/items/' + sp + '.png';
        }
        let base;
        if (dir) {
            base = normAssetsDir(dir);
            if (base.indexOf('/') < 0) base = 'images/maps/' + base;
        } else {
            const cfg = config(mapId) || {};
            base = normAssetsDir(cfg.assetsDir || 'images/maps');
        }
        return base + '/' + sp + '.png';
    }

    function syncAtlas(mapId) {
        // Vuelca las superficies del JSON al atlas de ejecucion (window.mapsAtlas), que es
        // lo que consume map.js.
        //
        // Antes fusionaba por `kind|groupNum|flipped`, y eso se rompio al partir las
        // paredes en trozos: la Casa del Arbol ampliada tiene DOS anclas por cara, o sea
        // dos superficies con la misma clave, y la segunda machacaba a la primera. De 12
        // paredes llegaban 6. Ahora la identidad es el `id` de la superficie.
        //
        // Ademas se SUSTITUYEN todas las entradas del mapa en vez de fusionarlas encima:
        // el atlas de arranque (data/maps_atlas.js) es una lista escrita a mano de hace
        // tiempo, y lo que quedaba de ella eran superficies fantasma que ya no existen en
        // el JSON pero seguian dibujandose.
        if (!window.mapsAtlas) window.mapsAtlas = [];
        const list = surfaces(mapId);
        if (!list) return 0;
        const mid = String(mapId);
        const clave = s => s.kind + '|' + s.groupNum + '|' + (!!s.flipped);

        // Los extras que solo viven en el atlas (exportDir, assembled...) se conservan.
        const porId = {}, porClave = {};
        window.mapsAtlas.forEach(e => {
            if (String(e.mapId) !== mid) return;
            if (e.id != null && !(e.id in porId)) porId[e.id] = e;
            const k = clave(e);
            if (!(k in porClave)) porClave[k] = e;
        });

        // `exportDir` y `assembled` son del MAPA, no de cada superficie: si la entrada
        // equivalente no existia en el atlas de arranque se cogen de cualquier hermana,
        // que si no las superficies nuevas se quedaban sin ellas.
        const delMapa = {};
        window.mapsAtlas.forEach(e => {
            if (String(e.mapId) !== mid) return;
            if (delMapa.exportDir === undefined && e.exportDir !== undefined) delMapa.exportDir = e.exportDir;
            if (delMapa.assembled === undefined && e.assembled) delMapa.assembled = e.assembled;
        });

        const nuevas = list.map(s => {
            const prev = (s.id != null && porId[s.id]) || porClave[clave(s)] || null;
            const out = prev ? Object.assign({}, prev) : {};
            Object.keys(s).forEach(f => { if (s[f] !== undefined) out[f] = s[f]; });
            if (out.exportDir === undefined && delMapa.exportDir !== undefined) out.exportDir = delMapa.exportDir;
            if (!out.assembled && delMapa.assembled) out.assembled = delMapa.assembled;
            out.mapId = parseInt(mapId, 10);
            return out;
        });

        // Se muta el array en el sitio: grid_editor.js guarda indices sobre el mismo.
        for (let i = window.mapsAtlas.length - 1; i >= 0; i--) {
            if (String(window.mapsAtlas[i].mapId) === mid) window.mapsAtlas.splice(i, 1);
        }
        nuevas.forEach(e => window.mapsAtlas.push(e));

        if (window.app && window.app.map) {
            window.app.map._renderCache = null;
            window.app.map._bakedBgKey = null;
            window.app.map._anchorDeclCache = null;
        }
        return nuevas.length;
    }

    window.MapDef = { load, reload, get, config, surfaces, visuals, assetUrl, syncAtlas,
                     usarVariante, efectivo, ORIGIN_PX };
})();
