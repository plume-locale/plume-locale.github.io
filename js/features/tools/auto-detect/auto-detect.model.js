/**
 * [MVVM : AutoDetect Model]
 * Logique pure et utilitaires de données.
 */

const AutoDetectModel = {
    /**
     * Normalise le texte pour la recherche (retire accents, minuscule)
     */
    normalizeForSearch(text) {
        if (!text) return '';
        return text
            .toString()
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, ''); // Retire les accents
    },

    /**
     * Échappe les caractères spéciaux regex
     */
    escapeRegex(string) {
        if (!string) return '';
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    },

    /**
     * Modifie un tableau en place pour retirer un ID.
     * Utilise == (comparaison lâche) pour gérer les cas où l'ID
     * est stocké comme string dans le JSON mais passé comme number depuis le DOM.
     */
    removeIdfromArray(arr, id) {
        if (!arr) return false;
        // eslint-disable-next-line eqeqeq
        const index = arr.findIndex(item => item == id);
        if (index > -1) {
            arr.splice(index, 1);
            return true;
        }
        return false;
    },

    /**
     * Vérifie si un tableau contient un ID (comparaison lâche).
     * Nécessaire pour les mêmes raisons que removeIdfromArray.
     */
    includesId(arr, id) {
        if (!arr) return false;
        // eslint-disable-next-line eqeqeq
        return arr.some(item => item == id);
    }
};
