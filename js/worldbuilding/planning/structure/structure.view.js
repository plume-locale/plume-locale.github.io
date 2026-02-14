/**
 * [MVVM : Structure View]
 * Gestionnaire d'affichage de l'arborescence (Actes/Chapitres/Scènes).
 */

// --- ACTIONS UI ---

function addAct() {
    const titleInput = document.getElementById('actTitleInput');
    const result = addActViewModel((titleInput.value || '').trim());

    if (result.success) {
        processStructureSideEffects(result.sideEffects);
        titleInput.value = '';
        closeModal('addActModal');
        renderActsList();
        if (result.message) showNotification(result.message, 'success');
    } else {
        showNotification(result.message || 'Erreur lors de l\'ajout', 'error');
    }
}

function deleteAct(actId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet acte et tout son contenu ?')) return;

    const result = deleteActViewModel(actId, typeof currentActId !== 'undefined' ? currentActId : null);

    if (result.success) {
        processStructureSideEffects(result.sideEffects);
        renderActsList();
        if (result.message) showNotification(result.message, 'success');
    } else {
        showNotification(result.message || 'Erreur lors de la suppression', 'error');
    }
}

function addChapter() {
    const titleInput = document.getElementById('chapterTitleInput');
    const result = addChapterViewModel((titleInput.value || '').trim(), typeof activeActId !== 'undefined' ? activeActId : null);

    if (result.success) {
        processStructureSideEffects(result.sideEffects);
        titleInput.value = '';
        closeModal('addChapterModal');
        renderActsList();
        if (result.message) showNotification(result.message, 'success');
    } else {
        showNotification(result.message || 'Erreur lors de l\'ajout', 'error');
    }
}

function deleteChapter(actId, chapterId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce chapitre et ses scènes ?')) return;

    const result = deleteChapterViewModel(actId, chapterId, typeof currentChapterId !== 'undefined' ? currentChapterId : null);

    if (result.success) {
        processStructureSideEffects(result.sideEffects);
        renderActsList();
        if (result.message) showNotification(result.message, 'success');
    } else {
        showNotification(result.message || 'Erreur lors de la suppression', 'error');
    }
}

function addScene() {
    const titleInput = document.getElementById('sceneTitleInput');
    const result = addSceneViewModel(
        (titleInput.value || '').trim(),
        typeof activeActId !== 'undefined' ? activeActId : null,
        typeof activeChapterId !== 'undefined' ? activeChapterId : null
    );

    if (result.success) {
        processStructureSideEffects(result.sideEffects);
        titleInput.value = '';
        closeModal('addSceneModal');
        renderActsList();
        if (result.message) showNotification(result.message, 'success');
    } else {
        showNotification(result.message || 'Erreur lors de l\'ajout', 'error');
    }
}

function deleteScene(actId, chapterId, sceneId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette scène ?')) return;

    const result = deleteSceneViewModel(actId, chapterId, sceneId, typeof currentSceneId !== 'undefined' ? currentSceneId : null);

    if (result.success) {
        processStructureSideEffects(result.sideEffects);
        renderActsList();
        if (result.message) showNotification(result.message, 'success');
    } else {
        showNotification(result.message || 'Erreur lors de la suppression', 'error');
    }
}

function setSceneStatus(actId, chapterId, sceneId, status) {
    const result = setSceneStatusViewModel(actId, chapterId, sceneId, status);

    if (result.success) {
        processStructureSideEffects(result.sideEffects);
        closeStatusMenu();
        renderActsList();
        updateProgressBar();

        // Mettre à jour le header si c'est la scène actuellement ouverte
        const activeSceneId = (typeof currentSceneId !== 'undefined') ? currentSceneId : (window.currentSceneId || null);
        if (activeSceneId == sceneId && typeof updateEditorHeaderStatus === 'function') {
            updateEditorHeaderStatus(status);
        }

        // Toujours tenter de mettre à jour l'indicateur de progression de l'éditeur (Acte/Livre/Chapitre)
        if (typeof updateEditorProgressIndicator === 'function') {
            updateEditorProgressIndicator();
        }
    }
}

// --- ÉDITION DIRECTE (RENOMMAGE) ---

function startEditingAct(actId, element) {
    const originalText = element.textContent.trim();
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'editing-input';
    input.value = originalText;

    element.textContent = '';
    element.appendChild(input);
    input.focus();
    input.select();

    const finish = () => {
        const newTitle = input.value.trim();
        if (newTitle && newTitle !== originalText) {
            const result = updateActViewModel(actId, { title: newTitle });
            if (result.success) processStructureSideEffects(result.sideEffects);
        }
        renderActsList();
    };

    input.onblur = finish;
    input.onkeydown = (e) => { e.key === 'Enter' && finish(); e.key === 'Escape' && renderActsList(); };
}

function startEditingChapter(actId, chapterId, element) {
    const originalText = element.textContent.trim();
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'editing-input';
    input.value = originalText;

    element.textContent = '';
    element.appendChild(input);
    input.focus();
    input.select();

    const finish = () => {
        const newTitle = input.value.trim();
        if (newTitle && newTitle !== originalText) {
            const result = updateChapterViewModel(actId, chapterId, { title: newTitle });
            if (result.success) {
                processStructureSideEffects(result.sideEffects);
                // Update editor if this chapter is currently open
                if (typeof currentChapterId !== 'undefined' && currentChapterId === chapterId) {
                    const breadcrumb = document.querySelector('.editor-breadcrumb');
                    if (breadcrumb) breadcrumb.textContent = `${result.updatedActTitle} > ${newTitle}`;
                }
            }
        }
        renderActsList();
    };

    input.onblur = finish;
    input.onkeydown = (e) => { e.key === 'Enter' && finish(); e.key === 'Escape' && renderActsList(); };
}

function startEditingScene(actId, chapterId, sceneId, element) {
    const originalText = element.textContent.trim();
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'editing-input';
    input.value = originalText;

    element.textContent = '';
    element.appendChild(input);
    input.focus();
    input.select();

    const finish = () => {
        const newTitle = input.value.trim();
        if (newTitle && newTitle !== originalText) {
            const result = updateSceneViewModel(actId, chapterId, sceneId, { title: newTitle });
            if (result.success) {
                processStructureSideEffects(result.sideEffects);
                // Update editor title if open
                if (typeof currentSceneId !== 'undefined' && currentSceneId === sceneId) {
                    const editorTitle = document.querySelector('.editor-title');
                    if (editorTitle) editorTitle.textContent = newTitle;
                }
            }
        }
        renderActsList();
    };

    input.onblur = finish;
    input.onkeydown = (e) => { e.key === 'Enter' && finish(); e.key === 'Escape' && renderActsList(); };
}

// --- RENDU (ARBORESCENCE) ---

function renderActsList() {
    const container = document.getElementById('chaptersList');
    if (!container) return;

    // Save scroll position before rendering
    const scrollTop = container.scrollTop;

    const vm = getStructureViewModel();
    if (!vm.acts || vm.acts.length === 0) {
        container.innerHTML = `
            <div style="padding: 2rem; text-align: center; color: var(--text-muted);">
                <div style="margin-bottom: 1rem;">${Localization.t('sidebar.empty.no_chapters')}</div>
                <button class="btn btn-primary" onclick="openAddChapterModal()">${Localization.t('btn.add_chapter')}</button>
            </div>`;
        return;
    }

    let html = '<div style="padding: 0 0.5rem;">';

    // Item "Tout le livre"
    const isFullBookActive = (typeof currentActId !== 'undefined' && currentActId === 'all');
    html += `
        <div class="act-group" id="full-book-item">
            <div class="act-header ${isFullBookActive ? 'active' : ''}" onclick="openFullBook()" style="margin-bottom: 0.5rem; border-left: 3px solid var(--accent-gold); position: relative;">
                <span class="act-icon"><i data-lucide="book" style="width:14px;height:14px;vertical-align:middle;"></i></span>
                <span class="act-title" style="text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">${Localization.t('structure.all_book')}</span>
                <div class="treeview-item-actions">
                    <button class="treeview-action-btn" onclick="event.stopPropagation(); openFullBook({ forceNew: true })" title="${Localization.t('tabs.open_new')}"><i data-lucide="plus-square" style="width:12px;height:12px;"></i></button>
                    <button class="treeview-action-btn" onclick="event.stopPropagation(); openFullBook({ replaceCurrent: true })" title="${Localization.t('tabs.replace')}"><i data-lucide="maximize-2" style="width:12px;height:12px;"></i></button>
                </div>
            </div>
        </div>`;

    vm.acts.forEach((act) => {
        const actStats = getActStats(act);
        const isActExpanded = typeof expandedActs !== 'undefined' && expandedActs.has(act.id);
        const sAct = formatWordCount(actStats.totalWords);

        html += `
            <div class="act-group" id="act-${act.id}" data-act-id="${act.id}">
                <div class="act-header ${typeof currentActId !== 'undefined' && currentActId === act.id ? 'active' : ''}" data-act-id="${act.id}" style="position: relative; display: flex; align-items: center;">
                    <span class="act-icon ${isActExpanded ? 'expanded' : ''}" onclick="toggleAct(${act.id}); event.stopPropagation();" style="cursor: pointer;"><i data-lucide="${isActExpanded ? 'chevron-down' : 'chevron-right'}" style="width:14px;height:14px;vertical-align:middle;"></i></span>
                    <span class="act-title" ondblclick="event.stopPropagation(); startEditingAct(${act.id}, this)" onclick="${act.chapters.length > 0 ? `openAct(${act.id})` : ''}">${act.title}</span>
                    <span class="word-count-badge" style="margin-left: auto; margin-right: 55px;" title="${actStats.totalWords.toLocaleString()} mots">${sAct}</span>
                    <span class="drag-handle" draggable="true" onclick="event.stopPropagation()"><i data-lucide="grip-vertical" style="width:12px;height:12px;vertical-align:middle;"></i></span>
                    <div class="treeview-item-actions">
                        <button class="treeview-action-btn" onclick="event.stopPropagation(); openAct(${act.id}, { forceNew: true })" title="${Localization.t('tabs.open_new')}"><i data-lucide="plus-square" style="width:12px;height:12px;"></i></button>
                        <button class="treeview-action-btn" onclick="event.stopPropagation(); openAct(${act.id}, { replaceCurrent: true })" title="${Localization.t('tabs.replace')}"><i data-lucide="maximize-2" style="width:12px;height:12px;"></i></button>
                        <button class="treeview-action-btn delete" onclick="event.stopPropagation(); deleteAct(${act.id})"><i data-lucide="x" style="width:12px;height:12px;"></i></button>
                    </div>
                </div>
                <div class="act-chapters ${isActExpanded ? 'visible' : ''}">`;

        act.chapters.forEach((chapter) => {
            const chStats = getChapterStats(chapter);
            const isChExpanded = typeof expandedChapters !== 'undefined' && expandedChapters.has(chapter.id);
            const sCh = formatWordCount(chStats.totalWords);

            html += `
                <div class="chapter-group" id="chapter-${chapter.id}" data-chapter-id="${chapter.id}" data-act-id="${act.id}">
                    <div class="chapter-header ${typeof currentChapterId !== 'undefined' && currentChapterId === chapter.id ? 'active' : ''}" data-chapter-id="${chapter.id}" data-act-id="${act.id}" style="position: relative; display: flex; align-items: center;">
                        <span class="chapter-icon ${isChExpanded ? 'expanded' : ''}" onclick="toggleChapter(${act.id}, ${chapter.id}); event.stopPropagation();" style="cursor: pointer;"><i data-lucide="${isChExpanded ? 'chevron-down' : 'chevron-right'}" style="width:14px;height:14px;vertical-align:middle;"></i></span>
                        <span class="chapter-title" ondblclick="event.stopPropagation(); startEditingChapter(${act.id}, ${chapter.id}, this)" onclick="${chapter.scenes.length > 0 ? `openChapter(${act.id}, ${chapter.id})` : ''}">${chapter.title}</span>
                        <span class="word-count-badge" style="margin-left: auto; margin-right: 55px;" title="${chStats.totalWords.toLocaleString()} mots">${sCh}</span>
                        <span class="drag-handle" draggable="true" onclick="event.stopPropagation()"><i data-lucide="grip-vertical" style="width:12px;height:12px;vertical-align:middle;"></i></span>
                        <div class="treeview-item-actions">
                            <button class="treeview-action-btn" onclick="event.stopPropagation(); openChapter(${act.id}, ${chapter.id}, { forceNew: true })" title="${Localization.t('tabs.open_new')}"><i data-lucide="plus-square" style="width:12px;height:12px;"></i></button>
                            <button class="treeview-action-btn" onclick="event.stopPropagation(); openChapter(${act.id}, ${chapter.id}, { replaceCurrent: true })" title="${Localization.t('tabs.replace')}"><i data-lucide="maximize-2" style="width:12px;height:12px;"></i></button>
                            <button class="treeview-action-btn delete" onclick="event.stopPropagation(); deleteChapter(${act.id}, ${chapter.id})"><i data-lucide="x" style="width:12px;height:12px;"></i></button>
                        </div>
                    </div>
                    <div class="scenes-list ${isChExpanded ? 'visible' : ''}">`;

            chapter.scenes.forEach((scene) => {
                const sStatus = scene.status || 'draft';
                const sWords = (scene.content && typeof StatsModel !== 'undefined') ? StatsModel.getWordCount(scene.content) : (scene.wordCount || 0);
                const synopsis = scene.synopsis ? (scene.synopsis.substring(0, 100) + (scene.synopsis.length > 100 ? '...' : '')) : '';
                const tooltip = scene.synopsis ? scene.synopsis.replace(/"/g, '&quot;').replace(/'/g, '&#39;') : '';
                const isActive = typeof currentSceneId !== 'undefined' && currentSceneId == scene.id;
                const sLabel = formatWordCount(sWords);

                html += `
                    <div class="scene-item ${isActive ? 'active' : ''}" data-scene-id="${scene.id}" data-chapter-id="${chapter.id}" data-act-id="${act.id}" onclick="openScene(${act.id}, ${chapter.id}, ${scene.id})" ${tooltip ? `title="${tooltip}"` : ''} style="position: relative; display: flex; align-items: center;">
                        <div style="display: flex; align-items: center; gap: 0.6rem; flex: 1; min-width: 0;">
                            <span class="status-badge status-${sStatus}" onclick="event.stopPropagation(); toggleSceneStatus(${act.id}, ${chapter.id}, ${scene.id}, event)" style="cursor: pointer;" title="Cliquez pour changer le statut"></span>
                            <div style="flex: 1; min-width: 0; overflow: hidden;">
                                <span ondblclick="event.stopPropagation(); startEditingScene(${act.id}, ${chapter.id}, ${scene.id}, this)" style="display: block;">${scene.title}</span>
                                ${synopsis ? `<span class="scene-synopsis">${synopsis}</span>` : ''}
                            </div>
                        </div>
                        <span class="word-count-badge" style="margin-left: auto; margin-right: 55px; flex-shrink: 0; min-width: 30px; text-align: right;">${sLabel}</span>
                        <span class="drag-handle" draggable="true" onclick="event.stopPropagation()"><i data-lucide="grip-vertical" style="width:12px;height:12px;vertical-align:middle;"></i></span>
                        <div class="treeview-item-actions">
                            <button class="treeview-action-btn" onclick="event.stopPropagation(); openScene(${act.id}, ${chapter.id}, ${scene.id}, { forceNew: true })" title="${Localization.t('tabs.open_new')}"><i data-lucide="plus-square" style="width:12px;height:12px;"></i></button>
                            <button class="treeview-action-btn" onclick="event.stopPropagation(); openScene(${act.id}, ${chapter.id}, ${scene.id}, { replaceCurrent: true })" title="${Localization.t('tabs.replace')}"><i data-lucide="maximize-2" style="width:12px;height:12px;"></i></button>
                            <button class="treeview-action-btn delete" onclick="event.stopPropagation(); deleteScene(${act.id}, ${chapter.id}, ${scene.id})"><i data-lucide="x" style="width:12px;height:12px;"></i></button>
                        </div>
                    </div>`;
            });

            // Add Scene button
            html += `<div class="scene-item action-btn" onclick="openAddSceneModal(${act.id}, ${chapter.id})" style="opacity: 0.4; font-size: 0.85rem; padding-left: 2.2rem;">${Localization.t('sidebar.btn.add_scene')}</div>
                    </div>
                </div>`;
        });

        // Add Chapter button
        html += `<div class="chapter-header action-btn" onclick="openAddChapterModal(${act.id})" style="opacity: 0.4; font-size: 0.85rem; padding-left: 1.5rem;">${Localization.t('sidebar.btn.add_chapter')}</div>
                </div>
            </div>`;
    });

    html += '</div>';
    container.innerHTML = html;

    // Post-render actions
    if (typeof setupActDragAndDrop === 'function') setupActDragAndDrop();
    if (typeof setupChapterDragAndDrop === 'function') setupChapterDragAndDrop();
    if (typeof setupSceneDragAndDrop === 'function') setupSceneDragAndDrop();
    if (typeof updateStats === 'function') updateStats();
    if (typeof updateProgressBar === 'function') updateProgressBar();
    if (typeof applyStatusFilters === 'function') applyStatusFilters();
    if (typeof restoreTreeState === 'function') restoreTreeState();

    if (typeof lucide !== 'undefined') lucide.createIcons();

    // Restore scroll position
    container.scrollTop = scrollTop;
}

// --- STATS HELPERS ---

function getActStats(act) {
    let totalWords = 0;
    if (act.chapters) {
        act.chapters.forEach(chapter => {
            const chStats = getChapterStats(chapter);
            totalWords += chStats.totalWords;
        });
    }
    return { totalWords };
}

function getChapterStats(chapter) {
    let totalWords = 0;
    if (chapter.scenes) {
        chapter.scenes.forEach(scene => {
            const words = (scene.content && typeof StatsModel !== 'undefined') ? StatsModel.getWordCount(scene.content) : (scene.wordCount || 0);
            totalWords += words;
        });
    }
    return { totalWords };
}

function formatWordCount(count) {
    if (typeof StatsViewModel !== 'undefined' && typeof StatsViewModel.formatWordCount === 'function') {
        return StatsViewModel.formatWordCount(count);
    }
    if (count >= 1000) {
        return (count / 1000).toFixed(1).replace('.0', '') + 'k';
    }
    return count.toString() || '0';
}

// --- ORCHESTRATION ---

function processStructureSideEffects(sideEffects) {
    if (!sideEffects) return;

    // 1. Repository
    if (sideEffects.repository) {
        const actions = Array.isArray(sideEffects.repository) ? sideEffects.repository : [sideEffects.repository];
        actions.forEach(action => executeRepositorySideEffect(action));
    }

    // 2. Expansion
    if (sideEffects.shouldExpand && typeof expandedActs !== 'undefined') expandedActs.add(sideEffects.shouldExpand);
    if (sideEffects.shouldExpandAct && typeof expandedActs !== 'undefined') expandedActs.add(sideEffects.shouldExpandAct);
    if (sideEffects.shouldExpandChapter && typeof expandedChapters !== 'undefined') expandedChapters.add(sideEffects.shouldExpandChapter);

    // 3. Navigation State
    if (sideEffects.shouldResetState) {
        if (typeof currentActId !== 'undefined') currentActId = null;
        if (typeof currentChapterId !== 'undefined') currentChapterId = null;
        if (typeof currentSceneId !== 'undefined') currentSceneId = null;
        if (typeof showEmptyState === 'function') showEmptyState();
    }

    // 4. Persistence
    if (sideEffects.shouldSave && typeof saveProject === 'function') saveProject();
    if (sideEffects.shouldOpenScene) {
        const { actId, chapterId, sceneId } = sideEffects.shouldOpenScene;
        if (typeof openScene === 'function') openScene(actId, chapterId, sceneId);
    }
}

function executeRepositorySideEffect(effect) {
    if (!effect) return;
    const { action, collection, id, data, updates, actId, chapterId } = effect;

    let repo;
    if (collection === 'acts') repo = ActRepository;
    else if (collection === 'chapters') repo = ChapterRepository;
    else if (collection === 'scenes') repo = SceneRepository;

    if (!repo) return;

    switch (action) {
        case 'ADD':
            if (collection === 'acts') repo.add(data);
            else if (collection === 'chapters') repo.add(actId, data);
            else if (collection === 'scenes') repo.add(actId, chapterId, data);
            break;
        case 'UPDATE':
            if (collection === 'acts') repo.update(id, updates);
            else if (collection === 'chapters') repo.update(actId, id, updates);
            else if (collection === 'scenes') repo.update(actId, chapterId, id, updates);
            break;
        case 'REMOVE':
            if (collection === 'acts') repo.remove(id);
            else if (collection === 'chapters') repo.remove(actId, id);
            else if (collection === 'scenes') repo.remove(actId, chapterId, id);
            break;
    }
}

// --- UTILITAIRES DE VUE ---

function toggleAct(actId) {
    if (typeof expandedActs === 'undefined') return;
    if (expandedActs.has(actId)) expandedActs.delete(actId);
    else expandedActs.add(actId);

    if (typeof saveTreeState === 'function') saveTreeState();
    renderActsList();
}

function toggleChapter(actId, chapterId) {
    if (typeof expandedChapters === 'undefined') return;
    if (expandedChapters.has(chapterId)) expandedChapters.delete(chapterId);
    else expandedChapters.add(chapterId);

    if (typeof saveTreeState === 'function') saveTreeState();
    renderActsList();
}

function expandAll() {
    const vm = getStructureViewModel();
    vm.acts.forEach(act => {
        if (typeof expandedActs !== 'undefined') expandedActs.add(act.id);
        act.chapters.forEach(ch => {
            if (typeof expandedChapters !== 'undefined') expandedChapters.add(ch.id);
        });
    });
    if (typeof saveTreeState === 'function') saveTreeState();
    renderActsList();
}

function collapseAll() {
    if (typeof expandedActs !== 'undefined') expandedActs.clear();
    if (typeof expandedChapters !== 'undefined') expandedChapters.clear();
    if (typeof saveTreeState === 'function') saveTreeState();
    renderActsList();
}

function openAddActModal() {
    const modal = document.getElementById('addActModal');
    if (modal) {
        modal.classList.add('active');
        const input = document.getElementById('actTitleInput');
        if (input) setTimeout(() => input.focus(), 100);
    }
}

function openAddChapterModal(actId) {
    if (actId) activeActId = actId;
    else {
        const vm = getStructureViewModel();
        if (vm.acts.length > 0) {
            activeActId = vm.acts[0].id;
        } else {
            activeActId = null;
        }
    }
    const modal = document.getElementById('addChapterModal');
    if (modal) {
        modal.classList.add('active');
        const input = document.getElementById('chapterTitleInput');
        if (input) setTimeout(() => input.focus(), 100);
    }
}

function openAddSceneModal(actId, chapterId) {
    if (actId) activeActId = actId;
    if (chapterId) activeChapterId = chapterId;
    const modal = document.getElementById('addSceneModal');
    if (modal) {
        modal.classList.add('active');
        const input = document.getElementById('sceneTitleInput');
        if (input) setTimeout(() => input.focus(), 100);
    }
}

function openAddSceneModalQuick() {
    if (typeof currentActId !== 'undefined' && typeof currentChapterId !== 'undefined' && currentActId && currentChapterId) {
        openAddSceneModal(currentActId, currentChapterId);
    } else {
        const vm = getStructureViewModel();
        if (vm.acts.length > 0 && vm.acts[0].chapters.length > 0) {
            openAddSceneModal(vm.acts[0].id, vm.acts[0].chapters[0].id);
        } else {
            showNotification('Créez d\'abord un chapitre', 'info');
        }
    }
}

// [MVVM : View]
// Applique visuellement les filtres de statut dans l'arborescence
function applyStatusFilters() {
    // Appliquer les filtres à toutes les scènes
    document.querySelectorAll('.scene-item[data-scene-id]').forEach(sceneEl => {
        const sceneId = parseInt(sceneEl.dataset.sceneId);
        const actId = parseInt(sceneEl.dataset.actId);
        const chapterId = parseInt(sceneEl.dataset.chapterId);

        const vm = getStructureViewModel();
        const act = vm.acts.find(a => a.id === actId);
        if (!act) return;
        const chapter = act.chapters.find(c => c.id === chapterId);
        if (!chapter) return;
        const scene = chapter.scenes.find(s => s.id === sceneId);
        if (!scene) return;

        const status = scene.status || 'draft';

        if (activeStatusFilters.includes(status)) {
            sceneEl.classList.remove('filtered-out');
        } else {
            sceneEl.classList.add('filtered-out');
        }
    });

    // Cacher les chapitres dont toutes les scènes sont filtrées (mais pas les chapitres vides)
    document.querySelectorAll('.chapter-group').forEach(chapterEl => {
        const allScenes = chapterEl.querySelectorAll('.scene-item[data-scene-id]');
        const visibleScenes = chapterEl.querySelectorAll('.scene-item[data-scene-id]:not(.filtered-out)');

        // Si le chapitre a des scènes mais aucune visible, le cacher
        // Si le chapitre n'a pas de scènes (vide), le garder visible
        if (allScenes.length > 0 && visibleScenes.length === 0) {
            chapterEl.classList.add('filtered-out');
        } else {
            chapterEl.classList.remove('filtered-out');
        }
    });

    // Cacher les actes dont tous les chapitres sont filtrés (mais pas les actes avec chapitres vides)
    document.querySelectorAll('.act-group').forEach(actEl => {
        const allChapters = actEl.querySelectorAll('.chapter-group');
        const visibleChapters = actEl.querySelectorAll('.chapter-group:not(.filtered-out)');

        // Si l'acte a des chapitres mais aucun visible, le cacher
        // Si l'acte n'a pas de chapitres (vide), le garder visible
        if (allChapters.length > 0 && visibleChapters.length === 0) {
            actEl.classList.add('filtered-out');
        } else {
            actEl.classList.remove('filtered-out');
        }
    });
}

/* [MVVM] View */
function updateProgressBar() {
    let counts = { draft: 0, progress: 0, complete: 0, review: 0 };
    let total = 0;

    const vm = getStructureViewModel();
    vm.acts.forEach(act => {
        act.chapters.forEach(chapter => {
            chapter.scenes.forEach(scene => {
                const status = scene.status || 'draft';
                counts[status] = (counts[status] || 0) + 1;
                total++;
            });
        });
    });

    // Mettre à jour les compteurs
    document.getElementById('countDraft').textContent = counts.draft;
    document.getElementById('countProgress').textContent = counts.progress;
    document.getElementById('countComplete').textContent = counts.complete;
    document.getElementById('countReview').textContent = counts.review;

    // Mettre à jour le texte de progression
    const completedPercent = total > 0 ? Math.round((counts.complete / total) * 100) : 0;
    document.getElementById('progressStatsText').textContent = Localization.t('sidebar.progress.scenecount', [total, total > 1 ? 's' : '']);
    document.getElementById('progressPercent').textContent = Localization.t('sidebar.progress.percent', [completedPercent]);

    // Mettre à jour les segments de la barre
    if (total > 0) {
        document.getElementById('progressComplete').style.width = `${(counts.complete / total) * 100}%`;
        document.getElementById('progressReview').style.width = `${(counts.review / total) * 100}%`;
        document.getElementById('progressProgress').style.width = `${(counts.progress / total) * 100}%`;
        document.getElementById('progressDraft').style.width = `${(counts.draft / total) * 100}%`;
    } else {
        document.getElementById('progressComplete').style.width = '0%';
        document.getElementById('progressReview').style.width = '0%';
        document.getElementById('progressProgress').style.width = '0%';
        document.getElementById('progressDraft').style.width = '0%';
    }
}

// [MVVM : View]
// Ouvre le menu contextuel de statut d'une scène
function toggleSceneStatus(actId, chapterId, sceneId, event) {
    event = event || window.event;
    event.stopPropagation();

    // Fermer tout menu existant
    closeStatusMenu();

    const vm = getStructureViewModel();
    const act = vm.acts.find(a => a.id === actId);
    if (!act) return;

    const chapter = act.chapters.find(c => c.id === chapterId);
    if (!chapter) return;

    const scene = chapter.scenes.find(s => s.id === sceneId);
    if (!scene) return;

    const currentStatus = scene.status || 'draft';

    // Créer le menu contextuel
    const menu = document.createElement('div');
    menu.className = 'status-menu visible';
    menu.id = 'statusMenu';
    menu.innerHTML = `
                <div class="status-menu-item ${currentStatus === 'draft' ? 'active' : ''}" onclick="setSceneStatus(${actId}, ${chapterId}, ${sceneId}, 'draft')">
                    <span class="status-menu-dot draft"></span>
                    <span>Brouillon</span>
                </div>
                <div class="status-menu-item ${currentStatus === 'progress' ? 'active' : ''}" onclick="setSceneStatus(${actId}, ${chapterId}, ${sceneId}, 'progress')">
                    <span class="status-menu-dot progress"></span>
                    <span>En cours</span>
                </div>
                <div class="status-menu-item ${currentStatus === 'complete' ? 'active' : ''}" onclick="setSceneStatus(${actId}, ${chapterId}, ${sceneId}, 'complete')">
                    <span class="status-menu-dot complete"></span>
                    <span>Terminé</span>
                </div>
                <div class="status-menu-item ${currentStatus === 'review' ? 'active' : ''}" onclick="setSceneStatus(${actId}, ${chapterId}, ${sceneId}, 'review')">
                    <span class="status-menu-dot review"></span>
                    <span>À réviser</span>
                </div>
            `;

    // Positionner le menu en position fixe près du clic
    const badge = event.target.closest('.status-badge') || event.target.closest('.header-status');
    if (badge) {
        const rect = badge.getBoundingClientRect();
        menu.style.top = (rect.bottom + 5) + 'px';
        menu.style.left = (rect.left - 100) + 'px'; // Décaler vers la gauche

        // S'assurer que le menu ne sort pas de l'écran
        document.body.appendChild(menu);

        const menuRect = menu.getBoundingClientRect();
        if (menuRect.right > window.innerWidth) {
            menu.style.left = (window.innerWidth - menuRect.width - 10) + 'px';
        }
        if (menuRect.left < 0) {
            menu.style.left = '10px';
        }
        if (menuRect.bottom > window.innerHeight) {
            menu.style.top = (rect.top - menuRect.height - 5) + 'px';
        }

        currentStatusMenu = menu;
    }

    // Fermer le menu si on clique ailleurs
    setTimeout(() => {
        document.addEventListener('click', closeStatusMenuOnClickOutside);
    }, 10);
}

// [MVVM : View]
// Ferme le menu de statut
function closeStatusMenu() {
    const menu = document.getElementById('statusMenu');
    if (menu) {
        menu.remove();
    }
    currentStatusMenu = null;
    document.removeEventListener('click', closeStatusMenuOnClickOutside);
}

// [MVVM : View]
// Gère la fermeture du menu au clic extérieur
function closeStatusMenuOnClickOutside(event) {
    if (currentStatusMenu && !currentStatusMenu.contains(event.target)) {
        closeStatusMenu();
    }
}

/**
 * [MVVM : View]
 * Génère le HTML pour les liens personnages d'une scène.
 */
function renderSceneCharacters(actId, chapterId, scene) {
    if (!scene.linkedCharacters || scene.linkedCharacters.length === 0) {
        return '<span style="font-size: 0.8rem; color: var(--text-muted); font-style: italic;">Aucun personnage lié</span>';
    }

    const vm = getStructureViewModel();
    return scene.linkedCharacters.map(charId => {
        const character = vm.characters.find(c => c.id === charId);
        if (!character) return '';
        return `
            <span class="link-badge" onclick="event.stopPropagation(); switchView('characters'); openCharacterDetail(${charId});">
                ${character.name}
                <span class="link-badge-remove" onclick="event.stopPropagation(); toggleCharacterInScene(${actId}, ${chapterId}, ${scene.id}, ${charId}); openScene(${actId}, ${chapterId}, ${scene.id});"><i data-lucide="x" style="width:10px;height:10px;"></i></span>
            </span>`;
    }).join('');
}

/**
 * [MVVM : View]
 * Génère le HTML pour les liens éléments/lieux d'une scène.
 */
function renderSceneElements(actId, chapterId, scene) {
    if (!scene.linkedElements || scene.linkedElements.length === 0) {
        return '<span style="font-size: 0.8rem; color: var(--text-muted); font-style: italic;">Aucun élément lié</span>';
    }

    const vm = getStructureViewModel();
    return scene.linkedElements.map(elemId => {
        const element = vm.world.find(e => e.id === elemId);
        if (!element) return '';
        return `
            <span class="link-badge" onclick="event.stopPropagation(); switchView('world'); openWorldDetail(${elemId});">
                ${element.name}
                <span class="link-badge-remove" onclick="event.stopPropagation(); toggleElementInScene(${actId}, ${chapterId}, ${scene.id}, ${elemId}); openScene(${actId}, ${chapterId}, ${scene.id});"><i data-lucide="x" style="width:10px;height:10px;"></i></span>
           </span>`;
    }).join('');
}

/**
 * [MVVM : View]
 * Génère le HTML pour les événements temporels liés à une scène.
 */
function renderSceneMetroEvents(sceneId) {
    const vm = getStructureViewModel();
    if (!vm.metroTimeline || vm.metroTimeline.length === 0) {
        return '<span style="font-size: 0.8rem; color: var(--text-muted); font-style: italic;">Aucun événement</span>';
    }

    const linkedEvents = vm.metroTimeline.filter(event => event.sceneId == sceneId);
    if (linkedEvents.length === 0) {
        return '<span style="font-size: 0.8rem; color: var(--text-muted); font-style: italic;">Aucun événement lié</span>';
    }

    return linkedEvents.map(event => `
        <span class="link-badge" style="background: var(--accent-blue); color: white;" onclick="event.stopPropagation(); openMetroEventFromScene(${event.id});" title="${event.date || 'Sans date'}">
            <i data-lucide="train-track" style="width:12px;height:12px;vertical-align:middle;margin-right:2px;"></i>
            ${event.title}
        </span>`).join('');
}

/**
 * [MVVM : View]
 * Ouvre la modale pour lier des personnages.
 */
function openCharacterLinker(actId, chapterId, sceneId) {
    const vm = getStructureViewModel();
    const act = vm.acts.find(a => a.id === actId);
    const chapter = act?.chapters.find(c => c.id === chapterId);
    const scene = chapter?.scenes.find(s => s.id === sceneId);
    if (!scene) return;

    const titleEl = document.getElementById('referencesModalTitle');
    const contentEl = document.getElementById('referencesModalContent');
    if (titleEl) titleEl.textContent = 'Lier des personnages à cette scène';

    if (contentEl) {
        contentEl.innerHTML = `
            <div class="tag-selector">
                ${project.characters.map(char => {
            const isLinked = scene.confirmedPresentCharacters && scene.confirmedPresentCharacters.includes(char.id);
            return `
                        <div class="tag-option ${isLinked ? 'selected' : ''}" 
                             onclick="toggleCharacterLinkerAction(${char.id}); this.classList.toggle('selected');">
                            ${char.name}
                        </div>`;
        }).join('')}
            </div>
            ${project.characters.length === 0 ? '<p style="color: var(--text-muted); margin-top: 1rem;">Aucun personnage créé. Créez des personnages dans l\'onglet Personnages.</p>' : ''}`;
    }

    const modal = document.getElementById('referencesModal');
    if (modal) modal.classList.add('active');
}

/**
 * [MVVM : View]
 * Ouvre la modale pour lier des éléments.
 */
function openElementLinker(actId, chapterId, sceneId) {
    const act = project.acts.find(a => a.id === actId);
    const chapter = act?.chapters.find(c => c.id === chapterId);
    const scene = chapter?.scenes.find(s => s.id === sceneId);
    if (!scene) return;

    const titleEl = document.getElementById('referencesModalTitle');
    const contentEl = document.getElementById('referencesModalContent');
    if (titleEl) titleEl.textContent = 'Lier des lieux/éléments à cette scène';

    if (contentEl) {
        contentEl.innerHTML = `
            <div class="tag-selector">
                ${project.world.map(elem => {
            const isLinked = scene.linkedElements && scene.linkedElements.includes(elem.id);
            return `
                        <div class="tag-option ${isLinked ? 'selected' : ''}" 
                             onclick="toggleElementInScene(${actId}, ${chapterId}, ${sceneId}, ${elem.id}); this.classList.toggle('selected');">
                            ${elem.name} <small>(${elem.type})</small>
                        </div>`;
        }).join('')}
            </div>
            ${project.world.length === 0 ? '<p style="color: var(--text-muted); margin-top: 1rem;">Aucun élément créé. Créez des lieux dans l\'onglet Univers.</p>' : ''}`;
    }

    const modal = document.getElementById('referencesModal');
    if (modal) modal.classList.add('active');
}
// --- INITIALISATION ---

// Écouter les changements de langue
window.addEventListener('localeChanged', () => {
    renderActsList();
});
