/**
 * [MVVM : Characters Repository]
 * Gestion de la persistance et de l'accès aux données des personnages et des races.
 */

const CharacterRepository = {
    /**
     * Récupère tous les personnages.
     */
    getAll() {
        if (!project.characters) project.characters = [];
        return project.characters;
    },

    /**
     * Récupère un personnage par son ID.
     */
    getById(id) {
        return this.getAll().find(c => c.id === id);
    },

    /**
     * Ajoute un personnage au projet.
     */
    add(character) {
        if (!project.characters) project.characters = [];
        project.characters.push(character);
    },

    /**
     * Supprime un personnage par son ID.
     */
    remove(id) {
        if (!project.characters) return;
        project.characters = project.characters.filter(c => c.id !== id);
    },

    /**
     * Met à jour un personnage par son ID.
     */
    update(id, updates) {
        const char = this.getById(id);
        if (char) {
            Object.assign(char, updates, { updatedAt: Date.now() });
            return { ...char }; // Return a clone
        }
        return null;
    },

    /**
     * Récupère toutes les races définies.
     */
    getRaces() {
        if (!project.races) {
            project.races = ['Humain', 'Elfe', 'Nain', 'Orc', 'Autre'];
        }
        return project.races;
    },

    /**
     * Ajoute une nouvelle race à la liste globale.
     */
    addRace(raceName) {
        const races = this.getRaces();
        if (!races.includes(raceName)) {
            races.push(raceName);
            races.sort();
            return true;
        }
        return false;
    },

    /**
     * Récupère tous les regroupements personnalisés définis.
     */
    getGroups() {
        if (!project.groups) {
            project.groups = [];
        }
        return project.groups;
    },

    /**
     * Ajoute un nouveau regroupement à la liste globale.
     */
    addGroup(groupName) {
        const groups = this.getGroups();
        if (!groups.includes(groupName)) {
            groups.push(groupName);
            groups.sort();
            return true;
        }
        return false;
    }
};
