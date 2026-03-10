/**
 * [MVVM : Magic Importer View]
 * UI Handling for the Magic Import.
 */

const MagicImporterView = {
    /**
     * Opens the Magic Import Modal.
     */
    openModal() {
        const modal = document.getElementById('magicImportModal');
        if (modal) {
            modal.classList.add('active');
            const textarea = document.getElementById('magicImportInput');
            if (textarea) {
                textarea.value = '';
                textarea.focus();
            }
        }
    },

    /**
     * Closes the Magic Import Modal.
     */
    closeModal() {
        const modal = document.getElementById('magicImportModal');
        if (modal) {
            modal.classList.remove('active');
        }
    },

    /**
     * Executes the magic import.
     */
    async executeImport() {
        const textarea = document.getElementById('magicImportInput');
        if (!textarea) return;

        const text = textarea.value.trim();
        if (!text) {
            alert(Localization.isReady ? Localization.t('magic_import.error.empty') : "Veuillez coller le contenu généré.");
            return;
        }

        // Show loading state
        const btn = document.querySelector('#magicImportModal .btn-primary');
        const originalHtml = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<i data-lucide="refresh-cw" class="rotating"></i> ' + (Localization.isReady ? Localization.t('magic_import.processing') : 'Analyse en cours...');
        if (window.lucide) window.lucide.createIcons();

        try {
            const result = await MagicImporterViewModel.importContent(text);

            if (result.success) {
                this.closeModal();
                const successMsg = Localization.isReady ? Localization.t('magic_import.success', (result.destination === 'world' ? Localization.t('nav.world') : Localization.t('nav.codex'))) : "Import réussi !";
                if (typeof showNotification === 'function') {
                    showNotification(successMsg);
                } else {
                    alert(successMsg);
                }

                // Refresh UI
                if (result.destination === 'world' && typeof renderWorldList === 'function') {
                    renderWorldList();
                    if (typeof openWorldDetail === 'function') openWorldDetail(result.id);
                } else if (result.destination === 'codex' && typeof renderCodexList === 'function') {
                    renderCodexList();
                    if (typeof openCodexDetail === 'function') openCodexDetail(result.id);
                }

                // Save project
                if (typeof saveProject === 'function') {
                    saveProject();
                }
            } else {
                alert((Localization.isReady ? Localization.t('magic_import.error.failed') : "Erreur lors de l'import : ") + result.error);
            }
        } catch (e) {
            console.error("Magic Import Exception:", e);
            alert("Une erreur inattendue est survenue lors de l'analyse du texte.");
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalHtml;
            if (window.lucide) window.lucide.createIcons();
        }
    }
};
