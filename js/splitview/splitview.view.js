// ==========================================
// SPLIT VIEW SYSTEM - View
// ==========================================

/** [MVVM : View] - Met à jour l'état visuel du bouton de bascule dans le DOM */
function updateSplitToggleButton() {
    const btn = document.getElementById('splitModeToggle');
    if (btn) {
        if (splitViewActive) {
            btn.classList.add('active');
            btn.innerHTML = `<i data-lucide="columns-2" style="width:14px;height:14px;"></i> <span>${Localization.t('split.toggle_active')}</span>`;
        } else {
            btn.classList.remove('active');
            btn.innerHTML = `<i data-lucide="columns-2" style="width:14px;height:14px;"></i> <span>${Localization.t('split.toggle')}</span>`;
        }
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
}

/** [MVVM : View] - Génère et injecte la structure HTML principale du mode split */
function renderSplitView() {
    if (!splitViewActive) return;

    const editorView = document.getElementById('editorView');
    if (!editorView) return;

    const ratio = splitViewState.ratio || 60;

    const leftLabel = splitViewState.left.view ? viewLabels[splitViewState.left.view] || Localization.t('split.view_label') : Localization.t('split.empty_label');
    const rightLabel = splitViewState.right.view ? viewLabels[splitViewState.right.view] || Localization.t('split.view_label') : Localization.t('split.empty_label');
    const leftIcon = splitViewState.left.view ? viewIcons[splitViewState.left.view] || 'file' : 'plus-circle';
    const rightIcon = splitViewState.right.view ? viewIcons[splitViewState.right.view] || 'file' : 'plus-circle';

    editorView.innerHTML = `
        <div class="split-view-container" id="splitViewContainer">
            <div class="split-panel split-panel-left ${splitActivePanel === 'left' ? 'active' : ''}" 
                 id="splitPanelLeft" 
                 style="flex: ${ratio};"
                 onclick="setActiveSplitPanel('left')">
                <div class="split-panel-header" onclick="openSplitViewSelector('left'); event.stopPropagation();">
                    <div class="split-panel-title" id="splitLeftTitle">
                        <i data-lucide="${leftIcon}" style="width:14px;height:14px;"></i>
                        <span>${leftLabel}</span>
                        <i data-lucide="chevron-down" style="width:12px;height:12px;opacity:0.5;margin-left:4px;"></i>
                    </div>
                    <div class="split-panel-actions" onclick="event.stopPropagation();">
                        <span class="split-panel-indicator ${splitActivePanel === 'left' ? 'active' : ''}" title="${Localization.t('split.active_panel_title')}">
                            <i data-lucide="circle" style="width:8px;height:8px;fill:currentColor;"></i>
                        </span>
                    </div>
                </div>
                <div class="split-panel-content" id="splitLeftContent">
                    <!-- Content rendered by renderSplitPanelViewContent -->
                </div>
            </div>
            
            <div class="split-resizer horizontal" id="splitResizer" 
                 onmousedown="startSplitResize(event)"
                 ontouchstart="startSplitResize(event)"></div>
            
            <div class="split-panel split-panel-right ${splitActivePanel === 'right' ? 'active' : ''}" 
                 id="splitPanelRight" 
                 style="flex: ${100 - ratio};"
                 onclick="setActiveSplitPanel('right')">
                <div class="split-panel-header" onclick="openSplitViewSelector('right'); event.stopPropagation();">
                    <div class="split-panel-title" id="splitRightTitle">
                        <i data-lucide="${rightIcon}" style="width:14px;height:14px;"></i>
                        <span>${rightLabel}</span>
                        <i data-lucide="chevron-down" style="width:12px;height:12px;opacity:0.5;margin-left:4px;"></i>
                    </div>
                    <div class="split-panel-actions" onclick="event.stopPropagation();">
                        <span class="split-panel-indicator ${splitActivePanel === 'right' ? 'active' : ''}" title="${Localization.t('split.active_panel_title')}">
                            <i data-lucide="circle" style="width:8px;height:8px;fill:currentColor;"></i>
                        </span>
                        <button class="split-panel-btn" onclick="closeSplitView(); event.stopPropagation();" title="${Localization.t('split.close_title')}">
                            <i data-lucide="x" style="width:12px;height:12px;"></i>
                        </button>
                    </div>
                </div>
                <div class="split-panel-content" id="splitRightContent">
                    <!-- Content rendered by renderSplitPanelViewContent -->
                </div>
            </div>
        </div>
    `;

    // Render content for both panels
    renderSplitPanelViewContent('left');
    renderSplitPanelViewContent('right');

    // Update sidebar for active panel
    updateSidebarForSplitPanel(splitActivePanel);

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

/** [MVVM : View] - Manipulle le DOM de la barre latérale pour correspondre à la vue du panneau actif */
function updateSidebarForSplitPanel(panel) {
    const state = panel === 'left' ? splitViewState.left : splitViewState.right;
    const view = state.view;

    if (!view) return;

    // Map views to their sidebar lists
    const sidebarViews = {
        'editor': 'chaptersList',
        'characters': 'charactersList',
        'world': 'worldList',
        'notes': 'notesList',
        'codex': 'codexList',
        'arcs': 'arcsList',
        'mindmap': 'mindmapList',
        'timelineviz': 'timelineVizList'
    };

    // Views that don't use sidebar (full-screen views)
    const noSidebarViews = ['stats', 'analysis', 'versions', 'todos', 'timeline', 'corkboard', 'plot', 'relations', 'map'];

    // Labels for views without sidebar
    const viewLabelsNoSidebar = {
        'stats': Localization.t('nav.stats'),
        'analysis': Localization.t('nav.analysis'),
        'versions': Localization.t('nav.snapshots'),
        'todos': Localization.t('nav.todos'),
        'timeline': Localization.t('nav.timeline'),
        'corkboard': Localization.t('nav.corkboard'),
        'plot': Localization.t('nav.plot'),
        'relations': Localization.t('nav.relations'),
        'map': Localization.t('nav.map')
    };

    // Hide all sidebar lists including noSidebarMessage
    const allLists = [
        'chaptersList', 'charactersList', 'worldList', 'timelineList',
        'notesList', 'codexList', 'statsList', 'versionsList', 'analysisList',
        'todosList', 'corkboardList', 'mindmapList', 'plotList',
        'relationsList', 'mapList', 'timelineVizList', 'noSidebarMessage'
    ];
    allLists.forEach(listId => {
        const el = document.getElementById(listId);
        if (el) el.style.display = 'none';
    });

    // Show the appropriate list and refresh its content
    if (sidebarViews[view]) {
        const listEl = document.getElementById(sidebarViews[view]);
        if (listEl) listEl.style.display = 'block';

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
            case 'mindmap':
                if (typeof renderMindmapList === 'function') renderMindmapList();
                break;
            case 'timelineviz':
                if (typeof renderTimelineVizList === 'function') renderTimelineVizList();
                break;
        }
    } else if (noSidebarViews.includes(view)) {
        // Show message for views without sidebar
        const noSidebarEl = document.getElementById('noSidebarMessage');
        if (noSidebarEl) {
            const viewLabel = viewLabelsNoSidebar[view] || Localization.t('split.view_label');
            noSidebarEl.innerHTML = `
                <div style="padding: 2rem 1rem; text-align: center; color: var(--text-muted);">
                    <i data-lucide="layout-dashboard" style="width: 48px; height: 48px; opacity: 0.3; margin-bottom: 1rem;"></i>
                    <div style="font-size: 0.9rem; line-height: 1.6;">
                        <strong>${viewLabel}</strong> ${Localization.t('split.no_sidebar_view', [viewLabel])}
                    </div>
                    <div style="font-size: 0.85rem; margin-top: 0.5rem; opacity: 0.8;">
                        ${Localization.t('split.no_sidebar_msg')}
                    </div>
                </div>
            `;
            noSidebarEl.style.display = 'block';

            // Refresh icons
            setTimeout(() => {
                if (typeof lucide !== 'undefined') lucide.createIcons();
            }, 50);
        }
    }

    // Update sidebar actions
    const actionsHTML = {
        editor: `<button class="btn btn-primary" onclick="openAddActModal()">${Localization.t('btn.add_act')}</button><button class="btn btn-primary" onclick="openAddChapterModal()">${Localization.t('btn.add_chapter')}</button><button class="btn btn-primary" onclick="openAddSceneModalQuick()">${Localization.t('btn.add_scene')}</button>`,
        characters: `<button class="btn btn-primary" onclick="openAddCharacterModal()">${Localization.t('btn.add_character')}</button>`,
        world: `<button class="btn btn-primary" onclick="openAddWorldModal()">${Localization.t('btn.add_world')}</button>`,
        notes: `<button class="btn btn-primary" onclick="openAddNoteModal()">${Localization.t('btn.add_note')}</button>`,
        codex: `<button class="btn btn-primary" onclick="openAddCodexModal()">${Localization.t('btn.add_codex')}</button>`,
        arcs: `<button class="btn btn-primary" onclick="createNewArc()">${Localization.t('btn.add_arc')}</button>`
    };
    const sidebarActions = document.getElementById('sidebarActions');
    if (sidebarActions) {
        sidebarActions.innerHTML = actionsHTML[view] || '';
    }

    // Update structure-only elements visibility
    const structureOnlyElements = ['projectProgressBar', 'statusFilters', 'sceneTools', 'toolsSidebar'];
    structureOnlyElements.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = (view === 'editor') ? '' : 'none';
    });

    // Update tree collapse toolbar visibility (for views with collapsible groups)
    const treeCollapseToolbar = document.getElementById('treeCollapseToolbar');
    const viewsWithGroups = ['editor', 'world', 'notes', 'codex'];
    if (treeCollapseToolbar) {
        treeCollapseToolbar.style.display = viewsWithGroups.includes(view) ? '' : 'none';
    }

    // Refresh Lucide icons
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

/** [MVVM : View] - Met à jour l'en-tête (titre et icône) d'un panneau split */
function updateSplitPanelHeader(panel) {
    const state = panel === 'left' ? splitViewState.left : splitViewState.right;
    const titleEl = document.getElementById(panel === 'left' ? 'splitLeftTitle' : 'splitRightTitle');

    if (titleEl) {
        const label = state.view ? viewLabels[state.view] || Localization.t('split.view_label') : Localization.t('split.empty_label');
        const icon = state.view ? viewIcons[state.view] || 'file' : 'plus-circle';
        titleEl.innerHTML = `
            <i data-lucide="${icon}" style="width:14px;height:14px;"></i>
            <span>${label}</span>
            <i data-lucide="chevron-down" style="width:12px;height:12px;opacity:0.5;margin-left:4px;"></i>
        `;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
}

/** [MVVM : View] - Prépare et initialise le conteneur de contenu pour un panneau */
function renderSplitPanelViewContent(panel) {
    const container = document.getElementById(panel === 'left' ? 'splitLeftContent' : 'splitRightContent');
    if (!container) return;

    const state = panel === 'left' ? splitViewState.left : splitViewState.right;
    const view = state.view;

    if (!view) {
        container.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: var(--text-muted); text-align: center; padding: 2rem;">
                <i data-lucide="plus-circle" style="width:48px;height:48px;stroke-width:1;margin-bottom:1rem;opacity:0.5;"></i>
                <div style="font-size: 1rem; margin-bottom: 0.5rem;">${Localization.t('split.empty_panel_title')}</div>
                <div style="font-size: 0.85rem; margin-bottom: 1rem;">${Localization.t('split.empty_panel_desc')}</div>
            </div>
        `;
        if (typeof lucide !== 'undefined') lucide.createIcons();
        return;
    }

    // Create a unique container ID for this panel's content
    const contentId = `split-${panel}-view-content`;
    container.innerHTML = `<div id="${contentId}" style="height: 100%; overflow: auto;"></div>`;

    const contentContainer = document.getElementById(contentId);

    // Render the view content into this container
    if (typeof renderViewInSplitPanel === 'function') {
        renderViewInSplitPanel(view, contentContainer, state, panel);
    }
}

/** [MVVM : View] - Génère le HTML complet de l'éditeur pour un panneau split */
function renderEditorInContainer(act, chapter, scene, container, panel) {
    const wordCount = typeof getWordCount === 'function' ? getWordCount(scene.content || '') : 0;

    // Vérifier si une version finale existe
    const hasFinalVersion = scene.versions && scene.versions.some(v => v.isFinal === true);
    const finalVersion = hasFinalVersion ? scene.versions.find(v => v.isFinal === true) : null;
    const finalVersionBadge = hasFinalVersion
        ? `<span style="display: inline-flex; align-items: center; gap: 0.25rem; background: var(--accent-gold); color: var(--bg-accent); font-size: 0.7rem; font-weight: 600; padding: 0.2rem 0.5rem; border-radius: 10px; margin-left: 0.5rem;" title="${Localization.t('editor.final_version_title', [finalVersion.number])}"><i data-lucide="star" style="width:10px;height:10px;fill:currentColor;"></i> ${finalVersion.number}</span>`
        : '';

    const toolbarHTML = typeof getEditorToolbarHTML === 'function' ? getEditorToolbarHTML(panel) : '';

    container.innerHTML = `
        <div class="editor-fixed-top" style="position: relative;">
            <div class="editor-header">
                <div class="editor-breadcrumb">${act.title} > ${chapter.title}</div>
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <div class="editor-title" style="flex: 1;">${scene.title}${finalVersionBadge}</div>
                </div>
                <div class="editor-meta">
                    <span class="split-word-count-${panel}">${Localization.t('editor.word_count', [wordCount])}</span>
                    <span>${Localization.t('editor.last_modified', [new Date().toLocaleDateString(Localization.getLocale() === 'fr' ? 'fr-FR' : 'en-US')])}</span>
                </div>
            </div>
            <button class="toolbar-mobile-toggle" onclick="toggleSplitEditorToolbar('${panel}')">
                <span><i data-lucide="pen-line" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i>${Localization.t('split.toolbar_formatting')}</span>
            </button>
            <div class="editor-toolbar" id="editorToolbar-${panel}">
                ${toolbarHTML}
            </div>
            <div class="links-panel-sticky" id="linksPanel-${panel}">
                <div style="display: flex; gap: 2rem; align-items: start;">
                    <div style="flex: 1;">
                        <div style="font-size: 0.85rem; font-weight: 600; margin-bottom: 0.5rem; color: var(--text-muted);"><i data-lucide="users" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i>${Localization.t('split.links_characters')}</div>
                        <div class="quick-links"></div>
                    </div>
                    <div style="flex: 1;">
                        <div style="font-size: 0.85rem; font-weight: 600; margin-bottom: 0.5rem; color: var(--text-muted);"><i data-lucide="globe" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i>${Localization.t('split.links_world')}</div>
                        <div class="quick-links"></div>
                    </div>
                    <div style="flex: 1;">
                        <div style="font-size: 0.85rem; font-weight: 600; margin-bottom: 0.5rem; color: var(--text-muted);"><i data-lucide="train-track" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i>${Localization.t('split.links_timeline')}</div>
                        <div class="quick-links"></div>
                    </div>
                </div>
            </div>
        </div>
        <div class="editor-workspace">
            <div class="editor-content">
                <div 
                    class="editor-textarea" 
                    contenteditable="true"
                    spellcheck="true"
                    id="editor-${panel}"
                    data-panel="${panel}"
                    data-scene-id="${scene.id}"
                    data-chapter-id="${chapter.id}"
                    data-act-id="${act.id}"
                    data-placeholder="${Localization.t('split.placeholder_start')}"
                    oninput="updateSplitSceneContent(this)"
                    onkeydown="typeof handleEditorKeydown === 'function' ? handleEditorKeydown(event) : null"
                >${scene.content || ''}</div>
            </div>
        </div>
    `;

    // Initialize lucide icons and color pickers
    setTimeout(() => {
        if (typeof lucide !== 'undefined') lucide.createIcons();
        if (typeof initializeColorPickers === 'function') initializeColorPickers(panel);
    }, 50);
}

/** [MVVM : View] - Alterne la visibilité de la barre d'outils de l'éditeur en mode split */
function toggleSplitEditorToolbar(panel) {
    const toolbar = document.getElementById('editorToolbar-' + panel);
    if (toolbar) {
        toolbar.classList.toggle('visible');
    }
}

/** [MVVM : View] - Applique des commandes de formatage directement au DOM de l'éditeur */
function formatTextInPanel(panel, command, value = null) {
    const editor = document.getElementById('editor-' + panel);
    if (!editor) return;

    // Focus the editor first
    editor.focus();

    // Execute the command
    if (value) {
        document.execCommand(command, false, value);
    } else {
        document.execCommand(command, false, null);
    }
}

/** [MVVM : View] - Ouvre la modal de sélection de vue pour un panneau */
let currentSplitSelectorPanel = null;
function openSplitViewSelector(panel) {
    currentSplitSelectorPanel = panel;

    const content = document.getElementById('splitSelectorContent');
    if (!content) return;

    const currentPanelState = panel === 'left' ? splitViewState.left : splitViewState.right;
    const currentView = currentPanelState.view;

    const views = [
        { id: 'editor', label: Localization.t('split.view_structure_label'), icon: 'pen-line', desc: Localization.t('split.view_structure_desc') },
        { id: 'characters', label: Localization.t('split.view_characters_label'), icon: 'users', desc: Localization.t('split.view_characters_desc') },
        { id: 'world', label: Localization.t('split.view_world_label'), icon: 'globe', desc: Localization.t('split.view_world_desc') },
        { id: 'notes', label: Localization.t('split.view_notes_label'), icon: 'sticky-note', desc: Localization.t('split.view_notes_desc') },
        { id: 'codex', label: Localization.t('split.view_codex_label'), icon: 'book-open', desc: Localization.t('split.view_codex_desc') },
        { id: 'corkboard', label: Localization.t('split.view_corkboard_label'), icon: 'layout-grid', desc: Localization.t('split.view_corkboard_desc') },
        { id: 'mindmap', label: Localization.t('split.view_mindmap_label'), icon: 'git-branch', desc: Localization.t('split.view_mindmap_desc') },
        { id: 'plot', label: Localization.t('split.view_plot_label'), icon: 'trending-up', desc: Localization.t('split.view_plot_desc') },
        { id: 'relations', label: Localization.t('split.view_relations_label'), icon: 'heart-handshake', desc: Localization.t('split.view_relations_desc') },
        { id: 'map', label: Localization.t('split.view_map_label'), icon: 'map', desc: Localization.t('split.view_map_desc') },
        { id: 'timelineviz', label: Localization.t('split.view_timelineviz_label'), icon: 'train-track', desc: Localization.t('split.view_timelineviz_desc') },
        { id: 'timeline', label: Localization.t('split.view_timeline_label'), icon: 'calendar-range', desc: Localization.t('split.view_timeline_desc') },
        { id: 'stats', label: Localization.t('split.view_stats_label'), icon: 'bar-chart-3', desc: Localization.t('split.view_stats_desc') },
        { id: 'analysis', label: Localization.t('split.view_analysis_label'), icon: 'trending-up', desc: Localization.t('split.view_analysis_desc') },
        { id: 'versions', label: Localization.t('split.view_versions_label'), icon: 'file-clock', desc: Localization.t('split.view_versions_desc') },
        { id: 'todos', label: Localization.t('split.view_todos_label'), icon: 'list-todo', desc: Localization.t('split.view_todos_desc') }
    ];

    content.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; padding: 0.5rem;">
            ${views.map(v => `
                <div class="split-view-option ${currentView === v.id ? 'active' : ''}" 
                     onclick="selectSplitPanelView('${v.id}')"
                     style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem; padding: 1rem 0.5rem; border-radius: 8px; cursor: pointer; background: ${currentView === v.id ? 'var(--primary-color)' : 'var(--bg-secondary)'}; color: ${currentView === v.id ? 'white' : 'var(--text-primary)'}; transition: all 0.15s; text-align: center;">
                    <i data-lucide="${v.icon}" style="width:28px;height:28px;"></i>
                    <div>
                        <div style="font-weight: 600; font-size: 0.9rem;">${v.label}</div>
                        <div style="font-size: 0.7rem; opacity: 0.7; margin-top: 0.25rem;">${v.desc}</div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;

    document.getElementById('splitSelectorModal')?.classList.add('active');
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

/** [MVVM : View] - Initialise le processus de redimensionnement des panneaux via la souris/tactile */
let isResizing = false;
function startSplitResize(e) {
    isResizing = true;

    const resizer = document.getElementById('splitResizer');
    if (resizer) resizer.classList.add('dragging');

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    document.addEventListener('mousemove', doSplitResize);
    document.addEventListener('mouseup', stopSplitResize);
    document.addEventListener('touchmove', doSplitResize, { passive: false });
    document.addEventListener('touchend', stopSplitResize);

    e.preventDefault();
}

/** [MVVM : View] - Calcule le nouveau ratio et met à jour le style CSS des panneaux */
function doSplitResize(e) {
    if (!isResizing) return;

    const container = document.getElementById('splitViewContainer');
    if (!container) return;

    const currentX = e.clientX || (e.touches && e.touches[0].clientX);
    const containerRect = container.getBoundingClientRect();
    const containerWidth = containerRect.width;

    let newRatio = ((currentX - containerRect.left) / containerWidth) * 100;
    newRatio = Math.max(20, Math.min(80, newRatio));

    splitViewState.ratio = newRatio;

    const leftPanel = document.getElementById('splitPanelLeft');
    const rightPanel = document.getElementById('splitPanelRight');

    if (leftPanel) leftPanel.style.flex = newRatio;
    if (rightPanel) rightPanel.style.flex = 100 - newRatio;

    e.preventDefault();
}

/** [MVVM : View] - Finalise le redimensionnement et sauvegarde l'état */
function stopSplitResize() {
    isResizing = false;

    const resizer = document.getElementById('splitResizer');
    if (resizer) resizer.classList.remove('dragging');

    document.body.style.cursor = '';
    document.body.style.userSelect = '';

    document.removeEventListener('mousemove', doSplitResize);
    document.removeEventListener('mouseup', stopSplitResize);
    document.removeEventListener('touchmove', doSplitResize);
    document.removeEventListener('touchend', stopSplitResize);

    saveSplitViewState();
}

// Refresh split view when language changes
window.addEventListener('localeChanged', () => {
    if (splitViewActive) {
        renderSplitView();
        updateSplitToggleButton();
        if (splitActivePanel) {
            const panelState = splitViewState[splitActivePanel];
            if (panelState && panelState.view) {
                updateSidebarForSplitPanel(panelState.view);
            }
        }
    } else {
        updateSplitToggleButton();
    }
});
