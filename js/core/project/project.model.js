/**
 * [MVVM : Project Model]
 * Logique pure de structure de données et algorithmes d'analyse.
 */

const ProjectModel = {
    /**
     * Crée un projet par défaut.
     * @returns {Object}
     */
    createDefault() {
        return {
            id: Date.now(),
            title: Localization.t('project.model.default_title'),
            description: "",
            genre: "",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            acts: [],
            characters: [],
            world: [],
            timeline: [],
            notes: [],
            codex: [],
            mindmaps: [],
            stats: { dailyGoal: 500, totalGoal: 80000, writingSessions: [] },
            versions: [],
            relationships: [],
            investigationBoard: {
                cases: [],
                activeCaseId: null,
                facts: [],
                knowledge: [],
                suspectLinks: []
            },
            globalnotes: {
                boards: [],
                items: [],
                activeBoardId: null
            }
        };
    },

    /**
     * S'assure que la structure du projet est complète.
     * @param {Object} project 
     * @returns {Object} Le projet complété
     */
    ensureStructure(project) {
        if (!project) return null;
        project.characters = project.characters || [];
        project.world = project.world || [];
        project.timeline = project.timeline || [];
        project.notes = project.notes || [];
        project.codex = project.codex || [];
        project.stats = project.stats || { dailyGoal: 500, totalGoal: 80000, writingSessions: [] };
        project.versions = project.versions || [];
        project.relationships = project.relationships || [];
        project.acts = project.acts || [];
        project.mindmaps = project.mindmaps || [];
        project.investigationBoard = project.investigationBoard || {
            cases: [],
            activeCaseId: null,
            facts: [],
            knowledge: [],
            suspectLinks: []
        };
        if (project.milanote) {
            project.globalnotes = project.milanote;
            delete project.milanote;
        }
        project.globalnotes = project.globalnotes || {
            boards: [],
            items: [],
            activeBoardId: null
        };
        return project;
    },

    /**
     * Nettoie le HTML pour en extraire le texte brut.
     * @param {string} html 
     * @returns {string}
     */
    stripHTML(html) {
        if (!html) return '';
        // Utilise une méthode agnostique du DOM si possible pour le modèle, 
        // mais ici on est dans le navigateur.
        const div = document.createElement('div');
        div.innerHTML = html;
        return div.textContent || div.innerText || '';
    },

    /**
     * Détecte les répétitions de mots dans un texte.
     * @param {string} text 
     * @returns {Array} Top 10 des répétitions [mot, compte]
     */
    detectRepetitions(text) {
        const words = text.toLowerCase().match(/[\p{L}]{4,}/gu) || [];
        const frequency = {};
        words.forEach(word => frequency[word] = (frequency[word] || 0) + 1);

        return Object.entries(frequency)
            .filter(([word, count]) => count >= 5)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);
    },

    /**
     * Calcule le score de lisibilité Flesch (adapté au français).
     * @param {string} text 
     * @returns {Object} {score, level}
     */
    calculateReadability(text) {
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const words = text.match(/[\p{L}]+/gu) || [];
        const syllables = words.reduce((sum, word) => sum + this.countSyllables(word), 0);

        if (sentences.length === 0 || words.length === 0) return { score: 0, level: Localization.t('project.model.readability_na') };

        // Flesch Reading Ease
        const avgWordsPerSentence = words.length / sentences.length;
        const avgSyllablesPerWord = syllables / words.length;
        const score = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);

        let level = '';
        if (score >= 90) level = Localization.t('project.model.readability_very_easy');
        else if (score >= 80) level = Localization.t('project.model.readability_easy');
        else if (score >= 70) level = Localization.t('project.model.readability_fairly_easy');
        else if (score >= 60) level = Localization.t('project.model.readability_standard');
        else if (score >= 50) level = Localization.t('project.model.readability_fairly_difficult');
        else if (score >= 30) level = Localization.t('project.model.readability_difficult');
        else level = Localization.t('project.model.readability_very_difficult');

        return { score: Math.max(0, Math.min(100, score)).toFixed(1), level };
    },

    /**
     * Compte les syllabes d'un mot.
     * @param {string} word 
     * @returns {number}
     */
    countSyllables(word) {
        word = word.toLowerCase();
        const vowels = /[aeiouyàâäéèêëïîôùûü]/g;
        const matches = word.match(vowels);
        if (!matches) return 1;

        let count = matches.length;
        if (word.endsWith('e')) count--;
        if (word.match(/[aeiouy]{2,}/)) count--;
        return Math.max(1, count);
    },

    /**
     * Calcule la fréquence des mots significatifs.
     * @param {string} text 
     * @returns {Array} Top 15 [mot, compte]
     */
    calculateWordFrequency(text) {
        const words = text.toLowerCase().match(/[\p{L}]{3,}/gu) || [];
        const stopWords = new Set(['le', 'la', 'les', 'un', 'une', 'des', 'de', 'du', 'et', 'ou', 'où', 'qui', 'que', 'quoi', 'dont', 'ce', 'cette', 'ces', 'son', 'sa', 'ses', 'mon', 'ma', 'mes', 'ton', 'ta', 'tes', 'notre', 'nos', 'votre', 'vos', 'leur', 'leurs', 'je', 'tu', 'il', 'elle', 'nous', 'vous', 'ils', 'elles', 'on', 'ne', 'pas', 'plus', 'dans', 'sur', 'pour', 'par', 'avec', 'sans', 'est', 'était', 'être', 'avoir', 'fait', 'faire', 'dit', 'dire', 'peut', 'bien', 'tout', 'tous', 'comme', 'très', 'aussi', 'encore', 'mais', 'donc', 'ainsi']);

        const frequency = {};
        words.forEach(word => {
            if (!stopWords.has(word)) {
                frequency[word] = (frequency[word] || 0) + 1;
            }
        });

        return Object.entries(frequency)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 15);
    },

    /**
     * Calcule les statistiques sur la longueur des phrases.
     * @param {string} text 
     * @returns {Object}
     */
    calculateSentenceLength(text) {
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const lengths = sentences.map(s => s.trim().split(/\s+/).length);

        if (lengths.length === 0) return { avg: 0, min: 0, max: 0, distribution: [] };

        const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length;
        const min = Math.min(...lengths);
        const max = Math.max(...lengths);

        const ranges = [
            { label: Localization.t('project.model.range_1_5'), count: lengths.filter(l => l >= 1 && l <= 5).length },
            { label: Localization.t('project.model.range_6_10'), count: lengths.filter(l => l >= 6 && l <= 10).length },
            { label: Localization.t('project.model.range_11_15'), count: lengths.filter(l => l >= 11 && l <= 15).length },
            { label: Localization.t('project.model.range_16_20'), count: lengths.filter(l => l >= 16 && l <= 20).length },
            { label: Localization.t('project.model.range_20_plus'), count: lengths.filter(l => l > 20).length }
        ];

        return { avg: avg.toFixed(1), min, max, distribution: ranges };
    },

    /**
     * Analyse la répartition narration vs dialogue.
     * @param {string} text 
     * @returns {Object}
     */
    analyzeNarrativeDistribution(text) {
        const dialogRegex = /[«"—–]\s*[^»"—–]{10,}?\s*[»"—–]/g;
        const dialogs = text.match(dialogRegex) || [];
        const dialogLength = dialogs.join('').length;
        const totalLength = text.length;

        const dialogPercent = totalLength > 0 ? (dialogLength / totalLength * 100).toFixed(1) : 0;
        const narrativePercent = totalLength > 0 ? (100 - dialogPercent).toFixed(1) : 0;

        return {
            dialogue: dialogPercent,
            narrative: narrativePercent,
            dialogCount: dialogs.length
        };
    }
};
