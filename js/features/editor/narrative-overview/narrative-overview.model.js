/**
 * [MVVM : Model]
 * Narrative Overview - Data structures and passage types
 *
 * Définit les structures de données pour l'aperçu narratif chronologique.
 * Un "passage" peut être :
 * - REGULAR : texte sans bloc de structure (paragraphes consécutifs)
 * - STRUCTURE_BLOCK : bloc avec structure (BEAT, CLIMAX, etc.)
 */

const NarrativeOverviewModel = {
    /**
     * Types de passages
     */
    PASSAGE_TYPES: {
        REGULAR: 'regular',              // Passage sans couche structurelle
        STRUCTURE_BLOCK: 'structure_block'  // Bloc avec structure (BEAT, CLIMAX, etc.)
    },

    /**
     * Crée un objet passage avec toutes les métadonnées nécessaires
     *
     * @param {string} type - Type de passage (REGULAR ou STRUCTURE_BLOCK)
     * @param {Object} data - Données du passage
     * @returns {Object} Objet passage formaté
     */
    createPassage(type, data) {
        return {
            id: `passage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: type,

            // Contexte hiérarchique
            actId: data.actId,
            actTitle: data.actTitle,
            chapterId: data.chapterId,
            chapterTitle: data.chapterTitle,
            sceneId: data.sceneId,
            sceneTitle: data.sceneTitle,

            // Contenu
            content: data.content || '',        // Aperçu du texte (premiers 80 caractères)
            fullContent: data.fullContent || data.content || '', // Contenu complet pour recherche

            // Métadonnées spécifiques aux structure blocks
            label: data.label || null,          // Label (BEAT, CLIMAX, etc.)
            color: data.color || null,          // Couleur du bloc

            // Position et métriques
            position: data.position || 0,       // Position dans le document
            wordCount: data.wordCount || 0,

            // Timestamp pour tri
            timestamp: Date.now()
        };
    },

    /**
     * Valide qu'un objet est un passage valide
     *
     * @param {Object} passage - Objet à valider
     * @returns {boolean} True si valide
     */
    isValidPassage(passage) {
        if (!passage || typeof passage !== 'object') return false;

        // Vérifications minimales
        return passage.id &&
               passage.type &&
               (passage.type === this.PASSAGE_TYPES.REGULAR ||
                passage.type === this.PASSAGE_TYPES.STRUCTURE_BLOCK) &&
               passage.actId !== undefined &&
               passage.chapterId !== undefined &&
               passage.sceneId !== undefined;
    },

    /**
     * Compare deux passages pour tri chronologique
     *
     * @param {Object} a - Premier passage
     * @param {Object} b - Second passage
     * @returns {number} Résultat de comparaison
     */
    comparePassages(a, b) {
        // Tri par position
        return a.position - b.position;
    }
};
