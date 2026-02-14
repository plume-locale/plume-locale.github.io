/**
 * @file mobile-swipe.handlers.js
 * @description Centralise les gestionnaires d'événements pour le module mobile-swipe.
 */

window.MobileSwipeHandlers = {
    /**
     * Gère l'événement start de toucher.
     * @param {TouchEvent} e 
     */
    handleTouchStart: function (e) {
        if (e.changedTouches && e.changedTouches.length > 0) {
            const touch = e.changedTouches[0];
            MobileSwipeViewModel.initiateTouch(touch.clientX, touch.clientY);
        }
    },

    /**
     * Gère l'événement end de toucher.
     * @param {TouchEvent} e 
     */
    handleTouchEnd: function (e) {
        if (e.changedTouches && e.changedTouches.length > 0) {
            const touch = e.changedTouches[0];
            MobileSwipeViewModel.completeTouch(touch.clientX, touch.clientY);
        }
    }
};
