// [MVVM : Model]
// Charge le projet depuis le localStorage et gère la migration de structure
function loadProject() {
    const saved = localStorage.getItem('plume_locale_project');
    if (saved) {
        const loadedProject = JSON.parse(saved);

        // Migration: Convert old structure (chapters array) to new structure (acts array)
        if (loadedProject.chapters && !loadedProject.acts) {
            console.log('Migrating old project structure to acts-based structure...');
            project = {
                title: loadedProject.title || "Mon Roman",
                acts: [
                    {
                        id: Date.now(),
                        title: "Acte I",
                        chapters: loadedProject.chapters || []
                    }
                ],
                characters: loadedProject.characters || [],
                world: loadedProject.world || []
            };
            // Save migrated structure
            saveProject();
            console.log('Migration complete!');
        } else {
            // Ensure all data structures exist
            project = {
                ...loadedProject,
                characters: loadedProject.characters || [],
                world: loadedProject.world || [],
                timeline: loadedProject.timeline || [],
                notes: loadedProject.notes || [],
                codex: loadedProject.codex || [],
                stats: loadedProject.stats || {
                    dailyGoal: 500,
                    totalGoal: 80000,
                    writingSessions: []
                },
                versions: loadedProject.versions || [],
                relationships: loadedProject.relationships || [],
                metroTimeline: loadedProject.metroTimeline || [],
                characterColors: loadedProject.characterColors || {}
            };

            // Ensure all scenes have linked arrays
            project.acts.forEach(act => {
                act.chapters.forEach(chapter => {
                    chapter.scenes.forEach(scene => {
                        if (!scene.linkedCharacters) scene.linkedCharacters = [];
                        if (!scene.linkedElements) scene.linkedElements = [];
                    });
                });
            });

            // Ensure all characters have linked arrays
            project.characters.forEach(char => {
                if (!char.linkedScenes) char.linkedScenes = [];
                if (!char.linkedElements) char.linkedElements = [];
            });

            // Ensure all world elements have linked arrays
            project.world.forEach(elem => {
                if (!elem.linkedScenes) elem.linkedScenes = [];
                if (!elem.linkedElements) elem.linkedElements = [];
            });
        }
    }
}

// [MVVM : Model]
// Charge l'état d'expansion de l'arborescence depuis IndexedDB
async function loadTreeState() {
    // Charger l'état d'expansion depuis IndexedDB
    try {
        const savedActs = await loadSetting('expanded_acts');
        const savedChapters = await loadSetting('expanded_chapters');

        if (savedActs) {
            expandedActs = new Set(savedActs);
        }
        if (savedChapters) {
            expandedChapters = new Set(savedChapters);
        }
    } catch (e) {
        console.error('Erreur chargement état arborescence:', e);
    }
}

// [MVVM : Model]
// Factory Functions - Création des entités du modèle
// Ces fonctions centralisent la création des structures de données

// Générateurs d'ID pour éviter les collisions
let actIdCounter = Date.now();
let chapterIdCounter = Date.now() + 1000000;
let sceneIdCounter = Date.now() + 2000000;

function generateActId() {
    return actIdCounter++;
}

function generateChapterId() {
    return chapterIdCounter++;
}

function generateSceneId() {
    return sceneIdCounter++;
}

// Crée une nouvelle instance d'Acte
function createAct(title, options = {}) {
    if (!title || typeof title !== 'string') {
        throw new Error('Act title is required and must be a string');
    }

    const now = new Date().toISOString();

    return {
        id: options.id || generateActId(),
        title: title,
        chapters: options.chapters || [],
        createdAt: options.createdAt || now,
        updatedAt: options.updatedAt || now,
        metadata: {
            color: options.color || null,
            description: options.description || ''
        }
    };
}

// Crée une nouvelle instance de Chapitre
function createChapter(title, options = {}) {
    if (!title || typeof title !== 'string') {
        throw new Error('Chapter title is required and must be a string');
    }

    const now = new Date().toISOString();

    return {
        id: options.id || generateChapterId(),
        title: title,
        scenes: options.scenes || [],
        createdAt: options.createdAt || now,
        updatedAt: options.updatedAt || now,
        metadata: {
            description: options.description || ''
        }
    };
}

// Crée une nouvelle instance de Scène
function createScene(title, options = {}) {
    if (!title || typeof title !== 'string') {
        throw new Error('Scene title is required and must be a string');
    }

    const now = new Date().toISOString();

    return {
        id: options.id || generateSceneId(),
        title: title,
        content: options.content || '',
        linkedCharacters: options.linkedCharacters || [],
        linkedElements: options.linkedElements || [],
        wordCount: options.wordCount || 0,
        status: options.status || 'draft',
        createdAt: options.createdAt || now,
        updatedAt: options.updatedAt || now
    };
}
