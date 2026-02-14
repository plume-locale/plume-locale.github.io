/**
 * DIFF MODULE - REPOSITORY
 * Handles data access for versions and diff calculations.
 */

const DiffRepository = {
    /**
     * Get the current scene and its versions from the SceneVersion module.
     * @returns {Object|null}
     */
    getSceneData() {
        // Depends on SceneVersionRepository being globally available or provided by window
        if (typeof SceneVersionRepository !== 'undefined') {
            return SceneVersionRepository.getCurrentScene();
        }
        if (typeof getCurrentSceneForVersions === 'function') {
            return getCurrentSceneForVersions();
        }
        console.error("DiffRepository: SceneVersionRepository not found.");
        return null;
    },

    /**
     * Get a specific version by ID.
     * @param {number} versionId 
     * @returns {Object|null}
     */
    getVersion(versionId) {
        const data = this.getSceneData();
        if (!data || !data.scene.versions) return null;
        return data.scene.versions.find(v => v.id === versionId) || null;
    },

    /**
     * Get all versions for the current scene.
     * @returns {Array}
     */
    getVersions() {
        const data = this.getSceneData();
        return (data && data.scene.versions) ? data.scene.versions : [];
    }
};
