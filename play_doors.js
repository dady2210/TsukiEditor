// play_doors.js — la puerta corredera de la Casa de Moca.
//
// QUÉ ES
// ------
// `SceneDoor : SceneObject, ISelectable`. Se toca y sale su burbuja
// (`SceneDoor.DoorBubble`, icono `doorway`), que llama a `ToggleDoor()`; el juego también
// la alterna con `QuickTap()`. `ToggleDoor` pone el bool `Open` de un `Animator`, y
// `PlayEffects()` suena.
//
// El estado se guarda: `SceneDoor.DoorSave { bool open }`, dentro de
// `sublocations[...].sceneObjectSaves`. En el save hay exactamente uno, porque el juego
// solo tiene una puerta de estas.
//
// NO ES ANIMACIÓN DE SPRITES
// --------------------------
// Los sprites no cambian. Lo que se mueve es el TRANSFORM del GameObject `MocaDoor`, y
// con él sus hijos: son dos piezas, la hoja (`..._New_7`) y la plataforma que lleva
// pegada (`..._New_11`). Por eso ni el extractor de `SimpleAnim` ni el de materiales la
// veían: no es ninguna de las dos cosas.
//
// LA CURVA, CON SU REBOTE
// -----------------------
// Sale de los `AnimationClip` comprimidos, decodificados por `tools/decode_anim_clip.py`.
// Son 25 fotogramas a 60 fps y no van de A a B: se PASAN y vuelven.
//
//     abrir   t=0     (0, 0)
//             t=0,333 (−0,638, +0,329)   ← se pasa
//             t=0,417 (−0,603, +0,308)   ← y vuelve un poco
//
//     cerrar  t=0     (−0,638, +0,329)
//             t=0,333 (+0,007, −0,010)   ← se pasa por el otro lado
//             t=0,417 (0, 0)
//
// La proporción y/x es 0,5, que es la pendiente isométrica: se desliza A LO LARGO de la
// pared, no en diagonal cualquiera.
//
// EL SONIDO
// ---------
// `PlayEffects()` suena. Los dos efectos —`mocaSlidingDoorOpen` y `mocaSlidingDoorClose`—
// están entre los 135 de `sharedassets1.assets`, ya extraídos por `tools/export_sfx.py`,
// y los reproduce `play_sfx.js`.

(function (global) {
    'use strict';

    let datos = null;
    let cargando = null;
    // mapId -> { abierta, clip, t0 }
    const estado = {};
    // Dónde se pintó por última vez, para poder tocarla. Igual que `_interactiveActors`.
    let ultimoBBox = null;

    function prefijo() {
        return (global.location && global.location.pathname.indexOf('/HERRAMIENTAS/') >= 0)
            ? '../../' : '';
    }

    function cargar() {
        if (datos) return Promise.resolve(datos);
        if (cargando) return cargando;
        cargando = fetch(prefijo() + 'data/scene_doors.json')
            .then(r => (r.ok ? r.json() : { puertas: [] }))
            .then(j => {
                datos = { porMapa: {} };
                for (const p of (j.puertas || [])) {
                    p._sprites = new Set((p.piezas || []).map(q => q.sp).filter(Boolean));
                    datos.porMapa[String(p.mapId)] = p;
                }
                return datos;
            })
            .catch(() => { datos = { porMapa: {} }; return datos; });
        return cargando;
    }

    function puertaDe(mapId) {
        return (datos && datos.porMapa[String(mapId)]) || null;
    }

    function parser() {
        return (global.app && global.app.parser) || global.currentSaveParser || global._currentParser;
    }

    /** ¿Esta visual es una pieza de la puerta? Si sí, sale del horneado. */
    function esPieza(mapId, v) {
        const p = puertaDe(mapId);
        return !!(p && v && v.sp && p._sprites.has(v.sp));
    }

    function est(mapId) {
        const k = String(mapId);
        if (!estado[k]) {
            // El estado inicial sale del SAVE, no de cero: si la dejaste abierta, abierta
            // sigue al volver.
            const p = parser();
            const abierta = (p && typeof p.getSceneDoorOpen === 'function')
                ? p.getSceneDoorOpen() : null;
            estado[k] = { abierta: !!abierta, clip: null, t0: 0 };
        }
        return estado[k];
    }

    /** Interpola los fotogramas del clip. Lineal, que es como los guarda Unity aquí. */
    function enCurva(fotogramas, t) {
        if (!fotogramas || !fotogramas.length) return { dx: 0, dy: 0 };
        if (t <= fotogramas[0][0]) return { dx: fotogramas[0][1], dy: fotogramas[0][2] };
        for (let i = 1; i < fotogramas.length; i++) {
            const a = fotogramas[i - 1], b = fotogramas[i];
            if (t <= b[0]) {
                const k = (b[0] - a[0]) > 0 ? (t - a[0]) / (b[0] - a[0]) : 1;
                return { dx: a[1] + (b[1] - a[1]) * k, dy: a[2] + (b[2] - a[2]) * k };
            }
        }
        const u = fotogramas[fotogramas.length - 1];
        return { dx: u[1], dy: u[2] };
    }

    /** Dónde está la puerta ahora mismo, en unidades de mundo. */
    function desplazamiento(mapId, ms) {
        const p = puertaDe(mapId);
        if (!p) return { dx: 0, dy: 0 };
        const e = est(mapId);
        if (e.clip) {
            const c = p.clips[e.clip];
            const t = (ms - e.t0) / 1000;
            if (c && t < c.duracion) return enCurva(c.fotogramas, t);
            // Se acabó: se queda en el último fotograma del clip.
            e.clip = null;
        }
        const reposo = p.clips.open && p.clips.open.fotogramas;
        if (e.abierta && reposo) {
            const u = reposo[reposo.length - 1];
            return { dx: u[1], dy: u[2] };
        }
        return { dx: 0, dy: 0 };
    }

    function animando(mapId) { return !!est(mapId).clip; }

    /** `ToggleDoor()`: alterna, arranca el clip y lo guarda en el save. */
    function alternar(mapId) {
        const p = puertaDe(mapId);
        if (!p) return false;
        const e = est(mapId);
        if (e.clip) return false;                 // ya se está moviendo
        e.abierta = !e.abierta;
        e.clip = e.abierta ? 'open' : 'close';
        e.t0 = (typeof performance !== 'undefined' && performance.now)
            ? performance.now() : Date.now();
        // `SceneDoor.PlayEffects()`. Los dos efectos existen en el juego y ya estan
        // extraidos: `mocaSlidingDoorOpen` y `mocaSlidingDoorClose`.
        if (global.PlaySfx) {
            global.PlaySfx.sonar(e.abierta ? 'mocaSlidingDoorOpen' : 'mocaSlidingDoorClose');
        }
        const pr = parser();
        if (pr && typeof pr.setSceneDoorOpen === 'function') pr.setSceneDoorOpen(e.abierta);
        if (global.app && global.app.map && typeof global.app.map.draw === 'function') {
            global.app.map.draw();
        }
        return true;
    }

    function icono(clave) {
        // Siluetas blancas con alfa: el juego las tiñe con `SimpleIcon.color`.
        return '<img src="' + prefijo() + 'images/icons/bubbles/' + clave + '.png" alt="" '
             + 'style="width:22px;height:22px;object-fit:contain;'
             + 'filter:invert(22%) sepia(12%) saturate(600%) hue-rotate(185deg);">';
    }

    /** Lo llama `play_scenery` al pintarla, para saber dónde se puede tocar. */
    function apuntarBBox(mapId, caja) {
        ultimoBBox = { mapId: String(mapId), caja: caja };
    }

    /**
     * Toque en pantalla. Devuelve true si cae sobre la puerta y se ha atendido.
     *
     * La caja la apunta `play_scenery` al pintarla, que es el mismo truco que usan los
     * NPC con `_interactiveActors`: así no hay que rehacer aquí la proyección.
     */
    function intentarToque(mapId, x, y, screenX, screenY) {
        const p = puertaDe(mapId);
        if (!p || !ultimoBBox || ultimoBBox.mapId !== String(mapId)) return false;
        const c = ultimoBBox.caja;
        if (!(x >= c.minX && x <= c.maxX && y >= c.minY && y <= c.maxY)) return false;
        const acciones = [{
            type: 'toggleDoor',
            icon: icono(p.icono || 'doorway'),
            label: est(mapId).abierta ? 'Cerrar la puerta' : 'Abrir la puerta',
            onClick: () => alternar(mapId),
        }];
        if (global.BubbleSystem) {
            global.BubbleSystem.showBubbles({
                npcId: 'sceneDoor:' + mapId,
                npcName: 'Puerta corredera',
                screenX: screenX, screenY: screenY,
                customActions: acciones,
            });
        } else {
            alternar(mapId);                       // `QuickTap()`, sin burbuja
        }
        return true;
    }

    global.PlayDoors = {
        get datos() { return datos; },
        cargar: cargar,
        puertaDe: puertaDe,
        esPieza: esPieza,
        desplazamiento: desplazamiento,
        animando: animando,
        alternar: alternar,
        estaAbierta: (mapId) => est(mapId).abierta,
        apuntarBBox: apuntarBBox,
        intentarToque: intentarToque,
        /** Al cargar otro save hay que volver a leer el estado. */
        olvidar() { for (const k of Object.keys(estado)) delete estado[k]; ultimoBBox = null; },
    };

    if (typeof document !== 'undefined' && document.addEventListener) {
        document.addEventListener('DOMContentLoaded', () => { cargar(); });
    }
})(typeof window !== 'undefined' ? window : globalThis);
