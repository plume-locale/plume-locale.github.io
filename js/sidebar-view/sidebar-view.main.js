/**
 * @file sidebar-view.main.js
 * @description Point d'entrée pour le module SidebarView. Initialise les composants et expose la fonction globale.
 */

// Initialisation des composants
const sidebarViewRepository = new SidebarViewRepository();
const sidebarViewViewModel = new SidebarViewViewModel(sidebarViewRepository);
const sidebarView = new SidebarView(sidebarViewViewModel);

// Exposition globale pour compatibilité avec l'existant
window.renderMobileSidebarView = function (view) {
    sidebarView.render(view);
};

console.log('SidebarView module intialized');
