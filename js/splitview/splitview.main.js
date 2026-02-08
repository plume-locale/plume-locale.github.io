// ==========================================
// SPLIT VIEW SYSTEM - Main
// ==========================================

// Initialize split view state from localStorage if available
document.addEventListener('DOMContentLoaded', () => {
    if (typeof loadSplitViewState === 'function') {
        loadSplitViewState();
    }
});
