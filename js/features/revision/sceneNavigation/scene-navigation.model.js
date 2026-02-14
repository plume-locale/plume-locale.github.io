/**
 * [Model : Scene Navigation]
 * Gère l'état de la navigation entre scènes.
 */

const sceneNavigationModel = {
    // État de la barre de navigation
    toolbar: null,
    updateTimeout: null,
    scrollDebounceTimeout: null,
    lastCursorRect: null,
    savedSelection: null,
    activeSceneContext: null, // { sceneId, chapterId, actId }

    /**
     * Réinitialise l'état
     */
    reset() {
        this.activeSceneContext = null;
        this.savedSelection = null;
        this.lastCursorRect = null;
    },

    /**
     * Sauvegarde la sélection actuelle
     */
    saveSelection() {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
            this.savedSelection = selection.getRangeAt(0).cloneRange();
        } else {
            this.savedSelection = null;
        }
        return this.savedSelection;
    },

    /**
     * Restaure la sélection sauvegardée
     */
    restoreSelection() {
        if (this.savedSelection) {
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(this.savedSelection);
        }
    }
};

window.sceneNavigationModel = sceneNavigationModel;
