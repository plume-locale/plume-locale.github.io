/**
 * [MVVM : Structure Organizer View]
 * Vue dédiée à la réorganisation massive de la structure (Actes > Chapitres > Scènes)
 * Style "Gestion de menu WordPress" (Blocs imbriqués et Drag & Drop)
 */

// --- STATE ---
let organizerDragItems = []; // Array of { type, id, parentId, actId }
let organizerSelectedItems = []; // Array of { type, id }
let organizerDragSource = null;
const organizerCollapsedState = { acts: new Set(), chapters: new Set() };

// --- CONFIG ---
const ORGANIZER_STYLES = `
    .organizer-modal {
        position: fixed;
        top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.85);
        backdrop-filter: blur(8px);
        z-index: 10000;
        display: none;
        align-items: center;
        justify-content: center;
    }
    .organizer-modal.active {
        display: flex;
        animation: orgFadeIn 0.25s ease-out;
    }
    @keyframes orgFadeIn { from{opacity:0; transform:scale(0.98);} to{opacity:1; transform:scale(1);} }
    
    .organizer-content {
        width: 96vw; height: 85vh;
        max-width: 1800px;
        background: var(--bg-primary, #ffffff);
        border-radius: 12px;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        box-shadow: 0 30px 80px rgba(0,0,0,0.6);
        border: 1px solid var(--border-color, #e0e0e0);
        color: var(--text-primary, #1a1a1a);
        position: relative;
    }
    
    .organizer-header {
        padding: 1rem 1.5rem;
        border-bottom: 1px solid var(--border-color, #e0e0e0);
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: var(--bg-secondary, #f8f9fa);
    }
    .organizer-header h2 { 
        font-size: 1.2rem; 
        margin: 0; 
        display:flex; 
        gap:12px; 
        align-items:center; 
        font-family: 'Noto Serif JP', serif;
        color: var(--text-primary);
    }
    
    .organizer-body {
        flex: 1;
        overflow-x: auto;
        overflow-y: hidden;
        padding: 1.5rem;
        background: var(--bg-primary, #ffffff);
    }

    /* KANBAN LAYOUT */
    .org-container {
        display: flex;
        flex-direction: row;
        gap: 16px;
        height: 100%;
        align-items: stretch;
        padding-bottom: 8px;
    }
    
    /* ACT COLUMN */
    .org-act {
        flex: 0 0 340px;
        display: flex;
        flex-direction: column;
        background: var(--bg-secondary, #f8f9fa);
        border-radius: 10px;
        max-height: 100%;
        border: 1px solid var(--border-color, #e0e0e0);
        transition: transform 0.2s, box-shadow 0.2s;
        box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    }
    .org-act.dragging { opacity: 0.5; transform: scale(0.95); }
    .org-act.selected-block { border: 2px solid var(--accent-gold, #ffd93d); box-shadow: 0 0 0 1px var(--accent-gold, #ffd93d); }

    .org-act > .org-header {
        padding: 12px 14px;
        background: var(--bg-tertiary, #f0f1f3);
        border-bottom: 1px solid var(--border-color, #e0e0e0);
        border-radius: 10px 10px 0 0;
        font-weight: 700;
        cursor: grab;
        position: sticky; top: 0;
        z-index: 10;
        display: flex; align-items: center; gap: 8px;
        color: var(--text-primary);
    }
    
    /* Default hidden content for collapse logic */
    .org-content { display: none; }

    .org-act.expanded > .org-content {
        flex: 1;
        overflow-y: auto;
        padding: 10px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        min-height: 50px;
    }

    /* CHAPTER CARD */
    .org-chapter {
        background: var(--bg-primary, #ffffff);
        border: 1px solid var(--border-color, #e0e0e0);
        border-radius: 8px;
        box-shadow: 0 2px 6px rgba(0,0,0,0.04);
        display: flex; flex-direction: column;
        margin-bottom: 4px;
        transition: all 0.2s ease;
    }
    .org-chapter.selected-block { border-color: var(--accent-gold, #ffd93d); background: rgba(var(--accent-gold-rgb, 255, 217, 61), 0.1); }
    
    .org-chapter > .org-header {
        padding: 10px 12px;
        font-weight: 600;
        font-size: 0.95rem;
        cursor: pointer;
        border-radius: 8px;
        display: flex; align-items: center; gap: 8px;
        color: var(--text-primary);
    }
    .org-chapter > .org-header:hover { background: rgba(var(--primary-color-rgb, 255, 140, 66), 0.05); }

    .org-chapter.expanded > .org-content {
        display: block;
        padding: 4px 8px 8px 8px;
    }
    
    /* BUTTONS */
    .org-icon-btn { padding: 4px; border-radius: 4px; cursor: pointer; display: flex; align-items: center; justify-content: center; color: var(--text-muted); }
    .org-icon-btn:hover { background: var(--bg-tertiary); color: var(--text-primary); }

    /* SCENE ITEM */
    .org-scene {
        background: transparent;
        border-top: 1px solid var(--border-color, #e0e0e0);
        padding: 6px 0 0 0;
        margin-top: 6px;
    }
    .org-scene:first-child { border-top: none; margin-top: 0; }
    
    .org-scene .org-header {
        padding: 6px 10px;
        font-size: 0.85rem;
        color: var(--text-secondary, #666666);
        border-radius: 4px;
        display: flex; align-items: center; gap: 8px;
        cursor: pointer;
        transition: background 0.2s;
    }
    .org-scene .org-header:hover { background: var(--bg-secondary); color: var(--text-primary); }
    .org-scene.selected-block .org-header { background: rgba(var(--accent-gold-rgb, 255, 217, 61), 0.15); color: var(--text-primary); }

    /* DROP ZONES - IMPROVED HIT TARGETS */
    .org-drop-zone { transition: all 0.2s; opacity: 0; box-sizing: border-box; }
    
    /* Vertical separator for Acts */
    .org-drop-zone[data-type="act-drop"] {
        width: 40px; margin: 0 -20px; cursor: col-resize; z-index: 50;
    }
    .org-drop-zone[data-type="act-drop"].drag-over {
        width: 10px; margin: 0 -5px; background: var(--accent-gold); opacity: 1; border-radius: 5px;
    }

    /* Horizontal separator for Chapters/Scenes */
    .org-drop-zone[data-type="chapter-drop"], .org-drop-zone[data-type="scene-drop"] {
        height: 20px; margin: -10px 0; z-index: 50; position: relative;
    }
    .org-drop-zone[data-type="chapter-drop"].drag-over, .org-drop-zone[data-type="scene-drop"].drag-over {
        height: 40px; margin: 4px 0; background: rgba(var(--accent-gold-rgb, 255, 217, 61), 0.1); border: 2px dashed var(--accent-gold); opacity: 1; border-radius: 8px; z-index: 49;
    }
    
    .org-header.drag-over-folder {
        background: rgba(var(--accent-gold-rgb, 255, 217, 61), 0.2) !important;
        outline: 2px solid var(--accent-gold, #ffd93d);
    }

    /* UTILS */
    .org-stats { font-size: 0.75rem; color: var(--text-muted); margin-left: auto; font-family: 'Source Code Pro', monospace; }
    .org-count { font-size: 0.7rem; background: var(--bg-tertiary); color: var(--text-secondary); padding: 2px 6px; border-radius: 10px; font-weight: 500; }
    
    /* ICONS in headers */
    .organizer-modal .drag-handle { opacity: 0.4; width: 14px; height: 14px !important; color: var(--text-muted); position: static !important; }
    .org-header:hover .drag-handle { opacity: 1; color: var(--text-primary); }
    
    .organizer-modal .toggle-icon { transition: transform 0.2s; transform: rotate(-90deg); }
    .org-block.expanded .toggle-icon { transform: rotate(0deg); }
    
    .organizer-modal .empty-placeholder { opacity: 1 !important; margin: 12px 0 !important; height: 60px !important; border-radius: 8px; background: var(--bg-tertiary); border: 1px dashed var(--border-color) !important; color: var(--text-muted) !important; font-size: 0.9rem; }
`;;
// --- UI HELPERS ---

function ensureOrganizerStyles() {
    let style = document.getElementById('organizer-styles');
    if (!style) {
        style = document.createElement('style');
        style.id = 'organizer-styles';
        document.head.appendChild(style);
    }
    style.textContent = ORGANIZER_STYLES;

    if (!document.getElementById('organizerModal')) {
        const modal = document.createElement('div');
        modal.id = 'organizerModal';
        modal.className = 'organizer-modal';
        modal.onclick = (e) => { if (e.target === modal) closeOrganizer(); };
        modal.innerHTML = `
            <div class="organizer-content">
                <div class="organizer-header">
                    <h2><i data-lucide="layout-list"></i> ${Localization.t('dragndrop.organizer.title')}</h2>
                    <div style="display:flex; gap:10px; align-items: center;">
                        <button class="btn btn-secondary" onclick="expandAllOrganizer()">${Localization.t('dragndrop.organizer.expand_all')}</button>
                        <button class="btn btn-secondary" onclick="collapseAllOrganizer()">${Localization.t('dragndrop.organizer.collapse_all')}</button>
                        <div style="width: 1px; height: 24px; background: var(--border-color, #e0e0e0); margin: 0 5px;"></div>
                        <button class="btn btn-primary" onclick="closeOrganizer()">${Localization.t('dragndrop.organizer.finish')}</button>
                        <button class="org-icon-btn" onclick="closeOrganizer()" title="${Localization.t('btn.close')}" style="margin-left: 5px;">
                            <i data-lucide="x" style="width: 20px; height: 20px;"></i>
                        </button>
                    </div>
                </div>
                <div id="organizerBody" class="organizer-body">
                    <!-- CONTENT HERE -->
                </div>
            </div>
    `;
        document.body.appendChild(modal);
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
}

// --- KEYBOARD HANDLER ---
function handleOrganizerKeyDown(e) {
    if (e.key === 'Escape') {
        const modal = document.getElementById('organizerModal');
        if (modal && modal.classList.contains('active')) {
            closeOrganizer();
        }
    }
}

// --- MAIN FUNCTIONS ---

function openStructureOrganizer() {
    ensureOrganizerStyles();
    renderOrganizer();
    document.getElementById('organizerModal').classList.add('active');
    window.addEventListener('keydown', handleOrganizerKeyDown);
}

function closeOrganizer() {
    document.getElementById('organizerModal').classList.remove('active');
    window.removeEventListener('keydown', handleOrganizerKeyDown);
    // Refresh main tree view to reflect changes
    if (typeof renderActsList === 'function') renderActsList();
}

function renderOrganizer() {
    const container = document.getElementById('organizerBody');
    if (!container) return;

    if (!project.acts || project.acts.length === 0) {
        container.innerHTML = `<div style="padding:2rem; text-align:center;">${Localization.t('dragndrop.organizer.empty')}</div>`;
        return;
    }

    let html = '<div class="org-container">';

    project.acts.forEach((act, actIndex) => {
        html += renderOrganizerAct(act, actIndex);
    });

    html += '</div>';
    container.innerHTML = html;

    if (typeof lucide !== 'undefined') lucide.createIcons();
    setupOrganizerEvents();
}

function renderOrganizerAct(act, index) {
    const scenesCount = act.chapters.reduce((sum, ch) => sum + ch.scenes.length, 0);
    const wordCount = act.chapters.reduce((sum, ch) => sum + ch.scenes.reduce((s, scene) => s + ((scene.content && typeof StatsModel !== 'undefined') ? StatsModel.getWordCount(scene.content) : (scene.wordCount || 0)), 0), 0);

    // Drop zone before act
    let html = `<div class="org-drop-zone" data-type="act-drop" data-index="${index}"></div>`;

    const isSelected = organizerSelectedItems.some(i => i.type === 'act' && i.id === act.id);
    const isCollapsed = organizerCollapsedState.acts.has(act.id);

    html += `
        <div class="org-block org-act ${!isCollapsed ? 'expanded' : ''} ${isSelected ? 'selected-block' : ''}" id="org-act-${act.id}" draggable="true" data-type="act" data-id="${act.id}">
            <div class="org-header ${isSelected ? 'selected' : ''}" onclick="handleOrganizerClick(event, 'act', ${act.id})">
                <i data-lucide="grip-vertical" class="drag-handle" style="cursor: grab;"></i>
                <div class="org-icon-btn" onclick="toggleOrganizerBlock(this, event)">
                    <i data-lucide="chevron-down" class="toggle-icon"></i>
                </div>
                <span style="font-weight:bold;">${act.title}</span>
                <span class="org-count">${Localization.t('dragndrop.organizer.count_chapters', [act.chapters.length])}</span>
                <span class="org-stats">${Localization.t('dragndrop.organizer.count_words', [wordCount])}</span>
            </div>
            <div class="org-content" data-parent-type="act" data-parent-id="${act.id}">
    `;

    if (act.chapters.length === 0) {
        html += `<div class="org-drop-zone empty-placeholder" data-type="chapter-drop" data-parent-id="${act.id}" data-index="0" style="height:30px; border:1px dashed #555; display:flex; align-items:center; justify-content:center; color:#777;">${Localization.t('dragndrop.organizer.placeholder_chapter')}</div>`;
    } else {
        act.chapters.forEach((chapter, chIndex) => {
            html += renderOrganizerChapter(chapter, chIndex, act.id);
        });
        // Drop zone at end of chapters
        html += `<div class="org-drop-zone" data-type="chapter-drop" data-parent-id="${act.id}" data-index="${act.chapters.length}"></div>`;
    }

    html += `</div></div>`;
    return html;
}

function renderOrganizerChapter(chapter, index, actId) {
    const wordCount = chapter.scenes.reduce((sum, scene) => sum + ((scene.content && typeof StatsModel !== 'undefined') ? StatsModel.getWordCount(scene.content) : (scene.wordCount || 0)), 0);

    // Drop zone before chapter
    let html = `<div class="org-drop-zone" data-type="chapter-drop" data-parent-id="${actId}" data-index="${index}"></div>`;

    const isSelected = organizerSelectedItems.some(i => i.type === 'chapter' && i.id === chapter.id);
    const isCollapsed = organizerCollapsedState.chapters.has(chapter.id);

    html += `
        <div class="org-block org-chapter ${!isCollapsed ? 'expanded' : ''} ${isSelected ? 'selected-block' : ''}" id="org-chapter-${chapter.id}" draggable="true" data-type="chapter" data-id="${chapter.id}" data-parent-id="${actId}">
            <div class="org-header ${isSelected ? 'selected' : ''}" onclick="handleOrganizerClick(event, 'chapter', ${chapter.id})">
                <i data-lucide="grip-vertical" class="drag-handle" style="cursor: grab;"></i>
                <div class="org-icon-btn" onclick="toggleOrganizerBlock(this, event)">
                    <i data-lucide="chevron-down" class="toggle-icon"></i>
                </div>
                <span>${chapter.title}</span>
                <span class="org-count">${Localization.t('dragndrop.organizer.count_scenes', [chapter.scenes.length])}</span>
                <span class="org-stats">${Localization.t('dragndrop.organizer.count_words', [wordCount])}</span>
            </div>
            <div class="org-content" data-parent-type="chapter" data-parent-id="${chapter.id}">
    `;

    if (chapter.scenes.length === 0) {
        html += `<div class="org-drop-zone empty-placeholder" data-type="scene-drop" data-parent-id="${chapter.id}" data-index="0" style="height:30px; border:1px dashed #555; display:flex; align-items:center; justify-content:center; color:#777;">${Localization.t('dragndrop.organizer.placeholder_scene')}</div>`;
    } else {
        chapter.scenes.forEach((scene, scIndex) => {
            html += renderOrganizerScene(scene, scIndex, actId, chapter.id);
        });
        // Drop zone at end of scenes
        html += `<div class="org-drop-zone" data-type="scene-drop" data-parent-id="${chapter.id}" data-index="${chapter.scenes.length}"></div>`;
    }

    html += `</div></div>`;
    return html;
}

function renderOrganizerScene(scene, index, actId, chapterId) {
    // Drop zone before scene
    let html = `<div class="org-drop-zone" data-type="scene-drop" data-parent-id="${chapterId}" data-index="${index}"></div>`;

    const isSelected = organizerSelectedItems.some(i => i.type === 'scene' && i.id === scene.id);

    html += `
        <div class="org-block org-scene ${isSelected ? 'selected-block' : ''}" id="org-scene-${scene.id}" draggable="true" data-type="scene" data-id="${scene.id}" data-parent-id="${chapterId}" data-act-id="${actId}">
            <div class="org-header ${isSelected ? 'selected' : ''}" onclick="handleOrganizerClick(event, 'scene', ${scene.id})" ondblclick="openSceneFromOrganizer(${actId}, ${chapterId}, ${scene.id})">
                <i data-lucide="grip-vertical" class="drag-handle" style="cursor: grab;"></i>
                <span>${scene.title}</span>
                <span class="org-stats">${Localization.t('dragndrop.organizer.count_words', [(scene.content && typeof StatsModel !== 'undefined') ? StatsModel.getWordCount(scene.content) : (scene.wordCount || 0)])}</span>
            </div>
        </div>
    `;
    return html;
}

// --- INTERACTION --- //

function handleOrganizerClick(event, type, id) {
    // If clicking chevron or drag handle, don't trigger selection via this handler (handled separately or bubbling stopped)
    // Actually simpler: pass event and check target?
    // But I put onclick on the header div, and separate onclick on chevron.
    // Ensure separate handling.

    // Check key modifiers for multi-select
    const isMulti = event.ctrlKey || event.metaKey;
    // const isRange = event.shiftKey; // Simplification: Treat shift as multi for now or implement range later

    selectOrganizerItem(type, id, isMulti);
}

function openSceneFromOrganizer(actId, chapterId, sceneId) {
    if (typeof openScene === 'function') {
        openScene(actId, chapterId, sceneId);
        if (typeof closeModal === 'function') closeModal('structureOrganizerModal');
    }
}

function selectOrganizerItem(type, id, isMulti) {
    const existingIndex = organizerSelectedItems.findIndex(i => i.id === id && i.type === type);

    if (isMulti) {
        // Enforce same type constraint
        if (organizerSelectedItems.length > 0 && organizerSelectedItems[0].type !== type) {
            // Different type clicked? Reset and select new.
            organizerSelectedItems = [{ type, id }];
        } else {
            // Toggle
            if (existingIndex >= 0) {
                organizerSelectedItems.splice(existingIndex, 1);
            } else {
                organizerSelectedItems.push({ type, id });
            }
        }
    } else {
        // Single select
        // If already selected and only one, do nothing (or re-select)
        if (existingIndex >= 0 && organizerSelectedItems.length === 1) {
            // Already the only selected item
        } else {
            organizerSelectedItems = [{ type, id }];
        }
    }

    renderOrganizer(); // Re-render to update classes
}

function toggleOrganizerBlock(element, event) {
    if (event) event.stopPropagation();

    const block = element.closest('.org-block');
    block.classList.toggle('expanded');

    // Update State
    const type = block.dataset.type;
    const id = parseInt(block.dataset.id);
    const isExpanded = block.classList.contains('expanded');

    if (type === 'act') {
        if (isExpanded) organizerCollapsedState.acts.delete(id);
        else organizerCollapsedState.acts.add(id);
    } else if (type === 'chapter') {
        if (isExpanded) organizerCollapsedState.chapters.delete(id);
        else organizerCollapsedState.chapters.add(id);
    }
}

function expandAllOrganizer() {
    organizerCollapsedState.acts.clear();
    organizerCollapsedState.chapters.clear();
    document.querySelectorAll('.org-block').forEach(b => b.classList.add('expanded'));
}

function collapseAllOrganizer() {
    // Only collapse chapters, keep Acts expanded (Kanban columns)
    if (typeof project !== 'undefined' && project.acts) {
        project.acts.forEach(act => {
            if (act.chapters) act.chapters.forEach(ch => organizerCollapsedState.chapters.add(ch.id));
        });
    }
    document.querySelectorAll('.org-chapter').forEach(b => b.classList.remove('expanded'));
}

// --- DRAG AND DROP LOGIC ---

function setupOrganizerEvents() {
    const container = document.getElementById('organizerBody');
    let currentDragTarget = null; // Performance optimization

    // DRAG START
    container.addEventListener('dragstart', (e) => {
        const target = e.target.closest('.org-block');
        if (!target) return;

        e.stopPropagation();
        target.classList.add('dragging');

        const type = target.dataset.type;
        const id = parseInt(target.dataset.id);

        const isSelected = organizerSelectedItems.some(i => i.id === id && i.type === type);

        if (!isSelected) {
            organizerSelectedItems = [{ type, id }];
            container.querySelectorAll('.org-header.selected').forEach(el => el.classList.remove('selected'));
            container.querySelectorAll('.org-block.selected-block').forEach(el => el.classList.remove('selected-block'));
            target.querySelector('.org-header').classList.add('selected');
            target.classList.add('selected-block');
        }

        organizerDragItems = organizerSelectedItems.map(item => {
            const el = document.getElementById(`org-${item.type}-${item.id}`);
            return {
                type: item.type,
                id: item.id,
                parentId: parseInt(el?.dataset.parentId || 0),
                actId: parseInt(el?.dataset.actId || 0)
            };
        });

        if (organizerDragItems.length === 0) {
            organizerDragItems = [{
                type, id,
                parentId: parseInt(target.dataset.parentId || 0),
                actId: parseInt(target.dataset.actId || 0)
            }];
        }

        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', JSON.stringify(organizerDragItems));
    });

    // DRAG END
    container.addEventListener('dragend', (e) => {
        document.querySelectorAll('.dragging').forEach(el => el.classList.remove('dragging'));
        if (currentDragTarget) {
            currentDragTarget.classList.remove('drag-over', 'drag-over-folder');
            currentDragTarget = null;
        }
        // Cleanup fallback
        document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
        document.querySelectorAll('.drag-over-folder').forEach(el => el.classList.remove('drag-over-folder'));

        organizerDragItems = [];
    });

    // DRAG OVER (Optimized)
    container.addEventListener('dragover', (e) => {
        e.preventDefault();

        if (!organizerDragItems || organizerDragItems.length === 0) return;

        // Optimization: Don't re-query if target hasn't changed conceptually
        const targetElement = e.target.closest('.org-drop-zone, .org-header');

        if (currentDragTarget === targetElement) {
            e.dataTransfer.dropEffect = 'move';
            return;
        }

        // Clean previous
        if (currentDragTarget) {
            currentDragTarget.classList.remove('drag-over', 'drag-over-folder');
        }

        if (!targetElement) {
            currentDragTarget = null;
            return;
        }

        // Validate new target
        const targetInfo = getDropTarget(targetElement);
        if (!targetInfo) {
            currentDragTarget = null;
            return;
        }

        const sampleItem = organizerDragItems[0];
        if (!isCompatibleDrop(sampleItem.type, targetInfo.type)) {
            currentDragTarget = null;
            return;
        }

        // APPLY HIGHLIGHT
        currentDragTarget = targetElement;

        if (targetElement.classList.contains('org-drop-zone')) {
            targetElement.classList.add('drag-over');
        } else {
            targetElement.classList.add('drag-over-folder');
        }

        e.dataTransfer.dropEffect = 'move';
    });

    // DROP
    container.addEventListener('drop', async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!organizerDragItems || organizerDragItems.length === 0) return;

        const targetInfo = getDropTarget(e.target);
        if (!targetInfo) return;

        const sampleItem = organizerDragItems[0];

        // [MVVM : View] Validation du drop - vérifier la compatibilité
        if (!isCompatibleDrop(sampleItem.type, targetInfo.type)) {
            // Cas spécial : scène droppée sur un acte (zone chapter-drop)
            // -> Créer automatiquement un chapitre pour accueillir la scène
            if (sampleItem.type === 'scene' && targetInfo.type === 'chapter-drop') {
                const targetAct = project.acts.find(a => a.id === targetInfo.parentId);
                if (targetAct) {
                    // Créer un nouveau chapitre
                    const newChapter = createAutoChapterForScene(targetAct);
                    if (newChapter) {
                        // Modifier targetInfo pour pointer vers ce nouveau chapitre
                        targetInfo.type = 'scene-drop';
                        targetInfo.parentId = newChapter.id;
                        targetInfo.index = 0;
                    } else {
                        return; // Échec de création du chapitre
                    }
                } else {
                    return; // Acte non trouvé
                }
            } else {
                // Drop incompatible non géré
                return;
            }
        }

        // EXECUTE MOVE
        await executeOrganizerMoveMulti(organizerDragItems, targetInfo);

        renderOrganizer(); // Re-render to show changes
    });
}

function getDropTarget(element) {
    // 1. Check if Drop Zone (INSERT)
    const dropZone = element.closest('.org-drop-zone');
    if (dropZone) {
        return {
            type: dropZone.dataset.type, // act-drop, chapter-drop, scene-drop
            parentId: parseInt(dropZone.dataset.parentId || 0),
            index: parseInt(dropZone.dataset.index),
            element: dropZone,
            action: 'insert'
        };
    }

    // 2. Check if Header (APPEND TO CHILDREN)
    const header = element.closest('.org-header');
    if (header) {
        const block = header.closest('.org-block');
        const blockType = block.dataset.type; // act, chapter

        // Define drop types based on block type
        let dropType = '';
        if (blockType === 'act') dropType = 'chapter-drop'; // Dropping into an Act means adding a chapter
        if (blockType === 'chapter') dropType = 'scene-drop'; // Dropping into a Chapter means adding a scene

        return {
            type: dropType,
            parentId: parseInt(block.dataset.id),
            index: 9999, // Append to end
            element: header,
            action: 'append'
        };
    }

    return null;
}

function isCompatibleDrop(sourceType, targetDropType) {
    if (sourceType === 'act' && targetDropType === 'act-drop') return true;
    if (sourceType === 'chapter' && targetDropType === 'chapter-drop') return true;
    if (sourceType === 'scene' && targetDropType === 'scene-drop') return true;
    return false;
}

// [MVVM : View Helper] Crée automatiquement un chapitre quand une scène est droppée sur un acte sans chapitre
function createAutoChapterForScene(targetAct) {
    if (!targetAct) return null;

    // Générer un titre automatique pour le chapitre
    const chapterNumber = (targetAct.chapters?.length || 0) + 1;
    const newChapter = {
        id: Date.now(),
        title: `Chapitre ${chapterNumber}`,
        scenes: []
    };

    // Ajouter le chapitre à l'acte
    if (!targetAct.chapters) targetAct.chapters = [];
    targetAct.chapters.push(newChapter);

    return newChapter;
}

async function executeOrganizerMoveMulti(items, target) {
    // This function manipulates the PROJECT global object directly
    // Then we should probably save and sync.

    /* 
       Items: [{ type, id, parentId, actId }, ...]
       Target: { type, parentId, index, element, action }
    */

    if (!items || items.length === 0) return;
    const type = items[0].type; // All items in `items` should be of the same type due to selection logic

    const objectsToMove = [];
    const itemIds = new Set(items.map(i => i.id));

    if (type === 'act') {
        // 1. Gather objects and calculate adjusted target index
        let targetIndex = target.index;
        let removedBeforeCount = 0;

        // Get original indices of all acts
        const currentMetadata = project.acts.map((a, idx) => ({ id: a.id, index: idx }));

        items.forEach(item => {
            const obj = project.acts.find(a => a.id === item.id);
            if (obj) objectsToMove.push(obj);

            const meta = currentMetadata.find(m => m.id === item.id);
            if (meta && meta.index < targetIndex) {
                removedBeforeCount++;
            }
        });

        let finalIndex = targetIndex - removedBeforeCount;
        if (finalIndex < 0) finalIndex = 0;

        // 2. Remove all selected acts
        project.acts = project.acts.filter(a => !itemIds.has(a.id));

        // 3. Insert at final index
        if (finalIndex > project.acts.length) finalIndex = project.acts.length;
        project.acts.splice(finalIndex, 0, ...objectsToMove);

    } else if (type === 'chapter') {
        // 1. Pre-calculate Anchor ID (the chapter that was at target.index before any removals)
        const preTargetAct = project.acts.find(a => a.id === target.parentId);
        let anchorId = null;
        if (preTargetAct && target.action === 'insert' && target.index < preTargetAct.chapters.length) {
            anchorId = preTargetAct.chapters[target.index].id;
        }

        // 2. Remove all selected chapters from their current acts
        items.forEach(item => {
            const parentAct = project.acts.find(a => a.chapters.some(c => c.id === item.id));
            if (parentAct) {
                const ch = parentAct.chapters.find(c => c.id === item.id);
                if (ch) objectsToMove.push(ch);
                parentAct.chapters = parentAct.chapters.filter(c => c.id !== item.id);
            }
        });

        // 3. Find the target act (it might have been modified by removals)
        const targetAct = project.acts.find(a => a.id === target.parentId);
        if (targetAct) {
            let insertIndex = targetAct.chapters.length; // Default to append

            if (anchorId) {
                // Find where the anchor chapter ended up after removals
                const newAnchorIndex = targetAct.chapters.findIndex(c => c.id === anchorId);
                if (newAnchorIndex !== -1) {
                    insertIndex = newAnchorIndex;
                } else {
                    // Anchor was removed (e.g., it was one of the selected items)
                    // Fallback to target.index, clamped
                    if (target.action === 'insert' && target.index < targetAct.chapters.length) {
                        insertIndex = target.index;
                    }
                }
            } else if (target.action === 'insert' && target.index === 0) {
                // Explicitly insert at the beginning
                insertIndex = 0;
            } else if (target.action === 'insert' && target.index < targetAct.chapters.length) {
                // If no anchor, but a specific index was targeted, use it (clamped)
                insertIndex = target.index;
            }

            targetAct.chapters.splice(insertIndex, 0, ...objectsToMove);
        }

    } else if (type === 'scene') {
        // 1. Pre-calculate Anchor ID (the scene that was at target.index before any removals)
        let preTargetChapter = null;
        for (const act of project.acts) {
            const ch = act.chapters.find(c => c.id === target.parentId);
            if (ch) { preTargetChapter = ch; break; }
        }

        let anchorId = null;
        if (preTargetChapter && target.action === 'insert' && target.index < preTargetChapter.scenes.length) {
            anchorId = preTargetChapter.scenes[target.index].id;
        }

        // 2. Remove all selected scenes from their current chapters
        items.forEach(item => {
            for (const act of project.acts) {
                const ch = act.chapters.find(c => c.scenes.some(s => s.id === item.id));
                if (ch) {
                    const sc = ch.scenes.find(s => s.id === item.id);
                    if (sc) objectsToMove.push(sc);
                    ch.scenes = ch.scenes.filter(s => s.id !== item.id);
                }
            }
        });

        // 3. Find the target chapter (it might have been modified by removals)
        let targetChapter = null;
        for (const act of project.acts) {
            const ch = act.chapters.find(c => c.id === target.parentId);
            if (ch) { targetChapter = ch; break; }
        }

        if (targetChapter) {
            let insertIndex = targetChapter.scenes.length; // Default to append

            if (anchorId) {
                // Find where the anchor scene ended up after removals
                const newAnchorIndex = targetChapter.scenes.findIndex(s => s.id === anchorId);
                if (newAnchorIndex !== -1) {
                    insertIndex = newAnchorIndex;
                } else {
                    // Anchor was removed (e.g., it was one of the selected items)
                    // Fallback to target.index, clamped
                    if (target.action === 'insert' && target.index < targetChapter.scenes.length) {
                        insertIndex = target.index;
                    }
                }
            } else if (target.action === 'insert' && target.index === 0) {
                // Explicitly insert at the beginning
                insertIndex = 0;
            } else if (target.action === 'insert' && target.index < targetChapter.scenes.length) {
                // If no anchor, but a specific index was targeted, use it (clamped)
                insertIndex = target.index;
            }

            targetChapter.scenes.splice(insertIndex, 0, ...objectsToMove);
        }
    }

    // Side Effects
    // Save project
    if (typeof saveProject === 'function') saveProject();

    // Refresh stats if needed
    if (typeof updateStats === 'function') updateStats();
}
