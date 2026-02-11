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
            case 'globalnote':
                if (typeof GlobalNotesRepository !== 'undefined') {
                    const items = GlobalNotesRepository.getItems();
                    const boards = GlobalNotesRepository.getBoards();
                    return [
                        ...boards.map(b => ({ ...b, name: b.title, type: 'board', mentionType: 'globalnote' })),
                        ...items.map(i => {
                            let title = i.data?.title || i.data?.name || '';
                            if (!title && i.type === 'note' && i.data?.content) {
                                title = i.data.content.substring(0, 40).replace(/<[^>]*>/g, '').trim();
                                if (title.length >= 40) title += '...';
                            }
                            return { ...i, name: title || `[${i.type}]`, mentionType: 'globalnote' };
                        })
                    ];
                }
                return [];
            case 'codex':
                return [...(project.codex || []), ...(project.notes || [])];
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
            const name = (item.name || item.title || '').toLowerCase();

            // Recherche simple pour commencer (peut être améliorée avec Fuse.js si disponible)
            if (name.includes(lowerQuery)) {
                const score = MentionHelpModel.calculateContextScore(item, context);
                results.push(MentionHelpModel.createSuggestion(item, trigger, score));
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
                    newItem = WorldModel.create({ name: name, type: 'Brouillon' });
                    WorldRepository.add(newItem);
                }
                break;
            case 'codex':
                if (typeof CodexModel !== 'undefined' && typeof CodexRepository !== 'undefined') {
                    newItem = CodexModel.create({ title: name, category: 'Autre' });
                    CodexRepository.add(newItem);
                }
                break;
        }

        return newItem;
    }
};
