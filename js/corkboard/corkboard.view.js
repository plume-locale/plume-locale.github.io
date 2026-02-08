// ============================================
// CORKBOARD VIEW
// ============================================
// Gère le rendu HTML et les interactions utilisateur

const CorkBoardView = {
    /**
     * Rend le panneau latéral du Cork Board (sélecteur de filtres)
     */
    renderSidebar() {
        const container = document.getElementById('corkboardList');
        if (!container) return;

        const filter = CorkBoardViewModel.getCurrentFilter();

        // Construire les options de chapitres
        let chaptersOptions = '';
        if (filter.actId) {
            const chapters = CorkBoardViewModel.getChaptersForSelector(filter.actId);
            chaptersOptions = chapters.map(ch =>
                `<option value="${ch.id}" ${filter.chapterId == ch.id ? 'selected' : ''}>${ch.title}</option>`
            ).join('');
        }

        container.innerHTML = `
            <div style="padding: 1.5rem;">
                <div style="margin-bottom: 1.5rem;">
                    <h3 style="margin-bottom: 0.5rem;"><i data-lucide="layout-grid" style="width:18px;height:18px;vertical-align:middle;margin-right:6px;"></i>${Localization.t('corkboard.sidebar.title')}</h3>
                    <p style="font-size: 0.85rem; color: var(--text-muted);">
                        ${Localization.t('corkboard.sidebar.desc')}
                    </p>
                </div>
                
                <div style="margin-bottom: 1rem;">
                    <label style="font-size: 0.85rem; color: var(--text-muted); display: block; margin-bottom: 0.5rem;">
                        ${Localization.t('corkboard.filter.act')}
                    </label>
                    <select id="corkActFilter" class="form-input" onchange="CorkBoardHandlers.onActFilterChange(this.value)">
                        <option value="all" ${filter.type === 'all' ? 'selected' : ''}>${Localization.t('corkboard.filter.act_all')}</option>
                        ${project.acts.map(act =>
            `<option value="${act.id}" ${filter.actId == act.id ? 'selected' : ''}>${act.title}</option>`
        ).join('')}
                    </select>
                </div>
                
                ${filter.actId ? `
                    <div style="margin-bottom: 1rem;">
                        <label style="font-size: 0.85rem; color: var(--text-muted); display: block; margin-bottom: 0.5rem;">
                            ${Localization.t('corkboard.filter.chapter')}
                        </label>
                        <select id="corkChapterFilter" class="form-input" onchange="CorkBoardHandlers.onChapterFilterChange(this.value)">
                            <option value="all">${Localization.t('corkboard.filter.chapter_all')}</option>
                            ${chaptersOptions}
                        </select>
                    </div>
                ` : ''}
                
                <button class="btn btn-primary" style="width: 100%;" onclick="CorkBoardHandlers.onOpenFullView()">
                    ${Localization.t('corkboard.btn.open')}
                </button>
            </div>
        `;
    },

    /**
     * Rend la vue complète du Cork Board
     * @returns {string} - HTML de la vue complète
     */
    renderFullView() {
        // Vérifier si le projet est vide
        if (CorkBoardViewModel.isProjectEmpty()) {
            return this.renderEmptyState();
        }

        const filter = CorkBoardViewModel.getCurrentFilter();

        // Vue Kanban
        if (filter.mode === CorkBoardModel.DISPLAY_MODES.KANBAN) {
            return this.renderKanbanView();
        }

        // Vue structurée
        return this.renderStructuredView();
    },

    /**
     * Rend l'état vide (pas de chapitres)
     * @returns {string}
     */
    renderEmptyState() {
        return `
            <div class="cork-board-container">
                <div class="cork-board-header">
                    <div class="cork-board-title"><i data-lucide="layout-grid" style="width:16px;height:16px;vertical-align:middle;margin-right:6px;"></i>${Localization.t('nav.corkboard')}</div>
                    <button class="btn btn-primary" onclick="CorkBoardHandlers.onClose()">← ${Localization.t('btn.close')}</button>
                </div>
                <div class="cork-board-empty">
                    <div class="cork-board-empty-icon"><i data-lucide="layout-grid" style="width:48px;height:48px;"></i></div>
                    <div style="font-size: 1.2rem; margin-bottom: 0.5rem;">${Localization.t('corkboard.empty.title')}</div>
                    <div style="margin-bottom: 1rem;">${Localization.t('corkboard.empty.desc')}</div>
                    <button class="btn btn-primary" onclick="openAddChapterModal()">${Localization.t('corkboard.empty.btn')}</button>
                </div>
            </div>
        `;
    },

    /**
     * Rend la vue structurée (par actes et chapitres)
     * @returns {string}
     */
    renderStructuredView() {
        const filter = CorkBoardViewModel.getCurrentFilter();
        const scenes = CorkBoardViewModel.getFilteredScenes();

        let html = `
            <div class="cork-board-container" style="min-height: 100vh; padding: 2rem;">
                ${this.renderHeader('structured')}
                
                <div style="display: flex; flex-direction: column; gap: 2rem;">
        `;

        // Générer les actes
        project.acts.forEach(act => {
            const actScenes = scenes.filter(s => s.actId === act.id);

            html += `
                <div class="structured-act-container">
                    <div class="structured-act-header">
                        <button class="structured-collapse-btn" onclick="CorkBoardHandlers.onToggleAct(${act.id})">
                            <span class="collapse-icon" id="collapse-icon-${act.id}"><i data-lucide="chevron-down" style="width:16px;height:16px;"></i></span>
                        </button>
                         <span class="structured-act-title">${act.title}</span>
                        <button class="btn btn-primary" onclick="CorkBoardHandlers.onCreateChapter(${act.id})">${Localization.t('corkboard.btn.new_chapter')}</button>
                        <span class="structured-count">${act.chapters.length} ${act.chapters.length > 1 ? Localization.t('corkboard.count.chapters') : Localization.t('corkboard.count.chapter')}</span>
                    </div>
                    
                    <div class="structured-chapters-grid" id="act-content-${act.id}">
            `;

            // Générer les chapitres de l'acte
            act.chapters.forEach(chapter => {
                const chapterScenes = actScenes.filter(s => s.chapterId === chapter.id);

                html += `
                    <div class="structured-chapter-container">
                        <div class="structured-chapter-header">
                            <div style="display: flex; align-items: center; gap: 0.5rem;">
                                <span class="structured-chapter-icon"><i data-lucide="grip-vertical" style="width:14px;height:14px;"></i></span>
                                <span class="structured-chapter-title">${chapter.title}</span>
                            </div>
                        </div>
                        
                        <div class="structured-scenes-list">
                `;

                // Générer les scènes du chapitre
                chapterScenes.forEach(scene => {
                    html += this.renderSceneCard(scene, 'structured');
                });

                // Bouton + Nouvelle Scène
                html += `
                            <button class="structured-add-scene-btn" onclick="CorkBoardHandlers.onCreateScene(${act.id}, ${chapter.id})">
                                <span style="font-size: 1.2rem;">+</span> ${Localization.t('corkboard.btn.new_scene')}
                            </button>
                        </div>
                    </div>
                `;
            });

            // Si l'acte n'a pas de chapitres
            if (act.chapters.length === 0) {
                html += `
                    <div style="padding: 2rem; text-align: center; color: var(--text-muted); opacity: 0.7; font-style: italic;">
                        ${Localization.t('corkboard.act.empty')}
                    </div>
                `;
            }

            html += `
                    </div>
                </div>
            `;
        });

        html += `
                </div>
                
                 <div class="structured-bottom-actions">
                    <button class="btn btn-primary" onclick="CorkBoardHandlers.onCreateAct()">${Localization.t('corkboard.btn.add_act')}</button>
                </div>
            </div>
        `;

        return html;
    },

    /**
     * Rend la vue Kanban (par statut)
     * @returns {string}
     */
    renderKanbanView() {
        const scenes = CorkBoardViewModel.getFilteredScenes();

        let html = `
            <div class="cork-board-container" style="min-height: 100vh; padding: 2rem;">
                ${this.renderHeader('kanban')}

                <div class="kanban-grid" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem; align-items: start;">
        `;

        CorkBoardModel.KANBAN_STATUSES.forEach(status => {
            const statusScenes = CorkBoardViewModel.getScenesByStatus(status.id);

            html += `
                <div class="kanban-column" style="background: var(--bg-secondary); border-radius: 8px; border: 1px solid var(--border-color); display: flex; flex-direction: column; min-height: 500px;">
                    <div class="kanban-column-header" style="padding: 1rem; border-bottom: 2px solid ${status.color}; display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-weight: 700; color: var(--text-primary);">${Localization.t('corkboard.status.' + status.id)}</span>
                        <span style="background: ${status.color}; color: white; font-size: 0.75rem; padding: 2px 8px; border-radius: 10px;">${statusScenes.length}</span>
                    </div>
                    <div class="kanban-scenes-list" style="padding: 1rem; display: flex; flex-direction: column; gap: 1rem; flex: 1;">
            `;

            statusScenes.forEach(scene => {
                html += this.renderSceneCard(scene, 'kanban', status.id);
            });

            if (statusScenes.length === 0) {
                html += `
                    <div style="padding: 2rem; text-align: center; color: var(--text-muted); font-size: 0.8rem; font-style: italic;">
                        ${Localization.t('corkboard.kanban.empty')}
                    </div>
                `;
            }

            html += `
                    </div>
                </div>
            `;
        });

        html += `
                </div>
            </div>
        `;

        return html;
    },

    /**
     * Rend l'en-tête du Cork Board
     * @param {string} currentMode - Mode actuel ('structured' ou 'kanban')
     * @returns {string}
     */
    renderHeader(currentMode) {
        const isStructured = currentMode === 'structured';
        const titleIcon = isStructured ? 'list' : 'columns';
        const titleText = isStructured ? Localization.t('corkboard.header.structured') : Localization.t('corkboard.header.kanban');

        return `
            <div class="cork-board-header" style="margin-bottom: 2rem;">
                <div class="cork-board-title" style="width: 250px; flex-shrink: 0;">
                    <i data-lucide="${titleIcon}" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i>${titleText}
                </div>

                <div style="display: flex; background: var(--bg-secondary); padding: 4px; border-radius: 8px;">
                    <button class="btn ${isStructured ? 'btn-primary' : 'btn-small'}" onclick="CorkBoardHandlers.onSwitchMode('structured')">${Localization.t('corkboard.mode.structured')}</button>
                    <button class="btn ${!isStructured ? 'btn-primary' : 'btn-small'}" onclick="CorkBoardHandlers.onSwitchMode('kanban')">${Localization.t('corkboard.mode.kanban')}</button>
                </div>
                
                <div style="display: flex; align-items: center; gap: 1rem; margin-left: auto; ${isStructured ? '' : 'visibility: hidden;'}">
                    <label style="font-size: 0.8rem; color: var(--text-muted); display: flex; align-items: center; gap: 0.5rem;">
                        <i data-lucide="zoom-in" style="width:16px;height:16px;"></i>
                        <input type="range" 
                               min="150" 
                               max="800" 
                               value="300" 
                               step="10"
                               style="width: 120px; cursor: pointer;"
                               oninput="CorkBoardHandlers.onUpdateGridSize(this.value)"
                               title="${Localization.t('corkboard.header.grid_size')}">
                    </label>
                </div>
            </div>
        `;
    },

    /**
     * Rend une carte de scène
     * @param {CorkBoardScene} scene - Scène à afficher
     * @param {string} viewType - Type de vue ('structured' ou 'kanban')
     * @param {string} statusId - ID du statut (pour Kanban)
     * @returns {string}
     */
    renderSceneCard(scene, viewType, statusId = null) {
        const synopsis = scene.synopsis || '';
        const wordCount = scene.content ? scene.content.split(/\s+/).filter(w => w.length > 0).length : 0;
        const color = scene.corkColor || 'default';
        const status = statusId || scene.status || 'draft';

        if (viewType === 'kanban') {
            return `
                <div class="structured-scene-card scene-status-${status}" 
                     data-scene-id="${scene.id}"
                     data-act-id="${scene.actId}"
                     data-chapter-id="${scene.chapterId}"
                     onclick="CorkBoardHandlers.onOpenScene(${scene.actId}, ${scene.chapterId}, ${scene.id})"
                     style="background: var(--bg-primary); border-radius: 6px; box-shadow: 0 2px 4px var(--shadow);">
                    <div style="font-size: 0.7rem; color: var(--text-muted); margin-bottom: 0.25rem;">${scene.actTitle} > ${scene.chapterTitle}</div>
                    <div style="font-weight: 600; font-size: 0.9rem; margin-bottom: 0.5rem;">${scene.title}</div>
                     ${synopsis ? `<div style="font-size: 0.8rem; color: var(--text-secondary); line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">${synopsis}</div>` : ''}
                    <div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 0.5rem; display: flex; justify-content: space-between;">
                        <span>${Localization.t('corkboard.scene.word_count', wordCount)}</span>
                    </div>
                </div>
            `;
        }

        // Vue structurée
        return `
            <div class="structured-scene-card structured-color-${color} scene-status-${status}" 
                 data-scene-id="${scene.id}"
                 data-act-id="${scene.actId}"
                 data-chapter-id="${scene.chapterId}"
                 draggable="true"
                 onclick="CorkBoardHandlers.onOpenScene(${scene.actId}, ${scene.chapterId}, ${scene.id})">
                <div class="structured-scene-header">
                    <span class="structured-scene-icon"><i data-lucide="grip-vertical" style="width:14px;height:14px;"></i></span>
                    <span class="structured-scene-title">${scene.title}</span>
                </div>
                
                 <div class="structured-scene-synopsis" 
                     contenteditable="true"
                     onclick="event.stopPropagation()"
                     onblur="CorkBoardHandlers.onUpdateSynopsis(${scene.actId}, ${scene.chapterId}, ${scene.id}, this.innerText)"
                     data-placeholder="${Localization.t('corkboard.scene.synopsis_placeholder')}">${synopsis}</div>
                
                <div class="structured-scene-meta" style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.5rem;">
                    ${Localization.t('corkboard.scene.word_count', wordCount)}
                </div>
            </div>
        `;
    },

    /**
     * Affiche une notification temporaire
     * @param {string} message - Message à afficher
     */
    showNotification(message) {
        const notif = document.createElement('div');
        notif.style.cssText = `
            position: fixed;
            top: 2rem;
            right: 2rem;
            background: var(--accent-gold);
            color: white;
            padding: 1rem 2rem;
            border-radius: 4px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10000;
            font-weight: 600;
            animation: slideIn 0.3s ease;
        `;
        notif.textContent = message;
        document.body.appendChild(notif);

        setTimeout(() => {
            notif.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notif.remove(), 300);
        }, 2000);
    },

    /**
     * Met à jour dynamiquement la taille de la grille
     * @param {number} value - Nouvelle largeur en pixels
     */
    updateGridSize(value) {
        document.documentElement.style.setProperty('--chapter-card-width', value + 'px');

        const label = document.getElementById('gridSizeLabel');
        if (label) label.textContent = value + 'px';
    }
};
