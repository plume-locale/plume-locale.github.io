const ReserveView = {
    /**
     * Injects necessary CSS for the Reserve view
     */
    _injectStyles() {
        if (document.getElementById('reserve-styles')) return;
        const style = document.createElement('style');
        style.id = 'reserve-styles';
        style.textContent = `
            .reserve-card { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); border: 1px solid var(--border-color); background: var(--bg-secondary); }
            .reserve-card:hover { transform: translateY(-5px); box-shadow: 0 12px 30px rgba(0,0,0,0.15); border-color: var(--accent-gold) !important; }
            .reserve-card:hover .reserve-card-hover { opacity: 1 !important; }
            .reserve-card.pinned { border-left: 4px solid var(--accent-gold) !important; }
            
            .reserve-search-wrapper { position: relative; max-width: 500px; width: 100%; }
            .reserve-search-input { width: 100%; padding: 0.8rem 1rem 0.8rem 2.8rem; border-radius: 25px; border: 1px solid var(--border-color); background: var(--bg-secondary); color: var(--text-primary); transition: all 0.3s; }
            .reserve-search-input:focus { border-color: var(--accent-gold); box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.1); outline: none; }
            .reserve-search-icon { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: var(--text-muted); pointer-events: none; }

            .reserve-pin-btn { position: absolute; top: 1rem; right: 1rem; cursor: pointer; transition: all 0.2s; padding: 6px; border-radius: 50%; background: rgba(0,0,0,0.05); color: var(--text-muted); border: none; }
            .reserve-pin-btn:hover { background: rgba(212, 175, 55, 0.1); color: var(--accent-gold); }
            .reserve-pin-btn.active { color: var(--accent-gold); background: rgba(212, 175, 55, 0.15); opacity: 1 !important; }
            
            .reserve-modal-close:hover { background: rgba(255, 0, 0, 0.1) !important; color: var(--accent-red) !important; transform: rotate(90deg); }
            
            .reserve-tag { font-size: 0.7rem; padding: 2px 8px; border-radius: 12px; background: rgba(212, 175, 55, 0.1); color: var(--accent-gold); border: 1px solid rgba(212, 175, 55, 0.2); }
            .reserve-comment-snippet { font-size: 0.8rem; color: var(--text-muted); font-style: italic; border-left: 2px solid var(--border-color); padding-left: 8px; margin-top: 8px; }
        `;
        document.head.appendChild(style);
    },

    /**
     * Renders the full reserve view
     */
    async render(containerId = 'editorView') {
        this._injectStyles();
        
        let container = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
        if (!container && containerId === 'editorView') {
            container = document.querySelector('.tab-pane.active .tab-content-area') || 
                        document.querySelector('.tab-content-area');
        }

        if (!container) return;

        try {
            const allItems = await ReserveViewModel.init();
            const query = (ReserveHandlers._searchQuery || '').toLowerCase();
            
            const items = allItems.filter(item => {
                const text = (
                    (item.content || '') + 
                    (item.title || '') + 
                    (item.comment || '') + 
                    (item.tags || []).join(' ') + 
                    (item.sourceSceneTitle || '')
                ).toLowerCase();
                return text.includes(query);
            });

            if (!allItems || allItems.length === 0) {
                this._renderEmptyState(container);
                return;
            }

            // Optimization: if the view is already rendered, only update the grid and count
            const existingView = container.querySelector('.reserve-main-view');
            if (existingView) {
                const countVal = document.getElementById('reserve-count-val');
                const countLabel = document.getElementById('reserve-count-label');
                const contentArea = document.getElementById('reserve-content-area');
                
                if (countVal && countLabel && contentArea) {
                    countVal.textContent = items.length;
                    countLabel.textContent = items.length === 1 ? Localization.t('reserve.results_singular') : Localization.t('reserve.results_plural');
                    
                    contentArea.innerHTML = items.length === 0 ? `
                        <div style="text-align: center; padding: 5rem; color: var(--text-muted);">
                            <i data-lucide="search-slash" style="width: 48px; height: 48px; margin-bottom: 1rem; opacity: 0.5;"></i>
                            <p>${Localization.t('reserve.empty_search')}</p>
                        </div>
                    ` : `
                        <div class="reserve-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.5rem; align-items: start;">
                            ${items.map(item => this._renderItemCard(item)).join('')}
                        </div>
                    `;
                    
                    if (typeof lucide !== 'undefined') lucide.createIcons({ root: contentArea });
                    return;
                }
            }

            container.innerHTML = `
                <div class="reserve-main-view" style="padding: 2rem; max-width: 1400px; margin: 0 auto; height: 100%; overflow-y: auto; background: var(--bg-primary);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2.5rem; border-bottom: 2px solid var(--border-color); padding-bottom: 1.5rem; flex-wrap: wrap; gap: 1.5rem;">
                        <div>
                            <h2 style="margin: 0; display: flex; align-items: center; gap: 0.75rem; color: var(--text-primary); font-size: 1.8rem;">
                                <i data-lucide="archive" style="color: var(--accent-gold); width: 32px; height: 32px;"></i>
                                ${Localization.t('reserve.title') || 'La Réserve'}
                            </h2>
                        </div>

                        <div class="reserve-search-wrapper">
                            <i data-lucide="search" class="reserve-search-icon" style="width: 18px; height: 18px;"></i>
                            <input type="text" class="reserve-search-input" placeholder="${Localization.t('reserve.search_placeholder')}" value="${ReserveHandlers._searchQuery || ''}" oninput="ReserveHandlers.onSearch(this.value)">
                        </div>

                        <div style="text-align: right; min-width: 100px;">
                            <div id="reserve-count-val" style="color: var(--accent-gold); font-weight: 700; font-size: 1.5rem; line-height: 1;">${items.length}</div>
                            <div id="reserve-count-label" style="color: var(--text-muted); font-size: 0.8rem; font-weight: 600; text-transform: uppercase;">${items.length === 1 ? Localization.t('reserve.results_singular') : Localization.t('reserve.results_plural')}</div>
                        </div>
                    </div>

                    <div id="reserve-content-area">
                        ${items.length === 0 ? `
                            <div style="text-align: center; padding: 5rem; color: var(--text-muted);">
                                <i data-lucide="search-slash" style="width: 48px; height: 48px; margin-bottom: 1rem; opacity: 0.5;"></i>
                                <p>${Localization.t('reserve.empty_search')}</p>
                            </div>
                        ` : `
                            <div class="reserve-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.5rem; align-items: start;">
                                ${items.map(item => this._renderItemCard(item)).join('')}
                            </div>
                        `}
                    </div>
                </div>
                
                <div id="reserve-modal" onclick="if(event.target.id === 'reserve-modal') ReserveHandlers.closeModal()" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 10000; justify-content: center; align-items: center; backdrop-filter: blur(8px);">
                    <div id="reserve-modal-content" style="background: var(--bg-primary); width: 95%; max-width: 850px; max-height: 90vh; border-radius: 16px; border: 1px solid var(--border-color); display: flex; flex-direction: column; overflow: hidden; position: relative;">
                        <!-- Content injected via JS -->
                    </div>
                </div>
            `;

            if (typeof lucide !== 'undefined') lucide.createIcons({ root: container });
        } catch (e) {
            console.error('[ReserveView] Render Error:', e);
        }
    },

    /**
     * Renders the sidebar list (ONLY pinned items)
     */
    async renderSidebar() {
        const containers = [
            document.getElementById('reserveList'),
            document.getElementById('reserveSidebarList')
        ].filter(el => el !== null);
        
        if (containers.length === 0) return;

        try {
            await ReserveViewModel.init();
            const allItems = ReserveViewModel.getItems();
            // FILTER BY PINNED
            const items = allItems.filter(item => item.pinned);

            const html = items.length === 0 
                ? `<div style="padding: 2.5rem 1rem; text-align: center; color: var(--text-muted); font-style: italic; font-size: 0.85rem; border: 1px dashed var(--border-color); border-radius: 8px; margin: 0.5rem;">
                    <i data-lucide="pin" style="width: 20px; height: 20px; opacity: 0.3; margin-bottom: 0.5rem; transform: rotate(45deg);"></i><br>
                    ${Localization.t('reserve.pin_hint')}
                   </div>`
                : `
                <div style="padding: 0.5rem; display: flex; flex-direction: column; gap: 0.75rem;">
                    <div style="font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); margin: 0 0.5rem 0.2rem; font-weight: 700;">${Localization.t('reserve.pinned_title')}</div>
                    ${items.map(item => {
                        const context = item.sourceSceneTitle ? `${item.sourceChapterTitle || ''} > ${item.sourceSceneTitle}` : '';
                        return `
                        <div class="reserve-sidebar-item" 
                             onclick="ReserveHandlers.toggleExpand('${item.id}')"
                             style="padding: 0.8rem; background: var(--bg-secondary); border-radius: 10px; cursor: pointer; border: 1px solid var(--border-color); transition: all 0.2s; position: relative; border-left: 3px solid var(--accent-gold);">
                            <div id="reserve-sidebar-content-${item.id}" style="font-size: 0.85rem; color: var(--text-primary); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.5; margin-bottom: 0.6rem;">
                                ${this._stripHtml(item.content)}
                            </div>
                            <div style="font-size: 0.7rem; color: var(--text-muted); display: flex; justify-content: space-between; align-items: center;">
                                <span style="display: flex; align-items: center; gap: 4px;"><i data-lucide="calendar" style="width:10px; height:10px;"></i> ${new Date(item.createdAt).toLocaleDateString()}</span>
                                <button class="btn btn-icon btn-sm" onclick="event.stopPropagation(); ReserveHandlers.onTogglePin('${item.id}')" title="${Localization.t('reserve.unpin')}" style="width: 20px; height: 20px; padding: 0; color: var(--accent-gold);">
                                    <i data-lucide="pin-off" style="width:12px; height:12px;"></i>
                                </button>
                            </div>
                            <div id="reserve-sidebar-actions-${item.id}" style="display: flex; justify-content: space-between; margin-top: 0.8rem; padding-top: 0.8rem; border-top: 1px solid var(--border-color); gap: 0.5rem;">
                                <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); ReserveHandlers.onRestore('${item.id}')" style="flex: 1; font-size: 0.75rem; padding: 0.3rem;">
                                    ${Localization.t('reserve.restore')}
                                </button>
                                <button class="btn btn-icon btn-sm" onclick="event.stopPropagation(); ReserveHandlers.onCopy('${item.id}')" style="width: 28px; height: 28px;">
                                    <i data-lucide="copy" style="width:14px; height:14px;"></i>
                                </button>
                            </div>
                        </div>
                    `}).join('')}
                    <button class="btn btn-ghost btn-sm" onclick="switchView('reserve')" style="margin-top: 0.5rem; font-size: 0.75rem; color: var(--accent-gold);">
                        ${Localization.t('reserve.manage_btn')}
                    </button>
                </div>
            `;

            containers.forEach(container => {
                container.innerHTML = html;
                if (typeof lucide !== 'undefined') lucide.createIcons({ root: container });
            });
        } catch (e) {
            console.error('[ReserveView] Sidebar Render Error:', e);
        }
    },

    _renderItemCard(item) {
        const context = item.sourceSceneTitle ? `${item.sourceChapterTitle || ''} > ${item.sourceSceneTitle}` : Localization.t('reserve.origin_unknown');
        const isPinned = item.pinned || false;
        
        return `
            <div class="reserve-card ${isPinned ? 'pinned' : ''}" id="reserve-main-card-${item.id}" onclick="ReserveHandlers.openModal('${item.id}')" style="position: relative; border-radius: 14px; padding: 1.5rem; display: flex; flex-direction: column; gap: 0.8rem; overflow: hidden; min-height: 250px;">
                
                <button class="reserve-pin-btn ${isPinned ? 'active' : ''}" 
                        onclick="event.stopPropagation(); ReserveHandlers.onTogglePin('${item.id}')" 
                        title="${isPinned ? Localization.t('reserve.unpin') : Localization.t('reserve.pin')}">
                    <i data-lucide="${isPinned ? 'pin' : 'pin'}" style="width: 16px; height: 16px; transform: ${isPinned ? 'rotate(0deg)' : 'rotate(45deg)'}"></i>
                </button>

                <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid var(--border-color); padding-bottom: 0.8rem; padding-right: 2.5rem;">
                    <div>
                        <div style="font-size: 1.05rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.3rem;">
                            ${item.title || (Localization.t('reserve.untitled') || 'Extrait sans titre')}
                        </div>
                        <div style="font-size: 0.75rem; font-weight: 600; color: var(--accent-gold); margin-bottom: 0.3rem; display: flex; align-items: center; gap: 6px;">
                            <i data-lucide="map-pin" style="width:12px; height:12px;"></i>
                            <span>${context}</span>
                        </div>
                        <div style="font-size: 0.7rem; color: var(--text-muted); display: flex; gap: 0.8rem; align-items: center;">
                            <span style="display: flex; align-items: center; gap: 4px;"><i data-lucide="calendar" style="width:10px; height:10px;"></i> ${new Date(item.createdAt).toLocaleDateString()}</span>
                            <span style="display: flex; align-items: center; gap: 4px;"><i data-lucide="type" style="width:10px; height:10px;"></i> ${item.wordCount}</span>
                        </div>
                    </div>
                </div>
                
                <div class="reserve-content-preview" style="font-size: 0.95rem; color: var(--text-primary); line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; font-style: italic; opacity: 0.85;">
                    ${this._stripHtml(item.content)}
                </div>

                ${item.comment ? `
                    <div class="reserve-comment-snippet" style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                        ${item.comment}
                    </div>
                ` : ''}

                ${item.tags && item.tags.length > 0 ? `
                    <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px;">
                        ${item.tags.map(tag => `<span class="reserve-tag">${tag}</span>`).join('')}
                    </div>
                ` : ''}
                
                <div class="reserve-card-hover" style="position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(to top, var(--bg-secondary) 40%, transparent 100%); height: 80px; display: flex; align-items: flex-end; justify-content: center; padding-bottom: 1rem; opacity: 0; transition: opacity 0.3s ease; pointer-events: none;">
                    <span style="font-size: 0.8rem; color: var(--accent-gold); font-weight: 700; display: flex; align-items: center; gap: 6px; background: var(--bg-primary); padding: 0.4rem 1rem; border-radius: 20px; border: 1px solid var(--accent-gold);">
                        <i data-lucide="maximize-2" style="width:12px; height:12px;"></i>
                        ${Localization.t('reserve.read_more')}
                    </span>
                </div>
            </div>
        `;
    },

    _renderEmptyState(container) {
        container.innerHTML = `
            <div class="empty-state" style="padding: 6rem 2rem; text-align: center; background: var(--bg-primary); height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center;">
                <div style="width: 120px; height: 120px; background: rgba(212, 175, 55, 0.05); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 2rem;">
                    <i data-lucide="archive" style="width: 64px; height: 64px; color: var(--accent-gold); opacity: 0.5;"></i>
                </div>
                <h2 style="color: var(--text-primary); margin-bottom: 1rem; font-size: 2rem;">${Localization.t('sidebar_view.reserve.empty_message')}</h2>
                <p style="color: var(--text-muted); max-width: 450px; margin: 0 auto 2.5rem; font-size: 1.1rem; line-height: 1.6;">
                    ${Localization.t('sidebar_view.reserve.empty_sub_message')}
                </p>
                <button class="btn btn-primary" onclick="switchView('editor')" style="padding: 0.8rem 2rem; font-size: 1rem;">
                    ${Localization.t('empty.start')}
                </button>
            </div>
        `;
        if (typeof lucide !== 'undefined') lucide.createIcons({ root: container });
    },

    _stripHtml(html) {
        if (!html) return "";
        const tmp = document.createElement("DIV");
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || "";
    }
};

window.ReserveView = ReserveView;
