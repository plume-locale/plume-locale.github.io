/**
 * [MVVM : Main]
 * MentionHelp - Point d'entrée du module.
 */

const MentionHelp = {
    /**
     * Initialisation du module.
     */
    init() {
        console.log('MentionHelp: Initializing...');
        MentionHelpHandlers.init();
    },

    /**
     * Appelé lors d'un rafraîchissement global (ex: changement de langue).
     */
    refresh() {
        if (MentionHelpViewModel.state.active) {
            MentionHelpViewModel.updateSuggestions();
        }
    }
};

// Pas d'auto-init ici si les Handlers s'en occupent déjà,
// mais on l'ajoute au JS_ORDER pour être prêt.
