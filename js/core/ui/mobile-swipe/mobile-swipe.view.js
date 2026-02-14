/**
 * @file mobile-swipe.view.js
 * @description Vue pour écouter les événements tactiles sur le document.
 */

window.MobileSwipeView = {
    /**
     * Initialise les écouteurs d'événements.
     */
    init: function () {
        this.bindEvents();
    },

    /**
     * Attache les gestionnaires d'événements tactiles.
     */
    bindEvents: function () {
        // Utilisation de { passive: true } pour améliorer les performances de défilement
        document.addEventListener('touchstart', MobileSwipeHandlers.handleTouchStart, { passive: true });
        document.addEventListener('touchend', MobileSwipeHandlers.handleTouchEnd, { passive: true });
    }
};
