/**
 * @file mobile-menu.model.js
 * @description Modèle de données pour l'état des menus et de la sidebar mobile.
 */

const MobileMenuModel = {
    /**
     * État par défaut du module.
     */
    DEFAULT_STATE: {
        isSidebarOpen: false,
        isNavDropdownActive: false,
        isEditorToolbarExpanded: false,
        isLinksPanelExpanded: false,
        isMobileMode: false // Déterminé par la taille de la fenêtre/header
    }
};
