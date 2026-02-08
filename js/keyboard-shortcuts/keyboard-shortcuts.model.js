/**
 * Model for a keyboard shortcut
 */
class KeyboardShortcut {
    constructor(key, ctrl = false, meta = false, shift = false, alt = false, description = '') {
        this.key = key;
        this.ctrl = ctrl;
        this.meta = meta;
        this.shift = shift;
        this.alt = alt;
        this.description = description;
    }

    /**
     * Checks if the event matches this shortcut
     * @param {KeyboardEvent} e 
     * @returns {boolean}
     */
    matches(e) {
        // Handle Ctrl/Meta equivalence for cross-platform support (Ctrl on Win, Cmd on Mac)
        const ctrlMatch = (this.ctrl || this.meta) ? (e.ctrlKey || e.metaKey) : (!e.ctrlKey && !e.metaKey);

        // Character match: either exact match (handles symbols like '?') or case-insensitive (standard for shortcuts)
        const keyMatch = (e.key === this.key) || (e.key.toLowerCase() === this.key.toLowerCase());

        // Shift match: either exact boolean match OR the keys match exactly (e.g. e.key is '?' which often requires shift)
        const shiftMatch = (e.shiftKey === this.shift) || (e.key === this.key && this.key.length === 1);

        return keyMatch &&
            ctrlMatch &&
            shiftMatch &&
            e.altKey === this.alt;
    }
}
