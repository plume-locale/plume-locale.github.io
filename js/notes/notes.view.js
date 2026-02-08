/**
 * Notes View - Handles rendering
 */
class NotesView {
    /**
     * Render the notes list in the sidebar
     * @param {Array} notes 
     * @param {Set} expandedCategories 
     */
    static renderList(notes, expandedCategories) {
        const container = document.getElementById('notesList');
        if (!container) return;

        if (notes.length === 0) {
            container.innerHTML = `<div style="padding: 1rem; text-align: center; color: var(--text-muted); font-size: 0.85rem;">${Localization.t('notes.list.empty')}</div>`;
            return;
        }

        // Group notes by category
        const categories = {};
        notes.forEach(note => {
            const cat = note.category || 'Autre';
            if (!categories[cat]) categories[cat] = [];
            categories[cat].push(note);
        });

        // Sort notes within categories alphabeticaly
        Object.keys(categories).forEach(cat => {
            categories[cat].sort((a, b) => {
                return (a.title || '').toLowerCase().localeCompare((b.title || '').toLowerCase(), 'fr');
            });
        });

        let html = '';

        NotesModel.CATEGORY_ORDER.forEach(cat => {
            if (!categories[cat] || categories[cat].length === 0) return;

            const isExpanded = expandedCategories.has(cat);
            const icon = NotesModel.CATEGORIES[cat] || 'file-text';

            html += `
                <div class="treeview-group" data-category="${cat}">
                    <div class="treeview-header" onclick="notesViewModel.toggleCategory('${cat}')">
                        <span class="treeview-icon ${isExpanded ? 'expanded' : ''}">
                            <i data-lucide="${isExpanded ? 'chevron-down' : 'chevron-right'}" style="width:14px; height:14px;"></i>
                        </span>
                        <span class="treeview-category-icon">
                            <i data-lucide="${icon}" style="width:16px; height:16px;"></i>
                        </span>
                        <span class="treeview-title">${NotesView.getCategoryLabel(cat)}</span>
                        <span class="treeview-count">${categories[cat].length}</span>
                    </div>
                    <div class="treeview-children ${isExpanded ? '' : 'collapsed'}">
                        ${categories[cat].map(note => {
                const hasMedia = note.medias && note.medias.length > 0;
                const mediaIcon = hasMedia ? 'paperclip' : '';
                return `
                                <div class="treeview-item" onclick="notesViewModel.openDetail(${note.id})">
                                    <span class="treeview-item-title">${note.title}</span>
                                    ${mediaIcon ? `<span class="treeview-media-icon"><i data-lucide="${mediaIcon}" style="width:14px; height:14px;"></i></span>` : ''}
                                    <button class="btn btn-icon btn-small delete-btn" onclick="event.stopPropagation(); notesViewModel.deleteNote(${note.id})" title="${Localization.t('btn.delete')}">×</button>
                                </div>
                            `;
            }).join('')}
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    /**
     * Render the note detail view
     * @param {Object} note 
     */
    static renderDetail(note) {
        const editorView = document.getElementById('editorView');
        if (!editorView) return;

        editorView.innerHTML = `
            <div class="detail-view">
                <div class="detail-header">
                    <div style="display: flex; align-items: center; gap: 1rem; flex: 1;">
                        <input type="text" class="form-input" value="${note.title}" 
                               style="font-size: 1.8rem; font-weight: 600; font-family: 'Noto Serif JP', serif; padding: 0.5rem;"
                               onchange="notesViewModel.updateField(${note.id}, 'title', this.value)"
                               placeholder="${Localization.t('notes.detail.title_placeholder')}">
                        <span style="font-size: 0.8rem; padding: 0.4rem 0.8rem; background: var(--accent-gold); color: var(--bg-primary); border-radius: 2px;">${NotesView.getCategoryLabel(note.category)}</span>
                    </div>
                    <button class="btn" onclick="switchView('editor')">${Localization.t('notes.detail.back')}</button>
                </div>
                
                <div class="detail-section">
                    <div class="detail-section-title">${Localization.t('notes.detail.category')}</div>
                    <select class="form-input" onchange="notesViewModel.updateField(${note.id}, 'category', this.value)">
                        ${NotesModel.CATEGORY_ORDER.map(cat => `
                            <option value="${cat}" ${note.category === cat ? 'selected' : ''}>${NotesView.getCategoryLabel(cat)}</option>
                        `).join('')}
                    </select>
                </div>

                <div class="detail-section">
                    <div class="detail-section-title">${Localization.t('notes.detail.tags')}</div>
                    <input type="text" class="form-input" value="${(note.tags || []).join(', ')}" 
                           onchange="notesViewModel.updateTags(${note.id}, this.value)">
                    <small style="color: var(--text-muted); font-style: italic;">${Localization.t('notes.detail.tags_help')}</small>
                </div>

                <div class="detail-section">
                    <div class="detail-section-title">${Localization.t('notes.detail.content')}</div>
                    <textarea class="form-input" rows="12" 
                              oninput="notesViewModel.updateField(${note.id}, 'content', this.value)">${note.content || ''}</textarea>
                </div>

                <div class="detail-section">
                    <div class="detail-section-title">
                        ${Localization.t('notes.detail.media')}
                        <button class="btn btn-small" onclick="NotesHandlers.openAddMediaModal(${note.id})" style="margin-left: 1rem;">
                            <i data-lucide="plus" style="width:14px;height:14px;margin-right:0.3rem;"></i>${Localization.t('notes.detail.add_media_btn')}
                        </button>
                    </div>
                    <div class="note-medias-container" id="noteMedias-${note.id}">
                        ${this.renderMedias(note)}
                    </div>
                </div>

                <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2rem; font-family: 'Source Code Pro', monospace;">
                    ${Localization.t('notes.detail.created', new Date(note.createdAt).toLocaleDateString())} • 
                    ${Localization.t('notes.detail.updated', new Date(note.updatedAt).toLocaleDateString())}
                </div>
            </div>
        `;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    /**
     * Render the medias grid for a note
     * @param {Object} note 
     * @returns {string}
     */
    static renderMedias(note) {
        if (!note.medias || note.medias.length === 0) {
            return `<div style="color: var(--text-muted); font-style: italic; padding: 1rem; text-align: center; border: 1px dashed var(--border-color); border-radius: 8px;">${Localization.t('notes.media.empty')}</div>`;
        }

        return `<div class="note-medias-grid">${note.medias.map((media, index) => {
            if (media.type === 'image') {
                return `
                    <div class="note-media-item note-media-image">
                        <img src="${media.url}" alt="${media.title || Localization.t('notes.media.image_default')}" onclick="window.open('${media.url}', '_blank')">
                        <div class="note-media-overlay">
                            <span class="note-media-title">${media.title || Localization.t('notes.media.image_default')}</span>
                            <button class="note-media-delete" onclick="notesViewModel.deleteMedia(${note.id}, ${index})">×</button>
                        </div>
                    </div>
                `;
            } else if (media.type === 'audio') {
                return `
                    <div class="note-media-item note-media-audio">
                        <div class="note-media-audio-icon"><i data-lucide="volume-2" style="width:24px; height:24px;"></i></div>
                        <div class="note-media-audio-info">
                            <span class="note-media-title">${media.title || Localization.t('notes.media.audio_default')}</span>
                            <audio controls src="${media.url}" style="width: 100%; margin-top: 0.5rem;"></audio>
                        </div>
                        <button class="note-media-delete" onclick="notesViewModel.deleteMedia(${note.id}, ${index})">×</button>
                    </div>
                `;
            } else if (media.type === 'url') {
                const domain = this.extractDomain(media.url);
                return `
                    <div class="note-media-item note-media-url" onclick="window.open('${media.url}', '_blank')">
                        <div class="note-media-url-icon"><i data-lucide="link" style="width:24px; height:24px;"></i></div>
                        <div class="note-media-url-info">
                            <span class="note-media-title">${media.title || media.url}</span>
                            <span class="note-media-domain">${domain}</span>
                        </div>
                        <button class="note-media-delete" onclick="event.stopPropagation(); notesViewModel.deleteMedia(${note.id}, ${index})">×</button>
                    </div>
                `;
            } else if (media.type === 'youtube') {
                const videoId = this.extractYoutubeId(media.url);
                return `
                    <div class="note-media-item note-media-youtube">
                        <div class="note-media-youtube-thumb" onclick="window.open('${media.url}', '_blank')">
                            <img src="https://img.youtube.com/vi/${videoId}/mqdefault.jpg" alt="YouTube">
                            <div class="note-media-youtube-play"><i data-lucide="play" style="width:32px; height:32px; fill: white; stroke: white;"></i></div>
                        </div>
                        <div class="note-media-overlay">
                            <span class="note-media-title">${media.title || Localization.t('notes.media.video_default')}</span>
                            <button class="note-media-delete" onclick="notesViewModel.deleteMedia(${note.id}, ${index})">×</button>
                        </div>
                    </div>
                `;
            }
            return '';
        }).join('')}</div>`;
    }

    static extractDomain(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname.replace('www.', '');
        } catch {
            return url;
        }
    }

    static extractYoutubeId(url) {
        const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&\s?]+)/);
        return match ? match[1] : '';
    }
    static getCategoryLabel(category) {
        switch (category) {
            case 'Idée': return Localization.t('notes.category.idea');
            case 'Recherche': return Localization.t('notes.category.research');
            case 'Référence': return Localization.t('notes.category.reference');
            case 'A faire': return Localization.t('notes.category.todo');
            case 'Question': return Localization.t('notes.category.question');
            case 'Autre': return Localization.t('notes.category.other');
            default: return category;
        }
    }
}

window.NotesView = NotesView;
