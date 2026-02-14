/*
 * SCENE VERSION MODULE - REPOSITORY
 * Handles data access and persistence for scene versions.
 */

const SceneVersionRepository = {
    getCurrentScene() {
        const actId = typeof currentActId !== 'undefined' ? currentActId : (window.currentActId || null);
        const chapterId = typeof currentChapterId !== 'undefined' ? currentChapterId : (window.currentChapterId || null);
        const sceneId = typeof currentSceneId !== 'undefined' ? currentSceneId : (window.currentSceneId || null);

        if (!sceneId) return null;
        if (typeof project === 'undefined' || !project) return null;

        // Try direct hierarchy first
        let act = project.acts.find(a => a.id == actId);
        let chapter = act?.chapters.find(c => c.id == chapterId);
        let scene = chapter?.scenes.find(s => s.id == sceneId);

        // Fallback: search globally if hierarchy fails
        if (!scene) {
            for (const a of project.acts) {
                for (const c of a.chapters) {
                    const s = c.scenes.find(sc => sc.id == sceneId);
                    if (s) {
                        act = a;
                        chapter = c;
                        scene = s;
                        break;
                    }
                }
                if (scene) break;
            }
        }

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
