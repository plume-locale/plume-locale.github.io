/**
 * Todo View
 * Rendu de l'interface utilisateur pour les TODOs
 */

const TodoView = {
    /**
     * Rendu du panneau latéral (sidebar)
     * @param {Array} todos - Liste des TODOs formatés
     */
    renderSidebarPanel: (todos) => {
        const panel = document.getElementById('todosPanelContent');
        if (!panel) return;

        const pendingTodos = todos.filter(t => !t.completed);
        const completedTodos = todos.filter(t => t.completed);

        if (todos.length === 0) {
            panel.innerHTML = `
                <div class="annotations-panel-header">
                    <h3 style="margin: 0;"><i data-lucide="check-square" style="width:18px;height:18px;vertical-align:middle;margin-right:6px;"></i>TODOs (0)</h3>
                    <span class="annotations-panel-close" onclick="TodoViewModel.closePanel()" title="Fermer"><i data-lucide="x" style="width:16px;height:16px;"></i></span>
                </div>
                <p style="text-align: center; color: var(--text-muted); padding: 2rem;">Aucun TODO dans le projet</p>
            `;
        } else {
            panel.innerHTML = `
                <div class="annotations-panel-header">
                    <h3 style="margin: 0;"><i data-lucide="check-square" style="width:18px;height:18px;vertical-align:middle;margin-right:6px;"></i>TODOs (${pendingTodos.length} actif${pendingTodos.length > 1 ? 's' : ''})</h3>
                    <span class="annotations-panel-close" onclick="TodoViewModel.closePanel()" title="Fermer"><i data-lucide="x" style="width:16px;height:16px;"></i></span>
                </div>
                
                ${pendingTodos.length > 0 ? `
                    <div style="margin-bottom: 1rem;">
                        <div style="font-size: 0.75rem; font-weight: 600; color: var(--text-muted); margin-bottom: 0.5rem; text-transform: uppercase;">À faire</div>
                        ${pendingTodos.map(todo => `
                            <div class="annotation-card todo" onclick="TodoViewModel.goToScene(${todo.actId}, ${todo.chapterId}, ${todo.sceneId})" style="cursor: pointer; position: relative;">
                                <button class="btn-delete-card" title="Supprimer" onclick="event.stopPropagation(); TodoViewModel.deleteTodo(${todo.sceneId}, ${todo.id})" 
                                        style="position: absolute; top: 8px; right: 8px; background: transparent; border: none; color: var(--text-muted); padding: 4px; border-radius: 4px; display: flex; align-items: center; justify-content: center; transition: all 0.2s; cursor: pointer;">
                                    <i data-lucide="trash-2" style="width:14px;height:14px;"></i>
                                </button>
                                <div style="font-size: 0.7rem; color: var(--text-muted); margin-bottom: 0.25rem; padding-right: 20px;">${todo.sceneTitle}</div>
                                <div class="annotation-content">${todo.text}</div>
                                <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
                                    <button class="btn btn-small" onclick="event.stopPropagation(); TodoViewModel.toggleTodo(${todo.sceneId}, ${todo.id})">
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
                            <div class="annotation-card" style="opacity: 0.6; cursor: pointer; position: relative;" onclick="TodoViewModel.goToScene(${todo.actId}, ${todo.chapterId}, ${todo.sceneId})">
                                <button class="btn-delete-card" title="Supprimer" onclick="event.stopPropagation(); TodoViewModel.deleteTodo(${todo.sceneId}, ${todo.id})" 
                                        style="position: absolute; top: 8px; right: 8px; background: transparent; border: none; color: var(--text-muted); padding: 4px; border-radius: 4px; display: flex; align-items: center; justify-content: center; transition: all 0.2s; cursor: pointer;">
                                    <i data-lucide="trash-2" style="width:14px;height:14px;"></i>
                                </button>
                                <div style="font-size: 0.7rem; color: var(--text-muted); margin-bottom: 0.25rem; padding-right: 20px;">${todo.sceneTitle}</div>
                                <div class="annotation-content" style="text-decoration: line-through;">${todo.text}</div>
                                <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
                                    <button class="btn btn-small" onclick="event.stopPropagation(); TodoViewModel.toggleTodo(${todo.sceneId}, ${todo.id})">
                                        <i data-lucide="rotate-ccw" style="width:12px;height:12px;vertical-align:middle;margin-right:4px;"></i>Rouvrir
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            `;
        }

        // Rafraîchir les icônes Lucide
        TodoView.refreshIcons();
    },

    /**
     * Rendu de la liste complète (vue principale)
     * @param {Array} todos - Liste des TODOs formatés
     */
    renderFullList: (todos) => {
        const editorView = document.getElementById('editorView');
        if (!editorView) return;

        // Trier: non terminés d'abord
        const sortedTodos = [...todos].sort((a, b) => {
            if (a.completed === b.completed) return 0;
            return a.completed ? 1 : -1;
        });

        if (sortedTodos.length === 0) {
            editorView.innerHTML = `
                <div style="height: 100%; overflow-y: auto; padding: 3rem; text-align: center; color: var(--text-muted); font-size: 1.2rem;">
                    <i data-lucide="clipboard-list" style="width:48px;height:48px;margin-bottom:1rem;color:var(--text-muted);display:block;margin: 0 auto 1rem;"></i> 
                    Aucun TODO<br><br>
                    <small style="font-size: 0.9rem;">Les TODOs apparaissent lorsque vous utilisez le mode révision</small>
                </div>`;
        } else {
            editorView.innerHTML = `
                <div style="height: 100%; overflow-y: auto; padding: 2rem 3rem;">
                    <h2 style="margin-bottom: 2rem; color: var(--accent-gold);">
                        <i data-lucide="check-square" style="width:24px;height:24px;vertical-align:middle;margin-right:8px;"></i>
                        TODOs (${sortedTodos.filter(t => !t.completed).length} actifs)
                    </h2>
                    <div style="display: flex; flex-direction: column; gap: 1rem;">
                    ${sortedTodos.map(todo => `
                        <div class="todo-item" onclick="TodoViewModel.openFromList(${todo.actId}, ${todo.chapterId}, ${todo.sceneId})" 
                             style="display: flex; gap: 1rem; padding: 1rem; background: var(--bg-secondary); border-left: 3px solid ${todo.completed ? 'var(--text-muted)' : 'var(--accent-gold)'}; border-radius: 4px; cursor: pointer; transition: all 0.2s; position: relative;">
                            <input type="checkbox" ${todo.completed ? 'checked' : ''} 
                                   onclick="event.stopPropagation(); TodoViewModel.toggleTodo(${todo.sceneId}, ${todo.id})"
                                   style="margin-top: 0.25rem;">
                            <div style="flex: 1;">
                                <div style="font-size: 1rem; ${todo.completed ? 'text-decoration: line-through; opacity: 0.6;' : 'font-weight: 500;'}">${todo.text}</div>
                                <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.5rem;">
                                    <i data-lucide="map-pin" style="width:12px;height:12px;margin-right:4px;vertical-align:middle;"></i> 
                                    ${todo.actTitle} › ${todo.chapterTitle} › ${todo.sceneTitle}
                                </div>
                            </div>
                            <button class="btn-delete-card" title="Supprimer" onclick="event.stopPropagation(); TodoViewModel.deleteTodo(${todo.sceneId}, ${todo.id})" 
                                    style="position: absolute; top: 12px; right: 12px; background: transparent; border: none; color: var(--text-muted); padding: 4px; border-radius: 4px; display: flex; align-items: center; justify-content: center; transition: all 0.2s; cursor: pointer;">
                                <i data-lucide="trash-2" style="width:16px;height:16px;"></i>
                            </button>
                        </div>
                    `).join('')}
                    </div>
                </div>
            `;
        }

        TodoView.refreshIcons();
    },

    /**
     * Rafraîchit les icônes Lucide
     */
    refreshIcons: () => {
        setTimeout(() => {
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }, 10);
    }
};
