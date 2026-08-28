// csave_io.js
// Capa compartida para carga y guardado de partidas (.csave)
// Diseñada para port web /play y editor actual.
// Solo manipula y exporta los campos de la whitelist (W1).

window.CsaveIO = {
    loadCsave: function(bytes) {
        if (typeof SaveParser === 'undefined' || typeof OdinReader === 'undefined') {
            throw new Error("SaveParser u OdinReader no definidos. Asegurate de cargar parser.js y odin_browser.js antes.");
        }
        const parser = new SaveParser(bytes);
        const reader = new OdinReader(parser.buffer.buffer);
        let ast = reader.parse();
        if (Array.isArray(ast)) ast = ast[0];
        
        parser.ast = ast;
        parser.parseGeneralVars();
        parser.parseInventory();
        parser.parseMap();
        return parser;
    },

    toPortJson: function(parser) {
        const getGenVar = (name, def = 0) => (parser.generalVars && parser.generalVars[name]) ? parser.generalVars[name].value : def;
        const json = {
            format: "TsukiPortDefinitivo",
            carrots: getGenVar('carrots', 0),
            time: {
                day: getGenVar('day', 0),
                month: getGenVar('month', 0),
                season: getGenVar('season', 0),
                hour: getGenVar('hour', 0)
            },
            homecomingUpdates: getGenVar('homecomingUpdates', 0),
            inventory: [],
            mapas: {}
        };

        if (parser.inventory) {
            json.inventory = parser.inventory.filter(item => item.item_id > 0 && item.qty > 0).map(item => {
                let v = item.verificationID || item.verify || 0;
                if (!v && typeof calcVerificationId === 'function') v = calcVerificationId(item.item_id) >>> 0;
                return {
                    id: item.item_id,
                    qty: item.qty,
                    invType: item.invType,
                    verificationID: v
                };
            });
        }

        json.mapas["0"] = {
            placements: [],
            wallpapers: [],
            floors: [],
            currSLocData_exists: false
        };

        if (parser.placements) {
            const loc0 = parser.placements.filter(p => Number(p.cluster) === 0);
            json.mapas["0"].placements = loc0.map(p => ({
                placement_id: p.placementID,
                item_id: p.item_id,
                x: p.x,
                y: p.y,
                rot: p.orientation,
                groupNum: p.floor,
                flipped: p.flipped,
                is_pared: p.isWall
            }));
        }

        if (parser.wallpapers && parser.wallpapers["0"]) {
            json.mapas["0"].wallpapers = parser.wallpapers["0"].map(w => ({
                key: w.key,
                id: w.id
            }));
        }
        if (parser.floors && parser.floors["0"]) {
            json.mapas["0"].floors = parser.floors["0"].map(f => ({
                key: f.key,
                id: f.id
            }));
        }

        const homeNode = parser.getHomeSublocationNode ? parser.getHomeSublocationNode() : null;
        if (homeNode && homeNode.children) {
            if (homeNode.children.find(c => c.name === 'currSLocData')) {
                json.mapas["0"].currSLocData_exists = true; 
            }
        }

        return json;
    },

    applyPortJson: function(parser, json) {
        // Carrots
        if (json.carrots !== undefined) {
            parser.writeGeneralVar('carrots', json.carrots);
        }

        // Time
        if (json.time) {
            if (json.time.day !== undefined) parser.writeGeneralVar('day', json.time.day);
            if (json.time.month !== undefined) parser.writeGeneralVar('month', json.time.month);
            if (json.time.season !== undefined) parser.writeGeneralVar('season', json.time.season);
            if (json.time.hour !== undefined) parser.writeGeneralVar('hour', json.time.hour);
        }

        // Homecoming Updates
        if (json.homecomingUpdates !== undefined) {
            parser.writeGeneralVar('homecomingUpdates', json.homecomingUpdates);
        }

        // Inventory
        if (json.inventory && parser.inventory) {
            // Limpiamos el inventario actual
            for (let i = 0; i < parser.inventory.length; i++) {
                parser.clearInventoryItem('inventory', i);
            }
            // Inyectamos los items de la whitelist
            for (const item of json.inventory) {
                // injectInventoryItem maneja el stack y los slots vacíos
                parser.injectInventoryItem(item.id, item.qty, false, item.invType || 1);
            }
            parser.parseInventory(); // Re-indexar el inventario para asegurar referencias
        }

        // Mapas
        if (json.mapas && json.mapas["0"]) {
            const m = json.mapas["0"];
            
            if (m.wallpapers && parser.setWallpaper) {
                m.wallpapers.forEach(wp => parser.setWallpaper("0", wp.key, wp.id));
            }

            if (m.floors && parser.setFloor) {
                m.floors.forEach(fl => parser.setFloor("0", fl.key, fl.id));
            }

            // Placements W1 approach: apply positions/rotations for existing, or we just rely on `applyMapChange`
            if (m.placements) {
                const homeNode = parser.getHomeSublocationNode ? parser.getHomeSublocationNode() : null;
                if (!homeNode) return;
                
                const furnWrap = homeNode.children.find(c => c.name === 'furniture');
                if (!furnWrap) return;
                const furnList = furnWrap.children.find(c => c.constructor.name === 'OdinList');
                if (!furnList || !furnList.elements) return;

                // Create a map of existing placements by placementID
                const existingNodes = new Map();
                for (const p of parser.placements.filter(p => Number(p.cluster) === 0)) {
                    existingNodes.set(p.placementID, p);
                }

                // Limpiamos la lista AST real
                const newElements = [];
                let pIdCounter = 1000000;

                for (const portP of m.placements) {
                    const pId = portP.placement_id || (pIdCounter++);
                    const existingP = existingNodes.get(pId);
                    
                    if (existingP && existingP.furnNode) {
                        // Mutate existing node
                        parser.applyMapChange(existingP, portP.item_id, portP.x, portP.y, portP.rot);
                        if (portP.is_pared) {
                            parser.setWallPlacementCell(pId, { x: portP.x, y: portP.y, groupNum: portP.groupNum, flipped: portP.flipped });
                        } else {
                            // Non-wall layer
                            const groupPos = existingP.furnNode.children.find(c => c.name === 'groupPosition');
                            if (groupPos && groupPos.children) {
                                const gNumNode = groupPos.children.find(c => c.name === 'groupNum');
                                if (gNumNode) gNumNode.value = portP.groupNum;
                            }
                        }
                        
                        // Encontrar su entry en la lista original
                        const entry = furnList.elements.find(el => el.value === existingP.furnNode);
                        if (entry) newElements.push(entry);

                    } else {
                        // New node needs to be cloned or built.
                        // We take an existing node to clone as a template.
                        let template = furnList.elements.length > 0 ? furnList.elements[0] : null;
                        if (!template && parser.placements.length > 0) {
                            // Find any placement from anywhere just to clone the structure
                            const anyP = parser.placements[0];
                            if (anyP && anyP.furnNode) template = { value: anyP.furnNode };
                        }

                        if (template && typeof window.cloneOdinTree === 'function') {
                            const clonedVal = window.cloneOdinTree(template.value);
                            
                            // Modificamos placementID
                            const pIdNode = clonedVal.children.find(c => c.name === 'placementID');
                            if (pIdNode) pIdNode.value = pId;
                            
                            // Item ID
                            if (portP.is_pared) {
                                const fIdNode = clonedVal.children.find(c => c.name === 'furnitureID');
                                if (fIdNode) fIdNode.value = portP.item_id;
                            } else {
                                const refNode = clonedVal.children.find(c => c.name === 'reference');
                                if (refNode && refNode.children) {
                                    const idNode = refNode.children.find(c => c.name === 'id');
                                    if (idNode) idNode.value = portP.item_id;
                                    const oriNode = refNode.children.find(c => c.name === 'orientation');
                                    if (oriNode) oriNode.value = portP.rot || 0;
                                }
                            }

                            // Posicion
                            const posNode = clonedVal.children.find(c => c.name === 'position');
                            const groupPosNode = clonedVal.children.find(c => c.name === 'groupPosition');
                            if (posNode && posNode.children) {
                                const xv = posNode.children.find(c => c.name === 'x');
                                const yv = posNode.children.find(c => c.name === 'y');
                                if (xv) xv.value = portP.x;
                                if (yv) yv.value = portP.y;
                            }
                            if (groupPosNode && groupPosNode.children) {
                                const hCellNode = groupPosNode.children.find(c => c.name === 'hexCell');
                                if (hCellNode && hCellNode.children) {
                                    const xv = hCellNode.children.find(c => c.name === 'x');
                                    const yv = hCellNode.children.find(c => c.name === 'y');
                                    if (xv) xv.value = portP.x;
                                    if (yv) yv.value = portP.y;
                                }
                                const zNode = groupPosNode.children.find(c => c.name === 'z');
                                if (zNode) zNode.value = portP.flipped ? 1 : 0;
                                const gNumNode = groupPosNode.children.find(c => c.name === 'groupNum');
                                if (gNumNode) gNumNode.value = portP.groupNum || 0;
                            }

                            newElements.push({
                                type: template.type,
                                value: clonedVal
                            });
                        }
                    }
                }
                
                furnList.elements = newElements;
                parser.parseMap(); // Re-index placements
            }
        }
    },

    writeCsave: function(parser) {
        return new Uint8Array(parser.getBuffer());
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.CsaveIO;
}
