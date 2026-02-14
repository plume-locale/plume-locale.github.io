/**
 * Relation Map Main
 * Initializes the relation map module and exposes global entry points.
 */
(function () {
    const repository = new RelationMapRepository();
    const viewModel = new RelationMapViewModel(repository);
    const view = new RelationMapView(viewModel);

    RelationMapHandlers.init(viewModel, view);

    /**
     * Replacement for the original renderRelationsView global function.
     */
    window.renderRelationsView = function () {
        view.render();
    };

    /**
     * Replacement for original editRelation.
     */
    window.editRelation = function (id) {
        RelationMapHandlers.handleEditRelation(id);
    };

    /**
     * Replacement for original deleteRelation.
     */
    window.deleteRelation = function (id) {
        RelationMapHandlers.handleDeleteRelation(id);
    };

    /**
     * Replacement for original resetCharacterPositions.
     */
    window.resetCharacterPositions = function () {
        RelationMapHandlers.handleResetPositions();
    };

    /**
     * Replacement for original autoArrangeCharacters.
     */
    window.autoArrangeCharacters = function () {
        RelationMapHandlers.handleAutoArrange();
    };

    window.relationMapRepository = repository;
})();
