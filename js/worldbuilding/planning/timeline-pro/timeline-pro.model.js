/**
 * @class TimelineProModel
 * @description Modèle pour les événements et périodes de la chronologie avancée.
 */
class TimelineProModel {
    /**
     * @param {Object} data - Données de l'événement / période
     */
    constructor(data = {}) {
        this.id = data.id || "tlp_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
        this.title = data.title || "";
        this.description = data.description || "";
        this.content = data.content || ""; // Rich text
        
        // Dates (peuvent être numériques pour les univers fictifs ou ISO pour le réel)
        this.startDate = data.startDate || 0; // Point de départ (nombre ou ISO)
        this.endDate = data.endDate || null;  // Si null, c'est un événement Ponctuel (point), sinon une Période (barre)
        
        this.trackId = data.trackId || "default";
        this.color = data.color || "#d4af37";
        this.textColor = data.textColor || "#ffffff";
        // Styles visuels: 'solid' | 'gradient' | 'outline' | 'striped' | 'arrow' | 'pill'
        this.style = data.style || "solid";
        this.icon = data.icon || "circle";

        this.characters = data.characters || [];
        this.sceneId = data.sceneId || null;
        this.worldId = data.worldId || null;

        this.tags = data.tags || [];
        this.isLocked = data.isLocked || false;
        // Afficher une bande colorée sur toute la hauteur de la timeline
        this.showBand = data.showBand || false;

    }

    /**
     * Vérifie si l'élément est une période (durée).
     */
    isPeriod() {
        return this.endDate !== null && this.endDate !== this.startDate;
    }

    /**
     * Calcule la durée.
     */
    getDuration() {
        if (!this.isPeriod()) return 0;
        return this.endDate - this.startDate;
    }
}

/**
 * @class TimelineProTrack
 * @description Modèle pour une piste (lane) de la chronologie.
 */
class TimelineProTrack {
    constructor(data = {}) {
        this.id = data.id || "trk_" + Date.now();
        this.title = data.title || "Nouvelle Piste";
        this.color = data.color || "var(--bg-secondary)";
        this.order = data.order || 0;
        this.isHidden = data.isHidden || false;
        this.isPinned = data.isPinned || false;
    }
}
