/**
 * @file sidebar-view.viewmodel.js
 * @description ViewModel pour préparer les données d'affichage de la barre latérale.
 */

class SidebarViewViewModel {
    constructor(repository) {
        this.repository = repository;
    }

    /**
     * Récupère les données complètes pour afficher la vue.
     * @param {string} viewType 
     * @returns {Object|null} Objet contenant la config et l'état (count, isEmpty), ou null si vue inconnue
     */
    getViewData(viewType) {
        const config = SidebarViewModelData.VIEW_CONFIG[viewType];

        if (!config) {
            console.warn(`[SidebarView] Configuration introuvable pour la vue: ${viewType}`);
            return null;
        }

        const count = this.repository.getItemCount(viewType);
        const isEmpty = this.repository.isEmpty(viewType);

        return {
            ...config,
            title: Localization.t(config.titleKey),
            description: Localization.t(config.descriptionKey),
            emptyMessage: Localization.t(config.emptyMessageKey),
            emptySubMessage: Localization.t(config.emptySubMessageKey),
            sidebarHint: Localization.t(config.sidebarHintKey),
            // On traite le actionButton qui peut contenir du code template
            actionButton: config.actionButton.includes('${') ? eval('`' + config.actionButton + '`') : config.actionButton,
            count: count,
            isEmpty: isEmpty,
            viewType: viewType // Utile pour debugging ou styling spécifique
        };
    }
}
