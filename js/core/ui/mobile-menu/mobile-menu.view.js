/**
 * @file mobile-menu.view.js
 * @description Vue pour la gestion DOM des menus mobiles.
 */

const MobileMenuView = {
    /**
     * Initialise les écouteurs d'événements DOM (si nécessaire).
     * Note: Beaucoup d'événements sont déclenchés par des onclick dans le HTML, 
     * donc les fonctions globales dans Main sont importantes.
     */
    init: function () {
        // Observer le resize avec debounce plus long pour éviter les freezes mobile
        let resizeTimeout;
        window.addEventListener('resize', function () {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(function () {
                MobileMenuView.checkHeaderOverflow();
                MobileMenuViewModel.handleResize(window.innerWidth);
            }, 150);
        });

        // Vérifier au chargement
        setTimeout(() => this.checkHeaderOverflow(), 100);
    },

    /**
     * Ouvre la sidebar (ajoute classes CSS).
     */
    openSidebar: function (tab) {
        const sidebarColumn = document.getElementById('sidebarColumn');
        const activityBar = document.getElementById('sidebarAccordion');
        const overlay = document.querySelector('.sidebar-overlay');

        if (tab === 'navigation') {
            if (activityBar) {
                activityBar.classList.add('mobile-visible');
                activityBar.classList.remove('thin');
            }
            if (sidebarColumn) sidebarColumn.classList.remove('mobile-visible');
        } else {
            if (sidebarColumn) sidebarColumn.classList.add('mobile-visible');
            if (activityBar) activityBar.classList.remove('mobile-visible');
        }

        if (overlay) {
            overlay.style.display = 'block';
            setTimeout(() => overlay.classList.add('active'), 10);
        }

        document.body.style.overflow = 'hidden';
    },

    /**
     * Ferme la sidebar.
     */
    closeSidebar: function () {
        const sidebarColumn = document.getElementById('sidebarColumn');
        const activityBar = document.getElementById('sidebarAccordion');
        const overlay = document.querySelector('.sidebar-overlay');

        if (sidebarColumn) sidebarColumn.classList.remove('mobile-visible');
        if (activityBar) activityBar.classList.remove('mobile-visible');

        if (overlay) {
            overlay.classList.remove('active');
            setTimeout(() => overlay.style.display = 'none', 300);
        }

        document.body.style.overflow = '';
    },

    /**
     * Met à jour l'état de la barre d'outils éditeur.
     * @param {boolean} isExpanded 
     */
    updateEditorToolbar: function (isExpanded) {
        const toolbar = document.getElementById('editorToolbar');
        const toggleText = document.getElementById('toolbarToggleText');
        const toggleBtn = document.querySelector('.toolbar-mobile-toggle');

        if (isExpanded) {
            if (toolbar) toolbar.classList.add('expanded');
            if (toggleText) toggleText.innerHTML = '<i data-lucide="x" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i>' + Localization.t('mobile.toolbar.hide');
            if (toggleBtn) toggleBtn.classList.add('expanded');
        } else {
            if (toolbar) toolbar.classList.remove('expanded');
            if (toggleText) toggleText.innerHTML = '<i data-lucide="pen-line" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i>' + Localization.t('mobile.toolbar.show');
            if (toggleBtn) toggleBtn.classList.remove('expanded');
        }

        if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
    },

    /**
     * Met à jour l'état du panneau de liens.
     * @param {boolean} isExpanded 
     */
    updateLinksPanel: function (isExpanded) {
        const panel = document.getElementById('linksPanel');
        const toggleText = document.getElementById('linksPanelToggleText');
        const toggleBtn = document.querySelector('.links-panel-toggle');

        if (isExpanded) {
            if (panel) panel.classList.add('expanded');
            if (toggleText) toggleText.innerHTML = '<i data-lucide="chevron-down" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i>' + Localization.t('mobile.links.hide');
            if (toggleBtn) toggleBtn.classList.add('expanded');
        } else {
            if (panel) panel.classList.remove('expanded');
            if (toggleText) toggleText.innerHTML = '<i data-lucide="chevron-right" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i>' + Localization.t('mobile.links.show');
            if (toggleBtn) toggleBtn.classList.remove('expanded');
        }

        if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
    },

    /**
     * Vérifie le débordement du header et ajuste les classes.
     * OPTIMISÉ : sur mobile (≤ 900px) on conserve force-mobile-nav sans forcer un reflow.
     */
    checkHeaderOverflow: function () {
        const header = document.querySelector('.app-header');
        const headerNav = document.querySelector('.header-nav');
        const body = document.body;

        if (!header || !headerNav) return;

        // Sur mobile (≤ 900px), on force directement le mode mobile sans provoquer
        // un reflow coûteux (suppression/réajout de classe).
        if (window.innerWidth <= 900) {
            body.classList.add('force-mobile-nav');
            MobileMenuRepository.updateState({ isMobileMode: true });
            return;
        }

        // Temporairement forcer le mode desktop pour mesurer
        body.classList.remove('force-mobile-nav');

        // Attendre le reflow
        requestAnimationFrame(() => {
            const headerWidth = header.offsetWidth;
            const logoWidth = document.querySelector('.app-logo')?.offsetWidth || 0;
            const actionsWidth = document.querySelector('.header-actions')?.offsetWidth || 0;
            const navWidth = headerNav.scrollWidth;
            const availableSpace = headerWidth - logoWidth - actionsWidth - 60; // 60px de marge

            if (navWidth > availableSpace) {
                body.classList.add('force-mobile-nav');
                MobileMenuRepository.updateState({ isMobileMode: true });
            } else {
                body.classList.remove('force-mobile-nav');
                MobileMenuRepository.updateState({ isMobileMode: false });
            }
        });
    },

    /**
     * [MVVM: View] Met à jour la visibilité du bottom sheet outils.
     * @param {boolean} isOpen
     */
    updateToolsSheet: function (isOpen) {
        const sheet = document.getElementById('mobileToolsSheet');
        if (!sheet) return;

        if (isOpen) {
            sheet.classList.add('active');
            document.body.style.overflow = 'hidden';
        } else {
            sheet.classList.remove('active');
            // Ne restaurer overflow que si la sidebar est aussi fermée
            if (!MobileMenuRepository.getState().isSidebarOpen) {
                document.body.style.overflow = '';
            }
        }
    },

    /**
     * [MVVM: View] Met à jour l'état actif de la barre de navigation basse.
     * @param {string|null} activeItem - 'structure', 'tools', 'menu', 'format', ou null
     */
    updateBottomNavActiveState: function (activeItem) {
        document.querySelectorAll('.mobile-bottom-nav-item').forEach(function (item) {
            item.classList.remove('active');
        });
        if (activeItem) {
            var selectorMap = {
                'structure': '#mobileBottomStructure',
                'tools': '#mobileBottomTools',
                'menu': '#mobileBottomMenu',
                'format': '#mobileBottomFormat'
            };
            var el = document.querySelector(selectorMap[activeItem]);
            if (el) el.classList.add('active');
        }
    },

    /**
     * Assure un état propre lors du repassage en mode desktop.
     */
    ensureDesktopState: function () {
        const sidebarColumn = document.getElementById('sidebarColumn');
        const activityBar = document.getElementById('sidebarAccordion');
        const overlay = document.querySelector('.sidebar-overlay');
        const menuBtn = document.querySelector('.mobile-menu-toggle');
        const toolsSheet = document.getElementById('mobileToolsSheet');

        if (sidebarColumn) sidebarColumn.classList.remove('mobile-visible');
        if (activityBar) activityBar.classList.remove('mobile-visible');
        if (overlay) {
            overlay.classList.remove('active');
            overlay.style.display = 'none';
        }
        // Fermer le bottom sheet outils
        if (toolsSheet) toolsSheet.classList.remove('active');

        // Nettoyer les états actifs de la bottom nav
        document.querySelectorAll('.mobile-bottom-nav-item').forEach(function (item) {
            item.classList.remove('active');
        });

        // Restaurer l'icône menu si elle a changé
        if (menuBtn) {
            menuBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-menu">
                    <line x1="4" x2="20" y1="12" y2="12"/>
                    <line x1="4" x2="20" y1="6" y2="6"/>
                    <line x1="4" x2="20" y1="18" y2="18"/>
                </svg>
            `;
        }
        document.body.style.overflow = '';
    }
};
