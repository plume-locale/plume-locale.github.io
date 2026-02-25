/**
 * [MVVM : ViewModel]
 * Import Scrivener ViewModel
 * Coordonne le parsing du projet Scrivener et la création de la structure Plume.
 */

const ImportScrivenerViewModel = {

    state: {
        isProcessing: false,
        scrivxFile: null,
        rtfMap: {},
        version: 2,
        parsedBinder: null,
        projectTitle: '',
        previewData: null,
        error: null
    },

    reset() {
        this.state = {
            isProcessing: false,
            scrivxFile: null,
            rtfMap: {},
            version: 2,
            parsedBinder: null,
            projectTitle: '',
            previewData: null,
            error: null
        };
    },

    /**
     * Analyse les fichiers sélectionnés et prépare l'aperçu
     * @param {FileList} files
     */
    async processFiles(files) {
        this.state.isProcessing = true;
        this.state.error = null;

        try {
            // Construire la map des fichiers
            const { scrivxFile, rtfMap, version } = ImportScrivenerModel.buildFileMap(files);

            if (!scrivxFile) {
                throw new Error(Localization.t('scrivener.error_no_scrivx'));
            }

            this.state.scrivxFile = scrivxFile;
            this.state.rtfMap = rtfMap;
            this.state.version = version;

            // Lire et parser le .scrivx
            const xmlContent = await this._readAsText(scrivxFile);
            const { projectTitle, binder } = ImportScrivenerModel.parseScrivxXml(xmlContent);

            this.state.projectTitle = projectTitle;
            this.state.parsedBinder = binder;

            // Construire l'aperçu de la structure
            const preview = this._buildPreview(binder);
            const rtfCount = Object.keys(rtfMap).length;

            this.state.previewData = {
                projectTitle,
                version,
                preview,
                rtfFilesCount: rtfCount,
                warnings: rtfCount === 0
                    ? [Localization.t('scrivener.warning_no_rtf')]
                    : []
            };

            this.state.isProcessing = false;
            return { success: true, data: this.state.previewData };

        } catch (e) {
            this.state.isProcessing = false;
            this.state.error = e.message;
            return { success: false, error: e.message };
        }
    },

    /**
     * Confirme l'import et crée la structure dans Plume
     * @param {string} projectTitleOverride - Titre optionnel saisi par l'user
     */
    async confirmImport(projectTitleOverride) {
        if (!this.state.parsedBinder) {
            return { success: false, error: Localization.t('scrivener.error_no_data') };
        }

        try {
            const title = projectTitleOverride || this.state.projectTitle || Localization.t('scrivener.default_project_title');

            // Construire la structure Plume complète (avec lecture des RTF)
            const acts = await ImportScrivenerModel.buildPlumeStructure(
                this.state.parsedBinder,
                this.state.rtfMap,
                title
            );

            if (!acts || acts.length === 0) {
                throw new Error(Localization.t('scrivener.error_empty_import'));
            }

            // Ajouter au projet Plume
            if (!window.project) window.project = { acts: [] };
            if (!window.project.acts) window.project.acts = [];

            for (const act of acts) {
                window.project.acts.push(act);
            }

            // Sauvegarder
            if (typeof saveProject === 'function') saveProject();
            if (typeof renderActsList === 'function') renderActsList();

            const totalChapters = acts.reduce((sum, a) => sum + (a.chapters?.length || 0), 0);
            const totalScenes = acts.reduce((sum, a) =>
                sum + (a.chapters?.reduce((cs, c) => cs + (c.scenes?.length || 0), 0) || 0), 0);

            const result = {
                success: true,
                data: {
                    actsImported: acts.length,
                    chaptersImported: totalChapters,
                    scenesImported: totalScenes,
                    projectTitle: title
                }
            };

            this.reset();
            return result;

        } catch (e) {
            return { success: false, error: e.message };
        }
    },

    /**
     * Construit une structure d'aperçu légère pour l'UI
     */
    _buildPreview(binder) {
        const items = [];
        const walk = (node, depth) => {
            if (depth > 4) return; // Limiter la profondeur d'affichage
            items.push({
                title: node.title,
                type: node.type,
                id: node.id,
                depth,
                hasChildren: node.children && node.children.length > 0,
                childCount: node.children ? node.children.length : 0,
                synopsis: node.synopsis || ''
            });
            if (node.children) {
                for (const child of node.children) {
                    walk(child, depth + 1);
                }
            }
        };

        const topLevel = binder.children || [];
        for (const item of topLevel) {
            walk(item, 0);
        }

        return items;
    },

    /**
     * Lit un File comme texte UTF-8
     */
    _readAsText(file, encoding = 'UTF-8') {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = () => reject(new Error(Localization.t('scrivener.error_read_file', [file.name])));
            reader.readAsText(file, encoding);
        });
    }
};
