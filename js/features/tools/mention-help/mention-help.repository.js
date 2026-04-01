/**
 * [MVVM : Repository]
 * MentionHelpRepository - Centralisation de l'accès aux données pour les mentions.
 */

const MentionHelpRepository = {
    /**
     * Récupère toutes les entités correspondant à un déclencheur.
     */
    getEntitiesForTrigger(trigger) {
        if (typeof project === 'undefined') return [];

        const type = MentionHelpModel.TRIGGERS[trigger]?.type;
        if (!type) return [];

        switch (type) {
            case 'character':
                return project.characters || [];
            case 'world':
                return project.world || [];
            case 'note':
                // Notes de projet : title, category, content — propres et cherchables
                return project.notes || [];
            case 'codex':
                return project.codex || [];
            default:
                return [];
        }
    },

    /**
     * Filtre les entités avec une logique de "Fuzzy Search" simple et de priorisation.
     */
    search(trigger, query, context = {}) {
        const entities = this.getEntitiesForTrigger(trigger);
        const results = [];

        const lowerQuery = query.toLowerCase();

        entities.forEach(item => {
            const suggestion = MentionHelpModel.createSuggestion(item, trigger, 0);
            if (!suggestion) return;

            const name = suggestion.name || '';
            const lowerName = name.toLowerCase();

            // Pour les notes : chercher aussi dans le contenu et les tags
            let searchText = lowerName;
            if (suggestion.type === 'note') {
                const rawContent = (item.content || '').replace(/<[^>]*>/g, ' ').toLowerCase();
                const tags = Array.isArray(item.tags) ? item.tags.join(' ').toLowerCase() : '';
                const category = (item.category || '').toLowerCase();
                searchText = [lowerName, rawContent, tags, category].join(' ');
            }

            if (searchText.includes(lowerQuery)) {
                suggestion.score = MentionHelpModel.calculateContextScore(item, context);
                // Montrer la catégorie comme description plutôt que rien
                if (suggestion.type === 'note' && !suggestion.description && item.category) {
                    suggestion.description = item.category;
                }
                results.push(suggestion);
            }
        });

        // Trier par score de pertinence, puis par ordre alphabétique
        return results.sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            return a.name.localeCompare(b.name);
        });
    },

    /**
     * Fonction de création rapide (Quick Create).
     */
    quickCreate(trigger, name) {
        const type = MentionHelpModel.TRIGGERS[trigger]?.type;
        if (!name || !type) return null;

        let newItem = null;
        let repository = null;

        // On utilise les repositories existants pour rester dans le flux Undo/Redo
        switch (type) {
            case 'character':
                if (typeof CharacterModel !== 'undefined' && typeof CharacterRepository !== 'undefined') {
                    newItem = CharacterModel.create({ name: name, role: 'Brouillon' });
                    CharacterRepository.add(newItem);
                }
                break;
            case 'world':
                if (typeof WorldModel !== 'undefined' && typeof WorldRepository !== 'undefined') {
                    newItem = WorldModel.create({
                        fields: { nom: name },
                        category: 'Géographie'
                    });
                    WorldRepository.add(newItem);
                }
                break;
            case 'note':
                if (typeof NotesRepository !== 'undefined') {
                    newItem = NotesRepository.add({ title: name, category: 'Idée' });
                }
                break;
            case 'codex':
                if (typeof CodexModel !== 'undefined' && typeof CodexRepository !== 'undefined') {
                    newItem = CodexModel.create({
                        fields: { nom: name },
                        category: 'Magie & Pouvoirs'
                    });
                    CodexRepository.add(newItem);
                }
                break;
        }

        return newItem;
    }
};
