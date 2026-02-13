/**
 * [MVVM : ViewModel]
 * Logique métier pour l'Undo/Redo
 */

const UndoRedoViewModel = {
    _debounceTimer: null,
    _textEditDebounceTimer: null,
    _textEditDebounceDelay: 500,

    /**
     * Annule la dernière action
     */
    undo() {
        if (!window.historyStack || window.historyStack.length === 0) {
            console.log('[UndoRedo] Rien a annuler');
            return;
        }

        this._cancelDebounce();

        // Sauvegarder l'état actuel dans redo avant de restaurer
        const currentSnapshot = UndoRedoRepository.createSnapshot('before-undo');
        if (currentSnapshot) {
            window.redoStack.push(currentSnapshot);
        }

        // Récupérer le dernier état et restaurer
        const previousSnapshot = window.historyStack.pop();
        UndoRedoRepository.restoreSnapshot(previousSnapshot, false);

        this._onStateRestored();
        console.log(`[UndoRedo] Undo effectué, historique: ${window.historyStack.length}, redo: ${window.redoStack.length}`);
    },

    /**
     * Rétablit la dernière action annulée
     */
    redo() {
        if (!window.redoStack || window.redoStack.length === 0) {
            console.log('[UndoRedo] Rien a retablir');
            return;
        }

        this._cancelDebounce();

        // Sauvegarder l'état actuel dans history avant de restaurer
        const currentSnapshot = UndoRedoRepository.createSnapshot('before-redo');
        if (currentSnapshot) {
            window.historyStack.push(currentSnapshot);
        }

        // Récupérer l'état à rétablir et restaurer
        const nextSnapshot = window.redoStack.pop();
        UndoRedoRepository.restoreSnapshot(nextSnapshot, false);

        this._onStateRestored();
        console.log(`[UndoRedo] Redo effectué, historique: ${window.historyStack.length}, redo: ${window.redoStack.length}`);
    },

    /**
     * Saute à un état spécifique de l'historique
     */
    jumpToHistoryState(type, targetIndex) {
        if (type === 'undo') {
            const count = window.historyStack.length - targetIndex;
            for (let i = 0; i < count; i++) {
                this.undo();
            }
        } else {
            const count = window.redoStack.length - targetIndex;
            for (let i = 0; i < count; i++) {
                this.redo();
            }
        }
    },

    /**
     * Sauvegarde l'état actuel avec debounce
     */
    saveToHistory(actionType = 'edit', metadata = null) {
        if (window.isUndoRedoAction) return;

        const isImmediate = UndoRedoConfig.immediateActions.some(
            action => actionType.toLowerCase().includes(action)
        );

        if (isImmediate) {
            this.saveToHistoryImmediate(actionType, metadata);
            return;
        }

        if (this._debounceTimer) clearTimeout(this._debounceTimer);

        this._debounceTimer = setTimeout(() => {
            this._saveInternal(actionType, metadata);
            this._debounceTimer = null;
        }, UndoRedoConfig.debounceDelay);
    },

    /**
     * Sauvegarde l'état actuel immédiatement
     */
    saveToHistoryImmediate(actionType = 'immediate', metadata = null) {
        if (window.isUndoRedoAction) return;

        this._cancelDebounce();
        this._saveInternal(actionType, metadata);
    },

    /**
     * Fonction de sauvegarde interne
     */
    _saveInternal(actionType, metadata = null) {
        // On stocke le type (clé de traduction) comme label du snapshot
        const snapshotType = actionType;
        const currentSnapshot = UndoRedoRepository.createSnapshot(snapshotType);

        if (!currentSnapshot) return;

        const lastSnap = UndoRedoRepository._lastSnapshot;
        if (!lastSnap) {
            UndoRedoRepository._lastSnapshot = currentSnapshot;
            return;
        }

        // Vérifier les changements significatifs
        if (!UndoRedoModel.hasSignificantChanges(lastSnap.project, currentSnapshot.project)) {
            return;
        }

        // Pousser l'ANCIEN état avec le type de l'action actuelle
        lastSnap.label = snapshotType;
        // Ajouter les métadonnées si présentes (ex: texte tapé)
        if (metadata) {
            lastSnap.details = metadata;
        }

        window.historyStack.push(lastSnap);

        // Limiter la taille
        if (window.historyStack.length > UndoRedoConfig.maxHistorySize) {
            window.historyStack.shift();
        }

        // Vider le redo
        window.redoStack = [];
        UndoRedoRepository._lastSnapshot = currentSnapshot;

        UndoRedoView.updateButtons();
        const actionLabel = UndoRedoConfig.actionLabels[actionType] || actionType;
        console.log(`[UndoRedo] Changement détecté: ${actionLabel}, historique: ${window.historyStack.length}`);
    },

    /**
     * Appelé après un undo/redo pour rafraîchir l'application
     */
    _onStateRestored() {
        // Sauvegarder le projet en DB
        if (typeof saveProjectToDB === 'function') {
            saveProjectToDB(project);
        } else if (typeof saveProject === 'function') {
            saveProject();
        }

        // Rafraîchir les vues
        if (typeof refreshAllViews === 'function') {
            try { refreshAllViews(); } catch (e) { console.error('[UndoRedo] Erreur refreshAllViews:', e); }
        } else {
            // S'assurer que le store d'enquête est à jour avant le refresh legacy
            if (typeof InvestigationStore !== 'undefined') {
                try { InvestigationStore.load(); } catch (e) { console.error('[UndoRedo] Erreur InvestigationStore.load:', e); }
            }
            this._legacyRefresh();
        }

        UndoRedoView.updateButtons();
    },

    /**
     * Méthodes de rafraîchissement "legacy" si refreshAllViews n'existe pas
     */
    _legacyRefresh() {
        if (typeof renderActsList === 'function') try { renderActsList(); } catch (e) { }
        if (typeof renderCharactersList === 'function') try { renderCharactersList(); } catch (e) { }
        if (typeof renderWorldList === 'function') try { renderWorldList(); } catch (e) { }
        if (typeof renderCodexList === 'function') try { renderCodexList(); } catch (e) { }

        if (typeof openScene === 'function' && window.currentSceneId && window.currentActId && window.currentChapterId) {
            try { openScene(window.currentActId, window.currentChapterId, window.currentSceneId); } catch (e) { }
        }

        // Update editor if visible
        const editor = document.querySelector('.editor-textarea');
        if (editor && window.currentSceneId) {
            const scene = this._findScene(window.currentActId, window.currentChapterId, window.currentSceneId);
            if (scene) editor.innerHTML = scene.content || '';
        }

        // Other views
        if (typeof PlotGridView !== 'undefined' && typeof PlotGridView.render === 'function') try { PlotGridView.render(); } catch (e) { }
        if (typeof renderCorkboard === 'function') try { renderCorkboard(); } catch (e) { }
        if (typeof renderTodos === 'function') try { renderTodos(); } catch (e) { }
        if (typeof renderTimeline === 'function') try { renderTimeline(); } catch (e) { }
        if (typeof updateStats === 'function') try { updateStats(); } catch (e) { }
        if (typeof renderArcs === 'function') try { renderArcs(); } catch (e) { }
        if (typeof ThrillerBoardView !== 'undefined' && typeof ThrillerBoardView.render === 'function') try { ThrillerBoardView.render(); } catch (e) { }
        if (typeof GlobalNotesView !== 'undefined' && typeof GlobalNotesView.render === 'function') try { GlobalNotesView.render(); } catch (e) { }
        if (typeof ArcBoardView !== 'undefined' && typeof ArcBoardView.render === 'function') try { ArcBoardView.render(); } catch (e) { }
        if (typeof ArcBoardViewModel !== 'undefined' && typeof ArcBoardViewModel.render === 'function') try { ArcBoardViewModel.render(); } catch (e) { }
        if (typeof renderMindmapView === 'function') try { renderMindmapView(); } catch (e) { }

        // Generic fallback
        if (typeof renderCurrentView === 'function') {
            try { renderCurrentView(); } catch (e) { }
        }

        // Investigation Board
        if (typeof InvestigationView !== 'undefined' && typeof InvestigationView.render === 'function') {
            try {
                const container = document.getElementById('investigationContent');
                if (container) InvestigationView.render(container);
                if (typeof InvestigationView.renderSidebar === 'function') InvestigationView.renderSidebar();
            } catch (e) { }
        }
    },

    _findScene(actId, chapId, sceneId) {
        if (!project || !project.acts) return null;
        const act = project.acts.find(a => a.id === actId);
        const chapter = act?.chapters.find(c => c.id === chapId);
        return chapter?.scenes.find(s => s.id === sceneId);
    },

    _cancelDebounce() {
        if (this._debounceTimer) {
            clearTimeout(this._debounceTimer);
            this._debounceTimer = null;
        }
        if (this._textEditDebounceTimer) {
            clearTimeout(this._textEditDebounceTimer);
            this._textEditDebounceTimer = null;
        }
    },

    clearHistory() {
        window.historyStack = [];
        window.redoStack = [];
        UndoRedoRepository._lastSnapshot = null;
        this._cancelDebounce();
        UndoRedoView.updateButtons();
        console.log('[UndoRedo] Historique réinitialisé');
    }
};
