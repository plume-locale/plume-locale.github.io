/**
 * [MVVM : ViewModel]
 * Import Chapter ViewModel - Coordination entre Model et View
 * Gère la logique métier de l'import de fichiers (.docx, .txt, .md, .epub, .pages)
 */

const ImportChapterViewModel = {
    /**
     * État de l'import en cours
     */
    state: {
        isProcessing: false,
        previewData: null,
        selectedFile: null,
        error: null
    },

    /**
     * Reset l'état
     */
    reset() {
        this.state = {
            isProcessing: false,
            previewData: null,
            selectedFile: null,
            error: null
        };
    },

    /**
     * Traite un fichier et génère un aperçu
     * @param {File} file - Fichier sélectionné
     * @returns {Promise<Object>} - Résultat avec aperçu des chapitres
     */
    async processFile(file) {
        this.state.isProcessing = true;
        this.state.error = null;
        this.state.selectedFile = file;

        try {
            // Validation du format
            const format = ImportChapterModel.getFileFormat(file);
            if (!format) {
                const supported = ImportChapterModel.supportedFormats.join(', ');
                throw new Error(Localization.t('import.error.unsupported_format').replace('{0}', supported));
            }

            // Validation de la taille
            if (file.size > 50 * 1024 * 1024) { // 50MB max
                throw new Error(Localization.t('import.error.file_too_large'));
            }

            // Vérification des dépendances pour DOCX
            if (format === '.docx' && !this.isMammothAvailable()) {
                throw new Error(Localization.t('import.error.mammoth_missing'));
            }

            // Vérification des dépendances pour EPUB et PAGES
            if ((format === '.epub' || format === '.pages') && typeof JSZip === 'undefined') {
                throw new Error(Localization.t('import.error.jszip_missing'));
            }

            // Conversion vers HTML (méthode unifiée)
            const result = await ImportChapterModel.convertToHtml(file);

            if (!result.html || result.html.trim().length === 0) {
                throw new Error(Localization.t('import.error.document_empty'));
            }

            // Parsing des chapitres
            const chapters = ImportChapterModel.parseChaptersFromHtml(result.html);

            if (chapters.length === 0) {
                throw new Error(Localization.t('import.error.no_chapters'));
            }

            // Calculer les statistiques
            const stats = this.calculateStats(chapters);

            this.state.previewData = {
                fileName: file.name,
                fileFormat: format,
                chapters: chapters,
                stats: stats,
                warnings: result.messages || []
            };

            this.state.isProcessing = false;

            return {
                success: true,
                data: this.state.previewData
            };

        } catch (error) {
            this.state.isProcessing = false;
            this.state.error = error.message;

            return {
                success: false,
                error: error.message
            };
        }
    },

    /**
     * Calcule les statistiques des chapitres détectés
     * @param {Array} chapters - Chapitres détectés
     * @returns {Object} - Statistiques
     */
    calculateStats(chapters) {
        let totalWords = 0;
        const chapterStats = chapters.map((ch, index) => {
            const wordCount = ImportChapterModel.countWords(ch.content);
            totalWords += wordCount;
            return {
                index: index + 1,
                title: ch.title,
                wordCount: wordCount
            };
        });

        return {
            totalChapters: chapters.length,
            totalWords: totalWords,
            averageWordsPerChapter: Math.round(totalWords / chapters.length),
            chapters: chapterStats
        };
    },

    /**
     * Confirme l'import et crée la structure dans Plume
     * @param {string} actTitle - Titre de l'acte (optionnel)
     * @returns {Object} - Résultat de l'import
     */
    confirmImport(actTitle = null) {
        if (!this.state.previewData) {
            return {
                success: false,
                error: Localization.t('import.error.no_data')
            };
        }

        try {
            const chapters = this.state.previewData.chapters;

            // Déterminer le titre de l'acte (supprimer l'extension du fichier)
            let finalActTitle = actTitle;
            if (!finalActTitle && this.state.selectedFile) {
                finalActTitle = this.state.selectedFile.name
                    .replace(/\.(docx|txt|md|epub|pages)$/i, '')
                    .replace(/[-_]/g, ' ');
            }
            finalActTitle = finalActTitle || Localization.t('import.default.act');

            // Créer la structure Plume
            const newAct = ImportChapterModel.createPlumeStructure(chapters, finalActTitle);

            // Ajouter à la structure du projet
            if (!project.acts) {
                project.acts = [];
            }

            project.acts.push(newAct);

            // Sauvegarder
            if (typeof saveProject === 'function') {
                saveProject();
            }

            // Rafraîchir l'UI
            if (typeof renderActsList === 'function') {
                renderActsList();
            }

            const result = {
                success: true,
                data: {
                    actId: newAct.id,
                    actTitle: newAct.title,
                    chaptersImported: chapters.length,
                    totalWords: this.state.previewData.stats.totalWords
                }
            };

            // Reset l'état
            this.reset();

            return result;

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    },

    /**
     * Annule l'import en cours
     */
    cancelImport() {
        this.reset();
    },

    /**
     * Obtient l'état actuel
     * @returns {Object}
     */
    getState() {
        return { ...this.state };
    },

    /**
     * Vérifie si mammoth.js est disponible
     * @returns {boolean}
     */
    isMammothAvailable() {
        return typeof mammoth !== 'undefined' && typeof mammoth.convertToHtml === 'function';
    },

    /**
     * Retourne les formats supportés pour l'affichage
     * @returns {Array<string>}
     */
    getSupportedFormats() {
        return ImportChapterModel.supportedFormats;
    },

    /**
     * Retourne la chaîne accept pour l'input file
     * @returns {string}
     */
    getAcceptString() {
        return ImportChapterModel.supportedFormats.join(',');
    }
};
