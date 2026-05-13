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

        // --- Barre de progression quotidienne dans le header ---
        const { words: todayWords, goal: dailyGoal, progress: dailyProgress } = StatsViewModel.getTodayStats();
        const progressFill = document.getElementById('headerDailyProgressFill');
        const progressLabel = document.getElementById('headerDailyProgressLabel');
        if (progressFill) {
            progressFill.style.width = `${dailyProgress}%`;
            const isGoalReached = dailyProgress >= 100;
            progressFill.style.background = isGoalReached
                ? 'var(--accent-gold)'
                : 'var(--accent-red, #ff6347)';
        }
        if (progressLabel) {
            progressLabel.textContent = `${todayWords}/${dailyGoal}`;
            progressLabel.title = Localization.t('stats.today') + ` : ${todayWords} / ${dailyGoal}`;
        }

        // --- Streak dans le header ---
        const streakEl = document.getElementById('headerStreakCount');
        const streakContainer = document.getElementById('headerStreakContainer');
        if (streakEl || streakContainer) {
            const { current, isActive } = StatsViewModel.getStreakData();
            if (streakEl) {
                const flameEmoji = current > 0 ? (isActive ? '🔥' : '💤') : '';
                streakEl.textContent = current > 0 ? `${flameEmoji} ${current}` : '';
            }
            if (streakContainer) {
                streakContainer.style.display = current > 0 ? 'flex' : 'none';
                streakContainer.title = current > 0
                    ? Localization.t('stats.streak.current', [current])
                    : '';
            }
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
        const streakData = StatsViewModel.getStreakData();
        const nanoStats = StatsViewModel.getNaNoStats();
        const locale = typeof Localization !== 'undefined' && Localization.getLocale() === 'fr' ? 'fr-FR' : 'en-US';

        editorView.innerHTML = `
            <div class="stats-container" style="height: 100%; overflow-y: auto; padding: 2.5rem 3rem; background: var(--bg-primary);">
                <div style="max-width: 1400px; margin: 0 auto;">
                    <h2 style="margin-bottom: 2rem; color: var(--text-primary); display: flex; align-items: center; gap: 0.75rem; font-size: 2rem; font-weight: 800; letter-spacing: -0.02em;">
                        <i data-lucide="layout-dashboard" style="width: 32px; height: 32px; color: var(--accent-gold);"></i> 
                        ${Localization.t('stats.title')}
                    </h2>
                    
                    <div style="display: grid; grid-template-columns: repeat(12, 1fr); gap: 1.5rem;">
                        
                        <!-- 1. SESSION DU JOUR (4 colonnes) -->
                        <div class="stat-box" style="grid-column: span 4; background: linear-gradient(160deg, var(--bg-secondary) 0%, var(--bg-primary) 100%); padding: 1.75rem; border-radius: 16px; border: 1px solid var(--border-color); box-shadow: 0 8px 24px rgba(0,0,0,0.06); position: relative; overflow: hidden;">
                            <div style="position: absolute; top: -15px; right: -15px; opacity: 0.05; color: var(--accent-red);">
                                <i data-lucide="target" style="width: 120px; height: 120px;"></i>
                            </div>
                            <div style="font-size: 0.9rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                                <i data-lucide="pen-tool" style="width: 16px; height: 16px;"></i> ${Localization.t('stats.today')}
                            </div>
                            <div style="font-size: 3.5rem; font-weight: 800; color: var(--text-primary); line-height: 1; margin-bottom: 0.5rem;">
                                ${todayWords}
                            </div>
                            <div style="font-size: 1rem; color: var(--text-muted); margin-bottom: 1.5rem;">
                                / ${dailyGoal} mots
                            </div>
                            <div style="background: var(--bg-primary); height: 8px; border-radius: 4px; overflow: hidden; margin-bottom: 1.5rem; border: 1px solid var(--border-color);">
                                <div style="background: ${dailyProgress >= 100 ? 'var(--accent-gold)' : 'var(--accent-red)'}; height: 100%; width: ${dailyProgress}%; transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);"></div>
                            </div>
                            <!-- Config Quotidienne Rapide -->
                            <div style="display: flex; gap: 0.5rem;">
                                <input type="number" class="form-input" value="${stats.dailyGoal || 500}" id="dailyGoalInput" style="flex: 1; padding: 0.5rem; font-size: 0.85rem; border-radius: 8px; background: rgba(0,0,0,0.1);" placeholder="${Localization.t('stats.placeholder_daily_goal')}">
                                <button class="btn btn-small" style="border-radius: 8px;" onclick="StatsRepository.updateGoal('dailyGoal', document.getElementById('dailyGoalInput').value)">OK</button>
                            </div>
                        </div>

                        <!-- 2. STREAK (4 colonnes) -->
                        <div class="stat-box" style="grid-column: span 4; background: linear-gradient(160deg, var(--bg-secondary) 0%, var(--bg-primary) 100%); padding: 1.75rem; border-radius: 16px; border: 1px solid var(--border-color); box-shadow: 0 8px 24px rgba(0,0,0,0.06); position: relative; overflow: hidden;">
                            <div style="position: absolute; top: -10px; right: -10px; font-size: 8rem; opacity: 0.05; user-select: none; filter: grayscale(1);">🔥</div>
                            <div style="font-size: 0.9rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                                <i data-lucide="flame" style="width: 16px; height: 16px; color: #ff8c00;"></i> ${Localization.t('stats.streak.title')}
                            </div>
                            <div style="display: flex; align-items: baseline; gap: 0.5rem; margin-bottom: 0.5rem;">
                                <div style="font-size: 3.5rem; font-weight: 800; color: ${streakData.isActive ? '#ff8c00' : 'var(--text-primary)'}; line-height: 1;">
                                    ${streakData.current}
                                </div>
                                <div style="font-size: 1rem; color: var(--text-muted);">
                                    ${Localization.t('stats.streak.days')}
                                </div>
                            </div>
                            <div style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.5rem;">
                                <i data-lucide="trophy" style="width: 14px; height: 14px;"></i> ${Localization.t('stats.streak.best')}: <strong style="color: var(--text-secondary);">${streakData.longest}</strong>
                            </div>
                            <div style="padding: 0.75rem 1rem; border-radius: 8px; background: ${streakData.isActive ? 'rgba(255, 140, 0, 0.1)' : 'rgba(0,0,0,0.1)'}; color: ${streakData.isActive ? '#ff8c00' : 'var(--text-muted)'}; font-size: 0.85rem; font-weight: 500; display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
                                ${streakData.isActive ? '🔥 ' + Localization.t('stats.streak.active') : '💤 ' + Localization.t('stats.streak.inactive')}
                            </div>
                        </div>

                        <!-- 3. OBJECTIF TOTAL (4 colonnes) -->
                        <div class="stat-box" style="grid-column: span 4; background: linear-gradient(160deg, var(--bg-secondary) 0%, var(--bg-primary) 100%); padding: 1.75rem; border-radius: 16px; border: 1px solid var(--border-color); box-shadow: 0 8px 24px rgba(0,0,0,0.06); position: relative; overflow: hidden;">
                            <div style="position: absolute; top: -15px; right: -15px; opacity: 0.05; color: var(--accent-gold);">
                                <i data-lucide="flag" style="width: 120px; height: 120px;"></i>
                            </div>
                            <div style="font-size: 0.9rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                                <i data-lucide="book-open" style="width: 16px; height: 16px;"></i> ${Localization.t('stats.total_words')}
                            </div>
                            <div style="font-size: 3.5rem; font-weight: 800; color: var(--text-primary); line-height: 1; margin-bottom: 0.5rem;">
                                ${totalWords.toLocaleString(locale)}
                            </div>
                            <div style="font-size: 1rem; color: var(--text-muted); margin-bottom: 1.5rem;">
                                / ${totalGoal.toLocaleString(locale)}
                            </div>
                            <div style="background: var(--bg-primary); height: 8px; border-radius: 4px; overflow: hidden; margin-bottom: 1.5rem; border: 1px solid var(--border-color);">
                                <div style="background: var(--accent-gold); height: 100%; width: ${totalProgress}%; transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);"></div>
                            </div>
                            <div style="display: flex; gap: 0.5rem;">
                                <input type="number" class="form-input" value="${totalGoal}" id="totalGoalInput" style="flex: 1; padding: 0.5rem; font-size: 0.85rem; border-radius: 8px; background: rgba(0,0,0,0.1);" placeholder="${Localization.t('stats.placeholder_total_goal')}">
                                <button class="btn btn-small" style="border-radius: 8px;" onclick="StatsRepository.updateGoal('totalGoal', document.getElementById('totalGoalInput').value)">${Localization.t('stats.btn_update')}</button>
                            </div>
                        </div>

                        <!-- 4. GRAPHIQUE HISTORIQUE (8 colonnes) -->
                        <div class="stat-box" style="grid-column: span 8; background: var(--bg-secondary); padding: 1.75rem; border-radius: 16px; border: 1px solid var(--border-color); box-shadow: 0 8px 24px rgba(0,0,0,0.06); display: flex; flex-direction: column;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                                <div style="font-size: 0.9rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; display: flex; align-items: center; gap: 0.5rem;">
                                    <i data-lucide="trending-up" style="width: 16px; height: 16px;"></i> ${Localization.t('stats.history_chart') || 'Progression'}
                                </div>
                                <div class="chart-controls" style="display: flex; gap: 0.25rem; background: var(--bg-primary); padding: 0.25rem; border-radius: 8px; border: 1px solid var(--border-color);">
                                    <button class="btn btn-small btn-chart ${StatsView.currentPeriod === '1w' ? 'btn-active' : ''}" style="border-radius: 6px; padding: 0.25rem 0.75rem;" onclick="StatsView.changeGraphPeriod('1w')">7J</button>
                                    <button class="btn btn-small btn-chart ${StatsView.currentPeriod === '1m' ? 'btn-active' : ''}" style="border-radius: 6px; padding: 0.25rem 0.75rem;" onclick="StatsView.changeGraphPeriod('1m')">1M</button>
                                    <button class="btn btn-small btn-chart ${StatsView.currentPeriod === '3m' ? 'btn-active' : ''}" style="border-radius: 6px; padding: 0.25rem 0.75rem;" onclick="StatsView.changeGraphPeriod('3m')">3M</button>
                                    <button class="btn btn-small btn-chart ${StatsView.currentPeriod === '6m' ? 'btn-active' : ''}" style="border-radius: 6px; padding: 0.25rem 0.75rem;" onclick="StatsView.changeGraphPeriod('6m')">6M</button>
                                    <button class="btn btn-small btn-chart ${StatsView.currentPeriod === '1y' ? 'btn-active' : ''}" style="border-radius: 6px; padding: 0.25rem 0.75rem;" onclick="StatsView.changeGraphPeriod('1y')">1A</button>
                                </div>
                            </div>
                            <div style="flex: 1; min-height: 300px; position: relative;">
                                <canvas id="statsHistoryChart" style="width: 100%; height: 100%; display: block;"></canvas>
                            </div>
                        </div>

                        <!-- 5. NANOWRIMO (4 colonnes) -->
                        <div class="stat-box" style="grid-column: span 4; background: linear-gradient(160deg, var(--bg-secondary) 0%, var(--bg-primary) 100%); padding: 1.75rem; border-radius: 16px; border: 1px solid var(--border-color); box-shadow: 0 8px 24px rgba(0,0,0,0.06); position: relative; overflow: hidden; display: flex; flex-direction: column;">
                            <div style="position: absolute; top: -15px; right: -15px; font-size: 8rem; opacity: 0.03; user-select: none; pointer-events: none; filter: grayscale(1);">📚</div>
                            
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem;">
                                <div style="font-size: 0.9rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; display: flex; align-items: center; gap: 0.5rem;">
                                    <i data-lucide="book" style="width: 16px; height: 16px; color: #9b59b6;"></i> ${Localization.t('stats.nano.title')}
                                </div>
                                <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; font-size: 0.8rem; background: var(--bg-primary); padding: 0.25rem 0.5rem; border-radius: 6px; border: 1px solid var(--border-color); position: relative; z-index: 2;">
                                    <input type="checkbox" id="nanoModeToggle" ${stats.nanoMode ? 'checked' : ''} onchange="StatsRepository.updateNanoConfig({ nanoMode: this.checked }); StatsView.refreshNanoCard();">
                                    ${Localization.t('stats.nano.enable')}
                                </label>
                            </div>

                            <div id="nanoCardContent" style="display:contents;">
                            ${stats.nanoMode ? `
                                <div style="flex: 1;">
                                    <div style="font-size: 2.5rem; font-weight: 800; color: #9b59b6; line-height: 1; margin-bottom: 0.5rem;">
                                        ${nanoStats.currentWords.toLocaleString(locale)}
                                    </div>
                                    <div style="font-size: 1rem; color: var(--text-muted); margin-bottom: 1rem;">
                                        / 50 000 mots
                                    </div>
                                    
                                    <div style="background: var(--bg-primary); height: 8px; border-radius: 4px; overflow: hidden; margin-bottom: 0.5rem; border: 1px solid var(--border-color);">
                                        <div style="background: ${nanoStats.onTrack ? '#9b59b6' : '#e74c3c'}; height: 100%; width: ${nanoStats.progressPercent}%; transition: width 0.5s;"></div>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; font-size: 0.8rem; font-weight: 500; color: var(--text-muted); margin-bottom: 1.5rem;">
                                        <span>${Math.round(nanoStats.progressPercent)}%</span>
                                        <span style="color: ${nanoStats.onTrack ? '#9b59b6' : '#e74c3c'};">${nanoStats.onTrack ? '✅ ' + Localization.t('stats.nano.on_track') : '⚠️ ' + Localization.t('stats.nano.behind')}</span>
                                    </div>

                                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
                                        <div style="background: rgba(0,0,0,0.1); padding: 1rem; border-radius: 8px; text-align: center; border: 1px solid var(--border-color);">
                                            <div style="font-size: 1.25rem; font-weight: 700; color: var(--text-primary);">${nanoStats.wordsNeeded.toLocaleString(locale)}</div>
                                            <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; margin-top: 0.25rem;">${Localization.t('stats.nano.words_per_day')}</div>
                                        </div>
                                        <div style="background: rgba(0,0,0,0.1); padding: 1rem; border-radius: 8px; text-align: center; border: 1px solid var(--border-color);">
                                            <div style="font-size: 1.25rem; font-weight: 700; color: var(--text-primary);">${nanoStats.daysLeft}</div>
                                            <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; margin-top: 0.25rem;">${Localization.t('stats.nano.days_left')}</div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div>
                                    <div style="font-size: 0.8rem; font-weight: 600; color: var(--text-muted); margin-bottom: 0.5rem; text-transform: uppercase;">${Localization.t('stats.nano.start_date')}</div>
                                    <input type="date" class="form-input" id="nanoStartDateInput" 
                                        value="${stats.nanoStartDate ? stats.nanoStartDate.split('T')[0] : new Date().toISOString().split('T')[0]}"
                                        style="width: 100%; padding: 0.5rem; font-size: 0.85rem; border-radius: 8px; background: rgba(0,0,0,0.1);"
                                        onchange="StatsRepository.updateNanoConfig({ nanoStartDate: event.target.value }); StatsView.refreshNanoCard();">
                                </div>
                            ` : `
                                <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 2rem 1rem; color: var(--text-muted);">
                                    <i data-lucide="book-open" style="width: 48px; height: 48px; margin-bottom: 1rem; opacity: 0.2;"></i>
                                    <div style="font-size: 0.95rem; line-height: 1.5;">${Localization.t('stats.nano.description')}</div>
                                </div>
                            `}
                            </div>
                        </div>

                        <!-- 8. HEATMAPS & INSIGHTS (12 colonnes) -->
                        <div class="stat-box" style="grid-column: span 12; background: var(--bg-secondary); padding: 1.75rem; border-radius: 16px; border: 1px solid var(--border-color); box-shadow: 0 8px 24px rgba(0,0,0,0.06); display: flex; flex-direction: column;">
                            <div style="font-size: 0.9rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.5rem;">
                                <i data-lucide="activity" style="width: 16px; height: 16px;"></i> ${Localization.t('stats.heatmap.title') || "Habitudes d'Écriture"}
                            </div>
                            
                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 2rem;">
                                <!-- Hourly Chart -->
                                <div id="hourlyChartContainer" style="background: var(--bg-primary); padding: 1rem; border-radius: 12px; border: 1px solid var(--border-color);"></div>
                                
                                <!-- Weekday Chart -->
                                <div id="weekdayChartContainer" style="background: var(--bg-primary); padding: 1rem; border-radius: 12px; border: 1px solid var(--border-color);"></div>
                            </div>

                            <div id="yearlyChartContainer" style="margin-top: 1.5rem; background: var(--bg-primary); padding: 1rem; border-radius: 12px; border: 1px solid var(--border-color); overflow-x: auto;"></div>
                        </div>

                        <!-- 6. PAR ACTE (6 colonnes) -->
                        <div class="stat-box" style="grid-column: span 6; background: var(--bg-secondary); padding: 1.75rem; border-radius: 16px; border: 1px solid var(--border-color); box-shadow: 0 8px 24px rgba(0,0,0,0.06);">
                            <div style="font-size: 0.9rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.5rem;">
                                <i data-lucide="layers" style="width: 16px; height: 16px;"></i> ${Localization.t('stats.by_act')}
                            </div>
                            <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                                ${actStats.length > 0 ? actStats.map(act => `
                                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: var(--bg-primary); border-radius: 8px; border: 1px solid var(--border-color);">
                                        <span style="color: var(--text-primary); font-weight: 500;">${act.title}</span>
                                        <span style="font-weight: 700; color: var(--text-secondary); background: rgba(0,0,0,0.1); padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.9rem;">${act.wordCount.toLocaleString(locale)} mots</span>
                                    </div>
                                `).join('') : `<div style="text-align: center; padding: 2rem; color: var(--text-muted); font-style: italic;">Aucun acte défini</div>`}
                            </div>
                        </div>

                        <!-- 7. HISTORIQUE (6 colonnes) -->
                        <div class="stat-box" style="grid-column: span 6; background: var(--bg-secondary); padding: 1.75rem; border-radius: 16px; border: 1px solid var(--border-color); box-shadow: 0 8px 24px rgba(0,0,0,0.06);">
                            <div style="font-size: 0.9rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.5rem;">
                                <i data-lucide="calendar" style="width: 16px; height: 16px;"></i> ${Localization.t('stats.history_7days')}
                            </div>
                            <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                                ${history.map(day => `
                                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; background: var(--bg-primary); border-radius: 8px; border: 1px solid var(--border-color);">
                                        <span style="font-size: 0.9rem; width: 90px; color: var(--text-secondary); font-weight: 500;">${day.label}</span>
                                        <div style="flex: 1; margin: 0 1.5rem;">
                                            <div class="progress-bar" style="height: 6px; background: rgba(0,0,0,0.1); border-radius: 3px; overflow: hidden;">
                                                <div class="progress-fill" style="height: 100%; width: ${day.progress}%; background: ${day.goalReached ? 'var(--accent-gold)' : 'var(--text-muted)'}; transition: width 0.5s;"></div>
                                            </div>
                                        </div>
                                        <span style="font-size: 0.95rem; font-weight: 700; width: 70px; text-align: right; color: ${day.goalReached ? 'var(--accent-gold)' : 'var(--text-primary)'};">
                                            ${day.words} ${day.goalReached ? '<i data-lucide="check-circle" style="width: 14px; height: 14px; display: inline-block; vertical-align: middle;"></i>' : ''}
                                        </span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        `;

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Render Graph after DOM update
        setTimeout(() => {
            this.renderChart(this.currentPeriod);
            this.renderHeatmaps();
        }, 50);
    },

    changeGraphPeriod(period) {
        this.currentPeriod = period;
        this.renderStatsPage(); // Full re-render to update buttons state and chart container
    },

    /**
     * Met à jour uniquement le contenu dynamique de la carte NaNoWriMo
     * sans passer par le guard du système de tabs (renderStatsPage y ferait un early-return).
     */
    refreshNanoCard() {
        const container = document.getElementById('nanoCardContent');
        if (!container) { this.renderStatsPage(); return; }

        const stats = StatsRepository.getStats();
        const nanoStats = StatsViewModel.getNaNoStats();
        const locale = typeof Localization !== 'undefined' && Localization.getLocale() === 'fr' ? 'fr-FR' : 'en-US';

        if (stats.nanoMode) {
            container.innerHTML = `
                <div style="flex: 1;">
                    <div style="font-size: 2.5rem; font-weight: 800; color: #9b59b6; line-height: 1; margin-bottom: 0.5rem;">
                        ${nanoStats.currentWords.toLocaleString(locale)}
                    </div>
                    <div style="font-size: 1rem; color: var(--text-muted); margin-bottom: 1rem;">/ 50 000 mots</div>
                    <div style="background: var(--bg-primary); height: 8px; border-radius: 4px; overflow: hidden; margin-bottom: 0.5rem; border: 1px solid var(--border-color);">
                        <div style="background: ${nanoStats.onTrack ? '#9b59b6' : '#e74c3c'}; height: 100%; width: ${nanoStats.progressPercent}%; transition: width 0.5s;"></div>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 0.8rem; font-weight: 500; color: var(--text-muted); margin-bottom: 1.5rem;">
                        <span>${Math.round(nanoStats.progressPercent)}%</span>
                        <span style="color: ${nanoStats.onTrack ? '#9b59b6' : '#e74c3c'};">${nanoStats.onTrack ? '✅ ' + Localization.t('stats.nano.on_track') : '⚠️ ' + Localization.t('stats.nano.behind')}</span>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
                        <div style="background: rgba(0,0,0,0.1); padding: 1rem; border-radius: 8px; text-align: center; border: 1px solid var(--border-color);">
                            <div style="font-size: 1.25rem; font-weight: 700; color: var(--text-primary);">${nanoStats.wordsNeeded.toLocaleString(locale)}</div>
                            <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; margin-top: 0.25rem;">${Localization.t('stats.nano.words_per_day')}</div>
                        </div>
                        <div style="background: rgba(0,0,0,0.1); padding: 1rem; border-radius: 8px; text-align: center; border: 1px solid var(--border-color);">
                            <div style="font-size: 1.25rem; font-weight: 700; color: var(--text-primary);">${nanoStats.daysLeft}</div>
                            <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; margin-top: 0.25rem;">${Localization.t('stats.nano.days_left')}</div>
                        </div>
                    </div>
                </div>
                <div>
                    <div style="font-size: 0.8rem; font-weight: 600; color: var(--text-muted); margin-bottom: 0.5rem; text-transform: uppercase;">${Localization.t('stats.nano.start_date')}</div>
                    <input type="date" class="form-input" id="nanoStartDateInput"
                        value="${stats.nanoStartDate ? stats.nanoStartDate.split('T')[0] : new Date().toISOString().split('T')[0]}"
                        style="width: 100%; padding: 0.5rem; font-size: 0.85rem; border-radius: 8px; background: rgba(0,0,0,0.1);"
                        onchange="StatsRepository.updateNanoConfig({ nanoStartDate: event.target.value }); StatsView.refreshNanoCard();">
                </div>`;
        } else {
            container.innerHTML = `
                <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 2rem 1rem; color: var(--text-muted);">
                    <i data-lucide="book-open" style="width: 48px; height: 48px; margin-bottom: 1rem; opacity: 0.2;"></i>
                    <div style="font-size: 0.95rem; line-height: 1.5;">${Localization.t('stats.nano.description')}</div>
                </div>`;
            if (typeof lucide !== 'undefined') lucide.createIcons({ node: container });
        }
    },

    renderChart(period) {
        const canvas = document.getElementById('statsHistoryChart');
        if (!canvas || !canvas.parentElement) return;

        // Fix Distortion and handle High DPI displays
        const rect = canvas.parentElement.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        
        // Set actual size in memory (scaled to account for extra pixel density)
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        
        const ctx = canvas.getContext('2d');
        // Normalize coordinate system to use css pixels
        ctx.scale(dpr, dpr);

        const historyData = StatsViewModel.getHistoryByPeriod(period);

        // Canvas dimensions for drawing calculations (logical CSS pixels)
        const width = rect.width;
        const height = rect.height;

        // Config
        const padding = { top: 40, right: 30, bottom: 40, left: 50 };
        const graphWidth = width - padding.left - padding.right;
        const graphHeight = height - padding.top - padding.bottom;

        // Colors
        const primaryColor = '#d4af37';
        const primaryColorTrans = 'rgba(212, 175, 55, 0.3)';
        const gridColor = 'rgba(150, 150, 150, 0.1)';
        const textColor = '#888';
        const goalColor = 'rgba(255, 99, 71, 0.6)';

        // Find Max Y
        const maxDataVal = Math.max(...historyData.map(d => d.words), 0);
        const maxGoalVal = Math.max(...historyData.map(d => d.goal || 500), 0);
        const maxWords = Math.max(maxDataVal, maxGoalVal, 10) * 1.15; // +15% margin

        // Clear
        ctx.clearRect(0, 0, width, height);

        if (historyData.length < 2) return;

        // Draw Grid and Y-Axis Labels
        ctx.font = '11px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = textColor;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        
        const ySteps = 5;
        for (let i = 0; i <= ySteps; i++) {
            const val = maxWords * (i / ySteps);
            const y = height - padding.bottom - (val / maxWords) * graphHeight;
            
            // Grid line
            ctx.beginPath();
            ctx.strokeStyle = gridColor;
            ctx.lineWidth = 1;
            ctx.moveTo(padding.left, y);
            ctx.lineTo(width - padding.right, y);
            ctx.stroke();

            // Label
            ctx.fillText(Math.round(val).toLocaleString(), padding.left - 10, y);
        }

        const xStep = graphWidth / (historyData.length - 1);

        // Draw Area Fill (Gradient)
        const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
        gradient.addColorStop(0, primaryColorTrans);
        gradient.addColorStop(1, 'rgba(212, 175, 55, 0)');

        ctx.beginPath();
        ctx.moveTo(padding.left, height - padding.bottom);
        historyData.forEach((point, index) => {
            const x = padding.left + index * xStep;
            const y = height - padding.bottom - (point.words / maxWords) * graphHeight;
            ctx.lineTo(x, y);
        });
        ctx.lineTo(padding.left + (historyData.length - 1) * xStep, height - padding.bottom);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();

        // Draw Line
        ctx.beginPath();
        ctx.strokeStyle = primaryColor;
        ctx.lineWidth = 3;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        
        historyData.forEach((point, index) => {
            const x = padding.left + index * xStep;
            const y = height - padding.bottom - (point.words / maxWords) * graphHeight;
            if (index === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();

        // Draw GOAL Line
        ctx.beginPath();
        ctx.strokeStyle = goalColor;
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);

        historyData.forEach((point, index) => {
            const x = padding.left + index * xStep;
            const goal = point.goal || 500;
            const y = height - padding.bottom - (goal / maxWords) * graphHeight;
            if (index === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();
        ctx.setLineDash([]);

        // Points
        if (historyData.length < 40) {
            historyData.forEach((point, index) => {
                const x = padding.left + index * xStep;
                const y = height - padding.bottom - (point.words / maxWords) * graphHeight;
                ctx.beginPath();
                ctx.arc(x, y, 4, 0, Math.PI * 2);
                ctx.fillStyle = '#1e1e1e'; // Dark center to match background
                ctx.fill();
                ctx.lineWidth = 2;
                ctx.strokeStyle = primaryColor;
                ctx.stroke();
            });
        }

        // Draw X Labels
        ctx.fillStyle = textColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        
        // Show max 7 labels to avoid crowding
        const labelStep = Math.max(1, Math.ceil(historyData.length / 7));
        historyData.forEach((point, index) => {
            if (index % labelStep === 0 || index === historyData.length - 1) {
                const x = padding.left + index * xStep;
                const dateText = point.date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
                ctx.fillText(dateText, x, height - padding.bottom + 15);
            }
        });

        // Draw Legend
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        
        // Words Legend
        ctx.fillStyle = primaryColor;
        ctx.fillRect(width - padding.right - 80, padding.top - 25, 12, 12);
        ctx.fillText(Localization.t('stats.header.words', ['']), width - padding.right - 90, padding.top - 19);
        
        // Goal Legend
        ctx.fillStyle = goalColor;
        ctx.fillRect(width - padding.right - 80, padding.top - 10, 12, 12);
        ctx.fillText(Localization.t('stats.placeholder_daily_goal') || 'Goal', width - padding.right - 90, padding.top - 4);
    },

    renderHeatmaps() {
        if (typeof StatsViewModel.getHourlyHeatmap !== 'function') return;
        
        const hourlyData = StatsViewModel.getHourlyHeatmap();
        const weekdayData = StatsViewModel.getWeekdayHeatmap();
        
        // Render Hourly
        const hourlyContainer = document.getElementById('hourlyChartContainer');
        if (hourlyContainer) {
            const maxHourly = Math.max(...hourlyData, 1);
            let html = `<div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.5rem; text-align: center;">Mots écrits par heure</div>`;
            html += `<div style="display: flex; align-items: flex-end; gap: 2px; height: 100px; padding: 10px 0; border-bottom: 1px solid var(--border-color);">`;
            hourlyData.forEach((val, i) => {
                const height = (val / maxHourly) * 100;
                const isCurrent = new Date().getHours() === i;
                html += `
                    <div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; group;" title="${val} mots à ${i}h">
                        <div style="width: 100%; height: ${height}%; background: ${val > 0 ? 'var(--accent-gold)' : 'rgba(0,0,0,0.05)'}; border-radius: 2px 2px 0 0; min-height: ${val > 0 ? '4px' : '0'}; opacity: ${isCurrent ? '1' : '0.7'}; transition: opacity 0.2s; cursor: pointer;"></div>
                        <div style="font-size: 0.6rem; color: var(--text-muted);">${i%6===0 ? i+'h' : ''}</div>
                    </div>`;
            });
            html += `</div>`;
            hourlyContainer.innerHTML = html;
        }

        // Render Weekday
        const weekdayContainer = document.getElementById('weekdayChartContainer');
        if (weekdayContainer) {
            const maxWeekday = Math.max(...weekdayData, 1);
            const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
            let html = `<div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.5rem; text-align: center;">Mots écrits par jour</div>`;
            html += `<div style="display: flex; align-items: flex-end; gap: 4px; height: 100px; padding: 10px 0; border-bottom: 1px solid var(--border-color);">`;
            weekdayData.forEach((val, i) => {
                const height = (val / maxWeekday) * 100;
                const todayJs = new Date().getDay();
                const todayIndex = (todayJs + 6) % 7;
                const isCurrent = todayIndex === i;
                html += `
                    <div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px;" title="${val} mots le ${days[i]}">
                        <div style="width: 100%; max-width: 20px; height: ${height}%; background: ${val > 0 ? 'var(--accent-gold)' : 'rgba(0,0,0,0.05)'}; border-radius: 2px 2px 0 0; min-height: ${val > 0 ? '4px' : '0'}; opacity: ${isCurrent ? '1' : '0.7'}; transition: opacity 0.2s; cursor: pointer;"></div>
                        <div style="font-size: 0.65rem; color: var(--text-muted); font-weight: ${isCurrent ? 'bold' : 'normal'};">${days[i]}</div>
                    </div>`;
            });
            html += `</div>`;
            weekdayContainer.innerHTML = html;
        }
        
        // Render Yearly Heatmap — avec switch vue mois / vue semaines
        const yearlyContainer = document.getElementById('yearlyChartContainer');
        if (yearlyContainer) {
            const data = StatsViewModel.getYearlyHeatmap();
            const locale = typeof Localization !== 'undefined' && Localization.getLocale() === 'fr' ? 'fr-FR' : 'en-US';
            const CELL = 13;
            const GAP  = 3;
            const todayKey = (() => {
                const t = new Date();
                return `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}`;
            })();
            const today = new Date();

            // Mode persisté
            const heatmapMode = localStorage.getItem('plume_heatmap_mode') || 'month';

            const btnStyle = (active) =>
                `padding: 0.2rem 0.6rem; font-size: 0.7rem; border-radius: 5px; border: 1px solid var(--border-color); cursor: pointer; font-weight: 600; transition: background 0.15s, color 0.15s;
                 background: ${active ? 'var(--accent-gold)' : 'var(--bg-primary)'}; color: ${active ? '#1a1a1a' : 'var(--text-muted)'};`;

            // En-tête avec switch
            let html = `
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:0.75rem;">
                <div style="font-size:0.8rem; color:var(--text-muted); display:flex; align-items:center; gap:0.5rem;">
                    <i data-lucide="calendar-days" style="width:14px;height:14px;"></i>
                    ${Localization.t('stats.heatmap.yearly') || "Activité sur l'année"}
                </div>
                <div style="display:flex; gap:3px; background:var(--bg-primary); padding:2px; border-radius:7px; border:1px solid var(--border-color);">
                    <button id="heatmapBtnMonth" style="${btnStyle(heatmapMode === 'month')}"
                        onclick="localStorage.setItem('plume_heatmap_mode','month'); StatsView.renderHeatmaps();">
                        <i data-lucide="calendar" style="width:10px;height:10px;display:inline-block;vertical-align:middle;margin-right:3px;"></i>${Localization.t('stats.heatmap.monthly')}
                    </button>
                    <button id="heatmapBtnWeek" style="${btnStyle(heatmapMode === 'week')}"
                        onclick="localStorage.setItem('plume_heatmap_mode','week'); StatsView.renderHeatmaps();">
                        <i data-lucide="layout-grid" style="width:10px;height:10px;display:inline-block;vertical-align:middle;margin-right:3px;"></i>${Localization.t('stats.heatmap.weekly')}
                    </button>
                </div>
            </div>`;

            const legend = (labelW) => `
            <div style="display:flex; align-items:center; gap:6px; margin-top:10px; padding-left:${labelW}px;">
                <span style="font-size:0.65rem; color:var(--text-muted);">0</span>
                <div style="width:${CELL}px;height:${CELL}px;border-radius:3px;background:rgba(0,0,0,0.06);flex-shrink:0;"></div>
                <div style="width:${CELL}px;height:${CELL}px;border-radius:3px;background:rgba(212,175,55,0.3);flex-shrink:0;"></div>
                <div style="width:${CELL}px;height:${CELL}px;border-radius:3px;background:rgba(212,175,55,0.6);flex-shrink:0;"></div>
                <div style="width:${CELL}px;height:${CELL}px;border-radius:3px;background:var(--accent-gold);flex-shrink:0;"></div>
                <span style="font-size:0.65rem; color:var(--text-muted);">≥ 1500</span>
            </div>`;

            const cellHtml = (key, words, isFuture) => {
                let color = 'rgba(0,0,0,0.06)';
                if (!isFuture && words > 0)    color = 'rgba(212, 175, 55, 0.3)';
                if (!isFuture && words >= 500)  color = 'rgba(212, 175, 55, 0.6)';
                if (!isFuture && words >= 1500) color = 'var(--accent-gold)';
                if (isFuture) color = 'transparent';
                const outline = key === todayKey ? 'outline:1.5px solid var(--accent-gold);outline-offset:1px;' : '';
                return `<div style="width:${CELL}px;height:${CELL}px;border-radius:3px;background:${color};flex-shrink:0;${outline}" title="${key}: ${words} mots"></div>`;
            };

            // ── VUE PAR MOIS ─────────────────────────────────────────────
            if (heatmapMode === 'month') {
                const MAX_DAYS = 31;
                const LABEL_W = 38;

                const months = [];
                for (let i = 11; i >= 0; i--) {
                    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
                    months.push({ year: d.getFullYear(), month: d.getMonth() });
                }
                const monthNames = months.map(({ year, month }) =>
                    new Date(year, month, 1).toLocaleDateString(locale, { month: 'short' })
                );

                // Ligne de légende jours
                html += `<div style="display:flex; margin-bottom:4px; padding-left:${LABEL_W}px;">`;
                for (let d = 1; d <= MAX_DAYS; d++) {
                    const show = d === 1 || d % 5 === 0 || d === 31;
                    html += `<div style="width:${CELL}px; margin-right:${GAP}px; font-size:0.55rem; color:var(--text-muted); text-align:center; flex-shrink:0;">${show ? d : ''}</div>`;
                }
                html += `</div>`;

                months.forEach(({ year, month }, idx) => {
                    const daysInMonth = new Date(year, month + 1, 0).getDate();
                    html += `<div style="display:flex; align-items:center; margin-bottom:${GAP}px;">`;
                    html += `<div style="width:${LABEL_W}px; font-size:0.65rem; color:var(--text-muted); flex-shrink:0; padding-right:6px; text-align:right; font-weight:600; text-transform:uppercase; letter-spacing:0.03em;">${monthNames[idx]}</div>`;
                    for (let day = 1; day <= MAX_DAYS; day++) {
                        if (day <= daysInMonth) {
                            const key = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
                            html += cellHtml(key, data[key] || 0, new Date(year, month, day) > today);
                            html += `<div style="width:${GAP}px;flex-shrink:0;"></div>`;
                        } else {
                            html += `<div style="width:${CELL + GAP}px; height:${CELL}px; flex-shrink:0;"></div>`;
                        }
                    }
                    html += `</div>`;
                });
                html += legend(LABEL_W);

            // ── VUE PAR SEMAINES (style GitHub) ──────────────────────────
            } else {
                const LABEL_W = 0; // pas de label à gauche ici, les labels sont en haut
                // Remonter à 1 an en arrière, aligné sur lundi
                const oneYearAgo = new Date(today);
                oneYearAgo.setFullYear(today.getFullYear() - 1);
                let start = new Date(oneYearAgo);
                while (start.getDay() !== 1) start.setDate(start.getDate() - 1);

                // Construire les semaines
                let current = new Date(start);
                const weeks = [];
                let currentWeek = [];
                while (current <= today) {
                    const key = `${current.getFullYear()}-${String(current.getMonth()+1).padStart(2,'0')}-${String(current.getDate()).padStart(2,'0')}`;
                    currentWeek.push({ date: new Date(current), key, words: data[key] || 0 });
                    if (currentWeek.length === 7) { weeks.push(currentWeek); currentWeek = []; }
                    current.setDate(current.getDate() + 1);
                }
                if (currentWeek.length > 0) weeks.push(currentWeek);

                // Label de semaine = date du lundi abrégée (ex: "3 fév")
                // Chaque colonne : wrapper position:relative, label pivoté depuis bas-gauche
                const LABEL_H = 32; // hauteur réservée pour le label en haut
                html += `<div style="display:flex; gap:${GAP}px; overflow-x:auto; padding-bottom:6px;">`;
                weeks.forEach(week => {
                    const monday = week[0].date;
                    const label = monday.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
                    html += `<div style="display:flex; flex-direction:column; gap:${GAP}px; flex-shrink:0; width:${CELL}px;">`;
                    // Zone label : position relative, texte absolu centré et pivoté
                    html += `<div style="position:relative; width:${CELL}px; height:${LABEL_H}px; flex-shrink:0; overflow:visible;">`;
                    html += `<span style="position:absolute; bottom:6px; left:50%; font-size:0.55rem; color:var(--text-muted); white-space:nowrap; transform:translate(-50%, 0) rotate(-45deg); transform-origin:bottom center; line-height:1;">${label}</span>`;
                    html += `</div>`;
                    // 7 cellules
                    week.forEach(day => {
                        const isFuture = day.date > today;
                        html += cellHtml(day.key, day.words, isFuture);
                    });
                    html += `</div>`;
                });
                html += `</div>`;
                html += legend(0);
            }

            yearlyContainer.innerHTML = html;
            if (typeof lucide !== 'undefined') lucide.createIcons({ node: yearlyContainer });
        }
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
