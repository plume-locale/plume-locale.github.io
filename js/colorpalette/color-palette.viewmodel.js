/**
 * [MVVM : ViewModel]
 * Gère la logique métier des couleurs et de l'interface
 */
const ColorPaletteViewModel = {
    /**
     * Récupère les couleurs disponibles
     * @returns {string[]}
     */
    getAvailableColors: () => {
        return ColorPaletteRepository.getColors();
    },

    /**
     * Applique une couleur de texte dans l'éditeur
     * @param {string} color 
     * @param {string|null} panel 
     */
    applyTextColor: (color, panel = null) => {
        const idSuffix = panel ? `-${panel}` : '';
        const textareaId = panel ? `editor-${panel}` : null;
        let textarea = textareaId ? document.getElementById(textareaId) : null;

        if (!textarea && !panel && typeof currentSceneId !== 'undefined' && currentSceneId) {
            textarea = document.querySelector(`.editor-textarea[data-scene-id="${currentSceneId}"]`);
        }

        if (!textarea) textarea = document.querySelector('.editor-textarea');

        // Focus BEFORE applying command to ensure selection is active
        if (textarea) textarea.focus();

        if (panel) {
            if (typeof formatTextInPanel === 'function') {
                formatTextInPanel(panel, 'foreColor', color);
            } else {
                document.execCommand('foreColor', false, color);
            }
        } else {
            document.execCommand('foreColor', false, color);
        }

        // Sync inputs
        const input = document.getElementById(`textColorInput${idSuffix}`);
        const hex = document.getElementById(`textColorHex${idSuffix}`);
        if (input) input.value = color;
        if (hex) hex.value = color.toUpperCase();
    },

    /**
     * Applique une couleur de fond dans l'éditeur
     * @param {string} color 
     * @param {string|null} panel 
     */
    applyBackgroundColor: (color, panel = null) => {
        const idSuffix = panel ? `-${panel}` : '';
        const textareaId = panel ? `editor-${panel}` : null;
        let textarea = textareaId ? document.getElementById(textareaId) : null;

        if (!textarea && !panel && typeof currentSceneId !== 'undefined' && currentSceneId) {
            textarea = document.querySelector(`.editor-textarea[data-scene-id="${currentSceneId}"]`);
        }

        if (!textarea) textarea = document.querySelector('.editor-textarea');

        // Focus BEFORE applying command to ensure selection is active
        if (textarea) textarea.focus();

        if (panel) {
            if (typeof formatTextInPanel === 'function') {
                formatTextInPanel(panel, 'hiliteColor', color);
            } else {
                document.execCommand('hiliteColor', false, color);
            }
        } else {
            document.execCommand('hiliteColor', false, color);
        }

        // Sync inputs
        const input = document.getElementById(`bgColorInput${idSuffix}`);
        const hex = document.getElementById(`bgColorHex${idSuffix}`);
        if (input) input.value = color;
        if (hex) hex.value = color.toUpperCase();
    },

    /**
     * Sauvegarde la largeur de la sidebar
     * @param {number} width 
     */
    updateSidebarWidth: (width) => {
        ColorPaletteRepository.saveSidebarWidth(width);
    },

    /**
     * Récupère la largeur sauvegardée
     * @returns {number|null}
     */
    getSavedSidebarWidth: () => {
        const width = ColorPaletteRepository.getSidebarWidth();
        return width ? parseInt(width) : null;
    }
};

/**
 * Fonctions globales pour compatibilité descendante
 */
function applyTextColor(color, panel = null) {
    ColorPaletteViewModel.applyTextColor(color, panel);
}

function applyBackgroundColor(color, panel = null) {
    ColorPaletteViewModel.applyBackgroundColor(color, panel);
}
