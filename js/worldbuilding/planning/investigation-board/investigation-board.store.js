/**
 * [MVVM : Investigation Board Store]
 * Centralise l'état du tableau d'enquête et fait le pont avec les données réelles du projet.
 */

const InvestigationStore = {
    _initialized: false,  // Track if store has been initialized this session

    state: {
        // --- MULTI-CASE SUPPORT ---
        cases: [],           // Array of Case objects
        activeCaseId: null,  // Currently selected case ID

        facts: [],           // Facts now linked to cases via caseId
        knowledge: [],       // { characterId, factId, sceneId, state }
        suspectLinks: [],    // { suspectId, victimId, caseId, motive, means, opportunity }
        currentView: 'dashboard', // dashboard, matrix, mmo, registry
        timelineMode: 'default', // default, compact
        filters: {
            characterId: null,
            sceneId: null
        }
    },

    // --- INIT ---
    init: function () {
        // Only initialize once per session to prevent data loss on view switch
        if (this._initialized) {
            console.log("🕵️ InvestigationStore already initialized, skipping load.");
            return;
        }
        this._initialized = true;
        this.load();
        console.log("🕵️ InvestigationStore initialized. Cases:", this.state.cases.length, "Characters:", this.getCharacters().length, "Scenes:", this.getScenes().length);
    },

    // --- DATA ACCESS HELPERS (REAL DATA) ---

    /**
     * Get all characters from the real project.
     * Uses CharacterRepository if available, otherwise fallback to project global.
     */
    getCharacters: function () {
        if (typeof CharacterRepository !== 'undefined') {
            return CharacterRepository.getAll();
        }
        return (window.project && window.project.characters) || [];
    },

    /**
     * Get all scenes from the real project (flat list).
     */
    getScenes: function () {
        if (typeof sceneNavigationRepository !== 'undefined') {
            return sceneNavigationRepository.getFlatScenes().map(item => item.scene);
        }
        // Fallback manual extraction
        let scenes = [];
        if (window.project && window.project.acts) {
            window.project.acts.forEach(act => {
                (act.chapters || []).forEach(chapter => {
                    (chapter.scenes || []).forEach(scene => {
                        scenes.push(scene);
                    });
                });
            });
        }
        return scenes;
    },


    /**
     * Get scenes with their text hierarchy (Act > Chapter).
     * Useful for the Timeline view.
     */
    getScenesWithContext: function () {
        let enrichedScenes = [];

        // Manual extraction to get hierarchy
        if (window.project && window.project.acts) {
            window.project.acts.forEach((act, actIndex) => {
                const actTitle = act.title || `${Localization.t('investigation.common.act')} ${actIndex + 1}`;

                (act.chapters || []).forEach((chapter, chapIndex) => {
                    const chapterTitle = chapter.title || `${Localization.t('investigation.common.chapter')} ${chapIndex + 1}`;

                    (chapter.scenes || []).forEach((scene, sceneIndex) => {
                        enrichedScenes.push({
                            ...scene,
                            actTitle,
                            chapterTitle,
                            index: enrichedScenes.length
                        });
                    });
                });
            });
        } else {
            // Fallback if structure missing (e.g. flat list repo)
            const rawScenes = this.getScenes();
            enrichedScenes = rawScenes.map((s, i) => ({
                ...s,
                actTitle: Localization.t('investigation.common.story'),
                chapterTitle: Localization.t('investigation.common.scenes'),
                index: i
            }));
        }
        return enrichedScenes;
    },

    /**
     * Get all locations/world items from the real project.
     */
    getLocations: function () {
        return (window.project && window.project.world) || [];
    },

    // --- ACTIONS ---

    setCurrentView: function (view) {
        console.log("🖱️ [Store] setCurrentView triggered:", view);
        this.state.currentView = view;
        if (window.InvestigationView) {
            console.log("🔄 [Store] calling renderActiveView");
            window.InvestigationView.renderActiveView(view);
            if (typeof window.InvestigationView.updateToolbar === 'function') {
                console.log("🛠️ [Store] calling updateToolbar");
                window.InvestigationView.updateToolbar(view);
            }
        } else {
            console.error("❌ [Store] InvestigationView not found!");
        }
    },

    setTimelineMode: function (mode) {
        console.log("🖱️ [Store] setTimelineMode triggered:", mode);
        this.state.timelineMode = mode;
        this.save();
        this.refreshCurrentView();
    },

    // --- CASE MANAGEMENT ---

    getCases: function () {
        return this.state.cases;
    },

    getActiveCase: function () {
        return this.state.cases.find(c => c.id === this.state.activeCaseId) || null;
    },

    setActiveCase: function (caseId) {
        this.state.activeCaseId = caseId;
        this.save();
        this.refreshCurrentView();
    },

    createCase: function (data = {}) {
        const newCase = InvestigationRepository.createCase(data);
        this.state.cases.push(newCase);
        // Auto-select if first case
        if (this.state.cases.length === 1) {
            this.state.activeCaseId = newCase.id;
        }
        this.save();
        this.refreshCurrentView();
        return newCase;
    },

    updateCase: function (updatedCase) {
        const index = this.state.cases.findIndex(c => c.id == updatedCase.id);
        if (index !== -1) {
            this.state.cases[index] = { ...this.state.cases[index], ...updatedCase };
            this.save();
            this.refreshCurrentView();
        }
    },

    deleteCase: function (caseId) {
        this.state.cases = this.state.cases.filter(c => c.id != caseId);
        // Also remove related facts, knowledge, and suspectLinks
        this.state.facts = this.state.facts.filter(f => f.caseId != caseId);
        this.state.suspectLinks = this.state.suspectLinks.filter(l => l.caseId != caseId);
        // Reset active case if deleted
        if (this.state.activeCaseId == caseId) {
            this.state.activeCaseId = this.state.cases.length > 0 ? this.state.cases[0].id : null;
        }
        this.save();
        this.refreshCurrentView();
    },

    // --- FACTS MANAGEMENT ---

    getFacts: function () {
        return this.state.facts;
    },

    /**
     * Get facts filtered by active case.
     */
    getActiveCaseFacts: function () {
        if (!this.state.activeCaseId) return [];
        return this.state.facts.filter(f => f.caseId === this.state.activeCaseId);
    },

    getFactById: function (id) {
        return this.state.facts.find(f => f.id == id);
    },

    createFact: function (data = {}) {
        const now = Date.now();
        return {
            id: data.id || 'fact_' + now + '_' + Math.random().toString(36).substr(2, 9),
            caseId: data.caseId || this.state.activeCaseId, // Link to active case
            type: data.type || 'clue',
            label: data.label || Localization.t('investigation.model.default.fact_label'),
            description: data.description || '',
            isHidden: data.isHidden || false,
            truthStatus: data.truthStatus || 'verified',
            createdAt: data.createdAt || new Date().toISOString(),
            relatedCharacterIds: data.relatedCharacterIds || [],
            relatedLocationIds: data.relatedLocationIds || [],
            relatedArcId: data.relatedArcId || null,
            timeline: data.timeline || []
        };
    },

    addFact: function (fact) {
        this.state.facts.push(fact);
        this.save();
        this.refreshCurrentView();
    },

    updateFact: function (updatedFact) {
        const index = this.state.facts.findIndex(f => f.id == updatedFact.id);
        if (index !== -1) {
            this.state.facts[index] = updatedFact;
            this.save();
            this.refreshCurrentView();
        }
    },

    deleteFact: function (factId) {
        this.state.facts = this.state.facts.filter(f => f.id != factId);
        this.state.knowledge = this.state.knowledge.filter(k => k.factId != factId);
        this.save();
        this.refreshCurrentView();
    },

    // --- KNOWLEDGE MATRIX HELPERS ---

    getCharacterKnowledge: function (characterId) {
        return this.state.knowledge.filter(k => k.characterId === characterId);
    },

    setKnowledgeState: function (characterId, factId, sceneId, state) {
        const index = this.state.knowledge.findIndex(k =>
            k.characterId == characterId &&
            k.sceneId == sceneId &&
            k.factId == factId
        );

        if (index !== -1) {
            this.state.knowledge[index].state = state;
        } else {
            this.state.knowledge.push({
                characterId,
                sceneId,
                factId,
                state
            });
        }
        this.save();
        this.refreshCurrentView();
    },

    // --- SUSPECT LINKS (MMO) ---

    getSuspectLinks: function () {
        return this.state.suspectLinks;
    },

    /**
     * Get the MMO state for a suspect at a specific scene.
     * If no entry exists for this exact scene, it finds the most recent one.
     */
    getSuspectLinkAtScene: function (suspectId, victimId, sceneId) {
        // 1. Get ordered list of relevant snapshots (Start -> Current)
        // We use the flat scene list to determine order
        const allScenes = this.getScenes();
        let targetIndex = -1;

        if (sceneId === 'start' || !sceneId) {
            targetIndex = -1;
        } else {
            targetIndex = allScenes.findIndex(s => s.id == sceneId);
            // If scene not found (e.g. demo data mismatch), fallback to end
            if (targetIndex === -1 && sceneId) targetIndex = allScenes.length;
        }

        // Get all raw snapshots for this pair
        const history = this.state.suspectLinks.filter(l =>
            l.suspectId == suspectId && l.victimId == victimId
        );

        if (history.length === 0) return null;

        // 2. Prepare composite result
        let result = {
            suspectId,
            victimId,
            sceneId: sceneId || 'start', // The requested scene
            motive: null,
            means: null,
            opportunity: null
        };

        // Helper to check if we are done
        const isComplete = () => result.motive && result.means && result.opportunity;

        // 3. Iterate backwards from Target Context to Start
        // Potential Sources:
        // A. Snapshot explicitly at Current Scene
        // B. Snapshot at Previous Scenes...
        // C. Snapshot at Start (null/'start')

        // We build a list of "Candidates" snapshots in reverse chronological order
        // 1. Current Scene
        // 2. Preceding Scenes (descending)
        // 3. Start

        const candidates = [];

        // Add current scene snapshot(s)
        const currentSnap = history.find(l => l.sceneId == sceneId || (!sceneId && (!l.sceneId || l.sceneId === 'start')));
        if (currentSnap) candidates.push({ snap: currentSnap, isLocal: true });

        // Add past scenes snapshots
        for (let i = targetIndex - 1; i >= 0; i--) {
            const sId = allScenes[i].id;
            const snap = history.find(l => l.sceneId == sId);
            if (snap) candidates.push({ snap: snap, isLocal: false });
        }

        // Add start snapshot (if not already added as current)
        if (sceneId !== 'start' && sceneId) {
            const startSnap = history.find(l => !l.sceneId || l.sceneId === 'start');
            if (startSnap) candidates.push({ snap: startSnap, isLocal: false });
        }

        // 4. Resolve Attributes
        for (const candidate of candidates) {
            if (isComplete()) break; // Optimization

            const { snap, isLocal } = candidate;

            // Check Motive
            if (!result.motive && snap.motive) {
                result.motive = { ...snap.motive, _inherited: !isLocal };
            }
            // Check Means
            if (!result.means && snap.means) {
                result.means = { ...snap.means, _inherited: !isLocal };
            }
            // Check Opportunity
            if (!result.opportunity && snap.opportunity) {
                result.opportunity = { ...snap.opportunity, _inherited: !isLocal };
            }
        }

        return result;
    },

    /**
     * Updates or creates a link for a specific scene (Snapshot).
     */
    updateSuspectLink: function (linkData) {
        const index = this.state.suspectLinks.findIndex(l =>
            l.suspectId == linkData.suspectId &&
            l.victimId == linkData.victimId &&
            l.sceneId == linkData.sceneId // Exact match on scene (loose equality)
        );

        if (index !== -1) {
            this.state.suspectLinks[index] = { ...this.state.suspectLinks[index], ...linkData };
        } else {
            // New snapshot for this scene
            // If ID is missing, generate one valid ID
            if (!linkData.id) {
                linkData.id = `mmo_${linkData.suspectId}_${linkData.victimId}_${linkData.sceneId || 'start'}`;
            }
            this.state.suspectLinks.push(linkData);
        }
        this.save();
        this.refreshCurrentView();
    },

    /**
     * Resets all MMO data to 0 and clears descriptions.
     */
    resetAllMMO: function () {
        this.state.suspectLinks.forEach(link => {
            ['motive', 'means', 'opportunity'].forEach(type => {
                if (link[type]) {
                    link[type].level = 0;
                    link[type].description = '';
                }
            });
        });
        this.save();
        this.refreshCurrentView();
    },

    deleteSuspectSnapshot: function (suspectId, victimId, sceneId) {
        if (!sceneId || sceneId === 'start') return; // Cannot delete start state (it's the root)

        const index = this.state.suspectLinks.findIndex(l =>
            l.suspectId == suspectId &&
            l.victimId == victimId &&
            l.sceneId == sceneId
        );

        if (index !== -1) {
            this.state.suspectLinks.splice(index, 1);
            this.save();
            this.refreshCurrentView();
        }
    },

    // --- STORAGE ---

    save: function () {
        console.log('💾 [InvestigationStore] save() called');

        // Use global project (now unified with window.project)
        if (typeof project !== 'undefined') {
            project.investigationBoard = {
                cases: this.state.cases,
                activeCaseId: this.state.activeCaseId,
                facts: this.state.facts,
                knowledge: this.state.knowledge,
                suspectLinks: this.state.suspectLinks,
                timelineMode: this.state.timelineMode
            };

            console.log('💾 [InvestigationStore] Data updated in project.investigationBoard');

            // Trigger actual persistence to IndexedDB
            if (typeof saveProjectToDB === 'function') {
                console.log('💾 [InvestigationStore] Calling saveProjectToDB...');
                saveProjectToDB(project).then(() => {
                    console.log('✅ [InvestigationStore] saveProjectToDB completed successfully');
                }).catch(err => {
                    console.error('❌ [InvestigationStore] saveProjectToDB failed:', err);
                });
            } else {
                console.warn('⚠️ [InvestigationStore] saveProjectToDB function not available!');
            }
        } else {
            console.warn("⚠️ [InvestigationStore] Cannot save: global project is undefined.");
        }
    },

    load: function () {
        console.log('📂 [InvestigationStore] load() called');
        console.log('📂 [InvestigationStore] window.project exists:', !!window.project);
        console.log('📂 [InvestigationStore] investigationBoard exists:', !!(window.project && window.project.investigationBoard));

        if (window.project && window.project.investigationBoard) {
            const data = window.project.investigationBoard;
            console.log('📂 [InvestigationStore] Loading data:', {
                casesCount: (data.cases || []).length,
                factsCount: (data.facts || []).length
            });
            this.state.cases = data.cases || [];
            this.state.activeCaseId = data.activeCaseId || (this.state.cases.length > 0 ? this.state.cases[0].id : null);
            this.state.facts = data.facts || [];
            this.state.knowledge = data.knowledge || [];
            this.state.suspectLinks = data.suspectLinks || [];
            this.state.timelineMode = data.timelineMode || 'default';
        } else {
            console.log('📂 [InvestigationStore] No saved data found, initializing empty state');
            this.state.cases = [];
            this.state.activeCaseId = null;
            this.state.facts = [];
            this.state.knowledge = [];
            this.state.suspectLinks = [];
        }
    },

    refreshCurrentView: function () {
        // 1. Refresh Investigation Structure Sidebar (independent of main view)
        if (typeof InvestigationSidebarUI !== 'undefined') {
            const sidebar = document.getElementById('sidebarInvestigation');
            if (sidebar && !sidebar.classList.contains('hidden')) {
                const sceneId = InvestigationSidebarUI.activeSceneId || (window.currentSceneId) || null;
                if (sceneId) {
                    console.log("🔄 [Store] Refreshing Investigation Sidebar for scene:", sceneId);
                    InvestigationSidebarUI.renderSidebar(sceneId);
                }
            }
        }

        // 2. Refresh Main Investigation View if active
        if (window.InvestigationView) {
            const container = document.getElementById('investigationContent');

            // Update Header (Tabs + Active Case Info)
            if (typeof window.InvestigationView.updateHeader === 'function') {
                window.InvestigationView.updateHeader();
            }

            // Update Toolbar Active State
            if (typeof window.InvestigationView.updateToolbar === 'function') {
                window.InvestigationView.updateToolbar(this.state.currentView);
            }

            // Force refresh of embedded sidebar if in investigation view
            if (typeof window.InvestigationView.renderSidebar === 'function') {
                window.InvestigationView.renderSidebar();
            }

            // Update Main Content
            if (container) {
                window.InvestigationView.renderActiveView(this.state.currentView);
            }
        }
    }
};

window.InvestigationStore = InvestigationStore;
