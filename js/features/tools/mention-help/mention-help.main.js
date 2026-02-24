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
    },

    /**
     * Affiche un guide rapide de découverte des mentions.
     */
    showGuide() {
        const btn = document.getElementById('toolMentionsBtn');
        if (btn && typeof MentionHelpView !== 'undefined') {
            MentionHelpView.renderGuide(btn);
        } else if (typeof showNotification === 'function') {
            const title = Localization.t('mention.guide.title');
            const content = Localization.t('mention.guide.content');
            showNotification(`<b>${title}</b><br>${content}`, 'info', 10000);
        }
    }
};

// Plus d'auto-init ici, c'est géré par 04.init.js pour respecter l'ordre de chargement.
