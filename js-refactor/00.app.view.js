/**
 * [MVVM : App View Orchestrator]
 * Ce fichier coordonne les différentes vues de l'application et gère les side-effects globaux.
 */

// --- ÉTAT UI GLOBAL ---
let activeStatusFilters = ['draft', 'progress', 'complete', 'review'];
let currentStatusMenu = null;
let chapterScrollTrackingHandler = null;

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

/**
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
}

/**
 * Change la vue principale de l'application.
 */
function switchView(view) {
    // Si split view actif, changer la vue du panneau actif
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

    // Update header nav buttons
    document.querySelectorAll('[id^="header-tab-"]').forEach(btn => {
        btn.classList.remove('active');
    });
    const headerBtn = document.getElementById(`header-tab-${view}`);
    if (headerBtn) {
        headerBtn.classList.add('active');
    }

    // Éléments spécifiques à la vue Structure (Editor)
    const structureOnlyElements = [
        'projectProgressBar',
        'statusFilters',
        'sceneTools',
        'toolsSidebar'
    ];

    structureOnlyElements.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.style.display = (view === 'editor') ? '' : 'none';
        }
    });

    // Toolbar de l'arborescence
    const treeCollapseToolbar = document.getElementById('treeCollapseToolbar');
    const viewsWithGroups = ['editor', 'world', 'notes', 'codex', 'thriller'];
    if (treeCollapseToolbar) {
        treeCollapseToolbar.style.display = viewsWithGroups.includes(view) ? '' : 'none';
    }

    // Sidebar des versions (à droite)
    const sidebarVersions = document.getElementById('sidebarVersions');
    if (sidebarVersions) {
        if (view !== 'editor') {
            sidebarVersions.classList.add('hidden');
        }
    }

    // Cacher toutes les listes de la sidebar gauche
    const sidebarLists = [
        'chaptersList', 'charactersList', 'worldList', 'timelineList',
        'notesList', 'codexList', 'arcsList', 'statsList', 'versionsList', 'analysisList',
        'todosList', 'corkboardList', 'mindmapList', 'plotList',
        'relationsList', 'mapList', 'timelineVizList', 'storyGridList', 'thrillerList', 'noSidebarMessage'
    ];

    sidebarLists.forEach(listId => {
        const el = document.getElementById(listId);
        if (el) el.style.display = 'none';
    });

    // Mapping des vues vs listes sidebar
    const sidebarViews = {
        'editor': 'chaptersList',
        'characters': 'charactersList',
        'world': 'worldList',
        'notes': 'notesList',
        'codex': 'codexList',
        'arcs': 'arcsList',
        'mindmap': 'mindmapList',
        'timelineviz': 'timelineVizList',
        'thriller': 'thrillerList'
    };

    const editorViewVues = ['stats', 'analysis', 'versions', 'todos', 'timeline', 'corkboard', 'plot', 'plotgrid', 'relations', 'map'];

    const viewLabelsNoSidebar = {
        'stats': 'Statistiques', 'analysis': 'Analyse', 'versions': 'Versions',
        'todos': 'TODOs', 'timeline': 'Timeline', 'corkboard': 'Tableau',
        'plot': 'Intrigue', 'plotgrid': 'Plot grid', 'relations': 'Relations', 'map': 'Carte',
        'thriller': 'Thriller', 'storygrid': 'Story Grid'
    };

    if (sidebarViews[view]) {
        const listEl = document.getElementById(sidebarViews[view]);
        if (listEl) listEl.style.display = 'block';
    } else if (editorViewVues.includes(view)) {
        const noSidebarEl = document.getElementById('noSidebarMessage');
        if (noSidebarEl) {
            const viewLabel = viewLabelsNoSidebar[view] || 'Cette vue';
            noSidebarEl.innerHTML = `
                <div style="padding: 2rem 1rem; text-align: center; color: var(--text-muted);">
                    <i data-lucide="layout-dashboard" style="width: 48px; height: 48px; opacity: 0.3; margin-bottom: 1rem;"></i>
                    <div style="font-size: 0.9rem; line-height: 1.6;">
                        <strong>${viewLabel}</strong> utilise tout l'espace disponible.
                    </div>
                </div>`;
            noSidebarEl.style.display = 'block';
        }
    }

    // Sur mobile, gérer la sidebar
    const isMobile = window.innerWidth <= 900;
    if (isMobile && sidebarViews[view] && typeof renderMobileSidebarView === 'function') {
        renderMobileSidebarView(view);
    }

    // Update sidebar actions
    const actionsHTML = {
        editor: '<button class="btn btn-primary" onclick="openAddActModal()">+ Acte</button><button class="btn btn-primary" onclick="openAddChapterModal()">+ Chapitre</button><button class="btn btn-primary" onclick="openAddSceneModalQuick()">+ Scène</button>',
        characters: '<button class="btn btn-primary" onclick="openAddCharacterModal()">+ Personnage</button>',
        world: '<button class="btn btn-primary" onclick="openAddWorldModal()">+ Élément</button>',
        notes: '<button class="btn btn-primary" onclick="openAddNoteModal()">+ Note</button>',
        codex: '<button class="btn btn-primary" onclick="openAddCodexModal()">+ Entrée</button>',
        arcs: '<button class="btn btn-primary" onclick="createNewArc()">+ Arc narratif</button>',

    };
    const sidebarActions = document.getElementById('sidebarActions');
    if (sidebarActions) {
        sidebarActions.innerHTML = actionsHTML[view] || '';
    }

    // Hide plot sidebar when leaving editor
    if (view !== 'editor' && !splitViewActive) {
        document.getElementById('sidebarPlot')?.classList.add('hidden');
    }

    // Rendu du contenu
    renderViewContent(view, 'editorView');

    // Live Tension Meter Visibility
    const tensionMeter = document.getElementById('liveTensionMeter');
    if (tensionMeter) {
        tensionMeter.style.display = (view === 'editor') ? 'flex' : 'none';
    }

    // Refresh icons
    setTimeout(() => {
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }, 50);
}

/**
 * Rend le contenu spécifique d'une vue dans un conteneur.
 */
function renderViewContent(view, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    switch (view) {
        case 'editor':
            if (currentActId && currentChapterId && currentSceneId) {
                if (containerId === 'editorView' && !splitViewActive) {
                    const act = project.acts.find(a => a.id === currentActId);
                    if (act) {
                        const chapter = act.chapters.find(c => c.id === currentChapterId);
                        if (chapter) {
                            const scene = chapter.scenes.find(s => s.id === currentSceneId);
                            if (scene) {
                                if (typeof renderEditor === 'function') {
                                    renderEditor(act, chapter, scene);
                                    // Force refresh of links panel
                                    if (typeof autoDetectLinks === 'function') autoDetectLinks();
                                    if (typeof refreshLinksPanel === 'function') refreshLinksPanel();
                                    return;
                                }
                            }
                        }
                    }
                } else if (typeof renderSceneInContainer === 'function') {
                    renderSceneInContainer(currentActId, currentChapterId, currentSceneId, containerId);
                    return;
                }
            }

            // État vide par défaut pour l'éditeur
            if (project.acts.length === 0 || (project.acts.length === 1 && project.acts[0].chapters.length === 0)) {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon"><i data-lucide="pencil" style="width:48px;height:48px;stroke-width:1;"></i></div>
                        <div class="empty-state-title">Commencez votre histoire</div>
                        <div class="empty-state-text">Créez votre premier chapitre pour commencer à écrire.</div>
                        <button class="btn btn-primary" onclick="openAddChapterModal()">+ Créer un chapitre</button>
                    </div>`;
            } else {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon"><i data-lucide="pencil" style="width:48px;height:48px;stroke-width:1;"></i></div>
                        <div class="empty-state-title">Sélectionnez une scène</div>
                        <div class="empty-state-text">Choisissez une scène dans la barre latérale pour commencer à écrire.</div>
                    </div>`;
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
        default:
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon"><i data-lucide="layout" style="width:48px;height:48px;stroke-width:1;"></i></div>
                    <div class="empty-state-title">Panneau vide</div>
                    <div class="empty-state-text">Cliquez sur l'en-tête pour choisir une vue</div>
                </div>`;
            break;
    }
}

/**
 * Rafraîchit toutes les vues de l'application (utile après undo/redo ou import).
 */
function refreshAllViews() {
    // 1. Rafraîchir la structure (sidebar editor)
    if (typeof renderActsList === 'function') renderActsList();

    // 2. Restaurer l'état de l'arborescence
    setTimeout(() => {
        if (typeof restoreTreeState === 'function') restoreTreeState();
    }, 100);

    // 3. Rafraîchir les stats
    if (typeof updateStats === 'function') updateStats();

    // 4. Rafraîchir la vue actuelle
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
        case 'corkboard': if (typeof renderCorkBoard === 'function') renderCorkBoard(); break;
        case 'mindmap': if (typeof renderMindmapView === 'function') renderMindmapView(); break;
        case 'plot': if (typeof renderPlotView === 'function') renderPlotView(); break;
        case 'relations': if (typeof renderRelationsView === 'function') renderRelationsView(); break;
        case 'map': if (typeof renderMapView === 'function') renderMapView(); break;
        case 'timelineviz': if (typeof renderTimelineVizView === 'function') renderTimelineVizView(); break;
        case 'arcs': if (typeof renderArcsList === 'function') renderArcsList(); break;
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
    const linkId = `font-${fontName.replace(/\s+/g, '-').toLowerCase()}`;
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
        const customFont = prompt("Entrez le nom de la police Google Font exact (ex: 'Roboto Slab') :");
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
 * Ouvre un acte complet et affiche tous ses chapitres et scènes de manière séquentielle.
 */
function openAct(actId) {
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

    // Rendu de l'éditeur d'acte
    if (typeof renderActEditor === 'function') {
        renderActEditor(act);
    }
}

/**
 * Ouvre un chapitre complet et affiche toutes ses scènes de manière séquentielle.
 */
function openChapter(actId, chapterId) {
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

    // Rendu de l'éditeur de chapitre
    if (typeof renderChapterEditor === 'function') {
        renderChapterEditor(act, chapter);
    }
}

/**
 * Ouvre une scène spécifique et gère toute l'orchestration associée.
 */
function openScene(actId, chapterId, sceneId) {
    // Nettoyer le tracking de scroll du mode chapitre
    if (typeof cleanupChapterScrollTracking === 'function') cleanupChapterScrollTracking();

    if (window.innerWidth <= 900 && typeof closeMobileSidebar === 'function') {
        closeMobileSidebar();
    }

    if (typeof saveToHistoryImmediate === 'function') saveToHistoryImmediate();

    currentActId = actId;
    currentChapterId = chapterId;
    currentSceneId = sceneId;

    const act = project.acts.find(a => a.id === actId);
    const chapter = act ? act.chapters.find(c => c.id === chapterId) : null;
    const scene = chapter ? chapter.scenes.find(s => s.id === sceneId) : null;

    if (!scene) return;

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

    // Gestion Split View vs Normal
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

    // Post-open orchestrations
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

    // Annotations automatic opening
    const annotations = typeof getVersionAnnotations === 'function' ? getVersionAnnotations(scene) : [];
    if (annotations && annotations.length > 0 && window.innerWidth > 900) {
        if (typeof renderAnnotationsPanel === 'function') renderAnnotationsPanel();
        if (typeof updateAnnotationsButton === 'function') updateAnnotationsButton(true);
    } else {
        document.getElementById('annotationsPanel')?.classList.add('hidden');
        if (typeof updateAnnotationsButton === 'function') updateAnnotationsButton(false);
    }
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
    const act = project.acts.find(a => a.id === actId);
    const chapter = act?.chapters.find(c => c.id === chapterId);
    const scene = chapter?.scenes.find(s => s.id === sceneId);

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
function getEditorToolbarHTML(panel = null) {
    const fnName = panel ? 'formatTextInPanel' : 'formatText';
    const fnPrefix = panel ? `'${panel}', ` : '';
    const idSuffix = panel ? `-${panel}` : '';

    return `
        <!-- Basic formatting -->
        <div class="toolbar-group">
            <button class="toolbar-btn" data-format="bold" onclick="${fnName}(${fnPrefix}'bold')" title="Gras (Ctrl+B)">
                <i data-lucide="bold" style="width:14px;height:14px;"></i>
            </button>
            <button class="toolbar-btn" data-format="italic" onclick="${fnName}(${fnPrefix}'italic')" title="Italique (Ctrl+I)">
                <i data-lucide="italic" style="width:14px;height:14px;"></i>
            </button>
            <button class="toolbar-btn" data-format="underline" onclick="${fnName}(${fnPrefix}'underline')" title="Souligné (Ctrl+U)">
                <i data-lucide="underline" style="width:14px;height:14px;"></i>
            </button>
            <button class="toolbar-btn" data-format="strikethrough" onclick="${fnName}(${fnPrefix}'strikeThrough')" title="Barré">
                <i data-lucide="strikethrough" style="width:14px;height:14px;"></i>
            </button>
        </div>
        
        <!-- Font family and size -->
        <div class="toolbar-group">
            <select class="font-family-selector" onchange="applyFont(this.value, ${panel ? `'${panel}'` : 'null'})" title="Police de caractères" style="max-width: 150px;">
                ${POPULAR_GOOGLE_FONTS.map(font => `<option value="${font}" style="font-family: '${font}', sans-serif;">${font}</option>`).join('')}
                <option value="" disabled>──────────</option>
                <option value="custom" style="font-weight: bold; color: var(--accent-color);">+ Autre Google Font...</option>
            </select>
            <select class="font-size-selector" onchange="${fnName}(${fnPrefix}'fontSize', this.value)" title="Taille de police">
                <option value="1">Très petit</option>
                <option value="2">Petit</option>
                <option value="3" selected>Normal</option>
                <option value="4">Grand</option>
                <option value="5">Très grand</option>
                <option value="6">Énorme</option>
                <option value="7">Gigantesque</option>
            </select>
        </div>
        
        <!-- Text color -->
        <div class="toolbar-group">
            <div class="color-picker-wrapper">
                <button class="toolbar-btn" onclick="toggleColorPicker('text', event, ${panel ? `'${panel}'` : 'null'})" title="Couleur du texte">
                    <i data-lucide="baseline" style="width:14px;height:14px; border-bottom: 2px solid currentColor;"></i>
                </button>
                <div class="color-picker-dropdown" id="textColorPicker${idSuffix}">
                    <div class="color-grid" id="textColorGrid${idSuffix}"></div>
                    <div class="color-input-wrapper">
                        <input type="color" id="textColorInput${idSuffix}" onchange="applyTextColor(this.value, ${panel ? `'${panel}'` : 'null'})">
                        <input type="text" id="textColorHex${idSuffix}" placeholder="#000000" maxlength="7" onchange="applyTextColor(this.value, ${panel ? `'${panel}'` : 'null'})">
                    </div>
                </div>
            </div>
            <div class="color-picker-wrapper">
                <button class="toolbar-btn" onclick="toggleColorPicker('background', event, ${panel ? `'${panel}'` : 'null'})" title="Couleur de fond">
                    <i data-lucide="highlighter" style="width:14px;height:14px; border-bottom: 2px solid yellow;"></i>
                </button>
                <div class="color-picker-dropdown" id="backgroundColorPicker${idSuffix}">
                    <div class="color-grid" id="backgroundColorGrid${idSuffix}"></div>
                    <div class="color-input-wrapper">
                        <input type="color" id="bgColorInput${idSuffix}" onchange="applyBackgroundColor(this.value, ${panel ? `'${panel}'` : 'null'})">
                        <input type="text" id="bgColorHex${idSuffix}" placeholder="#FFFF00" maxlength="7" onchange="applyBackgroundColor(this.value, ${panel ? `'${panel}'` : 'null'})">
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Alignment -->
        <div class="toolbar-group">
            <button class="toolbar-btn" onclick="${fnName}(${fnPrefix}'justifyLeft')" title="Aligner à gauche">
                <i data-lucide="align-left" style="width:14px;height:14px;"></i>
            </button>
            <button class="toolbar-btn" onclick="${fnName}(${fnPrefix}'justifyCenter')" title="Centrer">
                <i data-lucide="align-center" style="width:14px;height:14px;"></i>
            </button>
            <button class="toolbar-btn" onclick="${fnName}(${fnPrefix}'justifyRight')" title="Aligner à droite">
                <i data-lucide="align-right" style="width:14px;height:14px;"></i>
            </button>
            <button class="toolbar-btn" onclick="${fnName}(${fnPrefix}'justifyFull')" title="Justifier">
                <i data-lucide="align-justify" style="width:14px;height:14px;"></i>
            </button>
        </div>
        
        <!-- Headings -->
        <div class="toolbar-group">
            <button class="toolbar-btn" onclick="${fnName}(${fnPrefix}'formatBlock', 'h1')" title="Titre 1"><i data-lucide="heading-1" style="width:14px;height:14px;"></i></button>
            <button class="toolbar-btn" onclick="${fnName}(${fnPrefix}'formatBlock', 'h2')" title="Titre 2"><i data-lucide="heading-2" style="width:14px;height:14px;"></i></button>
            <button class="toolbar-btn" onclick="${fnName}(${fnPrefix}'formatBlock', 'h3')" title="Titre 3"><i data-lucide="heading-3" style="width:14px;height:14px;"></i></button>
            <button class="toolbar-btn" onclick="${fnName}(${fnPrefix}'formatBlock', 'p')" title="Paragraphe"><i data-lucide="pilcrow" style="width:14px;height:14px;"></i></button>
        </div>
        
        <!-- Lists and quotes -->
        <div class="toolbar-group">
            <button class="toolbar-btn" onclick="${fnName}(${fnPrefix}'insertUnorderedList')" title="Liste à puces"><i data-lucide="list" style="width:14px;height:14px;"></i></button>
            <button class="toolbar-btn" onclick="${fnName}(${fnPrefix}'insertOrderedList')" title="Liste numérotée"><i data-lucide="list-ordered" style="width:14px;height:14px;"></i></button>
            <button class="toolbar-btn" onclick="${fnName}(${fnPrefix}'formatBlock', 'blockquote')" title="Citation"><i data-lucide="quote" style="width:14px;height:14px;"></i></button>
        </div>
        
        <!-- Indentation -->
        <div class="toolbar-group">
            <button class="toolbar-btn" onclick="${fnName}(${fnPrefix}'indent')" title="Augmenter l'indentation"><i data-lucide="indent" style="width:14px;height:14px;"></i></button>
            <button class="toolbar-btn" onclick="${fnName}(${fnPrefix}'outdent')" title="Diminuer l'indentation"><i data-lucide="outdent" style="width:14px;height:14px;"></i></button>
        </div>
        
        <!-- Superscript, subscript -->
        <div class="toolbar-group">
            <button class="toolbar-btn" onclick="${fnName}(${fnPrefix}'superscript')" title="Exposant"><i data-lucide="superscript" style="width:14px;height:14px;"></i></button>
            <button class="toolbar-btn" onclick="${fnName}(${fnPrefix}'subscript')" title="Indice"><i data-lucide="subscript" style="width:14px;height:14px;"></i></button>
        </div>
        
        <!-- Synonyms -->
        <div class="toolbar-group">
            <button class="toolbar-btn" onclick="if(typeof SynonymsView !== 'undefined') SynonymsView.toggle()" title="Dictionnaire des synonymes (Ctrl+Shift+S)">
                <i data-lucide="book-a" style="width:14px;height:14px;"></i>
            </button>
        </div>

        <!-- Other -->
        <div class="toolbar-group">
            <button class="toolbar-btn" onclick="${fnName}(${fnPrefix}'insertHorizontalRule')" title="Ligne horizontale"><i data-lucide="minus" style="width:14px;height:14px;"></i></button>
            <button class="toolbar-btn" onclick="${fnName}(${fnPrefix}'removeFormat')" title="Supprimer le formatage"><i data-lucide="eraser" style="width:14px;height:14px;"></i></button>
        </div>

        
        <!-- Revision mode button -->
        <div class="toolbar-group">
            <button class="toolbar-btn" onclick="toggleRevisionMode()" title="Mode Révision (Ctrl+R)" style="color: var(--accent-gold); font-weight: 600;"><i data-lucide="pencil" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i> RÉVISION</button>
        </div>
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
        ? `<span style="display: inline-flex; align-items: center; gap: 0.25rem; background: var(--accent-gold); color: var(--bg-accent); font-size: 0.7rem; font-weight: 600; padding: 0.2rem 0.5rem; border-radius: 10px; margin-left: 0.5rem;" title="Version finale : ${finalVersion.number}"><i data-lucide="star" style="width:10px;height:10px;fill:currentColor;"></i> ${finalVersion.number}</span>`
        : '';

    editorView.innerHTML = `
        <div class="editor-header">
            <div class="editor-breadcrumb">${act.title} > ${chapter.title}</div>
            <div style="display: flex; align-items: center; gap: 1rem;">
                <div class="editor-title" style="flex: 1;">${scene.title}${finalVersionBadge}</div>
                <button class="btn btn-small" onclick="toggleFocusMode()" title="Mode Focus (F11)" style="white-space: nowrap;">
                    <i data-lucide="maximize" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i>Focus
                </button>
            </div>
            <div class="editor-meta">
                <span id="sceneWordCount">${wordCount} mots</span>
                <span>Dernière modification : ${new Date(scene.updatedAt || Date.now()).toLocaleDateString('fr-FR')}</span>
            </div>
            <div class="editor-synopsis">
                <span class="synopsis-label"><i data-lucide="file-text" style="width:12px;height:12px;"></i> Résumé :</span>
                <input type="text" 
                       class="synopsis-input" 
                       value="${(scene.synopsis || '').replace(/"/g, '&quot;')}" 
                       placeholder="Ajouter un résumé de la scène..."
                       onchange="updateSceneSynopsis(${act.id}, ${chapter.id}, ${scene.id}, this.value)"
                       oninput="this.style.width = Math.max(200, this.scrollWidth) + 'px'">
            </div>
        </div>

        <button class="toolbar-mobile-toggle" onclick="toggleEditorToolbar()">
            <span id="toolbarToggleText"><i data-lucide="pen-line" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i>Afficher les outils</span>
        </button>
        
        <div class="editor-toolbar" id="editorToolbar">
            ${getEditorToolbarHTML()}
        </div>

        <div class="editor-content">
            <div class="editor-textarea" contenteditable="true" spellcheck="true" oninput="updateSceneContent()">${scene.content || ''}</div>
        </div>`;

    if (typeof lucide !== 'undefined') lucide.createIcons();
    if (typeof initializeColorPickers === 'function') initializeColorPickers();

    // Focus if empty
    setTimeout(() => {
        const editor = document.querySelector('.editor-textarea');
        if (editor && editor.textContent.trim() === '') editor.focus();

    }, 100);

    // Initialize scene navigation toolbar
    setTimeout(() => {
        if (typeof initSceneNavigation === 'function') initSceneNavigation();
        if (typeof updateLiveTensionMeter === 'function') updateLiveTensionMeter(scene.content || '', { actId: act.id, chapterId: chapter.id, sceneId: scene.id });
    }, 200);
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
            const wc = typeof getWordCount === 'function' ? getWordCount(scene.content) : (scene.wordCount || 0);
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
        <div class="editor-header">
            <div class="editor-breadcrumb">${act.title}</div>
            <div style="display: flex; align-items: center; gap: 1rem;">
                <div class="editor-title" id="actEditorTitle" style="flex: 1;">${act.title} - Tous les chapitres</div>
                <button class="btn btn-small" onclick="toggleFocusMode()" title="Mode Focus (F11)" style="white-space: nowrap;">
                    <i data-lucide="maximize" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i>Focus
                </button>
            </div>
            <div class="editor-meta">
                <span>${totalWords} mots au total</span>
                <span>${act.chapters.length} chapitre${act.chapters.length > 1 ? 's' : ''}</span>
                <span>${allScenes.length} scène${allScenes.length > 1 ? 's' : ''}</span>
                <span>Dernière modification : ${new Date(act.updatedAt || Date.now()).toLocaleDateString('fr-FR')}</span>
            </div>
        </div>

        <button class="toolbar-mobile-toggle" onclick="toggleEditorToolbar()">
            <span id="toolbarToggleText"><i data-lucide="pen-line" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i>Afficher les outils</span>
        </button>
        
        <div class="editor-toolbar" id="editorToolbar">
            ${getEditorToolbarHTML()}
        </div>

        <!-- Indicateur de position vertical -->
        <div class="chapter-progress-indicator" id="actProgressIndicator">
            ${allScenes.map((sceneData, index) => {
        const heightPercent = totalWords > 0 ? (sceneData.wordCount / totalWords) * 100 : (100 / allScenes.length);
        return `<div class="progress-scene-segment"
                            data-scene-id="${sceneData.scene.id}"
                            data-scene-index="${index}"
                            style="height: ${heightPercent}%"
                            title="${sceneData.chapterTitle} - ${sceneData.scene.title} (${sceneData.wordCount} mots)"
                            onclick="scrollToActScene(${index})"></div>`;
    }).join('')}
            <div class="progress-current-indicator" id="progressCurrentIndicator"></div>
        </div>

        <div class="editor-content" id="actEditorContent">
            ${contentHTML}
        </div>`;

    if (typeof lucide !== 'undefined') lucide.createIcons();
    if (typeof initializeColorPickers === 'function') initializeColorPickers();

    // Initialiser le tracking de scroll
    setTimeout(() => {
        initActScrollTracking(act.id, allScenes);
        // Auto-resize des synopsis existants
        document.querySelectorAll('.scene-separator-synopsis').forEach(autoResizeSynopsis);
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
 * Génère et affiche l'éditeur de chapitre avec toutes les scènes séquentiellement.
 */
function renderChapterEditor(act, chapter) {
    const editorView = document.getElementById('editorView');
    if (!editorView) return;

    // Calculer les statistiques du chapitre
    let totalWords = 0;
    const sceneWordCounts = [];
    chapter.scenes.forEach(scene => {
        const wc = typeof getWordCount === 'function' ? getWordCount(scene.content) : (scene.wordCount || 0);
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
        <div class="editor-header">
            <div class="editor-breadcrumb">${act.title} > ${chapter.title}</div>
            <div style="display: flex; align-items: center; gap: 1rem;">
                <div class="editor-title" id="chapterEditorTitle" style="flex: 1;">${chapter.title} - Toutes les scènes</div>
                <button class="btn btn-small" onclick="toggleFocusMode()" title="Mode Focus (F11)" style="white-space: nowrap;">
                    <i data-lucide="maximize" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i>Focus
                </button>
            </div>
            <div class="editor-meta">
                <span>${totalWords} mots au total</span>
                <span>${chapter.scenes.length} scène${chapter.scenes.length > 1 ? 's' : ''}</span>
                <span>Dernière modification : ${new Date(chapter.updatedAt || Date.now()).toLocaleDateString('fr-FR')}</span>
            </div>
        </div>

        <button class="toolbar-mobile-toggle" onclick="toggleEditorToolbar()">
            <span id="toolbarToggleText"><i data-lucide="pen-line" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i>Afficher les outils</span>
        </button>
        
        <div class="editor-toolbar" id="editorToolbar">
            ${getEditorToolbarHTML()}
        </div>

        <!-- Indicateur de position vertical -->
        <div class="chapter-progress-indicator" id="chapterProgressIndicator">
            ${chapter.scenes.map((scene, index) => {
        const wordCount = sceneWordCounts[index];
        const heightPercent = totalWords > 0 ? (wordCount / totalWords) * 100 : (100 / chapter.scenes.length);
        return `<div class="progress-scene-segment"
                            data-scene-id="${scene.id}"
                            data-scene-index="${index}"
                            style="height: ${heightPercent}%"
                            title="${scene.title} (${wordCount} mots)"
                            onclick="scrollToChapterScene(${index})"></div>`;
    }).join('')}
            <div class="progress-current-indicator" id="progressCurrentIndicator"></div>
        </div>

        <div class="editor-content" id="chapterEditorContent">
            ${scenesHTML}
        </div>`;

    if (typeof lucide !== 'undefined') lucide.createIcons();
    if (typeof initializeColorPickers === 'function') initializeColorPickers();

    // Initialiser le tracking de scroll
    setTimeout(() => {
        initChapterScrollTracking(act.id, chapter.id);
        // Auto-resize des synopsis existants
        document.querySelectorAll('.scene-separator-synopsis').forEach(autoResizeSynopsis);
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

    const act = project.acts.find(a => a.id === actId);
    const chapter = act?.chapters.find(c => c.id === chapterId);
    const scene = chapter?.scenes.find(s => s.id === sceneId);
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
    updateChapterProgressIndicator(chapter);

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
function initChapterScrollTracking(actId, chapterId) {
    // Nettoyer le handler précédent s'il existe
    cleanupChapterScrollTracking();

    const editorContent = document.getElementById('chapterEditorContent');
    const indicator = document.getElementById('progressCurrentIndicator');
    const title = document.getElementById('chapterEditorTitle');

    if (!editorContent || !indicator) return;

    const act = project.acts.find(a => a.id === actId);
    const chapter = act?.chapters.find(c => c.id === chapterId);
    if (!chapter) return;

    let currentSceneIndex = 0;

    function updateScrollPosition() {
        const sceneBlocks = Array.from(document.querySelectorAll('.chapter-scene-block'));
        if (sceneBlocks.length === 0) return;

        // Trouver quelle scène est actuellement visible
        const viewportMiddle = window.innerHeight / 2;
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

        // Mettre à jour le titre si la scène a changé
        if (closestScene !== currentSceneIndex) {
            currentSceneIndex = closestScene;
            const scene = chapter.scenes[closestScene];
            if (scene) {
                if (title) title.textContent = scene.title;
                // Mettre à jour la scène active dans tout l'application (Sidebar, Links, etc.)
                setActiveScene(actId, chapterId, scene.id);
            }

            // Update tension meter with current visible scene text from DOM
            if (typeof updateLiveTensionMeter === 'function' && scene) {
                const sceneEditor = document.querySelector(`.editor-textarea[data-scene-id="${scene.id}"]`);
                const textToAnalyze = sceneEditor ? sceneEditor.innerHTML : (scene.content || '');
                updateLiveTensionMeter(textToAnalyze, { actId, chapterId, sceneId: scene.id });
            }
        }

        // Calculer la position de l'indicateur
        const progressIndicator = document.getElementById('chapterProgressIndicator');
        if (!progressIndicator) return;

        const segments = Array.from(progressIndicator.querySelectorAll('.progress-scene-segment'));
        let topOffset = 0;

        // Calculer l'offset jusqu'à la scène actuelle
        for (let i = 0; i < currentSceneIndex; i++) {
            const seg = segments[i];
            if (seg) topOffset += seg.offsetHeight;
        }

        // Ajouter un pourcentage dans la scène actuelle basé sur le scroll
        const currentBlock = sceneBlocks[currentSceneIndex];
        if (currentBlock) {
            const blockRect = currentBlock.getBoundingClientRect();
            const viewportTop = 0;
            const relativeScroll = Math.max(0, Math.min(1, (viewportTop - blockRect.top) / blockRect.height));

            const currentSegment = segments[currentSceneIndex];
            if (currentSegment) {
                topOffset += currentSegment.offsetHeight * relativeScroll;
            }
        }

        indicator.style.top = `${topOffset}px`;

        // Mettre en surbrillance le segment actif
        segments.forEach((seg, i) => {
            if (i === currentSceneIndex) {
                seg.classList.add('active');
            } else {
                seg.classList.remove('active');
            }
        });
    }

    // Stocker le handler pour pouvoir le nettoyer plus tard
    chapterScrollTrackingHandler = updateScrollPosition;

    // Forcer un premier appel immédiat pour synchroniser la scène 1 (index 0)
    currentSceneIndex = -1;
    updateScrollPosition();

    // Écouter le scroll sur le conteneur principal
    const container = document.querySelector('.editor-container');
    if (container) {
        container.addEventListener('scroll', chapterScrollTrackingHandler);
    } else {
        // Fallback
        window.addEventListener('scroll', chapterScrollTrackingHandler);
    }
}

/**
 * [MVVM : View]
 * Nettoie le tracking de scroll pour éviter les fuites mémoire.
 */
function cleanupChapterScrollTracking() {
    if (chapterScrollTrackingHandler) {
        const container = document.querySelector('.editor-container');
        if (container) {
            container.removeEventListener('scroll', chapterScrollTrackingHandler);
        }
        window.removeEventListener('scroll', chapterScrollTrackingHandler);
        chapterScrollTrackingHandler = null;
    }
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
            // Un petit délai pour laisser l'animation de scroll commencer/finir si nécessaire
            // mais l'appel à focus() peut être immédiat
            setCursorAtBeginning(editor);
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

    const act = project.acts.find(a => a.id === actId);
    const chapter = act?.chapters.find(c => c.id === chapterId);
    const scene = chapter?.scenes.find(s => s.id === sceneId);
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
    updateActProgressIndicator(act);

    if (typeof updateLiveTensionMeter === 'function') {
        updateLiveTensionMeter(editor.innerHTML);
    }

    if (typeof autoDetectLinksDebounced === 'function') autoDetectLinksDebounced();
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
            segment.style.height = `${heightPercent}%`;
            segment.title = `${sceneData.chapterTitle} - ${sceneData.scene.title} (${sceneData.wordCount} mots)`;
        }
    });
}

/**
 * [MVVM : View]
 * Initialise le tracking de scroll pour l'éditeur d'acte.
 */
function initActScrollTracking(actId, allScenes) {
    // Nettoyer le handler précédent s'il existe
    cleanupChapterScrollTracking();

    const editorContent = document.getElementById('actEditorContent');
    const indicator = document.getElementById('progressCurrentIndicator');
    const title = document.getElementById('actEditorTitle');

    if (!editorContent || !indicator) return;

    const act = project.acts.find(a => a.id === actId);
    if (!act) return;

    let currentSceneIndex = 0;

    function updateScrollPosition() {
        const sceneBlocks = Array.from(document.querySelectorAll('.act-scene-block'));
        if (sceneBlocks.length === 0) return;

        // Trouver quelle scène est actuellement visible
        const viewportMiddle = window.innerHeight / 2;
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

        // Mettre à jour le titre si la scène a changé
        if (closestScene !== currentSceneIndex) {
            currentSceneIndex = closestScene;
            const sceneData = allScenes[closestScene];
            if (sceneData) {
                if (title) title.textContent = `${sceneData.chapterTitle} - ${sceneData.scene.title}`;
                // Mettre à jour la scène active dans tout l'application (Sidebar, Links, etc.)
                setActiveScene(actId, sceneData.chapterId, sceneData.scene.id);
            }

            // Update tension meter with current visible scene text from DOM for maximum accuracy
            if (typeof updateLiveTensionMeter === 'function' && sceneData) {
                const sceneEditor = document.querySelector(`.editor-textarea[data-scene-id="${sceneData.scene.id}"]`);
                const textToAnalyze = sceneEditor ? sceneEditor.innerHTML : (sceneData.scene.content || '');
                updateLiveTensionMeter(textToAnalyze);
            }
        }

        // Calculer la position de l'indicateur
        const progressIndicator = document.getElementById('actProgressIndicator');
        if (!progressIndicator) return;

        const segments = Array.from(progressIndicator.querySelectorAll('.progress-scene-segment'));
        let topOffset = 0;

        // Calculer l'offset jusqu'à la scène actuelle
        for (let i = 0; i < currentSceneIndex; i++) {
            const seg = segments[i];
            if (seg) topOffset += seg.offsetHeight;
        }

        // Ajouter un pourcentage dans la scène actuelle basé sur le scroll
        const currentBlock = sceneBlocks[currentSceneIndex];
        if (currentBlock) {
            const blockRect = currentBlock.getBoundingClientRect();
            const viewportTop = 0;
            const relativeScroll = Math.max(0, Math.min(1, (viewportTop - blockRect.top) / blockRect.height));

            const currentSegment = segments[currentSceneIndex];
            if (currentSegment) {
                topOffset += currentSegment.offsetHeight * relativeScroll;
            }
        }

        indicator.style.top = `${topOffset}px`;

        // Mettre en surbrillance le segment actif
        segments.forEach((seg, i) => {
            if (i === currentSceneIndex) {
                seg.classList.add('active');
            } else {
                seg.classList.remove('active');
            }
        });
    }

    // Stocker le handler pour pouvoir le nettoyer plus tard
    chapterScrollTrackingHandler = updateScrollPosition;

    // Forcer un premier appel immédiat pour synchroniser la scène 1 (index 0)
    currentSceneIndex = -1;
    updateScrollPosition();

    // Écouter le scroll sur le conteneur principal
    const container = document.querySelector('.editor-container');
    if (container) {
        container.addEventListener('scroll', chapterScrollTrackingHandler);
    } else {
        // Fallback
        window.addEventListener('scroll', chapterScrollTrackingHandler);
    }
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
        if (editor) {
            setCursorAtBeginning(editor);
        }
    }
}

// --- WELCOME SCREENS ---

function renderWelcomeEditor() {
    const container = document.getElementById('editorView');
    if (!container) return;
    container.innerHTML = `
        <div class="empty-state">
            <div class="empty-state-icon"><i data-lucide="pencil-line" style="width:48px;height:48px;stroke-width:1.5;"></i></div>
            <div class="empty-state-title">Sélectionnez une scène</div>
            <div class="empty-state-text">Choisissez une scène dans la barre latérale pour commencer à écrire.</div>
        </div>`;
}

function renderCharacterWelcome() {
    const container = document.getElementById('editorView');
    if (!container) return;
    container.innerHTML = `
        <div class="empty-state">
            <div class="empty-state-icon"><i data-lucide="users" style="width:48px;height:48px;stroke-width:1.5;"></i></div>
            <div class="empty-state-title">Personnages</div>
            <div class="empty-state-text">Sélectionnez un personnage pour voir sa fiche, ou créez-en un nouveau.</div>
        </div>`;
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function renderWorldWelcome() {
    const container = document.getElementById('editorView');
    if (!container) return;
    container.innerHTML = `
        <div class="empty-state">
            <div class="empty-state-icon"><i data-lucide="globe" style="width:48px;height:48px;stroke-width:1.5;"></i></div>
            <div class="empty-state-title">Univers</div>
            <div class="empty-state-text">Sélectionnez un lieu ou un élément dans la liste pour voir ses détails.</div>
        </div>`;
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function renderNotesWelcome() {
    const container = document.getElementById('editorView');
    if (!container) return;
    container.innerHTML = `
        <div class="empty-state">
            <div class="empty-state-icon"><i data-lucide="sticky-note" style="width:48px;height:48px;stroke-width:1.5;"></i></div>
            <div class="empty-state-title">Notes</div>
            <div class="empty-state-text">Sélectionnez une note dans la liste pour la consulter.</div>
        </div>`;
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function renderCodexWelcome() {
    const container = document.getElementById('editorView');
    if (!container) return;
    container.innerHTML = `
        <div class="empty-state">
            <div class="empty-state-icon"><i data-lucide="book-open" style="width:48px;height:48px;stroke-width:1.5;"></i></div>
            <div class="empty-state-title">Codex</div>
            <div class="empty-state-text">Sélectionnez une entrée dans la liste pour la consulter.</div>
        </div>`;
    if (typeof lucide !== 'undefined') lucide.createIcons();
}
