/**
 * Repository for the Reserve feature
 */
const ReserveRepository = {
    /**
     * Saves an item to the reserve
     * @param {Object} item 
     */
    async save(item) {
        const database = window.db;
        if (!database) {
            console.warn('[ReserveRepository] Database not initialized');
            return false;
        }
        try {
            if (!database.objectStoreNames.contains(StorageModel.STORES.RESERVE)) {
                console.error('[ReserveRepository] Store "reserve" not found. DB Upgrade might have failed.');
                return false;
            }
            await database.put(StorageModel.STORES.RESERVE, item);
            return true;
        } catch (e) {
            console.error('[ReserveRepository] Error saving item:', e);
            return false;
        }
    },

    /**
     * Gets all items for a project
     * @param {string} projectId 
     */
    async getAllByProject(projectId) {
        const database = window.db;
        if (!database) return [];
        try {
            if (!database.objectStoreNames.contains(StorageModel.STORES.RESERVE)) {
                return [];
            }
            return await database.getAllFromIndex(StorageModel.STORES.RESERVE, 'projectId', projectId);
        } catch (e) {
            console.error('[ReserveRepository] Error loading items:', e);
            return [];
        }
    },

    /**
     * Deletes an item
     * @param {string} id 
     */
    async delete(id) {
        const database = window.db;
        if (!database) return false;
        try {
            if (!database.objectStoreNames.contains(StorageModel.STORES.RESERVE)) {
                return false;
            }
            await database.delete(StorageModel.STORES.RESERVE, id);
            return true;
        } catch (e) {
            console.error('[ReserveRepository] Error deleting item:', e);
            return false;
        }
    }
};

window.ReserveRepository = ReserveRepository;
