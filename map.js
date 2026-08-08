// ────────────────────────────────────────────────────────────────
// map.js — Isometric 3D Map renderer for Tsuki's Odyssey Save Editor
// ────────────────────────────────────────────────────────────────

// Known sublocation cluster → friendly name
// Cluster IDs come from the order the parser discovers groups of placements.
// The real sublocationSave keys are Int32s; until we fully walk that dict,
// we map location IDs to standard generic names since they can vary.
const SUBLOC_NAMES = {
    0:  "🏡 Tsuki's Treehouse",
    1:  "🚂 Train Station",
    2:  "🦒 Chi's House",
    3:  "🐢 Moca's House",
    4:  "🏪 Yori's General Store",
    5:  "🧜‍♀️ Mermaid Coast",
    6:  "🥕 Tsuki's Farm",
    7:  "🏛️ Town Hall",
    8:  "🍜 Bobo's Ramen Restaurant",
    9:  "🍵 Momo's Tea House",
    10: "🌻 Rosemary's Plant Shop",
    11: "🧰 Dawn's Workshop",
    12: "🎷 Scarlett's Lounge"
};

// Furniture IDs considered "ground" / floor layer (rendered below everything)
const GROUND_IDS   = new Set([306, 411]);     // Plot, Soil Hydrator
// Seed / Crop IDs that sit ON TOP of a Plot (FURN_306)
const SEED_IDS     = new Set([342, 345, 1208, 1230, 1231, 1232, 1233, 1237, 1238, 1301]);
// Harvest action ID
const HARVEST_ID   = 900;

// Default sizes for IDs where sizes.json has w:0 (unknown)
const DEFAULT_SIZES = { w: 2, l: 2 }; // Fallback
const PLOT_SIZE     = { w: 2, l: 2 };   // FURN_306 Plot tile

class IsometricMap {
    constructor(canvas, app) {
        this.canvas = canvas;
        this.ctx    = canvas.getContext('2d');
        this.app    = app;

        this.CELL_W = 64;
        this.CELL_H = 32;

        this.offsetX = 0;
        this.offsetY = 0;
        this.scale   = window.innerWidth <= 900 ? 0.6 : 1.0;

        this.isDragging    = false;
        this.isPanDragging = false;
        this.isItemDragging= false;
        this.dragStartX    = 0;
        this.dragStartY    = 0;

        this.selectedPlacement = null;
        this.hoveredPlacement  = null;

        // Image cache: item_id → HTMLImageElement
        this._imgCache = {};

        this.bindEvents();
    }

    // ── Size helpers ──────────────────────────────────────────────────────
    getSize(item_id) {
        if (GROUND_IDS.has(item_id) || SEED_IDS.has(item_id)) return { ...PLOT_SIZE };
        
        // Use the exact sizes extracted from Unity
        if (typeof window.getFurnitureSize === 'function') {
            const s = window.getFurnitureSize(String(item_id));
            if (s && s.width > 0 && s.length > 0) return { w: s.width, l: s.length };
        }
        
        return { ...DEFAULT_SIZES };
    }

    getRotatedSize(item_id, orientation) {
        const { w, l } = this.getSize(item_id);
        if (orientation === 1 || orientation === 3) return { w: l, l: w };
        return { w, l };
    }

    getImage(item_id, orientation) {
        // 0: SE (Front Right)
        // 1: SW (Front Left)
        // 2: NW (Back Left)
        // 3: NE (Back Right)
        const isBack = orientation === 2 || orientation === 3;
        const frontKey = `${item_id}`;
        const backKey = `${item_id}_BACK`;
        
        const cacheKey = isBack ? backKey : frontKey;
        
        if (this._imgCache[cacheKey] !== undefined) {
            return this._imgCache[cacheKey];
        }

        this._imgCache[cacheKey] = false;
        
        const loadImg = (keyToLoad, fallbackCb) => {
            const img = new Image();
            img.onload = () => { this._imgCache[cacheKey] = img; this.draw(); };
            img.onerror = () => {
                const img2 = new Image();
                img2.onload = () => { this._imgCache[cacheKey] = img2; this.draw(); };
                img2.onerror = fallbackCb;
                img2.src = `images/items/FURN_${keyToLoad}.png?v=5`;
            };
            img.src = `images/items/FURN_${keyToLoad}_0.png?v=5`;
        };

        if (isBack) {
            // Try loading back image, if it fails, load front image instead
            loadImg(backKey, () => {
                // Back image failed completely, fallback to front image
                // The draw logic will apply the darken filter for orientation 2/3
                loadImg(frontKey, () => {
                    this._imgCache[cacheKey] = null;
                    this.draw();
                });
            });
        } else {
            // Normal front load
            loadImg(frontKey, () => {
                this._imgCache[cacheKey] = null;
                this.draw();
            });
        }
        
        return false;
    }

    // ─── Coordinate transforms ───────────────────────────────────────────────
    getIsoCoords(x, y) {
        const isoX = (x - y) * (this.CELL_W / 2);
        const isoY = -(x + y) * (this.CELL_H / 2); // Negative so it goes UP the screen
        return {
            x: isoX * this.scale + this.offsetX,
            y: isoY * this.scale + this.offsetY,
        };
    }

    getCartesianCoords(screenX, screenY) {
        const isoX = (screenX - this.offsetX) / this.scale;
        const isoY = (screenY - this.offsetY) / this.scale;
        const u = isoX / (this.CELL_W / 2);
        const v = -isoY / (this.CELL_H / 2); // Added negative for bottom origin
        return { x: (u + v) / 2, y: (v - u) / 2 };
    }

    // ── Resize ────────────────────────────────────────────────────────────
    resize() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width  = rect.width;
        this.canvas.height = rect.height;
        // Center camera
        this.offsetX = this.canvas.width  / 2;
        this.offsetY = this.canvas.height * 0.65;
        this.draw();
    }

    // ── Draw ──────────────────────────────────────────────────────────────
    getBackgroundImage(imgName) {
        if (!this._bgCache) this._bgCache = {};
        if (this._bgCache[imgName] !== undefined) return this._bgCache[imgName];
        
        const img = new Image();
        this._bgCache[imgName] = false;
        img.onload = () => { this._bgCache[imgName] = img; this.draw(); };
        img.onerror = () => { this._bgCache[imgName] = null; };
        img.src = `images/all_sprites/${imgName}`;
        return false;
    }

    draw() {
        if (!this.app || !this.app.parser || !this.app.parser.placements) return;

        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const targetFloor = document.getElementById('select-floor')?.value || '0';
        let targetLocStr = document.getElementById('select-location')?.value;
        const targetLoc = targetLocStr !== undefined && targetLocStr !== "" ? parseInt(targetLocStr, 10) : 1;

        // Update location selector label
        this._updateLocationLabel(targetLoc);

        let bgImgName = null;

        // Subtle grid
        ctx.save();
        ctx.globalAlpha = 0.25; 
        for (let x = 0; x < 32; x++) for (let y = 0; y < 32; y++) {
            this._drawDiamondPath(x, y, 1, 1);
            // Mimic the game's placement grid color (bright green)
            ctx.strokeStyle = 'rgba(100, 255, 100, 0.8)';
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }
        ctx.restore();

        // Split items into layers: ground → seeds → regular furniture
        const all = this.app.parser.placements.filter(
            p => p.floor === targetFloor && p.cluster === targetLoc && p.item_id !== -1
        );

        const ground  = all.filter(p => GROUND_IDS.has(p.item_id));
        const seeds   = all.filter(p => SEED_IDS.has(p.item_id) && p.x !== -1 && p.y !== -1);
        const regular = all.filter(p => !GROUND_IDS.has(p.item_id) && !SEED_IDS.has(p.item_id));

        // Z-sort regular furniture by x+y (painter's algorithm)
        regular.sort((a, b) => (b.x + b.y) - (a.x + a.y)); // DESCENDING for bottom origin

        // Draw layers
        for (const p of ground)  this._drawPlacement(p, 'ground');
        for (const p of seeds)   this._drawPlacement(p, 'seed');
        for (const p of regular) this._drawPlacement(p, 'regular');

        // Draw tooltip for hovered item
        if (this.hoveredPlacement) this._drawTooltip(this.hoveredPlacement);

        // Position floating rotation UI for mobile
        const floatUI = document.getElementById('floating-rotation-ui');
        if (floatUI) {
            if (this.selectedPlacement) {
                const p = this.selectedPlacement;
                const dims = this.getRotatedSize(p.item_id, p.orientation);
                
                // Use the center of the item's grid base
                const centerX = p.x + dims.w / 2;
                const centerY = p.y + dims.l / 2;
                
                const screenPt = this.getIsoCoords(centerX, centerY);
                
                floatUI.style.left = `${screenPt.x}px`;
                floatUI.style.top = `${screenPt.y - (40 * this.scale)}px`; // slightly above
                floatUI.classList.remove('hidden');
            } else {
                floatUI.classList.add('hidden');
            }
        }
    }

    _updateLocationLabel(locId) {
        const sel = document.getElementById('select-location');
        if (!sel) return;
        const friendlyName = SUBLOC_NAMES[locId] || `Ubicación ${locId}`;
        // Update the label next to the dropdown
        const label = document.getElementById('location-label');
        if (label) label.textContent = friendlyName;
    }

    _drawPlacement(p, layer) {
        const ctx = this.ctx;
        const { w, l } = this.getRotatedSize(p.item_id, p.orientation);

        const isHovered  = p === this.hoveredPlacement;
        const isSelected = p === this.selectedPlacement;

        // ── Tile fill color ──
        let fillColor;
        if (layer === 'ground') {
            // Dirt/Plot tile — earthy brown with green tint
            fillColor = isSelected ? '#e07b3f' : isHovered ? '#c47a30' : '#8B6914';
        } else if (layer === 'seed') {
            // Seed/Crop on top — green
            fillColor = isSelected ? '#66bb6a' : isHovered ? '#81c784' : '#4caf50';
        } else {
            // Regular furniture
            fillColor = isSelected ? '#ef4444' : isHovered ? '#f97316' : '#4A90D9';
        }

        // Draw tile shadow first
        ctx.save();
        ctx.globalAlpha = 0.25;
        this._drawDiamondPath(p.x + 0.1, p.y + 0.1, w, l, 1.5);
        ctx.fillStyle = '#000';
        ctx.fill();
        ctx.restore();

        // Draw tile base
        this._drawDiamondPath(p.x, p.y, w, l, layer === 'ground' ? 0 : 2);
        ctx.fillStyle   = fillColor;
        ctx.strokeStyle = isSelected ? '#ff2222' : isHovered ? '#ffaa00' : 'rgba(0,0,0,0.4)';
        ctx.lineWidth   = isSelected ? 2.5 : 1.5;
        ctx.fill();
        ctx.stroke();

        // ── Dirt texture pattern for ground tiles ──
        if (layer === 'ground') {
            this._drawDirtTexture(p.x, p.y, w, l);
        }

        // ── Try to draw item image ──
        // Force loading of base image or back variant based on orientation. We'll handle mirroring via Canvas.
        const img = this.getImage(p.item_id, p.orientation);
        if (img) {
            this._drawSpriteOnTile(img, p.x, p.y, w, l, p.orientation, p.item_id);
        } else {
            // Fallback: draw item ID text or name
            const center = this._tileCenter(p.x, p.y, w, l);
            const name   = this._shortName(p.item_id);
            ctx.save();
            ctx.font      = `bold ${Math.max(7, Math.round(10 * this.scale))}px 'Quicksand', sans-serif`;
            ctx.fillStyle = layer === 'ground' ? '#ffe0b2' : layer === 'seed' ? '#e8f5e9' : '#fff';
            ctx.textAlign    = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowColor = 'rgba(0,0,0,0.7)';
            ctx.shadowBlur  = 3;
            ctx.fillText(name, center.x, center.y);
            ctx.restore();
        }

        // ── Draw planted item if present ──
        if (p.planted_id !== undefined && p.planted_id > 0 && p.planted_id !== 4294967295) {
            // First check if the image is already loaded or can be loaded
            let plantedImg = this.getImage(p.planted_id, 0);
            if (plantedImg) {
                // Draw slightly higher
                this._drawSpriteOnTile(plantedImg, p.x, p.y - 0.5, w, l, 0, p.planted_id);
            } else {
                // Attempt to force a load
                let imgTemp = new Image();
                imgTemp.onload = () => { this.drawMap(); }; // trigger redraw when loaded
                imgTemp.src = 'images/items/FURN_' + p.planted_id + '_0.png?v=5';
                // Try ITEM_ if FURN_ fails
                imgTemp.onerror = () => {
                    if (imgTemp.src.includes('FURN_') && imgTemp.src.includes('_0')) {
                        imgTemp.src = 'images/items/FURN_' + p.planted_id + '.png?v=5';
                    } else if (imgTemp.src.includes('FURN_')) {
                        imgTemp.src = 'images/items/ITEM_' + p.planted_id + '.png?v=5';
                    } else if (imgTemp.src.includes('ITEM_')) {
                        imgTemp.src = 'images/items/CROP_' + p.planted_id + '.png?v=5';
                    } else {
                        imgTemp.onerror = null;
                    }
                };
            }
        }

        // ── Seed label overlay on plot ──
        if (layer === 'seed') {
            const center = this._tileCenter(p.x, p.y, w, l);
            ctx.save();
            ctx.font      = `${Math.max(6, Math.round(8 * this.scale))}px 'Nunito Sans', sans-serif`;
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.shadowColor = 'rgba(0,0,0,0.8)';
            ctx.shadowBlur  = 2;
            ctx.fillText('🌱', center.x, center.y - 8 * this.scale);
            ctx.restore();
        }
    }

    _drawDirtTexture(gx, gy, w, l) {
        // Draw a subtle criss-cross dirt pattern inside the tile
        const ctx = this.ctx;
        const top   = this.getIsoCoords(gx,   gy);
        const right = this.getIsoCoords(gx+w, gy);
        const bot   = this.getIsoCoords(gx+w, gy+l);
        const left  = this.getIsoCoords(gx,   gy+l);

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(top.x, top.y);
        ctx.lineTo(right.x, right.y);
        ctx.lineTo(bot.x, bot.y);
        ctx.lineTo(left.x, left.y);
        ctx.closePath();
        ctx.clip();

        // Diagonal lines
        ctx.strokeStyle = 'rgba(0,0,0,0.15)';
        ctx.lineWidth   = 1;
        const step = 10 * this.scale;
        const cx = (top.x + bot.x) / 2;
        const cy = (top.y + bot.y) / 2;
        const r  = Math.hypot(right.x - left.x, right.y - left.y) * 0.8;
        for (let i = -r; i < r; i += step) {
            ctx.beginPath();
            ctx.moveTo(cx + i - r, cy - r);
            ctx.lineTo(cx + i + r, cy + r);
            ctx.stroke();
        }
        ctx.restore();
    }

    _drawSpriteOnTile(img, gx, gy, w, l, orientation = 0, item_id = null) {
        const ctx = this.ctx;
        const top   = this.getIsoCoords(gx,   gy);
        const right = this.getIsoCoords(gx+w, gy);
        const bot   = this.getIsoCoords(gx+w, gy+l);
        const left  = this.getIsoCoords(gx,   gy+l);

        const cx = (top.x + bot.x) / 2;
        const cy = (top.y + bot.y) / 2;
        
        // Fixed scale factor to map Unity sprite pixels to Canvas pixels.
        // Mathematically 0.8533, but reducing to 0.75 so items fit better visually within the grid bounds.
        const sizeFactor = 0.75 * this.scale;
        const drawW = img.width * sizeFactor;
        const drawH = img.height * sizeFactor;

        ctx.save();
        
        // ── Rotation transformations ──
        // 0: SE (Front Right)
        // 1: SW (Front Left, Mirrored horizontally)
        // 2: NW (Back Left, Mirrored horizontally, darker)
        // 3: NE (Back Right, darker)
        
        const flipH = (orientation === 1 || orientation === 2);
        const darken = (orientation === 2 || orientation === 3);
        
        if (flipH) {
            ctx.translate(cx, 0);
            ctx.scale(-1, 1);
            ctx.translate(-cx, 0);
        }
        
        if (darken) {
            ctx.filter = "brightness(0.75)";
        }


        // Anchor at bot.y (the lowest vertex of the diamond) because in Isometric 2D,
        // the sprite's pivot is usually its lowest physical point touching the floor.
        // Anchor at bot.y (the front-most vertex of the diamond)
        const anchorY = cy;
        
        let pivotX = 0.5;
        let pivotY = 0.15; // default fallback
        
        if (window.spritePivots && window.spritePivots[item_id]) {
            pivotX = window.spritePivots[item_id].x;
            pivotY = window.spritePivots[item_id].y;
        }

        // Unity's pivot Y is from the BOTTOM. Canvas Y is from the TOP.
        // So the distance from the top of the image to the pivot is (1 - pivotY) * drawH
        ctx.drawImage(img,
            cx - (drawW * pivotX),
            anchorY - (drawH * (1 - pivotY)),
            drawW,
            drawH
        );
        
        ctx.restore();
    }

    _drawTooltip(p) {
        const ctx  = this.ctx;
        const { w, l } = this.getRotatedSize(p.item_id, p.orientation);
        const center   = this._tileCenter(p.x, p.y, w, l);

        const name  = this.app.resolveItemName(p.item_id, 1);
        const label = `${name} (ID:${p.item_id}) [${p.x},${p.y}]`;

        ctx.save();
        ctx.font = `bold ${Math.max(11, Math.round(13 * this.scale))}px 'Quicksand', sans-serif`;
        const tw = ctx.measureText(label).width;
        const pad = 8;
        const bx = center.x - tw / 2 - pad;
        const by = center.y - 36 * this.scale;
        const bw = tw + pad * 2;
        const bh = 24;

        // Bubble
        ctx.fillStyle   = 'rgba(30,20,10,0.85)';
        ctx.beginPath();
        ctx.roundRect(bx, by, bw, bh, 6);
        ctx.fill();

        ctx.fillStyle    = '#fff';
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, center.x, by + bh / 2);
        ctx.restore();
    }

    _drawDiamondPath(gx, gy, w, l, shrinkPx = 0) {
        const ctx = this.ctx;
        const top   = this.getIsoCoords(gx,   gy);
        const right = this.getIsoCoords(gx+w, gy);
        const bot   = this.getIsoCoords(gx+w, gy+l);
        const left  = this.getIsoCoords(gx,   gy+l);
        const cx    = (top.x + bot.x) / 2;
        const cy    = (top.y + bot.y) / 2;

        const shrink = shrinkPx * this.scale;
        const lerp = (a, b, t) => a + (b - a) * t;
        const s = shrink === 0 ? 1.0 : 1.0 - shrink / Math.max(1, Math.hypot(top.x - cx, top.y - cy));

        ctx.beginPath();
        ctx.moveTo(lerp(cx, top.x,   s), lerp(cy, top.y,   s));
        ctx.lineTo(lerp(cx, right.x, s), lerp(cy, right.y, s));
        ctx.lineTo(lerp(cx, bot.x,   s), lerp(cy, bot.y,   s));
        ctx.lineTo(lerp(cx, left.x,  s), lerp(cy, left.y,  s));
        ctx.closePath();
    }

    _tileCenter(gx, gy, w, l) {
        const top = this.getIsoCoords(gx,   gy);
        const bot = this.getIsoCoords(gx+w, gy+l);
        return { x: (top.x + bot.x) / 2, y: (top.y + bot.y) / 2 };
    }

    _shortName(item_id) {
        const full = this.app.resolveItemName(item_id, 1);
        if (full.startsWith('#')) return `#${item_id}`;
        // If bilingual (has /), take first part
        const slash = full.indexOf('/');
        const name  = slash !== -1 ? full.substring(0, slash).trim() : full;
        return name.length > 18 ? name.substring(0, 16) + '…' : name;
    }

    // ── Hit detection ─────────────────────────────────────────────────────
    _hitTest(gridX, gridY, targetFloor, targetLoc) {
        return this.app.parser.placements.filter(p => {
            if (p.floor !== targetFloor || p.cluster !== targetLoc || p.item_id === -1) return false;
            const { w, l } = this.getRotatedSize(p.item_id, p.orientation);
            return gridX >= p.x && gridX < p.x + w && gridY >= p.y && gridY < p.y + l;
        });
    }

    // ── Event Binding ─────────────────────────────────────────────────────
    bindEvents() {
        window.addEventListener('keydown', e => {
            if (!this.selectedPlacement) return;
            // Ignore if typing in an input
            if (e.target.tagName === 'INPUT') return;
            
            if (e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'r') {
                this.rotateSelected(1);
                e.preventDefault();
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
                this.rotateSelected(-1);
                e.preventDefault();
            }
        });

        this.canvas.addEventListener('wheel', e => {
            e.preventDefault();
            // If hovering an item and holding shift, rotate it instead of zoom
            if (e.shiftKey && this.hoveredPlacement) {
                this.selectedPlacement = this.hoveredPlacement;
                this.rotateSelected(e.deltaY > 0 ? -1 : 1);
                return;
            }
            
            const factor = e.deltaY > 0 ? 0.9 : 1.1;
            const rect   = this.canvas.getBoundingClientRect();
            const mx = e.clientX - rect.left;
            const my = e.clientY - rect.top;
            this.offsetX = mx - (mx - this.offsetX) * factor;
            this.offsetY = my - (my - this.offsetY) * factor;
            this.scale  *= factor;
            this.draw();
        }, { passive: false });

        this.canvas.addEventListener('mousedown', e => {
            if (e.button === 1 || e.shiftKey || e.button === 2) {
                this.isPanDragging = true;
                this.dragStartX    = e.clientX - this.offsetX;
                this.dragStartY    = e.clientY - this.offsetY;
            } else if (e.button === 0) {
                  if (this.hoveredPlacement) {
                      this.selectedPlacement = this.hoveredPlacement;
                      this.app.openItemEditor(this.selectedPlacement);
                      this.isItemDragging = true;
                      
                      const rect   = this.canvas.getBoundingClientRect();
                      const mouseX = e.clientX - rect.left;
                      const mouseY = e.clientY - rect.top;
                      const cart  = this.getCartesianCoords(mouseX, mouseY);
                      this.dragItemOffsetX = Math.floor(cart.x + 0.5) - this.selectedPlacement.x;
                      this.dragItemOffsetY = Math.floor(cart.y + 0.5) - this.selectedPlacement.y;

                      this.draw();
                } else {
                    this.isPanDragging  = true;
                    this.dragStartX     = e.clientX - this.offsetX;
                    this.dragStartY     = e.clientY - this.offsetY;
                    this.selectedPlacement = null;
                    this.app.closeItemEditor();
                    this.draw();
                }
            }
        });

        this.canvas.addEventListener('mousemove', e => {
            const rect   = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            if (this.isPanDragging) {
                this.offsetX = e.clientX - this.dragStartX;
                this.offsetY = e.clientY - this.dragStartY;
                this.draw();
                return;
            }

            const cart  = this.getCartesianCoords(mouseX, mouseY);
            const gridX = Math.floor(cart.x + 0.5);
            const gridY = Math.floor(cart.y + 0.5);

            if (this.isItemDragging && this.selectedPlacement) {
                const gridX = Math.floor(cart.x + 0.5) - (this.dragItemOffsetX || 0);
                const gridY = Math.floor(cart.y + 0.5) - (this.dragItemOffsetY || 0);

                if (this.selectedPlacement.x !== gridX || this.selectedPlacement.y !== gridY) {
                    try {
                        this.app.parser.applyMapChange(
                            this.selectedPlacement,
                            this.selectedPlacement.item_id, gridX, gridY,
                            this.selectedPlacement.orientation
                        );
                        this.app.editItemX.value = gridX;
                        this.app.editItemY.value = gridY;
                    } catch (err) {
                        console.error('Error applying map change:', err);
                    }
                    this.draw();
                }
                return;
            }

            if (this.app.parser) {
                const targetFloor = document.getElementById('select-floor').value;
                const locVal = document.getElementById('select-location').value;
                const targetLoc = locVal !== "" ? parseInt(locVal, 10) : 1;
                const hits        = this._hitTest(gridX, gridY, targetFloor, targetLoc);

                // Prefer non-ground items for hover
                hits.sort((a, b) => {
                    const az = GROUND_IDS.has(a.item_id) ? 0 : 1;
                    const bz = GROUND_IDS.has(b.item_id) ? 0 : 1;
                    return bz - az;
                });

                const top = hits[0] || null;
                if (this.hoveredPlacement !== top) {
                    this.hoveredPlacement = top;
                    this.draw();
                }
            }
        });

        this.canvas.addEventListener('mouseup', () => {
            this.isPanDragging  = false;
            this.isItemDragging = false;
        });

        this.canvas.addEventListener('mouseleave', () => {
            this.isPanDragging  = false;
            this.isItemDragging = false;
            if (this.hoveredPlacement) { this.hoveredPlacement = null; this.draw(); }
        });

        // Touch support for mobile panning and dragging
        this.canvas.addEventListener('touchstart', e => {
            if (e.touches.length === 1) {
                const touch = e.touches[0];
                const rect = this.canvas.getBoundingClientRect();
                const mouseX = touch.clientX - rect.left;
                const mouseY = touch.clientY - rect.top;

                const cart = this.getCartesianCoords(mouseX, mouseY);
                const gridX = Math.floor(cart.x + 0.5);
                const gridY = Math.floor(cart.y + 0.5);

                const targetFloor = document.getElementById('select-floor').value;
                const locVal = document.getElementById('select-location').value;
                const targetLoc = locVal !== "" ? parseInt(locVal, 10) : 0;
                const hits        = this.app.parser ? this._hitTest(gridX, gridY, targetFloor, targetLoc) : [];

                hits.sort((a, b) => (GROUND_IDS.has(a.item_id) ? 0 : 1) - (GROUND_IDS.has(b.item_id) ? 0 : 1));
                const top = hits[hits.length - 1] || null;

                  if (top) {
                      this.selectedPlacement = top;
                      this.app.openItemEditor(this.selectedPlacement);
                      this.isItemDragging = true;

                      const cart = this.getCartesianCoords(mouseX, mouseY);
                      this.dragItemOffsetX = Math.floor(cart.x + 0.5) - this.selectedPlacement.x;
                      this.dragItemOffsetY = Math.floor(cart.y + 0.5) - this.selectedPlacement.y;

                      this.draw();
                } else {
                    this.isPanDragging  = true;
                    this.dragStartX     = touch.clientX - this.offsetX;
                    this.dragStartY     = touch.clientY - this.offsetY;
                    this.selectedPlacement = null;
                    this.app.closeItemEditor();
                    this.draw();
                }
            } else if (e.touches.length === 2) {
                const t1 = e.touches[0];
                const t2 = e.touches[1];
                this.initialPinchDistance = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
                this.initialPinchScale = this.scale;
                e.preventDefault();
            }
        }, { passive: false });

        this.canvas.addEventListener('touchmove', e => {
            if (e.touches.length === 1) {
                const touch = e.touches[0];
                const rect = this.canvas.getBoundingClientRect();
                const mouseX = touch.clientX - rect.left;
                const mouseY = touch.clientY - rect.top;

                if (this.isPanDragging) {
                    this.offsetX = touch.clientX - this.dragStartX;
                    this.offsetY = touch.clientY - this.dragStartY;
                    this.draw();
                    e.preventDefault();
                    return;
                }

                if (this.isItemDragging && this.selectedPlacement) {
                    const cart = this.getCartesianCoords(mouseX, mouseY);
                    const gridX = Math.floor(cart.x + 0.5) - (this.dragItemOffsetX || 0);
                    const gridY = Math.floor(cart.y + 0.5) - (this.dragItemOffsetY || 0);

                    if (this.selectedPlacement.x !== gridX || this.selectedPlacement.y !== gridY) {
                        try {
                            this.app.parser.applyMapChange(
                                this.selectedPlacement,
                                this.selectedPlacement.item_id, gridX, gridY,
                                this.selectedPlacement.orientation
                            );
                            this.app.editItemX.value = gridX;
                            this.app.editItemY.value = gridY;
                        } catch (err) {
                            console.error('Error applying map change:', err);
                        }
                        this.draw();
                    }
                    e.preventDefault();
                }
            } else if (e.touches.length === 2) {
                const t1 = e.touches[0];
                const t2 = e.touches[1];
                const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
                
                if (this.initialPinchDistance) {
                    const factor = dist / this.initialPinchDistance;
                    let newScale = this.initialPinchScale * factor;
                    newScale = Math.max(0.1, Math.min(newScale, 4.0));
                    
                    if (this.scale !== newScale) {
                        const centerX = (t1.clientX + t2.clientX) / 2;
                        const centerY = (t1.clientY + t2.clientY) / 2;
                        const rect = this.canvas.getBoundingClientRect();
                        const mouseX = centerX - rect.left;
                        const mouseY = centerY - rect.top;

                        const worldX = (mouseX - this.offsetX) / this.scale;
                        const worldY = (mouseY - this.offsetY) / this.scale;

                        this.scale = newScale;

                        this.offsetX = mouseX - (worldX * this.scale);
                        this.offsetY = mouseY - (worldY * this.scale);

                        this.draw();
                    }
                }
                e.preventDefault();
            }
        }, { passive: false });

        this.canvas.addEventListener('touchend', e => {
            if (e.touches.length < 2) {
                this.initialPinchDistance = null;
            }
            if (e.touches.length === 0) {
                this.isPanDragging  = false;
                this.isItemDragging = false;
            }
        });

        // Right-click context menu disabled
        this.canvas.addEventListener('contextmenu', e => e.preventDefault());
    }

    rotateSelected(direction) {
        if (!this.selectedPlacement) return;
        const p = this.selectedPlacement;
        let newOri = (Number(p.orientation) + direction) % 4;
        if (newOri < 0) newOri += 4;
        
        p.orientation = newOri;
        this.app.parser.writeInt32(p.o_off, newOri);
        this.app.openItemEditor(p);
        
        // Force reload from cache if needed
        const key = newOri > 0 ? `${p.item_id}_${newOri}` : String(p.item_id);
        if (this._imgCache[key] === undefined) {
            this.getImage(p.item_id, newOri);
        }
        
        this.draw();
    }
}
