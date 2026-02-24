/**
 * [MVVM : Handlers]
 * Narrative Overview - Event handlers
 *
 * Gère les interactions utilisateur :
 * - Toggle des groupes d'actes
 * - Navigation vers les passages
 * - Rafraîchissement des données
 */

const NarrativeOverviewHandlers = {

    /**
     * Toggle le mode compact/détaillé
     */
    toggleCompactMode() {
        const viewModel = window.narrativeOverviewViewModel;
        const view = window.narrativeOverviewView;

        if (!viewModel || !view) return;

        viewModel.toggleCompactMode();
        view.render();
    },

    /**
     * Toggle l'expansion/collapse d'un groupe d'acte
     *
     * @param {number} actId - ID de l'acte à toggle
     */
    toggleAct(actId) {
        const viewModel = window.narrativeOverviewViewModel;
        const view = window.narrativeOverviewView;

        if (!viewModel || !view) {
            console.warn('[NarrativeOverviewHandlers] ViewModel or View not initialized');
            return;
        }

        // Toggle l'état dans le ViewModel
        const isExpanded = viewModel.toggleActCollapse(actId);

        // Mettre à jour uniquement l'icône et la liste (évite re-render complet)
        view.updateActIcon(actId, isExpanded);
    },

    /**
     * Navigue vers un passage spécifique dans l'éditeur
     *
     * @param {string} passageId - ID du passage
     */
    navigateToPassage(passageId) {
        const viewModel = window.narrativeOverviewViewModel;
        const view = window.narrativeOverviewView;

        if (!viewModel || !view) {
            console.warn('[NarrativeOverviewHandlers] ViewModel or View not initialized');
            return;
        }

        // Récupérer les informations du passage
        const passage = viewModel.passages.find(p => p.id === passageId);
        if (!passage) {
            console.warn('[NarrativeOverviewHandlers] Passage not found:', passageId);
            return;
        }

        // Mettre à jour l'état actif
        viewModel.setActivePassage(passageId);
        view.updateActivePassage(passageId);

        // Navigation vers la scène dans l'éditeur
        this.scrollToPassageInEditor(passage);
    },

    /**
     * Fait défiler l'éditeur vers le passage spécifique
     *
     * @param {Object} passage - Objet passage
     */
    scrollToPassageInEditor(passage) {
        // Déterminer le mode d'édition actuel
        const currentView = typeof currentSection !== 'undefined' ? currentSection : 'editor';

        // Si on n'est pas dans l'éditeur, y naviguer d'abord
        if (currentView !== 'editor') {
            if (typeof navigateTo === 'function') {
                navigateTo('editor');
            }
        }

        // Attendre un court instant pour que la navigation se fasse
        setTimeout(() => {
            // Charger la scène si nécessaire (fonction existante du projet)
            if (typeof loadScene === 'function') {
                loadScene(passage.actId, passage.chapterId, passage.sceneId);
            }

            // Attendre que la scène soit chargée avant de scroller
            setTimeout(() => {
                this.findAndHighlightPassage(passage);
            }, 300);
        }, 100);
    },

    /**
     * Trouve et met en surbrillance le passage dans l'éditeur
     *
     * @param {Object} passage - Objet passage
     */
    findAndHighlightPassage(passage) {
        let targetElement = null;

        // Stratégie 1 : Si c'est un structure block, chercher par label
        if (passage.type === NarrativeOverviewModel.PASSAGE_TYPES.STRUCTURE_BLOCK && passage.label) {
            // Chercher dans tous les structure blocks visibles
            const structureBlocks = document.querySelectorAll('.structure-block');
            targetElement = Array.from(structureBlocks).find(block => {
                const labelEl = block.querySelector('.structure-block-label');
                if (!labelEl) return false;

                const blockLabel = labelEl.textContent.trim();
                return blockLabel === passage.label;
            });
        }

        // Stratégie 2 : Chercher le bloc de scène par data-scene-id
        if (!targetElement) {
            targetElement = document.querySelector(`[data-scene-id="${passage.sceneId}"]`);
        }

        // Si trouvé, scroller et mettre en surbrillance
        if (targetElement) {
            // Scroll vers l'élément
            targetElement.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
                inline: 'nearest'
            });

            // Appliquer un effet de surbrillance temporaire
            this.highlightElement(targetElement);
        } else {
            console.warn('[NarrativeOverviewHandlers] Could not find passage in editor');
        }
    },

    /**
     * Applique un effet de surbrillance temporaire à un élément
     *
     * @param {HTMLElement} element - Élément à mettre en surbrillance
     */
    highlightElement(element) {
        // Sauvegarder le box-shadow original
        const originalBoxShadow = element.style.boxShadow || '';

        // Appliquer la surbrillance dorée
        element.style.transition = 'box-shadow 0.3s ease';
        element.style.boxShadow = '0 0 20px rgba(255, 217, 61, 0.6)';

        // Retirer après 2 secondes
        setTimeout(() => {
            element.style.boxShadow = originalBoxShadow;

            // Nettoyer après la transition
            setTimeout(() => {
                element.style.transition = '';
            }, 300);
        }, 2000);
    },

    /**
     * Rafraîchit les données de l'aperçu narratif
     * À appeler après modification du contenu des scènes
     */
    refresh() {
        const viewModel = window.narrativeOverviewViewModel;
        const view = window.narrativeOverviewView;

        if (!viewModel || !view) {
            console.warn('[NarrativeOverviewHandlers] ViewModel or View not initialized');
            return;
        }

        // Recharger les données
        viewModel.loadData();

        // Re-render complet
        view.render();
    },

    /**
     * Développe tous les groupes d'actes
     */
    expandAll() {
        const viewModel = window.narrativeOverviewViewModel;
        const view = window.narrativeOverviewView;

        if (!viewModel || !view) return;

        viewModel.expandAll();
        view.render();
    },

    /**
     * Replie tous les groupes d'actes
     */
    collapseAll() {
        const viewModel = window.narrativeOverviewViewModel;
        const view = window.narrativeOverviewView;

        if (!viewModel || !view) return;

        viewModel.collapseAll();
        view.render();
    },

    /**
     * Navigue vers le passage suivant
     */
    navigateNext() {
        const viewModel = window.narrativeOverviewViewModel;

        if (!viewModel || !viewModel.activePassageId) return;

        const nextPassage = viewModel.getNextPassage(viewModel.activePassageId);
        if (nextPassage) {
            this.navigateToPassage(nextPassage.id);
        }
    },

    /**
     * Navigue vers le passage précédent
     */
    navigatePrevious() {
        const viewModel = window.narrativeOverviewViewModel;

        if (!viewModel || !viewModel.activePassageId) return;

        const prevPassage = viewModel.getPreviousPassage(viewModel.activePassageId);
        if (prevPassage) {
            this.navigateToPassage(prevPassage.id);
        }
    }
};
