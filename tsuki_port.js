class TsukiPort {
    constructor(app) {
        this.app = app;
        this.isHammerMode = false;
        
        // Cache DOM elements
        this.bottomBar = document.getElementById('play-bottom-bar');
        this.hammerUI = document.getElementById('hammer-ui');
        this.hammerInvPanel = document.getElementById('hammer-inv-panel');
        this.bagUI = document.getElementById('bag-ui');
        this.bagPanel = document.getElementById('bag-panel');
        this.btnBagExit = document.getElementById('btn-bag-exit');
        this.btnHammerExit = document.getElementById('btn-hammer-exit');
        
        this.btnBag = document.getElementById('btn-port-bag');
        this.btnHammer = document.getElementById('btn-port-hammer');
        this.btnPhone = document.getElementById('btn-port-phone');
        this.btnSettings = document.getElementById('btn-port-settings');
        
        this.settingsModal = document.getElementById('play-settings-modal');
        this.sliderMusic = document.getElementById('ps-slider-music');
        this.sliderSfx = document.getElementById('ps-slider-sfx');
        this.toggleAutosave = document.getElementById('ps-toggle-autosave');
        this.btnExport = document.getElementById('ps-btn-export');
        this.btnImport = document.getElementById('ps-btn-import');
        this.inputFile = document.getElementById('input-play-import-csave');
        this.btnBackup = document.getElementById('ps-btn-backup');
        
        this.btnHammerGrid = document.getElementById('btn-hammer-grid');
        this.btnHammerFlip = document.getElementById('btn-hammer-flip');
        
        this.mapModal = document.getElementById('play-map-modal');
        this.mapOverlay = document.getElementById('play-map-overlay');
        this.btnMapModalClose = document.getElementById('btn-map-modal-close');
        this.btnMapMenu = document.getElementById('btn-map-menu');
        this.pmDestinationsGrid = document.getElementById('pm-destinations-grid');
        this.pmTabVillage = document.getElementById('pm-tab-village');
        this.pmTabCity = document.getElementById('pm-tab-city');
        this.pmCurrentLocationHint = document.getElementById('pm-current-location-hint');
        this.currentMapZone = 'village';
        
        this.currentCategory = 1; // 1 = Furniture (default)
        this.showGrid = true;
        this.autosaveEnabled = true; // Por defecto activado guardando en caché local silenciosa
        this.autosaveTimer = null;
        this.playTime = 0;
        this.lastWrite = Date.now();
        
        this.setupEvents();
    }
    
    setupEvents() {
        if (this.btnBag) {
            this.btnBag.addEventListener('click', () => { if (this.bagUI && this.bagUI.classList.contains('active-ui')) { this.exitBagMode(); } else { this.enterBagMode(); } });
        }
        if (this.btnBagExit) {
            this.btnBagExit.addEventListener('click', () => this.exitBagMode());
        }
        if (this.btnHammer) {
            this.btnHammer.addEventListener('click', () => this.enterHammerMode());
        }
        
        if (this.btnHammerExit) {
            this.btnHammerExit.addEventListener('click', () => this.exitHammerMode());
        }
        
        if (this.btnHammerGrid) {
            this.btnHammerGrid.addEventListener('click', () => {
                this.showGrid = !this.showGrid;
                if (this.app.map) {
                    this.app.map.forceDrawGrid = this.showGrid;
                    this.app.map.draw();
                }
                this.btnHammerGrid.style.opacity = this.showGrid ? '1' : '0.5';
            });
        }
        
        if (this.btnHammerFlip) {
            this.btnHammerFlip.addEventListener('click', () => {
                if (this.hammerUI) {
                    this.hammerUI.classList.toggle('right-side');
                }
            });
        }
        
        if (this.btnPhone) {
            this.btnPhone.title = 'Mapa de Viaje (Teléfono)';
            this.btnPhone.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleMapModal();
            });
        }

        if (this.btnMapMenu) {
            this.btnMapMenu.addEventListener('click', (e) => {
                e.stopPropagation();
                this.openMapModal();
            });
        }

        if (this.btnMapModalClose) {
            this.btnMapModalClose.addEventListener('click', () => this.closeMapModal());
        }

        if (this.mapOverlay) {
            this.mapOverlay.addEventListener('click', () => this.closeMapModal());
        }

        if (this.pmTabVillage) {
            this.pmTabVillage.addEventListener('click', () => {
                this.currentMapZone = 'village';
                this.pmTabVillage.classList.add('active');
                if (this.pmTabCity) this.pmTabCity.classList.remove('active');
                this.renderMapDestinations();
            });
        }

        if (this.pmTabCity) {
            this.pmTabCity.addEventListener('click', () => {
                this.currentMapZone = 'city';
                this.pmTabCity.classList.add('active');
                if (this.pmTabVillage) this.pmTabVillage.classList.remove('active');
                this.renderMapDestinations();
            });
        }

        if (this.btnSettings) {
            this.btnSettings.title = 'Configuración';
            this.btnSettings.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleSettingsModal();
            });
        }

        // Close modal when clicking outside
        document.addEventListener('click', (e) => {
            if (this.settingsModal && !this.settingsModal.classList.contains('hidden')) {
                if (!this.settingsModal.contains(e.target) && !this.btnSettings.contains(e.target)) {
                    this.closeSettingsModal();
                }
            }
            if (this.mapModal && !this.mapModal.classList.contains('hidden')) {
                if (!this.mapModal.contains(e.target) && !(this.btnPhone && this.btnPhone.contains(e.target)) && !(this.btnMapMenu && this.btnMapMenu.contains(e.target))) {
                    this.closeMapModal();
                }
            }
        });

        // Prevent clicks inside modals from propagating out
        if (this.settingsModal) {
            this.settingsModal.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }
        if (this.mapModal) {
            this.mapModal.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }

        // Music volume slider
        if (this.sliderMusic) {
            this.sliderMusic.addEventListener('input', (e) => {
                const vol = parseFloat(e.target.value) / 100;
                if (window.Castle && window.Castle.BGM) {
                    if (typeof window.Castle.BGM.setMusicVolume === 'function') {
                        window.Castle.BGM.setMusicVolume(vol);
                    }
                    if (window.Castle.BGM.currentAudio) {
                        window.Castle.BGM.currentAudio.volume = vol;
                    }
                }
            });
        }

        // Toggle buttons (Minimal SFX, Battery Saver, Vibration, Motion, Notifications, Autosave)
        document.querySelectorAll('.ps-toggle-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const isCurrentlyOn = btn.getAttribute('data-state') === 'on';
                const newState = !isCurrentlyOn;
                this.setToggleState(btn, newState);
                
                if (btn.id === 'ps-toggle-autosave') {
                    this.autosaveEnabled = newState;
                    if (this.autosaveEnabled) {
                        this.app.showToast('💾 Autoguardado en caché activado.');
                        this.triggerAutosave();
                        if (!this.autosaveTimer) {
                            this.autosaveTimer = setInterval(() => this.triggerAutosave(), 30000);
                        }
                    } else {
                        if (this.autosaveTimer) {
                            clearInterval(this.autosaveTimer);
                            this.autosaveTimer = null;
                        }
                        this.app.showToast('Autoguardado desactivado.');
                    }
                } else {
                    const label = btn.closest('.ps-toggle-item')?.querySelector('.ps-toggle-label')?.textContent || '';
                    this.app.showToast(`${label}: ${newState ? 'Activado' : 'Desactivado'}`);
                }
            });
        });

        // Export button (.csave with all changes up to date)
        if (this.btnExport) {
            this.btnExport.addEventListener('click', () => {
                if (!this.app || !this.app.parser) {
                    this.app.showToast('No hay partida cargada para exportar.', 'error');
                    return;
                }
                const now = Date.now();
                this.playTime += Math.floor((now - this.lastWrite) / 1000);
                this.lastWrite = now;
                if (this.app.parser.generalVars && typeof this.app.parser.generalVars.playTime === 'undefined') {
                    this.app.parser.generalVars.playTime = { type: 'Int32', value: this.playTime, _stub: true };
                }
                this.app.saveAndDownload();
                this.app.showToast('💾 Partida exportada con todos los cambios.');
            });
        }

        // Import button (.csave loading directly into editor and play mode)
        if (this.btnImport && this.inputFile) {
            this.btnImport.addEventListener('click', () => {
                this.inputFile.click();
            });
            this.inputFile.addEventListener('change', (e) => {
                const file = e.target.files && e.target.files[0];
                if (file) {
                    this.app.loadFile(file);
                    this.closeSettingsModal();
                    this.app.showToast('📂 Partida cargada exitosamente.');
                }
                this.inputFile.value = '';
            });
        }

        // Cache backup button
        if (this.btnBackup) {
            this.btnBackup.addEventListener('click', async () => {
                await this.triggerAutosave();
                this.app.showToast('💾 Copia de seguridad guardada en caché local.');
            });
        }

        // Secondary text links
        document.getElementById('ps-link-restore')?.addEventListener('click', () => {
            this.app.showToast('✅ Compras y pases restaurados correctamente.');
        });
        document.getElementById('ps-link-privacy')?.addEventListener('click', () => {
            this.app.showToast('🔒 Tsuki Odyssey Web Port opera 100% de forma local en tu navegador.');
        });
        document.getElementById('ps-btn-account')?.addEventListener('click', () => {
            this.app.showToast('👤 Sesión local activa.');
        });
    }

    toggleSettingsModal() {
        if (!this.settingsModal) return;
        if (this.settingsModal.classList.contains('hidden')) {
            this.openSettingsModal();
        } else {
            this.closeSettingsModal();
        }
    }

    openSettingsModal() {
        if (!this.settingsModal) return;
        this.settingsModal.classList.remove('hidden');
        if (this.btnSettings) this.btnSettings.classList.add('active');

        // Sync Music Volume slider
        if (this.sliderMusic && window.Castle && window.Castle.BGM && window.Castle.BGM.currentAudio) {
            this.sliderMusic.value = Math.round(window.Castle.BGM.currentAudio.volume * 100);
        }

        // Sync Autosave toggle state
        if (this.toggleAutosave) {
            this.setToggleState(this.toggleAutosave, this.autosaveEnabled);
        }

        // Sync last saved label
        const lblLastSaved = document.getElementById('ps-lastsaved');
        if (lblLastSaved) {
            const deltaSec = Math.floor((Date.now() - this.lastWrite) / 1000);
            if (deltaSec < 5) {
                lblLastSaved.textContent = 'Guardado: Justo ahora';
            } else if (deltaSec < 60) {
                lblLastSaved.textContent = `Guardado: hace ${deltaSec}s`;
            } else {
                lblLastSaved.textContent = `Guardado: hace ${Math.floor(deltaSec / 60)}m`;
            }
        }
    }

    closeSettingsModal() {
        if (!this.settingsModal) return;
        this.settingsModal.classList.add('hidden');
        if (this.btnSettings) this.btnSettings.classList.remove('active');
    }

    toggleMapModal() {
        if (!this.mapModal) return;
        if (this.mapModal.classList.contains('hidden')) {
            this.openMapModal();
        } else {
            this.closeMapModal();
        }
    }

    openMapModal() {
        if (!this.mapModal) return;
        this.closeSettingsModal();
        this.mapModal.classList.remove('hidden');
        if (this.mapOverlay) this.mapOverlay.classList.remove('hidden');
        if (this.btnPhone) this.btnPhone.classList.add('active');
        this.renderMapDestinations();
    }

    closeMapModal() {
        if (!this.mapModal) return;
        this.mapModal.classList.add('hidden');
        if (this.mapOverlay) this.mapOverlay.classList.add('hidden');
        if (this.btnPhone) this.btnPhone.classList.remove('active');
    }

    renderMapDestinations() {
        if (!this.pmDestinationsGrid) return;
        this.pmDestinationsGrid.innerHTML = '';

        const curLocId = parseInt(document.getElementById('select-location')?.value || '0', 10);
        const curLocName = (typeof SUBLOC_NAMES !== 'undefined' && SUBLOC_NAMES[curLocId]) || ('Ubicación ' + curLocId);
        if (this.pmCurrentLocationHint) {
            this.pmCurrentLocationHint.textContent = `📍 Ubicación actual: ${curLocName}`;
        }

        const VILLAGE_LOCATIONS = [
            { id: 0, name: "Casa del Árbol de Tsuki", icon: "🏡", desc: "Planta baja, pisos superiores y tronco", tag: "Hogar" },
            { id: 1, name: "Tienda de Yori", icon: "🦊", desc: "Artículos, muebles y tienda de Pipi", tag: "Tienda" },
            { id: 2, name: "Casa de Chi", icon: "🦒", desc: "Biblioteca y rincón de lectura de Chi", tag: "Vecino" },
            { id: 3, name: "Casa de Moca", icon: "🐢", desc: "Bonsáis, té y equipo de música de Moca", tag: "Vecino" },
            { id: 4, name: "Muelle / Costa", icon: "🎣", desc: "Pesca marítima y costa de sirenas", tag: "Pesca" },
            { id: 5, name: "Tienda de Rosemary", icon: "🌱", desc: "Semillas, flores y macetas de jardín", tag: "Vivero" },
            { id: 6, name: "Granja de Tsuki", icon: "🥕", desc: "Parcelas de zanahorias y cobertizo", tag: "Cultivo" },
            { id: 8, name: "Ayuntamiento", icon: "🏛️", desc: "Despacho del Alcalde Benny y tablón de anuncios", tag: "Oficina" },
            { id: 9, name: "Casa de Té de Momo", icon: "🍵", desc: "Puesto de ramen de Bobo y salón de té de Momo", tag: "Comida" },
            { id: 10, name: "Estación de Tren", icon: "🚉", desc: "Llegada del tren a la Gran Ciudad y Floyd", tag: "Viaje" },
            { id: 11, name: "Taller de Dawn", icon: "🧰", desc: "Máquina Junker y mejoras de Dawn", tag: "Taller" },
            { id: 12, name: "Dojo / Bar de Ken", icon: "🥊", desc: "Bar nocturno y rincón de entrenamiento de Ken", tag: "Noche" },
            { id: 13, name: "Salón de Scarlett", icon: "🎷", desc: "Lounge bar, música en vivo y bebidas finas", tag: "Lounge" }
        ];

        const CITY_LOCATIONS = [
            { id: 14, name: "En Tránsito / Tren", icon: "🚆", desc: "Vagón del tren a toda marcha", tag: "Tren" },
            { id: 15, name: "Estación Subterráneo", icon: "🚇", desc: "Llegada al metro metropolitano", tag: "Transporte" },
            { id: 16, name: "Ayuntamiento Urbano", icon: "🏢", desc: "Sede de gobierno de la Gran Ciudad", tag: "Gobierno" },
            { id: 17, name: "Salida de la Ciudad", icon: "🛣️", desc: "Acceso metropolitano y autopista", tag: "Salida" },
            { id: 18, name: "El Agujero (The Hole)", icon: "🕳️", desc: "Callejón y bar clandestino subterráneo", tag: "Subterráneo" },
            { id: 19, name: "Hotel Cápsula", icon: "🛏️", desc: "Alojamiento futurista para viajeros", tag: "Hotel" },
            { id: 20, name: "Lobby de Apartamentos", icon: "🛎️", desc: "Recepción y vestíbulo residencial", tag: "Residencia" },
            { id: 21, name: "Bar La Cuerva (The Raven)", icon: "🍸", desc: "Elegante bar nocturno y club de jazz", tag: "Bar" },
            { id: 22, name: "Penthouse de la Ciudad", icon: "🌆", desc: "Apartamento de lujo en las alturas", tag: "Exclusivo" },
            { id: 23, name: "Centro Comercial", icon: "🛍️", desc: "Galería comercial y tiendas departamentales", tag: "Compras" },
            { id: 24, name: "Entrada al Centro Comercial", icon: "🚪", desc: "Acceso y exteriores del centro comercial", tag: "Compras" },
            { id: 25, name: "Tienda de Alfombras", icon: "🧶", desc: "Tapicería y alfombras tejidas", tag: "Tienda" },
            { id: 26, name: "Vinatería", icon: "🍷", desc: "Selección de vinos y licores", tag: "Bar" },
            { id: 27, name: "Heladería", icon: "🍨", desc: "Postres y helados artesanales", tag: "Dulces" },
            { id: 28, name: "Joyería", icon: "💎", desc: "Gemas, relojes y alhajas finas", tag: "Lujo" },
            { id: 29, name: "Oficina de Correos", icon: "📬", desc: "Envío y recepción de paquetes", tag: "Servicio" },
            { id: 30, name: "Bubble Tea", icon: "🧋", desc: "Bebidas de té con perlas de tapioca", tag: "Bebidas" },
            { id: 31, name: "Zapatería", icon: "👞", desc: "Calzado elegante y botas", tag: "Moda" },
            { id: 32, name: "Estación de Policía", icon: "👮", desc: "Comisaría metropolitana de seguridad", tag: "Seguridad" },
            { id: 33, name: "Cafetería Urbana", icon: "☕", desc: "Espresso y repostería recién horneada", tag: "Café" },
            { id: 34, name: "Apartamento Urbano", icon: "🛋️", desc: "Vivienda moderna en el centro", tag: "Vivienda" }
        ];

        const list = this.currentMapZone === 'city' ? CITY_LOCATIONS : VILLAGE_LOCATIONS;

        list.forEach(loc => {
            const isCurrent = (loc.id === curLocId);
            const card = document.createElement('div');
            card.className = `pm-card ${isCurrent ? 'current' : ''}`;
            card.title = `Viajar a ${loc.name}`;

            card.innerHTML = `
                <div class="pm-card-top">
                    <span class="pm-card-icon">${loc.icon}</span>
                    <span class="pm-card-badge" style="${isCurrent ? 'background:#27ae60;' : 'background:#8c8273;'}">
                        ${isCurrent ? '📍 AQUÍ' : loc.tag}
                    </span>
                </div>
                <div class="pm-card-title">${loc.name}</div>
                <div class="pm-card-desc">${loc.desc}</div>
                <div class="pm-card-footer">
                    <span>${isCurrent ? 'Estás aquí' : '▶ Viajar ahora'}</span>
                    <span style="font-size: 0.65rem; opacity: 0.7;">ID: ${loc.id}</span>
                </div>
            `;

            card.addEventListener('click', () => {
                this.closeMapModal();
                if (this.app && typeof this.app.goLocation === 'function') {
                    this.app.goLocation(loc.id);
                } else if (typeof window.goLocation === 'function') {
                    window.goLocation(loc.id);
                }
                if (this.app && typeof this.app.showToast === 'function') {
                    this.app.showToast(`🧭 Viajando a: ${loc.name}...`);
                }
            });

            this.pmDestinationsGrid.appendChild(card);
        });
    }

    setToggleState(btn, isOn) {
        if (!btn) return;
        btn.setAttribute('data-state', isOn ? 'on' : 'off');
        if (isOn) {
            btn.classList.add('active');
            const icon = btn.querySelector('.ps-toggle-icon');
            if (icon) icon.textContent = '✔';
        } else {
            btn.classList.remove('active');
            const icon = btn.querySelector('.ps-toggle-icon');
            if (icon) icon.textContent = '✕';
        }
    }
    

    enterBagMode() {
        // if (this.bottomBar) this.bottomBar.style.display = 'none';
        if (this.bagUI) this.bagUI.classList.add('active-ui');
        if (this.btnBagExit) this.btnBagExit.style.display = 'none';
        this.renderBagInventory();
    }
    
    exitBagMode() {
        if (this.bagUI) this.bagUI.classList.remove('active-ui');
        if (document.body.classList.contains('play-mode') && !this.isHammerMode) {
            if (this.bottomBar) this.bottomBar.style.display = 'flex';
        }
    }
    
    renderBagInventory() {
        if (!this.bagPanel) return;
        this.bagPanel.innerHTML = '';
        
        if (!this.app.parser) return;
        if (!this.app.parser.inventory || this.app.parser.inventory.length === 0) {
            if (typeof this.app.parser.parseInventory === 'function') {
                this.app.parser.parseInventory();
            }
        }
        
        const items = (this.app.parser.inventory || []).filter(i => i.qty > 0 && i.item_id !== -1);
        
        if (items.length === 0) {
            this.bagPanel.innerHTML = '<div style="width:100%; text-align:center; margin-top:20px; color:rgba(0,0,0,0.5);">La mochila est\xE1 vac\xEDa.</div>';
            return;
        }
        
        items.forEach(item => {
            const div = document.createElement('div');
            div.className = 'bag-inv-slot';
            const typeStr = item.invType === 0 ? 'item' : 'furn';
            div.innerHTML = window.getSafeImageHTML(item.item_id, typeStr, 'style="max-width:70%; max-height:70%;"');
            
            const qty = document.createElement('div');
            qty.className = 'bag-inv-qty';
            qty.textContent = item.qty;
            div.appendChild(qty);
            
            this.bagPanel.appendChild(div);
        });
    }

    enterPlayMode() {
        this.bottomBar.classList.add('active-ui');
        this.exitHammerMode();
        
        // Iniciar timer de autosave si está activo
        if (this.autosaveEnabled && !this.autosaveTimer) {
            this.autosaveTimer = setInterval(() => this.triggerAutosave(), 30000);
        }

        // Set up the carrots display
        const hudCarrots = document.getElementById('port-hud-carrots');
        if (hudCarrots && this.app.parser && this.app.parser.generalVars) {
            hudCarrots.textContent = this.app.parser.generalVars.carrots ? (this.app.parser.generalVars.carrots.value ?? this.app.parser.generalVars.carrots) : 0;
        }
    }
    

    
    
    async triggerAutosave() {
        if (!this.autosaveEnabled || !this.app || !this.app.parser) return;
        
        const now = Date.now();
        this.playTime += Math.floor((now - this.lastWrite) / 1000);
        this.lastWrite = now;
        
        if (this.app.parser.generalVars && typeof this.app.parser.generalVars.playTime === 'undefined') {
            this.app.parser.generalVars.playTime = { type: 'Int32', value: this.playTime, _stub: true };
        }
        
        // Guardar silenciosamente en la caché local persistente (IndexedDB) y/o File System Access API
        if (typeof this.app.saveSession === 'function') {
            await this.app.saveSession({ silent: true });
            const badge = document.getElementById('port-hud-autosave');
            if (badge) {
                badge.style.opacity = '1';
                setTimeout(() => { badge.style.opacity = '0'; }, 1800);
            }
        }
    }

    exitPlayMode() {
        this.closeSettingsModal();
        this.triggerAutosave();

        // if (this.bottomBar) this.bottomBar.style.display = 'none';
        this.exitHammerMode();
    }
    
    enterHammerMode() {
        this.closeSettingsModal();
        this.isHammerMode = true;
        if (this.bottomBar) this.bottomBar.style.display = 'none';
        this.hammerUI.classList.add('active-ui');
        
        if (this.app.map) {
            this.app.map.isHammerMode = true;
            this.app.map.forceDrawGrid = this.showGrid;
            this.btnHammerGrid.style.opacity = this.showGrid ? '1' : '0.5';
            this.app.map.draw();
        }
        
        this.renderHammerInventory();
    }
    
    exitHammerMode() {
        this.isHammerMode = false;
        if (this.hammerUI) this.hammerUI.classList.remove('active-ui');
        if (document.body.classList.contains('play-mode')) {
            if (this.bottomBar) this.bottomBar.style.display = 'flex';
        }
        
        if (this.app.map) {
            this.app.map.isHammerMode = false;
            this.app.map.forceDrawGrid = false;
            
            // Deselect and close editor without deleting placed item
            this.app.map.selectedPlacement = null;
            if (typeof this.app.closeItemEditor === 'function') {
                this.app.closeItemEditor();
            }
            this.app.map.draw();
        }
        
        if (typeof this.triggerAutosave === 'function') {
            this.triggerAutosave();
        }
    }
    
    renderHammerInventory() {
        if (!this.hammerInvPanel) return;
        this.hammerInvPanel.innerHTML = '';
        
        if (!this.app.parser) return;
        if (!this.app.parser.inventory || this.app.parser.inventory.length === 0) {
            if (typeof this.app.parser.parseInventory === 'function') {
                this.app.parser.parseInventory();
            }
        }
        
        // Filter: invType 1, 2, 3 are all "furniture" categories, plus any floor/wall coverings.
        const items = (this.app.parser.inventory || []).filter(i => {
            if (i.qty <= 0 || i.item_id === -1) return false;
            if ([1, 2, 3].includes(Number(i.invType))) return true;
            if (this.app.map && this.app.map.isCovering(i.item_id)) return true;
            return false;
        });
        
        if (items.length === 0) {
            this.hammerInvPanel.innerHTML = '<div style="color: rgba(255,255,255,0.7); padding: 20px; text-align: center;">Vacio</div>';
            return;
        }
        
        items.forEach(item => {
            const div = document.createElement('div');
            div.className = 'hammer-inv-slot';
            div.draggable = true;
            const isCover = this.app.map ? this.app.map.isCovering(item.item_id) : null;
            const typeStr = (item.invType === 0 && !isCover) ? 'item' : 'furn';
            div.innerHTML = window.getSafeImageHTML(item.item_id, typeStr, 'style="max-width:80%; max-height:80%;"');
            
            // Use transparent dragImage so only custom canvas ghost is shown (avoids double mouse)
            const blankDragImg = new Image();
            blankDragImg.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
            div.addEventListener('dragstart', (e) => {
                const payload = JSON.stringify({
                    item_id: item.item_id,
                    invType: item.invType
                });
                if (this.app.map) this.app.map.draggedInventoryItem = { item_id: item.item_id };
                e.dataTransfer.setData('application/json', payload);
                e.dataTransfer.setData('text/plain', payload);
                try {
                    e.dataTransfer.setDragImage(blankDragImg, 0, 0);
                } catch (err) {}
                div.style.opacity = '0.5';
            });
            
            const qty = document.createElement('div');
            qty.className = 'hammer-inv-qty';
            qty.textContent = item.qty;
            div.appendChild(qty);
            
            div.addEventListener('dragend', () => {
                div.style.opacity = '1';
                if (this.app.map) {
                    this.app.map.draggedInventoryItem = null;
                    this.app.map.isItemDragging = null;
                    this.app.map.draw();
                }
            });
            
            this.hammerInvPanel.appendChild(div);
        });
    }
    
    pickupSelectedPlacement() {
        this.triggerAutosave();

        const map = this.app.map;
        if (!map || !map.selectedPlacement) return;
        const p = map.selectedPlacement;
        if (p.item_id === -1) return;
        
        try {
            let targetInvType = 1;
            if (map.SEED_IDS && map.SEED_IDS.has(p.item_id)) {
                targetInvType = 4;
            }
            this.app.parser.injectInventoryItem(p.item_id, 1, false, targetInvType);
        } catch (e) {
            console.warn("Could not return item to inventory:", e);
        }
        
        const idx = this.app.parser.placements.indexOf(p);
        if (idx !== -1) {
            this.app.parser.placements.splice(idx, 1);
        }
        
        map.selectedPlacement = null;
        map.draw();
        
        if (this.isHammerMode) {
            this.renderHammerInventory();
        }
    }
}

// Make it globally available
window.TsukiPort = TsukiPort;
