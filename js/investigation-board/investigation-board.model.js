/**
 * [MVVM : Investigation Board Model]
 * Concepts clés :
 * - Fact : Une vérité objective (Indice, Preuve, Événement).
 * - Knowledge : Ce qu'un personnage SAIT à propos d'un Fact à un moment donné (Scène).
 * - MMO : Mobile, Means, Opportunity (Liens entre Suspect et Crime).
 */

const InvestigationRepository = {

    // ============================================
    // DATA STRUCTURES
    // ============================================

    /**
     * Crée un nouveau Cas d'investigation.
     * Un Cas représente une affaire unique (meurtre, vol, etc.).
     */
    createCase: function (data = {}) {
        const now = Date.now();
        return {
            id: data.id || 'case_' + now + '_' + Math.random().toString(36).substr(2, 9),
            title: data.title || Localization.t('investigation.model.default.case_title'),
            description: data.description || '',
            status: data.status || 'open', // open, in_progress, solved, closed
            phase: data.phase || 'collection', // collection, analysis, confrontation, resolution
            victimId: data.victimId || null,
            guiltySuspectId: data.guiltySuspectId || null,
            crimeType: data.crimeType || 'murder',
            createdAt: data.createdAt || new Date().toISOString()
        };
    },

    /**
     * Crée un nouveau Fait (Fact/Clue).
     * Représente une entité de vérité dans l'histoire.
     */
    createFact: function (data = {}) {
        const now = Date.now();
        return {
            id: data.id || 'fact_' + now + '_' + Math.random().toString(36).substr(2, 9),
            type: data.type || 'clue', // clue, event, object, testimony
            label: data.label || Localization.t('investigation.model.default.fact_label'),
            description: data.description || '',
            isHidden: data.isHidden || false, // Si vrai, c'est un SECRET pour le lecteur par défaut
            truthStatus: data.truthStatus || 'verified', // verified, disputed, false (red herring)
            createdAt: data.createdAt || new Date().toISOString(),

            // --- CONTEXTE NARRATIF (Phase 3) ---
            relatedCharacterIds: data.relatedCharacterIds || [], // Liste d'IDs de personnages liés
            relatedLocationIds: data.relatedLocationIds || [],   // Liste d'IDs de lieux
            relatedArcId: data.relatedArcId || null,             // ID de l'arc narratif concerné

            // --- EVOLUTION TEMPORELLE (Phase 3) ---
            timeline: data.timeline || [] // Array<{ sceneId, state, description, date }>
        };
    },

    /**
     * Crée une entrée de Connaissance (Knowledge Entry).
     * Relie un Personnage à un Fait pour une Scène donnée.
     */
    createKnowledgeEntry: function (characterId, factId, sceneId, state = 'ignorant') {
        return {
            id: `k_${characterId}_${factId}_${sceneId}`,
            characterId,
            factId,
            sceneId,
            state, // ignorant, suspicious, knows, misled (croit un mensonge)
            sourceId: null, // Qui lui a dit ? Ou comment il l'a appris ? (Facultatif)
            notes: ''
        };
    },

    /**
     * Crée un lien MMO (Mobile, Means, Opportunity).
     * Relie un Suspect à une Victime/Crime.
     */
    createSuspectLink: function (suspectId, victimId, sceneId = null) {
        return {
            id: `mmo_${suspectId}_${victimId}_${sceneId || 'start'}`,
            suspectId,
            victimId,
            sceneId, // null = Initial state / Global knowledge
            motive: {
                level: 0, // 0-10
                description: '',
                relatedFactIds: [] // Preuves du mobile
            },
            means: {
                level: 0, // 0-10 (Changed from isPossible to level for consistency with UI)
                description: '',
                relatedFactIds: [] // Preuves du moyen (arme...)
            },
            opportunity: {
                level: 0, // 0-10
                description: '',
                alibiId: null, // Lien vers un Fait de type Alibi
                relatedFactIds: []
            }
        };
    }
};

// Export global pour l'instant (pattern hérité du projet)
window.InvestigationRepository = InvestigationRepository;
