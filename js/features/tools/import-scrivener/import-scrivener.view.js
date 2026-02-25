/**
 * [MVVM : View]
 * Import Scrivener View
 * Interface utilisateur pour l'import de projets Scrivener (.scrivx / .scriv)
 */

const ImportScrivenerView = {

    modalId: 'importScrivenerModal',

    open() {
        if (typeof ImportScrivenerViewModel !== 'undefined') {
            ImportScrivenerViewModel.reset();
        }
        const modal = document.getElementById(this.modalId);
        if (modal) {
            modal.classList.add('active');
            this.renderInitialState();
        }
    },

    close() {
        const modal = document.getElementById(this.modalId);
        if (modal) modal.classList.remove('active');
        if (typeof ImportScrivenerViewModel !== 'undefined') {
            ImportScrivenerViewModel.reset();
        }
    },


    // ─── États ───────────────────────────────────────────────────────────────

    renderInitialState() {
        const content = document.getElementById('importScrivenerContent');
        if (!content) return;

        content.innerHTML = `
            <div class="scriv-import-body">

                <!-- Intro -->
                <div class="scriv-intro">
                    <div class="scriv-intro-icon">
                        <i data-lucide="folder-open" style="width:40px;height:40px;color:var(--accent-gold);"></i>
                    </div>
                    <h3 style="margin:0 0 0.5rem;">${Localization.t('scrivener.title')}</h3>
                    <p style="color:var(--text-muted);margin:0;font-size:0.9rem;">
                        ${Localization.t('scrivener.intro_desc')}
                    </p>
                </div>

                <!-- Instructions -->
                <div class="scriv-instructions">
                    <div class="scriv-step">
                        <span class="scriv-step-num">1</span>
                        <div>
                            <strong>${Localization.t('scrivener.step1_title')}</strong>
                            <p>${Localization.t('scrivener.step1_desc')}</p>
                        </div>
                    </div>
                    <div class="scriv-step">
                        <span class="scriv-step-num">2</span>
                        <div>
                            <strong>${Localization.t('scrivener.step2_title')}</strong>
                            <p>${Localization.t('scrivener.step2_desc')}</p>
                        </div>
                    </div>
                    <div class="scriv-step">
                        <span class="scriv-step-num">3</span>
                        <div>
                            <strong>${Localization.t('scrivener.step3_title')}</strong>
                            <p>${Localization.t('scrivener.step3_desc')}</p>
                        </div>
                    </div>
                </div>

                <!-- Dropzone -->
                <div class="scriv-dropzone" id="scrivDropzone">
                    <i data-lucide="upload-cloud" style="width:36px;height:36px;color:var(--accent-gold);margin-bottom:0.75rem;"></i>
                    <p style="font-weight:600;margin:0 0 0.5rem;">${Localization.t('scrivener.dropzone_title')}</p>
                    <p style="color:var(--text-muted);font-size:0.85rem;margin:0 0 1rem;">
                        ${Localization.t('scrivener.dropzone_subtitle')}
                    </p>
                    <input type="file" id="scrivFileInput" multiple accept=".scrivx,.rtf,.rtfd" style="display:none;">
                    <button class="btn btn-primary" onclick="document.getElementById('scrivFileInput').click()">
                        <i data-lucide="folder-open" style="width:14px;height:14px;margin-right:6px;"></i>
                        ${Localization.t('scrivener.btn_select_files')}
                    </button>
                    <p style="color:var(--text-muted);font-size:0.75rem;margin-top:0.75rem;">
                        ${Localization.t('scrivener.accepted_formats')}
                    </p>
                </div>

                <!-- Tip -->
                <div class="scriv-tip">
                    <i data-lucide="lightbulb" style="width:14px;height:14px;margin-right:6px;color:var(--accent-gold);vertical-align:middle;"></i>
                    <strong>${Localization.t('scrivener.tip_title')}</strong>
                    ${Localization.t('scrivener.tip_desc')}
                </div>
            </div>
        `;

        this._initDropzone();
        this._initFileInput();
        if (window.lucide) window.lucide.createIcons();
    },

    renderProcessing(fileCount) {
        const content = document.getElementById('importScrivenerContent');
        if (!content) return;
        content.innerHTML = `
            <div style="text-align:center;padding:3rem;">
                <div class="import-chapter-spinner"></div>
                <p style="margin-top:1.5rem;font-size:1.1rem;font-weight:600;">
                    ${Localization.t('scrivener.analyzing')}
                </p>
                <p style="color:var(--text-muted);margin-top:0.5rem;">
                    ${Localization.t('scrivener.files_selected', [fileCount, fileCount > 1 ? 's' : '', fileCount > 1 ? 's' : ''])}
                </p>
            </div>
        `;
    },

    renderPreview(data) {
        const content = document.getElementById('importScrivenerContent');
        if (!content) return;

        const { projectTitle, version, preview, rtfFilesCount, warnings } = data;

        const warningsHtml = warnings && warnings.length > 0
            ? `<div class="scriv-warning">
                <i data-lucide="alert-triangle" style="width:14px;height:14px;vertical-align:middle;margin-right:6px;color:#ffc107;"></i>
                ${warnings.join('<br>')}
               </div>`
            : '';

        // Compter les niveaux
        const actCount = preview.filter(i => i.depth === 0 && i.type === 'Folder').length || 1;
        const chapterCount = preview.filter(i => i.depth === 1 || (i.depth === 0 && i.type === 'Text')).length;
        const sceneCount = preview.filter(i => i.depth >= 2 || (i.depth === 1 && i.type === 'Text')).length;

        const treeHtml = preview.slice(0, 60).map(item => {
            const indent = item.depth * 20;
            const icon = item.type === 'Folder' ? 'folder' : 'file-text';
            const iconColor = item.depth === 0 ? 'var(--accent-gold)' : item.depth === 1 ? 'var(--text-secondary)' : 'var(--text-muted)';
            const fontWeight = item.depth === 0 ? '600' : item.depth === 1 ? '500' : '400';
            return `
                <div class="scriv-tree-item" style="padding-left:${indent + 12}px;">
                    <i data-lucide="${icon}" style="width:13px;height:13px;color:${iconColor};flex-shrink:0;"></i>
                    <span style="font-weight:${fontWeight};font-size:0.875rem;">${this._escapeHtml(item.title)}</span>
                    ${item.childCount > 0 ? `<span class="scriv-tree-badge">${item.childCount}</span>` : ''}
                </div>
            `;
        }).join('');

        const moreTxt = preview.length > 60 ? `<p style="color:var(--text-muted);font-size:0.8rem;text-align:center;padding:0.5rem;">…et ${preview.length - 60} éléments supplémentaires</p>` : '';

        content.innerHTML = `
            <div class="scriv-import-body">
                ${warningsHtml}

                <!-- Résumé -->
                <div class="scriv-summary">
                    <div class="scriv-summary-row">
                        <div class="scriv-summary-item">
                            <span class="scriv-summary-label">${Localization.t('scrivener.summary_project')}</span>
                            <strong class="scriv-summary-value" style="color:var(--accent-gold);">${this._escapeHtml(projectTitle)}</strong>
                        </div>
                        <div class="scriv-summary-item">
                            <span class="scriv-summary-label">${Localization.t('scrivener.summary_version')}</span>
                            <strong class="scriv-summary-value">Scrivener ${version}</strong>
                        </div>
                        <div class="scriv-summary-item">
                            <span class="scriv-summary-label">${Localization.t('scrivener.summary_rtf_files')}</span>
                            <strong class="scriv-summary-value">${rtfFilesCount}</strong>
                        </div>
                    </div>
                    <div class="scriv-summary-row" style="margin-top:0.75rem;">
                        <div class="scriv-summary-item">
                            <span class="scriv-summary-label">${Localization.t('scrivener.summary_acts')}</span>
                            <strong class="scriv-summary-value">${actCount}</strong>
                        </div>
                        <div class="scriv-summary-item">
                            <span class="scriv-summary-label">${Localization.t('scrivener.summary_chapters')}</span>
                            <strong class="scriv-summary-value">~${chapterCount}</strong>
                        </div>
                        <div class="scriv-summary-item">
                            <span class="scriv-summary-label">${Localization.t('scrivener.summary_scenes')}</span>
                            <strong class="scriv-summary-value">~${sceneCount}</strong>
                        </div>
                    </div>
                </div>

                <!-- Titre -->
                <div style="margin-bottom:1.25rem;">
                    <label style="display:block;font-weight:600;margin-bottom:0.5rem;font-size:0.875rem;">
                        ${Localization.t('scrivener.input_label')}
                    </label>
                    <input type="text"
                           id="scrivProjectTitle"
                           class="form-input"
                           value="${this._escapeHtml(projectTitle)}"
                           placeholder="${Localization.t('scrivener.input_placeholder')}"
                           style="width:100%;">
                </div>

                <!-- Arborescence -->
                <div style="margin-bottom:1.25rem;">
                    <div style="font-weight:600;margin-bottom:0.75rem;font-size:0.875rem;">
                        <i data-lucide="git-branch" style="width:14px;height:14px;vertical-align:middle;margin-right:6px;"></i>
                        ${Localization.t('scrivener.structure_title')}
                    </div>
                    <div class="scriv-tree">
                        ${treeHtml}
                        ${moreTxt}
                    </div>
                </div>

                <!-- Actions -->
                <div style="display:flex;gap:0.75rem;justify-content:flex-end;">
                    <button class="btn btn-secondary" onclick="ImportScrivenerView.renderInitialState()">
                        <i data-lucide="arrow-left" style="width:14px;height:14px;margin-right:6px;"></i>
                        ${Localization.t('scrivener.btn_back')}
                    </button>
                    <button class="btn btn-primary" onclick="ImportScrivenerView.confirmImport()" id="scrivConfirmBtn">
                        <i data-lucide="download" style="width:14px;height:14px;margin-right:6px;"></i>
                        ${Localization.t('scrivener.btn_confirm')}
                    </button>
                </div>
            </div>
        `;

        if (window.lucide) window.lucide.createIcons();
    },

    renderImporting() {
        const btn = document.getElementById('scrivConfirmBtn');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = `<div class="import-chapter-spinner" style="width:16px;height:16px;border-width:2px;display:inline-block;margin-right:8px;vertical-align:middle;"></div> ${Localization.t('scrivener.importing')}`;
        }
    },

    renderSuccess(data) {
        const content = document.getElementById('importScrivenerContent');
        if (!content) return;

        content.innerHTML = `
            <div style="text-align:center;padding:2rem;">
                <i data-lucide="check-circle" style="width:64px;height:64px;color:#4CAF50;margin-bottom:1rem;"></i>
                <p style="font-size:1.3rem;font-weight:700;margin-bottom:0.5rem;">${Localization.t('scrivener.success_title')}</p>
                <p style="color:var(--text-muted);margin-bottom:1.5rem;">
                    ${Localization.t('scrivener.success_desc', [
            data.actsImported, data.actsImported > 1 ? 's' : '',
            data.chaptersImported, data.chaptersImported > 1 ? 's' : '',
            data.scenesImported, data.scenesImported > 1 ? 's' : '',
            data.scenesImported > 1 ? 's' : '',
            this._escapeHtml(data.projectTitle)
        ])}
                </p>
                <button class="btn btn-primary" onclick="ImportScrivenerView.close()">
                    <i data-lucide="edit-3" style="width:14px;height:14px;margin-right:6px;"></i>
                    ${Localization.t('scrivener.btn_start_writing')}
                </button>
            </div>
        `;

        if (window.lucide) window.lucide.createIcons();
    },

    renderError(message) {
        const content = document.getElementById('importScrivenerContent');
        if (!content) return;

        content.innerHTML = `
            <div style="text-align:center;padding:2rem;">
                <i data-lucide="alert-circle" style="width:48px;height:48px;color:var(--accent-red, #e74c3c);margin-bottom:1rem;"></i>
                <p style="font-size:1.1rem;font-weight:600;color:var(--accent-red, #e74c3c);margin-bottom:0.5rem;">
                    ${Localization.t('scrivener.error_title')}
                </p>
                <p style="color:var(--text-muted);margin-bottom:1.5rem;max-width:440px;margin-left:auto;margin-right:auto;white-space:pre-wrap;font-size:0.9rem;">
                    ${this._escapeHtml(message)}
                </p>
                <button class="btn btn-primary" onclick="ImportScrivenerView.renderInitialState()">
                    <i data-lucide="refresh-cw" style="width:14px;height:14px;margin-right:6px;"></i>
                    ${Localization.t('scrivener.btn_retry')}
                </button>
            </div>
        `;

        if (window.lucide) window.lucide.createIcons();
    },


    // ─── Confirmation ─────────────────────────────────────────────────────────

    async confirmImport() {
        const titleInput = document.getElementById('scrivProjectTitle');
        const title = titleInput ? titleInput.value.trim() : '';

        this.renderImporting();

        try {
            const result = await ImportScrivenerViewModel.confirmImport(title);
            if (result.success) {
                this.renderSuccess(result.data);
            } else {
                this.renderError(result.error || 'Erreur inconnue');
            }
        } catch (e) {
            this.renderError(e.message || 'Erreur lors de l\'import');
        }
    },


    // ─── Gestion des fichiers ─────────────────────────────────────────────────

    _initDropzone() {
        const dropzone = document.getElementById('scrivDropzone');
        if (!dropzone) return;

        dropzone.addEventListener('dragover', e => {
            e.preventDefault();
            dropzone.classList.add('dragover');
        });
        dropzone.addEventListener('dragleave', () => {
            dropzone.classList.remove('dragover');
        });
        dropzone.addEventListener('drop', e => {
            e.preventDefault();
            dropzone.classList.remove('dragover');
            if (e.dataTransfer.files.length > 0) {
                this._handleFiles(e.dataTransfer.files);
            }
        });
        dropzone.addEventListener('click', e => {
            if (e.target.tagName !== 'BUTTON' && e.target.tagName !== 'INPUT') {
                document.getElementById('scrivFileInput')?.click();
            }
        });
    },

    _initFileInput() {
        const input = document.getElementById('scrivFileInput');
        if (!input) return;
        input.addEventListener('change', e => {
            if (e.target.files.length > 0) {
                this._handleFiles(e.target.files);
            }
        });
    },

    async _handleFiles(files) {
        this.renderProcessing(files.length);

        try {
            const result = await ImportScrivenerViewModel.processFiles(files);
            if (result.success) {
                this.renderPreview(result.data);
            } else {
                this.renderError(result.error);
            }
        } catch (e) {
            this.renderError(e.message || 'Erreur lors de l\'analyse');
        }
    },


    // ─── Utilitaires ──────────────────────────────────────────────────────────

    _escapeHtml(text) {
        if (!text) return '';
        const d = document.createElement('div');
        d.textContent = String(text);
        return d.innerHTML;
    }
};


// Fonctions globales
function openImportScrivenerModal() {
    ImportScrivenerView.open();
}

function closeImportScrivenerModal() {
    ImportScrivenerView.close();
}
