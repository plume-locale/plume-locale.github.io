/**
 * [MVVM : globalnotes Model]
 * Defines the data structures for the globalnotes-like board.
 */

const GlobalNotesModel = {
    /**
     * Creates a new Board structure.
     */
    createBoard: function (data = {}) {
        return {
            id: data.id || 'board_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            parentId: data.parentId || null, // For sub-boards
            title: data.title || Localization.t('globalnotes.default.board_title') || 'New Board',
            description: data.description || '',
            items: data.items || [], // Array of item IDs or actual items depends on storage strategy
            connections: data.connections || [], // { from: itemId, to: itemId, color: string }
            config: {
                backgroundColor: data.config?.backgroundColor || '#f8f9fa',
                gridVisible: data.config?.gridVisible !== undefined ? data.config.gridVisible : true,
                zoom: data.config?.zoom || 1,
                scrollX: data.config?.scrollX || 0,
                scrollY: data.config?.scrollY || 0
            },
            createdAt: data.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
    },

    /**
     * Creates a new Item structure.
     */
    createItem: function (data = {}) {
        const itemType = data.type || 'note';

        const baseItem = {
            id: data.id || 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            boardId: data.boardId || null,
            columnId: data.columnId || null, // If item is inside a column
            type: itemType,
            x: data.x || 0,
            y: data.y || 0,
            width: data.width || this.getDefaultWidth(itemType),
            height: data.height || this.getDefaultHeight(itemType),
            zIndex: data.zIndex || 1,
            data: data.data || this.getDefaultData(itemType, data),
            config: {
                color: data.config?.color || this.getDefaultColor(itemType),
                borderColor: data.config?.borderColor || 'transparent',
                borderThickness: data.config?.borderThickness || 1,
                borderStyle: data.config?.borderStyle || 'solid',
                rotation: data.config?.rotation || 0,
                isLocked: data.config?.isLocked || false
            },
            createdAt: data.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        return baseItem;
    },

    getDefaultWidth: function (type) {
        switch (type) {
            case 'board': return 180;
            case 'note': return 220;
            case 'image': return 300;
            case 'link': return 280;
            case 'column': return 240;
            case 'checklist': return 220;
            case 'audio': return 300;
            case 'video': return 400;
            case 'file': return 200;
            case 'color': return 80;
            case 'table': return 400;
            case 'map': return 400;
            case 'heading': return 400;
            case 'line': return 200;
            default: return 200;
        }
    },

    getDefaultHeight: function (type) {
        switch (type) {
            case 'board': return 120;
            case 'note': return 150;
            case 'image': return 200;
            case 'link': return 100;
            case 'column': return 'auto';
            case 'checklist': return 'auto';
            case 'audio': return 80;
            case 'video': return 250;
            case 'file': return 60;
            case 'color': return 80;
            default: return 'auto';
        }
    },

    getDefaultData: function (type, inputData = {}) {
        switch (type) {
            case 'note':
                return { content: inputData.content || '' };
            case 'board':
                return {
                    targetBoardId: inputData.targetBoardId || null,
                    title: inputData.title || 'Untitled Board'
                };
            case 'image':
                return {
                    url: inputData.url || '',
                    caption: inputData.caption || ''
                };
            case 'link':
                return {
                    url: inputData.url || '',
                    title: inputData.title || '',
                    description: inputData.description || '',
                    image: inputData.image || ''
                };
            case 'checklist':
                return {
                    items: inputData.items || [
                        { id: 'cli_' + Math.random().toString(36).substr(2, 5), text: '', checked: false }
                    ]
                };
            case 'column':
                return {
                    title: inputData.title || 'Column',
                    items: inputData.items || [] // IDs of items in the column
                };
            case 'audio':
                return {
                    url: inputData.url || '',
                    title: inputData.title || 'Audio File'
                };
            case 'video':
                return {
                    url: inputData.url || '', // YouTube/Vimeo URL or embed
                    title: inputData.title || 'Video'
                };
            case 'file':
                return {
                    name: inputData.name || null,
                    size: inputData.size || null,
                    type: inputData.type || null,
                    url: inputData.url || null
                };
            case 'color':
                return {
                    color: inputData.color || '#4361ee',
                    label: inputData.label || 'Primary'
                };
            case 'table':
                return {
                    rows: inputData.rows || 3,
                    cols: inputData.cols || 3,
                    headers: inputData.headers || ['', '', ''],
                    data: inputData.data || [
                        ['', '', ''],
                        ['', '', ''],
                        ['', '', '']
                    ]
                };
            case 'map':
                return { lat: 48.8566, lng: 2.3522, zoom: 12, title: 'Paris', url: inputData.url || '' };
            case 'heading':
                return { text: inputData.text || 'Section Title' };
            case 'sketch':
                return { svg: '', points: [] };
            case 'line':
                return { x2: 100, y2: 100, thickness: 2, arrowhead: true };
            case 'document':
                return { title: 'New Document', content: '' };
            default:
                return {};
        }
    },

    getDefaultColor: function (type) {
        switch (type) {
            case 'note': return '#fff9c4'; // Yellow
            case 'board': return '#ffffff';
            case 'column': return 'rgba(255,255,255,0.4)';
            case 'color': return 'transparent'; // The inner data defines the color
            default: return '#ffffff';
        }
    }
};

window.GlobalNotesModel = GlobalNotesModel;


