/**
 * [MVVM : Project Main]
 * Point d'entrée pour le module projet.
 */

(async function () {
    // Ne PAS initialiser le ViewModel ici car la DB n'est pas encore prête !
    // L'initialisation se fait via 04.init.js -> loadAllProjects()
    // await ProjectViewModel.init();

    // Les handlers peuvent être initialisés si le DOM est prêt (script en fin de body)
    ProjectHandlers.init();

    console.log('🚀 Module Projet chargé (attente init DB)');
})();

// Fonction de chargement initiale (appelée par l'app)
async function loadAllProjects() {
    await ProjectViewModel.init();
}
