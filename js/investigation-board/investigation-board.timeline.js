/**
 * [MVVM : Investigation Timeline View]
 * Visualisation chronologique des révélations d'indices.
 */

window.InvestigationTimelineView = {
    render: function (container) {
        const activeCase = InvestigationStore.getActiveCase();
        // Use scenes with context to get Act/Chapter breadcrumbs
        const scenes = InvestigationStore.getScenesWithContext();
        const facts = InvestigationStore.getFacts().filter(f => f.caseId === activeCase?.id);
        const mode = InvestigationStore.state.timelineMode || 'default';

        if (!activeCase) {
            container.innerHTML = `<div class="empty-view">${Localization.t('investigation.timeline.select_case')}</div>`;
            return;
        }

        // Collect ALL steps from ALL facts to show the full evolution
        const allSteps = [];
        facts.forEach(fact => {
            if (fact.timeline && fact.timeline.length > 0) {
                fact.timeline.forEach(step => {
                    allSteps.push({
                        ...step,
                        factLabel: fact.label,
                        factType: fact.type,
                        factId: fact.id
                    });
                });
            }
        });

        // Group steps by scene
        const sceneGroups = new Map();
        allSteps.forEach(step => {
            const sid = String(step.sceneId);
            if (!sceneGroups.has(sid)) sceneGroups.set(sid, []);
            sceneGroups.get(sid).push(step);
        });

        // Filter and sort scenes that have steps, following project order
        const sortedScenes = scenes.filter(s => sceneGroups.has(String(s.id || s.uid)));

        container.innerHTML = `
            <div class="investigation-timeline timeline-${mode}">
                <div class="timeline-header">
                    <h3>${Localization.t('investigation.timeline.title')}</h3>
                    <p>${Localization.t('investigation.timeline.desc')}</p>
                </div>
                
                <div class="timeline-content">
                    ${sortedScenes.length === 0 ? `
                        <div class="empty-timeline">
                            <i data-lucide="clock"></i>
                            <p>${Localization.t('investigation.timeline.empty')}</p>
                            <button class="btn btn-secondary" onclick="InvestigationStore.setCurrentView('registry')">
                                ${Localization.t('investigation.timeline.action_manage')}
                            </button>
                        </div>
                    ` : (mode === 'compact' ? this.renderTimelineMatrix(sortedScenes, facts) : `
                        <div class="timeline-path">
                            <div class="timeline-vertical-line"></div>
                            ${sortedScenes.map((scene, idx) => this.renderTimelineScene(scene, sceneGroups.get(String(scene.id || scene.uid)), idx, mode)).join('')}
                        </div>
                    `)}
                </div>
            </div>
        `;

        if (typeof lucide !== 'undefined') lucide.createIcons();
    },

    /**
     * Renders a matrix/table view of the timeline.
     * Columns: Investigation Items
     * Rows: Scenes
     */
    renderTimelineMatrix: function (scenes, facts) {
        if (facts.length === 0) return '';

        const characters = InvestigationStore.getCharacters();

        // Group scenes by Act for visual headers
        const acts = new Map();
        scenes.forEach(scene => {
            const actId = scene.actId || 'discovery';
            if (!acts.has(actId)) acts.set(actId, { title: scene.actTitle || Localization.t('investigation.timeline.discovery'), scenes: [] });
            acts.get(actId).scenes.push(scene);
        });

        return `
            <div class="timeline-matrix-wrapper">
                <table class="timeline-matrix-table">
                    <thead>
                        <tr>
                            <th class="sticky-col first-col">${Localization.t('investigation.common.scenes')}</th>
                            ${facts.map(fact => `
                                <th class="fact-col-header" title="${fact.description || ''}">
                                    <div class="fact-header-content">
                                        <i data-lucide="${this.getFactIcon(fact.type)}"></i>
                                        <span>${fact.label}</span>
                                    </div>
                                </th>
                            `).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${Array.from(acts.values()).map(act => `
                            <tr class="act-separator">
                                <td colspan="${facts.length + 1}">
                                    <div class="act-separator-label">
                                        <i data-lucide="layers"></i>
                                        ${act.title}
                                    </div>
                                </td>
                            </tr>
                            ${act.scenes.map(scene => `
                                <tr>
                                    <td class="sticky-col scene-row-header">
                                        <div class="scene-meta">
                                            <span class="meta-chapter">${scene.chapterTitle || '...'}</span>
                                        </div>
                                        <div class="scene-title">${scene.title}</div>
                                    </td>
                                    ${facts.map(fact => {
            const step = (fact.timeline || []).find(s => String(s.sceneId) === String(scene.id || scene.uid));
            if (!step) return '<td class="empty-cell"></td>';

            const character = characters.find(c => c.id == step.characterId);
            const statusLabel = Localization.t('investigation.evolution.status.' + step.state) || step.state;

            return `
                                            <td class="step-cell status-${step.state}" onclick="InvestigationRegistryView.editFact('${fact.id}')">
                                                <div class="step-cell-content" title="${step.description}">
                                                    <div class="step-status-tag">${statusLabel}</div>
                                                    <div class="step-who">${character ? character.name : Localization.t('investigation.evolution.no_char')}</div>
                                                    <div class="step-comment">${step.description}</div>
                                                </div>
                                            </td>
                                        `;
        }).join('')}
                                </tr>
                            `).join('')}
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    renderTimelineScene: function (scene, steps, index, mode) {
        // Build breadcrumb: Act > Chapter > Scene
        const sceneLabel = `${scene.actTitle} > ${scene.chapterTitle} > ${scene.title}`;
        const characters = InvestigationStore.getCharacters();

        return `
            <div class="timeline-scene-node" style="animation-delay: ${index * 0.1}s">
                <div class="scene-node-marker"></div>
                <div class="scene-node-content">
                    <div class="scene-node-header">
                        <div class="scene-node-breadcrumb">
                            <span class="breadcrumb-item act">${scene.actTitle || Localization.t('investigation.timeline.discovery')}</span>
                            <i data-lucide="chevron-right"></i>
                            <span class="breadcrumb-item chapter">${scene.chapterTitle || '...'}</span>
                            <i data-lucide="chevron-right"></i>
                            <span class="breadcrumb-item scene">${scene.title}</span>
                        </div>
                    </div>
                    <div class="scene-node-steps">
                        ${steps.map(step => {
            const character = characters.find(c => c.id == step.characterId);
            const charName = character ? character.name : null;
            const statusLabel = Localization.t('investigation.evolution.status.' + step.state) || step.state;

            return `
                                <div class="timeline-step-card status-${step.state}" onclick="InvestigationRegistryView.editFact('${step.factId}')">
                                    <div class="step-card-header">
                                        <div class="step-fact-info">
                                            <i data-lucide="${this.getFactIcon(step.factType)}"></i>
                                            <strong>${step.factLabel}</strong>
                                        </div>
                                        <div class="step-card-meta">
                                            ${charName && mode === 'compact' ? `<span class="compact-actor">${charName}</span>` : ''}
                                            <span class="status-pill status-${step.state}">${statusLabel}</span>
                                        </div>
                                    </div>
                                    ${mode !== 'compact' ? `
                                    <div class="step-card-body">
                                        ${charName ? `<div class="step-actor"><strong>${Localization.t('investigation.evolution.step.who')}</strong> ${charName}</div>` : ''}
                                        <div class="step-desc">${step.description}</div>
                                    </div>
                                    ` : `
                                    <div class="step-card-body compact">
                                        <div class="step-desc truncate">${step.description}</div>
                                    </div>
                                    `}
                                    <div class="step-card-actions">
                                         <button class="btn-icon-xs" onclick="event.stopPropagation(); InvestigationRegistryView.openEditTimelineStep('${step.factId}', '${step.id}')">
                                            <i data-lucide="edit-2"></i>
                                        </button>
                                         <button class="btn-icon-xs danger" onclick="event.stopPropagation(); InvestigationRegistryView.deleteTimelineStep('${step.factId}', '${step.id}')">
                                            <i data-lucide="trash-2"></i>
                                        </button>
                                    </div>
                                </div>
                            `;
        }).join('')}
                    </div>
                </div>
            </div>
        `;
    },

    getFactIcon: function (type) {
        const typeIcons = {
            clue: 'search',
            event: 'calendar',
            testimony: 'message-square',
            object: 'package',
            crime: 'skull',
            disappearance: 'user-x',
            coma: 'activity'
        };
        return typeIcons[type] || 'file-text';
    }
};
