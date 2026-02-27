/**
 * [MVVM : View]
 * Import/Export View
 * Handles DOM manipulation for export modals and notifications.
 */

const ImportExportView = {

    // --- Backup Modal ---
    openBackupModal: function () {
        this.openHubModal();
    },

    closeBackupModal: function () {
        this.closeHubModal();
    },


    // --- Unified Hub Modal ---

    openHubModal: function () {
        const el = document.getElementById('unifiedImportExportHubModal');
        if (el) {
            el.classList.add('active');
            this.switchHubTab('project'); // Default tab
            this.renderProjectExportChecklist();
        }
    },

    closeHubModal: function () {
        const el = document.getElementById('unifiedImportExportHubModal');
        if (el) el.classList.remove('active');
    },

    switchHubTab: function (tabId) {
        // Update buttons
        document.querySelectorAll('.hub-tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        const activeBtn = document.querySelector(`.hub-tab-btn[onclick*="'${tabId}'"]`);
        if (activeBtn) activeBtn.classList.add('active');

        // Update views
        document.querySelectorAll('.hub-content-view').forEach(view => {
            view.classList.remove('active');
        });
        const activeView = document.getElementById(`hub-view-${tabId}`);
        if (activeView) activeView.classList.add('active');

        // Refresh specific view logic
        if (tabId === 'project') {
            this.renderProjectExportChecklist();
            const initial = document.getElementById('project-hub-initial');
            const structured = document.getElementById('project-hub-structured-export');
            if (initial) initial.style.display = 'block';
            if (structured) structured.style.display = 'none';
        }
        if (tabId === 'manuscript') {
            const initial = document.getElementById('manuscript-hub-initial');
            const exportView = document.getElementById('manuscript-hub-export');
            if (initial) initial.style.display = 'grid';
            if (exportView) exportView.style.display = 'none';
        }
        if (tabId === 'cloud') {
            if (typeof GoogleDriveService !== 'undefined' && GoogleDriveService.user) {
                this.updateGDriveUI(GoogleDriveService.user, true);
            }
        }

        if (window.lucide) window.lucide.createIcons();
    },


    renderProjectExportChecklist: function () {
        const container = document.getElementById('projectExportChecklist');
        if (!container) return;

        const models = [
            { id: 'manuscript', label: Localization.t('modal.export.manuscript_section'), icon: 'book-open' },
            { id: 'characters', label: Localization.t('modal.export.include_characters'), icon: 'users' },
            { id: 'world', label: Localization.t('modal.export.include_world'), icon: 'globe' },
            { id: 'codex', label: Localization.t('modal.export.include_codex'), icon: 'library' },
            { id: 'notes', label: Localization.t('modal.export.include_notes'), icon: 'sticky-note' },
            { id: 'timeline', label: Localization.t('modal.export.include_timeline'), icon: 'calendar-days' },
            { id: 'relations', label: Localization.t('modal.export.include_relations'), icon: 'network' },
            { id: 'investigation', label: Localization.t('modal.export.include_investigation'), icon: 'search' },
            { id: 'plotgrid', label: Localization.t('modal.export.include_plotgrid'), icon: 'grid-3x3' }
        ];

        let html = '';
        models.forEach(model => {
            html += `
                <label class="hub-checkbox-item">
                    <input type="checkbox" id="hub-check-${model.id}" checked>
                    <i data-lucide="${model.icon}" style="width: 16px; height: 16px; color: var(--accent-gold);"></i>
                    <span>${model.label}</span>
                </label>
            `;
        });
        container.innerHTML = html;
        if (window.lucide) window.lucide.createIcons();
    },

    triggerFileInput: function () {
        const el = document.getElementById('hubImportFileInput');
        if (el) el.click();
    },

    resetFileInput: function () {
        const el = document.getElementById('hubImportFileInput');
        if (el) el.value = '';
    },


    // --- Export Novel Modal ---

    openExportNovelModal: function () {
        const el = document.getElementById('exportNovelModal');
        if (el) el.classList.add('active');
    },

    closeExportNovelModal: function () {
        const el = document.getElementById('exportNovelModal');
        if (el) el.classList.remove('active');
    },

    renderExportTree: function (project, selectionState) {
        let container = null;
        const structuredView = document.getElementById('project-hub-structured-export');
        if (structuredView && structuredView.style.display === 'block') {
            container = document.getElementById('seExportTreeContainer');
        } else {
            container = document.getElementById('hubExportTreeContainer') || document.getElementById('exportTreeContainer');
        }

        if (!container) return;

        if (!project.acts || project.acts.length === 0) {
            container.innerHTML = `<p style="color: var(--text-muted); text-align: center;">${Localization.t('export.tree.empty')}</p>`;
            return;
        }

        let html = '';
        project.acts.forEach((act, actIndex) => {
            const actChecked = selectionState[`act-${act.id}`] ? 'checked' : '';
            html += `
                <div class="hub-tree-item">
                    <label class="hub-checkbox-item">
                        <input type="checkbox" ${actChecked} onchange="ImportExportViewModel.toggleAct(${act.id})" id="export-act-${act.id}">
                        <span class="hub-tree-label">${Localization.t('export.tree.act', actIndex + 1)}</span>
                    </label>
                    <div class="hub-tree-children">
            `;

            act.chapters.forEach((chapter, chapIndex) => {
                const chapterChecked = selectionState[`chapter-${chapter.id}`] ? 'checked' : '';
                html += `
                    <div class="hub-tree-item">
                        <label class="hub-checkbox-item">
                            <input type="checkbox" ${chapterChecked} onchange="ImportExportViewModel.toggleChapter(${act.id}, ${chapter.id})" id="export-chapter-${chapter.id}">
                            <span class="hub-tree-label">${Localization.t('export.tree.chapter', chapIndex + 1)}</span>
                        </label>
                        <div class="hub-tree-children">
                `;

                chapter.scenes.forEach((scene, sceneIndex) => {
                    const sceneChecked = selectionState[`scene-${scene.id}`] ? 'checked' : '';
                    html += `
                        <label class="hub-checkbox-item">
                            <input type="checkbox" ${sceneChecked} onchange="ImportExportViewModel.toggleScene(${act.id}, ${chapter.id}, ${scene.id})" id="export-scene-${scene.id}">
                            <span class="hub-tree-label scene">${Localization.t('export.tree.scene', sceneIndex + 1)}</span>
                        </label>
                    `;
                });
                html += `</div></div>`;
            });
            html += `</div></div>`;
        });
        container.innerHTML = html;
        if (window.lucide) window.lucide.createIcons();
    },


    updateExportFormatInfo: function () {
        const formatSelect = document.getElementById('hubExportFormatSelect') || document.getElementById('exportFormatSelect');
        const infoBox = document.getElementById('formatInfoBox');
        const docxAdvanced = document.getElementById('hub-docx-advanced');
        if (!formatSelect) return;

        const format = formatSelect.value;
        const messages = {
            docx: Localization.t('export.info.docx'),
            markdown: Localization.t('export.info.markdown'),
            txt: Localization.t('export.info.txt'),
            html: Localization.t('export.info.html'),
            epub: Localization.t('export.info.epub')
        };

        if (infoBox) infoBox.innerHTML = messages[format] || messages.docx;

        // Toggle advanced settings for DOCX
        if (docxAdvanced) {
            docxAdvanced.style.display = (format === 'docx') ? 'block' : 'none';
        }
    },


    getOptions: function () {
        const hubFormat = document.getElementById('hubExportFormatSelect')?.value;
        const oldFormat = document.getElementById('exportFormatSelect')?.value;
        const format = hubFormat || oldFormat || 'txt';

        const options = {
            format: format,
            exportSummaries: (document.getElementById('hubExportSummariesCheck') || document.getElementById('exportSummariesCheck'))?.checked,
            exportProse: (document.getElementById('hubExportProseCheck') || document.getElementById('exportProseCheck'))?.checked,
            includeActTitles: (document.getElementById('hubExportActTitlesCheck') || document.getElementById('includeActTitlesCheck'))?.checked,
            includeSceneSubtitles: (document.getElementById('hubExportSceneSubtitlesCheck') || document.getElementById('includeSceneSubtitlesCheck'))?.checked,
            sceneDivider: (document.getElementById('hubExportSceneDividerSelect') || document.getElementById('sceneDividerSelect'))?.value || 'asterisks',
            includeCharacters: document.getElementById('includeCharactersCheck')?.checked,
            includeWorld: document.getElementById('includeWorldCheck')?.checked,
            includeTimeline: document.getElementById('includeTimelineCheck')?.checked,
            includeCodex: document.getElementById('includeCodexCheck')?.checked,
            includeNotes: document.getElementById('includeNotesCheck')?.checked,
            includeRelations: document.getElementById('includeRelationsCheck')?.checked,
            includeInvestigation: document.getElementById('includeInvestigationCheck')?.checked,
            includePlotGrid: document.getElementById('includePlotGridCheck')?.checked
        };

        // Extensive DOCX config
        if (format === 'docx') {
            const marginsPreset = document.getElementById('docxMargins')?.value || 'normal';
            const marginPresets = (typeof DocxExportConfig !== 'undefined') ? DocxExportConfig.marginPresets : {
                narrow: { top: 720, bottom: 720, left: 720, right: 720 },
                normal: { top: 1440, bottom: 1440, left: 1440, right: 1440 },
                wide: { top: 1700, bottom: 1700, left: 1700, right: 1700 },
                editorial: { top: 1700, bottom: 1700, left: 2268, right: 1700 }
            };
            const margins = marginPresets[marginsPreset] || marginPresets.normal;

            const headerContent = document.getElementById('docxHeaderContent')?.value || 'title';
            const footerValue = document.getElementById('docxFooter')?.value || 'pagenum';

            options.docxConfig = {
                page: {
                    format: document.getElementById('docxPageFormat')?.value || 'a4',
                    margins: {
                        ...margins,
                        header: 720,
                        footer: 720
                    }
                },
                font: {
                    body: document.getElementById('docxFont')?.value || 'Times New Roman',
                    heading: document.getElementById('docxFont')?.value || 'Times New Roman',
                    bodySize: (parseInt(document.getElementById('docxBodySize')?.value) || 12) * 2 // Standard pt to half-points
                },
                spacing: {
                    lineSpacing: parseInt(document.getElementById('docxLineSpacing')?.value) || 360,
                    firstLineIndent: parseInt(document.getElementById('docxIndent')?.value) || 709
                },
                header: {
                    enabled: headerContent !== 'none',
                    content: headerContent
                },
                footer: {
                    enabled: footerValue !== 'none',
                    showPageNumber: footerValue === 'pagenum'
                },
                pageBreaks: {
                    beforeAct: document.getElementById('docxBreakBeforeAct')?.checked !== false,
                    beforeChapter: document.getElementById('docxBreakBeforeChapter')?.checked !== false,
                    beforeScene: document.getElementById('docxBreakBeforeScene')?.checked || false
                },
                frontMatter: {
                    includeTitlePage: document.getElementById('docxIncludeTitlePage')?.checked !== false,
                    includeProjectFrontMatter: document.getElementById('docxIncludeFrontMatter')?.checked !== false
                },
                sceneDivider: {
                    style: options.sceneDivider
                }
            };
        }

        return options;
    },


    setAllOptions: function (checked) {
        const ids = [
            'includeCharactersCheck', 'includeWorldCheck', 'includeTimelineCheck',
            'includeRelationsCheck', 'includeCodexCheck', 'includeNotesCheck'
        ];
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.checked = checked;
        });
    },

    showNotification: function (message) {
        if (typeof window.showNotification === 'function') {
            window.showNotification(message);
        } else {
            alert(message);
        }
    },

    updateGDriveUI: function (user, isSignedIn) {
        const loggedOutDiv = document.getElementById('hub-gdrive-logged-out');
        const loggedInDiv = document.getElementById('hub-gdrive-logged-in');

        if (isSignedIn && user) {
            if (loggedOutDiv) loggedOutDiv.style.display = 'none';
            if (loggedInDiv) loggedInDiv.style.display = 'block';

            const avatarEl = document.getElementById('hub-gdrive-user-avatar');
            const nameEl = document.getElementById('hub-gdrive-user-name');
            const emailEl = document.getElementById('hub-gdrive-user-email');

            if (nameEl) nameEl.textContent = user.name;
            if (emailEl) emailEl.textContent = user.email;
            if (avatarEl && user.picture) {
                avatarEl.innerHTML = `<img src="${user.picture}" style="width:100%;height:100%;object-fit:cover;">`;
            }
        } else {
            if (loggedOutDiv) loggedOutDiv.style.display = 'block';
            if (loggedInDiv) loggedInDiv.style.display = 'none';
        }
    },


    updateGDriveStatus: function (status, type = 'normal') {
        const statusText = document.getElementById('hub-gdrive-status-text');
        const statusIcon = document.querySelector('#hub-gdrive-sync-status i');

        if (statusText) statusText.textContent = status;


        if (statusIcon) {
            // Reset classes
            statusIcon.setAttribute('class', '');

            if (type === 'success') {
                statusIcon.setAttribute('data-lucide', 'check-circle');
            } else if (type === 'error') {
                statusIcon.setAttribute('data-lucide', 'alert-circle');
            } else if (type === 'sync') {
                statusIcon.setAttribute('data-lucide', 'refresh-cw');
                statusIcon.classList.add('rotating'); // Ensure you have css for rotating
            }
            if (window.lucide) window.lucide.createIcons();
        }
    },

    // Generic
    closeModal: function (modalId) {
        const el = document.getElementById(modalId);
        if (el) el.classList.remove('active');
    },

    /**
     * Populate the section checklist for ZIP export.
     */
    renderStructuredExportChecklist: function () {
        const container = document.getElementById('seExportChecklist');
        if (!container) return;

        const sections = [
            { id: 'se-check-frontmatter', icon: 'book-marked', label: Localization.t('modal.export.front_matter') || 'Liminaires & annexes' },
            { id: 'se-check-manuscript', icon: 'book-open', label: Localization.t('modal.export.manuscript') || 'Manuscrit (scènes + versions)' },
            { id: 'se-check-analysis', icon: 'clipboard-list', label: Localization.t('nav.scene_analysis') || 'Préparation de scène' },
            { id: 'se-check-characters', icon: 'users', label: Localization.t('nav.characters') || 'Personnages' },
            { id: 'se-check-world', icon: 'globe', label: Localization.t('nav.world') || 'Univers' },
            { id: 'se-check-codex', icon: 'library', label: Localization.t('nav.codex') || 'Codex' },
            { id: 'se-check-timeline', icon: 'calendar-days', label: Localization.t('nav.timeline') || 'Frise chronologique' },
            { id: 'se-check-notes', icon: 'sticky-note', label: Localization.t('nav.notes') || 'Notes' },
            { id: 'se-check-relations', icon: 'network', label: Localization.t('nav.relations') || 'Relations' },
            { id: 'se-check-arcs', icon: 'waypoints', label: Localization.t('nav.arcs') || 'Arcs narratifs' },
            { id: 'se-check-plotgrid', icon: 'grid-3x3', label: Localization.t('nav.plotgrid') || 'Grille narrative' },
            { id: 'se-check-investigation', icon: 'search', label: Localization.t('nav.investigation') || 'Tableau d\'enquête' },
            { id: 'se-check-mindmaps', icon: 'brain-circuit', label: Localization.t('nav.mindmap') || 'Cartes mentales (.json)' },
            { id: 'se-check-globalnotes', icon: 'layout-panel-left', label: Localization.t('nav.globalnotes') || 'Notes globales (.json)' },
            { id: 'se-check-map', icon: 'map', label: Localization.t('nav.map') || 'Carte du monde (.png + points)' },
        ];

        container.innerHTML = sections.map(s => `
            <label class="hub-checkbox-item">
                <input type="checkbox" id="${s.id}" ${s.checked ? 'checked' : ''}>
                <i data-lucide="${s.icon}" style="width:16px;height:16px;color:var(--accent-gold);"></i>
                <span>${s.label}</span>
            </label>
        `).join('');

        if (window.lucide) window.lucide.createIcons();

        // Handle manuscript toggle visibility (visible if either manuscript or analysis is checked)
        const checkM = document.getElementById('se-check-manuscript');
        const checkA = document.getElementById('se-check-analysis');
        const tree = document.getElementById('seExportTreeContainer')?.parentElement;

        const updateTreeVisibility = () => {
            if (tree && (checkM || checkA)) {
                tree.style.display = (checkM?.checked || checkA?.checked) ? '' : 'none';
            }
        };

        if (checkM) checkM.addEventListener('change', updateTreeVisibility);
        if (checkA) checkA.addEventListener('change', updateTreeVisibility);
        updateTreeVisibility();
    },

    openStructuredExportModal: function () {
        const initial = document.getElementById('project-hub-initial');
        const structured = document.getElementById('project-hub-structured-export');
        if (initial && structured) {
            initial.style.display = 'none';
            structured.style.display = 'block';
            this.renderStructuredExportChecklist();
        }
    },

    closeStructuredExportModal: function () {
        const initial = document.getElementById('project-hub-initial');
        const structured = document.getElementById('project-hub-structured-export');
        if (initial && structured) {
            initial.style.display = 'block';
            structured.style.display = 'none';
        }
    }
};

