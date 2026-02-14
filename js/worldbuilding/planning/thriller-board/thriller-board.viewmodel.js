/**
 * [MVVM : Thriller Board ViewModel]
 * Logique métier et coordination entre Repository et View.
 */

console.log('📋 Thriller Board ViewModel loaded');

// ============================================
// INITIALIZATION
// ============================================

/**
 * Initialise le Thriller Board.
 */
function initThrillerBoardVM() {
    ThrillerStateRepository.initFromProject();

    // Attacher l'écouteur global pour les sockets (une seule fois)
    if (!socketEventListenerAttached) {
        document.body.addEventListener('mousedown', function (event) {
            const socket = event.target.closest('.thriller-card-socket');
            if (socket && socket.dataset.cardId && socket.dataset.property) {
                startThrillerConnectionVM(event, socket.dataset.cardId, socket.dataset.property);
            }
        }, true);
        socketEventListenerAttached = true;
    }
}

// ============================================
// VIEW MODE
// ============================================

/**
 * Bascule entre les modes Canvas et Grille.
 * @returns {Object} Résultat avec le nouveau mode.
 */
function toggleViewModeVM() {
    const currentMode = ThrillerStateRepository.getViewMode();
    const newMode = currentMode === 'canvas' ? 'grid' : 'canvas';
    ThrillerStateRepository.setViewMode(newMode);

    return {
        success: true,
        viewMode: newMode,
        sideEffects: {
            shouldRender: true
        }
    };
}

/**
 * Définit le mode de colonnes.
 * @param {string} mode - 'free' ou 'narrative'.
 * @returns {Object} Résultat.
 */
function setColumnModeVM(mode) {
    ThrillerColumnRepository.setMode(mode);

    return {
        success: true,
        mode: mode,
        sideEffects: {
            shouldSave: true,
            shouldRender: true
        }
    };
}

// ============================================
// TYPE MANAGEMENT
// ============================================

/**
 * Ajoute un nouveau type personnalisé.
 * @param {Object} data - Données du type.
 * @returns {Object} Résultat.
 */
function addCustomTypeVM(data) {
    if (!data.id) {
        data.id = 'custom_' + Date.now();
    }

    const result = ThrillerTypeRepository.add(data);
    if (result.error) return { success: false, error: result.error };

    return {
        success: true,
        type: result,
        sideEffects: {
            shouldSave: true, // Sauvegarder dans project.thrillerCustomTypes
            shouldRenderList: true // Mettre à jour la sidebar
        }
    };
}

/**
 * Met à jour un type personnalisé.
 * @param {string} typeId - ID du type.
 * @param {Object} updates - Données à mettre à jour.
 * @returns {Object} Résultat.
 */
function updateCustomTypeVM(typeId, updates) {
    const result = ThrillerTypeRepository.update(typeId, updates);
    if (!result) return { success: false, error: 'Type introuvable' };

    return {
        success: true,
        type: result,
        sideEffects: {
            shouldSave: true,
            shouldRenderList: true,
            shouldRender: true // Mettre à jour le board (cartes existantes avec ce type)
        }
    };
}

/**
 * Supprime un type personnalisé.
 * @param {string} typeId - ID du type.
 * @returns {Object} Résultat.
 */
function deleteCustomTypeVM(typeId) {
    const result = ThrillerTypeRepository.remove(typeId);
    if (result.error) return { success: false, error: result.error };
    if (!result) return { success: false, error: 'Erreur lors de la suppression' };

    return {
        success: true,
        sideEffects: {
            shouldSave: true,
            shouldRenderList: true
        }
    };
}

// ============================================
// ELEMENT CRUD
// ============================================

/**
 * Ajoute un nouvel élément.
 * @param {string} type - Type d'élément.
 * @returns {Object} Résultat avec l'élément créé.
 */
function addElementVM(type = null) {
    const elementType = type || ThrillerStateRepository.getCurrentFilter();

    // Utiliser le repository de types pour supporter les types personnalisés
    let typeData = null;
    if (typeof ThrillerTypeRepository !== 'undefined') {
        typeData = ThrillerTypeRepository.getTypeDefinition(elementType);
    } else {
        typeData = THRILLER_TYPES[elementType];
    }

    if (!typeData) return { success: false, error: 'Type invalide' };

    // Compter les éléments existants de ce type
    const existingCount = ThrillerElementRepository.getByType(elementType).length;

    const element = ThrillerElementModel.create({
        type: elementType,
        title: `${typeData.label} ${existingCount + 1}`
    });

    ThrillerElementRepository.add(element);

    return {
        success: true,
        element: element,
        sideEffects: {
            shouldSave: true,
            shouldRenderList: true,
            shouldRenderElements: true,
            shouldOpenModal: element.id,
            isNew: true
        }
    };
}

/**
 * Met à jour un élément existant.
 * @param {string} elementId - ID de l'élément.
 * @param {Object} formData - Données du formulaire.
 * @returns {Object} Résultat.
 */
function updateElementVM(elementId, formData) {
    const element = ThrillerElementRepository.getById(elementId);
    if (!element) return { success: false, error: 'Élément non trouvé' };

    // Stocker l'ancien character_id pour détecter les changements de swimlane
    const oldCharacterId = getElementCharacterId(element);

    // Mettre à jour l'élément
    const updates = {
        title: formData.title,
        description: formData.description,
        data: formData.data
    };

    const updated = ThrillerElementRepository.update(elementId, updates);

    // Mettre à jour les cartes associées
    updateCardsFromElementVM(elementId);

    // Détecter le changement de personnage pour déplacer les cartes
    const newCharacterId = getElementCharacterId(updated);
    if (oldCharacterId !== newCharacterId) {
        moveCardsToNewSwimlaneVM(elementId, oldCharacterId, newCharacterId);
    }

    // Dupliquer les cartes vers les scènes référencées
    duplicateCardsToScenesVM(elementId);

    return {
        success: true,
        element: updated,
        sideEffects: {
            shouldSave: true,
            shouldRenderList: true,
            shouldRender: true,
            shouldCloseModal: true
        }
    };
}

/**
 * Supprime un élément.
 * @param {string} elementId - ID de l'élément.
 * @returns {Object} Résultat.
 */
function deleteElementVM(elementId) {
    const element = ThrillerElementRepository.getById(elementId);
    if (!element) return { success: false, error: 'Élément non trouvé' };

    // Supprimer les cartes associées
    const cards = ThrillerCardRepository.getByElementId(elementId);
    cards.forEach(card => {
        ThrillerConnectionRepository.removeByCardId(card.id);
        ThrillerCardRepository.remove(card.id);
    });

    // Supprimer l'élément
    ThrillerElementRepository.remove(elementId);

    return {
        success: true,
        sideEffects: {
            shouldSave: true,
            shouldRenderList: true,
            shouldRender: true
        }
    };
}

/**
 * Sélectionne un élément.
 * @param {string} elementId - ID de l'élément.
 * @returns {Object} Résultat.
 */
function selectElementVM(elementId) {
    ThrillerStateRepository.setSelectedElements([elementId]);

    const element = ThrillerElementRepository.getById(elementId);
    if (element) {
        ThrillerStateRepository.setCurrentFilter(element.type);
    }

    return {
        success: true,
        elementId: elementId,
        sideEffects: {
            shouldRender: true,
            shouldOpenModal: elementId
        }
    };
}

// ============================================
// CARD MANAGEMENT
// ============================================

/**
 * Crée une carte à partir d'un élément.
 * @param {string} elementId - ID de l'élément source.
 * @param {string} rowId - ID de la ligne cible.
 * @param {string} columnId - ID de la colonne cible.
 * @returns {Object} Résultat avec la carte créée.
 */
function createCardFromElementVM(elementId, rowId, columnId) {
    const element = ThrillerElementRepository.getById(elementId);
    if (!element) return { success: false, error: 'Élément non trouvé' };

    const maxZIndex = ThrillerCardRepository.getMaxZIndex(rowId, columnId);
    const card = ThrillerCardModel.createFromElement(element, rowId, columnId, maxZIndex + 1);

    ThrillerCardRepository.add(card);

    return {
        success: true,
        card: card,
        sideEffects: {
            shouldSave: true,
            shouldRender: true
        }
    };
}

/**
 * Déplace une carte vers une nouvelle cellule.
 * @param {string} cardId - ID de la carte.
 * @param {string} rowId - Nouvelle ligne.
 * @param {string} columnId - Nouvelle colonne.
 * @returns {Object} Résultat.
 */
function moveCardVM(cardId, rowId, columnId) {
    const card = ThrillerCardRepository.getById(cardId);
    if (!card) return { success: false, error: 'Carte non trouvée' };

    // Ignorer si même cellule
    if (card.rowId === rowId && card.columnId === columnId) {
        return { success: true, noChange: true };
    }

    ThrillerCardRepository.moveToCell(cardId, rowId, columnId);

    return {
        success: true,
        sideEffects: {
            shouldSave: true,
            shouldRender: true
        }
    };
}

/**
 * Change le statut d'une carte.
 * @param {string} cardId - ID de la carte.
 * @param {string} newStatus - Nouveau statut.
 * @returns {Object} Résultat.
 */
function changeCardStatusVM(cardId, newStatus) {
    const card = ThrillerCardRepository.getById(cardId);
    if (!card) return { success: false, error: 'Carte non trouvée' };

    ThrillerCardRepository.update(cardId, { status: newStatus });

    // Mettre à jour aussi l'élément source
    if (card.elementId) {
        ThrillerElementRepository.update(card.elementId, { status: newStatus });
    }

    return {
        success: true,
        sideEffects: {
            shouldSave: true,
            shouldRender: true
        }
    };
}

/**
 * Met une carte au premier plan.
 * @param {string} cardId - ID de la carte.
 * @returns {Object} Résultat.
 */
function bringCardToFrontVM(cardId) {
    const result = ThrillerCardRepository.bringToFront(cardId);
    if (!result) return { success: false, error: 'Carte non trouvée' };

    return {
        success: true,
        sideEffects: {
            shouldSave: true,
            shouldRender: true
        }
    };
}

/**
 * Supprime une carte.
 * @param {string} cardId - ID de la carte.
 * @returns {Object} Résultat.
 */
function deleteCardVM(cardId) {
    ThrillerConnectionRepository.removeByCardId(cardId);
    const removed = ThrillerCardRepository.remove(cardId);

    return {
        success: !!removed,
        sideEffects: {
            shouldSave: true,
            shouldRender: true
        }
    };
}

// ============================================
// ROW MANAGEMENT
// ============================================

/**
 * Ajoute une nouvelle ligne.
 * @param {Object} data - Données de la ligne.
 * @returns {Object} Résultat.
 */
function addRowVM(data) {
    const row = ThrillerRowModel.create(data);
    ThrillerRowRepository.add(row);

    return {
        success: true,
        row: row,
        sideEffects: {
            shouldSave: true,
            shouldRender: true,
            shouldCloseModal: true
        }
    };
}

/**
 * Supprime une ligne et ses cartes.
 * @param {string} rowId - ID de la ligne.
 * @returns {Object} Résultat.
 */
function deleteRowVM(rowId) {
    // Supprimer les cartes de cette ligne
    const cards = ThrillerCardRepository.getAll().filter(c => c.rowId === rowId);
    cards.forEach(card => {
        ThrillerConnectionRepository.removeByCardId(card.id);
        ThrillerCardRepository.remove(card.id);
    });

    ThrillerRowRepository.remove(rowId);

    return {
        success: true,
        sideEffects: {
            shouldSave: true,
            shouldRender: true
        }
    };
}

// ============================================
// COLUMN MANAGEMENT
// ============================================

/**
 * Ajoute une nouvelle colonne.
 * @param {Object} data - Données de la colonne.
 * @returns {Object} Résultat.
 */
function addColumnVM(data) {
    const column = ThrillerColumnModel.create(data);
    ThrillerColumnRepository.add(column);

    return {
        success: true,
        column: column,
        sideEffects: {
            shouldSave: true,
            shouldRender: true,
            shouldCloseModal: true
        }
    };
}

/**
 * Supprime une colonne et ses cartes.
 * @param {string} columnId - ID de la colonne.
 * @returns {Object} Résultat.
 */
function deleteColumnVM(columnId) {
    // Supprimer les cartes de cette colonne
    const cards = ThrillerCardRepository.getAll().filter(c => c.columnId === columnId);
    cards.forEach(card => {
        ThrillerConnectionRepository.removeByCardId(card.id);
        ThrillerCardRepository.remove(card.id);
    });

    ThrillerColumnRepository.remove(columnId);

    return {
        success: true,
        sideEffects: {
            shouldSave: true,
            shouldRender: true
        }
    };
}

// ============================================
// DRAG & DROP HANDLING
// ============================================

/**
 * Gère le début du drag d'une carte.
 * @param {string} cardId - ID de la carte.
 */
function handleCardDragStartVM(cardId) {
    const card = ThrillerCardRepository.getById(cardId);
    if (!card) return;

    cardDragState.draggedCardId = cardId;
    cardDragState.sourceRowId = card.rowId;
    cardDragState.sourceColumnId = card.columnId;
    cardDragState.isTreeviewDrag = false;
}

/**
 * Gère le début du drag depuis le treeview.
 * @param {string} elementId - ID de l'élément.
 */
function handleTreeviewDragStartVM(elementId) {
    cardDragState.draggedElementId = elementId;
    cardDragState.isTreeviewDrag = true;
}

/**
 * Gère le drop sur une cellule.
 * @param {string} targetRowId - ID de la ligne cible.
 * @param {string} targetColumnId - ID de la colonne cible.
 * @returns {Object} Résultat.
 */
function handleCellDropVM(targetRowId, targetColumnId) {
    // Cas 1: Drop depuis le treeview (création de carte)
    if (cardDragState.isTreeviewDrag && cardDragState.draggedElementId) {
        const result = createCardFromElementVM(cardDragState.draggedElementId, targetRowId, targetColumnId);

        // Reset du state
        cardDragState.draggedElementId = null;
        cardDragState.isTreeviewDrag = false;

        return result;
    }

    // Cas 2: Déplacement d'une carte existante
    if (cardDragState.draggedCardId) {
        const result = moveCardVM(cardDragState.draggedCardId, targetRowId, targetColumnId);

        // Reset du state
        cardDragState.draggedCardId = null;
        cardDragState.sourceRowId = null;
        cardDragState.sourceColumnId = null;

        return result;
    }

    return { success: false, error: 'Rien à déposer' };
}

/**
 * Réinitialise l'état du drag.
 */
function resetDragStateVM() {
    cardDragState.draggedCardId = null;
    cardDragState.sourceRowId = null;
    cardDragState.sourceColumnId = null;
    cardDragState.draggedElementId = null;
    cardDragState.isTreeviewDrag = false;
}

// ============================================
// CONNECTION MANAGEMENT
// ============================================

/**
 * Démarre une connexion depuis un socket.
 * @param {Event} event - L'événement mousedown.
 * @param {string} cardId - ID de la carte source.
 * @param {string} property - Propriété du socket.
 */
function startThrillerConnectionVM(event, cardId, property) {
    connectionState.isDrawing = true;
    connectionState.from = {
        cardId: cardId,
        property: property,
        side: event.target.closest('.thriller-card-socket').dataset.side || 'right'
    };
    console.log('Started connection from:', connectionState.from);
}

/**
 * Complète une connexion vers un socket cible.
 * @param {string} toCardId - ID de la carte cible.
 * @param {string} toProperty - Propriété du socket cible.
 * @param {string} toSide - Côté du socket.
 * @returns {Object} Résultat.
 */
function completeConnectionVM(toCardId, toProperty, toSide) {
    if (!connectionState.isDrawing || !connectionState.from) {
        return { success: false, error: 'Pas de connexion en cours' };
    }

    // Ne pas connecter au même socket
    if (connectionState.from.cardId === toCardId && connectionState.from.property === toProperty) {
        connectionState.isDrawing = false;
        connectionState.from = null;
        return { success: false, error: 'Même socket' };
    }

    const connection = ThrillerConnectionModel.create(
        connectionState.from,
        { cardId: toCardId, property: toProperty, side: toSide }
    );

    ThrillerConnectionRepository.addGridConnection(connection);

    // Reset state
    connectionState.isDrawing = false;
    connectionState.from = null;

    return {
        success: true,
        connection: connection,
        sideEffects: {
            shouldSave: true,
            shouldRenderConnections: true
        }
    };
}

/**
 * Supprime une connexion de la grille.
 * @param {string} connectionId - ID de la connexion.
 * @returns {Object} Résultat.
 */
function deleteGridConnectionVM(connectionId) {
    const removed = ThrillerConnectionRepository.removeGridConnection(connectionId);

    return {
        success: !!removed,
        sideEffects: {
            shouldSave: true,
            shouldRenderConnections: true
        }
    };
}

/**
 * Annule la connexion en cours.
 */
function cancelConnectionVM() {
    connectionState.isDrawing = false;
    connectionState.from = null;
    if (connectionState.tempLine) {
        connectionState.tempLine.remove();
        connectionState.tempLine = null;
    }
}

// ============================================
// HELPER FUNCTIONS (PRIVATE)
// ============================================

/**
 * Récupère le character_id d'un élément selon son type.
 * @param {Object} element - L'élément.
 * @returns {string|null} L'ID du personnage.
 */
function getElementCharacterId(element) {
    if (!element || !element.data) return null;

    switch (element.type) {
        case 'alibi':
        case 'knowledge_state':
        case 'motive_means_opportunity':
            return element.data.character_id || null;
        case 'secret':
            return element.data.holder_character_id || null;
        case 'backstory':
            if (element.data.characters_involved && element.data.characters_involved.length > 0) {
                return element.data.characters_involved[0];
            }
            return null;
        default:
            return null;
    }
}

/**
 * Met à jour toutes les cartes liées à un élément modifié.
 * @param {string} elementId - ID de l'élément.
 */
function updateCardsFromElementVM(elementId) {
    const element = ThrillerElementRepository.getById(elementId);
    if (!element) return;

    const cards = ThrillerCardRepository.getByElementId(elementId);
    cards.forEach(card => {
        ThrillerCardRepository.update(card.id, {
            title: element.title,
            data: { ...element.data },
            status: element.status
        });
    });
}

/**
 * Déplace les cartes vers un nouveau swimlane si le personnage change.
 * @param {string} elementId - ID de l'élément.
 * @param {string} oldCharacterId - Ancien ID personnage.
 * @param {string} newCharacterId - Nouveau ID personnage.
 */
function moveCardsToNewSwimlaneVM(elementId, oldCharacterId, newCharacterId) {
    if (!newCharacterId) return;

    const newRowId = `character_${newCharacterId}`;
    const cards = ThrillerCardRepository.getByElementId(elementId);

    cards.forEach(card => {
        // Vérifier si la ligne existe
        const row = ThrillerRowRepository.getById(newRowId);
        if (row) {
            ThrillerCardRepository.update(card.id, { rowId: newRowId });
        }
    });
}

/**
 * Duplique les cartes vers les colonnes de scènes référencées.
 * @param {string} elementId - ID de l'élément.
 */
function duplicateCardsToScenesVM(elementId) {
    const element = ThrillerElementRepository.getById(elementId);
    if (!element) return;

    const referencedScenes = getReferencedScenes(element);
    if (referencedScenes.length === 0) return;

    const swimlaneId = getSwimlaneForElement(element);
    if (!swimlaneId) return;

    // Vérifier les cartes existantes pour éviter les doublons
    const existingCards = ThrillerCardRepository.getByElementId(elementId);
    const existingColumns = existingCards.map(c => c.columnId);

    referencedScenes.forEach(sceneId => {
        const columnId = `scene_${sceneId}`;

        // Éviter les doublons
        if (existingColumns.includes(columnId)) return;

        const maxZIndex = ThrillerCardRepository.getMaxZIndex(swimlaneId, columnId);
        const card = ThrillerCardModel.createFromElement(element, swimlaneId, columnId, maxZIndex + 1);
        ThrillerCardRepository.add(card);
    });
}

// ============================================
// DATA GETTERS
// ============================================

/**
 * Récupère les données complètes de la grille pour le rendu.
 * @returns {Object} Données de la grille.
 */
function getGridDataVM() {
    return {
        viewMode: ThrillerStateRepository.getViewMode(),
        columnMode: ThrillerColumnRepository.getMode(),
        rows: ThrillerRowRepository.getAll(),
        columns: ThrillerColumnRepository.getAll(),
        cards: ThrillerCardRepository.getAll(),
        connections: ThrillerConnectionRepository.getGridConnections()
    };
}

/**
 * Récupère les éléments groupés par type pour la sidebar.
 * @returns {Object} Éléments groupés.
 */
function getGroupedElementsVM() {
    const grouped = {};

    // 1. Types système
    Object.keys(THRILLER_TYPES).forEach(type => {
        grouped[type] = {
            ...THRILLER_TYPES[type],
            elements: ThrillerElementRepository.getByType(type)
        };
    });

    // 2. Types personnalisés
    if (typeof ThrillerTypeRepository !== 'undefined') {
        const customTypes = ThrillerTypeRepository.getCustomTypes();
        customTypes.forEach(ct => {
            grouped[ct.id] = {
                label: ct.label,
                icon: ct.icon,
                color: ct.color,
                elements: ThrillerElementRepository.getByType(ct.id)
            };
        });
    }

    return grouped;
}

/**
 * Récupère les cartes d'une cellule triées par zIndex.
 * @param {string} rowId - ID de la ligne.
 * @param {string} columnId - ID de la colonne.
 * @returns {Array} Cartes triées.
 */
function getCellCardsVM(rowId, columnId) {
    const cards = ThrillerCardRepository.getByCell(rowId, columnId);
    return cards.sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0));
}
