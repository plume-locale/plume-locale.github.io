/**
 * Snapshots Module Main Entry Point
 * Initializes the MVVM components and exposes the necessary global interface.
 */

// Initialize module when DOM is ready or immediately if deferred
document.addEventListener('DOMContentLoaded', () => {
    // We can initialize here if needed, or lazily when accessed
});

// Create instances
const snapshotsRepository = new SnapshotsRepository();
const snapshotsViewModel = new SnapshotsViewModel(snapshotsRepository);
const snapshotsView = new SnapshotsView(snapshotsViewModel);

// Expose the main entry point expected by the application
window.renderVersionsList = function () {
    snapshotsView.render();
};

// Listen for language changes to refresh the view
window.addEventListener('localeChanged', () => {
    const container = document.getElementById(snapshotsView.containerId);
    if (container && container.querySelector('.snapshots-container')) {
        snapshotsView.render();
    }

    // Refresh comparison modal if open
    const modal = document.getElementById('version-compare-modal');
    if (modal) {
        // We need the result data to re-render. 
        // For simplicity, let's just close it or try to find a way to re-trigger handleCompare.
        // Actually, the easiest is to just re-trigger handleCompare with the last id if we stored it.
        // But since switching language is rare while comparing, maybe closing it is fine, 
        // but let's be more elegant if possible.
        // Let's store the last compared id in snapshotsView.
        if (snapshotsView.lastComparedId) {
            snapshotsView.handleCompare(snapshotsView.lastComparedId);
        }
    }
});

// Optional: Expose other methods if external scripts rely on them globally
// Although the View now handles interactions internally, we keep these 
// as a fallback or for console usage.
window.createVersion = function () {
    snapshotsViewModel.createVersion();
    if (document.getElementById(snapshotsView.containerId)?.contains(document.querySelector('.snapshots-container'))) {
        snapshotsView.render();
    }
};

window.deleteVersion = function (id) {
    if (snapshotsViewModel.deleteVersion(id)) {
        snapshotsView.render();
    }
};

window.restoreVersion = function (id) {
    if (snapshotsViewModel.restoreVersion(id)) {
        if (typeof switchView === 'function') switchView('editor');
        if (typeof renderActsList === 'function') renderActsList();
        alert(Localization.t('snapshots.success_restore'));
    }
};

window.compareVersion = function (id) {
    snapshotsView.handleCompare(id);
};

console.log('Snapshots module initialized (MVVM)');
