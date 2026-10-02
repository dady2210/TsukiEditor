/* play_shops.js — lo que las tiendas tienen a la venta, puesto en el mapa.
 *
 * ────────────────────────────────────────────────────────────────────────────
 *  QUE FALTABA
 * ────────────────────────────────────────────────────────────────────────────
 * El port tenía la tienda como ventana: se abría, salía una lista y se compraba. En el
 * juego no es así. Cada tienda tiene EXPOSITORES —`ShopDisplay`— repartidos por el mapa, y
 * cada uno enseña encima el objeto que le ha caído. Se toca el objeto, no un menú.
 *
 * En la tienda de plantas de Rosemary (`map_5`) hay siete: cuatro `GridFurnShopDisplay`,
 * dos `PotsAndBonsaiShopDisplay` y un `SeedShopDisplay`. En total, 31 expositores en 10
 * tiendas de 6 niveles.
 *
 * ────────────────────────────────────────────────────────────────────────────
 *  EL MODELO, TAL CUAL
 * ────────────────────────────────────────────────────────────────────────────
 *     public abstract class ShopDisplay : LinkedObject {
 *         public Shop shop;
 *         public Shop.ShopSave.ShopDisplaySave displaySave;
 *         public bool empty, bought;
 *         public SpriteRenderer soldObject;     // el cartel de VENDIDO
 *     }
 *     public class Shop.ShopSave.ShopDisplaySave {
 *         public int dataID;                    // = el objectID del expositor
 *         public Shop.ShopItem shopItem;        // { id, verification, quantity }
 *         public bool bought, empty, rerolled;
 *     }
 *
 * O sea que la ESCENA dice dónde está cada expositor y la PARTIDA qué objeto le tocó. Se
 * emparejan por `dataID`, y eso está comprobado contra un save de verdad: **18 de 18**.
 *
 * Los datos de escena los saca `tools/cs_shop_data` a `data/shop_displays.json`, con la
 * posición ya en coordenadas de MAPA (restándole el `origin_offset` del export) y con los
 * hijos de cada expositor separados por papel:
 *
 *   · `prop`         — el pallet, el pedestal: se ve siempre, y sigue horneado en el fondo.
 *   · `cartel`       — el `soldObject`: sólo cuando ya compraste.
 *   · `itemRenderer` — DONDE va el objeto a la venta, con su escala y su pivote.
 *
 * ────────────────────────────────────────────────────────────────────────────
 *  LO QUE EL EXTRACTOR HORNEÓ DE MÁS
 * ────────────────────────────────────────────────────────────────────────────
 * En la escena los tres hijos están ACTIVOS y con un sprite puesto, así que el extractor de
 * mapas los horneó todos: **los props de las tiendas salían VENDIDOS siempre**, y encima
 * con el cartel repetido donde tenía que ir el objeto. `tools/marcar_carteles_vendido.py`
 * les pone `layer: "skip"` en `data/maps/map_N.json` para que `play_scenery` no los pinte;
 * los pinta este módulo, y sólo cuando toca. (El `_Ensamblado.png` los sigue teniendo
 * dentro: eso es el fondo del editor y el respaldo si falla el horneado por capas.)
 *
 * ────────────────────────────────────────────────────────────────────────────
 *  LO QUE PASA AL TOCAR Y AL COMPRAR, LEÍDO DEL ELF
 * ────────────────────────────────────────────────────────────────────────────
 * `ShopDisplay::QuickTap` (0x5936184):
 *     if (bought || empty) return;
 *     if (displaySave == null || shop == null) return;
 *     if (!displaySave.shopItem.Verified) return;
 *     Viewer.View(this);                       // 0x5886a14, la sobrecarga de tienda
 *
 * `Viewer::Open` (0x5887a08) acaba en `AudioData.PlaySFX(0x14)` = **`cardOpen`**, volumen
 * 0,15. La ventana es el `Viewer`, que enseña icono, nombre, descripción, precio, la
 * burbuja de cantidad, la pestaña de descuento y el botón de comprar.
 *
 * `ShopDisplay::Buy` (0x5936258), entero:
 *     precio = shopItem.Price(displaySave.<0x22> ? 0 : shop.Discount)
 *     if (TsukiSave.carrots < precio) { CarrotHandler.NotEnoughCarrots(); return NotEnoughCarrots; }
 *     if (!items.TryAdd(item, quantity, true, null)) { InventoryPopup.FullBag(); return NoInventorySpace; }
 *     CarrotHandler.RemoveCarrots(precio);
 *     TsukiSave.carrotsSpent += precio;
 *     displaySave.bought = true;  this.bought = true;
 *     shop.MadePurchase(item);
 *     ClearDisplay(showSold: true, immediate: false);
 *     AudioData.PlaySFX(0x39);                       // ← `buy`, volumen 0,3
 *     return Success;
 *
 * con `PurchaseResult { NotEnoughCarrots = 0, NoInventorySpace = 1, Success = 2,
 * NoHomecoming = 3 }`.
 *
 * El `0xcc` de `carrotsSpent` no sale de contar campos —hay relleno de alineación y la
 * cuenta no cuadra—: sale de que el único sitio del juego que lo lee es
 * `AchievementData.BigSpender::Check`.
 *
 * `Shop.ShopItem::Price(descuento)` (0x59338d8):
 *     Math.Round((1 - descuento) * item.Price, MidpointRounding.ToEven)
 * o sea redondeo bancario, el mismo de `CropItem::GetHarvestAmount`.
 *
 * `ShopDisplay::BounceDisplay` (0x5936814 → su `MoveNext` en 0x59368f8): achica la escala a
 * **0,8** y la devuelve animándola con `CastleTools.AnimateValue(v, deltaTime * 3)`.
 *
 * ────────────────────────────────────────────────────────────────────────────
 *  LO QUE NO SE MODELA, Y SE DICE
 * ────────────────────────────────────────────────────────────────────────────
 *   · EL SORTEO, ahora con los datos de verdad. `Shop::Reroll` (0x5932fec) llama a
 *     `Shop.ShopData::Roll` (0x593229c), que se sirve de `ViableItemsWithPriority`
 *     (0x593458c): esa recorre `itemsForSale` y luego los catálogos que pasen
 *     `ShopCatalogue::Check`, y por cada objeto llama a
 *     `Shop.ShopItem::TryGetItemWithPriority` (0x5933a58), que saca la prioridad de
 *     `[shopItem + 8]`, o sea del campo `quantity` del propio `ShopItem`. La lista viable
 *     lleva cada objeto REPETIDO según su prioridad, y de ahí se elige.
 *
 *     Los cinco `ShopCatalogue` están extraídos (`data/shop_displays.json`, 53 objetos en
 *     dos `shopID`). Lo que NO está decodificado es el cuerpo de `ShopData::Roll` —3.408
 *     bytes con condiciones, rebajas y lo ya vendido—, así que `sortearTienda` reparte con
 *     la prioridad y sin repetir expositor, y se dice que es eso y no el `Roll` entero.
 *
 *   · `Shop.PurchaseLine`, que es lo que dice el tendero. `Shop::MadePurchase` (0x5931624)
 *     recorre `purchaseLines` y con la primera cuyo `Valid(item)` da true llama a
 *     `TriggerShopkeeperDialogue(convoID)` (0x5931a98), que acaba en
 *     `Dialogue::TriggerCustomDialogue`. Los `TriggerType` son
 *     **Specific 0, GenericItem 1, GenericFurn 2**, y las líneas están extraídas: la tienda
 *     de Yori tiene una por objeto concreto (337→convo 0, 331→2, 110→4, 325→9…) y la de
 *     Rosemary una genérica de mueble con sus condiciones.
 *
 *   · `NoHomecoming` (3): la rama premium de `Buy` abre la compra de Homecoming, que es una
 *     compra REAL con dinero. El port devuelve el código y lo dice en la tarjeta, que es lo
 *     único honesto que puede hacer.
 */
(function (global) {
    'use strict';

    // ── Los números del ELF ─────────────────────────────────────────────────
    const SFX_ABRIR = 'cardOpen';   // PlaySFX(0x14) en Viewer::Open, volumen 0,15
    const SFX_COMPRA = 'buy';       // PlaySFX(0x39) en ShopDisplay::Buy, volumen 0,3
    const VOL_ABRIR = 0.15;
    const VOL_COMPRA = 0.3;
    const RESULTADO = { SIN_ZANAHORIAS: 0, BOLSA_LLENA: 1, COMPRADO: 2, SIN_HOMECOMING: 3 };
    const BOTE_ESCALA = 0.8;        // el `ldr s2, [..., #0x9cc] = 0.8` de BounceDisplay
    const BOTE_VELOCIDAD = 3;       // el `fmov s0, #3.0 ; fmul s1, s9, s0` del mismo

    let datos = null;               // data/shop_displays.json
    let porNivel = null;            // nivel -> objectID -> expositor
    const botes = {};               // objectID -> { t0 } mientras rebota
    const imgs = {};                // cache de imágenes

    function cargarImagen(url) {
        if (imgs[url] !== undefined) return imgs[url];
        imgs[url] = null;
        if (typeof Image === 'undefined') return null;
        const im = new Image();
        im.onload = () => { imgs[url] = im; };
        im.onerror = () => { imgs[url] = false; };
        im.src = url;
        return null;
    }

    function usarDatos(d) {
        datos = d || null;
        porNivel = {};
        if (!datos || !datos.porNivel) return porNivel;
        for (const [lv, doc] of Object.entries(datos.porNivel)) {
            const idx = {};
            for (const t of (doc.tiendas || [])) {
                for (const e of (t.expositores || [])) {
                    if (e.objectID == null) continue;
                    idx[String(e.objectID)] = Object.assign({ _tienda: t.objectID }, e);
                }
            }
            porNivel[lv] = idx;
        }
        return porNivel;
    }

    async function cargar() {
        if (datos) return true;
        try {
            const r = await fetch('data/shop_displays.json');
            if (!r.ok) return false;
            usarDatos(await r.json());
            return true;
        } catch (e) { return false; }
    }

    /** `Exportado_level11` -> `level11`, del `assetsDir` del mapa. */
    function nivelDe(mapId) {
        try {
            const cfg = global.MapDef && global.MapDef.config(mapId);
            const ad = (cfg && cfg.assetsDir) || '';
            const base = String(ad).replace(/\\/g, '/').replace(/\/+$/, '').split('/').pop();
            return base.replace(/^Exportado_/, '') || null;
        } catch (e) { return null; }
    }

    /**
     * Los expositores de un mapa, ya unidos con lo que dice la partida.
     *
     * El `sublocId` del save es el mismo número que el `mapId` del port: comprobado en un
     * save de verdad —subloc 1 = level3 = map_1, subloc 5 = level11 = map_5, subloc 11 =
     * level12 = map_11—.
     */
    function deMapa(mapId) {
        const lv = nivelDe(mapId);
        const idx = lv && porNivel ? porNivel[lv] : null;
        if (!idx) return [];
        const p = global.app && global.app.parser;
        const guardadas = (p && typeof p.getShopSaves === 'function') ? p.getShopSaves() : [];
        const fuera = [];
        for (const t of guardadas) {
            if (Number(t.sublocId) !== Number(mapId)) continue;
            for (const d of (t.displays || [])) {
                const e = idx[String(d.dataID)];
                if (!e) continue;
                fuera.push({
                    objectID: Number(d.dataID),
                    clase: e.clase,
                    x: e.x, y: e.y,
                    hijos: e.hijos || [],
                    sublocId: t.sublocId,
                    shopIdx: t.shopIdx,
                    indice: d.index,
                    itemId: d.itemId,
                    verification: d.verification,
                    quantity: d.quantity,
                    bought: d.bought,
                    empty: d.empty,
                    _save: d,
                    _tienda: t,
                });
            }
        }
        return fuera;
    }

    /**
     * `Shop.ShopItem::get_Verified`. El campo `verification` es una firma del id: el juego
     * la comprueba para que un save trucado no cuele objetos. Aquí no se puede recalcular
     * —es el algoritmo de `shop_system.js`, que ya lo replica—, así que se delega en él y,
     * si no está, se acepta cualquier id distinto de cero, que es lo que hace falta para
     * poder pintarlo.
     */
    function verificado(e) {
        const S = global.ShopManager && global.app && global.app.shop;
        if (S && typeof S.verificar === 'function') {
            try { return !!S.verificar(e.itemId, e.verification); } catch (err) { /* sigue */ }
        }
        return Number(e.itemId) !== 0;
    }

    /** El sprite del objeto: `FURN_` para muebles, `ITEM_` para lo demás. */
    function urlDelObjeto(itemId) {
        const id = Math.abs(Number(itemId) || 0);
        const mueble = Number(itemId) > 0;
        return 'images/items/' + (mueble ? 'FURN_' : 'ITEM_') + id + '.png';
    }

    /** `Math.Round(x, MidpointRounding.ToEven)`: el redondeo bancario del juego. */
    function redondearBanquero(v) {
        const suelo = Math.floor(v);
        const resto = v - suelo;
        if (Math.abs(resto - 0.5) > 1e-9) return Math.round(v);
        return (suelo % 2 === 0) ? suelo : suelo + 1;
    }

    /** `Shop.ShopItem::Price(descuento)`. */
    function precio(itemId, descuento) {
        let base = 0;
        const db = global.ITEMS_DB;
        const it = db && db[String(Math.abs(Number(itemId) || 0))];
        if (it && it.price != null) base = Number(it.price);
        else if (it && it.Price != null) base = Number(it.Price);
        const d = Math.max(0, Math.min(1, Number(descuento) || 0));
        return redondearBanquero((1 - d) * base);
    }

    /** El descuento de la tienda. Sin datos de `ShopData`, no hay descuento. */
    function descuentoDe(mapId, shopIdx) {
        const S = global.app && global.app.shop;
        if (S && typeof S.descuentoDe === 'function') {
            try { return Number(S.descuentoDe(mapId, shopIdx)) || 0; } catch (e) { /* sigue */ }
        }
        return 0;
    }

    /**
     * `ViableItemsWithPriority`: cada objeto, repetido tantas veces como su prioridad.
     *
     * La prioridad es el campo `quantity` del `ShopItem` (`[shopItem + 8]` en
     * `TryGetItemWithPriority`). Con prioridad 0 o sin ella, una vez.
     */
    function viablesConPrioridad(shopID) {
        if (!datos || !Array.isArray(datos.catalogos)) return [];
        const fuera = [];
        for (const c of datos.catalogos) {
            if (shopID != null && Number(c.shopID) !== Number(shopID)) continue;
            for (const o of (c.objetos || [])) {
                const n = Math.max(1, Math.round(Number(o.cantidad) || 1));
                for (let i = 0; i < n; i++) fuera.push({ id: o.id, verificacion: o.verificacion,
                                                         cantidad: o.cantidad, catalogo: c.nombre });
            }
        }
        return fuera;
    }

    /** Los `shopID` que hay en los catálogos extraídos. */
    function tiendasDeCatalogo() {
        if (!datos || !Array.isArray(datos.catalogos)) return [];
        return [...new Set(datos.catalogos.map(c => Number(c.shopID)))];
    }

    /**
     * Reparte objetos por los expositores, sin repetir.
     *
     * Es la parte de `ShopData::Roll` que está decodificada: la lista viable con su
     * prioridad y una elección al azar por expositor. Lo que NO hace, y por eso no se dice
     * que sea `Roll`, es aplicar las condiciones de cada catálogo, las rebajas ni lo que ya
     * se vendió.
     */
    function sortearTienda(cuantos, shopID) {
        const pool = viablesConPrioridad(shopID);
        const fuera = [];
        const usados = new Set();
        for (let i = 0; i < cuantos && pool.length; i++) {
            let r = Math.floor(Math.random() * pool.length);
            // Sin repetir el mismo objeto en dos expositores.
            for (let g = 0; g < pool.length && usados.has(pool[r].id); g++) {
                r = (r + 1) % pool.length;
            }
            const o = pool[r];
            if (usados.has(o.id)) break;
            usados.add(o.id);
            fuera.push({ itemId: o.id, verification: o.verificacion, quantity: 1 });
        }
        return fuera;
    }

    /**
     * `Shop::MadePurchase`: la primera línea válida dispara el diálogo del tendero.
     *
     * `PurchaseLine.Valid(item)` según el `triggerType`:
     *   Specific (0)    — el `itemID` de la línea es el del objeto
     *   GenericItem (1) — cualquier objeto del `invType` de la línea
     *   GenericFurn (2) — cualquier mueble, con sus condiciones
     *
     * Las condiciones se delegan en `Activities.cumple`, que es el mismo evaluador de las
     * 414 condiciones del juego; lo que no se sepa juzgar NO invalida la línea, igual que
     * en `play_scenery`.
     */
    function lineaDeCompra(mapId, itemId) {
        const lv = nivelDe(mapId);
        const doc = datos && datos.porNivel ? datos.porNivel[lv] : null;
        if (!doc) return null;
        const esMueble = Number(itemId) > 0;
        for (const t of (doc.tiendas || [])) {
            const lineas = t.lineasDeCompra;
            if (!Array.isArray(lineas)) continue;
            for (const l of lineas) {
                const tt = Number(l.triggerType) || 0;
                if (tt === 0 && Number(l.itemID) !== Math.abs(Number(itemId))) continue;
                if (tt === 1 && esMueble) continue;          // GenericItem: objetos, no muebles
                if (tt === 2 && !esMueble) continue;         // GenericFurn: muebles
                if (!condicionesOk(l.condiciones)) continue;
                return l;
            }
        }
        return null;
    }

    function condicionesOk(c) {
        if (!c || !Array.isArray(c.lista) || !c.lista.length) return true;
        const A = global.Activities;
        if (!A || typeof A.cumple !== 'function') return true;
        for (const x of c.lista) {
            let r = null;
            try { r = A.cumple(x, {}); } catch (e) { r = null; }
            if (r === false) return false;      // lo que no se sabe juzgar no invalida
        }
        return true;
    }

    /** Suelta la frase del tendero, si hay diálogo enganchado. */
    function frasePorCompra(mapId, itemId) {
        const l = lineaDeCompra(mapId, itemId);
        if (!l) return null;
        const D = global.DialogueManager || global.Dialogos;
        if (D && typeof D.abrirConversacion === 'function') {
            try { D.abrirConversacion(Number(l.convoID)); } catch (e) { /* sin diálogo */ }
        }
        return Number(l.convoID);
    }

    // ── El dibujo ───────────────────────────────────────────────────────────

    /** La escala del bote, si ese expositor está rebotando. `BounceDisplay`. */
    function escalaBote(objectID, ms) {
        const b = botes[objectID];
        if (!b) return 1;
        // `AnimateValue(v, deltaTime * 3)` es una aproximación exponencial a 1: en tiempo
        // continuo, v(t) = 1 - (1 - 0.8) * e^(-3t). Se corta cuando ya no se nota.
        const t = (ms - b.t0) / 1000;
        const v = 1 - (1 - BOTE_ESCALA) * Math.exp(-BOTE_VELOCIDAD * t);
        if (v > 0.999) { delete botes[objectID]; return 1; }
        return v;
    }

    function rebotar(objectID) {
        botes[objectID] = { t0: (typeof performance !== 'undefined' && performance.now)
                                ? performance.now() : Date.now() };
    }

    function animando() { return Object.keys(botes).length > 0; }

    /**
     * Pinta lo que hay a la venta y los carteles de VENDIDO.
     *
     * Misma transformación que `play_scenery.drawAnimadas`: el mundo va a píxel con
     * `x * ppu * s` y la Y hacia abajo, y el sprite se ancla en su pivote.
     */
    function dibujar(ctx, mapId, offsetX, offsetY, s) {
        const lista = deMapa(mapId);
        if (!lista.length) return false;
        const cfg = (global.MapDef && global.MapDef.config(mapId)) || {};
        const ppu = cfg.ppu || 150;
        const nivel = nivelDe(mapId);
        const ms = (typeof performance !== 'undefined' && performance.now)
            ? performance.now() : Date.now();
        let pintado = false;

        // Del fondo al frente, igual que el juego ordena por Y: lo de más arriba, detrás.
        lista.sort((a, b) => (b.y - a.y));

        for (const e of lista) {
            const cartel = e.hijos.find(h => h.papel === 'cartel');
            const donde = e.hijos.find(h => h.papel === 'itemRenderer');

            if (e.bought) {
                // `ClearDisplay(showSold: true)`: se esconde el objeto y se enseña el cartel.
                if (cartel && cartel.sprite && nivel) {
                    pintarSprite(ctx, cartel, 'images/maps/Exportado_' + nivel + '/'
                                 + cartel.sprite + '.png', offsetX, offsetY, s, ppu, 1);
                    pintado = true;
                }
                continue;
            }
            if (e.empty || !verificado(e)) continue;

            const k = escalaBote(e.objectID, ms);
            if (donde) {
                // Los expositores con `ItemRenderer` ponen el objeto ahí, con la escala y el
                // pivote de ese renderer. En la tienda de Rosemary es el de las semillas:
                // el objeto va 0,8 unidades por encima del pedestal y a escala 0,8.
                pintarSprite(ctx, donde, urlDelObjeto(e.itemId),
                             offsetX, offsetY, s, ppu, k);
            } else {
                // Los de rejilla ponen el mueble en su propia celda. Se usa la convención
                // del port para los `FURN_`: anclado en (-w/2, -h*0.92), la misma que usa
                // `map.js` para el mobiliario y los objetos de escena.
                pintarMueble(ctx, e, urlDelObjeto(e.itemId), offsetX, offsetY, s, k);
            }
            pintado = true;
        }
        return pintado;
    }

    function pintarSprite(ctx, h, url, offsetX, offsetY, s, ppuMapa, k) {
        const img = imgs[url] !== undefined ? imgs[url] : cargarImagen(url);
        if (!img) return;
        const ppu = h.ppu || ppuMapa;
        // Del tamaño de textura al del lienzo: `rw / ppu` unidades de mundo son
        // `rw * ppuMapa / ppu` píxeles. Es el mismo factor que `play_scenery.factorPPU`.
        const rw = (h.rw != null ? h.rw : img.naturalWidth);
        const rh = (h.rh != null ? h.rh : img.naturalHeight);
        const f = ppuMapa / ppu;
        const w = rw * f * s * Math.abs(h.sx == null ? 1 : h.sx) * k;
        const hh = rh * f * s * Math.abs(h.sy == null ? 1 : h.sy) * k;
        const px = (h.px == null ? 0.5 : h.px) * w;
        const py = (1 - (h.py == null ? 0.5 : h.py)) * hh;
        const ax = offsetX + (h.x || 0) * ppuMapa * s;
        const ay = offsetY - (h.y || 0) * ppuMapa * s;
        ctx.drawImage(img, ax - px, ay - py, w, hh);
    }

    function pintarMueble(ctx, e, url, offsetX, offsetY, s, k) {
        const img = imgs[url] !== undefined ? imgs[url] : cargarImagen(url);
        if (!img) return;
        const w = img.naturalWidth * s * k;
        const h = img.naturalHeight * s * k;
        const x = offsetX + (e.x || 0) * 150 * s;
        const y = offsetY - (e.y || 0) * 150 * s;
        ctx.drawImage(img, x - w / 2, y - h * 0.92, w, h);
    }

    // ── El toque ────────────────────────────────────────────────────────────

    /**
     * Qué expositor cae bajo un punto de PANTALLA, o null.
     *
     * `ShopDisplay::QuickTap` no hace nada si está comprado, vacío o el objeto no está
     * verificado, así que esos no se devuelven: el toque pasa de largo, como en el juego.
     */
    function enPunto(mapId, sx, sy, offsetX, offsetY, s) {
        const lista = deMapa(mapId);
        if (!lista.length) return null;
        const cfg = (global.MapDef && global.MapDef.config(mapId)) || {};
        const ppu = cfg.ppu || 150;
        // De delante hacia atrás: gana el de más abajo, que es el que se pinta encima.
        lista.sort((a, b) => (a.y - b.y));
        for (const e of lista) {
            if (e.bought || e.empty || !verificado(e)) continue;
            const donde = e.hijos.find(h => h.papel === 'itemRenderer');
            const url = urlDelObjeto(e.itemId);
            const img = imgs[url];
            if (!img) { cargarImagen(url); continue; }
            let x0, y0, w, h;
            if (donde) {
                const p = donde.ppu || ppu;
                const f = ppu / p;
                w = (donde.rw != null ? donde.rw : img.naturalWidth) * f * s
                    * Math.abs(donde.sx == null ? 1 : donde.sx);
                h = (donde.rh != null ? donde.rh : img.naturalHeight) * f * s
                    * Math.abs(donde.sy == null ? 1 : donde.sy);
                x0 = offsetX + (donde.x || 0) * ppu * s - (donde.px == null ? 0.5 : donde.px) * w;
                y0 = offsetY - (donde.y || 0) * ppu * s
                     - (1 - (donde.py == null ? 0.5 : donde.py)) * h;
            } else {
                w = img.naturalWidth * s;
                h = img.naturalHeight * s;
                x0 = offsetX + (e.x || 0) * 150 * s - w / 2;
                y0 = offsetY - (e.y || 0) * 150 * s - h * 0.92;
            }
            if (sx >= x0 && sx <= x0 + w && sy >= y0 && sy <= y0 + h) return e;
        }
        return null;
    }

    /** `ShopDisplay::QuickTap`: abre el `Viewer` y suena `cardOpen`. */
    function tocar(mapId, sx, sy, offsetX, offsetY, s) {
        const e = enPunto(mapId, sx, sy, offsetX, offsetY, s);
        if (!e) return null;
        if (global.PlaySfx) global.PlaySfx.sonar(SFX_ABRIR, { volumen: VOL_ABRIR });
        if (typeof global.abrirViewerTienda === 'function') global.abrirViewerTienda(e);
        return e;
    }

    // ── La compra ───────────────────────────────────────────────────────────

    /**
     * `ShopDisplay::Buy()`, en el mismo orden y con los mismos cortes.
     *
     * Devuelve uno de `RESULTADO`, que es el `ShopDisplay.PurchaseResult` del juego.
     */
    function comprar(mapId, objectID) {
        const p = global.app && global.app.parser;
        if (!p) return { resultado: RESULTADO.SIN_ZANAHORIAS, razon: 'sin partida' };
        const lista = deMapa(mapId);
        const e = lista.find(d => Number(d.objectID) === Number(objectID));
        if (!e) return { resultado: RESULTADO.SIN_ZANAHORIAS, razon: 'no hay ese expositor' };
        if (e.bought) return { resultado: RESULTADO.SIN_ZANAHORIAS, razon: 'ya vendido' };
        if (!verificado(e)) return { resultado: RESULTADO.SIN_ZANAHORIAS, razon: 'sin verificar' };

        const coste = precio(e.itemId, descuentoDe(mapId, e.shopIdx));
        // El saldo vive en `generalVars.carrots`, que es de donde lo lee y lo escribe
        // `parser.addCarrots`.
        const zanahorias = Number(p.generalVars && p.generalVars.carrots
                                  ? p.generalVars.carrots.value : 0) || 0;
        if (zanahorias < coste) {
            return { resultado: RESULTADO.SIN_ZANAHORIAS, coste, zanahorias };
        }

        // `items.TryAdd(item, quantity, true, null)`. El port no modela la bolsa llena, así
        // que si la inyección falla se devuelve `NoInventorySpace`, que es lo que haría el
        // juego, en vez de cobrar y perder el objeto.
        let metido = false;
        try {
            const tipo = Number(e.itemId) > 0 ? 1 : 0;
            metido = p.injectInventoryItem(Math.abs(Number(e.itemId)),
                                           e.quantity || 1, false, tipo) !== false;
        } catch (err) { metido = false; }
        if (!metido) return { resultado: RESULTADO.BOLSA_LLENA, coste };

        // Cobrar. `TsukiSave.carrotsSpent += precio` ya lo hace `parser.addCarrots` cuando
        // el delta es negativo, así que NO se vuelve a sumar aquí: hacerlo lo contaba dos
        // veces. (El único sitio del juego que lee ese campo es
        // `AchievementData.BigSpender::Check`, que es como se identificó el offset 0xcc.)
        if (typeof p.addCarrots === 'function') p.addCarrots(-coste);
        if (typeof p.bumpCounter === 'function') {
            p.bumpCounter(Number(e.itemId) > 0 ? 'furnitureBought' : 'itemsBought',
                          e.quantity || 1);
        }
        if (global.Progress && typeof global.Progress.anotar === 'function') {
            global.Progress.anotar(Math.abs(Number(e.itemId)));
        }

        // `displaySave.bought = true`, escrito en la partida.
        const displays = (e._tienda.displays || []).map(
            d => (d.index === e.indice ? Object.assign({}, d, { bought: true }) : d));
        if (typeof p.setShopSave === 'function') {
            p.setShopSave(e.sublocId, e.shopIdx, { displays });
        }

        // `Shop::MadePurchase`: la primera línea de compra válida suelta la frase.
        let convo = null;
        try { convo = frasePorCompra(mapId, e.itemId); } catch (err) { /* sin líneas */ }

        // `BounceDisplay` y el sonido, en ese orden.
        rebotar(e.objectID);
        if (global.PlaySfx) global.PlaySfx.sonar(SFX_COMPRA, { volumen: VOL_COMPRA });
        if (global.app && global.app.refreshCarrotsUI) global.app.refreshCarrotsUI();
        if (global.app && global.app.map && global.app.map.draw) global.app.map.draw();

        return { resultado: RESULTADO.COMPRADO, coste, itemId: e.itemId,
                 cantidad: e.quantity || 1, convo };
    }

    global.PlayShops = {
        RESULTADO,
        SFX_ABRIR, SFX_COMPRA, VOL_ABRIR, VOL_COMPRA,
        BOTE_ESCALA, BOTE_VELOCIDAD,
        get datos() { return datos; },
        cargar, usarDatos, nivelDe, deMapa,
        precio, descuentoDe, redondearBanquero, verificado, urlDelObjeto,
        viablesConPrioridad, tiendasDeCatalogo, sortearTienda,
        lineaDeCompra, condicionesOk, frasePorCompra,
        dibujar, enPunto, tocar, comprar,
        rebotar, escalaBote, animando,
    };

    if (typeof document !== 'undefined' && document.addEventListener) {
        document.addEventListener('DOMContentLoaded', () => { cargar(); });
    }
})(typeof window !== 'undefined' ? window : globalThis);
