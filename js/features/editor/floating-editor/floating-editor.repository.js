/**
 * Repository for Floating Editor
 * Handles persistence of the menu position
 */
const FloatingEditorRepository = {
    STORAGE_KEY: 'floatingMenuPosition',

    /**
     * Saves the current position to localStorage
     * @param {Object} position {x, y}
     */
    savePosition(position) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(position));
        } catch (e) {
            console.error('FloatingEditorRepository: Error saving position', e);
        }
    },

    /**
     * Loads the saved position from localStorage
     * @returns {Object|null} {x, y} or null if not found
     */
    loadPosition() {
        const saved = localStorage.getItem(this.STORAGE_KEY);
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error('FloatingEditorRepository: Error loading position', e);
                return null;
            }
        }
        return null;
    }
};
