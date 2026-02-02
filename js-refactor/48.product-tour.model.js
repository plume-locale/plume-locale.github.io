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
            doneBtnText: 'Terminer',
            closeBtnText: 'Fermer',
            nextBtnText: 'Suivant',
            prevBtnText: 'Précédent',
            showProgress: true,
            progressText: 'Étape {{current}} sur {{total}}',
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
            progressText: '{{current}}/{{total}}'
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
                    title: '🪶 Bienvenue dans Plume',
                    description: `
                        <p>Plume est votre espace d'écriture complet pour créer des histoires captivantes.</p>
                        <p>Cette visite guidée vous présentera les fonctionnalités principales en quelques minutes.</p>
                        <p><strong>Vous pouvez quitter à tout moment en appuyant sur Échap.</strong></p>
                    `,
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
                    title: 'Titre du Projet',
                    description: `
                        <p>Cliquez sur le titre pour renommer votre projet.</p>
                        <p>Chaque projet est sauvegardé automatiquement dans votre navigateur.</p>
                    `,
                    side: 'bottom',
                    align: 'start'
                }
            },
            // Navigation - Groupe 1: Écriture
            {
                element: '.header-nav .nav-group:nth-child(1)',
                popover: {
                    title: '📝 Outils d\'Écriture',
                    description: `
                        <p>Organisez et visualisez votre histoire de différentes manières :</p>
                        <ul>
                            <li><strong>Structure</strong> : Vue hiérarchique (Actes → Chapitres → Scènes)</li>
                            <li><strong>Tableau</strong> : Vue en cartes (Corkboard)</li>
                            <li><strong>Intrigue</strong> : Graphique de tension narrative</li>
                            <li><strong>Arcs</strong> : Suivi des arcs narratifs</li>
                        </ul>
                    `,
                    side: 'bottom',
                    align: 'start'
                }
            },
            // Navigation - Groupe 2: Base de données
            {
                element: '.header-nav .nav-group:nth-child(2)',
                popover: {
                    title: '📚 Base de Données',
                    description: `
                        <p>Gérez tous les éléments de votre univers :</p>
                        <ul>
                            <li><strong>Personnages</strong> : Fiches détaillées avec relations</li>
                            <li><strong>Univers</strong> : Lieux, objets, concepts</li>
                            <li><strong>Codex</strong> : Encyclopédie de votre monde</li>
                            <li><strong>Notes</strong> : Notes libres et idées</li>
                        </ul>
                    `,
                    side: 'bottom',
                    align: 'start'
                }
            },
            // Navigation - Groupe 3: Visualisations
            {
                element: '.header-nav .nav-group:nth-child(3)',
                popover: {
                    title: '🗺️ Visualisations',
                    description: `
                        <p>Explorez votre histoire visuellement :</p>
                        <ul>
                            <li><strong>Mindmap</strong> : Carte mentale de votre histoire</li>
                            <li><strong>Relations</strong> : Graphe des relations entre personnages</li>
                            <li><strong>Carte</strong> : Carte géographique de votre monde</li>
                            <li><strong>Timeline</strong> : Chronologie des événements</li>
                        </ul>
                    `,
                    side: 'bottom',
                    align: 'center'
                }
            },
            // Navigation - Groupe 4: Analyse
            {
                element: '.header-nav .nav-group:nth-child(4)',
                popover: {
                    title: '📊 Analyse & Statistiques',
                    description: `
                        <p>Analysez votre texte en profondeur :</p>
                        <ul>
                            <li><strong>Stats</strong> : Nombre de mots, chapitres, scènes</li>
                            <li><strong>Analyse</strong> : Répétitions, lisibilité, style</li>
                        </ul>
                    `,
                    side: 'bottom',
                    align: 'center'
                }
            },
            // Navigation - Groupe 5: Historique
            {
                element: '.header-nav .nav-group:nth-child(5)',
                popover: {
                    title: '💾 Snapshots',
                    description: `
                        <p>Sauvegardez des versions de votre travail :</p>
                        <ul>
                            <li>Créez des snapshots à tout moment</li>
                            <li>Comparez différentes versions</li>
                            <li>Restaurez une version antérieure</li>
                        </ul>
                    `,
                    side: 'bottom',
                    align: 'center'
                }
            },
            
            // Actions Header - Stats
            {
                element: '#headerStatsContainer',
                popover: {
                    title: '📈 Statistiques Rapides',
                    description: `
                        <p>Suivez votre progression en temps réel :</p>
                        <ul>
                            <li>Nombre total de mots</li>
                            <li>Nombre de chapitres</li>
                            <li>Mise à jour automatique</li>
                        </ul>
                    `,
                    side: 'bottom',
                    align: 'end'
                }
            },
            // Actions Header - Split View
            {
                element: '#splitModeToggle',
                popover: {
                    title: '⚡ Mode Split',
                    description: `
                        <p>Travaillez sur deux scènes simultanément :</p>
                        <ul>
                            <li>Vue côte à côte</li>
                            <li>Parfait pour comparer ou référencer</li>
                            <li>Synchronisation du scroll optionnelle</li>
                        </ul>
                    `,
                    side: 'bottom',
                    align: 'end'
                }
            },
            // Actions Header - Storage
            {
                element: '#storage-badge',
                popover: {
                    title: '💾 Espace de Stockage',
                    description: `
                        <p>Surveillez l'utilisation de votre stockage local :</p>
                        <ul>
                            <li>Indicateur visuel (vert/orange/rouge)</li>
                            <li>Cliquez pour voir les détails</li>
                            <li>Gérez vos projets pour libérer de l'espace</li>
                        </ul>
                    `,
                    side: 'bottom',
                    align: 'end'
                }
            },
            // Actions Header - Undo/Redo
            {
                element: '#headerUndoBtn',
                popover: {
                    title: '↩️ Annuler / Rétablir',
                    description: `
                        <p>Historique complet de vos modifications :</p>
                        <ul>
                            <li><strong>Annuler</strong> : Ctrl+Z</li>
                            <li><strong>Rétablir</strong> : Ctrl+Y</li>
                            <li>Historique illimité pendant la session</li>
                        </ul>
                    `,
                    side: 'bottom',
                    align: 'end'
                }
            },
            // Actions Header - Pomodoro
            {
                element: '#pomodoroHeaderBtn',
                popover: {
                    title: '⏱️ Timer Pomodoro',
                    description: `
                        <p>Gérez votre temps d'écriture efficacement :</p>
                        <ul>
                            <li>Sessions de 25 minutes</li>
                            <li>Pauses de 5 minutes</li>
                            <li>Notifications sonores</li>
                        </ul>
                    `,
                    side: 'bottom',
                    align: 'end'
                }
            },
            // Actions Header - Import
            {
                element: '.header-action-btn[onclick="openImportChapterModal()"]',
                popover: {
                    title: '📥 Importer du Texte',
                    description: `
                        <p>Importez vos textes existants :</p>
                        <ul>
                            <li>Formats : .docx, .txt, .md, .epub</li>
                            <li>Détection automatique de la structure</li>
                            <li>Préservation de la mise en forme</li>
                        </ul>
                    `,
                    side: 'bottom',
                    align: 'end'
                }
            },
            // Actions Header - Export
            {
                element: '.header-action-btn[onclick="showBackupMenu()"]',
                popover: {
                    title: '📤 Sauvegardes & Exports',
                    description: `
                        <p>Exportez votre travail dans différents formats :</p>
                        <ul>
                            <li><strong>DOCX</strong> : Microsoft Word</li>
                            <li><strong>PDF</strong> : Document portable</li>
                            <li><strong>JSON</strong> : Sauvegarde complète</li>
                            <li><strong>TXT</strong> : Texte brut</li>
                        </ul>
                    `,
                    side: 'bottom',
                    align: 'end'
                }
            },
            // Actions Header - Themes
            {
                element: '.header-action-btn[onclick="openThemeManager()"]',
                popover: {
                    title: '🎨 Gestionnaire de Thèmes',
                    description: `
                        <p>Personnalisez l'apparence de Plume :</p>
                        <ul>
                            <li>Thèmes clairs et sombres</li>
                            <li>Couleurs personnalisables</li>
                            <li>Polices d'écriture variées</li>
                            <li>Sauvegarde de vos préférences</li>
                        </ul>
                    `,
                    side: 'bottom',
                    align: 'end'
                }
            },
            // Actions Header - Projects
            {
                element: '.header-action-btn[onclick="openProjectsModal()"]',
                popover: {
                    title: '📁 Gestionnaire de Projets',
                    description: `
                        <p>Gérez tous vos projets d'écriture :</p>
                        <ul>
                            <li>Créer de nouveaux projets</li>
                            <li>Basculer entre projets</li>
                            <li>Dupliquer ou supprimer</li>
                            <li>Stockage local sécurisé</li>
                        </ul>
                    `,
                    side: 'bottom',
                    align: 'end'
                }
            },

            // Stage 2: Core Writing Features
            {
                element: '.sidebar',
                popover: {
                    title: 'Structure du Projet',
                    description: `
                        <p>La barre latérale affiche la structure de votre histoire :</p>
                        <ul>
                            <li><strong>Actes</strong> : Grandes parties de votre récit</li>
                            <li><strong>Chapitres</strong> : Subdivisions des actes</li>
                            <li><strong>Scènes</strong> : Unités d'écriture individuelles</li>
                        </ul>
                        <p>Cliquez sur une scène pour l'éditer.</p>
                    `,
                    side: 'right',
                    align: 'start'
                }
            },
            {
                element: '#sceneEditor',
                popover: {
                    title: 'Éditeur de Scène',
                    description: `
                        <p>L'éditeur principal pour écrire vos scènes.</p>
                        <p>Fonctionnalités disponibles :</p>
                        <ul>
                            <li>Formatage de texte riche</li>
                            <li>Détection automatique des personnages</li>
                            <li>Compteur de mots en temps réel</li>
                            <li>Sauvegarde automatique</li>
                        </ul>
                    `,
                    side: 'left',
                    align: 'start'
                }
            },

            // Stage 3: Completion
            {
                element: '#headerProjectTitle',
                popover: {
                    title: '🎉 Visite Terminée !',
                    description: `
                        <p>Vous connaissez maintenant les bases de Plume !</p>
                        <p>Explorez les autres sections pour découvrir encore plus de fonctionnalités :</p>
                        <ul>
                            <li>Personnages et Univers</li>
                            <li>Visualisations et graphiques</li>
                            <li>Outils d'analyse et statistiques</li>
                        </ul>
                        <p><strong>Bon courage pour votre écriture ! ✍️</strong></p>
                    `,
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
                    title: '🪶 Bienvenue',
                    description: `
                        <p>Plume est votre espace d'écriture complet.</p>
                        <p>Découvrez les fonctionnalités principales.</p>
                    `,
                    side: 'bottom',
                    align: 'start'
                }
            },
            {
                element: '.sidebar',
                popover: {
                    title: 'Structure',
                    description: `
                        <p>Organisez votre histoire en actes, chapitres et scènes.</p>
                    `,
                    side: 'right',
                    align: 'start'
                }
            },
            {
                element: '#sceneEditor',
                popover: {
                    title: 'Éditeur',
                    description: `
                        <p>Écrivez vos scènes avec sauvegarde automatique.</p>
                    `,
                    side: 'left',
                    align: 'start'
                }
            },
            {
                element: '#headerProjectTitle',
                popover: {
                    title: '🎉 C\'est parti !',
                    description: `
                        <p>Vous êtes prêt à écrire votre histoire !</p>
                    `,
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
