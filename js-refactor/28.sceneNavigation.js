/**
 * [MVVM : Scene Navigation]
 * Barre de navigation flottante permettant de déplacer du texte entre scènes
 * lors de l'écriture.
 */

// État de la barre de navigation
let sceneNavToolbar = null;
let sceneNavUpdateTimeout = null;
let lastCursorRect = null;
let savedSelection = null;
let activeSceneContext = null; // Contexte de la scène active (pour modes chapitre/acte)

/**
 * Sauvegarde la sélection actuelle.
 */
function saveSelection() {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
        return selection.getRangeAt(0).cloneRange();
    }
    return null;
}

/**
 * Restaure une sélection sauvegardée.
 */
function restoreSelection(range) {
    if (range) {
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
    }
}

/**
 * Initialise la barre de navigation entre scènes.
 * Doit être appelée après le rendu de l'éditeur.
 */
function initSceneNavigation() {
    // Créer la barre si elle n'existe pas
    if (!sceneNavToolbar) {
        createSceneNavToolbar();
    }

    // Attacher les événements à tous les éditeurs (mode scène, chapitre, acte)
    const editors = document.querySelectorAll('.editor-textarea[contenteditable="true"]');
    editors.forEach(editor => {
        if (!editor.hasAttribute('data-scene-nav-init')) {
            editor.setAttribute('data-scene-nav-init', 'true');

            // Écouter les événements de sélection et de clic
            editor.addEventListener('mouseup', handleCursorChange);
            editor.addEventListener('keyup', handleCursorChange);
            editor.addEventListener('focus', handleCursorChange);
            editor.addEventListener('blur', hideSceneNavToolbar);
        }
    });

    // Écouter le scroll pour mettre à jour la position
    const workspace = document.querySelector('.editor-workspace');
    if (workspace && !workspace.hasAttribute('data-scene-nav-scroll')) {
        workspace.setAttribute('data-scene-nav-scroll', 'true');
        workspace.addEventListener('scroll', debounceUpdateToolbarPosition);
    }
}

/**
 * Crée la barre d'outils de navigation entre scènes.
 */
function createSceneNavToolbar() {
    // Supprimer l'ancienne toolbar si elle existe
    const existing = document.getElementById('sceneNavToolbar');
    if (existing) existing.remove();

    sceneNavToolbar = document.createElement('div');
    sceneNavToolbar.id = 'sceneNavToolbar';
    sceneNavToolbar.className = 'scene-nav-toolbar';
    sceneNavToolbar.innerHTML = `
        <div class="scene-nav-buttons">
            <button class="scene-nav-btn scene-nav-prev" title="Déplacer vers la scène précédente (tout le texte avant le curseur)">
                <i data-lucide="chevron-left" style="width:16px;height:16px;"></i>
            </button>
            <button class="scene-nav-btn scene-nav-next" title="Déplacer vers la scène suivante (tout le texte après le curseur)">
                <i data-lucide="chevron-right" style="width:16px;height:16px;"></i>
            </button>
        </div>
        <div class="scene-nav-line"></div>
        <div class="scene-nav-word-counts">
            <span class="scene-nav-words-before" title="Mots avant le curseur">0 mots</span>
            <span class="scene-nav-words-after" title="Mots après le curseur">0 mots</span>
        </div>
    `;

    document.body.appendChild(sceneNavToolbar);

    // Attacher les événements avec mousedown + preventDefault pour conserver la sélection
    const prevBtn = sceneNavToolbar.querySelector('.scene-nav-prev');
    const nextBtn = sceneNavToolbar.querySelector('.scene-nav-next');

    prevBtn.addEventListener('mousedown', (e) => {
        e.preventDefault(); // Empêche la perte de focus/sélection
        e.stopPropagation();
        // Sauvegarder la sélection avant l'action
        savedSelection = saveSelection();
        moveTextToPreviousScene();
    });

    nextBtn.addEventListener('mousedown', (e) => {
        e.preventDefault(); // Empêche la perte de focus/sélection
        e.stopPropagation();
        // Sauvegarder la sélection avant l'action
        savedSelection = saveSelection();
        moveTextToNextScene();
    });
}

/**
 * Gère le changement de position du curseur.
 */
function handleCursorChange(event) {
    // Attendre un peu pour être sûr que la sélection est stable
    clearTimeout(sceneNavUpdateTimeout);
    sceneNavUpdateTimeout = setTimeout(() => {
        updateSceneNavToolbarPosition();
    }, 100);
}

/**
 * Mise à jour debounced de la position de la toolbar lors du scroll.
 */
let scrollDebounceTimeout = null;
function debounceUpdateToolbarPosition() {
    clearTimeout(scrollDebounceTimeout);
    scrollDebounceTimeout = setTimeout(() => {
        if (sceneNavToolbar && sceneNavToolbar.classList.contains('visible')) {
            updateSceneNavToolbarPosition();
        }
    }, 50);
}

/**
 * Détecte le contexte de la scène à partir de l'éditeur actif.
 * Fonctionne en mode scène unique, chapitre ou acte.
 */
function detectSceneContext(editor) {
    // Mode scène unique : utiliser les variables globales
    if (currentSceneId && currentChapterId && currentActId) {
        return {
            sceneId: currentSceneId,
            chapterId: currentChapterId,
            actId: currentActId
        };
    }

    // Mode chapitre ou acte : récupérer depuis les attributs data-*
    const sceneId = editor.getAttribute('data-scene-id');
    const chapterId = editor.getAttribute('data-chapter-id') || currentChapterId;
    const actId = editor.getAttribute('data-act-id') || currentActId;

    if (sceneId && chapterId && actId) {
        return {
            sceneId: parseInt(sceneId, 10),
            chapterId: parseInt(chapterId, 10),
            actId: parseInt(actId, 10)
        };
    }

    // Essayer de trouver via le parent (chapter-scene-block ou act-scene-block)
    const sceneBlock = editor.closest('[data-scene-id]');
    if (sceneBlock) {
        const blockSceneId = sceneBlock.getAttribute('data-scene-id');
        const blockChapterId = sceneBlock.getAttribute('data-chapter-id') || currentChapterId;
        const blockActId = sceneBlock.getAttribute('data-act-id') || currentActId;

        if (blockSceneId && blockChapterId && blockActId) {
            return {
                sceneId: parseInt(blockSceneId, 10),
                chapterId: parseInt(blockChapterId, 10),
                actId: parseInt(blockActId, 10)
            };
        }
    }

    return null;
}

/**
 * Met à jour la position de la barre de navigation.
 */
function updateSceneNavToolbarPosition() {
    if (!sceneNavToolbar) return;

    // Trouver l'éditeur actif (celui qui a le focus)
    const activeElement = document.activeElement;
    if (!activeElement || !activeElement.classList.contains('editor-textarea')) {
        hideSceneNavToolbar();
        return;
    }
    const editor = activeElement;

    // Détecter le contexte de la scène (mode scène unique ou chapitre/acte)
    activeSceneContext = detectSceneContext(editor);
    if (!activeSceneContext) {
        hideSceneNavToolbar();
        return;
    }

    // Obtenir la position du curseur
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
        hideSceneNavToolbar();
        return;
    }

    const range = selection.getRangeAt(0);

    // Vérifier que le curseur est bien dans l'éditeur
    if (!editor.contains(range.commonAncestorContainer)) {
        hideSceneNavToolbar();
        return;
    }

    // Obtenir le rect de la ligne courante
    const rects = range.getClientRects();
    let rect;

    if (rects.length > 0) {
        rect = rects[rects.length - 1]; // Prendre le dernier rect (position du curseur)
    } else {
        // Si pas de rect (curseur au début), utiliser le rect du range collapsed
        const tempRange = range.cloneRange();
        tempRange.collapse(true);
        const span = document.createElement('span');
        span.textContent = '\u200b'; // Zero-width space
        tempRange.insertNode(span);
        rect = span.getBoundingClientRect();
        span.remove();
    }

    if (!rect || rect.width === 0 && rect.height === 0) {
        hideSceneNavToolbar();
        return;
    }

    // Calculer la position - aligné avec la ligne du curseur
    const editorRect = editor.getBoundingClientRect();
    const lineHeight = rect.height || 24;
    const verticalCenter = rect.top + (lineHeight / 2);

    // Vérifier que la position est visible dans la fenêtre
    if (verticalCenter < editorRect.top || verticalCenter > window.innerHeight) {
        hideSceneNavToolbar();
        return;
    }

    // Positionner les boutons dans la marge gauche
    const buttonsEl = sceneNavToolbar.querySelector('.scene-nav-buttons');
    if (buttonsEl) {
        buttonsEl.style.left = `${editorRect.left - 70}px`; // 70px avant le texte
        buttonsEl.style.top = `${verticalCenter - 14}px`; // Centré verticalement (boutons de 28px)
    }

    // Positionner les compteurs dans la marge droite
    const wordCountsEl = sceneNavToolbar.querySelector('.scene-nav-word-counts');
    if (wordCountsEl) {
        wordCountsEl.style.left = `${editorRect.right + 15}px`; // 15px après le texte
        wordCountsEl.style.top = `${verticalCenter - 16}px`; // Centré verticalement
    }

    // Vérifier si des scènes adjacentes existent
    const adjacentScenes = getAdjacentScenes();
    const hasPrev = adjacentScenes.previous !== null;
    const hasNext = adjacentScenes.next !== null;

    if (!hasPrev && !hasNext) {
        hideSceneNavToolbar();
        return;
    }

    // Mettre à jour les boutons
    const prevBtn = sceneNavToolbar.querySelector('.scene-nav-prev');
    const nextBtn = sceneNavToolbar.querySelector('.scene-nav-next');

    if (prevBtn) {
        prevBtn.style.display = hasPrev ? '' : 'none';
        if (hasPrev) {
            prevBtn.title = `Déplacer vers "${adjacentScenes.previous.title}" (texte avant le curseur)`;
        }
    }
    if (nextBtn) {
        nextBtn.style.display = hasNext ? '' : 'none';
        if (hasNext) {
            nextBtn.title = `Déplacer vers "${adjacentScenes.next.title}" (texte après le curseur)`;
        }
    }

    // Calculer et afficher le nombre de mots avant/après le curseur
    updateWordCountsDisplay(editor, range);

    sceneNavToolbar.classList.add('visible');

    lastCursorRect = rect;
}

/**
 * Calcule et met à jour l'affichage du nombre de mots avant et après le curseur.
 */
function updateWordCountsDisplay(editor, range) {
    if (!sceneNavToolbar) return;

    const wordsBeforeEl = sceneNavToolbar.querySelector('.scene-nav-words-before');
    const wordsAfterEl = sceneNavToolbar.querySelector('.scene-nav-words-after');

    if (!wordsBeforeEl || !wordsAfterEl) return;

    try {
        // Créer un range du début de l'éditeur jusqu'au curseur
        const beforeRange = document.createRange();
        beforeRange.setStart(editor, 0);
        beforeRange.setEnd(range.startContainer, range.startOffset);

        // Extraire le texte avant le curseur
        const beforeFragment = beforeRange.cloneContents();
        const beforeDiv = document.createElement('div');
        beforeDiv.appendChild(beforeFragment);
        const textBefore = beforeDiv.textContent || '';

        // Créer un range du curseur jusqu'à la fin de l'éditeur
        const afterRange = document.createRange();
        afterRange.setStart(range.endContainer, range.endOffset);
        if (editor.lastChild) {
            afterRange.setEndAfter(editor.lastChild);
        } else {
            afterRange.setEnd(editor, editor.childNodes.length);
        }

        // Extraire le texte après le curseur
        const afterFragment = afterRange.cloneContents();
        const afterDiv = document.createElement('div');
        afterDiv.appendChild(afterFragment);
        const textAfter = afterDiv.textContent || '';

        // Compter les mots
        const wordsBefore = countWords(textBefore);
        const wordsAfter = countWords(textAfter);

        // Mettre à jour l'affichage
        wordsBeforeEl.textContent = `${wordsBefore} mots`;
        wordsAfterEl.textContent = `${wordsAfter} mots`;
    } catch (e) {
        // En cas d'erreur, ne pas bloquer
        wordsBeforeEl.textContent = '- mots';
        wordsAfterEl.textContent = '- mots';
    }
}

/**
 * Compte le nombre de mots dans un texte.
 */
function countWords(text) {
    if (!text || typeof text !== 'string') return 0;
    // Supprimer les espaces multiples et compter les mots
    const trimmed = text.trim();
    if (trimmed === '') return 0;
    return trimmed.split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Cache la barre de navigation.
 */
function hideSceneNavToolbar() {
    if (sceneNavToolbar) {
        sceneNavToolbar.classList.remove('visible');
    }
}

/**
 * Obtient les scènes adjacentes (précédente et suivante) à la scène actuelle.
 * @returns {Object} { previous: scene|null, next: scene|null, prevLocation: {actId, chapterId}, nextLocation: {actId, chapterId} }
 */
function getAdjacentScenes() {
    const result = {
        previous: null,
        next: null,
        prevLocation: null,
        nextLocation: null
    };

    // Utiliser le contexte actif détecté
    const ctx = activeSceneContext;
    if (!ctx || !ctx.actId || !ctx.chapterId || !ctx.sceneId) return result;

    // Construire une liste plate de toutes les scènes avec leurs emplacements
    const allScenes = [];
    for (const act of project.acts) {
        for (const chapter of (act.chapters || [])) {
            for (const scene of (chapter.scenes || [])) {
                allScenes.push({
                    scene,
                    actId: act.id,
                    chapterId: chapter.id
                });
            }
        }
    }

    // Trouver l'index de la scène actuelle
    const currentIndex = allScenes.findIndex(
        s => s.actId === ctx.actId &&
            s.chapterId === ctx.chapterId &&
            s.scene.id === ctx.sceneId
    );

    if (currentIndex === -1) return result;

    // Scène précédente
    if (currentIndex > 0) {
        const prev = allScenes[currentIndex - 1];
        result.previous = prev.scene;
        result.prevLocation = {
            actId: prev.actId,
            chapterId: prev.chapterId
        };
    }

    // Scène suivante
    if (currentIndex < allScenes.length - 1) {
        const next = allScenes[currentIndex + 1];
        result.next = next.scene;
        result.nextLocation = {
            actId: next.actId,
            chapterId: next.chapterId
        };
    }

    return result;
}

/**
 * Déplace le texte avant le curseur vers la fin de la scène précédente.
 */
function moveTextToPreviousScene() {
    const editor = getActiveEditor();
    if (!editor) return;

    // S'assurer que le contexte est à jour
    if (!activeSceneContext) {
        activeSceneContext = detectSceneContext(editor);
    }
    if (!activeSceneContext) return;

    const adjacentScenes = getAdjacentScenes();
    if (!adjacentScenes.previous) {
        showNotification('Aucune scène précédente disponible', 'warning');
        return;
    }

    // Utiliser la sélection sauvegardée ou la sélection courante
    let range = savedSelection;
    if (!range) {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) {
            showNotification('Placez votre curseur dans le texte', 'warning');
            return;
        }
        range = selection.getRangeAt(0);
    }

    // Sauvegarder l'état pour undo
    if (typeof saveToHistoryImmediate === 'function') saveToHistoryImmediate();

    // Créer un range du début de l'éditeur jusqu'au curseur
    const beforeRange = document.createRange();
    beforeRange.setStart(editor, 0);
    beforeRange.setEnd(range.startContainer, range.startOffset);

    // Extraire le contenu HTML avant le curseur
    const fragment = beforeRange.cloneContents();
    const tempDiv = document.createElement('div');
    tempDiv.appendChild(fragment);
    const textToMove = tempDiv.innerHTML.trim();

    if (!textToMove || textToMove === '<br>' || textToMove === '') {
        showNotification('Aucun texte à déplacer avant le curseur', 'info');
        return;
    }

    // Supprimer le texte de la scène actuelle
    beforeRange.deleteContents();

    // Nettoyer le contenu restant (supprimer les br/espaces vides au début)
    cleanEditorStart(editor);

    // Ajouter le texte à la fin de la scène précédente
    const prevScene = adjacentScenes.previous;
    const currentContent = prevScene.content || '';

    // Ajouter un séparateur si nécessaire
    let separator = '';
    if (currentContent && !currentContent.endsWith('<br>') && !currentContent.endsWith('</p>') && !currentContent.endsWith('</div>')) {
        separator = '<br><br>';
    } else if (currentContent && !currentContent.endsWith('<br>')) {
        separator = '<br>';
    }

    prevScene.content = currentContent + separator + textToMove;

    // Mettre à jour la scène actuelle
    const currentScene = getCurrentScene();
    if (currentScene) {
        currentScene.content = editor.innerHTML;
        currentScene.wordCount = typeof getWordCount === 'function' ? getWordCount(editor.innerHTML) : 0;
    }

    // Mettre à jour le compteur de mots de la scène précédente
    prevScene.wordCount = typeof getWordCount === 'function' ? getWordCount(prevScene.content) : 0;

    // Mettre à jour l'éditeur de la scène précédente dans le DOM (mode chapitre/acte)
    updateAdjacentEditorInDOM(prevScene.id, prevScene.content);

    // Sauvegarder et rafraîchir
    if (typeof saveProject === 'function') saveProject();
    if (typeof updateStats === 'function') updateStats();
    if (typeof renderActsList === 'function') renderActsList();

    // Placer le curseur au début de l'éditeur
    const newSelection = window.getSelection();
    const newRange = document.createRange();
    if (editor.firstChild) {
        newRange.setStart(editor.firstChild, 0);
    } else {
        newRange.setStart(editor, 0);
    }
    newRange.collapse(true);
    newSelection.removeAllRanges();
    newSelection.addRange(newRange);

    // Nettoyer la sélection sauvegardée
    savedSelection = null;

    showNotification(`Texte déplacé vers "${prevScene.title}"`, 'success');
    hideSceneNavToolbar();
}

/**
 * Met à jour le contenu d'un éditeur adjacent dans le DOM (pour mode chapitre/acte).
 */
function updateAdjacentEditorInDOM(sceneId, content) {
    const adjacentEditor = document.querySelector(`.editor-textarea[data-scene-id="${sceneId}"]`);
    if (adjacentEditor && adjacentEditor !== document.activeElement) {
        adjacentEditor.innerHTML = content;
    }
}

/**
 * Déplace le texte après le curseur vers le début de la scène suivante.
 */
function moveTextToNextScene() {
    const editor = getActiveEditor();
    if (!editor) return;

    // S'assurer que le contexte est à jour
    if (!activeSceneContext) {
        activeSceneContext = detectSceneContext(editor);
    }
    if (!activeSceneContext) return;

    const adjacentScenes = getAdjacentScenes();
    if (!adjacentScenes.next) {
        showNotification('Aucune scène suivante disponible', 'warning');
        return;
    }

    // Utiliser la sélection sauvegardée ou la sélection courante
    let range = savedSelection;
    if (!range) {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) {
            showNotification('Placez votre curseur dans le texte', 'warning');
            return;
        }
        range = selection.getRangeAt(0);
    }

    // Sauvegarder l'état pour undo
    if (typeof saveToHistoryImmediate === 'function') saveToHistoryImmediate();

    // Créer un range du curseur jusqu'à la fin de l'éditeur
    const afterRange = document.createRange();
    afterRange.setStart(range.endContainer, range.endOffset);

    // Gérer le cas où l'éditeur est vide ou le lastChild n'existe pas
    if (editor.lastChild) {
        afterRange.setEndAfter(editor.lastChild);
    } else {
        afterRange.setEnd(editor, editor.childNodes.length);
    }

    // Extraire le contenu HTML après le curseur
    const fragment = afterRange.cloneContents();
    const tempDiv = document.createElement('div');
    tempDiv.appendChild(fragment);
    const textToMove = tempDiv.innerHTML.trim();

    if (!textToMove || textToMove === '<br>' || textToMove === '') {
        showNotification('Aucun texte à déplacer après le curseur', 'info');
        return;
    }

    // Supprimer le texte de la scène actuelle
    afterRange.deleteContents();

    // Nettoyer le contenu restant (supprimer les br/espaces vides à la fin)
    cleanEditorEnd(editor);

    // Ajouter le texte au début de la scène suivante
    const nextScene = adjacentScenes.next;
    const currentContent = nextScene.content || '';

    // Ajouter un séparateur si nécessaire
    let separator = '';
    if (currentContent && !currentContent.startsWith('<br>') && !currentContent.startsWith('<p>') && !currentContent.startsWith('<div>')) {
        separator = '<br><br>';
    } else if (currentContent && !currentContent.startsWith('<br>')) {
        separator = '<br>';
    }

    nextScene.content = textToMove + separator + currentContent;

    // Mettre à jour la scène actuelle
    const currentScene = getCurrentScene();
    if (currentScene) {
        currentScene.content = editor.innerHTML;
        currentScene.wordCount = typeof getWordCount === 'function' ? getWordCount(editor.innerHTML) : 0;
    }

    // Mettre à jour le compteur de mots de la scène suivante
    nextScene.wordCount = typeof getWordCount === 'function' ? getWordCount(nextScene.content) : 0;

    // Mettre à jour l'éditeur de la scène suivante dans le DOM (mode chapitre/acte)
    updateAdjacentEditorInDOM(nextScene.id, nextScene.content);

    // Sauvegarder et rafraîchir
    if (typeof saveProject === 'function') saveProject();
    if (typeof updateStats === 'function') updateStats();
    if (typeof renderActsList === 'function') renderActsList();

    // Nettoyer la sélection sauvegardée
    savedSelection = null;

    showNotification(`Texte déplacé vers "${nextScene.title}"`, 'success');
    hideSceneNavToolbar();
}

/**
 * Obtient la scène actuellement ouverte (basée sur activeSceneContext).
 */
function getCurrentScene() {
    const ctx = activeSceneContext;
    if (!ctx || !ctx.actId || !ctx.chapterId || !ctx.sceneId) return null;

    const act = project.acts.find(a => a.id === ctx.actId);
    if (!act) return null;

    const chapter = act.chapters.find(c => c.id === ctx.chapterId);
    if (!chapter) return null;

    return chapter.scenes.find(s => s.id === ctx.sceneId) || null;
}

/**
 * Trouve l'éditeur actif basé sur le contexte de scène.
 */
function getActiveEditor() {
    // D'abord essayer l'élément actif
    const activeElement = document.activeElement;
    if (activeElement && activeElement.classList.contains('editor-textarea')) {
        return activeElement;
    }

    // Sinon chercher par data-scene-id si on a un contexte
    if (activeSceneContext && activeSceneContext.sceneId) {
        const editor = document.querySelector(`.editor-textarea[data-scene-id="${activeSceneContext.sceneId}"]`);
        if (editor) return editor;
    }

    // Fallback : premier éditeur trouvé
    return document.querySelector('.editor-textarea[contenteditable="true"]');
}

/**
 * Nettoie le début de l'éditeur (supprime les br et espaces vides).
 */
function cleanEditorStart(editor) {
    while (editor.firstChild) {
        const node = editor.firstChild;
        if (node.nodeType === Node.TEXT_NODE) {
            if (node.textContent.trim() === '') {
                node.remove();
                continue;
            }
            node.textContent = node.textContent.trimStart();
            break;
        } else if (node.nodeName === 'BR') {
            node.remove();
            continue;
        } else if (node.innerHTML !== undefined && node.innerHTML.trim() === '') {
            node.remove();
            continue;
        }
        break;
    }
}

/**
 * Nettoie la fin de l'éditeur (supprime les br et espaces vides).
 */
function cleanEditorEnd(editor) {
    while (editor.lastChild) {
        const node = editor.lastChild;
        if (node.nodeType === Node.TEXT_NODE) {
            if (node.textContent.trim() === '') {
                node.remove();
                continue;
            }
            node.textContent = node.textContent.trimEnd();
            break;
        } else if (node.nodeName === 'BR') {
            node.remove();
            continue;
        } else if (node.innerHTML !== undefined && node.innerHTML.trim() === '') {
            node.remove();
            continue;
        }
        break;
    }
}

/**
 * Affiche une notification temporaire.
 */
function showNotification(message, type = 'info') {
    // Utiliser la fonction de notification existante si disponible
    if (typeof showToast === 'function') {
        showToast(message, type);
        return;
    }

    // Créer une notification simple
    const notification = document.createElement('div');
    notification.className = `scene-nav-notification scene-nav-notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        padding: 12px 24px;
        border-radius: 8px;
        font-size: 0.9rem;
        font-weight: 500;
        z-index: 10000;
        animation: slideUp 0.3s ease;
        background: ${type === 'success' ? '#2ecc71' : type === 'warning' ? '#f39c12' : type === 'error' ? '#e74c3c' : '#3498db'};
        color: white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideDown 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 2500);
}

/**
 * Nettoie la barre de navigation (à appeler lors du changement de vue).
 */
function cleanupSceneNavigation() {
    hideSceneNavToolbar();
    activeSceneContext = null;

    const editors = document.querySelectorAll('.editor-textarea[data-scene-nav-init]');
    editors.forEach(editor => {
        editor.removeAttribute('data-scene-nav-init');
        editor.removeEventListener('mouseup', handleCursorChange);
        editor.removeEventListener('keyup', handleCursorChange);
        editor.removeEventListener('focus', handleCursorChange);
        editor.removeEventListener('blur', hideSceneNavToolbar);
    });

    const workspace = document.querySelector('.editor-workspace[data-scene-nav-scroll]');
    if (workspace) {
        workspace.removeAttribute('data-scene-nav-scroll');
    }
}

// Exposer les fonctions globalement
window.initSceneNavigation = initSceneNavigation;
window.cleanupSceneNavigation = cleanupSceneNavigation;
window.moveTextToPreviousScene = moveTextToPreviousScene;
window.moveTextToNextScene = moveTextToNextScene;
