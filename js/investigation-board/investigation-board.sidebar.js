/**
 * Investigation Sidebar View Manager
 * Handles the display of investigation items linked to the current scene in the Structure view.
 */
const InvestigationSidebarUI = {
    activeSceneId: null,
    selectedIncidentId: null,

    /**
     * Toggles the investigation sidebar visibility.
     */
    toggleSidebar: function () {
        const sidebar = document.getElementById('sidebarInvestigation');
        const toolBtn = document.getElementById('toolInvestigationBtn');
        const sidebarBtn = document.getElementById('sidebarInvestigationBtn');
        if (!sidebar) return;

        const isHidden = sidebar.classList.toggle('hidden');
        if (!isHidden && typeof currentSceneId !== 'undefined' && currentSceneId) {
            this.renderSidebar(currentSceneId);
            if (toolBtn) toolBtn.classList.add('active');
            if (sidebarBtn) sidebarBtn.classList.add('active');
        } else {
            if (toolBtn) toolBtn.classList.remove('active');
            if (sidebarBtn) sidebarBtn.classList.remove('active');
        }

        // Refresh icons
        if (typeof lucide !== 'undefined') lucide.createIcons();
    },

    /**
     * Renders the investigation cards for a specific scene.
     * @param {string|number} sceneId - The ID of the scene to display items for.
     */
    renderSidebar: function (sceneId) {
        const container = document.getElementById('investigationSidebarList');
        const sceneNameEl = document.getElementById('investigationSidebarSceneName');
        if (!container) return;

        this.activeSceneId = sceneId;

        // Ensure store is initialized (data loaded from project)
        if (typeof InvestigationStore !== 'undefined') {
            InvestigationStore.init();
        }

        // Update scene name in header
        let foundScene = null;
        if (typeof project !== 'undefined') {
            project.acts.forEach(a => {
                a.chapters.forEach(c => {
                    const s = c.scenes.find(sc => sc.id == sceneId);
                    if (s) foundScene = s;
                });
            });
        }

        if (sceneNameEl) {
            sceneNameEl.textContent = foundScene ? foundScene.title : (Localization.t('sidebar.no_scene') || 'Aucune scène sélectionnée');
        }

        if (!sceneId) {
            container.innerHTML = `<div class="empty-state">${Localization.t('sidebar.empty.select_scene') || 'Sélectionnez une scène pour voir son enquête.'}</div>`;
            return;
        }

        if (typeof InvestigationStore === 'undefined') {
            container.innerHTML = '<div class="empty-state">Le module d’enquête n’est pas disponible.</div>';
            return;
        }

        const facts = InvestigationStore.getFacts();
        const allCharacters = InvestigationStore.getCharacters();
        const allLocations = InvestigationStore.getLocations();

        // 1. Render MMO Section (New)
        const mmoHTML = this.renderMMOSection(sceneId, allCharacters);

        const cardsHTML = [];

        facts.forEach(fact => {
            if (!fact.timeline || fact.timeline.length === 0) return;

            // Filter steps for this scene
            const sceneSteps = fact.timeline.filter(step => step.sceneId == sceneId);

            sceneSteps.forEach(step => {
                const typeLabel = Localization.t('investigation.type.' + fact.type) || fact.type;
                const typeIcons = {
                    clue: 'search',
                    red_herring: 'megaphone-off',
                    event: 'calendar',
                    testimony: 'message-square',
                    object: 'package',
                    rumor: 'message-circle',
                    crime: 'skull',
                    disappearance: 'user-x',
                    coma: 'activity'
                };
                const icon = typeIcons[fact.type] || 'file-text';
                const statusLabel = step.status ? (Localization.t('investigation.evolution.status.' + step.status) || step.status) : '';

                // Extra data for the card
                const relatedChars = (fact.relatedCharacterIds || []).map(id => allCharacters.find(c => c.id == id)).filter(Boolean);
                const relatedLoc = fact.relatedLocationIds?.[0] ? allLocations.find(l => l.id == fact.relatedLocationIds[0]) : null;
                const truthLabel = Localization.t('investigation.truth.' + fact.truthStatus);

                cardsHTML.push(`
                    <div class="sidebar-plot-card investigation-sidebar-card ${fact.isHidden ? 'is-secret' : ''}" onclick="InvestigationSidebarUI.openFactModal('${fact.id}')">
                        <div class="sidebar-plot-card-line">
                            <i data-lucide="${icon}" style="width: 12px; height: 12px; vertical-align: middle; margin-right: 4px"></i>
                            ${typeLabel} ${statusLabel ? `• ${statusLabel}` : ''}
                            ${fact.isHidden ? '<i data-lucide="shield-check" class="secret-icon-sidebar" title="Secret" style="float: right; color: var(--primary-color)"></i>' : ''}
                        </div>
                        
                        <div class="sidebar-plot-card-title">
                            ${fact.label}
                        </div>
                        
                        <div class="sidebar-plot-card-content">${step.description || ''}</div>
                        
                        <div class="sidebar-investigation-meta">
                            <div class="meta-row">
                                <span class="status-pill-compact status-${fact.truthStatus}">${truthLabel}</span>
                                ${relatedLoc ? `
                                    <span class="meta-location">
                                        <i data-lucide="map-pin"></i> ${relatedLoc.name}
                                    </span>
                                ` : ''}
                            </div>
                            
                            ${relatedChars.length > 0 ? `
                                <div class="meta-characters">
                                    <i data-lucide="users"></i>
                                    ${relatedChars.map(c => `<span class="char-tag-compact">${c.name}</span>`).join('')}
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `);
            });
        });

        if (cardsHTML.length === 0 && !mmoHTML) {
            container.innerHTML = `<div class="empty-state">${Localization.t('investigation.timeline.empty') || 'Aucun item d’enquête lié à cette scène.'}</div>`;
        } else {
            container.innerHTML = (mmoHTML || '') + cardsHTML.join('');
        }

        if (typeof lucide !== 'undefined') lucide.createIcons();
    },

    /**
     * Renders a quick-access MMO section for characters in the scene.
     */
    renderMMOSection: function (sceneId, allCharacters) {
        if (!sceneId || typeof project === 'undefined') return '';

        // Find characters linked to this scene
        let sceneCharactersIds = [];
        project.acts.forEach(a => {
            a.chapters.forEach(c => {
                const s = c.scenes.find(sc => sc.id == sceneId);
                if (s) {
                    if (s.linkedCharacters) {
                        sceneCharactersIds = [...new Set([...sceneCharactersIds, ...s.linkedCharacters])];
                    }
                    if (s.confirmedPresentCharacters) {
                        sceneCharactersIds = [...new Set([...sceneCharactersIds, ...s.confirmedPresentCharacters])];
                    }
                }
            });
        });

        if (sceneCharactersIds.length === 0) return '';

        // All facts from registry
        const potentialIncidents = InvestigationStore.getFacts();

        if (potentialIncidents.length === 0) return '';

        // Determine which incident to show
        let primaryIncident = null;
        if (this.selectedIncidentId) {
            primaryIncident = potentialIncidents.find(f => f.id === this.selectedIncidentId);
        }

        if (!primaryIncident) {
            primaryIncident = potentialIncidents.find(f => ['crime', 'body', 'disappearance', 'event'].includes(f.type)) || potentialIncidents[0];
        }

        if (!primaryIncident) return '';

        let html = `
            <div class="sidebar-section-header mmo-sidebar-header">
                <div class="mmo-header-title">
                    <i data-lucide="users"></i>
                    <span data-i18n="investigation.mmo.characters_in_scene">${Localization.t('investigation.mmo.characters_in_scene') || 'Personnages & MMO'}</span>
                </div>
                
                <select class="mmo-incident-selector-sidebar" 
                        onchange="InvestigationSidebarUI.setMMOIncident(this.value)"
                        title="${Localization.t('investigation.mmo.selector_label') || 'Sujet de l\'enquête'}">
                    ${potentialIncidents.map(inc => `
                        <option value="${inc.id}" ${inc.id === primaryIncident.id ? 'selected' : ''}>
                            ${inc.label}
                        </option>
                    `).join('')}
                </select>
            </div>
            <div class="sidebar-mmo-container">
        `;

        sceneCharactersIds.forEach(charId => {
            const char = allCharacters.find(c => c.id == charId);
            if (!char) return;

            const link = InvestigationStore.getSuspectLinkAtScene(charId, primaryIncident.id, sceneId) || {};
            const motive = (link.motive && link.motive.level) || 0;
            const means = (link.means && link.means.level) || 0;
            const opportunity = (link.opportunity && link.opportunity.level) || 0;

            html += `
                <div class="sidebar-mmo-card">
                    <div class="mmo-card-header">
                        <div class="mmo-char-avatar" style="background-color: ${char.color || 'var(--primary-color)'}">
                            ${char.name.charAt(0)}
                        </div>
                        <span class="mmo-char-name">${char.name}</span>
                        <button class="mmo-edit-btn" onclick="InvestigationMMOView.editSpecificMMO('${char.id}', '${primaryIncident.id}', '${sceneId}')">
                            <i data-lucide="edit-3"></i>
                        </button>
                    </div>
                    <div class="mmo-quick-bars">
                        ${this.renderMiniBar('motive', motive, charId, primaryIncident.id, sceneId)}
                        ${this.renderMiniBar('means', means, charId, primaryIncident.id, sceneId)}
                        ${this.renderMiniBar('opportunity', opportunity, charId, primaryIncident.id, sceneId)}
                    </div>
                </div>
            `;
        });

        html += `</div><div class="sidebar-divider"></div>`;
        return html;
    },

    renderMiniBar: function (type, value, charId, incidentId, sceneId) {
        const labels = { motive: 'M', means: 'M', opportunity: 'O' };
        const fullLabels = { motive: 'Mobile', means: 'Moyens', opportunity: 'Opportunité' };

        return `
            <div class="mmo-mini-row" title="${fullLabels[type]} : ${value}/10">
                <span class="mmo-mini-label">${labels[type]}</span>
                <div class="mmo-mini-track" onclick="InvestigationSidebarUI.quickUpdateMMO('${charId}', '${incidentId}', '${sceneId}', '${type}', event)">
                    <div class="mmo-mini-fill ${type}" style="width: ${value * 10}%"></div>
                </div>
                <span class="mmo-mini-val">${value}</span>
            </div>
        `;
    },

    quickUpdateMMO: function (charId, incidentId, sceneId, type, event) {
        event.stopPropagation();
        const rect = event.currentTarget.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const width = rect.width;
        const newLevel = Math.max(0, Math.min(10, Math.round((x / width) * 10)));

        // Get current link to preserve other values and descriptions
        const currentLink = InvestigationStore.getSuspectLinkAtScene(charId, incidentId, sceneId) || {};

        const payload = {
            suspectId: charId,
            victimId: incidentId,
            sceneId: sceneId || null
        };

        // Initialize fields from current link
        ['motive', 'means', 'opportunity'].forEach(key => {
            const val = currentLink[key];
            if (val) {
                payload[key] = { level: val.level, description: val.description || '' };
            }
        });

        // Update target field
        payload[type] = {
            level: newLevel,
            description: (currentLink[type] && currentLink[type].description) || ''
        };

        InvestigationStore.updateSuspectLink(payload);

        // Also refresh the main MMO view if it's open (in background)
        if (window.InvestigationMMOView && typeof window.InvestigationMMOView.render === 'function') {
            const container = document.querySelector('.investigation-mmo');
            if (container) window.InvestigationMMOView.render(container);
        }
    },

    /**
     * Opens the edit modal for a specific fact.
     * @param {string} factId - The ID of the fact to edit.
     */
    openFactModal: function (factId) {
        if (typeof InvestigationRegistryView !== 'undefined' && InvestigationRegistryView.editFact) {
            InvestigationRegistryView.editFact(factId);
        } else {
            console.error("InvestigationRegistryView.editFact is not available");
        }
    },

    /**
     * Changes the active incident for MMO display.
     */
    setMMOIncident: function (incidentId) {
        this.selectedIncidentId = incidentId;
        if (this.activeSceneId) {
            this.renderSidebar(this.activeSceneId);
        }
    }
};

// Hook into scene changes where possible, though main call is in 00.app.view.js
window.addEventListener('sceneSelected', (e) => {
    const sceneId = e.detail?.sceneId;
    if (!sceneId) return;
    const sidebar = document.getElementById('sidebarInvestigation');
    if (sidebar && !sidebar.classList.contains('hidden')) {
        InvestigationSidebarUI.renderSidebar(sceneId);
    }
});
