/**
 * @file tension.handlers.js
 * @description Gestionnaires d'événements pour le module de tension.
 */

const TensionHandlers = {
    currentBulkImportType: null,

    /**
     * Initialise les écouteurs globaux.
     */
    init: function () {
        // Écouteurs pour l'import en masse (changement de fichier/texte)
        const fileInput = document.getElementById('bulkImportFile');
        if (fileInput) {
            fileInput.addEventListener('change', function () {
                if (this.files && this.files[0]) {
                    document.getElementById('bulkImportText').value = '';
                }
            });
        }

        const textarea = document.getElementById('bulkImportText');
        if (textarea) {
            textarea.addEventListener('input', function () {
                if (this.value.trim()) {
                    document.getElementById('bulkImportFile').value = '';
                }
            });
        }
    },

    /**
     * Ouvre l'éditeur de mots de tension.
     */
    onOpenEditor: function () {
        TensionView.openEditor();
    },

    /**
     * Ajoute un mot (clic bouton "Ajouter").
     */
    onAddWord: function (type) {
        const input = document.getElementById(`${type}TensionInput`);
        const word = input.value;

        const result = TensionViewModel.addWord(type, word);

        if (result.success) {
            if (typeof showNotification === 'function') showNotification(result.message, 'success');
            input.value = '';
            TensionView.loadWords();
        } else {
            if (typeof showNotification === 'function') showNotification(result.message, 'warning');
        }
    },

    /**
     * Supprime un mot (clic bouton "x").
     */
    onRemoveWord: function (type, index) {
        const result = TensionViewModel.removeWord(type, index);

        if (result.success) {
            if (typeof showNotification === 'function') showNotification(result.message, 'success');
            TensionView.loadWords();
        } else {
            console.error(result.message);
        }
    },

    /**
     * Sauvegarde et ferme l'éditeur.
     */
    onSave: function () {
        TensionView.closeEditor();
        if (typeof showNotification === 'function') {
            showNotification(Localization.t('tension.notification.saved'), 'success');
        }
        // Déclencher une mise à jour immédiate si possible
        // Note: updateLiveTensionMeter est appelé par l'éditeur principal (via des événements globaux ou timers)
    },

    /**
     * Réinitialise aux valeurs par défaut.
     */
    onReset: function () {
        if (confirm(Localization.t('tension.confirm.reset'))) {
            const result = TensionViewModel.resetToDefault();
            if (result.success) {
                if (typeof showNotification === 'function') showNotification(result.message, 'success');
                TensionView.loadWords();
            }
        }
    },

    /**
     * Exporte les dictionnaires.
     */
    onExport: function () {
        const { content, filename } = TensionViewModel.prepareExport();
        TensionView.downloadFile(filename, content);
        if (typeof showNotification === 'function') showNotification(Localization.t('tension.notification.exported'), 'success');
    },

    /**
     * Ouvre l'import pour un type donné.
     */
    onOpenBulkImport: function (type) {
        this.currentBulkImportType = type;
        TensionView.openBulkImport(type);
    },

    /**
     * Traite l'import en masse.
     */
    onProcessBulkImport: function () {
        if (!this.currentBulkImportType) return;

        const textarea = document.getElementById('bulkImportText');
        const fileInput = document.getElementById('bulkImportFile');
        const modeInput = document.querySelector('input[name="importMode"]:checked');
        const mode = modeInput ? modeInput.value : 'add';

        if (fileInput.files && fileInput.files[0]) {
            const file = fileInput.files[0];
            const reader = new FileReader();

            reader.onload = (e) => {
                const content = e.target.result;
                this._runImport(content, this.currentBulkImportType, mode);
            };

            reader.onerror = () => {
                if (typeof showNotification === 'function') showNotification(Localization.t('tension.notification.read_error'), 'error');
            };

            reader.readAsText(file);
        } else if (textarea.value.trim()) {
            this._runImport(textarea.value, this.currentBulkImportType, mode);
        } else {
            if (typeof showNotification === 'function') showNotification(Localization.t('tension.notification.empty_input'), 'warning');
        }
    },

    /**
     * Exécute l'import via le ViewModel et gère le résultat.
     * @private
     */
    _runImport: function (text, type, mode) {
        const result = TensionViewModel.importWordsFromText(text, type, mode);

        if (result.success) {
            if (typeof showNotification === 'function') showNotification(result.message, 'success');
            TensionView.loadWords();
            TensionView.closeBulkImport();
        } else {
            if (typeof showNotification === 'function') showNotification(result.message, 'warning');
        }
    }
};
