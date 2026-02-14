/**
 * Search Model
 * Définit les structures de données pour le système de recherche globale
 */

/**
 * Utilitaire pour s'assurer qu'une valeur est une chaîne
 * @param {*} value - Valeur à convertir
 * @param {string} defaultValue - Valeur par défaut
 * @returns {string} Chaîne de caractères
 */
const ensureString = (value, defaultValue = '') => {
    if (value === null || value === undefined) return defaultValue;
    return String(value);
};

/**
 * Factory pour créer un résultat de recherche
 * @param {Object} params - Paramètres du résultat
 * @returns {Object} Résultat de recherche formaté
 */
const SearchResultModel = {
    create: (params = {}) => ({
        id: params.id || generateId(),
        type: ensureString(params.type, Localization.t('search.type.unknown')),
        rawType: ensureString(params.rawType, 'unknown'),
        title: ensureString(params.title, ''),
        path: ensureString(params.path, ''),
        preview: ensureString(params.preview, ''),
        matchIndex: params.matchIndex || -1,
        relevance: params.relevance || 0,
        action: params.action || (() => { }),
        metadata: params.metadata || {}
    }),

    /**
     * Crée un résultat de recherche pour une scène
     */
    createSceneResult: (scene, act, chapter, query, matchIndex, preview) => {
        return SearchResultModel.create({
            id: scene.id,
            type: Localization.t('search.type.scene'),
            rawType: 'scene',
            title: ensureString(scene.title, Localization.t('search.default.untitled')),
            path: `${ensureString(act.title, Localization.t('search.default.act'))} > ${ensureString(chapter.title, Localization.t('search.default.chapter'))}`,
            preview: ensureString(preview, ''),
            matchIndex: matchIndex,
            action: () => openScene(act.id, chapter.id, scene.id),
            metadata: {
                actId: act.id,
                chapterId: chapter.id,
                sceneId: scene.id
            }
        });
    },

    /**
     * Crée un résultat de recherche pour un personnage
     */
    createCharacterResult: (character, query, preview) => {
        return SearchResultModel.create({
            id: character.id,
            type: Localization.t('search.type.character'),
            rawType: 'character',
            title: ensureString(character.name, Localization.t('search.default.unnamed')),
            path: ensureString(character.role, Localization.t('search.type.character')),
            preview: ensureString(preview || character.description, Localization.t('search.default.nodesc')),
            action: () => {
                switchView('characters');
                openCharacterDetail(character.id);
            },
            metadata: {
                characterId: character.id,
                role: character.role
            }
        });
    },

    /**
     * Crée un résultat de recherche pour un élément d'univers
     */
    createWorldResult: (element, query, preview) => {
        return SearchResultModel.create({
            id: element.id,
            type: Localization.t('search.type.world'),
            rawType: 'world',
            title: ensureString(element.name, Localization.t('search.default.unnamed')),
            path: ensureString(element.type, Localization.t('search.default.element')),
            preview: ensureString(preview || element.description, Localization.t('search.default.nodesc')),
            action: () => {
                switchView('world');
                openWorldDetail(element.id);
            },
            metadata: {
                elementId: element.id,
                elementType: element.type
            }
        });
    },

    /**
     * Crée un résultat de recherche pour un événement de chronologie
     */
    createTimelineResult: (event, query, preview) => {
        return SearchResultModel.create({
            id: event.id,
            type: Localization.t('search.type.timeline'),
            rawType: 'timeline',
            title: ensureString(event.title, Localization.t('search.default.untitled')),
            path: ensureString(event.date, Localization.t('search.default.event')),
            preview: ensureString(preview || event.description, Localization.t('search.default.nodesc')),
            action: () => {
                switchView('timeline');
                openTimelineDetail(event.id);
            },
            metadata: {
                eventId: event.id,
                date: event.date
            }
        });
    },

    /**
     * Crée un résultat de recherche pour un événement de chronologie métro
     */
    createMetroTimelineResult: (event, query, preview) => {
        return SearchResultModel.create({
            id: event.id,
            type: Localization.t('search.type.metro'),
            rawType: 'metro',
            title: ensureString(event.title, Localization.t('search.default.untitled')),
            path: ensureString(event.date, Localization.t('search.default.metro_timeline')),
            preview: ensureString(preview || event.description, Localization.t('search.default.nodesc')),
            action: () => {
                if (typeof openMetroEventFullView === 'function') {
                    // Injecter l'ID dans le champ caché attendu par openMetroEventFullView
                    let hiddenInput = document.getElementById('metroViewChoiceEventId');
                    if (!hiddenInput) {
                        hiddenInput = document.createElement('input');
                        hiddenInput.type = 'hidden';
                        hiddenInput.id = 'metroViewChoiceEventId';
                        document.body.appendChild(hiddenInput);
                    }
                    hiddenInput.value = event.id;
                    openMetroEventFullView();
                } else {
                    switchView('timelineviz');
                    if (typeof MetroTimelineViewModel !== 'undefined') {
                        setTimeout(() => MetroTimelineViewModel.openEventModal(event.id), 200);
                    }
                }
            },
            metadata: {
                eventId: event.id,
                date: event.date
            }
        });
    },

    /**
     * Crée un résultat de recherche pour une note
     */
    createNoteResult: (note, query, matchIndex, preview) => {
        return SearchResultModel.create({
            id: note.id,
            type: Localization.t('search.type.note'),
            rawType: 'note',
            title: ensureString(note.title, Localization.t('search.default.untitled')),
            path: ensureString(note.category, Localization.t('search.type.note')),
            preview: ensureString(preview, ''),
            matchIndex: matchIndex,
            action: () => {
                switchView('notes');
                openNoteDetail(note.id);
            },
            metadata: {
                noteId: note.id,
                category: note.category
            }
        });
    },

    /**
     * Crée un résultat de recherche pour une entrée de codex
     */
    createCodexResult: (entry, query, matchIndex, preview) => {
        return SearchResultModel.create({
            id: entry.id,
            type: Localization.t('search.type.codex'),
            rawType: 'codex',
            title: ensureString(entry.title, Localization.t('search.default.untitled')),
            path: ensureString(entry.category, Localization.t('search.type.codex')),
            preview: ensureString(preview, ''),
            matchIndex: matchIndex,
            action: () => {
                switchView('codex');
                openCodexDetail(entry.id);
            },
            metadata: {
                entryId: entry.id,
                category: entry.category
            }
        });
    },

    /**
     * Crée un résultat de recherche pour un TODO
     */
    createTodoResult: (todo, query, matchIndex, preview) => {
        return SearchResultModel.create({
            id: todo.id,
            type: Localization.t('search.type.todo'),
            rawType: 'todo',
            title: ensureString(todo.text, Localization.t('search.default.notext')),
            path: `${ensureString(todo.actTitle, Localization.t('search.default.act'))} > ${ensureString(todo.chapterTitle, Localization.t('search.default.chapter'))} > ${ensureString(todo.sceneTitle, Localization.t('search.default.scene'))}`,
            preview: ensureString(preview, ''),
            matchIndex: matchIndex,
            action: () => {
                if (typeof openScene === 'function') {
                    openScene(todo.actId, todo.chapterId, todo.sceneId);
                    switchView('editor');
                }
            },
            metadata: {
                todoId: todo.id,
                sceneId: todo.sceneId,
                actId: todo.actId,
                chapterId: todo.chapterId
            }
        });
    }
};

/**
 * Modèle pour l'état de la recherche
 */
const SearchStateModel = {
    create: () => ({
        query: '',
        results: [],
        isActive: false,
        isLoading: false,
        lastSearchTime: null,
        totalResults: 0
    })
};
