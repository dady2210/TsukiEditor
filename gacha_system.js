// gacha_system.js — la máquina de gacha del Ayuntamiento, jugable.
//
// La máquina es el mueble 344 ("GachaBoy"), y la coloca el juego, no el jugador:
// está en el layout fijo de la sublocation 8, celda (12,12). Ver GACHA.md.
//
// Lo que es del juego (tools/extract_gacha.py -> data/gacha.json):
//   · 5 colecciones de 19 premios cada una, siempre con el mismo reparto:
//     10 Common, 5 Rare, 3 Epic, 1 Legendary. "Pocket Lands" tiene `forcedDraw`.
//   · `force = 10` y 10 bolas por máquina.
//   · Los 23 recortes del atlas: cuerpo, tapa, 10 fotogramas de bola normal,
//     10 de bola dorada y la máquina rota.
//   · `GachaponSave` guarda `lastRolledDay`, `hits` y la posición de cada bola.
//
// Las probabilidades YA NO son nuestras. Estaban inventadas —60/27/11/2— y no se
// parecían: el juego reparte **88 / 7 / 4 / 1**. Con las de antes salía un legendario
// cada 50 tiradas en vez de cada 100, y un raro cada cuatro en vez de cada catorce.
//
// No estaban en `GetRarity()`, que efectivamente no viene en el dump, sino en
// `Gachapon::RollGacha`, que es quien tira:
//
//     x = Random.Range(0, 100)
//     rareza = (x < 5) ? ((x < 1) ? Legendary : Epic)
//                      : ((x < 12) ? Rare : Common)
//
// Los saca `tools/extract_gacha_code.py` a `data/gacha_code.json`, desensamblando: los
// cortes son inmediatos de `fmov` dentro del cuerpo, no literales en memoria.
//
// Las bolas ruedan con una física simple dentro de la urna, en su propio lienzo, para
// no meterse en la copia de paneo ni en el horneado del fondo de map.js.

(function () {
    'use strict';

    const MUEBLE_GACHA = 344;
    const MUEBLE_GACHA_SP = 1932;
    const N_BOLAS = 10;

    // El reparto de premios de cada colección es 10/5/3/1 de 19, pero la tirada NO va
    // por ahí: va por los cortes de `RollGacha`, que son otros. Se cargan de
    // `data/gacha_code.json`; los de aquí son el respaldo por si no llega el fichero, y
    // son los mismos valores.
    const CORTES_RESPALDO = [
        { rareza: 3, menorQue: 1 },    // Legendary   1 %
        { rareza: 2, menorQue: 5 },    // Epic        4 %
        { rareza: 1, menorQue: 12 },   // Rare        7 %
        { rareza: 0, menorQue: null }, // Common     88 %
    ];
    const RAREZA_POR_NOMBRE = { Common: 0, Rare: 1, Epic: 2, Legendary: 3 };
    let cortes = CORTES_RESPALDO;

    const API = {
        data: null,
        bolas: [],
        _lienzo: null,
        _ctx: null,
        _animando: false,
        _ultimo: 0,
        _maquina: null,          // el placement de la máquina en pantalla
        _sacudida: 0,

        async load() {
            if (this.data) return this.data;
            try {
                const r = await fetch('/data/gacha.json');
                this.data = r.ok ? await r.json() : null;
            } catch (e) {
                this.data = null;
            }
            return this.data;
        },

        get sets() { return (this.data && this.data.sets) || []; },

        // ── el save ──────────────────────────────────────────────────────

        /** GachaponSave del mueble: {lastRolledDay, hits, balls[]}. */
        saveDe(placement) {
            const p = window.app && window.app.parser;
            if (!p || !placement) return null;
            if (typeof p.getGachaponSave === 'function') return p.getGachaponSave(placement);
            return null;
        },

        golpes(placement) {
            const s = this.saveDe(placement);
            return s ? (s.hits | 0) : 0;
        },

        // ── sorteo ───────────────────────────────────────────────────────

        /**
         * La rareza de una tirada, tal cual la decide `Gachapon::RollGacha`.
         *
         * OJO CON EL RANGO: `Random.Range(0, 100)` da un número entre 0 y 100, no entre
         * 0 y 1. Los cortes están en esa escala —1, 5 y 12— y compararlos contra un
         * `Math.random()` de 0 a 1 haría que todo saliera legendario.
         */
        rarezaAlAzar(tirada) {
            const x = (tirada == null ? Math.random() * 100 : tirada);
            for (const c of cortes) {
                if (c.menorQue == null || x < c.menorQue) return c.rareza;
            }
            return 0;
        },

        /** Mete los cortes leídos del binario. Lo llama `cargarCodigo()`. */
        usarCortes(lista) {
            if (!Array.isArray(lista) || !lista.length) return cortes;
            cortes = lista.map(c => ({
                rareza: (typeof c.rareza === 'number') ? c.rareza
                      : (RAREZA_POR_NOMBRE[c.rareza] != null ? RAREZA_POR_NOMBRE[c.rareza] : 0),
                menorQue: (c.menorQue == null) ? null : Number(c.menorQue),
            }));
            return cortes;
        },

        get cortes() { return cortes; },

        /** Los cortes de verdad, del binario. */
        async cargarCodigo() {
            try {
                const r = await fetch('data/gacha_code.json');
                if (!r.ok) return false;
                const j = await r.json();
                this.usarCortes(j.cortes);
                return true;
            } catch (e) { return false; }
        },

        /**
         * Una tirada. `setID` elige la colección; si no se dice, la primera.
         * Devuelve el premio {furnitureID, rarity, ...} o null si no hay datos.
         */
        tirar(setID) {
            const sets = this.sets;
            if (!sets.length) return null;
            const set = sets[Math.max(0, Math.min(sets.length - 1, setID | 0))];
            const premios = set.gachapon || [];
            if (!premios.length) return null;

            // Primer tiro trucado: algunas colecciones fuerzan el premio inicial.
            const p = window.app && window.app.parser;
            const tiradas = p && typeof p.getCounter === 'function' ? p.getCounter('gachaRolled') : 0;
            if (set.forcedDraw && tiradas === 0) {
                const forzado = premios.find(g => g.ID === (set.forcedFirstGacha | 0));
                if (forzado) return Object.assign({ setName: set.name, forzado: true }, forzado);
            }

            const rareza = this.rarezaAlAzar();
            let candidatos = premios.filter(g => g.rarity === rareza);
            if (!candidatos.length) candidatos = premios;
            const g = candidatos[Math.floor(Math.random() * candidatos.length)];
            return Object.assign({ setName: set.name, forzado: false }, g);
        },

        /** Tirada completa: cobra el tiro, da el premio y actualiza contadores. */
        usar(placement, setID) {
            const p = window.app && window.app.parser;
            if (!p) return { ok: false, motivo: 'sin partida cargada' };
            const premio = this.tirar(setID);
            if (!premio) return { ok: false, motivo: 'no hay datos de premios' };

            if (typeof p.injectInventoryItem === 'function') {
                try { p.injectInventoryItem(premio.furnitureID, 1, false, 1); }
                catch (e) { console.warn('[Gacha] no pude dar el premio:', e); }
            }
            // A la colección: si es la primera vez, el juego lo marca como nuevo.
            premio.nuevo = !!(window.Progress && window.Progress.anotar(premio.furnitureID));
            if (typeof p.bumpCounter === 'function') p.bumpCounter('gachaRolled', 1);
            this.soltarBola(true);
            // `SFXClip.GachaRevealRare`: el premio raro tiene su propio sonido. La rareza
            // ya la calcula `tirar()` con los cortes del binario (88/7/4/1), asi que no
            // hay que adivinarla: Rare, Epic y Legendary son 1, 2 y 3.
            // El campo es `rarity`, que es como viene del dato del gachapon; `rareza` es
            // solo el nombre de la variable local de `tirar()`.
            if (window.PlaySfx && Number(premio.rarity) >= 1) {
                window.PlaySfx.sonar('gachaRevealRare');
            }
            // `GachaPopup`: en el juego la bola se abre y ensenya lo que ha tocado. Es la
            // ventana de level14; si esta montada, se abre con el premio dentro.
            if (window.PlayPopups && typeof window.PlayPopups.gacha === 'function') {
                window.PlayPopups.gacha([premio.furnitureID]);
            }
            return { ok: true, premio };
        },

        /** Golpear la máquina: cuenta, y a partir de cierto punto Benny se queja. */
        golpear(placement) {
            const p = window.app && window.app.parser;
            const s = this.saveDe(placement);
            const n = (s ? s.hits | 0 : 0) + 1;
            if (p && typeof p.setGachaponHits === 'function') p.setGachaponHits(placement, n);
            this._sacudida = 1;
            // `SFXClip.GachaBoyImpact` al golpear, y `GachaBoyBreak` cuando ya son tres y
            // Benny se queja. Los dos `gachaTap` son los de tocar la maquina sin fuerza,
            // que el port no distingue: se usa `gachaTap1` y `gachaTap2` alterna.
            if (window.PlaySfx) {
                window.PlaySfx.sonar('gachaBoyImpact');
                window.PlaySfx.sonar(n % 2 ? 'gachaTap1' : 'gachaTap2');
                if (n >= 3) window.PlaySfx.sonar('gachaBoyBreak');
            }
            this.soltarBola(false);
            return { hits: n, regana: n >= 3 };
        },

        // ── bolas ────────────────────────────────────────────────────────

        _asegurarLienzo() {
            if (this._lienzo) return true;
            const cont = document.querySelector('.canvas-container');
            if (!cont) return false;
            let c = document.getElementById('gacha-canvas');
            if (!c) {
                c = document.createElement('canvas');
                c.id = 'gacha-canvas';
                // por encima del clima (7), por debajo del HUD
                c.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:8;display:none;';
                cont.appendChild(c);
            }
            this._lienzo = c;
            this._ctx = c.getContext('2d');
            return true;
        },

        /** Coloca las bolas dentro de la urna, con posiciones estables por máquina. */
        _nacerBolas(cx, cy, radio) {
            this.bolas = [];
            for (let i = 0; i < N_BOLAS; i++) {
                const a = (i / N_BOLAS) * Math.PI * 2;
                this.bolas.push({
                    x: cx + Math.cos(a) * radio * 0.5,
                    y: cy + Math.sin(a) * radio * 0.3,
                    vx: (Math.random() - 0.5) * 1.2,
                    vy: (Math.random() - 0.5) * 1.2,
                    dorada: i === 0,           // una dorada por urna, como el juego
                    frame: Math.floor(Math.random() * 10),
                });
            }
        },

        soltarBola(premiada) {
            this._sacudida = Math.max(this._sacudida, premiada ? 1.4 : 0.8);
            for (const b of this.bolas) {
                b.vx += (Math.random() - 0.5) * 8;
                b.vy -= Math.random() * 6;
            }
        },

        /** Llamado desde map.js en cada dibujado: dónde está la máquina en pantalla. */
        situar(placement, pantallaX, pantallaY, escala) {
            const antes = this._maquina;
            this._maquina = { placement, x: pantallaX, y: pantallaY, s: escala };
            if (!this._asegurarLienzo()) return;
            const c = this._lienzo, mapa = document.getElementById('map-canvas');
            if (mapa && (c.width !== mapa.width || c.height !== mapa.height)) {
                c.width = mapa.width; c.height = mapa.height;
            }
            c.style.display = 'block';
            const radio = 26 * escala;
            if (!this.bolas.length) {
                const cy = pantallaY - radio * 0.6;
                const guardadas = this._bolasGuardadas(placement, pantallaX, cy, escala);
                if (guardadas && guardadas.length) this.bolas = guardadas;
                else this._nacerBolas(pantallaX, cy, radio);
            } else if (antes) {
                // Las bolas viven en coordenadas de pantalla: al mover la cámara o al
                // hacer zoom hay que arrastrarlas con la máquina, o se quedarían
                // flotando donde estaba antes.
                const k = antes.s ? escala / antes.s : 1;
                const dx = pantallaX - antes.x, dy = pantallaY - antes.y;
                if (dx || dy || k !== 1) {
                    for (const b of this.bolas) {
                        b.x = pantallaX + (b.x - antes.x) * k;
                        b.y = pantallaY + (b.y - antes.y) * k;
                    }
                }
            }
            this._arrancar();
        },

        ocultar() {
            this._guardarBolas();
            this._animando = false;
            this._maquina = null;
            if (this._lienzo) this._lienzo.style.display = 'none';
            if (this._ctx && this._lienzo) this._ctx.clearRect(0, 0, this._lienzo.width, this._lienzo.height);
        },

        _arrancar() {
            if (this._animando) return;
            this._animando = true;
            this._ultimo = 0;
            requestAnimationFrame(API._paso);
        },

        _paso(ms) {
            if (!API._animando) return;
            const dt = API._ultimo ? Math.min(60, ms - API._ultimo) : 16;
            API._ultimo = ms;
            API._fisica(dt / 16.67);
            API._pintar();
            requestAnimationFrame(API._paso);
        },

        _fisica(paso) {
            const m = this._maquina;
            if (!m) return;
            const radio = 26 * m.s;
            const cx = m.x, cy = m.y - radio * 0.6;
            const rBola = 3.2 * m.s;
            const ACHATADO = 1.15;          // la urna se ve como una elipse
            this._sacudida *= 0.90;

            // 1. integrar
            for (const b of this.bolas) {
                b.vy += 0.55 * paso;                       // gravedad
                if (this._sacudida > 0.02) {
                    b.vx += (Math.random() - 0.5) * this._sacudida * 3;
                    b.vy += (Math.random() - 0.5) * this._sacudida * 3;
                }
                b.x += b.vx * paso;
                b.y += b.vy * paso;
                b.vx *= 0.99; b.vy *= 0.99;
            }

            // 2. resolver restricciones. Hay que ITERAR y dejar la pared para el
            // final de cada vuelta: separando bolas se empujan unas a otras fuera de
            // la urna, y con una sola pasada quedaban solapes y bolas por fuera.
            const d2 = rBola * 2, lim = radio - rBola;
            // 8 vueltas: con 4 quedaba alguna solapa suelta cuando las diez se
            // apelotonan. Son 45 pares, asi que sigue siendo nada de trabajo.
            for (let it = 0; it < 8; it++) {
                // 2a. entre bolas
                for (let i = 0; i < this.bolas.length; i++) {
                    for (let j = i + 1; j < this.bolas.length; j++) {
                        const a = this.bolas[i], c = this.bolas[j];
                        let dx = c.x - a.x, dy = c.y - a.y;
                        let d = Math.hypot(dx, dy);
                        if (d >= d2) continue;
                        if (d < 1e-6) { dx = (Math.random() - 0.5) || 0.01; dy = 0.01; d = Math.hypot(dx, dy); }
                        const nx = dx / d, ny = dy / d;
                        const solape = (d2 - d) / 2;
                        a.x -= nx * solape; a.y -= ny * solape;
                        c.x += nx * solape; c.y += ny * solape;
                        if (it > 0) continue;              // el impulso, una sola vez
                        const va = a.vx * nx + a.vy * ny;
                        const vc = c.vx * nx + c.vy * ny;
                        if (vc - va >= 0) continue;        // ya se separan
                        const imp = (vc - va) * 0.85;
                        a.vx += imp * nx; a.vy += imp * ny;
                        c.vx -= imp * nx; c.vy -= imp * ny;
                    }
                }
                // 2b. la urna, que manda sobre lo anterior
                for (const b of this.bolas) {
                    const dx = b.x - cx, dy = (b.y - cy) * ACHATADO;
                    const d = Math.hypot(dx, dy);
                    if (d <= lim || d === 0) continue;
                    const nx = dx / d, ny = dy / d;
                    b.x = cx + nx * lim;
                    b.y = cy + (ny * lim) / ACHATADO;
                    if (it > 0) continue;
                    const vn = b.vx * nx + b.vy * ny;
                    b.vx -= 1.5 * vn * nx;
                    b.vy -= 1.5 * vn * ny;
                    b.vx *= 0.7; b.vy *= 0.7;
                }
            }

            // 3. el fotograma es la rotacion, igual que GachaBallObject.UpdateSprite
            for (const b of this.bolas) {
                b.frame = (b.frame + Math.hypot(b.vx, b.vy) * 0.25 * paso) % 10;
            }
        },

        // ── persistencia ─────────────────────────────────────────────────
        //
        // `GachaponSave.balls` guarda {golden, used, position} de cada bola, y
        // `Gachapon.SaveBalls()` lo escribe al soltar la maquina. Aqui las bolas viven
        // en coordenadas de pantalla, asi que se convierten a un desplazamiento local
        // respecto al centro de la urna y dividido por la escala: asi sobreviven al
        // zoom y al paneo.

        _guardarBolas() {
            const m = this._maquina;
            const p = window.app && window.app.parser;
            if (!m || !p || typeof p.setGachaponBalls !== 'function' || !this.bolas.length) return;
            const radio = 26 * m.s;
            const cx = m.x, cy = m.y - radio * 0.6;
            const esc = m.s || 1;
            try {
                p.setGachaponBalls(m.placement, this.bolas.map(b => ({
                    x: (b.x - cx) / esc, y: (b.y - cy) / esc, z: 0, golden: !!b.dorada,
                })));
            } catch (e) { /* el mueble puede no estar en el save */ }
        },

        /** ¿Hay posiciones guardadas para esta máquina? Devuelve las bolas o null. */
        _bolasGuardadas(placement, cx, cy, esc) {
            const s = this.saveDe(placement);
            if (!s || !s.balls || !s.balls.length) return null;
            return s.balls.map((b, i) => ({
                x: cx + (Number(b.x) || 0) * esc,
                y: cy + (Number(b.y) || 0) * esc,
                vx: 0, vy: 0,
                dorada: !!b.golden,
                frame: i % 10,
            }));
        },

        _pintar() {
            const m = this._maquina, ctx = this._ctx;
            if (!m || !ctx || !this._lienzo) return;
            ctx.clearRect(0, 0, this._lienzo.width, this._lienzo.height);
            const tam = 7 * m.s;
            for (const b of this.bolas) {
                const img = this._sprite(b.dorada
                    ? 'Gachaboy_' + (12 + Math.floor(b.frame))
                    : 'Gachaboy_' + (2 + Math.floor(b.frame)));
                if (img && img.complete && img.naturalWidth) {
                    ctx.drawImage(img, b.x - tam, b.y - tam, tam * 2, tam * 2);
                } else {
                    ctx.fillStyle = b.dorada ? '#f4d03f' : '#7fb3d5';
                    ctx.beginPath(); ctx.arc(b.x, b.y, tam, 0, Math.PI * 2); ctx.fill();
                }
            }
        },

        _cacheSprites: {},
        _sprite(nombre) {
            if (this._cacheSprites[nombre] !== undefined) return this._cacheSprites[nombre];
            const img = new Image();
            img.onerror = () => { this._cacheSprites[nombre] = null; };
            img.src = 'images/gacha/' + nombre + '.png';
            this._cacheSprites[nombre] = img;
            return img;
        },

        esGacha(itemId) { return itemId === MUEBLE_GACHA || itemId === MUEBLE_GACHA_SP; },
    };

    window.Gacha = API;
    document.addEventListener('DOMContentLoaded', () => {
        API.load();
        // Los cortes de `RollGacha`. Sin esto se usan los del respaldo, que son los
        // mismos, pero pedirlos deja que se corrijan sin tocar el módulo.
        API.cargarCodigo();
    });
})();
