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

        // Appeler updateStats une première fois au chargement
        setTimeout(() => StatsView.updateHeaderStats(), 100);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
