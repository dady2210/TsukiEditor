// train_system.js — el tren: que pare, que se pueda abordar, y el viaje a la ciudad.
//
// ── Por que este fichero fuerza la logica ────────────────────────────────────
//
// En la build original el tren esta APAGADO. Verificado desensamblando el ELF
// (ver CSAVE/tsuki_logica/09_tren_RESUELTO.md):
//
//   Train.get_TrainsInactive  @RVA 0x5849530  ->  `mov w0,#1 ; ret`   = true
//   Train.GetStatus solo devuelve NotAtStation(0) o FlyBy(4). Nunca Waiting(2).
//   EnterTrain.Visible => GetStatus(...) == Waiting  ->  nunca visible.
//   Save.TripSafetyChecks: si TrainsInactive, pone `location = 0` y `trip = null`.
//
// O sea: el tren pasa de largo en el segundo 55 del minuto 9 de cada decena y no
// para jamas, y el juego borra el viaje al cargar. Por eso los saves de prueba dan
// `location = 0` y `trip = null` incluso el guardado en la ciudad.
//
// El parche del binario hacia dos cosas: `get_TrainsInactive -> false` (trenes
// activos, el viaje se conserva) y `GetStatus -> Waiting, progress 0.5` (parado
// siempre, se puede abordar cuando sea). Aqui se reproduce ese comportamiento,
// pero con un ciclo de verdad en vez de una constante, porque la constante no
// anima nada.
//
// ── El reloj ────────────────────────────────────────────────────────────────
//
// `GetStatus` del juego se mueve con `time.TimeOfDay.TotalMinutes` y saca
// `trainNumber = min / 10`: un servicio cada diez minutos. Eso se respeta tal cual.
// El reloj del editor no tiene segundos (`getClock()` da hora y minuto), asi que
// el ciclo va a minutos y los segundos solo suavizan la barra de progreso.
//
// ── Pasar de largo vs. parar ────────────────────────────────────────────────
//
// `TrainAtStation.ObjectUpdate` (RVA 0x5849FD8) mueve el tren cada frame y deja ver
// que son DOS recorridos distintos:
//
//   Arriving(1)  transform.position = Lerp(startPosition, waitPosition, arriveCurve(p))
//   Waiting(2)   transform.position = waitPosition                       <- parado
//   Leaving(3)   transform.position = Lerp(waitPosition, endPosition, leaveCurve(p))
//   FlyBy(4)     transform.position = Lerp(startPosition, endPosition, p) <- NO para
//   NotAtStation transform.position = endPosition                        <- fuera
//
// O sea: pasar de largo es la MISMA via pero saltandose `waitPosition`, y en linea
// recta (sin curva de aceleracion). Eso es lo que se ve en el juego.
//
// El horario mixto —unos servicios paran y otros pasan— NO existe en el binario:
// ahi `GetStatus` siempre da FlyBy. Es una regla del editor: `paradaCada`.
//
// ── Sobre el arte ───────────────────────────────────────────────────────────
//
// El vagon esta horneado en `level9_Ensamblado.png` (118 piezas de tren en el
// `layout.json` de level9), y `map.js` dibuja ese PNG como fondo. Asi que el estado
// se calcula y se enseña, pero para VER el tren desplazarse hay que rehornear el
// nivel sin el y pintar las piezas aparte. La direccion de la via ya esta: el juego
// define `TrainEnvironmentManager.DirMag = 1.118034`, que es |(1, 0.5)| — la
// diagonal isometrica, y cuadra con la nube de piezas del layout (pendiente 0.488).

(function () {
    'use strict';

    // Los dos enums del juego, tal cual (dump.cs, TypeDefIndex 5191 y 5192).
    const ESTADO = { NotAtStation: 0, Arriving: 1, Waiting: 2, Leaving: 3, FlyBy: 4 };
    const FASE = {
        OnTheWay: 0, ArrivingAtDeparture: 1, WaitingAtDeparture: 2, LeavingDeparture: 3,
        InMotion: 4, ArrivingAtDestination: 5, ArrivedAtDestination: 6,
        LeavingDestination: 7, Left: 8,
    };
    const NOMBRE_ESTADO = {
        0: 'no está en la estación', 1: 'llegando', 2: 'parado',
        3: 'saliendo', 4: 'pasando de largo',
    };

    // `Location` del save: la zona gruesa.
    const ZONA = { ALDEA: 0, TREN: 1, CIUDAD: 2 };

    // Las dos estaciones y el interior del vagon, por sublocacion.
    const EST_ALDEA = 10;    // map_10, Exportado_level9
    const EST_CIUDAD = 15;   // map_15, Exportado_level52
    const VAGON = 14;        // map_14, Exportado_level48
    const ESTACIONES = { [EST_ALDEA]: ZONA.ALDEA, [EST_CIUDAD]: ZONA.CIUDAD };

    // Reparto del servicio de 10 minutos cuando el tren PARA. Suma 10.
    //
    // Sale de `TrainAtStation.ObjectUpdate`, que es quien mueve el tren cada frame:
    // Arriving interpola startPosition -> waitPosition, Waiting lo deja en
    // waitPosition, Leaving va waitPosition -> endPosition y NotAtStation lo aparca
    // en endPosition, fuera de cuadro.
    const CICLO = [
        { hasta: 2,  estado: ESTADO.Arriving },     // minutos 0-1: entra
        { hasta: 8,  estado: ESTADO.Waiting },      // minutos 2-7: parado, se aborda
        { hasta: 9,  estado: ESTADO.Leaving },      // minuto 8: sale
        { hasta: 10, estado: ESTADO.NotAtStation }, // minuto 9: ya no esta
    ];

    // ── LA VIA, QUE AHORA ES DATO Y NO SUPOSICION ───────────────────────────
    //
    // Las posiciones y las curvas de `TrainAtStation` son campos serializados de la
    // ESCENA, no del binario, y este fichero las aproximaba diciendolo: `T_ESPERA = 0.5`
    // ("waitPosition cae a media via") y un ease-out / ease-in en vez de las curvas.
    // `tools/cs_train_track` las saca de level9 y level52, y resulta que:
    //
    //   · La parada NO esta a media via. En la aldea cae en t = 0,35528 y en la ciudad
    //     en t = 0,48233. O sea que el tren entra mas rapido de lo que sale en la aldea,
    //     justo al contrario de lo que hacia el reparto simetrico.
    //   · La pendiente de la via sale 0,5015 y 0,5 clavado: es la diagonal isometrica
    //     (1, 0.5), lo que confirma la `DirMag = 1.118034` por geometria y no solo por
    //     la constante.
    //   · `tracksVolumeCurve` pica en t = 0,8, no en el medio. El triangulo simetrico
    //     que habia aqui subia y bajaba a destiempo.
    //   · Las dos curvas son Hermite de dos claves, y las tangentes confirman la forma
    //     que se habia supuesto: entrada (0,0) con pendiente 2 -> (1,1) con -0,222 es un
    //     ease-out, y salida (0,0) con -0,181 -> (1,1) con 1,754 es un ease-in. La forma
    //     estaba bien; los numeros, aproximados.
    const PISTA_RESPALDO = {
        10: {   // level9, la estacion de la aldea
            tParada: 0.35528, largo: 44.73704, pendiente: 0.5015, puertaSegundos: 0.005,
            curvaEntrada: [{ t: 0, v: 0, sale: 2 }, { t: 1, v: 1, entra: -0.22198 }],
            curvaSalida: [{ t: 0, v: 0, sale: -0.18113 }, { t: 1, v: 1, entra: 1.75371 }],
            curvaVolumenVia: [{ t: 0, v: 0, sale: 1.25 }, { t: 0.8, v: 1, entra: 0, sale: 0 },
                              { t: 1, v: 0, entra: -5 }],
        },
        15: {   // level52, la estacion de la ciudad
            tParada: 0.48233, largo: 36.21871, pendiente: 0.5, puertaSegundos: 0.005,
            curvaEntrada: [{ t: 0, v: 0, sale: 2 }, { t: 1, v: 1, entra: -0.22198 }],
            curvaSalida: [{ t: 0, v: 0, sale: -0.18113 }, { t: 1, v: 1, entra: 1.75371 }],
            curvaVolumenVia: [{ t: 0, v: 0, sale: 1.25 }, { t: 0.8, v: 1, entra: 0, sale: 0 },
                              { t: 1, v: 0, entra: -5 }],
        },
    };
    const NIVEL_A_SUBLOC = { level9: 10, level52: 15 };

    let pista = PISTA_RESPALDO;

    /** Mete la via leida de las escenas. La usan `cargarPista()` y las pruebas. */
    function usarPista(doc) {
        if (!doc || !Array.isArray(doc.estaciones)) return pista;
        const nueva = {};
        for (const e of doc.estaciones) {
            const sub = NIVEL_A_SUBLOC[e.nivel];
            if (sub === undefined) continue;
            nueva[sub] = {
                tParada: e.tParada, largo: e.largo, pendiente: e.pendiente,
                puertaSegundos: e.puertaSegundos,
                curvaEntrada: e.curvaEntrada && e.curvaEntrada.claves,
                curvaSalida: e.curvaSalida && e.curvaSalida.claves,
                curvaVolumenVia: e.curvaVolumenVia && e.curvaVolumenVia.claves,
            };
        }
        if (Object.keys(nueva).length) pista = nueva;
        return pista;
    }

    /**
     * Una `AnimationCurve` de Unity, evaluada como la evalua Unity: Hermite cubica
     * entre claves, con las tangentes escaladas por el ancho del tramo.
     */
    function curva(claves, t) {
        if (!Array.isArray(claves) || !claves.length) return t;
        if (t <= claves[0].t) return claves[0].v;
        const ult = claves[claves.length - 1];
        if (t >= ult.t) return ult.v;
        for (let i = 0; i < claves.length - 1; i++) {
            const a = claves[i], b = claves[i + 1];
            if (t > b.t) continue;
            const dt = b.t - a.t;
            if (dt <= 0) return b.v;
            const s = (t - a.t) / dt;
            const m0 = (a.sale != null ? a.sale : 0) * dt;
            const m1 = (b.entra != null ? b.entra : 0) * dt;
            const s2 = s * s, s3 = s2 * s;
            return (2 * s3 - 3 * s2 + 1) * a.v + (s3 - 2 * s2 + s) * m0
                 + (-2 * s3 + 3 * s2) * b.v + (s3 - s2) * m1;
        }
        return ult.v;
    }

    // Cada cuantos servicios para el tren. Los demas PASAN DE LARGO.
    // No sale del binario: ahi no existe un horario mixto (ver el comentario de
    // arriba). Es la regla del editor, y se toca desde `window.Train.paradaCada`.
    let paradaCada = 2;

    let modo = 'auto';   // 'auto' | 'siempre' | 'original'

    // ── utilidades del AST ──────────────────────────────────────────────────

    function recorrer(n, fn) {
        if (!n || typeof n !== 'object') return;
        fn(n);
        for (const c of (n.children || [])) recorrer(c, fn);
        for (const e of (n.elements || [])) {
            if (e && e.key) recorrer(e.key, fn);
            if (e && e.value) recorrer(e.value, fn);
        }
    }

    /** Un typeId y un nodeId que no use nadie, para no pisar la tabla de tipos. */
    function idsLibres(ast) {
        let maxTipo = 0, maxNodo = 0;
        recorrer(ast, n => {
            if (typeof n.typeId === 'number' && n.typeId > maxTipo) maxTipo = n.typeId;
            if (typeof n.nodeId === 'number' && n.nodeId > maxNodo) maxNodo = n.nodeId;
        });
        return { typeId: maxTipo + 1, nodeId: maxNodo + 1 };
    }

    // ── el reloj ────────────────────────────────────────────────────────────

    /**
     * El reloj del editor. La fuente buena es `GameTime.now()`, que es la que usan
     * `map.js` y `app.js`: cae a la hora del dispositivo cuando la partida no trae
     * la variable `hour` —y hay saves que no la traen, con lo que `getClock().hour`
     * se queda clavado en 0 y el tren iria a otra hora que el resto de la interfaz.
     */
    function reloj() {
        if (window.GameTime && typeof window.GameTime.now === 'function') {
            try { return window.GameTime.now(); } catch (e) { /* sin partida */ }
        }
        const p = API.parser;
        if (!p || typeof p.getClock !== 'function') return null;
        try { return p.getClock(); } catch (e) { return null; }
    }

    /** Minuto del dia segun el reloj: lo que el juego llama TimeOfDay.TotalMinutes. */
    function minutoDelDia() {
        const c = reloj();
        if (!c) return null;
        if (typeof c.minutes === 'number') return c.minutes | 0;
        return ((c.hour | 0) * 60 + (c.minute | 0));
    }

    /**
     * El dia OA (dias desde 1899-12-30). `getClock().day` ya viene en dias OA
     * —no es el dia del mes—, igual que lo usa `activity_scheduler.js`.
     * Si el save trae algo que no lo parece, se cae al dia de hoy.
     */
    function diaOA() {
        const c = reloj();
        const d = c ? Math.floor(Number(c.day)) : NaN;
        if (isFinite(d) && d > 40000 && d < 80000) return d;
        return Math.floor(Date.now() / 86400000 + 25569);
    }

    // Los segundos no estan en la partida; solo suavizan la barra.
    function segundosReales() { return (Date.now() / 1000) % 60; }

    // ── la maquina de estados ───────────────────────────────────────────────

    const API = {
        ESTADO, FASE, ZONA,
        EST_ALDEA, EST_CIUDAD, VAGON,

        get parser() { return window.app && window.app.parser; },

        get modo() { return modo; },
        set modo(m) { if (m === 'auto' || m === 'siempre' || m === 'original') modo = m; },

        get paradaCada() { return paradaCada; },
        set paradaCada(n) { const v = Math.max(1, Math.trunc(Number(n)) || 1); paradaCada = v; },

        /** ¿Este servicio para en la estación, o pasa de largo? */
        paraEsteServicio(trainNumber) {
            if (modo === 'siempre') return true;
            if (modo === 'original') return false;
            return (Number(trainNumber) % paradaCada) === 0;
        },

        nombreEstado(s) { return NOMBRE_ESTADO[s] != null ? NOMBRE_ESTADO[s] : ('estado ' + s); },

        /**
         * `Train.GetStatus`. Devuelve {status, progress, trainNumber}.
         *
         * En modo 'original' es la funcion decompilada, letra por letra:
         *
         *     int min = (int)t.TimeOfDay.TotalMinutes;
         *     trainNumber = min / 10;
         *     if (Tutorial.TutorialInProgress) return NotAtStation;
         *     if (min % 10 == 9 && t.TimeOfDay.Seconds > 54) {
         *         progress = (float)(t.TimeOfDay.TotalSeconds % 5.0 / 5.0);
         *         return FlyBy;
         *     }
         *     return NotAtStation;
         */
        estado() {
            const min = minutoDelDia();
            if (min == null) return null;
            const trainNumber = Math.floor(min / 10);   // un servicio cada 10 min
            const s = segundosReales();

            if (modo === 'siempre') {
                // El parche del binario, exacto: parado, progreso 0.5.
                return { status: ESTADO.Waiting, progress: 0.5, trainNumber, min, para: true };
            }

            // Los servicios que NO paran solo se dejan ver en la ventana original:
            // minuto 9 de la decena y segundos 55..59, con progress = (seg % 5)/5.
            if (!this.paraEsteServicio(trainNumber)) {
                if (min % 10 === 9 && s > 54) {
                    const total = min * 60 + s;
                    return { status: ESTADO.FlyBy, progress: (total % 5) / 5,
                             trainNumber, min, para: false };
                }
                return { status: ESTADO.NotAtStation, progress: 0, trainNumber, min, para: false };
            }

            // Servicio que para: el ciclo completo sobre los mismos 10 minutos.
            const r = min % 10;
            let desde = 0;
            for (const tramo of CICLO) {
                if (r < tramo.hasta) {
                    const largo = tramo.hasta - desde;
                    const dentro = (r - desde) + s / 60;
                    return {
                        status: tramo.estado,
                        progress: Math.min(1, Math.max(0, dentro / largo)),
                        trainNumber, min, para: true,
                    };
                }
                desde = tramo.hasta;
            }
            return { status: ESTADO.Waiting, progress: 0, trainNumber, min, para: true };
        },

        /**
         * Donde esta el tren sobre la via, y como suena.
         *
         * Devuelve `t` en 0..1 a lo largo del recorrido completo start -> end, mas el
         * tramo en el que va. Es lo que hace falta para dibujarlo: la via es la
         * diagonal isometrica (1, 0.5) / 1.118034, la `DirMag` del juego.
         *
         * Las curvas `arriveCurve` y `leaveCurve` y las tres posiciones son campos
         * serializados de la ESCENA, no del binario. Los saca `tools/cs_train_track` de
         * level9 y level52, y estan en `data/train_track.json`; antes se aproximaban
         * con un ease-out, un ease-in y `waitPosition` a media via, que resulta que
         * cae en 0,35528 (aldea) y 0,48233 (ciudad).
         *
         * El pan y el pitch si salen tal cual del ELF, y estan cotejados instruccion a
         * instruccion en `TrainAtStation::ObjectUpdate`:
         *   llegando: `ldr s0, [0x11dfaa0] = -0.4` ; `fmul` ; `fadd` con 1.0
         *             pitch = p*(-0.4) + 1.0   -> de 1.0 baja a 0.6  (frena)
         *   saliendo: `ldr s0, [0x11dfb98] = 0.4` ; `fadd` con `[0x11df99c] = 0.6`
         *             pitch = p*( 0.4) + 0.6   -> de 0.6 sube a 1.0  (acelera)
         *   y el pan es `fsub s0, 1.0, p` al entrar y `fsub s0, 0.0, p` al salir, con
         *   el mismo doble `fcsel` que hace de clamp01.
         *
         * @param subloc estacion, para coger su reparto de via. Por defecto, la aldea.
         */
        posicion(subloc) {
            const e = this.estado();
            if (!e) return null;
            const p = e.progress;
            const clamp01 = v => Math.min(1, Math.max(0, v));
            const via = pista[Number(subloc)] || pista[EST_ALDEA] || {};
            // Donde cae `waitPosition` sobre la via, medido en la escena.
            const T_ESPERA = typeof via.tParada === 'number' ? via.tParada : 0.5;

            switch (e.status) {
                case ESTADO.Arriving: {
                    const c = curva(via.curvaEntrada, clamp01(p));
                    return { status: e.status, t: c * T_ESPERA, tramo: 'entrando',
                             pan: 1 - clamp01(p), pitch: clamp01(p) * -0.4 + 1.0, volumen: p };
                }
                case ESTADO.Waiting:
                    return { status: e.status, t: T_ESPERA, tramo: 'parado',
                             pan: 0, pitch: 0.6, volumen: 0 };
                case ESTADO.Leaving: {
                    const c = curva(via.curvaSalida, clamp01(p));
                    return { status: e.status, t: T_ESPERA + c * (1 - T_ESPERA), tramo: 'saliendo',
                             pan: -clamp01(p), pitch: clamp01(p) * 0.4 + 0.6, volumen: 1 - p };
                }
                case ESTADO.FlyBy: {
                    // Lineal y sin parar: Lerp(startPosition, endPosition, progress).
                    // El volumen es `tracksVolumeCurve`, que pica en 0,8: antes habia un
                    // triangulo simetrico que subia y bajaba a destiempo.
                    const f = clamp01(p - Math.floor(p));
                    return { status: e.status, t: p, tramo: 'de largo',
                             pan: 1 - 2 * clamp01(p), pitch: 1.0,
                             volumen: clamp01(curva(via.curvaVolumenVia, f)) };
                }
                default:
                    return { status: e.status, t: 1, tramo: 'fuera',
                             pan: 0, pitch: 0, volumen: 0 };
            }
        },

        /** La via de esa estacion, tal como salio de la escena. */
        via(subloc) { return pista[Number(subloc)] || null; },

        /** Evalua una AnimationCurve de la escena como la evalua Unity. */
        curva(claves, t) { return curva(claves, t); },

        /** Para las pruebas, que no tienen `fetch`. */
        usarPista(doc) { return usarPista(doc); },

        /** La via de las escenas, de `data/train_track.json`. */
        async cargarPista() {
            try {
                const r = await fetch('data/train_track.json');
                if (!r.ok) return false;
                usarPista(await r.json());
                return true;
            } catch (e) { return false; }
        },

        /** ¿Se puede subir ahora mismo? Es la condicion de `EnterTrain.Visible`. */
        sePuedeAbordar() {
            const e = this.estado();
            return !!e && e.status === ESTADO.Waiting;
        },

        /**
         * `Train.GetPhase(trainDay, trainNumber)`, portada tal cual del binario:
         *
         *     DateTime salida = DateTime.FromOADate(trainDay)
         *                     + TimeSpan.FromMinutes(trainNumber * 10);
         *     TimeSpan d = CastleTime.Now - salida;
         *     if (salida > CastleTime.Now)
         *         return d > -TimeSpan.FromSeconds(10) ? ArrivingAtDeparture : OnTheWay;
         *     if (d < TimeSpan.FromMinutes(5))                            return WaitingAtDeparture;
         *     if (d < TimeSpan.FromMinutes(5) + TimeSpan.FromSeconds(10)) return LeavingDeparture;
         *     return InMotion;
         */
        fase(trainDay, trainNumber) {
            const c = reloj();
            if (!c) return null;
            const ahoraMin = (diaOA() * 1440) + (c.hour | 0) * 60 + (c.minute | 0);
            const salidaMin = (Number(trainDay) * 1440) + Number(trainNumber) * 10;
            const d = ahoraMin - salidaMin;              // en minutos
            if (salidaMin > ahoraMin) {
                return d > -(10 / 60) ? FASE.ArrivingAtDeparture : FASE.OnTheWay;
            }
            if (d < 5) return FASE.WaitingAtDeparture;
            if (d < 5 + 10 / 60) return FASE.LeavingDeparture;
            return FASE.InMotion;
        },

        /**
         * Minutos que faltan para que el tren vuelva a estar PARADO.
         *
         * Ahora hay que saltarse los servicios que pasan de largo, asi que se barre
         * hacia delante hasta dar con una ventana de parada de verdad.
         */
        minutosAlProximo() {
            if (modo === 'siempre') return 0;
            if (modo === 'original') return null;      // no para nunca
            const min = minutoDelDia();
            if (min == null) return null;
            const tope = 10 * paradaCada + 10;
            for (let i = 0; i < tope; i++) {
                const m = (min + i) % 1440;
                if (!this.paraEsteServicio(Math.floor(m / 10))) continue;
                const r = m % 10;
                if (r >= 2 && r < 8) return i;
            }
            return null;
        },

        /** Minutos que faltan para ver pasar un tren de largo (los que no paran). */
        minutosAlaPasada() {
            if (modo === 'siempre') return null;       // siempre parado, nunca pasa
            const min = minutoDelDia();
            if (min == null) return null;
            const tope = 10 * paradaCada + 10;
            for (let i = 0; i < tope; i++) {
                const m = (min + i) % 1440;
                if (this.paraEsteServicio(Math.floor(m / 10))) continue;
                if (m % 10 === 9) return i;
            }
            return null;
        },

        /** Adelanta el reloj de la partida hasta el proximo tren parado. */
        esperarAlTren() {
            const p = this.parser;
            const falta = this.minutosAlProximo();
            if (!p || falta == null) return { ok: false, motivo: 'sin partida cargada' };
            if (falta === 0) return { ok: true, avanzado: 0 };
            // Si la partida no tiene la variable `hour`, `setClock` no puede moverla;
            // da igual, porque el ciclo es de 10 minutos y 60 es multiplo de 10: al
            // dar la vuelta a la hora el resto `min % 10` se conserva igual.
            const c = reloj();
            let minuto = (c.minute | 0) + falta, hora = c.hour | 0;
            while (minuto >= 60) { minuto -= 60; hora += 1; }
            const dias = Math.floor(hora / 24);
            hora %= 24;
            p.setClock({ hour: hora, minute: minuto });
            if (dias && typeof p.setClock === 'function') p.setClock({ day: (c.day | 0) + dias });
            return { ok: true, avanzado: falta };
        },

        // ── el viaje ────────────────────────────────────────────────────────

        /** La zona en la que esta Tsuki: 0 aldea, 1 en el tren, 2 ciudad. */
        zona() {
            const p = this.parser;
            if (!p || typeof p.getLocation !== 'function') return null;
            const v = p.getLocation();
            return v == null ? null : Number(v);
        },

        /** Lee el nodo `trip`, o null si no hay viaje. */
        viaje() {
            const p = this.parser;
            if (!p || !p.ast) return null;
            const n = (p.ast.children || []).find(c => c.name === 'trip');
            if (!n || !n.children || !n.children.length) return null;
            const campo = k => {
                const c = n.children.find(x => x.name === k);
                return c ? c.value : undefined;
            };
            return {
                start: Number(campo('start')),
                end: Number(campo('end')),
                trainDay: Number(campo('trainDay')),
                trainNumber: Number(campo('trainNumber')),
                tripStarted: String(campo('tripStarted')) === 'true',
                tripEnded: String(campo('tripEnded')) === 'true',
                nodo: n,
            };
        },

        enViaje() {
            const v = this.viaje();
            return !!v && v.tripStarted && !v.tripEnded;
        },

        /**
         * Sube a Tsuki al tren y escribe el viaje en la partida.
         *
         * El nodo `Trip` se construye con la forma EXACTA que tiene en
         * `en_tren.csave`, que es un save real hecho a bordo:
         *
         *     trip <Trip, Odyssey>            marker 0x01
         *       start        int64  (0x1D)    Location de salida
         *       end          int64  (0x1D)    Location de destino
         *       trainDay     int32  (0x17)    dia OA
         *       trainNumber  int32  (0x17)
         *       tripStarted  bool   (0x2B)
         *       tripEnded    bool   (0x2B)
         *
         * El `typeId` es un indice de la tabla de tipos de CADA save, asi que no se
         * copia el del save de referencia: se coge uno libre. Igual con `nodeId`.
         */
        abordar(destino) {
            const p = this.parser;
            if (!p || !p.ast) return { ok: false, motivo: 'sin partida cargada' };
            if (this.enViaje()) return { ok: false, motivo: 'ya hay un viaje en curso' };
            const e = this.estado();
            if (!e) return { ok: false, motivo: 'sin reloj en la partida' };
            if (e.status !== ESTADO.Waiting) {
                return { ok: false, motivo: 'el tren no está parado (' + this.nombreEstado(e.status) + ')' };
            }

            const desde = this.zona() === ZONA.CIUDAD ? ZONA.CIUDAD : ZONA.ALDEA;
            const hasta = (destino != null) ? Number(destino)
                        : (desde === ZONA.ALDEA ? ZONA.CIUDAD : ZONA.ALDEA);
            if (hasta === desde) return { ok: false, motivo: 'ya estás en ese destino' };

            const hijos = p.ast.children || [];
            const i = hijos.findIndex(c => c.name === 'trip');
            const anterior = i !== -1 ? hijos[i] : null;
            // Se recuerda el marcador del hueco vacio para poder devolverlo tal cual
            // al terminar el viaje, y no dejar el save con otra forma.
            if (anterior && anterior.constructor.name === 'OdinNull') {
                this._marcaNull = anterior.marker;
            }

            const ids = idsLibres(p.ast);
            const nodo = new OdinNode(0x01, 'trip', ids.typeId, 'Trip, Odyssey', ids.nodeId);
            nodo.children = [
                new OdinPrimitive(0x1D, 'start', BigInt(desde)),
                new OdinPrimitive(0x1D, 'end', BigInt(hasta)),
                new OdinPrimitive(0x17, 'trainDay', diaOA()),
                new OdinPrimitive(0x17, 'trainNumber', e.trainNumber),
                new OdinPrimitive(0x2B, 'tripStarted', true),
                new OdinPrimitive(0x2B, 'tripEnded', false),
            ];
            if (i !== -1) hijos[i] = nodo; else hijos.push(nodo);

            if (typeof p.setLocation === 'function') p.setLocation(ZONA.TREN);
            this._irA(VAGON);
            return { ok: true, desde, hasta, trainNumber: e.trainNumber, trainDay: diaOA() };
        },

        /**
         * Termina el viaje: deja a Tsuki en el destino y vacia `trip`.
         *
         * Es lo que hace `Save.TripSafetyChecks` cuando `trip.TripEnded(out destino)`
         * da true: `trip = null` y `location = destino`.
         */
        llegar() {
            const p = this.parser;
            const v = this.viaje();
            if (!p || !p.ast) return { ok: false, motivo: 'sin partida cargada' };
            if (!v) return { ok: false, motivo: 'no hay viaje en curso' };

            if (typeof p.setLocation === 'function') p.setLocation(v.end);
            const hijos = p.ast.children || [];
            const i = hijos.findIndex(c => c.name === 'trip');
            if (i !== -1) hijos[i] = new OdinNull(this._marcaNull || 0x2D, 'trip');

            const estacion = (v.end === ZONA.CIUDAD) ? EST_CIUDAD : EST_ALDEA;
            this._irA(estacion);
            return { ok: true, zona: v.end, estacion };
        },

        /** Se baja antes de salir: deshace el viaje y lo devuelve al origen. */
        cancelar() {
            const p = this.parser;
            const v = this.viaje();
            if (!p || !p.ast) return { ok: false, motivo: 'sin partida cargada' };
            if (!v) return { ok: false, motivo: 'no hay viaje en curso' };
            if (typeof p.setLocation === 'function') p.setLocation(v.start);
            const hijos = p.ast.children || [];
            const i = hijos.findIndex(c => c.name === 'trip');
            if (i !== -1) hijos[i] = new OdinNull(this._marcaNull || 0x2D, 'trip');
            this._irA(v.start === ZONA.CIUDAD ? EST_CIUDAD : EST_ALDEA);
            return { ok: true, zona: v.start };
        },

        /** Mueve la vista por el selector, que es quien manda en el resto de la UI. */
        _irA(subloc) {
            const sel = document.getElementById('select-location');
            if (!sel) return false;
            const existe = Array.from(sel.options).some(o => String(o.value) === String(subloc));
            if (!existe) return false;
            sel.value = String(subloc);
            sel.dispatchEvent(new Event('change'));
            return true;
        },

        // ── las capas del dibujo ────────────────────────────────────────────

        /**
         * Las dos capas horneadas de una estacion, o null si ese mapa no las tiene.
         *
         * Las genera `tools/bake_train_layers.py`, que separa el tren del fondo:
         * el `_Ensamblado.png` original lo lleva dentro y asi no habia forma de moverlo.
         */
        capas(subloc) {
            const t = window.TrainLayers;
            return (t && t[String(subloc)]) || null;
        },

        /**
         * Cuanto hay que correr la capa del tren, en unidades de mundo.
         *
         * La via es la diagonal isometrica (1, 0.5) normalizada, que es exactamente la
         * constante `TrainEnvironmentManager.DirMag = 1.118034` del juego, y que las
         * escenas confirman: la pendiente de la via sale 0,5015 en level9 y 0,5 clavado
         * en level52.
         *
         * El recorrido total sigue saliendo del horneado, que es lo que esta calibrado
         * contra el PNG. Lo que ya no se supone es DONDE cae la parada: se resta
         * `tParada` —0,35528 en la aldea, 0,48233 en la ciudad—, no 0.5. Con el tren
         * parado `q.t === tParada`, asi que `d` queda en `c.parada` clavado y la
         * calibracion a mano no se mueve; lo que cambia es el barrido de entrada y
         * salida, que ahora es asimetrico como en la escena.
         */
        desplazamiento(subloc) {
            const c = this.capas(subloc);
            if (!c) return null;
            const q = this.posicion(subloc);
            if (!q) return null;
            const DIRMAG = 1.118034;
            // `parada` es donde el tren queda cuando esta PARADO. No es el cero: la
            // escena esta guardada con el tren donde lo dejo el disenador, asi que el
            // horneado mide cuanto hay que correrlo para que la puerta del vagon caiga
            // en `EnterTrain`, el boton de subir del anden. En level9 son +0.941.
            const via = pista[Number(subloc)] || {};
            const tParada = typeof via.tParada === 'number' ? via.tParada : 0.5;
            const d = (tParada - q.t) * (c.recorrido || 0) + (c.parada || 0);
            return { x: d * (1 / DIRMAG), y: d * (0.5 / DIRMAG), t: q.t, tramo: q.tramo };
        },

        /** ¿La sala que se esta viendo es una estacion? Devuelve su zona, o null. */
        estacionDe(subloc) {
            const z = ESTACIONES[Number(subloc)];
            return z === undefined ? null : z;
        },

        // ── Interior del vagon y fases del viaje ────────────────────────────
        _vagonActual: 1,
        _techoAbierto: false,
        _revealRadius: 0.0,
        _revealTarget: 0.0,
        _revealAnimId: null,

        vagonActual() {
            return this._vagonActual;
        },

        techoAbierto() {
            return this._techoAbierto;
        },

        revealProgress() {
            return this._revealRadius;
        },

        alternarTecho(abrir) {
            if (abrir !== undefined) {
                this._techoAbierto = !!abrir;
            } else {
                this._techoAbierto = !this._techoAbierto;
            }
            this._revealTarget = this._techoAbierto ? 1.0 : 0.0;
            this._animarTecho();
            if (window.app && window.app.showToast) {
                window.app.showToast(this._techoAbierto ? '🔍 Techo abierto: interior visible' : '🔒 Techo cerrado', 'info');
            }
            if (window.app && window.app.map) {
                window.app.map._mapaEncuadrado = null;
                try { window.app.map.draw(); } catch (e) {}
            }
            return this._techoAbierto;
        },

        _animarTecho() {
            if (this._revealAnimId) cancelAnimationFrame(this._revealAnimId);
            const animStep = () => {
                const diff = this._revealTarget - this._revealRadius;
                if (Math.abs(diff) < 0.015) {
                    this._revealRadius = this._revealTarget;
                    this._revealAnimId = null;
                    if (window.app && window.app.map) window.app.map.draw();
                    return;
                }
                this._revealRadius += diff * 0.22;
                if (window.app && window.app.map) window.app.map.draw();
                this._revealAnimId = requestAnimationFrame(animStep);
            };
            this._revealAnimId = requestAnimationFrame(animStep);
        },

        cambiarVagon(dir) {
            const paso = dir < 0 ? -1 : 1;
            this._vagonActual = (this._vagonActual + paso + 3) % 3;
            if (this._techoAbierto) {
                this._revealRadius = 0.2;
                this._revealTarget = 1.0;
                this._animarTecho();
            }
            if (window.app && window.app.map) {
                window.app.map._mapaEncuadrado = null;
                try { window.app.map.draw(); } catch (e) {}
            }
            if (window.app && window.app.showToast) {
                window.app.showToast('🚪 Vagón ' + (this._vagonActual + 1) + ' / 3', 'info');
            }
            return this._vagonActual;
        },

        faseViaje(segundos) {
            const FASES = ['Country', 'Bridge', 'Tunnel', 'City'];
            const NOM_FASES = {
                Country: 'Campo / Pradera',
                Bridge: 'Puente sobre el río',
                Tunnel: 'Túnel subterráneo',
                City: 'Aproximación a la Ciudad'
            };
            const s = (segundos != null) ? segundos : (Date.now() / 1000);
            const id = Math.floor(s / 10) % 4;
            const clave = FASES[id];
            return { id, clave, nombre: NOM_FASES[clave] };
        },
    };


    // ── el cartel y el boton de abordar ─────────────────────────────────────
    //
    // Se pinta como una capa HTML sobre el lienzo en vez de dibujarlo en el canvas,
    // porque el boton hay que poder pulsarlo y el canvas no tiene zonas clicables.
    // Lo llama `map.js` desde el bucle de dibujado, igual que la obra del homecoming.

    const HUD_ID = 'tren-hud';
    const HUD_CUERPO = 'tren-hud-cuerpo';
    const CLAVE_PLEGADO = 'tsuki.tren.hud.plegado';

    // Abajo en el centro estaba la botonera de la aplicacion y el cartel se le ponia
    // encima. Va abajo a la IZQUIERDA, que esta libre, y se puede plegar a una pastilla.
    let plegado = false;
    try { plegado = localStorage.getItem(CLAVE_PLEGADO) === '1'; } catch (e) { /* sin storage */ }

    function quitarHud() {
        const h = document.getElementById(HUD_ID);
        if (h) h.remove();
    }

    function crearHud() {
        const h = document.createElement('div');
        h.id = HUD_ID;
        h.style.cssText = 'position:fixed;left:16px;bottom:18px;z-index:10050;'
            + 'background:#fdf6e3;border:3px solid #8b6b4a;border-radius:12px;'
            + 'padding:6px 10px;box-shadow:0 4px 14px rgba(0,0,0,.3);font-size:.85rem;'
            + 'color:#4a3b2a;max-width:280px;pointer-events:auto;'
            + 'font-family:inherit;user-select:none;';

        // Delegación de eventos única: los clics en botones nunca se pierden por re-renderizado
        h.addEventListener('click', (ev) => {
            const btn = ev.target.closest('button');
            if (!btn) return;
            const id = btn.id;
            const subloc = (window.app && window.app.map && window.app.map.locationId != null)
                ? window.app.map.locationId : 10;

            if (id === 'tren-plegar') {
                alternarPlegado();
            } else if (id === 'tren-vagon-prev') {
                API.cambiarVagon(-1);
                API.actualizarHUD(subloc, true);
            } else if (id === 'tren-vagon-next') {
                API.cambiarVagon(1);
                API.actualizarHUD(subloc, true);
            } else if (id === 'tren-techo-toggle') {
                API.alternarTecho();
                API.actualizarHUD(subloc, true);
            } else if (id === 'tren-bajar') {
                const r = API.llegar();
                avisar(r, '🚉 Has llegado');
            } else if (id === 'tren-cancelar') {
                const r = API.cancelar();
                avisar(r, '↩️ Te has bajado');
            } else if (id === 'tren-abordar') {
                const r = API.abordar();
                avisar(r, '🚆 A bordo, rumbo a ' + (r.hasta === ZONA.CIUDAD ? 'la Gran Ciudad' : 'Aldea Hongo'));
            } else if (id === 'tren-esperar') {
                if (window.GameTime) window.GameTime.syncWithDevice = false;
                const r = API.esperarAlTren();
                if (r.ok && window.app && window.app.showToast) {
                    window.app.showToast('⏱️ +' + r.avanzado + ' min: el tren entra en la estación', 'success');
                }
                if (window.app && window.app.map) window.app.map.draw();
                API.actualizarHUD(subloc, true);
            } else if (id === 'tren-pasada') {
                const falta2 = API.minutosAlaPasada();
                if (falta2 == null) {
                    if (window.app && window.app.showToast) {
                        window.app.showToast('En este modo no pasa ninguno de largo', 'warning');
                    }
                    return;
                }
                const c = reloj();
                let minuto = (c.minute | 0) + falta2, hora = c.hour | 0;
                while (minuto >= 60) { minuto -= 60; hora += 1; }
                if (window.GameTime) window.GameTime.syncWithDevice = false;
                API.parser.setClock({ hour: hora % 24, minute: minuto });
                if (window.app && window.app.showToast) {
                    window.app.showToast('⏱️ +' + falta2 + ' min: el siguiente pasa sin parar', 'success');
                }
                if (window.app && window.app.map) window.app.map.draw();
                API.actualizarHUD(subloc, true);
            } else if (id === 'tren-calib-save') {
                const sublocStr = String(subloc);
                const curCfg = window.TrainLayers && window.TrainLayers[sublocStr];
                if (curCfg) {
                    const dataToSave = { parada: curCfg.parada, luces_offset_px: curCfg.luces_offset_px };
                    try {
                        localStorage.setItem('tsuki_train_calib_' + sublocStr, JSON.stringify(dataToSave));
                        if (window.app && window.app.showToast) window.app.showToast('💾 Calibración guardada en navegador', 'success');
                    } catch(e) {}
                }
            } else if (id === 'tren-calib-copy') {
                const sublocStr = String(subloc);
                const curCfg = window.TrainLayers && window.TrainLayers[sublocStr];
                if (curCfg) {
                    const snippet = JSON.stringify({ parada: curCfg.parada, luces_offset_px: curCfg.luces_offset_px }, null, 2);
                    navigator.clipboard.writeText(snippet).then(() => {
                        if (window.app && window.app.showToast) window.app.showToast('📋 JSON copiado al portapapeles', 'info');
                    }).catch(() => {
                        prompt('Copia esta configuración para train_layers.json:', snippet);
                    });
                }
            } else if (id === 'tren-calib-reset') {
                const sublocStr = String(subloc);
                try { localStorage.removeItem('tsuki_train_calib_' + sublocStr); } catch(e) {}
                const curCfg = window.TrainLayers && window.TrainLayers[sublocStr];
                if (curCfg) {
                    curCfg.parada = 0.0;
                    curCfg.luces_offset_px = [0, 0];
                }
                if (window.app && window.app.showToast) window.app.showToast('Valores restablecidos a predeterminados (0, 0)', 'info');
                API.actualizarHUD(subloc, true);
                if (window.app && window.app.map) window.app.map.draw();
                try {
                    const clk = window.GameTime && window.GameTime.now ? window.GameTime.now() : null;
                    if (window.Lighting) window.Lighting.renderHalos(clk, sublocStr);
                } catch (e) {}
            }
        });

        document.body.appendChild(h);
        return h;
    }

    /** Pliega o despliega el cartel, y lo recuerda. */
    function alternarPlegado() {
        plegado = !plegado;
        try { localStorage.setItem(CLAVE_PLEGADO, plegado ? '1' : '0'); } catch (e) { /* nada */ }
        const cuerpo = document.getElementById(HUD_CUERPO);
        if (cuerpo) cuerpo.hidden = plegado;
        const b = document.getElementById('tren-plegar');
        if (b) { b.textContent = plegado ? '▸' : '▾'; b.title = plegado ? 'Desplegar' : 'Plegar'; }
    }

    /** La cabecera: siempre visible, con el boton de plegar. */
    function cabecera(titulo) {
        return '<div style="display:flex;align-items:center;gap:8px">'
            + '<span style="flex:1;font-weight:700;white-space:nowrap">' + titulo + '</span>'
            + '<button id="tren-plegar" title="' + (plegado ? 'Desplegar' : 'Plegar') + '" '
            + 'style="border:0;background:#e6dcc2;color:#4a3b2a;border-radius:6px;'
            + 'width:22px;height:20px;line-height:18px;cursor:pointer;padding:0;'
            + 'font-size:.8rem">' + (plegado ? '▸' : '▾') + '</button></div>';
    }

    /**
     * Refresca el cartel del tren sin destruir el DOM en cada frame, permitiendo
     * interacción fluida y clicks confiables.
     */
    API.actualizarHUD = function (subloc, forzar = false) {
        const enPlay = document.body.classList.contains('play-mode');
        const zonaEst = this.estacionDe(subloc);
        const enVagon = Number(subloc) === VAGON;

        if (!enPlay || (zonaEst === null && !enVagon) || !this.parser) { quitarHud(); return; }

        const h = document.getElementById(HUD_ID) || crearHud();
        const e = this.estado();
        if (!e) { quitarHud(); return; }

        const enViajeModo = (enVagon || this.enViaje());
        const parado = e.status === ESTADO.Waiting;
        const modoActual = enViajeModo ? 'viaje' : (parado ? 'parado' : 'espera');

        // Solo reconstruimos el innerHTML si el modo estructural cambia o se fuerza
        if (h.dataset.modo !== modoActual || forzar) {
            h.dataset.modo = modoActual;
            if (enViajeModo) {
                const v = this.viaje();
                const f = v ? this.fase(v.trainDay, v.trainNumber) : null;
                const fViaje = this.faseViaje();
                const vagon = this.vagonActual();
                const destino = v && v.end === ZONA.CIUDAD ? 'la Gran Ciudad' : 'Aldea Hongo';
                h.innerHTML = cabecera('🚆 En viaje · ' + fViaje.nombre)
                    + '<div id="' + HUD_CUERPO + '"' + (plegado ? ' hidden' : '') + '>'
                    + '<div id="tren-hud-sub" style="font-size:.8em;color:#6b5b45;margin:4px 0 4px">'
                    + 'Rumbo a <b>' + destino + '</b>'
                    + (f != null ? ' · ' + f : '') + '</div>'
                    + '<div style="display:flex;align-items:center;justify-content:space-between;margin:6px 0;background:#efe7cf;padding:4px 8px;border-radius:6px;font-size:.82em">'
                    + '<button id="tren-vagon-prev" class="btn-text" style="padding:2px 8px;font-size:.85em;cursor:pointer">◄</button>'
                    + '<span id="tren-hud-vagon-lbl"><b>Vagón ' + (vagon + 1) + '</b> / 3</span>'
                    + '<button id="tren-vagon-next" class="btn-text" style="padding:2px 8px;font-size:.85em;cursor:pointer">►</button>'
                    + '</div>'
                    + '<div style="display:flex;gap:4px;margin-top:6px">'
                    + '<button id="tren-bajar" class="btn-text" style="flex:1;padding:3px 8px">Bajar en destino</button>'
                    + '<button id="tren-cancelar" class="btn-text" style="padding:3px 8px;font-size:.8em">Volver</button>'
                    + '</div>'
                    + '</div>';
            } else {
                const queHace = e.para
                    ? '<span style="color:#4d6b3d">para en el andén</span>'
                    : '<span style="color:#8a5a3b">pasa de largo</span>';
                const falta = this.minutosAlProximo();
                const barra = Math.round(e.progress * 100);
                const q = this.posicion();

                h.innerHTML = cabecera('<span id="tren-hud-title">🚆 Servicio nº ' + e.trainNumber + ' · ' + queHace + '</span>')
                    + '<div id="' + HUD_CUERPO + '"' + (plegado ? ' hidden' : '') + '>'
                    + '<div id="tren-hud-estado" style="font-size:.8em;color:#6b5b45">El tren está <b>' + this.nombreEstado(e.status) + '</b>'
                    + (q ? ' · <span style="opacity:.75">' + q.tramo + ', vía ' + Math.round(q.t * 100) + '%</span>' : '')
                    + '</div>'
                    + '<div style="height:5px;background:#e6dcc2;border-radius:3px;margin:6px 0;overflow:hidden">'
                    + '<div id="tren-hud-barra" style="height:100%;width:' + barra + '%;background:' + (parado ? '#7a9c6a' : '#c2a06a') + '"></div></div>'
                    + (parado
                        ? '<div style="display:flex;align-items:center;justify-content:space-between;margin:6px 0;background:#efe7cf;padding:4px 8px;border-radius:6px;font-size:.82em">'
                          + '<button id="tren-vagon-prev" class="btn-text" style="padding:2px 8px;font-size:.85em;cursor:pointer">◄</button>'
                          + '<span id="tren-hud-vagon-lbl"><b>Vagón ' + (this.vagonActual() + 1) + '</b> / 3</span>'
                          + '<button id="tren-vagon-next" class="btn-text" style="padding:2px 8px;font-size:.85em;cursor:pointer">►</button>'
                          + '</div>'
                          + '<div style="display:flex;gap:4px;margin-top:6px">'
                          + '<button id="tren-techo-toggle" class="btn-text" style="flex:1;padding:4px 8px;font-weight:600;cursor:pointer">' + (this.techoAbierto() ? '🔒 Cerrar Techo' : '🔍 Ver Interior') + '</button>'
                          + '<button id="tren-abordar" class="btn-text" style="padding:4px 12px;font-weight:700;cursor:pointer">Abordar ▸</button>'
                          + '</div>'
                        : '<div id="tren-hud-falta" style="font-size:.78em;color:#6b5b45;margin-bottom:5px">'
                          + (falta != null ? ('Próxima parada en ' + falta + ' min')
                                           : 'En este modo el tren no para nunca') + '</div>'
                          + (falta != null
                              ? '<button id="tren-esperar" class="btn-text" style="padding:3px 12px;font-size:.82em;cursor:pointer">Esperar al tren</button> '
                              : '')
                          + '<button id="tren-pasada" class="btn-text" style="padding:3px 10px;font-size:.78em;cursor:pointer">Ver pasar uno</button>')
                    + '<details id="tren-calib-panel" style="margin-top:8px;border-top:1px dashed #d0c4a4;padding-top:6px;font-size:.78em;color:#555">'
                    + '<summary style="cursor:pointer;font-weight:600;color:#6b5b45">⚙️ Calibrar Tren & Faros</summary>'
                    + '<div style="display:grid;grid-template-columns:auto 1fr;gap:4px 6px;margin-top:6px;align-items:center">'
                    + '<label title="Posición donde frena el tren en la estación">Parada:</label>'
                    + '<input id="tren-calib-parada" type="number" step="0.1" style="width:80px;padding:2px 4px;font-size:inherit" />'
                    + '<label title="Desfase horizontal de los faros">Faros X:</label>'
                    + '<input id="tren-calib-luces-x" type="number" step="1" style="width:80px;padding:2px 4px;font-size:inherit" />'
                    + '<label title="Desfase vertical de los faros">Faros Y:</label>'
                    + '<input id="tren-calib-luces-y" type="number" step="1" style="width:80px;padding:2px 4px;font-size:inherit" />'
                    + '</div>'
                    + '<div style="display:flex;gap:4px;margin-top:6px">'
                    + '<button id="tren-calib-save" class="btn-text" style="flex:1;padding:2px 4px;font-size:.85em;cursor:pointer" title="Guarda en tu navegador">💾 Guardar</button>'
                    + '<button id="tren-calib-copy" class="btn-text" style="padding:2px 6px;font-size:.85em;cursor:pointer" title="Copiar para train_layers.json">📋 Copiar</button>'
                    + '<button id="tren-calib-reset" class="btn-text" style="padding:2px 6px;font-size:.85em;cursor:pointer" title="Restablecer valores">↺</button>'
                    + '</div>'
                    + '</details>'
                    + '</div>';

                this._initCalibInputs(subloc);
            }
        } else {
            // Actualización ligera sin destruir botones ni inputs
            if (enViajeModo) {
                const fViaje = this.faseViaje();
                const vagon = this.vagonActual();
                const vLbl = document.getElementById('tren-hud-vagon-lbl');
                if (vLbl) vLbl.innerHTML = '<b>Vagón ' + (vagon + 1) + '</b> / 3';
            } else {
                const barra = Math.round(e.progress * 100);
                const q = this.posicion();
                const elBarra = document.getElementById('tren-hud-barra');
                if (elBarra) {
                    elBarra.style.width = barra + '%';
                    elBarra.style.background = parado ? '#7a9c6a' : '#c2a06a';
                }
                const elEstado = document.getElementById('tren-hud-estado');
                if (elEstado) {
                    elEstado.innerHTML = 'El tren está <b>' + this.nombreEstado(e.status) + '</b>'
                        + (q ? ' · <span style="opacity:.75">' + q.tramo + ', vía ' + Math.round(q.t * 100) + '%</span>' : '');
                }
                const falta = this.minutosAlProximo();
                const elFalta = document.getElementById('tren-hud-falta');
                if (elFalta && falta != null) {
                    elFalta.textContent = 'Próxima parada en ' + falta + ' min';
                }
                const vLbl = document.getElementById('tren-hud-vagon-lbl');
                if (vLbl) vLbl.innerHTML = '<b>Vagón ' + (this.vagonActual() + 1) + '</b> / 3';
                const btnTecho = document.getElementById('tren-techo-toggle');
                if (btnTecho) btnTecho.textContent = this.techoAbierto() ? '🔒 Cerrar Techo' : '🔍 Ver Interior';
            }
        }
    };

    API._initCalibInputs = function (subloc) {
        const sublocStr = String(subloc);
        const curCfg = window.TrainLayers && window.TrainLayers[sublocStr];
        const inpParada = document.getElementById('tren-calib-parada');
        const inpLx = document.getElementById('tren-calib-luces-x');
        const inpLy = document.getElementById('tren-calib-luces-y');
        if (curCfg && inpParada && inpLx && inpLy) {
            const lOff = curCfg.luces_offset_px || curCfg.luces_offset || [0, 0];
            inpParada.value = curCfg.parada != null ? curCfg.parada : 0;
            inpLx.value = lOff[0] != null ? lOff[0] : 0;
            inpLy.value = lOff[1] != null ? lOff[1] : 0;

            const actualizarCalib = () => {
                curCfg.parada = parseFloat(inpParada.value) || 0;
                curCfg.luces_offset_px = [parseInt(inpLx.value, 10) || 0, parseInt(inpLy.value, 10) || 0];
                try { if (window.app && window.app.map) window.app.map.draw(); } catch (e) {}
                try {
                    const clk = window.GameTime && window.GameTime.now ? window.GameTime.now() : null;
                    if (window.Lighting) window.Lighting.renderHalos(clk, sublocStr);
                } catch (e) {}
            };
            inpParada.oninput = actualizarCalib;
            inpLx.oninput = actualizarCalib;
            inpLy.oninput = actualizarCalib;
        }
    };

    function avisar(r, exito) {
        if (!(window.app && window.app.showToast)) return;
        window.app.showToast(r && r.ok ? exito : (r ? r.motivo : 'no se pudo'),
                             r && r.ok ? 'success' : 'warning');
    }

    // El indice de capas se pide una vez al arrancar.
    if (typeof fetch === 'function') {
        fetch('data/maps/train_layers.json')
            .then(r => (r.ok ? r.json() : null))
            .then(j => {
                if (!j) return;
                window.TrainLayers = j;
                try {
                    for (const k of Object.keys(j)) {
                        const saved = localStorage.getItem('tsuki_train_calib_' + k);
                        if (saved) {
                            const parsed = JSON.parse(saved);
                            if (parsed.luces_offset_px && (
                                (parsed.luces_offset_px[0] === 380 && parsed.luces_offset_px[1] === -486)
                            )) {
                                localStorage.removeItem('tsuki_train_calib_' + k);
                            } else {
                                Object.assign(window.TrainLayers[k], parsed);
                            }
                        }
                    }
                } catch(e) {}
                if (window.app && window.app.map) {
                    window.app.map._bakedBgKey = null;
                    try { window.app.map.draw(); } catch (e) { /* aun sin mapa */ }
                }
            })
            .catch(() => { /* sin indice: modo antiguo */ });
    }

    window.Train = API;

    // La via de las escenas. Sin esto se usa el respaldo, que son los mismos numeros;
    // pedirla deja que se corrijan sin tocar el modulo.
    if (typeof document !== 'undefined' && document.addEventListener) {
        document.addEventListener('DOMContentLoaded', () => { API.cargarPista(); });
    }
})();

