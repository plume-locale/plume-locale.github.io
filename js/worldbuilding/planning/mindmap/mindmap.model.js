/**
 * @class MindmapModel
 * @description State management for the Mindmap module.
 */
class MindmapModel {
    constructor() {
        this.currentMindmapId = null;
        this.mindmapState = {
            zoom: 1,
            panX: 0,
            panY: 0,
            isDragging: false,
            draggedNode: null,
            selectedNode: null,
            isPanning: false,
            lastMouseX: 0,
            lastMouseY: 0,
            linkStart: null,
            libraryCollapsed: false,
            activeLibraryTab: 'characters',
            dragOffsetX: 0,
            dragOffsetY: 0
        };

        // Initialize project data if missing
        if (!project.mindmapNodes) project.mindmapNodes = [];
        if (!project.plotPoints) project.plotPoints = [];
        if (!project.relationships) project.relationships = [];
        if (!project.mapLocations) project.mapLocations = [];
        if (!project.mapImage) project.mapImage = null;
        if (!project.visualTimeline) project.visualTimeline = [];
        if (!project.mindmaps) project.mindmaps = [];
    }

    get mindmaps() {
        return project.mindmaps || [];
    }

    set mindmaps(value) {
        project.mindmaps = value;
    }

    get currentMindmap() {
        if (!this.currentMindmapId) return null;
        const mindmaps = project.mindmaps || [];
        return mindmaps.find(mm => String(mm.id) === String(this.currentMindmapId));
    }
}

// Export instance
window.mindmapModel = new MindmapModel();
