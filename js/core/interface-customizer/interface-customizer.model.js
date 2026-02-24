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
        { id: 'header-tab-plotgrid', icon: 'grid', label: 'nav.plotgrid', category: 'navigation' },

        // Actions à droite
        { id: 'splitModeToggle', icon: 'columns-2', label: 'header.split', category: 'actions' },
        { id: 'storage-badge', icon: 'hard-drive', label: 'header.storage', category: 'actions' },
        { id: 'pomodoroHeaderBtn', icon: 'timer', label: 'header.pomodoro', category: 'actions' },
        { id: 'headerImportBtn', icon: 'download', label: 'header.import', category: 'actions' },
        { id: 'headerShortcutsBtn', icon: 'keyboard', label: 'header.shortcuts', category: 'actions' },
        { id: 'headerThemesBtn', icon: 'palette', label: 'header.themes', category: 'actions' },
        { id: 'headerStatsContainer', icon: 'bar-chart', label: 'header.stats_summary', category: 'actions' },

        // Éléments spécifiques de l'éditeur
        { id: 'writing-progress-bar', icon: 'activity', label: 'editor.writing_progress', category: 'editor' },
        { id: 'statusFilters', icon: 'filter', label: 'editor.filters', category: 'editor' },
        { id: 'projectProgressBar', icon: 'battery-medium', label: 'editor.project_progress', category: 'editor' },
        { id: 'sceneTools', icon: 'wrench', label: 'editor.tools', category: 'editor' },
        { id: 'treeCollapseToolbar', icon: 'chevrons-left-right', label: 'editor.tree_toolbar', category: 'editor' },

        // Boutons de la barre d'outils (Outils tiers)
        { id: 'toolVersionsBtn', icon: 'history', label: 'tool.versions', category: 'tools' },
        { id: 'toolAnnotationsBtn', icon: 'message-square', label: 'tool.annotations', category: 'tools' },
        { id: 'toolTodosBtn', icon: 'check-square', label: 'tool.todos', category: 'tools' },
        { id: 'toolArcsBtn', icon: 'git-merge', label: 'tool.arcs', category: 'tools' },
        { id: 'toolPlotBtn', icon: 'trending-up', label: 'tool.plot', category: 'tools' },
        { id: 'toolInvestigationBtn', icon: 'search', label: 'nav.investigation', category: 'tools' },
        { id: 'toolRepetitionBtn', icon: 'repeat', label: 'tools.repetition', category: 'tools' },
        { id: 'toolLinksPanelBtn', icon: 'link', label: 'tools.links', category: 'tools' },
        { id: 'toolRevisionBtn', icon: 'refresh-cw', label: 'module.writing.revision', category: 'tools' },
        { id: 'toolStructureBlockBtn', icon: 'box', label: 'module.writing.blocks', category: 'tools' },
        { id: 'toolNarrativeOverviewBtn', icon: 'book-open', label: 'module.writing.overview', category: 'tools' }
    ],

    // Liste exhaustive des modules (chaque dossier du projet)
    modules: [
        // --- CORE ---
        {
            id: 'project',
            label: 'module.core.project',
            icon: 'folder-open',
            category: 'core',
            components: ['header-tab-projects', 'nav-item-projects', 'headerProjectTitle']
        },
        {
            id: 'ui',
            label: 'module.core.ui',
            icon: 'layout',
            category: 'core',
            components: ['sidebar', 'header']
        },
        {
            id: 'theme-manager',
            label: 'module.core.theme',
            icon: 'palette',
            category: 'core',
            components: ['headerThemesBtn']
        },
        {
            id: 'localization',
            label: 'module.core.localization',
            icon: 'languages',
            category: 'core',
            components: ['headerLangBtn']
        },
        {
            id: 'storage',
            label: 'module.core.storage',
            icon: 'hard-drive',
            category: 'core',
            components: ['storage-badge']
        },
        {
            id: 'undo-redo',
            label: 'module.core.undo_redo',
            icon: 'rotate-ccw',
            category: 'core',
            components: ['headerUndoBtn', 'headerRedoBtn']
        },
        {
            id: 'keyboard-shortcuts',
            label: 'module.core.shortcuts',
            icon: 'keyboard',
            category: 'core',
            components: ['headerShortcutsBtn']
        },

        // --- WRITING (FEATURES/EDITOR) ---
        {
            id: 'editor',
            label: 'module.writing.editor',
            icon: 'pen-tool',
            category: 'writing',
            components: ['header-tab-editor', 'nav-item-editor', 'sceneTools']
        },
        {
            id: 'focusMode',
            label: 'module.writing.focus',
            icon: 'maximize',
            category: 'writing',
            components: ['headerFocusBtn']
        },
        {
            id: 'structure-blocks',
            label: 'module.writing.blocks',
            icon: 'box',
            category: 'writing',
            components: ['toolStructureBlockBtn']
        },
        {
            id: 'narrative-overview',
            label: 'module.writing.overview',
            icon: 'book-open',
            category: 'writing',
            components: ['toolNarrativeOverviewBtn']
        },
        {
            id: 'revision_feedback',
            label: 'module.writing.revision_feedback',
            icon: 'refresh-cw',
            category: 'writing',
            components: [
                'header-tab-versions', 'nav-item-versions', 'toolVersionsBtn',
                'toolAnnotationsBtn',
                'toolRevisionBtn',
                'header-tab-notes', 'nav-item-notes',
                'toolTodosBtn'
            ]
        },
        {
            id: 'front-matter',
            label: 'module.writing.front_matter',
            icon: 'book-open-check',
            category: 'writing',
            components: ['header-tab-front_matter', 'nav-item-front_matter']
        },

        // --- PLANNING (WORLDBUILDING/PLANNING) ---
        {
            id: 'corkboard',
            label: 'module.planning.corkboard',
            icon: 'layout-grid',
            category: 'planning',
            components: ['header-tab-corkboard', 'nav-item-corkboard']
        },
        {
            id: 'plot',
            label: 'module.planning.plot',
            icon: 'trending-up',
            category: 'planning',
            components: ['header-tab-plot', 'nav-item-plot', 'toolPlotBtn']
        },
        {
            id: 'plotgrid',
            label: 'module.planning.plotgrid',
            icon: 'grid',
            category: 'planning',
            components: ['header-tab-plotgrid', 'nav-item-plotgrid']
        },
        {
            id: 'timeline-metro',
            label: 'module.planning.timeline',
            icon: 'clock',
            category: 'planning',
            components: ['header-tab-timeline-viz', 'nav-item-timeline-viz']
        },
        {
            id: 'arc-board',
            label: 'module.planning.arcs',
            icon: 'git-commit-horizontal',
            category: 'planning',
            components: ['header-tab-arcs', 'nav-item-arcs', 'toolArcsBtn']
        },
        {
            id: 'thriller-board',
            label: 'module.planning.thriller',
            icon: 'hat-glasses',
            category: 'planning',
            components: ['header-tab-thriller', 'nav-item-thriller']
        },
        {
            id: 'investigation-board',
            label: 'module.planning.investigation',
            icon: 'search-code',
            category: 'planning',
            components: ['header-tab-investigation', 'nav-item-investigation', 'toolInvestigationBtn']
        },
        {
            id: 'mindmap',
            label: 'module.planning.mindmap',
            icon: 'git-branch',
            category: 'planning',
            components: ['header-tab-mindmap', 'nav-item-mindmap']
        },
        {
            id: 'map',
            label: 'module.planning.map',
            icon: 'map',
            category: 'planning',
            components: ['header-tab-map', 'nav-item-map']
        },
        {
            id: 'tension',
            label: 'module.planning.tension',
            icon: 'activity',
            category: 'planning',
            components: ['liveTensionMeter']
        },
        {
            id: 'relation-map',
            label: 'module.planning.relations',
            icon: 'link-2',
            category: 'planning',
            components: ['header-tab-relations', 'nav-item-relations', 'toolLinksPanelBtn']
        },

        // --- ATLAS (WORLDBUILDING/ATLAS) ---
        {
            id: 'characters',
            label: 'module.atlas.characters',
            icon: 'users',
            category: 'atlas',
            components: ['header-tab-characters', 'nav-item-characters']
        },
        {
            id: 'world',
            label: 'module.atlas.world',
            icon: 'globe',
            category: 'atlas',
            components: ['header-tab-world', 'nav-item-world']
        },
        {
            id: 'codex',
            label: 'module.atlas.codex',
            icon: 'book-open',
            category: 'atlas',
            components: ['header-tab-codex', 'nav-item-codex']
        },

        // --- ANALYSIS ---
        {
            id: 'stats',
            label: 'module.analysis.stats',
            icon: 'bar-chart-3',
            category: 'analysis',
            components: ['header-tab-stats', 'nav-item-stats', 'headerStatsContainer']
        },
        {
            id: 'synonyms',
            label: 'module.analysis.synonyms',
            icon: 'languages',
            category: 'analysis',
            components: ['toolSynonymsBtn']
        },
        {
            id: 'word-repetition',
            label: 'module.analysis.repetition',
            icon: 'repeat',
            category: 'analysis',
            components: ['toolRepetitionBtn']
        },

        // --- TOOLS ---
        {
            id: 'search',
            label: 'module.tools.search',
            icon: 'search',
            category: 'tools',
            components: ['sidebarSearch']
        },
        {
            id: 'import-export',
            label: 'module.tools.export',
            icon: 'download',
            category: 'tools',
            components: ['headerImportBtn']
        },
        {
            id: 'import-chapter',
            label: 'module.tools.import_chapter',
            icon: 'file-up',
            category: 'tools',
            components: ['headerImportBtn']
        },
        {
            id: 'colorpalette',
            label: 'module.tools.colors',
            icon: 'palette',
            category: 'tools',
            components: ['editorColorPalette']
        },

        // --- PERSONAL ---
        {
            id: 'globalnotes',
            label: 'module.personal.global_notes',
            icon: 'layout',
            category: 'personal',
            components: ['header-tab-globalnotes', 'nav-item-globalnotes']
        }
    ],

    // configurations prédéfinies (inclut les presets système et personnalisés)
    presets: [
        {
            id: 'zen',
            label: 'customizer.preset.zen',
            modules: ['project', 'ui', 'editor'],
            shortcuts: ['editor']
        },
        {
            id: 'writer',
            label: 'customizer.preset.writer',
            modules: ['project', 'ui', 'editor', 'globalnotes', 'characters'],
            shortcuts: ['project', 'editor', 'corkboard', 'globalnotes']
        },
        {
            id: 'full',
            label: 'customizer.preset.full',
            modules: [
                'project', 'ui', 'theme-manager', 'localization', 'storage', 'undo-redo', 'keyboard-shortcuts',
                'editor', 'focusMode', 'structure-blocks', 'narrative-overview', 'revision_feedback', 'front-matter',
                'corkboard', 'plot', 'plotgrid', 'timeline-metro', 'arc-board', 'thriller-board', 'investigation-board', 'mindmap', 'map', 'tension', 'relation-map',
                'characters', 'world', 'codex',
                'stats', 'synonyms', 'word-repetition',
                'search', 'import-export', 'import-chapter', 'colorpalette',
                'globalnotes'
            ],
            shortcuts: ['project', 'editor', 'corkboard', 'globalnotes', 'characters', 'world']
        }
    ],

    /**
     * Retourne la liste complète des presets (système + personnalisés)
     */
    getAllPresets: () => {
        const custom = InterfaceCustomizerRepository.loadCustomPresets();
        return [...InterfaceCustomizerModel.presets, ...custom];
    },

    // État par défaut (tout visible)
    getDefaultSettings: () => {
        const settings = {
            activeModules: InterfaceCustomizerModel.modules.map(m => m.id),
            mandatoryModules: ['project', 'ui', 'editor'],
            shortcuts: ['project', 'editor', 'corkboard', 'notes', 'characters', 'world'],
            currentPresetId: null,
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
