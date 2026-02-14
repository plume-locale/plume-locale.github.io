/**
 * Point d'entrée principal pour le module Storage Refactorisé
 * Initialise l'architecture MVVM et expose l'API globale pour la rétrocompatibilité.
 */
(function () {
    const repository = new StorageRepository();
    const view = new StorageView();
    const viewModel = new StorageViewModel(repository, view);

    // Initialisation
    // Note: initDB sera appelé explicitement par l'application (init.js) via la globale window.initDB

    // ============================================
    // EXPOSITION GLOBALE (COMPATIBILITÉ)
    // ============================================

    // Exposer l'instance de DB via un getter/setter sur window
    Object.defineProperty(window, 'db', {
        get: () => repository.db,
        set: (val) => repository.db = val,
        configurable: true
    });

    // Exposer le flag useLocalStorage
    Object.defineProperty(window, 'useLocalStorage', {
        get: () => repository.useLocalStorage,
        set: (val) => repository.useLocalStorage = val,
        configurable: true
    });

    window.initDB = () => viewModel.init();
    window.migrateFromLocalStorage = () => viewModel.migrateFromLocalStorage();
    window.saveProjectToDB = (data) => viewModel.saveProject(data);
    window.loadProjectFromDB = (id) => viewModel.loadProject(id);
    window.loadAllProjectsFromDB = () => viewModel.loadAllProjects();
    window.deleteProjectFromDB = (id) => viewModel.deleteProject(id);
    window.getIndexedDBSize = () => viewModel.getIndexedDBSize();
    window.saveSetting = (key, val) => viewModel.saveSetting(key, val);
    window.loadSetting = (key) => viewModel.loadSetting(key);

    // Exposer les classes pour debug ou usage avancé si besoin
    window.StorageModule = {
        repository,
        viewModel,
        view
    };

    console.log('✅ Module Storage (Refactorisé) chargé.');
})();
