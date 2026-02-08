/**
 * Relation Map ViewModel
 * Manages the state and logic for the character relations graph.
 */
class RelationMapViewModel {
    constructor(repository) {
        this.repository = repository;
        this.selectedCharsForRelation = [];
        this.draggedCharId = null;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.isDragging = false;
        this.dragMoved = false;
        this.selectedRelationType = null;
        this.currentEditingRelationId = null;
    }

    /**
     * Gets all character data needed for the graph.
     * @returns {Array}
     */
    getCharacters() {
        return project.characters || [];
    }

    /**
     * Gets all relations.
     * @returns {Array}
     */
    getRelations() {
        return this.repository.getAllRelations();
    }

    /**
     * Gets positions for all characters.
     * @returns {Object}
     */
    getPositions() {
        return this.repository.getCharacterPositions();
    }

    /**
     * Gets character positions for rendering, calculating defaults if necessary.
     * @returns {Array}
     */
    getCalculatedPositions() {
        const characters = this.getCharacters();
        const storedPositions = this.getPositions();
        const centerX = 400;
        const centerY = 350;
        const radius = 220;

        return characters.map((char, i) => {
            if (storedPositions[char.id]) {
                return storedPositions[char.id];
            } else {
                const angle = (i / characters.length) * 2 * Math.PI;
                return {
                    x: centerX + radius * Math.cos(angle),
                    y: centerY + radius * Math.sin(angle)
                };
            }
        });
    }

    /**
     * Handles character selection for creating a relation.
     * @param {number} charId 
     * @returns {boolean} True if a modal should be shown
     */
    toggleCharacterSelection(charId) {
        const id = Number(charId) || charId;
        const index = this.selectedCharsForRelation.indexOf(id);

        if (index !== -1) {
            this.selectedCharsForRelation.splice(index, 1);
            return false;
        } else {
            this.selectedCharsForRelation.push(id);
            if (this.selectedCharsForRelation.length === 2) {
                return true; // Signal to show modal
            }
            return false;
        }
    }

    /**
     * Clears the current selection.
     */
    clearSelection() {
        this.selectedCharsForRelation = [];
        this.selectedRelationType = null;
        this.currentEditingRelationId = null;
    }

    /**
     * Sets the relation type for the current selection.
     * @param {string} type 
     */
    setRelationType(type) {
        this.selectedRelationType = type;
    }

    saveRelation(description) {
        if (this.currentEditingRelationId) {
            // Update existing
            this.repository.updateRelation(this.currentEditingRelationId, {
                type: this.selectedRelationType,
                description: description
            });
        } else {
            // Create new
            if (this.selectedCharsForRelation.length !== 2 || !this.selectedRelationType) return;
            const relation = RelationMapModel.createRelation(
                this.selectedCharsForRelation[0],
                this.selectedCharsForRelation[1],
                this.selectedRelationType,
                description
            );
            this.repository.addRelation(relation);
        }
        this.clearSelection();
    }

    /**
     * Updates an existing relation's description.
     * @param {string} id 
     * @param {string} newDescription 
     */
    updateRelationDescription(id, newDescription) {
        this.repository.updateRelation(id, { description: newDescription });
    }

    /**
     * Deletes a relation.
     * @param {string} id 
     */
    deleteRelation(id) {
        this.repository.deleteRelation(id);
    }

    /**
     * Resets character positions to default circle.
     */
    resetPositions() {
        this.repository.resetAllPositions();
    }

    /**
     * Automatically arranges characters in a circle and saves.
     */
    autoArrange() {
        const characters = this.getCharacters();
        const centerX = 400;
        const centerY = 350;
        const radius = 220;
        const newPositions = {};

        characters.forEach((char, i) => {
            const angle = (i / characters.length) * 2 * Math.PI;
            newPositions[char.id] = {
                x: centerX + radius * Math.cos(angle),
                y: centerY + radius * Math.sin(angle)
            };
        });

        this.repository.setAllPositions(newPositions);
    }

    /**
     * Start drag operation.
     */
    startDrag(charId, startX, startY) {
        this.draggedCharId = charId;
        this.dragStartX = startX;
        this.dragStartY = startY;
        this.isDragging = true;
        this.dragMoved = false;
    }

    /**
     * Update drag operation.
     */
    updateDrag(currentX, currentY) {
        if (!this.isDragging) return null;

        const deltaX = currentX - this.dragStartX;
        const deltaY = currentY - this.dragStartY;

        if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
            this.dragMoved = true;
        }

        this.dragStartX = currentX;
        this.dragStartY = currentY;

        return { deltaX, deltaY, charId: this.draggedCharId };
    }

    /**
     * Stop drag operation and save if moved.
     */
    stopDrag(finalX, finalY) {
        const wasMoved = this.dragMoved;
        const charId = this.draggedCharId;

        if (wasMoved && charId) {
            this.repository.updateCharacterPosition(charId, finalX, finalY);
        }

        this.isDragging = false;
        this.draggedCharId = null;
        this.dragMoved = false;

        return wasMoved;
    }

    /**
     * Gets all relation types (defaults + custom).
     */
    getRelationTypes() {
        const defaults = RelationMapModel.RELATION_TYPES;
        const customs = this.repository.getCustomRelationTypes();
        return { ...defaults, ...customs };
    }

    /**
     * Adds a new custom relation type.
     */
    addRelationType(label, color, icon = 'tag') {
        const key = label.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '_');
        this.repository.saveCustomRelationType(key, { label, color, icon });
    }

    /**
     * Deletes a custom relation type.
     */
    deleteRelationType(key) {
        return this.repository.deleteCustomRelationType(key);
    }

    /**
     * Gets count of relations for a specific type.
     * @param {string} type 
     */
    getRelationCount(type) {
        return this.getRelations().filter(r => r.type === type).length;
    }
}
