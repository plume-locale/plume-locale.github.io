/**
 * [MVVM : Plot Grid Repository]
 * Persistence and Structure Synchronization.
 */

const PlotGridRepository = {
    /**
     * Initialize the repository.
     */
    init: function () {
        if (!project.plotGrid) {
            project.plotGrid = PlotGridModel.createState();
        }
        this.ensureStructureColumns();
    },

    /**
     * Ensure the mandatory "Structure" column exists.
     */
    ensureStructureColumns: function () {
        if (!project.plotGrid.columns.find(c => c.type === 'structure')) {
            const structCol = PlotGridModel.createColumn({
                title: 'Structure Narrative',
                type: 'structure',
                order: -1
            });
            project.plotGrid.columns.unshift(structCol);
        }
    },

    /**
     * Sync rows with project Acts/Chapters/Scenes.
     * Preserves existing rows and their IDs to keep card connections stable.
     */
    syncWithStructure: function () {
        if (!project.plotGrid) this.init();

        const structureRows = [];

        // Walk the structure - ONLY Scenes get rows
        project.acts.forEach((act, aIdx) => {
            act.chapters.forEach((chapter, cIdx) => {
                chapter.scenes.forEach((scene, sIdx) => {
                    let row = project.plotGrid.rows.find(r => r.structureId === scene.id && r.structureType === 'scene');
                    if (!row) {
                        row = PlotGridModel.createRow({
                            structureId: scene.id,
                            structureType: 'scene',
                            type: 'structure',
                            title: scene.title
                        });
                    } else {
                        row.title = scene.title;
                    }
                    row.parentActTitle = act.title;
                    row.parentChapterTitle = chapter.title;
                    row.isFirstInAct = (sIdx === 0 && cIdx === 0);
                    row.isFirstInChapter = (sIdx === 0);
                    row.synopsis = scene.synopsis || scene.title;

                    // Force the order based on manuscript position
                    // We'll normalize all orders at the end of this function anyway.
                    structureRows.push(row);
                });
            });
        });

        // Current rows in project.plotGrid.rows that are NOT in the new structureRows list
        // are either custom rows OR deleted scene rows.
        const customRows = project.plotGrid.rows.filter(r => r.type === 'custom');

        // Update structural rows order to match manuscript position.
        // We use a gap of 10 to allow custom rows to exist between them.
        structureRows.forEach((row, idx) => {
            row.order = idx * 10;
        });

        // Combined list
        const allRows = [...structureRows, ...customRows];

        // Sort everything by the updated order. 
        // In case of a tie, structural rows take precedence.
        allRows.sort((a, b) => {
            if (a.order !== b.order) return a.order - b.order;
            if (a.type === 'structure' && b.type !== 'structure') return -1;
            if (a.type !== 'structure' && b.type === 'structure') return 1;
            return 0;
        });

        // Final normalization: ensure orders are strictly 0, 10, 20...
        // This maintains the interleaving but cleans up the values.
        allRows.forEach((r, idx) => {
            r.order = idx * 10;
        });

        project.plotGrid.rows = allRows;
    },

    // --- CRUD Columns ---

    getColumns: function () {
        return project.plotGrid.columns.sort((a, b) => a.order - b.order);
    },

    addColumn: function (column) {
        project.plotGrid.columns.push(column);
        saveProject(); // Global save
        return column;
    },

    removeColumn: function (colId) {
        const idx = project.plotGrid.columns.findIndex(c => c.id === colId);
        if (idx !== -1) {
            project.plotGrid.columns.splice(idx, 1);
            // Also remove cards in this column
            project.plotGrid.cards = project.plotGrid.cards.filter(c => c.colId !== colId);
            saveProject();
        }
    },

    updateColumn: function (colId, updates) {
        const col = project.plotGrid.columns.find(c => c.id === colId);
        if (col) {
            Object.assign(col, updates);
            saveProject();
        }
        return col;
    },

    // --- CRUD Rows (Custom) ---

    getRows: function () {
        return project.plotGrid.rows.sort((a, b) => a.order - b.order);
    },

    addCustomRow: function (row) {
        project.plotGrid.rows.push(row);
        saveProject();
        return row;
    },

    removeRow: function (rowId) {
        const idx = project.plotGrid.rows.findIndex(r => r.id === rowId);
        if (idx !== -1) {
            project.plotGrid.rows.splice(idx, 1);
            // Also remove cards in this row
            project.plotGrid.cards = project.plotGrid.cards.filter(c => c.rowId !== rowId);
            saveProject();
        }
    },

    // --- CRUD Cards ---

    getCards: function () {
        return project.plotGrid.cards;
    },

    getCardsByRow: function (rowId) {
        return project.plotGrid.cards.filter(c => c.rowId === rowId);
    },

    /**
     * Ensure columns exist up to a certain count/index.
     */
    ensureColumnsUntil: function (count) {
        const currentCount = project.plotGrid.columns.length;
        if (currentCount >= count) return;

        for (let i = currentCount; i < count; i++) {
            this.addColumn(PlotGridModel.createColumn({
                title: 'Ligne sans titre',
                type: 'custom',
                order: i
            }));
        }
    },

    addCard: function (card) {
        // Find or create column if needed (if colId is an index)
        // Note: For simplicity, if colId is not found, we might need a way to target by index.
        // I'll adjust the view to pass both if available or use a better strategy.
        project.plotGrid.cards.push(card);
        saveProject();
        return card;
    },

    updateCard: function (cardId, updates) {
        const card = project.plotGrid.cards.find(c => c.id === cardId);
        if (card) {
            Object.assign(card, updates);
            card.updatedAt = new Date().toISOString();
            saveProject();
        }
        return card;
    },

    removeCard: function (cardId) {
        const idx = project.plotGrid.cards.findIndex(c => c.id === cardId);
        if (idx !== -1) {
            project.plotGrid.cards.splice(idx, 1);
            saveProject();
        }
    },

    /**
     * Special delete for Structure Rows: Only delete cards, do NOT delete the row itself (it's managed by sync).
     */
    clearRowCards: function (rowId) {
        const row = project.plotGrid.rows.find(r => r.id === rowId);
        if (!row) return;

        // Keep cards in the first column (structure column) ?? 
        // Actually, structure col usually doesn't have "Cards", it displays the scene.
        // But if we allowed cards there, we should be careful.
        // For now, let's assume cards are only in other columns.

        project.plotGrid.cards = project.plotGrid.cards.filter(c => c.rowId !== rowId);
        saveProject();
    }
};
