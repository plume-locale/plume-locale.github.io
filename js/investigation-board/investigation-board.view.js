/**
 * [MVVM : Investigation Board View]
 * Vue principale qui orchestre les sous-vues (Dashboard, Matrice, Crime Web, Registre).
 */


const InvestigationView = {
    // --- SIDEBAR INTEGRATION ---
    renderSidebar: function () {
        const targetSidebar = document.getElementById('investigationList') || document.querySelector('.sidebar') || document.getElementById('sidebar');

        if (!targetSidebar) {
            console.warn("Sidebar container not found.");
            return;
        }

        targetSidebar.classList.add('investigation-sidebar-active');

        const cases = InvestigationStore.getCases();
        const activeCase = InvestigationStore.getActiveCase();

        const sidebarContent = `
            <div class="investigation-sidebar">
                <div class="sidebar-search-container">
                    <div class="search-input-wrapper">
                        <i data-lucide="search" class="search-icon"></i>
                        <input type="text" placeholder="${Localization.t('investigation.case.search') || 'Rechercher...'}" 
                               id="sidebarCaseSearch"
                               data-i18n-placeholder="investigation.case.search"
                               oninput="InvestigationView.filterSidebarCases(this.value)">
                    </div>
                </div>

                <div class="sidebar-section">
                    <div class="section-header">
                        <div class="section-title">
                            <span class="title-text">${Localization.t('investigation.dashboard.my_cases')}</span>
                            <span class="count-badge">${cases.length}</span>
                        </div>
                        <button class="btn-add-circle" onclick="InvestigationDashboardView.openCreateCaseModal()" title="${Localization.t('investigation.case.new')}">
                            <i data-lucide="plus"></i>
                        </button>
                    </div>

                    <div class="sidebar-scrollable">
                        <div class="case-list" id="sidebarCaseList">
                            ${cases.map(c => {
            const isActive = c.id === activeCase?.id;
            const statusLabel = Localization.t(`investigation.status.${c.status}`) || c.status;
            return `
                                    <div class="case-item ${isActive ? 'active' : ''}" 
                                         onclick="InvestigationStore.setActiveCase('${c.id}')"
                                         data-title="${c.title.toLowerCase()}">
                                        <div class="case-icon-box">
                                            <i data-lucide="${isActive ? 'folder-open' : 'folder'}"></i>
                                        </div>
                                        <div class="case-info">
                                            <div class="case-item-title">${c.title}</div>
                                            <div class="case-item-meta">
                                                <span class="case-status-pill status-${c.status}">${statusLabel}</span>
                                            </div>
                                        </div>
                                        ${isActive ? '<div class="active-indicator"></div>' : ''}
                                    </div>
                                `;
        }).join('')}
                            ${cases.length === 0 ? `<div class="empty-nav-item">${Localization.t('investigation.case.none')}.</div>` : ''}
                        </div>
                    </div>
                </div>


            </div>
        `;

        targetSidebar.innerHTML = sidebarContent;
        if (typeof lucide !== 'undefined') lucide.createIcons({ root: targetSidebar });
    },

    filterSidebarCases: function (query) {
        const q = query.toLowerCase().trim();
        const items = document.querySelectorAll('#sidebarCaseList .case-item');
        items.forEach(item => {
            const title = item.getAttribute('data-title') || '';
            item.style.display = title.includes(q) ? 'flex' : 'none';
        });
    },

    /**
     * Point d'entrée pour le rendu
     * @param {HTMLElement} container - Élément DOM parent
     */
    render: function (container) {

        if (!container) return;

        const currentView = InvestigationStore.state.currentView;
        const activeCase = InvestigationStore.getActiveCase();
        const cases = InvestigationStore.getCases();
        const hasCases = cases.length > 0;


        // Render the global sidebar (using local method)
        if (typeof this.renderSidebar === 'function') {
            this.renderSidebar();
        }

        container.innerHTML = `
            <div class="investigation-board-layout">
                <div class="investigation-header glass-header">
                    <div class="header-main">
                        <div class="investigation-title">
                            <i data-lucide="search"></i>
                            <span>${Localization.t('investigation.title')}</span>
                        </div>
                        ${hasCases ? this.renderCaseTabs(cases, activeCase) : ''}
                    </div>
                    <div class="investigation-header-actions">
                    </div>
                </div>
                

                <div class="investigation-toolbar">
                    <div class="investigation-nav">
                        <button class="investigation-nav-btn ${currentView === 'dashboard' ? 'active' : ''}" 
                                onclick="InvestigationStore.setCurrentView('dashboard')">
                            <i data-lucide="layout-dashboard"></i> ${Localization.t('investigation.tab.dashboard')}
                        </button>
                        ${hasCases ? `
                        <button class="investigation-nav-btn ${currentView === 'registry' ? 'active' : ''}" 
                                onclick="InvestigationStore.setCurrentView('registry')">
                            <i data-lucide="files"></i> ${Localization.t('investigation.tab.registry')}
                            <span class="help-trigger" onclick="event.stopPropagation(); InvestigationView.showHelp('registry')">
                                <i data-lucide="help-circle"></i>
                            </span>
                        </button>
                        <button class="investigation-nav-btn ${currentView === 'matrix' ? 'active' : ''}" 
                                onclick="InvestigationStore.setCurrentView('matrix')">
                            <i data-lucide="grid-3x3"></i> ${Localization.t('investigation.tab.matrix')}
                            <span class="help-trigger" onclick="event.stopPropagation(); InvestigationView.showHelp('matrix')">
                                <i data-lucide="help-circle"></i>
                            </span>
                        </button>
                        <button class="investigation-nav-btn ${currentView === 'mmo' ? 'active' : ''}" 
                                onclick="InvestigationStore.setCurrentView('mmo')">
                            <i data-lucide="network"></i> ${Localization.t('investigation.tab.mmo')}
                            <span class="help-trigger" onclick="event.stopPropagation(); InvestigationView.showHelp('mmo')">
                                <i data-lucide="help-circle"></i>
                            </span>
                        </button>
                        <button class="investigation-nav-btn ${currentView === 'timeline' ? 'active' : ''}" 
                                onclick="InvestigationStore.setCurrentView('timeline')">
                            <i data-lucide="clock-3"></i> ${Localization.t('investigation.tab.timeline')}
                        </button>
                        ` : ''}
                    </div>
                    <div class="investigation-actions">
                        ${this.renderToolbarActions(currentView)}
                    </div>
                </div>

                <div class="investigation-content" id="investigationContent">
                    <!-- Dynamic Content -->
                </div>
            </div>
        `;


        this.renderActiveView(currentView);
        this.updateHeader();

        // Initialiser les icônes
        if (typeof lucide !== 'undefined') lucide.createIcons();
    },

    renderCaseTabs: function (cases, activeCase) {
        return `
            <div class="case-tabs">
                ${cases.map(c => `
                    <button class="case-tab ${c.id === activeCase?.id ? 'active' : ''}"
                            data-case-id="${c.id}"
                            onclick="InvestigationStore.setActiveCase('${c.id}')">
                        <span class="case-tab-indicator status-${c.status}"></span>
                        ${c.title}
                    </button>
                `).join('')}
                <button class="case-tab case-tab-add" onclick="InvestigationDashboardView.openCreateCaseModal()">
                    <i data-lucide="plus"></i>
                </button>
            </div>
        `;
    },

    renderProgressStepper: function (currentView) {
        const steps = [
            { key: 'dashboard', label: Localization.t('investigation.tab.dashboard'), icon: 'layout-dashboard' },
            { key: 'registry', label: Localization.t('investigation.tab.registry'), icon: 'files' },
            { key: 'matrix', label: Localization.t('investigation.tab.matrix'), icon: 'grid-3x3' },
            { key: 'mmo', label: Localization.t('investigation.tab.mmo'), icon: 'network' },
            { key: 'timeline', label: Localization.t('investigation.tab.timeline'), icon: 'clock-3' }
        ];
        const currentIndex = steps.findIndex(s => s.key === currentView);

        return `
            <div class="progress-stepper">
                ${steps.map((step, i) => `
                    <div class="stepper-step ${i <= currentIndex ? 'completed' : ''} ${step.key === currentView ? 'active' : ''}">
                        <div class="stepper-icon"><i data-lucide="${step.icon}"></i></div>
                        <span class="stepper-label">${step.label}</span>
                    </div>
                    ${i < steps.length - 1 ? '<div class="stepper-line"></div>' : ''}
                `).join('')}
            </div>
        `;
    },

    renderToolbarActions: function (viewMode) {
        if (viewMode === 'timeline') {
            const mode = InvestigationStore.state.timelineMode || 'default';
            return `
                <div class="view-mode-toggle">
                    <button class="btn-toggle ${mode === 'default' ? 'active' : ''}" 
                            onclick="InvestigationStore.setTimelineMode('default')" 
                            title="${Localization.t('investigation.timeline.view.default') || 'Vue normale'}">
                        <i data-lucide="layout-list"></i>
                    </button>
                    <button class="btn-toggle ${mode === 'compact' ? 'active' : ''}" 
                            onclick="InvestigationStore.setTimelineMode('compact')"
                            title="${Localization.t('investigation.timeline.view.compact') || 'Vue compacte'}">
                        <i data-lucide="stretch-horizontal"></i>
                    </button>
                </div>
            `;
        }
        return '';
    },

    updateToolbar: function (viewMode) {
        const btns = document.querySelectorAll('.investigation-nav .investigation-nav-btn');
        btns.forEach(btn => {
            if (btn.getAttribute('onclick')?.includes(viewMode)) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        const actionsContainer = document.querySelector('.investigation-actions');
        if (actionsContainer) {
            actionsContainer.innerHTML = this.renderToolbarActions(viewMode);
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }
    },

    /**
     * Updates the header (Tabs + Active Case Info) without full re-render
     */
    updateHeader: function () {
        const activeCase = InvestigationStore.getActiveCase();
        const cases = InvestigationStore.getCases();

        // 1. Re-render Tabs Structure (Handles add/remove/select)
        const headerMain = document.querySelector('.header-main');
        if (headerMain) {
            const existingTabs = headerMain.querySelector('.case-tabs');
            const newTabsHTML = this.renderCaseTabs(cases, activeCase);
            if (existingTabs) {
                existingTabs.outerHTML = newTabsHTML;
            } else {
                headerMain.insertAdjacentHTML('beforeend', newTabsHTML);
            }
        }

        // 2. Update Active Case Info (Phase & Status)
        const infoContainer = document.querySelector('.investigation-header-actions');
        if (infoContainer && activeCase) {
            infoContainer.innerHTML = `
                <div class="active-case-info">
                    <div class="phase-indicator">
                        <span class="phase-label">${Localization.t('investigation.phase.label')}</span>
                        <select class="phase-select" onchange="InvestigationStore.updateCase({id: '${activeCase.id}', phase: this.value})">
                            <option value="collection" ${activeCase.phase === 'collection' ? 'selected' : ''}>${Localization.t('investigation.phase.collection')}</option>
                            <option value="analysis" ${activeCase.phase === 'analysis' ? 'selected' : ''}>${Localization.t('investigation.phase.analysis')}</option>
                            <option value="confrontation" ${activeCase.phase === 'confrontation' ? 'selected' : ''}>${Localization.t('investigation.phase.confrontation')}</option>
                            <option value="resolution" ${activeCase.phase === 'resolution' ? 'selected' : ''}>${Localization.t('investigation.phase.resolution')}</option>
                        </select>
                    </div>
                    <div class="status-selector">
                        <select class="case-badge status-${activeCase.status}" style="border:none; cursor:pointer;" onchange="InvestigationStore.updateCase({id: '${activeCase.id}', status: this.value})">
                            <option value="open" ${activeCase.status === 'open' ? 'selected' : ''}>${Localization.t('investigation.status.open')}</option>
                            <option value="in_progress" ${activeCase.status === 'in_progress' ? 'selected' : ''}>${Localization.t('investigation.status.in_progress')}</option>
                            <option value="solved" ${activeCase.status === 'solved' ? 'selected' : ''}>${Localization.t('investigation.status.solved')}</option>
                            <option value="closed" ${activeCase.status === 'closed' ? 'selected' : ''}>${Localization.t('investigation.status.closed')}</option>
                        </select>
                    </div>
                </div>
            `;
        } else if (infoContainer) {
            infoContainer.innerHTML = '';
        }

        if (typeof lucide !== 'undefined') lucide.createIcons();
    },



    renderActiveView: function (viewMode) {
        const contentContainer = document.getElementById('investigationContent');
        if (!contentContainer) return;

        switch (viewMode) {
            case 'dashboard':
                if (window.InvestigationDashboardView) {
                    InvestigationDashboardView.render(contentContainer);
                } else {
                    contentContainer.innerHTML = `<div class="placeholder-view">${Localization.t('investigation.placeholder.dashboard')}</div>`;
                }
                break;
            case 'matrix':
                if (window.InvestigationMatrixView) {
                    InvestigationMatrixView.render(contentContainer);
                } else {
                    contentContainer.innerHTML = `<div class="placeholder-view">${Localization.t('investigation.placeholder.matrix')}</div>`;
                }
                break;
            case 'mmo':
                if (window.InvestigationMMOView) {
                    InvestigationMMOView.render(contentContainer);
                } else {
                    contentContainer.innerHTML = `<div class="placeholder-view">${Localization.t('investigation.placeholder.crimeweb')}</div>`;
                }
                break;
            case 'registry':
                if (window.InvestigationRegistryView) {
                    InvestigationRegistryView.render(contentContainer);
                } else {
                    contentContainer.innerHTML = `<div class="placeholder-view">${Localization.t('investigation.placeholder.registry')}</div>`;
                }
                break;
            case 'timeline':
                if (window.InvestigationTimelineView) {
                    window.InvestigationTimelineView.render(contentContainer);
                } else if (typeof InvestigationTimelineView !== 'undefined') {
                    InvestigationTimelineView.render(contentContainer);
                } else {
                    contentContainer.innerHTML = `<div class="placeholder-view">${Localization.t('investigation.placeholder.timeline')}</div>`;
                }
                break;
            default:
                // Default to dashboard
                if (window.InvestigationDashboardView) {
                    InvestigationDashboardView.render(contentContainer);
                } else {
                    contentContainer.innerHTML = `<div>${Localization.t('investigation.error.unknown')}</div>`;
                }
        }
    },

    showHelp: function (context) {
        const content = {
            registry: {
                title: Localization.t('investigation.help.registry'),
                icon: 'files',
                text: Localization.t('investigation.registry.desc'),
                tips: [
                    Localization.t('investigation.registry.tip'),
                    Localization.t('investigation.matrix.propagation'),
                    Localization.t('investigation.matrix.empty.desc')
                ]
            },
            matrix: {
                title: Localization.t('investigation.help.matrix'),
                icon: 'grid-3x3',
                text: Localization.t('investigation.matrix.empty.desc'),
                tips: [
                    Localization.t('investigation.matrix.legend.knows'),
                    Localization.t('investigation.matrix.legend.suspicious'),
                    Localization.t('investigation.matrix.legend.misled')
                ]
            },
            'mmo': {
                title: Localization.t('investigation.help.mmo'),
                icon: 'network',
                text: Localization.t('investigation.placeholder.mmo'),
                tips: [
                    Localization.t('investigation.mmo.tip.motive'),
                    Localization.t('investigation.mmo.tip.means'),
                    Localization.t('investigation.mmo.tip.opportunity')
                ]
            }
        };

        const help = content[context];
        if (!help) return;

        const modalHtml = `
            <div class="help-overlay" onclick="this.remove()">
                <div class="help-modal" onclick="event.stopPropagation()">
                    <div class="help-modal-header">
                        <h3><i data-lucide="${help.icon}"></i> ${help.title}</h3>
                        <button class="modal-close" onclick="this.closest('.help-overlay').remove()">
                            <i data-lucide="x"></i>
                        </button>
                    </div>
                    <div class="help-modal-body">
                        <p>${help.text}</p>
                        <ul>
                            ${help.tips.map(tip => `<li>${tip}</li>`).join('')}
                        </ul>
                    </div>
                    <div class="help-modal-footer">
                        <button class="btn btn-primary" onclick="this.closest('.help-overlay').remove()">${Localization.t('common.got_it') || 'Ok'}</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
};

// Use the local object as the global one
window.InvestigationView = InvestigationView;

window.renderInvestigationBoard = function () {
    console.log('🕵️ renderInvestigationBoard called');
    const container = document.getElementById('editorView');
    if (container) {
        console.log('✅ Container #editorView found. Initializing Investigation View...');
        // Load saved data from project before rendering
        InvestigationStore.init();
        InvestigationView.render(container);
    } else {
        console.error('❌ Error: Container #editorView not found in DOM.');
        alert(Localization.t('investigation.error.editor_not_found'));
    }
};
