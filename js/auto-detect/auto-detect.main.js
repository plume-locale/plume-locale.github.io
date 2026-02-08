/**
 * [MVVM : AutoDetect Main]
 * Point d'entrée du module d'auto-détection.
 */

(function () {
    // Exposition des fonctions globales pour la compatibilité avec l'existant
    window.autoDetectLinksDebounced = () => AutoDetectViewModel.autoDetectLinksDebounced();
    window.autoDetectLinks = () => AutoDetectViewModel.autoDetectLinks();
    window.confirmCharacterPresence = (charId) => AutoDetectViewModel.confirmPresence(charId);
    window.confirmCharacterAbsence = (charId) => AutoDetectViewModel.confirmAbsence(charId);
    window.refreshLinksPanel = () => AutoDetectView.refresh();
    window.renderLinksPanelSidebar = () => AutoDetectView.renderSidebar();
    window.toggleCharacterLinkerAction = (charId) => AutoDetectViewModel.toggleCharacterAction(charId);
    window.formatText = (command, value) => AutoDetectView.formatText(command, value);

    // Initialisation
    console.log('[Auto-Detect] Module initialisé');
})();
