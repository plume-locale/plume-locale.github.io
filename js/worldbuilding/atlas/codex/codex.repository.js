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
        return this.getAll().filter(entry => {
            // Nouveau système Atlas
            if (entry.fields) {
                const nom = (entry.fields.nom || '').toLowerCase();
                const resume = (entry.fields.resume_court || '').toLowerCase();
                const notes = (entry.fields.notes_de_l_auteur || '').toLowerCase();
                if (nom.includes(lowerQuery) || resume.includes(lowerQuery) || notes.includes(lowerQuery)) return true;

                // Recherche dans tous les autres champs de type texte
                return Object.values(entry.fields).some(val =>
                    typeof val === 'string' && val.toLowerCase().includes(lowerQuery)
                );
            }

            // Legacy / Fallback
            const title = (entry.title || '').toLowerCase();
            const summary = (entry.summary || '').toLowerCase();
            const content = (entry.content || '').toLowerCase();
            return title.includes(lowerQuery) || summary.includes(lowerQuery) || content.includes(lowerQuery);
        });
    },

    /**
     * Groupe les entrées par catégorie.
     */
    groupByCategory() {
        const groups = {};
        this.getAll().forEach(entry => {
            const migrated = (typeof CodexModel !== 'undefined' && CodexModel.migrate) ? CodexModel.migrate(entry) : entry;
            const cat = migrated.category || 'Autre';
            if (!groups[cat]) {
                groups[cat] = [];
            }
            groups[cat].push(migrated);
        });
        return groups;
    }
};
