/**
 * [MVVM : globalnotes View]
 * Main entry point for the globalnotes module UI.
 */

const GlobalNotesView = {
    /**
     * Main render function
     * @param {HTMLElement} container 
     */
    render: function (container) {
        this.container = container || document.getElementById('editorView');
        if (!this.container) return;

        let activeBoard = GlobalNotesViewModel.getActiveBoard();
        if (!activeBoard) {
            GlobalNotesViewModel.init();
            activeBoard = GlobalNotesViewModel.getActiveBoard();
        }

        this.container.innerHTML = `
            <div class="globalnotes-container">
                ${this.renderHeader()}
                <div class="globalnotes-canvas-wrapper" style="flex: 1; position: relative; overflow: hidden; background: #f8fafc;">
                    <div id="globalnotesCanvas" class="globalnotes-canvas" style="width:100%; height:100%;">
                        <div id="globalnotesBoardContent" class="globalnotes-board-content">
                            <svg id="globalnotesConnectionsLayer" class="connections-layer"></svg>
                            <div id="globalnotesItemsLayer" class="items-layer"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.renderContent();
        this.setupEvents();

        if (typeof lucide !== 'undefined') lucide.createIcons();
    },

    renderHeader: function () {
        const board = GlobalNotesViewModel.getActiveBoard();
        if (!board) return '<div class="globalnotes-header"></div>';

        const hierarchy = this.getBoardHierarchy(board);

        return `
            <div class="globalnotes-header">
                <div class="globalnotes-breadcrumb">
                    <div class="breadcrumb-item" onclick="GlobalNotesViewModel.setActiveBoard(null)">
                        <i data-lucide="home" style="width:16px; height:16px;"></i>
                        <span>${Localization.t('globalnotes.breadcrumb.root') || 'GlobalNotes'}</span>
                    </div>
                    
                    ${hierarchy.map((b, idx) => `
                        <i data-lucide="chevron-right" class="breadcrumb-separator" style="width:14px; height:14px;"></i>
                        <div class="breadcrumb-item ${idx === hierarchy.length - 1 ? 'active' : ''}" 
                             onclick="GlobalNotesViewModel.setActiveBoard('${b.id}')">
                            ${b.title}
                        </div>
                    `).join('')}
                </div>
                <div class="globalnotes-header-actions">
                    <div class="btn-go-up" onclick="GlobalNotesViewModel.goUp()" title="${Localization.t('globalnotes.action.go_up') || 'Go Up'}">
                         <i data-lucide="corner-left-up"></i>
                    </div>
                </div>
            </div>
        `;
    },

    renderToolbar: function () {
        return '';
    },

    renderContent: function () {
        const boardContent = document.getElementById('globalnotesBoardContent');
        if (!boardContent) return;

        GlobalNotesViewModel.applyTransform();

        const items = GlobalNotesViewModel.getItemsInActiveBoard();
        const itemsLayer = document.getElementById('globalnotesItemsLayer');

        if (items.length === 0) {
            itemsLayer.innerHTML = `
                <div class="empty-board-placeholder">
                    <div class="empty-board-visual">
                        <i data-lucide="layout-grid"></i>
                    </div>
                    <div class="empty-board-text">
                        <div class="empty-title">${Localization.t('globalnotes.empty.title') || 'Votre tableau est prêt'}</div>
                        <div class="empty-desc">${Localization.t('globalnotes.empty.board') || 'Utilisez les outils à gauche pour ajouter des notes, des tableaux ou des images.'}</div>
                    </div>
                </div>
            `;
        } else {
            itemsLayer.innerHTML = items.map(item => GlobalNotesItemView.render(item)).join('');
        }

        this.renderConnections();

        if (typeof lucide !== 'undefined') lucide.createIcons({ root: boardContent });

        // Init sketches
        items.forEach(item => {
            if (item.type === 'sketch') {
                const canvas = document.querySelector(`.globalnotes-item[data-id="${item.id}"] canvas`);
                if (canvas) GlobalNotesHandlers.initSketch(item.id, canvas);
            }
        });

        this.updateSelection();
    },

    renderConnections: function () {
        const svg = document.getElementById('globalnotesConnectionsLayer');
        if (!svg) return;

        const board = GlobalNotesViewModel.getActiveBoard();
        if (!board || !board.connections) {
            svg.innerHTML = '';
            return;
        }

        const items = GlobalNotesRepository.getItems();
        let pathsHtml = '';

        board.connections.forEach(conn => {
            const fromItem = items.find(i => i.id == conn.from);
            const toItem = items.find(i => i.id == conn.to);

            if (fromItem && toItem) {
                // Calculate centers
                const x1 = fromItem.x + fromItem.width / 2;
                const y1 = fromItem.y + (fromItem.height === 'auto' ? 50 : fromItem.height / 2);
                const x2 = toItem.x + toItem.width / 2;
                const y2 = toItem.y + (toItem.height === 'auto' ? 50 : toItem.height / 2);

                // Bezier path
                const dx = Math.abs(x1 - x2);
                const dy = Math.abs(y1 - y2);
                const offset = Math.min(dx, dy, 100);

                const pathData = `M ${x1} ${y1} C ${x1 + (x1 < x2 ? offset : -offset)} ${y1}, ${x2 + (x2 < x1 ? offset : -offset)} ${y2}, ${x2} ${y2}`;

                pathsHtml += `
                    <!-- Hit area for better click detection -->
                    <path d="${pathData}" 
                          stroke="transparent" 
                          stroke-width="15" 
                          fill="none" 
                          style="pointer-events: stroke; cursor: pointer;"
                          oncontextmenu="GlobalNotesHandlers.showConnectionContextMenu(event, '${conn.id}')" />
                          
                    <path d="${pathData}" 
                          stroke="${conn.color || '#64748b'}" 
                          stroke-width="${conn.thickness || 2}" 
                          fill="none" 
                          stroke-linecap="round" 
                          class="connection-line"
                          style="pointer-events: none;" />
                `;
            }
        });

        svg.innerHTML = pathsHtml;
    },

    updateSelection: function () {
        const selectedIds = GlobalNotesViewModel.state.selectedItemIds;
        document.querySelectorAll('.globalnotes-item').forEach(el => {
            const id = el.getAttribute('data-id');
            if (selectedIds.includes(id)) {
                el.classList.add('selected');
            } else {
                el.classList.remove('selected');
            }
        });
    },

    addNewItem: function (type) {
        console.log('GlobalNotesView.addNewItem', type);
        const canvas = document.getElementById('globalnotesCanvas');
        if (!canvas) {
            console.error('Cannot find globalnotesCanvas to position item');
            return;
        }

        // Place in viewport center
        const rect = canvas.getBoundingClientRect();
        const centerX = (rect.width / 2 - GlobalNotesViewModel.state.panX) / GlobalNotesViewModel.state.zoom;
        const centerY = (rect.height / 2 - GlobalNotesViewModel.state.panY) / GlobalNotesViewModel.state.zoom;

        const x = centerX - 100;
        const y = centerY - 50;

        console.log('Calculated position relative to pan/zoom:', x, y);

        if (type === 'board') {
            GlobalNotesViewModel.createNewBoard(null, x, y);
        } else if (type === 'line') {
            GlobalNotesViewModel.state.isConnectionMode = true;
            GlobalNotesViewModel.state.connectionStartId = null;
            document.body.style.cursor = 'crosshair';
            alert('Connection Mode Active: Click the starting item, then the ending item.');
        } else {
            GlobalNotesViewModel.addItem(type, x, y);
        }
    },

    getBoardHierarchy: function (board) {
        const hierarchy = [];
        let current = board;
        const allBoards = GlobalNotesRepository.getBoards();

        while (current) {
            hierarchy.unshift(current);
            current = allBoards.find(b => b.id === current.parentId);
        }

        return hierarchy;
    },

    setupEvents: function () {
        // Handlers will be attached here or in a separate file
        if (window.GlobalNotesHandlers) {
            window.GlobalNotesHandlers.init();
        }
    }
};

window.GlobalNotesView = GlobalNotesView;
