// Initialize
// [MVVM : Other]
// Mixte (Controller/Initialization)
async function init() {
    // Initialiser le thème le plus tôt possible
    if (typeof ThemeManagerModule !== 'undefined') {
        ThemeManagerModule.init();
    } else if (typeof themeManager !== 'undefined') {
        themeManager.init();
    }

    // Initialiser la localisation
    if (typeof Localization !== 'undefined') {
        Localization.init();
    }

    // Initialiser les préférences d'interface
    if (typeof InterfaceCustomizerViewModel !== 'undefined') {
        InterfaceCustomizerViewModel.init();
        if (typeof InterfaceCustomizerView !== 'undefined' && InterfaceCustomizerView.init) {
            InterfaceCustomizerView.init();
        }
    }

    // Initialiser IndexedDB en premier
    const dbReady = await initDB();
    if (!dbReady) {
        console.error('❌ Impossible d\'initialiser la base de données');
        alert(Localization.t('error.db_init'));
        return;
    }

    // Charger les projets depuis IndexedDB
    try {
        await loadAllProjects();
    } catch (e) {
        console.error("❌ Erreur lors du chargement des projets:", e);
    }
    await loadTreeState(); // Charger l'état d'expansion

    // Forcer la vue Projets au démarrage
    switchView('projects');

    // Charger la liste des actes mais ne pas changer de vue
    renderActsList();

    // Initialiser l'historique avec l'état initial
    saveToHistory();

    // Initialize color pickers
    initializeColorPickers();

    // Initialize sidebar resize
    initSidebarResize();

    // Initialize floating editor menu (mobile)
    initFloatingEditorMenu();

    // Initialize touch gestures for editor
    initEditorGestures();

    // Initialize storage monitoring
    initStorageMonitoring();

    // Initialize Revision Module
    if (typeof RevisionModule !== 'undefined' && RevisionModule.init) {
        RevisionModule.init();
    }

    // Initialize scene versions sidebar
    if (typeof SceneVersionApp !== 'undefined' && SceneVersionApp.init) {
        SceneVersionApp.init();
    }
    renderSceneVersionsList();

    // Initialize progress bar
    updateProgressBar();

    // Auto-save every 30 seconds
    setInterval(saveProject, 30000);

    // Update storage badge every 10 seconds
    setInterval(updateStorageBadge, 10000);

    if (typeof initProductTourVM === 'function') {
        await initProductTourVM();
    }

    // Initialize Structure Blocks (Layers)
    if (typeof StructureBlockUI !== 'undefined' && StructureBlockUI.init) {
        StructureBlockUI.init();
    }

    // Initialize Mention Help (Auto-completion)
    if (typeof MentionHelp !== 'undefined' && MentionHelp.init) {
        MentionHelp.init();
    }

    // Ensure all icons are rendered
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// Fonction utilitaire pour convertir un nombre en chiffres romains
// [MVVM : Other]
// Fonction utilitaire pour convertir un nombre en chiffres romains (Utility)
function toRoman(num) {
    const romanNumerals = [
        { value: 10, numeral: 'X' },
        { value: 9, numeral: 'IX' },
        { value: 5, numeral: 'V' },
        { value: 4, numeral: 'IV' },
        { value: 1, numeral: 'I' }
    ];

    let result = '';
    for (const { value, numeral } of romanNumerals) {
        while (num >= value) {
            result += numeral;
            num -= value;
        }
    }
    return result;
}

// Save/Load from localStorage
// [MVVM : ViewModel]
// Gère la sauvegarde du projet avec debounce pour l'historique
async function saveProject() {
    try {
        // Sauvegarder dans IndexedDB
        const success = await saveProjectToDB(project);

        if (!success) {
            throw new Error('Échec de la sauvegarde IndexedDB');
        }

        // Mettre à jour le badge de stockage après chaque sauvegarde
        updateStorageBadge();

        console.log('💾 saveProject appelé - isUndoRedoAction:', isUndoRedoAction);

        // Si c'est une action undo/redo, ne pas sauvegarder dans l'historique
        if (isUndoRedoAction) {
            console.log('⏭️ Action undo/redo, pas de sauvegarde historique');
            return;
        }

        // Si c'est le premier changement (pas de timer actif)
        if (!historyDebounceTimer) {
            console.log('🆕 Premier changement - sauvegarde immédiate');
            // Sauvegarder l'état ACTUEL comme point de départ
            saveToHistory();
            lastSavedState = JSON.stringify(project);
        } else {
            console.log('⏱️ Timer existant, réinitialisation');
        }

        // Annuler le timer précédent
        if (historyDebounceTimer) {
            clearTimeout(historyDebounceTimer);
        }

        // Créer un nouveau timer
        historyDebounceTimer = setTimeout(() => {
            console.log('⏰ Timer expiré - vérification changements');
            // Sauvegarder l'état final après la pause
            const finalState = JSON.stringify(project);

            // Ne sauvegarder que si l'état a changé
            if (finalState !== lastSavedState) {
                console.log('✏️ État modifié - sauvegarde finale');
                saveToHistory();
                lastSavedState = finalState;
            } else {
                console.log('⏭️ Aucun changement détecté');
            }

            historyDebounceTimer = null; // Réinitialiser
        }, historyDebounceDelay);
    } catch (error) {
        console.error('❌ Erreur de sauvegarde:', error);
        alert(Localization.t('error.save'));
    }
}

// [MVVM : ViewModel]
// Gère le renommage du projet (Input et mise à jour Modèle/Vue)
function renameProject() {
    const newName = prompt(Localization.t('prompt.rename_project'), project.title || Localization.t('prompt.rename_project_default'));
    if (newName === null) return; // Annulé

    const trimmedName = newName.trim();
    if (trimmedName === '') {
        showNotification(Localization.t('notification.rename_empty'));
        return;
    }

    project.title = trimmedName;

    // Mettre à jour le titre dans le header
    const headerTitle = document.getElementById('headerProjectTitle');
    if (headerTitle) {
        headerTitle.textContent = trimmedName;
    }

    // Mettre à jour le titre de la page
    document.title = trimmedName + ' - Plume';

    saveProject();
    showNotification(Localization.t('notification.rename_success'));
}

// Lancer l'initialisation au chargement de la page
window.addEventListener('load', init);



// Close extra menu when clicking outside
window.addEventListener('click', (e) => {
    const extraMenu = document.getElementById('extraMenuDropdown');
    if (extraMenu && extraMenu.classList.contains('open') && !extraMenu.contains(e.target)) {
        extraMenu.classList.remove('open');
    }
});
