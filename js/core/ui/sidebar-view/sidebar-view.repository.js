/**
 * @file sidebar-view.repository.js
 * @description Repository pour récupérer les données du projet nécessaires à la barre latérale.
 */

class SidebarViewRepository {
    /**
     * Récupère le nombre d'éléments pour une catégorie donnée.
     * @param {string} viewType - Le type de vue ('editor', 'characters', 'world', 'notes', 'codex')
     * @returns {number} Le nombre d'éléments existants
     */
    getItemCount(viewType) {
        if (typeof project === 'undefined') return 0;

        switch (viewType) {
            case 'editor':
                return project.acts ? project.acts.length : 0;
            case 'characters':
                return project.characters ? project.characters.length : 0;
            case 'world':
                return project.world ? project.world.length : 0;
            case 'notes':
                return project.notes ? project.notes.length : 0;
            case 'codex':
                return project.codex ? project.codex.length : 0;
            default:
                return 0;
        }
    }

    /**
     * Vérifie si une catégorie est vide.
     * @param {string} viewType 
     * @returns {boolean}
     */
    isEmpty(viewType) {
        return this.getItemCount(viewType) === 0;
    }
}
