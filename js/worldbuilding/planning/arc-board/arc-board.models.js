// ============================================
// ARC BOARD - Models (Data Structures)
// ============================================

/**
 * Factory pour créer un nouvel Arc narratif
 */
function createArcModel(data = {}) {
    const now = new Date().toISOString();
    return {
        id: data.id || generateUniqueId('arc'),
        title: data.title || 'Nouvel arc',
        category: data.category || 'intrigue',
        color: data.color || '#e74c3c',
        description: data.description || '',
        created: data.created || now,
        updated: now,
        board: data.board || createBoardModel(),
        type: data.category || 'intrigue',
        importance: data.importance || 'major',
        relatedCharacters: data.relatedCharacters || [],
        resolution: data.resolution || { type: 'ongoing', sceneId: null },
        scenePresence: data.scenePresence || []
    };
}

/**
 * Factory pour créer un Board vide
 */
function createBoardModel() {
    return {
        items: [],
        connections: []
    };
}

/**
 * Factory pour créer un Item du board (colonne, note, image, etc.)
 */
function createBoardItemModel(type, position = { x: 0, y: 0 }, data = {}) {
    const base = {
        id: data.id || generateUniqueId('item'),
        type: type,
        x: position.x,
        y: position.y
    };

    switch (type) {
        case BoardItemTypes.COLUMN:
            return {
                ...base,
                title: data.title || 'Nouvelle colonne',
                width: data.width || ArcBoardConfig.column.defaultWidth,
                cards: data.cards || []
            };

        case BoardItemTypes.NOTE:
            return {
                ...base,
                content: data.content || '',
                width: data.width || ArcBoardConfig.item.noteWidth
            };

        case BoardItemTypes.IMAGE:
            return {
                ...base,
                src: data.src || '',
                width: data.width || ArcBoardConfig.item.imageWidth,
                caption: data.caption || ''
            };

        case BoardItemTypes.LINK:
            return {
                ...base,
                url: data.url || '',
                title: data.title || ''
            };

        case BoardItemTypes.TODO:
            return {
                ...base,
                title: data.title || 'Liste de tâches',
                items: data.items || []
            };

        case BoardItemTypes.COMMENT:
            return {
                ...base,
                content: data.content || ''
            };

        case BoardItemTypes.TABLE:
            return {
                ...base,
                rows: data.rows || 3,
                cols: data.cols || 3,
                data: data.data || []
            };

        case BoardItemTypes.SCENE:
            return {
                ...base,
                sceneId: data.sceneId || '',
                sceneTitle: data.sceneTitle || '',
                breadcrumb: data.breadcrumb || '',
                intensity: data.intensity || 3,
                status: data.status || 'development',
                notes: data.notes || '',
                width: data.width || 220
            };

        default:
            return base;
    }
}

/**
 * Factory pour créer une Carte (dans une colonne)
 */
function createCardModel(type, data = {}) {
    const base = {
        id: data.id || generateUniqueId('card'),
        type: type
    };

    switch (type) {
        case 'note':
            return { ...base, content: data.content || '' };

        case 'image':
            return { ...base, src: data.src || '', caption: data.caption || '' };

        case 'link':
            return { ...base, url: data.url || '', title: data.title || '', previewImage: data.previewImage || '' };

        case 'todo':
            return { ...base, title: data.title || '', items: data.items || [] };

        case 'audio':
            return { ...base, url: data.url || '' };

        case 'scene':
            return {
                ...base,
                sceneId: data.sceneId || '',
                sceneTitle: data.sceneTitle || '',
                breadcrumb: data.breadcrumb || '',
                intensity: data.intensity || 3,
                status: data.status || 'development',
                notes: data.notes || ''
            };

        case 'comment':
            return { ...base, content: data.content || '' };

        case 'table':
            return {
                ...base,
                rows: data.rows || 3,
                cols: data.cols || 3,
                data: data.data || []
            };

        default:
            return { ...base, content: data.content || '' };
    }
}

/**
 * Factory pour créer une Connexion entre deux items
 */
function createConnectionModel(fromId, toId, sides = {}) {
    return {
        id: generateUniqueId('conn'),
        from: fromId,
        fromSide: sides.fromSide || 'right',
        to: toId,
        toSide: sides.toSide || 'left'
    };
}

/**
 * Types de connexions inter-arcs
 */
const InterArcConnectionTypes = {
    PARALLEL: 'parallel',     // Événements simultanés
    CAUSE: 'cause',           // Arc A cause Arc B
    CONSEQUENCE: 'consequence', // Arc A est conséquence de Arc B
    ECHO: 'echo',             // Écho thématique
    CONTRAST: 'contrast'      // Contraste/opposition
};

/**
 * Factory pour créer une connexion inter-arcs
 */
function createInterArcConnectionModel(data = {}) {
    return {
        id: data.id || generateUniqueId('interarc'),
        fromArcId: data.fromArcId,
        fromItemId: data.fromItemId,
        fromSide: data.fromSide || 'right',
        toArcId: data.toArcId,
        toItemId: data.toItemId,
        toSide: data.toSide || 'left',
        type: data.type || InterArcConnectionTypes.PARALLEL,
        label: data.label || '',
        color: data.color || null // Si null, utilise les couleurs des arcs
    };
}

/**
 * Factory pour créer une tâche Todo
 */
function createTodoItemModel(text = '') {
    return {
        text: text,
        completed: false
    };
}

/**
 * Factory pour créer une catégorie custom
 */
function createCategoryModel(name, color) {
    return {
        label: name,
        icon: 'folder',
        color: color,
        custom: true
    };
}

/**
 * Convertit un item flottant en carte
 */
function convertItemToCard(item) {
    const card = createCardModel(item.type);

    switch (item.type) {
        case 'note':
        case 'comment':
            card.content = item.content || '';
            break;
        case 'todo':
            card.title = item.title || '';
            card.items = item.items || [];
            break;
        case 'image':
            card.src = item.src || '';
            card.caption = item.caption || '';
            break;
        case 'link':
            card.url = item.url || '';
            card.title = item.title || '';
            break;
        case 'table':
            card.rows = item.rows || 3;
            card.cols = item.cols || 3;
            card.data = item.data || [];
            break;
        case 'scene':
            card.sceneId = item.sceneId || '';
            card.sceneTitle = item.sceneTitle || '';
            card.breadcrumb = item.breadcrumb || '';
            card.intensity = item.intensity || 3;
            card.status = item.status || 'development';
            card.notes = item.notes || '';
            break;
    }

    return card;
}

/**
 * Convertit une carte en item flottant
 */
function convertCardToItem(card, position) {
    const type = card.type === 'audio' ? 'note' : card.type;
    const item = createBoardItemModel(type, position);

    switch (card.type) {
        case 'note':
            item.content = card.content || '';
            break;
        case 'todo':
            item.title = card.title || '';
            item.items = card.items || [];
            break;
        case 'image':
            item.src = card.src || '';
            break;
        case 'link':
            item.url = card.url || '';
            item.title = card.title || '';
            break;
        case 'scene':
            item.sceneId = card.sceneId || '';
            item.sceneTitle = card.sceneTitle || '';
            item.breadcrumb = card.breadcrumb || '';
            item.intensity = card.intensity || 3;
            item.status = card.status || 'development';
            item.notes = card.notes || '';
            break;
    }

    return item;
}
