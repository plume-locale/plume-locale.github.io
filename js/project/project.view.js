/**
 * [MVVM : Project View]
 * Gère le rendu HTML et les interactions visuelles des projets.
 */

const ProjectView = {
    /**
     * Met à jour le titre du projet dans le header.
     * @param {string} title 
     */
    updateHeader(title) {
        const headerTitle = document.getElementById('headerProjectTitle');
        if (headerTitle) headerTitle.textContent = title;
    },

    /**
     * Rendu de la page d'accueil (Landing Page) des projets.
     * @param {Array} projects 
     */
    renderLandingPage(projects) {
        const container = document.getElementById('editorView');
        if (!container) return;

        const viewMode = ProjectViewModel.viewMode;

        container.innerHTML = `
            <div class="projects-landing-container">
                <div class="projects-header">
                    <h1 class="projects-title">
                        <i data-lucide="folder-open"></i> ${Localization.t('project.view.title')}
                    </h1>
                    <div class="projects-actions">
                        <div class="view-toggle-group">
                            <button class="toggle-btn ${viewMode === 'grid' ? 'active' : ''}" 
                                onclick="ProjectViewModel.setViewMode('grid')" 
                                title="${Localization.t('project.view.grid')}">
                                <i data-lucide="layout-grid"></i>
                            </button>
                            <button class="toggle-btn ${viewMode === 'table' ? 'active' : ''}" 
                                onclick="ProjectViewModel.setViewMode('table')" 
                                title="${Localization.t('project.view.table')}">
                                <i data-lucide="list"></i>
                            </button>
                        </div>
                        <button class="btn" onclick="ProjectViewModel.importHandler()">
                            <i data-lucide="download"></i> ${Localization.t('btn.import_project')}
                        </button>
                        <button class="btn btn-primary" onclick="ProjectView.openNewModal()">
                            ${Localization.t('btn.add_project')}
                        </button>
                    </div>
                </div>
                
                ${(projects && projects.length > 0)
                ? (viewMode === 'grid'
                    ? `<div class="projects-grid" id="projectsGrid">${projects.map(proj => this.renderCard(proj)).join('')}</div>`
                    : this.renderTableView(projects))
                : `
                    <div class="projects-empty-state">
                        <div class="empty-icon"><i data-lucide="folder-search"></i></div>
                        <h2>${Localization.t('project.view.no_project')}</h2>
                        <button class="btn btn-primary" onclick="ProjectView.openNewModal()" style="margin-top: 1rem;">
                            <i data-lucide="plus"></i> ${Localization.t('btn.add_project')}
                        </button>
                    </div>`
            }
            </div>
        `;

        if (typeof lucide !== 'undefined') lucide.createIcons();
    },

    /**
     * Rendu d'une carte projet individuelle.
     * @param {Object} proj 
     */
    renderCard(proj) {
        const isActive = proj.id === currentProjectId;
        const stats = this.getProjectStats(proj);

        const createdDate = this.formatDate(proj.createdAt);
        const updatedDate = this.formatDate(proj.updatedAt);

        // Calcule du progrès
        const totalWords = stats.wordCount;
        const goal = proj.stats?.totalGoal || 80000;
        const progress = Math.min(100, Math.round((totalWords / goal) * 100));

        return `
            <div class="project-card-new ${isActive ? 'active' : ''}" onclick="ProjectViewModel.switchTo(${proj.id})">
                ${isActive ? `<span class="status-badge active">${Localization.t('project.view.active')}</span>` : ''}
                
                <h3 class="title">${proj.title}</h3>
                ${(proj.updatedAt && (new Date() - new Date(proj.updatedAt)) < 24 * 60 * 60 * 1000) ? `<span class="recent-badge" style="background: rgba(46, 204, 113, 0.1); color: #2ecc71; border: 1px solid #2ecc71; font-size: 0.65rem; padding: 2px 6px; border-radius: 10px; margin-left: 8px; vertical-align: middle;">${Localization.t('project.view.recently_updated')}</span>` : ''}
                ${proj.genre ? `<div class="genre">${proj.genre}</div>` : ''}
                <p class="description">${proj.description || ''}</p>
                
                <div class="card-dates">
                    <span><i data-lucide="calendar" style="width:12px;height:12px;"></i> ${Localization.t('project.view.created_at')} ${createdDate}</span>
                    <span><i data-lucide="clock" style="width:12px;height:12px;"></i> ${Localization.t('project.view.updated_at')} ${updatedDate}</span>
                </div>

                ${stats.lastSession ? `
                <div class="card-last-session" style="font-size: 0.75rem; color: var(--accent-gold); margin-bottom: 0.5rem;">
                    <i data-lucide="history" style="width:12px;height:12px;vertical-align:middle;margin-right:4px;"></i>
                    ${Localization.t('project.view.last_session', this.formatDate(stats.lastSession.date), stats.lastSession.words)}
                </div>
                ` : ''}

                <div class="progress-section">
                    <div class="progress-bar-container">
                        <div class="progress-bar-fill" style="width: ${progress}%"></div>
                    </div>
                    <div class="progress-info">
                        <span>${progress}%</span>
                        <span style="opacity: 0.7; font-size: 0.75rem;">${totalWords.toLocaleString()} / ${goal.toLocaleString()} ${Localization.t('project.view.words_short')}</span>
                    </div>
                </div>

                <div class="stats-grid">
                    <div class="stat-group-title">${Localization.t('project.view.manuscript')}</div>
                    <div class="stat-item" title="${Localization.t('project.view.total_word_count')}">
                        <div class="stat-row">
                            <i data-lucide="align-left"></i>
                            <span class="value">${totalWords.toLocaleString(Localization.currentLang === 'fr' ? 'fr-FR' : 'en-US')}</span>
                        </div>
                        <span class="label">${Localization.t('project.view.words_short')}</span>
                    </div>
                    <div class="stat-item" title="${Localization.t('project.view.act_count')}">
                        <div class="stat-row">
                            <i data-lucide="layers"></i>
                            <span class="value">${proj.acts?.length || 0}</span>
                        </div>
                        <span class="label">${Localization.t('project.view.acts_short')}</span>
                    </div>
                    <div class="stat-item" title="${Localization.t('project.view.chapter_count')}">
                        <div class="stat-row">
                            <i data-lucide="bookmark"></i>
                            <span class="value">${stats.chapterCount}</span>
                        </div>
                        <span class="label">${Localization.t('project.view.chapters_short')}</span>
                    </div>
                    <div class="stat-item" title="${Localization.t('project.view.scene_count')}">
                        <div class="stat-row">
                            <i data-lucide="file-text"></i>
                            <span class="value">${stats.sceneCount}</span>
                        </div>
                        <span class="label">${Localization.t('project.view.scenes_short')}</span>
                    </div>

                    <div class="stat-group-title">${Localization.t('project.view.database')}</div>
                    <div class="stat-item" title="${Localization.t('project.view.character_count')}">
                        <div class="stat-row">
                            <i data-lucide="users"></i>
                            <span class="value">${stats.characterCount}</span>
                        </div>
                        <span class="label">${Localization.t('nav.characters')}</span>
                    </div>
                    <div class="stat-item" title="${Localization.t('project.view.world_count')}">
                        <div class="stat-row">
                            <i data-lucide="globe"></i>
                            <span class="value">${stats.worldCount}</span>
                        </div>
                        <span class="label">${Localization.t('nav.world')}</span>
                    </div>
                    <div class="stat-item" title="${Localization.t('project.view.codex_count')}">
                        <div class="stat-row">
                            <i data-lucide="book"></i>
                            <span class="value">${stats.codexCount}</span>
                        </div>
                        <span class="label">${Localization.t('nav.codex')}</span>
                    </div>
                    <div class="stat-item" title="${Localization.t('project.view.note_count')}">
                        <div class="stat-row">
                            <i data-lucide="sticky-note"></i>
                            <span class="value">${stats.noteCount}</span>
                        </div>
                        <span class="label">${Localization.t('nav.notes')}</span>
                    </div>
                    <div class="stat-item" title="${Localization.t('project.view.arc_count')}">
                        <div class="stat-row">
                            <i data-lucide="git-branch"></i>
                            <span class="value">${stats.arcCount}</span>
                        </div>
                        <span class="label">${Localization.t('nav.arcs')}</span>
                    </div>
                    <div class="stat-item" title="${Localization.t('project.view.investigation_count')}">
                        <div class="stat-row">
                            <i data-lucide="search"></i>
                            <span class="value">${stats.investigationCount}</span>
                        </div>
                        <span class="label">${Localization.t('project.view.investigation_short')}</span>
                    </div>
                </div>

                <div class="project-card-actions-row">
                    <button class="btn btn-small" onclick="event.stopPropagation(); ProjectViewModel.switchTo(${proj.id})">
                        <i data-lucide="external-link"></i> ${Localization.t('project.view.btn_open')}
                    </button>
                    <button class="btn btn-small btn-outline" onclick="event.stopPropagation(); ProjectViewModel.export(${proj.id})" title="${Localization.t('project.view.btn_export')}">
                        <i data-lucide="upload"></i>
                    </button>
                    <button class="btn btn-small btn-outline" onclick="event.stopPropagation(); ProjectViewModel.backup(${proj.id})" title="${Localization.t('header.backup')}">
                        <i data-lucide="file-up"></i>
                    </button>
                    <button class="btn btn-small btn-danger-outline" onclick="event.stopPropagation(); ProjectViewModel.delete(${proj.id})" title="${Localization.t('project.view.btn_delete')}">
                        <i data-lucide="trash-2"></i>
                    </button>
                </div>
            </div>
        `;
    },

    /**
     * Rendu des projets sous forme de tableau.
     */
    renderTableView(projects) {
        return `
            <div class="projects-table-wrapper">
                <table class="projects-table">
                    <thead>
                        <tr>
                            <th>${Localization.t('modal.project.label_name')}</th>
                            <th>Stats</th>
                            <th style="text-align: center;">${Localization.t('project.view.total_word_count')} / Goal</th>
                            <th style="text-align: center;">${Localization.t('project.view.updated_at')}</th>
                            <th style="text-align: center;">${Localization.t('project.view.active')}</th>
                            <th style="text-align: right;">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${projects.map(proj => {
            const isActive = proj.id === currentProjectId;
            const stats = this.getProjectStats(proj);
            const updatedDate = this.formatDate(proj.updatedAt);
            return `
                                <tr class="${isActive ? 'active' : ''}" onclick="ProjectViewModel.switchTo(${proj.id})">
                                    <td>
                                        <div class="table-title">
                                            <i data-lucide="folder"></i>
                                            <div style="display: flex; flex-direction: column;">
                                                <span>${proj.title}</span>
                                                <span style="font-size: 0.7rem; opacity: 0.6;">${proj.genre || '-'}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div class="table-stats-row" style="display: flex; gap: 12px; font-size: 0.8rem;">
                                            <span title="${Localization.t('project.view.act_count')}"><i data-lucide="layers" style="width:12px;height:12px;vertical-align:middle;margin-right:2px;"></i> ${proj.acts?.length || 0}</span>
                                            <span title="${Localization.t('project.view.chapter_count')}"><i data-lucide="bookmark" style="width:12px;height:12px;vertical-align:middle;margin-right:2px;"></i> ${stats.chapterCount}</span>
                                            <span title="${Localization.t('project.view.scene_count')}"><i data-lucide="file-text" style="width:12px;height:12px;vertical-align:middle;margin-right:2px;"></i> ${stats.sceneCount}</span>
                                        </div>
                                    </td>
                                    <td style="text-align: center;">
                                        <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
                                            <span style="font-weight: 600;">${stats.wordCount.toLocaleString()}</span>
                                            <div style="width: 80px; height: 4px; background: var(--bg-tertiary); border-radius: 2px; overflow: hidden; border: 1px solid var(--border-color);">
                                                <div style="width: ${Math.min(100, Math.round((stats.wordCount / (proj.stats?.totalGoal || 80000)) * 100))}% ; height: 100%; background: var(--accent-gold);"></div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style="text-align: center; font-size: 0.85rem;">${updatedDate}</td>
                                    <td style="text-align: center;">
                                        ${isActive ? `<span class="active-dot"></span>` : ''}
                                    </td>
                                    <td style="text-align: right;">
                                        <div class="table-actions">
                                            <button class="icon-btn" onclick="event.stopPropagation(); ProjectViewModel.export(${proj.id})" title="${Localization.t('project.view.btn_export')}">
                                                <i data-lucide="upload"></i>
                                            </button>
                                            <button class="icon-btn" onclick="event.stopPropagation(); ProjectViewModel.backup(${proj.id})" title="${Localization.t('header.backup')}">
                                                <i data-lucide="file-up"></i>
                                            </button>
                                            <button class="icon-btn danger" onclick="event.stopPropagation(); ProjectViewModel.delete(${proj.id})" title="${Localization.t('project.view.btn_delete')}">
                                                <i data-lucide="trash-2"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `;
        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    getProjectStats(proj) {
        let chapterCount = 0;
        let sceneCount = 0;
        let wordCount = 0;

        if (proj.acts) {
            proj.acts.forEach(act => {
                if (act.chapters) {
                    chapterCount += act.chapters.length;
                    act.chapters.forEach(chap => {
                        if (chap.scenes) {
                            sceneCount += chap.scenes.length;
                            chap.scenes.forEach(scene => {
                                const text = scene.content ? ProjectModel.stripHTML(scene.content) : '';
                                if (text.trim().length > 0) {
                                    const words = text.trim().match(/[\w\u00C0-\u00FF]+(?:[''’][\w\u00C0-\u00FF]+)*/g);
                                    if (words) wordCount += words.length;
                                }
                            });
                        }
                    });
                }
            });
        }

        return {
            chapterCount,
            sceneCount,
            wordCount,
            characterCount: proj.characters?.length || 0,
            worldCount: proj.world?.length || 0,
            noteCount: proj.notes?.length || 0,
            codexCount: proj.codex?.length || 0,
            arcCount: proj.narrativeArcs?.length || 0,
            investigationCount: (proj.investigationBoard?.facts?.length || 0),
            mindmapCount: proj.mindmaps?.length || 0,
            mapCount: proj.maps?.length || 0,
            lastSession: proj.stats?.writingSessions?.length > 0 ? proj.stats.writingSessions[proj.stats.writingSessions.length - 1] : null
        };
    },

    /**
     * Formate une date selon la locale actuelle.
     */
    formatDate(dateStr) {
        if (!dateStr) return '-';
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return '-';

            const locale = Localization.getLocale();
            const localeMap = {
                'fr': 'fr-FR',
                'en': 'en-GB', // Force dd/mm format even for english
                'es': 'es-ES',
                'de': 'de-DE'
            };

            return date.toLocaleDateString(localeMap[locale] || 'fr-FR');
        } catch (e) {
            return '-';
        }
    },

    /**
     * Rendu de la liste des projets dans la sidebar.
     * @param {Array} projects 
     */
    renderSidebarList(projects) {
        const container = document.getElementById('projectsSidebarList');
        if (!container) return;

        if (!projects || projects.length === 0) {
            container.innerHTML = `<div class="sidebar-empty">${Localization.t('project.view.no_project')}</div>`;
            return;
        }

        container.innerHTML = projects.map(proj => {
            const isActive = proj.id === currentProjectId;
            return `
                <div class="sidebar-item ${isActive ? 'active' : ''}" onclick="ProjectViewModel.switchTo(${proj.id})">
                    <i data-lucide="folder" class="sidebar-item-icon"></i>
                    <span class="sidebar-item-text">${proj.title}</span>
                    ${isActive ? '<span class="active-dot"></span>' : ''}
                </div>
            `;
        }).join('');

        if (typeof lucide !== 'undefined') lucide.createIcons({ root: container });
    },

    /**
     * Ouvre la modale de création.
     */
    openNewModal() {
        const modal = document.getElementById('newProjectModal');
        if (modal) {
            modal.classList.add('active');
            setTimeout(() => document.getElementById('newProjectTitle')?.focus(), 100);
        }
    },

    /**
     * Ferme la modale de création.
     */
    closeNewModal() {
        closeModal('newProjectModal');
    },

    /**
     * Ferme la modale de gestion des projets.
     */
    closeProjectsModal() {
        closeModal('projectsModal');
    },

    /**
     * Rendu de l'interface d'analyse.
     */
    renderAnalysis() {
        const editorView = document.getElementById('editorView');
        if (!editorView) return;

        editorView.innerHTML = `
            <div style="height: 100%; overflow-y: auto; padding: 2rem 3rem;">
                <h2 style="margin-bottom: 2rem; color: var(--accent-gold);">
                    <i data-lucide="scan-search" style="width:24px;height:24px;vertical-align:middle;margin-right:8px;"></i>${Localization.t('project.view.analysis_title')}
                </h2>
                <div style="background: var(--bg-secondary); padding: 2rem; border-radius: 8px; margin-bottom: 2rem;">
                    <label style="display: block; font-weight: 600; margin-bottom: 1rem; font-size: 1rem;">${Localization.t('project.view.analysis_scope_label')}</label>
                    <select id="analysisScope" class="form-input" style="width: 100%; max-width: 400px; font-size: 1rem;">
                        <option value="current">${Localization.t('project.view.analysis_scope_current')}</option>
                        <option value="chapter">${Localization.t('project.view.analysis_scope_chapter')}</option>
                        <option value="act">${Localization.t('project.view.analysis_scope_act')}</option>
                        <option value="all">${Localization.t('project.view.analysis_scope_all')}</option>
                    </select>
                </div>
                <div id="analysisResults"></div>
            </div>`;

        if (typeof lucide !== 'undefined') lucide.createIcons();

        setTimeout(() => {
            document.getElementById('analysisScope')?.addEventListener('change', () => ProjectViewModel.runAnalysis());
            ProjectViewModel.runAnalysis();
        }, 0);
    },

    /**
     * Rendu si aucun texte à analyser.
     */
    renderAnalysisEmpty() {
        const container = document.getElementById('analysisResults');
        if (container) {
            container.innerHTML = `<div style="padding: 2rem; text-align: center; color: var(--text-muted);">${Localization.t('project.view.analysis_empty')}</div>`;
        }
    },

    /**
     * Affiche les résultats détaillés de l'analyse.
     */
    displayAnalysisResults(analysis) {
        const container = document.getElementById('analysisResults');
        if (!container) return;

        container.innerHTML = `
            <div style="margin-top: 1rem;">
                <!-- General Stats -->
                <div style="background: var(--bg-primary); padding: 1rem; border-radius: 4px; border: 1px solid var(--border-color); margin-bottom: 1rem;">
                    <div style="font-weight: 700; font-size: 1rem; margin-bottom: 0.75rem; color: var(--accent-gold);"><i data-lucide="bar-chart-3" style="width:16px;height:16px;vertical-align:middle;margin-right:6px;"></i>${Localization.t('project.view.analysis_stats_general')}</div>
                    <div style="font-size: 1.2rem; font-weight: 600;">${analysis.wordCount.toLocaleString(Localization.currentLang === 'fr' ? 'fr-FR' : 'en-US')} ${Localization.t('project.view.words')}</div>
                </div>

                <!-- Readability -->
                <div style="background: var(--bg-primary); padding: 1rem; border-radius: 4px; border: 1px solid var(--border-color); margin-bottom: 1rem;">
                    <div style="font-weight: 700; font-size: 1rem; margin-bottom: 0.75rem; color: var(--accent-gold);"><i data-lucide="book-open" style="width:16px;height:16px;vertical-align:middle;margin-right:6px;"></i>${Localization.t('project.view.analysis_readability')}</div>
                    <div style="font-size: 1.1rem; margin-bottom: 0.25rem;">${Localization.t('project.view.analysis_score')} <strong>${analysis.readability.score}</strong> / 100</div>
                    <div style="color: var(--text-muted);">${Localization.t('project.view.analysis_level')} ${analysis.readability.level}</div>
                    <div style="margin-top: 0.5rem; font-size: 0.75rem; color: var(--text-muted); line-height: 1.4;">
                        ${Localization.t('project.view.analysis_readability_help')}
                    </div>
                </div>

                <!-- Sentence Length -->
                <div style="background: var(--bg-primary); padding: 1rem; border-radius: 4px; border: 1px solid var(--border-color); margin-bottom: 1rem;">
                    <div style="font-weight: 700; font-size: 1rem; margin-bottom: 0.75rem; color: var(--accent-gold);"><i data-lucide="ruler" style="width:16px;height:16px;vertical-align:middle;margin-right:6px;"></i>${Localization.t('project.view.analysis_sentence_length')}</div>
                    <div style="display: flex; gap: 1rem; margin-bottom: 0.75rem;">
                        <div><strong>${Localization.t('project.view.analysis_avg')}</strong> ${analysis.sentenceLength.avg} ${Localization.t('project.view.words')}</div>
                        <div><strong>${Localization.t('project.view.analysis_min')}</strong> ${analysis.sentenceLength.min}</div>
                        <div><strong>${Localization.t('project.view.analysis_max')}</strong> ${analysis.sentenceLength.max}</div>
                    </div>
                    <div style="font-size: 0.8rem; font-weight: 600; margin-bottom: 0.5rem;">${Localization.t('project.view.analysis_distribution')}</div>
                    ${analysis.sentenceLength.distribution.map(r => `
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem;">
                            <span style="font-size: 0.75rem;">${r.label}</span>
                            <div style="flex: 1; margin: 0 0.5rem; height: 8px; background: var(--bg-secondary); border-radius: 4px; overflow: hidden;">
                                <div style="height: 100%; width: ${analysis.sentenceLength.distribution.reduce((s, d) => s + d.count, 0) > 0 ? (r.count * 100 / analysis.sentenceLength.distribution.reduce((s, d) => s + d.count, 0)) : 0}%; background: var(--accent-gold);"></div>
                            </div>
                            <span style="font-size: 0.75rem; font-weight: 600; min-width: 30px; text-align: right;">${r.count}</span>
                        </div>
                    `).join('')}
                </div>

                <!-- Narrative Distribution -->
                <div style="background: var(--bg-primary); padding: 1rem; border-radius: 4px; border: 1px solid var(--border-color); margin-bottom: 1rem;">
                    <div style="font-weight: 700; font-size: 1rem; margin-bottom: 0.75rem; color: var(--accent-gold);"><i data-lucide="message-circle" style="width:16px;height:16px;vertical-align:middle;margin-right:6px;"></i>${Localization.t('project.view.analysis_narrative_distribution')}</div>
                    <div style="display: flex; gap: 1rem; margin-bottom: 0.75rem;">
                        <div><strong>${Localization.t('project.view.analysis_dialogues')}</strong> ${analysis.narrativeDistribution.dialogue}%</div>
                        <div><strong>${Localization.t('project.view.analysis_narration')}</strong> ${analysis.narrativeDistribution.narrative}%</div>
                    </div>
                    <div style="height: 20px; background: var(--bg-secondary); border-radius: 4px; overflow: hidden; display: flex;">
                        <div style="height: 100%; width: ${analysis.narrativeDistribution.dialogue}%; background: #4CAF50;" title="Dialogues"></div>
                        <div style="height: 100%; width: ${analysis.narrativeDistribution.narrative}%; background: var(--accent-gold);" title="Narration"></div>
                    </div>
                    <div style="margin-top: 0.5rem; font-size: 0.75rem; color: var(--text-muted);">
                        ${analysis.narrativeDistribution.dialogCount} ${Localization.t('project.view.analysis_dialogue_segments')}
                    </div>
                </div>

                <!-- Word Frequency -->
                <div style="background: var(--bg-primary); padding: 1rem; border-radius: 4px; border: 1px solid var(--border-color); margin-bottom: 1rem;">
                    <div style="font-weight: 700; font-size: 1rem; margin-bottom: 0.75rem; color: var(--accent-gold);"><i data-lucide="type" style="width:16px;height:16px;vertical-align:middle;margin-right:6px;"></i>${Localization.t('project.view.analysis_frequent_words')}</div>
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 0.5rem;">
                        ${analysis.wordFrequency.map(([word, count]) => `
                            <div style="padding: 0.4rem 0.6rem; background: var(--bg-secondary); border-radius: 2px; font-size: 0.75rem;">
                                <strong>${word}</strong>: ${count}×
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Repetitions -->
                <div style="background: var(--bg-primary); padding: 1rem; border-radius: 4px; border: 1px solid var(--border-color);">
                    <div style="font-weight: 700; font-size: 1rem; margin-bottom: 0.75rem; color: var(--accent-red);"><i data-lucide="alert-triangle" style="width:16px;height:16px;vertical-align:middle;margin-right:6px;"></i>${Localization.t('project.view.analysis_repetitions')}</div>
                    ${analysis.repetitions.length > 0 ? `
                        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 0.5rem;">
                            ${analysis.repetitions.map(([word, count]) => `
                                <div style="padding: 0.4rem 0.6rem; background: rgba(196, 69, 54, 0.1); border: 1px solid var(--accent-red); border-radius: 2px; font-size: 0.75rem;">
                                    <strong>${word}</strong>: ${count}×
                                </div>
                            `).join('')}
                        </div>
                    ` : `<div style="color: var(--text-muted); font-size: 0.85rem;">${Localization.t('project.view.analysis_no_repetitions')}</div>`}
                </div>
            </div>
        `;

        if (typeof lucide !== 'undefined') lucide.createIcons();
    },

    /**
     * Rendu d'une scène dans un conteneur spécifique (preview).
     */
    renderSceneInContainer(act, chapter, scene, containerId) {
        const container = document.getElementById(containerId);
        if (!container || !scene || !act || !chapter) return;

        const wordCount = typeof getWordCount === 'function' ? getWordCount(scene.content || '') : 0;

        container.innerHTML = `
            <div class="split-scene-view" style="height: 100%; display: flex; flex-direction: column;">
                <div style="padding: 0.75rem 1rem; background: var(--bg-secondary); border-bottom: 1px solid var(--border-color);">
                    <div style="font-size: 0.8rem; color: var(--text-muted);">${act.title} > ${chapter.title}</div>
                    <div style="font-size: 1.1rem; font-weight: 600;">${scene.title || Localization.t('project.view.untitled')}</div>
                    <div style="font-size: 0.75rem; color: var(--text-muted);">${wordCount} ${Localization.t('project.view.words')}</div>
                </div>
                <div class="editor-textarea" 
                     contenteditable="true" 
                     data-container="${containerId}"
                     data-scene-id="${scene.id}"
                     data-chapter-id="${chapter.id}"
                     data-act-id="${act.id}"
                     oninput="updateSplitSceneContent(this)"
                     style="flex: 1; padding: 1.5rem; overflow-y: auto; outline: none; line-height: 1.8; font-size: 1.1rem;"
                >${scene.content || ''}</div>
            </div>`;
    }
};
