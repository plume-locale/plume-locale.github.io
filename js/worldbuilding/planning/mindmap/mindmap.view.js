/**
 * @class MindmapView
 * @description View layer for Mindmaps.
 */
class MindmapView {
    constructor(model, viewModel) {
        this.model = model;
        this.viewModel = viewModel;
    }

    renderSidebar() {
        const container = document.getElementById('mindmapList');
        if (!container) return;

        const mindmaps = this.model.mindmaps;
        const currentId = this.model.currentMindmapId;

        container.innerHTML = `
            <div class="mindmap-sidebar-header">
                <h3 style="margin-bottom: 0.5rem; font-size: 1.1rem;"><i data-lucide="map" style="width:18px;height:18px;vertical-align:middle;margin-right:6px;"></i> ${Localization.t('mindmap.sidebar.title')}</h3>
                <div style="display: flex; gap: 4px; flex-direction: column;">
                    <button class="btn btn-small" onclick="mindmapViewModel.createMindmap()" style="width: 100%;">
                        <i data-lucide="plus" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i> ${Localization.t('mindmap.sidebar.btn.new')}
                    </button>
                    <button class="btn btn-small btn-accent" onclick="mindmapViewModel.generateAutoMindmap()" style="width: 100%; background: var(--accent-gold); color: black;">
                        <i data-lucide="sparkles" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i> ${Localization.t('mindmap.sidebar.btn.auto')}
                    </button>
                </div>
            </div>
            <div class="mindmap-list">
                ${mindmaps.length === 0 ? `
                    <div style="padding: 1rem; text-align: center; color: var(--text-muted); font-size: 0.9rem;">
                        ${Localization.t('mindmap.sidebar.empty')}
                    </div>
                ` : mindmaps.map(mm => `
                    <div class="mindmap-item ${String(currentId) === String(mm.id) ? 'active' : ''}" 
                         onclick="mindmapViewModel.selectMindmap('${mm.id}')">
                        <span style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                            ${mm.title}
                        </span>
                        <span onclick="event.stopPropagation(); mindmapViewModel.deleteMindmap('${mm.id}')" 
                              style="cursor: pointer; color: var(--accent-red); opacity: 0.7; padding: 0 0.5rem;"
                              title="${Localization.t("mindmap.sidebar.btn.delete")}"><i data-lucide="x" style="width:14px;height:14px;"></i></span>
                    </div>
                `).join('')}
            </div>
        `;

        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    render() {
        const editorView = document.getElementById('editorView');
        if (!editorView) return;

        // 🔥 Protection contre l'écrasement du système d'onglets (Tabs)
        const isTabsSystem = typeof tabsState !== 'undefined' && tabsState.enabled;
        const isMainEditorView = editorView.id === 'editorView';
        const isSplitRendering = document.getElementById('editorView-backup') !== null;

        if (isTabsSystem && isMainEditorView && !isSplitRendering) {
            if (typeof currentView !== 'undefined' && currentView !== 'mindmap') {
                if (typeof switchView === 'function') {
                    switchView('mindmap');
                    return;
                }
            } else if (typeof renderTabs === 'function') {
                renderTabs();
                return;
            }
        }
        if (!editorView) return;

        const mindmap = this.model.currentMindmap;
        const state = this.model.mindmapState;

        if (!mindmap) {
            editorView.innerHTML = `
                <div class="mindmap-empty">
                    <div class="mindmap-empty-icon"><i data-lucide="map" style="width:48px;height:48px;"></i></div>
                    <h3 style="margin-bottom: 0.5rem;">${Localization.t('mindmap.empty.title')}</h3>
                    <p style="margin-bottom: 1rem;">${Localization.t('mindmap.empty.desc')}</p>
                    <button class="btn" onclick="mindmapViewModel.createMindmap()"><i data-lucide="plus" style="width:14px;height:14px;"></i> ${Localization.t('mindmap.empty.btn')}</button>
                </div>
            `;
            if (typeof lucide !== 'undefined') lucide.createIcons();
            return;
        }

        editorView.innerHTML = `
            <div class="mindmap-wrapper">
                <div class="mindmap-main">
                    <div class="mindmap-toolbar">
                        <button class="btn btn-small" onclick="mindmapViewModel.renameMindmap()" title="${Localization.t("mindmap.toolbar.rename")}"><i data-lucide="pencil" style="width:14px;height:14px;"></i></button>
                        <button class="btn btn-small" onclick="mindmapViewModel.addNoteNode()" title="${Localization.t("mindmap.toolbar.add_note")}"><i data-lucide="sticky-note" style="width:14px;height:14px;"></i></button>
                        <button class="btn btn-small" onclick="mindmapViewModel.resetView()" title="${Localization.t("mindmap.toolbar.reset_view")}"><i data-lucide="target" style="width:14px;height:14px;"></i></button>
                        ${state.linkStart ? `
                            <button class="btn btn-small" onclick="mindmapViewModel.cancelLinking()" style="background: var(--accent-red); color: white;" title="${Localization.t("mindmap.toolbar.cancel_linking")}">
                                <i data-lucide="x" style="width:14px;height:14px;"></i> ${Localization.t("mindmap.toolbar.cancel")}
                            </button>
                            <span style="font-size: 0.85rem; color: var(--accent-red); font-weight: 600; animation: pulse-text 1s infinite;">
                                <i data-lucide="link" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i>
                                ${Localization.t('mindmap.toolbar.link_hint_active')}
                            </span>
                        ` : `
                            <span style="font-size: 0.75rem; color: var(--text-muted); font-style: italic;">
                                <i data-lucide="lightbulb" style="width:12px;height:12px;vertical-align:middle;margin-right:4px;"></i>
                                ${Localization.t('mindmap.toolbar.link_hint_idle', '<i data-lucide="link" style="width:12px;height:12px;vertical-align:middle;"></i>')}
                            </span>
                        `}
                        <div style="flex: 1;"></div>
                        <span style="font-size: 0.85rem; color: var(--text-muted);">
                            ${Localization.t('mindmap.toolbar.stats', mindmap.nodes.length, mindmap.links.length)}
                        </span>
                    </div>
                    <div class="mindmap-canvas-wrapper ${state.linkStart ? 'linking-mode' : ''}" id="mindmapCanvasWrapper">
                        <div class="mindmap-canvas" id="mindmapCanvas"
                             style="transform: scale(${state.zoom}) translate(${state.panX}px, ${state.panY}px);">
                            <svg id="mindmapSvg" style="position: absolute; width: 100%; height: 100%; top: 0; left: 0; pointer-events: painted;">
                                ${this.renderLinks(mindmap)}
                            </svg>
                            ${this.renderNodes(mindmap)}
                        </div>
                        <div class="mindmap-zoom-controls">
                            <button class="mindmap-zoom-btn" onclick="mindmapViewModel.zoom(-1)" title="${Localization.t("mindmap.zoom.out")}">
                                <i data-lucide="zoom-out"></i>
                            </button>
                            <span class="mindmap-zoom-level">${Math.round(state.zoom * 100)}%</span>
                            <button class="mindmap-zoom-btn" onclick="mindmapViewModel.zoom(1)" title="${Localization.t("mindmap.zoom.in")}">
                                <i data-lucide="zoom-in"></i>
                            </button>
                            <button class="mindmap-zoom-btn" onclick="mindmapViewModel.resetView()" title="${Localization.t("mindmap.zoom.reset")}">
                                <i data-lucide="maximize-2"></i>
                            </button>
                        </div>
                    </div>
                </div>
                <div class="mindmap-library ${state.libraryCollapsed ? 'collapsed' : ''}">
                    <div class="mindmap-library-toggle" onclick="mindmapViewModel.toggleLibrary()">
                        ${state.libraryCollapsed ? '<i data-lucide="chevron-left" style="width:12px;height:12px;"></i>' : '<i data-lucide="chevron-right" style="width:12px;height:12px;"></i>'}
                    </div>
                    <div class="mindmap-library-tabs">
                        <div class="mindmap-library-tab ${state.activeLibraryTab === 'characters' ? 'active' : ''}"
                             onclick="mindmapViewModel.setLibraryTab('characters')" title="${Localization.t("nav.characters")}"><i data-lucide="users" style="width:16px;height:16px;"></i></div>
                        <div class="mindmap-library-tab ${state.activeLibraryTab === 'elements' ? 'active' : ''}"
                             onclick="mindmapViewModel.setLibraryTab('elements')" title="${Localization.t("nav.world")}"><i data-lucide="globe" style="width:16px;height:16px;"></i></div>
                        <div class="mindmap-library-tab ${state.activeLibraryTab === 'codex' ? 'active' : ''}"
                             onclick="mindmapViewModel.setLibraryTab('codex')" title="${Localization.t("nav.codex")}"><i data-lucide="book-open" style="width:16px;height:16px;"></i></div>
                        <div class="mindmap-library-tab ${state.activeLibraryTab === 'structure' ? 'active' : ''}"
                             onclick="mindmapViewModel.setLibraryTab('structure')" title="${Localization.t("nav.structure")}"><i data-lucide="list-tree" style="width:16px;height:16px;"></i></div>
                    </div>
                    <div class="mindmap-library-content">
                        ${this.renderLibraryContent()}
                    </div>
                </div>
            </div>
        `;

        // Initialize events
        if (window.mindmapHandlers) window.mindmapHandlers.initEvents();

        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    renderNodes(mindmap) {
        if (!mindmap.nodes || mindmap.nodes.length === 0) {
            return `
                <div style="position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); 
                            text-align: center; color: var(--text-muted); pointer-events: none;">
                    <div style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;"><i data-lucide="map" style="width:64px;height:64px;"></i></div>
                    <p style="font-size: 0.9rem;">${Localization.t('mindmap.empty.drag_hint')}</p>
                </div>
            `;
        }

        const selectedNodeId = this.model.mindmapState.selectedNode;
        const linkStartId = this.model.mindmapState.linkStart;

        return mindmap.nodes.map(node => {
            const icon = this.getNodeIcon(node);
            const typeClass = `type-${node.type}`;
            const content = node.type === 'note' ? (node.content || '') : '';
            const isLinkingSource = linkStartId === node.id;

            return `
                <div class="mindmap-node ${typeClass} ${selectedNodeId === node.id ? 'selected' : ''} ${isLinkingSource ? 'linking-source' : ''}"
                     data-node-id="${node.id}"
                     style="left: ${node.x}px; top: ${node.y}px; background-color: ${node.color || 'var(--bg-primary)'};">
                    <div class="mindmap-node-header">
                        <span class="mindmap-node-icon">${icon}</span>
                        <span class="mindmap-node-title">${node.title || Localization.t('mindmap.node.untitled')}</span>
                        <span class="mindmap-node-link-btn" onclick="event.stopPropagation(); mindmapViewModel.startLinkFrom(${node.id})" title="${Localization.t("mindmap.node.link_btn")}"><i data-lucide="link" style="width:12px;height:12px;"></i></span>
                        <span class="mindmap-node-delete" onclick="event.stopPropagation(); mindmapViewModel.deleteNode(${node.id})"><i data-lucide="x" style="width:12px;height:12px;"></i></span>
                    </div>
                    ${content ? `<div class="mindmap-node-content">${content}</div>` : ''}
                </div>
            `;
        }).join('');
    }

    renderLinks(mindmap) {
        if (!mindmap.links || mindmap.links.length === 0) return '';

        const selectedNodeId = this.model.mindmapState.selectedNode;

        const linkColors = new Set(mindmap.links.map(l => l.color || 'var(--accent-gold)'));
        const markers = Array.from(linkColors).map((color, index) => `
            <marker id="arrowhead-${index}" 
                    markerWidth="12" markerHeight="8" 
                    refX="11" refY="4" 
                    orient="auto" 
                    markerUnits="userSpaceOnUse">
                <path d="M0,0 L12,4 L0,8 Z" fill="${color}" />
            </marker>
        `).join('');

        const colorToMarkerId = {};
        Array.from(linkColors).forEach((color, index) => {
            colorToMarkerId[color] = `arrowhead-${index}`;
        });

        return `
            <defs>
                ${markers}
                <filter id="link-glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feFlood flood-color="white" flood-opacity="0.3" result="color"/>
                    <feComposite in="color" in2="blur" operator="in" result="glow"/>
                    <feMerge>
                        <feMergeNode in="glow"/>
                        <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                </filter>
            </defs>
            ${mindmap.links.map(link => {
            const fromNode = mindmap.nodes.find(n => n.id == link.from);
            const toNode = mindmap.nodes.find(n => n.id == link.to);

            if (!fromNode || !toNode) return '';

            // Center points (Width is now fixed at 180px in CSS)
            const getDimensions = (node) => {
                const w = 180;
                let h = 60; // Default height for header-only nodes
                if (node.type === 'note' || node.type === 'codex') h = 100;
                if (node.type === 'scene' && node.content) h = 80;
                return { w, h };
            };

            const dim1 = getDimensions(fromNode);
            const dim2 = getDimensions(toNode);

            const cx1 = fromNode.x + dim1.w / 2;
            const cy1 = fromNode.y + dim1.h / 2;
            const cx2 = toNode.x + dim2.w / 2;
            const cy2 = toNode.y + dim2.h / 2;

            // Simple curve control point
            const midX = (cx1 + cx2) / 2;
            const midY = (cy1 + cy2) / 2;
            const dx = cx2 - cx1;
            const dy = cy2 - cy1;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 1) return '';

            const offset = 80 + (dist * 0.1);
            const nx = -dy / dist;
            const ny = dx / dist;
            const ctrlX = midX + nx * offset;
            const ctrlY = midY + ny * offset;

            // Calculate intersections with node borders
            const getEdgePoint = (node, dim, targetX, targetY) => {
                const centerx = node.x + dim.w / 2;
                const centery = node.y + dim.h / 2;
                const vx = targetX - centerx;
                const vy = targetY - centery;
                // Use slightly larger box for border clearance
                const tx = Math.abs((dim.w / 2 + 2) / vx);
                const ty = Math.abs((dim.h / 2 + 2) / vy);
                const t = Math.min(tx, ty);
                return { x: centerx + vx * t, y: centery + vy * t };
            };

            const start = getEdgePoint(fromNode, dim1, ctrlX, ctrlY);
            const end = getEdgePoint(toNode, dim2, ctrlX, ctrlY);

            // Curve peak for label (t=0.5 on Quadratic Bezier)
            const peakX = (start.x + end.x + 2 * ctrlX) / 4;
            const peakY = (start.y + end.y + 2 * ctrlY) / 4;

            const activeNodeId = selectedNodeId || this.model.mindmapState.linkStart;
            const isRelated = activeNodeId == link.from || activeNodeId == link.to;
            const opacity = activeNodeId ? (isRelated ? 1 : 0.35) : 0.7;
            const linkColor = link.color || 'var(--accent-gold)';
            const markerId = colorToMarkerId[linkColor];

            return `
                    <g class="mindmap-link-group">
                        <path d="M ${start.x} ${start.y} Q ${ctrlX} ${ctrlY} ${end.x} ${end.y}" 
                               fill="none" 
                              stroke="${linkColor}" 
                              stroke-width="${isRelated ? 4 : (link.weight || 2.5)}" 
                              opacity="${opacity}"
                              marker-end="url(#${markerId})"
                              ${isRelated ? 'filter="url(#link-glow)"' : ''}
                              style="transition: all 0.3s ease; pointer-events: stroke; cursor: pointer;"
                              onclick="mindmapHandlers.editLink(${link.id})" />
                        ${link.label ? `
                            <g transform="translate(${peakX}, ${peakY})" style="opacity: ${opacity}; transition: all 0.3s ease;">
                                <rect x="-40" y="-10" width="80" height="20" rx="4" fill="var(--bg-primary)" stroke="${linkColor}" stroke-width="1" />
                                <text text-anchor="middle" dominant-baseline="middle"
                                      style="font-size: 10px; fill: var(--text-main); font-weight: 600; font-family: sans-serif; pointer-events: none;">
                                    ${link.label}
                                </text>
                            </g>
                        ` : ''}
                    </g>
                `;
        }).join('')}
        `;
    }

    renderLibraryContent() {
        const tab = this.model.mindmapState.activeLibraryTab;

        if (tab === 'characters') {
            return project.characters.map(char => `
                <div class="mindmap-library-item" draggable="true" 
                     data-type="character" data-id="${char.id}" data-title="${char.name}">
                    <span class="mindmap-library-item-icon"><i data-lucide="user" style="width:16px;height:16px;"></i></span>
                    <span class="mindmap-library-item-text">${char.name}</span>
                </div>
            `).join('') || `<div style="padding: 1rem; text-align: center; color: var(--text-muted); font-size: 0.85rem;">${Localization.t('mindmap.library.empty_characters')}</div>`;
        }

        if (tab === 'elements') {
            return project.world.map(elem => {
                const elemType = elem.type || 'Lieu';
                const iconMap = {
                    'Lieu': 'map-pin',
                    'Objet': 'box',
                    'Concept': 'lightbulb',
                    'Organisation': 'building-2',
                    'Événement': 'zap',
                    'Location': 'map-pin',
                    'Object': 'box',
                    'Organization': 'building-2',
                    'Event': 'zap'
                };
                const iconName = iconMap[elemType] || 'map-pin';

                return `
                    <div class="mindmap-library-item" draggable="true" 
                         data-type="element" 
                         data-element-type="${elemType}"
                         data-id="${elem.id}" 
                         data-title="${elem.name}">
                        <span class="mindmap-library-item-icon"><i data-lucide="${iconName}" style="width:16px;height:16px;"></i></span>
                        <span class="mindmap-library-item-text">${elem.name}</span>
                    </div>
                `;
            }).join('') || `<div style="padding: 1rem; text-align: center; color: var(--text-muted); font-size: 0.85rem;">${Localization.t('mindmap.library.empty_elements')}</div>`;
        }

        if (tab === 'codex') {
            return (project.codex || []).map(entry => `
                <div class="mindmap-library-item" draggable="true" 
                     data-type="codex" 
                     data-id="${entry.id}" 
                     data-title="${entry.title || entry.name || Localization.t('mindmap.library.untitled')}">
                    <span class="mindmap-library-item-icon"><i data-lucide="book-open" style="width:16px;height:16px;"></i></span>
                    <span class="mindmap-library-item-text">${entry.title || entry.name || Localization.t('mindmap.library.untitled')}</span>
                </div>
            `).join('') || `<div style="padding: 1rem; text-align: center; color: var(--text-muted); font-size: 0.85rem;">${Localization.t('mindmap.library.empty_codex')}</div>`;
        }

        if (tab === 'structure') {
            let html = '';
            project.acts.forEach((act, actIndex) => {
                const actNum = typeof window.toRoman === 'function' ? toRoman(actIndex + 1) : (actIndex + 1);
                html += `
                    <div class="mindmap-library-item" draggable="true" 
                         data-type="act" 
                         data-id="${act.id}" 
                         data-title="${Localization.t('mindmap.library.act_label', actNum)}: ${act.title || Localization.t('mindmap.library.untitled')}">
                        <span class="mindmap-library-item-icon"><i data-lucide="folder" style="width:16px;height:16px;"></i></span>
                        <span class="mindmap-library-item-text" style="font-weight: 600;">${Localization.t('mindmap.library.act_label', actNum)}</span>
                    </div>
                `;

                act.chapters.forEach((chapter, chapIndex) => {
                    const chapNum = chapIndex + 1;
                    html += `
                        <div class="mindmap-library-item" draggable="true" 
                             data-type="chapter" 
                             data-id="${chapter.id}" 
                             data-act="${act.id}" 
                             data-title="A${actNum} › ${Localization.t('mindmap.library.chapter_label', chapNum, chapter.title || Localization.t('mindmap.library.untitled'))}" 
                             style="margin-left: 0.5rem;">
                            <span class="mindmap-library-item-icon"><i data-lucide="file-text" style="width:16px;height:16px;"></i></span>
                            <span class="mindmap-library-item-text" style="font-size: 0.8rem;">${Localization.t('mindmap.library.chapter_label', chapNum, chapter.title || Localization.t('mindmap.library.untitled'))}</span>
                        </div>
                    `;

                    chapter.scenes.forEach(scene => {
                        const sceneLabel = scene.title || Localization.t('mindmap.library.untitled');
                        html += `
                            <div class="mindmap-library-item" draggable="true" 
                                 data-type="scene" 
                                 data-id="${scene.id}" 
                                 data-act="${act.id}" 
                                 data-chapter="${chapter.id}" 
                                 data-title="A${actNum} › C${chapNum} › ${sceneLabel}" 
                                 style="margin-left: 1rem;">
                                <span class="mindmap-library-item-icon"><i data-lucide="pen-line" style="width:16px;height:16px;"></i></span>
                                <span class="mindmap-library-item-text" style="font-size: 0.75rem;">${sceneLabel}</span>
                            </div>
                        `;
                    });
                });
            });
            return html || `<div style="padding: 1rem; text-align: center; color: var(--text-muted); font-size: 0.85rem;">${Localization.t('mindmap.library.empty_structure')}</div>`;
        }

        return '';
    }

    getNodeIcon(node) {
        if (node.type === 'element') {
            const elementIconMap = {
                'Lieu': 'map-pin',
                'Objet': 'box',
                'Concept': 'lightbulb',
                'Organisation': 'building-2',
                'Événement': 'zap',
                'Location': 'map-pin',
                'Object': 'box',
                'Organization': 'building-2',
                'Event': 'zap'
            };
            const iconName = elementIconMap[node.elementType] || 'map-pin';
            return `<i data-lucide="${iconName}" style="width:16px;height:16px;"></i>`;
        }

        const icons = {
            'character': 'user',
            'scene': 'pen-line',
            'note': 'sticky-note',
            'codex': 'book-open',
            'act': 'folder',
            'chapter': 'file-text'
        };
        const iconName = icons[node.type] || 'pin';
        return `<i data-lucide="${iconName}" style="width:16px;height:16px;"></i>`;
    }
}

// Export instance
window.mindmapView = new MindmapView(window.mindmapModel, window.mindmapViewModel);
