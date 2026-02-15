// ============================================
// ARC BOARD - ViewModel (State & Logic)
// ============================================

/**
 * Modes d'affichage multi-arcs
 */
const MultiArcModes = {
    SOLO: 'solo',
    COMPARE: 'compare'
};

/**
 * État global du Arc Board (observable)
 */
const ArcBoardState = {
    // Arc courant
    currentArcId: null,

    // Vue & Navigation
    zoom: 1,
    panX: 0,
    panY: 0,

    // Sélection
    selectedItems: [],

    // Outil actif
    activeTool: ToolTypes.SELECT,

    // Mode connexion
    connectionSource: null,

    // Panneau contextuel
    contextPanelOpen: false,

    // Formulaires inline
    showingArcForm: false,
    showingCategoryForm: false,
    editingArcId: null,

    // Presse-papier
    clipboard: null,

    // === MULTI-ARCS ===
    multiArcMode: MultiArcModes.SOLO,
    multiArcBarExpanded: false,
    compareArcs: [],         // IDs des arcs à comparer (incluant l'arc principal)
    compareLayout: 'horizontal', // 'horizontal' ou 'vertical'
    interArcConnectionSource: null, // Pour créer des connexions inter-arcs
    compareArcHeights: {},   // Hauteurs personnalisées par arc en mode Compare { arcId: height }
    compareArcOpacities: {}, // Opacités personnalisées par arc en mode Compare { arcId: 0-100 }

    // Reset l'état
    reset() {
        this.currentArcId = null;
        this.zoom = 1;
        this.panX = 0;
        this.panY = 0;
        this.selectedItems = [];
        this.activeTool = ToolTypes.SELECT;
        this.connectionSource = null;
        this.contextPanelOpen = false;
        this.showingArcForm = false;
        this.showingCategoryForm = false;
        this.editingArcId = null;
        // Reset multi-arcs
        this.multiArcMode = MultiArcModes.SOLO;
        this.multiArcBarExpanded = false;
        this.compareArcs = [];
        this.compareLayout = 'horizontal';
        this.interArcConnectionSource = null;
        this.compareArcHeights = {};
        this.compareArcOpacities = {};
    }
};

/**
 * ViewModel principal - Coordonne les actions
 */
const ArcBoardViewModel = {
    // ==========================================
    // NAVIGATION & ARCS
    // ==========================================

    /**
     * Ouvre un arc dans le board
     */
    openArc(arcId) {
        const arc = ArcRepository.getById(arcId);
        if (!arc) return false;

        // Initialiser le board si nécessaire
        if (!arc.board) {
            arc.board = createBoardModel();
        }

        ArcBoardState.currentArcId = arcId;
        ArcBoardState.selectedItems = [];
        ArcBoardState.zoom = 1;
        ArcBoardState.panX = 0;
        ArcBoardState.panY = 0;

        this.render();
        return true;
    },

    /**
     * Ferme l'arc courant
     */
    closeArc() {
        ArcBoardState.currentArcId = null;
        ArcBoardState.selectedItems = [];
        ArcBoardView.renderWelcome();
        ArcBoardView.renderSidebar();
    },

    /**
     * Récupère l'arc courant
     */
    getCurrentArc() {
        return ArcRepository.getById(ArcBoardState.currentArcId);
    },

    // ==========================================
    // RENDU
    // ==========================================

    /**
     * Rendu complet de l'interface
     */
    render() {
        ArcBoardView.renderSidebar();

        // Intégration avec le système d'onglets (Tabs) et Split View
        // On évite d'écraser #editorView directement si le système d'onglets est actif 
        // ET qu'on n'est pas déjà dans un processus de rendu de panneau (split/tab).
        const isTabsSystem = typeof tabsState !== 'undefined' && tabsState.enabled;
        const isSplitRendering = document.getElementById('editorView-backup') !== null;

        if (isTabsSystem && !isSplitRendering) {
            // Si on demande un rendu mais qu'on n'est pas dans le flux des onglets
            if (typeof currentView !== 'undefined' && currentView !== 'arcs') {
                if (typeof switchView === 'function') {
                    switchView('arcs');
                    return;
                }
            } else if (typeof renderTabs === 'function') {
                renderTabs();
                return;
            }
        }

        const arc = this.getCurrentArc();
        if (arc) {
            ArcBoardView.renderCanvas(arc);
            ArcBoardView.renderItems(arc);
            ArcBoardView.renderConnections(arc);
        } else {
            ArcBoardView.renderWelcome();
        }
    },

    /**
     * Rendu partiel des items seulement
     */
    renderItems() {
        const arc = this.getCurrentArc();
        if (arc) {
            ArcBoardView.renderItems(arc);
            ArcBoardView.renderConnections(arc);
        }
    },

    // ==========================================
    // SÉLECTION
    // ==========================================

    /**
     * Sélectionne un item
     * @param {string} itemId - ID de l'item
     * @param {boolean} addToSelection - Ajouter à la sélection existante
     * @param {string|null} arcId - ID de l'arc (optionnel, pour le mode compare)
     */
    selectItem(itemId, addToSelection = false, arcId = null) {
        if (ArcBoardState.activeTool === ToolTypes.CONNECT) {
            return ConnectionService.handleClick(itemId);
        }

        if (addToSelection) {
            const index = ArcBoardState.selectedItems.indexOf(itemId);
            if (index === -1) {
                ArcBoardState.selectedItems.push(itemId);
            } else {
                ArcBoardState.selectedItems.splice(index, 1);
            }
        } else {
            ArcBoardState.selectedItems = [itemId];
        }

        this._updateSelectionUI();

        // Mettre à jour le panneau contextuel
        if (ArcBoardState.selectedItems.length === 1) {
            // Utiliser l'arcId fourni ou l'arc courant
            const targetArcId = arcId || ArcBoardState.currentArcId;
            const arc = ArcRepository.getById(targetArcId);
            if (arc) {
                const item = BoardItemRepository.getById(arc.id, itemId);
                if (item) {
                    ArcBoardView.renderContextPanel(item);
                    if (!ArcBoardState.contextPanelOpen) {
                        this.toggleContextPanel();
                    }
                }
            }
        }
    },

    /**
     * Désélectionne tout
     */
    deselectAll() {
        ArcBoardState.selectedItems = [];
        this._updateSelectionUI();

        const arc = this.getCurrentArc();
        if (arc) {
            ArcBoardView.renderContextPanelDefault(arc);
        }
    },

    /**
     * Sélectionne tous les items
     */
    selectAll() {
        const arc = this.getCurrentArc();
        if (!arc) return;

        ArcBoardState.selectedItems = arc.board.items.map(i => i.id);
        this._updateSelectionUI();
    },

    _updateSelectionUI() {
        document.querySelectorAll('.arc-column, .arc-floating-item').forEach(el => {
            el.classList.remove('selected');
        });
        document.querySelectorAll('.arc-connection-line').forEach(el => {
            el.classList.remove('selected');
        });

        ArcBoardState.selectedItems.forEach(id => {
            const el = document.getElementById(`item-${id}`);
            if (el) el.classList.add('selected');

            const line = document.querySelector(`[data-connection-id="${id}"]`);
            if (line) line.classList.add('selected');
        });
    },

    // ==========================================
    // OUTILS
    // ==========================================

    /**
     * Change l'outil actif
     */
    setTool(tool) {
        // Annuler le mode connexion si on change d'outil
        if (ArcBoardState.activeTool === ToolTypes.CONNECT && tool !== ToolTypes.CONNECT) {
            ConnectionService.cancel();
        }

        ArcBoardState.activeTool = tool;

        // Mettre à jour l'UI
        document.querySelectorAll('.arc-toolbar-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        const activeBtn = document.querySelector(`.arc-toolbar-btn[data-tool="${tool}"]`);
        if (activeBtn) activeBtn.classList.add('active');

        // Changer le curseur
        const canvas = document.getElementById('arcBoardCanvas');
        if (canvas) {
            canvas.classList.remove('tool-pan', 'tool-connect');
            if (tool === ToolTypes.PAN) canvas.classList.add('tool-pan');
            if (tool === ToolTypes.CONNECT) canvas.classList.add('tool-connect');
        }
    },

    // ==========================================
    // ZOOM & PAN
    // ==========================================

    /**
     * Zoom avant/arrière
     */
    zoom(delta) {
        const newZoom = ArcBoardState.zoom + (delta * ArcBoardConfig.canvas.zoomStep);
        ArcBoardState.zoom = Math.max(
            ArcBoardConfig.canvas.minZoom,
            Math.min(ArcBoardConfig.canvas.maxZoom, newZoom)
        );
        this._updateCanvasTransform();
    },

    /**
     * Reset zoom et position
     */
    resetView() {
        ArcBoardState.zoom = 1;
        ArcBoardState.panX = 0;
        ArcBoardState.panY = 0;
        this._updateCanvasTransform();
    },

    /**
     * Pan le canvas
     */
    pan(deltaX, deltaY) {
        ArcBoardState.panX += deltaX;
        ArcBoardState.panY += deltaY;
        this._updateCanvasTransform();
    },

    _updateCanvasTransform() {
        const content = document.getElementById('arcBoardContent');
        if (content) {
            content.style.transform = `scale(${ArcBoardState.zoom}) translate(${ArcBoardState.panX}px, ${ArcBoardState.panY}px)`;
        }

        const zoomLevel = document.getElementById('arcZoomLevel');
        if (zoomLevel) {
            zoomLevel.textContent = `${Math.round(ArcBoardState.zoom * 100)}%`;
        }
    },

    // ==========================================
    // ITEMS
    // ==========================================

    /**
     * Ajoute un item au centre du canvas visible
     */
    addItem(type) {
        const arc = this.getCurrentArc();
        if (!arc) return null;

        const position = this._getCenterPosition();
        const item = BoardItemRepository.create(arc.id, type, position);

        this.renderItems();
        this.selectItem(item.id);

        return item;
    },

    /**
     * Ajoute un item à une position spécifique
     */
    addItemAt(type, clientX, clientY) {
        const arc = this.getCurrentArc();
        if (!arc) return null;

        const position = this._clientToCanvasPosition(clientX, clientY);
        const item = BoardItemRepository.create(arc.id, type, position);

        this.renderItems();
        this.selectItem(item.id);

        return item;
    },

    /**
     * Supprime les items sélectionnés
     */
    deleteSelected() {
        const arc = this.getCurrentArc();
        if (!arc || ArcBoardState.selectedItems.length === 0) return;

        ArcBoardState.selectedItems.forEach(id => {
            // Vérifier si c'est une connexion
            const conn = ConnectionRepository.getById(arc.id, id);
            if (conn) {
                ConnectionRepository.delete(arc.id, id);
            } else {
                BoardItemRepository.delete(arc.id, id);
            }
        });

        ArcBoardState.selectedItems = [];
        this.renderItems();

        // Mettre à jour le panneau arcScenePanel s'il est visible
        const arcPanel = document.getElementById('arcScenePanel');
        if (arcPanel && !arcPanel.classList.contains('hidden') && typeof renderArcScenePanel === 'function') {
            renderArcScenePanel();
        }
    },

    /**
     * Met à jour un item
     * @param {string} itemId - ID de l'item
     * @param {object} data - Données à mettre à jour
     * @param {string|null} arcId - ID de l'arc (optionnel, pour le mode compare)
     */
    updateItem(itemId, data, arcId = null) {
        const targetArcId = arcId || ArcBoardState.currentArcId;
        const arc = ArcRepository.getById(targetArcId);
        if (!arc) return;

        BoardItemRepository.update(arc.id, itemId, data);
    },

    /**
     * Met à jour la position d'un item
     */
    updateItemPosition(itemId, x, y) {
        const arc = this.getCurrentArc();
        if (!arc) return;

        BoardItemRepository.updatePosition(arc.id, itemId, x, y);
        ArcBoardView.renderConnections(arc);
    },

    // ==========================================
    // CARTES
    // ==========================================

    /**
     * Ajoute une carte à une colonne
     * @param {string} columnId - ID de la colonne
     * @param {string} type - Type de carte
     * @param {string|null} arcId - ID de l'arc (optionnel, pour le mode compare)
     */
    addCard(columnId, type = 'note', arcId = null) {
        const targetArcId = arcId || ArcBoardState.currentArcId;
        const arc = ArcRepository.getById(targetArcId);
        if (!arc) return null;

        const card = CardRepository.create(arc.id, columnId, type);
        this.renderItems();
        return card;
    },

    /**
     * Supprime une carte
     * @param {string} columnId - ID de la colonne
     * @param {string} cardId - ID de la carte
     * @param {string|null} arcId - ID de l'arc (optionnel, pour le mode compare)
     */
    deleteCard(columnId, cardId, arcId = null) {
        const targetArcId = arcId || ArcBoardState.currentArcId;
        const arc = ArcRepository.getById(targetArcId);
        if (!arc) return;

        CardRepository.delete(arc.id, columnId, cardId);
        this.renderItems();

        // Mettre à jour le panneau arcScenePanel s'il est visible
        const arcPanel = document.getElementById('arcScenePanel');
        if (arcPanel && !arcPanel.classList.contains('hidden') && typeof renderArcScenePanel === 'function') {
            renderArcScenePanel();
        }
    },

    /**
     * Met à jour une carte
     * @param {string} columnId - ID de la colonne
     * @param {string} cardId - ID de la carte
     * @param {object} data - Données à mettre à jour
     * @param {string|null} arcId - ID de l'arc (optionnel, pour le mode compare)
     */
    updateCard(columnId, cardId, data, arcId = null) {
        const targetArcId = arcId || ArcBoardState.currentArcId;
        const arc = ArcRepository.getById(targetArcId);
        if (!arc) return;

        CardRepository.update(arc.id, columnId, cardId, data);
    },

    // ==========================================
    // COPY/PASTE
    // ==========================================

    /**
     * Copie les items sélectionnés
     */
    copy() {
        const arc = this.getCurrentArc();
        if (!arc) return;

        const itemsToCopy = arc.board.items.filter(i =>
            ArcBoardState.selectedItems.includes(i.id)
        );
        ArcBoardState.clipboard = JSON.parse(JSON.stringify(itemsToCopy));
    },

    /**
     * Colle les items du presse-papier
     */
    paste() {
        if (!ArcBoardState.clipboard?.length) return;

        const arc = this.getCurrentArc();
        if (!arc) return;

        const offset = 40;

        ArcBoardState.clipboard.forEach(item => {
            const newItem = JSON.parse(JSON.stringify(item));
            newItem.id = generateUniqueId('item');
            newItem.x += offset;
            newItem.y += offset;

            if (newItem.cards) {
                newItem.cards.forEach(card => {
                    card.id = generateUniqueId('card');
                });
            }

            arc.board.items.push(newItem);
        });

        saveProject();
        this.renderItems();
    },

    // ==========================================
    // PANNEAU CONTEXTUEL
    // ==========================================

    toggleContextPanel() {
        ArcBoardState.contextPanelOpen = !ArcBoardState.contextPanelOpen;
        const panel = document.getElementById('arcContextPanel');
        if (panel) {
            panel.classList.toggle('collapsed', !ArcBoardState.contextPanelOpen);
        }
    },

    // ==========================================
    // FORMULAIRES
    // ==========================================

    showArcForm(arcId = null) {
        ArcBoardState.editingArcId = arcId;
        ArcBoardState.showingArcForm = true;
        ArcBoardState.showingCategoryForm = false;
        ArcBoardView.renderSidebar();
    },

    hideArcForm() {
        ArcBoardState.showingArcForm = false;
        ArcBoardState.editingArcId = null;
        ArcBoardView.renderSidebar();
    },

    showCategoryForm() {
        ArcBoardState.showingCategoryForm = true;
        ArcBoardState.showingArcForm = false;
        ArcBoardView.renderSidebar();
    },

    hideCategoryForm() {
        ArcBoardState.showingCategoryForm = false;
        ArcBoardView.renderSidebar();
    },

    // ==========================================
    // HELPERS
    // ==========================================

    _getCenterPosition() {
        const canvas = document.getElementById('arcBoardCanvas');
        if (!canvas) return { x: 100, y: 100 };

        const rect = canvas.getBoundingClientRect();
        let x = (rect.width / 2 - ArcBoardState.panX) / ArcBoardState.zoom;
        let y = (rect.height / 2 - ArcBoardState.panY) / ArcBoardState.zoom;

        return this._snapToGrid({ x, y });
    },

    _clientToCanvasPosition(clientX, clientY) {
        const content = document.getElementById('arcBoardContent');
        if (!content) return { x: clientX, y: clientY };

        const rect = content.getBoundingClientRect();
        let x = (clientX - rect.left) / ArcBoardState.zoom;
        let y = (clientY - rect.top) / ArcBoardState.zoom;

        return this._snapToGrid({ x, y });
    },

    _snapToGrid(position) {
        if (!ArcBoardConfig.grid.snapEnabled) return position;

        const gridSize = ArcBoardConfig.grid.size;
        return {
            x: Math.round(position.x / gridSize) * gridSize,
            y: Math.round(position.y / gridSize) * gridSize
        };
    },

    // ==========================================
    // MULTI-ARCS
    // ==========================================

    /**
     * Bascule l'affichage de la barre multi-arcs
     */
    toggleMultiArcBar() {
        ArcBoardState.multiArcBarExpanded = !ArcBoardState.multiArcBarExpanded;
        this.render();
    },

    /**
     * Change le mode d'affichage multi-arcs
     */
    setMultiArcMode(mode) {
        if (!Object.values(MultiArcModes).includes(mode)) return;

        const previousMode = ArcBoardState.multiArcMode;
        ArcBoardState.multiArcMode = mode;

        // Expand la barre si on passe en mode Compare
        if (mode !== MultiArcModes.SOLO) {
            ArcBoardState.multiArcBarExpanded = true;
        }

        // Initialiser compareArcs si on passe en mode Compare
        if (mode === MultiArcModes.COMPARE && ArcBoardState.compareArcs.length === 0) {
            if (ArcBoardState.currentArcId) {
                ArcBoardState.compareArcs = [ArcBoardState.currentArcId];
            }
        }

        // Nettoyer les arcs comparés si on quitte le mode Compare
        if (previousMode === MultiArcModes.COMPARE && mode !== MultiArcModes.COMPARE) {
            ArcBoardState.compareArcs = [];
        }

        this.render();
    },

    /**
     * Ajoute un arc à comparer
     */
    addCompareArc(arcId) {
        if (!arcId) return;
        if (ArcBoardState.compareArcs.includes(arcId)) return;

        ArcBoardState.compareArcs.push(arcId);
        this.render();
    },

    /**
     * Retire un arc de la comparaison
     */
    removeCompareArc(arcId) {
        // Garder au moins un arc
        if (ArcBoardState.compareArcs.length <= 1) return;

        const index = ArcBoardState.compareArcs.indexOf(arcId);
        if (index > -1) {
            ArcBoardState.compareArcs.splice(index, 1);
            this.render();
        }
    },

    /**
     * Change le layout du mode Compare
     */
    setCompareLayout(layout) {
        if (layout === 'vertical' || layout === 'horizontal') {
            ArcBoardState.compareLayout = layout;
            this.render();
        }
    },

    /**
     * Récupère les arcs disponibles pour ajouter à la comparaison
     */
    getAvailableArcsForAdd() {
        const allArcs = ArcRepository.getAll();
        return allArcs.filter(arc => !ArcBoardState.compareArcs.includes(arc.id));
    },

    /**
     * Définit l'opacité d'un arc en mode compare
     * @param {string} arcId - ID de l'arc
     * @param {number} opacity - Opacité (0-100)
     */
    setArcOpacity(arcId, opacity) {
        const value = Math.max(0, Math.min(100, parseInt(opacity)));
        ArcBoardState.compareArcOpacities[arcId] = value;

        // Mettre à jour le DOM sans re-render complet
        const section = document.querySelector(`.arc-compare-section[data-arc-id="${arcId}"]`);
        if (section) {
            section.style.setProperty('--arc-opacity', value / 100);
            // Mettre à jour l'affichage de la valeur
            const valueDisplay = section.querySelector('.arc-compare-opacity-value');
            if (valueDisplay) {
                valueDisplay.textContent = `${value}%`;
            }
        }
    },

    // ==========================================
    // SCENE PANEL (Editor Integration)
    // ==========================================

    /**
     * Alterne la visibilité du panneau des arcs pour une scène
     */
    toggleScenePanel() {
        const panel = document.getElementById('arcScenePanel');
        const toolBtn = document.getElementById('toolArcsBtn');
        const sidebarBtn = document.getElementById('sidebarArcsBtn');
        if (!panel) return;

        panel.classList.toggle('hidden');
        if (!panel.classList.contains('hidden')) {
            this.renderScenePanel();
            if (toolBtn) toolBtn.classList.add('active');
            if (sidebarBtn) sidebarBtn.classList.add('active');
        } else {
            if (toolBtn) toolBtn.classList.remove('active');
            if (sidebarBtn) sidebarBtn.classList.remove('active');
        }
    },

    /**
     * Rendu du panneau des arcs pour la scène courante
     */
    renderScenePanel() {
        ArcBoardView.renderScenePanel();
    },

    /**
     * Ajoute un arc à la scène courante
     */
    addArcToCurrentScene(arcId) {
        if (!arcId || !currentSceneId || !currentChapterId || !currentActId) return;

        const arc = ArcRepository.getById(arcId);
        if (!arc) return;

        if (!arc.scenePresence) arc.scenePresence = [];

        // Vérifier si déjà présent
        if (arc.scenePresence.some(p => p.sceneId == currentSceneId)) return;

        // Ajouter la présence (Arc général par défaut = columnId: null)
        arc.scenePresence.push({
            actId: currentActId,
            chapterId: currentChapterId,
            sceneId: currentSceneId,
            intensity: 3,
            notes: '',
            status: 'development',
            columnId: null
        });

        saveProject();
        this.renderScenePanel();

        // Rafraîchir le board si cet arc est ouvert
        if (ArcBoardState.currentArcId === arcId) {
            this.renderItems();
        }
    },

    /**
     * Retire un arc de la scène courante
     */
    removeArcFromScene(arcId) {
        if (!currentSceneId) return;

        const arc = ArcRepository.getById(arcId);
        if (!arc) return;

        // Supprimer la carte scene du arc-board si elle existe
        if (arc.board && arc.board.items) {
            arc.board.items.forEach(item => {
                if (item.type === 'column' && item.cards) {
                    item.cards = item.cards.filter(card => !(card.type === 'scene' && card.sceneId == currentSceneId));
                }
            });
            // Supprimer aussi tout élément flottant scene
            arc.board.items = arc.board.items.filter(item => !(item.type === 'scene' && item.sceneId == currentSceneId));
        }

        arc.scenePresence = arc.scenePresence.filter(p => p.sceneId != currentSceneId);
        saveProject();
        this.renderScenePanel();

        // Rafraîchir le board si cet arc est ouvert
        if (ArcBoardState.currentArcId === arcId) {
            this.renderItems();
        }
    },

    /**
     * Met à jour l'intensité d'un arc pour la scène courante
     */
    updateArcIntensity(arcId, intensity) {
        if (!currentSceneId) return;

        const arc = ArcRepository.getById(arcId);
        if (!arc?.scenePresence) return;

        const presence = arc.scenePresence.find(p => p.sceneId == currentSceneId);
        if (presence) {
            presence.intensity = parseInt(intensity);

            // Synchroniser avec la carte/item sur le board
            this._syncSceneData(arc, currentSceneId, { intensity: parseInt(intensity) });

            saveProject();
            this.renderScenePanel();
            if (ArcBoardState.currentArcId === arcId) this.renderItems();
        }
    },

    /**
     * Met à jour le statut d'un arc pour la scène courante
     */
    updateArcStatus(arcId, status) {
        if (!currentSceneId) return;

        const arc = ArcRepository.getById(arcId);
        if (!arc?.scenePresence) return;

        const presence = arc.scenePresence.find(p => p.sceneId == currentSceneId);
        if (presence) {
            presence.status = status;

            // Synchroniser
            this._syncSceneData(arc, currentSceneId, { status });

            saveProject();
            this.renderScenePanel();
            if (ArcBoardState.currentArcId === arcId) this.renderItems();
        }
    },

    /**
     * Met à jour la colonne d'un arc pour la scène courante
     */
    updateArcColumn(arcId, columnId) {
        if (!currentSceneId) return;

        const arc = ArcRepository.getById(arcId);
        if (!arc) return;

        const targetColumnId = (columnId && columnId !== 'null' && columnId !== '') ? columnId : null;

        // Mettre à jour scenePresence
        if (arc.scenePresence) {
            const presence = arc.scenePresence.find(p => p.sceneId == currentSceneId);
            if (presence) {
                presence.columnId = targetColumnId;
            } else {
                // Fallback
                arc.scenePresence.push({
                    sceneId: currentSceneId,
                    actId: currentActId,
                    chapterId: currentChapterId,
                    columnId: targetColumnId,
                    intensity: 3,
                    status: 'development',
                    notes: ''
                });
            }
        }

        // Réorganiser sur le board
        if (!arc.board) arc.board = createBoardModel();

        // 1. Enlever la scène de partout sur le board
        arc.board.items.forEach(item => {
            if (item.type === 'column' && item.cards) {
                item.cards = item.cards.filter(c => !(c.type === 'scene' && c.sceneId == currentSceneId));
            }
        });
        arc.board.items = arc.board.items.filter(item => !(item.type === 'scene' && item.sceneId == currentSceneId));

        // 2. Ajouter à la nouvelle colonne si spécifiée
        if (targetColumnId) {
            const column = arc.board.items.find(i => i.id === targetColumnId && i.type === 'column');
            if (column) {
                const presence = arc.scenePresence.find(p => p.sceneId == currentSceneId);
                const sceneInfo = this._getSceneInfo(currentSceneId);

                if (!column.cards) column.cards = [];
                column.cards.push(createCardModel('scene', {
                    sceneId: currentSceneId,
                    sceneTitle: sceneInfo.title,
                    breadcrumb: sceneInfo.breadcrumb,
                    intensity: presence.intensity,
                    status: presence.status,
                    notes: presence.notes
                }));
            }
        }

        saveProject();
        this.renderScenePanel();
        if (ArcBoardState.currentArcId === arcId) this.renderItems();
    },

    /**
     * Met à jour les notes d'un arc pour la scène courante
     */
    updateArcNotes(arcId, notes) {
        if (!currentSceneId) return;

        const arc = ArcRepository.getById(arcId);
        if (!arc?.scenePresence) return;

        const presence = arc.scenePresence.find(p => p.sceneId == currentSceneId);
        if (presence) {
            presence.notes = notes;

            // Synchroniser
            this._syncSceneData(arc, currentSceneId, { notes });

            saveProject();
            // Pas besoin de re-render le panel ici pour éviter de perdre le focus si on appelle sur oninput,
            // mais on appelle généralement sur onblur
            if (ArcBoardState.currentArcId === arcId) this.renderItems();
        }
    },

    /**
     * Synchronise les données d'une scène sur le board (carte ou flottant)
     */
    _syncSceneData(arc, sceneId, data) {
        if (!arc.board?.items) return;

        let found = false;
        // 1. Chercher dans les colonnes
        arc.board.items.forEach(item => {
            if (item.type === 'column' && item.cards) {
                const card = item.cards.find(c => c.type === 'scene' && c.sceneId == sceneId);
                if (card) {
                    Object.assign(card, data);
                    found = true;
                }
            }
        });

        // 2. Chercher en flottant
        if (!found) {
            const floating = arc.board.items.find(i => i.type === 'scene' && i.sceneId == sceneId);
            if (floating) {
                Object.assign(floating, data);
            }
        }
    },

    /**
     * Récupère les infos d'une scène (titre, breadcrumb)
     */
    _getSceneInfo(sceneId) {
        let title = 'Scène sans titre';
        let breadcrumb = '';

        for (const act of project.acts || []) {
            for (const chapter of act.chapters || []) {
                const scene = chapter.scenes?.find(s => s.id == sceneId);
                if (scene) {
                    title = scene.title || 'Scène sans titre';
                    const actTitle = act.title || `Acte ${project.acts.indexOf(act) + 1}`;
                    const chapterTitle = chapter.title || `Chapitre ${act.chapters.indexOf(chapter) + 1}`;
                    breadcrumb = `${actTitle} › ${chapterTitle}`;
                    break;
                }
            }
        }

        return { title, breadcrumb };
    }
};
