/**
 * Repository for Drag and Drop Acts
 * Handles data manipulation within the project structure
 */
class DragNDropActsRepository {
    /**
     * Reorders acts in the project
     * @param {number} draggedId 
     * @param {number} targetId 
     */
    reorderActs(draggedId, targetId) {
        if (typeof project === 'undefined' || !project.acts) return;

        const draggedIndex = project.acts.findIndex(a => a.id === draggedId);
        const targetIndex = project.acts.findIndex(a => a.id === targetId);

        if (draggedIndex === -1 || targetIndex === -1) return;

        const [removed] = project.acts.splice(draggedIndex, 1);
        project.acts.splice(targetIndex, 0, removed);

        if (typeof saveProject === 'function') {
            saveProject();
        }
    }

    /**
     * Reorders chapters in the project
     * @param {number} draggedChapterId 
     * @param {number} draggedActId 
     * @param {number} targetChapterId 
     * @param {number} targetActId 
     */
    reorderChapters(draggedChapterId, draggedActId, targetChapterId, targetActId) {
        if (typeof project === 'undefined' || !project.acts) return;

        const sourceAct = project.acts.find(a => a.id === draggedActId);
        const targetAct = project.acts.find(a => a.id === targetActId);

        if (!sourceAct || !targetAct) return;

        const draggedIndex = sourceAct.chapters.findIndex(c => c.id === draggedChapterId);
        const targetIndex = targetAct.chapters.findIndex(c => c.id === targetChapterId);

        if (draggedIndex === -1 || targetIndex === -1) return;

        const [removed] = sourceAct.chapters.splice(draggedIndex, 1);
        targetAct.chapters.splice(targetIndex, 0, removed);

        if (typeof saveProject === 'function') {
            saveProject();
        }
    }

    /**
     * Reorders scenes in the project
     * @param {number} draggedSceneId 
     * @param {number} draggedActId 
     * @param {number} draggedChapterId 
     * @param {number} targetSceneId 
     * @param {number} targetActId 
     * @param {number} targetChapterId 
     */
    reorderScenes(draggedSceneId, draggedActId, draggedChapterId, targetSceneId, targetActId, targetChapterId) {
        if (typeof project === 'undefined' || !project.acts) return;

        const sourceAct = project.acts.find(a => a.id === draggedActId);
        const targetAct = project.acts.find(a => a.id === targetActId);

        if (!sourceAct || !targetAct) return;

        const sourceChapter = sourceAct.chapters.find(c => c.id === draggedChapterId);
        const targetChapter = targetAct.chapters.find(c => c.id === targetChapterId);

        if (!sourceChapter || !targetChapter) return;

        const draggedIndex = sourceChapter.scenes.findIndex(s => s.id === draggedSceneId);
        const targetIndex = targetChapter.scenes.findIndex(s => s.id === targetSceneId);

        if (draggedIndex === -1 || targetIndex === -1) return;

        const [removed] = sourceChapter.scenes.splice(draggedIndex, 1);
        targetChapter.scenes.splice(targetIndex, 0, removed);

        if (typeof saveProject === 'function') {
            saveProject();
        }
    }

    /**
     * Moves a scene to a different chapter
     * @param {number} sceneId 
     * @param {number} sourceActId 
     * @param {number} sourceChapterId 
     * @param {number} targetActId 
     * @param {number} targetChapterId 
     */
    moveSceneToChapter(sceneId, sourceActId, sourceChapterId, targetActId, targetChapterId) {
        if (typeof project === 'undefined' || !project.acts) return;

        const sourceAct = project.acts.find(a => a.id === sourceActId);
        const targetAct = project.acts.find(a => a.id === targetActId);

        if (!sourceAct || !targetAct) return;

        const sourceChapter = sourceAct.chapters.find(c => c.id === sourceChapterId);
        const targetChapter = targetAct.chapters.find(c => c.id === targetChapterId);

        if (!sourceChapter || !targetChapter) return;

        const sceneIndex = sourceChapter.scenes.findIndex(s => s.id === sceneId);
        if (sceneIndex === -1) return;

        const [removed] = sourceChapter.scenes.splice(sceneIndex, 1);
        targetChapter.scenes.push(removed);

        if (typeof saveProject === 'function') {
            saveProject();
        }
    }
}

// Global instance
const dragNDropActsRepository = new DragNDropActsRepository();
