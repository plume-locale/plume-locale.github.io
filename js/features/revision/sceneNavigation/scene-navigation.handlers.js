/**
 * [Handlers : Scene Navigation]
 * Gère les événements pour la navigation entre scènes.
 */

const sceneNavigationHandlers = {
    /**
     * Gère le changement de curseur.
     */
    handleCursorChange() {
        clearTimeout(window.sceneNavigationModel.updateTimeout);
        window.sceneNavigationModel.updateTimeout = setTimeout(() => {
            window.sceneNavigationView.updatePosition();
        }, 100);
    },

    /**
     * Gère le défilement.
     */
    handleScroll() {
        clearTimeout(window.sceneNavigationModel.scrollDebounceTimeout);
        window.sceneNavigationModel.scrollDebounceTimeout = setTimeout(() => {
            const toolbar = document.getElementById('sceneNavToolbar');
            if (toolbar && toolbar.classList.contains('visible')) {
                window.sceneNavigationView.updatePosition();
            }
        }, 50);
    },

    /**
     * Gère l'action de déplacer vers la scène précédente.
     */
    handleMovePrevious(e) {
        e.preventDefault();
        e.stopPropagation();

        const editor = this.getActiveEditor();
        if (!editor) return;

        const range = window.sceneNavigationModel.saveSelection() || window.getSelection().getRangeAt(0);
        if (!range) return;

        const result = window.sceneNavigationViewModel.moveTextToPrevious(editor, range);
        if (result.success) {
            window.sceneNavigationView.showNotification(Localization.t('sceneNav.textMovedTo', [result.sceneTitle]), 'success');
            window.sceneNavigationView.focusEditorStart(editor);
            window.sceneNavigationView.hide();
        } else {
            window.sceneNavigationView.showNotification(result.message, 'warning');
        }

        window.sceneNavigationModel.savedSelection = null;
    },

    /**
     * Gère l'action de déplacer vers la scène suivante.
     */
    handleMoveNext(e) {
        e.preventDefault();
        e.stopPropagation();

        const editor = this.getActiveEditor();
        if (!editor) return;

        const range = window.sceneNavigationModel.saveSelection() || window.getSelection().getRangeAt(0);
        if (!range) return;

        const result = window.sceneNavigationViewModel.moveTextToNext(editor, range);
        if (result.success) {
            window.sceneNavigationView.showNotification(Localization.t('sceneNav.textMovedTo', [result.sceneTitle]), 'success');
            window.sceneNavigationView.hide();
        } else {
            window.sceneNavigationView.showNotification(result.message, 'warning');
        }

        window.sceneNavigationModel.savedSelection = null;
    },

    /**
     * Trouve l'éditeur actif.
     */
    getActiveEditor() {
        const activeElement = document.activeElement;
        if (activeElement && activeElement.classList.contains('editor-textarea')) {
            return activeElement;
        }
        const ctx = window.sceneNavigationModel.activeSceneContext;
        if (ctx && ctx.sceneId) {
            return document.querySelector(`.editor-textarea[data-scene-id="${ctx.sceneId}"]`);
        }
        return document.querySelector('.editor-textarea[contenteditable="true"]');
    }
};

window.sceneNavigationHandlers = sceneNavigationHandlers;
