/**
 * Handlers for Drag and Drop Acts
 * Provides legacy function wrappers for the refactored system
 */

/**
 * Configure le glisser-déposer pour les actes
 */
function setupActDragAndDrop() {
    if (dragNDropActsView) {
        dragNDropActsView.setupActDragAndDrop();
    }
}

/**
 * Configure le glisser-déposer pour les chapitres
 */
function setupChapterDragAndDrop() {
    if (dragNDropActsView) {
        dragNDropActsView.setupChapterDragAndDrop();
    }
}

/**
 * Configure le glisser-déposer pour les scènes
 */
function setupSceneDragAndDrop() {
    if (dragNDropActsView) {
        dragNDropActsView.setupSceneDragAndDrop();
    }
}

/**
 * Réorganise les actes après un glisser-déposer
 * (Keeping it for backward compatibility if called directly)
 */
function reorderActs(draggedId, targetId) {
    if (dragNDropActsViewModel) {
        dragNDropActsViewModel.startDragAct(draggedId);
        dragNDropActsViewModel.handleActDrop(targetId);
        dragNDropActsViewModel.endDragAct();
    }
}

/**
 * Réorganise les chapitres après un glisser-déposer
 */
function reorderChapters(draggedChapterId, draggedActId, targetChapterId, targetActId) {
    if (dragNDropActsViewModel) {
        dragNDropActsViewModel.startDragChapter(draggedChapterId, draggedActId);
        dragNDropActsViewModel.handleChapterDrop(targetChapterId, targetActId);
        dragNDropActsViewModel.endDragChapter();
    }
}

/**
 * Réorganise les scènes après un glisser-déposer
 */
function reorderScenes(draggedSceneId, draggedActId, draggedChapterId, targetSceneId, targetActId, targetChapterId) {
    if (dragNDropActsViewModel) {
        dragNDropActsViewModel.startDragScene(draggedSceneId, draggedActId, draggedChapterId);
        dragNDropActsViewModel.handleSceneDrop(targetSceneId, targetActId, targetChapterId);
        dragNDropActsViewModel.endDragScene();
    }
}

/**
 * Déplace une scène vers un autre chapitre
 */
function moveSceneToChapter(sceneId, sourceActId, sourceChapterId, targetActId, targetChapterId) {
    if (dragNDropActsRepository) {
        dragNDropActsRepository.moveSceneToChapter(sceneId, sourceActId, sourceChapterId, targetActId, targetChapterId);
        if (dragNDropActsViewModel) {
            dragNDropActsViewModel.refreshUI();
            dragNDropActsViewModel.expandChapter(targetChapterId);
        }
    }
}
