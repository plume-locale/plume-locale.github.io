/**
 * [MVVM : Modèle]
 * Point d'entrée du module ThemeManager.
 */
const ThemeManagerModule = {
    /**
     * Initialise le module
     */
    init: () => {
        console.log('🎨 ThemeManagerModule: Initializing...');
        ThemeManagerViewModel.init();
    }
};

// Global compatibility function
function openThemeManager() {
    ThemeManagerView.open();
}
