/**
 * Search Handlers
 * Gère les événements et interactions utilisateur pour la recherche
 */

const SearchHandlers = {
    /**
     * Initialise les gestionnaires d'événements
     */
    init: () => {
        SearchHandlers.attachInputHandler();
        SearchHandlers.attachClickHandlers();
        SearchHandlers.attachKeyboardHandlers();
        SearchHandlers.attachOutsideClickHandler();
    },

    /**
     * Attache le gestionnaire de saisie
     */
    attachInputHandler: () => {
        const searchInput = document.getElementById('globalSearch');
        if (!searchInput) return;

        searchInput.addEventListener('input', (e) => {
            const query = e.target.value;
            SearchViewModel.performSearch(query);
        });
    },

    /**
     * Attache les gestionnaires de clic sur les résultats
     */
    attachClickHandlers: () => {
        const resultsContainer = document.getElementById('searchResults');
        if (!resultsContainer) return;

        // Délégation d'événement pour les résultats
        resultsContainer.addEventListener('click', (e) => {
            const resultItem = e.target.closest('.search-result-item');
            if (!resultItem) return;

            const index = parseInt(resultItem.dataset.index, 10);
            if (!isNaN(index)) {
                SearchHandlers.handleResultClick(index);
            }
        });
    },

    /**
     * Gère le clic sur un résultat
     * @param {number} index - Index du résultat
     */
    handleResultClick: (index) => {
        SearchViewModel.executeResultAction(index);
    },

    /**
     * Attache les gestionnaires de clavier
     */
    attachKeyboardHandlers: () => {
        const searchInput = document.getElementById('globalSearch');
        if (!searchInput) return;

        searchInput.addEventListener('keydown', (e) => {
            // Échap pour fermer
            if (e.key === 'Escape') {
                SearchHandlers.handleEscapeKey();
                e.preventDefault();
            }

            // Entrée pour sélectionner le premier résultat
            if (e.key === 'Enter') {
                SearchHandlers.handleEnterKey();
                e.preventDefault();
            }

            // Flèches pour naviguer (future amélioration)
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                SearchHandlers.handleArrowKeys(e.key);
                e.preventDefault();
            }
        });
    },

    /**
     * Gère la touche Échap
     */
    handleEscapeKey: () => {
        SearchViewModel.closeSearch();
    },

    /**
     * Gère la touche Entrée
     */
    handleEnterKey: () => {
        const results = SearchViewModel.getResults();
        if (results.length > 0) {
            SearchViewModel.executeResultAction(0);
        }
    },

    /**
     * Gère les touches fléchées pour la navigation
     * @param {string} key - Touche pressée
     */
    handleArrowKeys: (key) => {
        // TODO: Implémenter la navigation au clavier dans les résultats
        // Pour l'instant, cette fonctionnalité est en attente
        // Elle nécessiterait de maintenir un index de sélection dans le ViewModel
    },

    /**
     * Attache le gestionnaire de clic extérieur
     */
    attachOutsideClickHandler: () => {
        document.addEventListener('click', (e) => {
            SearchHandlers.handleOutsideClick(e);
        });
    },

    /**
     * Gère le clic à l'extérieur du conteneur de recherche
     * @param {Event} e - Événement de clic
     */
    handleOutsideClick: (e) => {
        // Vérifier si le clic est à l'extérieur du conteneur de recherche
        if (!SearchView.isInsideSearchContainer(e.target)) {
            if (SearchViewModel.isActive()) {
                SearchViewModel.closeSearch();
            }
        }
    },

    /**
     * Nettoie les gestionnaires d'événements
     */
    cleanup: () => {
        // Cette fonction peut être utilisée pour nettoyer les événements si nécessaire
        // Par exemple lors d'un changement de projet
    }
};
