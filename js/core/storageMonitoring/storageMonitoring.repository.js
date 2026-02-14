class StorageMonitoringRepository {
    /**
     * Récupère la taille utilisée et le quota via l'API Storage ou fallback
     * @returns {Promise<{used: number, quota: number}>}
     */
    async getStorageSize() {
        try {
            // Utiliser l'API Storage Estimate pour obtenir la taille réelle
            if ('storage' in navigator && 'estimate' in navigator.storage) {
                const estimate = await navigator.storage.estimate();

                // [UX] Cap the displayed quota to 500MB.
                // Text projects are small. Seeing 144GB available makes the progress bar useless (always 0%).
                // 500MB is still an enormous amount of text (approx 250 million words).
                const MAX_APP_QUOTA = 500 * 1024 * 1024;
                const quota = estimate.quota || MAX_APP_QUOTA;

                return {
                    used: estimate.usage || 0,
                    quota: Math.min(quota, MAX_APP_QUOTA)
                };
            } else {
                // Fallback : calculer la taille approximative d'IndexedDB
                // Note: getIndexedDBSize est défini dans 02.storage.js
                const size = typeof getIndexedDBSize === 'function' ? await getIndexedDBSize() : 0;
                return {
                    used: size,
                    quota: 50 * 1024 * 1024 // 50 MB par défaut
                };
            }
        } catch (error) {
            console.error('❌ Erreur calcul taille stockage:', error);
            return {
                used: 0,
                quota: 50 * 1024 * 1024
            };
        }
    }
}
