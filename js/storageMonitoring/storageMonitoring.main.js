class StorageMonitoringApp {
    constructor() {
        this.repository = new StorageMonitoringRepository();
        this.view = new StorageMonitoringView();
        this.viewModel = new StorageMonitoringViewModel(this.repository, this.view);
    }

    init() {
        console.log('🔍 Initialisation de la surveillance du stockage IndexedDB (MVVM Refactor)...');

        // Binding global functions for backward compatibility/external calls
        window.initStorageMonitoring = () => this.viewModel.init();
        window.updateStorageBadge = () => this.viewModel.updateStorageStatus();
        window.checkStorageQuota = () => this.viewModel.checkQuota();
        window.showStorageDetails = () => this.viewModel.showDetails();
        window.handleStorageError = () => this.viewModel.handleStorageError();
        // window.getStorageSize should be kept on the repository or bridged here
        window.getStorageSize = () => this.repository.getStorageSize();

        // Initialize immediately
        this.viewModel.init();

        // Event listener for page unload
        window.addEventListener('beforeunload', (e) => this.viewModel.checkBeforeUnload(e));

        console.log('✅ Surveillance du stockage (MVVM) prête.');
    }
}

// Instanciation et initialisation
const storageMonitoringApp = new StorageMonitoringApp();
storageMonitoringApp.init();
