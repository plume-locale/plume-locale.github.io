/**
 * [MVVM : Repository]
 * Gère l'accès aux données de la palette et de la configuration UI (localStorage)
 */
const ColorPaletteRepository = {
    /**
     * Retourne la liste des couleurs
     * @returns {string[]}
     */
    getColors: () => {
        return ColorPaletteModel.colors;
    },

    /**
     * Sauvegarde la largeur de la sidebar dans le stockage local
     * @param {number} width 
     */
    saveSidebarWidth: (width) => {
        localStorage.setItem('sidebarWidth', width);
    },

    /**
     * Récupère la largeur de la sidebar depuis le stockage local
     * @returns {string|null}
     */
    getSidebarWidth: () => {
        return localStorage.getItem('sidebarWidth');
    }
};
