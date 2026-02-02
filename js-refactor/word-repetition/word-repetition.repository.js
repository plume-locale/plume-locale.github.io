// ============================================================
// word-repetition.repository.js - Repository pour les préférences de répétitions
// ============================================================

/**
 * [MVVM : Repository]
 * Gestion CRUD des préférences utilisateur pour l'analyse de répétitions
 */
const WordRepetitionRepository = {
    // Clé de stockage
    STORAGE_KEY: 'plume_word_repetition_prefs',

    /**
     * [MVVM : Repository]
     * Récupère les préférences utilisateur
     * @returns {Object} Préférences
     */
    getPreferences() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (stored) {
                const prefs = JSON.parse(stored);
                return this._mergeWithDefaults(prefs);
            }
        } catch (e) {
            console.warn('[WordRepetitionRepository] Erreur lecture préférences:', e);
        }
        return this._getDefaults();
    },

    /**
     * [MVVM : Repository]
     * Sauvegarde les préférences utilisateur
     * @param {Object} prefs - Préférences à sauvegarder
     * @returns {boolean} Succès
     */
    savePreferences(prefs) {
        try {
            const validation = validateRepetitionPreferences(prefs);
            if (!validation.isValid) {
                console.warn('[WordRepetitionRepository] Préférences invalides:', validation.errors);
                return false;
            }
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(prefs));
            return true;
        } catch (e) {
            console.error('[WordRepetitionRepository] Erreur sauvegarde préférences:', e);
            return false;
        }
    },

    /**
     * [MVVM : Repository]
     * Met à jour une préférence spécifique
     * @param {string} key - Clé de la préférence
     * @param {*} value - Nouvelle valeur
     * @returns {boolean} Succès
     */
    updatePreference(key, value) {
        const prefs = this.getPreferences();
        prefs[key] = value;
        prefs.updatedAt = new Date().toISOString();
        return this.savePreferences(prefs);
    },

    /**
     * [MVVM : Repository]
     * Récupère la liste des mots ignorés personnalisés
     * @returns {Array} Liste des mots ignorés
     */
    getCustomIgnoredWords() {
        const prefs = this.getPreferences();
        return prefs.customIgnoredWords || [];
    },

    /**
     * [MVVM : Repository]
     * Ajoute un mot à la liste des ignorés
     * @param {string} word - Mot à ignorer
     * @returns {boolean} Succès
     */
    addIgnoredWord(word) {
        const prefs = this.getPreferences();
        const normalizedWord = word.toLowerCase().trim();

        if (!normalizedWord || prefs.customIgnoredWords.includes(normalizedWord)) {
            return false;
        }

        prefs.customIgnoredWords.push(normalizedWord);
        prefs.updatedAt = new Date().toISOString();
        return this.savePreferences(prefs);
    },

    /**
     * [MVVM : Repository]
     * Retire un mot de la liste des ignorés
     * @param {string} word - Mot à retirer
     * @returns {boolean} Succès
     */
    removeIgnoredWord(word) {
        const prefs = this.getPreferences();
        const normalizedWord = word.toLowerCase().trim();
        const index = prefs.customIgnoredWords.indexOf(normalizedWord);

        if (index === -1) {
            return false;
        }

        prefs.customIgnoredWords.splice(index, 1);
        prefs.updatedAt = new Date().toISOString();
        return this.savePreferences(prefs);
    },

    /**
     * [MVVM : Repository]
     * Récupère l'ensemble complet des mots à ignorer (défaut + personnalisés)
     * @returns {Set} Ensemble des mots ignorés
     */
    getAllIgnoredWords() {
        const prefs = this.getPreferences();
        const combined = new Set(WordRepetitionConfig.defaultIgnoredWords);

        prefs.customIgnoredWords.forEach(word => combined.add(word));

        // Ajouter les noms de personnages du projet si disponibles
        if (typeof project !== 'undefined' && project.characters) {
            project.characters.forEach(char => {
                if (char.firstName) combined.add(char.firstName.toLowerCase());
                if (char.lastName) combined.add(char.lastName.toLowerCase());
                if (char.nickname) combined.add(char.nickname.toLowerCase());
            });
        }

        return combined;
    },

    /**
     * [MVVM : Repository]
     * Récupère le dernier rapport d'analyse
     * @returns {Object|null} Dernier rapport
     */
    getLastReport() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY + '_last_report');
            return stored ? JSON.parse(stored) : null;
        } catch (e) {
            return null;
        }
    },

    /**
     * [MVVM : Repository]
     * Sauvegarde le dernier rapport d'analyse
     * @param {Object} report - Rapport à sauvegarder
     * @returns {boolean} Succès
     */
    saveLastReport(report) {
        try {
            localStorage.setItem(this.STORAGE_KEY + '_last_report', JSON.stringify(report));
            return true;
        } catch (e) {
            console.error('[WordRepetitionRepository] Erreur sauvegarde rapport:', e);
            return false;
        }
    },

    /**
     * [MVVM : Repository]
     * Réinitialise les préférences par défaut
     * @returns {boolean} Succès
     */
    resetToDefaults() {
        return this.savePreferences(this._getDefaults());
    },

    /**
     * [MVVM : Repository]
     * Retourne les préférences par défaut
     * @returns {Object} Préférences par défaut
     * @private
     */
    _getDefaults() {
        return {
            minWordLength: WordRepetitionConfig.thresholds.minWordLength,
            minOccurrences: WordRepetitionConfig.thresholds.minOccurrences,
            proximityWindow: WordRepetitionConfig.thresholds.proximityWindow,
            customIgnoredWords: [],
            ignoreCharacterNames: true,
            showLowSeverity: false,
            autoAnalyze: false,
            highlightInEditor: true,
            panelCollapsed: false,
            lastScope: WordRepetitionConfig.scope.SCENE,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
    },

    /**
     * [MVVM : Repository]
     * Fusionne les préférences stockées avec les défauts
     * @param {Object} stored - Préférences stockées
     * @returns {Object} Préférences fusionnées
     * @private
     */
    _mergeWithDefaults(stored) {
        const defaults = this._getDefaults();
        return { ...defaults, ...stored };
    }
};

// Export pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { WordRepetitionRepository };
}
