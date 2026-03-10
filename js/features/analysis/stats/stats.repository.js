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
            if (typeof project !== 'undefined') {
                project.stats = StatsModel.getDefaultStats();
            }
            return (typeof project !== 'undefined' ? project.stats : StatsModel.getDefaultStats());
        }

        // Migration à la volée pour les projets existants
        if (!project.stats.smartGoal) {
            project.stats.smartGoal = StatsModel.getDefaultStats().smartGoal;
        }
        if (project.stats.totalGoal === undefined || project.stats.totalGoal === null) {
            project.stats.totalGoal = StatsModel.getDefaultStats().totalGoal || 50000;
        }
        if (project.stats.dailyGoal === undefined || project.stats.dailyGoal === null) {
            project.stats.dailyGoal = StatsModel.getDefaultStats().dailyGoal || 500;
        }
        if (!Array.isArray(project.stats.writingSessions)) {
            project.stats.writingSessions = [];
        }

        return project.stats;
    },

    /**
     * Sauvegarde les statistiques et déclenche l'événement global.
     * 
     * FIX : On utilise un flag _saving pour éviter les appels réentrants
     * si statsUpdated déclenche indirectement un nouveau saveSession.
     */
    _saving: false,
    _save() {
        if (this._saving) return;
        this._saving = true;

        if (typeof saveProject === 'function') {
            saveProject();
        }

        // Dispatch event for UI update — on le fait en dehors du flag pour éviter
        // de bloquer des mises à jour légitimes déclenchées par l'événement.
        this._saving = false;
        window.dispatchEvent(new CustomEvent('statsUpdated'));
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
        this._save();
    },

    /**
     * Met à jour la configuration des objectifs intelligents.
     * @param {Object} config ({ mode, targetDate, daysOff, sessionDuration })
     */
    updateSmartGoal(config) {
        const stats = this.getStats();
        stats.smartGoal = { ...stats.smartGoal, ...config };
        this._save();
    },

    /**
     * Ajoute ou met à jour une session d'écriture.
     * Fusionne les propriétés fournies avec la session existante du jour,
     * sans écraser les champs non fournis.
     * @param {Object} session 
     */
    saveSession(session) {
        if (typeof project === 'undefined') return;

        if (!project.stats) project.stats = StatsModel.getDefaultStats();
        if (!project.stats.writingSessions) project.stats.writingSessions = [];

        const today = new Date();
        const todayStr = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
        const index = project.stats.writingSessions.findIndex(s => {
            const d = new Date(s.date);
            const sStr = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
            return sStr === todayStr;
        });

        if (index >= 0) {
            // Merge : on ne remplace que les champs explicitement fournis
            project.stats.writingSessions[index] = {
                ...project.stats.writingSessions[index],
                ...session
            };
        } else {
            project.stats.writingSessions.push({
                date: new Date().toISOString(),
                words: 0,
                startWords: null,
                ...session
            });
        }

        this._save();
    }
};
