// furniture_subgroups.js — la altura a la que un mueble se apoya sobre otro.
//
// POR QUÉ HACE FALTA
// ------------------
// Un jarrón sobre una mesa no va en el suelo: va 0,32 m más arriba. El port colocaba la
// pieza en la casilla correcta pero a ras de suelo, así que la atravesaba.
//
// QUÉ HACE EL JUEGO, COMPROBADO CONTRA EL BINARIO
// ------------------------------------------------
// `SubGridGroup.AbsoluteGridPosition(grid, container)` — RVA 0x5762F14 — es lo mismo que
// el de `GridGroup` salvo que el offset del grupo sale de `SubGridGroup.get_Offset()`
// (0x576342C), que no calcula nada: devuelve el `Vector3` guardado en
// `GridFurnitureItem.SubGroupData` del mueble que hace de base.
//
// La sub-rejilla usa la MISMA celda que el suelo (`CastleTools.IsoPoint`, 0,25 / 0,125),
// y `IsoPoint` es lineal, así que `IsoPoint(padre + hijo) = IsoPoint(padre) + IsoPoint(hijo)`.
// Por eso basta con sumar las casillas —que es lo que ya hacía `default_layouts.js`— y
// añadir este offset. No hay más términos.
//
// `SubGroupData.Offset(Orientation o)` — RVA 0x5919244:
//
//     v = (differentFlippedOffset && IsSpriteFlipped(o)) ? flippedOffset : offset
//     devolver ( IsScaleFlipped(o) ? v.x : -v.x ,  v.y ,  v.z )
//
// con `TsukiExtensions.IsSpriteFlipped(o)` = `(o & ~1) == 2` (0x5857F4C) y
// `IsScaleFlipped(o)` = `(o & ~2) == 1` (0x5857F3C). O sea, para las cuatro
// orientaciones:
//
//     o = 0  →  offset,        x negada
//     o = 1  →  offset,        x tal cual
//     o = 2  →  flippedOffset, x negada
//     o = 3  →  flippedOffset, x tal cual
//
// Ojo a la x negada: es fácil pasarla por alto porque en la mayoría de los muebles
// `flippedOffset` no se usa, pero la negación se aplica SIEMPRE.
//
// DE DÓNDE SALEN LOS DATOS
// ------------------------
// `data/furniture_subgroups.json`, que produce `tools/extract_furniture_subgroups.py`
// leyendo del ManagedReferencesRegistry de `sharedassets1.assets` los `GridFurnitureItem`
// y las subclases suyas que no añaden campos (`BedItem`, `PlantItem`, `PotItem`,
// `RugItem`). De las 1999 entradas, 438 sostienen algo. No hace falta `GameData`.
//
// Se puede releer con:
//     python tools/dis_addr.py 0x5919244 30
//     python tools/extract_furniture_subgroups.py --report

(function (global) {
    'use strict';

    /** `TsukiExtensions.IsSpriteFlipped`: `(o & ~1) == 2`. */
    function spriteVolteado(o) {
        return ((o | 0) & ~1) === 2;
    }

    /** `TsukiExtensions.IsScaleFlipped`: `(o & ~2) == 1`. */
    function escalaVolteada(o) {
        return ((o | 0) & ~2) === 1;
    }

    const API = {
        /** El contenido de `data/furniture_subgroups.json`, indexado por itemId. */
        datos: null,

        async cargar() {
            if (this.datos) return true;
            try {
                const r = await fetch('data/furniture_subgroups.json?v=' + Date.now());
                this.datos = r.ok ? ((await r.json()).furnitures || null) : null;
            } catch (e) {
                this.datos = null;
            }
            return !!this.datos;
        },

        /** Los datos crudos de sub-rejilla de un mueble, o null si no sostiene nada. */
        datosDe(itemId) {
            const d = this.datos;
            if (!d || itemId == null) return null;
            const v = d[String(itemId)];
            // `GridFurnitureItem.get_HasSubGroup` (RVA 0x591920C) es
            // `ForceSubGroup || hasSubGroup`: los maceteros (`PotItem`) sostienen
            // siempre, tengan o no el bool puesto.
            return (v && (v.hasSubGroup || v.forceSubGroup)) ? v : null;
        },

        /** ¿Este mueble puede sostener otros encima? */
        sostiene(itemId) {
            return !!this.datosDe(itemId);
        },

        /**
         * `SubGroupData.Offset(o)`: el desplazamiento en unidades de MUNDO que hay que
         * sumarle a lo que se apoye sobre `itemId`. Devuelve `{x, y, z}`, o null.
         *
         * `orientacion` es la del mueble que hace de BASE, no la de la pieza de encima.
         */
        offsetDe(itemId, orientacion) {
            const v = this.datosDe(itemId);
            if (!v) return null;
            const o = parseInt(orientacion, 10) || 0;
            const base = (v.differentFlippedOffset && spriteVolteado(o))
                ? v.flippedOffset : v.offset;
            if (!base) return null;
            return {
                x: escalaVolteada(o) ? base.x : -base.x,
                y: base.y,
                z: base.z || 0,
            };
        },

        /** El tamaño de la sub-rejilla de un mueble: `{w, h, tipo}`, o null. */
        rejillaDe(itemId) {
            const v = this.datosDe(itemId);
            return v ? { w: v.width, h: v.height, tipo: v.gridTypeName } : null;
        },

        spriteVolteado,
        escalaVolteada,
    };

    global.FurnitureSubgroups = API;

    // Cargar en cuanto se pueda. Si los datos llegan tarde, `map.js` simplemente dibuja
    // sin alzado hasta el siguiente repintado, que es lo que hacía hasta ahora.
    if (typeof fetch === 'function') {
        const arrancar = () => API.cargar()
            .then(() => {
                if (global.app && global.app.map) { try { global.app.map.draw(); } catch (e) { } }
            })
            .catch(() => { /* sin datos: el módulo se queda inerte */ });
        if (typeof document !== 'undefined' && document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', arrancar);
        } else {
            arrancar();
        }
    }
    if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : globalThis);
