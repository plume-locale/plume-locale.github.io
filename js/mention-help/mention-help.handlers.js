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
        window.addEventListener('scroll', () => {
            if (MentionHelpViewModel.state.active) {
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
     * Ouvre le panneau de détails correspondant à l'entité.
     * Si le mode split n'est pas actif, il l'active et ouvre l'entité à droite.
     */
    openMentionDetails(type, id) {
        const isNumeric = /^\d+$/.test(id);
        const numericId = isNumeric ? parseInt(id) : id;
        const targetView = this.getViewFromMentionType(type);

        // Si le mode split n'est pas actif, on l'active d'abord
        if (typeof splitViewActive !== 'undefined' && !splitViewActive) {
            if (typeof activateSplitView === 'function') activateSplitView();
        }

        // On force le panneau de droite à afficher la bonne vue
        if (typeof switchSplitPanelView === 'function') {
            switchSplitPanelView('right', targetView);
            if (typeof setActiveSplitPanel === 'function') setActiveSplitPanel('right');
        }

        // Maintenant on ouvre les détails spécifiquement dans le panneau de droite
        switch (type) {
            case 'character':
                if (typeof openCharacterDetail === 'function') openCharacterDetail(numericId);
                break;
            case 'world':
                if (typeof openWorldDetail === 'function') openWorldDetail(numericId);
                break;
            case 'arc':
                if (typeof openArc === 'function') openArc(numericId);
                break;
            case 'globalnote':
                if (typeof GlobalNotesViewModel !== 'undefined') {
                    // Si c'est un board, on l'ouvre directement
                    if (id.startsWith('board_')) {
                        GlobalNotesViewModel.setActiveBoard(id);
                    } else {
                        // Si c'est un item, on cherche son board
                        const item = GlobalNotesRepository.getItems().find(i => i.id === id);
                        if (item && item.boardId) {
                            GlobalNotesViewModel.setActiveBoard(item.boardId);
                            // On attend un peu que le rendu soit fait
                            setTimeout(() => {
                                if (typeof GlobalNotesViewModel.selectItem === 'function') {
                                    GlobalNotesViewModel.selectItem(id);
                                }
                            }, 300);
                        }
                    }
                }
                break;
            case 'codex':
                if (typeof openCodexEntry === 'function') openCodexEntry(numericId);
                break;
        }
    },

    getViewFromMentionType(type) {
        const map = {
            'character': 'characters',
            'world': 'world',
            'arc': 'arcs',
            'globalnote': 'globalnotes',
            'codex': 'codex'
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
