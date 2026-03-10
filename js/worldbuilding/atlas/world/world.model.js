/**
 * [MVVM : World Model]
 * Defines the structure of world elements and factory functions.
 */

const WorldModel = {
    /**
     * Create a new world element.
     * @param {Object} data - Initial data for the element.
     * @returns {Object} A new world element object.
     */
    create: function (data = {}) {
        // ID unique robuste
        const now = Date.now();
        const id = data.id || (now + Math.floor(Math.random() * 1000)).toString();
        return {
            id: id,
            category: data.category || 'Géographie',
            fields: data.fields || {},
            linkedScenes: data.linkedScenes || [], // Array of scene IDs
            linkedElements: data.linkedElements || [], // Array of {type, id}
            createdAt: data.createdAt || new Date(now).toISOString(),
            updatedAt: data.updatedAt || new Date(now).toISOString()
        };
    },

    /**
     * Migrate a legacy world element structure if necessary.
     * @param {Object} raw - Raw data from project.world.
     * @returns {Object} Migrated element.
     */
    migrate: function (raw) {
        if (!raw) return null;

        const migrated = this.create(raw);

        // Migration depuis l'ancien format vers le système `fields` dynamique
        if (!raw.fields) {
            migrated.fields = {
                nom: raw.name || '',
                resume_court: raw.description || '',
                notes_de_l_auteur: raw.notes || '',
            };

            // Mapping des anciens 'type' vers les nouvelles 'category' de l'ATLAS_SCHEMA
            const typeToCategory = {
                'Lieu': 'Lieux & Bâtiments',
                'Personnage': 'Personnages', // A adapter si Personnage est géré ailleurs
                'Objet': 'Objets & Artefacts',
                'Groupe': 'Factions & Organisations',
                'Concept': 'Glossaire & Terminologie'
            };

            if (raw.type && typeToCategory[raw.type]) {
                migrated.category = typeToCategory[raw.type];
            } else if (raw.type) {
                migrated.category = raw.type; // Conservation de la valeur
            }
        }

        return migrated;
    },

    /**
     * Validate a world element.
     */
    validate: function (entry) {
        if (!entry) return false;
        const nom = entry.fields && entry.fields.nom;
        if (!nom || nom.trim() === '') return false;
        return true;
    }
};

/**
 * Obtient l'icône pour une catégorie world depuis le SCHEMA (fallback emoji).
 */
function getWorldCategoryIcon(category) {
    if (typeof window !== 'undefined' && window.ATLAS_SCHEMA && window.ATLAS_SCHEMA.UNIVERS) {
        return window.ATLAS_SCHEMA.UNIVERS.categories[category]?.icon || '🌍';
    }
    return '🌍';
}

/**
 * Obtient toutes les catégories world disponibles depuis le SCHEMA.
 */
function getWorldCategories() {
    if (typeof window !== 'undefined' && window.ATLAS_SCHEMA && window.ATLAS_SCHEMA.UNIVERS) {
        return Object.keys(window.ATLAS_SCHEMA.UNIVERS.categories);
    }
    return [];
}

/**
 * Obtient la couleur pour une catégorie donnée.
 */
function getWorldCategoryColor(category) {
    if (typeof window !== 'undefined' && window.ATLAS_SCHEMA && window.ATLAS_SCHEMA.UNIVERS) {
        return window.ATLAS_SCHEMA.UNIVERS.categories[category]?.color || '#52b788';
    }
    return '#52b788';
}
