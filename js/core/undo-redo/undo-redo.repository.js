/**
 * [MVVM : Repository]
 * Gestion du stockage de l'historique et des snapshots
 */

const UndoRedoRepository = {
    _lastSnapshot: null,

    /**
     * Crée un snapshot complet de l'état actuel
     * @param {string} label - Libellé de l'action
     * @returns {UndoRedoSnapshot|null}
     */
    createSnapshot(label = 'Action') {
        if (typeof project === 'undefined') {
            console.warn('[UndoRedo] project non defini');
            return null;
        }

        const projectState = UndoRedoModel.deepClone(project);
        const navigationState = {
            currentActId: typeof currentActId !== 'undefined' ? currentActId : null,
            currentChapterId: typeof currentChapterId !== 'undefined' ? currentChapterId : null,
            currentSceneId: typeof currentSceneId !== 'undefined' ? currentSceneId : null
        };

        let thrillerState = null;
        if (typeof thrillerBoardState !== 'undefined') {
            thrillerState = UndoRedoModel.deepClone(thrillerBoardState);
        }

        return new UndoRedoSnapshot(label, projectState, navigationState, thrillerState);
    },

    /**
     * Sauvegarde l'état actuel comme étant le dernier snapshot de référence
     */
    initLastSnapshot() {
        if (typeof project !== 'undefined' && project.id) {
            this._lastSnapshot = this.createSnapshot('Initial State');
        }
    },

    /**
     * Applique un snapshot à l'état global de l'application
     * @param {UndoRedoSnapshot} snapshot 
     * @param {boolean} restoreNavigation 
     */
    restoreSnapshot(snapshot, restoreNavigation = false) {
        if (!snapshot || !snapshot.project) {
            console.warn('[UndoRedo] Snapshot invalide');
            return;
        }

        // Marquer qu'on est en train de faire un undo/redo
        window.isUndoRedoAction = true;

        try {
            // Restaurer le projet
            const restoredProject = UndoRedoModel.deepClone(snapshot.project);

            // Copier toutes les proprietes (important de garder la meme reference d'objet 'project')
            Object.keys(project).forEach(key => {
                if (restoredProject.hasOwnProperty(key)) {
                    project[key] = restoredProject[key];
                }
            });

            // S'assurer que toutes les nouvelles proprietes sont aussi copiees
            Object.keys(restoredProject).forEach(key => {
                project[key] = restoredProject[key];
            });

            // Restaurer l'etat du thriller board si present
            if (snapshot.thrillerBoardState && typeof thrillerBoardState !== 'undefined') {
                const restoredThrillerState = UndoRedoModel.deepClone(snapshot.thrillerBoardState);
                Object.keys(restoredThrillerState).forEach(key => {
                    thrillerBoardState[key] = restoredThrillerState[key];
                });
            }

            // Restaurer la navigation si demande
            if (restoreNavigation && snapshot.navigation) {
                if (typeof currentActId !== 'undefined') {
                    window.currentActId = snapshot.navigation.currentActId;
                }
                if (typeof currentChapterId !== 'undefined') {
                    window.currentChapterId = snapshot.navigation.currentChapterId;
                }
                if (typeof currentSceneId !== 'undefined') {
                    window.currentSceneId = snapshot.navigation.currentSceneId;
                }
            }

            // Mettre à jour le dernier snapshot de référence
            this._lastSnapshot = snapshot;

        } finally {
            window.isUndoRedoAction = false;
        }
    },

    /**
     * Intègre l'Undo/Redo dans un repository spécifique
     */
    /**
     * Intègre l'Undo/Redo dans un repository spécifique
     * @param {Object} repository - Le repository
     * @param {string} name - Nom pour les logs
     * @param {Object} customMethods - Méthodes supplémentaires { immediate: [], debounced: [] }
     */
    integrateWithRepository(repository, name, customMethods = {}) {
        const methodsToWrap = {
            // Methodes avec sauvegarde immediate
            immediate: [
                'add', 'remove', 'delete', 'create', 'reorder', 'move', 'moveToCell', 'update',
                'duplicate', 'convertToItem', 'addCategory', 'toggleCategoryCollapse'
            ],
            // Methodes avec debounce
            debounced: ['set', 'save']
        };

        // Ajouter les méthodes custom
        if (customMethods.immediate) {
            methodsToWrap.immediate.push(...customMethods.immediate);
        }
        if (customMethods.debounced) {
            methodsToWrap.debounced.push(...customMethods.debounced);
        }

        // Wrapper les methodes immediates
        methodsToWrap.immediate.forEach(method => {
            if (typeof repository[method] === 'function') {
                const original = repository[method].bind(repository);
                repository[method] = function (...args) {
                    const result = original(...args);
                    UndoRedoViewModel.saveToHistoryImmediate(`${name}.${method}`);
                    return result;
                };
            }
        });

        // Wrapper les methodes debounced
        methodsToWrap.debounced.forEach(method => {
            if (typeof repository[method] === 'function') {
                const original = repository[method].bind(repository);
                repository[method] = function (...args) {
                    const result = original(...args);
                    UndoRedoViewModel.saveToHistory(`${name}.${method}`);
                    return result;
                };
            }
        });
    },

    /**
     * Intègre l'Undo/Redo dans tous les repositories connus
     */
    integrateWithAllRepositories() {
        const integrate = (repo, name, customs) => {
            try {
                if (typeof repo !== 'undefined' && repo !== null) {
                    this.integrateWithRepository(repo, name, customs);
                }
            } catch (e) {
                console.error(`[UndoRedo] Erreur d'integration pour ${name}:`, e);
            }
        };

        // On appelle integrate pour chaque repository existant
        integrate(window.ActRepository, 'Act');
        integrate(window.ChapterRepository, 'Chapter');
        integrate(window.SceneRepository, 'Scene');
        integrate(window.CharacterRepository, 'Character');
        integrate(window.WorldRepository, 'World');
        integrate(window.CodexRepository, 'Codex');
        integrate(window.PlotGridRepository, 'PlotGrid');
        integrate(window.mindmapRepository, 'Mindmap', { immediate: ['generateAutoMindmap', 'addNode', 'deleteNode', 'addLink', 'updateLink', 'deleteLink'] });

        // Arc Board Repositories
        integrate(window.ArcRepository, 'Arc');
        integrate(window.BoardItemRepository, 'BoardItem');
        integrate(window.CardRepository, 'Card');
        integrate(window.ConnectionRepository, 'Connection');
        integrate(window.InterArcConnectionRepository, 'InterArcConnection');

        integrate(window.InvestigationStore, 'Investigation', {
            immediate: ['setActiveCase', 'createCase', 'updateCase', 'deleteCase', 'addFact', 'updateFact', 'deleteFact', 'setKnowledgeState', 'updateSuspectLink'],
            debounced: []
        });

        // Nouvelles intégrations
        integrate(window.mapRepository, 'Map', {
            immediate: ['addMap', 'updateMap', 'deleteMap', 'addLocation', 'updateLocation', 'deleteLocation', 'addCategory', 'addType', 'updateType', 'deleteType']
        });
        integrate(window.relationMapRepository, 'RelationMap', {
            immediate: ['addRelation', 'updateRelation', 'deleteRelation', 'updateCharacterPosition', 'resetAllPositions', 'setAllPositions', 'saveCustomRelationType', 'deleteCustomRelationType']
        });
        integrate(window.sceneNavigationRepository, 'SceneNavigation', {
            immediate: ['updateSceneContent']
        });
        integrate(window.CorkBoardRepository, 'CorkBoard', {
            immediate: ['updateSceneSynopsis', 'updateSceneColor', 'reorderScenes', 'createAct', 'createChapter', 'createScene']
        });
        integrate(window.GlobalNotesRepository, 'GlobalNotes', {
            immediate: ['saveBoard', 'saveItem', 'deleteBoard', 'deleteItem', 'moveToColumn', 'reorderInColumn', 'removeFromColumn']
        });

        console.log('[UndoRedo] Integration avec tous les repositories effectuee');
    }
};
