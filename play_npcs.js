// play_npcs.js — dónde está cada vecino y qué hace, según el juego.
//
// DE DÓNDE SALE
// -------------
// Del SAVE. No se decide nada aquí: el juego ya lo decidió y lo dejó escrito en
// `NPCSave.activitySave` de cada vecino, que trae
//
//     ActivityID      cuál de SUS actividades está haciendo (el índice es por vecino)
//     containerID     en qué sala, y si va atado a un mueble, cuál
//     groupPosition   la casilla de la rejilla, si va suelto
//     Orientation     hacia dónde mira
//
// `activity_scheduler.js` ya sabía leerlo (`Activities.estado`, `donde`, `definicion`).
// Lo que faltaba era CON QUÉ dibujarlo.
//
// EL PUENTE QUE FALTABA
// ---------------------
// `ActivityObject` guarda el prefab de su animación en `activityAsset`, que es un
// `AssetReference` de Addressables: sólo un GUID. El GUID se resuelve en la tabla del
// bundle de actividades, y de ahí sale el `SimpleAnim` con sus fotogramas.
//
//     actividad --activityAssetGUID--> prefab --> SimpleAnim --> fotogramas
//
// Los 1050 GUID resuelven, y salen 1102 prefabs con animación y 17.581 fotogramas. Lo
// extraen `tools/cs_activity_prefabs` y `tools/export_activity_frames.py` a
// `data/activity_prefabs.json`, con la ruta de cada PNG ya resuelta.
//
// LO QUE SUSTITUYE
// ----------------
// `routine_scheduler.js` tenía DOCE RAMAS ESCRITAS A MANO —«Moca se sienta en la primera
// silla», «Tsuki visita a Moca»— que no salían de ningún sitio del juego. De ahí venían
// los vecinos duplicados y los que aparecían donde no tocaba. Esto no inventa: si el save
// no dice que alguien esté en esta sala, no se dibuja a nadie.
//
// TSUKI NO ESTÁ AQUÍ
// ------------------
// Tsuki es el jugador, no un vecino: su actividad va en `activitySaves` con `npc = -1`,
// no en `NPCSave`. La sigue llevando `routine_scheduler`, que para eso sí lee el save.

(function (global) {
    'use strict';

    let prefabs = null;          // data/activity_prefabs.json
    let cargando = null;

    function prefijo() {
        return (global.location && global.location.pathname.indexOf('/HERRAMIENTAS/') >= 0)
            ? '../../' : '';
    }

    function cargar() {
        if (prefabs) return Promise.resolve(prefabs);
        if (cargando) return cargando;
        cargando = fetch(prefijo() + 'data/activity_prefabs.json')
            .then(r => (r.ok ? r.json() : { prefabs: {} }))
            .then(j => { prefabs = j.prefabs || {}; return prefabs; })
            .catch(() => { prefabs = {}; return prefabs; });
        return cargando;
    }

    function listo() { return !!prefabs && Object.keys(prefabs).length > 0; }

    /**
     * El `actDef` que espera `map.js`, armado con los fotogramas de verdad.
     *
     * `anim.front` y `anim.back` son normalmente NOMBRES de animación que `map.js`
     * resuelve contra `NPC_DB`. Aquí se pasan ya las RUTAS, en `anim.frames`, porque
     * estos fotogramas no están todos en `NPC_DB`: 1958 de los 6788 hubo que sacarlos de
     * los bundles y viven en `images/activities/`.
     */
    function defDeActividad(npcID, npcKey, nombre, activityID) {
        const A = global.Activities;
        if (!A || !prefabs) return null;
        const d = A.definicion(npcID, activityID);
        const guid = d && d.activityAssetGUID;
        const p = guid && prefabs[guid];
        if (!p || !p.piezas || !p.piezas.length) return null;
        // 935 de las 1168 tienen una sola pieza. De las 233 que tienen varias, la de más
        // fotogramas es el personaje; las otras son ATREZO —una tetera, las chispas del
        // libro de hechizos— y 166 llevan además su propio desplazamiento dentro del
        // prefab. Antes se tiraban: Dawn pescando son cuatro sprites montados y se veía
        // uno. Ahora la principal va en `anim` y el resto en `anim.extras`, con el
        // desplazamiento RELATIVO a ella, que es lo que `map.js` sabe pintar.
        const ordenadas = p.piezas.slice().sort((a, b) => b.frames.length - a.frames.length);
        const pieza = ordenadas[0];
        const rutas = pieza.frames.map(f => f.png);
        const rutasB = (pieza.framesVolteado || []).map(f => f.png);
        const extras = ordenadas.slice(1).map(q => ({
            frames: q.frames.map(f => f.png),
            framesBack: (q.framesVolteado || []).map(f => f.png).filter(Boolean),
            fps: q.fps || 4,
            mode: (q.loopMode === 2 || q.frames.length === 1) ? 'static' : 'loop',
            dx: (q.x || 0) - (pieza.x || 0),
            dy: (q.y || 0) - (pieza.y || 0),
            // El orden de pintado del juego: primero la capa (`sl`), luego el orden
            // dentro de ella (`o`). Lo que va por detrás del personaje se pinta antes.
            detras: ((q.sl || 0) < (pieza.sl || 0))
                || ((q.sl || 0) === (pieza.sl || 0) && (q.o || 0) < (pieza.o || 0)),
        })).filter(q => q.frames.length && q.frames.every(Boolean));
        return {
            id: activityID,
            prefab: p.prefab,
            npcID: npcID,
            npcKey: String(npcKey),
            npcName: nombre,
            // `loopMode` de `SimpleAnimation`: 0 Loop, 1 Transition, 2 None, 3 LoopStart.
            // El port solo distingue bucle de estático, que es lo que se nota.
            category: 'activity',
            anim: {
                frames: rutas,
                framesBack: rutasB.length ? rutasB : null,
                fps: pieza.fps || 4,
                mode: (pieza.loopMode === 2 || rutas.length === 1) ? 'static' : 'loop',
                extras: extras.length ? extras : null,
                // Los cuatro ciclos de andar y la velocidad, para los 46 que pasean.
                // `play_walkers.js` los usa; para el resto esto es null y no estorba.
                andares: pieza.andares || null,
                velocidad: pieza.velocidad || null,
            },
            offset: { x: pieza.x || 0, y: pieza.y || 0 },
        };
    }

    /**
     * Pinta el atrezo de una actividad alrededor del personaje.
     *
     * `cx, cy` es el CENTRO del sprite del personaje, y `u` la escala con la que se
     * acaba de pintar. Las piezas se colocan por su desplazamiento dentro del prefab,
     * que va en unidades de mundo: a 150 px por unidad, igual que todo lo demás.
     *
     * De pivotes no se sabe nada: cada sprite tiene el suyo y aquí se centran todos
     * igual que el personaje. Para atrezo que acompaña —chispas, una caña, un cubo— la
     * diferencia no se ve; si algún día se nota, el pivote está en el Sprite del bundle.
     *
     * Devuelve las piezas que van DELANTE, para pintarlas después del personaje.
     */
    function pintarExtras(ctx, actDef, cx, cy, u, detras) {
        const extras = actDef && actDef.anim && actDef.anim.extras;
        if (!extras || !extras.length || !ctx) return 0;
        const mapa = global.app && global.app.map;
        if (!mapa || typeof mapa.getNpcSprite !== 'function') return 0;
        let pintadas = 0;
        for (const e of extras) {
            if (!!e.detras !== !!detras) continue;
            const marco = global.getAnimationFrame
                ? global.getAnimationFrame(e.frames, e.fps, e.mode) : e.frames[0];
            const img = mapa.getNpcSprite(marco);
            if (!img || !img.complete || !img.naturalWidth) continue;
            const w = img.width * u, h = img.height * u;
            const px = cx + e.dx * 150 * u;
            const py = cy - e.dy * 150 * u;
            ctx.drawImage(img, px - w * 0.5, py - h * 0.5, w, h);
            pintadas++;
        }
        return pintadas;
    }

    /**
     * Todos los vecinos que el save sitúa en esa sala.
     *
     * Devuelve `{ enMueble: {placementID: actor}, sueltos: [actor] }`, que es la forma
     * que consume `routine_scheduler`.
     */
    function enSala(cluster) {
        const A = global.Activities;
        const fuera = { enMueble: {}, sueltos: [] };
        if (!A || !A._porNpcID || !listo()) return fuera;
        const loc = Number(cluster);
        for (const [npcID, n] of Object.entries(A._porNpcID)) {
            const charId = n.character;
            let e = null;
            try { e = A.estado(charId); } catch (err) { continue; }
            if (!e || !e.valid) continue;
            let sala = null;
            try { sala = A.donde(charId); } catch (err) { sala = e.sublocationID; }
            // OJO con el null: `donde()` devuelve null cuando el save no ubica al vecino
            // —tiene actividad viva pero sin contenedor ni posición—, y `Number(null)`
            // es 0, o sea la Casa del Árbol. Sin esta comprobación aparecían catorce
            // desconocidos en casa de Tsuki.
            if (sala == null) continue;
            if (Number(sala) !== loc) continue;

            // El TUTORIAL manda por encima del horario. `SetTutorialStepStatic` llama a
            // `GetNPC(c).SetActivity(n, force: true)` en los pasos 6 y 7, y esa actividad
            // no se guarda en la partida —el `NPCSave` sólo trae amistad y fastidio—, así
            // que vive en `PlayTutorial.npcForzados` mientras el tutorial esté en marcha.
            let actID = e.activityID;
            const T = global.PlayTutorial;
            if (T && T.enMarcha && T.enMarcha() && T.npcForzados) {
                const f = T.npcForzados[String(charId)];
                if (f != null) actID = f;
            }

            const def = defDeActividad(Number(npcID), charId, n.nombre, actID);
            if (!def) continue;                  // sin animación no hay nada que pintar

            const actor = {
                actorName: n.nombre,
                charId: charId,
                npcKey: String(charId),
                activityId: actID,
                actDef: def,
                // 348 es dormir en el juego; aquí se reconoce por la definición.
                isSleeping: false,
                deSave: true,
            };
            if (e.placementID) {
                fuera.enMueble[String(e.placementID)] = actor;
            } else if (e.rejilla) {
                actor.gridPos = {
                    gx: e.rejilla.x, gy: e.rejilla.y,
                    floor: e.rejilla.grupo || 0,
                    orientation: e.orientacion || 0,
                };
                fuera.sueltos.push(actor);
            } else {
                // Actividad de vector: la posición está en la definición, por índice.
                const d = A.definicion(Number(npcID), e.activityID);
                const pos = d && d.positions && d.positions[e.indicePos || 0];
                if (!pos) continue;
                actor.mundo = { x: pos.x, y: pos.y };
                actor.gridPos = { gx: 0, gy: 0, floor: 0, orientation: e.orientacion || 0 };
                fuera.sueltos.push(actor);
            }
        }
        return fuera;
    }

    global.PlayNpcs = {
        cargar: cargar,
        listo: listo,
        enSala: enSala,
        defDeActividad: defDeActividad,
        pintarExtras: pintarExtras,
        get prefabs() { return prefabs; },
    };

    if (typeof document !== 'undefined' && document.addEventListener) {
        document.addEventListener('DOMContentLoaded', () => { cargar(); });
    }
})(typeof window !== 'undefined' ? window : globalThis);
