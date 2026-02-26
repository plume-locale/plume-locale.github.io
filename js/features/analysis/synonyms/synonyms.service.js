// ============================================================
// synonyms.service.js - Service pour les synonymes (multi-langues)
// ============================================================
// [MVVM : Service] - Délègue à SynonymsDictionaryManager (fr/en/de/es)

/**
 * Service de synonymes - Multilingue (fr, en, de, es)
 * Utilise SynonymsDictionaryManager pour sélectionner le bon dictionnaire
 * selon la locale active dans Localization.
 * [MVVM : Service]
 */
const SynonymsService = {
    /**
     * Recherche des synonymes pour un mot (dictionnaire local)
     * @param {string} word - Mot à rechercher
     * @returns {Promise<Array>} Liste de synonymes
     * [MVVM : Service]
     */
    async fetchSynonyms(word) {
        const cleanWord = word.toLowerCase().trim();
        if (!cleanWord) {
            return [];
        }

        // Déléguer au gestionnaire multi-langues
        return SynonymsDictionaryManager.search(cleanWord);
    },

    /**
     * Recherche des mots similaires
     * @param {string} word - Mot à rechercher
     * @returns {Promise<Array>} Liste de mots similaires
     * [MVVM : Service]
     */
    async fetchSimilar(word) {
        const cleanWord = word.toLowerCase().trim();
        if (!cleanWord) {
            return [];
        }

        return SynonymsDictionaryManager.searchSimilar(cleanWord);
    },

    /**
     * Recherche des rimes (basé sur la terminaison)
     * @param {string} word - Mot à rechercher
     * @returns {Promise<Array>} Liste de rimes
     * [MVVM : Service]
     */
    async fetchRhymes(word) {
        const cleanWord = word.toLowerCase().trim();
        if (!cleanWord || cleanWord.length < 2) {
            return [];
        }

        return SynonymsDictionaryManager.searchRhymes(cleanWord);
    },

    /**
     * Recherche des antonymes
     * @param {string} word - Mot à rechercher
     * @returns {Promise<Array>} Liste d'antonymes
     * [MVVM : Service]
     */
    async fetchAntonyms(word) {
        const cleanWord = word.toLowerCase().trim();
        if (!cleanWord) {
            return [];
        }

        return SynonymsDictionaryManager.searchAntonyms(cleanWord);
    },

    /**
     * Recherche générique selon le type
     * @param {string} word - Mot à rechercher
     * @param {string} type - Type de recherche
     * @returns {Promise<Array>} Résultats
     * [MVVM : Service]
     */
    async fetch(word, type = SynonymsConfig.searchTypes.SYNONYMS) {
        switch (type) {
            case SynonymsConfig.searchTypes.SYNONYMS:
                return this.fetchSynonyms(word);
            case SynonymsConfig.searchTypes.SIMILAR:
                return this.fetchSimilar(word);
            case SynonymsConfig.searchTypes.RHYMES:
                return this.fetchRhymes(word);
            case SynonymsConfig.searchTypes.ANTONYMS:
                return this.fetchAntonyms(word);
            default:
                return this.fetchSynonyms(word);
        }
    },

    /**
     * Recherche un mot dans tous les synonymes du dictionnaire
     * @param {string} word - Mot à rechercher
     * @returns {Array} Mots dont le mot recherché est un synonyme
     * [MVVM : Service]
     */
    /**
     * @deprecated - La logique de recherche inversée est maintenant dans SynonymsDictionaryManager
     * Conservé pour compatibilité ascendante.
     */
    _searchInAllSynonyms(word) {
        return SynonymsDictionaryManager.search(word);
    },

    /**
     * Vérifie si le service est disponible
     * @returns {boolean}
     * [MVVM : Service]
     */
    isOnline() {
        // Le dictionnaire local est toujours disponible
        return true;
    },

    /**
     * Teste le service
     * @returns {Promise<boolean>}
     * [MVVM : Service]
     */
    async testConnection() {
        try {
            const results = await this.fetchSynonyms('bonheur');
            return results.length > 0;
        } catch (error) {
            console.warn('[SynonymsService] Test échoué:', error.message);
            return false;
        }
    },

    /**
     * Retourne des statistiques sur le dictionnaire
     * @returns {Object}
     * [MVVM : Service]
     */
    getStats() {
        return SynonymsDictionaryManager.getStats();
    }
};

// Export pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SynonymsService };
}
