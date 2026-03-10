/**
 * Renders the detail view using ATLAS SCHEMA either in split view or normal view.
 */
function _renderCodexDetailInContainer(entry, container, codexId) {
    const catKey = entry.category || 'Culture';
    const schemaCat = (window.ATLAS_SCHEMA && window.ATLAS_SCHEMA.CODEX.categories[catKey]) ?
        window.ATLAS_SCHEMA.CODEX.categories[catKey] :
        { icon: 'book', color: '#3b82f6', tabs: [] };

    const typeIcon = schemaCat.icon || 'book';
    const typeColor = schemaCat.color || 'var(--accent-gold)';

    // Génération dynamique des sections à partir des Common Fields
    let commonHtml = '';
    if (window.COMMON_FIELDS) {
        window.COMMON_FIELDS.forEach(f => {
            if (f.id === 'nom' || f.id === 'resume_court' || f.id === 'statut_de_developpement' || f.id === 'image_illustration') return; // Rendus séparément ou différemment

            const val = entry.fields ? (entry.fields[f.id] || '') : '';
            let inputHtml = '';

            if (f.type === 'textarea' || f.type === 'textarea-sm') {
                const rows = f.type === 'textarea-sm' ? 3 : 6;
                inputHtml = `<textarea class="form-input" rows="${rows}" style="width:100%; resize:vertical; line-height:1.6;" oninput="updateCodexField('${codexId}', '${f.id}', this.value)">${val}</textarea>`;
            } else if (f.type === 'select') {
                inputHtml = `<select class="form-input" style="width:100%" onchange="updateCodexField('${codexId}', '${f.id}', this.value)">
                    <option value="">--</option>
                    ${f.options.map(opt => `<option value="${opt}" ${val === opt ? 'selected' : ''}>${opt}</option>`).join('')}
                </select>`;
            } else {
                inputHtml = `<input type="text" class="form-input" style="width:100%" value="${val}" onchange="updateCodexField('${codexId}', '${f.id}', this.value)">`;
            }

            const noteHtml = f.note ? `<div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.25rem;">${f.note}</div>` : '';
            commonHtml += `
            <div class="detail-section">
                <div class="detail-section-title">${f.name}</div>
                ${inputHtml}
                ${noteHtml}
            </div>`;
        });
    }

    // Génération dynamique des onglets/sections à partir du schéma
    let sectionsHtml = '';
    if (schemaCat.tabs) {
        schemaCat.tabs.forEach((tab, index) => {
            let fieldsHtml = '';
            tab.fields.forEach(f => {
                const val = entry.fields ? (entry.fields[f.id] || '') : '';
                let inputHtml = '';

                if (f.type === 'textarea' || f.type === 'textarea-sm') {
                    const rows = f.type === 'textarea-sm' ? 3 : 6;
                    inputHtml = `<textarea class="form-input" rows="${rows}" style="width:100%; resize:vertical; line-height:1.6;" oninput="updateCodexField('${codexId}', '${f.id}', this.value)">${val}</textarea>`;
                } else if (f.type === 'select') {
                    inputHtml = `<select class="form-input" style="width:100%" onchange="updateCodexField('${codexId}', '${f.id}', this.value)">
                        <option value="">--</option>
                        ${f.options ? f.options.map(opt => `<option value="${opt}" ${val === opt ? 'selected' : ''}>${opt}</option>`).join('') : ''}
                    </select>`;
                } else if (f.type === 'relation') {
                    const opts = window.getAtlasRelationOptions ? window.getAtlasRelationOptions(f.target) : [];
                    inputHtml = `<select class="form-input" style="width:100%" onchange="updateCodexField('${codexId}', '${f.id}', this.value)">
                        <option value="">-- Aucun --</option>
                        ${opts.map(o => `<option value="${o.id}" ${val == o.id ? 'selected' : ''}>${o.label} ${o.sub ? `(${o.sub})` : ''}</option>`).join('')}
                    </select>`;
                } else if (f.type === 'relation-multi') {
                    const opts = window.getAtlasRelationOptions ? window.getAtlasRelationOptions(f.target) : [];
                    let currentVals = Array.isArray(val) ? val : (val ? val.split(',').map(v => v.trim()) : []);
                    inputHtml = `<div class="relation-multi-container form-input" style="max-height: 150px; overflow-y: auto; padding: 0.5rem; background: var(--bg-primary);">
                        ${opts.length === 0 ? `<div style="color:var(--text-muted); font-size:0.85em;">Aucun élément trouvé (Cible: ${f.target})</div>` : ''}
                        ${opts.map(o => {
                        const isChecked = currentVals.includes(String(o.id));
                        return `<label style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.25rem; font-size:0.9em; cursor:pointer;">
                                        <input type="checkbox" value="${o.id}" ${isChecked ? 'checked' : ''} onchange="
                                            const container = this.closest('.relation-multi-container'); 
                                            const checked = Array.from(container.querySelectorAll('input:checked')).map(cb => cb.value); 
                                            updateCodexField('${codexId}', '${f.id}', checked);
                                        ">
                                        ${o.label} ${o.sub ? `<span style="color:var(--text-muted); font-size:0.8em;">(${o.sub})</span>` : ''}
                                    </label>`;
                    }).join('')}
                    </div>`;
                } else {
                    inputHtml = `<input type="text" class="form-input" style="width:100%" placeholder="" value="${val}" onchange="updateCodexField('${codexId}', '${f.id}', this.value)">`;
                }

                const noteHtml = f.note ? `<div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.25rem;">${f.note}</div>` : '';
                const titleHtml = `<div class="detail-section-title" style="margin-bottom:0.5rem; font-weight:600;">${f.name} ${f.required ? '<span style="color:var(--text-danger)">*</span>' : ''}</div>`;

                fieldsHtml += `
                <div class="detail-section" style="margin-bottom:1.5rem;">
                    ${titleHtml}
                    ${inputHtml}
                    ${noteHtml}
                </div>`;
            });

            sectionsHtml += `
                <div class="schema-tab-section" style="margin-top: 2rem; border: 1px solid var(--border-color); border-radius: 8px; padding: 1.5rem; background: var(--bg-secondary);">
                    <h3 style="margin-top: 0; margin-bottom: 1.5rem; color: ${typeColor}; border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem; font-family: 'Noto Serif JP', serif;">${tab.label}</h3>
                    <div style="display: flex; flex-direction: column;">
                        ${fieldsHtml}
                    </div>
                </div>
            `;
        });
    }

    // Le header avec le Nom et le Résumé court (champs majeurs du COMMON_FIELDS)
    const nomVal = entry.fields && entry.fields.nom ? entry.fields.nom : entry.title;
    const descVal = entry.fields && entry.fields.resume_court ? entry.fields.resume_court : (entry.summary || '');

    // Categories select
    const allCategories = window.ATLAS_SCHEMA ? Object.keys(window.ATLAS_SCHEMA.CODEX.categories) : ['Culture', 'Histoire', 'Technologie', 'Géographie', 'Politique', 'Magie/Pouvoir', 'Religion', 'Société', 'Autre'];
    const catSelectOptions = allCategories.map(cat => `<option value="${cat}" ${catKey === cat ? 'selected' : ''}>${Localization.t(CODEX_TYPE_I18N[cat] || 'codex.category.Autre')}</option>`).join('');

    const incomingLinks = window.getIncomingRelations ? window.getIncomingRelations(codexId) : [];
    let incomingHtml = '';
    if (incomingLinks.length > 0) {
        incomingHtml = `
        <h2 style="font-size:1.2rem; margin-top:2rem; margin-bottom: 1rem; border-bottom:2px solid var(--border-color); padding-bottom:0.5rem; font-family: 'Noto Serif JP', serif;"><i data-lucide="link" style="width:16px;height:16px;vertical-align:middle;margin-right:6px;"></i>Liens entrants (Références)</h2>
        <div style="display:flex; flex-direction:column; gap:0.5rem; margin-bottom:2rem;">
            ${incomingLinks.map(link => `
                <div class="reference-item" style="display:flex; align-items:center; gap:0.5rem; padding:0.5rem; background:var(--bg-secondary); border-radius:4px; cursor:pointer; border: 1px solid var(--border-color);" onclick="${link.sourceSection === 'codex' ? `openCodexDetail('${link.id}')` : `openWorldDetail('${link.id}')`}">
                    <i data-lucide="${link.icon}" style="width:14px;height:14px;color:var(--text-muted);"></i>
                    <span style="font-weight:600;">${link.label}</span>
                    <span style="color:var(--text-muted); font-size:0.8em; margin-left:auto;">(${link.fieldKey})</span>
                </div>
            `).join('')}
        </div>
        `;
    }

    container.innerHTML = `
        <div class="detail-view" style="height:100%; overflow-y:auto; padding-bottom: 3rem;">
            <div class="detail-header" style="position:sticky; top:0; background:var(--bg-primary); z-index:10; padding:1rem; border-bottom:1px solid var(--border-color); display:flex; align-items:center; justify-content:space-between; gap:1rem;">
                <div style="display: flex; align-items: center; gap: 1rem; flex: 1;">
                    <div style="width:42px; height:42px; border-radius:10px; background:${typeColor}; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                        <i data-lucide="${typeIcon}" style="width:20px;height:20px;color:var(--bg-primary);"></i>
                    </div>
                    <div style="flex:1;">
                        <input type="text" class="form-input" value="${nomVal}"
                               style="font-size: 1.5rem; font-weight: 600; font-family: 'Noto Serif JP', serif; width:100%; padding: 0; border:none; background:transparent; margin-bottom: 4px;"
                               onchange="updateCodexField('${codexId}', 'nom', this.value)"
                               placeholder="${Localization.t('codex.detail.placeholder.title')}">
                        <select class="form-input" onchange="updateCodexField('${codexId}', 'category', this.value)" style="font-size: 0.8rem; padding: 0.1rem 0.6rem; background: var(--bg-secondary); color: var(--text-primary); border-radius: 12px; border: 1px solid var(--border-color); display:inline-block; width:auto; margin-bottom: 8px;">
                            ${catSelectOptions}
                        </select>
                        <div style="font-size: 0.75rem; color: var(--text-muted); line-height: 1.3; background: var(--bg-primary); padding: 8px 12px; border-radius: 8px; border-left: 3px solid ${typeColor}; border: 1px solid var(--border-color); max-width: 500px;">
                            <i data-lucide="info" style="width:12px;height:12px;vertical-align:middle;margin-right:4px;"></i>
                            ${Localization.t((CODEX_TYPE_I18N[catKey] || 'codex.category.Autre') + '.desc')}
                        </div>
                    </div>
                </div>
                <div style="display:flex; gap:0.5rem;">
                    <button class="btn btn-small" onclick="showReferencesForElement('${codexId}')"><i data-lucide="link" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i>${Localization.t('codex.refs.manage_links')}</button>
                    ${container.id === 'editorView' ? `<button class="btn" onclick="switchView('editor')"><i data-lucide="arrow-left" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i>${Localization.t('codex.detail.btn.back_editor')}</button>` : ''}
                </div>
            </div>

            <div style="padding: 1.5rem;">
                <!-- Résumé = Champ commun prioritaire -->
                <div class="detail-section" style="margin-bottom: 2rem;">
                    <div class="detail-section-title"><i data-lucide="align-left" style="width:16px;height:16px;vertical-align:middle;margin-right:6px;"></i>Résumé court</div>
                    <textarea class="form-input" rows="3" style="width:100%; resize:vertical; line-height:1.7;"
                               oninput="updateCodexField('${codexId}', 'resume_court', this.value)">${descVal}</textarea>
                </div>

                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1.5rem; margin-bottom: 2rem;">
                    ${commonHtml}
                </div>

                <!-- Sections spécifiques au Schéma de la catégorie -->
                <h2 style="font-size:1.2rem; margin-top:2rem; margin-bottom: 1rem; border-bottom:2px solid var(--border-color); padding-bottom:0.5rem; font-family: 'Noto Serif JP', serif;">Données Spécifiques (${catKey})</h2>
                ${sectionsHtml}
                
                ${incomingHtml}
            </div>
        </div>
    `;
    if (typeof lucide !== 'undefined') lucide.createIcons({ root: container });
}

// -------------------------------------------------------------
// Mapping des types Codex vers leurs clés i18n
// -------------------------------------------------------------
const CODEX_TYPE_I18N = {
    "Magie & Pouvoirs": "codex.category.Magie",
    "Sciences & Technologie": "codex.category.Technologie",
    "Religions & Cultes": "codex.category.Religion",
    "Philosophies & Idéologies": "codex.category.Philosophie",
    "Mythes & Légendes": "codex.category.Mythes",
    "Politique & Géopolitique": "codex.category.Politique",
    "Lois & Justice": "codex.category.Lois",
    "Économie & Commerce": "codex.category.Économie",
    "Systèmes Sociaux & Castes": "codex.category.Société",
    "Factions & Organisations": "codex.category.Factions",
    "Linguistique & Grammaire": "codex.category.Linguistique",
    "Cosmologie & Métaphysique": "codex.category.Cosmologie",
    "Glossaire & Terminologie": "codex.category.Glossaire",
    "Magie/Pouvoir": "codex.category.Magie/Pouvoir",
    "Autre": "codex.category.Autre"
};

const CODEX_TYPE_ICONS = {
    "Magie & Pouvoirs": "sparkles",
    "Sciences & Technologie": "flask-conical",
    "Religions & Cultes": "sun",
    "Philosophies & Idéologies": "lightbulb",
    "Mythes & Légendes": "book-open",
    "Politique & Géopolitique": "landmark",
    "Lois & Justice": "scale",
    "Économie & Commerce": "coins",
    "Systèmes Sociaux & Castes": "users",
    "Factions & Organisations": "swords",
    "Linguistique & Grammaire": "message-square",
    "Cosmologie & Métaphysique": "moon",
    "Glossaire & Terminologie": "file-text",
    "Autre": "book"
};

function getCodexCategoryIcon(category) {
    if (CODEX_TYPE_ICONS[category]) return CODEX_TYPE_ICONS[category];
    // Fallback for old simple categories
    const oldIconMap = {
        'Magie': 'sparkles',
        'Technologie': 'flask-conical',
        'Religion': 'sun',
        'Philosophie': 'lightbulb',
        'Mythes': 'book-open',
        'Politique': 'landmark',
        'Lois': 'scale',
        'Économie': 'coins',
        'Société': 'users',
        'Factions': 'swords',
        'Linguistique': 'message-square',
        'Cosmologie': 'moon',
        'Glossaire': 'file-text'
    };
    return oldIconMap[category] || 'book';
}

// Support pour le splitview : exposer globalement la fonction d'injection
window.renderCodexDetailInContainer = function (entry, container) {
    if (entry) _renderCodexDetailInContainer(entry, container, entry.id);
};

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

            // Sort entries alphabetically within each group using fields.nom
            const sortedEntries = [...groups[category]].sort((a, b) => {
                const nameA = (a.fields && a.fields.nom) ? a.fields.nom : (a.title || '');
                const nameB = (b.fields && b.fields.nom) ? b.fields.nom : (b.title || '');
                return nameA.toLowerCase().localeCompare(nameB.toLowerCase(), 'fr');
            });

            html += `
                <div class="treeview-group">
                    <div class="treeview-header" onclick="toggleCodexGroup('${groupKey}')">
                        <i data-lucide="${isCollapsed ? 'chevron-right' : 'chevron-down'}" class="treeview-chevron"></i>
                        <span class="treeview-label">${Localization.t(CODEX_TYPE_I18N[category] || 'codex.category.Autre')}</span>
                        <span class="treeview-count">${groups[category].length}</span>
                    </div>
                    <div class="treeview-children ${isCollapsed ? 'collapsed' : ''}">
                        ${sortedEntries.map(entry => {
                const iconName = getCodexCategoryIcon(category);
                return `
                                <div class="treeview-item" onclick="openCodexDetail('${entry.id}')">
                                    <span class="treeview-item-icon"><i data-lucide="${iconName}" style="width:14px;height:14px;vertical-align:middle;"></i></span>
                                    <span class="treeview-item-label">${entry.fields && entry.fields.nom ? entry.fields.nom : entry.title}</span>
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
            updateCodexModalHint(); // Initial hint
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

        const editorView = document.getElementById('editorView');
        if (!editorView) return;

        _renderCodexDetailInContainer(entry, editorView, id);
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

        const name = (element.fields && element.fields.nom) ? element.fields.nom : (element.name || '');
        if (modalTitle) modalTitle.textContent = Localization.t('codex.refs.title', [name]);
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
    if (field === 'category') {
        setTimeout(() => openCodexDetail(id), 10);
    }
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
/**
 * Updates the hint text in the Add Codex Entry modal based on the selected category.
 */
window.updateCodexModalHint = function () {
    const select = document.getElementById('codexCategoryInput');
    const hint = document.getElementById('codexCategoryHint');
    if (!select || !hint) return;

    const val = select.value;
    const i18nKey = CODEX_TYPE_I18N[val] || 'codex.category.Autre';
    const desc = Localization.t(i18nKey + '.desc');

    if (desc && desc !== (i18nKey + '.desc')) {
        hint.textContent = desc;
        hint.style.display = 'block';
    } else {
        hint.style.display = 'none';
    }
};
