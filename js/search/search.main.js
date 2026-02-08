/**
 * Search Main
 * Point d'entrée principal pour le module de recherche globale
 */

const GlobalSearch = {
    /**
     * Initialise le module de recherche globale
     */
    init: () => {
        try {
            // Initialiser le ViewModel
            SearchViewModel.init();

            // Initialiser la Vue
            SearchView.init();

            // Initialiser les gestionnaires d'événements
            SearchHandlers.init();

            // Écouter le changement de langue pour rafraîchir les résultats si nécessaire
            window.addEventListener('localeChanged', () => {
                const state = SearchViewModel.getState();
                if (state.query && state.query.length >= 2) {
                    SearchViewModel.executeSearch(state.query);
                }
            });

            console.log('✓ Module de recherche globale initialisé');
        } catch (error) {
            console.error('Erreur lors de l\'initialisation de la recherche globale:', error);
        }
    },

    /**
     * Effectue une recherche programmatique
     * @param {string} query - Terme de recherche
     */
    search: (query) => {
        SearchViewModel.performSearch(query);
    },

    /**
     * Ferme la recherche
     */
    close: () => {
        SearchViewModel.closeSearch();
    },

    /**
     * Obtient les résultats actuels
     * @returns {Array} Résultats de recherche
     */
    getResults: () => {
        return SearchViewModel.getResults();
    },

    /**
     * Obtient l'état de la recherche
     * @returns {Object} État actuel
     */
    getState: () => {
        return SearchViewModel.getState();
    },

    /**
     * Focus sur le champ de recherche
     */
    focus: () => {
        SearchView.focusInput();
    },

    /**
     * Nettoie le module
     */
    cleanup: () => {
        SearchHandlers.cleanup();
        SearchViewModel.closeSearch();
    }
};

// Initialisation automatique au chargement du DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        GlobalSearch.init();
    });
} else {
    // DOM déjà chargé
    GlobalSearch.init();
}

// Compatibilité avec l'ancien code
// Ces fonctions sont exposées globalement pour maintenir la compatibilité
window.performGlobalSearch = (query) => GlobalSearch.search(query);
window.closeSearchResults = () => GlobalSearch.close();
window.executeSearchAction = (index) => SearchViewModel.executeResultAction(index);
