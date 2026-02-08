/*
 * REVISION MODULE - MODEL
 * Defines the data structure for annotations.
 */

const RevisionModel = {
    /**
     * Creates a new annotation object.
     */
    createAnnotation({ type, text, context, id = Date.now() }) {
        return {
            id,
            type, // 'comment', 'question', 'todo', 'note'
            text,
            context: context || '',
            completed: false,
            createdAt: new Date().toISOString()
        };
    },

    /**
     * Returns the human-readable label for an annotation type.
     */
    getAnnotationTypeLabel(type) {
        const labels = {
            comment: Localization.t('revision.type.comment'),
            todo: Localization.t('revision.type.todo'),
            note: Localization.t('revision.type.note'),
            question: Localization.t('revision.type.question')
        };
        return labels[type] || type;
    }
};
