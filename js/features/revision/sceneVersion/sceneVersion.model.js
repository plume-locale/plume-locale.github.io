/*
 * SCENE VERSION MODULE - MODEL
 * Defines the data structure for a scene version.
 */

const SceneVersionModel = {
    create(content, annotations = []) {
        return {
            id: Date.now(),
            number: 0, // Will be set by manager
            label: '',
            content: content || '',
            wordCount: 0, // Will be set by manager
            createdAt: new Date().toISOString(),
            isActive: false,
            isFinal: false,
            annotations: annotations.map(a => ({ ...a }))
        };
    }
};
