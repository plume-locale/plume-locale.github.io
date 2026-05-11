/**
 * Model for the Reserve feature
 */
const ReserveModel = {
    /**
     * Creates a new Reserve item
     * @param {string} content - The text to save
     * @param {string} projectId - Current project ID
     * @param {string} sourceSceneId - Origin scene ID
     * @returns {Object}
     */
    create(content, projectId, sourceSceneId = null, sourceSceneTitle = null, sourceChapterTitle = null) {
        return {
            id: 'res_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
            projectId: projectId,
            content: content,
            title: '',
            comment: '',
            tags: [],
            sourceSceneId: sourceSceneId,
            sourceSceneTitle: sourceSceneTitle,
            sourceChapterTitle: sourceChapterTitle,
            createdAt: Date.now(),
            wordCount: this._calculateWordCount(content),
            pinned: false
        };
    },

    _calculateWordCount(text) {
        if (!text) return 0;
        return text.trim().split(/\s+/).length;
    }
};

window.ReserveModel = ReserveModel;
