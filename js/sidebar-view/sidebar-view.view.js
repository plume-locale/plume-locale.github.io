/**
 * @file sidebar-view.view.js
 * @description Vue responsable du rendu HTML de la barre latérale mobile.
 */

class SidebarView {
    constructor(viewModel) {
        this.viewModel = viewModel;
        this.containerId = 'editorView';
    }

    /**
     * Génère et injecte le HTML pour la vue demandée.
     * @param {string} viewType 
     */
    render(viewType) {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        const data = this.viewModel.getViewData(viewType);
        if (!data) return;

        const html = this._generateHtml(data);
        container.innerHTML = html;
    }

    /**
     * Génère le template HTML à partir des données.
     * @param {Object} data 
     * @returns {string} HTML string
     */
    _generateHtml(data) {
        let contentHtml = '';

        if (data.isEmpty) {
            contentHtml = `
                <div style="background: var(--bg-secondary); padding: 1.5rem; border-radius: 8px; margin-bottom: 1.5rem; border-left: 3px solid var(--accent-gold);">
                    <div style="font-weight: 600; margin-bottom: 0.5rem; color: var(--text-primary);">
                        ${data.emptyMessage}
                    </div>
                    <div style="color: var(--text-secondary); font-size: 0.95rem;">
                        ${data.emptySubMessage}
                    </div>
                </div>
                ${data.actionButton}
            `;
        } else {
            contentHtml = `
                <div style="background: var(--bg-secondary); padding: 1.5rem; border-radius: 8px; margin-bottom: 1.5rem;">
                    <div style="font-size: 2rem; font-weight: bold; color: var(--accent-gold); margin-bottom: 0.5rem;">
                        ${data.count}
                    </div>
                    <div style="color: var(--text-secondary);">
                        ${data.count === 1 ? Localization.t('sidebar_view.items.single') : Localization.t('sidebar_view.items.plural')}
                    </div>
                </div>
                ${data.actionButton}
            `;
        }

        return `
            <div class="empty-state" style="padding: 2rem 1.5rem; text-align: center;">
                <div class="empty-state-icon" style="font-size: 4rem; margin-bottom: 1rem;">
                    ${data.icon}
                </div>
                <div class="empty-state-title" style="font-size: 1.5rem; font-weight: 600; margin-bottom: 0.5rem; color: var(--text-primary);">
                    ${data.title}
                </div>
                <div class="empty-state-text" style="color: var(--text-secondary); margin-bottom: 1.5rem; line-height: 1.6;">
                    ${data.description}
                </div>
                
                ${contentHtml}

                <div style="margin-top: 2rem; padding: 1rem; background: rgba(212, 175, 55, 0.1); border-radius: 8px; border: 1px solid var(--accent-gold);">
                    <div style="font-size: 1.2rem; margin-bottom: 0.5rem;">💡</div>
                    <div style="font-size: 0.9rem; color: var(--text-secondary); line-height: 1.6;">
                        ${data.sidebarHint}
                    </div>
                </div>
            </div>
        `;
    }
}
