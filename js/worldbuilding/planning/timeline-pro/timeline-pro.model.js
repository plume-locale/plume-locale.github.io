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
        this.startDate = (data.startDate !== undefined) ? data.startDate : 0; 
        this.endDate   = (data.endDate !== undefined)   ? data.endDate   : null;  
        
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
        // Si true, l'événement est considéré comme une Ère/Âge de fond
        this.isEpoch = data.isEpoch || false;

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
 * @class TimelineProLink
 * @description Modèle pour une liaison Bézier entre deux événements.
 */
class TimelineProLink {
    constructor(data = {}) {
        this.id        = data.id        || 'lnk_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
        this.fromId    = data.fromId    || null;   // ID de l'événement source
        this.toId      = data.toId      || null;   // ID de l'événement cible
        this.color     = data.color     || null;   // null = couleur auto selon type
        // Type sémantique : 'causal' | 'temporal' | 'contradicts' | 'parallel' | 'triggers' | 'custom'
        this.type      = data.type      || 'causal';
        // Motif du trait : 'solid' | 'dashed' | 'dotted'
        this.pattern   = data.pattern   || 'solid';
        // Extrémités : 'none' | 'arrow' | 'circle' | 'diamond'
        this.capStart  = data.capStart  || 'none';
        this.capEnd    = data.capEnd    || 'arrow';
        // Courbure : 0 = droite, valeurs + grandes = courbe plus prononcée (en px relatifs à la hauteur)
        this.curvature = data.curvature !== undefined ? data.curvature : 80;
        this.label     = data.label     || '';
        this.width     = data.width     || 2;
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
