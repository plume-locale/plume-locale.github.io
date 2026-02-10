/**
 * [MVVM : globalnotes Main]
 * Initialization script for the globalnotes module.
 */

const globalnotesModule = {
    init: function () {
        console.log('📝 globalnotes Module Initializing...');

        // Register view rendering function to global app if needed
        window.renderGlobalNotes = (container) => {
            GlobalNotesViewModel.init();
            GlobalNotesView.render(container);
        };
    }
};

// Auto-init 
document.addEventListener('DOMContentLoaded', () => {
    globalnotesModule.init();
});


