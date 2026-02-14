
/**
 * Focus Mode Repository
 */
const FocusModeRepository = {
    getSettings() {
        const settings = localStorage.getItem('plume_focus_settings');
        return settings ? JSON.parse(settings) : null;
    },

    saveSettings(settings) {
        localStorage.setItem('plume_focus_settings', JSON.stringify(settings));
    },

    getPomodoroCount() {
        return parseInt(localStorage.getItem('plume_pomodoro_count') || '0', 10);
    },

    savePomodoroCount(count) {
        localStorage.setItem('plume_pomodoro_count', count.toString());
    }
};
