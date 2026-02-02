// ============================================
// CORKBOARD VIEWMODEL
// ============================================
// Gère la logique métier et coordonne Model, Repository et View

const CorkBoardViewModel = {
    /**
     * Filtre actuel du Cork Board (état global)
     */
    currentFilter: null,

    /**
     * Initialise le ViewModel avec un filtre par défaut
     */
    init() {
        if (!this.currentFilter) {
            this.currentFilter = CorkBoardModel.createFilter('all', null, null, 'structured');
        }
    },

    /**
     * Met à jour le filtre par acte
     * @param {string|number} actId - ID de l'acte ou 'all'
     */
    updateActFilter(actId) {
        if (actId === 'all') {
            this.currentFilter = CorkBoardModel.createFilter('all', null, null, this.currentFilter.mode);
        } else {
            this.currentFilter = CorkBoardModel.createFilter('act', parseInt(actId), null, this.currentFilter.mode);
        }
    },

    /**
     * Met à jour le filtre par chapitre
     * @param {string|number} chapterId - ID du chapitre ou 'all'
     */
    updateChapterFilter(chapterId) {
        if (chapterId === 'all') {
            this.currentFilter.type = 'act';
            this.currentFilter.chapterId = null;
        } else {
            this.currentFilter.type = 'chapter';
            this.currentFilter.chapterId = parseInt(chapterId);
        }
    },

    /**
     * Change le mode d'affichage (structured/kanban)
     * @param {string} mode - Nouveau mode
     */
    switchMode(mode) {
        if (Object.values(CorkBoardModel.DISPLAY_MODES).includes(mode)) {
            this.currentFilter.mode = mode;
        }
    },

    /**
     * Récupère le filtre actuel
     * @returns {CorkBoardFilter}
     */
    getCurrentFilter() {
        if (!this.currentFilter) {
            this.init();
        }
        return this.currentFilter;
    },

    /**
     * Récupère les scènes filtrées pour l'affichage
     * @returns {Array<CorkBoardScene>}
     */
    getFilteredScenes() {
        if (!this.currentFilter) {
            this.init();
        }
        return CorkBoardRepository.getFilteredScenes(this.currentFilter, project);
    },

    /**
     * Récupère les chapitres d'un acte pour le sélecteur
     * @param {number} actId - ID de l'acte
     * @returns {Array}
     */
    getChaptersForSelector(actId) {
        return CorkBoardRepository.getChaptersByActId(actId, project);
    },

    /**
     * Met à jour le synopsis d'une scène
     * @param {number} actId - ID de l'acte
     * @param {number} chapterId - ID du chapitre
     * @param {number} sceneId - ID de la scène
     * @param {string} synopsis - Nouveau synopsis
     * @returns {boolean}
     */
    updateSceneSynopsis(actId, chapterId, sceneId, synopsis) {
        const success = CorkBoardRepository.updateSceneSynopsis(
            actId, chapterId, sceneId, synopsis, project
        );

        if (success && typeof saveProject === 'function') {
            saveProject();
        }

        return success;
    },

    /**
     * Met à jour la couleur d'une scène
     * @param {number} actId - ID de l'acte
     * @param {number} chapterId - ID du chapitre
     * @param {number} sceneId - ID de la scène
     * @param {string} color - Nouvelle couleur
     * @returns {boolean}
     */
    updateSceneColor(actId, chapterId, sceneId, color) {
        const success = CorkBoardRepository.updateSceneColor(
            actId, chapterId, sceneId, color, project
        );

        if (success && typeof saveProject === 'function') {
            saveProject();
        }

        return success;
    },

    /**
     * Gère le drag & drop de scènes
     * @param {number} draggedSceneId - ID de la scène déplacée
     * @param {number} draggedActId - ID de l'acte source
     * @param {number} draggedChapterId - ID du chapitre source
     * @param {number} targetSceneId - ID de la scène cible
     * @param {number} targetActId - ID de l'acte cible
     * @param {number} targetChapterId - ID du chapitre cible
     * @returns {Object} - {success: boolean, message: string}
     */
    handleSceneDrop(draggedSceneId, draggedActId, draggedChapterId, targetSceneId, targetActId, targetChapterId) {
        // Vérifier qu'on est dans le même chapitre
        if (draggedChapterId !== targetChapterId) {
            return {
                success: false,
                message: 'Vous ne pouvez déplacer des scènes que dans le même chapitre.\n\nPour déplacer entre chapitres, utilisez la vue Structure (sidebar).'
            };
        }

        // Trouver les index
        const act = CorkBoardRepository.getActById(draggedActId, project);
        if (!act) return { success: false, message: 'Acte introuvable' };

        const chapter = CorkBoardRepository.getChapterById(draggedChapterId, act);
        if (!chapter) return { success: false, message: 'Chapitre introuvable' };

        const draggedSceneIndex = chapter.scenes.findIndex(s => s.id === draggedSceneId);
        const targetSceneIndex = chapter.scenes.findIndex(s => s.id === targetSceneId);

        if (draggedSceneIndex === -1 || targetSceneIndex === -1) {
            return { success: false, message: 'Scène introuvable' };
        }

        // Réorganiser
        const success = CorkBoardRepository.reorderScenes(
            draggedActId, draggedChapterId, draggedSceneIndex, targetSceneIndex, project
        );

        if (success) {
            if (typeof saveProject === 'function') saveProject();
            if (typeof renderActsList === 'function') renderActsList();
            return { success: true, message: '✓ Scènes réorganisées' };
        }

        return { success: false, message: 'Erreur lors de la réorganisation' };
    },

    /**
     * Crée un nouvel acte
     * @param {string} title - Titre de l'acte
     * @returns {Object} - {success: boolean, act: Object|null, message: string}
     */
    createAct(title) {
        if (!title || title.trim() === '') {
            return { success: false, act: null, message: 'Le titre ne peut pas être vide' };
        }

        const newAct = CorkBoardRepository.createAct(title, project);

        if (newAct) {
            if (typeof saveProject === 'function') saveProject();
            if (typeof renderActsList === 'function') renderActsList();
            return { success: true, act: newAct, message: `✓ Acte "${title}" créé` };
        }

        return { success: false, act: null, message: 'Erreur lors de la création de l\'acte' };
    },

    /**
     * Crée un nouveau chapitre
     * @param {number} actId - ID de l'acte
     * @param {string} title - Titre du chapitre
     * @returns {Object} - {success: boolean, chapter: Object|null, message: string}
     */
    createChapter(actId, title) {
        if (!title || title.trim() === '') {
            return { success: false, chapter: null, message: 'Le titre ne peut pas être vide' };
        }

        const newChapter = CorkBoardRepository.createChapter(actId, title, project);

        if (newChapter) {
            if (typeof saveProject === 'function') saveProject();
            if (typeof renderActsList === 'function') renderActsList();
            return { success: true, chapter: newChapter, message: `✓ Chapitre "${title}" créé` };
        }

        return { success: false, chapter: null, message: 'Erreur lors de la création du chapitre' };
    },

    /**
     * Crée une nouvelle scène
     * @param {number} actId - ID de l'acte
     * @param {number} chapterId - ID du chapitre
     * @param {string} title - Titre de la scène
     * @returns {Object} - {success: boolean, scene: Object|null, message: string}
     */
    createScene(actId, chapterId, title) {
        if (!title || title.trim() === '') {
            return { success: false, scene: null, message: 'Le titre ne peut pas être vide' };
        }

        const newScene = CorkBoardRepository.createScene(actId, chapterId, title, project);

        if (newScene) {
            if (typeof saveProject === 'function') saveProject();
            if (typeof renderActsList === 'function') renderActsList();
            return { success: true, scene: newScene, message: `✓ Scène "${title}" créée` };
        }

        return { success: false, scene: null, message: 'Erreur lors de la création de la scène' };
    },

    /**
     * Ouvre une scène dans l'éditeur
     * @param {number} actId - ID de l'acte
     * @param {number} chapterId - ID du chapitre
     * @param {number} sceneId - ID de la scène
     */
    openSceneInEditor(actId, chapterId, sceneId) {
        if (typeof switchView === 'function') {
            switchView('editor');
        }
        if (typeof openScene === 'function') {
            openScene(actId, chapterId, sceneId);
        }
    },

    /**
     * Vérifie si le projet est vide
     * @returns {boolean}
     */
    isProjectEmpty() {
        if (!project || !project.acts || project.acts.length === 0) return true;
        if (project.acts.length === 1 && project.acts[0].chapters.length === 0) return true;
        return false;
    },

    /**
     * Récupère le nombre total de chapitres
     * @returns {number}
     */
    getTotalChaptersCount() {
        return CorkBoardRepository.getTotalChaptersCount(project);
    },

    /**
     * Récupère les scènes par statut pour la vue Kanban
     * @param {string} status - Statut recherché
     * @returns {Array<CorkBoardScene>}
     */
    getScenesByStatus(status) {
        const allScenes = this.getFilteredScenes();
        return CorkBoardRepository.getScenesByStatus(allScenes, status);
    }
};
