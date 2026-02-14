/*
 * SCENE VERSION MODULE - MAIN
 * Application entry point and global exports.
 */

const SceneVersionApp = {
    init() {
        SceneVersionViewModel.init();
        // Initial render if needed, though usually triggered by selection change

        // Refresh view on language change
        window.addEventListener('localeChanged', () => {
            this.refreshList();
        });
    },

    // Public API for HTML interactions
    toggleSidebar: () => SceneVersionViewModel.toggleSidebar(),
    showSidebar: () => SceneVersionViewModel.showSidebar(),
    create: () => SceneVersionViewModel.createVersion(),
    switchTo: (id) => SceneVersionViewModel.restoreVersion(Number(id)),
    delete: (id) => SceneVersionViewModel.deleteVersion(Number(id)),
    rename: (id) => SceneVersionViewModel.renameVersion(Number(id)),
    toggleFinal: (id) => SceneVersionViewModel.toggleFinal(Number(id)),

    // API for external modules
    refreshList: () => {
        const current = SceneVersionRepository.getCurrentScene();
        if (current) SceneVersionView.renderList(current.scene);
        else SceneVersionView.renderList(null);
    },

    updateContent: (content) => SceneVersionViewModel.updateCurrentContent(content),

    getExportContent: (scene) => {
        if (scene.versions && scene.versions.length > 0) {
            const finalVersion = scene.versions.find(v => v.isFinal === true);
            if (finalVersion) return finalVersion.content;
        }
        return scene.content;
    }
};

// Expose globally for legacy compatibility
window.SceneVersionApp = SceneVersionApp;

// Map old global function names to new App methods for compatibility with existing HTML ONCLICK attributes
window.toggleVersionsSidebar = SceneVersionApp.toggleSidebar;
window.showVersionsSidebar = SceneVersionApp.showSidebar;
window.createSceneVersion = SceneVersionApp.create;
window.switchToSceneVersion = SceneVersionApp.switchTo;
window.deleteSceneVersion = SceneVersionApp.delete;
window.renameSceneVersion = SceneVersionApp.rename;
window.toggleFinalVersion = SceneVersionApp.toggleFinal;
window.renderSceneVersionsList = SceneVersionApp.refreshList;
window.updateSceneContentWithVersion = SceneVersionApp.updateContent;
window.getSceneExportContent = SceneVersionApp.getExportContent;
// Note: reattachAnnotationMarkerListeners was global too?
window.reattachAnnotationMarkerListeners = SceneVersionView.reattachAnnotationListeners;
// Added missing legacy function
window.getCurrentSceneForVersions = SceneVersionRepository.getCurrentScene;
