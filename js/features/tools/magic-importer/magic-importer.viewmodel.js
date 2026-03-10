/**
 * [MVVM : Magic Importer ViewModel]
 * Logic for parsing and importing generated content into Plume.
 */

const MagicImporterViewModel = {
    /**
     * Parses the input text and tries to detect if it's World or Codex content.
     */
    async importContent(text) {
        if (!text || !text.trim()) {
            return { success: false, error: Localization.t('magic_import.error.empty') };
        }

        let data = null;
        try {
            // Try as JSON
            const trimmed = text.trim();
            if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
                let parsed = JSON.parse(trimmed);
                
                // If it's an array, take the first element for now
                if (Array.isArray(parsed)) parsed = parsed[0];

                data = { fields: {} };
                
                // 1. Detect Category/Entity
                data.category = parsed.category || parsed.categorie || parsed._meta?.categorie || parsed._meta?.category;
                
                const entity = parsed.entity || parsed.entite || parsed._meta?.entite || parsed._meta?.entity;
                if (entity) data.entity = entity.toUpperCase();

                // 2. Populate fields
                // Start with explicit fields if they exist
                if (parsed.fields && typeof parsed.fields === 'object') {
                    Object.entries(parsed.fields).forEach(([k, v]) => {
                        data.fields[k] = Array.isArray(v) ? v.join(', ') : v;
                    });
                }
                
                // 3. Collect other root keys (excluding structural ones)
                Object.entries(parsed).forEach(([key, value]) => {
                    const lowKey = key.toLowerCase();
                    if (['fields', '_meta', 'category', 'categorie', 'entity', 'entite'].includes(lowKey)) return;
                    
                    // Normalize core field names
                    let targetKey = key;
                    if (['nom', 'name', 'titre', 'title'].includes(lowKey)) targetKey = 'nom';
                    if (['resume_court', 'resume', 'description', 'summary', 'synopsis'].includes(lowKey)) targetKey = 'resume_court';
                    
                    // Convert arrays to comma-separated strings for Plume compatibility
                    const finalValue = Array.isArray(value) ? value.join(', ') : value;
                    
                    data.fields[targetKey] = finalValue;
                });
            } else {
                data = this.parseStructuredText(text);
            }
        } catch (e) {
            console.error("MagicImporter: JSON parse failed, falling back to text parser", e);
            data = this.parseStructuredText(text);
        }

        if (!data || (!data.fields?.nom && !data.name)) {
            return { success: false, error: Localization.t('magic_import.error.no_name') };
        }

        const destination = this.detectDestination(data);

        if (destination === 'world') {
            return this.addToWorld(data);
        } else if (destination === 'codex') {
            return this.addToCodex(data);
        } else {
            return { success: false, error: Localization.t('magic_import.error.category_not_recognized') || "Catégorie non reconnue. Précisez s'il s'agit d'un élément de l'Univers ou du Codex." };
        }
    },

    /**
     * Advanced parser for the user's structured text format.
     */
    parseStructuredText(text) {
        const lines = text.split('\n');
        const data = { fields: {} };
        
        // Step 1: Detect category from header (e.g., "1. UNIVERS 📍 Lieux & Bâtiments : La Cité du Voile")
        const firstLine = lines[0] || "";
        if (firstLine.includes('UNIVERS') || firstLine.includes('CODEX')) {
            const parts = firstLine.split(':');
            const headerInfo = parts[0];
            // Extract what's between the emoji/tag and the ":"
            const catMatch = headerInfo.match(/(?:UNIVERS|CODEX)\s*(?:📍|📌|📝|📖)?\s*([^:]+)/i);
            if (catMatch && catMatch[1]) {
                data.category = catMatch[1].trim();
            }
        }

        // Mapping for core Plume fields
        const coreMapping = {
            'nom': ['nom', 'name', 'titre', 'title'],
            'resume_court': ['résumé court', 'résumé', 'description', 'summary', 'synopsis']
        };

        lines.forEach(line => {
            line = line.trim();
            if (!line || line.startsWith('TAB :')) return; // Skip empty and structural lines

            const colonIndex = line.indexOf(':');
            if (colonIndex !== -1) {
                const rawKey = line.substring(0, colonIndex).trim();
                const value = line.substring(colonIndex + 1).trim();
                const cleanKey = rawKey.toLowerCase();

                let isCore = false;
                for (const [targetKey, synonyms] of Object.entries(coreMapping)) {
                    if (synonyms.includes(cleanKey)) {
                        data.fields[targetKey] = value;
                        isCore = true;
                        break;
                    }
                }

                // If not core, and not just the header line, add as dynamic field
                if (!isCore && !rawKey.includes('UNIVERS') && !rawKey.includes('CODEX')) {
                    // Convert "Points d'intérêt internes" to "points_d_interet_internes"
                    const slugKey = rawKey.toLowerCase()
                        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove accents
                        .replace(/[\s']/g, '_')
                        .replace(/[^a-z0-9_]/g, '');
                    
                    if (slugKey) data.fields[slugKey] = value;
                }
            }
        });

        return data;
    },

    /**
     * Detects if the item belongs to World or Codex.
     */
    detectDestination(data) {
        // Explicit entity from JSON
        if (data.entity === 'CODEX') return 'codex';
        if (data.entity === 'WORLD' || data.entity === 'UNIVERS') return 'world';

        const category = data.category || data.fields?.category || data.fields?.categorie || "";
        if (!category) return null;

        if (window.ATLAS_SCHEMA) {
            if (window.ATLAS_SCHEMA.UNIVERS.categories[category]) return 'world';
            if (window.ATLAS_SCHEMA.CODEX.categories[category]) return 'codex';
        }

        // Manual fallbacks
        const worldRegex = /Géo|Lieu|Peuple|Culture|Hist|Faun|Obj/i;
        const codexRegex = /Magie|Scien|Reli|Phil|Myth|Politi|Lois|Écon|Soci|Fact|Ling|Cosm|Gloss/i;

        if (worldRegex.test(category)) return 'world';
        if (codexRegex.test(category)) return 'codex';

        return null;
    },

    addToWorld(data) {
        const name = data.fields?.nom || Localization.t('search.default.unnamed');
        const type = data.category || Localization.t('world.type.geography');
        const description = data.fields?.resume_court || "";

        if (typeof addWorldElementViewModel === 'function') {
            const result = addWorldElementViewModel(name, type, description);
            if (result.success && result.element.id) {
                // Update all other fields
                Object.keys(data.fields).forEach(key => {
                    if (key !== 'nom' && key !== 'resume_court') {
                        updateWorldFieldViewModel(result.element.id, key, data.fields[key]);
                    }
                });
                return { success: true, id: result.element.id, destination: 'world' };
            }
            return result;
        }
        return { success: false, error: Localization.t('magic_import.error.world_module') };
    },

    addToCodex(data) {
        const title = data.fields?.nom || Localization.t('search.default.untitled');
        const category = data.category || Localization.t('codex.category.Autre');
        const summary = data.fields?.resume_court || "";

        if (typeof CodexViewModel !== 'undefined' && typeof CodexViewModel.addEntry === 'function') {
            const result = CodexViewModel.addEntry(title, category, summary);
            if (result.success && result.entry.id) {
                Object.keys(data.fields).forEach(key => {
                    if (key !== 'nom' && key !== 'resume_court') {
                        CodexViewModel.updateField(result.entry.id, key, data.fields[key]);
                    }
                });
                return { success: true, id: result.entry.id, destination: 'codex' };
            }
            return result;
        }
        return { success: false, error: Localization.t('magic_import.error.codex_module') };
    }
};
