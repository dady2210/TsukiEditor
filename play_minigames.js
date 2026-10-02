// play_minigames.js — el tambor y la pesca.
//
// QUÉ HAY Y QUÉ NO
// ----------------
// Son las dos actividades del juego con lógica propia, no una animación que se repite.
// `tools/export_minigames.py` saca a `data/minigames.json` todo lo que de ellas es DATO,
// que resultó ser bastante más de lo que parecía:
//
//   * La CANCIÓN del taiko. `TaikoGame.patterns` es un `BeatPattern[]` serializado: once
//     entradas que dicen en qué compás entra cada patrón y si es `Simple` o `Complex`.
//     La estructura de la partida está entera aquí.
//   * Las líneas de Paige por resultado, como índices dentro de su grafo:
//     `perfectPerformance`, `franticPerformance`, `absentPerformance`... y las doce del
//     tutorial, que son las que enseñan a tocar.
//   * Las dos curvas con las que se mueve el tambor al golpear, `beatXCurve` y
//     `beatYCurve`, con sus claves.
//   * El bocadillo de la pesca, capa a capa, con su retardo y su escala.
//   * Las constantes declaradas: `errorLeeway` 0,1 compases, `TapOffset` 1,08,
//     `DrumRadius` 1,57 y `DrumRadiusRatio` 0,72.
//
// LA PARTITURA, QUE TAMBIÉN SE RECUPERÓ
// -------------------------------------
// Faltaba la secuencia de golpes de cada patrón, que no es un asset: es la forma del
// bucle de `DrumGame.HighlightDrum`. Se leyó del binario —con `rva_all.json`, porque las
// direcciones de `script.json` no caen en el prólogo de ninguna función— y la vuelca
// `tools/extract_minigame_code.py` a `data/minigame_code.json`:
//
//     Simple   cuatro golpes en las cuartas partes del compás, los cuatro Don
//              (`scvtf s1, w20, #2` es i/4, y el bucle corta en `cmp w20, #4`)
//     Complex  siete posiciones en octavos, y no todas suenan:
//              Don · — · Kah · — · Don · Kah · Kah
//              (`scvtf s1, w23, #3` es i/8, `cmp w23, #7`; las posiciones 1 y 3 no
//               llaman a `Drum::ShowIndicator`, sólo adelantan el contador)
//
// La ventana de acierto es ±0,1 COMPASES —no segundos—, que es `BeatPattern.errorLeeway`,
// y el bucle deja de mirar a 0,85 compases de distancia.
//
// LO QUE SIGUE SIN ESTAR
// ----------------------
// El pez concreto que sale al pescar: `ValidSimpleFishes(rarity)` filtra el catálogo por
// tipo de agua, rareza, estación y lo que ya haya salido en el periódico. La rareza sí
// se decide aquí (`play_fishing.js`); elegir el pez necesita el inventario del port.

(function (global) {
    'use strict';

    let datos = null;
    let codigo = null;           // data/minigame_code.json: lo leido del binario
    let cargando = null;

    function prefijo() {
        return (global.location && global.location.pathname.indexOf('/HERRAMIENTAS/') >= 0)
            ? '../../' : '';
    }

    function cargar() {
        if (datos) return Promise.resolve(datos);
        if (cargando) return cargando;
        const p = prefijo();
        cargando = Promise.all([
            fetch(p + 'data/minigames.json').then(x => (x.ok ? x.json() : null))
                .catch(() => null),
            fetch(p + 'data/minigame_code.json').then(x => (x.ok ? x.json() : null))
                .catch(() => null),
        ]).then(([a, b]) => {
            datos = a || { juegos: {} };
            codigo = b || null;
            return datos;
        });
        return cargando;
    }

    function juego(clase) {
        const l = (datos && datos.juegos && datos.juegos[clase]) || [];
        return l[0] || null;
    }

    /** ¿Esta actividad es uno de los dos minijuegos? */
    function esMinijuego(activityID) {
        if (!datos) return null;
        for (const [clase, lista] of Object.entries(datos.juegos || {})) {
            for (const j of lista) {
                if (Number(j.activityID) === Number(activityID)) return clase;
            }
        }
        return null;
    }

    // ── El tambor ────────────────────────────────────────────────────────────

    /**
     * Evalúa una `AnimationCurve` de Unity con interpolación de Hermite.
     *
     * Las dos curvas del tambor tienen dos claves y pendientes propias en cada una, así
     * que una interpolación lineal se sale del rebote: `beatXCurve` va de 1,05 a 1,00 con
     * pendiente −0,267 al principio, o sea que el golpe ENCOGE y vuelve.
     */
    function enCurva(claves, t) {
        if (!claves || !claves.length) return 1;
        if (t <= claves[0].t) return claves[0].v;
        const u = claves[claves.length - 1];
        if (t >= u.t) return u.v;
        for (let i = 1; i < claves.length; i++) {
            const a = claves[i - 1], b = claves[i];
            if (t > b.t) continue;
            const dt = b.t - a.t;
            if (dt <= 0) return b.v;
            const s = (t - a.t) / dt;
            const s2 = s * s, s3 = s2 * s;
            return (2 * s3 - 3 * s2 + 1) * a.v
                 + (s3 - 2 * s2 + s) * dt * a.out
                 + (-2 * s3 + 3 * s2) * b.v
                 + (s3 - s2) * dt * b.in;
        }
        return u.v;
    }

    /** La escala del tambor en este instante del compás, 0..1. */
    function golpe(t) {
        const d = (datos && datos.tambor) || null;
        if (!d) return { x: 1, y: 1 };
        return { x: enCurva(d.beatXCurve, t), y: enCurva(d.beatYCurve, t) };
    }

    /**
     * El sonido de un golpe.
     *
     * `Drum.HitType`: Don es el centro (azul) y Kah el borde (rojo). Los cuatro clips
     * están en el catálogo: `Blue - Normal`, `Blue - Special`, `Red - Normal`,
     * `Red - Special`. El especial es el del compás fuerte.
     */
    /**
     * `SFXClip.TaikoCue`: la senyal que marca el compas en el tutorial.
     *
     * `TaikoTutorial` tiene `SimpleCueSequence` y `ComplexCueSequence`, que son las que la
     * tocan antes de cada patron para que el jugador la copie.
     */
    function sonarSenyal() {
        return !!(global.PlaySfx && global.PlaySfx.sonar('TaikoCue'));
    }

    function sonarGolpe(tipo, especial) {
        if (!global.PlaySfx) return false;
        const color = (tipo === 'Kah' || tipo === 1) ? 'Red' : 'Blue';
        return global.PlaySfx.sonar(color + (especial ? ' - Special' : ' - Normal'));
    }

    /** El radio del tambor y dónde cae un toque: centro = Don, borde = Kah. */
    function tipoDeToque(dx, dy) {
        const c = (datos && datos.constantes) || {};
        const r = c.drumRadius || 1.57;
        const ratio = c.drumRadiusRatio || 0.72;
        const d = Math.hypot(dx, dy);
        if (d > r) return 'None';
        return d <= r * ratio ? 'Don' : 'Kah';
    }

    /**
     * La partitura de un patrón: qué se toca y cuándo, dentro de su compás.
     *
     * Devuelve `[{ compas, nota }]`, donde `compas` es la posición EN COMPASES desde el
     * principio de la canción y `nota` es 'Don' o 'Kah'. Los silencios no salen: en el
     * juego son posiciones que no llaman a `Drum::ShowIndicator`.
     *
     * Sale de `data/minigame_code.json`, leído del bucle de `DrumGame.HighlightDrum`.
     */
    function partitura(patron, compasInicial) {
        const p = codigo && codigo.taiko && codigo.taiko.patrones
            && codigo.taiko.patrones[patron];
        if (!p) return [];
        const base = compasInicial || 0;
        return p.golpes
            .filter(g => g.nota)
            .map(g => ({ compas: base + g.pos / p.division, nota: g.nota }));
    }

    /** La canción entera: los once patrones de `TaikoGame.patterns`, ya desplegados. */
    function partituraCompleta() {
        const j = juego('TaikoGame');
        if (!j) return [];
        return (j.patrones || []).reduce(
            (acc, p) => acc.concat(partitura(p.patron, p.compas)), []);
    }

    /**
     * La nota de una interpretación.
     *
     * `DrumGame.Grade`: Perfect, Miss, Wrong, Early, Late, Absent, Frantic. El margen es
     * `BeatPattern.errorLeeway`, 0,1 COMPASES —no segundos—, así que depende del tempo.
     *
     * El margen sale de `minigame_code.json` cuando está —es el mismo 0,1 que declara
     * `BeatPattern.errorLeeway`, releído del literal del binario— y si no, del que
     * declara `dump.cs`.
     */
    function nota(distanciaEnCompases) {
        const c = (datos && datos.constantes) || {};
        const margen = (codigo && codigo.taiko && codigo.taiko.ventanaCompases)
            || c.errorLeeway || 0.1;
        if (Math.abs(distanciaEnCompases) <= margen) return 'Perfect';
        return distanciaEnCompases < 0 ? 'Early' : 'Late';
    }

    /**
     * ¿Ha acertado este golpe, y cuál?
     *
     * Busca en la partitura el golpe más cercano dentro de la ventana. Sin ninguno cerca
     * es `Miss`; con uno cerca pero del otro color, `Wrong`. Son los grados del juego.
     */
    function juzgar(partit, compasDelToque, tipo) {
        const margen = (codigo && codigo.taiko && codigo.taiko.ventanaCompases) || 0.1;
        let mejor = null, d = Infinity;
        for (const g of (partit || [])) {
            const x = Math.abs(g.compas - compasDelToque);
            if (x < d) { d = x; mejor = g; }
        }
        if (!mejor || d > margen) return { golpe: null, nota: 'Miss' };
        if (mejor.nota !== tipo) return { golpe: mejor, nota: 'Wrong' };
        return { golpe: mejor, nota: nota(compasDelToque - mejor.compas) };
    }

    /**
     * La línea de Paige que toca según cómo haya ido.
     *
     * Devuelve el ÍNDICE dentro de su grafo, que es como lo guarda el prefab. Quien lo
     * use se lo pasa a `DialogueManager`.
     */
    function lineaDe(clase, clave) {
        const j = juego(clase);
        return (j && j.lineas && j.lineas[clave] != null) ? j.lineas[clave] : null;
    }

    /** El tutorial del tambor engancha con una tarea de festival: evento 4, tarea 0. */
    function tareaDelTutorial() {
        const j = juego('TaikoTutorial');
        return j ? { eventID: j.eventID, eventTaskID: j.eventTaskID } : null;
    }

    // ── La pesca ─────────────────────────────────────────────────────────────

    /**
     * Las capas del bocadillo que sale al picar, en orden y con su retardo.
     *
     * `BlurbPopup.BlurbDisplay`: cada capa tiene su sprite, cuándo entra (`delay`), de
     * qué escala parte (`scaleStart`) y a cuál va (`scale`).
     */
    function bocadillo(clase) {
        const j = juego(clase || 'Fishing');
        return (j && j.bocadillo) || [];
    }

    /**
     * Los sonidos de la pesca, por si quien los dispara no quiere saberse los nombres.
     *
     * `Fishing` tiene cuatro disparadores de animación —Recast, Bite, BiteFail, Pull— y
     * tres de ellos tienen efecto propio en el catálogo.
     */
    const SONIDOS = { pica: 'bite', saca: 'catch', relanza: 'recast' };
    function sonar(cual) {
        const n = SONIDOS[cual];
        return !!(n && global.PlaySfx && global.PlaySfx.sonar(n));
    }

    global.PlayMinigames = {
        get datos() { return datos; },
        cargar: cargar,
        juego: juego,
        esMinijuego: esMinijuego,
        // tambor
        enCurva: enCurva,
        golpe: golpe,
        sonarGolpe: sonarGolpe,
        tipoDeToque: tipoDeToque,
        nota: nota,
        juzgar: juzgar,
        partitura: partitura,
        partituraCompleta: partituraCompleta,
        get codigo() { return codigo; },
        /** Para pruebas: mete los dos documentos sin pasar por `fetch`. */
        usar(a, b) { datos = a || datos; codigo = b || codigo; return datos; },
        lineaDe: lineaDe,
        tareaDelTutorial: tareaDelTutorial,
        cancion() { const j = juego('TaikoGame'); return (j && j.patrones) || []; },
        // pesca
        bocadillo: bocadillo,
        sonar: sonar,
        SONIDOS: SONIDOS,
        /**
         * Lo que falta para poder JUGAR, y no para verlo.
         *
         * Se expone a propósito: quien quiera montar la partida encima sabe qué le falta
         * sin tener que leerse el módulo.
         */
        // Ya no falta nada de los dos minijuegos: la partitura del taiko salió del
        // bucle de `HighlightDrum` y los 119 peces del registro de SerializeReference de
        // `ItemData`. Se deja la lista, vacía, porque es donde toca apuntar lo próximo.
        loQueFalta: [],
    };

    if (typeof document !== 'undefined' && document.addEventListener) {
        document.addEventListener('DOMContentLoaded', () => { cargar(); });
    }
})(typeof window !== 'undefined' ? window : globalThis);
