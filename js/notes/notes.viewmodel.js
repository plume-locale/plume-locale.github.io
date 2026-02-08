/**
 * Notes ViewModel - Orchestrates logic between Repository and View
 */
class NotesViewModel {
    constructor() {
        this.expandedCategories = new Set(NotesModel.CATEGORY_ORDER);
        this.currentNoteId = null;
    }

    /**
     * Add a new note from inputs
     * @param {Object} inputs {title, category, tags, content}
     */
    addNote(inputs) {
        if (!inputs.title) return;

        const note = NotesRepository.add(inputs);

        if (typeof window.saveProject === 'function') window.saveProject();

        // Notification/Update View
        this.refreshList();
        this.closeAddModal();
    }

    /**
     * Delete a note
     * @param {number} id 
     */
    deleteNote(id) {
        if (!confirm(Localization.t('notes.confirm.delete'))) return;

        if (NotesRepository.delete(id)) {
            if (typeof window.saveProject === 'function') window.saveProject();
            this.refreshList();
            if (typeof window.showEmptyState === 'function') window.showEmptyState();
        }
    }

    /**
     * Toggle category expansion
     * @param {string} category 
     */
    toggleCategory(category) {
        if (this.expandedCategories.has(category)) {
            this.expandedCategories.delete(category);
        } else {
            this.expandedCategories.add(category);
        }
        this.refreshList();
    }

    /**
     * Expand all categories
     */
    expandAll() {
        this.expandedCategories = new Set(NotesModel.CATEGORY_ORDER);
        this.refreshList();
    }

    /**
     * Collapse all categories
     */
    collapseAll() {
        this.expandedCategories.clear();
        this.refreshList();
    }

    /**
     * Update a note field
     * @param {number} id 
     * @param {string} field 
     * @param {any} value 
     */
    updateField(id, field, value) {
        if (NotesRepository.update(id, { [field]: value })) {
            if (typeof window.saveProject === 'function') window.saveProject();
            this.refreshList();
        }
    }

    /**
     * Update note tags
     * @param {number} id 
     * @param {string} tagsString 
     */
    updateTags(id, tagsString) {
        const tags = tagsString.split(',').map(t => t.trim()).filter(t => t);
        if (NotesRepository.update(id, { tags: tags })) {
            if (typeof window.saveProject === 'function') window.saveProject();
            this.refreshList();
        }
    }

    /**
     * Add media to a note
     * @param {number} noteId 
     * @param {Object} mediaData 
     */
    addMedia(noteId, mediaData) {
        if (NotesRepository.addMedia(noteId, mediaData)) {
            if (typeof window.saveProject === 'function') window.saveProject();
            this.refreshList();
            this.refreshDetail(noteId);
            this.closeMediaModal();
        }
    }

    /**
     * Delete media from a note
     * @param {number} noteId 
     * @param {number} mediaIndex 
     */
    deleteMedia(noteId, mediaIndex) {
        if (!confirm(Localization.t('notes.confirm.delete_media'))) return;

        if (NotesRepository.deleteMedia(noteId, mediaIndex)) {
            if (typeof window.saveProject === 'function') window.saveProject();
            this.refreshList();
            this.refreshDetail(noteId);
        }
    }

    /**
     * Open note detail
     * @param {number} id 
     */
    openDetail(id) {
        this.currentNoteId = id;
        const note = NotesRepository.getById(id);
        if (!note) return;

        // Handle split view mode
        if (window.splitViewActive) {
            const panel = window.splitActivePanel === 'left' ? 'left' : 'right';
            const state = window.splitViewState[panel];
            if (state.view === 'notes') {
                state.noteId = id;
                if (typeof window.renderSplitPanelViewContent === 'function') {
                    window.renderSplitPanelViewContent(panel);
                }
                if (typeof window.saveSplitViewState === 'function') {
                    window.saveSplitViewState();
                }
                return;
            }
        }

        NotesView.renderDetail(note);
    }

    refreshCurrentDetail() {
        if (this.currentNoteId) {
            this.openDetail(this.currentNoteId);
        }
    }

    // View specific triggers
    refreshList() {
        NotesView.renderList(NotesRepository.getAll(), this.expandedCategories);
    }

    refreshDetail(id) {
        const note = NotesRepository.getById(id);
        if (note) {
            // If we are in detail view, we refresh it
            // This is a bit tricky since the detail view might be in a split panel or full screen
            // For now, let's just re-render if it's the current detail view
            this.openDetail(id);
        }
    }

    closeAddModal() {
        if (typeof window.closeModal === 'function') window.closeModal('addNoteModal');
    }

    closeMediaModal() {
        if (typeof window.closeModal === 'function') window.closeModal('addMediaModal');
    }
}

window.notesViewModel = new NotesViewModel();
