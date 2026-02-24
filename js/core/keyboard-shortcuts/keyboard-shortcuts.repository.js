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
            { id: 'openShortcutsModal', key: '?', ctrl: true, meta: true, description: Localization.t('shortcuts.desc.open_summary') },
            // --- Tools Sidebar shortcuts (Alt+letter) ---
            { id: 'toolVersions', key: 'v', alt: true, description: Localization.t('tools.versions') },
            { id: 'toolAnnotations', key: 'a', alt: true, description: Localization.t('tools.annotations') },
            { id: 'toolTodos', key: 't', alt: true, description: Localization.t('tools.todos') },
            { id: 'toolArcs', key: 'n', alt: true, description: Localization.t('tools.arcs') },
            { id: 'toolPlot', key: 'p', alt: true, description: Localization.t('nav.plotgrid') },
            { id: 'toolInvestigation', key: 'i', alt: true, description: Localization.t('tools.investigation') },
            { id: 'toolLinks', key: 'l', alt: true, description: Localization.t('tools.links') },
            { id: 'toolRepetition', key: 'r', alt: true, description: Localization.t('tools.repetition') }
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
