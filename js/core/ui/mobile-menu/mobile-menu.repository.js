/**
 * @file mobile-menu.repository.js
 * @description Repository pour stocker et gérer l'état du menu mobile.
 * Agit comme une source de vérité unique pour l'état UI.
 */

const MobileMenuRepository = {
    _state: { ...MobileMenuModel.DEFAULT_STATE },

    /**
     * Récupère l'état complet.
     * @returns {Object} L'état actuel.
     */
    getState: function () {
        return { ...this._state };
    },

    /**
     * Met à jour une partie de l'état.
     * @param {Object} updates - Les propriétés à mettre à jour.
     */
    updateState: function (updates) {
        this._state = { ...this._state, ...updates };
        // Log pour le débug
        // console.log('MobileMenu State Updated:', this._state);
    },

    /**
     * Réinitialise l'état (sauf peut-être le mode mobile détecté ?).
     * Pour l'instant on réinitialise tout aux valeurs par défaut.
     */
    resetState: function () {
        this._state = { ...MobileMenuModel.DEFAULT_STATE };
    }
};
