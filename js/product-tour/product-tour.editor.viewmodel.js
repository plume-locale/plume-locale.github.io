/**
 * [MVVM : Product Tour Editor ViewModel]
 * Logique de gestion de l'édition du tour.
 */

const ProductTourEditorViewModel = {
    state: {
        isActive: false,
        currentTour: [], // Liste des steps pour la vue actuelle
        currentView: 'editor'
    },

    /**
     * Initialise l'éditeur.
     */
    init: function () {
        // Sécurité : n'autoriser l'éditeur que si le paramètre ?editTour=true est présent dans l'URL
        const urlParams = new URLSearchParams(window.location.search);
        if (!urlParams.has('editTour')) {
            return;
        }

        ProductTourEditorView.init();
        this.state.currentView = typeof currentView !== 'undefined' ? currentView : 'editor';
        this.loadCurrentTour();
    },

    /**
     * Bascule l'état de l'éditeur.
     */
    toggleEditor: function () {
        this.state.isActive = !this.state.isActive;
        ProductTourEditorView.toggleSidebar(this.state.isActive);

        if (this.state.isActive) {
            ProductTourNotificationView.showSuccess("Mode Édition du Tour activé (Ctrl+Alt+T pour quitter)");
            this.loadCurrentTour();
        } else {
            ProductTourNotificationView.showInfo("Mode Édition du Tour désactivé");
            if (this.state.previewDriver) {
                this.state.previewDriver.destroy();
                this.state.previewDriver = null;
            }
            if (ProductTourEditorView.isSelectionModeActive()) {
                ProductTourEditorView.toggleSelectionMode();
            }
        }
    },

    /**
     * Bascule le mode de sélection d'élément.
     */
    toggleSelectionMode: function () {
        ProductTourEditorView.toggleSelectionMode();
    },

    /**
     * Charge le tour pour la vue actuelle depuis le repository (ou défaut).
     */
    loadCurrentTour: async function () {
        this.state.currentView = typeof currentView !== 'undefined' ? currentView : 'editor';

        // Pour l'instant on récupère les steps par défaut du modèle
        // Plus tard on chargera depuis storage
        const steps = await ProductTourStepsRepository.getAllSteps(this.state.currentView);
        this.state.currentTour = [...steps];

        ProductTourEditorView.renderSidebar(this.state.currentTour);
    },

    /**
     * Ajoute ou met à jour une étape.
     */
    addOrUpdateStep: function (stepData) {
        // On vérifie si une étape avec le même sélecteur existe déjà
        const index = this.state.currentTour.findIndex(s => s.element === stepData.element);

        if (index !== -1) {
            this.state.currentTour[index] = ProductTourStepModel.create(stepData);
        } else {
            this.state.currentTour.push(ProductTourStepModel.create(stepData));
        }

        ProductTourEditorView.renderSidebar(this.state.currentTour);
    },

    /**
     * Supprime une étape.
     */
    removeStep: function (index) {
        this.state.currentTour.splice(index, 1);
        ProductTourEditorView.renderSidebar(this.state.currentTour);
    },

    /**
     * Ouvre le modal pour éditer une étape existante.
     */
    editStep: function (index) {
        const step = this.state.currentTour[index];
        ProductTourEditorView.showModal(step.element, {
            title: step.popover.title,
            description: step.popover.description,
            image: step.popover.image,
            side: step.popover.side,
            align: step.popover.align,
            clickBefore: step.clickBefore,
            clickAfter: step.clickAfter
        });
    },

    /**
     * Déplace une étape vers le haut.
     */
    moveStepUp: function (index) {
        if (index <= 0) return;
        const steps = this.state.currentTour;
        [steps[index - 1], steps[index]] = [steps[index], steps[index - 1]];
        ProductTourEditorView.renderSidebar(steps);
    },

    /**
     * Déplace une étape vers le bas.
     */
    moveStepDown: function (index) {
        const steps = this.state.currentTour;
        if (index >= steps.length - 1) return;
        [steps[index + 1], steps[index]] = [steps[index], steps[index + 1]];
        ProductTourEditorView.renderSidebar(steps);
    },

    /**
     * Prévisualise une étape spécifique.
     */
    previewStep: async function (index) {
        const step = this.state.currentTour[index];
        if (!step) return;

        // Arrêter tout tour ou preview en cours
        if (this.state.previewDriver) {
            this.state.previewDriver.destroy();
            this.state.previewDriver = null;
        }
        if (typeof stopProductTourVM === 'function') {
            stopProductTourVM();
        }

        // Préparer une copie pour le preview
        const previewStep = JSON.parse(JSON.stringify(step));

        // Enrichissement identique au ViewModel principal
        if (previewStep.popover.image) {
            const imgHtml = `<img src="${previewStep.popover.image}" class="driver-popover-image">`;
            previewStep.popover.description = imgHtml + (previewStep.popover.description || '');
        }

        // Action avant
        if (previewStep.clickBefore) {
            const elToClick = document.querySelector(previewStep.clickBefore);
            if (elToClick) elToClick.click();
        }

        // Utiliser Driver.js directement pour un preview rapide
        const driverFn = window.driver?.js?.driver || window.driver?.driver || window.driver;
        if (typeof driverFn !== 'function') return;

        // Config simplifiée pour le preview
        this.state.previewDriver = driverFn({
            animate: true,
            opacity: 0.75,
            padding: 10,
            allowClose: true,
            overlayClickNext: false,
            showButtons: ['close'],
            showProgress: false,
            onDeselected: () => {
                this.state.previewDriver = null;
            }
        });

        // Lancer le highlight avec un petit délai si action avant
        const highlight = () => {
            if (this.state.previewDriver) {
                this.state.previewDriver.highlight(previewStep);
            }
        };

        if (previewStep.clickBefore) {
            setTimeout(highlight, 100);
        } else {
            highlight();
        }
    },

    /**
     * Sauvegarde le tour actuel dans la DB (temporaire).
     */
    saveTour: async function () {
        try {
            await ProductTourStepsRepository.saveCustomTour(this.state.currentView, this.state.currentTour);
            ProductTourNotificationView.showSuccess("Le tour a été sauvegardé dans la base temporaire.");
        } catch (error) {
            console.error('Error saving tour:', error);
            ProductTourNotificationView.showError("Erreur lors de la sauvegarde du tour.");
        }
    },

    /**
     * Exporte le tour sous forme de JSON pour le fichier product-tour.data.js.
     */
    exportTourJSON: function () {
        if (!this.state.currentTour || this.state.currentTour.length === 0) {
            ProductTourNotificationView.showInfo("Le tour est vide.");
            return;
        }

        // On nettoie un peu le JSON pour qu'il soit propre
        const cleanTour = this.state.currentTour.map(step => {
            const s = { ...step };
            // Supprimer les champs nuls ou vides pour alléger le fichier
            if (!s.clickBefore) delete s.clickBefore;
            if (!s.clickAfter) delete s.clickAfter;
            if (!s.popover.image) delete s.popover.image;
            return s;
        });

        const json = JSON.stringify(cleanTour, null, 4);

        // Copier dans le presse-papier
        navigator.clipboard.writeText(json).then(() => {
            ProductTourNotificationView.showSuccess("JSON copié dans le presse-papier ! Collez-le dans product-tour.data.js");
            console.log("--- EXPORT JSON ---");
            console.log(json);
            console.log("-------------------");
        }).catch(err => {
            console.error('Could not copy text: ', err);
            // Fallback si clipboard échoue
            alert("Erreur de copie automatique. Le JSON a été affiché dans la console (F12).");
        });
    }
};

// Initialiser l'éditeur quand le DOM est prêt
setTimeout(() => {
    ProductTourEditorViewModel.init();
}, 2000);
