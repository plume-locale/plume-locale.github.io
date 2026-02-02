/**
 * [MVVM : Product Tour View]
 * Rendu HTML et gestion du DOM pour le système de visite guidée.
 */

console.log('🎓 Product Tour View loaded');

// ============================================
// WELCOME MODAL VIEW
// ============================================

const ProductTourWelcomeView = {
    /**
     * Affiche le modal de bienvenue.
     * @param {Function} onStart - Callback pour démarrer le tour.
     * @param {Function} onSkip - Callback pour ignorer le tour.
     * @param {Function} onDontShowAgain - Callback pour ne plus afficher.
     */
    show: function (onStart, onSkip, onDontShowAgain) {
        // Créer l'overlay
        const overlay = document.createElement('div');
        overlay.className = 'tour-welcome-overlay';
        overlay.id = 'tourWelcomeOverlay';

        // Créer le modal
        const modal = document.createElement('div');
        modal.className = 'tour-welcome-modal';
        modal.id = 'tourWelcomeModal';
        modal.innerHTML = `
            <div class="tour-welcome-header">
                <div class="tour-welcome-icon">🪶</div>
                <h2 class="tour-welcome-title">Bienvenue dans Plume</h2>
                <p class="tour-welcome-subtitle">Votre compagnon d'écriture</p>
            </div>
            <div class="tour-welcome-content">
                <p>Plume est un outil complet pour organiser et écrire vos histoires.</p>
                <p>Voulez-vous découvrir les fonctionnalités principales en quelques minutes ?</p>
            </div>
            <div class="tour-welcome-actions">
                <button class="tour-welcome-btn tour-welcome-btn-secondary" id="tourSkipBtn">
                    Plus tard
                </button>
                <button class="tour-welcome-btn tour-welcome-btn-primary" id="tourStartBtn">
                    Commencer la visite
                </button>
            </div>
            <div class="tour-welcome-checkbox">
                <label>
                    <input type="checkbox" id="tourDontShowAgain">
                    Ne plus afficher ce message
                </label>
            </div>
        `;

        // Ajouter au DOM
        document.body.appendChild(overlay);
        document.body.appendChild(modal);

        // Attacher les événements
        const startBtn = document.getElementById('tourStartBtn');
        const skipBtn = document.getElementById('tourSkipBtn');
        const dontShowCheckbox = document.getElementById('tourDontShowAgain');

        startBtn.addEventListener('click', () => {
            const dontShow = dontShowCheckbox.checked;
            this.hide();
            if (dontShow && onDontShowAgain) {
                onDontShowAgain();
            }
            if (onStart) {
                onStart();
            }
        });

        skipBtn.addEventListener('click', () => {
            const dontShow = dontShowCheckbox.checked;
            this.hide();
            if (dontShow && onDontShowAgain) {
                onDontShowAgain();
            }
            if (onSkip) {
                onSkip();
            }
        });

        // Fermer avec Escape
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                skipBtn.click();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);

        // Focus sur le bouton principal
        setTimeout(() => startBtn.focus(), 100);
    },

    /**
     * Cache le modal de bienvenue.
     */
    hide: function () {
        const overlay = document.getElementById('tourWelcomeOverlay');
        const modal = document.getElementById('tourWelcomeModal');

        if (overlay) {
            overlay.remove();
        }
        if (modal) {
            modal.remove();
        }
    },

    /**
     * Vérifie si le modal est visible.
     * @returns {boolean} True si visible.
     */
    isVisible: function () {
        return document.getElementById('tourWelcomeModal') !== null;
    }
};

// ============================================
// TOUR BUTTON VIEW
// ============================================

const ProductTourButtonView = {
    /**
     * Crée et affiche le bouton de tour dans le header.
     * @param {Function} onClick - Callback au clic.
     * @returns {HTMLElement|null} Élément bouton créé.
     */
    create: function (onClick) {
        // Vérifier si le bouton existe déjà
        if (document.getElementById('tourTriggerBtn')) {
            return document.getElementById('tourTriggerBtn');
        }

        // Trouver le conteneur des actions du header
        const headerActions = document.querySelector('.header-actions');
        if (!headerActions) {
            console.warn('Header actions container not found');
            return null;
        }

        // Créer le bouton
        const button = document.createElement('button');
        button.id = 'tourTriggerBtn';
        button.className = 'header-action-btn tour-trigger-btn';
        button.title = 'Démarrer la visite guidée';
        button.setAttribute('aria-label', 'Démarrer la visite guidée');
        button.innerHTML = '<i data-lucide="help-circle"></i>';

        // Attacher l'événement
        button.addEventListener('click', (e) => {
            e.preventDefault();
            if (onClick) {
                onClick();
            }
        });

        // Ajouter au header (avant le bouton des projets si possible)
        const projectsBtn = headerActions.querySelector('[onclick*="showProjectsModal"]');
        if (projectsBtn) {
            headerActions.insertBefore(button, projectsBtn);
        } else {
            headerActions.appendChild(button);
        }

        // Initialiser l'icône Lucide
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        return button;
    },

    /**
     * Supprime le bouton de tour.
     */
    remove: function () {
        const button = document.getElementById('tourTriggerBtn');
        if (button) {
            button.remove();
        }
    },

    /**
     * Active/désactive le bouton.
     * @param {boolean} enabled - True pour activer.
     */
    setEnabled: function (enabled) {
        const button = document.getElementById('tourTriggerBtn');
        if (button) {
            button.disabled = !enabled;
        }
    },

    /**
     * Met à jour le tooltip du bouton.
     * @param {string} text - Nouveau texte du tooltip.
     */
    setTooltip: function (text) {
        const button = document.getElementById('tourTriggerBtn');
        if (button) {
            button.title = text;
            button.setAttribute('aria-label', text);
        }
    }
};

// ============================================
// NOTIFICATION VIEW
// ============================================

const ProductTourNotificationView = {
    /**
     * Affiche une notification de succès.
     * @param {string} message - Message à afficher.
     */
    showSuccess: function (message) {
        this._showNotification(message, 'success');
    },

    /**
     * Affiche une notification d'erreur.
     * @param {string} message - Message à afficher.
     */
    showError: function (message) {
        this._showNotification(message, 'error');
    },

    /**
     * Affiche une notification d'information.
     * @param {string} message - Message à afficher.
     */
    showInfo: function (message) {
        this._showNotification(message, 'info');
    },

    /**
     * Affiche une notification.
     * @private
     * @param {string} message - Message à afficher.
     * @param {string} type - Type de notification.
     */
    _showNotification: function (message, type = 'info') {
        // Utiliser le système de notification existant si disponible
        if (typeof showNotification === 'function') {
            showNotification(message, type);
            return;
        }

        // Fallback: console log
        console.log(`[${type.toUpperCase()}] ${message}`);
    }
};

// ============================================
// DRIVER VIEW HELPERS
// ============================================

const ProductTourDriverView = {
    /**
     * Prépare la vue pour un step spécifique.
     * @param {Object} step - Step à préparer.
     */
    prepareForStep: function (step) {
        // S'assurer que l'élément est visible
        if (step.element) {
            const element = document.querySelector(step.element);
            if (element) {
                this._ensureElementVisible(element);
            }
        }
    },

    /**
     * S'assure qu'un élément est visible dans le viewport.
     * @private
     * @param {HTMLElement} element - Élément à rendre visible.
     */
    _ensureElementVisible: function (element) {
        if (!element) return;

        // Vérifier si l'élément est dans le viewport
        const rect = element.getBoundingClientRect();
        const isVisible = (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= window.innerHeight &&
            rect.right <= window.innerWidth
        );

        // Scroller si nécessaire
        if (!isVisible) {
            element.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
                inline: 'center'
            });
        }
    },

    /**
     * Nettoie les éléments de la vue après le tour.
     */
    cleanup: function () {
        console.log('🧹 Cleaning up tour elements...');
        
        // Supprimer les éléments temporaires
        const tempElements = document.querySelectorAll('[data-tour-temp]');
        tempElements.forEach(el => el.remove());
        
        // Supprimer tous les éléments Driver.js qui pourraient rester
        const driverElements = [
            '.driver-overlay',
            '.driver-popover',
            '#driver-popover-content',
            '.driver-active-element',
            '.driver-no-interaction',
            '#driver-dummy-element'
        ];
        
        driverElements.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                console.log('Removing element:', selector);
                el.remove();
            });
        });
        
        // Retirer les classes Driver.js du body
        document.body.classList.remove('driver-active', 'driver-fade', 'driver-simple');
        
        // Retirer les attributs aria ajoutés par Driver.js
        document.querySelectorAll('[aria-haspopup="dialog"]').forEach(el => {
            el.removeAttribute('aria-haspopup');
            el.removeAttribute('aria-expanded');
            el.removeAttribute('aria-controls');
        });
        
        console.log('✅ Tour cleanup complete');
    }
};
