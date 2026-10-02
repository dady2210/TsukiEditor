// seeded_random.js — el sorteo con semilla del juego, bit a bit.
//
// POR QUÉ ESTÁ SUELTO
// -------------------
// Medio Tsuki Odyssey sortea cosas de forma DETERMINISTA a partir del día: el clima, los
// objetos que aparecen hoy en cada mapa, el género de las tiendas... Todo eso pasa por el
// mismo par de primitivas, así que viven aquí y no dentro de un sistema concreto.
//
// Vino de `weather_system.js`, que era quien lo tenía. Ver LOGICAS_PENDIENTES.md §1.
//
// QUÉ HACE EL JUEGO, COMPROBADO CONTRA EL BINARIO
// -----------------------------------------------
// `Castle.CastleExtensions.Shuffle<T>(IList<T>, bool seeded, int seed)` —instancia
// `Shuffle<int>` en RVA 0x3484164 del libil2cpp.so de 121.768.224 bytes— es un
// **Fisher–Yates descendente** sobre `System.Random`:
//
//     si seeded -> rnd = new System.Random(seed)   // 0x559A7A0
//     si no     -> rnd = new System.Random()       // 0x559A578
//     n = list.Count
//     si n < 2: devolver la lista tal cual
//     mientras n >= 2:
//         j = rnd.Next(n)        // Next(int maxValue), ranura 0x1A8 de la vtable
//         intercambiar list[n-1] y list[j]
//         n = n - 1
//
// En toda la función NO hay ni una llamada a `OrderBy` ni a nada de LINQ. Esto importa:
// antes se implementaba como `OrderBy(_ => rng.Next())` (orden estable por clave), y eso
// consume un número distinto de valores del generador y da OTRA permutación con la misma
// semilla. `ShuffleArray<int>` (0x3485030) es idéntico salvo que copia el array antes.
//
// Se puede releer con:  python tools/dis_addr.py 0x3484164 200

(function (global) {
    'use strict';

    /**
     * El `System.Random` de Mono, que es el que usa IL2CPP. Generador sustractivo de
     * Knuth; hay que copiarlo tal cual porque el juego siembra con el día y espera esta
     * secuencia exacta, no «un aleatorio cualquiera».
     */
    function RandomNet(semilla) {
        const MBIG = 2147483647, MSEED = 161803398;
        const tabla = new Int32Array(56);
        let inext = 0, inextp = 21;

        // `Math.abs(-2147483648)` se sale del int32, y .NET trata ese caso aparte.
        const resta = (semilla === -2147483648) ? MBIG : Math.abs(semilla | 0);
        let mj = MSEED - resta;
        tabla[55] = mj;
        let mk = 1;
        for (let i = 1; i < 55; i++) {
            const ii = (21 * i) % 55;
            tabla[ii] = mk;
            mk = mj - mk;
            if (mk < 0) mk += MBIG;
            mj = tabla[ii];
        }
        for (let k = 1; k < 5; k++) {
            for (let i = 1; i < 56; i++) {
                tabla[i] -= tabla[1 + ((i + 30) % 55)];
                if (tabla[i] < 0) tabla[i] += MBIG;
            }
        }

        function muestra() {
            let li = inext, lp = inextp;
            if (++li >= 56) li = 1;
            if (++lp >= 56) lp = 1;
            let r = tabla[li] - tabla[lp];
            if (r === MBIG) r--;
            if (r < 0) r += MBIG;
            tabla[li] = r;
            inext = li; inextp = lp;
            return r;
        }

        this.next = () => muestra();
        this.nextDouble = () => muestra() * (1.0 / MBIG);
        // Next(max) de .NET es (int)(Sample() * max), NO un módulo: el módulo sesga.
        this.nextMax = (max) => Math.floor(muestra() * (1.0 / MBIG) * max);
    }

    /** Un generador sembrado con `semilla`. */
    function crear(semilla) {
        return new RandomNet(semilla);
    }

    /**
     * `CastleExtensions.Shuffle`: Fisher–Yates descendente, EN EL SITIO.
     * Devuelve la misma lista, como el original.
     */
    function barajar(lista, rng) {
        if (!lista || lista.length < 2) return lista;
        for (let n = lista.length; n >= 2; n--) {
            const j = rng.nextMax(n);
            const t = lista[n - 1];
            lista[n - 1] = lista[j];
            lista[j] = t;
        }
        return lista;
    }

    /** `CastleExtensions.ShuffleArray`: igual, pero sobre una copia. */
    function barajarCopia(lista, rng) {
        return barajar(Array.prototype.slice.call(lista), rng);
    }

    /** Atajo: baraja una copia con un generador recién sembrado. */
    function barajarConSemilla(lista, semilla) {
        return barajarCopia(lista, crear(semilla));
    }

    /**
     * `Enumerable.Range(0, n)` barajado, que es el patrón con el que el juego elige «k de
     * entre n» (las horas de temporal del día, por ejemplo).
     */
    function rangoBarajado(n, rng) {
        const a = new Array(n);
        for (let i = 0; i < n; i++) a[i] = i;
        return barajar(a, rng);
    }

    const API = { RandomNet, crear, barajar, barajarCopia, barajarConSemilla, rangoBarajado };

    global.SeededRandom = API;
    if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : globalThis);
