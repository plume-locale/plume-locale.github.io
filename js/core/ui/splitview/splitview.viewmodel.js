// ==========================================
// SPLIT VIEW SYSTEM - ViewModel
// ==========================================

/** [MVVM : ViewModel] - Gère le basculement de l'état global du mode split */
function toggleSplitView() {
    // Gestion Onglets (Préféré)
    if (typeof toggleTabsSplit === 'function') {
        // Désactiver l'ancien flag pour éviter les conflits visuels (reliquats)
        splitViewActive = false;
        toggleTabsSplit();
        updateSplitToggleButton();
        return;
    }

    if (splitViewActive) {
        closeSplitView();
    } else {
        activateSplitView();
    }
}

/** [MVVM : ViewModel] - Initialise l'état pour l'activation du mode split */
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
    showNotification(Localization.t('split.notify_activated'));
}

/** [MVVM : ViewModel] - Réinitialise l'état et restaure la vue standard */
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
    if (typeof switchView === 'function') {
        switchView(currentView);
    }

    updateSplitToggleButton();
    saveSplitViewState();
    showNotification(Localization.t('split.notify_disabled'));
}

/** [MVVM : ViewModel] - Gère le changement de panneau actif et met à jour les indicateurs visuels */
function setActiveSplitPanel(panel) {
    if (splitActivePanel === panel) return;

    splitActivePanel = panel;

    // Update visual indicators
    document.getElementById('splitPanelLeft')?.classList.toggle('active', panel === 'left');
    document.getElementById('splitPanelRight')?.classList.toggle('active', panel === 'right');

    const indicators = document.querySelectorAll('.split-panel-indicator');
    if (indicators.length >= 2) {
        indicators[0].classList.toggle('active', panel === 'left');
        indicators[1].classList.toggle('active', panel === 'right');
    }

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

/** [MVVM : ViewModel] - Gère le changement de type de vue au sein d'un panneau spécifique */
function switchSplitPanelView(panel, view) {
    const state = panel === 'left' ? splitViewState.left : splitViewState.right;
    state.view = view;

    // Reset specific IDs when changing view type
    state.sceneId = null;
    state.characterId = null;
    state.worldId = null;
    state.noteId = null;
    state.codexId = null;

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

/** [MVVM : ViewModel] - Action utilisateur de sélection d'une vue dans la modal */
function selectSplitPanelView(view) {
    if (!currentSplitSelectorPanel) return;

    switchSplitPanelView(currentSplitSelectorPanel, view);
    if (typeof closeModal === 'function') {
        closeModal('splitSelectorModal');
    }
}

/** [MVVM : ViewModel] - Met à jour l'état métier pour afficher une scène spécifique */
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

/** [MVVM : ViewModel] - Met à jour l'état métier pour afficher un personnage spécifique */
function openCharacterInSplitPanel(charId) {
    if (!splitViewActive) return;

    const state = splitActivePanel === 'left' ? splitViewState.left : splitViewState.right;

    if (state.view === 'characters') {
        state.characterId = charId;
        renderSplitPanelViewContent(splitActivePanel);
        saveSplitViewState();
    }
}

/** [MVVM : ViewModel] - Met à jour l'état métier pour afficher un élément de l'univers */
function openWorldElementInSplitPanel(elemId) {
    if (!splitViewActive) return;

    const state = splitActivePanel === 'left' ? splitViewState.left : splitViewState.right;

    if (state.view === 'world') {
        state.worldId = elemId;
        renderSplitPanelViewContent(splitActivePanel);
        saveSplitViewState();
    }
}

/** [MVVM : ViewModel] - Met à jour l'état métier pour afficher une note spécifique */
function openNoteInSplitPanel(noteId) {
    if (!splitViewActive) return;

    const state = splitActivePanel === 'left' ? splitViewState.left : splitViewState.right;

    if (state.view === 'notes') {
        state.noteId = noteId;
        renderSplitPanelViewContent(splitActivePanel);
        saveSplitViewState();
    }
}

/** [MVVM : ViewModel] - Logique métier pour l'ouverture d'une scène via le tableau de liège */
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
        if (typeof openScene === 'function') {
            openScene(actId, chapterId, sceneId);
        }
    }
}

/** [MVVM : ViewModel] - Fonction legacy pour ouvrir un personnage en panneau latéral droit */
function openCharacterBeside(charId) {
    if (!splitViewActive) {
        activateSplitView();
    }

    // Set right panel to characters view with this character
    splitViewState.right.view = 'characters';
    splitViewState.right.characterId = charId;
    splitActivePanel = 'right';

    renderSplitView();
    if (typeof showNotification === 'function') {
        showNotification(Localization.t('split.notify_char_opened'));
    }
}
