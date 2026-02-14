
/**
 * Focus Mode Handlers
 */
const FocusModeHandlers = {
    onToggleFocusMode() {
        FocusModeViewModel.toggleFocusMode();
    },

    onToggleFocusPanel() {
        FocusModeViewModel.toggleFocusPanel();
    },

    onToggleToolbar() {
        FocusModeViewModel.toggleToolbar();
    },

    onToggleLinksPanelVisibility() {
        FocusModeViewModel.toggleLinksPanelVisibility();
    },

    onStartPomodoro() {
        FocusModeViewModel.startPomodoro();
    },

    onPausePomodoro() {
        FocusModeViewModel.pausePomodoro();
    },

    onResetPomodoro() {
        FocusModeViewModel.resetPomodoro();
    },

    onTogglePomodoroPopup() {
        const popup = document.getElementById('pomodoroPopup');
        if (popup) popup.classList.toggle('active');
    },

    onGlobalClick(event) {
        const popup = document.getElementById('pomodoroPopup');
        const btn = document.getElementById('pomodoroHeaderBtn');
        if (popup && btn && !popup.contains(event.target) && !btn.contains(event.target)) {
            popup.classList.remove('active');
        }
    }
};

// Initialize global event listeners
document.addEventListener('click', FocusModeHandlers.onGlobalClick);
