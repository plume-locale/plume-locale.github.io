/**
 * [MVVM : Handlers]
 * Import/Export Handlers
 * Event listeners setup.
 */

const ImportExportHandlers = {
    init: function () {
        // Setup change listener for the import file input if it exists static in DOM
        const importInput = document.getElementById('importFileInput');
        if (importInput) {
            importInput.removeEventListener('change', this.onImportFileChange); // remove old if any
            importInput.addEventListener('change', this.onImportFileChange);
        }

        // Setup change listener for format select
        const formatSelect = document.getElementById('exportFormatSelect');
        if (formatSelect) {
            formatSelect.removeEventListener('change', ImportExportView.updateExportFormatInfo);
            formatSelect.addEventListener('change', ImportExportView.updateExportFormatInfo);
        }
    },

    onImportFileChange: function (event) {
        ImportExportViewModel.handleFileImport(event.target.files[0]);
    }
};

// Initialize listeners
document.addEventListener('DOMContentLoaded', () => {
    ImportExportHandlers.init();
});
