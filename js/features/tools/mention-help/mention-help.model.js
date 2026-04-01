/**
 * [MVVM : Model]
 * MentionHelpModel - Définition des structures pour l'auto-complétion contextuelle.
 */

const MentionHelpModel = {
    /**
     * Types de mentions supportés et leurs déclencheurs (triggers).
     */
    TRIGGERS: {
        '@@': { type: 'character', icon: 'user',      label: 'mention.type.character' },
        '##': { type: 'world',     icon: 'globe',      label: 'mention.type.world'     },
        '!!': { type: 'note',      icon: 'file-text',  label: 'mention.type.note'      },
        '??': { type: 'codex',     icon: 'book',       label: 'mention.type.codex'     }
    },

    /**
     * Crée un objet de suggestion normalisé.
     */
    createSuggestion(item, trigger, score = 0) {
        if (!item) return null;

        // Extraction intelligente du nom (Atlas dynamique vs legacy)
        let name = '';
        if (item.fields && item.fields.nom) {
            name = item.fields.nom;
        } else {
            name = item.name || item.title || item.label || '';
        }

        const triggerConfig = this.TRIGGERS[trigger] || { type: 'unknown', icon: 'help-circle' };

        // Icône dynamique selon la catégorie (Notes de projet)
        let icon = item.icon || triggerConfig.icon;
        if (triggerConfig.type === 'note' && item.category) {
            const NOTE_ICONS = {
                'Idée':       'lightbulb',
                'Recherche':  'search',
                'Référence':  'bookmark',
                'A faire':    'check-circle',
                'Question':   'help-circle',
                'Autre':      'file-text'
            };
            icon = NOTE_ICONS[item.category] || icon;
        }

        return {
            id: item.id || Date.now(),
            name: name,
            type: triggerConfig.type,
            icon: icon,
            description: item.role || item.type || item.category || '',
            avatar: item.avatarImage || item.avatar || item.image || (item.fields ? item.fields.portrait : null) || null,
            score: score,
            originalItem: item,
            trigger: trigger
        };
    },

    /**
     * Retourne les alias disponibles pour un personnage.
     * @param {Object} character - L'objet personnage.
     * @returns {Array<{label, value}>} - Liste des alias disponibles.
     */
    getCharacterAliases(character) {
        if (!character) return [];
        const aliases = [];

        const firstName = character.firstName || '';
        const lastName  = character.lastName  || '';
        const nickname  = character.nickname  || '';
        const fullName  = character.name || `${firstName} ${lastName}`.trim();

        // Prénom uniquement
        if (firstName) {
            aliases.push({ label: 'Prénom',     value: firstName,  icon: 'user'    });
        }

        // Nom complet (seulement si différent du prénom)
        if (fullName && fullName !== firstName) {
            aliases.push({ label: 'Nom complet', value: fullName,  icon: 'id-card' });
        }

        // Surnom (seulement s'il existe et diffère du reste)
        if (nickname && nickname !== firstName && nickname !== fullName) {
            aliases.push({ label: 'Surnom',      value: nickname,  icon: 'star'    });
        }

        // Fallback minimal
        if (aliases.length === 0 && fullName) {
            aliases.push({ label: 'Nom',         value: fullName,  icon: 'user'    });
        }

        return aliases;
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
