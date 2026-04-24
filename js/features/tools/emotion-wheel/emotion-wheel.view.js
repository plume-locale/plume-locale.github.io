/**
 * [MVVM : EmotionExplorer View]
 * Interface moderne d'exploration des émotions et du langage corporel.
 * Supporte le multilingue via Localization.t()
 */

const EmotionWheelView = {
    modalId: 'emotion-wheel-modal',
    currentMode: 'lexicon', // 'lexicon' ou 'bodyLanguage'
    currentCategory: 'joy',
    searchQuery: '',

    /**
     * Ouvre l'explorateur d'émotions.
     */
    open() {
        let modal = document.getElementById(this.modalId);
        if (!modal) {
            this.createModal();
            modal = document.getElementById(this.modalId);
        }

        modal.style.display = 'flex';
        this.render();
        
        if (typeof lucide !== 'undefined') lucide.createIcons();
    },

    /**
     * Ferme la modal.
     */
    close() {
        const modal = document.getElementById(this.modalId);
        if (modal) modal.style.display = 'none';
    },

    /**
     * Bascule entre Lexique et Langage Corporel.
     */
    setMode(mode) {
        this.currentMode = mode;
        this.searchQuery = '';
        
        // Reset category to first available in new mode
        const data = EmotionWheelData.getData();
        if (mode === 'lexicon') {
            this.currentCategory = data.wedges[0].id;
        } else {
            this.currentCategory = data.bodyLanguage[0].category;
        }

        const searchInput = document.getElementById('emotionSearchInput');
        if (searchInput) {
            searchInput.value = '';
            searchInput.placeholder = Localization.t('emotion.search.placeholder');
        }

        // Update active class on mode buttons
        document.querySelectorAll('.mode-btn').forEach(btn => {
            const isLexicon = btn.getAttribute('onclick').includes('lexicon');
            btn.classList.toggle('active', (mode === 'lexicon' && isLexicon) || (mode === 'bodyLanguage' && !isLexicon));
        });

        this.render();
        if (typeof lucide !== 'undefined') lucide.createIcons();
    },

    /**
     * Crée la structure HTML de la modal.
     */
    createModal() {
        const html = `
            <div id="${this.modalId}" class="modal emotion-explorer-modal" style="display: none; z-index: 2000;">
                <div class="modal-content emotion-explorer-content">
                    <div class="explorer-sidebar">
                        <div class="explorer-logo">
                            <i data-lucide="heart"></i>
                            <span>${Localization.t('emotion.tool.title')}</span>
                        </div>

                        <div class="mode-selector">
                            <button class="mode-btn ${this.currentMode === 'lexicon' ? 'active' : ''}" onclick="EmotionWheelView.setMode('lexicon')">
                                <i data-lucide="book-type"></i> ${Localization.t('emotion.mode.lexicon')}
                            </button>
                            <button class="mode-btn ${this.currentMode === 'bodyLanguage' ? 'active' : ''}" onclick="EmotionWheelView.setMode('bodyLanguage')">
                                <i data-lucide="accessibility"></i> ${Localization.t('emotion.mode.body')}
                            </button>
                        </div>

                        <nav class="explorer-nav" id="explorerNav">
                            <!-- Les catégories seront injectées ici -->
                        </nav>
                        
                        <button class="explorer-close-btn" onclick="EmotionWheelView.close()">
                            <i data-lucide="log-out"></i>
                            <span>${Localization.t('emotion.quit')}</span>
                        </button>
                    </div>
                    
                    <div class="explorer-main">
                        <header class="explorer-header">
                            <div class="search-wrapper">
                                <i data-lucide="search"></i>
                                <input type="text" placeholder="${Localization.t('emotion.search.placeholder')}" 
                                       oninput="EmotionWheelView.handleSearch(this.value)"
                                       id="emotionSearchInput">
                            </div>
                        </header>
                        
                        <div class="explorer-body" id="emotionExplorerGrid">
                            <!-- Le contenu sera injecté ici -->
                        </div>
                        
                        <footer class="explorer-footer" id="emotionExplorerFooter">
                            ${Localization.t('emotion.footer.hint')}
                        </footer>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', html);

        // Ajout du style CSS moderne
        const style = document.createElement('style');
        style.textContent = `
            .emotion-explorer-modal {
                background: rgba(15, 15, 20, 0.7) !important;
                backdrop-filter: blur(12px);
            }
            .emotion-explorer-content {
                max-width: 1000px !important;
                width: 90vw !important;
                height: 80vh !important;
                display: flex !important;
                flex-direction: row !important;
                padding: 0 !important;
                background: #fff !important;
                border: none !important;
                overflow: hidden !important;
                border-radius: 24px !important;
                box-shadow: 0 30px 60px rgba(0,0,0,0.4) !important;
            }
            
            /* Sidebar */
            .explorer-sidebar {
                width: 240px;
                background: #f8f9fa;
                border-right: 1px solid #eee;
                display: flex;
                flex-direction: column;
                padding: 24px;
            }
            .explorer-logo {
                display: flex;
                align-items: center;
                gap: 12px;
                font-weight: 800;
                font-size: 1.2rem;
                color: #1a1a1a;
                margin-bottom: 24px;
                font-family: 'Outfit', sans-serif;
            }
            .explorer-logo i {
                color: #ff4757;
                fill: #ff4757;
            }

            /* Mode Selector */
            .mode-selector {
                display: flex;
                background: #eee;
                padding: 4px;
                border-radius: 12px;
                margin-bottom: 24px;
            }
            .mode-btn {
                flex: 1;
                padding: 8px;
                border: none;
                border-radius: 8px;
                background: transparent;
                cursor: pointer;
                font-size: 0.85rem;
                font-weight: 600;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 6px;
                transition: all 0.2s;
                color: #666;
            }
            .mode-btn.active {
                background: #fff;
                color: #1a1a1a;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            .mode-btn i { width: 14px; height: 14px; }

            .explorer-nav {
                flex: 1;
                display: flex;
                flex-direction: column;
                gap: 6px;
                overflow-y: auto;
            }
            .nav-item {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 10px 14px;
                border: none;
                background: transparent;
                border-radius: 10px;
                cursor: pointer;
                color: #666;
                transition: all 0.2s ease;
                font-family: 'Inter', sans-serif;
                font-weight: 500;
                text-align: left;
                font-size: 0.9rem;
            }
            .nav-item:hover { background: #fff; color: #1a1a1a; }
            .nav-item.active { background: var(--accent-color); color: #fff; }
            .nav-item i { width: 18px; height: 18px; }

            .explorer-close-btn {
                margin-top: 20px;
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 12px 16px;
                border: 1px solid #eee;
                background: #fff;
                border-radius: 12px;
                cursor: pointer;
                color: #ff4757;
                font-weight: 600;
                transition: all 0.2s;
            }
            .explorer-close-btn:hover { background: #ff4757; color: #fff; }

            /* Main Content */
            .explorer-main {
                flex: 1;
                display: flex;
                flex-direction: column;
                background: #fff;
            }
            .explorer-header {
                padding: 20px 24px;
                border-bottom: 1px solid #eee;
                display: flex;
                align-items: center;
            }
            .search-wrapper {
                position: relative;
                flex: 1;
                max-width: 400px;
                display: flex;
                align-items: center;
            }
            .search-wrapper i, .search-wrapper svg {
                position: absolute;
                left: 16px;
                color: #aaa;
                width: 18px;
                height: 18px;
                pointer-events: none;
            }
            .search-wrapper input {
                width: 100%;
                padding: 10px 16px 10px 44px;
                border: 2px solid #f0f0f0;
                border-radius: 12px;
                outline: none;
                font-family: 'Inter', sans-serif;
                transition: all 0.2s;
                font-size: 0.95rem;
            }
            .search-wrapper input:focus {
                border-color: #f9812a;
                box-shadow: 0 0 0 4px rgba(249, 129, 42, 0.1);
            }

            .explorer-body {
                flex: 1;
                padding: 24px;
                overflow-y: auto;
                display: block;
                align-content: flex-start;
            }
            
            /* Tiles Lexique (Standardisé avec Body) */
            .body-language-card {
                grid-column: 1 / -1;
                background: #fff;
                border: 1px solid #eee;
                border-radius: 16px;
                padding: 16px 20px;
                margin-bottom: 8px;
                border-left-width: 6px;
            }
            .body-language-card h3 {
                margin: 0 0 12px 0;
                font-family: 'Outfit', sans-serif;
                font-size: 1.1rem;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .signal-list {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
            }
            .signal-item {
                background: #f1f2f6;
                padding: 6px 14px;
                border-radius: 20px;
                font-size: 0.9rem;
                color: #444;
                cursor: pointer;
                transition: all 0.2s;
                border: 1px solid transparent;
            }
            .signal-item:hover {
                background: #fff;
                color: #1a1a1a;
                transform: scale(1.05);
            }

            .explorer-footer {
                padding: 16px 24px;
                background: #fdfdfd;
                border-top: 1px solid #eee;
                font-style: italic;
                color: #888;
                font-size: 0.9rem;
                display: flex;
                justify-content: center;
            }

            /* Emotion Groups (hierarchical 3-level wheel display) */
            .emotion-group {
                margin-bottom: 16px;
            }
            .emotion-group-header {
                margin-bottom: 8px;
            }
            .emotion-group-label {
                display: inline-block;
                padding: 5px 14px;
                border-radius: 8px;
                font-weight: 700;
                font-size: 0.85rem;
                letter-spacing: 0.05em;
                cursor: pointer;
                transition: all 0.2s;
                font-family: 'Outfit', sans-serif;
            }
            .emotion-group-label:hover {
                filter: brightness(0.9);
                transform: translateX(2px);
            }
            .emotion-group-words {
                display: flex;
                flex-wrap: wrap;
                gap: 6px;
                padding-left: 16px;
                margin-top: 6px;
            }
            .signal-item-sub {
                font-size: 0.85rem;
                background: #f8f9fa;
                opacity: 0.9;
            }
        `;
        document.head.appendChild(style);
    },

    /**
     * Rendu global.
     */
    render() {
        this.renderNav();
        this.renderContent();
    },

    /**
     * Rendu de la navigation latérale.
     */
    renderNav() {
        const nav = document.getElementById('explorerNav');
        if (!nav) return;

        const data = EmotionWheelData.getData();

        if (this.currentMode === 'lexicon') {
            nav.innerHTML = data.wedges.map(w => `
                <button class="nav-item ${this.currentCategory === w.id ? 'active' : ''}" 
                        onclick="EmotionWheelView.setCategory('${w.id}')"
                        style="--accent-color: ${w.color}">
                    <i data-lucide="${this.getIconForCategory(w.id)}"></i>
                    <span>${Localization.t('emotion.lexicon.' + w.id + '.label')}</span>
                </button>
            `).join('');
        } else {
            // Pour le corps, on liste toutes les catégories du tableau
            nav.innerHTML = data.bodyLanguage.map((item, i) => `
                <button class="nav-item ${this.currentCategory === item.category ? 'active' : ''}" 
                        onclick="EmotionWheelView.setCategory('${item.category}')"
                        style="--accent-color: #f9812a">
                    <i data-lucide="${this.getIconForBodyLanguage(item.category)}"></i>
                    <span>${item.category}</span>
                </button>
            `).join('');
        }
        if (typeof lucide !== 'undefined') lucide.createIcons();
    },

    /**
     * Rendu du contenu principal.
     */
    renderContent() {
        const grid = document.getElementById('emotionExplorerGrid');
        if (!grid) return;

        const query = this.searchQuery.toLowerCase();

        if (this.currentMode === 'lexicon') {
            this.renderLexicon(grid, query);
        } else {
            this.renderBodyLanguage(grid, query);
        }
    },

    renderLexicon(grid, query) {
        grid.style.display = 'block'; 
        const data = EmotionWheelData.getData();

        if (query) {
            // Mode recherche : liste plate tous groupes confondus
            let wordsToShow = [];
            const categoryTitle = `Résultats pour "${this.searchQuery}"`;
            data.wedges.forEach(wedge => {
                wedge.words.forEach(word => {
                    if (word.toLowerCase().includes(query)) {
                        wordsToShow.push({ word, color: wedge.color });
                    }
                });
            });
            grid.innerHTML = `
                <div class="body-language-card" style="border-color: #f9812a">
                    <h3 style="color: #f9812a"><i data-lucide="search"></i> ${categoryTitle}</h3>
                    <div class="signal-list">
                        ${wordsToShow.map(item => `
                            <div class="signal-item"
                                 onmouseenter="this.style.borderColor='${item.color}'"
                                 onmouseleave="this.style.borderColor='transparent'"
                                 onclick="EmotionWheelView.onSelectWord('${item.word}')">
                                ${item.word}
                            </div>
                        `).join('')}
                    </div>
                </div>`;
        } else {
            // Mode catégorie : affichage hiérarchique (groupes)
            const category = data.wedges.find(w => w.id === this.currentCategory) || data.wedges[0];
            const color = category.color;
            const groups = Array.isArray(category.groups) && category.groups.length > 0 ? category.groups : null;

            let contentHtml = '';
            if (groups) {
                contentHtml = groups.map(group => `
                    <div class="emotion-group">
                        <div class="emotion-group-header">
                            <span class="emotion-group-label"
                                  style="background: ${color}22; border-left: 3px solid ${color}; color: ${color}"
                                  onclick="EmotionWheelView.onSelectWord('${group.label}')">
                                ${group.label}
                            </span>
                        </div>
                        <div class="emotion-group-words">
                            ${(group.words || []).map(word => `
                                <div class="signal-item signal-item-sub"
                                     onmouseenter="this.style.borderColor='${color}'"
                                     onmouseleave="this.style.borderColor='transparent'"
                                     onclick="EmotionWheelView.onSelectWord('${word}')">
                                    ${word}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `).join('');
            } else {
                // Fallback : liste plate
                contentHtml = `<div class="signal-list">${category.words.map(word => `
                    <div class="signal-item"
                         onmouseenter="this.style.borderColor='${color}'"
                         onmouseleave="this.style.borderColor='transparent'"
                         onclick="EmotionWheelView.onSelectWord('${word}')">
                        ${word}
                    </div>`).join('')}</div>`;
            }

            grid.innerHTML = `
                <div class="body-language-card" style="border-color: ${color}">
                    <h3 style="color: ${color}">
                        <i data-lucide="${this.getIconForCategory(this.currentCategory)}"></i>
                        ${Localization.t('emotion.lexicon.' + category.id + '.label')}
                    </h3>
                    ${contentHtml}
                </div>`;
        }
        
        if (typeof lucide !== 'undefined') lucide.createIcons();
    },

    renderBodyLanguage(grid, query) {
        grid.style.display = 'block'; 
        const dataSet = EmotionWheelData.getData();
        let data = dataSet.bodyLanguage;

        if (query) {
            data = data.filter(item => 
                item.category.toLowerCase().includes(query) || 
                item.signals.some(s => s.toLowerCase().includes(query))
            );
        } else {
            // Filtrer par la catégorie sélectionnée dans la barre latérale
            let selected = data.find(item => item.category === this.currentCategory);
            // Si aucune sélectionnée ou invalide (ex: changement de mode), prendre la première
            if (!selected) {
                selected = data[0];
                this.currentCategory = selected.category;
                this.renderNav(); // Update active state
            }
            data = [selected];
        }

        grid.innerHTML = data.map(item => `
            <div class="body-language-card" style="border-color: #f9812a">
                <h3 style="color: #f9812a"><i data-lucide="${this.getIconForBodyLanguage(item.category)}"></i> ${item.category}</h3>
                <div class="signal-list">
                    ${item.signals.map(signal => `
                        <div class="signal-item" onclick="EmotionWheelView.onSelectWord('${signal}')">
                            ${signal}
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
        
        if (typeof lucide !== 'undefined') lucide.createIcons();
    },

    setCategory(catId) {
        this.currentCategory = catId;
        this.searchQuery = '';
        const searchInput = document.getElementById('emotionSearchInput');
        if (searchInput) {
            searchInput.value = '';
        }
        this.render();
    },

    handleSearch(val) {
        this.searchQuery = val;
        this.render();
    },

    onSelectWord(word) {
        const footer = document.getElementById('emotionExplorerFooter');
        if (footer) footer.innerHTML = `${Localization.t('emotion.toast.copied').replace('{0}', `<strong>${word}</strong>`)}`;
        
        navigator.clipboard.writeText(word).then(() => {
            this.showToast(Localization.t('emotion.toast.copied', word));
        });
    },

    showToast(text) {
        const notification = document.createElement('div');
        notification.textContent = text;
        notification.className = 'emotion-toast';
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 2500);
    },

    getIconForCategory(id) {
        const icons = { 'joy': 'sun', 'genius': 'zap', 'anger': 'flame', 'sadness': 'cloud-rain', 'fear': 'ghost', 'disgust': 'frown', 'surprise': 'zap' };
        return icons[id] || 'circle';
    },

    getIconForBodyLanguage(categoryName) {
        // Retrouver l'icône en cherchant la position de la catégorie dans les données courantes
        const data = EmotionWheelData.getData();
        const idx = data.bodyLanguage.findIndex(b => b.category === categoryName);
        if (idx >= 0 && EmotionWheelData.bodyDefs[idx]) {
            return EmotionWheelData.bodyDefs[idx].icon;
        }
        return 'accessibility';
    }
};

// Styles pour le toast
const explorerExtraStyle = document.createElement('style');
explorerExtraStyle.textContent = `
    .emotion-toast {
        position: fixed; bottom: 40px; left: 50%; transform: translateX(-50%);
        background: #1a1a1a; color: #fff; padding: 12px 24px; border-radius: 30px;
        z-index: 3000; font-size: 0.9rem; font-weight: 600;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3); pointer-events: none;
        animation: toastFadeInOut 2.5s forwards;
    }
    @keyframes toastFadeInOut {
        0% { opacity: 0; transform: translateX(-50%) translateY(20px); }
        15% { opacity: 1; transform: translateX(-50%) translateY(0); }
        85% { opacity: 1; transform: translateX(-50%) translateY(0); }
        100% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
    }
`;
document.head.appendChild(explorerExtraStyle);
