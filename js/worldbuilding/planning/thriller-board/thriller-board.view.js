/**
 * [MVVM : Thriller Board View]
 * Rendu HTML et gestion du DOM.
 */

console.log('📋 Thriller Board View loaded');

// ============================================
// MAIN RENDER
// ============================================

/**
 * Point d'entrée principal pour le rendu du Thriller Board.
 */
function renderThrillerBoard() {
    console.log('=== RENDER THRILLER BOARD ===');

    // When tabs are active, delegate to tab system
    if (typeof tabsState !== 'undefined' && tabsState.panes.left.tabs.length > 0 && typeof renderTabs === 'function') {
        if (!document.getElementById('editorView-backup')) {
            renderThrillerList();
            renderTabs();
            return;
        }
    }

    const container = document.getElementById('editorView');
    if (!container) {
        console.log('Editor view container not found!');
        return;
    }

    initThrillerBoardVM();
    renderThrillerList();

    const viewMode = ThrillerStateRepository.getViewMode();
    if (viewMode === 'grid') {
        renderThrillerGridView();
    } else {
        renderThrillerCanvasView();
    }

    setTimeout(() => {
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }, 50);
}

// ============================================
// CANVAS VIEW
// ============================================

/**
 * Affiche la vue Canvas.
 */
function renderThrillerCanvasView() {
    const container = document.getElementById('editorView');
    if (!container) return;

    container.innerHTML = `
        <div class="thriller-board-toolbar">
            <button class="btn btn-secondary btn-sm" onclick="handleToggleViewMode()" title="${Localization.t('thriller.view.grid')}">
                <i data-lucide="table"></i> ${Localization.t('thriller.view.grid')}
            </button>
        </div>
        <div class="thriller-board-canvas-wrapper">
            <div class="thriller-board-canvas" id="thrillerBoardCanvas"
                 onmousedown="handleThrillerCanvasMouseDown(event)"
                 onmousemove="handleThrillerCanvasMouseMove(event)"
                 onmouseup="handleThrillerCanvasMouseUp(event)"
                 onwheel="handleThrillerCanvasWheel(event)">
                <div class="thriller-board-content" id="thrillerBoardContent">
                </div>
            </div>
            <button class="floating-add-button" onclick="handleAddElement()" title="${Localization.t('thriller.action.add_element')}">
                <i data-lucide="plus"></i>
            </button>
        </div>
    `;

    renderThrillerElements();
}

/**
 * Affiche les éléments sur le canvas.
 */
/**
 * Affiche les éléments sur le canvas.
 */
function renderThrillerElements() {
    const content = document.getElementById('thrillerBoardContent');
    if (!content) return;

    const currentFilter = ThrillerStateRepository.getCurrentFilter();
    const elements = ThrillerElementRepository.getByType(currentFilter);

    if (elements.length === 0) {
        content.innerHTML = `
            <div class="thriller-empty-state">
                <div class="thriller-empty-icon">
                    <i data-lucide="search" style="width: 48px; height: 48px; color: var(--text-secondary);"></i>
                </div>
                <h3>${Localization.t('thriller.empty.title')}</h3>
                <p>
                    ${Localization.t('thriller.empty.desc', [currentFilter])}
                </p>
                <div style="display: flex; gap: 10px; justify-content: center;">
                    <button class="btn btn-primary" onclick="handleAddElement('${currentFilter}')">
                        <i data-lucide="plus"></i> ${Localization.t('thriller.empty.create', [currentFilter])}
                    </button>
                    <button class="btn btn-secondary" onclick="ThrillerStateRepository.setCurrentFilter('clue'); renderThrillerBoard();">
                         ${Localization.t('thriller.empty.view_all')}
                    </button>
                </div>
            </div>
        `;

        // Initialiser les icônes pour l'état vide
        setTimeout(() => {
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }, 50);
        return;
    }

    content.innerHTML = elements.map(element => {
        // Résolution sécurisée du type
        let typeData = THRILLER_TYPES[element.type];
        if (!typeData && typeof ThrillerTypeRepository !== 'undefined') {
            typeData = ThrillerTypeRepository.getTypeDefinition(element.type);
        }
        // Fallback si le type est introuvable
        if (!typeData) typeData = THRILLER_TYPES.clue;

        // Sécurisation des données de position et taille
        const safePos = element.position || { x: 100, y: 100 };
        const safeSize = element.size || { width: 280, height: 200 };

        return `
            <div class="thriller-element-card"
                 id="thriller-element-${element.id}"
                 style="left: ${safePos.x}px; top: ${safePos.y}px; width: ${safeSize.width}px; min-height: ${safeSize.height}px;"
                 onclick="handleSelectElement('${element.id}')"
                 ondblclick="handleEditElement('${element.id}')">
                <div class="thriller-element-header" style="background-color: ${element.color || typeData.color}">
                    <div class="thriller-element-icon">
                        <i data-lucide="${typeData.icon}"></i>
                    </div>
                    <div class="thriller-element-title">${element.title}</div>
                    <div class="thriller-element-actions">
                        <button class="btn btn-ghost btn-xs" onclick="event.stopPropagation(); handleDeleteElement('${element.id}')">
                            <i data-lucide="trash-2"></i>
                        </button>
                    </div>
                </div>
                <div class="thriller-element-content">
                    <div class="thriller-element-description">${element.description || '<em style="opacity: 0.6">' + Localization.t('thriller.card.no_desc') + '</em>'}</div>
                </div>
            </div>
        `;
    }).join('');

    renderThrillerConnections();
    setTimeout(() => {
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }, 50);
}

// ============================================
// GRID VIEW
// ============================================

/**
 * Affiche la vue Grille (Swimlanes).
 */
function renderThrillerGridView() {
    const container = document.getElementById('editorView');
    if (!container) return;

    const gridData = getGridDataVM();

    container.innerHTML = `
        <div class="thriller-grid-view">
            <div class="thriller-board-toolbar">
                <button class="btn btn-secondary btn-sm" onclick="handleToggleViewMode()" title="${Localization.t('thriller.view.canvas')}">
                    <i data-lucide="layout"></i> ${Localization.t('thriller.view.canvas')}
                </button>
                <div class="toolbar-divider"></div>
                <button class="btn btn-secondary btn-sm ${gridData.columnMode === 'free' ? 'active' : ''}"
                        onclick="handleSetColumnMode('free')" title="${Localization.t('thriller.toolbar.free_columns')}">
                    <i data-lucide="columns"></i> ${Localization.t('thriller.toolbar.free_columns')}
                </button>
                <button class="btn btn-secondary btn-sm ${gridData.columnMode === 'narrative' ? 'active' : ''}"
                        onclick="handleSetColumnMode('narrative')" title="${Localization.t('thriller.toolbar.narrative_structure')}">
                    <i data-lucide="book-open"></i> ${Localization.t('thriller.toolbar.narrative_structure')}
                </button>
                <div class="toolbar-divider"></div>
                <button class="btn btn-secondary btn-sm" onclick="handleAddRow()" title="${Localization.t('thriller.action.add_row')}">
                    <i data-lucide="plus"></i> ${Localization.t('thriller.action.add_row')}
                </button>
                ${gridData.columnMode === 'free' ? `
                    <button class="btn btn-secondary btn-sm" onclick="handleAddColumn()" title="${Localization.t('thriller.action.add_column')}">
                        <i data-lucide="plus"></i> ${Localization.t('thriller.action.add_column')}
                    </button>
                ` : ''}
            </div>
            <div class="thriller-grid-container" id="thrillerGridContainer">
                ${renderThrillerGrid(gridData)}
            </div>
        </div>
    `;

    setTimeout(() => {
        renderThrillerConnections();

        const gridContainer = document.getElementById('thrillerGridContainer');
        if (gridContainer) {
            gridContainer.addEventListener('scroll', () => {
                renderThrillerConnections();
            });
        }

        if (typeof lucide !== 'undefined') lucide.createIcons();
    }, 100);
}

/**
 * Génère le HTML de la grille.
 * @param {Object} gridData - Données de la grille.
 * @returns {string} HTML.
 */
function renderThrillerGrid(gridData) {
    const { rows, columns, cards } = gridData;

    if (rows.length === 0) {
        return `
            <div class="thriller-grid-empty-state">
                <i data-lucide="table" style="width: 48px; height: 48px; color: var(--text-secondary);"></i>
                <p>${Localization.t('thriller.grid.empty')}</p>
                <p style="font-size: 0.9rem; color: var(--text-muted); margin-top: 0.5rem;">
                    ${Localization.t('thriller.grid.empty_desc')}
                </p>
                <button class="btn btn-primary" onclick="handleAddRow()">
                    <i data-lucide="plus"></i> ${Localization.t('thriller.grid.add_row_custom')}
                </button>
            </div>
        `;
    }

    return `
        <div class="thriller-grid-wrapper" style="position: relative;">
            <div class="thriller-grid-table" style="position: relative; z-index: 1;">
                <div class="thriller-grid-header-row">
                    <div class="thriller-grid-row-header-cell">
                        <span>${Localization.t('thriller.grid.header_label')}</span>
                    </div>
                    ${columns.map(col => `
                        <div class="thriller-grid-column-header" data-column-id="${col.id}">
                            <div class="thriller-grid-column-title">
                                ${col.title}
                                ${gridData.columnMode === 'free' ? `
                                    <button class="btn-icon-sm" onclick="handleEditColumn('${col.id}')" title="Modifier">
                                        <i data-lucide="edit-2"></i>
                                    </button>
                                    <button class="btn-icon-sm" onclick="handleDeleteColumn('${col.id}')" title="Supprimer">
                                        <i data-lucide="trash-2"></i>
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
                ${rows.map(row => renderThrillerSwimlaneRow(row, columns, cards, gridData.columnMode)).join('')}
            </div>
            <svg class="thriller-grid-connections" id="thrillerGridConnections" 
                 style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 10;">
                <defs>
                    ${Object.entries(THRILLER_TYPES).map(([key, data]) => `
                        <marker id="arrowhead-${key}" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                            <polygon points="0 0, 10 3.5, 0 7" fill="${data.color}" />
                        </marker>
                    `).join('')}
                </defs>
            </svg>
        </div>
    `;
}

/**
 * Affiche une ligne (swimlane).
 */
function renderThrillerSwimlaneRow(row, columns, cards, columnMode) {
    const isAutoGenerated = row.type === 'character' || row.type === 'location';

    return `
        <div class="thriller-grid-row" data-row-id="${row.id}">
            <div class="thriller-grid-row-header" style="background-color: ${row.color || '#f0f0f0'};">
                <div class="thriller-grid-row-info">
                    <i data-lucide="${row.icon || 'tag'}" style="width: 16px; height: 16px;"></i>
                    <span class="thriller-grid-row-title">${row.title}</span>
                    ${isAutoGenerated ? '<span style="font-size: 0.7rem; opacity: 0.7; margin-left: 6px;">(auto)</span>' : ''}
                </div>
                ${!isAutoGenerated ? `
                    <div class="thriller-grid-row-actions">
                        <button class="btn-icon-sm" onclick="handleEditRow('${row.id}')" title="Modifier">
                            <i data-lucide="edit-2"></i>
                        </button>
                        <button class="btn-icon-sm" onclick="handleDeleteRow('${row.id}')" title="Supprimer">
                            <i data-lucide="trash-2"></i>
                        </button>
                    </div>
                ` : ''}
            </div>
            ${columns.map(col => {
        const cellCards = cards.filter(c => c.rowId === row.id && c.columnId === col.id);
        return renderThrillerGridCell(row.id, col.id, cellCards);
    }).join('')}
        </div>
    `;
}

/**
 * Affiche une cellule de la grille.
 */
function renderThrillerGridCell(rowId, columnId, cards) {
    const hasCards = cards && cards.length > 0;

    return `
        <div class="thriller-grid-cell ${hasCards ? 'has-card' : 'thriller-grid-cell-empty'}"
             data-row-id="${rowId}"
             data-column-id="${columnId}"
             ondragover="handleCellDragOver(event)"
             ondragleave="handleCellDragLeave(event)"
             ondrop="handleCellDrop(event, '${rowId}', '${columnId}')">
            ${hasCards ? renderCardStack(cards, rowId, columnId) : ''}
        </div>
    `;
}

/**
 * Affiche une pile de cartes.
 */
function renderCardStack(cards, rowId, columnId) {
    const sortedCards = [...cards].sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0));
    const visibleCount = Math.min(sortedCards.length, 3);
    const hiddenCount = sortedCards.length - visibleCount;

    return `
        <div class="thriller-card-stack" data-row-id="${rowId}" data-column-id="${columnId}">
            ${sortedCards.slice(0, visibleCount).map((card, index) => {
        const offset = index * 4;
        const zIndex = visibleCount - index;
        const rotation = index * 0.5;
        return `
                    <div class="thriller-card-wrapper"
                         style="transform: translate(${offset}px, ${offset}px) rotate(${rotation}deg); z-index: ${zIndex};"
                         data-card-id="${card.id}"
                         draggable="true"
                         ondragstart="handleCardDragStart(event, '${card.id}')"
                         ondragend="handleCardDragEnd(event)"
                         onclick="handleStackedCardClick(event, '${card.id}', ${index})">
                        ${renderThrillerCard(card)}
                    </div>
                `;
    }).join('')}
            ${cards.length > 1 ? `
                <div class="thriller-stack-indicator"
                     style="transform: translate(${(visibleCount - 1) * 4}px, ${(visibleCount - 1) * 4 + 4}px);">
                    <span class="thriller-stack-count">${cards.length}</span>
                    ${hiddenCount > 0 ? `<span class="thriller-stack-more" onclick="handleShowCardStack(event, '${rowId}', '${columnId}')" title="Voir toutes les cartes">+${hiddenCount}</span>` : ''}
                </div>
            ` : ''}
        </div>
    `;
}

/**
 * Affiche une carte individuelle.
// ============================================
// CARDS RENDERING
// ============================================

/**
 * Affiche une carte avec son header et son body.
 */
function renderThrillerCard(card) {
    // Résolution du type (Supporte les types personnalisés)
    let typeData = THRILLER_TYPES[card.type];
    if (!typeData && typeof ThrillerTypeRepository !== 'undefined') {
        typeData = ThrillerTypeRepository.getTypeDefinition(card.type);
    }
    // Fallback
    if (!typeData) typeData = THRILLER_TYPES.clue;

    const statusData = THRILLER_CARD_STATUS[card.status || 'pending'];

    let headerExtra = '';
    if (card.type === 'alibi') {
        const isTrue = card.data && card.data.is_true;
        headerExtra = `
            <span class="thriller-card-badge" style="background: ${isTrue ? '#27ae60' : '#e74c3c'}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 600; margin-left: auto;">
                ${isTrue ? Localization.t('thriller.card.alibi.true') : Localization.t('thriller.card.alibi.false')}
            </span>
        `;
    }

    return `
        <div class="thriller-card" data-card-id="${card.id}">
            <div class="thriller-card-header"
                 style="background-color: ${typeData.color}; cursor: pointer;"
                 onclick="handleCardHeaderClick(event, '${card.id}')">
                <i data-lucide="${typeData.icon}" style="width: 16px; height: 16px;"></i>
                <span class="thriller-card-type">${typeData.label}</span>
                <span class="thriller-card-title">${card.title}</span>
                ${headerExtra}
                <button class="thriller-card-delete-btn"
                        onclick="event.stopPropagation(); handleDeleteCard('${card.id}')"
                        title="Supprimer cette carte">
                    <i data-lucide="x"></i>
                </button>
            </div>
            <div class="thriller-card-body">
                ${renderThrillerCardProperties(card)}
            </div>
            <div class="thriller-card-footer"
                 style="background-color: ${statusData.color}20; border-left: 3px solid ${statusData.color}; cursor: pointer;"
                 onclick="handleCardFooterClick(event, '${card.id}')">
                <i data-lucide="${statusData.icon}" style="width: 14px; height: 14px; color: ${statusData.color};"></i>
                <span style="color: ${statusData.color};">${statusData.label}</span>
            </div>
        </div>
    `;
}

/**
 * Affiche les propriétés d'une carte avec sockets.
 */
function renderThrillerCardProperties(card) {
    const properties = getThrillerCardTypeProperties(card.type);

    return properties.map(prop => {
        let value;
        if (prop.key === 'description') {
            value = card.description || '';
        } else {
            value = card.data ? card.data[prop.key] : '';
        }

        if (!value && !prop.showEmpty) return '';

        // Gestion spéciale des témoins
        if (prop.type === 'witnesses') {
            return renderWitnessesProperty(card, prop, value);
        }

        return `
            <div class="thriller-card-property" data-property="${prop.key}">
                <div class="thriller-card-socket thriller-card-socket-left"
                     data-card-id="${card.id}"
                     data-property="${prop.key}"
                     data-side="left"
                     title="Créer une connexion"
                     onmousedown="handleSocketMouseDown(event, '${card.id}', '${prop.key}', 'left')">
                    <i data-lucide="circle" style="width: 12px; height: 12px;"></i>
                </div>
                <div class="thriller-card-property-content">
                    <span class="thriller-card-property-label">${prop.label}:</span>
                    <span class="thriller-card-property-value">${formatThrillerPropertyValue(value, prop.type)}</span>
                </div>
                <div class="thriller-card-socket thriller-card-socket-right"
                     data-card-id="${card.id}"
                     data-property="${prop.key}"
                     data-side="right"
                     title="Créer une connexion"
                     onmousedown="handleSocketMouseDown(event, '${card.id}', '${prop.key}', 'right')">
                    <i data-lucide="circle" style="width: 12px; height: 12px;"></i>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Affiche les propriétés de témoins avec sockets individuels.
 */
function renderWitnessesProperty(card, prop, value) {
    if (!value || !Array.isArray(value) || value.length === 0) {
        return `
            <div class="thriller-card-property" data-property="${prop.key}">
                <div class="thriller-card-socket thriller-card-socket-left"
                     data-card-id="${card.id}" data-property="${prop.key}" data-side="left"
                     onmousedown="handleSocketMouseDown(event, '${card.id}', '${prop.key}', 'left')">
                    <i data-lucide="circle" style="width: 12px; height: 12px;"></i>
                </div>
                <div class="thriller-card-property-content">
                    <span class="thriller-card-property-label">${prop.label}:</span>
                    <span class="thriller-card-property-value"><em>${Localization.t('thriller.card.witnesses_empty')}</em></span>
                </div>
                <div class="thriller-card-socket thriller-card-socket-right"
                     data-card-id="${card.id}" data-property="${prop.key}" data-side="right"
                     onmousedown="handleSocketMouseDown(event, '${card.id}', '${prop.key}', 'right')">
                    <i data-lucide="circle" style="width: 12px; height: 12px;"></i>
                </div>
            </div>
        `;
    }

    const header = `<div class="thriller-card-property-header"><span class="thriller-card-property-label">${prop.label}:</span></div>`;

    const items = value.map((witnessId, index) => {
        const witnessName = getCharacterName(witnessId);
        const propertyKey = `${prop.key}_${index}`;
        return `
            <div class="thriller-card-property" data-property="${propertyKey}">
                <div class="thriller-card-socket thriller-card-socket-left"
                     data-card-id="${card.id}" data-property="${propertyKey}" data-side="left"
                     onmousedown="handleSocketMouseDown(event, '${card.id}', '${propertyKey}', 'left')">
                    <i data-lucide="circle" style="width: 12px; height: 12px;"></i>
                </div>
                <div class="thriller-card-property-content">
                    <span class="thriller-card-property-value">${witnessName}</span>
                </div>
                <div class="thriller-card-socket thriller-card-socket-right"
                     data-card-id="${card.id}" data-property="${propertyKey}" data-side="right"
                     onmousedown="handleSocketMouseDown(event, '${card.id}', '${propertyKey}', 'right')">
                    <i data-lucide="circle" style="width: 12px; height: 12px;"></i>
                </div>
            </div>
        `;
    }).join('');

    return header + items;
}

// ============================================
// CONNECTIONS RENDERING
// ============================================

/**
 * Dessine les connexions entre cartes.
 */
function renderThrillerConnections() {
    const svg = document.getElementById('thrillerGridConnections');
    if (!svg) return;

    // Nettoyer les anciennes lignes
    svg.querySelectorAll('path, line').forEach(el => el.remove());

    const connections = ThrillerConnectionRepository.getGridConnections();

    connections.forEach(conn => {
        const fromSocket = document.querySelector(
            `.thriller-card-socket[data-card-id="${conn.from.cardId}"][data-property="${conn.from.property}"][data-side="${conn.from.side}"]`
        );
        const toSocket = document.querySelector(
            `.thriller-card-socket[data-card-id="${conn.to.cardId}"][data-property="${conn.to.property}"][data-side="${conn.to.side}"]`
        );

        if (!fromSocket || !toSocket) return;

        const svgRect = svg.getBoundingClientRect();
        const fromRect = fromSocket.getBoundingClientRect();
        const toRect = toSocket.getBoundingClientRect();

        const x1 = fromRect.left + fromRect.width / 2 - svgRect.left;
        const y1 = fromRect.top + fromRect.height / 2 - svgRect.top;
        const x2 = toRect.left + toRect.width / 2 - svgRect.left;
        const y2 = toRect.top + toRect.height / 2 - svgRect.top;

        // Déterminer la couleur basée sur le type de carte source
        const fromCard = ThrillerCardRepository.getById(conn.from.cardId);
        const cardType = fromCard ? fromCard.type : 'clue';
        const typeData = THRILLER_TYPES[cardType];
        const connectionColor = typeData ? typeData.color : 'var(--text-secondary)';

        // Courbe de Bezier
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const dx = Math.abs(x1 - x2);
        const offset = Math.max(dx * 0.5, 50);

        let d;
        if (conn.from.side === 'right' && conn.to.side === 'left') {
            d = `M ${x1} ${y1} C ${x1 + offset} ${y1}, ${x2 - offset} ${y2}, ${x2} ${y2}`;
        } else if (conn.from.side === 'left' && conn.to.side === 'right') {
            d = `M ${x1} ${y1} C ${x1 - offset} ${y1}, ${x2 + offset} ${y2}, ${x2} ${y2}`;
        } else {
            const midX = (x1 + x2) / 2;
            d = `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;
        }

        path.setAttribute('d', d);
        path.setAttribute('stroke', connectionColor);
        path.setAttribute('stroke-width', '2');
        path.setAttribute('fill', 'none');
        path.setAttribute('marker-end', `url(#arrowhead-${cardType})`);
        path.classList.add('thriller-connection-line');
        path.style.cursor = 'pointer';
        path.style.pointerEvents = 'stroke';

        // Hover effects
        path.addEventListener('mouseenter', () => {
            path.setAttribute('stroke-width', '4');
            path.style.filter = `drop-shadow(0 0 4px ${connectionColor})`;
            fromSocket.classList.add('socket-highlight');
            toSocket.classList.add('socket-highlight');
        });

        path.addEventListener('mouseleave', () => {
            path.setAttribute('stroke-width', '2');
            path.style.filter = 'none';
            fromSocket.classList.remove('socket-highlight');
            toSocket.classList.remove('socket-highlight');
        });

        // Click to delete
        path.addEventListener('click', (e) => {
            e.stopPropagation();
            handleDeleteConnection(conn.id, fromCard?.title);
        });

        svg.appendChild(path);
    });
}

// ============================================
// SIDEBAR RENDERING
// ============================================

/**
 * Affiche la liste des éléments dans la sidebar.
 */
function renderThrillerList() {
    const container = document.getElementById('thrillerList');
    if (!container) return;

    const collapsedState = JSON.parse(localStorage.getItem('plume_treeview_collapsed') || '{}');
    const groupedElements = getGroupedElementsVM();
    const selectedElements = ThrillerStateRepository.getSelectedElements();

    let html = '';

    Object.entries(groupedElements).forEach(([typeKey, data]) => {
        const groupKey = 'thriller_' + typeKey;
        const isCollapsed = collapsedState[groupKey] === true;

        // Détérminer si c'est un type personnalisé (si pas dans les constantes système)
        const isCustom = !THRILLER_TYPES[typeKey];

        html += `
            <div class="treeview-group">
                <div class="treeview-header" onclick="toggleTreeviewGroup('${groupKey}'); event.stopPropagation();">
                    <i data-lucide="${isCollapsed ? 'chevron-right' : 'chevron-down'}" class="treeview-chevron"></i>
                    <i data-lucide="${data.icon}" style="color: ${data.color}; width: 16px; height: 16px;"></i>
                    <span class="treeview-label">${data.label}</span>
                    <span class="treeview-count">${data.elements.length}</span>
                    
                    <div class="treeview-header-actions">
                        <button class="treeview-add-btn" onclick="event.stopPropagation(); openTypeEditor('${typeKey}')" title="Modifier le type" style="margin-right: 4px;">
                            <i data-lucide="edit-2" style="width: 12px; height: 12px;"></i>
                        </button>
                        ${(typeof ThrillerTypeRepository !== 'undefined' && ThrillerTypeRepository.getCustomTypes().some(t => t.id === typeKey)) ? `
                            <button class="treeview-add-btn" onclick="event.stopPropagation(); handleDeleteCustomType('${typeKey}')" title="Supprimer/Réinitialiser ce type" style="margin-right: 4px; color: #dc3545;">
                                <i data-lucide="trash-2" style="width: 12px; height: 12px;"></i>
                            </button>
                        ` : ''}
                        <button class="treeview-add-btn" onclick="event.stopPropagation(); handleAddElement('${typeKey}')" title="Ajouter ${data.label.toLowerCase()}">
                            <i data-lucide="plus" style="width: 14px; height: 14px;"></i>
                        </button>
                    </div>
                </div>
                ${!isCollapsed && data.elements.length > 0 ? `
                    <div class="treeview-children">
                        ${data.elements.map(element => `
                            <div class="treeview-item ${selectedElements.includes(element.id) ? 'selected' : ''}"
                                 draggable="true"
                                 data-element-id="${element.id}"
                                 data-element-type="${typeKey}"
                                 ondragstart="handleTreeviewDragStart(event, '${element.id}')"
                                 ondragend="handleTreeviewDragEnd(event)"
                                 onclick="handleSelectAndViewElement('${element.id}')">
                                <i data-lucide="${data.icon}" style="color: ${data.color}; width: 14px; height: 14px;"></i>
                                <span class="treeview-item-name">${element.title}</span>
                                <button class="treeview-item-delete" onclick="event.stopPropagation(); handleDeleteElement('${element.id}')" title="Supprimer">
                                    <i data-lucide="trash-2"></i>
                                </button>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    });

    container.innerHTML = html;

    // Ajouter le bouton "Gérer les types"
    const footer = document.createElement('div');
    footer.className = 'thriller-sidebar-footer';
    footer.style.padding = '10px';
    footer.style.borderTop = '1px solid #ddd';
    footer.style.marginTop = 'auto'; // Pousser vers le bas si flex column
    footer.innerHTML = `
        <button class="btn btn-secondary w-100" onclick="openTypeEditor()">
            <i data-lucide="settings"></i> ${Localization.t('thriller.action.edit_type')}
        </button>
    `;
    container.appendChild(footer);

    setTimeout(() => {
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }, 50);
}

// ============================================
// EVENT HANDLERS (Bridges to ViewModel)
// ============================================

function handleToggleViewMode() {
    const result = toggleViewModeVM();
    if (result.sideEffects.shouldRender) renderThrillerBoard();
}

function handleSetColumnMode(mode) {
    const result = setColumnModeVM(mode);
    if (result.sideEffects.shouldSave) saveProject();
    if (result.sideEffects.shouldRender) renderThrillerBoard();
}

function handleAddElement(type) {
    const result = addElementVM(type);
    if (result.sideEffects.shouldSave) saveProject();
    if (result.sideEffects.shouldRenderList) renderThrillerList();
    if (result.sideEffects.shouldRenderElements) renderThrillerElements();
    if (result.sideEffects.shouldOpenModal) {
        editThrillerElement(result.element.id, result.sideEffects.isNew);
    }
}

function handleEditElement(elementId) {
    editThrillerElement(elementId);
}

function handleDeleteElement(elementId) {
    if (!confirm(Localization.t('thriller.confirm.delete_element'))) return;
    const result = deleteElementVM(elementId);
    if (result.sideEffects.shouldSave) saveProject();
    if (result.sideEffects.shouldRender) renderThrillerBoard();
}

function handleSelectElement(elementId) {
    ThrillerStateRepository.setSelectedElements([elementId]);
    renderThrillerBoard();
}

function handleSelectAndViewElement(elementId) {
    const result = selectElementVM(elementId);
    if (result.sideEffects.shouldRender) renderThrillerBoard();
    if (result.sideEffects.shouldOpenModal) {
        setTimeout(() => editThrillerElement(elementId), 100);
    }
}

function handleDeleteCard(cardId) {
    if (!confirm(Localization.t('thriller.confirm.delete_card'))) return;
    const result = deleteCardVM(cardId);
    if (result.sideEffects.shouldSave) saveProject();
    if (result.sideEffects.shouldRender) renderThrillerBoard();
}

function handleDeleteConnection(connectionId, sourceTitle = '') {
    if (!confirm(Localization.t('thriller.confirm.delete_connection', [sourceTitle]))) return;
    const result = deleteGridConnectionVM(connectionId);
    if (result.sideEffects.shouldSave) saveProject();
    if (result.sideEffects.shouldRenderConnections) renderThrillerConnections();
}

function handleCardHeaderClick(event, cardId) {
    event.stopPropagation();
    if (connectionState.isDrawing) return;

    const card = ThrillerCardRepository.getById(cardId);
    if (card && card.elementId) {
        editThrillerElement(card.elementId);
    }
}

function handleCardFooterClick(event, cardId) {
    event.stopPropagation();
    if (connectionState.isDrawing) return;
    showStatusPopover(event, cardId);
}

function handleStackedCardClick(event, cardId, index) {
    event.stopPropagation();
    if (index === 0) {
        if (!event.target.closest('.thriller-card-socket')) {
            const card = ThrillerCardRepository.getById(cardId);
            if (card && card.elementId) {
                editThrillerElement(card.elementId);
            }
        }
    } else {
        const result = bringCardToFrontVM(cardId);
        if (result.sideEffects.shouldSave) saveProject();
        if (result.sideEffects.shouldRender) renderThrillerBoard();
    }
}

function handleShowCardStack(event, rowId, columnId) {
    event.stopPropagation();
    showCardStackModal(rowId, columnId);
}

function handleAddRow() {
    showRowModal();
}

function handleEditRow(rowId) {
    showRowModal(rowId);
}

function handleDeleteRow(rowId) {
    if (!confirm('Supprimer cette ligne et toutes ses cartes ?')) return;
    const result = deleteRowVM(rowId);
    if (result.sideEffects.shouldSave) saveProject();
    if (result.sideEffects.shouldRender) renderThrillerBoard();
}

function handleAddColumn() {
    showColumnModal();
}

function handleEditColumn(columnId) {
    showColumnModal(columnId);
}

function handleDeleteColumn(columnId) {
    if (!confirm('Supprimer cette colonne et toutes ses cartes ?')) return;
    const result = deleteColumnVM(columnId);
    if (result.sideEffects.shouldSave) saveProject();
    if (result.sideEffects.shouldRender) renderThrillerBoard();
}

/**
 * Supprime un type personnalisé.
 */
function handleDeleteCustomType(typeId) {
    if (!confirm('Voulez-vous vraiment supprimer ce type personnalisé ? Toutes les cartes de ce type seront également supprimées.')) return;

    if (typeof deleteCustomTypeVM !== 'undefined') {
        const result = deleteCustomTypeVM(typeId);
        if (result.success) {
            if (result.sideEffects.shouldSave) saveProject();
            if (result.sideEffects.shouldRender) renderThrillerBoard();
        } else {
            alert('Erreur: ' + (result.error || 'Impossible de supprimer le type.'));
        }
    }
}


// ============================================
// DRAG & DROP HANDLERS
// ============================================

function handleCardDragStart(event, cardId) {
    // Empêcher le drag si on clique sur un socket
    if (event.target.closest('.thriller-card-socket')) {
        event.preventDefault();
        return;
    }

    event.stopPropagation();
    handleCardDragStartVM(cardId);
    event.currentTarget.classList.add('dragging');
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', cardId);
}

function handleSocketMouseDown(event, cardId, property, side) {
    // Stopper la propagation pour éviter de déclencher d'autres mousedown (comme le drag de carte)
    event.stopPropagation();
    event.preventDefault(); // Important pour bloquer le drag natif

    const socket = event.currentTarget;
    socket.classList.add('active-socket');

    // Démarrer la connexion dans le ViewModel
    startThrillerConnectionVM(event, cardId, property);

    // Initialiser le dessin visuel dans la vue
    const startPos = getSocketPosition(socket);

    // Créer un overlay pour capter les mouvements de souris partout
    const overlay = document.createElement('div');
    overlay.className = 'connection-drag-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        z-index: 9999;
        cursor: crosshair;
        background: transparent;
    `;
    document.body.appendChild(overlay);

    // Créer la ligne temporaire SVG
    const svg = document.getElementById('thrillerGridConnections');
    let tempLine = null;
    if (svg) {
        tempLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        tempLine.setAttribute('class', 'temp-connection');
        tempLine.setAttribute('x1', startPos.x);
        tempLine.setAttribute('y1', startPos.y);
        tempLine.setAttribute('x2', startPos.x);
        tempLine.setAttribute('y2', startPos.y);
        tempLine.setAttribute('stroke', 'var(--accent-gold, #f1c40f)');
        tempLine.setAttribute('stroke-width', '2');
        tempLine.setAttribute('stroke-dasharray', '5,5');
        svg.appendChild(tempLine);
    }

    const onMove = (e) => handleConnectionDrag(e, tempLine, cardId);
    const onUp = (e) => handleConnectionMouseUp(e, overlay, tempLine, socket);

    overlay.addEventListener('mousemove', onMove);
    overlay.addEventListener('mouseup', onUp);
}

function handleConnectionDrag(event, tempLine, fromCardId) {
    if (!tempLine) return;

    const container = document.getElementById('thrillerGridContainer');
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const x = event.clientX - rect.left + container.scrollLeft;
    const y = event.clientY - rect.top + container.scrollTop;

    tempLine.setAttribute('x2', x);
    tempLine.setAttribute('y2', y);

    // Highlight des sockets survolés
    const socket = findSocketAtPoint(event.clientX, event.clientY);

    document.querySelectorAll('.thriller-card-socket.hover-target').forEach(el => el.classList.remove('hover-target'));

    if (socket && socket.dataset.cardId !== fromCardId) {
        socket.classList.add('hover-target');
    }
}

function handleConnectionMouseUp(event, overlay, tempLine, sourceSocket) {
    // Nettoyage
    if (overlay) overlay.remove();
    if (tempLine) tempLine.remove();
    if (sourceSocket) sourceSocket.classList.remove('active-socket');
    document.querySelectorAll('.thriller-card-socket.hover-target').forEach(el => el.classList.remove('hover-target'));

    // Trouver le socket cible
    const targetSocket = findSocketAtPoint(event.clientX, event.clientY);

    if (targetSocket) {
        const toCardId = targetSocket.dataset.cardId;
        const toProperty = targetSocket.dataset.property;
        const toSide = targetSocket.dataset.side || 'left';

        const result = completeConnectionVM(toCardId, toProperty, toSide);
        if (result.success) {
            if (result.sideEffects.shouldSave) saveProject();
            if (result.sideEffects.shouldRenderConnections) renderThrillerConnections();
        }
    } else {
        cancelConnectionVM();
    }
}

/**
 * Trouve un socket à une position donnée.
 */
function findSocketAtPoint(x, y) {
    // Masquer temporairement l'overlay si nécessaire pour utiliser elementFromPoint
    const overlay = document.querySelector('.connection-drag-overlay');
    if (overlay) overlay.style.pointerEvents = 'none';

    const el = document.elementFromPoint(x, y);
    const socket = el ? el.closest('.thriller-card-socket') : null;

    if (overlay) overlay.style.pointerEvents = 'auto';
    return socket;
}

function handleCardDragEnd(event) {
    event.stopPropagation();
    event.currentTarget.classList.remove('dragging');
    document.querySelectorAll('.thriller-grid-cell').forEach(cell => {
        cell.classList.remove('drop-target-hover');
    });
}

function handleTreeviewDragStart(event, elementId) {
    event.stopPropagation();
    handleTreeviewDragStartVM(elementId);
    event.currentTarget.classList.add('dragging');
    event.dataTransfer.effectAllowed = 'copy';
    event.dataTransfer.setData('text/plain', elementId);
}

function handleTreeviewDragEnd(event) {
    event.stopPropagation();
    event.currentTarget.classList.remove('dragging');
    document.querySelectorAll('.thriller-grid-cell').forEach(cell => {
        cell.classList.remove('drop-target-hover');
    });
}

function handleCellDragOver(event) {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = cardDragState.isTreeviewDrag ? 'copy' : 'move';
    event.currentTarget.classList.add('drop-target-hover');
}

function handleCellDragLeave(event) {
    event.preventDefault();
    event.stopPropagation();
    if (!event.currentTarget.contains(event.relatedTarget)) {
        event.currentTarget.classList.remove('drop-target-hover');
    }
}

function handleCellDrop(event, rowId, columnId) {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.classList.remove('drop-target-hover');

    const result = handleCellDropVM(rowId, columnId);
    if (result.sideEffects && result.sideEffects.shouldSave) saveProject();
    if (result.sideEffects && result.sideEffects.shouldRender) renderThrillerBoard();
}

// ============================================
// CANVAS HANDLERS (stubs)
// ============================================

function handleThrillerCanvasMouseDown(event) { }
function handleThrillerCanvasMouseMove(event) { }
function handleThrillerCanvasMouseUp(event) { }
function handleThrillerCanvasWheel(event) { }

// ============================================
// MODALS
// ============================================

/**
 * Affiche le popover de changement de statut.
 */
function showStatusPopover(event, cardId) {
    const existing = document.querySelector('.thriller-card-status-popover');
    if (existing) existing.remove();

    const card = ThrillerCardRepository.getById(cardId);
    if (!card) return;

    const popover = document.createElement('div');
    popover.className = 'thriller-card-status-popover';

    const footer = event.currentTarget;
    const rect = footer.getBoundingClientRect();

    popover.innerHTML = `
        <div class="thriller-card-status-popover-content">
            <div class="thriller-card-status-popover-header">Changer le statut</div>
            ${Object.entries(THRILLER_CARD_STATUS).map(([key, data]) => `
                <div class="thriller-card-status-option ${key === card.status ? 'active' : ''}"
                     onclick="handleChangeCardStatus('${cardId}', '${key}')"
                     style="border-left-color: ${data.color};">
                    <i data-lucide="${data.icon}" style="width: 14px; height: 14px; color: ${data.color};"></i>
                    <span>${data.label}</span>
                    ${key === card.status ? '<i data-lucide="check" style="width: 14px; height: 14px; margin-left: auto;"></i>' : ''}
                </div>
            `).join('')}
        </div>
    `;

    popover.style.position = 'fixed';
    popover.style.top = `${rect.bottom + 5}px`;
    popover.style.left = `${rect.left}px`;

    document.body.appendChild(popover);
    setTimeout(() => {
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }, 10);

    setTimeout(() => {
        function closePopover(e) {
            if (!popover.contains(e.target)) {
                popover.remove();
                document.removeEventListener('click', closePopover);
            }
        }
        document.addEventListener('click', closePopover);
    }, 100);
}

function handleChangeCardStatus(cardId, newStatus) {
    const result = changeCardStatusVM(cardId, newStatus);

    const popover = document.querySelector('.thriller-card-status-popover');
    if (popover) popover.remove();

    if (result.sideEffects.shouldSave) saveProject();
    if (result.sideEffects.shouldRender) renderThrillerBoard();
}

/**
 * Affiche le modal de la pile de cartes.
 */
function showCardStackModal(rowId, columnId) {
    const cards = getCellCardsVM(rowId, columnId);
    if (!cards || cards.length === 0) return;

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 600px;">
            <div class="modal-header">
                <h3>Cartes de cette cellule (${cards.length})</h3>
                <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                    <i data-lucide="x"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="thriller-stack-modal-list">
                    ${cards.map(card => {
        const typeData = THRILLER_TYPES[card.type];
        const statusData = THRILLER_CARD_STATUS[card.status || 'pending'];
        return `
                            <div class="thriller-stack-modal-item" data-card-id="${card.id}">
                                <div class="thriller-stack-modal-item-header" style="background: ${typeData.color};">
                                    <i data-lucide="${typeData.icon}"></i>
                                    <span>${typeData.label}</span>
                                </div>
                                <div class="thriller-stack-modal-item-content">
                                    <h4>${card.title}</h4>
                                    <div class="thriller-stack-modal-item-status" style="color: ${statusData.color};">
                                        <i data-lucide="${statusData.icon}"></i>
                                        ${statusData.label}
                                    </div>
                                </div>
                                <div class="thriller-stack-modal-item-actions">
                                    <button class="btn btn-sm btn-secondary" onclick="handleBringToFrontFromModal('${card.id}')" title="Mettre au premier plan">
                                        <i data-lucide="bring-to-front"></i>
                                    </button>
                                    <button class="btn btn-sm btn-secondary" onclick="handleEditFromModal('${card.id}')" title="Éditer">
                                        <i data-lucide="edit-2"></i>
                                    </button>
                                    <button class="btn btn-sm btn-danger" onclick="handleDeleteFromModal('${card.id}')" title="Supprimer">
                                        <i data-lucide="trash-2"></i>
                                    </button>
                                </div>
                            </div>
                        `;
    }).join('')}
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    setTimeout(() => {
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }, 50);
}

function handleBringToFrontFromModal(cardId) {
    const modal = document.querySelector('.modal-overlay');
    if (modal) modal.remove();

    const result = bringCardToFrontVM(cardId);
    if (result.sideEffects.shouldSave) saveProject();
    if (result.sideEffects.shouldRender) renderThrillerBoard();
}

function handleEditFromModal(cardId) {
    const modal = document.querySelector('.modal-overlay');
    if (modal) modal.remove();

    const card = ThrillerCardRepository.getById(cardId);
    if (card && card.elementId) {
        editThrillerElement(card.elementId);
    }
}

function handleDeleteFromModal(cardId) {
    if (!confirm('Supprimer cette carte ?')) return;

    const result = deleteCardVM(cardId);

    const modal = document.querySelector('.modal-overlay');
    if (modal) modal.remove();

    if (result.sideEffects.shouldSave) saveProject();
    if (result.sideEffects.shouldRender) renderThrillerBoard();
}

/**
 * Affiche le modal de création/édition de ligne.
 */
function showRowModal(rowId = null) {
    const existingRow = rowId ? ThrillerRowRepository.getById(rowId) : null;
    const isEdit = !!existingRow;

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 400px;">
            <div class="modal-header">
                <h3>${isEdit ? 'Modifier' : 'Nouvelle'} ligne</h3>
                <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                    <i data-lucide="x"></i>
                </button>
            </div>
            <div class="modal-body">
                <form id="rowForm" onsubmit="handleSaveRow(event, ${isEdit ? `'${rowId}'` : 'null'})">
                    <div class="form-group">
                        <label class="form-label" for="rowTitle">Titre</label>
                        <input type="text" class="form-input" id="rowTitle" value="${existingRow?.title || ''}" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="rowColor">Couleur</label>
                        <input type="color" class="form-input" id="rowColor" value="${existingRow?.color || '#95a5a6'}">
                    </div>
                    <div class="modal-actions">
                        <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Annuler</button>
                        <button type="submit" class="btn btn-primary">Enregistrer</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    setTimeout(() => {
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }, 50);
}

function handleSaveRow(event, rowId) {
    event.preventDefault();

    const title = document.getElementById('rowTitle').value;
    const color = document.getElementById('rowColor').value;

    let result;
    if (rowId) {
        result = { success: true, sideEffects: { shouldSave: true, shouldRender: true } };
        ThrillerRowRepository.update(rowId, { title, color });
    } else {
        result = addRowVM({ title, color, type: 'custom' });
    }

    const modal = document.querySelector('.modal-overlay');
    if (modal) modal.remove();

    if (result.sideEffects.shouldSave) saveProject();
    if (result.sideEffects.shouldRender) renderThrillerBoard();
}

/**
 * Affiche le modal de création/édition de colonne.
 */
function showColumnModal(columnId = null) {
    const existingColumn = columnId ? ThrillerColumnRepository.getById(columnId) : null;
    const isEdit = !!existingColumn;

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 400px;">
            <div class="modal-header">
                <h3>${isEdit ? 'Modifier' : 'Nouvelle'} colonne</h3>
                <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                    <i data-lucide="x"></i>
                </button>
            </div>
            <div class="modal-body">
                <form id="columnForm" onsubmit="handleSaveColumn(event, ${isEdit ? `'${columnId}'` : 'null'})">
                    <div class="form-group">
                        <label class="form-label" for="columnTitle">Titre</label>
                        <input type="text" class="form-input" id="columnTitle" value="${existingColumn?.title || ''}" required>
                    </div>
                    <div class="modal-actions">
                        <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Annuler</button>
                        <button type="submit" class="btn btn-primary">Enregistrer</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    setTimeout(() => {
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }, 50);
}

function handleSaveColumn(event, columnId) {
    event.preventDefault();

    const title = document.getElementById('columnTitle').value;

    let result;
    if (columnId) {
        result = { success: true, sideEffects: { shouldSave: true, shouldRender: true } };
        ThrillerColumnRepository.update(columnId, { title });
    } else {
        result = addColumnVM({ title });
    }

    const modal = document.querySelector('.modal-overlay');
    if (modal) modal.remove();

    if (result.sideEffects.shouldSave) saveProject();
    if (result.sideEffects.shouldRender) renderThrillerBoard();
}

// ============================================
// ELEMENT MODAL & FORM
// ============================================

/**
 * Affiche le modal d'édition d'un élément.
 */
/**
 * Affiche le modal d'édition d'un élément.
 */
function editThrillerElement(elementId, isNew = false) {
    const element = ThrillerElementRepository.getById(elementId);
    if (!element) return;

    // Résolution du type
    let typeData = THRILLER_TYPES[element.type];
    if (!typeData && typeof ThrillerTypeRepository !== 'undefined') {
        typeData = ThrillerTypeRepository.getTypeDefinition(element.type);
    }
    // Fallback secure
    if (!typeData) {
        typeData = { label: 'Élément inconnu', icon: 'help-circle', color: '#ccc' };
    }

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 700px;">
            <div class="modal-header">
                <h3>${isNew ? 'Nouveau' : 'Modifier'} ${typeData.label}</h3>
                <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                    <i data-lucide="x"></i>
                </button>
            </div>
            <div class="modal-body">
                <form id="thrillerElementForm" onsubmit="saveThrillerElement(event, '${elementId}', ${isNew})">
                    <div class="form-group">
                        <label class="form-label" for="elementTitle">Titre</label>
                        <input type="text" class="form-input" id="elementTitle" value="${element.title}" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="elementDescription">Description</label>
                        <textarea class="form-input" id="elementDescription" rows="4">${element.description || ''}</textarea>
                    </div>
                    ${renderThrillerElementFields(element)}
                    <div class="modal-actions">
                        <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Annuler</button>
                        <button type="submit" class="btn btn-primary">Sauvegarder</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    setTimeout(() => {
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }, 50);
}

/**
 * Génère les champs de formulaire selon le type d'élément.
 */
function renderThrillerElementFields(element) {
    const chars = typeof project !== 'undefined' && project.characters ? project.characters : [];

    switch (element.type) {
        case 'alibi':
            return `
                <div class="form-row">
                    <div class="form-group" style="flex: 1;">
                        <label class="form-label" for="characterId">Personnage</label>
                        <select class="form-input" id="characterId">
                            <option value="">Sélectionner un personnage</option>
                            ${chars.map(char => `<option value="${char.id}" ${String(element.data.character_id) === String(char.id) ? 'selected' : ''}>${char.name}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group" style="flex: 1;">
                        <label class="form-label" for="forEvent">Pour l'événement</label>
                        <input type="text" class="form-input" id="forEvent" value="${element.data.for_event || ''}">
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label" style="display: flex; align-items: center; gap: 8px;">
                        <input type="checkbox" id="isTrue" ${element.data.is_true ? 'checked' : ''}>
                        Cet alibi est-il vrai ?
                    </label>
                </div>
                <div class="form-row">
                    <div class="form-group" style="flex: 1;">
                        <label class="form-label" for="claimedLocation">Lieu déclaré</label>
                        <input type="text" class="form-input" id="claimedLocation" value="${element.data.claimed_location || ''}">
                    </div>
                    <div class="form-group" style="flex: 1;">
                        <label class="form-label" for="claimedActivity">Activité déclarée</label>
                        <input type="text" class="form-input" id="claimedActivity" value="${element.data.claimed_activity || ''}">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group" style="flex: 1;">
                        <label class="form-label" for="realLocation">Lieu réel</label>
                        <input type="text" class="form-input" id="realLocation" value="${element.data.real_location || ''}">
                    </div>
                    <div class="form-group" style="flex: 1;">
                        <label class="form-label" for="realActivity">Activité réelle</label>
                        <input type="text" class="form-input" id="realActivity" value="${element.data.real_activity || ''}">
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">Témoins</label>
                    <div class="character-pills-container" id="alibiWitnessesContainer">
                        ${renderCharacterPills(element.data.witnesses || [], 'alibiWitnesses')}
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group" style="flex: 1;">
                        <label class="form-label" for="verifiedScene">Vérifié dans la scène</label>
                        <select class="form-input" id="verifiedScene">
                            <option value="">Sélectionner</option>
                            ${renderSceneOptions(element.data.verified_scene)}
                        </select>
                    </div>
                    <div class="form-group" style="flex: 1;">
                        <label class="form-label" for="brokenScene">Brisé dans la scène</label>
                        <select class="form-input" id="brokenScene">
                            <option value="">Sélectionner</option>
                            ${renderSceneOptions(element.data.broken_scene)}
                        </select>
                    </div>
                </div>
            `;

        case 'clue':
            return `
                <div class="form-row">
                    <div class="form-group" style="flex: 1;">
                        <label class="form-label" for="clueType">Type</label>
                        <select class="form-input" id="clueType">
                            <option value="physical" ${element.data.clue_type === 'physical' ? 'selected' : ''}>Physique</option>
                            <option value="testimonial" ${element.data.clue_type === 'testimonial' ? 'selected' : ''}>Témoignage</option>
                            <option value="circumstantial" ${element.data.clue_type === 'circumstantial' ? 'selected' : ''}>Circonstanciel</option>
                            <option value="digital" ${element.data.clue_type === 'digital' ? 'selected' : ''}>Numérique</option>
                            <option value="forensic" ${element.data.clue_type === 'forensic' ? 'selected' : ''}>Médico-légal</option>
                        </select>
                    </div>
                    <div class="form-group" style="flex: 1;">
                        <label class="form-label" for="clueSignificance">Importance</label>
                        <select class="form-input" id="clueSignificance">
                            <option value="minor" ${element.data.significance === 'minor' ? 'selected' : ''}>Mineur</option>
                            <option value="major" ${element.data.significance === 'major' ? 'selected' : ''}>Majeur</option>
                            <option value="critical" ${element.data.significance === 'critical' ? 'selected' : ''}>Critique</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label style="display: flex; align-items: center; gap: 8px;">
                        <input type="checkbox" id="isGenuine" ${element.data.is_genuine !== false ? 'checked' : ''}>
                        Preuve authentique
                    </label>
                </div>
                <div class="form-group">
                    <label class="form-label" for="whatItSuggests">Ce qu'il suggère</label>
                    <textarea class="form-input" id="whatItSuggests" rows="3">${element.data.what_it_suggests || ''}</textarea>
                </div>
                <div class="form-group">
                    <label>Pointe vers les personnages</label>
                    <div class="character-pills-container" id="clueCharactersContainer">
                        ${renderCharacterPills(element.data.points_to_characters || [], 'clueCharacters')}
                    </div>
                </div>
            `;

        case 'secret':
            return `
                <div class="form-row">
                    <div class="form-group" style="flex: 1;">
                        <label class="form-label" for="secretType">Type de secret</label>
                        <select class="form-input" id="secretType">
                            <option value="relationship" ${element.data.secret_type === 'relationship' ? 'selected' : ''}>Relation</option>
                            <option value="identity" ${element.data.secret_type === 'identity' ? 'selected' : ''}>Identité</option>
                            <option value="crime" ${element.data.secret_type === 'crime' ? 'selected' : ''}>Crime</option>
                            <option value="past" ${element.data.secret_type === 'past' ? 'selected' : ''}>Passé</option>
                        </select>
                    </div>
                    <div class="form-group" style="flex: 1;">
                        <label class="form-label" for="secretImportance">Importance</label>
                        <select class="form-input" id="secretImportance">
                            <option value="minor" ${element.data.importance === 'minor' ? 'selected' : ''}>Mineur</option>
                            <option value="major" ${element.data.importance === 'major' ? 'selected' : ''}>Majeur</option>
                            <option value="critical" ${element.data.importance === 'critical' ? 'selected' : ''}>Critique</option>
                        </select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group" style="flex: 1;">
                        <label class="form-label" for="holderCharacterId">Détenu par</label>
                        <select class="form-input" id="holderCharacterId">
                            <option value="">Sélectionner</option>
                            ${chars.map(char => `<option value="${char.id}" ${String(element.data.holder_character_id) === String(char.id) ? 'selected' : ''}>${char.name}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group" style="flex: 1;">
                        <label class="form-label" for="aboutCharacterId">Concernant</label>
                        <select class="form-input" id="aboutCharacterId">
                            <option value="">Sélectionner</option>
                            ${chars.map(char => `<option value="${char.id}" ${String(element.data.about_character_id) === String(char.id) ? 'selected' : ''}>${char.name}</option>`).join('')}
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label" for="secretCurrentStatus">Statut</label>
                    <select class="form-input" id="secretCurrentStatus">
                        <option value="hidden" ${element.data.current_status === 'hidden' ? 'selected' : ''}>Caché</option>
                        <option value="partially_revealed" ${element.data.current_status === 'partially_revealed' ? 'selected' : ''}>Partiellement révélé</option>
                        <option value="fully_revealed" ${element.data.current_status === 'fully_revealed' ? 'selected' : ''}>Révélé</option>
                    </select>
                </div>
            `;

        case 'motive_means_opportunity':
            return `
                <div class="form-row">
                    <div class="form-group" style="flex: 1;">
                        <label class="form-label" for="mmCharacterId">Personnage</label>
                        <select class="form-input" id="mmCharacterId" required>
                            <option value="">Sélectionner</option>
                            ${chars.map(char => `<option value="${char.id}" ${String(element.data.character_id) === String(char.id) ? 'selected' : ''}>${char.name}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group" style="flex: 1;">
                        <label class="form-label" for="forCrimeEvent">Pour crime</label>
                        <input type="text" class="form-input" id="forCrimeEvent" value="${element.data.for_crime || ''}" required>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label" for="actualGuilt">Culpabilité réelle</label>
                    <select class="form-input" id="actualGuilt">
                        <option value="innocent" ${element.data.actual_guilt === 'innocent' ? 'selected' : ''}>Innocent</option>
                        <option value="guilty" ${element.data.actual_guilt === 'guilty' ? 'selected' : ''}>Coupable</option>
                        <option value="accomplice" ${element.data.actual_guilt === 'accomplice' ? 'selected' : ''}>Complice</option>
                    </select>
                </div>
                <div class="form-row">
                    <div class="form-group" style="flex: 1;">
                        <label class="form-label" for="motiveStrength">Force du mobile</label>
                        <select class="form-input" id="motiveStrength">
                            <option value="none" ${element.data.motive_strength === 'none' ? 'selected' : ''}>Aucun</option>
                            <option value="weak" ${element.data.motive_strength === 'weak' ? 'selected' : ''}>Faible</option>
                            <option value="moderate" ${element.data.motive_strength === 'moderate' ? 'selected' : ''}>Modéré</option>
                            <option value="strong" ${element.data.motive_strength === 'strong' ? 'selected' : ''}>Fort</option>
                        </select>
                    </div>
                    <div class="form-group" style="flex: 1; display: flex; gap: 16px; align-items: center; padding-top: 24px;">
                        <label style="display: flex; align-items: center; gap: 8px;">
                            <input type="checkbox" id="hasMeans" ${element.data.has_means ? 'checked' : ''}>
                            A les moyens
                        </label>
                        <label style="display: flex; align-items: center; gap: 8px;">
                            <input type="checkbox" id="hasOpportunity" ${element.data.has_opportunity ? 'checked' : ''}>
                            A l'opportunité
                        </label>
                    </div>
                </div>
            `;

        case 'question':
            return `
                <div class="form-group">
                    <label class="form-label" for="qText">Question</label>
                    <textarea class="form-input" id="qText" rows="2" required>${element.data.question || ''}</textarea>
                </div>
                <div class="form-row">
                    <div class="form-group" style="flex: 1;">
                        <label class="form-label" for="qType">Type</label>
                        <select class="form-input" id="qType">
                            <option value="whodunit" ${element.data.question_type === 'whodunit' ? 'selected' : ''}>Qui l'a fait</option>
                            <option value="how" ${element.data.question_type === 'how' ? 'selected' : ''}>Comment</option>
                            <option value="why" ${element.data.question_type === 'why' ? 'selected' : ''}>Pourquoi</option>
                        </select>
                    </div>
                    <div class="form-group" style="flex: 1;">
                        <label class="form-label" for="qImportance">Importance</label>
                        <select class="form-input" id="qImportance">
                            <option value="minor" ${element.data.importance === 'minor' ? 'selected' : ''}>Mineur</option>
                            <option value="major" ${element.data.importance === 'major' ? 'selected' : ''}>Majeur</option>
                            <option value="critical" ${element.data.importance === 'critical' ? 'selected' : ''}>Critique</option>
                        </select>
                    </div>
                    <div class="form-group" style="flex: 1;">
                        <label class="form-label" for="qStatus">Statut</label>
                        <select class="form-input" id="qStatus">
                            <option value="open" ${element.data.status === 'open' ? 'selected' : ''}>Ouvert</option>
                            <option value="answered" ${element.data.status === 'answered' ? 'selected' : ''}>Répondu</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label" for="qAnswer">Réponse</label>
                    <textarea class="form-input" id="qAnswer" rows="3">${element.data.answer || ''}</textarea>
                </div>
            `;

        case 'reversal':
            return `
                <div class="form-group">
                    <label class="form-label" for="setupBelief">Croyance établie</label>
                    <textarea class="form-input" id="setupBelief" rows="3" required>${element.data.setup_belief || ''}</textarea>
                </div>
                <div class="form-group">
                    <label class="form-label" for="actualTruth">Vérité réelle</label>
                    <textarea class="form-input" id="actualTruth" rows="3" required>${element.data.actual_truth || ''}</textarea>
                </div>
                <div class="form-row">
                    <div class="form-group" style="flex: 1;">
                        <label class="form-label" for="reversalType">Type</label>
                        <select class="form-input" id="reversalType">
                            <option value="identity" ${element.data.reversal_type === 'identity' ? 'selected' : ''}>Identité</option>
                            <option value="motive" ${element.data.reversal_type === 'motive' ? 'selected' : ''}>Mobile</option>
                            <option value="victim" ${element.data.reversal_type === 'victim' ? 'selected' : ''}>Victime</option>
                            <option value="ally_is_enemy" ${element.data.reversal_type === 'ally_is_enemy' ? 'selected' : ''}>L'allié est l'ennemi</option>
                        </select>
                    </div>
                    <div class="form-group" style="flex: 1;">
                        <label class="form-label" for="reversalImpact">Impact</label>
                        <select class="form-input" id="reversalImpact">
                            <option value="minor" ${element.data.impact === 'minor' ? 'selected' : ''}>Mineur</option>
                            <option value="medium" ${element.data.impact === 'medium' ? 'selected' : ''}>Moyen</option>
                            <option value="major_twist" ${element.data.impact === 'major_twist' ? 'selected' : ''}>Rebondissement majeur</option>
                        </select>
                    </div>
                </div>
            `;

        case 'backstory':
            return `
                <div class="form-group">
                    <label class="form-label" for="whenItHappened">Quand c'est arrivé</label>
                    <input type="text" class="form-input" id="whenItHappened" value="${element.data.when_it_happened || ''}" required>
                </div>
                <div class="form-row">
                    <div class="form-group" style="flex: 1;">
                        <label class="form-label" for="backstoryType">Type</label>
                        <select class="form-input" id="backstoryType">
                            <option value="other" ${element.data.event_type === 'other' ? 'selected' : ''}>Autre</option>
                            <option value="original_crime" ${element.data.event_type === 'original_crime' ? 'selected' : ''}>Crime d'origine</option>
                            <option value="trauma" ${element.data.event_type === 'trauma' ? 'selected' : ''}>Traumatisme</option>
                            <option value="betrayal" ${element.data.event_type === 'betrayal' ? 'selected' : ''}>Trahison</option>
                        </select>
                    </div>
                    <div class="form-group" style="flex: 1;">
                        <label class="form-label" for="backstoryImportance">Importance</label>
                        <select class="form-input" id="backstoryImportance">
                            <option value="minor" ${element.data.importance === 'minor' ? 'selected' : ''}>Mineur</option>
                            <option value="major" ${element.data.importance === 'major' ? 'selected' : ''}>Majeur</option>
                            <option value="critical" ${element.data.importance === 'critical' ? 'selected' : ''}>Critique</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label>Personnages impliqués</label>
                    <div class="character-pills-container" id="backstoryCharactersContainer">
                        ${renderCharacterPills(element.data.characters_involved || [], 'backstoryCharacters')}
                    </div>
                </div>
            `;

        case 'knowledge_state':
            return `
                <div class="form-group">
                    <label class="form-label" for="ksCharacterId">Personnage</label>
                    <select class="form-input" id="ksCharacterId">
                        <option value="">Sélectionner</option>
                        ${chars.map(char => `<option value="${char.id}" ${String(element.data.character_id) === String(char.id) ? 'selected' : ''}>${char.name}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label" for="ksAbout">Connaissance concernant</label>
                    <input type="text" class="form-input" id="ksAbout" value="${element.data.about || ''}">
                </div>
                <div class="form-group">
                    <label class="form-label" for="ksDetails">Détails</label>
                    <textarea class="form-input" id="ksDetails" rows="3">${element.data.details || ''}</textarea>
                </div>
            `;

        case 'red_herring':
            return `
                <div class="form-group">
                    <label class="form-label" for="whatItSuggestsRH">Ce qu'il suggère</label>
                    <textarea class="form-input" id="whatItSuggestsRH" rows="3">${element.data.what_it_suggests || ''}</textarea>
                </div>
                <div class="form-group">
                    <label class="form-label" for="misdirectsTo">Dirige vers</label>
                    <select class="form-input" id="misdirectsTo">
                        <option value="">Sélectionner</option>
                        ${chars.map(char => `<option value="${char.id}" ${element.data.misdirects_to === char.id ? 'selected' : ''}>${char.name}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label" for="intendedReaderImpact">Impact lecteur</label>
                    <textarea class="form-input" id="intendedReaderImpact" rows="3">${element.data.intended_reader_impact || ''}</textarea>
                </div>
            `;

        case 'location':
            return `
                <div class="form-group">
                    <label class="form-label" for="locName">Nom du lieu</label>
                    <input type="text" class="form-input" id="locName" value="${element.data.name || ''}">
                </div>
                <div class="form-group">
                    <label class="form-label" for="locCoordinates">Coordonnées</label>
                    <input type="text" class="form-input" id="locCoordinates" value="${element.data.coordinates || ''}">
                </div>
                <div class="form-group">
                    <label class="form-label" for="locDesc">Description</label>
                    <textarea class="form-input" id="locDesc" rows="3">${element.data.description || ''}</textarea>
                </div>
            `;

        default:
            // Gestion des types personnalisés
            if (typeof ThrillerTypeRepository !== 'undefined') {
                const typeDef = ThrillerTypeRepository.getTypeDefinition(element.type);
                if (typeDef && typeDef.fields) {
                    return renderCustomTypeFields(element, typeDef.fields, chars);
                }
            }
            return '<div class="alert alert-info">Aucun champ spécifique configuré pour ce type.</div>';
    }
}

/**
 * Génère les champs pour un type personnalisé.
 */
function renderCustomTypeFields(element, fields, chars) {
    return fields.map(field => {
        const value = element.data[field.key] || '';
        const fieldId = `custom_${field.key}`;

        switch (field.type) {
            case 'textarea':
                return `
                    <div class="form-group">
                        <label class="form-label" for="${fieldId}">${field.label}</label>
                        <textarea class="form-input custom-field" data-key="${field.key}" id="${fieldId}" rows="3">${value}</textarea>
                    </div>
                `;

            case 'select':
                const options = field.options || [];
                return `
                    <div class="form-group">
                        <label class="form-label" for="${fieldId}">${field.label}</label>
                        <select class="form-input custom-field" data-key="${field.key}" id="${fieldId}">
                            <option value="">Sélectionner</option>
                            ${options.map(opt => `<option value="${opt}" ${value === opt ? 'selected' : ''}>${opt}</option>`).join('')}
                        </select>
                    </div>
                `;

            case 'boolean':
                return `
                    <div class="form-group">
                        <label style="display: flex; align-items: center; gap: 8px;">
                            <input type="checkbox" class="custom-field" data-key="${field.key}" id="${fieldId}" ${value ? 'checked' : ''}>
                            ${field.label}
                        </label>
                    </div>
                `;

            case 'character':
                return `
                    <div class="form-group">
                        <label class="form-label" for="${fieldId}">${field.label}</label>
                        <select class="form-input custom-field" data-key="${field.key}" id="${fieldId}">
                            <option value="">Sélectionner un personnage</option>
                            ${chars.map(c => `<option value="${c.id}" ${String(value) === String(c.id) ? 'selected' : ''}>${c.name}</option>`).join('')}
                        </select>
                    </div>
                `;

            case 'scene':
            case 'scene_link':
                return `
                    <div class="form-group">
                        <label class="form-label" for="${fieldId}">${field.label}</label>
                        <select class="form-input custom-field" data-key="${field.key}" id="${fieldId}">
                            <option value="">Sélectionner une scène</option>
                            ${renderSceneOptions(value)}
                        </select>
                    </div>
                `;

            default: // text, link, location, etc.
                return `
                    <div class="form-group">
                        <label class="form-label" for="${fieldId}">${field.label}</label>
                        <input type="text" class="form-input custom-field" data-key="${field.key}" id="${fieldId}" value="${value}">
                    </div>
                `;
        }
    }).join('');
}

/**
 * Sauvegarde un élément depuis le formulaire.
 */
function saveThrillerElement(event, elementId, isNew = false) {
    event.preventDefault();

    const element = ThrillerElementRepository.getById(elementId);
    if (!element) return;

    // Store old character_id for swimlane change detection
    const oldCharacterId = getElementCharacterId(element);

    // Update basic fields
    element.title = document.getElementById('elementTitle').value;
    element.description = document.getElementById('elementDescription').value;
    element.updatedAt = new Date().toISOString();

    // Update type-specific fields
    switch (element.type) {
        case 'alibi':
            element.data = {
                character_id: document.getElementById('characterId')?.value || '',
                for_event: document.getElementById('forEvent')?.value || '',
                is_true: document.getElementById('isTrue')?.checked || false,
                claimed_location: document.getElementById('claimedLocation')?.value || '',
                claimed_activity: document.getElementById('claimedActivity')?.value || '',
                real_location: document.getElementById('realLocation')?.value || '',
                real_activity: document.getElementById('realActivity')?.value || '',
                witnesses: getCharacterPillsData('alibiWitnesses'),
                verified_scene: document.getElementById('verifiedScene')?.value || '',
                broken_scene: document.getElementById('brokenScene')?.value || ''
            };
            break;

        case 'clue':
            element.data = {
                clue_type: document.getElementById('clueType')?.value || 'physical',
                significance: document.getElementById('clueSignificance')?.value || 'minor',
                is_genuine: document.getElementById('isGenuine')?.checked ?? true,
                what_it_suggests: document.getElementById('whatItSuggests')?.value || '',
                points_to_characters: getCharacterPillsData('clueCharacters')
            };
            break;

        case 'secret':
            element.data = {
                secret_type: document.getElementById('secretType')?.value || 'relationship',
                importance: document.getElementById('secretImportance')?.value || 'minor',
                holder_character_id: document.getElementById('holderCharacterId')?.value || '',
                about_character_id: document.getElementById('aboutCharacterId')?.value || '',
                current_status: document.getElementById('secretCurrentStatus')?.value || 'hidden'
            };
            break;

        case 'motive_means_opportunity':
            element.data = {
                character_id: document.getElementById('mmCharacterId')?.value || '',
                for_crime: document.getElementById('forCrimeEvent')?.value || '',
                actual_guilt: document.getElementById('actualGuilt')?.value || 'innocent',
                motive_strength: document.getElementById('motiveStrength')?.value || 'none',
                has_means: document.getElementById('hasMeans')?.checked || false,
                has_opportunity: document.getElementById('hasOpportunity')?.checked || false
            };
            break;

        case 'question':
            element.data = {
                question: document.getElementById('qText')?.value || '',
                question_type: document.getElementById('qType')?.value || 'whodunit',
                importance: document.getElementById('qImportance')?.value || 'minor',
                status: document.getElementById('qStatus')?.value || 'open',
                answer: document.getElementById('qAnswer')?.value || ''
            };
            break;

        case 'reversal':
            element.data = {
                setup_belief: document.getElementById('setupBelief')?.value || '',
                actual_truth: document.getElementById('actualTruth')?.value || '',
                reversal_type: document.getElementById('reversalType')?.value || 'identity',
                impact: document.getElementById('reversalImpact')?.value || 'medium'
            };
            break;

        case 'backstory':
            element.data = {
                when_it_happened: document.getElementById('whenItHappened')?.value || '',
                event_type: document.getElementById('backstoryType')?.value || 'other',
                importance: document.getElementById('backstoryImportance')?.value || 'minor',
                characters_involved: getCharacterPillsData('backstoryCharacters')
            };
            break;

        case 'knowledge_state':
            element.data = {
                character_id: document.getElementById('ksCharacterId')?.value || '',
                about: document.getElementById('ksAbout')?.value || '',
                details: document.getElementById('ksDetails')?.value || ''
            };
            break;

        case 'red_herring':
            element.data = {
                what_it_suggests: document.getElementById('whatItSuggestsRH')?.value || '',
                misdirects_to: document.getElementById('misdirectsTo')?.value || '',
                intended_reader_impact: document.getElementById('intendedReaderImpact')?.value || ''
            };
            break;

        case 'location':
            element.data = {
                name: document.getElementById('locName')?.value || '',
                coordinates: document.getElementById('locCoordinates')?.value || '',
                description: document.getElementById('locDesc')?.value || ''
            };
            break;

        default:
            // Gestion des types personnalisés
            if (typeof ThrillerTypeRepository !== 'undefined') {
                const typeDef = ThrillerTypeRepository.getTypeDefinition(element.type);
                if (typeDef && typeDef.fields) {
                    const customData = {};
                    typeDef.fields.forEach(field => {
                        const fieldId = `custom_${field.key}`;
                        const elementInput = document.getElementById(fieldId);

                        if (elementInput) {
                            if (field.type === 'boolean') {
                                customData[field.key] = elementInput.checked;
                            } else {
                                customData[field.key] = elementInput.value;
                            }
                        }
                    });
                    element.data = customData;
                }
            }
            break;
    }

    // Sync with project
    ThrillerElementRepository._syncToProject();

    // Update associated cards
    updateCardsFromElementVM(elementId);

    // Handle swimlane change
    const newCharacterId = getElementCharacterId(element);
    if (!isNew && oldCharacterId !== newCharacterId) {
        moveCardsToNewSwimlaneVM(elementId, oldCharacterId, newCharacterId);
    }

    // Create card if new element in grid mode
    if (isNew && ThrillerStateRepository.getViewMode() === 'grid') {
        const swimlane = getSwimlaneForElement(element);
        if (swimlane) {
            const columns = ThrillerColumnRepository.getAll();
            const firstColumn = columns.length > 0 ? columns[0] : null;
            if (firstColumn) {
                createCardFromElementVM(elementId, swimlane, firstColumn.id);
            }
        }
    }

    // Duplicate to referenced scenes
    duplicateCardsToScenesVM(elementId);

    // Save and refresh
    saveProject();
    renderThrillerBoard();

    // Close modal
    event.target.closest('.modal-overlay').remove();
}

/**
 * Récupère les données des pills de personnages.
 */
function getCharacterPillsData(fieldName) {
    const container = document.getElementById(fieldName + 'Container');
    if (!container) return [];
    return Array.from(container.querySelectorAll('.character-pill')).map(pill => pill.dataset.charId);
}

/**
 * Génère les options de scène pour les selects.
 */
function renderSceneOptions(selectedId) {
    return renderSceneSelectOptions(selectedId);
}

/**
 * Génère les pills de personnages.
 */
function renderCharacterPills(selectedChars, fieldName) {
    return renderCharacterPillsHTML(selectedChars, fieldName);
}

/**
 * Génère les pills de scènes.
 */
function renderScenePills(selectedScenes, fieldName) {
    return renderScenePillsHTML(selectedScenes, fieldName);
}

/**
 * Génère les éléments de liste.
 */
function renderListItems(items, fieldName) {
    return renderListItemsHTML(items, fieldName);
}

/**
 * Ajoute un personnage pill.
 */
function addCharacterPill(fieldName, charId) {
    if (!charId) return;
    const container = document.getElementById(fieldName + 'Container');
    if (!container) return;

    const existingPills = container.querySelectorAll('.character-pill');
    const existingIds = Array.from(existingPills).map(p => p.dataset.charId);
    if (existingIds.includes(charId)) return;

    existingIds.push(charId);
    container.innerHTML = renderCharacterPillsHTML(existingIds, fieldName);
    setTimeout(() => { if (typeof lucide !== 'undefined') lucide.createIcons(); }, 10);
}

/**
 * Supprime un personnage pill.
 */
function removeCharacterPill(fieldName, charId) {
    const container = document.getElementById(fieldName + 'Container');
    if (!container) return;

    const existingPills = container.querySelectorAll('.character-pill');
    const existingIds = Array.from(existingPills).map(p => p.dataset.charId).filter(id => id !== charId);
    container.innerHTML = renderCharacterPillsHTML(existingIds, fieldName);
    setTimeout(() => { if (typeof lucide !== 'undefined') lucide.createIcons(); }, 10);
}

/**
 * Ajoute une scène pill.
 */
function addScenePill(fieldName, sceneId) {
    if (!sceneId) return;
    const container = document.getElementById(fieldName + 'Container');
    if (!container) return;

    const existingPills = container.querySelectorAll('.scene-pill');
    const existingIds = Array.from(existingPills).map(p => p.dataset.sceneId);
    if (existingIds.includes(sceneId)) return;

    existingIds.push(sceneId);
    container.innerHTML = renderScenePillsHTML(existingIds, fieldName);
    setTimeout(() => { if (typeof lucide !== 'undefined') lucide.createIcons(); }, 10);
}

/**
 * Supprime une scène pill.
 */
function removeScenePill(fieldName, sceneId) {
    const container = document.getElementById(fieldName + 'Container');
    if (!container) return;

    const existingPills = container.querySelectorAll('.scene-pill');
    const existingIds = Array.from(existingPills).map(p => p.dataset.sceneId).filter(id => id !== sceneId);
    container.innerHTML = renderScenePillsHTML(existingIds, fieldName);
    setTimeout(() => { if (typeof lucide !== 'undefined') lucide.createIcons(); }, 10);
}

/**
 * Ajoute un élément à une liste.
 */
function addListItem(fieldName, placeholder = 'Texte...') {
    const container = document.getElementById(fieldName + 'Container');
    if (!container) return;

    const existingInputs = container.querySelectorAll('.list-item-input');
    const existingItems = Array.from(existingInputs).map(input => input.value);
    existingItems.push('');
    container.innerHTML = renderListItemsHTML(existingItems, fieldName);
    setTimeout(() => { if (typeof lucide !== 'undefined') lucide.createIcons(); }, 10);
}

/**
 * Supprime un élément d'une liste.
 */
function removeListItem(fieldName, index) {
    const container = document.getElementById(fieldName + 'Container');
    if (!container) return;

    const existingInputs = container.querySelectorAll('.list-item-input');
    const existingItems = Array.from(existingInputs).map(input => input.value);
    existingItems.splice(index, 1);
    container.innerHTML = renderListItemsHTML(existingItems, fieldName);
    setTimeout(() => { if (typeof lucide !== 'undefined') lucide.createIcons(); }, 10);
}

// ============================================
// LEGACY COMPATIBILITY FUNCTIONS
// ============================================

// Ces fonctions maintiennent la compatibilité avec l'ancien code
function addThrillerElement(type) { handleAddElement(type); }
function deleteThrillerElement(elementId) { handleDeleteElement(elementId); }
function selectThrillerElement(elementId) { handleSelectElement(elementId); }
function selectAndViewThrillerElement(elementId) { handleSelectAndViewElement(elementId); }
function toggleThrillerViewMode() { handleToggleViewMode(); }
function setThrillerColumnMode(mode) { handleSetColumnMode(mode); }
function addThrillerSwimlaneRow() { handleAddRow(); }
function editThrillerRow(rowId) { handleEditRow(rowId); }
function deleteThrillerRow(rowId) { handleDeleteRow(rowId); }
function addThrillerColumn() { handleAddColumn(); }
function editThrillerColumn(columnId) { handleEditColumn(columnId); }
function deleteThrillerColumn(columnId) { handleDeleteColumn(columnId); }
function deleteThrillerCard(cardId) { handleDeleteCard(cardId); }
function bringCardToFront(event, cardId) {
    event.stopPropagation();
    const result = bringCardToFrontVM(cardId);
    if (result.sideEffects.shouldSave) saveProject();
    if (result.sideEffects.shouldRender) renderThrillerBoard();
}
function changeCardStatus(cardId, newStatus) { handleChangeCardStatus(cardId, newStatus); }
function bringCardToFrontAndClose(cardId) { handleBringToFrontFromModal(cardId); }
function editThrillerCardFromModal(cardId) { handleEditFromModal(cardId); }
function deleteThrillerCardFromStack(cardId) { handleDeleteFromModal(cardId); }
function showCardStackModal(event, rowId, columnId) {
    if (event) event.stopPropagation();
    showCardStackModal(rowId, columnId);
}
function filterThrillerElements(filterType) {
    ThrillerStateRepository.setCurrentFilter(filterType);
    renderThrillerBoard();
}
function selectThrillerTab(type) { filterThrillerElements(type); }

// Alias pour getNarrativeColumns et getAutoGeneratedRows (si utilisés ailleurs)
function getNarrativeColumns() { return ThrillerColumnRepository.getNarrativeColumns(); }
function getAutoGeneratedRows() { return ThrillerRowRepository.getAutoRows(); }
