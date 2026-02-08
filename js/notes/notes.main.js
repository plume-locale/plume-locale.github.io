/**
 * Notes Main - Initialization
 */
(function () {
    // Refresh list on load if notes list container exists
    document.addEventListener('DOMContentLoaded', () => {
        if (document.getElementById('notesList')) {
            // Wait for project to be loaded
            const checkProject = setInterval(() => {
                if (window.project) {
                    clearInterval(checkProject);
                    notesViewModel.refreshList();
                }
            }, 100);

            // Safety timeout
            setTimeout(() => clearInterval(checkProject), 5000);
        }
    });

    console.log('Notes module initialized');
})();
