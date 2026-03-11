/**
 * [MVVM : World View]
 * UI Rendering and DOM interactions for World management.
 */

window.getAtlasRelationOptions = function (target) {
    let options = [];
    if (!target) return options;

    const targets = target.split(',').map(t => t.trim());

    targets.forEach(t => {
        if (t === 'Personnage' || t === 'Personnages') {
            const chars = (window.project && window.project.characters) ? window.project.characters : [];
            options = options.concat(chars.map(c => ({ id: c.id, label: c.name })));
        } else if (t === 'Scène' || t === 'Scènes') {
            if (window.project && window.project.acts) {
                window.project.acts.forEach(act => {
                    (act.chapters || []).forEach(chap => {
                        (chap.scenes || []).forEach(sc => {
                            options.push({ id: sc.id, label: sc.title || 'Scène sans titre', sub: `${act.title} > ${chap.title}` });
                        });
                    });
                });
            }
        } else {
            // Look in world
            const worldItems = (window.project && window.project.world) ? window.project.world : [];
            worldItems.forEach(item => {
                if (item.category === t || item.type === t) {
                    const label = (item.fields && item.fields.nom) ? item.fields.nom : (item.name || 'Sans titre');
                    options.push({ id: item.id, label: label, sub: item.category });
                }
            });

            // Look in codex
            const codexItems = (window.project && window.project.codex) ? window.project.codex : [];
            codexItems.forEach(item => {
                if (item.category === t) {
                    const label = (item.fields && item.fields.nom) ? item.fields.nom : (item.title || 'Sans titre');
                    options.push({ id: item.id, label: label, sub: item.category });
                }
            });
        }
    });

    // Sort alphabetically
    return options.sort((a, b) => (a.label || '').localeCompare(b.label || '', 'fr'));
};

window.getIncomingRelations = function (targetId) {
    let incoming = [];

    const checkFields = (item, sourceSection, sourceIcon) => {
        if (!item.fields) return;
        Object.keys(item.fields).forEach(key => {
            const val = item.fields[key];
            if (val == targetId || (Array.isArray(val) && val.includes(String(targetId)))) {
                let label = (item.fields.nom || item.name || item.title || 'Sans titre');
                incoming.push({
                    id: item.id,
                    label: label,
                    sourceSection: sourceSection,
                    icon: sourceIcon,
                    fieldKey: key
                });
            }
        });
    };

    if (window.project && window.project.world) {
        window.project.world.forEach(item => { if (item.id != targetId) checkFields(item, 'world', '🌍') });
    }
    if (window.project && window.project.codex) {
        window.project.codex.forEach(item => { if (item.id != targetId) checkFields(item, 'codex', 'book') });
    }

    return incoming;
};


const WORLD_TYPE_ICONS = {
    'Géographie': 'map',
    'Lieux & Bâtiments': 'map-pin',
    'Peuples & Ethnies': 'users',
    'Cultures & Traditions': 'globe',
    'Histoire & Chronologie': 'clock',
    'Faune & Flore': 'leaf',
    'Objets & Artefacts': 'package',
    // Fallbacks
    'Lieu': 'map-pin',
    'Peuples': 'users',
    'Lieux': 'map-pin',
    'Cultures': 'globe',
    'Histoire': 'clock',
    'Biologie': 'leaf',
    'Objets': 'package',
    'Culture': 'globe',
    'Cosmologie': 'sun',
    'Objet': 'package',
    'Concept': 'lightbulb',
    'Organisation': 'users',
    'Événement': 'calendar',
    'Autre': 'more-horizontal'
};

/**
 * Mapping des types d'univers vers leurs clés i18n
 */
const WORLD_TYPE_I18N = {
    'Géographie': 'world.type.geography',
    'Lieux & Bâtiments': 'world.type.places',
    'Peuples & Ethnies': 'world.type.peoples',
    'Cultures & Traditions': 'world.type.cultures',
    'Histoire & Chronologie': 'world.type.history',
    'Faune & Flore': 'world.type.biology',
    'Objets & Artefacts': 'world.type.objects',
    // Fallbacks
    'Lieux': 'world.type.places',
    'Peuples': 'world.type.peoples',
    'Cultures': 'world.type.cultures',
    'Histoire': 'world.type.history',
    'Biologie': 'world.type.biology',
    'Objets': 'world.type.objects',
    'Lieu': 'world.type.places',
    'Culture': 'world.type.cultures',
    'Cosmologie': 'world.type.geography',
    'Objet': 'world.type.objects',
    'Concept': 'world.type.cultures',
    'Organisation': 'world.type.peoples',
    'Événement': 'world.type.history',
    'Autre': 'world.type.other'
};

const WORLD_TYPE_DESC = {
    'Géographie': "Continents, océans, climats, biomes. ✗ Pas les villes ni règles météorologiques.",
    'Lieux': "Villes, villages, châteaux, temples, routes. ✗ Pas les organisations qui y siègent.",
    'Peuples': "Races, espèces intelligentes, traits physiques. ✗ Pas leurs croyances ou culture.",
    'Cultures': "Gastronomie, vêtements, arts, fêtes, rites. ✗ Pas les croyances abstraites.",
    'Histoire': "Événements avérés : guerres, fondations. ✗ Pas les mythes incertains.",
    'Biologie': "Faune, flore, monstres, écosystèmes. ✗ Pas les espèces intelligentes.",
    'Objets': "Armes, reliques, véhicules, objets notables. ✗ Pas leur fonctionnement magique."
};

/**
 * Opens the add world modal and sets focus.
 */
function openAddWorldModal() {
    const modal = document.getElementById('addWorldModal');
    if (modal) {
        modal.classList.add('active');
        updateWorldModalHint(); // Initial hint
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
                                <span class="treeview-item-label">${elem.fields && elem.fields.nom ? elem.fields.nom : elem.name}</span>
                                <div class="treeview-item-actions">
                                    <button class="treeview-action-btn" onclick="event.stopPropagation(); openWorldDetail('${elem.id}', { forceNew: true })" title="${Localization.t('tabs.open_new')}"><i data-lucide="plus-square" style="width:12px;height:12px;"></i></button>
                                    <button class="treeview-action-btn" onclick="event.stopPropagation(); openWorldDetail('${elem.id}', { replaceCurrent: true })" title="${Localization.t('tabs.replace')}"><i data-lucide="maximize-2" style="width:12px;height:12px;"></i></button>
                                    <button class="treeview-action-btn delete" onclick="event.stopPropagation(); handleDeleteWorldElement('${elem.id}')" title="${Localization.t('world.action.delete')}"><i data-lucide="x" style="width:12px;height:12px;"></i></button>
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
}

/**
 * Renders the detail view using ATLAS SCHEMA either in split view or normal view.
 */
function _renderWorldDetailInContainer(data, container, elementId) {
    const elem = data.element;
    const catKey = elem.category || 'Géographie';
    const schemaCat = (window.ATLAS_SCHEMA && window.ATLAS_SCHEMA.UNIVERS.categories[catKey]) ?
        window.ATLAS_SCHEMA.UNIVERS.categories[catKey] :
        { icon: '🌍', color: '#52b788', tabs: [] };

    const typeIcon = schemaCat.icon || '🌍';
    const typeColor = schemaCat.color || 'var(--accent-gold)';

    // Génération dynamique des sections à partir des Common Fields
    let commonHtml = '';
    if (window.COMMON_FIELDS) {
        window.COMMON_FIELDS.forEach(f => {
            if (f.id === 'nom' || f.id === 'resume_court' || f.id === 'statut_de_developpement' || f.id === 'image_illustration') return; // Rendus séparément ou différemment

            const val = elem.fields ? (elem.fields[f.id] || '') : '';
            let inputHtml = '';

            if (f.type === 'textarea' || f.type === 'textarea-sm') {
                const rows = f.type === 'textarea-sm' ? 3 : 6;
                inputHtml = `<textarea class="form-input" rows="${rows}" style="width:100%; resize:vertical; line-height:1.6;" oninput="handleUpdateWorldField('${elementId}', '${f.id}', this.value)">${val}</textarea>`;
            } else if (f.type === 'select') {
                inputHtml = `<select class="form-input" style="width:100%" onchange="handleUpdateWorldField('${elementId}', '${f.id}', this.value)">
                    <option value="">--</option>
                    ${f.options.map(opt => `<option value="${opt}" ${val === opt ? 'selected' : ''}>${opt}</option>`).join('')}
                </select>`;
            } else {
                inputHtml = `<input type="text" class="form-input" style="width:100%" value="${val}" onchange="handleUpdateWorldField('${elementId}', '${f.id}', this.value)">`;
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
                const val = elem.fields ? (elem.fields[f.id] || '') : '';
                let inputHtml = '';

                if (f.type === 'textarea' || f.type === 'textarea-sm') {
                    const rows = f.type === 'textarea-sm' ? 3 : 6;
                    inputHtml = `<textarea class="form-input" rows="${rows}" style="width:100%; resize:vertical; line-height:1.6;" oninput="handleUpdateWorldField('${elementId}', '${f.id}', this.value)">${val}</textarea>`;
                } else if (f.type === 'select') {
                    inputHtml = `<select class="form-input" style="width:100%" onchange="handleUpdateWorldField('${elementId}', '${f.id}', this.value)">
                        <option value="">--</option>
                        ${f.options ? f.options.map(opt => `<option value="${opt}" ${val === opt ? 'selected' : ''}>${opt}</option>`).join('') : ''}
                    </select>`;
                } else if (f.type === 'relation') {
                    const opts = window.getAtlasRelationOptions ? window.getAtlasRelationOptions(f.target) : [];
                    inputHtml = `<select class="form-input" style="width:100%" onchange="handleUpdateWorldField('${elementId}', '${f.id}', this.value)">
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
                                            handleUpdateWorldField('${elementId}', '${f.id}', checked);
                                        ">
                                        ${o.label} ${o.sub ? `<span style="color:var(--text-muted); font-size:0.8em;">(${o.sub})</span>` : ''}
                                    </label>`;
                    }).join('')}
                    </div>`;
                } else {
                    inputHtml = `<input type="text" class="form-input" style="width:100%" placeholder="" value="${val}" onchange="handleUpdateWorldField('${elementId}', '${f.id}', this.value)">`;
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
    const nomVal = elem.fields && elem.fields.nom ? elem.fields.nom : elem.name;
    const descVal = elem.fields && elem.fields.resume_court ? elem.fields.resume_court : (elem.description || '');

    // Categories select
    const allCategories = window.ATLAS_SCHEMA ? Object.keys(window.ATLAS_SCHEMA.UNIVERS.categories) : ['Géographie', 'Lieux', 'Peuples', 'Cultures', 'Histoire', 'Biologie', 'Objets'];
    const catSelectOptions = allCategories.map(cat => `<option value="${cat}" ${catKey === cat ? 'selected' : ''}>${Localization.t(WORLD_TYPE_I18N[cat] || 'world.type.other')}</option>`).join('');

    const incomingLinks = window.getIncomingRelations ? window.getIncomingRelations(elementId) : [];
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
                <div style="display: flex; align-items: center; gap: 1rem; flex:1;">
                    <div style="width:42px; height:42px; border-radius:10px; background:${typeColor}; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                        <i data-lucide="${typeIcon}" style="width:20px;height:20px;color:var(--bg-primary);"></i>
                    </div>
                    <div style="flex:1;">
                        <input type="text" class="form-input" value="${nomVal}" 
                               style="font-size: 1.5rem; font-weight: 600; font-family: 'Noto Serif JP', serif; width:100%; border:none; background:transparent; padding:0; margin-bottom: 4px;"
                               onchange="handleUpdateWorldField('${elementId}', 'nom', this.value)"
                               placeholder="Nom de l'élément">
                        <select class="form-input" onchange="handleUpdateWorldField('${elementId}', 'category', this.value)" style="font-size: 0.8rem; padding: 0.1rem 0.6rem; background: var(--bg-secondary); color: var(--text-primary); border-radius: 12px; border: 1px solid var(--border-color); display:inline-block; width:auto; margin-bottom: 8px;">
                            ${catSelectOptions}
                        </select>
                        <div style="font-size: 0.75rem; color: var(--text-muted); line-height: 1.3; background: var(--bg-primary); padding: 8px 12px; border-radius: 8px; border-left: 3px solid ${typeColor}; border: 1px solid var(--border-color); max-width: 500px;">
                            <i data-lucide="info" style="width:12px;height:12px;vertical-align:middle;margin-right:4px;"></i>
                            ${Localization.t((WORLD_TYPE_I18N[catKey] || 'world.type.other') + '.desc')}
                        </div>
                    </div>
                </div>
                <div style="display: flex; gap: 0.5rem;">
                    <button class="btn btn-small" onclick="showReferencesForElement('${elementId}')"><i data-lucide="link" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i>${Localization.t('world.action.view_refs')}</button>
                    ${container.id === 'editorView' ? `<button class="btn" onclick="switchView('editor')"><i data-lucide="arrow-left" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i> ${Localization.t('world.action.back_editor')}</button>` : ''}
                </div>
            </div>

            <div style="padding: 1.5rem;">
                <!-- Résumé = Champ commun prioritaire -->
                <div class="detail-section" style="margin-bottom: 2rem;">
                    <div class="detail-section-title"><i data-lucide="align-left" style="width:16px;height:16px;vertical-align:middle;margin-right:6px;"></i>Résumé court</div>
                    <textarea class="form-input" rows="3" style="width:100%; resize:vertical; line-height:1.7;"
                              oninput="handleUpdateWorldField('${elementId}', 'resume_court', this.value)" placeholder="1 à 2 phrases...">${descVal}</textarea>
                </div>

                ${renderLinkedScenesFragment(data.linkedScenes)}

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

/**
 * Opens the detail view for a world element.
 */
function openWorldDetail(id, options = {}) {
    const data = getWorldDetailViewModel(id);
    if (!data) return;

    // Orchestration Onglets (Préféré)
    if (typeof openTab === 'function') {
        openTab('world', { worldId: id }, options);
        return;
    }

    const editorView = document.getElementById('editorView');
    if (!editorView) return;

    _renderWorldDetailInContainer(data, editorView, id);
}

// Support pour le splitview : exposer globalement la fonction d'injection
window.renderWorldDetailInContainer = function (elem, container) {
    const data = getWorldDetailViewModel(elem.id);
    if (data) _renderWorldDetailInContainer(data, container, elem.id);
};

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
            // Si le nom change, rafraîchir aussi les onglets (pour le titre)
            if (field === 'nom' && typeof refreshTabs === 'function') refreshTabs();
        }
        // Force refresh the detail view if category changed so new specific fields appear
        if (field === 'category') {
            setTimeout(() => openWorldDetail(id), 10);
        }
    }
}

/**
 * Updates the hint text in the Add World Element modal based on the selected type.
 */
window.updateWorldModalHint = function () {
    const select = document.getElementById('worldTypeInput');
    const hint = document.getElementById('worldTypeHint');
    if (!select || !hint) return;

    const val = select.value;
    const i18nKey = WORLD_TYPE_I18N[val] || 'world.type.other';
    const desc = Localization.t(i18nKey + '.desc');

    if (desc && desc !== (i18nKey + '.desc')) {
        hint.textContent = desc;
        hint.style.display = 'block';
    } else {
        hint.style.display = 'none';
    }
};

// Map original function name to keep compatibility with other modules if needed
// or if the UI expects the old function name.
function addWorldElement() { handleAddWorldElement(); }
function updateWorldField(id, field, value) { handleUpdateWorldField(id, field, value); }
function deleteWorldElement(id) { handleDeleteWorldElement(id); }
// renderElementLinkedScenes is now internal to openWorldDetail via renderLinkedScenesFragment
