/**
 * [MVVM : AutoDetect View]
 * Logique de rendu de l'interface utilisateur.
 */

const AutoDetectView = {
    /**
     * Rafraîchit le panneau des liens.
     */
    refresh() {
        const linksPanel = document.getElementById('linksPanel');
        if (!linksPanel) return;

        // Gestion de la nouvelle sidebar
        if (linksPanel.classList.contains('links-panel-sidebar')) {
            this.renderSidebar();
            return;
        }

        const scene = AutoDetectRepository.getCurrentScene();
        if (!scene) return;

        const flexDivs = linksPanel.querySelectorAll('[style*="flex: 1"]');

        // 1. PERSONNAGES
        if (flexDivs.length >= 1) {
            this.renderCharactersZone(flexDivs[0], scene);
        }

        // 2. LIEUX/ÉLÉMENTS
        if (flexDivs.length >= 2) {
            this.renderElementsZone(flexDivs[1], scene);
        }

        if (typeof lucide !== 'undefined') lucide.createIcons();
    },

    /**
     * Rendu des personnages dans le panneau classique.
     */
    renderCharactersZone(container, scene) {
        const quickLinks = container.querySelector('.quick-links');
        if (!quickLinks) return;

        const allCharacters = AutoDetectRepository.getCharacters();
        const confirmedIds = scene.confirmedPresentCharacters || [];
        const suggestedIds = scene.suggestedCharacters || [];
        const absentIds = scene.confirmedAbsentCharacters || [];

        const presentList = allCharacters.filter(c => confirmedIds.includes(c.id));
        const suggestedList = allCharacters.filter(c => suggestedIds.includes(c.id));
        const absentList = allCharacters.filter(c => absentIds.includes(c.id));

        let html = '';

        // ZONE 1 : PRÉSENTS
        html += `<h4 style="margin: 0 0 8px 0; font-size: 0.8rem; opacity: 0.8; text-align: left;"><i data-lucide="check-circle" style="width: 14px; height: 14px; vertical-align: -2px; margin-right: 4px;"></i> ${Localization.t('autodetect.chars.confirmed_present')}</h4>`;
        if (presentList.length > 0) {
            html += presentList.map(char => `
                <div class="link-item present" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        ${this.getAvatarHTML(char)}
                        <span>${char.name}</span>
                    </div>
                    <button onclick="AutoDetectViewModel.confirmAbsence(${char.id})" title="${Localization.t('autodetect.chars.remove_title')}" class="btn-icon">
                        <i data-lucide="x" style="width: 16px; height: 16px;"></i>
                    </button>
                </div>
            `).join('');
        } else {
            html += `<p class="text-muted small" style="font-size: 0.75rem; margin-bottom: 12px; opacity: 0.7;">${Localization.t('autodetect.chars.none_present')}</p>`;
        }

        // ZONE 2 : SUGGÉRÉS
        html += `<h4 style="margin: 12px 0 8px 0; font-size: 0.8rem; opacity: 0.8; color: var(--accent-color); text-align: left;"><i data-lucide="help-circle" style="width: 14px; height: 14px; vertical-align: -2px; margin-right: 4px;"></i> ${Localization.t('autodetect.chars.suggestions')}</h4>`;
        if (suggestedList.length > 0) {
            html += suggestedList.map(char => `
                <div class="link-item suggested" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        ${this.getAvatarHTML(char)}
                        <span>${char.name}</span>
                    </div>
                    <div style="display: flex; gap: 4px;">
                        <button onclick="AutoDetectViewModel.confirmAbsence(${char.id})" title="${Localization.t('autodetect.chars.ignore_title')}" class="btn-icon">
                            <i data-lucide="x" style="width: 16px; height: 16px;"></i>
                        </button>
                        <button onclick="AutoDetectViewModel.confirmPresence(${char.id})" title="${Localization.t('autodetect.chars.validate_title')}" class="btn-icon">
                            <i data-lucide="check" style="width: 16px; height: 16px;"></i>
                        </button>
                    </div>
                </div>
            `).join('');
        } else {
            html += `<p class="text-muted small" style="font-size: 0.75rem; margin-bottom: 12px; opacity: 0.7;">${Localization.t('autodetect.chars.none_suggested')}</p>`;
        }

        // ZONE 3 : ABSENTS
        html += `<h4 style="margin: 12px 0 8px 0; font-size: 0.8rem; opacity: 0.8; text-align: left;"><i data-lucide="x-circle" style="width: 14px; height: 14px; vertical-align: -2px; margin-right: 4px;"></i> ${Localization.t('autodetect.chars.confirmed_absent')}</h4>`;
        if (absentList.length > 0) {
            html += absentList.map(char => `
                <div class="link-item absent" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        ${this.getAvatarHTML(char)}
                        <span style="text-decoration: line-through;">${char.name}</span>
                    </div>
                    <button onclick="AutoDetectViewModel.confirmPresence(${char.id})" title="${Localization.t('autodetect.chars.restore_title')}" class="btn-icon">
                        <i data-lucide="rotate-ccw" style="width: 16px; height: 16px;"></i>
                    </button>
                </div>
            `).join('');
        } else {
            html += `<p class="text-muted small" style="font-size: 0.75rem; margin-bottom: 12px; opacity: 0.7;">${Localization.t('autodetect.chars.none_absent')}</p>`;
        }

        // Bouton d'ajout manuel
        html += `
            <div style="margin-top: 10px; text-align: center;">
                <button class="btn btn-small" onclick="openCharacterLinker(currentActId, currentChapterId, currentSceneId)" style="font-size: 0.75rem; padding: 4px 8px; width: 100%;">
                    <i data-lucide="plus" style="width: 12px; height: 12px; vertical-align: middle; margin-right: 4px;"></i> ${Localization.t('autodetect.btn.link_manual')}
                </button>
            </div>
        `;

        quickLinks.innerHTML = html;
    },

    /**
     * Rendu des éléments d'univers dans le panneau classique.
     */
    renderElementsZone(container, scene) {
        const quickLinks = container.querySelector('.quick-links');
        if (!quickLinks) return;

        const linkedIds = scene.linkedElements || [];
        const allElements = AutoDetectRepository.getWorldElements();
        const linkedElements = allElements.filter(e => linkedIds.includes(e.id));

        let html = `<h4 style="margin: 0 0 8px 0; font-size: 0.8rem; opacity: 0.8; text-align: left;"><i data-lucide="globe" style="width:14px;height:14px;vertical-align:-2px;margin-right:4px;"></i> ${Localization.t('autodetect.elements.title')}</h4>`;

        if (linkedElements.length > 0) {
            html += linkedElements.map(elem => {
                const iconName = this.getElementIcon(elem.type);
                return `
                    <div class="link-item present" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                        <div style="display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0;">
                            <i data-lucide="${iconName}" style="width: 20px; height: 20px;"></i>
                            <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${elem.name} (${elem.type})">${elem.name}</span>
                        </div>
                        <button onclick="toggleElementInScene(currentActId, currentChapterId, currentSceneId, ${elem.id}); openScene(currentActId, currentChapterId, currentSceneId);" title="${Localization.t('autodetect.elements.unlink_title')}" class="btn-icon">
                            <i data-lucide="x" style="width: 16px; height: 16px;"></i>
                        </button>
                    </div>
                `;
            }).join('');
        } else {
            html += `<p class="text-muted small" style="font-size: 0.75rem; margin-bottom: 12px; opacity: 0.7;">${Localization.t('autodetect.elements.none_linked')}</p>`;
        }

        html += `
            <div style="margin-top: 10px; text-align: center;">
                <button class="btn btn-small" onclick="openElementLinker(currentActId, currentChapterId, currentSceneId)" style="font-size: 0.75rem; padding: 4px 8px; width: 100%;">
                    <i data-lucide="plus" style="width: 12px; height: 12px; vertical-align: middle; margin-right: 4px;"></i> ${Localization.t('autodetect.btn.link_manual')}
                </button>
            </div>
        `;

        quickLinks.innerHTML = html;
    },

    /**
     * Rendu du panneau des liens en mode sidebar.
     */
    renderSidebar() {
        const content = document.getElementById('linksPanelContent');
        if (!content) return;

        const scene = AutoDetectRepository.getCurrentScene();
        if (!scene) {
            content.innerHTML = `<p style="text-align: center; color: var(--text-muted); padding: 2rem;">${Localization.t('empty.select_scene')}</p>`;
            return;
        }

        let html = '';

        // Section Personnages
        html += '<div style="margin-bottom: 1.5rem;">';
        html += `<div class="quick-links-title" style="font-size: 0.85rem; font-weight: 600; margin-bottom: 0.75rem; color: var(--text-muted);"><i data-lucide="users" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i> ${Localization.t('nav.characters')}</div>`;

        const allCharacters = AutoDetectRepository.getCharacters();
        const confirmedIds = scene.confirmedPresentCharacters || [];
        const suggestedIds = scene.suggestedCharacters || [];
        const absentIds = scene.confirmedAbsentCharacters || [];

        const presentList = allCharacters.filter(c => confirmedIds.includes(c.id));
        const suggestedList = allCharacters.filter(c => suggestedIds.includes(c.id));
        const absentList = allCharacters.filter(c => absentIds.includes(c.id));

        // Confirmés
        html += `<h4 style="margin: 0 0 8px 0; font-size: 0.8rem; opacity: 0.8;"><i data-lucide="check-circle" style="width: 14px; height: 14px; vertical-align: -2px; margin-right: 4px;"></i> ${Localization.t('autodetect.chars.confirmed_present')}</h4>`;
        if (presentList.length > 0) {
            html += presentList.map(char => `
                <div class="link-item present" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        ${this.getAvatarHTML(char)}
                        <span>${char.name}</span>
                    </div>
                    <button onclick="AutoDetectViewModel.confirmAbsence(${char.id})" title="${Localization.t('autodetect.chars.remove_title')}" class="btn-icon">
                        <i data-lucide="x" style="width: 16px; height: 16px;"></i>
                    </button>
                </div>
            `).join('');
        } else {
            html += `<p class="text-muted small" style="font-size: 0.75rem; margin-bottom: 12px; opacity: 0.7;">${Localization.t('autodetect.chars.none_present')}</p>`;
        }

        // Suggestions
        html += `<h4 style="margin: 12px 0 8px 0; font-size: 0.8rem; opacity: 0.8; color: var(--accent-color);"><i data-lucide="help-circle" style="width: 14px; height: 14px; vertical-align: -2px; margin-right: 4px;"></i> ${Localization.t('autodetect.chars.suggestions')}</h4>`;
        if (suggestedList.length > 0) {
            html += suggestedList.map(char => `
                <div class="link-item suggested" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        ${this.getAvatarHTML(char)}
                        <span>${char.name}</span>
                    </div>
                    <div style="display: flex; gap: 4px;">
                        <button onclick="AutoDetectViewModel.confirmAbsence(${char.id})" title="${Localization.t('autodetect.chars.ignore_title')}" class="btn-icon">
                            <i data-lucide="x" style="width: 16px; height: 16px;"></i>
                        </button>
                        <button onclick="AutoDetectViewModel.confirmPresence(${char.id})" title="${Localization.t('autodetect.chars.validate_title')}" class="btn-icon">
                            <i data-lucide="check" style="width: 16px; height: 16px;"></i>
                        </button>
                    </div>
                </div>
            `).join('');
        } else {
            html += `<p class="text-muted small" style="font-size: 0.75rem; margin-bottom: 12px; opacity: 0.7;">${Localization.t('autodetect.chars.none_suggested')}</p>`;
        }

        // Absents
        html += `<h4 style="margin: 12px 0 8px 0; font-size: 0.8rem; opacity: 0.8;"><i data-lucide="x-circle" style="width: 14px; height: 14px; vertical-align: -2px; margin-right: 4px;"></i> ${Localization.t('autodetect.chars.confirmed_absent')}</h4>`;
        if (absentList.length > 0) {
            html += absentList.map(char => `
                <div class="link-item absent" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        ${this.getAvatarHTML(char)}
                        <span style="text-decoration: line-through;">${char.name}</span>
                    </div>
                    <button onclick="AutoDetectViewModel.confirmPresence(${char.id})" title="${Localization.t('autodetect.chars.restore_title')}" class="btn-icon">
                        <i data-lucide="rotate-ccw" style="width: 16px; height: 16px;"></i>
                    </button>
                </div>
            `).join('');
        } else {
            html += `<p class="text-muted small" style="font-size: 0.75rem; margin-bottom: 12px; opacity: 0.7;">${Localization.t('autodetect.chars.none_ignored')}</p>`;
        }
        html += '</div>';

        // SECTION 2 : UNIVERS (Simplifiée pour sidebar)
        html += '<div style="margin-bottom: 1.5rem;">';
        html += `<div class="quick-links-title" style="font-size: 0.85rem; font-weight: 600; margin-bottom: 0.75rem; color: var(--text-muted);"><i data-lucide="globe" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i> ${Localization.t('nav.world')}</div>`;
        const locationLinks = (scene.locations || []).map(loc => {
            const locData = project.locations ? project.locations.find(l => l.id === loc.id) : null;
            return locData ? `<div class="link-item" style="margin-bottom: 4px;"><i data-lucide="map-pin" style="width:12px;height:12px;vertical-align:middle;margin-right:4px;"></i>${locData.name}</div>` : '';
        }).join('');
        html += locationLinks || `<p class="text-muted small" style="font-size: 0.75rem; opacity: 0.7;">${Localization.t('autodetect.elements.none_locations')}</p>`;
        html += '</div>';

        // SECTION 3 : TIMELINE
        html += '<div>';
        html += `<div class="quick-links-title" style="font-size: 0.85rem; font-weight: 600; margin-bottom: 0.75rem; color: var(--text-muted);"><i data-lucide="train-track" style="width:14px;height:14px;vertical-align:middle;margin-right:4px;"></i> ${Localization.t('nav.timeline')}</div>`;
        const eventLinks = (scene.events || []).map(ev => {
            const evData = project.events ? project.events.find(e => e.id === ev.id) : null;
            return evData ? `<div class="link-item" style="margin-bottom: 4px;"><i data-lucide="calendar" style="width:12px;height:12px;vertical-align:middle;margin-right:4px;"></i>${evData.title}</div>` : '';
        }).join('');
        html += eventLinks || `<p class="text-muted small" style="font-size: 0.75rem; opacity: 0.7;">${Localization.t('autodetect.timeline.none_events')}</p>`;
        html += '</div>';

        content.innerHTML = html;

        setTimeout(() => {
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }, 10);
    },

    /**
     * Helper pour générer l'avatar HTML.
     */
    getAvatarHTML(char) {
        if (char.avatarImage) {
            return `<img src="${char.avatarImage}" style="width: 20px; height: 20px; border-radius: 50%; object-fit: cover;">`;
        } else {
            return `<i data-lucide="user" style="width: 16px; height: 16px;"></i>`;
        }
    },

    /**
     * Helper pour déterminer l'icône d'un élément d'univers.
     */
    getElementIcon(type) {
        if (!type) return 'globe';
        switch (type.toLowerCase()) {
            case 'lieu':
            case 'place':
                return 'map-pin';
            case 'objet':
            case 'artifact':
                return 'box';
            case 'organisation':
            case 'group':
            case 'organization':
                return 'landmark';
            case 'concept':
            case 'idée':
                return 'lightbulb';
            default:
                return 'globe';
        }
    },

    /**
     * Utilitaire de formatage de texte (utilisé par la toolbar).
     */
    formatText(command, value = null) {
        let selector = '.editor-textarea';
        if (typeof currentSceneId !== 'undefined' && currentSceneId) {
            selector = `.editor-textarea[data-scene-id="${currentSceneId}"]`;
        }

        const editor = document.querySelector(selector);
        if (editor) editor.focus();

        document.execCommand(command, false, value);
    }
};
