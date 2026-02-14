// ============================================
// CORKBOARD MODEL
// ============================================
// Définit les structures de données et les règles métier du Cork Board

/**
 * Modèle de filtre pour le Cork Board
 * @typedef {Object} CorkBoardFilter
 * @property {string} type - Type de filtre: 'all', 'act', 'chapter'
 * @property {number|null} actId - ID de l'acte filtré
 * @property {number|null} chapterId - ID du chapitre filtré
 * @property {string} mode - Mode d'affichage: 'structured' ou 'kanban'
 */

/**
 * Modèle de scène enrichie pour le Cork Board
 * @typedef {Object} CorkBoardScene
 * @property {number} id - ID de la scène
 * @property {string} title - Titre de la scène
 * @property {string} content - Contenu de la scène
 * @property {string} synopsis - Synopsis de la scène
 * @property {string} status - Statut: 'draft', 'progress', 'complete', 'review'
 * @property {string} corkColor - Couleur de la carte: 'default', 'yellow', 'blue', 'green', 'red', 'purple'
 * @property {number} actId - ID de l'acte parent
 * @property {string} actTitle - Titre de l'acte parent
 * @property {number} chapterId - ID du chapitre parent
 * @property {string} chapterTitle - Titre du chapitre parent
 * @property {Array} characters - Personnages de la scène
 * @property {Array} locations - Lieux de la scène
 * @property {string} notes - Notes de la scène
 */

/**
 * Modèle de statut Kanban
 * @typedef {Object} KanbanStatus
 * @property {string} id - ID du statut
 * @property {string} label - Label affiché
 * @property {string} color - Couleur CSS du statut
 */

/**
 * Statuts disponibles pour la vue Kanban
 */
const CorkBoardModel = {
    /**
     * Statuts Kanban disponibles
     */
    KANBAN_STATUSES: [
        { id: 'draft', label: Localization.t('corkboard.status.draft'), color: 'var(--accent-red)' },
        { id: 'progress', label: Localization.t('corkboard.status.progress'), color: 'var(--accent-gold)' },
        { id: 'complete', label: Localization.t('corkboard.status.complete'), color: 'var(--accent-green)' },
        { id: 'review', label: Localization.t('corkboard.status.review'), color: 'var(--accent-blue)' }
    ],

    /**
     * Couleurs disponibles pour les cartes Cork Board
     */
    CORK_COLORS: [
        'default',
        'yellow',
        'blue',
        'green',
        'red',
        'purple'
    ],

    /**
     * Modes d'affichage disponibles
     */
    DISPLAY_MODES: {
        STRUCTURED: 'structured',
        KANBAN: 'kanban'
    },

    /**
     * Types de filtres disponibles
     */
    FILTER_TYPES: {
        ALL: 'all',
        ACT: 'act',
        CHAPTER: 'chapter'
    },

    /**
     * Crée un nouveau filtre Cork Board
     * @param {string} type - Type de filtre
     * @param {number|null} actId - ID de l'acte
     * @param {number|null} chapterId - ID du chapitre
     * @param {string} mode - Mode d'affichage
     * @returns {CorkBoardFilter}
     */
    createFilter(type = 'all', actId = null, chapterId = null, mode = 'structured') {
        return {
            type,
            actId,
            chapterId,
            mode
        };
    },

    /**
     * Enrichit une scène avec les informations de contexte (acte, chapitre)
     * @param {Object} scene - Scène brute
     * @param {Object} act - Acte parent
     * @param {Object} chapter - Chapitre parent
     * @returns {CorkBoardScene}
     */
    enrichScene(scene, act, chapter) {
        return {
            ...scene,
            actId: act.id,
            actTitle: act.title,
            chapterId: chapter.id,
            chapterTitle: chapter.title
        };
    },

    /**
     * Valide un filtre Cork Board
     * @param {CorkBoardFilter} filter - Filtre à valider
     * @returns {boolean}
     */
    validateFilter(filter) {
        if (!filter || typeof filter !== 'object') return false;

        const validTypes = Object.values(this.FILTER_TYPES);
        if (!validTypes.includes(filter.type)) return false;

        const validModes = Object.values(this.DISPLAY_MODES);
        if (filter.mode && !validModes.includes(filter.mode)) return false;

        return true;
    },

    /**
     * Valide un statut de scène
     * @param {string} status - Statut à valider
     * @returns {boolean}
     */
    validateStatus(status) {
        const validStatuses = this.KANBAN_STATUSES.map(s => s.id);
        return validStatuses.includes(status);
    },

    /**
     * Valide une couleur de carte
     * @param {string} color - Couleur à valider
     * @returns {boolean}
     */
    validateColor(color) {
        return this.CORK_COLORS.includes(color);
    }
};
