/**
 * Relation Map Handlers
 * Static class to handle user interactions for the relations map.
 */
class RelationMapHandlers {
    static init(viewModel, view) {
        this.viewModel = viewModel;
        this.view = view;
    }

    static handleResetPositions() {
        if (confirm(Localization.t('relations.confirm.reset_positions'))) {
            this.viewModel.resetPositions();
            this.view.render();
            if (typeof showNotification === 'function') showNotification(Localization.t('relations.notify.positions_reset'));
        }
    }

    static handleAutoArrange() {
        this.viewModel.autoArrange();
        this.view.render();
        if (typeof showNotification === 'function') showNotification(Localization.t('relations.notify.auto_arranged'));
    }

    static handleCharacterClick(event, charId) {
        // Don't treat as click if it was a drag
        const id = Number(charId) || charId;
        if (this.viewModel.dragMoved) {
            event.stopPropagation();
            return;
        }

        const shouldShowModal = this.viewModel.toggleCharacterSelection(id);
        if (shouldShowModal) {
            this.view.showRelationModal();
            this.view.updateSelectionUI();
        } else {
            this.view.updateSelectionUI();
        }
    }

    static handleMouseDown(event, charId) {
        const id = Number(charId) || charId;
        event.preventDefault();
        this.viewModel.startDrag(id, event.clientX, event.clientY);

        this._onMouseMove = this.handleMouseMove.bind(this);
        this._onMouseUp = this.handleMouseUp.bind(this);

        document.addEventListener('mousemove', this._onMouseMove);
        document.addEventListener('mouseup', this._onMouseUp);
    }

    static handleMouseMove(event) {
        const dragInfo = this.viewModel.updateDrag(event.clientX, event.clientY);
        if (!dragInfo) return;

        const node = document.getElementById(`char-node-${dragInfo.charId}`);
        const graph = document.getElementById('relationsGraph');
        if (!node || !graph) return;

        const graphRect = graph.getBoundingClientRect();

        // Current position
        const currentLeft = parseFloat(node.style.left);
        const currentTop = parseFloat(node.style.top);

        // New position
        let newLeft = currentLeft + dragInfo.deltaX;
        let newTop = currentTop + dragInfo.deltaY;

        // Limit to graph boundaries
        newLeft = Math.max(50, Math.min(graphRect.width - 50, newLeft));
        newTop = Math.max(50, Math.min(graphRect.height - 50, newTop));

        node.style.left = newLeft + 'px';
        node.style.top = newTop + 'px';

        this.view.updateRelationLines();
    }

    static handleMouseUp(event) {
        document.removeEventListener('mousemove', this._onMouseMove);
        document.removeEventListener('mouseup', this._onMouseUp);

        const node = document.getElementById(`char-node-${this.viewModel.draggedCharId}`);
        if (!node) {
            this.viewModel.stopDrag(0, 0); // Cleanup
            return;
        }

        const finalX = parseFloat(node.style.left);
        const finalY = parseFloat(node.style.top);

        const wasMoved = this.viewModel.stopDrag(finalX, finalY);

        if (wasMoved && typeof showNotification === 'function') {
            showNotification(Localization.t('relations.notify.position_saved'));
        }
    }

    static handleSelectType(type) {
        this.viewModel.setRelationType(type);
        this.view.updateModalTypeSelection(type);
    }

    static handleSaveRelation() {
        const description = document.getElementById('relationDescription').value;
        const isEditing = !!this.viewModel.currentEditingRelationId;
        this.viewModel.saveRelation(description);
        this.view.closeModal();
        this.view.render();
        if (typeof showNotification === 'function') {
            showNotification(isEditing ? Localization.t('relations.notify.relation_updated') : Localization.t('relations.notify.relation_created'));
        }
    }

    static handleCloseModal() {
        this.viewModel.clearSelection();
        this.view.closeModal();
        this.view.updateSelectionUI();
    }

    static handleEditRelation(relId) {
        const relations = this.viewModel.getRelations();
        const relation = relations.find(r => r.id === relId);
        if (!relation) return;

        this.view.showRelationModal(relation);
    }

    static handleDeleteRelation(relId) {
        if (confirm(Localization.t('relations.confirm.delete_relation'))) {
            this.viewModel.deleteRelation(relId);
            this.view.render();
            if (typeof showNotification === 'function') showNotification(Localization.t('relations.notify.relation_deleted'));
        }
    }
}
