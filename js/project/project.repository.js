/**
 * [MVVM : Project Repository]
 * Gère la persistance des projets dans IndexedDB.
 */

const ProjectRepository = {
    /**
     * Récupère tous les projets depuis IndexedDB.
     * @returns {Promise<Array>}
     */
    async getAll() {
        return await loadAllProjectsFromDB();
    },

    /**
     * Récupère un projet par son ID.
     * @param {number|string} id 
     * @returns {Promise<Object>}
     */
    async getById(id) {
        return await loadProjectFromDB(id);
    },

    /**
     * Sauvegarde un projet.
     * @param {Object} project 
     */
    async save(project) {
        return await saveProjectToDB(project);
    },

    /**
     * Supprime un projet.
     * @param {number|string} id 
     */
    async delete(id) {
        return await deleteProjectFromDB(id);
    },

    /**
     * Sauvegarde un réglage.
     * @param {string} key 
     * @param {any} value 
     */
    async saveSetting(key, value) {
        return await saveSetting(key, value);
    },

    /**
     * Charge un réglage.
     * @param {string} key 
     * @returns {Promise<any>}
     */
    async loadSetting(key) {
        return await loadSetting(key);
    }
};
