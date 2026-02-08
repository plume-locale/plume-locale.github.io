/**
 * @class MetroTimelineModel
 * @description Modèle pour les événements de la timeline métro.
 */
class MetroTimelineModel {
    /**
     * @param {Object} data - Données de l'événement
     */
    constructor(data = {}) {
        this.id = data.id || Date.now() + Math.floor(Math.random() * 1000);
        this.title = data.title || "";
        this.date = data.date || "";
        this.order = data.order || 0;
        this.description = data.description || "";
        this.characters = data.characters || [];
        this.sceneId = data.sceneId || null;
    }

    /**
     * Couleurs par défaut pour les personnages.
     */
    static DEFAULT_COLORS = [
        '#E53935', '#1E88E5', '#43A047', '#FB8C00', '#8E24AA',
        '#00ACC1', '#FFB300', '#D81B60', '#5E35B1', '#00897B'
    ];

    /**
     * Analyse une date réelle au format JJ/MM/AAAA.
     * @param {string} dateStr 
     * @returns {Date|null}
     */
    static parseRealDate(dateStr) {
        if (!dateStr || !dateStr.trim()) return null;

        const trimmed = dateStr.trim();
        const parts = trimmed.split('/');

        if (parts.length < 2 || parts.length > 3) return null;

        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        let year = parts[2] ? parseInt(parts[2], 10) : null;

        if (isNaN(day) || isNaN(month)) return null;
        if (year === null) return null;

        // Handle 2-digit years
        if (year < 100) {
            year = year < 50 ? 2000 + year : 1900 + year;
        }

        const date = new Date(year, month - 1, day);
        if (isNaN(date.getTime())) return null;

        return date;
    }

    /**
     * Extrait l'année d'une chaîne de caractères (pour calendriers fictifs).
     * @param {string} dateStr 
     * @returns {number|null}
     */
    static extractYearNumber(dateStr) {
        if (!dateStr || !dateStr.trim()) return null;

        const trimmed = dateStr.trim();
        const yearMatch = trimmed.match(/(?:an|année|year|yr)\s*[:\-]?\s*(-?\d+)/i);
        if (yearMatch) return parseInt(yearMatch[1], 10);

        const numberMatch = trimmed.match(/^(-?\d+)/);
        if (numberMatch) return parseInt(numberMatch[1], 10);

        return null;
    }
}
