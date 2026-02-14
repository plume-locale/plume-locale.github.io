/**
 * [MVVM : Codex View]
 * Gestion de l'affichage et des interactions DOM pour le Codex.
 */

const CodexView = {
    /**
     * Affiche la liste des entrées du codex dans la barre latérale.
     */
    renderList() {
        const container = document.getElementById('codexList');
        if (!container) return;

        // Récupérer les données via le ViewModel ou Repository
        // Ici on utilise le Repository car c'est de la lecture pure pour affichage
        if (CodexRepository.count() === 0) {
            container.innerHTML = `<div style="padding: 1rem; text-align: center; color: var(--text-muted); font-size: 0.85rem;">${Localization.t('codex.list.empty')}</div>`;
            return;
        }

        const groups = CodexRepository.groupByCategory();
        const collapsedState = JSON.parse(localStorage.getItem('plume_treeview_collapsed') || '{}');

        let html = '';
        Object.keys(groups).sort().forEach(category => {
            const groupKey = 'codex_' + category;
            const isCollapsed = collapsedState[groupKey] === true;

            // Sort entries alphabetically within each group
            const sortedEntries = [...groups[category]].sort((a, b) => {
                return (a.title || '').toLowerCase().localeCompare((b.title || '').toLowerCase(), 'fr');
            });

            html += `
                <div class="treeview-group">
                    <div class="treeview-header" onclick="toggleCodexGroup('${groupKey}')">
                        <i data-lucide="${isCollapsed ? 'chevron-right' : 'chevron-down'}" class="treeview-chevron"></i>
                        <span class="treeview-label">${Localization.t('codex.category.' + category)}</span>
                        <span class="treeview-count">${groups[category].length}</span>
                    </div>
                    <div class="treeview-children ${isCollapsed ? 'collapsed' : ''}">
                        ${sortedEntries.map(entry => {
                const iconName = getCodexCategoryIcon(category);
                return `
                                <div class="treeview-item" onclick="openCodexDetail('${entry.id}')">
                                    <span class="treeview-item-icon"><i data-lucide="${iconName}" style="width:14px;height:14px;vertical-align:middle;"></i></span>
                                    <span class="treeview-item-label">${entry.title}</span>
                                    <div class="treeview-item-actions">
                                        <button class="treeview-action-btn" onclick="event.stopPropagation(); openCodexDetail('${entry.id}', { forceNew: true })" title="${Localization.t('tabs.open_new')}"><i data-lucide="plus-square" style="width:12px;height:12px;"></i></button>
                                        <button class="treeview-action-btn" onclick="event.stopPropagation(); openCodexDetail('${entry.id}', { replaceCurrent: true })" title="${Localization.t('tabs.replace')}"><i data-lucide="maximize-2" style="width:12px;height:12px;"></i></button>
                                        <button class="treeview-action-btn delete" onclick="event.stopPropagation(); deleteCodexEntry('${entry.id}')" title="${Localization.t('codex.action.delete')}">×</button>
                                    </div>
                                </div>
                            `;
            }).join('')}
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    },

    /**
     * Ouvre la modale d'ajout d'entrée.
     */
    openAddModal() {
        const modal = document.getElementById('addCodexModal');
        if (modal) {
            modal.classList.add('active');
            setTimeout(() => {
                const input = document.getElementById('codexTitleInput');
                if (input) input.focus();
            }, 100);
        }
    },

    /**
     * Affiche le détail d'une entrée dans l'éditeur.
     */
    openDetail(id, options = {}) {
        const entry = CodexViewModel.getDetail(id);
        if (!entry) return;

        // Handle tabs system (Preferred)
        if (typeof openTab === 'function') {
            openTab('codex', { codexId: id }, options);
            return;
        }

        // Handle split view mode (Legacy)
        if (typeof splitViewActive !== 'undefined' && splitViewActive) {
            // ... handled by splitview system if needed
        }

        const editorView = document.getElementById('editorView');
        if (!editorView) return;

        // Générer les options de catégorie
        const categories = getCodexCategories();
        const catIcon = getCodexCategoryIcon(entry.category);
        const categoryOptions = categories.map(cat =>
            `<option value="${cat}" ${entry.category === cat ? 'selected' : ''}>${Localization.t('codex.category.' + cat)}</option>`
        ).join('');

        editorView.innerHTML = `
            <div class="detail-view">
                <div class="detail-header" style="display:flex; align-items:center; justify-content:space-between; gap:1rem;">
                    <div style="display: flex; align-items: center; gap: 1rem; flex: 1;">
                        <div style="width:42px; height:42px; border-radius:10px; background:var(--accent-gold); display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                            <i data-lucide="${catIcon}" style="width:20px;height:20px;color:var(--bg-primary);"></i>
                        </div>
                        <input type="text" class="form-input" value="${entry.title}"
                               style="font-size: 1.6rem; font-weight: 600; font-family: 'Noto Serif JP', serif; padding: 0.5rem; border:none; background:transparent;"
                               onchange="updateCodexField('${id}', 'title', this.value)"
                               placeholder="${Localization.t('codex.detail.placeholder.title')}">
                        <span style="font-size: 0.75rem; padding: 0.35rem 0.75rem; background: var(--accent-gold); color: var(--bg-primary); border-radius: 12px; font-weight:600; white-space:nowrap;">${Localization.t('codex.category.' + entry.category)}</span>
                    </div>
                    <div style="display:flex; gap:0.5rem;">
                        <button class="btn btn-small" onclick="showReferencesForElement('${id}')"><i data-lucide="link" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i>${Localization.t('codex.refs.manage_links')}</button>
                        <button class="btn" onclick="switchView('editor')"><i data-lucide="arrow-left" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i>${Localization.t('codex.detail.btn.back_editor')}</button>
                    </div>
                </div>

                <div class="detail-section">
                    <div class="detail-section-title"><i data-lucide="tag" style="width:16px;height:16px;vertical-align:middle;margin-right:6px;"></i>${Localization.t('codex.detail.category')}</div>
                    <select class="form-input" onchange="updateCodexField('${id}', 'category', this.value)" style="width:100%;">
                        ${categoryOptions}
                    </select>
                </div>

                <div class="detail-section">
                    <div class="detail-section-title"><i data-lucide="file-text" style="width:16px;height:16px;vertical-align:middle;margin-right:6px;"></i>${Localization.t('codex.detail.summary')}</div>
                    <textarea class="form-input" rows="4" style="width:100%; resize:vertical; line-height:1.6;"
                               oninput="updateCodexField('${id}', 'summary', this.value)">${entry.summary || ''}</textarea>
                </div>

                <div class="detail-section">
                    <div class="detail-section-title"><i data-lucide="book-open" style="width:16px;height:16px;vertical-align:middle;margin-right:6px;"></i>${Localization.t('codex.detail.content')}</div>
                    <textarea class="form-input" rows="20" style="width:100%; resize:vertical; line-height:1.7; font-size:1rem;"
                              oninput="updateCodexField('${id}', 'content', this.value)">${entry.content || ''}</textarea>
                </div>
            </div>
        `;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    },

    /**
     * Affiche la modale des références pour un personnage.
     */
    showReferencesForCharacter(characterId) {
        // Obtenir le personnage (direct du Model global ou repository Characters si dispo)
        const character = project.characters ? project.characters.find(c => c.id === characterId) : null;
        if (!character) return;

        const scenes = CodexViewModel.findScenesWithCharacter(characterId);

        const modalTitle = document.getElementById('referencesModalTitle');
        const modalContent = document.getElementById('referencesModalContent');
        const modal = document.getElementById('referencesModal');

        if (modalTitle) modalTitle.textContent = Localization.t('codex.refs.title', [character.name]);
        if (modalContent) {
            modalContent.innerHTML = `
                <div class="references-section">
                    <div class="references-title"><i data-lucide="file-text" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i>${Localization.t('codex.refs.scenes_count', [character.name, scenes.length])}</div>
                    ${scenes.length > 0 ? scenes.map(scene => `
                        <div class="reference-item" onclick="openScene(${scene.actId}, ${scene.chapterId}, ${scene.sceneId}); closeModal('referencesModal');">
                            <div>
                                <div style="font-weight: 600;">${scene.sceneTitle}</div>
                                <div style="font-size: 0.8rem; color: var(--text-muted);">${scene.actTitle} > ${scene.chapterTitle}</div>
                            </div>
                            <span>→</span>
                        </div>
                    `).join('') : `<div style="padding: 1rem; color: var(--text-muted);">${Localization.t('codex.refs.no_scenes')}</div>`}
                </div>

                <div class="references-section">
                    <div class="references-title"><i data-lucide="link" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i>${Localization.t('codex.refs.manage_links')}</div>
                    <button class="btn btn-small" onclick="openLinkManagerForCharacter('${characterId}')">${Localization.t('codex.refs.btn.link')}</button>
                </div>
            `;
        }

        if (modal) {
            modal.classList.add('active');
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }
    },

    /**
     * Affiche la modale des références pour un élément.
     */
    showReferencesForElement(elementId) {
        const element = project.world ? project.world.find(e => e.id === elementId) : null;
        if (!element) return;

        const scenes = CodexViewModel.findScenesWithElement(elementId);

        const modalTitle = document.getElementById('referencesModalTitle');
        const modalContent = document.getElementById('referencesModalContent');
        const modal = document.getElementById('referencesModal');

        if (modalTitle) modalTitle.textContent = Localization.t('codex.refs.title', [element.name]);
        if (modalContent) {
            modalContent.innerHTML = `
                <div class="references-section">
                    <div class="references-title"><i data-lucide="file-text" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i>${Localization.t('codex.refs.scenes_count', [element.name, scenes.length])}</div>
                    ${scenes.length > 0 ? scenes.map(scene => `
                        <div class="reference-item" onclick="openScene(${scene.actId}, ${scene.chapterId}, ${scene.sceneId}); closeModal('referencesModal');">
                            <div>
                                <div style="font-weight: 600;">${scene.sceneTitle}</div>
                                <div style="font-size: 0.8rem; color: var(--text-muted);">${scene.actTitle} > ${scene.chapterTitle}</div>
                            </div>
                            <span>→</span>
                        </div>
                    `).join('') : `<div style="padding: 1rem; color: var(--text-muted);">${Localization.t('codex.refs.no_scenes')}</div>`}
                </div>

                <div class="references-section">
                    <div class="references-title"><i data-lucide="link" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i>${Localization.t('codex.refs.manage_links')}</div>
                    <button class="btn btn-small" onclick="openLinkManagerForElement('${elementId}')">${Localization.t('codex.refs.btn.link')}</button>
                </div>
            `;
        }

        if (modal) {
            modal.classList.add('active');
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }
    },

    /**
     * Rafraîchit spécifiquement le panneau des liens (utilisé après linkage).
     */
    refreshLinksPanel() {
        if (typeof window.refreshLinksPanel === 'function') {
            window.refreshLinksPanel();
        }
    }
};

// ============================================
// Global Controllers / Event Handlers
// ============================================

function openAddCodexModal() {
    CodexView.openAddModal();
}

function addCodexEntry() {
    const title = document.getElementById('codexTitleInput')?.value;
    const category = document.getElementById('codexCategoryInput')?.value;
    const summary = document.getElementById('codexSummaryInput')?.value;

    const result = CodexViewModel.addEntry(title, category, summary);

    if (result.success) {
        // Clear inputs
        if (document.getElementById('codexTitleInput')) document.getElementById('codexTitleInput').value = '';
        if (document.getElementById('codexSummaryInput')) document.getElementById('codexSummaryInput').value = '';

        closeModal('addCodexModal');
    } else {
        alert(result.error || Localization.t('codex.error.add'));
    }
}

function deleteCodexEntry(id) {
    if (!confirm(Localization.t('codex.confirm.delete'))) return;
    CodexViewModel.deleteEntry(id);
}

function renderCodexList() {
    CodexView.renderList();
}

function openCodexDetail(id, options = {}) {
    CodexView.openDetail(id, options);
}

function updateCodexField(id, field, value) {
    CodexViewModel.updateField(id, field, value);
}

function showReferencesForCharacter(characterId) {
    CodexView.showReferencesForCharacter(characterId);
}

function showReferencesForElement(elementId) {
    CodexView.showReferencesForElement(elementId);
}

function toggleCodexGroup(groupKey) {
    const collapsedState = JSON.parse(localStorage.getItem('plume_treeview_collapsed') || '{}');
    collapsedState[groupKey] = !collapsedState[groupKey];
    localStorage.setItem('plume_treeview_collapsed', JSON.stringify(collapsedState));
    CodexView.renderList();
}

function toggleCharacterInScene(sceneActId, sceneChapterId, sceneId, characterId) {
    const result = CodexViewModel.toggleCharacterInScene(sceneActId, sceneChapterId, sceneId, characterId);
    if (result) {
        CodexView.refreshLinksPanel();
    }
}

function toggleElementInScene(sceneActId, sceneChapterId, sceneId, elementId) {
    const result = CodexViewModel.toggleElementInScene(sceneActId, sceneChapterId, sceneId, elementId);
    if (result && result.hasChanged) {
        CodexView.refreshLinksPanel();
    }
}

// Stubs for missing link managers if they don't exist
if (typeof openLinkManagerForCharacter === 'undefined') {
    window.openLinkManagerForCharacter = function (id) {
        console.warn("openLinkManagerForCharacter non implémenté. Utilisez le lien depuis la scène.");
        alert(Localization.t('codex.info.not_available'));
    };
}

if (typeof openLinkManagerForElement === 'undefined') {
    window.openLinkManagerForElement = function (id) {
        console.warn("openLinkManagerForElement non implémenté.");
        alert(Localization.t('codex.info.not_available'));
    };
}

// Global helpers for inter-module compatibility
window.findScenesWithCharacter = function (characterId) {
    return CodexViewModel.findScenesWithCharacter(characterId);
};

window.findScenesWithElement = function (elementId) {
    return CodexViewModel.findScenesWithElement(elementId);
};

// Generic treeview toggler buffer if not defined elsewhere (Compatibility Layer)
if (typeof window.toggleTreeviewGroup === 'undefined') {
    window.toggleTreeviewGroup = function (groupKey) {
        const collapsedState = JSON.parse(localStorage.getItem('plume_treeview_collapsed') || '{}');
        collapsedState[groupKey] = !collapsedState[groupKey];
        localStorage.setItem('plume_treeview_collapsed', JSON.stringify(collapsedState));

        // Router for re-rendering
        if (groupKey.startsWith('codex_')) CodexView.renderList();
        else if (groupKey.startsWith('chars_') && typeof renderCharactersList === 'function') renderCharactersList();
        else if (groupKey.startsWith('world_') && typeof renderWorldList === 'function') renderWorldList();
    };
}
