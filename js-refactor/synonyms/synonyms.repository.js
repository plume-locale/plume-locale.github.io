// ============================================================
// synonyms.repository.js - Repository pour le cache des synonymes
// ============================================================
// [MVVM : Repository] - Gestion du cache local (localStorage)

/**
 * Repository pour le cache des synonymes
 * [MVVM : Repository]
 */
const SynonymsRepository = {
    _cache: null,

    /**
     * Initialise le repository et charge le cache
     * [MVVM : Repository]
     */
    init() {
        this._loadCache();
        this._cleanExpiredEntries();
        return this;
    },

    /**
     * Charge le cache depuis localStorage
     * [MVVM : Repository]
     */
    _loadCache() {
        try {
            const stored = localStorage.getItem(SynonymsConfig.cache.storageKey);
            this._cache = stored ? JSON.parse(stored) : {};
        } catch (error) {
            console.warn('[SynonymsRepository] Erreur chargement cache:', error);
            this._cache = {};
        }
    },

    /**
     * Sauvegarde le cache dans localStorage
     * [MVVM : Repository]
     */
    _saveCache() {
        try {
            localStorage.setItem(SynonymsConfig.cache.storageKey, JSON.stringify(this._cache));
        } catch (error) {
            console.warn('[SynonymsRepository] Erreur sauvegarde cache:', error);
            // Si quota dépassé, nettoyer les anciennes entrées
            if (error.name === 'QuotaExceededError') {
                this._evictOldestEntries(50);
                this._saveCache();
            }
        }
    },

    /**
     * Nettoie les entrées expirées du cache
     * [MVVM : Repository]
     */
    _cleanExpiredEntries() {
        let hasChanges = false;
        for (const key of Object.keys(this._cache)) {
            if (CacheEntry.isExpired(this._cache[key])) {
                delete this._cache[key];
                hasChanges = true;
            }
        }
        if (hasChanges) {
            this._saveCache();
        }
    },

    /**
     * Supprime les N entrées les plus anciennes
     * [MVVM : Repository]
     */
    _evictOldestEntries(count) {
        const entries = Object.entries(this._cache)
            .sort((a, b) => a[1].cachedAt - b[1].cachedAt);

        for (let i = 0; i < Math.min(count, entries.length); i++) {
            delete this._cache[entries[i][0]];
        }
    },

    /**
     * Récupère une entrée du cache
     * @param {string} word - Mot recherché
     * @param {string} type - Type de recherche
     * @returns {Object|null} Entrée de cache ou null
     * [MVVM : Repository]
     */
    get(word, type = SynonymsConfig.searchTypes.SYNONYMS) {
        if (!SynonymsConfig.cache.enabled) {
            return null;
        }

        const id = SynonymsSearch.generateId(word, type);
        const entry = this._cache[id];

        if (!entry) {
            return null;
        }

        // Vérifier si l'entrée est expirée
        if (CacheEntry.isExpired(entry)) {
            delete this._cache[id];
            this._saveCache();
            return null;
        }

        return entry;
    },

    /**
     * Ajoute une entrée au cache
     * @param {Object} search - Objet recherche avec résultats
     * @returns {Object} Entrée de cache créée
     * [MVVM : Repository]
     */
    set(search) {
        if (!SynonymsConfig.cache.enabled) {
            return null;
        }

        // Limiter le nombre d'entrées
        if (Object.keys(this._cache).length >= SynonymsConfig.cache.maxEntries) {
            this._evictOldestEntries(50);
        }

        const entry = CacheEntry.create(search);
        this._cache[entry.id] = entry;
        this._saveCache();

        return entry;
    },

    /**
     * Supprime une entrée du cache
     * @param {string} word - Mot recherché
     * @param {string} type - Type de recherche
     * [MVVM : Repository]
     */
    remove(word, type = SynonymsConfig.searchTypes.SYNONYMS) {
        const id = SynonymsSearch.generateId(word, type);
        if (this._cache[id]) {
            delete this._cache[id];
            this._saveCache();
        }
    },

    /**
     * Vide entièrement le cache
     * [MVVM : Repository]
     */
    clear() {
        this._cache = {};
        this._saveCache();
    },

    /**
     * Retourne les statistiques du cache
     * @returns {Object} Stats du cache
     * [MVVM : Repository]
     */
    getStats() {
        const entries = Object.values(this._cache);
        return {
            totalEntries: entries.length,
            maxEntries: SynonymsConfig.cache.maxEntries,
            oldestEntry: entries.length > 0
                ? new Date(Math.min(...entries.map(e => e.cachedAt)))
                : null,
            newestEntry: entries.length > 0
                ? new Date(Math.max(...entries.map(e => e.cachedAt)))
                : null
        };
    },

    /**
     * Récupère l'historique des recherches récentes
     * @param {number} limit - Nombre max de résultats
     * @returns {Array} Liste des mots recherchés récemment
     * [MVVM : Repository]
     */
    getRecentSearches(limit = 10) {
        return Object.values(this._cache)
            .sort((a, b) => b.cachedAt - a.cachedAt)
            .slice(0, limit)
            .map(entry => ({
                word: entry.word,
                type: entry.type,
                date: new Date(entry.cachedAt)
            }));
    }
};

// Auto-initialisation
SynonymsRepository.init();

// Export pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SynonymsRepository };
}
