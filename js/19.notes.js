// Notes Management

// [MVVM : View]
// Affiche la modal d'ajout ; interaction UI uniquement.
function openAddNoteModal() {
    document.getElementById('addNoteModal').classList.add('active');
    setTimeout(() => document.getElementById('noteTitleInput').focus(), 100);
}

// [MVVM : ViewModel]
// Crée un nouvel objet Model, met à jour project.notes, persiste et déclenche le rendu.
function addNote() {
    const title = document.getElementById('noteTitleInput').value.trim();
    const category = document.getElementById('noteCategoryInput').value;
    const tags = document.getElementById('noteTagsInput').value.trim();
    const content = document.getElementById('noteContentInput').value.trim();

    if (!title) return;

    const note = {
        id: Date.now(),
        title: title,
        category: category,
        tags: tags ? tags.split(',').map(t => t.trim()).filter(t => t) : [],
        content: content || '',
        medias: [], // Support pour les médias: {type: 'url'|'image'|'audio', url: '', title: ''}
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    project.notes.push(note);

    // Clear inputs
    document.getElementById('noteTitleInput').value = '';
    document.getElementById('noteTagsInput').value = '';
    document.getElementById('noteContentInput').value = '';

    closeModal('addNoteModal');
    saveProject();
    renderNotesList();
}

// [MVVM : ViewModel]
// Modifie le Model (suppression), persiste et met à jour la View.
function deleteNote(id) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette note ?')) return;
    project.notes = project.notes.filter(n => n.id !== id);
    saveProject();
    renderNotesList();
    showEmptyState();
}

// [MVVM : ViewModel]
// État UI local (quelle catégorie est développée). Gère le comportement d'affichage.
let expandedNoteCategories = new Set(['Idée', 'Recherche', 'Référence', 'A faire', 'Question', 'Autre']);

// [MVVM : View]
// Rend la liste des notes dans le DOM ; lecture du Model mais responsabilité d'affichage.
function renderNotesList() {
    const container = document.getElementById('notesList');

    if (project.notes.length === 0) {
        container.innerHTML = '<div style="padding: 1rem; text-align: center; color: var(--text-muted); font-size: 0.85rem;">Aucune note</div>';
        return;
    }

    // Group notes by category
    const categories = {};
    // Icônes Lucide pour les catégories
    const categoryIcons = {
        'Idée': 'lightbulb',
        'Recherche': 'search',
        'Référence': 'bookmark',
        'A faire': 'check-circle',
        'Question': 'help-circle',
        'Autre': 'file-text'
    };

    project.notes.forEach(note => {
        const cat = note.category || 'Autre';
        if (!categories[cat]) categories[cat] = [];
        categories[cat].push(note);
    });

    // Sort notes within categories alphabetically by title
    Object.keys(categories).forEach(cat => {
        categories[cat].sort((a, b) => {
            return (a.title || '').toLowerCase().localeCompare((b.title || '').toLowerCase(), 'fr');
        });
    });

    let html = '';

    // Render each category as a collapsible group
    const categoryOrder = ['Idée', 'Recherche', 'Référence', 'A faire', 'Question', 'Autre'];
    categoryOrder.forEach(cat => {
        if (!categories[cat] || categories[cat].length === 0) return;

        const isExpanded = expandedNoteCategories.has(cat);
        const icon = categoryIcons[cat] || 'file-text';

        html += `
                    <div class="treeview-group" data-category="${cat}">
                        <div class="treeview-header" onclick="toggleNoteCategory('${cat}')">
                            <span class="treeview-icon ${isExpanded ? 'expanded' : ''}"><i data-lucide="${isExpanded ? 'chevron-down' : 'chevron-right'}" style="width:14px; height:14px;"></i></span>
                            <span class="treeview-category-icon"><i data-lucide="${icon}" style="width:16px; height:16px;"></i></span>
                            <span class="treeview-title">${cat}</span>
                            <span class="treeview-count">${categories[cat].length}</span>
                        </div>
                        <div class="treeview-children ${isExpanded ? '' : 'collapsed'}">
                            ${categories[cat].map(note => {
            const hasMedia = note.medias && note.medias.length > 0;
            // Remplacement du ?? par l'icône de trombone
            const mediaIcon = hasMedia ? 'paperclip' : '';
            return `
                                    <div class="treeview-item" onclick="openNoteDetail(${note.id})">
                                        <span class="treeview-item-title">${note.title}</span>
                                        ${mediaIcon ? `<span class="treeview-media-icon"><i data-lucide="${mediaIcon}" style="width:14px; height:14px;"></i></span>` : ''}
                                        <button class="btn btn-icon btn-small delete-btn" onclick="event.stopPropagation(); deleteNote(${note.id})" title="Supprimer">×</button>
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

// [MVVM : ViewModel]
// Mutations de l'état d'affichage (expand/collapse) et déclenche rendu.
function toggleNoteCategory(category) {
    if (expandedNoteCategories.has(category)) {
        expandedNoteCategories.delete(category);
    } else {
        expandedNoteCategories.add(category);
    }
    renderNotesList();
}

// [MVVM : ViewModel]
// Opération sur l'état UI et rafraîchissement de la View.
function expandAllNoteCategories() {
    expandedNoteCategories = new Set(['Idée', 'Recherche', 'Référence', 'A faire', 'Question', 'Autre']);
    renderNotesList();
}

// [MVVM : ViewModel]
// Opération sur l'état UI et rafraîchissement de la View.
function collapseAllNoteCategories() {
    expandedNoteCategories.clear();
    renderNotesList();
}

// [MVVM : Other]
// Rend la vue détail et gère la navigation (Mixte View/ViewModel).
function openNoteDetail(id) {
    const note = project.notes.find(n => n.id === id);
    if (!note) return;

    // Ensure medias array exists
    if (!note.medias) note.medias = [];

    // Handle split view mode
    if (splitViewActive) {
        const state = splitActivePanel === 'left' ? splitViewState.left : splitViewState.right;
        if (state.view === 'notes') {
            state.noteId = id;
            renderSplitPanelViewContent(splitActivePanel);
            saveSplitViewState();
            return;
        }
    }

    const editorView = document.getElementById('editorView');
    editorView.innerHTML = `
                <div class="detail-view">
                    <div class="detail-header">
                        <div style="display: flex; align-items: center; gap: 1rem; flex: 1;">
                            <input type="text" class="form-input" value="${note.title}" 
                                   style="font-size: 1.8rem; font-weight: 600; font-family: 'Noto Serif JP', serif; padding: 0.5rem;"
                                   onchange="updateNoteField(${id}, 'title', this.value)"
                                   placeholder="Titre de la note">
                            <span style="font-size: 0.8rem; padding: 0.4rem 0.8rem; background: var(--accent-gold); color: var(--bg-primary); border-radius: 2px;">${note.category}</span>
                        </div>
                        <button class="btn" onclick="switchView('editor')">? Retour à l'éditeur</button>
                    </div>
                    
                    <div class="detail-section">
                        <div class="detail-section-title">Catégorie</div>
                        <select class="form-input" onchange="updateNoteField(${id}, 'category', this.value)">
                            <option value="Recherche" ${note.category === 'Recherche' ? 'selected' : ''}>Recherche</option>
                            <option value="Idée" ${note.category === 'Idée' ? 'selected' : ''}>Idée</option>
                            <option value="Référence" ${note.category === 'Référence' ? 'selected' : ''}>Référence</option>
                            <option value="A faire" ${note.category === 'A faire' ? 'selected' : ''}>À faire</option>
                            <option value="Question" ${note.category === 'Question' ? 'selected' : ''}>Question</option>
                            <option value="Autre" ${note.category === 'Autre' ? 'selected' : ''}>Autre</option>
                        </select>
                    </div>

                    <div class="detail-section">
                        <div class="detail-section-title">Tags</div>
                        <input type="text" class="form-input" value="${note.tags.join(', ')}" 
                               onchange="updateNoteTags(${id}, this.value)">
                        <small style="color: var(--text-muted); font-style: italic;">Séparez les tags par des virgules</small>
                    </div>

                    <div class="detail-section">
                        <div class="detail-section-title">Contenu</div>
                        <textarea class="form-input" rows="12" 
                                  oninput="updateNoteField(${id}, 'content', this.value)">${note.content}</textarea>
                    </div>

                    <div class="detail-section">
                        <div class="detail-section-title">
                            Médias
                            <button class="btn btn-small" onclick="openAddMediaModal(${id})" style="margin-left: 1rem;">
                                <i data-lucide="plus" style="width:14px;height:14px;margin-right:0.3rem;"></i>Ajouter
                            </button>
                        </div>
                        <div class="note-medias-container" id="noteMedias-${id}">
                            ${renderNoteMedias(note)}
                        </div>
                    </div>

                    <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2rem; font-family: 'Source Code Pro', monospace;">
                        Créée le ${new Date(note.createdAt).toLocaleDateString('fr-FR')} • 
                        Modifiée le ${new Date(note.updatedAt).toLocaleDateString('fr-FR')}
                    </div>
                </div>
            `;
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

// [MVVM : View]
// Génère le markup HTML des médias pour une note.
function renderNoteMedias(note) {
    if (!note.medias || note.medias.length === 0) {
        return '<div style="color: var(--text-muted); font-style: italic; padding: 1rem; text-align: center; border: 1px dashed var(--border-color); border-radius: 8px;">Aucun média ajouté</div>';
    }

    return `<div class="note-medias-grid">${note.medias.map((media, index) => {
        if (media.type === 'image') {
            return `
                        <div class="note-media-item note-media-image">
                            <img src="${media.url}" alt="${media.title || 'Image'}" onclick="window.open('${media.url}', '_blank')">
                            <div class="note-media-overlay">
                                <span class="note-media-title">${media.title || 'Image'}</span>
                                <button class="note-media-delete" onclick="deleteNoteMedia(${note.id}, ${index})">×</button>
                            </div>
                        </div>
                    `;
        } else if (media.type === 'audio') {
            return `
                        <div class="note-media-item note-media-audio">
                            <div class="note-media-audio-icon"><i data-lucide="volume-2" style="width:24px; height:24px;"></i></div>
                            <div class="note-media-audio-info">
                                <span class="note-media-title">${media.title || 'Audio'}</span>
                                <audio controls src="${media.url}" style="width: 100%; margin-top: 0.5rem;"></audio>
                            </div>
                            <button class="note-media-delete" onclick="deleteNoteMedia(${note.id}, ${index})">×</button>
                        </div>
                    `;
        } else if (media.type === 'url') {
            const domain = extractDomain(media.url);
            return `
                        <div class="note-media-item note-media-url" onclick="window.open('${media.url}', '_blank')">
                            <div class="note-media-url-icon"><i data-lucide="link" style="width:24px; height:24px;"></i></div>
                            <div class="note-media-url-info">
                                <span class="note-media-title">${media.title || media.url}</span>
                                <span class="note-media-domain">${domain}</span>
                            </div>
                            <button class="note-media-delete" onclick="event.stopPropagation(); deleteNoteMedia(${note.id}, ${index})">×</button>
                        </div>
                    `;
        } else if (media.type === 'youtube') {
            const videoId = extractYoutubeId(media.url);
            return `
                        <div class="note-media-item note-media-youtube">
                            <div class="note-media-youtube-thumb" onclick="window.open('${media.url}', '_blank')">
                                <img src="https://img.youtube.com/vi/${videoId}/mqdefault.jpg" alt="YouTube">
                                <div class="note-media-youtube-play"><i data-lucide="play" style="width:32px; height:32px; fill: white; stroke: white;"></i></div>
                            </div>
                            <div class="note-media-overlay">
                                <span class="note-media-title">${media.title || 'Vidéo YouTube'}</span>
                                <button class="note-media-delete" onclick="deleteNoteMedia(${note.id}, ${index})">×</button>
                            </div>
                        </div>
                    `;
        }
        return '';
    }).join('')}</div>`;
}

// [MVVM : Other]
// Fonction utilitaire (extraction de domaine).
function extractDomain(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname.replace('www.', '');
    } catch {
        return url;
    }
}

// [MVVM : Other]
// Parse l'ID YouTube depuis une URL.
function extractYoutubeId(url) {
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&\s?]+)/);
    return match ? match[1] : '';
}

// [MVVM : View]
// Crée et affiche la modal d'ajout de média.
function openAddMediaModal(noteId) {
    // Create modal dynamically
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
                        <h3>Ajouter un média</h3>
                        <button class="modal-close" onclick="closeModal('addMediaModal')">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label class="form-label">Type de média</label>
                            <select id="mediaTypeInput" class="form-input" onchange="updateMediaInputPlaceholder()">
                                <option value="url">Lien URL</option>
                                <option value="image">Image (URL)</option>
                                <option value="audio">Audio (URL)</option>
                                <option value="youtube">Vidéo YouTube</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Titre (optionnel)</label>
                            <input type="text" id="mediaTitleInput" class="form-input" placeholder="Titre du média">
                        </div>
                        <div class="form-group">
                            <label class="form-label">URL</label>
                            <input type="text" id="mediaUrlInput" class="form-input" placeholder="https://...">
                        </div>
                        <div id="mediaPreview" style="margin-top: 1rem;"></div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn" onclick="closeModal('addMediaModal')">Annuler</button>
                        <button class="btn btn-primary" onclick="addNoteMedia(${noteId})">Ajouter</button>
                    </div>
                </div>
            `;
    modal.classList.add('active');
}

// [MVVM : View]
// Aide l'UI en adaptant le placeholder selon le type.
function updateMediaInputPlaceholder() {
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

// [MVVM : ViewModel]
// Ajoute un média au Model, met à jour les timestamps, persiste et rafraîchit la View.
function addNoteMedia(noteId) {
    const type = document.getElementById('mediaTypeInput').value;
    const title = document.getElementById('mediaTitleInput').value.trim();
    const url = document.getElementById('mediaUrlInput').value.trim();

    if (!url) {
        alert('Veuillez entrer une URL');
        return;
    }

    const note = project.notes.find(n => n.id === noteId);
    if (!note) return;

    if (!note.medias) note.medias = [];

    note.medias.push({
        type: type,
        title: title || '',
        url: url,
        addedAt: new Date().toISOString()
    });

    note.updatedAt = new Date().toISOString();
    saveProject();
    closeModal('addMediaModal');
    openNoteDetail(noteId);
    renderNotesList();
}

// [MVVM : ViewModel]
// Supprime un média du Model, persiste et met à jour la View.
function deleteNoteMedia(noteId, mediaIndex) {
    if (!confirm('Supprimer ce média ?')) return;

    const note = project.notes.find(n => n.id === noteId);
    if (!note || !note.medias) return;

    note.medias.splice(mediaIndex, 1);
    note.updatedAt = new Date().toISOString();
    saveProject();
    openNoteDetail(noteId);
    renderNotesList();
}

// [MVVM : ViewModel]
// Met à jour un champ du Model, persiste et rafraîchit la View.
function updateNoteField(id, field, value) {
    const note = project.notes.find(n => n.id === id);
    if (note) {
        note[field] = value;
        note.updatedAt = new Date().toISOString();
        saveProject();
        renderNotesList();
    }
}

// [MVVM : ViewModel]
// Transforme la saisie en tableau dans le Model, persiste et rafraîchit la View.
function updateNoteTags(id, tagsString) {
    const note = project.notes.find(n => n.id === id);
    if (note) {
        note.tags = tagsString.split(',').map(t => t.trim()).filter(t => t);
        note.updatedAt = new Date().toISOString();
        saveProject();
        renderNotesList();
    }
}