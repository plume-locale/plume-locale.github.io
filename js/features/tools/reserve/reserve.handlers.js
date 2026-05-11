/**
 * Handlers for the Reserve feature
 */
const ReserveHandlers = {
    _searchQuery: '',
    _searchTimeout: null,

    /**
     * Entry point to bury selected text
     */
    async onBurySelection() {
        console.log('[ReserveHandlers] onBurySelection called');
        const selection = window.getSelection();
        
        if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
            if (typeof showNotification === 'function') {
                showNotification(Localization.t('notification.no_selection') || 'Aucun texte sélectionné');
            }
            return;
        }

        const range = selection.getRangeAt(0);
        const container = range.commonAncestorContainer;
        
        // Find if we are in an editor
        let editor = container.nodeType === 1 ? container.closest('.editor-textarea') : container.parentElement?.closest('.editor-textarea');
        
        if (!editor && document.activeElement && document.activeElement.classList.contains('editor-textarea')) {
            editor = document.activeElement;
        }

        if (!editor) {
            if (typeof showNotification === 'function') {
                showNotification(Localization.t('reserve.error_no_editor'));
            }
            return;
        }

        const div = document.createElement('div');
        div.appendChild(range.cloneContents());
        const content = div.innerHTML;

        if (!content || content.trim() === '') return;

        const sceneId = editor.getAttribute('data-scene-id') || (typeof currentSceneId !== 'undefined' ? currentSceneId : null);
        
        try {
            const item = await ReserveViewModel.bury(content, sceneId);
            
            if (item) {
                range.deleteContents();
                if (typeof this._syncEditor === 'function') this._syncEditor(editor);
                
                if (typeof showNotification === 'function') {
                    showNotification(Localization.t('reserve.buried') || 'Texte mis en réserve');
                }

                // Refresh UI
                if (typeof currentView !== 'undefined' && currentView === 'reserve') {
                    ReserveView.render();
                }
                ReserveView.renderSidebar();
            }
        } catch (error) {
            console.error('[ReserveHandlers] Error burying text:', error);
        }
    },

    /**
     * Restores an item into the editor
     */
    async onRestore(id) {
        console.log('[ReserveHandlers] onRestore called:', id);
        const item = ReserveViewModel.getItems().find(i => i.id === id);
        if (!item) return;

        const editor = document.querySelector('.editor-textarea');
        if (!editor) {
            if (typeof showNotification === 'function') {
                showNotification(Localization.t('reserve.error_no_restore_editor'));
            }
            return;
        }

        try {
            // Check if selection exists in editor, otherwise append at end
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0 && editor.contains(selection.anchorNode)) {
                const range = selection.getRangeAt(0);
                range.deleteContents();
                const div = document.createElement('div');
                div.innerHTML = item.content;
                const fragment = document.createDocumentFragment();
                while (div.firstChild) fragment.appendChild(div.firstChild);
                range.insertNode(fragment);
            } else {
                editor.innerHTML += item.content;
            }

            if (typeof this._syncEditor === 'function') this._syncEditor(editor);
            await ReserveViewModel.incinerate(id);
            
            if (typeof showNotification === 'function') {
                showNotification(Localization.t('reserve.restored') || 'Texte restauré');
            }

            this.closeModal();
            if (typeof currentView !== 'undefined' && currentView === 'reserve') {
                ReserveView.render();
            }
            ReserveView.renderSidebar();
        } catch (error) {
            console.error('[ReserveHandlers] Error restoring text:', error);
        }
    },

    /**
     * Copy to clipboard
     */
    async onCopy(id) {
        const item = ReserveViewModel.getItems().find(i => i.id === id);
        if (!item) return;

        try {
            const plainText = ReserveView._stripHtml(item.content);
            await navigator.clipboard.writeText(plainText);
            if (typeof showNotification === 'function') {
                showNotification(Localization.t('reserve.copied') || 'Copié dans le presse-papier');
            }
        } catch (err) {
            console.error('[ReserveHandlers] Copy failed:', err);
        }
    },

    /**
     * Toggles pinned status (for sidebar visibility)
     */
    async onTogglePin(id) {
        console.log('[ReserveHandlers] onTogglePin:', id);
        const success = await ReserveViewModel.togglePin(id);
        if (success) {
            if (typeof currentView !== 'undefined' && currentView === 'reserve') {
                ReserveView.render();
            }
            ReserveView.renderSidebar();
        }
    },

    /**
     * Handles search input
     */
    onSearch(query) {
        this._searchQuery = query;
        
        if (this._searchTimeout) clearTimeout(this._searchTimeout);
        
        this._searchTimeout = setTimeout(() => {
            ReserveView.render();
        }, 300);
    },

    /**
     * Delete item
     */
    async onIncinerate(id) {
        if (!confirm(Localization.t('reserve.confirm_delete') || 'Supprimer définitivement cet extrait ?')) return;

        const success = await ReserveViewModel.incinerate(id);
        if (success) {
            this.closeModal();
            if (typeof currentView !== 'undefined' && currentView === 'reserve') {
                ReserveView.render();
            }
            ReserveView.renderSidebar();
        }
    },

    /**
     * Modal management
     */
    openModal(id) {
        console.log('[ReserveHandlers] Opening modal for:', id);
        const item = ReserveViewModel.getItems().find(i => i.id === id);
        if (!item) return;

        const modal = document.getElementById('reserve-modal');
        const content = document.getElementById('reserve-modal-content');
        if (!modal || !content) return;
        
        const context = item.sourceSceneTitle ? `${item.sourceChapterTitle || ''} > ${item.sourceSceneTitle}` : Localization.t('reserve.origin_unknown');

        content.innerHTML = `
            <div style="padding: 1.5rem; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; background: var(--bg-secondary);">
                <div style="flex: 1; margin-right: 2rem;">
                    <input type="text" id="reserve-edit-title" value="${item.title || ''}" placeholder="${Localization.t('reserve.title_placeholder') || 'Titre de l\'extrait...'}" 
                           style="background: transparent; border: none; border-bottom: 1px solid transparent; color: var(--text-primary); font-size: 1.4rem; font-weight: 700; width: 100%; outline: none; transition: all 0.2s; padding: 2px 0;"
                           onfocus="this.style.borderBottomColor='var(--accent-gold)'" onblur="this.style.borderBottomColor='transparent'">
                    <div style="font-size: 0.8rem; color: var(--accent-gold); margin-top: 4px; display: flex; align-items: center; gap: 4px;">
                        <i data-lucide="map-pin" style="width: 12px; height: 12px;"></i> ${context}
                    </div>
                </div>
                <button class="btn btn-icon reserve-modal-close" 
                        onclick="ReserveHandlers.closeModal()" 
                        title="${Localization.t('btn.close')}"
                        style="border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; transition: all 0.2s; color: var(--text-primary); border: none; background: transparent; cursor: pointer; font-size: 24px; font-weight: normal; line-height: 1;">
                    &times;
                </button>
            </div>
            
            <div style="display: flex; flex: 1; overflow: hidden; background: var(--bg-primary);">
                <!-- Main Content -->
                <div style="flex: 2; padding: 2.5rem; overflow-y: auto; line-height: 1.8; font-size: 1.15rem; color: var(--text-primary); font-family: var(--font-serif, serif); white-space: pre-wrap; border-right: 1px solid var(--border-color);">
                    ${item.content}
                </div>
                
                <!-- Sidebar Metadata -->
                <div style="flex: 1; min-width: 250px; background: var(--bg-secondary); display: flex; flex-direction: column; padding: 1.5rem; gap: 1.5rem; overflow-y: auto;">
                    <div>
                        <label style="display: block; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted); margin-bottom: 0.6rem; letter-spacing: 0.05em;">
                            <i data-lucide="message-square" style="width: 12px; height: 12px; vertical-align: middle; margin-right: 4px;"></i> ${Localization.t('reserve.comment_label') || 'Commentaire / Notes'}
                        </label>
                        <textarea id="reserve-edit-comment" placeholder="${Localization.t('reserve.comment_placeholder') || 'Ajouter une note...'}" 
                                  style="width: 100%; height: 120px; background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: 8px; color: var(--text-primary); padding: 0.8rem; font-size: 0.9rem; resize: vertical; outline: none; transition: all 0.2s;">${item.comment || ''}</textarea>
                    </div>
                    
                    <div>
                        <label style="display: block; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted); margin-bottom: 0.6rem; letter-spacing: 0.05em;">
                            <i data-lucide="tag" style="width: 12px; height: 12px; vertical-align: middle; margin-right: 4px;"></i> ${Localization.t('reserve.tags_label') || 'Tags'}
                        </label>
                        <input type="text" id="reserve-edit-tags" value="${(item.tags || []).join(', ')}" placeholder="${Localization.t('reserve.tags_placeholder') || 'Tag1, Tag2...'}" 
                               style="width: 100%; background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: 8px; color: var(--text-primary); padding: 0.6rem 0.8rem; font-size: 0.9rem; outline: none; transition: all 0.2s;">
                        <p style="font-size: 0.7rem; color: var(--text-muted); margin-top: 0.4rem;">${Localization.t('reserve.tags_hint') || 'Séparez les tags par des virgules'}</p>
                    </div>

                    <div style="margin-top: auto; padding-top: 1rem;">
                         <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem;">
                            <i data-lucide="type" style="width: 14px; height: 14px; vertical-align: middle;"></i> ${item.wordCount} mots
                        </div>
                        <button class="btn btn-primary" onclick="ReserveHandlers.onSaveItem('${item.id}')" style="width: 100%; justify-content: center; gap: 8px;">
                            <i data-lucide="save" style="width: 16px; height: 16px;"></i> ${Localization.t('btn.save') || 'Enregistrer'}
                        </button>
                    </div>
                </div>
            </div>

            <div style="padding: 1.2rem 1.5rem; border-top: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; background: var(--bg-secondary);">
                <div style="display: flex; gap: 1rem;">
                    <button class="btn btn-secondary" onclick="ReserveHandlers.onCopy('${item.id}')">
                        <i data-lucide="copy" style="width: 16px; height: 16px; margin-right: 6px;"></i> ${Localization.t('btn.copy')}
                    </button>
                    <button class="btn btn-secondary" style="color: var(--accent-red);" onclick="ReserveHandlers.onIncinerate('${item.id}')">
                        <i data-lucide="trash-2" style="width: 16px; height: 16px; margin-right: 6px;"></i> ${Localization.t('btn.delete')}
                    </button>
                </div>
                <button class="btn btn-primary" onclick="ReserveHandlers.onRestore('${item.id}')">
                    <i data-lucide="rotate-ccw" style="width: 16px; height: 16px; margin-right: 6px;"></i> ${Localization.t('reserve.restore')}
                </button>
            </div>
        `;

        modal.style.display = 'flex';
        // Force reflow for animation
        setTimeout(() => {
            if (content) content.style.transform = 'scale(1)';
        }, 10);
        
        if (typeof lucide !== 'undefined') lucide.createIcons({ root: content });

        // Escape key to close
        this._escHandler = (e) => { if (e.key === 'Escape') this.closeModal(); };
        window.addEventListener('keydown', this._escHandler);
    },

    /**
     * Saves updated item metadata
     */
    async onSaveItem(id) {
        const title = document.getElementById('reserve-edit-title')?.value || '';
        const comment = document.getElementById('reserve-edit-comment')?.value || '';
        const tagsInput = document.getElementById('reserve-edit-tags')?.value || '';
        
        const tags = tagsInput.split(',')
            .map(t => t.trim())
            .filter(t => t.length > 0);

        const success = await ReserveViewModel.updateItem(id, {
            title,
            comment,
            tags
        });

        if (success) {
            if (typeof showNotification === 'function') {
                showNotification(Localization.t('reserve.updated') || 'Modifications enregistrées');
            }
            if (typeof currentView !== 'undefined' && currentView === 'reserve') {
                ReserveView.render();
            }
            ReserveView.renderSidebar();
        }
    },

    closeModal() {
        const modal = document.getElementById('reserve-modal');
        const content = document.getElementById('reserve-modal-content');
        if (!modal) return;
        
        if (content) content.style.transform = 'scale(0.95)';
        setTimeout(() => {
            modal.style.display = 'none';
        }, 200);
        
        if (this._escHandler) {
            window.removeEventListener('keydown', this._escHandler);
            this._escHandler = null;
        }
    },

    toggleExpand(id) {
        const content = document.getElementById(`reserve-sidebar-content-${id}`);
        if (!content) return;
        
        const isExpanded = content.style.display === 'block';
        
        if (isExpanded) {
            content.style.display = '-webkit-box';
            content.style.webkitLineClamp = '2';
        } else {
            content.style.display = 'block';
            content.style.webkitLineClamp = 'none';
        }
    },

    toggleSidebar() {
        const sidebar = document.getElementById('sidebarReserve');
        const btn = document.getElementById('toolReserveBtn');
        if (!sidebar) return;

        const isHidden = sidebar.classList.contains('hidden');
        
        document.querySelectorAll('.sidebar-plot, .sidebar-versions, .sidebar-investigation').forEach(el => {
            if (el.id !== 'sidebarReserve') el.classList.add('hidden');
        });
        document.querySelectorAll('.tool-btn').forEach(el => {
            if (el.id !== 'toolReserveBtn') el.classList.remove('active');
        });

        if (isHidden) {
            sidebar.classList.remove('hidden');
            if (btn) btn.classList.add('active');
            if (window.ReserveView) window.ReserveView.renderSidebar();
        } else {
            sidebar.classList.add('hidden');
            if (btn) btn.classList.remove('active');
        }
    },

    _syncEditor(editor) {
        if (!editor) return;
        // Trigger Plume's internal sync logic
        editor.dispatchEvent(new Event('input', { bubbles: true }));
        if (typeof updateStats === 'function') updateStats();
        if (typeof saveCurrentScene === 'function') saveCurrentScene();
    }
};

window.ReserveHandlers = ReserveHandlers;
