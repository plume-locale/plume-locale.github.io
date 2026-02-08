/**
 * [MVVM : Stats ViewModel]
 * Transforme les données brutes en données prêtes pour l'affichage.
 */

const StatsViewModel = {
    /**
     * Calcule les statistiques totales du projet.
     * @returns {Object}
     */
    getProjectStats() {
        if (typeof project === 'undefined' || !project.acts) {
            return { totalWords: 0, totalChapters: 0, totalScenes: 0 };
        }

        let totalWords = 0;
        let totalChapters = 0;
        let totalScenes = 0;

        project.acts.forEach(act => {
            if (act.chapters) {
                totalChapters += act.chapters.length;
                act.chapters.forEach(chapter => {
                    if (chapter.scenes) {
                        totalScenes += chapter.scenes.length;
                        chapter.scenes.forEach(scene => {
                            totalWords += (scene.wordCount || (scene.content ? StatsModel.getWordCount(scene.content) : 0));
                        });
                    }
                });
            }
        });

        return { totalWords, totalChapters, totalScenes };
    },

    /**
     * Récupère les stats détaillées par acte.
     * @returns {Array}
     */
    getStatsByAct() {
        if (typeof project === 'undefined' || !project.acts) return [];

        return project.acts.map(act => {
            let actWords = 0;
            if (act.chapters) {
                act.chapters.forEach(chapter => {
                    if (chapter.scenes) {
                        chapter.scenes.forEach(scene => {
                            actWords += (scene.wordCount || (scene.content ? StatsModel.getWordCount(scene.content) : 0));
                        });
                    }
                });
            }
            return {
                title: act.title,
                wordCount: actWords
            };
        });
    },

    /**
     * Calcule la progression du jour.
     * @returns {Object}
     */
    getTodayStats() {
        const stats = StatsRepository.getStats();
        const today = new Date().toDateString();
        const session = stats.writingSessions.find(s => new Date(s.date).toDateString() === today);
        const words = session ? session.words : 0;

        return {
            words,
            goal: stats.dailyGoal,
            progress: Math.min((words / (stats.dailyGoal || 1)) * 100, 100)
        };
    },

    /**
     * Récupère l'historique des 7 derniers jours.
     * @returns {Array}
     */
    getLast7DaysHistory() {
        const stats = StatsRepository.getStats();
        const history = [];
        const dailyGoal = stats.dailyGoal || 1;

        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toDateString();

            const session = stats.writingSessions.find(s => new Date(s.date).toDateString() === dateStr);
            const words = session ? session.words : 0;

            history.push({
                date: date,
                label: date.toLocaleDateString(typeof Localization !== 'undefined' && Localization.getLocale() === 'fr' ? 'fr-FR' : 'en-US', { weekday: 'short', day: 'numeric', month: 'short' }),
                words: words,
                progress: Math.min((words / dailyGoal) * 100, 100),
                goalReached: words >= dailyGoal
            });
        }
        return history;
    },

    /**
     * Formate un nombre pour l'affichage (ex: 1.2k)
     */
    formatWordCount(count) {
        if (count >= 1000) {
            const locale = typeof Localization !== 'undefined' ? Localization.getLocale() : 'fr';
            const separator = locale === 'fr' ? ',' : '.';
            return (count / 1000).toFixed(1).replace('.', separator).replace(separator + '0', '') + 'k';
        }
        return count.toString();
    },

    /**
     * Suit la session d'écriture actuelle.
     */
    trackWritingSession() {
        const { totalWords } = this.getProjectStats();
        const today = new Date().toDateString();
        const stats = StatsRepository.getStats();
        const session = stats.writingSessions.find(s => new Date(s.date).toDateString() === today);

        if (session) {
            const newWords = totalWords - (session.startWords || 0);
            StatsRepository.saveSession({ words: Math.max(0, newWords) });
        } else {
            StatsRepository.saveSession({
                words: 0,
                startWords: totalWords
            });
        }
    }
};
