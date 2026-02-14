// ============================================================
// word-repetition.main.js - Point d'entrée et initialisation
// ============================================================

/**
 * [MVVM : Other]
 * Toggle l'affichage du panneau de répétitions de mots
 */
function toggleWordRepetitionPanel() {
    const sidebar = document.getElementById('wordRepetitionSidebar');
    const btn = document.getElementById('toolRepetitionBtn');

    if (!sidebar) return;

    const isVisible = !sidebar.classList.contains('hidden');

    if (isVisible) {
        sidebar.classList.add('hidden');
        if (btn) btn.classList.remove('active');
        WordRepetitionState.panelVisible = false;
        // Nettoyer les surlignages quand on ferme le panneau
        clearWordRepetitionHighlights();
    } else {
        sidebar.classList.remove('hidden');
        if (btn) btn.classList.add('active');
        WordRepetitionState.panelVisible = true;

        // Initialiser le panneau si nécessaire
        initWordRepetitionPanel();

        // Initialiser les icônes Lucide
        if (typeof lucide !== 'undefined') {
            setTimeout(() => lucide.createIcons(), 50);
        }
    }
}

/**
 * [MVVM : Other]
 * Affiche le panneau de répétitions (utile pour affichage programmatique)
 */
function showWordRepetitionPanel() {
    const sidebar = document.getElementById('wordRepetitionSidebar');
    const btn = document.getElementById('toolRepetitionBtn');

    if (!sidebar) return;

    sidebar.classList.remove('hidden');
    if (btn) btn.classList.add('active');
    WordRepetitionState.panelVisible = true;

    initWordRepetitionPanel();

    if (typeof lucide !== 'undefined') {
        setTimeout(() => lucide.createIcons(), 50);
    }
}

/**
 * [MVVM : Other]
 * Cache le panneau de répétitions
 */
function hideWordRepetitionPanel() {
    const sidebar = document.getElementById('wordRepetitionSidebar');
    const btn = document.getElementById('toolRepetitionBtn');

    if (!sidebar) return;

    sidebar.classList.add('hidden');
    if (btn) btn.classList.remove('active');
    WordRepetitionState.panelVisible = false;
    // Nettoyer les surlignages
    clearWordRepetitionHighlights();
}

/**
 * [MVVM : Other]
 * Nettoie tous les surlignages de répétition dans l'éditeur
 */
function clearWordRepetitionHighlights() {
    if (typeof WordRepetitionHandlers !== 'undefined' && WordRepetitionHandlers._clearAllHighlights) {
        WordRepetitionHandlers._clearAllHighlights();
    }
}

/**
 * [MVVM : Other]
 * Lance une analyse rapide pour la scène courante et affiche le résultat
 */
function analyzeCurrentSceneRepetitions() {
    showWordRepetitionPanel();

    // Lancer l'analyse après un court délai pour laisser le panneau s'afficher
    setTimeout(() => {
        WordRepetitionHandlers.onRefresh();
    }, 100);
}

/**
 * [MVVM : Other]
 * Intégration avec l'ouverture de scène
 * Appelé automatiquement quand une scène est ouverte
 */
function onSceneOpenedForRepetition() {
    if (WordRepetitionState.panelVisible) {
        // Effacer le rapport précédent car la scène a changé
        WordRepetitionViewModel.clearReport();

        // Re-rendre le panneau pour afficher l'état vide
        const container = document.getElementById('wordRepetitionContainer');
        if (container) {
            WordRepetitionView.renderPanel(container);
        }
    }
}

/**
 * [MVVM : Other]
 * Raccourci clavier pour analyser les répétitions
 * Ctrl+Shift+R
 */
function setupWordRepetitionKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // Ctrl+Shift+R : Analyser les répétitions
        if (e.ctrlKey && e.shiftKey && e.key === 'R') {
            e.preventDefault();
            analyzeCurrentSceneRepetitions();
        }
    });
}

/**
 * [MVVM : Other]
 * Configure le redimensionnement de la sidebar
 */
function setupWordRepetitionSidebarResize() {
    const sidebar = document.getElementById('wordRepetitionSidebar');
    const resizeHandle = document.getElementById('wordRepSidebarResize');

    if (!sidebar || !resizeHandle) return;

    let isResizing = false;
    let startX = 0;
    let startWidth = 0;

    resizeHandle.addEventListener('mousedown', (e) => {
        isResizing = true;
        startX = e.clientX;
        startWidth = sidebar.offsetWidth;
        resizeHandle.classList.add('active');
        document.body.style.cursor = 'ew-resize';
        document.body.style.userSelect = 'none';
        e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
        if (!isResizing) return;

        const diff = startX - e.clientX;
        const newWidth = Math.max(280, Math.min(600, startWidth + diff));
        sidebar.style.width = newWidth + 'px';

        // Sauvegarder la largeur
        WordRepetitionRepository.updatePreference('sidebarWidth', newWidth);
    });

    document.addEventListener('mouseup', () => {
        if (isResizing) {
            isResizing = false;
            resizeHandle.classList.remove('active');
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        }
    });

    // Restaurer la largeur sauvegardée
    const prefs = WordRepetitionRepository.getPreferences();
    if (prefs.sidebarWidth) {
        sidebar.style.width = prefs.sidebarWidth + 'px';
    }
}

/**
 * [MVVM : Other]
 * Initialisation au chargement de l'application
 */
function initWordRepetitionModule() {
    // Configurer les raccourcis clavier
    setupWordRepetitionKeyboardShortcuts();

    // Configurer le redimensionnement
    setupWordRepetitionSidebarResize();

    // Restaurer l'état du panneau si il était ouvert
    const prefs = WordRepetitionRepository.getPreferences();
    if (!prefs.panelCollapsed && WordRepetitionState.panelVisible) {
        showWordRepetitionPanel();
    }

    console.log('[WordRepetition] Module initialisé');
}

// Auto-initialisation lorsque le DOM est prêt
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWordRepetitionModule);
} else {
    // DOM déjà prêt
    setTimeout(initWordRepetitionModule, 100);
}

// Export pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        toggleWordRepetitionPanel,
        showWordRepetitionPanel,
        hideWordRepetitionPanel,
        clearWordRepetitionHighlights,
        analyzeCurrentSceneRepetitions,
        onSceneOpenedForRepetition,
        initWordRepetitionModule
    };
}
