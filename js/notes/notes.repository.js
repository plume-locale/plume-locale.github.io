/**
 * Notes Repository - Handles CRUD operations on project.notes
 */
class NotesRepository {
    /**
     * Get all notes
     * @returns {Array}
     */
    static getAll() {
        if (!window.project || !window.project.notes) {
            if (window.project) window.project.notes = [];
            return [];
        }
        return window.project.notes;
    }

    /**
     * Get a note by ID
     * @param {number} id 
     * @returns {Object|null}
     */
    static getById(id) {
        return this.getAll().find(n => n.id === parseInt(id));
    }

    /**
     * Add a new note
     * @param {Object} noteData 
     * @returns {Object}
     */
    static add(noteData) {
        const note = NotesModel.create(noteData);
        window.project.notes.push(note);
        return note;
    }

    /**
     * Update a note
     * @param {number} id 
     * @param {Object} updates 
     * @returns {Object|null}
     */
    static update(id, updates) {
        const note = this.getById(id);
        if (note) {
            Object.assign(note, updates);
            note.updatedAt = new Date().toISOString();
            return note;
        }
        return null;
    }

    /**
     * Delete a note
     * @param {number} id 
     * @returns {boolean}
     */
    static delete(id) {
        const initialLength = window.project.notes.length;
        window.project.notes = window.project.notes.filter(n => n.id !== parseInt(id));
        return window.project.notes.length < initialLength;
    }

    /**
     * Add media to a note
     * @param {number} noteId 
     * @param {Object} mediaData 
     * @returns {Object|null}
     */
    static addMedia(noteId, mediaData) {
        const note = this.getById(noteId);
        if (note) {
            const media = NotesModel.createMedia(mediaData);
            if (!note.medias) note.medias = [];
            note.medias.push(media);
            note.updatedAt = new Date().toISOString();
            return media;
        }
        return null;
    }

    /**
     * Delete media from a note
     * @param {number} noteId 
     * @param {number} mediaIndex 
     * @returns {boolean}
     */
    static deleteMedia(noteId, mediaIndex) {
        const note = this.getById(noteId);
        if (note && note.medias && note.medias[mediaIndex]) {
            note.medias.splice(mediaIndex, 1);
            note.updatedAt = new Date().toISOString();
            return true;
        }
        return false;
    }
}

window.NotesRepository = NotesRepository;
