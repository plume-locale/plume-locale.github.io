// Raccourcis clavier pour undo/redo
document.addEventListener('keydown', function (e) {
    // Ctrl+Z ou Cmd+Z pour undo
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (typeof EventBus !== 'undefined') EventBus.emit('history:undo');
        else if (typeof undo === 'function') undo();
    }
    // Ctrl+Y ou Cmd+Shift+Z pour redo
    else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        if (typeof EventBus !== 'undefined') EventBus.emit('history:redo');
        else if (typeof redo === 'function') redo();
    }
});

// [MVVM : Helper]
// Validation utilities
const ValidationHelper = {
    validateTitle(title, options = {}) {
        const maxLength = options.maxLength || 100;
        const minLength = options.minLength || 1;

        if (!title || typeof title !== 'string') {
            return {
                isValid: false,
                error: 'INVALID_TYPE',
                message: 'Le titre doit être une chaîne de caractères'
            };
        }

        const trimmed = title.trim();

        if (trimmed.length < minLength) {
            return {
                isValid: false,
                error: 'TOO_SHORT',
                message: `Le titre doit contenir au moins ${minLength} caractère(s)`
            };
        }

        if (trimmed.length > maxLength) {
            return {
                isValid: false,
                error: 'TOO_LONG',
                message: `Le titre ne peut pas dépasser ${maxLength} caractères`
            };
        }

        return { isValid: true, value: trimmed };
    },

    checkDuplicate(title, collection, property = 'title') {
        const exists = collection.some(item => item[property] === title);
        if (exists) {
            return {
                isDuplicate: true,
                error: 'DUPLICATE',
                message: `Un élément avec ce ${property} existe déjà`
            };
        }
        return { isDuplicate: false };
    }
};

// [MVVM : Helper]
// Notification system
function showNotification(message, type = 'info') {
    // Si la fonction showNotification existe déjà dans l'app, l'utiliser
    if (typeof window.showNotification === 'function') {
        window.showNotification(message, type);
        return;
    }

    // Sinon, fallback simple
    console.log(`[${type.toUpperCase()}] ${message}`);
}
