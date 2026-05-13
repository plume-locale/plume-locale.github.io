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
        const cleanText = text.replace(/&nbsp;/gi, ' ').replace(/&[a-zA-Z0-9#]+;/g, '');
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
            writingSessions: [],
            smartGoal: {
                mode: 'fixed', // 'fixed' | 'date'
                targetDate: null,
                daysOff: [], // [0, 6] for Sunday, Saturday
                sessionDuration: 60 // minutes
            },
            nanoMode: false // NaNoWriMo mode flag
        };
    },

    /**
     * Calcule le streak (jours consécutifs avec dailyGoal atteint) depuis les sessions.
     * La logique remonte à partir d'aujourd'hui vers le passé.
     * Un jour sans session ou sous l'objectif casse le streak.
     * @param {Array} writingSessions - Tableau de sessions { date, words }
     * @param {number} dailyGoal
     * @returns {Object} { current, longest, lastActiveDate }
     */
    calculateStreak(writingSessions, dailyGoal) {
        if (!Array.isArray(writingSessions) || writingSessions.length === 0) {
            return { current: 0, longest: 0, lastActiveDate: null };
        }

        const goal = dailyGoal || 1;

        // Construire un Set des dates où l'objectif a été atteint (format YYYY-MM-DD)
        const successDays = new Set();
        writingSessions.forEach(s => {
            if (s.words >= goal) {
                const d = new Date(s.date);
                if (!isNaN(d.getTime())) {
                    const key = `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,'0')}-${d.getDate().toString().padStart(2,'0')}`;
                    successDays.add(key);
                }
            }
        });

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const toKey = (d) => `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,'0')}-${d.getDate().toString().padStart(2,'0')}`;

        // Calcul du streak courant (en remontant depuis aujourd'hui)
        let current = 0;
        let lastActiveDate = null;
        const cursor = new Date(today);

        // Si aujourd'hui a un objectif atteint, on compte ; sinon on commence depuis hier
        if (!successDays.has(toKey(cursor))) {
            // Partir d'hier (aujourd'hui n'est pas encore terminé, ne casse pas le streak)
            cursor.setDate(cursor.getDate() - 1);
        }

        while (successDays.has(toKey(cursor))) {
            current++;
            if (lastActiveDate === null) lastActiveDate = new Date(cursor);
            cursor.setDate(cursor.getDate() - 1);
        }

        // Calcul du streak le plus long (sur tout l'historique)
        const sortedDays = Array.from(successDays).sort();
        let longest = 0;
        let tempStreak = 0;
        let prevDate = null;

        sortedDays.forEach(dayKey => {
            const d = new Date(dayKey + 'T00:00:00');
            if (prevDate === null) {
                tempStreak = 1;
            } else {
                const diff = Math.round((d - prevDate) / 86400000);
                if (diff === 1) {
                    tempStreak++;
                } else {
                    tempStreak = 1;
                }
            }
            if (tempStreak > longest) longest = tempStreak;
            prevDate = d;
        });

        if (current > longest) longest = current;

        return { current, longest, lastActiveDate };
    }
};
