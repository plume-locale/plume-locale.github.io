/**
 * [MVVM : Handlers]
 * Centralise la gestion des événements pour la palette de couleurs
 */
const ColorPaletteHandlers = {
    /**
     * Initialise les écouteurs globaux
     */
    init: () => {
        // Fermer les pickers lors d'un clic à l'extérieur
        document.addEventListener('click', (event) => {
            if (!event.target.closest('.color-picker-wrapper')) {
                document.querySelectorAll('.color-picker-dropdown').forEach(picker => {
                    picker.classList.remove('active');
                });
            }
        });
    },

    /**
     * Gère les raccourcis clavier de l'éditeur (Gras, Italique, Souligné)
     * @param {KeyboardEvent} event 
     */
    handleEditorKeydown: (event) => {
        if (event.ctrlKey || event.metaKey) {
            switch (event.key.toLowerCase()) {
                case 'b':
                    event.preventDefault();
                    if (typeof formatText === 'function') formatText('bold');
                    else {
                        try { document.execCommand('styleWithCSS', false, false); } catch (e) { }
                        document.execCommand('bold', false, null);
                    }
                    break;
                case 'i':
                    event.preventDefault();
                    if (typeof formatText === 'function') formatText('italic');
                    else {
                        try { document.execCommand('styleWithCSS', false, false); } catch (e) { }
                        document.execCommand('italic', false, null);
                    }
                    break;
                case 'u':
                    event.preventDefault();
                    if (typeof formatText === 'function') formatText('underline');
                    else {
                        try { document.execCommand('styleWithCSS', false, false); } catch (e) { }
                        document.execCommand('underline', false, null);
                    }
                    break;
            }
        }
    }
};

/**
 * Fonctions globales pour compatibilité descendante
 */
function handleEditorKeydown(event) {
    ColorPaletteHandlers.handleEditorKeydown(event);
}
