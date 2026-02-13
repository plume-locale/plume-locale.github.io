/**
 * [MVVM : AutoDetect ViewModel]
 * Logique métier de détection et orchestration des changements d'état.
 */

const AutoDetectViewModel = {
    timeout: null,

    /**
     * Lance la détection avec debounce.
     */
    autoDetectLinksDebounced() {
        clearTimeout(this.timeout);
        this.timeout = setTimeout(() => {
            this.autoDetectLinks();
        }, 800);
    },

    /**
     * Cœur de la logique de détection.
     */
    autoDetectLinks() {
        const scene = AutoDetectRepository.getCurrentScene();
        if (!scene) return;

        // Obtenir le texte brut
        let editor = null;
        if (typeof currentSceneId !== 'undefined' && currentSceneId) {
            editor = document.querySelector(`.editor-textarea[data-scene-id="${currentSceneId}"]`);
        }
        if (!editor) {
            editor = document.querySelector('.editor-textarea');
        }
        if (!editor) return;

        const temp = document.createElement('div');
        temp.innerHTML = editor.innerHTML;
        const sceneText = temp.textContent || temp.innerText || '';
        const normalizedText = AutoDetectModel.normalizeForSearch(sceneText);

        // Initialisation/Migration
        this.ensureDataStructure(scene);

        let hasChanges = false;

        // --- 1. PERSONNAGES ---
        const characters = AutoDetectRepository.getCharacters();
        const lastNameCounts = {};
        characters.forEach(char => {
            const normalizedLastName = AutoDetectModel.normalizeForSearch(char.lastName || '');
            if (normalizedLastName) {
                lastNameCounts[normalizedLastName] = (lastNameCounts[normalizedLastName] || 0) + 1;
            }
        });

        const ambiguousLastNames = new Set(
            Object.keys(lastNameCounts).filter(name => lastNameCounts[name] > 1)
        );

        characters.forEach(char => {
            const namesToDetect = [];
            if (char.name && char.name.trim()) namesToDetect.push(char.name.trim());
            if (char.firstName && char.firstName.trim()) namesToDetect.push(char.firstName.trim());
            if (char.nickname && char.nickname.trim()) namesToDetect.push(char.nickname.trim());

            if (char.lastName && char.lastName.trim()) {
                const normalizedLastName = AutoDetectModel.normalizeForSearch(char.lastName);
                if (!ambiguousLastNames.has(normalizedLastName)) {
                    namesToDetect.push(char.lastName.trim());
                }
            }

            const uniqueNamesNormalized = [...new Set(namesToDetect)]
                .filter(n => n && n.trim())
                .map(name => AutoDetectModel.normalizeForSearch(name));

            let isInText = false;
            for (const name of uniqueNamesNormalized) {
                const regex = new RegExp('\\b' + AutoDetectModel.escapeRegex(name) + '\\b', 'i');
                if (regex.test(normalizedText)) {
                    isInText = true;
                    break;
                }
            }

            const isConfirmedPresent = scene.confirmedPresentCharacters.includes(char.id);
            const isSuggested = scene.suggestedCharacters.includes(char.id);
            const isConfirmedAbsent = scene.confirmedAbsentCharacters.includes(char.id);

            if (isInText) {
                if (!isConfirmedPresent && !isConfirmedAbsent && !isSuggested) {
                    scene.suggestedCharacters.push(char.id);
                    hasChanges = true;
                }
            } else {
                if (isSuggested) {
                    AutoDetectModel.removeIdfromArray(scene.suggestedCharacters, char.id);
                    hasChanges = true;
                }
            }
        });

        // --- 2. LIEUX/ÉLÉMENTS ---
        const elements = AutoDetectRepository.getWorldElements();
        elements.forEach(elem => {
            const elemNameNormalized = AutoDetectModel.normalizeForSearch(elem.name);
            const regex = new RegExp('\\b' + AutoDetectModel.escapeRegex(elemNameNormalized) + '\\b', 'i');
            const isInText = regex.test(normalizedText);
            const isLinked = scene.linkedElements.includes(elem.id);

            if (isInText && !isLinked) {
                scene.linkedElements.push(elem.id);
                hasChanges = true;
            } else if (!isInText && isLinked) {
                AutoDetectModel.removeIdfromArray(scene.linkedElements, elem.id);
                hasChanges = true;
            }
        });

        if (hasChanges) {
            AutoDetectRepository.save();
            AutoDetectView.refresh();
            if (typeof ToolsSidebarViewModel !== 'undefined') {
                ToolsSidebarViewModel.updateAllBadges();
            }
        }
    },

    /**
     * S'assure que les tableaux nécessaires existent dans la scène.
     */
    ensureDataStructure(scene) {
        if (!scene.confirmedPresentCharacters) scene.confirmedPresentCharacters = [];
        if (!scene.suggestedCharacters) scene.suggestedCharacters = [];
        if (!scene.confirmedAbsentCharacters) scene.confirmedAbsentCharacters = [];
        if (!scene.linkedElements) scene.linkedElements = [];

        // Rétro-compatibilité
        if (scene.linkedCharacters && scene.linkedCharacters.length > 0 && scene.confirmedPresentCharacters.length === 0) {
            scene.confirmedPresentCharacters = [...scene.linkedCharacters];
            scene.linkedCharacters = [];
        }
    },

    /**
     * Confirme la présence d'un personnage.
     */
    confirmPresence(charId) {
        const scene = AutoDetectRepository.getCurrentScene();
        if (!scene) return;

        AutoDetectModel.removeIdfromArray(scene.suggestedCharacters, charId);
        AutoDetectModel.removeIdfromArray(scene.confirmedAbsentCharacters, charId);

        if (!scene.confirmedPresentCharacters.includes(charId)) {
            scene.confirmedPresentCharacters.push(charId);
        }

        AutoDetectRepository.save();
        AutoDetectView.refresh();
        if (typeof ToolsSidebarViewModel !== 'undefined') {
            ToolsSidebarViewModel.updateAllBadges();
        }
    },

    /**
     * Confirme l'absence d'un personnage.
     */
    confirmAbsence(charId) {
        const scene = AutoDetectRepository.getCurrentScene();
        if (!scene) return;

        AutoDetectModel.removeIdfromArray(scene.suggestedCharacters, charId);
        AutoDetectModel.removeIdfromArray(scene.confirmedPresentCharacters, charId);

        if (!scene.confirmedAbsentCharacters.includes(charId)) {
            scene.confirmedAbsentCharacters.push(charId);
        }

        AutoDetectRepository.save();
        AutoDetectView.refresh();
        if (typeof ToolsSidebarViewModel !== 'undefined') {
            ToolsSidebarViewModel.updateAllBadges();
        }
    },

    /**
     * Bascule l'état d'un personnage (utilisé par Linker manuel).
     */
    toggleCharacterAction(charId) {
        const scene = AutoDetectRepository.getCurrentScene();
        if (!scene) return;

        const isConfirmedPresent = scene.confirmedPresentCharacters.includes(charId);

        if (isConfirmedPresent) {
            AutoDetectModel.removeIdfromArray(scene.confirmedPresentCharacters, charId);
        } else {
            scene.confirmedPresentCharacters.push(charId);
            AutoDetectModel.removeIdfromArray(scene.suggestedCharacters, charId);
            AutoDetectModel.removeIdfromArray(scene.confirmedAbsentCharacters, charId);
        }

        AutoDetectRepository.save();
        AutoDetectView.refresh();
        if (typeof ToolsSidebarViewModel !== 'undefined') {
            ToolsSidebarViewModel.updateAllBadges();
        }
    }
};
