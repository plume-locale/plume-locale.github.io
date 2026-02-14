class StorageMonitoringView {
    constructor() {
        this.badge = document.getElementById('storage-badge');
        this.percentageText = document.getElementById('storage-percentage');

        // Modal elements
        this.barFill = document.getElementById('storage-bar-fill');
        this.barText = document.getElementById('storage-bar-text');
        this.usedEl = document.getElementById('storage-used');
        this.availableEl = document.getElementById('storage-available');
        this.recommendationsContainer = document.getElementById('storage-recommendations-container');
        this.recommendationsDetails = document.getElementById('storage-recommendations-details');

        this.modal = document.getElementById('storage-modal');
    }

    /**
     * Met à jour le badge UI
     * @param {number} percentage 
     * @param {string} status 'ok' | 'warning' | 'danger'
     */
    updateBadge(percentage, status) {
        if (!this.badge || !this.percentageText) return;

        this.percentageText.textContent = percentage + '%';

        this.badge.classList.remove('status-ok', 'status-warning', 'status-danger');
        this.badge.classList.add(`status-${status}`);
    }

    /**
     * Affiche une alerte via confirm()
     * @param {string} title 
     * @param {string} message 
     * @param {string} level 
     * @param {Function} onDangerAction 
     * @param {Function} onNormalAction 
     */
    showStorageAlert(title, message, level, onDangerAction, onNormalAction) {
        if (confirm(`${title}\n\n${message}`)) {
            if (level === 'danger') {
                if (onDangerAction) onDangerAction();
            } else {
                if (onNormalAction) onNormalAction();
            }
        }
    }

    /**
     * Helper pour afficher la modale d'export (suppose fonction globale existante ou à injecter)
     * NOTE: showExportModal() est une fonction globale dans Plume currently.
     */
    showExportModal() {
        if (typeof window.showExportModal === 'function') {
            window.showExportModal();
        } else {
            console.warn('ShowExportModal function not found');
        }
    }

    /**
     * Met à jour le contenu de la modale de détails
     * @param {Object} data 
     */
    renderDetails(data) {
        // Update bar
        if (this.barFill && this.barText) {
            this.barFill.style.width = data.percentage + '%';
            this.barText.textContent = data.percentage + '%';

            this.barFill.className = 'storage-bar-fill';
            if (data.percentage >= 95) this.barFill.classList.add('danger');
            else if (data.percentage >= 80) this.barFill.classList.add('warning');
            else this.barFill.classList.add('ok');
        }

        // Update text stats
        if (this.usedEl) this.usedEl.textContent = data.usedFormatted;
        if (this.availableEl) this.availableEl.textContent = data.availableFormatted;

        // Recommendations
        if (this.recommendationsContainer && this.recommendationsDetails) {
            const summary = this.recommendationsDetails.querySelector('summary');
            if (summary) {
                summary.textContent = data.recommendations.summaryText;
                summary.style.color = data.recommendations.summaryColor;
            }
            this.recommendationsContainer.innerHTML = data.recommendations.html;
            this.recommendationsDetails.open = data.recommendations.isOpen;
        }
    }

    /**
     * Ouvre la modale
     */
    openDetailsModal() {
        if (this.modal) {
            this.modal.classList.add('active');
        } else {
            console.error('Modal storage-modal not found');
        }
    }

    /**
     * Affiche une simple alerte erreur
     * @param {string} msg 
     */
    alertError(msg) {
        alert(msg);
    }
}
