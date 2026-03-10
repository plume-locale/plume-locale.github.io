/**
 * [MVVM : World ViewModel]
 * Business logic and data preparation for the World UI.
 */

/**
 * Coordination to add a world element.
 */
function addWorldElementViewModel(name, type, description) {
    if (!name) return { success: false, message: Localization.t('world.error.name_required') };

    const elementData = {
        category: type,
        fields: {
            nom: name.trim(),
            resume_court: description ? description.trim() : ''
        }
    };

    const newElement = WorldModel.create(elementData);
    WorldRepository.add(newElement);

    return {
        success: true,
        element: newElement,
        sideEffects: {
            shouldSave: true,
            shouldRefreshList: true,
            shouldCloseModal: 'addWorldModal'
        }
    };
}

/**
 * Coordination to delete a world element.
 */
function deleteWorldElementViewModel(id) {
    WorldRepository.remove(id);

    return {
        success: true,
        sideEffects: {
            shouldSave: true,
            shouldRefreshList: true,
            shouldShowEmptyState: true
        }
    };
}

/**
 * Group world elements by type for display.
 */
function getGroupedWorldElementsViewModel() {
    const elements = WorldRepository.getAll();
    const groups = {};

    elements.forEach(elem => {
        const migrated = WorldModel.migrate(elem);
        const category = migrated.category || 'Autre';
        if (!groups[category]) groups[category] = [];
        groups[category].push(migrated);
    });

    // Sort elements alphabetically within each group using fields.nom
    Object.keys(groups).forEach(cat => {
        groups[cat].sort((a, b) => {
            const nameA = (a.fields && a.fields.nom) ? a.fields.nom : (a.name || '');
            const nameB = (b.fields && b.fields.nom) ? b.fields.nom : (b.name || '');
            return nameA.toLowerCase().localeCompare(nameB.toLowerCase(), 'fr');
        });
    });

    return groups;
}

/**
 * Prepare data for the detail view of a world element.
 */
function getWorldDetailViewModel(id) {
    const rawElement = WorldRepository.getById(id);
    if (!rawElement) return null;

    const element = WorldModel.migrate(rawElement);
    const linkedScenes = getLinkedScenesForElementViewModel(id);

    return {
        element,
        linkedScenes
    };
}

/**
 * Get scenes linked to a world element.
 */
function getLinkedScenesForElementViewModel(elementId) {
    if (typeof findScenesWithElement !== 'function') return [];

    const scenes = findScenesWithElement(elementId);

    return scenes.map(scene => {
        const acts = (typeof project !== 'undefined' && project.acts) ? project.acts : [];
        const actIndex = acts.findIndex(a => a.id === scene.actId);

        // Calculation of act and chapter indices for breadcrumbs
        const actNumber = actIndex !== -1 ? toRoman(actIndex + 1) : '?';

        let chapterNumber = '?';
        if (actIndex !== -1) {
            const chapIndex = acts[actIndex].chapters.findIndex(c => c.id === scene.chapterId);
            if (chapIndex !== -1) chapterNumber = chapIndex + 1;
        }

        return {
            ...scene,
            actNumber,
            chapterNumber,
            breadcrumb: Localization.t('world.breadcrumb', actNumber, chapterNumber, scene.sceneTitle)
        };
    });
}

/**
 * Generic field update.
 */
function updateWorldFieldViewModel(id, field, value) {
    const element = WorldRepository.getById(id);
    if (!element) return { success: false, sideEffects: {} };

    const updates = {};
    if (field === 'category') {
        updates.category = value;
        updates.type = value; // Retro-compatibility
    } else {
        updates.fields = { ...(element.fields || {}) };
        updates.fields[field] = value;
        if (field === 'nom') updates.name = value;
    }

    const updated = WorldRepository.update(id, updates);

    return {
        success: !!updated,
        sideEffects: {
            shouldSave: true,
            shouldRefreshList: (field === 'nom' || field === 'name' || field === 'category')
        }
    };
}
