// play_opening.js — lo que se ve al empezar, antes de la escena.
//
// LA CADENA DEL JUEGO
// -------------------
// `BaseGame.StartProgram()` encadena:
//
//     LogoAnim(color, cts)                el logo, sobre `logoBackingColor`
//     SetLoadingScreen(screen, out pal)   elige pantalla de carga y paleta
//     FadeInColors(pal, screen)           entra con un fundido
//     StartGame(cts)
//     LoadSceneWithTsuki(...)             carga la escena donde esté Tsuki
//
// En una partida nueva Tsuki está en el tren: `level15`, el mapa 7, la Escena de
// Apertura. Ahí arranca el tutorial.
//
// LA PANTALLA DE CARGA NO ES FIJA NI ESTÁ QUIETA
// ----------------------------------------------
// Son cuatro `LoadingScreen`, cada una con sus `Condition` y una `rarity`; `Viable()`
// filtra por condiciones y luego se sortea por rareza:
//
//     tiledfurniture   rarity 100  sin condiciones          la de siempre
//     tiledautumn      rarity 100  Season >= 1 (otoño)      paleta naranja
//     tiledchristmas   rarity 100  VillageEvent >= 1        paleta roja
//     tiledgachas      rarity 5    sin condiciones          la rara, dos paletas
//
// Y la pinta un `ScrollingFillAnimator`, que DESPLAZA la textura teselada. De ahí que
// aquí se dibuje con un patrón que se mueve, no con una imagen quieta.
//
// LOS COLORES
// -----------
// `ScreenPalette` son tres: `backgroundColor`, `texColor` y `accent`. El logo y la
// textura son SILUETAS blancas con alfa —igual que los iconos de burbuja— y se tiñen con
// la paleta. Por eso el logo cambia de color según la época.
//
// DE DÓNDE SALE TODO
// ------------------
// `tools/cs_apertura` lee el `BaseGame` de `level1` y `tools/export_opening.py` cruza el
// `textureID` con el array `IconManager.TileableTextures`. Ese orden no es el del bundle
// ni el del catálogo —los dos ordenan por GUID— y cuadra solo: con él, la pantalla cuya
// condición es Navidad sale `tiledchristmas`, y la de otoño, `tiledautumn`.

(function (global) {
    'use strict';

    const VELOCIDAD = 14;            // px/s de desplazamiento del patrón
    const MS_LOGO = 1600;
    const MS_CARGA_MIN = 1200;

    let datos = null;
    let cargando = null;
    let capa = null;
    let raf = null;

    function prefijo() {
        return (global.location && global.location.pathname.indexOf('/HERRAMIENTAS/') >= 0)
            ? '../../' : '';
    }

    function cargar() {
        if (datos) return Promise.resolve(datos);
        if (cargando) return cargando;
        cargando = fetch(prefijo() + 'data/opening.json')
            .then(r => (r.ok ? r.json() : null))
            .then(j => { datos = j; return datos; })
            .catch(() => { datos = null; return null; });
        return cargando;
    }

    const css = (c) => c
        ? 'rgba(' + Math.round(c.r * 255) + ',' + Math.round(c.g * 255) + ','
                  + Math.round(c.b * 255) + ',' + (c.a != null ? c.a : 1) + ')'
        : 'transparent';

    /**
     * ¿Se cumple la condición? Sólo hacen falta dos tipos, que son los que usan las
     * cuatro pantallas: 36 VillageEvent y 39 Season. `checkType` 0 es «mayor o igual».
     */
    function condCumple(c) {
        const t = Number(c.conditionType);
        const v = Number(c.value);
        if (t === 39) {
            const est = global.Castle && global.Castle.Seasons && global.Castle.Seasons.actual
                ? global.Castle.Seasons.actual() : null;
            if (est == null) return false;
            return Number(c.checkType) === 1 ? (est === v) : (est >= v);
        }
        if (t === 36) {
            const ev = (global.VillageEvents && global.VillageEvents.actual)
                ? global.VillageEvents.actual() : null;
            if (ev == null) return false;
            const id = (typeof ev === 'object') ? ev.eventID : ev;
            return Number(c.checkType) === 1 ? (id === v) : (id >= v);
        }
        return false;                 // un tipo que no conocemos no se da por bueno
    }

    /**
     * La pantalla que toca, como la elige el juego: primero `Viable()` y luego el sorteo
     * por `rarity`. Con las condiciones sin cumplir queda la de siempre.
     */
    function elegirPantalla(azar) {
        if (!datos || !datos.pantallas || !datos.pantallas.length) return null;
        const viables = datos.pantallas.filter(p =>
            p.png && (p.condiciones || []).every(condCumple));
        if (!viables.length) return null;
        const total = viables.reduce((s, p) => s + Math.max(1, p.rarity || 1), 0);
        let r = (azar == null ? Math.random() : azar) * total;
        for (const p of viables) {
            r -= Math.max(1, p.rarity || 1);
            if (r <= 0) return p;
        }
        return viables[viables.length - 1];
    }

    /** La paleta: la propia de la pantalla si la trae, si no una genérica. */
    function elegirPaleta(pantalla) {
        const propias = (pantalla && pantalla.paletasPropias) || [];
        if (propias.length) return propias[Math.floor(Math.random() * propias.length)];
        const gen = (datos && datos.paletasGenericas) || [];
        if (!gen.length) return null;
        return gen[Math.floor(Math.random() * gen.length)];
    }

    function quitar() {
        if (raf) { cancelAnimationFrame(raf); raf = null; }
        if (capa && capa.parentNode) capa.parentNode.removeChild(capa);
        capa = null;
    }

    /**
     * Reproduce la secuencia y resuelve cuando acaba.
     *
     * `alCargar` se llama entre el logo y el final: es donde quien llame mete el trabajo
     * de verdad —cargar la partida, montar la escena— para que la pantalla de carga
     * cubra ese rato, que es para lo que está.
     */
    function reproducir(alCargar) {
        return cargar().then(() => {
            if (!datos) return Promise.resolve(false);
            quitar();

            const pantalla = elegirPantalla();
            const paleta = elegirPaleta(pantalla);
            const fondo = (paleta && paleta.fondo) || datos.logoBackingColor;

            capa = document.createElement('div');
            capa.id = 'tsuki-apertura';
            capa.style.cssText = 'position:fixed;inset:0;z-index:20000;overflow:hidden;'
                + 'background:' + css(fondo) + ';transition:background .6s ease;';

            // El patrón teselado, que se desplaza. Va teñido con `texColor`: la textura
            // es una silueta blanca con alfa, como el logo.
            const patron = document.createElement('div');
            if (pantalla && pantalla.png) {
                patron.style.cssText = 'position:absolute;inset:-200px;opacity:0;'
                    + 'transition:opacity .6s ease;'
                    + 'background-image:url(' + prefijo() + pantalla.png + ');'
                    + 'background-repeat:repeat;';
                if (paleta && paleta.textura) {
                    // Teñir un fondo repetido: se pinta el color y se recorta con la
                    // textura como máscara.
                    patron.style.backgroundColor = css(paleta.textura);
                    patron.style.backgroundBlendMode = 'multiply';
                }
            }
            capa.appendChild(patron);

            const img = document.createElement('img');
            img.src = prefijo() + ((datos.logo && datos.logo.png) || '');
            img.alt = '';
            img.style.cssText = 'position:absolute;left:50%;top:50%;'
                + 'transform:translate(-50%,-50%) scale(.92);width:min(38vw,320px);'
                + 'height:auto;opacity:0;transition:opacity .5s ease, transform .9s ease;'
                // La silueta blanca, teñida con el acento o con el color de textura.
                + 'filter:' + (paleta ? 'none' : 'none') + ';';
            capa.appendChild(img);
            document.body.appendChild(capa);

            // El desplazamiento del patrón, que es lo que hace `ScrollingFillAnimator`.
            const t0 = performance.now();
            const paso = () => {
                const t = (performance.now() - t0) / 1000;
                patron.style.backgroundPosition = (t * VELOCIDAD) + 'px ' + (t * VELOCIDAD) + 'px';
                raf = requestAnimationFrame(paso);
            };
            raf = requestAnimationFrame(paso);

            // 1. el logo
            return new Promise(res => requestAnimationFrame(() => {
                img.style.opacity = '1';
                img.style.transform = 'translate(-50%,-50%) scale(1)';
                setTimeout(res, MS_LOGO);
            }))
            // 2. entra la pantalla de carga
            .then(() => new Promise(res => {
                patron.style.opacity = '1';
                setTimeout(res, 600);
            }))
            // 3. el trabajo de verdad, tapado por la pantalla
            .then(() => {
                const t = performance.now();
                const tarea = alCargar ? Promise.resolve().then(alCargar) : Promise.resolve();
                return tarea.then(() => new Promise(res =>
                    setTimeout(res, Math.max(0, MS_CARGA_MIN - (performance.now() - t)))));
            })
            // 4. fuera
            .then(() => new Promise(res => {
                capa.style.transition = 'opacity .7s ease';
                capa.style.opacity = '0';
                setTimeout(() => { quitar(); res(true); }, 700);
            }));
        });
    }

    global.PlayOpening = {
        get datos() { return datos; },
        cargar: cargar,
        elegirPantalla: elegirPantalla,
        elegirPaleta: elegirPaleta,
        condCumple: condCumple,
        reproducir: reproducir,
        quitar: quitar,
        /** El mapa donde empieza la partida: la Escena de Apertura, el tren. */
        mapaInicial() { return (datos && datos.escenaInicial && datos.escenaInicial.mapId) || '7'; },

        /**
         * El tren entrando en la Estación.
         *
         * Es la actividad 84 del catálogo común —la de Tsuki— en la sublocación 10, con
         * el clip `MoveIn` de su prefab. Se arranca al llegar allí, no en la Escena de
         * Apertura: son dos sitios distintos y el clip pertenece a la Estación.
         */
        entradaTren() {
            if (!global.PlayTrain) return false;
            return global.PlayTrain.cargar().then(() => global.PlayTrain.entrar());
        },

        /**
         * El diálogo con el que arranca la partida.
         *
         * Es `ChiTutorialGraph`, de Chi (charId 2): «Oh Tsuki! You're home…» → «¿Qué ha
         * pasado?» → «…sabes que te pedí cuidar tu casa…» → «¿¿¿QUÉ??? ¿Todo?» → «Lo
         * siento mucho, Tsuki» → «¡Vamos a colocarlo en tu casa!». Eso es lo que explica
         * por qué la casa empieza vacía y lo que abre el tutorial.
         *
         * Estaba extraído desde el principio, con sus 15 idiomas, entre los 717 grafos
         * de `data/dialogues_compact.json`. Lo que no estaba era llamarlo.
         */
        DIALOGO_INICIAL: { charId: 2, grafo: 'ChiTutorialGraph' },

        dialogoInicial() {
            const D = global.DialogueManager;
            if (!D || typeof D.playGraph !== 'function') return false;
            D.playGraph(this.DIALOGO_INICIAL.charId, this.DIALOGO_INICIAL.grafo);
            return true;
        },
    };

    if (typeof document !== 'undefined' && document.addEventListener) {
        document.addEventListener('DOMContentLoaded', () => { cargar(); });
    }
})(typeof window !== 'undefined' ? window : globalThis);
