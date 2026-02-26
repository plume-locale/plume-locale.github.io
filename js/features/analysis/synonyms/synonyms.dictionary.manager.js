// ============================================================
// synonyms.dictionary.manager.js - Gestionnaire multi-langues
// ============================================================
// [MVVM : Data] - Sélectionne le dictionnaire selon la locale active
//
// Architecture :
//   - FrenchSynonymsDictionary   (synonyms.dictionary.js)
//   - EnglishSynonymsDictionary  (synonyms.dictionary.en.js)
//   - GermanSynonymsDictionary   (synonyms.dictionary.de.js)
//   - SpanishSynonymsDictionary  (synonyms.dictionary.es.js)
//
// Usage :
//   SynonymsDictionaryManager.getDictionary()     → dictionnaire courant
//   SynonymsDictionaryManager.search(word)        → synonymes
//   SynonymsDictionaryManager.searchAntonyms(word)→ antonymes
//   SynonymsDictionaryManager.searchSimilar(word) → mots similaires

const SynonymsDictionaryManager = (() => {

    // ── Registre des dictionnaires disponibles ────────────────────
    const _registre = {
        'fr': () => typeof FrenchSynonymsDictionary !== 'undefined' ? FrenchSynonymsDictionary : null,
        'en': () => typeof EnglishSynonymsDictionary !== 'undefined' ? EnglishSynonymsDictionary : null,
        'de': () => typeof GermanSynonymsDictionary !== 'undefined' ? GermanSynonymsDictionary : null,
        'es': () => typeof SpanishSynonymsDictionary !== 'undefined' ? SpanishSynonymsDictionary : null,
    };

    // Langue de fallback si le dictionnaire de la locale n'existe pas
    const FALLBACK_LOCALE = 'fr';

    // ── Locale courante ───────────────────────────────────────────
    let _currentLocale = 'fr';

    /**
     * Retourne la locale courante (depuis LocalizationManager si dispo)
     * @returns {string}
     */
    function _getActiveLocale() {
        try {
            if (window.Localization && typeof window.Localization.getLocale === 'function') {
                return window.Localization.getLocale();
            }
        } catch (e) { /* ignore */ }
        return _currentLocale;
    }

    /**
     * Retourne le dictionnaire actif selon la locale courante,
     * avec fallback sur le français si la langue n'est pas disponible.
     * @returns {Object|null}
     */
    function getDictionary() {
        const locale = _getActiveLocale();
        const getter = _registre[locale] || _registre[FALLBACK_LOCALE];
        const dict = getter ? getter() : null;

        // Fallback sur FR si le dictionnaire de la langue n'est pas chargé
        if (!dict && locale !== FALLBACK_LOCALE) {
            console.warn(`[SynonymsDict] Dictionnaire pour "${locale}" non disponible, fallback sur "${FALLBACK_LOCALE}"`);
            const fallbackGetter = _registre[FALLBACK_LOCALE];
            return fallbackGetter ? fallbackGetter() : null;
        }

        return dict;
    }

    /**
     * Indique si un dictionnaire est disponible pour une locale donnée
     * @param {string} locale
     * @returns {boolean}
     */
    function hasLocale(locale) {
        const getter = _registre[locale];
        if (!getter) return false;
        return getter() !== null;
    }

    /**
     * Retourne la liste des locales ayant un dictionnaire chargé
     * @returns {string[]}
     */
    function getAvailableLocales() {
        return Object.keys(_registre).filter(hasLocale);
    }

    // ── Recherches ────────────────────────────────────────────────

    /**
     * Recherche des synonymes dans le dictionnaire actif
     * @param {string} word
     * @returns {Array}
     */
    function search(word) {
        const cleanWord = word.toLowerCase().trim();
        const dict = getDictionary();
        if (!dict) return [];

        const entry = dict[cleanWord];

        if (!entry) {
            // Recherche partielle (commence par...)
            const partialMatches = [];
            for (const [key, value] of Object.entries(dict)) {
                if (key.startsWith(cleanWord) && value.synonymes) {
                    partialMatches.push(...value.synonymes.slice(0, 3));
                }
            }
            if (partialMatches.length > 0) {
                return [...new Set(partialMatches)].slice(0, 10).map((syn, i) => ({
                    word: syn,
                    score: 100 - i * 5,
                    tags: [],
                    category: 'autre'
                }));
            }

            // Recherche inversée : le mot est un synonyme d'une autre entrée
            return _searchInAllSynonyms(cleanWord, dict);
        }

        return (entry.synonymes || []).map((syn, i) => ({
            word: syn,
            score: 100 - i * 5,
            tags: [],
            category: 'autre'
        }));
    }

    /**
     * Recherche des antonymes dans le dictionnaire actif
     * @param {string} word
     * @returns {Array}
     */
    function searchAntonyms(word) {
        const cleanWord = word.toLowerCase().trim();
        const dict = getDictionary();
        if (!dict) return [];

        const entry = dict[cleanWord];
        if (!entry || !entry.antonymes) return [];

        return entry.antonymes.map((ant, i) => ({
            word: ant,
            score: 100 - i * 5,
            tags: [],
            category: 'autre'
        }));
    }

    /**
     * Recherche des mots similaires (contenant le mot cherché)
     * @param {string} word
     * @returns {Array}
     */
    function searchSimilar(word) {
        const cleanWord = word.toLowerCase().trim();
        const dict = getDictionary();
        if (!dict) return [];

        const similar = [];
        for (const key of Object.keys(dict)) {
            if (key.includes(cleanWord) && key !== cleanWord) {
                similar.push({ word: key, score: 80, tags: [], category: 'autre' });
            }
        }
        return similar.slice(0, 10);
    }

    /**
     * Recherche de rimes dans le dictionnaire actif
     * @param {string} word
     * @returns {Array}
     */
    function searchRhymes(word) {
        const cleanWord = word.toLowerCase().trim();
        if (!cleanWord || cleanWord.length < 2) return [];

        const dict = getDictionary();
        if (!dict) return [];

        const ending3 = cleanWord.slice(-3);
        const ending2 = cleanWord.slice(-2);
        const rhymes = [];

        for (const key of Object.keys(dict)) {
            if (key !== cleanWord) {
                if (key.endsWith(ending3)) {
                    rhymes.push({ word: key, score: 100, tags: [], category: 'rime riche' });
                } else if (key.endsWith(ending2)) {
                    rhymes.push({ word: key, score: 70, tags: [], category: 'rime suffisante' });
                }
            }
        }

        return rhymes.sort((a, b) => b.score - a.score).slice(0, 15);
    }

    /**
     * Recherche un mot parmi les synonymes de toutes les entrées (recherche inversée)
     * @private
     */
    function _searchInAllSynonyms(word, dict) {
        const results = [];
        for (const [key, entry] of Object.entries(dict)) {
            if (entry.synonymes && entry.synonymes.includes(word)) {
                results.push({ word: key, score: 100, tags: [], category: 'autre' });
                entry.synonymes.forEach((syn, i) => {
                    if (syn !== word && !results.find(r => r.word === syn)) {
                        results.push({ word: syn, score: 90 - i, tags: [], category: 'autre' });
                    }
                });
            }
        }
        return results.slice(0, 15);
    }

    /**
     * Statistiques du dictionnaire courant
     * @returns {Object}
     */
    function getStats() {
        const dict = getDictionary();
        const locale = _getActiveLocale();
        if (!dict) return { locale, entries: 0, totalSynonyms: 0, totalAntonyms: 0 };

        const entries = Object.keys(dict).length;
        let totalSynonyms = 0;
        let totalAntonyms = 0;
        for (const entry of Object.values(dict)) {
            totalSynonyms += (entry.synonymes || []).length;
            totalAntonyms += (entry.antonymes || []).length;
        }

        return {
            locale,
            entries,
            totalSynonyms,
            totalAntonyms,
            avgSynonymsPerWord: Math.round(totalSynonyms / entries * 10) / 10
        };
    }

    // ── Écoute des changements de langue ─────────────────────────
    window.addEventListener('localeChanged', (e) => {
        const newLocale = e.detail?.locale;
        if (newLocale && newLocale !== _currentLocale) {
            const wasAvailable = hasLocale(_currentLocale);
            _currentLocale = newLocale;
            const isAvailable = hasLocale(newLocale);
            console.log(`[SynonymsDict] Langue changée : ${_currentLocale} → ${newLocale} (dict: ${isAvailable ? '✓' : '✗ fallback FR'})`);
        }
    });

    // ── API publique ──────────────────────────────────────────────
    return {
        getDictionary,
        hasLocale,
        getAvailableLocales,
        search,
        searchAntonyms,
        searchSimilar,
        searchRhymes,
        getStats
    };
})();

// Export pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SynonymsDictionaryManager };
}
