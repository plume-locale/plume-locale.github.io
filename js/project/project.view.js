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
     * Affiche la liste des projets dans la modale.
     * @param {Array} projects 
     * @param {number|string} currentId 
     */
    renderList(projects, currentId) {
        const container = document.getElementById('projectsList');
        if (!container) return;

        if (!projects || projects.length === 0) {
            container.innerHTML = `<div style="padding: 2rem; text-align: center; color: var(--text-muted);">${Localization.t('project.view.no_project')}</div>`;
            return;
        }

        container.innerHTML = projects.map(proj => {
            const isActive = proj.id === currentId;

            // Calcul rapide des stats
            const actCount = proj.acts ? proj.acts.length : 0;
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

            const charCount = proj.characters ? proj.characters.length : 0;
            const worldCount = proj.world ? proj.world.length : 0;
            const codexCount = proj.codex ? proj.codex.length : 0;

            return `
                <div class="project-card ${isActive ? 'active' : ''}" onclick="ProjectViewModel.switchTo(${proj.id}); ProjectView.closeProjectsModal();">
                    <div class="project-card-header">
                        <div>
                            <div class="project-card-title">${proj.title}</div>
                            ${proj.genre ? `<span class="project-card-genre">${proj.genre}</span>` : ''}
                        </div>
                        ${isActive ? `<span style="color: var(--accent-red); font-weight: 600;">● ${Localization.t('project.view.active')}</span>` : ''}
                    </div>
                    ${proj.description ? `<div class="project-card-desc">${proj.description}</div>` : ''}
                    
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 0.5rem; margin-top: 1rem; padding-top: 0.75rem; border-top: 1px solid var(--border-color); font-size: 0.8rem; color: var(--text-muted);">
                        <div style="display: flex; align-items: center; gap: 6px;" title="${Localization.t('project.view.total_word_count')}">
                            <i data-lucide="align-left" style="width: 14px; height: 14px; color: var(--accent-gold);"></i> 
                            <span style="font-weight: 600;">${wordCount.toLocaleString(Localization.currentLang === 'fr' ? 'fr-FR' : 'en-US')}</span> ${Localization.t('project.view.words')}
                        </div>
                        <div style="display: flex; align-items: center; gap: 6px;" title="${Localization.t('project.view.act_count')}">
                            <i data-lucide="book" style="width: 14px; height: 14px;"></i> 
                            <span>${actCount} ${Localization.t('project.view.acts')}</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 6px;" title="${Localization.t('project.view.chapter_count')}">
                            <i data-lucide="bookmark" style="width: 14px; height: 14px;"></i> 
                            <span>${chapterCount} ${Localization.t('project.view.chapters')}</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 6px;" title="${Localization.t('project.view.scene_count')}">
                            <i data-lucide="file-text" style="width: 14px; height: 14px;"></i> 
                            <span>${sceneCount} ${Localization.t('project.view.scenes')}</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 6px;" title="${Localization.t('project.view.characters')}">
                            <i data-lucide="users" style="width: 14px; height: 14px;"></i> 
                            <span>${charCount} ${Localization.t('project.view.pers')}</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 6px;" title="${Localization.t('project.view.world_entries')}">
                            <i data-lucide="globe" style="width: 14px; height: 14px;"></i> 
                            <span>${worldCount} ${Localization.t('project.view.univ')}</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 6px;" title="${Localization.t('project.view.codex_entries')}">
                            <i data-lucide="book-open" style="width: 14px; height: 14px;"></i> 
                            <span>${codexCount} ${Localization.t('project.view.codex')}</span>
                        </div>
                    </div>

                    <div class="project-card-actions">
                        <button class="btn btn-small" onclick="event.stopPropagation(); ProjectViewModel.export(${proj.id})"><i data-lucide="upload" style="width:12px;height:12px;margin-right:4px;vertical-align:middle;"></i> ${Localization.t('project.view.btn_export')}</button>
                        <button class="btn btn-small" onclick="event.stopPropagation(); ProjectViewModel.delete(${proj.id})"><i data-lucide="trash-2" style="width:12px;height:12px;margin-right:4px;vertical-align:middle;"></i> ${Localization.t('project.view.btn_delete')}</button>
                    </div>
                </div>`;
        }).join('');

        if (typeof lucide !== 'undefined') lucide.createIcons();
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
