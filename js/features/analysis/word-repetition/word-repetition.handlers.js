// ============================================================
// word-repetition.handlers.js - Gestionnaires d'événements
// ============================================================

/**
 * [MVVM : Handlers]
 * Gestionnaires d'événements pour l'analyseur de répétitions
 */
const WordRepetitionHandlers = {
    /**
     * [MVVM : Handlers]
     * Gestionnaire de rafraîchissement/analyse
     */
    onRefresh() {
        const state = WordRepetitionViewModel.getState();
        const result = WordRepetitionViewModel.analyze(state.currentScope);

        this._refreshPanel();

        if (result.success) {
            WordRepetitionView.notify(result.message, 'success');
        } else {
            WordRepetitionView.notify(result.message, 'error');
        }
    },

    /**
     * [MVVM : Handlers]
     * Gestionnaire de changement de scope
     * @param {string} scope - Nouveau scope
     */
    onScopeChange(scope) {
        WordRepetitionState.currentScope = scope;
        const result = WordRepetitionViewModel.analyze(scope);

        this._refreshPanel();

        if (result.success) {
            WordRepetitionView.notify(result.message, 'info');
        }
    },

    /**
     * [MVVM : Handlers]
     * Gestionnaire d'ouverture/fermeture des paramètres
     */
    onToggleSettings() {
        WordRepetitionView.toggleSettings();
    },

    /**
     * [MVVM : Handlers]
     * Gestionnaire de changement de préférence
     * @param {string} key - Clé de préférence
     * @param {*} value - Nouvelle valeur
     */
    onPrefChange(key, value) {
        WordRepetitionRepository.updatePreference(key, value);
        WordRepetitionView.notify(Localization.t('repetition.notify.pref_updated'), 'info');
    },

    /**
     * [MVVM : Handlers]
     * Gestionnaire de sélection d'une répétition
     * @param {string} repId - ID de la répétition
     */
    onSelectRepetition(repId) {
        const rep = WordRepetitionViewModel.selectRepetition(repId);
        if (rep) {
            // Surligner toutes les occurrences dans l'éditeur
            this._highlightAllOccurrences(rep.word);

            // Marquer visuellement l'item sélectionné
            document.querySelectorAll('.word-rep-item').forEach(el => el.classList.remove('selected'));
            const selectedItem = document.querySelector(`[data-rep-id="${repId}"]`);
            if (selectedItem) selectedItem.classList.add('selected');
        }
    },

    /**
     * [MVVM : Handlers]
     * Gestionnaire de fermeture du détail
     */
    onCloseDetail() {
        WordRepetitionState.selectedRepetition = null;
        WordRepetitionView.closeDetail();
    },

    /**
     * [MVVM : Handlers]
     * Gestionnaire d'affichage des suggestions
     * @param {string} repId - ID de la répétition
     */
    onShowSuggestions(repId) {
        const rep = WordRepetitionViewModel.selectRepetition(repId);
        if (rep) {
            WordRepetitionView.showDetail(rep);
        }
    },

    /**
     * [MVVM : Handlers]
     * Gestionnaire d'affichage des occurrences
     * @param {string} repId - ID de la répétition
     */
    onShowOccurrences(repId) {
        const rep = WordRepetitionViewModel.selectRepetition(repId);
        if (rep) {
            WordRepetitionView.showDetail(rep);
        }
    },

    /**
     * [MVVM : Handlers]
     * Gestionnaire d'ignorance d'un mot
     * @param {string} word - Mot à ignorer
     */
    onIgnoreWord(word) {
        const result = WordRepetitionViewModel.ignoreWord(word);
        if (result.success) {
            WordRepetitionView.markAsIgnored(word);
            WordRepetitionView.notify(result.message, 'success');
        }
    },

    /**
     * [MVVM : Handlers]
     * Gestionnaire de copie d'une suggestion
     * @param {string} suggestion - Mot suggéré
     */
    onCopySuggestion(suggestion) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(suggestion).then(() => {
                WordRepetitionView.notify(Localization.t('repetition.notify.copied', suggestion), 'success');
            });
        } else {
            // Fallback
            const textarea = document.createElement('textarea');
            textarea.value = suggestion;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            WordRepetitionView.notify(Localization.t('repetition.notify.copied', suggestion), 'success');
        }
    },

    /**
     * [MVVM : Handlers]
     * Gestionnaire de chargement de plus de suggestions
     * @param {string} word - Mot à rechercher
     */
    async onLoadMoreSuggestions(word) {
        const suggestions = await WordRepetitionViewModel.getSuggestions(word);

        if (suggestions.length > 0) {
            // Mettre à jour la répétition avec les nouvelles suggestions
            const report = WordRepetitionViewModel.getCurrentReport();
            if (report) {
                const rep = report.repetitions.find(r => r.word === word);
                if (rep) {
                    rep.suggestions = suggestions;
                    WordRepetitionView.showDetail(rep);
                }
            }
        } else {
            WordRepetitionView.notify(Localization.t('repetition.notify.no_more_suggestions'), 'info');
        }
    },

    /**
     * [MVVM : Handlers]
     * Gestionnaire de navigation vers une occurrence
     * @param {number} occIdx - Index de l'occurrence
     */
    onNavigateToOccurrence(occIdx) {
        const rep = WordRepetitionState.selectedRepetition;
        if (!rep || !rep.occurrences || !rep.occurrences[occIdx]) {
            console.warn('[WordRepetition] Occurrence non trouvée:', occIdx);
            return;
        }

        const occurrence = rep.occurrences[occIdx];
        const loc = occurrence.location;

        // Marquer l'occurrence comme active
        document.querySelectorAll('.occurrence-item').forEach(el => el.classList.remove('active'));
        const activeItem = document.querySelector(`[data-occ-idx="${occIdx}"]`);
        if (activeItem) activeItem.classList.add('active');

        // Vérifier si on doit changer de scène
        const needSceneChange = loc.sceneId && (
            loc.actId !== currentActId ||
            loc.chapterId !== currentChapterId ||
            loc.sceneId !== currentSceneId
        );

        if (needSceneChange && typeof openScene === 'function') {
            // Ouvrir la scène puis naviguer vers l'occurrence
            openScene(loc.actId, loc.chapterId, loc.sceneId);

            // Attendre que la scène soit chargée puis naviguer
            setTimeout(() => {
                this._scrollToWordOccurrence(occurrence.word, occurrence.position);
            }, 400);
        } else {
            // Scène déjà ouverte, naviguer directement
            this._scrollToWordOccurrence(occurrence.word, occurrence.position);
        }
    },

    /**
     * [MVVM : Handlers]
     * Scroll vers une occurrence spécifique du mot dans l'éditeur
     * @param {string} word - Mot à trouver
     * @param {number} targetPosition - Position approximative dans le texte
     * @private
     */
    _scrollToWordOccurrence(word, targetPosition) {
        const editors = document.querySelectorAll('.editor-textarea[contenteditable="true"]');
        if (editors.length === 0) return;

        // Trouver tous les highlights du mot
        const highlights = document.querySelectorAll('.word-rep-highlight');
        if (highlights.length === 0) {
            // Si pas de highlights, les créer d'abord
            this._highlightAllOccurrences(word);
            setTimeout(() => this._scrollToWordOccurrence(word, targetPosition), 100);
            return;
        }

        // Trouver le highlight le plus proche de la position cible
        let bestMatch = null;
        let bestDistance = Infinity;

        highlights.forEach((mark, idx) => {
            // Calculer la position approximative du highlight
            const textBefore = this._getTextBeforeElement(mark);
            const distance = Math.abs(textBefore.length - targetPosition);

            if (distance < bestDistance) {
                bestDistance = distance;
                bestMatch = mark;
            }
        });

        if (bestMatch) {
            // Scroll vers le highlight trouvé
            bestMatch.scrollIntoView({ behavior: 'smooth', block: 'center' });

            // Ajouter une animation pour attirer l'attention
            bestMatch.classList.add('word-rep-highlight-focus');
            setTimeout(() => {
                bestMatch.classList.remove('word-rep-highlight-focus');
            }, 2000);
        }
    },

    /**
     * [MVVM : Handlers]
     * Obtient le texte avant un élément dans l'éditeur
     * @param {HTMLElement} element - Élément cible
     * @returns {string} Texte avant l'élément
     * @private
     */
    _getTextBeforeElement(element) {
        const editor = element.closest('.editor-textarea');
        if (!editor) return '';

        let text = '';
        const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT, null, false);
        let node;

        while (node = walker.nextNode()) {
            if (element.contains(node) || element === node.parentElement) {
                break;
            }
            text += node.textContent;
        }

        return text;
    },

    /**
     * [MVVM : Handlers]
     * Gestionnaire d'ajout de mot ignoré
     */
    onAddIgnoredWord() {
        const word = prompt(Localization.t('repetition.prompt.ignore'));
        if (word && word.trim()) {
            const success = WordRepetitionRepository.addIgnoredWord(word.trim());
            if (success) {
                WordRepetitionView.notify(Localization.t('repetition.notify.word_added', word.trim()), 'success');
                this._refreshPanel();
            }
        }
    },

    /**
     * [MVVM : Handlers]
     * Gestionnaire de suppression de mot ignoré
     * @param {string} word - Mot à retirer
     */
    onRemoveIgnoredWord(word) {
        const success = WordRepetitionRepository.removeIgnoredWord(word);
        if (success) {
            WordRepetitionView.notify(Localization.t('repetition.notify.word_removed', word), 'success');
            this._refreshPanel();
        }
    },

    /**
     * [MVVM : Handlers]
     * Surligne toutes les occurrences d'un mot dans les éditeurs selon le scope
     * @param {string} word - Mot à surligner
     * @private
     */
    _highlightAllOccurrences(word) {
        // D'abord, nettoyer les surlignages précédents
        this._clearAllHighlights();

        // Trouver tous les éditeurs visibles
        const editors = document.querySelectorAll('.editor-textarea[contenteditable="true"]');
        if (editors.length === 0) return;

        const regex = new RegExp(`\\b(${this._escapeRegex(word)})\\b`, 'gi');
        let firstHighlight = null;
        let highlightCount = 0;

        editors.forEach(editor => {
            // Utiliser TreeWalker pour parcourir les noeuds texte
            const walker = document.createTreeWalker(
                editor,
                NodeFilter.SHOW_TEXT,
                {
                    acceptNode: function (node) {
                        // Ignorer les noeuds déjà dans un mark
                        if (node.parentElement && node.parentElement.classList.contains('word-rep-highlight')) {
                            return NodeFilter.FILTER_REJECT;
                        }
                        return NodeFilter.FILTER_ACCEPT;
                    }
                },
                false
            );

            const nodesToProcess = [];
            let node;
            while (node = walker.nextNode()) {
                if (regex.test(node.textContent)) {
                    nodesToProcess.push(node);
                }
                regex.lastIndex = 0; // Reset regex
            }

            // Traiter les noeuds en ordre inverse pour ne pas invalider les positions
            nodesToProcess.reverse().forEach(textNode => {
                const text = textNode.textContent;
                const fragment = document.createDocumentFragment();
                let lastIndex = 0;
                let match;

                regex.lastIndex = 0;
                while ((match = regex.exec(text)) !== null) {
                    // Texte avant le match
                    if (match.index > lastIndex) {
                        fragment.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
                    }

                    // Créer le mark
                    const mark = document.createElement('mark');
                    mark.className = 'word-rep-highlight';
                    mark.textContent = match[0];
                    fragment.appendChild(mark);

                    if (!firstHighlight) {
                        firstHighlight = mark;
                    }
                    highlightCount++;

                    lastIndex = regex.lastIndex;
                }

                // Texte restant après le dernier match
                if (lastIndex < text.length) {
                    fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
                }

                // Remplacer le noeud texte original
                if (fragment.childNodes.length > 0) {
                    textNode.parentNode.replaceChild(fragment, textNode);
                }
            });
        });

        // Scroll vers la première occurrence
        if (firstHighlight) {
            firstHighlight.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        // Afficher le nombre de surlignages
        if (highlightCount > 0) {
            WordRepetitionView.notify(Localization.t('repetition.notify.highlights', highlightCount), 'info');
        }
    },

    /**
     * [MVVM : Handlers]
     * Nettoie tous les surlignages de répétition
     * @private
     */
    _clearAllHighlights() {
        const highlights = document.querySelectorAll('.word-rep-highlight');
        highlights.forEach(mark => {
            const parent = mark.parentNode;
            // Remplacer le mark par son contenu texte
            const textNode = document.createTextNode(mark.textContent);
            parent.replaceChild(textNode, mark);
            // Normaliser pour fusionner les noeuds texte adjacents
            parent.normalize();
        });
    },

    /**
     * [MVVM : Handlers]
     * Échappe les caractères spéciaux regex
     * @param {string} str - Chaîne à échapper
     * @returns {string} Chaîne échappée
     * @private
     */
    _escapeRegex(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    },

    /**
     * [MVVM : Handlers]
     * Surligne un mot dans l'éditeur (navigation vers première occurrence)
     * @param {string} word - Mot à surligner
     * @private
     */
    _highlightWordInEditor(word) {
        const editor = document.querySelector('.editor-textarea');
        if (!editor) return;

        // Utiliser l'API de sélection
        const selection = window.getSelection();
        const range = document.createRange();

        // Trouver le premier mot correspondant
        const walker = document.createTreeWalker(
            editor,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );

        const regex = new RegExp(`\\b${word}\\b`, 'i');
        let node;
        while (node = walker.nextNode()) {
            const match = node.textContent.match(regex);
            if (match) {
                const startIndex = node.textContent.indexOf(match[0]);
                range.setStart(node, startIndex);
                range.setEnd(node, startIndex + match[0].length);
                selection.removeAllRanges();
                selection.addRange(range);

                // Scroll vers la sélection
                const rect = range.getBoundingClientRect();
                editor.scrollTop = rect.top - editor.getBoundingClientRect().top - 100;

                break;
            }
        }
    },

    /**
     * [MVVM : Handlers]
     * Rafraîchit le panneau
     * @private
     */
    _refreshPanel() {
        const container = document.getElementById('wordRepetitionContainer');
        if (container) {
            WordRepetitionView.renderPanel(container);
        }
    }
};

/**
 * [MVVM : Handlers]
 * Initialise le panneau de répétitions
 * @param {string} containerId - ID du conteneur
 */
function initWordRepetitionPanel(containerId = 'wordRepetitionContainer') {
    const container = document.getElementById(containerId);
    if (container) {
        WordRepetitionView.renderPanel(container);
    }
}

/**
 * [MVVM : Handlers]
 * Rafraîchit le panneau de répétitions si une scène change
 */
function refreshWordRepetitionOnSceneChange() {
    const state = WordRepetitionViewModel.getState();
    if (state.currentScope === WordRepetitionConfig.scope.SCENE) {
        // Clear le rapport pour forcer une nouvelle analyse
        WordRepetitionViewModel.clearReport();
        const container = document.getElementById('wordRepetitionContainer');
        if (container) {
            WordRepetitionView.renderPanel(container);
        }
    }
}

// Export pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        WordRepetitionHandlers,
        initWordRepetitionPanel,
        refreshWordRepetitionOnSceneChange
    };
}
