// ============================================================
// word-repetition.viewmodel.js - Logique métier de l'analyse de répétitions
// ============================================================

/**
 * [MVVM : ViewModel]
 * État de l'analyseur de répétitions
 */
const WordRepetitionState = {
    currentReport: null,
    isAnalyzing: false,
    selectedRepetition: null,
    currentScope: WordRepetitionConfig.scope.SCENE,
    panelVisible: false
};

/**
 * [MVVM : ViewModel]
 * ViewModel principal pour l'analyse de répétitions
 */
const WordRepetitionViewModel = {
    /**
     * [MVVM : ViewModel]
     * Analyse les répétitions selon le scope défini
     * @param {string} scope - Portée de l'analyse (project, act, chapter, scene)
     * @param {Object} target - Cible optionnelle (actId, chapterId, sceneId)
     * @returns {Object} Rapport d'analyse
     */
    analyze(scope = WordRepetitionConfig.scope.SCENE, target = {}) {
        WordRepetitionState.isAnalyzing = true;
        WordRepetitionState.currentScope = scope;

        try {
            // Récupérer le texte selon le scope
            const textData = this._getTextForScope(scope, target);
            if (!textData || !textData.text) {
                WordRepetitionState.isAnalyzing = false;
                return {
                    success: false,
                    message: 'Aucun texte à analyser'
                };
            }

            // Analyser le texte
            const analysisResult = this._analyzeText(textData.text, textData.locations);

            // Créer le rapport
            const context = createAnalysisContext(scope, target);
            const report = createAnalysisReport(context, analysisResult.repetitions, {
                totalWords: analysisResult.totalWords,
                uniqueWords: analysisResult.uniqueWords
            });

            // Enrichir avec les suggestions de synonymes
            this._enrichWithSuggestions(report);

            // Sauvegarder le rapport
            WordRepetitionState.currentReport = report;
            WordRepetitionRepository.saveLastReport(report);
            WordRepetitionRepository.updatePreference('lastScope', scope);

            WordRepetitionState.isAnalyzing = false;

            return {
                success: true,
                report: report,
                message: `${report.stats.repetitionsCount} répétition(s) détectée(s)`
            };
        } catch (error) {
            console.error('[WordRepetitionViewModel] Erreur analyse:', error);
            WordRepetitionState.isAnalyzing = false;
            return {
                success: false,
                message: 'Erreur lors de l\'analyse'
            };
        }
    },

    /**
     * [MVVM : ViewModel]
     * Récupère le texte selon le scope
     * @param {string} scope - Portée
     * @param {Object} target - Cible
     * @returns {Object} Texte et localisations
     * @private
     */
    _getTextForScope(scope, target) {
        if (typeof project === 'undefined' || !project.acts) {
            return null;
        }

        let text = '';
        const locations = [];

        const extractSceneText = (scene, actId, actTitle, chapterId, chapterTitle) => {
            if (scene.content) {
                // Extraire le texte brut du HTML
                const temp = document.createElement('div');
                temp.innerHTML = scene.content;
                const sceneText = temp.textContent || temp.innerText || '';

                if (sceneText.trim()) {
                    locations.push({
                        startIndex: text.length,
                        endIndex: text.length + sceneText.length,
                        actId: actId,
                        actTitle: actTitle,
                        chapterId: chapterId,
                        chapterTitle: chapterTitle,
                        sceneId: scene.id,
                        sceneTitle: scene.title
                    });
                    text += sceneText + ' ';
                }
            }
        };

        switch (scope) {
            case WordRepetitionConfig.scope.PROJECT:
                project.acts.forEach(act => {
                    act.chapters.forEach(chapter => {
                        chapter.scenes.forEach(scene => {
                            extractSceneText(scene, act.id, act.title, chapter.id, chapter.title);
                        });
                    });
                });
                break;

            case WordRepetitionConfig.scope.ACT:
                const act = project.acts.find(a => a.id === (target.actId || currentActId));
                if (act) {
                    act.chapters.forEach(chapter => {
                        chapter.scenes.forEach(scene => {
                            extractSceneText(scene, act.id, act.title, chapter.id, chapter.title);
                        });
                    });
                }
                break;

            case WordRepetitionConfig.scope.CHAPTER:
                const actForChapter = project.acts.find(a => a.id === (target.actId || currentActId));
                if (actForChapter) {
                    const chapter = actForChapter.chapters.find(c => c.id === (target.chapterId || currentChapterId));
                    if (chapter) {
                        chapter.scenes.forEach(scene => {
                            extractSceneText(scene, actForChapter.id, actForChapter.title, chapter.id, chapter.title);
                        });
                    }
                }
                break;

            case WordRepetitionConfig.scope.SCENE:
            default:
                const actForScene = project.acts.find(a => a.id === (target.actId || currentActId));
                if (actForScene) {
                    const chapterForScene = actForScene.chapters.find(c => c.id === (target.chapterId || currentChapterId));
                    if (chapterForScene) {
                        const scene = chapterForScene.scenes.find(s => s.id === (target.sceneId || currentSceneId));
                        if (scene) {
                            extractSceneText(scene, actForScene.id, actForScene.title,
                                           chapterForScene.id, chapterForScene.title);
                        }
                    }
                }
                break;
        }

        return { text: text.trim(), locations };
    },

    /**
     * [MVVM : ViewModel]
     * Analyse le texte pour trouver les répétitions
     * @param {string} text - Texte à analyser
     * @param {Array} locations - Localisations des scènes
     * @returns {Object} Résultat d'analyse
     * @private
     */
    _analyzeText(text, locations) {
        const prefs = WordRepetitionRepository.getPreferences();
        const ignoredWords = WordRepetitionRepository.getAllIgnoredWords();

        // Normaliser le texte
        const normalizedText = text.toLowerCase();

        // Extraire les mots
        const wordRegex = /[a-zàâäéèêëïîôùûüÿœæç]+/gi;
        const words = normalizedText.match(wordRegex) || [];

        // Compter les occurrences
        const wordCounts = new Map();
        const wordPositions = new Map();

        let match;
        const regex = new RegExp(wordRegex.source, 'gi');
        while ((match = regex.exec(normalizedText)) !== null) {
            const word = match[0].toLowerCase();

            // Filtrer les mots courts et ignorés
            if (word.length < prefs.minWordLength || ignoredWords.has(word)) {
                continue;
            }

            wordCounts.set(word, (wordCounts.get(word) || 0) + 1);

            if (!wordPositions.has(word)) {
                wordPositions.set(word, []);
            }
            wordPositions.get(word).push({
                position: match.index,
                context: this._extractContext(text, match.index, word.length)
            });
        }

        // Créer les résultats de répétition
        const repetitions = [];
        const totalWords = words.filter(w => w.length >= prefs.minWordLength && !ignoredWords.has(w.toLowerCase())).length;

        for (const [word, count] of wordCounts) {
            if (count >= prefs.minOccurrences) {
                const positions = wordPositions.get(word);

                // Calculer les répétitions de proximité
                const proximityCount = this._countProximityRepetitions(positions, prefs.proximityWindow);

                // Créer les occurrences avec localisation
                const occurrences = positions.map(pos => {
                    const location = this._findLocation(pos.position, locations);
                    return createWordOccurrence(word, pos.position, pos.context, location);
                });

                const result = createRepetitionResult(word, count, occurrences, {
                    totalWords,
                    proximityCount
                });

                repetitions.push(result);
            }
        }

        // Trier par sévérité puis par nombre d'occurrences
        repetitions.sort((a, b) => {
            const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
            const sevDiff = severityOrder[a.severity] - severityOrder[b.severity];
            if (sevDiff !== 0) return sevDiff;
            return b.count - a.count;
        });

        // Filtrer les low severity si préférence
        const filteredRepetitions = prefs.showLowSeverity
            ? repetitions
            : repetitions.filter(r => r.severity !== WordRepetitionConfig.severity.LOW);

        return {
            repetitions: filteredRepetitions,
            totalWords: totalWords,
            uniqueWords: wordCounts.size
        };
    },

    /**
     * [MVVM : ViewModel]
     * Extrait le contexte autour d'un mot
     * @param {string} text - Texte complet
     * @param {number} position - Position du mot
     * @param {number} wordLength - Longueur du mot
     * @returns {string} Contexte
     * @private
     */
    _extractContext(text, position, wordLength) {
        const contextRadius = 40;
        const start = Math.max(0, position - contextRadius);
        const end = Math.min(text.length, position + wordLength + contextRadius);

        let context = text.substring(start, end);
        if (start > 0) context = '...' + context;
        if (end < text.length) context = context + '...';

        return context;
    },

    /**
     * [MVVM : ViewModel]
     * Compte les répétitions dans une fenêtre de proximité
     * @param {Array} positions - Positions du mot
     * @param {number} window - Taille de la fenêtre
     * @returns {number} Nombre de répétitions proches
     * @private
     */
    _countProximityRepetitions(positions, window) {
        let count = 0;
        for (let i = 0; i < positions.length - 1; i++) {
            if (positions[i + 1].position - positions[i].position < window) {
                count++;
            }
        }
        return count;
    },

    /**
     * [MVVM : ViewModel]
     * Trouve la localisation d'une position dans le texte
     * @param {number} position - Position dans le texte
     * @param {Array} locations - Localisations des scènes
     * @returns {Object} Localisation
     * @private
     */
    _findLocation(position, locations) {
        for (const loc of locations) {
            if (position >= loc.startIndex && position < loc.endIndex) {
                return {
                    actId: loc.actId,
                    actTitle: loc.actTitle,
                    chapterId: loc.chapterId,
                    chapterTitle: loc.chapterTitle,
                    sceneId: loc.sceneId,
                    sceneTitle: loc.sceneTitle
                };
            }
        }
        return {};
    },

    /**
     * [MVVM : ViewModel]
     * Enrichit le rapport avec des suggestions de synonymes
     * @param {Object} report - Rapport à enrichir
     * @private
     */
    async _enrichWithSuggestions(report) {
        if (typeof SynonymsService === 'undefined') {
            return;
        }

        // Limiter à 10 mots les plus répétés pour éviter trop de requêtes
        const topRepetitions = report.repetitions.slice(0, 10);

        for (const rep of topRepetitions) {
            try {
                const synonyms = await SynonymsService.fetchSynonyms(rep.word);
                rep.suggestions = synonyms.slice(0, 5).map(syn =>
                    createReplacementSuggestion(rep.word, syn.word, {
                        score: syn.score,
                        source: 'synonyms',
                        category: syn.category
                    })
                );
            } catch (e) {
                // Ignorer les erreurs silencieusement
            }
        }
    },

    /**
     * [MVVM : ViewModel]
     * Sélectionne une répétition pour affichage détaillé
     * @param {string} repetitionId - ID de la répétition
     * @returns {Object} Répétition sélectionnée
     */
    selectRepetition(repetitionId) {
        if (!WordRepetitionState.currentReport) {
            return null;
        }

        const rep = WordRepetitionState.currentReport.repetitions.find(r => r.id === repetitionId);
        WordRepetitionState.selectedRepetition = rep;
        return rep;
    },

    /**
     * [MVVM : ViewModel]
     * Ignore un mot (l'ajoute à la liste des ignorés)
     * @param {string} word - Mot à ignorer
     * @returns {Object} Résultat
     */
    ignoreWord(word) {
        const success = WordRepetitionRepository.addIgnoredWord(word);

        if (success && WordRepetitionState.currentReport) {
            // Marquer comme ignoré dans le rapport actuel
            const rep = WordRepetitionState.currentReport.repetitions.find(r => r.word === word);
            if (rep) {
                rep.isIgnored = true;
            }
        }

        return {
            success,
            message: success ? `"${word}" sera ignoré dans les prochaines analyses` : 'Erreur'
        };
    },

    /**
     * [MVVM : ViewModel]
     * Retire un mot de la liste des ignorés
     * @param {string} word - Mot à retirer
     * @returns {Object} Résultat
     */
    unignoreWord(word) {
        const success = WordRepetitionRepository.removeIgnoredWord(word);
        return {
            success,
            message: success ? `"${word}" sera analysé à nouveau` : 'Erreur'
        };
    },

    /**
     * [MVVM : ViewModel]
     * Récupère les suggestions de synonymes pour un mot
     * @param {string} word - Mot à rechercher
     * @returns {Promise<Array>} Suggestions
     */
    async getSuggestions(word) {
        if (typeof SynonymsService === 'undefined') {
            return [];
        }

        try {
            const synonyms = await SynonymsService.fetchSynonyms(word);
            return synonyms.map(syn => createReplacementSuggestion(word, syn.word, {
                score: syn.score,
                source: 'synonyms',
                category: syn.category
            }));
        } catch (e) {
            return [];
        }
    },

    /**
     * [MVVM : ViewModel]
     * Navigue vers une occurrence spécifique
     * @param {Object} occurrence - Occurrence à afficher
     * @returns {Object} Instructions de navigation
     */
    navigateToOccurrence(occurrence) {
        if (!occurrence || !occurrence.location) {
            return { success: false };
        }

        const loc = occurrence.location;

        return {
            success: true,
            action: 'openScene',
            params: {
                actId: loc.actId,
                chapterId: loc.chapterId,
                sceneId: loc.sceneId,
                highlightWord: occurrence.word,
                highlightPosition: occurrence.position
            }
        };
    },

    /**
     * [MVVM : ViewModel]
     * Récupère l'état actuel
     * @returns {Object} État
     */
    getState() {
        return { ...WordRepetitionState };
    },

    /**
     * [MVVM : ViewModel]
     * Récupère le rapport actuel
     * @returns {Object|null} Rapport
     */
    getCurrentReport() {
        return WordRepetitionState.currentReport;
    },

    /**
     * [MVVM : ViewModel]
     * Toggle la visibilité du panneau
     * @returns {boolean} Nouvelle visibilité
     */
    togglePanel() {
        WordRepetitionState.panelVisible = !WordRepetitionState.panelVisible;
        WordRepetitionRepository.updatePreference('panelCollapsed', !WordRepetitionState.panelVisible);
        return WordRepetitionState.panelVisible;
    },

    /**
     * [MVVM : ViewModel]
     * Efface le rapport actuel
     */
    clearReport() {
        WordRepetitionState.currentReport = null;
        WordRepetitionState.selectedRepetition = null;
    }
};

// Export pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { WordRepetitionViewModel, WordRepetitionState };
}
