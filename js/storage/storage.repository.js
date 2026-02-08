/**
 * Repository pour le module Storage
 * Gère les interactions directes avec IndexedDB via la librairie 'idb'.
 */
class StorageRepository {
    constructor() {
        this.db = null;
        this.useLocalStorage = false;
        this.dbPromise = null; // Pour éviter les conditions de course sur init
    }

    /**
     * Initialise la base de données IndexedDB.
     * @returns {Promise<boolean>}
     */
    async initDB() {
        if (this.dbPromise) return this.dbPromise;

        this.dbPromise = (async () => {
            try {
                console.log('🔧 Initialisation Repository IndexedDB...');

                if (!window.indexedDB) {
                    console.warn('⚠️ IndexedDB non disponible, utilisation de localStorage');
                    this.useLocalStorage = true;
                    return true;
                }

                if (typeof idb === 'undefined') {
                    console.warn('⚠️ Bibliothèque idb non chargée, utilisation de localStorage');
                    this.useLocalStorage = true;
                    return true;
                }

                this.db = await idb.openDB(StorageModel.DB_NAME, StorageModel.DB_VERSION, {
                    upgrade(db) {
                        if (!db.objectStoreNames.contains(StorageModel.STORES.PROJECTS)) {
                            db.createObjectStore(StorageModel.STORES.PROJECTS, { keyPath: StorageModel.KEYS.PROJECT_ID });
                            console.log('✅ Object store "projects" créé');
                        }
                        if (!db.objectStoreNames.contains(StorageModel.STORES.SETTINGS)) {
                            db.createObjectStore(StorageModel.STORES.SETTINGS);
                            console.log('✅ Object store "settings" créé');
                        }
                    }
                });

                console.log('✅ IndexedDB Repository initialisé avec succès');

                // Mettre à jour window.db pour la compatibilité (sera géré par main.js aussi via getter, mais bon)
                // this.db est maintenant défini.

                await this.migrateFromLocalStorage();
                return true;

            } catch (error) {
                console.error('❌ Erreur initialisation IndexedDB:', error);
                console.warn('⚠️ Fallback vers localStorage');
                this.useLocalStorage = true;
                return true;
            }
        })();

        return this.dbPromise;
    }

    /**
     * Migre les données depuis localStorage vers IndexedDB.
     */
    async migrateFromLocalStorage() {
        if (!this.db) return;

        try {
            const migrated = await this.db.get(StorageModel.STORES.SETTINGS, StorageModel.KEYS.MIGRATED);
            if (migrated) {
                console.log('✅ Migration déjà effectuée précédemment');
                return;
            }

            console.log('🔄 Vérification des données localStorage...');

            const oldData = localStorage.getItem('novelcraft_project');
            const oldProjects = localStorage.getItem('novelcraft_projects');
            const oldCurrentId = localStorage.getItem('novelcraft_currentProjectId');
            const oldTreeState = localStorage.getItem('treeState');

            if (!oldData && !oldProjects) {
                console.log('ℹ️ Aucune donnée à migrer');
                await this.db.put(StorageModel.STORES.SETTINGS, true, StorageModel.KEYS.MIGRATED);
                return;
            }

            console.log('📦 Migration des données...');

            // Migrer le projet actuel
            if (oldData) {
                try {
                    const projectData = JSON.parse(oldData);
                    if (!projectData.id) projectData.id = 'project_' + Date.now();
                    if (!projectData.createdAt) projectData.createdAt = Date.now();
                    if (!projectData.updatedAt) projectData.updatedAt = Date.now();

                    await this.db.put(StorageModel.STORES.PROJECTS, projectData);
                    console.log('✅ Projet principal migré:', projectData.title);
                } catch (e) {
                    console.error('❌ Erreur migration projet:', e);
                }
            }

            // Migrer la liste des projets
            if (oldProjects) {
                try {
                    const projectsList = JSON.parse(oldProjects);
                    for (const proj of projectsList) {
                        const existing = await this.db.get(StorageModel.STORES.PROJECTS, proj.id);
                        if (!existing) {
                            await this.db.put(StorageModel.STORES.PROJECTS, proj);
                            console.log('✅ Projet migré:', proj.title);
                        }
                    }
                } catch (e) {
                    console.error('❌ Erreur migration liste projets:', e);
                }
            }

            // Migrer les settings
            if (oldCurrentId) await this.db.put(StorageModel.STORES.SETTINGS, oldCurrentId, StorageModel.KEYS.CURRENT_PROJECT_ID);
            if (oldTreeState) await this.db.put(StorageModel.STORES.SETTINGS, oldTreeState, StorageModel.KEYS.TREE_STATE);

            await this.db.put(StorageModel.STORES.SETTINGS, true, StorageModel.KEYS.MIGRATED);

            console.log('✅ Migration terminée avec succès !');
            console.log('ℹ️ Les anciennes données localStorage sont conservées par sécurité');

        } catch (error) {
            console.error('❌ Erreur lors de la migration:', error);
        }
    }

    /**
     * Sauvegarde un projet.
     * @param {Object} projectData 
     * @returns {Promise<boolean>}
     */
    async saveProject(projectData) {
        try {
            if (!this.db) {
                console.error('❌ Base de données non initialisée');
                return false;
            }

            if (!projectData.id) {
                projectData.id = 'project_' + Date.now();
            }
            projectData.updatedAt = Date.now();

            await this.db.put(StorageModel.STORES.PROJECTS, projectData);
            console.log('💾 Projet sauvegardé dans IndexedDB:', projectData.title);
            return true;
        } catch (error) {
            console.error('❌ Erreur sauvegarde IndexedDB:', error);
            throw error; // La vue gérera l'erreur utilisateur
        }
    }

    /**
     * Charge un projet par son ID.
     * @param {string} projectId 
     * @returns {Promise<Object|null>}
     */
    async loadProject(projectId) {
        try {
            if (!this.db) {
                console.error('❌ Base de données non initialisée');
                return null;
            }

            const projectData = await this.db.get(StorageModel.STORES.PROJECTS, projectId);
            if (projectData) {
                console.log('📖 Projet chargé depuis IndexedDB:', projectData.title);
                return projectData;
            } else {
                console.log('ℹ️ Projet non trouvé:', projectId);
                return null;
            }
        } catch (error) {
            console.error('❌ Erreur chargement IndexedDB:', error);
            return null;
        }
    }

    /**
     * Charge tous les projets.
     * @returns {Promise<Array>}
     */
    async loadAllProjects() {
        try {
            if (!this.db) {
                console.error('❌ Base de données non initialisée');
                return [];
            }
            const allProjects = await this.db.getAll(StorageModel.STORES.PROJECTS);
            console.log(`📚 ${allProjects.length} projet(s) chargé(s)`);
            return allProjects;
        } catch (error) {
            console.error('❌ Erreur chargement projets:', error);
            return [];
        }
    }

    /**
     * Supprime un projet.
     * @param {string} projectId 
     * @returns {Promise<boolean>}
     */
    async deleteProject(projectId) {
        try {
            if (!this.db) {
                console.error('❌ Base de données non initialisée');
                return false;
            }
            await this.db.delete(StorageModel.STORES.PROJECTS, projectId);
            console.log('🗑️ Projet supprimé:', projectId);
            return true;
        } catch (error) {
            console.error('❌ Erreur suppression projet:', error);
            return false;
        }
    }

    /**
     * Calcule la taille de la base de données.
     * @returns {Promise<number>}
     */
    async getIndexedDBSize() {
        try {
            if (!this.db) return 0;

            const allProjects = await this.db.getAll(StorageModel.STORES.PROJECTS);
            const allSettings = await this.db.getAll(StorageModel.STORES.SETTINGS);

            const projectsSize = JSON.stringify(allProjects).length * 2;
            const settingsSize = JSON.stringify(allSettings).length * 2;

            return projectsSize + settingsSize;
        } catch (error) {
            console.error('❌ Erreur calcul taille IndexedDB:', error);
            return 0;
        }
    }

    /**
     * Sauvegarde un paramètre.
     * @param {string} key 
     * @param {*} value 
     * @returns {Promise<boolean>}
     */
    async saveSetting(key, value) {
        try {
            if (!this.db) return false;
            await this.db.put(StorageModel.STORES.SETTINGS, value, key);
            return true;
        } catch (error) {
            console.error('❌ Erreur sauvegarde setting:', error);
            return false;
        }
    }

    /**
     * Charge un paramètre.
     * @param {string} key 
     * @returns {Promise<*>}
     */
    async loadSetting(key) {
        try {
            if (!this.db) return null;
            return await this.db.get(StorageModel.STORES.SETTINGS, key);
        } catch (error) {
            console.error('❌ Erreur chargement setting:', error);
            return null;
        }
    }
}
