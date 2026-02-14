// ==========================================
// SPLIT VIEW SYSTEM - Repository
// ==========================================

/** [MVVM : Model] - Persiste l'état actuel du mode split dans le stockage local */
function saveSplitViewState() {
    if (splitViewState.persistOnReload) {
        localStorage.setItem('plume_splitViewState', JSON.stringify({
            active: splitViewActive,
            activePanel: splitActivePanel,
            state: splitViewState
        }));
    }
}

/** [MVVM : Model] - Récupère l'état sauvegardé du mode split du stockage local */
function loadSplitViewState() {
    const saved = localStorage.getItem('plume_splitViewState');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            if (data.state && data.state.persistOnReload) {
                splitViewState = { ...splitViewState, ...data.state };
                splitActivePanel = data.activePanel || 'left';
                if (data.active) {
                    splitViewActive = true;
                    setTimeout(() => {
                        renderSplitView();
                        updateSplitToggleButton();
                    }, 500);
                }
            }
        } catch (e) {
            console.error('Error loading split view state:', e);
        }
    }
}
