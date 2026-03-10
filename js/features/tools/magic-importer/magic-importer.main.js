/**
 * [MVVM : Magic Importer Main]
 * Entry point for Magic Importer feature.
 */

(function () {
    // Global bindings for HTML
    window.openMagicImportModal = () => MagicImporterView.openModal();
    window.closeMagicImportModal = () => MagicImporterView.closeModal();
    window.executeMagicImport = () => MagicImporterView.executeImport();

    console.log('🚀 Magic Importer Module chargé');
})();
