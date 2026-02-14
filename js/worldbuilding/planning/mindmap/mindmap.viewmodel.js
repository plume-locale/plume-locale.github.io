/**
 * @class MindmapViewModel
 * @description Coordinate logic between View and Repository.
 */
class MindmapViewModel {
    constructor(model, repository) {
        this.model = model;
        this.repository = repository;
    }

    createMindmap() {
        const title = prompt(Localization.t('mindmap.prompt.title'), Localization.t('mindmap.prompt.default_title'));
        if (!title) return;

        const newMindmap = this.repository.add(title);
        this.model.currentMindmapId = newMindmap.id;
        this.refresh();
    }

    generateAutoMindmap() {
        const newMindmap = this.repository.generateAutoMindmap();
        this.model.currentMindmapId = newMindmap.id;
        this.refresh();
    }

    deleteMindmap(id) {
        if (!confirm(Localization.t('mindmap.confirm.delete'))) return;

        if (this.repository.delete(id)) {
            if (this.model.currentMindmapId === id) {
                const mindmaps = this.repository.getAll();
                this.model.currentMindmapId = mindmaps.length > 0 ? mindmaps[0].id : null;
            }
            this.refresh();
        }
    }

    selectMindmap(id) {
        const oldMindmap = this.model.currentMindmap;
        if (oldMindmap) {
            // Save current view state into the mindmap object
            oldMindmap.viewState = {
                zoom: this.model.mindmapState.zoom,
                panX: this.model.mindmapState.panX,
                panY: this.model.mindmapState.panY
            };
        }

        this.model.currentMindmapId = id;
        const newMindmap = this.model.currentMindmap;

        if (newMindmap && newMindmap.viewState) {
            // Restore view state
            this.model.mindmapState.zoom = newMindmap.viewState.zoom || 1;
            this.model.mindmapState.panX = newMindmap.viewState.panX || 0;
            this.model.mindmapState.panY = newMindmap.viewState.panY || 0;
        } else {
            // Default center if new map
            this.resetView();
        }

        if (window.ProjectRepository && ProjectRepository.saveSetting) {
            ProjectRepository.saveSetting('lastMindmapId', id);
        }
        this.refresh();
    }

    renameMindmap() {
        const mindmap = this.model.currentMindmap;
        if (!mindmap) return;

        const newTitle = prompt(Localization.t('mindmap.prompt.rename'), mindmap.title);
        if (newTitle && newTitle.trim()) {
            this.repository.update(mindmap.id, { title: newTitle.trim() });
            this.refresh();
        }
    }

    addNoteNode() {
        const mindmap = this.model.currentMindmap;
        if (!mindmap) return;

        const content = prompt(Localization.t('mindmap.prompt.note_content'));
        if (!content) return;

        this.repository.addNode(mindmap.id, {
            type: 'note',
            title: Localization.t('mindmap.node.note_title'),
            content: content,
            x: 100 + Math.random() * 200,
            y: 100 + Math.random() * 200
        });
        this.refresh();
    }

    deleteNode(nodeId) {
        const mindmap = this.model.currentMindmap;
        if (!mindmap) return;

        if (!confirm(Localization.t('mindmap.confirm.delete_node'))) return;

        if (this.repository.deleteNode(mindmap.id, nodeId)) {
            this.refresh();
        }
    }

    startLinkFrom(nodeId) {
        const state = this.model.mindmapState;
        if (state.linkStart === nodeId) {
            this.cancelLinking();
        } else if (state.linkStart && state.linkStart !== nodeId) {
            const mindmap = this.model.currentMindmap;
            if (!mindmap) return;

            this.repository.addLink(mindmap.id, {
                from: state.linkStart,
                to: nodeId
            });
            state.linkStart = null;
            this.refresh();
        } else {
            state.linkStart = nodeId;
            this.refresh();
        }
    }

    cancelLinking() {
        this.model.mindmapState.linkStart = null;
        this.refresh();
    }

    toggleLibrary() {
        this.model.mindmapState.libraryCollapsed = !this.model.mindmapState.libraryCollapsed;
        this.refresh();
    }

    setLibraryTab(tab) {
        this.model.mindmapState.activeLibraryTab = tab;
        this.refresh();
    }

    resetView() {
        const mindmap = this.model.currentMindmap;
        const state = this.model.mindmapState;

        if (!mindmap || !mindmap.nodes || mindmap.nodes.length === 0) {
            state.zoom = 1;
            state.panX = 0;
            state.panY = 0;
        } else {
            // Get bounding box
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            mindmap.nodes.forEach(n => {
                const w = 180; // Fixed width
                let h = 60;    // Est. height
                if (n.type === 'note' || n.type === 'codex') h = 100;
                if (n.type === 'scene' && n.content) h = 80;

                minX = Math.min(minX, n.x);
                minY = Math.min(minY, n.y);
                maxX = Math.max(maxX, n.x + w);
                maxY = Math.max(maxY, n.y + h);
            });

            // Calculate viewport
            const wrapper = document.getElementById('mindmapCanvasWrapper');
            const viewWidth = wrapper ? wrapper.clientWidth : window.innerWidth * 0.7;
            const viewHeight = wrapper ? wrapper.clientHeight : window.innerHeight * 0.8;

            const padding = 80;
            const contentWidth = maxX - minX + padding * 2;
            const contentHeight = maxY - minY + padding * 2;

            // Determine zoom
            const zoomX = viewWidth / contentWidth;
            const zoomY = viewHeight / contentHeight;
            state.zoom = Math.max(0.15, Math.min(1.2, Math.min(zoomX, zoomY)));

            // Calculate pan to center
            const centerX = (minX + maxX) / 2;
            const centerY = (minY + maxY) / 2;

            state.panX = -centerX + (viewWidth / 2) / state.zoom;
            state.panY = -centerY + (viewHeight / 2) / state.zoom;
        }

        // Persist reset state
        if (mindmap) {
            mindmap.viewState = {
                zoom: state.zoom,
                panX: state.panX,
                panY: state.panY
            };
            this.repository.save();
        }

        this.refresh();
    }

    zoom(delta) {
        const state = this.model.mindmapState;
        const factor = delta > 0 ? 1.1 : 0.9;
        state.zoom = Math.max(0.1, Math.min(3, state.zoom * factor));

        // Update mindmap object's viewState
        const mindmap = this.model.currentMindmap;
        if (mindmap) {
            mindmap.viewState = mindmap.viewState || {};
            mindmap.viewState.zoom = state.zoom;
            this.repository.save();
        }

        this.refresh();
    }

    updateNodePosition(nodeId, x, y) {
        const mindmap = this.model.currentMindmap;
        if (!mindmap) return;

        const node = mindmap.nodes.find(n => n.id === nodeId);
        if (node) {
            node.x = x;
            node.y = y;
            // No full refresh here for performance during drag
        }
    }

    saveNodePosition() {
        const mindmap = this.model.currentMindmap;
        if (mindmap) {
            mindmap.viewState = {
                zoom: this.model.mindmapState.zoom,
                panX: this.model.mindmapState.panX,
                panY: this.model.mindmapState.panY
            };
        }
        this.repository.save();
    }

    handleNodeDoubleClick(node) {
        if (!node.linkedId) return;

        if (typeof window.switchView !== 'function') return;

        if (node.type === 'character') {
            switchView('characters');
            setTimeout(() => window.openCharacterDetail && openCharacterDetail(node.linkedId), 100);
        } else if (node.type === 'element') {
            switchView('world');
            setTimeout(() => window.openWorldDetail && openWorldDetail(node.linkedId), 100);
        } else if (node.type === 'codex') {
            switchView('codex');
            setTimeout(() => window.openCodexDetail && openCodexDetail(node.linkedId), 100);
        } else if (node.type === 'scene' && node.actId && node.chapterId) {
            switchView('editor');
            setTimeout(() => window.openScene && openScene(node.actId, node.chapterId, node.linkedId), 100);
        } else if (node.type === 'chapter' && node.actId) {
            switchView('editor');
            const act = project.acts.find(a => a.id == node.actId);
            if (act) {
                const chapter = act.chapters.find(c => c.id == node.linkedId);
                if (chapter && chapter.scenes.length > 0) {
                    setTimeout(() => window.openScene && openScene(node.actId, node.linkedId, chapter.scenes[0].id), 100);
                }
            }
        } else if (node.type === 'act') {
            switchView('editor');
            const act = project.acts.find(a => a.id == node.linkedId);
            if (act && act.chapters.length > 0 && act.chapters[0].scenes.length > 0) {
                setTimeout(() => window.openScene && openScene(node.linkedId, act.chapters[0].id, act.chapters[0].scenes[0].id), 100);
            }
        }
    }

    refresh() {
        if (window.mindmapView) {
            window.mindmapView.render();
            window.mindmapView.renderSidebar();
        }
    }
}

// Export instance
window.mindmapViewModel = new MindmapViewModel(window.mindmapModel, window.mindmapRepository);
