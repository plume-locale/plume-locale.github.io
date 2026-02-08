/**
 * Todo ViewModel
 * Logique métier et gestion de l'état pour les TODOs
 */

const TodoViewModel = {
    /**
     * Alterne l'état (complété/non complété) d'un TODO
     */
    toggleTodo: (sceneId, todoId) => {
        const todo = TodoRepository.findById(sceneId, todoId);
        if (todo) {
            todo.completed = !todo.completed;
            TodoRepository.save('toggleTodo');

            // Trouver la scène parente
            const scene = typeof RevisionRepository !== 'undefined' ?
                RevisionRepository.findSceneById(sceneId) : null;

            if (scene) {
                // 1. Si la scène est ouverte, on met à jour le DOM en direct
                if (typeof currentSceneId !== 'undefined' && currentSceneId == sceneId) {
                    const marker = document.getElementById(`annotation-${todoId}`);
                    if (marker) {
                        if (todo.completed) marker.classList.add('completed');
                        else marker.classList.remove('completed');
                    }
                    // Sauvegarder le HTML modifié depuis l'éditeur
                    if (typeof RevisionViewModel !== 'undefined') {
                        RevisionViewModel.updateSceneContent();
                    }
                }
                // 2. Si la scène n'est pas ouverte, on met à jour la chaîne HTML stockée
                else if (scene.content) {
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = scene.content;
                    const marker = tempDiv.querySelector(`#annotation-${todoId}`);
                    if (marker) {
                        if (todo.completed) marker.classList.add('completed');
                        else marker.classList.remove('completed');
                        scene.content = tempDiv.innerHTML;

                        // Si des versions existent, mettre à jour la version active aussi
                        if (typeof RevisionRepository !== 'undefined') {
                            const activeVersion = RevisionRepository.getActiveVersion(scene);
                            if (activeVersion) activeVersion.content = scene.content;
                        }

                        TodoRepository.save('toggleTodoOffline');
                    }
                }
            }

            // Rafraîchir les vues impactées
            TodoViewModel.refreshUI();
            return true;
        }
        return false;
    },

    /**
     * Supprime définitivement un TODO
     */
    deleteTodo: (sceneId, todoId) => {
        if (!confirm('Supprimer définitivement ce TODO ?')) return false;

        const scene = typeof RevisionRepository !== 'undefined' ?
            RevisionRepository.findSceneById(sceneId) : null;

        if (!scene) return false;

        // 1. Si c'est la scène actuelle, on retire du DOM en direct
        if (typeof currentSceneId !== 'undefined' && currentSceneId == sceneId) {
            if (typeof RevisionView !== 'undefined' && RevisionView.removeAnnotationMarker) {
                RevisionView.removeAnnotationMarker(todoId);
            }
            // Sauvegarder le contenu nettoyé depuis l'éditeur
            if (typeof RevisionViewModel !== 'undefined') {
                RevisionViewModel.updateSceneContent();
            }
        }
        // 2. Si la scène n'est pas ouverte, nettoyer la chaîne HTML stockée
        else if (scene.content) {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = scene.content;
            const marker = tempDiv.querySelector(`#annotation-${todoId}`);
            if (marker) {
                const textContent = marker.textContent;
                const textNode = document.createTextNode(textContent);
                marker.parentNode.replaceChild(textNode, marker);
                scene.content = tempDiv.innerHTML;

                // Mettre à jour la version active aussi
                if (typeof RevisionRepository !== 'undefined') {
                    const activeVersion = RevisionRepository.getActiveVersion(scene);
                    if (activeVersion) activeVersion.content = scene.content;
                }
            }
        }

        // 3. Retirer les données de l'annotation du repository
        if (typeof RevisionRepository !== 'undefined') {
            RevisionRepository.removeAnnotation(scene, todoId);
        } else {
            scene.annotations = (scene.annotations || []).filter(a => a.id !== todoId);
        }

        TodoRepository.save('deleteTodo');
        TodoViewModel.refreshUI();

        return true;
    },

    /**
     * Navigue vers la scène d'un TODO
     */
    goToScene: (actId, chapterId, sceneId) => {
        if (typeof openScene === 'function') {
            openScene(actId, chapterId, sceneId);
            TodoViewModel.closePanel();
        }
    },

    /**
     * Ouvre la scène depuis la liste complète (change de vue si nécessaire)
     */
    openFromList: (actId, chapterId, sceneId) => {
        if (typeof switchView === 'function') {
            switchView('editor');
        }
        TodoViewModel.goToScene(actId, chapterId, sceneId);
    },

    /**
     * Alterne l'affichage du panneau latéral des TODOs
     */
    togglePanel: () => {
        const panel = document.getElementById('todosPanel');
        if (!panel) return;

        if (panel.classList.contains('hidden')) {
            TodoViewModel.renderPanel();
            panel.classList.remove('hidden');
            TodoViewModel.updateButtonsState(true);
        } else {
            TodoViewModel.closePanel();
        }
    },

    /**
     * Ferme le panneau latéral
     */
    closePanel: () => {
        const panel = document.getElementById('todosPanel');
        if (panel) {
            panel.classList.add('hidden');
            TodoViewModel.updateButtonsState(false);
        }
    },

    /**
     * Met à jour l'état des boutons de la barre latérale
     */
    updateButtonsState: (isActive) => {
        const btn = document.getElementById('sidebarTodosBtn');
        const toolBtn = document.getElementById('toolTodosBtn');

        if (isActive) {
            if (btn) btn.classList.add('active');
            if (toolBtn) toolBtn.classList.add('active');
        } else {
            if (btn) btn.classList.remove('active');
            if (toolBtn) toolBtn.classList.remove('active');
        }
    },

    /**
     * Déclenche le rendu du panneau
     */
    renderPanel: () => {
        const todos = TodoRepository.getAll();
        TodoView.renderSidebarPanel(todos);
    },

    /**
     * Déclenche le rendu de la liste complète
     */
    renderList: () => {
        const todos = TodoRepository.getAll();
        TodoView.renderFullList(todos);
    },

    /**
     * Rafraîchit toutes les interfaces liées aux TODOs
     */
    refreshUI: () => {
        // Rafraîchir le panneau s'il est ouvert
        const panel = document.getElementById('todosPanel');
        if (panel && !panel.classList.contains('hidden')) {
            TodoViewModel.renderPanel();
        }

        // Rafraîchir la liste si on est sur cette vue
        // On vérifie si l'élément header de la liste est présent
        const editorView = document.getElementById('editorView');
        if (editorView && editorView.querySelector('h2 i[data-lucide="check-square"]')) {
            TodoViewModel.renderList();
        }

        // Rafraîchir les badges dans la liste des actes
        if (typeof renderActsList === 'function') {
            renderActsList();
        }

        // Rafraîchir le bouton d'annotations
        if (typeof updateAnnotationsButton === 'function') {
            updateAnnotationsButton(false);
        }
    }
};
