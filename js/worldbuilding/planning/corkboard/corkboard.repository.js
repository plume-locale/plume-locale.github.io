// ============================================
// CORKBOARD REPOSITORY
// ============================================
// Gère l'accès aux données et les opérations CRUD

const CorkBoardRepository = {
    /**
     * READ: Récupère toutes les scènes selon le filtre
     * @param {CorkBoardFilter} filter - Filtre à appliquer
     * @param {Object} project - Projet contenant les données
     * @returns {Array<CorkBoardScene>}
     */
    getFilteredScenes(filter, project) {
        if (!project || !project.acts) return [];

        const scenes = [];

        if (filter.type === CorkBoardModel.FILTER_TYPES.ALL) {
            // Toutes les scènes de tous les actes
            project.acts.forEach(act => {
                act.chapters.forEach(chapter => {
                    chapter.scenes.forEach(scene => {
                        scenes.push(CorkBoardModel.enrichScene(scene, act, chapter));
                    });
                });
            });
        } else if (filter.type === CorkBoardModel.FILTER_TYPES.ACT) {
            // Scènes d'un acte spécifique
            const act = this.getActById(filter.actId, project);
            if (act) {
                act.chapters.forEach(chapter => {
                    chapter.scenes.forEach(scene => {
                        scenes.push(CorkBoardModel.enrichScene(scene, act, chapter));
                    });
                });
            }
        } else if (filter.type === CorkBoardModel.FILTER_TYPES.CHAPTER) {
            // Scènes d'un chapitre spécifique
            const act = this.getActById(filter.actId, project);
            if (act) {
                const chapter = this.getChapterById(filter.chapterId, act);
                if (chapter) {
                    chapter.scenes.forEach(scene => {
                        scenes.push(CorkBoardModel.enrichScene(scene, act, chapter));
                    });
                }
            }
        }

        return scenes;
    },

    /**
     * READ: Récupère un acte par son ID
     * @param {number} actId - ID de l'acte
     * @param {Object} project - Projet
     * @returns {Object|null}
     */
    getActById(actId, project) {
        if (!project || !project.acts) return null;
        return project.acts.find(a => a.id === parseInt(actId)) || null;
    },

    /**
     * READ: Récupère un chapitre par son ID dans un acte
     * @param {number} chapterId - ID du chapitre
     * @param {Object} act - Acte parent
     * @returns {Object|null}
     */
    getChapterById(chapterId, act) {
        if (!act || !act.chapters) return null;
        return act.chapters.find(c => c.id === parseInt(chapterId)) || null;
    },

    /**
     * READ: Récupère une scène par son ID dans un chapitre
     * @param {number} sceneId - ID de la scène
     * @param {Object} chapter - Chapitre parent
     * @returns {Object|null}
     */
    getSceneById(sceneId, chapter) {
        if (!chapter || !chapter.scenes) return null;
        return chapter.scenes.find(s => s.id === parseInt(sceneId)) || null;
    },

    /**
     * READ: Récupère les chapitres d'un acte
     * @param {number} actId - ID de l'acte
     * @param {Object} project - Projet
     * @returns {Array}
     */
    getChaptersByActId(actId, project) {
        const act = this.getActById(actId, project);
        return act ? act.chapters : [];
    },

    /**
     * UPDATE: Met à jour le synopsis d'une scène
     * @param {number} actId - ID de l'acte
     * @param {number} chapterId - ID du chapitre
     * @param {number} sceneId - ID de la scène
     * @param {string} synopsis - Nouveau synopsis
     * @param {Object} project - Projet
     * @returns {boolean} - Succès de l'opération
     */
    updateSceneSynopsis(actId, chapterId, sceneId, synopsis, project) {
        const act = this.getActById(actId, project);
        if (!act) return false;

        const chapter = this.getChapterById(chapterId, act);
        if (!chapter) return false;

        const scene = this.getSceneById(sceneId, chapter);
        if (!scene) return false;

        scene.synopsis = synopsis;
        return true;
    },

    /**
     * UPDATE: Met à jour la couleur d'une scène
     * @param {number} actId - ID de l'acte
     * @param {number} chapterId - ID du chapitre
     * @param {number} sceneId - ID de la scène
     * @param {string} color - Nouvelle couleur
     * @param {Object} project - Projet
     * @returns {boolean} - Succès de l'opération
     */
    updateSceneColor(actId, chapterId, sceneId, color, project) {
        if (!CorkBoardModel.validateColor(color)) return false;

        const act = this.getActById(actId, project);
        if (!act) return false;

        const chapter = this.getChapterById(chapterId, act);
        if (!chapter) return false;

        const scene = this.getSceneById(sceneId, chapter);
        if (!scene) return false;

        scene.corkColor = color;
        return true;
    },

    /**
     * UPDATE: Réorganise les scènes dans un chapitre
     * @param {number} actId - ID de l'acte
     * @param {number} chapterId - ID du chapitre
     * @param {number} fromIndex - Index source
     * @param {number} toIndex - Index destination
     * @param {Object} project - Projet
     * @returns {boolean} - Succès de l'opération
     */
    reorderScenes(actId, chapterId, fromIndex, toIndex, project) {
        const act = this.getActById(actId, project);
        if (!act) return false;

        const chapter = this.getChapterById(chapterId, act);
        if (!chapter) return false;

        if (fromIndex < 0 || fromIndex >= chapter.scenes.length) return false;
        if (toIndex < 0 || toIndex >= chapter.scenes.length) return false;

        const [movedScene] = chapter.scenes.splice(fromIndex, 1);
        chapter.scenes.splice(toIndex, 0, movedScene);

        return true;
    },

    /**
     * CREATE: Crée un nouvel acte
     * @param {string} title - Titre de l'acte
     * @param {Object} project - Projet
     * @returns {Object|null} - Nouvel acte créé
     */
    createAct(title, project) {
        if (!project || !project.acts) return null;
        if (!title || title.trim() === '') return null;

        const newAct = (typeof createAct === 'function') ? createAct(title.trim()) : {
            id: Date.now(),
            title: title.trim(),
            chapters: []
        };

        project.acts.push(newAct);
        return newAct;
    },

    /**
     * CREATE: Crée un nouveau chapitre dans un acte
     * @param {number} actId - ID de l'acte
     * @param {string} title - Titre du chapitre
     * @param {Object} project - Projet
     * @returns {Object|null} - Nouveau chapitre créé
     */
    createChapter(actId, title, project) {
        const act = this.getActById(actId, project);
        if (!act) return null;
        if (!title || title.trim() === '') return null;

        const newChapter = (typeof createChapter === 'function') ? createChapter(title.trim()) : {
            id: Date.now(),
            title: title.trim(),
            scenes: []
        };

        // Create implicit scene for the new chapter
        const firstScene = (typeof createScene === 'function') ? createScene(title.trim()) : {
            id: Date.now() + 1,
            title: title.trim(),
            content: '',
            synopsis: '',
            status: 'draft',
            characters: [],
            locations: [],
            notes: ''
        };
        newChapter.scenes.push(firstScene);

        act.chapters.push(newChapter);
        return newChapter;
    },

    /**
     * CREATE: Crée une nouvelle scène dans un chapitre
     * @param {number} actId - ID de l'acte
     * @param {number} chapterId - ID du chapitre
     * @param {string} title - Titre de la scène
     * @param {Object} project - Projet
     * @returns {Object|null} - Nouvelle scène créée
     */
    createScene(actId, chapterId, title, project) {
        const act = this.getActById(actId, project);
        if (!act) return null;

        const chapter = this.getChapterById(chapterId, act);
        if (!chapter) return null;
        if (!title || title.trim() === '') return null;

        const newScene = (typeof createScene === 'function') ? createScene(title.trim()) : {
            id: Date.now(),
            title: title.trim(),
            content: '',
            synopsis: '',
            status: 'draft',
            characters: [],
            locations: [],
            notes: ''
        };

        chapter.scenes.push(newScene);
        return newScene;
    },

    /**
     * READ: Récupère les scènes par statut (pour vue Kanban)
     * @param {Array<CorkBoardScene>} scenes - Scènes à filtrer
     * @param {string} status - Statut recherché
     * @returns {Array<CorkBoardScene>}
     */
    getScenesByStatus(scenes, status) {
        return scenes.filter(s => (s.status || 'draft') === status);
    },

    /**
     * READ: Compte le nombre total de chapitres dans le projet
     * @param {Object} project - Projet
     * @returns {number}
     */
    getTotalChaptersCount(project) {
        if (!project || !project.acts) return 0;
        return project.acts.reduce((sum, act) => sum + act.chapters.length, 0);
    }
};
