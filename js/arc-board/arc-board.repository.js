// ============================================
// ARC BOARD - Repository (CRUD Operations)
// ============================================

/**
 * Repository pour les opérations CRUD sur les Arcs
 */
const ArcRepository = {
    /**
     * Initialise les structures de données si nécessaires
     */
    init() {
        if (!project.arcCategories) {
            project.arcCategories = {};
        }
        if (!project.narrativeArcs) {
            project.narrativeArcs = [];
        }
        if (!project.collapsedArcCategories) {
            project.collapsedArcCategories = [];
        }
    },

    /**
     * Récupère tous les arcs
     */
    getAll() {
        this.init();
        return project.narrativeArcs || [];
    },

    /**
     * Récupère un arc par son ID
     */
    getById(arcId) {
        return this.getAll().find(arc => arc.id === arcId) || null;
    },

    /**
     * Crée un nouvel arc
     */
    create(data) {
        this.init();
        const arc = createArcModel(data);
        project.narrativeArcs.push(arc);
        this._save();
        return arc;
    },

    /**
     * Met à jour un arc existant
     */
    update(arcId, data) {
        const arc = this.getById(arcId);
        if (!arc) return null;

        Object.assign(arc, data, { updated: new Date().toISOString() });
        this._save();
        return arc;
    },

    /**
     * Supprime un arc
     */
    delete(arcId) {
        this.init();
        const index = project.narrativeArcs.findIndex(a => a.id === arcId);
        if (index === -1) return false;

        project.narrativeArcs.splice(index, 1);
        this._save();
        return true;
    },

    /**
     * Duplique un arc
     */
    duplicate(arcId) {
        const arc = this.getById(arcId);
        if (!arc) return null;

        const newArc = JSON.parse(JSON.stringify(arc));
        newArc.id = generateUniqueId('arc');
        newArc.title = arc.title + ' (copie)';
        newArc.created = new Date().toISOString();
        newArc.updated = new Date().toISOString();

        // Régénérer les IDs
        const idMap = {};
        newArc.board.items.forEach(item => {
            const oldId = item.id;
            item.id = generateUniqueId('item');
            idMap[oldId] = item.id;

            if (item.cards) {
                item.cards.forEach(card => {
                    card.id = generateUniqueId('card');
                });
            }
        });

        if (newArc.board.connections) {
            newArc.board.connections.forEach(conn => {
                conn.id = generateUniqueId('conn');
                conn.from = idMap[conn.from] || conn.from;
                conn.to = idMap[conn.to] || conn.to;
            });
        }

        project.narrativeArcs.push(newArc);
        this._save();
        return newArc;
    },

    /**
     * Récupère toutes les catégories (prédéfinies + custom)
     */
    getAllCategories() {
        this.init();
        return { ...ArcCategories, ...project.arcCategories };
    },

    /**
     * Ajoute une catégorie custom
     */
    addCategory(name, color) {
        this.init();
        const key = name.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_');
        project.arcCategories[key] = createCategoryModel(name, color);
        this._save();
        return key;
    },

    /**
     * Toggle l'état collapsed d'une catégorie
     */
    toggleCategoryCollapse(categoryKey) {
        this.init();
        const index = project.collapsedArcCategories.indexOf(categoryKey);
        if (index === -1) {
            project.collapsedArcCategories.push(categoryKey);
        } else {
            project.collapsedArcCategories.splice(index, 1);
        }
        this._save();
    },

    /**
     * Vérifie si une catégorie est collapsed
     */
    isCategoryCollapsed(categoryKey) {
        return project.collapsedArcCategories?.includes(categoryKey) || false;
    },

    _save() {
        if (typeof saveProject === 'function') {
            saveProject();
        }
    }
};

/**
 * Repository pour les opérations CRUD sur les Items du Board
 */
const BoardItemRepository = {
    /**
     * Récupère tous les items d'un arc
     */
    getAll(arcId) {
        const arc = ArcRepository.getById(arcId);
        return arc?.board?.items || [];
    },

    /**
     * Récupère un item par son ID
     */
    getById(arcId, itemId) {
        return this.getAll(arcId).find(item => item.id === itemId) || null;
    },

    /**
     * Crée un nouvel item
     */
    create(arcId, type, position, data = {}) {
        const arc = ArcRepository.getById(arcId);
        if (!arc) return null;

        if (!arc.board) arc.board = createBoardModel();

        const item = createBoardItemModel(type, position, data);
        arc.board.items.push(item);
        this._save();
        return item;
    },

    /**
     * Met à jour un item
     */
    update(arcId, itemId, data) {
        const item = this.getById(arcId, itemId);
        if (!item) return null;

        Object.assign(item, data);
        this._save();
        return item;
    },

    /**
     * Met à jour la position d'un item
     */
    updatePosition(arcId, itemId, x, y) {
        return this.update(arcId, itemId, { x, y });
    },

    /**
     * Supprime un item
     */
    delete(arcId, itemId) {
        const arc = ArcRepository.getById(arcId);
        if (!arc?.board?.items) return false;

        const index = arc.board.items.findIndex(i => i.id === itemId);
        if (index === -1) return false;

        // Récupérer l'item avant suppression pour gérer le cas des items scene
        const item = arc.board.items[index];

        // Si c'est un item scene, retirer complètement de la scenePresence
        // Cela permet de mettre à jour la vue Structure > Arcs
        if (item.type === 'scene' && item.sceneId && arc.scenePresence) {
            arc.scenePresence = arc.scenePresence.filter(p => p.sceneId != item.sceneId);
        }

        arc.board.items.splice(index, 1);

        // Supprimer les connexions liées
        if (arc.board.connections) {
            arc.board.connections = arc.board.connections.filter(
                c => c.from !== itemId && c.to !== itemId
            );
        }

        this._save();
        return true;
    },

    _save() {
        if (typeof saveProject === 'function') {
            saveProject();
        }
    }
};

/**
 * Repository pour les opérations CRUD sur les Cartes
 */
const CardRepository = {
    /**
     * Récupère toutes les cartes d'une colonne
     */
    getAll(arcId, columnId) {
        const column = BoardItemRepository.getById(arcId, columnId);
        return column?.cards || [];
    },

    /**
     * Récupère une carte par son ID
     */
    getById(arcId, columnId, cardId) {
        return this.getAll(arcId, columnId).find(card => card.id === cardId) || null;
    },

    /**
     * Trouve une carte dans tout le board (retourne { column, card, index })
     */
    findInBoard(arcId, cardId) {
        const items = BoardItemRepository.getAll(arcId);
        for (const item of items) {
            if (item.type === 'column' && item.cards) {
                const index = item.cards.findIndex(c => c.id === cardId);
                if (index !== -1) {
                    return { column: item, card: item.cards[index], index };
                }
            }
        }
        return null;
    },

    /**
     * Crée une nouvelle carte
     */
    create(arcId, columnId, type, data = {}) {
        const column = BoardItemRepository.getById(arcId, columnId);
        if (!column || column.type !== 'column') return null;

        if (!column.cards) column.cards = [];

        const card = createCardModel(type, data);
        column.cards.push(card);
        this._save();
        return card;
    },

    /**
     * Met à jour une carte
     */
    update(arcId, columnId, cardId, data) {
        const card = this.getById(arcId, columnId, cardId);
        if (!card) return null;

        Object.assign(card, data);
        this._save();
        return card;
    },

    /**
     * Supprime une carte
     */
    delete(arcId, columnId, cardId) {
        const column = BoardItemRepository.getById(arcId, columnId);
        if (!column?.cards) return false;

        const index = column.cards.findIndex(c => c.id === cardId);
        if (index === -1) return false;

        // Récupérer la carte avant suppression pour gérer le cas des cartes scene
        const card = column.cards[index];

        // Si c'est une carte scene, retirer complètement de la scenePresence
        // Cela permet de mettre à jour la vue Structure > Arcs
        if (card.type === 'scene' && card.sceneId) {
            const arc = ArcRepository.getById(arcId);
            if (arc && arc.scenePresence) {
                arc.scenePresence = arc.scenePresence.filter(p => p.sceneId != card.sceneId);
            }
        }

        column.cards.splice(index, 1);
        this._save();
        return true;
    },

    /**
     * Déplace une carte vers une autre colonne
     */
    move(arcId, fromColumnId, toColumnId, cardId, insertIndex = -1) {
        const arc = ArcRepository.getById(arcId);
        if (!arc) return false;

        const fromColumn = BoardItemRepository.getById(arcId, fromColumnId);
        const toColumn = BoardItemRepository.getById(arcId, toColumnId);

        if (!fromColumn?.cards || !toColumn) return false;
        if (!toColumn.cards) toColumn.cards = [];

        const cardIndex = fromColumn.cards.findIndex(c => c.id === cardId);
        if (cardIndex === -1) return false;

        const [card] = fromColumn.cards.splice(cardIndex, 1);

        if (insertIndex >= 0 && insertIndex < toColumn.cards.length) {
            toColumn.cards.splice(insertIndex, 0, card);
        } else {
            toColumn.cards.push(card);
        }

        // Mise à jour scenePresence si c'est une carte scene
        if (card.type === 'scene' && card.sceneId && arc.scenePresence) {
            const presence = arc.scenePresence.find(p => p.sceneId == card.sceneId);
            if (presence) {
                presence.columnId = toColumnId;
            }
        }

        this._save();
        return true;
    },

    /**
     * Convertit une carte en item flottant
     */
    convertToItem(arcId, columnId, cardId, position) {
        const column = BoardItemRepository.getById(arcId, columnId);
        if (!column?.cards) return null;

        const cardIndex = column.cards.findIndex(c => c.id === cardId);
        if (cardIndex === -1) return null;

        const [card] = column.cards.splice(cardIndex, 1);
        const item = convertCardToItem(card, position);

        const arc = ArcRepository.getById(arcId);
        arc.board.items.push(item);

        // Si c'est une carte scene, mettre à jour scenePresence.columnId à null
        if (card.type === 'scene' && card.sceneId && arc.scenePresence) {
            const presence = arc.scenePresence.find(p => p.sceneId == card.sceneId);
            if (presence) {
                presence.columnId = null;
            }
        }

        this._save();
        return item;
    },

    _save() {
        if (typeof saveProject === 'function') {
            saveProject();
        }
    }
};

/**
 * Repository pour les opérations CRUD sur les Connexions
 */
const ConnectionRepository = {
    /**
     * Récupère toutes les connexions d'un arc
     */
    getAll(arcId) {
        const arc = ArcRepository.getById(arcId);
        return arc?.board?.connections || [];
    },

    /**
     * Récupère une connexion par son ID
     */
    getById(arcId, connectionId) {
        return this.getAll(arcId).find(conn => conn.id === connectionId) || null;
    },

    /**
     * Vérifie si une connexion existe entre deux items
     */
    exists(arcId, fromId, toId) {
        return this.getAll(arcId).some(c =>
            (c.from === fromId && c.to === toId) ||
            (c.from === toId && c.to === fromId)
        );
    },

    /**
     * Crée une nouvelle connexion
     */
    create(arcId, fromId, toId, sides = {}) {
        const arc = ArcRepository.getById(arcId);
        if (!arc) return null;

        if (!arc.board.connections) arc.board.connections = [];

        // Vérifier si la connexion existe déjà
        if (this.exists(arcId, fromId, toId)) return null;

        const connection = createConnectionModel(fromId, toId, sides);
        arc.board.connections.push(connection);
        this._save();
        return connection;
    },

    /**
     * Supprime une connexion
     */
    delete(arcId, connectionId) {
        const arc = ArcRepository.getById(arcId);
        if (!arc?.board?.connections) return false;

        const index = arc.board.connections.findIndex(c => c.id === connectionId);
        if (index === -1) return false;

        arc.board.connections.splice(index, 1);
        this._save();
        return true;
    },

    /**
     * Supprime toutes les connexions liées à un item
     */
    deleteByItemId(arcId, itemId) {
        const arc = ArcRepository.getById(arcId);
        if (!arc?.board?.connections) return;

        arc.board.connections = arc.board.connections.filter(
            c => c.from !== itemId && c.to !== itemId
        );
        this._save();
    },

    _save() {
        if (typeof saveProject === 'function') {
            saveProject();
        }
    }
};

/**
 * Repository pour les connexions inter-arcs
 */
const InterArcConnectionRepository = {
    /**
     * Initialise la structure de données
     */
    init() {
        if (!project.interArcConnections) {
            project.interArcConnections = [];
        }
    },

    /**
     * Récupère toutes les connexions inter-arcs
     */
    getAll() {
        this.init();
        return project.interArcConnections || [];
    },

    /**
     * Récupère une connexion par son ID
     */
    getById(connectionId) {
        return this.getAll().find(c => c.id === connectionId) || null;
    },

    /**
     * Récupère les connexions impliquant un arc spécifique
     */
    getByArcId(arcId) {
        return this.getAll().filter(c =>
            c.fromArcId === arcId || c.toArcId === arcId
        );
    },

    /**
     * Récupère les connexions impliquant un item spécifique
     */
    getByItemId(arcId, itemId) {
        return this.getAll().filter(c =>
            (c.fromArcId === arcId && c.fromItemId === itemId) ||
            (c.toArcId === arcId && c.toItemId === itemId)
        );
    },

    /**
     * Crée une nouvelle connexion inter-arc
     */
    create(data) {
        this.init();

        // Vérifier que les deux arcs sont différents
        if (data.fromArcId === data.toArcId) {
            console.warn('InterArcConnection: les deux arcs doivent être différents');
            return null;
        }

        // Vérifier si la connexion existe déjà
        const existing = this.getAll().find(c =>
            c.fromArcId === data.fromArcId &&
            c.fromItemId === data.fromItemId &&
            c.toArcId === data.toArcId &&
            c.toItemId === data.toItemId
        );
        if (existing) return existing;

        const connection = createInterArcConnectionModel(data);
        project.interArcConnections.push(connection);
        this._save();
        return connection;
    },

    /**
     * Met à jour une connexion
     */
    update(connectionId, data) {
        const connection = this.getById(connectionId);
        if (!connection) return null;

        Object.assign(connection, data);
        this._save();
        return connection;
    },

    /**
     * Supprime une connexion
     */
    delete(connectionId) {
        this.init();
        const index = project.interArcConnections.findIndex(c => c.id === connectionId);
        if (index === -1) return false;

        project.interArcConnections.splice(index, 1);
        this._save();
        return true;
    },

    /**
     * Supprime toutes les connexions liées à un arc
     */
    deleteByArcId(arcId) {
        this.init();
        project.interArcConnections = project.interArcConnections.filter(c =>
            c.fromArcId !== arcId && c.toArcId !== arcId
        );
        this._save();
    },

    /**
     * Supprime toutes les connexions liées à un item
     */
    deleteByItemId(arcId, itemId) {
        this.init();
        project.interArcConnections = project.interArcConnections.filter(c =>
            !(c.fromArcId === arcId && c.fromItemId === itemId) &&
            !(c.toArcId === arcId && c.toItemId === itemId)
        );
        this._save();
    },

    _save() {
        if (typeof saveProject === 'function') {
            saveProject();
        }
    }
};

/**
 * Service pour gérer les connexions inter-arcs
 */
const InterArcConnectionService = {
    connecting: false,
    source: null,

    /**
     * Démarre le mode connexion inter-arc
     */
    startConnection() {
        this.connecting = true;
        this.source = null;

        // Afficher une indication visuelle
        const hint = document.getElementById('connectionModeHint');
        if (hint) {
            hint.style.display = 'flex';
            const text = document.getElementById('connectionHintText');
            if (text) text.textContent = 'Cliquez sur un élément source (dans un des arcs)';
        }
    },

    /**
     * Gère le clic sur un élément pendant le mode connexion
     */
    handleClick(arcId, itemId) {
        if (!this.connecting) return false;

        if (!this.source) {
            // Premier clic : définir la source
            this.source = { arcId, itemId };
            const text = document.getElementById('connectionHintText');
            if (text) text.textContent = 'Cliquez sur l\'élément cible (dans un autre arc)';

            // Highlight la source
            const sourceEl = document.querySelector(`[data-arc-id="${arcId}"] [data-item-id="${itemId}"]`);
            if (sourceEl) sourceEl.classList.add('connection-source');

            return true;
        } else {
            // Second clic : créer la connexion
            if (arcId === this.source.arcId) {
                // Même arc, annuler
                console.warn('La connexion doit être entre deux arcs différents');
                return false;
            }

            const connection = InterArcConnectionRepository.create({
                fromArcId: this.source.arcId,
                fromItemId: this.source.itemId,
                toArcId: arcId,
                toItemId: itemId
            });

            this.cancel();
            ArcBoardViewModel.render();
            return !!connection;
        }
    },

    /**
     * Annule le mode connexion
     */
    cancel() {
        this.connecting = false;
        this.source = null;

        const hint = document.getElementById('connectionModeHint');
        if (hint) hint.style.display = 'none';

        document.querySelectorAll('.connection-source').forEach(el => {
            el.classList.remove('connection-source');
        });
    }
};
