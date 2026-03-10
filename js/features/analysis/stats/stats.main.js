/**
 * [MVVM : Stats Main]
 * Initialisation du module et exposition des méthodes globales pour la compatibilité.
 */

(function () {
    // Flag interne pour savoir si initTodaySession a déjà tourné
    let _todaySessionInitialized = false;

    function init() {
        // Exposer les fonctions globales pour la compatibilité avec le reste de l'app non refactorisée
        window.updateStats = () => StatsView.updateHeaderStats();
        window.renderStats = () => StatsView.renderStatsPage();
        window.trackWritingSession = () => StatsViewModel.trackWritingSession();
        window.getWordCount = (html) => StatsModel.getWordCount(html);
        window.updateGoal = (type, value) => StatsRepository.updateGoal(type, value);

        /**
         * Initialise le baseline de la session du jour si pas encore fait.
         * Doit être appelé AVANT toute frappe, au chargement du projet.
         * 
         * FIX : on expose le flag _todaySessionInitialized pour que trackWritingSession
         * puisse refuser de compter si cette fonction n'a pas encore tourné.
         */
        const _getDateKey = (date) => {
            if (!date) return "";
            const d = new Date(date);
            if (isNaN(d.getTime())) return "";
            return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
        };

        window.initTodaySession = () => {
            const stats = StatsRepository.getStats();
            if (!stats) return;
            if (!Array.isArray(stats.writingSessions)) stats.writingSessions = [];

            const todayStr = _getDateKey(new Date());
            const session = stats.writingSessions.find(s => _getDateKey(s.date) === todayStr);

            if (!session) {
                // Aucune session pour aujourd'hui : créer le baseline MAINTENANT
                const { totalWords } = (typeof StatsViewModel !== 'undefined') ? StatsViewModel.getProjectStats() : { totalWords: 0 };
                console.log(`[Stats] initTodaySession - Creating baseline at ${totalWords} words (Today: ${todayStr})`);
                StatsRepository.saveSession({
                    words: 0,
                    startWords: totalWords
                });
            } else if (session.startWords === undefined || session.startWords === null) {
                // Session orpheline sans baseline : on répare
                const { totalWords } = (typeof StatsViewModel !== 'undefined') ? StatsViewModel.getProjectStats() : { totalWords: 0 };
                console.log(`[Stats] initTodaySession - Repairing orphan session, setting startWords to ${totalWords}`);
                StatsRepository.saveSession({ startWords: totalWords });
            } else {
                console.log(`[Stats] initTodaySession - Session already exists (Today: ${todayStr}, startWords: ${session.startWords}, words: ${session.words})`);
            }

            _todaySessionInitialized = true;
            window._todaySessionInitialized = true; // Exposé pour StatsViewModel
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

        /**
         * FIX CRITIQUE : Écouter l'événement projectLoaded pour initialiser
         * le baseline AU BON MOMENT — après le chargement complet du projet,
         * avant toute frappe de l'utilisateur.
         */
        let _initDone = false;
        const _doInit = () => {
            if (_initDone) return;
            // On vérifie que le repository est prêt avant de marquer l'init comme faite
            if (typeof StatsRepository === 'undefined') return;

            _initDone = true;
            console.log('[Stats] Triggering global stats initialization');
            StatsView.updateHeaderStats();
            if (typeof window.initTodaySession === 'function') {
                window.initTodaySession();
            }
        };

        window.addEventListener('projectLoaded', _doInit);

        // Déclenchement immédiat si le projet est déjà chargé (cas de navigation ou chargement ultra-rapide)
        if (typeof project !== 'undefined' && project.id) {
            console.log('[Stats] Project already present, initializing immediately');
            _doInit();
        }

        // Fallback : si projectLoaded n'est jamais émis
        setTimeout(_doInit, 600);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
