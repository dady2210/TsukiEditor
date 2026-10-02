/* dialogue_payloads.js — lo que LLEVAN los nodos especiales del diálogo.
 *
 * ────────────────────────────────────────────────────────────────────────────
 *  EL AGUJERO QUE TAPA
 * ────────────────────────────────────────────────────────────────────────────
 * `data/dialogues_compact.json` guarda el `typ` de los nodos especiales pero **no lo que
 * llevan dentro**. Un nodo de regalo salía así:
 *
 *     {"k": "c", "typ": "Dialogue Gift", "to": [8]}
 *
 * o sea: el juego sabe que ahí te regalan algo, y el port no sabía QUÉ. Por eso
 * `dialogue_manager._handleGiftNode` daba **50 zanahorias fijas a todo el mundo**: no era
 * lo que hace el juego, era lo único que se podía hacer sin el dato.
 *
 * `tools/cs_dialogue_payloads` lo saca de los assets. Son 331 nodos en 87 grafos:
 *
 *     DialogueGift     85   `giftItem` -> QUÉ te regalan (83 con objeto de verdad)
 *     EggConvo        159   `eggValue`, `maxEggValue`, `eggTimes`
 *     DialogueRequest  66   `requestedItems`, `accept`/`reject`, `acceptNode`/`rejectNode`
 *     ConvoAd          13   `carrotReward`, `success`/`fail`/`cheat`
 *     ParcelConvo       3   `correct`/`wrong`/`dismissed`
 *     SellConvo         2   `valuation`, `accept`/`reject`
 *     TextFieldNode     2   `playerString`
 *     DeedConvo         1   `endConvo`/`dismissed`   -> abre el `DeedPopup`
 *
 * ────────────────────────────────────────────────────────────────────────────
 *  COMO SE EMPAREJA UN NODO
 * ────────────────────────────────────────────────────────────────────────────
 * Por **(nombre del grafo, id del primer texto)**, y el índice dentro del grafo.
 *
 * El nombre solo NO vale: hay grafos que se llaman igual —hasta diecisiete «Teresa»—, y
 * emparejarlos a ojo le pondría a un grafo el regalo de otro. El id del primer bloque de
 * texto (`ELFIE_0_LINE_0`) es único por grafo, y se puede calcular a los dos lados.
 *
 * Medido: de los **323** nodos especiales que hay en el compacto, casan **323**, en
 * **84 de 84** grafos, con **cero** claves ambiguas. Los 8 que sobran del volcado están en
 * grafos que el compacto no trae (`nox`, los de desarrollo).
 */
(function (global) {
    'use strict';

    let datos = null;      // el JSON tal cual
    let porClave = null;   // 'nombre|idPrimerTexto' -> grafo del volcado
    let porNombre = null;  // 'nombre' -> [grafos], para el respaldo cuando es único
    let cargando = null;

    /** El id del primer bloque de texto de un grafo. Es lo que desempata los homónimos. */
    function primerId(g) {
        for (const n of (g.n || g.nodos || [])) {
            for (const l of (n.l || [])) if (l && l.id) return l.id;
        }
        return null;
    }

    function indexar() {
        porClave = {};
        porNombre = {};
        for (const g of ((datos && datos.grafos) || [])) {
            const k = (g.nombre || '') + '|' + (g.id || '');
            if (!porClave[k]) porClave[k] = g;
            (porNombre[g.nombre] = porNombre[g.nombre] || []).push(g);
        }
    }

    function cargar() {
        if (datos) return Promise.resolve(true);
        if (cargando) return cargando;
        cargando = fetch('data/dialogue_payloads.json')
            .then(r => (r.ok ? r.json() : null))
            .then(j => {
                datos = j || { grafos: [] };
                indexar();
                return !!j;
            })
            .catch(() => { datos = { grafos: [] }; indexar(); return false; });
        return cargando;
    }

    /** El grafo del volcado que corresponde a uno del compacto, o null. */
    function grafoDe(gc) {
        if (!gc || !porClave) return null;
        const hit = porClave[(gc.g || '') + '|' + (primerId(gc) || '')];
        if (hit) return hit;
        // Respaldo: por nombre, y SOLO si no hay dos que se llamen igual. Si los hay, se
        // devuelve null: mejor sin dato que con el dato de otro.
        const l = porNombre && porNombre[gc.g];
        return (l && l.length === 1) ? l[0] : null;
    }

    /**
     * La carga útil del nodo `i` del grafo `gc` (el objeto del compacto), o null.
     * Devuelve `{clase, campos}` tal cual está en el volcado.
     */
    function de(gc, i) {
        const g = grafoDe(gc);
        if (!g) return null;
        for (const n of (g.nodos || [])) if (n.i === i) return n;
        return null;
    }

    /** El objeto que regala un `DialogueGift`, o null si ese nodo no regala nada. */
    function regaloDe(gc, i) {
        const n = de(gc, i);
        if (!n || n.clase !== 'DialogueGift') return null;
        const it = n.campos && n.campos.giftItem;
        if (!it || !(Number(it.ID) > 0)) return null;
        return {
            id: Number(it.ID),
            cantidad: Number(it.quantity) || 1,
            // `BaseInventory.InvType`: 0 objetos, 1 muebles. 46 de los 83 regalos son
            // objetos y 37 son muebles, asi que esto no es un detalle.
            invType: Number(it.invType) || 0,
        };
    }

    // ── Los textos ──────────────────────────────────────────────

    /**
     * Un `StringT` en el idioma que toca. El volcado trae los quince, y el port maneja
     * dos: `sp` y `en`. Si el que se pide esta vacio se cae al otro, que es lo que hace
     * `dialogue_manager._textOf` con las lineas normales.
     */
    function texto(st, idioma) {
        if (!st) return '';
        const sp = st.SP || '';
        const en = st.EN || '';
        return (idioma === 'sp') ? (sp || en) : (en || sp);
    }

    /** Un `ConvoLine`: el texto vive dentro, en `line.text`. */
    function lineaTexto(linea, idioma) {
        return texto(linea && linea.text, idioma);
    }

    // ── Una por clase ──────────────────────────────────────────

    /**
     * `DialogueRequest`: el vecino PIDE objetos.
     *
     * `requestedItems` es un `ItemInventorySlot[]` — 65 de los 66 piden UNO solo, y uno
     * pide dos —, y `accept` / `reject` son las dos respuestas. Los 66 traen texto de
     * aceptar; solo **siete** traen el de rechazar, asi que el resto usa uno generico.
     *
     * `acceptNode` y `rejectNode` son indices de PUERTO, no de nodo, y valen **0 en los
     * 66**: las dos salidas van al mismo sitio. El destino de verdad es el `to` del
     * compacto, y 46 de los 66 tienen exactamente una salida; los otros 20 acaban ahi.
     */
    function pedidoDe(gc, i) {
        const n = de(gc, i);
        if (!n || n.clase !== 'DialogueRequest') return null;
        const c = n.campos || {};
        const objetos = (c.requestedItems || [])
            .map(x => ({ id: Number(x.ID) || 0,
                         cantidad: Number(x.quantity) || 1,
                         invType: Number(x.invType) || 0 }))
            .filter(x => x.id > 0);
        if (!objetos.length) return null;
        return { objetos, aceptar: c.accept || null, rechazar: c.reject || null };
    }

    /**
     * `ConvoAd`: el anuncio que paga.
     *
     * `carrotReward` son 800 en nueve, 1200 en tres (Camille, CamilleStrained,
     * ChameleonWater) y 10 en uno (DraperRamen). `success` / `fail` / `cheat` son indices
     * de puerto y valen 0 en los trece: doce nodos no tienen ninguna salida y el anuncio
     * acaba la charla.
     */
    function anuncioDe(gc, i) {
        const n = de(gc, i);
        if (!n || n.clase !== 'ConvoAd') return null;
        const c = n.campos || {};
        return { zanahorias: Number(c.carrotReward) || 0 };
    }

    /**
     * `SellConvo`: vender al vecino.
     *
     * `valuation` lleva el `{0}` del importe — «I can pay {0} carrots for that» — y
     * `accept` / `reject` son las dos respuestas. Los dos nodos que hay —Yori y Elfie—
     * tienen DOS salidas, o sea que aqui si se ramifica.
     */
    function ventaDe(gc, i) {
        const n = de(gc, i);
        if (!n || n.clase !== 'SellConvo') return null;
        const c = n.campos || {};
        return { tasacion: c.valuation || null, aceptar: c.accept || null,
                 rechazar: c.reject || null };
    }

    /** `ParcelConvo`: entregar un paquete. Tres lineas: acierto, error y dejarlo. */
    function paqueteDe(gc, i) {
        const n = de(gc, i);
        if (!n || n.clase !== 'ParcelConvo') return null;
        const c = n.campos || {};
        return { correcto: c.correct || null, erroneo: c.wrong || null,
                 dejado: c.dismissed || null };
    }

    /**
     * `TextFieldNode`: escribir un nombre.
     *
     * `playerString` es la clave dentro de `TsukiSave.PlayerStrings`
     * (`Dictionary<int, string>`). Los dos que hay estan en «Bobo Gecko Intro» y los dos
     * usan la clave **0**: es el nombre que se le pone al geco.
     */
    function campoTextoDe(gc, i) {
        const n = de(gc, i);
        if (!n || n.clase !== 'TextFieldNode') return null;
        return { clave: Number((n.campos || {}).playerString) || 0 };
    }

    /**
     * `EggConvo`: la pista de la busqueda de huevos.
     *
     * NO es una accion: es una PUERTA. La linea solo se dice si se cumple la comprobacion,
     * y por eso 153 de las 154 no tienen ninguna salida — son una frase suelta —.
     *
     *     DistanceCheck   Unspecified 0 / Close 1 / Far 2    a que distancia esta el huevo
     *     eggTimes        None 0 / MoreOrEqual 1 / Equal 2 / LessThan 3 / Range 4
     *     eggValue        el operando; `maxEggValue` es 0 en LAS 159
     *
     * O sea `CheckEgg(distancia, huevos)`: la frase encaja si la distancia coincide y el
     * numero de huevos cumple la comparacion.
     */
    function huevoDe(gc, i) {
        const n = de(gc, i);
        if (!n || n.clase !== 'EggConvo') return null;
        const c = n.campos || {};
        return {
            distancia: Number(c.DistanceCheck) || 0,
            comparacion: Number(c.eggTimes) || 0,
            valor: Number(c.eggValue) || 0,
            maximo: Number(c.maxEggValue) || 0,
        };
    }

    /** `CheckEgg`: ¿encaja esta pista con la distancia y los huevos que se llevan? */
    function encajaHuevo(h, distancia, huevos) {
        if (!h) return false;
        if (h.distancia !== 0 && Number(distancia) !== h.distancia) return false;
        const v = Number(huevos) || 0;
        switch (h.comparacion) {
            case 0: return true;                       // None
            case 1: return v >= h.valor;               // MoreOrEqual
            case 2: return v === h.valor;              // Equal
            case 3: return v < h.valor;                // LessThan
            case 4: return v >= h.valor && v <= h.maximo;   // Range
            default: return true;
        }
    }

    /** La clase de un nodo, por (grafo, indice). `null` si no es de las especiales. */
    function claseDe(gc, i) {
        const n = de(gc, i);
        return n ? n.clase : null;
    }

    global.DialoguePayloads = {
        cargar, de, regaloDe, grafoDe, primerId, claseDe,
        texto, lineaTexto,
        pedidoDe, anuncioDe, ventaDe, paqueteDe, campoTextoDe,
        huevoDe, encajaHuevo,
        get cargado() { return !!datos; },
        get cuenta() { return ((datos && datos.cuenta) || {}); },
    };

    if (typeof document !== 'undefined') cargar();
})(typeof window !== 'undefined' ? window : globalThis);
