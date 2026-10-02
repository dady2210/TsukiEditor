// play_walkers.js — los vecinos que pasean.
//
// QUIÉNES SON
// -----------
// 46 actividades son `WalkingActivityBehaviour`, una por vecino de ciudad. El extractor
// de prefabs no las veía porque su animación no cuelga de un `SimpleAnim`: va en campos
// del propio behaviour.
//
//     public class WalkingActivityBehaviour {
//         public SimpleAnimation walk, walk2, flippedWalk, flippedWalk2, stand, flippedStand;
//         public float walkSpeed;                 // 1,5 en los 46
//         private PavementObject linkedPavement;
//         public SimpleGrid lastPosition, currentPosition, targetPosition;
//         public bool GetPath(out SimpleGrid[] path) { }
//     }
//
// Los seis ciclos están en `data/activity_prefabs.json`, en `andares`, con su velocidad.
// Hasta ahora se pintaban quietos con `stand`.
//
// POR DÓNDE ANDAN
// ---------------
// Por la ACERA. `OnSpawn` engancha un `PavementObject` de la localización y anda entre
// sus extremos. Las aceras están extraídas —`tools/cs_pavements`, una por cada uno de los
// 11 niveles de ciudad— con su posición de mundo y su `width`/`length`.
//
// LO QUE NO ESTÁ, Y CÓMO SE SUPLE
// -------------------------------
// `PavementData.endPoints`, que es la lista exacta de extremos, NO viene en la escena:
// `PavementObject` es un `LinkedObject<PavementData>` y esos datos los escribe la partida
// cuando se construye la ciudad, no el nivel. En los 11 niveles el campo `data` no está.
//
// Así que el recorrido se saca de la geometría que SÍ está: el rectángulo de la acera, a
// lo largo de su lado mayor, dejando el margen que el juego deja (`NormalMargin = 0,3`).
// Eso es una aproximación y está dicho: la dirección y la longitud salen del juego, el
// «ida y vuelta entre los dos extremos» no. Si algún día aparece un save con la ciudad
// construida, `endPoints` manda y esto sobra.
//
// CÓMO SE DIBUJA
// --------------
// `SimpleAnimOriented` otra vez: `walk` mirando a un lado, `flippedWalk` al otro. Al
// llegar a un extremo se para un momento con `stand` y da la vuelta — que es lo que hace
// `GetPath` cuando no hay a dónde seguir.

(function (global) {
    'use strict';

    // Las constantes son del juego: `PavementObject.NormalMargin`.
    const MARGEN = 0.3;
    const PARADA_MS = 900;            // lo que se queda quieto al dar la vuelta

    let aceras = null;                // level -> { x, y, width, length }
    let cargando = null;
    const estado = {};                // clave de actor -> { t0, sentido }

    function prefijo() {
        return (global.location && global.location.pathname.indexOf('/HERRAMIENTAS/') >= 0)
            ? '../../' : '';
    }

    function cargar() {
        if (aceras) return Promise.resolve(aceras);
        if (cargando) return cargando;
        cargando = fetch(prefijo() + 'data/pavements.json')
            .then(r => (r.ok ? r.json() : { porNivel: {} }))
            .then(j => {
                aceras = {};
                for (const [lv, lista] of Object.entries(j.porNivel || {})) {
                    // La de mayor superficie: en los 11 niveles hay una sola, pero si
                    // algún día hay varias, se pasea por la grande.
                    const a = lista.slice().sort(
                        (p, q) => (q.width * q.length) - (p.width * p.length))[0];
                    if (a && a.width > 0 && a.length > 0) aceras[lv] = a;
                }
                return aceras;
            })
            .catch(() => { aceras = {}; return aceras; });
        return cargando;
    }

    /**
     * El nivel de un mapa, sacado de dónde están sus imágenes.
     *
     * `config.assetsDir` es `../../images/maps/Exportado_level52`. No hay otro sitio
     * donde el mapa diga de qué nivel de Unity salió.
     */
    function nivelDe(def) {
        const d = String((def && def.config && def.config.assetsDir) || '');
        const m = d.match(/Exportado_(level\d+)/);
        return m ? m[1] : null;
    }

    /** La acera de este mapa, o null si no tiene. */
    function aceraDe(def) {
        const lv = nivelDe(def);
        return (lv && aceras && aceras[lv]) || null;
    }

    /** ¿Esta actividad es un paseo? Lo dice el prefab, no una lista a mano. */
    function esPaseo(actDef) {
        return !!(actDef && actDef.anim && actDef.anim.andares);
    }

    /**
     * Dónde está el paseante ahora, y mirando a dónde.
     *
     * Devuelve `{ x, y, mirandoIzquierda, andando }` en unidades de mundo, o null si en
     * este mapa no hay acera por la que pasear.
     *
     * El recorrido es determinista a partir del reloj y de una fase propia de cada
     * vecino, así que dos paseantes del mismo mapa no van pegados ni se repintan a
     * saltos entre cuadros.
     */
    function posicion(clave, actDef, def, ms) {
        const a = aceraDe(def);
        if (!a || !esPaseo(actDef)) return null;
        const velocidad = actDef.anim.velocidad || 1.5;

        // El lado mayor es por donde se anda; el menor, el ancho de la acera.
        const aLoLargoDeX = a.width >= a.length;
        const largo = Math.max(0, (aLoLargoDeX ? a.width : a.length) - 2 * MARGEN);
        if (largo <= 0) return null;

        const viaje = (largo / velocidad) * 1000;      // ms de punta a punta
        const ciclo = 2 * (viaje + PARADA_MS);
        // La fase: un número estable por vecino, para que no salgan todos a la vez.
        let h = 0;
        const s = String(clave);
        for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
        const t = ((ms + (h % ciclo)) % ciclo);

        let avance, andando, haciaMas;
        if (t < viaje) { avance = t / viaje; andando = true; haciaMas = true; }
        else if (t < viaje + PARADA_MS) { avance = 1; andando = false; haciaMas = true; }
        else if (t < 2 * viaje + PARADA_MS) {
            avance = 1 - (t - viaje - PARADA_MS) / viaje; andando = true; haciaMas = false;
        } else { avance = 0; andando = false; haciaMas = false; }

        const desde = -largo / 2 + avance * largo;
        return {
            x: a.x + (aLoLargoDeX ? desde : 0),
            y: a.y + (aLoLargoDeX ? 0 : desde),
            // En isométrico, ir hacia +x o hacia +y es ir «a la derecha» de la pantalla.
            mirandoIzquierda: !haciaMas,
            andando: andando,
        };
    }

    /**
     * Los fotogramas que tocan: andar o estar quieto, y hacia qué lado.
     *
     * `walk` y `walk2` son los dos ciclos del mismo vecino —el juego alterna— y aquí se
     * alterna por tramo, no por cuadro: cambiar de ciclo en medio de un paso se ve como
     * un tirón.
     */
    function fotogramas(actDef, p, ms) {
        const an = actDef.anim.andares || {};
        if (!p.andando) {
            const fr = p.mirandoIzquierda ? actDef.anim.framesBack : actDef.anim.frames;
            return { frames: (fr && fr.length) ? fr : actDef.anim.frames,
                     fps: actDef.anim.fps || 4, mode: 'loop' };
        }
        const ciclo = (Math.floor(ms / 4000) % 2 === 0) ? (an.walk || an.walk2)
                                                        : (an.walk2 || an.walk);
        if (!ciclo) return { frames: actDef.anim.frames, fps: actDef.anim.fps || 4, mode: 'loop' };
        const fr = p.mirandoIzquierda && ciclo.framesVolteado && ciclo.framesVolteado.length
            ? ciclo.framesVolteado : ciclo.frames;
        return { frames: fr.map(f => f.png || f), fps: ciclo.fps || 4, mode: 'loop' };
    }

    /**
     * Mete las aceras a mano, sin pasar por `fetch`.
     *
     * Es lo que usa la prueba: en node no hay `fetch`, y sin esto `aceraDe` miraria la
     * variable interna vacia y todo el paseo saldria null.
     */
    function usar(mapa) {
        aceras = {};
        for (const [lv, a] of Object.entries(mapa || {})) {
            if (a && a.width > 0 && a.length > 0) aceras[lv] = a;
        }
        return aceras;
    }

    global.PlayWalkers = {
        get aceras() { return aceras; },
        usar: usar,
        MARGEN: MARGEN,
        cargar: cargar,
        nivelDe: nivelDe,
        aceraDe: aceraDe,
        esPaseo: esPaseo,
        posicion: posicion,
        fotogramas: fotogramas,
        /** ¿Hay que repintar? Sí mientras alguien pasee por este mapa. */
        animando(def) { return !!aceraDe(def); },
        olvidar() { for (const k of Object.keys(estado)) delete estado[k]; },
    };

    if (typeof document !== 'undefined' && document.addEventListener) {
        document.addEventListener('DOMContentLoaded', () => { cargar(); });
    }
})(typeof window !== 'undefined' ? window : globalThis);
