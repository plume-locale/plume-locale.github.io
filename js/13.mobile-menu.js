

// ========================================
// MOBILE MENU FUNCTIONS
// ========================================

// [MVVM : View]
// Manipulation directe du DOM pour la sidebar mobile (classList, style).
function toggleMobileSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    const handle = document.querySelector('.mobile-menu-handle');

    console.log('?? toggleMobileSidebar appelé');
    console.log('Sidebar:', sidebar);
    console.log('Overlay:', overlay);
    console.log('Handle:', handle);

    // Toggle sidebar
    sidebar.classList.toggle('mobile-open');

    console.log('Sidebar classes:', sidebar.className);
    console.log('Sidebar mobile-open?', sidebar.classList.contains('mobile-open'));

    // Toggle overlay and handle
    if (sidebar.classList.contains('mobile-open')) {
        overlay.style.display = 'block';
        setTimeout(() => overlay.classList.add('active'), 10);
        if (handle) handle.classList.add('hidden');
        // Prevent body scroll when menu is open
        document.body.style.overflow = 'hidden';
        console.log('?  Sidebar ouverte');
    } else {
        overlay.classList.remove('active');
        setTimeout(() => overlay.style.display = 'none', 300);
        if (handle) handle.classList.remove('hidden');
        // Restore body scroll
        document.body.style.overflow = '';
        console.log('? Sidebar fermée');
    }
}

// [MVVM : View]
// Manipulation directe du DOM pour fermer la sidebar.
function closeMobileSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    const handle = document.querySelector('.mobile-menu-handle');

    if (sidebar.classList.contains('mobile-open')) {
        sidebar.classList.remove('mobile-open');
        overlay.classList.remove('active');
        setTimeout(() => overlay.style.display = 'none', 300);
        if (handle) handle.classList.remove('hidden');
        document.body.style.overflow = '';
    }
}

// ========================================
// MOBILE NAVIGATION FUNCTIONS
// ========================================

// [MVVM : View]
// Gestion de l'affichage du menu de navigation mobile (DOM + SVG).
function toggleMobileNav() {
    const dropdown = document.getElementById('mobileNavDropdown');
    const toggleBtn = document.getElementById('mobileNavToggleBtn');
    const sidebar = document.querySelector('.sidebar');

    // Icône Lucid 'Menu' (pour ouvrir)
    const menuIcon = `
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-menu">
                    <line x1="4" x2="20" y1="12" y2="12"/>
                    <line x1="4" x2="20" y1="6" y2="6"/>
                    <line x1="4" x2="20" y1="18" y2="18"/>
                </svg>
            `;

    // Icône Lucid 'X' (pour fermer)
    const closeIcon = `
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x">
                    <path d="M18 6 6 18"/>
                    <path d="m6 6 12 12"/>
                </svg>
            `;

    // Déterminez si le menu est actif (ouvert)
    if (dropdown.classList.contains('active')) {
        // Fermer le menu
        dropdown.classList.remove('active');
        toggleBtn.innerHTML = menuIcon; // Remplacer par l'icône 'Menu'
        if (sidebar) sidebar.style.visibility = '';
    } else {
        // Ouvrir le menu
        dropdown.classList.add('active');
        toggleBtn.innerHTML = closeIcon; // Remplacer par l'icône 'X'
        if (sidebar) sidebar.style.visibility = 'hidden';
    }
}

// [MVVM : View]
// Fermeture du menu de navigation mobile (DOM).
function closeMobileNav() {
    const dropdown = document.getElementById('mobileNavDropdown');
    const toggleBtn = document.getElementById('mobileNavToggleBtn');
    const sidebar = document.querySelector('.sidebar');

    if (dropdown && dropdown.classList.contains('active')) {
        dropdown.classList.remove('active');
        // Icône Lucid 'Menu' (pour ouvrir)
        toggleBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-menu">
                    <line x1="4" x2="20" y1="12" y2="12"/>
                    <line x1="4" x2="20" y1="6" y2="6"/>
                    <line x1="4" x2="20" y1="18" y2="18"/>
                </svg>
            `;
        if (sidebar) sidebar.style.visibility = '';
    }
}

// [MVVM : View]
// Mise à jour de l'état UI actif et appel d'une fonction de changement de vue.
function switchViewMobile(view) {
    // Update active state in mobile menu
    document.querySelectorAll('.mobile-nav-item').forEach(item => {
        item.classList.remove('active');
    });
    const activeItem = document.querySelector(`[data-view="${view}"]`);
    if (activeItem) {
        activeItem.classList.add('active');
    }

    // Close mobile nav
    closeMobileNav();

    // Switch to the view
    switchView(view);
}

// ========================================
// MOBILE EDITOR TOOLBAR FUNCTIONS
// ========================================

// [MVVM : View]
// Affichage/Masquage de la barre d'outils (DOM).
function toggleEditorToolbar() {
    const toolbar = document.getElementById('editorToolbar');
    const toggleText = document.getElementById('toolbarToggleText');
    const toggleBtn = document.querySelector('.toolbar-mobile-toggle');

    if (toolbar.classList.contains('expanded')) {
        toolbar.classList.remove('expanded');
        toggleText.innerHTML = '<i data-lucide="pen-line" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i>Afficher les outils de formatage';
        if (toggleBtn) toggleBtn.classList.remove('expanded');
        if (typeof lucide !== 'undefined') lucide.createIcons();
    } else {
        toolbar.classList.add('expanded');
        toggleText.innerHTML = '<i data-lucide="x" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i>Masquer les outils de formatage';
        if (toggleBtn) toggleBtn.classList.add('expanded');
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
}

// [MVVM : View]
// Affichage/Masquage du panneau de liens (DOM).
function toggleLinksPanel() {
    const panel = document.getElementById('linksPanel');
    const toggleText = document.getElementById('linksPanelToggleText');
    const toggleBtn = document.querySelector('.links-panel-toggle');

    if (panel.classList.contains('expanded')) {
        panel.classList.remove('expanded');
        if (toggleText) toggleText.innerHTML = '<i data-lucide="chevron-right" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i>Afficher personnages & lieux liés';
        if (toggleBtn) toggleBtn.classList.remove('expanded');
        if (typeof lucide !== 'undefined') lucide.createIcons();
    } else {
        panel.classList.add('expanded');
        if (toggleText) toggleText.innerHTML = '<i data-lucide="chevron-down" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i>Masquer personnages & lieux liés';
        if (toggleBtn) toggleBtn.classList.add('expanded');
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
}

// [MVVM : View]
// Interaction complexe entre deux éléments d'interface (menu flottant et toolbar).
function toggleToolbarFromFloating() {
    // Fermer le menu flottant
    const floatingMenu = document.getElementById('floatingEditorMenu');
    const floatingToggle = document.getElementById('floatingEditorToggle');

    if (floatingMenu && floatingMenu.classList.contains('active')) {
        floatingMenu.classList.remove('active');
        if (floatingToggle) floatingToggle.innerHTML = '<i data-lucide="pencil" style="width:16px;height:16px;"></i>';
    }

    // Ouvrir le toolbar complet
    const toolbar = document.getElementById('editorToolbar');
    const toggleText = document.getElementById('toolbarToggleText');
    const toggleBtn = document.querySelector('.toolbar-mobile-toggle');

    if (toolbar && !toolbar.classList.contains('expanded')) {
        toolbar.classList.add('expanded');
        if (toggleText) toggleText.textContent = 'Masquer les outils de formatage';
        if (toggleBtn) toggleBtn.classList.add('expanded');
    }

    // Scroll vers le toolbar pour le rendre visible
    setTimeout(() => {
        if (toolbar) {
            toolbar.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }, 100);
}

// [MVVM : View]
// Gestion de l'affichage du menu avancé (DOM + Style).
function toggleAdvancedMenu() {
    const advancedBar = document.getElementById('advancedMenuBar');
    const advancedBtn = document.getElementById('advancedMenuBtn');

    console.log('Toggle advanced menu clicked');
    console.log('Advanced bar found:', !!advancedBar);
    console.log('Current display:', advancedBar ? window.getComputedStyle(advancedBar).display : 'not found');

    if (advancedBar.classList.contains('active')) {
        console.log('Hiding advanced menu');
        advancedBar.classList.remove('active');
        advancedBtn.style.background = '';
    } else {
        console.log('Showing advanced menu');
        advancedBar.classList.add('active');
        advancedBtn.style.background = 'rgba(255,215,0,0.3)';

        // Force display after a tick
        setTimeout(() => {
            console.log('After timeout display:', window.getComputedStyle(advancedBar).display);
        }, 10);
    }
}

// [MVVM : Other]
// Interaction utilisateur (Prompt) -> Appel logique métier (formatText). (Mixte)
function insertLink() {
    const url = prompt('Entrez l\'URL du lien:');
    if (url) {
        formatText('createLink', url);
    }
}

// [MVVM : View]
// Surcharge d'une fonction existante pour ajouter un comportement purement visuel (fermer sidebar).
// Override switchView to close mobile sidebar
const originalSwitchView = switchView;
switchView = function (view) {
    if (window.innerWidth <= 900) {
        closeMobileSidebar();
    }
    originalSwitchView(view);
};

// Détection dynamique du débordement du header
// [MVVM : View]
// Calcul de dimensions et ajustement de classes CSS en fonction de l'espace disponible.
function checkHeaderOverflow() {
    const header = document.querySelector('.app-header');
    const headerNav = document.querySelector('.header-nav');
    const body = document.body;

    if (!header || !headerNav) return;

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
        } else {
            body.classList.remove('force-mobile-nav');
        }
    });
}

// Handle window resize
let resizeTimeout;
window.addEventListener('resize', function () {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(function () {
        // Vérifier le débordement du header
        checkHeaderOverflow();

        // If resizing to desktop, ensure sidebar is visible and overlay hidden
        if (window.innerWidth > 900 && !document.body.classList.contains('force-mobile-nav')) {
            const sidebar = document.querySelector('.sidebar');
            const overlay = document.querySelector('.sidebar-overlay');
            const menuBtn = document.querySelector('.mobile-menu-toggle');

            if (sidebar) sidebar.classList.remove('mobile-open');
            if (overlay) {
                overlay.classList.remove('active');
                overlay.style.display = 'none';
            }
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
    }, 100);
});

// Vérifier au chargement
window.addEventListener('load', function () {
    setTimeout(checkHeaderOverflow, 100);
});
