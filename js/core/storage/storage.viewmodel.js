/**
 * ViewModel pour le module Storage
 * Fait le lien entre le Repository et la Vue/Application.
 */
class StorageViewModel {
    constructor(repository, view) {
        this.repository = repository;
        this.view = view;
    }

    /**
     * Initialise le stockage.
     * @returns {Promise<boolean>}
     */
    async init() {
        return this.repository.initDB();
    }

    /**
     * Sauvegarde un projet et gère les erreurs UI.
     * @param {Object} projectData 
     * @returns {Promise<boolean>}
     */
    async saveProject(projectData) {
        try {
            return await this.repository.saveProject(projectData);
        } catch (error) {
            this.view.showError(Localization.t('storage.error.save'));
            return false;
        }
    }

    // Proxy methods
    async loadProject(projectId) {
        return this.repository.loadProject(projectId);
    }

    async loadAllProjects() {
        return this.repository.loadAllProjects();
    }

    async deleteProject(projectId) {
        return this.repository.deleteProject(projectId);
    }

    async getIndexedDBSize() {
        return this.repository.getIndexedDBSize();
    }

    async saveSetting(key, value) {
        return this.repository.saveSetting(key, value);
    }

    async loadSetting(key) {
        return this.repository.loadSetting(key);
    }

    async migrateFromLocalStorage() {
        return this.repository.migrateFromLocalStorage();
    }
}
