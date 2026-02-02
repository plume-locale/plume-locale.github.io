// ============================================
// ARC BOARD - Event Handlers
// ============================================

/**
 * Gestionnaires d'événements centralisés
 */
const ArcBoardEventHandlers = {
    // ==========================================
    // CANVAS EVENTS
    // ==========================================

    onCanvasMouseDown(event) {
        const target = event.target;

        // Clic sur le fond du canvas
        if (target.id === 'arcBoardCanvas' ||
            target.id === 'arcBoardContent' ||
            target.classList.contains('arc-board-content') ||
            target.id === 'arcBoardItems') {

            if (ArcBoardState.activeTool === ToolTypes.PAN || event.button === 1) {
                PanService.start(event);
            } else if (ArcBoardState.activeTool === ToolTypes.CONNECT) {
                ConnectionService.cancel();
            } else {
                ArcBoardViewModel.deselectAll();
            }
        }
    },

    onCanvasMouseMove(event) {
        if (PanService.isActive()) {
            PanService.move(event);
        }

        if (ItemMoveService.isActive()) {
            ItemMoveService.move(event);
        }

        if (ResizeService.isActive()) {
            ResizeService.move(event);
        }
    },

    onCanvasMouseUp(event) {
        if (PanService.isActive()) {
            PanService.end();
        }

        if (ItemMoveService.isActive()) {
            ItemMoveService.end();
        }

        if (ResizeService.isActive()) {
            ResizeService.end();
        }
    },

    onCanvasWheel(event) {
        if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            ArcBoardViewModel.zoom(event.deltaY > 0 ? -1 : 1);
        }
    },

    onCanvasContextMenu(event) {
        event.preventDefault();
        ArcBoardView.showCanvasContextMenu(event);
    },

    // ==========================================
    // SPLIT CANVAS EVENTS (Mode Split)
    // ==========================================

    // [MVVM : Handler] État du pan pour chaque panneau split
    _splitPanState: {},

    onSplitCanvasMouseDown(event, arcId) {
        event.preventDefault();
        const content = document.getElementById(`splitContent-${arcId}`);
        if (!content) return;

        this._splitPanState[arcId] = {
            isPanning: true,
            startX: event.clientX,
            startY: event.clientY,
            panel: ArcBoardState.splitArcs.find(p => p.id === arcId)
        };
    },

    onSplitCanvasMouseMove(event, arcId) {
        const state = this._splitPanState[arcId];
        if (!state || !state.isPanning) return;

        const dx = event.clientX - state.startX;
        const dy = event.clientY - state.startY;

        const panel = state.panel;
        if (!panel) return;

        const content = document.getElementById(`splitContent-${arcId}`);
        if (!content) return;

        const newPanX = panel.panX + dx / panel.zoom;
        const newPanY = panel.panY + dy / panel.zoom;

        content.style.transform = `scale(${panel.zoom}) translate(${newPanX}px, ${newPanY}px)`;

        state.startX = event.clientX;
        state.startY = event.clientY;
        panel.panX = newPanX;
        panel.panY = newPanY;
    },

    onSplitCanvasMouseUp(event, arcId) {
        if (this._splitPanState[arcId]) {
            this._splitPanState[arcId].isPanning = false;
        }
    },

    onSplitCanvasWheel(event, arcId) {
        if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            ArcBoardViewModel.zoomSplitPanel(arcId, event.deltaY > 0 ? -1 : 1);
        }
    },

    // ==========================================
    // FORMULAIRES
    // ==========================================

    handleArcFormKeydown(event) {
        if (event.key === 'Enter') {
            this.confirmArcForm();
        } else if (event.key === 'Escape') {
            ArcBoardViewModel.hideArcForm();
        }
    },

    handleCategoryFormKeydown(event) {
        if (event.key === 'Enter') {
            this.confirmCategoryForm();
        } else if (event.key === 'Escape') {
            ArcBoardViewModel.hideCategoryForm();
        }
    },

    confirmArcForm() {
        const arcId = document.getElementById('inlineArcId')?.value;
        const title = document.getElementById('inlineArcTitle')?.value.trim();
        const category = document.getElementById('inlineArcCategory')?.value;
        const color = document.getElementById('inlineArcColor')?.value;

        if (!title) {
            document.getElementById('inlineArcTitle')?.classList.add('error');
            document.getElementById('inlineArcTitle')?.focus();
            return;
        }

        let targetArc;

        if (arcId) {
            // Mode édition
            targetArc = ArcRepository.update(arcId, { title, category, color });
        } else {
            // Mode création
            targetArc = ArcRepository.create({ title, category, color });
        }

        ArcBoardViewModel.hideArcForm();

        if (targetArc) {
            ArcBoardViewModel.openArc(targetArc.id);
        }
    },

    confirmCategoryForm() {
        const name = document.getElementById('inlineCategoryName')?.value.trim();
        const color = document.getElementById('inlineCategoryColor')?.value;

        if (!name) {
            document.getElementById('inlineCategoryName')?.classList.add('error');
            document.getElementById('inlineCategoryName')?.focus();
            return;
        }

        ArcRepository.addCategory(name, color);
        ArcBoardViewModel.hideCategoryForm();
    },

    updateArcFormColor() {
        const category = document.getElementById('inlineArcCategory')?.value;
        const allCategories = ArcRepository.getAllCategories();

        if (allCategories[category]) {
            const colorInput = document.getElementById('inlineArcColor');
            const colorHex = document.getElementById('inlineArcColorHex');

            if (colorInput) colorInput.value = allCategories[category].color;
            if (colorHex) colorHex.textContent = allCategories[category].color;
        }
    },

    // ==========================================
    // ARC ACTIONS
    // ==========================================

    updateArcTitle(title) {
        const arc = ArcBoardViewModel.getCurrentArc();
        if (arc) {
            ArcRepository.update(arc.id, { title });
            ArcBoardView.renderSidebar();
        }
    },

    deleteArc(arcId) {
        ArcBoardView._removeContextMenu();

        const arc = ArcRepository.getById(arcId);
        if (!arc) return;

        if (!confirm(`Voulez-vous vraiment supprimer l'arc "${arc.title}" ?\n\nCette action est irréversible.`)) {
            return;
        }

        ArcRepository.delete(arcId);

        if (ArcBoardState.currentArcId === arcId) {
            ArcBoardState.currentArcId = null;
            ArcBoardView.renderWelcome();
        }

        ArcBoardView.renderSidebar();
    },

    duplicateArc(arcId) {
        ArcBoardView._removeContextMenu();

        const newArc = ArcRepository.duplicate(arcId);
        if (newArc) {
            ArcBoardView.renderSidebar();
            ArcBoardViewModel.openArc(newArc.id);
        }
    },

    // ==========================================
    // TODO ITEMS
    // ==========================================

    addTodoItem(columnId, cardId) {
        const arc = ArcBoardViewModel.getCurrentArc();
        if (!arc) return;

        const card = CardRepository.getById(arc.id, columnId, cardId);
        if (!card) return;

        if (!card.items) card.items = [];
        card.items.push(createTodoItemModel());

        saveProject();
        ArcBoardViewModel.renderItems();
    },

    toggleTodo(columnId, cardId, todoIndex) {
        const arc = ArcBoardViewModel.getCurrentArc();
        if (!arc) return;

        const card = CardRepository.getById(arc.id, columnId, cardId);
        if (!card?.items?.[todoIndex]) return;

        card.items[todoIndex].completed = !card.items[todoIndex].completed;

        saveProject();
        ArcBoardViewModel.renderItems();
    },

    updateTodoText(columnId, cardId, todoIndex, text) {
        const arc = ArcBoardViewModel.getCurrentArc();
        if (!arc) return;

        const card = CardRepository.getById(arc.id, columnId, cardId);
        if (!card?.items?.[todoIndex]) return;

        card.items[todoIndex].text = text;
        saveProject();
    },

    addFloatingTodoItem(itemId) {
        const arc = ArcBoardViewModel.getCurrentArc();
        if (!arc) return;

        const item = BoardItemRepository.getById(arc.id, itemId);
        if (!item) return;

        if (!item.items) item.items = [];
        item.items.push(createTodoItemModel());

        saveProject();
        ArcBoardViewModel.renderItems();
    },

    toggleFloatingTodo(itemId, todoIndex) {
        const arc = ArcBoardViewModel.getCurrentArc();
        if (!arc) return;

        const item = BoardItemRepository.getById(arc.id, itemId);
        if (!item?.items?.[todoIndex]) return;

        item.items[todoIndex].completed = !item.items[todoIndex].completed;

        saveProject();
        ArcBoardViewModel.renderItems();
    },

    updateFloatingTodoText(itemId, todoIndex, text) {
        const arc = ArcBoardViewModel.getCurrentArc();
        if (!arc) return;

        const item = BoardItemRepository.getById(arc.id, itemId);
        if (!item?.items?.[todoIndex]) return;

        item.items[todoIndex].text = text;
        saveProject();
    },

    // ==========================================
    // TABLE
    // ==========================================

    updateTableCell(itemId, row, col, value) {
        const arc = ArcBoardViewModel.getCurrentArc();
        if (!arc) return;

        const item = BoardItemRepository.getById(arc.id, itemId);
        if (!item) return;

        if (!item.data) item.data = [];
        if (!item.data[row]) item.data[row] = [];

        item.data[row][col] = value;
        saveProject();
    },

    updateCardTableCell(columnId, cardId, row, col, value) {
        const arc = ArcBoardViewModel.getCurrentArc();
        if (!arc) return;

        const card = CardRepository.getById(arc.id, columnId, cardId);
        if (!card) return;

        if (!card.data) card.data = [];
        if (!card.data[row]) card.data[row] = [];

        card.data[row][col] = value;
        saveProject();
    },

    // Ajouter/supprimer lignes et colonnes pour tableaux dans cartes
    addCardTableRow(columnId, cardId) {
        const arc = ArcBoardViewModel.getCurrentArc();
        if (!arc) return;

        const card = CardRepository.getById(arc.id, columnId, cardId);
        if (!card) return;

        card.rows = (card.rows || 3) + 1;
        if (!card.data) card.data = [];

        saveProject();
        ArcBoardViewModel.renderItems();
    },

    addCardTableCol(columnId, cardId) {
        const arc = ArcBoardViewModel.getCurrentArc();
        if (!arc) return;

        const card = CardRepository.getById(arc.id, columnId, cardId);
        if (!card) return;

        card.cols = (card.cols || 3) + 1;

        saveProject();
        ArcBoardViewModel.renderItems();
    },

    removeCardTableRow(columnId, cardId, rowIndex) {
        const arc = ArcBoardViewModel.getCurrentArc();
        if (!arc) return;

        const card = CardRepository.getById(arc.id, columnId, cardId);
        if (!card || (card.rows || 3) <= 1) return;

        card.rows = (card.rows || 3) - 1;
        if (card.data && card.data[rowIndex]) {
            card.data.splice(rowIndex, 1);
        }

        saveProject();
        ArcBoardViewModel.renderItems();
    },

    removeCardTableCol(columnId, cardId, colIndex) {
        const arc = ArcBoardViewModel.getCurrentArc();
        if (!arc) return;

        const card = CardRepository.getById(arc.id, columnId, cardId);
        if (!card || (card.cols || 3) <= 1) return;

        card.cols = (card.cols || 3) - 1;
        if (card.data) {
            card.data.forEach(row => {
                if (row && row.length > colIndex) {
                    row.splice(colIndex, 1);
                }
            });
        }

        saveProject();
        ArcBoardViewModel.renderItems();
    },

    // Ajouter/supprimer lignes et colonnes pour tableaux flottants
    addTableRow(itemId) {
        const arc = ArcBoardViewModel.getCurrentArc();
        if (!arc) return;

        const item = BoardItemRepository.getById(arc.id, itemId);
        if (!item) return;

        item.rows = (item.rows || 3) + 1;
        if (!item.data) item.data = [];

        saveProject();
        ArcBoardViewModel.renderItems();
    },

    addTableCol(itemId) {
        const arc = ArcBoardViewModel.getCurrentArc();
        if (!arc) return;

        const item = BoardItemRepository.getById(arc.id, itemId);
        if (!item) return;

        item.cols = (item.cols || 3) + 1;

        saveProject();
        ArcBoardViewModel.renderItems();
    },

    removeTableRow(itemId, rowIndex) {
        const arc = ArcBoardViewModel.getCurrentArc();
        if (!arc) return;

        const item = BoardItemRepository.getById(arc.id, itemId);
        if (!item || (item.rows || 3) <= 1) return;

        item.rows = (item.rows || 3) - 1;
        if (item.data && item.data[rowIndex]) {
            item.data.splice(rowIndex, 1);
        }

        saveProject();
        ArcBoardViewModel.renderItems();
    },

    removeTableCol(itemId, colIndex) {
        const arc = ArcBoardViewModel.getCurrentArc();
        if (!arc) return;

        const item = BoardItemRepository.getById(arc.id, itemId);
        if (!item || (item.cols || 3) <= 1) return;

        item.cols = (item.cols || 3) - 1;
        if (item.data) {
            item.data.forEach(row => {
                if (row && row.length > colIndex) {
                    row.splice(colIndex, 1);
                }
            });
        }

        saveProject();
        ArcBoardViewModel.renderItems();
    },

    // ==========================================
    // LINKS
    // ==========================================

    handleLinkInput(event, itemId) {
        if (event.key !== 'Enter') return;

        const url = event.target.value.trim();
        if (!url) return;

        ArcBoardViewModel.updateItem(itemId, { url, title: url });
        ArcBoardViewModel.renderItems();
    },

    handleCardLinkInput(event, columnId, cardId) {
        if (event.key !== 'Enter') return;

        const url = event.target.value.trim();
        if (!url) return;

        ArcBoardViewModel.updateCard(columnId, cardId, { url, title: url });
        ArcBoardViewModel.renderItems();
    },

    // ==========================================
    // IMAGES
    // ==========================================

    triggerItemImageUpload(itemId) {
        const input = document.getElementById('arcFileInput');
        if (input) {
            input.dataset.targetItem = itemId;
            input.dataset.targetType = 'item';
            input.click();
        }
    },

    triggerCardImageUpload(columnId, cardId) {
        const input = document.getElementById('arcFileInput');
        if (input) {
            input.dataset.targetColumn = columnId;
            input.dataset.targetCard = cardId;
            input.dataset.targetType = 'card';
            input.click();
        }
    },

    onFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const src = e.target.result;
            const input = event.target;

            if (input.dataset.targetType === 'card') {
                const arc = ArcBoardViewModel.getCurrentArc();
                if (arc) {
                    CardRepository.update(arc.id, input.dataset.targetColumn, input.dataset.targetCard, { src });
                    ArcBoardViewModel.renderItems();
                }
            } else if (input.dataset.targetType === 'item') {
                ArcBoardViewModel.updateItem(input.dataset.targetItem, { src });
                ArcBoardViewModel.renderItems();
            } else {
                // Créer un nouvel item image
                const item = ArcBoardViewModel.addItem('image');
                if (item) {
                    setTimeout(() => {
                        ArcBoardViewModel.updateItem(item.id, { src });
                        ArcBoardViewModel.renderItems();
                    }, 100);
                }
            }

            // Reset
            input.value = '';
            delete input.dataset.targetItem;
            delete input.dataset.targetColumn;
            delete input.dataset.targetCard;
            delete input.dataset.targetType;
        };
        reader.readAsDataURL(file);
    },

    // ==========================================
    // SCENES
    // ==========================================

    openScene(sceneId) {
        if (!sceneId) return;

        for (const act of project.acts || []) {
            for (const chapter of act.chapters || []) {
                const scene = chapter.scenes?.find(s => s.id == sceneId);
                if (scene) {
                    if (typeof switchView === 'function') switchView('editor');
                    if (typeof openScene === 'function') openScene(act.id, chapter.id, scene.id);
                    return;
                }
            }
        }
    }
};

// ==========================================
// KEYBOARD SHORTCUTS
// ==========================================

document.addEventListener('keydown', function(event) {
    // Ignorer si on édite du texte
    if (event.target.tagName === 'INPUT' ||
        event.target.tagName === 'TEXTAREA' ||
        event.target.contentEditable === 'true') {
        return;
    }

    // Vérifier qu'on est dans le mode arc board
    if (!ArcBoardState.currentArcId) return;

    // Delete/Backspace - supprimer sélection
    if (event.key === 'Delete' || event.key === 'Backspace') {
        if (ArcBoardState.selectedItems.length > 0) {
            event.preventDefault();
            ArcBoardViewModel.deleteSelected();
        }
    }

    // Escape - annuler action en cours
    if (event.key === 'Escape') {
        if (ArcBoardState.activeTool === ToolTypes.CONNECT) {
            ConnectionService.cancel();
        } else {
            ArcBoardViewModel.deselectAll();
        }
    }

    // Ctrl+A - tout sélectionner
    if ((event.ctrlKey || event.metaKey) && event.key === 'a') {
        event.preventDefault();
        ArcBoardViewModel.selectAll();
    }

    // Ctrl+C - copier
    if ((event.ctrlKey || event.metaKey) && event.key === 'c') {
        if (ArcBoardState.selectedItems.length > 0) {
            event.preventDefault();
            ArcBoardViewModel.copy();
        }
    }

    // Ctrl+V - coller
    if ((event.ctrlKey || event.metaKey) && event.key === 'v') {
        if (ArcBoardState.clipboard) {
            event.preventDefault();
            ArcBoardViewModel.paste();
        }
    }

    // Ctrl+Z - undo
    if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        if (typeof EventBus !== 'undefined') EventBus.emit('history:undo');
        else if (typeof undo === 'function') undo();
    }

    // Ctrl+Y ou Ctrl+Shift+Z - redo
    if ((event.ctrlKey || event.metaKey) && (event.key === 'y' || (event.key === 'z' && event.shiftKey))) {
        event.preventDefault();
        if (typeof EventBus !== 'undefined') EventBus.emit('history:redo');
        else if (typeof redo === 'function') redo();
    }
});
