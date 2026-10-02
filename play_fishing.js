// play_fishing.js — pescar.
//
// DE DÓNDE SALEN LAS REGLAS
// -------------------------
// Del binario. No estaban en ningún asset: `Fishing` no serializa ni un tiempo ni un
// umbral, los tiene en el cuerpo de sus métodos. Se leyeron con capstone sobre
// `libil2cpp.so`, resolviendo las direcciones con `rva_all.json` —el índice bueno; el de
// `script.json` no cae en el prólogo de ninguna función— y las vuelca
// `tools/extract_minigame_code.py`, que RELEE cada literal del binario y se niega a
// escribir si alguno no cuadra.
//
// EL BUCLE, TAL CUAL
// ------------------
//     GetCatchTime()            rate = water.SaveObject.FishRate()
//                               rate <= 0,01  ->  fishCatchTime = 400   (no pica nunca)
//                               si no         ->  5 / rate + Random(-3, 3)
//
//     WaitLogic()               fishTimer += dt
//       fishTimer >= fishCatchTime y AÚN NO había picado:
//                               PICA. Suena `bite`, se anima, y fishCatchTime += 3.
//       fishTimer >= fishCatchTime y YA había picado:
//                               se escapó. BiteFail, se relanza, fishTimer = 0.
//       si no, y ya había picado:
//                               Leeway(): el toque sólo cuenta si
//                               fishTimer > fishCatchTime − 2.
//
// O sea, y esto es lo que se nota al jugar: al picar te dan TRES segundos más, pero el
// tirón sólo vale en los DOS ÚLTIMOS. El primer segundo después de la picada no cuenta.
// Eso no se habría adivinado.
//
//     RollRarity(roll)          roll < 0,04 -> Epic   roll < 0,12 -> Rare   si no Common
//
// QUÉ PEZ SALE
// ------------
// Hay dos tablas y las dos están. Las saca `tools/cs_fish_data`.
//
// `ItemData.fishableItems` — 30 entradas. Son los pescables ESPECIALES: los tesoros y la
// basura. La Pendiente de Lady, la Madera a la Deriva, las tres cintas de música, la
// Botella, la Bota y veintitantos de evento. Cada una con su agua, sus condiciones y su
// `priority`.
//
// `ItemData.items` — 339 objetos, de los cuales **119 son `Fish`**, con su `waterType`,
// su `rarity` y su `StartHour`.
//
// UN AVISO, PORQUE COSTÓ UNA HORA
// -------------------------------
// `items` PARECE vacío si se lee como un array de punteros, y por eso se dio por hecho
// que los objetos no venían en la build. No es así: el campo es `managedReference`, o sea
// `[SerializeReference]`, y cada elemento guarda sólo un `rid`. Los objetos viven en el
// REGISTRO del propio MonoBehaviour (`references`). Buscarlos como objetos sueltos por
// los 1853 ficheros de `Data/` y por los bundles da cero, porque no son objetos sueltos.
//
// EL SORTEO, TAL CUAL
// -------------------
// `Fishing.Roll()` tira la rareza y pide los peces válidos de esa rareza:
//
//     Rarity r = RollRarity(Random.value);       // <0,04 Epic, <0,12 Rare, si no Common
//     BaseItem[] v = ValidSimpleFishes(r);
//
// y `ValidSimpleFishes` hace DOS cosas, en este orden:
//
//     foreach (p in fishableItems) {             // los especiales, primero
//         if (!p.Check(fishing, out item)) continue;
//         if (Random.value <= p.Priority) return new List { item };   // GANA SOLO
//         lista.Add(item);
//     }
//     foreach (f in items.OfType<Fish>())        // y luego los peces
//         if (f.Check(fishing)) lista.Add(f);
//
// `Fish.Check(waterType)` es:
//
//     if (InternalItem) return false;
//     if ((this.waterType & waterType) == 0) return false;
//     return base.Check();                        // condiciones del objeto
//
// LA HORA, QUE NO LA TIENEN TODOS
// -------------------------------
//     TimeAvailable = legendario ? 24 : [24, 12, 6, 24][rarity]
//     EndHour       = (StartHour + TimeAvailable) % 24
//     HasTimings    = rarity es Rare o Epic
//
// O sea: los comunes y los legendarios se pescan a cualquier hora; los raros tienen doce
// horas y los épicos seis. Cuadra con los datos: 36 raros + 23 épicos = 59, que son
// exactamente los 59 con `StartHour` distinto de cero.

(function (global) {
    'use strict';

    let reglas = null;
    let cargando = null;

    function prefijo() {
        return (global.location && global.location.pathname.indexOf('/HERRAMIENTAS/') >= 0)
            ? '../../' : '';
    }

    function cargar() {
        if (reglas) return Promise.resolve(reglas);
        if (cargando) return cargando;
        const p = prefijo();
        cargando = Promise.all([
            fetch(p + 'data/minigame_code.json').then(r => (r.ok ? r.json() : null))
                .catch(() => null),
            fetch(p + 'data/fishing.json').then(r => (r.ok ? r.json() : null))
                .catch(() => null),
        ]).then(([a, b]) => {
            reglas = (a && a.pesca) || null;
            tabla = b || null;
            return reglas;
        });
        return cargando;
    }

    /** Para pruebas y para quien ya tenga el documento cargado. */
    function usar(p) { reglas = p; return reglas; }

    function azar() {
        return (global.Math && Math.random()) || 0;
    }

    /**
     * Cuánto tarda en picar, en segundos.
     *
     * `rate` es `WaterSave.FishRate()`: lo lleno que está ese agua. Cuanto más alto,
     * antes pica — de ahí el `5 / rate`. Por debajo de 0,01 el juego devuelve 400
     * segundos, que es su manera de decir «aquí no pica nada».
     */
    function tiempoDePicada(rate, aleatorio) {
        const r = reglas;
        if (!r) return null;
        if (!(rate > r.rateMinimo)) return r.sinPicarSegundos;
        const a = r.aleatorio[0];
        const b = r.aleatorio[1];
        const x = (aleatorio == null ? azar() : aleatorio);
        return r.numerador / rate + (a + x * (b - a));
    }

    /** Una partida nueva. `rate` sale del agua donde se pesca. */
    function empezar(rate) {
        const t = tiempoDePicada(rate);
        if (t == null) return null;
        return { t: 0, picada: t, haPicado: false, cogiendo: false, fin: false };
    }

    /**
     * Un cuadro. `dt` en segundos.
     *
     * Devuelve qué ha pasado: `'pica'`, `'escapa'` o `null`. Es lo mismo que decide
     * `WaitLogic`, en el mismo orden.
     */
    function avanzar(e, dt) {
        if (!e || !reglas || e.fin) return null;
        e.t += dt;
        if (e.t >= e.picada) {
            if (e.haPicado) {
                // Se escapó: el juego relanza el sedal y vuelve a empezar la espera.
                e.haPicado = false;
                e.t = 0;
                if (global.PlaySfx) global.PlaySfx.sonar('recast');
                return 'escapa';
            }
            e.haPicado = true;
            e.picada += reglas.leeway;
            if (global.PlaySfx) global.PlaySfx.sonar('bite');
            return 'pica';
        }
        return null;
    }

    /**
     * ¿Cuenta el tirón ahora mismo?
     *
     * `Fishing.Leeway()`: sólo si ya ha picado y `fishTimer > fishCatchTime - 2`. Antes
     * de eso el toque se pierde, aunque el pez ya esté ahí.
     */
    function sePuedeTirar(e) {
        if (!e || !reglas || !e.haPicado || e.cogiendo) return false;
        return e.t > e.picada - reglas.ventanaSegundos;
    }

    /** El tirón. Devuelve la rareza si ha entrado, o null si era pronto. */
    function tirar(e, aleatorio) {
        if (!sePuedeTirar(e)) return null;
        e.cogiendo = true;
        e.fin = true;
        if (global.PlaySfx) global.PlaySfx.sonar('catch');
        return rareza(aleatorio == null ? azar() : aleatorio);
    }

    /**
     * `Fishing.RollRarity(roll)`. Los umbrales están leídos del binario, no puestos a ojo.
     */
    function rareza(roll) {
        if (!reglas) return null;
        for (const u of reglas.umbrales) {
            if (u.menorQue == null || roll < u.menorQue) return u.rareza;
        }
        return 'Common';
    }

    /**
     * Los pescables que valen en este agua ahora mismo.
     *
     * `waterType` es una MÁSCARA de bits (Sea 2, Pond 4, River 8, Reef 16), así que un
     * pescable de `Sea+River` entra en los dos.
     *
     * Las condiciones se juzgan con el mismo evaluador que todo lo demás
     * (`Activities.cumple`). SIN ÉL SE DESCARTAN, que es lo contrario de lo que apetece
     * escribir: veinte de las treinta entradas están condicionadas y casi todas son
     * tesoros de una sola vez, así que dejarlas pasar sin juzgar hace que la primera
     * tirada en el mar saque la Pendiente de Lady. Mejor pescar de menos que regalar un
     * tesoro en cada caña.
     */
    function candidatos(agua) {
        const t = (tabla && tabla.pescables) || [];
        const A = global.Activities;
        const puedeJuzgar = !!(A && typeof A.cumple === 'function');
        return t.filter(p => {
            if (agua != null && p.agua && !(Number(p.agua) & Number(agua))) return false;
            if (!(p.condiciones || []).length) return true;
            if (!puedeJuzgar) return false;
            return p.condiciones.every(c => {
                try { return A.cumple({ type: c.t, check: c.c, value: c.v }, {}); }
                catch (e) { return false; }
            });
        });
    }

    // `Fish.TimeAvailable`, leído del binario: la tabla de cuatro enteros que indexa la
    // rareza, y el atajo de los legendarios.
    const HORAS_POR_RAREZA = [24, 12, 6, 24];
    const RAREZAS = ['Common', 'Rare', 'Epic', 'Legendary'];

    /** `Fish.HasTimings`: sólo los raros y los épicos tienen ventana. */
    function tieneHorario(pez) {
        return pez.rareza === 1 || pez.rareza === 2;
    }

    /** `Fish.EndHour` = (StartHour + TimeAvailable) % 24. */
    function finDe(pez) {
        return (pez.horaInicio + HORAS_POR_RAREZA[pez.rareza | 0]) % 24;
    }

    /**
     * ¿Se puede pescar ahora?
     *
     * La ventana puede CRUZAR la medianoche —un épico que empieza a las 21 acaba a las
     * 3—, así que no vale con comparar inicio <= hora < fin.
     */
    function aEstaHora(pez, hora) {
        if (!tieneHorario(pez)) return true;
        if (hora == null) return true;
        const a = pez.horaInicio | 0, b = finDe(pez);
        return (a <= b) ? (hora >= a && hora < b) : (hora >= a || hora < b);
    }

    /**
     * Los peces del catálogo que valen: `Fish.Check(waterType)` más la hora.
     *
     * `rareza` filtra como el argumento de `ValidSimpleFishes(Rarity)`; sin ella salen
     * todos los que el agua y la hora permitan.
     */
    function pecesValidos(agua, rareza, hora) {
        const t = (tabla && tabla.peces) || [];
        return t.filter(p => {
            if (agua != null && !(Number(p.agua) & Number(agua))) return false;
            if (rareza != null && RAREZAS[p.rareza] !== rareza) return false;
            return aEstaHora(p, hora);
        });
    }

    /**
     * Qué sale al tirar, con el sorteo de `Fishing.ValidSimpleFishes`.
     *
     * No es una ruleta ponderada, que es lo que parecía. Leído del binario, el bucle es:
     *
     *     foreach (p in fishableItems) {
     *         if (!p.Check(fishing, out item)) continue;   // agua y condiciones
     *         if (Random.value <= p.Priority)              // fcmp + b.ls
     *             return new List { item };                // GANA EN SOLITARIO
     *         lista.Add(item);                             // si no, a la piscina
     *     }
     *     return lista;
     *
     * O sea: cada pescable que pasa el filtro tira su propio dado EN ORDEN DE ARRAY, y el
     * primero que acierta se lleva la pesca él solo. Los que no aciertan no se descartan:
     * entran en la piscina de la que se elige después. Eso cambia el resultado respecto a
     * una ruleta: un pescable con prioridad alta al principio del array corta el sorteo.
     *
     * Devuelve `{ rareza, id, piscina }`. `id` es el que ganó en solitario, o null; la
     * `piscina` son los que no ganaron y de la que sale la pesca normal — a la que en
     * esta build le faltan los peces corrientes.
     */
    function elegir(agua, roll, dados, hora) {
        const r = rareza(roll == null ? azar() : roll);
        const lista = candidatos(agua);
        const piscina = [];
        for (let i = 0; i < lista.length; i++) {
            const p = lista[i];
            const pr = prioridadDe(p);
            const x = (dados && dados.length > i) ? dados[i] : azar();
            if (x <= pr) {
                return { rareza: r, id: p.id, prioridad: pr, pescable: p,
                         especial: true, piscina: piscina };
            }
            piscina.push({ id: p.id, especial: true });
        }
        // Y detrás, los peces de esa rareza que el agua y la hora permitan.
        for (const p of pecesValidos(agua, r, hora)) {
            piscina.push({ id: p.id, rareza: RAREZAS[p.rareza], pez: p });
        }
        if (!piscina.length) return { rareza: r, id: null, prioridad: 0, piscina: piscina };
        // `Roll()` coge uno de la lista que devuelve `ValidSimpleFishes`.
        const k = Math.floor(azar() * piscina.length) % piscina.length;
        const elegido = piscina[k];
        return { rareza: r, id: elegido.id, prioridad: 0,
                 especial: !!elegido.especial, pez: elegido.pez || null, piscina: piscina };
    }

    /**
     * `FishableItem.get_Priority()`.
     *
     * `fishablePriority` es un array y el método elige una entrada; cuál, no se ha
     * mirado. Veintiséis de las treinta traen una sola, así que se usa la primera y las
     * cuatro con dos quedan con la primera de las dos. Sin prioridad, cero: no gana nunca
     * en solitario y va directo a la piscina.
     */
    function prioridadDe(p) {
        const e = (p && p.prioridad && p.prioridad[0]) || null;
        return e ? (Number(e.priority) || 0) : 0;
    }

    let tabla = null;

    global.PlayFishing = {
        get tabla() { return tabla; },
        usarTabla(t) { tabla = t; return tabla; },
        candidatos: candidatos,
        pecesValidos: pecesValidos,
        tieneHorario: tieneHorario,
        finDe: finDe,
        aEstaHora: aEstaHora,
        HORAS_POR_RAREZA: HORAS_POR_RAREZA,
        elegir: elegir,
        prioridadDe: prioridadDe,
        get reglas() { return reglas; },
        cargar: cargar,
        usar: usar,
        tiempoDePicada: tiempoDePicada,
        empezar: empezar,
        avanzar: avanzar,
        sePuedeTirar: sePuedeTirar,
        tirar: tirar,
        rareza: rareza,
    };

    if (typeof document !== 'undefined' && document.addEventListener) {
        document.addEventListener('DOMContentLoaded', () => { cargar(); });
    }
})(typeof window !== 'undefined' ? window : globalThis);
