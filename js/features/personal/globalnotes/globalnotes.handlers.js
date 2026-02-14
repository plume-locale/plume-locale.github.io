/**
 * [MVVM : globalnotes Handlers]
 * Handles user interactions (drag, resize, selection, navigation).
 */

const GlobalNotesHandlers = {
    dragData: {
        isDragging: false,
        type: null,
        startX: 0,
        startY: 0,
        targetId: null,
        items: [] // { id, initialX, initialY, el }
    },

    // Bound listeners for easy removal
    _bounds: {},

    init: function () {
        console.log('GlobalNotesHandlers.init() - canvas:', !!document.getElementById('globalnotesCanvas'));
        const canvas = document.getElementById('globalnotesCanvas');
        if (!canvas) return;

        // Create bound function proxies if they don't exist
        if (!this._bounds.onCanvasMouseDown) this._bounds.onCanvasMouseDown = this.onCanvasMouseDown.bind(this);
        if (!this._bounds.onWheel) this._bounds.onWheel = this.onWheel.bind(this);
        if (!this._bounds.onMouseMove) this._bounds.onMouseMove = this.onMouseMove.bind(this);
        if (!this._bounds.onMouseUp) this._bounds.onMouseUp = this.onMouseUp.bind(this);
        if (!this._bounds.onContextMenu) this._bounds.onContextMenu = this.onContextMenu.bind(this);

        // Remove old listeners to avoid duplicates
        canvas.removeEventListener('mousedown', this._bounds.onCanvasMouseDown);
        canvas.addEventListener('mousedown', this._bounds.onCanvasMouseDown);

        canvas.removeEventListener('wheel', this._bounds.onWheel);
        canvas.addEventListener('wheel', this._bounds.onWheel, { passive: false });

        canvas.removeEventListener('contextmenu', this._bounds.onContextMenu);
        canvas.addEventListener('contextmenu', this._bounds.onContextMenu);

        if (!this._windowListenersAttached) {
            window.addEventListener('mousemove', this._bounds.onMouseMove);
            window.addEventListener('mouseup', this._bounds.onMouseUp);
            window.addEventListener('click', () => this.hideContextMenu());
            this._windowListenersAttached = true;
            console.log('GlobalNotesHandlers: window listeners attached');
        }

        // Prevent default browser drag on images
        canvas.addEventListener('dragstart', (e) => e.preventDefault());
    },

    showConnectionContextMenu: function (e, connId) {
        e.preventDefault();
        e.stopPropagation();

        const menu = document.createElement('div');
        menu.className = 'globalnotes-context-menu';
        menu.style.left = e.clientX + 'px';
        menu.style.top = e.clientY + 'px';

        menu.innerHTML = `
            <div class="context-menu-title">Line Style</div>
            <div class="context-color-grid">
                <div class="color-dot" style="background:#64748b" onclick="GlobalNotesHandlers.setConnectionColor('${connId}', '#64748b')"></div>
                <div class="color-dot" style="background:#ef4444" onclick="GlobalNotesHandlers.setConnectionColor('${connId}', '#ef4444')"></div>
                <div class="color-dot" style="background:#3b82f6" onclick="GlobalNotesHandlers.setConnectionColor('${connId}', '#3b82f6')"></div>
                <div class="color-dot" style="background:#10b981" onclick="GlobalNotesHandlers.setConnectionColor('${connId}', '#10b981')"></div>
                <div class="color-dot" style="background:#f59e0b" onclick="GlobalNotesHandlers.setConnectionColor('${connId}', '#f59e0b')"></div>
                <div class="color-dot" style="background:#8b5cf6" onclick="GlobalNotesHandlers.setConnectionColor('${connId}', '#8b5cf6')"></div>
            </div>
            <div class="context-menu-divider"></div>
            <div class="context-menu-group horizontal">
                <div class="context-menu-btn" onclick="GlobalNotesHandlers.setConnectionThickness('${connId}', 1)">Thin</div>
                <div class="context-menu-btn" onclick="GlobalNotesHandlers.setConnectionThickness('${connId}', 3)">Medium</div>
                <div class="context-menu-btn" onclick="GlobalNotesHandlers.setConnectionThickness('${connId}', 6)">Wide</div>
            </div>
            <div class="context-menu-divider"></div>
            <div class="context-menu-item delete" onclick="GlobalNotesHandlers.deleteConnection('${connId}')">
                <i data-lucide="trash-2"></i> Delete Line
            </div>
        `;

        document.body.appendChild(menu);
        if (typeof lucide !== 'undefined') lucide.createIcons({ root: menu });

        const closeMenu = () => {
            if (menu) menu.remove();
            document.removeEventListener('mousedown', closeMenu);
        };
        setTimeout(() => document.addEventListener('mousedown', closeMenu), 10);
    },

    deleteConnection: function (connId) {
        if (confirm('Delete this connection?')) {
            GlobalNotesViewModel.deleteConnection(connId);
        }
    },

    setConnectionColor: function (connId, color) {
        GlobalNotesViewModel.updateConnection(connId, { color });
    },

    setConnectionThickness: function (connId, thickness) {
        GlobalNotesViewModel.updateConnection(connId, { thickness });
    },

    onContextMenu: function (e) {
        e.preventDefault();
        const itemEl = e.target.closest('.globalnotes-item');
        if (itemEl) {
            const itemId = itemEl.getAttribute('data-id');
            GlobalNotesViewModel.selectItem(itemId);
            this.showContextMenu(e.clientX, e.clientY, itemId);
        }
    },

    showContextMenu: function (x, y, itemId) {
        this.hideContextMenu();
        const item = GlobalNotesRepository.getItems().find(i => i.id == itemId);
        if (!item) return;

        const menu = document.createElement('div');
        menu.id = 'globalnotesContextMenu';
        menu.className = 'globalnotes-context-menu';
        menu.style.left = x + 'px';
        menu.style.top = y + 'px';

        const typeActions = this.getTypeSpecificActions(item);
        const isInColumn = !!item.columnId;

        menu.innerHTML = `
            ${typeActions ? `<div class="context-menu-group">${typeActions}</div><div class="context-menu-divider"></div>` : ''}
            <div class="context-menu-group">
                <div class="context-menu-item" onclick="GlobalNotesHandlers.duplicateItem('${itemId}')">
                    <i data-lucide="copy"></i> ${Localization.t('globalnotes.menu.duplicate') || 'Duplicate'}
                </div>
                <div class="context-menu-item" onclick="GlobalNotesHandlers.toggleLock('${itemId}')">
                    <i data-lucide="${item.config.isLocked ? 'unlock' : 'lock'}"></i> ${item.config.isLocked ? Localization.t('globalnotes.menu.unlock') || 'Unlock' : Localization.t('globalnotes.menu.lock') || 'Lock'}
                </div>
            </div>
            <div class="context-menu-divider"></div>
            <div class="context-menu-group">
                <div class="context-menu-item" onclick="GlobalNotesHandlers.bringToFront('${itemId}')">
                    <i data-lucide="bring-to-front"></i> ${Localization.t('globalnotes.menu.bring_front') || 'Bring to Front'}
                </div>
                <div class="context-menu-item" onclick="GlobalNotesHandlers.sendToBack('${itemId}')">
                    <i data-lucide="send-to-back"></i> ${Localization.t('globalnotes.menu.send_back') || 'Send to Back'}
                </div>
                ${isInColumn ? `
                <div class="context-menu-item" onclick="GlobalNotesHandlers.removeFromColumn('${itemId}'); GlobalNotesView.renderContent();">
                    <i data-lucide="log-out"></i> ${Localization.t('globalnotes.menu.extract_column') || 'Extract from Column'}
                </div>` : ''}
            </div>
            ${item.type !== 'color' ? `
            <div class="context-menu-divider"></div>
            <div class="context-menu-group">
                <div class="context-menu-item" onclick="GlobalNotesHandlers.hideContextMenu(); GlobalNotesHandlers.openColorPalette('${itemId}')">
                    <i data-lucide="palette"></i> ${Localization.t('globalnotes.menu.color') || 'Color'}
                    <span class="ctx-color-preview" style="background: ${item.config.color || '#ffffff'};"></span>
                </div>
            </div>
            ` : ''}
            <div class="context-menu-divider"></div>
            <div class="context-menu-item delete" onclick="GlobalNotesViewModel.deleteSelectedItem()">
                <i data-lucide="trash-2"></i> ${Localization.t('globalnotes.menu.delete') || 'Delete'}
            </div>
        `;

        document.body.appendChild(menu);

        // Repositionner si le menu déborde de l'écran
        const menuRect = menu.getBoundingClientRect();
        if (menuRect.right > window.innerWidth) menu.style.left = (x - menuRect.width) + 'px';
        if (menuRect.bottom > window.innerHeight) menu.style.top = (y - menuRect.height) + 'px';

        if (typeof lucide !== 'undefined') lucide.createIcons({ root: menu });
    },

    getTypeSpecificActions: function (item) {
        const id = item.id;
        switch (item.type) {
            case 'note':
                return `
                    <div class="context-menu-item" onclick="GlobalNotesHandlers.convertItemTo('${id}', 'checklist')">
                        <i data-lucide="list-checks"></i> ${Localization.t('globalnotes.menu.to_checklist') || 'Convert to Checklist'}
                    </div>
                    <div class="context-menu-item" onclick="GlobalNotesHandlers.convertItemTo('${id}', 'heading')">
                        <i data-lucide="heading"></i> ${Localization.t('globalnotes.menu.to_heading') || 'Convert to Heading'}
                    </div>
                `;
            case 'heading':
                return `
                    <div class="context-menu-item" onclick="GlobalNotesHandlers.convertItemTo('${id}', 'note')">
                        <i data-lucide="sticky-note"></i> ${Localization.t('globalnotes.menu.to_note') || 'Convert to Note'}
                    </div>
                `;
            case 'checklist':
                return `
                    <div class="context-menu-item" onclick="GlobalNotesHandlers.sortChecklist('${id}')">
                        <i data-lucide="arrow-down-narrow-wide"></i> ${Localization.t('globalnotes.menu.sort_checked') || 'Sort Checked to Bottom'}
                    </div>
                    <div class="context-menu-item" onclick="GlobalNotesHandlers.clearCompleted('${id}')">
                        <i data-lucide="check-check"></i> ${Localization.t('globalnotes.menu.clear_completed') || 'Clear Completed'}
                    </div>
                    <div class="context-menu-item" onclick="GlobalNotesHandlers.convertItemTo('${id}', 'note')">
                        <i data-lucide="sticky-note"></i> ${Localization.t('globalnotes.menu.to_note') || 'Convert to Note'}
                    </div>
                `;
            case 'image':
                return `
                    <div class="context-menu-item" onclick="GlobalNotesHandlers.triggerImageUpload('${id}')">
                        <i data-lucide="replace"></i> ${Localization.t('globalnotes.menu.replace_image') || 'Replace Image'}
                    </div>
                    <div class="context-menu-item" onclick="GlobalNotesHandlers.promptImageUrl('${id}')">
                        <i data-lucide="link"></i> ${Localization.t('globalnotes.menu.image_url') || 'Image from URL'}
                    </div>
                    ${item.data.url ? `
                    <div class="context-menu-item" onclick="GlobalNotesHandlers.downloadItemData('${id}')">
                        <i data-lucide="download"></i> ${Localization.t('globalnotes.menu.download') || 'Download'}
                    </div>` : ''}
                `;
            case 'link':
                return `
                    <div class="context-menu-item" onclick="window.open('${(item.data.url || '').replace(/'/g, "\\'")}', '_blank')">
                        <i data-lucide="external-link"></i> ${Localization.t('globalnotes.menu.open_link') || 'Open Link'}
                    </div>
                    <div class="context-menu-item" onclick="GlobalNotesHandlers.copyToClipboard('${(item.data.url || '').replace(/'/g, "\\'")}')">
                        <i data-lucide="clipboard-copy"></i> ${Localization.t('globalnotes.menu.copy_url') || 'Copy URL'}
                    </div>
                    <div class="context-menu-item" onclick="GlobalNotesHandlers.promptLinkUrl('${id}')">
                        <i data-lucide="edit-3"></i> ${Localization.t('globalnotes.menu.change_source') || 'Change URL'}
                    </div>
                `;
            case 'video':
                return `
                    <div class="context-menu-item" onclick="window.open('${(item.data.url || '').replace(/'/g, "\\'")}', '_blank')">
                        <i data-lucide="external-link"></i> ${Localization.t('globalnotes.menu.open_link') || 'Open in Browser'}
                    </div>
                    <div class="context-menu-item" onclick="GlobalNotesHandlers.promptVideoUrl('${id}')">
                        <i data-lucide="edit-3"></i> ${Localization.t('globalnotes.menu.change_source') || 'Change URL'}
                    </div>
                `;
            case 'board':
                return `
                    <div class="context-menu-item" onclick="GlobalNotesViewModel.setActiveBoard('${item.data.targetBoardId}'); updateSidebarActions();">
                        <i data-lucide="arrow-right-circle"></i> ${Localization.t('globalnotes.menu.open_board') || 'Open Board'}
                    </div>
                `;
            case 'table':
                return `
                    <div class="context-menu-item" onclick="GlobalNotesHandlers.addTableRow('${id}')">
                        <i data-lucide="rows-3"></i> ${Localization.t('globalnotes.menu.add_row') || 'Add Row'}
                    </div>
                    <div class="context-menu-item" onclick="GlobalNotesHandlers.addTableColumn('${id}')">
                        <i data-lucide="columns-3"></i> ${Localization.t('globalnotes.menu.add_col') || 'Add Column'}
                    </div>
                    <div class="context-menu-item" onclick="GlobalNotesHandlers.exportTableCSV('${id}')">
                        <i data-lucide="file-spreadsheet"></i> ${Localization.t('globalnotes.menu.export_csv') || 'Export as CSV'}
                    </div>
                `;
            case 'column':
                return `
                    <div class="context-menu-item" onclick="GlobalNotesHandlers.releaseColumnItems('${id}')">
                        <i data-lucide="ungroup"></i> ${Localization.t('globalnotes.menu.release_items') || 'Release All Items'}
                    </div>
                `;
            case 'map':
                return `
                    ${item.data.url ? `
                    <div class="context-menu-item" onclick="window.open('${(item.data.url || '').replace(/'/g, "\\'")}', '_blank')">
                        <i data-lucide="map-pin"></i> ${Localization.t('globalnotes.menu.open_map') || 'Open in Google Maps'}
                    </div>` : ''}
                    <div class="context-menu-item" onclick="GlobalNotesHandlers.promptMapUrl('${id}')">
                        <i data-lucide="edit-3"></i> ${Localization.t('globalnotes.menu.map_url') || 'Change Location'}
                    </div>
                `;
            case 'sketch':
                return `
                    <div class="context-menu-item" onclick="GlobalNotesHandlers.clearSketch('${id}')">
                        <i data-lucide="eraser"></i> ${Localization.t('globalnotes.menu.clear_sketch') || 'Clear Drawing'}
                    </div>
                `;
            case 'file':
                return `
                    <div class="context-menu-item" onclick="GlobalNotesHandlers.triggerFileUpload('${id}')">
                        <i data-lucide="replace"></i> ${Localization.t('globalnotes.menu.replace_file') || 'Replace File'}
                    </div>
                    ${item.data.url ? `
                    <div class="context-menu-item" onclick="GlobalNotesHandlers.downloadItemData('${id}')">
                        <i data-lucide="download"></i> ${Localization.t('globalnotes.menu.download') || 'Download'}
                    </div>` : ''}
                `;
            case 'color':
                return `
                    <div class="context-menu-item" onclick="GlobalNotesHandlers.promptColorChange('${id}')">
                        <i data-lucide="pipette"></i> ${Localization.t('globalnotes.menu.change_color') || 'Change Color'}
                    </div>
                `;
            default:
                return '';
        }
    },

    hideContextMenu: function () {
        const menu = document.getElementById('globalnotesContextMenu');
        if (menu) menu.remove();
    },

    duplicateItem: function (itemId) {
        const item = GlobalNotesRepository.getItems().find(i => i.id == itemId);
        if (item) {
            const newItem = GlobalNotesModel.createItem({
                ...item,
                id: null, // Force new ID
                x: item.x + 20,
                y: item.y + 20
            });
            GlobalNotesRepository.saveItem(newItem);
            GlobalNotesView.renderContent();
        }
    },

    toggleLock: function (itemId) {
        const item = GlobalNotesRepository.getItems().find(i => i.id == itemId);
        if (item) {
            item.config.isLocked = !item.config.isLocked;
            GlobalNotesRepository.saveItem(item);
            GlobalNotesView.renderContent();
        }
    },

    setItemColor: function (itemId, color) {
        const item = GlobalNotesRepository.getItems().find(i => i.id == itemId);
        if (item) {
            item.config.color = color;
            GlobalNotesRepository.saveItem(item);
            GlobalNotesView.renderContent();
        }
    },

    promptImageUrl: function (itemId) {
        const url = prompt(Localization.t('globalnotes.prompt.image_url') || 'Enter Image URL:');
        if (url) {
            GlobalNotesViewModel.updateItemData(itemId, { url: url });
            GlobalNotesView.renderContent();
        }
    },

    triggerImageUpload: function (itemId) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    GlobalNotesViewModel.updateItemData(itemId, { url: event.target.result });
                    GlobalNotesView.renderContent();
                };
                reader.readAsDataURL(file);
            }
        };
        input.click();
    },

    promptVideoUrl: function (itemId) {
        const url = prompt(Localization.t('globalnotes.prompt.video_url') || 'Enter YouTube Video URL:');
        if (url) {
            GlobalNotesViewModel.updateItemData(itemId, { url: url });
            GlobalNotesView.renderContent();
        }
    },

    promptLinkUrl: function (itemId) {
        let url = prompt(Localization.t('globalnotes.prompt.link_url') || 'Enter Link URL (e.g., https://google.com):');
        if (url) {
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                url = 'https://' + url;
            }
            GlobalNotesViewModel.updateItemData(itemId, { url: url, title: url });
            GlobalNotesView.renderContent();
        }
    },

    updateLinkTitle: function (itemId, newTitle, event) {
        if (event) event.stopPropagation();
        GlobalNotesViewModel.updateItemData(itemId, { title: newTitle });
    },

    promptColorChange: function (itemId) {
        this.openColorPalette(itemId);
    },

    openColorPalette: function (itemId) {
        const item = GlobalNotesRepository.getItems().find(i => i.id == itemId);
        if (!item) return;

        // Clean up any existing palette
        this.hideColorPalette();

        const colors = ColorPaletteModel.colors;
        const picker = document.createElement('div');
        picker.id = 'globalnotesColorPalette'; // Matches CSS animation if we rename it or use it as is
        picker.className = 'globalnotes-color-palette-popup';

        const itemEl = document.querySelector(`.globalnotes-item[data-id="${itemId}"]`);
        const rect = itemEl.getBoundingClientRect();

        picker.style.left = rect.left + 'px';
        picker.style.top = (rect.bottom + 5) + 'px';
        picker.style.display = 'block';
        picker.style.opacity = '1';
        picker.style.pointerEvents = 'auto';

        // Adjust if off-screen (approximative height calculation)
        const pickerHeight = 240;
        if (rect.bottom + 5 + pickerHeight > window.innerHeight) {
            picker.style.top = (rect.top - pickerHeight - 5) + 'px';
        }

        let colorsHtml = colors.map(color => `
            <div class="palette-swatch" 
                 style="background: ${color}" 
                 onmousedown="event.stopPropagation(); GlobalNotesHandlers.applyItemColor('${itemId}', '${color}')"
                 title="${color}"></div>
        `).join('');

        picker.innerHTML = `
            <div class="palette-grid">
                ${colorsHtml}
            </div>
            <div class="palette-custom">
                <input type="color" value="${item.config.color || '#4361ee'}" 
                       oninput="event.stopPropagation(); GlobalNotesHandlers.applyItemColor('${itemId}', this.value)"
                       onmousedown="event.stopPropagation()">
                <input type="text" value="${item.config.color || '#4361ee'}" 
                       onchange="event.stopPropagation(); GlobalNotesHandlers.applyItemColor('${itemId}', this.value)"
                       onmousedown="event.stopPropagation()">
            </div>
        `;

        document.body.appendChild(picker);
        if (typeof lucide !== 'undefined') lucide.createIcons({ root: picker });

        // Close on outside click
        const closePalette = (e) => {
            if (!picker.contains(e.target) && !e.target.closest('.color-preview-circle')) {
                this.hideColorPalette();
                document.removeEventListener('mousedown', closePalette, true);
            }
        };
        setTimeout(() => document.addEventListener('mousedown', closePalette, true), 10);
    },

    hideColorPalette: function () {
        const picker = document.getElementById('globalnotesColorPalette');
        if (picker) picker.remove();
    },

    applyItemColor: function (itemId, color) {
        if (!color.startsWith('#')) color = '#' + color;
        const item = GlobalNotesRepository.getItems().find(i => i.id == itemId);
        if (item) {
            item.config.color = color;
            GlobalNotesRepository.saveItem(item);
            GlobalNotesView.renderContent();
            this.hideColorPalette();
        }
    },

    promptMapUrl: function (itemId) {
        const item = GlobalNotesRepository.getItems().find(i => i.id == itemId);
        if (!item) return;

        const url = prompt(Localization.t('globalnotes.prompt.map_url') || 'Google Maps URL:', item.data.url || '');
        if (url === null) return;

        const coords = this.extractCoordsFromMapUrl(url);
        const update = { url: url };

        if (coords) {
            update.lat = coords.lat;
            update.lng = coords.lng;
        }

        GlobalNotesViewModel.updateItemData(itemId, update);
    },

    extractCoordsFromMapUrl: function (url) {
        if (!url) return null;
        // Search for @lat,lng in the URL (Google Maps standard)
        const match = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
        if (match) {
            return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
        }
        // Also search for query params if applicable
        const urlParams = new URLSearchParams(url.split('?')[1]);
        const q = urlParams.get('q');
        if (q && q.includes(',')) {
            const parts = q.split(',');
            if (!isNaN(parts[0]) && !isNaN(parts[1])) {
                return { lat: parseFloat(parts[0]), lng: parseFloat(parts[1]) };
            }
        }
        return null;
    },

    editMapItem: function (itemId) {
        const item = GlobalNotesRepository.getItems().find(i => i.id == itemId);
        if (!item) return;

        const title = prompt(Localization.t('globalnotes.prompt.map_title') || 'Map Title:', item.data.title || 'Location');
        if (title === null) return;

        const lat = prompt(Localization.t('globalnotes.prompt.latitude') || 'Latitude:', item.data.lat || 48.8566);
        if (lat === null) return;

        const lng = prompt(Localization.t('globalnotes.prompt.longitude') || 'Longitude:', item.data.lng || 2.3522);
        if (lng === null) return;

        GlobalNotesViewModel.updateItemData(itemId, {
            title: title,
            lat: parseFloat(lat),
            lng: parseFloat(lng)
        });
    },

    clearContent: function (itemId) {
        const item = GlobalNotesRepository.getItems().find(i => i.id == itemId);
        if (item) {
            if (item.type === 'note') GlobalNotesViewModel.updateItemData(itemId, { content: '' });
            if (item.type === 'heading') GlobalNotesViewModel.updateItemData(itemId, { text: '' });
            GlobalNotesView.renderContent();
        }
    },

    setItemBorderColor: function (itemId, color) {
        const item = GlobalNotesRepository.getItems().find(i => i.id == itemId);
        if (item) {
            item.config.borderColor = color;
            GlobalNotesRepository.saveItem(item);
            GlobalNotesView.renderContent();
        }
    },

    setItemBorderThickness: function (itemId, thickness) {
        const item = GlobalNotesRepository.getItems().find(i => i.id == itemId);
        if (item) {
            item.config.borderThickness = thickness;
            GlobalNotesRepository.saveItem(item);
            GlobalNotesView.renderContent();
        }
    },

    // ---- Actions contextuelles avancées ----

    bringToFront: function (itemId) {
        const items = GlobalNotesRepository.getItems();
        const item = items.find(i => i.id == itemId);
        if (!item) return;
        const maxZ = items.reduce((max, i) => Math.max(max, i.zIndex || 1), 1);
        item.zIndex = maxZ + 1;
        GlobalNotesRepository.saveItem(item);
        GlobalNotesView.renderContent();
        this.hideContextMenu();
    },

    sendToBack: function (itemId) {
        const items = GlobalNotesRepository.getItems();
        const item = items.find(i => i.id == itemId);
        if (!item) return;
        const minZ = items.reduce((min, i) => Math.min(min, i.zIndex || 1), 1);
        item.zIndex = Math.max(minZ - 1, 0);
        GlobalNotesRepository.saveItem(item);
        GlobalNotesView.renderContent();
        this.hideContextMenu();
    },

    convertItemTo: function (itemId, targetType) {
        const item = GlobalNotesRepository.getItems().find(i => i.id == itemId);
        if (!item) return;

        const oldType = item.type;

        if (oldType === 'note' && targetType === 'checklist') {
            // Extraire les lignes du HTML et les convertir en items
            const div = document.createElement('div');
            div.innerHTML = item.data.content || '';
            const text = div.innerText || '';
            const lines = text.split('\n').filter(l => l.trim());
            item.type = 'checklist';
            item.data = {
                title: lines[0] || '',
                items: lines.slice(1).map((line, i) => ({ id: 'ci_' + Date.now() + '_' + i, text: line.trim(), checked: false }))
            };
            if (item.data.items.length === 0) item.data.items = [{ id: 'ci_' + Date.now(), text: '', checked: false }];
            item.height = 'auto';
        } else if (oldType === 'note' && targetType === 'heading') {
            const div = document.createElement('div');
            div.innerHTML = item.data.content || '';
            item.type = 'heading';
            item.data = { text: div.innerText || '' };
            item.width = Math.max(item.width, 300);
            item.height = 'auto';
        } else if (oldType === 'heading' && targetType === 'note') {
            item.type = 'note';
            item.data = { content: item.data.text || '' };
            item.height = 150;
        } else if (oldType === 'checklist' && targetType === 'note') {
            const title = item.data.title || '';
            const lines = (item.data.items || []).map(ci => (ci.checked ? '✓ ' : '○ ') + ci.text);
            item.type = 'note';
            item.data = { content: (title ? title + '\n' : '') + lines.join('\n') };
            item.height = 150;
        } else {
            return;
        }

        GlobalNotesRepository.saveItem(item);
        GlobalNotesView.renderContent();
        this.hideContextMenu();
    },

    sortChecklist: function (itemId) {
        const item = GlobalNotesRepository.getItems().find(i => i.id == itemId);
        if (!item || item.type !== 'checklist' || !item.data.items) return;
        item.data.items.sort((a, b) => (a.checked === b.checked) ? 0 : a.checked ? 1 : -1);
        GlobalNotesRepository.saveItem(item);
        GlobalNotesView.renderContent();
        this.hideContextMenu();
    },

    clearCompleted: function (itemId) {
        const item = GlobalNotesRepository.getItems().find(i => i.id == itemId);
        if (!item || item.type !== 'checklist' || !item.data.items) return;
        item.data.items = item.data.items.filter(ci => !ci.checked);
        if (item.data.items.length === 0) item.data.items = [{ id: 'ci_' + Date.now(), text: '', checked: false }];
        GlobalNotesRepository.saveItem(item);
        GlobalNotesView.renderContent();
        this.hideContextMenu();
    },

    exportTableCSV: function (itemId) {
        const item = GlobalNotesRepository.getItems().find(i => i.id == itemId);
        if (!item || item.type !== 'table') return;
        const headers = item.data.headers || [];
        const rows = item.data.data || [];
        const escape = (v) => '"' + String(v || '').replace(/"/g, '""') + '"';
        let csv = headers.map(escape).join(',') + '\n';
        rows.forEach(row => { csv += row.map(escape).join(',') + '\n'; });
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'table_export.csv';
        a.click();
        URL.revokeObjectURL(a.href);
        this.hideContextMenu();
    },

    releaseColumnItems: function (columnId) {
        const items = GlobalNotesRepository.getItems();
        const column = items.find(i => i.id == columnId);
        if (!column || column.type !== 'column') return;
        const childIds = [...(column.data.items || [])];
        childIds.forEach((childId, index) => {
            const child = items.find(i => i.id === childId);
            if (child) {
                child.columnId = null;
                child.x = column.x + 20 + (index * 15);
                child.y = column.y + 60 + (index * 15);
                GlobalNotesRepository.saveItem(child);
            }
        });
        column.data.items = [];
        GlobalNotesRepository.saveItem(column);
        GlobalNotesView.renderContent();
        this.hideContextMenu();
    },

    downloadItemData: function (itemId) {
        const item = GlobalNotesRepository.getItems().find(i => i.id == itemId);
        if (!item) return;
        const url = item.data.url;
        if (!url) return;
        const a = document.createElement('a');
        a.href = url;
        a.download = item.data.name || item.data.caption || 'download';
        a.click();
        this.hideContextMenu();
    },

    copyToClipboard: function (text) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text);
        } else {
            const ta = document.createElement('textarea');
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            ta.remove();
        }
        if (typeof showNotification === 'function') showNotification(Localization.t('globalnotes.notify.copied') || 'Copied!');
        this.hideContextMenu();
    },

    toggleMoreMenu: function (e) {
        e.stopPropagation();
        const menu = document.getElementById('globalnotesMoreMenu');
        if (menu) {
            menu.classList.toggle('hidden');
        }
    },

    updateTableData: function (itemId, row, col, val) {
        const item = GlobalNotesRepository.getItems().find(i => i.id == itemId);
        if (item && item.data.data) {
            if (!item.data.data[row]) item.data.data[row] = [];
            item.data.data[row][col] = val;
            GlobalNotesRepository.saveItem(item);
        }
    },

    updateTableHeader: function (itemId, col, val) {
        const item = GlobalNotesRepository.getItems().find(i => i.id == itemId);
        if (item && item.data.headers) {
            item.data.headers[col] = val;
            GlobalNotesRepository.saveItem(item);
        }
    },

    addTableRow: function (itemId) {
        const item = GlobalNotesRepository.getItems().find(i => i.id == itemId);
        if (item) {
            item.data.rows++;
            const newRow = Array(item.data.cols).fill('');
            item.data.data.push(newRow);
            GlobalNotesRepository.saveItem(item);
            GlobalNotesView.renderContent();
        }
    },

    deleteTableRow: function (itemId, rowIndex) {
        const item = GlobalNotesRepository.getItems().find(i => i.id == itemId);
        if (item && item.data.rows > 1) {
            item.data.rows--;
            item.data.data.splice(rowIndex, 1);
            GlobalNotesRepository.saveItem(item);
            GlobalNotesView.renderContent();
        } else if (item && item.data.rows === 1) {
            // Optional: reset row if last one, or do nothing
            item.data.data[0] = Array(item.data.cols).fill('');
            GlobalNotesRepository.saveItem(item);
            GlobalNotesView.renderContent();
        }
    },

    addTableColumn: function (itemId) {
        const item = GlobalNotesRepository.getItems().find(i => i.id == itemId);
        if (item) {
            item.data.cols++;
            if (!item.data.headers) item.data.headers = Array(item.data.cols - 1).fill('');
            item.data.headers.push('');
            item.data.data.forEach(row => row.push(''));

            // Adjust width to fit
            item.width += 100;

            GlobalNotesRepository.saveItem(item);
            GlobalNotesView.renderContent();
        }
    },

    deleteTableColumn: function (itemId, colIndex) {
        const item = GlobalNotesRepository.getItems().find(i => i.id == itemId);
        if (item && item.data.cols > 1) {
            item.data.cols--;
            if (item.data.headers) item.data.headers.splice(colIndex, 1);
            item.data.data.forEach(row => row.splice(colIndex, 1));

            // Adjust width
            item.width = Math.max(200, item.width - 100);

            GlobalNotesRepository.saveItem(item);
            GlobalNotesView.renderContent();
        }
    },

    openDocument: function (itemId) {
        alert('Opening document editor for ' + itemId);
    },

    renameBoard: function (itemId, newTitle, event) {
        if (event) event.stopPropagation();
        const item = GlobalNotesRepository.getItems().find(i => i.id === itemId);
        if (item && item.type === 'board') {
            // Update the item on the parent board
            GlobalNotesViewModel.updateItemData(itemId, { title: newTitle });
            // Update the actual board name
            const targetBoardId = item.data.targetBoardId;
            const board = GlobalNotesRepository.getBoards().find(b => b.id == targetBoardId);
            if (board) {
                board.title = newTitle;
                GlobalNotesRepository.saveBoard(board);
            }
            GlobalNotesView.renderHeader();
        }
    },

    moveToColumn: function (itemId, columnId, index = -1) {
        const items = GlobalNotesRepository.getItems();
        const item = items.find(i => i.id == itemId);
        const column = items.find(i => i.id == columnId);

        if (item && column && column.type === 'column') {
            const oldColumnId = item.columnId;
            item.columnId = columnId;

            if (!column.data.items) column.data.items = [];

            // Remove from old column index array if it was there
            if (oldColumnId && oldColumnId !== columnId) {
                const oldColumn = items.find(i => i.id === oldColumnId);
                if (oldColumn && oldColumn.data.items) {
                    oldColumn.data.items = oldColumn.data.items.filter(id => id !== itemId);
                    GlobalNotesRepository.saveItem(oldColumn);
                }
            }

            // Add to new column
            if (!column.data.items.includes(itemId)) {
                if (index >= 0) {
                    column.data.items.splice(index, 0, itemId);
                } else {
                    column.data.items.push(itemId);
                }
            }

            GlobalNotesRepository.saveItem(item);
            GlobalNotesRepository.saveItem(column);
        }
    },

    reorderInColumn: function (itemId, columnId, targetIndex) {
        const column = GlobalNotesRepository.getItems().find(i => i.id == columnId);
        if (column && column.data.items) {
            const currentIndex = column.data.items.indexOf(itemId);
            if (currentIndex !== -1) {
                column.data.items.splice(currentIndex, 1);
                column.data.items.splice(targetIndex, 0, itemId);
                GlobalNotesRepository.saveItem(column);
            }
        }
    },

    removeFromColumn: function (itemId) {
        const items = GlobalNotesRepository.getItems();
        const item = items.find(i => i.id == itemId);
        const el = document.querySelector(`.globalnotes-item[data-id="${itemId}"]`);

        if (item && el) {
            const oldColumnId = item.columnId;
            const contentRect = document.getElementById('globalnotesBoardContent').getBoundingClientRect();
            const itemRect = el.getBoundingClientRect();
            const zoom = GlobalNotesViewModel.state.zoom;

            item.columnId = null;
            item.x = (itemRect.left - contentRect.left) / zoom;
            item.y = (itemRect.top - contentRect.top) / zoom;

            if (oldColumnId) {
                const oldColumn = items.find(i => i.id === oldColumnId);
                if (oldColumn && oldColumn.data.items) {
                    oldColumn.data.items = oldColumn.data.items.filter(id => id !== itemId);
                    GlobalNotesRepository.saveItem(oldColumn);
                }
            }

            GlobalNotesRepository.saveItem(item);
        }
    },

    onWheel: function (e) {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const zoomSpeed = 0.001;
            const delta = -e.deltaY;
            const factor = Math.pow(1.1, delta / 100);

            const oldZoom = GlobalNotesViewModel.state.zoom;
            const newZoom = oldZoom * factor;

            // To zoom towards mouse, we need to adjust panX/panY but for now let's keep it simple
            GlobalNotesViewModel.setZoom(newZoom);
        }
    },

    onCanvasMouseDown: function (e) {
        if (e.target.id === 'globalnotesCanvas' || e.target.id === 'globalnotesBoardContent') {
            GlobalNotesViewModel.clearSelection();

            // Start canvas panning
            this.dragData = {
                isDragging: true,
                type: 'canvas',
                startX: e.clientX,
                startY: e.clientY,
                initialX: GlobalNotesViewModel.state.panX,
                initialY: GlobalNotesViewModel.state.panY
            };
        }
    },

    getDropIndex: function (dropzone, mouseY) {
        const children = Array.from(dropzone.querySelectorAll('.globalnotes-item:not(.dragging)'));
        if (children.length === 0) return 0;

        for (let i = 0; i < children.length; i++) {
            const rect = children[i].getBoundingClientRect();
            const middle = rect.top + rect.height / 2;
            if (mouseY < middle) {
                return i;
            }
        }
        return children.length;
    },

    onItemMouseDown: function (e, itemId) {
        // Handle Connection Mode
        if (GlobalNotesViewModel.state.isConnectionMode) {
            e.stopPropagation(); // Restored to allow nested items to be selected as sources
            if (!GlobalNotesViewModel.state.connectionStartId) {
                GlobalNotesViewModel.state.connectionStartId = itemId;
                // Highlight the selected item or provide feedback
                const el = document.querySelector(`.globalnotes-item[data-id="${itemId}"]`);
                if (el) el.classList.add('connection-source');
                console.log('Connection start item selected:', itemId);
            } else {
                const startId = GlobalNotesViewModel.state.connectionStartId;
                GlobalNotesViewModel.addConnection(startId, itemId);

                // Reset mode
                GlobalNotesViewModel.state.isConnectionMode = false;
                GlobalNotesViewModel.state.connectionStartId = null;
                document.body.style.cursor = 'default';
                document.querySelectorAll('.connection-source').forEach(el => el.classList.remove('connection-source'));
                console.log('Connection created between', startId, 'and', itemId);
            }
            return;
        }

        // If clicking on an interactive element, don't start dragging
        const interactiveSelectors = 'button, input, select, textarea, [contenteditable="true"], .color-preview-circle, .checklist-text, .check-box, .item-table-container td, .map-info, .file-placeholder, .file-content';
        if (e.target.closest(interactiveSelectors)) {
            return;
        }

        const item = GlobalNotesRepository.getItems().find(i => i.id == itemId);
        if (item && item.config.isLocked) return;

        console.log('onItemMouseDown', itemId);
        e.stopPropagation(); // Restored to prevent parent column from stealing selection

        const isMulti = e.shiftKey || e.ctrlKey || e.metaKey;
        GlobalNotesViewModel.selectItem(itemId, isMulti);

        const itemsToDrag = [];
        GlobalNotesViewModel.state.selectedItemIds.forEach(id => {
            const el = document.querySelector(`.globalnotes-item[data-id="${id}"]`);
            if (el) {
                // Determine if we should drag this item (don't drag child if parent is also being dragged)
                // Actually, for simplicity, we drag anything selected. 
                // BUT if it's in a column, it should only move if its parent column is NOT in selection
                const itm = GlobalNotesRepository.getItems().find(i => i.id == id);
                if (itm && itm.columnId && GlobalNotesViewModel.state.selectedItemIds.includes(itm.columnId)) {
                    // Parent is moving, don't move child explicitly
                    return;
                }

                itemsToDrag.push({
                    id: id,
                    el: el,
                    initialX: parseInt(el.style.left) || 0,
                    initialY: parseInt(el.style.top) || 0
                });
            }
        });

        this.dragData = {
            isDragging: true,
            hasMoved: false,
            type: 'item',
            startX: e.clientX,
            startY: e.clientY,
            targetId: itemId,
            items: itemsToDrag
        };
    },

    onResizeStart: function (e, itemId) {
        const item = GlobalNotesRepository.getItems().find(i => i.id == itemId);
        if (item && item.config.isLocked) return;

        e.stopPropagation();
        e.preventDefault();

        const el = document.querySelector(`.globalnotes-item[data-id="${itemId}"]`);
        if (!el) return;

        this.dragData = {
            isDragging: true,
            type: 'resize',
            startX: e.clientX,
            startY: e.clientY,
            initialWidth: el.offsetWidth,
            initialHeight: el.offsetHeight,
            targetId: itemId
        };
    },

    onMouseMove: function (e) {
        if (!this.dragData.isDragging) return;

        const dx = e.clientX - this.dragData.startX;
        const dy = e.clientY - this.dragData.startY;

        // Threshold for dragging (avoid intercepting clicks/dblclicks)
        if (!this.dragData.hasMoved) {
            if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
                this.dragData.hasMoved = true;
                // Add dragging class only after threshold
                this.dragData.items.forEach(dragItem => {
                    dragItem.el.classList.add('dragging');
                });
            } else {
                return;
            }
        }

        if (this.dragData.type === 'item') {
            const zoom = GlobalNotesViewModel.state.zoom;
            this.dragData.items.forEach(dragItem => {
                dragItem.el.style.left = (dragItem.initialX + dx / zoom) + 'px';
                dragItem.el.style.top = (dragItem.initialY + dy / zoom) + 'px';
            });

            // Highlight dropzone if dragging a single item
            if (this.dragData.items.length === 1) {
                document.querySelectorAll('.column-items-dropzone').forEach(dz => {
                    dz.classList.remove('drag-over');
                    const existingPlaceholder = dz.querySelector('.drop-placeholder');
                    if (existingPlaceholder) existingPlaceholder.remove();
                });

                const dropzone = document.elementFromPoint(e.clientX, e.clientY)?.closest('.column-items-dropzone');
                if (dropzone) {
                    const columnId = dropzone.getAttribute('data-column-id');
                    const draggedId = this.dragData.targetId;

                    if (columnId !== draggedId) {
                        dropzone.classList.add('drag-over');

                        // Show placeholder for reordering
                        const index = this.getDropIndex(dropzone, e.clientY);
                        const placeholder = document.createElement('div');
                        placeholder.className = 'drop-placeholder';
                        placeholder.style.height = '4px';
                        placeholder.style.background = 'var(--primary-color)';
                        placeholder.style.margin = '4px 0';
                        placeholder.style.borderRadius = '2px';

                        const children = dropzone.querySelectorAll('.globalnotes-item:not(.dragging)');
                        if (index < children.length) {
                            dropzone.insertBefore(placeholder, children[index]);
                        } else {
                            dropzone.appendChild(placeholder);
                        }

                        this.dragData.dropIndex = index;
                    }
                } else {
                    this.dragData.dropIndex = -1;
                }
            }
        }
        else if (this.dragData.type === 'canvas') {
            GlobalNotesViewModel.setPan(
                this.dragData.initialX + dx,
                this.dragData.initialY + dy
            );
        }
        else if (this.dragData.type === 'resize') {
            const el = document.querySelector(`.globalnotes-item[data-id="${this.dragData.targetId}"]`);
            if (el) {
                const zoom = GlobalNotesViewModel.state.zoom;
                const newWidth = Math.max(50, this.dragData.initialWidth + dx / zoom);
                const newHeight = Math.max(30, this.dragData.initialHeight + dy / zoom);
                el.style.width = newWidth + 'px';
                el.style.height = newHeight + 'px';
            }
        }
    },

    onMouseUp: function (e) {
        if (!this.dragData.isDragging) return;

        if (this.dragData.type === 'item') {
            document.querySelectorAll('.column-items-dropzone').forEach(dz => dz.classList.remove('drag-over'));

            const targetEl = document.elementFromPoint(e.clientX, e.clientY);
            let dropColumnId = null;
            const dropzone = targetEl?.closest('.column-items-dropzone') || targetEl?.closest('.globalnotes-item-column')?.querySelector('.column-items-dropzone');

            if (dropzone) {
                dropColumnId = dropzone.getAttribute('data-column-id');
            }

            // Process all dragged items
            this.dragData.items.forEach(dragItem => {
                dragItem.el.classList.remove('dragging');
                if (!this.dragData.hasMoved) return;

                const item = GlobalNotesRepository.getItems().find(i => i.id == dragItem.id);
                if (!item) return;

                if (dropColumnId) {
                    // Prevent moving a column into itself or into another column (columns are top-level only in this model)
                    if (item.type !== 'column' && item.id !== dropColumnId) {
                        const targetIndex = this.dragData.dropIndex !== undefined ? this.dragData.dropIndex : -1;
                        if (item.columnId === dropColumnId) {
                            // Reorder within the same column
                            this.reorderInColumn(item.id, dropColumnId, targetIndex);
                        } else {
                            // Move to new column
                            this.moveToColumn(item.id, dropColumnId, targetIndex);
                        }
                    } else if (!item.columnId) {
                        // If it's a column or it can't enter, just update position
                        GlobalNotesViewModel.updateItemPosition(item.id, parseInt(dragItem.el.style.left), parseInt(dragItem.el.style.top));
                    }
                } else if (item.columnId) {
                    // Pulling out of a column
                    this.removeFromColumn(item.id);
                } else {
                    // Standard update
                    GlobalNotesViewModel.updateItemPosition(item.id, parseInt(dragItem.el.style.left), parseInt(dragItem.el.style.top));
                }
            });

            if (this.dragData.hasMoved) {
                GlobalNotesView.renderContent();
            }
        }
        else if (this.dragData.type === 'resize') {
            const el = document.querySelector(`.globalnotes-item[data-id="${this.dragData.targetId}"]`);
            if (el) {
                const item = GlobalNotesRepository.getItems().find(i => i.id == this.dragData.targetId);
                if (item) {
                    GlobalNotesRepository.saveItem({
                        ...item,
                        width: parseInt(el.style.width),
                        height: parseInt(el.style.height)
                    });
                }
            }
        }

        this.dragData.isDragging = false;
        this.dragData.type = null;
    },

    onItemDbClick: function (e, itemId) {
        // If clicking on an editable element, don't trigger navigation
        if (e.target.isContentEditable || e.target.closest('[contenteditable="true"]')) {
            return;
        }

        const item = GlobalNotesRepository.getItems().find(i => i.id === itemId);
        if (item && item.type === 'board') {
            GlobalNotesViewModel.setActiveBoard(item.data.targetBoardId);
        }
    },

    // --- Checklist Handlers ---

    toggleChecklistItem: function (itemId, index) {
        const item = GlobalNotesRepository.getItems().find(i => i.id === itemId);
        if (item && item.data.items) {
            item.data.items[index].checked = !item.data.items[index].checked;
            GlobalNotesRepository.saveItem(item);
            GlobalNotesView.renderContent();
        }
    },

    updateChecklistItem: function (itemId, index, text) {
        const item = GlobalNotesRepository.getItems().find(i => i.id === itemId);
        if (item && item.data.items) {
            item.data.items[index].text = text;
            GlobalNotesRepository.saveItem(item);
        }
    },

    addChecklistItem: function (itemId) {
        const item = GlobalNotesRepository.getItems().find(i => i.id === itemId);
        if (item && item.data.items) {
            item.data.items.push({ id: 'cli_' + Math.random().toString(36).substr(2, 5), text: '', checked: false });
            GlobalNotesRepository.saveItem(item);
            GlobalNotesView.renderContent();
        }
    },

    triggerFileUpload: function (itemId) {
        const input = document.createElement('input');
        input.type = 'file';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const data = {
                        name: file.name,
                        size: (file.size / 1024).toFixed(1) + ' KB',
                        type: file.type || 'File',
                        url: event.target.result // Store DataURL for local access
                    };
                    GlobalNotesViewModel.updateItemData(itemId, data);
                    GlobalNotesView.renderContent();
                };
                reader.readAsDataURL(file);
            }
        };
        input.click();
    },

    // --- SKETCH LOGIC ---
    sketchData: {}, // Store temporary context for active sketches

    initSketch: function (itemId, canvas) {
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const zoom = (typeof GlobalNotesViewModel !== 'undefined') ? GlobalNotesViewModel.state.zoom : 1;
        const rect = canvas.getBoundingClientRect();

        // getBoundingClientRect returns dimensions scaled by zoom, so divide to get CSS size
        const cssWidth = rect.width / zoom;
        const cssHeight = rect.height / zoom;

        canvas.width = cssWidth * dpr;
        canvas.height = cssHeight * dpr;
        ctx.scale(dpr, dpr);

        ctx.strokeStyle = canvas.getAttribute('data-color') || '#333';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        this.sketchData[itemId] = {
            ctx: ctx,
            isDrawing: false,
            points: []
        };

        // Load existing image if any
        const item = GlobalNotesRepository.getItems().find(i => i.id == itemId);
        if (item && item.data.image) {
            const img = new Image();
            img.onload = () => ctx.drawImage(img, 0, 0, cssWidth, cssHeight);
            img.src = item.data.image;
        }
    },

    setSketchColor: function (itemId, color, el) {
        const data = this.sketchData[itemId];
        if (data) data.ctx.strokeStyle = color;

        // Update UI
        const container = el.closest('.sketch-tools');
        container.querySelectorAll('.sketch-color').forEach(c => c.classList.remove('active'));
        el.classList.add('active');

        const canvas = el.closest('.item-sketch').querySelector('canvas');
        if (canvas) canvas.setAttribute('data-color', color);
    },

    clearSketch: function (itemId) {
        const data = this.sketchData[itemId];
        if (!data) return;

        const canvas = data.ctx.canvas;
        data.ctx.clearRect(0, 0, canvas.width, canvas.height);
        GlobalNotesViewModel.updateItemData(itemId, { image: null });
    },

    startSketch: function (e, itemId) {
        e.stopPropagation(); // Don't drag while drawing
        const data = this.sketchData[itemId];
        if (!data) return;

        data.isDrawing = true;
        const zoom = (typeof GlobalNotesViewModel !== 'undefined') ? GlobalNotesViewModel.state.zoom : 1;
        const rect = e.target.getBoundingClientRect();
        const x = (e.clientX - rect.left) / zoom;
        const y = (e.clientY - rect.top) / zoom;
        data.points = [{ x, y }];
    },

    drawSketch: function (e, itemId) {
        e.stopPropagation();
        const data = this.sketchData[itemId];
        if (!data || !data.isDrawing) return;

        const zoom = (typeof GlobalNotesViewModel !== 'undefined') ? GlobalNotesViewModel.state.zoom : 1;
        const rect = e.target.getBoundingClientRect();
        const x = (e.clientX - rect.left) / zoom;
        const y = (e.clientY - rect.top) / zoom;

        data.points.push({ x, y });

        // Draw smoothing line
        if (data.points.length > 2) {
            const ctx = data.ctx;
            ctx.beginPath();
            ctx.moveTo(data.points[data.points.length - 2].x, data.points[data.points.length - 2].y);

            // Quadratic curve to midpoint
            const midPoint = {
                x: (data.points[data.points.length - 2].x + x) / 2,
                y: (data.points[data.points.length - 2].y + y) / 2
            };

            ctx.quadraticCurveTo(data.points[data.points.length - 2].x, data.points[data.points.length - 2].y, midPoint.x, midPoint.y);
            ctx.lineTo(x, y);
            ctx.stroke();
        }
    },

    endSketch: function (itemId, canvas) {
        const data = this.sketchData[itemId];
        if (!data || !data.isDrawing) return;

        data.isDrawing = false;
        data.points = [];

        // Save to item data
        if (canvas) {
            const dataUrl = canvas.toDataURL();
            GlobalNotesViewModel.updateItemData(itemId, { image: dataUrl });
        }
    }
};

window.GlobalNotesHandlers = GlobalNotesHandlers;
