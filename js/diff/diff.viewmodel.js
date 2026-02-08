/**
 * DIFF MODULE - VIEWMODEL
 * Orchestrates logic between the Model and the View.
 */

const DiffViewModel = {
    _state: {
        currentView: 'unified', // 'unified' or 'side'
        oldVersionId: null,
        newVersionId: null,
        diffData: null
    },

    init() {
        this._state.currentView = 'unified';
    },

    /**
     * Prepares the diff data for the current selection.
     */
    updateDiff() {
        const oldId = this._state.oldVersionId;
        const newId = this._state.newVersionId;

        if (oldId === null || newId === null) return;

        const oldVersion = DiffRepository.getVersion(Number(oldId));
        const newVersion = DiffRepository.getVersion(Number(newId));

        if (!oldVersion || !newVersion) return;

        // Compute diff
        const diff = DiffModel.computeDiff(oldVersion.content || '', newVersion.content || '');
        this._state.diffData = diff;

        // Update stats and render
        DiffView.updateStats(diff);
        if (this._state.currentView === 'unified') {
            DiffView.renderUnified(diff);
        } else {
            DiffView.renderSideBySide(diff, oldVersion, newVersion);
        }
    },

    /**
     * Sets the comparison versions.
     */
    setVersions(oldId, newId) {
        this._state.oldVersionId = oldId;
        this._state.newVersionId = newId;
        this.updateDiff();
    },

    /**
     * Switches between unified and side-by-side view.
     */
    setViewMode(mode) {
        if (this._state.currentView === mode) return;
        this._state.currentView = mode;
        this.updateDiff();
    },

    /**
     * Helper to get stats from diff data.
     */
    getStats(diff) {
        let added = 0;
        let removed = 0;

        diff.forEach(para => {
            if (para.items) {
                para.items.forEach(item => {
                    if (item.isBreak) return;
                    if (item.type === 'added' && item.text.trim()) added++;
                    if (item.type === 'removed' && item.text.trim()) removed++;
                });
            }
        });

        return { added, removed };
    },

    getCurrentViewMode() {
        return this._state.currentView;
    }
};
