// ============================================
// ARC BOARD - Views (HTML Rendering)
// ============================================

/**
 * Vue principale - Génère le HTML
 */
const ArcBoardView = {
    // ==========================================
    // SIDEBAR
    // ==========================================

    /**
     * Rendu de la sidebar avec la liste des arcs
     */
    renderSidebar() {
        const list = document.getElementById('arcsList');
        if (!list) return;

        ArcRepository.init();
        const arcs = ArcRepository.getAll();

        let html = '';

        // Formulaire de création d'arc
        if (ArcBoardState.showingArcForm) {
            html += this._renderArcForm();
        }

        // Formulaire de création de catégorie
        if (ArcBoardState.showingCategoryForm) {
            html += this._renderCategoryForm();
        }

        if (arcs.length === 0 && !ArcBoardState.showingArcForm && !ArcBoardState.showingCategoryForm) {
            html += `
                <div class="sidebar-empty">
                    <div class="sidebar-empty-icon"><i data-lucide="layout-dashboard"></i></div>
                    <p>${Localization.t('arc.sidebar.empty')}</p>
                </div>
            `;
        } else if (arcs.length > 0) {
            html += this._renderArcsByCategory(arcs);
        }

        // Bouton nouvelle catégorie
        if (!ArcBoardState.showingCategoryForm && !ArcBoardState.showingArcForm) {
            html += `
                <div class="sidebar-tree-add" onclick="ArcBoardViewModel.showCategoryForm()">
                    <i data-lucide="folder-plus"></i>
                    <span>${Localization.t('arc.sidebar.new_category')}</span>
                </div>
            `;
        }

        list.innerHTML = html;
        if (typeof lucide !== 'undefined') lucide.createIcons();

        // Focus sur le formulaire
        if (ArcBoardState.showingArcForm) {
            document.getElementById('inlineArcTitle')?.focus();
        } else if (ArcBoardState.showingCategoryForm) {
            document.getElementById('inlineCategoryName')?.focus();
        }
    },

    _renderArcsByCategory(arcs) {
        const allCategories = ArcRepository.getAllCategories();
        const arcsByCategory = {};
        const uncategorized = [];

        arcs.forEach(arc => {
            const cat = arc.category || 'uncategorized';
            if (cat === 'uncategorized' || !allCategories[cat]) {
                uncategorized.push(arc);
            } else {
                if (!arcsByCategory[cat]) arcsByCategory[cat] = [];
                arcsByCategory[cat].push(arc);
            }
        });

        let html = '';

        // Non catégorisés en premier
        if (uncategorized.length > 0) {
            html += this._renderCategory('uncategorized', {
                label: Localization.t('arc.category.uncategorized'),
                icon: 'folder',
                color: 'var(--text-muted)'
            }, uncategorized);
        }

        // Autres catégories
        Object.entries(allCategories).forEach(([key, data]) => {
            const categoryArcs = arcsByCategory[key] || [];
            if (categoryArcs.length > 0) {
                html += this._renderCategory(key, data, categoryArcs);
            }
        });

        return html;
    },

    _renderCategory(key, data, arcs) {
        const isExpanded = !ArcRepository.isCategoryCollapsed(key);
        return `
            <div class="sidebar-tree-category" data-category="${key}">
                <div class="sidebar-tree-header" onclick="ArcRepository.toggleCategoryCollapse('${key}'); ArcBoardView.renderSidebar();">
                    <span class="sidebar-tree-toggle">
                        <i data-lucide="${isExpanded ? 'chevron-down' : 'chevron-right'}"></i>
                    </span>
                    <span class="sidebar-tree-icon" style="color: ${data.color}">
                        <i data-lucide="${data.icon}"></i>
                    </span>
                    <span class="sidebar-tree-label">${data.label}</span>
                    <span class="sidebar-tree-count">${arcs.length}</span>
                </div>
                <div class="sidebar-tree-children ${isExpanded ? '' : 'collapsed'}">
                    ${arcs.map(arc => this._renderArcItem(arc)).join('')}
                </div>
            </div>
        `;
    },

    _renderArcItem(arc) {
        const isActive = ArcBoardState.currentArcId === arc.id;
        const allCategories = ArcRepository.getAllCategories();
        const catData = allCategories[arc.category] || { color: '#999' };

        return `
            <div class="sidebar-tree-item ${isActive ? 'active' : ''}"
                 onclick="ArcBoardViewModel.openArc('${arc.id}')"
                 data-arc-id="${arc.id}">
                <span class="sidebar-tree-item-dot" style="background: ${arc.color || catData.color}"></span>
                <span class="sidebar-tree-item-title">${arc.title || Localization.t('arc.sidebar.untitled')}</span>
                <button class="sidebar-tree-item-menu" onclick="event.stopPropagation(); ArcBoardView.showArcContextMenu(event, '${arc.id}')">
                    <i data-lucide="more-horizontal"></i>
                </button>
            </div>
        `;
    },

    _renderArcForm() {
        const allCategories = ArcRepository.getAllCategories();
        const editingArc = ArcBoardState.editingArcId
            ? ArcRepository.getById(ArcBoardState.editingArcId)
            : null;

        const isEditing = !!editingArc;
        const formTitle = isEditing ? Localization.t('arc.form.edit_title') : Localization.t('arc.form.new_title');
        const buttonText = isEditing ? Localization.t('btn.save') : Localization.t('btn.create');

        const arcTitle = editingArc?.title || '';
        const arcCategory = editingArc?.category || 'intrigue';
        const arcColor = editingArc?.color || '#e74c3c';

        return `
            <div class="sidebar-inline-form" id="arc-form-panel">
                <div class="sidebar-inline-form-header">
                    <i data-lucide="${isEditing ? 'settings' : 'sparkles'}"></i>
                    <span>${formTitle}</span>
                    <button class="sidebar-inline-form-close" onclick="ArcBoardViewModel.hideArcForm()">
                        <i data-lucide="x"></i>
                    </button>
                </div>
                <div class="sidebar-inline-form-body">
                    <input type="hidden" id="inlineArcId" value="${ArcBoardState.editingArcId || ''}">
                    <div class="sidebar-inline-form-group">
                        <label>${Localization.t('arc.form.label_title')}</label>
                        <input type="text" id="inlineArcTitle" class="sidebar-inline-input"
                               placeholder="${Localization.t('arc.form.placeholder_title')}"
                               value="${arcTitle.replace(/"/g, '&quot;')}"
                               onkeydown="ArcBoardEventHandlers.handleArcFormKeydown(event)">
                    </div>
                    <div class="sidebar-inline-form-group">
                        <label>${Localization.t('arc.form.label_category')}</label>
                        <select id="inlineArcCategory" class="sidebar-inline-select" onchange="ArcBoardEventHandlers.updateArcFormColor()">
                            ${Object.entries(allCategories).map(([key, cat]) =>
            `<option value="${key}" ${key === arcCategory ? 'selected' : ''}>${cat.label}</option>`
        ).join('')}
                        </select>
                    </div>
                    <div class="sidebar-inline-form-group">
                        <label>${Localization.t('arc.form.label_color')}</label>
                        <div class="sidebar-inline-color-row">
                            <input type="color" id="inlineArcColor" value="${arcColor}" class="sidebar-inline-color">
                            <span id="inlineArcColorHex" class="sidebar-inline-color-hex">${arcColor}</span>
                        </div>
                    </div>
                    <div class="sidebar-inline-form-actions">
                        <button class="btn-secondary btn-sm" onclick="ArcBoardViewModel.hideArcForm()">${Localization.t('btn.cancel')}</button>
                        <button class="btn-primary btn-sm" onclick="ArcBoardEventHandlers.confirmArcForm()">
                            <i data-lucide="${isEditing ? 'save' : 'plus'}"></i> ${buttonText}
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    _renderCategoryForm() {
        return `
            <div class="sidebar-inline-form">
                <div class="sidebar-inline-form-header">
                    <i data-lucide="folder-plus"></i>
                    <span>${Localization.t('arc.cat_form.new_title')}</span>
                    <button class="sidebar-inline-form-close" onclick="ArcBoardViewModel.hideCategoryForm()">
                        <i data-lucide="x"></i>
                    </button>
                </div>
                <div class="sidebar-inline-form-body">
                    <div class="sidebar-inline-form-group">
                        <label>${Localization.t('arc.cat_form.label_name')}</label>
                        <input type="text" id="inlineCategoryName" class="sidebar-inline-input"
                               placeholder="${Localization.t('arc.cat_form.placeholder_name')}"
                               onkeydown="ArcBoardEventHandlers.handleCategoryFormKeydown(event)">
                    </div>
                    <div class="sidebar-inline-form-group">
                        <label>${Localization.t('arc.form.label_color')}</label>
                        <div class="sidebar-inline-color-row">
                            <input type="color" id="inlineCategoryColor" value="#6c757d" class="sidebar-inline-color">
                        </div>
                    </div>
                    <div class="sidebar-inline-form-actions">
                        <button class="btn-secondary btn-sm" onclick="ArcBoardViewModel.hideCategoryForm()">${Localization.t('btn.cancel')}</button>
                        <button class="btn-primary btn-sm" onclick="ArcBoardEventHandlers.confirmCategoryForm()">
                            <i data-lucide="plus"></i> ${Localization.t('btn.create')}
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    // ==========================================
    // CANVAS
    // ==========================================

    /**
     * Rendu du canvas principal
     */
    renderCanvas(arc) {
        const view = document.getElementById('editorView');
        if (!view) return;

        view.innerHTML = `
            <div class="arc-board-container">
                ${this._renderToolbar()}

                <div class="arc-board-main">
                    ${this._renderMultiArcBar(arc)}

                    <div class="arc-board-body">
                        <!-- Zone Non attribué en sidebar -->
                        <div id="arcUnassignedSidebar"></div>

                        <div class="arc-board-canvas-wrapper">
                    <div class="arc-board-canvas" id="arcBoardCanvas"
                         onmousedown="ArcBoardEventHandlers.onCanvasMouseDown(event)"
                         onmousemove="ArcBoardEventHandlers.onCanvasMouseMove(event)"
                         onmouseup="ArcBoardEventHandlers.onCanvasMouseUp(event)"
                         onwheel="ArcBoardEventHandlers.onCanvasWheel(event)"
                         oncontextmenu="ArcBoardEventHandlers.onCanvasContextMenu(event)"
                         ondrop="DragDropService.handleCanvasDrop(event)"
                         ondragover="DragDropService.handleCanvasDragOver(event)"
                         ondragleave="DragDropService.handleCanvasDragLeave(event)">

                        <div class="arc-board-content" id="arcBoardContent"
                             style="transform: scale(${ArcBoardState.zoom}) translate(${ArcBoardState.panX}px, ${ArcBoardState.panY}px)">

                            <div class="arc-connections-layer" id="arcConnectionsLayer">
                                <svg id="arcConnectionsSvg">
                                    <defs>
                                        <marker id="arrowhead" markerWidth="10" markerHeight="7"
                                                refX="9" refY="3.5" orient="auto">
                                            <path d="M0,0 L10,3.5 L0,7 Z" class="arc-connection-arrow"/>
                                        </marker>
                                        <marker id="arrowhead-selected" markerWidth="10" markerHeight="7"
                                                refX="9" refY="3.5" orient="auto">
                                            <path d="M0,0 L10,3.5 L0,7 Z" fill="var(--primary-color)"/>
                                        </marker>
                                        <marker id="arrowhead-interarc" markerWidth="10" markerHeight="7"
                                                refX="9" refY="3.5" orient="auto">
                                            <path d="M0,0 L10,3.5 L0,7 Z" fill="var(--primary-color)"/>
                                        </marker>
                                    </defs>
                                </svg>
                            </div>

                            <div id="arcBoardItems"></div>
                        </div>

                        <div class="arc-connection-mode-hint" id="connectionModeHint" style="display:none">
                            <i data-lucide="git-branch"></i>
                            <span id="connectionHintText">${Localization.t('arc.canvas.connection_hint')}</span>
                            <button onclick="ConnectionService.cancel()"><i data-lucide="x"></i> ${Localization.t('btn.cancel')}</button>
                        </div>

                        ${arc.board.items.length === 0 ? this._renderEmptyState() : ''}
                    </div>

                    ${this._renderZoomControls()}
                        </div>

                        ${this._renderContextPanel(arc)}
                    </div>
                </div>
            </div>

            <input type="file" id="arcFileInput" style="display:none" accept="image/*"
                   onchange="ArcBoardEventHandlers.onFileUpload(event)">
        `;

        if (typeof lucide !== 'undefined') lucide.createIcons();
    },

    _renderToolbar() {
        // Génère un bouton draggable pour les items de création
        const draggableBtn = (type, tooltip, icon) => `
            <button class="arc-toolbar-btn arc-toolbar-draggable"
                    data-tooltip="${tooltip}"
                    data-item-type="${type}"
                    draggable="true"
                    onclick="ArcBoardViewModel.addItem('${type}')"
                    ondragstart="DragDropService.startToolbarDrag(event, '${type}')"
                    ondragend="DragDropService.endDrag(event)">
                <i data-lucide="${icon}"></i>
            </button>
        `;

        return `
            <div class="arc-board-toolbar">
                <button class="arc-toolbar-btn ${ArcBoardState.activeTool === 'select' ? 'active' : ''}"
                        data-tool="select" data-tooltip="${Localization.t('arc.toolbar.select')}" onclick="ArcBoardViewModel.setTool('select')">
                    <i data-lucide="mouse-pointer-2"></i>
                </button>
                <button class="arc-toolbar-btn ${ArcBoardState.activeTool === 'pan' ? 'active' : ''}"
                        data-tool="pan" data-tooltip="${Localization.t('arc.toolbar.pan')}" onclick="ArcBoardViewModel.setTool('pan')">
                    <i data-lucide="hand"></i>
                </button>

                <div class="arc-toolbar-separator"></div>

                ${draggableBtn('note', Localization.t('arc.toolbar.note'), 'file-text')}
                ${draggableBtn('column', Localization.t('arc.toolbar.column'), 'columns-3')}
                ${draggableBtn('link', Localization.t('arc.toolbar.link'), 'link')}
                ${draggableBtn('todo', Localization.t('arc.toolbar.todo'), 'check-square')}
                ${draggableBtn('comment', Localization.t('arc.toolbar.comment'), 'message-square')}
                ${draggableBtn('table', Localization.t('arc.toolbar.table'), 'table')}

                <div class="arc-toolbar-separator"></div>

                ${draggableBtn('image', Localization.t('arc.toolbar.image'), 'image')}
                <button class="arc-toolbar-btn" data-tooltip="${Localization.t('arc.toolbar.upload')}" onclick="document.getElementById('arcFileInput').click()">
                    <i data-lucide="upload"></i>
                </button>

                <div class="arc-toolbar-separator"></div>

                <button class="arc-toolbar-btn ${ArcBoardState.activeTool === 'connect' ? 'active' : ''}"
                        data-tool="connect" data-tooltip="${Localization.t('arc.toolbar.connect')}" onclick="ConnectionService.toggle()">
                    <i data-lucide="git-branch"></i>
                </button>

                <div style="flex:1"></div>

                <button class="arc-toolbar-btn" data-tooltip="${Localization.t('arc.toolbar.delete')}" onclick="ArcBoardViewModel.deleteSelected()">
                    <i data-lucide="trash-2"></i>
                </button>
            </div>
        `;
    },

    _renderZoomControls() {
        return `
            <div class="arc-zoom-controls">
                <button class="arc-zoom-btn" onclick="ArcBoardViewModel.zoom(-1)" title="${Localization.t('arc.zoom.out')}">
                    <i data-lucide="zoom-out"></i>
                </button>
                <span class="arc-zoom-level" id="arcZoomLevel">${Math.round(ArcBoardState.zoom * 100)}%</span>
                <button class="arc-zoom-btn" onclick="ArcBoardViewModel.zoom(1)" title="${Localization.t('arc.zoom.in')}">
                    <i data-lucide="zoom-in"></i>
                </button>
                <button class="arc-zoom-btn" onclick="ArcBoardViewModel.resetView()" title="${Localization.t('arc.zoom.reset')}">
                    <i data-lucide="maximize-2"></i>
                </button>
            </div>
        `;
    },

    _renderEmptyState() {
        return `
            <div class="arc-board-empty">
                <div class="arc-board-empty-icon"><i data-lucide="layout-dashboard"></i></div>
                <div class="arc-board-empty-title">${Localization.t('arc.empty.title')}</div>
                <div class="arc-board-empty-text">
                    ${Localization.t('arc.empty.text')}
                </div>
            </div>
        `;
    },

    // ==========================================
    // MULTI-ARCS
    // ==========================================

    /**
     * Rendu de la barre multi-arcs (version compacte sur une ligne)
     */
    _renderMultiArcBar(arc) {
        const mode = ArcBoardState.multiArcMode;
        const allArcs = ArcRepository.getAll();
        const availableArcs = ArcBoardViewModel.getAvailableArcsForAdd();
        const interArcConnections = InterArcConnectionRepository.getAll();

        // Tags des arcs en comparaison
        const compareTagsHtml = ArcBoardState.compareArcs.map(arcId => {
            const compareArc = ArcRepository.getById(arcId);
            if (!compareArc) return '';
            const isMain = arcId === arc.id;
            return `<span class="arc-compare-tag ${isMain ? 'main' : ''}" style="--tag-color: ${compareArc.color}">
                <span class="arc-compare-tag-dot" style="background:${compareArc.color}"></span>
                ${compareArc.title}
                ${!isMain && ArcBoardState.compareArcs.length > 1 ? `<button onclick="ArcBoardViewModel.removeCompareArc('${arcId}')"><i data-lucide="x"></i></button>` : ''}
            </span>`;
        }).join('');

        // Liste des connexions inter-arcs
        const interArcHtml = interArcConnections.length > 0 ? `
            <div class="arc-interarc-tags">
                ${interArcConnections.map(conn => {
            const fromArc = ArcRepository.getById(conn.fromArcId);
            const toArc = ArcRepository.getById(conn.toArcId);
            return `<span class="arc-interarc-tag" title="${Localization.t('arc.interarc.tooltip', [fromArc?.title || '?', toArc?.title || '?'])}">
                        <span class="arc-interarc-tag-dot" style="background:${fromArc?.color || '#999'}"></span>
                        <span class="arc-interarc-tag-name">${fromArc?.title || '?'}</span>
                        <i data-lucide="arrow-right"></i>
                        <span class="arc-interarc-tag-dot" style="background:${toArc?.color || '#999'}"></span>
                        <span class="arc-interarc-tag-name">${toArc?.title || '?'}</span>
                        <button onclick="InterArcConnectionRepository.delete('${conn.id}'); ArcBoardViewModel.render()"><i data-lucide="x"></i></button>
                    </span>`;
        }).join('')}
            </div>
        ` : '';

        return `
            <div class="arc-multi-bar">
                <div class="arc-multi-left">
                    <select class="arc-multi-select" onchange="ArcBoardViewModel.openArc(this.value)">
                        ${allArcs.map(a => `<option value="${a.id}" ${a.id === arc.id ? 'selected' : ''}>${a.title}</option>`).join('')}
                    </select>
                </div>

                <div class="arc-multi-modes">
                    <button class="${mode === MultiArcModes.SOLO ? 'active' : ''}" onclick="ArcBoardViewModel.setMultiArcMode('solo')">${Localization.t('arc.multi.solo')}</button>
                    <button class="${mode === MultiArcModes.COMPARE ? 'active' : ''}" onclick="ArcBoardViewModel.setMultiArcMode('compare')">${Localization.t('arc.multi.compare')}</button>
                </div>

                ${mode === MultiArcModes.COMPARE ? `
                    <div class="arc-compare-controls">
                        ${compareTagsHtml}
                        ${availableArcs.length > 0 ? `
                            <select class="arc-compare-add" onchange="if(this.value) { ArcBoardViewModel.addCompareArc(this.value); this.value=''; }">
                                <option value="">${Localization.t('arc.multi.add_prompt')}</option>
                                ${availableArcs.map(a => `<option value="${a.id}">${a.title}</option>`).join('')}
                            </select>
                        ` : ''}
                        <button class="arc-compare-link-btn" onclick="InterArcConnectionService.startConnection()" title="${Localization.t('arc.multi.link_btn')}">
                            <i data-lucide="link"></i>
                        </button>
                        ${interArcHtml}
                    </div>
                ` : ''}
            </div>
        `;
    },

    /**
     * Helper pour calculer le point de connexion
     */
    _getConnectionPoint(item, side) {
        const width = item.width || 280;
        const height = 200; // Estimation

        switch (side) {
            case 'top': return { x: item.x + width / 2, y: item.y };
            case 'bottom': return { x: item.x + width / 2, y: item.y + height };
            case 'left': return { x: item.x, y: item.y + height / 2 };
            case 'right': return { x: item.x + width, y: item.y + height / 2 };
            default: return { x: item.x + width, y: item.y + height / 2 };
        }
    },

    /**
     * Helper pour créer le path SVG d'une connexion
     */
    _createConnectionPath(from, to) {
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const cx = Math.max(40, dist * 0.4);

        return `M ${from.x} ${from.y} C ${from.x + cx} ${from.y}, ${to.x - cx} ${to.y}, ${to.x} ${to.y}`;
    },

    _renderContextPanel(arc) {
        return `
            <div class="arc-board-context-panel ${ArcBoardState.contextPanelOpen ? '' : 'collapsed'}" id="arcContextPanel">
                <div class="arc-context-header">
                    <div class="arc-context-title">
                        <i data-lucide="sliders-horizontal"></i>
                        <span>${Localization.t('arc.context.properties')}</span>
                    </div>
                    <button class="arc-context-close" onclick="ArcBoardViewModel.toggleContextPanel()">
                        <i data-lucide="x"></i>
                    </button>
                </div>
                <div class="arc-context-body" id="arcContextBody">
                    ${this._renderContextPanelDefault(arc)}
                </div>
            </div>
        `;
    },

    _renderContextPanelDefault(arc) {
        const allCategories = ArcRepository.getAllCategories();
        const catData = allCategories[arc.category] || { label: Localization.t('arc.category.uncategorized'), color: '#999' };

        return `
            <div class="arc-context-section">
                <div class="arc-context-section-title">${Localization.t('arc.context.current')}</div>
                <div style="margin-bottom:12px">
                    <input type="text" class="form-input" value="${arc.title}"
                           onchange="ArcBoardEventHandlers.updateArcTitle(this.value)"
                           style="font-weight:600">
                </div>
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
                    <span style="width:12px;height:12px;border-radius:50%;background:${arc.color}"></span>
                    <span style="font-size:13px;color:var(--text-secondary)">${catData.label}</span>
                </div>
            </div>

            <div class="arc-context-section">
                <div class="arc-context-section-title">${Localization.t('arc.context.add_to_board')}</div>
                <div class="arc-context-tools">
                    <div class="arc-context-tool" onclick="ArcBoardViewModel.addItem('column')">
                        <i data-lucide="columns-3"></i><span>${Localization.t('arc.context.column')}</span>
                    </div>
                    <div class="arc-context-tool" onclick="ArcBoardViewModel.addItem('note')">
                        <i data-lucide="file-text"></i><span>${Localization.t('arc.context.note')}</span>
                    </div>
                    <div class="arc-context-tool" onclick="ArcBoardViewModel.addItem('image')">
                        <i data-lucide="image"></i><span>${Localization.t('arc.context.image')}</span>
                    </div>
                    <div class="arc-context-tool" onclick="ArcBoardViewModel.addItem('todo')">
                        <i data-lucide="check-square"></i><span>${Localization.t('arc.context.todo')}</span>
                    </div>
                </div>
            </div>

            <div class="arc-context-section">
                <div class="arc-context-section-title">${Localization.t('arc.context.stats')}</div>
                <div style="font-size:13px;color:var(--text-secondary)">
                    <div style="margin-bottom:4px">${Localization.t('arc.context.items_count', [arc.board.items.length, arc.board.items.length > 1 ? 's' : ''])}</div>
                    <div>${Localization.t('arc.context.conn_count', [arc.board.connections?.length || 0, (arc.board.connections?.length || 0) > 1 ? 's' : ''])}</div>
                </div>
            </div>
        `;
    },

    renderContextPanelDefault(arc) {
        const body = document.getElementById('arcContextBody');
        if (body) {
            body.innerHTML = this._renderContextPanelDefault(arc);
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }
    },

    renderContextPanel(item) {
        const body = document.getElementById('arcContextBody');
        if (!body) return;

        body.innerHTML = this._getContextPanelForItem(item);
        if (typeof lucide !== 'undefined') lucide.createIcons();
    },

    _getContextPanelForItem(item) {
        switch (item.type) {
            case 'column':
                return `
                    <div class="arc-context-section">
                        <div class="arc-context-section-title">${Localization.t('arc.context.column')}</div>
                        <div class="form-group">
                            <label style="font-size:12px">${Localization.t('arc.form.label_title')}</label>
                            <input type="text" class="form-input" value="${item.title || ''}"
                                   onchange="ArcBoardViewModel.updateItem('${item.id}', { title: this.value })">
                        </div>
                        <div class="form-group">
                            <label style="font-size:12px">${Localization.t('arc.context.col_width')}</label>
                            <input type="number" class="form-input" value="${item.width || ArcBoardConfig.column.defaultWidth}"
                                   min="${ArcBoardConfig.column.minWidth}" max="${ArcBoardConfig.column.maxWidth}"
                                   onchange="ArcBoardViewModel.updateItem('${item.id}', { width: parseInt(this.value) }); ArcBoardViewModel.renderItems();">
                        </div>
                    </div>
                    <div class="arc-context-section">
                        <button class="arc-context-delete" onclick="ArcBoardViewModel.deleteSelected()">
                            <i data-lucide="trash-2"></i> ${Localization.t('btn.delete')}
                        </button>
                    </div>
                `;
            default:
                return `
                    <div class="arc-context-section">
                        <div class="arc-context-section-title">${Localization.t('arc.context.element')}</div>
                        <p style="font-size:13px;color:var(--text-secondary)">${Localization.t('arc.context.type', [item.type])}</p>
                    </div>
                    <div class="arc-context-section">
                        <button class="arc-context-delete" onclick="ArcBoardViewModel.deleteSelected()">
                            <i data-lucide="trash-2"></i> ${Localization.t('btn.delete')}
                        </button>
                    </div>
                `;
        }
    },

    // ==========================================
    // ITEMS
    // ==========================================

    /**
     * Rendu de tous les items du board
     */
    renderItems(arc) {
        const itemsContainer = document.getElementById('arcBoardItems');
        const sidebarContainer = document.getElementById('arcUnassignedSidebar');
        if (!itemsContainer || !arc.board) return;

        // MODE COMPARE : afficher plusieurs arcs empilés verticalement
        if (ArcBoardState.multiArcMode === MultiArcModes.COMPARE && ArcBoardState.compareArcs.length > 0) {
            this._renderCompareItems(itemsContainer, sidebarContainer);
            return;
        }

        // MODE SOLO : affichage normal
        this._renderSoloItems(arc, itemsContainer, sidebarContainer);
    },

    /**
     * Rendu mode Solo (un seul arc)
     */
    _renderSoloItems(arc, itemsContainer, sidebarContainer) {
        // Construire la liste des scènes non attribuées depuis scenePresence
        const unassignedScenes = this._getUnassignedScenes(arc);

        // Filtrer les items réguliers
        const regularItems = arc.board.items.filter(item => item.type !== 'scene');

        // Rendre la zone "Non attribué" dans la sidebar
        if (sidebarContainer) {
            sidebarContainer.innerHTML = this._renderUnassignedZone(unassignedScenes);
        }

        // Rendre les items normaux dans le canvas
        itemsContainer.innerHTML = regularItems.map(item => this._renderItem(item)).join('');

        if (typeof lucide !== 'undefined') lucide.createIcons();

        // Masquer l'empty state si items présents
        const emptyState = document.querySelector('.arc-board-empty');
        if (emptyState) {
            emptyState.style.display = arc.board.items.length > 0 ? 'none' : 'block';
        }
    },

    /**
     * Rendu mode Compare (plusieurs arcs empilés)
     */
    _renderCompareItems(itemsContainer, sidebarContainer) {
        const HEADER_HEIGHT = 40; // Hauteur de l'en-tête d'arc
        const MIN_ARC_HEIGHT = 100; // Hauteur minimale d'un arc
        let html = '';
        let currentY = 0;

        // Stocker les offsets par arc pour le rendu des connexions
        this._compareArcOffsets = {};

        // Pour chaque arc à comparer
        ArcBoardState.compareArcs.forEach((arcId, index) => {
            const compareArc = ArcRepository.getById(arcId);
            if (!compareArc) return;

            // Utiliser la hauteur personnalisée ou calculer automatiquement
            const contentHeight = this._getArcContentHeight(compareArc);
            const storedHeight = ArcBoardState.compareArcHeights[arcId];
            const sectionHeight = storedHeight !== undefined
                ? Math.max(MIN_ARC_HEIGHT, storedHeight)
                : Math.max(MIN_ARC_HEIGHT, contentHeight + HEADER_HEIGHT);

            // Stocker l'offset pour cet arc
            this._compareArcOffsets[arcId] = { x: 0, y: currentY + HEADER_HEIGHT };

            // Section complète de l'arc (conteneur redimensionnable)
            // Récupérer l'opacité sauvegardée ou 100% par défaut
            const savedOpacity = ArcBoardState.compareArcOpacities?.[arcId] ?? 100;
            html += `
                <div class="arc-compare-section" data-arc-id="${arcId}"
                     style="top:${currentY}px; height:${sectionHeight}px; z-index:${100 - index}; --arc-color:${compareArc.color}; --arc-opacity:${savedOpacity / 100}">
                    <div class="arc-compare-header" style="--arc-color:${compareArc.color}">
                        <span class="arc-compare-header-dot" style="background:${compareArc.color}"></span>
                        <span class="arc-compare-header-title">${compareArc.title}</span>
                        <div class="arc-compare-opacity-control">
                            <i data-lucide="eye" class="arc-compare-opacity-icon"></i>
                            <input type="range" class="arc-compare-opacity-slider"
                                   min="0" max="100" value="${savedOpacity}"
                                   oninput="ArcBoardViewModel.setArcOpacity('${arcId}', this.value)"
                                   title="Transparence (${savedOpacity}%)">
                            <span class="arc-compare-opacity-value">${savedOpacity}%</span>
                        </div>
                        <span class="arc-compare-header-count">${compareArc.board.items.filter(i => i.type === 'column').length} colonnes</span>
                    </div>
                    <div class="arc-compare-content" style="position:relative; top:${HEADER_HEIGHT}px; height:calc(100% - ${HEADER_HEIGHT}px);">
            `;

            // Items de cet arc - offset Y est juste pour le header, pas pour la position globale
            // car les items sont maintenant à l'intérieur de arc-compare-content
            compareArc.board.items.filter(item => item.type !== 'scene').forEach(item => {
                html += this._renderItem(item, arcId, 0, 0);
            });

            html += `
                    </div>
            `;

            // Poignée de redimensionnement en bas de la section
            html += `
                    <div class="arc-compare-resize-handle"
                         onmousedown="CompareResizeService.start(event, '${arcId}')"
                         title="Glisser pour redimensionner"></div>
                </div>
            `;

            currentY += sectionHeight;
        });

        itemsContainer.innerHTML = html;

        // Sidebar : scènes non attribuées du premier arc
        if (sidebarContainer && ArcBoardState.compareArcs.length > 0) {
            const mainArc = ArcRepository.getById(ArcBoardState.compareArcs[0]);
            if (mainArc) {
                const unassignedScenes = this._getUnassignedScenes(mainArc);
                sidebarContainer.innerHTML = this._renderUnassignedZone(unassignedScenes);
            }
        }

        if (typeof lucide !== 'undefined') lucide.createIcons();

        // Masquer l'empty state
        const emptyState = document.querySelector('.arc-board-empty');
        if (emptyState) emptyState.style.display = 'none';

        // Rendre les connexions après le DOM mis à jour
        requestAnimationFrame(() => {
            this._renderCompareConnections();
        });
    },

    /**
     * Calcule la hauteur du contenu d'un arc (basée sur les éléments réels)
     */
    _getArcContentHeight(arc) {
        let maxBottom = 0;

        arc.board.items.forEach(item => {
            const itemY = item.y || 0;
            let itemHeight = 100; // Hauteur par défaut

            if (item.type === 'column') {
                // Calculer la hauteur réelle de la colonne basée sur les cartes
                const cardCount = (item.cards || []).length;
                const headerHeight = 45;
                const cardHeight = 80; // Hauteur moyenne d'une carte
                const addBtnHeight = 35;
                const padding = 20;
                itemHeight = headerHeight + (cardCount * cardHeight) + addBtnHeight + padding;
                itemHeight = Math.max(itemHeight, 150); // Minimum 150px
            } else if (item.type === 'note' || item.type === 'comment') {
                itemHeight = 80;
            } else if (item.type === 'image') {
                itemHeight = item.height || 150;
            } else if (item.type === 'todo') {
                const todoCount = (item.items || []).length;
                itemHeight = 80 + (todoCount * 30);
            } else if (item.type === 'table') {
                const rows = item.rows || 3;
                itemHeight = 50 + (rows * 35);
            }

            const bottom = itemY + itemHeight;
            if (bottom > maxBottom) maxBottom = bottom;
        });

        return Math.max(maxBottom, 100); // Minimum 100px
    },

    /**
     * Rend les connexions en mode Compare (internes + inter-arcs)
     */
    _renderCompareConnections() {
        const svg = document.getElementById('arcConnectionsSvg');
        const content = document.getElementById('arcBoardContent');
        if (!svg || !content) return;

        const defs = svg.querySelector('defs');
        svg.innerHTML = '';
        if (defs) svg.appendChild(defs);

        const contentRect = content.getBoundingClientRect();

        // Helper pour obtenir la position relative au canvas
        const getRelativePosition = (element, side) => {
            const rect = element.getBoundingClientRect();
            const x = (rect.left - contentRect.left) / ArcBoardState.zoom;
            const y = (rect.top - contentRect.top) / ArcBoardState.zoom;
            const w = rect.width / ArcBoardState.zoom;
            const h = rect.height / ArcBoardState.zoom;

            switch (side) {
                case 'top': return { x: x + w / 2, y: y };
                case 'bottom': return { x: x + w / 2, y: y + h };
                case 'left': return { x: x, y: y + h / 2 };
                case 'right': return { x: x + w, y: y + h / 2 };
                default: return { x: x + w / 2, y: y + h / 2 };
            }
        };

        // 1. Connexions internes de chaque arc
        ArcBoardState.compareArcs.forEach(arcId => {
            const arc = ArcRepository.getById(arcId);
            if (!arc?.board?.connections) return;

            arc.board.connections.forEach(conn => {
                const fromEl = document.getElementById(`item-${conn.from}`);
                const toEl = document.getElementById(`item-${conn.to}`);

                if (!fromEl || !toEl) return;

                const fromPos = this._getElementPosition(fromEl, conn.fromSide);
                const toPos = this._getElementPosition(toEl, conn.toSide);

                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                const { path: d, cp1, cp2 } = this._createBezierPath(fromPos, toPos, conn.fromSide, conn.toSide);

                path.setAttribute('d', d);
                const isSelected = ArcBoardState.selectedItems.includes(conn.id);
                path.setAttribute('class', `arc-connection-line ${isSelected ? 'selected' : ''}`);
                path.setAttribute('data-connection-id', conn.id);
                path.setAttribute('data-arc-id', arcId);
                path.setAttribute('marker-end', isSelected ? 'url(#arrowhead-selected)' : 'url(#arrowhead)');
                path.style.stroke = arc.color;
                path.onclick = (e) => {
                    e.stopPropagation();
                    ArcBoardViewModel.selectItem(conn.id, e.ctrlKey || e.metaKey, arcId);
                };

                svg.appendChild(path);

                // Ajouter un bouton de suppression au milieu de la ligne
                const mid = this._getBezierPoint(fromPos, cp1, cp2, toPos, 0.5);
                const deleteBtn = this._createConnectionDeleteBtn(conn.id, mid, arcId);
                svg.appendChild(deleteBtn);
            });
        });

        // 2. Connexions inter-arcs
        const interArcConnections = InterArcConnectionRepository?.getAll?.() || [];
        interArcConnections.forEach(conn => {
            // Trouver les éléments dans les arcs comparés
            if (!ArcBoardState.compareArcs.includes(conn.fromArcId) ||
                !ArcBoardState.compareArcs.includes(conn.toArcId)) return;

            // Chercher par data-item-id (colonnes, notes, etc.) OU data-card-id (cartes)
            const fromEl = document.querySelector(`[data-arc-id="${conn.fromArcId}"][data-item-id="${conn.fromItemId}"]`)
                || document.querySelector(`[data-arc-id="${conn.fromArcId}"][data-card-id="${conn.fromItemId}"]`);
            const toEl = document.querySelector(`[data-arc-id="${conn.toArcId}"][data-item-id="${conn.toItemId}"]`)
                || document.querySelector(`[data-arc-id="${conn.toArcId}"][data-card-id="${conn.toItemId}"]`);

            if (!fromEl || !toEl) return;

            const fromPos = this._getElementPosition(fromEl, 'right');
            const toPos = this._getElementPosition(toEl, 'left');

            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            const { path: d, cp1, cp2 } = this._createBezierPath(fromPos, toPos, 'right', 'left');

            path.setAttribute('d', d);
            const isSelected = ArcBoardState.selectedItems.includes(conn.id);
            path.setAttribute('class', `arc-connection-line arc-interarc-connection ${isSelected ? 'selected' : ''}`);
            path.setAttribute('data-interarc-id', conn.id);
            path.setAttribute('marker-end', isSelected ? 'url(#arrowhead-selected)' : 'url(#arrowhead-interarc)');
            path.onclick = (e) => {
                e.stopPropagation();
                ArcBoardViewModel.selectItem(conn.id, e.ctrlKey || e.metaKey);
            };

            svg.appendChild(path);

            // Bouton delete pour inter-arc
            const mid = this._getBezierPoint(fromPos, cp1, cp2, toPos, 0.5);
            const deleteBtn = this._createConnectionDeleteBtn(conn.id, mid, null, true);
            svg.appendChild(deleteBtn);
        });
    },

    /**
     * Récupère les scènes non attribuées d'un arc
     */
    _getUnassignedScenes(arc) {
        const unassignedScenes = [];
        if (arc.scenePresence) {
            arc.scenePresence
                .filter(p => !p.columnId || p.columnId === null)
                .forEach(presence => {
                    let sceneTitle = 'Scène sans titre';
                    let breadcrumb = '';

                    for (const act of project.acts) {
                        for (const chapter of act.chapters) {
                            const scene = chapter.scenes.find(s => s.id == presence.sceneId);
                            if (scene) {
                                sceneTitle = scene.title || Localization.t('arc.unassigned.scene_no_title');
                                breadcrumb = `${act.title || Localization.t('arc.unassigned.act_label')} › ${chapter.title || Localization.t('arc.unassigned.chapter_label')}`;
                                break;
                            }
                        }
                    }

                    unassignedScenes.push({
                        id: 'unassigned_' + presence.sceneId,
                        type: 'scene',
                        sceneId: presence.sceneId,
                        sceneTitle,
                        breadcrumb,
                        intensity: presence.intensity || 3,
                        status: presence.status || 'development',
                        notes: presence.notes || ''
                    });
                });
        }
        return unassignedScenes;
    },

    _renderUnassignedZone(floatingScenes) {
        const cardsHtml = floatingScenes.map(scene => this._renderSceneCard(scene)).join('');

        return `
            <div class="arc-unassigned-zone" id="arc-unassigned-zone">
                <div class="arc-unassigned-header">
                    <div class="arc-unassigned-title">
                        <i data-lucide="inbox"></i>
                        <span>${Localization.t('arc.unassigned.label')}</span>
                    </div>
                    <span class="arc-unassigned-count">${floatingScenes.length}</span>
                </div>
                <div class="arc-unassigned-body"
                     ondrop="DragDropService.handleUnassignedDrop(event)"
                     ondragover="DragDropService.handleColumnDragOver(event)"
                     ondragleave="DragDropService.handleColumnDragLeave(event)">
                    ${cardsHtml}
                    ${floatingScenes.length === 0 ? `
                        <div class="arc-unassigned-empty">
                            <i data-lucide="check-circle" style="width:24px;height:24px;opacity:0.3;"></i>
                            <span>${Localization.t('arc.unassigned.empty')}</span>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    },

    _renderSceneCard(scene, isUnassigned = true) {
        const statusLabels = {
            'setup': Localization.t('arc.status.setup'),
            'development': Localization.t('arc.status.development'),
            'climax': Localization.t('arc.status.climax'),
            'resolution': Localization.t('arc.status.resolution')
        };

        const dragHandle = `
            <div class="arc-card-drag-handle"
                 draggable="true"
                 ondragstart="DragDropService.startUnassignedDrag(event, '${scene.sceneId}')"
                 ondragend="DragDropService.endDrag(event)"
                 onmousedown="event.stopPropagation()"
                 title="Glisser pour déplacer">
                <i data-lucide="grip-vertical"></i>
            </div>
        `;

        const deleteBtn = `
            <button class="arc-card-delete" onclick="event.stopPropagation(); deleteArcItem('${scene.id}')" title="${Localization.t('btn.delete')}">
                <i data-lucide="x"></i>
            </button>
        `;

        return `
            <div class="arc-card arc-card-scene" data-card-id="${scene.id}" data-scene-id="${scene.sceneId || ''}">
                ${dragHandle}${deleteBtn}
                <div class="arc-card-scene-header">
                    <i data-lucide="book-open"></i>
                    <div class="arc-card-scene-title-wrapper">
                        <div class="arc-card-scene-breadcrumb">${scene.breadcrumb || ''}</div>
                        <div class="arc-card-scene-title">${scene.sceneTitle || 'Scène'}</div>
                    </div>
                </div>
                <div class="arc-card-scene-meta">
                    <div class="arc-card-scene-status">
                        <span class="arc-card-scene-label">${Localization.t('arc.card.status')}</span>
                        <span class="arc-card-scene-value">${statusLabels[scene.status] || Localization.t('arc.status.development')}</span>
                    </div>
                </div>
                <button class="arc-card-scene-open" onclick="ArcBoardEventHandlers.openScene('${scene.sceneId}'); event.stopPropagation();">
                    <i data-lucide="external-link"></i> ${Localization.t('arc.card.open')}
                </button>
            </div>
        `;
    },

    _renderItem(item, arcId = null, offsetX = 0, offsetY = 0) {
        const isSelected = ArcBoardState.selectedItems.includes(item.id);
        const isCompareMode = ArcBoardState.multiArcMode === MultiArcModes.COMPARE;

        switch (item.type) {
            case 'column': return this._renderColumn(item, isSelected, arcId, offsetX, offsetY);
            case 'note': return this._renderNote(item, isSelected, arcId, offsetX, offsetY);
            case 'image': return this._renderImage(item, isSelected, arcId, offsetX, offsetY);
            case 'link': return this._renderLink(item, isSelected, arcId, offsetX, offsetY);
            case 'todo': return this._renderTodo(item, isSelected, arcId, offsetX, offsetY);
            case 'comment': return this._renderComment(item, isSelected, arcId, offsetX, offsetY);
            case 'table': return this._renderTable(item, isSelected, arcId, offsetX, offsetY);
            case 'scene': return this._renderSceneItem(item, isSelected, arcId, offsetX, offsetY);
            default: return '';
        }
    },

    _renderDragHandle(itemId, isFloating = false, arcId = null) {
        const className = isFloating ? 'arc-floating-drag-handle' : 'arc-card-drag-handle';
        const arcParam = arcId ? `, '${arcId}'` : '';

        if (isFloating) {
            // Pour les éléments flottants: deux poignées
            // 1. Poignée de repositionnement (ItemMoveService)
            // 2. Poignée de drop dans colonne (DragDropService)
            return `
                <div class="${className}">
                    <div class="arc-drag-move"
                         onmousedown="ItemMoveService.start(event, '${itemId}'${arcParam}); event.stopPropagation();"
                         title="${Localization.t('arc.drag.canvas')}">
                        <i data-lucide="grip-vertical"></i>
                    </div>
                    <div class="arc-drag-to-column"
                         draggable="true"
                         ondragstart="DragDropService.startFloatingDrag(event, '${itemId}'${arcParam})"
                         ondragend="DragDropService.endDrag(event)"
                         onmousedown="event.stopPropagation()"
                         title="${Localization.t('arc.drag.column')}">
                        <i data-lucide="columns-3"></i>
                    </div>
                </div>
            `;
        } else {
            // Pour les cartes: utiliser DragDropService pour le drag & drop entre colonnes
            return `
                <div class="${className}"
                     draggable="true"
                     ondragstart="DragDropService.startCardDrag(event, '${itemId}', this.closest('.arc-column').dataset.itemId${arcParam})"
                     ondragend="DragDropService.endDrag(event)"
                     onmousedown="event.stopPropagation()"
                     title="${Localization.t('arc.drag.move')}">
                    <i data-lucide="grip-vertical"></i>
                </div>
            `;
        }
    },

    _renderColumn(item, isSelected, arcId = null, offsetX = 0, offsetY = 0) {
        const cardsHtml = (item.cards || []).map(card => this._renderCard(card, item.id, arcId)).join('');
        const isCompareMode = arcId !== null;
        const arc = isCompareMode ? ArcRepository.getById(arcId) : null;
        const borderColor = arc ? arc.color : 'var(--border-color)';

        // En mode compare, on permet l'interaction mais on garde aussi la possibilité de créer des liens inter-arcs
        const clickHandler = isCompareMode
            ? `ArcBoardViewModel.selectItem('${item.id}', event.ctrlKey || event.metaKey, '${arcId}'); if(InterArcConnectionService.connecting) InterArcConnectionService.handleClick('${arcId}', '${item.id}')`
            : `ArcBoardViewModel.selectItem('${item.id}', event.ctrlKey || event.metaKey)`;

        return `
            <div class="arc-column ${isSelected ? 'selected' : ''} ${isCompareMode ? 'arc-column-compare' : ''}"
                 id="item-${item.id}"
                 data-item-id="${item.id}"
                 data-item-type="column"
                 ${arcId ? `data-arc-id="${arcId}"` : ''}
                 style="left: ${(item.x || 0) + offsetX}px; top: ${(item.y || 0) + offsetY}px; width: ${item.width || ArcBoardConfig.column.defaultWidth}px; ${isCompareMode ? `--column-accent: ${borderColor}` : ''}"
                 onclick="${clickHandler}">

                <div class="arc-column-header" onmousedown="ItemMoveService.start(event, '${item.id}'${isCompareMode ? `, '${arcId}'` : ''})">
                    <input type="text" class="arc-column-title" value="${item.title || ''}"
                           placeholder="${Localization.t('arc.column.placeholder')}"
                           onchange="ArcBoardViewModel.updateItem('${item.id}', { title: this.value }${isCompareMode ? `, '${arcId}'` : ''})"
                           onclick="event.stopPropagation()">
                    <span class="arc-column-meta">${(item.cards || []).length} card${(item.cards || []).length > 1 ? 's' : ''}</span>
                </div>

                <div class="arc-column-body"
                     ondrop="DragDropService.handleColumnDrop(event, '${item.id}'${isCompareMode ? `, '${arcId}'` : ''})"
                     ondragover="DragDropService.handleColumnDragOver(event)"
                     ondragleave="DragDropService.handleColumnDragLeave(event)">
                    ${cardsHtml}
                    <div class="arc-card-add" onclick="event.stopPropagation(); ArcBoardView.showCardTypeMenu(event, '${item.id}'${isCompareMode ? `, '${arcId}'` : ''})">
                        <i data-lucide="plus"></i> ${Localization.t('arc.btn.add_card')}
                    </div>
                </div>

                <div class="arc-column-resize" onmousedown="ResizeService.start(event, '${item.id}'${isCompareMode ? `, '${arcId}'` : ''})"></div>
            </div>
        `;
    },

    _renderCard(card, columnId, arcId = null) {
        const arcParam = arcId ? `, '${arcId}'` : '';
        const deleteBtn = `
            <button class="arc-card-delete" onclick="event.stopPropagation(); ArcBoardViewModel.deleteCard('${columnId}', '${card.id}'${arcParam})" title="${Localization.t('btn.delete')}">
                <i data-lucide="x"></i>
            </button>
        `;

        const dragHandle = `
            <div class="arc-card-drag-handle"
                 draggable="true"
                 ondragstart="DragDropService.startCardDrag(event, '${card.id}', '${columnId}'${arcParam})"
                 ondragend="DragDropService.endDrag(event)"
                 onmousedown="event.stopPropagation()"
                 title="Glisser pour déplacer">
                <i data-lucide="grip-vertical"></i>
            </div>
        `;

        // Handler pour les connexions (inter-arcs OU intra-arc)
        const connectionClick = arcId
            ? `if(InterArcConnectionService.connecting) { InterArcConnectionService.handleClick('${arcId}', '${card.id}'); event.stopPropagation(); }`
            : `if(ArcBoardState.activeTool === 'connect') { ConnectionService.handleClick('${card.id}'); event.stopPropagation(); }`;

        switch (card.type) {
            case 'note':
                return `
                    <div class="arc-card arc-card-note" data-card-id="${card.id}" ${arcId ? `data-arc-id="${arcId}"` : ''} onclick="${connectionClick}">
                        ${dragHandle}${deleteBtn}
                        <div class="arc-card-content" contenteditable="true"
                             onblur="ArcBoardViewModel.updateCard('${columnId}', '${card.id}', { content: this.innerHTML }${arcParam})"
                             onclick="event.stopPropagation()">${card.content || ''}</div>
                    </div>
                `;

            case 'image':
                return `
                    <div class="arc-card arc-card-image" data-card-id="${card.id}" ${arcId ? `data-arc-id="${arcId}"` : ''} onclick="${connectionClick}">
                        ${dragHandle}${deleteBtn}
                        ${card.src
                        ? `<img src="${card.src}" alt="" draggable="false">`
                        : `<div class="arc-card-upload" onclick="ArcBoardEventHandlers.triggerCardImageUpload('${columnId}', '${card.id}'${arcParam})">
                                    <i data-lucide="cloud-upload"></i>
                                    <span>${Localization.t('arc.card.add_image')}</span>
                                </div>`
                    }
                    </div>
                `;

            case 'todo':
                const todosHtml = (card.items || []).map((todo, idx) => `
                    <div class="arc-todo-item">
                        <div class="arc-todo-checkbox ${todo.completed ? 'checked' : ''}"
                             onclick="ArcBoardEventHandlers.toggleTodo('${columnId}', '${card.id}', ${idx}${arcParam})">
                            ${todo.completed ? '<i data-lucide="check"></i>' : ''}
                        </div>
                        <input type="text" class="arc-todo-text ${todo.completed ? 'completed' : ''}"
                               value="${todo.text || ''}"
                               onchange="ArcBoardEventHandlers.updateTodoText('${columnId}', '${card.id}', ${idx}, this.value${arcParam})"
                               onclick="event.stopPropagation()">
                    </div>
                `).join('');

                return `
                    <div class="arc-card arc-card-todo" data-card-id="${card.id}" ${arcId ? `data-arc-id="${arcId}"` : ''} onclick="${connectionClick}">
                        ${dragHandle}${deleteBtn}
                        <input type="text" class="arc-card-title" value="${card.title || ''}"
                               placeholder="${Localization.t('arc.card.title_placeholder')}"
                               onchange="ArcBoardViewModel.updateCard('${columnId}', '${card.id}', { title: this.value }${arcParam})"
                               onclick="event.stopPropagation()">
                        <div class="arc-todo-list">${todosHtml}</div>
                        <div class="arc-todo-add" onclick="ArcBoardEventHandlers.addTodoItem('${columnId}', '${card.id}'${arcParam}); event.stopPropagation();">
                            <i data-lucide="plus"></i> ${Localization.t('arc.btn.add_todo')}
                        </div>
                    </div>
                `;

            case 'scene':
                const statusLabels = {
                    'setup': Localization.t('arc.status.setup'),
                    'development': Localization.t('arc.status.development'),
                    'climax': Localization.t('arc.status.climax'),
                    'resolution': Localization.t('arc.status.resolution')
                };
                return `
                    <div class="arc-card arc-card-scene" data-card-id="${card.id}" data-scene-id="${card.sceneId || ''}" ${arcId ? `data-arc-id="${arcId}"` : ''} onclick="${connectionClick}">
                        ${dragHandle}${deleteBtn}
                        <div class="arc-card-scene-header">
                            <i data-lucide="book-open"></i>
                            <div class="arc-card-scene-title-wrapper">
                                <div class="arc-card-scene-breadcrumb">${card.breadcrumb || ''}</div>
                                <div class="arc-card-scene-title">${card.sceneTitle || Localization.t('arc.card.scene_label')}</div>
                            </div>
                        </div>
                        <div class="arc-card-scene-meta">
                            <div class="arc-card-scene-status">
                                <span class="arc-card-scene-label">${Localization.t('arc.card.status')}</span>
                                <span class="arc-card-scene-value">${statusLabels[card.status] || Localization.t('arc.status.development')}</span>
                            </div>
                        </div>
                        <button class="arc-card-scene-open" onclick="ArcBoardEventHandlers.openScene('${card.sceneId}'); event.stopPropagation();">
                            <i data-lucide="external-link"></i> ${Localization.t('arc.card.open')}
                        </button>
                    </div>
                `;

            case 'link':
                return `
                    <div class="arc-card arc-card-link" data-card-id="${card.id}" ${arcId ? `data-arc-id="${arcId}"` : ''} onclick="${connectionClick}">
                        ${dragHandle}${deleteBtn}
                        ${card.url ? `
                            <div class="arc-link-preview">
                                ${card.previewImage ? `<div class="arc-link-preview-image" style="background-image:url(${card.previewImage})"></div>` : ''}
                                <div class="arc-link-preview-info">
                                    <div class="arc-link-preview-title">${card.title || card.url}</div>
                                    <div class="arc-link-preview-url">${card.url}</div>
                                </div>
                            </div>
                        ` : `
                            <div class="arc-link-input">
                                <i data-lucide="link"></i>
                                <input type="text" placeholder="${Localization.t('arc.card.url_placeholder')}"
                                       onkeypress="ArcBoardEventHandlers.handleCardLinkInput(event, '${columnId}', '${card.id}'${arcParam})"
                                       onclick="event.stopPropagation()">
                            </div>
                        `}
                    </div>
                `;

            case 'comment':
                return `
                    <div class="arc-card arc-card-comment" data-card-id="${card.id}" ${arcId ? `data-arc-id="${arcId}"` : ''} onclick="${connectionClick}">
                        ${dragHandle}${deleteBtn}
                        <div class="arc-card-content" contenteditable="true"
                             onblur="ArcBoardViewModel.updateCard('${columnId}', '${card.id}', { content: this.innerHTML }${arcParam})"
                             onclick="event.stopPropagation()">${card.content || ''}</div>
                    </div>
                `;

            case 'table':
                const rows = card.rows || 3;
                const cols = card.cols || 3;
                const data = card.data || [];
                let tableHtml = '<table>';
                for (let r = 0; r < rows; r++) {
                    tableHtml += '<tr>';
                    for (let c = 0; c < cols; c++) {
                        const cellData = data[r]?.[c] || '';
                        const tag = r === 0 ? 'th' : 'td';
                        tableHtml += `<${tag} contenteditable="true"
                                       onblur="ArcBoardEventHandlers.updateCardTableCell('${columnId}', '${card.id}', ${r}, ${c}, this.textContent${arcParam})"
                                       onclick="event.stopPropagation()">${cellData}</${tag}>`;
                    }
                    // Bouton supprimer ligne (sauf header)
                    if (r > 0) {
                        tableHtml += `<td class="arc-table-action" onclick="ArcBoardEventHandlers.removeCardTableRow('${columnId}', '${card.id}', ${r}${arcParam}); event.stopPropagation();">
                            <i data-lucide="minus"></i>
                        </td>`;
                    } else {
                        tableHtml += '<th class="arc-table-action"></th>';
                    }
                    tableHtml += '</tr>';
                }
                // Ligne pour supprimer colonnes
                tableHtml += '<tr class="arc-table-actions-row">';
                for (let c = 0; c < cols; c++) {
                    if (cols > 1) {
                        tableHtml += `<td class="arc-table-action" onclick="ArcBoardEventHandlers.removeCardTableCol('${columnId}', '${card.id}', ${c}${arcParam}); event.stopPropagation();">
                            <i data-lucide="minus"></i>
                        </td>`;
                    } else {
                        tableHtml += '<td class="arc-table-action"></td>';
                    }
                }
                tableHtml += '<td class="arc-table-action"></td></tr>';
                tableHtml += '</table>';
                return `
                    <div class="arc-card arc-card-table" data-card-id="${card.id}" ${arcId ? `data-arc-id="${arcId}"` : ''}>
                        ${dragHandle}${deleteBtn}
                        ${tableHtml}
                        <div class="arc-table-controls">
                            <button class="arc-table-btn" onclick="ArcBoardEventHandlers.addCardTableRow('${columnId}', '${card.id}'${arcParam}); event.stopPropagation();" title="${Localization.t('arc.card.table_row')}">
                                <i data-lucide="plus"></i> ${Localization.t('arc.card.table_row')}
                            </button>
                            <button class="arc-table-btn" onclick="ArcBoardEventHandlers.addCardTableCol('${columnId}', '${card.id}'${arcParam}); event.stopPropagation();" title="${Localization.t('arc.card.table_col')}">
                                <i data-lucide="plus"></i> ${Localization.t('arc.card.table_col')}
                            </button>
                        </div>
                    </div>
                `;

            default:
                return `
                    <div class="arc-card arc-card-note" data-card-id="${card.id}" ${arcId ? `data-arc-id="${arcId}"` : ''}>
                        ${dragHandle}${deleteBtn}
                        <div class="arc-card-content">${card.content || ''}</div>
                    </div>
                `;
        }
    },

    _renderNote(item, isSelected, arcId = null, offsetX = 0, offsetY = 0) {
        const isCompareMode = arcId !== null;
        const arcParam = arcId ? `, '${arcId}'` : '';
        const clickHandler = isCompareMode
            ? `ArcBoardViewModel.selectItem('${item.id}', event.ctrlKey || event.metaKey, '${arcId}'); if(InterArcConnectionService.connecting) InterArcConnectionService.handleClick('${arcId}', '${item.id}')`
            : `ArcBoardViewModel.selectItem('${item.id}', event.ctrlKey || event.metaKey)`;
        return `
            <div class="arc-floating-item arc-floating-note ${isSelected ? 'selected' : ''}"
                 id="item-${item.id}"
                 data-item-id="${item.id}"
                 data-item-type="note"
                 ${arcId ? `data-arc-id="${arcId}"` : ''}
                 style="left: ${(item.x || 0) + offsetX}px; top: ${(item.y || 0) + offsetY}px; width: ${item.width || 250}px"
                 onclick="${clickHandler}">
                ${this._renderDragHandle(item.id, true, arcId)}
                <div class="arc-card-content" contenteditable="true"
                     onblur="ArcBoardViewModel.updateItem('${item.id}', { content: this.innerHTML }${arcParam})"
                     onclick="event.stopPropagation()">${item.content || ''}</div>
            </div>
        `;
    },

    _renderImage(item, isSelected, arcId = null, offsetX = 0, offsetY = 0) {
        const isCompareMode = arcId !== null;
        const arcParam = arcId ? `, '${arcId}'` : '';
        const clickHandler = isCompareMode
            ? `ArcBoardViewModel.selectItem('${item.id}', event.ctrlKey || event.metaKey, '${arcId}'); if(InterArcConnectionService.connecting) InterArcConnectionService.handleClick('${arcId}', '${item.id}')`
            : `ArcBoardViewModel.selectItem('${item.id}', event.ctrlKey || event.metaKey)`;
        return `
            <div class="arc-floating-item arc-floating-image ${isSelected ? 'selected' : ''}"
                 id="item-${item.id}"
                 data-item-id="${item.id}"
                 data-item-type="image"
                 ${arcId ? `data-arc-id="${arcId}"` : ''}
                 style="left: ${(item.x || 0) + offsetX}px; top: ${(item.y || 0) + offsetY}px"
                 onclick="${clickHandler}">
                ${this._renderDragHandle(item.id, true, arcId)}
                ${item.src
                ? `<img src="${item.src}" alt="" style="max-width: ${item.width || 300}px" draggable="false">`
                : `<div class="arc-card-upload" style="padding: 40px" onclick="ArcBoardEventHandlers.triggerItemImageUpload('${item.id}'${arcParam})">
                            <i data-lucide="cloud-upload"></i>
                            <span>Ajouter une image</span>
                        </div>`
            }
            </div>
        `;
    },

    _renderLink(item, isSelected, arcId = null, offsetX = 0, offsetY = 0) {
        const isCompareMode = arcId !== null;
        const arcParam = arcId ? `, '${arcId}'` : '';
        const clickHandler = isCompareMode
            ? `ArcBoardViewModel.selectItem('${item.id}', event.ctrlKey || event.metaKey, '${arcId}'); if(InterArcConnectionService.connecting) InterArcConnectionService.handleClick('${arcId}', '${item.id}')`
            : `ArcBoardViewModel.selectItem('${item.id}', event.ctrlKey || event.metaKey)`;
        return `
            <div class="arc-floating-item ${isSelected ? 'selected' : ''}"
                 id="item-${item.id}"
                 data-item-id="${item.id}"
                 data-item-type="link"
                 ${arcId ? `data-arc-id="${arcId}"` : ''}
                 style="left: ${(item.x || 0) + offsetX}px; top: ${(item.y || 0) + offsetY}px; width: 280px"
                 onclick="${clickHandler}">
                ${this._renderDragHandle(item.id, true, arcId)}
                <div class="arc-card arc-card-link" style="margin:0">
                    ${item.url ? `
                        <div class="arc-link-preview">
                            <div class="arc-link-preview-info">
                                <div class="arc-link-preview-title">${item.title || item.url}</div>
                                <div class="arc-link-preview-url">${item.url}</div>
                            </div>
                        </div>
                    ` : `
                        <div class="arc-link-input">
                            <i data-lucide="link"></i>
                            <input type="text" placeholder="Entrer une URL"
                                   onkeypress="ArcBoardEventHandlers.handleLinkInput(event, '${item.id}'${arcParam})"
                                   onclick="event.stopPropagation()">
                        </div>
                    `}
                </div>
            </div>
        `;
    },

    _renderTodo(item, isSelected, arcId = null, offsetX = 0, offsetY = 0) {
        const isCompareMode = arcId !== null;
        const arcParam = arcId ? `, '${arcId}'` : '';
        const clickHandler = isCompareMode
            ? `ArcBoardViewModel.selectItem('${item.id}', event.ctrlKey || event.metaKey, '${arcId}'); if(InterArcConnectionService.connecting) InterArcConnectionService.handleClick('${arcId}', '${item.id}')`
            : `ArcBoardViewModel.selectItem('${item.id}', event.ctrlKey || event.metaKey)`;
        const todosHtml = (item.items || []).map((todo, idx) => `
            <div class="arc-todo-item">
                <div class="arc-todo-checkbox ${todo.completed ? 'checked' : ''}"
                     onclick="ArcBoardEventHandlers.toggleFloatingTodo('${item.id}', ${idx}${arcParam})">
                    ${todo.completed ? '<i data-lucide="check"></i>' : ''}
                </div>
                <input type="text" class="arc-todo-text ${todo.completed ? 'completed' : ''}"
                       value="${todo.text || ''}"
                       onchange="ArcBoardEventHandlers.updateFloatingTodoText('${item.id}', ${idx}, this.value${arcParam})"
                       onclick="event.stopPropagation()">
            </div>
        `).join('');

        return `
            <div class="arc-floating-item ${isSelected ? 'selected' : ''}"
                 id="item-${item.id}"
                 data-item-id="${item.id}"
                 data-item-type="todo"
                 ${arcId ? `data-arc-id="${arcId}"` : ''}
                 style="left: ${(item.x || 0) + offsetX}px; top: ${(item.y || 0) + offsetY}px; width: 260px"
                 onclick="${clickHandler}">
                ${this._renderDragHandle(item.id, true, arcId)}
                <div class="arc-card arc-card-todo" style="margin:0">
                    <input type="text" class="arc-card-title" value="${item.title || ''}"
                           placeholder="Liste de tâches"
                           onchange="ArcBoardViewModel.updateItem('${item.id}', { title: this.value }${arcParam})"
                           onclick="event.stopPropagation()">
                    <div class="arc-todo-list">${todosHtml}</div>
                    <div class="arc-todo-add" onclick="ArcBoardEventHandlers.addFloatingTodoItem('${item.id}'${arcParam}); event.stopPropagation();">
                        <i data-lucide="plus"></i> Ajouter une tâche...
                    </div>
                </div>
            </div>
        `;
    },

    _renderComment(item, isSelected, arcId = null, offsetX = 0, offsetY = 0) {
        const isCompareMode = arcId !== null;
        const arcParam = arcId ? `, '${arcId}'` : '';
        const clickHandler = isCompareMode
            ? `ArcBoardViewModel.selectItem('${item.id}', event.ctrlKey || event.metaKey, '${arcId}'); if(InterArcConnectionService.connecting) InterArcConnectionService.handleClick('${arcId}', '${item.id}')`
            : `ArcBoardViewModel.selectItem('${item.id}', event.ctrlKey || event.metaKey)`;
        return `
            <div class="arc-floating-item ${isSelected ? 'selected' : ''}"
                 id="item-${item.id}"
                 data-item-id="${item.id}"
                 data-item-type="comment"
                 ${arcId ? `data-arc-id="${arcId}"` : ''}
                 style="left: ${(item.x || 0) + offsetX}px; top: ${(item.y || 0) + offsetY}px; width: 220px"
                 onclick="${clickHandler}">
                ${this._renderDragHandle(item.id, true, arcId)}
                <div class="arc-card arc-card-comment" style="margin:0">
                    <div class="arc-card-content" contenteditable="true"
                         onblur="ArcBoardViewModel.updateItem('${item.id}', { content: this.innerHTML }${arcParam})"
                         onclick="event.stopPropagation()">${item.content || ''}</div>
                </div>
            </div>
        `;
    },

    _renderTable(item, isSelected, arcId = null, offsetX = 0, offsetY = 0) {
        const isCompareMode = arcId !== null;
        const arcParam = arcId ? `, '${arcId}'` : '';
        const clickHandler = isCompareMode
            ? `ArcBoardViewModel.selectItem('${item.id}', event.ctrlKey || event.metaKey, '${arcId}'); if(InterArcConnectionService.connecting) InterArcConnectionService.handleClick('${arcId}', '${item.id}')`
            : `ArcBoardViewModel.selectItem('${item.id}', event.ctrlKey || event.metaKey)`;
        const rows = item.rows || 3;
        const cols = item.cols || 3;
        const data = item.data || [];

        let tableHtml = '<table>';
        for (let r = 0; r < rows; r++) {
            tableHtml += '<tr>';
            for (let c = 0; c < cols; c++) {
                const cellData = data[r]?.[c] || '';
                const tag = r === 0 ? 'th' : 'td';
                tableHtml += `<${tag} contenteditable="true"
                               onblur="ArcBoardEventHandlers.updateTableCell('${item.id}', ${r}, ${c}, this.textContent${arcParam})"
                               onclick="event.stopPropagation()">${cellData}</${tag}>`;
            }
            // Bouton supprimer ligne (sauf header)
            if (r > 0) {
                tableHtml += `<td class="arc-table-action" onclick="ArcBoardEventHandlers.removeTableRow('${item.id}', ${r}${arcParam}); event.stopPropagation();">
                    <i data-lucide="minus"></i>
                </td>`;
            } else {
                tableHtml += '<th class="arc-table-action"></th>';
            }
            tableHtml += '</tr>';
        }
        // Ligne pour supprimer colonnes
        tableHtml += '<tr class="arc-table-actions-row">';
        for (let c = 0; c < cols; c++) {
            if (cols > 1) {
                tableHtml += `<td class="arc-table-action" onclick="ArcBoardEventHandlers.removeTableCol('${item.id}', ${c}${arcParam}); event.stopPropagation();">
                    <i data-lucide="minus"></i>
                </td>`;
            } else {
                tableHtml += '<td class="arc-table-action"></td>';
            }
        }
        tableHtml += '<td class="arc-table-action"></td></tr>';
        tableHtml += '</table>';

        return `
            <div class="arc-floating-item ${isSelected ? 'selected' : ''}"
                 id="item-${item.id}"
                 data-item-id="${item.id}"
                 data-item-type="table"
                 ${arcId ? `data-arc-id="${arcId}"` : ''}
                 style="left: ${(item.x || 0) + offsetX}px; top: ${(item.y || 0) + offsetY}px"
                 onclick="${clickHandler}">
                ${this._renderDragHandle(item.id, true, arcId)}
                <div class="arc-card arc-card-table" style="margin:0">
                    ${tableHtml}
                    <div class="arc-table-controls">
                        <button class="arc-table-btn" onclick="ArcBoardEventHandlers.addTableRow('${item.id}'${arcParam}); event.stopPropagation();" title="Ajouter une ligne">
                            <i data-lucide="plus"></i> Ligne
                        </button>
                        <button class="arc-table-btn" onclick="ArcBoardEventHandlers.addTableCol('${item.id}'${arcParam}); event.stopPropagation();" title="Ajouter une colonne">
                            <i data-lucide="plus"></i> Colonne
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    _renderSceneItem(item, isSelected, arcId = null, offsetX = 0, offsetY = 0) {
        const isCompareMode = arcId !== null;
        const arcParam = arcId ? `, '${arcId}'` : '';
        const clickHandler = isCompareMode
            ? `ArcBoardViewModel.selectItem('${item.id}', event.ctrlKey || event.metaKey, '${arcId}'); if(InterArcConnectionService.connecting) InterArcConnectionService.handleClick('${arcId}', '${item.id}')`
            : `ArcBoardViewModel.selectItem('${item.id}', event.ctrlKey || event.metaKey)`;
        const statusLabels = { 'setup': 'Introduction', 'development': 'Développement', 'climax': 'Point culminant', 'resolution': 'Résolution' };

        return `
            <div class="arc-floating-item ${isSelected ? 'selected' : ''}"
                 id="item-${item.id}"
                 data-item-id="${item.id}"
                 data-item-type="scene"
                 data-scene-id="${item.sceneId || ''}"
                 ${arcId ? `data-arc-id="${arcId}"` : ''}
                 style="left: ${(item.x || 0) + offsetX}px; top: ${(item.y || 0) + offsetY}px; width: ${item.width || 220}px; z-index: ${item.zIndex || 1}"
                 onclick="${clickHandler}">
                ${this._renderDragHandle(item.id, true, arcId)}
                <button class="arc-floating-delete" onclick="event.stopPropagation(); deleteArcItem('${item.id}'${arcParam})" title="${Localization.t('btn.delete')}">
                    <i data-lucide="x"></i>
                </button>
                <div class="arc-card arc-card-scene" style="margin:0">
                    <div class="arc-card-scene-header">
                        <i data-lucide="book-open"></i>
                        <div class="arc-card-scene-title-wrapper">
                            <div class="arc-card-scene-breadcrumb">${item.breadcrumb || ''}</div>
                            <div class="arc-card-scene-title">${item.sceneTitle || Localization.t('arc.card.scene_label')}</div>
                        </div>
                    </div>
                    <div class="arc-card-scene-meta">
                        <div class="arc-card-scene-status">
                            <span class="arc-card-scene-label">${Localization.t('arc.card.status')}</span>
                            <span class="arc-card-scene-value">${statusLabels[item.status] || Localization.t('arc.status.development')}</span>
                        </div>
                    </div>
                    <button class="arc-card-scene-open" onclick="ArcBoardEventHandlers.openScene('${item.sceneId}'); event.stopPropagation();">
                        <i data-lucide="external-link"></i> ${Localization.t('arc.card.open')}
                    </button>
                </div>
            </div>
        `;
    },

    // ==========================================
    // CONNEXIONS
    // ==========================================

    /**
     * Rendu des connexions SVG
     */
    renderConnections(arc) {
        const svg = document.getElementById('arcConnectionsSvg');
        if (!svg) return;

        const defs = svg.querySelector('defs');
        svg.innerHTML = '';
        if (defs) svg.appendChild(defs);

        if (!arc.board.connections?.length) return;

        arc.board.connections.forEach(conn => {
            // Chercher par item-id OU data-card-id pour supporter les cartes
            const fromEl = document.getElementById(`item-${conn.from}`)
                || document.querySelector(`[data-card-id="${conn.from}"]`);
            const toEl = document.getElementById(`item-${conn.to}`)
                || document.querySelector(`[data-card-id="${conn.to}"]`);

            if (!fromEl || !toEl) return;

            const fromPos = this._getElementPosition(fromEl, conn.fromSide);
            const toPos = this._getElementPosition(toEl, conn.toSide);

            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            const isSelected = ArcBoardState.selectedItems.includes(conn.id);
            const { path: d, cp1, cp2 } = this._createBezierPath(fromPos, toPos, conn.fromSide, conn.toSide);

            path.setAttribute('d', d);
            path.setAttribute('class', `arc-connection-line ${isSelected ? 'selected' : ''}`);
            path.setAttribute('data-connection-id', conn.id);
            path.setAttribute('marker-end', isSelected ? 'url(#arrowhead-selected)' : 'url(#arrowhead)');
            path.style.pointerEvents = 'stroke';
            path.onclick = (e) => {
                e.stopPropagation();
                ArcBoardViewModel.selectItem(conn.id, e.ctrlKey || e.metaKey);
            };

            svg.appendChild(path);

            // Ajouter un bouton de suppression au milieu (visible au hover via CSS)
            const mid = this._getBezierPoint(fromPos, cp1, cp2, toPos, 0.5);
            const deleteBtn = this._createConnectionDeleteBtn(conn.id, mid, arc.id);
            svg.appendChild(deleteBtn);
        });
    },

    _getElementPosition(element, side) {
        const content = document.getElementById('arcBoardContent');
        if (!content) return { x: 0, y: 0 };

        const contentRect = content.getBoundingClientRect();
        const rect = element.getBoundingClientRect();

        const x = (rect.left - contentRect.left) / ArcBoardState.zoom;
        const y = (rect.top - contentRect.top) / ArcBoardState.zoom;
        const w = rect.width / ArcBoardState.zoom;
        const h = rect.height / ArcBoardState.zoom;

        switch (side) {
            case 'top': return { x: x + w / 2, y: y };
            case 'bottom': return { x: x + w / 2, y: y + h };
            case 'left': return { x: x, y: y + h / 2 };
            case 'right': return { x: x + w, y: y + h / 2 };
            default: return { x: x + w / 2, y: y + h / 2 };
        }
    },

    _createBezierPath(from, to, fromSide, toSide) {
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Tension dynamique basée sur la distance
        let offset = Math.min(250, Math.max(60, dist * 0.45));

        // Ajustement si items très proches pour éviter les boucles bizarres
        if (Math.abs(dx) < 60 && (fromSide === 'left' || fromSide === 'right')) offset = 40;
        if (Math.abs(dy) < 60 && (fromSide === 'top' || fromSide === 'bottom')) offset = 40;

        let cp1 = { x: from.x, y: from.y };
        let cp2 = { x: to.x, y: to.y };

        switch (fromSide) {
            case 'top': cp1.y -= offset; break;
            case 'bottom': cp1.y += offset; break;
            case 'left': cp1.x -= offset; break;
            case 'right': cp1.x += offset; break;
        }

        switch (toSide) {
            case 'top': cp2.y -= offset; break;
            case 'bottom': cp2.y += offset; break;
            case 'left': cp2.x -= offset; break;
            case 'right': cp2.x += offset; break;
        }

        return {
            path: `M ${from.x} ${from.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${to.x} ${to.y}`,
            cp1,
            cp2
        };
    },

    /**
     * Calcule un point sur une courbe de Bézier cubique (t entre 0 et 1)
     */
    _getBezierPoint(p0, p1, p2, p3, t) {
        const ont = (1 - t);
        return {
            x: ont ** 3 * p0.x + 3 * ont ** 2 * t * p1.x + 3 * ont * t ** 2 * p2.x + t ** 3 * p3.x,
            y: ont ** 3 * p0.y + 3 * ont ** 2 * t * p1.y + 3 * ont * t ** 2 * p2.y + t ** 3 * p3.y
        };
    },

    /**
     * Crée un bouton de suppression SVG pour une connexion
     */
    _createConnectionDeleteBtn(connectionId, pos, arcId, isInterArc = false) {
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('class', 'arc-connection-delete-handle');
        if (isInterArc) {
            g.setAttribute('data-interarc-delete-id', connectionId);
        } else {
            g.setAttribute('data-connection-delete-id', connectionId);
        }

        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', pos.x);
        circle.setAttribute('cy', pos.y);
        circle.setAttribute('r', '10');
        circle.setAttribute('class', 'arc-connection-delete-bg');

        const line1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line1.setAttribute('x1', pos.x - 4);
        line1.setAttribute('y1', pos.y - 4);
        line1.setAttribute('x2', pos.x + 4);
        line1.setAttribute('y2', pos.y + 4);
        line1.setAttribute('class', 'arc-connection-delete-icon');

        const line2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line2.setAttribute('x1', pos.x + 4);
        line2.setAttribute('y1', pos.y - 4);
        line2.setAttribute('x2', pos.x - 4);
        line2.setAttribute('y2', pos.y + 4);
        line2.setAttribute('class', 'arc-connection-delete-icon');

        g.appendChild(circle);
        g.appendChild(line1);
        g.appendChild(line2);

        g.addEventListener('click', (e) => {
            e.stopPropagation();
            if (isInterArc) {
                InterArcConnectionRepository.delete(connectionId);
                ArcBoardViewModel.render();
            } else {
                ConnectionRepository.delete(arcId, connectionId);
                ArcBoardViewModel.renderItems();
            }
        });

        return g;
    },

    // ==========================================
    // WELCOME & MENUS
    // ==========================================

    renderWelcome() {
        const view = document.getElementById('editorView');
        if (!view) return;

        ArcRepository.init();
        const arcs = ArcRepository.getAll();

        view.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon"><i data-lucide="layout-dashboard"></i></div>
                <div class="empty-state-title">${arcs.length === 0 ? Localization.t('arc.welcome.title_empty') : Localization.t('arc.welcome.title_select')}</div>
                <div class="empty-state-text">
                    ${arcs.length === 0
                ? Localization.t('arc.welcome.text_empty')
                : Localization.t('arc.welcome.text_select')
            }
                </div>
                <button class="btn btn-primary" onclick="ArcBoardViewModel.showArcForm()">
                    <i data-lucide="${arcs.length === 0 ? 'sparkles' : 'plus'}"></i>
                    ${arcs.length === 0 ? Localization.t('arc.welcome.btn_first') : Localization.t('arc.welcome.btn_new')}
                </button>
            </div>
        `;

        if (typeof lucide !== 'undefined') lucide.createIcons();
    },

    showArcContextMenu(event, arcId) {
        this._removeContextMenu();

        const menu = document.createElement('div');
        menu.className = 'arc-context-menu';
        menu.id = 'arcContextMenu';
        menu.style.left = `${event.clientX}px`;
        menu.style.top = `${event.clientY}px`;

        menu.innerHTML = `
            <div class="arc-context-menu-item" onclick="ArcBoardViewModel.openArc('${arcId}')">
                <i data-lucide="layout-dashboard"></i> ${Localization.t('arc.menu.open')}
            </div>
            <div class="arc-context-menu-item" onclick="ArcBoardViewModel.showArcForm('${arcId}')">
                <i data-lucide="settings"></i> ${Localization.t('arc.menu.edit')}
            </div>
            <div class="arc-context-menu-item" onclick="ArcBoardEventHandlers.duplicateArc('${arcId}')">
                <i data-lucide="copy"></i> ${Localization.t('arc.menu.duplicate')}
            </div>
            <div class="arc-context-menu-separator"></div>
            <div class="arc-context-menu-item danger" onclick="ArcBoardEventHandlers.deleteArc('${arcId}')">
                <i data-lucide="trash-2"></i> ${Localization.t('arc.toolbar.delete')}
            </div>
        `;

        document.body.appendChild(menu);
        if (typeof lucide !== 'undefined') lucide.createIcons();

        setTimeout(() => {
            document.addEventListener('click', () => this._removeContextMenu(), { once: true });
        }, 10);
    },

    showCanvasContextMenu(event) {
        this._removeContextMenu();

        const menu = document.createElement('div');
        menu.className = 'arc-context-menu';
        menu.id = 'arcContextMenu';
        menu.style.left = `${event.clientX}px`;
        menu.style.top = `${event.clientY}px`;

        menu.innerHTML = `
            <div class="arc-context-menu-item" onclick="ArcBoardViewModel.addItemAt('column', ${event.clientX}, ${event.clientY})">
                <i data-lucide="columns-3"></i> ${Localization.t('arc.btn.add_column')}
            </div>
            <div class="arc-context-menu-item" onclick="ArcBoardViewModel.addItemAt('note', ${event.clientX}, ${event.clientY})">
                <i data-lucide="file-text"></i> ${Localization.t('arc.btn.add_note')}
            </div>
            <div class="arc-context-menu-item" onclick="ArcBoardViewModel.addItemAt('image', ${event.clientX}, ${event.clientY})">
                <i data-lucide="image"></i> ${Localization.t('arc.btn.add_image')}
            </div>
            <div class="arc-context-menu-separator"></div>
            <div class="arc-context-menu-item" onclick="ArcBoardViewModel.paste()">
                <i data-lucide="clipboard"></i> ${Localization.t('arc.menu.paste')}
            </div>
            <div class="arc-context-menu-separator"></div>
            <div class="arc-context-menu-item" onclick="ArcBoardViewModel.resetView()">
                <i data-lucide="maximize-2"></i> ${Localization.t('arc.menu.reset_zoom')}
            </div>
        `;

        document.body.appendChild(menu);
        if (typeof lucide !== 'undefined') lucide.createIcons();

        setTimeout(() => {
            document.addEventListener('click', () => this._removeContextMenu(), { once: true });
        }, 10);
    },

    _removeContextMenu() {
        const menu = document.getElementById('arcContextMenu');
        if (menu) menu.remove();
        const cardMenu = document.getElementById('arcCardTypeMenu');
        if (cardMenu) cardMenu.remove();
    },

    /**
     * Affiche le menu de sélection de type de carte
     * @param {Event} event - L'événement click
     * @param {string} columnId - L'ID de la colonne cible
     * @param {string|null} arcId - L'ID de l'arc (optionnel, pour le mode compare)
     */
    showCardTypeMenu(event, columnId, arcId = null) {
        this._removeContextMenu();

        const menu = document.createElement('div');
        menu.className = 'arc-card-type-menu';
        menu.id = 'arcCardTypeMenu';

        // Positionner près du bouton
        const rect = event.target.closest('.arc-card-add').getBoundingClientRect();
        menu.style.left = `${rect.left}px`;
        menu.style.top = `${rect.bottom + 4}px`;

        // Générer les options de types de cartes
        const cardTypes = Object.entries(CreatableItemTypes)
            .filter(([_, config]) => config.canBeCard);

        const arcParam = arcId ? `, '${arcId}'` : '';
        menu.innerHTML = `
            <div class="arc-card-type-menu-header">
                <span>${Localization.t('arc.menu.card_type')}</span>
            </div>
            <div class="arc-card-type-menu-grid">
                ${cardTypes.map(([type, config]) => `
                    <div class="arc-card-type-option" onclick="ArcBoardViewModel.addCard('${columnId}', '${type}'${arcParam}); ArcBoardView._removeContextMenu();">
                        <i data-lucide="${config.icon}"></i>
                        <span>${config.label}</span>
                    </div>
                `).join('')}
            </div>
        `;

        document.body.appendChild(menu);
        if (typeof lucide !== 'undefined') lucide.createIcons();

        // Ajuster la position si le menu dépasse de l'écran
        const menuRect = menu.getBoundingClientRect();
        if (menuRect.right > window.innerWidth) {
            menu.style.left = `${window.innerWidth - menuRect.width - 10}px`;
        }
        if (menuRect.bottom > window.innerHeight) {
            menu.style.top = `${rect.top - menuRect.height - 4}px`;
        }

        // Fermer le menu au clic extérieur
        setTimeout(() => {
            document.addEventListener('click', (e) => {
                if (!menu.contains(e.target)) {
                    this._removeContextMenu();
                }
            }, { once: true });
        }, 10);
    },

    // ==========================================
    // SCENE PANEL (Editor Integration)
    // ==========================================

    /**
     * Rendu du panneau des arcs pour la scène courante
     */
    renderScenePanel() {
        const content = document.getElementById('arcScenePanelContent');
        if (!content) return;

        // Vérifier qu'une scène est sélectionnée
        if (!currentSceneId || !currentChapterId || !currentActId) {
            content.innerHTML = `
                <div class="arc-panel-empty">
                    <p>${Localization.t('arc.panel.empty_current')}</p>
                </div>
            `;
            return;
        }

        // Récupérer les données de la scène
        const sceneInfo = ArcBoardViewModel._getSceneInfo(currentSceneId);
        const arcs = ArcRepository.getAll();

        // Get arcs present in this scene
        const arcsInScene = arcs.filter(arc =>
            arc.scenePresence && arc.scenePresence.some(p => p.sceneId == currentSceneId)
        );

        if (arcsInScene.length === 0 && arcs.length === 0) {
            content.innerHTML = `
                <div class="arc-panel-empty">
                    <div class="arc-panel-empty-icon"><i data-lucide="drama"></i></div>
                    <p>${Localization.t('arc.panel.empty_all')}</p>
                </div>
            `;
            if (typeof lucide !== 'undefined') lucide.createIcons();
            return;
        }

        let html = `
            <div class="arc-scene-info">
                <div class="arc-scene-info-title">${Localization.t('arc.panel.scene_title')}</div>
                <div style="font-weight: 500;">${sceneInfo.title}</div>
            </div>
        `;

        // Show arcs in scene
        if (arcsInScene.length > 0) {
            arcsInScene.forEach(arc => {
                const presence = arc.scenePresence.find(p => p.sceneId == currentSceneId);
                if (!presence) return;

                const category = ArcRepository.getAllCategories()[arc.category || 'plot'] || ArcCategories.plot;
                const statusLabels = {
                    'setup': Localization.t('arc.status.setup'),
                    'development': Localization.t('arc.status.development'),
                    'climax': Localization.t('arc.status.climax'),
                    'resolution': Localization.t('arc.status.resolution')
                };

                html += `
                    <div class="arc-in-scene" data-arc-id="${arc.id}">
                        <div class="arc-in-scene-header">
                            <div class="arc-in-scene-title">
                                <span style="color: ${arc.color || category.color}; margin-right: 8px;"><i data-lucide="${category.icon}"></i></span>
                                <strong>${arc.title}</strong>
                            </div>
                            <button class="arc-in-scene-remove" onclick="removeArcFromScene('${arc.id}')" title="${Localization.t('btn.remove')}">×</button>
                        </div>

                        <div class="arc-in-scene-control">
                            <label class="arc-in-scene-label">${Localization.t('arc.panel.intensity')}</label>
                            <input type="range" min="1" max="5" value="${presence.intensity}"
                                class="arc-intensity-slider"
                                oninput="updateArcIntensity('${arc.id}', this.value)">
                            <div class="arc-intensity-value">${presence.intensity}/5</div>
                        </div>

                        <div class="arc-in-scene-control">
                            <label class="arc-in-scene-label">${Localization.t('arc.card.status')}</label>
                            <select class="arc-status-select" onchange="updateArcStatus('${arc.id}', this.value)">
                                <option value="setup" ${presence.status === 'setup' ? 'selected' : ''}>${statusLabels.setup}</option>
                                <option value="development" ${presence.status === 'development' ? 'selected' : ''}>${statusLabels.development}</option>
                                <option value="climax" ${presence.status === 'climax' ? 'selected' : ''}>${statusLabels.climax}</option>
                                <option value="resolution" ${presence.status === 'resolution' ? 'selected' : ''}>${statusLabels.resolution}</option>
                            </select>
                        </div>

                        <div class="arc-in-scene-control">
                            <label class="arc-in-scene-label">${Localization.t('arc.panel.column_select')}</label>
                            <select class="arc-column-select" onchange="updateArcColumn('${arc.id}', this.value)">
                                <option value="">${Localization.t('arc.panel.general_arc')}</option>
                                ${(arc.board && arc.board.items ? arc.board.items.filter(item => item.type === 'column').map(column =>
                    `<option value="${column.id}" ${presence.columnId == column.id ? 'selected' : ''}>${column.title || Localization.t('arc.panel.no_title_col')}</option>`
                ).join('') : '')}
                            </select>
                        </div>

                        <div class="arc-in-scene-control">
                            <label class="arc-in-scene-label">${Localization.t('arc.context.note')}s</label>
                            <textarea class="arc-notes-textarea"
                                placeholder="${Localization.t('arc.panel.notes_placeholder')}"
                                onblur="updateArcNotes('${arc.id}', this.value)">${presence.notes || ''}</textarea>
                        </div>
                    </div>
                `;
            });
        }

        // Add arc button
        const availableArcs = arcs.filter(arc => !arcsInScene.find(asin => asin.id === arc.id));
        if (availableArcs.length > 0) {
            html += `
                <div class="arc-panel-add-section" style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border-color);">
                    <select id="arcToAddSelect" class="arc-panel-add-select">
                        <option value="">${Localization.t('arc.panel.add_arc_prompt')}</option>
                        ${availableArcs.map(arc => {
                const category = ArcRepository.getAllCategories()[arc.category || 'plot'] || ArcCategories.plot;
                return `<option value="${arc.id}">${category.label} - ${arc.title}</option>`;
            }).join('')}
                    </select>
                    <button class="arc-panel-add-btn" onclick="addArcToCurrentScene()">
                        ${Localization.t('arc.panel.add_arc_btn')}
                    </button>
                </div>
            `;
        }

        content.innerHTML = html;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    },

    /**
     * Rendu de l'icône d'un type d'arc
     */
    renderArcTypeIcon(typeKey) {
        const category = ArcRepository.getAllCategories()[typeKey] || ArcCategories.plot;
        return `<i data-lucide="${category.icon}" style="color: ${category.color}"></i>`;
    }
};
