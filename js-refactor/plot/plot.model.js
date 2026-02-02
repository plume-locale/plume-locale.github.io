/**
 * Modèle de données pour le module Plot (Intrigue)
 * Gère la structure des points d'intrigue et le calcul de la tension.
 */
class PlotPoint {
    constructor(data) {
        this.position = data.position || 0;
        this.intensity = data.intensity || 0;
        this.title = data.title || '';
        this.actId = data.actId;
        this.chapterId = data.chapterId;
        this.sceneId = data.sceneId;
        this.description = data.description || '';
        this.wordCount = data.wordCount || 0;
    }
}

class PlotModel {
    /**
     * Calcule le score de tension d'une scène.
     * @param {Object} scene - L'objet scène
     * @param {Object} context - Informations contextuelles (indices, totaux)
     * @returns {number} Score de tension (0-100)
     */
    static calculateSceneTension(scene, context) {
        // Validation des paramètres
        if (!scene) return 0;

        // Utilisation de calculateLiveTension si disponible (analyseur sémantique)
        if (typeof calculateLiveTension === 'function' && context.act && context.chapter) {
            const analysisContext = {
                actId: context.act.id,
                chapterId: context.chapter.id,
                sceneId: scene.id
            };
            const result = calculateLiveTension(scene.content || '', analysisContext);
            return result.score;
        }

        // Fallback: Algorithme simplifié
        let tension = 25;
        const content = (scene.content || '').toLowerCase();
        const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;

        // Bonification pour les scènes courtes (souvent plus intenses)
        if (wordCount < 500 && wordCount > 50) tension += 10;

        // Ce fallback est basique, l'analyseur sémantique est préférable
        return Math.min(100, Math.max(0, tension));
    }
}
