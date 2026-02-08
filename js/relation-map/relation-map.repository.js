/**
 * Relation Map Repository
 * Handles CRUD operations for character relations and positions.
 */
class RelationMapRepository {
    constructor() {
        this._ensureDataStructures();
    }

    _ensureDataStructures() {
        if (!project.relations) project.relations = [];
        if (!project.characterPositions) project.characterPositions = {};
        if (!project.customRelationTypes) project.customRelationTypes = {};
    }

    /**
     * Gets all relations.
     * @returns {Array}
     */
    getAllRelations() {
        return project.relations || [];
    }

    /**
     * Finds a relation by ID.
     * @param {string} id 
     * @returns {Object|null}
     */
    getRelationById(id) {
        return (project.relations || []).find(r => r.id === id) || null;
    }

    /**
     * Adds a new relation.
     * @param {Object} relation 
     */
    addRelation(relation) {
        if (!project.relations) project.relations = [];
        project.relations.push(relation);
        this._save();
    }

    /**
     * Updates an existing relation.
     * @param {string} id 
     * @param {Object} updates 
     */
    updateRelation(id, updates) {
        const index = (project.relations || []).findIndex(r => r.id === id);
        if (index !== -1) {
            project.relations[index] = { ...project.relations[index], ...updates };
            this._save();
            return true;
        }
        return false;
    }

    /**
     * Deletes a relation.
     * @param {string} id 
     */
    deleteRelation(id) {
        if (!project.relations) return;
        project.relations = project.relations.filter(r => r.id !== id);
        this._save();
    }

    /**
     * Gets all character positions.
     * @returns {Object}
     */
    getCharacterPositions() {
        return project.characterPositions || {};
    }

    /**
     * Updates a character's position.
     * @param {number} charId 
     * @param {number} x 
     * @param {number} y 
     */
    updateCharacterPosition(charId, x, y) {
        if (!project.characterPositions) project.characterPositions = {};
        project.characterPositions[charId] = { x, y };
        this._save();
    }

    /**
     * Resets all character positions.
     */
    resetAllPositions() {
        project.characterPositions = {};
        this._save();
    }

    /**
     * Sets all character positions.
     * @param {Object} positions 
     */
    setAllPositions(positions) {
        project.characterPositions = positions;
        this._save();
    }

    /**
     * Gets all custom relation types.
     * @returns {Object}
     */
    getCustomRelationTypes() {
        return project.customRelationTypes || {};
    }

    /**
     * Adds or updates a custom relation type.
     * @param {string} key 
     * @param {Object} typeData 
     */
    saveCustomRelationType(key, typeData) {
        if (!project.customRelationTypes) project.customRelationTypes = {};
        project.customRelationTypes[key] = typeData;
        this._save();
    }

    /**
     * Deletes a custom relation type.
     * @param {string} key 
     */
    deleteCustomRelationType(key) {
        if (project.customRelationTypes && project.customRelationTypes[key]) {
            delete project.customRelationTypes[key];
            this._save();
            return true;
        }
        return false;
    }

    /**
     * Internal save triggers global project save.
     */
    _save() {
        if (typeof saveProject === 'function') {
            saveProject();
        }
    }
}
