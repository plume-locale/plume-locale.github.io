// ============================================================
// synonyms.viewmodel.js - ViewModel pour les synonymes
// ============================================================
// [MVVM : ViewModel] - Logique métier et orchestration

/**
 * État global de l'interface synonymes
 * [MVVM : ViewModel]
 */
let synonymsState = SynonymsUIState.createInitialState();

/**
 * ViewModel pour les synonymes
 * [MVVM : ViewModel]
 */
const SynonymsViewModel = {
    /**
     * Recherche des synonymes pour un mot
     * @param {string} word - Mot à rechercher
     * @param {string} type - Type de recherche
     * @returns {Promise<Object>} Résultat de la recherche
     * [MVVM : ViewModel]
     */
    async searchWord(word, type = SynonymsConfig.searchTypes.SYNONYMS) {
        const cleanWord = word.toLowerCase().trim();

        if (!cleanWord) {
            return {
                success: false,
                error: 'Mot vide',
                results: [],
                fromCache: false
            };
        }

        // Mettre à jour l'état
        synonymsState.isLoading = true;
        synonymsState.currentWord = cleanWord;
        synonymsState.currentType = type;
        synonymsState.error = null;

        // Vérifier d'abord le cache
        const cachedEntry = SynonymsRepository.get(cleanWord, type);
        if (cachedEntry) {
            synonymsState.isLoading = false;
            synonymsState.results = cachedEntry.results;

            return {
                success: true,
                results: cachedEntry.results,
                fromCache: true,
                word: cleanWord,
                type: type
            };
        }

        // Si pas en cache, appeler l'API
        try {
            const results = await SynonymsService.fetch(cleanWord, type);

            // Créer l'objet recherche et le mettre en cache
            const search = SynonymsSearch.create(cleanWord, type);
            search.results = results;
            SynonymsRepository.set(search);

            // Mettre à jour l'état
            synonymsState.isLoading = false;
            synonymsState.results = results;

            // Ajouter à l'historique
            this._addToHistory(cleanWord, type);

            return {
                success: true,
                results: results,
                fromCache: false,
                word: cleanWord,
                type: type
            };

        } catch (error) {
            synonymsState.isLoading = false;
            synonymsState.error = error.message;
            synonymsState.results = [];

            return {
                success: false,
                error: error.message,
                results: [],
                fromCache: false,
                isOffline: !SynonymsService.isOnline()
            };
        }
    },

    /**
     * Recherche de synonymes
     * [MVVM : ViewModel]
     */
    async searchSynonyms(word) {
        return this.searchWord(word, SynonymsConfig.searchTypes.SYNONYMS);
    },

    /**
     * Recherche de mots similaires
     * [MVVM : ViewModel]
     */
    async searchSimilar(word) {
        return this.searchWord(word, SynonymsConfig.searchTypes.SIMILAR);
    },

    /**
     * Recherche de rimes
     * [MVVM : ViewModel]
     */
    async searchRhymes(word) {
        return this.searchWord(word, SynonymsConfig.searchTypes.RHYMES);
    },

    /**
     * Recherche d'antonymes
     * [MVVM : ViewModel]
     */
    async searchAntonyms(word) {
        return this.searchWord(word, SynonymsConfig.searchTypes.ANTONYMS);
    },

    /**
     * Retourne l'état actuel
     * @returns {Object} État de l'interface
     * [MVVM : ViewModel]
     */
    getState() {
        return { ...synonymsState };
    },

    /**
     * Ouvre la modal synonymes
     * @param {string} initialWord - Mot initial (optionnel)
     * @returns {Object} Résultat de l'opération
     * [MVVM : ViewModel]
     */
    openModal(initialWord = '') {
        synonymsState.isOpen = true;
        synonymsState.currentWord = initialWord;
        synonymsState.results = [];
        synonymsState.error = null;

        return {
            success: true,
            sideEffects: ['RENDER_MODAL']
        };
    },

    /**
     * Ferme la modal synonymes
     * @returns {Object} Résultat de l'opération
     * [MVVM : ViewModel]
     */
    closeModal() {
        synonymsState.isOpen = false;
        synonymsState.isLoading = false;

        return {
            success: true,
            sideEffects: ['CLOSE_MODAL']
        };
    },

    /**
     * Réinitialise l'état
     * [MVVM : ViewModel]
     */
    reset() {
        synonymsState = SynonymsUIState.createInitialState();
        return { success: true };
    },

    /**
     * Ajoute un mot à l'historique de recherche
     * @param {string} word - Mot recherché
     * @param {string} type - Type de recherche
     * [MVVM : ViewModel]
     */
    _addToHistory(word, type) {
        // Éviter les doublons consécutifs
        const lastSearch = synonymsState.history[0];
        if (lastSearch && lastSearch.word === word && lastSearch.type === type) {
            return;
        }

        synonymsState.history.unshift({ word, type, timestamp: Date.now() });

        // Limiter l'historique à 20 entrées
        if (synonymsState.history.length > 20) {
            synonymsState.history = synonymsState.history.slice(0, 20);
        }
    },

    /**
     * Retourne l'historique des recherches
     * @returns {Array} Historique
     * [MVVM : ViewModel]
     */
    getHistory() {
        return [...synonymsState.history];
    },

    /**
     * Retourne les recherches récentes depuis le cache
     * @param {number} limit - Nombre max
     * @returns {Array} Recherches récentes
     * [MVVM : ViewModel]
     */
    getRecentSearches(limit = 10) {
        return SynonymsRepository.getRecentSearches(limit);
    },

    /**
     * Vide le cache
     * @returns {Object} Résultat
     * [MVVM : ViewModel]
     */
    clearCache() {
        SynonymsRepository.clear();
        return {
            success: true,
            message: 'Cache vidé'
        };
    },

    /**
     * Retourne les stats du cache
     * @returns {Object} Statistiques
     * [MVVM : ViewModel]
     */
    getCacheStats() {
        return SynonymsRepository.getStats();
    },

    /**
     * Copie un mot dans le presse-papiers
     * @param {string} word - Mot à copier
     * @returns {Promise<Object>} Résultat
     * [MVVM : ViewModel]
     */
    async copyToClipboard(word) {
        try {
            await navigator.clipboard.writeText(word);
            return { success: true, word };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Groupe les résultats par catégorie grammaticale
     * @param {Array} results - Résultats à grouper
     * @returns {Object} Résultats groupés
     * [MVVM : ViewModel]
     */
    groupResultsByCategory(results) {
        const groups = {
            nom: [],
            verbe: [],
            adjectif: [],
            adverbe: [],
            autre: []
        };

        results.forEach(result => {
            const category = result.category || 'autre';
            if (groups[category]) {
                groups[category].push(result);
            } else {
                groups.autre.push(result);
            }
        });

        // Filtrer les groupes vides
        return Object.fromEntries(
            Object.entries(groups).filter(([_, items]) => items.length > 0)
        );
    }
};

// Export pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SynonymsViewModel, synonymsState };
}
