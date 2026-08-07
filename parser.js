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
        this.astPlacements = [];

        // Build mapping of every furniture piece from AST to its true subloc_id
        if (this.ast) {
            const sublocsWrapper = this.ast.children.find(c => c.name === 'sublocations');
            if (sublocsWrapper) {
                const sublocsList = sublocsWrapper.children ? sublocsWrapper.children.find(c => c.constructor.name === 'OdinList') : null;
                if (sublocsList) {
                    for (const entry of sublocsList.elements) {
                    const sublocId = entry.key.value;
                    const furnListWrap = entry.value.children.find(c => c.name === 'furniture');
                    if (furnListWrap) {
                        const furnList = furnListWrap.children.find(c => c.constructor.name === 'OdinList');
                        if (furnList) {
                            for (const furnEntry of furnList.elements) {
                                const furnNode = furnEntry.value;
                                let itemId = -1, x = -1, y = -1, floor = 0;
                                
                                const refNode = furnNode.children.find(c => c.name === 'reference');
                                if (refNode) {
                                    const idNode = refNode.children.find(c => c.name === 'id');
                                    if (idNode) itemId = idNode.value;
                                }
                                
                                const posNode = furnNode.children.find(c => c.name === 'position');
                                if (posNode) {
                                    const grid = posNode.children.find(c => c.name === 'grid');
                                    if (grid) {
                                        const xNode = grid.children.find(c => c.name === 'x');
                                        const yNode = grid.children.find(c => c.name === 'y');
                                        const floorNode = grid.children.find(c => c.name === 'gridLevel');
                                        if (xNode) x = xNode.value;
                                        if (yNode) y = yNode.value;
                                        if (floorNode) floor = floorNode.value;
                                    }
                                }
                                
                                // Since we mutate the AST but haven't re-saved it, we match exact data
                                this.astPlacements.push({ subloc_id: sublocId, item_id: itemId, x: x, y: y, floor: floor, furnNode: furnNode });
                            }
                        }
                    }
                }
            }
        }
        }

        const placTag  = [0x17,0x01,0x0B,0x00,0x00,0x00,112,0,108,0,97,0,99,0,101,0,109,0,101,0,110,0,116,0,73,0,68,0];
        const idTag    = [0x17,0x01,0x02,0x00,0x00,0x00,105,0,100,0];
        const xTag     = [0x17,0x01,0x01,0x00,0x00,0x00,120,0];
        const yTag     = [0x17,0x01,0x01,0x00,0x00,0x00,121,0];
        const gnumTag  = [0x17,0x01,0x08,0x00,0x00,0x00,103,0,114,0,111,0,117,0,112,0,78,0,117,0,109,0];
        const vTag     = [0x17,0x01,0x06,0x00,0x00,0x00,118,0,101,0,114,0,105,0,102,0,121,0];
        const oriTag   = [0x1d,0x01,0x0b,0x00,0x00,0x00,111,0,114,0,105,0,101,0,110,0,116,0,97,0,116,0,105,0,111,0,110,0];
        const plantedIdTag = [0x17,0x01,0x06,0x00,0x00,0x00,105,0,116,0,101,0,109,0,73,0,68,0]; // "itemID"

        let idx = 0; let prevIdx = -1; let clusterId = 1;

        const findOff = (tag, from, range = 350) => {
            const end = Math.min(from + range, this.buffer.length);
            for (let i = from; i < end - tag.length; i++) {
                let m = true;
                for (let j = 0; j < tag.length; j++) {
                    if (this.buffer[i+j] !== tag[j]) { m = false; break; }
                }
                if (m) return i + tag.length;
            }
            return -1;
        };

        while (true) {
            idx = this.findPattern(placTag, idx);
            if (idx === -1) break;
            if (prevIdx !== -1 && (idx - prevIdx) > 1000) clusterId++;
            prevIdx = idx;

            const i_off = findOff(idTag, idx);
            const x_off = findOff(xTag, idx);
            const y_off = findOff(yTag, idx);
            const g_off = findOff(gnumTag, idx);
            const v_off = findOff(vTag, idx);
            const o_off = findOff(oriTag, idx);
            
            // Look for itemID (the planted seed or displayed item) slightly further ahead
            const p_off = findOff(plantedIdTag, idx, 600);

            if (i_off !== -1 && x_off !== -1 && y_off !== -1) {
                let floorStr = "None";
                let floorNum = 0;
                if (g_off !== -1) {
                    const val = this.readInt32(g_off);
                    if (val >= 0 && val <= 3) {
                        floorStr = val.toString();
                        floorNum = val;
                    }
                }
                const item_id = this.readInt32(i_off);
                const x = this.readInt32(x_off);
                const y = this.readInt32(y_off);
                let verify = v_off !== -1 ? this.readInt32(v_off) : 0;
                const orientation = o_off !== -1 ? this.readInt32(o_off) : 0;

                // Auto-calc verify using the correct algorithm
                const correctVerify = calcVerificationId(item_id);
                if (v_off !== -1 && verify !== correctVerify && item_id > 0) {
                    this.writeInt32(v_off, correctVerify);
                    verify = correctVerify;
                }
                
                let planted_id = p_off !== -1 ? this.readInt32(p_off) : -1;

                // Match with AST to get real subloc_id by index
                let realLocId = 1;
                const idxMatch = this.placements.length;
                if (this.astPlacements && idxMatch < this.astPlacements.length) {
                    const astMatch = this.astPlacements[idxMatch];
                    if (astMatch && astMatch.item_id === item_id) {
                        realLocId = astMatch.subloc_id;
                    } else {
                        // Fallback to searching by ID if sequential order breaks
                        const fallback = this.astPlacements.find(p => p.item_id === item_id);
                        if (fallback) realLocId = fallback.subloc_id;
                    }
                } else {
                    const fallback = this.astPlacements.find(p => p.item_id === item_id);
                    if (fallback) realLocId = fallback.subloc_id;
                }
                
                this.placements.push({ item_id, x, y,
                    floor: floorStr, cluster: realLocId, orientation, i_off, x_off, y_off, o_off, v_off, verify, planted_id, p_off });
                this.clusters.add(realLocId);
            }
            idx += placTag.length;
        }
    }

    applyMapChange(placement, newId, newX, newY, newOrientation) {
        if (placement.i_off !== -1) this.writeInt32(placement.i_off, newId);
        if (placement.x_off !== -1) this.writeInt32(placement.x_off, newX);
        if (placement.y_off !== -1) this.writeInt32(placement.y_off, newY);
        if (placement.o_off !== -1 && newOrientation !== undefined) {
            this.writeInt32(placement.o_off, newOrientation);
            placement.orientation = newOrientation;
        }
        placement.item_id = newId;
        placement.x = newX;
        placement.y = newY;
        if (placement.v_off !== -1) {
            const v = calcVerificationId(newId);
            this.writeInt32(placement.v_off, v);
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
                if (p.i_off !== -1) {
                    this.writeInt32(p.i_off, -1);
                    p.item_id = -1;
                    count++;
                }
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

                // Auto-fix verify using the correct algorithm
                const correctVerify = calcVerificationId(item_id);
                if (v_off !== -1 && verify !== correctVerify) {
                    this.writeInt32(v_off, correctVerify);
                    verify = correctVerify;
                }

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

    getBuffer() { return this.buffer.buffer; }
}
