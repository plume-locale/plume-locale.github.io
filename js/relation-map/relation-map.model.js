/**
 * Relation Map Model
 * Defines the data structure for character relations and their positions on the graph.
 */
class RelationMapModel {
    /**
     * @typedef {Object} Relation
     * @property {string} id - Unique identifier for the relation
     * @property {number} char1Id - ID of the first character
     * @property {number} char2Id - ID of the second character
     * @property {string} type - Type of relation (e.g., 'amour', 'amitie')
     * @property {string} description - Optional description of the relation
     * @property {string} createdAt - ISO timestamp of when the relation was created
     */

    /**
     * @typedef {Object} CharacterPosition
     * @property {number} x - X coordinate on the graph
     * @property {number} y - Y coordinate on the graph
     */

    static get RELATION_TYPES() {
        return {
            'amour': { color: '#e91e63', label: Localization.t('relations.type.love'), icon: 'heart' },
            'amitie': { color: '#4caf50', label: Localization.t('relations.type.friendship'), icon: 'handshake' },
            'rivalite': { color: '#f44336', label: Localization.t('relations.type.rivalry'), icon: 'swords' },
            'famille': { color: '#2196f3', label: Localization.t('relations.type.family'), icon: 'house' },
            'mentor': { color: '#ff9800', label: Localization.t('relations.type.mentor'), icon: 'graduation-cap' },
            'ennemi': { color: '#9c27b0', label: Localization.t('relations.type.enemy'), icon: 'skull' },
            'alliance': { color: '#00bcd4', label: Localization.t('relations.type.alliance'), icon: 'shield' },
            'neutre': { color: '#757575', label: Localization.t('relations.type.neutral'), icon: 'meh' }
        };
    }

    /**
     * Creates a new relation object.
     * @param {number} char1Id 
     * @param {number} char2Id 
     * @param {string} type 
     * @param {string} description 
     * @returns {Relation}
     */
    static createRelation(char1Id, char2Id, type, description = '') {
        return {
            id: 'rel_' + Date.now(),
            char1Id,
            char2Id,
            type: type || 'neutre',
            description,
            createdAt: new Date().toISOString()
        };
    }
}
