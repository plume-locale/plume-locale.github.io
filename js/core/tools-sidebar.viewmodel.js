/**
 * [MVVM : Tools Sidebar ViewModel]
 * Coordonne la mise à jour des badges dans la barre d'outils verticale (toolsSidebar).
 */

const ToolsSidebarViewModel = {
    /**
     * Met à jour tous les badges en fonction de la scène courante.
     */
    updateAllBadges: function () {
        if (typeof currentSceneId === 'undefined' || !currentSceneId) {
            this.hideAllBadges();
            return;
        }

        const sceneId = currentSceneId;
        const current = this.getSceneById(sceneId);
        if (!current) {
            this.hideAllBadges();
            return;
        }

        // 1. Versions
        this.updateBadge('toolVersionsBadge', current.scene.versions ? current.scene.versions.length : 0);

        // 2. Annotations & TODOs (already partially handled by RevisionViewModel, but unified here)
        if (typeof RevisionViewModel !== 'undefined' && RevisionViewModel.updateAnnotationsButton) {
            RevisionViewModel.updateAnnotationsButton();
        }

        // 3. Arcs
        this.updateArcsBadge(sceneId);

        // 4. Plot Grid
        this.updatePlotBadge(sceneId);

        // 5. Investigation
        this.updateInvestigationBadge(sceneId);

        // 6. Links (Personnages, Univers)
        this.updateLinksBadge(sceneId);
    },

    /**
     * Cache tous les badges.
     */
    hideAllBadges: function () {
        const badges = [
            'toolVersionsBadge', 'toolAnnotationsBadge', 'toolTodosBadge',
            'toolArcsBadge', 'toolPlotBadge', 'toolInvestigationBadge', 'toolLinksBadge'
        ];
        badges.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });
    },

    /**
     * Met à jour un badge spécifique.
     */
    updateBadge: function (id, count) {
        const el = document.getElementById(id);
        if (!el) return;

        if (count > 0) {
            el.style.display = 'inline';
            el.textContent = count > 99 ? '99+' : count;
        } else {
            el.style.display = 'none';
        }
    },

    /**
     * Compte les arcs présents dans la scène.
     */
    updateArcsBadge: function (sceneId) {
        if (typeof ArcRepository === 'undefined') return;

        const allArcs = ArcRepository.getAll();
        const count = allArcs.filter(arc =>
            arc.scenePresence && arc.scenePresence.some(p => p.sceneId == sceneId)
        ).length;

        this.updateBadge('toolArcsBadge', count);
    },

    /**
     * Compte les cartes d'intrigue pour la scène.
     */
    updatePlotBadge: function (sceneId) {
        if (typeof PlotGridViewModel === 'undefined') return;

        PlotGridViewModel.init();
        const data = PlotGridViewModel.getGridData();
        const structuralRow = data.rows.find(r => r.type === 'structure' && r.structureId == sceneId);

        if (structuralRow) {
            const cards = PlotGridViewModel.getCardsByRow(structuralRow.id);
            this.updateBadge('toolPlotBadge', cards.length);
        } else {
            this.updateBadge('toolPlotBadge', 0);
        }
    },

    /**
     * Compte les faits d'enquête pour la scène.
     */
    updateInvestigationBadge: function (sceneId) {
        if (typeof InvestigationStore === 'undefined') return;

        InvestigationStore.init();
        const facts = InvestigationStore.getFacts();
        let count = 0;

        facts.forEach(fact => {
            if (fact.timeline && fact.timeline.some(step => step.sceneId == sceneId)) {
                count++;
            }
        });

        // Also check MMO presence (characters in scene)
        // If there are characters in the scene and at least one fact, show a dot or count
        // For now, only count timeline matches
        this.updateBadge('toolInvestigationBadge', count);
    },

    /**
     * Compte les liens (personnages, lieux) dans la scène.
     */
    updateLinksBadge: function (sceneId) {
        const current = this.getSceneById(sceneId);
        if (!current || !current.scene) return;

        const scene = current.scene;

        // Use a set of "Category:ID" to be absolutely sure we don't double count 
        // if some module uses multiple arrays for the same entity.
        const allLinks = new Set();

        // Validation sets (to skip ghost/deleted IDs)
        const validChars = new Set((project.characters || []).map(c => String(c.id)));
        const validElems = new Set((project.world || []).map(e => String(e.id)));

        const validLocs = new Set();
        if (project.locations) project.locations.forEach(l => validLocs.add(String(l.id)));
        if (project.maps) {
            project.maps.forEach(m => {
                if (m.locations) m.locations.forEach(l => validLocs.add(String(l.id)));
            });
        }

        const validEvents = new Set();
        if (project.events) project.events.forEach(e => validEvents.add(String(e.id)));
        if (project.timeline) project.timeline.forEach(e => validEvents.add(String(e.id)));

        (scene.confirmedPresentCharacters || []).forEach(id => {
            if (validChars.has(String(id))) allLinks.add(`char:${id}`);
        });
        (scene.suggestedCharacters || []).forEach(id => {
            if (validChars.has(String(id))) allLinks.add(`char:${id}`);
        });
        (scene.linkedElements || []).forEach(id => {
            if (validElems.has(String(id))) allLinks.add(`elem:${id}`);
        });
        (scene.locations || []).forEach(id => {
            if (validLocs.has(String(id))) allLinks.add(`loc:${id}`);
        });
        (scene.events || []).forEach(id => {
            if (validEvents.has(String(id))) allLinks.add(`event:${id}`);
        });

        this.updateBadge('toolLinksBadge', allLinks.size);
    },

    /**
     * Helper pour récupérer la scène par son ID.
     */
    getSceneById: function (sceneId) {
        if (typeof project === 'undefined' || !project) return null;
        for (const act of project.acts) {
            for (const chapter of act.chapters) {
                const scene = chapter.scenes.find(s => s.id == sceneId);
                if (scene) return { act, chapter, scene };
            }
        }
        return null;
    }
};

// Initialisation globale
window.ToolsSidebarViewModel = ToolsSidebarViewModel;
