/**
 * [MVVM : Investigation Registry View]
 * Gestion de la liste des faits, indices et secrets.
 */

const InvestigationRegistryView = {
    render: function (container) {
        const searchTerm = (this.state && this.state.search) || '';
        const filterType = (this.state && this.state.filterType) || 'all';

        container.innerHTML = `
            <div class="investigation-registry">
                <div class="registry-header-premium">
                    <div class="header-left">
                        <h3>${Localization.t('investigation.registry.title')}</h3>
                        <p>${Localization.t('investigation.registry.desc')}</p>
                    </div>
                    
                    <div class="registry-toolbar">
                        <div class="registry-search" style="display: ${this.state.displayMode === 'table' ? 'none' : 'flex'}">
                            <i data-lucide="search"></i>
                            <input type="text" id="registrySearchInput"
                                   placeholder="${Localization.t('investigation.sidebar.search')}" 
                                   data-i18n-placeholder="investigation.sidebar.search"
                                   value="${searchTerm}"
                                   oninput="InvestigationRegistryView.handleSearch(this.value)">
                        </div>
                        
                        <select class="btn-registry-filter" id="registryFilterSelect" 
                                style="display: ${this.state.displayMode === 'table' ? 'none' : 'block'}"
                                onchange="InvestigationRegistryView.handleFilter(this.value)">
                            <option value="all">${Localization.t('investigation.dashboard.view_all')}</option>
                            <option value="clue" ${filterType === 'clue' ? 'selected' : ''}>${Localization.t('investigation.type.clue')}</option>
                            <option value="red_herring" ${filterType === 'red_herring' ? 'selected' : ''}>${Localization.t('investigation.type.red_herring')}</option>
                            <option value="testimony" ${filterType === 'testimony' ? 'selected' : ''}>${Localization.t('investigation.type.testimony')}</option>
                            <option value="object" ${filterType === 'object' ? 'selected' : ''}>${Localization.t('investigation.type.object')}</option>
                            <option value="event" ${filterType === 'event' ? 'selected' : ''}>${Localization.t('investigation.type.event')}</option>
                            <option value="rumor" ${filterType === 'rumor' ? 'selected' : ''}>${Localization.t('investigation.type.rumor')}</option>
                            <option value="crime" ${filterType === 'crime' ? 'selected' : ''}>${Localization.t('investigation.type.crime')}</option>
                            <option value="disappearance" ${filterType === 'disappearance' ? 'selected' : ''}>${Localization.t('investigation.type.disappearance')}</option>
                            <option value="coma" ${filterType === 'coma' ? 'selected' : ''}>${Localization.t('investigation.type.coma')}</option>
                        </select>

                        <div class="registry-display-toggle">
                            <button class="toggle-btn ${this.state.displayMode === 'cards' ? 'active' : ''}" 
                                    onclick="InvestigationRegistryView.setDisplayMode('cards')"
                                    title="${Localization.t('investigation.registry.display_cards')}">
                                <i data-lucide="layout-grid"></i>
                            </button>
                            <button class="toggle-btn ${this.state.displayMode === 'table' ? 'active' : ''}" 
                                    onclick="InvestigationRegistryView.setDisplayMode('table')"
                                    title="${Localization.t('investigation.registry.display_table')}">
                                <i data-lucide="list"></i>
                            </button>
                        </div>
                        
                        <button class="btn btn-primary" onclick="InvestigationRegistryView.openAddFactModal()">
                            <i data-lucide="plus"></i> ${Localization.t('investigation.registry.empty.action')}
                        </button>
                    </div>
                </div>

                <div class="registry-list-premium ${this.state.displayMode === 'table' ? 'mode-table' : 'mode-cards'}" id="registryItemsList">
                    <!-- Dynamic content -->
                </div>
            </div>
        `;

        this.renderList();
        if (typeof lucide !== 'undefined') lucide.createIcons();
    },

    renderList: function () {
        const listContainer = document.getElementById('registryItemsList');
        if (!listContainer) return;

        const facts = InvestigationStore.getActiveCaseFacts();
        const searchTerm = (this.state && this.state.search) || '';
        const filterType = (this.state && this.state.filterType) || 'all';
        const filterStatus = (this.state && this.state.filterStatus) || 'all';
        const filterChar = (this.state && this.state.filterCharacterId) || 'all';
        const filterEvolution = (this.state && this.state.filterHasEvolution) || 'all';

        // Apply filters
        let filteredFacts = facts.filter(f => {
            const matchesSearch = f.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (f.description && f.description.toLowerCase().includes(searchTerm.toLowerCase()));
            const matchesType = filterType === 'all' || f.type === filterType;
            const matchesStatus = filterStatus === 'all' || f.truthStatus === filterStatus;

            let matchesChar = filterChar === 'all';
            if (!matchesChar) {
                matchesChar = f.relatedCharacterIds && f.relatedCharacterIds.some(id => id == filterChar);
            }

            let matchesEvolution = filterEvolution === 'all';
            if (!matchesEvolution) {
                const hasEvol = f.timeline && f.timeline.length > 0;
                matchesEvolution = filterEvolution === 'yes' ? hasEvol : !hasEvol;
            }

            return matchesSearch && matchesType && matchesStatus && matchesChar && matchesEvolution;
        });

        if (this.state.displayMode === 'table' && facts.length > 0) {
            // En mode tableau, si on a des données de base, on garde TOUJOURS le tableau visible
            // pour permettre de modifier les filtres, même si le résultat filtré est vide.
            const tableExists = listContainer.querySelector('.registry-table-premium');
            if (!tableExists) {
                listContainer.innerHTML = this.renderTableShell();
            }
            this.updateTableBody(filteredFacts);
        } else if (filteredFacts.length === 0) {
            listContainer.innerHTML = `
                <div class="empty-state-card">
                    <i data-lucide="search" size="48"></i>
                    <h4>${facts.length === 0 ? Localization.t('investigation.registry.empty.title') : Localization.t('investigation.registry.no_results')}</h4>
                    <p>${facts.length === 0 ? Localization.t('investigation.registry.empty.desc') : Localization.t('investigation.registry.filter_desc')}</p>
                    ${facts.length === 0 ? `
                    <button class="btn btn-primary" onclick="InvestigationRegistryView.openAddFactModal()">
                        <i data-lucide="plus"></i> ${Localization.t('investigation.registry.empty.action')}
                    </button>` : ''}
                </div>
            `;
        } else {
            listContainer.innerHTML = filteredFacts.map(fact => this.renderFactCard(fact)).join('');
        }

        if (typeof lucide !== 'undefined') lucide.createIcons();
    },

    state: {
        search: '',
        filterType: 'all',
        filterStatus: 'all',
        filterCharacterId: 'all',
        filterHasEvolution: 'all',
        displayMode: 'cards'
    },

    setDisplayMode: function (mode) {
        this.state.displayMode = mode;
        this.render(document.getElementById('investigationContent'));
    },

    handleSearch: function (val) {
        this.state.search = val;

        // Synchroniser les deux champs de recherche s'ils existent
        const globalSearch = document.getElementById('registrySearchInput');
        if (globalSearch && globalSearch.value !== val) globalSearch.value = val;

        const colSearch = document.querySelector('.col-filter-input input');
        if (colSearch && colSearch.value !== val) colSearch.value = val;

        this.renderList();
    },

    handleFilter: function (val) {
        this.state.filterType = val;
        // Mettre à jour les selects de colonne si en mode tableau
        const colTypeSelect = document.getElementById('colFilterType');
        if (colTypeSelect) colTypeSelect.value = val;

        // Mettre à jour le select global si en mode tableau
        const globalSelect = document.getElementById('registryFilterSelect');
        if (globalSelect) globalSelect.value = val;

        this.renderList();
    },

    handleStatusFilter: function (val) {
        this.state.filterStatus = val;
        this.renderList();
    },

    handleCharacterFilter: function (val) {
        this.state.filterCharacterId = val;
        this.renderList();
    },

    handleEvolutionFilter: function (val) {
        this.state.filterHasEvolution = val;
        this.renderList();
    },

    resetFilters: function () {
        this.state.search = '';
        this.state.filterType = 'all';
        this.state.filterStatus = 'all';
        this.state.filterCharacterId = 'all';
        this.state.filterHasEvolution = 'all';
        this.render(document.getElementById('investigationContent'));
    },

    renderTableShell: function () {
        const charList = InvestigationStore.getCharacters();
        const types = ['clue', 'red_herring', 'testimony', 'object', 'event', 'rumor', 'crime', 'disappearance', 'coma'];
        const statuses = ['verified', 'disputed', 'false'];

        return `
            <div class="registry-table-container">
                <table class="registry-table-premium">
                    <thead>
                        <tr>
                            <th class="col-item">${Localization.t('investigation.registry.table.item')}</th>
                            <th class="col-type">${Localization.t('investigation.registry.table.type')}</th>
                            <th class="col-status">${Localization.t('investigation.registry.table.status')}</th>
                            <th class="col-secret">${Localization.t('investigation.registry.table.secret')}</th>
                            <th class="col-location">${Localization.t('investigation.registry.table.location')}</th>
                            <th class="col-chars">${Localization.t('investigation.registry.table.characters')}</th>
                            <th class="col-evolution">${Localization.t('investigation.registry.table.evolution')}</th>
                            <th class="col-actions"></th>
                        </tr>
                        <tr class="table-filter-row">
                            <th>
                                <div class="col-filter-input">
                                    <i data-lucide="search"></i>
                                    <input type="text" placeholder="${Localization.t('investigation.registry.placeholder.filter')}" 
                                           data-i18n-placeholder="investigation.registry.placeholder.filter"
                                           value="${this.state.search}" 
                                           oninput="InvestigationRegistryView.handleSearch(this.value)">
                                </div>
                            </th>
                            <th>
                                <select id="colFilterType" class="col-filter-select" onchange="InvestigationRegistryView.handleFilter(this.value)">
                                    <option value="all">${Localization.t('investigation.dashboard.view_all')}</option>
                                    ${types.map(t => `<option value="${t}" ${this.state.filterType === t ? 'selected' : ''}>${Localization.t('investigation.type.' + t)}</option>`).join('')}
                                </select>
                            </th>
                            <th>
                                <select class="col-filter-select" onchange="InvestigationRegistryView.handleStatusFilter(this.value)">
                                    <option value="all">${Localization.t('investigation.dashboard.view_all')}</option>
                                    ${statuses.map(s => `<option value="${s}" ${this.state.filterStatus === s ? 'selected' : ''}>${Localization.t('investigation.truth.' + s)}</option>`).join('')}
                                </select>
                            </th>
                            <th></th> <!-- Secret Filter (empty for now) -->
                            <th></th> <!-- Location Filter (empty for now) -->
                            <th>
                                <select class="col-filter-select" onchange="InvestigationRegistryView.handleCharacterFilter(this.value)">
                                    <option value="all">${Localization.t('investigation.dashboard.view_all')}</option>
                                    ${charList.sort((a, b) => a.name.localeCompare(b.name)).map(c => `<option value="${c.id}" ${this.state.filterCharacterId == c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
                                </select>
                            </th>
                            <th>
                                <select class="col-filter-select" onchange="InvestigationRegistryView.handleEvolutionFilter(this.value)">
                                    <option value="all">${Localization.t('investigation.dashboard.view_all')}</option>
                                    <option value="yes" ${this.state.filterHasEvolution === 'yes' ? 'selected' : ''}>${Localization.t('investigation.common.yes')}</option>
                                    <option value="no" ${this.state.filterHasEvolution === 'no' ? 'selected' : ''}>${Localization.t('investigation.common.no')}</option>
                                </select>
                            </th>
                            <th>
                                <div class="row-actions visible">
                                    <button class="btn-row-action" title="${Localization.t('investigation.registry.action.reset_filters')}" onclick="InvestigationRegistryView.resetFilters()">
                                        <i data-lucide="rotate-ccw"></i>
                                    </button>
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody id="registryTableBody">
                        <!-- Items dynamically updated -->
                    </tbody>
                </table>
            </div>
        `;
    },

    updateTableBody: function (facts) {
        const tbody = document.getElementById('registryTableBody');
        if (!tbody) return;

        if (facts.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="table-empty-row">
                        <i data-lucide="search-x"></i>
                        <span>${Localization.t('investigation.registry.no_results_filtered')}</span>
                        <button class="btn-text-action" onclick="InvestigationRegistryView.resetFilters()">${Localization.t('investigation.dashboard.view_all')}</button>
                    </td>
                </tr>
            `;
        } else {
            tbody.innerHTML = facts.map(fact => this.renderTableRow(fact)).join('');
        }

        if (typeof lucide !== 'undefined') lucide.createIcons({ root: tbody });
    },

    renderTableRow: function (fact) {
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

        const characters = InvestigationStore.getCharacters();
        const relatedChars = (fact.relatedCharacterIds || []).map(id => characters.find(c => c.id == id)).filter(Boolean);
        const hasTimeline = fact.timeline && fact.timeline.length > 0;
        const lastTimelineStep = hasTimeline ? fact.timeline[fact.timeline.length - 1] : null;

        const truthLabels = {
            verified: Localization.t('investigation.truth.verified'),
            disputed: Localization.t('investigation.truth.disputed'),
            false: Localization.t('investigation.truth.false')
        };
        const truthLabel = truthLabels[fact.truthStatus] || fact.truthStatus;

        return `
            <tr class="registry-row" onclick="InvestigationRegistryView.openAddFactModal('${fact.id}')">
                <td class="col-item">
                    <div class="item-cell">
                        <div class="item-icon-mini"><i data-lucide="${icon}"></i></div>
                        <div class="item-info">
                            <span class="item-label">${fact.label}</span>
                            ${fact.description ? `<span class="item-desc-compact">${fact.description.substring(0, 50)}${fact.description.length > 50 ? '...' : ''}</span>` : ''}
                        </div>
                    </div>
                </td>
                <td class="col-type">
                    <span class="type-pill-compact type-${fact.type}">${Localization.t('investigation.type.' + fact.type)}</span>
                </td>
                <td class="col-status">
                    <span class="status-pill-compact status-${fact.truthStatus}">${truthLabel}</span>
                </td>
                <td class="col-secret">
                     ${fact.isHidden ? '<i data-lucide="shield-check" class="secret-icon-table" title="Secretness" style="color: var(--primary-color)"></i>' : '<i data-lucide="shield" style="opacity: 0.2;"></i>'}
                </td>
                <td class="col-location">
                    <div class="location-cell-table">
                        ${fact.relatedLocationIds?.[0] ? `
                            <i data-lucide="map-pin"></i>
                            <span>${(InvestigationStore.getLocations().find(l => l.id == fact.relatedLocationIds[0])?.name) || '-'}</span>
                        ` : '<span class="no-location">-</span>'}
                    </div>
                </td>
                <td class="col-chars">
                    <div class="chars-list-compact">
                        ${relatedChars.map(c => `
                            <span class="char-tag-table" style="--char-color: ${c.color || 'var(--primary-color)'}">
                                ${c.name}
                            </span>
                        `).join('')}
                        ${relatedChars.length === 0 ? '<span class="no-chars-hint">-</span>' : ''}
                    </div>
                </td>
                <td class="col-evolution">
                    ${hasTimeline ? `
                        <div class="evolution-cell" title="${lastTimelineStep.description || ''}">
                            <i data-lucide="git-branch"></i>
                            <span class="evolution-count">${fact.timeline.length}</span>
                        </div>
                    ` : '<span class="no-evolution-hint">-</span>'}
                </td>
                <td class="col-actions">
                    <div class="row-actions">
                        <button class="btn-row-action" title="${Localization.t('investigation.dashboard.delete')}" onclick="event.stopPropagation(); if(confirm(Localization.t('investigation.registry.confirm_delete_item'))) InvestigationStore.deleteFact('${fact.id}')">
                            <i data-lucide="trash-2"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    },

    renderFactCard: function (fact) {
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

        // Enrichment with linked characters
        const characters = InvestigationStore.getCharacters();
        const relatedChars = (fact.relatedCharacterIds || []).map(id => characters.find(c => c.id == id)).filter(Boolean);

        // Status info
        const statusLabel = Localization.t('investigation.truth.' + fact.truthStatus) || fact.truthStatus;
        const typeLabel = Localization.t('investigation.type.' + fact.type) || fact.type;
        const hasTimeline = fact.timeline && fact.timeline.length > 0;

        return `
            <div class="fact-card-premium ${fact.type} ${fact.isHidden ? 'is-secret' : ''}" onclick="InvestigationRegistryView.editFact('${fact.id}')">
                <div class="card-left-bar status-${fact.truthStatus}"></div>
                
                <div class="card-icon-area">
                    <div class="icon-circle">
                        <i data-lucide="${icon}"></i>
                    </div>
                </div>

                <div class="card-main-content">
                    <div class="card-header-top">
                        <span class="fact-type-badge">${typeLabel}</span>
                        <span class="fact-status-pill status-${fact.truthStatus}">${statusLabel}</span>
                        <div class="card-top-actions">
                             <button class="btn-icon-xs danger" onclick="event.stopPropagation(); InvestigationRegistryView.deleteFact('${fact.id}')">
                                <i data-lucide="trash-2"></i>
                            </button>
                        </div>
                    </div>
                    
                    <h4 class="fact-title-premium">
                        ${fact.label}
                        ${fact.isHidden ? '<i data-lucide="eye-off" class="secret-icon-mini"></i>' : ''}
                    </h4>
                    
                    <p class="fact-desc-premium">${fact.description || '...'}</p>
                    
                    <div class="card-footer-registry">
                        <div class="linked-characters-mini">
                            ${relatedChars.length > 0 ? `
                                <div class="mini-avatar-stack">
                                    ${relatedChars.slice(0, 3).map(c => `
                                        <div class="mini-avatar-registry" title="${c.name}" style="background-color: ${c.color || 'var(--primary-color)'}">
                                            ${c.name.charAt(0)}
                                        </div>
                                    `).join('')}
                                    ${relatedChars.length > 3 ? `<div class="mini-avatar-more">+${relatedChars.length - 3}</div>` : ''}
                                </div>
                            ` : `<span class="no-links-hint">${Localization.t('investigation.registry.tip')}</span>`}
                        </div>
                        
                        <div class="card-meta-indicators">
                             ${relatedChars.length > 0 ? `<span class="meta-item" title="${Localization.t('investigation.registry.label.characters')}"><i data-lucide="users"></i> ${relatedChars.length}</span>` : ''}
                             ${hasTimeline ? `<span class="meta-item" title="${Localization.t('investigation.evolution.title')}"><i data-lucide="git-branch"></i> ${fact.timeline.length}</span>` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
    },


    // --- TAB MANAGEMENT ---
    switchTab: function (tabName, btnElement) {
        // Toggle Content
        document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
        const targetContent = document.getElementById('tab-' + tabName);
        if (targetContent) targetContent.classList.add('active');

        // Toggle Buttons
        if (btnElement) {
            document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
            btnElement.classList.add('active');
        }
    },

    openAddFactModal: function (factId = null) {
        const existingFact = factId ? InvestigationStore.getFactById(factId) : null;
        const modalTitle = existingFact ? Localization.t('investigation.case.modal.title_edit') : Localization.t('investigation.registry.empty.action');
        const btnLabel = existingFact ? Localization.t('investigation.dashboard.save') : Localization.t('investigation.dashboard.create');

        // Récupération des données pour les sélecteurs
        const allCharacters = InvestigationStore.getCharacters();
        const allLocations = InvestigationStore.getLocations();
        const allArcs = (typeof ArcRepository !== 'undefined') ? ArcRepository.getAll() : ((window.ArcModel && window.ArcModel.arcs) || []);

        const modalHtml = `
            <div class="modal-overlay" id="fact-modal">
                <div class="modal-container large-modal">
                    <div class="modal-header">
                        <h3>${modalTitle}</h3>
                        <button class="modal-close" onclick="document.getElementById('fact-modal').remove()">×</button>
                    </div>
                    
                    <div class="modal-tabs">
                        <button class="tab-btn active" onclick="InvestigationRegistryView.switchTab('general', this)">${Localization.t('investigation.registry.modal.general')}</button>
                        <button class="tab-btn" onclick="InvestigationRegistryView.switchTab('timeline', this)" ${!existingFact ? 'disabled title="' + Localization.t('investigation.registry.modal.evolution_disabled_tip') + '"' : ''}>${Localization.t('investigation.registry.modal.evolution')}</button>
                    </div>

                    <div class="modal-body">
                        <!-- TAB GENERAL -->
                        <div id="tab-general" class="tab-content active">
                            <div class="form-row">
                                <div class="form-group flex-1">
                                    <label>${Localization.t('investigation.registry.label.title')}</label>
                                    <input type="text" id="factLabel" value="${existingFact ? existingFact.label : ''}" placeholder="${Localization.t('investigation.registry.placeholder.title')}">
                                </div>
                                <div class="form-group width-auto">
                                    <label>${Localization.t('investigation.registry.label.type')}</label>
                                    <select id="factType">
                                        <option value="clue" ${existingFact?.type === 'clue' ? 'selected' : ''}>${Localization.t('investigation.type.clue')}</option>
                                        <option value="red_herring" ${existingFact?.type === 'red_herring' ? 'selected' : ''}>${Localization.t('investigation.type.red_herring')}</option>
                                        <option value="testimony" ${existingFact?.type === 'testimony' ? 'selected' : ''}>${Localization.t('investigation.type.testimony')}</option>
                                        <option value="object" ${existingFact?.type === 'object' ? 'selected' : ''}>${Localization.t('investigation.type.object')}</option>
                                        <option value="event" ${existingFact?.type === 'event' ? 'selected' : ''}>${Localization.t('investigation.type.event')}</option>
                                        <option value="rumor" ${existingFact?.type === 'rumor' ? 'selected' : ''}>${Localization.t('investigation.type.rumor')}</option>
                                        <option value="crime" ${existingFact?.type === 'crime' ? 'selected' : ''}>${Localization.t('investigation.type.crime')}</option>
                                        <option value="disappearance" ${existingFact?.type === 'disappearance' ? 'selected' : ''}>${Localization.t('investigation.type.disappearance')}</option>
                                        <option value="coma" ${existingFact?.type === 'coma' ? 'selected' : ''}>${Localization.t('investigation.type.coma')}</option>
                                    </select>
                                </div>
                            </div>

                            <div class="form-group">
                                <label>${Localization.t('investigation.registry.label.description')}</label>
                                <textarea id="factDescription" rows="3">${existingFact ? existingFact.description : ''}</textarea>
                            </div>

                            <div class="form-group">
                                <label>${Localization.t('investigation.registry.label.characters')}</label>
                                <div class="chars-grid" id="charsStart">
                                    ${this.renderMultiSelectOptions(allCharacters, existingFact?.relatedCharacterIds || [])}
                                </div>
                            </div>

                            <div class="form-row">
                                <div class="form-group flex-1">
                                    <label>${Localization.t('investigation.registry.label.location')}</label>
                                    <select id="factLocation">
                                        <option value="">-- ${Localization.t('investigation.case.option.none')} --</option>
                                        ${allLocations.map(loc => `<option value="${loc.id}" ${existingFact?.relatedLocationIds?.includes(loc.id) ? 'selected' : ''}>${loc.name}</option>`).join('')}
                                    </select>
                                </div>
                                <div class="form-group flex-1">
                                    <label>${Localization.t('investigation.registry.label.arc')}</label>
                                    <select id="factArc">
                                        <option value="">-- ${Localization.t('investigation.case.option.none')} --</option>
                                        ${allArcs.map(arc => `<option value="${arc.id}" ${existingFact?.relatedArcId === arc.id ? 'selected' : ''}>${arc.title}</option>`).join('')}
                                    </select>
                                </div>
                            </div>

                             <div class="form-row">
                                <div class="form-group">
                                    <label>${Localization.t('investigation.registry.label.truth')}</label>
                                    <select id="factStatus">
                                        <option value="verified" ${existingFact?.truthStatus === 'verified' ? 'selected' : ''}>${Localization.t('investigation.truth.verified')}</option>
                                        <option value="disputed" ${existingFact?.truthStatus === 'disputed' ? 'selected' : ''}>${Localization.t('investigation.truth.disputed')}</option>
                                        <option value="false" ${existingFact?.truthStatus === 'false' ? 'selected' : ''}>${Localization.t('investigation.truth.false')}</option>
                                    </select>
                                </div>
                                <div class="form-group checkbox-group" style="padding-top: 25px;">
                                    <input type="checkbox" id="factSecret" ${existingFact?.isHidden ? 'checked' : ''}>
                                    <label for="factSecret">${Localization.t('investigation.registry.label.secret')}</label>
                                </div>
                            </div>
                        </div>

                        <!-- TAB TIMELINE -->
                        <div id="tab-timeline" class="tab-content">
                            <div class="timeline-list">
                                ${this.renderTimeline(existingFact?.timeline || [], factId)}
                            </div>
                            <div class="timeline-actions">
                                <button class="btn btn-secondary btn-sm" onclick="InvestigationRegistryView.openAddTimelineStep('${factId}')">
                                    <i data-lucide="plus"></i> ${Localization.t('investigation.evolution.add')}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div class="modal-footer">
                        ${existingFact ? `<button class="btn btn-danger" style="margin-right: auto;" onclick="InvestigationRegistryView.deleteFact('${factId}')"><i data-lucide="trash-2"></i> ${Localization.t('investigation.dashboard.delete')}</button>` : ''}
                        <button class="btn btn-secondary" onclick="document.getElementById('fact-modal').remove()">${Localization.t('investigation.dashboard.cancel')}</button>
                        <button class="btn btn-primary" onclick="InvestigationRegistryView.saveFact('${factId || ''}')">${btnLabel}</button>
                    </div>
                </div>
            </div>
        `;

        // Inject modal
        const existingModal = document.getElementById('fact-modal');
        if (existingModal) existingModal.remove();
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        if (typeof lucide !== 'undefined') lucide.createIcons();
    },

    /**
     * Renders multi-select options for characters
     */
    renderMultiSelectOptions: function (characters, selectedIds) {
        if (!characters || characters.length === 0) {
            return `<div class="no-items">${Localization.t('investigation.registry.no_characters')}</div>`;
        }
        return characters.map(char => {
            const isSelected = selectedIds.includes(char.id);
            const name = char.name || char.firstName || Localization.t('investigation.common.character');
            return `
                <div class="char-select-item ${isSelected ? 'selected' : ''}" 
                     data-id="${char.id}" 
                     onclick="this.classList.toggle('selected')">
                    ${name}
                </div>
            `;
        }).join('');
    },

    // --- TIMELINE MANAGEMENT (CRUD) ---

    // 1. RENDER LIST
    renderTimeline: function (timeline, factId) {
        if (!timeline || timeline.length === 0) {
            return `
                <div class="empty-timeline">
                    <i data-lucide="clock" class="empty-icon"></i>
                    <p>${Localization.t('investigation.registry.empty_timeline')}</p>
                </div>
            `;
        }

        const scenes = InvestigationStore.getScenesWithContext();
        const enrichedSteps = timeline.map(step => {
            const scene = scenes.find(s => (s.id || s.uid) == step.sceneId);
            const character = InvestigationStore.getCharacters().find(c => c.id == step.characterId);
            return {
                ...step,
                scene,
                charName: character ? character.name : Localization.t('investigation.evolution.no_char')
            };
        });

        // Use the same premium UI classes as the main timeline
        return `
            <div class="investigation-timeline premium-modal-timeline">
                <div class="timeline-path">
                    <div class="timeline-vertical-line"></div>
                    ${enrichedSteps.map((step, index) => {
            const statusLabel = Localization.t('investigation.evolution.status.' + step.state) || step.state;
            const scene = step.scene || { title: Localization.t('investigation.common.unknown_scene'), actTitle: '?', chapterTitle: '?' };

            return `
                        <div class="evo-step timeline-scene-node" style="animation-delay: ${index * 0.05}s">
                            <div class="evo-marker scene-node-marker"></div>
                            <div class="evo-card scene-node-content">
                                <div class="evo-header scene-node-header">
                                    <div class="scene-node-breadcrumb">
                                        <span class="breadcrumb-item act">${scene.actTitle || '?'}</span>
                                        <i data-lucide="chevron-right"></i>
                                        <span class="breadcrumb-item chapter">${scene.chapterTitle || '?'}</span>
                                        <i data-lucide="chevron-right"></i>
                                        <span class="breadcrumb-item scene">${scene.title}</span>
                                    </div>
                                    <span class="status-pill status-${step.state}">${statusLabel}</span>
                                </div>
                                <div class="evo-body step-card-body">
                                    <div class="evo-actor step-actor">
                                        <strong>${Localization.t('investigation.evolution.step.who')}</strong> ${step.charName}
                                    </div>
                                    <div class="evo-desc step-desc">
                                        ${step.description}
                                    </div>
                                </div>
                                <div class="evo-actions step-card-actions">
                                    <button class="btn-icon-xs" title="${Localization.t('investigation.evolution.edit')}" onclick="InvestigationRegistryView.openEditTimelineStep('${factId}', '${step.id}')">
                                        <i data-lucide="edit-2"></i>
                                    </button>
                                    <button class="btn-icon-xs danger" title="${Localization.t('investigation.evolution.delete')}" onclick="InvestigationRegistryView.deleteTimelineStep('${factId}', '${step.id}')">
                                        <i data-lucide="trash-2"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                        `;
        }).join('')}
                </div>
            </div>
        `;
    },

    // 2. OPEN FORM (ADD or EDIT)
    openEditTimelineStep: function (factId, stepId = null) {
        const fact = InvestigationStore.getFactById(factId);
        if (!fact) return;

        let stepData = {};
        if (stepId) {
            stepData = fact.timeline.find(s => s.id === stepId) || {};
        }

        const scenes = InvestigationStore.getScenesWithContext();
        const characters = InvestigationStore.getCharacters();

        const formHtml = `
            <div class="timeline-editor-overlay" id="timelineEditor">
                <div class="timeline-editor-card">
                    <h4>${stepId ? Localization.t('investigation.evolution.edit') : Localization.t('investigation.evolution.add')}</h4>
                    
                    <div class="form-group">
                        <label>${Localization.t('investigation.evolution.step.who')}</label>
                        <select id="tlChar">
                            <option value="">-- ${Localization.t('investigation.evolution.no_char')} --</option>
                            ${characters.map(c => `<option value="${c.id}" ${c.id == stepData.characterId ? 'selected' : ''}>${c.name}</option>`).join('')}
                        </select>
                    </div>

                    <div class="form-group">
                        <label>${Localization.t('investigation.evolution.step.when')}</label>
                        <select id="tlScene">
                            ${scenes.map(s => {
            const label = `${s.actTitle} > ${s.chapterTitle} > ${s.title}`;
            return `<option value="${s.id || s.uid}" ${(s.id || s.uid) == stepData.sceneId ? 'selected' : ''}>${label}</option>`;
        }).join('')}
                        </select>
                    </div>

                    <div class="form-group">
                        <label>${Localization.t('investigation.evolution.step.state')}</label>
                        <select id="tlStatus">
                            <option value="revealed" ${stepData.state === 'revealed' ? 'selected' : ''}>${Localization.t('investigation.evolution.status.revealed')}</option>
                            <option value="hinted" ${stepData.state === 'hinted' ? 'selected' : ''}>${Localization.t('investigation.evolution.status.hinted')}</option>
                            <option value="obscured" ${stepData.state === 'obscured' ? 'selected' : ''}>${Localization.t('investigation.evolution.status.obscured')}</option>
                            <option value="disputed" ${stepData.state === 'disputed' ? 'selected' : ''}>${Localization.t('investigation.evolution.status.disputed')}</option>
                            <option value="confirmed" ${stepData.state === 'confirmed' ? 'selected' : ''}>${Localization.t('investigation.evolution.status.confirmed')}</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label>${Localization.t('investigation.evolution.step.how')}</label>
                        <textarea id="tlDesc" rows="3">${stepData.description || ''}</textarea>
                    </div>

                    <div class="form-footer">
                        <button class="btn btn-secondary" onclick="document.getElementById('timelineEditor').remove()">${Localization.t('investigation.dashboard.cancel')}</button>
                        <button class="btn btn-primary" onclick="InvestigationRegistryView.saveTimelineStep('${factId}', '${stepId || ''}')">${Localization.t('investigation.dashboard.save')}</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', formHtml);
        if (typeof lucide !== 'undefined') lucide.createIcons();
    },

    openAddTimelineStep: function (factId) {
        this.openEditTimelineStep(factId, null);
    },

    // 3. SAVE Logic
    saveTimelineStep: function (factId, stepId) {
        const charId = document.getElementById('tlChar').value;
        const sceneId = document.getElementById('tlScene').value;
        const state = document.getElementById('tlStatus').value;
        const desc = document.getElementById('tlDesc').value;

        if (!desc) {
            alert(Localization.t('investigation.evolution.step.how') + " " + Localization.t('investigation.common.required') + ".");
            return;
        }

        const fact = InvestigationStore.getFactById(factId);
        if (!fact) return;

        if (!fact.timeline) fact.timeline = [];

        if (stepId) {
            // Update
            const stepIndex = fact.timeline.findIndex(s => s.id === stepId);
            if (stepIndex !== -1) {
                fact.timeline[stepIndex] = {
                    ...fact.timeline[stepIndex],
                    characterId: charId,
                    sceneId,
                    state,
                    description: desc,
                    updatedAt: Date.now()
                };
            }
        } else {
            // Create
            const newId = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : 'step-' + Date.now() + Math.random().toString(36).substr(2, 9);

            fact.timeline.push({
                id: newId,
                characterId: charId,
                sceneId,
                state,
                description: desc,
                timestamp: Date.now()
            });
        }

        // Save entire fact
        InvestigationStore.updateFact(fact);

        if (charId && sceneId) {
            let matrixState = null;
            switch (state) {
                case 'revealed':
                case 'confirmed':
                    matrixState = 'knows';
                    break;
                case 'hinted':
                case 'disputed':
                    matrixState = 'suspicious';
                    break;
                case 'obscured':
                    matrixState = 'misled';
                    break;
            }

            if (matrixState) {
                InvestigationStore.setKnowledgeState(charId, factId, sceneId, matrixState);
            }
        }

        const editor = document.getElementById('timelineEditor');
        if (editor) editor.remove();

        const container = document.querySelector('.timeline-list');
        if (container) {
            const updatedFact = InvestigationStore.getFactById(factId);
            container.innerHTML = this.renderTimeline(updatedFact ? updatedFact.timeline : [], factId);
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }
    },

    // 4. DELETE
    deleteTimelineStep: function (factId, stepId) {
        if (!confirm(Localization.t('investigation.evolution.confirm_delete'))) return;

        const fact = InvestigationStore.getFactById(factId);
        if (!fact || !fact.timeline) return;

        fact.timeline = fact.timeline.filter(s => s.id !== stepId);
        InvestigationStore.updateFact(fact);

        const container = document.querySelector('.timeline-list');
        if (container) {
            container.innerHTML = this.renderTimeline(fact.timeline, factId);
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }
    },
    saveFact: function (factId) {
        const label = document.getElementById('factLabel').value;
        const type = document.getElementById('factType').value;
        const status = document.getElementById('factStatus').value;
        const desc = document.getElementById('factDescription').value;
        const isSecret = document.getElementById('factSecret').checked;
        const locationId = document.getElementById('factLocation').value;
        const arcId = document.getElementById('factArc').value;

        const charElements = document.querySelectorAll('.char-select-item.selected');
        const charIds = Array.from(charElements).map(el => el.getAttribute('data-id'));

        if (!label) {
            alert(Localization.t('investigation.registry.error.title_required'));
            return;
        }

        const activeCase = InvestigationStore.getActiveCase();
        if (!activeCase && !factId) {
            alert(Localization.t('investigation.error.no_active_case'));
            return;
        }

        let existingFact = null;
        if (factId) {
            existingFact = InvestigationStore.getFactById(factId);
        }

        const factData = {
            ...(existingFact || {}),
            id: factId || undefined,
            caseId: activeCase ? activeCase.id : undefined,
            label,
            type,
            description: desc,
            truthStatus: status,
            isHidden: isSecret,
            relatedCharacterIds: charIds,
            relatedLocationIds: locationId ? [locationId] : [],
            relatedArcId: arcId
        };

        try {
            if (factId) {
                InvestigationStore.updateFact(factData);
            } else {
                const newFact = InvestigationStore.createFact(factData);
                InvestigationStore.addFact(newFact);
            }

            document.getElementById('fact-modal').remove();

            if (InvestigationStore.state.currentView === 'registry') {
                window.renderInvestigationBoard();
            }

        } catch (e) {
            console.error("❌ Error saving fact:", e);
            alert(Localization.t('investigation.error.save_failed'));
        }
    },

    deleteFact: function (id) {
        if (confirm(Localization.t('investigation.registry.confirm_delete_fact'))) {
            InvestigationStore.deleteFact(id);
            const modal = document.getElementById('fact-modal');
            if (modal) modal.remove();

            if (InvestigationStore.state.currentView === 'registry') {
                window.renderInvestigationBoard();
            }
        }
    },

    editFact: function (id) {
        this.openAddFactModal(id);
    }
};

window.InvestigationRegistryView = InvestigationRegistryView;
