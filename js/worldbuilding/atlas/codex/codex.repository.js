/**
 * [MVVM : Codex Repository]
 * Gestion de l'accès aux données du codex dans le projet.
 */

const CodexRepository = {
    /**
     * Récupère toutes les entrées du codex.
     */
    getAll() {
        if (!project.codex) {
            project.codex = [];
        }
        return project.codex;
    },

    /**
     * Récupère une entrée par son ID.
     */
    getById(id) {
        return this.getAll().find(entry => String(entry.id) === String(id));
    },

    /**
     * Récupère les entrées par catégorie.
     */
    getByCategory(category) {
        return this.getAll().filter(entry => entry.category === category);
    },

    /**
     * Ajoute une nouvelle entrée.
     */
    add(entry) {
        if (!project.codex) {
            project.codex = [];
        }
        project.codex.push(entry);
        return entry;
    },

    /**
     * Met à jour une entrée existante.
     */
    update(id, updates) {
        const entry = this.getById(id);
        if (entry) {
            Object.assign(entry, updates);
            entry.updatedAt = Date.now();
            return entry;
        }
        return null;
    },

    /**
     * Supprime une entrée.
     */
    delete(id) {
        if (!project.codex) return false;
        const index = project.codex.findIndex(entry => String(entry.id) === String(id));
        if (index > -1) {
            project.codex.splice(index, 1);
            return true;
        }
        return false;
    },

    /**
     * Compte le nombre d'entrées.
     */
    count() {
        return this.getAll().length;
    },

    /**
     * Compte le nombre d'entrées par catégorie.
     */
    countByCategory(category) {
        return this.getByCategory(category).length;
    },

    /**
     * Recherche dans les entrées.
     */
    search(query) {
        const lowerQuery = query.toLowerCase();
        return this.getAll().filter(entry =>
            entry.title.toLowerCase().includes(lowerQuery) ||
            entry.summary.toLowerCase().includes(lowerQuery) ||
            entry.content.toLowerCase().includes(lowerQuery)
        );
    },

    /**
     * Groupe les entrées par catégorie.
     */
    groupByCategory() {
        const groups = {};
        this.getAll().forEach(entry => {
            const cat = entry.category || 'Autre';
            if (!groups[cat]) {
                groups[cat] = [];
            }
            groups[cat].push(entry);
        });
        return groups;
    }
};
