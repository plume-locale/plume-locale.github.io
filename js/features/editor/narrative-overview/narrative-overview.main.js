/**
 * [MVVM : Main]
 * Narrative Overview - Initialization and coordination
 *
 * Point d'entrée du module d'aperçu narratif.
 * Initialise les composants MVVM et configure les écouteurs d'événements.
 */

const NarrativeOverviewMain = {

    /**
     * Indicateur d'initialisation
     */
    initialized: false,

    /**
     * Initialise le module d'aperçu narratif
     */
    init() {
        // Vérifier que le projet est chargé
        if (typeof project === 'undefined' || !project) {
            console.warn('[NarrativeOverviewMain] Project not loaded, deferring initialization');
            // Réessayer après un court délai
            setTimeout(() => this.init(), 500);
            return;
        }

        // Éviter double initialisation
        if (this.initialized) {
            console.warn('[NarrativeOverviewMain] Already initialized');
            return;
        }

        console.log('[NarrativeOverviewMain] Initializing Narrative Overview module');

        // Créer les instances MVVM
        const repository = NarrativeOverviewRepository;
        const viewModel = new NarrativeOverviewViewModel(repository);
        const view = new NarrativeOverviewView(viewModel);

        // Exposer globalement pour les handlers
        window.narrativeOverviewViewModel = viewModel;
        window.narrativeOverviewView = view;
        window.narrativeOverviewRepository = repository;

        // Charger la préférence de visibilité
        const savedVisibility = localStorage.getItem('plume_narrative_overview_visible');
        const shouldShow = savedVisibility === 'true';

        // Appliquer la visibilité initiale
        const sidebar = document.getElementById('narrativeOverviewSidebar');
        if (sidebar) {
            if (shouldShow) {
                sidebar.classList.remove('hidden');
            } else {
                sidebar.classList.add('hidden');
            }
        }

        // Charger et rendre les données
        this.refresh();

        // Configurer les écouteurs d'événements
        this.setupEventListeners();

        // Marquer comme initialisé
        this.initialized = true;

        console.log('[NarrativeOverviewMain] Initialization complete');
    },

    /**
     * Configure les écouteurs d'événements globaux
     */
    setupEventListeners() {
        // Hook sur updateSceneContent pour rafraîchir après modifications
        if (typeof updateSceneContent === 'function') {
            const originalUpdateSceneContent = updateSceneContent;

            window.updateSceneContent = function(...args) {
                // Appeler la fonction originale
                const result = originalUpdateSceneContent.apply(this, args);

                // Rafraîchir l'aperçu narratif avec un léger délai
                setTimeout(() => {
                    NarrativeOverviewHandlers.refresh();
                }, 100);

                return result;
            };
        }

        // Hook sur updateActSceneContent (mode éditeur complet)
        if (typeof updateActSceneContent === 'function') {
            const originalUpdateActSceneContent = updateActSceneContent;

            window.updateActSceneContent = function(...args) {
                const result = originalUpdateActSceneContent.apply(this, args);

                setTimeout(() => {
                    NarrativeOverviewHandlers.refresh();
                }, 100);

                return result;
            };
        }

        // Écouter les changements de navigation pour déterminer si on affiche le sidebar
        // (optionnel : le sidebar peut rester visible sur toutes les vues ou seulement en mode éditeur)
        if (typeof navigateTo !== 'undefined') {
            const originalNavigateTo = navigateTo;

            window.navigateTo = function(section) {
                const result = originalNavigateTo.apply(this, arguments);

                // Rafraîchir si on navigue vers l'éditeur
                if (section === 'editor') {
                    setTimeout(() => {
                        NarrativeOverviewHandlers.refresh();
                    }, 300);
                }

                return result;
            };
        }

        // Hook sur switchToProject pour rafraîchir au changement de projet
        if (typeof switchToProject === 'function') {
            const originalSwitchToProject = switchToProject;

            window.switchToProject = function(...args) {
                const result = originalSwitchToProject.apply(this, args);

                // Rafraîchir après le changement de projet (attendre que project soit mis à jour)
                setTimeout(() => {
                    NarrativeOverviewMain.refresh();
                }, 300);

                return result;
            };
        }

        // Raccourcis clavier (optionnel)
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + Shift + O : Toggle sidebar
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'O') {
                e.preventDefault();
                this.toggleVisibility();
            }
        });

        console.log('[NarrativeOverviewMain] Event listeners configured');
    },

    /**
     * Rafraîchit l'aperçu narratif
     */
    refresh() {
        const viewModel = window.narrativeOverviewViewModel;
        const view = window.narrativeOverviewView;

        if (!viewModel || !view) {
            console.warn('[NarrativeOverviewMain] Components not initialized');
            return;
        }

        try {
            // Recharger les données
            viewModel.loadData();

            // Re-render
            view.render();

            console.log(`[NarrativeOverviewMain] Refreshed with ${viewModel.passages.length} passages`);
        } catch (error) {
            console.error('[NarrativeOverviewMain] Error during refresh:', error);
        }
    },

    /**
     * Toggle la visibilité du sidebar
     */
    toggleVisibility() {
        const sidebar = document.getElementById('narrativeOverviewSidebar');
        if (!sidebar) {
            console.warn('[NarrativeOverviewMain] Sidebar container not found');
            return;
        }

        // Toggle la classe hidden
        const isHidden = sidebar.classList.toggle('hidden');
        const isVisible = !isHidden;

        // Sauvegarder la préférence
        localStorage.setItem('plume_narrative_overview_visible', isVisible.toString());

        console.log(`[NarrativeOverviewMain] Sidebar visibility: ${isVisible ? 'visible' : 'hidden'}`);

        // Optionnel : afficher une notification
        if (typeof showNotification === 'function') {
            const message = isVisible
                ? 'Aperçu narratif affiché'
                : 'Aperçu narratif masqué';
            showNotification(message, 'info');
        }
    },

    /**
     * Affiche le sidebar (si masqué)
     */
    show() {
        const sidebar = document.getElementById('narrativeOverviewSidebar');
        if (!sidebar) return;

        sidebar.classList.remove('hidden');
        localStorage.setItem('plume_narrative_overview_visible', 'true');
    },

    /**
     * Masque le sidebar (si affiché)
     */
    hide() {
        const sidebar = document.getElementById('narrativeOverviewSidebar');
        if (!sidebar) return;

        sidebar.classList.add('hidden');
        localStorage.setItem('plume_narrative_overview_visible', 'false');
    },

    /**
     * Vérifie si le sidebar est visible
     *
     * @returns {boolean} True si visible
     */
    isVisible() {
        const sidebar = document.getElementById('narrativeOverviewSidebar');
        if (!sidebar) return false;

        return !sidebar.classList.contains('hidden');
    }
};

// Auto-initialisation au chargement du DOM
document.addEventListener('DOMContentLoaded', () => {
    console.log('[NarrativeOverviewMain] DOM loaded, attempting initialization');

    // Attendre un instant pour que le projet soit chargé
    setTimeout(() => {
        NarrativeOverviewMain.init();
    }, 500);
});
