/**
 * [MVVM : App View Orchestrator]
 * Ce fichier coordonne les différentes vues de l'application et gère les side-effects globaux.
 */

// --- ÉTAT UI GLOBAL ---
let activeStatusFilters = ['draft', 'progress', 'complete', 'review'];
let currentStatusMenu = null;
let chapterScrollTrackingHandler = null;
let currentPageFormat = localStorage.getItem('plume_page_format') || 'none';
let isMobile = window.innerWidth <= 900;

// Update isMobile on resize
window.addEventListener('resize', () => {
    isMobile = window.innerWidth <= 900;
});

// --- DISPATCHER DE REPOSITORY ---

/**
 * Exécute les actions du repository retournées par un ViewModel.
 * Centralise toutes les mutations de données de l'application.
 */
function executeRepositorySideEffect(repoSideEffect) {
    if (!repoSideEffect) return;

    // Si on a un tableau d'actions
    if (Array.isArray(repoSideEffect)) {
        repoSideEffect.forEach(executeRepositorySideEffect);
        return;
    }

    const { action, collection, data, id, updates, actId, chapterId } = repoSideEffect;

    if (collection === 'acts') {
        if (action === 'ADD') ActRepository.add(data);
        else if (action === 'REMOVE') ActRepository.remove(id);
        else if (action === 'UPDATE') ActRepository.update(id, updates);
    }
    else if (collection === 'chapters') {
        if (action === 'ADD') ChapterRepository.add(actId, data);
        else if (action === 'REMOVE') ChapterRepository.remove(actId, id);
        else if (action === 'UPDATE') ChapterRepository.update(actId, id, updates);
    }
    else if (collection === 'scenes') {
        if (action === 'ADD') SceneRepository.add(actId, chapterId, data);
        else if (action === 'REMOVE') SceneRepository.remove(actId, chapterId, id);
        else if (action === 'UPDATE') SceneRepository.update(actId, chapterId, id, updates);
    }
}

// --- NAVIGATION & ROUTING ---

const NAVIGATION_GROUPS = [
    {
        title: 'sidebar.group.write',
        items: [
            { id: 'projects', icon: 'folder-open', label: 'nav.projects' },
            { id: 'editor', icon: 'pen-line', label: 'nav.ecriture' },
            { id: 'corkboard', icon: 'layout-grid', label: 'nav.corkboard' },
            { id: 'characters', icon: 'users', label: 'nav.characters' },
            { id: 'globalnotes', icon: 'layout', label: 'nav.globalnotes' },
            { id: 'front_matter', icon: 'book-open-check', label: 'nav.front_matter' }
        ]
    },
    {
        title: 'sidebar.group.analyze',
        items: [
            { id: 'plot', icon: 'trending-up', label: 'nav.plot' },
            { id: 'analysis', icon: 'scan-search', label: 'nav.analysis' },
            { id: 'stats', icon: 'bar-chart-3', label: 'nav.stats' }
        ]
    },
    {
        title: 'sidebar.group.construction',
        items: [
            { id: 'world', icon: 'globe', label: 'nav.world' },
            { id: 'codex', icon: 'book-open', label: 'nav.codex' },
            { id: 'notes', icon: 'sticky-note', label: 'nav.notes' },
            { id: 'arcs', icon: 'git-commit-horizontal', label: 'nav.arcs' },
            { id: 'investigation', icon: 'search', label: 'nav.investigation' },
            { id: 'mindmap', icon: 'git-branch', label: 'nav.mindmap' },
            { id: 'relations', icon: 'link', label: 'nav.relations' },
            { id: 'map', icon: 'map', label: 'nav.map' },
            { id: 'timelineviz', icon: 'clock', label: 'nav.timeline' },
            { id: 'versions', icon: 'history', label: 'nav.snapshots' }
        ]
    }
];

const NAVIGATION_ITEMS = NAVIGATION_GROUPS.flatMap(group => group.items);

function renderSidebarAccordion() {
    const container = document.getElementById('sidebarAccordionContent');
    if (!container) return;

    container.innerHTML = NAVIGATION_GROUPS.map(group => `
        <div class="accordion-group">
            <div class="accordion-group-title">
                ${Localization.t(group.title)}
            </div>
            <div class="accordion-group-items">
                ${group.items.map(item => `
                    <div class="accordion-nav-item" onclick="switchView('${item.id}')" id="nav-item-${item.id}" style="position: relative; padding-right: 48px;">
                        <i data-lucide="${item.icon}"></i>
                        <span data-i18n="${item.label}">${Localization.t(item.label)}</span>
                        <div class="accordion-item-actions">
                            <button class="treeview-action-btn" onclick="event.stopPropagation(); switchView('${item.id}', { forceNew: true })" title="${Localization.t('tabs.open_new')}">
                                <i data-lucide="plus-square"></i>
                            </button>
                            <button class="treeview-action-btn" onclick="event.stopPropagation(); switchView('${item.id}', { replaceCurrent: true })" title="${Localization.t('tabs.replace')}">
                                <i data-lucide="maximize-2"></i>
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function toggleSidebarAccordion() {
    const accordion = document.getElementById('sidebarAccordion');
    if (accordion) accordion.classList.toggle('open');
}

// Initial Render
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(renderSidebarAccordion, 100);
});

/*
 * Ferme tous les panneaux du toolsSidebar (versions, annotations, todos, arcs, plot).
 */
function closeAllToolsSidebarPanels() {
    // Fermer le panneau des versions
    const sidebarVersions = document.getElementById('sidebarVersions');
    const toolVersionsBtn = document.getElementById('toolVersionsBtn');
    const headerVersionsToggle = document.getElementById('headerVersionsToggle');
    if (sidebarVersions && !sidebarVersions.classList.contains('hidden')) {
        sidebarVersions.classList.add('hidden');
        if (toolVersionsBtn) toolVersionsBtn.classList.remove('active');
        if (headerVersionsToggle) headerVersionsToggle.classList.remove('active');
        if (typeof sceneVersionsSidebarVisible !== 'undefined') {
            sceneVersionsSidebarVisible = false;
        }
    }

    // Fermer le panneau des annotations
    if (typeof closeAnnotationsPanel === 'function') {
        closeAnnotationsPanel();
    }

    // Fermer le panneau des TODOs
    if (typeof closeTodosPanel === 'function') {
        closeTodosPanel();
    }

    // Fermer le panneau des arcs narratifs
    const arcScenePanel = document.getElementById('arcScenePanel');
    const toolArcsBtn = document.getElementById('toolArcsBtn');
    const sidebarArcsBtn = document.getElementById('sidebarArcsBtn');
    if (arcScenePanel && !arcScenePanel.classList.contains('hidden')) {
        arcScenePanel.classList.add('hidden');
        if (toolArcsBtn) toolArcsBtn.classList.remove('active');
        if (sidebarArcsBtn) sidebarArcsBtn.classList.remove('active');
    }

    // Fermer le panneau de l'intrigue (PlotGrid)
    const sidebarPlot = document.getElementById('sidebarPlot');
    const toolPlotBtn = document.getElementById('toolPlotBtn');
    const sidebarPlotBtn = document.getElementById('sidebarPlotBtn');
    if (sidebarPlot && !sidebarPlot.classList.contains('hidden')) {
        sidebarPlot.classList.add('hidden');
        if (toolPlotBtn) toolPlotBtn.classList.remove('active');
        if (sidebarPlotBtn) sidebarPlotBtn.classList.remove('active');
    }

    // Fermer le panneau de l'enquête (Investigation)
    const sidebarInvestigation = document.getElementById('sidebarInvestigation');
    const toolInvestigationBtn = document.getElementById('toolInvestigationBtn');
    const sidebarInvestigationBtn = document.getElementById('sidebarInvestigationBtn');
    if (sidebarInvestigation && !sidebarInvestigation.classList.contains('hidden')) {
        sidebarInvestigation.classList.add('hidden');
        if (toolInvestigationBtn) toolInvestigationBtn.classList.remove('active');
        if (sidebarInvestigationBtn) sidebarInvestigationBtn.classList.remove('active');
    }
}

/**
 * Change la vue principale de l'application.
 */
function switchView(view, options = {}) {
    // Si le système d'onglets est actif et que la vue le supporte
    if (typeof openTab === 'function' && viewSupportsTabs(view)) {
        openTab(view, {}, options);
        return;
    }

    // Si split view actif (Legacy), changer la vue du panneau actif
    if (splitViewActive) {
        if (typeof switchSplitPanelView === 'function') {
            switchSplitPanelView(splitActivePanel, view);
        }
        return;
    }

    // Fermer tous les panneaux du toolsSidebar quand on quitte la vue structure
    if (currentView === 'editor' && view !== 'editor') {
        closeAllToolsSidebarPanels();
    }

    currentView = view;

    // Update Navigation Accordion
    document.querySelectorAll('.accordion-nav-item').forEach(item => item.classList.remove('active'));
    const navItem = document.getElementById(`nav-item-${view}`);
    if (navItem) navItem.classList.add('active');

    // Update Sidebar Shortcuts
    document.querySelectorAll('.sidebar-shortcut-item').forEach(item => item.classList.remove('active'));
    const shortcutItem = document.querySelector(`.sidebar-shortcut-item[data-id="${view}"]`);
    if (shortcutItem) shortcutItem.classList.add('active');

    // Mettre à jour les listes et éléments de la sidebar
    syncSidebarWithView(view);

    // Update Accordion Title
    const currentNavItem = NAVIGATION_ITEMS.find(item => item.id === view);
    const titleEl = document.getElementById('currentViewTitle');
    if (titleEl && currentNavItem) {
        titleEl.textContent = Localization.t(currentNavItem.label);
    } else if (titleEl) {
        titleEl.textContent = Localization.t('nav.' + view) || view;
    }

    // Legacy header cleanup (optional, keeping for safety if referenced elsewhere)
    document.querySelectorAll('[id^="header-tab-"]').forEach(btn => {
        btn.classList.remove('active');
    });

    // Initial render of sidebar actions
    updateSidebarActions(view);

    // Hide plot sidebar when leaving editor
    if (view !== 'editor' && !splitViewActive) {
        document.getElementById('sidebarPlot')?.classList.add('hidden');
    }

    // Initial render of view content
    renderViewContent(view, 'editorView');

    // Live Tension Meter Visibility
    const tensionMeter = document.getElementById('liveTensionMeter');
    if (tensionMeter) {
        tensionMeter.style.display = (view === 'editor') ? 'flex' : 'none';
    }

    // Refresh icons and sidebar badges
    setTimeout(() => {
        if (typeof lucide !== 'undefined') lucide.createIcons();
        if (typeof ToolsSidebarViewModel !== 'undefined' && view === 'editor') {
            ToolsSidebarViewModel.updateAllBadges();
        }
    }, 50);
}

/**
 * Synchronise l'affichage des listes de la sidebar en fonction de la vue active.
 */
function syncSidebarWithView(view) {
    const listContainers = [
        'chaptersList', 'charactersList', 'worldList', 'notesList',
        'codexList', 'arcsList', 'statsList', 'versionsList',
        'analysisList', 'corkboardList', 'mindmapList', 'plotList',
        'relationsList', 'mapList', 'timelineVizList', 'investigationList',
        'globalnotesList', 'todosList', 'thrillerList', 'frontMatterList'
    ];

    // Cacher toutes les listes
    listContainers.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });

    // Afficher la liste correspondante
    let targetListId = null;
    switch (view) {
        case 'editor': targetListId = 'chaptersList'; break;
        case 'characters': targetListId = 'charactersList'; break;
        case 'world': targetListId = 'worldList'; break;
        case 'notes': targetListId = 'notesList'; break;
        case 'codex': targetListId = 'codexList'; break;
        case 'arcs': targetListId = 'arcsList'; break;
        case 'stats': targetListId = 'statsList'; break;
        case 'versions': targetListId = 'versionsList'; break;
        case 'analysis': targetListId = 'analysisList'; break;
        case 'corkboard': targetListId = 'corkboardList'; break;
        case 'mindmap': targetListId = 'mindmapList'; break;
        case 'plot': targetListId = 'plotList'; break;
        case 'relations': targetListId = 'relationsList'; break;
        case 'map': targetListId = 'mapList'; break;
        case 'timelineviz': targetListId = 'timelineVizList'; break;
        case 'investigation': targetListId = 'investigationList'; break;
        case 'globalnotes': targetListId = 'globalnotesList'; break;
        case 'todos': targetListId = 'todosList'; break;
        case 'thriller': targetListId = 'thrillerList'; break;
        case 'front_matter': targetListId = 'frontMatterList'; break;
    }

    if (targetListId) {
        const targetEl = document.getElementById(targetListId);
        if (targetEl) targetEl.style.display = 'block';

        // Refresh the list content based on view
        switch (view) {
            case 'editor':
                if (typeof renderActsList === 'function') renderActsList();
                break;
            case 'characters':
                if (typeof renderCharactersList === 'function') renderCharactersList();
                break;
            case 'world':
                if (typeof renderWorldList === 'function') renderWorldList();
                break;
            case 'notes':
                if (typeof renderNotesList === 'function') renderNotesList();
                break;
            case 'codex':
                if (typeof renderCodexList === 'function') renderCodexList();
                break;
            case 'front_matter':
                if (window.FrontMatterView && typeof window.FrontMatterView.renderSidebar === 'function') window.FrontMatterView.renderSidebar();
                break;
            case 'globalnotes':
                if (typeof renderGlobalNotesTree === 'function') {
                    const gnList = document.getElementById('globalnotesList');
                    if (gnList) gnList.innerHTML = renderGlobalNotesTree();
                }
                break;
            case 'mindmap':
                if (typeof renderMindmapList === 'function') renderMindmapList();
                break;
            case 'timelineviz':
                if (typeof renderTimelineVizList === 'function') renderTimelineVizList();
                break;
            case 'arcs':
                if (typeof renderArcsList === 'function') renderArcsList();
                break;
        }
    }

    // Gérer les filtres et barres de progression spécifiques
    const progressBar = document.getElementById('projectProgressBar');
    const statusFilters = document.getElementById('statusFilters');
    const treeCollapseToolbar = document.getElementById('treeCollapseToolbar');
    const sceneTools = document.getElementById('sceneTools');
    const toolsSidebar = document.getElementById('toolsSidebar');
    let tensionMeter = document.getElementById('liveTensionMeter');

    if (view === 'editor') {
        if (progressBar) progressBar.style.display = 'block';
        if (statusFilters) statusFilters.style.display = 'flex';
        if (treeCollapseToolbar) treeCollapseToolbar.style.display = 'flex';
        if (sceneTools) sceneTools.style.display = 'flex';
        if (toolsSidebar) {
            toolsSidebar.style.display = 'flex';
            if (typeof updateEditorToolsSidebar === 'function') updateEditorToolsSidebar();
        }

        // Ensure tension meter is visible and properly displayed
        if (!tensionMeter && typeof window.injectTensionMeter === 'function') {
            window.injectTensionMeter();
            tensionMeter = document.getElementById('liveTensionMeter');
        }
        if (tensionMeter) tensionMeter.style.display = 'flex';
    } else if (view === 'globalnotes') {
        if (progressBar) progressBar.style.display = 'none';
        if (statusFilters) statusFilters.style.display = 'none';
        if (treeCollapseToolbar) treeCollapseToolbar.style.display = 'none';
        if (sceneTools) sceneTools.style.display = 'none';
        if (tensionMeter) tensionMeter.style.display = 'none';
        if (toolsSidebar) {
            toolsSidebar.style.display = 'flex';
            if (typeof updateGNToolsSidebar === 'function') updateGNToolsSidebar();
        }
    } else {
        if (progressBar) progressBar.style.display = 'none';
        if (statusFilters) statusFilters.style.display = 'none';
        if (treeCollapseToolbar) treeCollapseToolbar.style.display = 'none';
        if (sceneTools) sceneTools.style.display = 'none';
        if (toolsSidebar) toolsSidebar.style.display = 'none';
        if (tensionMeter) tensionMeter.style.display = 'none';
    }

    // Message "pas de sidebar" si rien ne correspond
    const noSidebarMsg = document.getElementById('noSidebarMessage');
    if (!targetListId && noSidebarMsg) {
        noSidebarMsg.style.display = 'block';
        noSidebarMsg.innerHTML = `<div style="padding: 2rem; text-align: center; color: var(--text-muted); font-size: 0.85rem;">${Localization.t('sidebar.no_info') || 'Pas d\'informations pour cette vue'}</div>`;
    } else if (noSidebarMsg) {
        noSidebarMsg.style.display = 'none';
    }
}

/**
 * Updates the sidebar actions buttons based on current view.
 */
function updateSidebarActions(view) {
    const sidebarActions = document.getElementById('sidebarActions');
    if (!sidebarActions) return;

    let html = '';
    const v = view || currentView;

    switch (v) {
        case 'editor':
            html = `
                <button class="btn btn-primary" onclick="openAddActModal()">${Localization.t('btn.add_act')}</button>
                <button class="btn btn-primary" onclick="openAddChapterModal()">${Localization.t('btn.add_chapter')}</button>
                <button class="btn btn-primary" onclick="openAddSceneModalQuick()">${Localization.t('btn.add_scene')}</button>
            `;
            break;
        case 'characters':
            html = `<button class="btn btn-primary" onclick="openAddCharacterModal()">+ ${Localization.t('nav.characters')}</button>`;
            break;
        case 'world':
            html = `<button class="btn btn-primary" onclick="openAddWorldModal()">+ ${Localization.t('nav.world')}</button>`;
            break;
        case 'notes':
            html = `<button class="btn btn-primary" onclick="openAddNoteModal()">+ ${Localization.t('nav.notes')}</button>`;
            break;
        case 'codex':
            html = `<button class="btn btn-primary" onclick="openAddCodexModal()">+ ${Localization.t('nav.codex')}</button>`;
            break;
        case 'arcs':
            html = `<button class="btn btn-primary" onclick="createNewArc()">+ ${Localization.t('nav.arcs')}</button>`;
            break;
        case 'globalnotes':
            html = `
                <div class="sidebar-actions-container" style="padding: 8px 16px;">
                    <button class="btn btn-primary" style="width: 100%;" onclick="GlobalNotesView.addNewItem('board')">
                        <i data-lucide="plus"></i> ${Localization.t('globalnotes.action.add_board') || '+ Tableau'}
                    </button>
                </div>
            `;
            break;
        case 'front_matter':
            html = `
                <div style="display: flex; gap: 8px;">
                    <button class="btn btn-primary" onclick="FrontMatterView.openAddModal()" style="flex: 1;">+ ${Localization.t('front_matter.add_btn')}</button>
                    <button class="btn btn-secondary" onclick="FrontMatterView.openOrganizeModal()" style="padding: 10px;" title="${Localization.t('tool.tree.organize')}">
                        <i data-lucide="layers"></i>
                    </button>
                </div>
            `;
            break;
    }

    sidebarActions.innerHTML = html;
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

/**
 * Resets the vertical tools sidebar with GlobalNotes creation tools.
 */
function updateGNToolsSidebar() {
    const toolsSidebar = document.getElementById('toolsSidebar');
    if (!toolsSidebar) return;

    toolsSidebar.innerHTML = `
        <div class="tool-item">
            <button class="tool-btn" onclick="GlobalNotesView.addNewItem('board')" title="${Localization.t('globalnotes.tool.board')}"><i data-lucide="layout-grid"></i></button>
        </div>
        <div class="tool-item">
            <button class="tool-btn" onclick="GlobalNotesView.addNewItem('column')" title="${Localization.t('globalnotes.tool.column')}"><i data-lucide="columns"></i></button>
        </div>
        <div class="tool-item">
            <button class="tool-btn" onclick="GlobalNotesView.addNewItem('note')" title="${Localization.t('globalnotes.tool.note')}"><i data-lucide="sticky-note"></i></button>
        </div>
        <div class="tool-separator"></div>
        <div class="tool-item">
            <button class="tool-btn" onclick="GlobalNotesView.addNewItem('checklist')" title="${Localization.t('globalnotes.tool.checklist')}"><i data-lucide="list-checks"></i></button>
        </div>
        <div class="tool-item">
            <button class="tool-btn" onclick="GlobalNotesView.addNewItem('table')" title="${Localization.t('globalnotes.tool.table')}"><i data-lucide="table"></i></button>
        </div>
        <div class="tool-item">
            <button class="tool-btn" onclick="GlobalNotesView.addNewItem('sketch')" title="${Localization.t('globalnotes.tool.sketch')}"><i data-lucide="pen"></i></button>
        </div>
        <div class="tool-item">
            <button class="tool-btn" onclick="GlobalNotesView.addNewItem('line')" title="${Localization.t('globalnotes.tool.line')}"><i data-lucide="share-2"></i></button>
        </div>
        <div class="tool-separator"></div>
        <div class="tool-item">
            <button class="tool-btn" onclick="GlobalNotesView.addNewItem('image')" title="${Localization.t('globalnotes.tool.image')}"><i data-lucide="image"></i></button>
        </div>
        <div class="tool-item">
            <button class="tool-btn" onclick="GlobalNotesView.addNewItem('file')" title="${Localization.t('globalnotes.tool.file')}"><i data-lucide="upload"></i></button>
        </div>
        <div class="tool-item">
            <button class="tool-btn" onclick="GlobalNotesView.addNewItem('video')" title="${Localization.t('globalnotes.tool.video')}"><i data-lucide="video"></i></button>
        </div>
        <div class="tool-item">
            <button class="tool-btn" onclick="GlobalNotesView.addNewItem('link')" title="${Localization.t('globalnotes.tool.link')}"><i data-lucide="link"></i></button>
        </div>
        <div class="tool-item">
            <button class="tool-btn" onclick="GlobalNotesView.addNewItem('map')" title="${Localization.t('globalnotes.tool.map')}"><i data-lucide="map-pin"></i></button>
        </div>
        <div class="tool-item">
            <button class="tool-btn" onclick="GlobalNotesView.addNewItem('color')" title="${Localization.t('globalnotes.tool.color')}"><i data-lucide="palette"></i></button>
        </div>
    `;
    if (typeof lucide !== 'undefined') lucide.createIcons({ root: toolsSidebar });
}

/**
 * Resets the vertical tools sidebar with standard Editor tools.
 */
function updateEditorToolsSidebar() {
    const toolsSidebar = document.getElementById('toolsSidebar');
    if (!toolsSidebar) return;

    toolsSidebar.innerHTML = `
        <button class="tool-btn" onclick="toggleVersionsSidebar()" id="toolVersionsBtn" 
            title="${Localization.t('tools.versions') || 'Versions de scène'}">
            <i data-lucide="git-branch"></i>
            <span class="tool-badge" id="toolVersionsBadge" style="display: none">0</span>
        </button>
        <button class="tool-btn" onclick="toggleAnnotationsPanel()" id="toolAnnotationsBtn" 
            title="${Localization.t('tools.annotations') || 'Annotations'}">
            <i data-lucide="message-square"></i>
            <span class="tool-badge" id="toolAnnotationsBadge" style="display: none">0</span>
        </button>
        <button class="tool-btn" onclick="toggleTodosPanel()" id="toolTodosBtn" 
            title="${Localization.t('tools.todos') || 'TODOs'}">
            <i data-lucide="check-square"></i>
            <span class="tool-badge" id="toolTodosBadge" style="display: none">0</span>
        </button>
        <button class="tool-btn" onclick="toggleArcScenePanel()" id="toolArcsBtn" 
            title="${Localization.t('tools.arcs') || 'Arcs Narratifs'}">
            <i data-lucide="git-commit-horizontal"></i>
            <span class="tool-badge" id="toolArcsBadge" style="display: none">0</span>
        </button>
        <button class="tool-btn" onclick="PlotGridUI.toggleSidebar()" id="toolPlotBtn" 
            title="${Localization.t('tools.plot') || 'Plot Grid'}">
            <i data-lucide="layout-grid"></i>
            <span class="tool-badge" id="toolPlotBadge" style="display: none">0</span>
        </button>
        <button class="tool-btn" onclick="InvestigationSidebarUI.toggleSidebar()" id="toolInvestigationBtn"
            title="${Localization.t('tools.investigation') || 'Enquête'}">
            <i data-lucide="search"></i>
            <span class="tool-badge" id="toolInvestigationBadge" style="display: none">0</span>
        </button>
        <div style="width: 100%; height: 1px; background: var(--border-color); margin: 0.5rem 0"></div>
        <button class="tool-btn" onclick="toggleLinksPanelVisibility()" id="toolLinksPanelBtn"
            title="${Localization.t('tools.links') || 'Lien (Personnages, Univers, Timeline)'}">
            <i data-lucide="link-2"></i>
            <span class="tool-badge" id="toolLinksBadge" style="display: none">0</span>
        </button>
        <button class="tool-btn" onclick="toggleWordRepetitionPanel()" id="toolRepetitionBtn"
            title="${Localization.t('tools.repetition') || 'Analyseur de répétitions'}">
            <i data-lucide="repeat"></i>
        </button>
    `;

    if (typeof lucide !== 'undefined') lucide.createIcons({ root: toolsSidebar });

    // Immediately refresh badges
    if (typeof ToolsSidebarViewModel !== 'undefined') {
        ToolsSidebarViewModel.updateAllBadges();
    }
}

/**
 * Renders the boards as a nested treeview.
 */
function renderGlobalNotesTree() {
    if (typeof GlobalNotesRepository === 'undefined') return '';
    const boards = GlobalNotesRepository.getBoards();
    if (boards.length === 0) return '';

    // Step 1: Find roots (boards without parent or parent doesn't exist)
    const roots = boards.filter(b => !b.parentId || !boards.some(parent => parent.id === b.parentId));

    return roots.map(root => renderGNTreeItem(root, boards, 0)).join('');
}

function renderGNTreeItem(board, allBoards, level) {
    const isActive = GlobalNotesViewModel.state.activeBoardId === board.id;
    const children = allBoards.filter(b => b.parentId === board.id);
    const hasChildren = children.length > 0;

    return `
        <div class="gn-tree-node">
            <div class="gn-board-nav-item ${isActive ? 'active' : ''}" 
                 style="padding-left: ${12 + level * 12}px;"
                 onclick="GlobalNotesViewModel.setActiveBoard('${board.id}'); updateSidebarActions();">
                ${hasChildren ? '<i data-lucide="chevron-down" style="width: 12px; height: 12px; margin-right: -4px; opacity: 0.5;"></i>' : '<div style="width: 12px;"></div>'}
                <i data-lucide="${level === 0 ? 'home' : 'layout'}" style="width: 14px; height: 14px;"></i>
                <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1;">${board.title}</span>
            </div>
            ${hasChildren ? `<div class="gn-tree-children">${children.map(child => renderGNTreeItem(child, allBoards, level + 1)).join('')}</div>` : ''}
        </div>
    `;
}

// Ensure sidebar actions are updated when locale changes
window.addEventListener('localeChanged', () => {
    updateSidebarActions(currentView);
    refreshAllViews();
});

/**
 * Rend le contenu spécifique d'une vue dans un conteneur.
 */
function renderViewContent(view, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    switch (view) {
        case 'projects':
            if (typeof ProjectView !== 'undefined' && typeof ProjectView.renderLandingPage === 'function') {
                ProjectView.renderLandingPage(projects);
            }
            break;
        case 'editor':
            if (currentActId && currentChapterId && currentSceneId) {
                if (containerId === 'editorView' && !splitViewActive) {
                    const act = project.acts.find(a => a.id == currentActId);
                    if (act) {
                        const chapter = act.chapters.find(c => c.id == currentChapterId);
                        if (chapter) {
                            const scene = chapter.scenes.find(s => s.id == currentSceneId);
                            if (scene) {
                                if (typeof renderEditor === 'function') {
                                    renderEditor(act, chapter, scene);
                                    // Force refresh of links panel
                                    if (typeof autoDetectLinks === 'function') autoDetectLinks();
                                    if (typeof refreshLinksPanel === 'function') refreshLinksPanel();

                                    // Update Tension Meter
                                    if (typeof updateLiveTensionMeter === 'function' && scene.content) {
                                        const tempDiv = document.createElement('div');
                                        tempDiv.innerHTML = scene.content;
                                        updateLiveTensionMeter(tempDiv.innerText || tempDiv.textContent || '', { sceneId: scene.id, chapterId: chapter.id, actId: act.id });
                                    }

                                    return;
                                }
                            }
                        }
                    }
                } else if (typeof renderSceneInContainer === 'function') {
                    renderSceneInContainer(currentActId, currentChapterId, currentSceneId, containerId);
                    // Tension update for this case is handled in renderSceneInContainer (splitview/project view)
                    return;
                }
            }

            // État vide par défaut pour l'éditeur
            if (project.acts.length === 0 || (project.acts.length === 1 && project.acts[0].chapters.length === 0)) {
                container.innerHTML = `
                <div class="empty-state">
                        <div class="empty-state-icon"><i data-lucide="pencil" style="width:48px;height:48px;stroke-width:1;"></i></div>
                        <div class="empty-state-title">${Localization.t('empty.start')}</div>
                        <div class="empty-state-text">${Localization.t('empty.create_chapter')}</div>
                        <button class="btn btn-primary" onclick="openAddChapterModal()">${Localization.t('btn.create')}</button>
                    </div> `;
            } else {
                container.innerHTML = `
                <div class="empty-state">
                        <div class="empty-state-icon"><i data-lucide="pencil" style="width:48px;height:48px;stroke-width:1;"></i></div>
                        <div class="empty-state-title">${Localization.t('empty.select_scene')}</div>
                        <div class="empty-state-text">${Localization.t('empty.select_sidebar')}</div>
                    </div> `;
            }
            break;

        case 'characters':
            if (typeof renderCharactersList === 'function') renderCharactersList();
            if (typeof renderCharacterWelcome === 'function') renderCharacterWelcome();
            break;
        case 'world':
            if (typeof renderWorldList === 'function') renderWorldList();
            if (typeof renderWorldWelcome === 'function') renderWorldWelcome();
            break;
        case 'notes':
            if (typeof renderNotesList === 'function') renderNotesList();
            if (typeof renderNotesWelcome === 'function') renderNotesWelcome();
            break;
        case 'codex':
            if (typeof renderCodexList === 'function') renderCodexList();
            if (typeof renderCodexWelcome === 'function') renderCodexWelcome();
            break;
        case 'stats': if (typeof renderStats === 'function') renderStats(); break;
        case 'analysis': if (typeof renderAnalysis === 'function') renderAnalysis(); break;
        case 'versions': if (typeof renderVersionsList === 'function') renderVersionsList(); break;
        case 'todos': if (typeof renderTodosList === 'function') renderTodosList(); break;
        case 'corkboard': if (typeof openCorkBoardView === 'function') openCorkBoardView(); break;
        case 'mindmap': if (typeof renderMindmapView === 'function') renderMindmapView(); break;
        case 'plot': if (typeof renderPlotView === 'function') renderPlotView(); break;
        case 'relations': if (typeof renderRelationsView === 'function') renderRelationsView(); break;
        case 'map': if (typeof renderMapView === 'function') renderMapView(); break;
        case 'timelineviz': if (typeof renderTimelineVizView === 'function') renderTimelineVizView(); break;
        case 'arcs':
            if (typeof renderArcsList === 'function') renderArcsList();
            if (typeof renderArcsWelcome === 'function') renderArcsWelcome();
            break;
        case 'timeline': if (typeof renderTimelineList === 'function') renderTimelineList(); break;
        case 'storygrid': if (typeof renderStoryGrid === 'function') renderStoryGrid(); break;
        case 'thriller': if (typeof renderThrillerBoard === 'function') renderThrillerBoard(); break;
        case 'investigation': if (typeof renderInvestigationBoard === 'function') renderInvestigationBoard(); break;
        case 'globalnotes': if (typeof renderGlobalNotes === 'function') renderGlobalNotes(); break;
        case 'front_matter':
            if (window.FrontMatterView) {
                window.FrontMatterView.render(containerId);
            }
            break;
        default:
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon"><i data-lucide="layout" style="width:48px;height:48px;stroke-width:1;"></i></div>
                    <div class="empty-state-title">Panneau vide</div>
                    <div class="empty-state-text">Cliquez sur l'en-tête pour choisir une vue</div>
                </div> `;
            break;
    }
}

/**
 * Rafraîchit toutes les vues de l'application (utile après undo/redo ou import).
 */
function refreshAllViews() {
    // 0. Rafraîchir les données d'enquête si présentes
    if (typeof InvestigationStore !== 'undefined') {
        try { InvestigationStore.load(); } catch (e) { console.error('Error loading InvestigationStore:', e); }
    }

    // 1. Rafraîchir la structure (sidebar editor)
    if (typeof renderActsList === 'function') renderActsList();

    // 2. Restaurer l'état de l'arborescence
    setTimeout(() => {
        if (typeof restoreTreeState === 'function') restoreTreeState();
    }, 100);

    // 3. Rafraîchir les stats
    if (typeof updateStats === 'function') updateStats();

    // 4. Rafraîchir la vue actuelle
    // 4. Rafraîchir la vue actuelle
    // 4. Rafraîchir la vue actuelle
    let viewHandled = false;

    // A. Split View (Legacy)
    if (typeof splitViewActive !== 'undefined' && splitViewActive) {
        if (typeof renderSplitView === 'function') {
            renderSplitView();
            viewHandled = true;
        }
    }
    // B. Tabs System (New)
    else if (typeof tabsState !== 'undefined' && tabsState.panes && (tabsState.panes.left.tabs.length > 0 || tabsState.panes.right.tabs.length > 0)) {
        if (typeof renderTabs === 'function') {
            renderTabs();
            viewHandled = true;
        }
    }

    if (!viewHandled) {
        switch (currentView) {
            case 'editor': if (typeof renderActsList === 'function') renderActsList(); break;
            case 'characters': if (typeof renderCharactersList === 'function') renderCharactersList(); break;
            case 'world': if (typeof renderWorldList === 'function') renderWorldList(); break;
            case 'timeline': if (typeof renderTimelineList === 'function') renderTimelineList(); break;
            case 'notes': if (typeof renderNotesList === 'function') renderNotesList(); break;
            case 'codex': if (typeof renderCodexList === 'function') renderCodexList(); break;
            case 'stats': if (typeof renderStats === 'function') renderStats(); break;
            case 'analysis': if (typeof renderAnalysis === 'function') renderAnalysis(); break;
            case 'versions': if (typeof renderVersionsList === 'function') renderVersionsList(); break;
            case 'todos': if (typeof renderTodosList === 'function') renderTodosList(); break;
            case 'corkboard': if (typeof openCorkBoardView === 'function') openCorkBoardView(); break;
            case 'mindmap': if (typeof renderMindmapView === 'function') renderMindmapView(); break;
            case 'plot': if (typeof renderPlotView === 'function') renderPlotView(); break;
            case 'plotgrid': if (typeof renderViewContent === 'function') renderViewContent('plotgrid', 'editorView'); break;
            case 'relations': if (typeof renderRelationsView === 'function') renderRelationsView(); break;
            case 'map': if (typeof renderMapView === 'function') renderMapView(); break;
            case 'timelineviz': if (typeof renderTimelineVizView === 'function') renderTimelineVizView(); break;
            case 'arcs': if (typeof renderArcsList === 'function') renderArcsList(); break;
            case 'investigation': if (typeof renderInvestigationBoard === 'function') renderInvestigationBoard(); break;
            case 'globalnotes': if (typeof renderGlobalNotes === 'function') renderGlobalNotes(); break;
            case 'front_matter': if (window.FrontMatterView) window.FrontMatterView.render(); break;
            case 'projects': if (typeof ProjectView !== 'undefined' && typeof ProjectView.renderLandingPage === 'function') ProjectView.renderLandingPage(projects); break;
        }
    }

    // 5. Rafraîchir l'éditeur si une scène est ouverte
    if (currentSceneId) {
        const scene = typeof findScene === 'function' ? findScene(currentActId, currentChapterId, currentSceneId) : null;
        if (scene) {
            const titleEl = document.getElementById('sceneTitle');
            const contentEl = document.getElementById('sceneContent');
            if (titleEl) titleEl.value = scene.title;
            if (contentEl) contentEl.value = scene.content || '';
            if (typeof updateWordCount === 'function') updateWordCount();
        }
    }

    const isMobileView = window.innerWidth <= 900;
    const sidebarViewsWithConfig = ['editor', 'characters', 'world', 'notes', 'codex', 'arcs', 'thriller', 'map', 'investigation', 'globalnotes'];
    if (isMobileView && sidebarViewsWithConfig.includes(currentView) && typeof renderMobileSidebarView === 'function') {
        renderMobileSidebarView(currentView);
    }

    // 7. Rafraîchir le format de page
    // Nettoyage historique : updatePageFormatUI n'existe plus
}

// --- GOOGLE FONTS SUPPORT ---

const POPULAR_GOOGLE_FONTS = [
    "Merriweather", "Roboto", "Open Sans", "Lato", "Montserrat", "Oswald", "Raleway", "Noto Sans", "Poppins", "Nunito",
    "Playfair Display", "Rubik", "Mukta", "Lora", "Work Sans", "Nunito Sans", "Fira Sans", "Quicksand", "Inter", "Barlow",
    "PT Serif", "PT Sans", "Inconsolata", "Kanit", "Exo 2", "Titillium Web", "Crimson Pro", "Libre Baskerville", "Arvo",
    "Josefin Sans", "Anton", "Bitter", "Dosis", "Teko", "Oxygen", "Cabin", "Hind", "Patua One", "Muli", "Abel", "Varela Round",
    "Pacifico", "Dancing Script", "Shadows Into Light", "Indie Flower", "Amatic SC", "Caveat", "Satisfy", "Great Vibes", "Sacramento",
    "Space Mono", "Source Code Pro", "IBM Plex Mono", "Ubuntu Mono", "Courier New", "Georgia", "Times New Roman", "Verdana", "Arial"
].sort();

function loadGoogleFont(fontName) {
    if (!fontName) return;
    const linkId = `font - ${fontName.replace(/\s+/g, '-').toLowerCase()} `;
    if (!document.getElementById(linkId)) {
        const link = document.createElement('link');
        link.id = linkId;
        link.rel = 'stylesheet';
        link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/\s+/g, '+')}:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400;1,700&display=swap`;
        document.head.appendChild(link);
    }
}

function applyFont(fontName, panel = null) {
    if (fontName === 'custom') {
        const customFont = prompt(Localization.t('prompt.custom_font'));
        if (customFont && customFont.trim()) {
            const cleanFontName = customFont.trim();
            loadGoogleFont(cleanFontName);
            // Add option to select if not exists
            const selects = document.querySelectorAll('.font-family-selector');
            selects.forEach(select => {
                // Check duplicate
                let exists = false;
                for (let i = 0; i < select.options.length; i++) {
                    if (select.options[i].value === cleanFontName) exists = true;
                }
                if (!exists) {
                    const opt = document.createElement('option');
                    opt.value = cleanFontName;
                    opt.text = cleanFontName;
                    // Insert before the last option "Autre..."
                    if (select.options.length > 0) {
                        select.add(opt, select.options[select.options.length - 1]);
                    } else {
                        select.add(opt);
                    }
                    select.value = cleanFontName;
                } else {
                    select.value = cleanFontName;
                }
            });

            if (panel) {
                if (typeof formatTextInPanel === 'function') formatTextInPanel(panel, 'fontName', cleanFontName);
            } else {
                if (typeof formatText === 'function') formatText('fontName', cleanFontName);
            }
        } else {
            // Reset select to default or previous? For now do nothing
        }
    } else {
        // Standard fonts usually don't need loading, but we load everything in our list just in case it's a google font version
        // Except standard websafe fonts
        const standardFonts = ["Arial", "Georgia", "Times New Roman", "Courier New", "Verdana", "Garamond", "Palatino"];
        if (!standardFonts.includes(fontName)) {
            loadGoogleFont(fontName);
        }

        if (panel) {
            if (typeof formatTextInPanel === 'function') formatTextInPanel(panel, 'fontName', fontName);
        } else {
            if (typeof formatText === 'function') formatText('fontName', fontName);
        }
    }
}


/**
 * Ouvre tout le livre et affiche tous les actes, chapitres et scènes de manière séquentielle.
 */
function openFullBook(options = {}) {
    if (window.innerWidth <= 900 && typeof closeMobileSidebar === 'function') {
        closeMobileSidebar();
    }

    if (typeof saveToHistoryImmediate === 'function') saveToHistoryImmediate();

    currentActId = 'all';
    currentChapterId = null;
    currentSceneId = null;

    // Mise à jour visuelle sidebar
    document.querySelectorAll('.act-header, .chapter-header, .scene-item').forEach(el => el.classList.remove('active'));
    const fullBookItem = document.querySelector('#full-book-item .act-header');
    if (fullBookItem) fullBookItem.classList.add('active');

    // Gestion Onglets (Préféré)
    if (typeof openTab === 'function') {
        openTab('editor', { actId: 'all' }, options);
        return;
    }

    // Rendu de l'éditeur complet
    if (typeof renderFullBookEditor === 'function') {
        renderFullBookEditor();
    }
}

/**
 * Ouvre un acte complet et affiche tous ses chapitres et scènes de manière séquentielle.
 */
function openAct(actId, options = {}) {
    if (window.innerWidth <= 900 && typeof closeMobileSidebar === 'function') {
        closeMobileSidebar();
    }

    if (typeof saveToHistoryImmediate === 'function') saveToHistoryImmediate();

    currentActId = actId;
    currentChapterId = null; // Mode acte, pas de chapitre unique
    currentSceneId = null; // Mode acte, pas de scène unique

    const act = project.acts.find(a => a.id === actId);

    if (!act || !act.chapters || act.chapters.length === 0) return;

    // Vérifier s'il y a au moins une scène dans l'acte
    const hasScenes = act.chapters.some(ch => ch.scenes && ch.scenes.length > 0);
    if (!hasScenes) return;

    // Mise à jour visuelle sidebar
    document.querySelectorAll('.act-header, .chapter-header, .scene-item').forEach(el => el.classList.remove('active'));
    const actElement = document.getElementById(`act-${actId}`);
    if (actElement) {
        actElement.querySelector('.act-header')?.classList.add('active');

        // Auto-expand l'acte
        actElement.querySelector('.act-icon')?.classList.add('expanded');
        actElement.querySelector('.act-chapters')?.classList.add('visible');

        // Mettre à jour l'état mémorisé (indispensable pour que ça reste ouvert au prochain rendu)
        if (typeof expandedActs !== 'undefined') expandedActs.add(actId);
    }

    // Gestion Onglets (Préféré)
    if (typeof openTab === 'function') {
        openTab('editor', { actId }, options);
        return;
    }

    // Rendu de l'éditeur d'acte
    if (typeof renderActEditor === 'function') {
        renderActEditor(act);
    }
}

/**
 * Ouvre un chapitre complet et affiche toutes ses scènes de manière séquentielle.
 */
function openChapter(actId, chapterId, options = {}) {
    if (window.innerWidth <= 900 && typeof closeMobileSidebar === 'function') {
        closeMobileSidebar();
    }

    if (typeof saveToHistoryImmediate === 'function') saveToHistoryImmediate();

    currentActId = actId;
    currentChapterId = chapterId;
    currentSceneId = null; // Mode chapitre, pas de scène unique

    const act = project.acts.find(a => a.id === actId);
    const chapter = act ? act.chapters.find(c => c.id === chapterId) : null;

    if (!chapter || !chapter.scenes || chapter.scenes.length === 0) return;

    // Mise à jour visuelle sidebar
    document.querySelectorAll('.act-header, .chapter-header, .scene-item').forEach(el => el.classList.remove('active'));
    const chapterElement = document.getElementById(`chapter-${chapterId}`);
    if (chapterElement) {
        chapterElement.querySelector('.chapter-header')?.classList.add('active');

        // Auto-expand parents
        chapterElement.querySelector('.chapter-icon')?.classList.add('expanded');
        chapterElement.querySelector('.scenes-list')?.classList.add('visible');

        const actElement = document.getElementById(`act-${actId}`);
        if (actElement) {
            actElement.querySelector('.act-icon')?.classList.add('expanded');
            actElement.querySelector('.act-chapters')?.classList.add('visible');
            if (typeof expandedActs !== 'undefined') expandedActs.add(actId);
        }
        if (typeof expandedChapters !== 'undefined') expandedChapters.add(chapterId);
    }

    // Gestion Onglets (Préféré)
    if (typeof openTab === 'function') {
        openTab('editor', { actId, chapterId }, options);
        return;
    }

    // Rendu de l'éditeur de chapitre
    if (typeof renderChapterEditor === 'function') {
        renderChapterEditor(act, chapter);
    }
}

/**
 * Ouvre une scène spécifique et gère toute l'orchestration associée.
 */
function openScene(actId, chapterId, sceneId, options = {}) {
    // Nettoyer le tracking de scroll du mode chapitre
    if (typeof cleanupChapterScrollTracking === 'function') cleanupChapterScrollTracking();

    if (window.innerWidth <= 900 && typeof closeMobileSidebar === 'function') {
        closeMobileSidebar();
    }

    if (typeof saveToHistoryImmediate === 'function') saveToHistoryImmediate();

    currentActId = actId;
    currentChapterId = chapterId;
    currentSceneId = sceneId;

    const act = project.acts.find(a => a.id == actId);
    const chapter = act ? act.chapters.find(c => c.id == chapterId) : null;
    const scene = chapter ? chapter.scenes.find(s => s.id == sceneId) : null;

    if (!scene) {
        console.error(`[openScene] Scène introuvable : ${actId}, ${chapterId}, ${sceneId}`);
        return;
    }

    // Mise à jour visuelle sidebar
    document.querySelectorAll('.act-header, .chapter-header, .scene-item').forEach(el => el.classList.remove('active'));
    const sceneElement = document.querySelector(`[data-scene-id="${sceneId}"]`);
    if (sceneElement) {
        sceneElement.classList.add('active');

        // Auto-expand parents
        const chapterElement = document.getElementById(`chapter-${chapterId}`);
        if (chapterElement) {
            chapterElement.querySelector('.chapter-icon')?.classList.add('expanded');
            chapterElement.querySelector('.scenes-list')?.classList.add('visible');
        }
        const actElement = document.getElementById(`act-${actId}`);
        if (actElement) {
            actElement.querySelector('.act-icon')?.classList.add('expanded');
            actElement.querySelector('.act-chapters')?.classList.add('visible');
            if (typeof expandedActs !== 'undefined') expandedActs.add(actId);
        }
        if (typeof expandedChapters !== 'undefined') expandedChapters.add(chapterId);
    }

    const orchestratePostOpen = (s) => {
        if (typeof autoDetectLinks === 'function') autoDetectLinks();
        if (typeof refreshLinksPanel === 'function') refreshLinksPanel();
        if (typeof renderSceneVersionsList === 'function') renderSceneVersionsList();

        // Update arc scene panel if it's visible
        const arcPanel = document.getElementById('arcScenePanel');
        if (arcPanel && !arcPanel.classList.contains('hidden') && typeof renderArcScenePanel === 'function') {
            renderArcScenePanel();
        }

        // Refresh plot sidebar if open
        if (typeof PlotGridUI !== 'undefined' && !document.getElementById('sidebarPlot').classList.contains('hidden')) {
            PlotGridUI.renderSidebar(sceneId);
        }

        // Refresh investigation sidebar if open
        if (typeof InvestigationSidebarUI !== 'undefined' && !document.getElementById('sidebarInvestigation').classList.contains('hidden')) {
            InvestigationSidebarUI.renderSidebar(sceneId);
        }

        // Annotations automatic opening
        const annotations = typeof getVersionAnnotations === 'function' ? getVersionAnnotations(s) : [];
        if (annotations && annotations.length > 0 && window.innerWidth > 900) {
            if (typeof renderAnnotationsPanel === 'function') renderAnnotationsPanel();
            if (typeof updateAnnotationsButton === 'function') updateAnnotationsButton(true);
        } else {
            document.getElementById('annotationsPanel')?.classList.add('hidden');
            if (typeof updateAnnotationsButton === 'function') updateAnnotationsButton(false);
        }

        // Always update all tools sidebar badges on scene open
        if (typeof ToolsSidebarViewModel !== 'undefined') {
            ToolsSidebarViewModel.updateAllBadges();
        }
    };

    // Gestion Onglets (Préféré)
    if (typeof openTab === 'function') {
        openTab('editor', { actId, chapterId, sceneId }, options);
        orchestratePostOpen(scene);
        return;
    }

    // Gestion Split View vs Normal (Legacy)
    if (splitViewActive && typeof renderSplitPanelViewContent === 'function') {
        let editorPanel = splitViewState.left.view === 'editor' ? 'left' : (splitViewState.right.view === 'editor' ? 'right' : null);
        const panel = editorPanel || splitActivePanel;
        const state = panel === 'left' ? splitViewState.left : splitViewState.right;
        state.view = 'editor';
        state.sceneId = sceneId; state.actId = actId; state.chapterId = chapterId;
        renderSplitPanelViewContent(panel);
        splitActivePanel = panel;
        if (typeof saveSplitViewState === 'function') saveSplitViewState();
    } else if (typeof renderEditor === 'function') {
        renderEditor(act, chapter, scene);
    }

    orchestratePostOpen(scene);
}

// --- UTILITAIRES DE L'ARBORESCENCE (TREEVIEW) ---

function expandAllTree() {
    document.querySelectorAll('.act-group, .chapter-group').forEach(group => {
        group.querySelector('.act-icon, .chapter-icon')?.classList.add('expanded');
        group.querySelector('.act-chapters, .scenes-list')?.classList.add('visible');
    });

    document.querySelectorAll('.act-group').forEach(el => expandedActs.add(parseInt(el.dataset.actId)));
    document.querySelectorAll('.chapter-group').forEach(el => expandedChapters.add(parseInt(el.dataset.chapterId)));

    // Treeview groups (Univers, Codex, etc.)
    document.querySelectorAll('.treeview-group').forEach(group => {
        group.querySelector('.treeview-children')?.classList.remove('collapsed');
        group.querySelector('.treeview-chevron')?.setAttribute('data-lucide', 'chevron-down');
    });

    if (typeof renderNotesList === 'function') {
        expandedNoteCategories = new Set(['Idée', 'Recherche', 'Référence', 'A faire', 'Question', 'Autre']);
        renderNotesList();
    }

    if (typeof ActRepository?.saveTreeState === 'function') ActRepository.saveTreeState();
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function collapseAllTree() {
    document.querySelectorAll('.act-icon, .chapter-icon').forEach(el => el.classList.remove('expanded'));
    document.querySelectorAll('.act-chapters, .scenes-list').forEach(el => el.classList.remove('visible'));

    expandedActs.clear();
    expandedChapters.clear();

    document.querySelectorAll('.treeview-children').forEach(el => el.classList.add('collapsed'));
    document.querySelectorAll('.treeview-chevron').forEach(el => el.setAttribute('data-lucide', 'chevron-right'));

    if (typeof renderNotesList === 'function') {
        expandedNoteCategories.clear();
        renderNotesList();
    }

    if (typeof ActRepository?.saveTreeState === 'function') ActRepository.saveTreeState();
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function restoreTreeState() {
    expandedActs.forEach(id => {
        const el = document.getElementById(`act-${id}`);
        if (el) {
            el.querySelector('.act-icon')?.classList.add('expanded');
            el.querySelector('.act-chapters')?.classList.add('visible');
        }
    });
    expandedChapters.forEach(id => {
        const el = document.getElementById(`chapter-${id}`);
        if (el) {
            el.querySelector('.chapter-icon')?.classList.add('expanded');
            el.querySelector('.scenes-list')?.classList.add('visible');
        }
    });
}

// --- UTILITAIRES UI GLOBAUX ---

function closeModal(modalId) {
    document.getElementById(modalId)?.classList.remove('active');
}

function openModal(modalId) {
    document.getElementById(modalId)?.classList.add('active');
}


function openProjectsModal() {
    if (typeof renderProjectsList === 'function') renderProjectsList();
    document.getElementById('projectsModal')?.classList.add('active');
}


function toggleStatusFilter(status) {
    const index = activeStatusFilters.indexOf(status);
    const btn = document.querySelector(`.status-filter-btn[data-status="${status}"]`);

    if (index > -1) {
        activeStatusFilters.splice(index, 1);
        btn?.classList.remove('active');
    } else {
        activeStatusFilters.push(status);
        btn?.classList.add('active');
    }

    if (typeof applyStatusFilters === 'function') applyStatusFilters();
}

/**
 * [MVVM : View]
 * Définit la scène active pour les outils de la barre latérale.
 * Utile pour les vues séquentielles (Acte/Chapitre) où plusieurs scènes sont affichées.
 */
function setActiveScene(actId, chapterId, sceneId) {
    if (currentSceneId === sceneId) return;

    currentActId = actId;
    currentChapterId = chapterId;
    currentSceneId = sceneId;

    // Mettre à jour les titres et breadcrumbs si on est en vue Acte ou Chapitre
    let act = null;
    let chapter = null;
    let scene = null;

    if (actId === 'all') {
        project.acts.some(a => {
            const ch = a.chapters.find(c => c.id === chapterId);
            if (ch) {
                act = a;
                chapter = ch;
                scene = ch.scenes.find(s => s.id === sceneId);
                return true;
            }
            return false;
        });
    } else {
        act = project.acts.find(a => a.id === actId);
        chapter = act?.chapters.find(c => c.id === chapterId);
        scene = chapter?.scenes.find(s => s.id === sceneId);
    }

    if (scene) {
        // En vue chapitre
        const chapterTitleEl = document.getElementById('chapterEditorTitle');
        if (chapterTitleEl) chapterTitleEl.textContent = scene.title;

        // En vue acte
        const actTitleEl = document.getElementById('actEditorTitle');
        if (actTitleEl) actTitleEl.textContent = scene.title;

        const breadcrumbEl = document.querySelector('.act-editor-header .editor-breadcrumb');
        if (breadcrumbEl && act && chapter) {
            breadcrumbEl.textContent = `${act.title} › ${chapter.title}`;
        }

        // Mettre à jour les indicateurs de navigation (points sur le côté ou segments)
        const dots = document.querySelectorAll('.scene-nav-dot');
        dots.forEach(dot => {
            dot.classList.remove('active');
            if (dot.getAttribute('onclick')?.includes(scene.id)) {
                dot.classList.add('active');
            }
        });

        const segments = document.querySelectorAll('.progress-scene-segment');
        segments.forEach(seg => {
            seg.classList.remove('active');
            if (seg.dataset.sceneId == scene.id) {
                seg.classList.add('active');
            }
        });
    }
    // Mettre à jour les indicateurs visuels des sidebars si ouverts

    // 1. Versions
    if (typeof renderSceneVersionsList === 'function' && !document.getElementById('sidebarVersions').classList.contains('hidden')) {
        renderSceneVersionsList();
    }

    // 2. Annotations
    if (typeof renderAnnotationsPanel === 'function' && !document.getElementById('annotationsPanel').classList.contains('hidden')) {
        renderAnnotationsPanel();
    }

    // 3. Arcs
    if (typeof renderArcScenePanel === 'function' && !document.getElementById('arcScenePanel').classList.contains('hidden')) {
        renderArcScenePanel();
    }

    // 4. Plot Grid Sidebar
    if (typeof PlotGridUI !== 'undefined' && typeof PlotGridUI.renderSidebar === 'function' && !document.getElementById('sidebarPlot').classList.contains('hidden')) {
        PlotGridUI.renderSidebar(sceneId);
    }

    // Always update all tools sidebar badges
    if (typeof ToolsSidebarViewModel !== 'undefined') {
        ToolsSidebarViewModel.updateAllBadges();
    }

    // 5. Liens (Characters, World, etc.)
    if (typeof refreshLinksPanel === 'function') {
        refreshLinksPanel();
    }

    // Mettre à jour le badge d'annotations dans la sidebar
    if (typeof updateAnnotationsButton === 'function') {
        updateAnnotationsButton(false);
    }

    // Mettre à jour l'indicateur de tension si disponible
    const editor = document.querySelector(`.editor-textarea[data-scene-id="${sceneId}"]`);
    if (editor && typeof updateLiveTensionMeter === 'function') {
        updateLiveTensionMeter(editor.innerHTML, { actId, chapterId, sceneId });
    }
}

// --- EDITOR RENDERING ---

/**
 * [MVVM : View]
 * Retourne le HTML complet de la barre d'outils de l'éditeur.
 * @param {string} [panel] - Si présent, utilise formatTextInPanel au lieu de formatText
 */
function getEditorToolbarHTML(panel = null, hideExtraTools = false) {
    const fnName = panel ? 'formatTextInPanel' : 'formatText';
    const fnPrefix = panel ? `'${panel}', ` : '';
    const idSuffix = panel ? `-${panel}` : '';

    return `
        <!-- Basic formatting -->
        <div class="toolbar-group">
            <button class="toolbar-btn" data-format="bold" onmousedown="event.preventDefault()" onclick="${fnName}(${fnPrefix}'bold')" title="${Localization.t('toolbar.bold')}">
                <i data-lucide="bold" style="width:14px;height:14px;"></i>
            </button>
            <button class="toolbar-btn" data-format="italic" onmousedown="event.preventDefault()" onclick="${fnName}(${fnPrefix}'italic')" title="${Localization.t('toolbar.italic')}">
                <i data-lucide="italic" style="width:14px;height:14px;"></i>
            </button>
            <button class="toolbar-btn" data-format="underline" onmousedown="event.preventDefault()" onclick="${fnName}(${fnPrefix}'underline')" title="${Localization.t('toolbar.underline')}">
                <i data-lucide="underline" style="width:14px;height:14px;"></i>
            </button>
            <button class="toolbar-btn" data-format="strikethrough" onmousedown="event.preventDefault()" onclick="${fnName}(${fnPrefix}'strikeThrough')" title="${Localization.t('toolbar.strikethrough')}">
                <i data-lucide="strikethrough" style="width:14px;height:14px;"></i>
            </button>
        </div>
        
        <!-- Font family and size -->
        <div class="toolbar-group">
            <select class="font-family-selector" onchange="applyFont(this.value, ${panel ? `'${panel}'` : 'null'})" title="${Localization.t('toolbar.font_family')}" style="max-width: 150px;">
                ${POPULAR_GOOGLE_FONTS.map(font => `<option value="${font}" style="font-family: '${font}', sans-serif;">${font}</option>`).join('')}
                <option value="" disabled>──────────</option>
                <option value="custom" style="font-weight: bold; color: var(--accent-color);">${Localization.t('toolbar.font_other')}</option>
            </select>
            <select class="font-size-selector" onchange="${fnName}(${fnPrefix}'fontSize', this.value)" title="${Localization.t('toolbar.font_size')}">
                <option value="1">${Localization.t('toolbar.font_size.v1')}</option>
                <option value="2">${Localization.t('toolbar.font_size.v2')}</option>
                <option value="3" selected>${Localization.t('toolbar.font_size.v3')}</option>
                <option value="4">${Localization.t('toolbar.font_size.v4')}</option>
                <option value="5">${Localization.t('toolbar.font_size.v5')}</option>
                <option value="6">${Localization.t('toolbar.font_size.v6')}</option>
                <option value="7">${Localization.t('toolbar.font_size.v7')}</option>
            </select>
        </div>
        
        <!-- Text color -->
        <div class="toolbar-group">
            <div class="color-picker-wrapper">
                <button class="toolbar-btn" onmousedown="event.preventDefault()" onclick="toggleColorPicker('text', event, ${panel ? `'${panel}'` : 'null'})" title="${Localization.t('toolbar.color_text')}">
                    <i data-lucide="baseline" style="width:14px;height:14px; border-bottom: 2px solid currentColor;"></i>
                </button>
                <div class="color-picker-dropdown" id="textColorPicker${idSuffix}">
                    <div class="color-picker-header">
                        <i data-lucide="palette"></i>
                        <span>${Localization.t('toolbar.color_text')}</span>
                    </div>
                    <div class="color-grid" id="textColorGrid${idSuffix}"></div>
                    <div class="color-input-wrapper">
                        <div class="color-manual-input">
                            <input type="color" id="textColorInput${idSuffix}" onchange="applyTextColor(this.value, ${panel ? `'${panel}'` : 'null'})">
                            <input type="text" id="textColorHex${idSuffix}" placeholder="${Localization.t('toolbar.color_hex_placeholder')}" maxlength="7" onchange="applyTextColor(this.value, ${panel ? `'${panel}'` : 'null'})">
                        </div>
                        <button class="color-reset-btn" onmousedown="event.preventDefault()" onclick="applyTextColor('', ${panel ? `'${panel}'` : 'null'})" title="${Localization.t('toolbar.color_reset')}">
                            <i data-lucide="rotate-ccw"></i>
                        </button>
                    </div>
                </div>
            </div>
            <div class="color-picker-wrapper">
                <button class="toolbar-btn" onmousedown="event.preventDefault()" onclick="toggleColorPicker('background', event, ${panel ? `'${panel}'` : 'null'})" title="${Localization.t('toolbar.color_bg')}">
                    <i data-lucide="highlighter" style="width:14px;height:14px; border-bottom: 2px solid yellow;"></i>
                </button>
                <div class="color-picker-dropdown" id="backgroundColorPicker${idSuffix}">
                    <div class="color-picker-header">
                        <i data-lucide="highlighter"></i>
                        <span>${Localization.t('toolbar.color_bg')}</span>
                    </div>
                    <div class="color-grid" id="backgroundColorGrid${idSuffix}"></div>
                    <div class="color-input-wrapper">
                        <div class="color-manual-input">
                            <input type="color" id="bgColorInput${idSuffix}" onchange="applyBackgroundColor(this.value, ${panel ? `'${panel}'` : 'null'})">
                            <input type="text" id="bgColorHex${idSuffix}" placeholder="#FFFF00" maxlength="7" onchange="applyBackgroundColor(this.value, ${panel ? `'${panel}'` : 'null'})">
                        </div>
                        <button class="color-reset-btn" onmousedown="event.preventDefault()" onclick="applyBackgroundColor('', ${panel ? `'${panel}'` : 'null'})" title="${Localization.t('toolbar.color_reset')}">
                            <i data-lucide="rotate-ccw"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Alignment -->
        <div class="toolbar-group">
            <button class="toolbar-btn" onmousedown="event.preventDefault()" onclick="${fnName}(${fnPrefix}'justifyLeft')" title="${Localization.t('toolbar.align_left')}">
                <i data-lucide="align-left" style="width:14px;height:14px;"></i>
            </button>
            <button class="toolbar-btn" onmousedown="event.preventDefault()" onclick="${fnName}(${fnPrefix}'justifyCenter')" title="${Localization.t('toolbar.align_center')}">
                <i data-lucide="align-center" style="width:14px;height:14px;"></i>
            </button>
            <button class="toolbar-btn" onmousedown="event.preventDefault()" onclick="${fnName}(${fnPrefix}'justifyRight')" title="${Localization.t('toolbar.align_right')}">
                <i data-lucide="align-right" style="width:14px;height:14px;"></i>
            </button>
            <button class="toolbar-btn" onmousedown="event.preventDefault()" onclick="${fnName}(${fnPrefix}'justifyFull')" title="${Localization.t('toolbar.align_justify')}">
                <i data-lucide="align-justify" style="width:14px;height:14px;"></i>
            </button>
        </div>
        
        <!-- Headings -->
        <div class="toolbar-group">
            <button class="toolbar-btn" onmousedown="event.preventDefault()" onclick="${fnName}(${fnPrefix}'formatBlock', 'h1')" title="${Localization.t('toolbar.heading_1')}"><i data-lucide="heading-1" style="width:14px;height:14px;"></i></button>
            <button class="toolbar-btn" onmousedown="event.preventDefault()" onclick="${fnName}(${fnPrefix}'formatBlock', 'h2')" title="${Localization.t('toolbar.heading_2')}"><i data-lucide="heading-2" style="width:14px;height:14px;"></i></button>
            <button class="toolbar-btn" onmousedown="event.preventDefault()" onclick="${fnName}(${fnPrefix}'formatBlock', 'h3')" title="${Localization.t('toolbar.heading_3')}"><i data-lucide="heading-3" style="width:14px;height:14px;"></i></button>
            <button class="toolbar-btn" onmousedown="event.preventDefault()" onclick="${fnName}(${fnPrefix}'formatBlock', 'p')" title="${Localization.t('toolbar.paragraph')}"><i data-lucide="pilcrow" style="width:14px;height:14px;"></i></button>
        </div>
        
        <!-- Lists and quotes -->
        <div class="toolbar-group">
            <button class="toolbar-btn" onmousedown="event.preventDefault()" onclick="${fnName}(${fnPrefix}'insertUnorderedList')" title="${Localization.t('toolbar.list_bullets')}"><i data-lucide="list" style="width:14px;height:14px;"></i></button>
            <button class="toolbar-btn" onmousedown="event.preventDefault()" onclick="${fnName}(${fnPrefix}'insertOrderedList')" title="${Localization.t('toolbar.list_ordered')}"><i data-lucide="list-ordered" style="width:14px;height:14px;"></i></button>
            <button class="toolbar-btn" onmousedown="event.preventDefault()" onclick="${fnName}(${fnPrefix}'formatBlock', 'blockquote')" title="${Localization.t('toolbar.quote')}"><i data-lucide="quote" style="width:14px;height:14px;"></i></button>
        </div>
        
        <!-- Indentation -->
        <div class="toolbar-group">
            <button class="toolbar-btn" onmousedown="event.preventDefault()" onclick="${fnName}(${fnPrefix}'indent')" title="${Localization.t('toolbar.indent_increase')}"><i data-lucide="indent" style="width:14px;height:14px;"></i></button>
            <button class="toolbar-btn" onmousedown="event.preventDefault()" onclick="${fnName}(${fnPrefix}'outdent')" title="${Localization.t('toolbar.indent_decrease')}"><i data-lucide="outdent" style="width:14px;height:14px;"></i></button>
        </div>
        
        <!-- Superscript, subscript -->
        <div class="toolbar-group">
            <button class="toolbar-btn" onmousedown="event.preventDefault()" onclick="${fnName}(${fnPrefix}'superscript')" title="${Localization.t('toolbar.superscript')}"><i data-lucide="superscript" style="width:14px;height:14px;"></i></button>
            <button class="toolbar-btn" onmousedown="event.preventDefault()" onclick="${fnName}(${fnPrefix}'subscript')" title="${Localization.t('toolbar.subscript')}"><i data-lucide="subscript" style="width:14px;height:14px;"></i></button>
        </div>
        
        <!-- Synonyms -->
        <div class="toolbar-group">
            <button class="toolbar-btn" onmousedown="event.preventDefault()" onclick="if(typeof SynonymsView !== 'undefined') SynonymsView.toggle()" title="${Localization.t('toolbar.synonyms')}">
                <i data-lucide="book-a" style="width:14px;height:14px;"></i>
            </button>
        </div>
        
        <!-- Other -->
        <div class="toolbar-group">
            <button class="toolbar-btn" onmousedown="event.preventDefault()" onclick="${fnName}(${fnPrefix}'insertHorizontalRule')" title="${Localization.t('toolbar.horizontal_rule')}"><i data-lucide="minus" style="width:14px;height:14px;"></i></button>
            <button class="toolbar-btn" onmousedown="event.preventDefault()" onclick="${fnName}(${fnPrefix}'removeFormat')" title="${Localization.t('toolbar.remove_format')}"><i data-lucide="eraser" style="width:14px;height:14px;"></i></button>
        </div>
        
        ${!hideExtraTools ? `
        <!-- Revision mode button -->
        <div class="toolbar-group">
            <button class="toolbar-btn" onmousedown="event.preventDefault()" onclick="toggleRevisionMode()" title="${Localization.t('toolbar.revision_mode')}" style="color: var(--accent-gold); font-weight: 600;"><i data-lucide="pencil" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i> ${Localization.t('toolbar.revision')}</button>
        </div>
        ` : ''}
    `;
}


/**
 * [MVVM : View]
 * Génère et affiche l'éditeur de texte complet.
 */
function renderEditor(act, chapter, scene) {
    const editorView = document.getElementById('editorView');
    if (!editorView) return;

    const wordCount = typeof getWordCount === 'function' ? getWordCount(scene.content) : 0;

    // Vérifier si une version finale existe
    const hasFinalVersion = scene.versions && scene.versions.some(v => v.isFinal === true);
    const finalVersion = hasFinalVersion ? scene.versions.find(v => v.isFinal === true) : null;
    const finalVersionBadge = hasFinalVersion
        ? `<span style="display: inline-flex; align-items: center; gap: 0.25rem; background: var(--accent-gold); color: var(--bg-accent); font-size: 0.7rem; font-weight: 600; padding: 0.2rem 0.5rem; border-radius: 10px; margin-left: 0.5rem;" title="${Localization.t('editor.final_version_title', [finalVersion.number])}"><i data-lucide="star" style="width:10px;height:10px;fill:currentColor;"></i> ${finalVersion.number}</span>`
        : '';

    editorView.innerHTML = `
        <div class="editor-fixed-header-container" style="flex-shrink: 0; display: flex; flex-direction: column; background: var(--bg-primary); z-index: 100;">
            <div class="editor-header">
                <div class="header-main-row">
                    <div class="editor-breadcrumb">
                        <span class="breadcrumb-item">${act.title}</span>
                        <span class="breadcrumb-separator">></span>
                        <span class="breadcrumb-item">${chapter.title}</span>
                        <span class="breadcrumb-separator">></span>
                        <span class="breadcrumb-item scene-title-item">${scene.title}${finalVersionBadge}</span>
                    </div>
                    
                    <div class="header-right-tools">
                        <div class="header-status" onclick="toggleSceneStatus(${act.id}, ${chapter.id}, ${scene.id}, event)">
                            <span class="status-indicator status-${scene.status || 'draft'}"></span>
                            <span class="status-label">${Localization.t('sidebar.status.' + (scene.status || 'draft'))}</span>
                        </div>
                        <div class="header-stats">
                            <span id="sceneWordCount">${Localization.t('editor.word_count', [wordCount])}</span>
                        </div>
                        <button class="btn-focus-toggle" onclick="toggleFocusMode()" title="${Localization.t('editor.focus_mode_title')}">
                            <i data-lucide="maximize" style="width:14px;height:14px;"></i>
                        </button>
                    </div>
                </div>
                
                <div class="header-summary-row">
                    <div class="summary-container">
                        <div class="synopsis-label-box">
                            <i data-lucide="file-text" style="width:14px;height:14px;color:var(--text-muted);"></i>
                            <span class="synopsis-header-label">${Localization.t('editor.synopsis_label')}</span>
                        </div>
                        <textarea class="synopsis-input" 
                                  placeholder="${Localization.t('editor.synopsis_placeholder')}"
                                  onchange="updateSceneSynopsis(${act.id}, ${chapter.id}, ${scene.id}, this.value)"
                                  oninput="this.style.height = 'auto'; this.style.height = this.scrollHeight + 'px';">${(scene.synopsis || '')}</textarea>
                    </div>
                </div>
            </div>

            <button class="toolbar-mobile-toggle" onclick="toggleEditorToolbar()">
                <span id="toolbarToggleText"><i data-lucide="pen-line" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i>${Localization.t('editor.show_tools')}</span>
            </button>
            
            <div class="editor-toolbar" id="editorToolbar" style="border-top: 1px solid var(--border-color);">
                ${getEditorToolbarHTML()}
            </div>
        </div>

        <div class="chapter-progress-indicator" id="chapterProgressIndicator">
            <div class="progress-scene-segment status-${scene.status || 'draft'}" style="height: 100%"></div>
            <div class="progress-current-indicator" id="progressCurrentIndicator"></div>
        </div>

        <div class="editor-workspace" style="flex: 1; overflow-y: auto; background: var(--bg-primary); min-height: 0;">
            <div class="editor-content" style="width: 100%; max-width: 900px; margin: 0 auto; padding: 2rem; min-height: 100%;">
                <div class="editor-textarea" 
                     contenteditable="true" 
                     spellcheck="true" 
                     oninput="updateSceneContent()"
                     style="width: 100%; background: transparent; min-height: 1000px; outline: none;"
                >${scene.content || ''}</div>
            </div>
        </div>`;

    if (typeof lucide !== 'undefined') lucide.createIcons();
    if (typeof initializeColorPickers === 'function') initializeColorPickers();

    // Auto-resize summary textarea on load
    const synInput = document.querySelector('.synopsis-input');
    if (synInput) {
        synInput.style.height = 'auto';
        synInput.style.height = synInput.scrollHeight + 'px';
    }

    // Focus if empty
    setTimeout(() => {
        const editor = document.querySelector('.editor-textarea');
        if (editor && editor.textContent.trim() === '') editor.focus();

    }, 100);

    setTimeout(() => {
        if (typeof initSceneNavigation === 'function') initSceneNavigation();
        if (typeof updateLiveTensionMeter === 'function') updateLiveTensionMeter(scene.content || '', { actId: act.id, chapterId: chapter.id, sceneId: scene.id });
    }, 200);
}

/**
 * [MVVM : View]
 * Met à jour uniquement l'indicateur de statut dans le header de l'éditeur.
 */
function updateEditorHeaderStatus(status, sceneId) {
    // On met à jour tous les indicateurs de statut trouvés dans les headers d'éditeur
    const statusDots = document.querySelectorAll('.editor-header .status-indicator');
    const statusLabels = document.querySelectorAll('.editor-header .status-label');

    statusDots.forEach(dot => {
        dot.className = `status-indicator status-${status || 'draft'}`;
    });

    statusLabels.forEach(label => {
        label.textContent = Localization.t('sidebar.status.' + (status || 'draft'));
    });
}

/**
 * [MVVM : View]
 * Génère et affiche l'éditeur d'acte avec tous les chapitres et scènes séquentiellement.
 */
function renderActEditor(act) {
    const editorView = document.getElementById('editorView');
    if (!editorView) return;

    // Calculer les statistiques de l'acte
    let totalWords = 0;
    const chapterData = [];

    act.chapters.forEach((chapter, chapterIndex) => {
        let chapterWords = 0;
        const sceneWordCounts = [];

        chapter.scenes.forEach(scene => {
            const wc = (scene.content && typeof StatsModel !== 'undefined') ? StatsModel.getWordCount(scene.content) : (scene.wordCount || 0);
            sceneWordCounts.push(wc);
            chapterWords += wc;
        });

        chapterData.push({
            chapter,
            chapterWords,
            sceneWordCounts,
            chapterIndex
        });

        totalWords += chapterWords;
    });

    // Générer le HTML pour tous les chapitres et scènes
    let contentHTML = '';
    let allScenes = [];

    chapterData.forEach(({ chapter, chapterWords, sceneWordCounts, chapterIndex }) => {
        if (chapter.scenes.length === 0) return;

        contentHTML += `
            <div class="act-chapter-block" data-chapter-id="${chapter.id}" data-chapter-index="${chapterIndex}">
                <div class="chapter-separator">
                    <div class="chapter-separator-title">${chapter.title}</div>
                    <div class="chapter-separator-meta">
                        <span>${chapterWords} mots</span>
                        <span>${chapter.scenes.length} scène${chapter.scenes.length > 1 ? 's' : ''}</span>
                    </div>
                </div>`;

        chapter.scenes.forEach((scene, sceneIndex) => {
            const wordCount = sceneWordCounts[sceneIndex];
            const hasFinalVersion = scene.versions && scene.versions.some(v => v.isFinal === true);
            const finalVersion = hasFinalVersion ? scene.versions.find(v => v.isFinal === true) : null;
            const finalVersionBadge = hasFinalVersion
                ? `<span style="display: inline-flex; align-items: center; gap: 0.25rem; background: var(--accent-gold); color: var(--bg-accent); font-size: 0.7rem; font-weight: 600; padding: 0.2rem 0.5rem; border-radius: 10px; margin-left: 0.5rem;" title="Version finale : ${finalVersion.number}"><i data-lucide="star" style="width:10px;height:10px;fill:currentColor;"></i> ${finalVersion.number}</span>`
                : '';

            allScenes.push({
                scene,
                wordCount,
                chapterId: chapter.id,
                chapterTitle: chapter.title
            });

            contentHTML += `
                <div class="act-scene-block" data-scene-id="${scene.id}" data-chapter-id="${chapter.id}" data-scene-index="${allScenes.length - 1}">
                    <div class="scene-separator">
                        <div class="scene-separator-title">${scene.title}${finalVersionBadge}</div>
                        <div class="scene-separator-meta">
                            <span>${wordCount} mots</span>
                            <textarea class="scene-separator-synopsis" placeholder="Ajouter un résumé..." onblur="saveSceneSynopsis(${act.id}, ${chapter.id}, ${scene.id}, this)" onkeydown="handleSynopsisKeydown(event, this)" rows="1" oninput="autoResizeSynopsis(this)">${scene.synopsis || ''}</textarea>
                        </div>
                    </div>
                    <div class="editor-textarea" contenteditable="true" spellcheck="true"
                         data-scene-id="${scene.id}"
                         data-chapter-id="${chapter.id}"
                         data-act-id="${act.id}"
                         onfocus="setActiveScene(${act.id}, ${chapter.id}, ${scene.id})"
                         oninput="updateActSceneContent(${act.id}, ${chapter.id}, ${scene.id})">${scene.content || ''}</div>
                </div>`;
        });

        contentHTML += `</div>`;
    });

    editorView.innerHTML = `
        <div class="editor-fixed-header-container" style="flex-shrink: 0; display: flex; flex-direction: column; background: var(--bg-primary); z-index: 100;">
            <div class="editor-header">
                <div class="header-main-row">
                    <div class="editor-breadcrumb">
                        <span class="breadcrumb-item scene-title-item">${act.title}</span>
                    </div>
                    
                    <div class="header-right-tools">
                        <div class="header-stats">
                            <span>${totalWords.toLocaleString()} mots au total</span>
                        </div>
                        <button class="btn-focus-toggle" onclick="toggleFocusMode()" title="${Localization.t('editor.focus_mode_title')}">
                            <i data-lucide="maximize" style="width:14px;height:14px;"></i>
                        </button>
                    </div>
                </div>
                
                <div class="header-summary-row">
                    <div class="summary-container">
                        <div class="synopsis-label-box">
                            <i data-lucide="info" style="width:14px;height:14px;color:var(--text-muted);"></i>
                            <span class="synopsis-header-label">INFOS</span>
                        </div>
                        <div class="synopsis-input" style="font-style: normal;">
                            ${act.chapters.length} chapitre${act.chapters.length > 1 ? 's' : ''}, ${allScenes.length} scène${allScenes.length > 1 ? 's' : ''}
                        </div>
                    </div>
                </div>
            </div>

            <button class="toolbar-mobile-toggle" onclick="toggleEditorToolbar()">
                <span id="toolbarToggleText"><i data-lucide="pen-line" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i>Afficher les outils</span>
            </button>
            
            <div class="editor-toolbar" id="editorToolbar" style="border-top: 1px solid var(--border-color);">
                ${getEditorToolbarHTML()}
            </div>
        </div>

        <div class="chapter-progress-indicator" id="actProgressIndicator">
            ${allScenes.map((sceneData, index) => {
        const heightPercent = totalWords > 0 ? (sceneData.wordCount / totalWords) * 100 : (100 / allScenes.length);
        return `<div class="progress-scene-segment status-${sceneData.scene.status || 'draft'}"
                            data-scene-id="${sceneData.scene.id}"
                            data-scene-index="${index}"
                            style="height: ${heightPercent}%"
                            title="${sceneData.chapterTitle} - ${sceneData.scene.title} (${sceneData.wordCount} mots)"
                            onclick="scrollToActScene(${index})"></div>`;
    }).join('')}
            <div class="progress-current-indicator" id="progressCurrentIndicator"></div>
        </div>

        <div class="editor-workspace" id="actEditorWorkspace" style="flex: 1; overflow-y: auto; background: var(--bg-primary); min-height: 0;">
            <div class="editor-content" id="actEditorContent" style="width: 100%; max-width: 900px; margin: 0 auto; padding: 2rem; min-height: 100%;">
                ${contentHTML}
            </div>
        </div>`;

    if (typeof lucide !== 'undefined') lucide.createIcons();
    if (typeof initializeColorPickers === 'function') initializeColorPickers();

    // Initialiser le tracking de scroll
    setTimeout(() => {
        initActScrollTracking(act.id, allScenes);
        // Auto-resize des synopsis existants
        document.querySelectorAll('.scene-separator-synopsis').forEach(autoResizeSynopsis);

        // Update annotation density badges
        if (typeof RevisionViewModel !== 'undefined' && RevisionViewModel.updateAnnotationsButton) {
            RevisionViewModel.updateAnnotationsButton();
        }
    }, 100);

    // Initialize scene navigation toolbar
    setTimeout(() => {
        if (typeof initSceneNavigation === 'function') initSceneNavigation();
        if (typeof updateLiveTensionMeter === 'function' && allScenes.length > 0) {
            updateLiveTensionMeter(allScenes[0].scene.content || '', { actId: act.id, chapterId: allScenes[0].chapterId, sceneId: allScenes[0].scene.id });
        }
    }, 200);
}

/**
 * [MVVM : View]
 * Génère et affiche l'éditeur complet pour TOUT le livre.
 */
function renderFullBookEditor() {
    const editorView = document.getElementById('editorView');
    if (!editorView) return;

    let totalWords = 0;
    let totalChaptersCount = 0;
    let totalScenesCount = 0;
    let allScenes = [];
    let contentHTML = '';

    project.acts.forEach(act => {
        contentHTML += `
            <div class="editor-act-separator">
                <div class="editor-act-separator-label">${Localization.t('search.default.act') || 'Acte'}</div>
                <div class="editor-act-separator-title">${act.title}</div>
            </div>`;

        act.chapters.forEach((chapter, chapterIndex) => {
            if (chapter.scenes.length === 0) return;
            totalChaptersCount++;

            let chapterWords = 0;
            let chapterHTML = '';

            chapter.scenes.forEach((scene, sceneIndex) => {
                totalScenesCount++;
                const wc = (scene.content && typeof StatsModel !== 'undefined') ? StatsModel.getWordCount(scene.content) : (scene.wordCount || 0);
                chapterWords += wc;
                totalWords += wc;

                const hasFinalVersion = scene.versions && scene.versions.some(v => v.isFinal === true);
                const finalVersion = hasFinalVersion ? scene.versions.find(v => v.isFinal === true) : null;
                const finalVersionBadge = hasFinalVersion
                    ? `<span style="display: inline-flex; align-items: center; gap: 0.25rem; background: var(--accent-gold); color: var(--bg-accent); font-size: 0.7rem; font-weight: 600; padding: 0.2rem 0.5rem; border-radius: 10px; margin-left: 0.5rem;" title="Version finale : ${finalVersion.number}"><i data-lucide="star" style="width:10px;height:10px;fill:currentColor;"></i> ${finalVersion.number}</span>`
                    : '';

                allScenes.push({ scene, wordCount: wc, chapterId: chapter.id, chapterTitle: chapter.title, actId: act.id });

                chapterHTML += `
                    <div class="act-scene-block" data-scene-id="${scene.id}" data-chapter-id="${chapter.id}" data-scene-index="${allScenes.length - 1}">
                        <div class="scene-separator">
                            <div class="scene-separator-title">${scene.title}${finalVersionBadge}</div>
                            <div class="scene-separator-meta">
                                <span>${wc} mots</span>
                                <textarea class="scene-separator-synopsis" placeholder="Ajouter un résumé..." onblur="saveSceneSynopsis(${act.id}, ${chapter.id}, ${scene.id}, this)" onkeydown="handleSynopsisKeydown(event, this)" rows="1" oninput="autoResizeSynopsis(this)">${scene.synopsis || ''}</textarea>
                            </div>
                        </div>
                        <div class="editor-textarea" contenteditable="true" spellcheck="true"
                             data-scene-id="${scene.id}"
                             data-chapter-id="${chapter.id}"
                             data-act-id="${act.id}"
                             onfocus="setActiveScene(${act.id}, ${chapter.id}, ${scene.id})"
                             oninput="updateActSceneContent(${act.id}, ${chapter.id}, ${scene.id})">${scene.content || ''}</div>
                    </div>`;
            });

            contentHTML += `
                <div class="act-chapter-block" data-chapter-id="${chapter.id}">
                    <div class="chapter-separator">
                        <div class="chapter-separator-title">${chapter.title}</div>
                        <div class="chapter-separator-meta">
                            <span>${chapterWords} mots</span>
                            <span>${chapter.scenes.length} scène${chapter.scenes.length > 1 ? 's' : ''}</span>
                        </div>
                    </div>
                    ${chapterHTML}
                </div>`;
        });
    });

    editorView.innerHTML = `
        <div class="editor-fixed-header-container" style="flex-shrink: 0; display: flex; flex-direction: column; background: var(--bg-primary); z-index: 100;">
            <div class="editor-header">
                <div class="header-main-row">
                    <div class="editor-breadcrumb">
                        <span class="breadcrumb-item scene-title-item">TOUT LE LIVRE</span>
                    </div>
                    
                    <div class="header-right-tools">
                        <div class="header-stats">
                            <span>${totalWords.toLocaleString()} mots au total</span>
                        </div>
                        <button class="btn-focus-toggle" onclick="toggleFocusMode()" title="${Localization.t('editor.focus_mode_title')}">
                            <i data-lucide="maximize" style="width:14px;height:14px;"></i>
                        </button>
                    </div>
                </div>
                
                <div class="header-summary-row">
                    <div class="summary-container">
                        <div class="synopsis-label-box">
                            <i data-lucide="info" style="width:14px;height:14px;color:var(--text-muted);"></i>
                            <span class="synopsis-header-label">INFOS</span>
                        </div>
                        <div class="synopsis-input" style="font-style: normal;">
                            ${project.acts.length} actes, ${totalChaptersCount} chapitres, ${totalScenesCount} scènes
                        </div>
                    </div>
                </div>
            </div>

            <button class="toolbar-mobile-toggle" onclick="toggleEditorToolbar()">
                <span id="toolbarToggleText"><i data-lucide="pen-line" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i>Afficher les outils</span>
            </button>
            
            <div class="editor-toolbar" id="editorToolbar" style="border-top: 1px solid var(--border-color);">
                ${getEditorToolbarHTML()}
            </div>
        </div>

        <!-- Indicateur de position vertical -->
        <div class="chapter-progress-indicator" id="actProgressIndicator">
            ${(() => {
            let indicatorHTML = '';
            let lastActId = null;
            allScenes.forEach((sceneData, index) => {
                if (lastActId !== null && lastActId !== sceneData.actId) {
                    indicatorHTML += `<div class="progress-act-separator" title="Séparateur d'acte"></div>`;
                }
                lastActId = sceneData.actId;
                const heightPercent = totalWords > 0 ? (sceneData.wordCount / totalWords) * 100 : (100 / allScenes.length);
                const status = sceneData.scene.status || 'draft';
                const actName = project.acts.find(a => a.id === sceneData.actId)?.title || '';
                indicatorHTML += `<div class="progress-scene-segment status-${status}"
                                            data-scene-id="${sceneData.scene.id}"
                                            data-scene-index="${index}"
                                            style="height: ${heightPercent}%"
                                            title="${actName} : ${sceneData.chapterTitle} - ${sceneData.scene.title} (${sceneData.wordCount} mots)"
                                            onclick="scrollToActScene(${index})"></div>`;
            });
            return indicatorHTML;
        })()}
            <div class="progress-current-indicator" id="progressCurrentIndicator"></div>
        </div>

        <div class="editor-workspace" id="fullBookEditorWorkspace" style="flex: 1; overflow-y: auto; background: var(--bg-primary); min-height: 0;">
            <div class="editor-content" id="actEditorContent" style="width: 100%; max-width: 900px; margin: 0 auto; padding: 2rem; min-height: 100%;">
                ${contentHTML}
            </div>
        </div>`;

    if (typeof lucide !== 'undefined') lucide.createIcons();
    if (typeof initializeColorPickers === 'function') initializeColorPickers();

    // Initialiser le tracking de scroll
    setTimeout(() => {
        initActScrollTracking('all', allScenes);
        document.querySelectorAll('.scene-separator-synopsis').forEach(autoResizeSynopsis);

        if (typeof RevisionViewModel !== 'undefined' && RevisionViewModel.updateAnnotationsButton) {
            RevisionViewModel.updateAnnotationsButton();
        }
    }, 100);

    // Initialize scene navigation toolbar
    setTimeout(() => {
        if (typeof initSceneNavigation === 'function') initSceneNavigation();
        if (typeof updateLiveTensionMeter === 'function' && allScenes.length > 0) {
            updateLiveTensionMeter(allScenes[0].scene.content || '', { actId: allScenes[0].actId, chapterId: allScenes[0].chapterId, sceneId: allScenes[0].scene.id });
        }
    }, 200);
}

/**
 * [MVVM : View]
 * Génère et affiche l'éditeur de chapitre avec toutes les scènes séquentiellement.
 */
function renderChapterEditor(act, chapter) {
    const editorView = document.getElementById('editorView');
    if (!editorView) return;

    // Calculer les statistiques du chapitre
    let totalWords = 0;
    const sceneWordCounts = [];
    chapter.scenes.forEach(scene => {
        const wc = (scene.content && typeof StatsModel !== 'undefined') ? StatsModel.getWordCount(scene.content) : (scene.wordCount || 0);
        sceneWordCounts.push(wc);
        totalWords += wc;
    });

    // Générer le HTML pour toutes les scènes
    let scenesHTML = '';
    chapter.scenes.forEach((scene, index) => {
        const wordCount = sceneWordCounts[index];
        const hasFinalVersion = scene.versions && scene.versions.some(v => v.isFinal === true);
        const finalVersion = hasFinalVersion ? scene.versions.find(v => v.isFinal === true) : null;
        const finalVersionBadge = hasFinalVersion
            ? `<span style="display: inline-flex; align-items: center; gap: 0.25rem; background: var(--accent-gold); color: var(--bg-accent); font-size: 0.7rem; font-weight: 600; padding: 0.2rem 0.5rem; border-radius: 10px; margin-left: 0.5rem;" title="Version finale : ${finalVersion.number}"><i data-lucide="star" style="width:12px;height:12px;vertical-align:middle;"></i> ${finalVersion.number}</span>`
            : '';

        scenesHTML += `
            <div class="chapter-scene-block" data-scene-id="${scene.id}" data-scene-index="${index}">
                <div class="scene-separator">
                    <div class="scene-separator-title">${scene.title}${finalVersionBadge}</div>
                    <div class="scene-separator-meta">
                        <span>${wordCount} mots</span>
                        <textarea class="scene-separator-synopsis" placeholder="Ajouter un résumé..." onblur="saveSceneSynopsis(${act.id}, ${chapter.id}, ${scene.id}, this)" onkeydown="handleSynopsisKeydown(event, this)" rows="1" oninput="autoResizeSynopsis(this)">${scene.synopsis || ''}</textarea>
                    </div>
                </div>
                <div class="editor-textarea" contenteditable="true" spellcheck="true"
                     data-scene-id="${scene.id}"
                     data-chapter-id="${chapter.id}"
                     data-act-id="${act.id}"
                     onfocus="setActiveScene(${act.id}, ${chapter.id}, ${scene.id})"
                     oninput="updateChapterSceneContent(${act.id}, ${chapter.id}, ${scene.id})">${scene.content || ''}</div>
            </div>`;
    });

    editorView.innerHTML = `
        <div class="editor-fixed-header-container" style="flex-shrink: 0; display: flex; flex-direction: column; background: var(--bg-primary); z-index: 100;">
            <div class="editor-header">
                <div class="header-main-row">
                    <div class="editor-breadcrumb">
                        <span class="breadcrumb-item">${act.title}</span>
                        <span class="breadcrumb-separator">></span>
                        <span class="breadcrumb-item scene-title-item">${chapter.title}</span>
                    </div>
                    
                    <div class="header-right-tools">
                        <div class="header-stats">
                            <span>${totalWords.toLocaleString()} mots au total</span>
                        </div>
                        <button class="btn-focus-toggle" onclick="toggleFocusMode()" title="${Localization.t('editor.focus_mode_title')}">
                            <i data-lucide="maximize" style="width:14px;height:14px;"></i>
                        </button>
                    </div>
                </div>
                
                <div class="header-summary-row">
                    <div class="summary-container">
                        <div class="synopsis-label-box">
                            <i data-lucide="info" style="width:14px;height:14px;color:var(--text-muted);"></i>
                            <span class="synopsis-header-label">INFOS</span>
                        </div>
                        <div class="synopsis-input" style="font-style: normal;">
                            ${chapter.scenes.length} scène${chapter.scenes.length > 1 ? 's' : ''}
                        </div>
                    </div>
                </div>
            </div>

            <button class="toolbar-mobile-toggle" onclick="toggleEditorToolbar()">
                <span id="toolbarToggleText"><i data-lucide="pen-line" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i>Afficher les outils</span>
            </button>
            
            <div class="editor-toolbar" id="editorToolbar" style="border-top: 1px solid var(--border-color);">
                ${getEditorToolbarHTML()}
            </div>
        </div>

        <!-- Indicateur de position vertical -->
        <div class="chapter-progress-indicator" id="chapterProgressIndicator">
            ${chapter.scenes.map((scene, index) => {
        const wordCount = sceneWordCounts[index];
        const heightPercent = totalWords > 0 ? (wordCount / totalWords) * 100 : (100 / chapter.scenes.length);
        return `<div class="progress-scene-segment status-${scene.status || 'draft'}"
                            data-scene-id="${scene.id}"
                            data-scene-index="${index}"
                            style="height: ${heightPercent}%"
                            title="${scene.title} (${wordCount} mots)"
                            onclick="scrollToChapterScene(${index})"></div>`;
    }).join('')}
            <div class="progress-current-indicator" id="progressCurrentIndicator"></div>
        </div>

        <div class="editor-workspace" id="chapterEditorWorkspace" style="flex: 1; overflow-y: auto; background: var(--bg-primary); min-height: 0;">
            <div class="editor-content" id="chapterEditorContent" style="width: 100%; max-width: 900px; margin: 0 auto; padding: 2rem; min-height: 100%;">
                ${scenesHTML}
            </div>
        </div>`;

    if (typeof lucide !== 'undefined') lucide.createIcons();
    if (typeof initializeColorPickers === 'function') initializeColorPickers();

    // Initialiser le tracking de scroll
    setTimeout(() => {
        initChapterScrollTracking(act.id, chapter.id);
        // Auto-resize des synopsis existants
        document.querySelectorAll('.scene-separator-synopsis').forEach(autoResizeSynopsis);

        // Update annotation density badges
        if (typeof RevisionViewModel !== 'undefined' && RevisionViewModel.updateAnnotationsButton) {
            RevisionViewModel.updateAnnotationsButton();
        }
    }, 100);

    // Initialize scene navigation toolbar
    setTimeout(() => {
        if (typeof initSceneNavigation === 'function') initSceneNavigation();
        if (typeof updateLiveTensionMeter === 'function' && chapter.scenes.length > 0) {
            updateLiveTensionMeter(chapter.scenes[0].content || '', { actId: act.id, chapterId: chapter.id, sceneId: chapter.scenes[0].id });
        }
    }, 200);
}

/**
 * [MVVM : View]
 * Synchronise la Vue vers le Modèle et rafraîchit les indicateurs.
 */
function updateSceneContent() {
    const editor = document.querySelector('.editor-textarea');
    if (!editor) return;

    const act = project.acts.find(a => a.id === currentActId);
    const chapter = act?.chapters.find(c => c.id === currentChapterId);
    const scene = chapter?.scenes.find(s => s.id === currentSceneId);
    if (!scene) return;

    scene.content = editor.innerHTML;
    const wordCount = typeof getWordCount === 'function' ? getWordCount(editor.innerHTML) : 0;
    scene.wordCount = wordCount;

    // Mise à jour de la version active (si applicable)
    if (typeof updateSceneContentWithVersion === 'function') updateSceneContentWithVersion(editor.innerHTML);

    const countEl = document.getElementById('sceneWordCount');
    if (countEl) countEl.textContent = `${wordCount} mots`;

    if (typeof saveProject === 'function') saveProject();
    if (typeof updateStats === 'function') updateStats();
    if (typeof renderActsList === 'function') renderActsList();
    if (typeof trackWritingSession === 'function') trackWritingSession();

    if (typeof focusModeActive !== 'undefined' && focusModeActive && typeof updateWritingProgress === 'function') {
        updateWritingProgress();
    }

    if (typeof autoDetectLinksDebounced === 'function') autoDetectLinksDebounced();
    if (typeof updateLiveTensionMeter === 'function') updateLiveTensionMeter(editor.innerHTML, { actId: currentActId, chapterId: currentChapterId, sceneId: currentSceneId });
}

/**
 * [MVVM : View]
 * Met à jour le contenu d'une scène dans le mode chapitre.
 */
function updateChapterSceneContent(actId, chapterId, sceneId) {
    const editor = document.querySelector(`.editor-textarea[data-scene-id="${sceneId}"]`);
    if (!editor) return;

    const act = project.acts.find(a => a.id == actId);
    if (!act || !act.chapters) return;
    const chapter = act.chapters.find(c => c.id == chapterId);
    if (!chapter) return;

    const scene = chapter.scenes.find(s => s.id == sceneId);
    if (!scene) return;

    scene.content = editor.innerHTML;
    const wordCount = typeof getWordCount === 'function' ? getWordCount(editor.innerHTML) : 0;
    scene.wordCount = wordCount;

    // Mise à jour du compteur de mots de la scène
    const sceneBlock = document.querySelector(`.chapter-scene-block[data-scene-id="${sceneId}"]`);
    if (sceneBlock) {
        const metaSpan = sceneBlock.querySelector('.scene-separator-meta span');
        if (metaSpan) metaSpan.textContent = `${wordCount} mots`;
    }

    if (typeof saveProject === 'function') saveProject();
    if (typeof updateStats === 'function') updateStats();
    if (typeof renderActsList === 'function') renderActsList();
    if (typeof trackWritingSession === 'function') trackWritingSession();

    // Recalculer les proportions de l'indicateur
    if (typeof updateEditorProgressIndicator === 'function') {
        updateEditorProgressIndicator();
    }

    if (typeof updateLiveTensionMeter === 'function') {
        updateLiveTensionMeter(editor.innerHTML, { actId, chapterId, sceneId });
    }

    if (typeof autoDetectLinksDebounced === 'function') autoDetectLinksDebounced();
}

/**
 * [MVVM : View]
 * Met à jour les proportions de l'indicateur de progression du chapitre.
 */
function updateChapterProgressIndicator(chapter) {
    let totalWords = 0;
    const wordCounts = [];

    chapter.scenes.forEach(scene => {
        const wc = typeof getWordCount === 'function' ? getWordCount(scene.content) : (scene.wordCount || 0);
        wordCounts.push(wc);
        totalWords += wc;
    });

    chapter.scenes.forEach((scene, index) => {
        const segment = document.querySelector(`.progress-scene-segment[data-scene-index="${index}"]`);
        if (segment) {
            const heightPercent = totalWords > 0 ? (wordCounts[index] / totalWords) * 100 : (100 / chapter.scenes.length);
            segment.style.height = `${heightPercent}%`;
            segment.title = `${scene.title} (${wordCounts[index]} mots)`;
        }
    });
}

/**
 * [MVVM : View]
 * Initialise le tracking de scroll pour l'éditeur de chapitre.
 */
/**
 * [MVVM : View]
 * Initialise le tracking de scroll pour l'éditeur de chapitre.
 * OPTIMISÉ avec requestAnimationFrame et Debounce
 */
function initChapterScrollTracking(actId, chapterId) {
    const editorContent = document.getElementById('chapterEditorContent');
    const indicator = document.getElementById('progressCurrentIndicator');
    const title = document.getElementById('chapterEditorTitle');

    if (!editorContent || !indicator) return;

    // IMPORTANT: Trouver le workspace parent spécifique pour supporter le split view
    const workspace = editorContent.closest('.editor-workspace');
    if (!workspace) return;

    const act = project.acts.find(a => a.id === actId);
    const chapter = act?.chapters.find(c => c.id === chapterId);
    if (!chapter) return;

    let currentSceneIndex = 0;
    let ticking = false;
    let updateTimeout = null;

    function updateScrollPosition() {
        // Sélectionner uniquement les blocs DANS ce workspace
        const sceneBlocks = Array.from(workspace.querySelectorAll('.chapter-scene-block'));
        if (sceneBlocks.length === 0) return;

        const workspaceRect = workspace.getBoundingClientRect();
        const viewportMiddle = workspaceRect.top + workspaceRect.height / 2;

        let closestScene = 0;
        let closestDistance = Infinity;

        sceneBlocks.forEach((block, index) => {
            const rect = block.getBoundingClientRect();
            const blockMiddle = rect.top + rect.height / 2;
            const distance = Math.abs(blockMiddle - viewportMiddle);

            if (distance < closestDistance) {
                closestDistance = distance;
                closestScene = index;
            }
        });

        if (closestScene !== currentSceneIndex) {
            currentSceneIndex = closestScene;
            const scene = chapter.scenes[closestScene];

            if (updateTimeout) clearTimeout(updateTimeout);
            updateTimeout = setTimeout(() => {
                if (scene) {
                    if (title) title.textContent = scene.title;
                    setActiveScene(actId, chapterId, scene.id);
                    // Tension meter
                    if (typeof updateLiveTensionMeter === 'function') {
                        const sceneEditor = workspace.querySelector(`.editor-textarea[data-scene-id="${scene.id}"]`);
                        updateLiveTensionMeter(sceneEditor ? sceneEditor.innerHTML : scene.content, { actId, chapterId, sceneId: scene.id });
                    }
                }
            }, 100);
        }

        // Update progress indicator
        const progressIndicator = workspace.parentElement.querySelector('.chapter-progress-indicator');
        if (progressIndicator) {
            const segments = Array.from(progressIndicator.querySelectorAll('.progress-scene-segment'));
            let topOffset = 0;

            for (let i = 0; i < currentSceneIndex; i++) {
                const seg = segments[i];
                if (seg) topOffset += seg.offsetHeight;
            }

            const currentBlock = sceneBlocks[currentSceneIndex];
            if (currentBlock) {
                const blockRect = currentBlock.getBoundingClientRect();
                const relativeScroll = Math.max(0, Math.min(1, (workspaceRect.top - blockRect.top) / blockRect.height));
                const currentSegment = segments[currentSceneIndex];
                if (currentSegment) {
                    topOffset += currentSegment.offsetHeight * relativeScroll;
                }
            }

            indicator.style.top = `${topOffset}px`;

            // Mettre à jour la couleur de l'indicateur selon le statut de la scène courante
            const currentScene = chapter.scenes[currentSceneIndex];
            if (currentScene) {
                const statusColor = `var(--status-${currentScene.status || 'draft'}-color)`;
                indicator.style.backgroundColor = statusColor;
            }

            segments.forEach((seg, i) => {
                if (i === currentSceneIndex) seg.classList.add('active');
                else seg.classList.remove('active');
            });
        }
    }

    const handler = function () {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                updateScrollPosition();
                ticking = false;
            });
            ticking = true;
        }
    };

    workspace.addEventListener('scroll', handler, { passive: true });
    workspace._scrollHandler = handler;

    currentSceneIndex = -1;
    window.requestAnimationFrame(updateScrollPosition);
}

/**
 * [MVVM : View]
 * Nettoie le tracking de scroll pour éviter les fuites mémoire.
 */
function cleanupChapterScrollTracking() {
    // Si on a un handler global (legacy), le nettoyer
    if (typeof chapterScrollTrackingHandler !== 'undefined' && chapterScrollTrackingHandler) {
        window.removeEventListener('scroll', chapterScrollTrackingHandler);
        chapterScrollTrackingHandler = null;
    }

    // Nettoyer tous les workspaces (moderne)
    const workspaces = document.querySelectorAll('.editor-workspace');
    workspaces.forEach(workspace => {
        if (workspace._scrollHandler) {
            workspace.removeEventListener('scroll', workspace._scrollHandler);
            workspace._scrollHandler = null;
        }
    });
}

/**
 * [MVVM : View]
 * Place le curseur au début d'un élément contenteditable.
 */
function setCursorAtBeginning(element) {
    if (!element) return;
    element.focus();

    // Pour contenteditable, on utilise Selection et Range
    if (typeof window.getSelection !== "undefined" && typeof document.createRange !== "undefined") {
        const range = document.createRange();
        range.selectNodeContents(element);
        range.collapse(true); // true pour le début
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
    }
}

/**
 * [MVVM : View]
 * Fait défiler jusqu'à une scène spécifique dans le mode chapitre.
 */
function scrollToChapterScene(sceneIndex) {
    const sceneBlock = document.querySelector(`.chapter-scene-block[data-scene-index="${sceneIndex}"]`);
    if (sceneBlock) {
        sceneBlock.scrollIntoView({ behavior: 'smooth', block: 'start' });

        // Placer le curseur au début de l'éditeur de cette scène
        const editor = sceneBlock.querySelector('.editor-textarea');
        if (editor) {
            // Note: On ne force plus le focus ici car cela interrompt le scroll fluide
            // et peut bloquer la navigation. L'utilisateur cliquera s'il veut éditer.
        }
    }
}

/**
 * [MVVM : View]
 * Met à jour le contenu d'une scène dans le mode acte.
 */
function updateActSceneContent(actId, chapterId, sceneId) {
    const editor = document.querySelector(`.editor-textarea[data-scene-id="${sceneId}"][data-chapter-id="${chapterId}"]`);
    if (!editor) return;

    const act = project.acts.find(a => a.id == actId);
    const chapter = act?.chapters.find(c => c.id == chapterId);
    const scene = chapter?.scenes.find(s => s.id == sceneId);
    if (!scene) return;

    scene.content = editor.innerHTML;
    const wordCount = typeof getWordCount === 'function' ? getWordCount(editor.innerHTML) : 0;
    scene.wordCount = wordCount;

    // Mise à jour du compteur de mots de la scène
    const sceneBlock = document.querySelector(`.act-scene-block[data-scene-id="${sceneId}"][data-chapter-id="${chapterId}"]`);
    if (sceneBlock) {
        const metaSpan = sceneBlock.querySelector('.scene-separator-meta span');
        if (metaSpan) metaSpan.textContent = `${wordCount} mots`;
    }

    if (typeof saveProject === 'function') saveProject();
    if (typeof updateStats === 'function') updateStats();
    if (typeof renderActsList === 'function') renderActsList();
    if (typeof trackWritingSession === 'function') trackWritingSession();

    // Recalculer les proportions de l'indicateur
    if (typeof updateEditorProgressIndicator === 'function') {
        updateEditorProgressIndicator();
    }

    if (typeof updateLiveTensionMeter === 'function') {
        updateLiveTensionMeter(editor.innerHTML);
    }

    if (typeof autoDetectLinksDebounced === 'function') autoDetectLinksDebounced();
}

/**
 * [MVVM : View]
 * Met à jour les proportions de l'indicateur de progression pour tout le livre.
 */
function updateFullBookProgressIndicator() {
    let totalWords = 0;
    const allScenes = [];

    project.acts.forEach(act => {
        act.chapters.forEach(chapter => {
            chapter.scenes.forEach(scene => {
                const wc = typeof getWordCount === 'function' ? getWordCount(scene.content) : (scene.wordCount || 0);
                allScenes.push({ scene, wordCount: wc, chapterTitle: chapter.title });
                totalWords += wc;
            });
        });
    });

    allScenes.forEach((sceneData, index) => {
        const segment = document.querySelector(`.progress-scene-segment[data-scene-index="${index}"]`);
        if (segment) {
            const heightPercent = totalWords > 0 ? (sceneData.wordCount / totalWords) * 100 : (100 / allScenes.length);
            const status = sceneData.scene.status || 'draft';
            segment.style.height = `${heightPercent}%`;
            segment.className = `progress-scene-segment status-${status}${segment.classList.contains('active') ? ' active' : ''}`;
            const actName = project.acts.find(a => a.chapters.some(ch => ch.id === sceneData.chapterId))?.title || '';
            segment.title = `${actName} : ${sceneData.chapterTitle} - ${sceneData.scene.title} (${sceneData.wordCount} mots)`;
        }
    });
}

/**
 * [MVVM : View]
 * Met à jour les proportions de l'indicateur de progression de l'acte.
 */
function updateActProgressIndicator(act) {
    let totalWords = 0;
    const allScenes = [];

    act.chapters.forEach(chapter => {
        chapter.scenes.forEach(scene => {
            const wc = typeof getWordCount === 'function' ? getWordCount(scene.content) : (scene.wordCount || 0);
            allScenes.push({ scene, wordCount: wc, chapterTitle: chapter.title });
            totalWords += wc;
        });
    });

    allScenes.forEach((sceneData, index) => {
        const segment = document.querySelector(`.progress-scene-segment[data-scene-index="${index}"]`);
        if (segment) {
            const heightPercent = totalWords > 0 ? (sceneData.wordCount / totalWords) * 100 : (100 / allScenes.length);
            const status = sceneData.scene.status || 'draft';
            segment.style.height = `${heightPercent}%`;
            segment.className = `progress-scene-segment status-${status}${segment.classList.contains('active') ? ' active' : ''}`;
            segment.title = `${sceneData.chapterTitle} - ${sceneData.scene.title} (${sceneData.wordCount} mots)`;
        }
    });
}

/**
 * [MVVM : View]
 * Met à jour dynamiquement l'indicateur de progression actif.
 */
function updateEditorProgressIndicator() {
    if (typeof currentActId !== 'undefined' && currentActId === 'all') {
        updateFullBookProgressIndicator();
    } else if (typeof currentActId !== 'undefined' && currentActId !== null) {
        const act = project.acts.find(a => a.id === currentActId);
        if (!act) return;

        // Si on est en vue chapitre (un seul indicateur pour le chapitre)
        const chapterIndicator = document.getElementById('chapterProgressIndicator');
        if (chapterIndicator && typeof currentChapterId !== 'undefined') {
            const chapter = act.chapters.find(c => c.id === currentChapterId);
            if (chapter) updateChapterProgressIndicator(chapter);
        } else {
            // Vue Acte
            updateActProgressIndicator(act);
        }
    }
}

/**
 * [MVVM : View]
 * Met à jour les proportions de l'indicateur de progression du chapitre.
 */
function updateChapterProgressIndicator(chapter) {
    let totalWords = 0;
    const sceneWordCounts = [];

    chapter.scenes.forEach(scene => {
        const wc = typeof getWordCount === 'function' ? getWordCount(scene.content) : (scene.wordCount || 0);
        sceneWordCounts.push(wc);
        totalWords += wc;
    });

    chapter.scenes.forEach((scene, index) => {
        const segment = document.querySelector(`#chapterProgressIndicator .progress-scene-segment[data-scene-index="${index}"]`);
        if (segment) {
            const wc = sceneWordCounts[index];
            const heightPercent = totalWords > 0 ? (wc / totalWords) * 100 : (100 / chapter.scenes.length);
            const status = scene.status || 'draft';
            segment.style.height = `${heightPercent}%`;
            segment.className = `progress-scene-segment status-${status}${segment.classList.contains('active') ? ' active' : ''}`;
            segment.title = `${scene.title} (${wc} mots)`;
        }
    });
}

/**
 * [MVVM : View]
 * Initialise le tracking de scroll pour l'éditeur d'acte.
 */
/**
 * [MVVM : View]
 * Initialise le tracking de scroll pour l'éditeur d'acte.
 * OPTIMISÉ avec requestAnimationFrame et Debounce
 */
function initActScrollTracking(actId, allScenes) {
    const editorContent = document.getElementById('actEditorContent');
    const indicator = document.getElementById('progressCurrentIndicator');

    if (!editorContent || !indicator) return;

    // IMPORTANT: Trouver le workspace parent spécifique
    const workspace = editorContent.closest('.editor-workspace');
    if (!workspace) return;

    let currentSceneIndex = 0;
    let ticking = false;
    let updateTimeout = null;

    function updateScrollPosition() {
        const sceneBlocks = Array.from(workspace.querySelectorAll('.act-scene-block'));
        if (sceneBlocks.length === 0) return;

        const workspaceRect = workspace.getBoundingClientRect();
        const viewportMiddle = workspaceRect.top + workspaceRect.height / 2;

        let closestScene = 0;
        let closestDistance = Infinity;

        sceneBlocks.forEach((block, index) => {
            const rect = block.getBoundingClientRect();
            const blockMiddle = rect.top + rect.height / 2;
            const distance = Math.abs(blockMiddle - viewportMiddle);

            if (distance < closestDistance) {
                closestDistance = distance;
                closestScene = index;
            }
        });

        if (closestScene !== currentSceneIndex) {
            currentSceneIndex = closestScene;
            const sceneData = allScenes[closestScene];

            if (updateTimeout) clearTimeout(updateTimeout);
            updateTimeout = setTimeout(() => {
                if (sceneData) {
                    setActiveScene(actId, sceneData.chapterId, sceneData.scene.id);
                    if (typeof updateLiveTensionMeter === 'function') {
                        const sceneEditor = workspace.querySelector(`.editor-textarea[data-scene-id="${sceneData.scene.id}"]`);
                        updateLiveTensionMeter(sceneEditor ? sceneEditor.innerHTML : sceneData.scene.content);
                    }
                }
            }, 100);
        }

        const progressIndicator = workspace.parentElement.querySelector('.chapter-progress-indicator');
        if (progressIndicator) {
            const segments = Array.from(progressIndicator.querySelectorAll('.progress-scene-segment'));
            let topOffset = 0;

            for (let i = 0; i < currentSceneIndex; i++) {
                const seg = segments[i];
                if (seg) topOffset += seg.offsetHeight;
            }

            const currentBlock = sceneBlocks[currentSceneIndex];
            if (currentBlock) {
                const blockRect = currentBlock.getBoundingClientRect();
                const relativeScroll = Math.max(0, Math.min(1, (workspaceRect.top - blockRect.top) / blockRect.height));
                const currentSegment = segments[currentSceneIndex];
                if (currentSegment) {
                    topOffset += currentSegment.offsetHeight * relativeScroll;
                }
            }

            indicator.style.top = `${topOffset}px`;
            segments.forEach((seg, i) => {
                if (i === currentSceneIndex) seg.classList.add('active');
                else seg.classList.remove('active');
            });
        }
    }

    const handler = function () {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                updateScrollPosition();
                ticking = false;
            });
            ticking = true;
        }
    };

    workspace.addEventListener('scroll', handler, { passive: true });
    workspace._scrollHandler = handler;

    currentSceneIndex = -1;
    window.requestAnimationFrame(updateScrollPosition);
}

/**
 * [MVVM : View]
 * Sauvegarde le synopsis d'une scène depuis un textarea.
 */
function saveSceneSynopsis(actId, chapterId, sceneId, textarea) {
    const act = project.acts.find(a => a.id === actId);
    const chapter = act?.chapters.find(c => c.id === chapterId);
    const scene = chapter?.scenes.find(s => s.id === sceneId);
    if (!scene) return;

    const newSynopsis = textarea.value.trim();
    scene.synopsis = newSynopsis;

    // Sauvegarder le projet
    if (typeof saveProject === 'function') saveProject();
    if (typeof renderActsList === 'function') renderActsList();
}

/**
 * [MVVM : View]
 * Gère les raccourcis clavier dans le textarea de synopsis.
 */
function handleSynopsisKeydown(event, textarea) {
    if (event.key === 'Escape') {
        textarea.blur();
    }
}

/**
 * [MVVM : View]
 * Auto-redimensionne le textarea de synopsis selon son contenu.
 */
function autoResizeSynopsis(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
}

/**
 * [MVVM : View]
 * Fait défiler jusqu'à une scène spécifique dans le mode acte.
 */
function scrollToActScene(sceneIndex) {
    const sceneBlock = document.querySelector(`.act-scene-block[data-scene-index="${sceneIndex}"]`);
    if (sceneBlock) {
        sceneBlock.scrollIntoView({ behavior: 'smooth', block: 'start' });

        // Placer le curseur au début de l'éditeur de cette scène
        const editor = sceneBlock.querySelector('.editor-textarea');
        // Note: focus supprimé pour éviter les conflits de scroll
    }
}

// --- WELCOME SCREENS ---

function renderWelcomeEditor() {
    const container = document.getElementById('editorView');
    if (!container) return;
    container.innerHTML = `
        <div class="empty-state">
            <div class="empty-state-icon"><i data-lucide="pencil-line" style="width:48px;height:48px;stroke-width:1.5;"></i></div>
            <div class="empty-state-title">${Localization.t('split.empty_state_select_scene')}</div>
            <div class="empty-state-text">${Localization.t('split.empty_state_select_sidebar')}</div>
        </div>`;
}

function renderCharacterWelcome() {
    const container = document.getElementById('editorView');
    if (!container) return;
    container.innerHTML = `
        <div class="empty-state">
            <div class="empty-state-icon"><i data-lucide="users" style="width:48px;height:48px;stroke-width:1.5;"></i></div>
            <div class="empty-state-title">${Localization.t('split.empty_state_characters')}</div>
            <div class="empty-state-text">${Localization.t('split.empty_state_select_character')}</div>
        </div>`;
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function renderWorldWelcome() {
    const container = document.getElementById('editorView');
    if (!container) return;
    container.innerHTML = `
        <div class="empty-state">
            <div class="empty-state-icon"><i data-lucide="globe" style="width:48px;height:48px;stroke-width:1.5;"></i></div>
            <div class="empty-state-title">${Localization.t('split.empty_state_world')}</div>
            <div class="empty-state-text">${Localization.t('split.empty_state_select_element')}</div>
        </div>`;
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function renderNotesWelcome() {
    const container = document.getElementById('editorView');
    if (!container) return;
    container.innerHTML = `
        <div class="empty-state">
            <div class="empty-state-icon"><i data-lucide="sticky-note" style="width:48px;height:48px;stroke-width:1.5;"></i></div>
            <div class="empty-state-title">${Localization.t('split.empty_state_notes')}</div>
            <div class="empty-state-text">${Localization.t('split.empty_state_select_note')}</div>
        </div>`;
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function renderCodexWelcome() {
    const container = document.getElementById('editorView');
    if (!container) return;
    container.innerHTML = `
        <div class="empty-state">
            <div class="empty-state-icon"><i data-lucide="book-open" style="width:48px;height:48px;stroke-width:1.5;"></i></div>
            <div class="empty-state-title">${Localization.t('split.empty_state_codex')}</div>
            <div class="empty-state-text">${Localization.t('split.empty_state_select_codex')}</div>
        </div>`;
    if (typeof lucide !== 'undefined') lucide.createIcons();
}


// --- SIDEBAR SHORTCUTS & COLLAPSE ---

/**
 * Renders the draggable sidebar shortcuts.
 */
function renderSidebarShortcuts(shortcuts = null, isEditing = false) {
    const container = document.getElementById('sidebarShortcuts');
    if (!container) return;

    // 1. Determine which shortcuts to show (Handling temp state while editing)
    let list = shortcuts;
    const vm = InterfaceCustomizerViewModel;

    if (!list) {
        if (vm && vm.state && vm.state.isEditing) {
            list = vm.state.tempSettings.shortcuts;
        } else if (typeof InterfaceCustomizerRepository !== 'undefined') {
            const settings = InterfaceCustomizerRepository.loadSettings();
            list = settings ? settings.shortcuts : null;
        }
    }

    // Default fallback if still nothing
    if (!list || !Array.isArray(list)) {
        list = ['projects', 'editor', 'corkboard', 'notes', 'characters', 'world'];
    }

    // 2. Generate HTML items
    const html = list.map(id => {
        const cleanId = String(id).trim();
        const item = NAVIGATION_ITEMS.find(i => String(i.id).trim() == cleanId);
        if (!item) return '';

        const isActive = (typeof currentView !== 'undefined' && currentView === cleanId);
        const label = Localization.t(item.label);

        return `
            <div class="sidebar-shortcut-item ${isActive ? 'active' : ''}"
                 onclick="switchView('${cleanId}')"
                 title="${label}"
                 data-id="${cleanId}">
                <i data-lucide="${item.icon}"></i>
                ${isEditing ? `<div class="shortcut-remove-btn" onclick="removeSidebarShortcut('${cleanId}', event)">×</div>` : ''}
            </div>
        `;
    }).join('');

    // 3. Add Customize + Collapse/Expand buttons
    const col = document.getElementById('sidebarColumn');
    const isCollapsed = col ? col.classList.contains('collapsed') : false;
    const customizeBtn = `
        <button class="sidebar-customize-btn" onclick="InterfaceCustomizerViewModel.startEditing()" title="${Localization.t('customizer.sidebar.btn_title')}" id="sidebarCustomizeBtn">
            <i data-lucide="settings-2"></i>
        </button>
    `;
    const toggleBtn = `
        <button class="sidebar-collapse-btn" onclick="toggleSidebarCollapse()" title="${isCollapsed ? 'Déplier' : 'Replier'}">
            <i data-lucide="${isCollapsed ? 'panel-left-open' : 'panel-left-close'}"></i>
        </button>
    `;

    // 4. Inject and Process Icons
    container.innerHTML = html + customizeBtn + toggleBtn;

    if (typeof lucide !== 'undefined') {
        lucide.createIcons({ root: container });
    }

    // 5. Re-attach Drag & Drop if needed
    if (isEditing) {
        setupShortcutsDragAndDrop(container, list);
    } else {
        disableShortcutsDragAndDrop();
    }
}

/**
 * Disables Drag & Drop on accordion items.
 */
function disableShortcutsDragAndDrop() {
    document.querySelectorAll('.accordion-nav-item').forEach(item => {
        item.removeAttribute('draggable');
        item.style.cursor = '';
        item.ondragstart = null;
        item.ondragend = null;
    });
}

/**
 * Removes a shortcut from the list (Edit Mode).
 */
function removeSidebarShortcut(id, event) {
    if (event) event.stopPropagation();

    if (typeof InterfaceCustomizerViewModel !== 'undefined' && InterfaceCustomizerViewModel.state.isEditing) {
        const currentShortcuts = InterfaceCustomizerViewModel.state.tempSettings.shortcuts || ['projects', 'editor', 'corkboard', 'notes', 'characters', 'world'];
        const newShortcuts = currentShortcuts.filter(s => s !== id);

        InterfaceCustomizerViewModel.state.tempSettings.shortcuts = newShortcuts;
        renderSidebarShortcuts(newShortcuts, true);
    }
}

/**
 * Toggles the sidebar collapse state.
 */
function toggleSidebarCollapse() {
    const col = document.getElementById('sidebarColumn');
    if (col) {
        col.classList.toggle('collapsed');
        const isCollapsed = col.classList.contains('collapsed');

        // Force hide/show if CSS fails or for animation smoothness
        const accordion = document.getElementById('sidebarAccordion');
        const sidebar = document.getElementById('sidebar');

        if (isCollapsed) {
            if (accordion) accordion.style.display = 'none';
            if (sidebar) sidebar.style.display = 'none';
        } else {
            if (accordion) accordion.style.display = '';
            if (sidebar) sidebar.style.display = '';
        }

        // Re-render shortcuts to update the toggle icon
        const isEditing = document.body.classList.contains('interface-edit-mode');
        // Get current shortcuts
        let shortcuts = null;
        if (typeof InterfaceCustomizerViewModel !== 'undefined' && isEditing) {
            shortcuts = InterfaceCustomizerViewModel.state.tempSettings.shortcuts;
        } else if (typeof InterfaceCustomizerRepository !== 'undefined') {
            shortcuts = InterfaceCustomizerRepository.loadSettings().shortcuts;
        }

        renderSidebarShortcuts(shortcuts, isEditing);

        // Handle resizing event globally
        window.dispatchEvent(new Event('resize'));
    }
}

/**
 * Sets up Drag & Drop for shortcuts.
 */
function setupShortcutsDragAndDrop(container, currentShortcuts) {
    if (!container) return;

    // Direct property assignment to override any previous handlers
    container.ondragover = (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'copy';
        container.classList.add('drag-over');
    };

    container.ondragleave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.relatedTarget && container.contains(e.relatedTarget)) return;
        container.classList.remove('drag-over');
    };

    container.ondrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        container.classList.remove('drag-over');
        container.classList.remove('can-drop');

        const rawId = e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('Text');
        const id = rawId ? rawId.trim() : null;

        console.log('[SHORTCUT DROP] Raw ID:', rawId, 'Cleaned ID:', id);

        if (id) {
            const vm = InterfaceCustomizerViewModel;
            console.log('[SHORTCUT DROP] ViewModel:', vm);
            console.log('[SHORTCUT DROP] Is Editing:', vm?.state?.isEditing);

            if (vm && vm.state && vm.state.isEditing) {
                // Initialize tempSettings if empty
                if (!vm.state.tempSettings.shortcuts) {
                    vm.state.tempSettings.shortcuts = [...(currentShortcuts || [])];
                    console.log('[SHORTCUT DROP] Initialized shortcuts:', vm.state.tempSettings.shortcuts);
                }

                const list = vm.state.tempSettings.shortcuts;
                const alreadyExists = list.some(s => String(s).trim() == String(id));

                console.log('[SHORTCUT DROP] Current list:', list);
                console.log('[SHORTCUT DROP] Already exists:', alreadyExists);

                if (!alreadyExists) {
                    // Final safety: check if ID exists in navigation items
                    const isValid = NAVIGATION_ITEMS.some(i => String(i.id).trim() == String(id));
                    console.log('[SHORTCUT DROP] Is valid nav item:', isValid);

                    if (isValid) {
                        const newList = [...list, id];
                        vm.state.tempSettings.shortcuts = newList;
                        console.log('[SHORTCUT DROP] New list:', newList);
                        // Trigger immediate UI refresh
                        renderSidebarShortcuts(newList, true);
                        console.log('[SHORTCUT DROP] Rendered shortcuts');
                    }
                } else {
                    console.log('[SHORTCUT DROP] Item already in shortcuts, skipping');
                }
            }
        }
    };

    // Attaching drag events to accordion items
    const items = document.querySelectorAll('.accordion-nav-item');
    items.forEach(item => {
        item.setAttribute('draggable', 'true');
        item.style.cursor = 'grab';

        // Extract ID from nav-item-{id}
        const navId = item.id.replace('nav-item-', '').trim();

        item.ondragstart = (e) => {
            const cleanId = String(navId).trim();
            // Store ID in multiple formats for browser compatibility
            e.dataTransfer.effectAllowed = 'copy';
            e.dataTransfer.setData('text/plain', cleanId);
            e.dataTransfer.setData('Text', cleanId);
            item.classList.add('dragging');
            container.classList.add('can-drop');
        };

        item.ondragend = (e) => {
            item.classList.remove('dragging');
            container.classList.remove('can-drop');
            container.classList.remove('drag-over');
        };
    });
}

// Initial Render of Shortcuts
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        renderSidebarShortcuts();
    }, 200); // Wait for navigation items to be loaded/rendered
});
