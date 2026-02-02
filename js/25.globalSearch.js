
// Global Search

// [MVVM : ViewModel]
// État local pour le debounce de la recherche.
let searchTimeout = null;

// [MVVM : ViewModel]
// Traite l'entrée utilisateur pour la recherche globale.
function performGlobalSearch(query) {
    clearTimeout(searchTimeout);

    const resultsContainer = document.getElementById('searchResults');

    if (!query || query.trim().length < 2) {
        resultsContainer.classList.remove('active');
        return;
    }

    // Debounce search
    searchTimeout = setTimeout(() => {
        const results = searchEverywhere(query.trim());
        displaySearchResults(results, query.trim());
    }, 300);
}

// [MVVM : ViewModel]
// Parcourt les données du Model et les prépare pour la View.
function searchEverywhere(query) {
    const results = [];
    const lowerQuery = query.toLowerCase();

    // Search in scenes
    project.acts.forEach(act => {
        act.chapters.forEach(chapter => {
            chapter.scenes.forEach(scene => {
                const temp = document.createElement('div');
                temp.innerHTML = scene.content;
                const textContent = temp.textContent || temp.innerText || '';

                if (scene.title.toLowerCase().includes(lowerQuery) ||
                    textContent.toLowerCase().includes(lowerQuery)) {

                    const matchIndex = textContent.toLowerCase().indexOf(lowerQuery);
                    const preview = matchIndex >= 0
                        ? getPreview(textContent, matchIndex, query.length)
                        : textContent.substring(0, 150);

                    results.push({
                        type: 'Scène',
                        title: scene.title,
                        path: `${act.title} > ${chapter.title}`,
                        preview: preview,
                        action: () => openScene(act.id, chapter.id, scene.id)
                    });
                }
            });
        });
    });

    // Search in characters
    project.characters.forEach(char => {
        const searchText = `${char.name} ${char.role} ${char.description} ${char.personality} ${char.background}`.toLowerCase();
        if (searchText.includes(lowerQuery)) {
            results.push({
                type: 'Personnage',
                title: char.name,
                path: char.role || 'Personnage',
                preview: char.description || 'Aucune description',
                action: () => { switchView('characters'); openCharacterDetail(char.id); }
            });
        }
    });

    // Search in world elements
    project.world.forEach(element => {
        const searchText = `${element.name} ${element.description} ${element.details}`.toLowerCase();
        if (searchText.includes(lowerQuery)) {
            results.push({
                type: 'Univers',
                title: element.name,
                path: element.type,
                preview: element.description || 'Aucune description',
                action: () => { switchView('world'); openWorldDetail(element.id); }
            });
        }
    });

    // Search in timeline
    project.timeline.forEach(event => {
        const searchText = `${event.title} ${event.description} ${event.location} ${event.characters}`.toLowerCase();
        if (searchText.includes(lowerQuery)) {
            results.push({
                type: 'Chronologie',
                title: event.title,
                path: event.date || 'Événement',
                preview: event.description || 'Aucune description',
                action: () => { switchView('timeline'); openTimelineDetail(event.id); }
            });
        }
    });

    // Search in notes
    project.notes.forEach(note => {
        const searchText = `${note.title} ${note.content}`.toLowerCase();
        if (searchText.includes(lowerQuery)) {
            const matchIndex = note.content.toLowerCase().indexOf(lowerQuery);
            const preview = matchIndex >= 0
                ? getPreview(note.content, matchIndex, query.length)
                : note.content.substring(0, 150);

            results.push({
                type: 'Note',
                title: note.title,
                path: note.category,
                preview: preview,
                action: () => { switchView('notes'); openNoteDetail(note.id); }
            });
        }
    });

    // Search in codex
    project.codex.forEach(entry => {
        const searchText = `${entry.title} ${entry.summary} ${entry.content}`.toLowerCase();
        if (searchText.includes(lowerQuery)) {
            const matchIndex = entry.content.toLowerCase().indexOf(lowerQuery);
            const preview = matchIndex >= 0
                ? getPreview(entry.content, matchIndex, query.length)
                : entry.summary || entry.content.substring(0, 150);

            results.push({
                type: 'Codex',
                title: entry.title,
                path: entry.category,
                preview: preview,
                action: () => { switchView('codex'); openCodexDetail(entry.id); }
            });
        }
    });

    return results;
}

// [MVVM : ViewModel]
// Utilitaire de transformation pour générer un extrait.
function getPreview(text, matchIndex, queryLength) {
    const start = Math.max(0, matchIndex - 60);
    const end = Math.min(text.length, matchIndex + queryLength + 90);
    let preview = text.substring(start, end);

    if (start > 0) preview = '...' + preview;
    if (end < text.length) preview = preview + '...';

    return preview;
}

// [MVVM : View]
// Responsable du rendu DOM des résultats de recherche.
function displaySearchResults(results, query) {
    const container = document.getElementById('searchResults');

    if (results.length === 0) {
        container.innerHTML = '<div class="search-no-results">Aucun résultat trouvé</div>';
        container.classList.add('active');
        return;
    }

    const highlightQuery = (text) => {
        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<span class="search-highlight">$1</span>');
    };

    container.innerHTML = results.map((result, index) => `
                        <div class="search-result-item" onclick="executeSearchAction(${index}); closeSearchResults();">
                            <div class="search-result-type">${result.type}</div>
                            <div class="search-result-title">${highlightQuery(result.title)}</div>
                            <div class="search-result-path">${result.path}</div>
                            <div class="search-result-preview">${highlightQuery(result.preview)}</div>
                        </div>
                    `).join('');

    // Store actions for execution
    window.searchResultActions = results.map(r => r.action);

    container.classList.add('active');
}

// [MVVM : ViewModel]
// Exécute l'action associée au résultat.
function executeSearchAction(index) {
    if (window.searchResultActions && window.searchResultActions[index]) {
        window.searchResultActions[index]();
    }
}

// [MVVM : View]
// Logique d'interface pour fermer les résultats de recherche.
function closeSearchResults() {
    document.getElementById('searchResults').classList.remove('active');
    document.getElementById('globalSearch').value = '';
}

// [MVVM : View]
// Écoute globale pour fermer les résultats au clic extérieur.
document.addEventListener('click', (e) => {
    const searchContainer = document.querySelector('.search-container');
    if (searchContainer && !searchContainer.contains(e.target)) {
        closeSearchResults();
    }
});
