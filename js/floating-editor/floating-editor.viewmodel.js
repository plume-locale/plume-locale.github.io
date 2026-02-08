/**
 * ViewModel for Floating Editor
 * Bridges the Model and View, contains business logic
 */
const FloatingEditorViewModel = {
    /**
     * Initializes the state from persistence
     */
    init() {
        const savedPos = FloatingEditorRepository.loadPosition();
        if (savedPos) {
            floatingEditorModel.setPosition(savedPos.x, savedPos.y);
        } else {
            // Default position: center of screen
            const defaultX = Math.max(10, (window.innerWidth / 2) - 150);
            const defaultY = Math.max(10, (window.innerHeight / 2) - 200);
            floatingEditorModel.setPosition(defaultX, defaultY);
        }

        // Render initial state
        FloatingEditorView.render(floatingEditorModel);
        FloatingEditorView.renderAdvanced(floatingEditorModel);
    },

    /**
     * Toggles the main menu visibility
     */
    toggleMenu() {
        const newState = !floatingEditorModel.isActive;
        floatingEditorModel.setActive(newState);

        // When opening, ensure position is updated
        if (newState) {
            FloatingEditorView.updatePosition(floatingEditorModel.position);
        }

        FloatingEditorView.render(floatingEditorModel);
    },

    /**
     * Toggles the advanced sub-menu
     */
    toggleAdvancedMenu() {
        const newState = !floatingEditorModel.isAdvancedActive;
        floatingEditorModel.setAdvancedActive(newState);
        FloatingEditorView.renderAdvanced(floatingEditorModel);
    },

    /**
     * Starts dragging
     * @param {number} clientX 
     * @param {number} clientY 
     * @param {DOMRect} rect 
     */
    startDrag(clientX, clientY, rect) {
        floatingEditorModel.setDragging(true);
        floatingEditorModel.setDragOffset(clientX - rect.left, clientY - rect.top);
        FloatingEditorView.updateHandleStyle(true);
    },

    /**
     * Handles movement during drag
     * @param {number} clientX 
     * @param {number} clientY 
     * @param {number} menuWidth 
     * @param {number} menuHeight 
     */
    handleDrag(clientX, clientY, menuWidth, menuHeight) {
        if (!floatingEditorModel.isDragging) return;

        let newX = clientX - floatingEditorModel.dragOffset.x;
        let newY = clientY - floatingEditorModel.dragOffset.y;

        // Constraints
        newX = Math.max(10, Math.min(newX, window.innerWidth - menuWidth - 10));
        newY = Math.max(10, Math.min(newY, window.innerHeight - menuHeight - 10));

        floatingEditorModel.setPosition(newX, newY);
        FloatingEditorView.updatePosition(floatingEditorModel.position);
    },

    /**
     * Ends dragging
     */
    endDrag() {
        if (!floatingEditorModel.isDragging) return;

        floatingEditorModel.setDragging(false);
        FloatingEditorRepository.savePosition(floatingEditorModel.position);
        FloatingEditorView.updateHandleStyle(false);
    },

    /**
     * Executes an editor command
     * @param {string} command 
     * @param {any} value 
     */
    executeCommand(command, value = null) {
        // Use global formatText if available, otherwise fallback to execCommand
        if (typeof formatText === 'function') {
            formatText(command, value);
        } else {
            document.execCommand(command, false, value);
        }

        // Maintain focus on editor
        const editor = document.querySelector('.editor-textarea');
        if (editor) editor.focus();
    },

    /**
     * Special case for link insertion
     */
    insertLink() {
        const url = prompt(Localization.t('floating.prompt.link_url'));
        if (url) {
            const selection = window.getSelection();
            if (selection.toString()) {
                this.executeCommand('createLink', url);
            } else {
                const text = prompt(Localization.t('floating.prompt.link_text'));
                if (text) {
                    const html = `<a href="${url}" target="_blank">${text}</a>`;
                    this.executeCommand('insertHTML', html);
                }
            }
        }
    },

    /**
     * Special case for image insertion
     */
    insertImage() {
        const url = prompt(Localization.t('floating.prompt.image_url'));
        if (url) {
            this.executeCommand('insertImage', url);
        }
    }
};
