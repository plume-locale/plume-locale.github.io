/**
 * [MVVM : globalnotes ViewModel]
 * Manages the UI state and orchestrates actions between View and Repository.
 */

const GlobalNotesViewModel = {
    state: {
        activeBoardId: null,
        selectedItemIds: [],
        zoom: 1,
        panX: 0,
        panY: 0,
        clipboard: null,
        isDragging: false,
        dragType: null, // 'item', 'canvas', 'selection'
        isConnectionMode: false,
        connectionStartId: null
    },

    init: function () {
        console.log('GlobalNotesViewModel.init()');
        if (!window.project) {
            console.error('window.project is missing during GlobalNotesViewModel.init');
            return;
        }
        const boards = GlobalNotesRepository.getBoards();
        console.log('Boards found:', boards.length);

        if (boards.length === 0) {
            // Create a default home board if none exists
            console.log('Creating default home board');
            const homeBoard = GlobalNotesModel.createBoard({ title: Localization.t('globalnotes.default.home') || 'Home' });
            GlobalNotesRepository.saveBoard(homeBoard);
            this.state.activeBoardId = homeBoard.id;
        } else {
            // Load last active board or first one
            const projectId = window.project?.id;
            const lastBoardId = localStorage.getItem(`globalnotes_active_board_${projectId}`);
            this.state.activeBoardId = lastBoardId && boards.find(b => b.id == lastBoardId)
                ? lastBoardId
                : boards[0].id;
        }
        console.log('Active Board ID:', this.state.activeBoardId);
    },

    // --- BOARD ACTIONS ---

    getActiveBoard: function () {
        const board = GlobalNotesRepository.getBoards().find(b => b.id == this.state.activeBoardId);
        return board;
    },

    setActiveBoard: function (boardId) {
        this.state.activeBoardId = boardId;
        this.state.selectedItemIds = [];
        this.state.panX = 0;
        this.state.panY = 0;
        this.state.zoom = 1;

        const projectId = window.project?.id;
        localStorage.setItem(`globalnotes_active_board_${projectId}`, boardId);

        if (window.GlobalNotesView) {
            window.GlobalNotesView.render();
        }

        if (typeof updateSidebarActions === 'function') {
            updateSidebarActions('globalnotes');
        }
    },

    createNewBoard: function (parentId = null, x = 100, y = 100) {
        // 1. Create the persistent board
        const newBoard = GlobalNotesModel.createBoard({
            parentId: parentId || this.state.activeBoardId,
            title: Localization.t('globalnotes.new.board_title') || 'New Board'
        });
        GlobalNotesRepository.saveBoard(newBoard);

        // 2. Create the item representing this board on the parent board
        const boardItem = GlobalNotesModel.createItem({
            type: 'board',
            boardId: parentId || this.state.activeBoardId,
            x: x,
            y: y,
            data: {
                targetBoardId: newBoard.id,
                title: newBoard.title
            }
        });
        GlobalNotesRepository.saveItem(boardItem);

        if (window.GlobalNotesView) {
            window.GlobalNotesView.renderContent();
        }

        if (typeof updateSidebarActions === 'function') {
            updateSidebarActions('globalnotes');
        }

        return newBoard.id;
    },

    // --- ITEM ACTIONS ---

    getItemsInActiveBoard: function () {
        const allItems = GlobalNotesRepository.getItems();
        // Return items in current board that are NOT in a column
        return allItems.filter(i => i.boardId == this.state.activeBoardId && !i.columnId);
    },

    getItemsInColumn: function (columnId) {
        const column = GlobalNotesRepository.getItems().find(i => i.id === columnId);
        const columnItems = GlobalNotesRepository.getItems().filter(i => i.columnId == columnId);

        if (column && column.data) {
            if (!column.data.items) column.data.items = [];

            // Sync IDs: ensure all items with this columnId are in data.items
            const itemIds = columnItems.map(i => i.id);
            itemIds.forEach(id => {
                if (!column.data.items.includes(id)) {
                    column.data.items.push(id);
                }
            });

            // Clean up IDs of items that are no longer in this column
            column.data.items = column.data.items.filter(id => itemIds.includes(id));

            // Return sorted items
            return columnItems.sort((a, b) => {
                return column.data.items.indexOf(a.id) - column.data.items.indexOf(b.id);
            });
        }

        return columnItems;
    },

    addItem: function (type, x, y, columnId = null) {
        console.log('GlobalNotesViewModel.addItem', type, x, y, columnId);
        const newItem = GlobalNotesModel.createItem({
            type: type,
            boardId: this.state.activeBoardId,
            columnId: columnId,
            x: x,
            y: y
        });
        console.log('Generated item:', newItem);
        GlobalNotesRepository.saveItem(newItem);

        if (window.GlobalNotesView) {
            window.GlobalNotesView.renderContent();
        }

        return newItem;
    },

    updateItemPosition: function (itemId, x, y) {
        const item = GlobalNotesRepository.getItems().find(i => i.id == itemId);
        if (item) {
            GlobalNotesRepository.saveItem({ ...item, x, y });
        }
    },

    updateItemData: function (itemId, newData) {
        const item = GlobalNotesRepository.getItems().find(i => i.id == itemId);
        if (item) {
            GlobalNotesRepository.saveItem({ ...item, data: { ...item.data, ...newData } });
        }
    },

    deleteSelectedItem: function () {
        const allItems = GlobalNotesRepository.getItems();
        this.state.selectedItemIds.forEach(id => {
            const item = allItems.find(i => i.id == id);
            if (!item) return;

            if (item.type === 'board') {
                GlobalNotesRepository.deleteBoard(item.data.targetBoardId);
            }

            if (item.type === 'column') {
                // Move children back to board before deleting column
                const children = allItems.filter(i => i.columnId == id);
                children.forEach(child => {
                    GlobalNotesRepository.saveItem({
                        ...child,
                        columnId: null,
                        x: item.x + 20, // Offset slightly so they don't overlap perfectly
                        y: item.y + 20
                    });
                });
            }

            if (item.columnId) {
                const column = allItems.find(i => i.id === item.columnId);
                if (column && column.data.items) {
                    column.data.items = column.data.items.filter(id => id !== item.id);
                    GlobalNotesRepository.saveItem(column);
                }
            }

            // Cleanup connections involving this item
            const activeBoard = this.getActiveBoard();
            if (activeBoard && activeBoard.connections) {
                activeBoard.connections = activeBoard.connections.filter(c => c.from !== id && c.to !== id);
                GlobalNotesRepository.saveBoard(activeBoard);
            }

            GlobalNotesRepository.deleteItem(id);
        });
        this.state.selectedItemIds = [];

        if (window.GlobalNotesView) {
            window.GlobalNotesView.renderContent();
        }

        if (typeof updateSidebarActions === 'function') {
            updateSidebarActions('globalnotes');
        }
    },

    // --- SELECTION ---

    selectItem: function (itemId, multiple = false) {
        if (multiple) {
            if (this.state.selectedItemIds.includes(itemId)) {
                this.state.selectedItemIds = this.state.selectedItemIds.filter(id => id !== itemId);
            } else {
                this.state.selectedItemIds.push(itemId);
            }
        } else {
            this.state.selectedItemIds = [itemId];
        }

        if (window.GlobalNotesView) {
            window.GlobalNotesView.updateSelection();
        }
    },

    clearSelection: function () {
        this.state.selectedItemIds = [];
        if (window.GlobalNotesView) {
            window.GlobalNotesView.updateSelection();
        }
    },

    // --- NAVIGATION & TRANSFORM ---

    goUp: function () {
        const currentBoard = this.getActiveBoard();
        if (currentBoard && currentBoard.parentId) {
            this.setActiveBoard(currentBoard.parentId);
        }
    },

    setZoom: function (zoom) {
        this.state.zoom = Math.max(0.1, Math.min(3, zoom));
        this.applyTransform();
    },

    setPan: function (x, y) {
        this.state.panX = x;
        this.state.panY = y;
        this.applyTransform();
    },

    applyTransform: function () {
        const boardContent = document.getElementById('globalnotesBoardContent');
        if (boardContent) {
            boardContent.style.transform = `translate(${this.state.panX}px, ${this.state.panY}px) scale(${this.state.zoom})`;
        }
    },

    // --- CONNECTIONS ---
    addConnection: function (fromId, toId) {
        if (fromId === toId) return;
        const board = this.getActiveBoard();
        if (board) {
            const connections = board.connections || [];
            // Avoid duplicates
            if (connections.some(c => (c.from === fromId && c.to === toId) || (c.from === toId && c.to === fromId))) {
                return;
            }
            connections.push({
                id: 'conn_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                from: fromId,
                to: toId,
                color: '#64748b',
                thickness: 2
            });
            GlobalNotesRepository.saveBoard({ ...board, connections });

            if (window.GlobalNotesView) {
                window.GlobalNotesView.renderContent();
            }
        }
    },

    deleteConnection: function (connId) {
        const board = this.getActiveBoard();
        if (board && board.connections) {
            board.connections = board.connections.filter(c => c.id !== connId);
            GlobalNotesRepository.saveBoard(board);
            if (window.GlobalNotesView) {
                window.GlobalNotesView.renderContent();
            }
        }
    },

    updateConnection: function (connId, data) {
        const board = this.getActiveBoard();
        if (board && board.connections) {
            const conn = board.connections.find(c => c.id === connId);
            if (conn) {
                Object.assign(conn, data);
                GlobalNotesRepository.saveBoard(board);
                if (window.GlobalNotesView) {
                    window.GlobalNotesView.renderContent();
                }
            }
        }
    }
};

window.GlobalNotesViewModel = GlobalNotesViewModel;


