/**
 * @file tension.main.js
 * @description Point d'entrée pour le module de tension.
 * Expose les fonctions globales pour la compatibilité avec le reste de l'application.
 */

// Initialisation au chargement
document.addEventListener('DOMContentLoaded', () => {
    TensionHandlers.init();

    // Si nous sommes en mode édition (on peut vérifier via l'existence d'éléments clés)
    if (document.querySelector('.editor-textarea') || document.getElementById('app')) {
        TensionView.injectTensionMeter();
    }

    // S'abonner aux changements de langue
    if (typeof Localization !== 'undefined' && typeof Localization.subscribe === 'function') {
        Localization.subscribe('tension', () => {
            if (typeof TensionView !== 'undefined' && typeof TensionView.render === 'function') {
                TensionView.render();
            }
        });
    }
});

// --- EXPOSITION GLOBALE POUR COMPATIBILITÉ ---

// Fonctions du Modèle
window.calculateLiveTension = (text, context) => TensionViewModel.calculateTension(text, context);
window.getNarrativeContextData = (context) => TensionModel.getNarrativeContextData(context);
window.getTensionWords = () => TensionRepository.getTensionWords();
window.saveTensionWordsToStorage = (words) => TensionRepository.saveTensionWords(words);

// Fonctions de la Vue
window.openTensionWordsEditor = () => TensionHandlers.onOpenEditor();
window.loadTensionWordsInEditor = () => TensionView.loadWords();
window.updateLiveTensionMeter = (text, context) => {
    let meter = document.getElementById('liveTensionMeter');
    if (!meter) {
        TensionView.injectTensionMeter();
    }

    // Déléguer le calcul et l'affichage
    const result = TensionViewModel.calculateTension(text, context);
    TensionView.updateMeter(result);
};
window.injectTensionMeter = () => TensionView.injectTensionMeter();

// Fonctions d'actions (Handlers/ViewModel)
window.addTensionWord = (type) => TensionHandlers.onAddWord(type);
window.removeTensionWord = (type, index) => TensionHandlers.onRemoveWord(type, index);
window.saveTensionWords = () => TensionHandlers.onSave();
window.resetTensionWordsToDefault = () => TensionHandlers.onReset();
window.exportTensionWords = () => TensionHandlers.onExport();

// Import en masse
window.openBulkImport = (type) => TensionHandlers.onOpenBulkImport(type);
window.processBulkImport = () => TensionHandlers.onProcessBulkImport();

// Alias pour le handler interne utilisé dans view.createWordElement
// (Bien que j'ai utilisé TensionHandlers.onRemoveWord explicitement dans view.js,
// garder window.removeTensionWord est sûr pour le cas où l'ancien HTML soit utilisé)
