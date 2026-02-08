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
        name: name,
        type: type,
        description: description
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
        const type = elem.type || 'Autre';
        if (!groups[type]) groups[type] = [];
        groups[type].push(WorldModel.migrate(elem));
    });

    // Sort elements alphabetically within each group
    Object.keys(groups).forEach(type => {
        groups[type].sort((a, b) => {
            return (a.name || '').toLowerCase().localeCompare((b.name || '').toLowerCase(), 'fr');
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
    const updated = WorldRepository.update(id, { [field]: value });

    return {
        success: !!updated,
        sideEffects: {
            shouldSave: true,
            shouldRefreshList: (field === 'name' || field === 'type')
        }
    };
}
