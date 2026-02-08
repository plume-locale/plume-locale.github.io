/**
 * ViewModel for Drag and Drop Acts
 * Orchestrates reordering logic and coordinates with Repository and View
 */
class DragNDropActsViewModel {
    constructor(model, repository) {
        this.model = model;
        this.repository = repository;
    }

    // --- Acts ---

    startDragAct(actId) {
        this.model.setDraggedAct(actId);
    }

    endDragAct() {
        this.model.resetDraggedAct();
    }

    handleActDrop(targetActId) {
        const draggedActId = this.model.getDraggedAct();
        if (draggedActId !== null && draggedActId !== targetActId) {
            this.repository.reorderActs(draggedActId, targetActId);
            this.refreshUI();
            if (typeof showNotification === 'function') {
                showNotification(Localization.t('dragndrop.notification.reorder_success'), 'success');
            }
        }
    }

    isValidActDropTarget(targetActId) {
        const draggedActId = this.model.getDraggedAct();
        return draggedActId !== null && draggedActId !== targetActId;
    }

    // --- Chapters ---

    startDragChapter(chapterId, actId) {
        this.model.setDraggedChapter(chapterId, actId);
    }

    endDragChapter() {
        this.model.resetDraggedChapter();
    }

    handleChapterDrop(targetChapterId, targetActId) {
        const draggedChapter = this.model.getDraggedChapter();
        const draggedScene = this.model.getDraggedScene();

        if (draggedChapter.chapterId !== null && draggedChapter.chapterId !== targetChapterId) {
            this.repository.reorderChapters(
                draggedChapter.chapterId,
                draggedChapter.actId,
                targetChapterId,
                targetActId
            );
            this.refreshUI();
            if (typeof showNotification === 'function') {
                showNotification(Localization.t('dragndrop.notification.reorder_success'), 'success');
            }
        } else if (draggedScene.sceneId !== null && draggedScene.chapterId !== targetChapterId) {
            this.repository.moveSceneToChapter(
                draggedScene.sceneId,
                draggedScene.actId,
                draggedScene.chapterId,
                targetActId,
                targetChapterId
            );
            this.refreshUI();
            this.expandChapter(targetChapterId);
            if (typeof showNotification === 'function') {
                showNotification(Localization.t('dragndrop.notification.reorder_success'), 'success');
            }
        }
    }

    isValidChapterDropTarget(targetChapterId) {
        const draggedChapter = this.model.getDraggedChapter();
        const draggedScene = this.model.getDraggedScene();

        if (draggedChapter.chapterId !== null) {
            return draggedChapter.chapterId !== targetChapterId;
        }
        if (draggedScene.sceneId !== null) {
            return draggedScene.chapterId !== targetChapterId;
        }
        return false;
    }

    // --- Scenes ---

    startDragScene(sceneId, chapterId, actId) {
        this.model.setDraggedScene(sceneId, chapterId, actId);
    }

    endDragScene() {
        this.model.resetDraggedScene();
    }

    handleSceneDrop(targetSceneId, targetActId, targetChapterId) {
        const draggedScene = this.model.getDraggedScene();
        if (draggedScene.sceneId !== null && draggedScene.sceneId !== targetSceneId) {
            this.repository.reorderScenes(
                draggedScene.sceneId,
                draggedScene.actId,
                draggedScene.chapterId,
                targetSceneId,
                targetActId,
                targetChapterId
            );
            this.refreshUI();
            if (typeof showNotification === 'function') {
                showNotification(Localization.t('dragndrop.notification.reorder_success'), 'success');
            }
        }
    }

    isValidSceneDropTarget(targetSceneId) {
        const draggedScene = this.model.getDraggedScene();
        return draggedScene.sceneId !== null && draggedScene.sceneId !== targetSceneId;
    }

    // --- Utilities ---

    refreshUI() {
        if (typeof renderActsList === 'function') {
            renderActsList();
        }
    }

    expandChapter(chapterId) {
        // Auto-expand target chapter
        setTimeout(() => {
            const targetChapterElement = document.getElementById(`chapter-${chapterId}`);
            if (targetChapterElement) {
                const icon = targetChapterElement.querySelector('.chapter-icon');
                const scenesList = targetChapterElement.querySelector('.scenes-list');
                if (scenesList && !scenesList.classList.contains('visible')) {
                    if (icon) icon.classList.add('expanded');
                    scenesList.classList.add('visible');
                }
            }
        }, 100);
    }
}

// Global instance
const dragNDropActsViewModel = new DragNDropActsViewModel(dragNDropActsModel, dragNDropActsRepository);
