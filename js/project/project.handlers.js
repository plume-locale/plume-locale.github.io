/**
 * [MVVM : Project Handlers]
 * Gère les événements utilisateur pour les projets.
 */

const ProjectHandlers = {
    /**
     * Initialise les écouteurs d'événements.
     */
    init() {
        // Formulaire de création de projet
        const createBtn = document.getElementById('createNewProjectBtn');
        if (createBtn) {
            createBtn.onclick = () => {
                const data = {
                    title: document.getElementById('newProjectTitle')?.value.trim(),
                    description: document.getElementById('newProjectDesc')?.value.trim(),
                    genre: document.getElementById('newProjectGenre')?.value,
                    template: document.getElementById('newProjectTemplate')?.value
                };
                ProjectViewModel.create(data);
            };
        }

        // Import de projet
        const importInput = document.getElementById('importProjectInput');
        if (importInput) {
            importInput.onchange = (e) => ProjectViewModel.import(e.target.files[0]);
        }
    },

    /**
     * Déclenche l'ouverture du sélecteur de fichier pour l'import.
     */
    triggerImport() {
        document.getElementById('importProjectInput')?.click();
    }
};

// Fonctions globales pour compatibilité avec le HTML existant
function createNewProject() {
    const data = {
        title: document.getElementById('newProjectTitle')?.value.trim(),
        description: document.getElementById('newProjectDesc')?.value.trim(),
        genre: document.getElementById('newProjectGenre')?.value,
        template: document.getElementById('newProjectTemplate')?.value
    };
    ProjectViewModel.create(data);
}
function openNewProjectModal() { ProjectView.openNewModal(); }
function importProject() { ProjectHandlers.triggerImport(); }
function renderProjectsList() { ProjectView.renderList(projects, currentProjectId); }
function renderAnalysis() { ProjectView.renderAnalysis(); }
function switchToProject(id) { ProjectViewModel.switchTo(id); }
function deleteProject(id) { ProjectViewModel.delete(id); }
function exportProjectIndividual(id) { ProjectViewModel.export(id); }
function handleProjectImport(event) { ProjectViewModel.import(event.target.files[0]); }

function renderSceneInContainer(actId, chapterId, sceneId, containerId) {
    const act = project.acts.find(a => a.id === actId);
    const chapter = act?.chapters.find(c => c.id === chapterId);
    const scene = chapter?.scenes.find(s => s.id === sceneId);
    ProjectView.renderSceneInContainer(act, chapter, scene, containerId);
}

// Override des fonctions globales de sauvegarde
saveProject = function () {
    ProjectViewModel.saveAll();
};
