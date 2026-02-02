// ============================================
// INDEXEDDB FUNCTIONS
// ============================================

let db = null; // Instance de la base de données
let useLocalStorage = false; // Fallback si IndexedDB échoue

// Initialiser IndexedDB
// [MVVM : Model]
// Initialisation de la couche de données (Data Access Layer).
async function initDB() {
    try {
        console.log('🔧 Initialisation IndexedDB...');

        // Vérifier si IndexedDB est disponible
        if (!window.indexedDB) {
            console.warn('⚠️ IndexedDB non disponible, utilisation de localStorage');
            useLocalStorage = true;
            return true;
        }

        // Vérifier si idb est chargé
        if (typeof idb === 'undefined') {
            console.warn('⚠️ Bibliothèque idb non chargée, utilisation de localStorage');
            useLocalStorage = true;
            return true;
        }

        // Ouvrir (ou créer) la base de données
        db = await idb.openDB('PlumeDB', 1, {
            upgrade(db) {
                // Créer les object stores si ils n'existent pas
                if (!db.objectStoreNames.contains('projects')) {
                    db.createObjectStore('projects', { keyPath: 'id' });
                    console.log('✅ Object store "projects" créé');
                }
                if (!db.objectStoreNames.contains('settings')) {
                    db.createObjectStore('settings');
                    console.log('✅ Object store "settings" créé');
                }
            }
        });

        console.log('✅ IndexedDB initialisé avec succès');

        // Migrer depuis localStorage si nécessaire
        await migrateFromLocalStorage();

        return true;
    } catch (error) {
        console.error('❌ Erreur initialisation IndexedDB:', error);
        console.warn('⚠️ Fallback vers localStorage');
        useLocalStorage = true;
        return true; // Retourne true pour continuer avec localStorage
    }
}

// [MVVM : Model]
// Logique de migration de données.
async function migrateFromLocalStorage() {
    try {
        // Vérifier si migration déjà effectuée
        const migrated = await db.get('settings', 'migrated_from_localStorage');
        if (migrated) {
            console.log('✅ Migration déjà effectuée précédemment');
            return;
        }

        console.log('🔄 Vérification des données localStorage...');

        // Récupérer les anciennes données
        const oldData = localStorage.getItem('novelcraft_project');
        const oldProjects = localStorage.getItem('novelcraft_projects');
        const oldCurrentId = localStorage.getItem('novelcraft_currentProjectId');
        const oldTreeState = localStorage.getItem('treeState');

        if (!oldData && !oldProjects) {
            console.log('ℹ️ Aucune donnée à migrer');
            await db.put('settings', true, 'migrated_from_localStorage');
            return;
        }

        console.log('📦 Migration des données...');

        // Migrer le projet actuel
        if (oldData) {
            try {
                const projectData = JSON.parse(oldData);

                // S'assurer qu'il a un ID
                if (!projectData.id) {
                    projectData.id = 'project_' + Date.now();
                }

                // S'assurer qu'il a des timestamps
                if (!projectData.createdAt) {
                    projectData.createdAt = Date.now();
                }
                if (!projectData.updatedAt) {
                    projectData.updatedAt = Date.now();
                }

                await db.put('projects', projectData);
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
                    // Éviter les doublons
                    const existing = await db.get('projects', proj.id);
                    if (!existing) {
                        await db.put('projects', proj);
                        console.log('✅ Projet migré:', proj.title);
                    }
                }
            } catch (e) {
                console.error('❌ Erreur migration liste projets:', e);
            }
        }

        // Migrer les settings
        if (oldCurrentId) {
            await db.put('settings', oldCurrentId, 'currentProjectId');
        }
        if (oldTreeState) {
            await db.put('settings', oldTreeState, 'treeState');
        }

        // Marquer la migration comme effectuée
        await db.put('settings', true, 'migrated_from_localStorage');

        console.log('✅ Migration terminée avec succès !');
        console.log('ℹ️ Les anciennes données localStorage sont conservées par sécurité');

        // NE PAS supprimer localStorage pour l'instant (sécurité)
        // L'utilisateur pourra le faire manuellement plus tard

    } catch (error) {
        console.error('❌ Erreur lors de la migration:', error);
    }
}

// Sauvegarder un projet dans IndexedDB
// [MVVM : Model]
// Persistance des données (Create/Update).
async function saveProjectToDB(projectData) {
    try {
        if (!db) {
            console.error('❌ Base de données non initialisée');
            return false;
        }

        // S'assurer que le projet a un ID
        if (!projectData.id) {
            projectData.id = 'project_' + Date.now();
        }

        // Mettre à jour le timestamp
        projectData.updatedAt = Date.now();

        // Sauvegarder dans IndexedDB
        await db.put('projects', projectData);

        console.log('💾 Projet sauvegardé dans IndexedDB:', projectData.title);
        return true;
    } catch (error) {
        console.error('❌ Erreur sauvegarde IndexedDB:', error);
        alert('Erreur lors de la sauvegarde. Veuillez exporter votre projet par sécurité.');
        return false;
    }
}

// Charger un projet depuis IndexedDB
// [MVVM : Model]
// Récupération de données (Read).
async function loadProjectFromDB(projectId) {
    try {
        if (!db) {
            console.error('❌ Base de données non initialisée');
            return null;
        }

        const projectData = await db.get('projects', projectId);

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

// Charger tous les projets
// [MVVM : Model]
// Récupération de collection (Read All).
async function loadAllProjectsFromDB() {
    try {
        if (!db) {
            console.error('❌ Base de données non initialisée');
            return [];
        }

        const allProjects = await db.getAll('projects');
        console.log(`📚 ${allProjects.length} projet(s) chargé(s)`);
        return allProjects;
    } catch (error) {
        console.error('❌ Erreur chargement projets:', error);
        return [];
    }
}

// Supprimer un projet
// [MVVM : Model]
// Suppression de données (Delete).
async function deleteProjectFromDB(projectId) {
    try {
        if (!db) {
            console.error('❌ Base de données non initialisée');
            return false;
        }

        await db.delete('projects', projectId);
        console.log('🗑️ Projet supprimé:', projectId);
        return true;
    } catch (error) {
        console.error('❌ Erreur suppression projet:', error);
        return false;
    }
}

// Obtenir la taille totale utilisée par IndexedDB
// [MVVM : Model]
// Métadonnées sur les données.
async function getIndexedDBSize() {
    try {
        if (!db) return 0;

        const allProjects = await db.getAll('projects');
        const allSettings = await db.getAll('settings');

        // Calculer la taille approximative
        const projectsSize = JSON.stringify(allProjects).length * 2; // UTF-16
        const settingsSize = JSON.stringify(allSettings).length * 2;

        return projectsSize + settingsSize;
    } catch (error) {
        console.error('❌ Erreur calcul taille IndexedDB:', error);
        return 0;
    }
}

// Sauvegarder un setting
// [MVVM : Model]
// Persistance de configuration.
async function saveSetting(key, value) {
    try {
        if (!db) return false;
        await db.put('settings', value, key);
        return true;
    } catch (error) {
        console.error('❌ Erreur sauvegarde setting:', error);
        return false;
    }
}

// Charger un setting
// [MVVM : Model]
// Récupération de configuration.
async function loadSetting(key) {
    try {
        if (!db) return null;
        return await db.get('settings', key);
    } catch (error) {
        console.error('❌ Erreur chargement setting:', error);
        return null;
    }
}

// ============================================
// END INDEXEDDB FUNCTIONS
// ============================================
