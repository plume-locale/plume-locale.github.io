/**
 * [MVVM : ViewModel]
 * Gère la logique d'édition live et l'application des réglages.
 */
const InterfaceCustomizerViewModel = {
    state: {
        isEditing: false,
        settings: {}, // Réglages persistés
        tempSettings: {} // Réglages en cours d'édition
    },

    /**
     * Initialisation globale
     */
    init: () => {
        InterfaceCustomizerViewModel.state.settings = InterfaceCustomizerRepository.loadSettings();
        InterfaceCustomizerViewModel.applySettings();
    },

    /**
     * Entre en mode édition live
     */
    startEditing: () => {
        InterfaceCustomizerViewModel.state.isEditing = true;
        InterfaceCustomizerViewModel.state.tempSettings = { ...InterfaceCustomizerViewModel.state.settings };
        InterfaceCustomizerView.renderEditModeUI(true);
        InterfaceCustomizerView.refreshComponentsVisuals();
    },

    /**
     * Quitte le mode édition sans sauvegarder
     */
    cancelEditing: () => {
        InterfaceCustomizerViewModel.state.isEditing = false;
        InterfaceCustomizerViewModel.state.tempSettings = {};
        InterfaceCustomizerView.renderEditModeUI(false);
        InterfaceCustomizerViewModel.applySettings(); // Revenir aux réglages originaux
    },

    /**
     * Sauvegarde et applique les réglages
     */
    saveAndExit: () => {
        InterfaceCustomizerViewModel.state.settings = { ...InterfaceCustomizerViewModel.state.tempSettings };
        InterfaceCustomizerRepository.saveSettings(InterfaceCustomizerViewModel.state.settings);
        InterfaceCustomizerViewModel.state.isEditing = false;
        InterfaceCustomizerView.renderEditModeUI(false);
        InterfaceCustomizerViewModel.applySettings();
        if (typeof showNotification === 'function') showNotification('✓ Interface personnalisée');
    },

    /**
     * Bascule la visibilité d'un composant (en mode tempo ou réel)
     */
    toggleComponent: (componentId) => {
        // Sécurité : ne jamais masquer les boutons d'entrée du customizer
        if (componentId === 'headerInterfaceBtn' || componentId === 'sidebarCustomizeBtn') return;

        if (InterfaceCustomizerViewModel.state.isEditing) {
            InterfaceCustomizerViewModel.state.tempSettings[componentId] = !InterfaceCustomizerViewModel.state.tempSettings[componentId];
            InterfaceCustomizerView.refreshComponentsVisuals();
        }
    },

    /**
     * Met à jour un réglage spécifique (couleur, largeur, etc) - mode édition
     */
    updateSetting: (key, value) => {
        if (InterfaceCustomizerViewModel.state.isEditing) {
            InterfaceCustomizerViewModel.state.tempSettings[key] = value;
            InterfaceCustomizerViewModel.applySettings();
        }
    },

    /**
     * Met à jour un réglage structure et sauvegarde immédiatement (hors mode édition)
     */
    updateStructureSetting: (key, value) => {
        InterfaceCustomizerViewModel.state.settings[key] = value;
        InterfaceCustomizerRepository.saveSettings(InterfaceCustomizerViewModel.state.settings);
        InterfaceCustomizerViewModel.applySettings();
    },

    /**
     * Applique les réglages actuels au DOM
     */
    applySettings: () => {
        const settings = InterfaceCustomizerViewModel.state.isEditing
            ? InterfaceCustomizerViewModel.state.tempSettings
            : InterfaceCustomizerViewModel.state.settings;
        const isEditing = InterfaceCustomizerViewModel.state.isEditing;

        // Render Shortcuts if defined (or use default inside function)
        if (typeof renderSidebarShortcuts === 'function') {
            renderSidebarShortcuts(settings.shortcuts, isEditing);
        }

        // 0. Appliquer les variables CSS de personnalisation
        const root = document.documentElement;
        if (settings.progressBarWidth) root.style.setProperty('--progress-bar-width', `${settings.progressBarWidth}px`);
        if (settings.statusDraftColor) root.style.setProperty('--status-draft-color', settings.statusDraftColor);
        if (settings.statusProgressColor) root.style.setProperty('--status-progress-color', settings.statusProgressColor);
        if (settings.statusCompleteColor) root.style.setProperty('--status-complete-color', settings.statusCompleteColor);
        if (settings.statusReviewColor) root.style.setProperty('--status-review-color', settings.statusReviewColor);

        // 1. Appliquer aux éléments du header (via ID)
        Object.entries(settings).forEach(([id, isVisible]) => {
            // Sécurité absolue
            if (id === 'headerInterfaceBtn' || id === 'sidebarCustomizeBtn') return;

            const el = document.getElementById(id);
            if (!el) return;

            if (isEditing) {
                el.style.display = ''; // Toujours visible en édition
                el.classList.toggle('interface-hidden-preview', !isVisible);
            } else {
                el.style.display = isVisible ? '' : 'none';
                el.classList.remove('interface-hidden-preview');
            }
        });

        // 2. Appliquer aux éléments du menu mobile (détectés par comportement)
        const mobileButtons = document.querySelectorAll('.mobile-nav-item, .mobile-nav-btn');
        mobileButtons.forEach(btn => {
            const onClick = btn.getAttribute('onclick') || '';

            // Sécurité : ne jamais masquer le bouton qui lance l'édition
            if (onClick.includes('startEditing')) {
                btn.style.display = '';
                btn.classList.remove('interface-hidden-preview');
                return;
            }

            let targetId = null;

            // Détection par switchView
            const viewMatch = onClick.match(/switchView(?:Mobile)?\(['"]([^'"]+)['"]\)/);
            if (viewMatch) {
                const view = viewMatch[1];
                const component = InterfaceCustomizerModel.components.find(c => c.id.includes(view));
                if (component) targetId = component.id;
            }
            // Détection par fonction spécifique
            else if (onClick.includes('openThemeManager')) targetId = 'headerThemesBtn';
            else if (onClick.includes('togglePomodoroPopup')) targetId = 'pomodoroHeaderBtn';
            else if (onClick.includes('openImportChapterModal')) targetId = 'headerImportBtn';
            else if (onClick.includes('KeyboardShortcutsHandlers.openShortcutsModal')) targetId = 'headerShortcutsBtn';
            else if (onClick.includes('toggleSplitView')) targetId = 'splitModeToggle';
            else if (onClick.includes('showStorageDetails')) targetId = 'storage-badge';

            if (!targetId) return;

            const isVisible = settings[targetId] !== false;

            if (isEditing) {
                btn.style.display = ''; // Toujours visible en édition
                btn.classList.toggle('interface-hidden-preview', !isVisible);
            } else {
                btn.style.display = isVisible ? '' : 'none';
                btn.classList.remove('interface-hidden-preview');
            }
        });
    }
};
