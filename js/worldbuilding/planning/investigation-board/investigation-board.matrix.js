/**
 * [MVVM : Investigation Matrix View]
 * Matrice croisant Personnages (Lignes) et Scènes (Colonnes)
 * pour visualiser l'état de connaissance d'un fait spécifique.
 */

const InvestigationMatrixView = {
    render: function (container) {
        // Récupération des données réelles via le Store
        const characters = InvestigationStore.getCharacters();
        const scenes = InvestigationStore.getScenesWithContext();
        const facts = InvestigationStore.getFacts();

        // Si aucune donnée, afficher un message d'aide
        if (characters.length === 0 || scenes.length === 0) {
            container.innerHTML = `
                <div class="matrix-empty">
                    <p>${Localization.t('investigation.matrix.no_data')}</p>
                </div>
            `;
            return;
        }

        // --- FILTERS ---
        if (typeof InvestigationStore.state.filters.hideIgnorant === 'undefined') InvestigationStore.state.filters.hideIgnorant = false;
        if (typeof InvestigationStore.state.filters.showAllFacts === 'undefined') InvestigationStore.state.filters.showAllFacts = false;

        const hideIgnorant = InvestigationStore.state.filters.hideIgnorant;
        const showAllFacts = InvestigationStore.state.filters.showAllFacts;

        // Ensure we have a selected fact for single mode
        const currentFactId = InvestigationStore.state.filters.factId || (facts[0] ? facts[0].id : null);

        // --- FILTERING CHARACTERS ---
        let displayCharacters = characters;
        if (hideIgnorant) {
            displayCharacters = characters.filter(char => {
                if (showAllFacts) {
                    // In "Show All", keep character if they have ANY knowledge about ANY fact
                    return InvestigationStore.state.knowledge.some(k =>
                        k.characterId == char.id && k.state !== 'ignorant'
                    );
                } else {
                    // Regular mode: keep if they know about CURRENT fact
                    return InvestigationStore.state.knowledge.some(k =>
                        k.characterId == char.id && k.factId == currentFactId && k.state !== 'ignorant'
                    );
                }
            });
        }

        container.innerHTML = `
            <div class="investigation-matrix ${showAllFacts ? 'mode-detailed' : ''}">
                <div class="matrix-header-controls">
                    <div class="matrix-title-group">
                        <span class="matrix-label">${Localization.t('investigation.matrix.propagation')}</span>
                        <div class="enhanced-select-wrapper" ${showAllFacts ? 'style="opacity:0.5; pointer-events:none;"' : ''}>
                            <select class="enhanced-select" onchange="InvestigationStore.state.filters.factId = this.value; window.renderInvestigationBoard();">
                                ${facts.map(f => `<option value="${f.id}" ${f.id == currentFactId ? 'selected' : ''}>${f.label}</option>`).join('')}
                            </select>
                        </div>
                    </div>

                    <div class="matrix-actions-group">
                        <label class="toggle-switch">
                            <input type="checkbox" 
                                ${showAllFacts ? 'checked' : ''}
                                onchange="InvestigationStore.state.filters.showAllFacts = this.checked; window.renderInvestigationBoard();">
                            <span class="toggle-slider"></span>
                            <span class="toggle-label">${Localization.t('investigation.matrix.filter.show_all_facts')}</span>
                        </label>
                        <label class="toggle-switch">
                            <input type="checkbox" 
                                ${hideIgnorant ? 'checked' : ''}
                                onchange="InvestigationStore.state.filters.hideIgnorant = this.checked; window.renderInvestigationBoard();">
                            <span class="toggle-slider"></span>
                            <span class="toggle-label">${Localization.t('investigation.matrix.filter.hide_ignorant')}</span>
                        </label>
                    </div>
                    
                    <div class="matrix-legend">
                        <div class="legend-item"><i data-lucide="check" class="matrix-icon state-knows"></i> ${Localization.t('investigation.matrix.legend.knows')}</div>
                        <div class="legend-item"><i data-lucide="help-circle" class="matrix-icon state-suspicious"></i> ${Localization.t('investigation.matrix.legend.suspicious')}</div>
                        <div class="legend-item"><i data-lucide="alert-triangle" class="matrix-icon state-misled"></i> ${Localization.t('investigation.matrix.legend.misled')}</div>
                        <div class="legend-item"><i data-lucide="circle" class="matrix-icon state-ignorant"></i> ${Localization.t('investigation.matrix.legend.ignorant')}</div>
                    </div>
                </div>
                
                <div class="matrix-grid-outer">
                    <div class="matrix-grid-wrapper">
                        <table class="matrix-table">
                            <thead>
                                <tr>
                                    <th class="th-sticky-corner">${Localization.t('investigation.matrix.col.char_scene')}</th>
                                    ${scenes.map(s => `
                                        <th>
                                            <div class="th-scene-title" title="${s.actTitle} > ${s.chapterTitle} > ${s.title}">
                                                <span class="matrix-act-name">${s.actTitle}</span>
                                                <span class="matrix-chap-name">${s.chapterTitle}</span>
                                                <span class="matrix-scene-name">${s.title}</span>
                                            </div>
                                        </th>`).join('')}
                                </tr>
                            </thead>
                            <tbody>
                                ${this.renderTableBody(displayCharacters, scenes, facts, showAllFacts, currentFactId, hideIgnorant)}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        if (typeof lucide !== 'undefined') lucide.createIcons();
    },

    renderTableBody: function (characters, scenes, facts, showAll, currentFactId, hideIgnorant) {
        if (characters.length === 0) {
            return `<tr><td colspan="${scenes.length + 1}" class="matrix-empty-message">${Localization.t('investigation.matrix.empty_characters')}</td></tr>`;
        }

        if (!showAll) {
            return characters.map(char => this.renderRow(char, scenes, currentFactId)).join('');
        }

        // Show All Mode: Nested rows
        return characters.map(char => {
            // Filter facts for THIS character if hideIgnorant is true
            let relevantFacts = facts;
            if (hideIgnorant) {
                relevantFacts = facts.filter(f => {
                    return InvestigationStore.state.knowledge.some(k =>
                        k.characterId == char.id && k.factId == f.id && k.state !== 'ignorant'
                    );
                });
            }

            // Skip character if no relevant facts and hideIgnorant is on
            if (hideIgnorant && relevantFacts.length === 0) return '';

            // Main character heading row
            const charRow = `
                <tr class="row-character-header">
                    <td class="td-character-name sticky-col" colspan="${scenes.length + 1}">
                        <div class="char-cell-content">
                            <div class="mini-avatar">${char.name.charAt(0)}</div>
                            <strong>${char.name}</strong>
                        </div>
                    </td>
                </tr>
            `;

            // Row for each (relevant) fact
            const factRows = relevantFacts.map(fact => {
                return `
                <tr class="row-fact-detail">
                    <td class="td-fact-label sticky-col">
                        <div class="fact-sublabel">${fact.label}</div>
                    </td>
                    ${scenes.map(scene => {
                    const knowledge = InvestigationStore.getCharacterKnowledge(char.id)
                        .find(k => k.sceneId == (scene.id || scene.uid) && k.factId == fact.id);
                    const state = knowledge ? knowledge.state : 'ignorant';
                    let icon = '';
                    if (state === 'knows') icon = 'check';
                    if (state === 'suspicious') icon = 'help-circle';
                    if (state === 'misled') icon = 'alert-triangle';
                    const localizedTooltip = Localization.t(`investigation.matrix.legend.${state}`);

                    return `
                            <td class="td-matrix-cell state-${state}" title="${localizedTooltip}">
                                <span class="cell-marker">
                                    ${icon ? `<i data-lucide="${icon}" class="matrix-icon"></i>` : ''}
                                </span>
                            </td>
                        `;
                }).join('')}
                </tr>
                `;
            }).join('');

            return charRow + factRows;
        }).join('');
    },

    renderRow: function (character, scenes, factId) {
        return `
            <tr>
                <td class="td-character-name sticky-col">
                    <div class="char-cell-content">
                        <div class="mini-avatar">${character.name.charAt(0)}</div>
                        <span>${character.name}</span>
                    </div>
                </td>
                ${scenes.map(scene => {
            const knowledge = InvestigationStore.getCharacterKnowledge(character.id)
                .find(k => k.sceneId == (scene.id || scene.uid) && k.factId == factId);

            const state = knowledge ? knowledge.state : 'ignorant';

            let icon = '';
            if (state === 'knows') icon = 'check';
            if (state === 'suspicious') icon = 'help-circle';
            if (state === 'misled') icon = 'alert-triangle';

            const localizedTooltip = Localization.t(`investigation.matrix.legend.${state}`);

            return `
                        <td class="td-matrix-cell state-${state}" 
                            title="${localizedTooltip}">
                            <span class="cell-marker">
                                ${icon ? `<i data-lucide="${icon}" class="matrix-icon"></i>` : ''}
                            </span>
                        </td>
                    `;
        }).join('')}
            </tr>
        `;
    }
};

window.InvestigationMatrixView = InvestigationMatrixView;
