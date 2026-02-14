/**
 * Search ViewModel
 * Gère la logique métier et l'état de la recherche globale
 */

const SearchViewModel = {
    // État de la recherche
    state: SearchStateModel.create(),

    // Timeout pour le debounce
    searchTimeout: null,

    /**
     * Initialise le ViewModel
     */
    init: () => {
        SearchViewModel.state = SearchStateModel.create();
    },

    /**
     * Effectue une recherche avec debounce
     * @param {string} query - Terme de recherche
     */
    performSearch: (query) => {
        // Annuler la recherche précédente
        clearTimeout(SearchViewModel.searchTimeout);

        // Mettre à jour l'état
        SearchViewModel.state.query = query;

        // Si la requête est trop courte, réinitialiser
        if (!query || query.trim().length < 2) {
            SearchViewModel.clearResults();
            SearchView.hideResults();
            return;
        }

        // Indiquer le chargement
        SearchViewModel.state.isLoading = true;

        // Debounce de 300ms
        SearchViewModel.searchTimeout = setTimeout(() => {
            SearchViewModel.executeSearch(query.trim());
        }, 300);
    },

    /**
     * Exécute la recherche
     * @param {string} query - Terme de recherche
     */
    executeSearch: (query) => {
        try {
            // Rechercher dans toutes les sources
            const results = SearchRepository.searchAll(query);

            // Trier les résultats par pertinence
            const sortedResults = SearchViewModel.sortResults(results, query);

            // Mettre à jour l'état
            SearchViewModel.state.results = sortedResults;
            SearchViewModel.state.totalResults = sortedResults.length;
            SearchViewModel.state.isActive = true;
            SearchViewModel.state.isLoading = false;
            SearchViewModel.state.lastSearchTime = new Date();

            // Afficher les résultats
            SearchView.displayResults(sortedResults, query);

        } catch (error) {
            console.error('Erreur lors de la recherche:', error);
            SearchViewModel.state.isLoading = false;
            SearchView.showError(Localization.t('search.error'));
        }
    },

    /**
     * Trie les résultats par pertinence
     * @param {Array} results - Résultats de recherche
     * @param {string} query - Terme de recherche
     * @returns {Array} Résultats triés
     */
    sortResults: (results, query) => {
        const lowerQuery = query.toLowerCase();

        return results.sort((a, b) => {
            // Priorité 1: Correspondance exacte dans le titre
            const aExactTitle = a.title.toLowerCase() === lowerQuery;
            const bExactTitle = b.title.toLowerCase() === lowerQuery;
            if (aExactTitle && !bExactTitle) return -1;
            if (!aExactTitle && bExactTitle) return 1;

            // Priorité 2: Titre commence par la requête
            const aTitleStarts = a.title.toLowerCase().startsWith(lowerQuery);
            const bTitleStarts = b.title.toLowerCase().startsWith(lowerQuery);
            if (aTitleStarts && !bTitleStarts) return -1;
            if (!aTitleStarts && bTitleStarts) return 1;

            // Priorité 3: Type de résultat (Scènes en premier)
            const typeOrder = {
                'scene': 1,
                'character': 2,
                'world': 3,
                'timeline': 4,
                'note': 5,
                'codex': 6,
                'metro': 7,
                'todo': 8
            };
            const aTypeOrder = typeOrder[a.rawType] || 999;
            const bTypeOrder = typeOrder[b.rawType] || 999;
            if (aTypeOrder !== bTypeOrder) return aTypeOrder - bTypeOrder;

            // Priorité 4: Alphabétique par titre
            return a.title.localeCompare(b.title);
        });
    },

    /**
     * Exécute l'action d'un résultat
     * @param {number} index - Index du résultat
     */
    executeResultAction: (index) => {
        if (index >= 0 && index < SearchViewModel.state.results.length) {
            const result = SearchViewModel.state.results[index];
            if (result.action && typeof result.action === 'function') {
                result.action();
                SearchViewModel.closeSearch();
            }
        }
    },

    /**
     * Ferme la recherche
     */
    closeSearch: () => {
        SearchViewModel.clearResults();
        SearchView.hideResults();
        SearchView.clearInput();
    },

    /**
     * Efface les résultats
     */
    clearResults: () => {
        SearchViewModel.state.results = [];
        SearchViewModel.state.totalResults = 0;
        SearchViewModel.state.isActive = false;
        SearchViewModel.state.query = '';
    },

    /**
     * Obtient l'état actuel
     * @returns {Object} État de la recherche
     */
    getState: () => {
        return { ...SearchViewModel.state };
    },

    /**
     * Obtient les résultats actuels
     * @returns {Array} Résultats de recherche
     */
    getResults: () => {
        return [...SearchViewModel.state.results];
    },

    /**
     * Vérifie si la recherche est active
     * @returns {boolean} True si active
     */
    isActive: () => {
        return SearchViewModel.state.isActive;
    },

    /**
     * Obtient le nombre de résultats
     * @returns {number} Nombre de résultats
     */
    getResultCount: () => {
        return SearchViewModel.state.totalResults;
    }
};
