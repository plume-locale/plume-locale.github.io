/**
 * [MVVM : ViewModel]
 * Narrative Overview - Business logic and data transformation
 *
 * Gère la logique de présentation pour l'aperçu narratif :
 * - Chargement et organisation des passages
 * - État d'expansion/collapse des actes
 * - Passage actif dans l'éditeur
 * - Statistiques et filtrage
 */

class NarrativeOverviewViewModel {
    /**
     * Constructeur du ViewModel
     *
     * @param {Object} repository - Instance du repository
     */
    constructor(repository) {
        this.repository = repository;
        this.passages = [];
        this.collapsedActs = new Set();     // IDs des actes repliés
        this.activePassageId = null;        // ID du passage actuellement actif
        this.compactMode = false;           // Mode compact (bandelettes label + mots)
    }

    /**
     * Charge les données depuis le repository
     *
     * @returns {Array} Liste des passages chargés
     */
    loadData() {
        this.passages = this.repository.extractAllPassages();
        return this.passages;
    }

    /**
     * Recharge les données (alias pour loadData)
     *
     * @returns {Array} Liste des passages rechargés
     */
    refresh() {
        return this.loadData();
    }

    /**
     * Groupe les passages par acte
     *
     * @returns {Array} Liste d'objets { actId, actTitle, passages }
     */
    getPassagesByAct() {
        const byAct = new Map();

        // Initialiser un groupe pour CHAQUE acte du projet (même vides)
        if (typeof project !== 'undefined' && project && project.acts) {
            project.acts.forEach(act => {
                byAct.set(act.id, {
                    actId: act.id,
                    actTitle: act.title,
                    passages: []
                });
            });
        }

        this.passages.forEach(passage => {
            if (!byAct.has(passage.actId)) {
                byAct.set(passage.actId, {
                    actId: passage.actId,
                    actTitle: passage.actTitle,
                    passages: []
                });
            }
            byAct.get(passage.actId).passages.push(passage);
        });

        // Retourner sous forme de tableau, ordre d'insertion préservé par Map
        return Array.from(byAct.values());
    }

    /**
     * Toggle l'état d'expansion d'un acte
     *
     * @param {number} actId - ID de l'acte
     * @returns {boolean} Nouvel état (true = expanded, false = collapsed)
     */
    toggleActCollapse(actId) {
        if (this.collapsedActs.has(actId)) {
            this.collapsedActs.delete(actId);
            return true; // Expanded
        } else {
            this.collapsedActs.add(actId);
            return false; // Collapsed
        }
    }

    /**
     * Vérifie si un acte est replié
     *
     * @param {number} actId - ID de l'acte
     * @returns {boolean} True si l'acte est replié
     */
    isActCollapsed(actId) {
        return this.collapsedActs.has(actId);
    }

    /**
     * Toggle le mode compact
     *
     * @returns {boolean} Nouvel état (true = compact, false = normal)
     */
    toggleCompactMode() {
        this.compactMode = !this.compactMode;
        return this.compactMode;
    }

    /**
     * Replie tous les actes
     */
    collapseAll() {
        const actGroups = this.getPassagesByAct();
        actGroups.forEach(group => {
            this.collapsedActs.add(group.actId);
        });
    }

    /**
     * Déplie tous les actes
     */
    expandAll() {
        this.collapsedActs.clear();
    }

    /**
     * Définit le passage actif
     *
     * @param {string} passageId - ID du passage
     */
    setActivePassage(passageId) {
        this.activePassageId = passageId;
    }

    /**
     * Récupère le passage actif
     *
     * @returns {Object|null} Objet passage ou null
     */
    getActivePassage() {
        if (!this.activePassageId) return null;
        return this.passages.find(p => p.id === this.activePassageId) || null;
    }

    /**
     * Obtient les statistiques globales
     *
     * @returns {Object} Objet avec total, structureBlocks, regular
     */
    getStatistics() {
        const total = this.passages.length;
        const structureBlocks = this.passages.filter(
            p => p.type === NarrativeOverviewModel.PASSAGE_TYPES.STRUCTURE_BLOCK
        ).length;
        const regular = total - structureBlocks;

        const totalWords = this.passages.reduce((sum, p) => sum + (p.wordCount || 0), 0);

        return {
            total,
            structureBlocks,
            regular,
            totalWords
        };
    }

    /**
     * Filtre les passages par type
     *
     * @param {string} type - Type de passage (REGULAR ou STRUCTURE_BLOCK)
     * @returns {Array} Liste filtrée
     */
    getPassagesByType(type) {
        return this.passages.filter(p => p.type === type);
    }

    /**
     * Recherche des passages par texte
     *
     * @param {string} query - Texte à rechercher
     * @returns {Array} Passages correspondants
     */
    searchPassages(query) {
        if (!query || query.trim() === '') return this.passages;

        const lowerQuery = query.toLowerCase();

        return this.passages.filter(passage => {
            // Recherche dans le contenu
            if (passage.fullContent && passage.fullContent.toLowerCase().includes(lowerQuery)) {
                return true;
            }

            // Recherche dans le label (pour structure blocks)
            if (passage.label && passage.label.toLowerCase().includes(lowerQuery)) {
                return true;
            }

            // Recherche dans les titres
            if (passage.sceneTitle && passage.sceneTitle.toLowerCase().includes(lowerQuery)) {
                return true;
            }

            return false;
        });
    }

    /**
     * Obtient le passage suivant dans la liste
     *
     * @param {string} currentPassageId - ID du passage actuel
     * @returns {Object|null} Passage suivant ou null
     */
    getNextPassage(currentPassageId) {
        const index = this.passages.findIndex(p => p.id === currentPassageId);
        if (index === -1 || index === this.passages.length - 1) return null;
        return this.passages[index + 1];
    }

    /**
     * Obtient le passage précédent dans la liste
     *
     * @param {string} currentPassageId - ID du passage actuel
     * @returns {Object|null} Passage précédent ou null
     */
    getPreviousPassage(currentPassageId) {
        const index = this.passages.findIndex(p => p.id === currentPassageId);
        if (index <= 0) return null;
        return this.passages[index - 1];
    }

    /**
     * Obtient les passages d'une scène spécifique
     *
     * @param {number} actId - ID de l'acte
     * @param {number} chapterId - ID du chapitre
     * @param {number} sceneId - ID de la scène
     * @returns {Array} Passages de cette scène
     */
    getPassagesForScene(actId, chapterId, sceneId) {
        return this.passages.filter(p =>
            p.actId === actId &&
            p.chapterId === chapterId &&
            p.sceneId === sceneId
        );
    }
}
