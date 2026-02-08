/*
 * SCENE VERSION MODULE - REPOSITORY
 * Handles data access and persistence for scene versions.
 */

const SceneVersionRepository = {
    getCurrentScene() {
        if (typeof currentActId === 'undefined' || typeof currentChapterId === 'undefined' || typeof currentSceneId === 'undefined') return null;
        if (!currentActId || !currentChapterId || !currentSceneId) return null;

        if (typeof project === 'undefined' || !project) return null;

        const act = project.acts.find(a => a.id === currentActId);
        if (!act) return null;
        const chapter = act.chapters.find(c => c.id === currentChapterId);
        if (!chapter) return null;
        const scene = chapter.scenes.find(s => s.id === currentSceneId);

        return scene ? { act, chapter, scene } : null;
    },

    save() {
        if (typeof saveProject === 'function') {
            saveProject();
        } else {
            console.warn('SceneVersionRepository: saveProject global function not found');
        }
    },

    ensureVersionsInitialized(scene) {
        if (!scene.versions) {
            scene.versions = [];
        }
        return scene.versions;
    }
};
