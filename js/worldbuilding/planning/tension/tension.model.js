/**
 * @file tension.model.js
 * @description Modèle de données pour le module de tension.
 * Gère les calculs de scores et les définitions de données.
 */

const TensionModel = {
    // Valeurs par défaut des mots de tension
    // Valeurs par défaut des mots de tension via getter
    get DEFAULT_TENSION_WORDS() {
        return {
            high: Localization.t('tension.defaults.high'),
            medium: Localization.t('tension.defaults.medium'),
            low: Localization.t('tension.defaults.low')
        };
    },

    /**
     * Calcule la tension en temps réel pour un bloc de texte donné.
     * @param {string} text - Le contenu HTML ou brut à analyser.
     * @param {Object} tensionWords - Dictionnaire des mots de tension.
     * @param {Object} [context] - Contexte narratif optionnel {actId, chapterId, sceneId}
     * @returns {Object} Un objet contenant le score (0-100) et le détail des mots trouvés.
     */
    calculateLiveTension: function (text, tensionWords, context = null) {
        if (!text || text.trim() === '' || text === '<p><br></p>') {
            return { score: 0, details: { high: 0, medium: 0, low: 0 }, foundWords: { high: [], medium: [], low: [] } };
        }

        // Nettoyer le HTML de manière consistante
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = text;
        // Remplacer les blocks par des espaces pour éviter les mots collés lors du stripping
        const blocks = tempDiv.querySelectorAll('p, div, br, h1, h2, h3');
        blocks.forEach(b => {
            if (b.tagName === 'BR') b.after(' ');
            else b.after(' ');
        });

        const cleanText = tempDiv.textContent.toLowerCase();
        const foundWords = { high: [], medium: [], low: [] };
        let lexicalScore = 0;

        // 1. ANALYSE LEXICALE
        if (tensionWords.high) {
            tensionWords.high.forEach(word => {
                if (!word) return;
                const regex = new RegExp(`\\b${word}\\b`, 'gi');
                const matches = cleanText.match(regex);
                if (matches) {
                    lexicalScore += matches.length * 8;
                    foundWords.high.push(word);
                }
            });
        }

        if (tensionWords.medium) {
            tensionWords.medium.forEach(word => {
                if (!word) return;
                const regex = new RegExp(`\\b${word}\\b`, 'gi');
                const matches = cleanText.match(regex);
                if (matches) {
                    lexicalScore += matches.length * 4;
                    foundWords.medium.push(word);
                }
            });
        }

        if (tensionWords.low) {
            tensionWords.low.forEach(word => {
                if (!word) return;
                const regex = new RegExp(`\\b${word}\\b`, 'gi');
                const matches = cleanText.match(regex);
                if (matches) {
                    lexicalScore -= matches.length * 5;
                    foundWords.low.push(word);
                }
            });
        }

        // 2. ANALYSE PONCTUATION
        const exclamations = (cleanText.match(/!/g) || []).length;
        const questions = (cleanText.match(/\?/g) || []).length;
        const suspensions = (cleanText.match(/\.\.\./g) || []).length;
        lexicalScore += (exclamations * 1.5 + questions * 0.5 + suspensions * 2);

        // 3. FACTEUR DE DENSITÉ
        const wordCount = (typeof getWordCount === 'function')
            ? getWordCount(text)
            : (cleanText.split(/\s+/).filter(w => w.length > 0).length || 1);

        // Formule de base pour l'intensité textuelle (0-60 points environ)
        let textIntensity = (lexicalScore / Math.sqrt(Math.max(50, wordCount))) * 5.2;

        // 4. BASELINE NARRATIVE
        let narrativeBaseline = 25; // Défaut si pas de contexte
        let structureBonus = 0;

        if (context && typeof project !== 'undefined') {
            const structuralData = this.getNarrativeContextData(context);
            if (structuralData) {
                narrativeBaseline = structuralData.baseline;
                if (structuralData.isCliffhanger) structureBonus = 5;
            }
        }

        // Calcul final : Baseline + Intensité textuelle + Bonus
        let finalScore = narrativeBaseline + textIntensity + structureBonus;

        // Normalisation 5-95
        finalScore = Math.max(5, Math.min(95, finalScore));

        return {
            score: Math.round(finalScore),
            details: {
                high: foundWords.high.length,
                medium: foundWords.medium.length,
                low: foundWords.low.length
            },
            foundWords: foundWords
        };
    },

    /**
     * Calcule la baseline narrative basée sur la position dans le récit.
     * Réutilise la même logique que le graphique d'intrigue.
     */
    getNarrativeContextData: function (context) {
        const { actId, chapterId, sceneId } = context;
        if (!project || !project.acts) return null;

        const actIndex = project.acts.findIndex(a => a.id === actId);
        if (actIndex === -1) return null;
        const act = project.acts[actIndex];
        const totalActs = project.acts.length;

        const chapterIndex = act.chapters.findIndex(c => c.id === chapterId);
        if (chapterIndex === -1) return null;
        const chapter = act.chapters[chapterIndex];
        const totalChapters = act.chapters.length;

        const sceneIndex = chapter.scenes.findIndex(s => s.id === sceneId);
        if (sceneIndex === -1) return null;
        const totalScenes = chapter.scenes.length;

        const chapterProgress = chapterIndex / Math.max(totalChapters - 1, 1);
        const sceneProgress = sceneIndex / Math.max(totalScenes - 1, 1);
        const actProgress = actIndex / Math.max(totalActs - 1, 1);

        let baseline = 0;

        // Structure classique en 3 actes (reprise de 33.plot.refactor.js)
        if (totalActs >= 3) {
            if (actIndex === 0) {
                baseline = 10 + (chapterProgress * 15);
            } else if (actIndex === totalActs - 1) {
                if (sceneProgress < 0.7) {
                    baseline = 35 + (sceneProgress * 5);
                } else {
                    baseline = 40 - ((sceneProgress - 0.7) * 50);
                }
            } else {
                baseline = 20 + (actProgress * 15);
            }
        } else if (totalActs === 2) {
            if (actIndex === 0) {
                baseline = 15 + (chapterProgress * 15);
            } else {
                baseline = 30 + (sceneProgress * 10);
            }
        } else {
            baseline = 20 + (sceneProgress * 20);
        }

        return {
            baseline: baseline,
            isCliffhanger: sceneIndex === totalScenes - 1
        };
    }
};
