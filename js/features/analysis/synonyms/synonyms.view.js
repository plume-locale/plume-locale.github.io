// ============================================================
// synonyms.view.js - Vue pour l'interface synonymes
// ============================================================
// [MVVM : View] - Rendu DOM et gestion des événements

/**
 * Vue pour le dictionnaire de synonymes
 * [MVVM : View]
 */
const SynonymsView = {
    _debounceTimer: null,
    _modal: null,
    _onInsertCallback: null,

    /**
     * Initialise la vue et crée la modal
     * [MVVM : View]
     */
    init() {
        this._createModal();
        this._bindGlobalEvents();
        return this;
    },

    /**
     * Crée la structure HTML de la modal
     * [MVVM : View]
     */
    _createModal() {
        // Vérifier si la modal existe déjà
        if (document.getElementById(SynonymsConfig.ui.modalId)) {
            this._modal = document.getElementById(SynonymsConfig.ui.modalId);
            return;
        }

        const modal = document.createElement('div');
        modal.id = SynonymsConfig.ui.modalId;
        modal.className = 'synonyms-modal';
        modal.innerHTML = `
            <div class="synonyms-modal-content">
                <div class="synonyms-header">
                    <h3>${getSynonymsMessage('title')}</h3>
                    <button class="synonyms-close-btn" title="${getSynonymsMessage('close')}">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                <div class="synonyms-search-box">
                    <input
                        type="text"
                        id="${SynonymsConfig.ui.inputId}"
                        placeholder="${getSynonymsMessage('placeholder')}"
                        autocomplete="off"
                    />
                    <div class="synonyms-search-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                    </div>
                </div>

                <div class="synonyms-tabs">
                    <button class="synonyms-tab active" data-type="synonyms">${getSynonymsMessage('synonyms')}</button>
                    <button class="synonyms-tab" data-type="similar">${getSynonymsMessage('similar')}</button>
                    <button class="synonyms-tab" data-type="rhymes">${getSynonymsMessage('rhymes')}</button>
                    <button class="synonyms-tab" data-type="antonyms">${getSynonymsMessage('antonyms')}</button>
                </div>

                <div class="synonyms-status"></div>

                <div id="${SynonymsConfig.ui.resultsId}" class="synonyms-results"></div>

                <div class="synonyms-recent">
                    <span class="synonyms-recent-label">Récents:</span>
                    <div class="synonyms-recent-list"></div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this._modal = modal;
        this._bindModalEvents();
    },

    /**
     * Lie les événements de la modal
     * [MVVM : View]
     */
    _bindModalEvents() {
        const modal = this._modal;
        const input = modal.querySelector(`#${SynonymsConfig.ui.inputId}`);
        const closeBtn = modal.querySelector('.synonyms-close-btn');
        const tabs = modal.querySelectorAll('.synonyms-tab');

        // Fermer la modal
        closeBtn.addEventListener('click', () => this.close());

        // Fermer en cliquant sur le fond
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.close();
            }
        });

        // Recherche avec debounce
        input.addEventListener('input', (e) => {
            clearTimeout(this._debounceTimer);
            this._debounceTimer = setTimeout(() => {
                this._performSearch(e.target.value);
            }, SynonymsConfig.ui.debounceDelay);
        });

        // Recherche sur Enter
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                clearTimeout(this._debounceTimer);
                this._performSearch(e.target.value);
            } else if (e.key === 'Escape') {
                this.close();
            }
        });

        // Changement d'onglet
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                const word = input.value.trim();
                if (word) {
                    this._performSearch(word, tab.dataset.type);
                }
            });
        });
    },

    /**
     * Lie les événements globaux (raccourcis clavier)
     * [MVVM : View]
     */
    _bindGlobalEvents() {
        // Raccourci Ctrl+Shift+S pour ouvrir le dictionnaire
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'S') {
                e.preventDefault();
                this.toggle();
            }
        });
    },

    /**
     * Effectue une recherche
     * @param {string} word - Mot à rechercher
     * @param {string} type - Type de recherche
     * [MVVM : View]
     */
    async _performSearch(word, type = null) {
        if (!word.trim()) {
            this._renderResults([]);
            return;
        }

        // Récupérer le type actif si non spécifié
        if (!type) {
            const activeTab = this._modal.querySelector('.synonyms-tab.active');
            type = activeTab ? activeTab.dataset.type : SynonymsConfig.searchTypes.SYNONYMS;
        }

        this._showStatus(getSynonymsMessage('searching'), 'loading');

        const result = await SynonymsViewModel.searchWord(word, type);

        if (result.success) {
            this._renderResults(result.results, result.fromCache);
            if (result.results.length === 0) {
                this._showStatus(getSynonymsMessage('noResults'), 'empty');
            } else {
                this._hideStatus();
            }
        } else {
            this._renderResults([]);
            const message = result.isOffline
                ? getSynonymsMessage('offline')
                : getSynonymsMessage('error');
            this._showStatus(message, 'error');
        }

        this._updateRecentSearches();
    },

    /**
     * Affiche les résultats
     * @param {Array} results - Résultats à afficher
     * @param {boolean} fromCache - Si les résultats viennent du cache
     * [MVVM : View]
     */
    _renderResults(results, fromCache = false) {
        const container = this._modal.querySelector(`#${SynonymsConfig.ui.resultsId}`);

        if (results.length === 0) {
            container.innerHTML = '';
            return;
        }

        // Limiter le nombre de résultats affichés
        const limitedResults = results.slice(0, SynonymsConfig.ui.maxDisplayResults);

        // Grouper par catégorie si activé
        if (SynonymsConfig.ui.groupByCategory) {
            const groups = SynonymsViewModel.groupResultsByCategory(limitedResults);
            container.innerHTML = this._renderGroupedResults(groups, fromCache);
        } else {
            container.innerHTML = this._renderFlatResults(limitedResults, fromCache);
        }

        // Lier les événements des boutons
        this._bindResultEvents();
    },

    /**
     * Rendu des résultats groupés par catégorie
     * [MVVM : View]
     */
    _renderGroupedResults(groups, fromCache) {
        const categoryLabels = {
            nom: 'Noms',
            verbe: 'Verbes',
            adjectif: 'Adjectifs',
            adverbe: 'Adverbes',
            autre: 'Autres'
        };

        let html = '';
        for (const [category, items] of Object.entries(groups)) {
            html += `
                <div class="synonyms-category">
                    <div class="synonyms-category-label">${categoryLabels[category] || category}</div>
                    <div class="synonyms-words">
                        ${items.map(item => this._renderWordItem(item, fromCache)).join('')}
                    </div>
                </div>
            `;
        }
        return html;
    },

    /**
     * Rendu des résultats en liste plate
     * [MVVM : View]
     */
    _renderFlatResults(results, fromCache) {
        return `
            <div class="synonyms-words">
                ${results.map(item => this._renderWordItem(item, fromCache)).join('')}
            </div>
        `;
    },

    /**
     * Rendu d'un mot individuel
     * [MVVM : View]
     */
    _renderWordItem(item, fromCache) {
        const scoreDisplay = SynonymsConfig.ui.showScores && item.score
            ? `<span class="synonyms-score">${item.score}</span>`
            : '';

        return `
            <div class="synonyms-word-item" data-word="${item.word}">
                <span class="synonyms-word">${item.word}</span>
                ${scoreDisplay}
                <div class="synonyms-word-actions">
                    <button class="synonyms-action-btn synonyms-copy-btn" title="${getSynonymsMessage('copy')}">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                    </button>
                    <button class="synonyms-action-btn synonyms-insert-btn" title="${getSynonymsMessage('insert')}">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    },

    /**
     * Lie les événements des résultats
     * [MVVM : View]
     */
    _bindResultEvents() {
        const container = this._modal.querySelector(`#${SynonymsConfig.ui.resultsId}`);

        // Copier
        container.querySelectorAll('.synonyms-copy-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const word = btn.closest('.synonyms-word-item').dataset.word;
                const result = await SynonymsViewModel.copyToClipboard(word);
                if (result.success) {
                    this._showToast('Copié !');
                }
            });
        });

        // Insérer
        container.querySelectorAll('.synonyms-insert-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const word = btn.closest('.synonyms-word-item').dataset.word;
                this._insertWord(word);
            });
        });

        // Double-clic pour insérer
        container.querySelectorAll('.synonyms-word-item').forEach(item => {
            item.addEventListener('dblclick', () => {
                this._insertWord(item.dataset.word);
            });
        });
    },

    /**
     * Insère un mot (callback personnalisable)
     * @param {string} word - Mot à insérer
     * [MVVM : View]
     */
    _insertWord(word) {
        if (this._onInsertCallback) {
            this._onInsertCallback(word);
            this.close();
        } else {
            // Comportement par défaut: copier dans le presse-papiers
            SynonymsViewModel.copyToClipboard(word);
            this._showToast('Copié !');
        }
    },

    /**
     * Affiche un message de statut
     * [MVVM : View]
     */
    _showStatus(message, type = 'info') {
        const status = this._modal.querySelector('.synonyms-status');
        status.textContent = message;
        status.className = `synonyms-status synonyms-status-${type}`;
        status.style.display = 'block';
    },

    /**
     * Cache le message de statut
     * [MVVM : View]
     */
    _hideStatus() {
        const status = this._modal.querySelector('.synonyms-status');
        status.style.display = 'none';
    },

    /**
     * Met à jour la liste des recherches récentes
     * [MVVM : View]
     */
    _updateRecentSearches() {
        const recentList = this._modal.querySelector('.synonyms-recent-list');
        const recent = SynonymsViewModel.getRecentSearches(5);

        if (recent.length === 0) {
            recentList.innerHTML = '<span class="synonyms-recent-empty">Aucune recherche récente</span>';
            return;
        }

        recentList.innerHTML = recent.map(item => `
            <button class="synonyms-recent-item" data-word="${item.word}">${item.word}</button>
        `).join('');

        // Lier les événements
        recentList.querySelectorAll('.synonyms-recent-item').forEach(btn => {
            btn.addEventListener('click', () => {
                const input = this._modal.querySelector(`#${SynonymsConfig.ui.inputId}`);
                input.value = btn.dataset.word;
                this._performSearch(btn.dataset.word);
            });
        });
    },

    /**
     * Affiche un toast temporaire
     * @param {string} message - Message à afficher
     * [MVVM : View]
     */
    _showToast(message) {
        // Supprimer l'ancien toast s'il existe
        const existingToast = document.querySelector('.synonyms-toast');
        if (existingToast) {
            existingToast.remove();
        }

        const toast = document.createElement('div');
        toast.className = 'synonyms-toast';
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('synonyms-toast-fade');
            setTimeout(() => toast.remove(), 300);
        }, 1500);
    },

    /**
     * Ouvre la modal
     * @param {string} initialWord - Mot initial (optionnel)
     * @param {Function} onInsert - Callback lors de l'insertion
     * [MVVM : View]
     */
    open(initialWord = '', onInsert = null) {
        this._onInsertCallback = onInsert;
        SynonymsViewModel.openModal(initialWord);

        this._modal.classList.add('synonyms-modal-open');
        this._updateRecentSearches();

        const input = this._modal.querySelector(`#${SynonymsConfig.ui.inputId}`);
        input.value = initialWord;

        setTimeout(() => {
            input.focus();
            if (initialWord) {
                this._performSearch(initialWord);
            }
        }, 100);
    },

    /**
     * Ferme la modal
     * [MVVM : View]
     */
    close() {
        SynonymsViewModel.closeModal();
        this._modal.classList.remove('synonyms-modal-open');
        this._onInsertCallback = null;
    },

    /**
     * Bascule l'état de la modal
     * [MVVM : View]
     */
    toggle() {
        if (this._modal && this._modal.classList.contains('synonyms-modal-open')) {
            this.close();
        } else {
            // Par défaut, on essaie d'insérer le mot dans l'éditeur si on en trouve un
            const insertCallback = (word) => {
                if (typeof formatText === 'function') {
                    formatText('insertText', word);
                } else {
                    document.execCommand('insertText', false, word);
                }
            };
            this.openWithSelection(insertCallback);
        }
    },

    /**
     * Ouvre la modal avec le texte sélectionné
     * @param {Function} onInsert - Callback lors de l'insertion
     * [MVVM : View]
     */
    openWithSelection(onInsert = null) {
        // Restore selection if available
        const active = document.activeElement;
        const editor = (active && active.classList.contains('editor-textarea')) ? active : document.querySelector('.editor-textarea');

        if (editor && editor._lastRange) {
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(editor._lastRange);
        }

        const selection = window.getSelection().toString().trim();
        this.open(selection, onInsert);
    }
};

// Auto-initialisation au chargement du DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => SynonymsView.init());
} else {
    SynonymsView.init();
}

// Export pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SynonymsView };
}
