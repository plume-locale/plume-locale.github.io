/**
 * [MVVM : Model]
 * Définit les composantes de l'interface qui peuvent être masquées.
 */
const InterfaceCustomizerModel = {
    // Liste des IDs des éléments débrayables (nav items et boutons d'action)
    components: [
        { id: 'header-tab-projects', icon: 'folder-open', label: 'nav.projects', category: 'navigation' },
        { id: 'header-tab-editor', icon: 'pen-line', label: 'nav.structure', category: 'navigation' },
        { id: 'header-tab-front_matter', icon: 'book-open-check', label: 'nav.front_matter', category: 'navigation' },
        { id: 'header-tab-corkboard', icon: 'layout-grid', label: 'nav.corkboard', category: 'navigation' },
        { id: 'header-tab-plot', icon: 'trending-up', label: 'nav.plot', category: 'navigation' },
        { id: 'header-tab-arcs', icon: 'git-commit-horizontal', label: 'nav.arcs', category: 'navigation' },
        { id: 'header-tab-thriller', icon: 'hat-glasses', label: 'nav.thriller', category: 'navigation' },
        { id: 'header-tab-storygrid', icon: 'grid-3x3', label: 'nav.storygrid', category: 'navigation' },
        { id: 'header-tab-investigation', icon: 'search', label: 'nav.investigation', category: 'navigation' },
        { id: 'header-tab-globalnotes', icon: 'layout', label: 'nav.globalnotes', category: 'navigation' },
        { id: 'header-tab-characters', icon: 'users', label: 'nav.characters', category: 'navigation' },
        { id: 'header-tab-world', icon: 'globe', label: 'nav.world', category: 'navigation' },
        { id: 'header-tab-codex', icon: 'book-open', label: 'nav.codex', category: 'navigation' },
        { id: 'header-tab-notes', icon: 'sticky-note', label: 'nav.notes', category: 'navigation' },
        { id: 'header-tab-mindmap', icon: 'git-branch', label: 'nav.mindmap', category: 'navigation' },
        { id: 'header-tab-relations', icon: 'link', label: 'nav.relations', category: 'navigation' },
        { id: 'header-tab-map', icon: 'map', label: 'nav.map', category: 'navigation' },
        { id: 'header-tab-timeline-viz', icon: 'clock', label: 'nav.timeline', category: 'navigation' },
        { id: 'header-tab-stats', icon: 'bar-chart-3', label: 'nav.stats', category: 'navigation' },
        { id: 'header-tab-analysis', icon: 'scan-search', label: 'nav.analysis', category: 'navigation' },
        { id: 'header-tab-versions', icon: 'history', label: 'nav.snapshots', category: 'navigation' },

        // Actions à droite
        { id: 'splitModeToggle', icon: 'columns-2', label: 'header.split', category: 'actions' },
        { id: 'storage-badge', icon: 'hard-drive', label: 'header.storage', category: 'actions' },
        { id: 'pomodoroHeaderBtn', icon: 'timer', label: 'header.pomodoro', category: 'actions' },
        { id: 'headerImportBtn', icon: 'download', label: 'header.import', category: 'actions' },
        { id: 'headerShortcutsBtn', icon: 'keyboard', label: 'header.shortcuts', category: 'actions' },
        { id: 'headerThemesBtn', icon: 'palette', label: 'header.themes', category: 'actions' },
        { id: 'headerStatsContainer', icon: 'bar-chart', label: 'header.stats_summary', category: 'actions' }
    ],

    // État par défaut (tout visible)
    getDefaultSettings: () => {
        const settings = {
            shortcuts: ['projects', 'editor', 'corkboard', 'notes', 'characters', 'world'],
            progressBarWidth: 8,
            statusDraftColor: '#ff6b6b',
            statusProgressColor: '#ffd93d',
            statusCompleteColor: '#51cf66',
            statusReviewColor: '#4a9eff'
        };
        InterfaceCustomizerModel.components.forEach(c => {
            settings[c.id] = true;
        });
        return settings;
    }
};
