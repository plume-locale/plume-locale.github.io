/**
 * [MVVM : Product Tour Repository]
 * Couche d'accès aux données pour le système de visite guidée.
 */

console.log('🎓 Product Tour Repository loaded');

// ============================================
// GLOBAL STATE
// ============================================

let productTourState = ProductTourStateModel.createInitial();
let driverInstance = null;

// ============================================
// STATE REPOSITORY
// ============================================

const ProductTourStateRepository = {
    /**
     * Charge l'état du tour depuis le storage.
     * @returns {Promise<Object>} État du tour.
     */
    loadState: async function () {
        try {
            const saved = await loadSetting('productTourState');
            if (saved) {
                productTourState = ProductTourStateModel.migrate(saved);
            } else {
                productTourState = ProductTourStateModel.createInitial();
            }
            return productTourState;
        } catch (error) {
            console.error('Error loading tour state:', error);
            productTourState = ProductTourStateModel.createInitial();
            return productTourState;
        }
    },

    /**
     * Sauvegarde l'état du tour.
     * @param {Object} state - État à sauvegarder.
     * @returns {Promise<boolean>} Succès de la sauvegarde.
     */
    saveState: async function (state) {
        try {
            productTourState = ProductTourStateModel.validate(state);
            await saveSetting('productTourState', productTourState);
            return true;
        } catch (error) {
            console.error('Error saving tour state:', error);
            return false;
        }
    },

    /**
     * Récupère l'état actuel du tour.
     * @returns {Object} État actuel.
     */
    getState: function () {
        return { ...productTourState };
    },

    /**
     * Marque le tour comme complété.
     * @returns {Promise<boolean>} Succès de l'opération.
     */
    markCompleted: async function () {
        productTourState.completed = true;
        productTourState.lastShown = new Date().toISOString();
        return await this.saveState(productTourState);
    },

    /**
     * Marque le tour comme ignoré.
     * @returns {Promise<boolean>} Succès de l'opération.
     */
    markSkipped: async function () {
        productTourState.skipped = true;
        productTourState.lastShown = new Date().toISOString();
        return await this.saveState(productTourState);
    },

    /**
     * Réinitialise l'état du tour.
     * @returns {Promise<boolean>} Succès de l'opération.
     */
    reset: async function () {
        productTourState = ProductTourStateModel.createInitial();
        return await this.saveState(productTourState);
    },

    /**
     * Met à jour le step actuel.
     * @param {number} stepIndex - Index du step.
     * @returns {Promise<boolean>} Succès de l'opération.
     */
    updateCurrentStep: async function (stepIndex) {
        productTourState.currentStep = stepIndex;
        return await this.saveState(productTourState);
    },

    /**
     * Met à jour les préférences.
     * @param {Object} preferences - Nouvelles préférences.
     * @returns {Promise<boolean>} Succès de l'opération.
     */
    updatePreferences: async function (preferences) {
        productTourState.preferences = {
            ...productTourState.preferences,
            ...preferences
        };
        return await this.saveState(productTourState);
    },

    /**
     * Vérifie si c'est la première visite.
     * @returns {boolean} True si première visite.
     */
    isFirstVisit: function () {
        return !productTourState.completed && !productTourState.skipped;
    },

    /**
     * Vérifie si le tour doit être affiché au démarrage.
     * @returns {boolean} True si doit être affiché.
     */
    shouldShowOnStartup: function () {
        return this.isFirstVisit() && productTourState.preferences.showOnStartup;
    }
};

// ============================================
// DRIVER REPOSITORY
// ============================================

const ProductTourDriverRepository = {
    /**
     * Attend que Driver.js soit chargé.
     * @param {number} timeout - Timeout en ms (défaut: 5000).
     * @returns {Promise<boolean>} True si chargé, false sinon.
     */
    waitForDriver: function (timeout = 10000) {
        return new Promise((resolve) => {
            const startTime = Date.now();
            let checkCount = 0;
            
            const checkDriver = () => {
                checkCount++;
                const elapsed = Date.now() - startTime;
                
                // Check for driver.js IIFE bundle export: window.driver.js.driver
                const driverFn = window.driver?.js?.driver || window.driver?.driver || window.driver;
                
                if (typeof driverFn === 'function') {
                    console.log(`✅ Driver.js loaded after ${elapsed}ms (${checkCount} checks)`);
                    resolve(true);
                    return;
                }
                
                if (elapsed > timeout) {
                    console.error(`❌ Driver.js library loading timeout after ${elapsed}ms (${checkCount} checks)`);
                    console.error('window.driver:', window.driver);
                    console.error('window.driver.js:', window.driver?.js);
                    console.error('window.driver.js.driver:', window.driver?.js?.driver);
                    resolve(false);
                    return;
                }
                
                // Log every second
                if (checkCount % 10 === 0) {
                    console.log(`⏳ Waiting for Driver.js... ${elapsed}ms elapsed`);
                }
                
                setTimeout(checkDriver, 100);
            };
            
            checkDriver();
        });
    },

    /**
     * Initialise une instance Driver.js.
     * @param {Object} config - Configuration Driver.js.
     * @param {Array} steps - Steps du tour.
     * @returns {Promise<Object|null>} Instance Driver.js ou null.
     */
    createDriver: async function (config, steps) {
        try {
            // Attendre que Driver.js soit chargé
            const isLoaded = await this.waitForDriver();
            if (!isLoaded) {
                console.error('Driver.js library not loaded');
                return null;
            }
            
            // Get the driver function from the IIFE bundle
            // The bundle exports to window.driver.js.driver
            const driverFn = window.driver?.js?.driver || window.driver?.driver || window.driver;
            
            if (typeof driverFn !== 'function') {
                console.error('Driver function not found or not a function:', typeof driverFn);
                return null;
            }

            // Filtrer les steps valides
            const validSteps = ProductTourStepsModel.filterValidSteps(steps);
            
            if (validSteps.length === 0) {
                console.warn('No valid steps found for tour');
                return null;
            }

            driverInstance = driverFn({
                ...config,
                steps: validSteps
            });

            return driverInstance;
        } catch (error) {
            console.error('Error creating driver instance:', error);
            return null;
        }
    },

    /**
     * Récupère l'instance Driver.js actuelle.
     * @returns {Object|null} Instance Driver.js.
     */
    getDriver: function () {
        return driverInstance;
    },

    /**
     * Démarre le tour.
     * @returns {boolean} Succès du démarrage.
     */
    startTour: function () {
        if (!driverInstance) {
            console.error('Driver instance not initialized');
            return false;
        }

        try {
            driverInstance.drive();
            return true;
        } catch (error) {
            console.error('Error starting tour:', error);
            return false;
        }
    },

    /**
     * Arrête le tour.
     * @returns {boolean} Succès de l'arrêt.
     */
    stopTour: function () {
        if (!driverInstance) {
            return true;
        }

        try {
            driverInstance.destroy();
            driverInstance = null;
            return true;
        } catch (error) {
            console.error('Error stopping tour:', error);
            return false;
        }
    },

    /**
     * Passe au step suivant.
     * @returns {boolean} Succès de l'opération.
     */
    moveNext: function () {
        if (!driverInstance) {
            return false;
        }

        try {
            driverInstance.moveNext();
            return true;
        } catch (error) {
            console.error('Error moving to next step:', error);
            return false;
        }
    },

    /**
     * Revient au step précédent.
     * @returns {boolean} Succès de l'opération.
     */
    movePrevious: function () {
        if (!driverInstance) {
            return false;
        }

        try {
            driverInstance.movePrevious();
            return true;
        } catch (error) {
            console.error('Error moving to previous step:', error);
            return false;
        }
    },

    /**
     * Va à un step spécifique.
     * @param {number} index - Index du step.
     * @returns {boolean} Succès de l'opération.
     */
    moveTo: function (index) {
        if (!driverInstance) {
            return false;
        }

        try {
            driverInstance.moveTo(index);
            return true;
        } catch (error) {
            console.error('Error moving to step:', error);
            return false;
        }
    },

    /**
     * Récupère l'index du step actuel.
     * @returns {number} Index du step actuel.
     */
    getCurrentStepIndex: function () {
        if (!driverInstance) {
            return 0;
        }

        try {
            return driverInstance.getActiveIndex() || 0;
        } catch (error) {
            console.error('Error getting current step:', error);
            return 0;
        }
    },

    /**
     * Vérifie si le tour est actif.
     * @returns {boolean} True si actif.
     */
    isActive: function () {
        return driverInstance !== null && driverInstance.isActive();
    },

    /**
     * Nettoie l'instance Driver.js.
     */
    cleanup: function () {
        if (driverInstance) {
            try {
                driverInstance.destroy();
            } catch (error) {
                console.error('Error cleaning up driver:', error);
            }
            driverInstance = null;
        }
    }
};

// ============================================
// STEPS REPOSITORY
// ============================================

const ProductTourStepsRepository = {
    /**
     * Récupère tous les steps du tour.
     * @returns {Array} Liste des steps.
     */
    getAllSteps: function () {
        return ProductTourStepsModel.getAllSteps();
    },

    /**
     * Récupère les steps desktop.
     * @returns {Array} Steps desktop.
     */
    getDesktopSteps: function () {
        return ProductTourStepsModel.getDesktopSteps();
    },

    /**
     * Récupère les steps mobile.
     * @returns {Array} Steps mobile.
     */
    getMobileSteps: function () {
        return ProductTourStepsModel.getMobileSteps();
    },

    /**
     * Filtre les steps valides.
     * @param {Array} steps - Steps à filtrer.
     * @returns {Array} Steps valides.
     */
    filterValidSteps: function (steps) {
        return ProductTourStepsModel.filterValidSteps(steps);
    }
};
