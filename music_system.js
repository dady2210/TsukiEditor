// music_system.js — la música de cada sala, como la pone el juego.
//
// LA CADENA DEL JUEGO
// -------------------
// De más general a más concreto, cada eslabón pisa al anterior:
//
//   dayTrack / nightTrack   el par de pistas que declara CADA nivel
//   customBgm               pistas condicionales de la escena (`CustomBGM` + Condition)
//   MusicPlayer             el mueble, si el jugador le ha puesto un casete
//
// Lo extrae `tools/cs_scene_music` del binario y lo cruza `tools/sync_map_music.py` con
// los mp3 que ya hay en `sounds/`, a `data/map_music.json`.
//
// LO QUE HABÍA ANTES
// ------------------
// Los 24 mp3 estaban en disco, bien etiquetados por ubicación y franja en
// `sounds/sounds.json`, y no los usaba nadie: `app.js` reproducía UNA sola URL remota
// fija para todo el juego.
//
// DOS COSAS DEL JUEGO QUE ESTO REPRODUCE
// --------------------------------------
//   * La ciudad NO tiene música. Los veinte mapas declaran `clipID 0` de día y de noche.
//     No es un hueco del port: el juego nunca cerró la ciudad. Así que ahí se calla, que
//     es lo que hace el original.
//   * La tienda de Yori suena distinto de día y de noche, porque de noche la atienden
//     Elfie y Paige. Sale solo del par día/noche, sin ningún caso especial.
//
// EL CORTE ENTRE DÍA Y NOCHE
// --------------------------
// Es el MISMO que usa `play_lighting` para el velo (rampa de 19:30 a 20:30 y de 06:30 a
// 07:30), tomando el punto medio. Si cada uno usara su propio horario, la música
// cambiaría en un momento y la luz en otro, que es peor que no tener música.

(function (global) {
    'use strict';

    const RUTA = 'sounds/music/';
    const FUNDIDO_MS = 1200;      // lo que tarda en cruzarse una pista con la siguiente

    let datos = null;             // data/map_music.json
    let casetes = null;           // itemId -> { archivo, pista, ... } de data/mixtapes.json
    let actual = null;            // { clave, audio }
    let ultimoMapa = null;        // la sala en la que estamos, para poder recargarla
    let saliente = null;
    let silenciado = false;
    let volumen = 0.5;

    /**
     * ¿Es de noche?
     *
     * La misma rampa que `play_lighting`: la noche entra entre las 19:30 y las 20:30 y
     * sale entre las 06:30 y las 07:30. Se cambia de pista en el punto medio de cada
     * rampa, que es donde el velo va por la mitad.
     */
    function esDeNoche(reloj) {
        const c = reloj || (global.GameTime && global.GameTime.now
            ? global.GameTime.now()
            : (global.app && global.app.parser && global.app.parser.getClock
                ? global.app.parser.getClock() : null));
        if (!c) return false;
        const m = ((c.hour | 0) * 60) + (c.minute | 0);
        return m >= 1200 || m < 420;      // 20:00 a 07:00
    }

    async function cargar() {
        if (datos) return datos;
        try {
            const r = await fetch('data/map_music.json');
            datos = r.ok ? await r.json() : { porMapa: {} };
        } catch (e) {
            datos = { porMapa: {} };
        }
        try {
            const r = await fetch('data/mixtapes.json');
            const j = r.ok ? await r.json() : { casetes: [] };
            casetes = {};
            for (const c of (j.casetes || [])) casetes[String(c.itemId)] = c;
        } catch (e) {
            casetes = {};
        }
        return datos;
    }

    /** El casete, por id de objeto. `MusicPlayerSave.musicID` guarda ese id. */
    function caseteDe(itemId) {
        return (casetes && casetes[String(itemId)]) || null;
    }

    /**
     * El casete puesto en un reproductor de esta sala, si lo hay.
     *
     * `MusicPlayer` es un MUEBLE (`GridFurnitureObject`), así que se busca entre los
     * muebles colocados: el item 406 es el Reproductor de Casetes. El casete que tiene
     * dentro va en `MusicPlayerSave.musicID`, y cada `Mixtape : Item` lleva su propio
     * `BGM`.
     *
     * Devuelve null mientras el save no exponga ese dato: entonces manda la pista de la
     * sala, que es lo que suena cuando el reproductor está vacío.
     */
    function casetePuesto(mapId) {
        try {
            const p = global.app && global.app.parser;
            // El parser expone `placements` como ARRAY, no como método. Buscar un
            // `getPlacements()` que no existe devolvía null siempre, en silencio.
            const todos = (p && p.placements) || [];
            const suyos = todos.filter(
                x => Number(x.item_id) === 406 && String(x.cluster) === String(mapId));
            for (const m of suyos) {
                // `MusicPlayerSave : FurnitureSave` guarda el casete en `musicID`, dentro
                // del `furnSave` del mueble. Se lee igual que el parser lee `pillowID`
                // para las camas: por nombre de campo en el nodo del save.
                const fn = m.furnNode;
                const fs = fn && fn.children
                    ? fn.children.find(c => c.name === 'furnSave' || c.name === 'FurnSave')
                    : null;
                const nodo = fs && fs.children
                    ? fs.children.find(c => c.name === 'musicID') : null;
                const id = nodo ? Number(nodo.value) : 0;
                if (id) return { musicID: id, placementID: m.placementID };
            }
        } catch (e) { /* sin save, manda la pista de la sala */ }
        return null;
    }

    /**
     * Qué debería estar sonando ahora mismo en esa sala.
     *
     * El orden es el del juego, de menos a más concreto: manda la pista día/noche de la
     * sala, y la pisa el casete que haya puesto en un `MusicPlayer` de esa misma sala.
     *
     * El fichero sale de `archivoDia`/`archivoNoche`, que es el audio sacado del propio
     * juego por `clipID`. `mp3Dia`/`mp3Noche` son los mp3 de catbox que había antes y
     * sólo se usan si faltara el audio bueno.
     */
    function pistaDe(mapId, reloj) {
        if (!datos) return null;

        // El casete manda sobre la pista de la sala.
        const puesto = casetePuesto(mapId);
        if (puesto) {
            const c = caseteDe(puesto.musicID);
            if (c && c.archivo) {
                return { clave: 'casete:' + puesto.placementID + ':' + puesto.musicID,
                         archivo: c.archivo, nombre: c.nombre, clipID: c.clipID,
                         casete: c, deCasete: true };
            }
        }

        const v = datos.porMapa[String(mapId)];
        if (!v) return null;                       // la ciudad entera cae aquí: sin música
        const noche = esDeNoche(reloj);
        const arch = (noche ? v.archivoNoche : v.archivoDia)
                  || (noche ? v.mp3Noche : v.mp3Dia);
        if (!arch) return null;
        return { clave: String(mapId) + (noche ? ':noche' : ':dia'), archivo: arch,
                 nombre: v.nombre, pista: noche ? v.pistaNoche : v.pistaDia,
                 clipID: noche ? v.clipNoche : v.clipDia };
    }

    function fundir(audio, de, a, ms, alAcabar) {
        const t0 = (typeof performance !== 'undefined' ? performance.now() : Date.now());
        audio.volume = Math.max(0, Math.min(1, de));
        const paso = () => {
            const t = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - t0;
            const k = Math.max(0, Math.min(1, t / ms));
            try { audio.volume = Math.max(0, Math.min(1, de + (a - de) * k)); } catch (e) {}
            if (k < 1) requestAnimationFrame(paso);
            else if (alAcabar) alAcabar();
        };
        requestAnimationFrame(paso);
    }

    /**
     * Pone la pista que toque en esa sala. Si ya es la que suena, no hace nada: volver a
     * arrancarla cortaría la música cada vez que se redibuja.
     */
    function poner(mapId, reloj) {
        if (!datos || silenciado) return;
        const quiero = pistaDe(mapId, reloj);
        const clave = quiero ? quiero.clave : null;
        if (actual && actual.clave === clave) return;

        // Lo que estaba sonando se va con un fundido.
        if (actual && actual.audio) {
            const viejo = actual.audio;
            if (saliente && saliente !== viejo) { try { saliente.pause(); } catch (e) {} }
            saliente = viejo;
            fundir(viejo, viejo.volume, 0, FUNDIDO_MS, () => {
                try { viejo.pause(); } catch (e) {}
                if (saliente === viejo) saliente = null;
            });
        }
        actual = null;
        if (!quiero) return;                       // sala sin música: se queda en silencio

        const audio = new Audio(RUTA + quiero.archivo);
        audio.loop = true;
        audio.volume = 0;
        actual = { clave: clave, audio: audio, info: quiero };
        audio.play().then(() => {
            fundir(audio, 0, volumen, FUNDIDO_MS);
        }).catch(() => {
            // El navegador no deja sonar hasta que el usuario toque algo. Se reintenta
            // al primer gesto, que es lo que hace falta y no molesta.
            const reintento = () => {
                document.removeEventListener('pointerdown', reintento);
                if (actual && actual.audio === audio) {
                    audio.play().then(() => fundir(audio, 0, volumen, FUNDIDO_MS)).catch(() => {});
                }
            };
            document.addEventListener('pointerdown', reintento, { once: true });
        });
    }

    const API = {
        get datos() { return datos; },
        get sonando() { return actual ? actual.info : null; },

        cargar: cargar,
        esDeNoche: esDeNoche,
        pistaDe: pistaDe,
        casetePuesto: casetePuesto,

        /** Lo llama el port al entrar en una sala y al cambiar la hora. */
        alEntrar(mapId, reloj) { ultimoMapa = mapId; poner(mapId, reloj); },

        /**
         * Vuelve a mirar qué toca en la sala en la que ya estamos.
         *
         * Lo llama el reproductor de casetes al poner o sacar uno: la sala no ha
         * cambiado, pero sí lo que debería sonar en ella.
         */
        recargarSala(reloj) { if (ultimoMapa !== null) poner(ultimoMapa, reloj); },

        volumen(v) {
            volumen = Math.max(0, Math.min(1, Number(v) || 0));
            if (actual && actual.audio) { try { actual.audio.volume = volumen; } catch (e) {} }
            return volumen;
        },

        silenciar(s) {
            silenciado = !!s;
            if (silenciado && actual && actual.audio) {
                try { actual.audio.pause(); } catch (e) {}
                actual = null;
            }
            return silenciado;
        },
    };

    global.MapMusic = API;

    document.addEventListener('DOMContentLoaded', () => {
        cargar().catch(e => console.warn('[MapMusic] no se pudo cargar la música:', e));
    });
})(window);
