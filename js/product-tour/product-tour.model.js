/**
 * [MVVM : Product Tour Model]
 * Factories et structures de données pour le système de visite guidée.
 */

console.log('🎓 Product Tour Model loaded');

// ============================================
// TOUR STATE MODEL
// ============================================

const ProductTourStateModel = {
    /**
     * Crée un état initial pour le tour.
     * @returns {Object} État initial du tour.
     */
    createInitial: function () {
        return {
            completed: false,
            skipped: false,
            currentStep: 0,
            lastShown: null,
            version: '1.0',
            preferences: {
                showOnStartup: true,
                autoAdvance: false
            }
        };
    },

    /**
     * Valide et normalise un état de tour.
     * @param {Object} state - État à valider.
     * @returns {Object} État validé.
     */
    validate: function (state) {
        if (!state || typeof state !== 'object') {
            return this.createInitial();
        }

        return {
            completed: Boolean(state.completed),
            skipped: Boolean(state.skipped),
            currentStep: Number(state.currentStep) || 0,
            lastShown: state.lastShown || null,
            version: state.version || '1.0',
            preferences: {
                showOnStartup: state.preferences?.showOnStartup !== false,
                autoAdvance: Boolean(state.preferences?.autoAdvance)
            }
        };
    },

    /**
     * Migre un état legacy si nécessaire.
     * @param {Object} raw - Données brutes.
     * @returns {Object} État migré.
     */
    migrate: function (raw) {
        if (!raw) return this.createInitial();

        // Migration v1.0 -> v1.1 (exemple pour futures versions)
        if (raw.version === '1.0') {
            return this.validate(raw);
        }

        return this.validate(raw);
    }
};

// ============================================
// TOUR STEP MODEL
// ============================================

const ProductTourStepModel = {
    /**
     * Crée une définition de step de tour.
     * @param {Object} data - Données du step.
     * @returns {Object} Step validé.
     */
    create: function (data = {}) {
        return {
            element: data.element || null,
            popover: {
                title: data.popover?.title || '',
                description: data.popover?.description || '',
                side: data.popover?.side || 'bottom',
                align: data.popover?.align || 'start'
            },
            onHighlightStarted: data.onHighlightStarted || null,
            onHighlighted: data.onHighlighted || null,
            onDeselected: data.onDeselected || null,
            onNext: data.onNext || null,
            onPrevious: data.onPrevious || null
        };
    },

    /**
     * Valide qu'un élément existe dans le DOM.
     * @param {string} selector - Sélecteur CSS.
     * @returns {boolean} True si l'élément existe.
     */
    validateElement: function (selector) {
        if (!selector) return false;
        try {
            return document.querySelector(selector) !== null;
        } catch (e) {
            console.warn(`Invalid selector: ${selector}`, e);
            return false;
        }
    }
};

// ============================================
// TOUR CONFIG MODEL
// ============================================

const ProductTourConfigModel = {
    /**
     * Crée la configuration Driver.js pour le tour.
     * @returns {Object} Configuration Driver.js.
     */
    createDriverConfig: function () {
        return {
            animate: true,
            opacity: 0.75,
            padding: 10,
            allowClose: true,
            overlayClickNext: false,
            doneBtnText: Localization.t('tour.driver.done'),
            closeBtnText: Localization.t('tour.driver.close'),
            nextBtnText: Localization.t('tour.driver.next'),
            prevBtnText: Localization.t('tour.driver.prev'),
            showProgress: true,
            progressText: Localization.t('tour.driver.progress').replace('{0}', '{{current}}').replace('{1}', '{{total}}'),
            showButtons: ['next', 'previous', 'close'],
            disableActiveInteraction: false,
            onDestroyStarted: () => {
                console.log('🎓 Tour destroy started');
                // Sera géré par le ViewModel
                if (typeof onTourCompleteVM === 'function') {
                    onTourCompleteVM();
                }
            },
            onDestroyed: () => {
                console.log('🎓 Tour destroyed');
                // Cleanup après fermeture
                if (typeof onTourDestroyedVM === 'function') {
                    onTourDestroyedVM();
                }
            }
        };
    },

    /**
     * Crée la configuration pour mobile.
     * @returns {Object} Configuration mobile.
     */
    createMobileConfig: function () {
        const config = this.createDriverConfig();
        return {
            ...config,
            padding: 5,
            progressText: '{{current}}/{{total}}' // Keep simple format for mobile
        };
    }
};

// ============================================
// TOUR STEPS DEFINITIONS
// ============================================

const ProductTourStepsModel = {
    /**
     * Retourne tous les steps du tour selon le contexte.
     * @returns {Array} Liste des steps.
     */
    getAllSteps: function () {
        const isMobile = window.innerWidth < 768;
        return isMobile ? this.getMobileSteps() : this.getDesktopSteps();
    },

    /**
     * Steps pour desktop (tour complet).
     * @returns {Array} Steps desktop.
     */
    getDesktopSteps: function () {
        return [
            // Stage 1: Welcome & Orientation
            {
                element: '#headerProjectTitle',
                popover: {
                    title: Localization.t('tour.step.welcome.title'),
                    description: Localization.t('tour.step.welcome.desc'),
                    side: 'bottom',
                    align: 'start'
                },
                onHighlightStarted: () => {
                    // Ensure we're on the editor view
                    if (typeof currentView !== 'undefined' && currentView !== 'editor') {
                        if (typeof switchView === 'function') {
                            switchView('editor');
                        }
                    }
                }
            },
            {
                element: '#headerProjectTitle',
                popover: {
                    title: Localization.t('tour.step.project_title.title'),
                    description: Localization.t('tour.step.project_title.desc'),
                    side: 'bottom',
                    align: 'start'
                }
            },
            // Navigation - Groupe 1: Écriture
            {
                element: '.header-nav .nav-group:nth-child(1)',
                popover: {
                    title: Localization.t('tour.step.writing_tools.title'),
                    description: Localization.t('tour.step.writing_tools.desc'),
                    side: 'bottom',
                    align: 'start'
                }
            },
            // Navigation - Groupe 2: Base de données
            {
                element: '.header-nav .nav-group:nth-child(2)',
                popover: {
                    title: Localization.t('tour.step.database.title'),
                    description: Localization.t('tour.step.database.desc'),
                    side: 'bottom',
                    align: 'start'
                }
            },
            // Navigation - Groupe 3: Visualisations
            {
                element: '.header-nav .nav-group:nth-child(3)',
                popover: {
                    title: Localization.t('tour.step.viz.title'),
                    description: Localization.t('tour.step.viz.desc'),
                    side: 'bottom',
                    align: 'center'
                }
            },
            // Navigation - Groupe 4: Analyse
            {
                element: '.header-nav .nav-group:nth-child(4)',
                popover: {
                    title: Localization.t('tour.step.analysis.title'),
                    description: Localization.t('tour.step.analysis.desc'),
                    side: 'bottom',
                    align: 'center'
                }
            },
            // Navigation - Groupe 5: Historique
            {
                element: '.header-nav .nav-group:nth-child(5)',
                popover: {
                    title: Localization.t('tour.step.snapshots.title'),
                    description: Localization.t('tour.step.snapshots.desc'),
                    side: 'bottom',
                    align: 'center'
                }
            },

            // Actions Header - Stats
            {
                element: '#headerStatsContainer',
                popover: {
                    title: Localization.t('tour.step.quick_stats.title'),
                    description: Localization.t('tour.step.quick_stats.desc'),
                    side: 'bottom',
                    align: 'end'
                }
            },
            // Actions Header - Split View
            {
                element: '#splitModeToggle',
                popover: {
                    title: Localization.t('tour.step.split_mode.title'),
                    description: Localization.t('tour.step.split_mode.desc'),
                    side: 'bottom',
                    align: 'end'
                }
            },
            // Actions Header - Storage
            {
                element: '#storage-badge',
                popover: {
                    title: Localization.t('tour.step.storage.title'),
                    description: Localization.t('tour.step.storage.desc'),
                    side: 'bottom',
                    align: 'end'
                }
            },
            // Actions Header - Undo/Redo
            {
                element: '#headerUndoBtn',
                popover: {
                    title: Localization.t('tour.step.undo_redo.title'),
                    description: Localization.t('tour.step.undo_redo.desc'),
                    side: 'bottom',
                    align: 'end'
                }
            },
            // Actions Header - Pomodoro
            {
                element: '#pomodoroHeaderBtn',
                popover: {
                    title: Localization.t('tour.step.pomodoro.title'),
                    description: Localization.t('tour.step.pomodoro.desc'),
                    side: 'bottom',
                    align: 'end'
                }
            },
            // Actions Header - Import
            {
                element: '.header-action-btn[onclick="openImportChapterModal()"]',
                popover: {
                    title: Localization.t('tour.step.import.title'),
                    description: Localization.t('tour.step.import.desc'),
                    side: 'bottom',
                    align: 'end'
                }
            },
            // Actions Header - Export
            {
                element: '.header-action-btn[onclick="showBackupMenu()"]',
                popover: {
                    title: Localization.t('tour.step.export.title'),
                    description: Localization.t('tour.step.export.desc'),
                    side: 'bottom',
                    align: 'end'
                }
            },
            // Actions Header - Themes
            {
                element: '.header-action-btn[onclick="openThemeManager()"]',
                popover: {
                    title: Localization.t('tour.step.themes.title'),
                    description: Localization.t('tour.step.themes.desc'),
                    side: 'bottom',
                    align: 'end'
                }
            },
            // Actions Header - Projects
            {
                element: '.header-action-btn[onclick="openProjectsModal()"]',
                popover: {
                    title: Localization.t('tour.step.projects.title'),
                    description: Localization.t('tour.step.projects.desc'),
                    side: 'bottom',
                    align: 'end'
                }
            },

            // Stage 2: Core Writing Features
            {
                element: '.sidebar',
                popover: {
                    title: Localization.t('tour.step.structure.title'),
                    description: Localization.t('tour.step.structure.desc'),
                    side: 'right',
                    align: 'start'
                }
            },
            {
                element: '#sceneEditor',
                popover: {
                    title: Localization.t('tour.step.editor.title'),
                    description: Localization.t('tour.step.editor.desc'),
                    side: 'left',
                    align: 'start'
                }
            },

            // Stage 3: Completion
            {
                element: '#headerProjectTitle',
                popover: {
                    title: Localization.t('tour.step.finish.title'),
                    description: Localization.t('tour.step.finish.desc'),
                    side: 'bottom',
                    align: 'start'
                }
            }
        ];
    },

    /**
     * Steps pour mobile (tour simplifié).
     * @returns {Array} Steps mobile.
     */
    getMobileSteps: function () {
        return [
            {
                element: '#headerProjectTitle',
                popover: {
                    title: Localization.t('tour.mobile.welcome.title'),
                    description: Localization.t('tour.mobile.welcome.desc'),
                    side: 'bottom',
                    align: 'start'
                }
            },
            {
                element: '.sidebar',
                popover: {
                    title: Localization.t('tour.mobile.structure.title'),
                    description: Localization.t('tour.mobile.structure.desc'),
                    side: 'right',
                    align: 'start'
                }
            },
            {
                element: '#sceneEditor',
                popover: {
                    title: Localization.t('tour.mobile.editor.title'),
                    description: Localization.t('tour.mobile.editor.desc'),
                    side: 'left',
                    align: 'start'
                }
            },
            {
                element: '#headerProjectTitle',
                popover: {
                    title: Localization.t('tour.mobile.finish.title'),
                    description: Localization.t('tour.mobile.finish.desc'),
                    side: 'bottom',
                    align: 'start'
                }
            }
        ];
    },

    /**
     * Filtre les steps pour ne garder que ceux dont les éléments existent.
     * @param {Array} steps - Steps à filtrer.
     * @returns {Array} Steps filtrés.
     */
    filterValidSteps: function (steps) {
        return steps.filter(step => {
            if (!step.element) return true; // Steps sans élément (modals, etc.)
            return ProductTourStepModel.validateElement(step.element);
        });
    }
};
