/**
 * [MVVM : Thriller Board Repository]
 * Couche d'accès aux données pour toutes les entités du Thriller Board.
 */

// ============================================
// GLOBAL STATE
// ============================================

let thrillerBoardState = ThrillerBoardStateModel.createInitial();

// Flag pour l'écouteur global de socket
let socketEventListenerAttached = false;

// État du drag & drop
let cardDragState = {
    draggedCardId: null,
    sourceRowId: null,
    sourceColumnId: null,
    draggedElementId: null,
    isTreeviewDrag: false
};

// État de connexion en cours
let connectionState = {
    isDrawing: false,
    from: null,
    tempLine: null
};

// ============================================
// TYPE REPOSITORY
// ============================================

const ThrillerTypeRepository = {
    /**
     * Récupère tous les types personnalisés.
     * @returns {Array} Liste des types.
     */
    getCustomTypes: function () {
        return thrillerBoardState.customTypes || [];
    },

    /**
     * Récupère un type par son ID (système ou personnalisé).
     * @param {string} id - ID du type.
     * @returns {Object|null} La définition du type ou null.
     */
    getTypeDefinition: function (id) {
        // 1. Chercher dans les types personnalisés (priorité pour l'override)
        const customType = this.getCustomTypes().find(t => t.id === id);
        if (customType) {
            const systemType = THRILLER_TYPES[id];
            return {
                ...customType,
                isSystem: !!systemType, // Marquer comme système si ça override un type système
                isShadow: !!systemType // Internal flag
            };
        }

        // 2. Chercher dans les types système
        if (THRILLER_TYPES[id]) {
            return {
                id: id,
                ...THRILLER_TYPES[id],
                isSystem: true
            };
        }

        return null;
    },

    /**
     * Récupère tous les types (système + personnalisés).
     * @returns {Object} Map des types.
     */
    getAllTypes: function () {
        const types = { ...THRILLER_TYPES };

        this.getCustomTypes().forEach(ct => {
            types[ct.id] = ct;
        });

        return types;
    },

    /**
     * Ajoute un type personnalisé.
     * @param {Object} typeDef - Définition du type.
     * @returns {Object} Le type ajouté.
     */
    add: function (typeDef) {
        if (!thrillerBoardState.customTypes) {
            thrillerBoardState.customTypes = [];
        }

        // S'assurer que l'ID est unique
        if (this.getTypeDefinition(typeDef.id)) {
            return { error: 'Cet ID de type existe déjà' };
        }

        thrillerBoardState.customTypes.push(typeDef);
        this._syncToProject();
        return typeDef;
    },

    /**
     * Met à jour un type personnalisé.
     * @param {string} id - ID du type.
     * @param {Object} updates - Modifications.
     * @returns {Object} Le type mis à jour.
     */
    update: function (id, updates) {
        if (!thrillerBoardState.customTypes) thrillerBoardState.customTypes = [];

        const index = thrillerBoardState.customTypes.findIndex(t => t.id === id);

        // Si le type n'existe pas dans les custom types
        if (index === -1) {
            // Est-ce un type système qu'on veut surcharger ?
            if (THRILLER_TYPES[id]) {
                // On crée une entrée "Shadow"
                // On prend la définition de base du système et on applique les mises à jour
                const shadowType = {
                    id: id,
                    ...THRILLER_TYPES[id],
                    ...updates,
                    // On s'assure de ne pas sauvegarder les champs système hardcodés comme "fields" custom
                    // sauf si updates contient des fields
                };

                // Si les updates ne définissent pas de fields, on initialise à vide pour un type système
                // (car leurs champs sont gérés par le code hardcodé, on ajoute seulement des extras)
                if (!shadowType.fields) shadowType.fields = [];

                thrillerBoardState.customTypes.push(shadowType);
                this._syncToProject();
                return shadowType;
            }
            return null; // Type introuvable ni en custom ni en système
        }

        const updated = {
            ...thrillerBoardState.customTypes[index],
            ...updates
        };

        thrillerBoardState.customTypes[index] = updated;
        this._syncToProject();
        return updated;
    },

    /**
     * Supprime un type personnalisé.
     * @param {string} id - ID du type.
     * @returns {boolean} Succès.
     */
    remove: function (id) {
        if (!thrillerBoardState.customTypes) return false;

        // Vérifier si des éléments utilisent ce type
        const used = ThrillerElementRepository.getByType(id).length > 0;
        if (used) return { error: 'Ce type est utilisé par des éléments existants' };

        const initialLength = thrillerBoardState.customTypes.length;
        thrillerBoardState.customTypes = thrillerBoardState.customTypes.filter(t => t.id !== id);

        if (thrillerBoardState.customTypes.length !== initialLength) {
            this._syncToProject();
            return true;
        }
        return false;
    },

    /**
     * Synchronise l'état avec le projet global.
     * @private
     */
    _syncToProject: function () {
        if (typeof project !== 'undefined') {
            project.thrillerCustomTypes = thrillerBoardState.customTypes;
        }
    },

    /**
     * Charge les types depuis le projet.
     */
    loadFromProject: function () {
        if (typeof project !== 'undefined' && project.thrillerCustomTypes) {
            thrillerBoardState.customTypes = project.thrillerCustomTypes;
        }
    }
};

// ============================================
// ELEMENT REPOSITORY
// ============================================

const ThrillerElementRepository = {
    /**
     * Récupère tous les éléments.
     * @returns {Array} Liste des éléments.
     */
    getAll: function () {
        return thrillerBoardState.elements || [];
    },

    /**
     * Récupère un élément par son ID.
     * @param {string} id - ID de l'élément.
     * @returns {Object|null} L'élément ou null.
     */
    getById: function (id) {
        return this.getAll().find(el => el.id === id) || null;
    },

    /**
     * Récupère les éléments d'un type donné.
     * @param {string} type - Type d'élément.
     * @returns {Array} Liste des éléments filtrés.
     */
    getByType: function (type) {
        return this.getAll().filter(el => el.type === type);
    },

    /**
     * Ajoute un nouvel élément.
     * @param {Object} element - L'élément à ajouter.
     * @returns {Object} L'élément ajouté.
     */
    add: function (element) {
        if (!thrillerBoardState.elements) {
            thrillerBoardState.elements = [];
        }
        thrillerBoardState.elements.push(element);
        this._syncToProject();
        return element;
    },

    /**
     * Met à jour un élément existant.
     * @param {string} id - ID de l'élément.
     * @param {Object} updates - Données à mettre à jour.
     * @returns {Object|null} L'élément mis à jour ou null.
     */
    update: function (id, updates) {
        const index = thrillerBoardState.elements.findIndex(el => el.id === id);
        if (index === -1) return null;

        const updated = {
            ...thrillerBoardState.elements[index],
            ...updates,
            updatedAt: new Date().toISOString()
        };
        thrillerBoardState.elements[index] = updated;
        this._syncToProject();
        return updated;
    },

    /**
     * Supprime un élément.
     * @param {string} id - ID de l'élément.
     * @returns {Object|null} L'élément supprimé ou null.
     */
    remove: function (id) {
        const index = thrillerBoardState.elements.findIndex(el => el.id === id);
        if (index === -1) return null;

        const removed = thrillerBoardState.elements[index];
        thrillerBoardState.elements = thrillerBoardState.elements.filter(el => el.id !== id);
        this._syncToProject();
        return removed;
    },

    /**
     * Synchronise l'état avec le projet global.
     * @private
     */
    _syncToProject: function () {
        if (typeof project !== 'undefined') {
            project.thrillerElements = thrillerBoardState.elements;
        }
    },

    /**
     * Charge les éléments depuis le projet.
     */
    loadFromProject: function () {
        if (typeof project !== 'undefined' && project.thrillerElements) {
            thrillerBoardState.elements = project.thrillerElements;
        }
    }
};

// ============================================
// CARD REPOSITORY
// ============================================

const ThrillerCardRepository = {
    /**
     * Récupère toutes les cartes.
     * @returns {Array} Liste des cartes.
     */
    getAll: function () {
        return thrillerBoardState.gridConfig.cards || [];
    },

    /**
     * Récupère une carte par son ID.
     * @param {string} id - ID de la carte.
     * @returns {Object|null} La carte ou null.
     */
    getById: function (id) {
        return this.getAll().find(c => c.id === id) || null;
    },

    /**
     * Récupère les cartes d'une cellule.
     * @param {string} rowId - ID de la ligne.
     * @param {string} columnId - ID de la colonne.
     * @returns {Array} Liste des cartes.
     */
    getByCell: function (rowId, columnId) {
        return this.getAll().filter(c => c.rowId === rowId && c.columnId === columnId);
    },

    /**
     * Récupère les cartes liées à un élément.
     * @param {string} elementId - ID de l'élément.
     * @returns {Array} Liste des cartes.
     */
    getByElementId: function (elementId) {
        return this.getAll().filter(c => c.elementId === elementId);
    },

    /**
     * Calcule le zIndex maximum dans une cellule.
     * @param {string} rowId - ID de la ligne.
     * @param {string} columnId - ID de la colonne.
     * @returns {number} Le zIndex maximum.
     */
    getMaxZIndex: function (rowId, columnId) {
        const cellCards = this.getByCell(rowId, columnId);
        return cellCards.length > 0 ? Math.max(...cellCards.map(c => c.zIndex || 0), 0) : 0;
    },

    /**
     * Ajoute une nouvelle carte.
     * @param {Object} card - La carte à ajouter.
     * @returns {Object} La carte ajoutée.
     */
    add: function (card) {
        if (!thrillerBoardState.gridConfig.cards) {
            thrillerBoardState.gridConfig.cards = [];
        }
        thrillerBoardState.gridConfig.cards.push(card);
        this._syncToProject();
        return card;
    },

    /**
     * Met à jour une carte existante.
     * @param {string} id - ID de la carte.
     * @param {Object} updates - Données à mettre à jour.
     * @returns {Object|null} La carte mise à jour ou null.
     */
    update: function (id, updates) {
        const index = thrillerBoardState.gridConfig.cards.findIndex(c => c.id === id);
        if (index === -1) return null;

        const updated = {
            ...thrillerBoardState.gridConfig.cards[index],
            ...updates,
            updatedAt: new Date().toISOString()
        };
        thrillerBoardState.gridConfig.cards[index] = updated;
        this._syncToProject();
        return updated;
    },

    /**
     * Supprime une carte.
     * @param {string} id - ID de la carte.
     * @returns {Object|null} La carte supprimée ou null.
     */
    remove: function (id) {
        const index = thrillerBoardState.gridConfig.cards.findIndex(c => c.id === id);
        if (index === -1) return null;

        const removed = thrillerBoardState.gridConfig.cards[index];
        thrillerBoardState.gridConfig.cards = thrillerBoardState.gridConfig.cards.filter(c => c.id !== id);
        this._syncToProject();
        return removed;
    },

    /**
     * Déplace une carte vers une nouvelle cellule.
     * @param {string} id - ID de la carte.
     * @param {string} rowId - Nouvelle ligne.
     * @param {string} columnId - Nouvelle colonne.
     * @returns {Object|null} La carte mise à jour ou null.
     */
    moveToCell: function (id, rowId, columnId) {
        const maxZIndex = this.getMaxZIndex(rowId, columnId);
        return this.update(id, {
            rowId: rowId,
            columnId: columnId,
            zIndex: maxZIndex + 1
        });
    },

    /**
     * Met une carte au premier plan de sa cellule.
     * @param {string} id - ID de la carte.
     * @returns {Object|null} La carte mise à jour ou null.
     */
    bringToFront: function (id) {
        const card = this.getById(id);
        if (!card) return null;

        const maxZIndex = this.getMaxZIndex(card.rowId, card.columnId);
        return this.update(id, { zIndex: maxZIndex + 1 });
    },

    /**
     * Synchronise l'état avec le projet global.
     * @private
     */
    _syncToProject: function () {
        if (typeof project !== 'undefined') {
            project.thrillerGridConfig = project.thrillerGridConfig || {};
            project.thrillerGridConfig.cards = thrillerBoardState.gridConfig.cards;
        }
    },

    /**
     * Charge les cartes depuis le projet.
     */
    loadFromProject: function () {
        if (typeof project !== 'undefined' && project.thrillerGridConfig && project.thrillerGridConfig.cards) {
            thrillerBoardState.gridConfig.cards = project.thrillerGridConfig.cards;
        }
    }
};

// ============================================
// ROW REPOSITORY
// ============================================

const ThrillerRowRepository = {
    /**
     * Récupère toutes les lignes manuelles.
     * @returns {Array} Liste des lignes.
     */
    getManualRows: function () {
        return thrillerBoardState.gridConfig.rows || [];
    },

    /**
     * Génère les lignes automatiques depuis les personnages et lieux.
     * @returns {Array} Liste des lignes auto-générées.
     */
    getAutoRows: function () {
        const rows = [];

        // Lignes pour les personnages
        if (typeof project !== 'undefined' && project.characters) {
            project.characters.forEach(character => {
                if (character) {
                    rows.push(ThrillerRowModel.createFromCharacter(character));
                }
            });
        }

        // Lignes pour les lieux
        if (typeof project !== 'undefined' && project.locations) {
            project.locations.forEach(location => {
                if (location) {
                    rows.push(ThrillerRowModel.createFromLocation(location));
                }
            });
        }

        return rows;
    },

    /**
     * Récupère toutes les lignes (auto + manuelles).
     * @returns {Array} Liste complète des lignes.
     */
    getAll: function () {
        const autoRows = this.getAutoRows();
        const manualRows = this.getManualRows().filter(r => r.type !== 'character' && r.type !== 'location');
        return [...autoRows, ...manualRows];
    },

    /**
     * Récupère une ligne par son ID.
     * @param {string} id - ID de la ligne.
     * @returns {Object|null} La ligne ou null.
     */
    getById: function (id) {
        return this.getAll().find(r => r.id === id) || null;
    },

    /**
     * Ajoute une nouvelle ligne manuelle.
     * @param {Object} row - La ligne à ajouter.
     * @returns {Object} La ligne ajoutée.
     */
    add: function (row) {
        if (!thrillerBoardState.gridConfig.rows) {
            thrillerBoardState.gridConfig.rows = [];
        }
        thrillerBoardState.gridConfig.rows.push(row);
        this._syncToProject();
        return row;
    },

    /**
     * Met à jour une ligne existante.
     * @param {string} id - ID de la ligne.
     * @param {Object} updates - Données à mettre à jour.
     * @returns {Object|null} La ligne mise à jour ou null.
     */
    update: function (id, updates) {
        const index = thrillerBoardState.gridConfig.rows.findIndex(r => r.id === id);
        if (index === -1) return null;

        const updated = {
            ...thrillerBoardState.gridConfig.rows[index],
            ...updates
        };
        thrillerBoardState.gridConfig.rows[index] = updated;
        this._syncToProject();
        return updated;
    },

    /**
     * Supprime une ligne.
     * @param {string} id - ID de la ligne.
     * @returns {Object|null} La ligne supprimée ou null.
     */
    remove: function (id) {
        const index = thrillerBoardState.gridConfig.rows.findIndex(r => r.id === id);
        if (index === -1) return null;

        const removed = thrillerBoardState.gridConfig.rows[index];
        thrillerBoardState.gridConfig.rows = thrillerBoardState.gridConfig.rows.filter(r => r.id !== id);
        this._syncToProject();
        return removed;
    },

    /**
     * Synchronise l'état avec le projet global.
     * @private
     */
    _syncToProject: function () {
        if (typeof project !== 'undefined') {
            project.thrillerGridConfig = project.thrillerGridConfig || {};
            project.thrillerGridConfig.rows = thrillerBoardState.gridConfig.rows;
        }
    }
};

// ============================================
// COLUMN REPOSITORY
// ============================================

const ThrillerColumnRepository = {
    /**
     * Récupère les colonnes manuelles (mode libre).
     * @returns {Array} Liste des colonnes.
     */
    getManualColumns: function () {
        return thrillerBoardState.gridConfig.columns || [];
    },

    /**
     * Génère les colonnes narratives depuis la structure du projet.
     * @returns {Array} Liste des colonnes narratives.
     */
    getNarrativeColumns: function () {
        const columns = [ThrillerColumnModel.createUnassigned()];

        if (typeof project !== 'undefined' && project.acts && project.acts.length > 0) {
            project.acts.forEach(act => {
                if (act && act.chapters && act.chapters.length > 0) {
                    act.chapters.forEach(chapter => {
                        if (chapter && chapter.scenes && chapter.scenes.length > 0) {
                            chapter.scenes.forEach(scene => {
                                if (scene) {
                                    columns.push(ThrillerColumnModel.createFromScene(scene, act, chapter));
                                }
                            });
                        }
                    });
                }
            });
        }

        return columns.length > 1 ? columns : [
            ThrillerColumnModel.createUnassigned(),
            { id: 'default', title: 'Aucune scène', type: 'placeholder' }
        ];
    },

    /**
     * Récupère toutes les colonnes selon le mode actuel.
     * @returns {Array} Liste des colonnes.
     */
    getAll: function () {
        const mode = thrillerBoardState.gridConfig.columnMode;
        return mode === 'narrative' ? this.getNarrativeColumns() : this.getManualColumns();
    },

    /**
     * Récupère une colonne par son ID.
     * @param {string} id - ID de la colonne.
     * @returns {Object|null} La colonne ou null.
     */
    getById: function (id) {
        return this.getAll().find(c => c.id === id) || null;
    },

    /**
     * Ajoute une nouvelle colonne (mode libre uniquement).
     * @param {Object} column - La colonne à ajouter.
     * @returns {Object} La colonne ajoutée.
     */
    add: function (column) {
        if (!thrillerBoardState.gridConfig.columns) {
            thrillerBoardState.gridConfig.columns = [];
        }
        thrillerBoardState.gridConfig.columns.push(column);
        this._syncToProject();
        return column;
    },

    /**
     * Met à jour une colonne existante.
     * @param {string} id - ID de la colonne.
     * @param {Object} updates - Données à mettre à jour.
     * @returns {Object|null} La colonne mise à jour ou null.
     */
    update: function (id, updates) {
        const index = thrillerBoardState.gridConfig.columns.findIndex(c => c.id === id);
        if (index === -1) return null;

        const updated = {
            ...thrillerBoardState.gridConfig.columns[index],
            ...updates
        };
        thrillerBoardState.gridConfig.columns[index] = updated;
        this._syncToProject();
        return updated;
    },

    /**
     * Supprime une colonne.
     * @param {string} id - ID de la colonne.
     * @returns {Object|null} La colonne supprimée ou null.
     */
    remove: function (id) {
        const index = thrillerBoardState.gridConfig.columns.findIndex(c => c.id === id);
        if (index === -1) return null;

        const removed = thrillerBoardState.gridConfig.columns[index];
        thrillerBoardState.gridConfig.columns = thrillerBoardState.gridConfig.columns.filter(c => c.id !== id);
        this._syncToProject();
        return removed;
    },

    /**
     * Change le mode de colonnes.
     * @param {string} mode - 'free' ou 'narrative'.
     */
    setMode: function (mode) {
        thrillerBoardState.gridConfig.columnMode = mode;
        this._syncToProject();
    },

    /**
     * Récupère le mode de colonnes actuel.
     * @returns {string} Le mode.
     */
    getMode: function () {
        return thrillerBoardState.gridConfig.columnMode || 'free';
    },

    /**
     * Synchronise l'état avec le projet global.
     * @private
     */
    _syncToProject: function () {
        if (typeof project !== 'undefined') {
            project.thrillerGridConfig = project.thrillerGridConfig || {};
            project.thrillerGridConfig.columns = thrillerBoardState.gridConfig.columns;
            project.thrillerGridConfig.columnMode = thrillerBoardState.gridConfig.columnMode;
        }
    }
};

// ============================================
// CONNECTION REPOSITORY
// ============================================

const ThrillerConnectionRepository = {
    /**
     * Récupère toutes les connexions (canvas).
     * @returns {Array} Liste des connexions.
     */
    getCanvasConnections: function () {
        return thrillerBoardState.connections || [];
    },

    /**
     * Récupère toutes les connexions (grille).
     * @returns {Array} Liste des connexions.
     */
    getGridConnections: function () {
        return thrillerBoardState.gridConfig.connections || [];
    },

    /**
     * Récupère les connexions d'une carte.
     * @param {string} cardId - ID de la carte.
     * @returns {Array} Liste des connexions.
     */
    getByCardId: function (cardId) {
        return this.getGridConnections().filter(
            conn => conn.from.cardId === cardId || conn.to.cardId === cardId
        );
    },

    /**
     * Ajoute une connexion (grille).
     * @param {Object} connection - La connexion à ajouter.
     * @returns {Object} La connexion ajoutée.
     */
    addGridConnection: function (connection) {
        if (!thrillerBoardState.gridConfig.connections) {
            thrillerBoardState.gridConfig.connections = [];
        }
        thrillerBoardState.gridConfig.connections.push(connection);
        this._syncToProject();
        return connection;
    },

    /**
     * Supprime une connexion (grille).
     * @param {string} id - ID de la connexion.
     * @returns {Object|null} La connexion supprimée ou null.
     */
    removeGridConnection: function (id) {
        const connections = thrillerBoardState.gridConfig.connections || [];
        const index = connections.findIndex(c => c.id === id);
        if (index === -1) return null;

        const removed = connections[index];
        thrillerBoardState.gridConfig.connections = connections.filter(c => c.id !== id);
        this._syncToProject();
        return removed;
    },

    /**
     * Supprime toutes les connexions d'une carte.
     * @param {string} cardId - ID de la carte.
     */
    removeByCardId: function (cardId) {
        if (!thrillerBoardState.gridConfig.connections) return;
        thrillerBoardState.gridConfig.connections = thrillerBoardState.gridConfig.connections.filter(
            conn => conn.from.cardId !== cardId && conn.to.cardId !== cardId
        );
        this._syncToProject();
    },

    /**
     * Synchronise l'état avec le projet global.
     * @private
     */
    _syncToProject: function () {
        if (typeof project !== 'undefined') {
            project.thrillerConnections = thrillerBoardState.connections;
            project.thrillerGridConfig = project.thrillerGridConfig || {};
            project.thrillerGridConfig.connections = thrillerBoardState.gridConfig.connections;
        }
    },

    /**
     * Charge les connexions depuis le projet.
     */
    loadFromProject: function () {
        if (typeof project !== 'undefined') {
            if (project.thrillerConnections) {
                thrillerBoardState.connections = project.thrillerConnections;
            }
            if (project.thrillerGridConfig && project.thrillerGridConfig.connections) {
                thrillerBoardState.gridConfig.connections = project.thrillerGridConfig.connections;
            }
        }
    }
};

// ============================================
// STATE REPOSITORY
// ============================================

const ThrillerStateRepository = {
    /**
     * Récupère l'état complet du board.
     * @returns {Object} L'état.
     */
    getState: function () {
        return thrillerBoardState;
    },

    /**
     * Met à jour l'état.
     * @param {Object} updates - Propriétés à mettre à jour.
     */
    updateState: function (updates) {
        thrillerBoardState = { ...thrillerBoardState, ...updates };
    },

    /**
     * Récupère le mode de vue actuel.
     * @returns {string} 'canvas' ou 'grid'.
     */
    getViewMode: function () {
        return thrillerBoardState.viewMode || 'canvas';
    },

    /**
     * Définit le mode de vue.
     * @param {string} mode - 'canvas' ou 'grid'.
     */
    setViewMode: function (mode) {
        thrillerBoardState.viewMode = mode;
        localStorage.setItem('plume_thriller_view_mode', mode);
    },

    /**
     * Récupère le filtre actuel.
     * @returns {string} Le type de filtre.
     */
    getCurrentFilter: function () {
        return thrillerBoardState.currentFilter || 'clue';
    },

    /**
     * Définit le filtre.
     * @param {string} filter - Le type de filtre.
     */
    setCurrentFilter: function (filter) {
        thrillerBoardState.currentFilter = filter;
    },

    /**
     * Récupère les éléments sélectionnés.
     * @returns {Array} Liste des IDs sélectionnés.
     */
    getSelectedElements: function () {
        return thrillerBoardState.selectedElements || [];
    },

    /**
     * Définit les éléments sélectionnés.
     * @param {Array} ids - Liste des IDs.
     */
    setSelectedElements: function (ids) {
        thrillerBoardState.selectedElements = ids;
    },

    /**
     * Initialise l'état depuis le projet.
     */
    initFromProject: function () {
        if (typeof project === 'undefined') return;

        // Initialiser les tableaux s'ils n'existent pas
        if (!project.thrillerElements) project.thrillerElements = [];
        if (!project.thrillerConnections) project.thrillerConnections = [];
        if (!project.thrillerGridConfig) {
            project.thrillerGridConfig = {
                columnMode: 'free',
                rows: [],
                columns: [],
                cards: [],
                connections: []
            };
        }
        if (!project.thrillerCustomTypes) project.thrillerCustomTypes = [];

        // Charger dans l'état local
        thrillerBoardState.elements = project.thrillerElements;
        thrillerBoardState.connections = project.thrillerConnections;
        thrillerBoardState.gridConfig = project.thrillerGridConfig;
        thrillerBoardState.customTypes = project.thrillerCustomTypes;

        // Restaurer le mode de vue depuis localStorage
        const savedViewMode = localStorage.getItem('plume_thriller_view_mode');
        if (savedViewMode) {
            thrillerBoardState.viewMode = savedViewMode;
        }
    }
};
