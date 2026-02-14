/**
 * Todo Repository
 * Gère l'accès aux données des TODOs (extraction depuis le projet)
 */

const TodoRepository = {
    /**
     * Récupère tous les TODOs de toutes les scènes du projet
     * @returns {Array} Liste de tous les TODOs
     */
    getAll: () => {
        const todos = [];
        if (!project || !project.acts) return todos;

        project.acts.forEach(act => {
            if (!act.chapters) return;
            act.chapters.forEach(chapter => {
                if (!chapter.scenes) return;
                chapter.scenes.forEach(scene => {
                    const annotations = TodoRepository.getSceneAnnotations(scene);
                    annotations
                        .filter(a => a.type === 'todo')
                        .forEach(todo => {
                            todos.push(TodoModel.create(todo, {
                                actId: act.id,
                                actTitle: act.title,
                                chapterId: chapter.id,
                                chapterTitle: chapter.title,
                                sceneId: scene.id,
                                sceneTitle: scene.title
                            }));
                        });
                });
            });
        });

        return todos;
    },

    /**
     * Récupère les annotations de la version active d'une scène
     * @param {Object} scene - La scène
     * @returns {Array} Liste des annotations
     */
    getSceneAnnotations: (scene) => {
        if (typeof getVersionAnnotations === 'function') {
            return getVersionAnnotations(scene);
        }
        // Fallback si la fonction n'est pas dispo (bien que peu probable vu l'ordre du build)
        return scene.annotations || [];
    },

    /**
     * Trouve un TODO spécifique
     * @param {number} sceneId - ID de la scène
     * @param {number} todoId - ID du TODO
     * @returns {Object|null} Le TODO ou null
     */
    findById: (sceneId, todoId) => {
        let found = null;
        project.acts.forEach(act => {
            act.chapters.forEach(chapter => {
                const scene = chapter.scenes.find(s => s.id === sceneId);
                if (scene) {
                    if (typeof findVersionAnnotation === 'function') {
                        found = findVersionAnnotation(scene, todoId);
                    } else {
                        found = (scene.annotations || []).find(a => a.id === todoId);
                    }
                }
            });
        });
        return found;
    },

    /**
     * Sauvegarde l'état du projet et l'historique
     */
    save: (actionLabel = 'updateTodo') => {
        if (typeof saveProject === 'function') {
            saveProject();
        }
        if (typeof saveToHistory === 'function') {
            saveToHistory(actionLabel);
        }
    },

    /**
     * Migre les annotations vers la structure des versions si nécessaire
     */
    migrateIfNeeded: () => {
        let needsSave = false;
        if (!project || !project.acts) return false;

        project.acts.forEach(act => {
            act.chapters.forEach(chapter => {
                chapter.scenes.forEach(scene => {
                    if (typeof migrateSceneAnnotationsToVersion === 'function') {
                        if (migrateSceneAnnotationsToVersion(scene)) {
                            needsSave = true;
                        }
                    }
                });
            });
        });

        if (needsSave) {
            TodoRepository.save('migrateAnnotations');
            console.log('[Todo] Migration des annotations effectuée');
        }
        return needsSave;
    }
};
