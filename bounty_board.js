/* bounty_board.js — el tablón del ayuntamiento, con su ventana de verdad.
 *
 * ────────────────────────────────────────────────────────────────────────────
 *  LO QUE HABIA, Y POR QUE NO VALIA
 * ────────────────────────────────────────────────────────────────────────────
 * `bounty_system.js` dibujaba un tablón de corcho hecho a mano y **se inventaba los datos**:
 * una lista de 68 peces escrita a mano con recompensas a ojo (120, 150, 1000…) repartidas en
 * tres niveles, y un LCG por día OA que elegía "uno común, uno poco común y uno raro".
 *
 * Nada de eso está en el juego. Lo que hay es esto:
 *
 *   `BountyBoardSave::RollBounties` (0x58e62d4)
 *       this.rollDate = fecha
 *       validos = BountyBoardObject.ValidBountyFish(...)
 *       por cada uno de los expositores del tablón:
 *           r = Random.Range(0, validos.Count)
 *           nuevo BountySave { fishID = validos[r].ID }
 *           validos.RemoveAt(r)              // SIN REPETICION
 *
 *   `BountyBoardObject::ValidBountyFish` (0x58e5b0c)
 *       aguas = IsUnlocked(11) ? Sea|River : Sea
 *       if (IsUnlocked(5)) aguas |= Pond
 *       de todos los objetos: los `Fish` que NO son internos, que NO son de rareza 3
 *       (legendarios), cuyo `waterType` cruza con `aguas`, y que no estén bloqueados.
 *
 *   `BountyBoardObject::Roll` (0x58e6208), que es quien llama al sorteo:
 *       save.RollBounties(fecha, this)
 *       noticia = NewspaperEntry.CurrentSave.GetNewspaper()
 *       if (noticia != null && noticia.entryType == 2)     // 2 = Fish
 *           save.bountySaves.First().fishID = noticia.fishID
 *
 *     O sea que el PRIMER encargo lo pisa el pez del periódico del día. Eso es lo que pone
 *     un LEGENDARIO en el tablón aunque `ValidBountyFish` los excluya, y por eso sale en el
 *     papel dorado. Comprobado contra el save de la captura: el diario del día es el 146
 *     («¡Un tigre acecha en el río!», `entryType` 2, `fishID` 120) y el primer encargo es
 *     el Pez Tigre, rareza 3, premio 1500. Los 15 periódicos de tipo `Fish` son justo los
 *     15 que traen `fishID`.
 *
 *   `Bounty::Claim` (0x58e1f24)
 *       inventario.Remove(pez, 1)
 *       TsukiSave.<0x160>++                              // los encargos reclamados
 *       Stamp.Animate()
 *       CarrotHandler.AddCarrots(precio * 5)             // `add w1, w0, w0, lsl #2`
 *       TsukiSave.Save()
 *
 * ────────────────────────────────────────────────────────────────────────────
 *  Y EL PRECIO DE UN PEZ NO ES SU CAMPO `price`
 * ────────────────────────────────────────────────────────────────────────────
 * `Fish::get_Price` (0x5915a48) lo REDEFINE y se salta el campo guardado:
 *
 *       if (IsLegendary) return 300;
 *       return (rarity <= 3) ? [20, 50, 120, 300][rarity] : 0;
 *
 * con la tabla en 0x11dfe10. Y el campo `price` del objeto no cuadra con eso en **45 de los
 * 119 peces**: es dato muerto, como los valores de los materiales.
 *
 * O sea que la recompensa del tablón sólo puede ser **100, 250 o 600** zanahorias —los
 * legendarios no salen—, no los 120..1000 repartidos a ojo que había.
 *
 * ────────────────────────────────────────────────────────────────────────────
 *  LA VENTANA
 * ────────────────────────────────────────────────────────────────────────────
 * La saca `tools/cs_ui_popup` de `level8` a `data/ui_bountyboard.json`, y sus texturas
 * `tools/exportar_sprites_ui.py` a `images/ui/bountyboard/`. La dibuja `ui_render.js` con
 * las medidas de `RectTransform` de la escena. Lo que hay dentro:
 *
 *   BoardBottom      `bountyBoard_0`   el corcho, 880×771
 *   BoardTop         `bountyBoard_1`   el cartel de arriba, 770×246
 *   Image (2)        `bountyBoard_2`   la chincheta
 *   Natto            `nattoBacking_0`  + la imagen del Natto, que sale de las semanas jugadas
 *   BountyPoster ×3  `boardExtras_3`   el papel (el legendario sería `boardExtras_0`)
 *       FishName / Icon / Value / Claimed (`boardExtras_8`, el sello)
 *   Newspaper        `newspaperBacking` + la foto del evento y el titular
 *   Stamp            el sello que cae al reclamar
 *   GameObject/Button `boardExtras_1` + el tiempo que queda
 *
 * El texto del valor es la constante `Bounty.ValueText = "<sprite index=43 tint=1>{0}"`: ese
 * sprite 43 del atlas de TMP es el icono de zanahoria, y aquí se pone la imagen.
 *
 * ────────────────────────────────────────────────────────────────────────────
 *  EL PERIODICO, QUE TAMBIEN ES DEL TABLON
 * ────────────────────────────────────────────────────────────────────────────
 * `BountyBoard::LoadNewspaper` (0x58e3430) recorre `TsukiSave.newspapers` de atrás hacia
 * delante y se queda con el ULTIMO cuyo día sea menor o igual que `CastleTime.LegitDay`: o
 * sea, el periódico más reciente que ya haya salido. Su foto y su titular salen de
 * `data/newspapers.full.json`, que el port ya tenía con los 214 y sus imágenes en
 * `images/newspapers/`.
 *
 * ────────────────────────────────────────────────────────────────────────────
 *  LO QUE NO SE MODELA, Y SE DICE
 * ────────────────────────────────────────────────────────────────────────────
 *   · `IsUnlocked(11)` e `IsUnlocked(5)` son ubicaciones del juego. El port no lleva la
 *     cuenta de qué ubicaciones están desbloqueadas, así que por defecto se dan por
 *     desbloqueadas las tres aguas y se deja `aguas()` para ajustarlo. Con las tres, el
 *     conjunto válido son los 104 peces no legendarios.
 *   · El `Stamp` del juego es un SpriteRenderer con su sistema de partículas. Aquí el sello
 *     es la imagen `boardExtras_8` que ya está en el papel, apareciendo con la misma
 *     animación de caída.
 *   · Los `LayoutGroup` del periódico recolocan en ejecución; se usan las medidas de
 *     diseño de la escena (ver `ui_render.js`).
 */
(function (global) {
    'use strict';

    // ── Del binario ─────────────────────────────────────────────────────────
    const PRECIO_POR_RAREZA = [20, 50, 120, 300];   // tabla en 0x11dfe10
    const PRECIO_LEGENDARIO = 300;                  // `mov w0, #0x12c`
    const MULT_RECOMPENSA = 5;                      // `add w1, w0, w0, lsl #2`
    const RAREZA_LEGENDARIA = 3;                    // los que NO salen en el tablón
    const AGUA = { MAR: 2, ESTANQUE: 4, RIO: 8, ARRECIFE: 16 };
    const SUBLOC_AYUNTAMIENTO = 8;

    let ui = null;        // data/ui_bountyboard.json
    let peces = null;     // data/fishing.json
    let diarios = null;   // data/newspapers.full.json
    let eventos = null;   // data/events.json
    let volantes = null;  // data/event_flyers.json
    let natto = null;     // data/natto.json
    let flyerUI = null;   // data/ui_eventflyer.json
    let panel = null;

    const RUTA_UI = 'images/ui/bountyboard/';
    // El ancho del recorte del periódico en el tablón: su `sizeDelta.x`, que sí está.
    const ANCHO_PERIODICO = 766.8;

    async function cargar() {
        const uno = async (u) => { const r = await fetch(u); return r.ok ? r.json() : null; };
        try {
            if (!ui) ui = await uno('data/ui_bountyboard.json');
            if (!peces) peces = await uno('data/fishing.json');
            if (!diarios) diarios = global.NEWSPAPERS_FULL || await uno('data/newspapers.full.json');
            if (!eventos) eventos = await uno('data/events.json');
            if (!volantes) volantes = await uno('data/event_flyers.json');
            if (!natto) natto = await uno('data/natto.json');
            if (!flyerUI) flyerUI = await uno('data/ui_eventflyer.json');
        } catch (e) { /* sin datos: `abrir` avisa */ }
        return !!(ui && peces);
    }

    function usarDatos(d) {
        if (d.ui) ui = d.ui;
        if (d.peces) peces = d.peces;
        if (d.diarios) diarios = d.diarios;
        if (d.eventos) eventos = d.eventos;
        if (d.volantes) volantes = d.volantes;
        if (d.natto) natto = d.natto;
        if (d.flyerUI) flyerUI = d.flyerUI;
        return !!(ui && peces);
    }

    /**
     * Las aguas de las que puede salir un encargo.
     *
     * `ValidBountyFish` las saca de dos ubicaciones desbloqueadas. El port no lleva esa
     * cuenta, así que se dan por desbloqueadas las tres; `PlayBountyBoard.aguas = n` lo
     * cambia si algún día se lleva.
     */
    let mascaraAguas = AGUA.MAR | AGUA.RIO | AGUA.ESTANQUE;

    /** `BountyBoardObject::ValidBountyFish`. */
    function pecesValidos() {
        if (!peces || !peces.peces) return [];
        return peces.peces.filter(f => f.rareza !== RAREZA_LEGENDARIA
                                    && (Number(f.agua) & mascaraAguas) !== 0);
    }

    /** `Fish::get_Price`: la tabla por rareza, NO el campo `precio` del objeto. */
    function precioDelPez(f) {
        if (!f) return 0;
        const r = Number(f.rareza);
        if (r === RAREZA_LEGENDARIA) return PRECIO_LEGENDARIO;
        return (r >= 0 && r < PRECIO_POR_RAREZA.length) ? PRECIO_POR_RAREZA[r] : 0;
    }

    /** Lo que paga el tablón: el precio por cinco. */
    function recompensa(fishId) {
        return precioDelPez(pezDe(fishId)) * MULT_RECOMPENSA;
    }

    function pezDe(id) {
        if (!peces || !peces.peces) return null;
        return peces.peces.find(f => Number(f.id) === Number(id)) || null;
    }

    function nombreDelPez(id) {
        const db = global.ITEMS_DB;
        const it = db && db[String(id)];
        return (it && (it.name_es || it.name_en)) || ('Pez ' + id);
    }

    /**
     * `BountyBoardSave::RollBounties`: tantos como expositores, sin repetición.
     * Devuelve [{ fishID, claimed:false }].
     */
    function sortear(cuantos) {
        const validos = pecesValidos().slice();
        const fuera = [];
        for (let i = 0; i < cuantos && validos.length; i++) {
            const r = Math.floor(Math.random() * validos.length);   // `Random.Range(0, n)`
            fuera.push({ fishID: Number(validos[r].id), claimed: false });
            validos.splice(r, 1);                                   // `RemoveAt(r)`
        }
        // `BountyBoardObject::Roll`: si el periódico del día es de tipo `Fish` (2), su pez
        // PISA al primer encargo. Es lo que mete un legendario en el tablón.
        const d = diarioDelTablon();
        if (d && Number(d.entryType) === 2 && d.fishID && fuera.length) {
            fuera[0].fishID = Number(d.fishID);
        }
        return fuera;
    }

    /** El texto que la escena tiene puesto en un nodo, si lo tiene. */
    function textoDe(r, ruta) {
        const n = r.porRuta[ruta];
        return n ? (n.textContent || '') : '';
    }

    /** El pez que el periódico del día impone, o null. */
    function pezDelDiario() {
        const d = diarioDelTablon();
        return (d && Number(d.entryType) === 2 && d.fishID) ? Number(d.fishID) : null;
    }

    // ── El evento de aldea, que es el botón de la esquina ────────────────────

    /**
     * `BountyBoard::LoadBounties` consulta `VillageEvent::Check` y `get_EventDates`, y con
     * `CastleExtensions::SimpleLongSpanFormat` escribe la cuenta atrás del rincón.
     *
     * O sea: el botón **no sale siempre**. Sale cuando hay un evento de aldea en marcha —y
     * entonces cuenta lo que le queda— o cuando viene uno —y cuenta lo que falta—. Su
     * pegatina es el `bountyBoardSticker` de ese evento.
     *
     * En el save de la captura el reloj marca día 28 del mes 9, y `EVENT_WILD_WEST` (Salvaje
     * Oeste) va del 12/09 al 30/09: por eso sale su pegatina con «1 día 11 horas».
     */
    function eventoDeHoy() {
        if (!eventos || !Array.isArray(eventos.events)) return null;
        const c = (global.GameTime && global.GameTime.now) ? global.GameTime.now() : null;
        if (!c) return null;
        // OJO: `getClock().day` es el DIA OA -días desde 1899-12-30-, no el del mes. Usarlo
        // tal cual daba 46293 y ningún evento casaba nunca. El día del mes sale de ahí.
        const f = fechaDeOA(Number(c.day));
        const dia = f ? f.dia : (Number(c.day) | 0);
        const mes = f ? f.mes : (Number(c.month) | 0);
        const hora = Number(c.hour) | 0, minuto = Number(c.minute) | 0;

        // Un rango puede cruzar el fin de año (Navidad no, pero Año Nuevo Lunar sí).
        const dentro = (e) => {
            const a = e.from.month * 100 + e.from.day, b = e.to.month * 100 + e.to.day;
            const h = mes * 100 + dia;
            return (a <= b) ? (h >= a && h < b) : (h >= a || h < b);
        };
        const activo = eventos.events.find(dentro);
        if (activo) {
            return { evento: activo, enMarcha: true,
                     falta: restaHasta(activo.to, dia, mes, hora, minuto) };
        }
        // El siguiente: el de fecha de inicio más cercana por delante.
        let mejor = null, mejorD = Infinity;
        for (const e of eventos.events) {
            const d = diasHasta(e.from, dia, mes);
            if (d >= 0 && d < mejorD) { mejor = e; mejorD = d; }
        }
        if (!mejor) return null;
        return { evento: mejor, enMarcha: false,
                 falta: restaHasta(mejor.from, dia, mes, hora, minuto) };
    }

    const DIAS_MES = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

    /** Del día OA al día y mes del calendario. La época OA es el 1899-12-30. */
    function fechaDeOA(oa) {
        const n = Number(oa);
        if (!isFinite(n) || n < 1000) return null;
        const d = new Date(Date.UTC(1899, 11, 30) + n * 86400000);
        return { dia: d.getUTCDate(), mes: d.getUTCMonth() + 1, anyo: d.getUTCFullYear() };
    }

    function diasHasta(f, dia, mes) {
        let n = 0;
        let d = dia, m = mes;
        for (let g = 0; g < 400; g++) {
            if (m === f.month && d === f.day) return n;
            d++; n++;
            if (d > DIAS_MES[m - 1]) { d = 1; m = m % 12 + 1; }
        }
        return -1;
    }

    /**
     * Lo que queda, en días y horas: el formato de `SimpleLongSpanFormat`.
     *
     * SE CUENTA EN UTC. El juego usa `CastleClock::GetUtcTime` y el rango del evento acaba a
     * las 00:00 UTC del día de fin; el reloj del port da la hora LOCAL. Contando en local
     * salían 13 horas donde el juego dice 11, que son justo las 3 de diferencia horaria de
     * la captura. Con UTC cuadra.
     */
    function restaHasta(f, dia, mes, hora, minuto) {
        const ahora = instanteUTC(hora, minuto);
        if (ahora == null) return null;
        // El fin es a las 00:00 UTC de ese día; si ya pasó este año, es el que viene.
        const anyo = new Date(ahora).getUTCFullYear();
        let objetivo = Date.UTC(anyo, f.month - 1, f.day);
        if (objetivo <= ahora) objetivo = Date.UTC(anyo + 1, f.month - 1, f.day);
        const horas = Math.floor((objetivo - ahora) / 3600000);
        if (horas <= 0) return { dias: 0, horas: 0, texto: 'menos de una hora' };
        const dd = Math.floor(horas / 24), hh = horas % 24;
        const t = [];
        if (dd) t.push(dd + (dd === 1 ? ' día' : ' días'));
        if (hh) t.push(hh + (hh === 1 ? ' hora' : ' horas'));
        return { dias: dd, horas: hh, texto: t.join(' ') || 'menos de una hora' };
    }

    /**
     * El instante actual en UTC, en milisegundos.
     *
     * El reloj del port da el día OA y la hora LOCAL del dispositivo (ver `getClock`), así
     * que se recompone la fecha del día OA y se le aplica el desfase horario de la máquina.
     */
    function instanteUTC(hora, minuto) {
        const c = (global.GameTime && global.GameTime.now) ? global.GameTime.now() : null;
        if (!c) return null;
        const f = fechaDeOA(Number(c.day));
        if (!f) return Date.now();
        const local = new Date(f.anyo, f.mes - 1, f.dia, hora | 0, minuto | 0, 0, 0);
        return local.getTime();          // `getTime` ya es el instante absoluto (UTC)
    }

    /** El volante del evento, `VillageEvent.Popup`. */
    function volanteDe(eventID) {
        if (!volantes || !Array.isArray(volantes.eventos)) return null;
        return volantes.eventos.find(e => Number(e.eventID) === Number(eventID)) || null;
    }

    /** Lo que hay en la partida, o null. */
    function deLaPartida() {
        const p = global.app && global.app.parser;
        if (!p || typeof p.getBountyBoardSave !== 'function') return null;
        try { return p.getBountyBoardSave(); } catch (e) { return null; }
    }

    /** El periódico que enseña el tablón: el último ya publicado. */
    function diarioDelTablon() {
        const p = global.app && global.app.parser;
        let dia = null;
        try {
            const c = global.GameTime && global.GameTime.now ? global.GameTime.now() : null;
            dia = c ? Math.floor(Number(c.day)) : null;
        } catch (e) { /* sin reloj */ }
        let guardados = [];
        try {
            if (p && typeof p.getNewspapers === 'function') guardados = p.getNewspapers();
        } catch (e) { /* sin partida */ }
        // De atrás hacia delante, el primero cuyo día ya pasó.
        for (let i = guardados.length - 1; i >= 0; i--) {
            const g = guardados[i];
            if (dia == null || Number(g.day) <= dia) return entradaDiario(g.id != null ? g.id : g.ID);
        }
        // Sin partida: la entrada 0, que es la que la escena trae de muestra.
        return entradaDiario(0);
    }

    function entradaDiario(id) {
        if (!diarios || !diarios.entries) return null;
        const e = diarios.entries.find(x => Number(x.ID) === Number(id));
        return e || diarios.entries[0] || null;
    }

    function titularDe(e) {
        if (!e || !e.headline) return '';
        const h = e.headline;
        const idioma = (global.app && global.app.idioma) || 'SP';
        return h[idioma] || h.SP || h.EN || '';
    }

    // ── La ventana ──────────────────────────────────────────────────────────

    // Los sprites del tablón que en realidad son FOTOS DE PERIODICO. La escena trae
    // puestas las de muestra (`robbery`, `yorishopopen`), y buscarlas en la carpeta del
    // tablón daba 404: viven en `images/newspapers/`, que el port ya tenía con las 214.
    let fotosDiario = null;
    function esFotoDeDiario(nombre) {
        if (!fotosDiario) {
            fotosDiario = new Set();
            try {
                for (const e of ((diarios && diarios.entries) || [])) {
                    if (e.eventPic) fotosDiario.add(e.eventPic);
                }
            } catch (err) { /* sin datos */ }
        }
        return fotosDiario.has(nombre);
    }

    function urlSprite(nombre) {
        if (!nombre) return null;
        if (esFotoDeDiario(nombre)) return 'images/newspapers/' + nombre + '.png';
        return RUTA_UI + nombre + '.png';
    }

    function cerrar() {
        if (panel) { panel.remove(); panel = null; }
    }

    /**
     * Abre el tablón. Si la partida no tiene encargos para hoy, los sortea como
     * `RollBounties` y los escribe.
     */
    async function abrir() {
        if (!(await cargar())) return null;
        if (typeof document === 'undefined') return null;
        cerrar();

        const save = deLaPartida();
        let encargos = (save && save.bounties) ? save.bounties.map(
            b => ({ fishID: Number(b.fishID), claimed: !!b.claimed })) : [];
        const cuantos = (ui.campos && Array.isArray(ui.campos.bounties))
            ? ui.campos.bounties.length : 3;
        if (!encargos.length) encargos = sortear(cuantos);

        panel = document.createElement('div');
        panel.id = 'tablon-encargos';
        panel.style.cssText = 'position:fixed;inset:0;z-index:100000;display:flex;'
            + 'align-items:center;justify-content:center;background:rgba(0,0,0,.5)';
        panel.addEventListener('click', (ev) => { if (ev.target === panel) cerrar(); });
        document.body.appendChild(panel);

        const diario = diarioDelTablon();
        const r = global.UIRender.ventana(ui, panel, {
            url: (n) => urlSprite(n),
            // El `<sprite index=N>` de TextMeshPro. El 43 es la zanahoria, que es el que
            // usa `Bounty.ValueText`.
            sprite: (n) => (n === 43
                ? '<img src="images/icons/bubbles/carrot.png" '
                  + 'style="height:1em;vertical-align:-.12em;margin-right:.14em">'
                : ''),
            escalaMax: 1,
            margen: 0.94,
        });

        // ── enganchar los datos a los nodos de la ventana ───────────────────
        const rutas = (ui.campos && ui.campos.bounties) || [];
        rutas.forEach((ruta, i) => {
            const el = r.porRuta[ruta];
            if (!el) return;
            const b = encargos[i];
            if (!b) { el.style.display = 'none'; return; }
            const pez = pezDe(b.fishID);
            const pon = (sufijo, fn) => {
                const n = r.porRuta[ruta + '/' + sufijo];
                if (n) fn(n);
            };
            pon('FishName', n => { n.textContent = nombreDelPez(b.fishID); });
            pon('Icon', n => {
                // El `Icon` viene con un gris (0.31) que es su SILUETA, y si no se quita
                // tapa al pez: los carteles salían como recuadros negros.
                n.style.background = 'none';
                n.dataset.relleno = '';
                // Y EL PEZ VA A SU TAMANYO NATIVO, no estirado al hueco.
                //
                // `Bounty::UseFish` llama a `BaseItem::AssignIcon`, que pone el sprite tal
                // cual. El hueco mide 218 x 1,1 = 240 en un cartel de 255: estirando ahí, un
                // sargo salía igual de grande que un pez tigre y los dos enormes. En el
                // juego cada pez sale del tamaño de su sprite, y por eso unos son pequeños
                // y otros llenan el cartel.
                n.innerHTML = '';
                n.style.display = 'flex';
                n.style.alignItems = 'center';
                n.style.justifyContent = 'center';
                const im = document.createElement('img');
                im.src = 'images/items/ITEM_' + b.fishID + '.png';
                im.style.cssText = 'max-width:100%;max-height:100%;'
                    + 'image-rendering:pixelated;display:block';
                im.onload = () => {
                    im.style.width = im.naturalWidth + 'px';
                    im.style.height = im.naturalHeight + 'px';
                };
                im.onerror = () => { im.style.display = 'none'; };
                n.appendChild(im);
            });
            pon('Value', n => {
                // `Bounty.ValueText = "<sprite index=43 tint=1>{0}"`, ya traducido por el
                // renderizador: sólo hay que poner el número.
                n.innerHTML = global.UIRender.tmp(
                    '<sprite index=43 tint=1>' + recompensa(b.fishID),
                    (q) => (q === 43 ? '<img src="images/icons/bubbles/carrot.png" '
                            + 'style="height:1em;vertical-align:-.12em;margin-right:.14em">' : ''));
            });
            pon('Claimed', n => { n.style.display = b.claimed ? '' : 'none'; });
            el.style.cursor = b.claimed ? 'default' : 'pointer';
            if (!b.claimed) {
                el.addEventListener('click', (ev) => { ev.stopPropagation(); reclamar(i); });
            }
            // `legendaryPaper` / `normalPaper`: el papel dorado es el de los legendarios,
            // y al tablón llegan por el pez del periódico del día (ver `sortear`).
            const papel = (pez && pez.rareza === RAREZA_LEGENDARIA)
                ? ui.campos.legendaryPaper : ui.campos.normalPaper;
            if (papel && papel.nombre) {
                el.style.backgroundImage = 'url("' + urlSprite(papel.nombre) + '")';
                el.style.backgroundSize = '100% 100%';
                el.style.backgroundRepeat = 'no-repeat';
            }
        });

        // ── EL PERIODICO ────────────────────────────────────────────────────
        //
        // `BountyBoard.MiniNewspaper` tiene TRES huecos para la foto —`eventPic`,
        // `eventPicHorizontal` y `eventPicVertical`— y el juego usa el que le va a la forma
        // de la imagen. Aquí se mide la foto y se enciende uno, y los otros dos se apagan:
        // ponerla en los tres la repetía tres veces.
        // EL PERIODICO SE ARMA CON FLEXBOX, NO CON SUS RECTANGULOS.
        //
        // `Newspaper` lleva `VerticalLayoutGroup` + `ContentSizeFitter` y en la escena está
        // guardado con `tam` (766.8, 0) y sus hijos a cero: Unity lo mide en ejecución. Con
        // los rectángulos tal cual, «THE DAILY CARROT» salía en una línea fuera del tablón.
        // Así que ese nodo se rehace a mano, con su `newspaperBacking` en 9 rebanadas, su
        // línea y la foto al lado del titular, que es como se ve.
        const peri = r.porRuta['BountyBoard/Newspaper'];
        if (peri && diario) {
            const esc = (peri.style.transform || '').includes('scale') ? '' : '';
            peri.innerHTML = '';
            peri.style.cssText += ';display:flex;flex-direction:column;align-items:stretch;'
                + 'width:' + ANCHO_PERIODICO + 'px;height:auto;padding:26px 24px 24px;'
                + 'box-sizing:border-box;color:#3d3a33;';
            const back = (ui.campos && ui.campos.newspaper) || null;
            peri.style.borderImageSource = 'url("' + urlSprite('newspaperBacking') + '")';
            peri.style.borderImageSlice = '84 84 84 84 fill';
            peri.style.borderImageWidth = '84px';
            peri.style.borderStyle = 'solid';
            peri.style.borderColor = 'transparent';
            peri.style.borderWidth = '84px';

            const cab = document.createElement('div');
            cab.style.cssText = 'text-align:center;font-weight:700;font-size:96px;'
                + 'line-height:1;letter-spacing:.02em;font-family:Georgia,serif';
            cab.innerHTML = global.UIRender.tmp(textoDe(r, 'BountyBoard/Newspaper/The Daily Carrot')
                                                || 'THE DAILY CARROT');
            peri.appendChild(cab);

            const linea = document.createElement('div');
            linea.style.cssText = 'height:6px;background:#3d3a33;border-radius:3px;'
                + 'margin:14px 0 12px';
            peri.appendChild(linea);

            const fila = document.createElement('div');
            fila.style.cssText = 'display:flex;gap:16px;align-items:center';
            const tit = document.createElement('div');
            tit.style.cssText = 'flex:1;font-size:72px;line-height:1.12;font-weight:600';
            tit.innerHTML = global.UIRender.tmp(titularDe(diario));
            const foto = document.createElement('img');
            foto.src = 'images/newspapers/' + diario.eventPic + '.png';
            foto.style.cssText = 'width:300px;height:300px;object-fit:cover;'
                + 'filter:grayscale(1) contrast(1.15)';
            foto.onerror = () => { foto.style.display = 'none'; };
            // `MiniNewspaper` tiene tres huecos -`eventPic`, `eventPicHorizontal` y
            // `eventPicVertical`- y usa el que le va a la forma de la foto.
            foto.onload = () => {
                const p = foto.naturalWidth / Math.max(1, foto.naturalHeight);
                if (p > 1.35) { foto.style.width = '440px'; foto.style.height = '250px'; }
                else if (p < 0.75) { foto.style.width = '220px'; foto.style.height = '380px'; }
            };
            fila.appendChild(tit);
            fila.appendChild(foto);
            peri.appendChild(fila);

            peri.style.cursor = 'pointer';
            peri.addEventListener('click', (ev) => {
                ev.stopPropagation();
                // `BountyBoard::OpenNewspapers`: el tablón abre el archivo de periódicos.
                if (global.NewspaperSystem && global.NewspaperSystem.open) {
                    global.NewspaperSystem.open();
                }
            });
        }

        // ── EL COMIC DE NATTO ───────────────────────────────────────────────
        //
        // `BountyBoard::LoadNatto` (0x58e32ac) lo elige con `TsukiSave.WeeksPlayed`. Son 26
        // tiras de tres viñetas, en `assets/aa/Android/natto_assets_all_*.bundle`, ya
        // exportadas a `images/natto/` por `tools/exportar_natto.py`.
        const nodoNatto = r.porRuta[(ui.campos && ui.campos.natto) || ''];
        const tira = tiraDeNatto();
        if (nodoNatto && tira) {
            // El hueco mide justo lo que la tira, así que va de fondo y ya está.
            nodoNatto.style.background = 'none';
            nodoNatto.dataset.relleno = '';
            nodoNatto.style.backgroundImage = 'url("' + tira.src + '")';
            nodoNatto.style.backgroundSize = 'contain';
            nodoNatto.style.backgroundRepeat = 'no-repeat';
            nodoNatto.style.backgroundPosition = 'center';
        } else if (nodoNatto) {
            nodoNatto.style.display = 'none';
        }

        // ── EL BOTON DEL EVENTO DE ALDEA ────────────────────────────────────
        //
        // No sale siempre: sólo si hay uno en marcha o viene uno. Su pegatina es el
        // `bountyBoardSticker` del evento y el texto es la cuenta atrás.
        const ev = eventoDeHoy();
        const esquina = r.porRuta['BountyBoard/GameObject'];
        const boton = r.porRuta['BountyBoard/GameObject/Button'];
        const siguiente = r.porRuta[(ui.campos && ui.campos.nextEventSticker) || ''];
        const tiempo = r.porRuta[(ui.campos && ui.campos.timeLeft) || ''];
        if (!ev) {
            if (esquina) esquina.style.display = 'none';
        } else {
            const vol = volanteDe(ev.evento.eventID);
            const peg = vol && vol.bountyBoardSticker;
            const poner = (n) => {
                if (!n || !peg) return;
                n.style.backgroundImage = 'url("images/ui/eventos/' + peg + '.png")';
                n.style.backgroundSize = 'contain';
                n.style.backgroundRepeat = 'no-repeat';
                n.style.backgroundPosition = 'center';
                n.style.cursor = 'pointer';
                n.onclick = (e2) => { e2.stopPropagation(); abrirVolante(ev.evento.eventID); };
            };
            poner(boton);
            // `nextEventSticker` es la pegatina de ENCIMA: sólo con el evento por venir.
            if (siguiente) {
                if (ev.enMarcha) siguiente.style.display = 'none';
                else poner(siguiente);
            }
            if (tiempo) {
                tiempo.textContent = ev.falta ? ev.falta.texto : '';
                tiempo.title = (ev.enMarcha ? 'Queda ' : 'Empieza en ') + (ev.falta ? ev.falta.texto : '');
            }
        }

        // Un botón de cerrar, que la ventana del juego no tiene porque se cierra tocando
        // fuera; aquí se deja lo uno y lo otro.
        const x = document.createElement('button');
        x.textContent = '✕';
        x.style.cssText = 'position:fixed;top:14px;right:16px;z-index:1;width:40px;height:40px;'
            + 'border-radius:50%;border:2px solid #554E4B;background:#F1EBD6;color:#554E4B;'
            + 'font-size:1.1rem;cursor:pointer';
        x.onclick = cerrar;
        panel.appendChild(x);

        if (global.PlaySfx) global.PlaySfx.sonar('cardOpen', { volumen: 0.15 });
        return r;
    }

    /**
     * La tira de Natto que toca, por semanas jugadas.
     *
     * OJO: cada PNG exportado es una TIRA ENTERA, no una viñeta. Las tres que cuelgan de
     * cada textura —`natto0_0`, `natto0_1`, `natto0_2`— miden 343x150, que es justo el hueco
     * `Natto/Image` de la ventana, y son tres cómics DISTINTOS. O sea que hay 26 x 3 = 78
     * tiras y se enseña UNA.
     *
     * La primera versión pintaba las tres seguidas y salían nueve viñetas en fila, saliéndose
     * del tablón.
     */
    function tiraDeNatto() {
        const todas = tirasDeNatto();
        if (!todas.length) return null;
        let semanas = 0;
        const p = global.app && global.app.parser;
        try {
            // `TsukiSave.WeeksPlayed` no está en el save: se deriva del inicio de partida.
            const ini = p && p.generalVars && p.generalVars.gameStartOA
                ? Number(p.generalVars.gameStartOA.value) : null;
            const c = (global.GameTime && global.GameTime.now) ? global.GameTime.now() : null;
            if (ini && c && c.day) semanas = Math.max(0, Math.floor((Number(c.day) - ini) / 7));
        } catch (e) { semanas = 0; }
        return todas[semanas % todas.length];
    }

    /** Las 78 tiras, en orden: cada textura aporta las suyas. */
    function tirasDeNatto() {
        if (!natto || !Array.isArray(natto.tiras)) return [];
        const fuera = [];
        for (const t of natto.tiras) {
            for (const v of (t.vinyetas || [])) {
                fuera.push({ nombre: t.nombre, indice: v,
                             src: natto.carpeta + '/' + t.nombre + '_' + v + '.png' });
            }
        }
        return fuera;
    }

    /**
     * El volante del evento: `VillageEvent.Popup`, o sea el `EventFlyer`.
     *
     * DONDE ESTABA. El prefab no aparece en ningún `level*` de mapa ni en los bundles de
     * addressables, y por eso la primera versión lo dio por no extraíble. Está en
     * **`level14`**, que es la escena del `UIController`: ahí viven el `EventFlyer`, el
     * `Phone`, sus seis `PhoneApp`, el `BagButton`, el `OptionsButton` y el `PhoneButton`.
     * Se encontró con `tools/cs_buscar_clase`, que barre `Data/` con AssetsTools.NET; el
     * mismo barrido escrito con UnityPy daba cero hasta para clases que sí estaban.
     *
     * SU ESTRUCTURA, de `data/ui_eventflyer.json` (15 nodos):
     *
     *     EventFlyer            520 x 1346,62
     *       Backing             `homecomingFlyer_0`, 9 rebanadas de 84   <- flyerBacking
     *         GameObject        RectMask2D
     *           Image           FixTileRawImage                          <- la textura que corre
     *       Image (4)           `homecomingFlyer_1`, 780 x 350           <- flyerHeader
     *         Image x2          `StrongLight` 100 x 100                  <- los destellos
     *       GameObject          RectMask2D
     *         EventDetails      VerticalLayoutGroup + ContentSizeFitter
     *           EVENTName       TMP 55,95
     *           EVENTDate       TMP 32
     *           Detail          VerticalLayoutGroup
     *             EventDetail   (el `optionPrefab` de `details`)
     *               HorizontalImage  la imagen del detalle
     *               EVENTName (1)    TMP 32
     *
     * Los sprites del volante de cada evento —`flyerBacking`, `flyerHeader`,
     * `bountyBoardSticker` y el `art` de cada detalle— salen de `VillageEventData`
     * (`data/event_flyers.json`), y los de la variante de Homecoming, de la propia escena.
     *
     * Se arma con flexbox porque `EventDetails` es un `VerticalLayoutGroup` con
     * `ContentSizeFitter`: sus hijos vienen con `tam` a cero y Unity los mide en ejecución.
     */
    function abrirVolante(eventID) {
        if (typeof document === 'undefined') return null;
        const vol = volanteDe(eventID);
        const ev = (eventos && eventos.events || []).find(
            e => Number(e.eventID) === Number(eventID));
        if (!vol && !ev) return null;
        const viejo = document.getElementById('volante-evento');
        if (viejo) viejo.remove();

        const M = medidasVolante();
        const col = (vol && vol.flyerTextColor && global.UIRender)
            ? global.UIRender.css(vol.flyerTextColor) : '#fff4ce';
        const cap = document.createElement('div');
        cap.id = 'volante-evento';
        cap.style.cssText = 'position:fixed;inset:0;z-index:100001;display:flex;'
            + 'align-items:center;justify-content:center;background:rgba(0,0,0,.55)';
        cap.addEventListener('click', (e) => { if (e.target === cap) cap.remove(); });

        const esc = Math.min(1, (global.innerHeight || 900) / (M.alto + 80));
        const caja = document.createElement('div');
        caja.style.cssText = 'position:relative;width:' + M.ancho + 'px;display:flex;'
            + 'flex-direction:column;align-items:center;box-sizing:border-box;'
            + 'transform:scale(' + esc + ');transform-origin:center center;'
            + 'padding:' + M.borde + 'px ' + Math.round(M.borde * 0.7) + 'px;'
            + 'color:' + col + ';';
        // `Backing`: en 9 rebanadas, con el borde del sprite.
        const fondo = vol && vol.flyerBacking;
        if (fondo) {
            const u = 'images/ui/eventos/' + fondo + '.png';
            caja.style.borderImageSource = 'url("' + u + '")';
            caja.style.borderImageSlice = M.borde + ' fill';
            caja.style.borderImageWidth = M.borde + 'px';
            caja.style.borderStyle = 'solid';
            caja.style.borderColor = 'transparent';
            caja.style.borderWidth = M.borde + 'px';
        } else {
            caja.style.background = '#6b4a2a';
            caja.style.borderRadius = '18px';
        }

        // `Image (4)`: la cabecera.
        if (vol && vol.flyerHeader) {
            const h = document.createElement('img');
            h.src = 'images/ui/eventos/' + vol.flyerHeader + '.png';
            h.style.cssText = 'width:' + M.cabeceraAncho + 'px;max-width:100%;'
                + 'height:auto;display:block;margin:-' + Math.round(M.borde * 0.6) + 'px 0 6px';
            h.onerror = () => { h.style.display = 'none'; };
            caja.appendChild(h);
        }

        // `EVENTName` y `EVENTDate`.
        const nom = document.createElement('div');
        nom.style.cssText = 'font-weight:800;font-size:' + M.tamNombre + 'px;'
            + 'text-align:center;line-height:1.1;text-transform:uppercase';
        nom.textContent = (ev && (ev.name_es || ev.name_en)) || ('Evento ' + eventID);
        caja.appendChild(nom);

        if (ev) {
            const fe = document.createElement('div');
            fe.style.cssText = 'font-size:' + M.tamFecha + 'px;text-align:center;'
                + 'opacity:.9;margin-top:2px';
            // `DateRange::SetDateString` escribe el rango; aquí, día y mes.
            const dd = (x) => String(x.day).padStart(2, '0') + '/' + String(x.month).padStart(2, '0');
            fe.textContent = dd(ev.from) + ' - ' + dd(ev.to);
            caja.appendChild(fe);
        }

        // `Detail`: una fila por `eventDetail`, con su imagen y su texto.
        const filas = document.createElement('div');
        filas.style.cssText = 'display:flex;flex-direction:column;gap:14px;margin-top:14px;'
            + 'width:100%';
        for (const d of ((vol && vol.eventDetails) || [])) {
            const fila = document.createElement('div');
            fila.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:6px';
            if (d.art) {
                const im = document.createElement('img');
                im.src = 'images/ui/eventos/' + d.art + '.png';
                im.style.cssText = 'max-width:100%;height:auto;display:block';
                im.onerror = () => { im.style.display = 'none'; };
                fila.appendChild(im);
            }
            const txt = Object.keys(d).filter(k => k !== 'art')
                .map(k => d[k]).filter(v => typeof v === 'string' && v.length)[0] || '';
            if (txt) {
                const t = document.createElement('div');
                t.style.cssText = 'font-size:' + M.tamDetalle + 'px;text-align:center;'
                    + 'line-height:1.25';
                t.innerHTML = global.UIRender ? global.UIRender.tmp(txt) : txt;
                fila.appendChild(t);
            }
            filas.appendChild(fila);
        }
        caja.appendChild(filas);

        // Las tareas del evento, que también salen en el volante.
        const tareas = (vol && vol.eventTasks) || [];
        if (tareas.length) {
            const ul = document.createElement('ul');
            ul.style.cssText = 'margin:14px 0 0;padding-left:20px;font-size:'
                + M.tamDetalle + 'px;line-height:1.35;align-self:stretch';
            for (const t of tareas) {
                const li = document.createElement('li');
                li.innerHTML = global.UIRender ? global.UIRender.tmp(t) : t;
                ul.appendChild(li);
            }
            caja.appendChild(ul);
        }

        cap.appendChild(caja);
        document.body.appendChild(cap);
        if (global.PlaySfx) global.PlaySfx.sonar('cardOpen', { volumen: 0.15 });
        return cap;
    }

    /** Las medidas del volante, de `data/ui_eventflyer.json` si está. */
    function medidasVolante() {
        const M = { ancho: 520, alto: 1347, borde: 84, cabeceraAncho: 780,
                    tamNombre: 56, tamFecha: 32, tamDetalle: 32 };
        if (!flyerUI || !flyerUI.arbol) return M;
        const por = {};
        (function anda(n) { por[n.ruta] = n; for (const h of n.hijos || []) anda(h); })(flyerUI.arbol);
        const raiz = flyerUI.arbol;
        if (raiz.tam) { M.ancho = Math.round(raiz.tam.x) || M.ancho;
                        M.alto = Math.round(raiz.tam.y) || M.alto; }
        const back = por['EventFlyer/Backing'];
        if (back) {
            for (const c of back.comp || []) {
                if (c.tipo === 'Image' && c.sprite && c.sprite.borde) {
                    M.borde = Math.round(c.sprite.borde.x) || M.borde;
                }
            }
        }
        const cab = por['EventFlyer/Image (4)'];
        if (cab && cab.tam) M.cabeceraAncho = Math.round(cab.tam.x) || M.cabeceraAncho;
        const tam = (ruta) => {
            const n = por[ruta];
            if (!n) return null;
            for (const c of n.comp || []) if (c.tipo === 'TextMeshProUGUI') return Math.round(c.tam);
            return null;
        };
        M.tamNombre = tam('EventFlyer/GameObject/EventDetails/EVENTName') || M.tamNombre;
        M.tamFecha = tam('EventFlyer/GameObject/EventDetails/EVENTDate') || M.tamFecha;
        M.tamDetalle = tam('EventFlyer/GameObject/EventDetails/Detail/EventDetail/EVENTName (1)')
                       || M.tamDetalle;
        return M;
    }

    /**
     * `Bounty::Claim`, en el mismo orden: quita el pez, suma el contador, anima el sello,
     * paga `precio * 5` y guarda.
     */
    function reclamar(indice) {
        const p = global.app && global.app.parser;
        const save = deLaPartida();
        if (!p || !save || !save.bounties || !save.bounties[indice]) return null;
        const b = save.bounties[indice];
        if (b.claimed) return { ok: false, razon: 'ya reclamado' };

        // `inventario.Remove(pez, 1)` va PRIMERO, y si no se puede, no se cobra:
        // `parser.deductInventoryItem` devuelve false si no hay bastante.
        let quitado = false;
        try {
            quitado = typeof p.deductInventoryItem === 'function'
                ? p.deductInventoryItem(b.fishID, 1) !== false
                : false;
        } catch (e) { quitado = false; }
        if (!quitado) return { ok: false, razon: 'no tienes ese pez' };

        const pago = recompensa(b.fishID);
        if (typeof p.addCarrots === 'function') p.addCarrots(pago);
        if (typeof p.bumpCounter === 'function') p.bumpCounter('bountiesClaimed', 1);
        // Se escribe en la partida con el propio escritor del parser, que ya sabe
        // emparejar los nodos por índice.
        if (typeof p.saveBountyBoardState === 'function') {
            const todos = save.bounties.map((x, i) => ({
                fishID: Number(x.fishID), claimed: i === indice ? true : !!x.claimed }));
            p.saveBountyBoardState(save.rollDate, todos);
        } else if (b.claimedNode) {
            b.claimedNode.value = true;
        }
        b.claimed = true;

        // El sello. En el juego es `Stamp.Animate()`, un SpriteRenderer con partículas.
        const ruta = ((ui.campos && ui.campos.bounties) || [])[indice];
        const el = panel && ruta ? panel.querySelector('[data-ruta="' + ruta + '/Claimed"]') : null;
        if (el) {
            el.style.display = '';
            el.animate([{ transform: 'scale(2.2) rotate(-12deg)', opacity: 0 },
                        { transform: 'scale(1) rotate(0deg)', opacity: 1 }],
                       { duration: 260, easing: 'cubic-bezier(.2,1.4,.5,1)' });
        }
        if (global.PlaySfx) global.PlaySfx.sonar('stamp', { volumen: 0.4 });
        if (global.app && global.app.refreshCarrotsUI) global.app.refreshCarrotsUI();
        return { ok: true, pago, fishID: b.fishID };
    }

    global.PlayBountyBoard = {
        PRECIO_POR_RAREZA, PRECIO_LEGENDARIO, MULT_RECOMPENSA, RAREZA_LEGENDARIA, AGUA,
        SUBLOC_AYUNTAMIENTO,
        pezDelDiario, eventoDeHoy, volanteDe, restaHasta, diasHasta, abrirVolante,
        fechaDeOA, instanteUTC,
        tiraDeNatto, tirasDeNatto, medidasVolante,
        get ui() { return ui; },
        get aguas() { return mascaraAguas; },
        set aguas(v) { mascaraAguas = Number(v) || 0; },
        cargar, usarDatos, pecesValidos, precioDelPez, recompensa, pezDe, sortear,
        deLaPartida, diarioDelTablon, titularDe, abrir, cerrar, reclamar,
    };
})(typeof window !== 'undefined' ? window : globalThis);
