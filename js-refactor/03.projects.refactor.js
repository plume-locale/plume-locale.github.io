/**
 * [MVVM : Projects Module]
 * Refactorisé pour séparer le modèle, le viewmodel et la vue.
 */

// --- MODEL & PERSISTENCE ---

/**
 * Charge tous les projets depuis IndexedDB.
 */
async function loadAllProjects() {
    try {
        const loadedProjects = await loadAllProjectsFromDB();

        if (loadedProjects && loadedProjects.length > 0) {
            projects = loadedProjects;
            const savedId = await loadSetting('currentProjectId');

            if (savedId) {
                currentProjectId = savedId;
                project = projects.find(p => p.id === savedId);
            }

            if (!project && projects.length > 0) {
                project = projects[0];
                currentProjectId = project.id;
            }
        } else {
            createDefaultProject();
            await saveProjectToDB(project);
        }

        ensureProjectStructure();

        if (project?.title) {
            const headerTitle = document.getElementById('headerProjectTitle');
            if (headerTitle) headerTitle.textContent = project.title;
        }

        console.log('✅ Projets chargés:', projects.length);
    } catch (error) {
        console.error('❌ Erreur chargement projets:', error);
        createDefaultProject();
    }
}

/**
 * Sauvegarde tous les projets dans IndexedDB.
 */
async function saveAllProjects() {
    try {
        if (currentProjectId) {
            const index = projects.findIndex(p => p.id === currentProjectId);
            if (index >= 0) {
                projects[index] = { ...project, updatedAt: new Date().toISOString() };
            }
        }

        for (const proj of projects) {
            await saveProjectToDB(proj);
        }

        await saveSetting('currentProjectId', currentProjectId);
        console.log('💾 Tous les projets sauvegardés');
    } catch (error) {
        console.error('❌ Erreur sauvegarde projets:', error);
    }
}

/**
 * Crée un projet par défaut si aucun n'existe.
 */
function createDefaultProject() {
    project = {
        id: Date.now(),
        title: "Mon Roman",
        description: "",
        genre: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        acts: [],
        characters: [],
        world: [],
        timeline: [],
        notes: [],
        codex: [],
        stats: { dailyGoal: 500, totalGoal: 80000, writingSessions: [] },
        versions: [],
        relationships: []
    };
    projects = [project];
    currentProjectId = project.id;
}

/**
 * S'assure que la structure du projet est complète.
 */
function ensureProjectStructure() {
    if (!project) return;
    project.characters = project.characters || [];
    project.world = project.world || [];
    project.timeline = project.timeline || [];
    project.notes = project.notes || [];
    project.codex = project.codex || [];
    project.stats = project.stats || { dailyGoal: 500, totalGoal: 80000, writingSessions: [] };
    project.versions = project.versions || [];
    project.relationships = project.relationships || [];
}

// Override du saveProject global
saveProject = function () {
    saveAllProjects();
};

// --- VIEWMODEL (LOGIQUE MÉTIER) ---

/**
 * Crée un nouveau projet.
 */
function createNewProject() {
    const title = document.getElementById('newProjectTitle').value.trim();
    const description = document.getElementById('newProjectDesc').value.trim();
    const genre = document.getElementById('newProjectGenre').value;
    const template = document.getElementById('newProjectTemplate').value;

    if (!title) {
        alert('Veuillez entrer un titre pour le projet');
        return;
    }

    const newProject = {
        id: Date.now(),
        title: title,
        description: description,
        genre: genre,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        acts: [],
        characters: [],
        world: [],
        timeline: [],
        notes: [],
        codex: [],
        stats: { dailyGoal: 500, totalGoal: 80000, writingSessions: [] },
        versions: [],
        relationships: []
    };

    // Templates
    if (template === 'fantasy') {
        newProject.acts = [
            { id: Date.now(), title: "Acte I - Le Monde Ordinaire", chapters: [] },
            { id: Date.now() + 1, title: "Acte II - L'Aventure", chapters: [] },
            { id: Date.now() + 2, title: "Acte III - Le Retour", chapters: [] }
        ];
    } else if (template === 'thriller') {
        newProject.acts = [
            { id: Date.now(), title: "Acte I - L'Incident", chapters: [] },
            { id: Date.now() + 1, title: "Acte II - La Tension", chapters: [] },
            { id: Date.now() + 2, title: "Acte III - Le Dénouement", chapters: [] }
        ];
    }

    projects.push(newProject);
    saveAllProjects();

    // Reset UI
    document.getElementById('newProjectTitle').value = '';
    document.getElementById('newProjectDesc').value = '';

    closeModal('newProjectModal');
    switchToProject(newProject.id);
    closeModal('projectsModal');
}

/**
 * Change le projet actif.
 */
function switchToProject(projectId) {
    currentProjectId = projectId;
    project = projects.find(p => p.id === projectId);

    if (!project) return;

    const headerTitle = document.getElementById('headerProjectTitle');
    if (headerTitle) headerTitle.textContent = project.title;

    currentActId = null;
    currentChapterId = null;
    currentSceneId = null;

    if (typeof switchView === 'function') switchView('editor');
    if (typeof renderActsList === 'function') renderActsList();
    if (typeof refreshAllViews === 'function') refreshAllViews();

    localStorage.setItem('plume_locale_current_project', projectId);
}

/**
 * Supprime un projet.
 */
function deleteProject(projectId) {
    const proj = projects.find(p => p.id === projectId);
    if (!proj) return;

    if (!confirm(`Supprimer "${proj.title}" ?\n\nIrréversible !`)) return;

    projects = projects.filter(p => p.id !== projectId);
    saveAllProjects();

    if (currentProjectId === projectId) {
        if (projects.length > 0) {
            switchToProject(projects[0].id);
        } else {
            createDefaultProject();
        }
    }

    renderProjectsList();
}

/**
 * Exporte un projet.
 */
function exportProjectIndividual(projectId) {
    const proj = projects.find(p => p.id === projectId);
    if (!proj) return;

    const dataStr = JSON.stringify(proj, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${proj.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

/**
 * Gère l'import d'un projet.
 */
function handleProjectImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const imported = JSON.parse(e.target.result);
            if (!imported.title) throw new Error('Format invalide');

            imported.id = Date.now();
            imported.title += " (Importé)";
            imported.createdAt = new Date().toISOString();
            imported.updatedAt = new Date().toISOString();

            projects.push(imported);
            saveAllProjects();
            renderProjectsList();
            alert(`✅ "${imported.title}" importé !`);
        } catch (error) {
            alert('❌ Erreur: ' + error.message);
        }
        event.target.value = '';
    };
    reader.readAsText(file);
}

// --- VIEW (RENDU DOM) ---

/**
 * Ouvre la modale de création.
 */
function openNewProjectModal() {
    const modal = document.getElementById('newProjectModal');
    if (modal) {
        modal.classList.add('active');
        setTimeout(() => document.getElementById('newProjectTitle')?.focus(), 100);
    }
}

/**
 * Déclenche l'import.
 */
function importProject() {
    document.getElementById('importProjectInput')?.click();
}

/**
 * Affiche la liste des projets.
 */
function renderProjectsList() {
    const container = document.getElementById('projectsList');
    if (!container) return;

    if (projects.length === 0) {
        container.innerHTML = '<div style="padding: 2rem; text-align: center; color: var(--text-muted);">Aucun projet</div>';
        return;
    }

    container.innerHTML = projects.map(proj => {
        const isActive = proj.id === currentProjectId;

        // Calcul des statistiques
        const actCount = proj.acts ? proj.acts.length : 0;
        let chapterCount = 0;
        let sceneCount = 0;
        let wordCount = 0;

        if (proj.acts) {
            proj.acts.forEach(act => {
                if (act.chapters) {
                    chapterCount += act.chapters.length;
                    act.chapters.forEach(chap => {
                        if (chap.scenes) {
                            sceneCount += chap.scenes.length;
                            chap.scenes.forEach(scene => {
                                const text = scene.content ? stripHTML(scene.content) : '';
                                if (text.trim().length > 0) {
                                    const words = text.trim().match(/[\w\u00C0-\u00FF]+(?:[''’][\w\u00C0-\u00FF]+)*/g);
                                    if (words) wordCount += words.length;
                                }
                            });
                        }
                    });
                }
            });
        }

        const charCount = proj.characters ? proj.characters.length : 0;
        const worldCount = proj.world ? proj.world.length : 0;
        const codexCount = proj.codex ? proj.codex.length : 0;

        return `
            <div class="project-card ${isActive ? 'active' : ''}" onclick="switchToProject(${proj.id}); closeModal('projectsModal');">
                <div class="project-card-header">
                    <div>
                        <div class="project-card-title">${proj.title}</div>
                        ${proj.genre ? `<span class="project-card-genre">${proj.genre}</span>` : ''}
                    </div>
                    ${isActive ? '<span style="color: var(--accent-red); font-weight: 600;">● Actif</span>' : ''}
                </div>
                ${proj.description ? `<div class="project-card-desc">${proj.description}</div>` : ''}
                
                <!-- Statistiques rapides -->
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 0.5rem; margin-top: 1rem; padding-top: 0.75rem; border-top: 1px solid var(--border-color); font-size: 0.8rem; color: var(--text-muted);">
                    <div style="display: flex; align-items: center; gap: 6px;" title="Nombre de mots total">
                        <i data-lucide="align-left" style="width: 14px; height: 14px; color: var(--accent-gold);"></i> 
                        <span style="font-weight: 600;">${wordCount.toLocaleString('fr-FR')}</span> mots
                    </div>
                    <div style="display: flex; align-items: center; gap: 6px;" title="Nombre d'actes">
                        <i data-lucide="book" style="width: 14px; height: 14px;"></i> 
                        <span>${actCount} actes</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 6px;" title="Nombre de chapitres">
                        <i data-lucide="bookmark" style="width: 14px; height: 14px;"></i> 
                        <span>${chapterCount} chapitres</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 6px;" title="Nombre de scènes">
                        <i data-lucide="file-text" style="width: 14px; height: 14px;"></i> 
                        <span>${sceneCount} scènes</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 6px;" title="Personnages">
                        <i data-lucide="users" style="width: 14px; height: 14px;"></i> 
                        <span>${charCount} pers.</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 6px;" title="Entrées Univers">
                        <i data-lucide="globe" style="width: 14px; height: 14px;"></i> 
                        <span>${worldCount} univ.</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 6px;" title="Entrées Codex">
                        <i data-lucide="book-open" style="width: 14px; height: 14px;"></i> 
                        <span>${codexCount} codex</span>
                    </div>
                </div>

                <div class="project-card-actions">
                    <button class="btn btn-small" onclick="event.stopPropagation(); showBackupMenu()"><i data-lucide="upload" style="width:12px;height:12px;margin-right:4px;vertical-align:middle;"></i> Exporter</button>
                    <button class="btn btn-small" onclick="event.stopPropagation(); deleteProject(${proj.id})"><i data-lucide="trash-2" style="width:12px;height:12px;margin-right:4px;vertical-align:middle;"></i> Supprimer</button>
                </div>
            </div>`;
    }).join('');

    // Re-trigger icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

/**
 * Rendu pour Split View ou conteneur spécifique.
 */
function renderSceneInContainer(actId, chapterId, sceneId, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const act = project.acts.find(a => a.id === actId);
    const chapter = act?.chapters.find(c => c.id === chapterId);
    const scene = chapter?.scenes.find(s => s.id === sceneId);

    if (!scene) return;

    const wordCount = typeof getWordCount === 'function' ? getWordCount(scene.content || '') : 0;

    container.innerHTML = `
        <div class="split-scene-view" style="height: 100%; display: flex; flex-direction: column;">
            <div style="padding: 0.75rem 1rem; background: var(--bg-secondary); border-bottom: 1px solid var(--border-color);">
                <div style="font-size: 0.8rem; color: var(--text-muted);">${act.title} > ${chapter.title}</div>
                <div style="font-size: 1.1rem; font-weight: 600;">${scene.title || 'Sans titre'}</div>
                <div style="font-size: 0.75rem; color: var(--text-muted);">${wordCount} mots</div>
            </div>
            <div class="editor-textarea" 
                 contenteditable="true" 
                 data-container="${containerId}"
                 data-scene-id="${scene.id}"
                 data-chapter-id="${chapter.id}"
                 data-act-id="${act.id}"
                 oninput="updateSplitSceneContent(this)"
                 style="flex: 1; padding: 1.5rem; overflow-y: auto; outline: none; line-height: 1.8; font-size: 1.1rem;"
            >${scene.content || ''}</div>
        </div>`;
}

// --- ANALYSE DE TEXTE ---

/**
 * Rendu de la vue analyse.
 */
function renderAnalysis() {
    const editorView = document.getElementById('editorView');
    if (!editorView) return;

    editorView.innerHTML = `
        <div style="height: 100%; overflow-y: auto; padding: 2rem 3rem;">
            <h2 style="margin-bottom: 2rem; color: var(--accent-gold);">
                <i data-lucide="scan-search" style="width:24px;height:24px;vertical-align:middle;margin-right:8px;"></i>Analyse du texte
            </h2>
            <div style="background: var(--bg-secondary); padding: 2rem; border-radius: 8px; margin-bottom: 2rem;">
                <label style="display: block; font-weight: 600; margin-bottom: 1rem; font-size: 1rem;">Portée de l'analyse :</label>
                <select id="analysisScope" class="form-input" style="width: 100%; max-width: 400px; font-size: 1rem;">
                    <option value="current">Scène actuelle</option>
                    <option value="chapter">Chapitre actuel</option>
                    <option value="act">Acte actuel</option>
                    <option value="all">Tout le projet</option>
                </select>
            </div>
            <div id="analysisResults"></div>
        </div>`;

    setTimeout(() => {
        document.getElementById('analysisScope')?.addEventListener('change', runTextAnalysis);
        runTextAnalysis();
    }, 0);
}

/**
 * Lance l'analyse.
 */
function runTextAnalysis() {
    const scope = document.getElementById('analysisScope')?.value || 'current';
    const text = typeof getTextForAnalysis === 'function' ? getTextForAnalysis(scope) : '';

    if (!text || text.trim().length === 0) {
        document.getElementById('analysisResults').innerHTML = '<div style="padding: 2rem; text-align: center; color: var(--text-muted);">Aucun texte à analyser</div>';
        return;
    }

    const analysis = {
        wordCount: typeof getWordCount === 'function' ? getWordCount(text) : 0,
        repetitions: typeof detectRepetitions === 'function' ? detectRepetitions(text) : [],
        readability: typeof calculateReadability === 'function' ? calculateReadability(text) : { score: 0, level: 'N/A' },
        wordFrequency: typeof calculateWordFrequency === 'function' ? calculateWordFrequency(text) : [],
        sentenceLength: typeof calculateSentenceLength === 'function' ? calculateSentenceLength(text) : { avg: 0, min: 0, max: 0, distribution: [] },
        narrativeDistribution: typeof analyzeNarrativeDistribution === 'function' ? analyzeNarrativeDistribution(text) : { dialogue: 0, narrative: 0, dialogCount: 0 }
    };

    if (typeof displayAnalysisResults === 'function') displayAnalysisResults(analysis);
}

// [MVVM : ViewModel]
// Helper : extrait les données brutes nécessaires depuis le modèle selon le contexte de vue
function getTextForAnalysis(scope) {
    console.log('getTextForAnalysis called with scope:', scope);
    console.log('currentActId:', currentActId, 'currentChapterId:', currentChapterId, 'currentSceneId:', currentSceneId);

    if (scope === 'current' && currentSceneId) {
        const act = project.acts.find(a => a.id === currentActId);
        if (!act) return '';
        const chapter = act.chapters.find(c => c.id === currentChapterId);
        if (!chapter) return '';
        const scene = chapter.scenes.find(s => s.id === currentSceneId);
        if (!scene) return '';
        return stripHTML(scene.content);
    } else if (scope === 'chapter') {
        if (!currentChapterId) {
            // Try to use first chapter of first act
            if (project.acts.length > 0 && project.acts[0].chapters.length > 0) {
                const chapter = project.acts[0].chapters[0];
                const text = chapter.scenes.map(s => stripHTML(s.content)).join('\n\n');
                return text;
            }
            return '';
        }
        const act = project.acts.find(a => a.id === currentActId);
        if (!act) return '';
        const chapter = act.chapters.find(c => c.id === currentChapterId);
        if (!chapter) return '';
        const text = chapter.scenes.map(s => stripHTML(s.content)).join('\n\n');
        return text;
    } else if (scope === 'act') {
        if (!currentActId) {
            // Try to use first act
            if (project.acts.length > 0) {
                const act = project.acts[0];
                const text = act.chapters.flatMap(ch => ch.scenes.map(s => stripHTML(s.content))).join('\n\n');
                return text;
            }
            return '';
        }
        const act = project.acts.find(a => a.id === currentActId);
        if (!act) return '';
        const text = act.chapters.flatMap(ch => ch.scenes.map(s => stripHTML(s.content))).join('\n\n');
        return text;
    } else if (scope === 'all') {
        const text = project.acts.flatMap(a => a.chapters.flatMap(ch => ch.scenes.map(s => stripHTML(s.content)))).join('\n\n');
        return text;
    }
    return '';
}

// [MVVM : Other]
// [HELPER] Utilitaire de traitement de chaîne (agnostique)
function stripHTML(html) {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
}

// [MVVM : Model]
// Algorithme pur : logique de détection des répétitions
function detectRepetitions(text) {
    // Correction pour inclure les caractères accentués français et autres Unicode
    const words = text.toLowerCase().match(/[\p{L}]{4,}/gu) || [];
    const frequency = {};
    words.forEach(word => frequency[word] = (frequency[word] || 0) + 1);

    const repeated = Object.entries(frequency)
        .filter(([word, count]) => count >= 5)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

    return repeated;
}

// [MVVM : Model]
// Algorithme pur : calcul de score de lisibilité
function calculateReadability(text) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    // Correction pour inclure les caractères accentués français et autres Unicode
    const words = text.match(/[\p{L}]+/gu) || [];
    const syllables = words.reduce((sum, word) => sum + countSyllables(word), 0);

    if (sentences.length === 0 || words.length === 0) return { score: 0, level: 'N/A' };

    // Flesch Reading Ease (adapted for French)
    const avgWordsPerSentence = words.length / sentences.length;
    const avgSyllablesPerWord = syllables / words.length;
    const score = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);

    let level = '';
    if (score >= 90) level = 'Très facile';
    else if (score >= 80) level = 'Facile';
    else if (score >= 70) level = 'Assez facile';
    else if (score >= 60) level = 'Standard';
    else if (score >= 50) level = 'Assez difficile';
    else if (score >= 30) level = 'Difficile';
    else level = 'Très difficile';

    return { score: Math.max(0, Math.min(100, score)).toFixed(1), level };
}

// [MVVM : Model]
// Helper algorithmique : comptage de syllabes
function countSyllables(word) {
    word = word.toLowerCase();
    const vowels = /[aeiouyàâäéèêëïîôùûü]/g;
    const matches = word.match(vowels);
    if (!matches) return 1;

    let count = matches.length;
    // Adjustments for French
    if (word.endsWith('e')) count--;
    if (word.match(/[aeiouy]{2,}/)) count--;
    return Math.max(1, count);
}

// [MVVM : Model]
// Algorithme pur : analyse de fréquence des mots
function calculateWordFrequency(text) {
    // Correction pour inclure les caractères accentués français et autres Unicode
    const words = text.toLowerCase().match(/[\p{L}]{3,}/gu) || [];
    const stopWords = new Set(['le', 'la', 'les', 'un', 'une', 'des', 'de', 'du', 'et', 'ou', 'où', 'qui', 'que', 'quoi', 'dont', 'ce', 'cette', 'ces', 'son', 'sa', 'ses', 'mon', 'ma', 'mes', 'ton', 'ta', 'tes', 'notre', 'nos', 'votre', 'vos', 'leur', 'leurs', 'je', 'tu', 'il', 'elle', 'nous', 'vous', 'ils', 'elles', 'on', 'ne', 'pas', 'plus', 'dans', 'sur', 'pour', 'par', 'avec', 'sans', 'est', 'était', 'être', 'avoir', 'fait', 'faire', 'dit', 'dire', 'peut', 'bien', 'tout', 'tous', 'comme', 'très', 'aussi', 'encore', 'mais', 'donc', 'ainsi']);

    const frequency = {};
    words.forEach(word => {
        if (!stopWords.has(word)) {
            frequency[word] = (frequency[word] || 0) + 1;
        }
    });

    return Object.entries(frequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15);
}

// [MVVM : Model]
// Algorithme pur : statistiques de longueur de phrases
function calculateSentenceLength(text) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const lengths = sentences.map(s => s.trim().split(/\s+/).length);

    if (lengths.length === 0) return { avg: 0, min: 0, max: 0, distribution: [] };

    const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const min = Math.min(...lengths);
    const max = Math.max(...lengths);

    // Distribution
    const ranges = [
        { label: '1-5 mots', count: lengths.filter(l => l >= 1 && l <= 5).length },
        { label: '6-10 mots', count: lengths.filter(l => l >= 6 && l <= 10).length },
        { label: '11-15 mots', count: lengths.filter(l => l >= 11 && l <= 15).length },
        { label: '16-20 mots', count: lengths.filter(l => l >= 16 && l <= 20).length },
        { label: '20+ mots', count: lengths.filter(l => l > 20).length }
    ];

    return { avg: avg.toFixed(1), min, max, distribution: ranges };
}

// [MVVM : Model]
// Algorithme pur : analyse de distribution narrative/dialogue
function analyzeNarrativeDistribution(text) {
    const dialogRegex = /[«"—–]\s*[^»"—–]{10,}?\s*[»"—–]/g;
    const dialogs = text.match(dialogRegex) || [];
    const dialogLength = dialogs.join('').length;
    const totalLength = text.length;

    const dialogPercent = totalLength > 0 ? (dialogLength / totalLength * 100).toFixed(1) : 0;
    const narrativePercent = totalLength > 0 ? (100 - dialogPercent).toFixed(1) : 0;

    return {
        dialogue: dialogPercent,
        narrative: narrativePercent,
        dialogCount: dialogs.length
    };
}

// [MVVM : View]
// Rendu des résultats d'analyse (Génération HTML)
function displayAnalysisResults(analysis) {
    const container = document.getElementById('analysisResults');

    container.innerHTML = `
                <div style="margin-top: 1rem;">
                    <!-- General Stats -->
                    <div style="background: var(--bg-primary); padding: 1rem; border-radius: 4px; border: 1px solid var(--border-color); margin-bottom: 1rem;">
                        <div style="font-weight: 700; font-size: 1rem; margin-bottom: 0.75rem; color: var(--accent-gold);"><i data-lucide="bar-chart-3" style="width:16px;height:16px;vertical-align:middle;margin-right:6px;"></i>Statistiques générales</div>
                        <div style="font-size: 1.2rem; font-weight: 600;">${analysis.wordCount.toLocaleString('fr-FR')} mots</div>
                    </div>

                    <!-- Readability -->
                    <div style="background: var(--bg-primary); padding: 1rem; border-radius: 4px; border: 1px solid var(--border-color); margin-bottom: 1rem;">
                        <div style="font-weight: 700; font-size: 1rem; margin-bottom: 0.75rem; color: var(--accent-gold);"><i data-lucide="book-open" style="width:16px;height:16px;vertical-align:middle;margin-right:6px;"></i>Lisibilité (Flesch)</div>
                        <div style="font-size: 1.1rem; margin-bottom: 0.25rem;">Score: <strong>${analysis.readability.score}</strong> / 100</div>
                        <div style="color: var(--text-muted);">Niveau: ${analysis.readability.level}</div>
                        <div style="margin-top: 0.5rem; font-size: 0.75rem; color: var(--text-muted); line-height: 1.4;">
                            Plus le score est élevé, plus le texte est facile à lire. 60-70 = Standard, 70-80 = Facile.
                        </div>
                    </div>

                    <!-- Sentence Length -->
                    <div style="background: var(--bg-primary); padding: 1rem; border-radius: 4px; border: 1px solid var(--border-color); margin-bottom: 1rem;">
                        <div style="font-weight: 700; font-size: 1rem; margin-bottom: 0.75rem; color: var(--accent-gold);"><i data-lucide="ruler" style="width:16px;height:16px;vertical-align:middle;margin-right:6px;"></i>Longueur des phrases</div>
                        <div style="display: flex; gap: 1rem; margin-bottom: 0.75rem;">
                            <div><strong>Moyenne:</strong> ${analysis.sentenceLength.avg} mots</div>
                            <div><strong>Min:</strong> ${analysis.sentenceLength.min}</div>
                            <div><strong>Max:</strong> ${analysis.sentenceLength.max}</div>
                        </div>
                        <div style="font-size: 0.8rem; font-weight: 600; margin-bottom: 0.5rem;">Distribution:</div>
                        ${analysis.sentenceLength.distribution.map(r => `
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem;">
                                <span style="font-size: 0.75rem;">${r.label}</span>
                                <div style="flex: 1; margin: 0 0.5rem; height: 8px; background: var(--bg-secondary); border-radius: 4px; overflow: hidden;">
                                    <div style="height: 100%; width: ${r.count * 100 / analysis.sentenceLength.distribution.reduce((s, d) => s + d.count, 0)}%; background: var(--accent-gold);"></div>
                                </div>
                                <span style="font-size: 0.75rem; font-weight: 600; min-width: 30px; text-align: right;">${r.count}</span>
                            </div>
                        `).join('')}
                    </div>

                    <!-- Narrative Distribution -->
                    <div style="background: var(--bg-primary); padding: 1rem; border-radius: 4px; border: 1px solid var(--border-color); margin-bottom: 1rem;">
                        <div style="font-weight: 700; font-size: 1rem; margin-bottom: 0.75rem; color: var(--accent-gold);"><i data-lucide="message-circle" style="width:16px;height:16px;vertical-align:middle;margin-right:6px;"></i>Distribution narrative</div>
                        <div style="display: flex; gap: 1rem; margin-bottom: 0.75rem;">
                            <div><strong>Dialogues:</strong> ${analysis.narrativeDistribution.dialogue}%</div>
                            <div><strong>Narration:</strong> ${analysis.narrativeDistribution.narrative}%</div>
                        </div>
                        <div style="height: 20px; background: var(--bg-secondary); border-radius: 4px; overflow: hidden; display: flex;">
                            <div style="height: 100%; width: ${analysis.narrativeDistribution.dialogue}%; background: #4CAF50;" title="Dialogues"></div>
                            <div style="height: 100%; width: ${analysis.narrativeDistribution.narrative}%; background: var(--accent-gold);" title="Narration"></div>
                        </div>
                        <div style="margin-top: 0.5rem; font-size: 0.75rem; color: var(--text-muted);">
                            ${analysis.narrativeDistribution.dialogCount} segments de dialogue détectés
                        </div>
                    </div>

                    <!-- Word Frequency -->
                    <div style="background: var(--bg-primary); padding: 1rem; border-radius: 4px; border: 1px solid var(--border-color); margin-bottom: 1rem;">
                        <div style="font-weight: 700; font-size: 1rem; margin-bottom: 0.75rem; color: var(--accent-gold);"><i data-lucide="type" style="width:16px;height:16px;vertical-align:middle;margin-right:6px;"></i>Mots les plus fréquents</div>
                        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 0.5rem;">
                            ${analysis.wordFrequency.map(([word, count]) => `
                                <div style="padding: 0.4rem 0.6rem; background: var(--bg-secondary); border-radius: 2px; font-size: 0.75rem;">
                                    <strong>${word}</strong>: ${count}×
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Repetitions -->
                    <div style="background: var(--bg-primary); padding: 1rem; border-radius: 4px; border: 1px solid var(--border-color);">
                        <div style="font-weight: 700; font-size: 1rem; margin-bottom: 0.75rem; color: var(--accent-red);"><i data-lucide="alert-triangle" style="width:16px;height:16px;vertical-align:middle;margin-right:6px;"></i>Répétitions à surveiller (5+ occurrences)</div>
                        ${analysis.repetitions.length > 0 ? `
                            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 0.5rem;">
                                ${analysis.repetitions.map(([word, count]) => `
                                    <div style="padding: 0.4rem 0.6rem; background: rgba(196, 69, 54, 0.1); border: 1px solid var(--accent-red); border-radius: 2px; font-size: 0.75rem;">
                                        <strong>${word}</strong>: ${count}×
                                    </div>
                                `).join('')}
                            </div>
                        ` : '<div style="color: var(--text-muted); font-size: 0.85rem;">Aucune répétition excessive détectée</div>'}
                    </div>
                </div>
            `;
}

