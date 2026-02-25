/**
 * [MVVM : View]
 * Gère l'affichage du mode édition et les interactions UI.
 */
const InterfaceCustomizerView = {
    _lastScrollTop: 0,

    /**
     * Initialisation View
     */
    init: () => {
        // Ajouter un écouteur secret pour le menu Admin (Ctrl + Alt + A)
        window.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'a') {
                e.preventDefault();
                InterfaceCustomizerView.renderAdminModuleMenu();
            }
        });
    },

    /**
     * Affiche ou masque la barre d'outils d'édition
     */
    renderEditModeUI: (active) => {
        let bar = document.getElementById('interfaceEditBar');

        if (active) {
            document.body.classList.add('interface-edit-mode');

            // Expand activity bar to ensure edit menu is legible
            const activityBar = document.getElementById('sidebarAccordion');
            if (activityBar && activityBar.classList.contains('thin')) {
                activityBar.classList.remove('thin');
            }

            if (!bar) {
                // Insert the edit bar inside activityBarCustomization
                const customSlot = document.getElementById('activityBarCustomization');
                bar = document.createElement('div');
                bar.id = 'interfaceEditBar';
                bar.className = 'interface-edit-bar';
                bar.innerHTML = `
                    <div class="edit-bar-content">
                        <div class="edit-bar-actions">
                            <button class="btn btn-outline-gold btn-sm" onclick="InterfaceCustomizerView.renderModuleSettings()">
                                <i data-lucide="layout-template" style="width:14px;height:14px;"></i> ${Localization.t('customizer.btn.modules')}
                            </button>
                            <span style="width: 8px"></span>
                            <button class="btn btn-secondary btn-sm" onclick="InterfaceCustomizerViewModel.cancelEditing()">
                                <i data-lucide="x" style="width:14px;height:14px;"></i> ${Localization.t('btn.cancel')}
                            </button>
                            <button class="btn btn-primary btn-sm" onclick="InterfaceCustomizerViewModel.saveAndExit()">
                                <i data-lucide="check" style="width:14px;height:14px;"></i> ${Localization.t('btn.apply')}
                            </button>
                        </div>
                    </div>
                `;
                if (customSlot) {
                    customSlot.appendChild(bar);
                } else {
                    document.body.appendChild(bar);
                }
                if (typeof lucide !== 'undefined') lucide.createIcons({ root: bar });
            }
            // Intercepter les clics sur les éléments du header
            InterfaceCustomizerView._bindInteraction();
        } else {
            document.body.classList.remove('interface-edit-mode');
            if (bar) bar.remove();
            const panel = document.getElementById('interfaceAdvancedPanel');
            if (panel) panel.remove();
            const structPanel = document.getElementById('structureAdvancedPanel');
            if (structPanel) structPanel.remove();
            InterfaceCustomizerView._unbindInteraction();
        }
    },

    /**
     * Sauvegarde la position du scroll
     */
    _saveScroll: (modalId) => {
        const body = document.querySelector(`#${modalId} .modal-body-scroll`);
        if (body) InterfaceCustomizerView._lastScrollTop = body.scrollTop;
    },

    /**
     * Restaure la position du scroll
     */
    _restoreScroll: (modalId) => {
        const body = document.querySelector(`#${modalId} .modal-body-scroll`);
        if (body) body.scrollTop = InterfaceCustomizerView._lastScrollTop;
    },

    /**
     * Gère la fermeture réelle d'un modal (suppression DOM pour nos modals dynamiques)
     */
    closeOurModal: (modalId) => {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => modal.remove(), 300); // Laisser le temps à l'anim
        }
    },

    /**
     * Rendu de la modale de sélection des modules (Utilisateur)
     */
    renderModuleSettings: () => {
        InterfaceCustomizerView._saveScroll('moduleSettingsModal');

        const settings = InterfaceCustomizerViewModel.state.isEditing
            ? InterfaceCustomizerViewModel.state.tempSettings
            : InterfaceCustomizerViewModel.state.settings;

        const modules = InterfaceCustomizerModel.modules;
        const presets = InterfaceCustomizerModel.getAllPresets();
        const activeModules = settings.activeModules || [];
        const mandatoryModules = settings.mandatoryModules || [];

        const modalHtml = `
                <div class="modal-content module-settings-modal compact">
                    <div class="modal-header">
                        <h2 class="modal-title"><i data-lucide="layout-template"></i> ${Localization.t('customizer.modules.title')}</h2>
                        <button class="modal-close" onclick="InterfaceCustomizerView.closeOurModal('moduleSettingsModal')">&times;</button>
                    </div>
                    <div class="modal-body modal-body-scroll">
                        <p class="setting-hint">${Localization.t('customizer.modules.hint')}</p>
                        
                        <div class="preset-selector compact">
                            ${presets.map(p => {
            const label = p.label.includes('.') ? Localization.t(p.label) : p.label;
            const isActive = settings.currentPresetId === p.id;
            return `
                                    <button class="preset-btn btn-sm ${isActive ? 'active' : ''}" onclick="InterfaceCustomizerViewModel.applyPreset('${p.id}')">
                                        ${label}
                                    </button>
                                `;
        }).join('')}
                        </div>

                        <div class="module-categories-grid">
                            ${(() => {
                const categories = [...new Set(modules.map(m => m.category))];
                return categories.map(cat => `
                                    <div class="module-category-section">
                                        <div class="module-category-header">${Localization.t('module.category.' + cat)}</div>
                                        <div class="module-compact-grid">
                                            ${modules.filter(m => m.category === cat).map(m => {
                    const isActive = activeModules.includes(m.id);
                    const isMandatory = mandatoryModules.includes(m.id);
                    return `
                                                    <div class="module-card ${isActive ? 'active' : ''} ${isMandatory ? 'mandatory' : ''}" 
                                                         ${isMandatory ? '' : `onclick="InterfaceCustomizerViewModel.toggleModuleActive('${m.id}')"`}>
                                                        <i data-lucide="${m.icon}" class="module-card-icon"></i>
                                                        <span class="module-card-label">${Localization.t(m.label)}</span>
                                                        ${isMandatory ? '<i data-lucide="lock" class="lock-icon"></i>' : ''}
                                                    </div>
                                                `;
                }).join('')}
                                        </div>
                                    </div>
                                `).join('');
            })()}
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-primary" onclick="InterfaceCustomizerView.closeOurModal('moduleSettingsModal')">${Localization.t('btn.close')}</button>
                    </div>
                </div>
        `;

        let modal = document.getElementById('moduleSettingsModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'moduleSettingsModal';
            modal.className = 'modal';
            modal.onclick = (e) => {
                if (e.target === modal) InterfaceCustomizerView.closeOurModal('moduleSettingsModal');
            };
            document.body.appendChild(modal);
        }

        modal.innerHTML = modalHtml;
        modal.classList.add('active');

        if (typeof lucide !== 'undefined') lucide.createIcons({ root: modal });
        InterfaceCustomizerView._restoreScroll('moduleSettingsModal');
    },

    /**
     * Rendu du menu secret d'ADMINISTRATION des modules
     */
    renderAdminModuleMenu: () => {
        InterfaceCustomizerView._saveScroll('adminModuleModal');

        const settings = InterfaceCustomizerViewModel.state.settings;
        const modules = InterfaceCustomizerModel.modules;
        const mandatoryModules = settings.mandatoryModules || [];

        const modalHtml = `
                <div class="modal-content module-settings-modal compact" style="max-width: 900px;">
                    <div class="modal-header">
                        <h2 class="modal-title" style="color: #ff4757;">
                            <span class="admin-badge">ADMIN</span> ${Localization.t('customizer.admin.title')}
                        </h2>
                        <button class="modal-close" onclick="InterfaceCustomizerView.closeOurModal('adminModuleModal')">&times;</button>
                    </div>
                    <div class="modal-body modal-body-scroll">
                        <p class="setting-hint">${Localization.t('customizer.admin.hint')}</p>
                        
                        <div class="admin-categories-container">
                            ${(() => {
                const categories = [...new Set(modules.map(m => m.category))];
                return categories.map(cat => `
                                    <div class="admin-category-block">
                                        <div class="module-category-header">${Localization.t('module.category.' + cat)}</div>
                                        <div class="admin-compact-list">
                                            ${modules.filter(m => m.category === cat).map(m => {
                    const isMandatory = mandatoryModules.includes(m.id);
                    return `
                                                    <div class="admin-module-tile ${isMandatory ? 'locked' : ''}" 
                                                         onclick="InterfaceCustomizerViewModel.toggleModuleMandatory('${m.id}'); InterfaceCustomizerView.renderAdminModuleMenu()">
                                                        <i data-lucide="${m.icon}" class="tile-icon"></i>
                                                        <span class="tile-label">${Localization.t(m.label)}</span>
                                                        <div class="tile-status">
                                                            <i data-lucide="${isMandatory ? 'lock' : 'unlock'}"></i>
                                                        </div>
                                                    </div>
                                                `;
                }).join('')}
                                        </div>
                                    </div>
                                `).join('');
            })()}
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-outline-danger" onclick="InterfaceCustomizerView.renderPresetsAdmin()">
                            <i data-lucide="list-plus"></i> Gérer les Presets
                        </button>
                        <span style="flex:1"></span>
                        <button class="btn btn-secondary" onclick="InterfaceCustomizerView.closeOurModal('adminModuleModal')">${Localization.t('btn.close')}</button>
                    </div>
                </div>
        `;

        let modal = document.getElementById('adminModuleModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'adminModuleModal';
            modal.className = 'modal';
            modal.onclick = (e) => {
                if (e.target === modal) InterfaceCustomizerView.closeOurModal('adminModuleModal');
            };
            document.body.appendChild(modal);
        }

        modal.innerHTML = modalHtml;
        modal.classList.add('active');

        if (typeof lucide !== 'undefined') lucide.createIcons({ root: modal });
        InterfaceCustomizerView._restoreScroll('adminModuleModal');
    },

    /**
     * Rendu de l'interface de gestion des PRESETS (Admin) avec Drag & Drop
     */
    renderPresetsAdmin: (editPresetId = null) => {
        const customPresets = InterfaceCustomizerRepository.loadCustomPresets();
        let currentPreset = editPresetId ? customPresets.find(p => p.id === editPresetId) : null;

        const settings = InterfaceCustomizerViewModel.state.settings;
        const mandatory = settings.mandatoryModules || [];

        // Modules sélectionnés pour le preset en cours de création/édition
        if (!InterfaceCustomizerView._presetTmpSelection) {
            InterfaceCustomizerView._presetTmpSelection = currentPreset ? [...currentPreset.modules] : [...mandatory];
        }

        // On s'assure que les modules obligatoires sont TOUJOURS présents dans la sélection
        mandatory.forEach(mId => {
            if (!InterfaceCustomizerView._presetTmpSelection.includes(mId)) {
                InterfaceCustomizerView._presetTmpSelection.push(mId);
            }
        });

        const modules = InterfaceCustomizerModel.modules;

        const modalHtml = `
                <div class="modal-content module-settings-modal compact" style="max-width: 1000px;">
                    <div class="modal-header">
                        <h2 class="modal-title" style="color: #ff4757;">
                            <span class="admin-badge">ADMIN</span> Gestion des Presets
                        </h2>
                        <button class="modal-close" onclick="InterfaceCustomizerView.closeOurModal('presetsAdminModal')">&times;</button>
                    </div>
                    <div class="modal-body modal-body-scroll" style="display: flex; gap: 20px;">
                        
                        <!-- Gauche : Liste des modules disponibles -->
                        <div class="presets-admin-column" style="flex: 1;">
                            <h3 class="column-title">${Localization.t('customizer.admin.presets.modules_title')}</h3>
                            <div class="modules-drag-list" style="max-height: 500px; overflow-y: auto;">
                                ${modules.map(m => `
                                    <div class="draggable-module" draggable="true" 
                                         ondragstart="event.dataTransfer.setData('text/plain', '${m.id}')">
                                        <i data-lucide="${m.icon}"></i>
                                        <span>${Localization.t(m.label)}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>

                        <!-- Droite : Composition du Preset -->
                        <div class="presets-admin-column" style="flex: 1; border-left: 1px solid var(--border-color); padding-left: 20px;">
                            <h3 class="column-title">${Localization.t('customizer.admin.presets.selection_title')}</h3>
                            
                            <div class="preset-form">
                                <input type="text" id="presetNameInput" class="form-input" 
                                       placeholder="${Localization.t('customizer.admin.presets.name_placeholder')}" 
                                       value="${currentPreset ? currentPreset.label : ''}"
                                       style="width: 100%; margin-bottom: 10px;">
                            </div>

                            <div class="drop-zone-preset" 
                                 ondragover="event.preventDefault(); this.classList.add('hover')" 
                                 ondragleave="this.classList.remove('hover')"
                                 ondrop="InterfaceCustomizerView._handlePresetDrop(event)">
                                ${InterfaceCustomizerView._presetTmpSelection.length === 0 ?
                `<div class="drop-hint">${Localization.t('customizer.admin.presets.selection_hint')}</div>` :
                InterfaceCustomizerView._presetTmpSelection.map(mid => {
                    const m = modules.find(mod => mod.id === mid);
                    const isMandatory = mandatory.includes(mid);
                    return `
                                            <div class="selected-module-tag ${isMandatory ? 'mandatory' : ''}">
                                                <i data-lucide="${m ? m.icon : 'box'}"></i>
                                                <span>${m ? Localization.t(m.label) : mid}</span>
                                                ${isMandatory ? '<i data-lucide="lock" style="width:10px;height:10px;opacity:0.6;"></i>' : `<button onclick="InterfaceCustomizerView._removeModuleFromPreset('${mid}')">&times;</button>`}
                                            </div>
                                        `;
                }).join('')}
                            </div>

                            <div style="margin-top: 20px; display: flex; gap: 10px;">
                                <button class="btn btn-primary btn-sm" onclick="InterfaceCustomizerView._saveCurrentPreset('${editPresetId}')">
                                    <i data-lucide="save"></i> ${Localization.t('customizer.admin.presets.save')}
                                </button>
                                <button class="btn btn-secondary btn-sm" onclick="InterfaceCustomizerView._resetPresetForm()">
                                    ${Localization.t('btn.cancel')}
                                </button>
                            </div>

                            <hr style="margin: 20px 0; border: none; border-top: 1px solid var(--border-color); opacity: 0.3;">
                            
                            <!-- Liste des presets existants -->
                            <h3 class="column-title">Presets Personnalisés</h3>
                            <div class="custom-presets-list">
                                ${customPresets.map(p => `
                                    <div class="custom-preset-item">
                                        <span class="preset-name">${p.label}</span>
                                        <div class="preset-actions">
                                            <button class="btn-icon" title="Activer" onclick="InterfaceCustomizerViewModel.applyPreset('${p.id}')"><i data-lucide="check-circle" style="color: var(--primary-color)"></i></button>
                                            <button class="btn-icon" title="Modifier" onclick="InterfaceCustomizerView.renderPresetsAdmin('${p.id}')"><i data-lucide="edit-3"></i></button>
                                            <button class="btn-icon danger" title="Supprimer" onclick="InterfaceCustomizerViewModel.deleteCustomPreset('${p.id}'); InterfaceCustomizerView.renderPresetsAdmin()"><i data-lucide="trash-2"></i></button>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>

                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="InterfaceCustomizerView.closeOurModal('presetsAdminModal'); InterfaceCustomizerView._resetPresetForm()">${Localization.t('btn.close')}</button>
                    </div>
                </div>
        `;

        let modal = document.getElementById('presetsAdminModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'presetsAdminModal';
            modal.className = 'modal';
            modal.onclick = (e) => {
                if (e.target === modal) InterfaceCustomizerView.closeOurModal('presetsAdminModal');
            };
            document.body.appendChild(modal);
        }

        modal.innerHTML = modalHtml;
        modal.classList.add('active');

        if (typeof lucide !== 'undefined') lucide.createIcons({ root: modal });
    },

    _handlePresetDrop: (e) => {
        e.preventDefault();
        const moduleId = e.dataTransfer.getData('text/plain');
        if (moduleId && !InterfaceCustomizerView._presetTmpSelection.includes(moduleId)) {
            InterfaceCustomizerView._presetTmpSelection.push(moduleId);
            InterfaceCustomizerView.renderPresetsAdmin();
        }
    },

    _removeModuleFromPreset: (moduleId) => {
        InterfaceCustomizerView._presetTmpSelection = InterfaceCustomizerView._presetTmpSelection.filter(id => id !== moduleId);
        InterfaceCustomizerView.renderPresetsAdmin();
    },

    _resetPresetForm: () => {
        InterfaceCustomizerView._presetTmpSelection = null;
        InterfaceCustomizerView.renderPresetsAdmin();
    },

    _saveCurrentPreset: (editId = null) => {
        const name = document.getElementById('presetNameInput').value;
        if (!name) return alert('Veuillez donner un nom au preset');
        if (InterfaceCustomizerView._presetTmpSelection.length === 0) return alert('Sélectionnez au moins un module');

        const presetData = {
            id: editId || 'preset_' + Date.now(),
            label: name, // On stocke le nom direct (pas d'ID de traduction pour les custom)
            modules: [...InterfaceCustomizerView._presetTmpSelection],
            shortcuts: [] // Optionnel pour le moment
        };

        InterfaceCustomizerViewModel.saveCustomPreset(presetData);
        InterfaceCustomizerView._presetTmpSelection = null;
        InterfaceCustomizerView.renderPresetsAdmin();
        if (typeof showNotification === 'function') showNotification('✓ Preset sauvegardé');
    },

    /**
     * Affiche/masque le panneau de personnalisation de la vue structure
     */
    toggleStructureSettings: () => {
        let panel = document.getElementById('structureAdvancedPanel');
        if (!panel) {
            panel = InterfaceCustomizerView._renderStructurePanel();
            const toolbar = document.getElementById('treeCollapseToolbar');
            if (toolbar && toolbar.parentNode) {
                toolbar.parentNode.insertBefore(panel, toolbar.nextSibling);
            } else {
                document.body.appendChild(panel);
            }
            if (typeof lucide !== 'undefined') lucide.createIcons({ root: panel });
        }

        const isVisible = panel.style.display !== 'none';
        panel.style.display = isVisible ? 'none' : 'block';

        const btn = document.getElementById('structureCustomizeBtn');
        if (btn) btn.classList.toggle('active', !isVisible);
    },

    /**
     * Génère le panneau de personnalisation structure (barres, couleurs)
     */
    _renderStructurePanel: () => {
        const settings = InterfaceCustomizerViewModel.state.isEditing
            ? InterfaceCustomizerViewModel.state.tempSettings
            : InterfaceCustomizerViewModel.state.settings;
        const panel = document.createElement('div');
        panel.id = 'structureAdvancedPanel';
        panel.className = 'structure-advanced-panel';
        panel.style.display = 'none';

        panel.innerHTML = `
            <div class="advanced-panel-header">
                <span>${Localization.t('customizer.structure.title')}</span>
                <button class="structure-panel-close" onclick="InterfaceCustomizerView.toggleStructureSettings()">
                    <i data-lucide="x" style="width:14px;height:14px;"></i>
                </button>
            </div>

            <div class="setting-group">
                <label class="setting-label">
                    <i data-lucide="align-left" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;opacity:0.6;"></i>
                    ${Localization.t('customizer.panel.progress_width')}
                </label>
                <div class="setting-hint">${Localization.t('customizer.panel.progress_width_hint')}</div>
                <div class="setting-row">
                    <input type="range" min="4" max="24" value="${settings.progressBarWidth || 8}"
                           oninput="InterfaceCustomizerViewModel.updateStructureSetting('progressBarWidth', parseInt(this.value)); this.nextElementSibling.textContent = this.value + 'px'"
                           style="flex:1;">
                    <span style="min-width: 35px; font-size: 0.8rem;">${settings.progressBarWidth || 8}px</span>
                </div>
            </div>

            <div class="setting-group">
                <label class="setting-label">
                    <i data-lucide="droplets" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;opacity:0.6;"></i>
                    ${Localization.t('customizer.panel.status_colors')}
                </label>
                <div class="setting-hint">${Localization.t('customizer.panel.status_colors_hint')}</div>

                <div class="setting-row">
                    <div class="color-input-wrapper">
                        <input type="color" value="${settings.statusDraftColor || '#ff6b6b'}"
                               oninput="InterfaceCustomizerViewModel.updateStructureSetting('statusDraftColor', this.value)">
                    </div>
                    <span style="font-size: 0.85rem;">${Localization.t('customizer.status.draft')}</span>
                </div>

                <div class="setting-row">
                    <div class="color-input-wrapper">
                        <input type="color" value="${settings.statusProgressColor || '#ffd93d'}"
                               oninput="InterfaceCustomizerViewModel.updateStructureSetting('statusProgressColor', this.value)">
                    </div>
                    <span style="font-size: 0.85rem;">${Localization.t('customizer.status.progress')}</span>
                </div>

                <div class="setting-row">
                    <div class="color-input-wrapper">
                        <input type="color" value="${settings.statusCompleteColor || '#51cf66'}"
                               oninput="InterfaceCustomizerViewModel.updateStructureSetting('statusCompleteColor', this.value)">
                    </div>
                    <span style="font-size: 0.85rem;">${Localization.t('customizer.status.complete')}</span>
                </div>

                <div class="setting-row">
                    <div class="color-input-wrapper">
                        <input type="color" value="${settings.statusReviewColor || '#4a9eff'}"
                               oninput="InterfaceCustomizerViewModel.updateStructureSetting('statusReviewColor', this.value)">
                    </div>
                    <span style="font-size: 0.85rem;">${Localization.t('customizer.status.review')}</span>
                </div>
            </div>
        `;

        return panel;
    },

    /**
     * Met à jour l'aspect visuel des icônes selon leur état temporaire
     */
    refreshComponentsVisuals: () => {
        InterfaceCustomizerViewModel.applySettings();
    },

    /**
     * Intercepte les clics pour basculer la visibilité au lieu d'exécuter l'action
     */
    _bindInteraction: () => {
        const components = InterfaceCustomizerModel.components;
        components.forEach(comp => {
            const el = document.getElementById(comp.id);
            if (el) {
                const currentOnClick = el.getAttribute('onclick');
                if (currentOnClick) {
                    el.setAttribute('data-original-onclick', currentOnClick);
                }
                el.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    InterfaceCustomizerViewModel.toggleComponent(comp.id);
                };
            }

            // Mobile items
            const viewKey = comp.id.replace('header-tab-', '');
            const mobileItem = document.querySelector(`.mobile-nav-item[data-view="${viewKey}"]`);
            if (mobileItem) {
                const mobileOnClick = mobileItem.getAttribute('onclick');
                if (mobileOnClick) {
                    mobileItem.setAttribute('data-original-onclick', mobileOnClick);
                }
                mobileItem.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    InterfaceCustomizerViewModel.toggleComponent(comp.id);
                };
            }
        });
    },

    /**
     * Restaure les clics originaux
     */
    _unbindInteraction: () => {
        const components = InterfaceCustomizerModel.components;
        components.forEach(comp => {
            const el = document.getElementById(comp.id);
            if (el) {
                if (el.hasAttribute('data-original-onclick')) {
                    const originalOnClick = el.getAttribute('data-original-onclick');
                    el.setAttribute('onclick', originalOnClick);
                    el.removeAttribute('data-original-onclick');
                    el.onclick = new Function('event', originalOnClick);
                } else {
                    el.onclick = null;
                }
            }

            const viewKey = comp.id.replace('header-tab-', '');
            const mobileItem = document.querySelector(`.mobile-nav-item[data-view="${viewKey}"]`);
            if (mobileItem) {
                if (mobileItem.hasAttribute('data-original-onclick')) {
                    const originalOnClick = mobileItem.getAttribute('data-original-onclick');
                    mobileItem.setAttribute('onclick', originalOnClick);
                    mobileItem.removeAttribute('data-original-onclick');
                    mobileItem.onclick = new Function('event', originalOnClick);
                } else {
                    mobileItem.onclick = null;
                }
            }
        });
    }
};
