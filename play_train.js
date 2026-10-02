// play_train.js — el tren entrando en la estación.
//
// QUÉ ES
// ------
// La actividad 84 del catálogo común —o sea, de Tsuki— usa el prefab
// `TsukiArrivingAtTrainStation`, cuyo behaviour es `ArrivingAtTrain : VectorActivityBehaviour`.
// Su posición es `sublocationID 10`: la Estación de Tren. Es lo que pasa nada más empezar
// una partida, y al acabar llama a `NextScene()`.
//
// El prefab lleva un `Animator` con el controlador `Train` y un clip `MoveIn`. No cambia
// ningún sprite: mueve el TRANSFORM del tren, y con él sus 95 piezas.
//
// LA CURVA
// --------
// `MoveIn`, 2 s a 60 fps, dos bindings de posición. El principal:
//
//     t=0,000   (13,00 ; 6,50)    fuera de plano, a la derecha
//     t=1,333   (−0,20 ; −0,10)   se pasa
//     t=1,667   ( 0,00 ;  0,00)   y se asienta
//
// 13,0 / 6,5 = 2, que es la pendiente isométrica: entra A LO LARGO de la vía, igual que
// la puerta de Moca se desliza a lo largo de su pared. Y se pasa antes de parar, como
// ella. Lo decodifica `tools/decode_anim_clip.py --bundles` del `StreamedClip`.
//
// POR QUÉ SE PINTA EN VIVO
// ------------------------
// Las 95 piezas del tren están INTERCALADAS con las de la estación en el orden de
// pintado (comparten `sl` de −4 a 1), así que no se pueden hornear en un trozo aparte y
// desplazar el lienzo entero. Se sacan del horneado y se pintan en vivo, con el mismo
// camino que la puerta: `esPieza` las marca, `play_scenery` las aparta y les suma el
// desplazamiento antes de dibujarlas.
//
// En reposo el desplazamiento es (0,0), así que fuera de la entrada se ven donde
// siempre; lo que cuesta es pintarlas sueltas en vez de horneadas, y sólo en este mapa.

(function (global) {
    'use strict';

    const MAPA = '10';               // la Estación de Tren

    // Las piezas que cuelgan del GameObject `Train` en la escena. Se reconocen por el
    // nombre: los 95 son vagones, puertas, ventanas, techo, interiores y reutilizables
    // del tren, y ninguna otra cosa de la estación empieza así.
    const PREFIJOS = /^(Train |Carriage|CarriageInterior|DoorB|Doorway|Handle|Roof|Window|Exterior|Door)/;

    let curva = null;                // [[t, dx, dy], ...]
    let cargando = null;
    let t0 = null;                   // cuándo arrancó la entrada; null = en reposo

    function prefijo() {
        return (global.location && global.location.pathname.indexOf('/HERRAMIENTAS/') >= 0)
            ? '../../' : '';
    }

    function cargar() {
        if (curva) return Promise.resolve(curva);
        if (cargando) return cargando;
        cargando = fetch(prefijo() + 'data/scene_anim_clips.json')
            .then(r => (r.ok ? r.json() : { clips: [] }))
            .then(j => {
                const c = (j.clips || []).find(x => x.clip === 'MoveIn');
                curva = c ? c.fotogramas.map(f => [f.t,
                    (f.claves && f.claves['0']) || 0, (f.claves && f.claves['1']) || 0]) : [];
                // El clip sólo guarda las claves que CAMBIAN en cada fotograma; los
                // huecos heredan del anterior. Sin rellenarlos, el tren daría un salto a
                // (0,0) en el fotograma que sólo mueve la segunda pieza.
                let ux = 0, uy = 0;
                curva = curva.map(([t, x, y], i) => {
                    const cl = c.fotogramas[i].claves || {};
                    if (cl['0'] === undefined) x = ux; else ux = x;
                    if (cl['1'] === undefined) y = uy; else uy = y;
                    return [t, x, y];
                });
                return curva;
            })
            .catch(() => { curva = []; return curva; });
        return cargando;
    }

    function duracion() {
        return (curva && curva.length) ? curva[curva.length - 1][0] : 0;
    }

    /** ¿Esta visual es del tren? Si sí, sale del horneado y se pinta en vivo. */
    function esPieza(mapId, v) {
        if (String(mapId) !== MAPA || !v || !v.go) return false;
        return PREFIJOS.test(v.go);
    }

    /** Arranca la entrada. La llama la secuencia de apertura al llegar a la estación. */
    function entrar() {
        if (!curva || !curva.length) return false;
        t0 = (typeof performance !== 'undefined' && performance.now)
            ? performance.now() : Date.now();
        // El freno, cuando el tren ya esta llegando: el clip espera 1,17 s antes de
        // moverse, asi que el sonido va con el movimiento, no con el arranque.
        if (global.PlaySfx) setTimeout(() => global.PlaySfx.sonar('trainBrake'), 1100);
        return true;
    }

    function animando() {
        if (t0 == null || !curva || !curva.length) return false;
        const ahora = (typeof performance !== 'undefined' && performance.now)
            ? performance.now() : Date.now();
        if ((ahora - t0) / 1000 > duracion()) { t0 = null; return false; }
        return true;
    }

    /** Dónde está el tren ahora, en unidades de mundo. (0,0) en reposo. */
    function desplazamiento(mapId, ms) {
        if (String(mapId) !== MAPA || t0 == null || !curva || !curva.length) {
            return { dx: 0, dy: 0 };
        }
        const t = (ms - t0) / 1000;
        if (t >= duracion()) { t0 = null; return { dx: 0, dy: 0 }; }
        if (t <= curva[0][0]) return { dx: curva[0][1], dy: curva[0][2] };
        for (let i = 1; i < curva.length; i++) {
            const a = curva[i - 1], b = curva[i];
            if (t <= b[0]) {
                const k = (b[0] - a[0]) > 0 ? (t - a[0]) / (b[0] - a[0]) : 1;
                return { dx: a[1] + (b[1] - a[1]) * k, dy: a[2] + (b[2] - a[2]) * k };
            }
        }
        return { dx: 0, dy: 0 };
    }

    global.PlayTrain = {
        MAPA: MAPA,
        get curva() { return curva; },
        cargar: cargar,
        duracion: duracion,
        esPieza: esPieza,
        entrar: entrar,
        animando: animando,
        desplazamiento: desplazamiento,
    };

    if (typeof document !== 'undefined' && document.addEventListener) {
        document.addEventListener('DOMContentLoaded', () => { cargar(); });
    }
})(typeof window !== 'undefined' ? window : globalThis);
