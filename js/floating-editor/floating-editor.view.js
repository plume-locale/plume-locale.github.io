/**
 * View for Floating Editor
 * Handles DOM manipulation and rendering
 */
const FloatingEditorView = {
    /**
     * Cache for DOM elements
     */
    elements: {
        get menu() { return document.getElementById('floatingEditorMenu'); },
        get handle() { return document.getElementById('floatingMenuHandle'); },
        get toggle() { return document.getElementById('floatingEditorToggle'); },
        get advancedBar() { return document.getElementById('advancedMenuBar'); },
        get advancedBtn() { return document.getElementById('advancedMenuBtn'); },
        get editor() { return document.querySelector('.editor-textarea'); }
    },

    /**
     * Renders the menu state
     * @param {FloatingEditorModel} state 
     */
    render(state) {
        const { menu, toggle } = this.elements;
        if (!menu || !toggle) return;

        if (state.isActive) {
            menu.classList.add('active');
            toggle.innerHTML = '<i data-lucide="x" style="width:16px;height:16px;"></i>';
        } else {
            menu.classList.remove('active');
            toggle.innerHTML = '<i data-lucide="pen-line" style="width:16px;height:16px;"></i>';
        }

        if (typeof lucide !== 'undefined') lucide.createIcons();
    },

    /**
     * Renders the advanced menu state
     * @param {FloatingEditorModel} state 
     */
    renderAdvanced(state) {
        const { advancedBar, advancedBtn } = this.elements;
        if (!advancedBar || !advancedBtn) return;

        if (state.isAdvancedActive) {
            advancedBar.classList.add('active');
            advancedBtn.style.background = 'rgba(255,215,0,0.3)';
        } else {
            advancedBar.classList.remove('active');
            advancedBtn.style.background = '';
        }
    },

    /**
     * Updates the position of the menu in the DOM
     * @param {Object} position {x, y}
     */
    updatePosition(position) {
        const { menu } = this.elements;
        if (menu) {
            menu.style.transform = 'none';
            menu.style.left = `${position.x}px`;
            menu.style.top = `${position.y}px`;
            menu.style.bottom = 'auto';
            menu.style.right = 'auto';
        }
    },

    /**
     * Updates the handle style during drag
     * @param {boolean} isDragging 
     */
    updateHandleStyle(isDragging) {
        const { handle } = this.elements;
        if (handle) {
            handle.style.background = isDragging ? 'var(--accent-red)' : 'var(--accent-gold)';
        }
    }
};
