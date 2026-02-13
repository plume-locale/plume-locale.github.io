/**
 * Notes Handlers - Event handling and global exposure
 */
class NotesHandlers {
    /**
     * Handle the "Add Note" button click
     */
    static onAddNote() {
        const title = document.getElementById('noteTitleInput').value.trim();
        const category = document.getElementById('noteCategoryInput').value;
        const tags = document.getElementById('noteTagsInput').value.trim();
        const content = document.getElementById('noteContentInput').value.trim();

        if (!title) return;

        notesViewModel.addNote({
            title,
            category,
            tags,
            content
        });

        // Clear inputs
        document.getElementById('noteTitleInput').value = '';
        document.getElementById('noteTagsInput').value = '';
        document.getElementById('noteContentInput').value = '';
    }

    /**
     * Prepares and opens the add note modal
     */
    static openAddNoteModal() {
        const modal = document.getElementById('addNoteModal');
        if (modal) {
            modal.classList.add('active');
            setTimeout(() => {
                const titleInput = document.getElementById('noteTitleInput');
                if (titleInput) titleInput.focus();
            }, 100);
        }
    }

    /**
     * Ouvre la modal d'ajout de média.
     */
    static openAddMediaModal(noteId) {
        let modal = document.getElementById('addMediaModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'addMediaModal';
            modal.className = 'modal';
            document.body.appendChild(modal);
        }

        modal.innerHTML = `
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h3>${Localization.t('notes.modal.media.title')}</h3>
                    <button class="modal-close" onclick="closeModal('addMediaModal')">×</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label class="form-label">${Localization.t('notes.modal.media.type')}</label>
                        <select id="mediaTypeInput" class="form-input" onchange="NotesHandlers.updateMediaInputPlaceholder()">
                            <option value="url">${Localization.t('notes.modal.media.type.url')}</option>
                            <option value="image">${Localization.t('notes.modal.media.type.image')}</option>
                            <option value="audio">${Localization.t('notes.modal.media.type.audio')}</option>
                            <option value="youtube">${Localization.t('notes.modal.media.type.youtube')}</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">${Localization.t('notes.modal.media.title_label')}</label>
                        <input type="text" id="mediaTitleInput" class="form-input" placeholder="${Localization.t('notes.modal.media.title_placeholder')}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">${Localization.t('notes.modal.media.url_label')}</label>
                        <input type="text" id="mediaUrlInput" class="form-input" placeholder="https://...">
                    </div>
                    <div id="mediaPreview" style="margin-top: 1rem;"></div>
                </div>
                <div class="modal-footer">
                    <button class="btn" onclick="closeModal('addMediaModal')">${Localization.t('notes.modal.media.cancel')}</button>
                    <button class="btn btn-primary" onclick="NotesHandlers.onAddMedia(${noteId})">${Localization.t('notes.modal.media.add')}</button>
                </div>
            </div>
        `;
        modal.classList.add('active');
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    static updateMediaInputPlaceholder() {
        const type = document.getElementById('mediaTypeInput').value;
        const urlInput = document.getElementById('mediaUrlInput');
        const placeholders = {
            'url': 'https://example.com/article',
            'image': 'https://example.com/image.jpg',
            'audio': 'https://example.com/music.mp3',
            'youtube': 'https://www.youtube.com/watch?v=...'
        };
        urlInput.placeholder = placeholders[type] || 'https://...';
    }

    static onAddMedia(noteId) {
        const typeInput = document.getElementById('mediaTypeInput');
        const titleInput = document.getElementById('mediaTitleInput');
        const urlInput = document.getElementById('mediaUrlInput');

        if (!urlInput.value.trim()) {
            alert(Localization.t('notes.error.url_required'));
            return;
        }

        notesViewModel.addMedia(noteId, {
            type: typeInput.value,
            title: titleInput.value.trim(),
            url: urlInput.value.trim()
        });
    }
}

// Global exposure for legacy compatibility and HTML onclicks
window.NotesHandlers = NotesHandlers;
window.openAddNoteModal = NotesHandlers.openAddNoteModal;
window.addNote = NotesHandlers.onAddNote;
window.deleteNote = (id) => notesViewModel.deleteNote(id);
window.renderNotesList = () => {
    notesViewModel.refreshList();
};
window.toggleNoteCategory = (cat) => notesViewModel.toggleCategory(cat);
window.expandAllNoteCategories = () => notesViewModel.expandAll();
window.collapseAllNoteCategories = () => notesViewModel.collapseAll();
window.openNoteDetail = (id) => notesViewModel.openDetail(id);
window.updateNoteField = (id, field, value) => notesViewModel.updateField(id, field, value);
window.updateNoteTags = (id, tagsString) => notesViewModel.updateTags(id, tagsString);
window.openAddMediaModal = (id) => NotesHandlers.openAddMediaModal(id);
window.addNoteMedia = (id) => NotesHandlers.onAddMedia(id);
window.deleteNoteMedia = (noteId, index) => notesViewModel.deleteMedia(noteId, index);
window.renderNoteDetailInContainer = (note, container) => {
    // This is used by SplitView Coordinator
    // We override the internal renderNoteDetailInContainer logic here if needed
    // or we just call the one in splitview.coordinator.js if it's already there.
    // However, the user asked for a strict refactor, so let's provide a better implementation.
    container.innerHTML = `
        <div class="detail-view" style="height: 100%; display: flex; flex-direction: column; overflow: hidden;">
            <div class="detail-header" style="padding: 1rem; background: var(--bg-secondary); border-bottom: 1px solid var(--border-color);">
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <input type="text" class="form-input" value="${note.title || ''}" 
                           style="font-size: 1.3rem; font-weight: 600; flex: 1; border: none; background: transparent;"
                           onchange="notesViewModel.updateField(${note.id}, 'title', this.value)"
                           placeholder="${Localization.t('notes.detail.title_placeholder')}">
                    <select class="form-input" onchange="notesViewModel.updateField(${note.id}, 'category', this.value)" style="width: auto;">
                        ${NotesModel.CATEGORY_ORDER.map(cat => `
                            <option value="${cat}" ${note.category === cat ? 'selected' : ''}>${NotesView.getCategoryLabel(cat)}</option>
                        `).join('')}
                    </select>
                </div>
                <div style="margin-top: 0.5rem;">
                    <input type="text" class="form-input" value="${(note.tags || []).join(', ')}" 
                           style="font-size: 0.85rem; width: 100%;"
                           onchange="notesViewModel.updateTags(${note.id}, this.value)"
                           placeholder="${Localization.t('notes.detail.tags_placeholder')}">
                </div>
            </div>
            <div style="flex: 1; padding: 1rem; overflow: hidden;">
                <textarea class="form-input" 
                          style="width: 100%; height: 100%; resize: none; font-size: 1rem; line-height: 1.7; border: none; background: var(--bg-primary);"
                          oninput="notesViewModel.updateField(${note.id}, 'content', this.value)"
                          placeholder="${Localization.t('notes.detail.content_placeholder')}">${note.content || ''}</textarea>
            </div>
            <div style="padding: 0.5rem 1rem; font-size: 0.75rem; color: var(--text-muted); background: var(--bg-secondary); border-top: 1px solid var(--border-color);">
                ${Localization.t('notes.detail.created', new Date(note.createdAt).toLocaleDateString())} • 
                ${Localization.t('notes.detail.updated', new Date(note.updatedAt).toLocaleDateString())}
            </div>
        </div>
    `;
};
