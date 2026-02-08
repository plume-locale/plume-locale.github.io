/**
 * Snapshots Repository
 * Handles data access for versions/snapshots directly from the global project object.
 */
class SnapshotsRepository {
    constructor() {
        // Ensure the versions array exists in the project
        if (typeof project !== 'undefined' && !project.versions) {
            project.versions = [];
        }
    }

    getAll() {
        return project.versions || [];
    }

    getById(id) {
        return this.getAll().find(v => v.id === id);
    }

    add(snapshot) {
        if (!project.versions) {
            project.versions = [];
        }
        project.versions.push(snapshot);
        this._save();
    }

    remove(id) {
        if (!project.versions) return;
        project.versions = project.versions.filter(v => v.id !== id);
        this._save();
    }

    /**
     * Persists the changes to the global storage.
     * Relies on the global saveProject function.
     */
    _save() {
        if (typeof saveProject === 'function') {
            saveProject();
        } else {
            console.error("SnapshotsRepository: saveProject function not found.");
        }
    }

    /**
     * Restores the project state from a snapshot.
     * @param {Object} snapshotData - The snapshot data object.
     */
    restoreProject(snapshotData) {
        if (!project) return;

        // Dynamically restore all keys present in the snapshot
        Object.keys(snapshotData).forEach(key => {
            project[key] = JSON.parse(JSON.stringify(snapshotData[key]));
        });

        this._save();
    }

    getCurrentState() {
        return typeof project !== 'undefined' ? project : {};
    }

    /**
     * Calculates the total word count of the current project.
     * Uses the global getWordCount function if available.
     * @returns {number}
     */
    getCurrentWordCount() {
        if (!project || !project.acts) return 0;

        return project.acts.reduce((sum, act) => {
            return sum + (act.chapters || []).reduce((chSum, chapter) => {
                return chSum + (chapter.scenes || []).reduce((sceneSum, scene) => {
                    return sceneSum + (typeof getWordCount === 'function' ? getWordCount(scene.content) : 0);
                }, 0);
            }, 0);
        }, 0);
    }
}
