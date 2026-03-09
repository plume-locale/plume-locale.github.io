/**
 * [MVVM : Stats Main]
 * Initialisation du module et exposition des méthodes globales pour la compatibilité.
 */

(function () {
    // Initialisation
    function init() {
        // Exposer les fonctions globales pour la compatibilité avec le reste de l'app non refactorisée
        window.updateStats = () => StatsView.updateHeaderStats();
        window.renderStats = () => StatsView.renderStatsPage();
        window.trackWritingSession = () => StatsViewModel.trackWritingSession();
        window.getWordCount = (html) => StatsModel.getWordCount(html);
        window.updateGoal = (type, value) => StatsRepository.updateGoal(type, value);

        // Initialise le baseline de la session du jour si pas encore fait.
        // Doit être appelé AVANT toute frappe, au chargement du projet.
        window.initTodaySession = () => {
            const stats = StatsRepository.getStats();
            if (!stats) return;
            if (!Array.isArray(stats.writingSessions)) stats.writingSessions = [];

            const today = new Date().toDateString();
            const session = stats.writingSessions.find(s => new Date(s.date).toDateString() === today);

            // Si aucune session n'existe pour aujourd'hui, on crée le baseline MAINTENANT,
            // avant que l'utilisateur n'ait tapé quoi que ce soit.
            if (!session) {
                const { totalWords } = StatsViewModel.getProjectStats();
                StatsRepository.saveSession({
                    words: 0,
                    startWords: totalWords
                });
            } else if (session.startWords === undefined || session.startWords === null) {
                // Session orpheline sans baseline : on répare
                const { totalWords } = StatsViewModel.getProjectStats();
                StatsRepository.saveSession({ startWords: totalWords });
            }
        };

        // Écouter les mises à jour des stats pour rafraîchir la vue si on est dessus
        window.addEventListener('statsUpdated', () => {
            StatsView.updateHeaderStats();
            if (document.querySelector('.stats-container')) {
                StatsView.renderStatsPage();
            }
        });

        // Rafraîchir lors du changement de langue
        window.addEventListener('localeChanged', () => {
            StatsView.updateHeaderStats();
            if (document.querySelector('.stats-container')) {
                StatsView.renderStatsPage();
            }
        });

        // Appeler updateStats et initTodaySession au chargement
        setTimeout(() => {
            StatsView.updateHeaderStats();
            if (typeof initTodaySession === 'function') initTodaySession();
        }, 300);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
