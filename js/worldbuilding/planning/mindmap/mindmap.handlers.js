/**
 * @class MindmapHandlers
 * @description Event handlers for Mindmaps.
 */
class MindmapHandlers {
    constructor(model, viewModel, repository) {
        this.model = model;
        this.viewModel = viewModel;
        this.repository = repository;

        // Touch drag variables
        this.touchDragData = null;
        this.touchDragElement = null;
        this.touchDragClone = null;

        // Bound listeners for cleanup
        this._touchMoveBound = null;
        this._touchEndBound = null;
        this._globalTouchMoveBound = this.handleTouchMove.bind(this);
        this._globalTouchEndBound = this.handleTouchEnd.bind(this);
    }

    initEvents() {
        const canvas = document.getElementById('mindmapCanvas');
        const wrapper = document.getElementById('mindmapCanvasWrapper');
        if (!canvas || !wrapper) return;

        // Node interactions
        canvas.querySelectorAll('.mindmap-node').forEach(node => {
            // Mouse
            node.addEventListener('mousedown', this.handleNodeMouseDown.bind(this));
            node.addEventListener('click', this.handleNodeClick.bind(this));

            // Touch
            node.addEventListener('touchstart', this.handleNodeTouchStart.bind(this), { passive: false });
        });

        // Canvas interactions
        wrapper.addEventListener('mousedown', this.handleCanvasMouseDown.bind(this));
        document.addEventListener('mousemove', this.handleMouseMove.bind(this));
        document.addEventListener('mouseup', this.handleMouseUp.bind(this));

        // Touch Canvas
        wrapper.addEventListener('touchstart', this.handleCanvasTouchStart.bind(this), { passive: false });
        // NOTE: passive: true avoids blocking scroll in other views.
        // CSS touch-action:none on .mindmap-canvas-wrapper handles prevention during pan/drag.
        document.addEventListener('touchmove', this._globalTouchMoveBound, { passive: true });
        document.addEventListener('touchend', this._globalTouchEndBound);

        // Zoom & Drag Drop
        wrapper.addEventListener('wheel', this.handleWheel.bind(this), { passive: false });
        wrapper.addEventListener('dragover', this.handleDragOver.bind(this));
        wrapper.addEventListener('drop', this.handleDrop.bind(this));

        // Library items
        this.initLibraryEvents();
    }

    initLibraryEvents() {
        document.querySelectorAll('.mindmap-library-item').forEach(item => {
            item.addEventListener('dragstart', this.handleLibraryDragStart.bind(this));
            item.addEventListener('touchstart', this.handleLibraryTouchStart.bind(this), { passive: false });
        });
    }

    // --- Node Handlers ---

    handleNodeMouseDown(e) {
        e.stopPropagation();
        const nodeId = parseInt(e.currentTarget.getAttribute('data-node-id'));
        this.startDraggingNode(nodeId, e.clientX, e.clientY);
        e.currentTarget.classList.add('dragging');
    }

    handleNodeClick(e) {
        const nodeId = parseInt(e.currentTarget.getAttribute('data-node-id'));
        const mindmap = this.model.currentMindmap;
        if (!mindmap) return;

        const node = mindmap.nodes.find(n => n.id === nodeId);
        if (!node) return;

        if (e.detail === 2) {
            this.viewModel.handleNodeDoubleClick(node);
        } else if (e.detail === 1 && this.model.mindmapState.linkStart && this.model.mindmapState.linkStart !== nodeId) {
            this.viewModel.startLinkFrom(nodeId);
        }
    }

    handleNodeTouchStart(e) {
        if (e.target.closest('.mindmap-node-link-btn') || e.target.closest('.mindmap-node-delete')) {
            return;
        }

        e.preventDefault();
        e.stopPropagation();

        const nodeId = parseInt(e.currentTarget.getAttribute('data-node-id'));
        const touch = e.touches[0];

        this.startDraggingNode(nodeId, touch.clientX, touch.clientY);
        e.currentTarget.classList.add('dragging');
    }

    startDraggingNode(nodeId, clientX, clientY) {
        const state = this.model.mindmapState;
        const mindmap = this.model.currentMindmap;
        if (!mindmap) return;

        state.isDragging = true;
        state.draggedNode = nodeId;
        state.selectedNode = nodeId;

        const node = mindmap.nodes.find(n => n.id === nodeId);
        const canvas = document.getElementById('mindmapCanvas');
        const rect = canvas.getBoundingClientRect();

        state.dragOffsetX = (clientX - rect.left) / state.zoom - node.x;
        state.dragOffsetY = (clientY - rect.top) / state.zoom - node.y;
    }

    // --- Canvas Handlers ---

    handleCanvasMouseDown(e) {
        // Allow left click (button 0) or middle click (button 1) for panning
        if (e.button === 0 || e.button === 1) {
            if (e.button === 1) e.preventDefault(); // Block autoscroll
            if (e.target.id === 'mindmapCanvasWrapper' || e.target.id === 'mindmapCanvas' || e.button === 1) {
                this.startPanning(e.clientX, e.clientY);
            }
        }
    }

    handleCanvasTouchStart(e) {
        if (e.target.id === 'mindmapCanvasWrapper' || e.target.id === 'mindmapCanvas') {
            e.preventDefault();
            const touch = e.touches[0];
            this.startPanning(touch.clientX, touch.clientY);
        }
    }

    startPanning(clientX, clientY) {
        const state = this.model.mindmapState;
        state.isPanning = true;
        state.lastMouseX = clientX;
        state.lastMouseY = clientY;
        const canvas = document.getElementById('mindmapCanvas');
        if (canvas) canvas.classList.add('panning');
    }

    handleMouseMove(e) {
        if (this.model.mindmapState.isDragging) {
            this.dragNode(e.clientX, e.clientY);
        } else if (this.model.mindmapState.isPanning) {
            this.panCanvas(e.clientX, e.clientY);
        }
    }

    handleTouchMove(e) {
        const touch = e.touches[0];
        if (this.model.mindmapState.isDragging) {
            // e.preventDefault() has no effect with passive:true listener.
            // CSS touch-action:none on .mindmap-canvas-wrapper handles it.
            this.dragNode(touch.clientX, touch.clientY);
        } else if (this.model.mindmapState.isPanning) {
            this.panCanvas(touch.clientX, touch.clientY);
        }
    }

    /**
     * Removes global document listeners. Call when leaving the mindmap view.
     */
    destroyEvents() {
        document.removeEventListener('touchmove', this._globalTouchMoveBound);
        document.removeEventListener('touchend', this._globalTouchEndBound);
    }

    dragNode(clientX, clientY) {
        const state = this.model.mindmapState;
        const mindmap = this.model.currentMindmap;
        if (!state.draggedNode || !mindmap) return;

        const node = mindmap.nodes.find(n => n.id === state.draggedNode);
        if (!node) return;

        const canvas = document.getElementById('mindmapCanvas');
        const rect = canvas.getBoundingClientRect();

        const newX = (clientX - rect.left) / state.zoom - state.dragOffsetX;
        const newY = (clientY - rect.top) / state.zoom - state.dragOffsetY;

        this.viewModel.updateNodePosition(state.draggedNode, newX, newY);

        // Visual update only
        const nodeElem = document.querySelector(`[data-node-id="${node.id}"]`);
        if (nodeElem) {
            nodeElem.style.left = node.x + 'px';
            nodeElem.style.top = node.y + 'px';
        }

        const svg = document.getElementById('mindmapSvg');
        if (svg && window.mindmapView) {
            svg.innerHTML = window.mindmapView.renderLinks(mindmap);
        }
    }

    panCanvas(clientX, clientY) {
        const state = this.model.mindmapState;
        const deltaX = clientX - state.lastMouseX;
        const deltaY = clientY - state.lastMouseY;

        state.panX += deltaX / state.zoom;
        state.panY += deltaY / state.zoom;

        state.lastMouseX = clientX;
        state.lastMouseY = clientY;

        const canvas = document.getElementById('mindmapCanvas');
        if (canvas) {
            canvas.style.transform = `scale(${state.zoom}) translate(${state.panX}px, ${state.panY}px)`;
        }
    }

    handleMouseUp() {
        this.stopDraggingOrPanning();
    }

    handleTouchEnd() {
        this.stopDraggingOrPanning();
    }

    stopDraggingOrPanning() {
        const state = this.model.mindmapState;
        if (state.isDragging) {
            this.viewModel.saveNodePosition();
            document.querySelectorAll('.mindmap-node').forEach(node => node.classList.remove('dragging'));
        }
        if (state.isPanning) {
            const canvas = document.getElementById('mindmapCanvas');
            if (canvas) canvas.classList.remove('panning');
        }
        state.isDragging = false;
        state.draggedNode = null;
        state.isPanning = false;
    }

    handleWheel(e) {
        e.preventDefault();
        const state = this.model.mindmapState;
        const wrapper = document.getElementById('mindmapCanvasWrapper');
        if (!wrapper) return;

        const rect = wrapper.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Mouse position in canvas space BEFORE zoom
        const canvasMouseX = (mouseX / state.zoom) - state.panX;
        const canvasMouseY = (mouseY / state.zoom) - state.panY;

        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        state.zoom = Math.max(0.1, Math.min(3, state.zoom * delta));

        // Adjust pan to keep canvas space point under cursor
        state.panX = (mouseX / state.zoom) - canvasMouseX;
        state.panY = (mouseY / state.zoom) - canvasMouseY;

        const canvas = document.getElementById('mindmapCanvas');
        if (canvas) {
            canvas.style.transform = `scale(${state.zoom}) translate(${state.panX}px, ${state.panY}px)`;
        }
    }

    // --- Drag & Drop Handlers ---

    handleLibraryDragStart(e) {
        const item = e.currentTarget;
        const data = {
            type: item.getAttribute('data-type'),
            linkedId: item.getAttribute('data-id'),
            title: item.getAttribute('data-title'),
            actId: item.getAttribute('data-act'),
            chapterId: item.getAttribute('data-chapter'),
            elementType: item.getAttribute('data-element-type')
        };
        e.dataTransfer.setData('application/json', JSON.stringify(data));
        e.dataTransfer.effectAllowed = 'copy';
    }

    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    }

    handleDrop(e) {
        e.preventDefault();
        try {
            const data = JSON.parse(e.dataTransfer.getData('application/json'));
            this.performDrop(data, e.clientX, e.clientY);
        } catch (err) {
            console.error('Error on drop:', err);
        }
    }

    performDrop(data, clientX, clientY) {
        const mindmap = this.model.currentMindmap;
        if (!mindmap) return;

        const wrapper = document.getElementById('mindmapCanvasWrapper');
        if (!wrapper) return;

        const rect = wrapper.getBoundingClientRect();
        const state = this.model.mindmapState;

        const x = (clientX - rect.left - state.panX * state.zoom) / state.zoom;
        const y = (clientY - rect.top - state.panY * state.zoom) / state.zoom;

        const nodeData = {
            type: data.type,
            linkedId: data.linkedId,
            title: data.title,
            x: x,
            y: y
        };

        if (data.actId) nodeData.actId = data.actId;
        if (data.chapterId) nodeData.chapterId = data.chapterId;
        if (data.elementType) nodeData.elementType = data.elementType;

        this.repository.addNode(mindmap.id, nodeData);
        this.viewModel.refresh();
    }

    // --- Touch Library Drag ---

    handleLibraryTouchStart(e) {
        e.preventDefault();
        const item = e.currentTarget;
        const touch = e.touches[0];

        this.touchDragData = {
            type: item.getAttribute('data-type'),
            linkedId: item.getAttribute('data-id'),
            title: item.getAttribute('data-title'),
            actId: item.getAttribute('data-act'),
            chapterId: item.getAttribute('data-chapter'),
            elementType: item.getAttribute('data-element-type')
        };

        this.touchDragElement = item;
        this.touchDragClone = item.cloneNode(true);
        Object.assign(this.touchDragClone.style, {
            position: 'fixed',
            left: (touch.clientX - 60) + 'px',
            top: (touch.clientY - 20) + 'px',
            width: '120px',
            opacity: '0.7',
            pointerEvents: 'none',
            zIndex: '10000',
            transform: 'scale(0.9)'
        });

        document.body.appendChild(this.touchDragClone);

        this._touchMoveBound = this.handleLibraryTouchMove.bind(this);
        this._touchEndBound = this.handleLibraryTouchEnd.bind(this);
        document.addEventListener('touchmove', this._touchMoveBound, { passive: false });
        document.addEventListener('touchend', this._touchEndBound);
    }

    handleLibraryTouchMove(e) {
        e.preventDefault();
        if (!this.touchDragClone) return;
        const touch = e.touches[0];
        this.touchDragClone.style.left = (touch.clientX - 60) + 'px';
        this.touchDragClone.style.top = (touch.clientY - 20) + 'px';
    }

    handleLibraryTouchEnd(e) {
        if (this.touchDragClone && this.touchDragData) {
            const touch = e.changedTouches[0];
            const wrapper = document.getElementById('mindmapCanvasWrapper');
            if (wrapper) {
                const rect = wrapper.getBoundingClientRect();
                if (touch.clientX >= rect.left && touch.clientX <= rect.right &&
                    touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
                    this.performDrop(this.touchDragData, touch.clientX, touch.clientY);
                }
            }
        }
        this.cleanupTouchDrag();
    }

    cleanupTouchDrag() {
        if (this.touchDragClone && this.touchDragClone.parentNode) {
            this.touchDragClone.parentNode.removeChild(this.touchDragClone);
        }
        this.touchDragClone = null;
        this.touchDragData = null;
        this.touchDragElement = null;

        document.removeEventListener('touchmove', this._touchMoveBound);
        document.removeEventListener('touchend', this._touchEndBound);
    }

    // --- Link Editor ---

    editLink(linkId) {
        const mindmap = this.model.currentMindmap;
        if (!mindmap) return;

        const link = mindmap.links.find(l => l.id === linkId);
        if (!link) return;

        const colors = [
            { name: Localization.t('color.gold'), value: '#d4af37' },
            { name: Localization.t('color.red'), value: '#c44536' },
            { name: Localization.t('color.blue'), value: '#2196f3' },
            { name: Localization.t('color.green'), value: '#4caf50' },
            { name: Localization.t('color.purple'), value: '#9c27b0' },
            { name: Localization.t('color.orange'), value: '#ff9800' },
            { name: Localization.t('color.pink'), value: '#e91e63' },
            { name: Localization.t('color.gray'), value: '#757575' }
        ];

        let selectedColor = link.color || '#d4af37';

        const overlay = document.createElement('div');
        overlay.className = 'link-editor-overlay';
        overlay.innerHTML = `
            <div class="link-editor-modal">
                <div class="link-editor-header"><i data-lucide="pencil" style="width:16px;height:16px;vertical-align:middle;margin-right:6px;"></i> ${Localization.t('mindmap.link_editor.title')}</div>
                <div class="link-editor-field">
                    <label class="link-editor-label">${Localization.t('mindmap.link_editor.label')}</label>
                    <input type="text" class="link-editor-input" id="linkLabelInput" 
                            value="${(link.label || '').replace(/"/g, '&quot;')}" 
                            placeholder="${Localization.t('mindmap.link_editor.placeholder')}">
                </div>
                <div class="link-editor-field">
                    <label class="link-editor-label">${Localization.t('mindmap.link_editor.color')}</label>
                    <div class="link-editor-colors" id="linkColorPicker">
                        ${colors.map(c => `
                            <div class="link-color-option ${c.value === selectedColor ? 'selected' : ''}" 
                                 style="background: ${c.value};"
                                 data-color="${c.value}"
                                 title="${c.name}"></div>
                        `).join('')}
                    </div>
                </div>
                <div class="link-editor-buttons">
                    <button class="btn" id="saveLinkBtn" style="flex: 1;"><i data-lucide="save" style="width:14px;height:14px;margin-right:4px;"></i> ${Localization.t('mindmap.link_editor.save')}</button>
                    <button class="btn" id="deleteLinkBtn" style="background: var(--accent-red); color: white;"><i data-lucide="trash-2" style="width:14px;height:14px;margin-right:4px;"></i> ${Localization.t('mindmap.link_editor.delete')}</button>
                    <button class="btn" id="cancelLinkBtn" style="background: var(--bg-secondary);"><i data-lucide="x" style="width:14px;height:14px;margin-right:4px;"></i> ${Localization.t('mindmap.link_editor.cancel')}</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        overlay.querySelector('.link-editor-modal').onclick = e => e.stopPropagation();
        overlay.onclick = () => overlay.remove();

        overlay.querySelectorAll('.link-color-option').forEach(opt => {
            opt.onclick = () => {
                selectedColor = opt.getAttribute('data-color');
                overlay.querySelectorAll('.link-color-option').forEach(o => o.classList.remove('selected'));
                opt.classList.add('selected');
            };
        });

        overlay.querySelector('#saveLinkBtn').onclick = () => {
            const newLabel = overlay.querySelector('#linkLabelInput').value.trim();
            this.repository.updateLink(mindmap.id, link.id, { label: newLabel, color: selectedColor });
            overlay.remove();
            this.viewModel.refresh();
        };

        overlay.querySelector('#deleteLinkBtn').onclick = () => {
            if (!confirm(Localization.t('mindmap.confirm.delete_link'))) return;
            this.repository.deleteLink(mindmap.id, link.id);
            overlay.remove();
            this.viewModel.refresh();
        };

        overlay.querySelector('#cancelLinkBtn').onclick = () => overlay.remove();
        overlay.querySelector('#linkLabelInput').focus();

        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
}

// Export instance
window.mindmapHandlers = new MindmapHandlers(window.mindmapModel, window.mindmapViewModel, window.mindmapRepository);
