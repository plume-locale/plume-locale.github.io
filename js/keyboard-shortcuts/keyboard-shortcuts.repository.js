/**
 * Repository for keyboard shortcuts
 */
class KeyboardShortcutsRepository {
    constructor() {
        this.shortcuts = [
            { id: 'closeModals', key: 'Escape', ctrl: false, meta: false, description: Localization.t('shortcuts.desc.close_cancel') },
            { id: 'focusSearch', key: 'f', ctrl: true, meta: true, description: Localization.t('shortcuts.desc.global_search') },
            { id: 'saveProject', key: 's', ctrl: true, meta: true, description: Localization.t('shortcuts.desc.save_project') },
            { id: 'toggleFocusMode', key: 'F11', ctrl: false, meta: false, description: Localization.t('shortcuts.desc.focus_mode') },
            { id: 'toggleRevision', key: 'r', ctrl: true, meta: true, description: Localization.t('shortcuts.desc.revision_mode') },
            { id: 'openShortcutsModal', key: '?', ctrl: true, meta: true, description: Localization.t('shortcuts.desc.open_summary') }
        ].map(s => {
            const kb = new KeyboardShortcut(s.key, s.ctrl, s.meta, s.shift || false, s.alt || false, s.description);
            kb.id = s.id;
            return kb;
        });
    }

    getAll() {
        return this.shortcuts;
    }

    getById(id) {
        return this.shortcuts.find(s => s.id === id);
    }
}

const keyboardShortcutsRepository = new KeyboardShortcutsRepository();
