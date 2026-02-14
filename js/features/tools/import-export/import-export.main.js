/**
 * [MVVM : Main]
 * Import/Export Entry Point
 * Exposes global functions and initializes listeners.
 */

// Initialize global variables/functions expected by the existing HTML
function initImportExportModule() {
    console.log('[ImportExport] Module Initialized');

    // Map GLOBAL functions to ViewModel/View
    // These are called by onclick attributes in HTML
    window.showBackupMenu = ImportExportViewModel.showBackupMenu;
    window.exportToJSON = ImportExportViewModel.exportToJSON;
    window.importFromFile = ImportExportViewModel.importFromFile;
    window.handleFileImport = (event) => ImportExportViewModel.handleFileImport(event.target.files[0]);
    window.exportProject = () => {
        // This was the "Simple Export" (txt)
        // We redirect to the Advanced Export Modal for better UX, or just trigger default TXT export
        // Given "exportProject" usually means "Text Export" in the old UI:
        ImportExportViewModel.openExportNovelModal(); // Redirect to the better modal
    };
    window.openExportNovelModal = ImportExportViewModel.openExportNovelModal;
    window.executeNovelExport = ImportExportViewModel.executeNovelExport;
    window.toggleAllScenes = ImportExportViewModel.toggleAllScenes;
    window.toggleAllExportOptions = (checked) => ImportExportViewModel.toggleAllExportOptions(checked);
    window.updateExportFormatInfo = ImportExportView.updateExportFormatInfo;

    // Google Drive Global Bindings
    window.handleAuthClick = ImportExportViewModel.handleAuthClick;
    window.handleSignoutClick = ImportExportViewModel.handleSignoutClick;
    window.syncNowWithGDrive = () => ImportExportViewModel.syncNowWithGDrive();
    window.restoreFromGDrive = () => ImportExportViewModel.restoreFromGDrive();
    window.toggleGDriveAutoSave = (checked) => ImportExportViewModel.toggleGDriveAutoSave(checked);

    // Initialize GDrive Service
    ImportExportViewModel.initGDrive();

    // Also expose the specific toggles required by the rendered tree HTML
    // Note: The Rendered Tree in View.js uses ImportExportViewModel.toggleAct directly in onclick
    // So we need to ensure ImportExportViewModel is global or the onclicks use window.toggleAct
    // In view.js I wrote: onchange="ImportExportViewModel.toggleAct(...)" which assumes ImportExportViewModel is global.
    // It is defined in global scope in viewmodel.js, so it should be fine.

    // Just in case existing HTML buttons call closeModal specifically for backupModal
    // The existing closeModal is generic. We should ensure it exists if the structure module didn't provide it.
    if (typeof window.closeModal !== 'function') {
        window.closeModal = ImportExportView.closeModal;
    }
}

// Auto-init if DOM is ready (or wait for it)
document.addEventListener('DOMContentLoaded', () => {
    initImportExportModule();
});

// Also run immediately in case we are late loaded
initImportExportModule();
