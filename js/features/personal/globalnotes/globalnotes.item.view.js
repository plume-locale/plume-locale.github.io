/**
 * [MVVM : globalnotes Item View]
 * Responsible for rendering individual items on the board.
 */

const GlobalNotesItemView = {
    render: function (item) {
        console.log('Rendering item:', item.id, 'Type:', item.type, 'In column:', !!item.columnId);
        let style = "";
        const isInColumn = !!item.columnId;
        const isColorItem = item.type === 'color';
        // For color items, the base color is transparent because it's handled by the inner container
        const baseColor = isColorItem ? (item.config.color || '#4361ee') : (item.config.color || '#ffffff');
        const contrastColor = GlobalNotesItemView.getContrastColor(baseColor);

        if (!isInColumn) {
            const bgColor = isColorItem ? 'transparent' : item.config.color;
            const extraStyle = isColorItem ? 'box-shadow: none; border: none; min-width: 0; min-height: 0;' : `border: ${item.config.borderThickness}px ${item.config.borderStyle || 'solid'} ${item.config.borderColor || 'transparent'};`;
            style = `left: ${item.x}px; top: ${item.y}px; width: ${item.width}px; height: ${item.height === 'auto' ? 'auto' : item.height + 'px'}; z-index: ${item.zIndex}; background-color: ${bgColor}; color: ${contrastColor}; ${extraStyle}`;
        } else {
            const bgColor = isColorItem ? 'transparent' : item.config.color;
            const extraStyle = isColorItem ? 'box-shadow: none; border: none; min-width: 0; min-height: 0;' : `border: ${item.config.borderThickness}px ${item.config.borderStyle || 'solid'} ${item.config.borderColor || 'transparent'};`;
            style = `position: relative; width: 100% !important; margin-bottom: 12px; height: auto; background-color: ${bgColor}; color: ${contrastColor}; left: 0; top: 0; ${extraStyle}`;
        }

        return `
            <div class="globalnotes-item globalnotes-item-${item.type} ${item.config.isLocked ? 'locked' : ''} ${isInColumn ? 'in-column' : ''}" 
                 data-id="${item.id}" 
                 data-type="${item.type}"
                 style="${style}"
                 onpointerdown="GlobalNotesHandlers.onItemMouseDown(event, '${item.id}')"
                 ondblclick="GlobalNotesHandlers.onItemDbClick(event, '${item.id}')">
                
                <div class="item-inner" style="${isColorItem ? 'padding: 0;' : ''}">
                    ${GlobalNotesItemView.renderItemContent(item)}
                </div>
                
                ${!isInColumn ? `<div class="resizer resizer-br" onpointerdown="GlobalNotesHandlers.onResizeStart(event, '${item.id}')"></div>` : ''}
            </div>
        `;
    },

    renderItemContent: function (item) {
        console.log('Rendering content for item type:', item.type, item.id);
        const data = item.data || {};

        switch (item.type) {
            case 'note':
                return `
                    <div class="item-content" contenteditable="true" 
                         onblur="GlobalNotesViewModel.updateItemData('${item.id}', { content: this.innerHTML })">
                        ${data.content || ''}
                    </div>
                `;
            case 'board':
                return `
                    <div class="globalnotes-board-link">
                        <div class="board-icon-circle">
                            <i data-lucide="folder"></i>
                        </div>
                        <div class="board-name" contenteditable="true" 
                             onpointerdown="event.stopPropagation()"
                             onblur="GlobalNotesHandlers.renameBoard('${item.id}', this.innerText, event)">
                            ${data.title || 'Untitled Board'}
                        </div>
                    </div>
                `;
            case 'image':
                return `
                    <div class="item-image-container">
                        ${data.url ? `<img src="${data.url}" />` : `
                            <div class="image-placeholder" onpointerdown="event.stopPropagation()">
                                <i data-lucide="image"></i>
                                <div class="image-placeholder-actions">
                                    <button class="btn-image-action" onclick="GlobalNotesHandlers.triggerImageUpload('${item.id}')">
                                        <i data-lucide="upload"></i> <span>Upload</span>
                                    </button>
                                    <button class="btn-image-action" onclick="GlobalNotesHandlers.promptImageUrl('${item.id}')">
                                        <i data-lucide="link"></i> <span>URL</span>
                                    </button>
                                </div>
                            </div>
                        `}
                        <div class="item-caption" contenteditable="true" 
                             onblur="GlobalNotesViewModel.updateItemData('${item.id}', { caption: this.innerText })">
                            ${data.caption || 'Add caption...'}
                        </div>
                    </div>
                `;
            case 'link':
                return `
                    <div class="link-item-container" onpointerdown="event.stopPropagation()">
                        ${data.url ? `
                            <div class="link-preview" onclick="window.open('${data.url}', '_blank')">
                                ${data.image ? `<img src="${data.image}" class="link-image" />` : `
                                    <div class="link-icon-fallback"><i data-lucide="external-link"></i></div>
                                `}
                                <div class="link-details">
                                    <div class="link-title" contenteditable="true" onblur="GlobalNotesHandlers.updateLinkTitle('${item.id}', this.innerText, event)">${data.title || 'Link'}</div>
                                    <div class="link-url-text">${this.truncate(data.url, 40)}</div>
                                </div>
                            </div>
                        ` : `
                            <div class="link-placeholder" onclick="GlobalNotesHandlers.promptLinkUrl('${item.id}')">
                                <i data-lucide="link"></i>
                                <span>Add Link URL</span>
                            </div>
                        `}
                    </div>
                `;
            case 'column':
                const children = GlobalNotesViewModel.getItemsInColumn(item.id);
                return `
                    <div class="column-container">
                        <div class="column-header">
                            <div class="column-title" contenteditable="true" 
                                 onblur="GlobalNotesViewModel.updateItemData('${item.id}', { title: this.innerText })">
                                ${data.title || 'Column'}
                            </div>
                            <i data-lucide="more-horizontal" class="column-more"></i>
                        </div>
                        <div class="column-items-dropzone" data-column-id="${item.id}">
                            ${children.map(child => GlobalNotesItemView.render(child)).join('')}
                        </div>
                    </div>
                `;
            case 'checklist':
                return `
                    <div class="checklist-container">
                        <div class="checklist-header" contenteditable="true" onblur="GlobalNotesViewModel.updateItemData('${item.id}', { title: this.innerText })">
                            ${data.title || 'Checklist'}
                        </div>
                        <div class="checklist-items">
                            ${(data.items || []).map((li, idx) => `
                                <div class="checklist-row">
                                    <div class="check-box ${li.checked ? 'checked' : ''}" 
                                         onpointerdown="event.stopPropagation()"
                                         onclick="GlobalNotesHandlers.toggleChecklistItem('${item.id}', ${idx})">
                                        ${li.checked ? '<i data-lucide="check"></i>' : ''}
                                    </div>
                                    <span class="checklist-text" contenteditable="true" 
                                          onpointerdown="event.stopPropagation()"
                                          onblur="GlobalNotesHandlers.updateChecklistItem('${item.id}', ${idx}, this.innerText)">${li.text}</span>
                                </div>
                            `).join('')}
                        </div>
                        <button class="btn-add-list" 
                                onpointerdown="event.stopPropagation()"
                                onclick="GlobalNotesHandlers.addChecklistItem('${item.id}')">
                            <i data-lucide="plus"></i> Add item
                        </button>
                    </div>
                `;
            case 'audio':
                return `
                    <div class="item-audio">
                        <div class="audio-icon"><i data-lucide="music"></i></div>
                        <div class="audio-info">
                            <div class="audio-title">${data.title || 'Audio File'}</div>
                            <audio controls src="${data.url}"></audio>
                        </div>
                    </div>
                `;
            case 'video':
                return `
                    <div class="item-video">
                        ${data.url ? `
                            <iframe src="${data.url.replace('watch?v=', 'embed/')}" frameborder="0" allowfullscreen></iframe>
                        ` : `
                            <div class="video-placeholder" onclick="GlobalNotesHandlers.promptVideoUrl('${item.id}')">
                                <i data-lucide="video"></i>
                                <span>Add Video URL</span>
                            </div>
                        `}
                        <div class="video-title" contenteditable="true" onblur="GlobalNotesViewModel.updateItemData('${item.id}', { title: this.innerText })">
                            ${data.title || 'Video'}
                        </div>
                    </div>
                `;
            case 'file':
                return `
                    <div class="item-file" onpointerdown="event.stopPropagation()">
                        ${data.url ? `
                            <div class="file-content" onclick="GlobalNotesHandlers.triggerFileUpload('${item.id}')">
                                <div class="file-icon"><i data-lucide="file-text"></i></div>
                                <div class="file-info">
                                    <div class="file-name">${data.name || 'document.pdf'}</div>
                                    <div class="file-meta">${data.size || '0 KB'} • ${data.type || 'File'}</div>
                                    ${data.url ? `<a href="${data.url}" download="${data.name}" class="file-download-btn"><i data-lucide="download"></i> Download</a>` : ''}
                                </div>
                            </div>
                        ` : `
                            <div class="file-placeholder" onclick="GlobalNotesHandlers.triggerFileUpload('${item.id}')">
                                <i data-lucide="upload-cloud"></i>
                                <span>Add File</span>
                            </div>
                        `}
                    </div>
                `;
            case 'color':
                const cColor = item.config.color && item.config.color !== 'transparent' ? item.config.color : '#4361ee';
                const textColor = GlobalNotesItemView.getContrastColor(cColor);
                return `
                    <div class="item-color-container" style="background: ${cColor}; color: ${textColor} !important;">
                         <div class="color-content" onclick="GlobalNotesHandlers.promptColorChange('${item.id}')">
                            <div class="color-label" contenteditable="true" 
                                 style="color: ${textColor} !important;"
                                 onpointerdown="event.stopPropagation()"
                                 onblur="GlobalNotesViewModel.updateItemData('${item.id}', { label: this.innerText })">
                                 ${data.label || 'Primary'}
                            </div>
                            <div class="color-hex-badge">
                                <span>${item.config.color || '#4361ee'}</span>
                            </div>
                        </div>
                    </div>
                `;
            case 'table':
                return `
                <div class="item-table-container" onpointerdown="event.stopPropagation()">
                    <div class="table-actions-top">
                        <button class="btn-table-action" title="${Localization.t('globalnotes.action.add_column')}" onclick="GlobalNotesHandlers.addTableColumn('${item.id}')">
                            <i data-lucide="plus"></i> <span>${Localization.t('globalnotes.action.add_column') || 'Add Column'}</span>
                        </button>
                    </div>
                    <div class="table-wrapper">
                        <table class="globalnotes-table">
                            <thead>
                                <tr>
                                    ${(data.headers || []).map((h, c) => `
                                        <th>
                                            <div class="table-header-cell">
                                                <div class="header-content" contenteditable="true" onblur="GlobalNotesHandlers.updateTableHeader('${item.id}', ${c}, this.innerText)">
                                                    ${h || ''}
                                                </div>
                                                <button class="btn-delete-col" onclick="GlobalNotesHandlers.deleteTableColumn('${item.id}', ${c})" title="${Localization.t('globalnotes.action.delete_column') || 'Delete Column'}">
                                                    <i data-lucide="x"></i>
                                                </button>
                                            </div>
                                        </th>
                                    `).join('')}
                                    <th class="table-action-col"></th>
                                </tr>
                            </thead>
                            <tbody>
                                ${Array.from({ length: data.rows }).map((_, r) => `
                                    <tr>
                                        ${Array.from({ length: data.cols }).map((_, c) => `
                                            <td contenteditable="true" onblur="GlobalNotesHandlers.updateTableData('${item.id}', ${r}, ${c}, this.innerText)">
                                                ${(data.data[r] && data.data[r][c]) || ''}
                                            </td>
                                        `).join('')}
                                        <td class="table-action-cell">
                                            <button class="btn-delete-row" onclick="GlobalNotesHandlers.deleteTableRow('${item.id}', ${r})" title="${Localization.t('globalnotes.action.delete_row') || 'Delete Row'}">
                                                <i data-lucide="trash-2"></i>
                                            </button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                    <div class="table-actions-bottom">
                        <button class="btn-table-action" onclick="GlobalNotesHandlers.addTableRow('${item.id}')">
                            <i data-lucide="plus"></i> <span>${Localization.t('globalnotes.action.add_row') || 'Add Row'}</span>
                        </button>
                    </div>
                </div>
            `;
            case 'map':
                const hasUrl = !!data.url;
                return `
                <div class="item-map-container">
                    <div class="map-placeholder">
                        <i data-lucide="map"></i>
                        <div class="map-info" 
                             onpointerdown="event.stopPropagation()">
                            <span class="map-title-label" contenteditable="true" onblur="GlobalNotesViewModel.updateItemData('${item.id}', { title: this.innerText })">${data.title || 'Location'}</span>
                            <div class="map-coords" onclick="GlobalNotesHandlers.editMapItem('${item.id}')">${data.lat || 0}, ${data.lng || 0}</div>
                        </div>
                        <div class="map-actions">
                            ${hasUrl ? `<button class="btn-map-action" onclick="window.open('${data.url}', '_blank')"><i data-lucide="external-link"></i> Open</button>` : ''}
                            <button class="btn-map-action" onclick="GlobalNotesHandlers.promptMapUrl('${item.id}')"><i data-lucide="link"></i> ${hasUrl ? 'Change Link' : 'Add Link'}</button>
                        </div>
                    </div>
                </div>
            `;
            case 'heading':
                return `
                <div class="item-heading" contenteditable="true" onblur="GlobalNotesViewModel.updateItemData('${item.id}', { text: this.innerText })">
                    ${data.text || 'Section Title'}
                </div>
            `;
            case 'sketch':
                return `
                <div class="item-sketch" onpointerdown="event.stopPropagation()" onpointerup="event.stopPropagation()">
                    <div class="sketch-toolbar">
                        <div class="sketch-tools">
                            <div class="sketch-color-preview" title="Open Color Palette" style="background: ${item.data.color || '#333'}" onpointerdown="GlobalNotesHandlers.openSketchColorPicker(event, '${item.id}')"></div>
                            <div class="sketch-divider"></div>
                            <div class="sketch-color active" style="background: #333" onpointerdown="event.stopPropagation(); GlobalNotesHandlers.setSketchColor('${item.id}', '#333', this)"></div>
                            <div class="sketch-color" style="background: #ef4444" onpointerdown="event.stopPropagation(); GlobalNotesHandlers.setSketchColor('${item.id}', '#ef4444', this)"></div>
                            <div class="sketch-color" style="background: #3b82f6" onpointerdown="event.stopPropagation(); GlobalNotesHandlers.setSketchColor('${item.id}', '#3b82f6', this)"></div>
                            <div class="sketch-color" style="background: #10b981" onpointerdown="event.stopPropagation(); GlobalNotesHandlers.setSketchColor('${item.id}', '#10b981', this)"></div>
                        </div>
                        <div class="sketch-brush-container">
                            <i data-lucide="edit-3" style="width:12px; height:12px; opacity:0.5;"></i>
                            <input type="range" class="sketch-brush-slider" min="1" max="50" step="1" value="${item.data.brushSize || 2}" 
                                   onpointerdown="event.stopPropagation()"
                                   oninput="GlobalNotesHandlers.setSketchBrushSize('${item.id}', this.value)">
                            <span class="brush-size-value">${item.data.brushSize || 2}px</span>
                        </div>
                        <button class="btn-clear-sketch" title="Clear Canvas" onpointerdown="event.stopPropagation(); GlobalNotesHandlers.clearSketch('${item.id}')">
                            <i data-lucide="trash-2"></i>
                        </button>
                    </div>
                    <canvas class="sketch-canvas"
                            data-color="${item.data.color || '#333'}"
                            data-size="2"
                            onpointerdown="GlobalNotesHandlers.startSketch(event, '${item.id}')"
                            onpointermove="GlobalNotesHandlers.drawSketch(event, '${item.id}')"
                            onpointerup="GlobalNotesHandlers.endSketch('${item.id}', this)"
                            onpointercancel="GlobalNotesHandlers.endSketch('${item.id}', this)"
                            onpointerleave="GlobalNotesHandlers.endSketch('${item.id}', this)"
                            style="width: 100%; height: 100%; display: block; touch-action: none;"></canvas>
                </div>
            `;
            case 'line':
                return `
                <div class="item-line-container">
                    <svg width="100%" height="100%" style="overflow: visible;">
                        <line x1="0" y1="0" x2="${item.width}" y2="${item.height}" stroke="currentColor" stroke-width="${data.thickness || 2}" />
                        ${data.arrowhead ? `<path d="M ${item.width - 10} ${item.height - 10} L ${item.width} ${item.height} L ${item.width - 10} ${item.height + 10}" fill="none" stroke="currentColor" />` : ''}
                    </svg>
                </div>
            `;
            case 'document':
                return `
                <div class="item-document" onclick="GlobalNotesHandlers.openDocument('${item.id}')">
                    <i data-lucide="file-text"></i>
                    <div class="doc-title">${data.title || 'Document'}</div>
                </div>
            `;
            default:
                return `<div>${item.type}</div>`;
        }
    },

    truncate: function (str, n) {
        if (!str) return '';
        return (str.length > n) ? str.substr(0, n - 1) + '&hellip;' : str;
    },

    getContrastColor: function (hexcolor) {
        if (!hexcolor || hexcolor === 'transparent') return '#1e293b';

        let hex = hexcolor.replace('#', '').trim();

        // Handle shorthand hex like #000
        if (hex.length === 3) {
            hex = hex.split('').map(char => char + char).join('');
        }

        // Fallback for non-hex strings
        if (hex.length !== 6) return '#1e293b';

        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);

        // Simple brightness formula
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        return (brightness > 155) ? '#1e293b' : '#ffffff';
    }
};

window.GlobalNotesItemView = GlobalNotesItemView;
