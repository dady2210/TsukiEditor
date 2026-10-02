/**
 * farming_system.js - Módulo 4: Sistema de Granja y Cosecha (Farming Loop)
 * Basado en CropSave_Completo.c, CropItem, CropBoxSave y la estructura de Tsuki's Odyssey.
 */

(function(window) {
    'use strict';

    const CROP_CATALOG = {
        342: {
            id: 342,
            name: 'Zanahoria',
            name_en: 'Carrot',
            seedId: 342,
            harvestItemId: 321,
            strangeItemId: 219,
            baseMinutes: 120, // CarrotItem, fuera del tutorial
            baseYield: 20,    // CarrotItem::GetBaseHarvestAmount = `mov w0, #0x14`
            infinite: true,   // Se auto-resiembra automáticamente
            icon: '🥕',
            color: '#e67e22'
        },
        345: {
            id: 345,
            name: 'Sandía',
            name_en: 'Watermelon',
            seedId: 345,
            harvestItemId: 126,
            strangeItemId: 222,
            baseMinutes: 360, // 6 horas
            baseYield: 1,
            infinite: false,
            icon: '🍉',
            color: '#27ae60'
        },
        1208: {
            id: 1208,
            name: 'Cebolla',
            name_en: 'Onion',
            seedId: 1208,
            harvestItemId: 220,
            strangeItemId: 221,
            baseMinutes: 180, // Onion.OnionItem: `mov w0, #0xb4`
            baseYield: 1,
            infinite: false,
            icon: '🧅',
            color: '#d35400'
        },
        1230: {
            id: 1230,
            name: 'Calabaza',
            name_en: 'Pumpkin',
            seedId: 1230,
            harvestItemId: 223,
            strangeItemId: 224,
            rottenItemId: 225,
            baseMinutes: 120,
            rottenAfterMinutes: 60, // Se pudre 60 min después de madurar
            baseYield: 1,
            infinite: false,
            icon: '🎃',
            color: '#f39c12'
        },
        1231: {
            id: 1231,
            name: 'Raíz Oscura',
            name_en: 'Gloamroot',
            seedId: 1231,
            harvestItemId: 226,
            strangeItemId: 227,
            baseMinutes: 120, // Gloamroot.GloamrootItem: `mov w0, #0x78`
            baseYield: 1,
            infinite: false,
            icon: '🌿',
            color: '#8e44ad'
        },
        1232: {
            id: 1232,
            name: 'Papa',
            name_en: 'Potato',
            seedId: 1232,
            harvestItemId: 232,
            strangeItemId: 233,
            baseMinutes: 60,  // Potato.PotatoItem: `mov w0, #0x3c`
            baseYield: 1,
            infinite: false,
            icon: '🥔',
            color: '#a0522d'
        },
        1233: {
            id: 1233,
            name: 'Rábano',
            name_en: 'Turnip',
            seedId: 1233,
            harvestItemId: 228,
            strangeItemId: 229,
            baseMinutes: 120,
            baseYield: 1,
            infinite: false,
            icon: '🌱',
            color: '#e74c3c'
        },
        1237: {
            id: 1237,
            name: 'Fresa',
            name_en: 'Strawberry',
            seedId: 1237,
            harvestItemId: 234,
            strangeItemId: 235,
            baseMinutes: 120, // Strawberry.StrawberryItem: `mov w0, #0x78`
            baseYield: 1,
            infinite: false,
            icon: '🍓',
            color: '#e84393'
        },
        1238: {
            id: 1238,
            name: 'Uvas',
            name_en: 'Grapes',
            seedId: 1238,
            harvestItemId: 230,
            strangeItemId: 231,
            baseMinutes: 120, // Grapes.GrapesItem: `mov w0, #0x78`
            baseYield: 1,
            infinite: false,
            icon: '🍇',
            color: '#6c5ce7'
        }
    };

    // ═══════════════════════════════════════════════════════════════════════════
    //  LO QUE DICE EL BINARIO
    // ═══════════════════════════════════════════════════════════════════════════
    //
    // Cuatro cosas de este modulo estaban inventadas. Las cuatro salen ahora de
    // `data/crop_code.json`, que escribe `tools/extract_crop_code.py` releyendo el
    // .so; aqui debajo esta el respaldo por si no se puede cargar el JSON.
    //
    // 1. LA TASA DE CULTIVO EXTRANYO ERA 33 VECES MAYOR.
    //    Habia un `Math.random() < 0.05`. El juego declara
    //        public const float BaseStrangeRate = 0,0015;
    //    y `Clover.CloverItem::get_StrangeRate` es `get_Multiplier() * 0.0015`, con
    //        get_Multiplier = Math.Log(CloverPower + 1) + 1
    //    Sin ningun trebol plantado (CloverPower = 0) el multiplicador es 1 y la tasa
    //    queda en 0,15%.
    //
    // 2. EL DADO SE TIRABA EN EL MOMENTO EQUIVOCADO.
    //    El port lo tiraba AL RESEMBRAR. El juego lo tira AL MADURAR: las tres puertas
    //    que ponen `ripe` (`set_HarvestTime`, `SetRipe`, `get_IsRipe`) llevan pegado el
    //    mismo par de instrucciones
    //        bl Random::get_value ; bl get_StrangeRate ; fcmp s8, s0 ; cset w8, mi
    //    y al resembrar, `CropSave::ResetHarvestTime` acaba con `strh wzr, [x19, #0x28]`:
    //    un store de media palabra que pone `ripe` Y `strange` a cero de una vez.
    //    La comparacion es estricta (`cset w8, mi` = menor que).
    //
    // 3. LA CALABAZA SE PUDRIA AUNQUE FUESE EXTRANYA.
    //    `Pumpkin.PumpkinSave::UpdateTimeRaw` exige tres cosas: que este madura, que NO
    //    sea extranya (`ldrb w8, [x19, #0x29] ; cbnz -> fuera`) y que haya pasado MAS de
    //    una hora (`fcmp d0, #1.0 ; b.le -> fuera`). Y solo la calabaza: es la unica
    //    clase que redefine `HasYieldItem` y la unica con `rottenPumpkinID`.
    //
    // 4. CINCO DE LOS NUEVE TIEMPOS DE CRECIMIENTO ESTABAN MAL, y la zanahoria daba 250
    //    en vez de 20. Cada `get_BaseTimeToHarvest` es un `mov w0, #N ; ret` por clase;
    //    `CarrotItem::GetBaseHarvestAmount` es `mov w0, #0x14`.
    //
    // Lo que NO se modela, y se dice para que no parezca leido: los tres tréboles
    // premium (`Clover.CloverItem`), que suben la tasa de extranyos y bajan el tiempo
    // de crecimiento con `n^3 / (n^3 + 2047)`. El editor no coloca tréboles, asi que
    // `poderDeTrebol` se queda en 0 y el multiplicador en 1, que es el caso de
    // cualquier partida sin ese mueble.
    const CODIGO_RESPALDO = {
        tasaExtranyaBase: 0.0015,
        minutos: {
            zanahoria: 120, sandia: 360, cebolla: 180, calabaza: 120, raizOscura: 120,
            papa: 60, rabano: 120, fresa: 120, uvas: 120, seta: 240,
        },
        zanahoria: { normal: 120, tutorial: [5, 10, 20, 60] },
        podrida: { horas: 1, estricto: true, soloSiNoEsExtranya: true },
    };

    // El mote de cada semilla, para casar `crop_code.json` con el catalogo.
    const MOTE_POR_SEMILLA = {
        342: 'zanahoria', 345: 'sandia', 1208: 'cebolla', 1230: 'calabaza',
        1231: 'raizOscura', 1232: 'papa', 1233: 'rabano', 1237: 'fresa', 1238: 'uvas',
    };

    let codigo = CODIGO_RESPALDO;

    /** Mete los valores leidos del binario. La usan `cargarCodigo()` y las pruebas. */
    function usarCodigo(c) {
        if (!c || typeof c !== 'object') return codigo;
        codigo = {
            tasaExtranyaBase: typeof c.tasaExtranyaBase === 'number'
                ? c.tasaExtranyaBase : CODIGO_RESPALDO.tasaExtranyaBase,
            minutos: Object.assign({}, CODIGO_RESPALDO.minutos, c.minutos || {}),
            zanahoria: Object.assign({}, CODIGO_RESPALDO.zanahoria, c.zanahoria || {}),
            podrida: Object.assign({}, CODIGO_RESPALDO.podrida, c.podrida || {}),
        };
        for (const sem in MOTE_POR_SEMILLA) {
            const d = CROP_CATALOG[sem];
            const m = codigo.minutos[MOTE_POR_SEMILLA[sem]];
            if (d && typeof m === 'number') d.baseMinutes = m;
        }
        return codigo;
    }

    /** ¿Tiene este nodo un campo con ese nombre, a cualquier profundidad? */
    function findEnNodo(nodo, nombre) {
        if (!nodo) return null;
        let hit = null;
        (function anda(n, prof) {
            if (hit || !n || prof > 6) return;
            for (const c of (n.children || [])) {
                if (c.name === nombre) { hit = c; return; }
                anda(c, prof + 1);
            }
        })(nodo, 0);
        return hit;
    }

    class FarmingSystem {
        constructor(app) {
            this.app = app;
            this.catalog = CROP_CATALOG;
            this.floatingRewards = []; // { x, y, text, color, life, maxLife }
            this._animFrame = null;
            // `Clover.CloverItem.CloverPower`, la suma de los tréboles plantados. El
            // editor no coloca tréboles, así que se queda en 0: multiplicador 1.
            this.poderDeTrebol = 0;
        }

        /** Los valores del binario, de `data/crop_code.json`. */
        static async cargarCodigo() {
            try {
                const r = await fetch('data/crop_code.json');
                if (!r.ok) return false;
                usarCodigo(await r.json());
                return true;
            } catch (e) { return false; }
        }

        /** Para las pruebas, que no tienen `fetch`. */
        static usarCodigo(c) { return usarCodigo(c); }

        static get codigo() { return codigo; }

        get parser() {
            return this.app?.parser || null;
        }

        nowToOADate() {
            return Date.now() / 86400000 + 25569;
        }

        minutesToOADays(minutes) {
            return minutes / (24 * 60);
        }

        /**
         * `Clover.CloverItem::get_StrangeRate` = `get_Multiplier() * BaseStrangeRate`,
         * con `get_Multiplier() = Math.Log(CloverPower + 1) + 1`.
         * Sin tréboles: 1 * 0,0015 = 0,15%.
         */
        tasaExtranya(poderDeTrebol) {
            const p = Math.max(0, poderDeTrebol || 0);
            return (Math.log(p + 1) + 1) * codigo.tasaExtranyaBase;
        }

        /** El dado de las tres puertas: `Random.value < StrangeRate`, estricto. */
        tirarExtranya(poderDeTrebol) {
            return Math.random() < this.tasaExtranya(poderDeTrebol);
        }

        /**
         * `CarrotItem::get_BaseTimeToHarvest`: la tabla del tutorial se indexa con
         * `tutorialStep + 4` cuando el paso está entre -4 y -1; con cualquier otro
         * valor son los 120 minutos de siempre.
         */
        minutosZanahoria(tutorialStep) {
            const t = tutorialStep | 0;
            const tabla = codigo.zanahoria.tutorial || [];
            if (t >= -4 && t <= -1 && tabla.length === 4) return tabla[t + 4];
            return codigo.zanahoria.normal;
        }

        getCropDefinition(itemId) {
            return this.catalog[itemId] || {
                id: itemId,
                name: `Cultivo #${itemId}`,
                seedId: itemId,
                harvestItemId: itemId,
                baseMinutes: 120,
                baseYield: 1,
                infinite: false,
                icon: '🌱',
                color: '#2ecc71'
            };
        }

        /**
         * Obtiene el estado de crecimiento exacto de una parcela o semilla
         */
        /**
         * La caja guarda el id del *fruto* (223 calabaza, 230 uvas…), no el de la
         * semilla (1230, 1238…). Se buscaba en el catálogo por id de semilla, no
         * casaba ninguno y salía "Cultivo #230". Este índice va al revés.
         */
        get yieldIndex() {
            if (!this._yieldIdx) {
                const idx = {};
                for (const k in this.catalog) {
                    const d = this.catalog[k];
                    for (const f of ['harvestItemId', 'strangeItemId', 'rottenItemId']) {
                        if (d[f]) idx[d[f]] = d;
                    }
                }
                this._yieldIdx = idx;
            }
            return this._yieldIdx;
        }

        /** Nombre real del fruto: "Uvas", "Calabaza Podrida"… lo tiene items_db. */
        cropItemName(id) {
            const it = window.ITEMS_DB && window.ITEMS_DB[String(id)];
            const nm = it && (it.name_es || it.name_en);
            if (nm) return nm;
            const d = this.yieldIndex[id] || this.catalog[id];
            return (d && d.name) || `Ítem ${id}`;
        }

        cropItemIcon(id) {
            const d = this.yieldIndex[id] || this.catalog[id];
            return (d && d.icon) || '🌾';
        }

        getCropStatus(plotOrSeed) {
            const parser = this.parser;
            if (!parser) return null;

            let plot = null;
            let seed = null;

            if (plotOrSeed.item_id === 306 || plotOrSeed.item_id === 411) {
                plot = plotOrSeed;
                seed = plot.linkedSeed;
            } else {
                seed = plotOrSeed;
                plot = seed.linkedPlot;
            }

            if (!seed && (!plot || plot.planted_id <= 0)) {
                return { hasCrop: false, isReady: false, stage: 0, progress: 0 };
            }

            const cropId = seed ? seed.item_id : (plot ? plot.planted_id : 342);
            const def = this.getCropDefinition(cropId);
            const fields = seed ? parser.getCropSaveFields(seed) : null;

            const nowOA = this.nowToOADate();
            let placedOA = fields?.placedNode?.value ?? seed?.placedOA;
            let harvestTimeOA = fields?.harvestTimeNode?.value ?? seed?.harvestTimeOA;
            let isRipeFlag = fields?.ripeNode ? !!fields.ripeNode.value : false;
            let isStrangeFlag = fields?.strangeNode ? !!fields.strangeNode.value : false;

            // Inicialización de seguridad si no hay timestamps en el nodo
            if (placedOA == null || isNaN(placedOA) || placedOA <= 0) {
                placedOA = nowOA;
                if (fields?.placedNode) fields.placedNode.value = placedOA;
            }
            if (harvestTimeOA == null || isNaN(harvestTimeOA) || harvestTimeOA <= 0) {
                harvestTimeOA = placedOA + this.minutesToOADays(def.baseMinutes);
                if (fields?.harvestTimeNode) fields.harvestTimeNode.value = harvestTimeOA;
            }

            const totalSpan = Math.max(0.0001, harvestTimeOA - placedOA);
            const elapsed = nowOA - placedOA;
            let progress = Math.min(1.0, Math.max(0.0, elapsed / totalSpan));

            let isRipe = isRipeFlag || (nowOA >= harvestTimeOA) || (progress >= 1.0);
            if (isRipe && fields?.ripeNode && !fields.ripeNode.value) {
                // `get_IsRipe`: al pasar `ripe` de false a true se tira el dado del
                // cultivo extranyo, y solo ahí. Antes esto solo ponía `ripe`.
                fields.ripeNode.value = true;
                if (fields.strangeNode) {
                    isStrangeFlag = this.tirarExtranya(this.poderDeTrebol);
                    fields.strangeNode.value = isStrangeFlag;
                }
            }

            // `Pumpkin.PumpkinSave::UpdateTimeRaw`. Tres condiciones, no una: madura,
            // NO extranya, y MÁS de una hora (`b.le` se sale, así que 60 clavados aún
            // no se pudre). Solo la calabaza tiene `rottenPumpkinID`.
            let isRotten = false;
            if (def.rottenItemId && isRipe
                && !(codigo.podrida.soloSiNoEsExtranya && isStrangeFlag)) {
                const horasPasadas = (nowOA - harvestTimeOA) * 24;
                isRotten = codigo.podrida.estricto
                    ? horasPasadas > codigo.podrida.horas
                    : horasPasadas >= codigo.podrida.horas;
            }

            // Etapas (0: Semilla/brote inicial, 1: Brote joven, 2: Creciendo, 3: Maduro, 4: Podrido)
            let stage = 0;
            if (isRotten) {
                stage = 4;
            } else if (isRipe) {
                stage = 3;
            } else if (progress >= 0.66) {
                stage = 2;
            } else if (progress >= 0.33) {
                stage = 1;
            } else {
                stage = 0;
            }

            const daysLeft = Math.max(0, harvestTimeOA - nowOA);
            const minutesLeft = Math.round(daysLeft * 24 * 60);

            return {
                hasCrop: true,
                cropId,
                def,
                plot,
                seed,
                placedOA,
                harvestTimeOA,
                nowOA,
                progress,
                isRipe,
                isReady: isRipe,
                isRotten,
                isStrange: isStrangeFlag,
                stage,
                daysLeft,
                minutesLeft
            };
        }

        /**
         * Cosecha una parcela individual
         */
        harvestPlot(plot, options = {}) {
            const status = this.getCropStatus(plot);
            if (!status || !status.hasCrop) {
                return { success: false, reason: 'empty' };
            }

            if (!status.isReady && !options.force) {
                return { success: false, reason: 'not_ready', minutesLeft: status.minutesLeft };
            }

            const parser = this.parser;
            const def = status.def;
            const nowOA = this.nowToOADate();
            let harvestedItem = null;
            let carrotsAdded = 0;

            // El juego lleva la cuenta de cuántas veces has cosechado.
            if (parser && typeof parser.bumpCounter === 'function') {
                parser.bumpCounter('harvestTimes', 1);
            }
            // `SFXClip.FarmSingle`: cosechar una. Si viene de `harvestAll`, ese pone
            // ademas `farmMultiple` al acabar.
            if (window.PlaySfx) window.PlaySfx.sonar('farmSingle');

            if (def.id === 342) {
                // La zanahoria es la moneda del juego: no pasa por la caja, se suma
                // directa al contador del jugador. addCarrots() escribe además la
                // variable general en el buffer, así que queda en el csave.
                carrotsAdded = def.baseYield;
                if (parser) {
                    parser.addCarrots(carrotsAdded);
                    // Refrescar el HUD y el espejo del editor, o al guardar desde allí
                    // se volvería a escribir el total viejo.
                    this.app?.refreshCarrotsUI?.();
                }

                // Re-siembra automática infinita
                if (status.seed) {
                    const fields = parser.getCropSaveFields(status.seed);
                    if (fields) {
                        if (fields.placedNode) fields.placedNode.value = nowOA;
                        if (fields.harvestTimeNode) fields.harvestTimeNode.value = nowOA + this.minutesToOADays(def.baseMinutes);
                        // `CropSave::ResetHarvestTime` acaba con `strh wzr, [x19, #0x28]`:
                        // pone `ripe` Y `strange` a cero. El dado se tira al madurar, no
                        // aquí; antes había un `Math.random() < 0.05` inventado.
                        if (fields.ripeNode) fields.ripeNode.value = false;
                        if (fields.strangeNode) fields.strangeNode.value = false;
                    }
                    status.seed.placedOA = nowOA;
                    status.seed.harvestTimeOA = nowOA + this.minutesToOADays(def.baseMinutes);
                }
                harvestedItem = { id: 321, name: 'Zanahoria', qty: carrotsAdded, icon: '🥕' };
            } else {
                // Cultivo especial consumible
                let yieldId = def.harvestItemId;
                if (status.isRotten && def.rottenItemId) yieldId = def.rottenItemId;
                else if (status.isStrange && def.strangeItemId) yieldId = def.strangeItemId;

                if (parser) {
                    parser.addCropToCropBox(yieldId, 1);
                }

                // El nombre lo pone items_db, que ya distingue "Calabaza",
                // "Calabaza Extraña" y "Calabaza Podrida".
                harvestedItem = { id: yieldId, name: this.cropItemName(yieldId), qty: 1, icon: def.icon };

                // Consumir la semilla: la parcela queda vacía
                if (status.seed && parser) {
                    parser.removePlacement(status.seed);
                }
                if (plot) {
                    plot.planted_id = -1;
                    plot.linkedSeed = null;
                }
            }

            // Animación de arrancar el cultivo, con el sprite que traía el juego.
            // Se lanza aquí para que valga igual al tocar la parcela que con la hoz.
            if (plot && this.app?.map?.playCropHarvestFx) {
                const role = status.isRotten ? 'rotten' : (status.isStrange ? 'strange' : 'harvest');
                this.app.map.playCropHarvestFx(plot, def.id, role);
            }

            // Spawn visual reward text
            if (this.app?.map) {
                const center = this.app.map.getIsoCoords(plot.x + 1, plot.y + 1, plot.floor, plot.cluster);
                const rewardText = carrotsAdded > 0 ? `+${carrotsAdded} 🥕` : `+1 ${harvestedItem.icon}`;
                this.addFloatingReward(center.x, center.y, rewardText, def.color || '#f1c40f');
            }

            // Auto-guardado de sesión
            if (this.app?.tsukiPort?.triggerAutosave) {
                this.app.tsukiPort.triggerAutosave();
            }

            return {
                success: true,
                plot,
                harvestedItem,
                carrotsAdded,
                cropId: def.id
            };
        }

        /**
         * Acción de Hoz (Sickle): Cosecha todos los cultivos listos de la granja
         */
        /**
         * `Farm.PlantAll()`: sembrar en todas las parcelas vacias.
         *
         * Es lo que hace `PlantAllButton`, y siembra **semillas de zanahoria** (la 342, la
         * misma que da el tutorial): el boton se llama `PlantCarrots` en `MenuBar`.
         *
         * La semilla no es un campo de la parcela sino un mueble aparte enlazado por
         * `linkedParent.placementID`, asi que sembrar es CREAR un mueble. Se reusa
         * `app.createFurniturePlacement`, que es lo que ya usa el editor: clona un nodo,
         * le pone `nodeId` nuevos y le calcula el `verificationID`.
         *
         * Se gastan las semillas que haya: si llevas tres, se siembran tres parcelas.
         */
        plantAll(subloc = 6, seedId = 342) {
            const parser = this.parser;
            if (!parser) return { count: 0, motivo: 'sin partida' };

            const vacias = (parser.placements || []).filter(p =>
                Number(p.subloc_id ?? p.cluster) === subloc
                && (p.item_id === 306 || p.item_id === 411)
                && !p.linkedSeed && !(p.planted_id > 0));
            if (!vacias.length) return { count: 0, motivo: 'no hay parcelas vacias' };

            const llevo = (parser.inventory || [])
                .filter(x => Number(x.item_id) === Number(seedId))
                .reduce((a, x) => a + (Number(x.qty) || 0), 0);
            if (llevo <= 0) return { count: 0, motivo: 'no llevas semillas' };

            const crear = this.app && typeof this.app.createFurniturePlacement === 'function'
                ? this.app.createFurniturePlacement.bind(this.app) : null;
            if (!crear) return { count: 0, motivo: 'el port no sabe crear muebles aqui' };

            // LA PLANTILLA TIENE QUE SER OTRA SEMILLA.
            //
            // Un `CropSave` lleva `harvestTimeOA`, `placedOA`, `ripe`, `strange` y
            // `parentPlacementID`, y clonando un mueble cualquiera el clon sale sin
            // ninguno: la semilla existe y la parcela sigue contando como vacia.
            const modelo = (parser.placements || []).find(x =>
                x.furnNode && parser.getCropSaveFields(x)
                && parser.getCropSaveFields(x).harvestTimeNode
                && findEnNodo(x.furnNode, 'parentPlacementID'));
            if (!modelo) return { count: 0, motivo: 'esta partida no trae ninguna semilla de la que copiar' };
            // `deepCloneNode` acepta un objeto llano {value: nodo}, que es la forma
            // que tienen los elementos de la lista de muebles.
            const plantilla = { value: modelo.furnNode };

            const ahora = this.nowToOADate();
            const def = this.getCropDefinition(Number(seedId));
            let puestas = 0;
            for (const plot of vacias) {
                if (puestas >= llevo) break;
                let nuevo = null;
                try {
                    // En (0,0): las coordenadas de una semilla son LOCALES a su
                    // parcela, y `setSeedParent` es quien la cuelga.
                    nuevo = crear({ itemId: Number(seedId), x: 0, y: 0,
                                    floor: plot.floor, cluster: subloc,
                                    plantilla });
                } catch (e) { nuevo = null; }
                if (!nuevo) break;
                // La semilla cuelga de SU parcela: sin esto la siembra no se ve.
                try { parser.setSeedParent(nuevo, plot); } catch (e) {}
                // Y empieza a crecer AHORA, no cuando creciera la que sirvio de molde.
                const f = parser.getCropSaveFields(nuevo);
                if (f) {
                    if (f.placedNode) f.placedNode.value = ahora;
                    if (f.harvestTimeNode) {
                        f.harvestTimeNode.value = ahora
                            + this.minutesToOADays(def ? def.baseMinutes : 60);
                    }
                    if (f.ripeNode) f.ripeNode.value = false;
                    if (f.strangeNode) f.strangeNode.value = false;
                    if (f.consumedNode) f.consumedNode.value = false;
                }
                puestas++;
            }
            if (!puestas) return { count: 0, motivo: 'no se pudo sembrar' };

            try { parser.deductInventoryItem(seedId, puestas); } catch (e) {}
            // `SFXClip.PlotPlantAll`, que es el sonido de este mismo boton.
            if (window.PlaySfx) window.PlaySfx.sonar('plotPlantAll');
            try { parser.parseMap(); } catch (e) {}
            this.app?.showToast?.('\u{1F331} ' + puestas + ' parcelas sembradas.', 'success');
            if (this.app?.map) this.app.map.draw();
            this.updateSickleButtonBadge();
            return { count: puestas };
        }

        /**
         * `HoeButton`: el modo de EDITAR PARCELAS, no de labrar una a una.
         *
         * En el juego es `Farm.EditPlots(bool)` con `Farm.PlotEditMode
         * {None, Adding, Removing, WaitForRelease}` y las listas `plotsToAdd` /
         * `plotsToRemove`: mientras esta puesto, tocar el suelo anyade parcela y tocar una
         * parcela la quita.
         *
         * El port lleva el modo y lo dice; anyadir y quitar pasan por
         * `createFurniturePlacement` y `parser.removePlacement`, que ya existen.
         */
        toggleHoe(forzar) {
            this.hoeMode = (forzar != null) ? !!forzar : !this.hoeMode;
            // `SFXClip.HoeButtonOpen` / `HoeButtonClose`.
            if (window.PlaySfx) {
                window.PlaySfx.sonar(this.hoeMode ? 'hoeButtonOpen' : 'hoeButtonClose');
            }
            const b = typeof document !== 'undefined'
                ? document.getElementById('btn-port-hoe') : null;
            if (b) b.classList.toggle('activo', this.hoeMode);
            if (typeof document !== 'undefined') {
                document.body.classList.toggle('modo-azada', this.hoeMode);
            }
            this.app?.showToast?.(this.hoeMode
                ? '\u{1FAB4} Modo azada: toca el suelo para a\u00f1adir parcela, o una parcela para quitarla.'
                : 'Modo azada apagado.', this.hoeMode ? 'success' : 'info');
            if (this.app?.map) this.app.map.draw();
            return this.hoeMode;
        }

        /** ¿Esta puesto el modo azada? Lo consulta `map.js` al tocar el suelo. */
        enModoAzada() { return !!this.hoeMode; }

        /** `plotsToAdd`: anyadir una parcela donde se ha tocado. */
        anyadirParcela(subloc, x, y, floor) {
            const crear = this.app && typeof this.app.createFurniturePlacement === 'function'
                ? this.app.createFurniturePlacement.bind(this.app) : null;
            if (!crear) return false;
            let nuevo = null;
            try {
                nuevo = crear({ itemId: 306, x, y, floor: floor || 0, cluster: subloc });
            } catch (e) { nuevo = null; }
            if (!nuevo) return false;
            // `SFXClip.PlotPutDown`: poner una parcela.
            if (window.PlaySfx) window.PlaySfx.sonar('plotPutDown');
            try { this.parser.parseMap(); } catch (e) {}
            if (this.app?.map) this.app.map.draw();
            return true;
        }

        /** `plotsToRemove`: quitar una parcela. La semilla que tuviera se va con ella. */
        quitarParcela(plot) {
            const parser = this.parser;
            if (!parser || !plot) return false;
            if (plot.linkedSeed) {
                try { parser.removePlacement(plot.linkedSeed); } catch (e) {}
            }
            let ok = false;
            try { ok = parser.removePlacement(plot); } catch (e) { ok = false; }
            if (ok) {
                // `SFXClip.PlotPickUp`: levantar una parcela.
                if (window.PlaySfx) window.PlaySfx.sonar('plotPickUp');
                try { parser.parseMap(); } catch (e) {}
                if (this.app?.map) this.app.map.draw();
            }
            return ok;
        }

        harvestAll(subloc = 6) {
            const parser = this.parser;
            if (!parser) return { count: 0, carrots: 0, items: [] };

            const plots = (parser.placements || []).filter(p => 
                Number(p.subloc_id ?? p.cluster) === subloc && 
                (p.item_id === 306 || p.item_id === 411) && 
                (p.planted_id > 0 || p.linkedSeed)
            );

            let harvestedCount = 0;
            let totalCarrots = 0;
            const harvestedItems = [];

            for (const plot of plots) {
                const status = this.getCropStatus(plot);
                if (status && status.isReady) {
                    const res = this.harvestPlot(plot);
                    if (res.success) {
                        harvestedCount++;
                        if (res.carrotsAdded) totalCarrots += res.carrotsAdded;
                        if (res.harvestedItem) harvestedItems.push(res.harvestedItem);
                    }
                }
            }

            if (harvestedCount > 0) {
                // `SFXClip.FarmMultiple`: cosechar de golpe. La de una sola es
                // `farmSingle`, y la pone `harvestPlot`.
                if (window.PlaySfx) window.PlaySfx.sonar('farmMultiple');
                let msg = `🌾 ¡Hoz utilizada! ${harvestedCount} cultivos cosechados.`;
                if (totalCarrots > 0) msg += ` (+${totalCarrots}🥕 en CropBox)`;
                this.app?.showToast?.(msg, 'success');
            } else {
                this.app?.showToast?.('🌾 Aún no hay cultivos maduros para cosechar con la hoz.', 'info');
            }

            if (this.app?.map) {
                this.app.map.draw();
            }

            this.updateSickleButtonBadge();
            return { count: harvestedCount, carrots: totalCarrots, items: harvestedItems };
        }

        /**
         * Maduración instantánea de todos los cultivos (para testing/editor)
         */
        matureAll() {
            const parser = this.parser;
            if (!parser) return 0;
            const count = parser.matureAllCrops();
            this.app?.showToast?.(`✨ ${count} cultivos madurados instantáneamente!`, 'success');
            if (this.app?.map) this.app.map.draw();
            this.updateSickleButtonBadge();
            return count;
        }

        /**
         * Cuenta cuántos cultivos están listos para cosechar en la Granja
         */
        countReadyCrops(subloc = 6) {
            const parser = this.parser;
            if (!parser || !parser.placements) return 0;

            let count = 0;
            for (const p of parser.placements) {
                if (Number(p.subloc_id ?? p.cluster) === subloc && (p.item_id === 306 || p.item_id === 411)) {
                    const st = this.getCropStatus(p);
                    if (st && st.isReady) count++;
                }
            }
            return count;
        }

        /**
         * Actualiza el badge del botón de la hoz en el HUD
         */
        updateSickleButtonBadge() {
            const btn = document.getElementById('btn-hud-sickle');
            const badge = document.getElementById('sickle-badge');
            if (!btn) return;

            const readyCount = this.countReadyCrops(6);
            if (badge) {
                if (readyCount > 0) {
                    badge.textContent = String(readyCount);
                    badge.style.display = 'flex';
                    btn.classList.add('pulse-glow');
                } else {
                    badge.style.display = 'none';
                    btn.classList.remove('pulse-glow');
                }
            }
        }

        /**
         * Efecto flotante de texto para recompensas de cosecha (+250🥕)
         */
        addFloatingReward(screenX, screenY, text, color = '#f1c40f') {
            this.floatingRewards.push({
                x: screenX,
                y: screenY - 20,
                text,
                color,
                life: 0,
                maxLife: 50 // frames
            });
            if (!this._animFrame) {
                this._loopFloatingRewards();
            }
        }

        _loopFloatingRewards() {
            if (!this.floatingRewards.length) {
                this._animFrame = null;
                return;
            }
            for (let i = this.floatingRewards.length - 1; i >= 0; i--) {
                const r = this.floatingRewards[i];
                r.y -= 1.2; // float upwards
                r.life++;
                if (r.life >= r.maxLife) {
                    this.floatingRewards.splice(i, 1);
                }
            }
            if (this.app?.map) {
                this.app.map.draw();
            }
            if (this.floatingRewards.length > 0) {
                this._animFrame = requestAnimationFrame(() => this._loopFloatingRewards());
            } else {
                this._animFrame = null;
            }
        }

        renderFloatingRewards(ctx) {
            if (!this.floatingRewards.length || !ctx) return;
            ctx.save();
            for (const r of this.floatingRewards) {
                const alpha = Math.max(0, 1 - (r.life / r.maxLife));
                ctx.globalAlpha = alpha;
                ctx.font = 'bold 16px "Quicksand", sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = r.color;
                ctx.shadowColor = 'rgba(0,0,0,0.8)';
                ctx.shadowBlur = 4;
                ctx.fillText(r.text, r.x, r.y);
            }
            ctx.restore();
        }

        /**
         * Abre la interfaz de usuario del CropBox
         */
        openCropBoxUI() {
            const parser = this.parser;
            if (!parser) return;
            // La ventana de verdad es `CropBoxUI`, de level14. Si esta montada, se abre
            // esa; el modal de antes se queda de respaldo por si `play_popups.js` no
            // carga. La logica -`getCropBoxSave`- es la misma en los dos.
            if (window.PlayPopups && typeof window.PlayPopups.cropBox === 'function') {
                window.PlayPopups.cropBox();
                return;
            }
            const box = parser.getCropBoxSave();

            let modal = document.getElementById('cropbox-modal');
            if (!modal) {
                modal = this._createCropBoxModalDOM();
            }

            this._populateCropBoxModalDOM(modal, box);
            modal.style.display = 'flex';
        }

        _createCropBoxModalDOM() {
            const modal = document.createElement('div');
            modal.id = 'cropbox-modal';
            modal.style.cssText = `
                position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
                background: rgba(0,0,0,0.65); z-index: 99999;
                display: none; align-items: center; justify-content: center;
                backdrop-filter: blur(4px);
            `;

            modal.innerHTML = `
                <div class="rustic-card cropbox-card" style="
                    background: #2c251e; border: 3px solid #8c6d48; border-radius: 16px;
                    padding: 24px; max-width: 460px; width: 90%; color: #f5eedc;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.6); position: relative;
                ">
                    <div style="display:flex; justify-content:space-between; align-items:center; border-bottom: 2px solid #5a422d; padding-bottom: 12px; margin-bottom: 16px;">
                        <h3 style="margin:0; font-family:'Quicksand', sans-serif; font-size: 1.35rem; color:#f1c40f; display:flex; align-items:center; gap:8px;">
                            📦 Caja de Cultivo (CropBox)
                        </h3>
                        <button id="btn-close-cropbox-modal" style="background:none; border:none; color:#e0d0b0; font-size:24px; cursor:pointer;">&times;</button>
                    </div>

                    <div style="background: #3e3328; border-radius: 10px; padding: 14px; margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between;">
                        <div>
                            <div style="font-size: 0.85rem; color: #b8a590;">Zanahorias acumuladas:</div>
                            <div id="cropbox-carrots-display" style="font-size: 1.6rem; font-weight: bold; color: #e67e22;">🥕 0</div>
                        </div>
                        <button id="btn-claim-cropbox-carrots" class="btn-primary" style="padding: 8px 16px; font-weight: bold;">
                            Recoger Zanahorias
                        </button>
                    </div>

                    <h4 style="margin: 0 0 8px 0; font-size: 1rem; color: #d5c3ab;">Cultivos Especiales Almacenados:</h4>
                    <div id="cropbox-items-container" style="max-height: 220px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px;">
                        <!-- Slots injected here -->
                    </div>

                    <div style="display: flex; gap: 10px;">
                        <button id="btn-claim-all-cropbox" class="btn-primary" style="flex: 1; padding: 10px; font-size: 0.95rem;">
                            🧺 Recoger Todo al Inventario
                        </button>
                        <button id="btn-close-cropbox-btn" class="btn-secondary" style="padding: 10px 16px;">
                            Cerrar
                        </button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            modal.querySelector('#btn-close-cropbox-modal').onclick = () => modal.style.display = 'none';
            modal.querySelector('#btn-close-cropbox-btn').onclick = () => modal.style.display = 'none';

            modal.querySelector('#btn-claim-cropbox-carrots').onclick = () => {
                const box = this.parser?.getCropBoxSave();
                if (box && box.carrots > 0) {
                    const claimed = box.carrots;
                    this.parser.transferCropBoxCarrotsToPlayer();
                    this.app?.showToast?.(`🥕 +${claimed} zanahorias recogidas de la caja!`, 'success');
                    this._populateCropBoxModalDOM(modal, this.parser.getCropBoxSave());
                    if (this.app?.map) this.app.map.draw();
                } else {
                    this.app?.showToast?.('No hay zanahorias en la caja.', 'info');
                }
            };

            modal.querySelector('#btn-claim-all-cropbox').onclick = () => {
                const res = this.parser?.collectCropBoxAll();
                if (res && (res.carrots > 0 || res.itemsCount > 0)) {
                    this.app?.showToast?.(`🧺 ¡Cosecha recogida! ${res.carrots}🥕 y ${res.itemsCount} cultivos al inventario.`, 'success');
                    this._populateCropBoxModalDOM(modal, this.parser.getCropBoxSave());
                    if (this.app?.map) this.app.map.draw();
                } else {
                    this.app?.showToast?.('La caja de cultivo está vacía.', 'info');
                }
            };

            return modal;
        }

        _populateCropBoxModalDOM(modal, box) {
            const carrotsDisplay = modal.querySelector('#cropbox-carrots-display');
            if (carrotsDisplay) {
                carrotsDisplay.textContent = `🥕 ${box.carrots || 0}`;
            }

            const container = modal.querySelector('#cropbox-items-container');
            if (!container) return;
            container.innerHTML = '';

            const validSlots = (box.slots || []).filter(s => s.cropID != null && s.cropID > 0 && s.quantity > 0);

            if (!validSlots.length) {
                container.innerHTML = `<div style="text-align:center; padding: 20px; color: #8c7865; font-size: 0.9rem;">No hay cultivos especiales en la caja.</div>`;
                return;
            }

            for (const slot of validSlots) {
                const row = document.createElement('div');
                row.style.cssText = `
                    background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 8px; padding: 8px 12px; display: flex; align-items: center; justify-content: space-between;
                `;
                row.innerHTML = `
                    <div style="display:flex; align-items:center; gap: 10px;">
                        <span style="font-size: 1.5rem;">${this.cropItemIcon(slot.cropID)}</span>
                        <div>
                            <div style="font-weight: bold; color: #f5eedc;">${this.cropItemName(slot.cropID)}</div>
                            <div style="font-size: 0.8rem; color: #b8a590;">ID: ${slot.cropID}</div>
                        </div>
                    </div>
                    <div style="font-size: 1.2rem; font-weight: bold; color: #2ecc71;">
                        x${slot.quantity}
                    </div>
                `;
                container.appendChild(row);
            }
        }
    }

    window.FarmingSystem = FarmingSystem;

    // Los valores de `extract_crop_code.py`. Sin esto se usan los del respaldo, que son
    // los mismos; pedirlos deja que se corrijan sin tocar el módulo.
    if (typeof document !== 'undefined' && document.addEventListener) {
        document.addEventListener('DOMContentLoaded', () => { FarmingSystem.cargarCodigo(); });
    }
})(window);
