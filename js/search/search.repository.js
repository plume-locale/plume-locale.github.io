/**
 * Search Repository
 * Gère l'accès aux données et la recherche dans toutes les sources de l'application
 */

const SearchRepository = {
    /**
     * Recherche dans toutes les sources de données
     * @param {string} query - Terme de recherche
     * @returns {Array} Tableau de résultats de recherche
     */
    searchAll: (query) => {
        if (!query || query.trim().length < 2) {
            return [];
        }

        const lowerQuery = query.toLowerCase();
        const results = [];

        // Recherche dans toutes les sources
        results.push(...SearchRepository.searchScenes(lowerQuery, query));
        results.push(...SearchRepository.searchCharacters(lowerQuery, query));
        results.push(...SearchRepository.searchWorld(lowerQuery, query));
        results.push(...SearchRepository.searchTimeline(lowerQuery, query));
        results.push(...SearchRepository.searchMetroTimeline(lowerQuery, query));
        results.push(...SearchRepository.searchNotes(lowerQuery, query));
        results.push(...SearchRepository.searchCodex(lowerQuery, query));
        results.push(...SearchRepository.searchTodos(lowerQuery, query));

        return results;
    },

    /**
     * Recherche dans les TODOs
     */
    searchTodos: (lowerQuery, originalQuery) => {
        const results = [];
        if (typeof TodoRepository === 'undefined') return results;

        const todos = TodoRepository.getAll();
        todos.forEach(todo => {
            const searchText = ensureString(todo.text).toLowerCase();

            if (searchText.includes(lowerQuery)) {
                const matchIndex = searchText.indexOf(lowerQuery);
                const preview = SearchRepository.getPreview(todo.text, matchIndex, originalQuery.length);

                results.push(
                    SearchResultModel.createTodoResult(todo, originalQuery, matchIndex, preview)
                );
            }
        });

        return results;
    },

    /**
     * Recherche dans les scènes
     */
    searchScenes: (lowerQuery, originalQuery) => {
        const results = [];

        if (!project.acts) return results;

        project.acts.forEach(act => {
            if (!act.chapters) return;

            act.chapters.forEach(chapter => {
                if (!chapter.scenes) return;

                chapter.scenes.forEach(scene => {
                    // Extraire le texte du contenu HTML
                    const textContent = SearchRepository.extractTextFromHTML(scene.content);

                    // Vérifier si la scène correspond à la recherche
                    const titleMatch = scene.title.toLowerCase().includes(lowerQuery);
                    const contentMatch = textContent.toLowerCase().includes(lowerQuery);

                    if (titleMatch || contentMatch) {
                        const matchIndex = contentMatch
                            ? textContent.toLowerCase().indexOf(lowerQuery)
                            : -1;

                        const preview = matchIndex >= 0
                            ? SearchRepository.getPreview(textContent, matchIndex, originalQuery.length)
                            : textContent.substring(0, 150);

                        results.push(
                            SearchResultModel.createSceneResult(
                                scene, act, chapter, originalQuery, matchIndex, preview
                            )
                        );
                    }
                });
            });
        });

        return results;
    },

    /**
     * Recherche dans les personnages
     */
    searchCharacters: (lowerQuery, originalQuery) => {
        const results = [];

        if (!project.characters) return results;

        project.characters.forEach(char => {
            const searchText = [
                String(char.name || ''),
                String(char.role || ''),
                String(char.description || ''),
                String(char.personality || ''),
                String(char.background || ''),
                String(char.physicalDescription || ''),
                String(char.notes || '')
            ].join(' ').toLowerCase();

            if (searchText.includes(lowerQuery)) {
                let preview = '';
                // On cherche des champs textuels pour l'aperçu, en excluant les objets comme 'personality'
                if (char.description && typeof char.description === 'string') preview = char.description;
                if (!preview && char.physicalDescription && typeof char.physicalDescription === 'string') preview = char.physicalDescription;
                if (!preview && char.past && typeof char.past === 'string') preview = char.past;
                if (!preview && char.background && typeof char.background === 'string') preview = char.background;
                if (!preview && char.notes && typeof char.notes === 'string') preview = char.notes;

                // Fallback final
                if (!preview) preview = Localization.t('search.default.nodesc');

                results.push(
                    SearchResultModel.createCharacterResult(char, originalQuery, preview)
                );
            }
        });

        return results;
    },

    /**
     * Recherche dans les éléments d'univers
     */
    searchWorld: (lowerQuery, originalQuery) => {
        const results = [];

        if (!project.world) return results;

        project.world.forEach(element => {
            const searchText = [
                String(element.name || ''),
                String(element.description || ''),
                String(element.details || ''),
                String(element.type || '')
            ].join(' ').toLowerCase();

            if (searchText.includes(lowerQuery)) {
                const preview = element.description || element.details || Localization.t('search.default.nodesc');
                results.push(
                    SearchResultModel.createWorldResult(element, originalQuery, preview)
                );
            }
        });

        return results;
    },

    /**
     * Recherche dans la chronologie
     */
    searchTimeline: (lowerQuery, originalQuery) => {
        const results = [];

        if (!project.timeline) {
            console.log('[Search] Timeline: project.timeline is undefined or null');
            return results;
        }

        project.timeline.forEach((event, index) => {
            const searchText = [
                String(event.title || ''),
                String(event.description || ''),
                String(event.location || ''),
                String(event.characters || ''),
                String(event.date !== undefined && event.date !== null ? event.date : '')
            ].join(' ').toLowerCase();

            if (searchText.includes(lowerQuery)) {
                const preview = event.description || Localization.t('search.default.nodesc');
                results.push(
                    SearchResultModel.createTimelineResult(event, originalQuery, preview)
                );
            }
        });

        return results;
    },

    /**
     * Recherche dans la chronologie métro
     */
    searchMetroTimeline: (lowerQuery, originalQuery) => {
        const results = [];

        if (!project.metroTimeline) return results;

        project.metroTimeline.forEach(event => {
            const searchText = [
                String(event.title || ''),
                String(event.description || ''),
                String(event.date || '')
            ].join(' ').toLowerCase();

            if (searchText.includes(lowerQuery)) {
                const preview = event.description || Localization.t('search.default.nodesc');
                results.push(
                    SearchResultModel.createMetroTimelineResult(event, originalQuery, preview)
                );
            }
        });

        return results;
    },

    /**
     * Recherche dans les notes
     */
    searchNotes: (lowerQuery, originalQuery) => {
        const results = [];

        if (!project.notes) return results;

        project.notes.forEach(note => {
            const searchText = [
                String(note.title || ''),
                String(note.content || ''),
                String(note.category || '')
            ].join(' ').toLowerCase();

            if (searchText.includes(lowerQuery)) {
                const matchIndex = note.content
                    ? note.content.toLowerCase().indexOf(lowerQuery)
                    : -1;

                const preview = matchIndex >= 0
                    ? SearchRepository.getPreview(note.content, matchIndex, originalQuery.length)
                    : (note.content || '').substring(0, 150);

                results.push(
                    SearchResultModel.createNoteResult(note, originalQuery, matchIndex, preview)
                );
            }
        });

        return results;
    },

    /**
     * Recherche dans le codex
     */
    searchCodex: (lowerQuery, originalQuery) => {
        const results = [];

        if (!project.codex) return results;

        project.codex.forEach(entry => {
            const searchText = [
                String(entry.title || ''),
                String(entry.summary || ''),
                String(entry.content || ''),
                String(entry.category || '')
            ].join(' ').toLowerCase();

            if (searchText.includes(lowerQuery)) {
                const matchIndex = entry.content
                    ? entry.content.toLowerCase().indexOf(lowerQuery)
                    : -1;

                const preview = matchIndex >= 0
                    ? SearchRepository.getPreview(entry.content, matchIndex, originalQuery.length)
                    : (entry.summary || entry.content || '').substring(0, 150);

                results.push(
                    SearchResultModel.createCodexResult(entry, originalQuery, matchIndex, preview)
                );
            }
        });

        return results;
    },

    /**
     * Extrait le texte d'un contenu HTML
     * @param {string} html - Contenu HTML
     * @returns {string} Texte brut
     */
    extractTextFromHTML: (html) => {
        if (!html) return '';

        const temp = document.createElement('div');
        temp.innerHTML = html;
        return temp.textContent || temp.innerText || '';
    },

    /**
     * Génère un aperçu du texte autour de la correspondance
     * @param {string} text - Texte complet
     * @param {number} matchIndex - Index de la correspondance
     * @param {number} queryLength - Longueur de la requête
     * @returns {string} Aperçu formaté
     */
    getPreview: (text, matchIndex, queryLength) => {
        const contextBefore = 60;
        const contextAfter = 90;

        const start = Math.max(0, matchIndex - contextBefore);
        const end = Math.min(text.length, matchIndex + queryLength + contextAfter);

        let preview = text.substring(start, end);

        if (start > 0) preview = '...' + preview;
        if (end < text.length) preview = preview + '...';

        return preview;
    }
};
