// play_sfx.js — los efectos de sonido del juego.
//
// DÓNDE ESTABAN
// -------------
// Al revés que la música: los 135 efectos viven en los assets NORMALES
// (`sharedassets1.assets`), y era la música la que estaba fuera, en un bundle de
// addressables. `sounds/effects/` del port llevaba todo este tiempo vacío.
// Los saca `tools/export_sfx.py`.
//
// Y SUS AJUSTES, QUE SON LA MITAD DEL EFECTO
// ------------------------------------------
// `SFXData` no es sólo el clip: trae `volume` y `cooldown` propios de CADA efecto. Los
// saca `tools/cs_audio_data` a `data/sfx_catalogo.json`, y la diferencia se oye: 112 de
// los 133 suenan a un volumen distinto de 1, entre 0,02 (`whirr`) y 1. Antes todos
// sonaban igual de fuertes, así que el tic de un botón competía con un trueno.
//
// El cooldown —cuánto hay que esperar para repetir el mismo— sólo lo llevan ocho, y son
// justo los que se disparan a ráfagas: `tick` 0,1 s, `click` 0,01 s, `select` y
// `unselect` 0,05 s, `sell` 0,5 s. Para los demás el juego no pone ninguno, y aquí
// TAMPOCO: poner uno «por si acaso» se come repeticiones que el juego sí deja sonar.
//
// LO QUE NO SE USA, Y POR QUÉ
// ---------------------------
// `SFXData.interrupts` debería ser la lista de efectos que uno corta al sonar. Los
// valores que trae el asset no son índices: van de 59862 a -1515388498 y el array sólo
// tiene 133 entradas — los 130 valores se salen del rango. El typetree está bien (el
// resto de campos del mismo struct salen correctos), así que eso es lo que hay dentro.
// Se guardan crudos en el catálogo, como `interruptsCrudo`, y aquí no se tocan.

(function (global) {
    'use strict';

    const RUTA = 'sounds/effects/';

    let datos = null;                 // nombre -> { archivo, segundos }
    let ajustes = null;               // nombre -> { id, volume, cooldown }
    let cargando = null;
    let volumen = 0.7;                // el volumen general del port, encima del de cada uno
    let silenciado = false;
    const ultimo = {};
    // Los efectos que suenan EN BUCLE, por nombre, para poder pararlos.
    const bucles = {};                // nombre -> cuándo sonó

    function prefijo() {
        return (global.location && global.location.pathname.indexOf('/HERRAMIENTAS/') >= 0)
            ? '../../' : '';
    }

    function cargar() {
        if (datos) return Promise.resolve(datos);
        if (cargando) return cargando;
        const p = prefijo();
        cargando = Promise.all([
            fetch(p + 'data/sfx.json').then(r => (r.ok ? r.json() : { efectos: [] }))
                .catch(() => ({ efectos: [] })),
            fetch(p + 'data/sfx_catalogo.json').then(r => (r.ok ? r.json() : { sfx: [] }))
                .catch(() => ({ sfx: [] })),
        ]).then(([a, b]) => {
            datos = {};
            for (const e of (a.efectos || [])) datos[e.nombre] = e;
            ajustes = {};
            for (const e of (b.sfx || [])) {
                if (e.clip) ajustes[e.clip] = e;
            }
            return datos;
        });
        return cargando;
    }

    /** Los ajustes del juego para un efecto, o los de por defecto si no está. */
    function ajusteDe(nombre) {
        const a = ajustes && ajustes[nombre];
        return {
            // `volume` es lo que el juego le pone a ESE efecto. Cuando no está en el
            // catálogo —`heavyRain` y `lightRain`, que se exportaron y no aparecen en
            // `AudioData.sfx`— se deja a 1 y manda el volumen general.
            volume: (a && typeof a.volume === 'number') ? a.volume : 1,
            // Sin cooldown en el catálogo NO se inventa uno.
            cooldown: (a && typeof a.cooldown === 'number') ? a.cooldown * 1000 : 0,
            id: a ? a.id : null,
        };
    }

    /**
     * Suena un efecto por su nombre del juego.
     *
     * Devuelve false si no existe o si aún está en cooldown, para que quien llame pueda
     * saber si sonó de verdad. Un nombre que no está NO es un error: hay efectos que el
     * port todavía no dispara.
     */
    function sonar(nombre, opciones) {
        if (silenciado || !datos) return false;
        const e = datos[nombre];
        if (!e) return false;
        const o = opciones || {};
        const aj = ajusteDe(nombre);
        const ahora = (typeof performance !== 'undefined' && performance.now)
            ? performance.now() : Date.now();
        const espera = (o.cooldown != null) ? o.cooldown : aj.cooldown;
        if (espera > 0 && ultimo[nombre] != null && ahora - ultimo[nombre] < espera) return false;
        ultimo[nombre] = ahora;
        try {
            const a = new Audio(prefijo() + RUTA + e.archivo);
            const propio = (o.volumen != null) ? o.volumen : aj.volume;
            a.volume = Math.max(0, Math.min(1, propio * volumen));
            // EN BUCLE. Lo pide la lluvia: `lightRain` y `heavyRain` son un fondo que
            // dura mientras dura el temporal, no un golpe. Se guarda para poder pararlo,
            // y si ya estaba sonando no se pone otro encima.
            if (o.bucle) {
                if (bucles[nombre]) return true;
                a.loop = true;
                bucles[nombre] = a;
            }
            // El navegador no deja sonar hasta que el usuario toque algo; si aún no ha
            // tocado, esto falla y no pasa nada. No se reintenta: un efecto que llega
            // tarde es peor que uno que no llega.
            a.play().catch(() => {});
            return true;
        } catch (err) { return false; }
    }

    /** Para un efecto que estaba en bucle. Devuelve si habia alguno. */
    function parar(nombre) {
        const a = bucles[nombre];
        if (!a) return false;
        try { a.pause(); a.currentTime = 0; } catch (e) {}
        delete bucles[nombre];
        return true;
    }

    /** Para todos los bucles. Al cambiar de mapa o al salir del modo juego. */
    function pararTodo() {
        for (const n of Object.keys(bucles)) parar(n);
    }

    /**
     * El enganche de la interfaz: un clic en algo que suena.
     *
     * El juego no llama a `PlaySFX` desde cada botón; tiene sonidos de UI genéricos
     * (`click`, `select`, `tick`) y otros propios de cada panel. Aquí se hace lo mismo
     * con delegación: un `data-sfx="newspaperOpen"` en el elemento y ya suena, sin tener
     * que ir a buscar cada manejador. Los paneles que abren y cierran llevan además
     * `data-sfx-cerrar`.
     */
    function engancharUI() {
        if (typeof document === 'undefined' || !document.addEventListener) return;
        document.addEventListener('click', (ev) => {
            let n = ev.target;
            for (let i = 0; n && i < 6; i++, n = n.parentElement) {
                const s = n.getAttribute && n.getAttribute('data-sfx');
                if (s) { sonar(s); return; }
            }
            // EL GENERICO. El juego tiene `click` para los botones que no traen sonido
            // propio; sin esto habia 135 efectos extraidos y ni un clic sonaba. Con
            // cooldown corto para que una rafaga no se solape.
            const b = ev.target && ev.target.closest
                ? ev.target.closest('button, .port-btn, [role="button"]') : null;
            if (b && !b.hasAttribute('data-sin-sfx')) sonar('click', { cooldown: 60 });
        }, true);
    }

    global.PlaySfx = {
        get datos() { return datos; },
        get ajustes() { return ajustes; },
        cargar: cargar,
        sonar: sonar,
        parar: parar,
        pararTodo: pararTodo,
        ajusteDe: ajusteDe,
        engancharUI: engancharUI,
        tiene: (n) => !!(datos && datos[n]),
        volumen(v) { volumen = Math.max(0, Math.min(1, Number(v) || 0)); return volumen; },
        silenciar(s) { silenciado = !!s; return silenciado; },
    };

    if (typeof document !== 'undefined' && document.addEventListener) {
        document.addEventListener('DOMContentLoaded', () => { cargar(); engancharUI(); });
    }
})(typeof window !== 'undefined' ? window : globalThis);
