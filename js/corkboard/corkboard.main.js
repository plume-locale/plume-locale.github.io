// ============================================
// CORKBOARD MAIN
// ============================================
// Point d'entrée principal et compatibilité avec l'ancienne API

/**
 * Initialise le module Cork Board
 */
function initCorkBoard() {
    CorkBoardViewModel.init();
}

// ============================================
// FONCTIONS DE COMPATIBILITÉ (Ancienne API)
// ============================================
// Ces fonctions maintiennent la compatibilité avec le code existant

/**
 * @deprecated Utiliser CorkBoardView.renderSidebar()
 */
function renderCorkBoard() {
    CorkBoardView.renderSidebar();
}

/**
 * @deprecated Utiliser CorkBoardHandlers.onActFilterChange()
 */
function updateCorkActFilter(actId) {
    CorkBoardHandlers.onActFilterChange(actId);
}

/**
 * @deprecated Utiliser CorkBoardHandlers.onChapterFilterChange()
 */
function updateCorkChapterFilter(chapterId) {
    CorkBoardHandlers.onChapterFilterChange(chapterId);
}

/**
 * @deprecated Utiliser CorkBoardHandlers.onOpenFullView()
 */
function openCorkBoardView() {
    CorkBoardHandlers.onOpenFullView();
}

/**
 * @deprecated Utiliser CorkBoardHandlers.onClose()
 */
function closeCorkBoardView() {
    CorkBoardHandlers.onClose();
}

/**
 * @deprecated Utiliser CorkBoardHandlers.onSwitchMode()
 */
function switchCorkMode(mode) {
    CorkBoardHandlers.onSwitchMode(mode);
}

/**
 * @deprecated Utiliser CorkBoardHandlers.onToggleAct()
 */
function toggleStructuredAct(actId) {
    CorkBoardHandlers.onToggleAct(actId);
}

/**
 * @deprecated Utiliser CorkBoardHandlers.onUpdateSynopsis()
 */
function updateSceneSynopsis(actId, chapterId, sceneId, synopsis) {
    CorkBoardHandlers.onUpdateSynopsis(actId, chapterId, sceneId, synopsis);
}

/**
 * @deprecated Utiliser CorkBoardHandlers.onUpdateColor()
 */
function setCorkColor(actId, chapterId, sceneId, color) {
    CorkBoardHandlers.onUpdateColor(actId, chapterId, sceneId, color);
}

/**
 * @deprecated Utiliser CorkBoardHandlers.onOpenScene()
 */
function openSceneFromCork(actId, chapterId, sceneId) {
    CorkBoardHandlers.onOpenScene(actId, chapterId, sceneId);
}

/**
 * @deprecated Utiliser CorkBoardHandlers.onCreateAct()
 */
function createActFromCork() {
    CorkBoardHandlers.onCreateAct();
}

/**
 * @deprecated Utiliser CorkBoardHandlers.onCreateChapter()
 */
function createChapterFromCork(actId) {
    CorkBoardHandlers.onCreateChapter(actId);
}

/**
 * @deprecated Utiliser CorkBoardHandlers.onCreateScene()
 */
function openAddSceneModalFromCork(actId, chapterId) {
    CorkBoardHandlers.onCreateScene(actId, chapterId);
}

/**
 * @deprecated Utiliser CorkBoardHandlers.onUpdateGridSize()
 */
function updateCorkGridSize(value) {
    CorkBoardHandlers.onUpdateGridSize(value);
}

/**
 * @deprecated Utiliser CorkBoardView.showNotification()
 */
function showNotification(message) {
    CorkBoardView.showNotification(message);
}

/**
 * Fonctions obsolètes (non implémentées dans la nouvelle architecture)
 */
function toggleColorPalette(sceneId) {
    console.warn('toggleColorPalette() est obsolète et n\'est plus utilisé');
}

function toggleSceneMenu(sceneId) {
    console.warn('toggleSceneMenu() est obsolète et n\'est plus utilisé');
}

function openCreateFromOutlineModal() {
    alert('Fonctionnalité "Create from Outline" à venir');
}

function showImportOptions() {
    alert('Fonctionnalité "Import" à venir');
}

function showActions() {
    alert('Fonctionnalité "Actions" à venir');
}

/**
 * Fonctions de rendu (compatibilité)
 */
function renderCorkBoardFullView() {
    return CorkBoardView.renderFullView();
}

function renderKanbanView(scenes) {
    // Cette fonction n'est plus utilisée directement
    // Le rendu Kanban est géré par CorkBoardView.renderKanbanView()
    return CorkBoardView.renderKanbanView();
}

function renderCorkCard(scene, index) {
    // Cette fonction n'est plus utilisée directement
    // Le rendu des cartes est géré par CorkBoardView.renderSceneCard()
    return CorkBoardView.renderSceneCard(scene, 'structured');
}

/**
 * Fonctions de drag & drop (compatibilité)
 */
function setupCorkBoardDragAndDrop() {
    CorkBoardHandlers.setupDragAndDrop();
}

function handleCorkDragStart(e) {
    CorkBoardHandlers.handleDragStart(e);
}

function handleCorkDragEnd(e) {
    CorkBoardHandlers.handleDragEnd(e);
}

function handleCorkDragOver(e) {
    CorkBoardHandlers.handleDragOver(e);
}

function handleCorkDrop(e) {
    CorkBoardHandlers.handleDrop(e);
}

/**
 * Fonction utilitaire (compatibilité)
 */
function filterAndRefreshCork(actId, chapterId) {
    if (actId === 'all') {
        CorkBoardViewModel.updateActFilter('all');
    } else if (chapterId === 'all' || !chapterId) {
        CorkBoardViewModel.updateActFilter(actId);
    } else {
        CorkBoardViewModel.updateActFilter(actId);
        CorkBoardViewModel.updateChapterFilter(chapterId);
    }
    CorkBoardHandlers.onOpenFullView();
}

// ============================================
// INITIALISATION
// ============================================
// Initialiser le module au chargement
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function () {
        initCorkBoard();
    });
}
