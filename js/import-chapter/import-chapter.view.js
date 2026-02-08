/**
 * [MVVM : View]
 * Import Chapter View - Interface utilisateur pour l'import de fichiers
 * Supporte : .docx, .txt, .md, .epub, .pages
 */

const ImportChapterView = {
    /**
     * ID du modal
     */
    modalId: 'importChapterModal',

    /**
     * Formats supportés (hardcoded pour éviter les dépendances)
     */
    supportedFormats: ['.docx', '.txt', '.md', '.epub', '.pages'],

    /**
     * Ouvre le modal d'import
     */
    open() {
        try {
            // Reset l'état si possible
            if (typeof ImportChapterViewModel !== 'undefined') {
                ImportChapterViewModel.reset();
            }

            // Afficher le modal
            const modal = document.getElementById(this.modalId);
            if (modal) {
                modal.classList.add('active');
                this.renderInitialState();
            }
        } catch (e) {
            console.error('Erreur ouverture modal import:', e);
        }
    },

    /**
     * Ferme le modal
     */
    close() {
        const modal = document.getElementById(this.modalId);
        if (modal) {
            modal.classList.remove('active');
        }
        if (typeof ImportChapterViewModel !== 'undefined') {
            ImportChapterViewModel.cancelImport();
        }
    },

    /**
     * Affiche l'état initial (sélection de fichier)
     */
    renderInitialState() {
        const content = document.getElementById('importChapterContent');
        if (!content) {
            console.error('Element importChapterContent non trouve');
            return;
        }

        const formats = this.supportedFormats;
        const acceptString = formats.join(',');

        content.innerHTML = `
            <div class="import-chapter-upload">
                <div class="import-chapter-dropzone" id="importDropzone">
                    <i data-lucide="file-up" style="width: 48px; height: 48px; color: var(--accent-gold); margin-bottom: 1rem;"></i>
                    <p style="font-size: 1.1rem; font-weight: 600; margin-bottom: 0.5rem;">
                        ${Localization.t('import.dropzone.title')}
                    </p>
                    <p style="color: var(--text-muted); margin-bottom: 1rem;">
                        ${Localization.t('import.dropzone.subtitle')}
                    </p>
                    <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; justify-content: center; margin-bottom: 1rem;">
                        ${formats.map(f => `<span style="padding: 0.25rem 0.5rem; background: var(--bg-tertiary); border-radius: 4px; font-size: 0.8rem; font-weight: 600;">${f}</span>`).join('')}
                    </div>
                    <input type="file" id="importChapterFileInput" accept="${acceptString}" style="display: none;">
                    <button class="btn btn-primary" onclick="document.getElementById('importChapterFileInput').click()">
                        <i data-lucide="folder-open" style="width: 16px; height: 16px; margin-right: 8px;"></i>
                        ${Localization.t('import.btn.browse')}
                    </button>
                </div>

                <div style="margin-top: 1.5rem; padding: 1rem; background: var(--bg-secondary); border-radius: 8px; font-size: 0.85rem;">
                    <div style="font-weight: 600; margin-bottom: 0.5rem; color: var(--accent-gold);">
                        <i data-lucide="info" style="width: 14px; height: 14px; vertical-align: middle; margin-right: 6px;"></i>
                        ${Localization.t('import.info.formats_title')}
                    </div>
                    <ul style="margin: 0; padding-left: 1.5rem; color: var(--text-muted); line-height: 1.6;">
                        <li><strong>.docx / .pages</strong> : ${Localization.t('import.info.docx_pages')}</li>
                        <li><strong>.md</strong> : ${Localization.t('import.info.md')}</li>
                        <li><strong>.txt / .epub</strong> : ${Localization.t('import.info.txt_epub')}</li>
                        <li>${Localization.t('import.info.numbered')}</li>
                    </ul>
                </div>

                <div style="margin-top: 1rem; padding: 0.75rem 1rem; background: rgba(212, 175, 55, 0.1); border-radius: 8px; font-size: 0.8rem; color: var(--text-secondary);">
                    <i data-lucide="lightbulb" style="width: 14px; height: 14px; vertical-align: middle; margin-right: 6px; color: var(--accent-gold);"></i>
                    <strong>${Localization.t('import.tip.title')}</strong> ${Localization.t('import.tip.pages')}
                </div>
            </div>
        `;

        // Initialiser les événements
        this.initDropzone();
        this.initFileInput();

        // Rafraîchir les icônes Lucide
        if (typeof lucide !== 'undefined' && lucide.createIcons) {
            lucide.createIcons();
        }
    },

    /**
     * Initialise la zone de drop
     */
    initDropzone() {
        const dropzone = document.getElementById('importDropzone');
        if (!dropzone) return;

        dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropzone.classList.add('dragover');
        });

        dropzone.addEventListener('dragleave', () => {
            dropzone.classList.remove('dragover');
        });

        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.classList.remove('dragover');

            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFileSelect(files[0]);
            }
        });

        dropzone.addEventListener('click', (e) => {
            if (e.target.tagName !== 'BUTTON' && e.target.tagName !== 'INPUT') {
                document.getElementById('importChapterFileInput')?.click();
            }
        });
    },

    /**
     * Initialise l'input file
     */
    initFileInput() {
        const input = document.getElementById('importChapterFileInput');
        if (!input) return;

        input.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleFileSelect(e.target.files[0]);
            }
        });
    },

    /**
     * Gère la sélection d'un fichier
     * @param {File} file
     */
    async handleFileSelect(file) {
        this.renderProcessing(file.name);

        try {
            const result = await ImportChapterViewModel.processFile(file);

            if (result.success) {
                this.renderPreview(result.data);
            } else {
                this.renderError(result.error);
            }
        } catch (e) {
            console.error('Erreur traitement fichier:', e);
            this.renderError(e.message || Localization.t('import.error.default_error'));
        }
    },

    /**
     * Affiche l'état de traitement
     * @param {string} fileName
     */
    renderProcessing(fileName) {
        const content = document.getElementById('importChapterContent');
        if (!content) return;

        content.innerHTML = `
            <div style="text-align: center; padding: 3rem;">
                <div class="import-chapter-spinner"></div>
                <p style="margin-top: 1.5rem; font-size: 1.1rem;">
                    ${Localization.t('import.processing.title').replace('{0}', fileName)}
                </p>
                <p style="color: var(--text-muted); margin-top: 0.5rem;">
                    ${Localization.t('import.processing.subtitle')}
                </p>
            </div>
        `;
    },

    /**
     * Affiche l'aperçu des chapitres détectés
     * @param {Object} data
     */
    renderPreview(data) {
        const content = document.getElementById('importChapterContent');
        if (!content) return;

        const { fileName, fileFormat, chapters, stats, warnings } = data;

        // Générer le titre par défaut (sans extension)
        const defaultTitle = fileName.replace(/\.(docx|txt|md|epub|pages)$/i, '').replace(/[-_]/g, ' ');

        // Afficher les warnings s'il y en a
        const warningsHtml = warnings && warnings.length > 0 ? `
            <div style="background: rgba(255, 193, 7, 0.1); border: 1px solid #ffc107; padding: 0.75rem 1rem; border-radius: 8px; margin-bottom: 1rem; font-size: 0.85rem;">
                <i data-lucide="alert-triangle" style="width: 14px; height: 14px; vertical-align: middle; margin-right: 6px; color: #ffc107;"></i>
                ${warnings.map(w => w.message || w).join('<br>')}
            </div>
        ` : '';

        content.innerHTML = `
            <div class="import-chapter-preview">
                ${warningsHtml}

                <!-- En-tête avec statistiques -->
                <div style="background: var(--bg-secondary); padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
                        <div>
                            <div style="font-weight: 600; font-size: 1rem;">
                                <i data-lucide="file-text" style="width: 16px; height: 16px; vertical-align: middle; margin-right: 6px; color: var(--accent-gold);"></i>
                                ${fileName}
                                <span style="font-size: 0.75rem; background: var(--bg-tertiary); padding: 0.15rem 0.4rem; border-radius: 3px; margin-left: 0.5rem;">${fileFormat || ''}</span>
                            </div>
                        </div>
                        <div style="display: flex; gap: 1.5rem; font-size: 0.9rem;">
                            <div>
                                <span style="color: var(--text-muted);">${Localization.t('import.preview.chapters_count')}</span>
                                <strong style="color: var(--accent-gold);">${stats.totalChapters}</strong>
                            </div>
                            <div>
                                <span style="color: var(--text-muted);">${Localization.t('import.preview.words_count')}</span>
                                <strong>${stats.totalWords.toLocaleString(Localization.current === 'fr' ? 'fr-FR' : 'en-US')}</strong>
                            </div>
                            <div>
                                <span style="color: var(--text-muted);">${Localization.t('import.preview.avg_words')}</span>
                                <strong>${stats.averageWordsPerChapter.toLocaleString(Localization.current === 'fr' ? 'fr-FR' : 'en-US')}</strong>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Titre de l'acte -->
                <div style="margin-bottom: 1.5rem;">
                    <label style="display: block; font-weight: 600; margin-bottom: 0.5rem;">
                        ${Localization.t('import.preview.act_label')}
                    </label>
                    <input type="text"
                           id="importActTitle"
                           class="form-input"
                           value="${defaultTitle}"
                           placeholder="${Localization.t('import.preview.act_placeholder')}"
                           style="width: 100%;">
                </div>

                <!-- Liste des chapitres -->
                <div style="margin-bottom: 1.5rem;">
                    <div style="font-weight: 600; margin-bottom: 0.75rem;">
                        <i data-lucide="list" style="width: 14px; height: 14px; vertical-align: middle; margin-right: 6px;"></i>
                        ${Localization.t('import.preview.detected_chapters')}
                    </div>
                    <div class="import-chapter-list" style="max-height: 300px; overflow-y: auto; border: 1px solid var(--border-color); border-radius: 8px;">
                        ${chapters.map((ch, i) => `
                            <div class="import-chapter-item" style="padding: 0.75rem 1rem; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
                                <div style="display: flex; align-items: center; gap: 0.75rem;">
                                    <span style="color: var(--text-muted); font-size: 0.8rem; min-width: 24px;">${i + 1}.</span>
                                    <span style="font-weight: 500;">${ch.title}</span>
                                </div>
                                <span style="color: var(--text-muted); font-size: 0.85rem;">
                                    ${Localization.t('import.preview.words_unit').replace('{0}', stats.chapters[i].wordCount.toLocaleString(Localization.current === 'fr' ? 'fr-FR' : 'en-US'))}
                                </span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Boutons d'action -->
                <div style="display: flex; gap: 1rem; justify-content: flex-end;">
                    <button class="btn btn-secondary" onclick="ImportChapterView.renderInitialState()">
                        <i data-lucide="arrow-left" style="width: 14px; height: 14px; margin-right: 6px;"></i>
                        ${Localization.t('import.btn.change_file')}
                    </button>
                    <button class="btn btn-primary" onclick="ImportChapterView.confirmImport()">
                        <i data-lucide="check" style="width: 14px; height: 14px; margin-right: 6px;"></i>
                        ${Localization.t('import.btn.confirm').replace('{0}', stats.totalChapters)}
                    </button>
                </div>
            </div>
        `;

        // Rafraîchir les icônes
        if (typeof lucide !== 'undefined' && lucide.createIcons) {
            lucide.createIcons();
        }
    },

    /**
     * Affiche une erreur
     * @param {string} message
     */
    renderError(message) {
        const content = document.getElementById('importChapterContent');
        if (!content) return;

        content.innerHTML = `
            <div style="text-align: center; padding: 2rem;">
                <i data-lucide="alert-circle" style="width: 48px; height: 48px; color: var(--accent-red); margin-bottom: 1rem;"></i>
                <p style="font-size: 1.1rem; font-weight: 600; color: var(--accent-red); margin-bottom: 0.5rem;">
                    ${Localization.t('import.error.title')}
                </p>
                <p style="color: var(--text-muted); margin-bottom: 1.5rem; max-width: 400px; margin-left: auto; margin-right: auto;">
                    ${message}
                </p>
                <button class="btn btn-primary" onclick="ImportChapterView.renderInitialState()">
                    <i data-lucide="refresh-cw" style="width: 14px; height: 14px; margin-right: 6px;"></i>
                    ${Localization.t('import.btn.retry')}
                </button>
            </div>
        `;

        // Rafraîchir les icônes
        if (typeof lucide !== 'undefined' && lucide.createIcons) {
            lucide.createIcons();
        }
    },

    /**
     * Confirme et exécute l'import
     */
    confirmImport() {
        const actTitleInput = document.getElementById('importActTitle');
        const actTitle = actTitleInput ? actTitleInput.value.trim() : null;

        try {
            const result = ImportChapterViewModel.confirmImport(actTitle);

            if (result.success) {
                this.renderSuccess(result.data);
            } else {
                this.renderError(result.error);
            }
        } catch (e) {
            console.error('Erreur confirmation import:', e);
            this.renderError(e.message || Localization.t('import.error.confirm_failed'));
        }
    },

    /**
     * Affiche le succès de l'import
     * @param {Object} data
     */
    renderSuccess(data) {
        const content = document.getElementById('importChapterContent');
        if (!content) return;

        content.innerHTML = `
            <div style="text-align: center; padding: 2rem;">
                <i data-lucide="check-circle" style="width: 64px; height: 64px; color: #4CAF50; margin-bottom: 1rem;"></i>
                <p style="font-size: 1.3rem; font-weight: 600; margin-bottom: 0.5rem;">
                    ${Localization.t('import.success.title')}
                </p>
                <p style="color: var(--text-muted); margin-bottom: 1.5rem;">
                    ${Localization.t('import.success.message')
                .replace('{0}', data.chaptersImported)
                .replace('{1}', data.actTitle)}
                    <br>
                    <span style="font-size: 0.9rem;">
                        ${Localization.t('import.success.total_words').replace('{0}', data.totalWords.toLocaleString(Localization.current === 'fr' ? 'fr-FR' : 'en-US'))}
                    </span>
                </p>
                <button class="btn btn-primary" onclick="ImportChapterView.close()">
                    <i data-lucide="edit-3" style="width: 14px; height: 14px; margin-right: 6px;"></i>
                    ${Localization.t('import.btn.start_editing')}
                </button>
            </div>
        `;

        // Rafraîchir les icônes
        if (typeof lucide !== 'undefined' && lucide.createIcons) {
            lucide.createIcons();
        }
    }
};

/**
 * Fonction globale pour ouvrir le modal d'import
 */
function openImportChapterModal() {
    ImportChapterView.open();
}

/**
 * Fonction globale pour fermer le modal d'import
 */
function closeImportChapterModal() {
    ImportChapterView.close();
}
