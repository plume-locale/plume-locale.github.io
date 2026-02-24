/**
 * @file mobile-menu.viewmodel.js
 * @description ViewModel pour la gestion de la logique des menus mobiles et barres d'outils.
 */

const MobileMenuViewModel = {
    /**
     * Bascule l'état de la sidebar.
     * @param {string} [targetTab] - 'structure' | 'navigation'
     * @returns {boolean} Nouvel état (ouvert/fermé).
     */
    toggleSidebar: function (targetTab) {
        const state = MobileMenuRepository.getState();
        const currentState = state.isSidebarOpen;
        const currentTab = state.activeBottomNavItem;

        let newState;
        let newTab = targetTab || 'structure';

        // Si on clique sur le même onglet alors que c'est déjà ouvert -> on ferme
        if (currentState && currentTab === newTab) {
            newState = false;
            newTab = null;
        } else {
            newState = true;
        }

        MobileMenuRepository.updateState({
            isSidebarOpen: newState,
            activeBottomNavItem: newTab
        });

        if (newState) {
            MobileMenuView.openSidebar(newTab);
            // Appliquer l'état de l'accordéon selon l'onglet
            if (typeof setSidebarAccordion === 'function') {
                setSidebarAccordion(newTab === 'navigation');
            }
        } else {
            MobileMenuView.closeSidebar();
        }

        MobileMenuView.updateBottomNavActiveState(newTab);
        return newState;
    },

    /**
     * Ferme la sidebar si elle est ouverte.
     */
    closeSidebar: function () {
        const state = MobileMenuRepository.getState();
        if (state.isSidebarOpen) {
            MobileMenuRepository.updateState({ isSidebarOpen: false, activeBottomNavItem: null });
            MobileMenuView.closeSidebar();
            MobileMenuView.updateBottomNavActiveState(null);
        }
    },

    /**
     * [MVVM: ViewModel] Bascule l'état du bottom sheet outils.
     */
    toggleToolsSheet: function () {
        const currentState = MobileMenuRepository.getState().isToolsSheetOpen;
        const newState = !currentState;
        MobileMenuRepository.updateState({
            isToolsSheetOpen: newState,
            activeBottomNavItem: newState ? 'tools' : null
        });
        MobileMenuView.updateToolsSheet(newState);
        MobileMenuView.updateBottomNavActiveState(
            MobileMenuRepository.getState().activeBottomNavItem
        );
    },

    /**
     * [MVVM: ViewModel] Ferme le bottom sheet outils si ouvert.
     */
    closeToolsSheet: function () {
        const state = MobileMenuRepository.getState();
        if (state.isToolsSheetOpen) {
            MobileMenuRepository.updateState({ isToolsSheetOpen: false, activeBottomNavItem: null });
            MobileMenuView.updateToolsSheet(false);
            MobileMenuView.updateBottomNavActiveState(null);
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
            this.closeSidebar();
            this.closeToolsSheet();

            // On peut aussi vouloir fermer l'overlay explicitement si besoin
            MobileMenuView.ensureDesktopState();
        }
    }
};
