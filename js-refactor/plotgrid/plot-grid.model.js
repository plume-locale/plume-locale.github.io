/**
 * [MVVM : Plot Grid Model]
 * Factories and data structures for the Plot Grid Module.
 */

const PlotGridModel = {
    /**
     * Creates a new Plot Grid state.
     * @returns {Object} Initial state.
     */
    createState: function () {
        return {
            rows: [],      // Ordered list of row objects
            columns: [],   // Ordered list of column objects
            cards: [],     // All cards in the grid
            settings: {
                showStructure: true,
                syncEnabled: true
            }
        };
    },

    /**
     * Creates a Row object.
     * @param {Object} data 
     * @returns {Object}
     */
    createRow: function (data = {}) {
        const now = Date.now();
        return {
            id: data.id || 'pg_row_' + now + '_' + Math.random().toString(36).substr(2, 9),
            type: data.type || 'custom', // 'structure' | 'custom'
            structureId: data.structureId || null, // ID of Act/Chapter/Scene if type is structure
            structureType: data.structureType || null, // 'act' | 'chapter' | 'scene'
            title: data.title || 'New Row',
            order: data.order || 0,
            isCollapsed: false
        };
    },

    /**
     * Creates a Column object.
     * @param {Object} data 
     * @returns {Object}
     */
    createColumn: function (data = {}) {
        const now = Date.now();
        return {
            id: data.id || 'pg_col_' + now + '_' + Math.random().toString(36).substr(2, 9),
            type: data.type || 'custom', // 'structure' | 'custom'
            title: data.title || 'New Column',
            order: data.order || 0,
            width: data.width || 250
        };
    },

    /**
     * Creates a Card object.
     * @param {Object} data 
     * @returns {Object}
     */
    createCard: function (data = {}) {
        const now = Date.now();
        return {
            id: data.id || 'pg_card_' + now + '_' + Math.random().toString(36).substr(2, 9),
            rowId: data.rowId,
            colId: data.colId,
            title: data.title || '',
            content: data.content || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
    }
};
