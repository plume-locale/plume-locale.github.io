/**
 * [MVVM : Main]
 * Point d'entrée pour le module ColorPalette
 */
const ColorPaletteModule = {
    /**
     * Initialise le module
     */
    init: () => {
        console.log('🎨 ColorPaletteModule: Initializing...');
        // Note: initializeColorPickers et initSidebarResize sont souvent
        // appelés manuellement dans js/04.init.js
        // Mais nous initialisons les handlers globaux ici.
        ColorPaletteHandlers.init();
    }
};

// Auto-initialisation des handlers au chargement
document.addEventListener('DOMContentLoaded', () => {
    ColorPaletteModule.init();
});
