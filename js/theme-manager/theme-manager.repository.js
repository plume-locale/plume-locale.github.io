/**
 * [MVVM : Repository]
 * Gère la persistance des thèmes (LocalStorage).
 */
const ThemeManagerRepository = {
    KEYS: {
        CURRENT_THEME: 'plume_locale-current-theme',
        CUSTOM_THEMES: 'plume_locale-custom-themes'
    },

    /**
     * Charge le thème actuel
     */
    getCurrentTheme: () => {
        const saved = localStorage.getItem(ThemeManagerRepository.KEYS.CURRENT_THEME);
        try {
            return saved ? JSON.parse(saved) : null;
        } catch (e) {
            console.error('Erreur chargement thème actuel', e);
            return null;
        }
    },

    /**
     * Sauvegarde le thème actuel
     */
    saveCurrentTheme: (colors) => {
        localStorage.setItem(ThemeManagerRepository.KEYS.CURRENT_THEME, JSON.stringify(colors));
    },

    /**
     * Charge les thèmes personnalisés
     */
    getCustomThemes: () => {
        const saved = localStorage.getItem(ThemeManagerRepository.KEYS.CUSTOM_THEMES);
        try {
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error('Erreur chargement thèmes personnalisés', e);
            return [];
        }
    },

    /**
     * Sauvegarde la liste des thèmes personnalisés
     */
    saveCustomThemes: (themes) => {
        localStorage.setItem(ThemeManagerRepository.KEYS.CUSTOM_THEMES, JSON.stringify(themes));
    }
};
