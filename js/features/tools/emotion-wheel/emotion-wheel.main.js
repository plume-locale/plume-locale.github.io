/**
 * [MVVM : EmotionWheel Main]
 * Point d'entrée du module de la roue des émotions.
 */

(function () {
    // Exposition des fonctions globales
    window.openEmotionWheel = () => EmotionWheelView.open();
    window.closeEmotionWheel = () => EmotionWheelView.close();

    console.log('[Emotion-Wheel] Module initialisé');
})();
