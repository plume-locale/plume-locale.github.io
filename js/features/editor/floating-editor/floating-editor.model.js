/**
 * Model for the Floating Editor
 * Handles the state of the floating menu (position, visibility)
 */
class FloatingEditorModel {
    constructor() {
        this.position = { x: 0, y: 0 };
        this.isActive = false;
        this.isAdvancedActive = false;
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
    }

    /**
     * Updates the position of the menu
     * @param {number} x 
     * @param {number} y 
     */
    setPosition(x, y) {
        this.position = { x, y };
    }

    /**
     * Sets the active state of the menu
     * @param {boolean} active 
     */
    setActive(active) {
        this.isActive = active;
    }

    /**
     * Sets the active state of the advanced menu
     * @param {boolean} active 
     */
    setAdvancedActive(active) {
        this.isAdvancedActive = active;
    }

    /**
     * Sets the dragging state
     * @param {boolean} dragging 
     */
    setDragging(dragging) {
        this.isDragging = dragging;
    }

    /**
     * Sets the drag offset
     * @param {number} x 
     * @param {number} y 
     */
    setDragOffset(x, y) {
        this.dragOffset = { x, y };
    }
}

// Export for global access if needed, or instantiate here
const floatingEditorModel = new FloatingEditorModel();
