// ============================================================
// synonyms.config.js - Configuration du module Synonymes
// ============================================================
// [MVVM : Config] - Constantes et paramètres du service de synonymes

const SynonymsConfig = {
    // APIs disponibles
    apis: {
        datamuse: {
            name: 'Datamuse',
            baseUrl: 'https://api.datamuse.com/words',
            // Pour les synonymes français, on utilise le paramètre v=fr
            synonymsEndpoint: (word) => `?rel_syn=${encodeURIComponent(word)}&v=fr&max=20`,
            // Mots similaires (son/orthographe)
            similarEndpoint: (word) => `?sl=${encodeURIComponent(word)}&v=fr&max=10`,
            // Mots qui riment
            rhymesEndpoint: (word) => `?rel_rhy=${encodeURIComponent(word)}&v=fr&max=15`,
            // Antonymes (mots opposés)
            antonymsEndpoint: (word) => `?rel_ant=${encodeURIComponent(word)}&v=fr&max=10`,
            timeout: 5000,
            enabled: true
        },
        // Configuration pour une future API alternative
        openThesaurus: {
            name: 'OpenThesaurus',
            baseUrl: 'https://www.openthesaurus.de/synonyme/search',
            // Note: OpenThesaurus est principalement allemand, mais peut être adapté
            enabled: false
        }
    },

    // Configuration du cache
    cache: {
        enabled: true,
        maxEntries: 500,           // Nombre max de mots en cache
        expirationDays: 30,        // Durée de vie du cache en jours
        storageKey: 'plume_synonyms_cache'
    },

    // Configuration de l'interface utilisateur
    ui: {
        maxDisplayResults: 15,     // Nombre max de synonymes affichés
        debounceDelay: 300,        // Délai avant recherche (ms)
        showScores: false,         // Afficher les scores de pertinence
        groupByCategory: true,     // Grouper par catégorie grammaticale
        modalId: 'synonyms-modal',
        inputId: 'synonyms-search-input',
        resultsId: 'synonyms-results'
    },

    // Messages d'erreur et labels (par langue)
    messages: {
        fr: {
            title: 'Dictionnaire de Synonymes',
            placeholder: 'Entrez un mot...',
            searching: 'Recherche en cours...',
            noResults: 'Aucun synonyme trouvé',
            error: 'Erreur de connexion au service',
            offline: 'Mode hors-ligne : résultats depuis le cache',
            synonyms: 'Synonymes',
            similar: 'Mots similaires',
            rhymes: 'Rimes',
            antonyms: 'Antonymes',
            copy: 'Copier',
            insert: 'Insérer dans le texte',
            close: 'Fermer',
            cached: '(en cache)',
            recent: 'Récents :',
            recentEmpty: 'Aucune recherche récente',
            copied: 'Copié !',
            catNom: 'Noms',
            catVerbe: 'Verbes',
            catAdjectif: 'Adjectifs',
            catAdverbe: 'Adverbes',
            catAutre: 'Autres'
        },
        en: {
            title: 'Synonym Dictionary',
            placeholder: 'Enter a word...',
            searching: 'Searching...',
            noResults: 'No synonyms found',
            error: 'Connection error',
            offline: 'Offline mode: results from cache',
            synonyms: 'Synonyms',
            similar: 'Similar words',
            rhymes: 'Rhymes',
            antonyms: 'Antonyms',
            copy: 'Copy',
            insert: 'Insert in text',
            close: 'Close',
            cached: '(cached)',
            recent: 'Recent:',
            recentEmpty: 'No recent searches',
            copied: 'Copied!',
            catNom: 'Nouns',
            catVerbe: 'Verbs',
            catAdjectif: 'Adjectives',
            catAdverbe: 'Adverbs',
            catAutre: 'Others'
        },
        de: {
            title: 'Synonymwörterbuch',
            placeholder: 'Wort eingeben...',
            searching: 'Suche läuft...',
            noResults: 'Keine Synonyme gefunden',
            error: 'Verbindungsfehler',
            offline: 'Offline-Modus: Ergebnisse aus dem Cache',
            synonyms: 'Synonyme',
            similar: 'Ähnliche Wörter',
            rhymes: 'Reime',
            antonyms: 'Antonyme',
            copy: 'Kopieren',
            insert: 'In Text einfügen',
            close: 'Schließen',
            cached: '(aus Cache)',
            recent: 'Zuletzt:',
            recentEmpty: 'Keine letzten Suchen',
            copied: 'Kopiert!',
            catNom: 'Nomen',
            catVerbe: 'Verben',
            catAdjectif: 'Adjektive',
            catAdverbe: 'Adverbien',
            catAutre: 'Andere'
        },
        es: {
            title: 'Diccionario de Sinónimos',
            placeholder: 'Escribe una palabra...',
            searching: 'Buscando...',
            noResults: 'No se encontraron sinónimos',
            error: 'Error de conexión',
            offline: 'Modo sin conexión: resultados del caché',
            synonyms: 'Sinónimos',
            similar: 'Palabras similares',
            rhymes: 'Rimas',
            antonyms: 'Antónimos',
            copy: 'Copiar',
            insert: 'Insertar en el texto',
            close: 'Cerrar',
            cached: '(en caché)',
            recent: 'Recientes:',
            recentEmpty: 'Sin búsquedas recientes',
            copied: '¡Copiado!',
            catNom: 'Sustantivos',
            catVerbe: 'Verbos',
            catAdjectif: 'Adjetivos',
            catAdverbe: 'Adverbios',
            catAutre: 'Otros'
        }
    },

    // Types de recherche disponibles
    searchTypes: {
        SYNONYMS: 'synonyms',
        SIMILAR: 'similar',
        RHYMES: 'rhymes',
        ANTONYMS: 'antonyms'
    }
};

// Fonction utilitaire pour obtenir un message localisé
// Lit automatiquement la locale active depuis LocalizationManager
// [MVVM : Config]
function getSynonymsMessage(key) {
    let lang = 'fr';
    try {
        if (window.Localization && typeof window.Localization.getLocale === 'function') {
            lang = window.Localization.getLocale();
        }
    } catch (e) { /* fallback fr */ }
    return SynonymsConfig.messages[lang]?.[key] || SynonymsConfig.messages.fr[key] || key;
}

// Export pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SynonymsConfig, getSynonymsMessage };
}
