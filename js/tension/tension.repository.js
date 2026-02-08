/**
 * @file tension.repository.js
 * @description Référentiel pour la persistance des données du module de tension.
 */

const TensionRepository = {
    STORAGE_KEY: 'tensionWords',

    /**
     * Récupère les mots de tension (personnalisés ou par défaut) depuis le localStorage.
     * @returns {Object} L'objet contenant les listes de mots.
     */
    getTensionWords: function () {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch (e) {
                console.error('Erreur lors du chargement des mots de tension:', e);
                return TensionModel.DEFAULT_TENSION_WORDS;
            }
        }
        return TensionModel.DEFAULT_TENSION_WORDS;
    },

    /**
     * Sauvegarde les mots de tension dans le localStorage.
     * @param {Object} words - L'objet contenant les listes de mots à sauvegarder.
     */
    saveTensionWords: function (words) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(words));
    }
};
