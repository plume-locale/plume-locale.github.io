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
        let content = text.trim();

        console.log("MagicImporter: Starting import process...");

        try {
            // 1. Pre-process: Strip Markdown Code Blocks
            content = content.replace(/```(?:json)?\s*([\s\S]*?)\s*```/g, '$1').trim();

            const isPossibleJson = content.includes('{') && content.includes('}');

            if (isPossibleJson) {
                try {
                    const jsonStart = content.indexOf('{');
                    const jsonEnd = content.lastIndexOf('}');
                    if (jsonStart !== -1 && jsonEnd !== -1) {
                        const potentialJson = content.substring(jsonStart, jsonEnd + 1);
                        let parsed = JSON.parse(potentialJson);
                        
                        // If it's an array, take the first element
                        if (Array.isArray(parsed)) parsed = parsed[0];

                        data = { fields: {} };
                        
                        // Detect Category/Entity
                        data.category = parsed.category || parsed.categorie || parsed._meta?.categorie || parsed._meta?.category;
                        
                        const entity = parsed.entity || parsed.entite || parsed._meta?.entite || parsed._meta?.entity;
                        if (entity) data.entity = entity.toUpperCase();

                        // Populate fields
                        const rootFields = parsed.fields && typeof parsed.fields === 'object' ? parsed.fields : {};
                        
                        // Merge explicit fields and root fields
                        const allSourceData = { ...parsed, ...rootFields };
                        
                        Object.entries(allSourceData).forEach(([key, value]) => {
                            const lowKey = key.toLowerCase();
                            if (['fields', '_meta', 'category', 'categorie', 'entity', 'entite'].includes(lowKey)) return;
                            
                            // Normalize core field names
                            let targetKey = key;
                            if (['nom', 'name', 'titre', 'title'].includes(lowKey)) targetKey = 'nom';
                            if (['resume_court', 'resume', 'description', 'summary', 'synopsis'].includes(lowKey)) targetKey = 'resume_court';
                            
                            // Handle complex values
                            let finalValue = value;
                            if (Array.isArray(value)) finalValue = value.join(', ');
                            else if (typeof value === 'object' && value !== null) {
                                // For objects, we try to make it readable or just stringify
                                finalValue = JSON.stringify(value, null, 2);
                            }
                            
                            data.fields[targetKey] = finalValue;
                        });

                        console.log("MagicImporter: Successfully parsed as JSON", data);
                    }
                } catch (jsonErr) {
                    console.warn("MagicImporter: Failed to parse JSON, will try structured text", jsonErr);
                }
            }
            
            // 3. Fallback to Structured Text if JSON failed or was not detected
            if (!data) {
                data = this.parseStructuredText(text);
                console.log("MagicImporter: Parsed as structured text", data);
            }
        } catch (e) {
            console.error("MagicImporter: Critical parsing error", e);
            data = this.parseStructuredText(text);
        }

        if (!data || (!data.fields?.nom && !data.name)) {
            console.error("MagicImporter: No name found in data", data);
            return { success: false, error: Localization.t('magic_import.error.no_name') };
        }

        const destination = this.detectDestination(data);
        console.log("MagicImporter: Detected destination", destination);

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
        
        // Mapping for core Plume fields
        const coreMapping = {
            'nom': ['nom', 'name', 'titre', 'title'],
            'resume_court': ['résumé court', 'résumé', 'description', 'summary', 'synopsis']
        };

        lines.forEach((line, index) => {
            line = line.trim();
            if (!line || line.startsWith('TAB :')) return; 

            // Detect category from header lines (e.g., "1. UNIVERS 📍 Lieux & Bâtiments : La Cité du Voile")
            if (index < 3 && (line.toUpperCase().includes('UNIVERS') || line.toUpperCase().includes('CODEX'))) {
                const parts = line.split(':');
                const headerInfo = parts[0];
                const catMatch = headerInfo.match(/(?:UNIVERS|CODEX|WORLD)\s*(?:📍|📌|📝|📖|✨|🐉|⚔️|👥|🎭|📜|⚙️)?\s*([^:]+)/i);
                if (catMatch && catMatch[1]) {
                    data.category = catMatch[1].trim();
                }
                if (line.toUpperCase().includes('CODEX')) data.entity = 'CODEX';
                if (line.toUpperCase().includes('UNIVERS') || line.toUpperCase().includes('WORLD')) data.entity = 'WORLD';
            }

            const colonIndex = line.indexOf(':');
            if (colonIndex !== -1) {
                let rawKey = line.substring(0, colonIndex).trim();
                // Strip quotes and whitespace for JSON-like structured text
                rawKey = rawKey.replace(/^["']|["']$/g, '').trim();

                let value = line.substring(colonIndex + 1).trim();
                value = value.replace(/^["']|["']$/g, '').replace(/,$/, '').trim();

                const cleanKey = rawKey.toLowerCase();

                let isCore = false;
                for (const [targetKey, synonyms] of Object.entries(coreMapping)) {
                    if (synonyms.includes(cleanKey)) {
                        data.fields[targetKey] = value;
                        isCore = true;
                        break;
                    }
                }

                if (!isCore && !rawKey.toUpperCase().includes('UNIVERS') && !rawKey.toUpperCase().includes('CODEX')) {
                    const slugKey = rawKey.toLowerCase()
                        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") 
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
        if (data.entity === 'CODEX') return 'codex';
        if (data.entity === 'WORLD' || data.entity === 'UNIVERS') return 'world';

        const category = data.category || data.fields?.category || data.fields?.categorie || "";
        if (!category) return null;

        if (window.ATLAS_SCHEMA) {
            if (window.ATLAS_SCHEMA.UNIVERS.categories[category]) return 'world';
            if (window.ATLAS_SCHEMA.CODEX.categories[category]) return 'codex';
        }

        const worldRegex = /Géo|Lieu|Peuple|Culture|Hist|Faun|Obj|Univers/i;
        const codexRegex = /Magie|Scien|Reli|Phil|Myth|Politi|Lois|Écon|Soci|Fact|Ling|Cosm|Gloss|Codex/i;

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
            if (result.success && result.element?.id) {
                Object.keys(data.fields).forEach(key => {
                    if (key !== 'nom' && key !== 'resume_court') {
                        updateWorldFieldViewModel(result.element.id, key, data.fields[key]);
                    }
                });
                return { success: true, id: result.element.id, destination: 'world' };
            }
            return { success: false, error: result.error || result.message || "Erreur inconnue dans le module Univers." };
        }
        return { success: false, error: Localization.t('magic_import.error.world_module') };
    },

    addToCodex(data) {
        const title = data.fields?.nom || Localization.t('search.default.untitled');
        const category = data.category || Localization.t('codex.category.Autre');
        const summary = data.fields?.resume_court || "";

        if (typeof CodexViewModel !== 'undefined' && typeof CodexViewModel.addEntry === 'function') {
            const result = CodexViewModel.addEntry(title, category, summary);
            if (result.success && result.entry?.id) {
                Object.keys(data.fields).forEach(key => {
                    if (key !== 'nom' && key !== 'resume_court') {
                        CodexViewModel.updateField(result.entry.id, key, data.fields[key]);
                    }
                });
                return { success: true, id: result.entry.id, destination: 'codex' };
            }
            return { success: false, error: result.error || result.message || "Erreur inconnue dans le module Codex." };
        }
        return { success: false, error: Localization.t('magic_import.error.codex_module') };
    }
};
