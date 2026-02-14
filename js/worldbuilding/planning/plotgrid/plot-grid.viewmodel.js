/**
 * [MVVM : Plot Grid ViewModel]
 * Business Logic for the Plot Grid View.
 */

const PlotGridViewModel = {
    init: function () {
        PlotGridRepository.init();
        // Always sync on init to catch up with structure changes
        PlotGridRepository.syncWithStructure();
    },

    getGridData: function () {
        return {
            columns: PlotGridRepository.getColumns(),
            rows: PlotGridRepository.getRows(),
            cards: PlotGridRepository.getCards()
        };
    },

    getCardsByRow: function (rowId) {
        return PlotGridRepository.getCardsByRow(rowId);
    },

    // --- Column Actions ---

    addNewColumn: function (title) {
        const col = PlotGridModel.createColumn({
            title: title || Localization.t('plotgrid.new.column'),
            order: PlotGridRepository.getColumns().length
        });
        PlotGridRepository.addColumn(col);
        return col;
    },

    deleteColumn: function (colId) {
        const col = PlotGridRepository.getColumns().find(c => c.id === colId);
        if (!col) return;
        if (col.type === 'structure') {
            alert(Localization.t('plotgrid.error.delete_structure'));
            return;
        }
        if (confirm(Localization.t('plotgrid.confirm.delete_col', [col.title]))) {
            PlotGridRepository.removeColumn(colId);
            return true;
        }
        return false;
    },

    // --- Row Actions ---

    addNewCustomRow: function () {
        const rows = PlotGridRepository.getRows();
        const maxOrder = rows.length > 0 ? Math.max(...rows.map(r => r.order)) : -10;
        const row = PlotGridModel.createRow({
            title: Localization.t('plotgrid.new.row'),
            type: 'custom',
            order: maxOrder + 10
        });
        PlotGridRepository.addCustomRow(row);
        return row;
    },

    /**
     * Handles the "Delete Row" action with the specific Guard Logic.
     */
    deleteRow: function (rowId) {
        const row = PlotGridRepository.getRows().find(r => r.id === rowId);
        if (!row) return;

        if (row.type === 'structure') {
            // Guard: Only clear cards, keep row (because it's tied to structure)
            if (confirm(Localization.t('plotgrid.confirm.clear_row', [row.title]))) {
                PlotGridRepository.clearRowCards(rowId);
                return { action: 'cleared' };
            }
        } else {
            // Custom row: Full delete
            if (confirm(Localization.t('plotgrid.confirm.delete_row', [row.title]))) {
                PlotGridRepository.removeRow(rowId);
                return { action: 'deleted' };
            }
        }
        return { action: 'cancelled' };
    },

    // --- Card Actions ---

    addCard: function (rowId, colIdOrIndex, title, content) {
        let colId = colIdOrIndex;

        // Check if colIdOrIndex is actually a numeric index (ghost column)
        if (typeof colIdOrIndex === 'number' || !isNaN(Number(colIdOrIndex))) {
            const index = Number(colIdOrIndex);
            PlotGridRepository.ensureColumnsUntil(index + 1);
            const cols = PlotGridRepository.getColumns();
            colId = cols[index].id;
        }

        const card = PlotGridModel.createCard({
            rowId,
            colId,
            title: title || Localization.t('plotgrid.card.new_untitled'),
            content
        });
        PlotGridRepository.addCard(card);
        return card;
    },

    updateColumnTitle: function (colId, newTitle) {
        PlotGridRepository.updateColumn(colId, { title: newTitle });
    },

    updateCard: function (cardId, data) {
        return PlotGridRepository.updateCard(cardId, data);
    },

    updateSceneSynopsis: function (sceneId, synopsis) {
        // Find scene in global project structure
        let found = false;
        project.acts.forEach(act => {
            act.chapters.forEach(chapter => {
                const scene = chapter.scenes.find(s => s.id === sceneId);
                if (scene) {
                    scene.synopsis = synopsis;
                    found = true;
                }
            });
        });
        if (found) {
            saveProject();
            PlotGridRepository.syncWithStructure(); // Update cache in repo
        }
    },

    updateCardPosition: function (cardId, newRowId, newColIndex) {
        // Ensure columns exist up to target
        PlotGridRepository.ensureColumnsUntil(newColIndex + 1);
        const cols = PlotGridRepository.getColumns();
        const newColId = cols[newColIndex].id;

        PlotGridRepository.updateCard(cardId, { rowId: newRowId, colId: newColId });
    },

    deleteCard: function (cardId) {
        if (confirm(Localization.t('plotgrid.confirm.delete_card'))) {
            PlotGridRepository.removeCard(cardId);
            return true;
        }
        return false;
    },

    insertRowAfter: function (rowId) {
        const rows = this.getGridData().rows;
        const index = rows.findIndex(r => r.id === rowId);
        if (index === -1) return;

        const currentRow = rows[index];
        const nextRow = rows[index + 1];

        let newOrder;
        if (nextRow) {
            newOrder = (currentRow.order + nextRow.order) / 2;
        } else {
            newOrder = currentRow.order + 10;
        }

        const newRow = PlotGridModel.createRow({
            title: Localization.t('plotgrid.new.row'),
            type: 'custom',
            order: newOrder
        });
        PlotGridRepository.addCustomRow(newRow);
        return newRow;
    },

    /**
     * Converts a custom row into a real manuscript scene.
     */
    convertRowToScene: function (rowId) {
        const rows = this.getGridData().rows;
        const rowIdx = rows.findIndex(r => r.id === rowId);
        if (rowIdx === -1) return;

        const targetRow = rows[rowIdx];
        if (targetRow.type !== 'custom') return;

        // 1. Find the nearest preceding structural row to know where to insert in the manuscript
        let precedingSceneId = null;
        for (let i = rowIdx - 1; i >= 0; i--) {
            if (rows[i].type === 'structure' && rows[i].structureType === 'scene') {
                precedingSceneId = rows[i].structureId;
                break;
            }
        }

        // 2. Insert scene into project structure
        let newScene = null;
        if (!precedingSceneId) {
            // No preceding scene? Add to first chapter of first act
            const firstChapter = project.acts[0]?.chapters[0];
            if (firstChapter) {
                newScene = createScene(Localization.t('plotgrid.scene.new_untitled'));
                firstChapter.scenes.unshift(newScene);
            }
        } else {
            // Find preceding scene location
            project.acts.forEach(act => {
                act.chapters.forEach(chapter => {
                    const sIdx = chapter.scenes.findIndex(s => s.id === precedingSceneId);
                    if (sIdx !== -1) {
                        newScene = createScene(Localization.t('plotgrid.scene.new_untitled'));
                        chapter.scenes.splice(sIdx + 1, 0, newScene);
                    }
                });
            });
        }

        if (newScene) {
            // 3. Link the row to the new scene and change its type
            targetRow.type = 'structure';
            targetRow.structureType = 'scene';
            targetRow.structureId = newScene.id;
            targetRow.title = newScene.title;

            saveProject();
            PlotGridRepository.syncWithStructure();
            return newScene;
        }
    }
};
