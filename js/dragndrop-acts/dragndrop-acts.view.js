/**
 * View for Drag and Drop Acts
 * Handles DOM manipulation and listener attachment
 */
class DragNDropActsView {
    constructor(viewModel) {
        this.viewModel = viewModel;
    }

    /**
     * Initializes all drag and drop listeners
     */
    init() {
        this.setupActDragAndDrop();
        this.setupChapterDragAndDrop();
        this.setupSceneDragAndDrop();
    }

    /**
     * Set up drag and drop for Acts
     */
    setupActDragAndDrop() {
        const actHeaders = document.querySelectorAll('.act-header');

        actHeaders.forEach(header => {
            const dragHandle = header.querySelector('.drag-handle');
            if (!dragHandle) return;

            dragHandle.title = Localization.t('dragndrop.handle.act');

            dragHandle.addEventListener('dragstart', (e) => {
                const actId = parseInt(header.dataset.actId);
                this.viewModel.startDragAct(actId);
                header.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('type', 'act');
                e.stopPropagation();
            });

            dragHandle.addEventListener('dragend', (e) => {
                header.classList.remove('dragging');
                this.viewModel.endDragAct();
            });

            header.addEventListener('dragover', (e) => {
                const targetActId = parseInt(header.dataset.actId);
                if (this.viewModel.isValidActDropTarget(targetActId)) {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    header.classList.add('drag-over');
                }
            });

            header.addEventListener('dragleave', (e) => {
                header.classList.remove('drag-over');
            });

            header.addEventListener('drop', (e) => {
                header.classList.remove('drag-over');
                const targetActId = parseInt(header.dataset.actId);
                if (this.viewModel.isValidActDropTarget(targetActId)) {
                    e.preventDefault();
                    this.viewModel.handleActDrop(targetActId);
                }
            });
        });
    }

    /**
     * Set up drag and drop for Chapters
     */
    setupChapterDragAndDrop() {
        const chapterHeaders = document.querySelectorAll('.chapter-header');

        chapterHeaders.forEach(header => {
            const dragHandle = header.querySelector('.drag-handle');
            if (!dragHandle) return;

            dragHandle.title = Localization.t('dragndrop.handle.chapter');

            dragHandle.addEventListener('dragstart', (e) => {
                const chapterId = parseInt(header.dataset.chapterId);
                const actId = parseInt(header.dataset.actId);
                this.viewModel.startDragChapter(chapterId, actId);
                header.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('type', 'chapter');
                e.stopPropagation();
            });

            dragHandle.addEventListener('dragend', (e) => {
                header.classList.remove('dragging');
                this.viewModel.endDragChapter();
            });

            header.addEventListener('dragover', (e) => {
                const targetChapterId = parseInt(header.dataset.chapterId);
                if (this.viewModel.isValidChapterDropTarget(targetChapterId)) {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    header.classList.add('drag-over');
                }
            });

            header.addEventListener('dragleave', (e) => {
                header.classList.remove('drag-over');
            });

            header.addEventListener('drop', (e) => {
                header.classList.remove('drag-over');
                const targetChapterId = parseInt(header.dataset.chapterId);
                const targetActId = parseInt(header.dataset.actId);
                if (this.viewModel.isValidChapterDropTarget(targetChapterId)) {
                    e.preventDefault();
                    this.viewModel.handleChapterDrop(targetChapterId, targetActId);
                }
            });
        });
    }

    /**
     * Set up drag and drop for Scenes
     */
    setupSceneDragAndDrop() {
        const sceneItems = document.querySelectorAll('.scene-item');

        sceneItems.forEach(item => {
            const dragHandle = item.querySelector('.drag-handle');
            if (dragHandle) {
                dragHandle.title = Localization.t('dragndrop.handle.scene');

                // Add dragstart to handle
                dragHandle.addEventListener('dragstart', (e) => {
                    const sceneId = parseInt(item.dataset.sceneId);
                    const chapterId = parseInt(item.dataset.chapterId);
                    const actId = parseInt(item.dataset.actId);
                    this.viewModel.startDragScene(sceneId, chapterId, actId);
                    item.classList.add('dragging');
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('type', 'scene');
                    e.stopPropagation();
                });

                dragHandle.addEventListener('dragend', (e) => {
                    item.classList.remove('dragging');
                    this.viewModel.endDragScene();
                });
            }

            item.addEventListener('dragover', (e) => {
                const targetSceneId = parseInt(item.dataset.sceneId);
                if (this.viewModel.isValidSceneDropTarget(targetSceneId)) {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    item.classList.add('drag-over');
                }
            });

            item.addEventListener('dragleave', (e) => {
                item.classList.remove('drag-over');
            });

            item.addEventListener('drop', (e) => {
                item.classList.remove('drag-over');
                const targetSceneId = parseInt(item.dataset.sceneId);
                const targetChapterId = parseInt(item.dataset.chapterId);
                const targetActId = parseInt(item.dataset.actId);

                if (this.viewModel.isValidSceneDropTarget(targetSceneId)) {
                    e.preventDefault();
                    this.viewModel.handleSceneDrop(targetSceneId, targetActId, targetChapterId);
                }
            });
        });
    }
}

// Global instance
const dragNDropActsView = new DragNDropActsView(dragNDropActsViewModel);
