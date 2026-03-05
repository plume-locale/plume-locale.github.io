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
                            totalWords += (scene.content ? StatsModel.getWordCount(scene.content) : (scene.wordCount || 0));
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
                            actWords += (scene.content ? StatsModel.getWordCount(scene.content) : (scene.wordCount || 0));
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
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const session = stats.writingSessions.find(s => new Date(s.date).toDateString() === today.toDateString());
        const words = session ? session.words : 0;

        let dailyGoal = stats.dailyGoal || 500;

        // Smart Goal Logic
        if (stats.smartGoal && stats.smartGoal.mode === 'date' && stats.smartGoal.targetDate) {
            const targetDate = new Date(stats.smartGoal.targetDate);
            targetDate.setHours(0, 0, 0, 0);

            if (targetDate >= today) {
                const { totalWords } = this.getProjectStats();
                // Total restant à écrire (en incluant ce qui a déjà été écrit aujourd'hui pour ne pas fausser le calcul)
                const totalRemaining = Math.max(0, (stats.totalGoal || 0) - (totalWords - words));

                const daysLeft = this._calculateWorkingDays(today, targetDate, stats.smartGoal.daysOff || []);

                if (daysLeft > 0) {
                    dailyGoal = Math.ceil(totalRemaining / daysLeft);
                } else {
                    // Si on est le dernier jour (ou dépassé) mais qu'il reste du travail
                    dailyGoal = totalRemaining;
                }
            }
        }

        return {
            words,
            goal: dailyGoal,
            progress: Math.min((words / (dailyGoal || 1)) * 100, 100)
        };
    },

    /**
     * Calcule le nombre de jours ouvrables entre deux dates.
     * @private
     */
    _calculateWorkingDays(start, end, daysOff) {
        let count = 0;
        let current = new Date(start);
        const dayOffSet = new Set(daysOff.map(d => parseInt(d))); // Ensure numbers

        // Sécurité pour éviter boucle infinie si dates invalides
        if (start > end) return 0;

        // Copie pour ne pas modifier l'original
        current = new Date(current.getTime());

        while (current <= end) {
            if (!dayOffSet.has(current.getDay())) {
                count++;
            }
            current.setDate(current.getDate() + 1);
        }
        return count;
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
     * Récupère l'historique sur une période configurée (1 mois, 3 mois, 6 mois, 1 an).
     * @param {string} period '1m', '3m', '6m', '1y'
     * @returns {Array} Array of { date, words }
     */
    getHistoryByPeriod(period) {
        const stats = StatsRepository.getStats();
        const history = [];
        const endDate = new Date(); // Aujourd'hui
        let startDate = new Date();

        // Définir la date de début selon la période
        switch (period) {
            case '1w': startDate.setDate(endDate.getDate() - 7); break;
            case '1m': startDate.setMonth(endDate.getMonth() - 1); break;
            case '3m': startDate.setMonth(endDate.getMonth() - 3); break;
            case '6m': startDate.setMonth(endDate.getMonth() - 6); break;
            case '1y': startDate.setFullYear(endDate.getFullYear() - 1); break;
            default: startDate.setMonth(endDate.getMonth() - 1); // Par défaut 1 mois
        }

        // Reset hours
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(0, 0, 0, 0);

        // Créer un array de dates continues
        const dailyGoal = stats.dailyGoal || 500;

        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toDateString();
            // On cherche s'il y a une session pour ce jour
            const session = stats.writingSessions.find(s => new Date(s.date).toDateString() === dateStr);
            history.push({
                date: new Date(d),
                dateStr: d.toLocaleDateString(),
                words: session ? session.words : 0,
                goal: dailyGoal // Simplification: on suppose l'objectif constant ou actuel pour l'historique
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
     * 
     * Logique :
     * - Si une session du jour existe déjà : on calcule les mots nets écrits
     *   depuis le début de la session (totalWords - startWords).
     * - Si aucune session n'existe : on initialise avec startWords = totalWords ACTUEL.
     *   IMPORTANT : on soustrait 1 unité de "frappe" car scene.content a déjà été
     *   mis à jour avant cet appel. On utilise scene.wordCount comme baseline plus fiable
     *   si disponible, sinon on continue avec totalWords.
     */
    trackWritingSession() {
        const { totalWords } = this.getProjectStats();
        const today = new Date().toDateString();
        const stats = StatsRepository.getStats();
        const session = stats.writingSessions.find(s => new Date(s.date).toDateString() === today);

        if (session) {
            // Session existante : calculer les mots nets depuis le début de la journée
            const startWords = session.startWords;
            // Si startWords n'a jamais été défini (ancienne session), on l'initialise maintenant
            if (startWords === undefined || startWords === null) {
                StatsRepository.saveSession({ startWords: totalWords, words: 0 });
                return;
            }
            const newWords = totalWords - startWords;
            StatsRepository.saveSession({ words: Math.max(0, newWords) });
        } else {
            // Première écriture de la journée :
            // startWords = total actuel (déjà mis à jour avec le contenu courant)
            // On initialise words à 0, le prochain passage calculera correctement.
            StatsRepository.saveSession({
                words: 0,
                startWords: totalWords
            });
        }
    }
};
