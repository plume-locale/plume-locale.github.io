/**
 * [MVVM : World Model]
 * Defines the structure of world elements and factory functions.
 */

const WorldModel = {
    /**
     * Create a new world element.
     * @param {Object} data - Initial data for the element.
     * @returns {Object} A new world element object.
     */
    create: function (data = {}) {
        const now = Date.now();
        return {
            id: data.id || now,
            name: data.name || '',
            type: data.type || 'Lieu',
            description: data.description || '',
            details: data.details || '',
            history: data.history || '',
            notes: data.notes || '',
            linkedScenes: data.linkedScenes || [], // Array of scene IDs
            linkedElements: data.linkedElements || [], // Array of {type, id}
            createdAt: data.createdAt || new Date(now).toISOString(),
            updatedAt: data.updatedAt || new Date(now).toISOString()
        };
    },

    /**
     * Migrate a legacy world element structure if necessary.
     * @param {Object} raw - Raw data from project.world.
     * @returns {Object} Migrated element.
     */
    migrate: function (raw) {
        if (!raw) return null;

        // Ensure all required fields exist
        return {
            ...this.create(raw),
            // Add specific migration logic here if fields changed in the past
            linkedScenes: raw.linkedScenes || [],
            linkedElements: raw.linkedElements || []
        };
    }
};
