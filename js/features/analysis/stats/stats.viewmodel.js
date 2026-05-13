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
     * Aggregates words by hour of the day across all sessions.
     * @returns {Array} Array of 24 numbers (words written for each hour 0-23)
     */
    getHourlyHeatmap() {
        const stats = StatsRepository.getStats();
        const hours = new Array(24).fill(0);
        stats.writingSessions.forEach(session => {
            if (session.hourly) {
                for (let i = 0; i < 24; i++) {
                    if (session.hourly[i]) hours[i] += session.hourly[i];
                }
            }
        });
        return hours;
    },

    /**
     * Aggregates words by day of the week.
     * @returns {Array} Array of 7 numbers (Mon=0, Sun=6)
     */
    getWeekdayHeatmap() {
        const stats = StatsRepository.getStats();
        const days = new Array(7).fill(0);
        stats.writingSessions.forEach(session => {
            if (session.words && session.date) {
                const d = new Date(session.date);
                if (!isNaN(d)) {
                    // getDay: 0=Sun, 1=Mon... -> We want 0=Mon, 6=Sun
                    const jsDay = d.getDay();
                    const index = (jsDay + 6) % 7; 
                    days[index] += session.words;
                }
            }
        });
        return days;
    },

    /**
     * Aggregates words by day of the week and hour of the day.
     * @returns {Array} Array of 7 arrays, each containing 24 numbers (Mon=0, Sun=6)
     */
    getPunchcardHeatmap() {
        const stats = StatsRepository.getStats();
        const punchcard = Array.from({ length: 7 }, () => new Array(24).fill(0));
        
        stats.writingSessions.forEach(session => {
            if (session.date && session.hourly) {
                const d = new Date(session.date);
                if (!isNaN(d)) {
                    const jsDay = d.getDay();
                    const index = (jsDay + 6) % 7; 
                    for (let i = 0; i < 24; i++) {
                        if (session.hourly[i]) {
                            punchcard[index][i] += session.hourly[i];
                        }
                    }
                }
            }
        });
        return punchcard;
    },

    /**
     * Returns a year's worth of daily writing data.
     */
    getYearlyHeatmap() {
        const stats = StatsRepository.getStats();
        const data = {};
        stats.writingSessions.forEach(s => {
            if (s.date && s.words) {
                const d = new Date(s.date);
                if (!isNaN(d)) {
                    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
                    data[key] = (data[key] || 0) + s.words;
                }
            }
        });
        return data;
    },

    /**
     * Calcule la progression du jour.
     * @returns {Object}
     */
    getTodayStats() {
        const stats = StatsRepository.getStats();
        const today = new Date();
        const todayStr = this._getDateKey(today);

        const session = stats.writingSessions.find(s => this._getDateKey(s.date) === todayStr);
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
     * Retourne une clé de date localisée stable (YYYY-MM-DD).
     * @private
     */
    _getDateKey(date) {
        if (!date) return "";
        const d = new Date(date);
        if (isNaN(d.getTime())) return "";
        return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
    },

    /**
     * Calcule le nombre de jours ouvrables entre deux dates.
     * @private
     */
    _calculateWorkingDays(start, end, daysOff) {
        let count = 0;
        let current = new Date(start);
        const dayOffSet = new Set(daysOff.map(d => parseInt(d)));

        if (start > end) return 0;

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
            const dateStr = this._getDateKey(date);
            const session = stats.writingSessions.find(s => this._getDateKey(s.date) === dateStr);
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
     * Récupère l'historique sur une période configurée (1 semaine, 1 mois, 3 mois, 6 mois, 1 an).
     * @param {string} period '1w', '1m', '3m', '6m', '1y'
     * @returns {Array} Array of { date, words }
     */
    getHistoryByPeriod(period) {
        const stats = StatsRepository.getStats();
        const history = [];
        const endDate = new Date();
        let startDate = new Date();

        switch (period) {
            case '1w': startDate.setDate(endDate.getDate() - 7); break;
            case '1m': startDate.setMonth(endDate.getMonth() - 1); break;
            case '3m': startDate.setMonth(endDate.getMonth() - 3); break;
            case '6m': startDate.setMonth(endDate.getMonth() - 6); break;
            case '1y': startDate.setFullYear(endDate.getFullYear() - 1); break;
            default: startDate.setMonth(endDate.getMonth() - 1);
        }

        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(0, 0, 0, 0);

        const dailyGoal = stats.dailyGoal || 500;

        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dateStr = this._getDateKey(d);
            const session = stats.writingSessions.find(s => this._getDateKey(s.date) === dateStr);
            history.push({
                date: new Date(d),
                dateStr: d.toLocaleDateString(),
                words: session ? session.words : 0,
                goal: dailyGoal
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
     * FIX CRITIQUE #1 : On vérifie que initTodaySession a bien tourné avant de compter.
     * Si ce n'est pas le cas, on l'appelle maintenant (rattrapage) et on sort,
     * car on ne peut pas compter sans un baseline fiable.
     *
     * FIX #2 : En cas de suppression de texte, on ajuste startWords proprement
     * en une seule opération saveSession pour éviter les doubles écritures.
     */
    /**
     * Retourne les données de streak pour l'affichage.
     * @returns {Object} { current, longest, lastActiveDate, isActive }
     */
    getStreakData() {
        const stats = StatsRepository.getStats();
        const streak = StatsModel.calculateStreak(stats.writingSessions, stats.dailyGoal || 500);
        
        // isActive = streak > 0 ET (aujourd'hui ou hier est le dernier jour actif)
        let isActive = false;
        if (streak.lastActiveDate) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const last = new Date(streak.lastActiveDate);
            last.setHours(0, 0, 0, 0);
            const diffDays = Math.round((today - last) / 86400000);
            isActive = diffDays <= 1 && streak.current > 0;
        }

        return { ...streak, isActive };
    },

    /**
     * Calcule les statistiques NaNoWriMo (50 000 mots en 30 jours).
     * La date de début du NaNo est stockée dans stats.nanoStartDate.
     * Si pas de date de début, on utilise aujourd'hui.
     * @returns {Object} { 
     *   targetWords, currentWords, wordsNeeded, daysElapsed, daysLeft,
     *   requiredPerDay, writtenPerDay, onTrack, paceWords, progressPercent
     * }
     */
    getNaNoStats() {
        const NANO_TARGET = 50000;
        const NANO_DAYS = 30;

        const stats = StatsRepository.getStats();
        const { totalWords } = this.getProjectStats();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Date de début du challenge
        let startDate;
        if (stats.nanoStartDate) {
            startDate = new Date(stats.nanoStartDate);
            startDate.setHours(0, 0, 0, 0);
        } else {
            // Par défaut : 1er du mois courant si dans les 30 premiers jours, sinon aujourd'hui
            startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        }

        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + NANO_DAYS - 1);

        const daysElapsed = Math.max(1, Math.min(
            Math.round((today - startDate) / 86400000) + 1,
            NANO_DAYS
        ));
        const daysLeft = Math.max(0, NANO_DAYS - daysElapsed + 1);

        // Mots écrits depuis le début du NaNo
        const nanoWords = stats.writingSessions
            .filter(s => {
                const d = new Date(s.date);
                return d >= startDate && d <= new Date();
            })
            .reduce((sum, s) => sum + (s.words || 0), 0);

        // Mots requis par jour pour atteindre l'objectif
        const requiredPerDay = Math.ceil(NANO_TARGET / NANO_DAYS); // 1 667
        // Mots écrits en moyenne par jour depuis le début
        const writtenPerDay = daysElapsed > 0 ? Math.round(nanoWords / daysElapsed) : 0;
        // Mots nécessaires par jour pour finir à temps
        const wordsNeeded = daysLeft > 0 ? Math.ceil(Math.max(0, NANO_TARGET - nanoWords) / daysLeft) : 0;
        // Mots attendus à ce stade du challenge (pace)
        const paceWords = requiredPerDay * daysElapsed;
        const onTrack = nanoWords >= paceWords;
        const progressPercent = Math.min((nanoWords / NANO_TARGET) * 100, 100);

        return {
            targetWords: NANO_TARGET,
            currentWords: nanoWords,
            wordsNeeded,
            daysElapsed,
            daysLeft,
            requiredPerDay,
            writtenPerDay,
            onTrack,
            paceWords,
            progressPercent,
            startDate,
            endDate
        };
    },

    trackWritingSession() {
        // --- Garde : initTodaySession doit avoir tourné ---
        if (!window._todaySessionInitialized) {
            console.warn('[Stats] trackWritingSession called before initTodaySession — initializing now and skipping this tick');
            if (typeof window.initTodaySession === 'function') {
                window.initTodaySession();
            }
            return; // On sort : le baseline vient d'être posé, on comptera au prochain appel
        }

        const { totalWords } = this.getProjectStats();
        const todayStr = this._getDateKey(new Date());
        const stats = StatsRepository.getStats();

        if (!Array.isArray(stats.writingSessions)) stats.writingSessions = [];
        const session = stats.writingSessions.find(s => this._getDateKey(s.date) === todayStr);

        console.log(`[Stats] Tracking Session - Total: ${totalWords}, HasSession: ${!!session}, WordsRecorded: ${session ? session.words : 'N/A'}, StartWords: ${session ? session.startWords : 'N/A'}`);

        if (session) {
            // S'assurer que startWords est défini
            let startWords = session.startWords;
            if (startWords === undefined || startWords === null) {
                // Cas de rattrapage : la session existe mais n'a pas de baseline
                console.log(`[Stats] Initializing missing startWords to ${totalWords}`);
                StatsRepository.saveSession({ startWords: totalWords, words: 0 });
                return;
            }

            let newWords = totalWords - startWords;

            if (newWords < 0) {
                // L'utilisateur a supprimé plus que ce qu'il a écrit depuis le début de session.
                // On ajuste startWords pour que le compteur ne soit pas négatif,
                // tout en préservant le score déjà enregistré si possible.
                const currentRecorded = session.words || 0;

                if (currentRecorded > 0) {
                    // On ajuste startWords pour maintenir le score positif acquis
                    const adjustedStartWords = totalWords - currentRecorded;
                    console.log(`[Stats] Negative newWords (${newWords}), adjusting startWords from ${startWords} to ${adjustedStartWords}`);
                    StatsRepository.saveSession({ startWords: adjustedStartWords, words: currentRecorded });
                } else {
                    // Score était déjà à 0, on recale juste le baseline
                    console.log(`[Stats] Negative newWords (${newWords}) with 0 recorded, recalibrating startWords to ${totalWords}`);
                    StatsRepository.saveSession({ startWords: totalWords, words: 0 });
                }
                return;
            }

            // FIX #2 : Si newWords < mots déjà enregistrés (suppression partielle en cours de session)
            // On ne diminue pas le compteur — les mots écrits dans la session sont acquis.
            // On ajuste startWords en une seule opération pour éviter la double écriture.
            if (newWords < (session.words || 0)) {
                const adjustedStartWords = totalWords - (session.words || 0);
                console.log(`[Stats] Deletion detected: keeping recorded ${session.words} words, adjusting startWords to ${adjustedStartWords}`);
                StatsRepository.saveSession({ startWords: adjustedStartWords });
                return; // On sort : le score reste inchangé
            }

            // Cas normal : on enregistre la progression
            StatsRepository.saveSession({ words: newWords });

        } else {
            // Pas de session pour aujourd'hui — normalement initTodaySession aurait dû la créer.
            // On la crée maintenant en rattrapage.
            console.log(`[Stats] Creating new session for today starting at ${totalWords} (rattrapage)`);
            StatsRepository.saveSession({
                words: 0,
                startWords: totalWords
            });
        }
    }
};
