
// Timeline Management
// [MVVM : View]
// Manipule directement le DOM pour afficher le modal d'ajout
function openAddTimelineModal() {
    document.getElementById('addTimelineModal').classList.add('active');
    setTimeout(() => document.getElementById('timelineTitleInput').focus(), 100);
}

// [MVVM : Other]
// Group: Use Case | Naming: AddTimelineEventUseCase
// Ajoute un événement à la chronologie (Mixte ViewModel)
function addTimelineEvent() {
    const title = document.getElementById('timelineTitleInput').value.trim();
    const date = document.getElementById('timelineDateInput').value.trim();
    const location = document.getElementById('timelineLocationInput').value.trim();
    const characters = document.getElementById('timelineCharactersInput').value.trim();
    const description = document.getElementById('timelineDescInput').value.trim();

    if (!title) return;

    const event = {
        id: Date.now(),
        title: title,
        date: date || '',
        location: location || '',
        characters: characters || '',
        description: description || '',
        order: project.timeline.length, // For manual reordering
        consequences: '',
        notes: ''
    };

    project.timeline.push(event);

    // Clear inputs
    document.getElementById('timelineTitleInput').value = '';
    document.getElementById('timelineDateInput').value = '';
    document.getElementById('timelineLocationInput').value = '';
    document.getElementById('timelineCharactersInput').value = '';
    document.getElementById('timelineDescInput').value = '';

    closeModal('addTimelineModal');
    saveProject();
    renderTimelineList();
}

// [MVVM : Other]
// Group: Use Case | Naming: DeleteTimelineEventUseCase
// Gère la suppression d'un événement (Mixte ViewModel)
function deleteTimelineEvent(id) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) return;
    project.timeline = project.timeline.filter(e => e.id !== id);
    saveProject();
    renderTimelineList();
    showEmptyState();
}

// [MVVM : View]
// Rend la liste chronologique dans le DOM à partir du Model
function renderTimelineList() {
    const container = document.getElementById('timelineList');

    if (project.timeline.length === 0) {
        container.innerHTML = '<div style="padding: 2rem; text-align: center; color: var(--text-muted);">Aucun événement</div>';
        return;
    }

    // Sort by order field for manual ordering
    const sortedTimeline = [...project.timeline].sort((a, b) => a.order - b.order);

    container.innerHTML = `
                <div class="timeline-container">
                    <div class="timeline-line"></div>
                    ${sortedTimeline.map(event => `
                        <div class="timeline-event" onclick="openTimelineDetail(${event.id})">
                            <div style="display: flex; justify-content: space-between; align-items: start;">
                                <div style="flex: 1;">
                                    ${event.date ? `<div class="timeline-date">?? ${event.date}</div>` : ''}
                                    <div class="timeline-title">${event.title}</div>
                                    <div class="timeline-meta">
                                        ${event.location ? `<div class="timeline-meta-item">?? ${event.location}</div>` : ''}
                                        ${event.characters ? `<div class="timeline-meta-item"><i data-lucide="users" style="width:12px;height:12px;vertical-align:middle;margin-right:4px;"></i>${event.characters}</div>` : ''}
                                    </div>
                                    ${event.description ? `<div class="timeline-description">${event.description}</div>` : ''}
                                </div>
                                <button class="btn btn-icon btn-small" onclick="event.stopPropagation(); deleteTimelineEvent(${event.id})" title="Supprimer">×</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
}

// [MVVM : View]
// Construit la vue détaillée d'un événement chronologique
function openTimelineDetail(id) {
    const event = project.timeline.find(e => e.id === id);
    if (!event) return;

    const editorView = document.getElementById('editorView');
    editorView.innerHTML = `
                <div class="detail-view">
                    <div class="detail-header">
                        <div class="detail-title">${event.title}</div>
                        <button class="btn" onclick="switchView('editor')">? Retour à l'éditeur</button>
                    </div>
                    
                    <div class="detail-section">
                        <div class="detail-section-title">Informations</div>
                        <div class="detail-field">
                            <div class="detail-label">Date / Moment</div>
                            <input type="text" class="form-input" value="${event.date}" 
                                   onchange="updateTimelineField(${id}, 'date', this.value)">
                        </div>
                        <div class="detail-field">
                            <div class="detail-label">Localisation</div>
                            <input type="text" class="form-input" value="${event.location}" 
                                   onchange="updateTimelineField(${id}, 'location', this.value)">
                        </div>
                        <div class="detail-field">
                            <div class="detail-label">Personnages impliqués</div>
                            <input type="text" class="form-input" value="${event.characters}" 
                                   onchange="updateTimelineField(${id}, 'characters', this.value)">
                        </div>
                    </div>

                    <div class="detail-section">
                        <div class="detail-section-title">Description</div>
                        <textarea class="form-input" rows="6" 
                                  onchange="updateTimelineField(${id}, 'description', this.value)">${event.description}</textarea>
                    </div>

                    <div class="detail-section">
                        <div class="detail-section-title">Conséquences</div>
                        <textarea class="form-input" rows="6" 
                                  onchange="updateTimelineField(${id}, 'consequences', this.value)">${event.consequences}</textarea>
                        <small style="color: var(--text-muted); font-style: italic;">Qu'est-ce que cet événement déclenche ou change dans l'histoire ?</small>
                    </div>

                    <div class="detail-section">
                        <div class="detail-section-title">Notes</div>
                        <textarea class="form-input" rows="4" 
                                  onchange="updateTimelineField(${id}, 'notes', this.value)">${event.notes}</textarea>
                    </div>
                </div>
            `;
}

// [MVVM : ViewModel]
// Met à jour un champ de l'événement et rafraîchit la View
function updateTimelineField(id, field, value) {
    const event = project.timeline.find(e => e.id === id);
    if (event) {
        event[field] = value;
        saveProject();
        renderTimelineList();
    }
}
