/**
 * [MVVM : Investigation Board Dashboard View]
 * Vue tableau de bord affichant tous les cas et leur statut.
 */

const InvestigationDashboardView = {

    /**
     * Render the dashboard view.
     * @param {HTMLElement} container - DOM container
     */
    render: function (container) {
        if (!container) return;

        const cases = InvestigationStore.getCases();
        const activeCase = InvestigationStore.getActiveCase();
        const hasCases = cases.length > 0;


        if (hasCases && activeCase) {
            container.innerHTML = `
                <div class="investigation-dashboard has-overview">
                    ${this.renderCaseOverview(activeCase)}
                </div>
            `;
        } else {
            container.innerHTML = `
                <div class="investigation-dashboard">
                    ${hasCases ? this.renderCaseGrid(cases) : this.renderEmptyState()}
                </div>
            `;
        }

        if (typeof lucide !== 'undefined') lucide.createIcons();
    },

    /**
     * Render the empty state for new users.
     */
    renderEmptyState: function () {
        return `
            <div class="dashboard-empty-state">
                <div class="empty-state-icon">
                    <i data-lucide="search" style="width: 64px; height: 64px; stroke-width: 1;"></i>
                </div>
                <h2 class="empty-state-title">${Localization.t('investigation.dashboard.onboarding.title')}</h2>
                <p class="empty-state-text">
                    ${Localization.t('investigation.dashboard.onboarding.desc')}
                </p>
                <div class="onboarding-steps">
                    <div class="onboarding-step">
                        <div class="step-number">1</div>
                        <div class="step-content">
                            <strong>${Localization.t('investigation.dashboard.onboarding.step1')}</strong>
                            <span>${Localization.t('investigation.dashboard.onboarding.step1_desc')}</span>
                        </div>
                    </div>
                    <div class="onboarding-step">
                        <div class="step-number">2</div>
                        <div class="step-content">
                            <strong>${Localization.t('investigation.dashboard.onboarding.step2')}</strong>
                            <span>${Localization.t('investigation.dashboard.onboarding.step2_desc')}</span>
                        </div>
                    </div>
                    <div class="onboarding-step">
                        <div class="step-number">3</div>
                        <div class="step-content">
                            <strong>${Localization.t('investigation.dashboard.onboarding.step3')}</strong>
                            <span>${Localization.t('investigation.dashboard.onboarding.step3_desc')}</span>
                        </div>
                    </div>
                </div>
                <button class="btn btn-primary btn-lg" onclick="InvestigationDashboardView.openCreateCaseModal()">
                    <i data-lucide="plus"></i> ${Localization.t('investigation.dashboard.onboarding.btn_primary')}
                </button>
                
                
                <div style="margin-top: 20px; text-align: center;">
                    <button class="btn btn-danger btn-sm" onclick="if(window.clearDemoData) { window.clearDemoData(); }">
                        <i data-lucide="trash-2"></i> ${Localization.t('investigation.dashboard.clear_demo')}
                    </button>
                </div>

            </div>
        `;
    },

    /**
     * Render a detailed overview of the selected case.
     */
    renderCaseOverview: function (caseData) {
        const facts = InvestigationStore.getFacts().filter(f => f.caseId === caseData.id);
        const characters = InvestigationStore.getCharacters();
        const suspects = characters.filter(c => {
            const links = InvestigationStore.getSuspectLinks();
            return links.some(l => l.suspectId === c.id && l.victimId === caseData.id);
        });

        const secretsCount = facts.filter(f => f.isHidden).length;
        const verifiedFacts = facts.filter(f => f.truthStatus === 'verified').length;
        const recentFacts = [...facts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 3);

        return `
            <div class="case-overview">
                <div class="overview-header">
                    <div class="overview-title-group">
                        <span class="overview-label">${Localization.t('investigation.dashboard.active_case')}</span>
                        <h2>${caseData.title}</h2>
                    </div>
                    <div class="overview-actions">
                        <button class="btn btn-danger" onclick="if(window.clearDemoData) { window.clearDemoData(); }">
                            <i data-lucide="trash-2"></i> ${Localization.t('investigation.dashboard.clear_demo')}
                        </button>
                        <button class="btn btn-secondary" onclick="InvestigationDashboardView.editCase('${caseData.id}')">
                            <i data-lucide="edit-2"></i> ${Localization.t('investigation.dashboard.edit')}
                        </button>
                    </div>
                </div>

                <div class="overview-grid">
                    <div class="overview-card stats-card">
                        <div class="card-header-mini">
                            <div class="card-title">${Localization.t('investigation.dashboard.progression')}</div>
                            <i data-lucide="trending-up" class="card-icon-bg"></i>
                        </div>
                        <div class="stat-content">
                            <div class="stat-main">${Localization.t('investigation.phase.' + (caseData.phase || 'collection'))}</div>
                            <div class="stat-sub">${Localization.t('investigation.status.' + caseData.status)}</div>
                        </div>
                    </div>
                    
                    <div class="overview-card stats-card">
                        <div class="card-header-mini">
                            <div class="card-title">${Localization.t('investigation.dashboard.indices')}</div>
                            <i data-lucide="file-search" class="card-icon-bg"></i>
                        </div>
                        <div class="stat-content">
                            <div class="stat-main">${facts.length}</div>
                            <div class="stat-sub">${verifiedFacts} ${Localization.t('investigation.dashboard.verified')}, ${secretsCount} ${Localization.t('investigation.dashboard.secrets')}</div>
                        </div>
                    </div>

                    <div class="overview-card suspects-card">
                        <div class="card-header-mini">
                            <div class="card-title">${Localization.t('investigation.dashboard.key_suspects')} (${suspects.length})</div>
                            <i data-lucide="users" class="card-icon-bg"></i>
                        </div>
                        <div class="suspects-list">
                            ${suspects.slice(0, 4).map(s => {
            const nameChar = s.name?.[0] || s.firstName?.[0] || '?';
            const charColor = s.color || 'var(--text-muted)';
            return `
                                    <div class="suspect-mini-profile" style="border-left: 3px solid ${charColor}">
                                        <div class="mini-avatar" style="background: ${charColor}">${nameChar}</div>
                                        <span>${s.name || s.firstName || Localization.t('investigation.common.character')}</span>
                                    </div>
                                `;
        }).join('')}
                            ${suspects.length > 4 ? `<div class="more-count">+${suspects.length - 4}</div>` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Render grid of case cards.
     */
    renderCaseGrid: function (cases) {
        const activeId = InvestigationStore.state.activeCaseId;

        return `
            <div class="dashboard-header">
                <h2><i data-lucide="briefcase"></i> ${Localization.t('investigation.dashboard.my_cases')}</h2>
                <div class="dashboard-actions">
                    <button class="btn btn-danger" onclick="if(window.clearDemoData) { window.clearDemoData(); }">
                        <i data-lucide="trash-2"></i> ${Localization.t('investigation.dashboard.clear_demo')}
                    </button>
                    <button class="btn btn-primary" onclick="InvestigationDashboardView.openCreateCaseModal()">
                        <i data-lucide="plus"></i> ${Localization.t('investigation.case.new')}
                    </button>
                </div>
            </div>
            <div class="cases-grid">
                ${cases.map(c => this.renderCaseCard(c, c.id === activeId)).join('')}
            </div>
        `;
    },

    /**
     * Render a single case card.
     */
    renderCaseCard: function (caseData, isActive) {
        const statusColors = {
            open: 'status-open',
            in_progress: 'status-progress',
            solved: 'status-solved',
            closed: 'status-closed'
        };
        const statusLabels = {
            open: 'Ouvert',
            in_progress: 'En cours',
            solved: 'Résolu',
            closed: 'Classé'
        };
        const crimeIcons = {
            murder: 'skull',
            theft: 'gem',
            disappearance: 'user-x',
            coma: 'activity',
            kidnapping: 'lock',
            other: 'help-circle'
        };

        const factsCount = InvestigationStore.state.facts.filter(f => f.caseId === caseData.id).length;
        const suspectCount = InvestigationStore.state.suspectLinks.filter(l => l.caseId === caseData.id).length;

        const dateOptions = { day: '2-digit', month: '2-digit', year: '2-digit' };
        const updatedAt = caseData.updatedAt ? new Date(caseData.updatedAt).toLocaleDateString(Localization.currentLang === 'fr' ? 'fr-FR' : 'en-US', dateOptions) : '...';

        const progressMap = { open: 15, in_progress: 55, solved: 100, closed: 100 };
        const progress = progressMap[caseData.status] || 0;
        const circumference = 2 * Math.PI * 18;
        const offset = circumference - (progress / 100) * circumference;

        return `
            <div class="case-card ${isActive ? 'active' : ''} ${statusColors[caseData.status]}" 
                  onclick="InvestigationDashboardView.selectCase('${caseData.id}')">
                <div class="case-card-header">
                    <div class="case-icon-wrapper">
                        <div class="case-status-ring">
                            <svg width="44" height="44">
                                <circle class="ring-bg" cx="22" cy="22" r="18" />
                                <circle class="ring-fill" cx="22" cy="22" r="18" 
                                        style="stroke-dasharray: ${circumference}; stroke-dashoffset: ${offset}" />
                            </svg>
                            <div class="case-icon">
                                <i data-lucide="${crimeIcons[caseData.crimeType] || 'help-circle'}"></i>
                            </div>
                        </div>
                    </div>
                    <div class="case-status-badge ${statusColors[caseData.status]}">
                        ${Localization.t('investigation.status_pill.' + (caseData.status || 'open'))}
                    </div>
                </div>
                <h3 class="case-title">${caseData.title}</h3>
                <div class="case-phase-tag">${Localization.t('investigation.phase.' + (caseData.phase || 'collection'))}</div>
                <p class="case-description">${caseData.description || ''}</p>
                
                <div class="case-stats">
                    <span title="${Localization.t('investigation.dashboard.last_updated', '')}"><i data-lucide="clock"></i> ${updatedAt}</span>
                    <span><i data-lucide="file-text"></i> ${factsCount} ${Localization.t('investigation.dashboard.indices')}</span>
                    <span><i data-lucide="users"></i> ${suspectCount} ${Localization.t('investigation.dashboard.key_suspects')}</span>
                </div>
                <div class="case-actions">
                    <button class="btn btn-sm btn-secondary" onclick="event.stopPropagation(); InvestigationDashboardView.editCase('${caseData.id}')">
                        <i data-lucide="edit-2"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="event.stopPropagation(); InvestigationDashboardView.deleteCase('${caseData.id}')">
                        <i data-lucide="trash-2"></i>
                    </button>
                </div>
            </div>
        `;
    },

    selectCase: function (caseId) {
        InvestigationStore.setActiveCase(caseId);
        // Switch to registry view after selecting
        InvestigationStore.setCurrentView('registry');
    },

    deleteCase: function (caseId) {
        const caseData = InvestigationStore.state.cases.find(c => c.id === caseId);
        if (caseData && confirm(Localization.t('investigation.dashboard.confirm_delete', caseData.title))) {
            InvestigationStore.deleteCase(caseId);
        }
    },

    editCase: function (caseId) {
        this.openCreateCaseModal(caseId);
    },

    /**
     * Open modal to create or edit a case.
     */
    openCreateCaseModal: function (caseId = null) {
        const existingCase = caseId ? InvestigationStore.state.cases.find(c => c.id === caseId) : null;
        const isEdit = !!existingCase;
        const characters = InvestigationStore.getCharacters();

        const modalHtml = `
            <div class="modal-overlay" id="caseModal" onclick="if(event.target===this) this.remove()">
                <div class="modal-content modal-medium">
                    <div class="modal-header">
                        <h3>${isEdit ? Localization.t('investigation.case.modal.title_edit') : Localization.t('investigation.case.modal.title_new')}</h3>
                        <button class="modal-close" onclick="document.getElementById('caseModal').remove()">
                            <i data-lucide="x"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label>${Localization.t('investigation.case.label.title')}</label>
                            <input type="text" id="caseTitle" value="${existingCase?.title || ''}" 
                                   placeholder="${Localization.t('investigation.case.placeholder.title')}">
                        </div>
                        <div class="form-group">
                            <label>${Localization.t('investigation.case.label.description')}</label>
                            <textarea id="caseDescription" rows="3" 
                                      placeholder="${Localization.t('investigation.case.placeholder.description')}">${existingCase?.description || ''}</textarea>
                        </div>
                        <div class="form-row">
                            <div class="form-group flex-1">
                                <label>${Localization.t('investigation.case.label.crime_type')}</label>
                                <select id="caseCrimeType">
                                    <option value="murder" ${existingCase?.crimeType === 'murder' ? 'selected' : ''}>${Localization.t('investigation.crime.murder')}</option>
                                    <option value="theft" ${existingCase?.crimeType === 'theft' ? 'selected' : ''}>${Localization.t('investigation.crime.theft')}</option>
                                    <option value="disappearance" ${existingCase?.crimeType === 'disappearance' ? 'selected' : ''}>${Localization.t('investigation.crime.disappearance')}</option>
                                    <option value="other" ${existingCase?.crimeType === 'other' ? 'selected' : ''}>${Localization.t('investigation.crime.other')}</option>
                                </select>
                            </div>
                            <div class="form-group flex-1">
                                <label>${Localization.t('investigation.case.label.status')}</label>
                                <select id="caseStatus">
                                    <option value="open" ${existingCase?.status === 'open' ? 'selected' : ''}>🔴 ${Localization.t('investigation.status_pill.open')}</option>
                                    <option value="in_progress" ${existingCase?.status === 'in_progress' ? 'selected' : ''}>🟡 ${Localization.t('investigation.status_pill.in_progress')}</option>
                                    <option value="solved" ${existingCase?.status === 'solved' ? 'selected' : ''}>🟢 ${Localization.t('investigation.status_pill.solved')}</option>
                                    <option value="closed" ${existingCase?.status === 'closed' ? 'selected' : ''}>⚪ ${Localization.t('investigation.status_pill.closed')}</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>${Localization.t('investigation.case.label.victim')}</label>
                            <select id="caseVictim">
                                <option value="">-- ${Localization.t('investigation.case.option.none')} --</option>
                                ${characters.map(c => `<option value="${c.id}" ${existingCase?.victimId === c.id ? 'selected' : ''}>${c.name || c.firstName || Localization.t('investigation.common.character')}</option>`).join('')}
                            </select>
                        </div>
                    </div>
                    <div class="modal-footer">
                        ${isEdit ? `<button class="btn btn-danger" style="margin-right: auto;" onclick="InvestigationDashboardView.deleteCase('${caseId}'); document.getElementById('caseModal').remove();"><i data-lucide="trash-2"></i> ${Localization.t('investigation.dashboard.delete')}</button>` : ''}
                        <button class="btn btn-secondary" onclick="document.getElementById('caseModal').remove()">${Localization.t('investigation.dashboard.cancel')}</button>
                        <button class="btn btn-primary" onclick="InvestigationDashboardView.saveCase('${caseId || ''}')">${isEdit ? Localization.t('investigation.dashboard.save') : Localization.t('investigation.dashboard.create')}</button>
                    </div>
                </div>
            </div>
        `;

        const existingModal = document.getElementById('caseModal');
        if (existingModal) existingModal.remove();
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        if (typeof lucide !== 'undefined') lucide.createIcons();
    },

    saveCase: function (caseId) {
        const title = document.getElementById('caseTitle').value.trim();
        const description = document.getElementById('caseDescription').value.trim();
        const crimeType = document.getElementById('caseCrimeType').value;
        const status = document.getElementById('caseStatus').value;
        const victimId = document.getElementById('caseVictim').value || null;

        if (!title) {
            alert(Localization.t('investigation.case.error.title_required'));
            return;
        }

        if (caseId) {
            // Update existing
            InvestigationStore.updateCase({
                id: caseId,
                title,
                description,
                crimeType,
                status,
                victimId
            });
        } else {
            // Create new
            InvestigationStore.createCase({
                title,
                description,
                crimeType,
                status,
                victimId
            });
        }

        document.getElementById('caseModal').remove();
    }
};

window.InvestigationDashboardView = InvestigationDashboardView;
