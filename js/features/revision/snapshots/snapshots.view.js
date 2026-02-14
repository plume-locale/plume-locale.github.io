/**
 * Snapshots View
 * Handles the display of the version/snapshot management interface.
 */
class SnapshotsView {
    constructor(viewModel) {
        this.viewModel = viewModel;
        this.containerId = 'editorView';
    }

    /**
     * Renders the versions list into the container.
     */
    render() {
        const container = document.getElementById(this.containerId);
        if (!container) {
            console.error(`SnapshotsView: Container #${this.containerId} not found`);
            return;
        }

        const versions = this.viewModel.getVersions();

        container.innerHTML = `
            <div class="snapshots-container" style="height: 100%; overflow-y: auto; padding: 2rem 3rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                    <h2 style="color: var(--accent-gold);"><i data-lucide="history" style="width:24px;height:24px;vertical-align:middle;margin-right:8px;"></i>${Localization.t('snapshots.title')}</h2>
                    <button class="btn btn-primary" id="btn-create-version">
                        ${Localization.t('snapshots.create')}
                    </button>
                </div>
                
                ${versions.length === 0 ? this._renderEmptyState() : this._renderVersionsList(versions)}
            </div>
        `;

        this._bindEvents();

        // Re-init icons if needed (Lucide)
        if (typeof lucide !== 'undefined' && lucide.createIcons) {
            lucide.createIcons();
        }
    }

    _renderEmptyState() {
        return `
            <div style="text-align: center; padding: 4rem 2rem; color: var(--text-muted);">
                <div style="font-size: 3rem; margin-bottom: 1rem;">🕰️</div>
                <div style="font-size: 1.2rem; margin-bottom: 0.5rem;">${Localization.t('snapshots.empty_state')}</div>
                <div style="font-size: 0.9rem; margin-bottom: 2rem;">
                    ${Localization.t('snapshots.description')}
                </div>
                <button class="btn btn-primary" id="btn-create-version-empty">
                    ${Localization.t('snapshots.create_first')}
                </button>
            </div>
        `;
    }

    _renderVersionsList(versions) {
        return `
            <div style="display: grid; gap: 1rem;">
                ${versions.map(version => `
                    <div style="background: var(--bg-secondary); padding: 1.5rem; border-radius: 8px; border-left: 4px solid var(--accent-gold);">
                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                            <div>
                                <div style="font-size: 1.1rem; font-weight: 600; color: var(--text-primary); margin-bottom: 0.25rem;">
                                    ${version.label}
                                </div>
                                <div style="font-size: 0.85rem; color: var(--text-muted);">
                                    ${new Date(version.timestamp).toLocaleString(Localization.currentLocale === 'fr' ? 'fr-FR' : 'en-US', {
            dateStyle: 'long',
            timeStyle: 'short'
        })}
                                </div>
                            </div>
                            <div style="text-align: right;">
                                <div style="font-size: 1.5rem; font-weight: 700; color: var(--accent-gold);">
                                    ${(version.wordCount || 0).toLocaleString(Localization.currentLocale === 'fr' ? 'fr-FR' : 'en-US')}
                                </div>
                                <div style="font-size: 0.75rem; color: var(--text-muted);">
                                    ${Localization.t('snapshots.words')}
                                </div>
                            </div>
                        </div>
                        
                        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                            <button class="btn btn-small btn-restore-version" data-id="${version.id}"
                                    style="background: var(--accent-gold); color: white; border: none;">
                                <i data-lucide="undo" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i> 
                                ${Localization.t('snapshots.restore')}
                            </button>
                            <button class="btn btn-small btn-compare-version" data-id="${version.id}">
                                <i data-lucide="git-compare" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i>
                                ${Localization.t('snapshots.compare')}
                            </button>
                            <button class="btn btn-small btn-delete-version" data-id="${version.id}"
                                    style="background: var(--accent-red); color: white; border: none;">
                                <i data-lucide="trash-2" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i> 
                                ${Localization.t('snapshots.delete')}
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    _bindEvents() {
        // Create buttons
        const createBtn = document.getElementById('btn-create-version');
        if (createBtn) createBtn.addEventListener('click', () => this.handleCreate());

        const createBtnEmpty = document.getElementById('btn-create-version-empty');
        if (createBtnEmpty) createBtnEmpty.addEventListener('click', () => this.handleCreate());

        // Restore buttons
        document.querySelectorAll('.btn-restore-version').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.currentTarget.dataset.id);
                this.handleRestore(id);
            });
        });

        // Compare buttons
        document.querySelectorAll('.btn-compare-version').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.currentTarget.dataset.id);
                this.handleCompare(id);
            });
        });

        // Delete buttons
        document.querySelectorAll('.btn-delete-version').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.currentTarget.dataset.id);
                this.handleDelete(id);
            });
        });
    }

    handleCreate() {
        if (this.viewModel.createVersion()) {
            this.render(); // Re-render logic
            alert(Localization.t('snapshots.success_create'));
        }
    }

    handleDelete(id) {
        if (this.viewModel.deleteVersion(id)) {
            this.render();
        }
    }

    handleRestore(id) {
        if (this.viewModel.restoreVersion(id)) {
            // After restore, we usually switch view or refresh everything.
            // The original code does: switchView('editor'); renderActsList();
            if (typeof switchView === 'function') switchView('editor');
            if (typeof renderActsList === 'function') renderActsList();
            alert(Localization.t('snapshots.success_restore'));
        }
    }

    handleCompare(id) {
        this.lastComparedId = id;
        const result = this.viewModel.compareVersion(id);
        if (result) {
            this._renderComparisonModal(result);
        }
    }

    _renderComparisonModal(result) {
        // Create modal container
        const modalId = 'version-compare-modal';
        let modal = document.getElementById(modalId);

        if (modal) {
            modal.remove();
        }

        modal = document.createElement('div');
        modal.id = modalId;
        modal.style.cssText = `
            position: fixed;
            top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.7);
            z-index: 10000;
            display: flex;
            justify-content: center;
            align-items: center;
        `;

        const diffClass = (diff) => {
            if (diff > 0) return 'color: var(--accent-green, #4caf50);';
            if (diff < 0) return 'color: var(--accent-red, #f44336);';
            return 'color: var(--text-muted, #888);';
        };

        const rows = result.stats.map(stat => {
            const diffVal = stat.current - stat.version;
            const diffText = diffVal > 0 ? `+${diffVal}` : (diffVal === 0 ? '-' : `${diffVal}`);
            const diffStyle = diffClass(diffVal);

            return `
                <tr style="border-bottom: 1px solid var(--border-color, #333);">
                    <td style="padding: 10px; font-weight: 500;">${stat.label}</td>
                    <td style="padding: 10px; text-align: center;">${stat.version.toLocaleString(Localization.currentLocale === 'fr' ? 'fr-FR' : 'en-US')}</td>
                    <td style="padding: 10px; text-align: center;">${stat.current.toLocaleString(Localization.currentLocale === 'fr' ? 'fr-FR' : 'en-US')}</td>
                    <td style="padding: 10px; text-align: right; font-weight: bold; ${diffStyle}">${diffText}</td>
                </tr>
            `;
        }).join('');

        modal.innerHTML = `
            <div style="
                background: var(--bg-primary, #1e1e1e); 
                padding: 2rem; 
                border-radius: 8px; 
                width: 90%; 
                max-width: 600px; 
                box-shadow: 0 10px 25px rgba(0,0,0,0.5);
                border: 1px solid var(--border-color, #444);
            ">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1.5rem;">
                    <div>
                        <h2 style="margin: 0; color: var(--accent-gold, #cba135);">${Localization.t('snapshots.compare_title')}</h2>
                        <div style="margin-top: 5px; color: var(--text-muted, #aaa); font-size: 0.9rem;">
                            ${result.versionLabel} ${Localization.t('snapshots.vs_current')}
                        </div>
                    </div>
                    <button id="close-compare-modal" style="
                        background: none; 
                        border: none; 
                        color: var(--text-muted, #aaa); 
                        font-size: 1.5rem; 
                        cursor: pointer;
                        padding: 0;
                        line-height: 1;
                    ">&times;</button>
                </div>

                <table style="width: 100%; border-collapse: collapse; color: var(--text-primary, #fff);">
                    <thead>
                        <tr style="border-bottom: 2px solid var(--border-color, #444); color: var(--text-muted, #aaa); font-size: 0.85rem;">
                            <th style="padding: 8px; text-align: left;">${Localization.t('snapshots.element')}</th>
                            <th style="padding: 8px; text-align: center;">${Localization.t('snapshots.backup')}</th>
                            <th style="padding: 8px; text-align: center;">${Localization.t('snapshots.current')}</th>
                            <th style="padding: 8px; text-align: right;">${Localization.t('snapshots.diff')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>

                <div style="margin-top: 2rem; text-align: right;">
                    <button id="btn-modal-ok" style="
                        background: var(--bg-secondary, #333); 
                        color: var(--text-primary, #fff); 
                        border: 1px solid var(--border-color, #555); 
                        padding: 8px 16px; 
                        border-radius: 4px; 
                        cursor: pointer;
                    ">${Localization.t('snapshots.close')}</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const close = () => modal.remove();
        document.getElementById('close-compare-modal').addEventListener('click', close);
        document.getElementById('btn-modal-ok').addEventListener('click', close);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) close();
        });
    }
}
