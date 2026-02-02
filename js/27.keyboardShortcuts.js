
// Keyboard shortcuts
// [MVVM : ViewModel]
// Gestionnaire d'événements pour les raccourcis clavier globaux.
// Relie les entrées utilisateur (Vue) aux actions de l'application (ViewModel/Model).
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal('addChapterModal');
        closeModal('addSceneModal');
        closeModal('addActModal');
        closeModal('addCharacterModal');
        closeModal('addWorldModal');
        closeModal('addTimelineModal');
        closeModal('addNoteModal');
        closeModal('addCodexModal');
        closeModal('backupModal');
        closeModal('referencesModal');
        closeModal('projectsModal');
        closeModal('newProjectModal');
        closeSearchResults();

        // Close focus panel if open
        if (focusPanelOpen) {
            toggleFocusPanel();
        }
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        document.getElementById('globalSearch').focus();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveProject();
    }
    if (e.key === 'F11') {
        e.preventDefault();
        toggleFocusMode();
    }
    // Raccourci pour le mode révision (Ctrl+R)
    if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        if (currentSceneId) {
            toggleRevisionMode();
        }
    }
});
