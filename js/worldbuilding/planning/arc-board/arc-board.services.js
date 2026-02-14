// ============================================
// ARC BOARD - Services (DragDrop, Connection, etc.)
// ============================================

/**
 * Service unifié de Drag & Drop
 * Gère le drag de cartes, d'items flottants et de colonnes
 */
const DragDropService = {
    // État du drag en cours
    _state: {
        active: false,
        type: null,         // 'card' | 'floating' | 'column'
        itemId: null,
        sourceColumnId: null,
        arcId: null,        // ID de l'arc source (pour le mode compare)
        element: null,
        startX: 0,
        startY: 0,
        offsetX: 0,
        offsetY: 0
    },

    /**
     * Reset l'état
     */
    reset() {
        this._state = {
            active: false,
            type: null,
            itemId: null,
            sourceColumnId: null,
            arcId: null,
            element: null,
            startX: 0,
            startY: 0,
            offsetX: 0,
            offsetY: 0
        };
    },

    /**
     * Démarre le drag d'une carte
     */
    startCardDrag(event, cardId, columnId, arcId = null) {
        event.stopPropagation();

        this._state = {
            active: true,
            type: DragTypes.CARD,
            itemId: cardId,
            sourceColumnId: columnId,
            arcId: arcId,
            element: event.target.closest('.arc-card'),
            startX: event.clientX,
            startY: event.clientY
        };

        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('application/json', JSON.stringify({
            type: 'card',
            cardId: cardId,
            columnId: columnId,
            arcId: arcId
        }));

        if (this._state.element) {
            this._state.element.classList.add('dragging');
        }

        // Activer les zones de drop
        requestAnimationFrame(() => {
            document.querySelectorAll('.arc-column-body').forEach(el => {
                el.classList.add('drop-target');
            });
            document.getElementById('arcBoardCanvas')?.classList.add('drop-zone-active');
        });
    },

    /**
     * Démarre le drag d'un item flottant
     */
    startFloatingDrag(event, itemId, arcId = null) {
        event.stopPropagation();

        this._state = {
            active: true,
            type: DragTypes.FLOATING,
            itemId: itemId,
            sourceColumnId: null,
            arcId: arcId,
            element: event.target.closest('.arc-floating-item'),
            startX: event.clientX,
            startY: event.clientY
        };

        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('application/json', JSON.stringify({
            type: 'floating',
            itemId: itemId,
            arcId: arcId
        }));

        if (this._state.element) {
            this._state.element.classList.add('dragging');
        }

        // Activer les zones de drop (colonnes uniquement pour les items flottants)
        requestAnimationFrame(() => {
            document.querySelectorAll('.arc-column-body').forEach(el => {
                el.classList.add('drop-target');
            });
        });
    },

    /**
     * Démarre le drag d'une carte de la zone "Non attribué"
     */
    startUnassignedDrag(event, sceneId) {
        event.stopPropagation();

        this._state = {
            active: true,
            type: DragTypes.UNASSIGNED,
            sceneId: sceneId,
            sourceColumnId: null,
            element: event.target.closest('.arc-card'),
            startX: event.clientX,
            startY: event.clientY
        };

        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('application/json', JSON.stringify({
            type: 'unassigned',
            sceneId: sceneId
        }));

        if (this._state.element) {
            this._state.element.classList.add('dragging');
        }

        // Activer les zones de drop (colonnes uniquement)
        requestAnimationFrame(() => {
            document.querySelectorAll('.arc-column-body').forEach(el => {
                el.classList.add('drop-target');
            });
        });
    },

    /**
     * Démarre le drag depuis la toolbar pour créer un nouvel item
     */
    startToolbarDrag(event, itemType) {
        event.stopPropagation();

        this._state = {
            active: true,
            type: DragTypes.TOOLBAR,
            itemType: itemType,
            sourceColumnId: null,
            element: event.target.closest('.arc-toolbar-btn'),
            startX: event.clientX,
            startY: event.clientY
        };

        event.dataTransfer.effectAllowed = 'copy';
        event.dataTransfer.setData('application/json', JSON.stringify({
            type: 'toolbar',
            itemType: itemType
        }));

        // Créer un ghost personnalisé
        const ghost = document.createElement('div');
        ghost.className = 'arc-toolbar-drag-ghost';
        ghost.innerHTML = `<i data-lucide="${CreatableItemTypes[itemType]?.icon || 'plus'}"></i><span>${CreatableItemTypes[itemType]?.label || itemType}</span>`;
        ghost.style.position = 'absolute';
        ghost.style.top = '-1000px';
        document.body.appendChild(ghost);
        if (typeof lucide !== 'undefined') lucide.createIcons();
        event.dataTransfer.setDragImage(ghost, 24, 24);
        setTimeout(() => ghost.remove(), 0);

        if (this._state.element) {
            this._state.element.classList.add('dragging');
        }

        // Activer les zones de drop (canvas + colonnes si le type peut être une carte)
        requestAnimationFrame(() => {
            document.getElementById('arcBoardCanvas')?.classList.add('drop-zone-active');

            // Activer les colonnes seulement pour les types qui peuvent être des cartes
            const canBeCard = CreatableItemTypes[itemType]?.canBeCard;
            if (canBeCard) {
                document.querySelectorAll('.arc-column-body').forEach(el => {
                    el.classList.add('drop-target');
                });
            }
        });
    },

    /**
     * Fin du drag
     */
    endDrag(event) {
        if (this._state.element) {
            this._state.element.classList.remove('dragging');
        }

        // Nettoyer les zones de drop
        document.querySelectorAll('.arc-column-body').forEach(el => {
            el.classList.remove('drop-target', 'drop-hover');
        });
        document.getElementById('arcBoardCanvas')?.classList.remove('drop-zone-active', 'drop-hover');

        this.reset();
    },

    /**
     * Gère le dragover sur une colonne
     */
    handleColumnDragOver(event) {
        if (!this._state.active) return;

        // Pour le toolbar, vérifier si le type peut être une carte
        if (this._state.type === DragTypes.TOOLBAR) {
            const canBeCard = CreatableItemTypes[this._state.itemType]?.canBeCard;
            if (!canBeCard) return;
            event.dataTransfer.dropEffect = 'copy';
        } else {
            event.dataTransfer.dropEffect = 'move';
        }

        event.preventDefault();
        event.currentTarget.classList.add('drop-hover');
    },

    /**
     * Gère le dragleave sur une colonne
     */
    handleColumnDragLeave(event) {
        event.currentTarget.classList.remove('drop-hover');
    },

    /**
     * Gère le drop sur une colonne
     */
    handleColumnDrop(event, targetColumnId, targetArcId = null) {
        event.preventDefault();
        event.stopPropagation();
        event.currentTarget.classList.remove('drop-hover');

        if (!this._state.active) return;

        // Utiliser l'arcId de la cible, sinon l'arcId de la source, sinon l'arc courant
        const arcId = targetArcId || this._state.arcId || ArcBoardState.currentArcId;
        const arc = ArcRepository.getById(arcId);
        if (!arc) return;

        try {
            if (this._state.type === DragTypes.TOOLBAR) {
                // Créer une nouvelle carte depuis la toolbar
                const itemType = this._state.itemType;
                const canBeCard = CreatableItemTypes[itemType]?.canBeCard;

                if (canBeCard) {
                    // Pour la toolbar, utiliser l'arcId cible ou l'arc courant
                    const card = CardRepository.create(arcId, targetColumnId, itemType);
                    ArcBoardViewModel.renderItems();
                }
            } else if (this._state.type === DragTypes.CARD) {
                // Déplacer une carte entre colonnes
                if (this._state.sourceColumnId !== targetColumnId) {
                    CardRepository.move(
                        arcId,
                        this._state.sourceColumnId,
                        targetColumnId,
                        this._state.itemId
                    );
                }
            } else if (this._state.type === DragTypes.FLOATING) {
                // Convertir un item flottant en carte
                const item = BoardItemRepository.getById(arcId, this._state.itemId);
                if (item) {
                    const card = convertItemToCard(item);
                    const isSceneItem = item.type === 'scene' && item.sceneId;

                    // Supprimer l'item flottant (cela met columnId à null pour les scenes)
                    BoardItemRepository.delete(arcId, this._state.itemId);

                    const column = BoardItemRepository.getById(arcId, targetColumnId);
                    if (column) {
                        if (!column.cards) column.cards = [];
                        column.cards.push(card);

                        // Si c'est un item scene, mettre à jour scenePresence.columnId APRÈS la suppression
                        if (isSceneItem && arc.scenePresence) {
                            const presence = arc.scenePresence.find(p => p.sceneId == item.sceneId);
                            if (presence) {
                                presence.columnId = targetColumnId;
                            }
                        }

                        saveProject();
                    }
                }
            } else if (this._state.type === DragTypes.UNASSIGNED) {
                // Déplacer une scène non attribuée vers une colonne
                const sceneId = this._state.sceneId;
                if (sceneId && arc.scenePresence) {
                    const presence = arc.scenePresence.find(p => p.sceneId == sceneId);
                    if (presence) {
                        // Récupérer les infos de la scène
                        let sceneTitle = 'Scène sans titre';
                        let breadcrumb = '';

                        for (const act of project.acts || []) {
                            for (const chapter of act.chapters || []) {
                                const scene = chapter.scenes?.find(s => s.id == sceneId);
                                if (scene) {
                                    sceneTitle = scene.title || 'Scène sans titre';
                                    breadcrumb = `${act.title || 'Acte'} › ${chapter.title || 'Chapitre'}`;
                                    break;
                                }
                            }
                        }

                        // Créer la carte scene
                        const card = {
                            id: generateUniqueId('card'),
                            type: 'scene',
                            sceneId: sceneId,
                            sceneTitle: sceneTitle,
                            breadcrumb: breadcrumb,
                            intensity: presence.intensity || 3,
                            status: presence.status || 'development',
                            notes: presence.notes || ''
                        };

                        // Ajouter à la colonne cible
                        const column = BoardItemRepository.getById(arc.id, targetColumnId);
                        if (column) {
                            if (!column.cards) column.cards = [];
                            column.cards.push(card);

                            // Mettre à jour scenePresence.columnId
                            presence.columnId = targetColumnId;

                            saveProject();
                        }
                    }
                }
            }

            ArcBoardViewModel.renderItems();

            // Rafraîchir le panneau arcScenePanel s'il est visible (pour CARD et FLOATING)
            const arcPanel = document.getElementById('arcScenePanel');
            if (arcPanel && !arcPanel.classList.contains('hidden') && typeof renderArcScenePanel === 'function') {
                renderArcScenePanel();
            }
        } finally {
            this.reset();
        }
    },

    /**
     * Gère le drop sur la zone "Non attribué"
     */
    handleUnassignedDrop(event) {
        event.preventDefault();
        event.stopPropagation();
        event.currentTarget.classList.remove('drop-hover', 'drag-over');

        if (!this._state.active) return;

        const arc = ArcBoardViewModel.getCurrentArc();
        if (!arc) return;

        try {
            if (this._state.type === DragTypes.CARD) {
                // Retirer la carte de sa colonne
                const sourceColumn = BoardItemRepository.getById(arc.id, this._state.sourceColumnId);
                if (sourceColumn && sourceColumn.cards) {
                    const card = sourceColumn.cards.find(c => c.id === this._state.itemId);
                    if (card) {
                        // Retirer la carte de la colonne
                        sourceColumn.cards = sourceColumn.cards.filter(c => c.id !== this._state.itemId);

                        // Si c'est une carte de scène, mettre à jour scenePresence.columnId à null
                        if (card.type === 'scene' && card.sceneId && arc.scenePresence) {
                            const presence = arc.scenePresence.find(p => p.sceneId == card.sceneId);
                            if (presence) {
                                presence.columnId = null;
                            }
                        }

                        saveProject();
                    }
                }
            }
            // Si c'est déjà un item flottant, il reste flottant (rien à faire)

            ArcBoardViewModel.renderItems();

            // Rafraîchir le panneau arcScenePanel
            const arcPanel = document.getElementById('arcScenePanel');
            if (arcPanel && !arcPanel.classList.contains('hidden') && typeof renderArcScenePanel === 'function') {
                renderArcScenePanel();
            }
        } finally {
            this.reset();
        }
    },

    /**
     * Gère le dragover sur le canvas
     */
    handleCanvasDragOver(event) {
        // Ne pas accepter si on est sur une colonne
        if (event.target.closest('.arc-column')) return;

        // Permettre le drop pour les cartes (conversion en item flottant) et la toolbar
        if (this._state.type === DragTypes.CARD) {
            event.preventDefault();
            event.dataTransfer.dropEffect = 'move';
            document.getElementById('arcBoardCanvas')?.classList.add('drop-hover');
        } else if (this._state.type === DragTypes.TOOLBAR) {
            event.preventDefault();
            event.dataTransfer.dropEffect = 'copy';
            document.getElementById('arcBoardCanvas')?.classList.add('drop-hover');
        }
    },

    /**
     * Gère le dragleave sur le canvas
     */
    handleCanvasDragLeave(event) {
        if (!event.relatedTarget || !event.currentTarget.contains(event.relatedTarget)) {
            document.getElementById('arcBoardCanvas')?.classList.remove('drop-hover');
        }
    },

    /**
     * Gère le drop sur le canvas (convertit carte en item flottant ou crée depuis toolbar)
     */
    handleCanvasDrop(event) {
        // Ignorer si on drop sur une colonne
        if (event.target.closest('.arc-column')) return;

        event.preventDefault();
        document.getElementById('arcBoardCanvas')?.classList.remove('drop-hover');

        const arc = ArcBoardViewModel.getCurrentArc();
        if (!arc) return;

        try {
            const position = ArcBoardViewModel._clientToCanvasPosition(event.clientX, event.clientY);

            if (this._state.type === DragTypes.TOOLBAR) {
                // Créer un nouvel item depuis la toolbar à la position du drop
                const item = BoardItemRepository.create(arc.id, this._state.itemType, position);
                ArcBoardViewModel.renderItems();
                ArcBoardViewModel.selectItem(item.id);
            } else if (this._state.type === DragTypes.CARD) {
                // Convertir une carte en item flottant
                CardRepository.convertToItem(
                    arc.id,
                    this._state.sourceColumnId,
                    this._state.itemId,
                    position
                );
                ArcBoardViewModel.renderItems();

                // Rafraîchir le panneau arcScenePanel s'il est visible
                const arcPanel = document.getElementById('arcScenePanel');
                if (arcPanel && !arcPanel.classList.contains('hidden') && typeof renderArcScenePanel === 'function') {
                    renderArcScenePanel();
                }
            }
        } finally {
            this.reset();
        }
    },

    /**
     * Vérifie si un drag est en cours
     */
    isActive() {
        return this._state.active;
    },

    /**
     * Récupère le type de drag en cours
     */
    getType() {
        return this._state.type;
    }
};

/**
 * Service de gestion des Connexions
 */
const ConnectionService = {
    /**
     * Active/désactive le mode connexion
     */
    toggle() {
        if (ArcBoardState.activeTool === ToolTypes.CONNECT) {
            this.cancel();
        } else {
            ArcBoardState.activeTool = ToolTypes.CONNECT;
            ArcBoardState.connectionSource = null;
            this._updateUI();
        }
    },

    /**
     * Annule le mode connexion
     */
    cancel() {
        ArcBoardState.activeTool = ToolTypes.SELECT;
        ArcBoardState.connectionSource = null;
        this._cleanupUI();
        ArcBoardViewModel.setTool(ToolTypes.SELECT);
    },

    /**
     * Gère un clic sur un item en mode connexion
     */
    handleClick(itemId) {
        if (ArcBoardState.activeTool !== ToolTypes.CONNECT) return false;

        const arc = ArcBoardViewModel.getCurrentArc();
        if (!arc) return false;

        if (!ArcBoardState.connectionSource) {
            // Premier clic: sélectionner la source
            ArcBoardState.connectionSource = itemId;
            this._updateSourceUI(itemId);
            return true;
        } else {
            // Deuxième clic: créer la connexion ou annuler
            if (ArcBoardState.connectionSource === itemId) {
                // Clic sur le même élément = annuler
                this.cancel();
                return true;
            }

            // Créer la connexion
            const sides = this._calculateBestSides(ArcBoardState.connectionSource, itemId);
            ConnectionRepository.create(arc.id, ArcBoardState.connectionSource, itemId, sides);

            // Reset pour nouvelle connexion
            ArcBoardState.connectionSource = null;
            this._updateUI();
            ArcBoardView.renderConnections(arc);

            return true;
        }
    },

    /**
     * Trouve un élément par son ID (item ou carte)
     */
    _findElement(id) {
        return document.getElementById(`item-${id}`)
            || document.querySelector(`[data-card-id="${id}"]`);
    },

    /**
     * Calcule les meilleurs côtés pour une connexion
     */
    _calculateBestSides(fromId, toId) {
        const fromEl = this._findElement(fromId);
        const toEl = this._findElement(toId);

        if (!fromEl || !toEl) return { fromSide: 'right', toSide: 'left' };

        const fromRect = fromEl.getBoundingClientRect();
        const toRect = toEl.getBoundingClientRect();

        const fromCenterX = fromRect.left + fromRect.width / 2;
        const fromCenterY = fromRect.top + fromRect.height / 2;
        const toCenterX = toRect.left + toRect.width / 2;
        const toCenterY = toRect.top + toRect.height / 2;

        const dx = toCenterX - fromCenterX;
        const dy = toCenterY - fromCenterY;

        if (Math.abs(dx) > Math.abs(dy)) {
            return dx > 0
                ? { fromSide: 'right', toSide: 'left' }
                : { fromSide: 'left', toSide: 'right' };
        } else {
            return dy > 0
                ? { fromSide: 'bottom', toSide: 'top' }
                : { fromSide: 'top', toSide: 'bottom' };
        }
    },

    _updateUI() {
        const hint = document.getElementById('connectionModeHint');
        if (hint) {
            hint.style.display = 'flex';
            document.getElementById('connectionHintText').textContent = 'Cliquez sur l\'élément source';
        }

        // Inclure aussi les cartes comme éléments connectables
        document.querySelectorAll('.arc-column, .arc-floating-item, .arc-card').forEach(el => {
            el.classList.add('connectable');
            el.classList.remove('connection-source', 'connection-target');
        });

        if (typeof lucide !== 'undefined') lucide.createIcons();
    },

    _updateSourceUI(sourceId) {
        const sourceEl = this._findElement(sourceId);
        if (sourceEl) {
            sourceEl.classList.add('connection-source');
            sourceEl.classList.remove('connectable');
        }

        document.getElementById('connectionHintText').textContent = 'Cliquez sur l\'élément cible';

        // Inclure aussi les cartes comme cibles potentielles
        document.querySelectorAll('.arc-column, .arc-floating-item, .arc-card').forEach(el => {
            const elId = el.id?.replace('item-', '') || el.dataset.cardId;
            if (elId !== sourceId) {
                el.classList.add('connection-target');
            }
        });
    },

    _cleanupUI() {
        const hint = document.getElementById('connectionModeHint');
        if (hint) hint.style.display = 'none';

        document.querySelectorAll('.arc-column, .arc-floating-item, .arc-card').forEach(el => {
            el.classList.remove('connectable', 'connection-source', 'connection-target');
        });
    }
};

/**
 * Service de gestion du Pan (déplacement du canvas)
 */
const PanService = {
    _state: {
        active: false,
        startX: 0,
        startY: 0
    },

    start(event) {
        this._state = {
            active: true,
            startX: event.clientX - ArcBoardState.panX,
            startY: event.clientY - ArcBoardState.panY
        };
        document.getElementById('arcBoardCanvas')?.classList.add('panning');
    },

    move(event) {
        if (!this._state.active) return;

        ArcBoardState.panX = event.clientX - this._state.startX;
        ArcBoardState.panY = event.clientY - this._state.startY;
        ArcBoardViewModel._updateCanvasTransform();
    },

    end() {
        this._state.active = false;
        document.getElementById('arcBoardCanvas')?.classList.remove('panning');
    },

    isActive() {
        return this._state.active;
    }
};

/**
 * Service de redimensionnement des colonnes
 */
const ResizeService = {
    _state: {
        active: false,
        columnId: null,
        arcId: null,
        startX: 0,
        startWidth: 0
    },

    start(event, columnId, arcId = null) {
        event.stopPropagation();
        event.preventDefault();

        const el = document.getElementById(`item-${columnId}`);
        if (!el) return;

        this._state = {
            active: true,
            columnId: columnId,
            arcId: arcId,
            startX: event.clientX,
            startWidth: parseInt(el.style.width) || ArcBoardConfig.column.defaultWidth
        };
    },

    move(event) {
        if (!this._state.active) return;

        const dx = (event.clientX - this._state.startX) / ArcBoardState.zoom;
        let newWidth = this._state.startWidth + dx;

        newWidth = Math.max(ArcBoardConfig.column.minWidth, Math.min(ArcBoardConfig.column.maxWidth, newWidth));

        const el = document.getElementById(`item-${this._state.columnId}`);
        if (el) {
            el.style.width = `${newWidth}px`;
        }
    },

    end() {
        if (!this._state.active) return;

        const el = document.getElementById(`item-${this._state.columnId}`);
        if (el) {
            // Utiliser l'arcId stocké ou l'arc courant
            const targetArcId = this._state.arcId || ArcBoardState.currentArcId;
            if (targetArcId) {
                BoardItemRepository.update(targetArcId, this._state.columnId, {
                    width: parseInt(el.style.width) || ArcBoardConfig.column.defaultWidth
                });
            }
        }

        this._state = { active: false, columnId: null, arcId: null, startX: 0, startWidth: 0 };
    },

    isActive() {
        return this._state.active;
    }
};

/**
 * Service de redimensionnement vertical des arcs en mode Compare
 */
const CompareResizeService = {
    _state: {
        active: false,
        arcId: null,
        startY: 0,
        startHeight: 0,
        minHeight: 100  // Hauteur minimale d'un arc
    },

    /**
     * Démarre le redimensionnement d'un arc
     */
    start(event, arcId) {
        event.stopPropagation();
        event.preventDefault();

        const section = document.querySelector(`.arc-compare-section[data-arc-id="${arcId}"]`);
        if (!section) return;

        this._state = {
            active: true,
            arcId: arcId,
            startY: event.clientY,
            startHeight: section.offsetHeight,
            minHeight: 100
        };

        // Ajouter les listeners globaux
        document.addEventListener('mousemove', this._onMouseMove);
        document.addEventListener('mouseup', this._onMouseUp);
        document.body.style.cursor = 'ns-resize';
        document.body.style.userSelect = 'none';
    },

    /**
     * Handler de mouvement (bound)
     */
    _onMouseMove: function(event) {
        CompareResizeService.move(event);
    },

    /**
     * Handler de fin (bound)
     */
    _onMouseUp: function(event) {
        CompareResizeService.end(event);
    },

    /**
     * Déplacement pendant le redimensionnement
     */
    move(event) {
        if (!this._state.active) return;

        const dy = event.clientY - this._state.startY;
        let newHeight = this._state.startHeight + dy;

        // Appliquer la hauteur minimale
        newHeight = Math.max(this._state.minHeight, newHeight);

        // Mettre à jour visuellement la section
        const section = document.querySelector(`.arc-compare-section[data-arc-id="${this._state.arcId}"]`);
        if (section) {
            section.style.height = `${newHeight}px`;

            // Marquer si on est à la hauteur minimale
            if (newHeight <= this._state.minHeight) {
                section.classList.add('min-height');
            } else {
                section.classList.remove('min-height');
            }
        }

        // Recalculer les positions des arcs suivants
        this._updateFollowingArcs();
    },

    /**
     * Met à jour les positions des arcs qui suivent l'arc redimensionné
     */
    _updateFollowingArcs() {
        const sections = document.querySelectorAll('.arc-compare-section');
        let currentY = 0;

        sections.forEach(section => {
            section.style.top = `${currentY}px`;
            currentY += section.offsetHeight;
        });
    },

    /**
     * Fin du redimensionnement
     */
    end(event) {
        if (!this._state.active) return;

        // Sauvegarder la hauteur dans l'état
        const section = document.querySelector(`.arc-compare-section[data-arc-id="${this._state.arcId}"]`);
        if (section) {
            const newHeight = section.offsetHeight;
            ArcBoardState.compareArcHeights[this._state.arcId] = newHeight;
        }

        // Nettoyer
        document.removeEventListener('mousemove', this._onMouseMove);
        document.removeEventListener('mouseup', this._onMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';

        this._state = {
            active: false,
            arcId: null,
            startY: 0,
            startHeight: 0,
            minHeight: 100
        };

        // Re-render les connexions
        ArcBoardView._renderCompareConnections();
    },

    isActive() {
        return this._state.active;
    }
};

/**
 * Service de déplacement des items (mousedown/mousemove)
 */
const ItemMoveService = {
    _state: {
        active: false,
        itemId: null,
        arcId: null,
        startX: 0,
        startY: 0,
        itemStartX: 0,
        itemStartY: 0
    },

    start(event, itemId, arcId = null) {
        const el = document.getElementById(`item-${itemId}`);
        if (!el) return;

        this._state = {
            active: true,
            itemId: itemId,
            arcId: arcId,
            startX: event.clientX,
            startY: event.clientY,
            itemStartX: parseInt(el.style.left) || 0,
            itemStartY: parseInt(el.style.top) || 0
        };

        el.classList.add('dragging');
    },

    move(event) {
        if (!this._state.active) return;

        const dx = (event.clientX - this._state.startX) / ArcBoardState.zoom;
        const dy = (event.clientY - this._state.startY) / ArcBoardState.zoom;

        let newX = this._state.itemStartX + dx;
        let newY = this._state.itemStartY + dy;

        // Snap to grid
        if (ArcBoardConfig.grid.snapEnabled) {
            const gridSize = ArcBoardConfig.grid.size;
            newX = Math.round(newX / gridSize) * gridSize;
            newY = Math.round(newY / gridSize) * gridSize;
        }

        const el = document.getElementById(`item-${this._state.itemId}`);
        if (el) {
            el.style.left = `${newX}px`;
            el.style.top = `${newY}px`;
        }

        // Mettre à jour les connexions en temps réel
        if (ArcBoardState.multiArcMode === MultiArcModes.COMPARE) {
            ArcBoardView._renderCompareConnections();
        } else {
            const arc = ArcBoardViewModel.getCurrentArc();
            if (arc) {
                ArcBoardView.renderConnections(arc);
            }
        }
    },

    end() {
        if (!this._state.active) return;

        const el = document.getElementById(`item-${this._state.itemId}`);
        if (el) {
            el.classList.remove('dragging');

            // Utiliser l'arcId stocké ou l'arc courant
            const targetArcId = this._state.arcId || ArcBoardState.currentArcId;
            if (targetArcId) {
                BoardItemRepository.updatePosition(
                    targetArcId,
                    this._state.itemId,
                    parseInt(el.style.left) || 0,
                    parseInt(el.style.top) || 0
                );
            }
        }

        this._state = { active: false, itemId: null, arcId: null, startX: 0, startY: 0, itemStartX: 0, itemStartY: 0 };
    },

    isActive() {
        return this._state.active;
    }
};
