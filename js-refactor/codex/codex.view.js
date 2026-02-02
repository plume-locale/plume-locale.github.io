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
            container.innerHTML = '<div style="padding: 1rem; text-align: center; color: var(--text-muted); font-size: 0.85rem;">Aucune entrée</div>';
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
                        <span class="treeview-label">${category}</span>
                        <span class="treeview-count">${groups[category].length}</span>
                    </div>
                    <div class="treeview-children ${isCollapsed ? 'collapsed' : ''}">
                        ${sortedEntries.map(entry => {
                const iconName = getCodexCategoryIcon(category);
                return `
                                <div class="treeview-item" onclick="openCodexDetail(${entry.id})">
                                    <span class="treeview-item-icon"><i data-lucide="${iconName}" style="width:14px;height:14px;vertical-align:middle;"></i></span>
                                    <span class="treeview-item-label">${entry.title}</span>
                                    <button class="treeview-item-delete" onclick="event.stopPropagation(); deleteCodexEntry(${entry.id})" title="Supprimer">×</button>
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
    openDetail(id) {
        const entry = CodexViewModel.getDetail(id);
        if (!entry) return;

        // Handle split view mode
        if (typeof splitViewActive !== 'undefined' && splitViewActive) {
            const state = splitActivePanel === 'left' ? splitViewState.left : splitViewState.right;
            if (state.view === 'codex') {
                state.codexId = id;
                if (typeof renderSplitPanelViewContent === 'function') renderSplitPanelViewContent(splitActivePanel);
                if (typeof saveSplitViewState === 'function') saveSplitViewState();
                return;
            }
        }

        const editorView = document.getElementById('editorView');
        if (!editorView) return;

        // Générer les options de catégorie
        const categories = getCodexCategories();
        const categoryOptions = categories.map(cat =>
            `<option value="${cat}" ${entry.category === cat ? 'selected' : ''}>${cat}</option>`
        ).join('');

        editorView.innerHTML = `
            <div class="detail-view">
                <div class="detail-header">
                    <div style="display: flex; align-items: center; gap: 1rem; flex: 1;">
                        <input type="text" class="form-input" value="${entry.title}" 
                               style="font-size: 1.8rem; font-weight: 600; font-family: 'Noto Serif JP', serif; padding: 0.5rem;"
                               onchange="updateCodexField(${id}, 'title', this.value)"
                               placeholder="Titre de l'entrée">
                        <span style="font-size: 0.8rem; padding: 0.4rem 0.8rem; background: var(--accent-gold); color: var(--bg-primary); border-radius: 2px;">${entry.category}</span>
                    </div>
                    <button class="btn" onclick="switchView('editor')">← Retour à l'éditeur</button>
                </div>
                
                <div class="detail-section">
                    <div class="detail-section-title">Catégorie</div>
                    <select class="form-input" onchange="updateCodexField(${id}, 'category', this.value)">
                        ${categoryOptions}
                    </select>
                </div>

                <div class="detail-section">
                    <div class="detail-section-title">Résumé</div>
                    <textarea class="form-input" rows="3" 
                              onchange="updateCodexField(${id}, 'summary', this.value)">${entry.summary}</textarea>
                </div>

                <div class="detail-section">
                    <div class="detail-section-title">Contenu détaillé</div>
                    <textarea class="form-input" rows="20" 
                              onchange="updateCodexField(${id}, 'content', this.value)">${entry.content}</textarea>
                </div>
            </div>
        `;
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

        if (modalTitle) modalTitle.textContent = `Références : ${character.name}`;
        if (modalContent) {
            modalContent.innerHTML = `
                <div class="references-section">
                    <div class="references-title"><i data-lucide="file-text" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i>Scènes où ${character.name} apparaît (${scenes.length})</div>
                    ${scenes.length > 0 ? scenes.map(scene => `
                        <div class="reference-item" onclick="openScene(${scene.actId}, ${scene.chapterId}, ${scene.sceneId}); closeModal('referencesModal');">
                            <div>
                                <div style="font-weight: 600;">${scene.sceneTitle}</div>
                                <div style="font-size: 0.8rem; color: var(--text-muted);">${scene.actTitle} > ${scene.chapterTitle}</div>
                            </div>
                            <span>→</span>
                        </div>
                    `).join('') : '<div style="padding: 1rem; color: var(--text-muted);">Aucune scène liée</div>'}
                </div>

                <div class="references-section">
                    <div class="references-title"><i data-lucide="link" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i>Gérer les liens</div>
                    <button class="btn btn-small" onclick="openLinkManagerForCharacter(${characterId})">+ Lier à des scènes</button>
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

        if (modalTitle) modalTitle.textContent = `Références : ${element.name}`;
        if (modalContent) {
            modalContent.innerHTML = `
                <div class="references-section">
                    <div class="references-title"><i data-lucide="file-text" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i>Scènes où ${element.name} apparaît (${scenes.length})</div>
                    ${scenes.length > 0 ? scenes.map(scene => `
                        <div class="reference-item" onclick="openScene(${scene.actId}, ${scene.chapterId}, ${scene.sceneId}); closeModal('referencesModal');">
                            <div>
                                <div style="font-weight: 600;">${scene.sceneTitle}</div>
                                <div style="font-size: 0.8rem; color: var(--text-muted);">${scene.actTitle} > ${scene.chapterTitle}</div>
                            </div>
                            <span>→</span>
                        </div>
                    `).join('') : '<div style="padding: 1rem; color: var(--text-muted);">Aucune scène liée</div>'}
                </div>

                <div class="references-section">
                    <div class="references-title"><i data-lucide="link" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i>Gérer les liens</div>
                    <button class="btn btn-small" onclick="openLinkManagerForElement(${elementId})">+ Lier à des scènes</button>
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
        alert(result.error || "Erreur lors de l'ajout");
    }
}

function deleteCodexEntry(id) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette entrée ?')) return;
    CodexViewModel.deleteEntry(id);
}

function renderCodexList() {
    CodexView.renderList();
}

function openCodexDetail(id) {
    CodexView.openDetail(id);
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
        alert("Cette fonctionnalité n'est pas encore disponible. Veuillez utiliser le panneau 'Liens' depuis une scène.");
    };
}

if (typeof openLinkManagerForElement === 'undefined') {
    window.openLinkManagerForElement = function (id) {
        console.warn("openLinkManagerForElement non implémenté.");
        alert("Cette fonctionnalité n'est pas encore disponible. Veuillez utiliser le panneau 'Liens' depuis une scène.");
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
