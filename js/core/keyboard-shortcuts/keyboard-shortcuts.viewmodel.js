/**
 * ViewModel for Keyboard Shortcuts
 */
class KeyboardShortcutsViewModel {
    constructor(repository, handlers) {
        this.repository = repository;
        this.handlers = handlers;
    }

    /**
     * Handles keydown event
     * @param {KeyboardEvent} e 
     */
    handleKeyDown(e) {
        const shortcuts = this.repository.getAll();

        for (const shortcut of shortcuts) {
            if (shortcut.matches(e)) {
                if (this.handlers[shortcut.id]) {
                    this.handlers[shortcut.id](e);
                    return true;
                }
            }
        }
        return false;
    }
}

let keyboardShortcutsViewModel;
