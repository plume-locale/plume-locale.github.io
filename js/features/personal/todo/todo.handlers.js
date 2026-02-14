/**
 * Todo Handlers
 * Gestion des événements globaux et des interactions DOM
 */

const TodoHandlers = {
    /**
     * Initialise les écouteurs d'événements spécifiques aux TODOs
     */
    init: () => {
        // Pour l'instant, la plupart des événements sont gérés par des onclick directs
        // mais on pourrait ajouter des listeners ici pour un code plus propre.
    },

    /**
     * Gère le changement de position du panneau d'annotations
     */
    updateAnnotationsPanelPosition: () => {
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
};
