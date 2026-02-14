/**
 * @file mobile-swipe.repository.js
 * @description Repository pour la gestion de l'état des balayages mobiles.
 * Centralise les mises à jour du modèle.
 */

window.MobileSwipeRepository = {
    /**
     * Met à jour les coordonnées de début.
     * @param {number} x 
     * @param {number} y 
     */
    setStart: function (x, y) {
        MobileSwipeModel.startX = x;
        MobileSwipeModel.startY = y;
    },

    /**
     * Met à jour les coordonnées de fin.
     * @param {number} x 
     * @param {number} y 
     */
    setEnd: function (x, y) {
        MobileSwipeModel.endX = x;
        MobileSwipeModel.endY = y;
    },

    /**
     * Récupère les données actuelles de balayage.
     * @returns {Object} Un objet contenant les coordonnées et la configuration.
     */
    getSwipeData: function () {
        return {
            startX: MobileSwipeModel.startX,
            startY: MobileSwipeModel.startY,
            endX: MobileSwipeModel.endX,
            endY: MobileSwipeModel.endY,
            config: { ...MobileSwipeModel.config }
        };
    },

    /**
     * Retourne la liste des gestes disponibles pour affichage dans l'aide.
     * @returns {Array} Liste des objets de geste.
     */
    getAvailableGestures: function () {
        return [
            {
                id: 'open-sidebar',
                name: Localization.t('mobile.swipe.gesture.open_sidebar.name'),
                description: Localization.t('mobile.swipe.gesture.open_sidebar.desc'),
                icon: 'arrow-right-to-line'
            },
            {
                id: 'close-sidebar',
                name: Localization.t('mobile.swipe.gesture.close_sidebar.name'),
                description: Localization.t('mobile.swipe.gesture.close_sidebar.desc'),
                icon: 'arrow-left-to-line'
            }
        ];
    }
};
