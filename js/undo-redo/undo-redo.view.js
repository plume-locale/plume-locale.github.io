/**
 * [MVVM : View]
 * Gestion de l'interface utilisateur pour l'Undo/Redo
 */

const UndoRedoView = {
    /**
     * Met à jour l'état des boutons undo/redo dans le header
     */
    updateButtons() {
        const hUndo = document.getElementById('headerUndoBtn');
        const hRedo = document.getElementById('headerRedoBtn');
        const mUndo = document.getElementById('mobileUndoBtn');
        const mRedo = document.getElementById('mobileRedoBtn');

        const canUndo = window.historyStack && window.historyStack.length > 0;
        const canRedo = window.redoStack && window.redoStack.length > 0;

        if (hUndo) {
            hUndo.disabled = !canUndo;
            hUndo.classList.toggle('disabled', !canUndo);
            this._ensurePopupButton(hUndo, 'undo');
        }
        if (hRedo) {
            hRedo.disabled = !canRedo;
            hRedo.classList.toggle('disabled', !canRedo);
            this._ensurePopupButton(hRedo, 'redo');
        }
        if (mUndo) {
            mUndo.disabled = !canUndo;
            mUndo.classList.toggle('disabled', !canUndo);
        }
        if (mRedo) {
            mRedo.disabled = !canRedo;
            mRedo.classList.toggle('disabled', !canRedo);
        }

        // Si la popup est ouverte, la rafraîchir
        const popup = document.getElementById('undoRedoPopup');
        if (popup && popup.classList.contains('active') && popup.dataset.activeType) {
            // Retrouver le bouton qui a ouvert la popup
            const activeBtn = document.querySelector(`.undo-redo-btn[data-popup-type="${popup.dataset.activeType}"]`) ||
                (popup.dataset.activeType === 'undo' ? hUndo : hRedo);

            if (activeBtn) {
                this.showPopup(popup.dataset.activeType, activeBtn);
            }
        }
    },

    /**
     * S'assure que les événements de popup sont attachés aux boutons
     */
    _ensurePopupButton(btn, type) {
        if (!btn.dataset.popupInitialized) {
            btn.addEventListener('mouseenter', () => this.showPopup(type, btn));
            btn.addEventListener('mouseleave', (e) => {
                if (!e.relatedTarget?.closest('.undo-redo-popup')) {
                    this.hidePopup();
                }
            });
            btn.dataset.popupInitialized = 'true';
        }
    },

    /**
     * Affiche la popup d'historique
     */
    showPopup(type, buttonElement) {
        let popup = document.getElementById('undoRedoPopup');
        if (!popup) {
            popup = document.createElement('div');
            popup.id = 'undoRedoPopup';
            popup.className = 'undo-redo-popup';
            popup.addEventListener('mouseleave', () => this.hidePopup());
            document.body.appendChild(popup);
        }

        const stack = type === 'undo' ? window.historyStack : window.redoStack;
        const title = type === 'undo' ? Localization.t('undoredo.title.undo') || 'Historique d\'annulation' : Localization.t('undoredo.title.redo') || 'Historique de rétablissement';

        if (!stack || stack.length === 0) {
            popup.innerHTML = `
                <div class="undo-redo-header"><span>${title}</span></div>
                <div class="undo-redo-empty">${Localization.t('undoredo.empty') || 'Aucune action disponible'}</div>
            `;
        } else {
            const displayStack = [...stack].reverse().slice(0, 15);
            const countLabel = Localization.t('undoredo.actions_count', stack.length, stack.length > 1 ? 's' : '') || `${stack.length} action${stack.length > 1 ? 's' : ''}`;

            popup.innerHTML = `
                <div class="undo-redo-header">
                    <span>${title}</span>
                    <span>${countLabel}</span>
                </div>
                <ul class="undo-redo-list">
                    ${displayStack.map((snap, idx) => {
                const label = Localization.t('undoredo.label.' + snap.label) || snap.label || Localization.t('undoredo.default_label') || 'Action sans nom';
                return `
                            <li class="undo-redo-item" onclick="UndoRedoViewModel.jumpToHistoryState('${type}', ${stack.length - 1 - idx})">
                                <span class="undo-redo-item-label">${label}</span>
                                <span class="undo-redo-item-time">${this.formatTimestamp(snap.timestamp)}</span>
                            </li>
                        `;
            }).join('')}
                </ul>
            `;
        }

        const rect = buttonElement.getBoundingClientRect();
        popup.style.top = (rect.bottom + window.scrollY) + 'px';
        popup.style.left = (rect.left + rect.width / 2 + window.scrollX) + 'px';
        popup.classList.add('active');
        popup.dataset.activeType = type;
    },

    /**
     * Masque la popup
     */
    hidePopup() {
        const popup = document.getElementById('undoRedoPopup');
        if (popup) popup.classList.remove('active');
    },

    /**
     * Formate un timestamp pour l'affichage
     */
    formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
};
