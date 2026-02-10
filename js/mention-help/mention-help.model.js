/**
 * [MVVM : Model]
 * MentionHelpModel - Définition des structures pour l'auto-complétion contextuelle.
 */

const MentionHelpModel = {
    /**
     * Types de mentions supportés et leurs déclencheurs (triggers).
     */
    TRIGGERS: {
        '@@': { type: 'character', icon: 'user', label: 'mention.type.character' },
        '##': { type: 'world', icon: 'globe', label: 'mention.type.world' },
        '!!': { type: 'globalnote', icon: 'file-text', label: 'mention.type.globalnote' },
        '??': { type: 'codex', icon: 'book', label: 'mention.type.codex' }
    },

    /**
     * Crée un objet de suggestion normalisé.
     */
    createSuggestion(item, trigger, score = 0) {
        return {
            id: item.id || Date.now(),
            name: item.name || item.title || '',
            type: this.TRIGGERS[trigger].type,
            icon: item.icon || this.TRIGGERS[trigger].icon,
            description: item.role || item.type || item.category || '',
            avatar: item.avatarImage || null,
            score: score, // Pour la priorisation
            originalItem: item,
            trigger: trigger
        };
    },

    /**
     * Calcule un score de pertinence contextuelle.
     * @param {Object} item - L'entité à scorer.
     * @param {Object} context - { sceneId, recentlyMentionedIds, etc. }
     */
    calculateContextScore(item, context) {
        let score = 0;

        // 1. Déjà présent dans la scène (Priorité maximale)
        if (context.presentIds && context.presentIds.includes(item.id)) {
            score += 100;
        }

        // 2. Mentionné récemment (Priorité moyenne)
        if (context.recentIds && context.recentIds.includes(item.id)) {
            score += 50;
        }

        // 3. Modifié récemment (Priorité faible)
        if (item.updatedAt) {
            const daysSinceUpdate = (Date.now() - new Date(item.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
            if (daysSinceUpdate < 1) score += 20;
            else if (daysSinceUpdate < 7) score += 10;
        }

        return score;
    }
};
