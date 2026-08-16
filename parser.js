function getDictList(wrap) {
        if (!wrap) return null;
        if (wrap.constructor.name === 'OdinList' || wrap.elements) return wrap;
        if (wrap.children) return wrap.children.find(c => c.constructor.name === 'OdinList' || c.elements) || null;
        return null;
    }
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

function dateToOADate(d = new Date()) {
    const epoch = Date.UTC(1899, 11, 30);
    return (d.getTime() - epoch) / 86400000;
}

function findChildNode(node, names) {
    if (!node || !node.children) return null;
    return node.children.find(c => names.includes(c.name));
}

function findChildRecursive(node, names) {
    if (!node) return null;
    if (node.name && names.includes(node.name)) return node;
    if (node.children) {
        for (const c of node.children) {
            const r = findChildRecursive(c, names);
            if (r) return r;
        }
    }
    return null;
}

function resolveListElements(node) {
    if (!node) return null;
    if (node.elements) return node.elements;
    if (node.value && node.value.elements) return node.value.elements;
    if (node.children) {
        const listChild = node.children.find(c => c.elements || (c.value && c.value.elements));
        if (listChild) return listChild.elements || (listChild.value && listChild.value.elements);
    }
    return null;
}

function cloneOdinTree(node) {
    if (!node) return null;
    
    // Si es un tipo primitivo que no es objeto, retornarlo
    if (typeof node !== 'object') return node;
    
    // Crear objeto con el mismo prototipo (ej: OdinList, OdinNode, etc.)
    const clone = Object.create(Object.getPrototypeOf(node));
    
    // Clonar campos propios
    for (const key in node) {
        if (Object.prototype.hasOwnProperty.call(node, key)) {
            if (key === 'children' && Array.isArray(node.children)) {
                clone.children = node.children.map(c => cloneOdinTree(c));
            } else if (key === 'elements' && Array.isArray(node.elements)) {
                clone.elements = node.elements.map(e => {
                    const clonedEl = cloneOdinTree(e);
                    // Ojo si el element tiene un wrapper { type:..., value:... }
                    // cloneOdinTree deberia manejarlo porque itera sobre las props
                    return clonedEl;
                });
            } else if (key === 'value' && typeof node.value === 'object' && node.value !== null) {
                clone.value = cloneOdinTree(node.value);
            } else {
                clone[key] = node[key];
            }
        }
    }
    return clone;
}

function readGroupXY(groupPosNode, positionNodeFallback) {
    let x = -1, y = -1;
    
    if (groupPosNode) {
        // 1) groupPosition.grid.x/y
        const grid = findChildNode(groupPosNode, ['grid']);
        if (grid) {
            const xNode = findChildNode(grid, ['x']);
            const yNode = findChildNode(grid, ['y']);
            if (xNode && yNode) return { x: Number(xNode.value), y: Number(yNode.value) };
        }
        
        // 2) groupPosition.x/y directos
        const xNodeDirect = findChildNode(groupPosNode, ['x']);
        const yNodeDirect = findChildNode(groupPosNode, ['y']);
        if (xNodeDirect && yNodeDirect) return { x: Number(xNodeDirect.value), y: Number(yNodeDirect.value) };
    }
    
    // 3) position.grid.x/y (GridPointer)
    if (positionNodeFallback) {
        const grid = findChildNode(positionNodeFallback, ['grid']);
        if (grid) {
            const xNode = findChildNode(grid, ['x']);
            const yNode = findChildNode(grid, ['y']);
            if (xNode && yNode) return { x: Number(xNode.value), y: Number(yNode.value) };
        }
    }
    
    // 4) buscar recursivo hijos llamados 'x'/'y' bajo groupPosition
    if (groupPosNode) {
        const xNode = findChildRecursive(groupPosNode, ['x']);
        const yNode = findChildRecursive(groupPosNode, ['y']);
        if (xNode && yNode) return { x: Number(xNode.value), y: Number(yNode.value) };
    }
    
    return { x, y };
}

function writeGroupXY(groupPosNode, newX, newY, positionNodeFallback, newFlipped) {
    let written = false;
    
    if (groupPosNode) {
        // 1) groupPosition.grid.x/y
        const grid = findChildNode(groupPosNode, ['grid']);
        if (grid) {
            const xNode = findChildNode(grid, ['x']);
            const yNode = findChildNode(grid, ['y']);
            if (xNode) { xNode.value = newX; written = true; }
            if (yNode) { yNode.value = newY; written = true; }
        }
        
        // 2) groupPosition.x/y directos
        const xNodeDirect = findChildNode(groupPosNode, ['x']);
        const yNodeDirect = findChildNode(groupPosNode, ['y']);
        if (xNodeDirect) { xNodeDirect.value = newX; written = true; }
        if (yNodeDirect) { yNodeDirect.value = newY; written = true; }
    }
    
    // 3) position.grid.x/y (GridPointer)
    if (positionNodeFallback) {
        const grid = findChildNode(positionNodeFallback, ['grid']);
        if (grid) {
            const xNode = findChildNode(grid, ['x']);
            const yNode = findChildNode(grid, ['y']);
            if (xNode) { xNode.value = newX; written = true; }
            if (yNode) { yNode.value = newY; written = true; }
        }
    }
    
    // 4) Recursivo (solo si no se escribió en los lugares comunes)
    if (!written && groupPosNode) {
        const xNode = findChildRecursive(groupPosNode, ['x']);
        const yNode = findChildRecursive(groupPosNode, ['y']);
        if (xNode) xNode.value = newX;
        if (yNode) yNode.value = newY;
    }
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
        this.wallpapers = {};
        this.floors = {};
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

    _parsePlacementEntry(furnEntry, sublocId) {
        const furnNode = furnEntry.value || furnEntry;
        if (!furnNode) return;
        
        let itemId = -1, x = -1, y = -1, floor = 0, orientation = 0, verify = 0, placementID = -1;
                        let planted_id = -1;
                        let flipped = false;

        const pIdNode = furnNode.children ? furnNode.children.find(c => c.name === 'placementID') : null;
        if (pIdNode) placementID = pIdNode.value;

        const vIdNode = furnNode.children ? furnNode.children.find(c => c.name === 'verificationID') : null;
        if (vIdNode) verify = vIdNode.value;

        const refNode = furnNode.children ? furnNode.children.find(c => c.name === 'reference') : null;
        if (refNode && refNode.children) {
            const idNode = refNode.children.find(c => c.name === 'id');
            if (idNode) itemId = idNode.value;
            const oriNode = refNode.children.find(c => c.name === 'orientation');
            if (oriNode) orientation = oriNode.value;
        } else {
            // For wall furniture
            const fIdNode = furnNode.children ? furnNode.children.find(c => c.name === 'furnitureID') : null;
            if (fIdNode) itemId = fIdNode.value;
        }

        const groupPosNode = furnNode.children ? furnNode.children.find(c => c.name === 'groupPosition') : null;
        const posNode = furnNode.children ? furnNode.children.find(c => c.name === 'position') : null;
        const coords = readGroupXY(groupPosNode, posNode);
        x = coords.x;
                        y = coords.y;
                        flipped = coords.flipped;
        if (groupPosNode) {
            const gNumNode = findChildRecursive(groupPosNode, ['groupNum']);
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
            isWall: !refNode
        });
    }



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
                        let planted_id = -1;
                        let flipped = false; // We can parse cropBox if needed later

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
                        const posNode = furnNode.children.find(c => c.name === 'position');
                        const coords = readGroupXY(groupPosNode, posNode);
                        x = coords.x;
                        y = coords.y;
                        flipped = coords.flipped;
                        if (groupPosNode) {
                            const gNumNode = findChildRecursive(groupPosNode, ['groupNum']);
                            if (gNumNode) floor = gNumNode.value;
                        }
                        
                        // Debug log if valid coords were forced to 0,0 (as requested)
                        if (placementID !== -1 && x === 0 && y === 0) {
                            // Check if it's not a SubGroupPosition (which is naturally 0,0)
                            const tn = groupPosNode && groupPosNode.typeName;
                            if (tn && !tn.includes('SubGroupPosition')) {
                                console.log(`[Debug] Item ${itemId} (pId ${placementID}) at 0,0. gpType: ${tn}`);
                            }
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
                const wallList = wallWrap.children.find(c => c.constructor.name === 'OdinList' || c.constructor.name === 'OdinDictionary');
                if (wallList) {
                    for (const wallEntry of wallList.elements) {
                        const wallNode = wallEntry.value && wallEntry.value.children ? wallEntry.value : (wallEntry.value.value || wallEntry.value);
                        let itemId = -1, x = -1, y = -1, floor = 0, orientation = 0, verify = 0, placementID = -1;
                        let flipped = false;
                        const pIdNode = wallNode.children.find(c => c.name === 'placementID');
                        if (pIdNode) placementID = pIdNode.value;

                        const fIdNode = wallNode.children.find(c => c.name === 'furnitureID');
                        if (fIdNode) itemId = fIdNode.value;

                        const vIdNode = wallNode.children.find(c => c.name === 'verificationID');
                        if (vIdNode) verify = vIdNode.value;

                        const groupPosNode = wallNode.children.find(c => c.name === 'groupPosition');
                        const posNode = wallNode.children.find(c => c.name === 'position');
                        const coords = readGroupXY(groupPosNode, posNode);
                        x = coords.x;
                        y = coords.y;
                        flipped = coords.flipped;
                        if (groupPosNode) {
                            const gNumNode = findChildRecursive(groupPosNode, ['groupNum']);
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
            const hasTime = findNodeByName(p.furnNode, ['harvestTimeOA', 'harvestTime', 'HarvestTime']);
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

        // --- Resolve Parent Links & Crop Specifics ---
        const seeds = this.placements.filter(p => isCropPlacement(p) && p.placementID !== -1);
        const plots = this.placements.filter(p => p.item_id === 306 || p.item_id === 411 || (typeof GROUND_IDS !== 'undefined' && GROUND_IDS.has(p.item_id)));

        // Resolve SubGroupPosition parentPlacementID for ALL placements
        for (const p of this.placements) {
            const parentIdNode = findChildRecursive(p.furnNode, ['parentPlacementID', 'ParentPlacementID']);
            if (parentIdNode && parentIdNode.value !== -1 && parentIdNode.value !== 0) {
                const parentIdNum = Number(parentIdNode.value);
                const parentItem = this.placements.find(parent => Number(parent.placementID) === parentIdNum);
                if (parentItem) {
                    p.x = parentItem.x;
                    p.y = parentItem.y;
                    p.linkedParent = parentItem;
                }
            }
        }

        // Apply specific crop logic
        for (const seed of seeds) {
            seed.harvestTimeNode = findChildRecursive(seed.furnNode, ['harvestTimeOA', 'harvestTime', 'HarvestTime']);
            seed.placedNode = findChildRecursive(seed.furnNode, ['placedOA', 'Placed', 'placed']);
            
            let linked = false;
            
            if (seed.linkedParent) {
                const parentPlot = plots.find(pl => Number(pl.placementID) === Number(seed.linkedParent.placementID));
                if (parentPlot) {
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


        // Train Carriages Virtual Placements
        const trainSaveWrapper = this.ast.children.find(c => c.name === 'trainSave');
        if (trainSaveWrapper && trainSaveWrapper.constructor.name !== 'OdinNull' && trainSaveWrapper.children) {
            const carriagesNode = trainSaveWrapper.children.find(c => c.name === 'carriages');
            if (carriagesNode && carriagesNode.children) {
                const carrList = carriagesNode.children.find(c => c.constructor.name === 'OdinList');
                if (carrList && carrList.elements) {
                    for (let ci = 0; ci < carrList.elements.length; ci++) {
                        const carrNode = carrList.elements[ci];
                        if (carrNode && carrNode.children) {
                            const virtualClusterId = 'train_vagon_' + (ci + 1);
                            this.clusters.add(virtualClusterId);
                            
                            const furnNode = carrNode.children.find(c => c.name === 'furniture');
                            if (furnNode && furnNode.children) {
                                const furnList = furnNode.children.find(c => c.constructor.name === 'OdinList');
                                if (furnList && furnList.elements) {
                                    for (const fEntry of furnList.elements) {
                                        this._parsePlacementEntry(fEntry, virtualClusterId);
                                    }
                                }
                            }
                        }
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
                    if (oriNode) oriNode.value = typeof oriNode.value === 'bigint' ? BigInt(newOrientation) : newOrientation;
                }
            }
        }

        const groupPosNode = node.children.find(c => c.name === 'groupPosition');
        const posNode = node.children.find(c => c.name === 'position');
        
        const tn = node.typeName || node.className;
        const isCrop = (typeof SEED_IDS !== 'undefined' && SEED_IDS.has(newId)) 
                       || (tn && /CropSave/i.test(tn))
                       || !!findChildRecursive(node, ['harvestTimeOA', 'harvestTime', 'HarvestTime']);

        if (isCrop) {
            writeGroupXY(groupPosNode, 0, 0, posNode);
        } else {
            writeGroupXY(groupPosNode, newX, newY, posNode);
        }
        
        const vIdNode = node.children.find(c => c.name === 'verificationID');
        if (vIdNode) {
            const v = calcVerificationId(newId);
            vIdNode.value = v;
            placement.verify = v;
        }
    }

    setWallPlacementCell(placementID, { x, y, groupNum, flipped }) {
        const placement = this.placements.find(p => p.placementID === placementID && p.isWall);
        if (!placement || !placement.furnNode) return false;

        if (x !== undefined) placement.x = Number(x);
        if (y !== undefined) placement.y = Number(y);
        if (flipped !== undefined) placement.flipped = Boolean(flipped);
        
        const groupPosNode = placement.furnNode.children.find(c => c.name === 'groupPosition');
        const posNode = placement.furnNode.children.find(c => c.name === 'position');
        
        writeGroupXY(groupPosNode, placement.x, placement.y, posNode, placement.flipped);

        if (groupNum !== undefined && groupPosNode) {
            placement.floor = groupNum.toString();
            const gNumNode = findChildRecursive(groupPosNode, ['groupNum']);
            if (gNumNode) gNumNode.value = Number(groupNum);
        }
        return true;
    }

    setWallpaper(sublocId, key, newId) {
        if (!this.wallpapers || !this.wallpapers[sublocId]) return false;
        const entry = this.wallpapers[sublocId].find(w => w.key === Number(key));
        if (entry && entry.node) {
            entry.id = Number(newId);
            entry.node.value = entry.id;
            return true;
        }
        return false;
    }

    setFloor(sublocId, key, newId) {
        if (!this.floors || !this.floors[sublocId]) return false;
        const entry = this.floors[sublocId].find(f => f.key === Number(key));
        if (entry && entry.node) {
            entry.id = Number(newId);
            entry.node.value = entry.id;
            return true;
        }
        return false;
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


    // ─── Crops & Validation ──────────────────────────────────────────────

    getCropSaveFields(placement) {
        if (!placement || !placement.furnNode) return null;
        return {
            ripeNode: findChildRecursive(placement.furnNode, ['ripe', 'Ripe']),
            harvestTimeNode: findChildRecursive(placement.furnNode, ['harvestTimeOA', 'harvestTime', 'HarvestTime']),
            placedNode: findChildRecursive(placement.furnNode, ['placedOA', 'Placed', 'placed']),
            strangeNode: findChildRecursive(placement.furnNode, ['strange', 'Strange']),
            consumedNode: findChildRecursive(placement.furnNode, ['consumed', 'Consumed'])
        };
    }

    setCropRipe(placement, ripe) {
        const fields = this.getCropSaveFields(placement);
        if (!fields) return false;

        let modified = false;
        if (fields.ripeNode) {
            fields.ripeNode.value = !!ripe;
            modified = true;
        }

        if (ripe && fields.harvestTimeNode) {
            // Mature -> time is past
            fields.harvestTimeNode.value = dateToOADate(new Date()) - 0.01;
            modified = true;
        }

        return modified;
    }

    getCropTiming(placement) {
        const fields = this.getCropSaveFields(placement);
        if (!fields) return null;
        
        const harvestTimeOA = fields.harvestTimeNode ? fields.harvestTimeNode.value : null;
        const placedOA = fields.placedNode ? fields.placedNode.value : null;
        const ripe = fields.ripeNode ? !!fields.ripeNode.value : false;
        
        let daysLeft = 0;
        let isReady = ripe;
        
        if (harvestTimeOA !== null) {
            const nowOA = dateToOADate(new Date());
            daysLeft = Math.max(0, harvestTimeOA - nowOA);
            if (daysLeft <= 0) isReady = true;
        }
        
        return {
            harvestTimeOA,
            placedOA,
            ripe,
            daysLeft,
            isReady
        };
    }

    setCropDaysLeft(placement, daysLeft) {
        const fields = this.getCropSaveFields(placement);
        // Do not blindly create fields if they don't exist
        if (!fields || !fields.harvestTimeNode) {
            throw new Error("No se pudo hallar el campo harvestTimeOA en este cultivo.");
        }
        
        const nowOA = dateToOADate(new Date());
        fields.harvestTimeNode.value = nowOA + Number(daysLeft);
        
        if (fields.ripeNode) {
            fields.ripeNode.value = (daysLeft <= 0);
        }
        return true;
    }

    matureAllCrops() {
        if (!this.placements) return 0;
        let count = 0;
        for (const p of this.placements) {
            const tn = p.furnNode ? (p.furnNode.typeName || p.furnNode.className) : null;
            const isCrop = (typeof SEED_IDS !== 'undefined' && SEED_IDS.has(p.item_id)) 
                           || (tn && /CropSave/i.test(tn))
                           || !!findChildRecursive(p.furnNode, ['harvestTimeOA', 'harvestTime', 'HarvestTime']);

            if (isCrop) {
                const fields = this.getCropSaveFields(p);
                // Only mature if it was placed or has harvest time
                if (fields && (fields.placedNode || fields.harvestTimeNode)) {
                    if (this.setCropRipe(p, true)) count++;
                }
            }
        }
        return count;
    }

    validateSaveForDownload(options = {}) {
        const { fixCropGrid = true, fixVerify = false, fixLocDup = false } = options;
        
        let fixes = 0;
        const issues = [];
        const errors = [];
        
        // --- A) Crops & B) Map Placements ---
        if (this.placements) {
            const placementIds = new Set();
            for (const p of this.placements) {
                // Check B1: Duplicated placementID
                if (p.placementID > 0) {
                    if (placementIds.has(p.placementID)) {
                        issues.push({ code: 'PLACE_DUP_ID', severity: 'WARNING', message: `ID de placement duplicado: ${p.placementID}` });
                    }
                    placementIds.add(p.placementID);
                }
                
                // Check B2: Bad orientation
                if (p.orientation !== undefined && (p.orientation < 0 || p.orientation > 3)) {
                    issues.push({ code: 'PLACE_BAD_ORIENT', severity: 'INFO', message: `Orientación fuera de rango normal (0-3) en ítem ${p.item_id}` });
                }

                // Crops logic
                const tn = p.furnNode ? (p.furnNode.typeName || p.furnNode.className) : null;
                const isCrop = (typeof SEED_IDS !== 'undefined' && SEED_IDS.has(p.item_id)) 
                               || (tn && /CropSave/i.test(tn))
                               || !!findChildRecursive(p.furnNode, ['harvestTimeOA', 'harvestTime', 'HarvestTime']);

                if (isCrop) {
                    const parentIdNode = findChildRecursive(p.furnNode, ['parentPlacementID', 'ParentPlacementID']);
                    const hasParent = parentIdNode && parentIdNode.value !== -1 && parentIdNode.value !== 0;
                    
                    if (hasParent) {
                        const parentId = Number(parentIdNode.value);
                        const parentExists = this.placements.some(pl => Number(pl.placementID) === parentId);
                        if (!parentExists) {
                            issues.push({ code: 'CROP_ORPHAN', severity: 'WARNING', message: `Cultivo ${p.item_id} apunta a un parent inexistente (${parentId}).` });
                        }
                        
                        // It's a planted crop on a plot. Grid MUST be 0,0
                        const groupPosNode = findChildRecursive(p.furnNode, ['groupPosition']);
                        const posNode = findChildRecursive(p.furnNode, ['position']);
                        const gridPos = readGroupXY(groupPosNode, posNode);
                        
                        if (gridPos.x !== 0 || gridPos.y !== 0) {
                            if (fixCropGrid) {
                                writeGroupXY(groupPosNode, 0, 0, posNode);
                                fixes++;
                            } else {
                                issues.push({ code: 'CROP_GRID', severity: 'FIX', message: `Cultivo ${p.item_id} tiene grid (${gridPos.x},${gridPos.y}) en vez de (0,0).` });
                            }
                        }
                    } else if (p.x !== -1 || p.y !== -1) {
                        // Crop without parent that was somehow drawn on map
                        issues.push({ code: 'CROP_NO_PARENT', severity: 'WARNING', message: `Cultivo ${p.item_id} sin parent está colocado en el mapa (X:${p.x}, Y:${p.y}).` });
                    }
                    
                    // Check Harvest Time
                    const fields = this.getCropSaveFields(p);
                    if (fields && fields.harvestTimeNode) {
                        const ht = fields.harvestTimeNode.value;
                        if (isNaN(ht) || ht < 0) {
                            issues.push({ code: 'CROP_TIME', severity: 'INFO', message: `Cultivo ${p.item_id} tiene tiempo de cosecha inválido o negativo (${ht}).` });
                        }
                    }
                }
            }
        }
        
        // --- C) locationsOnPhone ---
        const locsOnPhone = this.getLocationsOnPhone();
        if (locsOnPhone && locsOnPhone.length > 0) {
            const seenLocs = new Set();
            for (const l of locsOnPhone) {
                const locVal = Number(l.id);
                if (locVal < 0 || locVal > 50) { // max arbitrary known value
                    issues.push({ code: 'LOC_INVALID', severity: 'INFO', message: `ID de ubicación en teléfono inválido: ${locVal}` });
                }
                if (seenLocs.has(locVal)) {
                    issues.push({ code: 'LOC_DUP', severity: 'WARNING', message: `Ubicación ${locVal} duplicada en el teléfono.` });
                }
                seenLocs.add(locVal);
            }
        }
        
        // --- D) Inventory ---
        if (this.inventory) {
            const capInfo = this.getInventoryCapacityInfo();
            if (capInfo.used > capInfo.capacity && !capInfo.infinite) {
                issues.push({ code: 'INV_OVER', severity: 'WARNING', message: `Inventario excede capacidad (${capInfo.used}/${capInfo.capacity}).` });
            }
            if (capInfo.source === 'bag_unknown') {
                issues.push({ code: 'INV_BAG', severity: 'INFO', message: `Bolsas detectadas con tamaño desconocido. Capacidad estimada: 50.` });
            }
            
            for (let i = 0; i < this.inventory.length; i++) {
                const item = this.inventory[i];
                if (item.item_id > 0) {
                    const expectedVerify = calcVerificationId(item.item_id) >>> 0;
                    if ((item.verificationID >>> 0) !== expectedVerify) {
                        if (fixVerify) {
                            item.verificationID = expectedVerify;
                            // Search the actual node to apply fix
                            const itemsNode = this.ast.children.find(c => c.name === 'items');
                            if (itemsNode) {
                                // Since we mutate AST, let's just trigger a re-parse or sync back? 
                                // Best is just changing it via updateInventoryItem, but we are inside validation...
                                // We can safely call updateInventoryItem on it. Wait, updateInventoryItem needs index.
                                // It's just easier to update the property if we stored the node. 
                                // Our AST doesn't link verificationID node directly in this.inventory, it is only parsed.
                                // Instead of deep fixing the AST here, let's rely on updateInventoryItem.
                            }
                            this.updateInventoryItem('inventory', i, item.item_id, item.qty, item.invType);
                            fixes++;
                        } else {
                            issues.push({ code: 'INV_VERIFY', severity: 'WARNING', message: `Ítem ${item.item_id} tiene un VerificationID incorrecto.` });
                        }
                    }
                }
            }
        }
        
        // --- E) Punchcard ---
        const punch = this.getPunchcardState();
        if (punch) {
            const claimedCount = Number(punch.claimedCount) || 0;
            const claimedSlots = punch.rewards.filter(r => r.claimed).length;
            if (claimedCount < claimedSlots || claimedCount > claimedSlots + 7) {
                issues.push({ code: 'PUNCH_COUNT', severity: 'INFO', message: `Inconsistencia posible en punchcardsClaimed (${claimedCount}) vs slots marcados (${claimedSlots}).` });
            }
        }
        
        // Assemble errors
        for (const iss of issues) {
            errors.push(`[${iss.severity}] ${iss.message}`);
        }
        
        const hasWarnings = issues.some(iss => iss.severity === 'WARNING' || iss.severity === 'FIX');

        return {
            fixes,
            errors,
            hasWarnings,
            issues
        };
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

    
    updateInventoryItem(arrayName, index, newId, newQty, newInvType) {
        let item = null;
        if (arrayName === 'inventory' && this.inventory[index]) item = this.inventory[index];
        else if (arrayName === 'hiddenInventory' && this.hiddenInventory[index]) item = this.hiddenInventory[index];
        
        if (!item) throw new Error("Slot de inventario inválido.");
        
        let changed = false;
        if (item.item_id !== newId) changed = true;
        if (item.qty !== newQty) changed = true;
        if (newInvType !== undefined && item.invType !== newInvType) changed = true;
        
        item.item_id = newId;
        item.qty = newQty;
        if (newInvType !== undefined) item.invType = newInvType;
        
        if (item.slotNode && item.slotNode.children) {
            const idNode = item.slotNode.children.find(c => c.name === 'ID');
            const qtyNode = item.slotNode.children.find(c => c.name === 'quantity');
            const typeNode = item.slotNode.children.find(c => c.name === 'invType');
            const vNode = item.slotNode.children.find(c => c.name === 'verify' || c.name === 'verificationID');
            
            if (idNode) idNode.value = newId;
            if (qtyNode) qtyNode.value = newQty;
            if (typeNode && newInvType !== undefined) typeNode.value = newInvType;
            if (vNode) vNode.value = calcVerificationId(newId);
        } else {
            console.error("AST slotNode missing for inventory update!", item);
        }
        return changed;
    }

    
    clearInventoryItem(arrayName, index) {
        let item = null;
        if (arrayName === 'inventory' && this.inventory[index]) item = this.inventory[index];
        else if (arrayName === 'hiddenInventory' && this.hiddenInventory[index]) item = this.hiddenInventory[index];
        
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

    injectInventoryItem(newId, quantity = 1, isHidden = false, visualCategory = 1) {
        if (!this.inventory || !this.inventory.length) this.parseInventory();
        if (!Number.isInteger(newId) || !Number.isInteger(quantity))
            throw new Error("ID y cantidad deben ser enteros.");
        if (quantity <= 0) throw new Error("La cantidad debe ser mayor que cero.");
        
        const arrayName = isHidden ? 'hiddenInventory' : 'inventory';
        const invArray = isHidden ? this.hiddenInventory : this.inventory;
        const targetInvType = visualCategory;
        
        if (!invArray) throw new Error("El arreglo de inventario no esta inicializado.");
        const stackItem = invArray.find(i => i.item_id === newId);
        
        if (stackItem) {
            const idx = invArray.indexOf(stackItem);
            const changed = this.updateInventoryItem(arrayName, idx, newId, stackItem.qty + quantity, targetInvType);
            if (!changed) throw new Error("No se pudo sumar la cantidad.");
            return { mode: 'stacked', slot: idx, item: stackItem };
        }
        
        const emptySlotIdx = invArray.findIndex(i => i.item_id === -1 || i.qty <= 0);
        if (emptySlotIdx !== -1) {
            const changed = this.updateInventoryItem(arrayName, emptySlotIdx, newId, quantity, targetInvType);
            if (!changed) throw new Error("El slot vacío no mutó.");
            return { mode: "inserted", slot: emptySlotIdx, item: invArray[emptySlotIdx] };
        }
        
        // If there are no empty slots, we must create a new one in the AST
        if (this.ast) {
            const parentName = isHidden ? 'hiddenItems' : 'slots';
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
                        if (tNode) tNode.value = BigInt(targetInvType);
                        if (mNode) mNode.value = Date.now() / 86400000 + 25569;

                        listNode.elements.push(newNode);
                        listNode.length = listNode.elements.length;
                        
                        const newInvObj = {
                            item_id: newId,
                            qty: quantity,
                            invType: targetInvType,
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

    // --- Inventory Capacity ---
    
    countUsedInventorySlots() {
        if (!this.inventory) return 0;
        return this.inventory.filter(i => i.item_id > 0 && i.qty > 0).length;
    }

    getEquippedBags() {
        if (!this.inventory) return [];
        const BAG_ITEM_IDS = new Set([124, 125, 141, 155, 156, 212, 213, 303, 308, 331, 332]);
        // KNOWN_ITEMS data can be used to resolve names if needed, but for now we just get the items
        return this.inventory.filter(i => BAG_ITEM_IDS.has(i.item_id) && i.qty > 0 && i.invType === 0).map(i => {
            return {
                id: i.item_id,
                qty: i.qty,
                name: `ITEM_${i.item_id}`,
                knownSize: null // We don't have verified sizes for all bags yet
            };
        });
    }

    getInventoryCapacityInfo(manualOverride = null) {
        const used = this.countUsedInventorySlots();
        const DEFAULT_CAPACITY = 50;
        let capacity = DEFAULT_CAPACITY;
        let source = 'default';
        let infinite = false;
        
        const BAG_SIZE_BY_ID = {
            124: 100, 125: 100, 156: Infinity, 303: 150, 212: 150
        };
        
        const bags = this.getEquippedBags();
        
        if (bags.length > 0) {
            let maxBagSize = -1;
            for (const bag of bags) {
                // If we know the infinite bag ID, we could flag it here. Assuming no infinite bag ID known yet, 
                // but if we had name check we could do it.
                if (bag.id === 156) { // Just guessing "The Bag" or similar if it were infinite, but we don't know yet. Let's keep logic prepared.
                    infinite = true;
                }
                
                if (BAG_SIZE_BY_ID[bag.id] !== undefined) {
                    if (BAG_SIZE_BY_ID[bag.id] > maxBagSize) maxBagSize = BAG_SIZE_BY_ID[bag.id];
                    bag.knownSize = BAG_SIZE_BY_ID[bag.id];
                }
            }
            if (maxBagSize > -1) {
                capacity = maxBagSize;
                source = 'bag';
            } else {
                capacity = DEFAULT_CAPACITY;
                source = 'bag_unknown';
            }
        }
        
        if (manualOverride !== null && !isNaN(manualOverride) && manualOverride !== "") {
            capacity = parseInt(manualOverride);
            source = 'manual';
        }
        
        return { used, capacity, source, bags, infinite };
    }

    moveExcessToHidden(capacity) {
        if (!this.inventory || !this.hiddenInventory || !this.ast) return 0;
        
        const usedSlots = this.inventory.filter(i => i.item_id > 0 && i.qty > 0);
        let excessCount = usedSlots.length - capacity;
        if (excessCount <= 0) return 0;
        
        let movedCount = 0;
        // Start from the end of the inventory array
        for (let i = this.inventory.length - 1; i >= 0 && movedCount < excessCount; i--) {
            const item = this.inventory[i];
            if (item.item_id > 0 && item.qty > 0) {
                // Find or create slot in hiddenInventory
                this.injectInventoryItem(item.item_id, item.qty, true); // true = isHidden
                // Clear from main inventory
                this.clearInventoryItem('inventory', i);
                movedCount++;
            }
        }
        return movedCount;
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
                const tail = key.endsWith('IOS') ? [0x49,0x00,0x4f,0x00,0x53,0x00] : [0x41,0x00,0x6e,0x00,0x64,0x00,0x72,0x00,0x6f,0x00,0x69,0x00,0x64,0x00];
                const fullTag = hcTag.concat(tail);
                const off = this.findPattern(fullTag, 0);
                if (off !== -1) {
                    this.generalVars[key] = { value: this.buffer[off + fullTag.length] !== 0, offset: off + fullTag.length, type: 'bool' };
                }
            }
        };

        parseHC('homecomingIOS');
        parseHC('homecomingAndroid');
    }

    writeGeneralVar(name, value) {
        // Alias support for legacy homecomingiOS calls
        if (name === 'homecomingiOS') name = 'homecomingIOS';
        
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


    // ─── Home Sublocation Helpers ───

    getHomeSublocationNode() {
        if (!this.ast) return null;
        const sublocsWrapper = this.ast.children.find(c => c.name === 'sublocations');
        if (!sublocsWrapper || !sublocsWrapper.children) return null;
        
        const sublocsList = sublocsWrapper.children.find(c => c.constructor.name === 'OdinList' || c.constructor.name === 'OdinDictionary');
        if (!sublocsList || !sublocsList.elements) return null;

        for (const entry of sublocsList.elements) {
            if (entry.key && entry.key.value == 0) {
                return entry.value;
            }
            if (entry.value && entry.value.children) {
                const slocationChild = entry.value.children.find(c => c.name === 'slocation');
                if (slocationChild && slocationChild.value == 0) {
                    return entry.value;
                }
            }
        }
        return null;
    }

    getHomeCurrSLocData() {
        const homeNode = this.getHomeSublocationNode();
        if (!homeNode || !homeNode.children) return null;
        const currNode = homeNode.children.find(c => c.name === 'currSLocData');
        return currNode ? currNode.value : null;
    }

    setHomeCurrSLocData(value) {
        const homeNode = this.getHomeSublocationNode();
        if (!homeNode || !homeNode.children) return false;
        const currNode = homeNode.children.find(c => c.name === 'currSLocData');
        if (currNode) {
            currNode.value = value;
            return true;
        }
        return false;
    }

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







    validateSaveState() {
        if (!this.ast) return { valid: true };
        const tripNode = this.ast.children ? this.ast.children.find(c => c.name === 'trip') : null;
        if (tripNode && tripNode.constructor.name !== 'OdinNull' && tripNode.children) {
            const started = tripNode.children.find(c => c.name === 'tripStarted');
            const ended = tripNode.children.find(c => c.name === 'tripEnded');
            const startLoc = tripNode.children.find(c => c.name === 'start');
            const cId = tripNode.children.find(c => c.name === 'CarriageID');
            
            const isStarted = started && started.value === true;
            const isEnded = ended && ended.value === true;
            // The values might be numbers or bigints
            const isStartZero = startLoc && (startLoc.value === 0 || startLoc.value === 0n);
            const isCIdZero = cId && (cId.value === 0 || cId.value === 0n);
            
            if (isStarted && !isEnded && isStartZero) {
                return { valid: false, reason: 'Viaje corrupto detectado (tripStarted=true, tripEnded=false, start=0)' };
            }
            if (isStarted && !isEnded && isCIdZero) {
                return { valid: false, reason: 'Viaje corrupto detectado (CarriageID=0)' };
            }
        }
        return { valid: true };
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

    // ─── Punchcard & Phone ───────────────────────────────────────────────

    getPunchcardState() {
        if (!this.ast) return { claimedCount: 0, rewards: [] };
        
        let pcNode = findChildRecursive(this.ast, ['punchcard', 'Punchcard', 'punchCard']);
        if (!pcNode) return { claimedCount: 0, rewards: [] };
        
        let countNode = findChildRecursive(this.ast, ['punchcardsClaimed', 'PunchcardsClaimed']);
        let claimedCount = countNode ? countNode.value : 0;
        
        let rewards = [];
        let rewardsNode = findChildNode(pcNode, ['rewards', 'Rewards', 'dailyRewards', 'slots']);
        
        // Sometimes rewards is just a wrapper with an OdinList .elements inside, or the node itself has .elements
        let elements = null;
        if (rewardsNode && rewardsNode.elements) {
            elements = rewardsNode.elements;
        } else if (rewardsNode && rewardsNode.value && rewardsNode.value.elements) {
            elements = rewardsNode.value.elements;
        } else {
            // Find child with elements just in case
            let listChild = rewardsNode && rewardsNode.children ? rewardsNode.children.find(c => c.elements) : null;
            if (listChild) elements = listChild.elements;
        }
        
        if (elements) {
            for (let i = 0; i < elements.length; i++) {
                let rNode = elements[i].value || elements[i];
                let typeNode = findChildNode(rNode, ['RewardType', 'rewardType', 'type', 'Type']);
                let claimNode = findChildNode(rNode, ['claimed', 'Claimed', 'isClaimed']);
                let modifierNode = findChildNode(rNode, ['modifier', 'Modifier', 'rarity']);
                
                rewards.push({
                    index: i,
                    rewardType: typeNode ? typeNode.value : 0,
                    claimed: claimNode ? claimNode.value : false,
                    modifier: modifierNode ? modifierNode.value : 0,
                    claimNode: claimNode
                });
            }
        }
        
        let weeklyNode = findChildNode(pcNode, ['weeklyReward', 'WeeklyReward', 'weekly', 'furnitureReward']);
        if (weeklyNode) {
            let claimNode = findChildNode(weeklyNode, ['claimed', 'Claimed', 'isClaimed']);
            let furnNode = findChildNode(weeklyNode, ['furnID', 'furnitureID', 'FurnitureID', 'id']);
            rewards.push({
                index: 6, // 7th logical slot
                isWeekly: true,
                furnID: furnNode ? furnNode.value : -1,
                claimed: claimNode ? claimNode.value : false,
                claimNode: claimNode,
                furnNode: furnNode
            });
        }
        
        return { claimedCount, rewards, pcNode };
    }

    setPunchcardSlot(index, claimed, isWeekly = false) {
        let state = this.getPunchcardState();
        let slot = state.rewards.find(r => r.index === index && !!r.isWeekly === isWeekly);
        if (slot && slot.claimNode) {
            slot.claimNode.value = !!claimed;
            return true;
        }
        return false;
    }

    setWeeklyRewardFurnId(furnId) {
        let state = this.getPunchcardState();
        let slot = state.rewards.find(r => r.index === 6 && r.isWeekly);
        if (slot && slot.furnNode) {
            slot.furnNode.value = Number(furnId) | 0;
            return true;
        }
        return false;
    }

    getPhoneCosmetics() {
        if (!this.ast) return null;
        let phoneSave = findChildRecursive(this.ast, ['phoneSave', 'PhoneSave']);
        if (!phoneSave) return null;

        const getValNode = (aliases) => {
            let n = findChildRecursive(phoneSave, aliases);
            return n ? n : null;
        };

        const skinNode = getValNode(['skinID', 'SkinID', 'skinId']);
        const bgPatternNode = getValNode(['bgPatternID', 'BgPatternID', 'backgroundPatternID']);
        const bgColorNode = getValNode(['bgColorID', 'BgColorID']);
        const backgroundsUnlockedNode = getValNode(['backgroundsUnlocked', 'BackgroundsUnlocked']);
        const colorsUnlockedNode = getValNode(['colorsUnlocked', 'ColorsUnlocked']);
        const newBackgroundsNode = getValNode(['newBackgrounds']);
        const newColorsNode = getValNode(['newColors']);

        return {
            nodes: {
                skinNode, bgPatternNode, bgColorNode, 
                backgroundsUnlockedNode, colorsUnlockedNode,
                newBackgroundsNode, newColorsNode
            },
            skinID: skinNode ? skinNode.value : -1,
            bgPatternID: bgPatternNode ? bgPatternNode.value : -1,
            bgColorID: bgColorNode ? bgColorNode.value : -1,
            backgroundsUnlocked: backgroundsUnlockedNode ? backgroundsUnlockedNode.value : 0,
            colorsUnlocked: colorsUnlockedNode ? colorsUnlockedNode.value : 0,
            newBackgrounds: newBackgroundsNode ? newBackgroundsNode.value : 0,
            newColors: newColorsNode ? newColorsNode.value : 0
        };
    }

    setPhoneCosmeticField(fieldName, value) {
        let cos = this.getPhoneCosmetics();
        if (!cos) return false;
        
        const map = {
            skinID: 'skinNode',
            bgPatternID: 'bgPatternNode',
            bgColorID: 'bgColorNode',
            backgroundsUnlocked: 'backgroundsUnlockedNode',
            colorsUnlocked: 'colorsUnlockedNode',
            newBackgrounds: 'newBackgroundsNode',
            newColors: 'newColorsNode'
        };
        
        let nodeKey = map[fieldName];
        if (!nodeKey) return false;

        if (cos.nodes[nodeKey]) {
            if (typeof cos.nodes[nodeKey].value === 'bigint' && typeof value !== 'bigint') {
                cos.nodes[nodeKey].value = BigInt(value);
            } else {
                cos.nodes[nodeKey].value = value;
            }
            return true;
        }
        return false;
    }

    unlockAllPhoneBackgrounds() {
        let cos = this.getPhoneCosmetics();
        if (!cos || !cos.nodes.backgroundsUnlockedNode) return false;
        let n = cos.nodes.backgroundsUnlockedNode;
        if (typeof n.value === 'bigint') n.value = 0xFFFFFFFFFFFFFFFFn;
        else n.value = 0xFFFFFFFF; // Number.MAX_SAFE_INTEGER can break 32-bit uint serialization
        if (cos.nodes.newBackgroundsNode) cos.nodes.newBackgroundsNode.value = 0;
        return true;
    }

    unlockAllPhoneColors() {
        let cos = this.getPhoneCosmetics();
        if (!cos || !cos.nodes.colorsUnlockedNode) return false;
        let n = cos.nodes.colorsUnlockedNode;
        if (typeof n.value === 'bigint') n.value = 0xFFFFFFFFFFFFFFFFn;
        else n.value = 0xFFFFFFFF;
        if (cos.nodes.newColorsNode) cos.nodes.newColorsNode.value = 0;
        return true;
    }

    getLocationsOnPhone() {
        if (!this.ast) return [];
        let locNode = findChildRecursive(this.ast, ['locationsOnPhone']);
        if (!locNode) return [];
        
        let elements = resolveListElements(locNode);
        if (!elements) return [];
        
        let locs = [];
        for (let i = 0; i < elements.length; i++) {
            let el = elements[i].value || elements[i];
            let location = findChildNode(el, ['location']);
            let seen = findChildNode(el, ['seen']);
            if (location) {
                locs.push({
                    id: location.value,
                    seen: seen ? seen.value : false,
                    node: el,
                    seenNode: seen
                });
            }
        }
        return locs;
    }

    setLocationUnlocked(locationId, seen = true) {
        if (!this.ast) return false;
        let locNode = findChildRecursive(this.ast, ['locationsOnPhone']);
        if (!locNode) return false;
        
        let locs = this.getLocationsOnPhone();
        let existing = locs.find(l => l.id === locationId);
        
        if (existing) {
            if (existing.seenNode) existing.seenNode.value = seen;
            return true;
        }
        
        // Not found, clone from first element if array is not empty
        let elements = resolveListElements(locNode);
        
        if (locs.length > 0 && elements && elements.length > 0) {
            let firstEl = elements[0];
            let newEl = cloneOdinTree(firstEl);
            
            // Adjust values
            let valNode = newEl.value || newEl;
            let locIdNode = findChildNode(valNode, ['location']);
            let seenNode = findChildNode(valNode, ['seen']);
            
            if (locIdNode) locIdNode.value = locationId;
            if (seenNode) seenNode.value = seen;
            
            elements.push(newEl);
            
            // Find the list node to increment array count
            let listNode = null;
            if (locNode.elements === elements) listNode = locNode;
            else if (locNode.value && locNode.value.elements === elements) listNode = locNode.value;
            else if (locNode.children) {
                let lc = locNode.children.find(c => c.elements === elements || (c.value && c.value.elements === elements));
                if (lc && lc.elements === elements) listNode = lc;
                else if (lc && lc.value && lc.value.elements === elements) listNode = lc.value;
            }
            
            if (listNode) {
                listNode.length = elements.length;
                if (listNode.count !== undefined) listNode.count = elements.length;
            }
            return true;
        }
        
        // Cannot unlock if array is completely empty, we don't have a template to clone
        return false;
    }

    // --- Letters & Orders ---
    getLetterSave() {
        if (!this.ast) return null;
        
        const walk = (node) => {
            if (node.name === 'letters' && node.typeName && node.typeName.includes('LetterSave')) {
                return node;
            }
            if (node.children) {
                for (const c of node.children) {
                    const r = walk(c);
                    if (r) return r;
                }
            }
            if (node.elements) {
                for (const el of node.elements) {
                    const v = el.value || el;
                    const r = walk(v);
                    if (r) return r;
                }
            }
            return null;
        };
        
        return walk(this.ast);
    }

    cloneOrderLetter({ furnitureID }) {
        const ls = this.getLetterSave();
        if (!ls) return { error: 'no_template' };
        const lettersNode = findChildNode(ls, ['letters', 'Letters']);
        if (!lettersNode || !lettersNode.children) return { error: 'no_template' };
        
        const listNode = lettersNode.children.find(c => c.constructor.name === 'OdinList');
        if (!listNode || !listNode.elements || listNode.elements.length === 0) return { error: 'no_template' };
        
        // Find a template letter
        let template = null;
        for (const el of listNode.elements) {
            const val = el.value || el;
            if (val.typeName && val.typeName.includes('OrderLetter')) {
                template = el;
                break;
            }
        }
        if (!template) template = listNode.elements[0]; // fallback
        
        const newEl = cloneOdinTree(template);
        
        // Re-assign IDs
        const assignNewNodeIds = (n) => {
            if (!n) return;
            if (n.nodeId !== undefined) {
                n.nodeId = Math.floor(Math.random() * 100000000) + 100000000;
            }
            if (n.children) n.children.forEach(assignNewNodeIds);
            if (n.elements) {
                n.elements.forEach(e => {
                    assignNewNodeIds(e.value || e);
                    assignNewNodeIds(e.key);
                });
            }
        };
        assignNewNodeIds(newEl.value || newEl);
        
        // Push it
        listNode.elements.push(newEl);
        
        // Change furnitureID
        const val = newEl.value || newEl;
        const slotsNode = findChildNode(val, ['slots']);
        if (slotsNode && slotsNode.children) {
            const sList = slotsNode.children.find(c => c.constructor.name === 'OdinList');
            if (sList && sList.elements && sList.elements.length > 0) {
                const s0 = sList.elements[0].value || sList.elements[0];
                const idNode = findChildNode(s0, ['id', 'ID']);
                if (idNode) idNode.value = Number(furnitureID);
                const vNode = findChildNode(s0, ['verify', 'verificationID']);
                if (vNode) vNode.value = calcVerificationId(Number(furnitureID)) >>> 0;
            }
        }
        
        // Also unset 'read' and 'opened' to make it a new letter
        const readNode = findChildNode(val, ['read', 'Read']);
        if (readNode) readNode.value = false;
        
        return { success: true };
    }


    setLetterClaimedRewards(letterIndex, claimedArrayOrFalse) {
        const lettersNode = findChildNode(this.getLetterSave(), ['letters', 'Letters']);
        if (!lettersNode || !lettersNode.children) return false;
        
        const listNode = lettersNode.children.find(c => c.constructor.name === 'OdinList');
        if (!listNode || !listNode.elements) return false;
        
        const elements = resolveListElements(listNode);
        if (!elements || letterIndex >= elements.length) return false;
        
        const el = elements[letterIndex];
        const val = el.value || el;
        
        const claimedRewardsNode = findChildRecursive(val, ['claimedRewards', 'ClaimedRewards']);
        if (claimedRewardsNode && claimedRewardsNode.children) {
            const cList = claimedRewardsNode.children.find(c => c.constructor.name === 'OdinList');
            if (cList && cList.elements) {
                cList.elements.forEach((e, idx) => {
                    const bNode = e.value || e;
                    if (claimedArrayOrFalse === false) {
                        bNode.value = false;
                    } else if (Array.isArray(claimedArrayOrFalse)) {
                        bNode.value = !!claimedArrayOrFalse[idx];
                    }
                });
                return true;
            }
        }
        return false;
    }

    markLetterUnclaimed(letterIndex) {
        this.setLetterClaimedRewards(letterIndex, false);
        this.setLetterRead(letterIndex, false);
        
        const lettersNode = findChildNode(this.getLetterSave(), ['letters', 'Letters']);
        if (!lettersNode || !lettersNode.children) return false;
        const listNode = lettersNode.children.find(c => c.constructor.name === 'OdinList');
        if (!listNode || !listNode.elements) return false;
        const elements = resolveListElements(listNode);
        if (elements && letterIndex < elements.length) {
            const el = elements[letterIndex];
            const val = el.value || el;
            const openedNode = findChildRecursive(val, ['opened', 'Opened']);
            if (openedNode) openedNode.value = false;
        }
        return true;
    }

    cloneFurnitureOrder({ furnitureID }) {
        if (!this.ast) return { error: 'no_template' };
        const allOrdersNodes = [];
        const findOrders = (node) => {
            if (node.name === 'orders') allOrdersNodes.push(node);
            if (node.children) node.children.forEach(findOrders);
            if (node.elements) node.elements.forEach(e => findOrders(e.value || e));
        };
        findOrders(this.ast);
        
        let ordersNode = null;
        for (const n of allOrdersNodes) {
            if (n.children && n.children.some(c => c.constructor.name === 'OdinList')) {
                ordersNode = n;
                break;
            }
        }
        if (!ordersNode || !ordersNode.children) return { error: 'no_template' };
        
        const listNode = ordersNode.children.find(c => c.constructor.name === 'OdinList');
        if (!listNode || !listNode.elements || listNode.elements.length === 0) return { error: 'no_template' };
        
        const template = listNode.elements[0];
        const newEl = cloneOdinTree(template);
        
        const assignNewNodeIds = (n) => {
            if (!n) return;
            if (n.nodeId !== undefined) {
                n.nodeId = Math.floor(Math.random() * 100000000) + 100000000;
            }
            if (n.children) n.children.forEach(assignNewNodeIds);
            if (n.elements) {
                n.elements.forEach(e => {
                    assignNewNodeIds(e.value || e);
                    assignNewNodeIds(e.key);
                });
            }
        };
        assignNewNodeIds(newEl.value || newEl);
        
        listNode.elements.push(newEl);
        
        const val = newEl.value || newEl;
        
        const newOrderID = Math.floor(Date.now() / 1000) >>> 0;
        const orderIDNode = findChildRecursive(val, ['orderID']);
        if (orderIDNode) orderIDNode.value = newOrderID;
        
        const furnitureIDNode = findChildRecursive(val, ['furnitureID']);
        if (furnitureIDNode) furnitureIDNode.value = Number(furnitureID);
        
        // orderDate could be set to now, but leaving as is (template's) is usually fine.
        const letterCreatedNode = findChildRecursive(val, ['letterCreated']);
        if (letterCreatedNode) letterCreatedNode.value = false; // So the game creates the letter organically if needed
        
        return { success: true, orderID: newOrderID, furnitureID };
    }

    getLetters() {
        const ls = this.getLetterSave();
        if (!ls) return [];
        const lettersNode = findChildNode(ls, ['letters', 'Letters']);
        if (!lettersNode || !lettersNode.children) return [];
        
        const listNode = lettersNode.children.find(c => c.constructor.name === 'OdinList');
        if (!listNode) return [];
        
        const elements = resolveListElements(listNode);
        if (!elements || elements.length === 0) return [];
        
        const results = [];
        elements.forEach((el, index) => {
            const val = el.value || el;
            if (!val || !val.children) return;
            
            const tn = val.typeName || val.className || 'unknown';
            const readNode = findChildRecursive(val, ['read', 'Read']);
            const carrotRewardNode = findChildRecursive(val, ['carrotReward', 'CarrotReward']);
            const orderIDNode = findChildRecursive(val, ['orderID', 'OrderID']);
            const deliveryVariantNode = findChildRecursive(val, ['deliveryVariant', 'DeliveryVariant']);
            
            const slotsToClaimNode = findChildRecursive(val, ['slotsToClaim', 'SlotsToClaim', 'slots']);
            const slots = [];
            if (slotsToClaimNode && slotsToClaimNode.children) {
                const sList = slotsToClaimNode.children.find(c => c.constructor.name === 'OdinList');
                if (sList) {
                    const sElements = resolveListElements(sList);
                    if (sElements) {
                        sElements.forEach((sel, sIdx) => {
                        const sVal = sel.value || sel;
                        if (!sVal || !sVal.children) return;
                        const idNode = findChildRecursive(sVal, ['ID', 'id', 'Id']);
                        const qtyNode = findChildRecursive(sVal, ['quantity', 'Quantity']);
                        const verifyNode = findChildRecursive(sVal, ['verificationID', 'VerificationID']);
                        if (idNode) {
                            slots.push({
                                index: sIdx,
                                id: idNode.value,
                                qty: qtyNode ? qtyNode.value : 1,
                                verificationID: verifyNode ? verifyNode.value : 0,
                                idNode,
                                qtyNode,
                                verifyNode
                            });
                        }
                    });
                    }
                }
            }
            
            const claimedRewardsNode = findChildRecursive(val, ['claimedRewards', 'ClaimedRewards']);
            const claimedRewards = [];
            if (claimedRewardsNode && claimedRewardsNode.children) {
                const cList = claimedRewardsNode.children.find(c => c.constructor.name === 'OdinList');
                if (cList) {
                    const cElements = resolveListElements(cList);
                    if (cElements) {
                        cElements.forEach(c => claimedRewards.push(c.value));
                    }
                }
            }
            
            results.push({
                index,
                type: tn,
                read: readNode ? readNode.value : false,
                carrotReward: carrotRewardNode ? carrotRewardNode.value : 0,
                orderID: orderIDNode ? orderIDNode.value : undefined,
                deliveryVariant: deliveryVariantNode ? deliveryVariantNode.value : undefined,
                slots,
                claimedRewards,
                nodes: {
                    main: val,
                    readNode,
                    orderIDNode
                }
            });
        });
        
        return results;
    }

    setLetterRead(letterIndex, read) {
        const letters = this.getLetters();
        const idx = Number(letterIndex);
        if (letters[idx] && letters[idx].nodes.readNode) {
            letters[idx].nodes.readNode.value = !!read;
            return true;
        }
        return false;
    }

    setLetterSlotItemId(letterIndex, slotIndex, newFurnitureId) {
        const letters = this.getLetters();
        const idx = Number(letterIndex);
        const sIdx = Number(slotIndex);
        const letter = letters[idx];
        if (letter && letter.slots[sIdx]) {
            const slot = letter.slots[sIdx];
            if (slot.idNode) {
                slot.idNode.value = Number(newFurnitureId);
                if (slot.verifyNode) {
                    slot.verifyNode.value = calcVerificationId(newFurnitureId) >>> 0;
                }
                return true;
            }
        }
        return false;
    }

    getFurnitureOrders() {
        if (!this.ast) return [];
        // Must find `orders` that is a list (to ignore `ordersMade`)
        const allOrdersNodes = [];
        const findOrders = (node) => {
            if (node.name === 'orders') allOrdersNodes.push(node);
            if (node.children) node.children.forEach(findOrders);
            if (node.elements) node.elements.forEach(el => findOrders(el.value || el));
        };
        findOrders(this.ast);
        
        let ordersNode = null;
        for (const n of allOrdersNodes) {
            if (n.children && n.children.some(c => c.constructor.name === 'OdinList')) {
                ordersNode = n;
                break;
            }
        }
        
        if (!ordersNode || !ordersNode.children) return [];
        
        const listNode = ordersNode.children.find(c => c.constructor.name === 'OdinList');
        if (!listNode) return [];
        
        const elements = resolveListElements(listNode);
        if (!elements || elements.length === 0) return [];
        
        const results = [];
        elements.forEach((el, index) => {
            const val = el.value || el;
            if (!val || !val.children) return;
            
            const orderIDNode = findChildRecursive(val, ['orderID']);
            const furnitureIDNode = findChildRecursive(val, ['furnitureID']);
            const orderDateNode = findChildRecursive(val, ['orderDate']);
            const deliveryTimeframeNode = findChildRecursive(val, ['deliveryTimeframe']);
            const letterCreatedNode = findChildRecursive(val, ['letterCreated']);
            
            if (orderIDNode && furnitureIDNode) {
                results.push({
                    index,
                    orderID: orderIDNode.value,
                    furnitureID: furnitureIDNode.value,
                    orderDate: orderDateNode ? orderDateNode.value : 0,
                    deliveryTimeframe: deliveryTimeframeNode ? deliveryTimeframeNode.value : 0,
                    letterCreated: letterCreatedNode ? letterCreatedNode.value : false,
                    nodes: {
                        furnitureIDNode,
                        letterCreatedNode
                    }
                });
            }
        });
        
        return results;
    }

    setOrderFurnitureId(orderIndex, newFurnitureId) {
        const orders = this.getFurnitureOrders();
        const idx = Number(orderIndex);
        const order = orders[idx];
        if (order && order.nodes.furnitureIDNode) {
            order.nodes.furnitureIDNode.value = Number(newFurnitureId);
            
            // Sync with letter if it exists
            const letters = this.getLetters();
            const letter = letters.find(l => Number(l.orderID) === Number(order.orderID));
            if (letter && letter.slots.length > 0) {
                this.setLetterSlotItemId(letter.index, 0, newFurnitureId);
            }
            return true;
        }
        return false;
    }

    // --- Village Events ---
    getVillageEventState() {
        if (!this.ast) return { present: false, all: [] };
        
        const eventSavesNode = findChildRecursive(this.ast, ['eventSaves']);
        if (!eventSavesNode || !eventSavesNode.children) return { present: false, all: [] };
        
        const listNode = eventSavesNode.children.find(c => c.constructor.name === 'OdinList');
        if (!listNode) return { present: false, all: [] };
        
        const elements = resolveListElements(listNode);
        if (!elements || elements.length === 0) return { present: false, all: [] };
        
        const allEvents = [];
        elements.forEach((el, index) => {
            const vNode = el.value || el;
            if (!vNode || !vNode.children) return;
            
            const eventIDNode = findChildRecursive(vNode, ['eventID', 'EventID']);
            const yearNode = findChildRecursive(vNode, ['year', 'Year']);
            const tasksNode = findChildRecursive(vNode, ['tasksCompleted', 'TasksCompleted']);
            const rewardsNode = findChildRecursive(vNode, ['rewardsClaimed', 'RewardsClaimed']);
            const flyerNode = findChildRecursive(vNode, ['shownFlyer', 'ShownFlyer', 'flyerSeen']);
            const calendarNode = findChildRecursive(vNode, ['shownCalendar', 'ShownCalendar', 'calendarSeen']);
            
            // For tasksCompleted (List<int>)
            let tasksList = [];
            if (tasksNode && tasksNode.children) {
                const tList = tasksNode.children.find(c => c.constructor.name === 'OdinList');
                if (tList) {
                    const tElements = resolveListElements(tList);
                    if (tElements) {
                        tasksList = tElements.map(e => e.value);
                    }
                }
            }
            
            // For rewardsClaimed (bool[])
            let rewardsParsed = [];
            if (rewardsNode && rewardsNode.children) {
                const rList = rewardsNode.children.find(c => c.constructor.name === 'OdinList');
                if (rList) {
                    const rElements = resolveListElements(rList);
                    if (rElements) {
                        rewardsParsed = rElements.map(e => e.value);
                    }
                }
            }
            
            allEvents.push({
                index,
                eventID: eventIDNode ? eventIDNode.value : null,
                year: yearNode ? yearNode.value : 0,
                tasksCompletedList: tasksList,
                rewardsClaimed: rewardsParsed,
                shownFlyer: flyerNode ? !!flyerNode.value : false,
                shownCalendar: calendarNode ? !!calendarNode.value : false,
                nodes: {
                    main: vNode,
                    eventIDNode,
                    yearNode,
                    tasksNode,
                    rewardsNode,
                    flyerNode,
                    calendarNode
                }
            });
        });
        
        if (allEvents.length === 0) return { present: false, all: [] };
        
        // Active event is usually the one with the highest year/eventID or just the last one
        allEvents.sort((a, b) => {
            if (a.year !== b.year) return b.year - a.year;
            return b.eventID - a.eventID;
        });
        
        const active = allEvents[0];
        
        return {
            present: true,
            all: allEvents,
            eventID: active.eventID,
            year: active.year,
            tasksCompleted: active.tasksCompletedList.length,
            rewardsClaimed: active.rewardsClaimed,
            shownFlyer: active.shownFlyer,
            shownCalendar: active.shownCalendar,
            activeNodeIndex: active.index,
            nodes: active.nodes
        };
    }

    setVillageEventField(fieldKey, value, eventIndex = -1) {
        const state = this.getVillageEventState();
        if (!state.present) return false;
        
        let targetEvent = null;
        if (eventIndex >= 0) {
            targetEvent = state.all.find(e => e.index === eventIndex);
        } else {
            targetEvent = state.all.find(e => e.index === state.activeNodeIndex);
        }
        
        if (!targetEvent) return false;
        
        if (fieldKey === 'tasksCompleted') {
            const numTasks = Number(value);
            const tasksNode = targetEvent.nodes.tasksNode;
            if (tasksNode && tasksNode.children) {
                const tList = tasksNode.children.find(c => c.constructor.name === 'OdinList');
                if (tList) {
                    tList.elements = [];
                    for (let i = 0; i < numTasks; i++) {
                        tList.elements.push(new OdinPrimitive(0x17, '', i));
                    }
                    return true;
                }
            }
            return false;
        }
        
        let targetNode = null;
        switch (fieldKey) {
            case 'eventID': targetNode = targetEvent.nodes.eventIDNode; break;
            case 'year': targetNode = targetEvent.nodes.yearNode; break;
            case 'shownFlyer': targetNode = targetEvent.nodes.flyerNode; break;
            case 'shownCalendar': targetNode = targetEvent.nodes.calendarNode; break;
        }
        
        if (targetNode) {
            targetNode.value = (fieldKey === 'shownFlyer' || fieldKey === 'shownCalendar') ? !!value : Number(value);
            return true;
        }
        return false;
    }


    // --- Partial JSON Export/Import ---
    exportPartialJSON(sections) {
        const out = {
            format: "TsukiEditorPartial",
            version: 1,
            exportedAt: new Date().toISOString()
        };

        if (sections.inventory) {
            if (!this.inventory || !this.inventory.length) this.parseInventory();
            out.inventory = this.inventory
                .filter(i => i.item_id > 0)
                .map(i => {
                    let vid = 0;
                    if (i.slotNode && i.slotNode.children) {
                        const vidNode = i.slotNode.children.find(c => c.name === 'verificationID' || c.name === 'verify');
                        if (vidNode) vid = vidNode.value;
                    }
                    return {
                        id: i.item_id,
                        qty: i.qty,
                        invType: i.invType,
                        verificationID: vid
                    };
                });
        }

        if (sections.farm) {
            if (!this.placements || !this.placements.length) this.parseMap();
            const crops = [];
            this.placements.forEach(p => {
                const isCrop = (typeof SEED_IDS !== 'undefined' && SEED_IDS.has(p.item_id)) || p.planted_id !== undefined || (p.furnNode && p.furnNode.typeName && p.furnNode.typeName.includes('CropSave'));
                
                if (isCrop && p.placementID !== undefined) {
                    const cInfo = this.getCropSaveFields(p);
                    crops.push({
                        placementID: p.placementID,
                        item_id: p.item_id,
                        parentPlacementID: p.parentPlacementID || 0,
                        grid: p.grid ? { x: p.grid.x, y: p.grid.y } : { x: 0, y: 0 },
                        harvestTimeOA: cInfo.harvestTimeNode ? cInfo.harvestTimeNode.value : 0,
                        ripe: cInfo.ripeNode ? cInfo.ripeNode.value : false,
                        orientation: p.orientation || 0
                    });
                }
            });
            out.farm = { crops };
        }

        if (sections.phone) {
            out.phone = {};
            const cos = this.getPhoneCosmetics();
            if (cos) {
                out.phone.cosmetics = {
                    skinID: cos.skinID,
                    bgPatternID: cos.bgPatternID,
                    bgColorID: cos.bgColorID,
                    backgroundsUnlocked: cos.backgroundsUnlocked,
                    colorsUnlocked: cos.colorsUnlocked
                };
            }
            
            const punch = this.getPunchcardState();
            if (punch) {
                out.phone.punchcard = {
                    claimedCount: punch.claimedCount,
                    rewards: punch.rewards.map(r => ({ index: r.index, claimed: r.claimed, isWeekly: r.isWeekly })),
                    weeklyFurnID: punch.rewards.find(r => r.isWeekly && r.index === 6)?.furnID || 0
                };
            }
            
            const locs = this.getLocationsOnPhone();
            if (locs) {
                out.phone.locationsOnPhone = locs.map(l => ({ id: l.id, seen: l.seen }));
            }
        }

        return out;
    }

    applyPartialJSON(data, sections = { inventory: true, farm: true, phone: true }) {
        if (!data || data.format !== "TsukiEditorPartial") throw new Error("Formato JSON inválido");
        
        let report = { applied: 0, skipped: [] };

        // 1. Inventory
        if (data.inventory && sections.inventory) {
            if (!this.inventory || !this.inventory.length) this.parseInventory();
            data.inventory.forEach(item => {
                const existingIndex = this.inventory.findIndex(inv => Number(inv.item_id) === Number(item.id));
                if (existingIndex !== -1) {
                    const existing = this.inventory[existingIndex];
                    const newQty = existing.qty + item.qty;
                    this.updateInventoryItem(item.invType === 0 ? 'hiddenInventory' : 'inventory', existingIndex, item.id, newQty, item.invType ?? existing.invType);
                    report.applied++;
                } else {
                    const ok = this.injectInventoryItem(item.id, item.qty, item.invType === 0);
                    if (ok) report.applied++;
                    else report.skipped.push(`Item ${item.id} (No inyectable)`);
                }
            });
        }

        // 2. Farm
        if (data.farm && data.farm.crops && sections.farm) {
            if (!this.placements || !this.placements.length) this.parseMap();
            data.farm.crops.forEach(cData => {
                const p = this.placements.find(pl => Number(pl.placementID) === Number(cData.placementID));
                if (p) {
                    let changed = false;
                    const cInfo = this.getCropSaveFields(p);
                    
                    if (cInfo.harvestTimeNode) {
                        cInfo.harvestTimeNode.value = cData.harvestTimeOA;
                        changed = true;
                    }
                    if (cInfo.ripeNode) {
                        cInfo.ripeNode.value = cData.ripe;
                        changed = true;
                    }
                    if (changed) report.applied++;
                    else report.skipped.push(`Crop ${cData.placementID} (nodos no editables)`);
                } else {
                    report.skipped.push(`Crop ${cData.placementID} (no encontrado)`);
                }
            });
        }

        // 3. Phone
        if (data.phone && sections.phone) {
            if (data.phone.cosmetics) {
                const c = data.phone.cosmetics;
                if (c.skinID !== undefined) this.setPhoneCosmeticField('skinID', c.skinID);
                if (c.bgPatternID !== undefined) this.setPhoneCosmeticField('bgPatternID', c.bgPatternID);
                if (c.bgColorID !== undefined) this.setPhoneCosmeticField('bgColorID', c.bgColorID);
                report.applied++;
            }
            if (data.phone.punchcard) {
                const p = data.phone.punchcard;
                if (p.rewards) {
                    p.rewards.forEach(r => {
                        this.setPunchcardSlot(r.index, r.claimed, r.isWeekly);
                    });
                }
                if (p.weeklyFurnID !== undefined) {
                    this.setWeeklyRewardFurnId(p.weeklyFurnID);
                }
                report.applied++;
            }
            if (data.phone.locationsOnPhone) {
                data.phone.locationsOnPhone.forEach(l => {
                    this.setLocationUnlocked(l.id, l.seen);
                });
                report.applied++;
            }
        }

        return report;
    }

    _removeNodeByName(astNode, targetName) {
        if (!astNode) return false;
        let removed = false;
        const t = targetName.toLowerCase();
        if (astNode.children) {
            const idx = astNode.children.findIndex(c => c.name && c.name.toLowerCase() === t);
            if (idx !== -1) {
                astNode.children.splice(idx, 1);
                removed = true;
            } else {
                for (const c of astNode.children) {
                    if (this._removeNodeByName(c, targetName)) removed = true;
                }
            }
        }
        if (astNode.elements) {
            for (const el of astNode.elements) {
                if (el.key && this._removeNodeByName(el.key, targetName)) removed = true;
                if (el.value && this._removeNodeByName(el.value, targetName)) removed = true;
            }
        }
        return removed;
    }

    applyCitySpawnTemplate() {
        if (!this.ast) return false;

        let locs = this._findNodesInAST('location');
        for (const l of locs) {
            if (typeof l.value === 'number') {
                l.value = 2; // City
                break;
            } else if (typeof l.value === 'bigint') {
                l.value = 2n;
                break;
            }
        }

        this._removeNodeByName(this.ast, 'trip');

        const createCityActivity = () => {
            const act = new OdinNode(1, 'activity', 7, 'FurnitureBoundActivitySave, Odyssey', Math.floor(Math.random() * 100000000) + 100000000);
            act.children = [
                new OdinPrimitive(23, 'ActivityID', 29),
                new OdinPrimitive(23, 'NpcID', -1),
                new OdinPrimitive(33, 'ActivityStart', 46249.0561),
                new OdinPrimitive(43, 'Valid', true),
                new OdinPrimitive(43, 'Seen', true),
                new OdinPrimitive(23, 'Pester', 0)
            ];
            
            const ptr = new OdinNode(3, 'placementPointer', 8, 'FurniturePlacementPointer, Odyssey', null);
            ptr.children = [];
            
            const cID = new OdinNode(1, 'containerID', 4, 'SLocationID, Odyssey', Math.floor(Math.random() * 100000000) + 100000000);
            cID.children = [
                new OdinPrimitive(23, 'sublocationID', 19),
                new OdinPrimitive(23, 'localLocationID', 0)
            ];
            
            ptr.children.push(cID);
            ptr.children.push(new OdinPrimitive(23, 'placementID', 1003104930));
            
            act.children.push(ptr);
            return act;
        };

        let replaced = false;
        const replaceActivity = (n) => {
            if (!n) return;
            if (n.children) {
                const idx = n.children.findIndex(c => c.name && c.name.toLowerCase() === 'activity');
                if (idx !== -1) {
                    n.children[idx] = createCityActivity();
                    replaced = true;
                } else {
                    n.children.forEach(replaceActivity);
                }
            }
        };
        replaceActivity(this.ast);

        if (!replaced && this.ast.children) {
            this.ast.children.push(createCityActivity());
        }
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
