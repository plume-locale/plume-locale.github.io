
/**
 * Focus Mode Main
 */

// Global exports for compatibility
window.toggleFocusMode = () => FocusModeHandlers.onToggleFocusMode();
window.toggleFocusPanel = () => FocusModeHandlers.onToggleFocusPanel();
window.toggleToolbar = () => FocusModeHandlers.onToggleToolbar();
window.toggleLinksPanelVisibility = () => FocusModeHandlers.onToggleLinksPanelVisibility();
window.startPomodoro = () => FocusModeHandlers.onStartPomodoro();
window.pausePomodoro = () => FocusModeHandlers.onPausePomodoro();
window.resetPomodoro = () => FocusModeHandlers.onResetPomodoro();
window.togglePomodoroPopup = () => FocusModeHandlers.onTogglePomodoroPopup();
window.updateWritingProgress = () => FocusModeViewModel.updateWritingProgress();

// Handle focusModeActive for keyboardShortcuts
Object.defineProperty(window, 'focusModeActive', {
    get: () => FocusModeModel.state.focusModeActive,
    set: (val) => { FocusModeModel.state.focusModeActive = val; }
});
Object.defineProperty(window, 'focusPanelOpen', {
    get: () => FocusModeModel.state.focusPanelOpen,
    set: (val) => { FocusModeModel.state.focusPanelOpen = val; }
});

// Decorate updateSceneContent
(function () {
    const originalUpdateSceneContent = window.updateSceneContent;
    window.updateSceneContent = function () {
        if (typeof originalUpdateSceneContent === 'function') {
            originalUpdateSceneContent();
        }
        FocusModeViewModel.updateFocusStats();
    };
})();

// Initial state update if needed
document.addEventListener('DOMContentLoaded', () => {
    FocusModeViewModel.updateWritingProgress();
});
