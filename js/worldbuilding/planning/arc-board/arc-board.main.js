// ============================================
// ARC BOARD - Main Entry Point
// ============================================
// Ce fichier charge tous les modules et expose
// les fonctions globales pour la compatibilité.
// ============================================

/**
 * Initialise le système Arc Board
 */
function initArcBoardSystem() {
    ArcRepository.init();
}

// ============================================
// API PUBLIQUE (Compatibilité avec l'ancien code)
// ============================================

// Initialisation
function initArcBoard() {
    initArcBoardSystem();
}

// Sidebar
function renderArcsBoardSidebar() {
    ArcBoardView.renderSidebar();
}

function renderArcsList() {
    ArcBoardView.renderSidebar();
}

// Welcome
function renderArcsWelcomeBoard() {
    ArcBoardView.renderWelcome();
}

function renderArcsWelcome() {
    ArcBoardView.renderWelcome();
}

// Création
function createNewArcBoard() {
    ArcBoardViewModel.showArcForm();
}

function createNewArc() {
    ArcBoardViewModel.showArcForm();
}

function showInlineArcForm(arcId = null) {
    if (typeof arcId === 'string') {
        arcId = arcId.replace(/['\"]/g, '').trim();
        if (arcId === '') arcId = null;
    }
    ArcBoardViewModel.showArcForm(arcId);
}

function cancelInlineArcForm() {
    ArcBoardViewModel.hideArcForm();
}

function confirmInlineArcForm() {
    ArcBoardEventHandlers.confirmArcForm();
}

function handleInlineArcKeydown(event) {
    ArcBoardEventHandlers.handleArcFormKeydown(event);
}

function updateInlineArcColor() {
    ArcBoardEventHandlers.updateArcFormColor();
}

// Catégories
function showInlineCategoryForm() {
    ArcBoardViewModel.showCategoryForm();
}

function showAddCategoryModal() {
    ArcBoardViewModel.showCategoryForm();
}

function cancelInlineCategoryForm() {
    ArcBoardViewModel.hideCategoryForm();
}

function confirmInlineCategoryForm() {
    ArcBoardEventHandlers.confirmCategoryForm();
}

function handleInlineCategoryKeydown(event) {
    ArcBoardEventHandlers.handleCategoryFormKeydown(event);
}

function toggleArcCategory(categoryKey) {
    ArcRepository.toggleCategoryCollapse(categoryKey);
    ArcBoardView.renderSidebar();
}

// Navigation
function openArcBoard(arcId) {
    ArcBoardViewModel.openArc(arcId);
}

function openArcDetail(arcId) {
    ArcBoardViewModel.openArc(arcId);
}

// Outils
function setArcTool(tool) {
    ArcBoardViewModel.setTool(tool);
}

function toggleConnectionMode() {
    ConnectionService.toggle();
}

function cancelConnectionMode() {
    ConnectionService.cancel();
}

// Zoom
function zoomArcBoard(direction) {
    ArcBoardViewModel.zoom(direction);
}

function resetArcZoom() {
    ArcBoardViewModel.resetView();
}

// Items
function addArcItem(type) {
    ArcBoardViewModel.addItem(type);
}

function addArcItemAtPosition(clientX, clientY, type) {
    ArcBoardView._removeContextMenu();
    ArcBoardViewModel.addItemAt(type, clientX, clientY);
}

function deleteArcItem(itemId) {
    const arc = ArcBoardViewModel.getCurrentArc();
    if (arc) {
        BoardItemRepository.delete(arc.id, itemId);
        ArcBoardState.selectedItems = ArcBoardState.selectedItems.filter(id => id !== itemId);
        ArcBoardViewModel.renderItems();
        ArcBoardViewModel.deselectAll();

        // Mettre à jour le panneau arcScenePanel s'il est visible
        const arcPanel = document.getElementById('arcScenePanel');
        if (arcPanel && !arcPanel.classList.contains('hidden') && typeof renderArcScenePanel === 'function') {
            renderArcScenePanel();
        }
    }
}

function deleteSelectedItems() {
    ArcBoardViewModel.deleteSelected();
}

function selectArcItem(event, itemId) {
    if (event) event.stopPropagation();
    ArcBoardViewModel.selectItem(itemId, event?.ctrlKey || event?.metaKey);
}

function selectArcCard(event, cardId, columnId) {
    if (event) event.stopPropagation();
    ArcBoardViewModel.selectItem(columnId, event?.ctrlKey || event?.metaKey);
}

function deselectAllArcItems() {
    ArcBoardViewModel.deselectAll();
}

// Mise à jour items
function updateArcItemTitle(itemId, title) {
    ArcBoardViewModel.updateItem(itemId, { title });
}

function updateArcItemContent(itemId, content) {
    ArcBoardViewModel.updateItem(itemId, { content });
}

function updateArcItemWidth(itemId, width) {
    ArcBoardViewModel.updateItem(itemId, { width: parseInt(width) });
    ArcBoardViewModel.renderItems();
}

function updateCurrentArcTitle(title) {
    ArcBoardEventHandlers.updateArcTitle(title);
}

// Cartes
function addCardToColumn(columnId, cardType = 'note') {
    ArcBoardViewModel.addCard(columnId, cardType);
}

function deleteArcCard(event, columnId, cardId) {
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }
    ArcBoardViewModel.deleteCard(columnId, cardId);
}

function updateArcCardContent(columnId, cardId, content) {
    ArcBoardViewModel.updateCard(columnId, cardId, { content });
}

function updateArcCardTitle(columnId, cardId, title) {
    ArcBoardViewModel.updateCard(columnId, cardId, { title });
}

// Todo
function addArcTodoItem(columnId, cardId) {
    ArcBoardEventHandlers.addTodoItem(columnId, cardId);
}

function toggleArcTodo(columnId, cardId, todoIndex) {
    ArcBoardEventHandlers.toggleTodo(columnId, cardId, todoIndex);
}

function updateArcTodoText(columnId, cardId, todoIndex, text) {
    ArcBoardEventHandlers.updateTodoText(columnId, cardId, todoIndex, text);
}

function addFloatingTodoItem(itemId) {
    ArcBoardEventHandlers.addFloatingTodoItem(itemId);
}

function toggleFloatingTodo(itemId, todoIndex) {
    ArcBoardEventHandlers.toggleFloatingTodo(itemId, todoIndex);
}

function updateFloatingTodoText(itemId, todoIndex, text) {
    ArcBoardEventHandlers.updateFloatingTodoText(itemId, todoIndex, text);
}

// Table
function updateArcTableCell(itemId, row, col, value) {
    ArcBoardEventHandlers.updateTableCell(itemId, row, col, value);
}

function updateArcTableSize(itemId, dimension, value) {
    const arc = ArcBoardViewModel.getCurrentArc();
    if (!arc) return;

    const data = {};
    data[dimension] = parseInt(value);
    BoardItemRepository.update(arc.id, itemId, data);
    ArcBoardViewModel.renderItems();
}

// Links
function handleLinkInput(event, columnId, cardId) {
    if (event.key !== 'Enter') return;

    const url = event.target.value.trim();
    if (!url) return;

    ArcBoardViewModel.updateCard(columnId, cardId, { url, title: url });
    ArcBoardViewModel.renderItems();
}

function handleFloatingLinkInput(event, itemId) {
    ArcBoardEventHandlers.handleLinkInput(event, itemId);
}

// Images
function triggerArcUpload() {
    document.getElementById('arcFileInput')?.click();
}

function triggerItemImageUpload(itemId) {
    ArcBoardEventHandlers.triggerItemImageUpload(itemId);
}

function triggerCardImageUpload(columnId, cardId) {
    ArcBoardEventHandlers.triggerCardImageUpload(columnId, cardId);
}

function handleArcFileUpload(event) {
    ArcBoardEventHandlers.onFileUpload(event);
}

function updateItemImage(itemId, src) {
    ArcBoardViewModel.updateItem(itemId, { src });
    ArcBoardViewModel.renderItems();
}

function updateCardImage(columnId, cardId, src) {
    ArcBoardViewModel.updateCard(columnId, cardId, { src });
    ArcBoardViewModel.renderItems();
}

// Arcs
function deleteArc(arcId) {
    ArcBoardEventHandlers.deleteArc(arcId);
}

function duplicateArc(arcId) {
    ArcBoardEventHandlers.duplicateArc(arcId);
}

function renameArc(arcId) {
    ArcBoardView._removeContextMenu();

    const arc = ArcRepository.getById(arcId);
    if (!arc) return;

    const newTitle = prompt("Nouveau nom de l'arc:", arc.title);
    if (newTitle && newTitle.trim()) {
        ArcRepository.update(arcId, { title: newTitle.trim() });
        ArcBoardView.renderSidebar();
    }
}

// Connexions
function selectArcConnection(event, connId) {
    event.stopPropagation();
    ArcBoardState.selectedItems = [connId];
    ArcBoardViewModel._updateSelectionUI();
}

// Canvas handlers
function handleCanvasMouseDown(event) {
    ArcBoardEventHandlers.onCanvasMouseDown(event);
}

function handleCanvasMouseMove(event) {
    ArcBoardEventHandlers.onCanvasMouseMove(event);
}

function handleCanvasMouseUp(event) {
    ArcBoardEventHandlers.onCanvasMouseUp(event);
}

function handleCanvasWheel(event) {
    ArcBoardEventHandlers.onCanvasWheel(event);
}

function handleCanvasContextMenu(event) {
    ArcBoardEventHandlers.onCanvasContextMenu(event);
}

// Drag & Drop
function handleItemMouseDown(event, itemId) {
    // Ne pas intercepter les éléments interactifs
    if (event.target.classList.contains('arc-column-resize')) return;
    if (event.target.closest('.arc-connection-point')) return;
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA' || event.target.contentEditable === 'true') return;
    if (event.target.closest('.arc-card-drag-handle') || event.target.closest('.arc-floating-drag-handle')) return;
    if (event.target.closest('.arc-card') && !event.target.closest('.arc-floating-item')) return;

    event.stopPropagation();
    ItemMoveService.start(event, itemId);
}

function handleItemDrag(event) {
    ItemMoveService.move(event);
}

function endItemDrag(event) {
    ItemMoveService.end();
}

function startColumnResize(event, columnId) {
    ResizeService.start(event, columnId);
}

function handleColumnResizeDrag(event) {
    ResizeService.move(event);
}

function endColumnResize(event) {
    ResizeService.end();
}

function handleCardDragStart(event, cardId, columnId) {
    DragDropService.startCardDrag(event, cardId, columnId);
}

function handleCardDragEnd(event) {
    DragDropService.endDrag(event);
}

function handleFloatingDragStart(event, itemId) {
    DragDropService.startFloatingDrag(event, itemId);
}

function handleFloatingDragEnd(event) {
    DragDropService.endDrag(event);
}

function handleCardDragOver(event) {
    DragDropService.handleColumnDragOver(event);
}

function handleCardDragLeave(event) {
    DragDropService.handleColumnDragLeave(event);
}

function handleCardDrop(event, targetColumnId) {
    DragDropService.handleColumnDrop(event, targetColumnId);
}

function handleCanvasDrop(event) {
    DragDropService.handleCanvasDrop(event);
}

function handleCanvasDragOver(event) {
    DragDropService.handleCanvasDragOver(event);
}

function handleCanvasDragLeave(event) {
    DragDropService.handleCanvasDragLeave(event);
}

// Panneau contextuel
function toggleArcContextPanel() {
    ArcBoardViewModel.toggleContextPanel();
}

function renderArcContextForItem(item) {
    ArcBoardView.renderContextPanel(item);
}

// Panneau Arcs (Editeur)
function toggleArcScenePanel() {
    ArcBoardViewModel.toggleScenePanel();
}

function renderArcScenePanel() {
    ArcBoardViewModel.renderScenePanel();
}

function addArcToCurrentScene() {
    const s = document.getElementById('arcToAddSelect');
    if (s && s.value) {
        ArcBoardViewModel.addArcToCurrentScene(s.value);
    }
}

function removeArcFromScene(arcId) {
    ArcBoardViewModel.removeArcFromScene(arcId);
}

function updateArcIntensity(arcId, value) {
    ArcBoardViewModel.updateArcIntensity(arcId, value);
}

function updateArcStatus(arcId, value) {
    ArcBoardViewModel.updateArcStatus(arcId, value);
}

function updateArcColumn(arcId, value) {
    ArcBoardViewModel.updateArcColumn(arcId, value);
}

function updateArcNotes(arcId, value) {
    ArcBoardViewModel.updateArcNotes(arcId, value);
}

function renderArcTypeIcon(type) {
    return ArcBoardView.renderArcTypeIcon(type);
}

// Copy/Paste
function copySelectedItems() {
    ArcBoardViewModel.copy();
}

function pasteArcItem() {
    ArcBoardView._removeContextMenu();
    ArcBoardViewModel.paste();
}

// Menu contextuel
function showCanvasContextMenu(event) {
    ArcBoardView.showCanvasContextMenu(event);
}

function showArcContextMenu(event, arcId) {
    ArcBoardView.showArcContextMenu(event, arcId);
}

function removeContextMenu() {
    ArcBoardView._removeContextMenu();
}

// Scenes
function openSceneFromCard(event, sceneId) {
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }
    ArcBoardEventHandlers.openScene(sceneId);
}

// Formatage texte — balises HTML sémantiques par défaut
function formatArcText(command) {
    try {
        document.execCommand('styleWithCSS', false, false);
    } catch (e) { }
    document.execCommand(command, false, null);
}

function insertArcCode() {
    document.execCommand('insertHTML', false, '<code></code>');
}

// État global pour compatibilité
let arcBoardState = ArcBoardState;

// ============================================
// EXPORT (si module)
// ============================================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ArcBoardConfig,
        ArcCategories,
        CardTypes,
        BoardItemTypes,
        ToolTypes,
        DragTypes,
        ArcBoardState,
        ArcRepository,
        BoardItemRepository,
        CardRepository,
        ConnectionRepository,
        ArcBoardViewModel,
        ArcBoardView,
        DragDropService,
        ConnectionService,
        PanService,
        ResizeService,
        ItemMoveService,
        ArcBoardEventHandlers
    };
}
