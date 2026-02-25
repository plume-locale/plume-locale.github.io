/**
 * Handlers for Floating Editor
 * Handles event listeners and coordinates with ViewModel
 */
const FloatingEditorHandlers = {
    /**
     * Initializes all event listeners
     */
    init() {
        this.initMenuHandlers();
        this.initGestureHandlers();
    },

    /**
     * Menu interaction handlers (toggle, drag, clicks)
     */
    initMenuHandlers() {
        const { toggle, handle, advancedBtn } = FloatingEditorView.elements;

        if (toggle) {
            toggle.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                FloatingEditorViewModel.toggleMenu();
            });
        }

        if (advancedBtn) {
            advancedBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                FloatingEditorViewModel.toggleAdvancedMenu();
            });
        }

        if (handle) {
            // Touch drag
            handle.addEventListener('touchstart', (e) => {
                const touch = e.touches[0];
                const rect = FloatingEditorView.elements.menu.getBoundingClientRect();
                FloatingEditorViewModel.startDrag(touch.clientX, touch.clientY, rect);
                e.preventDefault();
                e.stopPropagation();
            }, { passive: false });

            // Mouse drag
            handle.addEventListener('mousedown', (e) => {
                const rect = FloatingEditorView.elements.menu.getBoundingClientRect();
                FloatingEditorViewModel.startDrag(e.clientX, e.clientY, rect);
                e.preventDefault();
                e.stopPropagation();
            });
        }

        // Global move/end handlers
        // NOTE: passive: true is mandatory here to avoid freezing mobile scroll.
        // The drag menu already uses CSS 'touch-action: none' on the handle element
        // to prevent default scroll behavior during drag without blocking the main thread.
        document.addEventListener('touchmove', (e) => {
            if (!floatingEditorModel.isDragging) return;
            const touch = e.touches[0];
            const menu = FloatingEditorView.elements.menu;
            FloatingEditorViewModel.handleDrag(touch.clientX, touch.clientY, menu.offsetWidth, menu.offsetHeight);
        }, { passive: true });

        document.addEventListener('touchend', () => {
            FloatingEditorViewModel.endDrag();
        });

        document.addEventListener('mousemove', (e) => {
            if (!floatingEditorModel.isDragging) return;
            const menu = FloatingEditorView.elements.menu;
            FloatingEditorViewModel.handleDrag(e.clientX, e.clientY, menu.offsetWidth, menu.offsetHeight);
        });

        document.addEventListener('mouseup', () => {
            FloatingEditorViewModel.endDrag();
        });
    },

    /**
     * Editor gesture handlers (zoom, double-tap, sweep)
     */
    initGestureHandlers() {
        const editor = FloatingEditorView.elements.editor;
        if (!editor) return;

        let lastTap = 0;
        let initialPinchDistance = 0;
        let initialFontSize = 16;
        let touchStartY = 0;

        // Double-tap for focus mode
        editor.addEventListener('touchend', (e) => {
            const currentTime = new Date().getTime();
            const tapLength = currentTime - lastTap;

            if (tapLength < 300 && tapLength > 0) {
                e.preventDefault();
                if (typeof toggleFocusMode === 'function') toggleFocusMode();
            }
            lastTap = currentTime;
        });

        // Pinch and swipe start
        editor.addEventListener('touchstart', (e) => {
            if (e.touches.length === 2) {
                touchStartY = (e.touches[0].clientY + e.touches[1].clientY) / 2;

                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                initialPinchDistance = Math.sqrt(dx * dx + dy * dy);

                const computedStyle = window.getComputedStyle(editor);
                initialFontSize = parseFloat(computedStyle.fontSize);
            }
        });

        // Pinch move
        editor.addEventListener('touchmove', (e) => {
            if (e.touches.length === 2) {
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                const currentDistance = Math.sqrt(dx * dx + dy * dy);

                const scale = currentDistance / initialPinchDistance;
                const newFontSize = Math.max(12, Math.min(24, initialFontSize * scale));

                editor.style.fontSize = `${newFontSize}px`;
            }
        });

        // Swipe end (Undo/Redo)
        editor.addEventListener('touchend', (e) => {
            if (e.changedTouches.length === 2) {
                const touchEndY = (e.changedTouches[0].clientY + (e.changedTouches[1] ? e.changedTouches[1].clientY : e.changedTouches[0].clientY)) / 2;
                const deltaY = touchEndY - touchStartY;

                // Swipe up = undo
                if (deltaY < -50) {
                    e.preventDefault();
                    if (typeof EventBus !== 'undefined') EventBus.emit('history:undo');
                    else if (typeof undo === 'function') undo();
                }
                // Swipe down = redo
                else if (deltaY > 50) {
                    e.preventDefault();
                    if (typeof EventBus !== 'undefined') EventBus.emit('history:redo');
                    else if (typeof redo === 'function') redo();
                }
            }
        });
    }
};

/**
 * Global functions for HTML onclick attributes
 * These bridge the old direct calls to the new MVVM structure
 */
function toggleFloatingEditorMenu() {
    FloatingEditorViewModel.toggleMenu();
}

function toggleAdvancedMenu() {
    FloatingEditorViewModel.toggleAdvancedMenu();
}

function insertLink() {
    FloatingEditorViewModel.insertLink();
}

function insertImage() {
    FloatingEditorViewModel.insertImage();
}

/**
 * Backward compatibility for other formatting functions used in body.html
 * Note: undo() and redo() are already global.
 * formatText is also global (from auto-detect or app).
 */
