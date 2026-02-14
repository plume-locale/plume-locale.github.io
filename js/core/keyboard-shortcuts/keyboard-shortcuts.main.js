/**
 * Initialization for Keyboard Shortcuts module
 */
document.addEventListener('DOMContentLoaded', () => {
    // Repository is already instantiated as a singleton in its file

    // Instantiate ViewModel
    keyboardShortcutsViewModel = new KeyboardShortcutsViewModel(
        keyboardShortcutsRepository,
        KeyboardShortcutsHandlers
    );

    // Instantiate and init View
    keyboardShortcutsView = new KeyboardShortcutsView(keyboardShortcutsViewModel);
    keyboardShortcutsView.init();

    console.log('Keyboard Shortcuts module initialized');
});
