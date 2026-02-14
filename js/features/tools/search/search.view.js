/**
 * Search View
 * Gère le rendu DOM et l'affichage des résultats de recherche
 */

const SearchView = {
    // Éléments DOM
    elements: {
        searchInput: null,
        resultsContainer: null,
        searchContainer: null
    },

    /**
     * Initialise la vue
     */
    init: () => {
        SearchView.cacheElements();
    },

    /**
     * Met en cache les éléments DOM
     */
    cacheElements: () => {
        SearchView.elements.searchInput = document.getElementById('globalSearch');
        SearchView.elements.resultsContainer = document.getElementById('searchResults');
        SearchView.elements.searchContainer = document.querySelector('.search-container');
    },

    /**
     * Affiche les résultats de recherche
     * @param {Array} results - Résultats à afficher
     * @param {string} query - Terme de recherche
     */
    displayResults: (results, query) => {
        const container = SearchView.elements.resultsContainer;
        if (!container) return;

        // Aucun résultat
        if (results.length === 0) {
            SearchView.showNoResults();
            return;
        }

        // Générer le HTML des résultats
        const html = results.map((result, index) =>
            SearchView.renderResultItem(result, index, query)
        ).join('');

        container.innerHTML = html;
        container.classList.add('active');
    },

    /**
     * Rend un élément de résultat
     * @param {Object} result - Résultat à rendre
     * @param {number} index - Index du résultat
     * @param {string} query - Terme de recherche
     * @returns {string} HTML de l'élément
     */
    renderResultItem: (result, index, query) => {
        const highlightedTitle = SearchView.highlightQuery(result.title, query);
        const highlightedPreview = SearchView.highlightQuery(result.preview, query);

        return `
            <div class="search-result-item" data-index="${index}">
                <div class="search-result-type">${result.type}</div>
                <div class="search-result-title">${highlightedTitle}</div>
                <div class="search-result-path">${result.path}</div>
                <div class="search-result-preview">${highlightedPreview}</div>
            </div>
        `;
    },

    /**
     * Surligne le terme de recherche dans le texte
     * @param {string} text - Texte à surligner
     * @param {string} query - Terme de recherche
     * @returns {string} Texte avec surlignage
     */
    highlightQuery: (text, query) => {
        // Convertir en chaîne si ce n'est pas déjà le cas
        if (text === null || text === undefined) return '';
        text = String(text);

        if (!text || !query) return text || '';

        // Échapper les caractères spéciaux regex
        const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${escapedQuery})`, 'gi');

        return text.replace(regex, '<span class="search-highlight">$1</span>');
    },

    /**
     * Affiche un message "Aucun résultat"
     */
    showNoResults: () => {
        const container = SearchView.elements.resultsContainer;
        if (!container) return;

        container.innerHTML = `<div class="search-no-results">${Localization.t('search.no_results')}</div>`;
        container.classList.add('active');
    },

    /**
     * Affiche un message d'erreur
     * @param {string} message - Message d'erreur
     */
    showError: (message) => {
        const container = SearchView.elements.resultsContainer;
        if (!container) return;

        container.innerHTML = `<div class="search-error">${message}</div>`;
        container.classList.add('active');
    },

    /**
     * Cache les résultats
     */
    hideResults: () => {
        const container = SearchView.elements.resultsContainer;
        if (!container) return;

        container.classList.remove('active');
        container.innerHTML = '';
    },

    /**
     * Efface le champ de recherche
     */
    clearInput: () => {
        const input = SearchView.elements.searchInput;
        if (!input) return;

        input.value = '';
    },

    /**
     * Obtient la valeur du champ de recherche
     * @returns {string} Valeur du champ
     */
    getInputValue: () => {
        const input = SearchView.elements.searchInput;
        return input ? input.value : '';
    },

    /**
     * Définit la valeur du champ de recherche
     * @param {string} value - Nouvelle valeur
     */
    setInputValue: (value) => {
        const input = SearchView.elements.searchInput;
        if (!input) return;

        input.value = value;
    },

    /**
     * Vérifie si le conteneur de résultats est visible
     * @returns {boolean} True si visible
     */
    isResultsVisible: () => {
        const container = SearchView.elements.resultsContainer;
        return container ? container.classList.contains('active') : false;
    },

    /**
     * Focus sur le champ de recherche
     */
    focusInput: () => {
        const input = SearchView.elements.searchInput;
        if (!input) return;

        input.focus();
    },

    /**
     * Vérifie si un élément est dans le conteneur de recherche
     * @param {HTMLElement} element - Élément à vérifier
     * @returns {boolean} True si dans le conteneur
     */
    isInsideSearchContainer: (element) => {
        const container = SearchView.elements.searchContainer;
        return container ? container.contains(element) : false;
    }
};
