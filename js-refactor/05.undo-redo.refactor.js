/**
 * [MVVM : ViewModel]
 * Systeme d'Undo/Redo complet pour Plume
 *
 * Architecture basee sur les snapshots avec debouncing intelligent.
 * Gere TOUTES les fonctionnalites de l'application.
 */

// ============================================
// CONFIGURATION
// ============================================

const UndoRedoConfig = {
    maxHistorySize: 50,           // Nombre maximum d'etats dans l'historique
    debounceDelay: 1000,          // Delai de debounce en ms (1 seconde)
    excludeKeys: [                // Cles a exclure des snapshots (etat UI temporaire)
        'updatedAt'               // Les timestamps ne declenchent pas de changements
    ],
    // Actions qui necessitent une sauvegarde immediate (pas de debounce)
    immediateActions: [
        'add', 'remove', 'delete', 'create', 'reorder', 'move', 'toggle'
    ],
    // Traduction des types d'actions en libellés lisibles
    actionLabels: {
        'Act.add': 'Ajout d\'un acte',
        'Act.delete': 'Suppression d\'un acte',
        'Act.reorder': 'Réordonnancement des actes',
        'Chapter.add': 'Ajout d\'un chapitre',
        'Chapter.delete': 'Suppression d\'un chapitre',
        'Chapter.reorder': 'Réordonnancement des chapitres',
        'Scene.add': 'Ajout d\'une scène',
        'Scene.delete': 'Suppression d\'une scène',
        'Scene.reorder': 'Réordonnancement des scènes',
        'Scene.move': 'Déplacement d\'une scène',
        'Character.add': 'Nouveau personnage',
        'Character.delete': 'Suppression d\'un personnage',
        'World.add': 'Nouvel élément de monde',
        'World.delete': 'Suppression d\'un élément',
        'Codex.add': 'Ajout au codex',
        'Codex.delete': 'Suppression du codex',
        'Codex.update': 'Modification du codex',
        'text-edit': 'Modification de texte',
        'text-edit-start': 'Début d\'édition',
        'text-edit-end': 'Fin d\'édition',
        'Arc.create': 'Nouvel arc narratif',
        'Arc.delete': 'Suppression d\'un arc',
        'BoardItem.create': 'Nouvel élément sur le tableau',
        'BoardItem.delete': 'Suppression d\'un élément',
        'Card.create': 'Nouvelle carte',
        'Card.delete': 'Suppression d\'une carte',
        'Card.move': 'Déplacement d\'une carte',
        'Connection.create': 'Nouvelle connexion',
        'Connection.delete': 'Suppression de connexion',
        'toggleTodo': 'Changement d\'état TODO',
        'Scene.update': 'Modification de scène',
        'Chapter.update': 'Modification de chapitre',
        'Act.update': 'Modification d\'acte'
    }
};

// ============================================
// ETAT GLOBAL DU SYSTEME
// ============================================

// Ces variables sont definies dans 01.app.refactor.js mais on les redeclare ici pour reference
// historyStack, redoStack, isUndoRedoAction sont deja definis globalement

let _undoRedoInitialized = false;
let _debounceTimer = null;
let _lastSnapshot = null;
let _pendingActionType = null;

// ============================================
// UTILITAIRES
// ============================================

/**
 * Deep clone d'un objet (gere les objets complexes, Set, Map, etc.)
 * @param {*} obj - L'objet a cloner
 * @returns {*} - Le clone profond
 */
function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }

    if (obj instanceof Date) {
        return new Date(obj.getTime());
    }

    if (obj instanceof Set) {
        return new Set([...obj].map(item => deepClone(item)));
    }

    if (obj instanceof Map) {
        const clonedMap = new Map();
        obj.forEach((value, key) => {
            clonedMap.set(deepClone(key), deepClone(value));
        });
        return clonedMap;
    }

    if (Array.isArray(obj)) {
        return obj.map(item => deepClone(item));
    }

    const cloned = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            cloned[key] = deepClone(obj[key]);
        }
    }
    return cloned;
}

/**
 * Compare deux objets pour detecter des changements significatifs
 * @param {Object} obj1 - Premier objet
 * @param {Object} obj2 - Deuxieme objet
 * @returns {boolean} - True si les objets sont differents
 */
function hasSignificantChanges(obj1, obj2) {
    if (obj1 === obj2) return false;
    if (obj1 === null || obj2 === null) return true;
    if (typeof obj1 !== typeof obj2) return true;

    if (typeof obj1 !== 'object') {
        return obj1 !== obj2;
    }

    if (Array.isArray(obj1) !== Array.isArray(obj2)) return true;

    if (Array.isArray(obj1)) {
        if (obj1.length !== obj2.length) return true;
        for (let i = 0; i < obj1.length; i++) {
            if (hasSignificantChanges(obj1[i], obj2[i])) return true;
        }
        return false;
    }

    const keys1 = Object.keys(obj1).filter(k => !UndoRedoConfig.excludeKeys.includes(k));
    const keys2 = Object.keys(obj2).filter(k => !UndoRedoConfig.excludeKeys.includes(k));

    if (keys1.length !== keys2.length) return true;

    for (const key of keys1) {
        if (!keys2.includes(key)) return true;
        if (hasSignificantChanges(obj1[key], obj2[key])) return true;
    }

    return false;
}

// ============================================
// GESTION DES SNAPSHOTS
// ============================================

/**
 * Cree un snapshot complet de l'etat du projet
 * @param {string} actionLabel - Libellé de l'action
 * @returns {Object} - Le snapshot de l'etat
 */
function createSnapshot(actionLabel = 'Action') {
    if (typeof project === 'undefined') {
        console.warn('[UndoRedo] project non defini');
        return null;
    }

    const snapshot = {
        timestamp: Date.now(),
        label: actionLabel,
        project: deepClone(project),
        // Etat de navigation (optionnel, pour restauration complete)
        navigation: {
            currentActId: typeof currentActId !== 'undefined' ? currentActId : null,
            currentChapterId: typeof currentChapterId !== 'undefined' ? currentChapterId : null,
            currentSceneId: typeof currentSceneId !== 'undefined' ? currentSceneId : null
        }
    };

    // Ajouter l'etat du thriller board si present
    if (typeof thrillerBoardState !== 'undefined') {
        snapshot.thrillerBoardState = deepClone(thrillerBoardState);
    }

    return snapshot;
}

/**
 * Restaure un snapshot
 * @param {Object} snapshot - Le snapshot a restaurer
 * @param {boolean} restoreNavigation - Si on doit restaurer la navigation
 */
function restoreSnapshot(snapshot, restoreNavigation = false) {
    if (!snapshot || !snapshot.project) {
        console.warn('[UndoRedo] Snapshot invalide');
        return;
    }

    // Marquer qu'on est en train de faire un undo/redo
    isUndoRedoAction = true;

    try {
        // Restaurer le projet
        const restoredProject = deepClone(snapshot.project);

        // Copier toutes les proprietes
        Object.keys(project).forEach(key => {
            if (restoredProject.hasOwnProperty(key)) {
                project[key] = restoredProject[key];
            }
        });

        // S'assurer que toutes les nouvelles proprietes sont aussi copiees
        Object.keys(restoredProject).forEach(key => {
            project[key] = restoredProject[key];
        });

        // Restaurer l'etat du thriller board si present
        if (snapshot.thrillerBoardState && typeof thrillerBoardState !== 'undefined') {
            const restoredThrillerState = deepClone(snapshot.thrillerBoardState);
            Object.keys(restoredThrillerState).forEach(key => {
                thrillerBoardState[key] = restoredThrillerState[key];
            });
        }

        // Restaurer la navigation si demande
        if (restoreNavigation && snapshot.navigation) {
            if (typeof currentActId !== 'undefined') {
                currentActId = snapshot.navigation.currentActId;
            }
            if (typeof currentChapterId !== 'undefined') {
                currentChapterId = snapshot.navigation.currentChapterId;
            }
            if (typeof currentSceneId !== 'undefined') {
                currentSceneId = snapshot.navigation.currentSceneId;
            }
        }

        // Notifier les composants de la mise a jour
        _notifyStateRestored();

    } finally {
        isUndoRedoAction = false;
    }
}

/**
 * Notifie tous les composants que l'etat a ete restaure
 */
function _notifyStateRestored() {
    // Sauvegarder le projet
    if (typeof saveProjectToDB === 'function') {
        saveProjectToDB(project);
    } else if (typeof saveProject === 'function') {
        saveProject();
    }

    // 0. Rafraîchir tout le système de vue si possible (Recommandé)
    if (typeof refreshAllViews === 'function') {
        try { refreshAllViews(); } catch (e) {
            console.error('[UndoRedo] Erreur dans refreshAllViews:', e);
        }
    } else {
        // Rafraichir la vue structure
        if (typeof renderActsList === 'function') {
            try { renderActsList(); } catch (e) { }
        } else if (typeof renderStructureTree === 'function') {
            try { renderStructureTree(); } catch (e) { }
        }

        // Rafraichir la vue caracteres
        if (typeof renderCharactersList === 'function') {
            try { renderCharactersList(); } catch (e) { }
        }

        // Rafraichir la vue monde
        if (typeof renderWorldList === 'function') {
            try { renderWorldList(); } catch (e) { }
        }

        // Rafraichir la vue codex
        if (typeof renderCodexList === 'function') {
            try { renderCodexList(); } catch (e) { }
        }
    }

    // Rafraichir la scene courante
    if (typeof openScene === 'function' && currentSceneId && currentActId && currentChapterId) {
        try { openScene(currentActId, currentChapterId, currentSceneId); } catch (e) { }
    } else if (typeof renderCurrentView === 'function') {
        try { renderCurrentView(); } catch (e) { }
    }

    // Forcer la mise à jour de l'éditeur si présent
    const editor = document.querySelector('.editor-textarea');
    if (editor && currentSceneId && currentActId && currentChapterId) {
        const act = project.acts.find(a => a.id === currentActId);
        const chapter = act?.chapters.find(c => c.id === currentChapterId);
        const scene = chapter?.scenes.find(s => s.id === currentSceneId);
        if (scene) {
            editor.innerHTML = scene.content || '';
            console.log('[UndoRedo] Editeur mis a jour avec le contenu restaure');
        }
    }

    // Rafraichir le plot grid
    if (typeof PlotGridView !== 'undefined' && typeof PlotGridView.render === 'function') {
        try { PlotGridView.render(); } catch (e) { }
    }

    // Rafraichir le thriller board
    if (typeof ThrillerBoardView !== 'undefined' && typeof ThrillerBoardView.render === 'function') {
        try { ThrillerBoardView.render(); } catch (e) { }
    }

    // Rafraichir le corkboard
    if (typeof renderCorkboard === 'function') {
        try { renderCorkboard(); } catch (e) { }
    }

    // Rafraichir les todos
    if (typeof renderTodos === 'function') {
        try { renderTodos(); } catch (e) { }
    }

    // Rafraichir la timeline
    if (typeof renderTimeline === 'function') {
        try { renderTimeline(); } catch (e) { }
    }

    // Rafraichir les stats
    if (typeof updateStats === 'function') {
        try { updateStats(); } catch (e) { }
    }

    // Rafraichir les arcs
    if (typeof renderArcs === 'function') {
        try { renderArcs(); } catch (e) { }
    }

    // Mettre a jour les boutons undo/redo
    updateUndoRedoButtons();

    console.log('[UndoRedo] Etat restaure avec succes');
}

// ============================================
// API PRINCIPALE
// ============================================

/**
 * Sauvegarde l'etat courant dans l'historique (avec debounce)
 * @param {string} actionType - Type d'action (pour info)
 */
function saveToHistory(actionType = 'edit') {
    // Ne pas sauvegarder pendant un undo/redo
    if (isUndoRedoAction) {
        return;
    }

    _pendingActionType = actionType;

    // Verifier si c'est une action immediate
    const isImmediate = UndoRedoConfig.immediateActions.some(
        action => actionType.toLowerCase().includes(action)
    );

    if (isImmediate) {
        saveToHistoryImmediate(actionType);
        return;
    }

    // Debounce pour les edits continus
    if (_debounceTimer) {
        clearTimeout(_debounceTimer);
    }

    _debounceTimer = setTimeout(() => {
        _saveToHistoryInternal(actionType);
        _debounceTimer = null;
    }, UndoRedoConfig.debounceDelay);
}

/**
 * Sauvegarde immediatement l'etat courant dans l'historique (sans debounce)
 * @param {string} actionType - Type d'action (pour info)
 */
function saveToHistoryImmediate(actionType = 'immediate') {
    // Ne pas sauvegarder pendant un undo/redo
    if (isUndoRedoAction) {
        return;
    }

    // Annuler tout debounce en cours
    if (_debounceTimer) {
        clearTimeout(_debounceTimer);
        _debounceTimer = null;
    }

    _saveToHistoryInternal(actionType);
}

/**
 * Implementation interne de la sauvegarde
 * @param {string} actionType - Type d'action
 */
function _saveToHistoryInternal(actionType) {
    // Obtenir le libellé lisible
    const actionLabel = UndoRedoConfig.actionLabels[actionType] || actionType;

    const currentSnapshot = createSnapshot(actionLabel);
    if (!currentSnapshot) return;

    // S'il n'y a pas de snapshot précédent, on initialise et on s'arrête
    if (!_lastSnapshot) {
        _lastSnapshot = currentSnapshot;
        return;
    }

    // Verifier s'il y a des changements significatifs entre l'ancien état et le nouveau
    if (!hasSignificantChanges(_lastSnapshot.project, currentSnapshot.project)) {
        // Pas de changements significatifs, on ne fait rien
        return;
    }

    // ÉTAT CHANGÉ : On pousse l'ANCIEN état (_lastSnapshot) dans l'historique
    // Mais on lui donne le label de l'action qui vient d'être faite
    _lastSnapshot.label = actionLabel;
    historyStack.push(_lastSnapshot);

    // Limiter la taille de l'historique
    while (historyStack.length > UndoRedoConfig.maxHistorySize) {
        historyStack.shift();
    }

    // Vider le redo stack car on a fait une nouvelle action
    redoStack = [];

    // Mettre a jour le "dernier snapshot connu" avec l'état actuel
    _lastSnapshot = currentSnapshot;

    // Mettre a jour les boutons
    updateUndoRedoButtons();

    console.log(`[UndoRedo] Changement détecté: ${actionLabel}, historique: ${historyStack.length}`);
}

/**
 * Annule la derniere action (Undo)
 */
function undo() {
    if (historyStack.length === 0) {
        console.log('[UndoRedo] Rien a annuler');
        return;
    }

    // Annuler tout debounce en cours
    if (_debounceTimer) {
        clearTimeout(_debounceTimer);
        _debounceTimer = null;
    }

    // Sauvegarder l'etat actuel dans redo avant de restaurer
    const currentSnapshot = createSnapshot();
    if (currentSnapshot) {
        currentSnapshot.actionType = 'before-undo';
        redoStack.push(currentSnapshot);
    }

    // Recuperer le dernier etat
    const previousSnapshot = historyStack.pop();

    // Restaurer
    restoreSnapshot(previousSnapshot, false);

    // Mettre a jour le dernier snapshot
    _lastSnapshot = previousSnapshot;

    console.log(`[UndoRedo] Undo effectue, historique: ${historyStack.length}, redo: ${redoStack.length}`);
}

/**
 * Retablit la derniere action annulee (Redo)
 */
function redo() {
    if (redoStack.length === 0) {
        console.log('[UndoRedo] Rien a retablir');
        return;
    }

    // Annuler tout debounce en cours
    if (_debounceTimer) {
        clearTimeout(_debounceTimer);
        _debounceTimer = null;
    }

    // Sauvegarder l'etat actuel dans history avant de restaurer
    const currentSnapshot = createSnapshot();
    if (currentSnapshot) {
        currentSnapshot.actionType = 'before-redo';
        historyStack.push(currentSnapshot);
    }

    // Recuperer l'etat a retablir
    const nextSnapshot = redoStack.pop();

    // Restaurer
    restoreSnapshot(nextSnapshot, false);

    // Mettre a jour le dernier snapshot
    _lastSnapshot = nextSnapshot;

    console.log(`[UndoRedo] Redo effectue, historique: ${historyStack.length}, redo: ${redoStack.length}`);
}

/**
 * Met a jour l'etat des boutons undo/redo
 */
function updateUndoRedoButtons() {
    // Header buttons (desktop)
    const headerUndoBtn = document.getElementById('headerUndoBtn');
    const headerRedoBtn = document.getElementById('headerRedoBtn');

    // Mobile buttons
    const mobileUndoBtn = document.getElementById('mobileUndoBtn');
    const mobileRedoBtn = document.getElementById('mobileRedoBtn');

    // Update header buttons
    if (headerUndoBtn) {
        headerUndoBtn.disabled = historyStack.length === 0;
        headerUndoBtn.classList.toggle('disabled', historyStack.length === 0);

        // Attacher les events de survol une seule fois
        if (!headerUndoBtn.dataset.popupInitialized) {
            headerUndoBtn.addEventListener('mouseenter', () => showUndoRedoPopup('undo', headerUndoBtn));
            headerUndoBtn.addEventListener('mouseleave', (e) => {
                if (!e.relatedTarget?.closest('.undo-redo-popup')) {
                    hideUndoRedoPopup();
                }
            });
            headerUndoBtn.dataset.popupInitialized = 'true';
        }
    }

    if (headerRedoBtn) {
        headerRedoBtn.disabled = redoStack.length === 0;
        headerRedoBtn.classList.toggle('disabled', redoStack.length === 0);

        // Attacher les events de survol
        if (!headerRedoBtn.dataset.popupInitialized) {
            headerRedoBtn.addEventListener('mouseenter', () => showUndoRedoPopup('redo', headerRedoBtn));
            headerRedoBtn.addEventListener('mouseleave', (e) => {
                if (!e.relatedTarget?.closest('.undo-redo-popup')) {
                    hideUndoRedoPopup();
                }
            });
            headerRedoBtn.dataset.popupInitialized = 'true';
        }
    }

    // Update mobile buttons
    if (mobileUndoBtn) {
        mobileUndoBtn.disabled = historyStack.length === 0;
        mobileUndoBtn.classList.toggle('disabled', historyStack.length === 0);
    }

    if (mobileRedoBtn) {
        mobileRedoBtn.disabled = redoStack.length === 0;
        mobileRedoBtn.classList.toggle('disabled', redoStack.length === 0);
    }
}

/**
 * Affiche la popup d'historique
 */
function showUndoRedoPopup(type, buttonElement) {
    let popup = document.getElementById('undoRedoPopup');
    if (!popup) {
        popup = document.createElement('div');
        popup.id = 'undoRedoPopup';
        popup.className = 'undo-redo-popup';
        popup.addEventListener('mouseleave', () => hideUndoRedoPopup());
        document.body.appendChild(popup);
    }

    const stack = type === 'undo' ? historyStack : redoStack;
    const title = type === 'undo' ? 'Historique d\'annulation' : 'Historique de rétablissement';

    if (stack.length === 0) {
        popup.innerHTML = `
            <div class="undo-redo-header"><span>${title}</span></div>
            <div class="undo-redo-empty">Aucune action disponible</div>
        `;
    } else {
        // Inverser pour avoir les plus récents en haut
        const displayStack = [...stack].reverse().slice(0, 15);

        popup.innerHTML = `
            <div class="undo-redo-header">
                <span>${title}</span>
                <span>${stack.length} action${stack.length > 1 ? 's' : ''}</span>
            </div>
            <ul class="undo-redo-list">
                ${displayStack.map((snap, idx) => `
                    <li class="undo-redo-item" onclick="jumpToHistoryState('${type}', ${stack.length - 1 - idx})">
                        <span class="undo-redo-item-label">${snap.label || 'Action sans nom'}</span>
                        <span class="undo-redo-item-time">${formatTimestamp(snap.timestamp)}</span>
                    </li>
                `).join('')}
            </ul>
        `;
    }

    // Positionner la popup
    const rect = buttonElement.getBoundingClientRect();
    popup.style.top = (rect.bottom + window.scrollY) + 'px';
    popup.style.left = (rect.left + rect.width / 2 + window.scrollX) + 'px';
    popup.classList.add('active');
}

/**
 * Cache la popup
 */
function hideUndoRedoPopup() {
    const popup = document.getElementById('undoRedoPopup');
    if (popup) {
        popup.classList.remove('active');
    }
}

/**
 * Formate un timestamp
 */
function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

/**
 * Annule ou rétablit plusieurs actions d'un coup
 */
function jumpToHistoryState(type, targetIndex) {
    if (type === 'undo') {
        const count = historyStack.length - targetIndex;
        for (let i = 0; i < count; i++) {
            undo();
        }
    } else {
        const count = redoStack.length - targetIndex;
        for (let i = 0; i < count; i++) {
            redo();
        }
    }
    hideUndoRedoPopup();
}

/**
 * Reinitialise completement l'historique
 */
function clearHistory() {
    historyStack = [];
    redoStack = [];
    _lastSnapshot = null;
    _pendingActionType = null;

    if (_debounceTimer) {
        clearTimeout(_debounceTimer);
        _debounceTimer = null;
    }

    updateUndoRedoButtons();
    console.log('[UndoRedo] Historique reinitialise');
}

/**
 * Initialise le systeme d'undo/redo
 */
function initUndoRedo() {
    if (_undoRedoInitialized) return;

    // S'assurer que les stacks existent
    if (typeof historyStack === 'undefined') {
        window.historyStack = [];
    }
    if (typeof redoStack === 'undefined') {
        window.redoStack = [];
    }
    if (typeof isUndoRedoAction === 'undefined') {
        window.isUndoRedoAction = false;
    }

    // Exposer les fonctions globalement
    window.saveToHistory = saveToHistory;
    window.saveToHistoryImmediate = saveToHistoryImmediate;
    window.undo = undo;
    window.redo = redo;
    window.updateUndoRedoButtons = updateUndoRedoButtons;
    window.clearHistory = clearHistory;

    // Initialiser le snapshot de référence dès que le projet est là
    setTimeout(() => {
        if (typeof project !== 'undefined' && project.id) {
            _lastSnapshot = createSnapshot();
            updateUndoRedoButtons();
            console.log('[UndoRedo] État initial capturé');
        }
    }, 200);

    _undoRedoInitialized = true;
    console.log('[UndoRedo] Systeme initialise');
}

// ============================================
// DECORATEURS POUR REPOSITORIES
// ============================================

/**
 * Wrapper pour les methodes de repository qui sauvegardent automatiquement
 * @param {Function} fn - La fonction a wrapper
 * @param {string} actionType - Le type d'action
 * @returns {Function} - La fonction wrappee
 */
function withHistory(fn, actionType) {
    return function (...args) {
        const result = fn.apply(this, args);
        saveToHistory(actionType);
        return result;
    };
}

/**
 * Wrapper pour les methodes de repository avec sauvegarde immediate
 * @param {Function} fn - La fonction a wrapper
 * @param {string} actionType - Le type d'action
 * @returns {Function} - La fonction wrappee
 */
function withHistoryImmediate(fn, actionType) {
    return function (...args) {
        const result = fn.apply(this, args);
        saveToHistoryImmediate(actionType);
        return result;
    };
}

// ============================================
// INTEGRATION AUTOMATIQUE AVEC LES REPOSITORIES
// ============================================

/**
 * Integre automatiquement l'undo/redo dans un repository
 * @param {Object} repository - Le repository a integrer
 * @param {string} name - Le nom du repository (pour les logs)
 */
function integrateWithRepository(repository, name) {
    const methodsToWrap = {
        // Methodes avec sauvegarde immediate (avant l'action)
        immediate: ['add', 'remove', 'delete', 'create', 'reorder', 'move', 'moveToCell', 'update'],
        // Methodes avec debounce (apres l'action)
        debounced: ['set', 'save']
    };

    // Wrapper les methodes immediates
    methodsToWrap.immediate.forEach(method => {
        if (typeof repository[method] === 'function') {
            const original = repository[method].bind(repository);
            repository[method] = function (...args) {
                const result = original(...args);
                saveToHistoryImmediate(`${name}.${method}`);
                return result;
            };
        }
    });

    // Wrapper les methodes debounced
    methodsToWrap.debounced.forEach(method => {
        if (typeof repository[method] === 'function') {
            const original = repository[method].bind(repository);
            repository[method] = function (...args) {
                const result = original(...args);
                saveToHistory(`${name}.${method}`);
                return result;
            };
        }
    });
}

/**
 * Integre l'undo/redo dans tous les repositories connus
 */
function integrateWithAllRepositories() {
    const integrate = (repo, name) => {
        try {
            if (typeof repo !== 'undefined') {
                integrateWithRepository(repo, name);
            }
        } catch (e) {
            console.error(`[UndoRedo] Erreur d'integration pour ${name}:`, e);
        }
    };

    // Structure
    integrate(ActRepository, 'Act');
    integrate(ChapterRepository, 'Chapter');
    integrate(SceneRepository, 'Scene');

    // Characters
    integrate(CharacterRepository, 'Character');

    // World
    integrate(WorldRepository, 'World');

    // Codex
    integrate(CodexRepository, 'Codex');

    // PlotGrid
    integrate(PlotGridRepository, 'PlotGrid');

    // Thriller Board
    //integrate(ThrillerElementRepository, 'ThrillerElement');
    //integrate(ThrillerCardRepository, 'ThrillerCard');
    //integrate(ThrillerRowRepository, 'ThrillerRow');
    //integrate(ThrillerColumnRepository, 'ThrillerColumn');
    //integrate(ThrillerConnectionRepository, 'ThrillerConnection');
    //integrate(ThrillerTypeRepository, 'ThrillerType');

    // Arc Board
    integrate(ArcRepository, 'Arc');
    integrate(BoardItemRepository, 'BoardItem');
    integrate(CardRepository, 'Card');
    integrate(ConnectionRepository, 'Connection');

    console.log('[UndoRedo] Integration avec tous les repositories effectuee');
}



// ============================================
// HOOKS AUTOMATIQUES POUR LES CHAMPS DE TEXTE
// ============================================

/**
 * Timer de debounce pour les modifications de texte
 */
let _textEditDebounceTimer = null;
const _textEditDebounceDelay = 500; // 0.5 secondes - réduit pour une meilleure réactivité

/**
 * Installe les hooks automatiques sur les editeurs de texte
 */
function installTextEditHooks() {
    // Hook sur les evenements de focus pour sauvegarder l'etat avant edition
    document.addEventListener('focusin', (e) => {
        const target = e.target;

        // Verifier si c'est un element editable important
        if (
            target.classList.contains('editor-textarea') ||
            target.classList.contains('synopsis-input') ||
            target.id === 'sceneContent' ||
            target.id === 'sceneTitle' ||
            target.getAttribute('contenteditable') === 'true'
        ) {
            // Sauvegarder l'etat avant de commencer l'edition
            if (!isUndoRedoAction) {
                saveToHistoryImmediate('text-edit-start');
            }
        }
    }, true);

    // Hook sur les evenements de modification de texte avec debounce
    document.addEventListener('input', (e) => {
        const target = e.target;

        // Verifier si c'est un element editable important
        if (
            target.classList.contains('editor-textarea') ||
            target.classList.contains('synopsis-input') ||
            target.classList.contains('scene-separator-synopsis') ||
            target.id === 'sceneContent' ||
            target.id === 'sceneTitle' ||
            target.getAttribute('contenteditable') === 'true' ||
            target.tagName === 'TEXTAREA' ||
            (target.tagName === 'INPUT' && target.type === 'text')
        ) {
            // Debounce pour eviter trop de sauvegardes
            if (_textEditDebounceTimer) {
                clearTimeout(_textEditDebounceTimer);
            }

            _textEditDebounceTimer = setTimeout(() => {
                if (!isUndoRedoAction) {
                    saveToHistory('text-edit');
                }
                _textEditDebounceTimer = null;
            }, _textEditDebounceDelay);
        }
    }, true);

    // Hook sur les evenements de blur pour sauvegarder immediatement
    document.addEventListener('focusout', (e) => {
        const target = e.target;

        // Verifier si c'est un element editable important
        if (
            target.classList.contains('editor-textarea') ||
            target.classList.contains('synopsis-input') ||
            target.classList.contains('scene-separator-synopsis') ||
            target.id === 'sceneContent' ||
            target.getAttribute('contenteditable') === 'true'
        ) {
            // Annuler le debounce en cours
            if (_textEditDebounceTimer) {
                clearTimeout(_textEditDebounceTimer);
                _textEditDebounceTimer = null;
            }

            // Sauvegarder immediatement
            if (!isUndoRedoAction) {
                saveToHistory('text-edit-end');
            }
        }
    }, true);

    console.log('[UndoRedo] Hooks de texte installes');
}

// ============================================
// OBSERVATEUR DE MUTATIONS DU PROJET
// ============================================

/**
 * Installe un proxy pour surveiller les modifications du projet
 * Note: Cette approche est optionnelle et peut etre couteuse en performance
 */
function installProjectProxy() {
    // Pas utilise par defaut car les hooks manuels sont suffisants
    // et les proxies peuvent causer des problemes de compatibilite
}

// ============================================
// INITIALISATION AU CHARGEMENT
// ============================================

// Initialiser quand le DOM est pret
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initUndoRedo();
            // Integrer apres un court delai pour que les repos soient charges
            setTimeout(() => {
                integrateWithAllRepositories();
                installTextEditHooks();
            }, 100);
        });
    } else {
        initUndoRedo();
        setTimeout(() => {
            integrateWithAllRepositories();
            installTextEditHooks();
        }, 100);
    }
}

// Exposer les fonctions utilitaires
window.UndoRedo = {
    init: initUndoRedo,
    save: saveToHistory,
    saveImmediate: saveToHistoryImmediate,
    undo: undo,
    redo: redo,
    clear: clearHistory,
    updateButtons: updateUndoRedoButtons,
    integrate: integrateWithAllRepositories,
    integrateRepository: integrateWithRepository,
    // Utilitaires
    deepClone: deepClone,
    hasChanges: hasSignificantChanges,
    createSnapshot: createSnapshot,
    // Config
    config: UndoRedoConfig
};
