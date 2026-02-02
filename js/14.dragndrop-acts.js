
// Drag and Drop for Acts
let draggedAct = null;

/**
 * @MVVM : View
 * Configure le glisser-déposer pour les actes
 */
function setupActDragAndDrop() {
    const actHeaders = document.querySelectorAll('.act-header');

    actHeaders.forEach(header => {
        const dragHandle = header.querySelector('.drag-handle');
        if (!dragHandle) return;

        dragHandle.addEventListener('dragstart', (e) => {
            draggedAct = parseInt(header.dataset.actId);
            header.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('type', 'act');
            e.stopPropagation(); // Empêcher le clic de se propager
        });

        dragHandle.addEventListener('dragend', (e) => {
            header.classList.remove('dragging');
            draggedAct = null;
        });

        header.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';

            const targetActId = parseInt(e.currentTarget.dataset.actId);
            if (draggedAct && draggedAct !== targetActId) {
                e.currentTarget.classList.add('drag-over');
            }
        });

        header.addEventListener('dragleave', (e) => {
            e.currentTarget.classList.remove('drag-over');
        });

        header.addEventListener('drop', (e) => {
            e.preventDefault();
            e.currentTarget.classList.remove('drag-over');

            const targetActId = parseInt(e.currentTarget.dataset.actId);

            if (draggedAct && draggedAct !== targetActId) {
                reorderActs(draggedAct, targetActId);
            }
        });
    });
}

/**
 * @MVVM : ViewModel
 * Réorganise les actes après un glisser-déposer
 */
function reorderActs(draggedId, targetId) {
    const draggedIndex = project.acts.findIndex(a => a.id === draggedId);
    const targetIndex = project.acts.findIndex(a => a.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const [removed] = project.acts.splice(draggedIndex, 1);
    project.acts.splice(targetIndex, 0, removed);

    saveProject();
    renderActsList();
}

// Drag and Drop for Chapters
let draggedChapter = { chapterId: null, actId: null };

/**
 * @MVVM : View
 * Configure le glisser-déposer pour les chapitres
 */
function setupChapterDragAndDrop() {
    const chapterHeaders = document.querySelectorAll('.chapter-header');

    chapterHeaders.forEach(header => {
        const dragHandle = header.querySelector('.drag-handle');
        if (!dragHandle) return;

        dragHandle.addEventListener('dragstart', (e) => {
            draggedChapter.chapterId = parseInt(header.dataset.chapterId);
            draggedChapter.actId = parseInt(header.dataset.actId);
            header.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('type', 'chapter');
            e.stopPropagation(); // Empêcher le clic de se propager
        });

        dragHandle.addEventListener('dragend', (e) => {
            header.classList.remove('dragging');
            draggedChapter = { chapterId: null, actId: null };
        });

        header.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';

            const targetChapterId = parseInt(e.currentTarget.dataset.chapterId);
            const targetActId = parseInt(e.currentTarget.dataset.actId);

            if (draggedChapter.chapterId && draggedChapter.chapterId !== targetChapterId) {
                e.currentTarget.classList.add('drag-over');
            } else if (draggedScene.sceneId && draggedScene.chapterId !== targetChapterId) {
                e.currentTarget.classList.add('drag-over');
            }
        });

        header.addEventListener('dragleave', (e) => {
            e.currentTarget.classList.remove('drag-over');
        });

        header.addEventListener('drop', (e) => {
            e.preventDefault();
            e.currentTarget.classList.remove('drag-over');

            const targetChapterId = parseInt(e.currentTarget.dataset.chapterId);
            const targetActId = parseInt(e.currentTarget.dataset.actId);

            if (draggedChapter.chapterId && draggedChapter.chapterId !== targetChapterId) {
                reorderChapters(draggedChapter.chapterId, draggedChapter.actId, targetChapterId, targetActId);
            } else if (draggedScene.sceneId && draggedScene.chapterId !== targetChapterId) {
                moveSceneToChapter(draggedScene.sceneId, draggedScene.actId, draggedScene.chapterId, targetActId, targetChapterId);
            }
        });
    });
}

/**
 * @MVVM : ViewModel
 * Réorganise les chapitres après un glisser-déposer
 */
function reorderChapters(draggedChapterId, draggedActId, targetChapterId, targetActId) {
    const sourceAct = project.acts.find(a => a.id === draggedActId);
    const targetAct = project.acts.find(a => a.id === targetActId);

    if (!sourceAct || !targetAct) return;

    const draggedIndex = sourceAct.chapters.findIndex(c => c.id === draggedChapterId);
    const targetIndex = targetAct.chapters.findIndex(c => c.id === targetChapterId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const [removed] = sourceAct.chapters.splice(draggedIndex, 1);

    if (draggedActId === targetActId) {
        targetAct.chapters.splice(targetIndex, 0, removed);
    } else {
        targetAct.chapters.splice(targetIndex, 0, removed);
    }

    saveProject();
    renderActsList();
}

// Drag and Drop for Scenes
let draggedScene = { sceneId: null, chapterId: null, actId: null };

/**
 * @MVVM : View
 * Configure le glisser-déposer pour les scènes
 */
function setupSceneDragAndDrop() {
    const sceneItems = document.querySelectorAll('.scene-item.draggable');

    sceneItems.forEach(item => {
        item.addEventListener('dragstart', (e) => {
            draggedScene.sceneId = parseInt(e.target.dataset.sceneId);
            draggedScene.chapterId = parseInt(e.target.dataset.chapterId);
            draggedScene.actId = parseInt(e.target.dataset.actId);
            e.target.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
        });

        item.addEventListener('dragend', (e) => {
            e.target.classList.remove('dragging');
            draggedScene = { sceneId: null, chapterId: null, actId: null };
        });

        item.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';

            const targetSceneId = parseInt(e.currentTarget.dataset.sceneId);
            const targetChapterId = parseInt(e.currentTarget.dataset.chapterId);

            if (draggedScene.sceneId && draggedScene.sceneId !== targetSceneId) {
                e.currentTarget.classList.add('drag-over');
            }
        });

        item.addEventListener('dragleave', (e) => {
            e.currentTarget.classList.remove('drag-over');
        });

        item.addEventListener('drop', (e) => {
            e.preventDefault();
            e.currentTarget.classList.remove('drag-over');

            const targetSceneId = parseInt(e.currentTarget.dataset.sceneId);
            const targetChapterId = parseInt(e.currentTarget.dataset.chapterId);
            const targetActId = parseInt(e.currentTarget.dataset.actId);

            if (draggedScene.sceneId && draggedScene.sceneId !== targetSceneId) {
                reorderScenes(
                    draggedScene.sceneId,
                    draggedScene.actId,
                    draggedScene.chapterId,
                    targetSceneId,
                    targetActId,
                    targetChapterId
                );
            }
        });
    });
}

/**
 * @MVVM : ViewModel
 * Réorganise les scènes après un glisser-déposer
 */
function reorderScenes(draggedSceneId, draggedActId, draggedChapterId, targetSceneId, targetActId, targetChapterId) {
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

    if (draggedChapterId === targetChapterId) {
        targetChapter.scenes.splice(targetIndex, 0, removed);
    } else {
        targetChapter.scenes.splice(targetIndex, 0, removed);
    }

    saveProject();
    renderActsList();
}

/**
 * @MVVM : Other
 * Group: Use Case | Naming: MoveSceneToChapterUseCase
 * Déplace une scène vers un autre chapitre (Mixte Model/View)
 */
function moveSceneToChapter(sceneId, sourceActId, sourceChapterId, targetActId, targetChapterId) {
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

    saveProject();
    renderActsList();

    // Auto-expand target chapter
    setTimeout(() => {
        const targetChapterElement = document.getElementById(`chapter-${targetChapterId}`);
        if (targetChapterElement) {
            const icon = targetChapterElement.querySelector('.chapter-icon');
            const scenesList = targetChapterElement.querySelector('.scenes-list');
            if (!scenesList.classList.contains('visible')) {
                icon.classList.add('expanded');
                scenesList.classList.add('visible');
            }
        }
    }, 100);
}
