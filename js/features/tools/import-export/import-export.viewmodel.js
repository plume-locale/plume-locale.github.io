/**
 * [MVVM : ViewModel]
 * Import/Export ViewModel
 * Coordinates modal state, selection logic, and triggers export/import actions.
 */

const ImportExportViewModel = {
    isSyncChecking: false,

    // --- Backup & Restore (JSON) ---

    showBackupMenu: function () {
        ImportExportView.openHubModal();
    },

    executeProjectExport: function () {
        if (!window.project) return;

        const selection = {
            manuscript: document.getElementById('hub-check-manuscript')?.checked,
            characters: document.getElementById('hub-check-characters')?.checked,
            world: document.getElementById('hub-check-world')?.checked,
            codex: document.getElementById('hub-check-codex')?.checked,
            notes: document.getElementById('hub-check-notes')?.checked,
            timeline: document.getElementById('hub-check-timeline')?.checked,
            relations: document.getElementById('hub-check-relations')?.checked,
            investigation: document.getElementById('hub-check-investigation')?.checked,
            plotgrid: document.getElementById('hub-check-plotgrid')?.checked
        };

        const exportData = {};
        if (selection.manuscript) exportData.acts = window.project.acts;
        if (selection.characters) exportData.characters = window.project.characters;
        if (selection.world) exportData.world = window.project.world;
        if (selection.codex) exportData.codex = window.project.codex;
        if (selection.notes) exportData.notes = window.project.notes;
        if (selection.timeline) exportData.timeline = window.project.timeline;
        if (selection.relations) exportData.relationships = window.project.relationships;
        if (selection.investigation) exportData.investigationBoard = window.project.investigationBoard;
        if (selection.plotgrid) exportData.plotGrid = window.project.plotGrid;

        // Meta data
        exportData.id = window.project.id;
        exportData.title = window.project.title;
        exportData.description = window.project.description;
        exportData.genre = window.project.genre;
        exportData.stats = window.project.stats;
        exportData.settings = window.project.settings;

        const dataStr = JSON.stringify(exportData, null, 2);
        const filename = `${(window.project.title || 'Export').replace(/\s+/g, '_')}_Selective_${new Date().toISOString().split('T')[0]}.json`;

        ImportExportRepository.downloadFile(dataStr, filename, 'application/json');
        ImportExportView.showNotification(Localization.t('export.json.success_msg', filename));
    },

    handleHubFileImport: async function (input) {
        const file = input.files[0];
        if (!file) return;

        try {
            const content = await ImportExportRepository.readFileAsText(file);
            const importedData = JSON.parse(content);

            // Open selective import modal (reuse export checklist UI for simplicity in this step)
            // For now, simple confirmation-based import similar to existing one but filtered
            if (!confirm(Localization.t('import.json.confirm_backup'))) return;

            // Logic to merge selective data...
            // For this version, let's allow importing only what's in the file
            project = window.project = Object.assign(window.project || {}, importedData);

            if (typeof saveProject === 'function') saveProject();
            if (typeof renderActsList === 'function') renderActsList();

            ImportExportView.showNotification(Localization.t('import.json.success'));
            ImportExportView.closeHubModal();
        } catch (e) {
            console.error(e);
            alert(Localization.t('import.json.error', [e.message]));
        }
    },

    openTextImportDialog: function () {
        // Reuse old importChapterModal logic or redirect
        if (typeof openImportChapterModal === 'function') {
            openImportChapterModal();
        }
    },

    openNovelExportSettings: function () {
        // Show the export sub-view in the Manuscript tab
        const initial = document.getElementById('manuscript-hub-initial');
        const exportView = document.getElementById('manuscript-hub-export');
        if (initial) initial.style.display = 'none';
        if (exportView) exportView.style.display = 'block';

        this.initNovelExport();
    },

    initNovelExport: function () {
        ImportExportModel.initSelectionState(true);
        ImportExportView.renderExportTree(window.project, ImportExportModel.selectionState);
        ImportExportView.updateExportFormatInfo();
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
            project = window.project = Object.assign({
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
        // Enregistrer le callback d'expiration AVANT l'init
        GoogleDriveService.onTokenExpired = () => {
            this._onGDriveTokenExpired();
        };
        GoogleDriveService.init((success) => {
            if (success && GoogleDriveService.userInfo) {
                // Session restored silently (e.g. after F5): update UI immediately
                ImportExportView.updateGDriveUI(GoogleDriveService.userInfo, true);
                ImportExportView.updateGDriveStatus(Localization.t('gdrive.status.connected'), 'success');
                this.updateGDriveHeaderBadge('connected');
                
                // Nouvelle fonctionnalité : Vérifier les conflits au démarrage si connecté
                this.checkSyncConflict();
            } else if (GoogleDriveService.isSessionLost && GoogleDriveService.isSessionLost()) {
                // Token était présent mais re-auth silencieuse a échoué
                // → _onGDriveTokenExpired sera appelé via callback
            }
        });
    },

    handleAuthClick: function () {
        if (typeof GoogleDriveService === 'undefined') return;
        GoogleDriveService.handleAuthClick((user) => {
            if (user) {
                ImportExportView.updateGDriveUI(user, true);
                ImportExportView.updateGDriveStatus(Localization.t('gdrive.status.connected'), 'success');
                this.updateGDriveHeaderBadge('connected');
                // Cacher la bannière d'expiration si elle est visible
                const banner = document.getElementById('gdriveExpiredBanner');
                if (banner) banner.style.display = 'none';

                // Nouvelle fonctionnalité : Vérifier les conflits après connexion manuelle
                this.checkSyncConflict();
            }
        });
    },

    handleSignoutClick: function () {
        if (typeof GoogleDriveService === 'undefined') return;
        GoogleDriveService.handleSignoutClick(() => {
            ImportExportView.updateGDriveUI(null, false);
            ImportExportView.updateGDriveStatus(Localization.t('gdrive.status.disconnected'), 'normal');
            this.updateGDriveHeaderBadge('none');
            // Cacher la bannière d'expiration
            const banner = document.getElementById('gdriveExpiredBanner');
            if (banner) banner.style.display = 'none';
        });
    },

    /**
     * Appelé quand le token Google Drive expire et que la re-auth silencieuse échoue.
     * Affiche une alerte persistante dans le header et un toast.
     */
    _onGDriveTokenExpired: function () {
        // Badge rouge dans le header
        this.updateGDriveHeaderBadge('expired');

        // Bannière persistante
        let banner = document.getElementById('gdriveExpiredBanner');
        if (!banner) {
            banner = document.createElement('div');
            banner.id = 'gdriveExpiredBanner';
            banner.style.cssText = [
                'position: fixed',
                'bottom: 1.5rem',
                'left: 50%',
                'transform: translateX(-50%)',
                'z-index: 9999',
                'background: var(--accent-red, #c44536)',
                'color: #fff',
                'padding: 0.85rem 1.5rem',
                'border-radius: 10px',
                'box-shadow: 0 4px 24px rgba(0,0,0,0.3)',
                'display: flex',
                'align-items: center',
                'gap: 1rem',
                'font-size: 0.95rem',
                'max-width: 520px',
                'cursor: pointer',
                'animation: gdriveBannerIn 0.3s ease'
            ].join(';');

            // Ajouter le keyframe si absent
            if (!document.getElementById('gdriveBannerStyle')) {
                const style = document.createElement('style');
                style.id = 'gdriveBannerStyle';
                style.textContent = `
                    @keyframes gdriveBannerIn {
                        from { opacity: 0; transform: translateX(-50%) translateY(20px); }
                        to   { opacity: 1; transform: translateX(-50%) translateY(0); }
                    }
                `;
                document.head.appendChild(style);
            }

            const icon = '\u26a0\ufe0f';
            const msgKey = 'gdrive.warning.session_expired';
            const msg = (typeof Localization !== 'undefined' && Localization.t)
                ? Localization.t(msgKey)
                : 'Session Google Drive expirée. Cliquez pour vous reconnecter.';

            banner.innerHTML = `
                <span style="font-size:1.3em">${icon}</span>
                <span style="flex:1">${msg}</span>
                <button onclick="ImportExportViewModel.showBackupMenu(); document.getElementById('gdriveExpiredBanner').style.display='none';"
                    style="background:rgba(255,255,255,0.25); border:1px solid rgba(255,255,255,0.5); color:#fff; padding:0.4rem 0.9rem; border-radius:6px; cursor:pointer; font-size:0.9rem; white-space:nowrap;"
                    data-i18n="gdrive.warning.reconnect_btn">Se reconnecter</button>
                <span onclick="this.parentElement.style.display='none'"
                    style="cursor:pointer; opacity:0.8; font-size:1.1em; padding: 0 0.25rem;" title="Fermer">×</span>
            `;
            document.body.appendChild(banner);
        } else {
            banner.style.display = 'flex';
        }
    },

    /**
     * Met à jour le badge de statut Google Drive dans le header.
     * @param {'connected'|'expired'|'none'} state
     */
    updateGDriveHeaderBadge: function (state) {
        const dot = document.getElementById('headerGDriveStatusDot');
        if (!dot) return;
        if (state === 'connected') {
            dot.style.display = 'inline-block';
            dot.style.background = 'var(--accent-green, #51cf66)';
            dot.title = typeof Localization !== 'undefined' ? Localization.t('gdrive.status.connected') : 'Google Drive connecté';
        } else if (state === 'expired') {
            dot.style.display = 'inline-block';
            dot.style.background = 'var(--accent-red, #c44536)';
            dot.title = typeof Localization !== 'undefined' ? Localization.t('gdrive.warning.session_expired') : 'Session Google Drive expirée !';
            // Faire pulser le bouton parent pour attirer l’attention
            const btn = document.getElementById('headerBackupBtn');
            if (btn) {
                btn.style.color = 'var(--accent-red, #c44536)';
            }
        } else {
            dot.style.display = 'none';
            const btn = document.getElementById('headerBackupBtn');
            if (btn) btn.style.color = '';
        }
    },

    toggleGDriveAutoSave: function (checked) {
        // Store preference in localStorage or Project model
        // For now, just a visual toggle or session state
        window.gDriveAutoSave = checked;
        if (checked) {
            this.syncNowWithGDrive();
        }
    },

    /**
     * Met à jour la durée de session Google Drive.
     * Met à jour le service et rafraîchit le session_expires_at du token stocké
     * sans forcer une reconnexion.
     * @param {string|number} seconds - Duration in seconds
     */
    setGDriveSessionDuration: function (seconds) {
        if (typeof GoogleDriveService === 'undefined') return;
        const secs = parseInt(seconds, 10);
        if (isNaN(secs) || secs <= 0) return;

        GoogleDriveService.setSessionDuration(secs);

        // Rafraîchir session_expires_at dans le token stocké si l'utilisateur est connecté
        if (GoogleDriveService.accessToken) {
            try {
                const stored = localStorage.getItem('gd_token');
                if (stored) {
                    const tokenData = JSON.parse(stored);
                    tokenData.session_expires_at = Date.now() + (secs * 1000);
                    localStorage.setItem('gd_token', JSON.stringify(tokenData));
                }
            } catch (e) {}
        }

        // Feedback visuel
        const hours = secs >= 86400
            ? Math.round(secs / 86400) + (typeof Localization !== 'undefined' ? ' ' + (Localization.t('gdrive.session.unit_days') || 'j') : 'j')
            : Math.round(secs / 3600) + (typeof Localization !== 'undefined' ? ' ' + (Localization.t('gdrive.session.unit_hours') || 'h') : 'h');
        ImportExportView.showNotification(
            (typeof Localization !== 'undefined' ? Localization.t('gdrive.session.duration_saved', hours) : `Durée de session mise à jour : ${hours}`)
        );
    },

    syncNowWithGDrive: async function () {
        if (typeof GoogleDriveService === 'undefined' || !GoogleDriveService.accessToken) {
            alert(Localization.t('gdrive.error.not_connected'));
            return;
        }

        ImportExportView.updateGDriveStatus(Localization.t('gdrive.status.saving'), 'sync');

        try {
            const folderId = await GoogleDriveService.findOrCreateFolder('Plume Backups');
            if (!folderId) {
                throw new Error(Localization.t('gdrive.error.folder_creation'));
            }

            let allProjects = [];
            if (typeof window.loadAllProjectsFromDB === 'function') {
                allProjects = await window.loadAllProjectsFromDB();
            } else if (window.project) {
                allProjects = [window.project];
            }

            if (!allProjects.length && window.project) {
                allProjects = [window.project];
            }

            // Filtrer le projet par défaut vide (Mon Roman, My Novel, etc.)
            const defaultTitles = ["Mon Roman", "My Novel", "Mein Roman", "Mi Novela", Localization.t('project.model.default_title')];
            const projectsToBackup = allProjects.filter(p => {
                return !(defaultTitles.includes(p.title) && ProjectModel.isEmpty(p));
            });

            if (projectsToBackup.length === 0) {
                ImportExportView.updateGDriveStatus(Localization.t('gdrive.status.synced'), 'success');
                ImportExportView.showNotification(Localization.t('gdrive.success.sync', 0));
                return;
            }

            for (const proj of projectsToBackup) {
                const dataStr = JSON.stringify(proj, null, 2);
                const filename = `backup_plume_${(proj.title || Localization.t('export.json.default_filename')).replace(/\s+/g, '_')}.json`;
                await GoogleDriveService.saveFile(dataStr, filename, folderId);
            }

            ImportExportView.updateGDriveStatus(Localization.t('gdrive.status.synced'), 'success');
            ImportExportView.showNotification(Localization.t('gdrive.success.sync', projectsToBackup.length));
            this.refreshBackupsList();
        } catch (err) {
            console.error(err);
            alert(Localization.t('gdrive.error.sync', err.message));
        }
    },

    /**
     * Vérifie s'il y a un conflit entre le projet local et celui sur Google Drive.
     * Appelé automatiquement à la connexion.
     */
    checkSyncConflict: async function () {
        if (this.isSyncChecking || !window.project || !GoogleDriveService.accessToken) return;
        this.isSyncChecking = true;

        try {
            const folderId = await GoogleDriveService.findOrCreateFolder('Plume Backups');
            if (!folderId) return;

            const filename = `backup_plume_${(window.project.title || Localization.t('export.json.default_filename')).replace(/\s+/g, '_')}.json`;
            const fileId = await GoogleDriveService.findFile(filename, folderId);

            if (!fileId) {
                console.log('[Sync] Aucun fichier distant trouvé pour ce projet.');
                return;
            }

            // On récupère les métadonnées pour avoir la date de modif distante
            const response = await gapi.client.drive.files.get({
                fileId: fileId,
                fields: 'modifiedTime, size'
            });
            
            const remoteModifiedTime = new Date(response.result.modifiedTime).getTime();
            const localModifiedTime = window.project.updatedAt || 0;

            // Seuil de 2 secondes pour éviter les micro-différences de save
            const diff = Math.abs(remoteModifiedTime - localModifiedTime);
            if (diff < 2000) {
                console.log('[Sync] Versions synchronisées (diff < 2s).');
                return;
            }

            // Si différence notable, on demande
            const remoteDate = new Date(remoteModifiedTime).toLocaleString();
            const localDate = new Date(localModifiedTime).toLocaleString();

            const msg = `Différence détectée pour "${window.project.title}" :
- Version distante (Drive) : ${remoteDate}
- Version locale (ici) : ${localDate}

Voulez-vous CHARGER la version de Google Drive (écrase le local) ?
Cliquez sur "Annuler" pour garder votre version locale (et synchroniser vers le Drive plus tard).`;

            if (confirm(msg)) {
                this.restoreFromGDrive(filename, folderId);
            }
        } catch (err) {
            console.error('[Sync] Erreur lors de la vérification des conflits:', err);
        } finally {
            this.isSyncChecking = false;
        }
    },

    restoreFromGDrive: async function (specificFilename, specificFolderId) {
        if (typeof GoogleDriveService === 'undefined' || !GoogleDriveService.accessToken) {
            alert(Localization.t('gdrive.error.not_connected'));
            return;
        }

        const filename = specificFilename || `backup_plume_${(window.project.title || Localization.t('export.json.default_filename')).replace(/\s+/g, '_')}.json`;

        if (!specificFilename && !confirm(Localization.t('gdrive.confirm.overwrite', filename))) return;

        ImportExportView.updateGDriveStatus(Localization.t('gdrive.status.downloading'), 'sync');

        try {
            const folderId = specificFolderId || await GoogleDriveService.findOrCreateFolder('Plume Backups');
            const result = await GoogleDriveService.loadFile(filename, folderId);
            
            let importedData;
            if (typeof result === 'string') {
                importedData = JSON.parse(result);
            } else if (result.body) {
                importedData = JSON.parse(result.body);
            } else {
                importedData = result;
            }

            if (!importedData.acts) throw new Error(Localization.t('gdrive.error.invalid_format'));

            project = window.project = importedData;
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

    refreshBackupsList: async function () {
        if (typeof GoogleDriveService === 'undefined' || !GoogleDriveService.accessToken) return;

        try {
            const folderId = await GoogleDriveService.findOrCreateFolder('Plume Backups');
            if (!folderId) return;

            const files = await GoogleDriveService.listFiles(folderId);
            ImportExportView.renderGDriveBackups(files);
        } catch (err) {
            console.error("Error refreshing backups list:", err);
        }
    },

    importSelectedFromGDrive: async function () {
        const checkboxes = document.querySelectorAll('.gdrive-backup-checkbox:checked');
        if (checkboxes.length === 0) {
            alert(Localization.t('gdrive.error.no_selection') || 'Aucun fichier sélectionné.');
            return;
        }

        if (!confirm(Localization.t('gdrive.confirm.import_multiple', [checkboxes.length]) || `Importer ${checkboxes.length} fichier(s) ? Les données actuelles pourraient être écrasées.`)) return;

        ImportExportView.updateGDriveStatus(Localization.t('gdrive.status.downloading'), 'sync');

        let successCount = 0;
        for (const cb of checkboxes) {
            const fileId = cb.dataset.id;
            const filename = cb.dataset.name;

            try {
                // We need to fetch the file content by ID
                const response = await gapi.client.drive.files.get({
                    fileId: fileId,
                    alt: 'media'
                });

                let importedData;
                if (typeof response.result === 'string') {
                    importedData = JSON.parse(response.result);
                } else if (response.result.body) {
                    importedData = JSON.parse(response.result.body);
                } else {
                    importedData = response.result;
                }

                // If multiple projects, we might need a better merge logic.
                // For now, if one project is imported, it replaces window.project.
                // If the user selects many, the last one wins if they are the same project ID?
                // Or maybe they are different projects.

                // For simplicity, let's assume if it has Acts, it's a project.
                if (importedData.acts) {
                    // If we have a project DB, save it there
                    if (typeof window.saveProjectToDB === 'function') {
                        await window.saveProjectToDB(importedData);
                    } else {
                        project = window.project = importedData;
                        if (typeof saveProject === 'function') saveProject();
                    }
                    successCount++;
                }
            } catch (err) {
                console.error(`Error importing ${filename}:`, err);
            }
        }

        if (successCount > 0) {
            if (typeof ProjectViewModel !== 'undefined' && typeof ProjectViewModel.init === 'function') {
                await ProjectViewModel.init();
            } else {
                if (typeof renderActsList === 'function') renderActsList();
                if (typeof updateProjectList === 'function') updateProjectList(); // Refresh project hub if open
            }

            ImportExportView.updateGDriveStatus(Localization.t('gdrive.status.restored'), 'success');
            alert(Localization.t('gdrive.success.restored_count', [successCount]) || `${successCount} projet(s) restauré(s) avec succès.`);
            ImportExportView.closeHubModal();
        } else {
            ImportExportView.updateGDriveStatus(Localization.t('gdrive.status.error'), 'error');
            alert(Localization.t('gdrive.error.import_failed') || 'Échec de l\'importation.');
        }
    },

    openExportNovelModal: function () {
        ImportExportView.openHubModal();
        ImportExportView.switchHubTab('manuscript');
        this.openNovelExportSettings();
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

    // --- Structured ZIP Export ---

    openStructuredExportModal: function () {
        ImportExportView.openStructuredExportModal();
        ImportExportModel.initSelectionState(true);
        ImportExportView.renderExportTree(window.project, ImportExportModel.selectionState);
    },

    executeStructuredExport: async function () {
        if (!window.project) return;
        if (typeof StructuredExport === 'undefined') {
            alert('Module d\'export structuré non chargé.');
            return;
        }

        const selection = {
            frontMatter: document.getElementById('se-check-frontmatter')?.checked ?? false,
            manuscript: document.getElementById('se-check-manuscript')?.checked ?? false,
            analysis: document.getElementById('se-check-analysis')?.checked ?? false,
            characters: document.getElementById('se-check-characters')?.checked ?? false,
            world: document.getElementById('se-check-world')?.checked ?? false,
            codex: document.getElementById('se-check-codex')?.checked ?? false,
            timeline: document.getElementById('se-check-timeline')?.checked ?? false,
            notes: document.getElementById('se-check-notes')?.checked ?? false,
            relations: document.getElementById('se-check-relations')?.checked ?? false,
            arcs: document.getElementById('se-check-arcs')?.checked ?? false,
            plotgrid: document.getElementById('se-check-plotgrid')?.checked ?? false,
            investigation: document.getElementById('se-check-investigation')?.checked ?? false,
            mindmaps: document.getElementById('se-check-mindmaps')?.checked ?? false,
            globalnotes: document.getElementById('se-check-globalnotes')?.checked ?? false,
            map: document.getElementById('se-check-map')?.checked ?? false,
        };

        const btn = document.getElementById('seExportBtn');
        if (btn) { btn.disabled = true; btn.textContent = 'Export en cours…'; }

        try {
            const filename = await StructuredExport.buildZIP(
                window.project,
                selection,
                ImportExportModel.selectionState
            );
            ImportExportView.closeStructuredExportModal();
            ImportExportView.showNotification(`📦 Export structuré téléchargé : ${filename}`);
        } catch (e) {
            console.error(e);
            alert('Erreur lors de l\'export : ' + e.message);
        } finally {
            if (btn) { btn.disabled = false; btn.textContent = 'Exporter le ZIP'; }
        }
    },

    executeNovelExport: async function () {
        const options = ImportExportView.getOptions();
        const format = options.format; // docx, markdown, txt, html, epub

        const content = ImportExportModel.getSelectedContent(options);
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
