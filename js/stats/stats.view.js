/**
 * [MVVM : Stats View]
 * Gère l'affichage des statistiques dans le header et dans la vue principale.
 */

const StatsView = {
    /**
     * Met à jour les compteurs du header.
     */
    updateHeaderStats() {
        const { totalWords, totalChapters } = StatsViewModel.getProjectStats();
        const locale = typeof Localization !== 'undefined' && Localization.getLocale() === 'fr' ? 'fr-FR' : 'en-US';

        const headerWords = document.getElementById('headerTotalWords');
        const headerChapters = document.getElementById('headerTotalChapters');
        const headerTitle = document.getElementById('headerProjectTitle');

        if (headerWords) headerWords.textContent = Localization.t('stats.header.words', [totalWords.toLocaleString(locale)]);
        if (headerChapters) headerChapters.textContent = Localization.t('stats.header.chapters', [totalChapters]);

        if (headerTitle && typeof project !== 'undefined' && project.title) {
            headerTitle.textContent = project.title;
        }

        // Compatibilité ancien ID
        const totalWordsEl = document.getElementById('totalWordCount');
        if (totalWordsEl) {
            totalWordsEl.textContent = totalWords.toLocaleString(locale);
        }
    },

    /**
     * Rendu de la vue complète des statistiques.
     */
    renderStatsPage() {
        const editorView = document.getElementById('editorView');
        if (!editorView) return;

        const { totalWords } = StatsViewModel.getProjectStats();
        const { words: todayWords, goal: dailyGoal, progress: dailyProgress } = StatsViewModel.getTodayStats();
        const stats = StatsRepository.getStats();
        const totalGoal = stats.totalGoal || 50000;
        const totalProgress = Math.min((totalWords / totalGoal) * 100, 100);

        const actStats = StatsViewModel.getStatsByAct();
        const history = StatsViewModel.getLast7DaysHistory();
        const locale = typeof Localization !== 'undefined' && Localization.getLocale() === 'fr' ? 'fr-FR' : 'en-US';

        editorView.innerHTML = `
            <div class="stats-container" style="height: 100%; overflow-y: auto; padding: 2rem 3rem;">
                <h2 style="margin-bottom: 2rem; color: var(--accent-gold); display: flex; align-items: center; gap: 0.5rem;">
                    <i data-lucide="bar-chart-3"></i> ${Localization.t('stats.title')}
                </h2>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem;">
                    <!-- Objectif Total -->
                    <div class="stat-box" style="background: var(--bg-secondary); padding: 2rem; border-radius: 8px; border-left: 4px solid var(--accent-gold);">
                        <div style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 0.5rem;">${Localization.t('stats.total_words')}</div>
                        <div style="font-size: 2.5rem; font-weight: 700; color: var(--accent-gold); margin-bottom: 0.5rem;">${totalWords.toLocaleString(locale)}</div>
                        <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 1rem;">${Localization.t('stats.goal_text', [totalGoal.toLocaleString(locale)])}</div>
                        <div style="background: var(--bg-primary); height: 8px; border-radius: 4px; overflow: hidden;">
                            <div style="background: var(--accent-gold); height: 100%; width: ${totalProgress}%; transition: width 0.3s;"></div>
                        </div>
                        <div style="margin-top: 1.5rem; display: flex; gap: 0.5rem; align-items: center;">
                            <input type="number" class="form-input" value="${totalGoal}" id="totalGoalInput" style="flex: 1; padding: 0.4rem;" placeholder="${Localization.t('stats.placeholder_total_goal')}">
                            <button class="btn btn-small" onclick="StatsRepository.updateGoal('totalGoal', document.getElementById('totalGoalInput').value)">${Localization.t('stats.btn_update')}</button>
                        </div>
                    </div>

                    <!-- Objectif Quotidien -->
                    <div class="stat-box" style="background: var(--bg-secondary); padding: 2rem; border-radius: 8px; border-left: 4px solid var(--accent-red);">
                        <div style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 0.5rem;">${Localization.t('stats.today')}</div>
                        <div style="font-size: 2.5rem; font-weight: 700; color: var(--accent-red); margin-bottom: 0.5rem;">${todayWords}</div>
                        <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 1rem;">${Localization.t('stats.goal_text', [dailyGoal])}</div>
                        <div style="background: var(--bg-primary); height: 8px; border-radius: 4px; overflow: hidden;">
                            <div style="background: var(--accent-red); height: 100%; width: ${dailyProgress}%; transition: width 0.3s;"></div>
                        </div>
                        <div style="margin-top: 1.5rem; display: flex; gap: 0.5rem; align-items: center;">
                            <input type="number" class="form-input" value="${dailyGoal}" id="dailyGoalInput" style="flex: 1; padding: 0.4rem;" placeholder="${Localization.t('stats.placeholder_daily_goal')}">
                            <button class="btn btn-small" onclick="StatsRepository.updateGoal('dailyGoal', document.getElementById('dailyGoalInput').value)">${Localization.t('stats.btn_update')}</button>
                        </div>
                    </div>
                </div>
                
                <div style="margin-top: 3rem; display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 2rem;">
                    <!-- Stats par Acte -->
                    <div>
                        <h3 style="margin-bottom: 1rem; color: var(--text-primary); font-size: 1.1rem;">${Localization.t('stats.by_act')}</h3>
                        <div style="background: var(--bg-secondary); padding: 1rem; border-radius: 8px;">
                            ${actStats.map(act => `
                                <div style="display: flex; justify-content: space-between; padding: 0.75rem 0.5rem; border-bottom: 1px solid var(--border-color);">
                                    <span style="color: var(--text-primary);">${act.title}</span>
                                    <span style="font-weight: 600; color: var(--accent-gold);">${Localization.t('stats.header.words', [act.wordCount.toLocaleString(locale)])}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Historique -->
                    <div>
                        <h3 style="margin-bottom: 1rem; color: var(--text-primary); font-size: 1.1rem;">${Localization.t('stats.history_7days')}</h3>
                        <div style="background: var(--bg-secondary); padding: 1.5rem; border-radius: 8px;">
                            ${history.map(day => `
                                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0;">
                                    <span style="font-size: 0.85rem; width: 80px;">${day.label}</span>
                                    <div style="flex: 1; margin: 0 1rem;">
                                        <div class="progress-bar" style="height: 6px; background: var(--bg-primary); border-radius: 3px; overflow: hidden;">
                                            <div class="progress-fill" style="height: 100%; width: ${day.progress}%; background: ${day.goalReached ? 'var(--accent-gold)' : 'var(--text-muted)'}; transition: width 0.3s;"></div>
                                        </div>
                                    </div>
                                    <span style="font-size: 0.85rem; font-weight: 600; width: 50px; text-align: right;">${day.words}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }
};
