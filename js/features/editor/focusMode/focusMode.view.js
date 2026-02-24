
/**
 * Focus Mode View
 */
const FocusModeView = {
    renderFocusMode(isActive) {
        const appContainer = document.querySelector('.app-container');
        const sidebar = document.querySelector('.sidebar');
        const activityBar = document.querySelector('.activity-bar');
        const sidebarColumn = document.querySelector('.sidebar-column');
        const toolsSidebar = document.getElementById('toolsSidebar');

        if (isActive) {
            if (appContainer) appContainer.classList.add('focus-mode');
            if (sidebar) sidebar.style.display = 'none';
            if (activityBar) activityBar.style.display = 'none';
            if (sidebarColumn) sidebarColumn.style.display = 'none';
            if (toolsSidebar) {
                toolsSidebar.style.display = 'flex';
                toolsSidebar.style.zIndex = '105';
            }

            this.setPanelsFocusStyle(true);

            // Fullscreen
            if (appContainer && appContainer.requestFullscreen) {
                appContainer.requestFullscreen().catch((err) => {
                    console.log('Fullscreen not available or denied:', err);
                });
            }
        } else {
            if (appContainer) appContainer.classList.remove('focus-mode');

            if (sidebar) sidebar.style.cssText = '';
            if (activityBar) activityBar.style.cssText = '';

            if (sidebarColumn) {
                sidebarColumn.style.cssText = '';
                // Restore saved width if available
                if (typeof ColorPaletteViewModel !== 'undefined' && typeof ColorPaletteViewModel.getSavedSidebarWidth === 'function') {
                    const savedWidth = ColorPaletteViewModel.getSavedSidebarWidth();
                    if (savedWidth && savedWidth >= 200) {
                        sidebarColumn.style.width = savedWidth + 'px';
                        if (appContainer && getComputedStyle(appContainer).display === 'grid') {
                            appContainer.style.gridTemplateColumns = `${savedWidth}px 1fr`;
                        }
                    }
                }
            }

            if (toolsSidebar) toolsSidebar.style.cssText = '';

            this.setPanelsFocusStyle(false);

            // Exit fullscreen
            if (document.exitFullscreen && document.fullscreenElement) {
                document.exitFullscreen();
            }
        }
    },

    setPanelsFocusStyle(isFocus) {
        const panels = [
            'sidebarVersions',
            'annotationsPanel',
            'todosPanel',
            'linksPanel',
            'arcScenePanel',
            'sidebarPlot'
        ];

        panels.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                if (isFocus) {
                    el.style.zIndex = '110';
                    el.style.position = 'relative';
                } else {
                    el.style.zIndex = '';
                    el.style.position = '';
                }
            }
        });
    },

    renderFocusPanel(isOpen) {
        const panel = document.getElementById('focusPanel');
        if (panel) {
            if (isOpen) panel.classList.add('active');
            else panel.classList.remove('active');
        }
    },

    renderToolbar(isHidden) {
        const toolbar = document.getElementById('editorToolbar');
        if (toolbar) {
            toolbar.style.display = isHidden ? 'none' : 'flex';
        }
    },

    renderLinksPanel(isVisible) {
        const linksPanel = document.getElementById('linksPanel');
        const toolBtn = document.getElementById('toolLinksPanelBtn');
        const checkbox = document.getElementById('hideLinksPanel');

        if (!linksPanel) return;

        if (isVisible) {
            if (typeof renderLinksPanelSidebar === 'function') {
                renderLinksPanelSidebar();
            }
            linksPanel.classList.remove('hidden');
            if (toolBtn) toolBtn.classList.add('active');
            if (checkbox) checkbox.checked = false;
        } else {
            linksPanel.classList.add('hidden');
            if (toolBtn) toolBtn.classList.remove('active');
            if (checkbox) checkbox.checked = true;
        }
    },

    renderWritingProgress(data) {
        const progressFill = document.getElementById('writingProgressFill');
        if (progressFill) {
            progressFill.style.width = data.progressPercent + '%';
        }

        if (positionIndicator) {
            positionIndicator.textContent = Localization.t('focus.stats.position_indicator', [
                data.currentWords.toLocaleString(),
                data.totalProjectWords.toLocaleString(),
                data.projectWordGoal.toLocaleString()
            ]);
        }
    },

    renderFocusStats(wordsWritten) {
        const el = document.getElementById('focusWordCount');
        if (el) el.textContent = wordsWritten;
    },

    updateTensionMeter(isFocus) {
        const tensionMeter = document.getElementById('liveTensionMeter');
        if (tensionMeter) {
            if (isFocus) tensionMeter.classList.add('focus-hide');
            else tensionMeter.classList.remove('focus-hide');
        }
    },

    renderPomodoroTime(timeInSeconds) {
        const minutes = Math.floor(timeInSeconds / 60);
        const seconds = timeInSeconds % 60;
        const display = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        const els = document.querySelectorAll('#pomodoroDisplay');
        els.forEach(el => el.textContent = display);
    },

    renderPomodoroActive(isActive) {
        const headerBtn = document.getElementById('pomodoroHeaderBtn');
        if (headerBtn) {
            if (isActive) headerBtn.classList.add('pomodoro-active');
            else headerBtn.classList.remove('pomodoro-active');
        }
    },

    renderPomodoroCompleted(count) {
        const els = document.querySelectorAll('#pomodorosCompleted');
        els.forEach(el => el.textContent = count);
    }
};
