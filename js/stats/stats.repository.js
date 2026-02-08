/**
 * [MVVM : Stats Repository]
 * Gère la persistance et l'accès aux données de statistiques du projet.
 */

const StatsRepository = {
    /**
     * Récupère les stats du projet actuel.
     * @returns {Object}
     */
    getStats() {
        if (typeof project === 'undefined' || !project.stats) {
            return StatsModel.getDefaultStats();
        }
        return project.stats;
    },

    /**
     * Met à jour un objectif spécifique.
     * @param {string} type 'totalGoal' ou 'dailyGoal'
     * @param {number} value 
     */
    updateGoal(type, value) {
        if (typeof project === 'undefined') return;

        if (!project.stats) {
            project.stats = StatsModel.getDefaultStats();
        }

        project.stats[type] = parseInt(value) || 0;

        if (typeof saveProject === 'function') {
            saveProject();
        }

        // Dispatch event for UI update
        window.dispatchEvent(new CustomEvent('statsUpdated'));
    },

    /**
     * Ajoute ou met à jour une session d'écriture.
     * @param {Object} session 
     */
    saveSession(session) {
        if (typeof project === 'undefined') return;

        if (!project.stats) project.stats = StatsModel.getDefaultStats();
        if (!project.stats.writingSessions) project.stats.writingSessions = [];

        const today = new Date().toDateString();
        const index = project.stats.writingSessions.findIndex(s => new Date(s.date).toDateString() === today);

        if (index >= 0) {
            project.stats.writingSessions[index] = { ...project.stats.writingSessions[index], ...session };
        } else {
            project.stats.writingSessions.push({
                date: new Date().toISOString(),
                ...session
            });
        }

        if (typeof saveProject === 'function') {
            saveProject();
        }
    }
};
