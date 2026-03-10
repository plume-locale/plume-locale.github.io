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
            return { success: false, error: "Le contenu est vide." };
        }

        let data = null;
        try {
            // Try as JSON
            if (text.trim().startsWith('{')) {
                data = JSON.parse(text);
            } else {
                data = this.parseStructuredText(text);
            }
        } catch (e) {
            data = this.parseStructuredText(text);
        }

        if (!data || (!data.fields?.nom && !data.name)) {
            return { success: false, error: "Impossible de trouver au moins un Nom ou un Titre dans le texte." };
        }

        const destination = this.detectDestination(data);

        if (destination === 'world') {
            return this.addToWorld(data);
        } else if (destination === 'codex') {
            return this.addToCodex(data);
        } else {
            return { success: false, error: "Catégorie non reconnue. Précisez s'il s'agit d'un élément de l'Univers ou du Codex." };
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
        const category = data.category || data.fields?.category || "";
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
        const name = data.fields?.nom || "Sans nom";
        const type = data.category || "Géographie";
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
        return { success: false, error: "Module Univers non disponible." };
    },

    addToCodex(data) {
        const title = data.fields?.nom || "Sans titre";
        const category = data.category || "Autre";
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
        return { success: false, error: "Module Codex non disponible." };
    }
};
