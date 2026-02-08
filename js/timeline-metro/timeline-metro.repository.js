/**
 * @class MetroTimelineRepository
 * @description Gère l'accès aux données des événements de la timeline métro.
 */
class MetroTimelineRepository {
    /**
     * Récupère tous les événements triés par ordre.
     * @returns {MetroTimelineModel[]}
     */
    static getAll() {
        if (!project.metroTimeline) {
            project.metroTimeline = [];
        }
        return project.metroTimeline
            .map(data => new MetroTimelineModel(data))
            .sort((a, b) => (a.order || 0) - (b.order || 0));
    }

    /**
     * Récupère un événement par son ID.
     * @param {number} id 
     * @returns {MetroTimelineModel|null}
     */
    static getById(id) {
        const data = (project.metroTimeline || []).find(e => e.id === id);
        return data ? new MetroTimelineModel(data) : null;
    }

    /**
     * Sauvegarde un événement (création ou mise à jour).
     * @param {MetroTimelineModel} model 
     */
    static save(model) {
        if (!project.metroTimeline) {
            project.metroTimeline = [];
        }

        const index = project.metroTimeline.findIndex(e => e.id === model.id);
        if (index !== -1) {
            project.metroTimeline[index] = { ...model };
        } else {
            project.metroTimeline.push({ ...model });
        }
    }

    /**
     * Supprime un événement par son ID.
     * @param {number} id 
     */
    static delete(id) {
        if (!project.metroTimeline) return;
        project.metroTimeline = project.metroTimeline.filter(e => e.id !== id);
    }

    /**
     * Réorganise les ordres des événements pour qu'ils soient séquentiels.
     */
    static normalizeOrder() {
        if (!project.metroTimeline) return;

        project.metroTimeline.sort((a, b) => (a.order || 0) - (b.order || 0));
        project.metroTimeline.forEach((event, i) => {
            event.order = i + 1;
        });
    }

    /**
     * Efface tous les événements.
     */
    static clear() {
        project.metroTimeline = [];
    }

    /**
     * Récupère la couleur d'un personnage.
     * @param {number|string} charId 
     * @returns {string}
     */
    static getCharacterColor(charId) {
        if (!project.characterColors) {
            project.characterColors = {};
        }

        if (!project.characterColors[charId]) {
            const charIndex = project.characters.findIndex(c => c.id === charId);
            const color = MetroTimelineModel.DEFAULT_COLORS[charIndex % MetroTimelineModel.DEFAULT_COLORS.length];
            project.characterColors[charId] = color;
        }

        return project.characterColors[charId];
    }

    /**
     * Met à jour la couleur d'un personnage.
     * @param {number|string} charId 
     * @param {string} color 
     */
    static setCharacterColor(charId, color) {
        if (!project.characterColors) {
            project.characterColors = {};
        }
        project.characterColors[charId] = color;
    }

    /**
     * Échappe les champs pour l'exportation CSV.
     * @param {string} field 
     * @returns {string}
     */
    static escapeCSVField(field) {
        if (!field) return '""';
        if (field.includes(',') || field.includes('"') || field.includes('\n')) {
            field = field.replace(/"/g, '""');
            return `"${field}"`;
        }
        return field;
    }

    /**
     * Analyse une ligne CSV en tenant compte des guillemets.
     * @param {string} line 
     * @returns {string[]}
     */
    static parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];

            if (char === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    current += '"';
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }

        result.push(current);
        return result;
    }
}
