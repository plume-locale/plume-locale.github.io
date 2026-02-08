/**
 * Todo Model
 * Représente la structure d'un TODO et ses opérations de base
 */

const TodoModel = {
    /**
     * Crée un objet Todo formaté pour l'UI à partir d'une annotation
     * @param {Object} annotation - L'annotation brute
     * @param {Object} context - Contexte (act, chapter, scene)
     * @returns {Object} Todo formaté
     */
    create: (annotation, context) => {
        return {
            id: annotation.id,
            text: annotation.text,
            completed: !!annotation.completed,
            type: annotation.type || 'todo',
            timestamp: annotation.timestamp || Date.now(),
            author: annotation.author || 'Moi',
            // Context navigation
            actId: context.actId,
            actTitle: context.actTitle,
            chapterId: context.chapterId,
            chapterTitle: context.chapterTitle,
            sceneId: context.sceneId,
            sceneTitle: context.sceneTitle
        };
    }
};
