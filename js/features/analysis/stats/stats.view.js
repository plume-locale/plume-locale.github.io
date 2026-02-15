/**
 * [MVVM : Stats View]
 * Gère l'affichage des statistiques dans le header et dans la vue principale.
 */

const StatsView = {
    currentPeriod: '1m',

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

        // 🔥 Protection contre l'écrasement du système d'onglets (Tabs)
        const isTabsSystem = typeof tabsState !== 'undefined' && tabsState.enabled;
        const isMainEditorView = editorView.id === 'editorView';
        const isSplitRendering = document.getElementById('editorView-backup') !== null;

        if (isTabsSystem && isMainEditorView && !isSplitRendering) {
            if (typeof currentView !== 'undefined' && currentView !== 'stats') {
                if (typeof switchView === 'function') {
                    switchView('stats');
                    return;
                }
            } else if (typeof renderTabs === 'function') {
                renderTabs();
                return;
            }
        }

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

                    <!-- Objectif Quotidien Smart -->
                    <div class="stat-box" style="background: var(--bg-secondary); padding: 2rem; border-radius: 8px; border-left: 4px solid var(--accent-red);">
                        <div style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 0.5rem;">${Localization.t('stats.today')}</div>
                        <div style="font-size: 2.5rem; font-weight: 700; color: var(--accent-red); margin-bottom: 0.5rem;">
                            ${todayWords} <span style="font-size: 1rem; color: var(--text-muted); font-weight: normal;">/ ${dailyGoal}</span>
                        </div>
                        <div style="background: var(--bg-primary); height: 8px; border-radius: 4px; overflow: hidden; margin-bottom: 1rem;">
                            <div style="background: var(--accent-red); height: 100%; width: ${dailyProgress}%; transition: width 0.3s;"></div>
                        </div>

                        <!-- Configuration -->
                        <div style="background: var(--bg-primary); padding: 1rem; border-radius: 6px; font-size: 0.9rem;">
                            <div style="display: flex; gap: 1rem; margin-bottom: 1rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem;">
                                <label style="cursor: pointer; display: flex; align-items: center; gap: 0.5rem;">
                                    <input type="radio" name="goalMode" value="fixed" ${(!stats.smartGoal || stats.smartGoal.mode !== 'date') ? 'checked' : ''} onchange="StatsView.toggleGoalMode('fixed')">
                                    ${Localization.t('stats.mode_fixed') || 'Fixe'}
                                </label>
                                <label style="cursor: pointer; display: flex; align-items: center; gap: 0.5rem;">
                                    <input type="radio" name="goalMode" value="date" ${(stats.smartGoal && stats.smartGoal.mode === 'date') ? 'checked' : ''} onchange="StatsView.toggleGoalMode('date')">
                                    ${Localization.t('stats.mode_target_date') || 'Date Limite'}
                                </label>
                            </div>

                            <!-- Mode Fixe -->
                            <div id="fixedGoalConfig" style="display: ${(!stats.smartGoal || stats.smartGoal.mode !== 'date') ? 'block' : 'none'};">
                                <div style="display: flex; gap: 0.5rem;">
                                    <input type="number" class="form-input" value="${stats.dailyGoal || 500}" id="dailyGoalInput" style="flex: 1; padding: 0.3rem;">
                                    <button class="btn btn-small" onclick="StatsRepository.updateGoal('dailyGoal', document.getElementById('dailyGoalInput').value)">OK</button>
                                </div>
                            </div>

                            <!-- Mode Date -->
                            <div id="dateGoalConfig" style="display: ${(stats.smartGoal && stats.smartGoal.mode === 'date') ? 'block' : 'none'};">
                                <div style="margin-bottom: 0.5rem;">
                                    <label style="display: block; font-size: 0.8rem; margin-bottom: 0.2rem;">${Localization.t('stats.target_date_label') || 'Date cible'}</label>
                                    <input type="date" class="form-input" id="targetDateInput" value="${stats.smartGoal && stats.smartGoal.targetDate ? stats.smartGoal.targetDate.split('T')[0] : ''}" style="width: 100%; padding: 0.3rem;" onchange="StatsView.updateSmartConfig()">
                                </div>
                                <div>
                                    <label style="display: block; font-size: 0.8rem; margin-bottom: 0.2rem;">${Localization.t('stats.days_off') || 'Repos'}</label>
                                    <div style="display: flex; gap: 0.25rem; flex-wrap: wrap;">
                                        ${['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map((d, i) => `
                                            <label style="font-size: 0.75rem; display: flex; align-items: center; gap: 0.2rem; background: var(--bg-secondary); padding: 2px 6px; border-radius: 4px; cursor: pointer;">
                                                <input type="checkbox" class="day-off-checkbox" value="${i}" ${(stats.smartGoal && stats.smartGoal.daysOff && stats.smartGoal.daysOff.includes(i)) ? 'checked' : ''} onchange="StatsView.updateSmartConfig()">
                                                ${d}
                                            </label>
                                        `).join('')}
                                    </div>
                                </div>
                                <div style="margin-top: 0.5rem; font-size: 0.8rem; color: var(--text-secondary); text-align: right;">
                                    ${dailyGoal} ${Localization.t('stats.words_remaining_per_day') || 'mots / jour'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div style="margin-top: 3rem; display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 2rem;">
                    
                    <!-- Graphique Historique -->
                    <div style="margin-bottom: 2rem;">
                         <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                            <h3 style="color: var(--text-primary); font-size: 1.1rem; margin: 0;">${Localization.t('stats.history_chart') || 'Progression'}</h3>
                            <div class="chart-controls" style="display: flex; gap: 0.5rem;">
                                <button class="btn btn-small btn-chart ${StatsView.currentPeriod === '1w' ? 'btn-active' : ''}" onclick="StatsView.changeGraphPeriod('1w')">7J</button>
                                <button class="btn btn-small btn-chart ${StatsView.currentPeriod === '1m' ? 'btn-active' : ''}" onclick="StatsView.changeGraphPeriod('1m')">1M</button>
                                <button class="btn btn-small btn-chart ${StatsView.currentPeriod === '3m' ? 'btn-active' : ''}" onclick="StatsView.changeGraphPeriod('3m')">3M</button>
                                <button class="btn btn-small btn-chart ${StatsView.currentPeriod === '6m' ? 'btn-active' : ''}" onclick="StatsView.changeGraphPeriod('6m')">6M</button>
                                <button class="btn btn-small btn-chart ${StatsView.currentPeriod === '1y' ? 'btn-active' : ''}" onclick="StatsView.changeGraphPeriod('1y')">1A</button>
                            </div>
                        </div>
                        <div style="background: var(--bg-secondary); padding: 1.5rem; border-radius: 8px; height: 300px; position: relative;">
                            <canvas id="statsHistoryChart" width="800" height="300" style="width: 100%; height: 100%;"></canvas>
                        </div>
                    </div>

                    <div style="display: block;">
                    
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

        // Render Graph after DOM update
        setTimeout(() => this.renderChart(this.currentPeriod), 50);
    },

    changeGraphPeriod(period) {
        this.currentPeriod = period;
        this.renderStatsPage(); // Full re-render to update buttons state and chart container
    },

    renderChart(period) {
        const canvas = document.getElementById('statsHistoryChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const historyData = StatsViewModel.getHistoryByPeriod(period);

        // Canvas dimensions matching CSS size roughly
        const width = canvas.width;  // Use explicit width
        const height = canvas.height; // Use explicit height

        // Config
        const padding = 40;
        const graphWidth = width - padding * 2;
        const graphHeight = height - padding * 2;

        // Find Max Y (include Goal to ensure it fits)
        const maxDataVal = Math.max(...historyData.map(d => d.words));
        const maxGoalVal = Math.max(...historyData.map(d => d.goal || 500));
        const maxWords = Math.max(maxDataVal, maxGoalVal, 10) * 1.1; // +10% margin

        // Clear
        ctx.clearRect(0, 0, width, height);

        // Draw Axes
        ctx.beginPath();
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 1;

        // Y Axis line
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, height - padding);

        // X Axis line
        ctx.lineTo(width - padding, height - padding);
        ctx.stroke();

        if (historyData.length < 2) return;

        // Draw Line
        ctx.beginPath();
        ctx.strokeStyle = '#d4af37'; // Accent gold
        ctx.lineWidth = 2;

        const xStep = graphWidth / (historyData.length - 1);

        historyData.forEach((point, index) => {
            const x = padding + index * xStep;
            // Invert Y because canvas 0,0 is top-left
            const y = height - padding - (point.words / maxWords) * graphHeight;

            if (index === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();

        // Points
        if (historyData.length < 50) {
            historyData.forEach((point, index) => {
                const x = padding + index * xStep;
                const y = height - padding - (point.words / maxWords) * graphHeight;
                ctx.fillStyle = '#d4af37';
                ctx.fillRect(x - 2, y - 2, 4, 4);
            });
        }

        // Fill Area
        ctx.beginPath();
        ctx.moveTo(padding, height - padding);
        historyData.forEach((point, index) => {
            const x = padding + index * xStep;
            const y = height - padding - (point.words / maxWords) * graphHeight;
            ctx.lineTo(x, y);
        });
        ctx.lineTo(padding + (historyData.length - 1) * xStep, height - padding);
        ctx.closePath();
        ctx.fillStyle = 'rgba(212, 175, 55, 0.1)';
        ctx.fill();

        // Draw GOAL Line
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255, 99, 71, 0.5)'; // Accent red, semi-transparent
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]); // Dashed line

        historyData.forEach((point, index) => {
            const x = padding + index * xStep;
            // Use point.goal if available, or fallback to fixed goal if not history specific
            const goal = point.goal || 500;
            const y = height - padding - (goal / maxWords) * graphHeight;

            if (index === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();
        ctx.setLineDash([]); // Reset dash for other elements

        // Draw Legend
        ctx.font = '10px sans-serif';
        // Words (Gold)
        ctx.fillStyle = '#d4af37';
        ctx.fillRect(width - 150, 10, 10, 10);
        ctx.fillText(Localization.t('stats.header.words', ['']), width - 135, 18);
        // Goal (Red)
        ctx.fillStyle = 'rgba(255, 99, 71, 0.8)';
        ctx.fillRect(width - 150, 25, 10, 10);
        ctx.fillText(Localization.t('stats.placeholder_daily_goal') || 'Goal', width - 135, 33);


        // Draw Labels (Simplified X Axis - Start and End)
        ctx.fillStyle = '#888';
        ctx.font = '10px sans-serif';
        if (historyData.length > 0) {
            // Start Date
            ctx.fillText(historyData[0].date.toLocaleDateString(), padding, height - padding + 15);
            // End Date
            const endText = historyData[historyData.length - 1].date.toLocaleDateString();
            const endTextWidth = ctx.measureText(endText).width;
            ctx.fillText(endText, width - padding - endTextWidth, height - padding + 15);
        }

        // Y Axis Max Label
        ctx.fillText(maxWords.toString(), 5, padding);
        ctx.fillText("0", 25, height - padding);

    },

    /**
     * Bascule le mode de l'objectif (Fixe ou Date).
     */
    toggleGoalMode(mode) {
        StatsRepository.updateSmartGoal({ mode: mode });
        // Le flux de données mettra à jour la vue via l'événement statsUpdated
        // Mais nous devons aussi forcer le rafraichissement si l'event listener n'est pas configuré pour re-rendere toute la page
        // Pour l'instant, on suppose que l'app redessine sur statsUpdated ou on force
        this.renderStatsPage(); // Re-render immédiat pour réactivité
    },

    /**
     * Met à jour la configuration complète depuis les inputs.
     */
    updateSmartConfig() {
        const targetDate = document.getElementById('targetDateInput').value;
        const daysOffCheckboxes = document.querySelectorAll('.day-off-checkbox:checked');
        const daysOff = Array.from(daysOffCheckboxes).map(cb => parseInt(cb.value));

        StatsRepository.updateSmartGoal({
            targetDate: targetDate,
            daysOff: daysOff
        });

        // Pas besoin de re-render tout de suite si ça lag, mais pour voir le recalcul des mots/jour :
        this.renderStatsPage();
    }
};
