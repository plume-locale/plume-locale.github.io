// ==========================================
// SPLIT VIEW SYSTEM - Coordinator
// ==========================================

/** [MVVM : Other] - Logique de routage de rendu vers les différentes vues spécifiques (Mixte) */
function renderViewInSplitPanel(view, container, state, panel) {
    // Technique: créer un faux editorView temporaire pour que les fonctions de rendu existantes fonctionnent
    const realEditorView = document.getElementById('editorView');

    // Créer un conteneur temporaire avec l'ID editorView
    const tempContainer = document.createElement('div');
    tempContainer.id = 'editorView';
    tempContainer.style.cssText = 'height: 100%; display: flex; flex-direction: column; overflow: hidden; position: relative;';
    container.innerHTML = '';
    container.appendChild(tempContainer);

    // Temporairement masquer le vrai editorView et changer son ID
    if (realEditorView) {
        realEditorView.id = 'editorView-backup';
    }

    // Fonction pour restaurer après le rendu
    const restoreEditorView = () => {
        // Restaurer l'ID du vrai editorView
        if (realEditorView) {
            realEditorView.id = 'editorView';
        }
        // Le tempContainer garde le contenu rendu mais perd son ID
        tempContainer.id = 'splitPanelContent-' + panel;
    };

    switch (view) {
        case 'editor':
            // 1. Scene Editor
            if (state.sceneId) {
                const act = project.acts.find(a => a.id == state.actId);
                const chapter = act?.chapters.find(c => c.id == state.chapterId);
                const scene = chapter?.scenes.find(s => s.id == state.sceneId);
                if (act && chapter && scene) {
                    renderEditorInContainer(act, chapter, scene, container, panel);
                    restoreEditorView();
                    return;
                }
            }
            // 2. Full Book Editor
            else if (state.actId === 'all') {
                if (typeof renderFullBookEditor === 'function') {
                    renderFullBookEditor();
                    restoreEditorView();
                    return;
                }
            }
            // 3. Chapter Editor
            else if (state.chapterId) {
                const act = project.acts.find(a => a.id == state.actId);
                const chapter = act?.chapters.find(c => c.id == state.chapterId);
                if (act && chapter && typeof renderChapterEditor === 'function') {
                    renderChapterEditor(act, chapter);
                    restoreEditorView();
                    return;
                }
            }
            // 4. Act Editor
            else if (state.actId) {
                const act = project.acts.find(a => a.id === state.actId);
                if (act && typeof renderActEditor === 'function') {
                    renderActEditor(act);
                    restoreEditorView();
                    return;
                }
            }

            // 5. Fallback / Empty State
            tempContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon"><i data-lucide="pencil" style="width:48px;height:48px;stroke-width:1;"></i></div>
                    <div class="empty-state-title">${Localization.t('split.empty_state_select_scene')}</div>
                    <div class="empty-state-text">${Localization.t('split.empty_state_select_sidebar')}</div>
                </div>
            `;
            break;

        case 'characters':
            if (state.characterId) {
                if (typeof getCharacterDetailViewModel === 'function') {
                    const data = getCharacterDetailViewModel(state.characterId);
                    if (data) {
                        const { character, races, linkedScenes } = data;
                        if (typeof renderCharacterSheet === 'function') {
                            tempContainer.innerHTML = renderCharacterSheet(character, races, linkedScenes);
                            setTimeout(() => {
                                if (typeof initCharacterRadar === 'function') initCharacterRadar(character);
                                if (typeof lucide !== 'undefined') lucide.createIcons();
                            }, 100);
                        }
                    }
                }
            } else {
                tempContainer.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon"><i data-lucide="users" style="width:48px;height:48px;stroke-width:1.5;"></i></div>
                        <div class="empty-state-title">${Localization.t('split.empty_state_characters')}</div>
                        <div class="empty-state-text">${Localization.t('split.empty_state_select_character')}</div>
                    </div>
                `;
            }
            break;

        case 'world':
            if (state.worldId) {
                const elem = project.world?.find(e => e.id == state.worldId);
                if (elem) {
                    if (typeof renderWorldDetailFull === 'function') {
                        renderWorldDetailFull(elem, tempContainer);
                    } else if (typeof renderWorldDetailInContainer === 'function') {
                        renderWorldDetailInContainer(elem, tempContainer);
                    }
                }
            } else {
                tempContainer.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon"><i data-lucide="globe" style="width:48px;height:48px;stroke-width:1.5;"></i></div>
                        <div class="empty-state-title">${Localization.t('split.empty_state_world')}</div>
                        <div class="empty-state-text">${Localization.t('split.empty_state_select_element')}</div>
                    </div>
                `;
            }
            break;

        case 'notes':
            if (state.noteId) {
                const note = project.notes?.find(n => n.id == state.noteId);
                if (note) {
                    if (typeof renderNoteDetailInContainer === 'function') {
                        renderNoteDetailInContainer(note, tempContainer);
                    }
                }
            } else {
                tempContainer.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon"><i data-lucide="sticky-note" style="width:48px;height:48px;stroke-width:1.5;"></i></div>
                        <div class="empty-state-title">${Localization.t('split.empty_state_notes')}</div>
                        <div class="empty-state-text">${Localization.t('split.empty_state_select_note')}</div>
                    </div>
                `;
            }
            break;

        case 'mindmap':
            if (typeof renderMindmapView === 'function') {
                renderMindmapView();
            }
            break;

        case 'corkboard':
            if (typeof openCorkBoardView === 'function') {
                openCorkBoardView();
            } else if (typeof renderCorkboardInSplitPanel === 'function') {
                renderCorkboardInSplitPanel(tempContainer.id);
            }
            break;

        case 'stats':
            if (typeof renderStats === 'function') {
                renderStats();
            } else if (typeof renderStatsInSplitPanel === 'function') {
                renderStatsInSplitPanel(tempContainer.id);
            }
            break;

        case 'analysis':
            if (typeof renderAnalysis === 'function') {
                renderAnalysis();
            }
            break;

        case 'map':
            if (typeof renderMapView === 'function') {
                renderMapView();
            }
            break;

        case 'codex':
            if (state.codexId) {
                const entry = project.codex?.find(c => c.id == state.codexId);
                if (entry) {
                    const codexCatIcon = typeof getCodexCategoryIcon === 'function' ? getCodexCategoryIcon(entry.category) : 'book';
                    const codexCategories = typeof getCodexCategories === 'function' ? getCodexCategories() : ['Culture','Histoire','Technologie','Géographie','Politique','Magie/Pouvoir','Religion','Société','Autre'];
                    const codexCatOptions = codexCategories.map(cat =>
                        `<option value="${cat}" ${entry.category === cat ? 'selected' : ''}>${Localization.t('codex.category.' + cat)}</option>`
                    ).join('');

                    tempContainer.innerHTML = `
                        <div class="detail-view" style="height:100%; overflow-y:auto;">
                            <div class="detail-header" style="position:sticky; top:0; background:var(--bg-primary); z-index:10; padding:1rem; border-bottom:1px solid var(--border-color); display:flex; align-items:center; gap:0.75rem;">
                                <div style="width:36px; height:36px; border-radius:8px; background:var(--accent-gold); display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                                    <i data-lucide="${codexCatIcon}" style="width:18px;height:18px;color:var(--bg-primary);"></i>
                                </div>
                                <input type="text" class="form-input" value="${entry.title}"
                                       style="font-size: 1.3rem; font-weight: 600; font-family: 'Noto Serif JP', serif; flex:1; border:none; background:transparent; padding:0.3rem;"
                                       onchange="typeof updateCodexField === 'function' ? updateCodexField(${entry.id}, 'title', this.value) : null"
                                       placeholder="${Localization.t('split.codex_title_placeholder')}">
                                <span style="font-size: 0.75rem; padding: 0.3rem 0.6rem; background: var(--accent-gold); color: var(--bg-primary); border-radius: 10px; font-weight:600; white-space:nowrap;">${Localization.t('codex.category.' + entry.category)}</span>
                            </div>

                            <div style="padding:1.5rem;">
                                <div class="detail-section" style="margin-bottom:1.5rem;">
                                    <div class="detail-section-title" style="font-size:0.9rem; font-weight:600; color:var(--text-muted); margin-bottom:0.5rem;"><i data-lucide="tag" style="width:14px;height:14px;vertical-align:middle;margin-right:6px;"></i>${Localization.t('split.codex_category')}</div>
                                    <select class="form-input" onchange="typeof updateCodexField === 'function' ? updateCodexField(${entry.id}, 'category', this.value) : null" style="width:100%;">
                                        ${codexCatOptions}
                                    </select>
                                </div>

                                <div class="detail-section" style="margin-bottom:1.5rem;">
                                    <div class="detail-section-title" style="font-size:0.9rem; font-weight:600; color:var(--text-muted); margin-bottom:0.5rem;"><i data-lucide="file-text" style="width:14px;height:14px;vertical-align:middle;margin-right:6px;"></i>${Localization.t('split.codex_summary')}</div>
                                    <textarea class="form-input" rows="4" style="width:100%; resize:vertical; line-height:1.6;"
                                              oninput="typeof updateCodexField === 'function' ? updateCodexField(${entry.id}, 'summary', this.value) : null">${entry.summary || ''}</textarea>
                                </div>

                                <div class="detail-section" style="margin-bottom:1.5rem;">
                                    <div class="detail-section-title" style="font-size:0.9rem; font-weight:600; color:var(--text-muted); margin-bottom:0.5rem;"><i data-lucide="book-open" style="width:14px;height:14px;vertical-align:middle;margin-right:6px;"></i>${Localization.t('split.codex_content')}</div>
                                    <textarea class="form-input" rows="20" style="width:100%; resize:vertical; line-height:1.7; font-size:1rem;"
                                              oninput="typeof updateCodexField === 'function' ? updateCodexField(${entry.id}, 'content', this.value) : null">${entry.content || ''}</textarea>
                                </div>
                            </div>
                        </div>
                    `;
                }
            } else {
                tempContainer.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon"><i data-lucide="book-open" style="width:48px;height:48px;stroke-width:1.5;"></i></div>
                        <div class="empty-state-title">${Localization.t('split.empty_state_codex')}</div>
                        <div class="empty-state-text">${Localization.t('split.empty_state_select_codex')}</div>
                    </div>
                `;
            }
            break;

        case 'plot':
            if (typeof renderPlotView === 'function') {
                renderPlotView();
            } else if (typeof renderPlotInSplitPanel === 'function') {
                renderPlotInSplitPanel(tempContainer);
            }
            break;

        case 'relations':
            if (typeof renderRelationsView === 'function') {
                renderRelationsView();
            } else if (typeof renderRelationsInSplitPanel === 'function') {
                renderRelationsInSplitPanel(tempContainer);
            }
            break;

        case 'timelineviz':
            if (typeof MetroTimelineView !== 'undefined') {
                const charCount = project.characters?.length || 0;
                if (charCount === 0) {
                    tempContainer.innerHTML = `
                        <div class="metro-empty-state">
                            <i data-lucide="users" style="width: 64px; height: 64px; opacity: 0.3;"></i>
                            <h3 style="margin: 1rem 0 0.5rem;">${Localization.t('split.metro_no_char')}</h3>
                            <p style="margin-bottom: 1.5rem;">${Localization.t('split.metro_no_char_desc')}</p>
                        </div>
                    `;
                } else {
                    tempContainer.innerHTML = `
                        <div style="padding: 1rem; height: 100%; overflow: auto;">
                            <div class="metro-toolbar" style="margin-bottom: 1rem;">
                                <button class="btn btn-primary" onclick="typeof openMetroEventModal === 'function' ? openMetroEventModal() : null">
                                    <i data-lucide="plus" style="width: 16px; height: 16px;"></i>
                                    ${Localization.t('split.metro_new_event')}
                                </button>
                                <button class="btn" onclick="typeof sortMetroByDate === 'function' ? sortMetroByDate() : null">
                                    <i data-lucide="calendar" style="width: 16px; height: 16px;"></i>
                                    ${Localization.t('split.metro_sort_date')}
                                </button>
                            </div>

                            <div class="metro-timeline-container" id="metroTimelineContainer-split-${panel}">
                                ${MetroTimelineView.renderMetroSVG()}
                            </div>

                            <div class="metro-legend" style="margin-top: 1rem;">
                                ${project.characters.map(char => {
                                    const color = typeof MetroTimelineRepository !== 'undefined' ? MetroTimelineRepository.getCharacterColor(char.id) : '#999';
                                    return `
                                    <div class="metro-legend-item" onclick="typeof openMetroColorPicker === 'function' ? openMetroColorPicker(${char.id}) : null" style="cursor: pointer;" title="${Localization.t('split.metro_legend_hint')}">
                                        <div class="metro-legend-line" style="background: ${color};"></div>
                                        <span>${char.name}</span>
                                    </div>
                                `}).join('')}
                            </div>
                        </div>
                    `;
                }
            }
            break;

        case 'versions':
            if (typeof renderVersionsList === 'function') {
                renderVersionsList();
            }
            break;

        case 'todos':
            if (typeof renderTodosList === 'function') {
                renderTodosList();
            }
            break;

        case 'timeline':
            if (typeof renderTimelineList === 'function') {
                renderTimelineList();
            }
            if (typeof renderTimelineInSplitPanel === 'function') {
                renderTimelineInSplitPanel(tempContainer);
            }
            break;

        case 'globalnotes':
            if (typeof renderGlobalNotes === 'function') {
                renderGlobalNotes();
            }
            break;

        case 'front_matter':
            if (window.FrontMatterView) {
                window.FrontMatterView.render('editorView');
            }
            break;

        case 'projects':
            if (typeof ProjectView !== 'undefined' && typeof ProjectView.renderLandingPage === 'function') {
                ProjectView.renderLandingPage(projects);
            }
            break;

        case 'arcs':
            if (typeof renderArcsList === 'function') renderArcsList();
            if (typeof renderArcsWelcome === 'function') renderArcsWelcome();
            break;

        case 'investigation':
            if (typeof renderInvestigationBoard === 'function') renderInvestigationBoard();
            break;

        default:
            tempContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon"><i data-lucide="${viewIcons[view] || 'file'}" style="width:48px;height:48px;stroke-width:1.5;"></i></div>
                    <div class="empty-state-title">${viewLabels[view] || view}</div>
                    <div class="empty-state-text">${Localization.t('split.view_available')}</div>
                </div>
            `;
    }

    // Restaurer l'ID du vrai editorView
    restoreEditorView();

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

/** [View] - Génère le HTML des détails d'un élément de l'univers pour un conteneur */
function renderWorldDetailInContainer(element, container) {
    const worldTypeIcon = (typeof WORLD_TYPE_ICONS !== 'undefined') ? (WORLD_TYPE_ICONS[element.type] || 'circle') : 'globe';
    const worldTypeLabel = (typeof WORLD_TYPE_I18N !== 'undefined' && WORLD_TYPE_I18N[element.type])
        ? Localization.t(WORLD_TYPE_I18N[element.type])
        : element.type;

    container.innerHTML = `
        <div class="detail-view" style="height: 100%; overflow-y: auto;">
            <div class="detail-header" style="position: sticky; top: 0; background: var(--bg-primary); z-index: 10; padding: 1rem; border-bottom: 1px solid var(--border-color); display:flex; align-items:center; gap:0.75rem;">
                <div style="width:36px; height:36px; border-radius:8px; background:var(--accent-gold); display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                    <i data-lucide="${worldTypeIcon}" style="width:18px;height:18px;color:var(--bg-primary);"></i>
                </div>
                <div class="detail-title" style="font-size: 1.3rem; font-weight: 600; margin-bottom:0; flex:1;">${element.name}</div>
                <span style="font-size: 0.75rem; padding: 0.3rem 0.6rem; background: var(--accent-gold); color: var(--bg-primary); border-radius: 10px; font-weight:600; white-space:nowrap;">${worldTypeLabel}</span>
            </div>

            <div style="padding: 1.5rem;">
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem; margin-bottom:1.5rem;">
                    <div class="detail-section" style="margin-bottom:0;">
                        <div class="detail-section-title" style="font-size: 0.9rem; font-weight: 600; color: var(--text-muted); margin-bottom: 0.5rem;"><i data-lucide="pen-line" style="width:14px;height:14px;vertical-align:middle;margin-right:6px;"></i>${Localization.t('modal.world.name')}</div>
                        <input type="text" class="form-input" value="${element.name}"
                               onchange="typeof updateWorldField === 'function' ? updateWorldField(${element.id}, 'name', this.value) : null" style="width: 100%;">
                    </div>

                    <div class="detail-section" style="margin-bottom:0;">
                        <div class="detail-section-title" style="font-size: 0.9rem; font-weight: 600; color: var(--text-muted); margin-bottom: 0.5rem;"><i data-lucide="tag" style="width:14px;height:14px;vertical-align:middle;margin-right:6px;"></i>${Localization.t('modal.world.type')}</div>
                        <select class="form-input" onchange="typeof updateWorldField === 'function' ? updateWorldField(${element.id}, 'type', this.value) : null" style="width: 100%;">
                            <option value="Lieu" ${element.type === 'Lieu' ? 'selected' : ''}>${Localization.t('world.type.place')}</option>
                            <option value="Objet" ${element.type === 'Objet' ? 'selected' : ''}>${Localization.t('world.type.object')}</option>
                            <option value="Concept" ${element.type === 'Concept' ? 'selected' : ''}>${Localization.t('world.type.concept')}</option>
                            <option value="Organisation" ${element.type === 'Organisation' ? 'selected' : ''}>${Localization.t('world.type.organization')}</option>
                            <option value="Événement" ${element.type === 'Événement' ? 'selected' : ''}>${Localization.t('world.type.event')}</option>
                        </select>
                    </div>
                </div>

                <div class="detail-section" style="margin-bottom: 1.5rem;">
                    <div class="detail-section-title" style="font-size: 0.9rem; font-weight: 600; color: var(--text-muted); margin-bottom: 0.5rem;"><i data-lucide="align-left" style="width:14px;height:14px;vertical-align:middle;margin-right:6px;"></i>${Localization.t('modal.world.desc')}</div>
                    <textarea class="form-input" rows="6" style="width: 100%; resize: vertical; line-height:1.7;"
                              oninput="typeof updateWorldField === 'function' ? updateWorldField(${element.id}, 'description', this.value) : null">${element.description || ''}</textarea>
                </div>

                <div class="detail-section" style="margin-bottom: 1.5rem;">
                    <div class="detail-section-title" style="font-size: 0.9rem; font-weight: 600; color: var(--text-muted); margin-bottom: 0.5rem;"><i data-lucide="list" style="width:14px;height:14px;vertical-align:middle;margin-right:6px;"></i>${Localization.t('modal.world.details')}</div>
                    <textarea class="form-input" rows="6" style="width: 100%; resize: vertical; line-height:1.7;"
                              oninput="typeof updateWorldField === 'function' ? updateWorldField(${element.id}, 'details', this.value) : null">${element.details || ''}</textarea>
                </div>

                <div class="detail-section" style="margin-bottom: 1.5rem;">
                    <div class="detail-section-title" style="font-size: 0.9rem; font-weight: 600; color: var(--text-muted); margin-bottom: 0.5rem;"><i data-lucide="clock" style="width:14px;height:14px;vertical-align:middle;margin-right:6px;"></i>${Localization.t('modal.world.history')}</div>
                    <textarea class="form-input" rows="6" style="width: 100%; resize: vertical; line-height:1.7;"
                              oninput="typeof updateWorldField === 'function' ? updateWorldField(${element.id}, 'history', this.value) : null">${element.history || ''}</textarea>
                </div>

                <div class="detail-section" style="margin-bottom: 1.5rem;">
                    <div class="detail-section-title" style="font-size: 0.9rem; font-weight: 600; color: var(--text-muted); margin-bottom: 0.5rem;"><i data-lucide="sticky-note" style="width:14px;height:14px;vertical-align:middle;margin-right:6px;"></i>${Localization.t('modal.world.notes')}</div>
                    <textarea class="form-input" rows="4" style="width: 100%; resize: vertical; line-height:1.7;"
                              oninput="typeof updateWorldField === 'function' ? updateWorldField(${element.id}, 'notes', this.value) : null">${element.notes || ''}</textarea>
                </div>
            </div>
        </div>
    `;
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

/** [View] - Génère le HTML des détails d'une note pour un conteneur */
function renderNoteDetailInContainer(note, container) {
    const catIcon = (typeof NotesModel !== 'undefined' && NotesModel.CATEGORIES) ? (NotesModel.CATEGORIES[note.category] || 'file-text') : 'file-text';
    const tagsHtml = (note.tags || []).length > 0
        ? (note.tags || []).map(t => `<span style="display:inline-block; padding:0.15rem 0.5rem; background:var(--bg-tertiary); border:1px solid var(--border-color); border-radius:10px; font-size:0.75rem; color:var(--text-secondary);">${t.trim()}</span>`).join(' ')
        : '';

    container.innerHTML = `
        <div class="detail-view" style="height: 100%; display: flex; flex-direction: column; overflow: hidden;">
            <div style="padding: 0.75rem 1rem; background: var(--bg-secondary); border-bottom: 1px solid var(--border-color); flex-shrink:0;">
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                    <div style="width:32px; height:32px; border-radius:8px; background:var(--accent-gold); display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                        <i data-lucide="${catIcon}" style="width:16px;height:16px;color:var(--bg-primary);"></i>
                    </div>
                    <input type="text" class="form-input" value="${note.title || ''}"
                           style="font-size: 1.2rem; font-weight: 600; flex: 1; border: none; background: transparent; padding:0.3rem;"
                           onchange="typeof updateNoteField === 'function' ? updateNoteField(${note.id}, 'title', this.value) : null"
                           placeholder="${Localization.t('split.note_placeholder_title')}">
                    <select class="form-input" onchange="typeof updateNoteField === 'function' ? updateNoteField(${note.id}, 'category', this.value) : null" style="width: auto; font-size:0.85rem;">
                        <option value="Recherche" ${note.category === 'Recherche' ? 'selected' : ''}>${Localization.t('notes.category.research')}</option>
                        <option value="Idée" ${note.category === 'Idée' ? 'selected' : ''}>${Localization.t('notes.category.idea')}</option>
                        <option value="Référence" ${note.category === 'Référence' ? 'selected' : ''}>${Localization.t('notes.category.reference')}</option>
                        <option value="A faire" ${note.category === 'A faire' ? 'selected' : ''}>${Localization.t('notes.category.todo')}</option>
                        <option value="Question" ${note.category === 'Question' ? 'selected' : ''}>${Localization.t('notes.category.question')}</option>
                        <option value="Autre" ${note.category === 'Autre' ? 'selected' : ''}>${Localization.t('notes.category.other')}</option>
                    </select>
                </div>
                <div style="margin-top: 0.5rem; display:flex; align-items:center; gap:0.5rem;">
                    <i data-lucide="hash" style="width:14px;height:14px;color:var(--text-muted);flex-shrink:0;"></i>
                    <input type="text" class="form-input" value="${(note.tags || []).join(', ')}"
                           style="font-size: 0.85rem; flex:1; border:none; background:transparent; padding:0.2rem;"
                           onchange="typeof updateNoteTags === 'function' ? updateNoteTags(${note.id}, this.value) : null"
                           placeholder="${Localization.t('split.note_placeholder_tags')}">
                </div>
                ${tagsHtml ? `<div style="margin-top:0.4rem; display:flex; flex-wrap:wrap; gap:0.3rem;">${tagsHtml}</div>` : ''}
            </div>
            <div style="flex: 1; padding: 1rem; overflow: hidden;">
                <textarea class="form-input"
                          style="width: 100%; height: 100%; resize: none; font-size: 1rem; line-height: 1.7; border: none; background: var(--bg-primary);"
                          oninput="typeof updateNoteField === 'function' ? updateNoteField(${note.id}, 'content', this.value) : null"
                          placeholder="${Localization.t('split.note_placeholder_content')}">${note.content || ''}</textarea>
            </div>
            <div style="padding: 0.5rem 1rem; font-size: 0.75rem; color: var(--text-muted); background: var(--bg-secondary); border-top: 1px solid var(--border-color); display:flex; align-items:center; gap:0.5rem;">
                <i data-lucide="clock" style="width:12px;height:12px;opacity:0.5;"></i>
                ${Localization.t('split.note_created_on', [new Date(note.createdAt).toLocaleDateString(Localization.getLocale() === 'fr' ? 'fr-FR' : 'en-US')])} •
                ${Localization.t('split.note_updated_on', [new Date(note.updatedAt).toLocaleDateString(Localization.getLocale() === 'fr' ? 'fr-FR' : 'en-US')])}
            </div>
        </div>
    `;
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

/** [View] - Génère le HTML de la vue "Tableau de liège" en mode split */
function renderCorkboardInSplitPanel(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
        <div style="padding: 1rem;">
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem;">
                ${project.acts.map(act =>
        act.chapters.map(chapter =>
            chapter.scenes.map(scene => `
                            <div class="cork-card" onclick="openSceneFromSplit(${act.id}, ${chapter.id}, ${scene.id})" style="background: var(--bg-secondary); padding: 1rem; border-radius: 8px; border: 1px solid var(--border-color); cursor: pointer; transition: transform 0.15s, box-shadow 0.15s;">
                                <div style="font-weight: 600; margin-bottom: 0.5rem;">${scene.title || Localization.t('sidebar_view.editor.empty_message')}</div>
                                <div style="font-size: 0.8rem; color: var(--text-muted);">${chapter.title}</div>
                                <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.5rem;">${Localization.t('editor.word_count', [typeof getWordCount === 'function' ? getWordCount(scene.content || '') : 0])}</div>
                            </div>
                        `).join('')
        ).join('')
    ).join('')}
            </div>
        </div>
    `;
}

/** [Mixte] - Agrège les données (Model) et génère le HTML des statistiques (View) */
function renderStatsInSplitPanel(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    let totalWords = 0;
    let totalScenes = 0;
    let totalChapters = 0;

    project.acts.forEach(act => {
        act.chapters.forEach(chapter => {
            totalChapters++;
            chapter.scenes.forEach(scene => {
                totalScenes++;
                totalWords += typeof getWordCount === 'function' ? getWordCount(scene.content || '') : 0;
            });
        });
    });

    container.innerHTML = `
        <div style="padding: 1.5rem;">
            <h3 style="margin-bottom: 1.5rem;">${Localization.t('split.stats_title')}</h3>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;">
                <div style="background: var(--bg-secondary); padding: 1.5rem; border-radius: 8px; text-align: center;">
                    <div style="font-size: 2rem; font-weight: 700; color: var(--primary-color);">${totalWords.toLocaleString()}</div>
                    <div style="color: var(--text-muted);">${Localization.t('split.stats_words')}</div>
                </div>
                <div style="background: var(--bg-secondary); padding: 1.5rem; border-radius: 8px; text-align: center;">
                    <div style="font-size: 2rem; font-weight: 700; color: var(--primary-color);">${totalScenes}</div>
                    <div style="color: var(--text-muted);">${Localization.t('split.stats_scenes')}</div>
                </div>
                <div style="background: var(--bg-secondary); padding: 1.5rem; border-radius: 8px; text-align: center;">
                    <div style="font-size: 2rem; font-weight: 700; color: var(--primary-color);">${totalChapters}</div>
                    <div style="color: var(--text-muted);">${Localization.t('split.stats_chapters')}</div>
                </div>
                <div style="background: var(--bg-secondary); padding: 1.5rem; border-radius: 8px; text-align: center;">
                    <div style="font-size: 2rem; font-weight: 700; color: var(--primary-color);">${project.characters?.length || 0}</div>
                    <div style="color: var(--text-muted);">${Localization.t('split.stats_characters')}</div>
                </div>
            </div>
        </div>
    `;
}

/** [View] - Génère le graphique SVG de l'intrigue pour un conteneur */
function renderPlotInSplitPanel(container) {
    // Initialiser les points d'intrigue si nécessaire
    if (typeof plotPoints === 'undefined' || plotPoints.length === 0) {
        if (typeof initPlotPoints === 'function') {
            initPlotPoints();
        }
    }

    const svgWidth = 600;
    const svgHeight = 350;
    const padding = 50;
    const plotWidth = svgWidth - padding * 2;
    const plotHeight = svgHeight - padding * 2;

    let pathData = '';
    let pointsHTML = '';
    let gridLines = '';

    // Lignes de grille
    for (let i = 0; i <= 4; i++) {
        const y = padding + (plotHeight / 4) * i;
        gridLines += `<line x1="${padding}" y1="${y}" x2="${svgWidth - padding}" y2="${y}" stroke="var(--border-color)" stroke-width="1" opacity="0.3" stroke-dasharray="5,5"/>`;
    }

    // Générer la courbe si plotPoints existe
    if (typeof plotPoints !== 'undefined' && plotPoints.length > 0) {
        plotPoints.forEach((point, index) => {
            const x = padding + (plotWidth / Math.max(plotPoints.length - 1, 1)) * index;
            const y = padding + plotHeight - (point.intensity / 100) * plotHeight;

            if (index === 0) {
                pathData = `M ${x} ${y}`;
            } else {
                pathData += ` L ${x} ${y}`;
            }

            pointsHTML += `
                <circle cx="${x}" cy="${y}" r="5" fill="var(--accent-gold)" stroke="white" stroke-width="2" 
                        style="cursor: pointer;" 
                        onclick="typeof openScene === 'function' ? openScene(${point.actId}, ${point.chapterId}, ${point.sceneId}) : null">
                    <title>${point.title} - Tension: ${Math.round(point.intensity)}%</title>
                </circle>
            `;
        });
    }

    container.innerHTML = `
        <div style="padding: 1.5rem;">
            <h3 style="margin-bottom: 1rem;"><i data-lucide="trending-up" style="width:18px;height:18px;vertical-align:middle;margin-right:6px;"></i>${Localization.t('split.plot_title')}</h3>
            <div style="background: var(--bg-secondary); border-radius: 8px; padding: 1rem; overflow-x: auto;">
                <svg viewBox="0 0 ${svgWidth} ${svgHeight}" style="width: 100%; max-width: ${svgWidth}px; height: auto;">
                    ${gridLines}
                    ${pathData ? `<path d="${pathData}" fill="none" stroke="var(--primary-color)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>` : ''}
                    ${pointsHTML}
                </svg>
            </div>
            <div style="margin-top: 1rem; font-size: 0.85rem; color: var(--text-muted);">
                ${Localization.t('split.plot_hint', [typeof plotPoints !== 'undefined' ? plotPoints.length : 0])}
            </div>
        </div>
    `;
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

/** [View] - Génère le HTML des relations entre personnages pour un conteneur */
function renderRelationsInSplitPanel(container) {
    const relationships = project.relationships || [];
    const characters = project.characters || [];

    if (characters.length < 2) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon"><i data-lucide="heart-handshake" style="width:48px;height:48px;stroke-width:1.5;"></i></div>
                <div class="empty-state-title">${Localization.t('split.relations_title')}</div>
                <div class="empty-state-text">${Localization.t('split.relations_empty')}</div>
            </div>
        `;
        if (typeof lucide !== 'undefined') lucide.createIcons();
        return;
    }

    let relationsHTML = '';
    if (relationships.length > 0) {
        relationsHTML = relationships.map(rel => {
            const char1 = characters.find(c => c.id === rel.character1Id);
            const char2 = characters.find(c => c.id === rel.character2Id);
            if (!char1 || !char2) return '';

            return `
                <div style="background: var(--bg-secondary); padding: 1rem; border-radius: 8px; margin-bottom: 0.75rem;">
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <span style="font-weight: 600;">${char1.name || char1.firstName || Localization.t('split.char_fallback', ['1'])}</span>
                        <span style="color: var(--primary-color);">↔</span>
                        <span style="font-weight: 600;">${char2.name || char2.firstName || Localization.t('split.char_fallback', ['2'])}</span>
                    </div>
                    <div style="font-size: 0.9rem; color: var(--text-muted); margin-top: 0.5rem;">${rel.type || Localization.t('split.relation_fallback')}</div>
                    ${rel.description ? `<div style="font-size: 0.85rem; margin-top: 0.5rem;">${rel.description}</div>` : ''}
                </div>
            `;
        }).join('');
    } else {
        relationsHTML = `<div style="color: var(--text-muted); text-align: center; padding: 2rem;">${Localization.t('split.relations_none')}</div>`;
    }

    container.innerHTML = `
        <div style="padding: 1.5rem;">
            <h3 style="margin-bottom: 1rem;"><i data-lucide="heart-handshake" style="width:18px;height:18px;vertical-align:middle;margin-right:6px;"></i>${Localization.t('split.relations_title')}</h3>
            <div>${relationsHTML}</div>
            <button class="btn btn-primary" onclick="typeof openAddRelationModal === 'function' ? openAddRelationModal() : null" style="margin-top: 1rem;">${Localization.t('split.relations_add')}</button>
        </div>
    `;
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

/** [View] - Génère le HTML de la chronologie pour un conteneur */
function renderTimelineInSplitPanel(container) {
    const events = project.timeline || [];

    if (events.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon"><i data-lucide="calendar-range" style="width:48px;height:48px;stroke-width:1.5;"></i></div>
                <div class="empty-state-title">${Localization.t('split.timeline_title')}</div>
                <div class="empty-state-text">${Localization.t('split.timeline_empty')}</div>
                <button class="btn btn-primary" onclick="typeof openAddTimelineModal === 'function' ? openAddTimelineModal() : null" style="margin-top: 1rem;">${Localization.t('split.timeline_add')}</button>
            </div>
        `;
        if (typeof lucide !== 'undefined') lucide.createIcons();
        return;
    }

    // Trier par date si possible
    const sortedEvents = [...events].sort((a, b) => {
        if (a.date && b.date) return new Date(a.date) - new Date(b.date);
        return 0;
    });

    const eventsHTML = sortedEvents.map((event, index) => `
        <div style="display: flex; gap: 1rem; margin-bottom: 1.5rem;">
            <div style="display: flex; flex-direction: column; align-items: center;">
                <div style="width: 12px; height: 12px; background: var(--primary-color); border-radius: 50%;"></div>
                ${index < sortedEvents.length - 1 ? '<div style="width: 2px; flex: 1; background: var(--border-color);"></div>' : ''}
            </div>
            <div style="flex: 1; background: var(--bg-secondary); padding: 1rem; border-radius: 8px;">
                <div style="font-weight: 600;">${event.title}</div>
                ${event.date ? `<div style="font-size: 0.85rem; color: var(--primary-color); margin-top: 0.25rem;">${event.date}</div>` : ''}
                ${event.description ? `<div style="font-size: 0.9rem; color: var(--text-muted); margin-top: 0.5rem;">${event.description}</div>` : ''}
            </div>
        </div>
    `).join('');

    container.innerHTML = `
        <div style="padding: 1.5rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                <h3 style="margin: 0;"><i data-lucide="calendar-range" style="width:18px;height:18px;vertical-align:middle;margin-right:6px;"></i>${Localization.t('split.timeline_title')}</h3>
                <button class="btn btn-small" onclick="typeof openAddTimelineModal === 'function' ? openAddTimelineModal() : null">${Localization.t('split.timeline_btn_short')}</button>
            </div>
            <div>${eventsHTML}</div>
        </div>
    `;
    if (typeof lucide !== 'undefined') lucide.createIcons();
}
