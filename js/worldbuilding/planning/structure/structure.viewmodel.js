/**
 * [MVVM : Structure ViewModel]
 * Logique métier pour la navigation et l'organisation du projet (Actes/Chapitres/Scènes).
 */

/**
 * Prépare toutes les données de structure pour l'affichage de l'arborescence.
 * Centralise le Read pour éviter que la View ne boucle directement sur project.acts.
 */
function getStructureViewModel() {
    return {
        success: true,
        acts: ActRepository.getAll().map(act => ({
            ...act,
            chaptersCount: (act.chapters || []).length,
            chapters: (act.chapters || []).map(chapter => ({
                ...chapter,
                scenesCount: (chapter.scenes || []).length
            }))
        })),
        characters: typeof CharacterRepository !== 'undefined' ? CharacterRepository.getAll() : (project.characters || []),
        world: project.world || [],
        metroTimeline: project.metroTimeline || []
    };
}

/**
 * Coordination pour ajouter un acte.
 */
function addActViewModel(title) {
    const validation = ValidationHelper.validateTitle(title);
    if (!validation.isValid) return { success: false, message: validation.message, error: validation.error };

    const trimmedTitle = validation.value;
    const duplicateCheck = ValidationHelper.checkDuplicate(trimmedTitle, ActRepository.getAll());
    if (duplicateCheck.isDuplicate) return { success: false, message: duplicateCheck.message, error: duplicateCheck.error };

    try {
        const act = createAct(trimmedTitle);
        return {
            success: true,
            data: act,
            message: `Acte "${trimmedTitle}" créé`,
            sideEffects: {
                repository: { action: 'ADD', collection: 'acts', data: act },
                shouldExpand: act.id,
                shouldSave: true
            }
        };
    } catch (error) {
        return { success: false, error: 'CREATION_FAILED', message: error.message };
    }
}

/**
 * Coordination pour supprimer un acte.
 */
function deleteActViewModel(actId, currentActId) {
    const act = ActRepository.getById(actId);
    if (!act) return { success: false, message: 'Acte introuvable' };

    const isCurrent = actId === currentActId;

    return {
        success: true,
        message: `Acte "${act.title}" supprimé`,
        sideEffects: {
            repository: { action: 'REMOVE', collection: 'acts', id: actId },
            shouldSave: true,
            shouldResetState: isCurrent
        }
    };
}

/**
 * Coordination pour mettre à jour un acte.
 */
function updateActViewModel(actId, updates) {
    if (updates.title) {
        const validation = ValidationHelper.validateTitle(updates.title);
        if (!validation.isValid) return { success: false, message: validation.message };
        updates.title = validation.value;
    }

    return {
        success: true,
        sideEffects: {
            repository: { action: 'UPDATE', collection: 'acts', id: actId, updates },
            shouldSave: true
        }
    };
}

/**
 * Coordination pour ajouter un chapitre.
 */
function addChapterViewModel(title, targetActId) {
    const validation = ValidationHelper.validateTitle(title);
    if (!validation.isValid) return { success: false, message: validation.message };

    const trimmedTitle = validation.value;
    let actId = targetActId;
    let autoCreatedAct = null;

    // Fallback si pas d'acte cible
    if (!actId) {
        const acts = ActRepository.getAll();
        if (acts.length === 0) {
            autoCreatedAct = createAct('Roman');
            actId = autoCreatedAct.id;
        } else {
            actId = acts[0].id;
        }
    }

    const duplicateCheck = ValidationHelper.checkDuplicate(trimmedTitle, ChapterRepository.getAll(actId));
    if (duplicateCheck.isDuplicate) return { success: false, message: 'Ce titre existe déjà dans cet acte' };

    try {
        const chapter = createChapter(trimmedTitle);

        // Option 1: Implicit Scene creation
        const scene = createScene(trimmedTitle); // First scene takes chapter title
        chapter.scenes.push(scene);

        const repoActions = [];
        if (autoCreatedAct) repoActions.push({ action: 'ADD', collection: 'acts', data: autoCreatedAct });
        repoActions.push({ action: 'ADD', collection: 'chapters', actId: actId, data: chapter });

        return {
            success: true,
            data: { actId, chapter },
            message: `Chapitre "${trimmedTitle}" créé`,
            sideEffects: {
                repository: repoActions,
                shouldExpandAct: actId,
                shouldExpandChapter: chapter.id,
                shouldSave: true,
                shouldOpenScene: { actId, chapterId: chapter.id, sceneId: scene.id }
            }
        };
    } catch (error) {
        return { success: false, error: 'CREATION_FAILED', message: error.message };
    }
}

/**
 * Coordination pour ajouter plusieurs chapitres en masse.
 */
function batchAddChaptersViewModel(baseTitle, count, targetActId) {
    if (!baseTitle || count <= 0) return { success: false, message: 'Paramètres invalides' };

    let actId = targetActId;
    let autoCreatedAct = null;

    // Fallback si pas d'acte cible
    if (!actId) {
        const acts = ActRepository.getAll();
        if (acts.length === 0) {
            autoCreatedAct = createAct('Roman');
            actId = autoCreatedAct.id;
        } else {
            actId = acts[0].id;
        }
    }

    const repoActions = [];
    if (autoCreatedAct) repoActions.push({ action: 'ADD', collection: 'acts', data: autoCreatedAct });

    const createdChapters = [];
    for (let i = 1; i <= count; i++) {
        const title = `${baseTitle} ${i}`;
        const chapter = createChapter(title);
        const scene = createScene(title);
        chapter.scenes.push(scene);

        repoActions.push({ action: 'ADD', collection: 'chapters', actId: actId, data: chapter });
        createdChapters.push(chapter);
    }

    return {
        success: true,
        data: { actId, chapters: createdChapters },
        message: `${count} chapitres créés`,
        sideEffects: {
            repository: repoActions,
            shouldExpandAct: actId,
            shouldSave: true,
            // We don't necessarily want to open the last scene of 45 chapters automatically
            shouldOpenScene: count === 1 ? { actId, chapterId: createdChapters[0].id, sceneId: createdChapters[0].scenes[0].id } : null
        }
    };
}

/**
 * Coordination pour supprimer un chapitre.
 */
function deleteChapterViewModel(actId, chapterId, currentChapterId) {
    const chapter = ChapterRepository.getById(actId, chapterId);
    if (!chapter) return { success: false, message: 'Chapitre introuvable' };

    return {
        success: true,
        message: `Chapitre "${chapter.title}" supprimé`,
        sideEffects: {
            repository: { action: 'REMOVE', collection: 'chapters', actId, id: chapterId },
            shouldSave: true,
            shouldResetState: chapterId === currentChapterId
        }
    };
}

/**
 * Coordination pour mettre à jour un chapitre.
 */
function updateChapterViewModel(actId, chapterId, updates) {
    if (updates.title) {
        const validation = ValidationHelper.validateTitle(updates.title);
        if (!validation.isValid) return { success: false, message: validation.message };
        updates.title = validation.value;
    }

    return {
        success: true,
        sideEffects: {
            repository: { action: 'UPDATE', collection: 'chapters', actId, id: chapterId, updates },
            shouldSave: true
        }
    };
}

/**
 * Coordination pour ajouter une scène.
 */
function addSceneViewModel(title, actId, chapterId) {
    const validation = ValidationHelper.validateTitle(title);
    if (!validation.isValid) return { success: false, message: validation.message };

    if (!actId || !chapterId) return { success: false, message: 'Sélectionnez d\'abord un chapitre' };

    const duplicateCheck = ValidationHelper.checkDuplicate(validation.value, SceneRepository.getAll(actId, chapterId));
    if (duplicateCheck.isDuplicate) return { success: false, message: 'Ce titre existe déjà dans ce chapitre' };

    try {
        const scene = createScene(validation.value);
        return {
            success: true,
            data: scene,
            message: `Scène "${scene.title}" créée`,
            sideEffects: {
                repository: { action: 'ADD', collection: 'scenes', actId, chapterId, data: scene },
                shouldExpandAct: actId,
                shouldExpandChapter: chapterId,
                shouldSave: true,
                shouldOpenScene: { actId, chapterId, sceneId: scene.id }
            }
        };
    } catch (error) {
        return { success: false, error: 'CREATION_FAILED', message: error.message };
    }
}

/**
 * Coordination pour supprimer une scène.
 */
function deleteSceneViewModel(actId, chapterId, sceneId, currentSceneId) {
    const scene = SceneRepository.getById(actId, chapterId, sceneId);
    if (!scene) return { success: false, message: 'Scène introuvable' };

    return {
        success: true,
        message: `Scène "${scene.title}" supprimée`,
        sideEffects: {
            repository: { action: 'REMOVE', collection: 'scenes', actId, chapterId, id: sceneId },
            shouldSave: true,
            shouldResetState: sceneId === currentSceneId
        }
    };
}

/**
 * Coordination pour mettre à jour une scène.
 */
function updateSceneViewModel(actId, chapterId, sceneId, updates) {
    if (updates.title) {
        const validation = ValidationHelper.validateTitle(updates.title);
        if (!validation.isValid) return { success: false, message: validation.message };
        updates.title = validation.value;
    }

    return {
        success: true,
        sideEffects: {
            repository: { action: 'UPDATE', collection: 'scenes', actId, chapterId, id: sceneId, updates },
            shouldSave: true
        }
    };
}

/**
 * Coordination pour mettre à jour le statut d'une scène.
 */
function setSceneStatusViewModel(actId, chapterId, sceneId, status) {
    const validStatuses = ['draft', 'progress', 'complete', 'review'];
    if (!validStatuses.includes(status)) return { success: false, message: 'Statut invalide' };

    return updateSceneViewModel(actId, chapterId, sceneId, { status });
}

/**
 * Coordination pour réorganiser les éléments (drag & drop).
 */
function reorderStructureViewModel(type, ids, actId, chapterId) {
    let result = false;
    let collection = '';

    if (type === 'acts') {
        result = ActRepository.reorder(ids);
        collection = 'acts';
    } else if (type === 'chapters') {
        result = ChapterRepository.reorder(actId, ids);
        collection = 'chapters';
    } else if (type === 'scenes') {
        result = SceneRepository.reorder(actId, chapterId, ids);
        collection = 'scenes';
    }

    return {
        success: result,
        sideEffects: {
            shouldSave: true,
            shouldRefresh: true
        }
    };
}

