/**
 * [MVVM : World Repository]
 * Data access layer for world elements.
 */

const WorldRepository = {
    /**
     * Get all world elements.
     * @returns {Array} List of world elements.
     */
    getAll: () => {
        return project.world || [];
    },

    /**
     * Get a world element by ID.
     * @param {number} id - Element ID.
     * @returns {Object|null} The element or null if not found.
     */
    getById: (id) => {
        return (project.world || []).find(w => String(w.id) === String(id)) || null;
    },

    /**
     * Add a new world element.
     * @param {Object} element - The element to add.
     * @returns {Object} The added element.
     */
    add: (element) => {
        if (!project.world) project.world = [];
        project.world.push(element);
        return element;
    },

    /**
     * Update an existing world element.
     * @param {number} id - Element ID.
     * @param {Object} updates - Data to update.
     * @returns {Object|null} The updated element or null if not found.
     */
    update: (id, updates) => {
        const index = (project.world || []).findIndex(w => String(w.id) === String(id));
        if (index === -1) return null;

        const updated = {
            ...project.world[index],
            ...updates,
            updatedAt: new Date().toISOString()
        };
        project.world[index] = updated;
        return updated;
    },

    /**
     * Remove a world element.
     * @param {number} id - Element ID.
     * @returns {Object|null} The removed element or null if not found.
     */
    remove: (id) => {
        const index = (project.world || []).findIndex(w => String(w.id) === String(id));
        if (index === -1) return null;

        const removed = project.world[index];
        project.world = project.world.filter(w => String(w.id) !== String(id));
        return removed;
    }
};
