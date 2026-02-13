/**
 * [MVVM : View]
 * Import/Export View
 * Handles DOM manipulation for export modals and notifications.
 */

const ImportExportView = {

    // --- Backup Modal ---
    openBackupModal: function () {
        const el = document.getElementById('backupModal');
        if (el) el.classList.add('active');
    },

    closeBackupModal: function () {
        const el = document.getElementById('backupModal');
        if (el) el.classList.remove('active');
    },

    triggerFileInput: function () {
        const el = document.getElementById('importFileInput');
        if (el) el.click();
    },

    resetFileInput: function () {
        const el = document.getElementById('importFileInput');
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
        const container = document.getElementById('exportTreeContainer');
        if (!container) return;

        if (!project.acts || project.acts.length === 0) {
            container.innerHTML = `<p style="color: var(--text-muted); text-align: center;">${Localization.t('export.tree.empty')}</p>`;
            return;
        }

        let html = '';
        project.acts.forEach((act, actIndex) => {
            const actChecked = selectionState[`act-${act.id}`] ? 'checked' : '';
            html += `
                <div style="margin-bottom: 1rem;">
                    <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; font-weight: 600; font-size: 1rem; margin-bottom: 0.5rem;">
                        <input type="checkbox" ${actChecked} onchange="ImportExportViewModel.toggleAct(${act.id})" id="export-act-${act.id}" style="cursor: pointer;">
                        <span>${Localization.t('export.tree.act', actIndex + 1)}</span>
                    </label>
                    <div style="margin-left: 1.5rem;">
            `;

            act.chapters.forEach((chapter, chapIndex) => {
                const chapterChecked = selectionState[`chapter-${chapter.id}`] ? 'checked' : '';
                html += `
                    <div style="margin-bottom: 0.75rem;">
                        <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; font-weight: 500; font-size: 0.95rem; margin-bottom: 0.25rem;">
                            <input type="checkbox" ${chapterChecked} onchange="ImportExportViewModel.toggleChapter(${act.id}, ${chapter.id})" id="export-chapter-${chapter.id}" style="cursor: pointer;">
                            <span>${Localization.t('export.tree.chapter', chapIndex + 1)}</span>
                        </label>
                        <div style="margin-left: 1.5rem;">
                `;

                chapter.scenes.forEach((scene, sceneIndex) => {
                    const sceneChecked = selectionState[`scene-${scene.id}`] ? 'checked' : '';
                    html += `
                        <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 0.25rem;">
                            <input type="checkbox" ${sceneChecked} onchange="ImportExportViewModel.toggleScene(${act.id}, ${chapter.id}, ${scene.id})" id="export-scene-${scene.id}" style="cursor: pointer;">
                            <span>${Localization.t('export.tree.scene', sceneIndex + 1)}</span>
                        </label>
                    `;
                });
                html += `</div></div>`;
            });
            html += `</div></div>`;
        });
        container.innerHTML = html;
    },

    updateExportFormatInfo: function () {
        const formatSelect = document.getElementById('exportFormatSelect');
        const infoBox = document.getElementById('formatInfoBox');
        const docxPanel = document.getElementById('docxSettingsPanel');
        if (!formatSelect || !infoBox) return;

        const format = formatSelect.value;
        const messages = {
            docx: Localization.t('export.info.docx'),
            markdown: Localization.t('export.info.markdown'),
            txt: Localization.t('export.info.txt'),
            html: Localization.t('export.info.html'),
            epub: Localization.t('export.info.epub')
        };
        infoBox.innerHTML = messages[format] || messages.docx;

        // Show/hide DOCX advanced settings panel
        if (docxPanel) {
            docxPanel.style.display = (format === 'docx') ? 'block' : 'none';
        }
    },

    getOptions: function () {
        const format = document.getElementById('exportFormatSelect')?.value || 'txt';
        const options = {
            format: format,
            exportSummaries: document.getElementById('exportSummariesCheck')?.checked,
            exportProse: document.getElementById('exportProseCheck')?.checked,
            includeActTitles: document.getElementById('includeActTitlesCheck')?.checked,
            includeSceneSubtitles: document.getElementById('includeSceneSubtitlesCheck')?.checked,
            sceneDivider: document.getElementById('sceneDividerSelect')?.value || 'asterisks',
            includeCharacters: document.getElementById('includeCharactersCheck')?.checked,
            includeWorld: document.getElementById('includeWorldCheck')?.checked,
            includeTimeline: document.getElementById('includeTimelineCheck')?.checked,
            includeRelations: document.getElementById('includeRelationsCheck')?.checked,
            includeCodex: document.getElementById('includeCodexCheck')?.checked,
            includeNotes: document.getElementById('includeNotesCheck')?.checked
        };

        // Collect DOCX-specific options when DOCX is selected
        if (format === 'docx') {
            const marginsPreset = document.getElementById('docxMargins')?.value || 'wide';
            const marginPresets = (typeof DocxExportConfig !== 'undefined') ? DocxExportConfig.marginPresets : null;
            const margins = (marginPresets && marginPresets[marginsPreset]) || { top: 1700, bottom: 1700, left: 1700, right: 1700 };

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
                    bodySize: parseInt(document.getElementById('docxBodySize')?.value) || 24
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
        const loggedOutDiv = document.getElementById('gdrive-logged-out');
        const loggedInDiv = document.getElementById('gdrive-logged-in');

        if (isSignedIn && user) {
            if (loggedOutDiv) loggedOutDiv.style.display = 'none';
            if (loggedInDiv) loggedInDiv.style.display = 'block';

            const avatarEl = document.getElementById('gdrive-user-avatar');
            const nameEl = document.getElementById('gdrive-user-name');
            const emailEl = document.getElementById('gdrive-user-email');

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
        const statusText = document.getElementById('gdrive-status-text');
        const statusIcon = document.querySelector('#gdrive-sync-status i');

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
    }
};
