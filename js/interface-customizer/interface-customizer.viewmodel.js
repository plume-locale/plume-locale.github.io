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
        // Sécurité : ne jamais masquer le bouton d'entrée lui-même
        if (componentId === 'headerInterfaceBtn') return;

        if (InterfaceCustomizerViewModel.state.isEditing) {
            InterfaceCustomizerViewModel.state.tempSettings[componentId] = !InterfaceCustomizerViewModel.state.tempSettings[componentId];
            InterfaceCustomizerView.refreshComponentsVisuals();
        }
    },

    /**
     * Applique les réglages actuels au DOM
     */
    applySettings: () => {
        const settings = InterfaceCustomizerViewModel.state.isEditing
            ? InterfaceCustomizerViewModel.state.tempSettings
            : InterfaceCustomizerViewModel.state.settings;
        const isEditing = InterfaceCustomizerViewModel.state.isEditing;

        // 1. Appliquer aux éléments du header (via ID)
        Object.entries(settings).forEach(([id, isVisible]) => {
            // Sécurité absolue
            if (id === 'headerInterfaceBtn') return;

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
