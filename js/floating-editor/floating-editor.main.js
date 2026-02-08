/**
 * Main entry point for Floating Editor
 * Initializes the module
 */
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize if we're not in a testing environment that might lack DOM
    if (document.getElementById('floatingEditorMenu')) {
        FloatingEditorViewModel.init();
        FloatingEditorHandlers.init();

        // Expose init functions if needed for the global 'init' sequence in js/04.init.js
        window.initFloatingEditorMenu = () => {
            // Already initialized via DOMContentLoaded, but can be re-run if needed
            // OR: move logic here if 04.init.js calls it explicitly
        };

        window.initEditorGestures = () => {
            // Already initialized via DOMContentLoaded
        };

        console.log('✅ Floating Editor Module initialized');
    }
});

// If 04.init.js calls these explicitly, we should ensure they are available
function initFloatingEditorMenu() {
    FloatingEditorViewModel.init();
    FloatingEditorHandlers.initMenuHandlers();
}

function initEditorGestures() {
    FloatingEditorHandlers.initGestureHandlers();
}
