/**
 * Modèle de données pour le module Storage
 * Définit la structure de la base de données et les constantes.
 */
class StorageModel {
    static DB_NAME = 'PlumeDB';
    static DB_VERSION = 1;

    static STORES = {
        PROJECTS: 'projects',
        SETTINGS: 'settings'
    };

    static KEYS = {
        PROJECT_ID: 'id',
        MIGRATED: 'migrated_from_localStorage',
        CURRENT_PROJECT_ID: 'currentProjectId',
        TREE_STATE: 'treeState'
    };

    // Estructure par défaut pour un projet si nécessaire
    static createDefaultProject(id) {
        const now = Date.now();
        return {
            id: id || 'project_' + now,
            createdAt: now,
            updatedAt: now
        };
    }
}
