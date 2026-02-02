// ==========================================
// TODOS PANEL
// ==========================================

// [MVVM : Other]
// Group: Use Case | Naming: ToggleTodosUseCase
// Alterne l'affichage du panneau des TODOs et déclenche le rendu
function toggleTodosPanel() {
    const panel = document.getElementById('todosPanel');
    const btn = document.getElementById('sidebarTodosBtn');
    const toolBtn = document.getElementById('toolTodosBtn');

    if (panel.classList.contains('hidden')) {
        renderTodosPanel();
        panel.classList.remove('hidden');
        if (btn) btn.classList.add('active');
        if (toolBtn) toolBtn.classList.add('active');
    } else {
        panel.classList.add('hidden');
        if (btn) btn.classList.remove('active');
        if (toolBtn) toolBtn.classList.remove('active');
    }
}

// [MVVM : View]
// Ferme le panneau des TODOs
function closeTodosPanel() {
    const panel = document.getElementById('todosPanel');
    const btn = document.getElementById('sidebarTodosBtn');
    const toolBtn = document.getElementById('toolTodosBtn');
    if (panel) {
        panel.classList.add('hidden');
    }
    if (btn) btn.classList.remove('active');
    if (toolBtn) toolBtn.classList.remove('active');
}

// [MVVM : Other]
// Group: Coordinator | Naming: TodosCoordinator
// Collecte les TODOs depuis le Model (project) et construit l'interface du panneau
function renderTodosPanel() {
    const panel = document.getElementById('todosPanelContent');
    const parentPanel = document.getElementById('todosPanel');

    if (!panel || !parentPanel) {
        console.error('Panneau TODOs introuvable');
        return;
    }

    // Collecter tous les TODOs du projet (de la version active de chaque scène)
    const todos = [];
    project.acts.forEach(act => {
        act.chapters.forEach(chapter => {
            chapter.scenes.forEach(scene => {
                const annotations = getVersionAnnotations(scene);
                annotations
                    .filter(a => a.type === 'todo')
                    .forEach(todo => {
                        todos.push({
                            ...todo,
                            actId: act.id,
                            actTitle: act.title,
                            chapterId: chapter.id,
                            chapterTitle: chapter.title,
                            sceneId: scene.id,
                            sceneTitle: scene.title
                        });
                    });
            });
        });
    });

    const pendingTodos = todos.filter(t => !t.completed);
    const completedTodos = todos.filter(t => t.completed);

    if (todos.length === 0) {
        panel.innerHTML = `
            <div class="annotations-panel-header">
                <h3 style="margin: 0;"><i data-lucide="check-square" style="width:18px;height:18px;vertical-align:middle;margin-right:6px;"></i>TODOs (0)</h3>
                <span class="annotations-panel-close" onclick="closeTodosPanel()" title="Fermer"><i data-lucide="x" style="width:16px;height:16px;"></i></span>
            </div>
            <p style="text-align: center; color: var(--text-muted); padding: 2rem;">Aucun TODO dans le projet</p>
        `;
    } else {
        panel.innerHTML = `
            <div class="annotations-panel-header">
                <h3 style="margin: 0;"><i data-lucide="check-square" style="width:18px;height:18px;vertical-align:middle;margin-right:6px;"></i>TODOs (${pendingTodos.length} actif${pendingTodos.length > 1 ? 's' : ''})</h3>
                <span class="annotations-panel-close" onclick="closeTodosPanel()" title="Fermer"><i data-lucide="x" style="width:16px;height:16px;"></i></span>
            </div>
            
            ${pendingTodos.length > 0 ? `
                <div style="margin-bottom: 1rem;">
                    <div style="font-size: 0.75rem; font-weight: 600; color: var(--text-muted); margin-bottom: 0.5rem; text-transform: uppercase;">À faire</div>
                    ${pendingTodos.map(todo => `
                        <div class="annotation-card todo" onclick="goToTodoScene(${todo.actId}, ${todo.chapterId}, ${todo.sceneId})" style="cursor: pointer;">
                            <div style="font-size: 0.7rem; color: var(--text-muted); margin-bottom: 0.25rem;">${todo.sceneTitle}</div>
                            <div class="annotation-content">${todo.text}</div>
                            <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
                                <button class="btn btn-small" onclick="event.stopPropagation(); toggleTodoFromPanel(${todo.actId}, ${todo.chapterId}, ${todo.sceneId}, ${todo.id})">
                                    <i data-lucide="check" style="width:12px;height:12px;vertical-align:middle;margin-right:4px;"></i>Marquer terminé
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
            
            ${completedTodos.length > 0 ? `
                <div>
                    <div style="font-size: 0.75rem; font-weight: 600; color: var(--text-muted); margin-bottom: 0.5rem; text-transform: uppercase;">Terminés (${completedTodos.length})</div>
                    ${completedTodos.map(todo => `
                        <div class="annotation-card" style="opacity: 0.6; cursor: pointer;" onclick="goToTodoScene(${todo.actId}, ${todo.chapterId}, ${todo.sceneId})">
                            <div style="font-size: 0.7rem; color: var(--text-muted); margin-bottom: 0.25rem;">${todo.sceneTitle}</div>
                            <div class="annotation-content" style="text-decoration: line-through;">${todo.text}</div>
                            <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
                                <button class="btn btn-small" onclick="event.stopPropagation(); toggleTodoFromPanel(${todo.actId}, ${todo.chapterId}, ${todo.sceneId}, ${todo.id})">
                                    <i data-lucide="rotate-ccw" style="width:12px;height:12px;vertical-align:middle;margin-right:4px;"></i>Rouvrir
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
        `;
    }

    // Afficher le panneau
    parentPanel.classList.remove('hidden');

    // Rafraîchir les icônes Lucide
    setTimeout(() => {
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }, 10);
}

// [MVVM : ViewModel]
// Ouvre une scène spécifique et ferme le panneau
function goToTodoScene(actId, chapterId, sceneId) {
    openScene(actId, chapterId, sceneId);
    closeTodosPanel();
}

// [MVVM : ViewModel]
// Bascule l'état d'un TODO depuis le panneau et met à jour le Model et la View
function toggleTodoFromPanel(actId, chapterId, sceneId, todoId) {
    const act = project.acts.find(a => a.id === actId);
    if (!act) return;
    const chapter = act.chapters.find(c => c.id === chapterId);
    if (!chapter) return;
    const scene = chapter.scenes.find(s => s.id === sceneId);
    if (!scene) return;

    const todo = findVersionAnnotation(scene, todoId);
    if (todo) {
        todo.completed = !todo.completed;
        saveProject();
        if (typeof saveToHistory === 'function') {
            saveToHistory('toggleTodo');
        }
        renderTodosPanel();
        updateAnnotationsButton(false);
        renderActsList();
    }
}

// [MVVM : Model]
// Retourne le nombre total d'annotations pour une scène (logique de données)
function getSceneAnnotationCount(scene) {
    const annotations = getVersionAnnotations(scene);
    return annotations.length;
}

// [MVVM : Model]
// Retourne le nombre de TODOs non terminés pour une scène (logique de données)
function getSceneTodoCount(scene) {
    const annotations = getVersionAnnotations(scene);
    return annotations.filter(a => a.type === 'todo' && !a.completed).length;
}

// Modifier la fonction renderEditor pour ajouter le bouton révision
// [MVVM : Other]
// Group: Util / Helper | Naming: RevisionUtils
// Extension du rendu de l'éditeur pour intégrer les options de révision
const originalRenderEditor = renderEditor;
renderEditor = function (act, chapter, scene) {
    originalRenderEditor(act, chapter, scene);

    // Ajouter le bouton révision dans la toolbar si pas déjà en mode révision
    if (!revisionMode) {
        const toolbar = document.getElementById('editorToolbar');
        if (toolbar && !toolbar.querySelector('[onclick*="toggleRevisionMode"]')) {
            const revisionGroup = document.createElement('div');
            revisionGroup.className = 'toolbar-group';
            revisionGroup.innerHTML = '<button class="toolbar-btn" onclick="toggleRevisionMode()" title="Mode Révision (Ctrl+R)"><i data-lucide="pencil" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i>RÉVISION</button>';
            try {
                toolbar.appendChild(revisionGroup);
            } catch (e) {
                console.error('Erreur appendChild toolbar:', e);
            }
        }
    }

    // Rafraîchir les icônes Lucide après le rendu
    setTimeout(() => {
        if (typeof lucide !== 'undefined') lucide.createIcons();
        // Réattacher les event listeners sur les marqueurs d'annotation
        reattachAnnotationMarkerListeners();
    }, 10);
};

// Modifier renderActsList pour afficher les badges d'annotations
// [MVVM : Other]
// Group: Util / Helper | Naming: RevisionUtils
// Extension du rendu de la liste des actes pour inclure les badges d'annotations (Model -> View)
const originalRenderActsList = renderActsList;
renderActsList = function () {
    originalRenderActsList();

    // Ajouter les badges d'annotations aux scènes (version active)
    project.acts.forEach(act => {
        act.chapters.forEach(chapter => {
            chapter.scenes.forEach(scene => {
                const sceneElement = document.querySelector(`[data-scene-id="${scene.id}"]`);
                const annotations = getVersionAnnotations(scene);
                if (sceneElement && annotations.length > 0) {
                    const annotCount = annotations.length;
                    const todoCount = annotations.filter(a => a.type === 'todo' && !a.completed).length;

                    let badgeHTML = `<span class="scene-badge">${annotCount}</span>`;
                    if (todoCount > 0) {
                        badgeHTML += `<span class="scene-badge" style="background: var(--accent-red);"><i data-lucide="check" style="width:10px;height:10px;vertical-align:middle;margin-right:2px;"></i>${todoCount}</span>`;
                    }

                    // Chercher spécifiquement le span du titre
                    const titleSpan = sceneElement.querySelector('.scene-title') ||
                        sceneElement.querySelector('span[ondblclick*="startEditingScene"]') ||
                        sceneElement.querySelector('div > span:not(.drag-handle)');

                    if (titleSpan && !titleSpan.querySelector('.scene-badge')) {
                        titleSpan.innerHTML += badgeHTML;
                    }
                }
            });
        });
    });
};

// Initialiser les annotations dans les scènes existantes (migration vers versions)
// [MVVM : Model]
// Gère la structure des données et la migration des annotations
function ensureAnnotationsStructure() {
    let needsSave = false;
    project.acts.forEach(act => {
        act.chapters.forEach(chapter => {
            chapter.scenes.forEach(scene => {
                // Migrer les anciennes annotations vers la version active
                if (migrateSceneAnnotationsToVersion(scene)) {
                    needsSave = true;
                }
            });
        });
    });
    if (needsSave) {
        saveProject();
        console.log('Migration des annotations vers les versions effectuée');
    }
}

// Appeler au chargement
// [MVVM : ViewModel]
// Initialisation globale intégrant la structure des annotations
const originalInit = init;
init = function () {
    originalInit();
    ensureAnnotationsStructure();
};

// ============================================
// TODO LIST VIEW
// ============================================

// [MVVM : Other]
// Group: Coordinator | Naming: TodosCoordinator
// Construit et affiche la vue complète de la liste des TODOs au milieu de l'écran
function renderTodosList() {
    // Afficher dans editorView au lieu de la sidebar
    const editorView = document.getElementById('editorView');
    if (!editorView) {
        console.error('editorView not found');
        return;
    }

    // Collecter tous les TODOs (de la version active de chaque scène)
    const todos = [];
    project.acts.forEach(act => {
        act.chapters.forEach(chapter => {
            chapter.scenes.forEach(scene => {
                const annotations = getVersionAnnotations(scene);
                annotations.filter(a => a.type === 'todo').forEach(todo => {
                    todos.push({
                        ...todo,
                        actId: act.id,
                        actTitle: act.title,
                        chapterId: chapter.id,
                        chapterTitle: chapter.title,
                        sceneId: scene.id,
                        sceneTitle: scene.title
                    });
                });
            });
        });
    });

    // Trier: non terminés d'abord
    todos.sort((a, b) => {
        if (a.completed === b.completed) return 0;
        return a.completed ? 1 : -1;
    });

    if (todos.length === 0) {
        editorView.innerHTML = '<div style="height: 100%; overflow-y: auto; padding: 3rem; text-align: center; color: var(--text-muted); font-size: 1.2rem;"><i data-lucide="clipboard-list" style="width:48px;height:48px;margin-bottom:1rem;color:var(--text-muted);display:block;margin: 0 auto 1rem;"></i> Aucun TODO<br><br><small style="font-size: 0.9rem;">Les TODOs apparaissent lorsque vous utilisez le mode révision</small></div>';
    } else {
        editorView.innerHTML = `
            <div style="height: 100%; overflow-y: auto; padding: 2rem 3rem;">
                <h2 style="margin-bottom: 2rem; color: var(--accent-gold);"><i data-lucide="check-square" style="width:24px;height:24px;vertical-align:middle;margin-right:8px;"></i>TODOs (${todos.filter(t => !t.completed).length} actifs)</h2>
                <div style="display: flex; flex-direction: column; gap: 1rem;">
                ${todos.map(todo => `
                    <div class="todo-item" onclick="openSceneFromTodo(${todo.actId}, ${todo.chapterId}, ${todo.sceneId})" 
                         style="display: flex; gap: 1rem; padding: 1rem; background: var(--bg-secondary); border-left: 3px solid ${todo.completed ? 'var(--text-muted)' : 'var(--accent-gold)'}; border-radius: 4px; cursor: pointer; transition: all 0.2s;">
                        <input type="checkbox" ${todo.completed ? 'checked' : ''} 
                               onclick="event.stopPropagation(); toggleTodoFromList(${todo.id}, ${todo.actId}, ${todo.chapterId}, ${todo.sceneId})"
                               style="margin-top: 0.25rem;">
                        <div style="flex: 1;">
                            <div style="font-size: 1rem; ${todo.completed ? 'text-decoration: line-through; opacity: 0.6;' : 'font-weight: 500;'}">${todo.text}</div>
                            <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.5rem;">
                                <i data-lucide="map-pin" style="width:12px;height:12px;margin-right:4px;vertical-align:middle;"></i> ${todo.actTitle} › ${todo.chapterTitle} › ${todo.sceneTitle}
                            </div>
                        </div>
                    </div>
                `).join('')}
                </div>
            </div>
        `;
    }
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

// [MVVM : ViewModel]
// Bascule l'état d'un TODO depuis la liste et rafraîchit les interfaces
function toggleTodoFromList(todoId, actId, chapterId, sceneId) {
    const act = project.acts.find(a => a.id === actId);
    if (!act) return;
    const chapter = act.chapters.find(c => c.id === chapterId);
    if (!chapter) return;
    const scene = chapter.scenes.find(s => s.id === sceneId);
    if (!scene) return;
    const todo = findVersionAnnotation(scene, todoId);

    if (todo) {
        todo.completed = !todo.completed;
        saveProject();
        if (typeof saveToHistory === 'function') {
            saveToHistory('toggleTodo');
        }
        renderTodosList();
        renderActsList();
    }
}

// [MVVM : ViewModel]
// Change la vue et ouvre la scène correspondante à un TODO
function openSceneFromTodo(actId, chapterId, sceneId) {
    switchView('editor');
    openScene(actId, chapterId, sceneId);
}

// ============================================
// FIN REVISION MODE
// ============================================

// Initialize on load

// [MVVM : View]
// Calcule et positionne le panneau d'annotations en fonction de la toolbar
function updateAnnotationsPanelPosition() {
    const header = document.querySelector('.editor-header');
    const toolbar = document.querySelector('.editor-toolbar, .revision-toolbar');
    const linksPanel = document.getElementById('linksPanel');
    const panel = document.getElementById('annotationsPanel');

    if (header && toolbar && panel) {
        let totalHeight = header.offsetHeight + toolbar.offsetHeight;
        if (linksPanel && linksPanel.style.display !== 'none') {
            totalHeight += linksPanel.offsetHeight;
        }
        panel.style.setProperty('--toolbar-height', totalHeight + 'px');
    }
}

// [MVVM : Other]
// Group: Util / Helper | Naming: RevisionUtils
// Extension du rendu du panneau d'annotations pour ajuster sa position
const originalRenderAnnotationsPanel = renderAnnotationsPanel;
renderAnnotationsPanel = function () {
    originalRenderAnnotationsPanel();
    setTimeout(updateAnnotationsPanelPosition, 50);
};
