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
     * Modifie un tableau en place pour retirer un ID
     */
    removeIdfromArray(arr, id) {
        if (!arr) return false;
        const index = arr.indexOf(id);
        if (index > -1) {
            arr.splice(index, 1);
            return true;
        }
        return false;
    }
};
