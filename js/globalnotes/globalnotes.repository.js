/**
 * [MVVM : globalnotes Repository]
 * Handles data persistence for the globalnotes module.
 * Bridges between the model and the project storage.
 */

const GlobalNotesRepository = {
    /**
     * Gets all boards for the current project.
     */
    getBoards: function () {
        if (!window.project) return [];
        if (!window.project.globalnotes) {
            window.project.globalnotes = { boards: [], items: [], activeBoardId: null };
        }
        if (!window.project.globalnotes.boards) {
            window.project.globalnotes.boards = [];
        }
        return window.project.globalnotes.boards;
    },

    /**
     * Gets all items for the current project.
     */
    getItems: function () {
        if (!window.project) return [];
        if (!window.project.globalnotes) {
            window.project.globalnotes = { boards: [], items: [], activeBoardId: null };
        }
        if (!window.project.globalnotes.items) {
            window.project.globalnotes.items = [];
        }
        return window.project.globalnotes.items;
    },

    /**
     * Saves or updates a board.
     */
    saveBoard: function (board) {
        if (!window.project) return;

        const boards = this.getBoards();
        const index = boards.findIndex(b => b.id === board.id);

        if (index >= 0) {
            boards[index] = { ...boards[index], ...board, updatedAt: new Date().toISOString() };
        } else {
            boards.push(board);
        }

        this._persist();
    },

    /**
     * Saves or updates an item.
     */
    saveItem: function (item) {
        if (!window.project) return;

        const items = this.getItems();
        const index = items.findIndex(i => i.id === item.id);

        if (index >= 0) {
            items[index] = { ...items[index], ...item, updatedAt: new Date().toISOString() };
        } else {
            items.push(item);
        }

        console.log('Item saved. Total items in project:', items.length);
        this._persist();
    },

    /**
     * Deletes a board and its content recursively.
     */
    deleteBoard: function (boardId) {
        if (!window.project) return;

        // Find sub-boards
        const subBoards = this.getBoards().filter(b => b.parentId === boardId);
        subBoards.forEach(sb => this.deleteBoard(sb.id));

        // Delete items belonging to this board
        window.project.globalnotes.items =
            this.getItems().filter(i => i.boardId !== boardId);

        // Delete the board itself
        window.project.globalnotes.boards =
            this.getBoards().filter(b => b.id !== boardId);

        this._persist();
    },

    /**
     * Deletes an item.
     */
    deleteItem: function (itemId) {
        if (!window.project) return;

        window.project.globalnotes.items =
            this.getItems().filter(i => i.id !== itemId);

        this._persist();
    },

    /**
     * Internal persistence trigger.
     */
    _persist: function () {
        if (typeof saveProject === 'function') {
            saveProject();
        }
    }
};

window.GlobalNotesRepository = GlobalNotesRepository;


