/**
 * @namespace MindmapModule
 * @description Main entry point for the Mindmap module.
 */

// Global variables for compatibility
window.currentMindmapId = null;

// Bridging with old function names if needed
window.renderMindmapView = () => {
    window.mindmapView.renderSidebar();
    window.mindmapView.render();
};

window.createNewMindmap = () => window.mindmapViewModel.createMindmap();
window.generateAutoMindmap = () => window.mindmapViewModel.generateAutoMindmap();
window.deleteMindmap = (id) => window.mindmapViewModel.deleteMindmap(id);
window.selectMindmap = (id) => window.mindmapViewModel.selectMindmap(id);
window.renameMindmap = () => window.mindmapViewModel.renameMindmap();
window.addNoteNode = () => window.mindmapViewModel.addNoteNode();
window.deleteNode = (id) => window.mindmapViewModel.deleteNode(id);
window.resetMindmapView = () => window.mindmapViewModel.resetView();
window.toggleLibrary = () => window.mindmapViewModel.toggleLibrary();
window.setLibraryTab = (tab) => window.mindmapViewModel.setLibraryTab(tab);
window.startLinkFrom = (id) => window.mindmapViewModel.startLinkFrom(id);
window.cancelLinking = () => window.mindmapViewModel.cancelLinking();

// Synchronize global currentMindmapId with model
Object.defineProperty(window, 'currentMindmapId', {
    get: () => window.mindmapModel.currentMindmapId,
    set: (val) => { window.mindmapModel.currentMindmapId = val; }
});

// Initialization
document.addEventListener('DOMContentLoaded', async () => {
    // Attempt to load last mindmap if none set
    if (!window.mindmapModel.currentMindmapId && window.ProjectRepository) {
        try {
            const lastId = await ProjectRepository.loadSetting('lastMindmapId');
            if (lastId) {
                window.mindmapModel.currentMindmapId = lastId;
            } else if (project.mindmaps && project.mindmaps.length > 0) {
                window.mindmapModel.currentMindmapId = project.mindmaps[0].id;
            }

            // Restore camera state for the selected mindmap
            const current = window.mindmapModel.currentMindmap;
            if (current && current.viewState) {
                window.mindmapModel.mindmapState.zoom = current.viewState.zoom || 1;
                window.mindmapModel.mindmapState.panX = current.viewState.panX || 0;
                window.mindmapModel.mindmapState.panY = current.viewState.panY || 0;
            }

            window.renderMindmapView();
        } catch (e) {
            console.warn('[Mindmap] Failed to load lastMindmapId', e);
        }
    }
});
