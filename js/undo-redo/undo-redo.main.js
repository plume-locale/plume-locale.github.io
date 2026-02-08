/**
 * [MVVM : Main]
 * Point d'entrée et initialisation du système d'Undo/Redo
 */

function initUndoRedo() {
    // S'assurer que les stacks globaux existent
    if (typeof window.historyStack === 'undefined') window.historyStack = [];
    if (typeof window.redoStack === 'undefined') window.redoStack = [];
    if (typeof window.isUndoRedoAction === 'undefined') window.isUndoRedoAction = false;

    // Exposer l'API globalement (compatibilité avec le code existant)
    window.saveToHistory = (type) => UndoRedoViewModel.saveToHistory(type);
    window.saveToHistoryImmediate = (type) => UndoRedoViewModel.saveToHistoryImmediate(type);
    window.undo = () => UndoRedoViewModel.undo();
    window.redo = () => UndoRedoViewModel.redo();
    window.clearHistory = () => UndoRedoViewModel.clearHistory();
    window.updateUndoRedoButtons = () => UndoRedoView.updateButtons();

    // Initialisation différée pour laisser les autres modules se charger
    setTimeout(() => {
        UndoRedoRepository.initLastSnapshot();
        UndoRedoRepository.integrateWithAllRepositories();
        UndoRedoHandlers.installTextEditHooks();
        UndoRedoView.updateButtons();
        console.log('[UndoRedo] Système initialisé et intégré');
    }, 200);
}

// Global exposure for the library
window.UndoRedo = {
    init: initUndoRedo,
    save: (type) => UndoRedoViewModel.saveToHistory(type),
    saveImmediate: (type) => UndoRedoViewModel.saveToHistoryImmediate(type),
    undo: () => UndoRedoViewModel.undo(),
    redo: () => UndoRedoViewModel.redo(),
    clear: () => UndoRedoViewModel.clearHistory(),
    updateButtons: () => UndoRedoView.updateButtons(),
    integrate: () => UndoRedoRepository.integrateWithAllRepositories(),
    integrateRepository: (repo, name) => UndoRedoRepository.integrateWithRepository(repo, name),
    // Utils
    deepClone: (obj) => UndoRedoModel.deepClone(obj),
    hasChanges: (o1, o2) => UndoRedoModel.hasSignificantChanges(o1, o2),
    createSnapshot: (label) => UndoRedoRepository.createSnapshot(label),
    config: UndoRedoConfig
};

// Auto-init si le document est prêt
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initUndoRedo);
    } else {
        initUndoRedo();
    }
}
