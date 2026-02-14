/**
 * Point d'entrée pour le module Plot
 * Initialise le modèle, la vue et le view-model, et expose l'API publique.
 */

(function () {
    // Initialisation
    const repository = new PlotRepository();
    const view = new PlotView();
    const viewModel = new PlotViewModel(repository, view);

    // Namespace global pour le module Plot
    window.plumePlot = {
        init: () => viewModel.init(),
        render: () => viewModel.loadAndRender(),
        showOverview: () => viewModel.showOverview(),
        openPoint: (a, c, s) => viewModel.openPoint(a, c, s),
        // Méthodes exposées pour compatibilité avec d'autres modules si nécessaire
        reset: () => viewModel.resetPoints()
    };

    // Fonctions globales pour la rétrocompatibilité (appelées depuis le HTML existant ou autres modules)
    window.renderPlotView = () => viewModel.loadAndRender();

    // Ces fonctions étaient globales dans le fichier original, on les garde pour ne pas casser l'existant
    window.calculateSceneTension = (scene, a, ta, c, tc, s, ts) => {
        // Adapter les arguments plats au format context object attendu par le nouveau modèle
        // Note: c'est un wrapper de compatibilité. Le calcul complet nécessite les objets Act/Chapter réels généralement.
        // Si cette fonction est appelée de l'extérieur avec juste des index, ça risque d'être limité pour calculateLiveTension qui veut des IDs.
        // On fait au mieux.
        const context = {
            // On ne peut pas facilement reconstruire l'objet act/chapter juste avec des index ici sans accès à project
            // Mais le nouveau modèle gère ça.
            // Pour l'instant, on redirige vers une version simplifiée ou on essaie de récupérer le contexte si project est dispo.
        };

        if (typeof project !== 'undefined') {
            const act = project.acts[a];
            const chapter = act ? act.chapters[c] : null;
            context.act = act;
            context.chapter = chapter;
        }

        return PlotModel.calculateSceneTension(scene, context);
    };

    // Fonctions boutons précédemment globales
    window.analyzePlotCurve = () => viewModel.analyzeCurve();
    window.showPlotSuggestions = () => viewModel.showSuggestions();
    window.resetPlotPoints = () => viewModel.resetPoints();
    window.exportPlot = () => viewModel.exportPlot();
    // openPlotPoint existait déjà globalement
    window.openPlotPoint = (a, c, s) => viewModel.openPoint(a, c, s);

    // Initialisation explicite
    viewModel.init();

})();
