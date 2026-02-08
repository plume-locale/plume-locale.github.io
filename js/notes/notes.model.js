/**
 * Notes Model
 */
class NotesModel {
    /**
     * Creates a new Note object
     * @param {Object} data 
     * @returns {Object}
     */
    static create(data) {
        return {
            id: data.id || Date.now(),
            title: data.title || '',
            category: data.category || 'Autre',
            tags: Array.isArray(data.tags) ? data.tags : (data.tags ? data.tags.split(',').map(t => t.trim()).filter(t => t) : []),
            content: data.content || '',
            medias: data.medias || [],
            createdAt: data.createdAt || new Date().toISOString(),
            updatedAt: data.updatedAt || new Date().toISOString()
        };
    }

    /**
     * Creates a new Media object
     * @param {Object} data
     * @returns {Object}
     */
    static createMedia(data) {
        return {
            type: data.type || 'url', // 'url'|'image'|'audio'|'youtube'
            title: data.title || '',
            url: data.url || '',
            addedAt: new Date().toISOString()
        };
    }

    /**
     * Note categories with their icons
     */
    static CATEGORIES = {
        'Idée': 'lightbulb',
        'Recherche': 'search',
        'Référence': 'bookmark',
        'A faire': 'check-circle',
        'Question': 'help-circle',
        'Autre': 'file-text'
    };

    /**
     * Default category order
     */
    static CATEGORY_ORDER = ['Idée', 'Recherche', 'Référence', 'A faire', 'Question', 'Autre'];
}

window.NotesModel = NotesModel;
