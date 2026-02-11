/**
 * [MVVM : Repository]
 * Gère la persistance des réglages de l'interface.
 */
const InterfaceCustomizerRepository = {
    _STORAGE_KEY: 'plume_interface_prefs',

    /**
     * Charge les réglages depuis localStorage
     */
    loadSettings: () => {
        try {
            const stored = localStorage.getItem(InterfaceCustomizerRepository._STORAGE_KEY);
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (e) {
            console.error('Error loading interface settings:', e);
        }
        return InterfaceCustomizerModel.getDefaultSettings();
    },

    /**
     * Sauvegarde les réglages dans localStorage
     */
    saveSettings: (settings) => {
        try {
            localStorage.setItem(InterfaceCustomizerRepository._STORAGE_KEY, JSON.stringify(settings));
        } catch (e) {
            console.error('Error saving interface settings:', e);
        }
    }
};
