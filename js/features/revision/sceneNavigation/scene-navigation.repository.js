/**
 * [Repository : Scene Navigation]
 * Gère l'accès aux données du projet pour la navigation entre scènes.
 */

const sceneNavigationRepository = {
    /**
     * Récupère toutes les scènes du projet sous forme de liste plate.
     */
    getFlatScenes() {
        const allScenes = [];
        const proj = (typeof project !== 'undefined') ? project : (window.project || null);

        if (!proj || !proj.acts) return allScenes;

        for (const act of proj.acts) {
            for (const chapter of (act.chapters || [])) {
                for (const scene of (chapter.scenes || [])) {
                    allScenes.push({
                        scene,
                        actId: act.id,
                        chapterId: chapter.id
                    });
                }
            }
        }
        return allScenes;
    },

    /**
     * Trouve une scène par son ID et le contexte du chapitre/acte.
     */
    findScene(actId, chapterId, sceneId) {
        const proj = (typeof project !== 'undefined') ? project : (window.project || null);
        if (!proj || !proj.acts) return null;

        const act = proj.acts.find(a => a.id === actId);
        if (!act) return null;

        const chapter = (act.chapters || []).find(c => c.id === chapterId);
        if (!chapter) return null;

        return (chapter.scenes || []).find(s => s.id === sceneId) || null;
    },

    /**
     * Met à jour le contenu d'une scène.
     */
    updateSceneContent(scene, content) {
        if (!scene) return;
        scene.content = content;
        scene.wordCount = typeof window.getWordCount === 'function' ? window.getWordCount(content) : 0;
    },

    /**
     * Sauvegarde le projet.
     */
    saveProject() {
        if (typeof window.saveProject === 'function') {
            window.saveProject();
        }
    },

    /**
     * Sauvegarde l'historique pour Undo/Redo.
     */
    saveToHistory() {
        if (typeof window.saveToHistoryImmediate === 'function') {
            window.saveToHistoryImmediate();
        }
    },

    /**
     * Met à jour les statistiques et l'affichage des actes.
     */
    refreshUI() {
        if (typeof window.updateStats === 'function') window.updateStats();
        if (typeof window.renderActsList === 'function') window.renderActsList();
    }
};

window.sceneNavigationRepository = sceneNavigationRepository;
