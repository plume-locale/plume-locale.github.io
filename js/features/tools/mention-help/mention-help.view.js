/**
 * [MVVM : View]
 * MentionHelpView - Rendu de l'interface utilisateur pour les mentions.
 */

const MentionHelpView = {
    containerId: 'mentionHelpPopup',

    /**
     * Affiche la liste des suggestions.
     */
    render(suggestions, selectedIndex, activeElement) {
        let list = document.getElementById(this.containerId);
        if (!list) {
            list = document.createElement('div');
            list.id = this.containerId;
            list.className = 'mention-help-popup';
            document.body.appendChild(list);
            this.injectStyles();
        }

        const rect = activeElement.getBoundingClientRect();
        const popupHeight = Math.min(suggestions.length * 45, 250);

        // Positionnement intelligent
        let top = rect.top - popupHeight - 10;
        if (top < 0) {
            top = rect.bottom + 10;
        }

        list.style.left = `${rect.left}px`;
        list.style.top = `${top}px`;
        list.style.display = 'block';

        list.innerHTML = suggestions.map((s, index) => `
            <div class="mention-help-item ${index === selectedIndex ? 'active' : ''}" 
                 onmousedown="MentionHelpViewModel.selectSuggestion(MentionHelpViewModel.state.suggestions[${index}]); event.preventDefault();">
                <div class="mention-help-icon">
                    ${s.avatar ? `<img src="${s.avatar}" class="mention-avatar">` : `<i data-lucide="${s.icon}"></i>`}
                </div>
                <div class="mention-help-info">
                    <div class="mention-help-name">${s.name}</div>
                    <div class="mention-help-desc">${s.description}</div>
                </div>
                ${s.score >= 100 ? `<div class="mention-help-badge" title="${Localization.t('mention.score.present')}"><i data-lucide="check-circle"></i></div>` : ''}
            </div>
        `).join('');

        if (typeof lucide !== 'undefined') lucide.createIcons();
    },

    /**
     * Affiche l'option de création rapide.
     */
    renderQuickCreate(trigger, query, activeElement) {
        let list = document.getElementById(this.containerId);
        if (!list) return;

        const rect = activeElement.getBoundingClientRect();
        const popupHeight = 60;

        let top = rect.top - popupHeight - 10;
        if (top < 0) {
            top = rect.bottom + 10;
        }

        list.style.left = `${rect.left}px`;
        list.style.top = `${top}px`;
        list.style.display = 'block';

        const typeLabel = Localization.t(MentionHelpModel.TRIGGERS[trigger].label);

        list.innerHTML = `
            <div class="mention-help-item active" onmousedown="MentionHelpViewModel.performQuickCreate(); event.preventDefault();">
                <div class="mention-help-icon"><i data-lucide="plus"></i></div>
                <div class="mention-help-info">
                    <div class="mention-help-name">${Localization.t('mention.quick_create.title', [query])}</div>
                    <div class="mention-help-desc">${Localization.t('mention.quick_create.desc', [typeLabel])}</div>
                </div>
            </div>
        `;

        if (typeof lucide !== 'undefined') lucide.createIcons();
    },

    /**
     * Met à jour l'élément sélectionné visuellement.
     */
    updateSelection(selectedIndex) {
        const items = document.querySelectorAll('.mention-help-item');
        items.forEach((item, index) => {
            if (index === selectedIndex) {
                item.classList.add('active');
                item.scrollIntoView({ block: 'nearest' });
            } else {
                item.classList.remove('active');
            }
        });
    },

    /**
     * Masque la popup.
     */
    hide() {
        const list = document.getElementById(this.containerId);
        if (list) list.style.display = 'none';
    },

    /**
     * Affiche un mini-guide statique des raccourcis.
     */
    renderGuide(activeElement) {
        let list = document.getElementById(this.containerId);
        if (!list) {
            list = document.createElement('div');
            list.id = this.containerId;
            list.className = 'mention-help-popup';
            document.body.appendChild(list);
            this.injectStyles();
        }

        const rect = activeElement.getBoundingClientRect();
        list.style.left = `${rect.left}px`;
        list.style.top = `${rect.bottom + 10}px`;
        list.style.display = 'block';

        list.innerHTML = `
            <div style="padding: 10px; font-size: 0.9rem;">
                <div style="font-weight: bold; margin-bottom: 8px; color: var(--accent-color);">${Localization.t('mention.guide.title')}</div>
                <div style="display: flex; flex-direction: column; gap: 6px;">
                    <div style="display: flex; gap: 10px;"><b>@@</b> <span>${Localization.t('mention.type.character')}</span></div>
                    <div style="display: flex; gap: 10px;"><b>##</b> <span>${Localization.t('mention.type.world')}</span></div>
                    <div style="display: flex; gap: 10px;"><b>!!</b> <span>${Localization.t('mention.type.globalnote')}</span></div>
                    <div style="display: flex; gap: 10px;"><b>??</b> <span>${Localization.t('mention.type.codex')}</span></div>
                </div>
                <div style="margin-top: 10px; font-size: 0.75rem; opacity: 0.7; border-top: 1px solid var(--border-color); padding-top: 6px;">
                    Tapez ces symboles dans l'éditeur pour lier vos fiches.
                </div>
            </div>
        `;

        // Fermer au clic ailleurs
        const closeHandler = (e) => {
            if (!list.contains(e.target)) {
                this.hide();
                document.removeEventListener('mousedown', closeHandler);
            }
        };
        setTimeout(() => document.addEventListener('mousedown', closeHandler), 10);
    },

    /**
     * Injecte les styles CSS nécessaires.
     */
    injectStyles() {
        if (document.getElementById('mentionHelpStyles')) return;

        const style = document.createElement('style');
        style.id = 'mentionHelpStyles';
        style.innerHTML = `
            .mention-help-popup {
                position: fixed;
                background: var(--bg-primary, #ffffff);
                border: 1px solid var(--border-color, #e0e0e0);
                border-radius: 12px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.25);
                width: 280px;
                max-height: 300px;
                overflow-y: auto;
                z-index: 99999;
                padding: 6px;
                pointer-events: auto;
            }

            @keyframes mentionAppear {
                from { opacity: 0; transform: translateY(5px) scale(0.98); }
                to { opacity: 1; transform: translateY(0) scale(1); }
            }

            .mention-help-item {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 10px 12px;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.2s ease;
                border: 1px solid transparent;
            }

            .mention-help-item.active {
                background: var(--accent-color, #ff8c42);
                color: white;
            }

            .mention-help-item:hover:not(.active) {
                background: var(--bg-secondary, #f8f9fa);
            }

            .mention-help-icon {
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: var(--bg-tertiary, #f0f1f3);
                border-radius: 50%;
                flex-shrink: 0;
            }

            .mention-help-item.active .mention-help-icon {
                background: rgba(255,255,255,0.2);
            }

            .mention-help-icon i {
                width: 16px;
                height: 16px;
                color: var(--text-secondary);
            }

            .mention-help-item.active .mention-help-icon i {
                color: white;
            }

            .mention-avatar {
                width: 100%;
                height: 100%;
                border-radius: 50%;
                object-fit: cover;
            }

            .mention-help-info {
                flex: 1;
                min-width: 0;
            }

            .mention-help-name {
                font-size: 0.95rem;
                font-weight: 600;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            .mention-help-desc {
                font-size: 0.75rem;
                opacity: 0.7;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            .mention-help-badge {
                color: #52c41a;
                display: flex;
                align-items: center;
            }

            .mention-help-item.active .mention-help-badge {
                color: white;
            }

            .mention-help-badge i {
                width: 14px;
                height: 14px;
            }

            /* Styles pour les mentions insérées dans l'éditeur - Style "Texte Simple" */
            .mention {
                display: inline !important;
                color: inherit;
                font-weight: inherit;
                cursor: pointer;
                user-select: none;
                transition: color 0.2s, background 0.2s;
                border-bottom: 1px dotted transparent;
            }

            .mention:hover {
                color: var(--accent-color, #ff8c42);
                border-bottom: 1px dotted var(--accent-color, #ff8c42);
                background: rgba(255, 140, 66, 0.05);
            }
        `;
        document.head.appendChild(style);
    }
};
