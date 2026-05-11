/**
 * ViewModel for the Reserve feature
 */
const ReserveViewModel = {
    state: {
        items: [],
        isLoading: false,
        initialized: false
    },

    /**
     * Initializes the reserve for the current project
     */
    async init() {
        // Only load if not initialized or if current projectId changed (optional check)
        if (this.state.initialized) return this.state.items;
        
        if (typeof currentProjectId === 'undefined' || !currentProjectId) {
            console.warn('[ReserveVM] No project ID available for init');
            return [];
        }
        
        this.state.isLoading = true;
        try {
            console.log('[ReserveVM] Loading items for project:', currentProjectId);
            const items = await ReserveRepository.getAllByProject(currentProjectId);
            this.state.items = items || [];
            this.state.items.sort((a, b) => b.createdAt - a.createdAt); // Newer first
            this.state.initialized = true;
        } catch (e) {
            console.error('[ReserveVM] Init failed:', e);
            this.state.items = [];
        } finally {
            this.state.isLoading = false;
        }
        
        return this.state.items;
    },

    /**
     * Buries a text snippet
     */
    async bury(content, sourceSceneId = null) {
        if (!content || !content.trim()) return;
        
        const projectId = typeof currentProjectId !== 'undefined' ? currentProjectId : null;
        if (!projectId) return null;

        // Get context info
        let sceneTitle = null;
        let chapterTitle = null;
        if (sourceSceneId && typeof project !== 'undefined') {
            outer: for (const act of project.acts) {
                for (const chapter of act.chapters) {
                    const scene = chapter.scenes.find(s => s.id == sourceSceneId);
                    if (scene) {
                        sceneTitle = scene.title;
                        chapterTitle = chapter.title;
                        break outer;
                    }
                }
            }
        }

        const newItem = ReserveModel.create(content, projectId, sourceSceneId, sceneTitle, chapterTitle);
        const success = await ReserveRepository.save(newItem);
        
        if (success) {
            this.state.items.unshift(newItem);
            return newItem;
        }
        return null;
    },

    /**
     * Toggles the pinned status of an item
     */
    async togglePin(id) {
        const item = this.state.items.find(i => i.id === id);
        if (!item) return false;

        item.pinned = !item.pinned;
        const success = await ReserveRepository.save(item);
        return success;
    },

    /**
     * Removes an item from the reserve
     */
    async incinerate(id) {
        const success = await ReserveRepository.delete(id);
        if (success) {
            this.state.items = this.state.items.filter(item => item.id !== id);
        }
        return success;
    },

    /**
     * Updates an item's data
     */
    async updateItem(id, data) {
        const itemIndex = this.state.items.findIndex(i => i.id === id);
        if (itemIndex === -1) return false;

        const updatedItem = { ...this.state.items[itemIndex], ...data };
        const success = await ReserveRepository.save(updatedItem);
        
        if (success) {
            this.state.items[itemIndex] = updatedItem;
        }
        return success;
    },

    getItems() {
        return this.state.items;
    }
};

window.ReserveViewModel = ReserveViewModel;
