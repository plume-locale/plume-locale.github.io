/**
 * @file front-matter.view.js
 * @description Vue pour l'affichage et l'édition des liminaires et annexes.
 */

class FrontMatterView {
    constructor(viewModel) {
        this.viewModel = viewModel;
        this.currentId = null;
        this.editorContainerId = 'editorView';
        this.sidebarListId = 'frontMatterList'; // ID fictif, sera injecté dans la sidebar
    }

    /**
     * Initialise la vue.
     */
    init() {
        // Optionnel : bindings d'événements globaux si nécessaire
    }

    /**
     * Renders the main view (Empty state or Selected Item).
     */
    render(containerId = 'editorView') {
        const container = document.getElementById(containerId);
        if (!container) return;

        this.renderSidebar();

        if (this.currentId) {
            // Re-render the current item
            this.openItem(this.currentId);
        } else {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon"><br><i data-lucide="book-open-check" style="width:48px;height:48px;stroke-width:1;"></i></div>
                    <div class="empty-state-title">${Localization.t('nav.front_matter')}</div>
                    <div class="empty-state-text">${Localization.t('front_matter.empty_list')}</div>
                    <br>
                    <button class="btn btn-primary" onclick="FrontMatterView.openAddModal()">${Localization.t('front_matter.add_btn')}</button>
                </div>
             `;
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }
    }

    /**
     * Affiche la liste dans la sidebar.
     * Note: Cette méthode sera appelée par switchView() ou le gestionnaire de sidebar.
     */
    renderSidebar() {
        const container = document.getElementById('frontMatterList');
        if (!container) return;

        const items = this.viewModel.getSidebarList();

        let html = `
            <div class="front-matter-sidebar" style="display: flex; flex-direction: column; height: 100%;">
                <div class="front-matter-list" style="flex: 1; overflow-y: auto;">
        `;

        if (items.length === 0) {
            html += `
                <div class="empty-state" style="padding: 20px; text-align: center; color: var(--text-muted);">
                    ${Localization.t('front_matter.empty_list')}
                </div>
            `;
        } else {
            items.forEach(item => {
                const isActive = item.id === this.currentId ? 'active' : '';
                html += `
                    <div class="treeview-item ${isActive}" onclick="FrontMatterView.openItem('${item.id}')" data-id="${item.id}">
                        <span class="treeview-item-icon">
                            <i data-lucide="${item.icon}"></i>
                        </span>
                        <span class="treeview-item-label">${item.title}</span>
                        <div class="treeview-item-actions">
                             <button class="treeview-item-delete" onclick="event.stopPropagation(); FrontMatterView.deleteItem('${item.id}')" title="${Localization.t('btn.delete')}">
                                <i data-lucide="trash-2" style="width:14px;height:14px;"></i>
                            </button>
                        </div>
                    </div>
                `;
            });
        }

        html += `</div></div>`;
        container.innerHTML = html;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    /**
     * Ouvre l'éditeur pour un élément spécifique.
     * @param {string} id 
     */
    openItem(id) {
        this.currentId = id;

        // 🔥 Protection contre l'écrasement du système d'onglets (Tabs)
        const isTabsSystem = typeof tabsState !== 'undefined' && tabsState.enabled;
        const editorView = document.getElementById(this.editorContainerId);
        const isMainEditorView = editorView && editorView.id === 'editorView';
        const isSplitRendering = document.getElementById('editorView-backup') !== null;

        if (isTabsSystem && isMainEditorView && !isSplitRendering) {
            this.renderSidebar();
            if (typeof renderTabs === 'function') {
                renderTabs();
                return;
            }
        }

        const item = this.viewModel.getItemDetails(id);
        if (!item) return;

        // Mise à jour de la sélection dans la sidebar
        this.renderSidebar();

        const container = document.getElementById(this.editorContainerId);
        if (!container) return;

        container.innerHTML = `
            <div class="editor-header">
                <div style="font-size: 0.9rem; color: var(--text-muted); text-transform: uppercase; margin-bottom: 0.5rem;">
                    ${Localization.t(FrontMatterModel.getTypeLabelKey(item.type))}
                </div>
                <input type="text" id="fm-title-input" value="${item.title}" 
                    style="width: 100%; font-size: 2rem; font-weight: bold; background: transparent; border: none; outline: none; color: var(--text-primary);"
                    placeholder="${Localization.t('front_matter.title_placeholder')}"
                    onchange="FrontMatterView.updateTitle('${item.id}', this.value)"
                />
            </div>

            <div class="editor-toolbar" id="editorToolbar">
                ${typeof getEditorToolbarHTML === 'function' ? getEditorToolbarHTML(null, true) : ''}
            </div>

            <div class="front-matter-editor" style="padding: 2rem; max-width: 800px; width: 100%; margin: 0 auto;">
                <div class="front-matter-content" style="margin-top: 2rem;">
                    <div id="fm-editor-container" style="background: var(--bg-secondary); border-radius: 8px; padding: 2rem; min-height: 500px; box-shadow: var(--shadow-sm);">
                        <div id="fm-content-editor" contenteditable="true" class="editor-textarea"
                             style="outline: none; min-height: 500px; line-height: 1.6; font-size: 1.1rem;"
                             oninput="FrontMatterView.debounceUpdateContent('${item.id}')">
                            ${item.content}
                        </div>
                    </div>
                </div>
                 <div style="margin-top: 1rem; text-align: right; color: var(--text-muted); font-size: 0.8rem;">
                    ${Localization.t('front_matter.auto_save')}
                </div>
            </div>
        `;

        if (typeof lucide !== 'undefined') lucide.createIcons();
        if (typeof initializeColorPickers === 'function') initializeColorPickers();
    }

    /**
     * Met à jour le titre.
     */
    updateTitle(id, newTitle) {
        this.viewModel.updateItem(id, { title: newTitle });
        this.renderSidebar(); // Rafraîchir la sidebar pour voir le nouveau titre
    }

    /**
     * Met à jour le contenu (avec debounce).
     */
    updateContent(id) {
        const editor = document.getElementById('fm-content-editor');
        if (editor) {
            this.viewModel.updateItem(id, { content: editor.innerHTML });
        }
    }

    /**
     * Supprime un élément.
     */
    deleteItem(id) {
        if (confirm(Localization.t('front_matter.confirm_delete'))) {
            this.viewModel.deleteItem(id);
            if (this.currentId === id) {
                this.currentId = null;
            }
            this.renderSidebar();

            if (typeof tabsState !== 'undefined' && tabsState.panes.left.tabs.length > 0 && typeof renderTabs === 'function') {
                renderTabs();
            } else {
                const container = document.getElementById(this.editorContainerId);
                if (container) container.innerHTML = '';
            }
        }
    }

    /**
     * Ouvre la modale d'ajout.
     * Pour simplifier, on utilise un prompt ou une modale simple générée dynamiquement.
     */
    openAddModal() {
        // Création dynamique d'une modale de sélection de type
        const modalHtml = `
            <div id="addFrontMatterModal" class="modal active" style="display: flex; align-items: center; justify-content: center; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000;">
                <div class="modal-content" style="background: var(--bg-primary); padding: 2rem; border-radius: 8px; width: 400px; max-width: 90%;">
                    <h3 style="margin-bottom: 1.5rem;">${Localization.t('front_matter.add_modal_title')}</h3>
                    <div style="display: grid; grid-template-columns: 1fr; gap: 0.5rem; max-height: 400px; overflow-y: auto;">
                        ${Object.values(FrontMatterModel.TYPES).map(type => `
                            <button class="btn btn-secondary" style="text-align: left; justify-content: flex-start;" onclick="FrontMatterView.addItem('${type}')">
                                <i data-lucide="${this.viewModel._getIconForType(type)}" style="margin-right: 10px;"></i>
                                ${Localization.t(FrontMatterModel.getTypeLabelKey(type))}
                            </button>
                        `).join('')}
                    </div>
                    <div style="margin-top: 1.5rem; text-align: right;">
                        <button class="btn" onclick="document.getElementById('addFrontMatterModal').remove()">${Localization.t('btn.cancel')}</button>
                    </div>
                </div>
            </div>
        `;

        // Supprimer l'ancienne modale si elle existe
        const oldModal = document.getElementById('addFrontMatterModal');
        if (oldModal) oldModal.remove();

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    addItem(type) {
        const newItem = this.viewModel.addItem(type);
        const modal = document.getElementById('addFrontMatterModal');
        if (modal) modal.remove();

        this.openItem(newItem.id);
    }

    /**
     * Ouvre la modale d'organisation (réordonnancement).
     */
    openOrganizeModal() {
        const items = this.viewModel.getSidebarList();

        const modalHtml = `
            <div id="organizeFrontMatterModal" class="modal active" style="display: flex; align-items: center; justify-content: center; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); z-index: 10000;">
                <div class="modal-content" style="background: var(--bg-primary); padding: 2rem; border-radius: 12px; width: 500px; max-width: 90%; box-shadow: var(--shadow-xl); border: 1px solid var(--border-color);">
                    <h3 style="margin-bottom: 1.5rem;"><i data-lucide="layers" style="vertical-align: middle; margin-right: 10px;"></i> ${Localization.t('tool.tree.organize')}</h3>
                    <div style="max-height: 400px; overflow-y: auto; display: flex; flex-direction: column; gap: 0.5rem;">
                        ${items.length === 0 ? `
                            <div style="text-align: center; padding: 20px; color: var(--text-muted);">
                                ${Localization.t('front_matter.empty_list')}
                            </div>
                        ` : items.map((item, index) => `
                            <div style="display: flex; align-items: center; gap: 10px; background: var(--bg-secondary); padding: 12px; border-radius: 8px; border: 1px solid var(--border-color);">
                                <div style="flex: 1; font-weight: 600; color: var(--text-primary);">${item.title || Localization.t(FrontMatterModel.getTypeLabelKey(item.type))}</div>
                                <div style="display: flex; gap: 8px;">
                                    <button class="btn btn-secondary btn-small" onclick="FrontMatterView.moveItem('${item.id}', -1)" ${index === 0 ? 'disabled' : ''} title="${Localization.t('tool.tree.up') || 'Haut'}" style="width: 36px; height: 36px; padding: 0; display: flex; align-items: center; justify-content: center; border: 1px solid var(--border-color); background: var(--bg-primary);">
                                        <i data-lucide="chevron-up" style="width: 18px; height: 18px;"></i>
                                    </button>
                                    <button class="btn btn-secondary btn-small" onclick="FrontMatterView.moveItem('${item.id}', 1)" ${index === items.length - 1 ? 'disabled' : ''} title="${Localization.t('tool.tree.down') || 'Bas'}" style="width: 36px; height: 36px; padding: 0; display: flex; align-items: center; justify-content: center; border: 1px solid var(--border-color); background: var(--bg-primary);">
                                        <i data-lucide="chevron-down" style="width: 18px; height: 18px;"></i>
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <div style="margin-top: 2rem; text-align: right; border-top: 1px solid var(--border-color); padding-top: 1.5rem;">
                        <button class="btn btn-primary" onclick="document.getElementById('organizeFrontMatterModal').remove()" style="min-width: 120px;">
                            ${Localization.t('btn.close')}
                        </button>
                    </div>
                </div>
            </div>
        `;

        const oldModal = document.getElementById('organizeFrontMatterModal');
        if (oldModal) oldModal.remove();

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    moveItem(id, direction) {
        this.viewModel.moveItem(id, direction);
        this.openOrganizeModal(); // Rafraîchir la modale
        this.renderSidebar(); // Rafraîchir la sidebar
    }
}

// Instance globale (sera initialisée dans main.js)
window.FrontMatterView = FrontMatterView;
