// play_materials.js — lo que se mueve sin cambiar de sprite.
//
// EL HALLAZGO
// -----------
// La copa de los árboles se mece y el agua del muelle se ondula, y el port las dibujaba
// quietas. No son animaciones de fotogramas: no hay `SimpleAnim` ni `AnimationClip`
// detrás, el sprite es UNO y está quieto. Lo que se mueve es el MATERIAL.
//
// ESTO NO ES UNA SUPOSICIÓN: ES EL SHADER
// ---------------------------------------
// El `.shadergraph` no viaja en la build, pero el shader GENERADO sí, y como la build es
// de Android va en GLSL, en texto. `tools/export_shaders.py` lo saca a `data/shaders/`.
// Así que las cuentas de abajo están copiadas del código, no deducidas.
//
// La primera versión de este fichero SÍ las dedujo de los valores del material, y salió
// mal, porque:
//
//   * Unity conserva en un material los valores de propiedades de shaders ANTERIORES.
//     `Hedge` trae `_Strength` y `_NoiseSpeed`, y `DistortVertex` no declara ninguno de
//     los dos. `Foam` trae 39 valores y su shader lee 3. Hacer cuentas con los otros 36
//     es hacer cuentas con basura.
//   * la amplitud sale de `_GlobalDistort`, que NO está en el material: es un global que
//     pone el código. `TsukiSave::SetReduceMotion` llama a `Shader.SetGlobalFloat` con
//     1.0, o con 0.5 si el jugador activa «Reducir movimiento» en opciones.
//
// LOS CUATRO SHADERS
// ------------------
//   DistortVertex  la copa. Mueve VÉRTICES. Por cada vértice:
//
//       n  = gradientNoise((mundo ± t/_SpeedDamper) · _GlobalDistort·_Scale)   [dos muestras]
//       pos -= n · _GlobalDistort / _StrengthDamper
//
//     Con los valores de `Hedge` (_Scale 4, _SpeedDamper 5, _StrengthDamper 100) sale una
//     amplitud de ±0,005 unidades: menos de un píxel a 150 ppu. Es un TEMBLOR de hojas,
//     no un balanceo. (La primera versión ponía 0,15 unidades, treinta veces más.)
//     El fragmento además deforma la UV, pero dividida otra vez entre `_UVDistortDamper`:
//     ±0,001 en UV, o sea nada.
//
//   Water          el agua. NO desplaza la textura: su `_Speed` es (0,0,0,0).
//
//       t  = tiempo · _GlobalDistort / _BaseSpeedDamper
//       a  = gradientNoise((mundo + t) · _WaterScale) + 0.5        [0..1]
//       uv = uv0 + a / _BaseDistortDamper
//
//     Lo que se ve es la textura ONDULÁNDOSE, con el patrón derivando a t/5. El tinte
//     (`_TintA`/`_TintB`) no se aplica: va multiplicado por (1−_WaterScale)/_WaterScale y
//     `_WaterScale` vale 1, o sea cero. Y la capa de cáusticas se suma con `_CausticColor`,
//     que es gris 0,028: invisible.
//
//   Foam           la espuma. Lo que la hace espuma es el UMBRAL DE ALFA:
//
//       uv    = uv0 + flow(_Distort, objeto + t·0.1)·(uv0−0.5)·2/_DistortDamper·(1−alfa)
//       alfa  = round(clamp(color.a · 2, 0, 1))       ← 1 si alfa>0,25; si no, se descarta
//
//     O sea: el sprite `circleBlur`, que es un círculo difuminado, sale con BORDE DURO
//     recortado donde su alfa pasa de 0,25. Dibujarlo tal cual —que es lo que hacía el
//     port— da manchas blandas, que es justo lo que no parece espuma.
//
//   Distort        18 props del muelle. `uv = uv0 − (n+0.5)·_GlobalDistort/_StrengthDamper`,
//                  con `_StrengthDamper` 500: ±0,002 en UV. No se aplica porque no se ve.

(function (global) {
    'use strict';

    // `TsukiSave::SetReduceMotion`: 1.0 normal, 0.5 con «Reducir movimiento».
    const GLOBAL_DISTORT = 1.0;

    // Los que se pintan en vivo. `Foam` no está aquí: su efecto es un umbral de alfa,
    // que no depende del tiempo de forma visible, así que se aplica AL HORNEAR.
    const APLICADOS = { Water: 'agua', Hedge: 'copa' };

    // El umbral de `Foam`: `round(clamp(a*2,0,1))` deja pasar todo lo que supere 0,25.
    const FOAM_UMBRAL = 0.25;

    let datos = null;
    let cargando = null;

    function prefijo() {
        return (global.location && global.location.pathname.indexOf('/HERRAMIENTAS/') >= 0)
            ? '../../' : '';
    }

    function cargar() {
        if (datos) return Promise.resolve(datos);
        if (cargando) return cargando;
        cargando = fetch(prefijo() + 'data/scene_materials.json')
            .then(r => (r.ok ? r.json() : { porMapa: {}, materiales: {} }))
            .then(j => { datos = j; return datos; })
            .catch(() => { datos = { porMapa: {}, materiales: {} }; return datos; });
        return cargando;
    }

    // ── el ruido de Unity ────────────────────────────────────────────────────
    //
    // Es el nodo `Gradient Noise` de Shader Graph, tal cual. Se reconoce en el GLSL por
    // sus constantes: 289, 34 y 1/41 (0.024390243). Copiarlo entero importa: con un seno
    // en su lugar todos los árboles se mecerían a la vez y en fase, que es exactamente lo
    // que el ruido evita.
    //
    //     float2 dir(float2 p) {
    //         p = p % 289;
    //         float x = (34*p.x + 1)*p.x % 289 + p.y;
    //         x = (34*x + 1)*x % 289;
    //         x = frac(x/41)*2 - 1;
    //         return normalize(float2(x - floor(x + 0.5), abs(x) - 0.5));
    //     }

    function mod289(v) { return v - Math.floor(v / 289) * 289; }

    function direccion(px, py) {
        const x0 = mod289(px), y0 = mod289(py);
        let x = mod289((34 * x0 + 1) * x0) + y0;
        x = mod289((34 * x + 1) * x);
        x = (x / 41) % 1;
        x = x * 2 - 1;
        const dx = x - Math.floor(x + 0.5);
        const dy = Math.abs(x) - 0.5;
        const n = Math.sqrt(dx * dx + dy * dy) || 1;
        return [dx / n, dy / n];
    }

    /** `unity_gradientNoise`: sale en torno a [−0,5, 0,5]. */
    function ruido(x, y) {
        const ix = Math.floor(x), iy = Math.floor(y);
        const fx = x - ix, fy = y - iy;
        const d = (ox, oy) => {
            const g = direccion(ix + ox, iy + oy);
            return g[0] * (fx - ox) + g[1] * (fy - oy);
        };
        const d00 = d(0, 0), d01 = d(0, 1), d10 = d(1, 0), d11 = d(1, 1);
        // El suavizado quíntico de Perlin, 6t⁵−15t⁴+10t³.
        const ux = fx * fx * fx * (fx * (fx * 6 - 15) + 10);
        const uy = fy * fy * fy * (fy * (fy * 6 - 15) + 10);
        const a = d00 + (d01 - d00) * uy;
        const b = d10 + (d11 - d10) * uy;
        return a + (b - a) * ux;
    }

    // ── consultas ────────────────────────────────────────────────────────────

    function material(mapId, go) {
        if (!datos || !go) return null;
        const m = datos.porMapa && datos.porMapa[String(mapId)];
        return (m && m[go]) || null;
    }

    /** Los valores que el SHADER lee de verdad. Los demás del material son basura. */
    function lee(nombreMaterial) {
        const m = datos && datos.materiales && datos.materiales[nombreMaterial];
        return (m && m.lee && m.lee.floats) || {};
    }

    function materialDe(mapId, go) { return material(mapId, go); }

    /** ¿Esta visual la pintamos en vivo? Si sí, hay que sacarla del horneado. */
    function enVivo(mapId, v) {
        if (!v || !v.go) return false;
        const mat = material(mapId, v.go);
        return !!(mat && APLICADOS[mat]);
    }

    function efectoDe(mapId, v) {
        const mat = v && v.go ? material(mapId, v.go) : null;
        return (mat && APLICADOS[mat]) || null;
    }

    /** ¿Lleva el material de espuma? Eso se resuelve al hornear, con el umbral. */
    function esEspuma(mapId, v) {
        return !!v && material(mapId, v.go) === 'Foam';
    }

    // ── los efectos ──────────────────────────────────────────────────────────

    /**
     * El desplazamiento de un sprite con `DistortVertex`, en unidades de mundo.
     *
     * El shader lo hace por VÉRTICE, cada uno con el ruido de su propia posición. Aquí se
     * hace por sprite, con el ruido de su posición: la amplitud es de menos de un píxel,
     * así que la diferencia entre mover las cuatro esquinas por separado y mover el
     * sprite entero no se ve, y cuesta un `drawImage` en vez de diez.
     */
    function desplazamientoCopa(mundoX, mundoY, segundos, props) {
        const p = props || lee('Hedge');
        const speedDamper = p._SpeedDamper || 5;
        const strengthDamper = p._StrengthDamper || 100;
        const escala = p._Scale || 4;
        const t = segundos / speedDamper;
        const f = GLOBAL_DISTORT * escala;
        // Dos muestras que derivan en sentidos opuestos, como en el shader.
        const nx = ruido((mundoX + t) * f, (mundoY + t) * f);
        const ny = ruido((mundoX - t) * f, (mundoY - t) * f);
        const k = GLOBAL_DISTORT / strengthDamper;
        return { dx: -nx * k, dy: -ny * k };
    }

    /**
     * El corrimiento de UV del agua, en fracción de tesela.
     *
     * `uv = uv0 + a/_BaseDistortDamper`, con `a` el ruido +0,5 evaluado en la posición de
     * mundo desplazada por el tiempo. Depende de dónde se mire, así que quien pinte ha de
     * llamarlo por bandas: si se llamara una sola vez para todo el plano, el agua se
     * movería en bloque en vez de ondularse.
     */
    function onduladoAgua(mundoX, mundoY, segundos, props) {
        const p = props || lee('Water');
        const speedDamper = p._BaseSpeedDamper || 5;
        const distortDamper = p._BaseDistortDamper || 12;
        const escala = p._WaterScale || 1;
        const t = segundos * GLOBAL_DISTORT / speedDamper;
        const a = ruido((mundoX + t) * escala, (mundoY + t) * escala) + 0.5;
        return a / distortDamper;
    }

    global.PlayMaterials = {
        GLOBAL_DISTORT: GLOBAL_DISTORT,
        APLICADOS: APLICADOS,
        FOAM_UMBRAL: FOAM_UMBRAL,
        get datos() { return datos; },
        cargar: cargar,
        ruido: ruido,
        lee: lee,
        materialDe: materialDe,
        enVivo: enVivo,
        efectoDe: efectoDe,
        esEspuma: esEspuma,
        desplazamientoCopa: desplazamientoCopa,
        onduladoAgua: onduladoAgua,
    };

    if (typeof document !== 'undefined' && document.addEventListener) {
        document.addEventListener('DOMContentLoaded', () => { cargar(); });
    }
})(typeof window !== 'undefined' ? window : globalThis);
