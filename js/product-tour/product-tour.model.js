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
                image: data.popover?.image || null,
                side: data.popover?.side || 'bottom',
                align: data.popover?.align || 'start'
            },
            onHighlightStarted: data.onHighlightStarted || null,
            onHighlighted: data.onHighlighted || null,
            onDeselected: data.onDeselected || null,
            onNext: data.onNext || null,
            onPrevious: data.onPrevious || null,
            clickBefore: data.clickBefore || null,
            clickAfter: data.clickAfter || null
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
    },

    /**
     * Génère un sélecteur CSS unique pour un élément DOM.
     * @param {HTMLElement} el - Élément DOM.
     * @returns {string} Sélecteur CSS.
     */
    getUniqueSelector: function (el) {
        if (!el || !(el instanceof HTMLElement)) return null;

        // 1. Essayer par ID
        if (el.id) return `#${el.id}`;

        // 2. Essayer par classes spécifiques (si pas trop génériques)
        if (el.classList.length > 0) {
            const ignoredClasses = ['active', 'selected', 'hover', 'dragging', 'visible'];
            const validClasses = Array.from(el.classList).filter(c => !ignoredClasses.includes(c));
            if (validClasses.length > 0) {
                // Essayer de trouver une combinaison unique
                const selector = `.${validClasses.join('.')}`;
                if (document.querySelectorAll(selector).length === 1) return selector;
            }
        }

        // 3. Fallback: Chemin complet
        const path = [];
        let current = el;
        while (current && current.nodeType === Node.ELEMENT_NODE) {
            let selector = current.nodeName.toLowerCase();
            if (current.id) {
                selector += `#${current.id}`;
                path.unshift(selector);
                break;
            } else {
                let sibling = current;
                let nth = 1;
                while (sibling = sibling.previousElementSibling) {
                    if (sibling.nodeName.toLowerCase() === selector) nth++;
                }
                if (nth > 1) selector += `:nth-of-type(${nth})`;
            }
            path.unshift(selector);
            current = current.parentNode;
        }
        return path.join(' > ');
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
            overlayClickNext: true,
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
     * Retourne tous les steps du tour selon le contexte (vue et plateforme).
     * @param {string} view - Vue actuelle (ex: 'editor', 'characters').
     * @returns {Array} Liste des steps.
     */
    getAllSteps: function (view = 'editor') {
        const isMobile = window.innerWidth < 768;
        if (isMobile) return this.getMobileSteps(view);

        return this.getDesktopSteps(view);
    },

    /**
     * Steps pour desktop selon la vue.
     * @param {string} view - Vue demandée.
     * @returns {Array} Steps desktop.
     */
    getDesktopSteps: function (view) {
        switch (view) {
            case 'editor':
                return this.getStructureSteps();
            default:
                return this.getGlobalOverviewSteps();
        }
    },

    /**
     * Tour "Structure" (Éditeur) détaillé.
     * @returns {Array} Steps.
     */
    getStructureSteps: function () {
        return [
            // Bienvenue spécifique à la structure
            {
                element: '#headerProjectTitle',
                popover: {
                    title: Localization.t('tour.step.welcome.title'),
                    description: Localization.t('tour.step.welcome.desc'),
                    side: 'bottom',
                    align: 'start'
                }
            },
            // Sidebar: La structure elle-même
            {
                element: '.sidebar',
                popover: {
                    title: Localization.t('tour.step.structure_sidebar.title'),
                    description: Localization.t('tour.step.structure_sidebar.desc'),
                    side: 'right',
                    align: 'start'
                }
            },
            // Boutons d'ajout (Actes/Chapitres)
            {
                element: '.sidebar-header-actions',
                popover: {
                    title: Localization.t('tour.step.structure_actions.title'),
                    description: Localization.t('tour.step.structure_actions.desc'),
                    side: 'bottom',
                    align: 'start'
                }
            },
            // Toolbar de l'arbre
            {
                element: '.tree-toolbar',
                popover: {
                    title: Localization.t('tour.step.structure_toolbar.title'),
                    description: Localization.t('tour.step.structure_toolbar.desc'),
                    side: 'bottom',
                    align: 'start'
                }
            },
            // L'éditeur: Header
            {
                element: '.editor-header',
                popover: {
                    title: Localization.t('tour.step.editor_header.title'),
                    description: Localization.t('tour.step.editor_header.desc'),
                    side: 'bottom',
                    align: 'start'
                }
            },
            // Synopsis
            {
                element: '.editor-synopsis',
                popover: {
                    title: Localization.t('tour.step.editor_synopsis.title'),
                    description: Localization.t('tour.step.editor_synopsis.desc'),
                    side: 'bottom',
                    align: 'start'
                }
            },
            // Toolbar de formatage
            {
                element: '#editorToolbar',
                popover: {
                    title: Localization.t('tour.step.editor_toolbar.title'),
                    description: Localization.t('tour.step.editor_toolbar.desc'),
                    side: 'top',
                    align: 'center'
                }
            },
            // Zone de texte
            {
                element: '.editor-textarea',
                popover: {
                    title: Localization.t('tour.step.editor_content.title'),
                    description: Localization.t('tour.step.editor_content.desc'),
                    side: 'top',
                    align: 'center'
                }
            },
            // Sidebar de droite (Outils)
            {
                element: '#toolsSidebar',
                popover: {
                    title: Localization.t('tour.step.tools_sidebar.title'),
                    description: Localization.t('tour.step.tools_sidebar.desc'),
                    side: 'left',
                    align: 'start'
                }
            },
            // Fin
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
     * Tour d'horizon global (Fallback ou mode découverte).
     * @returns {Array} Steps.
     */
    getGlobalOverviewSteps: function () {
        return [
            {
                element: '#headerProjectTitle',
                popover: {
                    title: Localization.t('tour.step.welcome.title'),
                    description: Localization.t('tour.step.welcome.desc'),
                    side: 'bottom',
                    align: 'start'
                }
            },
            {
                element: '.header-nav',
                popover: {
                    title: Localization.t('tour.step.writing_tools.title'),
                    description: Localization.t('tour.step.writing_tools.desc'),
                    side: 'bottom',
                    align: 'start'
                }
            },
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
            }
        ];
    },

    /**
     * Steps pour mobile.
     * @param {string} view - Vue demandée.
     * @returns {Array} Steps mobile.
     */
    getMobileSteps: function (view) {
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
        if (!Array.isArray(steps)) return [];
        return steps.filter(step => {
            // Un step valide doit exister et avoir un popover
            if (!step || !step.popover) {
                console.warn('🎓 Invalid step detected (missing step or popover):', step);
                return false;
            }
            if (!step.element) return true;
            return ProductTourStepModel.validateElement(step.element);
        });
    }
};
