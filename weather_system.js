// weather_system.js — lluvia y nieve, con los datos del juego.
//
// Qué es de verdad del juego (tools/extract_weather_seasons.py -> data/weather.json):
//   · Cada estación trae su `weatherType` y su `chanceOfWeather`:
//         Primavera  Lluvia 50%     Verano  Lluvia 25%
//         Otoño      Lluvia 25%     Invierno Nieve  50%
//   · `heavyWeatherFrequency` = 0.10: uno de cada diez días de mal tiempo es fuerte.
//   · Los cuatro `Gradient` son un TINTE sobre la escena indexado por el progreso del
//     temporal (0 = empieza, 1 = termina), no el color de la lluvia. La nieve no tinta:
//     sus dos claves son blancas. La lluvia sí, hacia un azul grisáceo.
//
// El sorteo YA NO es nuestro. Antes lo era —un hash de (mes, día) que daba un bloque de
// 3 a 9 horas seguidas— porque el dump solo traía la firma de `GetWeather`. Sacando el
// cuerpo con Ghidra resultó que el juego hace otra cosa bastante distinta:
//
//     rng = new System.Random((int)fecha.ToOADate())     // determinista por día
//     if (rng.NextDouble() > estacion.chanceOfWeather) -> despejado
//     horas  = clamp(trunc(chance / tirada), 1, 3)
//     cuales = Range(0,24).Shuffle(rng).Take(horas).Sort()
//     progreso = (minuto + antes*60) / ((antes+despues)*60 + 60)
//     fuerte   = hay hora contigua por delante || rng.NextDouble() < heavyWeatherFrequency
//
// O sea: de una a tres horas SUELTAS repartidas por todo el día, no un bloque matinal.
// Cuando caen pegadas, el progreso abarca la racha entera y el temporal cuenta como
// fuerte. `Shuffle` es un Fisher-Yates descendente sobre `System.Random` —comprobado
// en el binario, no lleva `OrderBy`—, y vive en `seeded_random.js`.
//
// Dibuja en su propio lienzo, encima del mapa. Eso lo mantiene fuera de la copia de
// paneo de map.js (que congela la escena mientras arrastras) y del horneado del fondo.

(function () {
    'use strict';

    const DATOS_POR_DEFECTO = {
        weather: {
            heavyWeatherFrequency: 0.1,
            gradients: {
                rainColor: { color: [{ t: 0, r: 1, g: 1, b: 1 }, { t: 0.0618, r: 0.835, g: 0.897, b: 1 },
                                     { t: 0.9412, r: 0.807, g: 0.925, b: 1 }, { t: 1, r: 1, g: 1, b: 1 }] },
                heavyRainColor: { color: [{ t: 0, r: 1, g: 1, b: 1 }, { t: 0.0618, r: 0.731, g: 0.794, b: 0.896 },
                                          { t: 0.2882, r: 0.647, g: 0.706, b: 0.821 }, { t: 0.7235, r: 0.624, g: 0.718, b: 0.802 },
                                          { t: 0.9412, r: 0.736, g: 0.857, b: 0.934 }, { t: 1, r: 1, g: 1, b: 1 }] },
                snowColor: { color: [{ t: 0, r: 1, g: 1, b: 1 }, { t: 1, r: 1, g: 1, b: 1 }] },
                heavySnowColor: { color: [{ t: 0, r: 1, g: 1, b: 1 }, { t: 1, r: 1, g: 1, b: 1 }] },
            },
        },
        seasons: [
            { SeasonID: 0, seasonName: 'Summer', weatherType: 1, chanceOfWeather: 0.25 },
            { SeasonID: 1, seasonName: 'Autumn', weatherType: 1, chanceOfWeather: 0.25 },
            { SeasonID: 2, seasonName: 'Winter', weatherType: 2, chanceOfWeather: 0.5 },
            { SeasonID: 3, seasonName: 'Spring', weatherType: 1, chanceOfWeather: 0.5 },
        ],
    };

    let datos = null;
    let lienzo = null, ctx = null;
    let tinte = null;             // el div del tinte, debajo del velo de luz
    let gotas = [];
    let ultimoMs = 0;
    let animando = false;
    let estadoActual = null;
    // Cuando toca el siguiente trueno. 0 = no hay tormenta.
    let truenoProximo = 0;

    // ── utilidades ───────────────────────────────────────────────────────

    // El generador y el barajado viven en `seeded_random.js`: los usan tambien los
    // sorteos diarios de otros sistemas. Ver LOGICAS_PENDIENTES.md 1.
    const SR = (typeof window !== 'undefined' ? window.SeededRandom : null)
             || (typeof globalThis !== 'undefined' ? globalThis.SeededRandom : null);
    const RandomNet = SR ? SR.RandomNet : null;

    /**
     * Las 24 horas barajadas como las baraja el juego: `Enumerable.Range(0,24)` pasado
     * por `CastleExtensions.Shuffle`, que es Fisher-Yates descendente y NO
     * `OrderBy(_ => rng.Next())`, que es lo que ponia aqui antes. Los dos algoritmos
     * consumen distinto numero de valores del generador y dan otra permutacion con la
     * misma semilla, asi que las horas de temporal salian en el sitio equivocado.
     */
    function barajar24(rng) {
        return SR.rangoBarajado(24, rng);
    }

    /**
     * El dia OA, que es con lo que el juego siembra el sorteo: `(int)fecha.ToOADate()`.
     * El save no guarda el año, asi que se usa el real salvo que el reloj traiga uno.
     */
    function diaOA(clock) {
        // El save ya guarda `day` COMO dia OA (45779 = 2025-05-02), que es justo la
        // semilla que usa el juego. Antes se metia ese numero como dia del mes en un
        // Date.UTC y salia una fecha a 125 anios vista, o sea una semilla cualquiera.
        const d = clock && clock.day ? clock.day | 0 : 0;
        if (d > 20000) return d;
        // Si viene un dia del mes de verdad (reloj sintetico, pruebas), se compone.
        const anio = (clock && clock.year) ? (clock.year | 0) : new Date().getFullYear();
        const mes = (clock && clock.month ? clock.month | 0 : 1) - 1;
        return Math.floor(Date.UTC(anio, mes, d || 1) / 86400000) + 25569;
    }

    function gradiente(paradas, t) {
        if (!paradas || !paradas.length) return [1, 1, 1];
        t = Math.max(0, Math.min(1, t));
        let a = paradas[0], b = paradas[paradas.length - 1];
        for (let i = 0; i < paradas.length - 1; i++) {
            if (t >= paradas[i].t && t <= paradas[i + 1].t) { a = paradas[i]; b = paradas[i + 1]; break; }
        }
        const span = (b.t - a.t) || 1;
        const k = (t - a.t) / span;
        return [a.r + (b.r - a.r) * k, a.g + (b.g - a.g) * k, a.b + (b.b - a.b) * k];
    }

    function contenedor() { return document.querySelector('.canvas-container'); }

    function asegurarCapas() {
        const cont = contenedor();
        if (!cont) return false;
        if (!tinte) {
            tinte = document.getElementById('weather-tint');
            if (!tinte) {
                tinte = document.createElement('div');
                tinte.id = 'weather-tint';
                // z-index 4: por debajo del velo de día/noche (5) y de los halos (6)
                tinte.style.cssText = 'position:absolute;inset:0;pointer-events:none;'
                    + 'mix-blend-mode:multiply;transition:background 800ms ease;z-index:4;display:none;';
                cont.appendChild(tinte);
            }
        }
        if (!lienzo) {
            lienzo = document.getElementById('weather-canvas');
            if (!lienzo) {
                lienzo = document.createElement('canvas');
                lienzo.id = 'weather-canvas';
                // z-index 7: encima de los halos, debajo del HUD
                lienzo.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:7;display:none;';
                cont.appendChild(lienzo);
            }
            ctx = lienzo.getContext('2d');
        }
        return true;
    }

    function ajustarLienzo() {
        if (!lienzo) return;
        const mapa = document.getElementById('map-canvas');
        const w = (mapa && mapa.width) || lienzo.clientWidth || 0;
        const h = (mapa && mapa.height) || lienzo.clientHeight || 0;
        if (w > 0 && h > 0 && (lienzo.width !== w || lienzo.height !== h)) {
            lienzo.width = w;
            lienzo.height = h;
            gotas = [];      // la lluvia se reparte según el tamaño
        }
    }

    // ── decisión del tiempo ──────────────────────────────────────────────

    const API = {
        // Expuesto para poder contrastarlo contra valores conocidos de .NET.
        _Random: RandomNet,

        get datos() { return datos || DATOS_POR_DEFECTO; },

        async load() {
            if (datos) return datos;
            try {
                const r = await fetch('/data/weather.json');
                datos = r.ok ? await r.json() : DATOS_POR_DEFECTO;
            } catch (e) {
                datos = DATOS_POR_DEFECTO;
            }
            return datos;
        },

        /** La estación tal y como la numera el juego: 0 Verano, 1 Otoño, 2 Invierno, 3 Primavera. */
        estacionDe(clock) {
            const lista = this.datos.seasons || [];
            if (clock && clock.season != null) {
                const s = lista.find(x => x.SeasonID === (clock.season | 0));
                if (s) return s;
            }
            const m = clock && clock.month ? (clock.month | 0) : 1;
            const id = (m >= 6 && m <= 8) ? 0 : (m >= 9 && m <= 11) ? 1 : (m === 12 || m <= 2) ? 2 : 3;
            return lista.find(x => x.SeasonID === id) || lista[0] || null;
        },

        /**
         * El plan del día: qué tipo de tiempo y en qué horas cae.
         *
         * Determinista por fecha, porque la siembra es el día OA. Todas las tiradas que
         * deciden esto ocurren antes de mirar la hora, así que el plan no depende del
         * momento en que se pregunte.
         */
        delDia(clock) {
            const est = this.estacionDe(clock);
            const vacio = { tipo: 0, horas: [], estacion: est };
            if (!est || !est.weatherType) return vacio;

            const chance = est.chanceOfWeather || 0;
            const rng = new RandomNet(diaOA(clock));
            const tirada = rng.nextDouble();
            if (tirada > chance) return vacio;

            // El guardacaidas de la division es 0.01 (_UNK_012dfb38, leido del .so).
            // Da lo mismo que un epsilon minusculo porque el resultado se recorta a
            // 1..3 y una tirada por debajo de 0.01 siempre se pasa de 3, pero se usa
            // el valor de verdad.
            const horas = Math.min(3, Math.max(1, Math.trunc(chance / Math.max(tirada, 0.01))));

            if (horas === 1) {
                return { tipo: est.weatherType, horas: [rng.nextMax(24)], estacion: est, rng, unica: true };
            }
            const lista = barajar24(rng).slice(0, horas).sort((a, b) => a - b);
            return { tipo: est.weatherType, horas: lista, estacion: est, rng, unica: false };
        },

        /**
         * Estado ahora mismo. Reproduce `WeatherData.GetWeather`, incluida la cuenta de
         * horas contiguas: si el temporal encadena varias horas, el progreso abarca la
         * racha entera y cuenta como fuerte.
         */
        ahora(clock) {
            const d = this.delDia(clock);
            const despejado = { activo: false, tipo: 0, fuerte: false, progreso: 0,
                                tinte: [1, 1, 1], dia: d };
            if (!d.tipo) return despejado;

            const hora = (clock && clock.hour) ? clock.hour | 0 : 0;
            const minuto = (clock && clock.minute) ? clock.minute | 0 : 0;
            const freq = this.datos.weather.heavyWeatherFrequency ?? 0.1;
            const lista = d.horas;

            let fuerte, progreso;
            if (d.unica) {
                if (lista[0] !== hora) return despejado;
                progreso = minuto / 60;
                fuerte = d.rng.nextDouble() < freq;
            } else {
                let i = 0;
                let tiradaFuerte = 0;
                // La tirada de intensidad se consume una vez por vuelta hasta dar con la
                // hora, asi que hay que recorrer la lista igual que el juego.
                for (; i < lista.length; i++) {
                    tiradaFuerte = d.rng.nextDouble();
                    if (lista[i] === hora) break;
                }
                if (i >= lista.length) return despejado;

                let antes = 0, despues = 0;
                if (i > 0 && lista[i - 1] === lista[i] - 1) {
                    antes = (i > 1 && lista[i - 2] === lista[i] - 2) ? 2 : 1;
                }
                if (i < lista.length - 1 && lista[i + 1] === lista[i] + 1) {
                    despues = (i < lista.length - 2 && lista[i + 2] === lista[i] + 2) ? 2 : 1;
                }
                progreso = (minuto + antes * 60) / ((antes + despues) * 60 + 60);
                fuerte = antes > 0 || tiradaFuerte < freq;
            }

            const g = this.datos.weather.gradients;
            const paradas = d.tipo === 2
                ? (fuerte ? g.heavySnowColor : g.snowColor).color
                : (fuerte ? g.heavyRainColor : g.rainColor).color;
            return { activo: true, tipo: d.tipo, fuerte, progreso,
                     tinte: gradiente(paradas, progreso), dia: d };
        },

        nombre(tipo) { return tipo === 1 ? 'Lluvia' : tipo === 2 ? 'Nieve' : 'Despejado'; },

        /** Resumen de hoy, para el botón del HUD. */
        resumenDeHoy(clock) {
            if (!clock) {
                clock = (window.GameTime && typeof window.GameTime.now === 'function')
                    ? window.GameTime.now()
                    : (window.app?.parser?.getClock ? window.app.parser.getClock() : null);
            }
            const d = this.delDia(clock);
            const est = this.ahora(clock);
            const hh = h => String(h).padStart(2, '0') + ':00';
            const partes = [];
            partes.push('Estación: ' + (d.estacion ? d.estacion.seasonName : '?'));
            if (!d.tipo) {
                partes.push('Hoy: despejado');
            } else {
                const cuando = d.horas.map(hh).join(', ');
                partes.push('Hoy: ' + this.nombre(d.tipo)
                            + ' — ' + d.horas.length + (d.horas.length === 1 ? ' hora' : ' horas')
                            + ' (' + cuando + ')');
                partes.push(est.activo
                    ? ('Ahora mismo está cayendo' + (est.fuerte ? ' fuerte' : '')
                       + ' (' + Math.round(est.progreso * 100) + '%)')
                    : 'Ahora mismo no cae');
            }
            const ev = window.VillageEvents && window.VillageEvents.activo(clock);
            partes.push(ev ? ('Festival: ' + ev.name_es) : 'Sin festival');
            return partes.join('\n');
        },

        // ── pintado ──────────────────────────────────────────────────────

        /** Se llama igual que Lighting.apply: al cambiar hora, mapa o modo. */
        apply(clock, mapId) {
            if (!asegurarCapas()) return;
            const enPlay = document.body.classList.contains('play-mode');
            if (!enPlay) return this.hide();

            if (!clock) {
                clock = (window.GameTime && typeof window.GameTime.now === 'function')
                    ? window.GameTime.now()
                    : (window.app?.parser?.getClock ? window.app.parser.getClock() : null);
            }
            const antes = estadoActual;
            const est = this.ahora(clock);
            estadoActual = est;
            estadoActual.mapId = mapId;
            API._sonido(antes, est);

            if (!est.activo) return this.hide();

            // Tinte: el gradiente es multiplicativo, 1,1,1 = no tocar nada.
            const [r, g, b] = est.tinte;
            const dentro = window.Lighting && typeof window.Lighting.isExterior === 'function'
                ? !window.Lighting.isExterior(mapId) : false;
            // Bajo techo el tinte se nota menos: se acerca al blanco.
            const k = dentro ? 0.45 : 1;
            const mez = v => Math.round(255 * (1 - (1 - v) * k));
            tinte.style.background = 'rgb(' + mez(r) + ',' + mez(g) + ',' + mez(b) + ')';
            tinte.style.display = 'block';

            // Partículas: solo a la intemperie. Con "reducir movimiento" activado no se
            // apagan —el jugador se quedaría sin saber que llueve— sino que caen muchas
            // menos, que es el espíritu del ajuste.
            if (dentro) {
                lienzo.style.display = 'none';
                this._parar();
            } else {
                lienzo.style.display = 'block';
                ajustarLienzo();
                this._arrancar();
            }
        },

        hide() {
            if (tinte) tinte.style.display = 'none';
            if (lienzo) lienzo.style.display = 'none';
            this._parar();
        },

        movimientoReducido() {
            try {
                const gv = window.app?.parser?.generalVars;
                if (gv && gv.reduceMotion && gv.reduceMotion.value) return true;
            } catch (e) { /* sin save: no pasa nada */ }
            return false;
        },

        _arrancar() {
            if (animando) return;
            animando = true;
            ultimoMs = 0;
            requestAnimationFrame(this._paso);
        },

        _parar() {
            animando = false;
            if (ctx && lienzo) ctx.clearRect(0, 0, lienzo.width, lienzo.height);
            gotas = [];
        },

        /**
         * El sonido de la lluvia y el trueno.
         *
         * `SFXClip` trae `lightRain`, `heavyRain` y tres `lightning`, y el port los tenia
         * extraidos sin disparar ninguno. El bucle cambia solo cuando cambia el estado
         * — empieza a llover, arrecia, para —, no en cada cuadro; y el trueno solo suena
         * con lluvia FUERTE, cada tanto.
         *
         * La nieve (`tipo === 2`) no tiene sonido propio en el volcado, asi que no suena.
         */
        _sonido(antes, ahora) {
            const S = window.PlaySfx;
            if (!S) return;
            const lluvia = (e) => !!(e && e.activo && e.tipo === 1);
            const clave = (e) => (lluvia(e) ? (e.fuerte ? 'heavyRain' : 'lightRain') : null);
            const a = clave(antes), b = clave(ahora);
            if (a !== b) {
                if (a && typeof S.parar === 'function') S.parar(a);
                if (b) S.sonar(b, { bucle: true, volumen: 0.35 });
            }

            // El trueno: solo con lluvia fuerte, y no mas de uno cada veinte segundos.
            if (!(lluvia(ahora) && ahora.fuerte)) { truenoProximo = 0; return; }
            const t = Date.now();
            if (!truenoProximo) { truenoProximo = t + 8000 + Math.random() * 20000; return; }
            if (t < truenoProximo) return;
            truenoProximo = t + 20000 + Math.random() * 40000;
            S.sonar(['lightning', 'lightning2', 'lightning3'][Math.floor(Math.random() * 3)],
                    { volumen: 0.5 });
        },

        _paso(ms) {
            if (!animando || !ctx || !lienzo) return;
            const dt = ultimoMs ? Math.min(100, ms - ultimoMs) : 16;
            ultimoMs = ms;
            API._pintar(dt);
            requestAnimationFrame(API._paso);
        },

        _pintar(dt) {
            const est = estadoActual;
            if (!est || !est.activo) return;
            const W = lienzo.width, H = lienzo.height;
            if (!W || !H) return;

            // La intensidad sube y baja con el progreso: entra y sale suave.
            const env = Math.sin(Math.PI * Math.max(0, Math.min(1, est.progreso)));
            const nieve = est.tipo === 2;
            const suave = API.movimientoReducido() ? 0.35 : 1;
            const objetivo = Math.round((nieve ? 90 : 160) * (est.fuerte ? 2.2 : 1)
                                        * (0.25 + 0.75 * env) * suave * (W * H) / (1400 * 900));

            // Gota y copo no son la misma partícula: una lleva velocidad lateral y el
            // otro radio. Al cambiar de tiempo hay que rehacerlas o se pintan vacías.
            if (API._ultimoTipo !== est.tipo) { gotas = []; API._ultimoTipo = est.tipo; }

            while (gotas.length < objetivo) gotas.push(nueva(W, H, nieve));
            if (gotas.length > objetivo) gotas.length = objetivo;

            ctx.clearRect(0, 0, W, H);
            const paso = dt / 16.67;

            if (nieve) {
                ctx.fillStyle = 'rgba(255,255,255,0.85)';
                for (const p of gotas) {
                    p.y += p.vy * paso;
                    p.x += Math.sin((p.y + p.fase) * 0.02) * p.amp * paso;
                    if (p.y > H) { p.y = -10; p.x = Math.random() * W; }
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                    ctx.fill();
                }
            } else {
                ctx.strokeStyle = est.fuerte ? 'rgba(190,215,240,0.55)' : 'rgba(200,225,245,0.40)';
                ctx.lineWidth = est.fuerte ? 1.6 : 1.1;
                ctx.beginPath();
                for (const p of gotas) {
                    p.y += p.vy * paso;
                    p.x += p.vx * paso;
                    if (p.y > H) { p.y = -20; p.x = Math.random() * (W + 200) - 100; }
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(p.x - p.vx * 2.2, p.y - p.vy * 2.2);
                }
                ctx.stroke();
            }
        },
    };

    function nueva(W, H, nieve) {
        if (nieve) {
            return { x: Math.random() * W, y: Math.random() * H,
                     vy: 0.5 + Math.random() * 1.1, r: 1 + Math.random() * 2,
                     amp: 0.3 + Math.random() * 0.8, fase: Math.random() * 1000 };
        }
        return { x: Math.random() * (W + 200) - 100, y: Math.random() * H,
                 vx: -2.2 - Math.random() * 0.8, vy: 11 + Math.random() * 6 };
    }

    window.Weather = API;

    /**
     * El clima tiene que seguir a la luz exactamente: mismo reloj, mismo mapa, mismos
     * momentos. app.js llama a `Lighting.apply` en trece sitios distintos, así que en
     * vez de tocarlos uno a uno se envuelve la función: un solo punto de enganche y
     * app.js se queda como está.
     */
    function engancharALaLuz() {
        const L = window.Lighting;
        if (!L || L.__conClima) return false;
        const original = L.apply.bind(L);
        L.apply = function (clock, mapId) {
            const r = original(clock, mapId);
            try { API.apply(clock, mapId); } catch (e) { console.warn('[Weather]', e); }
            return r;
        };
        L.__conClima = true;
        return true;
    }

    document.addEventListener('DOMContentLoaded', () => {
        API.load().then(() => {
            asegurarCapas();
            if (!engancharALaLuz()) {
                // Lighting aún no está: se reintenta unas cuantas veces y se deja estar.
                let intentos = 0;
                const t = setInterval(() => {
                    if (engancharALaLuz() || ++intentos > 20) clearInterval(t);
                }, 250);
            }
            if (window.app && window.app.map) {
                const sel = document.getElementById('select-location');
                API.apply(null, sel ? parseInt(sel.value, 10) : 0);
            }
        });
    });
})();
