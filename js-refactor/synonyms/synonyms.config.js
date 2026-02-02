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

    // Messages d'erreur et labels
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
            insert: 'Insérer',
            close: 'Fermer',
            cached: '(en cache)'
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
// [MVVM : Config]
function getSynonymsMessage(key, lang = 'fr') {
    return SynonymsConfig.messages[lang]?.[key] || SynonymsConfig.messages.fr[key] || key;
}

// Export pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SynonymsConfig, getSynonymsMessage };
}
