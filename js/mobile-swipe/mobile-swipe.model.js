/**
 * @file mobile-swipe.model.js
 * @description Modèle pour les données de balayage (swipe) mobile.
 * Définit les seuils et stocke les coordonnées temporaires du toucher.
 */

window.MobileSwipeModel = {
    /**
     * Coordonnées de départ du toucher.
     * @type {{x: number, y: number}}
     */
    startX: 0,
    startY: 0,

    /**
     * Coordonnées de fin du toucher.
     * @type {{x: number, y: number}}
     */
    endX: 0,
    endY: 0,

    /**
     * Configuration des seuils de balayage.
     * @type {Object}
     */
    config: {
        edgeThreshold: 50,    // Zone depuis le bord gauche (en pixels)
        swipeThreshold: 50,   // Distance minimale de balayage pour être pris en compte
        verticalTolerance: 1.0 // Ratio de tolérance horizontal vs vertical (plus d'un = plus strict sur l'horizontalité)
    }
};
