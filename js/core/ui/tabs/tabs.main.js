/* ==========================================
   TABS SYSTEM - Main
   ========================================== */

document.addEventListener('DOMContentLoaded', () => {
    // Initialiser l'état depuis le localStorage
    const savedState = localStorage.getItem('plume_tabs_state');
    if (savedState) {
        try {
            tabsState = JSON.parse(savedState);
        } catch (e) {
            console.error('Error parsing tabs state:', e);
        }
    }

    // Si on a des onglets, on fait le rendu initial
    if (tabsState.panes.left.tabs.length > 0 || tabsState.panes.right.tabs.length > 0) {
        // Attendre un peu que le DOM soit prêt
        setTimeout(() => {
            renderTabs();
        }, 200);
    }
});

/** [MVVM : Other] - Détermine si une vue supporte le système d'onglets */
function viewSupportsTabs(view) {
    const supportedViews = [
        'projects', 'editor', 'corkboard', 'characters', 'world', 'notes', 'codex',
        'stats', 'analysis', 'plot', 'plotgrid', 'mindmap', 'relations', 'arcs', 'versions',
        'map', 'timelineviz', 'investigation', 'globalnotes', 'front_matter'
    ];
    return supportedViews.includes(view);
}
