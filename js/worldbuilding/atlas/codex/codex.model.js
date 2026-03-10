/**
 * [MVVM : Codex Model]
 * Définition de la structure de données et usines pour le codex.
 */

const CodexModel = {
    /**
     * Crée une nouvelle entrée de codex avec les valeurs par défaut.
     */
    create(data = {}) {
        // ID unique robuste
        const id = data.id || (Date.now() + Math.floor(Math.random() * 1000)).toString();

        return {
            id: id,
            category: data.category || 'Magie & Pouvoirs',
            fields: data.fields || {},
            relatedTo: data.relatedTo || [], // IDs des éléments liés
            createdAt: data.createdAt || id,
            updatedAt: data.updatedAt || Date.now()
        };
    },

    /**
     * Migre une ancienne entrée vers la nouvelle structure.
     */
    migrate(entry) {
        if (!entry) return null;

        const migrated = this.create(entry);

        // Migration depuis l'ancien format (title, summary, content) vers le système `fields` dynamique
        if (!entry.fields) {
            migrated.fields = {
                nom: entry.title || '',
                resume_court: entry.summary || '',
                notes_de_l_auteur: entry.content || '',
            };

            // Mapper les anciennes catégories vers les nouvelles si possible
            if (entry.category === 'Magie') migrated.category = 'Magie & Pouvoirs';
            if (entry.category === 'Technologie') migrated.category = 'Sciences & Technologie';
            if (entry.category === 'Religion') migrated.category = 'Religions & Cultes';
            if (entry.category === 'Philosophie') migrated.category = 'Philosophies & Idéologies';
            if (entry.category === 'Mythes') migrated.category = 'Mythes & Légendes';
            if (entry.category === 'Politique') migrated.category = 'Politique & Géopolitique';
            if (entry.category === 'Lois') migrated.category = 'Lois & Justice';
            if (entry.category === 'Économie') migrated.category = 'Économie & Commerce';
            if (entry.category === 'Société') migrated.category = 'Systèmes Sociaux & Castes';
            if (entry.category === 'Factions') migrated.category = 'Factions & Organisations';
            if (entry.category === 'Linguistique') migrated.category = 'Linguistique & Grammaire';
            if (entry.category === 'Cosmologie') migrated.category = 'Cosmologie & Métaphysique';
            if (entry.category === 'Glossaire') migrated.category = 'Glossaire & Terminologie';
        }

        return migrated;
    },

    /**
     * Valide une entrée de codex.
     */
    validate(entry) {
        if (!entry) return false;
        // On vérifie que le champ principal (nom) existe
        const nom = entry.fields && entry.fields.nom;
        if (!nom || nom.trim() === '') return false;
        return true;
    }
};

/**
 * Obtient l'icône pour une catégorie codex depuis le SCHEMA.
 */
function getCodexCategoryIcon(category) {
    if (typeof window !== 'undefined' && window.ATLAS_SCHEMA) {
        return window.ATLAS_SCHEMA.CODEX.categories[category]?.icon || '📚';
    }
    return '📚';
}

/**
 * Obtient toutes les catégories codex disponibles depuis le SCHEMA.
 */
function getCodexCategories() {
    if (typeof window !== 'undefined' && window.ATLAS_SCHEMA) {
        return Object.keys(window.ATLAS_SCHEMA.CODEX.categories);
    }
    return [];
}

/**
 * Obtient la description/couleur pour une catégorie donnée.
 */
function getCodexCategoryColor(category) {
    if (typeof window !== 'undefined' && window.ATLAS_SCHEMA) {
        return window.ATLAS_SCHEMA.CODEX.categories[category]?.color || '#c77dff';
    }
    return '#c77dff';
}
