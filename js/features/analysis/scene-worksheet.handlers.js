/**
 * SceneWorksheetHandlers
 * Event handlers for saving scene analysis data.
 */
const SceneWorksheetHandlers = {
    /**
     * Updates a top-level field in the scene analysis object.
     */
    updateField: function (sceneId, field, value) {
        const scene = findSceneById(sceneId);
        if (!scene) return;

        if (!scene.analysis) scene.analysis = {};
        scene.analysis[field] = value;

        // Save to project and update last modified
        scene.updatedAt = new Date().toISOString();
        if (typeof saveProject === 'function') saveProject();
    },

    /**
     * Updates a nested field in the scene analysis object.
     */
    updateNestedField: function (sceneId, section, field, value) {
        const scene = findSceneById(sceneId);
        if (!scene) return;

        if (!scene.analysis) scene.analysis = {};
        if (!scene.analysis[section]) scene.analysis[section] = {};

        scene.analysis[section][field] = value;

        // Save to project and update last modified
        scene.updatedAt = new Date().toISOString();
        if (typeof saveProject === 'function') saveProject();
    },

    /**
     * Opens the scene preparation worksheet in the right pane of split view.
     * If already open in the right pane, closes it and the split view.
     */
    openPreparationSplit: function (sceneId) {
        if (typeof tabsState === 'undefined') {
            openTab('scene_analysis', { sceneId: sceneId });
            return;
        }

        const pane = tabsState.panes.right;
        const tabId = typeof generateTabId === 'function'
            ? generateTabId('scene_analysis', { sceneId: sceneId })
            : `scene-analysis-${sceneId}`;
        const existingTabIndex = pane.tabs.findIndex(t => t.id === tabId);

        // Si l'onglet est déjà ouvert à droite, on le ferme et on désactive le split
        if (tabsState.isSplit && existingTabIndex !== -1) {
            closeTab(tabId, 'right');

            // Si c'était le seul onglet à droite, on ferme le split
            if (tabsState.panes.right.tabs.length === 0) {
                tabsState.isSplit = false;
                if (typeof renderTabs === 'function') renderTabs();
            }
            return;
        }

        // Force split mode
        if (!tabsState.isSplit) {
            tabsState.isSplit = true;
            // renderTabs sera appelé par openTab juste après
        }

        // Open in the right pane
        openTab('scene_analysis', { sceneId: sceneId }, { paneId: 'right' });
    }
};
