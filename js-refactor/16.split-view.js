// ==========================================
// SPLIT VIEW SYSTEM - New Architecture
// ==========================================

const viewLabels = {
    'editor': 'Structure',
    'characters': 'Personnages',
    'world': 'Univers',
    'notes': 'Notes',
    'codex': 'Codex',
    'stats': 'Statistiques',
    'analysis': 'Analyse',
    'versions': 'Snapshots',
    'todos': 'TODOs',
    'corkboard': 'Tableau',
    'mindmap': 'Mindmap',
    'plot': 'Intrigue',
    'relations': 'Relations',
    'map': 'Carte',
    'timelineviz': 'Timeline'
};

const viewIcons = {
    'editor': 'pen-line',
    'characters': 'users',
    'world': 'globe',
    'notes': 'sticky-note',
    'codex': 'book-open',
    'stats': 'bar-chart-3',
    'analysis': 'scan-search',
    'versions': 'history',
    'todos': 'check-square',
    'corkboard': 'layout-grid',
    'mindmap': 'git-branch',
    'plot': 'trending-up',
    'relations': 'link',
    'map': 'map',
    'timelineviz': 'clock'
};

// [MVVM : ViewModel]
// Gère le basculement de l'état global du mode split
function toggleSplitView() {
    if (splitViewActive) {
        closeSplitView();
    } else {
        activateSplitView();
    }
}

// [MVVM : ViewModel]
// Initialise l'état pour l'activation du mode split
function activateSplitView() {
    splitViewActive = true;
    splitActivePanel = 'left';

    // Initialize left panel with current view state
    splitViewState.left.view = currentView || 'editor';
    if (currentSceneId) {
        splitViewState.left.sceneId = currentSceneId;
        splitViewState.left.actId = currentActId;
        splitViewState.left.chapterId = currentChapterId;
    }

    // Right panel starts empty or with a default
    if (!splitViewState.right.view) {
        splitViewState.right.view = null;
    }

    renderSplitView();
    updateSplitToggleButton();
    showNotification('Mode split activé - Cliquez sur un panneau pour le sélectionner');
}

// [MVVM : ViewModel]
// Réinitialise l'état et restaure la vue standard
function closeSplitView() {
    splitViewActive = false;

    // Find which panel has the editor and restore it as the main view
    let viewToRestore = 'editor';
    let sceneToRestore = null;

    if (splitViewState.left.view === 'editor') {
        viewToRestore = 'editor';
        sceneToRestore = splitViewState.left.sceneId;
        currentActId = splitViewState.left.actId;
        currentChapterId = splitViewState.left.chapterId;
    } else if (splitViewState.right.view === 'editor') {
        viewToRestore = 'editor';
        sceneToRestore = splitViewState.right.sceneId;
        currentActId = splitViewState.right.actId;
        currentChapterId = splitViewState.right.chapterId;
    } else {
        // No editor found, restore left panel view
        viewToRestore = splitViewState.left.view || 'editor';
    }

    currentView = viewToRestore;
    if (sceneToRestore) {
        currentSceneId = sceneToRestore;
    }

    // Reset split state
    splitViewState.right.view = null;

    // Restore normal view
    switchView(currentView);

    updateSplitToggleButton();
    saveSplitViewState();
    showNotification('Mode split désactivé');
}

// [MVVM : View]
// Met à jour l'état visuel du bouton de bascule dans le DOM
function updateSplitToggleButton() {
    const btn = document.getElementById('splitModeToggle');
    if (btn) {
        if (splitViewActive) {
            btn.classList.add('active');
            btn.innerHTML = '<i data-lucide="columns-2" style="width:14px;height:14px;"></i> <span>Split actif</span>';
        } else {
            btn.classList.remove('active');
            btn.innerHTML = '<i data-lucide="columns-2" style="width:14px;height:14px;"></i> <span>Split</span>';
        }
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
}

// [MVVM : View]
// Génère et injecte la structure HTML principale du mode split
function renderSplitView() {
    if (!splitViewActive) return;

    const editorView = document.getElementById('editorView');
    const ratio = splitViewState.ratio || 60;

    const leftLabel = splitViewState.left.view ? viewLabels[splitViewState.left.view] || 'Vue' : 'Vide';
    const rightLabel = splitViewState.right.view ? viewLabels[splitViewState.right.view] || 'Vue' : 'Vide';
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
                                <span class="split-panel-indicator ${splitActivePanel === 'left' ? 'active' : ''}" title="Panneau actif">
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
                                <span class="split-panel-indicator ${splitActivePanel === 'right' ? 'active' : ''}" title="Panneau actif">
                                    <i data-lucide="circle" style="width:8px;height:8px;fill:currentColor;"></i>
                                </span>
                                <button class="split-panel-btn" onclick="closeSplitView(); event.stopPropagation();" title="Fermer le split">
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

// [MVVM : ViewModel]
// Gère le changement de panneau actif et met à jour les indicateurs visuels
function setActiveSplitPanel(panel) {
    if (splitActivePanel === panel) return;

    splitActivePanel = panel;

    // Update visual indicators
    document.getElementById('splitPanelLeft')?.classList.toggle('active', panel === 'left');
    document.getElementById('splitPanelRight')?.classList.toggle('active', panel === 'right');

    // Update indicators
    document.querySelectorAll('.split-panel-indicator').forEach((el, index) => {
        el.classList.toggle('active', (index === 0 && panel === 'left') || (index === 1 && panel === 'right'));
    });

    // Update sidebar for this panel's view
    updateSidebarForSplitPanel(panel);

    // Update header nav to reflect active panel's view
    const activeView = panel === 'left' ? splitViewState.left.view : splitViewState.right.view;
    if (activeView) {
        document.querySelectorAll('[id^="header-tab-"]').forEach(btn => btn.classList.remove('active'));
        const headerBtn = document.getElementById(`header-tab-${activeView}`);
        if (headerBtn) headerBtn.classList.add('active');
    }
}

// [MVVM : View]
// Manipulle le DOM de la barre latérale pour correspondre à la vue du panneau actif
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
        'stats': 'Statistiques',
        'analysis': 'Analyse',
        'versions': 'Versions',
        'todos': 'TODOs',
        'timeline': 'Timeline',
        'corkboard': 'Tableau',
        'plot': 'Intrigue',
        'relations': 'Relations',
        'map': 'Carte'
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
                renderActsList();
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
            const viewLabel = viewLabelsNoSidebar[view] || 'Cette vue';
            noSidebarEl.innerHTML = `
                        <div style="padding: 2rem 1rem; text-align: center; color: var(--text-muted);">
                            <i data-lucide="layout-dashboard" style="width: 48px; height: 48px; opacity: 0.3; margin-bottom: 1rem;"></i>
                            <div style="font-size: 0.9rem; line-height: 1.6;">
                                <strong>${viewLabel}</strong> utilise tout l'espace disponible.
                            </div>
                            <div style="font-size: 0.85rem; margin-top: 0.5rem; opacity: 0.8;">
                                La barre latérale n'est pas utilisée dans cette vue.
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
        editor: '<button class="btn btn-primary" onclick="openAddActModal()">+ Acte</button><button class="btn btn-primary" onclick="openAddChapterModal()">+ Chapitre</button><button class="btn btn-primary" onclick="openAddSceneModalQuick()">+ Scène</button>',
        characters: '<button class="btn btn-primary" onclick="openAddCharacterModal()">+ Personnage</button>',
        world: '<button class="btn btn-primary" onclick="openAddWorldModal()">+ Élément</button>',
        notes: '<button class="btn btn-primary" onclick="openAddNoteModal()">+ Note</button>',
        codex: '<button class="btn btn-primary" onclick="openAddCodexModal()">+ Entrée</button>',
        arcs: '<button class="btn btn-primary" onclick="createNewArc()">+ Arc narratif</button>'
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

// [MVVM : ViewModel]
// Gère le changement de type de vue au sein d'un panneau spécifique
function switchSplitPanelView(panel, view) {
    const state = panel === 'left' ? splitViewState.left : splitViewState.right;
    state.view = view;

    // Reset specific IDs when changing view type
    state.sceneId = null;
    state.characterId = null;
    state.worldId = null;
    state.noteId = null;

    // If switching to editor view and we have a current scene, use it
    if (view === 'editor' && currentSceneId) {
        state.sceneId = currentSceneId;
        state.actId = currentActId;
        state.chapterId = currentChapterId;
    }

    // Re-render the panel content
    renderSplitPanelViewContent(panel);

    // Update panel header
    updateSplitPanelHeader(panel);

    // Update sidebar if this is the active panel
    if (splitActivePanel === panel) {
        updateSidebarForSplitPanel(panel);

        // Update header nav
        document.querySelectorAll('[id^="header-tab-"]').forEach(btn => btn.classList.remove('active'));
        const headerBtn = document.getElementById(`header-tab-${view}`);
        if (headerBtn) headerBtn.classList.add('active');
    }

    saveSplitViewState();
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

// [MVVM : View]
// Met à jour l'en-tête (titre et icône) d'un panneau split
function updateSplitPanelHeader(panel) {
    const state = panel === 'left' ? splitViewState.left : splitViewState.right;
    const titleEl = document.getElementById(panel === 'left' ? 'splitLeftTitle' : 'splitRightTitle');

    if (titleEl) {
        const label = state.view ? viewLabels[state.view] || 'Vue' : 'Vide';
        const icon = state.view ? viewIcons[state.view] || 'file' : 'plus-circle';
        titleEl.innerHTML = `
                    <i data-lucide="${icon}" style="width:14px;height:14px;"></i>
                    <span>${label}</span>
                    <i data-lucide="chevron-down" style="width:12px;height:12px;opacity:0.5;margin-left:4px;"></i>
                `;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
}

// [MVVM : View]
// Prépare et initialise le conteneur de contenu pour un panneau
function renderSplitPanelViewContent(panel) {
    const container = document.getElementById(panel === 'left' ? 'splitLeftContent' : 'splitRightContent');
    if (!container) return;

    const state = panel === 'left' ? splitViewState.left : splitViewState.right;
    const view = state.view;

    if (!view) {
        container.innerHTML = `
                    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: var(--text-muted); text-align: center; padding: 2rem;">
                        <i data-lucide="plus-circle" style="width:48px;height:48px;stroke-width:1;margin-bottom:1rem;opacity:0.5;"></i>
                        <div style="font-size: 1rem; margin-bottom: 0.5rem;">Panneau vide</div>
                        <div style="font-size: 0.85rem; margin-bottom: 1rem;">Cliquez sur l'en-tête pour choisir une vue</div>
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
    renderViewInSplitPanel(view, contentContainer, state, panel);
}

// [MVVM : Other]
// Group: Coordinator | Naming: SplitViewCoordinator
// Logique de routage de rendu vers les différentes vues spécifiques (Mixte)
function renderViewInSplitPanel(view, container, state, panel) {
    // Technique: créer un faux editorView temporaire pour que les fonctions de rendu existantes fonctionnent
    const realEditorView = document.getElementById('editorView');

    // Créer un conteneur temporaire avec l'ID editorView
    const tempContainer = document.createElement('div');
    tempContainer.id = 'editorView';
    tempContainer.style.cssText = 'height: 100%; overflow: auto;';
    container.innerHTML = '';
    container.appendChild(tempContainer);

    // Temporairement masquer le vrai editorView et changer son ID
    if (realEditorView) {
        realEditorView.id = 'editorView-backup';
    }

    // Fonction pour restaurer après le rendu
    const restoreEditorView = () => {
        // Restaurer l'ID du vrai editorView
        if (realEditorView) {
            realEditorView.id = 'editorView';
        }
        // Le tempContainer garde le contenu rendu mais perd son ID
        tempContainer.id = 'splitPanelContent-' + panel;
    };

    switch (view) {
        case 'editor':
            if (state.sceneId) {
                const act = project.acts.find(a => a.id === state.actId);
                const chapter = act?.chapters.find(c => c.id === state.chapterId);
                const scene = chapter?.scenes.find(s => s.id === state.sceneId);
                if (act && chapter && scene) {
                    renderEditorInContainer(act, chapter, scene, container, panel);
                    restoreEditorView();
                    return; // On sort car renderEditorInContainer gère tout
                }
            } else {
                tempContainer.innerHTML = `
                            <div class="empty-state">
                                <div class="empty-state-icon"><i data-lucide="pencil" style="width:48px;height:48px;stroke-width:1;"></i></div>
                                <div class="empty-state-title">Sélectionnez une scène</div>
                                <div class="empty-state-text">Choisissez une scène dans la barre latérale</div>
                            </div>
                        `;
            }
            break;

        case 'characters':
            if (state.characterId) {
                const data = getCharacterDetailViewModel(state.characterId);
                if (data) {
                    const { character, races, linkedScenes } = data;
                    tempContainer.innerHTML = renderCharacterSheet(character, races, linkedScenes);
                    setTimeout(() => {
                        initCharacterRadar(character);
                        if (typeof lucide !== 'undefined') lucide.createIcons();
                    }, 100);
                }
            } else {
                tempContainer.innerHTML = `
                            <div class="empty-state">
                                <div class="empty-state-icon"><i data-lucide="users" style="width:48px;height:48px;stroke-width:1.5;"></i></div>
                                <div class="empty-state-title">Personnages</div>
                                <div class="empty-state-text">Sélectionnez un personnage dans la barre latérale</div>
                            </div>
                        `;
            }
            break;

        case 'world':
            if (state.worldId) {
                const elem = project.world?.find(e => e.id === state.worldId);
                if (elem) {
                    // Appeler la vraie fonction openWorldDetail via le faux editorView
                    if (typeof renderWorldDetailFull === 'function') {
                        renderWorldDetailFull(elem, tempContainer);
                    } else {
                        // Générer le même HTML que openWorldDetail
                        tempContainer.innerHTML = `
                                    <div class="detail-view">
                                        <div class="detail-header">
                                            <div style="display: flex; align-items: center; gap: 1rem;">
                                                <div class="detail-title">${elem.name}</div>
                                                <span style="font-size: 0.9rem; padding: 0.5rem 1rem; background: var(--accent-gold); color: var(--bg-primary); border-radius: 2px;">${elem.type}</span>
                                            </div>
                                        </div>
                                        
                                        ${typeof renderElementLinkedScenes === 'function' ? renderElementLinkedScenes(elem) : ''}
                                        
                                        <div class="detail-section">
                                            <div class="detail-section-title">Informations de base</div>
                                            <div class="detail-field">
                                                <div class="detail-label">Nom</div>
                                                <input type="text" class="form-input" value="${elem.name}" 
                                                       onchange="updateWorldField(${elem.id}, 'name', this.value)">
                                            </div>
                                        </div>

                                        <div class="detail-section">
                                            <div class="detail-section-title">Type</div>
                                            <select class="form-input" onchange="updateWorldField(${elem.id}, 'type', this.value)">
                                                <option value="Lieu" ${elem.type === 'Lieu' ? 'selected' : ''}>Lieu</option>
                                                <option value="Objet" ${elem.type === 'Objet' ? 'selected' : ''}>Objet</option>
                                                <option value="Concept" ${elem.type === 'Concept' ? 'selected' : ''}>Concept</option>
                                                <option value="Organisation" ${elem.type === 'Organisation' ? 'selected' : ''}>Organisation</option>
                                                <option value="Événement" ${elem.type === 'Événement' ? 'selected' : ''}>Événement</option>
                                            </select>
                                        </div>

                                        <div class="detail-section">
                                            <div class="detail-section-title">Description</div>
                                            <textarea class="form-input" rows="6" 
                                                      onchange="updateWorldField(${elem.id}, 'description', this.value)">${elem.description || ''}</textarea>
                                        </div>

                                        <div class="detail-section">
                                            <div class="detail-section-title">Détails</div>
                                            <textarea class="form-input" rows="6" 
                                                      onchange="updateWorldField(${elem.id}, 'details', this.value)">${elem.details || ''}</textarea>
                                        </div>

                                        <div class="detail-section">
                                            <div class="detail-section-title">Histoire</div>
                                            <textarea class="form-input" rows="6" 
                                                      onchange="updateWorldField(${elem.id}, 'history', this.value)">${elem.history || ''}</textarea>
                                        </div>

                                        <div class="detail-section">
                                            <div class="detail-section-title">Notes</div>
                                            <textarea class="form-input" rows="4" 
                                                      onchange="updateWorldField(${elem.id}, 'notes', this.value)">${elem.notes || ''}</textarea>
                                        </div>
                                    </div>
                                `;
                    }
                }
            } else {
                tempContainer.innerHTML = `
                            <div class="empty-state">
                                <div class="empty-state-icon"><i data-lucide="globe" style="width:48px;height:48px;stroke-width:1.5;"></i></div>
                                <div class="empty-state-title">Univers</div>
                                <div class="empty-state-text">Sélectionnez un élément dans la barre latérale</div>
                            </div>
                        `;
            }
            break;

        case 'notes':
            if (state.noteId) {
                const note = project.notes?.find(n => n.id === state.noteId);
                if (note) {
                    // Même HTML que openNoteDetail
                    tempContainer.innerHTML = `
                                <div class="detail-view">
                                    <div class="detail-header">
                                        <div style="display: flex; align-items: center; gap: 1rem; flex: 1;">
                                            <input type="text" class="form-input" value="${note.title || ''}" 
                                                   style="font-size: 1.8rem; font-weight: 600; font-family: 'Noto Serif JP', serif; padding: 0.5rem;"
                                                   onchange="updateNoteField(${note.id}, 'title', this.value)"
                                                   placeholder="Titre de la note">
                                            <span style="font-size: 0.8rem; padding: 0.4rem 0.8rem; background: var(--accent-gold); color: var(--bg-primary); border-radius: 2px;">${note.category || 'Note'}</span>
                                        </div>
                                    </div>
                                    
                                    <div class="detail-section">
                                        <div class="detail-section-title">Catégorie</div>
                                        <select class="form-input" onchange="updateNoteField(${note.id}, 'category', this.value)">
                                            <option value="Recherche" ${note.category === 'Recherche' ? 'selected' : ''}>Recherche</option>
                                            <option value="Idée" ${note.category === 'Idée' ? 'selected' : ''}>Idée</option>
                                            <option value="Référence" ${note.category === 'Référence' ? 'selected' : ''}>Référence</option>
                                            <option value="A faire" ${note.category === 'A faire' ? 'selected' : ''}>À faire</option>
                                            <option value="Question" ${note.category === 'Question' ? 'selected' : ''}>Question</option>
                                            <option value="Autre" ${note.category === 'Autre' ? 'selected' : ''}>Autre</option>
                                        </select>
                                    </div>

                                    <div class="detail-section">
                                        <div class="detail-section-title">Tags</div>
                                        <input type="text" class="form-input" value="${(note.tags || []).join(', ')}" 
                                               onchange="updateNoteTags(${note.id}, this.value)">
                                        <small style="color: var(--text-muted); font-style: italic;">Séparez les tags par des virgules</small>
                                    </div>

                                    <div class="detail-section">
                                        <div class="detail-section-title">Contenu</div>
                                        <textarea class="form-input" rows="20" 
                                                  oninput="updateNoteField(${note.id}, 'content', this.value)">${note.content || ''}</textarea>
                                    </div>

                                    <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2rem; font-family: 'Source Code Pro', monospace;">
                                        Créée le ${new Date(note.createdAt).toLocaleDateString('fr-FR')} • 
                                        Modifiée le ${new Date(note.updatedAt).toLocaleDateString('fr-FR')}
                                    </div>
                                </div>
                            `;
                }
            } else {
                tempContainer.innerHTML = `
                            <div class="empty-state">
                                <div class="empty-state-icon"><i data-lucide="sticky-note" style="width:48px;height:48px;stroke-width:1.5;"></i></div>
                                <div class="empty-state-title">Notes</div>
                                <div class="empty-state-text">Sélectionnez une note dans la barre latérale</div>
                            </div>
                        `;
            }
            break;

        case 'mindmap':
            // Appeler la vraie fonction renderMindmapView
            if (typeof renderMindmapView === 'function') {
                renderMindmapView();
            }
            break;

        case 'corkboard':
            // Call real render function
            if (typeof openCorkBoardView === 'function') {
                openCorkBoardView();
            }
            break;

        case 'stats':
            // Call real render function
            if (typeof renderStats === 'function') {
                renderStats();
            }
            break;

        case 'analysis':
            // Call real render function
            if (typeof renderAnalysis === 'function') {
                renderAnalysis();
            }
            break;

        case 'map':
            // Call real render function
            if (typeof renderMapView === 'function') {
                renderMapView();
            }
            break;

        case 'codex':
            if (state.codexId) {
                // Render specific codex entry directly in the container
                const entry = project.codex?.find(c => c.id === state.codexId);
                if (entry) {
                    tempContainer.innerHTML = `
                                <div class="detail-view">
                                    <div class="detail-header">
                                        <div style="display: flex; align-items: center; gap: 1rem; flex: 1;">
                                            <input type="text" class="form-input" value="${entry.title}" 
                                                   style="font-size: 1.8rem; font-weight: 600; font-family: 'Noto Serif JP', serif; padding: 0.5rem;"
                                                   onchange="updateCodexField(${entry.id}, 'title', this.value)"
                                                   placeholder="Titre de l'entrée">
                                            <span style="font-size: 0.8rem; padding: 0.4rem 0.8rem; background: var(--accent-gold); color: var(--bg-primary); border-radius: 2px;">${entry.category}</span>
                                        </div>
                                    </div>
                                    
                                    <div class="detail-section">
                                        <div class="detail-section-title">Catégorie</div>
                                        <select class="form-input" onchange="updateCodexField(${entry.id}, 'category', this.value)">
                                            <option value="Culture" ${entry.category === 'Culture' ? 'selected' : ''}>Culture</option>
                                            <option value="Histoire" ${entry.category === 'Histoire' ? 'selected' : ''}>Histoire</option>
                                            <option value="Technologie" ${entry.category === 'Technologie' ? 'selected' : ''}>Technologie</option>
                                            <option value="Géographie" ${entry.category === 'Géographie' ? 'selected' : ''}>Géographie</option>
                                            <option value="Politique" ${entry.category === 'Politique' ? 'selected' : ''}>Politique</option>
                                            <option value="Magie/Pouvoir" ${entry.category === 'Magie/Pouvoir' ? 'selected' : ''}>Magie/Pouvoir</option>
                                            <option value="Religion" ${entry.category === 'Religion' ? 'selected' : ''}>Religion</option>
                                            <option value="Société" ${entry.category === 'Société' ? 'selected' : ''}>Société</option>
                                            <option value="Autre" ${entry.category === 'Autre' ? 'selected' : ''}>Autre</option>
                                        </select>
                                    </div>

                                    <div class="detail-section">
                                        <div class="detail-section-title">Résumé</div>
                                        <textarea class="form-input" rows="3" 
                                                  onchange="updateCodexField(${entry.id}, 'summary', this.value)">${entry.summary || ''}</textarea>
                                    </div>

                                    <div class="detail-section">
                                        <div class="detail-section-title">Contenu détaillé</div>
                                        <textarea class="form-input" rows="20" 
                                                  oninput="updateCodexField(${entry.id}, 'content', this.value)">${entry.content || ''}</textarea>
                                    </div>
                                </div>
                            `;
                }
            } else {
                tempContainer.innerHTML = `
                            <div class="empty-state">
                                <div class="empty-state-icon"><i data-lucide="book-open" style="width:48px;height:48px;stroke-width:1.5;"></i></div>
                                <div class="empty-state-title">Codex</div>
                                <div class="empty-state-text">Sélectionnez une entrée dans la barre latérale</div>
                            </div>
                        `;
            }
            break;

        case 'plot':
            // Call real render function
            if (typeof renderPlotView === 'function') {
                renderPlotView();
            }
            break;

        case 'relations':
            // Call real render function
            if (typeof renderRelationsView === 'function') {
                renderRelationsView();
            }
            break;

        case 'timelineviz':
            // Render timeline metro in split panel (without sidebar, just the main content)
            const charCount = project.characters?.length || 0;

            if (charCount === 0) {
                tempContainer.innerHTML = `
                            <div class="metro-empty-state">
                                <i data-lucide="users" style="width: 64px; height: 64px; opacity: 0.3;"></i>
                                <h3 style="margin: 1rem 0 0.5rem;">Aucun personnage</h3>
                                <p style="margin-bottom: 1.5rem;">Créez d'abord des personnages dans l'onglet "Personnages".</p>
                            </div>
                        `;
            } else {
                tempContainer.innerHTML = `
                            <div style="padding: 1rem; height: 100%; overflow: auto;">
                                <div class="metro-toolbar" style="margin-bottom: 1rem;">
                                    <button class="btn btn-primary" onclick="openMetroEventModal()">
                                        <i data-lucide="plus" style="width: 16px; height: 16px;"></i>
                                        Nouvel événement
                                    </button>
                                    <button class="btn" onclick="sortMetroByDate()">
                                        <i data-lucide="calendar" style="width: 16px; height: 16px;"></i>
                                        Trier par date
                                    </button>
                                </div>
                                
                                <div class="metro-timeline-container" id="metroTimelineContainer-split-${panel}">
                                    ${renderMetroSVG()}
                                </div>
                                
                                <div class="metro-legend" style="margin-top: 1rem;">
                                    ${project.characters.map(char => `
                                        <div class="metro-legend-item" onclick="openMetroColorPicker(${char.id})" style="cursor: pointer;" title="Cliquer pour changer la couleur">
                                            <div class="metro-legend-line" style="background: ${project.characterColors[char.id] || '#999'};"></div>
                                            <span>${char.name}</span>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        `;
            }
            break;

        case 'versions':
            // Call real render function
            if (typeof renderVersionsList === 'function') {
                renderVersionsList();
            }
            break;

        case 'todos':
            // Call real render function
            if (typeof renderTodosList === 'function') {
                renderTodosList();
            }
            break;

        case 'timeline':
            // Call real render function
            if (typeof renderTimelineList === 'function') {
                renderTimelineList();
            }
            break;

        default:
            tempContainer.innerHTML = `
                        <div class="empty-state">
                            <div class="empty-state-icon"><i data-lucide="${viewIcons[view] || 'file'}" style="width:48px;height:48px;stroke-width:1.5;"></i></div>
                            <div class="empty-state-title">${viewLabels[view] || view}</div>
                            <div class="empty-state-text">Cette vue est disponible</div>
                        </div>
                    `;
    }

    // Restaurer l'ID du vrai editorView
    restoreEditorView();

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

// Render the full editor with toolbar in a container (for split view)
/** [View] - Génère le HTML complet de l'éditeur pour un panneau split */
function renderEditorInContainer(act, chapter, scene, container, panel) {
    const wordCount = getWordCount(scene.content || '');

    // Vérifier si une version finale existe
    const hasFinalVersion = scene.versions && scene.versions.some(v => v.isFinal === true);
    const finalVersion = hasFinalVersion ? scene.versions.find(v => v.isFinal === true) : null;
    const finalVersionBadge = hasFinalVersion
        ? `<span style="display: inline-flex; align-items: center; gap: 0.25rem; background: var(--accent-gold); color: var(--bg-accent); font-size: 0.7rem; font-weight: 600; padding: 0.2rem 0.5rem; border-radius: 10px; margin-left: 0.5rem;" title="Version finale : ${finalVersion.number}"><i data-lucide="star" style="width:10px;height:10px;fill:currentColor;"></i> ${finalVersion.number}</span>`
        : '';

    container.innerHTML = `
                <div class="editor-fixed-top" style="position: relative;">
                    <div class="editor-header">
                        <div class="editor-breadcrumb">${act.title} > ${chapter.title}</div>
                        <div style="display: flex; align-items: center; gap: 1rem;">
                            <div class="editor-title" style="flex: 1;">${scene.title}${finalVersionBadge}</div>
                        </div>
                        <div class="editor-meta">
                            <span class="split-word-count-${panel}">${wordCount} mots</span>
                            <span>Dernière modification : ${new Date().toLocaleDateString('fr-FR')}</span>
                        </div>
                    </div>
                    <button class="toolbar-mobile-toggle" onclick="toggleSplitEditorToolbar('${panel}')">
                        <span><i data-lucide="pen-line" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i>Outils de formatage</span>
                    </button>
                    <div class="editor-toolbar" id="editorToolbar-${panel}">
                        ${getEditorToolbarHTML(panel)}
                    </div>
                    <div class="links-panel-sticky" id="linksPanel-${panel}">
                        <div style="display: flex; gap: 2rem; align-items: start;">
                            <div style="flex: 1;">
                                <div style="font-size: 0.85rem; font-weight: 600; margin-bottom: 0.5rem; color: var(--text-muted);"><i data-lucide="users" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i>Personnages</div>
                                <div class="quick-links"></div>
                            </div>
                            <div style="flex: 1;">
                                <div style="font-size: 0.85rem; font-weight: 600; margin-bottom: 0.5rem; color: var(--text-muted);"><i data-lucide="globe" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i>Lieux/Éléments</div>
                                <div class="quick-links"></div>
                            </div>
                            <div style="flex: 1;">
                                <div style="font-size: 0.85rem; font-weight: 600; margin-bottom: 0.5rem; color: var(--text-muted);"><i data-lucide="train-track" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i>Timeline</div>
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
                            data-placeholder="Commencez à écrire votre scène..."
                            oninput="updateSplitSceneContent(this)"
                            onkeydown="handleEditorKeydown(event)"
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

// Toggle toolbar visibility in split panel
/** [View] - Alterne la visibilité de la barre d'outils de l'éditeur en mode split */
function toggleSplitEditorToolbar(panel) {
    const toolbar = document.getElementById('editorToolbar-' + panel);
    if (toolbar) {
        toolbar.classList.toggle('visible');
    }
}

// Format text in a specific panel's editor
/** [View] - Applique des commandes de formatage directement au DOM de l'éditeur */
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

// Render full world detail in container
/** [View] - Génère le HTML des détails d'un élément de l'univers pour un conteneur */
function renderWorldDetailInContainer(element, container) {
    container.innerHTML = `
                <div class="detail-view" style="height: 100%; overflow-y: auto;">
                    <div class="detail-header" style="position: sticky; top: 0; background: var(--bg-primary); z-index: 10; padding: 1rem; border-bottom: 1px solid var(--border-color);">
                        <div style="display: flex; align-items: center; gap: 1rem;">
                            <div class="detail-title" style="font-size: 1.5rem; font-weight: 600;">${element.name}</div>
                            <span style="font-size: 0.85rem; padding: 0.4rem 0.8rem; background: var(--primary-color); color: white; border-radius: 4px;">${element.type}</span>
                        </div>
                    </div>
                    
                    <div style="padding: 1.5rem;">
                        <div class="detail-section" style="margin-bottom: 1.5rem;">
                            <div class="detail-section-title" style="font-size: 0.9rem; font-weight: 600; color: var(--text-muted); margin-bottom: 0.5rem;">Nom</div>
                            <input type="text" class="form-input" value="${element.name}" 
                                   onchange="updateWorldField(${element.id}, 'name', this.value)" style="width: 100%;">
                        </div>

                        <div class="detail-section" style="margin-bottom: 1.5rem;">
                            <div class="detail-section-title" style="font-size: 0.9rem; font-weight: 600; color: var(--text-muted); margin-bottom: 0.5rem;">Type</div>
                            <select class="form-input" onchange="updateWorldField(${element.id}, 'type', this.value)" style="width: 100%;">
                                <option value="Lieu" ${element.type === 'Lieu' ? 'selected' : ''}>Lieu</option>
                                <option value="Objet" ${element.type === 'Objet' ? 'selected' : ''}>Objet</option>
                                <option value="Concept" ${element.type === 'Concept' ? 'selected' : ''}>Concept</option>
                                <option value="Organisation" ${element.type === 'Organisation' ? 'selected' : ''}>Organisation</option>
                                <option value="Événement" ${element.type === 'Événement' ? 'selected' : ''}>Événement</option>
                            </select>
                        </div>

                        <div class="detail-section" style="margin-bottom: 1.5rem;">
                            <div class="detail-section-title" style="font-size: 0.9rem; font-weight: 600; color: var(--text-muted); margin-bottom: 0.5rem;">Description</div>
                            <textarea class="form-input" rows="6" style="width: 100%; resize: vertical;"
                                      onchange="updateWorldField(${element.id}, 'description', this.value)">${element.description || ''}</textarea>
                        </div>

                        <div class="detail-section" style="margin-bottom: 1.5rem;">
                            <div class="detail-section-title" style="font-size: 0.9rem; font-weight: 600; color: var(--text-muted); margin-bottom: 0.5rem;">Détails</div>
                            <textarea class="form-input" rows="6" style="width: 100%; resize: vertical;"
                                      onchange="updateWorldField(${element.id}, 'details', this.value)">${element.details || ''}</textarea>
                        </div>

                        <div class="detail-section" style="margin-bottom: 1.5rem;">
                            <div class="detail-section-title" style="font-size: 0.9rem; font-weight: 600; color: var(--text-muted); margin-bottom: 0.5rem;">Histoire</div>
                            <textarea class="form-input" rows="6" style="width: 100%; resize: vertical;"
                                      onchange="updateWorldField(${element.id}, 'history', this.value)">${element.history || ''}</textarea>
                        </div>

                        <div class="detail-section" style="margin-bottom: 1.5rem;">
                            <div class="detail-section-title" style="font-size: 0.9rem; font-weight: 600; color: var(--text-muted); margin-bottom: 0.5rem;">Notes</div>
                            <textarea class="form-input" rows="4" style="width: 100%; resize: vertical;"
                                      onchange="updateWorldField(${element.id}, 'notes', this.value)">${element.notes || ''}</textarea>
                        </div>
                    </div>
                </div>
            `;
}

// Render full note detail in container
/** [View] - Génère le HTML des détails d'une note pour un conteneur */
function renderNoteDetailInContainer(note, container) {
    container.innerHTML = `
                <div class="detail-view" style="height: 100%; display: flex; flex-direction: column; overflow: hidden;">
                    <div class="detail-header" style="padding: 1rem; background: var(--bg-secondary); border-bottom: 1px solid var(--border-color);">
                        <div style="display: flex; align-items: center; gap: 1rem;">
                            <input type="text" class="form-input" value="${note.title || ''}" 
                                   style="font-size: 1.3rem; font-weight: 600; flex: 1; border: none; background: transparent;"
                                   onchange="updateNoteField(${note.id}, 'title', this.value)"
                                   placeholder="Titre de la note">
                            <select class="form-input" onchange="updateNoteField(${note.id}, 'category', this.value)" style="width: auto;">
                                <option value="Recherche" ${note.category === 'Recherche' ? 'selected' : ''}>Recherche</option>
                                <option value="Idée" ${note.category === 'Idée' ? 'selected' : ''}>Idée</option>
                                <option value="Référence" ${note.category === 'Référence' ? 'selected' : ''}>Référence</option>
                                <option value="A faire" ${note.category === 'A faire' ? 'selected' : ''}>À faire</option>
                                <option value="Question" ${note.category === 'Question' ? 'selected' : ''}>Question</option>
                                <option value="Autre" ${note.category === 'Autre' ? 'selected' : ''}>Autre</option>
                            </select>
                        </div>
                        <div style="margin-top: 0.5rem;">
                            <input type="text" class="form-input" value="${(note.tags || []).join(', ')}" 
                                   style="font-size: 0.85rem; width: 100%;"
                                   onchange="updateNoteTags(${note.id}, this.value)"
                                   placeholder="Tags (séparés par des virgules)">
                        </div>
                    </div>
                    <div style="flex: 1; padding: 1rem; overflow: hidden;">
                        <textarea class="form-input" 
                                  style="width: 100%; height: 100%; resize: none; font-size: 1rem; line-height: 1.7; border: none; background: var(--bg-primary);"
                                  oninput="updateNoteField(${note.id}, 'content', this.value)"
                                  placeholder="Contenu de la note...">${note.content || ''}</textarea>
                    </div>
                    <div style="padding: 0.5rem 1rem; font-size: 0.75rem; color: var(--text-muted); background: var(--bg-secondary); border-top: 1px solid var(--border-color);">
                        Créée le ${new Date(note.createdAt).toLocaleDateString('fr-FR')} • 
                        Modifiée le ${new Date(note.updatedAt).toLocaleDateString('fr-FR')}
                    </div>
                </div>
            `;
}

/** [View] - Génère le HTML de la vue "Tableau de liège" en mode split */
function renderCorkboardInSplitPanel(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
                <div style="padding: 1rem;">
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem;">
                        ${project.acts.map(act =>
        act.chapters.map(chapter =>
            chapter.scenes.map(scene => `
                                    <div class="cork-card" onclick="openSceneFromSplit(${act.id}, ${chapter.id}, ${scene.id})" style="background: var(--bg-secondary); padding: 1rem; border-radius: 8px; border: 1px solid var(--border-color); cursor: pointer; transition: transform 0.15s, box-shadow 0.15s;">
                                        <div style="font-weight: 600; margin-bottom: 0.5rem;">${scene.title || 'Sans titre'}</div>
                                        <div style="font-size: 0.8rem; color: var(--text-muted);">${chapter.title}</div>
                                        <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.5rem;">${getWordCount(scene.content || '')} mots</div>
                                    </div>
                                `).join('')
        ).join('')
    ).join('')}
                    </div>
                </div>
            `;
}

// Helper to open a scene from corkboard in split mode
/** [ViewModel] - Logique métier pour l'ouverture d'une scène via le tableau de liège */
function openSceneFromSplit(actId, chapterId, sceneId) {
    if (splitViewActive) {
        const state = splitActivePanel === 'left' ? splitViewState.left : splitViewState.right;
        state.view = 'editor';
        state.actId = actId;
        state.chapterId = chapterId;
        state.sceneId = sceneId;
        renderSplitPanelViewContent(splitActivePanel);
        updateSplitPanelHeader(splitActivePanel);
        updateSidebarForSplitPanel(splitActivePanel);
    } else {
        openScene(actId, chapterId, sceneId);
    }
}

/** [Mixte] - Agrège les données (Model) et génère le HTML des statistiques (View) */
function renderStatsInSplitPanel(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    let totalWords = 0;
    let totalScenes = 0;
    let totalChapters = 0;

    project.acts.forEach(act => {
        act.chapters.forEach(chapter => {
            totalChapters++;
            chapter.scenes.forEach(scene => {
                totalScenes++;
                totalWords += getWordCount(scene.content || '');
            });
        });
    });

    container.innerHTML = `
                <div style="padding: 1.5rem;">
                    <h3 style="margin-bottom: 1.5rem;">Statistiques du projet</h3>
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;">
                        <div style="background: var(--bg-secondary); padding: 1.5rem; border-radius: 8px; text-align: center;">
                            <div style="font-size: 2rem; font-weight: 700; color: var(--primary-color);">${totalWords.toLocaleString()}</div>
                            <div style="color: var(--text-muted);">Mots</div>
                        </div>
                        <div style="background: var(--bg-secondary); padding: 1.5rem; border-radius: 8px; text-align: center;">
                            <div style="font-size: 2rem; font-weight: 700; color: var(--primary-color);">${totalScenes}</div>
                            <div style="color: var(--text-muted);">Scènes</div>
                        </div>
                        <div style="background: var(--bg-secondary); padding: 1.5rem; border-radius: 8px; text-align: center;">
                            <div style="font-size: 2rem; font-weight: 700; color: var(--primary-color);">${totalChapters}</div>
                            <div style="color: var(--text-muted);">Chapitres</div>
                        </div>
                        <div style="background: var(--bg-secondary); padding: 1.5rem; border-radius: 8px; text-align: center;">
                            <div style="font-size: 2rem; font-weight: 700; color: var(--primary-color);">${project.characters?.length || 0}</div>
                            <div style="color: var(--text-muted);">Personnages</div>
                        </div>
                    </div>
                </div>
            `;
}

// Render Plot view in split panel
/** [View] - Génère le graphique SVG de l'intrigue pour un conteneur */
function renderPlotInSplitPanel(container) {
    // Initialiser les points d'intrigue si nécessaire
    if (typeof plotPoints === 'undefined' || plotPoints.length === 0) {
        if (typeof initPlotPoints === 'function') {
            initPlotPoints();
        }
    }

    const svgWidth = 600;
    const svgHeight = 350;
    const padding = 50;
    const plotWidth = svgWidth - padding * 2;
    const plotHeight = svgHeight - padding * 2;

    let pathData = '';
    let pointsHTML = '';
    let gridLines = '';

    // Lignes de grille
    for (let i = 0; i <= 4; i++) {
        const y = padding + (plotHeight / 4) * i;
        gridLines += `<line x1="${padding}" y1="${y}" x2="${svgWidth - padding}" y2="${y}" stroke="var(--border-color)" stroke-width="1" opacity="0.3" stroke-dasharray="5,5"/>`;
    }

    // Générer la courbe si plotPoints existe
    if (typeof plotPoints !== 'undefined' && plotPoints.length > 0) {
        plotPoints.forEach((point, index) => {
            const x = padding + (plotWidth / Math.max(plotPoints.length - 1, 1)) * index;
            const y = padding + plotHeight - (point.intensity / 100) * plotHeight;

            if (index === 0) {
                pathData = `M ${x} ${y}`;
            } else {
                pathData += ` L ${x} ${y}`;
            }

            pointsHTML += `
                        <circle cx="${x}" cy="${y}" r="5" fill="var(--accent-gold)" stroke="white" stroke-width="2" 
                                style="cursor: pointer;" 
                                onclick="openScene(${point.actId}, ${point.chapterId}, ${point.sceneId})">
                            <title>${point.title} - Tension: ${Math.round(point.intensity)}%</title>
                        </circle>
                    `;
        });
    }

    container.innerHTML = `
                <div style="padding: 1.5rem;">
                    <h3 style="margin-bottom: 1rem;"><i data-lucide="trending-up" style="width:18px;height:18px;vertical-align:middle;margin-right:6px;"></i>Graphique d'Intrigue</h3>
                    <div style="background: var(--bg-secondary); border-radius: 8px; padding: 1rem; overflow-x: auto;">
                        <svg viewBox="0 0 ${svgWidth} ${svgHeight}" style="width: 100%; max-width: ${svgWidth}px; height: auto;">
                            ${gridLines}
                            ${pathData ? `<path d="${pathData}" fill="none" stroke="var(--primary-color)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>` : ''}
                            ${pointsHTML}
                        </svg>
                    </div>
                    <div style="margin-top: 1rem; font-size: 0.85rem; color: var(--text-muted);">
                        ${typeof plotPoints !== 'undefined' ? plotPoints.length : 0} points d'intrigue • Cliquez sur un point pour ouvrir la scène
                    </div>
                </div>
            `;
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

// Render Relations view in split panel
/** [View] - Génère le HTML des relations entre personnages pour un conteneur */
function renderRelationsInSplitPanel(container) {
    const relationships = project.relationships || [];
    const characters = project.characters || [];

    if (characters.length < 2) {
        container.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon"><i data-lucide="heart-handshake" style="width:48px;height:48px;stroke-width:1.5;"></i></div>
                        <div class="empty-state-title">Relations</div>
                        <div class="empty-state-text">Créez au moins 2 personnages pour définir leurs relations</div>
                    </div>
                `;
        if (typeof lucide !== 'undefined') lucide.createIcons();
        return;
    }

    let relationsHTML = '';
    if (relationships.length > 0) {
        relationsHTML = relationships.map(rel => {
            const char1 = characters.find(c => c.id === rel.character1Id);
            const char2 = characters.find(c => c.id === rel.character2Id);
            if (!char1 || !char2) return '';

            return `
                        <div style="background: var(--bg-secondary); padding: 1rem; border-radius: 8px; margin-bottom: 0.75rem;">
                            <div style="display: flex; align-items: center; gap: 1rem;">
                                <span style="font-weight: 600;">${char1.name || char1.firstName || 'Personnage 1'}</span>
                                <span style="color: var(--primary-color);">↔</span>
                                <span style="font-weight: 600;">${char2.name || char2.firstName || 'Personnage 2'}</span>
                            </div>
                            <div style="font-size: 0.9rem; color: var(--text-muted); margin-top: 0.5rem;">${rel.type || 'Relation'}</div>
                            ${rel.description ? `<div style="font-size: 0.85rem; margin-top: 0.5rem;">${rel.description}</div>` : ''}
                        </div>
                    `;
        }).join('');
    } else {
        relationsHTML = '<div style="color: var(--text-muted); text-align: center; padding: 2rem;">Aucune relation définie</div>';
    }

    container.innerHTML = `
                <div style="padding: 1.5rem;">
                    <h3 style="margin-bottom: 1rem;"><i data-lucide="heart-handshake" style="width:18px;height:18px;vertical-align:middle;margin-right:6px;"></i>Relations entre personnages</h3>
                    <div>${relationsHTML}</div>
                    <button class="btn btn-primary" onclick="openAddRelationModal()" style="margin-top: 1rem;">+ Ajouter une relation</button>
                </div>
            `;
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

// Render Timeline view in split panel
/** [View] - Génère le HTML de la chronologie pour un conteneur */
function renderTimelineInSplitPanel(container) {
    const events = project.timeline || [];

    if (events.length === 0) {
        container.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon"><i data-lucide="calendar-range" style="width:48px;height:48px;stroke-width:1.5;"></i></div>
                        <div class="empty-state-title">Timeline</div>
                        <div class="empty-state-text">Aucun événement dans la chronologie</div>
                        <button class="btn btn-primary" onclick="openAddTimelineModal()" style="margin-top: 1rem;">+ Ajouter un événement</button>
                    </div>
                `;
        if (typeof lucide !== 'undefined') lucide.createIcons();
        return;
    }

    // Trier par date si possible
    const sortedEvents = [...events].sort((a, b) => {
        if (a.date && b.date) return new Date(a.date) - new Date(b.date);
        return 0;
    });

    const eventsHTML = sortedEvents.map((event, index) => `
                <div style="display: flex; gap: 1rem; margin-bottom: 1.5rem;">
                    <div style="display: flex; flex-direction: column; align-items: center;">
                        <div style="width: 12px; height: 12px; background: var(--primary-color); border-radius: 50%;"></div>
                        ${index < sortedEvents.length - 1 ? '<div style="width: 2px; flex: 1; background: var(--border-color);"></div>' : ''}
                    </div>
                    <div style="flex: 1; background: var(--bg-secondary); padding: 1rem; border-radius: 8px;">
                        <div style="font-weight: 600;">${event.title}</div>
                        ${event.date ? `<div style="font-size: 0.85rem; color: var(--primary-color); margin-top: 0.25rem;">${event.date}</div>` : ''}
                        ${event.description ? `<div style="font-size: 0.9rem; color: var(--text-muted); margin-top: 0.5rem;">${event.description}</div>` : ''}
                    </div>
                </div>
            `).join('');

    container.innerHTML = `
                <div style="padding: 1.5rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                        <h3 style="margin: 0;"><i data-lucide="calendar-range" style="width:18px;height:18px;vertical-align:middle;margin-right:6px;"></i>Chronologie</h3>
                        <button class="btn btn-small" onclick="openAddTimelineModal()">+ Événement</button>
                    </div>
                    <div>${eventsHTML}</div>
                </div>
            `;
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

// View selector for split panels
let currentSplitSelectorPanel = null;

/** [View] - Ouvre la modal de sélection de vue pour un panneau */
function openSplitViewSelector(panel) {
    currentSplitSelectorPanel = panel;

    const content = document.getElementById('splitSelectorContent');
    if (!content) return;

    const currentView = panel === 'left' ? splitViewState.left.view : splitViewState.right.view;

    const views = [
        { id: 'editor', label: 'Structure', icon: 'pen-line', desc: 'Écrire vos scènes' },
        { id: 'characters', label: 'Personnages', icon: 'users', desc: 'Fiches personnages' },
        { id: 'world', label: 'Univers', icon: 'globe', desc: 'Lieux et éléments' },
        { id: 'notes', label: 'Notes', icon: 'sticky-note', desc: 'Vos notes' },
        { id: 'codex', label: 'Codex', icon: 'book-open', desc: 'Encyclopédie' },
        { id: 'corkboard', label: 'Tableau', icon: 'layout-grid', desc: 'Vue tableau liège' },
        { id: 'mindmap', label: 'Mindmap', icon: 'git-branch', desc: 'Carte mentale' },
        { id: 'plot', label: 'Intrigue', icon: 'trending-up', desc: 'Arcs narratifs' },
        { id: 'relations', label: 'Relations', icon: 'heart-handshake', desc: 'Liens entre personnages' },
        { id: 'map', label: 'Carte', icon: 'map', desc: 'Carte du monde' },
        { id: 'timelineviz', label: 'Timeline Métro', icon: 'train-track', desc: 'Timeline visuelle' },
        { id: 'timeline', label: 'Timeline', icon: 'calendar-range', desc: 'Timeline classique' },
        { id: 'stats', label: 'Statistiques', icon: 'bar-chart-3', desc: 'Stats du projet' },
        { id: 'analysis', label: 'Analyse', icon: 'trending-up', desc: 'Analyse du texte' },
        { id: 'versions', label: 'Versions', icon: 'file-clock', desc: 'Versions des scènes' },
        { id: 'todos', label: 'TODOs', icon: 'list-todo', desc: 'Liste des tâches' }
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

    document.getElementById('splitSelectorModal').classList.add('active');
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

/** [ViewModel] - Action utilisateur de sélection d'une vue dans la modal */
function selectSplitPanelView(view) {
    if (!currentSplitSelectorPanel) return;

    switchSplitPanelView(currentSplitSelectorPanel, view);
    closeModal('splitSelectorModal');
}

// Handle scene selection in split view
/** [ViewModel] - Met à jour l'état métier pour afficher une scène spécifique */
function openSceneInSplitPanel(actId, chapterId, sceneId) {
    if (!splitViewActive) return;

    const state = splitActivePanel === 'left' ? splitViewState.left : splitViewState.right;

    // Only update if the active panel is showing editor view
    if (state.view === 'editor') {
        state.actId = actId;
        state.chapterId = chapterId;
        state.sceneId = sceneId;

        // Also update global current IDs
        currentActId = actId;
        currentChapterId = chapterId;
        currentSceneId = sceneId;

        renderSplitPanelViewContent(splitActivePanel);
        saveSplitViewState();
    }
}

// Handle character selection in split view
/** [ViewModel] - Met à jour l'état métier pour afficher un personnage spécifique */
function openCharacterInSplitPanel(charId) {
    if (!splitViewActive) return;

    const state = splitActivePanel === 'left' ? splitViewState.left : splitViewState.right;

    if (state.view === 'characters') {
        state.characterId = charId;
        renderSplitPanelViewContent(splitActivePanel);
        saveSplitViewState();
    }
}

// Handle world element selection in split view
/** [ViewModel] - Met à jour l'état métier pour afficher un élément de l'univers */
function openWorldElementInSplitPanel(elemId) {
    if (!splitViewActive) return;

    const state = splitActivePanel === 'left' ? splitViewState.left : splitViewState.right;

    if (state.view === 'world') {
        state.worldId = elemId;
        renderSplitPanelViewContent(splitActivePanel);
        saveSplitViewState();
    }
}

// Handle note selection in split view  
/** [ViewModel] - Met à jour l'état métier pour afficher une note spécifique */
function openNoteInSplitPanel(noteId) {
    if (!splitViewActive) return;

    const state = splitActivePanel === 'left' ? splitViewState.left : splitViewState.right;

    if (state.view === 'notes') {
        state.noteId = noteId;
        renderSplitPanelViewContent(splitActivePanel);
        saveSplitViewState();
    }
}

/** [Mixte] - Synchronise le contenu du DOM (View) vers les données du projet (Model) */
function updateSplitSceneContent(editor) {
    const sceneId = parseInt(editor.dataset.sceneId);
    const chapterId = parseInt(editor.dataset.chapterId);
    const actId = parseInt(editor.dataset.actId);
    const panel = editor.dataset.panel;

    const act = project.acts.find(a => a.id === actId);
    if (!act) return;
    const chapter = act.chapters.find(c => c.id === chapterId);
    if (!chapter) return;
    const scene = chapter.scenes.find(s => s.id === sceneId);
    if (!scene) return;

    scene.content = editor.innerHTML;
    const wordCount = getWordCount(editor.innerHTML);
    scene.wordCount = wordCount;

    // Update word count display
    const wcDisplay = document.querySelector(`.split-word-count-${panel}`);
    if (wcDisplay) wcDisplay.textContent = wordCount;

    saveProject();
}

/** [Mixte] - Synchronise le contenu du textarea (View) vers les données de la note (Model) */
function updateSplitNoteContent(textarea) {
    const noteId = parseInt(textarea.dataset.noteId);
    const note = project.notes?.find(n => n.id === noteId);
    if (note) {
        note.content = textarea.value;
        saveProject();
    }
}

// Resizer functionality
let isResizing = false;

/** [View] - Initialise le processus de redimensionnement des panneaux via la souris/tactile */
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

/** [Mixte/View] - Calcule le nouveau ratio et met à jour le style CSS des panneaux */
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

/** [ViewModel/View] - Finalise le redimensionnement et sauvegarde l'état */
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

/** [Model] - Persiste l'état actuel du mode split dans le stockage local */
function saveSplitViewState() {
    if (splitViewState.persistOnReload) {
        localStorage.setItem('plume_splitViewState', JSON.stringify({
            active: splitViewActive,
            activePanel: splitActivePanel,
            state: splitViewState
        }));
    }
}

/** [Model] - Récupère l'état sauvegardé du mode split du stockage local */
function loadSplitViewState() {
    const saved = localStorage.getItem('plume_splitViewState');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            if (data.state && data.state.persistOnReload) {
                splitViewState = { ...splitViewState, ...data.state };
                splitActivePanel = data.activePanel || 'left';
                if (data.active) {
                    splitViewActive = true;
                    setTimeout(() => {
                        renderSplitView();
                        updateSplitToggleButton();
                    }, 500);
                }
            }
        } catch (e) {
            console.error('Error loading split view state:', e);
        }
    }
}

// Legacy function for compatibility
/** [ViewModel] - Fonction legacy pour ouvrir un personnage en panneau latéral droit */
function openCharacterBeside(charId) {
    if (!splitViewActive) {
        activateSplitView();
    }

    // Set right panel to characters view with this character
    splitViewState.right.view = 'characters';
    splitViewState.right.characterId = charId;
    splitActivePanel = 'right';

    renderSplitView();
    showNotification('Personnage ouvert dans le panneau droit');
}

/** [Mixte/ViewModel] - Met à jour un champ personnage et déclenche rendu/sauvegarde */
function updateCharacterField(id, field, value) {
    const character = project.characters.find(c => c.id === id);
    if (character) {
        character[field] = value;
        saveProject();
        renderCharactersList();
    }
}

