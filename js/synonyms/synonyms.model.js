// ============================================================
// synonyms.model.js - Modèle de données pour les synonymes
// ============================================================
// [MVVM : Model] - Structures de données et factories

/**
 * Modèle représentant un résultat de synonyme
 * [MVVM : Model]
 */
const SynonymResult = {
    /**
     * Crée un nouveau résultat de synonyme
     * @param {Object} data - Données brutes de l'API
     * @returns {Object} Résultat formaté
     */
    create(data = {}) {
        return {
            word: data.word || '',
            score: data.score || 0,
            tags: data.tags || [],
            numSyllables: data.numSyllables || null,
            // Métadonnées ajoutées localement
            category: this.extractCategory(data.tags),
            isVerb: this.isVerb(data.tags),
            isNoun: this.isNoun(data.tags),
            isAdjective: this.isAdjective(data.tags)
        };
    },

    /**
     * Extrait la catégorie grammaticale des tags
     * [MVVM : Model]
     */
    extractCategory(tags = []) {
        if (tags.includes('n')) return 'nom';
        if (tags.includes('v')) return 'verbe';
        if (tags.includes('adj')) return 'adjectif';
        if (tags.includes('adv')) return 'adverbe';
        return 'autre';
    },

    isVerb(tags = []) {
        return tags.includes('v');
    },

    isNoun(tags = []) {
        return tags.includes('n');
    },

    isAdjective(tags = []) {
        return tags.includes('adj');
    }
};

/**
 * Modèle représentant une recherche de synonymes
 * [MVVM : Model]
 */
const SynonymsSearch = {
    /**
     * Crée une nouvelle recherche
     * @param {string} word - Mot recherché
     * @param {string} type - Type de recherche (synonyms, similar, rhymes, antonyms)
     * @returns {Object} Objet recherche
     */
    create(word, type = 'synonyms') {
        return {
            id: this.generateId(word, type),
            word: word.toLowerCase().trim(),
            type: type,
            timestamp: Date.now(),
            results: [],
            fromCache: false,
            error: null
        };
    },

    /**
     * Génère un ID unique pour la recherche (utilisé pour le cache)
     * [MVVM : Model]
     */
    generateId(word, type) {
        return `${type}_${word.toLowerCase().trim()}`;
    }
};

/**
 * Modèle représentant une entrée en cache
 * [MVVM : Model]
 */
const CacheEntry = {
    /**
     * Crée une nouvelle entrée de cache
     * @param {Object} search - Objet recherche
     * @returns {Object} Entrée de cache
     */
    create(search) {
        return {
            id: search.id,
            word: search.word,
            type: search.type,
            results: search.results,
            cachedAt: Date.now(),
            expiresAt: Date.now() + (SynonymsConfig.cache.expirationDays * 24 * 60 * 60 * 1000)
        };
    },

    /**
     * Vérifie si une entrée de cache est expirée
     * [MVVM : Model]
     */
    isExpired(entry) {
        return Date.now() > entry.expiresAt;
    }
};

/**
 * Modèle d'état de l'interface synonymes
 * [MVVM : Model]
 */
const SynonymsUIState = {
    /**
     * Crée l'état initial de l'interface
     * [MVVM : Model]
     */
    createInitialState() {
        return {
            isOpen: false,
            isLoading: false,
            currentWord: '',
            currentType: SynonymsConfig.searchTypes.SYNONYMS,
            results: [],
            error: null,
            isOffline: !navigator.onLine,
            selectedIndex: -1,
            history: []
        };
    }
};

// Export pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SynonymResult, SynonymsSearch, CacheEntry, SynonymsUIState };
}
