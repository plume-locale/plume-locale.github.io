/**
 * DIFF MODULE - MAIN
 * Entry point for the Diff module and public API.
 */

const DiffApp = {
    init() {
        DiffViewModel.init();
        DiffHandlers.init();
    },

    /**
     * Public API to open the diff modal for a specific version.
     * @param {number} versionId 
     */
    open(versionId) {
        const versions = DiffRepository.getVersions();
        if (!versions || versions.length < 2) {
            alert(Localization.t('diff.error.two_versions_required'));
            return;
        }

        // Logic to determine which versions to compare by default
        const clickedVersion = versions.find(v => v.id === versionId);
        const activeVersion = versions.find(v => v.isActive);

        let oldId, newId;

        if (clickedVersion && activeVersion && clickedVersion.id !== activeVersion.id) {
            // Compare clicked with active
            if (clickedVersion.number < activeVersion.number) {
                oldId = clickedVersion.id;
                newId = activeVersion.id;
            } else {
                oldId = activeVersion.id;
                newId = clickedVersion.id;
            }
        } else {
            // Compare last two versions
            const sorted = [...versions].sort((a, b) => b.number - a.number);
            if (sorted.length >= 2) {
                oldId = sorted[1].id;
                newId = sorted[0].id;
            } else {
                oldId = versions[0].id;
                newId = (versions[1] ? versions[1].id : versions[0].id);
            }
        }

        DiffViewModel.setVersions(oldId, newId);
        DiffView.openModal(oldId, newId);
    }
};

// Global exports for legacy compatibility
window.openDiffModal = (versionId) => DiffApp.open(versionId);
window.closeDiffModal = () => DiffView.closeModal();
window.setDiffView = (mode) => {
    DiffViewModel.setViewMode(mode);
    DiffView.updateViewModeButtons(mode);
};
window.updateDiff = () => DiffViewModel.updateDiff();

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    DiffApp.init();
});
