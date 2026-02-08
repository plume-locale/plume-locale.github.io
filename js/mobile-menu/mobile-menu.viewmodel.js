/**
 * @file mobile-menu.viewmodel.js
 * @description ViewModel pour la gestion de la logique des menus mobiles et barres d'outils.
 */

const MobileMenuViewModel = {
    /**
     * Bascule l'état de la sidebar.
     * @returns {boolean} Nouvel état (ouvert/fermé).
     */
    toggleSidebar: function () {
        const currentState = MobileMenuRepository.getState().isSidebarOpen;
        const newState = !currentState;
        MobileMenuRepository.updateState({ isSidebarOpen: newState });

        if (newState) {
            MobileMenuView.openSidebar();
        } else {
            MobileMenuView.closeSidebar();
        }
        return newState;
    },

    /**
     * Ferme la sidebar si elle est ouverte.
     */
    closeSidebar: function () {
        const state = MobileMenuRepository.getState();
        if (state.isSidebarOpen) {
            MobileMenuRepository.updateState({ isSidebarOpen: false });
            MobileMenuView.closeSidebar();
        }
    },

    /**
     * Bascule l'état du menu de navigation mobile.
     */
    toggleNav: function () {
        const currentState = MobileMenuRepository.getState().isNavDropdownActive;
        const newState = !currentState;
        MobileMenuRepository.updateState({ isNavDropdownActive: newState });

        MobileMenuView.updateNavState(newState);

        // Si on ouvre le nav, on pourrait vouloir masquer la sidebar si nécessaire
        // (Logique originale: if nav open, sidebar visibility hidden)
        MobileMenuView.updateSidebarVisibility(!newState);
    },

    /**
     * Ferme le menu de navigation mobile.
     */
    closeNav: function () {
        const state = MobileMenuRepository.getState();
        if (state.isNavDropdownActive) {
            MobileMenuRepository.updateState({ isNavDropdownActive: false });
            MobileMenuView.updateNavState(false);
            MobileMenuView.updateSidebarVisibility(true);
        }
    },

    /**
     * Change la vue active et ferme les menus mobiles.
     * @param {string} view - Identifiant de la vue.
     */
    switchViewMobile: function (view) {
        // Mettre à jour l'item actif dans le menu (UI)
        MobileMenuView.setActiveNavItem(view);

        // Fermer le nav dropdown
        this.closeNav();

        // Changer la vue principale
        if (typeof switchView === 'function') {
            switchView(view);
        }
    },

    /**
     * Bascule la barre d'outils de l'éditeur mobile.
     */
    toggleEditorToolbar: function () {
        const currentState = MobileMenuRepository.getState().isEditorToolbarExpanded;
        const newState = !currentState;
        MobileMenuRepository.updateState({ isEditorToolbarExpanded: newState });

        MobileMenuView.updateEditorToolbar(newState);
    },

    /**
     * Bascule le panneau de liens (personnages/lieux).
     */
    toggleLinksPanel: function () {
        const currentState = MobileMenuRepository.getState().isLinksPanelExpanded;
        const newState = !currentState;
        MobileMenuRepository.updateState({ isLinksPanelExpanded: newState });

        MobileMenuView.updateLinksPanel(newState);
    },

    /**
     * Gère logique lors du redimensionnement de la fenêtre.
     * @param {number} windowWidth 
     */
    handleResize: function (windowWidth) {
        // Si on passe en desktop (> 900px), on reset certains états
        if (windowWidth > 900) {
            // Si on sort du mode "force mobile nav", on ferme sidebar et overlay
            // Note: La logique exacte dépend de 'checkHeaderOverflow' mais ici on gère le resize simple
            this.closeSidebar();

            // On peut aussi vouloir fermer l'overlay explicitement si besoin
            MobileMenuView.ensureDesktopState();
        }
    }
};
