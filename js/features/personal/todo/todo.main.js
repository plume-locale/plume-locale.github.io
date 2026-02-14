/**
 * Todo Main
 * Point d'entrée du module TODOs
 */

// Initialisation globale
(function () {
    // Exposer les fonctions globales pour la compatibilité
    window.toggleTodosPanel = () => TodoViewModel.togglePanel();
    window.closeTodosPanel = () => TodoViewModel.closePanel();
    window.renderTodosPanel = () => TodoViewModel.renderPanel();
    window.renderTodosList = () => TodoViewModel.renderList();
    window.toggleTodoFromPanel = (actId, chapterId, sceneId, todoId) => TodoViewModel.toggleTodo(sceneId, todoId);
    window.toggleTodoFromList = (todoId, actId, chapterId, sceneId) => TodoViewModel.toggleTodo(sceneId, todoId);
    window.goToTodoScene = (actId, chapterId, sceneId) => TodoViewModel.goToScene(actId, chapterId, sceneId);
    window.openSceneFromTodo = (actId, chapterId, sceneId) => TodoViewModel.openFromList(actId, chapterId, sceneId);

    // Patch de l'init global
    const originalInit = window.init;
    window.init = function () {
        if (typeof originalInit === 'function') originalInit();
        TodoRepository.migrateIfNeeded();
        TodoHandlers.init();
    };

    // Patch de renderEditor pour injecter le bouton Révision
    const originalRenderEditor = window.renderEditor;
    window.renderEditor = function (act, chapter, scene) {
        if (typeof originalRenderEditor === 'function') originalRenderEditor(act, chapter, scene);

        if (!window.revisionMode) {
            const toolbar = document.getElementById('editorToolbar');
            if (toolbar && !toolbar.querySelector('[onclick*="toggleRevisionMode"]')) {
                const revisionGroup = document.createElement('div');
                revisionGroup.className = 'toolbar-group';
                revisionGroup.innerHTML = '<button class="toolbar-btn" onclick="toggleRevisionMode()" title="Mode Révision (Ctrl+R)"><i data-lucide="pencil" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i>RÉVISION</button>';
                try {
                    toolbar.appendChild(revisionGroup);
                } catch (e) {
                    console.error('[Todo] Erreur inject bouton révision:', e);
                }
            }
        }

        setTimeout(() => {
            if (typeof lucide !== 'undefined') lucide.createIcons();
            if (typeof reattachAnnotationMarkerListeners === 'function') {
                reattachAnnotationMarkerListeners();
            }
        }, 10);
    };

    // Patch de renderActsList pour les badges
    const originalRenderActsList = window.renderActsList;
    window.renderActsList = function () {
        if (typeof originalRenderActsList === 'function') originalRenderActsList();

        if (!project || !project.acts) return;

        project.acts.forEach(act => {
            if (!act.chapters) return;
            act.chapters.forEach(chapter => {
                if (!chapter.scenes) return;
                chapter.scenes.forEach(scene => {
                    const sceneElement = document.querySelector(`[data-scene-id="${scene.id}"]`);
                    const annotations = TodoRepository.getSceneAnnotations(scene);

                    if (sceneElement && annotations && annotations.length > 0) {
                        const annotCount = annotations.filter(a => a.type !== 'todo').length;
                        const todoCount = annotations.filter(a => a.type === 'todo' && !a.completed).length;

                        let badgeHTML = '';
                        if (annotCount > 0) {
                            badgeHTML += `<span class="scene-badge">${annotCount}</span>`;
                        }
                        if (todoCount > 0) {
                            badgeHTML += `<span class="scene-badge" style="background: var(--accent-red);"><i data-lucide="check" style="width:10px;height:10px;vertical-align:middle;margin-right:2px;"></i>${todoCount}</span>`;
                        }

                        if (!badgeHTML) return; // Rien à afficher

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

        if (typeof lucide !== 'undefined') lucide.createIcons();
    };

    // Patch de renderAnnotationsPanel pour la position
    const originalRenderAnnotationsPanel = window.renderAnnotationsPanel;
    window.renderAnnotationsPanel = function () {
        if (typeof originalRenderAnnotationsPanel === 'function') originalRenderAnnotationsPanel();
        setTimeout(TodoHandlers.updateAnnotationsPanelPosition, 50);
    };

    console.log('[Todo] Module initialisé');
})();
