/**
 * @file mobile-menu.main.js
 * @description Point d'entrée du module menus mobiles. Initialise la vue et expose les fonctions globales.
 */

window.MobileMenuMain = {
    init: function () {
        // Initialiser la vue
        MobileMenuView.init();

        // Surcharger switchView pour gérer la fermeture du menu mobile
        this.setupSwitchViewOverride();

        console.log('Mobile Menu module initialized (MVVM)');
    },

    setupSwitchViewOverride: function () {
        if (typeof switchView === 'function') {
            const originalSwitchView = switchView;
            window.switchView = function (view) {
                // Fermer la sidebar si on est en mobile (<= 900px ou force-mobile-nav)
                // On utilise la largeur fenêtre comme proxy rapide comme dans l'original
                if (window.innerWidth <= 900) {
                    MobileMenuViewModel.closeSidebar();
                }
                originalSwitchView(view);
            };
        }
    }
};

// ========================================
// GLOBAL FUNCTIONS (Exposed for HTML onclick attributes)
// ========================================

window.toggleMobileSidebar = function () {
    MobileMenuViewModel.toggleSidebar('structure');
};

window.closeMobileSidebar = function () {
    MobileMenuViewModel.closeSidebar();
};

window.toggleMobileNav = function () {
    MobileMenuViewModel.toggleSidebar('navigation');
};

window.closeMobileNav = function () {
    // Redirigé vers la sidebar
    window.closeMobileSidebar();
};

window.toggleEditorToolbar = function () {
    MobileMenuViewModel.toggleEditorToolbar();
};

window.toggleLinksPanel = function () {
    MobileMenuViewModel.toggleLinksPanel();
};

// [MVVM: Main] Bottom sheet outils mobile
window.toggleMobileToolsSheet = function () {
    MobileMenuViewModel.toggleToolsSheet();
};

window.closeMobileToolsSheet = function () {
    MobileMenuViewModel.closeToolsSheet();
};

// [MVVM: Main] toggleFloatingEditorMenu is already defined in floating-editor.handlers.js
// and uses the proper MVVM pattern. No need to redefine it here.

// Expose internal components for debugging if needed
window.checkHeaderOverflow = function () {
    MobileMenuView.checkHeaderOverflow();
};

// Initialize directly
document.addEventListener('DOMContentLoaded', () => {
    MobileMenuMain.init();
});
