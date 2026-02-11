/**
 * @file front-matter.viewmodel.js
 * @description ViewModel pour la gestion de l'affichage des liminaires.
 */

class FrontMatterViewModel {
    constructor(repository) {
        this.repository = repository;
    }

    /**
     * Retourne la liste des éléments formatée pour la vue (sidebar).
     * @returns {Array}
     */
    getSidebarList() {
        const items = this.repository.getAll();
        return items.map(item => ({
            id: item.id,
            title: item.title,
            type: item.type,
            icon: this._getIconForType(item.type),
            summary: this._getSummary(item.content)
        }));
    }

    /**
     * Retourne les détails d'un élément pour l'éditeur.
     * @param {string} id 
     * @returns {Object|null}
     */
    getItemDetails(id) {
        return this.repository.getById(id);
    }

    /**
     * Ajoute un nouvel élément.
     * @param {string} type 
     * @returns {Object}
     */
    addItem(type) {
        return this.repository.add(type);
    }

    /**
     * Met à jour un élément (titre ou contenu).
     */
    updateItem(id, data) {
        return this.repository.update(id, data);
    }

    /**
     * Supprime un élément.
     */
    deleteItem(id) {
        return this.repository.delete(id);
    }

    /**
     * Déplace un élément.
     */
    moveItem(id, direction) {
        return this.repository.move(id, direction);
    }

    /**
     * Retourne l'icône appropriée pour le type (Lucide icons).
     */
    _getIconForType(type) {
        switch (type) {
            case FrontMatterModel.TYPES.PREFACE: return 'book-open';
            case FrontMatterModel.TYPES.FOREWORD: return 'message-square-quote';
            case FrontMatterModel.TYPES.INTRODUCTION: return 'signpost';
            case FrontMatterModel.TYPES.PROLOGUE: return 'chevrons-right';
            case FrontMatterModel.TYPES.EPIGRAPH: return 'quote';
            case FrontMatterModel.TYPES.DEDICATION: return 'heart';
            case FrontMatterModel.TYPES.COPYRIGHT: return 'copyright';
            case FrontMatterModel.TYPES.ACKNOWLEDGEMENTS: return 'thumbs-up';
            case FrontMatterModel.TYPES.POSTFACE: return 'book-closed';
            case FrontMatterModel.TYPES.EPILOGUE: return 'chevrons-left';
            case FrontMatterModel.TYPES.APPENDIX: return 'paperclip';
            case FrontMatterModel.TYPES.GLOSSARY: return 'library';
            case FrontMatterModel.TYPES.BIBLIOGRAPHY: return 'book';
            case FrontMatterModel.TYPES.ABOUT_AUTHOR: return 'user';
            default: return 'file-text';
        }
    }

    /**
     * Génère un résumé court du contenu.
     */
    _getSummary(content) {
        if (!content) return '';
        const div = document.createElement('div');
        div.innerHTML = content;
        const text = div.textContent || div.innerText || '';
        return text.length > 50 ? text.substring(0, 50) + '...' : text;
    }
}
