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

    
    _findNodesInAST(name) {
        if (!this.ast) return [];
        const results = [];
        const target = name.toLowerCase();

        const search = (n) => {
            if (!n) return;
            if (n.name && n.name.toLowerCase() === target) {
                results.push(n);
            }
            if (n.children) {
                for (const child of n.children) {
                    search(child);
                }
            }
            if (n.elements) {
                for (const el of n.elements) {
                    if (el.key) search(el.key);
                    if (el.value) search(el.value);
                }
            }
        };
        search(this.ast);
        return results;
    }


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
        // --- Fix Seed Coordinates & Extract Times ---
        // Seeds often don't have a groupPosition and default to x=-1, y=-1.
        // They are linked to their FarmingPlot (306) via a component (like CropBox) that references their placementID.
        const isCropPlacement = (p) => {
            if (!p) return false;
            if (typeof SEED_IDS !== 'undefined' && SEED_IDS.has(p.item_id)) return true;
            const tn = p.furnNode && (p.furnNode.typeName || p.furnNode.className);
            if (tn && /CropSave/i.test(tn)) return true;
            const hasTime = findNodeByName(p.furnNode, ['harvestTimeOA', 'placedOA', 'harvestTime', 'Placed']);
            return !!hasTime;
        };

        const findNodeByName = (node, names) => {
            if (!node) return null;
            if (node.name && names.includes(node.name)) return node;
            if (node.children) {
                for (const c of node.children) {
                    const r = findNodeByName(c, names);
                    if (r) return r;
                }
            }
            if (node.elements) {
                for (const el of node.elements) {
                    const r = findNodeByName(el.value, names);
                    if (r) return r;
                }
            }
            if (node.value && typeof node.value === 'object') {
                return findNodeByName(node.value, names);
            }
            return null;
        };

        const findVal = (node, val) => {
            if (!node) return false;
            if (node.value === val) return true;
            if (node.children) {
                for (const c of node.children) if (findVal(c, val)) return true;
            }
            if (node.elements) {
                for (const el of node.elements) if (findVal(el.value, val)) return true;
            }
            return false;
        };

        const seeds = this.placements.filter(p => isCropPlacement(p) && p.placementID !== -1);
        const plots = this.placements.filter(p => p.item_id === 306 || p.item_id === 411 || (typeof GROUND_IDS !== 'undefined' && GROUND_IDS.has(p.item_id)));

        for (const seed of seeds) {
            seed.harvestTimeNode = findNodeByName(seed.furnNode, ['harvestTimeOA', 'harvestTime', 'HarvestTime']);
            seed.placedNode = findNodeByName(seed.furnNode, ['placedOA', 'Placed', 'placed']);
            
            // Link via parentPlacementID
            const parentIdNode = findNodeByName(seed.furnNode, ['parentPlacementID', 'ParentPlacementID']);
            let linked = false;

            if (parentIdNode && parentIdNode.value !== -1 && parentIdNode.value !== 0) {
                const parentPlot = plots.find(p => p.placementID === parentIdNode.value);
                if (parentPlot) {
                    seed.x = parentPlot.x;
                    seed.y = parentPlot.y;
                    seed.linkedPlot = parentPlot;
                    parentPlot.planted_id = seed.item_id;
                    parentPlot.linkedSeed = seed;
                    linked = true;
                }
            }
            
            // Fallback for older saves without parentPlacementID
            if (!linked) {
                for (const plot of plots) {
                    if (findVal(plot.furnNode, seed.placementID)) {
                        seed.x = plot.x;
                        seed.y = plot.y;
                        seed.linkedPlot = plot;
                        plot.planted_id = seed.item_id;
                        plot.linkedSeed = seed;
                        break;
                    }
                }
            }
        }

        // B1: Seeds sin link válido → forzar x/y = -1 para que map.js las filtre
        for (const seed of seeds) {
            if (!seed.linkedPlot) {
                seed.x = -1;
                seed.y = -1;
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
                    if (oriNode) oriNode.value = typeof oriNode.value === 'bigint' ? BigInt(newOrientation) : newOrientation;
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
        // B4: Re-parsear para tener links actualizados
        this.parseMap();
        let count = 0;
        const seedIds = [342, 345, 1208, 1230, 1231, 1232, 1233, 1237, 1238, 1301];
        for (const p of this.placements) {
            // Solo borrar seeds SIN link válido a una parcela
            const isSeed = seedIds.includes(p.item_id)
                || (typeof SEED_IDS !== 'undefined' && SEED_IDS.has(p.item_id));
            if (isSeed && !p.linkedPlot) {
                this.applyMapChange(p, -1, p.x, p.y, p.orientation);
                count++;
            }
        }
        if (count > 0) this.parseMap();
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
        this.hiddenInventory = [];
        
        if (!this.ast) return;
        
        const itemsNode = this.ast.children.find(c => c.name === 'items');
        if (!itemsNode || !itemsNode.children) return;
        
        const processList = (parentName, targetArray) => {
            const wrap = itemsNode.children.find(c => c.name === parentName);
            if (!wrap || !wrap.children) return;
            const listNode = wrap.children.find(c => c.constructor.name === 'OdinList');
            if (!listNode || !listNode.elements) return;
            
            listNode.elements.forEach(el => {
                const val = el.value || el;
                if (!val || !val.children) return;
                
                const idNode = val.children.find(c => c.name === 'ID');
                const qtyNode = val.children.find(c => c.name === 'quantity');
                const typeNode = val.children.find(c => c.name === 'invType');
                
                if (idNode && qtyNode) {
                    targetArray.push({
                        item_id: idNode.value,
                        qty: qtyNode.value,
                        invType: typeNode ? typeNode.value : (parentName === 'slots' ? 1 : 0),
                        slotNode: val,
                        // Dummy offsets for backward compatibility (in case anything else reads them)
                        i_off: -1, q_off: -1, v_off: -1, t_off: -1, m_off: -1, verify: 0
                    });
                }
            });
        };
        
        processList('slots', this.inventory);
        processList('hiddenItems', this.hiddenInventory);
    }

    
    updateInventoryItem(index, newId, newQty, newInvType) {
        let item = null;
        if (newInvType === undefined) newInvType = 1; // Default
        if (newInvType === 1 && this.inventory[index]) item = this.inventory[index];
        else if (newInvType === 0 && this.hiddenInventory[index]) item = this.hiddenInventory[index];
        
        if (!item) return;
        
        item.item_id = newId;
        item.qty = newQty;
        item.invType = newInvType;
        
        if (item.slotNode && item.slotNode.children) {
            const idNode = item.slotNode.children.find(c => c.name === 'ID');
            const qtyNode = item.slotNode.children.find(c => c.name === 'quantity');
            const typeNode = item.slotNode.children.find(c => c.name === 'invType');
            const vNode = item.slotNode.children.find(c => c.name === 'verify' || c.name === 'verificationID');
            
            if (idNode) idNode.value = newId;
            if (qtyNode) qtyNode.value = newQty;
            if (typeNode) typeNode.value = newInvType;
            if (vNode) vNode.value = calcVerificationId(newId);
        } else {
            console.error("AST slotNode missing for inventory update!", item);
        }
    }

    
    clearInventoryItem(index, invType = 1) {
        let item = null;
        if (invType === 1 && this.inventory[index]) item = this.inventory[index];
        else if (invType === 0 && this.hiddenInventory[index]) item = this.hiddenInventory[index];
        
        if (!item) {
            console.error("Slot de inventario invalido.");
            return null;
        }
        
        const emptyVerify = calcVerificationId(-1);
        item.item_id = -1; 
        item.qty = 0; 
        item.verify = emptyVerify;
        
        if (item.slotNode && item.slotNode.children) {
            const idNode = item.slotNode.children.find(c => c.name === 'ID');
            const qtyNode = item.slotNode.children.find(c => c.name === 'quantity');
            const vNode = item.slotNode.children.find(c => c.name === 'verify' || c.name === 'verificationID');
            const mNode = item.slotNode.children.find(c => c.name === 'lastModified');
            
            if (idNode) idNode.value = -1;
            if (qtyNode) qtyNode.value = 0;
            if (vNode) vNode.value = emptyVerify;
            // No tocamos invType (para que mantenga 0 o 1)
            if (mNode) mNode.value = Date.now() / 86400000 + 25569;
        } else {
            console.error("AST slotNode missing for inventory clear!", item);
        }
        return item;
    }

    injectInventoryItem(newId, quantity = 1, newInvType = 1) {
        if (!this.inventory || !this.inventory.length) this.parseInventory();
        if (!Number.isInteger(newId) || !Number.isInteger(quantity) || !Number.isInteger(newInvType))
            throw new Error("ID, cantidad y tipo deben ser enteros.");
        if (quantity <= 0) throw new Error("La cantidad debe ser mayor que cero.");
        
        const invArray = newInvType === 1 ? this.inventory : this.hiddenInventory;
        if (!invArray) throw new Error("El arreglo de inventario no esta inicializado.");
        const stackItem = invArray.find(i => i.item_id === newId);
        
        if (stackItem) {
            const idx = invArray.indexOf(stackItem);
            this.updateInventoryItem(idx, newId, stackItem.qty + quantity, newInvType);
            return { mode: 'stacked', slot: idx, item: stackItem };
        }
        
        const emptySlotIdx = invArray.findIndex(i => i.item_id === -1 || i.qty <= 0);
        if (emptySlotIdx !== -1) {
            this.updateInventoryItem(emptySlotIdx, newId, quantity, newInvType);
            return { mode: "inserted", slot: emptySlotIdx, item: invArray[emptySlotIdx] };
        }
        
        // If there are no empty slots, we must create a new one in the AST
        if (this.ast) {
            const parentName = newInvType === 1 ? 'slots' : 'hiddenItems';
            const itemsNodes = this._findNodesInAST('items');
            const itemsNode = itemsNodes.length > 0 ? itemsNodes[0] : null;
            if (itemsNode) {
                const typeNode = itemsNode.children.find(c => c.name === parentName);
                if (typeNode) {
                    const listNode = typeNode.children.find(c => c.constructor.name === 'OdinList');
                    if (listNode && listNode.elements && listNode.elements.length > 0) {
                        const template = listNode.elements[0].value || listNode.elements[0];
                        
                        // Deep clone helper for AST nodes
                        const cloneNode = (node) => {
                            if (!node) return null;
                            const clone = Object.assign(Object.create(Object.getPrototypeOf(node)), node);
                            if (node.children) clone.children = node.children.map(cloneNode);
                            return clone;
                        };
                        
                        const verify = calcVerificationId(newId);
                        const newNode = cloneNode(template);
                        
                        const idNode = newNode.children.find(c => c.name === 'ID');
                        const qtyNode = newNode.children.find(c => c.name === 'quantity');
                        const vNode = newNode.children.find(c => c.name === 'verify' || c.name === 'verificationID');
                        const tNode = newNode.children.find(c => c.name === 'invType');
                        const mNode = newNode.children.find(c => c.name === 'lastModified');
                        
                        if (idNode) idNode.value = newId;
                        if (qtyNode) qtyNode.value = quantity;
                        if (vNode) vNode.value = verify;
                        if (tNode) tNode.value = BigInt(newInvType);
                        if (mNode) mNode.value = Date.now() / 86400000 + 25569;

                        listNode.elements.push(newNode);
                        listNode.length = listNode.elements.length;
                        
                        const newInvObj = {
                            item_id: newId,
                            qty: quantity,
                            invType: newInvType,
                            slotNode: newNode,
                            i_off: -1, q_off: -1, v_off: -1, t_off: -1, m_off: -1, verify: verify
                        };
                        invArray.push(newInvObj);
                        
                        return { mode: "inserted_new", slot: invArray.length - 1, item: newInvObj };
                    }
                }
            }
        }
        
        throw new Error("No hay slots vacios y no se pudo inyectar en el AST.");
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
        
        // AST approach
        if (this.ast) {
            const npcSavesNodes = this._findNodesInAST('npcSaves');
            const npcSavesNode = npcSavesNodes.length > 0 ? npcSavesNodes[0] : null;
            if (npcSavesNode) {
                const listNode = npcSavesNode.children[0];
                if (listNode && listNode.elements) {
                    for (const el of listNode.elements) {
                        const val = el.value || el;
                        if (val && val.children) {
                            const charNode = val.children.find(c => c.name === 'character');
                            if (charNode && charNode.value === npc.charId) {
                                const fNode = val.children.find(c => c.name === 'friendship');
                                if (fNode) fNode.value = newFriendship;
                                const ldNode = val.children.find(c => c.name === 'lastFriendshipDay');
                                if (ldNode) ldNode.value = 0;
                                break;
                            }
                        }
                    }
                }
            }
        }

        this.writeInt32(npc.fOff, newFriendship);
        npc.friendship = newFriendship;
        if (npc.ldOff !== -1) { this.writeInt32(npc.ldOff, 0); npc.lastFriendshipDay = 0; }
        return true;
    }

    setNPCPester(npcIndex, pesterValue) {
        const npc = this.npcSaves[npcIndex];
        if (!npc || npc.pOff === -1) return false;

        // AST approach
        if (this.ast) {
            const npcSavesNodes = this._findNodesInAST('npcSaves');
            const npcSavesNode = npcSavesNodes.length > 0 ? npcSavesNodes[0] : null;
            if (npcSavesNode) {
                const listNode = npcSavesNode.children[0];
                if (listNode && listNode.elements) {
                    for (const el of listNode.elements) {
                        const val = el.value || el;
                        if (val && val.children) {
                            const charNode = val.children.find(c => c.name === 'character');
                            if (charNode && charNode.value === npc.charId) {
                                const pNode = val.children.find(c => c.name && c.name.toLowerCase() === 'pester');
                                if (pNode) pNode.value = pesterValue;
                                break;
                            }
                        }
                    }
                }
            }
        }

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

        // Add AST nodes
        for (const key of Object.keys(this.generalVars)) {
            const nodes = this._findNodesInAST(key);
            if (nodes.length > 0) {
                this.generalVars[key].astNode = nodes[0];
            }
        }

        // Homecoming booleans (AST first, fallback to buffer)
        const parseHC = (key) => {
            const nodes = this._findNodesInAST(key);
            if (nodes.length > 0) {
                this.generalVars[key] = { value: nodes[0].value, type: 'bool', astNode: nodes[0], offset: -1 };
            } else {
                const hcTag = [0x68,0x00,0x6f,0x00,0x6d,0x00,0x65,0x00,0x63,0x00,0x6f,0x00,0x6d,0x00,0x69,0x00,0x6e,0x00,0x67,0x00];
                const tail = key.endsWith('iOS') ? [0x49,0x00,0x4f,0x00,0x53,0x00] : [0x41,0x00,0x6e,0x00,0x64,0x00,0x72,0x00,0x6f,0x00,0x69,0x00,0x64,0x00];
                const fullTag = hcTag.concat(tail);
                const off = this.findPattern(fullTag, 0);
                if (off !== -1) {
                    this.generalVars[key] = { value: this.buffer[off + fullTag.length] !== 0, offset: off + fullTag.length, type: 'bool' };
                }
            }
        };

        parseHC('homecomingiOS');
        parseHC('homecomingAndroid');
    }

    writeGeneralVar(name, value) {
        const entry = this.generalVars[name];
        if (!entry) {
            console.warn(`writeGeneralVar: No entry found for ${name}`);
            return false;
        }
        
        // AST approach
        if (entry.astNode) {
            if (entry.type === 'int32') entry.astNode.value = value | 0;
            else if (entry.type === 'float') entry.astNode.value = value;
            else if (entry.type === 'bool') entry.astNode.value = !!value;
        }

        if (entry.offset !== -1) {
            if (entry.type === 'int32') { this.writeInt32(entry.offset, value | 0); entry.value = value | 0; }
            else if (entry.type === 'float') { this.writeFloat32(entry.offset, value); entry.value = value; }
            else if (entry.type === 'bool') { this.writeBool(entry.offset, !!value); entry.value = !!value; }
        }
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
        
        if (this.ast) {
            const trainNodes = this._findNodesInAST('trainSave');
            const trainNode = trainNodes.length > 0 ? trainNodes[0] : null;
            if (trainNode && trainNode.children) {
                const dayNode = trainNode.children.find(c => c.name === 'trainDay');
                if (dayNode) dayNode.value = day;
            }
        }

        this.writeInt32(this.trainSave.trainDayOff, day);
        this.trainSave.trainDay = day;
        return true;
    }

    setTrainNumber(num) {
        if (!this.trainSave || this.trainSave.trainNumberOff === -1) return false;
        
        if (this.ast) {
            const trainNodes = this._findNodesInAST('trainSave');
            const trainNode = trainNodes.length > 0 ? trainNodes[0] : null;
            if (trainNode && trainNode.children) {
                const numNode = trainNode.children.find(c => c.name === 'trainNumber');
                if (numNode) numNode.value = num;
            }
        }

        this.writeInt32(this.trainSave.trainNumberOff, num);
        this.trainSave.trainNumber = num;
        return true;
    }

    getBuffer() {
        if (this.ast) {
            try {
                const writer = new OdinWriter();
                const outBuf = writer.write([this.ast]);
                return outBuf.buffer || outBuf;
            } catch (e) {
                alert('ERROR CRÍTICO AL GUARDAR:\n' + e.message);
                console.error(e);
                throw e;
            }
        }
        return this.buffer.buffer;
    }
}
