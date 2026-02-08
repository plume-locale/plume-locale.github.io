class StorageMonitoringViewModel {
    constructor(repository, view) {
        this.repository = repository;
        this.view = view;

        this.storageWarningShown = false;
        this.storageCriticalShown = false;
    }

    /**
     * Initialise la surveillance et met à jour l'interface
     */
    async init() {
        // Initial check and update
        await this.updateStorageStatus();

        // Setup periodic check or event listeners if needed (currently driven by main init)
        this.checkQuota();
    }

    /**
     * Met à jour le badge et le pourcentage
     */
    async updateStorageStatus() {
        try {
            const { used, quota } = await this.repository.getStorageSize();
            const percentage = StorageMonitoringModel.calculatePercentage(used, quota);

            // Determine status
            let status = 'ok';
            if (percentage >= 95) status = 'danger';
            else if (percentage >= 80) status = 'warning';

            this.view.updateBadge(percentage, status);

            // Check limits for alerts
            this.checkQuotaLevels(percentage, used, quota);

        } catch (error) {
            console.error('❌ Erreur updateStorageStatus:', error);
        }
    }

    /**
     * Vérifie les quotas pour afficher des alertes
     */
    async checkQuota() {
        try {
            const { used, quota } = await this.repository.getStorageSize();
            const percentage = StorageMonitoringModel.calculatePercentage(used, quota);
            this.checkQuotaLevels(percentage, used, quota);
        } catch (error) {
            console.error('❌ Erreur checkQuota:', error);
        }
    }

    /**
     * Logique des alertes de quota
     */
    checkQuotaLevels(percentage, used, quota) {
        if (percentage >= 95 && !this.storageCriticalShown) {
            this.storageCriticalShown = true;
            const message = `Vous avez utilisé ${percentage}% de l'espace disponible (${StorageMonitoringModel.formatBytes(used)} / ${StorageMonitoringModel.formatBytes(quota)}).\n\n` +
                `⚠️ ATTENTION : Vous risquez de perdre vos données !\n\n` +
                `Actions urgentes :\n` +
                `• Exportez immédiatement votre projet en JSON\n` +
                `• Supprimez des versions anciennes\n` +
                `• Réduisez le nombre de notes\n\n` +
                `Voulez-vous exporter maintenant ?`;

            this.view.showStorageAlert('🚨 Espace critique !', message, 'danger', () => this.view.showExportModal(), () => this.showDetails());

        } else if (percentage >= 80 && !this.storageWarningShown) {
            this.storageWarningShown = true;
            const message = `Vous avez utilisé ${percentage}% de l'espace disponible.\n\n` +
                `Recommandations :\n` +
                `• Exportez régulièrement votre projet\n` +
                `• Surveillez votre utilisation\n` +
                `• Pensez à nettoyer les anciennes versions`;

            this.view.showStorageAlert('⚠️ Espace limité', message, 'warning', () => this.view.showExportModal(), () => this.showDetails());
        }

        // Reset warnings if space freed
        if (percentage < 80) {
            this.storageWarningShown = false;
            this.storageCriticalShown = false;
        }
    }

    /**
     * Affiche les détails complets (appelé par le clic sur le badge)
     */
    async showDetails() {
        try {
            const { used, quota } = await this.repository.getStorageSize();
            const percentage = StorageMonitoringModel.calculatePercentage(used, quota);
            const available = quota - used;

            const recommendations = this.getRecommendations(percentage, quota);

            this.view.renderDetails({
                usedFormatted: StorageMonitoringModel.formatBytes(used),
                availableFormatted: StorageMonitoringModel.formatBytes(available),
                percentage: percentage,
                recommendations: recommendations
            });

            this.view.openDetailsModal();

        } catch (error) {
            console.error('❌ Erreur showDetails:', error);
        }
    }

    /**
     * Génère les données de recommandation
     */
    getRecommendations(percentage, quota) {
        if (percentage >= 95) {
            return {
                summaryText: '🚨 Actions urgentes',
                summaryColor: 'var(--accent-red)',
                isOpen: true,
                html: `
                    <ul style="font-size: 0.8rem; color: var(--text-secondary); line-height: 1.5; padding-left: 1.25rem; margin: 0;">
                        <li>Exportez immédiatement votre projet en JSON</li>
                        <li>Supprimez des versions anciennes</li>
                        <li>Réduisez le nombre de notes archivées</li>
                    </ul>
                `
            };
        } else if (percentage >= 80) {
            return {
                summaryText: '⚠️ Attention requise',
                summaryColor: 'var(--accent-gold)',
                isOpen: false,
                html: `
                    <ul style="font-size: 0.8rem; color: var(--text-secondary); line-height: 1.5; padding-left: 1.25rem; margin: 0;">
                        <li>Exportez régulièrement votre projet</li>
                        <li>Surveillez l'évolution de votre utilisation</li>
                        <li>Nettoyez les versions inutilisées</li>
                    </ul>
                `
            };
        } else {
            return {
                summaryText: '✅ Espace suffisant',
                summaryColor: 'var(--accent-green)',
                isOpen: false,
                html: `
                    <ul style="font-size: 0.8rem; color: var(--text-secondary); line-height: 1.5; padding-left: 1.25rem; margin: 0;">
                        <li>Continuez à exporter régulièrement</li>
                        <li>Votre projet est dans la limite normale</li>
                        <li>IndexedDB : ${StorageMonitoringModel.formatBytes(quota)} disponibles</li>
                    </ul>
                `
            };
        }
    }

    /**
     * Gère l'erreur de sauvegarde (espace insuffisant)
     */
    handleStorageError() {
        this.view.alertError(
            '🚨 ERREUR DE SAUVEGARDE\n\n' +
            'Impossible de sauvegarder : espace de stockage insuffisant.\n\n' +
            'Actions à faire MAINTENANT :\n' +
            '1. Exportez votre projet en JSON\n' +
            '2. Supprimez des versions anciennes\n' +
            '3. Libérez de l\'espace\n\n' +
            'Sans cela, vos modifications récentes seront perdues !'
        );
        this.showDetails();
    }

    /**
     * Vérification avant fermeture de la page
     */
    async checkBeforeUnload(e) {
        try {
            const { used, quota } = await this.repository.getStorageSize();
            const percentage = StorageMonitoringModel.calculatePercentage(used, quota);

            if (percentage >= 95) {
                e.preventDefault();
                e.returnValue = 'ATTENTION : Votre espace de stockage est presque plein. Pensez à exporter votre projet !';
                return e.returnValue;
            }
        } catch (error) {
            console.error('❌ Erreur checkBeforeUnload:', error);
        }
    }
}
