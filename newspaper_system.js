// newspaper_system.js — Módulo 5: Sistema de Periódicos Diarios ("The Daily Tear" / "El Periódico Diario")
// Despacho matutino a las 08:00 AM, desbloqueos de NPCs/eventos, y visualización de prensa.

(function() {
    // Tabla oficial scriptedNews según descomplicación de NewspaperData
    const SCRIPTED_NEWS = [
        { day: 1, id: 1 },    // Pier / El Muelle
        { day: 2, id: 5 },    // Dawn / Restauración de la Alcaldía
        { day: 3, id: 4 },    // Bounty Board / Tablón de Pesca Comunitario
        { day: 4, id: 3 },    // Moca / Increíble Bonsái
        { day: 5, id: 6 },    // Chi
        { day: 6, id: 7 },    // Bobo
        { day: 7, id: 8 },    // Momo
        { day: 8, id: 9 },    // Rose
        { day: 9, id: 10 },
        { day: 10, id: 11 },
        { day: 11, id: 12 },
        { day: 12, id: 13 },
        { day: 13, id: 14 },
        { day: 14, id: 18 },
        { day: 15, id: 15 },
        { day: 16, id: 16 },
        { day: 17, id: 20 },
        { day: 20, id: 25 },
        { day: 25, id: 138 },
        { day: 28, id: 195 }
    ];

    const GENERIC_SUBHEADLINES_ES = [
        "¡Sostener el botón de teléfono te ayuda a abrir rápido otras apps!",
        "¡Nuevo cómic de Natto cada semana!",
        "¡Los aldeanos adoran conversar a diferentes horas del día!",
        "¡Recuerda visitar a Benny en el ayuntamiento para consultar las recompensas de pesca!",
        "¡Los muebles de edición especial rotan con frecuencia en la tienda de Yori!",
        "¡La pesca en el muelle cambia según la hora del día y el clima!"
    ];

    const GENERIC_SUBHEADLINES_EN = [
        "Holding down the phone button can help you quickly open apps!",
        "New Natto comic every week!",
        "Villagers love chatting at different hours of the day!",
        "Remember to visit Benny at Town Hall to check daily fishing bounties!",
        "Special edition furniture rotates frequently at Yori's store!",
        "Fishing at the pier yields different species depending on time of day!"
    ];

    class NewspaperSystem {
        constructor() {
            this.currentLanguage = 'ES'; // 'ES' o 'EN'
            this.activeNewspaper = null;
            this.dispatchedToday = false;
            this.lastCheckedOaDay = null;
        }

        init() {
            this._injectModalHTML();
            this._setupEventListeners();
        }

        getCurrentOaDay(parser) {
            const p = parser || (window.app && window.app.parser);
            if (p) {
                const newspapers = p.getNewspapers ? p.getNewspapers() : [];
                if (newspapers.length > 0) {
                    const maxDay = Math.max(...newspapers.map(n => n.day || 0));
                    if (maxDay > 40000) return maxDay;
                }
                const bb = p.getBountyBoardSave ? p.getBountyBoardSave() : null;
                if (bb && bb.rollDate > 40000) return bb.rollDate;
            }
            return Math.floor(Date.now() / 86400000 + 25569);
        }

        getNewspaperForDay(oaDay, parser) {
            const p = parser || (window.app && window.app.parser);
            const newspapers = p && p.getNewspapers ? p.getNewspapers() : [];
            const shownIds = new Set(newspapers.filter(n => n.shown).map(n => n.id));

            // 1. Si ya existe un periódico registrado exactamente para este día OA
            const existing = newspapers.find(n => n.day === oaDay);
            if (existing && window.NEWSPAPER_DB && window.NEWSPAPER_DB[String(existing.id)]) {
                return { ...window.NEWSPAPER_DB[String(existing.id)], day: oaDay, alreadyShown: existing.shown, done: existing.done };
            }

            // 2. Comprobar si hay un evento programado (Scripted News) no visto aún
            for (const item of SCRIPTED_NEWS) {
                if (!shownIds.has(item.id)) {
                    if (window.NEWSPAPER_DB && window.NEWSPAPER_DB[String(item.id)]) {
                        return { ...window.NEWSPAPER_DB[String(item.id)], day: oaDay, alreadyShown: false, done: false, isScripted: true };
                    }
                }
            }

            // 3. Selección determinista por semilla pseudo-aleatoria del día OA
            if (window.NEWSPAPER_DB) {
                const candidates = Object.values(window.NEWSPAPER_DB).filter(entry => !entry.nonrollable);
                if (candidates.length > 0) {
                    const seed = (Number(oaDay) * 1103515245 + 12345) & 0x7fffffff;
                    const unshown = candidates.filter(c => !shownIds.has(c.id));
                    const pool = unshown.length > 0 ? unshown : candidates;
                    const selected = pool[seed % pool.length];
                    return { ...selected, day: oaDay, alreadyShown: false, done: false };
                }
            }

            return {
                id: 1,
                pic: "pierunlock",
                title_es: "¡El muelle! ¡El sitio de pesca más candente de Aldea Hongo!",
                title_en: "The Pier! M.V's Hottest Fishing Spot!",
                sub_es: "¡Nuevo punto de pesca disponible para todos los habitantes!",
                sub_en: "New fishing spot now open to all villagers!",
                day: oaDay,
                alreadyShown: false
            };
        }

        checkMorningDispatch(force = false) {
            const p = window.app && window.app.parser;
            if (!p) return false;

            const timeNow = window.GameTime ? window.GameTime.now() : { hour: new Date().getHours(), minute: new Date().getMinutes() };
            const currentHour = timeNow.hour;
            const oaDay = this.getCurrentOaDay(p);

            // Periódico se despacha a partir de las 08:00
            if (currentHour < 8 && !force) {
                return false;
            }

            const todayNews = this.getNewspaperForDay(oaDay, p);
            if (!todayNews) return false;

            if (todayNews.alreadyShown && !force && this.lastCheckedOaDay === oaDay) {
                return false;
            }

            this.lastCheckedOaDay = oaDay;
            this.showNewspaper(todayNews);
            return true;
        }

        showNewspaper(newsEntry) {
            if (!newsEntry) return;
            if (window.PlaySfx) window.PlaySfx.sonar('newspaperOpen');
            this.activeNewspaper = newsEntry;

            const modal = document.getElementById('modal-morning-newspaper');
            if (!modal) {
                this._injectModalHTML();
            }

            this._renderNewspaperModal(newsEntry);
            const m = document.getElementById('modal-morning-newspaper');
            if (m) {
                m.classList.remove('hidden');
                m.style.display = 'flex';
            }
        }

        _renderNewspaperModal(news) {
            const isEs = this.currentLanguage === 'ES';
            const headlineEl = document.getElementById('newspaper-headline');
            const subheadlineEl = document.getElementById('newspaper-subheadline');
            const picEl = document.getElementById('newspaper-pic');
            const dateEl = document.getElementById('newspaper-date');
            const issueEl = document.getElementById('newspaper-issue');
            const closeBtn = document.getElementById('btn-newspaper-close');

            if (headlineEl) {
                headlineEl.textContent = isEs ? (news.title_es || news.title_en || 'Noticia del Día') : (news.title_en || news.title_es || 'Daily News');
            }

            if (subheadlineEl) {
                let sub = isEs ? news.sub_es : news.sub_en;
                if (!sub || sub.trim() === '') {
                    const fallbackList = isEs ? GENERIC_SUBHEADLINES_ES : GENERIC_SUBHEADLINES_EN;
                    const idx = (news.id || 0) % fallbackList.length;
                    sub = fallbackList[idx];
                }
                subheadlineEl.textContent = sub;
            }

            if (picEl) {
                picEl.src = 'images/newspapers/' + (news.pic || 'robbery') + '.png';
                picEl.onerror = () => {
                    picEl.src = 'images/newspapers/Gacha Punch Newspaper.png';
                };
            }

            if (dateEl) {
                dateEl.textContent = isEs ? ('Día ' + (news.day || '1') + ' • Edición Matutina 08:00 AM') : ('Day ' + (news.day || '1') + ' • Morning Edition 08:00 AM');
            }

            if (issueEl) {
                issueEl.textContent = 'No. ' + String(news.id).padStart(3, '0');
            }

            if (closeBtn) {
                closeBtn.textContent = isEs ? '¡Aceptar y Leer!' : 'Accept & Read!';
            }
        }

        closeNewspaper() {
            if (window.PlaySfx) window.PlaySfx.sonar('newspaperClose');
            const modal = document.getElementById('modal-morning-newspaper');
            if (modal) {
                modal.classList.add('hidden');
                modal.style.display = 'none';
            }

            if (this.activeNewspaper && window.app && window.app.parser) {
                const p = window.app.parser;
                const news = this.activeNewspaper;

                const yaLeido = typeof p.isNewspaperRead === 'function'
                    ? p.isNewspaperRead(news.id) : false;
                p.ensureNewspaperEntry(news.id, news.day, true, false);
                // El save lleva su propio contador; solo sube la primera vez.
                if (!yaLeido && typeof p.bumpCounter === 'function') {
                    p.bumpCounter('newspapersRead', 1);
                }
                this._handleNewspaperUnlocks(news);

                if (window.app.renderNews) {
                    window.app.renderNews();
                }

                if (window.app.tsukiPort && typeof window.app.tsukiPort.triggerAutosave === 'function') {
                    window.app.tsukiPort.triggerAutosave();
                }

                if (window.app.showToast) {
                    window.app.showToast(this.currentLanguage === 'ES' ? '📰 Periódico del día leído' : '📰 Daily newspaper read');
                }
            }

            this.activeNewspaper = null;
        }

        /**
         * Lo que abre una noticia al completarse.
         *
         * ASI ES COMO SE ABRE LA ALDEA. Se rastreó en el binario: quien mete una entrada
         * en `locationsOnPhone` es `TsukiExtensions.Unlock`, y sus llamadores son el
         * tutorial (Casa y Tienda de Yori), `PipiTutorial` (Ayuntamiento), la llave del
         * apartamento, los botones `TravelAndUnlock` de la ciudad, y
         * **`NewspaperEntry.ValidateCompletion`**, que abre la `location` de la propia
         * noticia. No es el diálogo: de las 3661 respuestas del juego solo dos traen
         * acción y ninguna es de desbloqueo (ver `data/dialogue_actions.json`).
         *
         * Lo que había aquí estaba muerto y además mal: llamaba a
         * `MapDef.unlockLocation`, que no existe, y los ids no cuadraban con el enum
         * —abría la 3 diciendo "Pier" cuando la 3 es la Casa de Moca, y la 5 diciendo
         * "Chi" cuando la 5 es la Tienda de Rosemary—.
         *
         * Ahora se usa el campo `location` de la noticia, que ya viene en
         * `data/newspapers.js` con el nombre del enum.
         */
        _handleNewspaperUnlocks(news) {
            const abiertos = [];
            const p = window.app && window.app.parser;
            const id = NewspaperSystem.SLOCATION.indexOf(String(news.location || ''));
            if (id >= 0 && p && typeof p.setLocationUnlocked === 'function') {
                try {
                    if (p.setLocationUnlocked(id, true)) abiertos.push(news.location);
                } catch (e) { console.warn('[NewspaperSystem] no se pudo abrir ' + news.location, e); }
            }
            // Los encargos se encienden con la noticia 4. Esto no es un desbloqueo de
            // sitio y se deja como estaba.
            if (news.id === 4 && window.BountySystem) window.BountySystem.enabled = true;

            if (abiertos.length) {
                console.log('[NewspaperSystem] la noticia ' + news.id + ' abre: ' + abiertos.join(', '));
                if (window.Travel && typeof window.Travel.destinos === 'function') {
                    try { window.Travel.destinos(); } catch (e) { /* sin panel abierto */ }
                }
            }
            return abiertos;
        }

        toggleLanguage() {
            this.currentLanguage = this.currentLanguage === 'ES' ? 'EN' : 'ES';
            if (this.activeNewspaper) {
                this._renderNewspaperModal(this.activeNewspaper);
            }
        }

        _injectModalHTML() {
            if (document.getElementById('modal-morning-newspaper')) return;

            const modalDiv = document.createElement('div');
            modalDiv.id = 'modal-morning-newspaper';
            modalDiv.className = 'newspaper-modal-overlay hidden';
            modalDiv.style.display = 'none';

            modalDiv.innerHTML = `
                <div class="newspaper-container">
                    <div class="newspaper-header">
                        <div class="newspaper-issue-bar">
                            <span id="newspaper-issue" class="newspaper-issue-badge">No. 001</span>
                            <span id="newspaper-date" class="newspaper-date-text">Edición Matutina • 08:00 AM</span>
                            <button id="btn-newspaper-lang" class="newspaper-lang-btn" title="Cambiar idioma / Switch language">ES / EN</button>
                        </div>
                        <h1 class="newspaper-masthead">THE DAILY TEAR</h1>
                        <div class="newspaper-rule"></div>
                        <div class="newspaper-motto">El Diario Oficial de la Aldea Hongo • Noticias, Eventos y Rumores</div>
                        <div class="newspaper-rule-double"></div>
                    </div>

                    <div class="newspaper-body">
                        <h2 id="newspaper-headline" class="newspaper-headline">¡Robos en Aldea Hongo!</h2>
                        
                        <div class="newspaper-photo-frame">
                            <img id="newspaper-pic" class="newspaper-photo" src="images/newspapers/robbery.png" alt="Noticia">
                            <div class="newspaper-caption">Foto de la escena por el corresponsal local</div>
                        </div>

                        <div id="newspaper-subheadline" class="newspaper-article-text">
                            La tranquilidad de la Aldea Hongo se ha visto sacudida en las primeras horas de hoy.
                        </div>
                    </div>

                    <div class="newspaper-footer">
                        <button id="btn-newspaper-close" class="newspaper-read-btn">¡Aceptar y Leer!</button>
                    </div>
                </div>
            `;

            document.body.appendChild(modalDiv);
        }

        _setupEventListeners() {
            document.addEventListener('click', (e) => {
                if (e.target && e.target.id === 'btn-newspaper-close') {
                    this.closeNewspaper();
                } else if (e.target && e.target.id === 'btn-newspaper-lang') {
                    this.toggleLanguage();
                } else if (e.target && e.target.id === 'modal-morning-newspaper') {
                    this.closeNewspaper();
                }
            });
        }
    }

    // `SLocation` del juego. El campo `location` de cada noticia trae uno de estos
    // nombres, así que el índice ES el id.
    NewspaperSystem.SLOCATION = [
        'Home', 'YorisShop', 'ChisHouse', 'MocasHouse', 'Pier', 'RosemarysShop', 'Farm',
        'OpeningScene', 'TownHall', 'MomosTeaHouse', 'TrainStation', 'DawnsShop', 'Dojo',
        'ScarlettsLounge', 'Travelling', 'SubwayStation', 'CityHall', 'Exit', 'Skytower',
        'CapsuleHotel', 'ApartmentLobby', 'TheHole', 'Penthouse', 'ShoppingMall',
        'MallEntrance', 'RugShop', 'Winery', 'IceCreamShop', 'JewelryStore', 'PostOffice',
        'BubbleTea', 'ShoeStore', 'PoliceStation', 'CoffeeShop', 'Apartment',
    ];

    window.NewspaperSystem = new NewspaperSystem();
    if (typeof document !== 'undefined') {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => window.NewspaperSystem.init());
        } else {
            window.NewspaperSystem.init();
        }
    }
})();
