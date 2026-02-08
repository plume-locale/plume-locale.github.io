/**
 * [MVVM : Codex Model]
 * Définition de la structure de données et usines pour le codex.
 */

const CodexModel = {
    /**
     * Crée une nouvelle entrée de codex avec les valeurs par défaut.
     */
    create(data = {}) {
        const id = data.id || Date.now();
        
        return {
            id: id,
            title: data.title || '',
            category: data.category || 'Autre',
            summary: data.summary || '',
            content: data.content || '',
            relatedTo: data.relatedTo || [], // IDs of related characters, world elements, etc.
            createdAt: data.createdAt || id,
            updatedAt: data.updatedAt || Date.now()
        };
    },

    /**
     * Migre une ancienne entrée vers la nouvelle structure.
     */
    migrate(entry) {
        if (!entry) return null;
        
        // Si déjà migré, on vérifie juste les champs manquants
        const migrated = this.create(entry);
        
        return migrated;
    },

    /**
     * Valide une entrée de codex.
     */
    validate(entry) {
        if (!entry) return false;
        if (!entry.title || entry.title.trim() === '') return false;
        return true;
    }
};

/**
 * Configuration des catégories de codex avec leurs icônes Lucide.
 */
const CODEX_CATEGORIES = {
    'Culture': {
        icon: 'palette',
        label: 'Culture',
        description: 'Art, traditions, coutumes'
    },
    'Histoire': {
        icon: 'scroll',
        label: 'Histoire',
        description: 'Événements historiques, chronologie'
    },
    'Technologie': {
        icon: 'cpu',
        label: 'Technologie',
        description: 'Inventions, sciences, technologies'
    },
    'Géographie': {
        icon: 'globe',
        label: 'Géographie',
        description: 'Lieux, territoires, cartes'
    },
    'Politique': {
        icon: 'scale',
        label: 'Politique',
        description: 'Systèmes politiques, gouvernements'
    },
    'Magie/Pouvoir': {
        icon: 'sparkles',
        label: 'Magie/Pouvoir',
        description: 'Systèmes magiques, pouvoirs surnaturels'
    },
    'Religion': {
        icon: 'book-open',
        label: 'Religion',
        description: 'Croyances, cultes, spiritualité'
    },
    'Société': {
        icon: 'users',
        label: 'Société',
        description: 'Organisation sociale, classes, groupes'
    },
    'Autre': {
        icon: 'file-text',
        label: 'Autre',
        description: 'Autres informations'
    }
};

/**
 * Obtient l'icône pour une catégorie donnée.
 */
function getCodexCategoryIcon(category) {
    return CODEX_CATEGORIES[category]?.icon || 'file-text';
}

/**
 * Obtient toutes les catégories disponibles.
 */
function getCodexCategories() {
    return Object.keys(CODEX_CATEGORIES);
}
