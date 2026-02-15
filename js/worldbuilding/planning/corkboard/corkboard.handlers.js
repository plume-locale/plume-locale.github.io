// ============================================
// CORKBOARD HANDLERS
// ============================================
// Gère les événements utilisateur et le drag & drop

const CorkBoardHandlers = {
    /**
     * État du drag & drop
     */
    draggedCard: null,

    /**
     * Gestionnaire: Changement du filtre par acte
     * @param {string} actId - ID de l'acte ou 'all'
     */
    onActFilterChange(actId) {
        CorkBoardViewModel.updateActFilter(actId);
        CorkBoardView.renderSidebar();
    },

    /**
     * Gestionnaire: Changement du filtre par chapitre
     * @param {string} chapterId - ID du chapitre ou 'all'
     */
    onChapterFilterChange(chapterId) {
        CorkBoardViewModel.updateChapterFilter(chapterId);
        CorkBoardView.renderSidebar();
    },

    /**
     * Gestionnaire: Ouverture de la vue complète
     */
    onOpenFullView() {
        const editorView = document.getElementById('editorView');
        if (!editorView) return;

        // 🔥 Protection contre l'écrasement du système d'onglets (Tabs)
        const isTabsSystem = typeof tabsState !== 'undefined' && tabsState.enabled;
        const isMainEditorView = editorView.id === 'editorView';
        const isSplitRendering = document.getElementById('editorView-backup') !== null;

        if (isTabsSystem && isMainEditorView && !isSplitRendering) {
            if (typeof currentView !== 'undefined' && currentView !== 'corkboard') {
                if (typeof switchView === 'function') {
                    switchView('corkboard');
                    return;
                }
            } else if (typeof renderTabs === 'function') {
                renderTabs();
                return;
            }
        }

        editorView.innerHTML = CorkBoardView.renderFullView();
        this.setupDragAndDrop();

        if (typeof lucide !== 'undefined') lucide.createIcons();
    },

    /**
     * Gestionnaire: Fermeture de la vue Cork Board
     */
    onClose() {
        if (typeof switchView === 'function') {
            switchView('corkboard');
        }
        CorkBoardView.renderSidebar();
    },

    /**
     * Gestionnaire: Changement de mode (structured/kanban)
     * @param {string} mode - Nouveau mode
     */
    onSwitchMode(mode) {
        CorkBoardViewModel.switchMode(mode);
        this.onOpenFullView();
    },

    /**
     * Gestionnaire: Toggle d'un acte (expand/collapse)
     * @param {number} actId - ID de l'acte
     */
    onToggleAct(actId) {
        const content = document.getElementById(`act-content-${actId}`);
        const icon = document.getElementById(`collapse-icon-${actId}`);

        if (!content || !icon) return;

        if (content.style.display === 'none') {
            content.style.display = 'grid';
            icon.innerHTML = '<i data-lucide="chevron-down" style="width:16px;height:16px;"></i>';
        } else {
            content.style.display = 'none';
            icon.innerHTML = '<i data-lucide="chevron-right" style="width:16px;height:16px;"></i>';
        }

        if (typeof lucide !== 'undefined') lucide.createIcons();
    },

    /**
     * Gestionnaire: Mise à jour du synopsis d'une scène
     * @param {number} actId - ID de l'acte
     * @param {number} chapterId - ID du chapitre
     * @param {number} sceneId - ID de la scène
     * @param {string} synopsis - Nouveau synopsis
     */
    onUpdateSynopsis(actId, chapterId, sceneId, synopsis) {
        CorkBoardViewModel.updateSceneSynopsis(actId, chapterId, sceneId, synopsis);
    },

    /**
     * Gestionnaire: Mise à jour de la couleur d'une scène
     * @param {number} actId - ID de l'acte
     * @param {number} chapterId - ID du chapitre
     * @param {number} sceneId - ID de la scène
     * @param {string} color - Nouvelle couleur
     */
    onUpdateColor(actId, chapterId, sceneId, color) {
        const success = CorkBoardViewModel.updateSceneColor(actId, chapterId, sceneId, color);
        if (success) {
            this.onOpenFullView();
        }
    },

    /**
     * Gestionnaire: Ouverture d'une scène dans l'éditeur
     * @param {number} actId - ID de l'acte
     * @param {number} chapterId - ID du chapitre
     * @param {number} sceneId - ID de la scène
     */
    onOpenScene(actId, chapterId, sceneId) {
        CorkBoardViewModel.openSceneInEditor(actId, chapterId, sceneId);
    },

    /**
     * Gestionnaire: Création d'un nouvel acte
     */
    onCreateAct() {
        const actTitle = prompt(Localization.t('corkboard.prompt.act_title'), `Acte ${project.acts.length + 1}`);
        if (!actTitle || actTitle.trim() === '') return;

        const result = CorkBoardViewModel.createAct(actTitle);
        if (result.success) {
            this.onOpenFullView();
            CorkBoardView.showNotification(result.message);
        } else {
            alert(result.message);
        }
    },

    /**
     * Gestionnaire: Création d'un nouveau chapitre
     * @param {number} actId - ID de l'acte
     */
    onCreateChapter(actId) {
        const act = CorkBoardRepository.getActById(actId, project);
        if (!act) return;

        const chapterTitle = prompt(Localization.t('corkboard.prompt.chapter_title'), `Chapitre ${act.chapters.length + 1}`);
        if (!chapterTitle || chapterTitle.trim() === '') return;

        const result = CorkBoardViewModel.createChapter(actId, chapterTitle);
        if (result.success) {
            this.onOpenFullView();
            CorkBoardView.showNotification(result.message);
        } else {
            alert(result.message);
        }
    },

    /**
     * Gestionnaire: Création d'une nouvelle scène
     * @param {number} actId - ID de l'acte
     * @param {number} chapterId - ID du chapitre
     */
    onCreateScene(actId, chapterId) {
        const act = CorkBoardRepository.getActById(actId, project);
        if (!act) return;

        const chapter = CorkBoardRepository.getChapterById(chapterId, act);
        if (!chapter) return;

        const sceneTitle = prompt(Localization.t('corkboard.prompt.scene_title'), `Scène ${chapter.scenes.length + 1}`);
        if (!sceneTitle || sceneTitle.trim() === '') return;

        const result = CorkBoardViewModel.createScene(actId, chapterId, sceneTitle);
        if (result.success) {
            this.onOpenFullView();
            CorkBoardView.showNotification(result.message);
        } else {
            alert(result.message);
        }
    },

    /**
     * Gestionnaire: Mise à jour de la taille de la grille
     * @param {number} value - Nouvelle largeur
     */
    onUpdateGridSize(value) {
        CorkBoardView.updateGridSize(value);
    },

    /**
     * Configure le drag & drop pour les cartes de scènes
     */
    setupDragAndDrop() {
        const cards = document.querySelectorAll('.cork-card, .structured-scene-card');

        cards.forEach(card => {
            card.addEventListener('dragstart', this.handleDragStart.bind(this));
            card.addEventListener('dragend', this.handleDragEnd.bind(this));
            card.addEventListener('dragover', this.handleDragOver.bind(this));
            card.addEventListener('drop', this.handleDrop.bind(this));
        });
    },

    /**
     * Gestionnaire: Début du drag
     * @param {DragEvent} e - Événement drag
     */
    handleDragStart(e) {
        this.draggedCard = e.currentTarget;
        e.currentTarget.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
    },

    /**
     * Gestionnaire: Fin du drag
     * @param {DragEvent} e - Événement drag
     */
    handleDragEnd(e) {
        e.currentTarget.classList.remove('dragging');
        this.draggedCard = null;
    },

    /**
     * Gestionnaire: Survol pendant le drag
     * @param {DragEvent} e - Événement drag
     */
    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    },

    /**
     * Gestionnaire: Drop de la carte
     * @param {DragEvent} e - Événement drop
     */
    handleDrop(e) {
        e.preventDefault();

        if (!this.draggedCard || this.draggedCard === e.currentTarget) return;

        // Récupérer les IDs
        const draggedSceneId = parseInt(this.draggedCard.dataset.sceneId);
        const draggedActId = parseInt(this.draggedCard.dataset.actId);
        const draggedChapterId = parseInt(this.draggedCard.dataset.chapterId);

        const targetSceneId = parseInt(e.currentTarget.dataset.sceneId);
        const targetActId = parseInt(e.currentTarget.dataset.actId);
        const targetChapterId = parseInt(e.currentTarget.dataset.chapterId);

        // Gérer le drop via le ViewModel
        const result = CorkBoardViewModel.handleSceneDrop(
            draggedSceneId, draggedActId, draggedChapterId,
            targetSceneId, targetActId, targetChapterId
        );

        if (result.success) {
            this.onOpenFullView();
            CorkBoardView.showNotification(result.message);
        } else {
            alert(result.message);
        }
    }
};
