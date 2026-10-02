/**
 * RoutineScheduler - Activity & Routine Dispatcher for Tsuki & NPCs
 * Evaluates current GameTime, mapId, and placed furniture to assign
 * furniture-bound and ambient activities to Tsuki and visiting/resident NPCs.
 */
(function(window) {
    'use strict';

    const RoutineScheduler = {
        // Current evaluated state
        currentSchedule: {
            mapId: 0,
            hour: 12,
            period: 'AFTERNOON',
            tsuki: null,
            actorsByPlacement: {}, // placementKey -> actor info
            ambientActors: []     // list of { actorName, charId, npcKey, activityId, actDef, gridPos }
        },

        // Overrides and presets
        preferredTime: null,
        forceVisitingNpc: null, // can be 'Chi', 'Moca', or null

        // Time periods
        getPeriod(hour) {
            if (hour >= 22 || hour < 7) return 'NIGHT';
            if (hour >= 7 && hour < 12) return 'MORNING';
            if (hour >= 12 && hour < 18) return 'AFTERNOON';
            return 'EVENING';
        },

        getClock() {
            if (this.preferredTime != null) {
                return { hour: this.preferredTime, minute: 0 };
            }
            if (window.GameTime && typeof window.GameTime.now === 'function') {
                return window.GameTime.now();
            }
            if (window.app && window.app.parser && typeof window.app.parser.getClock === 'function') {
                return window.app.parser.getClock();
            }
            const d = new Date();
            return { hour: d.getHours(), minute: d.getMinutes() };
        },

        /**
         * Core evaluation method.
         * Runs when map changes, hour changes, or user presses Re-roll.
         */
        evaluateSchedule(mapId = 0, placements = [], clock = null, forceReroll = false) {
            const clk = clock || this.getClock();
            const hour = (clk && clk.hour != null) ? clk.hour : 12;
            const period = this.getPeriod(hour);
            const numMapId = Number(mapId);
            const pHash = placements.length + '_' + (placements[0]?.item_id || 0);

            if (!forceReroll &&
                this.currentSchedule.mapId === numMapId &&
                this.currentSchedule.hour === hour &&
                this._lastHash === pHash &&
                this.currentSchedule.tsuki != null) {
                return this.currentSchedule;
            }
            this._lastHash = pHash;

            this.currentSchedule = {
                mapId: numMapId,
                hour: hour,
                period: period,
                tsuki: null,
                actorsByPlacement: {},
                ambientActors: []
            };

            const actsDb = { ...((window.ACTIVITIES_DB && window.ACTIVITIES_DB.activities) || {}) };
            if (window.ACTIVITIES_DB && Array.isArray(window.ACTIVITIES_DB.free_activities)) {
                for (const fa of window.ACTIVITIES_DB.free_activities) {
                    actsDb[String(fa.id)] = fa;
                }
            }
            const furnCats = (window.ACTIVITIES_DB && window.ACTIVITIES_DB.furniture_categories) || {};
            const seatingProfiles = (window.ACTIVITIES_DB && window.ACTIVITIES_DB.seating_profiles) || {};
            const bedProfiles = (window.BED_PROFILES && window.BED_PROFILES.beds) || {};
            const itemsDb = window.ITEMS_DB || {};

            // Helper to get placement key
            const getPlKey = (p) => {
                if (!p) return null;
                const id = p.placementID ?? p.placementId;
                return (id != null && id !== 0) ? String(id) : `${p.x}_${p.y}_${p.floor}_${p.item_id}`;
            };

            // Categorize current placements for the target map
            const mapPlacements = placements.filter(p => Number(p.cluster) === Number(mapId) && p.item_id > 0 && !p.isWall);
            
            const beds = [];
            const chairs = [];
            const baths = [];
            const tables = [];

            for (const p of mapPlacements) {
                const iId = String(p.item_id);
                const dbEntry = itemsDb[iId];
                const isBed = bedProfiles[iId] || (furnCats.bed && furnCats.bed.includes(Number(iId))) || (dbEntry && dbEntry.behaviour && dbEntry.behaviour.kind === 'bed');
                const isBath = (furnCats.bath && furnCats.bath.includes(Number(iId))) || (dbEntry && dbEntry.behaviour && dbEntry.behaviour.kind === 'bath');
                const isChair = Boolean(seatingProfiles[iId]) || (dbEntry && (dbEntry.seating_profile || (dbEntry.behaviour && (dbEntry.behaviour.kind === 'chair' || dbEntry.behaviour.interact === 'sit')))) || (furnCats.chair && furnCats.chair.includes(Number(iId))) || (furnCats.sofa && furnCats.sofa.includes(Number(iId)));
                const isTable = (furnCats.table && furnCats.table.includes(Number(iId))) || (dbEntry && dbEntry.behaviour && dbEntry.behaviour.kind === 'table');

                if (isBed) {
                    beds.push(p);
                } else if (isBath) {
                    baths.push(p);
                } else if (isChair) {
                    chairs.push(p);
                } else if (isTable) {
                    tables.push(p);
                }
            }

            // Occupied placements tracking
            const occupiedKeys = new Set();

            // ── LOS VECINOS SALEN DEL SAVE ─────────────────────────────────────
            //
            // El juego ya decidió qué hace cada vecino y dónde, y lo dejó escrito en
            // `NPCSave.activitySave`. `play_npcs.js` lo lee y le pone la animación de
            // verdad, sacada del prefab de la actividad.
            //
            // Las ramas escritas a mano de más abajo —doce, una por mapa— no salían de
            // ningún sitio del juego: «Moca se sienta en la primera silla», «Tsuki visita
            // a Moca». De ahí venían los vecinos duplicados y los que salían donde no
            // tocaba. Cuando el save tiene datos, mandan ellos y las ramas ya no ponen
            // vecinos; sólo siguen colocando a TSUKI, que no es un vecino y va aparte
            // (su actividad está en `activitySaves` con `npc = -1`, no en `NPCSave`).
            //
            // Si no hay save cargado, o el save no sitúa a nadie aquí, no se dibuja a
            // nadie: no hay nada que inventar.
            let vecinosDelSave = false;
            if (window.PlayNpcs && window.PlayNpcs.listo() && window.Activities) {
                const def0 = window.MapDef && window.MapDef.get(numMapId);
                const cluster = (def0 && def0.clusterId != null)
                    ? Number(def0.clusterId)
                    : Number(String(numMapId).match(/^(\d+)/)?.[1] || 0);
                const r = window.PlayNpcs.enSala(cluster);
                const placementPorId = {};
                for (const p of mapPlacements) {
                    const id = p.placementID ?? p.placementId;
                    if (id != null && id !== 0) placementPorId[String(id)] = p;
                }
                for (const [pid, actor] of Object.entries(r.enMueble)) {
                    const pl = placementPorId[pid];
                    if (!pl) continue;           // el mueble ya no está en esta partida
                    actor.placement = pl;
                    const k = getPlKey(pl);
                    occupiedKeys.add(k);
                    this.currentSchedule.actorsByPlacement[k] = actor;
                    vecinosDelSave = true;
                }
                for (const actor of r.sueltos) {
                    this.currentSchedule.ambientActors.push(actor);
                    vecinosDelSave = true;
                }
                this.currentSchedule.deSave = vecinosDelSave;
            }

            // ── 1. MAP 0: CASA DEL ÁRBOL (TSUKI'S TREEHOUSE) ───────────────────
            if (Number(mapId) === 0) {
                let tsukiAssigned = false;

                // ── A. TSUKI'S ROUTINE AT HOME ──
                if (period === 'NIGHT') {
                    // Bedtime (22:00 - 07:00)
                    if (beds.length > 0) {
                        const bed = beds[0];
                        const k = getPlKey(bed);
                        occupiedKeys.add(k);
                        const actDef = actsDb['348'] || { id: 348, category: 'bed' };
                        this.currentSchedule.actorsByPlacement[k] = {
                            actorName: 'Tsuki',
                            charId: 0,
                            npcKey: '0',
                            activityId: 348,
                            actDef: actDef,
                            isSleeping: true,
                            placement: bed
                        };
                        this.currentSchedule.tsuki = { type: 'furniture', placement: bed, activityId: 348, isSleeping: true };
                        tsukiAssigned = true;
                    } else if (chairs.length > 0) {
                        // Sleep/Rest in chair if no bed
                        const chair = chairs[0];
                        const k = getPlKey(chair);
                        occupiedKeys.add(k);
                        const actDef = actsDb['101'] || { id: 101, anim: { front: 'Tsuki-SitResting', back: 'Tsuki_StoveSitBack', fps: 2.5, mode: 'pingpong' } };
                        this.currentSchedule.actorsByPlacement[k] = {
                            actorName: 'Tsuki',
                            charId: 0,
                            npcKey: '0',
                            activityId: 101,
                            actDef: actDef,
                            isSleeping: false,
                            placement: chair
                        };
                        this.currentSchedule.tsuki = { type: 'furniture', placement: chair, activityId: 101, isSleeping: false };
                        tsukiAssigned = true;
                    } else {
                        // Night ambient rest on ground floor / deck
                        const actDef = actsDb['101'] || actsDb['502'];
                        this.currentSchedule.ambientActors.push({
                            actorName: 'Tsuki',
                            charId: 0,
                            npcKey: '0',
                            activityId: 502,
                            actDef: actDef,
                            gridPos: { gx: 8, gy: 8, floor: 0, orientation: 0 }
                        });
                        this.currentSchedule.tsuki = { type: 'grid', gridPos: { gx: 8, gy: 8, floor: 0, orientation: 0 }, activityId: 502 };
                        tsukiAssigned = true;
                    }
                } else {
                    // Daytime Routine (Morning, Afternoon, Evening)
                    const dayOptions = [];
                    // Chair activities
                    if (chairs.length > 0) {
                        dayOptions.push({ type: 'furniture', pool: 'chair', actId: 101, weight: 3 }); // Sit resting
                        dayOptions.push({ type: 'furniture', pool: 'chair', actId: 102, weight: 3 }); // Read book
                        dayOptions.push({ type: 'furniture', pool: 'chair', actId: 103, weight: 2 }); // Drink tea
                    }
                    // Bath activity (mostly evening/afternoon)
                    if (baths.length > 0 && (period === 'EVENING' || period === 'AFTERNOON')) {
                        dayOptions.push({ type: 'furniture', pool: 'bath', actId: 104, weight: 2 });
                    }
                    // Free ground activities
                    dayOptions.push({ type: 'grid', actId: 501, weight: 2 }); // Reading on floor/grass
                    dayOptions.push({ type: 'grid', actId: 502, weight: 2 }); // Sitting in patio

                    // Roll an activity
                    let chosen = null;
                    if (dayOptions.length > 0) {
                        const totalWeight = dayOptions.reduce((acc, opt) => acc + opt.weight, 0);
                        let roll = Math.random() * totalWeight;
                        for (const opt of dayOptions) {
                            if (roll < opt.weight) { chosen = opt; break; }
                            roll -= opt.weight;
                        }
                        if (!chosen) chosen = dayOptions[0];
                    }

                    if (chosen && chosen.type === 'furniture') {
                        const targetList = (chosen.pool === 'bath') ? baths : chairs;
                        const targetPl = targetList[Math.floor(Math.random() * targetList.length)];
                        const k = getPlKey(targetPl);
                        let chosenActId = chosen.actId;
                        if ((String(targetPl.item_id) === '163' || String(targetPl.item_id) === '650') && actsDb['105']) {
                            chosenActId = 105;
                        }
                        const actDef = actsDb[String(chosenActId)] || actsDb['101'];
                        this.currentSchedule.actorsByPlacement[k] = {
                            actorName: 'Tsuki',
                            charId: 0,
                            npcKey: '0',
                            activityId: chosenActId,
                            actDef: actDef,
                            isSleeping: false,
                            placement: targetPl
                        };
                        this.currentSchedule.tsuki = { type: 'furniture', placement: targetPl, activityId: chosenActId, isSleeping: false };
                        tsukiAssigned = true;
                    } else {
                        // Ambient ground activity
                        const actId = (chosen && chosen.actId) ? chosen.actId : 502;
                        const actDef = actsDb[String(actId)] || actsDb['101'];
                        const gridPos = (actId === 501)
                            ? { gx: 7, gy: 8, floor: 0, orientation: 0 }
                            : { gx: 8, gy: 8, floor: 0, orientation: 0 };
                        this.currentSchedule.ambientActors.push({
                            actorName: 'Tsuki',
                            charId: 0,
                            npcKey: '0',
                            activityId: actId,
                            actDef: actDef,
                            gridPos: gridPos
                        });
                        this.currentSchedule.tsuki = { type: 'grid', gridPos: gridPos, activityId: actId };
                        tsukiAssigned = true;
                    }
                }

                // ── B. VISITING LIMINAL NPCS AT TSUKI'S HOUSE ──
                // Chi visits in the afternoon (13:00 - 17:00)
                const chiCanVisit = (hour >= 13 && hour <= 17) || (this.forceVisitingNpc === 'Chi');
                const mocaCanVisit = (hour >= 16 && hour <= 20) || (this.forceVisitingNpc === 'Moca');

                if (chiCanVisit) {
                    // Check if there is an unoccupied chair
                    const freeChair = chairs.find(c => !occupiedKeys.has(getPlKey(c)));
                    if (freeChair) {
                        const k = getPlKey(freeChair);
                        occupiedKeys.add(k);
                        const actDef = actsDb['201'] || actsDb['102']; // Chi reading
                        this.currentSchedule.actorsByPlacement[k] = {
                            actorName: 'Chi',
                            charId: 2,
                            npcKey: '2',
                            activityId: 201,
                            actDef: actDef,
                            isSleeping: false,
                            placement: freeChair
                        };
                    } else {
                        // Ambient visit on deck / lower floor
                        const actDef = actsDb['201'] || actsDb['102'];
                        this.currentSchedule.ambientActors.push({
                            actorName: 'Chi',
                            charId: 2,
                            npcKey: '2',
                            activityId: 201,
                            actDef: actDef,
                            gridPos: { gx: 6, gy: 9, floor: 0, orientation: 1 }
                        });
                    }
                }

                if (mocaCanVisit && (!chiCanVisit || chairs.length >= 3 || this.forceVisitingNpc === 'Moca')) {
                    const freeChair = chairs.find(c => !occupiedKeys.has(getPlKey(c)));
                    if (freeChair) {
                        const k = getPlKey(freeChair);
                        occupiedKeys.add(k);
                        const actDef = actsDb['301'] || actsDb['103']; // Moca drinking tea
                        this.currentSchedule.actorsByPlacement[k] = {
                            actorName: 'Moca',
                            charId: 10,
                            npcKey: '10',
                            activityId: 301,
                            actDef: actDef,
                            isSleeping: false,
                            placement: freeChair
                        };
                    } else {
                        // Ambient visit on floor
                        const actDef = actsDb['301'] || actsDb['101'];
                        this.currentSchedule.ambientActors.push({
                            actorName: 'Moca',
                            charId: 10,
                            npcKey: '10',
                            activityId: 301,
                            actDef: actDef,
                            gridPos: { gx: 9, gy: 6, floor: 0, orientation: 0 }
                        });
                    }
                }
            }

            // ── 2. MAP 2: CASA DE CHI ─────────────────────────────────────────
            else if (Number(mapId) === 2) {
                // Chi is resident at home
                const freeChair = chairs[0];
                if (freeChair) {
                    const k = getPlKey(freeChair);
                    this.currentSchedule.actorsByPlacement[k] = {
                        actorName: 'Chi',
                        charId: 2,
                        npcKey: '2',
                        activityId: 201,
                        actDef: actsDb['201'] || actsDb['102'],
                        isSleeping: false,
                        placement: freeChair
                    };
                } else {
                    this.currentSchedule.ambientActors.push({
                        actorName: 'Chi',
                        charId: 2,
                        npcKey: '2',
                        activityId: 201,
                        actDef: actsDb['201'],
                        gridPos: { gx: 8, gy: 8, floor: 0, orientation: 0 }
                    });
                }
                // Tsuki visits Chi!
                if (chairs.length > 1) {
                    const tsukiChair = chairs[1];
                    const k = getPlKey(tsukiChair);
                    this.currentSchedule.actorsByPlacement[k] = {
                        actorName: 'Tsuki',
                        charId: 0,
                        npcKey: '0',
                        activityId: 103, // Drinking tea together
                        actDef: actsDb['103'],
                        isSleeping: false,
                        placement: tsukiChair
                    };
                } else {
                    this.currentSchedule.ambientActors.push({
                        actorName: 'Tsuki',
                        charId: 0,
                        npcKey: '0',
                        activityId: 502,
                        actDef: actsDb['502'],
                        gridPos: { gx: 6, gy: 8, floor: 0, orientation: 1 }
                    });
                }
            }

            // ── 3. MAP 3: CASA DE MOCA ────────────────────────────────────────
            else if (Number(mapId) === 3) {
                // Moca is resident
                const freeChair = chairs[0];
                if (freeChair) {
                    const k = getPlKey(freeChair);
                    this.currentSchedule.actorsByPlacement[k] = {
                        actorName: 'Moca',
                        charId: 10,
                        npcKey: '10',
                        activityId: 301,
                        actDef: actsDb['301'],
                        isSleeping: false,
                        placement: freeChair
                    };
                } else {
                    this.currentSchedule.ambientActors.push({
                        actorName: 'Moca',
                        charId: 10,
                        npcKey: '10',
                        activityId: 301,
                        actDef: actsDb['301'],
                        gridPos: { gx: 9, gy: 7, floor: 0, orientation: 0 }
                    });
                }
                // Tsuki visits Moca
                this.currentSchedule.ambientActors.push({
                    actorName: 'Tsuki',
                    charId: 0,
                    npcKey: '0',
                    activityId: 502,
                    actDef: actsDb['502'],
                    gridPos: { gx: 7, gy: 7, floor: 0, orientation: 1 }
                });
            }

            // ── 4. MAP 1: TIENDA DE YORI (GENERAL STORE) ─────────────────────
            else if (Number(mapId) === 1) {
                if (period === 'NIGHT') {
                    // Elfie night shift cashier
                    this.currentSchedule.ambientActors.push({
                        actorName: 'Elfie',
                        charId: 5,
                        npcKey: '5',
                        activityId: 901,
                        actDef: {
                            npcName: 'Elfie',
                            npcKey: '5',
                            anim: { front: 'Elfie-OffDango', back: 'Elfie-OffDango', fps: 2.0, mode: 'loop' },
                            offset: { x: 0, y: 0.2 }
                        },
                        gridPos: { gx: 7, gy: 9, floor: 0, orientation: 0 }
                    });
                } else {
                    // Yori day shopkeeper
                    this.currentSchedule.ambientActors.push({
                        actorName: 'Yori',
                        charId: 1,
                        npcKey: '1',
                        activityId: 902,
                        actDef: {
                            npcName: 'Yori',
                            npcKey: '1',
                            anim: { front: 'Yori-Ramen', back: 'Yori-Ramen', fps: 2.0, mode: 'loop' },
                            offset: { x: 0, y: 0.2 }
                        },
                        gridPos: { gx: 7, gy: 9, floor: 0, orientation: 0 }
                    });
                    // Pipi upstairs playing / resting
                    this.currentSchedule.ambientActors.push({
                        actorName: 'Pipi',
                        charId: 4,
                        npcKey: '4',
                        activityId: 903,
                        actDef: {
                            npcName: 'Pipi',
                            npcKey: '4',
                            anim: { front: 'Pipi-DrinkTeaStoreBack_Tail', back: 'Pipi-DrinkTeaStoreBack_Tail', fps: 2.5, mode: 'loop' },
                            offset: { x: 0, y: 0.2 }
                        },
                        gridPos: { gx: 6, gy: 6, floor: 1, orientation: 1 }
                    });
                }
                // Tsuki shopping
                this.currentSchedule.ambientActors.push({
                    actorName: 'Tsuki',
                    charId: 0,
                    npcKey: '0',
                    activityId: 502,
                    actDef: actsDb['502'],
                    gridPos: { gx: 9, gy: 9, floor: 0, orientation: 3 }
                });
            }

            // ── 5. MAP 8: AYUNTAMIENTO (TOWN HALL / BENNY) ───────────────────
            else if (Number(mapId) === 8) {
                // Benny at his desk
                this.currentSchedule.ambientActors.push({
                    actorName: 'Benny',
                    charId: 7,
                    npcKey: '7',
                    activityId: 701,
                    actDef: {
                        npcName: 'Benny',
                        npcKey: '7',
                        anim: { front: 'BennyPaperwork', back: 'BennyPaperwork', fps: 2.0, mode: 'loop' },
                        offset: { x: 0, y: 0.2 }
                    },
                    gridPos: { gx: 8, gy: 8, floor: 0, orientation: 0 }
                });
                // Tsuki visiting town hall
                this.currentSchedule.ambientActors.push({
                    actorName: 'Tsuki',
                    charId: 0,
                    npcKey: '0',
                    activityId: 502,
                    actDef: actsDb['502'],
                    gridPos: { gx: 10, gy: 8, floor: 0, orientation: 1 }
                });
            }

            // ── 6. MAP 5: TIENDA DE PLANTAS (ROSEMARY) ───────────────────────
            else if (Number(mapId) === 5) {
                this.currentSchedule.ambientActors.push({
                    actorName: 'Rosemary',
                    charId: 9,
                    npcKey: '9',
                    activityId: 801,
                    actDef: {
                        npcName: 'Rosemary',
                        npcKey: '9',
                        anim: { front: 'Rosemary-Flowers', back: 'Rosemary-Flowers', fps: 2.0, mode: 'loop' },
                        offset: { x: 0, y: 0.2 }
                    },
                    gridPos: { gx: 8, gy: 7, floor: 0, orientation: 0 }
                });
                this.currentSchedule.ambientActors.push({
                    actorName: 'Tsuki',
                    charId: 0,
                    npcKey: '0',
                    activityId: 502,
                    actDef: actsDb['502'],
                    gridPos: { gx: 9, gy: 8, floor: 0, orientation: 1 }
                });
            }

            // ── 7. MAP 11: TALLER (DAWN) ───────────────────────────────────────
            else if (Number(mapId) === 11) {
                this.currentSchedule.ambientActors.push({
                    actorName: 'Dawn',
                    charId: 14,
                    npcKey: '14',
                    activityId: 303,
                    actDef: {
                        npcName: 'Dawn',
                        npcKey: '14',
                        anim: { front: 'Dawn_Guitar', back: 'Dawn_Guitar', fps: 2.0, mode: 'loop' },
                        offset: { x: 0, y: 0.2 }
                    },
                    gridPos: { gx: 8, gy: 7, floor: 0, orientation: 0 }
                });
            }

            // ── 8. MAP 9: PUESTO DE FIDEOS Y TÉ (BOBO & MOMO) ─────────────────
            else if (Number(mapId) === 9) {
                this.currentSchedule.ambientActors.push({
                    actorName: 'Bobo',
                    charId: 8,
                    npcKey: '8',
                    activityId: 802,
                    actDef: {
                        npcName: 'Bobo',
                        npcKey: '8',
                        anim: { front: 'Bobo_CCook', back: 'Bobo_CCook', fps: 2.0, mode: 'loop' },
                        offset: { x: 0, y: 0.2 }
                    },
                    gridPos: { gx: 7, gy: 7, floor: 0, orientation: 0 }
                });
                this.currentSchedule.ambientActors.push({
                    actorName: 'Momo',
                    charId: 3,
                    npcKey: '3',
                    activityId: 304,
                    actDef: {
                        npcName: 'Momo',
                        npcKey: '3',
                        anim: { front: 'Momo-Idle', back: 'Momo-Idle', fps: 2.0, mode: 'loop' },
                        offset: { x: 0, y: 0.2 }
                    },
                    gridPos: { gx: 10, gy: 8, floor: 0, orientation: 1 }
                });
            }

            // ── 9. MAP 6: GRANJA (FARM) ───────────────────────────────────────
            else if (Number(mapId) === 6) {
                this.currentSchedule.ambientActors.push({
                    actorName: 'Tsuki',
                    charId: 0,
                    npcKey: '0',
                    activityId: 501,
                    actDef: actsDb['501'],
                    gridPos: { gx: 7, gy: 7, floor: 0, orientation: 0 }
                });
            }

            // ── 10. MAP 4: MUELLE (PIER / LIGHTHOUSE) ─────────────────────────
            else if (Number(mapId) === 4) {
                this.currentSchedule.ambientActors.push({
                    actorName: 'Tsuki',
                    charId: 0,
                    npcKey: '0',
                    activityId: 502,
                    actDef: actsDb['502'],
                    gridPos: { gx: 10, gy: 7, floor: 0, orientation: 0 }
                });
            }

            // ── 11. MAP 10: ESTACIÓN DE TREN (TRAIN STATION) ──────────────────
            else if (Number(mapId) === 10) {
                const freeChair = chairs[0];
                if (freeChair) {
                    const k = getPlKey(freeChair);
                    this.currentSchedule.actorsByPlacement[k] = {
                        actorName: 'Tsuki', charId: 0, npcKey: '0',
                        activityId: 101, actDef: actsDb['101'],
                        isSleeping: false, placement: freeChair
                    };
                } else {
                    this.currentSchedule.ambientActors.push({
                        actorName: 'Tsuki', charId: 0, npcKey: '0',
                        activityId: 502, actDef: actsDb['502'],
                        gridPos: { gx: 12, gy: 8, floor: 0, orientation: 0 }
                    });
                }
            }

            // ── 12. MAP 13: SALÓN DE SCARLETT (SCARLETT'S LOUNGE) ─────────────
            else if (Number(mapId) === 13) {
                const freeChair = chairs[0];
                if (freeChair) {
                    const k = getPlKey(freeChair);
                    this.currentSchedule.actorsByPlacement[k] = {
                        actorName: 'Tsuki', charId: 0, npcKey: '0',
                        activityId: 103, actDef: actsDb['103'],
                        isSleeping: false, placement: freeChair
                    };
                }
            }

            // ── 13. MAPAS DE LA GRAN CIUDAD Y OTROS RECINTOS (MAPS 14–34) ─────
            else {
                const freeChair = chairs[0];
                if (freeChair) {
                    const k = getPlKey(freeChair);
                    this.currentSchedule.actorsByPlacement[k] = {
                        actorName: 'Tsuki', charId: 0, npcKey: '0',
                        activityId: 101, actDef: actsDb['101'],
                        isSleeping: false, placement: freeChair
                    };
                } else {
                    this.currentSchedule.ambientActors.push({
                        actorName: 'Tsuki', charId: 0, npcKey: '0',
                        activityId: 502, actDef: actsDb['502'],
                        gridPos: { gx: 8, gy: 8, floor: 0, orientation: 0 }
                    });
                }
            }

            this._filtrarPorDatosDelJuego();
            return this.currentSchedule;
        },

        /**
         * Quita las asignaciones que el juego no permitiria.
         *
         * Las ramas de arriba estan escritas a mano: eligen "la primera silla" sin
         * mirar si esa silla vale para esa actividad. El juego si lo mira, en
         * `FurnitureBoundActivityObject.PlacementValid`, con dos reglas que ahora estan
         * extraidas del binario (`data/activities.json`, cola `mueble`):
         *
         *   validOrientations  mascara de `Orientation` -RIGHT 1, UP 2, LEFT 4, DOWN 8-
         *                      con las orientaciones del mueble que la actividad acepta.
         *                      La mas comun es 3 = RIGHT+UP, o sea las dos de frente.
         *   specify+furnitureIDs   si vale cualquier mueble del tipo, todos menos unos
         *                      cuantos, o solo unos cuantos.
         *
         * Se hace al final y en un solo sitio a proposito: asi vale para las trece ramas
         * sin tocar ninguna, y se ve de un vistazo cual es la regla.
         *
         * Cuando faltan datos -la actividad no esta en el catalogo, o el catalogo aun no
         * ha cargado- se deja pasar. Un vecino de menos por un dato que falta es peor
         * que uno mal orientado, porque no se ve y no se entiende.
         */
        _filtrarPorDatosDelJuego() {
            // ANTES QUE NADA: si el save ha situado vecinos en esta sala, mandan ellos.
            //
            // Las doce ramas de arriba se escribieron a mano y no salen del juego. Se
            // conservan para cuando no hay save —el editor sin partida cargada— pero en
            // cuanto el save dice algo, lo suyo se va: no tiene sentido que Moca esté
            // leyendo donde el save dice que está y además sentada donde dijo una rama.
            //
            // Tsuki se queda siempre: no es un vecino y su actividad va por otro sitio
            // (`activitySaves` con `npc = -1`).
            if (this.currentSchedule.deSave) {
                for (const [k, a] of Object.entries(this.currentSchedule.actorsByPlacement)) {
                    if (!a || a.charId === 0 || a.deSave) continue;
                    delete this.currentSchedule.actorsByPlacement[k];
                }
                this.currentSchedule.ambientActors = (this.currentSchedule.ambientActors || [])
                    .filter(a => a && (a.charId === 0 || a.deSave));
            }

            // Y quitar a los que el mapa ya coloca por su cuenta.
            //
            // Cada mapa puede fijar NPCs en `logic.npc_activities` —Moca leyendo en su
            // casa, Benny en su mostrador—, y eso son datos del mapa, no inventados. Las
            // ramas de aqui abajo NO los miran, asi que sentaban a Moca en el sofa
            // ADEMAS de la Moca que ya pone el mapa, y salia dos veces.
            //
            // El deduplicador de `_drawAmbientActors` ya lo hacia para los ambientales;
            // los que van sentados en un mueble no pasaban por ahi. Se hace aqui para
            // que valga para los dos caminos y para las trece ramas.
            const mapId = this.currentSchedule && this.currentSchedule.mapId;
            const def = window.MapDef && window.MapDef.get(mapId);
            const fijados = new Set(((def && def.logic && def.logic.npc_activities) || [])
                .map(a => String(a.npcKey != null ? a.npcKey : '0')));
            if (fijados.size) {
                for (const [k, act] of Object.entries(this.currentSchedule.actorsByPlacement)) {
                    if (!act) continue;
                    const clave = String(act.npcKey != null ? act.npcKey : act.charId);
                    if (!fijados.has(clave)) continue;
                    delete this.currentSchedule.actorsByPlacement[k];
                }
                this.currentSchedule.ambientActors = (this.currentSchedule.ambientActors || [])
                    .filter(a => !fijados.has(String(a.npcKey != null ? a.npcKey : a.charId)));
            }

            const A = window.Activities;
            if (!A || typeof A.puedeSentarse !== 'function' || !A.catalogo) return;
            const quitados = [];
            for (const [k, act] of Object.entries(this.currentSchedule.actorsByPlacement)) {
                if (!act || !act.placement) continue;
                // Dormir en una cama no pasa por aqui: `GridBasedActivityObject` no
                // gobierna las camas y el juego las trata aparte.
                if (act.isSleeping) continue;
                // `charId` es CharEnum y el catalogo va por npcID, uno por detras.
                const npcID = Math.max(0, (Number(act.charId) | 0) - 1);
                if (A.puedeSentarse(npcID, act.activityId, act.placement)) continue;
                quitados.push(act.actorName + ' en ' + k);
                delete this.currentSchedule.actorsByPlacement[k];
            }
            if (quitados.length) {
                this.currentSchedule.descartados = quitados;
                console.debug('[RoutineScheduler] descartados por orientacion o mueble:',
                              quitados.join(', '));
            }
        },

        /**
         * Returns the actor assigned to a specific furniture placement (if any).
         */
        getPlacementActor(placement) {
            if (!placement) return null;
            const id = placement.placementID ?? placement.placementId;
            const pId = (id != null && id !== 0) ? String(id) : `${placement.x}_${placement.y}_${placement.floor}_${placement.item_id}`;
            return this.currentSchedule.actorsByPlacement[pId] || null;
        },

        /**
         * Returns all ambient (grid-based) actors for a specific map and floor.
         */
        getAmbientActors(targetLoc, targetFloor) {
            const loc = Number(targetLoc);
            const fl = (targetFloor != null) ? Number(targetFloor) : null;
            return (this.currentSchedule.ambientActors || []).filter(a => {
                if (a.gridPos && a.gridPos.floor != null && fl != null) {
                    if (document.body && document.body.classList.contains('play-mode')) {
                        return true;
                    }
                    return Number(a.gridPos.floor) === fl;
                }
                return true;
            });
        },

        /**
         * Re-rolls the random activity selection for the current clock and map.
         */
        reroll() {
            if (!window.app || !window.app.map) return;
            const sel = document.getElementById('select-location');
            const mapId = (sel && sel.value !== '') ? parseInt(sel.value, 10) : ((window.app.parser && window.app.parser.currentSLocation != null) ? window.app.parser.currentSLocation : 0);
            const placements = (window.app.parser && window.app.parser.placements) || [];
            this.evaluateSchedule(mapId, placements, null, true);
            window.app.map.draw();
        },

        /**
         * Sets a quick time preset and refreshes.
         */
        setTimePreset(hour) {
            this.preferredTime = Number(hour);
            if (window.GameTime) {
                window.GameTime.syncWithDevice = false;
                const now = window.GameTime.now();
                if (now) {
                    now.hour = Number(hour);
                    now.minute = 0;
                }
            }
            const sel = document.getElementById('select-location');
            const mapId = (sel && sel.value !== '') ? parseInt(sel.value, 10) : 0;
            if (window.PlayLighting) {
                window.PlayLighting.apply({ hour: Number(hour), minute: 0 }, mapId);
            }
            if (window.app && typeof window.app._refreshClockHUD === 'function') {
                window.app._refreshClockHUD();
            }
            this.reroll();
        },

        /**
         * Returns the scheduled actor for a specific furniture placement.
         */
        getPlacementActor(placement) {
            if (!placement || !this.currentSchedule || !this.currentSchedule.actorsByPlacement) return null;
            const id = placement.placementID ?? placement.placementId;
            if (id != null && id !== 0 && this.currentSchedule.actorsByPlacement[String(id)]) {
                return this.currentSchedule.actorsByPlacement[String(id)];
            }
            const fallbackKey = `${placement.x}_${placement.y}_${placement.floor}_${placement.item_id}`;
            return this.currentSchedule.actorsByPlacement[fallbackKey] || null;
        },

        /**
         * Restores real-time device synchronization.
         */
        resetToRealTime() {
            this.preferredTime = null;
            if (window.GameTime) {
                window.GameTime.syncWithDevice = true;
                window.GameTime.syncFromDevice(true);
            }
            this.reroll();
        }
    };

    window.RoutineScheduler = RoutineScheduler;

})(window);
