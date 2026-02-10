/**
 * [MVVM : World View]
 * UI Rendering and DOM interactions for World management.
 */

// Icons for each type
const WORLD_TYPE_ICONS = {
    'Lieu': 'map-pin',
    'Objet': 'package',
    'Concept': 'lightbulb',
    'Organisation': 'users',
    'Événement': 'calendar',
    'événement': 'calendar',
    'Autre': 'more-horizontal'
};

// I18n keys for each type
const WORLD_TYPE_I18N = {
    'Lieu': 'world.type.place',
    'Objet': 'world.type.object',
    'Concept': 'world.type.concept',
    'Organisation': 'world.type.organization',
    'Événement': 'world.type.event',
    'événement': 'world.type.event',
    'Autre': 'world.type.other'
};

/**
 * Opens the add world modal and sets focus.
 */
function openAddWorldModal() {
    const modal = document.getElementById('addWorldModal');
    if (modal) {
        modal.classList.add('active');
        setTimeout(() => {
            const input = document.getElementById('worldNameInput');
            if (input) input.focus();
        }, 100);
    }
}

/**
 * Handles the "Add" button click in the modal.
 */
function handleAddWorldElement() {
    const name = document.getElementById('worldNameInput').value.trim();
    const type = document.getElementById('worldTypeInput').value;
    const description = document.getElementById('worldDescInput').value.trim();

    const result = addWorldElementViewModel(name, type, description);

    if (result.success) {
        // Clear inputs
        document.getElementById('worldNameInput').value = '';
        document.getElementById('worldDescInput').value = '';

        if (result.sideEffects.shouldCloseModal) {
            closeModal(result.sideEffects.shouldCloseModal);
        }
        if (result.sideEffects.shouldSave && typeof saveProject === 'function') {
            saveProject();
        }
        if (result.sideEffects.shouldRefreshList) {
            renderWorldList();
        }
    }
}

/**
 * Handles the delete button click.
 */
function handleDeleteWorldElement(id) {
    if (!confirm(Localization.t('world.confirm.delete'))) return;

    const result = deleteWorldElementViewModel(id);

    if (result.success) {
        if (result.sideEffects.shouldSave && typeof saveProject === 'function') {
            saveProject();
        }
        if (result.sideEffects.shouldRefreshList) {
            renderWorldList();
        }
        if (result.sideEffects.shouldShowEmptyState && typeof showEmptyState === 'function') {
            showEmptyState();
        }
    }
}

/**
 * Renders the list of world elements grouped by type.
 */
function renderWorldList() {
    const container = document.getElementById('worldList');
    if (!container) return;

    const groups = getGroupedWorldElementsViewModel();
    const groupKeys = Object.keys(groups).sort();

    if (groupKeys.length === 0) {
        container.innerHTML = `<div style="padding: 1rem; text-align: center; color: var(--text-muted); font-size: 0.85rem;">${Localization.t('world.list.empty')}</div>`;
        return;
    }

    const collapsedState = JSON.parse(localStorage.getItem('plume_treeview_collapsed') || '{}');

    let html = '';
    groupKeys.forEach(type => {
        const groupKey = 'world_' + type;
        const isCollapsed = collapsedState[groupKey] === true;
        const elements = groups[type];

        html += `
            <div class="treeview-group">
                <div class="treeview-header" onclick="toggleTreeviewGroup('${groupKey}')">
                    <i data-lucide="${isCollapsed ? 'chevron-right' : 'chevron-down'}" class="treeview-chevron"></i>
                    <span class="treeview-label">${Localization.t(WORLD_TYPE_I18N[type] || 'world.type.other')}</span>
                    <span class="treeview-count">${elements.length}</span>
                </div>
                <div class="treeview-children ${isCollapsed ? 'collapsed' : ''}">
                    ${elements.map(elem => {
            const iconName = WORLD_TYPE_ICONS[type] || 'circle';
            return `
                            <div class="treeview-item" onclick="openWorldDetail('${elem.id}')">
                                <span class="treeview-item-icon"><i data-lucide="${iconName}" style="width:14px;height:14px;vertical-align:middle;"></i></span>
                                <span class="treeview-item-label">${elem.name}</span>
                                <button class="treeview-item-delete" onclick="event.stopPropagation(); handleDeleteWorldElement('${elem.id}')" title="${Localization.t('world.action.delete')}"><i data-lucide="x" style="width:12px;height:12px;"></i></button>
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
 * Opens the detail view for a world element.
 */
function openWorldDetail(id) {
    const data = getWorldDetailViewModel(id);
    if (!data) return;

    // Handle split view mode
    if (typeof splitViewActive !== 'undefined' && splitViewActive) {
        const state = splitActivePanel === 'left' ? splitViewState.left : splitViewState.right;
        if (state.view === 'world') {
            state.worldId = id;
            if (typeof renderSplitPanelViewContent === 'function') {
                renderSplitPanelViewContent(splitActivePanel);
            }
            if (typeof saveSplitViewState === 'function') {
                saveSplitViewState();
            }
            return;
        }
    }

    const editorView = document.getElementById('editorView');
    if (!editorView) return;

    editorView.innerHTML = `
        <div class="detail-view">
            <div class="detail-header">
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <div class="detail-title">${data.element.name}</div>
                    <span style="font-size: 0.9rem; padding: 0.5rem 1rem; background: var(--accent-gold); color: var(--bg-primary); border-radius: 2px;">${Localization.t(WORLD_TYPE_I18N[data.element.type] || 'world.type.other')}</span>
                </div>
                <div style="display: flex; gap: 0.5rem;">
                    <button class="btn btn-small" onclick="showReferencesForElement('${id}')"><i data-lucide="link" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i>${Localization.t('world.action.view_refs')}</button>
                    <button class="btn" onclick="switchView('editor')"><i data-lucide="arrow-left" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i> ${Localization.t('world.action.back_editor')}</button>
                </div>
            </div>
            
            ${renderLinkedScenesFragment(data.linkedScenes)}
            
            <div class="detail-section">
                <div class="detail-section-title">${Localization.t('world.section.base_info')}</div>
                <div class="detail-field">
                    <div class="detail-label">${Localization.t('world.field.name')}</div>
                    <input type="text" class="form-input" value="${data.element.name}" 
                           onchange="handleUpdateWorldField('${id}', 'name', this.value)">
                </div>
            </div>

            <div class="detail-section">
                <div class="detail-section-title">${Localization.t('world.section.type')}</div>
                <select class="form-input" onchange="handleUpdateWorldField('${id}', 'type', this.value)">
                    <option value="Lieu" ${data.element.type === 'Lieu' ? 'selected' : ''}>${Localization.t('world.type.place')}</option>
                    <option value="Objet" ${data.element.type === 'Objet' ? 'selected' : ''}>${Localization.t('world.type.object')}</option>
                    <option value="Concept" ${data.element.type === 'Concept' ? 'selected' : ''}>${Localization.t('world.type.concept')}</option>
                    <option value="Organisation" ${data.element.type === 'Organisation' ? 'selected' : ''}>${Localization.t('world.type.organization')}</option>
                    <option value="Événement" ${data.element.type === 'Événement' || data.element.type === 'événement' ? 'selected' : ''}>${Localization.t('world.type.event')}</option>
                </select>
            </div>

            <div class="detail-section">
                <div class="detail-section-title">${Localization.t('world.section.description')}</div>
                <textarea class="form-input" rows="6" 
                          onchange="handleUpdateWorldField('${id}', 'description', this.value)">${data.element.description}</textarea>
            </div>

            <div class="detail-section">
                <div class="detail-section-title">${Localization.t('world.section.details')}</div>
                <textarea class="form-input" rows="6" 
                          onchange="handleUpdateWorldField('${id}', 'details', this.value)">${data.element.details}</textarea>
            </div>

            <div class="detail-section">
                <div class="detail-section-title">${Localization.t('world.section.history')}</div>
                <textarea class="form-input" rows="6" 
                          onchange="handleUpdateWorldField('${id}', 'history', this.value)">${data.element.history}</textarea>
            </div>

            <div class="detail-section">
                <div class="detail-section-title">${Localization.t('world.section.notes')}</div>
                <textarea class="form-input" rows="4" 
                          onchange="handleUpdateWorldField('${id}', 'notes', this.value)">${data.element.notes}</textarea>
            </div>
        </div>
    `;

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

/**
 * Renders the linked scenes section.
 */
function renderLinkedScenesFragment(linkedScenes) {
    if (!linkedScenes || linkedScenes.length === 0) return '';

    return `
        <div class="detail-section">
            <div class="detail-section-title"><i data-lucide="file-text" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i>${Localization.t('world.section.linked_scenes', linkedScenes.length)}</div>
            <div class="quick-links">
                ${linkedScenes.map(scene => `
                    <span class="link-badge" onclick="openScene('${scene.actId}', '${scene.chapterId}', '${scene.sceneId}')" title="${scene.actTitle} - ${scene.chapterTitle}">
                        ${scene.breadcrumb}
                    </span>
                `).join('')}
            </div>
        </div>
    `;
}

/**
 * Handles field updates from the UI.
 */
function handleUpdateWorldField(id, field, value) {
    const result = updateWorldFieldViewModel(id, field, value);
    if (result.success) {
        if (result.sideEffects.shouldSave && typeof saveProject === 'function') {
            saveProject();
        }
        if (result.sideEffects.shouldRefreshList) {
            renderWorldList();
        }
    }
}

// Map original function name to keep compatibility with other modules if needed
// or if the UI expects the old function name.
function addWorldElement() { handleAddWorldElement(); }
function updateWorldField(id, field, value) { handleUpdateWorldField(id, field, value); }
function deleteWorldElement(id) { handleDeleteWorldElement(id); }
// renderElementLinkedScenes is now internal to openWorldDetail via renderLinkedScenesFragment
