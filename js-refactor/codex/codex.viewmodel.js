/**
 * [MVVM : Codex ViewModel]
 * Logique métier et médiation entre le Model (Repository) et la View.
 */

const CodexViewModel = {
    /**
     * Initialise le module (listeners, etc.)
     */
    init() {
        // Peut-être s'abonner à des événements globaux ici si nécessaire
    },

    /**
     * Ajoute une nouvelle entrée au codex à partir des données du formulaire.
     * @param {string} title - Titre de l'entrée
     * @param {string} category - Catégorie de l'entrée
     * @param {string} summary - Résumé de l'entrée
     */
    addEntry(title, category, summary) {
        if (!title || !title.trim()) {
            return { success: false, error: "Le titre est obligatoire." };
        }

        const entryData = {
            title: title.trim(),
            category: category,
            summary: summary ? summary.trim() : ''
        };

        const newEntry = CodexModel.create(entryData);
        CodexRepository.add(newEntry);

        saveProject(); // Global save

        // Rafraîchir la vue principale si elle est active
        CodexView.renderList();

        return { success: true, entry: newEntry };
    },

    /**
     * Supprime une entrée du codex.
     * @param {number} id - ID de l'entrée à supprimer
     */
    deleteEntry(id) {
        // Confirmation gérée par la View avant d'appeler ceci, ou ici ?
        // Dans MVVM pur, ViewModel exécute l'action. La confirmation UI est View.

        const success = CodexRepository.delete(id);
        if (success) {
            saveProject();
            CodexView.renderList();

            // Si c'était la dernière entrée, la vue gérera l'affichage vide
            if (CodexRepository.count() === 0) {
                // Peut-être déclencher un état vide spécifique si nécessaire
            }
        }
        return success;
    },

    /**
     * Met à jour un champ d'une entrée.
     * @param {number} id - ID de l'entrée
     * @param {string} field - Nom du champ ('title', 'category', 'summary', 'content')
     * @param {*} value - Nouvelle valeur
     */
    updateField(id, field, value) {
        const updates = {};
        updates[field] = value;

        const updatedEntry = CodexRepository.update(id, updates);

        if (updatedEntry) {
            saveProject();

            // Si le titre ou la catégorie change, la liste doit être rafraîchie
            if (field === 'title' || field === 'category') {
                CodexView.renderList();
            }
        }
    },

    /**
     * Récupère les données pour afficher le détail d'une entrée.
     * @param {number} id - ID de l'entrée
     */
    getDetail(id) {
        return CodexRepository.getById(id);
    },

    /**
     * Trouve les scènes où un personnage apparaît.
     * @param {number} characterId 
     */
    findScenesWithCharacter(characterId) {
        const scenes = [];
        if (!project.acts) return scenes;

        project.acts.forEach(act => {
            act.chapters.forEach(chapter => {
                chapter.scenes.forEach(scene => {
                    if (scene.linkedCharacters && scene.linkedCharacters.includes(characterId)) {
                        scenes.push({
                            actId: act.id,
                            actTitle: act.title,
                            chapterId: chapter.id,
                            chapterTitle: chapter.title,
                            sceneId: scene.id,
                            sceneTitle: scene.title
                        });
                    }
                });
            });
        });
        return scenes;
    },

    /**
     * Trouve les scènes où un élément du monde apparaît.
     * @param {number} elementId 
     */
    findScenesWithElement(elementId) {
        const scenes = [];
        if (!project.acts) return scenes;

        project.acts.forEach(act => {
            act.chapters.forEach(chapter => {
                chapter.scenes.forEach(scene => {
                    if (scene.linkedElements && scene.linkedElements.includes(elementId)) {
                        scenes.push({
                            actId: act.id,
                            actTitle: act.title,
                            chapterId: chapter.id,
                            chapterTitle: chapter.title,
                            sceneId: scene.id,
                            sceneTitle: scene.title
                        });
                    }
                });
            });
        });
        return scenes;
    },

    /**
     * Bascule la présence d'un personnage dans une scène.
     * @param {number} sceneActId 
     * @param {number} sceneChapterId 
     * @param {number} sceneId 
     * @param {number} characterId 
     */
    toggleCharacterInScene(sceneActId, sceneChapterId, sceneId, characterId) {
        const act = project.acts.find(a => a.id === sceneActId);
        if (!act) return;
        const chapter = act.chapters.find(c => c.id === sceneChapterId);
        if (!chapter) return;
        const scene = chapter.scenes.find(s => s.id === sceneId);
        if (!scene) return;

        if (!scene.linkedCharacters) scene.linkedCharacters = [];

        const index = scene.linkedCharacters.indexOf(characterId);
        if (index > -1) {
            scene.linkedCharacters.splice(index, 1);
        } else {
            scene.linkedCharacters.push(characterId);
        }

        saveProject();

        // Rafraîchissement spécifique de la vue si nécessaire
        // Note: C'est une dépendance croisée avec l'éditeur principal.
        // Idéalement, on utiliserait un système d'événements : EventBus.emit('scene-updated', sceneId);
        // Pour l'instant, on garde la logique de rafraîchissement DOM direct si on est dans la vue active,
        // mais cela devrait être délégué à la View ou via un callback.

        return {
            currentSceneId: currentSceneId,
            sceneActId,
            sceneChapterId,
            sceneId,
            scene
        };
    },

    /**
     * Bascule la présence d'un élément dans une scène.
     */
    toggleElementInScene(sceneActId, sceneChapterId, sceneId, elementId) {
        const act = project.acts.find(a => a.id === sceneActId);
        if (!act) return;
        const chapter = act.chapters.find(c => c.id === sceneChapterId);
        if (!chapter) return;
        const scene = chapter.scenes.find(s => s.id === sceneId);
        if (!scene) return;

        if (!scene.linkedElements) scene.linkedElements = [];

        const index = scene.linkedElements.indexOf(elementId);
        let hasChanged = false;

        if (index > -1) {
            scene.linkedElements.splice(index, 1);
            hasChanged = true;
        } else {
            scene.linkedElements.push(elementId);
            hasChanged = true;
        }

        if (hasChanged) {
            saveProject();
        }

        return {
            hasChanged,
            currentSceneId: currentSceneId,
            sceneActId,
            sceneChapterId,
            sceneId
        };
    }
};
