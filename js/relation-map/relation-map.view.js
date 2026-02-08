/**
 * Relation Map View
 * Handles the rendering of the relations graph and associated modals.
 */
class RelationMapView {
    constructor(viewModel) {
        this.viewModel = viewModel;
    }

    /**
     * Renders the entire relation map view into the editor container.
     */
    render() {
        const editorView = document.getElementById('editorView');
        if (!editorView) return;

        const characters = this.viewModel.getCharacters();
        const relations = this.viewModel.getRelations();
        const relationTypes = this.viewModel.getRelationTypes();

        if (characters.length < 2) {
            this._renderPlaceholder(editorView);
            return;
        }

        const positions = this.viewModel.getCalculatedPositions();

        let container = document.getElementById('relationMapScrollContainer');

        if (!container) {
            editorView.innerHTML = `
                <div class="relation-map-container" id="relationMapScrollContainer" style="height: 100%; overflow-y: auto; padding: 2rem 3rem;">
                    <h2 style="margin-bottom: 2rem; color: var(--accent-gold);" id="rel-map-title">
                        <i data-lucide="network" style="width:24px;height:24px;vertical-align:middle;margin-right:8px;"></i>
                        ${Localization.t('relations.title')}
                    </h2>
                    
                    <div id="selectionModeBanner"></div>

                    <div style="margin-bottom: 2rem; margin-top: 1rem; display: flex; gap: 1rem; flex-wrap: wrap;" id="rel-map-instructions">
                        <div style="flex: 1; min-width: 300px; padding: 1.5rem; background: var(--bg-secondary); border-radius: 8px; border-left: 4px solid var(--accent-gold);">
                            <div style="font-weight: 600; margin-bottom: 0.5rem;"><i data-lucide="pen-line" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i>${Localization.t('relations.create_label')}</div>
                            <div style="font-size: 0.9rem; color: var(--text-secondary); line-height: 1.6;">
                                ${Localization.t('relations.instruction_1')}<br>
                                ${Localization.t('relations.instruction_2')}<br>
                                ${Localization.t('relations.instruction_3')}
                            </div>
                        </div>
                    </div>

                    <div style="margin-bottom: 1rem; display: flex; gap: 0.5rem; justify-content: space-between; align-items: center;" id="rel-map-toolbar">
                        <div style="display: flex; gap: 0.5rem;">
                            <button class="btn btn-small" id="reset-positions-btn">
                                <i data-lucide="refresh-cw" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i> 
                                ${Localization.t('relations.btn.reset_positions')}
                            </button>
                            <button class="btn btn-small" id="auto-arrange-btn">
                                <i data-lucide="sparkles" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i>
                                ${Localization.t('relations.btn.auto_arrange')}
                            </button>
                        </div>
                        <button class="btn btn-small" id="manage-types-btn" style="background: var(--bg-secondary) !important; color: var(--text-primary) !important; border: 1px solid var(--border-color);">
                            <i data-lucide="settings-2" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i>
                            ${Localization.t('relations.btn.manage_types')}
                        </button>
                    </div>
                    
                    <div id="relationsGraph"></div>
                    
                    <div id="relationTypesStats" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem; margin-bottom: 2rem;"></div>
                    
                    <div id="relationsListContainer" style="margin-top: 2rem;"></div>
                </div>
            `;
            container = document.getElementById('relationMapScrollContainer');
        } else {
            // Update localized labels if container already exists
            const titleEl = document.getElementById('rel-map-title');
            if (titleEl) {
                titleEl.innerHTML = `<i data-lucide="network" style="width:24px;height:24px;vertical-align:middle;margin-right:8px;"></i> ${Localization.t('relations.title')}`;
            }

            const instructionsEl = document.getElementById('rel-map-instructions');
            if (instructionsEl) {
                instructionsEl.innerHTML = `
                    <div style="flex: 1; min-width: 300px; padding: 1.5rem; background: var(--bg-secondary); border-radius: 8px; border-left: 4px solid var(--accent-gold);">
                        <div style="font-weight: 600; margin-bottom: 0.5rem;"><i data-lucide="pen-line" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i>${Localization.t('relations.create_label')}</div>
                        <div style="font-size: 0.9rem; color: var(--text-secondary); line-height: 1.6;">
                            ${Localization.t('relations.instruction_1')}<br>
                            ${Localization.t('relations.instruction_2')}<br>
                            ${Localization.t('relations.instruction_3')}
                        </div>
                    </div>
                `;
            }

            const resetBtn = document.getElementById('reset-positions-btn');
            if (resetBtn) {
                resetBtn.innerHTML = `<i data-lucide="refresh-cw" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i> ${Localization.t('relations.btn.reset_positions')}`;
            }

            const autoBtn = document.getElementById('auto-arrange-btn');
            if (autoBtn) {
                autoBtn.innerHTML = `<i data-lucide="sparkles" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i> ${Localization.t('relations.btn.auto_arrange')}`;
            }

            const manageBtn = document.getElementById('manage-types-btn');
            if (manageBtn) {
                manageBtn.innerHTML = `<i data-lucide="settings-2" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i> ${Localization.t('relations.btn.manage_types')}`;
            }
        }

        // Update parts selectively to preserve scroll
        const graphDiv = document.getElementById('relationsGraph');
        if (graphDiv) graphDiv.innerHTML = this._generateGraphHTML(characters, relations, positions, relationTypes);

        const statsDiv = document.getElementById('relationTypesStats');
        if (statsDiv) {
            statsDiv.innerHTML = Object.entries(relationTypes).map(([key, rel]) => `
                <div style="display: flex; align-items: center; gap: 0.75rem; padding: 1rem; background: var(--bg-secondary); border-radius: 8px; border-left: 4px solid ${rel.color};">
                    <div style="font-size: 1.5rem; color: ${rel.color};"><i data-lucide="${rel.icon}" style="width:24px;height:24px;"></i></div>
                    <div style="flex: 1;">
                        <div style="font-weight: 600; font-size: 0.95rem;">${rel.label}</div>
                        <div style="font-size: 0.75rem; color: var(--text-muted);">${Localization.t('relations.stats.count', [this.viewModel.getRelationCount(key)])}</div>
                    </div>
                </div>
            `).join('');
        }

        const listDiv = document.getElementById('relationsListContainer');
        if (listDiv) listDiv.innerHTML = this._renderRelationsList(relations, relationTypes);

        if (typeof lucide !== 'undefined') lucide.createIcons();
        this._attachEventListeners();
        this.updateSelectionUI();
    }

    _renderPlaceholder(container) {
        container.innerHTML = `
            <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center;">
                <div style="font-size: 4rem; margin-bottom: 1rem;"><i data-lucide="users" style="width:64px;height:64px;"></i></div>
                <div style="font-size: 1.3rem; font-weight: 600; margin-bottom: 0.5rem;">${Localization.t('relations.empty.title')}</div>
                <div style="color: var(--text-muted); margin-bottom: 1rem;">${Localization.t('relations.empty.desc')}</div>
                <button class="btn btn-primary" id="go-to-characters-btn">${Localization.t('relations.btn.go_to_characters')}</button>
            </div>
        `;
        if (typeof lucide !== 'undefined') lucide.createIcons();
        const btn = document.getElementById('go-to-characters-btn');
        if (btn) btn.onclick = () => { if (typeof switchView === 'function') switchView('characters'); };
    }

    _generateGraphHTML(characters, relations, positions, relationTypes) {
        let svgLines = '<svg id="relationsSvg" style="position: absolute; width: 100%; height: 100%; top: 0; left: 0; pointer-events: none;">';

        relations.forEach(rel => {
            const char1 = characters.find(c => c.id == rel.char1Id);
            const char2 = characters.find(c => c.id == rel.char2Id);

            if (char1 && char2) {
                const i1 = characters.indexOf(char1);
                const i2 = characters.indexOf(char2);

                const x1 = positions[i1].x;
                const y1 = positions[i1].y;
                const x2 = positions[i2].x;
                const y2 = positions[i2].y;

                const relType = relationTypes[rel.type] || relationTypes['neutre'] || { color: '#757575', icon: 'meh' };

                svgLines += `
                        <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" 
                              stroke="${relType.color}" 
                              stroke-width="3" 
                              opacity="0.8"
                              style="cursor: pointer; pointer-events: auto;"
                              class="relation-line"
                              data-rel-id="${rel.id}"/>
                        <foreignObject x="${(x1 + x2) / 2 - 10}" y="${(y1 + y2) / 2 - 10}" width="20" height="20" style="pointer-events: none;">
                            <div xmlns="http://www.w3.org/1999/xhtml" style="color:${relType.color}; display:flex; align-items:center; justify-content:center;">
                                <i data-lucide="${relType.icon}" style="width:16px;height:16px;"></i>
                            </div>
                        </foreignObject>
                    `;
            }
        });

        svgLines += '</svg>';

        let nodesHTML = '';
        characters.forEach((char, i) => {
            const pos = positions[i];
            nodesHTML += `
                <div id="char-node-${char.id}" 
                     class="char-node-draggable"
                     data-char-id="${char.id}"
                     style="position: absolute; left: ${pos.x}px; top: ${pos.y}px;">
                    <div class="char-avatar-circle">
                        ${char.avatar ? char.avatar : '<i data-lucide="user" style="width:40px;height:40px;color:white;"></i>'}
                    </div>
                    <div class="char-node-label">${char.name}</div>
                </div>
            `;
        });

        // Set the style for the graph container
        const graphContainer = document.getElementById('relationsGraph');
        if (graphContainer) {
            graphContainer.style.position = 'relative';
            graphContainer.style.height = '700px';
            graphContainer.style.background = 'var(--bg-secondary)';
            graphContainer.style.borderRadius = '12px';
            graphContainer.style.marginBottom = '2rem';
            graphContainer.style.boxShadow = 'inset 0 2px 10px var(--shadow)';
            graphContainer.style.backgroundImage = 'radial-gradient(var(--border-color) 1px, transparent 1px)';
            graphContainer.style.backgroundSize = '30px 30px';
            graphContainer.style.overflow = 'hidden';
        }

        return svgLines + nodesHTML;
    }

    /**
     * Updates the selection UI without re-rendering everything.
     */
    updateSelectionUI() {
        const selectedIds = this.viewModel.selectedCharsForRelation;

        // Update nodes
        document.querySelectorAll('.char-node-draggable').forEach(node => {
            const charId = Number(node.dataset.charId);
            node.classList.toggle('selected', selectedIds.includes(charId));
            node.classList.toggle('first-selected', selectedIds[0] === charId && selectedIds.length === 1);
        });

        // Update banner
        const banner = document.getElementById('selectionModeBanner');
        if (banner) {
            if (selectedIds.length === 1) {
                const char = this.viewModel.getCharacters().find(c => c.id == selectedIds[0]);
                if (char) {
                    banner.innerHTML = `
                        <div class="selection-mode-banner">
                            <span><i data-lucide="mouse-pointer" style="width:16px;height:16px;vertical-align:middle;margin-right:8px;"></i>${Localization.t('relations.selection.instruction', [char.name])}</span>
                            <button class="btn btn-small" style="background:rgba(255,255,255,0.2); border:none; color:white;" id="cancelSelectionBtn">${Localization.t('btn.cancel')}</button>
                        </div>
                    `;
                    const cancelBtn = document.getElementById('cancelSelectionBtn');
                    if (cancelBtn) cancelBtn.onclick = () => RelationMapHandlers.handleCloseModal();
                    if (typeof lucide !== 'undefined') lucide.createIcons();
                }
            } else {
                banner.innerHTML = '';
            }
        }
    }

    _renderRelationsList(relations, relationTypes) {
        if (!relations || relations.length === 0) return '';

        const characters = this.viewModel.getCharacters();

        return `
            <div style="background: var(--bg-secondary); padding: 1.5rem; border-radius: 8px;">
                <h3 style="margin-bottom: 1rem; color: var(--text-primary);">
                    <i data-lucide="list" style="width:18px;height:18px;vertical-align:middle;margin-right:6px;"></i>
                    ${Localization.t('relations.list.title', [relations.length])}
                </h3>
                <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                    ${relations.map(rel => {
            const char1 = characters.find(c => c.id == rel.char1Id);
            const char2 = characters.find(c => c.id == rel.char2Id);
            const relType = relationTypes[rel.type] || relationTypes['neutre'] || { label: Localization.t('relations.type.unknown'), color: '#757575', icon: 'meh' };
            if (!char1 || !char2) return '';

            return `
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: var(--bg-primary); border-radius: 4px; border-left: 4px solid ${relType.color};">
                                <div style="display: flex; align-items: center; gap: 1rem;">
                                    <span style="font-size: 1.5rem; color: ${relType.color};"><i data-lucide="${relType.icon}" style="width:20px;height:20px;"></i></span>
                                    <span style="font-weight: 600;">${char1.name}</span>
                                    <span style="color: var(--text-muted);"><i data-lucide="split" style="width:14px;height:14px;transform: rotate(90deg);"></i></span>
                                    <span style="font-weight: 600;">${char2.name}</span>
                                    ${rel.description ? `<span style="color: var(--text-muted); font-size: 0.85rem;">· ${rel.description}</span>` : ''}
                                </div>
                                <div style="display: flex; gap: 0.5rem;">
                                    <button class="btn btn-small edit-relation-btn" data-rel-id="${rel.id}"><i data-lucide="pencil" style="width:14px;height:14px;"></i></button>
                                    <button class="btn btn-small delete-relation-btn" data-rel-id="${rel.id}"><i data-lucide="trash-2" style="width:14px;height:14px;"></i></button>
                                </div>
                            </div>
                        `;
        }).join('')}
                </div>
            </div>
        `;
    }

    _attachEventListeners() {
        // Buttons using direct attachment (these don't change often)
        const resetBtn = document.getElementById('reset-positions-btn');
        if (resetBtn) resetBtn.onclick = () => RelationMapHandlers.handleResetPositions();

        const autoBtn = document.getElementById('auto-arrange-btn');
        if (autoBtn) autoBtn.onclick = () => RelationMapHandlers.handleAutoArrange();

        const manageBtn = document.getElementById('manage-types-btn');
        if (manageBtn) manageBtn.onclick = () => this.showManageTypesModal();

        // Character nodes
        document.querySelectorAll('.char-node-draggable').forEach(node => {
            const charId = node.dataset.charId;
            node.onmousedown = (e) => RelationMapHandlers.handleMouseDown(e, charId);
            node.onclick = (e) => RelationMapHandlers.handleCharacterClick(e, charId);
        });

        // Relation elements (lines and list buttons)
        const graphDiv = document.getElementById('relationsGraph');
        if (graphDiv) {
            graphDiv.onclick = (e) => {
                const line = e.target.closest('.relation-line');
                if (line) {
                    RelationMapHandlers.handleEditRelation(line.dataset.relId);
                }
            };
        }

        document.querySelectorAll('.edit-relation-btn').forEach(btn => {
            btn.onclick = () => RelationMapHandlers.handleEditRelation(btn.dataset.relId);
        });
        document.querySelectorAll('.delete-relation-btn').forEach(btn => {
            btn.onclick = () => RelationMapHandlers.handleDeleteRelation(btn.dataset.relId);
        });
    }

    /**
     * Updates the SVG lines based on current DOM positions of characters.
     */
    updateRelationLines() {
        const svg = document.getElementById('relationsSvg');
        if (!svg) return;

        const relations = this.viewModel.getRelations();
        const characters = this.viewModel.getCharacters();
        const relationTypes = this.viewModel.getRelationTypes();
        let svgContent = '';

        relations.forEach(rel => {
            const char1 = characters.find(c => c.id == rel.char1Id);
            const char2 = characters.find(c => c.id == rel.char2Id);

            if (char1 && char2) {
                const node1 = document.getElementById(`char-node-${char1.id}`);
                const node2 = document.getElementById(`char-node-${char2.id}`);

                if (node1 && node2) {
                    const x1 = parseFloat(node1.style.left);
                    const y1 = parseFloat(node1.style.top);
                    const x2 = parseFloat(node2.style.left);
                    const y2 = parseFloat(node2.style.top);

                    const relType = relationTypes[rel.type] || relationTypes['neutre'] || { color: '#757575', icon: 'meh' };

                    svgContent += `
                        <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" 
                              stroke="${relType.color}" 
                              stroke-width="3" 
                              opacity="0.8"
                              style="cursor: pointer; pointer-events: auto;"
                              class="relation-line"
                              data-rel-id="${rel.id}"/>
                        <foreignObject x="${(x1 + x2) / 2 - 10}" y="${(y1 + y2) / 2 - 10}" width="20" height="20" style="pointer-events: none;">
                            <div xmlns="http://www.w3.org/1999/xhtml" style="color:${relType.color}; display:flex; align-items:center; justify-content:center;">
                                <i data-lucide="${relType.icon}" style="width:16px;height:16px;"></i>
                            </div>
                        </foreignObject>
                    `;
                }
            }
        });

        svg.innerHTML = svgContent;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    /**
     * Shows the modal to create or edit a relation.
     */
    showRelationModal(relation = null) {
        let char1, char2;
        const characters = this.viewModel.getCharacters();
        const relationTypes = this.viewModel.getRelationTypes();

        if (relation) {
            char1 = characters.find(c => c.id == relation.char1Id);
            char2 = characters.find(c => c.id == relation.char2Id);
            this.viewModel.currentEditingRelationId = relation.id;
            this.viewModel.selectedRelationType = relation.type;
        } else {
            const charIds = this.viewModel.selectedCharsForRelation;
            char1 = characters.find(c => c.id == charIds[0]);
            char2 = characters.find(c => c.id == charIds[1]);
            this.viewModel.currentEditingRelationId = null;
        }

        if (!char1 || !char2) return;

        const modalHTML = `
            <div class="modal active" id="relationModal" onclick="if(event.target===this) RelationMapHandlers.handleCloseModal()">
                <div class="modal-content" style="max-width: 500px;">
                    <h2 style="margin-bottom: 1.5rem;"><i data-lucide="link" style="width:20px;height:20px;vertical-align:middle;margin-right:6px;"></i>${relation ? Localization.t('relations.modal.title_edit') : Localization.t('relations.modal.title_create')}</h2>
                    
                    <div style="margin-bottom: 1.5rem; padding: 1rem; background: var(--bg-secondary); border-radius: 8px; text-align: center;">
                        <span style="font-weight: 600; font-size: 1.1rem;">${char1.name}</span>
                        <span style="margin: 0 1rem; color: var(--text-muted);">↔</span>
                        <span style="font-weight: 600; font-size: 1.1rem;">${char2.name}</span>
                    </div>
                    
                    <div style="margin-bottom: 1.5rem;">
                        <label style="display: block; font-weight: 600; margin-bottom: 0.75rem;">${Localization.t('relations.modal.type_label')}</label>
                        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem; max-height: 250px; overflow-y: auto; padding-right: 5px;">
                            ${Object.entries(relationTypes).map(([key, rel]) => `
                                <button class="btn rel-type-btn ${relation && relation.type === key ? 'btn-primary' : ''}" data-type="${key}" id="relType-${key}"
                                        style="justify-content: flex-start; text-align: left; padding: 0.75rem; display: flex; align-items: center; gap: 0.5rem; position: relative;">
                                    <div style="width: 4px; height: 100%; background: ${rel.color}; position: absolute; left: 0; top: 0; bottom: 0;"></div>
                                    <i data-lucide="${rel.icon}" style="width:16px;height:16px;color:${rel.color};"></i>
                                    ${rel.label}
                                </button>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 1.5rem;">
                        <label style="display: block; font-weight: 600; margin-bottom: 0.5rem;">${Localization.t('relations.modal.desc_label')}</label>
                        <input type="text" class="form-input" id="relationDescription" value="${relation ? (relation.description || '') : ''}" placeholder="${Localization.t('relations.modal.desc_placeholder')}">
                    </div>
                    
                    <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
                        <button class="btn" onclick="RelationMapHandlers.handleCloseModal()">${Localization.t('btn.cancel')}</button>
                        <button class="btn btn-primary" id="saveRelationBtn" ${!relation && !this.viewModel.selectedRelationType ? 'disabled' : ''}>
                            ${relation ? Localization.t('relations.modal.btn_save_changes') : Localization.t('relations.modal.btn_create')}
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        setTimeout(() => {
            if (typeof lucide !== 'undefined') lucide.createIcons();

            // Attach modal events
            document.querySelectorAll('.rel-type-btn').forEach(btn => {
                btn.onclick = () => RelationMapHandlers.handleSelectType(btn.dataset.type);
            });
            const saveBtn = document.getElementById('saveRelationBtn');
            if (saveBtn) saveBtn.onclick = () => RelationMapHandlers.handleSaveRelation();
        }, 0);
    }

    /**
     * Shows a modal to manage (add/delete) custom relation types.
     */
    showManageTypesModal() {
        const customs = this.viewModel.repository.getCustomRelationTypes();
        const defaults = RelationMapModel.RELATION_TYPES;
        const availableIcons = [
            'tag', 'heart', 'heart-crack', 'star', 'flame', 'zap', 'anchor', 'crown', 'swords', 'axe',
            'house', 'graduation-cap', 'skull', 'ghost', 'shield', 'key', 'gem', 'eye', 'venetian-mask',
            'droplets', 'sun', 'moon', 'wand-2', 'feather', 'book-open', 'hourglass', 'infinity',
            'target', 'wine', 'coins', 'compass', 'link-2', 'clover', 'leaf', 'meh'
        ];

        const modalHTML = `
            <div class="modal active" id="manageTypesModal" onclick="if(event.target===this) this.remove()">
                <div class="modal-content" style="max-width: 650px; background: var(--bg-primary); border: 1px solid var(--border-color); color: var(--text-primary);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                        <h2 style="margin: 0; color: var(--accent-gold);"><i data-lucide="settings-2" style="width:20px;height:20px;vertical-align:middle;margin-right:6px;"></i>${Localization.t('relations.btn.manage_types')}</h2>
                        <button class="btn btn-small" onclick="document.getElementById('manageTypesModal').remove()"><i data-lucide="x" style="width:16px;height:16px; color: var(--text-primary);"></i></button>
                    </div>

                    <div style="margin-bottom: 2rem; padding: 1.5rem; background: var(--bg-secondary); border-radius: 12px; border: 1px solid var(--border-color);">
                        <h3 style="font-size: 1rem; margin-bottom: 1.25rem; font-weight: 600; color: var(--text-primary);">${Localization.t('relations.manage.add_title')}</h3>
                        <div style="display: flex; flex-direction: column; gap: 1rem;">
                            <div style="display: flex; gap: 0.75rem; align-items: flex-end;">
                                <div style="flex: 2;">
                                    <label style="display: block; font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.4rem;">${Localization.t('relations.manage.label_field')}</label>
                                    <input type="text" id="newTypeLabel" class="form-input" placeholder="Ex: Mariage..." style="width: 100%; background: var(--bg-primary); color: var(--text-primary); border: 1px solid var(--border-color);">
                                </div>
                                <div style="flex: 0 0 70px;">
                                    <label style="display: block; font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.4rem;">${Localization.t('relations.manage.color_field')}</label>
                                    <input type="color" id="newTypeColor" value="#ff9800" style="width: 100%; height: 38px; padding: 2px; border: 1px solid var(--border-color); border-radius: 4px; background: var(--bg-primary); cursor: pointer;">
                                </div>
                                <div style="flex: 1;">
                                    <button class="btn btn-primary" id="addNewTypeBtn" style="width: 100%; height: 38px;">${Localization.t('relations.manage.btn_add')}</button>
                                </div>
                            </div>
                            
                            <div>
                                <label style="display: block; font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.6rem;">${Localization.t('relations.manage.icon_label')}</label>
                                <div id="iconSelectorGrid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(40px, 1fr)); gap: 0.5rem; background: var(--bg-primary); padding: 0.75rem; border-radius: 8px; border: 1px solid var(--border-color);">
                                    ${availableIcons.map(icon => `
                                        <div class="icon-option ${icon === 'tag' ? 'active' : ''}" data-icon="${icon}" 
                                             style="display: flex; align-items: center; justify-content: center; padding: 0.5rem; border-radius: 4px; cursor: pointer; border: 2px solid transparent; transition: all 0.2s; color: var(--text-primary);">
                                            <i data-lucide="${icon}" style="width:20px;height:20px;"></i>
                                        </div>
                                    `).join('')}
                                </div>
                                <input type="hidden" id="selectedIconInput" value="tag">
                            </div>
                        </div>
                    </div>

                    <h3 style="font-size: 1rem; margin-bottom: 1rem; font-weight: 600; color: var(--text-primary);">${Localization.t('relations.manage.current_types')}</h3>
                    <div style="max-height: 250px; overflow-y: auto; padding-right: 5px;">
                        <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                            <!-- Customs (Editable) -->
                            ${Object.entries(customs).map(([key, rel]) => `
                                <div style="display: flex; align-items: center; gap: 1rem; padding: 0.75rem; background: var(--bg-secondary); border-radius: 6px; border-left: 4px solid ${rel.color};">
                                    <div style="width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; background: var(--bg-primary); border-radius: 4px;">
                                        <i data-lucide="${rel.icon}" style="width:16px;height:16px;color:${rel.color};"></i>
                                    </div>
                                    <span style="flex: 1; font-weight: 500;">${rel.label}</span>
                                    <button class="btn btn-small delete-type-btn" data-type-key="${key}" style="background: none; border: none; color: var(--accent-red); opacity: 0.7; padding: 5px;">
                                        <i data-lucide="trash-2" style="width:16px;height:16px;"></i>
                                    </button>
                                </div>
                            `).join('')}

                            <!-- Defaults (Read only) -->
                            ${Object.entries(defaults).map(([key, rel]) => `
                                <div style="display: flex; align-items: center; gap: 1rem; padding: 0.75rem; background: var(--bg-secondary); border-radius: 6px; border-left: 4px solid ${rel.color}; opacity: 0.6;">
                                    <div style="width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; background: var(--bg-primary); border-radius: 4px;">
                                        <i data-lucide="${rel.icon}" style="width:16px;height:16px;color:${rel.color};"></i>
                                    </div>
                                    <span style="flex: 1; font-weight: 500;">${rel.label}</span>
                                    <span style="font-size: 0.7rem; color: var(--text-muted); font-style: italic;">${Localization.t('relations.manage.system_label')}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
            
            <style>
                .icon-option:hover { background: var(--bg-secondary); }
                .icon-option.active { border-color: var(--accent-gold); background: var(--bg-secondary); color: var(--accent-gold); }
            </style>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        if (typeof lucide !== 'undefined') lucide.createIcons();

        // Icon Selection Logic
        const iconInput = document.getElementById('selectedIconInput');
        document.querySelectorAll('.icon-option').forEach(opt => {
            opt.onclick = () => {
                document.querySelectorAll('.icon-option').forEach(o => o.classList.remove('active'));
                opt.classList.add('active');
                iconInput.value = opt.dataset.icon;
            };
        });

        // Event Listeners for manage modal
        const addBtn = document.getElementById('addNewTypeBtn');
        if (addBtn) {
            addBtn.onclick = () => {
                const label = document.getElementById('newTypeLabel').value;
                const color = document.getElementById('newTypeColor').value;
                const icon = iconInput.value;
                if (label.trim()) {
                    this.viewModel.addRelationType(label, color, icon);
                    document.getElementById('manageTypesModal').remove();
                    this.render();
                    if (typeof showNotification === 'function') showNotification(Localization.t('relations.notify.type_added'));
                }
            };
        }

        document.querySelectorAll('.delete-type-btn').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const key = btn.dataset.typeKey;
                if (confirm(Localization.t('relations.confirm.delete_type'))) {
                    this.viewModel.deleteRelationType(key);
                    document.getElementById('manageTypesModal').remove();
                    this.render();
                }
            };
        });
    }

    /**
     * Updates the active state of type buttons in the modal.
     */
    updateModalTypeSelection(selectedType) {
        document.querySelectorAll('.rel-type-btn').forEach(btn => {
            btn.classList.remove('btn-primary');
        });
        const activeBtn = document.getElementById(`relType-${selectedType}`);
        if (activeBtn) activeBtn.classList.add('btn-primary');

        const saveBtn = document.getElementById('saveRelationBtn');
        if (saveBtn) saveBtn.disabled = false;
    }

    /**
     * Removes the relation modal from the DOM.
     */
    closeModal() {
        const modal = document.getElementById('relationModal');
        if (modal) modal.remove();
    }
}
