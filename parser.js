// ============================================================
// calcVerificationId — réplica exacta de new System.Random(id).Next()
// Verificado contra 11 pares reales. Ver INFORME §14.
// ============================================================
function calcVerificationId(itemId) {
    const MBIG = 2147483647;
    const MSEED = 161803398;
    const seedArray = new Array(56).fill(0);
    let mj = MSEED - Math.abs(itemId | 0);
    seedArray[55] = mj;
    let mk = 1;
    for (let i = 1; i < 55; i++) {
        const ii = (21 * i) % 55;
        seedArray[ii] = mk;
        mk = mj - mk;
        if (mk < 0) mk += MBIG;
        mj = seedArray[ii];
    }
    for (let k = 1; k < 5; k++) {
        for (let i = 1; i < 56; i++) {
            seedArray[i] -= seedArray[1 + (i + 30) % 55];
            if (seedArray[i] < 0) seedArray[i] += MBIG;
        }
    }
    let retVal = seedArray[1] - seedArray[22];
    if (retVal === MBIG) retVal -= 1;
    if (retVal < 0) retVal += MBIG;
    return retVal >>> 0;
}

class SaveParser {
    constructor(buffer) {
        this.buffer = new Uint8Array(buffer);
        this.view = new DataView(buffer);
        this.encoder = new TextEncoder();
        this.decoder = new TextDecoder('utf-8');

        this.placements = [];
        this.clusters = new Set();
        this.inventory = [];
        this.npcSaves = [];      // LiminalNPCSave
        this.eventSaves = [];    // VillageEventSave
        this.trainSave = null;   // TrainSave
        this.generalVars = {};   // carrots, day, season, etc.
    }

    // ─── Helpers ─────────────────────────────────────────────────────────

    findPattern(pattern, startIndex = 0) {
        if (typeof pattern === 'string') {
            const arr = [];
            for (let i = 0; i < pattern.length; i++) {
                arr.push(pattern.charCodeAt(i));
                arr.push(0);
            }
            pattern = new Uint8Array(arr);
        } else if (Array.isArray(pattern)) {
            pattern = new Uint8Array(pattern);
        }
        for (let i = startIndex; i < this.buffer.length - pattern.length; i++) {
            let match = true;
            for (let j = 0; j < pattern.length; j++) {
                if (this.buffer[i + j] !== pattern[j]) { match = false; break; }
            }
            if (match) return i;
        }
        return -1;
    }

    // Build a field-key byte pattern for a UTF-16LE named field
    // marker = e.g. 0x17 (NamedInt), 0x21 (NamedDouble), 0x2B (NamedBool)
    buildFieldTag(marker, fieldName) {
        const arr = [marker, 0x01];
        arr.push(fieldName.length & 0xFF, (fieldName.length >> 8) & 0xFF,
                 (fieldName.length >> 16) & 0xFF, (fieldName.length >> 24) & 0xFF);
        for (const c of fieldName) {
            arr.push(c.charCodeAt(0), 0);
        }
        return arr;
    }

    findField(marker, fieldName, startIndex = 0, range = 512) {
        const tag = this.buildFieldTag(marker, fieldName);
        const end = Math.min(startIndex + range, this.buffer.length - tag.length);
        for (let i = startIndex; i < end; i++) {
            let m = true;
            for (let j = 0; j < tag.length; j++) {
                if (this.buffer[i + j] !== tag[j]) { m = false; break; }
            }
            if (m) return i + tag.length; // returns offset of VALUE
        }
        return -1;
    }

    readInt32(offset) { return this.view.getInt32(offset, true); }
    writeInt32(offset, value) { this.view.setInt32(offset, value, true); }
    readFloat32(offset) { return this.view.getFloat32(offset, true); }
    writeFloat32(offset, value) { this.view.setFloat32(offset, value, true); }
    readFloat64(offset) { return this.view.getFloat64(offset, true); }
    writeFloat64(offset, value) { this.view.setFloat64(offset, value, true); }
    readBool(offset) { return this.buffer[offset] !== 0; }
    writeBool(offset, value) { this.buffer[offset] = value ? 1 : 0; }

    // ─── Map ─────────────────────────────────────────────────────────────

    parseMap() {
        this.placements = [];
        this.clusters = new Set();
        this.astPlacements = []; // Deprecated, keeping just for legacy compatibility if any

        if (!this.ast) return;
        
        const sublocsWrapper = this.ast.children.find(c => c.name === 'sublocations');
        if (!sublocsWrapper) return;
        const sublocsList = sublocsWrapper.children ? sublocsWrapper.children.find(c => c.constructor.name === 'OdinList') : null;
        if (!sublocsList) return;

        for (const entry of sublocsList.elements) {
            const sublocId = entry.key.value;
            this.clusters.add(sublocId);
            
            // 1. Furniture
            const furnWrap = entry.value.children.find(c => c.name === 'furniture');
            if (furnWrap) {
                const furnList = furnWrap.children.find(c => c.constructor.name === 'OdinList');
                if (furnList) {
                    for (const furnEntry of furnList.elements) {
                        const furnNode = furnEntry.value;
                        let itemId = -1, x = -1, y = -1, floor = 0, orientation = 0, verify = 0, placementID = -1;
                        let planted_id = -1; // We can parse cropBox if needed later

                        const pIdNode = furnNode.children.find(c => c.name === 'placementID');
                        if (pIdNode) placementID = pIdNode.value;

                        const vIdNode = furnNode.children.find(c => c.name === 'verificationID');
                        if (vIdNode) verify = vIdNode.value;

                        const refNode = furnNode.children.find(c => c.name === 'reference');
                        if (refNode) {
                            const idNode = refNode.children.find(c => c.name === 'id');
                            if (idNode) itemId = idNode.value;
                            const oriNode = refNode.children.find(c => c.name === 'orientation');
                            if (oriNode) orientation = oriNode.value;
                        }

                        const groupPosNode = furnNode.children.find(c => c.name === 'groupPosition');
                        if (groupPosNode) {
                            const grid = groupPosNode.children.find(c => c.name === 'grid');
                            if (grid) {
                                const xNode = grid.children.find(c => c.name === 'x');
                                const yNode = grid.children.find(c => c.name === 'y');
                                if (xNode) x = xNode.value;
                                if (yNode) y = yNode.value;
                            }
                            const gNumNode = groupPosNode.children.find(c => c.name === 'groupNum');
                            if (gNumNode) floor = gNumNode.value;
                        }

                        this.placements.push({
                            placementID,
                            subloc_id: sublocId,
                            item_id: itemId,
                            x, y,
                            floor: floor.toString(),
                            cluster: sublocId,
                            orientation,
                            verify,
                            planted_id,
                            furnNode,
                            isWall: false
                        });
                    }
                }
            }

            // 2. WallFurniture
            const wallWrap = entry.value.children.find(c => c.name === 'wallFurniture');
            if (wallWrap) {
                const wallList = wallWrap.children.find(c => c.constructor.name === 'OdinList');
                if (wallList) {
                    for (const wallEntry of wallList.elements) {
                        const wallNode = wallEntry.value;
                        let itemId = -1, x = -1, y = -1, floor = 0, orientation = 0, verify = 0, placementID = -1;

                        const pIdNode = wallNode.children.find(c => c.name === 'placementID');
                        if (pIdNode) placementID = pIdNode.value;

                        const fIdNode = wallNode.children.find(c => c.name === 'furnitureID');
                        if (fIdNode) itemId = fIdNode.value;

                        const vIdNode = wallNode.children.find(c => c.name === 'verificationID');
                        if (vIdNode) verify = vIdNode.value;

                        // Wall furniture also has groupPosition
                        const groupPosNode = wallNode.children.find(c => c.name === 'groupPosition');
                        if (groupPosNode) {
                            const grid = groupPosNode.children.find(c => c.name === 'grid');
                            if (grid) {
                                const xNode = grid.children.find(c => c.name === 'x');
                                const yNode = grid.children.find(c => c.name === 'y');
                                if (xNode) x = xNode.value;
                                if (yNode) y = yNode.value;
                            }
                            const gNumNode = groupPosNode.children.find(c => c.name === 'groupNum');
                            if (gNumNode) floor = gNumNode.value;
                        }

                        this.placements.push({
                            placementID,
                            subloc_id: sublocId,
                            item_id: itemId,
                            x, y,
                            floor: floor.toString(),
                            cluster: sublocId,
                            orientation,
                            verify,
                            planted_id: -1,
                            furnNode: wallNode,
                            isWall: true
                        });
                    }
                }
            }
        }
        this.astPlacements = [...this.placements]; // keeping for compatibility
    }

    applyMapChange(placement, newId, newX, newY, newOrientation) {
        if (!placement.furnNode) return;
        
        placement.item_id = newId;
        placement.x = newX;
        placement.y = newY;
        if (newOrientation !== undefined) placement.orientation = newOrientation;
        
        const node = placement.furnNode;

        if (placement.isWall) {
            const fIdNode = node.children.find(c => c.name === 'furnitureID');
            if (fIdNode) fIdNode.value = newId;
        } else {
            const refNode = node.children.find(c => c.name === 'reference');
            if (refNode) {
                const idNode = refNode.children.find(c => c.name === 'id');
                if (idNode) idNode.value = newId;
                if (newOrientation !== undefined) {
                    const oriNode = refNode.children.find(c => c.name === 'orientation');
                    if (oriNode) oriNode.value = newOrientation;
                }
            }
        }

        const groupPosNode = node.children.find(c => c.name === 'groupPosition');
        if (groupPosNode) {
            const grid = groupPosNode.children.find(c => c.name === 'grid');
            if (grid) {
                const xNode = grid.children.find(c => c.name === 'x');
                const yNode = grid.children.find(c => c.name === 'y');
                if (xNode) xNode.value = newX;
                if (yNode) yNode.value = newY;
            }
        }
        
        const vIdNode = node.children.find(c => c.name === 'verificationID');
        if (vIdNode) {
            const v = calcVerificationId(newId);
            vIdNode.value = v;
            placement.verify = v;
        }
    }

    cleanBuggySeeds() {
        if (!this.placements) return 0;
        let count = 0;
        for (const p of this.placements) {
            // If it's a seed item placed on the map (especially at 0,0)
            if ([342, 345, 1208, 1230, 1231, 1232, 1233, 1237, 1238, 1301].includes(p.item_id)) {
                // Erase it from the map by setting ID to -1
                this.applyMapChange(p, -1, p.x, p.y, p.orientation);
                count++;
            }
        }
        return count;
    }

    // ─── Inventory ───────────────────────────────────────────────────────

    readInventorySlotCount(startIdx) {
        const countMarker = [0x55,0x00,0x00,0x00,0x06];
        const maxSearch = Math.min(startIdx + 400, this.buffer.length - countMarker.length - 4);
        for (let i = startIdx; i < maxSearch; i++) {
            let match = true;
            for (let j = 0; j < countMarker.length; j++) {
                if (this.buffer[i+j] !== countMarker[j]) { match = false; break; }
            }
            if (match) {
                const slotCount = this.readInt32(i + countMarker.length);
                if (slotCount > 0 && slotCount <= 5000) return slotCount;
            }
        }
        return 50;
    }

    parseInventory() {
        this.inventory = [];
        const itemInvTag = [0x49,0x00,0x74,0x00,0x65,0x00,0x6d,0x00,0x49,0x00,0x6e,0x00,0x76,0x00,0x65,0x00,0x6e,0x00,0x74,0x00,0x6f,0x00,0x72,0x00,0x79,0x00];
        const idTag = [0x17,0x01,0x02,0x00,0x00,0x00,73,0,68,0];
        const qtyTag = [0x17,0x01,0x08,0x00,0x00,0x00,113,0,117,0,97,0,110,0,116,0,105,0,116,0,121,0];
        const vTag = [0x17,0x01,0x06,0x00,0x00,0x00,118,0,101,0,114,0,105,0,102,0,121,0];
        const typeTag = [0x1d,0x01,0x07,0x00,0x00,0x00,105,0,110,0,118,0,84,0,121,0,112,0,101,0];
        const modifiedTag = [0x21,0x01,0x0c,0x00,0x00,0x00,108,0,97,0,115,0,116,0,77,0,111,0,100,0,105,0,102,0,105,0,101,0,100,0];

        let startIdx = this.findPattern(itemInvTag, 0);
        if (startIdx === -1) return;

        const slotCount = this.readInventorySlotCount(startIdx);
        let idx = startIdx;

        const findOff = (tag, start, maxSearch = 200) => {
            for (let i = start; i < start + maxSearch; i++) {
                let m = true;
                for (let j = 0; j < tag.length; j++) {
                    if (this.buffer[i+j] !== tag[j]) { m = false; break; }
                }
                if (m) return i + tag.length;
            }
            return -1;
        };

        for (let count = 0; count < slotCount; count++) {
            idx = this.findPattern(idTag, idx);
            if (idx === -1) break;

            const i_off = idx + idTag.length;
            const item_id = this.readInt32(i_off);
            const q_off = findOff(qtyTag, idx, 100);
            const v_off = findOff(vTag, idx, 100);
            const t_off = findOff(typeTag, idx, 150);
            const m_off = findOff(modifiedTag, idx, 150);

            if (q_off !== -1) {
                const qty = this.readInt32(q_off);
                let verify = v_off !== -1 ? this.readInt32(v_off) : 0;

                this.inventory.push({ item_id, qty, invType: t_off !== -1 ? this.readInt32(t_off) : 0,
                    i_off, q_off, v_off, t_off, m_off, verify });
            }
            idx += 10;
        }
    }

    updateInventoryItem(index, newId, newQty, newInvType) {
        if (index < 0 || index >= this.inventory.length) return;
        const item = this.inventory[index];
        if (item.i_off !== undefined) { this.writeInt32(item.i_off, newId); item.item_id = newId; }
        this.writeInt32(item.q_off, newQty); item.qty = newQty;
        if (item.t_off !== -1 && newInvType !== undefined) { this.writeInt32(item.t_off, newInvType); item.invType = newInvType; }
        if (item.v_off !== -1) {
            const v = calcVerificationId(newId);
            this.writeInt32(item.v_off, v);
            item.verify = v;
        }
    }

    clearInventoryItem(index) {
        if (index < 0 || index >= this.inventory.length) throw new Error("Slot de inventario invalido.");
        const item = this.inventory[index];
        const emptyVerify = calcVerificationId(-1); // = 0x1FD45F46
        this.writeInt32(item.i_off, -1);
        this.writeInt32(item.q_off, 0);
        if (item.v_off !== -1) this.writeInt32(item.v_off, emptyVerify);
        if (item.t_off !== -1) this.writeInt32(item.t_off, 0);
        if (item.m_off !== -1) this.writeFloat64(item.m_off, 0);
        item.item_id = -1; item.qty = 0; item.invType = 0; item.verify = emptyVerify;
        return item;
    }

    injectInventoryItem(newId, quantity = 1, newInvType = 1) {
        if (!this.inventory.length) this.parseInventory();
        if (!Number.isInteger(newId) || !Number.isInteger(quantity) || !Number.isInteger(newInvType))
            throw new Error("ID, cantidad y tipo deben ser enteros.");
        if (quantity <= 0) throw new Error("La cantidad debe ser mayor que cero.");

        const verify = calcVerificationId(newId);

        const existing = this.inventory.find(it => it.item_id === newId && it.invType === newInvType);
        if (existing) {
            const newQty = existing.qty + quantity;
            this.writeInt32(existing.q_off, newQty);
            if (existing.v_off !== -1) this.writeInt32(existing.v_off, verify);
            existing.qty = newQty; existing.verify = verify;
            return { mode: "stacked", slot: this.inventory.indexOf(existing), item: existing };
        }

        const empty = this.inventory.find(it => it.item_id === -1 || it.qty <= 0);
        if (!empty) throw new Error("No hay slots vacios; no se modifica la longitud del archivo.");

        this.writeInt32(empty.i_off, newId);
        this.writeInt32(empty.q_off, quantity);
        if (empty.v_off !== -1) this.writeInt32(empty.v_off, verify);
        if (empty.t_off !== -1) this.writeInt32(empty.t_off, newInvType);
        if (empty.m_off !== -1) this.writeFloat64(empty.m_off, Date.now() / 86400000 + 25569);
        empty.item_id = newId; empty.qty = quantity; empty.invType = newInvType; empty.verify = verify;
        return { mode: "inserted", slot: this.inventory.indexOf(empty), item: empty };
    }

    // ─── NPC Friendship (liminalSaves) ───────────────────────────────────

    parseNPCSaves() {
        this.npcSaves = [];
        const npcTag = 'NpcID'.length > 0 ? [0x17,0x01,0x05,0x00,0x00,0x00,78,0,112,0,99,0,73,0,68,0] : [];
        // Search all NpcID instances within liminalSaves blocks
        const charTag    = this.buildFieldTag(0x1d, 'character');
        const friendTag  = this.buildFieldTag(0x17, 'friendship');
        const lastDayTag = this.buildFieldTag(0x17, 'lastFriendshipDay');
        const lastTalkTag= this.buildFieldTag(0x21, 'lastTalkOA');
        const pesterTag  = this.buildFieldTag(0x17, 'Pester');

        // Find liminalSaves collection anchor
        const liminalAnchor = 'liminalSaves'.split('').reduce((arr, c) => {
            arr.push(c.charCodeAt(0)); arr.push(0); return arr;
        }, []);

        let start = this.findPattern(liminalAnchor, 0);
        if (start === -1) start = 0;

        let idx = start;
        let safety = 0;

        while (safety++ < 200) {
            // Find next character field
            const cIdx = this.findPattern(charTag, idx, 3000);
            if (cIdx === -1) break;
            const charValOff = cIdx + charTag.length;

            // Read character ID (ULong stored as 8 bytes LE — we read low 4 bytes as int for enum)
            const charId = this.readInt32(charValOff);

            const range = 800;
            const fOff = this.findPattern(friendTag, charValOff, range) !== -1
                ? this.findPattern(friendTag, charValOff, range) + friendTag.length : -1;
            const ldOff = this.findPattern(lastDayTag, charValOff, range) !== -1
                ? this.findPattern(lastDayTag, charValOff, range) + lastDayTag.length : -1;
            const ltOff = this.findPattern(lastTalkTag, charValOff, range) !== -1
                ? this.findPattern(lastTalkTag, charValOff, range) + lastTalkTag.length : -1;
            const pOff = this.findPattern(pesterTag, charValOff, range) !== -1
                ? this.findPattern(pesterTag, charValOff, range) + pesterTag.length : -1;

            if (fOff !== -1 && charId >= 0 && charId <= 99) {
                this.npcSaves.push({
                    charId,
                    friendship: fOff !== -1 ? this.readInt32(fOff) : 0,
                    lastFriendshipDay: ldOff !== -1 ? this.readInt32(ldOff) : 0,
                    lastTalkOA: ltOff !== -1 ? this.readFloat64(ltOff) : 0,
                    pester: pOff !== -1 ? this.readInt32(pOff) : 0,
                    fOff, ldOff, ltOff, pOff
                });
            }
            idx = charValOff + 1;
        }
    }

    setNPCFriendship(npcIndex, newFriendship) {
        const npc = this.npcSaves[npcIndex];
        if (!npc || npc.fOff === -1) return false;
        this.writeInt32(npc.fOff, newFriendship);
        npc.friendship = newFriendship;
        // Also reset lastFriendshipDay to 0 so the game doesn't think it was already updated today
        if (npc.ldOff !== -1) { this.writeInt32(npc.ldOff, 0); npc.lastFriendshipDay = 0; }
        return true;
    }

    setNPCPester(npcIndex, pesterValue) {
        const npc = this.npcSaves[npcIndex];
        if (!npc || npc.pOff === -1) return false;
        this.writeInt32(npc.pOff, pesterValue);
        npc.pester = pesterValue;
        return true;
    }

    // ─── Events ──────────────────────────────────────────────────────────

    parseEventSaves() {
        this.eventSaves = [];
        const eventIdTag = this.buildFieldTag(0x17, 'eventID');
        const yearTag = this.buildFieldTag(0x17, 'year');
        const shownFlyerTag = this.buildFieldTag(0x2b, 'shownFlyer');

        // Anchor by eventSaves collection string
        const anchor = 'eventSaves'.split('').reduce((arr, c) => { arr.push(c.charCodeAt(0), 0); return arr; }, []);
        let start = this.findPattern(anchor, 0);
        if (start === -1) return;

        let idx = start;
        let safety = 0;
        while (safety++ < 50) {
            const eOff = this.findPattern(eventIdTag, idx, 2000);
            if (eOff === -1) break;
            const valOff = eOff + eventIdTag.length;
            const eventId = this.readInt32(valOff);
            const yearOff = this.findPattern(yearTag, valOff, 200);
            const yearValOff = yearOff !== -1 ? yearOff + yearTag.length : -1;
            const sfOff = this.findPattern(shownFlyerTag, valOff, 200);

            if (eventId >= 0 && eventId <= 50) {
                this.eventSaves.push({
                    eventId,
                    year: yearValOff !== -1 ? this.readInt32(yearValOff) : 0,
                    eventIdOff: valOff,
                    yearOff: yearValOff,
                    shownFlyerOff: sfOff !== -1 ? sfOff + shownFlyerTag.length : -1
                });
            }
            idx = valOff + 1;
        }
    }

    // ─── General Variables ───────────────────────────────────────────────

    parseGeneralVars() {
        this.generalVars = {};

        const fields = [
            { name: 'carrots',           marker: 0x17, read: 'int32', write: 'int32' },
            { name: 'day',               marker: 0x17, read: 'int32', write: 'int32' },
            { name: 'month',             marker: 0x17, read: 'int32', write: 'int32' },
            { name: 'season',            marker: 0x17, read: 'int32', write: 'int32' },
            { name: 'hour',              marker: 0x17, read: 'int32', write: 'int32' },
            { name: 'ravenChapter',      marker: 0x17, read: 'int32', write: 'int32' },
            { name: 'lastChapterComplete',marker:0x17, read: 'int32', write: 'int32' },
            { name: 'homecomingUpdates', marker: 0x17, read: 'int32', write: 'int32' },
            { name: 'lastSavedVersion',  marker: 0x17, read: 'int32', write: 'int32' },
            { name: 'nodesBroken',       marker: 0x17, read: 'int32', write: 'int32' },
            { name: 'ordersMade',        marker: 0x17, read: 'int32', write: 'int32' },
            { name: 'gachaRolled',       marker: 0x17, read: 'int32', write: 'int32' },
            { name: 'unluckiness',       marker: 0x1f, read: 'float', write: 'float' },
            { name: 'fishCaught',        marker: 0x17, read: 'int32', write: 'int32' },
            { name: 'cloversBred',       marker: 0x17, read: 'int32', write: 'int32' },
            { name: 'junkerUsed',        marker: 0x17, read: 'int32', write: 'int32' },
            { name: 'startBedtime',      marker: 0x1f, read: 'float', write: 'float' },
            { name: 'endBedtime',        marker: 0x1f, read: 'float', write: 'float' },
            { name: 'Unluckiness',       marker: 0x1f, read: 'float', write: 'float' },
        ];

        for (const f of fields) {
            const tag = this.buildFieldTag(f.marker, f.name);
            const idx = this.findPattern(tag, 0, 50000);
            if (idx !== -1) {
                const valOff = idx + tag.length;
                const value = f.read === 'int32' ? this.readInt32(valOff) :
                              f.read === 'float'  ? this.readFloat32(valOff) :
                              this.readFloat64(valOff);
                this.generalVars[f.name] = { value, offset: valOff, type: f.read };
            }
        }

        // Homecoming booleans (use byte pattern search)
        const hcIOSTag = [0x68,0x00,0x6f,0x00,0x6d,0x00,0x65,0x00,0x63,0x00,0x6f,0x00,0x6d,0x00,0x69,0x00,0x6e,0x00,0x67,0x00,0x49,0x00,0x4f,0x00,0x53,0x00];
        const hcAndTag = [0x68,0x00,0x6f,0x00,0x6d,0x00,0x65,0x00,0x63,0x00,0x6f,0x00,0x6d,0x00,0x69,0x00,0x6e,0x00,0x67,0x00,0x41,0x00,0x6e,0x00,0x64,0x00,0x72,0x00,0x6f,0x00,0x69,0x00,0x64,0x00];

        let off;
        off = this.findPattern(hcIOSTag, 0);
        if (off !== -1) this.generalVars['homecomingiOS'] = { value: this.buffer[off + hcIOSTag.length] !== 0, offset: off + hcIOSTag.length, type: 'bool' };
        off = this.findPattern(hcAndTag, 0);
        if (off !== -1) this.generalVars['homecomingAndroid'] = { value: this.buffer[off + hcAndTag.length] !== 0, offset: off + hcAndTag.length, type: 'bool' };
    }

    writeGeneralVar(name, value) {
        const entry = this.generalVars[name];
        if (!entry) return false;
        if (entry.type === 'int32') { this.writeInt32(entry.offset, value | 0); entry.value = value | 0; }
        else if (entry.type === 'float') { this.writeFloat32(entry.offset, value); entry.value = value; }
        else if (entry.type === 'bool') { this.writeBool(entry.offset, !!value); entry.value = !!value; }
        return true;
    }

    // ─── Train ───────────────────────────────────────────────────────────

    parseTrainSave() {
        const trainDayTag   = this.buildFieldTag(0x17, 'trainDay');
        const trainNumTag   = this.buildFieldTag(0x17, 'trainNumber');
        const anchor = 'trainSave'.split('').reduce((arr, c) => { arr.push(c.charCodeAt(0), 0); return arr; }, []);
        const anchorIdx = this.findPattern(anchor, 0);
        const start = anchorIdx !== -1 ? anchorIdx : 0;

        const tdIdx = this.findPattern(trainDayTag, start, 5000);
        const tnIdx = this.findPattern(trainNumTag, start, 5000);

        this.trainSave = {
            trainDay: tdIdx !== -1 ? this.readInt32(tdIdx + trainDayTag.length) : 0,
            trainNumber: tnIdx !== -1 ? this.readInt32(tnIdx + trainNumTag.length) : 0,
            trainDayOff: tdIdx !== -1 ? tdIdx + trainDayTag.length : -1,
            trainNumberOff: tnIdx !== -1 ? tnIdx + trainNumTag.length : -1
        };
    }

    setTrainDay(day) {
        if (!this.trainSave || this.trainSave.trainDayOff === -1) return false;
        this.writeInt32(this.trainSave.trainDayOff, day);
        this.trainSave.trainDay = day;
        return true;
    }

    setTrainNumber(num) {
        if (!this.trainSave || this.trainSave.trainNumberOff === -1) return false;
        this.writeInt32(this.trainSave.trainNumberOff, num);
        this.trainSave.trainNumber = num;
        return true;
    }

    getBuffer() {
        if (this.ast) {
            const writer = new OdinWriter();
            const outBuf = writer.write([this.ast]);
            return outBuf.buffer || outBuf;
        }
        return this.buffer.buffer;
    }
}
