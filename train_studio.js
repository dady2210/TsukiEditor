// train_studio.js — Estudio Interactivo de Animación y Elementos del Tren en el Map Editor
(function () {
    'use strict';
    const DIRMAG = 1.118034;
    const APEX_RAW_X = 1818;
    const APEX_RAW_Y = 2372;

    const Studio = {
        mode: 'waiting',      // 'waiting' | 'manual' | 'simulation' | 'clock'
        manualT: 0.5,        // 0.0 .. 1.0
        isPlaying: false,
        playbackSpeed: 0.15,
        lastSimTime: 0,
        showLightsInEditor: true,
        gizmoActive: false,
        isDraggingGizmo: false,
        isCollapsed: false,
        activeTab: 'anim',   // 'anim' | 'lights'
        dragStartMouse: { x: 0, y: 0 },
        dragStartLOff: [0, 0],
        layerVisibility: {
            tren: true,
            luces: true,
            encima: true,
            fondo: true,
        },
        _simRafId: null,

        isActive(locId) {
            const id = Number(locId != null ? locId : this.currentLocation());
            return id === 10 || id === 15;
        },

        currentLocation() {
            const sel = document.getElementById('select-location');
            if (sel && sel.value !== "") return parseInt(sel.value, 10);
            return (window.app && window.app.map && window.app.map.locationId != null)
                ? window.app.map.locationId : 10;
        },

        getConfig(locId) {
            const id = String(locId != null ? locId : this.currentLocation());
            if (!window.TrainLayers) return null;
            if (!window.TrainLayers[id]) {
                window.TrainLayers[id] = {
                    parada: 0.0,
                    recorrido: 60.0,
                    zoom_min: 1.15,
                    luces_offset_px: [0, 0]
                };
            }
            return window.TrainLayers[id];
        },

        getDesplazamiento(locId) {
            const id = locId != null ? locId : this.currentLocation();
            const fallback = { x: 0, y: 0, t: 0.5, tramo: 'parado' };
            const c = this.getConfig(id);
            if (!c) return fallback;

            const isPlayMode = typeof document !== 'undefined' && document.body && document.body.classList.contains('play-mode');
            if (this.mode === 'clock' || (isPlayMode && this.mode === 'waiting')) {
                if (window.Train && typeof window.Train.desplazamiento === 'function') {
                    const d = window.Train.desplazamiento(id);
                    if (d) return d;
                }
            }

            let t = 0.5;
            let tramo = 'parado';

            if (this.mode === 'waiting') {
                t = 0.5;
                tramo = 'parado';
            } else {
                t = Math.min(1, Math.max(0, this.manualT));
                if (t < 0.2) tramo = 'entrando';
                else if (t < 0.8) tramo = 'parado';
                else if (t < 0.99) tramo = 'saliendo';
                else tramo = 'fuera';
            }

            const parada = (typeof c.parada === 'number') ? c.parada : 0.0;
            const recorrido = (typeof c.recorrido === 'number') ? c.recorrido : 60.0;
            const mitad = recorrido / 2;

            let dist = 0;
            if (tramo === 'entrando') {
                const subT = t / 0.2;
                const ease = Math.sin((subT * Math.PI) / 2);
                dist = parada + mitad * (1 - ease);
            } else if (tramo === 'parado') {
                dist = parada;
            } else if (tramo === 'saliendo') {
                const subT = (t - 0.8) / 0.19;
                const ease = subT * subT;
                dist = parada - mitad * ease;
            } else {
                dist = parada - mitad - 15;
            }

            const x = (dist / DIRMAG) * 1.0;
            const y = (dist / DIRMAG) * 0.5;

            return {
                x,
                y,
                t,
                tramo,
                animando: (this.mode === 'simulation' && this.isPlaying)
            };
        },

        getLucesOffset(locId) {
            const c = this.getConfig(locId);
            if (c && Array.isArray(c.luces_offset_px)) return c.luces_offset_px;
            return [0, 0];
        },

        showLights(locId) {
            if (!this.isActive(locId)) return false;
            return this.showLightsInEditor && this.layerVisibility.luces;
        },

        isLayerHidden(name) {
            if (this.layerVisibility[name] !== undefined) {
                return !this.layerVisibility[name];
            }
            return false;
        },

        togglePlay() {
            if (this.isPlaying) {
                this.stopSimulation();
            } else {
                this.startSimulation();
            }
        },

        startSimulation() {
            this.mode = 'simulation';
            this.isPlaying = true;
            this.lastSimTime = performance.now();
            this.tickSimulation();
            this.syncControls();
            if (window.app && window.app.map) window.app.map.draw();
        },

        stopSimulation() {
            this.isPlaying = false;
            if (this._simRafId) {
                cancelAnimationFrame(this._simRafId);
                this._simRafId = null;
            }
            this.syncControls();
        },

        tickSimulation() {
            if (!this.isPlaying || this.mode !== 'simulation') return;
            const now = performance.now();
            const dt = (now - this.lastSimTime) / 1000.0;
            this.lastSimTime = now;

            this.manualT += dt * this.playbackSpeed;
            if (this.manualT > 1.0) this.manualT = 0.0;

            const scrub = document.getElementById('ts-scrubber-range');
            const scrubVal = document.getElementById('ts-scrubber-val');
            const badge = document.getElementById('ts-tramo-badge');
            const off = this.getDesplazamiento() || { x: 0, y: 0, t: 0.5, tramo: 'parado' };
            const tramoNom = (off && off.tramo) ? off.tramo : 'parado';

            if (scrub) scrub.value = this.manualT;
            if (scrubVal) scrubVal.textContent = Math.round(this.manualT * 100) + '% (' + tramoNom + ')';
            if (badge) {
                badge.textContent = tramoNom.toUpperCase();
                badge.style.background = (tramoNom === 'parado') ? '#7a9c6a'
                    : (tramoNom === 'fuera') ? '#999' : '#c2a06a';
            }

            if (window.app && window.app.map) window.app.map.draw();
            try {
                if (window.Lighting) window.Lighting.renderHalos(null, this.currentLocation());
            } catch(e) {}

            this._simRafId = requestAnimationFrame(() => this.tickSimulation());
        },

        getHeadlightBasePx(locId) {
            const id = Number(locId != null ? locId : this.currentLocation());
            if (id === 15) {
                return { x: 30, y: 2289 };
            }
            // Base en píxeles del morro del tren (mapa 10, nivel 9)
            return { x: 2497, y: 1950 };
        },

        // Gizmo en Canvas
        getGizmoScreenPos(locId) {
            const map = window.app && window.app.map;
            if (!map) return null;
            const origin = (map._getMapAnchorPx && map._getMapAnchorPx(locId)) || { x: 1235, y: 1257 };
            const bgScale = (window.atlasConfig && window.atlasConfig.bgScale) || 0.75;
            const s = bgScale * map.scale;
            const dx = map.offsetX - origin.x * s;
            const dy = map.offsetY - origin.y * s;

            const off = this.getDesplazamiento(locId);
            const mx = off && off.tramo !== 'fuera' ? (off.x * 150 * s) : 0;
            const my = off && off.tramo !== 'fuera' ? (off.y * 150 * s) : 0;

            const base = this.getHeadlightBasePx(locId);
            const lOff = this.getLucesOffset(locId);
            const lox = (Number(lOff[0]) || 0) * s;
            const loy = (Number(lOff[1]) || 0) * s;

            return {
                x: dx + mx + (base.x * s) + lox,
                y: dy - my + (base.y * s) + loy,
                s: s
            };
        },

        renderGizmo(ctx, locId) {
            if (!this.isActive(locId) || !this.gizmoActive) return;
            const pos = this.getGizmoScreenPos(locId);
            if (!pos) return;

            ctx.save();
            ctx.setTransform(1, 0, 0, 1, 0, 0);

            // Halo amarillo pulsante
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, 22, 0, Math.PI * 2);
            ctx.fillStyle = this.isDraggingGizmo ? 'rgba(255, 200, 0, 0.45)' : 'rgba(255, 230, 100, 0.25)';
            ctx.fill();
            ctx.lineWidth = 3;
            ctx.strokeStyle = '#ffe600';
            ctx.stroke();

            // Cruz central
            ctx.beginPath();
            ctx.moveTo(pos.x - 14, pos.y);
            ctx.lineTo(pos.x + 14, pos.y);
            ctx.moveTo(pos.x, pos.y - 14);
            ctx.lineTo(pos.x, pos.y + 14);
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#ffffff';
            ctx.stroke();

            // Etiqueta flotante
            ctx.font = 'bold 12px sans-serif';
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = '#000000';
            ctx.shadowBlur = 4;
            ctx.fillText('💡 Faros (' + Math.round(this.getLucesOffset(locId)[0]) + ', ' + Math.round(this.getLucesOffset(locId)[1]) + ')', pos.x + 16, pos.y - 10);

            ctx.restore();
        },

        onMouseDown(e, mouseX, mouseY) {
            if (!this.isActive() || !this.gizmoActive) return false;
            const pos = this.getGizmoScreenPos(this.currentLocation());
            if (!pos) return false;

            const dist = Math.hypot(mouseX - pos.x, mouseY - pos.y);
            if (dist <= 30) {
                this.isDraggingGizmo = true;
                this.dragStartMouse = { x: mouseX, y: mouseY };
                this.dragStartLOff = [...this.getLucesOffset()];
                const map = window.app && window.app.map;
                if (map && map.canvas) map.canvas.style.cursor = 'grabbing';
                return true;
            }
            return false;
        },

        onMouseMove(e, mouseX, mouseY) {
            const map = window.app && window.app.map;
            if (!this.isDraggingGizmo) {
                if (this.isActive() && this.gizmoActive && map && map.canvas) {
                    const pos = this.getGizmoScreenPos(this.currentLocation());
                    if (pos && Math.hypot(mouseX - pos.x, mouseY - pos.y) <= 30) {
                        map.canvas.style.cursor = 'crosshair';
                    }
                }
                return false;
            }
            if (!map) return false;

            const bgScale = (window.atlasConfig && window.atlasConfig.bgScale) || 0.75;
            const s = bgScale * map.scale;

            const dX = (mouseX - this.dragStartMouse.x) / s;
            const dY = (mouseY - this.dragStartMouse.y) / s;

            const cfg = this.getConfig();
            if (cfg) {
                const nx = Math.round(this.dragStartLOff[0] + dX);
                const ny = Math.round(this.dragStartLOff[1] + dY);
                cfg.luces_offset_px = [nx, ny];
                cfg.luces_offset_world = [
                    parseFloat((nx / 150).toFixed(3)),
                    parseFloat((-ny / 150).toFixed(3))
                ];
                this.syncInputsOnly();
                if (map) map.draw();
                try {
                    if (window.Lighting) window.Lighting.renderHalos(null, this.currentLocation());
                } catch(err) {}
            }
            return true;
        },

        onMouseUp() {
            if (this.isDraggingGizmo) {
                this.isDraggingGizmo = false;
                const map = window.app && window.app.map;
                if (map && map.canvas) map.canvas.style.cursor = '';
                this.saveToStorage();
                return true;
            }
            return false;
        },

        saveToStorage() {
            const locId = String(this.currentLocation());
            const cfg = this.getConfig(locId);
            if (!cfg) return;
            const lOff = cfg.luces_offset_px || [0, 0];
            cfg.luces_offset_world = [
                parseFloat((lOff[0] / 150).toFixed(3)),
                parseFloat((-lOff[1] / 150).toFixed(3))
            ];
            const data = {
                parada: cfg.parada,
                recorrido: cfg.recorrido,
                zoom_min: cfg.zoom_min,
                luces_offset_px: cfg.luces_offset_px,
                luces_offset_world: cfg.luces_offset_world
            };
            try {
                localStorage.setItem('tsuki_train_calib_' + locId, JSON.stringify(data));
                if (window.app && window.app.showToast) {
                    window.app.showToast('💾 Calibración guardada en tu navegador', 'success');
                }
            } catch (e) {}
        },

        downloadJson() {
            const layers = window.TrainLayers || {};
            const blob = new Blob([JSON.stringify(layers, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'train_layers.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            if (window.app && window.app.showToast) {
                window.app.showToast('📥 train_layers.json descargado con éxito', 'success');
            }
        },

        copyJson() {
            const locId = String(this.currentLocation());
            const cfg = this.getConfig(locId);
            const snippet = JSON.stringify({ [locId]: cfg }, null, 2);
            navigator.clipboard.writeText(snippet).then(() => {
                if (window.app && window.app.showToast) window.app.showToast('📋 JSON copiado al portapapeles', 'info');
            }).catch(() => {
                prompt('Copia esta configuración para data/maps/train_layers.json:', snippet);
            });
        },

        resetDefaults() {
            const locId = String(this.currentLocation());
            try { localStorage.removeItem('tsuki_train_calib_' + locId); } catch (e) {}
            if (window.app && window.app.showToast) window.app.showToast('Valores restablecidos a predeterminados', 'info');
            location.reload();
        },

        setTab(tab) {
            this.activeTab = tab;
            const tabAnim = document.getElementById('ts-tab-content-anim');
            const tabLights = document.getElementById('ts-tab-content-lights');
            const btnAnim = document.getElementById('ts-tab-btn-anim');
            const btnLights = document.getElementById('ts-tab-btn-lights');

            if (tabAnim) tabAnim.style.display = (tab === 'anim') ? 'block' : 'none';
            if (tabLights) tabLights.style.display = (tab === 'lights') ? 'block' : 'none';

            if (btnAnim) {
                btnAnim.style.background = (tab === 'anim') ? '#8b6b4a' : '#efe7cf';
                btnAnim.style.color = (tab === 'anim') ? '#ffffff' : '#4a3b2a';
            }
            if (btnLights) {
                btnLights.style.background = (tab === 'lights') ? '#8b6b4a' : '#efe7cf';
                btnLights.style.color = (tab === 'lights') ? '#ffffff' : '#4a3b2a';
            }
        },

        toggleCollapse() {
            this.isCollapsed = !this.isCollapsed;
            const body = document.getElementById('ts-panel-body');
            const btn = document.getElementById('ts-btn-collapse');
            if (body) body.style.display = this.isCollapsed ? 'none' : 'block';
            if (btn) btn.textContent = this.isCollapsed ? '➕' : '➖';
        },

        ensureUI() {
            if (document.getElementById('train-studio-panel')) return;

            const mapControls = document.querySelector('#tab-map .map-controls');
            if (!mapControls) return;

            const panel = document.createElement('div');
            panel.id = 'train-studio-panel';
            panel.className = 'rustic-panel-subtle';
            panel.style.cssText = 'margin:8px 0;padding:10px;background:#fefbf4;border:2px solid #8b6b4a;border-radius:10px;box-shadow:0 2px 8px rgba(0,0,0,0.08);width:100%;box-sizing:border-box;max-height:none!important;';

            panel.innerHTML = `
                <!-- Cabecera colapsable -->
                <div style="display:flex;align-items:center;justify-content:space-between;">
                    <div style="display:flex;align-items:center;gap:8px;">
                        <button id="ts-btn-collapse" style="background:none;border:none;cursor:pointer;font-size:1rem;padding:0;line-height:1;" title="Minimizar / Expandir panel">➖</button>
                        <strong style="font-size:0.95rem;color:#4a3b2a;display:flex;align-items:center;gap:6px;">
                            <span>🚂 Estudio de Animación & Faros</span>
                        </strong>
                    </div>
                    <span id="ts-tramo-badge" style="font-size:0.75rem;padding:2px 8px;background:#7a9c6a;color:#fff;border-radius:12px;font-weight:700;">PARADO</span>
                </div>

                <!-- Cuerpo del panel -->
                <div id="ts-panel-body" style="margin-top:8px;">
                    <!-- Pestañas internas -->
                    <div style="display:flex;gap:4px;margin-bottom:8px;">
                        <button id="ts-tab-btn-anim" class="btn-secondary" style="flex:1;padding:4px 6px;font-size:0.78rem;font-weight:700;border-radius:6px;background:#8b6b4a;color:#fff;">🚂 Animación & Vía</button>
                        <button id="ts-tab-btn-lights" class="btn-secondary" style="flex:1;padding:4px 6px;font-size:0.78rem;font-weight:700;border-radius:6px;background:#efe7cf;color:#4a3b2a;">💡 Faros & Capas</button>
                    </div>

                    <!-- TAB 1: Animación & Vía -->
                    <div id="ts-tab-content-anim">
                        <!-- Modos de animación -->
                        <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:4px;margin-bottom:8px;">
                            <button id="ts-btn-mode-waiting" class="btn-secondary" style="padding:4px 2px;font-size:0.75rem;font-weight:600;">⏹️ Parado</button>
                            <button id="ts-btn-mode-manual" class="btn-secondary" style="padding:4px 2px;font-size:0.75rem;font-weight:600;">🎚️ Scrubber</button>
                            <button id="ts-btn-mode-sim" class="btn-secondary" style="padding:4px 2px;font-size:0.75rem;font-weight:600;">▶️ Simular</button>
                            <button id="ts-btn-mode-clock" class="btn-secondary" style="padding:4px 2px;font-size:0.75rem;font-weight:600;">⏱️ Reloj</button>
                        </div>

                        <!-- Scrubber manual -->
                        <div id="ts-scrubber-group" style="background:#efe7cf;padding:6px 8px;border-radius:6px;margin-bottom:8px;">
                            <div style="display:flex;justify-content:space-between;font-size:0.75rem;margin-bottom:2px;color:#555;">
                                <span>Progreso en vía (t):</span>
                                <strong id="ts-scrubber-val">50% (parado)</strong>
                            </div>
                            <input id="ts-scrubber-range" type="range" min="0" max="1" step="0.005" value="0.5" style="width:100%;cursor:pointer;margin:2px 0;" />
                            <div style="display:flex;justify-content:space-between;font-size:0.68rem;color:#777;">
                                <span>0% Entrando</span>
                                <span>50% Andén</span>
                                <span>90% Saliendo</span>
                                <span>100% Fuera</span>
                            </div>
                        </div>

                        <!-- Calibración de Parada en Andén -->
                        <div style="background:#fff8ee;border:1px solid #d4c2a5;border-radius:6px;padding:6px 8px;margin-bottom:8px;">
                            <div style="display:grid;grid-template-columns:80px 1fr 60px;gap:6px;align-items:center;margin-bottom:4px;">
                                <label style="font-size:0.75rem;" title="Posición donde frena el tren frente al andén">Parada:</label>
                                <input id="ts-parada-range" type="range" min="-18" max="10" step="0.05" value="-7.0" style="cursor:pointer;" />
                                <input id="ts-parada-num" type="number" step="0.05" style="width:60px;padding:2px;font-size:0.78rem;" />
                            </div>
                            <div style="display:grid;grid-template-columns:80px 1fr 60px;gap:6px;align-items:center;margin-bottom:4px;">
                                <label style="font-size:0.75rem;" title="Largo completo del recorrido de vía">Recorrido:</label>
                                <input id="ts-recorrido-range" type="range" min="20" max="100" step="0.5" value="60" style="cursor:pointer;" />
                                <input id="ts-recorrido-num" type="number" step="0.5" style="width:60px;padding:2px;font-size:0.78rem;" />
                            </div>
                            <div style="display:grid;grid-template-columns:80px 1fr 60px;gap:6px;align-items:center;">
                                <label style="font-size:0.75rem;" title="Límite de alejamiento de cámara">Zoom Mín:</label>
                                <input id="ts-zoom-range" type="range" min="0.8" max="2.0" step="0.05" value="1.15" style="cursor:pointer;" />
                                <input id="ts-zoom-num" type="number" step="0.05" style="width:60px;padding:2px;font-size:0.78rem;" />
                            </div>
                        </div>
                    </div>

                    <!-- TAB 2: Faros & Capas -->
                    <div id="ts-tab-content-lights" style="display:none;">
                        <div style="background:#fff8ee;border:1px solid #d4c2a5;border-radius:6px;padding:6px 8px;margin-bottom:8px;">
                            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                                <label style="font-size:0.75rem;display:flex;align-items:center;gap:4px;cursor:pointer;font-weight:700;color:#6b5b45;">
                                    <input id="ts-show-lights-chk" type="checkbox" checked /> 💡 Ver Faros en Editor
                                </label>
                                <button id="ts-btn-autocenter" class="btn-secondary" style="padding:2px 8px;font-size:0.72rem;" title="Restablecer posición natural de los faros (0, 0)">
                                    Auto-Calzar
                                </button>
                            </div>

                            <div style="display:grid;grid-template-columns:80px 1fr 60px;gap:6px;align-items:center;margin-bottom:4px;">
                                <label style="font-size:0.75rem;">Desfase X:</label>
                                <input id="ts-faros-x-range" type="range" min="-600" max="600" step="1" value="0" style="cursor:pointer;" />
                                <input id="ts-faros-x-num" type="number" step="1" style="width:60px;padding:2px;font-size:0.78rem;" />
                            </div>
                            <div style="display:grid;grid-template-columns:80px 1fr 60px;gap:6px;align-items:center;margin-bottom:6px;">
                                <label style="font-size:0.75rem;">Desfase Y:</label>
                                <input id="ts-faros-y-range" type="range" min="-600" max="600" step="1" value="0" style="cursor:pointer;" />
                                <input id="ts-faros-y-num" type="number" step="1" style="width:60px;padding:2px;font-size:0.78rem;" />
                            </div>

                            <button id="ts-btn-gizmo" class="btn-secondary" style="width:100%;padding:5px;font-size:0.78rem;font-weight:700;" title="Haz clic sobre la mira amarilla en el mapa y arrastra los faros directamente con el ratón">
                                🎯 Mover con Ratón
                            </button>
                        </div>

                        <!-- Visibilidad de capas -->
                        <div style="background:#efe7cf;padding:6px 8px;border-radius:6px;margin-bottom:8px;font-size:0.75rem;">
                            <div style="font-weight:700;color:#6b5b45;margin-bottom:4px;">👁️ Capas del Nivel:</div>
                            <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;">
                                <label style="cursor:pointer;"><input id="ts-layer-tren" type="checkbox" checked /> 🚂 Tren</label>
                                <label style="cursor:pointer;"><input id="ts-layer-luces" type="checkbox" checked /> 💡 Faros</label>
                                <label style="cursor:pointer;"><input id="ts-layer-encima" type="checkbox" checked /> 🏠 Estación</label>
                                <label style="cursor:pointer;"><input id="ts-layer-fondo" type="checkbox" checked /> 🛤️ Vías / Suelo</label>
                            </div>
                        </div>
                    </div>

                    <!-- Botones de Acción -->
                    <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:4px;">
                        <button id="ts-btn-save" class="btn-primary" style="padding:5px 2px;font-size:0.75rem;font-weight:700;" title="Guarda en localStorage del navegador">💾 Guardar</button>
                        <button id="ts-btn-download" class="btn-secondary" style="padding:5px 2px;font-size:0.75rem;" title="Descargar archivo train_layers.json">📥 JSON</button>
                        <button id="ts-btn-copy" class="btn-secondary" style="padding:5px 2px;font-size:0.75rem;" title="Copiar configuración al portapapeles">📋 Copiar</button>
                        <button id="ts-btn-reset" class="btn-secondary" style="padding:5px 2px;font-size:0.75rem;" title="Restablecer valores iniciales">↺ Reset</button>
                    </div>
                </div>
            `;

            const targetRef = mapControls.querySelector('.farm-actions') || mapControls.firstChild;
            mapControls.insertBefore(panel, targetRef);

            this.bindEvents();
            this.syncVisibility();
            this.syncControls();
        },

        bindEvents() {
            const btnCollapse = document.getElementById('ts-btn-collapse');
            if (btnCollapse) btnCollapse.onclick = () => this.toggleCollapse();

            const btnTabAnim = document.getElementById('ts-tab-btn-anim');
            const btnTabLights = document.getElementById('ts-tab-btn-lights');
            if (btnTabAnim) btnTabAnim.onclick = () => this.setTab('anim');
            if (btnTabLights) btnTabLights.onclick = () => this.setTab('lights');

            const setMode = (m) => {
                this.stopSimulation();
                this.mode = m;
                this.syncControls();
                if (window.app && window.app.map) window.app.map.draw();
                try { if (window.Lighting) window.Lighting.renderHalos(null, this.currentLocation()); } catch(e) {}
            };

            const bWaiting = document.getElementById('ts-btn-mode-waiting');
            const bManual = document.getElementById('ts-btn-mode-manual');
            const bSim = document.getElementById('ts-btn-mode-sim');
            const bClock = document.getElementById('ts-btn-mode-clock');

            if (bWaiting) bWaiting.onclick = () => setMode('waiting');
            if (bManual) bManual.onclick = () => setMode('manual');
            if (bSim) bSim.onclick = () => this.togglePlay();
            if (bClock) bClock.onclick = () => setMode('clock');

            const scrub = document.getElementById('ts-scrubber-range');
            if (scrub) {
                scrub.oninput = () => {
                    this.stopSimulation();
                    this.mode = 'manual';
                    this.manualT = parseFloat(scrub.value) || 0;
                    this.syncControls();
                    if (window.app && window.app.map) window.app.map.draw();
                    try { if (window.Lighting) window.Lighting.renderHalos(null, this.currentLocation()); } catch(e) {}
                };
            }

            const pRange = document.getElementById('ts-parada-range');
            const pNum = document.getElementById('ts-parada-num');
            const syncParada = (val) => {
                const cfg = this.getConfig();
                if (cfg) {
                    cfg.parada = parseFloat(val) || 0;
                    if (pRange) pRange.value = cfg.parada;
                    if (pNum) pNum.value = cfg.parada;
                    if (window.app && window.app.map) window.app.map.draw();
                    try { if (window.Lighting) window.Lighting.renderHalos(null, this.currentLocation()); } catch(e) {}
                }
            };
            if (pRange) pRange.oninput = () => syncParada(pRange.value);
            if (pNum) pNum.oninput = () => syncParada(pNum.value);

            const rRange = document.getElementById('ts-recorrido-range');
            const rNum = document.getElementById('ts-recorrido-num');
            const syncRecorrido = (val) => {
                const cfg = this.getConfig();
                if (cfg) {
                    cfg.recorrido = parseFloat(val) || 60;
                    if (rRange) rRange.value = cfg.recorrido;
                    if (rNum) rNum.value = cfg.recorrido;
                    if (window.app && window.app.map) window.app.map.draw();
                    try { if (window.Lighting) window.Lighting.renderHalos(null, this.currentLocation()); } catch(e) {}
                }
            };
            if (rRange) rRange.oninput = () => syncRecorrido(rRange.value);
            if (rNum) rNum.oninput = () => syncRecorrido(rNum.value);

            const zRange = document.getElementById('ts-zoom-range');
            const zNum = document.getElementById('ts-zoom-num');
            const syncZoom = (val) => {
                const cfg = this.getConfig();
                if (cfg) {
                    cfg.zoom_min = parseFloat(val) || 1.15;
                    if (zRange) zRange.value = cfg.zoom_min;
                    if (zNum) zNum.value = cfg.zoom_min;
                    if (window.app && window.app.map) {
                        window.app.map._mapaEncuadrado = null;
                        window.app.map.draw();
                    }
                }
            };
            if (zRange) zRange.oninput = () => syncZoom(zRange.value);
            if (zNum) zNum.oninput = () => syncZoom(zNum.value);

            const fxRange = document.getElementById('ts-faros-x-range');
            const fxNum = document.getElementById('ts-faros-x-num');
            const syncFarosX = (val) => {
                const cfg = this.getConfig();
                if (cfg) {
                    if (!Array.isArray(cfg.luces_offset_px)) cfg.luces_offset_px = [0, 0];
                    cfg.luces_offset_px[0] = parseInt(val, 10) || 0;
                    if (fxRange) fxRange.value = cfg.luces_offset_px[0];
                    if (fxNum) fxNum.value = cfg.luces_offset_px[0];
                    if (window.app && window.app.map) window.app.map.draw();
                    try { if (window.Lighting) window.Lighting.renderHalos(null, this.currentLocation()); } catch(e) {}
                }
            };
            if (fxRange) fxRange.oninput = () => syncFarosX(fxRange.value);
            if (fxNum) fxNum.oninput = () => syncFarosX(fxNum.value);

            const fyRange = document.getElementById('ts-faros-y-range');
            const fyNum = document.getElementById('ts-faros-y-num');
            const syncFarosY = (val) => {
                const cfg = this.getConfig();
                if (cfg) {
                    if (!Array.isArray(cfg.luces_offset_px)) cfg.luces_offset_px = [0, 0];
                    cfg.luces_offset_px[1] = parseInt(val, 10) || 0;
                    if (fyRange) fyRange.value = cfg.luces_offset_px[1];
                    if (fyNum) fyNum.value = cfg.luces_offset_px[1];
                    if (window.app && window.app.map) window.app.map.draw();
                    try { if (window.Lighting) window.Lighting.renderHalos(null, this.currentLocation()); } catch(e) {}
                }
            };
            if (fyRange) fyRange.oninput = () => syncFarosY(fyRange.value);
            if (fyNum) fyNum.oninput = () => syncFarosY(fyNum.value);

            const btnGizmo = document.getElementById('ts-btn-gizmo');
            if (btnGizmo) {
                btnGizmo.onclick = () => {
                    this.gizmoActive = !this.gizmoActive;
                    this.syncControls();
                    if (this.gizmoActive && window.app && window.app.showToast) {
                        window.app.showToast('🎯 Haz clic y arrastra la cruz amarilla sobre el mapa para mover los faros', 'info');
                    }
                    if (window.app && window.app.map) window.app.map.draw();
                };
            }

            const btnAuto = document.getElementById('ts-btn-autocenter');
            if (btnAuto) {
                btnAuto.onclick = () => {
                    const cfg = this.getConfig();
                    if (cfg) {
                        cfg.luces_offset_px = [0, 0];
                        this.syncInputsOnly();
                        if (window.app && window.app.map) window.app.map.draw();
                        try { if (window.Lighting) window.Lighting.renderHalos(null, this.currentLocation()); } catch(e) {}
                        if (window.app && window.app.showToast) window.app.showToast('Faros restablecidos a (0, 0)', 'success');
                    }
                };
            }

            const chkLights = document.getElementById('ts-show-lights-chk');
            if (chkLights) {
                chkLights.onchange = () => {
                    this.showLightsInEditor = chkLights.checked;
                    this.layerVisibility.luces = chkLights.checked;
                    const chkL = document.getElementById('ts-layer-luces');
                    if (chkL) chkL.checked = chkLights.checked;
                    if (window.app && window.app.map) window.app.map.draw();
                    try { if (window.Lighting) window.Lighting.renderHalos(null, this.currentLocation()); } catch(e) {}
                };
            }

            const bindLayerChk = (id, key) => {
                const el = document.getElementById(id);
                if (el) {
                    el.onchange = () => {
                        this.layerVisibility[key] = el.checked;
                        if (key === 'luces') {
                            this.showLightsInEditor = el.checked;
                            const mainChk = document.getElementById('ts-show-lights-chk');
                            if (mainChk) mainChk.checked = el.checked;
                        }
                        if (window.app && window.app.map) window.app.map.draw();
                        try { if (window.Lighting) window.Lighting.renderHalos(null, this.currentLocation()); } catch(e) {}
                    };
                }
            };

            bindLayerChk('ts-layer-tren', 'tren');
            bindLayerChk('ts-layer-luces', 'luces');
            bindLayerChk('ts-layer-encima', 'encima');
            bindLayerChk('ts-layer-fondo', 'fondo');

            const btnSave = document.getElementById('ts-btn-save');
            if (btnSave) btnSave.onclick = () => this.saveToStorage();

            const btnDownload = document.getElementById('ts-btn-download');
            if (btnDownload) btnDownload.onclick = () => this.downloadJson();

            const btnCopy = document.getElementById('ts-btn-copy');
            if (btnCopy) btnCopy.onclick = () => this.copyJson();

            const btnReset = document.getElementById('ts-btn-reset');
            if (btnReset) btnReset.onclick = () => this.resetDefaults();
        },

        syncInputsOnly() {
            const cfg = this.getConfig();
            if (!cfg) return;
            const lOff = this.getLucesOffset();

            const fxRange = document.getElementById('ts-faros-x-range');
            const fxNum = document.getElementById('ts-faros-x-num');
            if (fxRange) fxRange.value = lOff[0];
            if (fxNum) fxNum.value = lOff[0];

            const fyRange = document.getElementById('ts-faros-y-range');
            const fyNum = document.getElementById('ts-faros-y-num');
            if (fyRange) fyRange.value = lOff[1];
            if (fyNum) fyNum.value = lOff[1];
        },

        syncControls() {
            const cfg = this.getConfig();
            if (!cfg) return;

            const btnGizmo = document.getElementById('ts-btn-gizmo');
            if (btnGizmo) {
                btnGizmo.style.background = this.gizmoActive ? '#e67e22' : '';
                btnGizmo.style.color = this.gizmoActive ? '#ffffff' : '';
                btnGizmo.textContent = this.gizmoActive ? '🎯 Moviendo con Ratón (Activo)' : '🎯 Mover con Ratón';
            }

            const modes = {
                waiting: 'ts-btn-mode-waiting',
                manual: 'ts-btn-mode-manual',
                simulation: 'ts-btn-mode-sim',
                clock: 'ts-btn-mode-clock'
            };

            for (const [m, id] of Object.entries(modes)) {
                const btn = document.getElementById(id);
                if (btn) {
                    if (this.mode === m) {
                        btn.style.background = '#8b6b4a';
                        btn.style.color = '#ffffff';
                    } else {
                        btn.style.background = '';
                        btn.style.color = '';
                    }
                }
            }

            const off = this.getDesplazamiento() || { x: 0, y: 0, t: 0.5, tramo: 'parado' };
            const badge = document.getElementById('ts-tramo-badge');
            if (badge) {
                const tramoNom = (off && off.tramo) ? off.tramo : 'parado';
                badge.textContent = tramoNom.toUpperCase();
                badge.style.background = (tramoNom === 'parado') ? '#7a9c6a'
                    : (tramoNom === 'fuera') ? '#999' : '#c2a06a';
            }

            const scrub = document.getElementById('ts-scrubber-range');
            const scrubVal = document.getElementById('ts-scrubber-val');
            const tVal = (off && typeof off.t === 'number') ? off.t : 0.5;
            const tramoVal = (off && off.tramo) || 'parado';
            if (scrub) scrub.value = tVal;
            if (scrubVal) scrubVal.textContent = Math.round(tVal * 100) + '% (' + tramoVal + ')';

            const pRange = document.getElementById('ts-parada-range');
            const pNum = document.getElementById('ts-parada-num');
            if (pRange) pRange.value = cfg.parada != null ? cfg.parada : -7.0;
            if (pNum) pNum.value = cfg.parada != null ? cfg.parada : -7.0;

            const rRange = document.getElementById('ts-recorrido-range');
            const rNum = document.getElementById('ts-recorrido-num');
            if (rRange) rRange.value = cfg.recorrido != null ? cfg.recorrido : 60;
            if (rNum) rNum.value = cfg.recorrido != null ? cfg.recorrido : 60;

            const zRange = document.getElementById('ts-zoom-range');
            const zNum = document.getElementById('ts-zoom-num');
            if (zRange) zRange.value = cfg.zoom_min != null ? cfg.zoom_min : 1.15;
            if (zNum) zNum.value = cfg.zoom_min != null ? cfg.zoom_min : 1.15;

            this.syncInputsOnly();
        },

        // ── Guardar / exportar calibración ──────────────────────────────────────

        saveToStorage() {
            if (!window.TrainLayers) { alert('TrainLayers no inicializado'); return; }
            const locId = this.currentLocation();
            const key = 'tsuki_train_calib_' + locId;
            const cfg = this.getConfig(locId);
            try {
                localStorage.setItem(key, JSON.stringify(cfg));
            } catch(e) { console.warn('[TrainStudio] localStorage error', e); }

            // También POST al servidor para persistir en train_layers.json
            fetch('/api/save/train_layers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(window.TrainLayers)
            }).then(r => r.json()).then(d => {
                if (d && d.ok) {
                    const btn = document.getElementById('ts-btn-save');
                    if (btn) {
                        const orig = btn.textContent;
                        btn.textContent = '✔ Guardado';
                        btn.style.background = '#5a8a5a';
                        setTimeout(() => { btn.textContent = orig; btn.style.background = ''; }, 1500);
                    }
                } else {
                    alert('Error al guardar en servidor');
                }
            }).catch(() => {
                // servidor no disponible — localStorage ya fue guardado
                const btn = document.getElementById('ts-btn-save');
                if (btn) {
                    const orig = btn.textContent;
                    btn.textContent = '✔ Local';
                    setTimeout(() => { btn.textContent = orig; }, 1200);
                }
            });
        },

        downloadJson() {
            if (!window.TrainLayers) return;
            const json = JSON.stringify(window.TrainLayers, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'train_layers.json';
            document.body.appendChild(a);
            a.click();
            setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1000);
        },

        copyJson() {
            if (!window.TrainLayers) return;
            const locId = this.currentLocation();
            const cfg = this.getConfig(locId);
            const json = JSON.stringify(cfg, null, 2);
            navigator.clipboard.writeText(json).then(() => {
                const btn = document.getElementById('ts-btn-copy');
                if (btn) {
                    const orig = btn.textContent;
                    btn.textContent = '✔ Copiado';
                    setTimeout(() => { btn.textContent = orig; }, 1200);
                }
            }).catch(() => {
                const ta = document.createElement('textarea');
                ta.value = json;
                document.body.appendChild(ta);
                ta.select();
                document.execCommand('copy');
                ta.remove();
            });
        },

        resetDefaults() {
            if (!confirm('¿Restaurar valores por defecto para esta estación?')) return;
            const locId = this.currentLocation();
            const id = String(locId);
            if (!window.TrainLayers) return;
            const defaults = { parada: 0.0, recorrido: 60.0, zoom_min: 1.15, luces_offset_px: [0, 0] };
            const existing = window.TrainLayers[id] || {};
            window.TrainLayers[id] = Object.assign({}, existing, defaults);
            this.syncControls();
            if (window.app && window.app.map) window.app.map.draw();
        },

        // ── Visibilidad del panel ────────────────────────────────────────────────

        syncVisibility() {
            const panel = document.getElementById('train-studio-panel');
            if (!panel) return;
            const visible = this.isActive();
            panel.style.display = visible ? 'block' : 'none';
            if (visible) this.syncControls();

            // Si estamos en una estación (10 o 15), ocultar botones de granja irrelevantes
            const farmActions = document.querySelector('.farm-actions');
            if (farmActions) {
                farmActions.style.display = visible ? 'none' : '';
            }
        }
    };

    window.TrainStudio = Studio;

    const locSel = document.getElementById('select-location');
    if (locSel) {
        locSel.addEventListener('change', () => {
            Studio.ensureUI();
            Studio.syncVisibility();
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => Studio.ensureUI());
    } else {
        setTimeout(() => Studio.ensureUI(), 100);
    }
})();
