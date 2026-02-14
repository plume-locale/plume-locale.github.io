
/**
 * Focus Mode ViewModel
 */
const FocusModeViewModel = {
    toggleFocusMode() {
        FocusModeModel.state.focusModeActive = !FocusModeModel.state.focusModeActive;

        if (FocusModeModel.state.focusModeActive) {
            // Track starting word count
            if (typeof currentSceneId !== 'undefined' && currentSceneId) {
                const scene = this.getCurrentScene();
                if (scene) {
                    FocusModeModel.state.focusStartWordCount = getWordCount(scene.content || '');
                }
            }
            this.updateWritingProgress();
        } else {
            FocusModeModel.state.focusPanelOpen = false;
        }

        FocusModeView.renderFocusMode(FocusModeModel.state.focusModeActive);
        if (!FocusModeModel.state.focusModeActive) {
            FocusModeView.renderFocusPanel(false);
        }

        // Tension Meter
        FocusModeView.updateTensionMeter(FocusModeModel.state.focusModeActive);
    },

    toggleFocusPanel() {
        FocusModeModel.state.focusPanelOpen = !FocusModeModel.state.focusPanelOpen;
        FocusModeView.renderFocusPanel(FocusModeModel.state.focusPanelOpen);
    },

    toggleToolbar() {
        const hideToolbarCheckbox = document.getElementById('hideToolbar');
        FocusModeModel.state.hideToolbar = hideToolbarCheckbox ? hideToolbarCheckbox.checked : false;
        FocusModeView.renderToolbar(FocusModeModel.state.hideToolbar);
    },

    toggleLinksPanelVisibility() {
        const linksPanel = document.getElementById('linksPanel');
        if (!linksPanel) return;

        const isCurrentlyHidden = linksPanel.classList.contains('hidden');
        FocusModeModel.state.linksPanelVisible = isCurrentlyHidden; // Toggle logic based on current class

        FocusModeView.renderLinksPanel(FocusModeModel.state.linksPanelVisible);
    },

    updateWritingProgress() {
        if (typeof currentSceneId === 'undefined' || !currentSceneId) return;

        const scene = this.getCurrentScene();
        if (!scene) return;

        const currentWords = getWordCount(scene.content || '');

        // Calculer le total de mots du projet
        const totalProjectWords = project.acts.reduce((sum, a) =>
            sum + a.chapters.reduce((s, ch) =>
                s + ch.scenes.reduce((sc, scene) => sc + (scene.wordCount || 0), 0), 0), 0);

        const progressPercent = Math.min((totalProjectWords / FocusModeModel.state.projectWordGoal) * 100, 100);

        FocusModeView.renderWritingProgress({
            progressPercent,
            currentWords,
            totalProjectWords,
            projectWordGoal: FocusModeModel.state.projectWordGoal
        });
    },

    updateFocusStats() {
        if (!FocusModeModel.state.focusModeActive || (typeof currentSceneId === 'undefined' || !currentSceneId)) return;

        const scene = this.getCurrentScene();
        if (!scene) return;

        const currentWordCount = getWordCount(scene.content || '');
        const wordsWritten = Math.max(0, currentWordCount - FocusModeModel.state.focusStartWordCount);

        FocusModeView.renderFocusStats(wordsWritten);
    },

    // Pomodoro logic
    startPomodoro() {
        if (FocusModeModel.pomodoro.isRunning) return;

        FocusModeModel.pomodoro.isRunning = true;
        FocusModeView.renderPomodoroActive(true);

        FocusModeModel.pomodoro.interval = setInterval(() => {
            if (FocusModeModel.pomodoro.time > 0) {
                FocusModeModel.pomodoro.time--;
                FocusModeView.renderPomodoroTime(FocusModeModel.pomodoro.time);
            } else {
                this.completedPomodoro();
            }
        }, 1000);
    },

    pausePomodoro() {
        FocusModeModel.pomodoro.isRunning = false;
        FocusModeView.renderPomodoroActive(false);

        if (FocusModeModel.pomodoro.interval) {
            clearInterval(FocusModeModel.pomodoro.interval);
            FocusModeModel.pomodoro.interval = null;
        }
    },

    resetPomodoro() {
        this.pausePomodoro();
        FocusModeModel.pomodoro.time = 25 * 60;
        FocusModeView.renderPomodoroTime(FocusModeModel.pomodoro.time);
    },

    completedPomodoro() {
        this.pausePomodoro();
        FocusModeModel.pomodoro.completedCount++;
        FocusModeView.renderPomodoroCompleted(FocusModeModel.pomodoro.completedCount);

        // Play notification sound
        this.playNotificationSound();

        // Alert user
        alert(Localization.t('focus.pomodoro.completed_alert'));

        // Reset for next session
        FocusModeModel.pomodoro.time = 25 * 60;
        FocusModeView.renderPomodoroTime(FocusModeModel.pomodoro.time);
    },

    playNotificationSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 800;
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (e) {
            console.warn('Audio feedback failed:', e);
        }
    },

    // Helpers
    getCurrentScene() {
        if (typeof project === 'undefined' || !project) return null;
        const act = project.acts.find(a => a.id === currentActId);
        if (!act) return null;
        const chapter = act.chapters.find(c => c.id === currentChapterId);
        if (!chapter) return null;
        return chapter.scenes.find(s => s.id === currentSceneId);
    }
};
