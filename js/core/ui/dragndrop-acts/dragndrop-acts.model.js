/**
 * Model for Drag and Drop Acts
 * Stores the state of the current dragging operation
 */
class DragNDropActsModel {
    constructor() {
        this.draggedAct = null;
        this.draggedChapter = { chapterId: null, actId: null };
        this.draggedScene = { sceneId: null, chapterId: null, actId: null };
    }

    setDraggedAct(id) {
        this.draggedAct = id;
    }

    getDraggedAct() {
        return this.draggedAct;
    }

    resetDraggedAct() {
        this.draggedAct = null;
    }

    setDraggedChapter(chapterId, actId) {
        this.draggedChapter = { chapterId, actId };
    }

    getDraggedChapter() {
        return this.draggedChapter;
    }

    resetDraggedChapter() {
        this.draggedChapter = { chapterId: null, actId: null };
    }

    setDraggedScene(sceneId, chapterId, actId) {
        this.draggedScene = { sceneId, chapterId, actId };
    }

    getDraggedScene() {
        return this.draggedScene;
    }

    resetDraggedScene() {
        this.draggedScene = { sceneId: null, chapterId: null, actId: null };
    }
}

// Global instance
const dragNDropActsModel = new DragNDropActsModel();
