/**
 * @file mobile-swipe.main.js
 * @description Point d'entrée du module Mobile Swipe.
 */

window.MobileSwipeMain = {
    /**
     * Initialisation du module.
     */
    init: function () {
        MobileSwipeView.init();
        console.log('Mobile Swipe module initialized (MVVM)');
    }
};

// Initialisation dès que le DOM est prêt
document.addEventListener('DOMContentLoaded', () => {
    MobileSwipeMain.init();
});
