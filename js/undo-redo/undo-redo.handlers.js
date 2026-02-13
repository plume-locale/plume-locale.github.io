/**
 * [MVVM : Handlers]
 * Gestionnaires d'événements pour le système d'Undo/Redo
 */

const UndoRedoHandlers = {
    /**
     * Installe les hooks automatiques sur les éléments éditables
     */
    installTextEditHooks() {
        // Focusin : Sauvegarder l'état avant de commencer l'édition
        document.addEventListener('focusin', (e) => {
            const target = e.target;
            if (this._isSignificantEditable(target)) {
                if (!window.isUndoRedoAction) {
                    UndoRedoViewModel.saveToHistoryImmediate('text-edit-start');
                }
            }
        }, true);

        // Input : Sauvegarder avec debounce
        document.addEventListener('input', (e) => {
            const target = e.target;
            const isText = target.tagName === 'TEXTAREA' || (target.tagName === 'INPUT' && (target.type === 'text' || target.type === 'search'));
            const isRange = target.tagName === 'INPUT' && target.type === 'range';

            if (this._isSignificantEditable(target) || isText || isRange) {
                if (UndoRedoViewModel._textEditDebounceTimer) {
                    clearTimeout(UndoRedoViewModel._textEditDebounceTimer);
                }

                UndoRedoViewModel._textEditDebounceTimer = setTimeout(() => {
                    if (!window.isUndoRedoAction) {
                        const content = isText ? target.value : null;
                        UndoRedoViewModel.saveToHistory('edit', { text: content });
                    }
                    UndoRedoViewModel._textEditDebounceTimer = null;
                }, UndoRedoViewModel._textEditDebounceDelay);
            }
        }, true);

        // Focusout : Sauvegarder immédiatement à la fin de l'édition
        document.addEventListener('focusout', (e) => {
            const target = e.target;
            const isText = target.tagName === 'TEXTAREA' || (target.tagName === 'INPUT' && target.type === 'text');
            if (this._isSignificantEditable(target) || isText) {
                if (UndoRedoViewModel._textEditDebounceTimer) {
                    clearTimeout(UndoRedoViewModel._textEditDebounceTimer);
                    UndoRedoViewModel._textEditDebounceTimer = null;
                }

                if (!window.isUndoRedoAction) {
                    const content = isText ? target.value : null;
                    UndoRedoViewModel.saveToHistoryImmediate('edit-end', { text: content });
                }
            }
        }, true);

        // Change : Sauvegarder les changements de sélection (dropdowns) et autres types d'input
        document.addEventListener('change', (e) => {
            const target = e.target;
            const isSelect = target.tagName === 'SELECT';
            const isCheckbox = target.tagName === 'INPUT' && (target.type === 'checkbox' || target.type === 'radio');
            const isRange = target.tagName === 'INPUT' && target.type === 'range';

            if (isSelect || isCheckbox || isRange || this._isSignificantSelect(target)) {
                if (!window.isUndoRedoAction) {
                    let value = target.value;
                    if (isCheckbox) value = target.checked;
                    else if (isSelect && target.options[target.selectedIndex]) value = target.options[target.selectedIndex].text;

                    // On laisse un petit délai pour que le handler métier ait mis à jour le modèle
                    setTimeout(() => {
                        UndoRedoViewModel.saveToHistoryImmediate('change', { value: value });
                    }, 50);
                }
            }
        }, true);

        console.log('[UndoRedo] Hooks de texte et selection installés');
    },

    /**
     * Vérifie si un élément est un champ éditable "important"
     */
    _isSignificantEditable(target) {
        if (!target) return false;
        return (
            target.classList.contains('editor-textarea') ||
            target.classList.contains('synopsis-input') ||
            target.classList.contains('scene-separator-synopsis') ||
            target.id === 'sceneContent' ||
            target.id === 'sceneTitle' ||
            target.getAttribute('contenteditable') === 'true'
        );
    },

    /**
     * Vérifie si un élément est un select "important"
     */
    _isSignificantSelect(target) {
        if (!target) return false;
        // Ajouter d'autres classes de select importants ici si nécessaire
        return target.classList.contains('important-select');
    }
};
