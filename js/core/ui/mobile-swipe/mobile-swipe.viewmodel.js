/**
 * @file mobile-swipe.viewmodel.js
 * @description ViewModel pour orchestrer la logique des gestes de balayage.
 * Calcule la direction et déclenche les actions appropriées (CRUD: Read/Update de l'état UI).
 */

window.MobileSwipeViewModel = {
    /**
     * Enregistre le début du toucher.
     * @param {number} x 
     * @param {number} y 
     */
    initiateTouch: function (x, y) {
        MobileSwipeRepository.setStart(x, y);
    },

    /**
     * Enregistre la fin du toucher et évalue le geste.
     * @param {number} x 
     * @param {number} y 
     */
    completeTouch: function (x, y) {
        MobileSwipeRepository.setEnd(x, y);
        this.processSwipe();
    },

    /**
     * Analyse le geste effectué.
     */
    processSwipe: function () {
        const data = MobileSwipeRepository.getSwipeData();
        const diffX = data.endX - data.startX;
        const diffY = data.endY - data.startY;

        // On vérifie si le mouvement est majoritairement horizontal
        if (Math.abs(diffX) > Math.abs(diffY)) {
            // Swipe vers la DROITE (diffX positif) depuis le bord gauche
            if (data.startX < data.config.edgeThreshold && diffX > data.config.swipeThreshold) {
                this.handleLeftToRightSwipe();
            }
            // Swipe vers la GAUCHE (diffX négatif)
            else if (diffX < -data.config.swipeThreshold) {
                this.handleRightToLeftSwipe();
            }
        }
    },

    /**
     * Gère un balayage de gauche à droite (ouverture potentielle).
     */
    handleLeftToRightSwipe: function () {
        const sidebarColumn = document.getElementById('sidebarColumn');
        if (sidebarColumn && !sidebarColumn.classList.contains('mobile-visible')) {
            this.toggleSidebar();
        }
    },

    /**
     * Gère un balayage de droite à gauche (fermeture potentielle).
     */
    handleRightToLeftSwipe: function () {
        const sidebarColumn = document.getElementById('sidebarColumn');
        if (sidebarColumn && sidebarColumn.classList.contains('mobile-visible')) {
            this.toggleSidebar();
        }
    },

    /**
     * Appelle l'action globale de bascule de la barre latérale.
     */
    toggleSidebar: function () {
        if (typeof window.toggleMobileSidebar === 'function') {
            window.toggleMobileSidebar();
        } else {
            console.warn('toggleMobileSidebar non défini');
        }
    }
};
