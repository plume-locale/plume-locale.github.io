// ============================================================
// stylistic-analysis.handlers.js — Événements
// ============================================================

const StylisticAnalysisHandlers = {
    onRefresh() {
        const container = document.getElementById('stylisticAnalysisContainer');
        if (!container) return;

        if (typeof StylisticAnalysisViewModel !== 'undefined' && StylisticAnalysisViewModel.state) {
            StylisticAnalysisViewModel.state.isAnalyzing = true;
            if (typeof StylisticAnalysisView !== 'undefined') {
                StylisticAnalysisView.renderPanel(container);
            }
        }

        setTimeout(() => {
            try {
                if (typeof StylisticAnalysisViewModel !== 'undefined') {
                    StylisticAnalysisViewModel.analyzeCurrentScene();
                    if (typeof StylisticAnalysisView !== 'undefined') {
                        StylisticAnalysisView.renderPanel(container);
                    }
                }
            } catch (err) {
                console.error('[StylisticAnalysis] Fatal error during onRefresh:', err);
                container.innerHTML = `<div style="padding:1rem; color:var(--accent-red)">Error: ${err.message}</div>`;
            }
        }, 50);
    },

    onStyleChange(styleId) {
        if (typeof StylisticAnalysisViewModel !== 'undefined') {
            StylisticAnalysisViewModel.setStyle(styleId);
            this.onRefresh();
        }
    },

    onToggleStopOnClose(value) {
        if (typeof StylisticAnalysisViewModel !== 'undefined') {
            StylisticAnalysisViewModel.setStopOnClose(value);
        }
    },

    /**
     * Surligne un mot dans l'éditeur et scroll vers lui
     * @param {string} word - Mot à surligner
     */
    onHighlightWord(word) {
        this._clearAllHighlights();
        this._highlightAllOccurrences(word);

        const first = document.querySelector('.stylistic-highlight');
        if (first) {
            first.scrollIntoView({ behavior: 'smooth', block: 'center' });
            first.classList.add('stylistic-highlight-focus');
        }
    },

    /**
     * Applique un remplacement par un synonyme
     * @param {string} word - Mot original
     * @param {string} replacement - Nouveau mot
     */
    onApplySuggestion(word, replacement) {
        const focused = document.querySelector('.stylistic-highlight-focus');
        if (focused) {
            StylisticAnalysisHandlers._applyReplacement(focused, replacement);
        } else {
            const first = document.querySelector('.stylistic-highlight');
            if (first) {
                first.scrollIntoView({ behavior: 'smooth', block: 'center' });
                first.classList.add('stylistic-highlight-focus');
                if (typeof WordRepetitionView !== 'undefined') {
                    WordRepetitionView.notify(Localization.t('repetition.notify.select_occurrence_first') || 'Sélectionnez d\'abord l\'occurrence à remplacer', 'info');
                }
            } else {
                StylisticAnalysisHandlers._highlightAllOccurrences(word);
                setTimeout(() => StylisticAnalysisHandlers.onApplySuggestion(word, replacement), 100);
            }
        }
    },

    /**
     * Gère le clic sur un mot surligné dans l'éditeur
     */
    onHighlightClick(element, event) {
        if (event) event.stopPropagation();
        
        document.querySelectorAll('.stylistic-highlight-focus').forEach(el => el.classList.remove('stylistic-highlight-focus'));
        element.classList.add('stylistic-highlight-focus');

        const word = element.textContent.trim().toLowerCase();
        
        // 1. Chercher d'abord si c'est un connecteur logique connu
        const connectorSuggestions = StylisticAnalysisHandlers._getConnectorSuggestions(word);
        if (connectorSuggestions.length > 0) {
            StylisticAnalysisHandlers._showReplacementMenu(element, connectorSuggestions);
            return;
        }

        // 2. Sinon, chercher des synonymes classiques
        if (typeof SynonymsService !== 'undefined') {
            SynonymsService.fetchSynonyms(word).then(results => {
                if (results && results.length > 0) {
                    const suggestions = results.slice(0, 5).map(r => ({ suggestion: r.word }));
                    StylisticAnalysisHandlers._showReplacementMenu(element, suggestions);
                }
            }).catch(err => {
                console.warn('[StylisticAnalysisHandlers] Erreur synonymes:', err);
            });
        }
    },

    /**
     * Trouve des alternatives pour un connecteur logique
     * @private
     */
    _getConnectorSuggestions(word) {
        const lang = (typeof Localization !== 'undefined' && Localization.getCurrentLang) ? Localization.getCurrentLang() : 'fr';
        const data = StylisticAnalysisData[lang] || StylisticAnalysisData['fr'];
        if (!data || !data.ConnectorsData) return [];

        for (const catId in data.ConnectorsData) {
            const category = data.ConnectorsData[catId];
            if (category.items.includes(word)) {
                // Retourner d'autres mots de la même catégorie
                return category.items
                    .filter(item => item !== word)
                    .slice(0, 6)
                    .map(item => ({ suggestion: item }));
            }
        }
        return [];
    },

    /**
     * Surligne tous les termes d'un certain sentiment
     * @param {'positive'|'negative'} type 
     */
    onHighlightSentiment(type) {
        const state = StylisticAnalysisViewModel.getState();
        const container = document.getElementById('stylisticAnalysisContainer');

        if (state.highlightMode === type) {
            this._clearAllHighlights();
            return;
        }

        this._clearAllHighlights();
        
        if (!state || !state.sentiment || !state.sentiment.scoredWords) return;

        const words = state.sentiment.scoredWords
            .filter(w => type === 'positive' ? w.score > 0 : w.score < 0)
            .map(w => w.word);

        if (words.length === 0) {
             StylisticAnalysisViewModel.setHighlightMode(type);
             if (container) StylisticAnalysisView.renderPanel(container);
             return;
        }

        this._highlightWordsList(words, `sentiment-${type}`);
        StylisticAnalysisViewModel.setHighlightMode(type);
        if (container) StylisticAnalysisView.renderPanel(container);

        const first = document.querySelector(`.stylistic-highlight.sentiment-${type}`);
        if (first) {
            first.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    },

    /**
     * Surligne tous les termes positifs ET négatifs
     */
    onHighlightSentimentBoth() {
        const state = StylisticAnalysisViewModel.getState();
        const container = document.getElementById('stylisticAnalysisContainer');

        if (state.highlightMode === 'both') {
            this._clearAllHighlights();
            return;
        }

        this._clearAllHighlights();
        
        if (!state || !state.sentiment || !state.sentiment.scoredWords) return;

        const posWords = state.sentiment.scoredWords.filter(w => w.score > 0).map(w => w.word);
        const negWords = state.sentiment.scoredWords.filter(w => w.score < 0).map(w => w.word);

        if (posWords.length === 0 && negWords.length === 0) {
            StylisticAnalysisViewModel.setHighlightMode('both');
            if (container) StylisticAnalysisView.renderPanel(container);
            return;
        }

        // On doit le faire en une fois ou gérer les classes multiples
        // Utilisons une approche qui permet de colorer différemment
        this._highlightWordsList(posWords, 'sentiment-positive');
        this._highlightWordsList(negWords, 'sentiment-negative');

        StylisticAnalysisViewModel.setHighlightMode('both');
        if (container) StylisticAnalysisView.renderPanel(container);

        const first = document.querySelector('.stylistic-highlight.sentiment-positive, .stylistic-highlight.sentiment-negative');
        if (first) {
            first.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    },


    /**
     * Surligne toutes les occurrences d'une liste de mots
     * @private
     */
    _highlightWordsList(words, extraClass = '') {
        const editors = document.querySelectorAll('.editor-textarea[contenteditable="true"]');
        if (editors.length === 0) return;

        // Trier par longueur décroissante pour éviter les conflits de n-grams
        const sortedWords = [...new Set(words)].sort((a, b) => b.length - a.length);
        
        // Créer une regex globale pour tous les mots
        const escapedWords = sortedWords.map(w => w.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
        const regex = new RegExp(`(^|[^\\wàâéèêëîïôùûüç])(${escapedWords.join('|')})(?![\\wàâéèêëîïôùûüç])`, 'gi');

        editors.forEach(editor => {
            const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT, null, false);
            const textNodes = [];
            let node;
            while (node = walker.nextNode()) textNodes.push(node);

            textNodes.forEach(textNode => {
                const content = textNode.textContent;
                if (regex.test(content)) {
                    const fragment = document.createDocumentFragment();
                    let lastIndex = 0;
                    let match;

                    regex.lastIndex = 0;
                    while ((match = regex.exec(content)) !== null) {
                        const prefixLength = match[1].length;
                        const matchIndex = match.index + prefixLength;
                        const matchedWord = match[2];

                        fragment.appendChild(document.createTextNode(content.substring(lastIndex, matchIndex)));

                        const mark = document.createElement('mark');
                        mark.className = `stylistic-highlight ${extraClass}`.trim();
                        mark.textContent = matchedWord;
                        mark.onclick = (e) => StylisticAnalysisHandlers.onHighlightClick(mark, e);
                        fragment.appendChild(mark);

                        lastIndex = matchIndex + matchedWord.length;
                    }

                    fragment.appendChild(document.createTextNode(content.substring(lastIndex)));
                    textNode.parentNode.replaceChild(fragment, textNode);
                }
            });
        });
    },

    /**
     * Surligne toutes les occurrences d'un mot
     * @private
     */
    _highlightAllOccurrences(word) {
        this._highlightWordsList([word]);
    },

    /**
     * Efface tous les surlignages d'analyse stylistique
     */
    _clearAllHighlights() {
        const highlights = document.querySelectorAll('.stylistic-highlight');
        highlights.forEach(h => {
            const parent = h.parentNode;
            if (!parent) return;
            const textNode = document.createTextNode(h.textContent);
            parent.replaceChild(textNode, h);
            parent.normalize();
        });
        this._closeReplacementMenu();
        
        // Reset state
        if (typeof StylisticAnalysisViewModel !== 'undefined') {
            StylisticAnalysisViewModel.resetHighlightMode();
            const container = document.getElementById('stylisticAnalysisContainer');
            if (container) StylisticAnalysisView.renderPanel(container);
        }
    },


    /**
     * Affiche le menu flottant de remplacement
     * @private
     */
    _showReplacementMenu(target, suggestions) {
        this._closeReplacementMenu();

        const menu = document.createElement('div');
        menu.id = 'stylisticReplacementMenu';
        menu.className = 'word-rep-replacement-menu'; // Réutiliser le style existant ou proche
        
        let html = `<div class="replacement-menu-header">${Localization.t('repetition.detail.suggestions_title') || 'Suggestions de remplacement'}</div>`;
        
        suggestions.forEach(sug => {
            html += `
                <button class="replacement-menu-item" onclick="StylisticAnalysisHandlers._applyReplacementFromMenu(this, '${sug.suggestion.replace(/'/g, "\\'")}')">
                    <span>${sug.suggestion}</span>
                    <i data-lucide="check" style="width: 12px; height: 12px;"></i>
                </button>
            `;
        });

        menu.innerHTML = html;
        document.body.appendChild(menu);
        
        if (typeof lucide !== 'undefined') lucide.createIcons({ root: menu });

        const rect = target.getBoundingClientRect();
        const menuRect = menu.getBoundingClientRect();
        
        let top = rect.bottom + 5;
        let left = rect.left;

        if (top + menuRect.height > window.innerHeight) {
            top = rect.top - menuRect.height - 5;
        }
        
        if (left + menuRect.width > window.innerWidth) {
            left = window.innerWidth - menuRect.width - 10;
        }

        menu.style.top = `${top}px`;
        menu.style.left = `${left}px`;

        const closeHandler = (e) => {
            if (!menu.contains(e.target) && e.target !== target) {
                StylisticAnalysisHandlers._closeReplacementMenu();
                document.removeEventListener('mousedown', closeHandler);
            }
        };
        setTimeout(() => document.addEventListener('mousedown', closeHandler), 10);
    },

    _closeReplacementMenu() {
        const menu = document.getElementById('stylisticReplacementMenu');
        if (menu) menu.remove();
    },

    _applyReplacementFromMenu(menuButton, replacement) {
        const focused = document.querySelector('.stylistic-highlight-focus');
        if (focused) {
            StylisticAnalysisHandlers._applyReplacement(focused, replacement);
        }
    },

    _applyReplacement(element, replacement) {
        const original = element.textContent;
        const parent = element.parentNode;
        const editor = element.closest('.editor-textarea');
        
        const textNode = document.createTextNode(replacement);
        parent.replaceChild(textNode, element);
        parent.normalize();

        if (editor) {
            if (typeof updateChapterSceneContent === 'function') {
                const actId = editor.getAttribute('data-act-id');
                const chapterId = editor.getAttribute('data-chapter-id');
                const sceneId = editor.getAttribute('data-scene-id');
                if (actId && chapterId && sceneId) {
                    updateChapterSceneContent(actId, chapterId, sceneId);
                }
            } else if (typeof updateSceneContent === 'function') {
                updateSceneContent();
            }
        }

        if (typeof WordRepetitionView !== 'undefined') {
            WordRepetitionView.notify(Localization.t('repetition.notify.replaced', original, replacement) || `Remplacé "${original}" par "${replacement}"`, 'success');
        }
        this._closeReplacementMenu();

        setTimeout(() => this.onRefresh(), 500);
    },

    /**
     * Ouvre la modale d'aide pour les métriques de sentiment
     * @param {'score'|'intensity'} type 
     */
    openHelpModal(type) {
        const modal = document.getElementById('infoModal');
        const titleEl = document.getElementById('infoModalTitle');
        const bodyEl = document.getElementById('infoModalBody');
        
        if (!modal || !titleEl || !bodyEl) return;

        let title = Localization.t('stylistic.help.title') || 'Aide';
        let content = '';

        if (type === 'score') {
            title = Localization.t('stylistic.sentiment.score_title') || 'Score Global';
            content = Localization.t('stylistic.sentiment.score_help');
        } else if (type === 'intensity') {
            title = Localization.t('stylistic.sentiment.intensity_title') || 'Force Émotionnelle';
            content = Localization.t('stylistic.sentiment.intensity_help');
        }

        titleEl.textContent = title;
        bodyEl.innerHTML = (content || '').replace(/\n/g, '<br>');

        if (typeof openModal === 'function') {
            openModal('infoModal');
        } else {
            modal.classList.add('active');
        }
    }
};

