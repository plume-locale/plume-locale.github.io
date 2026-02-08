/**
 * View for Keyboard Shortcuts
 */
class KeyboardShortcutsView {
    constructor(viewModel) {
        this.viewModel = viewModel;
    }

    init() {
        document.addEventListener('keydown', (e) => {
            this.viewModel.handleKeyDown(e);
        });
    }
}

let keyboardShortcutsView;
