/**
 * [MVVM : ViewModel]
 * Import/Export ViewModel
 * Coordinates modal state, selection logic, and triggers export/import actions.
 */

const ImportExportViewModel = {

    // --- Backup & Restore (JSON) ---

    showBackupMenu: function () {
        ImportExportView.openBackupModal();
    },

    exportToJSON: function () {
        if (!window.project) return;
        const dataStr = JSON.stringify(window.project, null, 2);
        const filename = `${(window.project.title || Localization.t('export.json.default_filename')).replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;

        ImportExportRepository.downloadFile(dataStr, filename, 'application/json');

        // Notify user (View responsibility really, but alert is quick)
        alert(Localization.t('export.json.success_msg', filename));
    },

    importFromFile: function () {
        ImportExportView.triggerFileInput();
    },

    handleFileImport: async function (file) {
        if (!file) return;
        if (!file.name.endsWith('.json')) {
            alert(Localization.t('import.json.error_format'));
            return;
        }

        if (!confirm(Localization.t('import.json.confirm_backup'))) {
            ImportExportView.resetFileInput();
            return;
        }

        // Auto backup
        this.exportToJSON();

        try {
            const content = await ImportExportRepository.readFileAsText(file);
            const importedData = JSON.parse(content);

            // Basic validation
            if (!importedData.acts || !Array.isArray(importedData.acts)) {
                throw new Error(Localization.t('import.json.error_invalid'));
            }

            // Secure merge/update
            window.project = Object.assign({
                title: Localization.t('import.json.default_project_title'),
                acts: [],
                characters: [],
                world: [],
                timeline: [],
                notes: [],
                codex: [],
                stats: { dailyGoal: 500, totalGoal: 80000, writingSessions: [] },
                versions: []
            }, importedData);

            // Re-auth logic might be needed if user data is there, but for local app just safe structure.

            // Side effects to update UI
            if (typeof saveProject === 'function') saveProject();
            if (typeof renderActsList === 'function') renderActsList();
            if (typeof switchView === 'function') switchView('editor');

            ImportExportView.closeBackupModal();
            alert(Localization.t('import.json.success'));

        } catch (error) {
            alert(Localization.t('import.json.error', error.message));
        }

    },


    // --- Google Drive Integration ---

    initGDrive: function () {
        if (typeof GoogleDriveService === 'undefined') {
            console.warn('GoogleDriveService not loaded.');
            return;
        }
        GoogleDriveService.init((success) => {
            if (success) {
                // Check if we can silent login?
                // For now, user initiates login.
            }
        });
    },

    handleAuthClick: function () {
        if (typeof GoogleDriveService === 'undefined') return;
        GoogleDriveService.handleAuthClick((user) => {
            if (user) {
                ImportExportView.updateGDriveUI(user, true);
                ImportExportView.updateGDriveStatus(Localization.t('gdrive.status.connected'), 'success');
                // Check preferences for auto-save?
            }
        });
    },

    handleSignoutClick: function () {
        if (typeof GoogleDriveService === 'undefined') return;
        GoogleDriveService.handleSignoutClick(() => {
            ImportExportView.updateGDriveUI(null, false);
            ImportExportView.updateGDriveStatus(Localization.t('gdrive.status.disconnected'), 'normal');
        });
    },

    toggleGDriveAutoSave: function (checked) {
        // Store preference in localStorage or Project model
        // For now, just a visual toggle or session state
        window.gDriveAutoSave = checked;
        if (checked) {
            this.syncNowWithGDrive();
        }
    },

    syncNowWithGDrive: async function () {
        if (typeof GoogleDriveService === 'undefined' || !GoogleDriveService.accessToken) {
            alert("Veuillez d'abord vous connecter à Google Drive.");
            return;
        }

        ImportExportView.updateGDriveStatus(Localization.t('gdrive.status.saving'), 'sync');

        try {
            const dataStr = JSON.stringify(window.project, null, 2);
            const filename = `backup_plume_${(window.project.title || Localization.t('export.json.default_filename')).replace(/\s+/g, '_')}.json`;

            await GoogleDriveService.saveFile(dataStr, filename);
            ImportExportView.updateGDriveStatus(Localization.t('gdrive.status.synced'), 'success');
            ImportExportView.showNotification(Localization.t('gdrive.success.sync'));
        } catch (err) {
            console.error(err);
            alert(Localization.t('gdrive.error.sync', err.message));
        }
    },

    restoreFromGDrive: async function () {
        if (typeof GoogleDriveService === 'undefined' || !GoogleDriveService.accessToken) {
            alert(Localization.t('gdrive.error.not_connected'));
            return;
        }

        const filename = `backup_plume_${(window.project.title || Localization.t('export.json.default_filename')).replace(/\s+/g, '_')}.json`;

        if (!confirm(Localization.t('gdrive.confirm.overwrite', filename))) return;

        ImportExportView.updateGDriveStatus(Localization.t('gdrive.status.downloading'), 'sync');

        try {
            const result = await GoogleDriveService.loadFile(filename);
            // Result is likely the JSON object already if using gapi client properly with alt=media
            // But gapi client get returns a response obj.

            let importedData;
            if (typeof result === 'string') {
                importedData = JSON.parse(result);
            } else if (result.body) {
                importedData = JSON.parse(result.body);
            } else {
                importedData = result; // Assuming it parsed it or it's the object
            }

            // Validation & Merge reuse handleFileImport logic concept
            if (!importedData.acts) throw new Error(Localization.t('gdrive.error.invalid_format'));

            window.project = importedData;
            if (typeof saveProject === 'function') saveProject();
            if (typeof renderActsList === 'function') renderActsList();
            if (typeof switchView === 'function') switchView('editor');

            ImportExportView.updateGDriveStatus(Localization.t('gdrive.status.restored'), 'success');
            alert(Localization.t('gdrive.success.restored'));
            ImportExportView.closeBackupModal();

        } catch (err) {
            console.error(err);
            ImportExportView.updateGDriveStatus(Localization.t('gdrive.error.restore_title'), 'error');
            alert(Localization.t('gdrive.error.restore_msg', err.message || Localization.t('gdrive.error.file_not_found')));
        }
    },

    openExportNovelModal: function () {
        ImportExportModel.initSelectionState(true);
        ImportExportView.renderExportTree(window.project, ImportExportModel.selectionState);
        ImportExportView.updateExportFormatInfo();
        ImportExportView.openExportNovelModal();
    },

    toggleAct: function (actId) {
        const newState = !ImportExportModel.selectionState[`act-${actId}`];
        ImportExportModel.selectionState[`act-${actId}`] = newState;

        // Propagate to children
        const act = window.project.acts.find(a => a.id === actId);
        if (act) {
            act.chapters.forEach(c => {
                ImportExportModel.selectionState[`chapter-${c.id}`] = newState;
                c.scenes.forEach(s => {
                    ImportExportModel.selectionState[`scene-${s.id}`] = newState;
                });
            });
        }
        ImportExportView.renderExportTree(window.project, ImportExportModel.selectionState);
    },

    toggleChapter: function (actId, chapterId) {
        const newState = !ImportExportModel.selectionState[`chapter-${chapterId}`];
        ImportExportModel.selectionState[`chapter-${chapterId}`] = newState;

        // Propagate to scenes
        const act = window.project.acts.find(a => a.id === actId);
        const chapter = act ? act.chapters.find(c => c.id === chapterId) : null;
        if (chapter) {
            chapter.scenes.forEach(s => {
                ImportExportModel.selectionState[`scene-${s.id}`] = newState;
            });
        }

        // Check parent act state
        this._updateParentStates(actId, chapterId);
        ImportExportView.renderExportTree(window.project, ImportExportModel.selectionState);
    },

    toggleScene: function (actId, chapterId, sceneId) {
        const newState = !ImportExportModel.selectionState[`scene-${sceneId}`];
        ImportExportModel.selectionState[`scene-${sceneId}`] = newState;

        this._updateParentStates(actId, chapterId);
        ImportExportView.renderExportTree(window.project, ImportExportModel.selectionState);
    },

    _updateParentStates: function (actId, chapterId) {
        const act = window.project.acts.find(a => a.id === actId);
        if (!act) return;

        if (chapterId) {
            const chapter = act.chapters.find(c => c.id === chapterId);
            if (chapter) {
                const allScenes = chapter.scenes.every(s => ImportExportModel.selectionState[`scene-${s.id}`]);
                ImportExportModel.selectionState[`chapter-${chapterId}`] = allScenes;
            }
        }

        const allChapters = act.chapters.every(c => ImportExportModel.selectionState[`chapter-${c.id}`]);
        ImportExportModel.selectionState[`act-${actId}`] = allChapters;
    },

    toggleAllScenes: function () {
        const allSelected = Object.values(ImportExportModel.selectionState).every(v => v === true);
        ImportExportModel.initSelectionState(!allSelected);
        ImportExportView.renderExportTree(window.project, ImportExportModel.selectionState);
    },

    toggleAllExportOptions: function (checked) {
        ImportExportView.setAllOptions(checked);
    },

    executeNovelExport: async function () {
        const options = ImportExportView.getOptions();
        const format = options.format; // docx, markdown, txt, html, epub

        const content = ImportExportModel.getSelectedContent();
        const title = window.project.title || Localization.t('export.novel.default_title');

        try {
            switch (format) {
                case 'markdown':
                    const md = ImportExportRepository.generateMarkdown(content, options, title);
                    ImportExportRepository.downloadFile(md, `${title}.md`, 'text/markdown');
                    break;
                case 'txt':
                    const txt = ImportExportRepository.generateTXT(content, options, title);
                    ImportExportRepository.downloadFile(txt, `${title}.txt`, 'text/plain');
                    break;
                case 'html':
                    const html = ImportExportRepository.generateHTML(content, options, title);
                    ImportExportRepository.downloadFile(html, `${title}.html`, 'text/html');
                    break;
                case 'epub':
                    const epubBlob = await ImportExportRepository.generateEPUB(content, options, title);
                    ImportExportRepository.downloadFile(epubBlob, `${title}.epub`, 'application/epub+zip');
                    break;
                case 'docx':
                    const docxBlob = await ImportExportRepository.generateDOCX(content, options, title);
                    ImportExportRepository.downloadFile(docxBlob, `${title}.docx`, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
                    break;
            }
            ImportExportView.showNotification(Localization.t('export.novel.success', format.toUpperCase()));
            ImportExportView.closeExportNovelModal();
        } catch (e) {
            console.error(e);
            alert(Localization.t('export.novel.error', e.message));
        }
    }
};
