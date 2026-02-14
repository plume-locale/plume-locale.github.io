/**
 * [MVVM : Thriller Board Model]
 * Factories et structures de données pour les entités du Thriller Board.
 */

// ============================================
// ELEMENT MODEL
// ============================================

const ThrillerElementModel = {
    /**
     * Crée un nouvel élément Thriller.
     * @param {Object} data - Données initiales.
     * @returns {Object} Le nouvel élément.
     */
    create: function (data = {}) {
        const now = Date.now();
        const type = data.type || 'clue';
        const typeData = THRILLER_TYPES[type] || THRILLER_TYPES.clue;

        return {
            id: data.id || 'elem_' + now + '_' + Math.random().toString(36).substr(2, 9),
            type: type,
            title: data.title || `${typeData.label} ${now}`,
            description: data.description || '',
            position: data.position || { x: 100, y: 100 },
            size: data.size || { width: 280, height: 200 },
            color: data.color || typeData.color,
            data: data.data || {},
            status: data.status || 'pending',
            connections: data.connections || [],
            createdAt: data.createdAt || new Date(now).toISOString(),
            updatedAt: data.updatedAt || new Date(now).toISOString()
        };
    },

    /**
     * Migre un élément legacy si nécessaire.
     * @param {Object} raw - Données brutes.
     * @returns {Object} Élément migré.
     */
    migrate: function (raw) {
        if (!raw) return null;
        return {
            ...this.create(raw),
            id: raw.id,
            createdAt: raw.createdAt,
            updatedAt: raw.updatedAt
        };
    }
};

// ============================================
// CARD MODEL
// ============================================

const ThrillerCardModel = {
    /**
     * Crée une nouvelle carte pour la grille.
     * @param {Object} data - Données initiales.
     * @returns {Object} La nouvelle carte.
     */
    create: function (data = {}) {
        const now = Date.now();
        return {
            id: data.id || 'card_' + now + '_' + Math.random().toString(36).substr(2, 9),
            type: data.type || 'clue',
            elementId: data.elementId || null,
            title: data.title || '',
            data: data.data || {},
            status: data.status || 'pending',
            rowId: data.rowId || null,
            columnId: data.columnId || null,
            zIndex: data.zIndex || 0,
            createdAt: data.createdAt || new Date(now).toISOString(),
            updatedAt: data.updatedAt || new Date(now).toISOString()
        };
    },

    /**
     * Crée une carte à partir d'un élément existant.
     * @param {Object} element - L'élément source.
     * @param {string} rowId - ID de la ligne.
     * @param {string} columnId - ID de la colonne.
     * @param {number} zIndex - Index de superposition.
     * @returns {Object} La nouvelle carte.
     */
    createFromElement: function (element, rowId, columnId, zIndex = 0) {
        return this.create({
            type: element.type,
            elementId: element.id,
            title: element.title,
            data: { ...element.data },
            status: element.status || 'pending',
            rowId: rowId,
            columnId: columnId,
            zIndex: zIndex
        });
    }
};

// ============================================
// ROW MODEL (Swimlane)
// ============================================

const ThrillerRowModel = {
    /**
     * Crée une nouvelle ligne (swimlane).
     * @param {Object} data - Données initiales.
     * @returns {Object} La nouvelle ligne.
     */
    create: function (data = {}) {
        const now = Date.now();
        return {
            id: data.id || 'row_' + now + '_' + Math.random().toString(36).substr(2, 9),
            title: data.title || 'Nouvelle ligne',
            type: data.type || 'custom',
            icon: data.icon || SWIMLANE_ROW_TYPES[data.type]?.icon || 'tag',
            color: data.color || SWIMLANE_ROW_TYPES[data.type]?.color || '#95a5a6',
            entityId: data.entityId || null,
            height: data.height || THRILLER_BOARD_CONFIG.swimlaneHeight,
            createdAt: data.createdAt || new Date(now).toISOString()
        };
    },

    /**
     * Crée une ligne à partir d'un personnage.
     * @param {Object} character - Le personnage.
     * @returns {Object} La ligne.
     */
    createFromCharacter: function (character) {
        if (!character) return null;
        return {
            id: `character_${character.id}`,
            title: character.name || 'Personnage sans nom',
            type: 'character',
            icon: 'user',
            color: '#3498db',
            entityId: character.id
        };
    },

    /**
     * Crée une ligne à partir d'un lieu.
     * @param {Object} location - Le lieu.
     * @returns {Object} La ligne.
     */
    createFromLocation: function (location) {
        if (!location) return null;
        return {
            id: `location_${location.id}`,
            title: location.name || 'Lieu sans nom',
            type: 'location',
            icon: 'map-pin',
            color: '#2ecc71',
            entityId: location.id
        };
    }
};

// ============================================
// COLUMN MODEL
// ============================================

const ThrillerColumnModel = {
    /**
     * Crée une nouvelle colonne.
     * @param {Object} data - Données initiales.
     * @returns {Object} La nouvelle colonne.
     */
    create: function (data = {}) {
        const now = Date.now();
        return {
            id: data.id || 'col_' + now + '_' + Math.random().toString(36).substr(2, 9),
            title: data.title || 'Nouvelle colonne',
            type: data.type || 'free',
            width: data.width || THRILLER_BOARD_CONFIG.defaultColumnWidth,
            sceneId: data.sceneId || null,
            chapterId: data.chapterId || null,
            actId: data.actId || null,
            createdAt: data.createdAt || new Date(now).toISOString()
        };
    },

    /**
     * Crée une colonne à partir d'une scène (mode narratif).
     * @param {Object} scene - La scène.
     * @param {Object} act - L'acte parent.
     * @param {Object} chapter - Le chapitre parent.
     * @returns {Object} La colonne.
     */
    createFromScene: function (scene, act, chapter) {
        return {
            id: `scene_${scene.id}`,
            title: `${act.title} > ${chapter.title}: ${scene.title || 'Scène'}`,
            type: 'scene',
            sceneId: scene.id,
            chapterId: chapter.id,
            actId: act.id
        };
    },

    /**
     * Crée la colonne spéciale "Non assigné".
     * @returns {Object} La colonne.
     */
    createUnassigned: function () {
        return {
            id: 'unassigned',
            title: 'Non assigné à une scène',
            type: 'unassigned'
        };
    }
};

// ============================================
// CONNECTION MODEL
// ============================================

const ThrillerConnectionModel = {
    /**
     * Crée une nouvelle connexion entre deux éléments/cartes.
     * @param {Object} from - Source (cardId, property, side).
     * @param {Object} to - Destination (cardId, property, side).
     * @param {Object} data - Données supplémentaires.
     * @returns {Object} La connexion.
     */
    create: function (from, to, data = {}) {
        const now = Date.now();
        return {
            id: data.id || 'conn_' + now + '_' + Math.random().toString(36).substr(2, 9),
            from: {
                cardId: from.cardId,
                property: from.property || null,
                side: from.side || 'right'
            },
            to: {
                cardId: to.cardId,
                property: to.property || null,
                side: to.side || 'left'
            },
            color: data.color || '#666',
            label: data.label || '',
            createdAt: data.createdAt || new Date(now).toISOString()
        };
    }
};

// ============================================
// STATE MODEL
// ============================================

const ThrillerBoardStateModel = {
    /**
     * Crée l'état initial du board.
     * @returns {Object} L'état initial.
     */
    createInitial: function () {
        return {
            elements: [],
            connections: [],
            canvasOffset: { x: 0, y: 0 },
            zoom: 1,
            selectedElements: [],
            contextPanelOpen: true,
            currentFilter: 'clue',
            snapToGrid: true,
            viewMode: 'canvas',
            gridConfig: {
                columnMode: 'free',
                rows: [],
                columns: [],
                cards: [],
                connections: []
            }
        };
    }
};
