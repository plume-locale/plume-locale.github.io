/**
 * Snapshots Model
 * Defines the structure of a version snapshot.
 */
class SnapshotModel {
    constructor(data = {}) {
        this.id = data.id || Date.now();
        this.label = data.label || Localization.t('snapshots.no_title');
        this.timestamp = data.timestamp || new Date().toISOString();
        this.wordCount = data.wordCount || 0;
        this.snapshot = data.snapshot || {}; // The actual project data
    }

    /**
     * Creates a new Snapshot instance from project data.
     * @param {string} label - The label for the version.
     * @param {number} wordCount - Current word count.
     * @param {Object} projectData - The project data object.
     * @returns {SnapshotModel}
     */
    static create(label, wordCount, projectData) {
        // Create a shallow copy to separate 'versions' from the rest of the data
        const { versions, ...dataToSave } = projectData;

        return new SnapshotModel({
            id: Date.now(),
            label: label.trim(),
            timestamp: new Date().toISOString(),
            wordCount: wordCount,
            // Deep clone the valid data to ensure a detached snapshot
            snapshot: JSON.parse(JSON.stringify(dataToSave))
        });
    }
}
