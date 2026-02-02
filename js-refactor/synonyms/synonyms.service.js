// ============================================================
// synonyms.service.js - Service pour les synonymes français
// ============================================================
// [MVVM : Service] - Utilise le dictionnaire local français

/**
 * Service de synonymes - Utilise le dictionnaire local français
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

        // Utiliser le dictionnaire local français
        const results = searchLocalSynonyms(cleanWord);

        // Si pas de résultats, chercher dans les synonymes existants
        if (results.length === 0) {
            return this._searchInAllSynonyms(cleanWord);
        }

        return results;
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

        return searchLocalSimilar(cleanWord);
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

        // Trouver les mots qui riment (même terminaison)
        const ending = cleanWord.slice(-3);
        const ending2 = cleanWord.slice(-2);
        const rhymes = [];

        for (const key of Object.keys(FrenchSynonymsDictionary)) {
            if (key !== cleanWord) {
                if (key.endsWith(ending)) {
                    rhymes.push({ word: key, score: 100, tags: [], category: 'rime riche' });
                } else if (key.endsWith(ending2)) {
                    rhymes.push({ word: key, score: 70, tags: [], category: 'rime suffisante' });
                }
            }
        }

        // Trier par score et limiter
        return rhymes.sort((a, b) => b.score - a.score).slice(0, 15);
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

        return searchLocalAntonyms(cleanWord);
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
    _searchInAllSynonyms(word) {
        const results = [];

        for (const [key, entry] of Object.entries(FrenchSynonymsDictionary)) {
            if (entry.synonymes && entry.synonymes.includes(word)) {
                // Le mot recherché est un synonyme de 'key'
                // Donc on retourne les autres synonymes de 'key'
                results.push({ word: key, score: 100, tags: [], category: 'autre' });
                entry.synonymes.forEach((syn, index) => {
                    if (syn !== word && !results.find(r => r.word === syn)) {
                        results.push({ word: syn, score: 90 - index, tags: [], category: 'autre' });
                    }
                });
            }
        }

        return results.slice(0, 15);
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
        const entries = Object.keys(FrenchSynonymsDictionary).length;
        let totalSynonyms = 0;
        let totalAntonyms = 0;

        for (const entry of Object.values(FrenchSynonymsDictionary)) {
            totalSynonyms += (entry.synonymes || []).length;
            totalAntonyms += (entry.antonymes || []).length;
        }

        return {
            entries,
            totalSynonyms,
            totalAntonyms,
            avgSynonymsPerWord: Math.round(totalSynonyms / entries * 10) / 10
        };
    }
};

// Export pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SynonymsService };
}
