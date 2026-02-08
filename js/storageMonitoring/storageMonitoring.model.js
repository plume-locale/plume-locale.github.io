class StorageMonitoringModel {
    /**
     * Convertit des bytes en chaîne lisible (MB)
     * @param {number} bytes 
     * @returns {string}
     */
    static formatBytes(bytes) {
        if (bytes === 0) return '0 MB';
        const mb = bytes / (1024 * 1024);
        return mb.toFixed(2) + ' MB';
    }

    /**
     * Calcule le pourcentage d'utilisation
     * @param {number} used 
     * @param {number} quota 
     * @returns {number}
     */
    static calculatePercentage(used, quota) {
        if (!quota) return 0;
        return Math.min(100, Math.round((used / quota) * 100));
    }
}
