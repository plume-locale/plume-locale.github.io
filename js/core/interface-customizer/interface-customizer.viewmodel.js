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
        const settings = InterfaceCustomizerRepository.loadSettings();
        const defaults = InterfaceCustomizerModel.getDefaultSettings();

        // Rétrocompatibilité : S'assurer que les nouveaux champs existent
        if (!settings.activeModules) settings.activeModules = defaults.activeModules;
        if (!settings.mandatoryModules) settings.mandatoryModules = defaults.mandatoryModules;
        if (!settings.shortcuts) settings.shortcuts = defaults.shortcuts;
        if (settings.currentPresetId === undefined) settings.currentPresetId = defaults.currentPresetId || null;

        InterfaceCustomizerViewModel.state.settings = settings;
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
     * Bascule l'activation d'un module
     */
    toggleModuleActive: (moduleId) => {
        const isEditing = InterfaceCustomizerViewModel.state.isEditing;
        const settings = isEditing
            ? InterfaceCustomizerViewModel.state.tempSettings
            : InterfaceCustomizerViewModel.state.settings;

        const mandatory = settings.mandatoryModules || [];

        // Impossible de désactiver un module obligatoire
        if (mandatory.includes(moduleId)) return;

        const active = settings.activeModules || [];
        if (active.includes(moduleId)) {
            settings.activeModules = active.filter(id => id !== moduleId);
        } else {
            settings.activeModules = [...active, moduleId];
        }

        settings.currentPresetId = null;

        if (!isEditing) {
            InterfaceCustomizerRepository.saveSettings(settings);
        }

        InterfaceCustomizerViewModel.applySettings();

        // Rafraîchir la vue du modal si elle est ouverte
        if (typeof InterfaceCustomizerView !== 'undefined' && document.getElementById('moduleSettingsModal')) {
            InterfaceCustomizerView.renderModuleSettings();
        }
    },

    /**
     * [ADMIN ONLY] Bascule le statut obligatoire d'un module
     */
    toggleModuleMandatory: (moduleId) => {
        const settings = InterfaceCustomizerViewModel.state.settings;
        if (!settings.mandatoryModules) settings.mandatoryModules = [];

        if (settings.mandatoryModules.includes(moduleId)) {
            settings.mandatoryModules = settings.mandatoryModules.filter(id => id !== moduleId);
        } else {
            settings.mandatoryModules = [...settings.mandatoryModules, moduleId];
            // Si on le rend obligatoire, on doit aussi l'activer
            if (!settings.activeModules.includes(moduleId)) {
                settings.activeModules.push(moduleId);
            }
        }

        InterfaceCustomizerRepository.saveSettings(settings);
        InterfaceCustomizerViewModel.applySettings();

        // Rafraîchir la vue admin si elle est ouverte
        if (typeof InterfaceCustomizerView !== 'undefined' && document.getElementById('adminModuleModal')) {
            InterfaceCustomizerView.renderAdminModuleMenu();
        }
    },

    /**
     * Applique un preset global
     */
    applyPreset: (presetId) => {
        const presets = InterfaceCustomizerModel.getAllPresets();
        const preset = presets.find(p => p.id === presetId);
        if (!preset) return;

        const isEditing = InterfaceCustomizerViewModel.state.isEditing;
        const settings = isEditing
            ? InterfaceCustomizerViewModel.state.tempSettings
            : InterfaceCustomizerViewModel.state.settings;

        settings.currentPresetId = presetId;

        // 1. Appliquer les modules du preset
        const mandatory = settings.mandatoryModules || [];
        settings.activeModules = [...new Set([...mandatory, ...preset.modules])];

        // 2. Appliquer les raccourcis
        settings.shortcuts = preset.shortcuts || [];

        // 3. RÉINITIALISATION : On s'assure que les composants individuels ne sont pas forcés à "hidden"
        // pour que le preset s'affiche correctement (on veut l'état nominal du preset)
        InterfaceCustomizerModel.components.forEach(comp => {
            settings[comp.id] = true;
        });

        // 4. Si on n'est pas en train d'éditer, on sauvegarde immédiatement
        if (!isEditing) {
            InterfaceCustomizerRepository.saveSettings(settings);
        }

        // 5. Appliquer l'effet visuel immédiatement
        InterfaceCustomizerViewModel.applySettings();

        // Rafraîchir la vue du modal si elle est ouverte
        if (typeof InterfaceCustomizerView !== 'undefined' && document.getElementById('moduleSettingsModal')) {
            InterfaceCustomizerView.renderModuleSettings();
        }

        if (typeof showNotification === 'function') {
            const label = preset.label.includes('.') ? Localization.t(preset.label) : preset.label;
            showNotification(`✓ Preset "${label}" appliqué (${settings.activeModules.length} modules)`);
        }
    },

    /**
     * [ADMIN] Crée ou met à jour un preset personnalisé
     */
    saveCustomPreset: (presetData) => {
        const custom = InterfaceCustomizerRepository.loadCustomPresets();
        const existingIdx = custom.findIndex(p => p.id === presetData.id);

        if (existingIdx > -1) {
            custom[existingIdx] = presetData;
        } else {
            custom.push(presetData);
        }

        InterfaceCustomizerRepository.saveCustomPresets(custom);
    },

    /**
     * [ADMIN] Supprime un preset personnalisé
     */
    deleteCustomPreset: (presetId) => {
        const custom = InterfaceCustomizerRepository.loadCustomPresets();
        const filtered = custom.filter(p => p.id !== presetId);
        InterfaceCustomizerRepository.saveCustomPresets(filtered);
    },

    /**
     * Bascule la visibilité d'un composant (en mode tempo ou réel)
     */
    toggleComponent: (componentId) => {
        // Sécurité : ne jamais masquer les boutons d'entrée du customizer
        if (componentId === 'headerInterfaceBtn' || componentId === 'sidebarCustomizeBtn') return;

        if (InterfaceCustomizerViewModel.state.isEditing) {
            InterfaceCustomizerViewModel.state.tempSettings[componentId] = !InterfaceCustomizerViewModel.state.tempSettings[componentId];
            InterfaceCustomizerViewModel.state.tempSettings.currentPresetId = null; // Manual change
            InterfaceCustomizerView.refreshComponentsVisuals();
        }
    },

    /**
     * Met à jour un réglage spécifique (couleur, largeur, etc) - mode édition
     */
    updateSetting: (key, value) => {
        if (InterfaceCustomizerViewModel.state.isEditing) {
            InterfaceCustomizerViewModel.state.tempSettings[key] = value;
            InterfaceCustomizerViewModel.state.tempSettings.currentPresetId = null;
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

        // 0. Déterminer quels composants sont masqués par les modules désactivés
        // Un composant n'est masqué que si TOUS les modules auxquels il appartient sont inactifs.
        const activeModules = settings.activeModules || [];
        const activeComponentIds = new Set(
            InterfaceCustomizerModel.modules
                .filter(m => activeModules.includes(m.id))
                .flatMap(m => m.components)
        );

        const allModuleComponentIds = new Set(
            InterfaceCustomizerModel.modules.flatMap(m => m.components)
        );

        const forceHiddenComponentIds = [...allModuleComponentIds].filter(id => !activeComponentIds.has(id));

        // 1. Appliquer les variables CSS de personnalisation
        const root = document.documentElement;
        if (settings.progressBarWidth) root.style.setProperty('--progress-bar-width', `${settings.progressBarWidth}px`);
        if (settings.statusDraftColor) root.style.setProperty('--status-draft-color', settings.statusDraftColor);
        if (settings.statusProgressColor) root.style.setProperty('--status-progress-color', settings.statusProgressColor);
        if (settings.statusCompleteColor) root.style.setProperty('--status-complete-color', settings.statusCompleteColor);
        if (settings.statusReviewColor) root.style.setProperty('--status-review-color', settings.statusReviewColor);

        // 2. Appliquer aux éléments du header et autres éléments par ID
        // On fusionne les réglages individuels et les contraintes modules
        const allComponentIds = new Set([
            ...InterfaceCustomizerModel.components.map(c => c.id),
            ...InterfaceCustomizerModel.modules.flatMap(m => m.components)
        ]);

        allComponentIds.forEach(id => {
            if (id === 'headerInterfaceBtn' || id === 'sidebarCustomizeBtn') return;

            const el = document.getElementById(id);
            if (!el) return;

            // Un composant est visible si :
            // 1. Son module parent est actif (ou s'il n'en a pas)
            // 2. ET Son réglage individuel est true (s'il s'agit d'un composant débrayable individuellement)
            const isModuleActive = !forceHiddenComponentIds.includes(id);
            const isIndividualVisible = settings[id] !== false;
            const shouldShow = isModuleActive && isIndividualVisible;

            if (isEditing) {
                el.style.display = '';
                el.classList.toggle('interface-hidden-preview', !shouldShow);
            } else {
                // IMPORTANT: On utilise !shouldShow ? 'none' : ''
                // On s'assure que si shouldShow est false, display est strict 'none'
                el.style.display = shouldShow ? '' : 'none';
                el.classList.remove('interface-hidden-preview');
            }
        });

        // 3. Appliquer aux éléments du menu mobile
        const mobileButtons = document.querySelectorAll('.mobile-nav-item, .mobile-nav-btn');
        mobileButtons.forEach(btn => {
            const onClick = btn.getAttribute('onclick') || '';
            if (onClick.includes('startEditing')) {
                btn.style.display = '';
                btn.classList.remove('interface-hidden-preview');
                return;
            }

            let targetId = null;
            const viewMatch = onClick.match(/switchView(?:Mobile)?\(['"]([^'"]+)['"]\)/);
            if (viewMatch) {
                const view = viewMatch[1];
                const component = InterfaceCustomizerModel.components.find(c => c.id.includes(view));
                if (component) targetId = component.id;
            } else if (onClick.includes('openThemeManager')) targetId = 'headerThemesBtn';
            else if (onClick.includes('togglePomodoroPopup')) targetId = 'pomodoroHeaderBtn';
            else if (onClick.includes('openImportChapterModal')) targetId = 'headerImportBtn';
            else if (onClick.includes('KeyboardShortcutsHandlers.openShortcutsModal')) targetId = 'headerShortcutsBtn';
            else if (onClick.includes('toggleSplitView')) targetId = 'splitModeToggle';
            else if (onClick.includes('showStorageDetails')) targetId = 'storage-badge';

            if (!targetId) return;

            const isModuleActive = !forceHiddenComponentIds.includes(targetId);
            const isIndividualVisible = settings[targetId] !== false;
            const shouldShow = isModuleActive && isIndividualVisible;

            if (isEditing) {
                btn.style.display = '';
                btn.classList.toggle('interface-hidden-preview', !shouldShow);
            } else {
                btn.style.display = shouldShow ? '' : 'none';
                btn.classList.remove('interface-hidden-preview');
            }
        });

        // 4. Masquer les sections de l'accordéon (Sidebar) si le module est inactif
        InterfaceCustomizerModel.modules.forEach(m => {
            const isModuleActive = (settings.activeModules || []).includes(m.id);
            m.components.forEach(compId => {
                if (compId.startsWith('nav-item-')) {
                    const el = document.getElementById(compId);
                    if (el) {
                        el.style.display = isModuleActive ? '' : 'none';
                        // Optionnel : masquer aussi le parent si c'est un wrapper de section
                        if (el.classList.contains('sidebar-section')) {
                            el.style.display = isModuleActive ? '' : 'none';
                        }
                    }
                }
            });
        });

        // 5. Gestion des groupes (Heads de l'accordéon)
        // Si toutes les sous-sections d'un groupe sont cachées, on cache le groupe.
        const groups = ['Ecriture', 'Analyse', 'Construction'];
        groups.forEach(group => {
            const header = document.querySelector(`.sidebar-group-title[data-group="${group}"]`) ||
                [...document.querySelectorAll('.accordion-header')].find(h => h.textContent.includes(group));
            if (header) {
                const section = header.nextElementSibling;
                if (section && section.classList.contains('accordion-content')) {
                    const visibleItems = [...section.querySelectorAll('.accordion-nav-item, .nav-item')].filter(item => item.style.display !== 'none');
                    header.style.display = visibleItems.length > 0 ? '' : 'none';
                    section.style.display = visibleItems.length > 0 ? '' : 'none';
                }
            }
        });
    }
};
