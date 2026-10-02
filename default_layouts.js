// default_layouts.js — el mobiliario que coloca el juego, no el jugador.
//
// El .csave solo guarda lo que ha puesto el jugador. El Ayuntamiento, las tiendas
// y la Casa de Té salen amueblados con el save vacío porque el juego les añade una
// capa fija en cada carga: `Sublocation.data[0].layoutData.defaultLayout`. Eso vive
// en data/default_layouts.json (lo saca tools/extract_default_layouts.py del
// LocationManager del juego) y aquí se convierte en placements normales para que el
// resto del motor los dibuje sin enterarse.
//
// Qué NO se añade y por qué:
//   · `seedFurniture` (Sublocation.defaultFurniture) se copia al save al empezar
//     partida, así que ya está en las placements del jugador. Añadirlo otra vez
//     duplicaría las 25 parcelas de la granja.
//   · `conditionalLayouts` son decoración de festivales, con condiciones que aquí
//     no se evalúan. Se pueden ver con DefaultLayouts.showConditional = true.
//
// Los retoques del usuario (mover una pieza, marcarla como movible u ocultarla) van
// a data/layout_overrides.json, no al JSON generado, para que regenerarlo no los
// borre.

window.DefaultLayouts = {
    data: null,
    overrides: {},
    showConditional: false,
    // Anadir tambien `seedFurniture`. Apagado en Play: ahi la semilla ya viene dentro
    // del save del jugador y meterla otra vez duplicaria (o resucitaria lo que haya
    // borrado). El editor lo enciende cuando no hay ningun .csave cargado.
    includeSeed: false,
    _cache: new Map(),

    async load() {
        if (this.data) return this.data;
        try {
            const r = await fetch('/data/default_layouts.json');
            this.data = r.ok ? await r.json() : { sublocations: [] };
        } catch (e) {
            console.warn('[DefaultLayouts] no pude cargar default_layouts.json:', e);
            this.data = { sublocations: [] };
        }
        try {
            const r = await fetch('/data/layout_overrides.json');
            if (r.ok) this.overrides = await r.json();
        } catch (e) { /* aún no existe: normal */ }
        this.byMap = new Map();
        for (const s of (this.data.sublocations || [])) {
            if (s.mapId != null) this.byMap.set(String(s.mapId), s);
        }
        return this.data;
    },

    entryFor(mapId) {
        return this.byMap ? this.byMap.get(String(mapId)) : null;
    },

    _ov(mapId, placementID) {
        const m = this.overrides[String(mapId)];
        return (m && m[String(placementID)]) || null;
    },

    /** Convierte una pieza del layout en un placement como los del parser. */
    _toPlacement(raw, mapId, isWall, source) {
        const at = raw.at || {};
        const ov = this._ov(mapId, raw.placementID) || {};
        if (ov.hidden) return null;
        // Las piezas apoyadas sobre otro mueble (SubGroupPosition) se resuelven fuera.
        if (at.kind !== 'floor' && at.kind !== 'wall' && !ov.floor) return null;
        return {
            placementID: raw.placementID,
            subloc_id: mapId,
            cluster: mapId,
            item_id: raw.furnitureID,
            x: ov.x != null ? ov.x : at.x,
            y: ov.y != null ? ov.y : at.y,
            floor: String(ov.floor != null ? ov.floor : (at.groupNum || 0)),
            orientation: ov.orientation != null ? ov.orientation : (raw.orientation || 0),
            flipped: !!at.flipped,
            isWall: isWall,
            verify: 0,
            planted_id: -1,
            furnNode: null,
            bedSave: null,
            // marcas propias
            isLayout: true,
            layoutSource: source,
            canOverride: ov.canOverride != null ? ov.canOverride
                                                : (raw.canOverride !== false),
            name: raw.name || null,
        };
    },

    /**
     * Placements del layout de un mapa, ya descontando los que el save pisa.
     * El juego hace lo mismo en LayoutData.GetPlacements + PlacementLayout.IsBlocked.
     */
    placementsFor(mapId, savedPlacements) {
        const entry = this.entryFor(mapId);
        if (!entry) return [];

        const usados = new Set();
        const celdas = new Set();
        for (const p of (savedPlacements || [])) {
            if (String(p.cluster) !== String(mapId)) continue;
            usados.add(String(p.placementID));
            celdas.add(p.isWall + '|' + p.floor + '|' + p.x + '|' + p.y);
        }

        const out = [];
        const meter = (lista, isWall, source) => {
            for (const raw of (lista || [])) {
                if (usados.has(String(raw.placementID))) continue;   // el jugador lo movió
                const p = this._toPlacement(raw, mapId, isWall, source);
                if (!p) continue;
                if (celdas.has(p.isWall + '|' + p.floor + '|' + p.x + '|' + p.y)) continue;
                out.push(p);
            }
        };
        // Capas condicionales: decoración de festival. Su condición es
        // `conditionType 36` (VillageEvent) y su `value` es el eventID, así que basta
        // con preguntar qué festival hay hoy. `showConditional` las fuerza todas, para
        // poder verlas en el editor fuera de fecha.
        //
        // Se resuelven ANTES que la capa fija porque pueden apagar piezas de ella
        // (`disablePlacements`): la Silla Festiva de Navidad ocupa la misma celda que
        // la Silla de Caoba de todos los días.
        const activas = (entry.conditionalLayouts || []).filter(c =>
            this.showConditional || (
                window.VillageEvents
                && (c.conditions || []).length > 0
                && (c.conditions || []).every(cond => window.VillageEvents.cumple(cond))
            ));
        for (const c of activas) {
            for (const pid of (c.disablePlacements || [])) usados.add(String(pid));
        }

        meter(entry.layoutFurniture, false, 'layout');
        meter(entry.layoutWallFurniture, true, 'layout');
        if (this.includeSeed) {
            meter(entry.seedFurniture, false, 'seed');
            meter(entry.seedWallFurniture, true, 'seed');
        }
        const finFijas = out.length;
        for (const c of activas) {
            meter(c.furniture, false, 'conditional');
            meter(c.wallFurniture, true, 'conditional');
        }
        // Una pieza de festival sustituye a la de diario que ocupe su misma celda,
        // aunque `disablePlacements` venga vacío: la Silla Festiva y la Silla de Caoba
        // están las dos en la (10,17) del ayuntamiento, y solo cabe una.
        if (out.length > finFijas) {
            const deFestival = new Set(out.slice(finFijas)
                .map(p => p.isWall + '|' + p.floor + '|' + p.x + '|' + p.y));
            for (let i = finFijas - 1; i >= 0; i--) {
                const p = out[i];
                if (deFestival.has(p.isWall + '|' + p.floor + '|' + p.x + '|' + p.y)) {
                    out.splice(i, 1);
                }
            }
        }

        // Las piezas que van encima de otro mueble heredan su celda.
        const porId = new Map(out.map(p => [String(p.placementID), p]));
        const fuentesSobre = (entry.layoutFurniture || [])
            .concat(this.includeSeed ? (entry.seedFurniture || []) : []);
        const sobre = fuentesSobre.filter(r => (r.at || {}).kind === 'onFurniture');
        for (const raw of sobre) {
            if (usados.has(String(raw.placementID))) continue;
            const padre = porId.get(String(raw.at.parentPlacementID));
            if (!padre) continue;
            const ov = this._ov(mapId, raw.placementID) || {};
            if (ov.hidden) continue;
            out.push({
                placementID: raw.placementID, subloc_id: mapId, cluster: mapId,
                item_id: raw.furnitureID,
                x: ov.x != null ? ov.x : padre.x + (raw.at.x || 0),
                y: ov.y != null ? ov.y : padre.y + (raw.at.y || 0),
                floor: String(ov.floor != null ? ov.floor : padre.floor),
                orientation: ov.orientation != null ? ov.orientation : (raw.orientation || 0),
                flipped: false, isWall: false, verify: 0, planted_id: -1,
                furnNode: null, bedSave: null,
                isLayout: true, layoutSource: 'layout', onFurniture: true,
                // De quién se apoya encima. Hace falta para el alzado: la altura sale del
                // `subGroupData` del PADRE y de la orientación del PADRE, no de la pieza.
                // Ver furniture_subgroups.js.
                parentPlacementID: raw.at.parentPlacementID,
                parentItemId: padre.item_id,
                parentOrientation: padre.orientation,
                canOverride: ov.canOverride != null ? ov.canOverride : (raw.canOverride !== false),
                name: raw.name || null,
            });
        }
        return out;
    },

    /** Mueve/gira una pieza del layout. Va al fichero de retoques, no al save. */
    applyMove(p, x, y, orientation, floor) {
        if (!p || !p.isLayout) return false;
        p.x = x; p.y = y;
        if (orientation != null) p.orientation = orientation;
        if (floor != null) p.floor = String(floor);
        this.setOverride(p.cluster, p.placementID, {
            x: p.x, y: p.y, floor: p.floor, orientation: p.orientation,
        });
        return true;
    },

    setOverride(mapId, placementID, patch) {
        const m = this.overrides[String(mapId)] || (this.overrides[String(mapId)] = {});
        const e = m[String(placementID)] || (m[String(placementID)] = {});
        Object.assign(e, patch);
        this._cache.clear();
        this.saveSoon();
    },

    saveSoon() {
        clearTimeout(this._t);
        this._t = setTimeout(() => this.save(), 600);
    },

    async save() {
        try {
            const r = await fetch('/api/save/layout_overrides', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(this.overrides),
            });
            if (!r.ok) console.warn('[DefaultLayouts] el servidor rechazó los retoques:', r.status);
        } catch (e) {
            console.warn('[DefaultLayouts] no pude guardar los retoques:', e);
        }
    },
};

// Se carga solo, en paralelo con el resto del arranque. Si llega tarde, se repinta:
// sin esto el primer mapa saldría sin los muebles del juego hasta el siguiente dibujado.
(function () {
    const arrancar = () => window.DefaultLayouts.load().then(() => {
        if (window.app && window.app.map) {
            window.app.map._layoutCache = null;
            window.app.map._renderCache = null;
            window.app.map.draw();
        }
    });
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', arrancar, { once: true });
    } else {
        arrancar();
    }
})();
