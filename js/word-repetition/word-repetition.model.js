// ============================================================
// word-repetition.model.js - Modèle de données pour l'analyse de répétitions
// ============================================================

/**
 * [MVVM : Model]
 * Configuration et constantes pour l'analyseur de répétitions
 */
const WordRepetitionConfig = {
    // Seuils de détection
    thresholds: {
        minWordLength: 4,           // Longueur minimale des mots analysés
        minOccurrences: 3,          // Nombre min d'occurrences pour signaler
        proximityWindow: 150,       // Fenêtre de proximité en caractères
        proximityMinOccurrences: 2, // Occurrences dans la fenêtre de proximité
        densityWarning: 0.02,       // Densité d'alerte (2%)
        densityCritical: 0.04       // Densité critique (4%)
    },

    // Catégories de sévérité
    severity: {
        LOW: 'low',
        MEDIUM: 'medium',
        HIGH: 'high',
        CRITICAL: 'critical'
    },

    // Types d'analyse
    scope: {
        PROJECT: 'project',
        ACT: 'act',
        CHAPTER: 'chapter',
        SCENE: 'scene'
    },

    // Mots à ignorer par défaut (mots-outils français)
    defaultIgnoredWords: new Set([
        // Articles
        'le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'au', 'aux',
        // Pronoms
        'je', 'tu', 'il', 'elle', 'on', 'nous', 'vous', 'ils', 'elles',
        'me', 'te', 'se', 'lui', 'leur', 'en', 'y',
        'ce', 'cet', 'cette', 'ces', 'celui', 'celle', 'ceux', 'celles',
        'qui', 'que', 'quoi', 'dont', 'où',
        'mon', 'ton', 'son', 'ma', 'ta', 'sa', 'mes', 'tes', 'ses',
        'notre', 'votre', 'nos', 'vos', 'leur', 'leurs',
        // Prépositions
        'à', 'de', 'en', 'par', 'pour', 'sur', 'sous', 'dans', 'avec', 'sans',
        'entre', 'vers', 'chez', 'contre', 'depuis', 'pendant', 'avant', 'après',
        // Conjonctions
        'et', 'ou', 'mais', 'donc', 'or', 'ni', 'car', 'que', 'si', 'comme',
        'quand', 'lorsque', 'puisque', 'parce',
        // Adverbes courants
        'ne', 'pas', 'plus', 'moins', 'très', 'bien', 'mal', 'peu', 'trop',
        'aussi', 'encore', 'toujours', 'jamais', 'déjà', 'alors', 'ainsi',
        // Verbes auxiliaires/courants
        'être', 'avoir', 'faire', 'aller', 'pouvoir', 'vouloir', 'devoir',
        'est', 'sont', 'était', 'fut', 'sera', 'serait', 'soit',
        'a', 'ai', 'as', 'avait', 'avaient', 'ont', 'aura', 'aurait',
        'fait', 'fais', 'font', 'va', 'vont', 'peut', 'veut', 'doit',
        // Autres mots fréquents
        'tout', 'tous', 'toute', 'toutes', 'rien', 'même', 'autre', 'autres',
        'quelque', 'chaque', 'aucun', 'aucune', 'plusieurs',
        'cela', 'ça', 'là', 'ici', 'voilà', 'voici',
        // Mots courts communs
        'dit', 'dis', 'mis', 'pris', 'vu', 'su', 'pu', 'dû', 'eu', 'été'
    ])
};

/**
 * [MVVM : Model]
 * Factory pour créer un résultat d'occurrence de mot
 * @param {string} word - Le mot trouvé
 * @param {number} position - Position dans le texte
 * @param {string} context - Contexte autour du mot
 * @param {Object} location - Localisation (acte, chapitre, scène)
 * @returns {Object} Occurrence formatée
 */
function createWordOccurrence(word, position, context, location) {
    return {
        word: word,
        position: position,
        context: context,
        location: {
            actId: location.actId || null,
            actTitle: location.actTitle || '',
            chapterId: location.chapterId || null,
            chapterTitle: location.chapterTitle || '',
            sceneId: location.sceneId || null,
            sceneTitle: location.sceneTitle || ''
        }
    };
}

/**
 * [MVVM : Model]
 * Factory pour créer un résultat d'analyse de répétition
 * @param {string} word - Le mot répété
 * @param {number} count - Nombre total d'occurrences
 * @param {Array} occurrences - Liste des occurrences
 * @param {Object} stats - Statistiques additionnelles
 * @returns {Object} Résultat de répétition
 */
function createRepetitionResult(word, count, occurrences, stats = {}) {
    const density = stats.totalWords ? (count / stats.totalWords) : 0;

    // Calculer la sévérité
    let severity = WordRepetitionConfig.severity.LOW;
    if (density >= WordRepetitionConfig.thresholds.densityCritical) {
        severity = WordRepetitionConfig.severity.CRITICAL;
    } else if (density >= WordRepetitionConfig.thresholds.densityWarning) {
        severity = WordRepetitionConfig.severity.HIGH;
    } else if (count >= 10 || stats.proximityCount >= 3) {
        severity = WordRepetitionConfig.severity.MEDIUM;
    }

    return {
        id: `rep_${word}_${Date.now()}`,
        word: word,
        count: count,
        density: density,
        densityPercent: (density * 100).toFixed(2),
        severity: severity,
        occurrences: occurrences,
        proximityCount: stats.proximityCount || 0,
        suggestions: [],
        isIgnored: false
    };
}

/**
 * [MVVM : Model]
 * Factory pour créer un contexte d'analyse
 * @param {string} scope - Portée de l'analyse
 * @param {Object} target - Cible (projet, acte, chapitre, scène)
 * @returns {Object} Contexte d'analyse
 */
function createAnalysisContext(scope, target = {}) {
    return {
        scope: scope,
        actId: target.actId || null,
        chapterId: target.chapterId || null,
        sceneId: target.sceneId || null,
        timestamp: Date.now()
    };
}

/**
 * [MVVM : Model]
 * Factory pour créer un rapport d'analyse complet
 * @param {Object} context - Contexte d'analyse
 * @param {Array} repetitions - Liste des répétitions détectées
 * @param {Object} stats - Statistiques globales
 * @returns {Object} Rapport complet
 */
function createAnalysisReport(context, repetitions, stats) {
    return {
        id: `report_${Date.now()}`,
        context: context,
        repetitions: repetitions,
        stats: {
            totalWords: stats.totalWords || 0,
            uniqueWords: stats.uniqueWords || 0,
            repetitionsCount: repetitions.length,
            criticalCount: repetitions.filter(r => r.severity === WordRepetitionConfig.severity.CRITICAL).length,
            highCount: repetitions.filter(r => r.severity === WordRepetitionConfig.severity.HIGH).length,
            mediumCount: repetitions.filter(r => r.severity === WordRepetitionConfig.severity.MEDIUM).length,
            lowCount: repetitions.filter(r => r.severity === WordRepetitionConfig.severity.LOW).length,
            analyzedAt: new Date().toISOString()
        },
        suggestions: []
    };
}

/**
 * [MVVM : Model]
 * Factory pour créer une suggestion de remplacement
 * @param {string} originalWord - Mot original
 * @param {string} suggestion - Mot suggéré
 * @param {Object} metadata - Métadonnées (source, score, etc.)
 * @returns {Object} Suggestion formatée
 */
function createReplacementSuggestion(originalWord, suggestion, metadata = {}) {
    return {
        original: originalWord,
        suggestion: suggestion,
        score: metadata.score || 0,
        source: metadata.source || 'dictionary',
        category: metadata.category || '',
        applied: false
    };
}

/**
 * [MVVM : Model]
 * Valide les préférences utilisateur
 * @param {Object} prefs - Préférences à valider
 * @returns {Object} Résultat de validation
 */
function validateRepetitionPreferences(prefs) {
    const errors = [];

    if (prefs.minWordLength !== undefined) {
        if (typeof prefs.minWordLength !== 'number' || prefs.minWordLength < 2 || prefs.minWordLength > 10) {
            errors.push('minWordLength doit être entre 2 et 10');
        }
    }

    if (prefs.minOccurrences !== undefined) {
        if (typeof prefs.minOccurrences !== 'number' || prefs.minOccurrences < 2 || prefs.minOccurrences > 20) {
            errors.push('minOccurrences doit être entre 2 et 20');
        }
    }

    if (prefs.customIgnoredWords !== undefined) {
        if (!Array.isArray(prefs.customIgnoredWords)) {
            errors.push('customIgnoredWords doit être un tableau');
        }
    }

    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

// Export pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        WordRepetitionConfig,
        createWordOccurrence,
        createRepetitionResult,
        createAnalysisContext,
        createAnalysisReport,
        createReplacementSuggestion,
        validateRepetitionPreferences
    };
}
