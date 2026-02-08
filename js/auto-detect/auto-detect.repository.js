/**
 * [MVVM : AutoDetect Repository]
 * Accès direct aux données du projet (Characters, World, Scenes).
 */

const AutoDetectRepository = {
    /**
     * Récupère la scène courante depuis le projet global.
     */
    getCurrentScene() {
        if (typeof currentActId === 'undefined' || typeof currentChapterId === 'undefined' || typeof currentSceneId === 'undefined') return null;
        if (!currentActId || !currentChapterId || !currentSceneId) return null;
        if (typeof project === 'undefined' || !project || !project.acts) return null;

        const act = project.acts.find(a => a.id === currentActId);
        if (!act) return null;
        const chapter = act.chapters.find(c => c.id === currentChapterId);
        if (!chapter) return null;

        return chapter.scenes.find(s => s.id === currentSceneId);
    },

    /**
     * Récupère tous les personnages du projet.
     */
    getCharacters() {
        return (typeof project !== 'undefined' && project.characters) ? project.characters : [];
    },

    /**
     * Récupère tous les éléments de l'univers.
     */
    getWorldElements() {
        return (typeof project !== 'undefined' && project.world) ? project.world : [];
    },

    /**
     * Sauvegarde le projet (via global saveProject).
     */
    save() {
        if (typeof saveProject === 'function') {
            saveProject();
        }
    }
};
