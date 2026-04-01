/**
 * [MVVM : Handlers]
 * MentionHelpHandlers - Gestion des événements globaux pour l'auto-complétion.
 */

const MentionHelpHandlers = {
    /**
     * Initialise les écouteurs d'événements globaux.
     */
    init() {
        console.log("MentionHelpHandlers: Initializing...");
        // Délégation d'événement sur le document pour capturer tous les inputs/textareas/contenteditables
        document.addEventListener('input', (e) => {
            const el = e.target;
            if (this.isTargetable(el)) {
                // On utilise requestAnimationFrame pour ne pas bloquer la saisie fluide
                requestAnimationFrame(() => MentionHelpViewModel.handleInput(el));
            }
        }, true);

        // Fermer sur scroll pour éviter que la popup ne reste orpheline
        window.addEventListener('scroll', (e) => {
            if (MentionHelpViewModel.state.active) {
                const popup = document.getElementById('mentionHelpPopup');
                if (popup && popup.contains(e.target)) return;
                MentionHelpViewModel.close();
            }
        }, true);

        document.addEventListener('keydown', (e) => {
            const el = e.target;
            if (this.isTargetable(el) && MentionHelpViewModel.state.active) {
                // On ne gère que les touches de navigation, on laisse le reste passer
                if (['ArrowDown', 'ArrowUp', 'Enter', 'Tab', 'Escape'].includes(e.key)) {
                    const handled = MentionHelpViewModel.handleKeyDown(e);
                    if (handled) {
                        e.stopPropagation();
                    }
                }
            }
        }, true);

        // Fermer la popup si on clique ailleurs, ou ouvrir les détails d'une mention
        // On utilise la phase de capture (true) pour être sûr d'intercepter le clic avant l'éditeur
        document.addEventListener('mousedown', (e) => {
            const popup = document.getElementById('mentionHelpPopup');

            // Si on clique en dehors de la popup active, on la ferme
            if (popup && MentionHelpViewModel.state.active && !popup.contains(e.target)) {
                MentionHelpViewModel.close();
            }

            // Gestion du clic sur une mention existante (hors mode édition de mention)
            const mention = e.target.closest('.mention');
            if (mention && !MentionHelpViewModel.state.active) {
                console.log("MentionHelp: Mention clicked", mention);
                const id = mention.getAttribute('data-mention-id');
                const type = mention.getAttribute('data-mention-type');
                this.openMentionDetails(type, id);

                // On empêche l'éditeur d'annuler éventuellement l'action
                e.preventDefault();
                e.stopPropagation();
            }
        }, true);
    },

    /**
     * Ouvre le panneau de détails correspondant à l'entité dans le panneau droit.
     * Utilise le système d'onglets moderne (tabsState) pour garantir la compatibilité.
     */
    openMentionDetails(type, id) {
        const isNumeric = /^\d+$/.test(id);
        const numericId = isNumeric ? parseInt(id) : id;

        // ── Système d'onglets (actif) ──────────────────────────────────────────
        if (typeof tabsState !== 'undefined' && typeof openTab === 'function') {
            // Activer le split si pas déjà actif
            if (!tabsState.isSplit) {
                tabsState.isSplit = true;
                // renderTabs sera appelé par openTab
            }

            // Forcer le panneau actif sur la droite
            tabsState.activePane = 'right';

            const opts = { paneId: 'right' };

            switch (type) {
                case 'character':
                    openTab('characters', { characterId: numericId }, opts);
                    break;
                case 'world':
                    openTab('world', { worldId: numericId }, opts);
                    break;
                case 'note':
                    openTab('notes', { noteId: numericId }, opts);
                    break;
                case 'codex':
                    openTab('codex', { codexId: numericId }, opts);
                    break;
                case 'notes':
                    openTab('notes', { noteId: numericId }, opts);
                    break;
                case 'globalnote':
                    // Les globalnotes n'ont pas d'onglet dédié : ouvrir via leur ViewModel
                    this._openGlobalNoteInSplit(id);
                    break;
                default:
                    console.warn('MentionHelp: type de mention inconnu :', type);
            }
            return;
        }

        // ── Fallback : système splitview legacy ────────────────────────────────
        const targetView = this.getViewFromMentionType(type);

        if (typeof splitViewActive !== 'undefined' && !splitViewActive) {
            if (typeof activateSplitView === 'function') activateSplitView();
        }

        if (typeof switchSplitPanelView === 'function') {
            switchSplitPanelView('right', targetView);
            if (typeof setActiveSplitPanel === 'function') setActiveSplitPanel('right');
        }

        // Petit délai pour laisser le panneau se rendre avant d'injecter le contenu
        setTimeout(() => {
            switch (type) {
                case 'character':
                    if (typeof openCharacterDetail === 'function') openCharacterDetail(numericId);
                    break;
                case 'world':
                    if (typeof openWorldDetail === 'function') openWorldDetail(numericId);
                    break;
                case 'codex':
                    if (typeof openCodexDetail === 'function') openCodexDetail(numericId);
                    break;
                case 'globalnote':
                    this._openGlobalNoteInSplit(id);
                    break;
            }
        }, 50);
    },

    /**
     * Ouvre un élément de Global Notes dans le panneau droit.
     */
    _openGlobalNoteInSplit(id) {
        if (typeof GlobalNotesViewModel === 'undefined') return;
        if (id.startsWith('board_')) {
            GlobalNotesViewModel.setActiveBoard(id);
        } else {
            const item = (typeof GlobalNotesRepository !== 'undefined')
                ? GlobalNotesRepository.getItems().find(i => i.id === id)
                : null;
            if (item && item.boardId) {
                GlobalNotesViewModel.setActiveBoard(item.boardId);
                setTimeout(() => {
                    if (typeof GlobalNotesViewModel.selectItem === 'function') {
                        GlobalNotesViewModel.selectItem(id);
                    }
                }, 300);
            }
        }
    },


    getViewFromMentionType(type) {
        const map = {
            'character': 'characters',
            'world':     'world',
            'note':      'notes',
            'arc':       'arcs',
            'globalnote':'globalnotes',
            'codex':     'codex'
        };
        return map[type] || 'editor';
    },

    /**
     * Vérifie si un élément est une cible valide pour l'auto-complétion.
     */
    isTargetable(el) {
        if (!el) return false;

        // Champs autorisés
        const isInput = el.tagName === 'INPUT' && (el.type === 'text' || !el.type);
        const isTextArea = el.tagName === 'TEXTAREA';
        const isEditable = el.isContentEditable;

        // Exclure certains champs si nécessaire
        const isExclude = el.id === 'searchProjectsInput' || el.classList.contains('no-mentions');

        return (isInput || isTextArea || isEditable) && !isExclude;
    }
};
