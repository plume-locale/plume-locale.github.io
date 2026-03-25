/**
 * @class TimelineProRepository
 * @description Gère l'accès aux données des événements de la chronologie avancée.
 */
class TimelineProRepository {
    /**
     * Récupère tous les événements.
     * @returns {TimelineProModel[]}
     */
    static getAll() {
        if (!project.timelinePro) {
            project.timelinePro = {
                events: [],
                links: [],
                tracks: [
                    { id: 'default', title: Localization.t('timeline.pro.default_track'), order: 0 }
                ],
                config: {
                    zoom: 1,
                    offsetX: 0,
                    showRuler: true
                }
            };
        }
        // Compat : anciennes sauvegardes sans `links`
        if (!project.timelinePro.links) project.timelinePro.links = [];
        return (project.timelinePro.events || []).map(data => new TimelineProModel(data));
    }

    /**
     * Récupère toutes les pistes.
     * @returns {TimelineProTrack[]}
     */
    static getTracks() {
        if (!project.timelinePro || !project.timelinePro.tracks) {
            this.getAll(); // Initialize
        }
        return (project.timelinePro.tracks || []).map(data => new TimelineProTrack(data))
            .sort((a, b) => a.order - b.order);
    }

    /**
     * Récupère un événement par son ID.
     * @param {string} id 
     * @returns {TimelineProModel|null}
     */
    static getById(id) {
        const events = project.timelinePro?.events || [];
        const data = events.find(e => e.id === id);
        return data ? new TimelineProModel(data) : null;
    }

    /**
     * Sauvegarde un événement (création ou mise à jour).
     * @param {TimelineProModel} model 
     */
    static save(model) {
        if (!project.timelinePro) this.getAll();
        
        const index = project.timelinePro.events.findIndex(e => e.id === model.id);
        if (index !== -1) {
            project.timelinePro.events[index] = { ...model };
        } else {
            project.timelinePro.events.push({ ...model });
        }
    }

    /**
     * Supprime un événement par son ID.
     * @param {string} id 
     */
    static delete(id) {
        if (!project.timelinePro) return;
        project.timelinePro.events = project.timelinePro.events.filter(e => e.id !== id);
    }

    /**
     * Sauvegarde une piste.
     * @param {TimelineProTrack} track 
     */
    static saveTrack(track) {
        if (!project.timelinePro) this.getAll();
        const index = project.timelinePro.tracks.findIndex(t => t.id === track.id);
        if (index !== -1) {
            project.timelinePro.tracks[index] = { ...track };
        } else {
            project.timelinePro.tracks.push({ ...track });
        }
    }

    /**
     * Réordonne les pistes selon le tableau d'IDs fourni.
     * @param {string[]} orderedIds
     */
    static reorderTracks(orderedIds) {
        if (!project.timelinePro || !project.timelinePro.tracks) return;
        project.timelinePro.tracks.forEach(t => {
            const idx = orderedIds.indexOf(t.id);
            if (idx !== -1) t.order = idx;
        });
    }

    /**
     * Supprime une piste.
     * @param {string} id 
     */
    static deleteTrack(id) {
        if (!project.timelinePro) return;
        project.timelinePro.tracks = project.timelinePro.tracks.filter(t => t.id !== id);
        // On remet les événements de cette piste sur la piste par défaut
        project.timelinePro.events.forEach(e => {
            if (e.trackId === id) e.trackId = 'default';
        });
    }

    /**
     * Sauvegarde la configuration UI.
     * @param {Object} config 
     */
    static saveConfig(config) {
        if (!project.timelinePro) this.getAll();
        project.timelinePro.config = { ...project.timelinePro.config, ...config };
    }

    /**
     * Récupère la configuration UI.
     * @returns {Object}
     */
    static getConfig() {
        if (!project.timelinePro) this.getAll();
        return project.timelinePro.config || { zoom: 1, offsetX: 0 };
    }

    /**
     * Récupère toutes les liaisons.
     * @returns {TimelineProLink[]}
     */
    static getLinks() {
        if (!project.timelinePro) this.getAll();
        return (project.timelinePro.links || []).map(data => new TimelineProLink(data));
    }

    /**
     * Récupère une liaison par son ID.
     * @param {string} id
     * @returns {TimelineProLink|null}
     */
    static getLinkById(id) {
        const data = (project.timelinePro?.links || []).find(l => l.id === id);
        return data ? new TimelineProLink(data) : null;
    }

    /**
     * Sauvegarde une liaison (création ou mise à jour).
     * @param {TimelineProLink} link
     */
    static saveLink(link) {
        if (!project.timelinePro) this.getAll();
        const idx = project.timelinePro.links.findIndex(l => l.id === link.id);
        if (idx !== -1) {
            project.timelinePro.links[idx] = { ...link };
        } else {
            project.timelinePro.links.push({ ...link });
        }
    }

    /**
     * Supprime une liaison par son ID.
     * @param {string} id
     */
    static deleteLink(id) {
        if (!project.timelinePro) return;
        project.timelinePro.links = project.timelinePro.links.filter(l => l.id !== id);
    }

    /**
     * Supprime toutes les liaisons qui pointent vers un événement supprimé.
     * @param {string} eventId
     */
    static deleteLinksForEvent(eventId) {
        if (!project.timelinePro) return;
        project.timelinePro.links = project.timelinePro.links.filter(
            l => l.fromId !== eventId && l.toId !== eventId
        );
    }
}
