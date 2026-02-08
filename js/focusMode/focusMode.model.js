
/**
 * Focus Mode Model
 */
const FocusModeModel = {
    state: {
        focusModeActive: false,
        focusPanelOpen: false,
        focusStartWordCount: 0,
        linksPanelVisible: true,
        projectWordGoal: 50000,
        hideToolbar: false
    },

    pomodoro: {
        time: 25 * 60, // 25 minutes in seconds
        interval: null,
        isRunning: false,
        completedCount: 0
    }
};
