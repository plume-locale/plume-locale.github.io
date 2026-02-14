/**
 * [Main : Scene Navigation]
 * Point d'entrée pour la navigation entre scènes.
 */

function initSceneNavigation() {
    // Créer la barre si elle n'existe pas
    window.sceneNavigationView.ensureToolbarCreated();

    // Attacher les événements à tous les éditeurs
    const editors = document.querySelectorAll('.editor-textarea[contenteditable="true"]');
    editors.forEach(editor => {
        if (!editor.hasAttribute('data-scene-nav-init')) {
            editor.setAttribute('data-scene-nav-init', 'true');

            editor.addEventListener('mouseup', window.sceneNavigationHandlers.handleCursorChange);
            editor.addEventListener('keyup', window.sceneNavigationHandlers.handleCursorChange);
            editor.addEventListener('focus', window.sceneNavigationHandlers.handleCursorChange);
            editor.addEventListener('blur', () => window.sceneNavigationView.hide());
        }
    });

    // Écouter le scroll pour mettre à jour la position
    const workspace = document.querySelector('.editor-workspace');
    if (workspace && !workspace.hasAttribute('data-scene-nav-scroll')) {
        workspace.setAttribute('data-scene-nav-scroll', 'true');
        workspace.addEventListener('scroll', window.sceneNavigationHandlers.handleScroll);
    }

    // Attacher les événements aux boutons
    const toolbar = document.getElementById('sceneNavToolbar');
    if (toolbar) {
        const prevBtn = toolbar.querySelector('.scene-nav-prev');
        const nextBtn = toolbar.querySelector('.scene-nav-next');

        if (prevBtn && !prevBtn.hasAttribute('data-nav-init')) {
            prevBtn.setAttribute('data-nav-init', 'true');
            prevBtn.addEventListener('mousedown', (e) => window.sceneNavigationHandlers.handleMovePrevious(e));
        }

        if (nextBtn && !nextBtn.hasAttribute('data-nav-init')) {
            nextBtn.setAttribute('data-nav-init', 'true');
            nextBtn.addEventListener('mousedown', (e) => window.sceneNavigationHandlers.handleMoveNext(e));
        }
    }

    // Réagir au changement de langue
    window.addEventListener('localeChanged', () => {
        if (window.sceneNavigationView && typeof window.sceneNavigationView.render === 'function') {
            window.sceneNavigationView.render();
        }
    });
}

/**
 * Nettoie la barre de navigation.
 */
function cleanupSceneNavigation() {
    window.sceneNavigationView.hide();
    window.sceneNavigationModel.reset();

    const editors = document.querySelectorAll('.editor-textarea[data-scene-nav-init]');
    editors.forEach(editor => {
        editor.removeAttribute('data-scene-nav-init');
        editor.removeEventListener('mouseup', window.sceneNavigationHandlers.handleCursorChange);
        editor.removeEventListener('keyup', window.sceneNavigationHandlers.handleCursorChange);
        editor.removeEventListener('focus', window.sceneNavigationHandlers.handleCursorChange);
    });

    const workspace = document.querySelector('.editor-workspace[data-scene-nav-scroll]');
    if (workspace) {
        workspace.removeAttribute('data-scene-nav-scroll');
        workspace.removeEventListener('scroll', window.sceneNavigationHandlers.handleScroll);
    }
}

// Exposer globalement pour la compatibilité
window.initSceneNavigation = initSceneNavigation;
window.cleanupSceneNavigation = cleanupSceneNavigation;
window.moveTextToPreviousScene = (e) => window.sceneNavigationHandlers.handleMovePrevious(e);
window.moveTextToNextScene = (e) => window.sceneNavigationHandlers.handleMoveNext(e);
