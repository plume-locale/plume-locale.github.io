/**
 * [MVVM : Stats Model]
 * Logique pure de calcul des mots et définition des structures de données.
 */

const StatsModel = {
    /**
     * Calcule le nombre de mots dans un texte HTML.
     * @param {string} html 
     * @returns {number}
     */
    getWordCount(html) {
        if (!html) return 0;
        // Strip HTML tags using regex for performance and to avoid DOM dependency in model
        const text = html.replace(/<[^>]*>/g, ' ');
        // Replace non-breaking spaces and other entities
        const cleanText = text.replace(/&nbsp;/g, ' ').replace(/&[a-z]+;/g, ' ');
        return cleanText.split(/\s+/).filter(w => w.length > 0).length;
    },

    /**
     * Initialise les statistiques par défaut si elles n'existent pas.
     * @returns {Object}
     */
    getDefaultStats() {
        return {
            totalGoal: 50000,
            dailyGoal: 500,
            writingSessions: []
        };
    }
};
